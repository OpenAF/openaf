// Copyright 2023 Nuno Aguiar

(function() {
    exports.testRegistry = function() {
        ow.loadServer();

        // Test creating registry
        var registry = new ow.server.a2a();
        ow.test.assert(isDef(registry.registry), true, "A2A registry should be created");
        ow.test.assert(isMap(registry.registry), true, "A2A registry should be a map");

        // Test registering an agent
        var echoAgent = {
            id: "echo-agent",
            name: "Echo Agent",
            title: "Simple Echo Agent",
            version: "1.0.0",
            tags: ["test", "echo"],
            capabilities: { messaging: true }
        };

        var echoHandler = function(message, options, context) {
            return {
                content: [{ type: "text", text: "Echo: " + message }],
                isError: false
            };
        };

        registry.registerAgent(echoAgent, echoHandler);
        ow.test.assert(isDef(registry.registry["echo-agent"]), true, "Agent should be registered");
        ow.test.assert(registry.registry["echo-agent"].meta.id, "echo-agent", "Agent ID should match");

        // Test listing agents
        var agents = registry.listAgents();
        ow.test.assert(isArray(agents.agents), true, "listAgents should return array");
        ow.test.assert(agents.agents.length, 1, "Should have one agent");
        ow.test.assert(agents.agents[0].id, "echo-agent", "Agent ID should be echo-agent");

        // Test getting specific agent
        var agent = registry.getAgent("echo-agent");
        ow.test.assert(agent.id, "echo-agent", "getAgent should return correct agent");
        ow.test.assert(agent.name, "Echo Agent", "Agent name should match");

        // Test sending message
        var response = registry.send("echo-agent", "Hello");
        ow.test.assert(isMap(response), true, "Response should be a map");
        ow.test.assert(isArray(response.content), true, "Response should have content array");
        ow.test.assert(response.content[0].text, "Echo: Hello", "Response text should match");
        ow.test.assert(response.isError, false, "Response should not be error");

        // Test unregistering agent
        registry.unregisterAgent("echo-agent");
        ow.test.assert(isUnDef(registry.registry["echo-agent"]), true, "Agent should be unregistered");

        // Test error for unknown agent
        var errorResponse = registry.send("unknown-agent", "Hello");
        ow.test.assert(errorResponse.isError, true, "Unknown agent should return error");
    };

    exports.testServerStdio = function() {
        // Test that agents/* methods are available in MCP method map
        // This is a basic test - full stdio testing requires subprocess

        ow.loadServer();

        // Create registry and register an agent
        global.__a2a__ = new ow.server.a2a();
        global.__a2a__.registerAgent(
            { id: "test-agent", name: "Test Agent" },
            function(msg) {
                return { content: [{ type: "text", text: "Response: " + msg }], isError: false };
            }
        );

        // Simulate agents/list call
        var listResult = global.__a2a__.listAgents();
        ow.test.assert(isArray(listResult.agents), true, "agents/list should return agents array");
        ow.test.assert(listResult.agents.length, 1, "Should have one agent");

        // Simulate agents/get call
        var getResult = global.__a2a__.getAgent("test-agent");
        ow.test.assert(getResult.id, "test-agent", "agents/get should return correct agent");

        // Simulate agents/send call
        var sendResult = global.__a2a__.send("test-agent", "Hello");
        ow.test.assert(sendResult.content[0].text, "Response: Hello", "agents/send should return response");

        // Cleanup
        delete global.__a2a__;
    };

    exports.testClientDummy = function() {
        // Test A2A with dummy MCP client

        var dummyAgents = [
            {
                id: "agent-1",
                name: "Agent One",
                title: "First Test Agent",
                capabilities: { messaging: true }
            },
            {
                id: "agent-2",
                name: "Agent Two",
                handler: function(msg, opts) {
                    return { content: [{ type: "text", text: "Agent 2 says: " + msg }], isError: false };
                }
            }
        ];

        var client = $mcp({
            type: "dummy",
            options: {
                agents: dummyAgents
            }
        });

        client.initialize();

        // Test listAgents
        var agents = client.listAgents();
        ow.test.assert(isArray(agents.agents), true, "listAgents should return agents array");
        ow.test.assert(agents.agents.length, 2, "Should have two agents");

        // Test getAgent
        var agent = client.getAgent("agent-1");
        ow.test.assert(agent.id, "agent-1", "getAgent should return correct agent");
        ow.test.assert(agent.name, "Agent One", "Agent name should match");

        // Test sendToAgent with handler
        var response = client.sendToAgent("agent-2", "Hello");
        ow.test.assert(response.content[0].text, "Agent 2 says: Hello", "sendToAgent should use custom handler");

        // Test sendToAgent without handler (default echo)
        var response2 = client.sendToAgent("agent-1", "Test message");
        ow.test.assert(response2.content[0].text.indexOf("Echo:") >= 0, true, "Default handler should echo");

        client.destroy();
    };

    exports.testSendMessage = function() {
        ow.loadServer();

        var registry = new ow.server.a2a();

        // Register agent that processes different message types
        registry.registerAgent(
            { id: "processor", name: "Processor" },
            function(message, options, context) {
                var text = isString(message) ? message : stringify(message);
                return {
                    content: [{ type: "text", text: "Processed: " + text }],
                    isError: false
                };
            }
        );

        // Test with string message
        var r1 = registry.send("processor", "Hello World");
        ow.test.assert(r1.content[0].text, "Processed: Hello World", "String message should work");

        // Test with map message
        var r2 = registry.send("processor", { key: "value" });
        ow.test.assert(r2.content[0].text.indexOf("key") >= 0, true, "Map message should be stringified");

        // Test with options
        var r3 = registry.send("processor", "Test", { timeout: 5000 });
        ow.test.assert(r3.content[0].text, "Processed: Test", "Options should be passed");
    };

    exports.testAuth = function() {
        ow.loadServer();

        var registry = new ow.server.a2a();

        // Register agent with auth function
        registry.registerAgent(
            { id: "secure-agent", name: "Secure Agent" },
            function(message) {
                return { content: [{ type: "text", text: "Secret: " + message }], isError: false };
            },
            function(context) {
                // Only allow if context has authorized flag
                return isDef(context.authorized) && context.authorized === true;
            }
        );

        // Test unauthorized access
        var r1 = registry.send("secure-agent", "Hello", {}, { authorized: false });
        ow.test.assert(r1.isError, true, "Unauthorized access should fail");
        ow.test.assert(r1.content[0].text.indexOf("Unauthorized") >= 0, true, "Should return unauthorized message");

        // Test authorized access
        var r2 = registry.send("secure-agent", "Hello", {}, { authorized: true });
        ow.test.assert(r2.isError, false, "Authorized access should succeed");
        ow.test.assert(r2.content[0].text, "Secret: Hello", "Should return secret message");

        // Test with no auth context (should fail)
        var r3 = registry.send("secure-agent", "Hello");
        ow.test.assert(r3.isError, true, "No auth context should fail");
    };

    exports.testSizeLimits = function() {
        ow.loadServer();

        var registry = new ow.server.a2a();

        // Register agent with small size limit
        registry.registerAgent(
            { id: "limited-agent", name: "Limited Agent" },
            function(message) {
                return { content: [{ type: "text", text: "OK" }], isError: false };
            },
            __,
            { sizeLimit: 100 } // Only 100 bytes allowed
        );

        // Test message within limit
        var r1 = registry.send("limited-agent", "Small");
        ow.test.assert(r1.isError, false, "Small message should succeed");

        // Test message exceeding limit
        var largeMessage = repeat(200, "X");
        var r2 = registry.send("limited-agent", largeMessage);
        ow.test.assert(r2.isError, true, "Large message should fail");
        ow.test.assert(r2.content[0].text.indexOf("exceeds limit") >= 0, true, "Should mention size limit");
    };

    exports.testRateLimits = function() {
        ow.loadServer();

        var registry = new ow.server.a2a();

        // Register agent with rate limit
        registry.registerAgent(
            { id: "rate-limited-agent", name: "Rate Limited Agent" },
            function(message) {
                return { content: [{ type: "text", text: "OK" }], isError: false };
            },
            __,
            { rateLimit: 3 } // Only 3 requests per minute
        );

        // Send 3 requests (should all succeed)
        var r1 = registry.send("rate-limited-agent", "Msg 1");
        ow.test.assert(r1.isError, false, "First request should succeed");

        var r2 = registry.send("rate-limited-agent", "Msg 2");
        ow.test.assert(r2.isError, false, "Second request should succeed");

        var r3 = registry.send("rate-limited-agent", "Msg 3");
        ow.test.assert(r3.isError, false, "Third request should succeed");

        // Fourth request should fail (exceeds rate limit)
        var r4 = registry.send("rate-limited-agent", "Msg 4");
        ow.test.assert(r4.isError, true, "Fourth request should fail due to rate limit");
        ow.test.assert(r4.content[0].text.indexOf("Rate limit") >= 0, true, "Should mention rate limit");
    };
})();
