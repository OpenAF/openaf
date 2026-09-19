(function() {
  function check(v, message) { if (!v) throw new Error(message); }
  function setup() {
    ow.loadInstrumentation();
    var old = ow.instrumentation;
    ow.instrumentation = new OpenWrap.instrumentation();
    var ins = ow.instrumentation, records = new java.util.concurrent.ConcurrentLinkedQueue();
    ins.registerProvider("capture", { onSpan: function(r) { records.add(JSON.stringify(r)); }, onLog: function(r) { records.add(JSON.stringify(r)); }, onMetric: function(r) { records.add(JSON.stringify(r)); } });
    return { i: ins, records: function(signal) { var a = [], it = records.iterator(); while(it.hasNext()) { var r = JSON.parse(String(it.next())); if (!signal || r.signal === signal) a.push(r); } return a; }, close: function() { ins.shutdown(1000); ow.instrumentation = old; } };
  }
  exports.testInstrumentationCore = function() {
    var s = setup(), i = s.i;
    try {
      check(!i.isEnabled(), "disabled by default");
      check(i.withSpan("disabled", function() { return 42; }) === 42, "disabled return");
      check(s.records().length === 0, "disabled emits nothing");
      i.enable();
      i.withSpan("root", function(span) {
        i.withSpan("child", function() { i.log("INFO", "correlated"); });
        span.end(); span.end();
      });
      var spans = s.records("Span"), root = spans.filter(function(r) { return r.name === "root"; })[0], child = spans.filter(function(r) { return r.name === "child"; })[0];
      check(spans.length === 2 && child.parentSpanId === root.spanId && child.traceId === root.traceId, "nested parentage/idempotence");
      check(s.records("Log")[0].spanId === child.spanId, "log correlation");
      check(!i.captureContext(), "context restored");
      var original = new Error("expected");
      try { i.withSpan("failure", function() { throw original; }); } catch(e) { check(e === original, "exception preserved"); }
      check(s.records("Span").filter(function(r) { return r.name === "failure"; })[0].status.code === "ERROR", "failure status");
      i.registerProvider("broken", { onSpan: function() { throw "provider failure"; } });
      check(i.withSpan("safe", function() { return 7; }) === 7 && i.getStats().providerErrors === 1, "provider isolation");
      var before = s.records().length;
      i.suppress(function() { i.withSpan("suppressed", function() {}); i.log("ERROR", "suppressed"); });
      check(s.records().length === before, "suppression");
      i.configure({ sampleRatio: 0 });
      i.withSpan("unsampled", function() { check(/-00$/.test(i.inject({}).traceparent), "unsampled context propagates"); });
      check(s.records().length === before, "unsampled spans omitted");
      check(!i.extract({ traceparent: "00-00000000000000000000000000000000-1234567890123456-01" }), "zero trace rejected");
      check(!i.extract({ traceparent: "00-12345678901234567890123456789012-1234567890123456-01-extra" }), "invalid v00 length");
      var c = i.extract({ TraceParent: "00-12345678901234567890123456789012-1234567890123456-01", tracestate: "a=b,a=c" });
      check(c && c.sampled && c.traceState === "", "duplicate tracestate ignored");
      var h = { authorization: "secret" }; i.inject(h,c); check(!h.traceparent, "header input unchanged");
      i.configure({ sampleRatio: 1 });
      i.counter("calls", { attributeKeys: ["kind"] }).add(2, { kind: "test", secret: "omit" });
      check(s.records("Metric")[0].attributes.kind === "test" && !s.records("Metric")[0].attributes.secret, "metric attribute allowlist");
      ow.loadMetrics(); ow.metrics.add("instrumentationFixture", function() { return { total: 9 }; });
      i.collectMetrics([{ collector: "instrumentationFixture", path: "total", name: "fixture.total", type: "cumulative" }]);
      check(s.records("Metric")[1].value === 9, "metric explicit mapping");
    } finally { s.close(); }
  };
  exports.testInstrumentationAsync = function() {
    var s = setup(), i = s.i;
    try {
      i.enable();
      i.withSpan("parent", function() {
        var context = i.captureContext(), tasks = [];
        for (var n = 0; n < 12; n++) tasks.push($do(function() { check(i.captureContext().spanId === context.spanId, "worker parent"); i.withSpan("worker", function() { log("instrumentation async log", { off: true, async: true }); }); }));
        tasks.forEach(function(t) { $doWait(t); });
        pForEach([1,2,3,4], function() { check(i.captureContext().spanId === context.spanId, "parallel parent"); });
        $tb().timeout(1000).exec(function() { check(i.captureContext().spanId === context.spanId, "timeout worker parent"); });
      });
      var parent = s.records("Span").filter(function(r) { return r.name === "parent"; })[0];
      check(s.records("Span").filter(function(r) { return r.name === "worker" && r.parentSpanId === parent.spanId; }).length === 12, "workers captured");
      check(s.records("Log").length === 12, "async logs captured once");
      $doWait($do(function() { check(!i.captureContext(), "reused worker clean"); }));
      check(!i.captureContext(), "caller clean");
    } finally { s.close(); }
  };
  exports.testInstrumentationHTTP = function() {
    var s=setup(), i=s.i, server, old;
    try {
      ow.loadObj(); ow.loadServer();
      server = ow.server.httpd.start(findRandomOpenPort(), "127.0.0.1");
      var port = Number(server.getPort());
      ow.server.httpd.route(server, { "/test": function(req) { i.withSpan("server child", function() {}); return server.replyOKJSON(JSON.stringify({ trace: (req.header || req.headers).traceparent })); }, "/failure": function() { return server.reply("failed", "text/plain", 500); } });
      var headers = { "X-Test": "yes" };
      var clientsToTest = ["http"];
      if (String(Packages.org.apache.http.client.methods.HttpGet).indexOf("JavaPackage") < 0) clientsToTest.push("http0");
      else print("SKIP legacy http0 wire test: Apache HttpClient 4 is not on the classpath");
      clientsToTest.forEach(function(type) {
        i.enable(); var client = new ow.obj[type]();
        try { i.withSpan(type + " root", function() { var result = client.exec("http://127.0.0.1:"+port+"/test?secret=hidden", "GET", undefined, headers); check(Number(result.responseCode) === 200, "HTTP response"); }); } finally { client.close(); }
      });
      check(!headers.traceparent, "caller headers preserved");
      var spans=s.records("Span"), clients=spans.filter(function(r){ return r.kind === "CLIENT"; }), servers=spans.filter(function(r){ return r.kind === "SERVER"; });
      check(clients.length===clientsToTest.length && servers.length===clientsToTest.length, "one client/server span per request");
      servers.forEach(function(r){ check(clients.some(function(c){ return c.spanId===r.parentSpanId && c.traceId===r.traceId; }), "wire parentage"); });
      check(JSON.stringify(spans).indexOf("secret=hidden") < 0, "query excluded");
      var count=spans.length, http=new ow.obj.http();
      try { http.setThrowExceptions(false); http.exec("http://127.0.0.1:"+port+"/failure", "GET", undefined, {}, false, 1000, false, { instrumentation: false }); } finally { http.close(); }
      check(s.records("Span").filter(function(r){return r.kind === "CLIENT";}).length===clientsToTest.length,"per-call client opt-out");
    } finally { if(server) server.stop(); s.close(); }
  };
  exports.testInstrumentationChannels = function() {
    var s=setup(), i=s.i, cp, batch, server;
    try {
      i.enable(); cp=i.channelProvider({ prefix: "testTelemetry"+i._id(), maxRecords: 2, retentionMs: 100 }); i.registerProvider("channel",cp);
      i.withSpan("one",function(){}); i.withSpan("two",function(){}); i.withSpan("three",function(){});
      check($ch(cp.channels.Span).size()===2,"bounded retention");
      check(cp.getStats().evicted===1,"eviction count");
      var attempts=0, ids=[];
      batch=i.batchProvider(function(signal,records){ attempts++; ids.push(records[0].id); return attempts===1 ? {retry:true,retryAfterMs:0} : {}; }, { intervalMs:60000,maxPending:2 });
      batch.onSpan({ signal:"Span",id:"one" }); batch.onSpan({ signal:"Span",id:"two" }); batch.onSpan({ signal:"Span",id:"three" });
      batch.flush(1000);
      check(batch.getStats().dropped===1 && batch.getStats().sent===2 && ids[0]===ids[1],"overflow and stable retry IDs");
      ow.loadServer(); server=ow.server.httpd.start(findRandomOpenPort(),"127.0.0.1");
      cp.exposeChannels(server,"/telemetry",function(u,p){return u==="user" && p==="pass";});
      var before=s.records("Span").length;
      i.suppress(function(){
        var url="http://127.0.0.1:"+server.getPort()+"/telemetry/span";
        $ch("telemetryRemoteTest").create("remote",{url:url,login:"user",password:"pass"});
        try { check(Array.isArray($ch("telemetryRemoteTest").getAll()),"remote inspect"); try { $ch("telemetryRemoteTest").set({id:"forbidden"},{id:"forbidden"}); } catch(e) {} check(!$ch(cp.channels.Span).get({id:"forbidden"}),"read-only exposure"); } finally { $ch("telemetryRemoteTest").destroy(); }
      });
      check(s.records("Span").length===before,"inspection does not trace itself");
      sleep(200,true); check($ch(cp.channels.Span).size()===0,"age retention");
    } finally { if(server)server.stop(); if(batch)batch.shutdown(100); s.close(); if(cp)Object.keys(cp.channels).forEach(function(k){$ch(cp.channels[k]).destroy();}); }
  };
  exports.testInstrumentationOJob = function() {
    var s=setup(), i=s.i;
    try {
      ow.loadOJob(); i.enable();
      ow.oJob.load([], [], { instrumentation: { enabled: false } });
      check(!i.isEnabled(), "job configuration disables active instrumentation");
      ow.oJob.load([], [], { instrumentation: { enabled: true } });
      check(i.isEnabled(), "job configuration explicitly enables instrumentation");
      i.withSpan("job parent",function(){
        ow.oJob.runJob({name:"telemetry job",type:"simple",typeArgs:{async:false},exec:"args.value=17;",args:{}},{},"telemetry",true);
      });
      check(s.records("Span").some(function(r){return r.name==="ojob telemetry job" && r.parentSpanId;}),"job span parent");
      var count=s.records("Span").length;
      i.disable(); ow.oJob.runJob({name:"disabled job",type:"simple",typeArgs:{async:false},exec:"args.value=18;",args:{}},{},"telemetry",true);
      check(s.records("Span").length===count,"job disabled");
    } finally {s.close();}
  };
  exports.testInstrumentationTwoProcess = function() {
    var dir = String(java.nio.file.Files.createTempDirectory("openaf-trace-")), process, s = setup(), ins = s.i;
    var fixture = dir + "/server.js", ready = dir + "/ready.json", spans = dir + "/spans.json";
    var source = '(function(){ow.loadServer();var i=ow.loadInstrumentation(),rs=[];i.registerProvider("capture",{onSpan:function(r){rs.push(r);}});i.enable();var server=ow.server.httpd.start(findRandomOpenPort(),"127.0.0.1");ow.server.httpd.route(server,{"/trace":function(req){i.withSpan("remote child",function(){});return server.replyOKJSON(JSON.stringify({context:i.captureContext(),spans:rs}));}});io.writeFile(' + JSON.stringify(ready) + ',{port:Number(server.getPort())});while(true)sleep(1000,true);})();';
    io.writeFileString(fixture, source);
    try {
      var cmd = new java.util.ArrayList(); [String(java.lang.System.getProperty("java.home")) + "/bin/java", "-jar", getOpenAFJar(), "-f", fixture].forEach(function(v){cmd.add(String(v));});
      process = new java.lang.ProcessBuilder(cmd).redirectErrorStream(true).redirectOutput(new java.io.File(dir + "/server.log")).start();
      var deadline = Date.now()+10000;
      while(!io.fileExists(ready) && process.isAlive() && Date.now()<deadline) sleep(25,true);
      check(io.fileExists(ready),"child HTTP server ready: "+io.readFileString(dir+"/server.log"));
      var port=io.readFileJSON(ready).port, remoteResult; ins.enable(); ow.loadObj();
      ins.withSpan("process parent",function(){var http=new ow.obj.http();try{remoteResult=JSON.parse(http.get("http://127.0.0.1:"+port+"/trace").response);}finally{http.close();}});
      var remote=remoteResult.spans, local=s.records("Span").filter(function(r){return r.kind==="CLIENT";})[0];
      var serverContext=remoteResult.context, child=remote.filter(function(r){return r.name==="remote child";})[0];
      check(serverContext && serverContext.traceId===local.traceId,"cross-process trace continuity");
      check(child && child.parentSpanId===serverContext.spanId,"remote nested parentage");
    } finally {
      if(process){process.destroy();if(!process.waitFor(2,java.util.concurrent.TimeUnit.SECONDS))process.destroyForcibly();}
      s.close();
      [fixture,ready,spans,dir+"/server.log"].forEach(function(f){if(io.fileExists(f))io.rm(f);});io.rm(dir);
    }
  };
  exports.testInstrumentationForwarding = function() {
    var s=setup(), ins=s.i, provider, server, receiver="telemetrySink"+ins._id();
    try {
      ow.loadCh();ow.loadServer();$ch(receiver).create();server=ow.server.httpd.start(findRandomOpenPort(),"127.0.0.1");
      ow.ch.server.expose(receiver,server,"/receive",function(u,p,session,req){req.channelPermission="rw";return u==="writer" && p==="pass";});
      provider=ins.channelProvider({prefix:"forward"+ins._id(),intervalMs:60000,remote:{Span:{url:"http://127.0.0.1:"+server.getPort()+"/receive",login:"writer",password:"pass"}}});
      // Receiver transport is deliberately outside auto capture in this local fixture.
      ins.configure({http:false,logs:false});ins.registerProvider("forward",provider);ins.enable();
      ins.withSpan("forwarded",function(){});provider.flush(2000);
      var local=$ch(provider.channels.Span).getAll()[0],remote=$ch(receiver).getAll();
      check(remote.length===1 && remote[0].id===local.id,"forwarding retains record ID");
      provider.onSpan(local);provider.flush(2000);check($ch(receiver).size()===1,"duplicate delivery is idempotent");
      server.stop();server=undefined;ins.withSpan("outage",function(){});provider.flush(100);
      check(provider.getStats().forwarding.pending.Span===1,"outage retains bounded pending record");
      var start=Date.now();provider.shutdown(100);check(Date.now()-start<1000,"bounded shutdown");
    } finally {if(server)server.stop();s.close();if(provider)Object.keys(provider.channels).forEach(function(k){$ch(provider.channels[k]).destroy();});$ch(receiver).destroy();}
  };
})();
