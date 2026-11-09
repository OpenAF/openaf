# $rest

[Home](../index.md) / [All APIs](../all-apis.md) / [$rest](index.md)

<a id="api-rest-delete-f94ed331"></a>

## $rest.delete

### $rest.delete(aBaseURI, aIdxMap) : Map

Shortcut for ow.obj.rest.jsonRemove (see help ow.obj.rest.jsonRemove) using aOptions ($rest(aOptions).): login (function or string),  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object), default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available)  and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).

Sources:

- js/openaf.js:9188

<a id="api-rest-delete2file-76721f15"></a>

## $rest.delete2File

### $rest.delete2File(aFilePath, aBaseURI, aIdxMap)

Shortcut for ow.obj.rest.jsonRemove (see help ow.obj.rest.jsonRemove) using aOptions ($rest(aOptions).): login (function or string),  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object), default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available)  and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms). The byte output will be saved into aFilePath. Optional $rest(aOptions.downloadResume = true) will resume download of a file if it exists.

Sources:

- js/openaf.js:9216

<a id="api-rest-delete2stream-729f5a36"></a>

## $rest.delete2Stream

### $rest.delete2Stream(aBaseURI, aIdxMap) : JavaStream

Shortcut for ow.obj.rest.jsonRemove (see help ow.obj.rest.jsonRemove) using aOptions ($rest(aOptions).): login (function or string),  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object), default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available)  and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).

Sources:

- js/openaf.js:9202

<a id="api-rest-get-bf35c8ab"></a>

## $rest.get

### $rest.get(aBaseURI, aIdxMap) : Map

Shortcut for ow.obj.rest.jsonGet (see help ow.obj.rest.jsonGet) using aOptions ($rest(aOptions).): login (function or string),  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object), default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available)  and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).

Sources:

- js/openaf.js:8985

<a id="api-rest-get2file-392a4064"></a>

## $rest.get2File

### $rest.get2File(aFilePath, aBaseURI, aIdxMap)

Shortcut for ow.obj.rest.jsonGet (see help ow.obj.rest.jsonGet) using aOptions ($rest(aOptions).): login (function or string),  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object), default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available)  and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms). The byte output will be saved into aFilePath. Optional $rest(aOptions.downloadResume = true) will resume download of a file if it exists.

Sources:

- js/openaf.js:9013

<a id="api-rest-get2stream-6f64dbc2"></a>

## $rest.get2Stream

### $rest.get2Stream(aBaseURI, aIdxMap) : JavaStream

Shortcut for ow.obj.rest.jsonGet (see help ow.obj.rest.jsonGet) using aOptions ($rest(aOptions).): login (function or string),  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object), default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available)  and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).

Sources:

- js/openaf.js:8999

<a id="api-rest-head-4024f956"></a>

## $rest.head

### $rest.head(aBaseURI, aIdxMap)

Shortcut for ow.obj.rest.head (see help ow.obj.rest.head) using aOptions ($rest(aOptions).): login (function or string),  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object), default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available)  and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and returns a map with changes (aBaseURL, aIdxMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).

Sources:

- js/openaf.js:9314

<a id="api-rest-index-fd93b41a"></a>

## $rest.index

### $rest.index(aMap) : String

Shortcut for ow.obj.rest.writeIndexes (see help ow.obj.rest.writeIndexes).

Sources:

- js/openaf.js:9337

<a id="api-rest-patch-d727eb19"></a>

## $rest.patch

### $rest.patch(aBaseURI, aDataRowMap, aIdxMap) : Map

Shortcut for ow.obj.rest.jsonPatch (see help ow.obj.rest.jsonPatch) using aOptions ($rest(aOptions).): login (function or string),  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object), default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available)  and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).

Sources:

- js/openaf.js:9237

<a id="api-rest-patch2file-f259c015"></a>

## $rest.patch2File

### $rest.patch2File(aFilePath, aBaseURI, aDataRowMap, aIdxMap)

Shortcut for ow.obj.rest.jsonPatch (see help ow.obj.rest.jsonPatch) using aOptions ($rest(aOptions).): login (function or string),  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object), default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available)  and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).  The byte output will be saved into aFilePath. Optional $rest(aOptions.downloadResume = true) will resume download of a file if it exists.

Sources:

- js/openaf.js:9293

<a id="api-rest-patch2stream-f64d142a"></a>

## $rest.patch2Stream

### $rest.patch2Stream(aBaseURI, aDataRowMap, aIdxMap) : JavaStream

Shortcut for ow.obj.rest.jsonPatch (see help ow.obj.rest.jsonPatch) using aOptions ($rest(aOptions).): login (function or string),  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object), default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available)  and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).

Sources:

- js/openaf.js:9251

<a id="api-rest-patchupload-5b510f07"></a>

## $rest.patchUpload

### $rest.patchUpload(aBaseURI, aDataRowMap, aIdxMap) : Map

Shortcut for ow.obj.rest.upload (see help ow.obj.rest.upload with patch) using aOptions ($rest(aOptions).): login (function or string),  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object), default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available)  and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).

Sources:

- js/openaf.js:9265

<a id="api-rest-patchupload2stream-86c5c817"></a>

## $rest.patchUpload2Stream

### $rest.patchUpload2Stream(aBaseURI, aDataRowMap, aIdxMap) : JavaStream

Shortcut for ow.obj.rest.upload (see help ow.obj.rest.upload with patch) using aOptions ($rest(aOptions).): login (function or string),  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object), default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available)  and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).

Sources:

- js/openaf.js:9279

<a id="api-rest-post-1029acb0"></a>

## $rest.post

### $rest.post(aBaseURI, aDataRowMap, aIdxMap) : Map

Shortcut for ow.obj.rest.jsonCreate (see help ow.obj.rest.jsonCreate) using aOptions ($rest(aOptions).): login (function or string),  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object), default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available)  and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).

Sources:

- js/openaf.js:9034

<a id="api-rest-post2file-29871401"></a>

## $rest.post2File

### $rest.post2File(aFilePath, aBaseURI, aDataRowMap, aIdxMap)

Shortcut for ow.obj.rest.jsonCreate (see help ow.obj.rest.jsonCreate) using aOptions ($rest(aOptions).): login (function or string),  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object), default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available)  and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms). The byte output will be saved into aFilePath. Optional $rest(aOptions.downloadResume = true) will resume download of a file if it exists.

Sources:

- js/openaf.js:9090

<a id="api-rest-post2stream-10de01c2"></a>

## $rest.post2Stream

### $rest.post2Stream(aBaseURI, aDataRowMap, aIdxMap) : JavaStream

Shortcut for ow.obj.rest.jsonCreate (see help ow.obj.rest.jsonCreate) using aOptions ($rest(aOptions).): login (function or string),  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object), default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available)  and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).

Sources:

- js/openaf.js:9048

<a id="api-rest-postupload-fd64594b"></a>

## $rest.postUpload

### $rest.postUpload(aBaseURI, aDataRowMap, aIdxMap) : Map

Shortcut for ow.obj.rest.upload (see help ow.obj.rest.upload with post) using aOptions ($rest(aOptions).): login (function or string),  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object), default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available)  and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).

Sources:

- js/openaf.js:9062

<a id="api-rest-postupload2stream-2b8ff859"></a>

## $rest.postUpload2Stream

### $rest.postUpload2Stream(aBaseURI, aDataRowMap, aIdxMap) : JavaStream

Shortcut for ow.obj.rest.upload (see help ow.obj.rest.upload with post) using aOptions ($rest(aOptions).): login (function or string),  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object), default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available)  and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).

Sources:

- js/openaf.js:9076

<a id="api-rest-put-129580ea"></a>

## $rest.put

### $rest.put(aBaseURI, aDataRowMap, aIdxMap) : Map

Shortcut for ow.obj.rest.jsonSet (see help ow.obj.rest.jsonSet) using aOptions ($rest(aOptions).): login (function or string),  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object), default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available)  and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).

Sources:

- js/openaf.js:9111

<a id="api-rest-put2file-c342bd6f"></a>

## $rest.put2File

### $rest.put2File(aFilePath, aBaseURI, aDataRowMap, aIdxMap)

Shortcut for ow.obj.rest.jsonSet (see help ow.obj.rest.jsonSet) using aOptions ($rest(aOptions).): login (function or string),  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object), default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available)  and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms). The byte output will be saved into aFilePath. Optional $rest(aOptions.downloadResume = true) will resume download of a file if it exists.

Sources:

- js/openaf.js:9167

<a id="api-rest-put2stream-e3b7c564"></a>

## $rest.put2Stream

### $rest.put2Stream(aBaseURI, aDataRowMap, aIdxMap) : JavaStream

Shortcut for ow.obj.rest.jsonSet (see help ow.obj.rest.jsonSet) using aOptions ($rest(aOptions).): login (function or string),  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object), default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available)  and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).

Sources:

- js/openaf.js:9125

<a id="api-rest-putupload-7c69bb76"></a>

## $rest.putUpload

### $rest.putUpload(aBaseURI, aDataRowMap, aIdxMap) : Map

Shortcut for ow.obj.rest.upload (see help ow.obj.rest.upload with put) using aOptions ($rest(aOptions).): login (function or string),  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object), default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available)  and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).

Sources:

- js/openaf.js:9139

<a id="api-rest-putupload2stream-20bbb7f5"></a>

## $rest.putUpload2Stream

### $rest.putUpload2Stream(aBaseURI, aDataRowMap, aIdxMap) : JavaStream

Shortcut for ow.obj.rest.upload (see help ow.obj.rest.upload with post) using aOptions ($rest(aOptions).): login (function or string),  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object), default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available)  and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).

Sources:

- js/openaf.js:9153

<a id="api-rest-query-df597796"></a>

## $rest.query

### $rest.query(aMap) : String

Shortcut for ow.obj.rest.writeQuery (see help ow.obj.rest.writeQuery).

Sources:

- js/openaf.js:9328

