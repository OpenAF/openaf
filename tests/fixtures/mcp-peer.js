// Dependency-free JSON-RPC peer for client transport tests. Run with OpenAF.
var reader = new java.io.BufferedReader(new java.io.InputStreamReader(java.lang.System.in, "UTF-8"))
var send = value => { java.lang.System.out.println(stringify(value, __, "")); java.lang.System.out.flush() }
var pending = {}, held, subscription
var line
while ((line = reader.readLine()) != null) {
  var message = jsonParse(String(line)), result = {}
  if (isUnDef(message.method)) {
    if (message.id == "ask") {
      send({ jsonrpc: "2.0", id: pending.ask, result: isDef(message.error) ? { error: message.error } : message.result })
    } else if (message.id == "sample") {
      send({ jsonrpc: "2.0", id: held, result: { content: [{ type: "text", text: message.result.content.text }] } })
    } else if (message.id == pending.unknown) {
      send({ jsonrpc: "2.0", id: pending.unknown, result: message.error })
    }
    continue
  }
  switch (message.method) {
  case "initialize":
    result = { protocolVersion: message.params.protocolVersion, clientCapabilities: message.params.capabilities, capabilities: { tools: {}, resources: { subscribe: true } }, serverInfo: { name: "fixture", version: "1" } }
    break
  case "tools/list":
    result = { tools: [{ name: "sample", inputSchema: { type: "object" } }] }
    break
  case "tools/call":
    held = message.id
    send({ jsonrpc: "2.0", id: "sample", method: "sampling/createMessage", params: { messages: [], maxTokens: 10 } })
    continue
  case "nested": result = { value: "nested-ok" }; break
  case "ask":
    pending.ask = message.id
    send({ jsonrpc: "2.0", id: "ask", method: message.params.method, params: message.params.params || {} })
    continue
  case "unknown":
    pending.unknown = message.id
    // An inbound request id may collide with an outbound id.
    send({ jsonrpc: "2.0", id: message.id, method: "not/implemented", params: {} })
    continue
  case "resources/subscribe":
    subscription = message.params.uri
    send({ jsonrpc: "2.0", method: "notifications/resources/updated", params: { uri: subscription } })
    break
  case "resources/unsubscribe": subscription = __; break
  case "cancelme": pending.cancel = message.id; continue
  case "notifications/cancelled":
    pending.cancelled = message.params
    if (pending.cancel === message.params.requestId) send({jsonrpc:"2.0",id:pending.cancel,result:{cancelled:true}})
    continue
  case "cancellation": result = pending.cancelled || {}; break
  case "pid": result = { pid: Number(java.lang.ProcessHandle.current().pid()) }; break
  case "timeout": continue
  case "malformed": java.lang.System.out.println("invalid json"); result = { survived: true }; break
  case "resources/read": result = { contents: [{ uri: message.params.uri, mimeType: "application/octet-stream", blob: "AAEC" }] }; break
  }
  if (isDef(message.id)) send({ jsonrpc: "2.0", id: message.id, result: result })
}
