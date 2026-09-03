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
                        protocolVersion: "2025-06-18",
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
                ow.test.assert(info.lastRequest.params.protocolVersion, "2025-06-18", "getClientInfo should include initialize protocolVersion.");
                ow.test.assert(info.lastRequest.params.clientInfo.name, "TestClient", "getClientInfo should include sent clientInfo.");
                ow.test.assert(info.lastResponse.jsonrpc, "2.0", "getClientInfo should include raw JSON-RPC response envelope.");
                ow.test.assert(info.lastResponse.result.serverInfo.name, "OAuth MCP", "getClientInfo should include JSON-RPC result data.");
                ow.test.assert(info.session.mcpSessionId, "test-session-1", "getClientInfo should include captured MCP session id.");
                ow.test.assert(info.initialize.protocolVersion, "2025-06-18", "getClientInfo should include initialize result data.");
            } finally {
                client.destroy();
            }
        });
    };

    exports.testRemoteMCPClosesRequestHTTPClients = function() {
        withOAuthMCPServer(function(ctx) {
            var originalFactory = ow.obj.rest.connectionFactory;
            var clients = [];
            var client;
            var destroyed = false;

            ow.obj.rest.connectionFactory = function() {
                var http = originalFactory();
                var originalClose = http.close;
                http.close = function() {
                    clients.push(http);
                    return originalClose.apply(http, arguments);
                };
                return http;
            };

            try {
                client = $mcp({ type: "remote", strict: false, url: ctx.resource });
                client.initialize({ name: "TestClient", version: "9.9.9" });
                client.destroy();
                destroyed = true;
                ow.test.assert(clients.length, 2, "Remote MCP should close both the request and session DELETE HTTP clients.");
            } finally {
                ow.obj.rest.connectionFactory = originalFactory;
                if (isDef(client) && !destroyed) client.destroy();
            }
        });
    };

    // Dual-era HTTP MCP server fixture: exercises the real ow.server.httpd.replyJSONRPC(..., {modern:true})
    // code path added for the 2026-07-28 protocol era, side-by-side with the legacy initialize handshake.
    var withDualEraMCPServer = function(testFn) {
        ow.loadServer();

        var port = findRandomOpenPort();
        var hs = ow.server.httpd.start(port, "127.0.0.1");
        var description = {
            serverInfo: { name: "Dual-Era MCP", version: "1.0.0" },
            capabilities: { tools: { listChanged: false } }
        };
        var rpcFns = {
            initialize: params => merge({ protocolVersion: "2025-06-18" }, description),
            "notifications/initialized": () => ({}),
            "tools/list": () => ({ tools: [{ name: "ping", description: "Ping tool", inputSchema: { type: "object", properties: {} } }] }),
            "tools/call": params => ({ content: [{ type: "text", text: "pong" }], isError: false }),
            "server/discover": () => ow.server.mcp.discoverResult(description)
        };

        ow.server.httpd.route(hs, {
            "/mcp": req => ow.server.httpd.replyJSONRPC(hs, req, rpcFns, function() {}, function() {}, { modern: true, serverInfo: description.serverInfo })
        });

        try {
            testFn({ port: port, hs: hs, url: "http://127.0.0.1:" + port + "/mcp" });
        } finally {
            ow.server.httpd.stop(hs);
        }
    };

    exports.testMCPAutoClientNegotiatesModernEraWithDualEraServer = function() {
        withDualEraMCPServer(function(ctx) {
            var client = $mcp({ type: "remote", strict: false, url: ctx.url, protocolVersion: "auto" });
            try {
                client.initialize({ name: "TestClient", version: "9.9.9" });
                ow.test.assert(client.getClientInfo().era, "modern", "protocolVersion:'auto' should negotiate the modern era against a dual-era server.");

                var tools = client.listTools();
                ow.test.assert(tools.tools[0].name, "ping", "Modern-era client should still list tools normally.");
                ow.test.assert(tools.resultType, "complete", "Modern-era tools/list result should carry resultType.");
                ow.test.assert(isNumber(tools.ttlMs), true, "Modern-era tools/list result should carry ttlMs (CacheableResult).");
                ow.test.assert(isString(tools.cacheScope), true, "Modern-era tools/list result should carry cacheScope (CacheableResult).");

                var res = client.callTool("ping", {});
                ow.test.assert(res.content[0].text, "pong", "Modern-era callTool should still work.");
                ow.test.assert(res.resultType, "complete", "Modern-era tools/call result should carry resultType.");
            } finally {
                client.destroy();
            }
        });
    };

    exports.testMCPAutoClientFallsBackToLegacyServer = function() {
        withOAuthMCPServer(function(ctx) {
            // This fixture server (see withOAuthMCPServer above) has no server/discover method and answers
            // initialize with a fixed 2025-06-18, i.e. exactly the legacy-only server this task must not regress.
            var client = $mcp({ type: "remote", strict: false, url: ctx.resource, protocolVersion: "auto" });
            try {
                client.initialize({ name: "TestClient", version: "9.9.9" });
                ow.test.assert(client.getClientInfo().era, "legacy", "protocolVersion:'auto' should fall back to the legacy era against a legacy-only server.");

                var tools = client.listTools();
                ow.test.assert(tools.tools[0].name, "ping", "Legacy fallback should still list tools normally.");
                ow.test.assert(isUnDef(tools.resultType), true, "Legacy-era results must stay unwrapped (no resultType) -- zero behavior change.");
            } finally {
                client.destroy();
            }
        });
    };

    exports.testMCPLegacyClientUnaffectedByDualEraServer = function() {
        withDualEraMCPServer(function(ctx) {
            // A plain (non-"auto") client is the overwhelming majority case today: it must behave identically
            // whether or not the server it talks to has opted into modern-era support.
            var client = $mcp({ type: "remote", strict: false, url: ctx.url });
            try {
                client.initialize({ name: "TestClient", version: "9.9.9" });
                ow.test.assert(client.getClientInfo().era, "legacy", "Default client should stay on the legacy era even against a dual-era server.");

                var tools = client.listTools();
                ow.test.assert(tools.tools[0].name, "ping", "Legacy client should list tools normally against a dual-era server.");
                ow.test.assert(isUnDef(tools.resultType), true, "Legacy client's result must stay unwrapped against a dual-era server.");
            } finally {
                client.destroy();
            }
        });
    };

    exports.testMCPModernServerRejectsUnsupportedProtocolVersion = function() {
        withDualEraMCPServer(function(ctx) {
            var client = $mcp({ type: "remote", strict: false, url: ctx.url });
            try {
                var res = client.exec("tools/list", {
                    _meta: {
                        "io.modelcontextprotocol/protocolVersion": "1900-01-01",
                        "io.modelcontextprotocol/clientCapabilities": {}
                    }
                });
                ow.test.assert(isMap(res.error), true, "An unsupported modern protocol version should return a JSON-RPC error.");
                ow.test.assert(res.error.code, -32022, "Unsupported protocol version should use the reserved -32022 error code.");
                ow.test.assert(res.error.data.requested, "1900-01-01", "UnsupportedProtocolVersionError should echo the requested version.");
                ow.test.assert(res.error.data.supported.indexOf("2026-07-28") >= 0, true, "UnsupportedProtocolVersionError should list this server's supported versions.");
            } finally {
                client.destroy();
            }
        });
    };

    exports.testMCPServerDiscoverIsProbeableWithoutClientCapabilities = function() {
        withDualEraMCPServer(function(ctx) {
            // A client probing era support (per spec) may call server/discover before it knows what capabilities
            // to declare; server/discover must not itself require io.modelcontextprotocol/clientCapabilities.
            var client = $mcp({ type: "remote", strict: false, url: ctx.url });
            try {
                var res = client.exec("server/discover", {
                    _meta: { "io.modelcontextprotocol/protocolVersion": "2026-07-28" }
                });
                ow.test.assert(isDef(res.error), false, "A bare server/discover probe (no clientCapabilities yet) must not be rejected.");
                ow.test.assert(res.protocolVersions.indexOf("2026-07-28") >= 0, true, "server/discover should advertise the modern protocol version.");
            } finally {
                client.destroy();
            }
        });
    };

    exports.testOJobTplDescRendersAllToolMetadataStrings = function() {
        var tf = "ojob_mcp_tpldesc_" + genUUID() + ".yaml";

        io.writeFileYAML(tf, {
            jobs: [{
                name: "Ping",
                exec: "return { content: [{ type: 'text', text: 'pong' }], isError: false };"
            }],
            todo: [{
                fnsMeta: {
                    ping: {
                        name: "ping",
                        description: "Ping {{label}}",
                        annotations: {
                            title: "{{label}} Ping"
                        },
                        inputSchema: {
                            type: "object",
                            properties: {
                                value: {
                                    type: "string",
                                    description: "Value for {{label}}"
                                }
                            }
                        }
                    }
                },
                "fns ": {
                    ping: "Ping"
                }
            }]
        });

        var client = $mcp({
            type: "ojob",
            options: {
                job: tf,
                tplDesc: true,
                args: {
                    label: "Team wiki"
                }
            }
        });

        try {
            client.initialize();
            var tools = client.listTools();
            var ping = $from(tools.tools).equals("name", "ping").at(0);

            ow.test.assert(isDef(ping), true, "oJob MCP should expose the templated test tool.");
            ow.test.assert(ping.description, "Ping Team wiki", "tplDesc should render tool descriptions.");
            ow.test.assert(ping.annotations.title, "Team wiki Ping", "tplDesc should render non-description metadata strings.");
            ow.test.assert(ping.inputSchema.properties.value.description, "Value for Team wiki", "tplDesc should render nested metadata strings.");
        } finally {
            client.destroy();
            io.rm(tf);
        }
    };
})();
