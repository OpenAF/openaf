// Standalone loopback regression: java -jar openaf.jar -f tests/ojob-download-limits.js.
try {
    ow.loadOJob(); ow.loadServer(); ow.loadTest(); plugin("HTTPServer")
    // Exercise checkout source, including when the bootstrap JAR predates this patch.
    af.load("js/owrap.oJob.js")
    Object.setPrototypeOf(ow.oJob, OpenWrap.oJob.prototype)
    var names = ["maxRemoteBytes","maxRemoteTotalBytes","maxRemoteRequests","maxLoadFiles","maxIncludeDepth","remoteTimeoutMs"]
    var saved = {}, server, job = ow.oJob, domains = job.authorizedDomains.slice(0), fileList = job.fileList.slice(0)
    var flags = { integrity: OJOB_INTEGRITY, strict: OJOB_INTEGRITY_STRICT, warn: OJOB_INTEGRITY_WARN, validation: OJOB_VALIDATION_STRICT, signature: OJOB_SIGNATURE_STRICT, unsafe: __JSONformat.unsafe }
    names.forEach(n => saved[n] = java.lang.System.getProperty("openaf.ojob." + n))
    function set(name, value) { java.lang.System.setProperty("openaf.ojob." + name, String(value)) }
    function reset(name) { java.lang.System.clearProperty("openaf.ojob." + name) }
    function check(ok, message) { if (!ok) throw new Error(message) }
    function fails(fn, fragment) {
        var error
        try { fn() } catch(e) { error = String(e) }
        check(isDef(error) && error.indexOf(fragment) >= 0, "Expected " + fragment + ", got " + error)
    }
    var small = '{"todo":[],"jobs":[],"ojob":{"includeOJob":false}}'
    var exact = small + " ".repeat(128 - small.length), large = exact + " "
    var huge = small + " ".repeat(2 * 1024 * 1024), root
    try {
        names.forEach(reset)
        set("maxRemoteBytes",128)
        job.authorizedDomains = ["127.0.0.1"]
        OJOB_INTEGRITY = {}; OJOB_INTEGRITY_STRICT = false; OJOB_INTEGRITY_WARN = false
        OJOB_VALIDATION_STRICT = false; OJOB_SIGNATURE_STRICT = false
        server = new HTTPd(0,"127.0.0.1",__,__,__,__,5000,"java")
        root = "http://127.0.0.1:" + server.getPort()
        server.add("/exact.json", () => server.replyOKText(exact))
        server.add("/large.json", () => server.replyOKText(large))
        server.add("/chunked.json", () => server.replyStream(af.fromString2InputStream(large),"application/json",200,{}))
        server.add("/gzip.json", () => server.replyStream(new java.io.ByteArrayInputStream(io.gzip(af.fromString2Bytes(huge))),"application/json",200,{"Content-Encoding":"gzip"}))
        server.add("/redirect.json", () => server.replyStream(af.fromString2InputStream(huge),"text/plain",302,{Location:"/exact.json"}))
        server.add("/error.json", () => server.replyStream(af.fromString2InputStream(huge),"text/plain",503,{}))
        server.add("/slow.json", () => { sleep(300); return server.replyOKText(small) })
        server.add("/unsafe.json", () => server.replyOKText('{"ojob":{"probe":"!!js/eval global.__ojobBudgetExecuted = true"},"todo":[],"jobs":[]}' + " ".repeat(256)))
        server.add("/graph.json", () => server.replyOKText(stringify({ include:[root+"/child0.json",root+"/child1.json",root+"/child2.json"], jobs:[],todo:[],ojob:{includeOJob:false} })))
        for (var i=0; i<3; i++) server.add("/child"+i+".json", () => server.replyOKText(exact))
        server.add("/chain0.json", () => server.replyOKText(stringify({include:[root+"/chain1.json"],jobs:[],todo:[],ojob:{includeOJob:false}})))
        server.add("/chain1.json", () => server.replyOKText(stringify({include:[root+"/chain2.json"],jobs:[],todo:[],ojob:{includeOJob:false}})))
        server.add("/chain2.json", () => server.replyOKText(small))
        check(job.__readAuthorizedRemoteBytes(root+"/exact.json").length == 128, "Exact-limit response rejected")
        fails(() => job.__readAuthorizedRemoteBytes(root+"/large.json"), "byte budget")
        fails(() => job.__readAuthorizedRemoteBytes(root+"/chunked.json"), "byte budget")
        fails(() => job.__readAuthorizedRemoteBytes(root+"/gzip.json"), "byte budget")
        check(job.__readAuthorizedRemoteBytes(root+"/redirect.json").length == 128, "Redirect body was buffered/charged")
        fails(() => job.__readAuthorizedRemoteBytes(root+"/error.json"), "HTTP response code 503")
        OJOB_INTEGRITY[root+"/unsafe.json"] = "sha256-"+sha256("wrong")
        OJOB_INTEGRITY_STRICT = true; __JSONformat.unsafe = true
        fails(() => job.__loadFile(root+"/unsafe.json"), "byte budget")
        check(isUnDef(global.__ojobBudgetExecuted), "Oversized definition reached executable parsing")
        OJOB_INTEGRITY = {}; OJOB_INTEGRITY_STRICT = false; __JSONformat.unsafe = false
        set("maxRemoteBytes",512); set("maxRemoteTotalBytes",400)
        fails(() => job.__loadFile(root+"/graph.json"), "byte budget")
        reset("maxRemoteTotalBytes"); set("maxLoadFiles",2)
        fails(() => job.__loadFile(root+"/graph.json"), "include budget")
        reset("maxLoadFiles"); set("maxIncludeDepth",2)
        fails(() => job.loadJSON({include:[root+"/chain0.json"],jobs:[],todo:[],ojob:{includeOJob:false}}), "include budget")
        reset("maxIncludeDepth"); set("maxRemoteRequests",1)
        fails(() => job.__readAuthorizedRemoteBytes(root+"/redirect.json"), "request budget")
        reset("maxRemoteRequests"); set("remoteTimeoutMs",50)
        var started = now()
        fails(() => job.__readAuthorizedRemoteBytes(root+"/slow.json"), "")
        check(now()-started < 2000, "Remote deadline was not bounded")
        reset("remoteTimeoutMs")
        check(job.__readAuthorizedRemoteBytes(root+"/exact.json").length == 128, "Failure poisoned later load")
        set("maxRemoteBytes",128); set("maxRemoteTotalBytes",128)
        var concurrent = pForEach([1,2], () => job.__readAuthorizedRemoteBytes(root+"/exact.json").length)
        check(concurrent.length==2 && concurrent.every(n=>n==128), "Concurrent operations shared/reset each other's budget")
        check(isNull(job.__remoteLoadContext.get()), "Load context leaked after operation")
        print("Remote oJob byte/graph/deadline/decoded-response and recovery controls PASS")
    } finally {
        if (isDef(server)) server.stop()
        names.forEach(n => { if (isNull(saved[n])) reset(n); else set(n,saved[n]) })
        job.authorizedDomains = domains; job.fileList = fileList
        OJOB_INTEGRITY = flags.integrity; OJOB_INTEGRITY_STRICT = flags.strict; OJOB_INTEGRITY_WARN = flags.warn
        OJOB_VALIDATION_STRICT = flags.validation; OJOB_SIGNATURE_STRICT = flags.signature; __JSONformat.unsafe = flags.unsafe
        delete global.__ojobBudgetExecuted
    }
    exit(0)
} catch(e) { printErr(String(e)); exit(1) }
