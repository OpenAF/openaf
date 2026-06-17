// Copyright 2023 Nuno Aguiar

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

    exports.testActualTime = function() {
        ow.test.assert(isDate(ow.format.getActualTime()), true, "Problem with default actual time.");
        ow.test.assert(isDate(ow.format.getActualTime(true)), true, "Problem with alternative actual time.");
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

    exports.testISODate = function() {
        var orig = new Date()
        ow.test.assert(ow.format.fromISODate(orig.toISOString()).getTime(), orig.getTime(), "Problem with ISO date conversion (1)")
        ow.test.assert(ow.format.fromISODate("2020-01-02T12:34:56.Z").getTime(), new Date("2020-01-02T12:34:56Z").getTime(), "Problem with ISO date conversion (2)")
        ow.test.assert(ow.format.fromISODate("2020-01-02T12:34:56.123456789Z").getTime(), new Date("2020-01-02T12:34:56.123Z").getTime(), "Problem with ISO date conversion (3)")
    }

    exports.testEscape = function() {
        ow.test.assert(ow.format.escapeString("<json>{ a: 1, b: \"2\", c: [1, 2] }</json>"), "<json>\\{ a: 1, b: \"2\", c: \\[1, 2\\] \\}<\\/json>", "Problem with escapeString");
        ow.test.assert(ow.format.escapeHTML("<json>{ a: 1, b: \"2\", c: [1, 2] }</json>"), "&lt;json&gt;{ a: 1, b: &quot;2&quot;, c: [1, 2] }&lt;/json&gt;", "Problem with escapeHTML");            
    };

    exports.testWordWrap = function() {
        ow.test.assert(ow.format.string.wordWrap("a long text to serve as an example", 10, "-"), "a long-text to-serve as-an example", "Problem with word wrap.");

        var wrappedAnsi = ow.format.string.wordWrap(ansiColor("RED", "1234 5678 90"), 6);
        ow.test.assert(wrappedAnsi.replace(/\033\[[0-9;?]*[ -\/]*[@-~]/g, ""), "1234\n5678\n90", "Problem with word wrap and ANSI sequences.");
        wrappedAnsi.split("\n").forEach(line => {
            ow.test.assert(visibleLength(line) <= 6, true, "Problem with ANSI-aware wrapped line width.");
        });

        ow.test.assert(ow.format.string.wordWrap("alpha 😀 beta 😀 gamma", 10), "alpha 😀\nbeta 😀\ngamma", "Problem with word wrap and emoji width.");
    };

    exports.testVisibleLengthEmojiPresentation = function() {
        ow.test.assert(visibleLength("⚽"), 2, "Problem with emoji-presentation symbol visible width.");
    };

    exports.testVisibleLengthSubdivisionFlag = function() {
        var england = "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}";
        ow.test.assert(visibleLength(england), 2, "Problem with subdivision flag visible width.");
    };

    exports.testPrintTableEmojiAlignment = function() {
        var rendered = printTable([
            { "A": "⚽ abcdef", "B": "1" },
            { "A": "123456789", "B": "2" }
        ], __, false, false, "utf").replace(/\033\[[0-9;?]*[ -\/]*[@-~]/g, "");
        var lines = rendered.split("\n");

        ow.test.assert(lines[2], "⚽ abcdef│1", "Problem with printTable emoji alignment.");
        ow.test.assert(lines[3], "123456789│2", "Problem with printTable reference alignment.");
    };

    exports.testPrintTableSubdivisionFlagAlignment = function() {
        var england = "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}";
        var rendered = printTable([
            { "Team": england + " England", "Pts": "1827.05", "Change": "🟢 +1.08" },
            { "Team": "🇵🇹 Portugal", "Pts": "1766.18", "Change": "🟢 +2.34" }
        ], __, false, false, "utf").replace(/\033\[[0-9;?]*[ -\/]*[@-~]/g, "");
        var lines = rendered.split("\n");

        ow.test.assert(lines[2], england + " England│1827.05│🟢 +1.08", "Problem with printTable subdivision flag alignment.");
        ow.test.assert(lines[3], "🇵🇹 Portugal│1766.18│🟢 +2.34", "Problem with printTable reference alignment for subdivision flags.");
    };

    exports.testPrintTableHeaderLeftAlignment = function() {
        var rendered = printTable([
            { "Region": "Americas", "Flag": "🇺🇸", "Country/Entity": "United States" },
            { "Region": "Asia", "Flag": "🇯🇵", "Country/Entity": "Japan" }
        ], __, false, false, "utf").replace(/\033\[[0-9;?]*[ -\/]*[@-~]/g, "");
        var lines = rendered.split("\n");

        ow.test.assert(lines[0], "Region  │Flag│Country/Entity", "Problem with printTable header alignment.");
        ow.test.assert(lines[1], "────────┼────┼──────────────", "Problem with printTable separator alignment.");
        ow.test.assert(lines[2], "Americas│🇺🇸  │United States ", "Problem with printTable row alignment.");
    };

    exports.testWithMDWrap = function() {
        var _oldCon = __con;
        var _oldConStatus = __conStatus;

        __con = {
            getTerminal: () => ({
                getWidth: () => 10
            })
        };
        __conStatus = true;

        try {
            var rendered = ow.format.withMD("alpha 😀 **beta** 😀 gamma");
            var plain = rendered.replace(/\033\[[0-9;?]*[ -\/]*[@-~]/g, "");

            ow.test.assert(plain, "alpha 😀\nbeta 😀\ngamma", "Problem with markdown paragraph wrap.");
            rendered.split("\n").forEach(line => {
                ow.test.assert(visibleLength(line) <= 10, true, "Problem with markdown paragraph wrapped line width.");
            });
        } finally {
            __con = _oldCon;
            __conStatus = _oldConStatus;
        }
    };

    exports.testWithMDWrapOverride = function() {
        var _oldCon = __con;
        var _oldConStatus = __conStatus;

        __con = {
            getTerminal: () => ({
                getWidth: () => 20
            })
        };
        __conStatus = true;

        try {
            var rendered = ow.format.withMD("alpha 😀 **beta** 😀 gamma", __, 10);
            var plain = rendered.replace(/\033\[[0-9;?]*[ -\/]*[@-~]/g, "");

            ow.test.assert(plain, "alpha 😀\nbeta 😀\ngamma", "Problem with markdown paragraph wrap override.");
            rendered.split("\n").forEach(line => {
                ow.test.assert(visibleLength(line) <= 10, true, "Problem with markdown paragraph wrapped line width override.");
            });
        } finally {
            __con = _oldCon;
            __conStatus = _oldConStatus;
        }
    };

    exports.testWithMDWrapOverrideWithBgColor = function() {
        var _oldCon = __con;
        var _oldConStatus = __conStatus;

        __con = {
            getTerminal: () => ({
                getWidth: () => 20
            })
        };
        __conStatus = true;

        try {
            var rendered = ow.format.withMD("alpha 😀 **beta** 😀 gamma", "RESET", 10, "BG_BLUE");
            var plain = rendered.replace(/\033\[[0-9;?]*[ -\/]*[@-~]/g, "");

            ow.test.assert(plain, "alpha 😀\nbeta 😀\ngamma", "Problem with markdown paragraph wrap override with background color.");
            rendered.split("\n").forEach(line => {
                ow.test.assert(visibleLength(line) <= 10, true, "Problem with markdown paragraph wrapped line width override with background color.");
            });
        } finally {
            __con = _oldCon;
            __conStatus = _oldConStatus;
        }
    };

    exports.testWithMDBlockquoteSingleSideLine = function() {
        var rendered = ow.format.withMD("> some comment", __, 20);
        var plain = rendered.replace(/\033\[[0-9;?]*[ -\/]*[@-~]/g, "");
        var lines = plain.split("\n");

        ow.test.assert(lines.length, 1, "Problem with markdown blockquote rendering lines.");
        ow.test.assert(lines[0], "│ some comment", "Problem with markdown blockquote rendering a single side line.");
    };

    exports.testWithSideLineUnicodeHeaderFooter = function() {
        var rendered = ow.format.withSideLine("x", 8, __, __, ow.format.withSideLineThemes().closedRect, {
            header: "🇵🇹",
            headerAlign: "left",
            footer: "🇵🇹",
            footerAlign: "left"
        });
        var plain = rendered.replace(/\033\[[0-9;?]*[ -\/]*[@-~]/g, "");
        var lines = plain.split("\n");

        ow.test.assert(lines[0], "┌──🇵🇹──┐", "Problem with withSideLine unicode header width.");
        ow.test.assert(lines[1], "│ x    │", "Problem with withSideLine unicode body width.");
        ow.test.assert(lines[2], "└──🇵🇹──┘", "Problem with withSideLine unicode footer width.");
        lines.forEach(line => {
            ow.test.assert(visibleLength(line), 8, "Problem with withSideLine unicode visible width.");
        });
    };

    exports.testPad = function() {
        ow.test.assert(ow.format.string.leftPad(".", 2, "-") + ow.format.string.rightPad(".", 2, "-"), "-..-", "Problem with left and right padding.");        
    };

    exports.testTermCapabilities = function() {
        var caps = ow.format.term.getCapabilities({ refresh: true });
        ow.test.assert(isMap(caps), true, "Problem with terminal capabilities map.");
        ow.test.assert(isNumber(caps.width), true, "Problem with terminal capabilities width.");
        ow.test.assert(isNumber(caps.height), true, "Problem with terminal capabilities height.");
        ow.test.assert(isString(caps.colorMode), true, "Problem with terminal capabilities color mode.");

        var palette = ow.format.term.getPalette("16", { accent: "MAGENTA" });
        ow.test.assert(palette.accent, "MAGENTA", "Problem with palette override.");
        ow.test.assert(isDef(palette.positive), true, "Problem with palette base values.");
    };

    exports.testVizDiffFrames = function() {
        var diff = ow.format.viz.diffFrames("A\nB", "A\nC");
        ow.test.assert(isMap(diff), true, "Problem with diffFrames return map.");
        ow.test.assert(diff.changedLines, 1, "Problem with changed lines detection.");
        ow.test.assert(diff.lines, 2, "Problem with output lines count.");
        ow.test.assert(isString(diff.patch), true, "Problem with output patch generation.");
    };

    exports.testVizBenchmarkRender = function() {
        var res = ow.format.viz.benchmarkRender(i => repeat(5, String(i)), { iterations: 5 });
        ow.test.assert(res.iterations, 5, "Problem with benchmark iterations.");
        ow.test.assert(isNumber(res.avgMs), true, "Problem with benchmark avgMs.");
        ow.test.assert(res.maxMs >= res.minMs, true, "Problem with benchmark max/min.");
    };

    exports.testVizCreateCanvas = function() {
        var canvas = ow.format.viz.createCanvas({ width: 10, height: 3 });
        ow.test.assert(canvas.width, 10, "Problem with canvas width.");
        ow.test.assert(canvas.height, 3, "Problem with canvas height.");
        canvas.write(0, 0, "Hi");
        var rendered = canvas.render();
        ow.test.assert(rendered.split("\n").length, 3, "Problem with canvas render line count.");
        ow.test.assert(rendered.split("\n")[0].indexOf("Hi") >= 0, true, "Problem with canvas write content.");
    };

    exports.testVizLayout = function() {
        var widths = ow.format.viz.layout.split(100, [20, "50%", "auto"]);
        ow.test.assert(widths[0], 20, "Problem with layout fixed split.");
        ow.test.assert(widths[1], 50, "Problem with layout percentage split.");
        ow.test.assert(widths[2], 30, "Problem with layout auto split.");

        var padded = ow.format.viz.layout.padLines("abc\ndef", 5, 3);
        var lines = padded.split("\n");
        ow.test.assert(lines.length, 3, "Problem with padLines height.");
        ow.test.assert(lines[0].length, 5, "Problem with padLines width.");
    };

    exports.testPrintSparkline = function() {
        var spark = ow.format.printSparkline([1, 5, 3, 8, 2, 9, 4], { palette: "none" });
        ow.test.assert(isString(spark), true, "Problem with printSparkline returning string.");
        var plain = spark.replace(/\033\[[0-9;?]*[ -\/]*[@-~]/g, "");
        ow.test.assert(plain.length, 7, "Problem with printSparkline character count.");

        var multi = ow.format.printSparkline([{ data: [1,2,3], name: "a" }, { data: [3,2,1], name: "b" }], { palette: "none" });
        ow.test.assert(multi.split("\n").length, 2, "Problem with multi-series sparkline line count.");

        var empty = ow.format.printSparkline([], { palette: "none" });
        ow.test.assert(empty.indexOf("empty") >= 0, true, "Problem with empty sparkline fallback.");
    };

    exports.testPrintHistogram = function() {
        var vals = [1, 2, 2, 3, 3, 3, 4, 4, 5];
        var hist = ow.format.printHistogram(vals, { buckets: 3, width: 40, palette: "none" });
        ow.test.assert(isString(hist), true, "Problem with printHistogram returning string.");
        ow.test.assert(hist.split("\n").length, 3, "Problem with printHistogram bucket line count.");

        var histV = ow.format.printHistogram(vals, { buckets: 3, vertical: true, width: 20, height: 6, palette: "none" });
        ow.test.assert(isString(histV), true, "Problem with printHistogram vertical mode.");
        ow.test.assert(histV.split("\n").length, 5, "Problem with printHistogram vertical line count.");

        var empty = ow.format.printHistogram([], { palette: "none" });
        ow.test.assert(empty.indexOf("empty") >= 0, true, "Problem with empty histogram fallback.");
    };

    exports.testPrintBulletValueFormats = function() {
        var raw = ow.format.printBullet({ value: 1536, label: "raw" }, { width: 30, palette: "none" });
        ow.test.assert(raw.indexOf("1536") >= 0, true, "Problem with printBullet raw values.");

        var si = ow.format.printBullet({ value: 1536, label: "si" }, { width: 30, palette: "none", valueFormat: "si" });
        ow.test.assert(si.indexOf("1.54k") >= 0, true, "Problem with printBullet SI abbreviated values.");

        var bytes = ow.format.printBullet({ value: 1536, label: "bytes" }, { width: 30, palette: "none", valueFormat: "bytes" });
        ow.test.assert(bytes.indexOf("1.5 KB") >= 0, true, "Problem with printBullet byte abbreviated values.");
    };

    exports.testPrintDashboard = function() {
        var dash = ow.format.printDashboard([
            { type: "text", data: "Hello", title: "A" },
            { type: "text", data: "World", title: "B" }
        ], { width: 40, height: 8, palette: "none" });
        ow.test.assert(isString(dash), true, "Problem with printDashboard returning string.");
        var plain = dash.replace(/\033\[[0-9;?]*[ -\/]*[@-~]/g, "");
        ow.test.assert(plain.length > 0, true, "Problem with printDashboard non-empty output.");
        ow.test.assert(plain.split("\n")[0].length, 40, "Problem with printDashboard total width.");

        var dash2 = ow.format.printDashboard([
            [{ type: "text", data: "Left" }, { type: "text", data: "Right" }],
            [{ type: "text", data: "Bottom", options: {} }]
        ], { width: 40, height: 10, palette: "none" });
        ow.test.assert(isString(dash2), true, "Problem with 2D grid dashboard.");

        // span support
        var dashSpan = ow.format.printDashboard([
            [{ type: "text", data: "Wide", span: 2 }, { type: "text", data: "Narrow" }]
        ], { width: 60, height: 6, palette: "none" });
        ow.test.assert(isString(dashSpan), true, "Problem with printDashboard span.");

        // new types: map, bar, func
        var dashMap = ow.format.printDashboard([{ type: "map", data: { a: 1, b: 2 } }], { width: 40, height: 6, palette: "none" });
        ow.test.assert(isString(dashMap), true, "Problem with printDashboard map type.");
        var dashBar = ow.format.printDashboard([{ type: "bar", data: "int 5" }], { width: 40, height: 6, palette: "none" });
        ow.test.assert(isString(dashBar), true, "Problem with printDashboard bar type.");
        var dashFunc = ow.format.printDashboard([{ type: "func", data: "return repeat(mx, '-')" }], { width: 40, height: 6, palette: "none" });
        ow.test.assert(isString(dashFunc), true, "Problem with printDashboard func type.");
    };

    exports.testGrid = function() {
        // basic 2-column grid
        var g = ow.format.string.grid([
            [{ obj: "Left", type: "text" }, { obj: "Right", type: "text" }]
        ], 5, 40, " ", true);
        ow.test.assert(isString(g), true, "Problem with grid returning string.");
        ow.test.assert(g.length > 0, true, "Problem with grid non-empty output.");

        // new types via printDashboard: sparkline
        var gSpark = ow.format.string.grid([
            [{ obj: [1, 2, 3, 4, 5], type: "sparkline" }]
        ], 4, 40, " ", true);
        ow.test.assert(isString(gSpark), true, "Problem with grid sparkline type.");

        // new types via printDashboard: histogram
        var gHist = ow.format.string.grid([
            [{ obj: [1, 2, 3, 4, 5, 6, 7, 8], type: "histogram" }]
        ], 6, 40, " ", true);
        ow.test.assert(isString(gHist), true, "Problem with grid histogram type.");

        // new types via printDashboard: progress
        var gProg = ow.format.string.grid([
            [{ obj: { value: 50, max: 100, min: 0 }, type: "progress" }]
        ], 4, 40, " ", true);
        ow.test.assert(isString(gProg), true, "Problem with grid progress type.");

        // xspan
        var gSpan = ow.format.string.grid([
            [{ obj: "Full width", type: "text", xspan: 2 }, { obj: "Half", type: "text" }]
        ], 5, 60, " ", true);
        ow.test.assert(isString(gSpan), true, "Problem with grid xspan.");

        // title
        var gTitle = ow.format.string.grid([
            [{ obj: "Content", type: "text", title: "MyTitle" }]
        ], 5, 40, " ", true);
        ow.test.assert(gTitle.indexOf("MyTitle") >= 0, true, "Problem with grid title rendering.");
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

    exports.testHost = function() {
        ow.test.assert(ow.format.testHost("127.0.0.1").reachable, true, "Problem with testing localhost.");
    };

    exports.testCron = function() {
        ow.test.assert(ow.format.cron.isCronMatch(new Date(), "*/1 */1 * * * *"), true, "Problem with cron using seconds.");
        ow.test.assert(ow.format.cron.isCronMatch(new Date(), "*/1 * * * *"), true, "Problem with cron using minutes.");            
    };

    exports.testConversions = function() {
        ow.test.assert(ow.format.fromBinary(ow.format.toBinary(12345)), 12345, "Problem with conversion to binary");
        ow.test.assert(ow.format.fromOctal(ow.format.toOctal(12345)), 12345, "Problem with conversion to octal");
        ow.test.assert(ow.format.fromHex(ow.format.toHex(12345)), 12345, "Problem with conversion to hex");    
        ow.test.assert(ow.format.fromBase36(ow.format.toBase36(12345)), 12345, "Problem with conversion to base36");
        ow.test.assert(af.fromBytes2String(ow.format.fromBase32(ow.format.toBase32("abc12345"))), "abc12345", "Problem with conversion to base32")
        ow.test.assert(af.fromBytes2String(ow.format.fromBase16(ow.format.toBase16("abc12345"))), "abc12345", "Problem with conversion to base16")
    };

    exports.testBytesAbbreviation = function() {
        ow.test.assert(ow.format.fromBytesAbbreviation(ow.format.toBytesAbbreviation(123)), 123, "Problem with simple bytes abbreviation (1)");
        ow.test.assert(ow.format.fromBytesAbbreviation(ow.format.toBytesAbbreviation(128 * 1024)), 128 * 1024, "Problem with simple bytes abbreviation (2)");
        ow.test.assert(ow.format.fromBytesAbbreviation(ow.format.toBytesAbbreviation(128 * 1024 * 1024)), 128 * 1024 * 1024, "Problem with simple bytes abbreviation (3)");
        ow.test.assert(ow.format.fromBytesAbbreviation(ow.format.toBytesAbbreviation(128 * 1024 * 1024 * 1024)), 128 * 1024 * 1024 * 1024, "Problem with simple bytes abbreviation (4)");
    };

    exports.testHTML4 = function() {
        var testString = "This is áàç test with ã ê";

        ow.test.assert(ow.format.unescapeHTML4(ow.format.escapeHTML4(testString)), testString, "Problem with escape/unescape HTML4");
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
    
    exports.testCronHowManyAgo = function() {
        ow.test.assert(ow.format.cron.howManyAgo("*/5 * * * *", nowUTC() - 1000*60*60).isDelayed, true, "Problem with delayed date.");
        ow.test.assert(ow.format.cron.howManyAgo("*/5 * * * *", nowUTC() + 1000*60*60).isDelayed, false, "Problem with non delayed date.");
    };

    exports.testUnixDateConversions = function() {
        var d = new Date();
        ow.test.assert(ow.format.fromUnixDate(ow.format.toUnixDate(d)).getTime(), Math.round(d.getTime()/1000) * 1000, "Problem with from/to unix date conversion.");
    };

    exports.testLDAPDateConversions = function() {
        var d = new Date();
        ow.test.assert(
            Math.floor(Number(ow.format.fromLDAPDate(ow.format.toLDAPDate(d)).getTime())/1000), 
            Math.floor(Number(d.getTime())/1000), 
            "Problem with LDAP date conversions."
        );
    };

    exports.testSLON = function() {
        var orig   = { s: "abc", num: -1.23456, bol: true, subMap: { x: 1, y: -1 }, subArr: [ 1, 2, 3 ], dt: ow.format.toDate("2020-01-01 12:34:56", "yyyy-MM-dd HH:mm:ss"), subArr2: [ { n: 1, b: true, s: "abc", p: { x: 1, y: -1} }, { n: 2, b: false, s: "xyz 'a'", a: [ 4,5,6 ] }, { n: 3, b: false, s: "axZ xyz" } ] };
        var target = "(s: abc, num: -1.23456, bol: true, subMap: (x: 1, y: -1), subArr: [1 | 2 | 3], dt: 2020-01-01/12:34:56.000, subArr2: [(n: 1, b: true, s: abc, p: (x: 1, y: -1)) | (n: 2, b: false, s: 'xyz \\'a\\'', a: [4 | 5 | 6]) | (n: 3, b: false, s: axZ xyz)])";

        ow.test.assert(ow.format.toSLON(orig), target, "Problem with toSLON.");

        var slon = "(a: 1, b: abc, c: 123aBc, d: 1.1, e: 1.2.3, f: [ 'ab:12' | '12:ab' ], g: [ ( x: 1 ) | ( y: abc , z :  ab  cd  ) ])"
        var json = {"a":1,"b":"abc","c":"123aBc","d":1.1,"e":"1.2.3","f":["ab:12","12:ab"],"g":[{"x":1},{"y":"abc","z":"ab  cd"}]}

        ow.test.assert(af.fromSLON(slon), json, "Problem with fromSLON.")
    };

    exports.timeAbbreviation = function() {
        ow.test.assert( ow.format.fromTimeAbbreviation( ow.format.elapsedTime4ms(1000, { abrev: true }) ), 1000, "Problem with seconds abbreviation" )
        ow.test.assert( ow.format.fromTimeAbbreviation( ow.format.elapsedTime4ms(60*1000, { abrev: true }) ), 60000, "Problem with minutes abbreviation" )
        ow.test.assert( ow.format.fromTimeAbbreviation( ow.format.elapsedTime4ms(60*60*1000, { abrev: true }) ), 3600000, "Problem with hours abbreviation" )
        ow.test.assert( ow.format.fromTimeAbbreviation( ow.format.elapsedTime4ms(24*60*60*1000, { abrev: true }) ), 86400000, "Problem with days abbreviation" )
        ow.test.assert( ow.format.fromTimeAbbreviation( ow.format.elapsedTime4ms(7*24*60*60*1000, { abrev: true }) ), 604800000, "Problem with weeks and days abbreviation" )
        ow.test.assert( ow.format.fromTimeAbbreviation( ow.format.elapsedTime4ms(5*7*24*60*60*1000, { abrev: true }) ), 3024000000, "Problem with months abbreviation" )
        ow.test.assert( ow.format.fromTimeAbbreviation( ow.format.elapsedTime4ms(365*24*60*60*1000, { abrev: true }) ), 31968000000, "Problem with years abbreviation" )
        ow.test.assert( ow.format.fromTimeAbbreviation( "1w" ) / 7 / 24 / 60 / 60 / 1000, 1, "Problem with weeks abbreviation ")
    }
})();
