(function() {
    exports.testHTTP = function() {
        plugin("HTTPServer");
        
        log("Creating HTTP server on port 12345");
        var httpd = new HTTPd(12345);
        try {
            httpd.setDefault("/abc");
            httpd.add("/abc", function(aReq) {
                if(aReq.params.abc != 123) throw "Failed to receive data from client correctly!";
        
                return httpd.replyOKJSON("ALLOK");
            });
            httpd.add("/stream", function(aReq) {
                if (aReq.params.abc != 123) throw "Failed to received data from client correctly on /stream!";

                //return httpd.replyStream(af.fromString2OutputStream("ALLOK"), "text/plain", 200);
                return httpd.replyOKJSON("ALLOK");
            });
        
            plugin("HTTP");
            log("Accessing HTTP server with HTTP client");
            var http = new HTTP("http://127.0.0.1:12345?abc=123");
            if (http.getResponse().responseCode != 200 ||
                http.getResponse().response != "ALLOK")
                    throw "Failed to receive response from server correctly!";
        
            http = new HTTP("http://127.0.0.1:12345/stream?abc=123");
            if (http.getResponse().responseCode != 200 ||
                http.getResponse().response != "ALLOK")
                    throw "Failed to receive response from the server correctly (for /stream)";
        } catch(e) {
            throw e;
        } finally {
            httpd.stop();
        }
    };

    exports.testHTTPWSClient = function() {
        plugin("HTTP");
        var session; var output = "";
        var res = (new HTTP()).wsClient("ws://echo.websocket.org",
            function(aSession) { session = aSession; },
            function(aType, aPayload, aOffset, aLength) { if (aType == "text") output += aPayload; },
            function(aCause) { },
            function(aStatusCode, aReason) { });
        session.getRemote().sendString("Hello World!");
        while(output.length < 1) { res.fut.get(); sleep(100); };
        session.stop();
        res.client.stop();
    
        ow.test.assert(output, "Hello World!", "Problem with testing websockets against echo.websocket.org");    
    };

    exports.testBasicAuth = function() {
        ow.loadObj();
        var res1 = ow.obj.rest.jsonGet("https://httpbin.org/basic-auth/admin/noadmin", {}, "admin", "noadmin");
        var res2 = ow.obj.rest.jsonGet("https://httpbin.org/basic-auth/admin/no2admin", {}, "admin", "no2admin");
        
        var h = new HTTP();
        h.login("admin", "2noadminno");
        var res3 = jsonParse(h.exec("https://httpbin.org/basic-auth/admin/2noadminno").response, false);

        ow.test.assert(res1.authenticated, true, "Problem with basic auth.");
        ow.test.assert(res2.authenticated, true, "Problem with a second basic auth.");
        ow.test.assert(res3.authenticated, true, "Problem with default basic auth.");
    };

    exports.testChangingUserAgent = function() {
        ow.loadObj();
        plugin("HTTP");

        var res1= ow.obj.rest.jsonGet("https://httpbin.org/headers");
        ow.test.assert(res1.headers["User-Agent"], __OpenAFUserAgent, "User agent using ow.obj.http is incorrect.");
        
        var h = new HTTP();
        var res2 = jsonParse(h.get("https://httpbin.org/headers").response, false);
        ow.test.assert(res2.headers["User-Agent"].startsWith(__OpenAFUserAgent), true, "User agent using HTTP plugin is incorrect.");

        // Changing user agent
        var old = __OpenAFUserAgent;
        __setUserAgent("OpenAF");

        var res3= ow.obj.rest.jsonGet("https://httpbin.org/headers");
        ow.test.assert(res3.headers["User-Agent"], __OpenAFUserAgent, "User agent using ow.obj.http, after change, is incorrect.");

        var h2 = new HTTP();
        var res4 = jsonParse(h2.get("https://httpbin.org/headers", "", { "User-Agent": __OpenAFUserAgent }).response, false);
        ow.test.assert(res4.headers["User-Agent"], __OpenAFUserAgent, "User agent using HTTP plugin, after change, is incorrect.");

        __setUserAgent(old);
    };
})();