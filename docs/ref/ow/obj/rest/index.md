# ow.obj.rest

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.obj](../index.md) / [ow.obj.rest](index.md)

<a id="api-ow-obj-rest-create-1622c82d"></a>

## ow.obj.rest.create

### ow.obj.rest.create(aBaseURI, aIndexMap, aDataRowMap, aLoginOrFunction, aPassword, aTimeout, aRequestMap, urlEncode, aHTTP, retBytes, options) : String

Tries to create a new aDataRowMap entry, identified by aIndexMap, on the REST aBaseURI service returning the reply as a string (uses the HTTP POST method). Optionally you can provide aLogin, aPassword and/or aTimeout for the REST request or use a function (aLoginOrFunction) that receives the HTTP object. If urlEncode=true the aDataRowMap will be converted into x-www-form-urlencoded instead of JSON. Optionally if retBytes = true returns a java stream.

Sources:

- js/owrap.obj.js:2760

<a id="api-ow-obj-rest-exceptionparse-c79e1899"></a>

## ow.obj.rest.exceptionParse

### ow.obj.rest.exceptionParse(anException) : Map

Tries to parse the response of a rest call exception and the response also if it's json.

Sources:

- js/owrap.obj.js:2656

<a id="api-ow-obj-rest-get-e9ce6f5f"></a>

## ow.obj.rest.get

### ow.obj.rest.get(aBaseURI, aIndexMap, aLoginOrFunction, aPassword, aTimeout, aRequestMap, aHTTP, retBytes, options) : String

Tries to obtain aIndexMap from the REST aBaseURI service returning as a string (uses the HTTP GET method). Optionally you can provide aLogin, aPassword and/or aTimeout for the REST request or use a function (aLoginOrFunction) that receives the HTTP object. Optionally if retBytes = true returns a java stream.

Sources:

- js/owrap.obj.js:2708

<a id="api-ow-obj-rest-getcontentlength-ee80880d"></a>

## ow.obj.rest.getContentLength

### ow.obj.rest.getContentLength(aBaseURI, aLoginOrFunction, aPassword, aTimeout, aRequestMap, aHTTP) : Number

Tries to get the content lenght for the given aBaseURI. Optionally you can provide aLogin, aPassword and/or aTimeout for the HTTP request or use a function (aLoginOrFunction) that receives the HTTP object.

Sources:

- js/owrap.obj.js:2669

<a id="api-ow-obj-rest-head-84c50706"></a>

## ow.obj.rest.head

### ow.obj.rest.head(aBaseURI, aIndexMap, aLoginOrFunction, aPassword, aTimeout, aRequestMap, aHTTP, options) : Map

Tries to get the header map with aIndexMap entry from the REST aBaseURI service returning the reply as a Map. Optionally you can provide aLogin, aPassword and/or aTimeout for the REST request or use a function (aLoginOrFunction) that receives the HTTP object.

Sources:

- js/owrap.obj.js:3042

<a id="api-ow-obj-rest-jsoncreate-5a01b34c"></a>

## ow.obj.rest.jsonCreate

### ow.obj.rest.jsonCreate(aBaseURI, aIndexMap, aDataRowMap, aLoginOrFunction, aPassword, aTimeout, aRequestMap, urlEncode, aHTTP, retBytes, options) : Map

Tries to create a new aDataRowMap entry, identified by aIndexMap, on the REST aBaseURI service returning the reply as a map (uses the HTTP POST method). Optionally you can provide aLogin, aPassword and/or aTimeout for the REST request or use a function (aLoginOrFunction) that receives the HTTP object.  If urlEncode=true the aDataRowMap will be converted into x-www-form-urlencoded instead of JSON. Optionally if retBytes = true returns a java stream.

Sources:

- js/owrap.obj.js:2865

<a id="api-ow-obj-rest-jsonget-4f568895"></a>

## ow.obj.rest.jsonGet

### ow.obj.rest.jsonGet(aBaseURI, aIndexMap, aLoginOrFunction, aPassword, aTimeout, aRequestMap, aHTTP, retBytes, options) : Map

Tries to obtain aIndexMap from the REST aBaseURI service returning as a map (uses the HTTP GET method). Optionally you can provide aLogin, aPassword and/or aTimeout for the REST request or use a function (aLoginOrFunction) that receives the HTTP object. Optionally if retBytes = true returns a java stream.

Sources:

- js/owrap.obj.js:2748

<a id="api-ow-obj-rest-jsonpatch-28b3eb17"></a>

## ow.obj.rest.jsonPatch

### ow.obj.rest.jsonPatch(aBaseURI, aIndexMap, aDataRowMap, aLoginOrFunction, aPassword, aTimeout, urlEncode, aHTTP, retBytes, options) : Map

Tries to set aDataRowMap entry, identified by aIndexMap, on the REST aBaseURI service returning the reply as a map (uses the HTTP PATCH method). Optionally you can provide aLogin, aPassword and/or aTimeout for the REST request or use a function (aLoginOrFunction) that receives the HTTP object. If urlEncode=true the aDataRowMap will be converted into x-www-form-urlencoded instead of JSON. Optionally if retBytes = true returns a java stream.

Sources:

- js/owrap.obj.js:2980

<a id="api-ow-obj-rest-jsonremove-d23958bf"></a>

## ow.obj.rest.jsonRemove

### ow.obj.rest.jsonRemove(aBaseURI, aIndexMap, aLoginOrFunction, aPassword, aTimeout, aRequestMap, aHTTP, retBytes, options) : Map

Tries to remove aIndexMap entry from the REST aBaseURI service returning the reply as a map (uses the HTTP DELETE method). Optionally you can provide aLogin, aPassword and/or aTimeout for the REST request or use a function (aLoginOrFunction) that receives the HTTP object. Optionally if retBytes = true returns a java stream.

Sources:

- js/owrap.obj.js:3031

<a id="api-ow-obj-rest-jsonset-b89fdb21"></a>

## ow.obj.rest.jsonSet

### ow.obj.rest.jsonSet(aBaseURI, aIndexMap, aDataRowMap, aLoginOrFunction, aPassword, aTimeout, urlEncode, aHTTP, retBytes, options) : Map

Tries to set aDataRowMap entry, identified by aIndexMap, on the REST aBaseURI service returning the reply as a map (uses the HTTP PUT method). Optionally you can provide aLogin, aPassword and/or aTimeout for the REST request or use a function (aLoginOrFunction) that receives the HTTP object. If urlEncode=true the aDataRowMap will be converted into x-www-form-urlencoded instead of JSON. Optionally if retBytes = true returns a java stream.

Sources:

- js/owrap.obj.js:2923

<a id="api-ow-obj-rest-jsonupload-8723e851"></a>

## ow.obj.rest.jsonUpload

### ow.obj.rest.jsonUpload(aBaseURI, aIndexMap, aDataRowMap, aLoginOrFunction, aPassword, aTimeout, aRequestMap, urlEncode, aHTTP, retBytes, aMethod, options) : String

Tries to upload a new aDataRowMap entry (composed of name and in (a filename, a stream or an array of bytes)), identified by aIndexMap, on the REST aBaseURI service returning the reply as a map (uses the HTTP POST method or aMethod). Optionally you can provide aLogin, aPassword and/or aTimeout for the REST request or use a function (aLoginOrFunction) that receives the HTTP object. Optionally if retBytes = true returns a java stream.

Sources:

- js/owrap.obj.js:2852

<a id="api-ow-obj-rest-patch-ca1007a5"></a>

## ow.obj.rest.patch

### ow.obj.rest.patch(aBaseURI, aIndexMap, aDataRowMap, aLoginOrFunction, aPassword, aTimeout, urlEncode, aHTTP, retBytes, options) : String

Tries to set aDataRowMap entry, identified by aIndexMap, on the REST aBaseURI service returning the reply as a string (uses the HTTP PATCH method). Optionally you can provide aLogin, aPassword and/or aTimeout for the REST request or use a function (aLoginOrFunction) that receives the HTTP object. If urlEncode=true the aDataRowMap will be converted into x-www-form-urlencoded instead of JSON. Optionally if retBytes = true returns a java stream.

Sources:

- js/owrap.obj.js:2936

<a id="api-ow-obj-rest-remove-2f51799d"></a>

## ow.obj.rest.remove

### ow.obj.rest.remove(aBaseURI, aIndexMap, aLoginOrFunction, aPassword, aTimeout, aRequestMap, aHTTP, retBytes, options) : String

Tries to remove aIndexMap entry from the REST aBaseURI service returning the reply as a string (uses the HTTP DELETE method). Optionally you can provide aLogin, aPassword and/or aTimeout for the REST request or use a function (aLoginOrFunction) that receives the HTTP object. Optionally if retBytes = true returns a java stream.

Sources:

- js/owrap.obj.js:2992

<a id="api-ow-obj-rest-set-fba49026"></a>

## ow.obj.rest.set

### ow.obj.rest.set(aBaseURI, aIndexMap, aDataRowMap, aLoginOrFunction, aPassword, aTimeout, urlEncode, aHTTP, retBytes, options) : String

Tries to set aDataRowMap entry, identified by aIndexMap, on the REST aBaseURI service returning the reply as a string (uses the HTTP PUT method). Optionally you can provide aLogin, aPassword and/or aTimeout for the REST request or use a function (aLoginOrFunction) that receives the HTTP object. If urlEncode=true the aDataRowMap will be converted into x-www-form-urlencoded instead of JSON. Optionally if retBytes = true returns a java stream.

Sources:

- js/owrap.obj.js:2878

<a id="api-ow-obj-rest-upload-92fc6c13"></a>

## ow.obj.rest.upload

### ow.obj.rest.upload(aBaseURI, aIndexMap, aDataRowMap, aLoginOrFunction, aPassword, aTimeout, aRequestMap, urlEncode, aHTTP, retBytes, aMethod, options) : String

Tries to upload a new aDataRowMap entry (composed of name and in (a filename, a stream or an array of bytes)), identified by aIndexMap, on the REST aBaseURI service returning the reply as a string (uses the HTTP POST method or aMethod). Optionally you can provide aLogin, aPassword and/or aTimeout for the REST request or use a function (aLoginOrFunction) that receives the HTTP object. Optionally if retBytes = true returns a java stream.

Sources:

- js/owrap.obj.js:2805

<a id="api-ow-obj-rest-writeindexes-0b508ebf"></a>

## ow.obj.rest.writeIndexes

### ow.obj.rest.writeIndexes(aPropsMap) : String

Given a map of REST API indexes (aPropsMap) will return a corresponding URI.

Sources:

- js/owrap.obj.js:3081

<a id="api-ow-obj-rest-writequery-c87d9b7f"></a>

## ow.obj.rest.writeQuery

### ow.obj.rest.writeQuery(aMap) : String

Given `aMap` will return a URL query string. Example:

```javascript
"http://some.thing/other/stuff?" + ow.obj.rest.writeQuery({ a: 1, b: 2 });
```

Sources:

- js/owrap.obj.js:3099

