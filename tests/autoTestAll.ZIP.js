// Copyright 2023 Nuno Aguiar

(function() {
    exports.testZIP = function() {
        plugin("ZIP");

        var text = new java.lang.String("Some example test to zip into a zip file");
        var openaf = io.readFileBytes(getOpenAFJar());
        var zip = new ZIP();
        zip.putFile("test.txt", text.getBytes());
        zip.putFile("openaf.jar", openaf);

        var newZip = zip.generate({ "compressionLevel": 9 });

        zip = new ZIP(newZip);
        if (typeof zip.list()["openaf.jar"] === 'undefined' ||
            typeof zip.list()["test.txt"] === 'undefined')
            throw "ZIP file test failed!";
        zip.close();
    };

    exports.testZIPStream = function() {
        plugin("ZIP");
        
        var zip = new ZIP();
        var h = sha1(io.readFileBytes(getOpenAFJar()));
        zip.streamPutFile("autoTestAll.zip", "o.jar", io.readFileBytes(getOpenAFJar()));
        
        var hc = sha1(zip.streamGetFile("autoTestAll.zip", "o.jar"));
        ow.test.assert(h, hc, "The contents by streamPutFile are different from the original.");
        
        zip.streamRemoveFile("autoTestAll.zip", "o.jar");
        io.rm("autoTestAll.zip");
    };

    exports.testZIPReadOwnership = function() {
        plugin("ZIP");
        var path = io.createTempFile("zip-ownership-", ".zip");
        var emptyPath = io.createTempFile("zip-empty-", ".zip");
        var zip = new ZIP(), streams = [];
        try {
            io.writeFileBytes(emptyPath, zip.generate());
            ow.test.assert(zip.streamGetFile(emptyPath, "missing"), null, "Empty archive byte lookup failed");
            ow.test.assert(zip.streamGetFileStream(emptyPath, "missing"), null, "Empty archive stream lookup failed");
            ow.test.assert(zip.getFile("missing"), null, "Empty in-memory lookup failed");
            zip.putFile("a.txt", "abcdef");
            zip.putFile("b.txt", "uvwxyz");
            io.writeFileBytes(path, zip.generate());
            zip.loadFile(path);
            ow.test.assert(zip.getFile("missing"), null, "Missing loaded entry should return null");
            ow.test.assert(zip.streamGetFile(path, "missing"), null, "Missing byte entry should return null");
            ow.test.assert(zip.streamGetFileStream(path, "missing"), null, "Missing stream entry should return null");
            var a = zip.streamGetFileStream(path, "a.txt"); streams.push(a);
            ow.test.assert(a.read(), 97, "First stream read failed");
            var b = zip.streamGetFileStream(path, "b.txt"); streams.push(b);
            ow.test.assert(b.read(), 117, "Second stream read failed");
            ow.test.assert(af.fromBytes2String(zip.streamGetFile(path, "a.txt")), "abcdef", "Interleaved byte read failed");
            ow.test.assert(af.fromBytes2String(zip.getFile("b.txt")), "uvwxyz", "Byte read invalidated loaded archive");
            ow.test.assert(a.read(), 98, "Opening another stream invalidated the first");
            a.close(); a.close();
            ow.test.assert(b.read(), 118, "Closing one stream invalidated another");
            var c = zip.streamGetFileStream(path, "a.txt"); streams.push(c);
            zip.close();
            [b, c].forEach(stream => {
                var failed = false;
                try { stream.read(); } catch (e) { failed = true; }
                ow.test.assert(failed, true, "ZIP.close did not release outstanding stream");
            });
            zip.close();
        } finally {
            streams.forEach(stream => { try { stream.close(); } catch (e) {} });
            zip.close();
            io.rm(path); io.rm(emptyPath);
        }
    };

})();