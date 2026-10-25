// Copyright 2026 Nuno Aguiar
(function() {
  function temporary(fn) {
    var path = io.createTempDir("odoc-test-");
    try { return fn(path); } finally { io.rm(path); }
  }
  function entries(text) {
    return { shared: { k: "shared()", t: text } };
  }
  exports.testMemoryAndSearch = function() {
    loadHelp();
    temporary(function(path) {
      var docs = new ODocs(path, { one: entries("one"), two: entries("two"), three: { Shared: { k: "Shared()", t: "three" } } }, [], true);
      var loads = 0, original = docs.load;
      docs.load = function() { loads++; return original.apply(docs, arguments); };
      ow.test.assert(docs.get("one", "shared").t, "one", "Supplied entries must be retrievable");
      ow.test.assert(docs.get("one", "shared").t, "one", "Repeated retrieval must retain entries");
      ow.test.assert(loads, 0, "Cached entries must not reload");
      ow.test.assert(docs.search("shared"), [{ id: "one", key: "shared" }, { id: "two", key: "shared" }], "Exact duplicates must retain subjects");
      ow.test.assert(docs.search("SHARED").length, 3, "Case-insensitive exact matches must span subjects");
      ow.test.assert(docs.search("shar", ["two"]), [{ id: "two", key: "shared" }], "Subject filters must apply to partial matches");
      ow.test.assert(docs.search("absent"), [], "Missing search must be empty");
      ow.test.assert(isUnDef(docs.get("absent", "missing")), true, "Missing subjects must not throw");
      ow.test.assert(isUnDef(docs.get("one", "missing")), true, "Missing keys must not throw");
    });
  };
  exports.testStoragePaths = function() {
    loadHelp(); plugin("ZIP");
    temporary(function(path) {
      new ODocs(path, { one: entries("one") }, [], true).save();
      new ODocs(path, { two: entries("two") }, [], true).save();
      var container = new ZIP();
      try {
        container.putFile(".odoc.db", io.readFileBytes(path + "/.odoc.db"));
        io.writeFileBytes(path + "/nested.jar", container.generate());
      } finally { container.close(); }
      io.cp(path + "/.odoc.db", path + "/direct.zip");
      [path, path + "/", path + "/.odoc.db", path + "/direct.zip", path + "/nested.jar"].forEach(function(location) {
        var docs = new ODocs(location, __, [], true);
        ow.test.assert(docs.search("shared").length, 2, "Constructor must load index from " + location);
        ow.test.assert(docs.get("one", "shared").t, "one", "Existing local subject must survive append");
        ow.test.assert(docs.get("two", "shared").t, "two", "Second local subject must load");
        delete docs.aodocs.one;
        docs.load("one");
        ow.test.assert(docs.get("one", "shared").t, "one", "Remembered source must load without a filename");
      });
    });
  };
  exports.testOffline = function() {
    loadHelp();
    temporary(function(path) {
      var docs = new ODocs(path, __, ["https://invalid.example"], true);
      ow.test.assert(docs.loadWeb("missing"), false, "Direct web loading must honor offline");
      docs.backgroundLoadWeb("missing");
      var calls = 0;
      docs.load = function() { throw new Error("unavailable"); };
      docs.loadWeb = function() { calls++; };
      docs.backgroundLoadWeb = function() { calls++; };
      docs.loadFile();
      docs.get("missing", "missing");
      ow.test.assert(calls, 0, "Offline fallback must not invoke web loading");
    });
  };
  exports.testGenerator = function() {
    loadHelp();
    temporary(function(path) {
      var source = path + "/sample.js";
      var md = "# Heading\n\n**bold** 😀\n\n- item\n  - nested\n\n| a | b |\n| --- | --- |\n| 1 | 2 |\n\n```javascript\n  var xml = '<tag>&value</tag>';\n```";
      var lines = ["/**", " * <odoc>", " * <key>legacy|literal(aValue) : String</key>", " * First line\\", " * Second &amp; third.", " * </odoc>", " */",
        "/**", ' * <odoc format="markdown">', " * <key>marked(aValue) : String</key>", " * <![CDATA["];
      lines = lines.concat(md.split("\n").map(line => " * " + line));
      lines = lines.concat([" * ]]>", " * </odoc>", " */",
        "/**", ' * <odoc format="markdown">', " * <key>plainMD()</key>", " * **text** &amp; more", " *", " *   indented", " * </odoc>", " */"]);
      lines = lines.concat(["/**", ' * <odoc format="md">', " * <key>aliasMD()</key>", " * **text** &amp; more", " *", " *   indented", " * </odoc>", " */"]);
      io.writeFileString(source, lines.join("\r\n"));
      var whitespace = XML.ignoreWhitespace;
      var gen = new ODocsGen({ fixture: source });
      var docs = gen.getODoc().fixture;
      ow.test.assert(docs["legacy|literal"], { k: "legacy|literal(aValue) : String", t: "First line\nSecond & third." }, "Legacy line breaks, entities and literal pipes must survive");
      ow.test.assert(docs.marked.format, "markdown", "Markdown must carry metadata");
      ow.test.assert(docs.aliasMD, { k: "aliasMD()", t: docs.plainMD.t, format: "markdown" }, "md must preserve Markdown text and normalize metadata");
      var added = new ODoc();
      added.add("alias", "alias()", "**body**", "md");
      ow.test.assert(added.get("alias").format, "markdown", "ODoc.add must normalize the md alias");
      ow.test.assert(docs.plainMD.t, "**text** & more\n\n  indented", "Markdown without CDATA must preserve whitespace and decode XML entities");
      ow.test.assert(docs.marked.t, md, "Markdown structure and literal XML must survive");
      ow.test.assert(XML.ignoreWhitespace, whitespace, "Parser must restore XML whitespace setting");
      new ODocs(path, gen.getODoc(), [], true).save();
      ow.test.assert(new ODocs(path, __, [], true).get("fixture", "marked"), docs.marked, "Markdown must round trip through local storage");
      ow.test.assert(new ODocs(path, __, [], true).get("fixture", "aliasMD"), docs.aliasMD, "md alias must round trip through local storage");
      new ODocs(path, gen.getODoc(), [], true).saveWeb();
      var fromWeb = af.fromJson(af.fromBytes2String(io.gunzip(io.readFileBytes(path + "/fixture.gz"))));
      ow.test.assert(fromWeb.marked, docs.marked, "Markdown must round trip through gzip storage");
      ow.test.assert(fromWeb.aliasMD, docs.aliasMD, "md alias must round trip through gzip storage");
      io.writeFileString(source, "// no documentation");
      ow.test.assert(Object.keys(gen.genODoc(source).getAll()), [], "Files without documentation must be accepted");
      io.writeFileString(source, '<odoc format="markdown"><key>broken()</key>&bad;</odoc>');
      var failed = false;
      try { gen.genODoc(source); } catch(e) { failed = String(e).indexOf(source) >= 0; }
      ow.test.assert(failed, true, "Malformed XML must report the source filename");
      ow.test.assert(XML.ignoreWhitespace, whitespace, "Parser errors must restore XML settings");
    });
  };
  exports.testMarkdownSourceEntries = function() {
    loadHelp();
    var docs = new ODocsGen({
      scope: "../js/openaf.js",
      format: "../js/owrap.format.js",
      ojob: "../js/owrap.oJob.js",
      io: "../src/openaf/core/IO.java",
      xml: "../src/openaf/plugins/XML.java"
    }).getODoc();
    var cases = [
      ["scope", "print", ['`print("hello world!")`']],
      ["scope", "printChartArray", ["\n\n", "- `colors` (array)", "```javascript\nprint(printChartArray("]],
      ["scope", "$path", ['"a[?b>`1`].x"', "```text"]],
      ["scope", "io.onDirEvent", ['isString(e) && e == "ENTRY_NA"']],
      ["format", "ow.format.toDate", ["- `M`: Month in year", "- `m`: Minute in hour"]],
      ["ojob", "ow.oJob.loadFile", ["```yaml\n# Name your includes", "include:\n  - hello.js", 'cron           : "*\\/5 * * * * *"']],
      ["io", "io.readFileStream", ["```javascript\nvar stream", "   printnl(buffer);", "stream.close();\n```"]],
      ["xml", "XML.x", ["i < nodes.getLength()", "<test>\n   <test1", "\\\\machine\\share\\test1"]]
    ];
    cases.forEach(function(test) {
      var entry = docs[test[0]][test[1]];
      ow.test.assert(entry.format, "markdown", test[1] + " must opt in to Markdown");
      test[2].forEach(function(fragment) {
        ow.test.assert(entry.t.indexOf(fragment) >= 0, true, test[1] + " must preserve " + fragment);
      });
      ow.test.assert((entry.t.match(/^```.*$/mg) || []).length % 2, 0, test[1] + " must have balanced code fences");
    });
    ow.test.assert(isUnDef(docs.scope.getVersion.format), true, "Simple prose must remain plain text");
    ow.test.assert(isUnDef(docs.format["ow.format.fromUnixDate"].format), true, "Wrapped prose alone must not opt in");
  };
  exports.testWebAppend = function() {
    loadHelp();
    temporary(function(path) {
      new ODocs(path, { one: entries("one") }, [], true).saveWeb();
      new ODocs(path, { two: entries("two") }, [], true).saveWeb();
      var keys = af.fromJson(af.fromBytes2String(io.gunzip(io.readFileBytes(path + "/__odockeys.gz"))));
      ow.test.assert(keys, { one: ["shared"], two: ["shared"] }, "Web append must preserve the old index");
      var original = io.readFileBytes(path + "/__odockeys.gz");
      io.writeFileString(path + "/__odockeys.gz", "invalid gzip");
      var failed = false;
      try { new ODocs(path, { three: entries("three") }, [], true).saveWeb(); } catch(e) { failed = true; }
      ow.test.assert(failed, true, "Corrupt index must not be silently overwritten");
      io.writeFileBytes(path + "/__odockeys.gz", original);
    });
  };
  exports.testWebFallback = function() {
    loadHelp(); plugin("HTTP");
    temporary(function(path) {
      var savedHTTP = HTTP, calls = [];
      try {
        HTTP = function(url) {
          calls.push(url);
          return { responseStream: function() {
            return af.fromBytes2InputStream(url.indexOf("bad/") >= 0 ? af.fromString2Bytes("bad gzip") :
              io.gzip(af.fromString2Bytes(stringify(/__odockeys.gz$/.test(url) ? { web: ["shared"] } : entries("web")))));
          }, close: function() {} };
        };
        var docs = new ODocs(path, __, [], true);
        docs.offline = false;
        docs.arrayurls = ["bad", "good"];
        ow.test.assert(docs.loadWeb("web"), true, "Invalid gzip must fall back to another URL");
        ow.test.assert(docs.get("web", "shared").t, "web", "Web data must be retrievable");
        ow.test.assert(calls.length, 4, "Index and subject must each try the second URL");
        docs.offline = true;
        ow.test.assert(docs.loadWeb("web"), false, "Offline must prevent subsequent fetches");
        ow.test.assert(calls.length, 4, "Offline must make no HTTP requests");
        docs.offline = false;
        docs.keyLoadFromWeb = false;
        HTTP = function(url) {
          calls.push(url);
          docs.offline = true;
          return { responseStream: function() { return af.fromString2InputStream("bad gzip"); }, close: function() {} };
        };
        ow.test.assert(docs.loadWeb("web"), false, "Changing to offline during a fetch must stop further requests");
        ow.test.assert(calls.length, 5, "Offline transition must stop URL fallback and subject fetching");
      } finally { HTTP = savedHTTP; }
    });
  };
  exports.testSearchHelp = function() {
    loadHelp();
    var savedDocs = __odocs, savedFiles = __odocsfiles, savedOffline = __offlineHelp;
    var savedFnCache = global.__oaf_fnDef_cache;
    try {
      temporary(function(path) {
        __odocs = new ODocs(path, { fixture: { marked: { k: "marked()", t: "**raw**", format: "markdown" } } }, [], true);
        ow.test.assert(searchHelp("marked", __, ["fixture"])[0], { id: "fixture", key: "marked", fullkey: "marked()", text: "**raw**", format: "markdown" }, "Lookup must return raw Markdown and metadata");
        __odocs.aodocskeys.fixture.push("stale");
        ow.test.assert(searchHelp("stale", __, ["fixture"]), [], "Stale index entries must not throw");
        __odocs.addAll({ one: { ambiguousForDocTest: { k: "ambiguousForDocTest(aOne)", t: "one" } }, two: { ambiguousForDocTest: { k: "ambiguousForDocTest(aTwo)", t: "two" } } });
        global.__oaf_fnDef_cache = {};
        ow.test.assert($fnDef4Help("ambiguousForDocTest"), [], "Argument lookup must handle ambiguous matches");
        __odocsfiles = ["already-discovered"];
        var previous = __odocs;
        setOfflineHelp(true);
        ow.test.assert(__odocsfiles, [], "Changing help mode must reset package discovery");
        ow.test.assert(previous.offline, true, "Discarded instance must honor offline mode");
      });
    } finally {
      __odocs = savedDocs; __odocsfiles = savedFiles; __offlineHelp = savedOffline;
      if (isDef(savedFnCache)) global.__oaf_fnDef_cache = savedFnCache;
      else delete global.__oaf_fnDef_cache;
    }
  };
  exports.testResourceCleanup = function() {
    loadHelp(); plugin("ZIP");
    var savedZIP = ZIP, closed = 0;
    try {
      var docs = new ODocs(getOpenAFJar(), __, [], true);
      ZIP = function() {
        return {
          loadFile: function() {},
          list: function() { return { ".odoc.db": {} }; },
          getFile: function(name) {
            if (name == ".odoc.db") return [];
            throw new Error("corrupt index");
          },
          close: function() { closed++; }
        };
      };
      var failed = false;
      try { docs.load("missing", "nested.jar"); } catch(e) { failed = true; }
      ow.test.assert(failed, true, "Malformed archives must fail");
      ow.test.assert(closed, 2, "Both nested and outer ZIP must close on parsing errors");
    } finally { ZIP = savedZIP; }
  };
  exports.testConsoleDisplay = function() {
    ow.loadFormat();
    var root = io.fileExists("js/openafconsole.js") ? "." : "..";
    var source = io.readFileString(root + "/js/openafconsole.js");
    source = source.substring(source.indexOf("function __help(aTerm)"), source.indexOf("function __outputConsole(anOutput"));
    var rendered, supported = true, entry;
    var savedAnsi = __ansiColorFlag, savedConsole = __conConsole;
    __ansiColorFlag = true; __conConsole = true;
    try {
      var consoleStub = {
        isAnsiSupported: function() { return supported; },
        getConsoleReader: function() { return { getTerminal: function() { return { getWidth: function() { return 80; } }; } }; }
      };
      var help = new Function("searchHelp", "con", "__ansiflag", "__consoleFormat", "__outputConsoleCommentsEnd", "print", "ansiStart", "ansiStop", "HELPSEPARATOR_ANSI", "HELPSEPARATOR", source + "; return __help;")(
        function() { return [entry]; }, consoleStub, true, { helpLine: "YELLOW", helpTheme: ow.format.withSideLineThemes().simpleLine },
        function(text) { rendered = text; }, function(text) { rendered = text; }, function() {}, function() {}, "-", "-"
      );
      entry = { fullkey: "sample(a<T>)", text: "**body**" };
      help("sample");
      ow.test.assert(rendered.indexOf("**body**") >= 0, true, "Legacy body must remain literal");
      ow.test.assert(rendered.indexOf("sample(a<T>)") >= 0, true, "Signatures must not be interpreted as Markdown");
      entry.format = "markdown";
      help("sample");
      ow.test.assert(rendered.indexOf("**body**") < 0 && rendered.indexOf("body") >= 0, true, "Marked body must render withMD");
      supported = false;
      help("sample");
      ow.test.assert(rendered.indexOf("**body**") >= 0, true, "Unsupported terminals must display Markdown source");
      ow.test.assert(rendered.indexOf("\u001b") < 0, true, "Unsupported terminals must not receive ANSI");
    } finally { __ansiColorFlag = savedAnsi; __conConsole = savedConsole; }
  };
  exports.testBrowserHandlers = function() {
    loadHelp(); ow.loadServer();
    var root = io.fileExists("js/openafgui.js") ? "." : "..";
    var source = io.readFileString(root + "/js/openafgui.js");
    var handler = source.substring(source.indexOf('"/odocKey": function(req) {') + '"/odocKey": '.length, source.indexOf('\n    "/opack": function(req) {')).replace(/,\s*$/, "");
    var savedDocs = __odocs, savedFiles = __odocsfiles;
    var hadCache = $ch().list().indexOf("__hB_oDoc") >= 0;
    try {
      temporary(function(path) {
        __odocs = new ODocs(path, { one: entries("<script>unsafe</script>  & literal"), two: entries("two"), "space &": { "key[": { k: "key[()", t: "encoded" } } }, [], true);
        var endpoint = new Function("httpServer", "return (" + handler + ");")({ replyOKJSON: function(text) { return af.fromJson(text); } });
        ow.test.assert(endpoint({ params: { q: "shared" } }).error, "Ambiguous term", "Duplicate endpoint lookup must be explicit");
        ow.test.assert(endpoint({ params: { q: "shared", id: "one" } }).text, "<script>unsafe</script>  & literal", "Endpoint must retain subject and raw whitespace");
        ow.test.assert(endpoint({ params: { q: "missing" } }).error, "Term not found", "Missing endpoint lookup must be explicit");
        var browser = ow.server.httpd.browse.odoc("/docs", {});
        var file = browser._fns.getList({ uri: "/docs/one/shared" }, browser);
        ow.test.assert(file.isFile, true, "Server browser must recognize subject-qualified entries");
        ow.test.assert(browser._fns.getList({ uri: "/docs/space%20%26/key%5B" }, browser).isFile, true, "Server browser must decode subject and key segments");
        var obj = browser._fns.getObj({ uri: "/docs/one/shared" }, browser);
        ow.test.assert(obj.data.indexOf("&lt;script&gt;unsafe&lt;/script&gt;  &amp; literal") >= 0, true, "Server browser must escape documentation text");
        ow.test.assert(browser._fns.getObj({ uri: "/docs/one/missing" }, browser).data, "Not found", "Missing server entry must not throw");
      });
    } finally {
      __odocs = savedDocs; __odocsfiles = savedFiles;
      if (!hadCache) $cache("__hB_oDoc").destroy();
    }
  };

})();
