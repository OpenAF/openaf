// Copyright 2026 Nuno Aguiar

(function() {
    exports.testCredentialScope = function() {
        ow.loadObj()
        plugin("HTTPServer")
        var source = io.readFileString("../js/opack.js")
        var __remoteUser, __remotePass, __remoteCredentialScope, __remoteHTTP
        var saved = {}, prompts = 0
        var $sec = function() {
            return { get: function(k) { return saved[k] }, set: function(k, v) { saved[k] = v } }
        }
        var ask = function(message) { prompts++; return message.indexOf("password") >= 0 ? "second-secret" : "second-user" }
        var start = source.indexOf("function setOPackCredentials(")
        if (start < 0) start = source.indexOf("function execHTTPWithCred(")
        eval(source.substring(start, source.indexOf("// Find OpenAF she-bang", start)))
        var firstPort = findRandomOpenPort(), secondPort = findRandomOpenPort()
        while (firstPort == secondPort) secondPort = findRandomOpenPort()
        var firstURL = "http://127.0.0.1:" + firstPort
        var secondURL = "http://127.0.0.1:" + secondPort
        var seen = new java.util.concurrent.LinkedBlockingQueue()
        var first = new HTTPd(firstPort, "127.0.0.1", __, __, __, __, 5000, "java")
        var second = new HTTPd(secondPort, "127.0.0.1", __, __, __, __, 5000, "java")
        function handler(server, target) {
            return function(req) {
                var auth = req.header.authorization
                if (isDef(auth)) seen.add(String(auth))
                if (isUnDef(auth)) return server.reply("auth", "text/plain", 401, { "WWW-Authenticate": "Basic realm=\"opack\"" })
                if (target) return server.reply("redirect", "text/plain", 302, { Location: target })
                return server.reply("ok", "text/plain", 200, {})
            }
        }
        first.add("/pkg/auth", handler(first))
        second.add("/pkg/auth", handler(second))
        first.add("/pkg/cross", handler(first, secondURL + "/pkg/auth"))
        first.add("/pkg/same", handler(first, firstURL + "/pkg/auth"))
        first.add("/pkg/path", handler(first, firstURL + "/other/auth"))
        first.add("/other/auth", handler(first))
        function get(url, stream) { return execHTTPWithCred(url, "GET", "", {}, true, 5000, stream) }
        try {
            setOPackCredentials("first-user:first-secret")
            ow.test.assert(af.fromBytes2String(get(firstURL + "/pkg/auth")), "ok", "Explicit authentication failed")
            ow.test.assert(prompts, 0, "Explicit credentials unexpectedly prompted")
            var firstAuth = String(seen.poll())
            seen.clear()
            ow.test.assert(af.fromBytes2String(get(secondURL + "/pkg/auth")), "ok", "Second-origin prompt failed")
            ow.test.assert(prompts, 2, "Second origin reused first-origin credentials")
            ow.test.assert(String(seen.poll()) != firstAuth, true, "First credentials reached second origin")
            seen.clear()
            var stream = get(secondURL + "/pkg/auth", true)
            try { ow.test.assert(af.fromBytes2String(stream.readAllBytes()), "ok", "Authenticated stream failed") } finally { stream.close() }
            ow.test.assert(prompts, 2, "Stored credentials were not reused")
            seen.clear()
            ow.test.assert(af.fromBytes2String(get(firstURL + "/pkg/same")), "ok", "Same-scope redirect failed")
            var redirects = ["/pkg/cross", "/pkg/path"]
            redirects.forEach(function(path) {
                seen.clear()
                try { get(firstURL + path) } catch(e) {}
                // Only the source redirect route may receive first-origin credentials.
                ow.test.assert(seen.size(), 1, "Credentials escaped scope through redirect " + path)
            })
            setOPackCredentials("first-user:first-secret")
            ow.test.assert(__remoteCredentialScope, opackCredentialScope(firstURL + "/pkg/auth"), "Recursive -cred reset scope")
            ow.test.assert(opackCredentialScope("HTTP://EXAMPLE.COM/pkg/a"), opackCredentialScope("http://example.com:80/pkg/b"), "Default port aliases differ")
            ow.test.assert(opackCredentialScope("https://example.com:80/pkg/a") != opackCredentialScope("http://example.com:80/pkg/a"), true, "Schemes share credentials")
            ow.test.assert(opackCredentialScope(firstURL + "/pkg%2Fsub/file") != opackCredentialScope(firstURL + "/pkg/sub/file"), true, "Encoded path separators share credentials")
            ow.test.assert(opackCredentialScope(firstURL + "/pkg/%2e%2e/other/file"), opackCredentialScope(firstURL + "/other/file"), "HTTP canonical paths differ")
            setOPackCredentials("changed-user:changed-secret")
            ow.test.assert(__remoteUser, "changed-user", "Changed -cred user lost")
            ow.test.assert(isUnDef(__remoteCredentialScope), true, "Changed -cred retained prior scope")
            ow.test.assert(Object.keys(saved).some(function(k) { return k == "opack::" + opackCredentialScope(secondURL + "/pkg/auth") }), true, "Stream credentials not stored by scope")
        } finally {
            first.stop()
            second.stop()
        }
    }

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
