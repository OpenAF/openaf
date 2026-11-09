# HTTP

[Home](../index.md) / [All APIs](../all-apis.md) / [HTTP](index.md)

<a id="api-http-exec-45830c69"></a>

## HTTP.exec

### HTTP.exec(aUrl, aRequestType, aIn, aRequestMap, isBytes, aTimeout, returnStream) : Object

Builds a HTTP request for the aURL provided with aRequestType (e.g. "GET" or "POST") sending aIn body request (or "") and optionally sending aRequestMap headers and optionally specifying  if the response isBytes and providing an optional custom HTTP aTimeout.  If returnStream = true the response and return value will be in the form of a JavaStream.

Sources:

- src/openaf/plugins/HTTP.java:250

<a id="api-http-get-0ff75fe7"></a>

## HTTP.get

### HTTP.get(aUrl, aIn, aRequestMap, isBytes, aTimeout, returnStream)

Builds a HTTP request for the aURL with a GET sending aIn body request (or "") and optionally sending aRequestMap headers and optionally specifying  if the response isBytes and providing an optional custom HTTP aTimeout. If returnStream = true, the response will be in  the form of a JavaStream (please use the returnStream function).

Sources:

- src/openaf/plugins/HTTP.java:302

### HTTP.get(aUrl, aIn, aRequestMap, isBytes, aTimeout, returnStream)

Builds a HTTP request for the aURL with a POST sending aIn body request (or "") and optionally sending aRequestMap headers and optionally specifying  if the response isBytes and providing an optional custom HTTP aTimeout. If returnStream = true, the response will be in  the form of a JavaStream (please use the returnStream function).

Sources:

- src/openaf/plugins/HTTP.java:340

<a id="api-http-getbytes-479733af"></a>

## HTTP.getBytes

### HTTP.getBytes(aUrl, aIn, aRequestMap, aTimeout)

Builds a HTTP request returning bytes for the aURL with a GET sending aIn body request (or "") and optionally sending aRequestMap headers and providing an optional custom HTTP aTimeout.

Sources:

- src/openaf/plugins/HTTP.java:316

<a id="api-http-geterrorresponse-2ddc6864"></a>

## HTTP.getErrorResponse

### HTTP.getErrorResponse() : Object

Returns the HTTP request error result string.

Sources:

- src/openaf/plugins/HTTP.java:365

<a id="api-http-getresponse-618010e9"></a>

## HTTP.getResponse

### HTTP.getResponse() : Object

Returns the HTTP request result string or array of bytes.

Sources:

- src/openaf/plugins/HTTP.java:354

<a id="api-http-getstream-fb37869d"></a>

## HTTP.getStream

### HTTP.getStream(aUrl, aIn, aRequestMap, aTimeout)

Builds a HTTP request, returning a JavaStream, for the aURL with a GET sending aIn body request (or "") and optionally sending aRequestMap headers and optionally providing a custom HTTP aTimeout.

Sources:

- src/openaf/plugins/HTTP.java:328

<a id="api-http-http-d5366297"></a>

## HTTP.http

### HTTP.http(aURL, aRequestType, aIn, aRequestMap, isBytes, aTimeout, returnStream)

Builds a HTTP request for the aURL provided with aRequestType (e.g. "GET" or "POST") sending aIn body request (or "") and optionally sending aRequestMap headers and optionally specifying  if the response isBytes and providing an optional custom HTTP aTimeout.   If needed use java.lang.System.setProperty("sun.net.http.allowRestrictedHeaders", "true") to  allow you to use restricted request headers. If returnStream = true, the response will be in  the form of a JavaStream (please use the returnStream function).

Sources:

- src/openaf/plugins/HTTP.java:128

<a id="api-http-login-dc297e99"></a>

## HTTP.login

### HTTP.login(aUser, aPassword, forceBasic, urlPartial)

Tries to build a simple password authentication with the provided aUser and aPassword (encrypted or not). By default it tries to use the Java Password Authentication but it forceBasic = true it will force basic authentication to be use. It's advisable to use urlPartial to associate a login/password to a specific URL location.

Sources:

- src/openaf/plugins/HTTP.java:144

<a id="api-http-response-c0127a1d"></a>

## HTTP.response

### HTTP.response() : String

Returns the HTTP request result as a string (if isBytes = false or default)

Sources:

- src/openaf/plugins/HTTP.java:431

<a id="api-http-responsebytes-f09bec25"></a>

## HTTP.responseBytes

### HTTP.responseBytes() : ArrayOfBytes

Returns the HTTP request result as an array of bytes (if isBytes = true)

Sources:

- src/openaf/plugins/HTTP.java:420

<a id="api-http-responsecode-24f823fb"></a>

## HTTP.responseCode

### HTTP.responseCode() : Number

Returns the HTTP request response code (e.g. 404, 500, ...)

Sources:

- src/openaf/plugins/HTTP.java:376

<a id="api-http-responseheaders-c57ce8bf"></a>

## HTTP.responseHeaders

### HTTP.responseHeaders() : Map

Returns a Map with the response headers of the HTTP request.

Sources:

- src/openaf/plugins/HTTP.java:387

<a id="api-http-responsestream-fd844cd1"></a>

## HTTP.responseStream

### HTTP.responseStream() : JavaStream

Returns a JavaStream if the option of returnStream = true in the previous instance function called.

Sources:

- src/openaf/plugins/HTTP.java:409

<a id="api-http-responsetype-4d3f4bdc"></a>

## HTTP.responseType

### HTTP.responseType() : String

Returns the HTTP request response content mime type.

Sources:

- src/openaf/plugins/HTTP.java:398

<a id="api-http-wsclient-33bd251c"></a>

## HTTP.wsClient

### HTTP.wsClient(anURL, onConnect, onMsg, onError, onClose, aTimeout, supportSelfSigned) : WebSocketsReply

Tries to establish a websocket connection (ws or wss) and returns a jetty WebSocketClient java object.
As callbacks you should defined `onConnect`, `onMsg`, `onError` and `onClose`. The `onConnect` callback will
provide, as argument, the created session that you should use to send data; the `onMsg` callback will
provide, as arguments, `aType` (either "text" or "bytes"), `aPayload` (string or array of bytes) and an offset
and length (in case type is "bytes"); the `onError` callback will provide the cause; the `onClose` callback
will provide `aStatusCode` and `aReason`. You can optionally provide `aTimeout` (number) and indicate if self signed SSL
certificates should be accepted (`supportSelfSigned` = true). Example:

```javascript
plugin("HTTP");
var session; var output = "";
var res = (new HTTP()).wsClient("ws://echo.websocket.org",
  function(aSession) { log("Connected"); session = aSession; },
  function(aType, aPayload, aOffset, aLength) { if (aType == "text") output += aPayload; },
  function(aCause) { logErr(aCause); },
  function(aStatusCode, aReason) { log("Closed (" + aReason + ")"); }
);
session.getRemote().sendString("Hello World!");
while(output.length < 1) { sleep(100); };
res.client.stop();
print(output);
```

NOTE: this functionality is only available if used with JVM >= 1.8

Sources:

- src/openaf/plugins/HTTP.java:479

<a id="api-http-wsconnect-af1f14fd"></a>

## HTTP.wsConnect

### HTTP.wsConnect(anURL, onConnect, onMsg, onError, onClose, aTimeout, supportSelfSigned) : WebSocketClient

Tries to establish a websocket connection (ws or wss) and returns a jetty WebSocketClient java object.
As callbacks you should defined `onConnect`, `onMsg`, `onError` and `onClose`. The `onConnect` callback will
provide, as argument, the created session that you should use to send data; the `onMsg` callback will
provide, as arguments, `aType` (either "text" or "bytes"), `aPayload` (string or array of bytes) and an offset
and length (in case type is "bytes"); the `onError` callback will provide the cause; the `onClose` callback
will provide `aStatusCode` and `aReason`. You can optionally provide `aTimeout` (number) and indicate if self signed SSL
certificates should be accepted (`supportSelfSigned` = true). Example:

```javascript
plugin("HTTP");
var session; var output = "";
var client = (new HTTP()).wsConnect("ws://echo.websocket.org",
  function(aSession) { log("Connected"); session = aSession; },
  function(aType, aPayload, aOffset, aLength) { if (aType == "text") output += aPayload; },
  function(aCause) { logErr(aCause); },
  function(aStatusCode, aReason) { log("Closed (" + aReason + ")"); }
);
session.getRemote().sendString("Hello World!");
while(output.length < 1) { sleep(100); };
client.stop();
print(output);
```

NOTE: this functionality is only available if used with JVM >= 1.8

Sources:

- src/openaf/plugins/HTTP.java:442

