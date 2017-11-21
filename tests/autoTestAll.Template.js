(function() {
    exports.testLoadTemplate = function() {
        ow.loadTemplate();
    };

    exports.testMD2HTML = function() {
        var md = "# test 1";

        ow.loadTemplate();
        var out = ow.template.parseMD2HTML(md);
        ow.test.assert(out, "<h1 id=\"test-1\">test 1</h1>", "Problem with ow.template.parseMD2HTML");

        // TODO: Need to improve this test
        out = ow.template.parseMD2HTML(md, true);
        ow.test.assert(out.match(/highlight\.js/).length, 1, "Problem with ow.template.parseMD2HTML full html");
    };

})();