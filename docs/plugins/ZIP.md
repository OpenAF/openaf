# ZIP Java Plugin Reference

The `ZIP` plugin provides in-memory and streaming NIO (`jar:` FileSystem) ZIP archive manipulation, extraction, compression, GZIP utilities, and Apache Commons Compress bridges.

---

## Decompression limits

ZIP/GZIP reads, `io.gunzip`, `io.gunzipStream`, `io.readFileGzipStream`, `io.unzip`, and the generic decompression bridges enforce finite operation-scoped quotas. OpenAF resolves each limit from the Java system property, then the `__flags.ARCHIVE` field, then the built-in default.

| Java system property | `__flags.ARCHIVE` field | Default |
| --- | --- | --- |
| `openaf.archive.maxInputBytes` | `maxInputBytes` | 256 MiB |
| `openaf.archive.maxEntryBytes` | `maxEntryBytes` | 64 MiB |
| `openaf.archive.maxTotalBytes` | `maxTotalBytes` | 256 MiB |
| `openaf.archive.maxEntries` | `maxEntries` | 100,000 |
| `openaf.archive.maxRatio` | `maxRatio` | 1,000 |

Remote oPacks stream to private staging and use a 128 MiB per-entry default. The same explicit Java property and runtime flag take precedence. See [oPack integrity checks](../opacks.md#integrity-checks).

Set flags to positive safe integers in trusted scripts or in `.openaf_profile` before opening the archive. For example, `__flags.ARCHIVE.maxEntryBytes = 100 * 1024 * 1024` allows entries up to 100 MiB. For a single invocation, pass the same group through `OAF_FLAGS`.

```sh
OAF_FLAGS='{"ARCHIVE":{"maxEntryBytes":104857600}}' opack install ./jdbc-duckdb.opack
```

OpenAF reserves `__flags.ARCHIVE` for trusted runtime configuration. The declarative `ojob.flags` merge skips this group.

The ratio check has a 1 MiB startup allowance. Streaming readers count actual input and output; random-access ZIP readers preflight central-directory count, sizes and ratio and enforce actual output against declared and configured limits. These are per-operation limits, not a process-wide memory quota. Repeated independent reads are separate operations. Compressed bytes already buffered by the caller cannot be retroactively bounded.

Excess data throws `ArchiveLimits.LimitException` without returning the violating chunk. Failed in-memory loads preserve prior state. ZIP listing drains payloads through the same limits and still checks CRCs; metadata-only listing does not decompress. `io.unzip` treats quota errors as fatal, removes its current temporary file and preserves an existing destination; files completed before a later quota error remain. Other existing unsafe-path errors can still be logged and skipped. Increase limits only for trusted workloads; overrides also increase the maximum permitted resource use.

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
| | `getFile(name)` | `String` | `byte[]` | Extracts file entry contents by name; returns `null` if absent. |
| | `putFile(name, data)` | `String, byte[] \| String` | `void` | Adds/overwrites entry in memory. |
| | `remove(name)` | `String` | `ZIP` | Removes entry from in-memory ZIP archive. |
| | `list(filePath)` | `[String]` | `Map` | Returns `{ "<entry>": { name, size, compressedSize, comment, crc, time }, ... }`. |
| | `generate(options, dontReload)` | `Map, bool` | `byte[]` | Generates ZIP byte array (`options.compressionLevel`: 0-9). |
| | `generate2File(path, opts, dontReload)` | `String, Map, bool` | `void` | Writes generated ZIP directly to file. |
| | `close()` | *none* | `void` | Clears in-memory buffers and closes file handles. |
| **Streaming NIO** | `streamCreate(path)` | `String` | `void` | Creates an empty ZIP file on disk. |
| | `streamCreateFolder(path, folder)` | `String, String` | `boolean` | Creates directory entry in disk ZIP. |
| | `streamGetFile(path, name)` | `String, String` | `byte[]` | Extracts single entry using a local archive handle; returns `null` if absent. |
| | `streamGetFileStream(path, name)` | `String, String` | `InputStream` | Streams entry using an independent archive handle; returns `null` if absent. |
| | `streamPutFile(path, name, bytes, useTmp)` | `String, String, byte[], bool` | `void` | Writes entry into disk archive directly. |
| | `streamPutFileStream(path, name, is, useTmp)` | `String, String, InputStream\|Array, bool` | `void` | Streams file or batch array `[{ n, s }]` into disk archive. |
| | `streamRemoveFile(path, name, useTmp)` | `String, String, bool` | `void` | Deletes entry directly from disk archive. |
| **Static GZIP** | `ZIP.gzip(bytes)` | `byte[]` | `byte[]` | Compresses byte array with GZIP. |
| | `ZIP.gunzip(bytes)` | `byte[]` | `byte[]` | Decompresses GZIP byte array. |
| **Compress Adapters** | `getCompressInputStream(is)` / `getCompressOutputStream(os, type)` / `getArchiveInputStream(is)` | *varies* | *varies* | Apache Commons Compress stream factories. |

---

Each stream returned by `streamGetFileStream` owns its archive handle. Close it in a `finally` block after use. Opening another stream, reading bytes, or closing a different stream does not invalidate it. Calling `ZIP.close()` closes all outstanding streams as well as the loaded archive.

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
