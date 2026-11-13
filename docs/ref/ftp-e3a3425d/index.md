# FTP

[Home](../index.md) / [All APIs](../all-apis.md) / [FTP](index.md)

<a id="api-ftp-ftp-399f89be"></a>

## FTP.FTP

### FTP.FTP(aHost, aPort, aLogin, aPass, isFTPS, isImplicit, aProtocol, isPassive, isBinary, aTimeout) : FTP

Creates an instance of a FTP/FTPS client (and connects) given a host, port, login username and password. Alternatively you can provide a FTP/FTPS url where aHost = ftp://user:pass@host:port/?timeout=1234&#38;passive=true&#38;binary=true or ftps://user:pass@host:port/?timeout=1234&#38;passive=true&#38;binary=true&#38;implicit=false&#38;protocol=TLS.

Sources:

- src/openaf/plugins/FTP.java:51

<a id="api-ftp-cd-c473720b"></a>

## FTP.cd

### FTP.cd(aPath)

Changes the remote directory to the corresponding path.

Sources:

- src/openaf/plugins/FTP.java:303

<a id="api-ftp-close-0aa2825e"></a>

## FTP.close

### FTP.close()

Closes the FTP/FTPS connection.

Sources:

- src/openaf/plugins/FTP.java:180

<a id="api-ftp-ftpget-7108058d"></a>

## FTP.ftpGet

### FTP.ftpGet(aRemoteFile, aLocalFile) : JavaStream

Retrieves a remote file over the FTP/FTPS connection to be stored on the local path provided. If aLocalFile is not provided the remote file contents will be returned as a Java Stream.

Sources:

- src/openaf/plugins/FTP.java:457

<a id="api-ftp-ftpput-74c53d13"></a>

## FTP.ftpPut

### FTP.ftpPut(aSource, aRemoteFile)

Sends aSource file (if string) or a Java stream to a remote file path over a FTP/FTPS connection.

Sources:

- src/openaf/plugins/FTP.java:479

<a id="api-ftp-get-ebcd30ee"></a>

## FTP.get

### FTP.get(aRemoteFilePath, aLocalFilePath) : String

Retrieves a file, using the FTP/FTPS connection, from aRemoteFilePath to aLocalFilePath. Use FTP.getBytes in case you are reading a binary file into memory.

Sources:

- src/openaf/plugins/FTP.java:397

<a id="api-ftp-getbytes-169df727"></a>

## FTP.getBytes

### FTP.getBytes(aRemoteFile) : anArrayOfBytes

Returns an array of bytes with the contents of aRemoteFilePath, using the FTP/FTPS connection.

Sources:

- src/openaf/plugins/FTP.java:413

<a id="api-ftp-getftpclient-3d4cb0b4"></a>

## FTP.getFTPClient

### FTP.getFTPClient() : Object

Obtains the internal FTP/FTPS client.

Sources:

- src/openaf/plugins/FTP.java:218

<a id="api-ftp-listfiles-903848f8"></a>

## FTP.listFiles

### FTP.listFiles(aPath) : Map

Returns a files array where each entry has filename, longname, filepath, size, permissions, lastModified, createTime, isDirectory and isFile.

Sources:

- src/openaf/plugins/FTP.java:329

<a id="api-ftp-mkdir-7af45f92"></a>

## FTP.mkdir

### FTP.mkdir(aPath)

Tries to create a remote directory for the provided aPath.

Sources:

- src/openaf/plugins/FTP.java:316

<a id="api-ftp-put-22424303"></a>

## FTP.put

### FTP.put(aSourceFilePath, aRemoteFilePath)

Copies aSourceFilePath to aRemoteFilePath, using the FTP/FTPS connection.

Sources:

- src/openaf/plugins/FTP.java:443

<a id="api-ftp-putbytes-af61ab20"></a>

## FTP.putBytes

### FTP.putBytes(aRemoteFilePath, bytes)

Writes an array of bytes on aRemoteFilePath, using the FTP/FTPS connection.

Sources:

- src/openaf/plugins/FTP.java:429

<a id="api-ftp-pwd-2199f2db"></a>

## FTP.pwd

### FTP.pwd() : String

Returns the current remote path.

Sources:

- src/openaf/plugins/FTP.java:292

<a id="api-ftp-rename-a3255c5c"></a>

## FTP.rename

### FTP.rename(aOriginalName, aNewName)

Renames a remote original filename to a newname.

Sources:

- src/openaf/plugins/FTP.java:253

<a id="api-ftp-rm-c367c35f"></a>

## FTP.rm

### FTP.rm(aFilePath)

Removes a remote filename at the provided aFilePath.

Sources:

- src/openaf/plugins/FTP.java:266

<a id="api-ftp-rmdir-551740ae"></a>

## FTP.rmdir

### FTP.rmdir(aPath)

Removes a remote directory at the provided aPath.

Sources:

- src/openaf/plugins/FTP.java:279

<a id="api-ftp-setbinarymode-e8c6225c"></a>

## FTP.setBinaryMode

### FTP.setBinaryMode(isBinary)

Switches between binary and ascii file transfer mode.

Sources:

- src/openaf/plugins/FTP.java:241

<a id="api-ftp-setpassivemode-099e17f3"></a>

## FTP.setPassiveMode

### FTP.setPassiveMode(isPassive)

Switches between passive and active mode.

Sources:

- src/openaf/plugins/FTP.java:229

<a id="api-ftp-settimeout-9615ceed"></a>

## FTP.setTimeout

### FTP.setTimeout(aTimeout)

Sets aTimeout in ms for the FTP/FTPS connection.

Sources:

- src/openaf/plugins/FTP.java:201

