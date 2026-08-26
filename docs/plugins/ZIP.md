# ZIP Java Plugin Reference

The `ZIP` plugin provides in-memory and streaming NIO (`jar:` FileSystem) ZIP archive manipulation, extraction, compression, GZIP utilities, and Apache Commons Compress bridges.

---

## Loading Syntax

```javascript
plugin("ZIP");
var zip = new ZIP(zipBytes);
```

---

## API Methods

| Category | Method | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- | :--- |
| **In-Memory** | `load(bytes)` / `loadFile(path)` | `byte[] \| String` | `ZIP` | Loads archive contents into memory. |
| | `getFile(name)` | `String` | `byte[]` | Extracts file entry contents by name. |
| | `putFile(name, data)` | `String, byte[] \| String` | `void` | Adds/overwrites entry in memory. |
| | `remove(name)` | `String` | `ZIP` | Removes entry from in-memory ZIP archive. |
| | `list(filePath)` | `[String]` | `Map` | Returns `{ "<entry>": { name, size, compressedSize, comment, crc, time }, ... }`. |
| | `generate(options, dontReload)` | `Map, bool` | `byte[]` | Generates ZIP byte array (`options.compressionLevel`: 0-9). |
| | `generate2File(path, opts, dontReload)` | `String, Map, bool` | `void` | Writes generated ZIP directly to file. |
| | `close()` | *none* | `void` | Clears in-memory buffers and closes file handles. |
| **Streaming NIO** | `streamCreate(path)` | `String` | `void` | Creates an empty ZIP file on disk. |
| | `streamCreateFolder(path, folder)` | `String, String` | `boolean` | Creates directory entry in disk ZIP. |
| | `streamGetFile(path, name)` | `String, String` | `byte[]` | Extracts single entry without loading full archive. |
| | `streamGetFileStream(path, name)` | `String, String` | `InputStream` | Streams entry directly from disk archive. |
| | `streamPutFile(path, name, bytes, useTmp)` | `String, String, byte[], bool` | `void` | Writes entry into disk archive directly. |
| | `streamPutFileStream(path, name, is, useTmp)` | `String, String, InputStream\|Array, bool` | `void` | Streams file or batch array `[{ n, s }]` into disk archive. |
| | `streamRemoveFile(path, name, useTmp)` | `String, String, bool` | `void` | Deletes entry directly from disk archive. |
| **Static GZIP** | `ZIP.gzip(bytes)` | `byte[]` | `byte[]` | Compresses byte array with GZIP. |
| | `ZIP.gunzip(bytes)` | `byte[]` | `byte[]` | Decompresses GZIP byte array. |
| **Compress Adapters** | `getCompressInputStream(is)` / `getCompressOutputStream(os, type)` / `getArchiveInputStream(is)` | *varies* | *varies* | Apache Commons Compress stream factories. |

---

## Practical Code Example

```javascript
plugin("ZIP");

// In-Memory ZIP Creation
var zip = new ZIP();
zip.putFile("hello.txt", "Hello World from OpenAF!");
zip.putFile("data/config.json", stringify({ env: "production" }));

var zipBytes = zip.generate({ compressionLevel: 9 });
io.writeFileBytes("bundle.zip", zipBytes);

// Inspecting entries
var list = (new ZIP()).list("bundle.zip");
Object.keys(list).forEach(entry => {
  print(entry + " (" + list[entry].size + " bytes)");
});

// Streaming large files directly without full memory load
var z = new ZIP();
z.streamCreate("large_archive.zip");
z.streamPutFile("large_archive.zip", "test.txt", af.fromString2Bytes("Streamed content"), true);

// Static GZIP
var gzipped = ZIP.gzip(af.fromString2Bytes("Compress me"));
var uncompressed = af.fromBytes2String(ZIP.gunzip(gzipped));
```
