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
})();