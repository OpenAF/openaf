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
