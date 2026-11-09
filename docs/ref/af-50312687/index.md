# af

[Home](../index.md) / [All APIs](../all-apis.md) / [af](index.md)

<a id="api-af-compile-11e8b5b8"></a>

## af.compile

### af.compile(aScriptString, aSourceName) : Object

Compiles the aScriptString executing it and returning the corresponding result.  Optionally you can provide aSourceName.

Sources:

- src/openaf/AFBase.java:1361

<a id="api-af-compiletoclasses-48aead35"></a>

## af.compileToClasses

### af.compileToClasses(aClassfile, aScriptString, aPath)

Given `aClassfile` name, `aScriptString` and, optionally, a filesystem `aPath` it will generate Java bytecode
as result of compiling the `aScriptString` into a filesystem `aClassfile` (on the provided `aPath`). Example:

```javascript
af.compileToClasses("SomeClass", "print('hello world!');", "/some/path")
```

Sources:

- src/openaf/AFBase.java:1404

<a id="api-af-compiletojar-cd0f3a5c"></a>

## af.compileToJar

### af.compileToJar(aClassfile, aScriptString, aJarFile)

Given `aClassfile` name and `aScriptString` it will generate Java bytecode as a result of compiling
`aScriptString`, writing every generated class as a single entry into `aJarFile` instead of one loose
.class file per class (see `af.compileToClasses`). `aJarFile` is written to a temporary file next to
it and then moved into place, so a failed compile never leaves a partial/corrupt jar behind; the
class can then be loaded with `af.externalClass`/`af.runFromExternalClass` pointed at `aJarFile`
directly (a URLClassLoader treats a jar file URL the same as a directory URL). Example:

```javascript
af.compileToJar("SomeClass", "print('hello world!');", "/some/path/SomeClass.jar")
```

Sources:

- src/openaf/AFBase.java:1440

<a id="api-af-cp-6174aa1e"></a>

## af.cp

### af.cp(aSourceFilePath, aTargetFilePath)

Tries to copy aSourceFilePath to aTargetFilePath preserving file attributes.

Sources:

- src/openaf/AFBase.java:847

<a id="api-af-create2facredentials-82adc779"></a>

## af.create2FACredentials

### af.create2FACredentials(anAccountName, anIssuer) : Map

Given anAccountName and anIssuer will create a the 2FA/TOTP (Time-Based One-Time Password) returning a map with the scratchCodes, the verificationCode, the key, the openaf encryptedKey, the QR code URL  and the OTP URL.

Sources:

- src/openaf/AFBase.java:2346

<a id="api-af-crypt-71c46eb1"></a>

## af.crypt

### af.crypt(aKey, aSalt) : String

Tries to mimic crypt(3) password encryption using the org.apache.commons.codec.digest.Crypt.crypt function. Please check https://commons.apache.org/proper/commons-codec/apidocs/org/apache/commons/codec/digest/Crypt.html for more. Use af.randomCryptSalt() to generate a random salt if necessary.

Sources:

- src/openaf/AFBase.java:2172

<a id="api-af-decrypt-7b0b5aa7"></a>

## af.decrypt

### af.decrypt(aString, aKey) : String

Decrypts the provided aString with the provided aKey.

Sources:

- src/openaf/AFBase.java:885

<a id="api-af-decryptbytes-758d308b"></a>

## af.decryptBytes

### af.decryptBytes(anArrayOfBytes, aKey) : anArrayOfBytes

Decrypts the provided anArrayOfBytes (with the IV in the last 16 bytes) using AES/CBC/PKCS5PADDING. If aKey is provided it will decrypt using it.

Sources:

- src/openaf/AFBase.java:976

<a id="api-af-decryptbytes2string-f9088d7e"></a>

## af.decryptBytes2String

### af.decryptBytes2String(anArrayOfBytes, aKey) : String

Decrypts the provided anArrayOfBytes (with the IV in the last 16 bytes) using AES/CBC/PKCS5PADDING and returns the result as a String. If aKey is provided it will decrypt using it.

Sources:

- src/openaf/AFBase.java:1013

<a id="api-af-decryptbytesifpossible-83ac1385"></a>

## af.decryptBytesIfPossible

### af.decryptBytesIfPossible(anArrayOfBytes, aKey) : anArrayOfBytes

Tries to decrypt anArrayOfBytes using the provided aKey (or the default key if not provided). If decryption fails, returns the original bytes unchanged.

Sources:

- src/openaf/AFBase.java:1028

<a id="api-af-e-24cafcc0"></a>

## af.e

### af.e(aString)

Outputs to stderr aString ending with a newline.

Sources:

- src/openaf/AFBase.java:438

<a id="api-af-encrypt-7620aa30"></a>

## af.encrypt

### af.encrypt(aString, aKey) : String

Encrypts the provided aString as password for most of the OpenAF password functionality. If aKey is provided it will encrypt using it.

Sources:

- src/openaf/AFBase.java:859

<a id="api-af-encryptbytes-0c5ea6e0"></a>

## af.encryptBytes

### af.encryptBytes(anArrayOfBytes, aKey) : anArrayOfBytes

Encrypts the provided anArrayOfBytes using AES/CBC/PKCS5PADDING. If aKey is provided it will encrypt using it. Returns the encrypted bytes with the IV appended at the end (last 16 bytes).

Sources:

- src/openaf/AFBase.java:925

<a id="api-af-encryptstring2bytes-5f7b26ea"></a>

## af.encryptString2Bytes

### af.encryptString2Bytes(aString, aKey) : anArrayOfBytes

Encrypts the provided aString using AES/CBC/PKCS5PADDING and returns the encrypted bytes with the IV appended at the end (last 16 bytes). If aKey is provided it will encrypt using it.

Sources:

- src/openaf/AFBase.java:961

<a id="api-af-enl-351d8475"></a>

## af.enl

### af.enl(aString)

Outputs to stderr aString without a newline on the end.

Sources:

- src/openaf/AFBase.java:447

<a id="api-af-eval-ba7a8752"></a>

## af.eval

### af.eval(aScript) : Object

Performs the equivalent version of the javascript eval function for the provided aScript. Returns  the corresponding result of the evaluation.

Sources:

- src/openaf/AFBase.java:2157

<a id="api-af-externaladdclasspath-1998c4e6"></a>

## af.externalAddClasspath

### af.externalAddClasspath(aURL)

Tries to add `aURL` to the current classpath. Don't forget that directories must end with a '/', for
example: `file:/my/own/dir/`

Note: This might not work for some JVMs.

Sources:

- src/openaf/AFBase.java:1223

<a id="api-af-externalclass-81a21fde"></a>

## af.externalClass

### af.externalClass(anArrayOfClasspathEntries, aClassName) : JavaClass

Returns an external Java class with the aClassName, not included in the initial OpenAF's classpath, loaded from a list of jars/folders in anArrayOfClasspathEntries.

Sources:

- src/openaf/AFBase.java:1162

<a id="api-af-externalclassloader-bd580a9e"></a>

## af.externalClassLoader

### af.externalClassLoader(anArrayOfClasspathEntries) : ClassLoader

Returns a ClassLoader suitable to be use with af.getClass to dynamically load Java classes that weren't included  on the initial OpenAF's classpath and are included in the jars/folders provided in anArrayOfClasspathEntries.

Sources:

- src/openaf/AFBase.java:1195

<a id="api-af-externalplugin-a8959a7b"></a>

## af.externalPlugin

### af.externalPlugin(anArrayOfClasspathEntries, aPluginClass)

Loads a OpenAF's plugin identified by the aPluginClass that isn't available in the initial OpenAF's classpath, loaded from a list of jars/folders in anArrayOfClasspathEntries.

Sources:

- src/openaf/AFBase.java:1125

<a id="api-af-fromarray2bytes-adc83730"></a>

## af.fromArray2Bytes

### af.fromArray2Bytes(anArray) : anArrayOfBytes

Converts a javascript array of integers into a Java anArrayOfBytes.

Sources:

- src/openaf/AFBase.java:1705

<a id="api-af-frombase64-9d553c97"></a>

## af.fromBase64

### af.fromBase64(aBase) : anArrayOfBytes

Decodes aBase, a Base64 string or array of bytes, into the original array of bytes.

Sources:

- src/openaf/AFBase.java:1625

<a id="api-af-frombase64stream-2da2c70c"></a>

## af.fromBase64Stream

### af.fromBase64Stream(aInputStream, aOutputStream, shouldNotClose)

Decodes Base64 using the same lenient decoding as af.fromBase64, copying Java streams with bounded memory.
Both streams close on success or processing failure unless `shouldNotClose` is true
(default false). Successful conversion finalizes and flushes output even when left open.
Invalid arguments are rejected before reading or closing streams. Errors propagate and
may leave partial output; cleanup errors are suppressed behind the original error.
Returns undefined. For example:

```javascript
af.fromBase64Stream(io.readFileStream("B.b64"), io.writeFileStream("A.decoded"));
```

Sources:

- src/openaf/AFBase.java:1682

<a id="api-af-frombytes2array-fc4a0862"></a>

## af.fromBytes2Array

### af.fromBytes2Array(anArrayOfBytes) : Array

Converts a Java anArrayOfBytes into a javascript array of integers with the value representation of  each byte.

Sources:

- src/openaf/AFBase.java:1727

<a id="api-af-frombytes2inputstream-285d78e1"></a>

## af.fromBytes2InputStream

### af.fromBytes2InputStream(anArrayOfBytes) : Stream

Converts anArrayOfBytes into a ByteArrayInputStream.

Sources:

- src/openaf/AFBase.java:2292

<a id="api-af-frombytes2outputstream-ffe32286"></a>

## af.fromBytes2OutputStream

### af.fromBytes2OutputStream(anArrayOfBytes) : Stream

Converts `anArrayOfBytes` into a ByteArrayOutputStream. After using this stream you can, for example, use
`toString` and `toByteArray` methods from the resulting stream.

Sources:

- src/openaf/AFBase.java:2249

<a id="api-af-frombytes2string-4d6ee412"></a>

## af.fromBytes2String

### af.fromBytes2String(anArrayOfBytes, anEncoding) : aString

Converts anArrayOfBytes into a string, optionally with the provided anEncoding.

Sources:

- src/openaf/AFBase.java:456

<a id="api-af-frominputstream2bytes-966b8d1f"></a>

## af.fromInputStream2Bytes

### af.fromInputStream2Bytes(aStream) : anArrayOfBytes



Sources:

- src/openaf/AFBase.java:2234

<a id="api-af-frominputstream2string-ba9f63a1"></a>

## af.fromInputStream2String

### af.fromInputStream2String(aStream, anEncoding) : String

Tries to convert an input aStream into a String.

Sources:

- src/openaf/AFBase.java:2214

<a id="api-af-fromjava2js-430856a7"></a>

## af.fromJava2JS

### af.fromJava2JS(aJavaObj) : Object

Tries to convert the provided Java object to a native javascript object

Sources:

- js/openaf.js:7003

<a id="api-af-fromjavamap-9ff8d92b"></a>

## af.fromJavaMap

### af.fromJavaMap(JavaMap) : Map

Converts a Java Map to a JavaScript Object.

Sources:

- src/openaf/AFBase.java:266

<a id="api-af-fromobj2xml-a15bcd52"></a>

## af.fromObj2XML

### af.fromObj2XML(aMap, sanitize, aAttrKey) : String

Tries to convert aMap into a similiar XML strucuture returned as string. Note that no validation of XML strucuture is performed.  If aAttrKey string is defined it will be used to prefix attributes (from af.fromXML2Obj). Tips: ensure each map is under a map key.

Sources:

- js/openaf.js:14234

<a id="api-af-fromstring2bytes-ce6e043a"></a>

## af.fromString2Bytes

### af.fromString2Bytes(aString, anEncoding) : anArrayOfBytes

Converts aString into anArrayOfBytes, optionally with the provided anEncoding.

Sources:

- src/openaf/AFBase.java:479

<a id="api-af-fromstring2inputstream-a5bd3363"></a>

## af.fromString2InputStream

### af.fromString2InputStream(aString, anEncoding) : Stream

Converts aString into a ByteArrayInputStream.

Sources:

- src/openaf/AFBase.java:2308

<a id="api-af-fromstring2outputstream-9da5b360"></a>

## af.fromString2OutputStream

### af.fromString2OutputStream(aString, encoding) : Stream

Converts `aString` into a ByteArrayOutputStream. After using this stream you can, for example, use
`toString` and `toByteArray` methods from the resulting stream.

Sources:

- src/openaf/AFBase.java:2270

<a id="api-af-fromtoml-4ce570de"></a>

## af.fromTOML

### af.fromTOML(aTOML) : Object

Tries to parse aTOML into a javascript object

Sources:

- js/openaf.js:13422

<a id="api-af-fromtoonjava-8f35360a"></a>

## af.fromTOONJava

### af.fromTOONJava(aTOONStr) : Object

Tries to parse aTOONStr into a javascript object using the native Java TOON engine (json-io) instead of the bundled Javascript one. See &#95;&#95;flags.ALTERNATIVES.fromTOON.

Sources:

- src/openaf/AFBase.java:343

<a id="api-af-fromxml-b73a6402"></a>

## af.fromXML

### af.fromXML(aXMLObject) : aString

Converts aXMLObject (E4X) into a String. Warning: beware that E4X is an obsolete object.

Sources:

- src/openaf/AFBase.java:524

<a id="api-af-fromxml2obj-be0da43a"></a>

## af.fromXML2Obj

### af.fromXML2Obj(xml, ignored, aPrefix, reverseIgnored) : Object

Tries to convert a XML object into a javascript object. Tag attributes will be ignored unless the corresponding tag name is included on the ignored array and attributes will be added to the corresponding map with a prefix "&#95;" (or aPrefix). Optionally if reverseIgnored = true the ignored array will be used to not include the tag name in the ignored array.

Sources:

- js/openaf.js:14157

<a id="api-af-get2fatoken-66496fde"></a>

## af.get2FAToken

### af.get2FAToken(aKey, aSpecificTime) : String

Given 2FA aKey it will return the current token. Note: it will use the current date/time of the system so it must be in sync with the authenticator. Optionally you can provide aSpecificTime.

Sources:

- src/openaf/AFBase.java:2392

<a id="api-af-getclass-c096574c"></a>

## af.getClass

### af.getClass(aName, aLoader) : JavaClass

Returns the JavaClass object the Java class identified by aName. Optionally you can provide a Java classloader ( this can be the result of using af.externalClassLoader).

Sources:

- src/openaf/AFBase.java:1791

<a id="api-af-getdistribution-d4e8575f"></a>

## af.getDistribution

### af.getDistribution() : String

Returns the current OpenAF's distribution channel.

Sources:

- src/openaf/AFBase.java:1819

<a id="api-af-getopenafjar-cb4591fd"></a>

## af.getOpenAFJar

### af.getOpenAFJar() : String

Retrives the fullpath for the OpenAF jar.

Sources:

- src/openaf/AFBase.java:1830

<a id="api-af-getscopeids-885c15fa"></a>

## af.getScopeIds

### af.getScopeIds() : Array

Returns an array of the current scope IDs.

Sources:

- src/openaf/AFBase.java:2146

<a id="api-af-getversion-ea7d268a"></a>

## af.getVersion

### af.getVersion() : String

Returns the current OpenAF's build version.

Sources:

- src/openaf/AFBase.java:1808

<a id="api-af-jqjava-82203f8b"></a>

## af.jqJava

### af.jqJava(input, expression, options) : Object

Evaluates jq 1.6 against JSON values. Prefer $jq for the documented public interface.

Sources:

- src/openaf/AFBase.java:287

<a id="api-af-js2s-1471b204"></a>

## af.js2s

### af.js2s(aObject) : String

Tries to convert an object into a beautified string representation.

Sources:

- src/openaf/AFBase.java:391

<a id="api-af-load-b62346eb"></a>

## af.load

### af.load(aFilename)

Loads an OpenAF script/file `aFilename`. The variable `__loadedfrom` will always be set to the `aFilename` value
after each execution. The `aFilename` can be composed not only by a filename but also with a zip/opack
file where it resides (for example: `"aZipFile.zip::aScriptInsideTheZip.js"`). The variable `__loadedfromzip` would hold,
in this case, the zip file from which the script was executed.

Sources:

- src/openaf/AFBase.java:1256

<a id="api-af-loadrequire-cc0997c4"></a>

## af.loadRequire

### af.loadRequire(arrayOfPaths, isSandboxed)

Will redefine the require function on the current scope to use the arrayOfPaths provided.  Optionally you can the require function can provide a sandbox enviroment if isSandboxed = true.

Sources:

- src/openaf/AFBase.java:2054

<a id="api-af-mkdir-26ad4e9c"></a>

## af.mkdir

### af.mkdir(aNewDirectory) : boolean

Tries to create aNewDirectory. Returns true if successfull, false otherwise.

Sources:

- src/openaf/AFBase.java:538

<a id="api-af-mv-4f4c22a3"></a>

## af.mv

### af.mv(aSourceFilePath, aTargetFilePath)

Tries to move aSourceFilePath to aTargetFilePath preserving file attributes.

Sources:

- src/openaf/AFBase.java:835

<a id="api-af-newoutputstream-4d1c49f2"></a>

## af.newOutputStream

### af.newOutputStream() : Stream

Creates a new ByteArrayOutputStream. After using this stream you can, for example, use
`toString` and `toByteArray` methods from the resulting stream.

Sources:

- src/openaf/AFBase.java:2329

<a id="api-af-newscriptinstance-32a0894b"></a>

## af.newScriptInstance

### af.newScriptInstance(aClassOrName) : Script

Instantiates a compiled script class, handling Rhino descriptor-based constructors when needed.

Sources:

- src/openaf/AFBase.java:1579

<a id="api-af-nvl-be199f91"></a>

## af.nvl

### af.nvl(aValue, aDefault) : Object

Returns aValue if it is defined or aDefault otherwise.

Sources:

- js/openaf.js:13458

<a id="api-af-p-0acd93a2"></a>

## af.p

### af.p(aString)

Outputs to stdout aString ending with a newline.

Sources:

- src/openaf/AFBase.java:420

<a id="api-af-parse-e7c8d53a"></a>

## af.parse

### af.parse(aScriptString, aSourceName) : Array

Parses aScriptString, with aSourceName, returning the corresponding parsed statments.

Sources:

- src/openaf/AFBase.java:1380

<a id="api-af-pathjava-1c1a4c05"></a>

## af.pathJava

### af.pathJava(obj, expression, customFunctions) : Object

Evaluates a JMESPath expression directly against Rhino values using the Java engine. Uses &#95;&#95;flags.PATH&#95;CACHE&#95;SIZE (default 256, 0 disables caching). Prefer $path for OpenAF extensions.

Sources:

- src/openaf/AFBase.java:309

<a id="api-af-plugin-f1a77757"></a>

## af.plugin

### af.plugin(aPluginClass)

Loads a OpenAF's plugin class (aPluginClass).

Sources:

- src/openaf/AFBase.java:1103

<a id="api-af-pnl-1e20d915"></a>

## af.pnl

### af.pnl(aString)

Outputs to stdout aString without a newline on the end.

Sources:

- src/openaf/AFBase.java:429

<a id="api-af-randomcryptsalt-535f5950"></a>

## af.randomCryptSalt

### af.randomCryptSalt() : String

Generates a random valid, 2 char long, crypt salt to be used with af.crypt.

Sources:

- src/openaf/AFBase.java:2186

<a id="api-af-rename-93f4689a"></a>

## af.rename

### af.rename(aSourceFilePath, aTargetFilePath)

Tries to rename aSourceFilePath to aTargetFilePath.

Sources:

- src/openaf/AFBase.java:823

<a id="api-af-restartopenaf-98aaa5d3"></a>

## af.restartOpenAF

### af.restartOpenAF(aCommandLineArray)

Terminates the current OpenAF execution and tries to start a new with the same command line, if aCommandLineArray is not provided. If aCommandLineArray is provided each array element will be use sequentially to build the command line to start a new OpenAF instance.

Sources:

- src/openaf/AFBase.java:135

<a id="api-af-rm-8ebcd1fd"></a>

## af.rm

### af.rm(aFilePath)

Tries to delete a file or a directory on the provided aFilePath. In case it's a directory it will try to  recursively delete all directory contents.

Sources:

- src/openaf/AFBase.java:804

<a id="api-af-runfromclass-cc26d8c6"></a>

## af.runFromClass

### af.runFromClass(aCompiledJavascriptClass) : Object

Runs `aCompiledJavascriptClass` returning it's output. Example:

```javascript
af.compileToClasses("SomeClass", "print('hello world!');", "/some/path");
var aScriptClass = af.externalClass(["file://some/path/"], "SomeClass");
af.runFromClass(aScriptClass.newInstance());
```

Sources:

- src/openaf/AFBase.java:1483

<a id="api-af-runfromexternalclass-ae69ed61"></a>

## af.runFromExternalClass

### af.runFromExternalClass(aClassName, aPath)

Tries to "execute" `aClassName` from a previously compiled OpenAF script, with `af.compileToClasses`, on `aPath`.

Example:

```javascript
af.compileToClasses("MyClass", "var myOpen = 'AF Class'", ".");
af.runFromExternalClass("MyClass", ".");
myOpen; // AF Class
```

Sources:

- js/openaf.js:13035

<a id="api-af-securerandom-5e705186"></a>

## af.secureRandom

### af.secureRandom() : Double

Returns a java security SecureRandom double value.

Sources:

- src/openaf/AFBase.java:2203

<a id="api-af-setk-ad0ac1fa"></a>

## af.setK

### af.setK(aK)

Sets the current 16 bytes encrypt/decrypt key.

Sources:

- src/openaf/AFBase.java:124

<a id="api-af-sh-33a0accb"></a>

## af.sh

### af.sh(commandArguments, aStdIn, aTimeout, shouldInheritIO, aDirectory, returnMap, callbackFunc, encoding, dontWait, envsMap, exitCallback) : String/Map

Tries to execute `commandArguments` (either a String or an array of strings) in the operating system. Optionally
`aStdIn` can be provided, `aTimeout` can be defined for the execution and if `shouldInheritIO` is true the stdout, stderr and stdin
will be inherit from OpenAF. If `shouldInheritIO` is not defined or false it will return the stdout of the command execution.
Captured stdout and stderr are drained concurrently. The timeout includes writing `aStdIn`. Without
supplied input or a stream callback, stdin is closed so commands reading to EOF can finish.
It's possible also to provide a different working `aDirectory`.
If `envsMap` (a map of strings) is defined the environment variables will be replaced by `envsMap`.
The variables `__exitcode` and `__stderr` can be checked for the command exit code and the stderr output correspondingly. In alternative
if `returnMap` = true a map will be returned with stdout, stderr and exitcode.
A `callbackFunc` can be provided, if `shouldInheritIO` is undefined or false, that will receive, as parameters, an output stream, a error stream and an input stream.
An `exitCallback` can also be provided that will receive the process as parameter and should return "force" to forcefully terminate the process or "destroy" to gracefully terminate it.
If defined the stdout and stderr won't be available for the `returnMap` if true. Example:

```javascript
sh("someCommand", void 0, void 0, false, void 0, false, function(o, e, i) { ioStreamReadLines(o, (f) => { print("TEST | " + String(f)) }, void 0, false) });
```

Sources:

- src/openaf/AFBase.java:601

<a id="api-af-sleep-231785be"></a>

## af.sleep

### af.sleep(aTime)

Suspends the current script execution (if using Threads only the thread executing this function) for a
period of `aTime` in ms. For example `aTime = 1000` would result in suspending the execution for 1 second.

Sources:

- src/openaf/AFBase.java:549

<a id="api-af-sync-02a3a513"></a>

## af.sync

### af.sync(aFunction, aObject)

When running in multithreaded scripts will ensure that aFunction is synchronized. Optionally aObject for synchronization can be provided.

Sources:

- src/openaf/AFBase.java:2035

<a id="api-af-tobase64bytes-9771b7e9"></a>

## af.toBase64Bytes

### af.toBase64Bytes(arrayOfBytes) : anArrayOfBytes

Encodes arrayOfBytes, a string or array of bytes, as Base64 bytes without line breaks.

Sources:

- src/openaf/AFBase.java:1640

<a id="api-af-tobase64stream-8cbf9443"></a>

## af.toBase64Stream

### af.toBase64Stream(aInputStream, aOutputStream, shouldNotClose)

Encodes raw bytes as standard padded Base64 without line breaks, copying Java streams with bounded memory.
Both streams close on success or processing failure unless `shouldNotClose` is true
(default false). Successful conversion finalizes and flushes output even when left open.
Invalid arguments are rejected before reading or closing streams. Errors propagate and
may leave partial output; cleanup errors are suppressed behind the original error.
Returns undefined. For example:

```javascript
af.toBase64Stream(io.readFileStream("A"), io.writeFileStream("B.b64"));
```

Sources:

- src/openaf/AFBase.java:1659

<a id="api-af-toencoding-dd63aeb3"></a>

## af.toEncoding

### af.toEncoding(aString, aTargetEncoding, aSourceEncoding) : String

Converts aString to aTargetEncoding optionally providing aSourceEncoding. If aTargetEncoding is not provided it will default to the current java encoding.

Sources:

- src/openaf/AFBase.java:496

<a id="api-af-totoml-e8f9d2d1"></a>

## af.toTOML

### af.toTOML(aObj) : String

Tries to convert aObj into a TOML string.

Sources:

- js/openaf.js:13443

<a id="api-af-totoonjava-ac6d392a"></a>

## af.toTOONJava

### af.toTOONJava(aObj) : String

Tries to convert aObj into a TOON string using the native Java TOON engine (json-io) instead of the bundled Javascript one. See &#95;&#95;flags.ALTERNATIVES.toTOON.

Sources:

- src/openaf/AFBase.java:324

<a id="api-af-validate2fa-45c51505"></a>

## af.validate2FA

### af.validate2FA(aKey, aToken) : boolean

Given aToken and a 2FA aKey returns true if it's valid. Note: it will use the current date/time of the system so it must be in sync with the authenticator app; scratchCodes are not handled.

Sources:

- src/openaf/AFBase.java:2378

<a id="api-af-visiblelength-51f4bb06"></a>

## af.visibleLength

### af.visibleLength(aString, aWideEmojiPresentation) : int

Given aString returns its visible terminal width in columns, removing ANSI sequences and collapsing combined characters and emoji grapheme sequences. By default (aWideEmojiPresentation = true) bare "Emoji&#95;Presentation=Yes" symbols (e.g. ✅ ⏳ ⚽ without a trailing U+FE0F) count as double-width, matching how modern GUI terminals (macOS Terminal, iTerm2, VS Code) render them. Pass false to match plain wcwidth-style terminals that only widen those symbols with an explicit U+FE0F.

Sources:

- src/openaf/AFBase.java:1841

