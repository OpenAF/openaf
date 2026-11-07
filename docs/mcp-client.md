# MCP client capabilities and MCP Apps

`$mcp()` is a synchronous, generic MCP client. It does not implement diagram
editing, run an LLM, or execute server-provided HTML. This guide accompanies
[the basic client guide](openaf-advanced.md#20-mcp-client-mcp) and
[OAuth configuration](mcp-oauth.md).

## Public APIs

Call `initialize()` before discovery, resources or tools; always call `destroy()`
in `finally`. Initialization returns the client. `getInfo()` returns the server's
initialization/discovery information; `getCapabilities()` returns a copy of its
capabilities. `getClientInfo()` includes transport diagnostics, negotiated era,
HTTP session information and recent notifications. Diagnostics may contain tool
arguments or resource data; do not publish them indiscriminately.

| API | Behavior |
| --- | --- |
| `listTools()`, `listPrompts()` | Collect up to 1000 pages, retaining the first page's metadata and conservative combined cache bounds. A remaining `nextCursor` means enumeration is incomplete. |
| `callTool(name, arguments, httpOptions)` | Preserves the server result envelope, including unknown fields. Existing HTTP per-call options, blacklist, `preFn` and `posFn` remain supported. |
| `getPrompt(name, arguments)` | Returns the prompt result unchanged. |
| `listResources()` | Collects resource pages, including names, descriptions, MIME types and metadata. |
| `listResourceTemplates()` | Collects `resourceTemplates` pages; URI template expansion is the caller's responsibility. |
| `readResource(uri)` | Sends an absolute URI unchanged. Returns all `contents`, including `text`, base64 `blob`, MIME types and metadata. Does not read local files or dereference HTTP URLs itself. |
| `subscribeResource(uri, callback)` | Requires `resources.subscribe`, a dedicated legacy connection, and a working event transport. Callback receives `(params, message)` for resource updates. HTTP starts a GET listener first. |
| `unsubscribeResource(uri)` | Sends unsubscribe and removes the callback after success. |
| `onRequest(method, handler)`, `offRequest(method)` | Register/remove a handler receiving `(params, request)`. Return a synchronous result; throw `{code, message, data}` for a JSON-RPC error. No promises. |
| `onNotification(method, handler)`, `offNotification(method)` | Register/remove one callback per method, receiving `(params, message)`. Re-registration replaces that method's callback. Option `onNotification(message)` remains supported alongside registrations. |
| `onSamplingRequest(handler)` | Registers `sampling/createMessage` and opts into basic sampling. No implicit LLM invocation; sampling tools/toolChoice are explicitly rejected. |
| `onElicitationRequest(handler, modes)` | Registers `elicitation/create`. Default modes: `{form:{}}`; opt into `{form:{},url:{}}` only with an appropriate user interface. URL mode requires negotiated version 2025-11-25 or later. |
| `setRoots(roots)` | Explicit array of `{uri:"file:///...", name:"..."}`. Registers `roots/list`; no filesystem scanning or environment-derived defaults. An empty array shares no roots. Legacy clients notify the server of later changes. |
| `continueRequest(method, originalParams, inputRequired)` | Explicit modern MRTR continuation. Runs registered handlers, copies opaque `requestState`, and sends keyed `inputResponses` on a new request. One round only; returns any further `input_required` unchanged. |
| `startListening()`, `stopListening()` | Opt into/close one legacy HTTP GET event stream. A 405 or non-SSE endpoint fails explicitly. No automatic reconnect or event replay. |
| `cancelRequest(id, reason)` | Sends `notifications/cancelled`; does not guarantee remote cancellation or roll back tool effects. |
| `exec(method, params, execOptions)` | Low-level RPC. Optional `execOptions.onRequestId(id)` exposes the outgoing id for cancellation. Keep tool permission checks in the caller when using raw methods. |
| `getToolUI(name)` | Returns a copy of `_meta.ui` or undefined when absent. |
| `getAppResource(name)` | Resolves a tool's `_meta.ui.resourceUri` through `resources/read`; requires a `ui://` URI. Returns the full resource envelope. |
| `hasApps()` | Discovers whether any visible tool has UI resource metadata. This is discovery, not a claim that a browser host exists. |

Resource methods require the advertised `resources` capability. Server errors and
`input_required` results remain observable rather than becoming empty lists.
Discovery is not cached by this client: a new list call refreshes it. Applications
that cache results should invalidate their own cache on the appropriate event.

## Transports, protocol versions and lifecycle

The default stays **2025-06-18**. `protocolVersion:"auto"` probes `server/discover`
for the stateless **2026-07-28** era, then falls back to legacy initialization.
An explicit `protocolVersion:"2026-07-28"` probes that era and fails if unsupported.
Legacy negotiation recognizes 2024-11-05, 2025-03-26, 2025-06-18 and 2025-11-25;
unrecognized negotiated versions fail explicitly. Modern calls carry per-request
version, client capabilities and identity. HTTP sends the negotiated protocol
header, plus `Mcp-Method`/`Mcp-Name` for modern calls. Modern `input_required`
results remain visible through `isInputRequired(result)` until the caller explicitly
continues them. Do not indiscriminately retry a tool with side effects.

Stdio maintains independent request IDs and a reader/writer pair. Inbound callbacks
run on two fixed workers with a 128-message waiting queue, separate from the stdout
reader; they can make nested synchronous requests. Keep callbacks short and impose
application deadlines. Arbitrarily deep mutually nested callbacks can exhaust the
two workers and time out. Excess inbound requests receive an explicit queue-full
error; notifications may be dropped when saturated. Callback exceptions become
JSON-RPC errors; notification exceptions are isolated. Malformed stdout lines are
ignored; debug mode reports them. Stderr is drained independently.

HTTP POST accepts JSON or SSE. Inbound requests on a POST's SSE response receive a
separate authenticated POST response. Callbacks execute on the stream's reader;
nested requests use independent HTTP connections. `startListening()` provides an
optional separate GET stream for unrelated legacy notifications. The listener
uses the configured timeout and stops on EOF/error; inspect `listenerActive` and
`listenerError` in `getClientInfo()`, then explicitly restart if appropriate.
Subscriptions must be re-established by the application after reconnecting.
`type:"sse"` is an alias for Streamable HTTP with SSE responses; it does **not**
implement the obsolete 2024 separate SSE endpoint/message-URL transport.

A timed-out stdio request sends best-effort cancellation and throws an explicit
error. Late replies are discarded. HTTP uses finite read/write/call timeouts;
applications can send cancellation on another thread when they retain the request
id. Inbound cancellation/progress/logging events are exposed as notifications;
callback handlers must implement their own cancellation policy. No tool runs are
replayed automatically. Session-expiry recovery retries only discovery and resource
reads, once; mutating tool errors remain visible. `destroy()` closes HTTP listeners,
terminates legacy HTTP sessions with authenticated DELETE, releases waiters and
clears callbacks/subscriptions. Existing shared connections retain reference counting;
use `shared:false` (the default) for callback registration and subscriptions.

Register optional capabilities **before** `initialize()` on legacy connections.
`sampling`, `elicitation` and `roots` supplied directly in `capabilities` are removed
unless configured through the implemented convenience APIs. Elicitation capabilities
are filtered for the offered protocol version, and the removed roots list-change
capability is omitted from modern requests. Deregistering their
request handler removes the capability from future requests; a legacy connection
must be reinitialized to advertise the change. Other extensions can be supplied in
`capabilities.extensions` only when the application implements them.

Modern `subscriptions/listen`, task execution, SSE resumption/redelivery and a
browser host are not implemented. Modern subscriptions explicitly fail rather
than falling back to removed legacy methods. That protocol needs ownership of a
long-lived POST stream, subscription acknowledgement/IDs and termination distinct
from an ordinary request's final response. The current synchronous request path
and separate legacy GET listener do not implement that lifecycle; raw RPC access
must not be treated as subscription support. Extension parameters and results can
be accessed using `exec()`, but low-level access is not proof of implementation.

## Events and results

```javascript
client.onNotification("notifications/tools/list_changed", function(params) {
  // Invalidate your own catalog cache; retrieve a fresh list when needed.
})
client.onNotification("notifications/progress", function(params) {
  print(params.progress + "/" + params.total)
})
client.onNotification("notifications/message", function(params) {
  // Route server logs according to your application's privacy policy.
})
```

The same registration works for prompt/resource list changes, resource updates,
`notifications/cancelled`, and extension notifications. Progress tokens can be
supplied through `exec("tools/call", {name, arguments, _meta:{progressToken:...}})`.
Modern logging requires the per-request `_meta["io.modelcontextprotocol/logLevel"]`.

`callTool()` keeps text, images, audio, resource links, embedded resources,
`structuredContent` (including non-object JSON values), `isError` and `_meta`.
No MIME type or binary payload is stripped. `toGptTools()` retains the complete
input schema and excludes tools whose `_meta.ui.visibility` omits `"model"`.
Plain text-only results keep the historical text return. Structured, multimedia,
error, metadata-bearing and continuation results become a JSON serialization of
the full envelope, suitable for the existing string-based GPT tool interface.
This preserves data but does not convert media into a provider's native image/audio
message format; applications can use `callTool()` directly for that conversion.

## Optional MCP Apps web host contract

Core retrieval never evaluates HTML/JavaScript. A web application such as mini-a
can use `listTools()`, `getToolUI()`, `getAppResource()`, `callTool()` and the event
APIs as its server-side MCP connection. Only a real host should advertise
`capabilities.extensions["io.modelcontextprotocol/ui"]` with
`{mimeTypes:["text/html;profile=mcp-app"]}`.

Use the official [MCP Apps SDK and specification](https://github.com/modelcontextprotocol/ext-apps)
for the browser side. It defines the JSON-RPC `postMessage` bridge; do not forward
arbitrary browser messages to `exec()`:

1. Validate the tool and its `ui://` resource URI. Fetch HTML through that same
   authenticated MCP connection and retain `_meta.ui.csp`, `permissions`, and
   `domain`. Validate the MIME type `text/html;profile=mcp-app` before rendering.
2. Host the resource in a sandbox isolated from the parent runtime, preferably a
   separate origin using the SDK sandbox proxy. Restrict script, resource and
   connection origins using the resource CSP and the host's own policy. Grant no
   filesystem, cookies, OAuth credentials or environment access to the iframe.
3. Validate each `postMessage` source, origin, shape and lifecycle state. With the
   proxy, await `ui/notifications/sandbox-proxy-ready`, then deliver
   `ui/notifications/sandbox-resource-ready`. The view initiates `ui/initialize`;
   respond with the SDK's negotiated version/capabilities/context, then await
   `ui/notifications/initialized` before sending view notifications.
4. Deliver `ui/notifications/tool-input` before
   `ui/notifications/tool-result`. Send complete result envelopes, including
   structured content and private UI metadata where intended for that view.
5. Forward app `tools/call` only after permission checks, blacklist enforcement,
   and discovery that `_meta.ui.visibility` includes `"app"` (default visibility
   is `["model","app"]`). Never expose an app-only tool to the model. Respect
   separate permissions for `ui/message`, context updates, external links and
   other host actions; reject unimplemented bridge methods with JSON-RPC errors.
6. On view teardown, follow `ui/resource-teardown`, remove message listeners,
   discard pending requests, and release owned MCP sessions. Keep each user's
   authenticated MCP connection isolated.

`hasApps()` reports discoverability, not trust. Resource metadata and tool
annotations are untrusted input. No iframe or browser bridge is enabled by
`$mcp()` itself. The SDK's example hosts provide a runnable rendering reference;
`tests/mcp-drawio-live.js` demonstrates the core discovery/resource/tool flow.
The test-only `tests/fixtures/mcp-app-host.js` demonstrates the specified UI
handshake, input/result delivery, app tool visibility checks and teardown. It
is exercised by `testAppsHostContract`; it is not a sandbox or production host.

## draw.io examples

These schemas were checked against actual servers on 2026-11-07. Discover them
again when upgrading: the official tool server and hosted App use different inputs.

### A and E: official Tool Server, headless Mermaid

Install `@drawio/mcp` separately; Node/npm are optional server dependencies, not
OpenAF dependencies. Set `DRAWIO_BROWSER:none` on the server, not the client UI.

```javascript
var client = $mcp({cmd:["npx", "-y", "@drawio/mcp@1.11.0"],
  envs:{DRAWIO_BROWSER:"none"}})
try {
  client.initialize()
  var tools = client.listTools()
  if (!isArray(tools.tools)) throw "Discovery failed"
  client.callTool("get_drawio_reference", {format:"mermaid"})
  var result = client.callTool("open_drawio_mermaid", {content:"graph TD; A-->B;"})
  if (result.isError || result.error) throw stringify(result)
  print(stringify(result)) // A diagram link; no browser launched.
} finally { client.destroy() }
```

### B: community file editing without a companion editor

Build the [community server](https://github.com/abossard/drawio-mcp) separately.
Use an application-owned output path; `create_diagram` must not overwrite a user's
existing file. Server file permissions remain those of its subprocess.

```javascript
var client = $mcp({cmd:["node", "/path/to/drawio-mcp/build/index.js"]})
var file = io.createTempFile("diagram-", ".drawio")
io.rm(file) // create_diagram expects a new path.
try {
  client.initialize()
  var listed = client.listTools()
  if (!isArray(listed.tools)) throw "Discovery failed"
  client.callTool("create_diagram", {filePath:file, pageName:"Flow"})
  client.callTool("add_node", {filePath:file, id:"a", label:"Start", x:20, y:20})
  client.callTool("add_node", {filePath:file, id:"b", label:"End", x:220, y:20})
  client.callTool("add_edge", {filePath:file, sourceId:"a", targetId:"b"})
  print(stringify(client.callTool("read_diagram", {filePath:file})))
} finally { client.destroy() }
```

Check every mutation's `isError`/`error` in production. The optional live runner
checks these responses, plus update/remove/page/undo/redo operations.

### C: hosted MCP App discovery and retrieval

```javascript
var client = $mcp({url:"https://mcp.draw.io/mcp"})
try {
  client.initialize()
  var tools = client.listTools()
  if (!isArray(tools.tools)) throw "Discovery failed"
  tools.tools.filter(t => isMap(t._meta) && isMap(t._meta.ui)).forEach(function(tool) {
    var resource = client.getAppResource(tool.name)
    print(resource.contents.map(c => c.mimeType).join(", "))
    // Give resource to a separately implemented sandboxed Apps host.
  })
  // The App uses `mermaid`, unlike the Tool Server's `content` parameter.
  var result = client.callTool("create_diagram", {mermaid:"graph TD; A-->B;"})
  print(stringify(result))
} finally { client.destroy() }
```

### D: safe opt-in server requests

```javascript
var client = $mcp({cmd:["my-mcp-server"]})
client.setRoots([]) // Share no filesystem roots.
client.onElicitationRequest(function(params) { return {action:"decline"} })
client.onSamplingRequest(function(params) {
  throw {code:-32601, message:"No approved sampling provider configured"}
})
try {
  client.initialize()
  // Synchronous calls can now service inbound legacy requests.
  // For modern results: inspect isInputRequired(result), then explicitly call
  // continueRequest(method, originalParams, result) after application approval.
} finally { client.destroy() }
```

## Verification matrix

| Capability | Before | Current implementation and evidence |
| --- | --- | --- |
| Stdio / concurrent outbound calls | Implemented | Retained; local concurrent regression and real draw.io processes |
| HTTP JSON / POST SSE | Implemented | Retained; local SSE request/reply fixture and hosted endpoint |
| Separate legacy HTTP+SSE message endpoint | Missing | Still unsupported; `sse` means Streamable HTTP |
| Initialization, auto, auth, pagination | Implemented | Retained; existing MCP/OAuth regressions |
| Resources/templates | Raw `exec()` only | First-class APIs, pagination and metadata; deterministic fixtures |
| Resource subscriptions | Missing callbacks | Legacy stdio and HTTP GET; modern `subscriptions/listen` remains unsupported |
| Notifications and inbound requests | Partial notifications only | Method registrations, bounded stdio dispatch, HTTP POST replies and opt-in GET |
| Sampling / elicitation / roots | Raw negotiation only | Opt-in handlers, explicit roots, modern MRTR continuation |
| Structured/multimedia results | `callTool` preserved; GPT flattened | Full envelope preserved; GPT text fallback retains rich data |
| Apps metadata / UI resources | Metadata through raw lists | Discovery helpers and resource retrieval; no browser execution |
| Cancellation / timeout | Partial transport timeout | Explicit cancellation API; stdio timeout cancellation and late-response cleanup |
| Reconnect | Legacy session retry | Read-only retry only; listeners/subscriptions require application recovery |
| Browser host / tasks / modern subscriptions | Missing | Documented host contract; explicitly outside implemented support |

Live results on 2026-11-07:

| Server | Verified | Environment-dependent scope |
| --- | --- | --- |
| Official Tool Server `@drawio/mcp` 1.11.0 | Stdio initialize/discovery; all eight exposed tools; XML/Mermaid/CSV, reference, shape search, list/get/set page; invalid input | Browser disabled with `DRAWIO_BROWSER=none`; no rendering claims |
| Community `abossard/drawio-mcp` main, server 1.0.0 | Stdio discovery of 21 tools; create/read/add nodes/add edge/update/remove/add page/undo/redo | File fallback verified; VS Code bridge, screenshot, cursor/selection and live editor remain unverified |
| Hosted `https://mcp.draw.io/mcp`, server 1.6.0 | HTTP initialize/discovery; `create_diagram`, `search_shapes`, `get_drawio_reference` discovered; create called; App HTML resource (636399 characters) with MIME/security metadata retrieved | No iframe rendering or UI interaction verification |

All three negotiated 2025-06-18 when offered the unchanged client default.
Server versions, tools and resource sizes are snapshots, not permanent guarantees.

Run deterministic tests from `tests/` using
`java -jar ../openaf.jar --ojob -e autoTestAll.MCP.yaml` (includes advanced and
OAuth jobs). The advanced stdio peer uses the current OpenAF JAR itself: no Node,
npm, Python or network download is needed. HTTP fixtures bind loopback.

Optional live tests are excluded from normal CI. Create a JSON config containing
`[{"name":"official","cmd":["node","/installed/@drawio/mcp/src/index.js"]},
{"name":"community","cmd":["node","/built/drawio-mcp/build/index.js"]},
{"name":"app","url":"https://mcp.draw.io/mcp"}]`. Set
`OPENAF_MCP_LIVE_CONFIG=/path/config.json` and optionally
`OPENAF_MCP_LIVE_REPORT=/path/report.json`, then run
`java -jar openaf.jar -f tests/mcp-drawio-live.js`. File edits use temporary paths;
the runner never installs dependencies or opens browsers.

## Implementation validation (2026-11-07)

The rebuilt and synchronously repacked JAR passed all **48 MCP/OAuth test
exports**, including the 12 advanced-client groups. Additional checks exercised
numeric inbound/outbound ID collisions, null handler errors and unsupported
negotiated versions. Generated ODoc contains all 20 new MCP API entries; the
Markdown examples compile in OpenAF, and the skill frontmatter/test YAML parse.
The standard bootstrap `build.yaml` stopped in its existing POM comparison job;
the core `buildos.js` compilation and packaging succeeded without build-source edits.

The final full suite passed **511/512 tests** (0 skipped). Its one failure is
`AI::OpenAI jsonSchemaPrompt unsupported provider`: the unchanged AI provider test
expects `JSON Schema responses not supported by this provider`, but receives
`Error: LLM_DECISION_INVALID_REQUEST`. No AI implementation or test was changed.
All MCP jobs passed. The optional live runner passed for all three draw.io servers
against the same final JAR; browser rendering and companion-editor interaction
remain outside the verified scope.

## Source references

Reviewed the [current MCP specification](https://modelcontextprotocol.io/specification/2026-07-28),
[legacy Streamable HTTP transport](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports),
[modern schema/MRTR structures](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/schema/2026-07-28/schema.ts),
[MCP Apps specification](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx),
[official draw.io source](https://github.com/jgraph/drawio-mcp), and
[community source](https://github.com/abossard/drawio-mcp).
