# ow.ch.server

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.ch](../index.md) / [ow.ch.server](index.md)

<a id="api-ow-ch-server-expose-212bd1f8"></a>

## ow.ch.server.expose

### ow.ch.server.expose(aName, aLocalPortORServer, aPath, aAuthFunc, aUnAuthFunc, noCheck) : String

Given `aName` channel and `aLocalPortORServer` will use the provided server, or start a simple http server on the
provided port, to expose access to the `aName` channel on the URL `aPath`. It will return an unique identifier
to be use to identify incoming requests from this `aPath` and server on channel subscribe functions. Optionally
you can also provide `aAuthFunc(user, pass, aServer, aRequest)` and `aUnAuthFunc(aServer, aRequest)` functions using `ow.server.httpd.authBasic`.
The `aAuthFunc` can add `aRequest.channelPermission` to enforce read and/or write permissions on a channel (e.g. "r", "rw").
If needed you can ignore the checking if the `aName` channel exists with `noCheck`.

Example:

```javascript
// Exposing the a log dump channel on port 8090 for test proposes.
ow.ch.server.expose("__log", 8090, "/log");
```

Sources:

- js/owrap.ch.js:7164

<a id="api-ow-ch-server-peer-3070619e"></a>

## ow.ch.server.peer

### ow.ch.server.peer(aName, aLocalPortORServer, aPath, aRemoteURLArray, aAuthFunc, aUnAuthFunc, aMaxTime, aMaxCount)

Exposes `aName` channel in the same way as `ow.ch.server.expose` but it also add a subscribe function to
the `aName` channel to remotely peer with other expose channel(s) given `aRemoteURLArray`. Optionally
`aRemoteURLArray` can also be a function returning a URL or an array of URLs. Optionally
you can also provide `aAuthFunc(user, pass)` and `aUnAuthFunc(aServer, aRequest)` functions using `ow.server.httpd.authBasic`.
The `aAuthFunc` can add `aRequest.channelPermission` to enforce read and/or write permissions on a channel (e.g. "r", "rw").
Optionally you can provide `aMaxTime` for expiration of commands to retry to communicate and `aMaxCount` of commands to retry to communicate.

Example:

```javascript
ow.ch.server.peer("__log", 8090, "/log", [ "http://server1.local:8090/log", "https://l:p@server2.local:8090/log" ]);
```

Sources:

- js/owrap.ch.js:7261

<a id="api-ow-ch-server-routeprocessing-be977cee"></a>

## ow.ch.server.routeProcessing

### ow.ch.server.routeProcessing(aURI, aRequest, aName) : HTTPServerReply

Creates a server route processing for a `ow.ch.comms` client provided `aURI`, a HTTPServer `aRequest` and the
`aName` of a channel (please note that you should create the channel prior to using this function).
Depending on `aRequest.channelPermission` some operations may not execute:

- "r" - allows channel get/getAll operations
- "w" - allows channel set/setAll/getSet/unset/unsetAll operations

Example:

```javascript
var hs = ow.loadServer().httpd.start(17878);
ow.server.httpd.route(hs, { "/rest": function(r) { return ow.ch.server.routeProcessing("/rest", r, "my-channel") }});
```

for multiple channels:

```javascript
var hs = ow.loadServer().httpd.start(17878);
ow.server.httpd.route(hs, {
   "/chan1": function(r) { return ow.ch.server.routeProcessing("/chan1", r, "chan-1") },
   "/chan2": function(r) { return ow.ch.server.routeProcessing("/chan2", r, "chan-2") }
});
```

Sources:

- js/owrap.ch.js:7334

<a id="api-ow-ch-server-setlog-edff46be"></a>

## ow.ch.server.setLog

### ow.ch.server.setLog(aLogFunction)

Sets `aLogFunction` to act as audit for external communication to access a channel. The `aLogFunction`
will be called passing, as a single argument, a map with:

- `name` (the channel name)
- `op` (the operation can be AUTH_OK, AUTH_NOT_OK, GET, SET, REMOVE or CREATE)
- `request` (the HTTP request map)

The request, when available, will include an entry with the current user.

Sources:

- js/owrap.ch.js:7145

<a id="api-ow-ch-server-unpeer-3d068d40"></a>

## ow.ch.server.unpeer

### ow.ch.server.unpeer(aName, aRemoteURL)

Remove all subscribers related with aRemoteURL from the aName channel effectively "unpeering" it from the aRemoteURL.

Sources:

- js/owrap.ch.js:7316

