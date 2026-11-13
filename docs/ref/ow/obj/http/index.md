# ow.obj.http

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.obj](../index.md) / [ow.obj.http](index.md)

<a id="api-ow-obj-http-close-1a1857da"></a>

## ow.obj.http.close

### ow.obj.http.close()

Closes the current http connection response (if any) and releases any pooled connections kept open by this http client (useful when a single http object is reused, e.g. through options.httpClient, to ensure idle keep-alive connections aren't left open).

Sources:

- js/owrap.obj.js:2308

<a id="api-ow-obj-http-exec-a0ff6b63"></a>

## ow.obj.http.exec

### ow.obj.http.exec(aURL, aRequestType, aIn, aRequestMap, isBytes, aTimeout, returnStream, options) : Object

Executes a request to aURL with the provided aRequestType, aIn, aRequestMap, isBytes, aTimeout and returnStream. Optionally you can provide options. Returns a map with the response code, the content type and the response.

Sources:

- js/owrap.obj.js:2004

<a id="api-ow-obj-http-get-5c19ae05"></a>

## ow.obj.http.get

### ow.obj.http.get(aURL, aIn, aRequestMap, isBytes, aTimeout, returnStream, options) : Object

Executes a GET request to aURL with the provided aIn, aRequestMap, isBytes, aTimeout and returnStream. Optionally you can provide options. Returns a map with the response code, the content type and the response.

Sources:

- js/owrap.obj.js:2117

<a id="api-ow-obj-http-getbytes-f1fa4935"></a>

## ow.obj.http.getBytes

### ow.obj.http.getBytes(aURL, aIn, aRequestMap, aTimeout, options) : Object

Executes a GET request to aURL with the provided aIn, aRequestMap, aTimeout and options. Returns the response as bytes.

Sources:

- js/owrap.obj.js:2127

<a id="api-ow-obj-http-getcookiestore-45093339"></a>

## ow.obj.http.getCookieStore

### ow.obj.http.getCookieStore() : String

Returns the current cookie store name channel.

Sources:

- js/owrap.obj.js:1935

<a id="api-ow-obj-http-geterrorresponse-e8da6b8f"></a>

## ow.obj.http.getErrorResponse

### ow.obj.http.getErrorResponse(parseJson) : Object

Returns the response object with the response and responseBytes parsed as JSON if parseJson is true.

Sources:

- js/owrap.obj.js:2155

<a id="api-ow-obj-http-getresponse-0c571588"></a>

## ow.obj.http.getResponse

### ow.obj.http.getResponse() : Object

Returns the response object.

Sources:

- js/owrap.obj.js:2175

<a id="api-ow-obj-http-getstream-66907d6c"></a>

## ow.obj.http.getStream

### ow.obj.http.getStream(aURL, aIn, aRequestMap, aTimeout, options) : Object

Executes a GET request to aURL with the provided aIn, aRequestMap, aTimeout and options. Returns the response as a stream.

Sources:

- js/owrap.obj.js:2136

<a id="api-ow-obj-http-head-bef42887"></a>

## ow.obj.http.head

### ow.obj.http.head(aURL, aIn, aRequestMap, isBytes, aTimeout) : Map

Executes a HEAD request to aURL with the provided aIn, aRequestMap, isBytes and aTimeout. Returns a map with the response headers.

Sources:

- js/owrap.obj.js:1915

<a id="api-ow-obj-http-login-3f5d20de"></a>

## ow.obj.http.login

### ow.obj.http.login(aUser, aPassword, forceBasic, urlPartial)

Sets the login credentials to be used with the next request. If forceBasic is true it will always use basic authentication.

Sources:

- js/owrap.obj.js:2184

<a id="api-ow-obj-http-post-e7b58547"></a>

## ow.obj.http.post

### ow.obj.http.post(aURL, aIn, aRequestMap, isBytes, aTimeout, returnStream, options) : Object

Executes a POST request to aURL with the provided aIn, aRequestMap, isBytes, aTimeout and returnStream. Optionally you can provide options. Returns a map with the response code, the content type and the response.

Sources:

- js/owrap.obj.js:2145

<a id="api-ow-obj-http-response-c972c98b"></a>

## ow.obj.http.response

### ow.obj.http.response() : String

Returns the response as a string.

Sources:

- js/owrap.obj.js:2234

<a id="api-ow-obj-http-responsebytes-3a92266e"></a>

## ow.obj.http.responseBytes

### ow.obj.http.responseBytes() : Object

Returns the response as bytes.

Sources:

- js/owrap.obj.js:2247

<a id="api-ow-obj-http-responsecode-299b590d"></a>

## ow.obj.http.responseCode

### ow.obj.http.responseCode() : Number

Returns the response code.

Sources:

- js/owrap.obj.js:2260

<a id="api-ow-obj-http-responseheaders-ba55a47a"></a>

## ow.obj.http.responseHeaders

### ow.obj.http.responseHeaders() : Map

Returns the response headers.

Sources:

- js/owrap.obj.js:2271

<a id="api-ow-obj-http-responsestream-ea260222"></a>

## ow.obj.http.responseStream

### ow.obj.http.responseStream() : Object

Returns the response as a stream.

Sources:

- js/owrap.obj.js:2285

<a id="api-ow-obj-http-responsetype-f01468ab"></a>

## ow.obj.http.responseType

### ow.obj.http.responseType() : String

Returns the response content type.

Sources:

- js/owrap.obj.js:2297

<a id="api-ow-obj-http-setcookiestore-75283501"></a>

## ow.obj.http.setCookieStore

### ow.obj.http.setCookieStore(aCh)

Sets the cookie store channel to be used with the current http object.

Sources:

- js/owrap.obj.js:1944

<a id="api-ow-obj-http-setthrowexceptions-edfb71ea"></a>

## ow.obj.http.setThrowExceptions

### ow.obj.http.setThrowExceptions(should)

Sets if the http object should throw exceptions or not.

Sources:

- js/owrap.obj.js:1925

<a id="api-ow-obj-http-upload-f22bf09b"></a>

## ow.obj.http.upload

### ow.obj.http.upload(aName, aFile)

Sets the file to be uploaded with the next request.

Sources:

- js/owrap.obj.js:1902

