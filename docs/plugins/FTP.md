# FTP Java Plugin Reference

The `FTP` plugin provides plain FTP and FTPS (SSL/TLS implicit/explicit) file transfers based on Apache Commons Net `FTPClient` and `FTPSClient`.

---

## Loading Syntax

```javascript
plugin("FTP");
var ftp = new FTP(host, port, login, pass, isFTPS, isImplicit, protocol, isPassive, isBinary, timeout);
// Or URI-style constructor:
var ftp = new FTP("ftp://user:pass@host:21/?passive=true&binary=true&timeout=5000");
```

---

## API Methods

| Method | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `cd(path)` | `String` | `void` | Changes remote working directory. |
| `pwd()` | *none* | `String` | Returns current remote directory path. |
| `mkdir(path)` | `String` | `void` | Creates remote directory. |
| `rmdir(path)` | `String` | `void` | Removes remote directory. |
| `rm(path)` | `String` | `void` | Deletes remote file. |
| `rename(oldPath, newPath)` | `String, String` | `void` | Renames remote file/directory. |
| `listFiles(path)` | `[String]` | `Object` | Returns `{ files: [ { filename, filepath, size, permissions, lastModified, isDirectory, isFile }, ... ] }`. |
| `get(remoteFile, localFile)` | `String, [String]` | `String` | Downloads remote file to local disk. |
| `getBytes(remoteFile)` | `String` | `byte[]` | Downloads remote file directly to byte array. |
| `put(sourceFile, remoteFile)` | `String, [String]` | `void` | Uploads local file to remote server. |
| `putBytes(remoteFile, bytes)` | `String, byte[]` | `void` | Uploads byte array to remote server. |
| `ftpGet(remoteFile, localFile)` | `String, [String]` | `InputStream \| String` | Downloads file or returns Java `InputStream`. |
| `ftpPut(source, remoteFile)` | `String \| InputStream, String` | `void` | Uploads from file path or Java `InputStream`. |
| `setPassiveMode(isPassive)` | `boolean` | `void` | Enables passive (`true`) or active (`false`) mode. |
| `setBinaryMode(isBinary)` | `boolean` | `void` | Enables binary (`true`) or ASCII (`false`) mode. |
| `setTimeout(timeoutMs)` | `int` | `void` | Sets socket connection timeout. |
| `getFTPClient()` | *none* | `FTPClient` | Returns internal Apache Commons `FTPClient`/`FTPSClient` instance. |
| `close()` | *none* | `void` | Logs out and closes FTP connection. |

---

## Practical Code Example

```javascript
plugin("FTP");
var ftp = new FTP("ftp.example.com", 21, "user", "pass", false, false, "TLS", true, true, 10000);

print("Current Dir: " + ftp.pwd());
ftp.cd("/uploads");

var list = ftp.listFiles(".");
list.files.forEach(f => {
  print(f.permissions + " " + f.size + " " + f.filename);
});

ftp.put("/local/data.csv", "remote_data.csv");
var fileBytes = ftp.getBytes("remote_data.csv");
ftp.close();
```
