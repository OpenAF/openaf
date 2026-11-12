# HTTPServer Java Plugin Reference

The `HTTPServer` plugin provides an embedded web server supporting NanoHTTPD (`nwu2` default engine) and JDK `com.sun.net.httpserver.HttpServer`, with REST endpoints, file browsing, WebSockets, SSL HTTPS, and session handling.

---

## Java-mode request limits

Custom/default routes and echo routes in `impl: "java"` accept request bodies up to 8 MiB by default. Both declared `Content-Length` and actual streamed bytes are checked. Excess bodies receive HTTP 413 before the callback runs, including chunked uploads; the rejected connection is closed. Empty bodies and accepted `data`/`bytes` representations are unchanged. Set a positive per-server byte limit with `server.setMaxRequestBodySize(bytes)`, or configure the creation default with Java system property `openaf.http.java.maxBodyBytes`.

Java listeners use at most 8 workers and queue at most 64 requests by default. Positive creation-time system properties `openaf.http.java.maxWorkers` and `openaf.http.java.maxQueuedRequests` override these bounds. Submissions beyond those bounds are rejected; an overloaded client may see a closed connection rather than an HTTP response. `stop()` shuts down the owned workers. These limits bound body buffering and dispatched work; they are not a global connection quota or a timeout for slow uploads. Larger trusted limits permit greater resource consumption. NanoHTTPD engines have separate request handling.

## NanoHTTPD request limits

Both `nwu` and `nwu2` reject bodies larger than 8 MiB before route dispatch or temporary-file creation. Positive Java system properties configure admission: `openaf.http.nano.maxBodyBytes` (8 MiB), `openaf.http.nano.maxBufferedBytes` (128 MiB shared across both stacks), and `openaf.http.nano.maxMultipartParts` (1,024). Values must fit a positive signed 32-bit integer. The aggregate budget reserves twice each admitted body for its raw spool and extracted PUT/multipart copies, and remains reserved until response processing and temporary-file cleanup finish. Spools use bounded heap buffers instead of persistent memory mappings. If cleanup fails, the failed storage remains charged until process restart; repair the filesystem before restarting. Excess individual bodies/parts receive 413; exhausted shared budget receives 503. Later requests can proceed when reservations are released.

Malformed, negative, overflowing or conflicting Content-Length headers receive 400. Identical repeated lengths remain accepted. Transfer-Encoding is unsupported and rejected with 400, including ambiguous TE/CL combinations. Truncated bodies fail instead of reaching callbacks as partial input. Parsing a body twice returns cached file entries rather than consuming the next request. Temporary files no longer retain unused output handles. These controls bound admitted HTTP bodies, not global connections, custom raw-stream consumers, or application-retained data; the WebSocket connection stream is unchanged. Trusted larger settings increase resource bounds.

## Loading Syntax

```javascript
plugin("HTTPServer");
// Registers constructor `HTTPd`
var server = new HTTPd(port, host, keyStorePath, keyStorePassword, logFunction, webSockets, timeout, impl);
```

### Constructor Options
- `port` *(int)*: Listening port (use `<= 0` for auto free port).
- `host` *(String)*: Interface bind address (or `undefined` for `0.0.0.0`).
- `keyStorePath`, `password`: Keystore path and password for HTTPS/SSL.
- `logFunc` *(Function(type, msg, exc))*: Log callback hook.
- `impl` *(String)*: Server engine (`"nwu2"` default, `"java"`, or `"nwu"`).

---

## API Methods

| Method | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `getPort()` | *none* | `int` | Returns listening port number. |
| `getImpl()` | *none* | `String` | Returns server implementation name. |
| `isAlive()` | *none* | `boolean` | Checks if server is active. |
| `stop()` | *none* | `void` | Stops server. |
| `add(uri, callback)` | `String, Function` | `void` | Registers request handler callback `function(req) { return reply; }`. |
| `setDefault(uri)` | `String` | `void` | Configures default fallback/redirect route. |
| `addEcho(uri)` | `String` | `void` | Registers request echo debugging endpoint. |
| `addStatus(uri)` | `String` | `void` | Registers health status endpoint. |
| `addFileBrowse(uri, filepath)` | `String, String` | `void` | Serves static file directory contents. |
| `addWS(uri)` | `String` | `void` | Registers WebSocket handler on URI. |
| `replyOKJSON(data, headers)` | `String, [Object]` | `Object` | Helper returning 200 OK JSON response structure. |
| `replyOKText(data, headers)` | `String, [Object]` | `Object` | Helper returning 200 OK plain text response. |
| `replyOKHTML(data, headers)` | `String, [Object]` | `Object` | Helper returning 200 OK HTML response. |
| `replyOKXML(data, headers)` | `String, [Object]` | `Object` | Helper returning 200 OK XML response. |
| `replyOKBin(data, headers)` | `String, [Object]` | `Object` | Helper returning 200 OK binary response. |
| `reply(data, mime, code, headers)` | `String, String, int, Object` | `Object` | Builds generic string response map. |
| `replyBytes(bytes, mime, code, headers)` | `byte[], String, int, Object` | `Object` | Builds generic binary response map. |
| `replyStream(stream, mime, code, headers)` | `InputStream, String, int, Object` | `Object` | Builds generic streaming response map. |

---

## Practical Code Example

```javascript
plugin("HTTPServer");

var hs = new HTTPd(8080);

hs.add("/api/greet", function(req) {
  var name = (req.params && req.params.name) ? req.params.name : "World";
  return hs.replyOKJSON(stringify({ message: "Hello " + name }));
});

hs.addFileBrowse("/static", "/var/www/html");
hs.addEcho("/debug/echo");
hs.setDefault("/api/greet");

print("Server listening on port: " + hs.getPort());
// To stop: hs.stop();
```

---

## WebSockets

The `nwu` and `nwu2` NanoWSD receivers limit inbound frames and assembled messages to 1 MiB by default, and fragmented messages to 256 frames (including empty fragments). Oversized data is rejected with `MessageTooBig` before its payload is allocated. Java handlers can explicitly change the byte limit with `WebSocket.setMaxMessageSize(positiveBytes)`; the fragment-count limit remains in effect. The default `WebSocketFrame.read(stream)` uses the same byte limit; `read(stream, maxPayloadSize)` allows an explicit parser limit. Ping, Pong and Close retain their protocol limits. These are per-message bounds, not a quota across connections.

WebSocket support is backed by the `HTTPws` plugin (`src/openaf/plugins/HTTPws/WebSockets.java`) and is enabled by passing `webSockets: true` to the `HTTPd` constructor (or calling `addWS(uri)`).

```javascript
plugin("HTTPServer");

var hs = new HTTPd(8080, undefined, undefined, undefined, undefined, true);

hs.addWS("/ws/chat");
hs.subscribe("/ws/chat", function(op, msg, session) {
  // op: "open" | "message" | "close"
  // msg: received text/binary payload
  // session: WebSocket session handle
  if (op === "message") {
    hs.broadcast("/ws/chat", "echo: " + msg);
  }
});

print("WebSocket endpoint ready at ws://localhost:8080/ws/chat");
```

The underlying `WebSockets` class implements the NanoHTTPD WebSocket protocol with text and binary frame support, ping/pong keepalive, and per-session lifecycle callbacks.

## Localhost OAuth2 client

After `ow.loadServer()`, `ow.server.httpd.oauth2(options)` can receive an OAuth2
authorization-code callback on an exclusively owned localhost HTTPd listener,
exchange the code using S256 PKCE, and persist access/refresh tokens with `$sec`.
It provides `authenticate()`, `getAuthStatus()`, `clearAuth()` and `cancel()`.
`$mcp` reuses it when `auth.callback: true`. See [OAuth2 authentication](../mcp-oauth.md)
for configuration, storage and examples.

## Query state on persistent connections

The `nwu` and `nwu2` implementations reset raw query state for each request. For GET requests, `params["NanoHttpd.QUERY_STRING"]` is absent when the URL has no query, and is an empty string for an explicit trailing `?`. A later request on the same connection does not inherit the previous URL query or form parameters.
