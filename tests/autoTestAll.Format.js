(function() {
    exports.testLoadFormat = function() {
        ow.loadFormat();
    };

    exports.testAddNumberSeparator = function() {
        ow.test.assert(ow.format.addNumberSeparator("1234567890"), "1,234,567,890", "Problem with add number separator");
        ow.test.assert(ow.format.addNumberSeparator("1234567890", "."), "1.234.567.890", "Problem with add number separator with '.'");            
    };

    exports.testAbbreviation = function() {
        ow.test.assert(ow.format.toAbbreviation(123456789), "123.46m", "Problem with to abbreviation");
        ow.test.assert(ow.format.toAbbreviation(123456789, 4), "123.4568m", "Problem with to abbreviation with 4 decimal digits");            
    };

    exports.testRound = function() {
        ow.test.assert(ow.format.round(123.456), "123", "Problem with round");
        ow.test.assert(ow.format.round(123.456, 2), "123.46", "Problem with round");    
    };

    exports.testTimeAgo = function() {
        ow.test.assert(ow.format.timeago(new Date()), "Just now", "Problem with time ago");
        ow.test.assert(ow.format.timeago(String(new Date())), "Just now", "Problem with time ago (with string param)");
        ow.test.assert(ow.format.timeago(new Date((new Date()).getFullYear() - 2, 0, 1)), "2 years ago", "Problem with time ago for 2 years");    
    };

    exports.testDate = function() {
        ow.test.assert(ow.format.toDate("20141001 15:00 -0000", "yyyyMMdd HH:mm Z").getTime(), 1412175600000, "Problem with toDate");
        ow.test.assert(ow.format.fromDate(new Date(2014, 0, 1), "yyyyMMdd"), "20140101", "Problem with fromDate");            
        ow.test.assert(ow.format.fromDate(String(new Date(2014, 0, 1)), "yyyyMMdd"), "20140101", "Problem with fromDate (with string param)");            
    };

    exports.testEscape = function() {
        ow.test.assert(ow.format.escapeString("<json>{ a: 1, b: \"2\", c: [1, 2] }</json>"), "<json>\\{ a: 1, b: \"2\", c: \\[1, 2\\] \\}<\\/json>", "Problem with escapeString");
        ow.test.assert(ow.format.escapeHTML("<json>{ a: 1, b: \"2\", c: [1, 2] }</json>"), "&lt;json&gt;{ a: 1, b: &quot;2&quot;, c: [1, 2] }&lt;/json&gt;", "Problem with escapeHTML");            
    };

    exports.testWordWrap = function() {
        ow.test.assert(ow.format.string.wordWrap("a long text to serve as an example", 10, "-"), "a long-text to-serve as-an-example", "Problem with word wrap.");        
    };

    exports.testPad = function() {
        ow.test.assert(ow.format.string.leftPad(".", 2, "-") + ow.format.string.rightPad(".", 2, "-"), "-..-", "Problem with left and right padding.");        
    };

    exports.testDateDiff = function() {
        ow.test.assert(ow.format.dateDiff.inMonths(ow.format.toDate("201512310000", "yyyyMMddHHmm"), ow.format.toDate("201601010000", "yyyyMMddHHmm")), 1, "Problem with dateDiff.inMonths");
        ow.test.assert(ow.format.dateDiff.inDays(ow.format.toDate("201512310000", "yyyyMMddHHmm"), ow.format.toDate("201601010000", "yyyyMMddHHmm")), 1, "Problem with dateDiff.inDays");
        ow.test.assert(ow.format.dateDiff.inYears(ow.format.toDate("201512310000", "yyyyMMddHHmm"), ow.format.toDate("201601010000", "yyyyMMddHHmm")), 1, "Problem with dateDiff.inYears");
        ow.test.assert(ow.format.dateDiff.inHours(ow.format.toDate("201512310000", "yyyyMMddHHmm"), ow.format.toDate("201601010000", "yyyyMMddHHmm")), 24, "Problem with dateDiff.inHours");
        ow.test.assert(ow.format.dateDiff.inMinutes(ow.format.toDate("201512310000", "yyyyMMddHHmm"), ow.format.toDate("201601010000", "yyyyMMddHHmm")), 1440, "Problem with dateDiff.inMinutes");
        ow.test.assert(ow.format.dateDiff.inSeconds(ow.format.toDate("201512310000", "yyyyMMddHHmm"), ow.format.toDate("201601010000", "yyyyMMddHHmm")), 86400, "Problem with dateDiff.inSeconds");    
        ow.test.assert(ow.format.dateDiff.inWeeks(ow.format.toDate("201512310000", "yyyyMMddHHmm"), ow.format.toDate("201701010000", "yyyyMMddHHmm")), 52, "Problem with dateDiff.inWeeks");    

        ow.test.assert(ow.format.dateDiff.inMonths(String(ow.format.toDate("201512310000", "yyyyMMddHHmm")), ow.format.toDate("201601010000", "yyyyMMddHHmm")), 1, "Problem with dateDiff.inMonths (with string param)");
        ow.test.assert(ow.format.dateDiff.inDays(String(ow.format.toDate("201512310000", "yyyyMMddHHmm")), ow.format.toDate("201601010000", "yyyyMMddHHmm")), 1, "Problem with dateDiff.inDays (with string param)");
        ow.test.assert(ow.format.dateDiff.inYears(String(ow.format.toDate("201512310000", "yyyyMMddHHmm")), ow.format.toDate("201601010000", "yyyyMMddHHmm")), 1, "Problem with dateDiff.inYears (with string param)");
        ow.test.assert(ow.format.dateDiff.inHours(String(ow.format.toDate("201512310000", "yyyyMMddHHmm")), ow.format.toDate("201601010000", "yyyyMMddHHmm")), 24, "Problem with dateDiff.inHours (with string param)");
        ow.test.assert(ow.format.dateDiff.inMinutes(String(ow.format.toDate("201512310000", "yyyyMMddHHmm")), ow.format.toDate("201601010000", "yyyyMMddHHmm")), 1440, "Problem with dateDiff.inMinutes (with string param)");
        ow.test.assert(ow.format.dateDiff.inSeconds(String(ow.format.toDate("201512310000", "yyyyMMddHHmm")), ow.format.toDate("201601010000", "yyyyMMddHHmm")), 86400, "Problem with dateDiff.inSeconds (with string param)");    
        ow.test.assert(ow.format.dateDiff.inWeeks(String(ow.format.toDate("201512310000", "yyyyMMddHHmm")), ow.format.toDate("201701010000", "yyyyMMddHHmm")), 52, "Problem with dateDiff.inWeeks");    
    };

    exports.testCron = function() {
        ow.test.assert(ow.format.cron.isCronMatch(new Date(), "*/1 */1 * * * *"), true, "Problem with cron using seconds.");
        ow.test.assert(ow.format.cron.isCronMatch(new Date(), "*/1 * * * *"), true, "Problem with cron using minutes.");            
    };

    exports.testConversions = function() {
        ow.test.assert(ow.format.fromBinary(ow.format.toBinary(12345)), 12345, "Problem with conversion to binary");
        ow.test.assert(ow.format.fromOctal(ow.format.toOctal(12345)), 12345, "Problem with conversion to octal");
        ow.test.assert(ow.format.fromHex(ow.format.toHex(12345)), 12345, "Problem with conversion to hex");    
    };

    exports.testLSH = function() {
        var s1 = repeat(50, "This is a sample text to test this functionality. ");
        var s2 = repeat(50, "USA means United States of America. ");
        var s3 = repeat(50, "Isto é um texto exemplo para testar esta funcionalidade. ");
    
        ow.test.assert(ow.format.string.lsHash(s1, s2) > 200, true, "Problem with different sentences on LSH hashing.");
        ow.test.assert(ow.format.string.lsHash(s1, s3) <= 200, true, "Problem with language similar sentences on LSH hashing.");
        ow.test.assert(ow.format.string.lsHash(s1, "my stuff = " + s1, false) <= 200, true, "Problem with almost similar sentences on LSH hashing.");
        ow.test.assert(ow.format.string.lsHash(s1, s1) <= 200, true, "Problem with identical sentences on LSH hashing.");
    };
    
    exports.testUnixDateConversions = function() {
        var d = new Date();
        ow.test.assert(ow.format.fromUnixDate(ow.format.toUnixDate(d)).getTime(), Math.round(d.getTime()/1000) * 1000, "Problem with from/to unix date conversion.");
    };

    exports.testLDAPDateConversions = function() {
        var d = new Date();
        ow.test.assert(ow.format.fromLDAPDate(ow.format.toLDAPDate(d)).getTime(), d.getTime(), "Problem with LDAP date conversions.");
    };
})();