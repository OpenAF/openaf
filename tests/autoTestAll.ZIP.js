// Copyright 2023 Nuno Aguiar

(function() {
    exports.testArchiveExtractionLimits = function() {
        plugin("ZIP")
        var base = String(java.nio.file.Files.createTempDirectory("archive-extract-limits-"))
        var key = "openaf.archive.maxEntryBytes"
        var previous = java.lang.System.getProperty(key)
        var zip = new ZIP()
        try {
            zip.putFile("data.txt", af.fromString2Bytes("x".repeat(128)))
            io.writeFileBytes(base + "/input.zip", zip.generate(__, true))
            io.mkdir(base + "/output")
            io.writeFileString(base + "/output/data.txt", "existing")
            java.lang.System.setProperty(key, "16")
            var rejected = false
            try { io.unzip(base + "/input.zip", base + "/output", function() {}, function() {}) } catch(e) {
                rejected = String(e).indexOf("Archive quota exceeded") >= 0
            }
            ow.test.assert(rejected, true, "Extraction swallowed its quota failure")
            ow.test.assert(io.readFileString(base + "/output/data.txt"), "existing", "Quota failure replaced existing destination")
            ow.test.assert(io.listFiles(base + "/output").files.length, 1, "Quota failure left a partial staging file")
            var path = java.nio.file.Paths.get(base + "/output/data.txt")
            var posix = java.nio.file.Files.getFileStore(path).supportsFileAttributeView("posix")
            if (posix) java.nio.file.Files.setPosixFilePermissions(path, java.nio.file.attribute.PosixFilePermissions.fromString("rwxr-xr--"))
            java.lang.System.setProperty(key, "256")
            io.unzip(base + "/input.zip", base + "/output", function() {}, function() {})
            ow.test.assert(io.readFileString(base + "/output/data.txt"), "x".repeat(128), "Valid extraction failed")
            if (posix) ow.test.assert(String(java.nio.file.attribute.PosixFilePermissions.toString(java.nio.file.Files.getPosixFilePermissions(path))), "rwxr-xr--", "Extraction changed destination permissions")
        } finally {
            if (isNull(previous)) java.lang.System.clearProperty(key)
            else java.lang.System.setProperty(key, previous)
            zip.close()
            io.rm(base)
        }
    }

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
        plugin("ZIP")
        var path = io.createTempFile("zip-ownership-", ".zip")
        var emptyPath = io.createTempFile("zip-empty-", ".zip")
        var zip = new ZIP(), streams = []
        try {
            io.writeFileBytes(emptyPath, zip.generate())
            ow.test.assert(zip.streamGetFile(emptyPath, "missing"), null, "Empty archive byte lookup failed")
            ow.test.assert(zip.streamGetFileStream(emptyPath, "missing"), null, "Empty archive stream lookup failed")
            ow.test.assert(zip.getFile("missing"), null, "Empty in-memory lookup failed")
            zip.putFile("a.txt", "abcdef")
            zip.putFile("b.txt", "uvwxyz")
            io.writeFileBytes(path, zip.generate())
            zip.loadFile(path)
            ow.test.assert(zip.getFile("missing"), null, "Missing loaded entry should return null")
            ow.test.assert(zip.streamGetFile(path, "missing"), null, "Missing byte entry should return null")
            ow.test.assert(zip.streamGetFileStream(path, "missing"), null, "Missing stream entry should return null")
            var a = zip.streamGetFileStream(path, "a.txt"); streams.push(a)
            ow.test.assert(a.read(), 97, "First stream read failed")
            var b = zip.streamGetFileStream(path, "b.txt"); streams.push(b)
            ow.test.assert(b.read(), 117, "Second stream read failed")
            ow.test.assert(af.fromBytes2String(zip.streamGetFile(path, "a.txt")), "abcdef", "Interleaved byte read failed")
            ow.test.assert(af.fromBytes2String(zip.getFile("b.txt")), "uvwxyz", "Byte read invalidated loaded archive")
            ow.test.assert(a.read(), 98, "Opening another stream invalidated the first")
            a.close(); a.close()
            ow.test.assert(b.read(), 118, "Closing one stream invalidated another")
            var c = zip.streamGetFileStream(path, "a.txt"); streams.push(c)
            zip.close();
            [b, c].forEach(stream => {
                var failed = false
                try { stream.read(); } catch (e) { failed = true; }
                ow.test.assert(failed, true, "ZIP.close did not release outstanding stream")
            })
            zip.close()
        } finally {
            streams.forEach(stream => { try { stream.close(); } catch (e) {} })
            zip.close()
            io.rm(path); io.rm(emptyPath)
        }
    }

  exports.testZIPMetadataListing = function() {
    plugin('ZIP')
    var path = io.createTempFile('zip-metadata-', '.zip')
    var corrupt = io.createTempFile('zip-corrupt-', '.zip')
    var sequential = io.createTempFile('zip-sequential-', '.zip')
    var zip = new ZIP()
    var output = new java.util.zip.ZipOutputStream(io.writeFileStream(path))
    var payload = af.fromString2Bytes('integrity-check-payload', 'UTF-8')
    try {
      var stored = new java.util.zip.ZipEntry('stored.txt')
      var crc = new java.util.zip.CRC32()
      crc.update(payload)
      stored.setMethod(java.util.zip.ZipEntry.STORED)
      stored.setSize(payload.length)
      stored.setCompressedSize(payload.length)
      stored.setCrc(crc.getValue())
      stored.setComment('central comment')
      output.putNextEntry(stored)
      output.write(payload)
      output.closeEntry()
      output.putNextEntry(new java.util.zip.ZipEntry('folder/'))
      output.closeEntry()
      output.putNextEntry(new java.util.zip.ZipEntry('folder/雪.txt'))
      output.write(af.fromString2Bytes('compressed'.repeat(1000), 'UTF-8'))
      output.closeEntry()
    } finally { output.close() }
    try {
      zip.putFile('memory.txt', 'retained')
      var ordinary = zip.list(path), metadata = zip.listMetadata(path)
      ow.test.assert(Object.keys(metadata).sort(), Object.keys(ordinary).sort(), 'Metadata listing changed entry names')
      Object.keys(ordinary).forEach(name => {
        ;['name', 'size', 'compressedSize', 'crc', 'time'].forEach(field => {
          ow.test.assert(metadata[name][field], ordinary[name][field], 'Metadata field differs: ' + name + '.' + field)
        })
      })
      ow.test.assert(metadata['stored.txt'].comment, 'central comment', 'Central directory comment missing')
      ow.test.assert(af.fromBytes2String(zip.getFile('memory.txt')), 'retained', 'Metadata listing replaced in-memory archive')

      var bytes = af.fromBytes2Array(io.readFileBytes(path))
      var dataOffset = 30 + (bytes[26] & 255) + ((bytes[27] & 255) << 8) + (bytes[28] & 255) + ((bytes[29] & 255) << 8)
      bytes[dataOffset] ^= 1
      io.writeFileBytes(corrupt, af.fromArray2Bytes(bytes))
      ow.test.assert(zip.listMetadata(corrupt)['stored.txt'].crc, metadata['stored.txt'].crc, 'Metadata-only traversal tried to read payload')
      var failed = false
      try { zip.list(corrupt) } catch(e) { failed = true }
      ow.test.assert(failed, true, 'Default list no longer checks payload CRC')

      bytes = af.fromBytes2Array(io.readFileBytes(path))
      var central = -1
      for (var i = 0; i < bytes.length - 3; i++) {
        if (bytes[i] == 80 && bytes[i + 1] == 75 && bytes[i + 2] == 1 && bytes[i + 3] == 2) { central = i; break }
      }
      ow.test.assert(central > 0, true, 'ZIP fixture has no central directory')
      io.writeFileBytes(sequential, af.fromArray2Bytes(bytes.slice(0, central)))
      ow.test.assert(Object.keys(zip.list(sequential)).sort(), Object.keys(ordinary).sort(), 'Default sequential ZIP support changed')
      failed = false
      try { zip.listMetadata(sequential) } catch(e) { failed = true }
      ow.test.assert(failed, true, 'Metadata-only listing accepted a missing central directory')
    } finally {
      zip.close()
      ;[path, corrupt, sequential].forEach(file => io.rm(file))
    }
  }

})()
