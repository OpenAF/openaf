# ow.server.socket

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.server](../index.md) / [ow.server.socket](index.md)

<a id="api-ow-server-socket-start-5d5d6d8f"></a>

## ow.server.socket.start

### ow.server.socket.start(aPort, aFunction, aBackLog, aBindAddr)

Starts a thread listening on `aPort` with `aBackLog` (defaults to a queue of 50 connections in waiting) on `aBindAddr` (defaults to "0.0.0.0").
Whenever a connection is established `aFunction` will be called with the corresponding java.net.Socket and a java.net.ServerSocket. Examples:

```javascript
ow.loadServer();
ow.server.socket.start(12345, (clt, srv) => {
   log("Connection from " + clt.getInetAddress().getHostAddress());
   ioStreamReadLines(clt.getInputStream(), stream => {
      print(stream);
      ioStreamWrite(clt.getOutputStream(), stream);
      clt.getOutputStream().flush();
	     clt.shutdownInput();
      clt.shutdownOutput();
      return true;
   });
   log("closing...");
   clt.close();
});
```

Sources:

- js/owrap.server.js:4941

<a id="api-ow-server-socket-stop-b666e88f"></a>

## ow.server.socket.stop

### ow.server.socket.stop(aPort)

Stops a thread socket server on aPort previously started by ow.server.socket.start.

Sources:

- js/owrap.server.js:4991

