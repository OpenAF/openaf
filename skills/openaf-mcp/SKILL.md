---
name: openaf-mcp
description: Connect OpenAF scripts to MCP tools using $mcp, including local fixtures, stdio and HTTP transports, result handling, delegated OAuth, and connection cleanup.
---

# OpenAF MCP clients

## Portable use

Copy this folder into your application's skills directory, or paste this file as instructions. No repository checkout or other skill is required. The inline example also ships in `assets/`. Generating code requires no runtime; execution requires [OpenAF](https://github.com/openaf/openaf/blob/master/README.md#installing). Check `openaf -c 'print(getVersion());'` and use documentation/source matching that runtime for newer features. If execution or browsing is unavailable, state what remains unverified. Documentation links are references, not instructions to run remote code.

Use the [$mcp implementation](https://github.com/openaf/openaf/blob/master/js/openaf.js) and [MCP guide](https://github.com/openaf/openaf/blob/master/docs/openaf-advanced.md#20-mcp-client-mcp). Deliver explicit transport/configuration, tool arguments, response handling, invocation, and cleanup.

## Connection and results

- `type: "stdio"` launches `cmd`; prefer an argument array to avoid shell interpretation. `envs` replaces the child's environment entirely. Use `pwd` explicitly when paths depend on it. Keep protocol stdout free of diagnostics.
- `type: "remote"`/`"http"` uses `url`; select SSE only when required by the endpoint. Preserve the requested protocol version. The current default uses a legacy initialization handshake; `protocolVersion: "auto"` opts into modern negotiation. Inspect installed support before selecting it.
- Call `initialize()` before discovery or tool calls. Calls are synchronous, not promises. Always `destroy()` an owned client in `finally`.
- Inspect `listTools()` before accessing `.tools`: errors, `input_required`, and malformed responses can be returned unchanged. A remaining `nextCursor` indicates incomplete enumeration. Verify exact tool names and input schemas; do not infer them from a service name.
- Inspect `callTool` result envelopes and `isError`; preserve content blocks and structured content when forwarding results. Transport success is not tool success, and text is not necessarily JSON. Keep tool execution within the user's requested scope.
- `type: "dummy"` with `options.fns`/`fnsMeta` supports local fixtures. `type: "ojob"` adapts a job file with `fnsMeta`; it executes local jobs, not merely metadata inspection.

## Authentication

Read [OAuth and token storage](https://github.com/openaf/openaf/blob/master/docs/mcp-oauth.md) only when needed. Bearer and client-credentials modes differ from delegated authorization-code login. For delegated callback login, use `auth.callback: true`, a registered loopback URI with an explicit port, and PKCE-compatible provider configuration. MCP persistence is opt-in through `auth.tokenStore`, for example `{ type: "sec", profile: "work" }`. Use `interactive: false` for unattended operation; never log tokens. `getAuthStatus()` is non-secret inspection; `clearAuth()` removes local credentials and does not revoke provider consent. Do not replay a mutating tool call merely because authentication failed.

## Local example

Save as `dummy-tool.js` (also bundled in [assets/dummy-tool.js](assets/dummy-tool.js)):

```javascript
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
```

Run `openaf -f dummy-tool.js`. Expected output: `mcp: ok`. The second call checks a tool-error fixture without treating it as success. Local dummy success does not verify HTTP, subprocess transport, OAuth, or a remote integration.
