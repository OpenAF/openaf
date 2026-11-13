// Optional integration runner, excluded from autoTestAll. Never installs dependencies.
// OPENAF_MCP_LIVE_CONFIG names a JSON array of {name, cmd/url, envs, ...$mcp options}.
var configPath = getEnv("OPENAF_MCP_LIVE_CONFIG")
if (!isString(configPath) || configPath.length == 0) { print("SKIP: set OPENAF_MCP_LIVE_CONFIG"); exit(0) }
ow.loadTest()
var report = []
var xml = '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="a" value="Start" vertex="1" parent="1"><mxGeometry x="20" y="20" width="100" height="50" as="geometry"/></mxCell></root></mxGraphModel>'
io.readFileJSON(configPath).forEach(config => {
  var kind = config.name, options = clone(config)
  delete options.name
  options.envs = merge(options.envs || {}, { DRAWIO_BROWSER: "none" })
  var client = $mcp(options), temp = io.createTempFile("openaf-mcp-diagram-", ".drawio")
  var record = { name: kind, calls: [] }
  var call = (name, args) => {
    if (!record.tools.some(t => t.name == name)) throw new Error("Expected tool absent: " + name)
    var result = client.callTool(name, args)
    if (!isMap(result) || isDef(result.error) || result.isError === true) throw new Error("Tool failed: " + name + " " + stringify(result))
    record.calls.push(name)
    return result
  }
  try {
    client.initialize()
    record.server = client.getInfo()
    record.tools = client.listTools().tools
    if (!isArray(record.tools)) throw new Error("Tool discovery failed")
    if (kind == "official") {
      call("get_drawio_reference", { format: "mermaid" })
      call("open_drawio_mermaid", { content: "graph TD; A-->B;" })
      call("open_drawio_xml", { content: xml })
      call("open_drawio_csv", { content: "# label: %name%\nname\nStart\nEnd" })
      io.writeFileString(temp, '<mxfile><diagram id="p" name="Page-1">' + xml + '</diagram></mxfile>')
      call("list_pages", { path: temp })
      call("get_page", { path: temp, page: "0" })
      call("set_page", { path: temp, page: "0", content: xml })
      call("search_shapes", { query: "rectangle" })
      var invalid = client.callTool("open_drawio_xml", {})
      ow.test.assert(isDef(invalid.error) || invalid.isError === true, true, "Invalid input must fail")
    } else if (kind == "community") {
      // create_diagram expects an absent path, not an empty temp file.
      io.rm(temp)
      call("create_diagram", { filePath: temp, pageName: "Flow" })
      call("add_node", { filePath: temp, label: "Start", id: "a", x: 20, y: 20 })
      call("add_node", { filePath: temp, label: "End", id: "b", x: 220, y: 20 })
      call("add_edge", { filePath: temp, sourceId: "a", targetId: "b" })
      call("update_element", { filePath: temp, elementId: "a", label: "Begin" })
      call("read_diagram", { filePath: temp })
      call("remove_element", { filePath: temp, elementId: "b" })
      call("undo_last_operation", {})
      call("redo_last_operation", {})
      call("add_page", { filePath: temp, pageName: "Second" })
    } else if (kind == "app") {
      var tool = record.tools.filter(t => isMap(t._meta) && isMap(t._meta.ui) && isString(t._meta.ui.resourceUri))[0]
      if (!tool) throw new Error("No MCP Apps tool metadata")
      var resource = client.getAppResource(tool.name)
      if (!isArray(resource.contents) || !resource.contents.some(c => c.mimeType == "text/html;profile=mcp-app" && isString(c.text))) throw new Error("Missing App HTML resource")
      record.resource = resource.contents.map(c => ({ uri: c.uri, mimeType: c.mimeType, _meta: c._meta, length: isString(c.text) ? c.text.length : 0 }))
      record.result = call(tool.name, { mermaid: "graph TD; A-->B;" })
    } else throw new Error("Unknown live suite: " + kind)
    record.ok = true
  } catch(e) { record.ok = false; record.error = String(e) }
  finally { client.destroy(); io.rm(temp) }
  report.push(record)
  print(kind + ": " + (record.ok ? "PASS" : record.error))
})
var output = getEnv("OPENAF_MCP_LIVE_REPORT")
if (isString(output) && output.length > 0) io.writeFileJSON(output, report)
exit(report.every(r => r.ok) ? 0 : 1)
