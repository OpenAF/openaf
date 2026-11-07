// Generic client regressions. No Node, npm, browser or external network required.
(function() {
  var check = (actual, expected, message) => ow.test.assert(actual, expected, message)
  var peer = (timeout, options) => $mcp(merge({ cmd: [String(java.lang.System.getProperty("java.home")) + "/bin/java", "-jar", getOpenAFJar(), "-f", io.fileInfo("fixtures/mcp-peer.js").canonicalPath], timeout: timeout || 15000 }, options || {}))

  exports.testResourcesAndApps = function() {
    var c = $mcp({ type: "dummy", options: {
      capabilities: { resources: {} },
      fns: {
        "resources/list": p => p.cursor ? { resources: [{ uri: "data:second" }] } : { resources: [{ uri: "ui://fixture/app" }], nextCursor: "2", _meta: { keep: true } },
        "resources/templates/list": p => ({ resourceTemplates: [{ uriTemplate: "data:{id}", name: "data" }] }),
        "resources/read": p => ({ contents: [{ uri: p.uri, mimeType: "text/html;profile=mcp-app", text: "<p>untrusted</p>", _meta: { ui: { csp: { connectDomains: [] } } } }, { uri: p.uri, mimeType: "image/png", blob: "AAEC" }], extra: true }),
        app: p => ({ structuredContent: { ok: true }, content: [{ type: "audio", data: "AAEC", mimeType: "audio/wav" }], _meta: { keep: true } })
      },
      fnsMeta: { app: { name: "app", inputSchema: { type: "object", additionalProperties: false }, _meta: { ui: { resourceUri: "ui://fixture/app" } } } }
    } })
    try {
      c.initialize()
      check(c.listResources().resources.length, 2, "Resource pagination")
      check(c.listResources()._meta.keep, true, "Resource metadata")
      check(c.listResourceTemplates().resourceTemplates[0].uriTemplate, "data:{id}", "Templates")
      check(c.getAppResource("app").contents[1].blob, "AAEC", "App and binary contents preserved")
      check(c.hasApps(), true, "App detection")
      check(c.getToolUI("app").resourceUri, "ui://fixture/app", "Tool UI metadata")
      var result = c.callTool("app", {})
      check(result.structuredContent.ok, true, "Structured result preserved")
      var fn, schema
      c.toGptTools({ withTool: (n, d, s, f) => { if (n == "app") { fn = f; schema = s } } }, ["app"])
      check(schema.additionalProperties, false, "Full input schema")
      check(jsonParse(fn({})).content[0].mimeType, "audio/wav", "Rich GPT result retains MIME type")
      var rejected = false
      try { c.subscribeResource("ui://fixture/app", () => {}) } catch(e) { rejected = true }
      check(rejected, true, "Unsupported subscriptions fail explicitly")
      rejected = false
      try { c.readResource("relative/path") } catch(e) { rejected = true }
      check(rejected, true, "Relative resource URI rejected")
    } finally { c.destroy() }
    c = $mcp({ type: "dummy" })
    try {
      c.initialize()
      var rejected = false
      try { c.listResources() } catch(e) { rejected = true }
      check(rejected, true, "Missing resource capability")
    } finally { c.destroy() }
  }

  exports.testBidirectionalStdio = function() {
    var c = peer(), updates = $atomic(0)
    c.onSamplingRequest(p => ({ role: "assistant", model: "fixture", content: { type: "text", text: c.exec("nested", {}).value } }))
    c.onNotification("notifications/resources/updated", () => updates.inc())
    try {
      c.initialize()
      check(c.callTool("sample", {}).content[0].text, "nested-ok", "Nested synchronous request does not block reader")
      check(c.exec("unknown", {}).code, -32601, "Unregistered request gets JSON-RPC error")
      var nestedResult, concurrent = []
      $doWait($doAll([ $do(() => { nestedResult = c.callTool("sample", {}) }) ].concat(range(8, 0).map(i => $do(() => { concurrent[i] = c.exec("nested", {}).value })))))
      check(nestedResult.content[0].text, "nested-ok", "Inbound callback alongside concurrent outbound requests")
      check(concurrent.every(v => v == "nested-ok"), true, "Queue IDs remain independent of inbound response IDs")
      var subscribed = $atomic(0)
      c.subscribeResource("data:item", () => subscribed.inc())
      var deadline = now() + 3000
      while ((updates.get() == 0 || subscribed.get() == 0) && now() < deadline) sleep(20, true)
      check(subscribed.get(), 1, "Subscription callback")
      check(updates.get(), 1, "Public notification handler coexists")
      c.unsubscribeResource("data:item")
      check(c.readResource("data:item").contents[0].blob, "AAEC", "Stdio binary resource")
      check(c.exec("malformed", {}).survived, true, "Malformed line does not kill reader")
      c.offRequest("sampling/createMessage")
      c.offNotification("notifications/resources/updated")
    } finally { c.destroy() }
  }

  exports.testHTTPInboundAndSession = function() {
    ow.loadServer()
    var port = findRandomOpenPort(), hs = ow.server.httpd.start(port, "127.0.0.1")
    var replies = [], deletes = 0, calls = 0, headers = []
    ow.server.httpd.route(hs, { "/mcp": req => {
      if (req.method == "DELETE") { deletes++; check(req.header.authorization, "Bearer fixture", "DELETE auth"); return ow.server.httpd.reply("", 204) }
      var m = jsonParse(isDef(req.files) && isDef(req.files.postData) ? req.files.postData : req.data)
      headers.push(req.header)
      if (isUnDef(m.method)) { replies.push(m); return ow.server.httpd.reply("", 202) }
      if (isUnDef(m.id)) return ow.server.httpd.reply("", 202)
      var result = {}
      if (m.method == "initialize") result = { protocolVersion: "2025-11-25", capabilities: { resources: {}, tools: {} }, serverInfo: { name: "http-fixture", version: "1" } }
      else if (m.method == "tools/call") {
        calls++
        if (m.params.name == "expire") return ow.server.httpd.reply("expired", 404, "text/plain")
        var request = { jsonrpc: "2.0", id: "elicit", method: "elicitation/create", params: { mode: "form", message: "confirm", requestedSchema: { type: "object" } } }
        return ow.server.httpd.reply(af.fromString2Bytes("data: " + stringify(request, __, "") + "\n\ndata: " + stringify({ jsonrpc: "2.0", id: m.id, result: { content: [{ type: "text", text: "ok" }], structuredContent: [1, 2] } }, __, "") + "\n\n"), 200, "text/event-stream")
      } else if (m.method == "resources/read") result = { contents: [{ uri: m.params.uri, text: "resource", mimeType: "text/plain" }] }
      return ow.server.httpd.reply({ jsonrpc: "2.0", id: m.id, result: result }, 200, "application/json", { "Mcp-Session-Id": "fixture-session" })
    } })
    var c = $mcp({ url: "http://127.0.0.1:" + port + "/mcp", auth: { type: "bearer", token: "fixture" } })
    c.onElicitationRequest(p => ({ action: "decline" }))
    try {
      c.initialize()
      check(c.callTool("normal", {}).structuredContent.length, 2, "SSE tool result")
      check(replies[0].result.action, "decline", "HTTP inbound reply")
      check(headers.every(h => h.authorization == "Bearer fixture"), true, "HTTP reply authentication")
      check(c.readResource("data:item").contents[0].text, "resource", "HTTP resource")
      check(c.callTool("expire", {}).error.code, -32000, "Session expiry surfaced for mutation")
      check(calls, 2, "Mutating tool is never replayed")
    } finally { c.destroy(); c.destroy(); ow.server.httpd.stop(hs) }
    check(deletes, 1, "Session DELETE")
  }

  exports.testModernContinuationAndCapabilities = function() {
    ow.loadServer()
    var port = findRandomOpenPort(), hs = ow.server.httpd.start(port, "127.0.0.1"), requests = []
    ow.server.httpd.route(hs, { "/mcp": req => {
      var m = jsonParse(req.files.postData)
      requests.push(m)
      check(req.header["mcp-method"], m.method, "Modern method header including discovery probe")
      if (isString(m.params.name)) check(req.header["mcp-name"], m.params.name, "Modern name header")
      var result = m.method == "server/discover" ? { protocolVersions: ["2026-07-28"], capabilities: { tools: {} }, serverInfo: { name: "modern", version: "1" } } :
        isDef(m.params.inputResponses) ? { resultType: "complete", value: m.params.inputResponses.confirm.action, state: m.params.requestState } :
        { resultType: "input_required", requestState: "opaque", inputRequests: { confirm: { method: "elicitation/create", params: { message: "confirm", requestedSchema: { type: "object" } } } } }
      return ow.server.httpd.reply({ jsonrpc: "2.0", id: m.id, result: result }, 200, "application/json")
    } })
    var c = $mcp({ url: "http://127.0.0.1:" + port + "/mcp", protocolVersion: "auto", capabilities: { sampling: {}, roots: {} } })
    c.onElicitationRequest(() => ({ action: "decline" })).setRoots([])
    try {
      c.initialize()
      var caps = requests[0].params._meta["io.modelcontextprotocol/clientCapabilities"]
      check(isUnDef(caps.sampling), true, "Unconfigured sampling is not advertised")
      check(isMap(caps.elicitation.form), true, "Configured elicitation is advertised")
      check(isUnDef(caps.roots.listChanged), true, "Removed modern roots notification capability omitted")
      var result = c.callTool("confirmation", {})
      check(c.isInputRequired(result), true, "Input-required remains visible")
      check(requests.length, 2, "No implicit retry")
      var continued = c.continueRequest("tools/call", { name: "confirmation", arguments: {} }, result)
      check(continued.value, "decline", "Continuation uses registered handler")
      check(continued.state, "opaque", "Opaque requestState preserved")
      var explicit = $mcp({url:"http://127.0.0.1:"+port+"/mcp",protocolVersion:"2026-07-28"})
      try {
        explicit.initialize()
        check(explicit.getClientInfo().era,"modern","Explicit stateless protocol uses discovery rather than legacy initialize")
      } finally { explicit.destroy() }
    } finally { c.destroy(); ow.server.httpd.stop(hs) }
  }

  exports.testTimeoutAndCleanup = function() {
    var c = peer(3000), pid
    try {
      c.initialize()
      pid = c.exec("pid", {}).pid
      var timedOut = false
      try { c.exec("timeout", {}) } catch(e) { timedOut = String(e).indexOf("timed out") >= 0 }
      check(timedOut, true, "Request timeout is explicit")
      check(c.exec("nested", {}).value, "nested-ok", "Connection survives timeout")
      check(c.exec("cancellation", {}).reason, "Client timeout", "Timeout sends cancellation")
      check(c.exec("cancelme", {}, {onRequestId:id => c.cancelRequest(id, "test")}).cancelled, true, "Explicit request cancellation")
    } finally { c.destroy() }
    if (isDef(pid)) check(java.lang.ProcessHandle.of(pid).isPresent(), false, "destroy terminates child process")
  }

  exports.testRequestHandlersAndRoots = function() {
    var c = peer()
    c.setRoots([{ uri: "file:///explicit", name: "Explicit" }])
    c.onElicitationRequest(() => ({ action: "decline" }))
    c.onRequest("custom/failure", () => { throw { code: -32602, message: "invalid", data: { reason: "fixture" } } })
    try {
      c.initialize()
      check(c.exec("ask", { method: "roots/list" }).roots[0].uri, "file:///explicit", "Explicit roots round trip")
      check(c.exec("ask", { method: "elicitation/create" }).action, "decline", "Headless elicitation")
      check(c.exec("ask", { method: "custom/failure" }).error.data.reason, "fixture", "Handler error data")
      c.offRequest("custom/failure")
      check(c.exec("ask", { method: "custom/failure" }).error.code, -32601, "Deregistered handler")
      c.setRoots([])
      check(c.exec("ask", { method: "roots/list" }).roots.length, 0, "Updated roots")
      var rejected = false
      try { c.setRoots([{uri:"file:relative"}]) } catch(e) { rejected = true }
      check(rejected, true, "Opaque file URI rejected")
    } finally { c.destroy() }
    var rejected = false
    try { c.exec("nested", {}) } catch(e) { rejected = true }
    check(rejected, true, "Calls after destroy fail immediately")
    c = peer(15000, {protocolVersion:"2024-11-05"})
    c.onElicitationRequest(() => ({action:"decline"}))
    try {
      c.initialize()
      check(isUnDef(c.getInfo().clientCapabilities.elicitation), true, "2024 capability advertisement excludes elicitation")
      check(c.exec("ask", {method:"elicitation/create"}).error.code,-32602,"2024 elicitation rejected")
    } finally { c.destroy() }
  }

  exports.testRichResultsAndLegacyGPT = function() {
    var rich = { content: [
      { type: "text", text: "caption" },
      { type: "image", mimeType: "image/png", data: "AAEC" },
      { type: "audio", mimeType: "audio/wav", data: "AAEC" },
      { type: "resource_link", uri: "data:item", name: "item" },
      { type: "resource", resource: { uri: "data:text", mimeType: "text/plain", text: "embedded" } }
    ], structuredContent: [1, "value"], isError: false, future: { keep: true } }
    var before = 0, after = 0, c = $mcp({ type: "dummy", blacklist: ["blocked"],
      preFn: () => before++, posFn: () => after++, options: {
        fns: { rich: () => rich, plain: () => ({content:[{type:"text",text:"legacy"}]}), hidden: () => ({}), blocked: () => ({}) },
        fnsMeta: {
          rich: {name:"rich", inputSchema:{type:"object"}}, plain: {name:"plain", inputSchema:{type:"object"}},
          hidden: {name:"hidden", inputSchema:{type:"object"}, _meta:{ui:{visibility:["app"]}}}, blocked:{name:"blocked"}
        }
      } })
    try {
      c.initialize()
      check(c.callTool("rich", {}), rich, "Every content variant preserved")
      var fns = {}
      c.toGptTools({ withTool: (n, d, s, fn) => { fns[n] = fn } })
      check(isUnDef(fns.hidden), true, "App-only tool excluded from model")
      check(isUnDef(fns.blocked), true, "Blacklist retained")
      check(fns.plain({}), "legacy", "Legacy text return")
      check(jsonParse(fns.rich({})), rich, "GPT rich envelope survives serialization")
      check(before, after, "Tool hooks remain paired")
    } finally { c.destroy() }
  }

  exports.testSSEFramingAndDispatch = function() {
    var c = $jsonrpc({type:"dummy"}), count = 0
    c.onNotification("notifications/progress", p => { count += p.progress })
    var events = ': comment\r\nevent: message\r\ndata: {"jsonrpc":"2.0","method":"notifications/progress","params":{"progress":2}}\r\n\r\n' +
      'data: {"jsonrpc":"2.0","id":8,"result":{"ok":true}}\r\n\r\n' +
      'data: {"jsonrpc":"2.0","id":9,"result":{"wrong":true}}\r\n\r\n'
    try {
      var result = c._readSSE(af.fromString2InputStream(events), 8)
      check(result.length, 1, "SSE stops at matching response")
      check(result[0].result.ok, true, "CRLF SSE response")
      check(count, 2, "SSE notification dispatched")
      c.onRequest("throw", () => { throw new Error("fixture") })
      check(c.handleRequest({method:"throw"}).error.code, -32603, "Unexpected callback errors become internal errors")
      c.onRequest("throw-null", () => { throw null })
      check(c.handleRequest({method:"throw-null"}).error.code,-32603,"Null callback errors are handled")
      c.offRequest("throw")
      check(c.handleRequest({method:"throw"}).error.code, -32601, "Unknown callback")
    } finally { c.destroy() }
  }

  exports.testHTTPListener = function() {
    ow.loadServer()
    var port = findRandomOpenPort(), hs = ow.server.httpd.start(port, "127.0.0.1"), gets = 0, updated = $atomic(0), reject = false
    ow.server.httpd.route(hs, { "/mcp": req => {
      if (req.method == "GET") {
        gets++
        if (reject) return ow.server.httpd.reply("", 405)
        check(req.header.authorization, "Bearer listener", "Listener auth")
        check(req.header["x-fixture"], "retained", "Listener custom headers")
        return ow.server.httpd.reply(af.fromString2Bytes('data: {"jsonrpc":"2.0","method":"notifications/resources/updated","params":{"uri":"data:item"}}\n\n'), 200, "text/event-stream")
      }
      if (req.method == "DELETE") return ow.server.httpd.reply("", 204)
      var m = jsonParse(req.files.postData)
      if (isUnDef(m.id)) return ow.server.httpd.reply("", 202)
      return ow.server.httpd.reply({jsonrpc:"2.0",id:m.id,result:m.method == "initialize" ? {protocolVersion:"2025-06-18",capabilities:{resources:{subscribe:true}}} : {}}, 200, "application/json")
    } })
    var c = $mcp({url:"http://127.0.0.1:"+port+"/mcp", auth:{type:"bearer",token:"listener"}, options:{requestHeaders:{"x-fixture":"retained"}}})
    try {
      c.initialize()
      c.subscribeResource("data:item", () => updated.inc())
      var deadline = now() + 3000
      while (updated.get() == 0 && now() < deadline) sleep(20, true)
      check(gets, 1, "One GET listener")
      check(updated.get(), 1, "HTTP resource update callback")
      c.unsubscribeResource("data:item")
      c.stopListening()
      check(c.getClientInfo().listenerActive, false, "Listener stopped")
      reject = true
      var rejected = false
      try { c.subscribeResource("data:item", () => {}) } catch(e) { rejected = true }
      check(rejected, true, "HTTP 405 subscription rejected")
    } finally { c.destroy(); ow.server.httpd.stop(hs) }
  }

  exports.testHTTPMalformedResponses = function() {
    ow.loadServer()
    var port = findRandomOpenPort(), hs = ow.server.httpd.start(port, "127.0.0.1")
    ow.server.httpd.route(hs, { "/mcp": req => {
      var m = jsonParse(req.files.postData)
      if (m.method == "initialize") return ow.server.httpd.reply({jsonrpc:"2.0",id:m.id,result:{protocolVersion:"2099-01-01",capabilities:{}}},200,"application/json")
      return ow.server.httpd.reply({jsonrpc:"2.0",id:m.id + 1,result:{wrong:true}}, 200, "application/json")
    } })
    var c = $jsonrpc({url:"http://127.0.0.1:"+port+"/mcp"})
    try {
      var rejected = false
      try { c.exec("test", {}) } catch(e) { rejected = String(e).indexOf("mismatched") >= 0 }
      check(rejected, true, "Mismatched HTTP response rejected")
      var m = $mcp({url:"http://127.0.0.1:"+port+"/mcp"})
      try {
        rejected = false
        try { m.initialize() } catch(e) { rejected = String(e).indexOf("Unsupported negotiated MCP version") >= 0 }
        check(rejected,true,"Unsupported negotiated versions fail explicitly")
      } finally { m.destroy() }
    } finally { c.destroy(); ow.server.httpd.stop(hs) }
  }

  exports.testAppsHostContract = function() {
    var result = {content:[{type:"text",text:"view"}],structuredContent:{value:1},_meta:{privateUI:"preserved"}}
    var c = $mcp({type:"dummy",options:{fns:{app:()=>result,model:()=>result},fnsMeta:{
      app:{name:"app",inputSchema:{type:"object"},_meta:{ui:{resourceUri:"ui://fixture/app",visibility:["app"]}}},
      model:{name:"model",inputSchema:{type:"object"},_meta:{ui:{visibility:["model"]}}}
    }}})
    try {
      c.initialize()
      var host = require("fixtures/mcp-app-host.js").create(c, ["app","model"])
      check(host.receive({jsonrpc:"2.0",id:1,method:"ui/initialize",params:{protocolVersion:"2026-01-26",appInfo:{name:"fixture",version:"1"},appCapabilities:{}}}).result.protocolVersion,"2026-01-26","UI handshake")
      host.receive({jsonrpc:"2.0",method:"ui/notifications/initialized"})
      host.deliver({value:1}, result)
      check(host.messages[0].method,"ui/notifications/tool-input","Input delivered first")
      check(host.messages[1].params._meta.privateUI,"preserved","UI metadata delivered intact")
      check(host.receive({jsonrpc:"2.0",id:2,method:"tools/call",params:{name:"app",arguments:{}}}).result,result,"App-callable tool forwarded")
      check(host.receive({jsonrpc:"2.0",id:3,method:"tools/call",params:{name:"model",arguments:{}}}).error.code,-32602,"Model-only tool rejected for app")
      check(host.receive({jsonrpc:"2.0",id:4,method:"shell/run",params:{}}).error.code,-32601,"Unknown bridge requests rejected")
      host.close()
      check(host.messages[2].method,"ui/resource-teardown","UI teardown")
      check(host.receive({id:5,method:"tools/call",params:{name:"app",arguments:{}}}).error.code,-32600,"Closed view cannot call tools")
    } finally { c.destroy() }
  }

  exports.testHTTPTimeout = function() {
    ow.loadServer()
    var port = findRandomOpenPort(), hs = ow.server.httpd.start(port, "127.0.0.1")
    ow.server.httpd.route(hs, { "/mcp": req => {
      sleep(1200, true)
      var m = jsonParse(req.files.postData)
      return ow.server.httpd.reply({jsonrpc:"2.0",id:m.id,result:{}},200,"application/json")
    } })
    var c = $jsonrpc({url:"http://127.0.0.1:"+port+"/mcp",timeout:300})
    try {
      var start = now(), failed = false
      try { var response = c.exec("slow", {}); failed = isMap(response) && isDef(response.error) } catch(e) { failed = true }
      check(failed,true,"HTTP request timeout is effective")
      check(now()-start < 1000,true,"HTTP request does not wait for server completion")
    } finally { c.destroy(); ow.server.httpd.stop(hs) }
  }
})()
