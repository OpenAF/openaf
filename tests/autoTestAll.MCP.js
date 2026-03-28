// Copyright 2023 Nuno Aguiar

(function() {
    var withOAuthMCPServer = function(testFn) {
        ow.loadServer();

        var port = findRandomOpenPort();
        var hs = ow.server.httpd.start(port, "127.0.0.1");
        var state = {
            tokenRequests: [],
            authorizeRequests: [],
            mcpAuthHeaders: []
        };
        var issuer = "http://127.0.0.1:" + port + "/as";
        var resource = "http://127.0.0.1:" + port + "/mcp";

        ow.server.httpd.route(hs, {
            "/.well-known/oauth-protected-resource/mcp": function(req) {
                return ow.server.httpd.reply({
                    resource: resource,
                    authorization_servers: [ issuer ]
                }, 200, "application/json", {});
            },
            "/.well-known/oauth-authorization-server/as": function(req) {
                return ow.server.httpd.reply({
                    issuer: issuer,
                    authorization_endpoint: issuer + "/authorize",
                    token_endpoint: issuer + "/token"
                }, 200, "application/json", {});
            },
            "/as/authorize": function(req) {
                state.authorizeRequests.push(req.params);
                return ow.server.httpd.reply("ok", 200, "text/plain", {});
            },
            "/as/token": function(req) {
                var body = (isDef(req.files) && isDef(req.files.postData)) ? req.files.postData : req.data;
                var params = isMap(req.params) ? clone(req.params) : {};
                if (isString(body) && body.length > 0) params = merge(params, ow.server.rest.parseQuery(body));
                state.tokenRequests.push(params);
                return ow.server.httpd.reply({
                    access_token: "token-" + state.tokenRequests.length,
                    token_type: "Bearer",
                    expires_in: 3600
                }, 200, "application/json", {});
            },
            "/mcp": function(req) {
                state.mcpAuthHeaders.push(req.header.authorization);

                var body = (isDef(req.files) && isDef(req.files.postData)) ? req.files.postData : req.data;
                var rpc = jsonParse(body);
                var isNotification = isUnDef(rpc.id) || isNull(rpc.id);
                var result;

                switch(rpc.method) {
                case "initialize":
                    result = {
                        protocolVersion: "2024-11-05",
                        capabilities: {},
                        serverInfo: { name: "OAuth MCP", version: "1.0.0" }
                    };
                    break;
                case "notifications/initialized":
                    return ow.server.httpd.reply("", 204, "text/plain", {});
                case "tools/list":
                    result = {
                        tools: [
                            {
                                name: "ping",
                                description: "Ping tool",
                                inputSchema: { type: "object", properties: {} }
                            }
                        ]
                    };
                    break;
                case "tools/call":
                    result = {
                        content: [{ type: "text", text: "pong" }],
                        isError: false
                    };
                    break;
                default:
                    result = {};
                }

                if (isNotification) return ow.server.httpd.reply("", 204, "text/plain", {});

                var responseHeaders = {};
                if (rpc.method == "initialize") responseHeaders["mcp-session-id"] = "test-session-1";

                return ow.server.httpd.reply({
                    jsonrpc: "2.0",
                    result: result,
                    id: rpc.id
                }, 200, "application/json", responseHeaders);
            }
        });

        try {
            testFn({
                port: port,
                hs: hs,
                issuer: issuer,
                resource: resource,
                state: state
            });
        } finally {
            ow.server.httpd.stop(hs);
        }
    };

    exports.testOAuthDiscoveryClientCredentials = function() {
        withOAuthMCPServer(function(ctx) {
            var client = $mcp({
                type: "remote",
                url: ctx.resource,
                auth: {
                    type: "oauth2",
                    grantType: "client_credentials",
                    clientId: "client-a",
                    clientSecret: "secret-a"
                }
            });

            try {
                client.initialize();
                var tools = client.listTools();
                ow.test.assert(tools.tools[0].name, "ping", "Discovered MCP OAuth client should list tools.");
                ow.test.assert(ctx.state.tokenRequests.length > 0, true, "OAuth token endpoint should be called.");
                ow.test.assert(ctx.state.tokenRequests[0].resource, ctx.resource, "OAuth token request should include the MCP resource.");
                ow.test.assert(ctx.state.tokenRequests[0].grant_type, "client_credentials", "OAuth token request should preserve client_credentials grant.");
                ow.test.assert(ctx.state.mcpAuthHeaders[0], "Bearer token-1", "MCP request should include the discovered bearer token.");
            } finally {
                client.destroy();
            }
        });
    };

    exports.testOAuthAuthorizationCodeBuildsAuthorizationURL = function() {
        withOAuthMCPServer(function(ctx) {
            var capturedURL;
            var client = $mcp({
                type: "remote",
                url: ctx.resource,
                auth: {
                    type: "oauth2",
                    grantType: "authorization_code",
                    clientId: "public-client",
                    redirectURI: "http://127.0.0.1/callback",
                    promptForCode: false,
                    disableOpenBrowser: true,
                    onAuthorizationURL: function(url) { capturedURL = url; }
                }
            });

            try {
                var failed = false;
                try {
                    client.initialize();
                } catch(e) {
                    failed = String(e).indexOf("authorization code required") >= 0;
                }

                ow.test.assert(failed, true, "Authorization code flow without a code should stop after building the authorization URL.");
                ow.test.assert(isDef(capturedURL), true, "Authorization URL callback should receive the generated URL.");
                ow.test.assert(capturedURL.indexOf(ctx.issuer + "/authorize") == 0, true, "Authorization URL should come from discovered metadata.");
                ow.test.assert(capturedURL.indexOf("resource=" + encodeURIComponent(ctx.resource)) >= 0, true, "Authorization URL should include the MCP resource parameter.");
                ow.test.assert(capturedURL.indexOf("code_challenge=") >= 0, true, "Authorization URL should include a PKCE code challenge.");
                ow.test.assert(capturedURL.indexOf("code_challenge_method=S256") >= 0, true, "Authorization URL should use S256 PKCE.");
            } finally {
                client.destroy();
            }
        });
    };

    exports.testOAuthAuthorizationCodeTokenExchange = function() {
        withOAuthMCPServer(function(ctx) {
            var client = $mcp({
                type: "remote",
                url: ctx.resource,
                auth: {
                    type: "oauth2",
                    grantType: "authorization_code",
                    clientId: "public-client",
                    redirectURI: "http://127.0.0.1/callback",
                    authorizationCode: "auth-code-123",
                    disableOpenBrowser: true
                }
            });

            try {
                client.initialize();
                var res = client.callTool("ping", {});
                ow.test.assert(res.content[0].text, "pong", "Authorization code flow should authenticate the MCP call.");
                ow.test.assert(ctx.state.tokenRequests.length > 0, true, "Authorization code flow should exchange the code for a token.");
                ow.test.assert(ctx.state.tokenRequests[0].grant_type, "authorization_code", "Authorization code grant should be used.");
                ow.test.assert(ctx.state.tokenRequests[0].resource, ctx.resource, "Authorization code token exchange should include the MCP resource.");
                ow.test.assert(isDef(ctx.state.tokenRequests[0].code_verifier), true, "Authorization code token exchange should include a PKCE verifier.");
                ow.test.assert(ctx.state.tokenRequests[0].code, "auth-code-123", "Authorization code token exchange should use the provided authorization code.");
                ow.test.assert(ctx.state.mcpAuthHeaders[0], "Bearer token-1", "Authorization code flow should send the bearer token to the MCP server.");
            } finally {
                client.destroy();
            }
        });
    };

    exports.testGetClientInfoIncludesJSONRPCMCPData = function() {
        withOAuthMCPServer(function(ctx) {
            var client = $mcp({
                type: "remote",
                strict: false,
                url: ctx.resource,
                auth: {
                    type: "oauth2",
                    grantType: "client_credentials",
                    clientId: "client-a",
                    clientSecret: "secret-a"
                }
            });

            try {
                client.initialize({ name: "TestClient", version: "9.9.9" });
                var info = client.getClientInfo();

                ow.test.assert(info.lastRequest.method, "initialize", "getClientInfo should include the last JSON-RPC method.");
                ow.test.assert(info.lastRequest.params.protocolVersion, "2024-11-05", "getClientInfo should include initialize protocolVersion.");
                ow.test.assert(info.lastRequest.params.clientInfo.name, "TestClient", "getClientInfo should include sent clientInfo.");
                ow.test.assert(info.lastResponse.jsonrpc, "2.0", "getClientInfo should include raw JSON-RPC response envelope.");
                ow.test.assert(info.lastResponse.result.serverInfo.name, "OAuth MCP", "getClientInfo should include JSON-RPC result data.");
                ow.test.assert(info.session.mcpSessionId, "test-session-1", "getClientInfo should include captured MCP session id.");
                ow.test.assert(info.initialize.protocolVersion, "2024-11-05", "getClientInfo should include initialize result data.");
            } finally {
                client.destroy();
            }
        });
    };
})();
