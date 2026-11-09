# Globals

[Home](../index.md) / [All APIs](../all-apis.md) / [Globals](index.md)

<a id="api-from-bf69913f"></a>

## $$from

### $$from : Array

Shortcut for the JLinq library for easy query and access to arrays/objects. To see all the available options please refer to http://hugoware.net/Projects/jlinq and the list of available functions by executing, in the openaf-console: "desc $$from(&#91;&#93;)".

Sources:

- js/openaf.js:5283

<a id="api-a2m-5a59a8aa"></a>

## $a2m

### $a2m(aDef, aArray) : Array

Tries to convert `aArray` into a map using the `aDef` array of keys for the map keys' value assignment in the output map. Example:

```javascript
$a2m(['a', 'b', 'c'], [1, 2, 3])    // { a: 1, b: 2, c: 3 }
```

Sources:

- js/openaf.js:15026

<a id="api-a4m-7ca46bb3"></a>

## $a4m

### $a4m(anArray, aKey, dontRemove) : Array

Tries to create a map of maps from the provided `anArrays`. Optionally if `aKey` is provided
it will be used to create the map keys (otherwise will fallback to "row[number]"). And can also
optionally indicate by `dontRemove` = true that `aKey` shouldn't be removed from each map.

```javascript
var a = [
  { "abc": "123", "xpt": "000", "key": "A1" },
  { "abc": "456", "xpt": "001", "key": "A2" },
  { "abc": "789", "xpt": "002", "key": "A3" }
]

$a4m(a, "key");
// {
//   "A1": { "abc": "123", "xpt": "000" },
//   "A2": { "abc": "456", "xpt": "001" },
//   "A3": { "abc": "789", "xpt": "002" }
// }
```

Sources:

- js/openaf.js:14967

<a id="api-atomic-cc485bd3"></a>

## $atomic

### $atomic(aInitValue, aType) : Object

Creates an atomic object of `aType` (defaults to long) to be get/set atomically on a multithreading script initialized with `aInitValue`.
`aType` can be "int", "long" and "boolean". Each with different methods:

- `int.dec`: Decrement an integer
- `int.inc`: Increment an integer
- `int.get`: Get the current integer
- `int.getSet(n)`: Get and Set the current integer
- `int.getAdd(n)`: Get and Add to the current integer
- `int.setIf(t, n)`: Set the current integer to n if current value is t
- `int.set`: Set the current integer

- `long.dec`: Decrement an long
- `long.inc`: Increment an long
- `long.get`: Get the current long
- `long.getSet(n)`: Get and Set the current long
- `long.getAdd(n)`: Get and Add to the current long
- `long.setIf(t, n)`: Set the current long to n if current value is t
- `long.set`: Set the current long

- `boolean.get`: Get the current boolean
- `boolean.set`: Set the current boolean
- `boolean.getSet`: Get and Set the current boolean
- `boolean.setIf(t, n)`: Set the current boolean to n if current value is t

Sources:

- js/openaf.js:16354

<a id="api-await-a5b9c25f"></a>

## $await

### $await(aName) : Object

Wrapper around the Java wait/notify mechanism. For the provided name will returen an object with the following  functions wait (will block until a notify is invoked), notify (will notify and unblock one of the wait invocations),  notifyAll (will notify and unblock all wait invocations) and destroy existing references to aName.

Sources:

- js/openaf.js:16749

<a id="api-ch-98a1b084"></a>

## $ch

### $ch(aChannel)

Please check more details with the help from `ow.ch`. The available methods are:

Channel basics:

- `create(shouldCompress, aType, options)`
- `list()`
- `destroy()`
- `size()`
- `subscribe(aFunction, onlyFromNow, anId)`
- `unsubscribe(aId)`
- `forEach(aFunction)`
- `getAll()`
- `getKeys(fullInfo)`
- `getSortedKeys(fullInfo)`
- `set(aKey, aValue, aForcedTimestamp)`
- `setAll(keysArray, valuesArray, aForcedTimestamp)`
- `get(aKey)`
- `getSet(aMatch, aKey, aValue, aForcedTimestamp)`
- `unset(aKey, aForcedTimestamp)`
- `push(aKey, aValue)`
- `pop(aKey)`
- `shift(aKey)`
- `stopJobs()`
- `waitForJobs(aTimeout)`
- `getName()`

Channel basic persistence:

- `storeAdd(aFilename, anArrayOfKeys, shouldCompress)`
- `storeRestore(aFilename, anArrayOfKeys)`

Inter-channel HTTP REST:

- `expose(aLocalPortOrServer, aPath, aAuthFunc, aUnAuthFunc)`
- `peer(aLocalPortOrServer, aPath, aRemoteURL, aAuthFunc, aUnAuthFunc)`
- `unpeer(aRemoteURL)`
- `createRemote(aURL, aTimeout)`

Sources:

- js/openaf.js:15652

<a id="api-channels-efe21d2e"></a>

## $channels

### $channels(aChannel)

Please check more details with the help from `ow.ch`. The available methods are:

Channel basics:

- `create(shouldCompress, aType, options)`
- `list()`
- `destroy()`
- `size()`
- `subscribe(aFunction, onlyFromNow, anId)`
- `unsubscribe(aId)`
- `forEach(aFunction)`
- `getAll(fullInfo)`
- `getKeys(fullInfo)`
- `getSortedKeys(fullInfo)`
- `set(aKey, aValue, aForcedTimestamp)`
- `setAll(keysArray, valuesArray, aForcedTimestamp)`
- `unsetAll(keysArray, valuesArray, aForcedTimestamp)`
- `get(aKey)`
- `getSet(aMatch, aKey, aValue, aForcedTimestamp)`
- `unset(aKey, aForcedTimestamp)`
- `push(aKey, aValue)`
- `pop(aKey)`
- `shift(aKey)`
- `stopJobs()`
- `waitForJobs(aTimeout)`
- `getName()`

Channel basic persistence:

- `storeAdd(aFilename, anArrayOfKeys, shouldCompress, runSubscribersForAll)`
- `storeRestore(aFilename, anArrayOfKeys)`

Inter-channel HTTP REST:

- `expose(aLocalPortOrServer, aPath, aLogin, aPassword)`
- `peer(aLocalPortOrServer, aPath, aRemoteURL, aAuthFunc, aUnAuthFunc, aMaxTime, aMaxCount)`
- `unpeer(aRemoteURL)`
- `createRemote(aURL, aTimeout, aLogin, aPass)`

Sources:

- js/openaf.js:15537

<a id="api-csv-2b66fcda"></a>

## $csv

### $csv(aMap) : $csv

Provides a shortcut to access CSV functionality. Optionally you can provide options through `aMap`.

Examples:

```javascript
$csv().fromInArray(anArray)
$csv().fromInFile("test.csv").toOutArray()
$csv().fromInFile("test.csv").toOutFn(m => print( af.toSLON(m) ))
$csv().fromInString( $csv().fromInArray( io.listFiles(".").files ) ).toOutArray()
```

Sources:

- js/openaf.js:17839

<a id="api-do-426a9998"></a>

## $do

### $do(aFunction, aRejFunction) : oPromise

Instantiates and returns a oPromise. If you provide aFunction, this aFunction will be executed async in a thread and oPromise object will be immediatelly returned. Optionally this aFunction can receive a resolve and reject functions for to you use inside aFunction to provide a result with resolve(aResult) or an exception with reject(aReason). If you don't call theses functions the returned value will be used for resolve or any exception thrown will be use for reject. You can use the "then" method to add more aFunction that will execute once the previous as executed successfully (in a stack fashion). The return/resolve value from the previous function will be passed as the value for the second. You can use the "catch" method to add aFunction that will receive a string or exception for any exception thrown with the reject functions. You can also provide aRejFunction to work as a "catch" method as previously described before. The returned oPromise also exposes a cancel method to interrupt the corresponding running thread (similar to the Threads plugin capabilities) and reject the promise chain.

Sources:

- js/openaf.js:16847

<a id="api-doa2b-872aa422"></a>

## $doA2B

### $doA2B(aAFunction, aBFunction, numberOfDoPromises, defaultTimeout, aErrorFunction, useVirtualThreads)

Will call aAFunction with a function as argument that should be used to "send" values to aBFunction. aBFunction will be call asynchronously in individual $do up to the numberOfDoPromises limit. The defaultTimeout it 2500ms. If aErrorFunction is defined it will received any exceptions thrown from aBFunction with the corresponding arguments array. If useVirtualThreads is true it will use virtual threads to execute aBFunction. If useVirtualThreads is false (default) it will use the thread pool. Use virtual threads if you want to execute aBFunction without blocking the current thread (IO bound operations / high concurrency).

Sources:

- js/openaf.js:16788

<a id="api-doall-f50c55aa"></a>

## $doAll

### $doAll(anArray) : oPromise

Returns an oPromise that will be resolved when all oPromise part of the anArray are fullfiled. If any of the oPromises fails/rejects the returned oPromise will also be rejected/fail.

Sources:

- js/openaf.js:16879

<a id="api-dofirst-6e3ae5c8"></a>

## $doFirst

### $doFirst(anArray) : oPromise

Returns an oPromise that will be resolved when any oPromise part of the anArray is fullfiled. If any of the oPromises fails/rejects the returned oPromise will also be rejected/fail.

Sources:

- js/openaf.js:16890

<a id="api-dov-e673d541"></a>

## $doV

### $doV(aFunction, aRejFunction) : oPromise

Equivalent to $do but using virtual threads (if available) to execute the aFunction. This will allow the aFunction to be executed without blocking the current thread. If aFunction is not provided it will return a new oPromise that will be resolved when the first executor is added to it. If aRejFunction is provided it will be used as a "catch" method for the oPromise. The returned oPromise also exposes a cancel method to interrupt the corresponding running thread (similar to the Threads plugin capabilities) and reject the promise chain.

Sources:

- js/openaf.js:16865

<a id="api-dowait-16fbe1be"></a>

## $doWait

### $doWait(aPromise, aWaitTimeout) : oPromise

Blocks until aPromise is fullfilled or rejected. Optionally you can specify aWaitTimeout, in milliseconds, as an overall deadline for the wait: once it elapses $doWait returns even if aPromise hasn't settled yet (the caller is then responsible for checking aPromise's state and, if still pending, cancelling it to reclaim the thread pool slot). Returns aPromise.

Sources:

- js/openaf.js:16901

<a id="api-err-4a701167"></a>

## $err

### $err(exception, rethrow, returnStr, code)

Prints the exception stack trace and the code where it was thrown. If rethrow is true it will throw the exception again. If returnStr is true it will return the string instead of printing it.

Sources:

- js/openaf.js:18409

<a id="api-f-dda9a73f"></a>

## $f

### $f(aString, arg1, arg2, ...) : String

Formats `aString` with `arg1`, `arg2` and any other arguments provided using java.util.Formatter. The format is composed
of "%[argument_index$][flags][width][.precision]conversion". Do note that javascript numbers are converted to java.lang.Float. If you
need it to convert to Integer, Long, Double, Float and BigDecimal please use `$ft`. The javascript Date type will be converted to java Calendar.
So possible values:

argument_index: number

- `flags`: '-' (left-justified); '#'; '+' (include sign); ' ' (leading space); '0' (zero-padded); ',' (separators); '(' (enclose negative values)
- `conversion`: b/B (boolean), h/H (hash), s/S (string), "-" (left justify), c/C (character)

Examples:

```javascript
$f("Time %tT", new Date())
$f("Date: %1$tm %1te, %1tY %1$tT", new Date())

$f("%.2f", 1.9)
$f("%10.2f", 1.9)
```

Sources:

- js/openaf.js:11962

<a id="api-fetch-1c5d5182"></a>

## $fetch

### $fetch(aURL, aOptions) : oPromise

Tries to fetch `aURL` using the provided `aOptions` (a map with the following possible keys: method, body, headers, requestHeaders, downloadResume,
connectionTimeout, uriQuery, urlEncode, login, pass, httpClient and retry). The method will return a promise that will resolve to a response object
with the following methods: body, bodyUsed, headers, ok, status, json, bytes, blob and text. Example:

```javascript
var response = $fetch("https://httpbin.org/post", { method: "POST", body: { a: 1, b: 2 }, headers: { "Content-Type": "application/json" } });
response.then(function(aResponse) { print(aResponse.status); });
```

The response object will have the following methods:

- `body()`: returns a Java InputStream with the response body
- `bodyUsed`: returns true if the body was already read
- `headers`: returns a map with the response headers
- `ok`: returns true if the response status is between 200 and 299
- `status`: returns the response status
- `json()`: returns the response body as a JSON object
- `bytes()`: returns the response body as a byte array
- `blob()`: returns the response body as a byte array
- `text()`: returns the response body as a string

Sources:

- js/openaf.js:11780

<a id="api-fndef4help-0ef65d24"></a>

## $fnDef4Help

### $fnDef4Help(aFnName) : Array

Tries to retrieve an array of function argument names for the provided search string aFnName.

Sources:

- js/openaf.js:14888

<a id="api-fnm-b366d0ce"></a>

## $fnM

### $fnM(aFnName, aMap) : Object

Calls `aFnName` function trying to determine the name of the arguments from OpenAF's help or accessible source code (throws an exception
if it can't determine the arguments) and then builds the arguments used to call `aFnName` using the values of keys in `aMap`. Example:

```javascript
plugin("HTTP"); var h = new HTTP();
$fnM("h.get", { aUrl: "https://openaf.io/release" });
```

Sources:

- js/openaf.js:15071

<a id="api-fnm2a-853209a9"></a>

## $fnM2A

### $fnM2A(aFn, aInstance, aDefinitionArray, aMap) : Object

Tries to execute `aFn`, with `aInstance` if it's a function of an instance, using `aMap` of arguments that translate to `aFn` list of
arguments. Returns whatever the function executed returns. Example:

```javascript
plugin("HTTP");
var h = new HTTP();
$fnM2A(h.get, h, $fnDef4Help("HTTP.get"), { aUrl: "https://openaf.io/build", isBytes: false, returnStream: false });
```

Sources:

- js/openaf.js:15049

<a id="api-from-8cb42383"></a>

## $from

### $from : Array

Shortcut for the nLinq library for easy query and access to arrays/objects. To see all the available options please refer to https://github.com/nmaguiar/nLinq/blob/main/Reference.md and the list of available functions by executing, in the openaf-console: "desc $from(&#91;&#93;)".

Sources:

- js/openaf.js:5306

<a id="api-ft-9bee62bb"></a>

## $ft

### $ft(aString, arg1, arg2, ...) : String

Equivalant to $f but number types are converted to Integer, Long, Double, Float and BigDecimal.

Sources:

- js/openaf.js:12008

<a id="api-get-c8ba9242"></a>

## $get

### $get(aKey) : Object

Returns a value previously set with $set with aKey.

Sources:

- js/openaf.js:18012

<a id="api-gpt-903f1f26"></a>

## $gpt

### $gpt(aModel) : $gpt

Creates a GPT AI model from `aModel` (e.g. type "openai", "gemini", "ollama" or "anthropic").

`aModel` can be a map with the following properties:

- `type`: the type of the model (e.g. "openai", "ollama", "anthropic")
- `options`: a map with the options for the model (e.g. { key: "your-api-key", model: "gpt-3.5-turbo", temperature: 0.7, url: "https://api.openai.com/" })
- `conversation`: an array of messages to start the conversation (e.g. [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello!" }])
- `tools`: a map with the tools to use in the conversation (e.g. { "tool1": { type: "function", function: { name: "tool1", description: "A tool that does something", parameters: { type: "object", properties: { param1: { type: "string" } } } }, fn: function(args) { return args.param1; } } })
- `timeout`: the timeout for the requests in milliseconds (defaults to 15 minutes)
- `noSystem`: if true, it will not output the system messages (defaults to true)
- `instructions`: a string or an array of strings with the instructions for the model (e.g. "json", "boolean", "sql", "js", "path")
- `headers`: a map with the headers to use in the requests (e.g. { "Content-Type": "application/json" })
- `params`: a map with the parameters to use in the requests (e.g. { "max_tokens": 1000, "top_p": 1, "frequency_penalty": 0, "presence_penalty": 0 })
- `promptCaching`: when true adds Anthropic cache_control markers; no prompt-caching beta header is required (defaults to false)

For type "openai", options can also include:

- `decisionApi`: native decision contract ("openai" default, "openrouter", or "microsoft"). Microsoft requires mode "foundry" or "azure-foundry", API v1 and an explicit deployment name in model.
- `decisionUrl`: optional absolute HTTP(S) native decision endpoint override.
- `mode`: transport mode ("openai", "azure-openai-v1", "azure-openai-legacy" or "foundry").
- `apiVersion`: OpenAI-compatible API version path segment, or Azure legacy api-version query parameter. In Foundry mode, "v1" uses the /openai/v1 path; dated versions use the /models route with api-version. Defaults to "v1".
- `deployment`: Azure OpenAI legacy deployment name; defaults to model when omitted.
- `authType`: generated authentication header style ("bearer", "api-key" or "none"). Defaults to "bearer" for OpenAI mode and "api-key" for Azure/Foundry modes.

OpenAI-compatible examples:

- { type: "openai", key: "sk-...", url: "https://api.openai.com/v1", model: "gpt-4o-mini" }
- { type: "openai", key: "...", url: "https://RESOURCE.openai.azure.com", mode: "azure-openai-v1", model: "DEPLOYMENT" }
- { type: "openai", key: "...", url: "https://RESOURCE.openai.azure.com", mode: "azure-openai-legacy", deployment: "DEPLOYMENT", apiVersion: "2024-10-21" }
- { type: "openai", key: "...", url: "https://RESOURCE.services.ai.azure.com", mode: "foundry", model: "DEPLOYMENT" }
- { type: "openai", key: "...", url: "https://RESOURCE.services.ai.azure.com/models", mode: "foundry", apiVersion: "2024-05-01-preview", model: "DEPLOYMENT" }

If `aModel` is not provided, it will try to get the model from the environment variable "OAF_MODEL" with the map in JSON or SLON format.

The returned object also exposes helper methods to inspect vendor usage information: `getLastStats`/`lastStats` (map with the latest statistics), `promptWithStats`,
`promptJSONWithStats` and `rawPromptWithStats` (returning `{ response, stats }`). OpenAI compatible models can expose cached prompt tokens via `stats.tokens.cached`.

Sources:

- js/owrap.ai.js:5193

<a id="api-job-9d2abfe7"></a>

## $job

### $job(aJob, args, aId, isolate) : Object

Shortcut to oJobRunJob and ow.oJob.runJob to execute aJob with args and returned the changed arguments. Optionally aId can be also provided. If isolate=true it will also clean the key 'res' and try to return the result of ow.oJob.output.

Sources:

- js/openaf.js:12618

<a id="api-jq-da82c766"></a>

## $jq

### $jq(input, expression, options) : Object

Evaluates jq syntax (jq 1.6 mode, jackson-jq 1.6.5) against one JSON value.
`expression` defaults to ".". Zero outputs return undefined, one returns the value,
and multiple outputs return an array. `options`.all=true always returns an array of outputs.
`options`.vars binds JSON values by variable name without the leading $. Examples:

```javascript
$jq({ a: 2 }, ".a"); // 2
$jq([1, 2], ".[]", { all: true }); // [1, 2]
$jq([1, 3], "map(select(. > $min))", { vars: { min: 2 } }); // [3]
```

Accepts plain objects, dense arrays, strings, finite numbers, booleans and null.
Rejects unsupported values and cycles with their location. Does not mutate inputs.
Results are detached JavaScript values; numbers have JavaScript precision.
`__flags.JQ_CACHE_SIZE` controls compiled query caching (256 entries; 0 clears/disables).
Filesystem imports, CLI `input` streams and OpenAF callbacks are unavailable.
See docs/jq.md for compatibility, value boundaries and error behavior.

Sources:

- js/openaf.js:5319

<a id="api-jsonrpc-06eabf4c"></a>

## $jsonrpc

### $jsonrpc(aOptions) : Map

Creates a JSON-RPC 2.0 client that can communicate with JSON-RPC servers over HTTP/HTTPS
or with local processes using stdio. The `aOptions` parameter is a map with the following
possible keys:

- `type` (string) : Connection type, either "stdio" for local process, "remote"/"http" for HTTP server, "sse" for HTTP SSE responses (default: "stdio") or "dummy"
- `url` (string) : Required for remote servers - the endpoint URL
- `timeout` (number) : Timeout in milliseconds for operations (default: 60000)
- `cmd` (string|map|array) : Required for stdio type - the command to execute or the map/array accepted by `$sh`
- `pwd` (string) : For stdio type - the working directory to use when executing cmd (default: the JSONRPC.cmd.defaultDir flag, if set)
- `envs` (map) : For stdio type - a map of environment variables to use when executing cmd. Note: by default these are merged over the current process environment (so secrets in the parent environment are inherited); set envsOnly to true to use only this map
- `envsOnly` (boolean) : For stdio type - when true the child process environment will be exactly the envs map instead of merging it with the current environment (default: false)
- `options` (map) : Additional options passed to `$rest` for remote connections
- `sse` (boolean) : When true, remote/http requests expect Server-Sent Events responses with JSON-RPC payloads in `data:` events
- `debug` (boolean) : Enable debug output showing JSON-RPC messages (default: false)
- `shared` (boolean) : Share connections between identical configurations (default: false)

The returned client object provides these methods:

- `type(aType)`: Set the connection type
- `url(aURL)`: Set the URL and switch to remote type
- `sh(aCommand)`: Set the command and switch to stdio type
- `pwd(aPath)`: Set the working directory to use for stdio execution
- `envs(aMap)`: Set the environment variables map to use for stdio execution (merged with the current environment unless envsOnly is true)
- `exec(aMethod, aParams, aNotification)`: Execute a JSON-RPC method
- `destroy()`: Stop the client and cleanup resources

The exec method parameters:

- `aMethod` (string) : The JSON-RPC method name to call
- `aParams` (map) : Parameters object to send with the method call
- `aNotification` (boolean) : If true, sends a notification (no response expected)

For method calls (`aNotification`=false), exec returns the result directly.
For notifications (`aNotification`=true), exec returns undefined.

Examples:

```javascript
// Remote JSON-RPC server
var client = $jsonrpc({type: "remote", url: "http://api.example.com/rpc", debug: true});
var result = client.exec("getUserInfo", {userId: 123});
log("User info:", result);

// Send notification (no response)
client.exec("logEvent", {event: "user_login", userId: 123}, true);

// Local process via stdio
var localClient = $jsonrpc({cmd: "python3 my_rpc_server.py"});
var data = localClient.exec("processData", {input: [1, 2, 3]});
localClient.destroy();
```

Sources:

- js/openaf.js:9350

<a id="api-llm-cb2765df"></a>

## $llm

### $llm(aModel) : $llm

Shortcut for $gpt on the owrap.AI library.

Sources:

- js/openaf.js:13696

<a id="api-m2a-ad7c39f1"></a>

## $m2a

### $m2a(aDef, aMap) : Array

Tries to convert `aMap` into an array using the `aDef` array of keys for the values order in the output array. Example:

```javascript
$m2a(['c', 'b', 'a'], { a: 1, b: 2, c: 3 })    // [ 3, 2, 1 ]
```

Sources:

- js/openaf.js:14910

<a id="api-m4a-6d59cb28"></a>

## $m4a

### $m4a(aMap, aKey) : Array

Tries to create an array of maps from the provided `aMap` map of maps. Optionally if `aKey` is provided
it will be added to each array map with the map key. Example:

```javascript
var a = {
   "A1": { "abc": "123", "xpt": "000" },
   "A2": { "abc": "456", "xpt": "001" },
   "A3": { "abc": "789", "xpt": "002" }
}

$m4a(a, "key");
// [
//  { "key": "A1", "abc": "123", "xpt": "000" },
//  { "key": "A2", "abc": "456", "xpt": "001" },
//  { "key": "A3", "abc": "789", "xpt": "002" }
// ]
```

Sources:

- js/openaf.js:14997

<a id="api-mcp-da09ecd4"></a>

## $mcp

### $mcp(aOptions) : Map

Creates a Model Context Protocol (MCP) client that can communicate with LLM MCP servers
using JSON-RPC over stdio, remote connections, dummy mode, or oJob-based servers. This client speaks the legacy,
initialize-handshake-based MCP protocol eras by default (protocolVersion "2024-11-05" or "2025-06-18", selectable
via `aOptions.protocolVersion`, default "2025-06-18") and provides access to tools, prompts, and other MCP
capabilities. It can optionally opt into the modern, stateless 2026-07-28+ protocol era by setting
`aOptions.protocolVersion` to "auto": this probes the server (server/discover on stdio, a modern request inspected
for a recognized error on HTTP) and negotiates the modern era when the server supports it, falling back to the
legacy initialize handshake otherwise -- existing callers that don't set "auto" are completely unaffected.

The `aOptions` parameter is a map with the following possible keys:

- `type` (string) : Connection type - "stdio" for local process, "remote"/"http" for HTTP server, "sse" for HTTP SSE responses, "dummy" for local testing, or "ojob" for oJob-based server (default: "stdio")
- `url` (string) : Required for remote servers - the MCP server endpoint URL
- `timeout` (number) : Timeout in milliseconds for operations (default: 60000)
- `cmd` (string|array) : Required for stdio type - the command to launch the MCP server (an array is executed directly, without going through a shell)
- `pwd` (string) : For stdio type - the working directory to use when launching the MCP server
- `envs` (map) : For stdio type - a map of environment variables to use when launching the MCP server. Note: by default these are merged over the current process environment (so secrets in the parent environment are inherited); set envsOnly to true to use only this map
- `envsOnly` (boolean) : For stdio type - when true the MCP server environment will be exactly the envs map instead of merging it with the current environment (default: false)
- `options` (map) : Additional options:
  - For remote/stdio: passed to underlying JSON-RPC client
- For dummy: { fns: map of function implementations, fnsMeta: map of function metadata }
  - For ojob: { job: path to oJob file, args: arguments map, init: init entry/entries to run, fns: map of additional functions, fnsMeta: map of additional function metadata }
- `debug` (boolean) : Enable debug output showing JSON-RPC messages (default: false)
- `shared` (boolean) : Enable shared JSON-RPC connections when possible (default: false)
- `sse` (boolean) : When true, remote/http MCP requests expect Server-Sent Events responses carrying JSON-RPC payloads
- `strict` (boolean) : Enable strict MCP protocol compliance (default: true)
- `clientInfo` (map) : Client information sent during initialization (default: {name: "OpenAF MCP Client", version: "1.0.0"})
- `blacklist` (array) : Optional array of MCP tool names to hide from listTools() and block in callTool()
- `preFn` (function) : Function called before each tool execution with (toolName, toolArguments)
- `posFn` (function) : Function called after each tool execution with (toolName, toolArguments, result)
- `auth` (map) : Optional authentication options for remote/http type:
  - `type` (string): "bearer" (static token) or "oauth2" (automatic token retrieval/refresh)
- `token` (string): Bearer token when type is "bearer"
  - `tokenType` (string): Authorization scheme prefix (default: "Bearer")
- For oauth2: tokenURL, clientId, clientSecret, scope, audience, resource, grantType (default: "client_credentials"), extraParams (map), refreshWindowMs (default: 30000), authURL/redirectURI for authorization_code flow
  - For oauth2: if tokenURL/authURL are omitted for remote/http MCP servers they can be discovered through OAuth 2.0 Protected Resource Metadata and Authorization Server Metadata (the metadata issuer must match and discovered endpoints must use HTTPS unless they are loopback addresses or allowHTTP is true)
- `interactive` (boolean): false prohibits browser login and code prompts; omitted preserves existing behavior
  - `callback` (boolean): opt-in loopback login through `ow.server.httpd.oauth2` at redirectURI, with state/PKCE validation; loginTimeoutMs defaults to 300000
- `tokenStore` (map): opt-in {type: "sec", profile: "default"}; optional repo (default mcp-oauth2), bucket, key, file, lockSecret, mainSecret, lockTimeoutMs (60000). Or a synchronous custom load/save/clear/withLock store.
  - `sendResource` (boolean): false omits the OAuth resource parameter; default true
- `disableOpenBrowser` (boolean): If true prevents opening a browser during OAuth2 authorization_code flow (default: false)
- authenticate() / getAuthStatus() / clearAuth(): authenticate, inspect non-secret status, or clear local tokens

Type-specific details:

"dummy" type: Creates a local testing MCP server without external processes.

- Use options.fns to define tool implementations as functions
- Use options.fnsMeta to define tool metadata (description, input schema)
- Useful for development and testing without running actual MCP servers

"ojob" type: Creates an MCP server based on oJob jobs as tools.

- `options.job` (required) : Path to the oJob file containing job definitions
- `options.args`: Arguments to pass to the oJob
- `options.init`: Init entry name(s) to execute on startup (string or array)
- Jobs with fnsMeta property become MCP tools automatically
- Job names become tool names (except "tools/list", "tools/call", "initialize", "notifications/initialized")
- Combines oJob's job execution with MCP protocol

The returned client object provides these methods:

- `type(aType)`: Set the connection type
- `url(aURL)`: Set the URL and switch to remote type
- `sh(aCommand)`: Set the command and switch to stdio type
- `initialize(clientInfo)`: Initialize the MCP connection and exchange capabilities
- `listTools()`: Get list of available tools from the MCP server
- `callTool(toolName, toolArguments, toolOptions)`: Execute a specific tool with given arguments and optional per-call options
- `listPrompts()`: Get list of available prompts from the MCP server
- `getPrompt(promptName, promptArguments)`: Get a specific prompt with given arguments
- `toGptTools(aGptInstance, aToolNames)`: Add MCP tools to a `$gpt` instance
- `getCapabilities()`: Copy of the negotiated server capabilities
- `listResources()` / `listResourceTemplates()`: Paginated resource catalogs, preserving metadata
- `readResource(uri)`: Full resource result (text, base64 blobs, MIME types and metadata); URI is sent unchanged
- `subscribeResource(uri, callback)` / `unsubscribeResource(uri)`: Legacy resource updates when the server advertises resources.subscribe
- `onRequest(method, handler)` / `offRequest(method)`: Dedicated-connection inbound handlers `(params, request)`; return a result or throw `{code,message,data}`
- `onNotification(method, handler)` / `offNotification(method)`: Dedicated-connection event handlers `(params, notification)`
- `onSamplingRequest(handler)`: Opt into basic sampling; no automatic LLM calls or sampling tools
- `onElicitationRequest(handler, modes)`: Opt into form elicitation (default), optionally url mode on supported versions
- `setRoots(roots)`: Explicit file URI roots; never discovers filesystem paths automatically
- `continueRequest(method, originalParams, inputRequired)`: Explicit single-round modern MRTR retry using registered handlers and opaque requestState
- `startListening()` / `stopListening()`: Opt-in legacy HTTP GET event stream; no automatic reconnect
- `cancelRequest(id, reason)`: Best-effort protocol cancellation
- `getToolUI(name)` / `getAppResource(name)` / `hasApps()`: MCP Apps metadata and ui:// resource retrieval, without executing HTML
- `exec(method, params, execOptions)`: Low-level MCP/JSON-RPC; optional `onRequestId(id)` callback in execOptions
- `destroy()`: Stop the client and cleanup resources

Register sampling, elicitation and roots before legacy initialize(); only configured capabilities are advertised.
Stdio callbacks run on two bounded workers, permitting nested synchronous calls but not arbitrary nesting.
HTTP callbacks on POST SSE use independent authenticated response POSTs. HTTP resource subscriptions require
a supported GET event stream; modern subscriptions/listen is not implemented and fails explicitly.
Modern input_required results are never retried automatically. toGptTools retains plain text behavior and
serializes rich result envelopes as JSON, excluding tools marked app-only by MCP Apps visibility.
See docs/mcp-client.md for the full host integration contract, limitations and verified examples.

Important: The initialize() method must be called before using listTools, callTool,
listPrompts, or getPrompt methods. All methods return results synchronously (not promises).

Examples:

```javascript
// Connect to local MCP server via stdio
var client = $mcp({cmd: "npx @modelcontextprotocol/server-filesystem /tmp"});
client.initialize();
var tools = client.listTools();
log("Available tools:", tools.tools.map(t => t.name));

var result = client.callTool("read_file", {path: "/tmp/example.txt"});
log("File content:", result.content);

// Connect to remote MCP server
var remoteClient = $mcp({
  type: "remote",
  url: "http://localhost:8080/mcp",
  clientInfo: {name: "MyApp", version: "2.0.0"}
});
remoteClient.initialize();
// Optional per-call HTTP options (only used for remote/http MCP clients)
var result2 = remoteClient.callTool("read_file", {path: "/tmp/example.txt"}, { requestHeaders: { Authorization: "Bearer ..." } });
var prompts = remoteClient.listPrompts();

// Remote MCP server with OAuth2 client credentials
var oauthClient = $mcp({
  type: "remote",
  url: "https://example.com/mcp",
  auth: {
    type: "oauth2",
    tokenURL: "https://example.com/oauth/token",
    clientId: "my-client",
    clientSecret: "my-secret",
    scope: "mcp:read mcp:write"
  }
});
oauthClient.initialize();

// OAuth2 authorization_code flow (opens browser by default)
var oauthCodeClient = $mcp({
  type: "remote",
  url: "https://example.com/mcp",
  auth: {
    type: "oauth2",
    grantType: "authorization_code",
    authURL: "https://example.com/oauth/authorize",
    tokenURL: "https://example.com/oauth/token",
    redirectURI: "http://localhost/callback",
    clientId: "my-client",
    clientSecret: "my-secret",
    disableOpenBrowser: false
  }
});

// Dummy mode for testing
var dummyClient = $mcp({
  type: "dummy",
  options: {
    fns: {
      "test_tool": (params) => ({ result: "test" })
    },
    fnsMeta: {
      "test_tool": {
        description: "A test tool",
        inputSchema: { type: "object", properties: {} }
      }
    }
  }
});
dummyClient.initialize();
dummyClient.callTool("test_tool", {});

// oJob-based MCP server
var ojobClient = $mcp({
  type: "ojob",
  options: {
    job: "mytools.yaml",
    args: { env: "prod" },
    init: "setup"
  }
});
ojobClient.initialize();
var jobTools = ojobClient.listTools();

client.destroy();
remoteClient.destroy();
dummyClient.destroy();
ojobClient.destroy();
```

Sources:

- js/openaf.js:10184

<a id="api-openaf-dc8677e1"></a>

## $openaf

### $openaf(aScript, aPMIn, aOpenAF, extraJavaParamsArray) : Object

Tries to start an external process running openaf (if aOpenAF is provided, as a string or array, it will be used as the command to invoke openaf) to execute aScript setting the &#95;&#95;pm variable to aPMIn. Upon execution end the &#95;&#95;pm contents will be returned by the function.

Sources:

- js/openaf.js:11911

<a id="api-output-9cea1be1"></a>

## $output

### $output(aObj, args, aFunc, shouldReturn) : String

Formats and prints `aObj` using the options in `args` (defaults to `{}`). Also available as `$o`.
Set `shouldReturn` to `true` to return formatted output instead of printing it.

## Format selection

Use `args.__format` (or `args.__FORMAT`) to select a format. The lowercase option takes precedence.
Without an explicit format, `global.__format` is used when defined. Otherwise, maps and arrays use
`__colorFormat.table.format` when it is `table`, `stable`, `ctable`, `btable` or `bstable`;
all other cases default to `human`.

| Formats | Output |
| --- | --- |
| `json`, `prettyjson`, `cjson` | Compact, indented or colored JSON. |
| `gb64json` | Compact JSON encoded with gzip and Base64. |
| `slon`, `cslon` | SLON or colored SLON. |
| `ndjson` | One JSON value per array element. With `shouldReturn`, returns an array of strings. Use an array as input. |
| `xml`, `yaml`, `cyaml`, `toon` | XML, YAML, colored YAML or TOON. |
| `kyaml`, `ckyaml`, `lkyaml`, `clkyaml` | KYAML and its colored (`c`), single-line flow (`l`) variants. |
| `table`, `stable`, `ctable` | Table, wrapped table with row separators, or colored wrapped table. Maps become single-row arrays. |
| `btable`, `bstable` | Unicode borderless tables; `bstable` always separates records with light rules. |
| `tree`, `ctree`, `cntree`, `atree` | Tree output; colored (`c`), shortened keys (`n`), or colored without tables for arrays (`a`). |
| `mtree`, `mntree`, `btree`, `bntree` | Uncolored trees; monochrome (`m`) or plain (`b`), with shortened-key variants (`n`). |
| `map` | Map-style output using `printMap`. |
| `html`, `jsmap` | A complete HTML document from `ow.template.html.parseMap`. |
| `text` | JavaScript string conversion using `String`. |
| `md` | Render Markdown text for the terminal, or generate Markdown from maps and arrays (see below). |
| `csv` | CSV from an array of maps; a single map becomes a one-row array. |
| `human` | Call `aFunc` with the transformed value, or use the default tree/string output. |

## Options

These options also accept uppercase names (for example, `__PATH`); lowercase takes precedence.
Transformations run before formatting, in the order `__path`, `__from`, `__sql`.

| Option | Purpose |
| --- | --- |
| `__path` | Select data with `$path(aObj, expression)`. |
| `__from` | Query data with `$from` using an nLinq expression parsed by `af.fromNLinq`. |
| `__sql` | Query data with `$sql`. |
| `__csv` | CSV configuration as a JSON or SLON string, passed to `$csv`. |
| `__pause` | Page printed text with `ow.format.string.pauseString`. Ignored when returning output. |
| `__width` | Positive integer wrapping width for `btable` and `bstable`; defaults to the available terminal width. |
| `__rowsep` | Enable light rules between records in `btable` (default `false`). `bstable` always enables them. |
| `__key` | Storage key for the `key` format (default `"res"`). |

## Markdown output

For maps and arrays, `args.mdformat` accepts `structured` (default), `json` or `yaml`.
`structured` produces field/value tables for flat maps, column tables for arrays of flat maps,
lists for arrays of scalar values, and headings for nested data. Nested string sections use code fences.
`json` and `yaml` produce fenced code blocks. These map/array modes return or print Markdown source.
String input is rendered by `ow.format.withMD` for terminal display.

## Storing results

The `res` format stores the transformed value with `$set("res", value)`; `key` uses `args.__key`.
A format named `set_NAME` stores it with `$set("NAME", value)`.
The `args` format writes to `args._list`, `args._map` or `args.result` according to the value type.
The `pm` format merges the same fields into `__pm`.

Storage formats do not return formatted data. With `shouldReturn` omitted or false, they print a blank line.
The return value depends on the format: usually a string, an array of strings for `ndjson`, or undefined.
`human` does not forward the return value from `aFunc`, including the default formatter.
A custom `aFunc` is responsible for its own printing.

## Examples

```javascript
var rows = [{ name: "alpha", count: 2 }, { name: "beta", count: 5 }];
$output(rows, { __format: "btable", __width: 80, __rowsep: true });

// Capture formatted text without printing.
var json = $output(rows, { __format: "prettyjson" }, __, true);

// Select part of an object before formatting.
$output({ items: rows }, { __path: "items", __format: "yaml" });

// Generate Markdown source from structured data.
var markdown = $output(rows, { __format: "md" }, __, true);
var fenced = $output(rows, { __format: "md", mdformat: "json" }, __, true);

// Render Markdown text in the terminal.
$output("# Results\n\n**Complete**", { __format: "md" });
```

Sources:

- js/openaf.js:18056

<a id="api-path-78ad0d4d"></a>

## $path

### $path(obj, path, customFunctions) : Object

Shortcut for the JMESPath library for easy query and access to arrays/objects. To see all the available options
please refer to http://jmespath.org. Uses the Java engine by default; set `__flags.ALTERNATIVES.path`=false
to use the Javascript engine. `__flags.PATH_CACHE_SIZE` controls the Java syntax cache (256 entries by default; 0 disables).
Optional you can provide a map of `customFunctions`. Examples:

**Slicing:**

```javascript
$path(arr, "[0:5]"); $path(arr, "[5:10]"); $path(arr, "[:5]"); $path(arr, "[::2]"); $path(arr, "[::-1]");
```

**Projections:**

```javascript
$path(arr, "a[*].first"); $path(arr, "a.*.b"); $path(arr, "[]");
```

**Filters:**

```javascript
$path(arr, "a[?b=='xyz'].c"); $path(arr, "a[?b>`1`].x");
```

**MultiSelect:**

```javascript
$path(arr, "a[].[x, y]"); $path(arr, "a[].{ x: x, y: y }");
```

**Pipe:**

```javascript
$path(arr, "a[*].b | [0]");
```

**Functions:**

```text
abs(x), avg(x), contains(x, y), ceil(x), floor(x), join(x, arr), keys(obj), length(x), map(expr, arr), max(x), max_by(x, y), merge(a, b), min(a), min_by(a, b), not_null(a), reverse(arr), sort(arr), sort_by(a, y), starts_with(a, b), ends_with(a, b), sum(a), to_array(a), to_string(a), to_number(a), type(a), values(a)
$path(arr, "a[?contains(@, 'b') == `true`]")
```

**OpenAF custom functions:**

```text
  a2m(arrFields, arrValues), a4m(arr, 'key', dontRemove), m2a(arrFields, obj), m4a(obj, 'key'), count_by(arr, 'field'), format(x, 'format'), formatn(x, 'format'), group(arr, 'field'), group_by(arr, 'field1,field2'), unique(arr), to_map(arr, 'field'), to_date(x), to_datef(x, format) from_datef(x, format), to_isoDate(x), flat_map(x), search_keys(arr, 'text'), search_values(arr, 'text'), delete(map, 'field'), substring(a, ini, end),
 template(a, 'template'), t(a, 'template'), templateF(x, 'template'), tF(x, 'template'), to_bytesAbbr(x), to_numAbbr(x), from_bytesAbbr(x), from_siAbbr(x), from_timeAbbr(x), timeago(x), from_ms(x, 'format'), replace(x, 're', 'flags', 'replaceText'), split(x, 'sep'), trim(x), index_of(x, 'search'), last_index_of(x, 'search'), lower_case(x), upper_case(x), concat(x, y), match(x, 're', 'flags'), amerge(x, y), to_slon(x), from_slon(x), to_json(x), from_json(x, str), to_yaml(x, isMultiDoc), from_yaml(x), trim(x), nvl(x, v), to_toml(x), from_toml(x)
add(x, y), sub(x, y), mul(x, y), div(x, y), mod(x, y)
split(x, sep), split_re(x, sepRE), split_sep(x, sepRE, encls), date_diff(d, unit, nullValue)
insert(obj, 'field', value), now(negativeTimeDiff)
get(nameOrPath), set(obj, path), setp(obj, path, name)
range(count), ranges(count, start, step)
inc(name), dec(name), getc(name), unset(obj, name)
k2a(map, keyre, outkey, removeNulls), geta(nameOrPath, arrayIndex)
sql_format(sql, options), sort_semver(arrayVersions), sort_by_semver(arrayMaps, jmespathStringToVersionField)
semver(version, operation, argument)
progress(value, max, min, size, indicator, space),
to_csv(array, options), from_csv(str, options)
ch(name, op, arg1, arg2), chq(name, op, max, value), path(obj, jmespath), opath(jmespath)
sql(obj, query), from(obj, queryStringOrMap), jq(obj, query)
to_ms(date), timeagoAbbr(x)
env(str), envs(regex)
oafp(json/slon), oafpd(obj, json/slon)
if(cond, then, else)
assign(obj, path, value), assignp(objPathStr, path, value)
random(min, max), srandom(min, max)
at(arrayIndex)
to_numSpace(num, space), from_numSpace(num, space)
to_kyaml(obj), from_kyaml(str)
to_toon(obj), from_toon(str)
to_base64(str), from_base64(str)
to_xml(obj), from_xml(str)
```

Functions only active if flag PATH_SAFE is false:

```text
ojob(name, argsJSSLON)
sh(command, stdin), sh_json(command, stdin), sh_jsslon(command, stdin), sh_yaml(command, stdin)
```

Custom functions:

```javascript
$path(2, "example(@)", { example: { _func: (a) => { return Number(a) + 10; }, _signature: [ { types: [ $path().number ] } ] } });
```

Query helpers use `$sql` with its default method, `$from(...).query(...)` (parsing strings
with `af.fromNLinq`), and `$jq` with its default output behavior. Examples:

```javascript
$path(data, "sql(items, 'select name where price > 10')");
$path(data, "from(items, 'greater(price, 10)')");
$path(data, "jq(items, 'map(select(.price > 10))')");
```

Sources:

- js/openaf.js:5347

<a id="api-py-9fded53b"></a>

## $py

### $py(aPythonCodeOrFile, aInput, aOutputArray, throwExceptions, shouldFork) : Map

Executes aPythonCodeOrFile using a map aInput as variables in python and returns a map with python  variables in aOutputArray. Starts an embedded session once if needed. throwExceptions defaults to false; true throws on stderr, nonzero exit or bridge failure. shouldFork=true isolates this call.

Sources:

- js/openaf.js:11874

<a id="api-pyexec-71067807"></a>

## $pyExec

### $pyExec(aPythonCodeOrFile, aInput, throwExceptions, aArgv) : Map

Runs a standalone script with callbacks and returns a process result including exitcode. aInput is reserved. aArgv overrides launcher environment arguments; throwExceptions defaults to false.

Sources:

- js/openaf.js:11889

<a id="api-pystart-36e879b9"></a>

## $pyStart

### $pyStart()

Start python process on the background. Should be stopped with $pyStop.

Sources:

- js/openaf.js:11863

<a id="api-pystop-c9fded84"></a>

## $pyStop

### $pyStop()

Stops the background python process started by $pyStart.

Sources:

- js/openaf.js:11901

<a id="api-queue-58b961fa"></a>

## $queue

### $queue(anArray) : Object

Returns an object with the following methods:

- `add(aItem)`: adds `aItem` to the queue and returns true if successful
- `remove(aItem)`: removes `aItem` from the queue and returns true if successful
- `addAll(aItems)`: adds all `aItems` to the queue and returns true if successful
- `has(aItem)`: returns true if `aItem` is in the queue
- `isEmpty()`: returns true if the queue is empty
- `size()`: returns the size of the queue
- `toArray()`: returns the queue as an array
- `peek()`: returns the first item in the queue without removing it
- `poll()`: returns the first item in the queue and removes it

The queue is implemented using a java.util.concurrent.ConcurrentLinkedQueue, which is thread-safe and allows concurrent access.
If `anArray` is provided, it will be added to the queue using addAll.

Sources:

- js/openaf.js:12352

<a id="api-retry-151a6992"></a>

## $retry

### $retry(aFunction, aNumOfTriesOrFunction) : Object

Tries to execute aFunction and return the corresponding returned result. If aNumOfTriesOrFunction is a number (defaults to 1) and aFunction throws an exception it will repeat aFunction until it doesn't throw an exception or for the number of aNumOfTriesOrFunc. If aNumOfTriesOrFunction is a function it will be called whenever aFunction throws an exception with the corresponding exception as argument and it will retry until aNumOfTriesOrFunction returns false.

Sources:

- js/openaf.js:16431

<a id="api-set-e3b59d79"></a>

## $set

### $set(aKey, aValue)

Sets aValue with aKey so it can be retrieved with $get later.

Sources:

- js/openaf.js:17995

<a id="api-sql-3f61f134"></a>

## $sql

### $sql(aObject, aSQL, aMethod) : Array

Given an `aObject` (map or array) will try to execute `aSQL` (SQL expression) and return the corresponding results.
Optionally you can provide `aMethod` to be used (e.g. "auto" (default) or "nlinq" or "h2"). "nlinq" it's the fastest but doesn't
support aggregations or multi-field combinations; "h2" is the more complete but will require a lot more resources, it's slower.

NOTE: In "h2" you can use the table _TMP for your queries.

Sources:

- js/openaf.js:13708

<a id="api-stream-4ae3ffed"></a>

## $stream

### $stream

Shortcut for the streamjs library for easy query and access to streams of data. To see all the available options please refer to https://github.com/winterbe/streamjs/blob/master/APIDOC.md.

Sources:

- js/openaf.js:6104

<a id="api-sync-9e278818"></a>

## $sync

### $sync() : Object

Returns an object with a 'run(`aFn`)' function that will execute the provided `aFn` in a synchronized way.
The run function will lock the execution until the `aFn` is finished. This is useful to
ensure that only one thread is executing the `aFn` at a time.

Example:

```javascript
var s = $sync()
s.run(() => {
    // Your code here, only one thread will execute this at a time
})
```

Sources:

- js/openaf.js:12316

<a id="api-tb-dd3151c8"></a>

## $tb

### $tb(aFunction) : Result

Shortcut for a "thread-box" to execute `aFunction`. The "thread" will timeout with the provided execution timeout (in ms)
or stop whenever the stopWhen function returns true (called continuously or after each timeout). Examples:

```javascript
$tb().timeout(5000).exec(aFunc);  // Executes aFunc to a maximum of 5 seconds. Afterwards the aFunc is stopped.
$tb(aFunc).timeout(5000).exec();  // Sames as previous, aFunc can be provided before or on exec.
$tb().timeout(500).stopWhen(aStopFunc).exec(); // Stops when aStopFunc is true.
```

Sources:

- js/openaf.js:8721

<a id="api-throwifundef-57e886fd"></a>

## $throwIfUnDef

### $throwIfUnDef(aFunc) : Function

Returns a function that tries to execute aFunc and throws and exception if the result if undefined otherwise returns the result. Usefull with $retry when waiting for a "defined" result.

Sources:

- js/openaf.js:16414

<a id="api-unset-0dc709e5"></a>

## $unset

### $unset(aKey)

Unset a previously set value with aKey.

Sources:

- js/openaf.js:18030

<a id="api-odoc-1868dc1d"></a>

## ODoc

### ODoc(aoDoc)

Object to hold an ODoc, the basic structure for OpenAF documentation. You can provide a ODoc structure to initialize this ODoc object.

Sources:

- js/odoc.js:5

<a id="api-odocs-46bb16a5"></a>

## ODocs

### ODocs(aPath, aODocs, anArrayURLs, offline)

Object to hold ODocs objects, search them, load or save them (either offline or online). The parameter aPath can be a directory containing .odoc.db, a standalone database ZIP, or a JAR/ZIP containing .odoc.db. Saving requires a directory path. The parameter aODocs is optional but it can be used to link with ODocsGen contents (e.g (new ODocsGen(aMapOfFiles)).getODoc())). It's also possible to additionally specify anArrayURLs to load ODocs via web. Optional you can force it to only work offline (offline = true)

Sources:

- js/odoc.js:82

<a id="api-odocsgen-b281bb65"></a>

## ODocsGen

### ODocsGen(aMapOfFiles) : ODocsGen

Object to generate ODocs structures. Given a map where the key is a ODoc subject and the value is the filesystem path to a javascript or Java source file (e.g. new ODocsGen(&#123;"sample": "/some/place/source.java"&#125;)). It finds text within odoc xml tags and adds it as odoc text. Inside the odoc xml tags you should have a key xml tag to specify a unique key within a ODoc subject (the key will be interpreted until the first '(', '&#123;' or '&#91;' occurs). Per standard practice you should specify the entire signature of a function when describing one.

Sources:

- js/odoc.js:343

<a id="api-_-93cf0c4c"></a>

## &#95;$

### &#95;$(aObject, anErrorMessagePrefix)

Shortcut to facilitate argument pre-validation and promote defensive programming.

- `.default(aNewObject)`: `aObject`
  Checks if `aObject` is defined and returns `aObject`. If it's not defined it will return `aNewObject` (the default value).

- `$_(aMessage)`: `aObject`
  Throws an exception with `aMessage` if `aObject` is not defined otherwise returns `aObject`.

Sources:

- js/openafsigil.js:229

<a id="api-__colorformat-09d09509"></a>

## &#95;&#95;colorFormat

### &#95;&#95;colorFormat

Global map with the ANSI color/style settings used when printing colored output (colorify, cprint*, printTable/printTree,
ask/askChoose/askChooseMultiple prompts and markdown rendering). Each color value is a comma-separated list of ansiColor
attributes (e.g. "BOLD,CYAN", "FG(12)", "RESET"). Entries can be changed at runtime to customize the theme:

- key, number, string, boolean, date, default: colors used by colorify and tree/table values per data type.
- askPre, askQuestion, askChoose, askChooseFilter, askPos: colors used by ask, askChoose and askChooseMultiple.
- `askChooseChars`: characters used in choose prompts (chooseMultipleSelected, chooseMultipleUnselected, chooseUp, chooseDown, chooseLine).
- `table`: { lines, value, title, bandRow, format } colors for table output; the optional "format" (table, stable, ctable, btable or bstable)
  selects the default table renderer for `$output` when no global or explicit format is set.
- `tree`: { lines } color for tree connecting lines (other tree options are merged with `__flags.TREE`).
- `md`: colors used by `ow.format.withMD`: codeBlock {line, text, theme}, codeInline {text, surround}, heads {h1..h4}, line, link {text, url},
  bullets, list, task {open, done}, strike and note {line, text, theme}. Missing md entries are filled with defaults on first use.

Example:

```javascript
__colorFormat.string = "GREEN"; __colorFormat.table.title = "BOLD,UNDERLINE"; __colorFormat.md.heads.h1 = "CYAN,BOLD"
```

Sources:

- js/openaf.js:2215

<a id="api-_i-070a90dd"></a>

## &#95;i$

### &#95;i$(aValue, aPrefixMessage) : Object

Same as &#95;$ but if aValue is not defined and aPrefixMessage if defined it will use ask() or askEncrypt() to  interactively ask the user for the value with the prompt "&#91;aPrefixMessage&#93;: ". Should only be used if user interaction is expected but to force not be interactiv you can set &#95;&#95;i$interactive to false). Note: askEncrypt will be used if aPrefixMessage has any reference to "secret" or "pass".

Sources:

- js/openaf.js:12727

<a id="api-addopackremotedb-6d159092"></a>

## addOPackRemoteDB

### addOPackRemoteDB(aURL)

Adds a path to an opack.db file to the current search path.

Sources:

- js/openaf.js:3613

<a id="api-addonopenafshutdown-e4d60e00"></a>

## addOnOpenAFShutdown

### addOnOpenAFShutdown(aFunction) : Boolean

Adds aFunction to try to execute whenever OpenAF is going to shutdown. The latest hook added will be the first to be executed until the first hook added (actually a shortcut for Threads.addOpenAFShutdownHook).

Sources:

- js/openaf.js:6167

<a id="api-ansicolor-d3c4f670"></a>

## ansiColor

### ansiColor(aAnsi, aString, force, noCache, noReset) : String

Returns the ANSI codes together with `aString`, if determined that the current terminal can handle ANSI codes (overridden
by `force` = true), with the attributes defined in `aAnsi`. Please use with ansiStart() and ansiStop().
The optional `noReset` boolean flag will remove ansi reset as part of the string returned.
The attributes separated by commas can be:

- `BLACK`, `RED`, `GREEN`, `YELLOW`, `BLUE`, `MAGENTA`, `CYAN`, `WHITE`
- `FG_BLACK`, `FG_RED`, `FG_GREEN`, `FG_YELLOW`, `FG_BLUE`, `FG_MAGENTA`, `FG_CYAN`, `FG_WHITE`
- `BG_BLACK`, `BG_RED`, `BG_GREEN`, `BG_YELLOW`, `BG_BLUE`, `BG_MAGENTA`, `BG_CYAN`, `BG_WHITE`
- `BOLD`, `FAINT`, `INTENSITY_BOLD`, `INTENSITY_FAINT`, `ITALIC`, `UNDERLINE`, `BLINK_SLOW`, `BLINK_FAST`, `BLINK_OFF`, `NEGATIVE_ON`, `NEGATIVE_OFF`, `CONCEAL_ON`, `CONCEAL_OFF`, `UNDERLINE_DOUBLE`, `UNDERLINE_OFF`

Sources:

- js/openaf.js:1987

<a id="api-ansilength-697882d1"></a>

## ansiLength

### ansiLength(aString) : Number

Tries to return the aString length without any ansi control sequences.

Sources:

- js/openaf.js:2121

<a id="api-ansistart-46c0961d"></a>

## ansiStart

### ansiStart(force)

Prepares to output ansi codes if the current terminal is capable off (unless force = true). Use with ansiColor() and ansiStop().

Sources:

- js/openaf.js:2061

<a id="api-ansistop-0bead228"></a>

## ansiStop

### ansiStop(force)

Disables the output of ansi codes if the current terminal is capable off (unless force = true). Use with ansiColor() and ansiStart().

Sources:

- js/openaf.js:2094

<a id="api-ansiwintermcap-2e4ac8e3"></a>

## ansiWinTermCap

### ansiWinTermCap() : boolean

Determines in Windows if the current terminal has support for newer capabilities or not (e.g. cmd.exe)

Sources:

- js/openaf.js:2032

<a id="api-armfastexitonshutdown-bb4780a6"></a>

## armFastExitOnShutdown

### armFastExitOnShutdown(anExitCode)

Arms the same fast-exit trick exit(anExitCode, true) uses (see exit) so it also happens automatically once the JVM actually starts shutting down (a script simply finishing, Ctrl-C, SIGTERM, etc.), not just when exit(code, true) is called explicitly. Once every OpenAF-registered shutdown hook has run, the process terminates immediately with anExitCode - skipping the JVM's own trailing teardown that can otherwise delay exit by several seconds when a JIT compilation is still in flight. Only takes effect once shutdown actually begins, so it doesn't affect normal execution or daemon/server processes that intentionally stay alive. Shortcut for Threads.armFastExitOnShutdown.

Sources:

- js/openaf.js:6188

<a id="api-arraycontains-4b1e73a8"></a>

## arrayContains

### arrayContains(anArray, aObj, aPreFilter) : Number

Tries to find aObj in anArray returning the position where it's first found or -1 if not found. Optionally aPreFilter function can prepare each object for comparing.

Sources:

- js/openaf.js:5091

<a id="api-ask-2f2fc7f2"></a>

## ask

### ask(aPrompt, aMask, aConsole, noAnsi, aWrite) : String

Stops for user interaction prompting aPrompt waiting for an entire line of characters and, optionally, masking the user input with aMask (e.g. "&#42;"). Returns the user input.

Sources:

- js/openaf.js:15119

<a id="api-ask1-49aec0bc"></a>

## ask1

### ask1(aPrompt, allowed, aConsole, aWrite) : String

Stops for user interaction prompting aPrompt waiting for a single character within the allowed string (a set of characters). Returns the user input.

Sources:

- js/openaf.js:15154

<a id="api-askchoose-9faf557a"></a>

## askChoose

### askChoose(aPrompt, anArray, aMaxDisplay, aHelpText, aUI) : Number

Stops for user interaction prompting aPrompt waiting for a single character to choose from the provided anArray of options. Optionally you can provide aMaxDisplay to limit the number of options displayed at a time. Returns the index of the chosen option.

Optional aUI is the console/write/ansi map returned by askConsole (or a compatible injected UI).

Sources:

- js/openaf.js:15210

<a id="api-askchoosemultiple-e8bc7b16"></a>

## askChooseMultiple

### askChooseMultiple(aPrompt, anArray, aMaxDisplay, aHelpText, aUI) : Array

Stops for user interaction prompting aPrompt waiting for a single character to choose multiple from the provided anArray of options. Optionally you can provide aMaxDisplay to limit the number of options displayed at a time. Returns an array with the chosen options.

Sources:

- js/openaf.js:15334

<a id="api-askconsole-347dd601"></a>

## askConsole

### askConsole() : Map

Opens an independent controlling terminal (including with piped stdin/redirected stdout). Returns console/write/ansi/close for injection into askChoose and ask. Close in finally. Throws if no controlling terminal is available. Does not replace process input or output.

Sources:

- js/openaf.js:14654

<a id="api-askdef-f7aa713d"></a>

## askDef

### askDef(aInit, aQuestion, isSecret, isVoidable, aUI) : String

If aInit is not defined will ask aQuestion (if isSecret = true it will askEncrypt) and return the value. If isVoidable = true and no answer is provided it will return undefined.

Sources:

- js/openaf.js:15190

<a id="api-askencrypt-68348c61"></a>

## askEncrypt

### askEncrypt(aPrompt, aConsole, noAnsi, aWrite) : String

Similar to ask but the return user input will be encrypted. If an empty string is entered by the user the function will return undefined.

Sources:

- js/openaf.js:15140

<a id="api-askkey-026b3a72"></a>

## askKey

### askKey(aUI, aTimeoutMs, aOptions) : String&#124;Map

Reads a single key from aUI (a map returned by askConsole or compatible, providing read(aTimeoutMs) that returns a character code, -2 on timeout and -1 on end of input) and returns a normalized name: "up", "down", "left", "right", "home", "end", "pgup", "pgdn", "delete", "insert", "enter", "tab", "shift-tab", "backspace", "esc", "eof", "ctrl-&#60;letter&#62;", "alt-&#60;char&#62;" or the printable character itself. With aOptions.mouse true, also returns &#123; type: "mouse", button, x, y, release &#125; for SGR mouse reports (1-based cells). Mouse reports are otherwise consumed without returning a key. Returns undefined if aTimeoutMs expires without input. A lone ESC is told apart from escape sequences with a short timeout.

Sources:

- js/openaf.js:14679

<a id="api-askn-80ce7809"></a>

## askN

### askN(aPromptFn, aStopFn, aConsole) : String

Stops for a multi-line user interaction prompting, for each line, the result of calling aPromptFn that receives the current user input  (if a string is provided it will default to a function that returns that string). The interaction will stop when aStopFn function, that receives the current user input as an argument, returns true (if the function is not provided it will default to 3 new lines).

Sources:

- js/openaf.js:15167

<a id="api-askstruct-1604e2eb"></a>

## askStruct

### askStruct(anArrayOfQuestions, aUI) : Array

Given `anArrayOfQuestions` with a structure like:

```javascript
[
 { name: "question1", prompt: "Question 1", type: "question" },
 { name: "question2", prompt: "Question 2", type: "secret" },
 { name: "question3", prompt: "Question 3", type: "char", options: "YN" },
 { name: "question4", prompt: "Question 4", type: "choose", options: ["Option 1", "Option 2", "Option 3"], output: "index" },
 { name: "question5", prompt: "Question 5", type: "multiple", options: ["Option 1", "Option 2", "Option 3"], max: 2 }
]
```

Will prompt the user for each question and return an array with the answers.

The type can be:

- "question" (default)
- "secret"
- "char" (requires options)
- "choose" (requires options)
- "multiple" (requires options)

Sources:

- js/openaf.js:15476

<a id="api-bcrypt-d8123d5b"></a>

## bcrypt

### bcrypt(aText, aVerifyHash, hashingRounds) : String/boolean

If aText is provided it will return the resulting string of applying the bcrypt hash to aText. Optionally the bcrypt hashingRounds (between 4 and  31, default 10) can be provided (note: the more rounds, the more slower and secure). If aVerifyHash is provided it will return a boolean determining if the provided aVerifyHash (result of a previous bcrypt) matches the aText provided (hashingRounds will be ignored since the hash string already provides the rounds used).

Sources:

- js/openaf.js:3268

<a id="api-beautifier-027e8f34"></a>

## beautifier

### beautifier(anObject) : String

Shortcut for the af.js2s function providing a human readable representation of the javascript object provided.

Sources:

- js/openaf.js:2180

<a id="api-beep-d01b7ce9"></a>

## beep

### beep()

Tries to produce a beep sound.

Sources:

- js/openaf.js:4421

<a id="api-bprint-832d93bf"></a>

## bprint

### bprint(aStr)

"Beautifies" and prints the `aStr` to the stdout (with a new line on the end) (example: `bprint("hello world!")`)

Sources:

- js/openaf.js:469

<a id="api-bprinterr-a3a54e3d"></a>

## bprintErr

### bprintErr(aStr)

"Beautifies" and prints the `aStr` to the stderr (with a new line on the end) (example: `bprintErr("Hupps!! A problem!")`)

Sources:

- js/openaf.js:625

<a id="api-bprinterrnl-cdc85660"></a>

## bprintErrnl

### bprintErrnl(aStr)

"Beautifies" and prints the `aStr` to the stderr (without adding a new line on the end) (example: `bprintErrnl("Hupps!! A problem!")`)

Sources:

- js/openaf.js:686

<a id="api-bprintnl-e5c4333d"></a>

## bprintnl

### bprintnl(aStr)

"Beautifies" and prints the `aStr` to the stdout (without adding a new line on the end) (example: `bprintnl("hello world!")`)

Sources:

- js/openaf.js:529

<a id="api-checklatestversion-f6d41a2a"></a>

## checkLatestVersion

### checkLatestVersion() : String

Tries to determine what is the latest available version for OpenAF. Compare it with getVersion() to determine if you need an update.

Sources:

- js/openaf.js:8128

<a id="api-clearinterval-39d06558"></a>

## clearInterval

### clearInterval(uuid)

Clears the interval with the provided uuid returned by setInterval.

Sources:

- js/openaf.js:12464

<a id="api-clone-b5d61dc8"></a>

## clone

### clone(anObject) : aClonedObject

Creates a new copy of a JavaScript object.

Sources:

- js/openaf.js:4761

<a id="api-cls-84cdb981"></a>

## cls

### cls()

Tries to clear the screen. The commands to try to clean the screen are given in ANSI.

Sources:

- js/openaf.js:4390

<a id="api-colorify-4a6e8d92"></a>

## colorify

### colorify(aObject) : String

Tries to ANSI colorify a json aObject for use with cprint, cprintErr, cprintErrnl and cprintnl. Colors are defined in &#95;&#95;colorFormat.

Sources:

- js/openaf.js:2290

<a id="api-compare-1241626e"></a>

## compare

### compare(X, Y) : Boolean

Compares a X object to a Y object at the content level. If they are equal the function will return true otherwise it will return false.

Sources:

- js/openaf.js:5061

<a id="api-compress-267e8288"></a>

## compress

### compress(anObject) : ArrayOfBytes

Compresses a JSON object into an array of bytes suitable to be uncompressed using the uncompress function.

Sources:

- js/openaf.js:6828

<a id="api-conreset-52bd1960"></a>

## conReset

### conReset() : boolean

Tries to reset the console to its original state. Returns true if successful.

Sources:

- js/openaf.js:4408

<a id="api-cprint-fe3ca576"></a>

## cprint

### cprint(aStr)

"Stringifies" in ANSI color and prints the `aStr` to the stdout (with a new line on the end) (example: `cprint("hello world!")`)

Sources:

- js/openaf.js:478

<a id="api-cprinterr-13d26e85"></a>

## cprintErr

### cprintErr(aStr)

"Stringifies" in ANSI color and prints the `aStr` to the stderr (with a new line on the end) (example: `cprintErr("Hupps!! A problem!")`)

Sources:

- js/openaf.js:634

<a id="api-cprinterrnl-6206123f"></a>

## cprintErrnl

### cprintErrnl(aStr)

"Stringifies" in ANSI color and prints the `aStr` to the stderr (with a new line on the end) (example: `cprintErrnl("Hupps!! A problem!")`)

Sources:

- js/openaf.js:696

<a id="api-cprintnl-ca95f3e7"></a>

## cprintnl

### cprintnl(aStr)

"Stringifies" in ANSI color and prints the `aStr` to the stdout (with a new line on the end) (example: `cprintnl("hello world!")`)

Sources:

- js/openaf.js:538

<a id="api-createdb-e8ade80e"></a>

## createDB

### createDB(aFile, aLogin, aPass) : DB

Creates a DB object instantiated with a file based H2 database for the aFile provided. Optionally you can use aLogin and aPass(word).

Sources:

- js/openaf.js:7895

<a id="api-createdbinmem-63b5968a"></a>

## createDBInMem

### createDBInMem(aName, dontClose, aLogin, aPass, inMemFileSystem, inMemCompressed, useNIO) : DB

Creates a DB object instantiated with an in-memory database for the given name. Optionally you can  specify that you don't want it to close on db.close (but all data will be lost on exiting OpenAF). Optionally you can also specify aLogin and aPass. This is a H2 database so do check more documentation on http://www.h2database.com/.  Also optionally you can specify if you want the in-memory database to be file based (inMemFileSystem) which  is slower than normal; to be compressed (inMemCompressed) which is slower than normal and inMemFileSystem; to store data outside the VM's heap (useNIO). Do note that if inMemFileSystem and inMemCompressed are selected only inMemCompressed will be used. And useNIO will only affect inMemFileSystem or inMemCompressed options.

Sources:

- js/openaf.js:7856

<a id="api-createdbserver-d04f9d0f"></a>

## createDBServer

### createDBServer(aFile, aPort, aLogin, aPass) : DB

Creates a DB object instantiated with a server based H2 database, on the provided aPort (defaults to 9090), for the aFile provided. Optionally you can use aLogin and aPass(word).

Sources:

- js/openaf.js:7881

<a id="api-deletefromarray-daa2e71c"></a>

## deleteFromArray

### deleteFromArray(anArray, anIndex) : Array

Deletes the array element at anIndex from the provided anArray. Returns the new array with the element removed.

Sources:

- js/openaf.js:12492

<a id="api-desctype-bc35f5cd"></a>

## descType

### descType(aObject) : String

Given aObject will try to return the apparent type withing: undefined, null, bytearray, javaclass, java, boolean, array, number, string, function, date, map and object.

Sources:

- js/openaf.js:6974

<a id="api-dumplog-312e49a3"></a>

## dumpLog

### dumpLog() : Array

Returns an array with collected log messages. Each entry has: d - timestamp; t - type; m - message.

Sources:

- js/openaf.js:2653

<a id="api-endopenafandstart-d9eac4e3"></a>

## endOpenAFAndStart

### endOpenAFAndStart(aCommandLineArray, noStop, redirectOutput)

Terminates the current OpenAF execution while trying to execute the commands on the aCommandLineArray in detached mode. On Unix systems it uses nohup (and setsid if available). On Windows it uses cmd start. If redirectOutput is true (default), output is redirected to /dev/null on Unix (on Windows output is always visible). Set redirectOutput to false to keep the output visible.

Sources:

- js/openaf.js:4987

<a id="api-endopenafandstartopenaf-f2179365"></a>

## endOpenAFAndStartOpenAF

### endOpenAFAndStartOpenAF(aCommandLineArray, preCommandLineArray, noStop, redirectOutput)

Terminates the current OpenAF execution and tries to start a detached OpenAF process with the current OpenAF command line plus an extra aCommandLineArray. preCommandLineArray can be used to provide java arguments. If redirectOutput is true (default), output is redirected to /dev/null on Unix (on Windows output is always visible). Set redirectOutput to false to keep the output visible.

Sources:

- js/openaf.js:5023

<a id="api-exit-e596899f"></a>

## exit

### exit(anExitCode, force)

Immediately exits execution with the provided exit code. Optionally force=true can be provided to run any registered OpenAF shutdown hooks (see addOnOpenAFShutdown/Threads.addOpenAFShutdownHook) synchronously and then terminate the process at the operating system level, bypassing the JVM's own shutdown sequence. Regular JVM shutdown hooks not registered through OpenAF, and File.deleteOnExit() entries, will NOT run in this case. Use this when a still-running JIT compilation would otherwise stall a plain exit() for several seconds waiting for the JVM's safepoint teardown to complete. To get the same behavior on shutdown paths that don't call exit() explicitly (a script simply finishing, Ctrl-C, SIGTERM), see armFastExitOnShutdown.

Sources:

- js/openaf.js:4732

<a id="api-extend-bf0bb4ee"></a>

## extend

### extend(&#91;deep&#93;, target &#91;, object1&#93;&#91;, objectN&#93;) : Object

Merges the contents of two or more objects together into the first object (target). If deep is specified the copy will be recursive. This function is equivalent to JQuery's extend function. See more in  https://api.jquery.com/jquery.extend/

Sources:

- js/openaf.js:4567

<a id="api-findrandomopenport-983ed087"></a>

## findRandomOpenPort

### findRandomOpenPort() : number

Tries to find a random open port on all network interfaces. Useful to start network servers on an available port.

Sources:

- js/openaf.js:8188

<a id="api-flatten-3ab675f2"></a>

## flatten

### flatten(aObject, noKeyValSeparation) : Array

Given aObject it will traverse it and create an array where each element will have a key and a val(ue). The key will  begin with a "." whenever it's a children key on aObject. This function is useful when trying to find specific keys or values across a Map. Optionally you can specify that you don't want each array element with the key and the value as separate elements but rather a directly as key and value.

Sources:

- js/openaf.js:8074

<a id="api-forkopenaf-5bf08a00"></a>

## forkOpenAF

### forkOpenAF(aCommandLineArray, preCommandLineArray) : Promise

Starts another OpenAF with the same command line, if aCommandLineArray is not provided.  If aCommandLineArray is provided each array element will be use sequentially to build the command line to start a new OpenAF instance. preCommandLineArray can be used to  provide java arguments if defined.

Sources:

- js/openaf.js:4964

<a id="api-genuuid-be883d65"></a>

## genUUID

### genUUID(useSecureRandom) : String

Generates and returns an UUID using a javascript algorithm (if needed you can refer to the  AF operation AF.KeyGenerator.GenerateUUID).

Sources:

- js/openaf.js:2520

<a id="api-getcpuload-0c39ea1f"></a>

## getCPULoad

### getCPULoad(useAlternative) : Number

Tries to obtain the current system load average (equivalent to top). If not available a negative value will be returned. Optionally you can specify to use the current system load if useAlternative = true. If the current system doesn't provide a load average it will fallback to the current system load.

Sources:

- js/openaf.js:6139

<a id="api-getchlog-9e63710a"></a>

## getChLog

### getChLog() : Channel

Returns the current log dump channel.

Sources:

- js/openaf.js:2640

<a id="api-getdistribution-2f2345b9"></a>

## getDistribution

### getDistribution() : String

Returns the current distribution channel for this version of OpenAF.

Sources:

- js/openaf.js:3516

<a id="api-getenv-df08f646"></a>

## getEnv

### getEnv(anEnvironmentVariable) : String

Returns the current value of the operating system anEnvironmentVariable.

Sources:

- js/openaf.js:12658

<a id="api-getenvs-c1981d33"></a>

## getEnvs

### getEnvs() : Map

Returns a map of key and values with the operating system environment variables.

Sources:

- js/openaf.js:115

<a id="api-getenvsdef-168c0468"></a>

## getEnvsDef

### getEnvsDef(aEnv, aVar, aDefault, isJson) : Object

Given an environment variable aEnv name will check if a value is provided and return it if so. Otherwise it will check the value of aVar and return it if defined. If aVar is also not defined it will return aDefault. Optionally if isJson=true the value of the provided aEnv will be parsed from JSON or SLON.

Sources:

- js/openaf.js:127

<a id="api-getfromzip-4fca3f16"></a>

## getFromZip

### getFromZip(aZipFile, aResource, inBytes, anEncoding, notInMemory) : anArrayOfBytes

Retrieves aResource, as anArrayOfBytes, from aZipFile. This resource can be inBytes = true or not and anEncoding can be provided. If the resource to retrieve is big you can use notInMemory = true for a slower but less memory retrieval.

Sources:

- js/openaf.js:8537

<a id="api-getjavastacktrace-b9686b0a"></a>

## getJavaStackTrace

### getJavaStackTrace(anException) : Array

Given a javascript anException, if it's a wrapped or directly a java exception it will try to obtain the corresponding stack trace information in the form of an array.

Sources:

- js/openaf.js:3039

<a id="api-getnumberofcores-b7e96681"></a>

## getNumberOfCores

### getNumberOfCores(realValue) : Number

Try to identify the current number of cores on the system where the script is being executed.

Sources:

- js/openaf.js:6121

<a id="api-getopacklocaldb-e366668f"></a>

## getOPackLocalDB

### getOPackLocalDB() : Array

Returns an Array of maps. Each map element is an opack package description of the currently  locally, and per user, installed opack packages.

Sources:

- js/openaf.js:3682

<a id="api-getopackpath-82f70474"></a>

## getOPackPath

### getOPackPath(aPackage) : String

Given aPackage name (a opack name) will search the opack and if installed will return the filesystem path where the opack is installed.

Sources:

- js/openaf.js:3782

<a id="api-getopackpaths-bf27d3fc"></a>

## getOPackPaths

### getOPackPaths() : Array

Returns an array of strings with the paths for each of the installed opacks.

Sources:

- js/openaf.js:3765

<a id="api-getopackremotedb-c65d0522"></a>

## getOPackRemoteDB

### getOPackRemoteDB() : Array

Returns an Array of maps. Each map element is an opack package description registered in the OpenAF central repository. Results are cached using $cache for &#95;&#95;flags.OPACK&#95;REMOTE&#95;DB&#95;CACHE&#95;TTL milliseconds (default: 60000).

Sources:

- js/openaf.js:3623

<a id="api-getopenafjar-83b8c1e3"></a>

## getOpenAFJar

### getOpenAFJar() : String

Returns the complete filepath and name for the OpenAF jar file. (Shortcut for af.getOpenAFJar()). If &#95;&#95;forcedOpenAFJar is defined the corresponding value will be used (useful when detection of the OpenAF jar doesn't work as expected or when OpenAF is embedded.

Sources:

- js/openaf.js:7

<a id="api-getopenafpath-a15b6ea5"></a>

## getOpenAFPath

### getOpenAFPath() : String

Returns the filesystem path to the openaf.jar currently being used for the script execution.

Sources:

- js/openaf.js:3526

<a id="api-getpid-ee2eccfb"></a>

## getPid

### getPid() : String

Tries to retrieve the current script execution operating system PID and returns it.

Sources:

- js/openaf.js:6157

<a id="api-getversion-5699d2fc"></a>

## getVersion

### getVersion() : String

Shortcut for the af.getVersion (see more af.getVersion) function. Will return the current version of OpenAF being used.

Sources:

- js/openaf.js:3505

<a id="api-hmacsha1-578f18a8"></a>

## hmacSHA1

### hmacSHA1(data, key, toHex) : ArrayOfBytes

Given data and a key will calculate the hash-based message authentication code (HMAC) using the SHA1 hash function. Optionally if toHex = true the output will be converted to hexadecimal lower case.

Sources:

- js/openaf.js:3257

<a id="api-hmacsha256-9a30282c"></a>

## hmacSHA256

### hmacSHA256(data, key, toHex) : ArrayOfBytes

Given data and a key will calculate the hash-based message authentication code (HMAC) using the SHA256 hash function. Optionally if toHex = true the output will be converted to hexadecimal lower case.

Sources:

- js/openaf.js:3215

<a id="api-hmacsha384-1088e56e"></a>

## hmacSHA384

### hmacSHA384(data, key, toHex) : ArrayOfBytes

Given data and a key will calculate the hash-based message authentication code (HMAC) using the SHA384 hash function. Optionally if toHex = true the output will be converted to hexadecimal lower case.

Sources:

- js/openaf.js:3246

<a id="api-hmacsha512-d113f82f"></a>

## hmacSHA512

### hmacSHA512(data, key, toHex) : ArrayOfBytes

Given data and a key will calculate the hash-based message authentication code (HMAC) using the SHA512 hash function. Optionally if toHex = true the output will be converted to hexadecimal lower case.

Sources:

- js/openaf.js:3235

<a id="api-includeopack-d01ff151"></a>

## includeOPack

### includeOPack(aOPackName, aMinVersion)

Ensures that aOPackName is installed. Optionally you can provide a minimal opack version. If the opack is not installed, can't be installed or cannot be updated to a version bigger or equal to aMinVersion an exception will be thrown.

Sources:

- js/openaf.js:16309

<a id="api-index-1bc04b52"></a>

## index

### index

OpenAF scripting is based on JavaScript. There are built-in objects and implicit functions
to add extra functionality. To get more help:

- for built-in objects just search by the object name + the function name (e.g. openaf -helpscript `io.readFile`)
- for implicit functions search by the function name (e.g. openaf -helpscript compress) or enter "scope" (e.g. openaf -helpscript scope)
  to see a complete list.

Built-in objects are:

- `af`
- `io`
- `CSV`
- `DB`

Sources:

- js/example.js:2

<a id="api-inherit-035300f3"></a>

## inherit

### inherit(Child, Parent)

Associates a Child object to a Parent simulating a inheritance relationship. This is done by copying the Parent prototype to the Child prototype. This is similar to "Parent.call(this, arg1, arg2)"

Sources:

- js/openaf.js:5110

<a id="api-iosetnio-2cab52b9"></a>

## ioSetNIO

### ioSetNIO(aFlag)

Sets the default use of NIO in ioStream&#42; functions. It's overridden if the ioStream&#42; function defines a value for the useNIO function argument.

Sources:

- js/openaf.js:8209

<a id="api-iostreamcopy-56b3a8b8"></a>

## ioStreamCopy

### ioStreamCopy(aOutputStream, aInputStream)

Copies the contents of a Java aInputStream to a Java aOutputStream. The two streams will  be closed in the end.

Sources:

- js/openaf.js:8427

<a id="api-iostreamread-a43d5e83"></a>

## ioStreamRead

### ioStreamRead(aStream, aFunction, aBufferSize, useNIO, encoding)

Given a Java input or output stream helps to read strings by using aFunction with a string argument for each buffer size  (default 1024 characters). Optionally you can provide a different aBufferSize (default: 1024) and/or also specify that  Java NIO functionality should be used. If aFunction returns true the read operation stops.

Sources:

- js/openaf.js:8272

<a id="api-iostreamreadbytes-3065e74e"></a>

## ioStreamReadBytes

### ioStreamReadBytes(aStream, aFunction, aBufferSize, useNIO)

Given a Java input or output stream helps to read an array of bytes by using aFunction with anArrayOfBytes argument for  each buffer size (default 1024 characters). Optionally you can provide a different aBufferSize (default: 1024) and/or  also specify that Java NIO functionality should be used. If aFunction returns true the read operation stops.

Sources:

- js/openaf.js:8452

<a id="api-iostreamreadlines-42b09f1d"></a>

## ioStreamReadLines

### ioStreamReadLines(aStream, aFunctionPerLine, aSeparator, useNIO, anEncoding)

Given aStream will read the entire buffer and call aFunctionPerLine(withALine) per each &#92;n found. Aditionally you can specify a different aSeparator for each line other than "&#92;n".  If aFunctionPerLine returns true the read operation stops. Optionally you can also provide anEncoding.

Sources:

- js/openaf.js:8299

<a id="api-iostreamwrite-a9d7403c"></a>

## ioStreamWrite

### ioStreamWrite(aStream, aString, aBufferSize, useNIO)

Given a Java input or output stream helps to write aString into the same. Optionally you can provide a different aBufferSize (default: 1024) and/or also specify that Java NIO functionality should be used.

Sources:

- js/openaf.js:8221

<a id="api-iostreamwritebytes-544467d7"></a>

## ioStreamWriteBytes

### ioStreamWriteBytes(aStream, aArrayBytes, aBufferSize, useNIO)

Given a Java input or output stream helps to write aArrayBytes into the same. Optionally you can provide a different aBufferSize (default: 1024) and/or also specify that Java NIO functionality should be used.

Sources:

- js/openaf.js:8237

<a id="api-isarray-5d1f9731"></a>

## isArray

### isArray(aObj) : boolean

Returns true if aObj is an array, false otherwise.

Sources:

- js/openaf.js:6848

<a id="api-isbinaryarray-8f931a1d"></a>

## isBinaryArray

### isBinaryArray(anArrayOfChars, confirmLimit, previousResult) : boolean

Tries to determine if the provided anArrayOfChars is binary or text. The detection is performed with the first 1024 chars ( that can be changed if confirmLimit is provided). Additionally is possible to link multiple calls providing the last result on previousResult for multiple subsequences of a main array of chars sequence. Should work for utf8, iso-8859-1, iso-8859-7,  windows-1252 and windows-1253. Returns true if file is believed to be binary.

Sources:

- js/openaf.js:4263

<a id="api-isboolean-05b84590"></a>

## isBoolean

### isBoolean(aObj) : boolean

Returns true if aObj is boolean, false otherwise

Sources:

- js/openaf.js:6930

<a id="api-isbytearray-a970255a"></a>

## isByteArray

### isByteArray(aObj) : boolean

Returns true if aObj is a byte array object, false otherwise.

Sources:

- js/openaf.js:6946

<a id="api-isdate-4fcfca82"></a>

## isDate

### isDate(aObj) : boolean

Returns true if aObj is a date, false otherwise

Sources:

- js/openaf.js:6923

<a id="api-isdecimal-94a68ad2"></a>

## isDecimal

### isDecimal(aObj) : boolean

Returns true if aObj has a decimal component.

Sources:

- js/openaf.js:6907

<a id="api-isdef-a5a67383"></a>

## isDef

### isDef(aObject) : boolean

Returns true if the provided aObject is defined as a javascript variable. It will return false otherwise. (see also isUnDef). Shortcut for the isDefined function.

Sources:

- js/openaf.js:97

<a id="api-isdefined-8c2fde23"></a>

## isDefined

### isDefined(aObject) : boolean

Returns true if the provided aObject is defined as a javascript variable. It will return false otherwise. (see also isUndefined)

Sources:

- js/openaf.js:4250

<a id="api-isfunction-e2927415"></a>

## isFunction

### isFunction(aObj) : boolean

Returns true if aObj is a function, false otherwise;

Sources:

- js/openaf.js:6875

<a id="api-isinteger-6d0ea12b"></a>

## isInteger

### isInteger(aObj) : boolean

Returns true if aObj doesn't have a decimal component.

Sources:

- js/openaf.js:6899

<a id="api-isjavaarray-10ecc921"></a>

## isJavaArray

### isJavaArray(aObj) : boolean

Returns true if aObj is a Java array, false otherwise

Sources:

- js/openaf.js:79

<a id="api-isjavaclass-6b891d6f"></a>

## isJavaClass

### isJavaClass(aObj) : boolean

Return true if aObj is a Java class, false otherwise

Sources:

- js/openaf.js:33

<a id="api-isjavaexception-8bd43d54"></a>

## isJavaException

### isJavaException(aObject) : boolean

Determines if aObject is a java exception object or a javascript exception with an embeeded java exception.

Sources:

- js/openaf.js:3021

<a id="api-isjavaobject-92276501"></a>

## isJavaObject

### isJavaObject(aObj) : boolean

Returns true if aObj is a Java object, false otherwise

Sources:

- js/openaf.js:43

<a id="api-ismap-cd006e9b"></a>

## isMap

### isMap(aObj) : boolean

Returns true if aObj is a map, false otherwise.

Sources:

- js/openaf.js:6856

<a id="api-isnull-51c4071a"></a>

## isNull

### isNull(aObj) : boolean

Returns true if aObj is null, false otherwise

Sources:

- js/openaf.js:6938

<a id="api-isnumber-0b3746bc"></a>

## isNumber

### isNumber(aObj) : boolean

Returns true if aObj can be a number, false otherwise

Sources:

- js/openaf.js:6891

<a id="api-isobject-a14f5c3e"></a>

## isObject

### isObject(aObj) : boolean

Returns true if aObj is an object, false otherwise;

Sources:

- js/openaf.js:6864

<a id="api-isstring-15a69ef7"></a>

## isString

### isString(aObj) : boolean

Returns true if aObj is a string, false otherwise

Sources:

- js/openaf.js:6883

<a id="api-istnumber-2e283b0c"></a>

## isTNumber

### isTNumber(aObj) : boolean

Returns true if aObj is of type number, false otherwise

Sources:

- js/openaf.js:6915

<a id="api-isuuid-ecc42021"></a>

## isUUID

### isUUID(aObj) : boolean

Returns true if aObj is an UUID.

Sources:

- js/openaf.js:6960

<a id="api-isundef-a19aecb2"></a>

## isUnDef

### isUnDef(aObject) : boolean

Returns true if the provided aObject is undefined as a javascript variable. It will return false otherwise. (see also isDef). Shortcut for the isUndefined function.

Sources:

- js/openaf.js:106

<a id="api-isundefined-6c424292"></a>

## isUndefined

### isUndefined(aObject) : boolean

Returns true if the provided aObject is undefined as a javascript variable. It will return false otherwise. (see also isDefined)

Sources:

- js/openaf.js:4239

<a id="api-javaregexp-e0e5c3b2"></a>

## javaRegExp

### javaRegExp(text).match(regExp, mods) : Array

Mimics, using Java, the javascript match function. Supported mods are "g", "m" and "i" or the java integer composed  mods. Returns the corresponding array.

Sources:

- js/openaf.js:16204
- js/openaf.js:16235

### javaRegExp(text).matchAll(regExp, mods) : Array

Mimics, using Java, the javascript match function with the "g" modifier. Supported mods are "m" and "i" or the java integer composed  mods. Returns the corresponding array.

Sources:

- js/openaf.js:16222

### javaRegExp(text).replaceAll(regExp, mods) : Array

Mimics, using Java, the javascript replace function with the "g" modifier. Supported mods are "m" and "i" or the java integer composed  mods. Returns the corresponding array.

Sources:

- js/openaf.js:16250

### javaRegExp().preCompile(regExp, mods)

Pre-compiles the regExp with the corresponding mods to be used by match, matchAll, replace, replaceAll, split and test until removePreCompiled is invoked for the same combination of regExp and mods.

Sources:

- js/openaf.js:16261

### javaRegExp().removePreCompiled(regExp, mods)

Removes a previously added pre compiled combination of regExp and mods.

Sources:

- js/openaf.js:16271

### javaRegExp(text).split(regExp, mods) : Array

Returns an array of the result of spliting text using the provided regExp and mods. Supported mods are "g", "m" and "i" or the java integer composed  mods.

Sources:

- js/openaf.js:16280

### javaRegExp(text).test(regExp, mods) : boolean

Mimics, using Java, the javascript RegExp test function. Supported mods are "g", "m" and "i" or the java integer composed  mods. Returns the corresponding boolean value.

Sources:

- js/openaf.js:16295

<a id="api-joniregexp-c4f214d3"></a>

## joniRegExp

### joniRegExp(pattern, options) : Object

Compiles an Oniguruma (Ruby syntax) pattern once. Options are ignoreCase, dotAll and extended (booleans, default false). Methods: test(input), match(input), matchAll(input), replace(input, replacement), replaceAll(input, replacement), split(input, limit). Matches contain text, index, end (UTF-16 offsets), captures and groups. Replacement strings use JavaScript dollar tokens; callbacks receive match, captures, offset, input and named groups. Inputs must be strings without unpaired surrogates. See docs/joni.md for details.

Sources:

- js/openaf.js:16095

<a id="api-jsonparse-2f1285ac"></a>

## jsonParse

### jsonParse(aString, alternative, unsafe, ignoreNonJson) : Map

Shorcut for the native JSON.parse that returns an empty map if aString is not defined, empty or unparsable.

Sources:

- js/openaf.js:2417

<a id="api-listfilesrecursive-b9a935fd"></a>

## listFilesRecursive

### listFilesRecursive(aPath, usePosix, aFnErr) : Map

Performs the io.listFiles function recursively given aPath. The returned map will be equivalent to the io.listFiles function (see more in io.listFiles). Alternatively you can specify to usePosix=true and it will add to the map the owner, group and full permissions of each file and folder. When &#95;&#95;flags.ALTERNATIVES.listFilesRecursive=true the processing will be done in parallel and aFnErr will be called in case of an error.

Sources:

- js/openaf.js:4307

<a id="api-load-0cf67fc7"></a>

## load

### load(aScript)

Provides a shortcut for the af.load function (see more af.load). If the provided aScript is not found this function will try to search the script on the openaf.jar::js folder and on the installed opacks. If it doesn't find the provided aScript it will throw an exception "Couldn't find aScript".

Sources:

- js/openaf.js:3911

<a id="api-loadajv-71fbbd6d"></a>

## loadAjv

### loadAjv()

Loads the bundled Ajv v8 JSON Schema validator as global Ajv. OpenAF schema helpers automatically load it and configure formats, draft routing and compatibility options. See ow.obj.schemaInit and docs/json-schema.md.

Sources:

- js/openaf.js:7703

<a id="api-loadcompiled-3bce0f56"></a>

## loadCompiled

### loadCompiled(aScript, dontCompile, dontLoad) : boolean

Tries to load an OpenAF script as a compiled class. If a compiled class file doesn't exist in the same path it will try to compile and load from the compiled code. If a compiled class file exists in the same path it will recompile it if the modified date of the original aScript is newer than the class. If the class was already loaded or can't be loaded it will return false. Returns true otherwise. Optionally you can force to not compile dontCompile=true or just to compile with dontLoad=true

Sources:

- js/openaf.js:4124

<a id="api-loadcompiledlib-a1cb8f9e"></a>

## loadCompiledLib

### loadCompiledLib(aLibClass, forceReload, aFunction, withSync) : boolean

Loads the corresponding compiled javascript library class and keeps track if it was already loaded or not (in &#95;&#95;loadedLibs). Optionally you can force reload and provide aFunction to execute after the successful loading. Returns true if successfull, false otherwise.

Sources:

- js/openaf.js:7067

<a id="api-loaddbinmem-b2774626"></a>

## loadDBInMem

### loadDBInMem(aDB, aFilename)

Tries to load to a in-memory database, aDB object, previously created by the function createDBInMem from a SQL aFilename probably created by the function persistDBInMem.

Sources:

- js/openaf.js:7932

<a id="api-loaddiff-c00b651d"></a>

## loadDiff

### loadDiff()

Loads the JsDiff javascript library into scope (check https://github.com/kpdecker/jsdiff).

Sources:

- js/openaf.js:7691

<a id="api-loadexternaljars-43d896a4"></a>

## loadExternalJars

### loadExternalJars(aPath, dontCheck)

Given a path will try to add to the current classpath (using af.externalAddClasspath) all files with the extension '.jar'. Optionally you can override the dontCheck if it was loaded with this command previously.

Sources:

- js/openaf.js:3806

<a id="api-loadfuse-cf7715e3"></a>

## loadFuse

### loadFuse()

Loads the FuseJS javascript library into scope.

See more in: http://fusejs.io/

Sources:

- js/openaf.js:7676

<a id="api-loadhandlebars-dc275394"></a>

## loadHandlebars

### loadHandlebars()

Loads the Handlebars javascript library into scope. Example:

```javascript
loadHandlebars();
var source = "<m>{{#each lines}}\t<s name=\"{{key}}\">{{value}}</s>\n{{/each}}\n</m>";
var data = { "lines": [ { "name": "n1", "value": "v1" }, { "name": "n2", "value": "v2" } ] };
var template = Handlebars.compile(source);
print(template(data));
data.lines.push({"name": "n3", "value": "v3"});
print(template(data));
```

See more documentation in: http://handlebarsjs.com/

Sources:

- js/openaf.js:7630

<a id="api-loadhelp-4d9bd978"></a>

## loadHelp

### loadHelp()

Loads into scope the ODoc objects for documentation support.

Sources:

- js/openaf.js:7729

<a id="api-loadjsyaml-f366ebf5"></a>

## loadJSYAML

### loadJSYAML()

Loads the JS-YAML library.

Sources:

- js/openaf.js:12670

<a id="api-loadlib-888db8ac"></a>

## loadLib

### loadLib(aLib, forceReload, aFunction) : boolean

Loads the corresponding javascript library and keeps track if it was already loaded or not (in &#95;&#95;loadedLibs). Optionally you can force reload and provide aFunction to execute after the successful loading. Returns true if successfull, false otherwise.

Sources:

- js/openaf.js:7035

<a id="api-loadlodash-7279ce43"></a>

## loadLodash

### loadLodash()

Loads the Lodash javascript library.

See more in https://lodash.com/docs

Sources:

- js/openaf.js:7715

<a id="api-loadoafp-f8dd0d14"></a>

## loadOAFP

### loadOAFP()

Loads the OpenAF processor that can be used with the function oafp. Example:

```javascript
// Thread unsafe example
oafp({ data: "(abc: 123, xyz: 456)", out: "pm" })
sprint(__pm._map)

// Thread safe example
oafp({ data: "(abc: 123, xyz: 456)", out: "key", __key: "myresult" })
sprint($get("myresult"))
```

Sources:

- js/openaf.js:12691

<a id="api-loadpy-4bd2e1bd"></a>

## loadPy

### loadPy(aPyScript, aInput, aOutputArray, dontStop) : Map

Provides a shortcut for the $py function (see more in $py). If the provided aPyScript is not found this function will try to search the python script on the installed opacks. If it doesn't find the provided aScript it will throw an exception "Couldn't find aPyScript". If aInput map is defined each entry will be converted into python variables. If aOutputArray is defined the python variables string names in the array will be returned as a map.

Sources:

- js/openaf.js:4005

<a id="api-loadtoon-f2452772"></a>

## loadTOON

### loadTOON()

Loads the TOON image encoding/decoding library.

Sources:

- js/openaf.js:12680

<a id="api-loadunderscore-36404deb"></a>

## loadUnderscore

### loadUnderscore()

Loads the Underscore javascript library into scope (using the Lodash alternative).

See more in: http://underscorejs.org and https://lodash.com/docs

Sources:

- js/openaf.js:7655

<a id="api-log-836ff184"></a>

## log

### log(msg, formatOptions)

Outputs to the current stdout a line composed of the current date, indication of INFO and the provided msg. Optionally you can provide a formatOptions map for overriding the defaults from setLog. Note: you can use startLog, stopLog and dumpLog to keep an internal record of theses messages.

Sources:

- js/openaf.js:2685

<a id="api-logerr-eda4da1d"></a>

## logErr

### logErr(msg, formatOptions)

Outputs to the current stderr a line composed of the current date, indication of ERROR and the provided msg. Optionally you can provide a formatOptions map for overriding the defaults from setLog. Note: you can use startLog, stopLog and dumpLog to keep an internal record of theses messages.

Sources:

- js/openaf.js:2853

<a id="api-logflush-e7e365ca"></a>

## logFlush

### logFlush(aTimeout)

Will wait for the current log promise to finish. Optionally you can provide aTimeout in milliseconds.

Sources:

- js/openaf.js:2584

<a id="api-logwarn-f926df21"></a>

## logWarn

### logWarn(msg, formatOptions)

Outputs to the current warning in a line composed of the current date, indication of WARN and the provided msg. Optionally you can provide a formatOptions map for overriding the defaults from setLog. Note: you can use startLog, stopLog and dumpLog to keep an internal record of theses messages.

Sources:

- js/openaf.js:2926

<a id="api-lognl-ef8223aa"></a>

## lognl

### lognl(msg, formatOptions)

Outputs to the current stdout, without a new line, a sentence composed of the current date, indication of INFO and the provided msg. Optionally you can provide a formatOptions map for overriding the defaults from setLog. Note: you can use startLog, stopLog and dumpLog to keep an internal record of theses messages.

Sources:

- js/openaf.js:2768

<a id="api-lprint-cd353926"></a>

## lprint

### lprint(aStr, withColor)

"SLONs" and prints the aStr to the stdout (with a new line on the end)

Sources:

- js/openaf.js:461

<a id="api-lprinterr-b5735038"></a>

## lprintErr

### lprintErr(aStr, withColor)

"SLONs" and prints the aStr to the stderr (with a new line on the end)

Sources:

- js/openaf.js:617

<a id="api-lprinterrnl-edadeecb"></a>

## lprintErrnl

### lprintErrnl(aStr, withColor)

"SLONs" and prints the aStr to the stderr (without adding a new line on the end)

Sources:

- js/openaf.js:678

<a id="api-lprintnl-eb74a8e4"></a>

## lprintnl

### lprintnl(aStr, withColor)

"SLONs" and prints the aStr to the stdout (without adding a new line on the end)

Sources:

- js/openaf.js:522

<a id="api-maparray-de209d04"></a>

## mapArray

### mapArray(anArray, selectors, limit) : Array

Helper functions to map selectors (inputs for ow.obj.getPath) from anArray returning the filtered array. IF selectors is a string or just one array entry the result will be an array with just the value results. Optionally you can also limit the number of results to the first "limit" (number).

Sources:

- js/openaf.js:8025

<a id="api-md2-1b598c29"></a>

## md2

### md2(anObject) : String

Will return of the MD2 in hexadecimal format for a given anObject.

For files you can provide a file stream: var s = io.readFileStream(getOpenAFJar()); md2(s); s.close()

Sources:

- js/openaf.js:3142

<a id="api-md5-3ebff31b"></a>

## md5

### md5(anObject) : String

Will return of the MD5 in hexadecimal format for a given anObject.

For files you can provide a file stream: var s = io.readFileStream(getOpenAFJar()); md5(s); s.close()

Sources:

- js/openaf.js:3155

<a id="api-merge-283128ac"></a>

## merge

### merge(anObjectA, anObjectB) : aMergedObject

Merges a JavaScript object A with a JavaScript object B a returns the result as a new object.

Sources:

- js/openaf.js:4775

<a id="api-newfn-82351bb3"></a>

## newFn

### newFn() : Function

Builds a new Function handling any debug needs if necessary.

Sources:

- js/openaf.js:12760

<a id="api-newjavaarray-a991a1da"></a>

## newJavaArray

### newJavaArray(aJavaClass, aSize) : JavaArrayClass

Creates a new Java Array object for the `aJavaClass` type for a provided `aSize`.

Examples:

```javascript
newJavaArray(java.lang.String, 5);
newJavaArray(java.lang.Integer.TYPE, 2);
```

Sources:

- js/openaf.js:8650

<a id="api-now-ed5eb9a3"></a>

## now

### now() : Number

Will return the current system time in milliseconds.

Sources:

- js/openaf.js:3081

<a id="api-nowe-c0923051"></a>

## nowE

### nowE() : Number

Returns the current epoch time in seconds.

Sources:

- js/openaf.js:3091

<a id="api-nownano-94961568"></a>

## nowNano

### nowNano() : Number

Will return the current system time in nanoseconds.

Sources:

- js/openaf.js:3132

<a id="api-nownanoe-d1a48b72"></a>

## nowNanoE

### nowNanoE() : Number

Returns the current epoch time in nanoseconds.

Sources:

- js/openaf.js:3101

<a id="api-nowtz-7ebb6a82"></a>

## nowTZ

### nowTZ() : Number

Returns the same as now() but adjusted with the local timezone offset.

Sources:

- js/openaf.js:3122

<a id="api-nowutc-ea11604f"></a>

## nowUTC

### nowUTC() : Number

Will return the current system time in milliseconds.

Sources:

- js/openaf.js:3112

<a id="api-ojob-7c33d2f0"></a>

## oJob

### oJob(aFile, args, aId, aOptionsMap, shouldReturn)

Shortcut for oJobRunFile return the result on the variable &#95;&#95;pm. Keep in mind that it doesn't support concurrency. If shouldReturn is true it will return the result (from ow.oJob.output if used) of the job instead of the &#95;&#95;pm variable.

Sources:

- js/openaf.js:3584

<a id="api-ojobrun-940cce51"></a>

## oJobRun

### oJobRun(aJson, args, aId)

Runs a oJob from aJson definition with the provided args (arguments). Optionally you can provide aId to segment these specific jobs.

Sources:

- js/openaf.js:12560

<a id="api-ojobrunfile-7e321fea"></a>

## oJobRunFile

### oJobRunFile(aFile, args, aId, aOptionsMap, isSubJob)

Runs a oJob aFile with the provided args (arguments). Optionally you can provide aId to segment these specific jobs.

Sources:

- js/openaf.js:12520

<a id="api-ojobrunfileasync-2a43d4d6"></a>

## oJobRunFileAsync

### oJobRunFileAsync(aFile, args, aId, aOptionsMap, isSubJob) : oPromise

Runs a oJob aFile async with the provided args (arguments). Optionally you can provide aId to segment these specific jobs. Returns the corresponding promise.

Sources:

- js/openaf.js:12545

<a id="api-ojobrunjob-685a5807"></a>

## oJobRunJob

### oJobRunJob(aJob, args, aId, waitForFinish) : boolean

Shortcut for ow.oJob.runJob. Please see help for ow.oJob.runJob. Optionally you can provide aId to segment this specific job. If aJob is a string it will try to retrieve the job from the jobs channel. Returns true if the job executed or false otherwise (e.g. failed deps).

Sources:

- js/openaf.js:12581

<a id="api-ojobrunjobasync-5d0c58f9"></a>

## oJobRunJobAsync

### oJobRunJobAsync(aJob, args, aId) : oPromise

Creates an oPromise to run the same arguments for oJobRunJob thus executing the job async. Returns the generate oPromise.

Sources:

- js/openaf.js:12644

<a id="api-opack-9804c1d1"></a>

## oPack

### oPack(aParameters)

Tries to execute oPack with `aParameters` string. These string is equivalent to the opack command-line commands.
`aParameters` = "help" will, for example, print all the help information.

Sources:

- js/openaf.js:3570

<a id="api-opromise-1a2a668c"></a>

## oPromise

### oPromise(aFunction, aRejFunction, useVirtualThreads) : oPromise

Custom Promise-like implementation. If you provide aFunction, this aFunction will be executed async in a thread and oPromise object will be immediatelly returned. Optionally this aFunction can receive a resolve and reject functions for to you use inside aFunction to provide a result with resolve(aResult) or an exception with reject(aReason). If you don't call theses functions the returned value will be used for resolve or any exception thrown will be use for reject. You can use the "then" method to add more aFunction that will execute once the previous as executed successfully (in a stack fashion). The return/resolve value from the  previous function will be passed as the value for the second. You can use the "catch" method to add aFunction that will receive a string or exception for any exception thrown with the reject functions. You can also provide a aRejFunction that works like a "catch" method as previously described.  Optionally if useVirtualThreads is true, the aFunction will be executed in a virtual thread, otherwise it will be executed in a normal thread.

Sources:

- js/openaf.js:15789

<a id="api-objorstr-8199ad59"></a>

## objOrStr

### objOrStr(aObj, aStr) : String

Given aObj (a map or an array) will try to assess if aStr is an aObj key (using $$.get). If yes, it will return the corresponding aObj value otherwise it will return aStr.

Sources:

- js/openaf.js:4431

<a id="api-obook-976abd89"></a>

## obook

### obook(aBook, exitOnEnd)

Convenience function to create and start an interactive oBook tutorial in the OpenAF console. aBook can be a file path to a markdown file or an inline markdown string. If exitOnEnd is true the process exits when the user reaches the end of the book. Sets up the watchLine/watchCommand hooks required for console integration.

Sources:

- js/owrap.oBook.js:248

<a id="api-opackexec-0961e5b7"></a>

## opackExec

### opackExec(aPackageName)

Tries to execute the provided opack aPackageName.

Sources:

- js/openaf.js:3794

<a id="api-openinbrowser-6ee845d5"></a>

## openInBrowser

### openInBrowser(anURL) : Boolean

Tries to open anURL on the current OS desktop browser. Returns false if it's unable to open the OS desktop browser for some reason.

Sources:

- js/openaf.js:8113

<a id="api-pforeach-a8adc4c5"></a>

## pForEach

### pForEach(anArray, aFn, aErrFn, aUseSeq, aTimeoutMs, options) : Array

Given `anArray`, divides it in subsets for processing in a specific number of threads. In each thread `aFn(aValue, index)`
will be executed for each value in sequence. The results of each `aFn` will be returned in the same order as the original
array. If an error occurs during the execution of `aFn`, `aErrFn` will be called with the error. If `aUseSeq` is true the
sequential execution will be forced. `aTimeoutMs`, if provided, overrides `__flags.PFOREACH.wait_timeout_ms` as the overall
deadline, in milliseconds, from parallel dispatch through queue-pressure and completion waits. If neither is a positive
number (the default) pForEach waits for all partitions to complete.
Sequential callbacks remain synchronous and are not interrupted by this deadline. On timeout the still-pending partitions
(and their pool worker threads) are cancelled, `aErrFn` is called with a "pForEach: N of M partitions timed out"
diagnostic and whatever results were collected so far are returned (missing entries come back as arrays of __, so the
returned array keeps the same length and order as `anArray`).

Example:

```javascript
var res = pForEach(thingsToProcess,
  function(aValue, index) {
    return processValue(aValue)
  },
  function(e) {
    printErr(e)
  }
)
```

Sources:

- js/openaf.js:6589

<a id="api-parallel-83a00300"></a>

## parallel

### parallel(aFunction, numThreads, aAggFunction, aControlMap) : Object

Executes a function in a specific number of threads (each function will receive a corresponding uuid).  The returned result of each function execution is kept in an array. If no aAggFunction is provided this array will be returned, otherwise the array will be passed to the aAggFunction for processing and the corresponding result of aAggFunction will be returned. If no numThreads is provided, the number of threads will be automatically determined. Optionally you can provide a empty map as aControlMap that it will be filled with aControlMap.&#95;&#95;threads with the  threads object, the aControlMap.&#95;&#95;numThreads for the number of threads in use and a thread &#95;&#95;uuid list.

Sources:

- js/openaf.js:6368

<a id="api-parallel4array-0d7c3ed4"></a>

## parallel4Array

### parallel4Array(anArray, aFunction, numThreads, aControlMap, options) : Object

Given `anArray`, divides it in subsets for processing in a specific number of threads. In each thread `aFunction(aValue)`
will be executed for each value in sequence. An array with all the `aFunction` results will be returned. If no `numThreads` is
provided, the number of threads will be automatically determined. Optionally you can provide a empty map as `aControlMap`
that it will be filled with `aControlMap.__threads` with the threads object, the `aControlMap.__numThreads` for the number of
threads in use and a thread `__uuid` list. Example:

```javascript
var count = 0;
var ctrl = {};
var res = parallel4Array(thingsToProcess,
   function(aValue) {
      ctrl.__threads.sync(function() { count++; }) // Sync access to a shared variable
      return processValue(aValue);
   },
   undefined,
   ctrl
);
```

Sources:

- js/openaf.js:6526

<a id="api-parallelarray-ed2d9e30"></a>

## parallelArray

### parallelArray(anArray, aReduceFunction, initValue, aAggFunction, numThreads, aControlMap) : Object

An installed GPU opack may handle calls without an explicit thread count/control map. Set OAF&#95;PFOREACH&#95;GPU=false, &#95;&#95;flags.PFOREACH.useGPU=false or options.useGPU=false to bypass it. Given anArray, divides it in subsets for processing in a specific number of threads. In each thread aReduceFunction(pr, cv, i, arr), where pr = previous result, cv = current value, i = index and arr = array subset, will be executed for each value in sequence. The pr value for the first execution on each thread will have the value initValue if provided. The returned result, in each thread, will be placed into an array. If aAggFunction is defined, the resulting array will be passed to the aAggFunction for processing and the corresponding result of aAggFunction will be returned. If no numThreads is provided, the number of threads will be  automatically determined. Optionally you can provide a empty map as aControlMap that it will be filled with aControlMap.&#95;&#95;threads with the threads object, the aControlMap.&#95;&#95;numThreads for the number of threads in use and a thread &#95;&#95;uuid list.

Sources:

- js/openaf.js:6431

<a id="api-parsehtml2md-b8f9e8f5"></a>

## parseHTML2MD

### parseHTML2MD(aHTMLString, includeScripts) : String

Given an HTML string and a flag indicating whether to include scripts, this function converts the HTML to Markdown.

Sources:

- js/owrap.template.js:1233

<a id="api-persistdbinmem-c8e59005"></a>

## persistDBInMem

### persistDBInMem(aDB, aFilename) : Array

Tries to persist a in-memory database, aDB object, previously created by the function createDBInMem into a SQL aFilename. This can later be used to load again using the loadDBInMem function.

Sources:

- js/openaf.js:7921

<a id="api-pidcheck-48eac372"></a>

## pidCheck

### pidCheck(aPid) : Boolean

Verifies if aPid is running (returning true) or not (returning false).

Sources:

- js/openaf.js:6212

<a id="api-pidcheckin-39fa6439"></a>

## pidCheckIn

### pidCheckIn(aFilename) : boolean

Uses the contents of aFilename to determine if there is an existing process running with the pid  recorded on the file. If it's running it will return false, if not it will return true and record the current pid on the aFilename. The function pidCheckOut will be added as a hook to run on the  end of the current process.

Sources:

- js/openaf.js:6234

<a id="api-pidcheckout-000ad55f"></a>

## pidCheckOut

### pidCheckOut(aFilename) : boolean

Removes the pid information from aFilename and deletes the file if possible.  If successful returns true, if not returns false.

Sources:

- js/openaf.js:6325

<a id="api-pidkill-6d01fa55"></a>

## pidKill

### pidKill(aPidNumber, isForce) : boolean

Tries to terminate a process with aPidNumber. If successful it will return true otherwise it will return false. If necessary, a boolean true value on isForce, will force the termination of the process. When isForce is true, it will also attempt to kill any child processes of the target process.

Sources:

- js/openaf.js:6261

<a id="api-plugin-5e689e2b"></a>

## plugin

### plugin(aPlugin, aClass)

Provides a shortcut for the af.plugin function. It also provides a shortcut for plugins with the java package "openaf.plugins" (e.g. af.plugin("openaf.plugins.HTTP") is the same as plugin("HTTP")). In alternative you can provide plugin aClass if it's different from aPlugin.

Sources:

- js/openaf.js:4163

<a id="api-print-ce953a0e"></a>

## print

### print(aStr)

Prints the `aStr` to the stdout (with a new line on the end) (example: `print("hello world!")`)

Sources:

- js/openaf.js:387

<a id="api-printbars-15371569"></a>

## printBars

### printBars(aFormatString, hSize, aMax, aMin, aIndicatorChar, aSpaceChar) : String

Produces horizontal bars given `aFormatString`, a `hSize` (horizontal max size), `aMax` (the axis max value) and `aMin`
(the axis min value). The `aFormatString` should be composed of `<units> [<function[:color][:legend]> ...]`:

- The units can be: int, dec1, dec2, dec3, dec, bytes and si;
- Each function should return the corresponding current value (optionally it can be a number directly);
- Optionally each color should use any combinations similar to ansiColor (check 'help ansiColor');
- Optionally each legend, if used, will be included in a bottom legend;

Sources:

- js/openaf.js:957

<a id="api-printchart-92ee72a4"></a>

## printChart

### printChart(aFormatString, hSize, vSize, aMax, aMin, dColor) : String

Produces a line chart given `aFormatString`, a `hSize` (horizontal max size), a `vSize` (vertical max size), `aMax` (the axis max value) and `aMin`
(the axis min value). The `aFormatString` should be composed of `<dataset> <units> [<function[:color][:legend]> ...]`:

- The dataset should be an unique name (data can be cleaned with `ow.format.string.dataClean`);
- The units can be: int, dec1, dec2, dec3, dec4, dec, bytes and si;
- Each function should return the corresponding current value (optionally it can be a number directly);
- Optionally each color should use any combinations similar to ansiColor (check 'help ansiColor');
- Optionally each legend, if used, will be included in a bottom legend;

- If function "-min" it will overwrite the `aMin`
- If function "-max" it will overwrite the `aMax`
- If function "-hsize" it will overwrite the `hSize`
- If function "-vsize" it will overwrite the `vSize`

Sources:

- js/openaf.js:749

<a id="api-printchartarray-cb2ee3e5"></a>

## printChartArray

### printChartArray(anArray, aType, hSize, vSize, aMax, aMin, options) : String

Produces and returns a one-shot terminal line chart directly from `anArray`, without calling functions or keeping a named
dataset between calls. Use an array of numbers for one series or an array of arrays of numbers for multiple series. Series
can have different lengths. `aType` controls the y-axis label format and can be: int, dec1, dec2, dec3, dec4, dec, bytes or si.
`hSize` and `vSize` set the chart width and height; when omitted in a console they default to the terminal width and terminal
height minus 5 respectively. `aMax` and `aMin` optionally fix the y-axis bounds; omitted bounds are calculated from the values.

`options` is passed to `ow.format.string.lineChart` and can include:

- `colors` (array) ANSI color specification for each series. Colors are assigned by series order and repeat if fewer colors are provided;
- `label` (boolean) Include y-axis labels (default true);
- `dColor` (string) ANSI color specification for the labels, axes and other default chart elements;
- `offset` (number) Horizontal offset reserved for the y-axis (default 2);
- `padding` (string) String prepended to each chart line (default "");
- `symbols` (array) Ten characters replacing the default line drawing symbols;

Each color accepts the same values and comma-separated combinations as ansiColor (check 'help ansiColor'), including
named foreground/background colors (for example GREEN, FG_CYAN or BG_BLUE), attributes (for example BOLD,GREEN),
256-color forms such as FG(208) or BG(236), and true-color forms such as RGB(80,160,255), FG_RGB(80,160,255) or
BG_RGB(20,20,20). ANSI colors are shown when terminal color support is enabled.

Examples:

```javascript
print(printChartArray([1, 4, 2, 5, 3], "int", 40, 10, 5, 0, { colors: ["GREEN"] }));
print(printChartArray([[1, 2, 3], [3, 2, 1]], "dec1", 40, 10, __, __, { colors: ["BOLD,CYAN", "FG(208)"] }));
```

Sources:

- js/openaf.js:881

<a id="api-printerr-7cf4f3fd"></a>

## printErr

### printErr(aStr)

Prints the `aStr` to the stderr (with a new line on the end) (example: `printErr("Hupps!! A problem!")`)

Sources:

- js/openaf.js:591

<a id="api-printerrnl-bac83078"></a>

## printErrnl

### printErrnl(aStr)

Prints the `aStr` to the stderr (without adding a new line on the end) (example: `printErrnl("Hupps!! A problem!")`)

Sources:

- js/openaf.js:652

<a id="api-printmap-1a3c676f"></a>

## printMap

### printMap(aMap, aWidth, aTheme, useAnsi) : String

Returns a ASCII map representation of aMap optionally with a give aWidth, aTheme and/or useAnsi boolean. aTheme can be "utf" or "plain" depending on the terminal capabilities.

Sources:

- js/openaf.js:1632

<a id="api-printtable-b06ec4de"></a>

## printTable

### printTable(anArrayOfEntries, aWidthLimit, displayCount, useAnsi, aTheme, aBgColor, wordWrap, useRowSep, bandRows) : String

Returns a ASCII table representation of anArrayOfEntries where each entry is a Map with the same keys. Optionally you can specify aWidthLimit, useAnsi, bandRows and/or aBgColor. If you want to include a count of rows just use displayCount = true. If useAnsi = true you can provide a theme (e.g. "utf", "plain" or "borderless"). The "borderless" theme uses two-space column gaps, heavy Unicode header rules and optional light rules between records (useRowSep), including wrapped records

Sources:

- js/openaf.js:1081

<a id="api-printtree-fa71beb1"></a>

## printTree

### printTree(aObj, aWidth, aOptions) : String

Given aObj(ect) will return a tree with the object elements. Optionaly you can specificy aWidth and/or aOptions: noansi (boolean) no ansi character sequences, curved (boolean) for UTF curved characters, wordWrap (boolean) to wrap long string values, compact (boolean) to compact tree lines, fullKeySize (boolean) to pad the each entry key, fullValSize (boolean) to pad the entire key and value and withValues (boolean) to include or not each key values, tableArrays (boolean) to render arrays composed only of non-map/array values (or maps whose fields are all non-map/array values) as a printTable instead of nested tree branches

Sources:

- js/openaf.js:1295

<a id="api-printtreeors-e2b9e8f9"></a>

## printTreeOrS

### printTreeOrS(aObj, aWidth, aOptions) : String

Tries to use printTree with the provided arguments. In case printTree throws an exception (like insufficient width) if will fallback to colorify or stringify (if the noansi option is true).

Sources:

- js/openaf.js:1597

<a id="api-printnl-ba2521b2"></a>

## printnl

### printnl(aStr)

Prints the `aStr` to the stdout (without adding a new line on the end) (example: `printnl("hello world!")`)

Sources:

- js/openaf.js:496

<a id="api-processexpr-dd1fbb31"></a>

## processExpr

### processExpr(aSeparator, ignoreCase, aSource) : Map

Will access the current contents of the OpenAF -e argument (if a different aSource is not defined) looking for pairs of key values in the form "a=5;b=1;c=xpto&#92;&#92;;" and will produce a Map with &#123; "a": 5, "b": 1, "c": "xpto;" &#125;. If no aSeparator is provided ';' will be assumed. &#95;&#95;pmIn values will be also included. If ignoreCase = true all keys will be lower cased.

Sources:

- js/openaf.js:3457

<a id="api-quicksort-14e3aff2"></a>

## quickSort

### quickSort(items, aCompareFunction) : Array

Performs a quick sort algorithm on the items array provided. Optionally aCompareFunction can be provided. The sorted array will be returned.

Sources:

- js/openaf.js:4495

<a id="api-range-2269c0be"></a>

## range

### range(aCount, aStart, aStep) : Array

Generates an array with aCount of numbers starting at 1. Optionally you can provide a different aStart number and/or aStep increment.

Sources:

- js/openaf.js:12476

<a id="api-repeat-25e2b6b1"></a>

## repeat

### repeat(nTimes, aStr) : String

Will build a string composed of aStr repeated nTimes.

Sources:

- js/openaf.js:3073

<a id="api-require-c4d0cf24"></a>

## require

### require(aScript) : Object

Will try to load aScript from the directories specified in the loadRequire function (by default all opack directories plus the current working directory). Returns the exports object manipulated in aScript (note: results are cached)

Sources:

- js/openaf.js:7402

<a id="api-requirecompiled-6b137222"></a>

## requireCompiled

### requireCompiled(aScript, dontCompile, dontLoad) : Object

Loads aScript, through require, previously compile or it will be compiled if (dontCompile is not true). IF dontLoad = true the module exports won't be returned.

Sources:

- js/openaf.js:4083

<a id="api-restartopenaf-d85bf1e4"></a>

## restartOpenAF

### restartOpenAF(aCommandLineArray, preCommandLineArray)

Terminates the current OpenAF execution and tries to start a new with the same command line, if aCommandLineArray is not provided. If aCommandLineArray is provided each array element will be use sequentially to build the command line to start a new OpenAF instance.  preCommandLineArray can be used to provide java arguments if defined.

Sources:

- js/openaf.js:4912

<a id="api-savehelp-8dc71402"></a>

## saveHelp

### saveHelp(aPath, aMapOfFiles)

Given aMapOfFiles mapping subject ids to JavaScript or Java source filenames, each file will be processed for ODoc XML tags and the corresponding ODoc database will be generated on the  provided aPath suitable for offline use.

Sources:

- js/openaf.js:7822

<a id="api-savehelpweb-6f4ad3da"></a>

## saveHelpWeb

### saveHelpWeb(aPath, aMapOfFiles)

Given aMapOfFiles mapping subject ids to JavaScript or Java source filenames, each file will be processed for ODoc XML tags and the corresponding ODoc database will be generated on the  provided aPath suitable for online use.

Sources:

- js/openaf.js:7838

<a id="api-searcharray-ad65a4f1"></a>

## searchArray

### searchArray(anArray, aPartialMap, useRegEx, ignoreCase, useParallel) : Array

Shortcut to ow.obj.searchArray.

Sources:

- js/openaf.js:8063

<a id="api-searchhelp-af8b83fb"></a>

## searchHelp

### searchHelp(aTerm, aPath, anArrayOfIds) : Array

Searches the OpenAF ODoc help system for a specific term. Optionally you can provide a path of where to  search for ODoc help files. A unique result returns an array with one map containing id, key, fullkey and raw text, plus format for explicitly marked entries. Ambiguous results contain id and key only. Matches prefer case-sensitive exact keys, then case-insensitive exact keys, then substrings. Returns an empty array when nothing is found. Optionally restrict by anArrayOfIds.

Sources:

- js/openaf.js:7769

<a id="api-searchkeys-90131557"></a>

## searchKeys

### searchKeys(aObject, aSearchKey, useCase, actFunc) : Map

Traverses aObject looking for key matches, ignoring case if useCase is true, of the regular expression aSearchKey. Each element found is added to the returned Map. The element key will represent the path from aObject to it. Tip: The actFunc  can use ow.obj.setPath to replace a value: "(key, value, path) =&#62; &#123; ow.obj.setPath(aObject, path + '.' + key, replaceValue); &#125;"

Sources:

- js/openaf.js:7982

<a id="api-searchvalues-84ba3946"></a>

## searchValues

### searchValues(aObject, aSearchValue, useCase, actFunc) : Map

Traverse aObject looking for value matches, ignoring case if useCase is true, of the regular expression aSearchKey.  Each value found is added to the returned Map linked to the path representation of where it was found. Optionally you can provide an actFunc that receives the key, value and path. Tip: The actFunc can use ow.obj.setPath to  replace a value: "(key, value, path) =&#62; &#123; ow.obj.setPath(aObject, path + '.' + key, replaceValue); &#125;"

Sources:

- js/openaf.js:8003

<a id="api-setinterval-23a130e1"></a>

## setInterval

### setInterval(aFunction, aPeriod) : String

Tries to execute aFunction every aPeriod milliseconds. Returns an id that can be used to clear the interval with clearInterval. Note: this function uses Threads plugin, so it will execute aFunction in a different thread and it won't block the main thread. Also, do note that the aFunction execution time is not included in the aPeriod, so if aFunction takes 2 seconds to execute and aPeriod is 5 seconds, the next execution will be 5 seconds after aFunction finishes, so it will be 7 seconds after the previous execution start.

Sources:

- js/openaf.js:12439

<a id="api-setlog-e7467b03"></a>

## setLog

### setLog(aMap)

Sets the current log output settings:

- `off` (boolean) Turns off output to stdout/stderr
- `offInfo` (boolean) Turns off output of INFO
- `offError` (boolean) Turns off output of ERROR
- `offWarn` (boolean) Turns off output of WARN
- `dateFormat` (string) `ow.format.fromDate` format for date
- `dateTZ` (string) Time zone to use with `ow.format.fromDate`
- `separator` (string) String to use as separator
- `async` (boolean) Run in async mode
- `profile` (boolean) Gathers memory and system load stats
- `format` (string) Sets the format to output logs (e.g. json, slon, human)

Sources:

- js/openaf.js:2595

<a id="api-setofflinehelp-3a79e1c8"></a>

## setOfflineHelp

### setOfflineHelp(aBoolean)

Forces help (odoc) to be retrieved locally (if aBoolean is true) or reestablishes the normal behaviour of loading local documentation with online fallback and background refresh (if aBoolean is false)

Sources:

- js/openaf.js:7753

<a id="api-settimeout-e5a1f717"></a>

## setTimeout

### setTimeout(aFunction, aPeriod)

Tries to execute `aFunction` after `aPeriod` milliseconds. Note: this function will block the
main thread, so use it with caution. If you need to execute `aFunction` in a different thread and avoid blocking the main thread, please use setInterval with a clearInterval after the first execution.

Example:

```javascript
setTimeout(() => { print("Hello after 2 seconds"); }, 2000);

// or using setInterval to avoid blocking the main thread
var id = setInterval(() => { print("Hello after 2 seconds"); clearInterval(id); }, 2000);
```

Sources:

- js/openaf.js:12414

<a id="api-sh-89c4ec9f"></a>

## sh

### sh(commandArguments, aStdIn, aTimeout, shouldInheritIO, aDirectory, returnMap, callbackFunc, anEncoding, dontWait, envsMap, exitCallback) : String

Executes `commandArguments` (a string or an array of strings) through the operating system shell as a shortcut for `AF.sh`.

- `aStdIn`: optional standard input.
- `aTimeout`: optional execution timeout.
- `shouldInheritIO`: when true, inherits stdout, stderr and stdin from OpenAF. When false or undefined, returns the command's stdout.
- `aDirectory`: optional working directory.
- `envsMap`: a map of strings that replaces the environment variables.
- `returnMap`: when true, returns a map with `stdout`, `stderr` and `exitcode`.

Check `__exitcode` and `__stderr` for the command exit code and stderr output.

When `shouldInheritIO` is false or undefined, `callbackFunc` can receive an output stream, an error stream and an input stream (see `af.sh` for an example). With a callback, stdout and stderr are unavailable in the returned map.

An optional `exitCallback` receives the exit code.

Sources:

- js/openaf.js:8155

<a id="api-sha1-b1565820"></a>

## sha1

### sha1(anObject) : String

Will return of the SHA-1 in hexadecimal format for a given anObject.

For files you can provide a file stream: var s = io.readFileStream(getOpenAFJar()); sha1(s); s.close()

Sources:

- js/openaf.js:3167

<a id="api-sha256-5d5b09f6"></a>

## sha256

### sha256(anObject) : String

Will return of the SHA-256 in hexadecimal format for a given anObject.

For files you can provide a file stream: var s = io.readFileStream(getOpenAFJar()); sha256(s); s.close()

Sources:

- js/openaf.js:3179

<a id="api-sha384-b4dd0ec6"></a>

## sha384

### sha384(anObject) : String

Will return of the SHA-384 in hexadecimal format for a given anObject.

For files you can provide a file stream: var s = io.readFileStream(getOpenAFJar()); sha384(s); s.close()

Sources:

- js/openaf.js:3191

<a id="api-sha512-a3962446"></a>

## sha512

### sha512(anObject) : String

Will return of the SHA-512 in hexadecimal format for a given anObject.

For files you can provide a file stream: var s = io.readFileStream(getOpenAFJar()); sha512(s); s.close()

Sources:

- js/openaf.js:3203

<a id="api-showh2console-1c6a83ae"></a>

## showH2Console

### showH2Console() : Console

Instantiates and returns a H2 Console object openning a browser (if possible) to interact with the H2 Console. With  the returned object you can later invoke .shutdown() or unload it from the console. Invoking a second time will result in a port bind error since it the first instance wasn't shutdown.

Sources:

- js/openaf.js:7907

<a id="api-sleep-0afa5bb5"></a>

## sleep

### sleep(millis, shouldCheck)

Shortcut for af.sleep function. Will pause execution for a given period of time expressed in milliseconds. If shouldCheck is true it will enforce checking if the time has really passed or not.

Sources:

- js/openaf.js:2497

<a id="api-sortmapkeys-cc0e9de4"></a>

## sortMapKeys

### sortMapKeys(aMap, moreLevels) : Map

Tries to sort the first level map keys returning the rewritten map.  If moreLevels=true it will try to recursively map sub maps.

Sources:

- js/openaf.js:14934

<a id="api-splitarray-c72950ff"></a>

## splitArray

### splitArray(anArray, numberOfParts) : Array

Returns the result of the split of anArray into equals numberOfParts (when possible). If numberOfParts is not provided the current result of getNumberOfCores() will be used.

Sources:

- js/openaf.js:6344

<a id="api-splitbysepwithenc-40d33224"></a>

## splitBySepWithEnc

### splitBySepWithEnc(text, separator, enclosures, includeEnclosures) : array

Given a text, a separator, a list of enclosures and a flag includeEnclosures, this function will split the text by the separator while ignoring the separator inside the enclosures. If includeEnclosures is true, the enclosures will be included in the result. If includeEnclosures is false, the enclosures will be removed from the result.

Sources:

- js/openaf.js:3314

<a id="api-splitbyseparator-4bc101f3"></a>

## splitBySeparator

### splitBySeparator(aString, aSeparator) : Array

Splits `aString` using `aSeparator`. Escaped separators are ignored. For example, if `aSeparator` is `;` and
`aString` is `abc\\;def;123`, only the second `;` is treated as a separator.

Sources:

- js/openaf.js:3296

<a id="api-splitkvbyseparator-117fd20f"></a>

## splitKVBySeparator

### splitKVBySeparator(aString, aOptions) : Map

Given `aString` with multiple key/value entries will return a map with the same. Optionally you can provide `aOptions`:

- `sep`: the key/value entries separator (defaults to " ")
- `ksep`: the key separator from a value (defaults to "=")
- `esc`: the escape character (defaults to `"\\"`)
- `qto`: the quote character (defaults to `"\""`)
- `nul`: the null representation (defaults to null)

Sources:

- js/openaf.js:3363

<a id="api-sprint-fb9afa84"></a>

## sprint

### sprint(aStr)

"Stringifies" and prints the `aStr` to the stdout (with a new line on the end) (example: `sprint("hello world!")`)

Sources:

- js/openaf.js:451

<a id="api-sprinterr-81c4fd0b"></a>

## sprintErr

### sprintErr(aStr)

"Stringifies" and prints the `aStr` to the stderr (with a new line on the end) (example: `sprintErr("Hupps!! A problem!")`)

Sources:

- js/openaf.js:608

<a id="api-sprinterrnl-d21dac8c"></a>

## sprintErrnl

### sprintErrnl(aStr)

"Stringifies" and prints the `aStr` to the stderr (without adding a new line on the end) (example: `sprintErrnl("Hupps!! A problem!")`)

Sources:

- js/openaf.js:669

<a id="api-sprintnl-cabd7c76"></a>

## sprintnl

### sprintnl(aStr)

"Stringifies" and prints the `aStr` to the stdout (without adding a new line on the end) (example: `sprintnl("hello world!")`)

Sources:

- js/openaf.js:513

<a id="api-startlog-5ca47bc4"></a>

## startLog

### startLog(externalLogging, hkItems)

Starts collecting log messages logged with log&#42; functions. See stopLog() and dumpLog(). You can also specify externalLogging, a custom channel subscribe function and a different number of hkItems (housekeeping items) from the default 100 (if -1 it won't delete items).

Sources:

- js/openaf.js:2618

<a id="api-stoplog-b922326a"></a>

## stopLog

### stopLog()

Will stop collecting log messages and will reset everything. User dumpLog() before stopping if you intend to keep the recorded log messages.

Sources:

- js/openaf.js:2663

<a id="api-stopopenafandrun-66fc1221"></a>

## stopOpenAFAndRun

### stopOpenAFAndRun(aCommandLineArray, addCommand, redirectOutput, noStop)

Terminates the current OpenAF execution while trying to execute the commands on the aCommandLineArray. Optionally you can use addCommand boolean flag (true) to allow for shell like commands on the current operating system. If redirectOutput is false (default), output is inherited from the parent process. Set redirectOutput to true to redirect output to /dev/null (or NUL on Windows). If noStop is true the current OpenAF execution will not be terminated. To restart OpenAF please use the restartOpenAF function.

Sources:

- js/openaf.js:4870

<a id="api-stringify-fc5e7148"></a>

## stringify

### stringify(anObject, replacer, space) : String

Converts anObject into a string representation of the same. This is equivalent to the JSON.stringify function. If space isn't defined a "  " (2 spaces) is assumed as the default value. Reverts to the beautifier function if it isn't possible to apply stringify to the current object.  To see more info on the remaining parameters please check https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global&#95;Objects/JSON/stringify

Sources:

- js/openaf.js:2191

<a id="api-sync-75c75efe"></a>

## sync

### sync(aFunction, anObject)

Will ensure that aFunction is synchronized, in multi-threaded scripts. Optionally you can provide anObject to synchronized upon.

Sources:

- js/openaf.js:7162

<a id="api-syncfn-77e0a43b"></a>

## syncFn

### syncFn(aFunction, anObject) : Object

Will ensure that aFunction is synchronized, in multi-threaded scripts (alternative to sync). Optionally you can provide anObject to synchronized upon. Returns the result of aFunction.

Sources:

- js/openaf.js:7185

<a id="api-templify-80d182a0"></a>

## templify

### templify(aTemplateString, someData) : String

Using Handlebars and the functionality provided in `ow.template`, will use the `aTemplateString` as a Handlebars template
and return the parsed output. Optionally you can provide `someData` as data for the Handlebars template
otherwise the current scope will be used.

Example:

```javascript
var someText = "Hello World!";
var retText = templify("Hi, {{someText}}"); // Hi, Hello World!
```

Sources:

- js/openaf.js:2471

<a id="api-threadbox-c1e47891"></a>

## threadBox

### threadBox(aExecFunction, aTimeout, aStopFunction)

Tries to execute aExecFunction inside a thread. If aTimeout is defined the thread will be terminated if it's still executing after aTimeout. If aStopFunction is defined  it will receive, as argument, a boolean indicating if the thread has stopped (true). If this function returns true the thread execution will be terminated, if false will continue.

Note: see threadBoxCtrlC as aStopFunction to stop executing on Ctrl-C

Sources:

- js/openaf.js:8669

<a id="api-threadboxctrlc-58fb5f54"></a>

## threadBoxCtrlC

### threadBoxCtrlC() : Boolean

Meant to be use as a stopFunction for threadBox will return true if Ctrl-C is detected and false otherwise. If the current terminal can't support ANSI if will default to false.

Sources:

- js/openaf.js:12390

<a id="api-tlog-f563a8b7"></a>

## tlog

### tlog(msg, someData, formatOptions)

Outputs to the current stdout a line composed of the current date, indication of INFO and the provided msg using the templify function. Optionally you can provide also someData and you can provide a formatOptions map for overriding the defaults from setLog. Note: you can use startLog, stopLog and dumpLog to keep an internal record of theses messages.

Sources:

- js/openaf.js:2756

<a id="api-tlogerr-97accb21"></a>

## tlogErr

### tlogErr(msg, someData, formatOptions)

Outputs to the current stderr a line composed of the current date, indication of ERROR and the provided msg using the templify function. Optionally you can provide a formatOptions map for overriding the defaults from setLog.  Optinionally you can provide also someData.

Sources:

- js/openaf.js:2997

<a id="api-tlogwarn-e7028368"></a>

## tlogWarn

### tlogWarn(msg, someData, formatOptions)

Outputs to the current warning in a line composed of the current date, indication of WARN and the provided msg using the templify function. Optionally you can provide a formatOptions map for overriding the defaults from setLog.  Optinionally you can provide also someData.

Sources:

- js/openaf.js:3009

<a id="api-tlognl-4eac55d3"></a>

## tlognl

### tlognl(msg, someData, formatOptions)

Outputs to the current stdout, without a new line, a sentence composed of the current date, indication of INFO and the provided msg using the templify function. Optionally you can provide a formatOptions map for overriding the defaults from setLog. Optinionally you can provide also someData.

Sources:

- js/openaf.js:2841

<a id="api-toboolean-cb5aa54d"></a>

## toBoolean

### toBoolean(aObj) : Boolean

Tries to convert aObj (String, Number or Boolean) into a boolean value

Sources:

- js/openaf.js:7022

<a id="api-tocsv-673efd9b"></a>

## toCSV

### toCSV(anArray) : CSV

Converts a given javascript anArray into a CSV object instance.

Sources:

- js/openaf.js:2542

<a id="api-toencoding-55411312"></a>

## toEncoding

### toEncoding(aString, anEncoding) : String

Converts the provided aString to a different anEncoding (by default UTF-8).

Sources:

- js/openaf.js:8516

<a id="api-tprint-eae516ca"></a>

## tprint

### tprint(aTemplateString, someData)

Using Handlebars and the functionality provided in `ow.template`, will use the `aTemplateString` as a Handlebars template
and print the parsed output. Optionally you can provide `someData` as data for the Handlebars template
otherwise the current scope will be used.

Example:

```javascript
var someText = "Hello World!";
tprint("Hi, {{someText}}"); // Hi, Hello World!
```

Sources:

- js/openaf.js:570

<a id="api-tprinterr-27bbc00d"></a>

## tprintErr

### tprintErr(aTemplateString, someData)

Using Handlebars and the functionality provided in `ow.template`, will use the `aTemplateString` as a Handlebars template
and print, to the stderr, the parsed output. Optionally you can provide `someData` as data for the Handlebars template
otherwise the current scope will be used.

Example:

```javascript
var someText = "Hello World!";
tprintErr("Hi, {{someText}}"); // Hi, Hello World!
```

Sources:

- js/openaf.js:728

<a id="api-tprinterrnl-67236619"></a>

## tprintErrnl

### tprintErrnl(aTemplateString, someData)

Using Handlebars and the functionality provided in `ow.template`, will use the `aTemplateString` as a Handlebars template
and print, to the stderr without new line, the parsed output. Optionally you can provide `someData` as data for the Handlebars template
otherwise the current scope will be used.

Example:

```javascript
var someText = "Hello World!";
tprintErrnl("Hi, {{someText}}"); // Hi, Hello World!
```

Sources:

- js/openaf.js:706

<a id="api-tprintln-7c4f718f"></a>

## tprintln

### tprintln(aTemplateString, someData)

Using Handlebars and the functionality provided in `ow.template`, will use the `aTemplateString` as a Handlebars template
and print, without a new line, the parsed output. Optionally you can provide `someData` as data for the Handlebars template
otherwise the current scope will be used.

Example:

```javascript
var someText = "Hello World!";
tprintln("Hi, {{someText}}"); // Hi, Hello World!
```

Sources:

- js/openaf.js:548

<a id="api-traverse-13a170f0"></a>

## traverse

### traverse(aObject, aFunction) : Map

Traverses aObject executing aFunction for every single element. The aFunction will receive the arguments: aKey, aValue, aPath, aObject.

Sources:

- js/openaf.js:7943

<a id="api-uncompress-2da5c89e"></a>

## uncompress

### uncompress(aResultOfTheCompressFunction) : Object

Uncompresses a JSON object, compressed by using the compress function, into a JSON object.

Sources:

- js/openaf.js:6838

<a id="api-uniqarray-c3589af6"></a>

## uniqArray

### uniqArray(anArray) : Array

Returns anArray with no duplicates entries (including duplicate maps).

Sources:

- js/openaf.js:4854

<a id="api-utf8-941b7ecd"></a>

## utf8

### utf8(aString) : String

Converts the provided aString into UTF-8 encoding.

Sources:

- js/openaf.js:8527

<a id="api-visiblelength-c819c6a4"></a>

## visibleLength

### visibleLength(aString) : Number

More complete af.visibleLength function

Sources:

- js/openaf.js:5122

<a id="api-watch-baed8316"></a>

## watch

### watch(waitFor, aCommand, beautifyFlag, noPrint)

Executes javascript aCommand provided every waitFor periods of time (expressed in ms). The screen will be cleared and the execution will repeat indefinitely until the 'q' key is pressed.  Optionally a beautifyFlag can be provided to execute the beautifier function on the aCommand result.

Sources:

- js/openaf.js:4445

<a id="api-wedodate-da5b2054"></a>

## wedoDate

### wedoDate(year, month, day, hour, minute, second, ms) : Map

Builds and returns a wedoDate JSON object given either a year, a month, a day, a hour, a minute, a second and ms or a Date object.

Sources:

- js/openaf.js:2160

<a id="api-yprint-0f505dae"></a>

## yprint

### yprint(aObj, multidoc, sanitize, shouldColor)

Prints aObj in YAML. If multiDoc = true and aJson is an array the output will be multi-document. If sanitize = true all Java objects will be converted to avoid parsing errors.

Sources:

- js/openaf.js:488

<a id="api-yprinterr-1dba525e"></a>

## yprintErr

### yprintErr(aObj, multidoc)

Prints aObj in YAML to stderr. If multiDoc = true and aJson is an array the output will be multi-document.

Sources:

- js/openaf.js:644

