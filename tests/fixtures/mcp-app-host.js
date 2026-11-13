// Test-only MCP Apps host bridge. No browser, HTML evaluation, or advertised UI extension.
// A real host must add the SDK sandbox proxy, origin/source validation and user permissions.
exports.create = function(client, allowedTools) {
  var state = "new", inputSent = false, messages = []
  var error = (id, code, message) => ({jsonrpc:"2.0",id:id,error:{code:code,message:message}})
  return {
    messages: messages,
    receive: function(message) {
      if (state == "closed") return error(message.id, -32600, "View closed")
      if (message.method == "ui/initialize") {
        if (state != "new" || message.params.protocolVersion != "2026-01-26") return error(message.id, -32602, "Unsupported UI initialization")
        state = "initializing"
        return {jsonrpc:"2.0",id:message.id,result:{protocolVersion:"2026-01-26",hostInfo:{name:"OpenAF test fixture",version:"1"},hostCapabilities:{serverTools:{}},hostContext:{displayMode:"inline"}}}
      }
      if (message.method == "ui/notifications/initialized" && state == "initializing") { state = "ready"; return }
      if (state != "ready") return error(message.id, -32600, "View is not initialized")
      if (message.method != "tools/call") return error(message.id, -32601, "Unsupported bridge method")
      var params = message.params, listed = client.listTools()
      var tool = isArray(listed.tools) ? listed.tools.filter(t => t.name == params.name)[0] : __
      var ui = isDef(tool) && isMap(tool._meta) ? tool._meta.ui : __
      if (!tool || allowedTools.indexOf(params.name) < 0 ||
          (isMap(ui) && isArray(ui.visibility) && ui.visibility.indexOf("app") < 0)) return error(message.id, -32602, "App tool permission denied")
      return {jsonrpc:"2.0",id:message.id,result:client.callTool(params.name, params.arguments)}
    },
    deliver: function(args, result) {
      if (state != "ready" || inputSent) throw new Error("Invalid tool delivery lifecycle")
      inputSent = true
      messages.push({jsonrpc:"2.0",method:"ui/notifications/tool-input",params:{arguments:clone(args)}})
      messages.push({jsonrpc:"2.0",method:"ui/notifications/tool-result",params:clone(result)})
    },
    close: function() {
      messages.push({jsonrpc:"2.0",id:"teardown",method:"ui/resource-teardown",params:{}})
      state = "closed"
    }
  }
}
