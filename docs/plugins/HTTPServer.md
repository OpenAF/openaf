# HTTPServer Java Plugin Reference

The `HTTPServer` plugin provides an embedded web server supporting NanoHTTPD (`nwu2` default engine) and JDK `com.sun.net.httpserver.HttpServer`, with REST endpoints, file browsing, WebSockets, SSL HTTPS, and session handling.

---

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
