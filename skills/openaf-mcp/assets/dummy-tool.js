ow.loadTest();
var client = $mcp({ type: "dummy", options: {
  fns: { echo: function(p) {
    if (p.message === "fail") return { content: [{ type: "text", text: "fixture failure" }], isError: true };
    return { content: [{ type: "text", text: p.message }], isError: false };
  } },
  fnsMeta: { echo: {
    description: "Echo local text",
    inputSchema: { type: "object", properties: { message: { type: "string" } }, required: ["message"] }
  } }
} });
try {
  client.initialize();
  var listed = client.listTools();
  if (!isArray(listed.tools)) throw "Tool discovery failed";
  var result = client.callTool("echo", { message: "hello" });
  ow.test.assert(result.content[0].text, "hello", "local echo");
  var failure = client.callTool("echo", { message: "fail" });
  ow.test.assert(failure.isError, true, "tool error remains observable");
  print("mcp: ok");
} finally { client.destroy(); }
