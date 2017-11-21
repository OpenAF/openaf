(function() {
    exports.testRESTServer = function() {
        var port = findRandomOpenPort();
        var hs = ow.loadServer().httpd.start(port);
        var myData = [];
    
        ow.loadObj();
        ow.server.httpd.route(hs, {
            "/rest": function(req) { 
                return ow.server.rest.replyData("/rest", req, myData);
            }
        });
    
        ow.obj.rest.jsonCreate("http://127.0.0.1:" + port + "/rest", {k:1}, { k: 1, v: 123 });
        ow.obj.rest.jsonCreate("http://127.0.0.1:" + port + "/rest", {k:2}, { k: 2, v: 456 });
        ow.obj.rest.jsonCreate("http://127.0.0.1:" + port + "/rest", {k:3}, { k: 3, v: 789 });
    
        ow.test.assert(myData, [{k:1, v:123},{k:2, v:456},{k:3, v:789}], "Problem with rest record creation (POST).");
        ow.test.assert(ow.obj.rest.jsonGet("http://127.0.0.1:" + port + "/rest", { k: 2 }), {k:2, v:456}, "Problem with rest record get (GET).");
    
        ow.obj.rest.jsonSet("http://127.0.0.1:" + port + "/rest", { k: 2 }, { k: 2, v: 666});
        ow.test.assert($from(myData).equals("k", 2).first().v, 666, "Problem with rest record set (PUT).");
    
        ow.obj.rest.jsonRemove("http://127.0.0.1:" + port + "/rest", { k: 2});
        ow.test.assert($from(myData).equals("k", 2).none(), true, "Problem with rest record remove (DELETE).");
    
        ow.server.httpd.stop(hs);
    };

    exports.testHTTPServer = function() {
        ow.loadServer();
        var hs1 = ow.server.httpd.start(18081);
        var hs2 = ow.server.httpd.start(18082);
    
        ow.server.httpd.route(hs1, 
            { "/normal": function(req) { return hs1.replyOKText("normal 1"); } }, 
            function(req) { return hs1.replyOKText("I am 1"); });
        ow.server.httpd.route(hs2, 
            { "/normal": function(req) { return hs1.replyOKText("normal 2"); } }, 
            function(req) { return hs1.replyOKText("I am 2"); });
    
        plugin("HTTP");
        ow.test.assert(
            (new HTTP()).get("http://127.0.0.1:18081").response,
            "I am 1",
            "Problem with server 1 on default response"
        );
        ow.test.assert(
            (new HTTP()).get("http://127.0.0.1:18082").response,
            "I am 2",
            "Problem with server 2 on default response"
        );
        ow.test.assert(
            (new HTTP()).get("http://127.0.0.1:18081/normal").response,
            "normal 1",
            "Problem with server 1 on /normal response"
        );
        ow.test.assert(
            (new HTTP()).get("http://127.0.0.1:18082/normal").response,
            "normal 2",
            "Problem with server 2 on /normal response"
        );
    
        ow.server.httpd.stop(hs1);
        ow.server.httpd.stop(hs2);
    };
})();