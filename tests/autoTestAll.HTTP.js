(function() {
    exports.testHTTP = function() {
        plugin("HTTPServer");
        
        log("Creating HTTP server on port 12345");
        var httpd = new HTTPd(12345);
        httpd.setDefault("/abc");
        httpd.add("/abc", function(aReq) {
            if(aReq.params.abc != 123) throw "Failed to receive data from client correctly!";
    
            return httpd.replyOKJSON("ALLOK");
        });
    
        plugin("HTTP");
        log("Accessing HTTP server with HTTP client");
        var http = new HTTP("http://127.0.0.1:12345?abc=123");
        if (http.getResponse().responseCode != 200 ||
            http.getResponse().response != "ALLOK")
                throw "Failed to receive response from server correctly!";
    
        httpd.stop();
    };

    exports.testHTTPWSClient = function() {
        plugin("HTTP");
        var session; var output = "";
        var client = (new HTTP()).wsConnect("ws://echo.websocket.org",
            function(aSession) { session = aSession; },
            function(aType, aPayload, aOffset, aLength) { if (aType == "text") output += aPayload; },
            function(aCause) { },
            function(aStatusCode, aReason) { });
        session.getRemote().sendString("Hello World!");
        while(output.length < 1) { sleep(100); };
        session.stop();
    
        ow.test.assert(output, "Hello World!", "Problem with testing websockets against echo.websocket.org");    
    };

    exports.testBasicAuth = function() {
        ow.loadObj();
        var res1 = ow.obj.rest.jsonGet("https://httpbin.org/basic-auth/admin/noadmin", {}, "admin", "noadmin");
        var res2 = ow.obj.rest.jsonGet("https://httpbin.org/basic-auth/admin/no2admin", {}, "admin", "no2admin");
        
        var h = new HTTP();
        h.login("admin", "noadminno");
        var res3 = jsonParse(h.exec("https://httpbin.org/basic-auth/admin/noadminno").response);

        ow.test.assert(res1.authenticated, true, "Problem with basic auth.");
        ow.test.assert(res2.authenticated, true, "Problem with a second basic auth.");
        ow.test.assert(res3.authenticated, true, "Problem with default basic auth.");
    }
})();