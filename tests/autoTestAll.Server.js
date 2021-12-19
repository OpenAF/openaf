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

    exports.testRESTServer2 = function() {
        ow.loadServer();
        ow.loadObj();

        var port = findRandomOpenPort();
        var hs = ow.loadServer().httpd.start(port);

        var met = "";
        var res = {};

        ow.server.httpd.route(hs, {
            "/rest": function(req) {
                return ow.server.rest.reply("/rest", req, 
                    function(i,d,r) { 
                        met = r.method; // POST
                        return merge(i,d);
                    },
                    function(i,r) { 
                        met = r.method; // GET
                        return i; 
                    },
                    function(i,d,r) { 
                        met = r.method; // PUT
                        return merge(i,d); 
                    },
                    function(i,r) { 
                        met = r.method; // DELETE
                        return i; 
                    }       
                );
            }
        });

        var rr = {};
        rr = ow.obj.rest.jsonCreate("http://127.0.0.1:" + port + "/rest", { i: 1 }, { d: 2 });
        ow.test.assert(met, "POST", "Problem with REST server request variable on POST request");
        ow.test.assert(rr, { i: 1, d: 2 }, "Problem with REST server return data on POST");

        rr = ow.obj.rest.jsonGet("http://127.0.0.1:" + port + "/rest", { i: 1 });
        ow.test.assert(met, "GET", "Problem with REST server request variable on GET request");
        ow.test.assert(rr, { i: 1 }, "Problem with REST server return data on GET");

        rr = ow.obj.rest.jsonSet("http://127.0.0.1:" + port + "/rest", { i: 1 }, { d: 2 });
        ow.test.assert(met, "PUT", "Problem with REST server request variable on PUT request");
        ow.test.assert(rr, { i: 1, d: 2 }, "Problem with REST server return data on PUT");

        rr = ow.obj.rest.jsonRemove("http://127.0.0.1:" + port + "/rest", { i: 1 });
        ow.test.assert(met, "DELETE", "Problem with REST server request variable on DELETE request");
        ow.test.assert(rr, { i: 1 }, "Problem with REST server return data on DELETE");

        ow.server.httpd.stop(hs);
    };

    exports.testAuth = function() {
        ow.loadServer();
        
        var auth = new ow.server.auth();
        auth.add("user1", "pass1");
        var fa2 = af.create2FACredentials();
        auth.add("user2", "pass2", fa2.encryptedKey);

        auth.saveFile("autoTestAll.auth.db");

        var auth2 = new ow.server.auth();
        auth2.loadFile("autoTestAll.auth.db");

        ow.test.assert(auth.isLocked("user1"), false, "Problem accessing info for user1");
        ow.test.assert(auth.isLocked("user2"), false, "Problem accessing info for user2");
        ow.test.assert(auth.is2FA("user1"), false, "Problem accessing 2FA info for user1");
        ow.test.assert(auth.is2FA("user2"), true, "Problem accessing 2FA info for user2");

        ow.test.assert(auth2.check("user1", "pass1"), true, "Problem with checking password for user1");
        ow.test.assert(auth2.check("user2", "pass2" + af.get2FAToken(fa2.encryptedKey)), true, "Problem with checking password + token for user2");

        auth2.setLockTimeout(3);
        auth2.setTriesToLock(3);
        auth2.check("user1", "wrong"); auth2.check("user1", "wrong"); auth2.check("user1", "wrong"); 
        ow.test.assert(auth2.isLocked("user1"), true, "Problem with locking user1");
        ow.test.assert(auth2.isLocked("user2"), false, "Problem with checking lock for user2");
        sleep(3000);
        ow.test.assert(auth2.isLocked("user1"), false, "Problem with checking locking user1 after waiting for timeout");
        ow.test.assert(auth2.isLocked("user2"), false, "Problem with checking lock for user2 after waiting for timeout");

        auth2.check("user2", "wrong"); auth2.check("user2", "wrong"); auth2.check("user2", "wrong"); 
        ow.test.assert(auth2.isLocked("user2"), true, "Problem with locking user2");
        ow.test.assert(auth2.isLocked("user1"), false, "Problem with checking lock for user1");
        sleep(3000);
        ow.test.assert(auth2.isLocked("user2"), false, "Problem with checking locking user2 after waiting for timeout");
        ow.test.assert(auth2.isLocked("user1"), false, "Problem with checking lock for user1 after waiting for timeout");

        auth2.setCustomFunction((u, p) => {
            if (p == "nopass") return true; else return false;
        });

        ow.test.assert(auth2.check("user1", "pass1"), false, "Problem with custom authentication function with wrong password.");
        ow.test.assert(auth2.check("user1", "nopass"), true, "Problem with custom authentication function with correct password.");

        io.rm("autoTestAll.auth.db");
    };

    exports.testAuthApp = function() {
        ow.loadServer();

        ow.test.assert(
            ow.server.authAppCheck(
                "Password12345678", 
                ow.server.authAppGen(
                    "Password12345678", 
                    "12345678Password", 
                    "7A8A70AA022BC488D7A294A0F402D8FB14F915F4C2A45E649BA1D54AB2A2551C4566873ACF928D78C124EB4E29C4514B"
                ),
                "12345678Password", 
                "7A8A70AA022BC488D7A294A0F402D8FB14F915F4C2A45E649BA1D54AB2A2551C4566873ACF928D78C124EB4E29C4514B"
            ),
            true,
            "Problem with AuthApp without bcrypt."
        );
        ow.test.assert(
            ow.server.authAppCheck(
                "Password12345678", 
                ow.server.authAppGen(
                    "Password12345678", 
                    "12345678Password", 
                    "7A8A70AA022BC488D7A294A0F402D8FB14F915F4C2A45E649BA1D54AB2A2551C4566873ACF928D78C124EB4E29C4514B",
                    10
                ),
                "12345678Password", 
                "7A8A70AA022BC488D7A294A0F402D8FB14F915F4C2A45E649BA1D54AB2A2551C4566873ACF928D78C124EB4E29C4514B",
                true
            ),
            true,
            "Problem with AuthApp with bcrypt."
        );        
    };

    exports.testScheduler = function() {
        sync(() => {
            var a = $atomic(), b = $atomic(), c = $atomic();

            var sch = new ow.loadServer().scheduler();
    
            sch.addEntry("*/5 * * * * *", function() {
                if (c.get() > 0 && c.get() <= 10) a.inc()
                //log("A = " + a);
            });
    
            sch.addEntry("*/2 * * * * *", function() {
                if (c.get() > 0 && c.get() <= 10) b.inc()
                //log("B = " + b);
            });
    
            sch.addEntry("*/1 * * * * *", function() {
                c.inc(); 
                //log("C = " + c);
            });
    
            sleep(15000, true);
            sch.stop();
    
            ow.test.assert(c.get() >= 10, true, "Problem scheduling an every second function.");
            ow.test.assert(a.get(), 2, "Problem scheduling an every 5 seconds function.");
            ow.test.assert(4 <= b.get() <= 6, true, "Problem scheduling an every 2 seconds function.");
        });
    };

    exports.testLocks = function() {
        ow.loadServer();
        var l = new ow.server.locks(true);

        l.lock("test");

        var it = now();
        var of = now();
        var p = $do(() => {
            l.whenUnLocked("test", function() {
                of = now();
            }, 1000, 5);
        });
        l.lock("test", 1000, 1);
        l.unlock("test");
        $doWait(p);

        ow.test.assert(of - it >= 1000, true, "Problem with local locks.");
        l.clear("test");
    };

    exports.testHTTPServer = function() {
        ow.loadServer();
        var hs1 = ow.server.httpd.start(18081);
        var hs2 = ow.server.httpd.start(18082);
    
        ow.loadObj();
        var h = new ow.obj.http();
        var test = false;
        try {
            h.get("http://127.0.0.1:18081");
            test = false;
        } catch(e) {
            if (h.responseCode() == 401) test = true;
        }

        ow.test.assert(test, true, "Unexpected reply from server 1 without routes");

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
    
        ow.server.httpd.resetRoutes(hs1);
        h = new ow.obj.http();
        test = false;
        try {
            h.get("http://127.0.0.1:18081");
            test = false;
        } catch(e) {
            if (h.responseCode() == 401) test = true;
        }

        ow.test.assert(test, true, "Unexpected reply from server 1 after routes reset");

        ow.server.httpd.stop(hs1);
        ow.server.httpd.stop(hs2);
    };

    exports.testQueue = function() {
        ow.loadServer();
        var q = new ow.server.queue({ t: "q" }, "test");

        // Consumer function
        var o = () => { 
            try { 
                var ar = [], res; 
                do { 
                    res = q.receive(void 0, 50); 
                    if(isDef(res)) ar.push(res);
                } while(isDef(res)); 
                return ar;
            } catch(e) { 
                sprintErr(e);
            } 
        };

        // Producing dummy entries
        for(var oo = 1; oo <= 500; oo++) {  q.send({ x: oo, y: -oo }); }

        ow.test.assert(q.size(), 500, "Problem adding entries to queue.");

        // Executing 4 queue consumers in parallel
        var a1 = [], a2 = [], a3= [], a4=[]; 
        $doWait($doAll([ 
            $do(() => { a1 = o(); }), 
            $do(() => { a2 = o(); }), 
            $do(() => { a3 = o(); }), 
            $do(() => { a4 = o(); }) 
        ])); 
        
        ow.test.assert(a1.length + a2.length + a3.length + a4.length, 500, "Problem with parallel queue consumers");

        // Producing dummy entries
        for(var oo = 1; oo <= 500; oo++) {  q.send({ x: oo, y: -oo }); }
        $ch("queue::test").set({ x: 1 }, { x: 1 });
        
        ow.test.assert(q.size(), 501, "Problem adding non-queue element to internal queue channel");
        q.purge();
        ow.test.assert(q.size(), 1, "Problem with queue purge.");
        $ch("queue::test").unset({ x: 1 });

        // Producing dummy entries
        for(var oo = 1; oo <= 500; oo++) {  q.send({ x: oo, y: -oo }); }

        var res1 = q.receive(500);
        ow.test.assert(q.size(), 500, "Problem with queue receiver with visibility timeout.");
        sleep(501, true);
        var res2 = q.receive();
        q.delete(res2.idx);
        ow.test.assert(q.size(), 499, "Problem with queue visibility timeout returning objects to the queue.");

        q.purge();
        q.send({ a: 1 });
        q.send({ a: 2 }, void 0, 100);
        q.send({ a: 3 });

        sleep(205, true);
        var res3;
        for(var ii = 0; ii < 3; ii++) { res3 = q.receive(void 0, 500); }
        ow.test.assert(res3, void 0, "Problem with queue TTL.");

        q.purge();
        q.send({ a: 1 });
        q.send({ a: 2 });
        q.send({ a: 3 });

        ow.test.assert(q.receive(500).obj, { a: 1 }, "Problem with simple visibility timeout (1).");
        var theObj = q.receive(500);
        ow.test.assert(theObj.obj, { a: 2 }, "Problem with simple visibility timeout (2).");
        q.increaseVisibility(theObj.idx, 1000);

        sleep(500, true);

        ow.test.assert(q.receive().obj, { a: 1 }, "Problem with simple visibility timeout (3).");
        ow.test.assert(q.receive().obj, { a: 3 }, "Problem with increase visibility timeout.");

        $ch("queue::test").destroy();
    };
})();