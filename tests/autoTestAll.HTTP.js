// Copyright 2023 Nuno Aguiar

(function() {
    exports.testHTTP = function() {
        plugin("HTTPServer");
        
        var port = findRandomOpenPort()
        log("Creating HTTP server on port " + port);
        var httpd = new HTTPd(port);
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
            httpd.add("/no-query", function(aReq) {
                if (isDef(aReq.params["NanoHttpd.QUERY_STRING"])) throw "Unexpected null query-string parameter on a request without a query string!";

                return httpd.replyOKJSON("ALLOK");
            });
        
            plugin("HTTP");
            log("Accessing HTTP server with HTTP client");
            var http = new HTTP("http://127.0.0.1:" + port + "?abc=123");
            if (http.getResponse().responseCode != 200 ||
                http.getResponse().response != "ALLOK")
                    throw "Failed to receive response from server correctly!";
        
            http = new HTTP("http://127.0.0.1:" + port + "/stream?abc=123");
            if (http.getResponse().responseCode != 200 ||
                http.getResponse().response != "ALLOK")
                    throw "Failed to receive response from the server correctly (for /stream)";

            http = new HTTP("http://127.0.0.1:" + port + "/no-query");
            if (http.getResponse().responseCode != 200 ||
                http.getResponse().response != "ALLOK")
                    throw "Failed to receive response from the server correctly (without a query string)";
        } catch(e) {
            throw e;
        } finally {
            httpd.stop();
        }
    };

    exports.testHTTPWSClient = function() {
        plugin("HTTP");
        var session; var output = [];
        var res = (new HTTP()).wsClient("ws://ws.kraken.com",
            function(aSession) { session = aSession; },
            function(aType, aPayload, aOffset, aLength) { if (aType == "text") output.push(aPayload); },
            function(aCause) { },
            function(aStatusCode, aReason) { });
        var msg = stringify({
            event: "subscribe",
            pair : [ "XBT/USD", "XBT/EUR" ],
            subscription: {
                name: "ticker"
            }
        })
        session.sendText(msg, {
            succeed: () => log("WebSocket message sent successfully"),
            fail   : (aCause) => log("WebSocket failed to send message: " + aCause)
        })
        //while(output.length < 1) { res.fut.get(); sleep(100, true); };
        res.fut.get(); sleep(1000, true);
        //session.stop();
        res.client.stop();
    
        ow.test.assert(isMap(jsonParse(output[0])), true, "Problem with testing websockets against ws.kraken.com (1)");    
        ow.test.assert(output.length > 1, true, "Problem with testing websockets against ws.kraken.com (2)");  
    };

    exports.testBasicAuth = function() {
        ow.loadObj();
        var res1 = ow.obj.rest.jsonGet("https://postman-echo.com/basic-auth", {}, "postman", "password");
        var res2 = ow.obj.rest.jsonGet("https://postman-echo.com/basic-auth", {}, "postman", "password");
        
        var h = new HTTP();
        h.login("postman", "password");
        var res3 = jsonParse(h.exec("https://postman-echo.com/basic-auth").response, false);

        ow.test.assert(res1.authenticated, true, "Problem with basic auth.");
        ow.test.assert(res2.authenticated, true, "Problem with a second basic auth.");
        ow.test.assert(res3.authenticated, true, "Problem with default basic auth.");
    };

    exports.testChangingUserAgent = function() {
        ow.loadObj();
        plugin("HTTP");

        var res1= ow.obj.rest.jsonGet("https://postman-echo.com/headers");
        ow.test.assert(res1.headers["user-agent"], __OpenAFUserAgent, "User agent using ow.obj.http is incorrect.");
        
        var h = new HTTP();
        var res2 = jsonParse(h.get("https://postman-echo.com/headers").response, false);
        ow.test.assert(res2.headers["user-agent"].startsWith(__OpenAFUserAgent), true, "User agent using HTTP plugin is incorrect.");

        // Changing user agent
        var old = __OpenAFUserAgent;
        __setUserAgent("OpenAF");

        var res3= ow.obj.rest.jsonGet("https://postman-echo.com/headers");
        ow.test.assert(res3.headers["user-agent"], __OpenAFUserAgent, "User agent using ow.obj.http, after change, is incorrect.");

        var h2 = new HTTP();
        var res4 = jsonParse(h2.get("https://postman-echo.com/headers", "", { "User-Agent": __OpenAFUserAgent }).response, false);
        ow.test.assert(res4.headers["user-agent"], __OpenAFUserAgent, "User agent using HTTP plugin, after change, is incorrect.");

        __setUserAgent(old);
    };

    exports.testHTTPPersistentQueryState = function() {
        plugin("HTTPServer");
        ["nwu", "nwu2"].forEach(function(impl) {
            var port = findRandomOpenPort();
            var httpd = new HTTPd(port, "127.0.0.1", __, __, __, __, 5000, impl);
            var received = new java.util.concurrent.LinkedBlockingQueue();
            var socket;
            try {
                httpd.add("/query-state", function(req) {
                    received.add(stringify(req.params, __, ""));
                    return httpd.replyOKJSON("OK");
                });
                socket = new java.net.Socket("127.0.0.1", port);
                socket.setSoTimeout(5000);
                var input = socket.getInputStream(), output = socket.getOutputStream();
                var request = function(suffix, body) {
                    var method = isDef(body) ? "POST" : "GET";
                    var headers = method + " /query-state" + suffix + " HTTP/1.1\r\nHost: localhost\r\nConnection: keep-alive\r\n";
                    if (isDef(body)) headers += "Content-Type: application/x-www-form-urlencoded\r\nContent-Length: " + body.length + "\r\n";
                    output.write(af.fromString2Bytes(headers + "\r\n" + (isDef(body) ? body : "")));
                    output.flush();
                    var response = "", byte;
                    while (!response.endsWith("\r\n\r\n") && (byte = input.read()) >= 0) response += String.fromCharCode(byte);
                    ow.test.assert(response.indexOf("HTTP/1.1 200"), 0, "Persistent request failed on " + impl);
                    var length = /content-length:\s*(\d+)/i.exec(response);
                    ow.test.assert(isNull(length), false, "Missing response length on " + impl);
                    for (var i = 0; i < Number(length[1]); i++) ow.test.assert(input.read() >= 0, true, "Truncated response");
                    var captured = received.poll(5, java.util.concurrent.TimeUnit.SECONDS);
                    ow.test.assert(isNull(captured), false, "Request handler did not run");
                    return jsonParse(String(captured));
                };
                var first = request("?abc=123");
                ow.test.assert(first.abc, "123", "Normal query parsing changed");
                ow.test.assert(first["NanoHttpd.QUERY_STRING"], "abc=123", "Raw query changed");
                ow.test.assert(request(""), {}, "Queryless request inherited previous parameters on " + impl);
                ow.test.assert(request("?")["NanoHttpd.QUERY_STRING"], "", "Explicit empty query changed");
                ow.test.assert(request(""), {}, "Queryless request inherited an empty query on " + impl);
                ow.test.assert(request("", "form=one").form, "one", "Form parsing changed");
                ow.test.assert(request(""), {}, "Queryless request inherited POST state on " + impl);
                ow.test.assert(request("?abc=456").abc, "456", "Subsequent query failed");
            } finally {
                if (isDef(socket)) socket.close();
                httpd.stop();
            }
        });
    };

})();