// Copyright 2023 Nuno Aguiar

(function() {
    function runPause(keys, content, options) {
        ow.loadFormat();
        options = options || {};
        var pages = [], statuses = [], settings = [], reads = 0;
        var terminal = { getHeight: () => 5, getWidth: () => options.width || 180,
            isAnsiSupported: () => options.ansi !== false,
            settings: { get: () => "original", set: value => settings.push(value) } };
        var MockConsole = function() {
            this.getConsoleReader = () => ({ getTerminal: () => terminal });
            this.readChar = function() {
                if (reads >= keys.length) throw new Error("input exhausted");
                return keys.charAt(reads++);
            };
            this.readCharNB = function() {
                if (reads >= keys.length || keys.charAt(reads) == "\u0000") {
                    if (keys.charAt(reads) == "\u0000") reads++;
                    return -1; // Deterministic standalone Escape or truncated sequence.
                }
                return keys.charCodeAt(reads++);
            };
        };
        var pager = new Function("Console", "plugin", "print", "printnl",
            "return (" + ow.format.string.pauseString.toString() + ")")(
            MockConsole, () => {}, text => pages.push(text), text => {
                if (text.charAt(0) != "\r") statuses.push(text);
            });
        if (isNumber(content)) {
            var lines = []; for (var i = 0; i < content; i++) lines.push(String(i));
            content = lines.join("\n");
        }
        var error = false, errorMessage = "";
        try { pager(content, options.message); } catch (e) { error = true; errorMessage = String(e); }
        ow.test.assert(error, !!options.fail, "Unexpected pager error: " + errorMessage);
        ow.test.assert(settings[settings.length - 1], "original", "Terminal restored");
        ow.test.assert(reads, keys.length, "Whole key sequences consumed");
        return {
            starts: pages.map(text => parseInt(ow.format.string._stripAnsi(text).split("\n")[0], 10)),
            percentages: statuses.filter(text => /\d+%/.test(text)).map(text => Number(text.match(/(\d+)%/)[1])),
            pages: pages, statuses: statuses
        };
    }

    exports.testPauseNavigation = function() {
        function run(keys, count, fail) { return runPause(keys, count, { fail: fail }); }
        var esc = "\x1b[";
        ow.test.assert(run(esc+"6~"+esc+"5~"+esc+"C"+esc+"Dq", 13).starts,
            [0,4,0,4,0], "Page keys and arrow aliases");
        ow.test.assert(run(esc+"6;2~"+esc+"5;2~"+esc+"6;2~"+esc+"Dq", 13).starts,
            [0,9,0,9,5], "Modified keys and navigation from bottom");
        ow.test.assert(run(esc+"1;2C"+esc+"1;2D"+esc+"1;2C"+esc+"Dq", 13).starts,
            [0,9,0,9,5], "Shift arrows jump to bottom and top");
        ow.test.assert(run(esc+"B"+esc+"6~"+esc+"5~"+esc+"A"+esc+"Aq", 13).starts,
            [0,1,5,1,0,0], "Line keys and exact previous page boundary");
        ["4~", "8~", "F"].forEach(key => {
            var result = run(esc+key+" ", 13);
            ow.test.assert(result.starts, [0,9], "End goes to final full page");
            ow.test.assert(result.percentages, [30,100], "Bottom shows 100 percent");
        });
        ["1~", "7~", "H"].forEach(key => {
            ow.test.assert(run(esc+"6~"+esc+key+"Q", 13).starts, [0,4,0], "Home goes to top");
        });
        ["6~", "C"].forEach(key => {
            ow.test.assert(run(esc+"6;2~"+esc+key, 13).starts, [0,9], "Forward at bottom exits");
        });
        ow.test.assert(run("    ", 13).starts, [0,4,8,9], "Ordinary paging exits at bottom");
        ow.test.assert(run("", 4).pages, ["0\n1\n2\n3"], "Short output needs no input");
        run("", 13, true);
    };

    exports.testPauseSearch = function() {
        var esc = "\x1b[";
        var lines = ["0", "1 error ERROR error", "2", "3", "4", "5 Error", "6", "7", "8", "9 error", "10", "11", "12"];
        var content = lines.join("\n");
        var result = runPause("/error\rnnnnNq", content);
        ow.test.assert(result.starts, [0,1,1,1,5,9,5], "Each occurrence is a separate result");
        ow.test.assert(result.statuses.some(s => s.indexOf("Match 5/5") == 0), true, "Smart case matches all spellings");
        ow.test.assert(result.pages[1].indexOf("\x1b[7merror\x1b[0m") >= 0, true, "Selected occurrence highlighted");
        ow.test.assert(result.pages[1].indexOf("\x1b[4mERROR\x1b[0m") >= 0, true, "Other visible matches underlined");
        result = runPause("/Error\rnNq", content);
        ow.test.assert(result.starts, [0,5,5,5], "Uppercase query matches exact case");
        ow.test.assert(result.statuses.filter(s => s.indexOf("Search wrapped") >= 0).length, 2, "Both search directions wrap");
        result = runPause(esc+"6~"+"/error\rq", content);
        ow.test.assert(result.starts, [0,4,5], "New search starts at the current page");
        result = runPause(esc+"F"+"/Error\rq", content);
        ow.test.assert(result.starts, [0,9,5], "Initial search wraps when necessary");
        result = runPause("/12\rq", content);
        ow.test.assert(result.starts, [0,9], "Final line match retains a full page");
        result = runPause("nN/missing\rnNq", content);
        ow.test.assert(result.starts, [0,0,0,0,0,0], "Missing queries never move or exit");
        ow.test.assert(result.statuses.some(s => s.indexOf("No matches") == 0), true, "Missing query feedback");
        ow.test.assert(result.statuses.some(s => s.indexOf("Use / to search") == 0), true, "No active query feedback");
        result = runPause("/error\r/changed\x1b\u0000n/\rnq", content);
        ow.test.assert(result.starts, [0,1,1,1,1,1], "Cancellation retains query; empty input clears it");
        ow.test.assert(result.pages[4].indexOf("\x1b[7m"), -1, "Clear removes highlighting");
        result = runPause("/errox\berror\x7f\x7f\x7f\x7f\x7f\rQ", content);
        ow.test.assert(result.starts, [0,1], "Both backspace encodings edit the query");
        var literal = "a.*+[x](y)?^${z}|\\";
        result = runPause("/"+literal+"\rq", ["0", "1", "2 "+literal, "3", "4", "5"].join("\n"));
        ow.test.assert(result.starts, [0,2], "Regex punctuation is literal");
        result = runPause("/1\nq", content, { ansi: false });
        ow.test.assert(result.pages[1].indexOf("\x1b"), -1, "Search works without ANSI highlighting");
        result = runPause("/error\rq", content, { width: 26, message: "Custom {{percentage}}%" });
        ow.test.assert(result.statuses.some(s => s.indexOf("Match 1/5 | Custom") == 0), true, "Custom message and search status");
        ow.test.assert(result.statuses.every(s => visibleLength(s) <= 25), true, "Status and prompt fit terminal");
        result = runPause("/error"+esc+"D\rq", content);
        ow.test.assert(result.starts, [0,1], "Arrow sequences in prompt are fully consumed");
        result = runPause("/error\x1bq", content);
        ow.test.assert(result.starts, [0,0], "Key immediately after Escape is preserved");
        runPause("/error\r\x1b[\u0000q", content);
        runPause("/unfinished", content, { fail: true });
        runPause("/\x03", content, { fail: true });
    };

    exports.testPauseSearchAnsi = function() {
        var line = "1 \x1b[31mer\x1b[0mror\x1b[34m tail\x1b[0m";
        var result = runPause("/error\rq", ["0", line, "2", "3", "4", "5"].join("\n"));
        ow.test.assert(result.starts, [0,1], "Match spans ANSI sequences");
        ow.test.assert(ow.format.string._stripAnsi(result.pages[1]).split("\n")[0], "1 error tail", "Highlight preserves visible text");
        ow.test.assert(result.pages[1].indexOf("\x1b[0m\x1b[7mror") >= 0, true, "Highlight survives embedded reset");
        ow.test.assert(result.pages[1].indexOf("\x1b[0m\x1b[31m\x1b[0m\x1b[34m tail") >= 0, true, "Original colour restored after match");
        var link = "\x1b]8;;https://error.example\x1b\\plain\x1b]8;;\x1b\\";
        result = runPause("/error\rq", ["0", "1 "+link, "2", "3", "4", "5"].join("\n"));
        ow.test.assert(result.statuses.some(s => s.indexOf("No matches") == 0), true, "Hyperlink targets are not searchable text");
        result = runPause("/plain\rq", ["0", "1 "+link, "2", "3", "4", "5"].join("\n"));
        ow.test.assert(result.pages[1].indexOf("\x1b[7mplain\x1b[0m") >= 0, true, "Hyperlink label highlighted");
    };

    exports.testPrintTreeWithoutConsole = function() {
        var previousCon = __con;
        try {
            __con = __;
            [false, true].forEach(function(noansi) {
                var options = { noansi: noansi, color: false };
                var data = [{ "COUNT(*)": 194835 }];
                var expected = printTree(data, 80, options);
                ow.test.assert(printTree(data, __, options), expected, "Tree lost a value without a console width");
                __con = { getTerminal: function() { return { getWidth: function() { return 0; } }; } };
                ow.test.assert(printTree(data, __, options), expected, "Tree lost a value with a zero terminal width");
                __con = __;
                ow.test.assert(printTree(data, 40, options).indexOf("194835") >= 0, true, "Tree lost a value with an explicit width");
            });
        } finally {
            __con = previousCon;
        }
    };

    exports.testAnsiClipPad = function() {
        ow.loadFormat();
        var S = ow.format.string;
        ow.test.assert(S.ansiClip("hello", 10), "hello", "No clip when it fits");
        ow.test.assert(S.ansiClip("hello world", 6), "hello\u2026", "Plain clip");
        var c = S.ansiClip("\x1b[31mhello world\x1b[0m", 6);
        ow.test.assert(visibleLength(c), 6, "Clipped ANSI width");
        ow.test.assert(c.indexOf("\x1b[31m") == 0 && c.slice(-4), "\x1b[0m", "ANSI preserved and reset");
        ow.test.assert(visibleLength(S.ansiClip("\ud83d\udcc1\ud83d\udcc1\ud83d\udcc1", 5)) <= 5, true, "Wide emoji clip");
        ow.test.assert(visibleLength(S.ansiPad("\x1b[32mab\x1b[0m", 5)), 5, "ANSI pad");
        ow.test.assert(S.ansiPad("abcdef", 3), "abcdef", "Pad never truncates");
    };

    exports.testLoadFormat = function() {
        ow.loadFormat();
    };

    exports.testStringHex = function() {
        var bytes = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 4);
        bytes[0] = 0; bytes[1] = 15; bytes[2] = -128; bytes[3] = -1;
        var empty = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 0);
        ow.test.assert(ow.format.string.toHex(bytes), "00 0F 80 FF", "Default hex separator");
        ow.test.assert(ow.format.string.toHex(bytes, ":"), "00:0F:80:FF", "Custom hex separator");
        ow.test.assert(ow.format.string.toHex(bytes, ""), "000F80FF", "Empty hex separator");
        ow.test.assert(ow.format.string.toHex(empty), "", "Empty hex input");
        ow.test.assert(ow.format.string.toHexArray(bytes, 2).length, 2, "Hex array lines");
    };

    exports.testCompareVersion = function() {
        ow.test.assert(ow.format.compareVersion("20260101", "20251104"), 1, "Problem comparing date versions");
        ow.test.assert(ow.format.compareVersion("20251104", "20260101"), -1, "Problem comparing lower date versions");
        ow.test.assert(ow.format.compareVersion("20260101", "20260101"), 0, "Problem comparing equal date versions");
        ow.test.assert(ow.format.compareVersion("10", "9"), 1, "Problem comparing numeric versions");
        ow.test.assert(ow.format.compareVersion("2", "10"), -1, "Problem comparing lower numeric versions");
        ow.test.assert(ow.format.compareVersion("1.2.10", "1.2.9"), 1, "Problem comparing semver patch versions");
        ow.test.assert(ow.format.compareVersion("1.10.0", "1.9.9"), 1, "Problem comparing semver minor versions");
        ow.test.assert(ow.format.compareVersion("1.2.3", "1.2.3"), 0, "Problem comparing equal semver versions");
        ow.test.assert(ow.format.compareVersion("1.2", "1.1.9"), 1, "Problem comparing short semver versions");
        ow.test.assert(ow.format.compareVersion("20260101", "1.2.3"), 1, "Problem comparing mixed date and semver versions");
        ow.test.assert(ow.format.compareVersion("1", "1.2.3"), -1, "Problem comparing mixed numeric and semver versions");
        ow.test.assert(ow.format.compareVersion("1", "1.0.0"), 0, "Problem comparing equivalent mixed versions");
        ow.test.assert(ow.format.compareVersion("2", "1.9.9"), 1, "Problem comparing greater mixed versions");
        ow.test.assert(ow.format.compareVersion("abc", "abd"), -1, "Problem comparing fallback versions");
    };

    exports.testCheckVersionSpec = function() {
        ow.test.assert(ow.format.checkVersionSpec("20211229", ">=20211229"), true, "Problem checking date version spec");
        ow.test.assert(ow.format.checkVersionSpec("20211228", ">=20211229"), false, "Problem checking failed date version spec");
        ow.test.assert(ow.format.checkVersionSpec("10", ">9"), true, "Problem checking numeric version spec");
        ow.test.assert(ow.format.checkVersionSpec("1.2.3", "1.2.3"), true, "Problem checking bare version spec");
        ow.test.assert(ow.format.checkVersionSpec("1.5.0", ">=1.2.3,<2.0.0"), true, "Problem checking semver range spec");
        ow.test.assert(ow.format.checkVersionSpec("2.1.0", ">=1.2.3,<2.0.0"), false, "Problem checking failed semver range spec");
        ow.test.assert(ow.format.checkVersionSpec("1.2.3", "<=1.2.3"), true, "Problem checking lower-or-equal version spec");
        ow.test.assert(ow.format.checkVersionSpec("2", ">=1.9.9"), true, "Problem checking mixed version spec");
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

    exports.testVisibleLengthUnicode = function() {
        var subdivisionFlag = String.fromCodePoint(0x1F3F4, 0xE0067, 0xE0062, 0xE0065, 0xE006E, 0xE0067, 0xE007F);
        var cases = [
            ["abc", 3],
            ["e\u0301", 1],
            ["中", 2],
            ["😀", 2],
            ["👍🏽", 2],
            ["👨‍👩‍👧‍👦", 2],
            ["🏳️‍🌈", 2],
            ["🇵🇹", 2],
            ["1️⃣", 2],
            [subdivisionFlag, 2]
        ];

        cases.forEach(function(entry) {
            ow.test.assert(visibleLength(entry[0]), entry[1], "Problem with visibleLength unicode width for '" + entry[0] + "'.");
            ow.test.assert(af.visibleLength(entry[0]), entry[1], "Problem with af.visibleLength unicode width for '" + entry[0] + "'.");
        });

        ow.test.assert(visibleLength(ansiColor("RED", "👨‍👩‍👧‍👦")), 2, "Problem with visibleLength ANSI unicode width.");
        ow.test.assert(af.visibleLength(ansiColor("RED", "👨‍👩‍👧‍👦")), 2, "Problem with af.visibleLength ANSI unicode width.");
    };

    exports.testVisibleLengthEmojiPresentation = function() {
        // Default (VISIBLELENGTH_WIDE_EMOJI = true): bare Emoji_Presentation=Yes symbols count as
        // double-width, matching modern GUI terminals (macOS Terminal, iTerm2, VS Code).
        ow.test.assert(visibleLength("⚽"), 2, "Problem with bare emoji-presentation symbol visible width.");
        ow.test.assert(af.visibleLength("⚽"), 2, "Problem with af.visibleLength bare emoji-presentation symbol visible width.");
        ow.test.assert(visibleLength("⚽️"), 2, "Problem with explicit emoji-presentation symbol visible width.");
        ow.test.assert(af.visibleLength("⚽️"), 2, "Problem with af.visibleLength explicit emoji-presentation symbol visible width.");
        ow.test.assert(visibleLength("⚽︎"), 1, "Problem with text-presentation symbol visible width.");
        ow.test.assert(visibleLength("\u2934"), 1, "Problem with text-default arrow visible width.");
        ow.test.assert(af.visibleLength("\u2934"), 1, "Problem with af.visibleLength text-default arrow visible width.");
        ow.test.assert(visibleLength("\ud83c\udc04"), 2, "Problem with mahjong tile emoji visible width.");
        ow.test.assert(af.visibleLength("\ud83c\udc04"), 2, "Problem with af.visibleLength mahjong tile emoji visible width.");
        ow.test.assert(af.visibleLength("⚽︎"), 1, "Problem with af.visibleLength text-presentation symbol visible width.");

        // Opt-out (per-call param or __flags.VISIBLELENGTH_WIDE_EMOJI = false): matches plain
        // wcwidth-style terminals that only widen these symbols with an explicit U+FE0F.
        ow.test.assert(visibleLength("⚽", false), 1, "Problem with bare emoji-presentation symbol visible width (narrow override).");
        ow.test.assert(af.visibleLength("⚽", false), 1, "Problem with af.visibleLength bare emoji-presentation symbol visible width (narrow override).");
        ow.test.assert(visibleLength("⚽️", false), 2, "Problem with explicit emoji-presentation symbol visible width (narrow override).");

        var _oldWideEmoji = __flags.VISIBLELENGTH_WIDE_EMOJI;
        try {
            __flags.VISIBLELENGTH_WIDE_EMOJI = false;
            ow.test.assert(visibleLength("⚽"), 1, "Problem with bare emoji-presentation symbol visible width (flag override).");
        } finally {
            __flags.VISIBLELENGTH_WIDE_EMOJI = _oldWideEmoji;
        }

        // Emoji_Presentation=Yes symbols outside the Dingbats/Misc Symbols block (Miscellaneous
        // Symbols and Arrows: ⭐ ⭕ ⬛ ⬜) should also default to double-width.
        ow.test.assert(visibleLength("⭐"), 2, "Problem with bare star symbol visible width.");
        ow.test.assert(af.visibleLength("⭐"), 2, "Problem with af.visibleLength bare star symbol visible width.");
        ow.test.assert(visibleLength("⭕"), 2, "Problem with bare heavy large circle visible width.");
        ow.test.assert(af.visibleLength("⭕"), 2, "Problem with af.visibleLength bare heavy large circle visible width.");
        ow.test.assert(visibleLength("⬛"), 2, "Problem with bare black large square visible width.");
        ow.test.assert(af.visibleLength("⬛"), 2, "Problem with af.visibleLength bare black large square visible width.");
        ow.test.assert(visibleLength("⬜"), 2, "Problem with bare white large square visible width.");
        ow.test.assert(af.visibleLength("⬜"), 2, "Problem with af.visibleLength bare white large square visible width.");
    };

    exports.testVisibleLengthSubdivisionFlag = function() {
        var england = "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}";
        ow.test.assert(visibleLength(england), 2, "Problem with subdivision flag visible width.");
        ow.test.assert(af.visibleLength(england), 2, "Problem with af.visibleLength subdivision flag visible width.");
    };

    exports.testPrintTableEmojiAlignment = function() {
        var rendered = printTable([
            { "A": "⚽ abcdef", "B": "1" },
            { "A": "123456789", "B": "2" }
        ], __, false, false, "utf").replace(/\033\[[0-9;?]*[ -\/]*[@-~]/g, "");
        var lines = rendered.split("\n");

        ow.test.assert(
            visibleLength(lines[2].split("│")[0]),
            visibleLength(lines[3].split("│")[0]),
            "Problem with printTable emoji alignment."
        );
    };

    exports.testPrintTableSubdivisionFlagAlignment = function() {
        var england = "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}";
        var rendered = printTable([
            { "Team": england + " England", "Pts": "1827.05", "Change": "🟢 +1.08" },
            { "Team": "🇵🇹 Portugal", "Pts": "1766.18", "Change": "🟢 +2.34" }
        ], __, false, false, "utf").replace(/\033\[[0-9;?]*[ -\/]*[@-~]/g, "");
        var lines = rendered.split("\n");

        ow.test.assert(visibleLength(lines[2].split("│")[0]), visibleLength(lines[3].split("│")[0]), "Problem with printTable subdivision flag alignment.");
        ow.test.assert(visibleLength(lines[2].substring(0, lines[2].lastIndexOf("│"))), visibleLength(lines[3].substring(0, lines[3].lastIndexOf("│"))), "Problem with printTable reference alignment for subdivision flags.");
    };

    exports.testPrintTableHeaderLeftAlignment = function() {
        var rendered = printTable([
            { "Region": "Americas", "Flag": "🇺🇸", "Country/Entity": "United States" },
            { "Region": "Asia", "Flag": "🇯🇵", "Country/Entity": "Japan" }
        ], __, false, false, "utf").replace(/\033\[[0-9;?]*[ -\/]*[@-~]/g, "");
        var lines = rendered.split("\n");

        ow.test.assert(visibleLength(lines[0].split("│")[0]), visibleLength(lines[2].split("│")[0]), "Problem with printTable header first separator alignment.");
        ow.test.assert(visibleLength(lines[0].substring(0, lines[0].lastIndexOf("│"))), visibleLength(lines[2].substring(0, lines[2].lastIndexOf("│"))), "Problem with printTable header second separator alignment.");
        ow.test.assert(visibleLength(lines[1].split("┼")[0]), visibleLength(lines[2].split("│")[0]), "Problem with printTable separator alignment.");
    };

    exports.testPrintTableBorderless = function() {
        var rows = [{ A: "one", B: "1" }, { A: "two", B: "2" }];
        var plain = printTable(rows, __, false, false, "borderless", __, true, false, false);
        ow.test.assert(plain, "A    B\n━━━  ━\none  1\ntwo  2\n", "Borderless headings and column gaps");
        ow.test.assert(printTable(rows, __, false, false, "borderless", __, true, true, false),
            "A    B\n━━━  ━\none  1\n───  ─\ntwo  2\n", "Separators only between records without a width limit");
        ow.test.assert(printTable([], 40, true, false, "borderless"), "", "Empty borderless table");
        ow.test.assert(printTable([rows[0]], __, true, false, "borderless", __, true, true, true),
            "A    B\n━━━  ━\none  1\n[#1 row]", "Single record has no row separator");
        ["plain", "utf"].forEach(function(theme) {
            var rendered = printTable(rows, __, false, false, theme, __, true, false, false).replace(/\033\[[0-9;?]*[ -\/]*[@-~]/g, "");
            var join = theme == "utf" ? "│" : "|";
            var rule = theme == "utf" ? "───┼─" : "---+-";
            ow.test.assert(rendered, "A  " + join + "B\n" + rule + "\none" + join + "1\ntwo" + join + "2\n", "Legacy " + theme + " table");
        });
    };

    exports.testPrintTableBorderlessWrapping = function() {
        var rows = [
            { Provider: "Gemini", "llmoptions example": "(type: gemini, model: YOUR_GEMINI_MODEL, key: YOUR_GEMINI_API_KEY)", "Request options": "strategy: structured" },
            { Provider: "Ollama", "llmoptions example": "(type: ollama, url: 'http://localhost:11434', model: YOUR_DECISION_MODEL)", "Request options": "strategy: native, requireProbabilities: true" }
        ];
        var rendered = printTable(rows, 110, true, false, "borderless", __, true, true, true);
        var lines = rendered.split("\n");
        ow.test.assert(lines.length > 6, true, "Provider records wrap onto continuation lines");
        ow.test.assert(lines[1].split("  ").every(function(s) { return /^━+$/.test(s); }), true, "Separate heavy header rules");
        ow.test.assert(lines.filter(function(s) { return s.indexOf("─") >= 0; }).length, 1, "One rule between wrapped provider records");
        ow.test.assert(/[│┼|+]/.test(rendered), false, "No renderer-added borders or junctions");
        ow.test.assert(rendered.indexOf("YOUR_GEMINI_API_KEY") >= 0 && rendered.indexOf("YOUR_DECISION_MODEL") >= 0 && rendered.indexOf("requireProbabilities: true") >= 0,
            true, "Wrapped provider content retained");
        ow.test.assert(lines[lines.length - 1], "[#2 rows]", "Count logical records");
        var noRules = printTable(rows, 110, false, false, "borderless", __, true, false, false);
        ow.test.assert(noRules.indexOf("─"), -1, "Wrapped separators disabled");
        var explicit = printTable([{ A: "first\nsecond\nthird", B: "⚽" }, { A: "short", B: "🇵🇹" }], __, false, false, "borderless", __, true, true, false);
        var explicitLines = explicit.trim().split("\n");
        ow.test.assert(explicitLines.length, 7, "Each record uses its own height, including explicit newlines");
        ow.test.assert(explicitLines[5], "──────  ──", "Rule follows all continuation lines");
        explicitLines.slice(0, -1).forEach(function(line) {
            ow.test.assert(visibleLength(line), visibleLength(explicitLines[0]), "Unicode visible column alignment");
        });
    };

    exports.testTreeTableArraysHeterogeneous = function() {
        var oldFlag = __ansiColorFlag, oldConsole = __conConsole, oldAnsi = __conAnsi;
        try {
            __ansiColorFlag = true;
            __conConsole = true;
            __conAnsi = true;
            ansiColor("RESET", "", true);
            var out = printTreeOrS({ x: [ { a: 1 }, { b: 2 } ], z: [ 1, { c: 3 } ] }, 80, { noansi: true, tableArrays: true });
            ow.test.assert(out.indexOf("b") >= 0 && out.indexOf("2") >= 0, true, "Heterogeneous map rows lost a field: " + out);
            ow.test.assert(out.indexOf("c") >= 0 && out.indexOf("3") >= 0, true, "Mixed scalar/map rows lost a map: " + out);
            ow.test.assert(out.indexOf("undefined") < 0, true, "Heterogeneous rows rendered undefined cells: " + out);

            var tbl = printTreeOrS({ x: [ { a: 1, b: 2 }, { b: 3, a: 4 } ] }, 80, { noansi: true, tableArrays: true });
            ow.test.assert(tbl.indexOf("─") >= 0 || tbl.indexOf("-") >= 0, true, "Homogeneous rows should still render as a table: " + tbl);
            ow.test.assert(tbl.indexOf("\x1b") < 0 && tbl.indexOf("[m") < 0, true, "noansi table leaked ANSI resets: " + tbl);
            var rows = [{ a: "long wrapped value", b: 1 }, { a: "second wrapped value", b: 2 }];
            var plain = printTable(rows, 18, false, false, "utf", __, true, true, false);
            ow.test.assert(plain.indexOf("\x1b"), -1, "Plain wrapped row separators must not emit ANSI");
            var tree = printTreeOrS({ x: rows }, 24, { noansi: true, tableArrays: true });
            ow.test.assert(tree.indexOf("\x1b"), -1, "Plain wrapped tree tables must not emit ANSI");
            ow.test.assert(printTreeOrS({ a: 1 }, 80, { noansi: true }).indexOf("\x1b"), -1, "Plain root tree must not append a reset");
        } finally {
            __ansiColorFlag = oldFlag;
            __conConsole = oldConsole;
            __conAnsi = oldAnsi;
        }
    };

    exports.testDefaultTableFormat = function() {
        var oldFormat = global.__format, oldTable = __colorFormat.table.format;
        var oldAnsi = __conAnsi, oldCon = __con, oldFlag = __ansiColorFlag, oldConsole = __conConsole;
        try {
            global.__format = __;
            __conAnsi = false;
            __con = __;
            var rows = [{ A: "one" }, { A: "two" }];
            ["table", "stable", "ctable", "btable", "bstable"].forEach(function(format) {
                __colorFormat.table.format = format;
                ow.test.assert($output(rows, {}, __, true), $output(rows, { __format: format }, __, true), "Default " + format);
            });
            __colorFormat.table.format = "btable";
            global.__format = "json";
            ow.test.assert($output(rows, {}, __, true), stringify(rows, __, ""), "Global overrides preference");
            ow.test.assert($output(rows, { __format: "json" }, __, true), stringify(rows, __, ""), "Explicit format overrides preference");
            global.__format = __;
            ow.test.assert(__defaultTableFormat(), "btable", "Valid preference retained");
            __colorFormat.table.format = "invalid";
            ow.test.assert(__defaultTableFormat(), __, "Unsupported preference ignored");
        } finally {
            global.__format = oldFormat;
            __colorFormat.table.format = oldTable;
            __conAnsi = oldAnsi;
            __con = oldCon;
            __ansiColorFlag = oldFlag;
            __conConsole = oldConsole;
        }
    };

    exports.testOutputBorderless = function() {
        var oldAnsi = __conAnsi, oldCon = __con, oldFormat = global.__format;
        try {
            __conAnsi = false;
            __con = __;
            var rows = [{ A: "one", B: "1" }, { A: "two", B: "2" }];
            var base = $output(rows, { __format: "btable" }, __, true);
            ow.test.assert(base, "A    B\n━━━  ━\none  1\ntwo  2\n[#2 rows]", "Unicode without ANSI and no default row rules");
            ow.test.assert($o(rows, { __FORMAT: "BTABLE", __WIDTH: "40", __ROWSEP: "true" }, __, true),
                "A    B\n━━━  ━\none  1\n───  ─\ntwo  2\n[#2 rows]", "Output alias and uppercase options");
            ow.test.assert($output(rows, { __format: "btable", __WIDTH: 0, __width: "40", __ROWSEP: true, __rowsep: "false" }, __, true), base, "Lowercase option precedence");
            global.__format = "btable";
            ow.test.assert($output(rows, {}, __, true), base, "Global format selection");
            ow.test.assert($output(rows[0], { __format: "btable" }, __, true).indexOf("[#1 row]") >= 0, true, "Map promoted to one record");
            ow.test.assert($output([], { __format: "btable" }, __, true), "", "Empty array output");
            ow.test.assert($output({}, { __format: "btable" }, __, true), "", "Empty map output");
            ow.test.assert($output({ nested: rows }, { __format: "btable", __path: "nested" }, __, true), base, "Path transform before rendering");
            [0, -1, 1.5, "bad", "", " ", "1.5", true, {}, [], null, Infinity, NaN].forEach(function(width) {
                var error;
                try { $output(rows, { __format: "btable", __width: width }, __, true); } catch(e) { error = String(e); }
                ow.test.assert(isDef(error) && error.indexOf("positive integer") >= 0, true, "Invalid width rejected: " + width);
            });
            __con = { getTerminal: function() { return { getWidth: function() { return 40; } }; } };
            ow.test.assert($output(rows, { __format: "btable" }, __, true), base, "Available terminal width");
            ow.test.assert($output(rows, { __format: "table", __width: 0 }, __, true).indexOf("|" ) >= 0, true, "btable options scoped to btable");
        } finally {
            __conAnsi = oldAnsi;
            __con = oldCon;
            global.__format = oldFormat;
        }
    };

    exports.testPrintTableBorderlessColors = function() {
        var oldAnsi = __ansiColorFlag, oldConsole = __conConsole, oldBand = __colorFormat.table.bandRow;
        try {
            __ansiColorFlag = true;
            __conConsole = true;
            __colorFormat.table.bandRow = "BG_BLUE";
            var rows = [{ A: "first\ncontinuation", B: "1" }, { A: "second\ncontinued", B: "2" }, { A: "third", B: "3" }];
            var colored = printTable(rows, __, false, true, "borderless", __, true, true, true);
            var lines = colored.split("\n");
            var plain = colored.replace(/\033\[[0-9;?]*[ -\/]*[@-~]/g, "");
            ow.test.assert(plain, printTable(rows, __, false, false, "borderless", __, true, true, false), "ANSI does not affect layout");
            var hasBand = function(line) { return /\033\[(?:[0-9]+;)*44(?:;[0-9]+)*m/.test(line); };
            ow.test.assert(hasBand(lines[2]), false, "First record unbanded");
            ow.test.assert(hasBand(lines[3]), false, "First continuation unbanded");
            ow.test.assert(hasBand(lines[5]) && hasBand(lines[6]), true, "Second record and continuation share banding");
            ow.test.assert(hasBand(lines[7]), false, "Rule unbanded");
            ow.test.assert(hasBand(lines[8]), false, "Third record unbanded");
            var input = [{ A: ansiColor("RED", "⚽ alpha beta gamma"), B: "x" }, { A: "short", B: "y" }];
            var wrapped = printTable(input, 18, false, true, "borderless", __, true, true, false).replace(/\033\[[0-9;?]*[ -\/]*[@-~]/g, "");
            ow.test.assert(wrapped.indexOf("alpha") >= 0 && wrapped.indexOf("gamma") >= 0, true, "ANSI input wraps without losing content");
            wrapped.trim().split("\n").slice(0, -1).forEach(function(line) {
                ow.test.assert(visibleLength(line) <= 18, true, "Wrapped ANSI input visible width");
            });
        } finally {
            __ansiColorFlag = oldAnsi;
            __conConsole = oldConsole;
            __colorFormat.table.bandRow = oldBand;
        }
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

    exports.testWithMDLists = function() {
        var md = (txt, w) => ow.format.withMD(txt, __, w).replace(/\033\[[0-9;?]*[ -\/]*[@-~]/g, "");
        var eq = (txt, w, exp, msg) => ow.test.assert(md(txt, w), exp, "Problem with markdown " + msg + ".");

        // marker variants
        eq("* a\n- b\n+ c", 40, "\u2022 a\n\u2022 b\n\u2022 c", "bullet markers");
        eq("1) a\n2) b", 40, "1) a\n2) b", "parenthesis numbering");
        eq("---", 5, "\u2500\u2500\u2500\u2500\u2500", "line rule");
        eq("-1 and -x", 40, "-1 and -x", "non list dashes");

        // hanging indent and nesting glyphs
        eq("* alpha beta gamma delta\n  * one two three four five", 14,
           "\u2022 alpha beta\n  gamma delta\n  \u25e6 one two\n    three\n    four five", "nested bullet wrap");
        eq("* a\n  * b\n    * c\n      * d", 40, "\u2022 a\n  \u25e6 b\n    \u25aa c\n      \u2022 d", "bullet glyph per level");

        // number alignment (also with sub numbering)
        eq("9. nine\n10. ten\n    1. sub item with some more words", 20,
           " 9. nine\n10. ten\n    1. sub item\n       with some\n       more words", "right aligned numbers");

        // continuation lines are merged and rewrapped, a blank line then text ends the list
        eq("* one two three\n  four five six\nafter", 40, "\u2022 one two three four five six after", "list lazy continuation");
        eq("* one\n\nafter list", 40, "\u2022 one\n\nafter list", "list end");
        eq("* one\n\n  loose para\n* two", 40, "\u2022 one\n\n  loose para\n\u2022 two", "loose list paragraph");

        // tasks
        eq("- [ ] open task\n- [x] done task", 40, "\u2610 open task\n\u2611 done task", "task list");

        // quotes with lists are a single side line block
        eq("> * a\n> * b", 40, "\u2502 \u2022 a\n\u2502 \u2022 b", "blockquote list");

        // table after list
        var t = md("* a\n| x | y |\n|---|---|\n| 1 | 2 |", 40);
        ow.test.assert(t.split("\n")[0], "\u2022 a", "Problem with markdown list before table.");
        ow.test.assert(t.indexOf("x") > 0 && t.indexOf("2") > 0, true, "Problem with markdown table after list.");

        // every rendered line fits the width
        md("* " + repeat(30, "word ") + "\n  * " + repeat(30, "word "), 30).split("\n").forEach(line => {
            ow.test.assert(visibleLength(line) <= 30, true, "Problem with markdown list line width.");
        });
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

    exports.testOutputMarkdown = function() {
        var data = { title: "Example", metadata: { active: true }, entries: [ { name: "first", score: 1 }, { name: "second", score: 2 } ], tags: [ "one", "two" ], details: { text: "first line\nsecond line", nested: { enabled: true } } }
        var structured = $output(data, { __format: "md" }, __, true)
        ow.test.assert(structured.indexOf("# title") >= 0, true, "Problem with structured Markdown headings.")
        ow.test.assert(structured.indexOf("| Field | Value |") >= 0, true, "Problem with structured Markdown map table.")
        ow.test.assert(structured.indexOf("| name | score |") >= 0, true, "Problem with structured Markdown array table.")
        ow.test.assert(structured.indexOf("- one") >= 0, true, "Problem with structured Markdown list.")
        ow.test.assert(structured.indexOf("# text\n\n```\nfirst line\nsecond line\n```") >= 0, true, "Problem with structured Markdown string code block.")
        ow.test.assert(structured.indexOf("# title\n\n```\nExample\n```") >= 0, true, "Problem with a scalar string in a mixed Markdown object.")
        var flatMap = $output({ title: "Example", active: true }, { __format: "md" }, __, true)
        ow.test.assert(flatMap.indexOf("| title | Example |") >= 0, true, "Problem with a flat Markdown map table.")

        var markdown = $output("# Heading\n\nParagraph", { __format: "md" }, __, true)
        ow.test.assert(markdown.indexOf("```") < 0, true, "Problem with raw Markdown string rendering.")

        var json = $output(data, { __format: "md", mdformat: "json" }, __, true)
        ow.test.assert(json.indexOf("```json") >= 0 && json.indexOf('"metadata"') >= 0, true, "Problem with JSON Markdown code block.")

        var yaml = $output(data, { __format: "md", mdformat: "yaml" }, __, true)
        ow.test.assert(yaml.indexOf("```yaml") >= 0 && yaml.indexOf("metadata:") >= 0, true, "Problem with YAML Markdown code block.")
    };

    exports.testWithSideLineEmojiHeaderFooter = function() {
        var rendered = ow.format.withSideLine("x", 8, __, __, ow.format.withSideLineThemes().closedRect, {
            header: "👨‍👩‍👧‍👦",
            headerAlign: "left",
            footer: "🏳️‍🌈",
            footerAlign: "left"
        });
        var plain = rendered.replace(/\033\[[0-9;?]*[ -\/]*[@-~]/g, "");
        var lines = plain.split("\n");

        ow.test.assert(lines[0], "┌──👨‍👩‍👧‍👦──┐", "Problem with withSideLine emoji header width.");
        ow.test.assert(lines[1], "│ x    │", "Problem with withSideLine emoji body width.");
        ow.test.assert(lines[2], "└──🏳️‍🌈──┘", "Problem with withSideLine emoji footer width.");
        lines.forEach(line => {
            ow.test.assert(visibleLength(line), 8, "Problem with withSideLine emoji visible width.");
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

    exports.testPrintChartArray = function() {
        var single = printChartArray([1, 4, 2, 5, 3], "int", 20, 6, 5, 0, { colors: ["GREEN"] });
        ow.test.assert(isString(single), true, "Problem with printChartArray returning a string.");
        ow.test.assert(single.split("\n").length, 6, "Problem with printChartArray height.");

        var multiple = printChartArray([[1, 2, 3], [3, 2, 1]], "dec1", 20, 5);
        ow.test.assert(isString(multiple), true, "Problem with multi-series printChartArray.");
        ow.test.assert(multiple.indexOf("3.0") >= 0, true, "Problem with printChartArray decimal formatting.");
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

    exports.testPrintHeatmap = function() {
        // matrix mode (pre-existing behavior)
        var matrix = ow.format.printHeatmap([[1, 2, 3], [4, 5, 6], [7, 8, 9]], { width: 20, height: 4, palette: "none" });
        ow.test.assert(isString(matrix), true, "Problem with printHeatmap matrix mode returning string.");

        var emptyMatrix = ow.format.printHeatmap([], { palette: "none" });
        ow.test.assert(emptyMatrix.indexOf("empty") >= 0, true, "Problem with empty matrix heatmap fallback.");

        // time-bucketed mode: date keys, default axes (week x weekday calendar); spans several months so
        // month-boundary columns have room to be labeled without colliding
        var dateData = {};
        var dayZero = Date.UTC(2025, 10, 1) / 86400000; // 2025-11-01
        for (var d = 0; d < 120; d++) {
            var dt = new Date((dayZero + d) * 86400000);
            var key = dt.getUTCFullYear() + "-" + String(dt.getUTCMonth() + 1).padStart(2, "0") + "-" + String(dt.getUTCDate()).padStart(2, "0");
            dateData[key] = d % 5;
        }
        var cal = ow.format.printHeatmap(dateData, { legend: true, palette: "none" });
        ow.test.assert(isString(cal), true, "Problem with printHeatmap calendar mode returning string.");
        ow.test.assert(cal.indexOf("Mon") >= 0, true, "Problem with printHeatmap calendar weekday label.");
        ow.test.assert(cal.indexOf("Dec") >= 0, true, "Problem with printHeatmap calendar month label.");
        ow.test.assert(cal.indexOf("Less") >= 0 && cal.indexOf("More") >= 0, true, "Problem with printHeatmap calendar legend.");

        // time-bucketed mode: date-time keys, explicit punch-card axes (hour x weekday)
        var dtData = { "2026-01-05T09:00": 3, "2026-01-05T09:30": 2, "2026-01-06T18:00": 5 };
        var punch = ow.format.printHeatmap(dtData, { xAxis: "hour", yAxis: "weekday", palette: "none" });
        ow.test.assert(isString(punch), true, "Problem with printHeatmap punch-card mode returning string.");
        ow.test.assert(punch.indexOf("00") >= 0 && punch.indexOf("23") >= 0, true, "Problem with printHeatmap punch-card hour header.");

        // aggregation: two entries in the same day/hour bucket should sum by default
        var aggLine = punch.split("\n")[1];
        ow.test.assert(isString(aggLine), true, "Problem with printHeatmap punch-card aggregation row.");

        // time-bucketed mode: time-only keys, single hour row (hour header row + one data row)
        var timeData = { "08:00": 1, "09:00": 4, "10:00": 8 };
        var single = ow.format.printHeatmap(timeData, { palette: "none" });
        ow.test.assert(single.split("\n").length, 2, "Problem with printHeatmap time-only single row line count.");
        ow.test.assert(single.indexOf("00") >= 0 && single.indexOf("23") >= 0, true, "Problem with printHeatmap time-only hour header.");

        // error path: axis not derivable from the detected key type
        var err = ow.format.printHeatmap(timeData, { xAxis: "week" });
        ow.test.assert(err.indexOf("Err:") >= 0, true, "Problem with printHeatmap axis validation error.");

        // exposed through printDashboard's heatmap widget
        var dash = ow.format.printDashboard([{ type: "heatmap", data: dateData, title: "Activity" }], { width: 40, height: 8, palette: "none" });
        ow.test.assert(isString(dash), true, "Problem with printDashboard heatmap widget (time-bucketed data).");
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
        ow.test.assert(af.fromSLON(ow.format.toSLON({ p: "C:\\temp\\x" })).p, "C:\\temp\\x", "Problem with toSLON backslash round trip.");

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

    // Explicit snapshots keep these render tests independent of the host terminal.
    function vizOpts(extra) {
      return merge({ palette: "none", capabilities: { width: 80, height: 24, unicode: true, ansi: true, colorMode: "none" } }, extra || {})
    }
    function vizBounds(text, w, h) {
      ow.test.assert(text.split("\n").length <= h, true, "Height budget")
      text.split("\n").forEach(function(line) {
        ow.test.assert(visibleLength(line) <= w, true, "Column budget")
        ow.test.assert(/\x1b(?!\[[0-9;:]*m|\]8;)/.test(line), false, "Only complete styling escapes")
      })
    }
    function vizThrows(fn) {
      var threw = false
      try { fn() } catch(e) { threw = true }
      ow.test.assert(threw, true, "Invalid data must throw")
    }
    exports.testAnsiClipClusters = function() {
      var S = ow.format.string
      ;["😀", "e\u0301", "👨‍👩‍👧‍👦", "🇵🇹", "👍🏽", "🏴\uDB40\uDC67\uDB40\uDC62\uDB40\uDC7F"].forEach(function(cluster) {
        var width = visibleLength(cluster)
        ow.test.assert(S.ansiClip(cluster + "xyz", width, ""), cluster, "Whole grapheme")
      })
      ow.test.assert(S.ansiClip("abc", 0), "", "Zero width")
      ow.test.assert(S.ansiClip("a\nb",10,""),"a\nb","Retain legacy line breaks")
      ow.test.assert(S.ansiClip("\x1b[2Kabc",2,""),"\x1b[2Kab","Retain complete CSI controls")
      ow.test.assert(visibleLength("\x1b[38:2::255:0:0mX\x1b[0m"),1,"Colon SGR display width")
      ow.test.assert(af.visibleLength("\x1b[38:2::255:0:0mX\x1b[0m"),1,"Java colon SGR display width")
      ow.test.assert(ansiLength("\x1b[38:2::255:0:0mX\x1b[0m",true,true),1,"ANSI length compatibility")
      ow.test.assert(visibleLength(S.ansiClip("\x1b[38:2::255:0:0mABC\x1b[0m",2,"")),2,"Colon SGR clipping")
      ow.test.assert(S.ansiClip("abc", 1, "long").length <= 1, true, "Ellipsis budget")
      var clipped = S.ansiClip("\x1b[31;44mabcdef", 3, "")
      ow.test.assert(visibleLength(clipped), 3, "Styled clipping")
      ow.test.assert(clipped.endsWith("\x1b[0m"), true, "Close foreground/background")
      ow.test.assert(S.ansiClip("\x1b[31mx", 3, "").endsWith("\x1b[0m"), true, "Close untruncated styling")
      var link = S.ansiClip("\x1b]8;;https://example.test\x1b\\hello\x1b]8;;\x1b\\", 2, "")
      ow.test.assert(link.endsWith("\x1b]8;;\x1b\\"), true, "Close hyperlink")
    }
    exports.testVizCanvasUnicode = function() {
      var c = ow.format.viz.createCanvas({ width: 6, height: 2 })
      c.write(0, 0, "界e\u0301😀")
      ow.test.assert(visibleLength(c.render().split("\n")[0]), 6, "Canvas columns")
      c.write(0, 1, "x")
      ow.test.assert(c.render().split("\n")[0].indexOf("界"), -1, "Clear bisected wide glyph")
      c.write(1, 5, "😀")
      ow.test.assert(c.render().split("\n")[1], "      ", "Wide glyph cannot straddle boundary")
      var fill = ow.format.viz.layout.padLines("", 3, 1, "\x1b[31m ")
      ow.test.assert(fill.endsWith("\x1b[0m"),true,"Styled fill closes state")
      var p = ow.format.viz.layout.padLines("\x1b[31m界abc", 4, 2)
      p.split("\n").forEach(function(l) { ow.test.assert(visibleLength(l), 4, "Exact layout width") })
    }
    exports.testTermCapabilitiesOverrides = function() {
      var base = ow.format.term.getCapabilities({ refresh: true })
      var modified = ow.format.term.getCapabilities({ width: 17, height: 9, unicode: false, ansi: false })
      ow.test.assert(modified.width, 17, "Local width")
      ow.test.assert(modified.colorMode, "none", "ANSI disable")
      ow.test.assert(ow.format.term.getCapabilities().width, base.width, "Cache isolation")
    }
    exports.testVizRasterEncoders = function() {
      var items = [{ color: OpenWrap.format.__colors.parseColor("BLUE"), share: 1 }]
      var bits = [[1,8],[2,16],[4,32],[64,128]]
      for (var y = 0; y < 4; y++) for (var x = 0; x < 2; x++) {
        var r = ow.format.viz._createRaster(1, 1, "braille")
        r.set(x, y, 0)
        var line = r.render(items, { colorMode: "16" })[0].replace(/\x1b\[[0-9;]*m/g, "")
        ow.test.assert(line.charCodeAt(0), 0x2800 + bits[y][x], "Braille mapping")
      }
      var r = ow.format.viz._createRaster(1, 1, "halfblock")
      r.set(0, 0, 0)
      ow.test.assert(r.render(items, { colorMode: "16" })[0].indexOf("▀") >= 0, true, "Upper half")
      r.set(0, 1, 0)
      ow.test.assert(r.render(items, { colorMode: "16" })[0].indexOf("█") >= 0, true, "Both halves")
      var two=[{color:OpenWrap.format.__colors.parseColor("RED"),share:0.5},{color:OpenWrap.format.__colors.parseColor("BLUE"),share:0.5}]
      r.set(0,0,0);r.set(0,1,1)
      ow.test.assert(r.render(two,{colorMode:"16"})[0].indexOf("\x1b[31;44m▀")>=0,true,"Independent upper foreground/lower background")
      r.set(0,0,-1)
      ow.test.assert(r.render(two,{colorMode:"16"})[0].indexOf("\x1b[34;49m▄")>=0,true,"Boundary uses terminal default background")
      var braille=ow.format.viz._createRaster(1,1,"braille")
      for(var y=0;y<4;y++){braille.set(0,y,0);braille.set(1,y,1)}
      ow.test.assert(braille.render(two,{colorMode:"16"})[0].indexOf("\x1b[31;49m⣿")>=0,true,"Full mask and stable boundary tie")
    }
    exports.testPrintPieDonut = function() {
      var cases = [[100], [50,50], [50,30,20], [0,1,0], [1e-10,1], [1e308,1e308], [], [0,0]]
      ;["printPie", "printDonut"].forEach(function(name) {
        cases.forEach(function(values) {
          ;["ascii", "braille", "halfblock"].forEach(function(mode) {
            ;["none", "16", "256", "truecolor"].forEach(function(palette) {
              var opts = vizOpts({ width: 32, height: 10, mode: mode, palette: palette, centerText: "65%", size: "medium" })
              var text = ow.format[name](values, opts)
              vizBounds(text, 32, 10)
              ow.test.assert(text, ow.format[name](values, opts), "Deterministic frame")
              if (palette == "none") ow.test.assert(text.indexOf("\x1b"), -1, "No ANSI")
            })
          })
        })
        ;[[-1], [NaN], [Infinity], [null], ["2"], [{value:1,color:"invalid"}]].forEach(function(v) {
          vizThrows(function() { ow.format[name](v, vizOpts()) })
        })
        for (var w = 0; w < 12; w++) vizBounds(ow.format[name]([50,30,20], vizOpts({ width:w, height:3 })), w, 3)
      })
      var opts = vizOpts({ mode:"ascii", legend:"none", width:12, height:5 })
      ;["printPie","printDonut"].forEach(function(name){
        var full=ow.format[name]([1],vizOpts({size:"small",mode:"ascii",legend:"none",width:24,height:12}))
        ow.test.assert(full.split("\n").length,12,"Explicit height overrides small preset")
        full.split("\n").forEach(function(l){ow.test.assert(visibleLength(l),24,"Explicit width overrides small preset")})
        ow.test.assert(ow.format[name]([1],vizOpts({size:"small",mode:"ascii",legend:"none",width:24})),full,"Width derives height from aspect")
        ow.test.assert(ow.format[name]([1],vizOpts({size:"small",mode:"ascii",legend:"none",height:12})),full,"Height derives width from aspect")
      })
      var overflow = ow.format.printDonut([1],vizOpts({width:12,height:5,innerRadius:0.1,centerText:"oversized",legend:"none"}))
      ow.test.assert(overflow.indexOf("oversized")>=0,true,"Overflow label has a safe textual fallback")
      var textDonut = ow.format.printDonut([1],vizOpts({size:"medium",innerRadius:0.7,centerText:"65%",legend:"none"}))
      ow.test.assert(textDonut.indexOf("65%")>=0,true,"Centre label fits hole")
      vizBounds(ow.format.printDonut([1],vizOpts({innerRadius:0.1,centerText:"too wide",centerTextOverflow:"clip",width:12,height:5,legend:"none"})),12,5)
      ;["16","256","truecolor"].forEach(function(palette){
        var frame=ow.format.printPie([50,50],vizOpts({palette:palette,mode:"halfblock",legend:"none"}))
        if (isUnDef(getEnv("NO_COLOR"))) ow.test.assert(frame.indexOf("\x1b[")>=0,true,"Enabled colour emits ANSI")
      })
      ow.test.assert(ow.format.printPie([100], opts), "   AAAAAA   \n AAAAAAAAAA \n AAAAAAAAAA \n AAAAAAAAAA \n   AAAAAA   ", "Single-slice ASCII golden")
      var a = ow.format.printPie([1,1], opts)
      ow.test.assert(a != ow.format.printPie([1,1], merge(opts, {startAngle:0})), true, "Rotation changes sectors")
      ow.test.assert(ow.format.printDonut([1,1], merge(opts, {innerRadius:0})), a, "Shared geometry")
      vizThrows(function() { ow.format.printDonut([1], vizOpts({innerRadius:1})) })
      var grouped = ow.format.printPie(Array.from({length:15}, function() {return 1}), vizOpts({width:50,height:20}))
      ow.test.assert(grouped.indexOf("Other (4)") >= 0, true, "Visible aggregation")
      var large=ow.format.printPie(Array.from({length:13},function(){return 1e308}),vizOpts({width:100,height:10,maxCategories:2,showValue:true}))
      ow.test.assert(large.indexOf("sum >")>=0,true,"Aggregated overflow is explicit")
      ;[-1,NaN,Infinity,1.5].forEach(function(width){vizThrows(function(){ow.format.printPie([1],vizOpts({width:width}))})})
      var before = [{label:"A",value:1},{label:"A",value:2}]
      var saved = stringify(before)
      ow.format.printPie(before, vizOpts())
      ow.test.assert(stringify(before), saved, "Input immutable")
    }
    exports.testPrintStackedDistributions = function() {
      var o = vizOpts({ width:10, showPercent:false })
      ow.test.assert(ow.format.printStackedBar([1,2],merge(o,{width:1})),"B","Tiny bar uses largest remainder")
      var compact = ow.format.printStackedBar([50,30,20],vizOpts({width:40}))
      ow.test.assert(visibleLength(compact),40,"Compact bar exact width")
      ow.test.assert(compact.indexOf("A:50%")>0,true,"Bar and percentages share one line")
      ow.test.assert(ow.format.printStackedBar([50,30,20], o), "AAAAABBBCC", "Exact Hamilton allocation")
      ow.test.assert(ow.format.printStackedBar([1,1,1], merge(o,{width:5})), "AABBC", "Stable ties")
      ow.test.assert(ow.format.printStackedBar([5], merge(o,{normalize:false,max:10})), "AAAAA     ", "Unused absolute range")
      vizThrows(function(){ ow.format.printStackedBar([11],merge(o,{normalize:false,max:10})) })
      var columns = [{label:"one",values:{A:50,B:50}}, {label:"two",values:{B:25,C:75}}]
      vizBounds(ow.format.printStackedColumns(columns,vizOpts({width:20,height:8})),20,8)
      vizThrows(function(){ow.format.printStackedColumns(columns,vizOpts({width:1}))})
      ;["none","16","256","truecolor"].forEach(function(palette){
        for(var w=1;w<50;w++) vizBounds(ow.format.printStackedBar([0.01,0,3,5,8],vizOpts({width:w,palette:palette})),w,1)
      })
    }
    exports.testDashboardCategoryWidgets = function() {
      var types = ["pie","donut","stackedBar","stackedColumns"]
      var widgets = types.map(function(t){return {type:t,title:"界😀",data:t=="stackedColumns"?[{label:"x",values:[50,30,20]}]:[50,30,20]}})
      var dashboard = ow.format.printDashboard([widgets],vizOpts({width:100,height:12,borderStyle:"rect"}))
      vizBounds(dashboard,100,12)
      ow.test.assert(dashboard.indexOf("Err:"),-1,"All category widgets integrated")
      dashboard.split("\n").forEach(function(l){ow.test.assert(visibleLength(l),100,"Dashboard width")})
      var grid = ow.format.string.grid([[{type:"pie",obj:[50,30,20],options:vizOpts()},{type:"donut",obj:[1,1],options:vizOpts()}]],8,60," ",true)
      ow.test.assert(grid.indexOf("Err:"),-1,"Grid widgets")

      var compact=ow.format.printDashboard([{type:"pie",data:[1],options:{size:"small",mode:"ascii",legend:"none"}}],vizOpts({width:40,height:12,border:false}))
      ow.test.assert(compact.split("\n").filter(function(l){return l.indexOf("A")>=0}).length,5,"Dashboard budget preserves preset")
      var expanded=ow.format.printDashboard([{type:"pie",data:[1],options:{size:"small",mode:"ascii",legend:"none",width:24,height:12}}],vizOpts({width:40,height:12,border:false}))
      ow.test.assert(expanded.split("\n").filter(function(l){return l.indexOf("A")>=0}).length,12,"Widget explicit dimensions override preset")
      var diff = ow.format.viz.diffFrames("a\nb\nc","x")
      ow.test.assert(diff.patch.indexOf("undefined"),-1,"Pure cursor patch")
      ow.test.assert(diff.patch.endsWith("\x1b[2A\r"),true,"Shrink restores origin")
    }
    exports.testVizLiveCategoryFrames = function() {
      var caps = {width:32,height:8,ansi:false,unicode:false,colorMode:"none"}, sizes = []
      var ctrl
      try {
        ctrl = ow.format.viz.live(function(ctx) {
          sizes.push(ctx.size.width)
          return ow.format.printDonut([50,30,20],{width:ctx.size.width,height:ctx.size.height,capabilities:ctx.capabilities,palette:"none"})
        },{autoStart:false,watchResize:false,capabilities:caps})
        ctrl.update()
        caps.width = 20
        ctrl.update()
        ow.test.assert(sizes,[32,20],"Fresh resize context")
        ow.test.assert(ctrl.stats().rendered,2,"Frames rendered")
        ow.test.assert(ctrl.stats().errors,0,"No live errors")
      } finally {
        if (ctrl) ctrl.stop()
      }
    }
    exports.testVizCategoryBenchmark = function() {
      var r = ow.format.viz.benchmarkRender(function() {
        return ow.format.printPie([50,30,20], vizOpts({size:"medium",legend:"none"}))
      },{iterations:5})
      ow.test.assert(r.iterations,5,"Benchmark sample count")
      ow.test.assert(r.p95Ms >= r.p50Ms,true,"Ordered render timings")
    }

    exports.testPrintDivergingBars = function() {
      var o = vizOpts({width:11,labels:false,showValue:false,unicode:false})
      ow.test.assert(ow.format.printDivergingBars([-10,0,10],o),"-----|     \n     |     \n     |+++++","Signed axis golden")
      var inputs = [[-10,5],{decrease:-10,increase:5},[{label:"界",value:-1},{label:"up",value:2}],[0,0],[],[-1e308,1e308]]
      inputs.forEach(function(v) {
        for(var w=0;w<45;w++) vizBounds(ow.format.printDivergingBars(v,vizOpts({width:w,height:4})),w,4)
      })
      ow.test.assert(ow.format.printDivergingBars([-1,2],vizOpts({width:40,height:1})).indexOf("(2 rows)")==0,true,"Announce omitted signed rows")
      var asymmetric=ow.format.printDivergingBars([-10,30],merge(o,{symmetric:false}))
      ow.test.assert(asymmetric.split("\n")[0].indexOf("|"),3,"Proportional asymmetric axis")
      ;[[NaN],[Infinity],["1"],[null]].forEach(function(v){vizThrows(function(){ow.format.printDivergingBars(v,o)})})
      vizThrows(function(){ow.format.printDivergingBars([-1,1],merge(o,{min:0}))})
      var v=[{label:"same",value:-5},{label:"same",value:5}], saved=stringify(v)
      ow.format.printDivergingBars(v,vizOpts())
      ow.test.assert(stringify(v),saved,"Signed input immutable")
    }
    exports.testPrintTreemap = function() {
      var o=vizOpts({width:8,height:4,labels:false,legend:"none"})
      ow.test.assert(ow.format.printTreemap([1,1],o),"AAAABBBB\nAAAABBBB\nAAAABBBB\nAAAABBBB","Balanced slicing golden")
      ow.test.assert(ow.format.printTreemap([1],o),repeat(4,"AAAAAAAA\n").slice(0,-1),"Single category fills map")
      var sample=[{label:"Large 界",value:100},{label:"Tiny",value:1e-20},{label:"Zero",value:0}]
      var tiny=ow.format.printTreemap(sample,vizOpts({width:35,height:8,legend:"right"}))
      ow.test.assert(tiny.indexOf("*")>=0,true,"Tiny rectangles reported")
      ow.test.assert(tiny.indexOf("<0.1%")>=0,true,"Positive tiny proportions not reported as zero")
      ;["none","16","256","truecolor"].forEach(function(palette){
        for(var w=0;w<22;w++) {
          var opts=vizOpts({width:w,height:7,palette:palette,legend:"bottom"})
          var a=ow.format.printTreemap([50,30,20],opts)
          vizBounds(a,w,7)
          ow.test.assert(a,ow.format.printTreemap([50,30,20],opts),"Stable rectangles")
        }
      })
      ow.test.assert(ow.format.printTreemap([],o),"(empty)","Empty map")
      ow.test.assert(ow.format.printTreemap([0],o).indexOf("no data")>=0,true,"Zero map")
      vizThrows(function(){ow.format.printTreemap([-1],o)})
      vizThrows(function(){ow.format.printTreemap([1],merge(o,{cellAspect:0}))})
    }
    exports.testSparklineEnhancements = function() {
      var o=vizOpts({width:20,min:0,max:10,unicode:false})
      ow.test.assert(ow.format.printSparkline([0,5,10],o),"_=#","Fixed-range ASCII")
      ow.test.assert(ow.format.printSparkline([0,null,10],o),"_ #","Missing gap")
      ow.test.assert(ow.format.printSparkline([0,null,10],merge(o,{missing:"skip"})),"_#","Missing skip")
      ow.test.assert(ow.format.printSparkline([0,5,10],merge(o,{markMin:true,markMax:true,trend:true})),"v=^ +","Markers and trend")
      vizThrows(function(){ow.format.printSparkline([1,null],merge(o,{missing:"error"}))})
      vizThrows(function(){ow.format.printSparkline([Infinity],o)})
      vizThrows(function(){ow.format.printSparkline([1],merge(o,{min:2,max:1}))})
      var colored=vizOpts({width:30,palette:"truecolor",thresholds:[{value:5,color:"RED"}],highlightLast:"GREEN",colorScale:{min:0,max:10,colors:["BLUE","YELLOW"]}})
      var a=ow.format.printSparkline([0,5,10],colored)
      if(isUnDef(getEnv("NO_COLOR"))) {
        ow.test.assert(a.indexOf("38;2;205;49;49")>=0,true,"Threshold colour")
        ow.test.assert(a.indexOf("38;2;13;188;121")>=0,true,"Last value takes precedence")
      }
      for(var w=0;w<20;w++) vizBounds(ow.format.printSparkline([{name:"界",data:[-1e308,null,1e308]}],merge(o,{width:w,label:"😀",trend:true,showMinMax:true})),w,1)
      var legacy=ow.format.printSparkline([1,5,3,8],{width:3,palette:"none"})
      ow.test.assert(legacy,ow.format.printSparkline([1,5,3,8],vizOpts({width:3})),"Capabilities preserve legacy sampling")
    }
    exports.testPhase5DashboardWidgets = function() {
      var d=ow.format.printDashboard([[{type:"divergingBars",data:{down:-10,up:20}},{type:"treemap",data:{A:50,B:30,C:20}}]],vizOpts({width:70,height:10,borderStyle:"rect"}))
      vizBounds(d,70,10)
      ow.test.assert(d.indexOf("Err:"),-1,"Phase 5 widgets")
      var grid=ow.format.string.grid([[{type:"treemap",obj:[50,30,20],options:vizOpts()},{type:"divergingBars",obj:[-10,20],options:vizOpts()}]],8,60," ",true)
      ow.test.assert(grid.indexOf("Err:"),-1,"Phase 5 grid integration")
    }

    exports.testVizWatchResize = function() {
      var queue=new java.util.concurrent.LinkedBlockingQueue(), width=new java.util.concurrent.atomic.AtomicInteger(40), reads=new java.util.concurrent.atomic.AtomicInteger(0), shared={width:40,height:10}
      var watch=ow.format.viz.watchResize(function(next,prev){ queue.offer(String(prev.width)+">"+String(next.width)) },{
        interval:10,getCapabilities:function(){reads.incrementAndGet();shared.width=Number(width.get());return shared}
      })
      try {
        width.set(24)
        var event=queue.poll(2,java.util.concurrent.TimeUnit.SECONDS)
        ow.test.assert(String(event),"40>24","Resize callback previous/next dimensions")
      } finally {watch.stop()}
      var n=Number(reads.get())
      sleep(50,true)
      ow.test.assert(Number(reads.get()),n,"Stopped resize timer performs no reads")
    }
    exports.testVizFrameTerminalState = function() {
      var rows=[], row=0, col=0, fg="default", bg="default"
      function consume(frame) {
        for(var i=0;i<frame.length;) {
          var c=/^\x1b\[([0-9;]*)([A-Za-z])/.exec(frame.slice(i))
          if(c) {
            var p=c[1].split(";").map(Number)
            if(c[2]=="A") row=Math.max(0,row-(p[0]||1))
            else if(c[2]=="K" && p[0]==2) rows[row]=[]
            else if(c[2]=="m") {
              for(var j=0;j<p.length;j++) {
                if(p[j]==0){fg="default";bg="default"}
                else if(p[j]==39) fg="default"
                else if(p[j]==49) bg="default"
                else if(p[j]>=30&&p[j]<=37) fg=String(p[j])
                else if(p[j]>=40&&p[j]<=47) bg=String(p[j])
              }
            }
            i+=c[0].length
          } else if(frame.charAt(i)=="\r") {col=0;i++}
          else if(frame.charAt(i)=="\n") {row++;i++}
          else {
            var t=ow.format.string._nextWrapToken(frame,i)
            if(!rows[row]) rows[row]=[]
            rows[row][col]={text:t.token,fg:fg,bg:bg}
            for(var j=1;j<t.width;j++) rows[row][col+j]={text:"",fg:fg,bg:bg}
            col+=t.width;i=t.next
          }
        }
      }
      consume("\x1b[31;44mOLD\x1b[0m\r\nremoved\r\nalso removed")
      var next="\x1b[32;45m界\x1b[0m x"
      consume(ow.format.viz.diffFrames("\x1b[31;44mOLD\x1b[0m\nremoved\nalso removed",next).patch)
      ow.test.assert(row,0,"Shrinking frame returns cursor to the final new row")
      ow.test.assert(rows[0].map(function(c){return c.text}).join(""),"界 x","Wide next frame")
      ow.test.assert(rows[0][0].fg,"32","Changed foreground")
      ow.test.assert(rows[0][0].bg,"45","Changed background")
      ow.test.assert(rows[0][3].bg,"default","No background leak to adjacent text")
      ow.test.assert(rows[1].length+rows[2].length,0,"Removed rows cleared")
      consume(ow.format.viz.diffFrames(next,"a\nb").patch)
      ow.test.assert(row,1,"Growing frame cursor origin")
      ow.test.assert(rows[0][0].text+rows[1][0].text,"ab","Growing frame content")
    }
})();
