# HTTP Java Plugin Reference

The `HTTP` plugin provides an HTTP/HTTPS client supporting REST verbs, basic/digest authentication, custom request headers, SSL truststore overrides, streaming responses, and WebSocket client support.

---

## Loading Syntax

```javascript
plugin("HTTP");
var http = new HTTP();
// Or one-shot constructor:
var res = new HTTP(url, "GET", inData, reqHeaders, isBytes, timeout, returnStream);
```

---

## API Methods

| Method | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `login(user, pass, forceBasic, urlPartial)` | `String, String, [boolean], [String]` | `void` | Configures credentials (auto-decrypts OpenAF encrypted passwords). |
| `exec(url, method, in, reqHeaders, isBytes, timeout, returnStream)` | `String, String, Object, Map, boolean, int, boolean` | `Object \| InputStream` | Executes arbitrary HTTP request. Returns response map or stream. |
| `get(url, in, reqHeaders, isBytes, timeout, returnStream)` | `String, Object, Map, boolean, int, boolean` | `Object` | Performs HTTP GET request. |
| `getBytes(url, in, reqHeaders, timeout)` | `String, Object, Map, int` | `Object` | Performs HTTP GET and returns byte array. |
| `getStream(url, in, reqHeaders, timeout)` | `String, Object, Map, int` | `InputStream` | Performs HTTP GET and returns Java `InputStream`. |
| `post(url, in, reqHeaders, isBytes, timeout, returnStream)` | `String, Object, Map, boolean, int, boolean` | `Object` | Performs HTTP POST request. |
| `response()` | *none* | `String` | Returns body text from last request. |
| `responseBytes()` | *none* | `byte[]` | Returns byte array from last request. |
| `responseCode()` | *none* | `long` | Returns HTTP status code (e.g. 200, 404). |
| `responseHeaders()` | *none* | `Map<String, List<String>>` | Returns response headers map. |
| `responseType()` | *none* | `String` | Returns Content-Type header. |
| `getErrorResponse()` | *none* | `Object` | Returns error response payload on failure. |
| `wsConnect(url, onConnect, onMsg, onError, onClose, timeout, supportSelfSigned)` | `String, Function, Function, Function, Function, Object, boolean` | `WebSocketClient` | Initiates WebSocket connection with event callbacks. |
| `wsClient(url, onConnect, onMsg, onError, onClose, timeout, supportSelfSigned)` | `String, Function, Function, Function, Function, Object, boolean` | `WebSocketsReply` | Initiates WebSocket connection returning reply object with client. |

---

## Practical Code Example

```javascript
plugin("HTTP");
var http = new HTTP();

// Authenticated JSON POST
http.login("apiUser", "apiPass", true, "https://api.example.com");
var res = http.exec(
  "https://api.example.com/v1/items",
  "POST",
  stringify({ name: "Widget", qty: 10 }),
  { "Content-Type": "application/json" },
  false,
  5000,
  false
);
print("Status: " + res.responseCode + " | Body: " + res.response);

// WebSocket Client
var session;
var client = http.wsConnect(
  "wss://echo.websocket.org",
  s  => { session = s; session.getRemote().sendString("Hello OpenAF"); },
  (type, payload) => { print("WS Msg [" + type + "]: " + payload); },
  err => { logErr(err); },
  (code, reason)  => { print("WS Closed: " + reason); },
  5000,
  true
);
```
