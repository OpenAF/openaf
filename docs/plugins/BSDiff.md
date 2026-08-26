# BSDiff Java Plugin Reference

The `BSDiff` plugin provides binary diffing and patch generation based on the BSDiff algorithm and Apache Commons Compression, enabling efficient delta updates for files and byte arrays.

---

## Loading Syntax

```javascript
plugin("BSDiff");
var bsdiff = new BSDiff();
```

---

## Constructor & Configuration

* `new BSDiff()`: Instantiates the BSDiff engine with BZIP2 compression by default.

---

## API Methods

| Method | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `diff(oldFile, newFile, patchFile)` | `String, String, String` | `void` | Compares binary `oldFile` with `newFile` and writes compressed delta to `patchFile`. |
| `diffBytes(oldBytes, newBytes)` | `byte[], byte[]` | `byte[]` | Compares two byte arrays and returns the compressed binary patch delta. |
| `patch(oldFile, patchFile, newFile)` | `String, String, String` | `void` | Applies `patchFile` to `oldFile` and writes the reconstructed binary to `newFile`. |
| `patchBytes(oldBytes, patchBytes)` | `byte[], byte[]` | `byte[]` | Applies binary `patchBytes` to `oldBytes` and returns the reconstructed `byte[]`. |
| `setCompression(aCompression)` | `String` | `void` | Configures compression algorithm (e.g. `"bzip2"`, `"gz"`). |
| `getCompression()` | *none* | `String` | Returns the current compression format in use (default: `"bzip2"`). |

---

## Practical Code Example

```javascript
plugin("BSDiff");
var bsdiff = new BSDiff();

// Working with files
bsdiff.diff("app-v1.bin", "app-v2.bin", "patch-v1-to-v2.bsdiff");
bsdiff.patch("app-v1.bin", "patch-v1-to-v2.bsdiff", "app-v2-reconstructed.bin");

// Working in-memory with byte arrays
var v1Bytes = io.readFileBytes("app-v1.bin");
var v2Bytes = io.readFileBytes("app-v2.bin");
var patch = bsdiff.diffBytes(v1Bytes, v2Bytes);
var v2Restored = bsdiff.patchBytes(v1Bytes, patch);
```
