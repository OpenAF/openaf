# ZIP

[Home](../index.md) / [All APIs](../all-apis.md) / [ZIP](index.md)

<a id="api-zip-zip-26f95889"></a>

## ZIP.ZIP

### ZIP.ZIP(anArrayOfBytes) : ZIP

Creates a ZIP object instance. If anArrayOfBytes is provided it will read it as a ZIP compressed contents into the ZIP object.

Sources:

- src/openaf/plugins/ZIP.java:103

<a id="api-zip-clean-992d53bc"></a>

## ZIP.clean

### ZIP.clean()

Will clean all internal data regarding any previously ZIP contents handled by this object.

Sources:

- src/openaf/plugins/ZIP.java:157

<a id="api-zip-close-92172289"></a>

## ZIP.close

### ZIP.close()

Closes the loaded ZIP file and all outstanding entry streams associated with this object.

Sources:

- src/openaf/plugins/ZIP.java:168

<a id="api-zip-generate-ad8a166e"></a>

## ZIP.generate

### ZIP.generate(aMapOfOptions, dontReload) : anArrayOfBytes

Will generate a ZIP `anArrayOfBytes` contents (that can then by saved into a file) given the provided options (a map
where you can specify the compressionLevel as a number). If `dontReload` = true then the internal ZIP object contents
won't be reloaded after generating. Example:

```javascript
plugin("ZIP");
var zip = new ZIP();
var text = new java.lang.String("Some example test to zip into a zip file");
var openaf = io.readFileBytes("c:\\apps\\OpenAF\\openaf.jar");
zip.putFile("text.txt", text.getBytes());
zip.putFile("openaf.jar", openaf);
var newZip = zip.generate({"compressionLevel": 9});
var zip = new ZIP(newZip);
print(beautifier(zip.list()));
```

Sources:

- src/openaf/plugins/ZIP.java:473

<a id="api-zip-generate2file-4e5dfa62"></a>

## ZIP.generate2File

### ZIP.generate2File(aFile, aMapOfOptions, dontReload) : anArrayOfBytes

Will generate a ZIP into aFile given the provided options (a map where you can specify the compressionLevel as a number). If dontReload = true then the internal ZIP object contents won't be reloaded after generating.

Sources:

- src/openaf/plugins/ZIP.java:539

<a id="api-zip-getfile-fbce4fd5"></a>

## ZIP.getFile

### ZIP.getFile(aFilename) : anArrayOfBytes

Will uncompress the corresponding aFilename from the ZIP contents into an array of bytes. Returns null if the entry is absent.

Sources:

- src/openaf/plugins/ZIP.java:194

<a id="api-zip-gunzip-13a7a359"></a>

## ZIP.gunzip

### ZIP.gunzip(anArrayOfBytes) : anObject

Will gunzip/uncompress the provided anArrayOfBytes into the original anObject compressed with ZIP.gzip.

Sources:

- src/openaf/plugins/ZIP.java:137

<a id="api-zip-gzip-f19a416f"></a>

## ZIP.gzip

### ZIP.gzip(anObject) : ArrayOfBytes

Will gzip/compress the contents of the anObject into an array of bytes. To uncompress use ZIP.gunzip.

Sources:

- src/openaf/plugins/ZIP.java:116

<a id="api-zip-list-5c7002fc"></a>

## ZIP.list

### ZIP.list(aFilePath) : Map

Will list all files and folders of the loaded ZIP contents into a Map with name, size, compressedSize, comment, crc and time. Optionally you can provide a zip aFilePath instead of using the current in-memory zip. File traversal reads every payload and checks its integrity. Use listMetadata for a faster directory-only listing.

Sources:

- src/openaf/plugins/ZIP.java:606

<a id="api-zip-listmetadata-55a7de17"></a>

## ZIP.listMetadata

### ZIP.listMetadata(aFilePath) : Map

Lists a ZIP file's central directory without reading or decompressing its payloads. Returns the
same entry fields as `ZIP.list`: `name`, `size`, `compressedSize`, `comment`, `crc` and `time`.
Central-directory comments are included. This does not validate payload checksums or compressed
data, and requires a valid central directory. Use `ZIP.list(aFilePath)` when payload integrity
checks are needed. The loaded in-memory archive and outstanding entry streams are unchanged.

Sources:

- src/openaf/plugins/ZIP.java:633

<a id="api-zip-load-53873a61"></a>

## ZIP.load

### ZIP.load(anArrayOfBytes)

Loads anArrayOfBytes ZIP contents into the internal object structures.

Sources:

- src/openaf/plugins/ZIP.java:582

<a id="api-zip-loadfile-b5313ebc"></a>

## ZIP.loadFile

### ZIP.loadFile(aFilename)

Will load a ZIP file aFilename into the ZIP object internal structure.

Sources:

- src/openaf/plugins/ZIP.java:689

<a id="api-zip-putfile-1d68ca09"></a>

## ZIP.putFile

### ZIP.putFile(aFilename, anArrayOfBytes)

Will add anArrayOfBytes to the ZIP contents as aFilename.

Sources:

- src/openaf/plugins/ZIP.java:214

<a id="api-zip-remove-f4a75b92"></a>

## ZIP.remove

### ZIP.remove(aFilename)

Will remove aFilename from the ZIP contents.

Sources:

- src/openaf/plugins/ZIP.java:238

<a id="api-zip-streamcreate-191d04fe"></a>

## ZIP.streamCreate

### ZIP.streamCreate(aFilePath)

Creates an empty ZIP file on aFilePath.

Sources:

- src/openaf/plugins/ZIP.java:425

<a id="api-zip-streamcreatefolder-681c0459"></a>

## ZIP.streamCreateFolder

### ZIP.streamCreateFolder(aFilePath, aFolder) : boolean

Creates aFolder on aFilePath ZIP file. Returns true if the folder was created or false if it already existed.

Sources:

- src/openaf/plugins/ZIP.java:438

<a id="api-zip-streamgetfile-650b252c"></a>

## ZIP.streamGetFile

### ZIP.streamGetFile(aFilePath, aName) : anArrayOfBytes

Retrieves aName file from aFilePath zip file without loading the zip file contents into memory returning the  file contents as an array of bytes, or null if the entry is absent. Uses an independent archive handle.

Sources:

- src/openaf/plugins/ZIP.java:252

<a id="api-zip-streamgetfilestream-7c1e3a4a"></a>

## ZIP.streamGetFileStream

### ZIP.streamGetFileStream(aFilePath, aName) : JavaInputStream

Retrieves aName file from aFilePath zip file without loading the zip file contents into memory returning a  Java InputStream, or null if the entry is absent. Each stream owns an independent archive handle. Close the stream after use to release that handle. ZIP.close() also closes outstanding streams.

Sources:

- src/openaf/plugins/ZIP.java:270

<a id="api-zip-streamputfile-a702f283"></a>

## ZIP.streamPutFile

### ZIP.streamPutFile(aFilePath, aName, anArrayOfBytes)

Sets a aName file on the aFilePath ZIP provided with the anArrayOfBytes provided. All missing directories will be created.

Sources:

- src/openaf/plugins/ZIP.java:307

<a id="api-zip-streamputfilestream-dd168500"></a>

## ZIP.streamPutFileStream

### ZIP.streamPutFileStream(aFilePath, aName, aJavaInputStream, useTempFile)

Sets a aName file on the aFilePath ZIP provided with the aJavaInputStream provided. All missing directories will be created. Optionally you can specify if a temp file should be used instead of memory (useTempFile = true).  Additionally, for performance, you can provide an array of maps (composed of "n" name of file and "s" javaInputStream) instead of  aJavaInputStream (aName will be ignored in this case).

Sources:

- src/openaf/plugins/ZIP.java:348

<a id="api-zip-streamremovefile-8298a6bd"></a>

## ZIP.streamRemoveFile

### ZIP.streamRemoveFile(aFilePath, aName)

Removes a file/directory aName from the aFilePath ZIP file provided.

Sources:

- src/openaf/plugins/ZIP.java:399

