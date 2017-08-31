(function() {
    this.chType = "big";

    function testCreateChannel() {
        $ch("test").create(true, this.chType);
        $ch('test').size();
    }
    exports.testCreateChannel = testCreateChannel;

    function testSettingData() {
        var l = listFilesRecursive(".");
        $ch("test").setAll(["filepath"], l);
        ow.test.assert(l.length, $ch("test").size(), "Channel didn't store all values.");
    }
    exports.testSettingData = testSettingData;

    function testDestroyChannel() {
        $ch("test").destroy();
    }
    exports.testDestroyChannel = testDestroyChannel;

    function testHousekeeping() {
        $ch("testHK").destroy();
        $ch("testHK").create();
        
        for(let i = 0; i < 10; i++) {
            $ch("testHK").set(i, i);
        }
        ow.test.assert($ch("testHK").size(), 10, "Channel didn't set all required values.");

        $ch("testHK").subscribe(ow.ch.utils.getHousekeepSubscriber("testHK", 3));
        sleep(5000); $ch("testHK").waitForJobs();
        ow.test.assert($ch("testHK").size(), 3, "Housekeep subscriber didn't remove all values in time.");

        for(let i = 10; i < 20; i++) {
            $ch("testHK").set(i, i);
        }
        sleep(5000); $ch("testHK").waitForJobs();
        ow.test.assert($ch("testHK").size(), 3, "Housekeep subscriber didn't remove all values after setting.");
        $ch("testHK").destroy();
    }
    exports.testHousekeeping = testHousekeeping;

    function setChType(aChType) {
        this.chType = aChType;
    }
    exports.setChType = setChType;
})();