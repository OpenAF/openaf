# ow.server.httpd

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.server](../index.md) / [ow.server.httpd](index.md)

## Subcategories

- [ow.server.httpd.browse](browse/index.md)

<a id="api-ow-server-httpd-addhttpcode-b93e394e"></a>

## ow.server.httpd.addHTTPCode

### ow.server.httpd.addHTTPCode(aCodeRef, aCodeNum)

Adds a new HTTP aCodeNum number that will be referenced by the name aCodeRef.

Sources:

- js/owrap.server.js:4824

<a id="api-ow-server-httpd-addmimetype-719c2762"></a>

## ow.server.httpd.addMimeType

### ow.server.httpd.addMimeType(anExtension, aMimeType)

Adds a new aMimeType for the corresponding anExtension.

Sources:

- js/owrap.server.js:4814

<a id="api-ow-server-httpd-authbasic-bc6ae650"></a>

## ow.server.httpd.authBasic

### ow.server.httpd.authBasic(aRealm, aHTTPd, aReq, aAuthFunc, aReplyFunc, aUnAuthFunc) : Map

Wraps a httpd reply with basic HTTP authentication for the provided `aRealm` on the `aHTTPd` server. The `aReq`
request map should be provided along with `aAuthFunc` (that receives the user and password and should return
true of false if authentication is successful). If authentication is successful `aReplyFunc` will be executed
receiving `aHTTPd` and `aReq`. Otherwise an optional `aUnAuthFunc` will be executed also receiving `aHTTPd` and `aReq`.
Example:

```javascript
ow.server.httpd.route(hs, ow.server.httpd.mapRoutesWithLibs(hs, {
   "/f": function(req) {
      return ow.server.httpd.authBasic(
         "realm", hs, req,
         function(user, pass) {
            if (user == "adm" && pass == "Password1") return true; else return false;
         },
  	    function(hss, areq) {
	       return ow.server.httpd.replyFile(hss, "/some/path", "/f", areq.uri);
	    },
	    function(hss, ar) {
	       return hss.reply("Not authorized.", "text/plain", ow.server.httpd.codes.UNAUTHORIZED);
	    }
     );
  }
}),
function(req) {
   return hs.replyOKText("nothing here...");
}
);
```

Sources:

- js/owrap.server.js:4759

<a id="api-ow-server-httpd-authoauth-a134965f"></a>

## ow.server.httpd.authOAuth

### ow.server.httpd.authOAuth(aMapOptions, aHTTPd, aRequest, aFnReply) : Map

Provides OAuth 2.0 support by intersecting `aRequest` of `aHTTPd` to return `aFnReply` only on correctly authenticated. `aMapOptions`
provides the OAuth configurations to follow:

`aMapOptions`:

- `realm` (optional) An unique realm name (defaults to 'realm')
- `cookie` (optional) The name of the cookie entry to use (defaults to 'OAF_AUTH_SESSION_ID')
- `baseURL` (mandatory) The web server base url (e.g. https://myserver:8090)
- `uriLogout` (optional) The uri to use on the web server to logout (defaults to '/logout')
- `uriCallBack` (optional) The uri to use on the web server to callback (defaults to '/cb'). You should configure oauth to allow redirection to base url + callback (e.g. https://myserver:8090/cb)
- `oauthAuthURL` (mandatory) The OAuth authorization_endpoint
- `oauthTokenURL` (mandatory) The OAuth token_endpoint
- `oauthLogoutURL` (mandatory) The OAuth end_session_endpoint
- `oauthCliendId` (mandatory) The OAuth configured client id
- `oauthClientSecret` (mandatory) The OAuth configured client secret

Sources:

- js/owrap.server.js:4612

<a id="api-ow-server-httpd-getfromopenaf-c36927b5"></a>

## ow.server.httpd.getFromOpenAF

### ow.server.httpd.getFromOpenAF(aResource, inBytes, anEncoding) : anArrayOfBytes

Retrieves aResource, as anArrayOfBytes, from the openaf.jar. This resource can be inBytes = true or not and anEncoding can be provided.

Sources:

- js/owrap.server.js:3784

<a id="api-ow-server-httpd-getfromzip-76497641"></a>

## ow.server.httpd.getFromZip

### ow.server.httpd.getFromZip(aZipFile, aResource, inBytes, anEncoding) : anArrayOfBytes

Retrieves aResource, as anArrayOfBytes, from aZipFile. This resource can be inBytes = true or not and anEncoding can be provided.

Sources:

- js/owrap.server.js:3795

<a id="api-ow-server-httpd-geths-24c1be0c"></a>

## ow.server.httpd.getHS

### ow.server.httpd.getHS(aPort) : HTTPd

Returns the HTTPd object created, if any, for aPort.

Sources:

- js/owrap.server.js:3747

<a id="api-ow-server-httpd-getmimetype-6cad4947"></a>

## ow.server.httpd.getMimeType

### ow.server.httpd.getMimeType(aFilename) : String

Tries to determine the mime type of aFilename and returns it. If not determined it will default to application/octet-stream.

Sources:

- js/owrap.server.js:4596

<a id="api-ow-server-httpd-maprouteswithlibs-2a37582f"></a>

## ow.server.httpd.mapRoutesWithLibs

### ow.server.httpd.mapRoutesWithLibs(aHTTPd, aMapOfRoutes) : Map

Helper to use with ow.server.httpd.route to automatically add routes for JQuery, Handlebars, jLinq and Underscore from the openaf.jar.

Sources:

- js/owrap.server.js:3949

<a id="api-ow-server-httpd-mapwithexistingroutes-cc72e253"></a>

## ow.server.httpd.mapWithExistingRoutes

### ow.server.httpd.mapWithExistingRoutes(aHTTPd, aMapOfRoutes) : Map

Builds a map of routes taking into account the already defined routes for aHTTPd thus effectively letting add new routes.

Sources:

- js/owrap.server.js:3914

<a id="api-ow-server-httpd-oauth2-583f7769"></a>

## ow.server.httpd.oauth2

### ow.server.httpd.oauth2(aOptions) : Object

Creates a localhost OAuth2 authorization-code client. Requires authURL, tokenURL, clientId and an HTTP loopback redirectURI with an explicit port. authenticate() returns tokens, reusing or refreshing cached credentials; getAuthStatus() returns non-secret status; clearAuth() removes credentials; cancel() stops a pending login. Uses fresh state and S256 PKCE. Optional clientSecret, scope, audience, resource, extraAuthParams and extraParams configure the provider. authURL and tokenURL must use HTTPS unless they are loopback addresses or allowHTTP is true. interactive defaults to true, disableOpenBrowser to false, loginTimeoutMs to 300000, tokenTimeoutMs to 60000 and refreshWindowMs to 30000. onAuthorizationURL(url) receives the login URL after the listener is ready. tokenStore defaults to &#123;type:"sec", repo:"oauth2", profile:"default"&#125;; false disables persistence. Store options match $mcp's tokenStore (including synchronous custom stores). Tokens and expiry/identity metadata are encrypted using $sec; client secrets, codes, state and PKCE material are never persisted.

Sources:

- js/owrap.server.js:3367

<a id="api-ow-server-httpd-reply-ba06a3e7"></a>

## ow.server.httpd.reply

### ow.server.httpd.reply(aObject, aStatus, aMimeType, aHeadersMap) : Map

Builds the map response for a HTTP server request using aObject (map, array, string or bytearray), aStatus (default to 200), aMimeType (defaults to application/octet-stream if not recognized) and aHeadersMap.

Sources:

- js/owrap.server.js:4886

<a id="api-ow-server-httpd-replybrowse-20f2869b"></a>

## ow.server.httpd.replyBrowse

### ow.server.httpd.replyBrowse(server, request, &#95;options) : Map

Provides a helper function to reply with a list of files or a file content. The `_options` map is used to
provide the following functions:

- `getList(request, _options)`: Function to get the list of files or directories
- `getObj(request, _options)`: Function to get the object requested
- `renderList(list, server, request, _options)`: Function to render the list of files
- `renderObj(obj, server, request, _options)`: Function to render the object requested
- `renderEmpty(request, _options)`: Function to render an empty list

Sources:

- js/owrap.server.js:4284

<a id="api-ow-server-httpd-replyfile-c734dae2"></a>

## ow.server.httpd.replyFile

### ow.server.httpd.replyFile(aHTTPd, aBaseFilePath, aBaseURI, aURI, notFoundFunction, documentRootArray, mapOfHeaders) : Map

Provides a helper `aHTTPd` reply that will enable the download of a file, from `aBaseFilePath` (a file path or java stream), given `aURI` part of
`aBaseURI`. Optionally you can also provide a `notFoundFunction` and an array of file strings (documentRootArraY) to replace as
documentRoot. Example:

```javascript
ow.server.httpd.route(hs, ow.server.httpd.mapRoutesWithLibs(hs, {
   "/stuff/to/server": r => ow.server.httpd.replyFile(hs, "/some/path/to/serve/files", "/stuff/to/server", req.uri)
}), r => hs.replyOKText("nothing here...") );
```

Sources:

- js/owrap.server.js:4064

<a id="api-ow-server-httpd-replyfilemd-1aa9a8d8"></a>

## ow.server.httpd.replyFileMD

### ow.server.httpd.replyFileMD(aHTTPd, aBaseFilePath, aBaseURI, aURI, notFoundFunction, documentRootArray, mapOfHeaders, noMaxWidth) : Map

Provides a helper `aHTTPd` reply that will enable the parsing markdown file-based sites, from `aBaseFilePath` (a file path or stream), given `aURI` part of
`aBaseURI`. Optionally you can also provide a `notFoundFunction` and an array of file strings (documentRootArraY) to replace as
documentRoot. Example:

```javascript
ow.server.httpd.route(hs, ow.server.httpd.mapRoutesWithLibs(hs, {
   "/stuff/to/server": function(req) {
      return ow.server.httpd.replyFileMD(hs, "/some/path/to/serve/files", "/stuff/to/server", req.uri);
   }
}),
function(req) {
   return hs.replyOKText("nothing here...");
}
);
```

Sources:

- js/owrap.server.js:4124

<a id="api-ow-server-httpd-replyfn-a845b4b9"></a>

## ow.server.httpd.replyFn

### ow.server.httpd.replyFn(aFunctionName, aInstance, aRequest, aParams, dontRetError) : Map

Provides a helper function to call aFunctionName over aInstance (default this) given a POST aRequest. If aFunctionName doesn't have odoc help information available you will need to provide aParams map for the expected aFunctionName arguments. If dontRetError = true any exception will be kept in the server and an empty map will be returned.

Sources:

- js/owrap.server.js:4252

<a id="api-ow-server-httpd-replyjsmap-6f700d10"></a>

## ow.server.httpd.replyJSMap

### ow.server.httpd.replyJSMap(aHTTPd, aMapOrArray) : Map

Provides a helper `aHTTPd` reply that will parse `aMapOrArray` into a HTML output. Example:

```javascript
ow.server.httpd.route(hs, ow.server.httpd.mapRoutesWithLibs(hs, {
   "/stuff/to/server": r => ow.server.httpd.replyJSMap(hs, getOPackPaths()
}),
r => hs.replyOKText("nothing here...")
);
```

Sources:

- js/owrap.server.js:4201

<a id="api-ow-server-httpd-replyjsonrpc-5f12c46e"></a>

## ow.server.httpd.replyJSONRPC

### ow.server.httpd.replyJSONRPC(server, request, mapOfFunctions, logFn, debugFn, opts) : Map

Implements a JSON-RPC 2.0 endpoint using the provided `mapOfFunctions`. The `request` must be a POST with a JSON-RPC body.
Optionally you can provide `logFn` and `debugFn` functions to log errors and debug information respectively.

Example usage:

```javascript
ow.server.httpd.route(hs, {
  "/rpc": (req) => ow.server.httpd.replyJSONRPC(hs, req, { sum: (a, b) => a + b }, logErr, log)
})
```

`opts` is an optional map: { modern: false, listMethods: [...] } (defaults shown). When modern is true,
requests carrying a modern (2026-07-28+) per-`request` _meta protocol version are validated against
`ow.server.mcp.versions.supported` (replying with an UnsupportedProtocolVersionError otherwise), results are
wrapped with the required resultType (plus ttlMs/cacheScope for methods listed in `opts`.listMethods, default
["tools/list","prompts/list","resources/list","resources/templates/list"]), and the negotiated version is
echoed back via the MCP-Protocol-Version response header. Legacy requests (the default, and everything when
modern is false/omitted) are handled exactly as before -- zero behavior change.

Sources:

- js/owrap.server.js:4322

<a id="api-ow-server-httpd-replymcp-54fad509"></a>

## ow.server.httpd.replyMCP

### ow.server.httpd.replyMCP(server, request, mapOfFunctions, logFn, debugFn, opts) : Map

Implements a Model Context Protocol (MCP) endpoint using the provided `mapOfFunctions`. The `request` must be a POST with a MCP body.
Optionally you can provide `logFn` and `debugFn` functions to log errors and debug information respectively.

Example usage:

```javascript
ow.server.httpd.route(hs, {
   "/mcp": req => ow.server.httpd.replyMCP(hs, req, {
	initialize                 : params => ({ serverInfo: { name: "OpenAF", title: "OpenAF test ", version: "1.0.0" }, capabilities: { prompts: { listChanged: true }, tools: { listChanged: true } } }),
	"notifications/initialized": params => ({}),
	"tools/call"               : () => ({content:[{type:"text",text:"PONG!"}],isError: false}),
	"tools/list"               : params => { cprint(params); return { tools: [{name:"ping",description:"pings",title:"ping"}] } },
	"prompts/list"             : params => ({})
  }, logErr, log),
  "/echo": req => ow.server.httpd.reply(stringify(req))
 })
```

`opts` is an optional map: { modern: false, listMethods: [...] } -- see `ow.server.httpd.replyJSONRPC` for the
meaning of both; the same opt-in 2026-07-28 modern-era handling (version validation, resultType/ttlMs/
cacheScope wrapping, MCP-Protocol-Version response header) applies here, with legacy behavior (default)
left fully unchanged.

Sources:

- js/owrap.server.js:4461

<a id="api-ow-server-httpd-replyredirect-606665d3"></a>

## ow.server.httpd.replyRedirect

### ow.server.httpd.replyRedirect(aHTTPd, newLocation, mapOfHeaders) : Map

Provides a helper aHTTPd reply that will redirect the request to the newLocation provided (HTTP code 303).

Sources:

- js/owrap.server.js:4239

<a id="api-ow-server-httpd-resetroutes-16cf0c36"></a>

## ow.server.httpd.resetRoutes

### ow.server.httpd.resetRoutes(aHTTPd)

Given aHTTPd it will reset all internal mapped routes to a reply HTTP code 401 to everything.

Sources:

- js/owrap.server.js:3767

<a id="api-ow-server-httpd-route-48eabfdf"></a>

## ow.server.httpd.route

### ow.server.httpd.route(aHTTPd, aMapOfRoutes, aDefaultRoute, aPath, aPreRouteFunc)

Adds a request router to `aHTTPd` given `aMapOfRoutes`. This router will use `aPath` if defined or /r otherwise.
Optionally you can also specify `aPreRouteFunc` that will run before any routing is made.
Example:

```javascript
ow.loadServer();
var hs = ow.server.httpd.start(17878);
ow.server.httpd.route(hs, ow.server.httpd.mapRoutesWithLibs(hs, {
		"/myapp": function(req, aHs) {
			return aHs.replyOKText("my stuff!!");
		}
}),
function(req) {
		return hs.replyOKText("nothing here...");
});
log("READY!");
ow.server.daemon();
```

(available after `ow.loadServer()`)

Sources:

- js/owrap.server.js:3806

<a id="api-ow-server-httpd-setwebsocketroute-683a552a"></a>

## ow.server.httpd.setWebSocketRoute

### ow.server.httpd.setWebSocketRoute(aHTTPd, aURI)

Using aHTTPd sets aURI to act as a websocket server.

Sources:

- js/owrap.server.js:3757

<a id="api-ow-server-httpd-start-d9a26b88"></a>

## ow.server.httpd.start

### ow.server.httpd.start(aPort, aHost, keyStorePath, password, errorFunction, aWebSockets, aTimeout, aImpl) : Object

Will prepare a HTTP server to be used returning a HTTPServer object. Optionally you can provide
`aPort` where you want the HTTP server to run. Otherwise a free port will be assigned. Optionally you can provide a different
`aImpl` (implementation) for the HTTP server. If `aHost` is provided it will be used as the host to bind the server to.
If `keyStorePath` and `password` are provided the server will be started as a secure HTTPS server. If `errorFunction` is provided
it will be called whenever an error occurs in the server. This function will receive the error as a parameter.
If `aWebSockets` is provided it will be used to handle WebSockets connections. If `aTimeout` is provided it will be used as
the timeout for the server to wait for a request before closing the connection.

(available after `ow.loadServer()`).

`aWebSockets`, if used, should be a map with the following functions:

- `onOpen(_ws)`
- `onClose(_ws, aCode, aReason, hasInitByRemote)`
- `onMessage(_ws, aMessage)`
- `onPong(_ws, aPong)`
- `onException(_ws, anException)`

Sources:

- js/owrap.server.js:3664

<a id="api-ow-server-httpd-stop-ce3ac0b9"></a>

## ow.server.httpd.stop

### ow.server.httpd.stop(aHTTPd)

Will stop the aHTTPd server running.  (available after ow.loadServer())

Sources:

- js/owrap.server.js:3934

