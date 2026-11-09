# HTTPd

[Home](../index.md) / [All APIs](../all-apis.md) / [HTTPd](index.md)

<a id="api-httpd-httpd-2ed5f1e9"></a>

## HTTPd.HTTPd

### HTTPd.HTTPd(aPort, aLocalInteface, keyStorePath, keyStorePassword, logFunction, webSockets, aTimeout, aImpl)

Creates a HTTP server instance on the provided port and optionally on the identified local interface.
If the port provided is 0 or negative a random port will be assigned. To determine what this port is
you can use the function HTTPServer.getPort().
If `aImpl` = "java" is provided the Java built-in HttpServer implementation will be used.
If `keyStorePath` is defined, the corresponding SSL Key Store will be used (connections will be https) with
the provided `keyStorePassword`. Do note that the `keyStorePath` should be included in the OpenAF classpath.
The `logFunction`, if defined, will be called by the server whenever there is any logging to be performed
by the HTTPServer. This function will receive 3 arguments. Example:

```javascript
plugin("HTTPServer");
var s = new HTTPd(8091, void 0, void 0, void 0, function(aType, aMsg, anException) {
   if(aType.toString() != "DEBUG" && anException.getMessage() != "Broken pipe")
      logErr("Type: " + aType + " | Message: " + aMsg + anException.printStackTrace());
});
s.addEcho("/echo");
s.add("/stuff", function(req) {
   print(beautifier(req));
   return s.replyOKText("Stuff!!");
});
s.setDefault("/stuff");
```

To generate a SSL key store you can use Java's keytool:

```sh
keytool -genkey -keyalg RSA -alias selfsigned -keystore keystore.jks -storepass password -validity 360 -keysize 2048 -ext SAN=DNS:localhost,IP:127.0.0.1  -validity 9999
```

And then add keystore.jks to the openaf.jar and have `keyStorePath` = "/keystore.jks".

To support websockets you need to build IWebSock object and provide a timeout. For example:

```javascript
plugin("HTTPServer");
var webSock = new Packages.com.nwu2.httpd.IWebSock({
   // onOpen callback
   oOpen: _ws => { log("Connection open") },
   // onClose callback
   oClose: (_ws, aCode, aReason, hasInitByRemote) => { log("Connection close: " + String(aReason)) },
   // onMessage callback
   oMessage: (_ws, aMessage) => { _ws.send(aMessage.getTextPayload()); },
   // onPong callback
   oPong: (_ws, aPong) => { },
   // onException callback
   oException: (_ws, anException) => { logErr(String(anException)); }
});
var s = new HTTPd(8091, "127.0.0.1", void 0, void 0, void 0, webSock, 30000); // 30 seconds timeout
s.addWS("/websocket");  // makes it available at ws://127.0.0.1:8091/websocket
```

Sources:

- src/openaf/plugins/HTTPServer.java:311

<a id="api-httpd-add-307e6486"></a>

## HTTPd.add

### HTTPd.add(aURI, aFunction)

Adds a custom responder to the provided URI. Any call to the URI will trigger a call to
the provided function. The function will receive the request as an argument. For example:

```javascript
var hs = new HTTPd(1234);
hs.add("/example", function(req) { return hs.replyOKText(beautifier(req)); });
```

Sources:

- src/openaf/plugins/HTTPServer.java:757

<a id="api-httpd-addecho-5220316d"></a>

## HTTPd.addEcho

### HTTPd.addEcho(aURI)

Adds a echo responder to the provided URI. Useful for debugging http requests to  a server instance.

Sources:

- src/openaf/plugins/HTTPServer.java:644

<a id="api-httpd-addfilebrowse-51640f44"></a>

## HTTPd.addFileBrowse

### HTTPd.addFileBrowse(aURI, aFilepath)

Adds a responder to the provided URI that provides a very basic file browse to the provided aFilepath. Warning: keep in mind that this will expose files without any credential checking.

Sources:

- src/openaf/plugins/HTTPServer.java:868

<a id="api-httpd-addsession-5aac016a"></a>

## HTTPd.addSession

### HTTPd.addSession(aSessionID)

Provides a simple session track mechanism adding the session ID provided. See HTTPServer.setSession to add data.

Sources:

- src/openaf/plugins/HTTPServer.java:1241

<a id="api-httpd-addstatus-3961111e"></a>

## HTTPd.addStatus

### HTTPd.addStatus(aURI)

Adds a status responder to the provided URI. Useful for debugging proposes

Sources:

- src/openaf/plugins/HTTPServer.java:708

<a id="api-httpd-addxdtserver-d8013d10"></a>

## HTTPd.addXDTServer

### HTTPd.addXDTServer(aURI, aAuthFunction, aOpsBrokerFunction)

Adds a WeDo XDT server responder to the provided URI with authentication provided by the `aAuthFunction`
and operations provided by the `aOpsBrokerFunction`. For example:

```javascript
var hs = new HTTPd(1234);
hs.addXDTServer('/xdt',
  function(auth) {
     if (auth.getUser() == 'adm' && auth.getPass() == 'Password1') {
        return true;
     } else {
     	 return false;
     }
  },
  function(sessionId, operation, paramIn, request) {
     switch(operation) {
        case "HelloWorld":
           return {"hello": "world!"};
        case "Ping":
           return paramIn;
        default:
           return paramIn;
     }
  }
);
```

Sources:

- src/openaf/plugins/HTTPServer.java:992

<a id="api-httpd-delsession-fcee2470"></a>

## HTTPd.delSession

### HTTPd.delSession(aSessionID)

Removes the provided session ID data from memory.

Sources:

- src/openaf/plugins/HTTPServer.java:1274

<a id="api-httpd-getimpl-82e8db74"></a>

## HTTPd.getImpl

### HTTPd.getImpl() : string

Returns the implementation used by the HTTP server instance. Possible values are "java" for Java built-in HttpServer, "nwu2" for NWU2 HTTP server, and "nwu" for legacy NWU HTTP server.

Sources:

- src/openaf/plugins/HTTPServer.java:538

<a id="api-httpd-getport-e0c13304"></a>

## HTTPd.getPort

### HTTPd.getPort() : number

Returns the listen port of the HTTP server instance.

Sources:

- src/openaf/plugins/HTTPServer.java:556

<a id="api-httpd-getsession-86c635ff"></a>

## HTTPd.getSession

### HTTPd.getSession(aSessionID) : Object

Retrieves the current data stored for the provided session ID.

Sources:

- src/openaf/plugins/HTTPServer.java:1252

<a id="api-httpd-hassession-0eb96442"></a>

## HTTPd.hasSession

### HTTPd.hasSession(aSessionID) : boolean

Returns true if the provided session ID was add to memory. False otherwise.

Sources:

- src/openaf/plugins/HTTPServer.java:1285

<a id="api-httpd-reply-f61efe73"></a>

## HTTPd.reply

### HTTPd.reply(data, aMimetype, aHTTPCode, aMapOfHeaders) : Object

Builds a response object suitable to provide a reply to a HTTP request for a function used with the HTTPServer.add method. It will return aMimetype (string representation) with the provided data (string format) and the aHTTPCode and the map of extra HTTP headers.

Sources:

- src/openaf/plugins/HTTPServer.java:1161

<a id="api-httpd-replybytes-51d5b85b"></a>

## HTTPd.replyBytes

### HTTPd.replyBytes(data, aMimetype, aHTTPCode, aMapOfHeaders) : Object

Builds a response object suitable to provide a reply to a HTTP request for a function used with the HTTPServer.add method. It will return aMimetype (string representation) with the provided data (as an array of bytes), the aHTTPCode and the map of extra HTTP headers.

Sources:

- src/openaf/plugins/HTTPServer.java:1186

<a id="api-httpd-replyokbin-87ee2209"></a>

## HTTPd.replyOKBin

### HTTPd.replyOKBin(data, aMapOfHeaders) : Object

Builds a response object suitable to provide a reply to a HTTP request for a function used with the HTTPServer.add method. It will return application/octet-stream mimetype with the provided data (as an array of bytes) and a HTTP code of OK.  Also you can provide the map of extra HTTP headers.

Sources:

- src/openaf/plugins/HTTPServer.java:1139

<a id="api-httpd-replyokhtml-1d0ee5f5"></a>

## HTTPd.replyOKHTML

### HTTPd.replyOKHTML(data, aMapOfHeaders) : Object

Builds a response object suitable to provide a reply to a HTTP request for a function used with the HTTPServer.add method. It will return a HTML mimetype with the provided data (in string format) and a HTTP code of OK. Also you can provide the map of extra HTTP headers.

Sources:

- src/openaf/plugins/HTTPServer.java:1095

<a id="api-httpd-replyokjson-3a6522c3"></a>

## HTTPd.replyOKJSON

### HTTPd.replyOKJSON(data, aMapOfHeaders) : Object

Builds a response object suitable to provide a reply to a HTTP request for a function used with the HTTPServer.add method. It will return a JSON mimetype with the provided data (in string format) and a HTTP code of OK. Also you can provide the map of extra HTTP headers.

Sources:

- src/openaf/plugins/HTTPServer.java:1117

<a id="api-httpd-replyoktext-ebfde0d2"></a>

## HTTPd.replyOKText

### HTTPd.replyOKText(data, aMapOfHeaders) : Object

Builds a response object suitable to provide a reply to a HTTP request for a function used with the HTTPServer.add method. It will return a text mimetype with the provided data and a HTTP code of OK. Also you can provide the map of extra HTTP headers.

Sources:

- src/openaf/plugins/HTTPServer.java:1051

<a id="api-httpd-replyokxml-17cc63bf"></a>

## HTTPd.replyOKXML

### HTTPd.replyOKXML(data, aMapOfHeaders) : Object

Builds a response object suitable to provide a reply to a HTTP request for a function used with the HTTPServer.add method. It will return a XML mimetype with the provided data (in string format) and a HTTP code of OK. Also you can provide the map of extra HTTP headers.

Sources:

- src/openaf/plugins/HTTPServer.java:1073

<a id="api-httpd-replystream-e3afb5ca"></a>

## HTTPd.replyStream

### HTTPd.replyStream(stream, aMimetype, aHTTPCode, aMapOfHeaders) : Object

Builds a response object suitable to provide a reply to a HTTP request for a function used with the HTTPServer.add method. It will return aMimetype (string representation) with the provided input stream, the aHTTPCode and the map of extra HTTP headers.

Sources:

- src/openaf/plugins/HTTPServer.java:1214

<a id="api-httpd-setdefault-74e1d254"></a>

## HTTPd.setDefault

### HTTPd.setDefault(aURI)

Sets the default URI to redirect all requests that don't have a responder associated. For example:

```javascript
var hs = new HTTPd(1234);
hs.addEcho("/echo");
hs.setDefault("/echo");
```

Sources:

- src/openaf/plugins/HTTPServer.java:808

<a id="api-httpd-setsession-47401fa7"></a>

## HTTPd.setSession

### HTTPd.setSession(aSessionID, anObject)

Sets the provided anObject as the session data for the session ID provided.

Sources:

- src/openaf/plugins/HTTPServer.java:1263

<a id="api-httpd-stop-895f3d39"></a>

## HTTPd.stop

### HTTPd.stop()

Tries to stop the currently running HTTP server instance.

Sources:

- src/openaf/plugins/HTTPServer.java:567

