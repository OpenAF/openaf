# AF

[Home](../index.md) / [All APIs](../all-apis.md) / [AF](index.md)

<a id="api-af-encrypttext-d8572a60"></a>

## AF.encryptText

### AF.encryptText()

Interactevly asks to enter a text and then uses af.encrypt to print to stdout the result.

Sources:

- js/openaf.js:14305

<a id="api-af-endopenafandstart-0e9dd474"></a>

## AF.endOpenAFAndStart

### AF.endOpenAFAndStart(aCommandLineArray, noStop, redirectOutput)

Calls endOpenAFAndStart to start a detached process and then end the current OpenAF execution. noStop=true can be used to avoid exiting the current OpenAF process. If redirectOutput is true (default), output is redirected to /dev/null on Unix (on Windows output is always visible). Set redirectOutput to false to keep the output visible.

Sources:

- js/openaf.js:14313

<a id="api-af-endopenafandstartopenaf-4fd97509"></a>

## AF.endOpenAFAndStartOpenAF

### AF.endOpenAFAndStartOpenAF(aCommandLineArray, preCommandLineArray, noStop, redirectOutput)

Calls endOpenAFAndStartOpenAF to detach and start another OpenAF with current arguments plus extras. If redirectOutput is true (default), output is redirected to /dev/null on Unix (on Windows output is always visible). Set redirectOutput to false to keep the output visible.

Sources:

- js/openaf.js:14326

<a id="api-af-fromjsslon-ae7a936f"></a>

## AF.fromJSSLON

### AF.fromJSSLON(aString) : Object

Tries to convert the provided aString into an object. The string might be JSON or SLON.

Sources:

- js/openaf.js:13773

<a id="api-af-fromjavaarray-86d677ec"></a>

## AF.fromJavaArray

### AF.fromJavaArray(aJavaArray) : Array

Tries to convert aJavaArray into a native an array.

Sources:

- js/openaf.js:13074

<a id="api-af-fromnlinq-bf5fb938"></a>

## AF.fromNLinq

### AF.fromNLinq(aString) : Map

Converts a nLinq chained command line string representation into a suitable map to be used with $from.query.

Sources:

- js/openaf.js:13795

<a id="api-af-fromslon-e259cf93"></a>

## AF.fromSLON

### AF.fromSLON(aString) : Map

Converts a SLON (https://github.com/nmaguiar/slon) string representation into the original map.

Sources:

- js/openaf.js:13760

<a id="api-af-fromsql-8a7ad674"></a>

## AF.fromSQL

### AF.fromSQL(aString) : Map

Converts a SQL expression into an ASP map.

Sources:

- js/openaf.js:13808

<a id="api-af-fromsql2nlinq-5ad93570"></a>

## AF.fromSQL2NLinq

### AF.fromSQL2NLinq(aSQL) : Map

Converts a SQL expression into a suitable map to be used with $from.query.

Sources:

- js/openaf.js:13821

<a id="api-af-fromtoon-102660d7"></a>

## AF.fromTOON

### AF.fromTOON(aTOONStr, alternative) : Object

Tries to parse aTOONStr into a javascript object. If alternative = true (or, if unset, defaults to &#95;&#95;flags.ALTERNATIVES.fromTOON) a native Java TOON engine will be used instead of the bundled Javascript one (faster and lower memory footprint on bigger payloads).

Sources:

- js/openaf.js:13381

<a id="api-af-fromyaml-ba596bc7"></a>

## AF.fromYAML

### AF.fromYAML(aYaml) : Object

Tries to parse aYaml into a javascript map.

Sources:

- js/openaf.js:13398

<a id="api-af-getencoding-0ac20bfd"></a>

## AF.getEncoding

### AF.getEncoding(anArrayOfBytesORString) : String

Given anArrayOfBytesORString will try to detect which encode is used and returns a string with the identified charset encoding.

Sources:

- js/openaf.js:13122

<a id="api-af-printstacktrace-d9733d50"></a>

## AF.printStackTrace

### AF.printStackTrace(aFunction) : Object

Executes aFunction but if it throws an exception and the exception is a Java exception it will print the exception's stack trace.

Sources:

- js/openaf.js:13105

<a id="api-af-protectsystemexit-409f8373"></a>

## AF.protectSystemExit

### AF.protectSystemExit(shouldProtect, aMessage)

Protects the current execution against a exit instruction if shouldProtect = true (otherwise it will unprotect). If protected a security exception with aMessage (string) followed by the exit status will be thrown or the result of calling function aMessage with the exit status as a parameter.

Sources:

- js/openaf.js:14338

<a id="api-af-setinteractiveterminal-2ab01206"></a>

## AF.setInteractiveTerminal

### AF.setInteractiveTerminal()

Sets the current terminal to be interactive (no echo, no buffering).

Sources:

- js/openaf.js:13149

<a id="api-af-swap-509de2bd"></a>

## AF.swap

### AF.swap(anArray, anIndex1, anIndex2) : Array

Swaps the elements at anIndex1 and anIndex2 in anArray. Returns the new array with the elements swapped.

Sources:

- js/openaf.js:13088

<a id="api-af-tocslon-9b8af4ae"></a>

## AF.toCSLON

### AF.toCSLON(aObject, aTheme) : String

Converts aObject map/array into SLON representation with ansi colors (see more in help for ow.format.toCSLON)

Sources:

- js/openaf.js:13749

<a id="api-af-tokyaml-479d16ab"></a>

## AF.toKYAML

### AF.toKYAML(aJson, multiDoc, sanitize, shouldColor, perEntryNewLine) : String

Converts `aJson` to a Kubernetes-style YAML (flow) string using these rules:

- Double-quoted string values.
- Unquoted keys unless ambiguous.
- Flow style `{}` for maps and `[]` for arrays.
- If `perEntryNewLine` (or `__flags.YAML.perEntryNewLine`) is true, each entry or element appears on its own line, similar to JSON pretty-print.

If `multiDoc` is true and `aJson` is an array, multiple documents are emitted separated by `---`.
If `sanitize` is true, Java objects are stringified. Toggle color with `shouldColor`.

Sources:

- js/openaf.js:13225

<a id="api-af-toslon-e640284d"></a>

## AF.toSLON

### AF.toSLON(aObject, aTheme) : String

Converts aObject map/array into SLON representation (see more in help for ow.format.toSLON)

Sources:

- js/openaf.js:13738

<a id="api-af-totoon-08ce2b27"></a>

## AF.toTOON

### AF.toTOON(aObj, alternative) : String

Tries to convert aObj into a TOON string. If alternative = true (or, if unset, defaults to &#95;&#95;flags.ALTERNATIVES.toTOON) a native Java TOON engine will be used instead of the bundled Javascript one (faster and lower memory footprint on bigger payloads).

Sources:

- js/openaf.js:13364

<a id="api-af-toyaml-816b7146"></a>

## AF.toYAML

### AF.toYAML(aJson, multiDoc, sanitize, shouldColor) : String

Tries to dump aJson into a YAML string. If multiDoc = true and aJson is an array the output will be multi-document. If sanitize = true all Java objects will be converted to avoid parsing errors.

Sources:

- js/openaf.js:13163

<a id="api-af-unsetinteractiveterminal-d381612c"></a>

## AF.unsetInteractiveTerminal

### AF.unsetInteractiveTerminal()

Unsets the current terminal to be interactive (no echo, no buffering).

Sources:

- js/openaf.js:13156

