# ow.server.openafServer

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.server](../index.md) / [ow.server.openafServer](index.md)

<a id="api-ow-server-openafserver-exec-3dcec209"></a>

## ow.server.openafServer.exec

### ow.server.openafServer.exec(aId, aScript, aServerPid)

Tries to execute the given aScript locally or in the aServerPid provided (created by a ow.server.openafServer.start). Optionally you can also specify aId.

Sources:

- js/owrap.server.js:226

<a id="api-ow-server-openafserver-load-3759ce8f"></a>

## ow.server.openafServer.load

### ow.server.openafServer.load(aId, aScriptFilePath, aServerPid)

Tries to execute the given aScriptFilePath locally or in the aServerPid provided (created by a ow.server.openafServer.start). Optionally you can also specify aId.

Sources:

- js/owrap.server.js:237

<a id="api-ow-server-openafserver-start-7bdc7013"></a>

## ow.server.openafServer.start

### ow.server.openafServer.start(aId, aPort, notLocal)

Starts an internal JMX server with a give optional aId. If there is a need to access it externally  (do keep in mind security) you can provide also aPort. This server allows for the load or execution  of OpenAF scripts. In extreme cases you can use notLocal = true to make the server available outside the localhost (NOT ADVISABLE&#33;).

Sources:

- js/owrap.server.js:194

<a id="api-ow-server-openafserver-stop-995ee2a4"></a>

## ow.server.openafServer.stop

### ow.server.openafServer.stop()

Attempts to stop the existing server.

Sources:

- js/owrap.server.js:248

