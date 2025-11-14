// Copyright 2025 Nuno Aguiar

(function() {
    exports.testLoadNet = function() {
        ow.loadNet();
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
