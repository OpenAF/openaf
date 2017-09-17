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

    exports.testHousekeeping = function() {
        $ch(this.chType + "HK").destroy();
        $ch(this.chType + "HK").create();
        
        for(var i = 0; i < 10; i++) {
            $ch(this.chType + "HK").set(i, i);
        }
        ow.test.assert($ch(this.chType + "HK").size(), 10, "Channel didn't set all required values.");

        $ch(this.chType + "HK").subscribe(ow.ch.utils.getHousekeepSubscriber(this.chType + "HK", 3));
        sleep(2500); 
        $ch(this.chType + "HK").waitForJobs();
        ow.test.assert($ch(this.chType + "HK").size(), 3, "Housekeep subscriber didn't remove all values in time.");

        for(var i = 10; i < 20; i++) {
            $ch(this.chType + "HK").set(i, i);
        }
        sleep(2500); 
        $ch(this.chType + "HK").waitForJobs();
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