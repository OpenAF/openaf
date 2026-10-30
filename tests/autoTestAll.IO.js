// Copyright 2023 Nuno Aguiar

(function() {
    exports.testIOJSON = function() {
        var a = { "a" : "123€áä" };
        var file = "autoTestAll.test";
    
        io.writeFile(file, a);
        ow.test.assert(io.readFile(file).a, a.a, "Problem with io.read/writeFile.");
        io.rm(file);
    };

    exports.testJSONArray = function() {
        var fixture = [null, true, false, 1.25, "€\\\"", [], {}, {nested:[1,{x:"y"}]}];
        var file = io.createTempFile("json-array", ".json");
        try {
            io.writeFileString(file, stringify(fixture));
            var values = [], indexes = [];
            ow.test.assert(io.readJSONArray(file, (v, i) => { values.push(v); indexes.push(i); }), fixture.length, "Count");
            ow.test.assert(values, fixture, "JSON values and empty containers");
            ow.test.assert(indexes, fixture.map((v, i) => i), "Indexes");
            var stream = io.readFileStream(file);
            try {
                ow.test.assert(io.readJSONArray(stream, () => true), 1, "Early stop");
                ow.test.assert(stream.read() >= -1, true, "Borrowed stream remains open");
            } finally { stream.close(); }
            var raw = [];
            io.readJSONArray(file, v => { raw.push(jsonParse(v)); }, "UTF-8", true);
            ow.test.assert(raw, fixture, "Raw JSON mode");
            ["{}", "[1,]", "[", "[1]true", "[NaN]", "[\"unfinished]"].forEach(text => {
                io.writeFileString(file, text);
                var failed = false;
                try { io.readJSONArray(file, () => {}); } catch(e) { failed = true; }
                ow.test.assert(failed, true, "Reject malformed JSON: " + text);
            });
            io.writeFileString(file, "[1]");
            var failed = false;
            try { io.readJSONArray(file, () => { throw "callback-failure"; }); } catch(e) { failed = String(e).indexOf("callback-failure") >= 0; }
            ow.test.assert(failed, true, "Propagate callback errors");
        } finally { io.rm(file); }
    };

    exports.testIOStreamJSON = function() {
        var o = io.readStreamJSON("../versionsAndDeps.json", p=>(/^\$\.external\[\d+\]\.description/).test(p))

        ow.test.assert($from(o.external).equals("description", "GSON").any(), true, "Problem with io.readStreamJSON.")
    }

    exports.testIOStream = function() {
        var file = "autoTestAll.test";
        var stream = io.writeFileStream(file);
        ioStreamWrite(stream, "Hello ", void 0, false);
        ioStreamWrite(stream, "World! €áä", void 0, false);
        stream.close();
    
        stream = io.readFileStream(file);
        var res = "";
        ioStreamRead(stream, function(buffer) {
            res += buffer;
        }, void 0, false);
        stream.close();
    
        ow.test.assert(res, "Hello World! €áä", "Problem with read/writeFileStream or ioStreamRead/Write.");
        io.rm(file);   
    };

    exports.testIOStreamNIO = function() {
        var file = "autoTestAll.test";
        var stream = io.writeFileStream(file);
        ioStreamWrite(stream, "Hello ", void 0, true);
        ioStreamWrite(stream, "World! €áä", void 0, true);
        stream.close();
    
        stream = io.readFileStream(file);
        var res = "";
        ioStreamRead(stream, function(buffer) {
            res += buffer;
        }, void 0, true);
        stream.close();
    
        ow.test.assert(af.toEncoding(res, "UTF-8"), "Hello World! €áä", "Problem with read/writeFileStream or ioStreamRead/Write.");
        io.rm(file);   
    };

    exports.testIOStreamBytes = function() {
        var file = "autoTestAll.test";
        var stream = io.writeFileStream(file);
        ioStreamWriteBytes(stream, af.fromString2Bytes("Hello "), void 0, false);
        ioStreamWriteBytes(stream, af.fromString2Bytes("World! €áä"), void 0, false);
        stream.close();
    
        stream = io.readFileStream(file);
        var res = "";
        ioStreamReadBytes(stream, function(buffer) {
            res += af.fromBytes2String(buffer);
        }, void 0, false);
        stream.close();
    
        ow.test.assert(res, "Hello World! €áä", "Problem with read/writeFileStream or ioStreamReadBytes/WriteBytes.");    
    };

    exports.testIOStreamBytesNIO = function() {
        var file = "autoTestAll.test";
        var stream = io.writeFileStream(file);
        ioStreamWriteBytes(stream, af.fromString2Bytes("Hello "), void 0, true);
        ioStreamWriteBytes(stream, af.fromString2Bytes("World! €áä"), void 0, true);
        stream.close();
    
        stream = io.readFileStream(file);
        var res = "";
        ioStreamReadBytes(stream, function(buffer) {
            res += af.fromBytes2String(buffer);
        }, void 0, true);
        stream.close();
    
        ow.test.assert(res, "Hello World! €áä", "Problem with read/writeFileStream or ioStreamReadBytes/WriteBytes.");    
    };    

    exports.testIOCopyStream = function() {
        var s1 = io.readFileStream(getOpenAFJar());
        var h1 = sha1(s1);
        s1.close();
        
        ioStreamCopy(io.writeFileStream("autoTestAll.jar"), io.readFileStream(getOpenAFJar()));
        
        var s2 = io.readFileStream("autoTestAll.jar");
        var h2 = sha1(s2);
        s2.close();
        
        ow.test.assert(h1, h2, "Problem with ioStreamCopy.");
        io.rm("autoTestAll.jar");
    };

    exports.testGzipNativeToByte = () => {
        var orig = io.readFileString("../js/openaf.js", io.getDefaultEncoding());

        io.writeFileBytes("autoTestAll.gz", io.gzip(io.readFileBytes("../js/openaf.js")));
        var a = Packages.org.apache.commons.io.IOUtils.toByteArray(io.readFileStream("autoTestAll.gz"));
        var s = af.fromBytes2String(io.gunzip(a));

        ow.test.assert(orig.length, s.length, "Problem with gzip native java array to byte array conversion.");
    };

    exports.testBinaryFileDetection = () => {
        ow.test.assert(io.isBinaryFile(getOpenAFJar()), true, "Problem with io.isBinaryFile detecting binary files.");
        ow.test.assert(io.isBinaryFile("../js/openaf.js"), false, "Problem with io.isBinaryFile detecting text files.");
    };

    exports.testCopyMoveDeleteFile = () => {
        var orig = "../js/openaf.js";

        var contents = io.readFileString(orig);
        
        // Test copy
        io.cp(orig, "__autoTest.js");
        ow.test.assert(contents, io.readFileString("__autoTest.js"), "Problem copying file.");

        io.mv("__autoTest.js", "__autoNewTest.js");
        ow.test.assert(contents, io.readFileString("__autoNewTest.js"), "Problem moving file.");

        io.rm("__autoNewTest.js");
        ow.test.assert(io.fileExists("__autoNewTest.js"), false, "Problem removing file.");
    };

    exports.testTAR = () => {
        var tmp1 = io.createTempFile("tartest1_", ".tgz")
        var str = "This is a test"

        io.writeFileTARStream(tmp1, __, writer => {
            $from(io.listFiles(getOpenAFPath()).files)
            .equals("isFile", true)
            .select(r => writer(r.filename, io.readFileStream(r.filepath)) )
        })

        var lst = io.listFilesTAR(tmp1)
        ow.test.assert($from(lst).equals("filename", "openaf.jar").any(), true, "Problem with writeFileTARStream/listFilesTAR")

        io.writeFileTARBytes(tmp1, "test.txt", __, af.fromString2Bytes(str))
        ow.test.assert(af.fromBytes2String(io.readFileTARBytes(tmp1, "test.txt")), str, "Problem with writeFileTARBytes/readFileTARBytes")
    }
})();
exports.testJSONMetadata = function() {
  var file = io.createTempFile("json-metadata", ".json");
  var fixture = {"a.b":[null,true,1.25,"café €",{},[]], "": {"a[0]":0}, "quote\"":false};
  var eq = (a,b,msg) => ow.test.assert(a,b,msg);
  try {
    io.writeFileString(file, stringify(fixture));
    var events = [];
    eq(io.scanJSON(file, e => {events.push(e);}).complete, true, "Complete traversal");
    eq(events.filter(e => e.phase == "value").length, 11, "Each JSON node visited once");
    events.filter(e => e.phase == "end").forEach(e => {
      var out = new java.io.ByteArrayOutputStream();
      io.copyJSONRange(file,e.start,e.end,out);
      var value = fixture;
      e.path.forEach(k => {value = value[k];});
      eq(jsonParse(String(out.toString("UTF-8"))),value,"Exact UTF-8 range " + stringify(e.path));
    });
    eq(events[0].phase,"value","Retained events are independent snapshots");
    eq(events[events.length-1].size,3,"Root property count");
    var visited = [];
    io.scanJSON(file,e => {if(e.phase == "value") {visited.push(e.path); if(e.path.length == 1) return "skip";}});
    eq(visited,[[],["a.b"],[""],["quote\""]],"Skip children without losing sibling locations");
    eq(io.scanJSON(file,() => "stop").complete,false,"Early stop");
    ["", "[1,]", "[", "{}true", "{\"x\":}", "[\"unfinished]"].forEach(text => {
      io.writeFileString(file,text);
      var failed = false;
      try {io.scanJSON(file,() => {});} catch(e) {failed = true;}
      eq(failed,true,"Reject malformed JSON " + text);
    });
    io.writeFileString(file,"[1,2,3]");
    var failed = false;
    try {io.scanJSON(file,() => {},{maxNodes:2});} catch(e) {failed = true;}
    eq(failed,true,"Node limit");
    failed = false;
    try {io.scanJSON(file,() => {},{cancel:() => true});} catch(e) {failed = true;}
    eq(failed,true,"Cancellation closes resources");
    eq(io.scanJSON(file,() => {}).complete,true,"Reader remains usable after failures");
    io.writeFileBytes(file, af.fromString2Bytes("{}", "UTF-16"));
    failed = false;
    try {io.scanJSON(file,() => {});} catch(e) {failed = true;}
    eq(failed,true,"Reject non-UTF-8 source offsets");
    io.writeFileString(file,'"scalar root"');
    eq(io.scanJSON(file,() => {}).nodes,1,"Scalar root");
  } finally {io.rm(file);}
};

exports.testJSONExtraction = function() {
  var file = io.createTempFile("json-extract", ".json");
  try {
    io.writeFileString(file, '{"a.b": [1.2300, { "x": "café" }], "a":{"b":2}}');
    var out = new java.io.ByteArrayOutputStream();
    ow.test.assert(io.extractJSON(file, ["a.b", 0], out), true, "Literal key extraction");
    ow.test.assert(String(out.toString("UTF-8")), "1.2300", "Preserves numeric spelling");
    out.reset();
    ow.test.assert(io.extractJSON(file, ["a.b", 1], out), true, "Container extraction");
    ow.test.assert(String(out.toString("UTF-8")), '{ "x": "café" }', "Preserves UTF-8 and spacing");
    out.reset();
    ow.test.assert(io.extractJSON(file, ["a.b", "0"], out), false, "Array indices require numbers");
    ow.test.assert(out.size(), 0, "Missing path writes nothing");
    ow.test.assert(io.extractJSON(file, [], out), true, "Extract root");
    ow.test.assert(String(out.toString("UTF-8")), io.readFileString(file), "Exact root bytes");
  } finally {io.rm(file);}
};

exports.testUnzipContainment = function() {
  var files = java.nio.file.Files;
  var base = String(files.createTempDirectory("openaf-unzip-"));
  var target = base + "/target", outside = base + "/outside", zipFile = base + "/fixture.zip";
  var absoluteEscape = base + "/absolute-escape.txt";
  var errors = [];
  try {
    io.mkdir(target);
    io.mkdir(outside);

    var zos = new java.util.zip.ZipOutputStream(new java.io.FileOutputStream(zipFile));
    try {
      var addEntry = function(name, contents) {
        zos.putNextEntry(new java.util.zip.ZipEntry(name));
        if (isDef(contents)) {
          var bytes = af.fromString2Bytes(contents);
          zos.write(bytes, 0, bytes.length);
        }
        zos.closeEntry();
      };
      addEntry("safe/", __);
      addEntry("safe/ok.txt", "safe");
      addEntry("../escaped.txt", "parent traversal");
      addEntry("../target-sibling/escaped.txt", "sibling prefix");
      addEntry("safe/../../escaped-twice.txt", "nested traversal");
      addEntry("..\\escaped-backslash.txt", "backslash traversal");
      addEntry(absoluteEscape, "absolute traversal");
      addEntry("C:/escaped-drive.txt", "drive traversal");
      addEntry("\\\\server\\share\\escaped-unc.txt", "UNC traversal");

      if (!ow.loadFormat().isWindows()) {
        io.mkdir(target + "/internal-target");
        files.createSymbolicLink(new java.io.File(target + "/internal-link").toPath(), new java.io.File(target + "/internal-target").toPath());
        files.createSymbolicLink(new java.io.File(target + "/linked").toPath(), new java.io.File(outside).toPath());
        files.createSymbolicLink(new java.io.File(target + "/dangling.txt").toPath(), new java.io.File(base + "/dangling-outside.txt").toPath());
        addEntry("internal-link/ok.txt", "safe linked entry");
        addEntry("linked/escaped.txt", "linked traversal");
        addEntry("dangling.txt", "dangling symlink traversal");
      }
    } finally {
      zos.close();
    }

    io.unzip(zipFile, target, function() {}, function(message) { errors.push(String(message)); });

    ow.test.assert(io.readFileString(target + "/safe/ok.txt"), "safe", "Extract a normal nested ZIP entry.");
    ow.test.assert(io.fileExists(base + "/escaped.txt"), false, "Reject parent traversal.");
    ow.test.assert(io.fileExists(base + "/target-sibling/escaped.txt"), false, "Reject sibling-prefix traversal.");
    ow.test.assert(io.fileExists(base + "/escaped-twice.txt"), false, "Reject nested parent traversal.");
    ow.test.assert(io.fileExists(absoluteEscape), false, "Reject absolute paths.");
    ["../escaped.txt", "../target-sibling/escaped.txt", "safe/../../escaped-twice.txt",
     "..\\escaped-backslash.txt", absoluteEscape, "C:/escaped-drive.txt", "\\\\server\\share\\escaped-unc.txt"].forEach(function(name) {
      ow.test.assert(errors.some(function(message) { return message.indexOf("[" + name + "]") >= 0; }), true, "Reject ZIP entry " + name);
    });
    if (!ow.loadFormat().isWindows()) {
      ow.test.assert(io.readFileString(target + "/internal-target/ok.txt"), "safe linked entry", "Allow an existing symlink that remains inside the extraction root.");
      ow.test.assert(io.fileExists(outside + "/escaped.txt"), false, "Reject extraction through a directory symlink.");
      ow.test.assert(io.fileExists(base + "/dangling-outside.txt"), false, "Reject extraction through a dangling file symlink.");
      ["linked/escaped.txt", "dangling.txt"].forEach(function(name) {
        ow.test.assert(errors.some(function(message) { return message.indexOf("[" + name + "]") >= 0; }), true, "Reject ZIP entry " + name);
      });
    }
  } finally {
    io.rm(base);
  }
};

// Streams that expose short reads and ownership, without relying on timing or sockets.
function trackedInput(text, encoding, maxRead) {
  var bytes = new java.io.ByteArrayInputStream(af.fromString2Bytes(text, encoding || "UTF-8"));
  var state = { reads: 0, closed: false };
  state.stream = new JavaAdapter(java.io.InputStream, {
    read: function(buffer, offset, length) {
      state.reads++;
      if (arguments.length == 0) return bytes.read();
      return bytes.read(buffer, offset, Math.min(length, maxRead || length));
    },
    available: function() { return bytes.available(); },
    close: function() { state.closed = true; bytes.close(); }
  });
  return state;
}

exports.testStreamWriteBoundaries = function() {
  [false, true].forEach(function(mode) {
    ["", "1234", "12345", repeat(5000, "€😀abc")].forEach(function(text) {
      [false, true].forEach(function(binary) {
        var output = new java.io.ByteArrayOutputStream();
        if (binary) ioStreamWriteBytes(output, af.fromString2Bytes(text, "UTF-8"), 4, mode);
        else ioStreamWrite(output, text, 4, mode);
        ow.test.assert(String(new java.lang.String(output.toByteArray(), "UTF-8")), text, "Complete stream write");
      });
    });
    var bytes = af.fromArray2Bytes(range(256).map(function(i) { return i - 128; }));
    var output = new java.io.ByteArrayOutputStream();
    ioStreamWriteBytes(output, bytes, 7, mode);
    ow.test.assert(java.util.Arrays.equals(bytes, output.toByteArray()), true, "All binary bytes preserved");
  });
  var written = new java.io.ByteArrayOutputStream(), closed = false;
  var channel = new JavaAdapter(java.nio.channels.WritableByteChannel, {
    write: function(buffer) {
      var length = Math.min(2, buffer.remaining());
      for (var i = 0; i < length; i++) written.write(buffer.get() & 255);
      return length;
    },
    isOpen: function() { return !closed; },
    close: function() { closed = true; }
  });
  ioStreamWriteBytes({ getChannel: function() { return channel; } }, af.fromString2Bytes("partial writes"), 5, false);
  ow.test.assert(String(written.toString("UTF-8")), "partial writes", "Partial channel writes retried");
  ow.test.assert(closed, false, "Writer leaves borrowed channel open");
};

exports.testStreamDecodingAndOwnership = function() {
  [false, true].forEach(function(mode) {
    [["A€B😀C", "UTF-8"], ["café", "ISO-8859-1"]].forEach(function(fixture) {
      var input = trackedInput(fixture[0], fixture[1], 1), result = "";
      ioStreamRead(input.stream, function(text) { result += text; }, 2, mode, fixture[1]);
      ow.test.assert(result, fixture[0], "Decode across single-byte reads: " + fixture[1]);
      ow.test.assert(input.closed, mode, "Normal completion ownership");
      input.stream.close();
    });
    [false, true].forEach(function(fail) {
      var input = trackedInput(repeat(20000, "x"), "UTF-8", 1), calls = 0, failed = false;
      try {
        ioStreamRead(input.stream, function() {
          calls++;
          if (fail) throw "callback sentinel";
          return true;
        }, 2, mode, "UTF-8");
      } catch(e) { failed = String(e).indexOf("callback sentinel") >= 0; }
      ow.test.assert(failed, fail, "Callback exception propagates");
      ow.test.assert(calls, 1, "Early exit invokes callback once");
      ow.test.assert(input.closed, mode, "Early exit ownership");
      input.stream.close();
    });
  });
};

exports.testStreamLineBoundaries = function() {
  [false, true].forEach(function(mode) {
    ["\n", "\r\n", "<END>"].forEach(function(separator) {
      var input = trackedInput("a" + separator + separator + "b" + separator + "tail", "UTF-8", 1);
      var lines = [];
      try {
        ioStreamReadLines(input.stream, function(line) { lines.push(line); }, separator, mode, "UTF-8");
        ow.test.assert(lines, ["a", "", "b", "tail"], "Complete separators and final line");
      } finally { input.stream.close(); }
    });
    var input = trackedInput("first\n" + repeat(20000, "x"), "UTF-8", 1), calls = 0, readsAtStop;
    try {
      ioStreamReadLines(input.stream, function() {
        calls++;
        readsAtStop = input.reads;
        return true;
      }, "\n", mode, "UTF-8");
      ow.test.assert(calls, 1, "Line callback stops once requested");
      ow.test.assert(input.reads, readsAtStop, "No input reads after line callback stops");
      ow.test.assert(input.closed, mode, "Line reader ownership on stop");
    } finally { input.stream.close(); }
    input = trackedInput("unread", "UTF-8", 1);
    var rejected = false;
    try { ioStreamReadLines(input.stream, function() {}, "", mode); }
    catch(e) { rejected = true; }
    finally { input.stream.close(); }
    ow.test.assert(rejected, true, "Reject empty separator");
    ow.test.assert(input.reads, 0, "Reject separator before reading");
  });
};

exports.testXMLSkipLines = function() {
  var file = io.createTempFile("xml-skip-", ".xml");
  try {
    ["\n", "\r\n"].forEach(function(newline) {
      [0, 1, 2].forEach(function(count) {
        io.writeFileString(file, repeat(count, "header" + newline) + "<root>ok</root>");
        ow.test.assert(String(io.readFileXML(file, count).toXMLString()), "<root>ok</root>", "Skip exactly " + count + " lines");
      });
    });
    io.writeFileString(file, "<root>ok</root>");
    ow.test.assert(String(io.readFileXML(file, -1).toXMLString()), "<root>ok</root>", "Negative skip retains content");
    ["", "header", "header\n", "header\nlast"].forEach(function(text) {
      io.writeFileString(file, text);
      ow.test.assert(String(io.readFileXML(file, 5).toXMLString()), "", "Exhausted input is empty");
    });
  } finally { io.rm(file); }
};

exports.testGzipInitializationCleanup = function() {
  var script = '(' + function() {
    var file = io.createTempFile("gzip-header-", ".gz");
    try {
      var bean = java.lang.management.ManagementFactory.getOperatingSystemMXBean();
      [af.fromString2Bytes("not gzip"), af.fromArray2Bytes([31, -117])].forEach(function(header) {
        io.writeFileBytes(file, header);
        try { io.readFileGzipStream(file); } catch(e) {}
        var supported = typeof bean.getOpenFileDescriptorCount == "function";
        var before = supported ? bean.getOpenFileDescriptorCount() : 0;
        var errors = 0;
        for (var i = 0; i < 100; i++) {
          try { io.readFileGzipStream(file); } catch(e) { errors++; }
        }
        if (errors != 100) throw "Malformed headers were accepted";
        if (supported && bean.getOpenFileDescriptorCount() - before > 2) throw "File descriptors leaked";
      });
      io.writeFileBytes(file, io.gzip(af.fromString2Bytes("round trip")));
      var stream = io.readFileGzipStream(file);
      try {
        if (String(Packages.org.apache.commons.io.IOUtils.toString(stream, "UTF-8")) != "round trip") throw "Gzip round trip failed";
      } finally { stream.close(); }
      io.rm(file);
      var missing = false;
      try { io.readFileGzipStream(file); } catch(e) { missing = true; }
      if (!missing) throw "Missing input was accepted";
      print("GZIP_CLEANUP_OK");
    } finally { if (io.fileExists(file)) io.rm(file); }
  } + ')();';
  var result = $sh([String(java.lang.System.getProperty("java.home")) + "/bin/java", "-jar", getOpenAFJar(), "-c", script]).timeout(30000).get(0);
  ow.test.assert(result.exitcode, 0, "Gzip cleanup subprocess: " + result.stderr + result.stdout);
  ow.test.assert(result.stdout.indexOf("GZIP_CLEANUP_OK") >= 0, true, "Gzip cleanup probe completed");
};
