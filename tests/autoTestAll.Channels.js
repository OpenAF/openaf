(function() {
    this.chType = "big";

    exports.testMVSUtils = function() {
        io.rm("testMVS.db");

        $ch("mvs").create(1, "mvs", { file: "testMVS.db", map: "teste" });
        $ch("mvs").set(1, 1); 
        $ch("mvs").set(2, 2);
        $ch("mvs").set(3, 3);

        var res = ow.ch.utils.mvs.list("testMVS.db");
        ow.test.assert(res, [ "teste" ], "Problem with listing maps on a mvs file.");

        ow.ch.utils.mvs.rename("testMVS.db", "teste", "teste2");
        res = ow.ch.utils.mvs.list("testMVS.db");
        ow.test.assert(res, [ "teste2" ], "Problem with listing maps on a mvs file (2).");
        ow.ch.utils.mvs.rename("testMVS.db", "teste2", "teste");

        $ch("mvs").destroy();
        res = ow.ch.utils.mvs.list("testMVS.db");
        ow.test.assert(res, [ "teste" ], "Problem with listing maps on a mvs file (3).");

        ow.ch.utils.mvs.remove("testMVS.db", "teste");
        res = ow.ch.utils.mvs.list("testMVS.db");
        ow.test.assert(res, [ ], "Problem with listing maps on a mvs file (4).");

        io.rm("testMVS.db");
    };

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

    exports.testChannelSubscribers = function() {
        $ch("_t1_").create();
        $ch("_t2_").create();
        $ch("_t3_").create();
        $ch("_t4_").create();

        $ch("_t1_").subscribe(ow.ch.utils.getMirrorSubscriber("_t2_"));
        $ch("_t1_").subscribe(ow.ch.utils.getMirrorSubscriber("_t3_"));

        $ch("_t1_").setAll(["filepath"], listFilesRecursive("..")); 
        $ch("_t1_").waitForJobs(); sleep(100);

        ow.test.assert($ch("_t1_").size(), $ch("_t2_").size(), "Differences between channel 1 and 2");
        ow.test.assert($ch("_t1_").size(), $ch("_t3_").size(), "Differences between channel 1 and 3");

        $ch("_t2_").subscribe(ow.ch.utils.getMirrorSubscriber("_t4_"));
        $ch("_t2_").waitForJobs(); sleep(100);

        ow.test.assert($ch("_t2_").size(), $ch("_t4_").size(), "Differences between channel 2 and 4");

        $ch("_t1_").destroy();
        $ch("_t2_").destroy();
        $ch("_t3_").destroy();
        $ch("_t4_").destroy();
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

    exports.testKeepHistory = function() {
        var t = ow.ch.utils.keepHistory(100, "__keepHistoryTest", () => { return { tt: new Date() } });
        sleep(1500);
        t.stop();
        ow.test.assert($ch("__keepHistoryTest").size(), 10, "Problem with a simple ow.ch.utils.keepHistory setup.");

        $ch("__keepHistoryTest").destroy();
        var t = ow.ch.utils.keepHistory(100, "__keepHistoryTest", () => { return { id: nowNano(), tt: new Date() } }, ["id"], 20);
        sleep(2500);
        t.stop();
        ow.test.assert($ch("__keepHistoryTest").size(), 20, "Problem with changing history size on ow.ch.utils.keepHistory.");
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