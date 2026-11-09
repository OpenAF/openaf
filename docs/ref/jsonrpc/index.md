# $jsonrpc

[Home](../index.md) / [All APIs](../all-apis.md) / [$jsonrpc](index.md)

<a id="api-jsonrpc-onrequest-0f570d0c"></a>

## $jsonrpc.onRequest

### $jsonrpc.onRequest(method, handler) : Map

Registers a synchronous inbound JSON-RPC request handler `(params, request)`.
Throw `{code,message,data}` for a protocol error. `offRequest(method)` removes it.
`onNotification(method, handler)` and `offNotification(method)` register/remove event handlers.
Stdio uses two bounded callback workers; HTTP POST SSE dispatches on its response reader.
`startListening(options)` / `stopListening()` manage one optional legacy HTTP GET stream.
`exec(method, params, notification, {onRequestId: fn})` exposes the outgoing id for cancellation.

Sources:

- js/openaf.js:10049

