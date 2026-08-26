// Copyright 2025 Nuno Aguiar

(function() {
    exports.testLoadNet = function() {
        ow.loadNet();
    };

    exports.testGetDoHWithCustomServer = function() {
        ow.loadServer();

        var port = findRandomOpenPort();
        var request = {};
        var hs = ow.server.httpd.start(port, "127.0.0.1");
        ow.server.httpd.route(hs, {
            "/dns-query": function(req) {
                request = req;
                var answer = new Packages.org.xbill.DNS.Message();
                answer.addRecord(new Packages.org.xbill.DNS.ARecord(
                    Packages.org.xbill.DNS.Name.fromString("example.test."),
                    Packages.org.xbill.DNS.DClass.IN,
                    60,
                    java.net.InetAddress.getByName("192.0.2.1")
                ), Packages.org.xbill.DNS.Section.ANSWER);
                return ow.server.httpd.replyBytes(answer.toWire(), "application/dns-message", 200, {});
            }
        });

        try {
            var answer = ow.net.getDoH("example.test", "a", "http://127.0.0.1:" + port + "/dns-query");
            ow.test.assert(answer, [{ name: "example.test.", type: 1, TTL: 60, data: "192.0.2.1" }], "Problem using a custom DNS over HTTPS server.");
            ow.test.assert(isString(request.params.dns), true, "Problem passing the DNS query to a custom DNS over HTTPS server.");
            ow.test.assert(request.header.accept, "application/dns-message", "Problem requesting the DNS wire response from a custom DNS over HTTPS server.");
        } finally {
            ow.server.httpd.stop(hs);
        }
    };

    exports.testGetActualTimeDefault = function() {
        var time = ow.net.getActualTime();
        ow.test.assert(isDate(time), true, "Problem with default getActualTime - should return a Date");
        ow.test.assert(!isNaN(time.getTime()), true, "Problem with default getActualTime - should return a valid Date");

        // Check that the time is reasonably close to system time (within 1 hour)
        var diff = Math.abs(time.getTime() - new Date().getTime());
        ow.test.assert(diff < 3600000, true, "Problem with default getActualTime - time differs too much from system time (diff: " + diff + "ms)");
    };

    exports.testGetActualTimeWithServer = function() {
        var time = ow.net.getActualTime("pool.ntp.org");
        ow.test.assert(isDate(time), true, "Problem with getActualTime with specific server - should return a Date");
        ow.test.assert(!isNaN(time.getTime()), true, "Problem with getActualTime with specific server - should return a valid Date");

        // Check that the time is reasonably close to system time (within 1 hour)
        var diff = Math.abs(time.getTime() - new Date().getTime());
        ow.test.assert(diff < 3600000, true, "Problem with getActualTime with specific server - time differs too much from system time (diff: " + diff + "ms)");
    };

    exports.testGetActualTimeWithTimeout = function() {
        var time = ow.net.getActualTime(__, 3000);
        ow.test.assert(isDate(time), true, "Problem with getActualTime with custom timeout - should return a Date");
        ow.test.assert(!isNaN(time.getTime()), true, "Problem with getActualTime with custom timeout - should return a valid Date");

        // Check that the time is reasonably close to system time (within 1 hour)
        var diff = Math.abs(time.getTime() - new Date().getTime());
        ow.test.assert(diff < 3600000, true, "Problem with getActualTime with custom timeout - time differs too much from system time (diff: " + diff + "ms)");
    };

    exports.testGetActualTimeServerAndTimeout = function() {
        var time = ow.net.getActualTime("time.google.com", 3000);
        ow.test.assert(isDate(time), true, "Problem with getActualTime with server and timeout - should return a Date");
        ow.test.assert(!isNaN(time.getTime()), true, "Problem with getActualTime with server and timeout - should return a valid Date");

        // Check that the time is reasonably close to system time (within 1 hour)
        var diff = Math.abs(time.getTime() - new Date().getTime());
        ow.test.assert(diff < 3600000, true, "Problem with getActualTime with server and timeout - time differs too much from system time (diff: " + diff + "ms)");
    };
})();
