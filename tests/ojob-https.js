// Standalone regression: java -jar openaf.jar -f tests/ojob-https.js
// Stub only the transport; execute the checkout's real URL/redirect policy.
try {
  ow.loadOJob(); ow.loadObj()
  af.load("js/owrap.oJob.js")
  Object.setPrototypeOf(ow.oJob, OpenWrap.oJob.prototype)
  var job = ow.oJob, factory = ow.obj.rest.connectionFactory
  var domains = job.authorizedDomains, seen = [], replies = {}, closed = 0
  function check(ok, message) { if (!ok) throw new Error(message) }
  function fails(url) {
    var error
    try { job.__readAuthorizedRemoteBytes(url) } catch(e) { error = String(e) }
    check(isDef(error) && error.indexOf("Unauthorized URL") >= 0, "Expected URL rejection: " + url + ": " + error)
  }
  try {
    job.authorizedDomains = ["allowed.test"]
    ow.obj.rest.connectionFactory = function() {
      var reply, builder = {
        followRedirects: function(v) { check(v === false, "Automatic redirects enabled"); return this },
        followSslRedirects: function(v) { check(v === false, "Automatic SSL redirects enabled"); return this },
        connectTimeout: function() { return this }, readTimeout: function() { return this },
        callTimeout: function() { return this }, build: function() { return this }
      }
      return {
        client: { newBuilder: () => builder }, setThrowExceptions: function() {}, login: function() {},
        getStream: function(url) {
          seen.push(String(url)); reply = replies[String(url)] || {code:200}
          this._response = { header: () => reply.location, body: () => ({contentLength: () => 2}) }
          return new java.io.ByteArrayInputStream(af.fromString2Bytes("{}"))
        },
        responseCode: () => reply.code, close: () => { closed++ }
      }
    }
    fails("http://allowed.test/job.json")
    fails("HTTP://allowed.test/job.json")
    check(seen.length == 0, "HTTP opened a connection")
    check(job.__readAuthorizedRemoteBytes("https://allowed.test/job.json").length == 2, "HTTPS rejected")
    replies["https://allowed.test/start"] = {code:302, location:"/next"}
    replies["https://allowed.test/next"] = {code:307, location:"https://allowed.test/final"}
    check(job.__readAuthorizedRemoteBytes("https://allowed.test/start").length == 2, "HTTPS redirects rejected")
    ;[301,302,303,307,308].forEach(code => {
      replies["https://allowed.test/down"] = {code:code, location:"http://allowed.test/injected.json"}
      var before = seen.length
      fails("https://allowed.test/down")
      check(seen.length == before + 1, "Downgrade target was fetched")
    })
    replies["https://allowed.test/foreign"] = {code:302, location:"https://other.test/job.json"}
    var before = seen.length
    fails("https://allowed.test/foreign")
    check(seen.length == before + 1, "Unauthorized redirect fetched")
    check(closed == seen.length, "Connections leaked")
    check(isNull(job.__remoteLoadContext.get()), "Context leaked after rejection")
    print("HTTPS initial/redirect controls, HTTP rejection, host authorization and cleanup PASS")
  } finally {
    ow.obj.rest.connectionFactory = factory
    job.authorizedDomains = domains
  }
  exit(0)
} catch(e) { printErr(String(e)); exit(1) }
