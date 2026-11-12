// Standalone: java -jar openaf.jar -f tests/opack-integrity.js (from checkout root).
// Real install/update, file/ZIP readers and hashes; only repositories, hooks and registration are isolated.
try {
    var source = io.readFileString("js/opack.js")
    eval(source.substring(0, source.indexOf("// MAIN\n")))
    var base = String(java.nio.file.Files.createTempDirectory("opack-integrity-"))
    var calls, installed, remoteZip, remoteBytes, manifestBytes, failPre, blockCommit, fixtureNumber = 0
    log = logWarn = logErr = function() {}
    var originalCheckVersion = checkVersion, originalErase = erase
    sortPackagesByDeps = packages => packages
    checkVersion = () => 1
    verifyDeps = () => ({})
    findLocalDBByName = () => installed
    addLocalDB = function(packag, target) { calls.register++; installed = clone(packag); installed.__target = target }
    removeLocalDB = function() { installed = undefined }
    runScript = function(script) {
        calls[script]++
        if (blockCommit && script == "pre") {
            io.mkdir(installed.__target + "/blocked.js")
            io.writeFileString(installed.__target + "/blocked.js/child", "block promotion")
        }
        return !(failPre && script == "pre")
    }
    getHTTPOPack = () => remoteZip
    execHTTPWithCred = function(url, method, input, headers, bytes, timeout, stream) {
        if (url.endsWith("/" + PACKAGEJSON)) return manifestBytes
        if (!url.endsWith("/payload.js")) throw "Unexpected fixture URL: " + url
        return stream ? af.fromBytes2InputStream(remoteBytes) : remoteBytes
    }
    erase = function() {
        calls.erase++
        io.rm(installed.__target + "/payload.js")
        io.rm(installed.__target + "/obsolete.txt")
        installed = undefined
        return { erased: 1, failed: 0 }
    }
    function assert(value, message) { if (!value) throw new Error(message) }
    function fixture(kind, payload, hash) {
        if (isDef(remoteZip)) remoteZip.close()
        var root = base + "/" + (++fixtureNumber), origin = root + "/source", target = root + "/target"
        io.mkdir(origin); io.mkdir(target)
        io.writeFileString(target + "/payload.js", "old")
        io.writeFileString(target + "/obsolete.txt", "old-extra")
        io.writeFileString(target + "/unrelated.txt", "keep")
        calls = { pre: 0, post: 0, preerase: 0, posterase: 0, register: 0, erase: 0 }; failPre = false; blockCommit = false
        installed = { name: "IntegrityFixture", version: "0", files: ["payload.js", "obsolete.txt"], scripts: {}, __target: target }
        var packag = { name: "IntegrityFixture", version: "1", files: ["payload.js", PACKAGEJSON], filesHash: {}, scripts: { preinstall: "pre", postinstall: "post" }, dependencies: {} }
        if (isDef(hash)) packag.filesHash["payload.js"] = hash
        manifestBytes = af.fromString2Bytes(stringify(packag))
        remoteBytes = af.fromString2Bytes(payload)
        io.writeFileBytes(origin + "/" + PACKAGEJSON, manifestBytes)
        io.writeFileBytes(origin + "/payload.js", remoteBytes)
        var zip = new ZIP()
        zip.putFile(PACKAGEJSON, manifestBytes); zip.putFile("payload.js", remoteBytes)
        var archiveBytes = zip.generate(__, true)
        io.writeFileBytes(root + "/fixture.opack", archiveBytes)
        zip.close(); remoteZip = new ZIP(archiveBytes)
        var pack = kind == "local" ? origin : kind == "opacklocal" ? root + "/fixture.opack" : kind == "url" ? "http://fixture.invalid/package" : "http://fixture.invalid/fixture.opack"
        return { pack: pack, target: target, origin: origin }
    }
    function unchanged(f) {
        assert(io.readFileString(f.target + "/payload.js") == "old", "Rejected input changed installed payload")
        assert(io.readFileString(f.target + "/obsolete.txt") == "old-extra", "Rejected input deleted obsolete file")
        assert(io.readFileString(f.target + "/unrelated.txt") == "keep", "Unrelated file changed")
        assert(installed.version == "0" && calls.register == 0 && calls.erase == 0, "Rejected input changed registration/update state")
        assert(calls.pre == 0 && calls.post == 0, "Hook ran before failed integrity gate")
    }
    try {
        ["local", "opacklocal", "url", "opackurl"].forEach(kind => {
            var f = fixture(kind, "tampered", sha1("trusted"))
            var result = install([f.pack, "-d", f.target])
            assert(result.failed == 1 && result.installed == 0, "Hash mismatch reported as success: " + kind)
            unchanged(f)
            f = fixture(kind, "trusted", sha1("trusted"))
            result = install([f.pack, "-d", f.target])
            assert(result.installed == 1 && result.failed == 0, "Valid install failed: " + kind)
            assert(io.readFileString(f.target + "/payload.js") == "trusted", "Verified snapshot not promoted")
            assert(calls.pre == 1 && calls.post == 1 && calls.register == 1, "Valid workflow hooks/registration failed")
            assert(!io.fileExists(f.target + "/obsolete.txt") && io.readFileString(f.target + "/unrelated.txt") == "keep", "Obsolete cleanup changed unrelated files")
        })
        var f = fixture("local", "trusted", undefined)
        var result = install([f.pack, "-d", f.target])
        assert(result.failed == 1, "Missing hash accepted"); unchanged(f)
        f = fixture("local", "trusted", sha1("trusted")); io.rm(f.origin + "/payload.js")
        result = install([f.pack, "-d", f.target, "-noverify"])
        assert(result.failed == 1 && result.installed == 0, "Copy failure accepted with noverify"); unchanged(f)
        f = fixture("opacklocal", "tampered", sha1("trusted"))
        result = update([f.pack, "-force"])
        assert(result.failed == 1 && result.updated == 0, "Corrupt update reported success"); unchanged(f)
        f = fixture("opacklocal", "trusted", sha1("trusted"))
        installed.version = "1"
        installed.scripts = { preerase: "preerase", posterase: "posterase" }
        checkVersion = originalCheckVersion
        erase = function(args, dontRemoveDir, isUpdate, allowUnrelated) { calls.erase++; return originalErase(args, dontRemoveDir, isUpdate, allowUnrelated) }
        result = update([f.pack, "-force"])
        checkVersion = () => 1
        assert(result.updated == 1 && result.failed == 0 && calls.erase == 1, "Valid update/erase workflow failed")
        assert(calls.preerase == 1 && calls.posterase == 1, "Valid update lost erase hooks")
        f = fixture("local", "unverified", undefined)
        result = install([f.pack, "-d", f.target, "-noverify", "-justcopy"])
        assert(result.installed == 1 && calls.pre == 0 && calls.post == 0 && calls.register == 0, "Explicit copy-only noverify changed")
        f = fixture("local", "line1\r\nline2\n", sha1("line1\nline2\n"))
        assert(install([f.pack, "-d", f.target]).installed == 1, "Legacy CRLF compatibility lost")
        f = fixture("local", "line1\rline2", sha1("line1line2"))
        result = install([f.pack, "-d", f.target]); assert(result.failed == 1, "Bare CR hash ambiguity accepted"); unchanged(f)
        f = fixture("local", "trusted", sha1("trusted"))
        io.mkdir(f.origin + "/nested")
        io.writeFileString(f.origin + "/nested/" + PACKAGEJSON, "nested metadata")
        var hashes = listFilesWithHash(f.origin)
        assert(isDef(hashes["nested/" + PACKAGEJSON]), "Generator left nested description unhashed")
        var description = io.readFileJSON(f.origin + "/" + PACKAGEJSON)
        description.files.push("nested/" + PACKAGEJSON)
        description.filesHash = hashes
        io.writeFileJSON(f.origin + "/" + PACKAGEJSON, description)
        assert(install([f.pack, "-d", f.target]).installed == 1, "Generated nested-description package rejected")
        f = fixture("local", "strong", "sha256:" + sha256("strong"))
        assert(install([f.pack, "-d", f.target]).installed == 1, "SHA-256 manifest rejected")
        assert(verifyHashList(f.target, installed.filesHash)["payload.js"], "Installed SHA-256 package cannot be verified")
        f = fixture("local", "trusted", sha1("trusted")); failPre = true
        result = install([f.pack, "-d", f.target])
        assert(result.failed == 1 && result.installed == 0 && calls.post == 0 && calls.register == 0, "Hook failure reported success")
        assert(io.readFileString(f.target + "/payload.js") == "old", "Hook failure did not preserve original payload")
        f = fixture("local", "trusted", sha1("trusted"))
        var promotionManifest = io.readFileJSON(f.origin + "/" + PACKAGEJSON)
        promotionManifest.files.push("blocked.js")
        promotionManifest.filesHash["blocked.js"] = sha1("second")
        io.writeFileString(f.origin + "/blocked.js", "second")
        io.writeFileJSON(f.origin + "/" + PACKAGEJSON, promotionManifest)
        blockCommit = true
        result = install([f.pack, "-d", f.target])
        assert(result.failed == 1 && result.installed == 0 && calls.post == 0 && calls.register == 0, "Promotion failure reported success")
        assert(io.readFileString(f.target + "/payload.js") == "old" && io.readFileString(f.target + "/obsolete.txt") == "old-extra", "Partial promotion was not rolled back")
        assert(!io.fileExists(f.target + "/blocked.js"), "Rollback left a new destination")
        f = fixture("local", "a\u0000b", sha1("a\u0000b"))
        assert(install([f.pack, "-d", f.target]).installed == 1, "Binary hash control rejected")
        f = fixture("local", "a\u0000c", sha1("a\u0000b"))
        assert(install([f.pack, "-d", f.target]).failed == 1, "Binary corruption accepted"); unchanged(f)
        f = fixture("local", "trusted", "invalid-hash")
        assert(install([f.pack, "-d", f.target]).failed == 1, "Malformed hash accepted"); unchanged(f)
        print("oPack staged integrity, sources, hooks, updates and controls PASS")
    } finally { if (isDef(remoteZip)) remoteZip.close(); io.rm(base) }
    exit(0)
} catch(e) { printErr(String(e)); exit(1) }
