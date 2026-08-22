# Python OAF Server

## Messages between client and server

The client should connect to the provided socket TCP port and interact using JSON. 

### Evaluate code

| Element | Mandatory | Description |
|---------|-----------|-------------|
| e       | Yes | Expression to evaluate |
| t       | Yes | Token to authorize access |

The result will be the literal result value of the expression evaluation. If there is an exception during the expression evaluation it will be returned as "__OAF__Exception: <exception text>".

**Example 1:**

Client:

```json
{ e: "2 + 2", t: "123abc" }
```

Server:

```json
4
```

**Example 2:**

Client:

```json
{ e: "({ x: 123, y: 'abc' })", t: "123abc" }
```

Server:

```json
{"x":123,"y":"abc"}
```

## Protocol Overview

- Encoding: UTF-8 JSON, one message per line (newline-delimited JSON) or framed by the transport (if applicable). All examples assume newline-delimited JSON.
- Authentication: The `t` field carries a shared token configured on the server at startup. Requests without a valid token must be rejected.
- Idempotency/Correlation (optional): Clients may include an `id` field. Servers should echo `id` on responses for easier correlation.
- Responses: On success, return the literal result of the operation. On error, return an error as documented below.

Example with `id`:
```json
{"id": "req-123", "e": "40 + 2", "t": "123abc"}
```

## Error Schema

On evaluation errors, the server returns an error indication. Implementations may return either:
- A string starting with `"__OAF__Exception: "` followed by the message; or
- A structured object (recommended):
```json
{
  "error": true,
  "type": "EvaluationError",
  "message": "<human-readable message>",
  "details": { "line": 1, "column": 5 }
}
```

Clients should handle the string prefix form for backward compatibility.

## Additional Message Types (optional)

These are suggested extensions. Support depends on the server implementation.

### Ping / Health
Request:
```json
{"ping": true, "t": "123abc"}
```
Response:
```json
{"pong": true, "time": 1700000000000}
```

### Status
Request:
```json
{"status": true, "t": "123abc"}
```
Response (example):
```json
{
  "uptimeMs": 123456,
  "version": "1.0",
  "busy": false
}
```

### Export Variables
Request specific variable names to be exported:
```json
{"varsGet": ["x", "y"], "t": "123abc"}
```
Response:
```json
{"vars": {"x": 123, "y": "abc"}}
```

### Import Variables
Request:
```json
{"varsSet": {"a": 1, "b": 2}, "t": "123abc"}
```
Response:
```json
{"ok": true}
```

### Quick Reference: Optional Message Types

| Message     | Request (minimal)                                 | Response (example)                                  | Purpose                     |
|-------------|----------------------------------------------------|-----------------------------------------------------|-----------------------------|
| ping/health | `{ "ping": true, "t": "<token>" }`               | `{ "pong": true, "time": 1700000000000 }`          | Liveness/latency check      |
| status      | `{ "status": true, "t": "<token>" }`             | `{ "uptimeMs": 123456, "version": "1.0" }`        | Basic server status         |
| varsGet     | `{ "varsGet": ["x","y"], "t": "<token>" }`     | `{ "vars": { "x": 1, "y": "abc" } }`            | Export selected variables   |
| varsSet     | `{ "varsSet": {"a":1}, "t": "<token>" }`       | `{ "ok": true }`                                   | Import/set variables        |

## Security Considerations

- Always validate the `t` token server-side before executing any request.
- Consider binding the server to localhost or using TLS termination in front of it if exposed beyond local development.
- Enforce execution limits (time, memory) and restrict filesystem/network access for evaluated code as appropriate.
- Log failed auth attempts and malformed payloads.

## Minimal Client and Server Control (OpenAF)

Start/stop the server from OpenAF:
```javascript
ow.loadPython();
ow.python.startServer();
// ... interact via TCP JSON as per protocol ...
ow.python.stopServer();
```

Simple TCP client pseudocode (Node.js-style):
```js
const net = require('net');
const socket = net.createConnection({ host: '127.0.0.1', port: 2000 });
socket.write(JSON.stringify({ e: "2+2", t: "123abc" }) + "\n");
socket.on('data', buf => {
  const lines = buf.toString('utf8').trim().split(/\n+/);
  for (const line of lines) console.log('RESP:', JSON.parse(line));
});
```
