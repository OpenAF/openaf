# ow.obj

[Home](../../index.md) / [All APIs](../../all-apis.md) / [ow](../index.md) / [ow.obj](index.md)

## Subcategories

- [ow.obj.big](big/index.md)
- [ow.obj.http](http/index.md)
- [ow.obj.http0](http0/index.md)
- [ow.obj.pmSchema](pmschema/index.md)
- [ow.obj.pool](pool/index.md)
- [ow.obj.rest](rest/index.md)
- [ow.obj.socket](socket/index.md)
- [ow.obj.syncArray](syncarray/index.md)
- [ow.obj.syncMap](syncmap/index.md)

<a id="api-ow-obj-diff-aff90518"></a>

## ow.obj.diff

### ow.obj.diff(aOriginalJSON, aFinalJSON, optionsMap) : String

Produces a string representation of the difference between `aOriginalJSON` and `aFinalJSON`.

Use `optionsMap` to control the output:

- `printColor: true`: immediately prints with ANSI colors when available.
- `justAnsi: true`: produces ANSI color codes without printing.
- `justChanges: true`: represents only the changed lines with the rest.
- `justDiff: true`: includes only the changed lines.

Sources:

- js/owrap.obj.js:1677

<a id="api-ow-obj-filter-bbd79793"></a>

## ow.obj.filter

### ow.obj.filter(anObject, aMap) : Object

Given `anObject` (either a map or array) will use `$from` with the options on `aMap` basically making all `$from` options map parameters.
If a "path" string is included it will fallback to `$path`. Example:

```yaml
filter:
  #fromKey: arr
  where:
  - cond: equals
    args:
    - isFile
    - true
  transform:
  - func: attach
    args:
    - lastAccess
    - !!js/eval elem => new Date(elem.lastAccess)
  - func: sort
    args:
    - "-size"
  select:
    filename: n/a
    size    : -1
  #selector:
  #  func: at
  #  args:
  #  - 0
```

Sources:

- js/owrap.obj.js:610

<a id="api-ow-obj-filterkeys-3a871442"></a>

## ow.obj.filterKeys

### ow.obj.filterKeys(anArrayKeyNames, aMap) : Map

Given aMap will return an equivalent Map with only the keys contained in the anArrayKeyNames. Note: doesn't traverse existing sub-maps.

Sources:

- js/owrap.obj.js:680

<a id="api-ow-obj-flatmap-4a4e86cb"></a>

## ow.obj.flatMap

### ow.obj.flatMap(data, separator) : Array/Map

Given data as an array of maps or a single map tries to produce an output with only one level of keys per map. Optionally you can provide a separator between parent keys and each key (defaults to '.').

Sources:

- js/owrap.obj.js:260

<a id="api-ow-obj-flatten-435ce8cb"></a>

## ow.obj.flatten

### ow.obj.flatten(arrayOfMaps, aSeparator, aNADefault) : Array

Converts any structured arrayOfMaps into a flat array of maps with only one level of keys. The map key path will be converted into a single key using aSeparator (defaults to "&#95;") and the value will be represented as aNADefault (defaults to "") when no  value or key exists in other entries. For each array entry a new array element will be created replicated all other keys. Useful to convert data to output into CSV for example. Nested arrays of scalar values use the full parent path as their column name. aSeparator is literal, including regular-expression characters.

Sources:

- js/owrap.obj.js:325

<a id="api-ow-obj-fromarray2db-9e74dce9"></a>

## ow.obj.fromArray2DB

### ow.obj.fromArray2DB(anArray, aDB, aDBTable, useParallel, caseSensitive, errorFn) : Number

Given anArray composed of maps where each key is a field name tries to insert into the aDBTable for a provided aDB. Optionally you can specify how many threads should be used with useParallel and use the case sensitive name of fields with caseSensitive = true. The errorFn, if defined, will be called with the exception, the sql statement and the value that caused the exception. This function doesn't perform any database commit. Returns the number of records inserted. (available after ow.loadObj())

Sources:

- js/owrap.obj.js:75

<a id="api-ow-obj-fromarray2obj-31feed08"></a>

## ow.obj.fromArray2Obj

### ow.obj.fromArray2Obj(anArray, aKey, dontRemove) : Array

Tries to create a map of maps from the provided `anArrays`. Optionally if `aKey` is provided
it will be used to create the map keys (otherwise will fallback to "row[number]"). And can also
optionally indicate by `dontRemove` = true that `aKey` shouldn't be removed from each map.

```javascript
var a = [
  { "abc": "123", "xpt": "000", "key": "A1" },
  { "abc": "456", "xpt": "001", "key": "A2" },
  { "abc": "789", "xpt": "002", "key": "A3" }
]

fromArray2Obj(a, "key");
// {
//   "A1": { "abc": "123", "xpt": "000" },
//   "A2": { "abc": "456", "xpt": "001" },
//   "A3": { "abc": "789", "xpt": "002" }
// }
```

Sources:

- js/owrap.obj.js:699

<a id="api-ow-obj-fromarray2orderedobj-2b27cd69"></a>

## ow.obj.fromArray2OrderedObj

### ow.obj.fromArray2OrderedObj(anArray) : Map

Converts the provided anArray into a Map where each array entry is converted to a map entry  which ordered will provide the same ordering found on the array. (available after ow.loadObj())

Sources:

- js/owrap.obj.js:205

<a id="api-ow-obj-fromdbrs-15191e6e"></a>

## ow.obj.fromDBRS

### ow.obj.fromDBRS(aDB, aSQL, anArrayOfBinds, aFunction, anErrorFunction)

Given a connected aDB the query aSQL will be executed (using the anArrayOfBinds) and the corresponding result set will be iterated. For each row the aFunction will be  called with the result of ow.obj.fromDBRS2Obj with doDates = true. If the function returns false the result set iteration will be immediatelly stopped. Any exception  thrown by aFunction will be handled by anErrorFunction (by default throws the exception).

Sources:

- js/owrap.obj.js:48

<a id="api-ow-obj-fromdbrs2obj-4740860e"></a>

## ow.obj.fromDBRS2Obj

### ow.obj.fromDBRS2Obj(aDBRS, doDates) : Map

Converts a Java database result set object (retrieved with DB.qsRS) into a map where the key is the name of the field in upper case. Optionally doDates will convert any SQL dates into javascript Date objects.

Sources:

- js/owrap.obj.js:11

<a id="api-ow-obj-fromjson-d3d7ca9a"></a>

## ow.obj.fromJson

### ow.obj.fromJson(aJson) : Object

Creates an object or objects, using the `aJson` and the indication of the object prototypes to use. This is based on JMix from
https://github.com/khayll/jsmix.
Example:

```javascript
var Point = function() {};
Point.prototype.getX = function() { return this.x; }
Point.prototype.getY = function() { return this.y; }

ow.obj.fromJson({ x: 1, y: 2 }).withObject(Point.prototype).build().getX(); // 1

var mylines = { "lines": [
   { "name": "line 1", "points": [ { x: 0, y: 0}, { x: 5, y: 6} ] },
   { "name": "line 2", "points": [ { x: -5, y: -5}, { x: 1, y: 3} ] },
]};

var res = ow.obj.fromJson(mylines).withObject(Point.prototype, "lines.*.points.*").build();
res.lines[1].points[1].getY(); // 3
```

Sources:

- js/owrap.obj.js:1565

<a id="api-ow-obj-fromobj2array-d147e9e4"></a>

## ow.obj.fromObj2Array

### ow.obj.fromObj2Array(anObj, aKey) : Array

Tries to create an array of maps from the provided `anObj` map of maps. Optionally if `aKey` is provided
it will be added to each array map with the map key. Example:

```javascript
var a = {
   "A1": { "abc": "123", "xpt": "000" },
   "A2": { "abc": "456", "xpt": "001" },
   "A3": { "abc": "789", "xpt": "002" }
}

fromObj2Array(a, "key");
// [
//  { "key": "A1", "abc": "123", "xpt": "000" },
//  { "key": "A2", "abc": "456", "xpt": "001" },
//  { "key": "A3", "abc": "789", "xpt": "002" }
// ]
```

Sources:

- js/owrap.obj.js:570

<a id="api-ow-obj-fromobj2dbtablecreate-0da7b011"></a>

## ow.obj.fromObj2DBTableCreate

### ow.obj.fromObj2DBTableCreate(aTableName, aMapOrArray, aOverrideMap, enforceCase) : String

Returns a DB table create, for aTableName, from the provided aMapOrArray (only a few entries) key entries. To override the default field type guessing a aOverrideMap can  be provided with field entries and the corresponding type as value. Optionally if enforceCase = true table name and fields names will be enforced case by using double quotes.

Sources:

- js/owrap.obj.js:126

<a id="api-ow-obj-fromorderedobj2array-eb8eacb1"></a>

## ow.obj.fromOrderedObj2Array

### ow.obj.fromOrderedObj2Array(aMap, aKeySortFunction) : Array

Converts a provided aMap into an array where each element will be composed from the maps entries ordered by the corresponding key. Optionally you can provide aKeySortFunction that will accept two arguments and work similarly to javascript's array sorting functions. (available after ow.loadObj())

Sources:

- js/owrap.obj.js:224

<a id="api-ow-obj-fuzzysearch-f28c40d3"></a>

## ow.obj.fuzzySearch

### ow.obj.fuzzySearch(anArrayOfKeys, anArrayOfObjects, searchString, fuseOptions) : Array

Given `anArrayOfObjects` (similar objects) will fuzzy search the `searchString` on the values for the keys in `anArrayOfKeys`.
Returns an array of the most probable objects to match the `searchString` (you can use `fuseOptions` = { shouldSort: true } to
ensure that the array is ordered by score).
It uses the FuseJS library internally so `fuseOptions` can be used to add more options (check more in http://fusejs.io/).

For example:

```javascript
ow.obj.fuzzySearch(["n"], [{n: "World War I"}, {n: "World War II"}, {n: "Name a war"}, {n: "Name some war"}], "world");
```

Sources:

- js/owrap.obj.js:435

<a id="api-ow-obj-getpath-0354644c"></a>

## ow.obj.getPath

### ow.obj.getPath(aObject, aPath) : Object

Given `aObject`, retrieves the value at `aPath` using dot notation or unquoted bracket indexes.
Returns undefined if a key is absent or an intermediate value is null, undefined or a scalar.
A null or scalar at the final path segment is returned unchanged. Example:

```javascript
var a = { a : 1, b : { c: 2, d: [0, 1] } };

print(ow.obj.getPath(a, "b.c")); // 2
sprint(ow.obj.getPath(a, "b.d")); // [0, 1]
print(ow.obj.getPath(a, "b.d[0]")); // 0
```

Sources:

- js/owrap.obj.js:3310

<a id="api-ow-obj-http-8655c780"></a>

## ow.obj.http

### ow.obj.http(aURL, aRequestType, aIn, aRequestMap, isBytes, aTimeout, returnStream, options) : Object

Creates a new instance of an HTTP client to be used to execute a request to `aURL` using `aRequestType` (GET, POST, PUT, DELETE, HEAD, PATCH, OPTIONS, TRACE).
Optionally you can provide `aIn` (the body of the request), `aRequestMap` (a map with the headers), `isBytes` (if the body is bytes), `aTimeout` (timeout in milliseconds),
`returnStream` (if the response should be a stream) and `options`, a map with the following keys:

- `timeout`: the connection timeout in milliseconds
- `readTimeout`: the read timeout in milliseconds
- `writeTimeout`: the write timeout in milliseconds
- `callTimeout`: the call timeout in milliseconds
- `followRedirects`: if should follow redirects
- `followSslRedirects`: if should follow ssl redirects
- `delayBuild`: if should delay the build of the client

Example:

```javascript
var http = ow.obj.http("http://www.google.com", "GET");
var res = http.exec();
```

Sources:

- js/owrap.obj.js:1834

<a id="api-ow-obj-issigned-b0f95887"></a>

## ow.obj.isSigned

### ow.obj.isSigned(aMap) : boolean

Verifies if the provided aMap was signed with ow.obj.sign function.

Sources:

- js/owrap.obj.js:3415

<a id="api-ow-obj-key2array-0bd0119c"></a>

## ow.obj.key2array

### ow.obj.key2array(aMap, aREMatch, outkey, removeEmptys) : Object

Given aMap will return an array of values where the keys match the aREMatch regular expression. Optionally you can provide an outkey to have return map with a key with the resulting array. If removeEmptys is true it will remove any undefined, null or empty values.

Sources:

- js/owrap.obj.js:535

<a id="api-ow-obj-oneof-ae5c2117"></a>

## ow.obj.oneOf

### ow.obj.oneOf(anArray, aWeightField) : Object

Chooses a random object from the provided anArray. If aWeightField is provided that field should be  present in each object of anArray and it will be used to "weight" the probability of that element being choosen randomly.

Sources:

- js/owrap.obj.js:4291

<a id="api-ow-obj-oneoffn-3f14d1a2"></a>

## ow.obj.oneOfFn

### ow.obj.oneOfFn(anArrayFn, aWeightField) : Object

Equivalent to ow.obj.oneOf but each object is expected to have a field "fn" which should be a function. A random  object will be choosen and the corresponding function (fn) will be called. If aWeightField is provided that field should be  present in each object of anArray and it will be used to "weight" the probability of that element being choosen randomly.

Sources:

- js/owrap.obj.js:4311

<a id="api-ow-obj-randomdaterange-f4af80ac"></a>

## ow.obj.randomDateRange

### ow.obj.randomDateRange(aFormat, aMin, aMax) : Date

Generates a random date between `aMin` date string and `aMax` date string which the corresponding format is determined
by `aFormat`. For example:

```javascript
randomDateRange("yyyyMMdd hhmm", "19991231 2300", "20000101 0200");
```

Sources:

- js/owrap.obj.js:4343

<a id="api-ow-obj-randomrange-81f23d1d"></a>

## ow.obj.randomRange

### ow.obj.randomRange(min, max) : Number

Generates a random long number between min and max.

Sources:

- js/owrap.obj.js:4333

<a id="api-ow-obj-reorderarraymap-6be0aca9"></a>

## ow.obj.reorderArrayMap

### ow.obj.reorderArrayMap(aKs, aArray, removeUnDefs) : Array

Given an array of keys (aKs) will project those for all maps in aArray (the ones not included with be included after). Optionally if removeUnDefs = true it will not include keys with undefined fields (evaluated for every map in the array).

Sources:

- js/owrap.obj.js:296

<a id="api-ow-obj-schemaadd-d35bc30a"></a>

## ow.obj.schemaAdd

### ow.obj.schemaAdd(aKey, aSchema)

Registers a JSON Schema under aKey in its selected draft engine. Keys and root $ids cannot collide across drafts. Register referenced schemas in the same draft before compiling a schema that uses them.

Sources:

- js/owrap.obj.js:3957

<a id="api-ow-obj-schemacheck-840a0ea0"></a>

## ow.obj.schemaCheck

### ow.obj.schemaCheck(aSchema) : Boolean

Checks whether aSchema is valid in its selected dialect, returning true/false. Unsupported dialects and configuration errors are thrown; this does not validate application data.

Sources:

- js/owrap.obj.js:4012

<a id="api-ow-obj-schemacompile-46ff050a"></a>

## ow.obj.schemaCompile

### ow.obj.schemaCompile(aSchema) : Function

Compiles a JSON Schema into a reusable validator returning true/false with details in its errors property. The root $schema selects the draft; absent means draft-07. Compilation errors are thrown.

Sources:

- js/owrap.obj.js:3928

<a id="api-ow-obj-schemacreate-39665c7d"></a>

## ow.obj.schemaCreate

### ow.obj.schemaCreate(aOptions) : Map

Creates independent JSON Schema engines without changing global schema options or registrations.
`aOptions` overrides the engine options; coercion, default insertion and additional-property removal
are disabled by default.

The returned object exposes:

- `inspect(schema, value)`: returns a detached `{valid, errors}` snapshot.
- `schemaCompile(schema)`: returns a validator with thread-local `errors`.
- `schemaValidate(schema, value)`: returns `true` or throws on invalid data.
- `schemaAdd(key, schema)`: registers a schema and returns this engine wrapper.
- `schemaRemove(key)`: removes schemas and clears compiled caches.

Sources:

- js/owrap.obj.js:4411

<a id="api-ow-obj-schemagenerator-1a87cab6"></a>

## ow.obj.schemaGenerator

### ow.obj.schemaGenerator(aJson, aId, aRequiredArray, aDescriptionTmpl) : Map

Given `aJson`, tries to generate a base [JSON Schema](http://json-schema.org/understanding-json-schema/index.html), with an optional `aId` and descriptions based on `aDescriptionTmpl`.

The description template accepts `id`, `required`, `json`, `_detail` (a boolean indicating when the template is used for items), `type`, `format` and `key`.

The generator emits draft-07 and infers array items from the first sample item. Review the result and validate it with `schemaCheck`.

Special notation:

- Regular expression: a string starting and ending with `/`.
- Numeric range: use `[` (inclusive) or `]` (exclusive), for example `"[2, 4["`.
- Enumeration: wrap a string representing an array of values in `(` and `)`, for example `"([ 'red', 'blue', 'green' ])"`.

Sources:

- js/owrap.obj.js:4054

<a id="api-ow-obj-schemainit-b593636d"></a>

## ow.obj.schemaInit

### ow.obj.schemaInit(aOptions)

Initializes JSON Schema validation once per process. Without options, enables $data, $comment and useDefaults (which can modify validated data). Explicit options replace these defaults; later calls do not reconfigure it. Schemas select draft-07 (the default), draft-2019-09 or draft-2020-12 through $schema. See https://ajv.js.org/options.html and docs/json-schema.md for options and compatibility notes.

Sources:

- js/owrap.obj.js:3814

<a id="api-ow-obj-schemaremove-6cc08108"></a>

## ow.obj.schemaRemove

### ow.obj.schemaRemove(aKey)

Removes schemas by key/$id, regular expression, or schema object across the draft engines. Without aKey, removes all application schemas, retaining built-in meta-schemas and initialization options.

Sources:

- js/owrap.obj.js:3979

<a id="api-ow-obj-schemasamplegenerator-7eaf7afa"></a>

## ow.obj.schemaSampleGenerator

### ow.obj.schemaSampleGenerator(aJsonSchema) : Map

Tries to generate a sample JSON map based on the provided aJsonSchema. There is no guarantee that the generated sample is valid.

Sources:

- js/owrap.obj.js:4186

<a id="api-ow-obj-schemavalidate-d4320f2c"></a>

## ow.obj.schemaValidate

### ow.obj.schemaValidate(aSchema, aData, aErrorOptions) : boolean

Validates data against a schema object or registered key/$id. Returns true on success; throws an error string on invalid data. aErrorOptions supports dataVar (default args) and separator. Defaults can modify aData. For boolean validation use schemaCompile(aSchema)(aData). See docs/json-schema.md.

Sources:

- js/owrap.obj.js:4023

<a id="api-ow-obj-searcharray-9d9035a3"></a>

## ow.obj.searchArray

### ow.obj.searchArray(anArray, aPartialMap, useRegEx, ignoreCase, useParallel) : Array

Searches `anArray` of maps for entries where `aPartialMap` matches. If `useRegEx` is true all string entries
on `aPartialMap` will be interpreted as regular expressions. For number entries on the original map you can
have the prefixes `>`, `<`, `>=` and `<=` to limit the numeric values. The complete comparison must
contain a signed or unsigned number, optionally with decimals or an exponent (for example, `>=-1.5`).
Comparisons accept numbers and numeric strings; missing, null, boolean and nonnumeric values do not match.
Other string patterns remain regular expressions. Optionally you can provide also
`ignoreCase` = true to ignore case (will only affect if `useRegEx` is true). And optionally also `useParallel` to
provide the number of threads to use. Example:

```javascript
ow.obj.searchArray(io.listFiles("/usr/bin").files, { "isFile": true, "filename": "^cal.*", "size": ">=32000" }, true, true);

// you can use it, for example, in conjunction with jLinq
$from(ow.obj.searchArray(listFilesRecursive("/usr/lib"), { "filepath": "/usr/lib/ruby", "size": ">100000" }, true)).sort("size").select();

// to refer to a sub map value
ow.obj.searchArray(students, { "details.age": "<=25", "details.isMale": true }, true);
```

(available after `ow.loadObj()`)

Sources:

- js/owrap.obj.js:462

<a id="api-ow-obj-setftpproxy-4270595c"></a>

## ow.obj.setFTPProxy

### ow.obj.setFTPProxy(aHost, aPort, anArrayNonProxyHosts)

Sets the current java FTP proxy to aHost, aPort and optional sets anArrayNonProxyHosts (see more in https://docs.oracle.com/javase/8/docs/technotes/guides/net/proxies.html). If no values are provided all ftp proxy settings, if any, are cleared out.

Sources:

- js/owrap.obj.js:1780

<a id="api-ow-obj-sethttpproxy-0765c0ee"></a>

## ow.obj.setHTTPProxy

### ow.obj.setHTTPProxy(aHost, aPort, anArrayNonProxyHosts)

Sets the current java HTTP proxy to aHost, aPort and optional sets anArrayNonProxyHosts (see more in https://docs.oracle.com/javase/8/docs/technotes/guides/net/proxies.html). If no values are provided all http proxy settings, if any, are cleared out.

Sources:

- js/owrap.obj.js:1736

<a id="api-ow-obj-sethttpsproxy-abca8a41"></a>

## ow.obj.setHTTPSProxy

### ow.obj.setHTTPSProxy(aHost, aPort, anArrayNonProxyHosts)

Sets the current java HTTPS proxy to aHost, aPort and optional sets anArrayNonProxyHosts (see more in https://docs.oracle.com/javase/8/docs/technotes/guides/net/proxies.html). If no values are provided all https proxy settings, if any, are cleared out.

Sources:

- js/owrap.obj.js:1758

<a id="api-ow-obj-setpath-253ff6f7"></a>

## ow.obj.setPath

### ow.obj.setPath(aObject, aPath, aNewValue) : Object

Given `aObject` it will try to parse the `aPath` a set the corresponding object under that path to `aNewValue`. Example:

```javascript
var a = { a : 1, b : { c: 2, d: [0, 1] } };

sprint(ow.obj.setPath(a, "b.c", 123)); // { a : 1, b : { c: 123, d: [0, 1] } }
```

Sources:

- js/owrap.obj.js:3348

<a id="api-ow-obj-setsocksproxy-62a341ae"></a>

## ow.obj.setSOCKSProxy

### ow.obj.setSOCKSProxy(aHost, aPort, aUser, aPass)

Sets the current java SOCKS proxy to aHost, aPort and optional sets aUser and aPass (see more in https://docs.oracle.com/javase/8/docs/technotes/guides/net/proxies.html). If no values are provided all scoks proxy settings, if any, are cleared out.

Sources:

- js/owrap.obj.js:1802

<a id="api-ow-obj-sign-5c9d710a"></a>

## ow.obj.sign

### ow.obj.sign(aKey, aMap, aHashName, aHashFunction) : Map

Given aMap and aKey will return a signed aMap using aHashFunction (defaults to sha512) with the hash algorithm indication aHashName (defaults to 'sha512'). The signed aMap can later be verified with ow.obj.signVerify.

Sources:

- js/owrap.obj.js:3388

<a id="api-ow-obj-signverify-362b456d"></a>

## ow.obj.signVerify

### ow.obj.signVerify(aKey, aMap) : boolean

Verifies the signature of a signed aMap with ow.obj.sign function given aKey. Returns true if the signature is valid. Supported hash functions of ow.obj.sign: sha512, sha384 and sha256.

Sources:

- js/owrap.obj.js:3432

<a id="api-ow-obj-syncarray-5a0fa369"></a>

## ow.obj.syncArray

### ow.obj.syncArray(anArray) : ow.obj.syncArray

Creates an instance of a thread-safe array/list. Optionally it can be initialized with anArray.

Sources:

- js/owrap.obj.js:3631

<a id="api-ow-obj-syncmap-38570565"></a>

## ow.obj.syncMap

### ow.obj.syncMap(aMap) : ow.obj.syncMap

Creates an instance of a thread-safe map. Optionally it can be initialized with aMap.

Sources:

- js/owrap.obj.js:3468

