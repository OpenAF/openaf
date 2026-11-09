# io

[Home](../index.md) / [All APIs](../all-apis.md) / [io](index.md)

<a id="api-io-convertfiletoencoding-725ea748"></a>

## io.convertFileToEncoding

### io.convertFileToEncoding(aOriginalFile, aNewFile, anEncoding)

Converts an original file into a new file using the provided enconding.

Sources:

- src/openaf/core/IO.java:109

<a id="api-io-copyjsonrange-7007d622"></a>

## io.copyJSONRange

### io.copyJSONRange(aFile, aStart, anEnd, anOutputStream, aOptions)

Copies an exclusive byte range discovered by io.scanJSON using bounded buffers. The output is borrowed and remains open. Input is always closed. Optional cancel/progress functions work as in io.scanJSON.

Sources:

- js/openaf.js:14853

<a id="api-io-cp-eb6e24c8"></a>

## io.cp

### io.cp(aSourceFilePath, aTargetFilePath)

Tries to copy aSourceFilePath to aTargetFilePath preserving file attributes.

Sources:

- src/openaf/core/IO.java:894

<a id="api-io-createtempdir-0795e6e4"></a>

## io.createTempDir

### io.createTempDir(aPrefix, aPath) : String

Creates a temporary directory with the provided aPrefix that will be deleted completly (all files and folders inside) upon execution exit. The absolute path for it is returned. Optionally, if aPath is defined, the temporary directory will be created in aPath.

Sources:

- src/openaf/core/IO.java:929

<a id="api-io-createtempfile-d1748882"></a>

## io.createTempFile

### io.createTempFile(aPrefix, aSuffix, aPath) : String

Creates a temporary file with the provided aPrefix and aSuffix that will be deleted upon execution exit. The absolute path for it is returned. Optionally, if aPath is defined, the temporary file will be created in aPath.

Sources:

- src/openaf/core/IO.java:906

<a id="api-io-extractjson-6855d17d"></a>

## io.extractJSON

### io.extractJSON(aFile, aPath, anOutputStream, aOptions) : boolean

Copies the JSON value at a literal key/index path to a borrowed output stream. An empty path selects the root. Returns false without writing when absent. Uses bounded buffers and preserves original JSON bytes. The source must remain unchanged during extraction. Options cancel/progress/maxNodes apply to scanning; copy progress restarts at zero. Early selection does not validate the unread suffix.

Sources:

- js/openaf.js:14879

<a id="api-io-fileexists-7e8100df"></a>

## io.fileExists

### io.fileExists(aFilename) : boolean

Returns true or false to determine if aFilename exists on the filesystem.

Sources:

- src/openaf/core/IO.java:818

<a id="api-io-fileinfo-86acd366"></a>

## io.fileInfo

### io.fileInfo(aFilePath, usePosix)

Returns a file map with filename, filepath, lastModified, createTime, lastAccess,  size, permissions, isDirectory and isFile. Alternatively you can specify to usePosix=true and it will add to the map the owner, group and full permissions of each file and folder.

Sources:

- src/openaf/core/IO.java:214

<a id="api-io-getcanonicalpath-da68eb16"></a>

## io.getCanonicalPath

### io.getCanonicalPath(aPath) : String

Returns the canonical path for the provided aPath either if the file/folder exists or not.

Sources:

- src/openaf/core/IO.java:829

<a id="api-io-getdefaultencoding-9d3917a8"></a>

## io.getDefaultEncoding

### io.getDefaultEncoding()

Returns the current default encoding used.

Sources:

- src/openaf/core/IO.java:97

<a id="api-io-getfileencoding-56bc839f"></a>

## io.getFileEncoding

### io.getFileEncoding(aFile)

Tries to determine the file encoding of a given file and returns the same.

Sources:

- src/openaf/core/IO.java:59

<a id="api-io-gunzip-ec3eb2e1"></a>

## io.gunzip

### io.gunzip(anArrayOfBytes) : anObject

Uncompresses a gziped array of bytes.

Sources:

- src/openaf/core/IO.java:633

<a id="api-io-gunzipstream-ff277e58"></a>

## io.gunzipStream

### io.gunzipStream(aInputStream, aOutputStream, shouldNotClose)

Decompresses GZIP into raw bytes, copying Java streams with bounded memory and no object serialization.
Both streams close on success or processing failure unless `shouldNotClose` is true
(default false). Successful conversion finalizes and flushes output even when left open.
Invalid arguments are rejected before reading or closing streams. Errors propagate and
may leave partial output; cleanup errors are suppressed behind the original error.
Returns undefined. For example:

```javascript
io.gunzipStream(io.readFileStream("A.gz"), io.writeFileStream("A.decoded"));
```

Sources:

- src/openaf/core/IO.java:682

<a id="api-io-gzip-f2cab727"></a>

## io.gzip

### io.gzip(anObject) : anArrayOfBytes

Compresses an object into an array of bytes.

Sources:

- src/openaf/core/IO.java:605

<a id="api-io-gzipstream-a7e9365d"></a>

## io.gzipStream

### io.gzipStream(aInputStream, aOutputStream, shouldNotClose)

Compresses raw bytes into GZIP, copying Java streams with bounded memory and no object serialization.
Both streams close on success or processing failure unless `shouldNotClose` is true
(default false). Successful conversion finalizes and flushes output even when left open.
Invalid arguments are rejected before reading or closing streams. Errors propagate and
may leave partial output; cleanup errors are suppressed behind the original error.
Returns undefined. For example:

```javascript
io.gzipStream(io.readFileStream("A"), io.writeFileStream("A.gz"));
```

Sources:

- src/openaf/core/IO.java:660

<a id="api-io-isbinaryfile-e4c52fc5"></a>

## io.isBinaryFile

### io.isBinaryFile(aFile, confirmLimit) : boolean

Tries to determine if the provided aFile is a binary or text file by checking the first 1024 chars (limit can be changed using confirmLimit). Returns true if file is believed to be binary. Based on the function isBinaryArray.

Sources:

- js/openaf.js:14993

<a id="api-io-listfilenames-1988261a"></a>

## io.listFilenames

### io.listFilenames(aFilePath, fullPath)

Returns a files array with a map with filepath (if fullPath = true) or filename otherwise.

Sources:

- src/openaf/core/IO.java:285

<a id="api-io-listfiles-48a4b9a5"></a>

## io.listFiles

### io.listFiles(aFilePath, usePosix)

Returns a files array with a map with filename, filepath, lastModified, createTime, lastAccess,  size, permissions, isDirectory and isFile for each entry on a file path. Alternatively you can specify to usePosix=true and it will add to the map the owner, group and full permissions of each file and folder.

Sources:

- src/openaf/core/IO.java:126

<a id="api-io-listfilestar-55f9246d"></a>

## io.listFilesTAR

### io.listFilesTAR(aTARfile, isGzip) : Array

Given aTARfile (or output stream (with isGzip = true/false)) will return an array with the TAR file entries. Each entry will have: isDirectory (boolean), isFile (boolean), canonicalPath (string), filepath (string), filename (string), size (number), lastModified (date), groupId (string), group (string), userId (string) and user (string).

Sources:

- js/openaf.js:14557

<a id="api-io-lz4-64c012a2"></a>

## io.lz4

### io.lz4(anInput) : bytes

Compresses anInput using LZ4 compression and returns the compressed bytes.

Sources:

- js/openaf.js:13628

<a id="api-io-mkdir-b7906454"></a>

## io.mkdir

### io.mkdir(aNewDirectory) : boolean

Tries to create aNewDirectory. Returns true if successfull, false otherwise.

Sources:

- src/openaf/core/IO.java:840

<a id="api-io-mv-72cc1e58"></a>

## io.mv

### io.mv(aSourceFilePath, aTargetFilePath)

Tries to move aSourceFilePath to aTargetFilePath preserving file attributes.

Sources:

- src/openaf/core/IO.java:882

<a id="api-io-ondirevent-e069cf39"></a>

## io.onDirEvent

### io.onDirEvent(aPath, aFn, aFnErr) : Promise

Given `aPath` of a directory will return a promise (`$do`) that, for every create, modify or delete event that happens on `aPath` it will call `aFn` with two parameters: kind and filename.
The 'kind' string can be one of four events: ENTRY_CREATE, ENTRY_DELETE, ENTRY_MODIFY, OVERFLOW (meaning events were lost or discarded). The 'filename' represents the filename affected.
Optionally `aFnErr` function can be provided to handle any errors and, in case `aPath` no longer exists, `aFnErr` will be called with the string "ENTRY_NA". Example:

```javascript
var p = io.onDirEvent("myDir", (kind, filename) => {
   log("Event '" + kind + "' on '" + filename + "'");
}, e => {
   if (isString(e) && e == "ENTRY_NA") logWarn("myDir no longer exists."); else logErr(e);
});

$doWait(p);
```

Sources:

- js/openaf.js:15017

<a id="api-io-pipech-23e74759"></a>

## io.pipeCh

### io.pipeCh(aFunc)

Starts a wait on stdin calling aFunc everytime a character is sent to stdin. The wait cycle breaks when aFunc returns true.

Sources:

- js/openaf.js:14365

<a id="api-io-pipeln-7278e975"></a>

## io.pipeLn

### io.pipeLn(aFunc)

Starts a wait on stdin calling aFunc everytime a line is sent to stdin. The wait cycle breaks when aFunc returns true.

Sources:

- js/openaf.js:14348

<a id="api-io-randomaccessfile-57e0a985"></a>

## io.randomAccessFile

### io.randomAccessFile(aFilename, aMode) : RandomAccessFile

Creates a java RandomAccessFile to enable random access to files and returns the same.

Sources:

- src/openaf/core/IO.java:704

<a id="api-io-readfile-62d7a2df"></a>

## io.readFile

### io.readFile(aFilename, anEncoding)

Reads a file auto detecting between JSON, ParameterMap, PMap and configuration PMap, optionally providing an encoding.

Note: aFilename can contain "a.zip::afile" to read from zip files.

Sources:

- src/openaf/core/IO.java:580

<a id="api-io-readfileasarray-0264ad6c"></a>

## io.readFileAsArray

### io.readFileAsArray(aFilename, anEncoding)

Reads a file, optionally providing a specific encoding to use, and returns an array where each  line is an array element.

Sources:

- src/openaf/core/IO.java:316

<a id="api-io-readfilebytes-4fa8f9e1"></a>

## io.readFileBytes

### io.readFileBytes(aFilename)

Reads a file into an array of bytes.

Note: aFilename can contain "a.zip::afile" to read from zip files.

Sources:

- src/openaf/core/IO.java:439

<a id="api-io-readfilebytesro-3872d667"></a>

## io.readFileBytesRO

### io.readFileBytesRO(aFile) : ByteArray

Tries to read aFile in read-only mode (even if being used by another process) and returns the corresponding byte array.

Sources:

- js/openaf.js:14381

<a id="api-io-readfilegzipstream-692bc550"></a>

## io.readFileGzipStream

### io.readFileGzipStream(aFilename) : JavaStream

Creates and returns a JavaStream to read from a gzip `aFilename`. For example:

```javascript
var stream = io.readFileGzipStream("afile.txt.gz");
ioStreamRead(stream, function(buffer) { // you can also use ioStreamReadBytes
   printnl(buffer);
});
stream.close();
```

Sources:

- src/openaf/core/IO.java:744

<a id="api-io-readfilejson-d06b20ce"></a>

## io.readFileJSON

### io.readFileJSON(aJSONFile) : Object

Tries to read aJSONFile into a javascript object.

Sources:

- js/openaf.js:14611

<a id="api-io-readfilelz4stream-9f4d7e19"></a>

## io.readFileLZ4Stream

### io.readFileLZ4Stream(aFile) : InputStream

Reads aFile as a LZ4 compressed stream and returns the InputStream to read from. This is useful to read large files that are compressed with LZ4 without decompressing them into memory.

Sources:

- js/openaf.js:13709

<a id="api-io-readfilestream-df650cc9"></a>

## io.readFileStream

### io.readFileStream(aFilename) : JavaStream

Creates and returns a JavaStream to read `aFilename`. For example:

```javascript
var stream = io.readFileStream("afile.txt");
ioStreamRead(stream, function(buffer) { // you can also use ioStreamReadBytes
   printnl(buffer);
});
stream.close();
```

Sources:

- src/openaf/core/IO.java:792

<a id="api-io-readfilestring-6c6eca78"></a>

## io.readFileString

### io.readFileString(aFilename, anEncoding)

Reads a file, optionally providing a specific encoding to use, and returns a string with the entire contents of the file.

Note: aFilename can contain "a.zip::afile" to read from zip files.

Sources:

- src/openaf/core/IO.java:343

<a id="api-io-readfiletar2stream-2fddb72f"></a>

## io.readFileTAR2Stream

### io.readFileTAR2Stream(aTARfile, isGzip, aFunc)

Given aTARFile (or stream) will call aFunc(tion) with the corresponding Java TAR input stream. If aTARFile is a stream you should specify with isGzip = true/false if it has been "gzipped". Note: for direct usage use io.readFileTARStream

Sources:

- js/openaf.js:14437

<a id="api-io-readfiletarbytes-6a82bde9"></a>

## io.readFileTARBytes

### io.readFileTARBytes(aTARFile, aFilePath, isGzip) : ByteArray

Given aTARFile (or stream) will try to retrieve aFilePath and return the corresponding byte array. If aTARFile is a stream you should specify with isGzip = true/false if it has been "gzipped".

Sources:

- js/openaf.js:14395

<a id="api-io-readfiletarstream-eb900b5a"></a>

## io.readFileTARStream

### io.readFileTARStream(aTARFile, aFilePath, isGzip, aFunc)

Given aTARFile (or stream) will try to retrieve aFilePath and call aFunc(tion) with the corresponding Java input stream. If aTARFile is a stream you should specify with isGzip = true/false if it has been "gzipped".

Sources:

- js/openaf.js:14417

<a id="api-io-readfiletoml-5caa48e0"></a>

## io.readFileTOML

### io.readFileTOML(aFile) : Object

Tries to read aFile and parse it as TOML into a javascript object.

Sources:

- js/openaf.js:13433

<a id="api-io-readfilexml-518dc58c"></a>

## io.readFileXML

### io.readFileXML(aFilename, numOfLinesToSkip, anEncoding)

Reads a file, optionally providing a specific encoding to use and/or the number of lines to skip (e.g. 1 to exclude the xml main header) and returns the contents in a XML object.

Note: aFilename can contain "a.zip::afile" to read from zip files.

Sources:

- src/openaf/core/IO.java:417

<a id="api-io-readfileyaml-0e47e5f8"></a>

## io.readFileYAML

### io.readFileYAML(aYAMLFile) : Object

Tries to read aYAMLFile into a javascript object.

Sources:

- js/openaf.js:14598

<a id="api-io-readjsonarray-0b5a9c2d"></a>

## io.readJSONArray

### io.readJSONArray(source, callback, encoding, raw) : Number

Reads a top-level JSON array from a filename or a Java input stream, retaining only one element at a time. Calls callback(value, zeroBasedIndex) for each element. Return true to stop early. Encoding defaults to UTF-8. With raw=true the callback receives each element as JSON text instead. Returns the number of delivered elements. Non-array roots, malformed JSON and trailing content throw. Filename streams are closed even on errors; caller-provided streams remain owned by the caller.

Sources:

- js/openaf.js:14674

<a id="api-io-readlinesndjson-e7062771"></a>

## io.readLinesNDJSON

### io.readLinesNDJSON(aNDJSONFile, aFuncCallback, aErrorCallback, anEncoding)

Opens aNDJSONFile (a newline delimited JSON) (a filename or an input stream) as a stream call aFuncCallback with each parse JSON. If aFuncCallback returns true the cycle will be interrupted. For any parse error it calls the aErrorCallback  with each exception.

Sources:

- js/openaf.js:14650

<a id="api-io-readstreamjson-e0289a46"></a>

## io.readStreamJSON

### io.readStreamJSON(aJSONFile, aValFunc) : Map

Reads a JSON file (`aJSONFile`) without loading all structures to memory (useful to handling large JSON files).
The `aValFunc` receives a single string argument with the current JSON path being processed (for example $.log.entries[123].request),
where "$" is the root of the JSON document. When `aValFunc` returns true the current JSON structure is recorded in memory.
If `aValFunc` is not defined it will return true for all paths. Returns the JSON structure recorded in memory.

Example:

```javascript
var amap = io.readStreamJSON("someFile.har",
                             path => (/^\$\.log\.entries\[\d+\]\.request/).test(path))
```

Sources:

- js/openaf.js:14705

<a id="api-io-rename-698eb9d3"></a>

## io.rename

### io.rename(aSourceFilePath, aTargetFilePath)

Tries to rename aSourceFilePath to aTargetFilePath.

Sources:

- src/openaf/core/IO.java:870

<a id="api-io-rm-86c556f6"></a>

## io.rm

### io.rm(aFilePath)

Tries to delete a file or a directory on the provided aFilePath. In case it's a directory it will try to  recursively delete all directory contents.

Sources:

- src/openaf/core/IO.java:851

<a id="api-io-scanjson-d53e2da1"></a>

## io.scanJSON

### io.scanJSON(aFile, aVisitor, aOptions) : Map

Visits UTF-8 JSON without materializing values. Events have phase (value/end), path (an array of literal keys/indices), type, start and, on end, end (exclusive byte offsets) and size for traversed containers. Return "skip" on a value to skip its children, or "stop" to stop. Options: cancel (function), progress (function receiving byte offset), maxNodes. A stopped scan does not validate the unread suffix. The file and parser are always closed.

Sources:

- js/openaf.js:14773

<a id="api-io-unlz4-2e35d4b5"></a>

## io.unlz4

### io.unlz4(anInput) : Map/String

Decompresses anInput using LZ4 compression and returns the decompressed map or string.

Sources:

- js/openaf.js:13673

<a id="api-io-unzip-2696e954"></a>

## io.unzip

### io.unzip(zipFile, targetDir, logFn, logErrFn)

Tries to unzip a `zipFile` into `targetDir`. Optionally you can provide a `logFn` and `logErrFn` to log the progress.
The `logFn` will receive the following object:

```javascript
{ type: "file" | "dir", source: [zip entry], target: [targetPath] }
```

Sources:

- js/openaf.js:13476

<a id="api-io-writefile-aee2a07a"></a>

## io.writeFile

### io.writeFile(aFilename, aJSONobject, anEncoding, shouldAppend)

Writes a JSON object into the given filename, optionally with the provided encoding and/or determine if it shouldAppend to an existing file.

Sources:

- src/openaf/core/IO.java:460

<a id="api-io-writefileasarray-0f6af7f8"></a>

## io.writeFileAsArray

### io.writeFileAsArray(aFilename, anArrayOfLines, anEncoding)

Writes an array of string lines into a file, optionally with the provided encoding

Sources:

- src/openaf/core/IO.java:537

<a id="api-io-writefilebytes-60a92468"></a>

## io.writeFileBytes

### io.writeFileBytes(aFilename, anArrayOfBytes)

Writes an array of bytes into the given filename.

Sources:

- src/openaf/core/IO.java:520

<a id="api-io-writefilegzipstream-82529f80"></a>

## io.writeFileGzipStream

### io.writeFileGzipStream(aFilename, shouldAppend) : JavaStream

Creates and returns a JavaStream to write to a gzip `aFilename`. Optionally if `shouldAppend`=true
it will append to an existing file. For example:

```javascript
var stream = io.writeFileGzipStream("afile.txt.gz");
ioStreamWrite(stream, "Hello "); // you can also use ioStreamWriteBytes
ioStreamWrite(stream, "World!");
stream.close();
```

Sources:

- src/openaf/core/IO.java:723

<a id="api-io-writefilejson-e3bc51f0"></a>

## io.writeFileJSON

### io.writeFileJSON(aJSONFile, aObj, aSpace)

Tries to write a javascript aObj into a aJSONFile with an optional aSpace.

Sources:

- js/openaf.js:14627

<a id="api-io-writefilelz4stream-32c07e75"></a>

## io.writeFileLZ4Stream

### io.writeFileLZ4Stream(aFile) : InputStream

Reads aFile as a LZ4 compressed file and returns the InputStream to read from. This is useful to read large files that are compressed with LZ4 without decompressing them into memory.

Sources:

- js/openaf.js:13659

<a id="api-io-writefilestream-7362e7c3"></a>

## io.writeFileStream

### io.writeFileStream(aFilename, shouldAppend) : JavaStream

Creates and returns a JavaStream to write to `aFilename`. If `shouldAppend` = true the stream will
append to the existing file. For example:

```javascript
var stream = io.writeFileStream("afile.txt");
ioStreamWrite(stream, "Hello "); // you can also use ioStreamWriteBytes
ioStreamWrite(stream, "World!");
stream.close();
```

Sources:

- src/openaf/core/IO.java:771

<a id="api-io-writefilestring-a4984e11"></a>

## io.writeFileString

### io.writeFileString(aFilename, aString, anEncoding, shouldAppend)

Writes a string into the given filename, optionally with the provided encoding and/or determine if it shouldAppend to an existing file.

Sources:

- src/openaf/core/IO.java:481

<a id="api-io-writefiletar4stream-fa8bd0b1"></a>

## io.writeFileTAR4Stream

### io.writeFileTAR4Stream(aTARfile, isGzip, aFunc)

Given aTARfile (or output stream (with isGzip = true/false)) will call aFunc with the Java TAR output stream. Note: for direct usage use io.writeFileTARStream

Sources:

- js/openaf.js:14475

<a id="api-io-writefiletarbytes-d72391ac"></a>

## io.writeFileTARBytes

### io.writeFileTARBytes(aTARfile, aFilePath, isGzip, aArrayBytes)

Given aTARfile (or output stream (with isGzip = true/false)) will write aArrayBytes into aFilePath in the TAR file/stream. Note: for multiple files use io.writeFileTARStream

Sources:

- js/openaf.js:14514

<a id="api-io-writefiletarstream-da934286"></a>

## io.writeFileTARStream

### io.writeFileTARStream(aTARfile, isGzip, aFunc, aDefaultMap)

Given aTARfile (or output stream (with isGzip = true/false)) will call aFunc(tion) providing, as argument, a writer function with three arguments: aFilePath, a Java input stream for the contents and the modification date for the target file.  Optionally aDefaultDate can be provided to be used whenever a date is not provided or for folders.

Sources:

- js/openaf.js:14526

<a id="api-io-writefiletoml-7b4d8d50"></a>

## io.writeFileTOML

### io.writeFileTOML(aFile, aObj)

Tries to write aObj into aFile as TOML.

Sources:

- js/openaf.js:13466

<a id="api-io-writefilexml-b9746c2b"></a>

## io.writeFileXML

### io.writeFileXML(aFilename, aXMLobject, anEncoding, shouldAppend)

Writes a XML object into the given filename, optionally with the provided encoding and/or determine if it shouldAppend to an existing file.

Sources:

- src/openaf/core/IO.java:500

<a id="api-io-writefileyaml-4001dad7"></a>

## io.writeFileYAML

### io.writeFileYAML(aYAMLFile, aObj, multidoc)

Tries to write a javascript aObj into a aYAMLFile. If multiDoc = true and aJson is an array the output will be multi-document.

Sources:

- js/openaf.js:14620

<a id="api-io-writelinendjson-710927a0"></a>

## io.writeLineNDJSON

### io.writeLineNDJSON(aNDJSONFile, aObj, aEncode)

Writes aObj into a single line on aNDJSONFile (newline delimited JSON) (or an output stream). Optionally you can provide an encoding (only is a string filename is provided)

Sources:

- js/openaf.js:14635

<a id="api-io-zip-0734d9cb"></a>

## io.zip

### io.zip(targetDir, zipFile, logFn, logErrFn)

Tries to zip a `targetDir` into a `zipFile`. Optionally you can provide a `logFn` and `logErrFn` to log the progress.
The `logFn` will receive the following object:

```javascript
{ type: "file" | "dir", source: [io.listFile entry], target: [targetPath] }
```

Sources:

- js/openaf.js:13574

