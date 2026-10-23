// Copyright 2026 Nuno Aguiar

(function() {
    function makePackage(path, files) {
        plugin("ZIP")
        var zip = new ZIP()
        var hashes = {}
        Object.keys(files).forEach(function(name) {
            var bytes = af.fromString2Bytes(files[name])
            zip.putFile(name, bytes)
            hashes[name] = sha1(bytes)
        })
        var manifest = {
            name: "SecurityCopyTest",
            version: "1.0.0",
            description: "copy containment fixture",
            scripts: {},
            dependencies: {},
            files: Object.keys(files),
            filesHash: hashes
        }
        zip.putFile(".package.json", af.fromString2Bytes(stringify(manifest)))
        io.writeFileBytes(path, zip.generate())
        zip.close()
    }

    function install(base, archive, destination, extra) {
        var args = ["install", archive, "-justcopy", "-d", destination]
        if (isArray(extra)) args = args.concat(extra)
        var command = [String(java.lang.System.getProperty("java.home")) + "/bin/java", "-jar", getOpenAFJar(), "--opack", "-e", args.join(" ")]
        return $sh(command).pwd(base).timeout(60000).get(0)
    }

    exports.testCopyContainment = function() {
        var base = String(java.nio.file.Files.createTempDirectory("openaf-opack-copy-"))
        try {
            var archive = base + "/traversal.opack"
            var destination = base + "/destination"
            var escaped = base + "/escaped.txt"
            makePackage(archive, { "../escaped.txt": "outside" })

            var result = install(base, archive, destination)
            ow.test.assert(result.exitcode, 0, "oPack traversal fixture process failed unexpectedly: " + result.stderr)
            ow.test.assert(io.fileExists(escaped), false, "Copy-only package extraction escaped the selected destination.")
            ow.test.assert(io.fileExists(destination + "/escaped.txt"), false, "Rejected traversal should not be rewritten to another filename.")
        } finally {
            io.rm(base)
        }
    }

    exports.testCopyUseUnzipIsDataOnly = function() {
        var base = String(java.nio.file.Files.createTempDirectory("openaf-opack-unzip-"))
        try {
            var archive = base + "/safe.opack"
            var destination = base + "/destination"
            var commandLikeName = "$(touch injected)"
            var files = { "nested/file.txt": "nested" }
            files[commandLikeName] = "literal"
            makePackage(archive, files)

            var result = install(base, archive, destination, ["-useunzip"])
            ow.test.assert(result.exitcode, 0, "oPack copy fixture process failed: " + result.stderr)
            ow.test.assert(io.fileExists(destination + "/nested/file.txt"), true, "oPack did not copy the nested control file: " + result.stdout + result.stderr)
            ow.test.assert(io.readFileString(destination + "/nested/file.txt"), "nested", "Valid nested package file was not copied.")
            ow.test.assert(io.fileExists(destination + "/" + commandLikeName), true, "oPack did not preserve the command-like filename: " + result.stdout + result.stderr)
            ow.test.assert(io.readFileString(destination + "/" + commandLikeName), "literal", "Shell metacharacters in a package filename should remain data.")
            ow.test.assert(io.fileExists(base + "/injected"), false, "-useunzip executed a manifest filename as a shell command.")
        } finally {
            io.rm(base)
        }
    }
})();
