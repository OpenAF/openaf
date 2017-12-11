(function() {
    this.chType = "big";

    exports.testCreateChannel = function() {
        $ch(this.chType).create(true, this.chType);
        $ch(this.chType).size();
    };

    exports.testSettingData = function() {
        var l = listFilesRecursive(".");
        $ch(this.chType).setAll(["filepath"], l);
        ow.test.assert(l.length, $ch(this.chType).size(), "Channel didn't store all values.");
    };

    exports.testDestroyChannel = function() {
        $ch(this.chType).destroy();
    };

    exports.testAuditLog = function() {
        var port = findRandomOpenPort();
        var chName = "__test_" + port;

        $ch(chName).create();
        $ch(chName).expose(port, undefined, () => { return true; });

        var opsAudit = [];

        ow.ch.server.setLog((aMap) => {
            opsAudit.push({ o: aMap.op, c: aMap.name, u: aMap.request.user, p: aMap.request.channelPermission });
        });

        $ch("remote" + chName).createRemote("http://abc:123@127.0.0.1:" + port + "/" + chName);
        $ch("remote" + chName).size();
        $ch("remote" + chName).set(1,1);
        $ch("remote" + chName).unset(1);

        ow.test.assert($from(opsAudit).equals("o", "AUTH_OK").equals("c", chName).equals("u", "abc").any(), true, "Problem with auditing remote channel access authentication.");
        ow.test.assert($from(opsAudit).equals("o", "GET").equals("c", chName).equals("u", "abc").equals("p", "rw").any(), true, "Problem with auditing remote channel get rest operation.");        
        ow.test.assert($from(opsAudit).equals("o", "SET").equals("c", chName).equals("u", "abc").equals("p", "rw").any(), true, "Problem with auditing remote channel set rest operation.");                
        ow.test.assert($from(opsAudit).equals("o", "REMOVE").equals("c", chName).equals("u", "abc").equals("p", "rw").any(), true, "Problem with auditing remote channel remove rest operation.");                        

        $ch(chName).destroy();
    };

    exports.testHousekeeping = function() {
        $ch(this.chType + "HK").destroy();
        $ch(this.chType + "HK").create();
        $ch(this.chType + "HK").subscribe(ow.ch.utils.getHousekeepSubscriber(this.chType + "HK", 3));

        for(var i = 0; i < 10; i++) {
            $ch(this.chType + "HK").set(i, i);
        }

        while($ch(this.chType + "HK").size() > 3) {
            sleep(1000);
        }
        $ch(this.chType + "HK").waitForJobs(30000);
        ow.test.assert($ch(this.chType + "HK").size(), 3, "Housekeep subscriber didn't remove all values in time.");

        for(var i = 10; i < 20; i++) {
            $ch(this.chType + "HK").set(i, i);
        }
        
        while($ch(this.chType + "HK").size() > 3) {
            sleep(1000);
        }
        $ch(this.chType + "HK").waitForJobs(30000);
        ow.test.assert($ch(this.chType + "HK").size(), 3, "Housekeep subscriber didn't remove all values after setting.");
        $ch(this.chType + "HK").destroy();
    };

    exports.setChType = function(aChType) {
        this.chType = aChType;
    };

    exports.testElasticIndex = () => {
        var today = ow.loadFormat().fromDate(new Date(), "yyyy.MM.dd");
        ow.test.assert(ow.ch.utils.getElasticIndex("a test")(), "a test-" + today, "Problem with getElasticIndex default format.");
        today = ow.format.fromDate(new Date(), "yyyyMMdd");
        ow.test.assert(ow.ch.utils.getElasticIndex("a test", "yyyyMMdd")(), "a test-" + today, "Problem with getElasticIndex custom format.");
    };
})();