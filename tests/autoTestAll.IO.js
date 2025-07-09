// Copyright 2023 Nuno Aguiar

(function() {
    exports.testIOJSON = function() {
        var a = { "a" : "123€áä" };
        var file = "autoTestAll.test";
    
        io.writeFile(file, a);
        ow.test.assert(io.readFile(file).a, a.a, "Problem with io.read/writeFile.");
        io.rm(file);
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