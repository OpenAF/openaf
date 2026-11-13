# ow.server.rest

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.server](../index.md) / [ow.server.rest](index.md)

<a id="api-ow-server-rest-parseindexes-29543ba1"></a>

## ow.server.rest.parseIndexes

### ow.server.rest.parseIndexes(aBaseURI, aHTTPRequest) : Map

Given aBaseURI and aHTTPRequest will parse and determine the implicit REST API indexes

Sources:

- js/owrap.server.js:1018

<a id="api-ow-server-rest-reply-5f627dcd"></a>

## ow.server.rest.reply

### ow.server.rest.reply(aBaseURI, aRequest, aCreateFunc, aGetFunc, aSetFunc, aRemoveFunc, returnWithParams, anAuditFn, returnHTML) : RequestReply

Provides a REST compliant HTTPServer request replier given a `aBaseURI`, `aRequest`, `aCreateFunc`, `aGetFunc`, `aSetFunc`
and `aRemoveFunc`. Each function will receive a map with the provided indexes and data from the request plus the request itself. Optionally you can
specify with `returnWithParams` = true that each function will not return just the data map but a composed map with: data (the actual
json of data), status (the HTTP code to return) and mimetype.

```javascript
var hs = ow.loadServer().httpd.start(8080);
ow.server.httpd.route(hs, ow.server.httpd.mapRoutesWithLibs(hs, {
   "/rest": function(req) { return ow.server.rest.reply("/rest", req,
      function(idxs, data, r) { // Create and return a map },
      function(idxs, r)       { // Get and return a map },
      function(idxs, data, r) { // Set and return a map },
      function(idxs, r)       { // Remove and return a map }
   )}}, function(req) { return hs.replyOKText("nothing here"); });
ow.server.daemon();
```

Optionally you can also provide `anAuditFn` that will be called on every request with the arguments request and reply maps.

Sources:

- js/owrap.server.js:835

<a id="api-ow-server-rest-replydata-34a5011e"></a>

## ow.server.rest.replyData

### ow.server.rest.replyData(aBaseURI, aRequest, aDataArray) : RequestReply

Provides a REST JSON compliant HTTPServer request replier given a `aBaseURI`, `aRequest` and `aDataArray`.
The data array provided will be manipulated by REST calls.

```javascript
var hs = ow.loadServer().httpd.start(8080);
ow.server.httpd.route(hs, ow.server.httpd.mapRoutesWithLibs(hs, {
   "/rest": function(req) {
      return ow.server.rest.replyData("/rest", req, myData);
   });
ow.server.daemon();
```

Sources:

- js/owrap.server.js:959

<a id="api-ow-server-rest-writeindexes-0c56eb12"></a>

## ow.server.rest.writeIndexes

### ow.server.rest.writeIndexes(aPropsMap) : String

Given a map of REST API indexes (aPropsMap) will return a corresponding URI. Note: just a shortcut for ow.obj.rest.writeIndexes.

Sources:

- js/owrap.server.js:1038

