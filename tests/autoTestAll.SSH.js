// Copyright 2026 Nuno Aguiar

(function() {
    exports.testScpDownloadTarget = function() {
        plugin("SSH");

        var base = String(java.nio.file.Files.createTempDirectory("openaf-scp-target-"));
        var destination = base + "/downloads";
        io.mkdir(destination);

        try {
            var sshClass = java.lang.Class.forName("openaf.plugins.SSH");
            var types = java.lang.reflect.Array.newInstance(java.lang.Class, 2);
            types[0] = java.lang.Class.forName("java.io.File");
            types[1] = java.lang.Class.forName("java.lang.String");
            var method = sshClass.getDeclaredMethod("resolveScpDownloadTarget", types);
            method.setAccessible(true);

            var invoke = function(name) {
                var values = java.lang.reflect.Array.newInstance(java.lang.Object, 2);
                values[0] = new java.io.File(destination);
                values[1] = name;
                return method.invoke(null, values);
            };

            ["report.txt", "report 1.txt", "relatório.txt"].forEach(function(name) {
                var target = invoke(name);
                ow.test.assert(String(target), String(new java.io.File(destination, name).getCanonicalFile()), "Valid SCP basename should remain in the selected directory.");
            });

            ["", ".", "..", "../escape.txt", "../../escape.txt", "/tmp/escape.txt", "sub/escape.txt", "sub\\escape.txt", "C:\\escape.txt", "C:/escape.txt", "\\\\server\\share\\escape.txt"].forEach(function(name) {
                var rejected = false;
                try {
                    invoke(name);
                } catch(e) {
                    rejected = true;
                }
                ow.test.assert(rejected, true, "Unsafe SCP peer filename should be rejected: " + name);
            });

            try {
                var outside = base + "/outside.txt";
                io.writeFileString(outside, "outside");
                java.nio.file.Files.createSymbolicLink(java.nio.file.Paths.get(destination, "linked.txt"), java.nio.file.Paths.get(outside));
                var rejected = false;
                try {
                    invoke("linked.txt");
                } catch(e) {
                    rejected = true;
                }
                ow.test.assert(rejected, true, "SCP target symlink should not escape the selected directory.");
            } catch(e) {
                if (!(e instanceof java.lang.UnsupportedOperationException) && !(e instanceof java.nio.file.FileSystemException)) throw e;
            }
        } finally {
            io.rm(base);
        }
    };
})();
