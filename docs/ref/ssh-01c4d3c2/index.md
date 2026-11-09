# SSH

[Home](../index.md) / [All APIs](../all-apis.md) / [SSH](index.md)

<a id="api-ssh-ssh-efdc09dc"></a>

## SSH.SSH

### SSH.SSH(aHost, aPort, aLogin, aPass, anIdentificationKey, withCompression, aTimeout, noStrictHostKeyChecking) : SSH

Creates an instance of a SSH client (and connects) given a host, port, login username, password and,  optionally a identity file path and the indication of use of compression. Alternatively you can provide  just a simple url where aHost = ssh://user:pass@host:port/identificationKey?timeout=1234&#38;compression=true.

Sources:

- src/openaf/plugins/SSH.java:78

<a id="api-ssh-cd-6b6c20fb"></a>

## SSH.cd

### SSH.cd(aPath)

Changes the remote directory to the corresponding path.

Sources:

- src/openaf/plugins/SSH.java:617

<a id="api-ssh-close-d729ae09"></a>

## SSH.close

### SSH.close()

Closes the SSH connection.

Sources:

- src/openaf/plugins/SSH.java:224

<a id="api-ssh-deltunnellocal-6bfaf4e3"></a>

## SSH.delTunnelLocal

### SSH.delTunnelLocal(aLocalInterface, aLocalPort)

Removes a TCP tunnel on the local port over the SSH connection. This is the same as delTunnelLocal, but allows you to specify a local interface.

Sources:

- src/openaf/plugins/SSH.java:314

<a id="api-ssh-deltunnelremote-f7503f54"></a>

## SSH.delTunnelRemote

### SSH.delTunnelRemote(aRemoteInterface, aRemotePort)

Removes a TCP tunnel on the remote port over the SSH connection. This is the same as delTunnelRemote, but allows you to specify a remote interface.

Sources:

- src/openaf/plugins/SSH.java:349

<a id="api-ssh-df-7129f1c4"></a>

## SSH.df

### SSH.df(aPath) : Map

Tries to return an object, for the remote provided path, with size, used space, available space,  availableForRoot space and capacityPercentage.

Sources:

- src/openaf/plugins/SSH.java:637

<a id="api-ssh-exec-33534f67"></a>

## SSH.exec

### SSH.exec(aCommand, aStdIn, shouldOutputAlso, pty, outputMap, callbackFunc) : Object

Executes a command over the SSH connection. You can optionally provide the input and indicate that it `shouldOutputAlso`
(boolean) to stdout and if you want to allocate a `pty` (boolean). The stderr will be stored in `__stderr` and also output
if `shouldOutputAlso` = true. If `outputMap` instead of the stdout string a map with stdout, stderr and exitcode will be returned.
A `callbackFunc` can be provided, if `shouldOutputAlso` is undefined or false, that will receive, as parameters, an output stream, a error stream and an input stream. If defined the stdout and stderr won't
be available for the `outputMap` if true. Example:

```javascript
ssh.exec("someCommand", void 0, void 0, false, void 0, false, function(o, e, i) { ioStreamReadLines(o, (f) => { print("TEST | " + String(f)) }, void 0, false) });
```

Sources:

- src/openaf/plugins/SSH.java:138

<a id="api-ssh-execsudo-fa95cb60"></a>

## SSH.execSudo

### SSH.execSudo(aCommandWithSudo, aUser, aStdIn, shouldOutputAlso, pty, outputMap, callbackFunc) : Object

Executes a command over the SSH connection using sudo to `aUser`. You can optionally provide the input and indicate that
it `shouldOutputAlso` (boolean) to stdout and if you want to allocate a `pty` (boolean). The stderr will be stored in
`__stderr` and also output if `shouldOutputAlso` = true. If `outputMap` instead of the stdout string a map with stdout, stderr and exitcode will be returned.
A `callbackFunc` can be provided, if `shouldOutputAlso` is undefined or false, that will receive, as parameters, an output stream, a error stream and an input stream. If defined the stdout and stderr won't
be available for the `outputMap` if true. Example:

```javascript
ssh.execSudo("someCommand", void 0, void 0, false, void 0, false, function(o, e) { ioStreamReadLines(o, (f) => { print("TEST | " + String(f)) }) });
```

Sources:

- src/openaf/plugins/SSH.java:159

<a id="api-ssh-get-586b66ad"></a>

## SSH.get

### SSH.get(aRemoteFilePath, aLocalFilePath, monitor) : String

Retrieves a file, using the SFTP connection, from aRemoteFilePath to aLocalFilePath. Use SSH.getBytes in case you are reading a binary file. Optionally you can provided a callback function called monitor (see more in ow.format.sshProgress)

Sources:

- src/openaf/plugins/SSH.java:504

<a id="api-ssh-getbytes-f5804f94"></a>

## SSH.getBytes

### SSH.getBytes(aRemoteFile) : anArrayOfBytes

Returns an array of bytes with the contents of aRemoteFilePath, using the SFTP connection.

Sources:

- src/openaf/plugins/SSH.java:533

<a id="api-ssh-getexecchannel-89389728"></a>

## SSH.getExecChannel

### SSH.getExecChannel() : Object

Obatins the internal SSH session exec channel.

Sources:

- src/openaf/plugins/SSH.java:407

<a id="api-ssh-getfile-306cd7d1"></a>

## SSH.getFile

### SSH.getFile(aRemoteFile, aLocalFile) : anArrayOfBytes

Retrieves a remote file over the SSH connection to be stored on the local path provided. If aLocalFile is not provided the remote file contents will be returned as an array of bytes.

Sources:

- src/openaf/plugins/SSH.java:1008

<a id="api-ssh-getsftpchannel-98a263d8"></a>

## SSH.getSftpChannel

### SSH.getSftpChannel() : Object

Obtains the internal SSH session sftp channel.

Sources:

- src/openaf/plugins/SSH.java:392

<a id="api-ssh-listfiles-1329d015"></a>

## SSH.listFiles

### SSH.listFiles(aPath) : Map

Returns a files array where each entry has filename, longname, filepath, size, permissions, lastModified,  createTime, isDirectory and isFile.

Sources:

- src/openaf/plugins/SSH.java:692

<a id="api-ssh-mkdir-9186e5f6"></a>

## SSH.mkdir

### SSH.mkdir(aPath)

Tries to create a remote directory for the provided aPath.

Sources:

- src/openaf/plugins/SSH.java:672

<a id="api-ssh-put-6d3d5ac3"></a>

## SSH.put

### SSH.put(aSourceFilePath, aRemoteFilePath, monitor)

Copies a aSourceFilePath to aRemoteFilePath, using the SFTP connection. Optionally you can provided a callback function called monitor (see more in ow.format.sshProgress)

Sources:

- src/openaf/plugins/SSH.java:589

<a id="api-ssh-putbytes-2cca7ce7"></a>

## SSH.putBytes

### SSH.putBytes(aRemoteFilePath, bytes, monitor)

Writes an array of bytes on aRemoteFilePath, using the SFTP connection. Optionally you can provided a callback function called monitor (see more in ow.format.sshProgress)

Sources:

- src/openaf/plugins/SSH.java:564

<a id="api-ssh-pwd-e7efbb90"></a>

## SSH.pwd

### SSH.pwd() : String

Returns the current remote path.

Sources:

- src/openaf/plugins/SSH.java:481

<a id="api-ssh-rename-ce73a9f2"></a>

## SSH.rename

### SSH.rename(aOriginalName, aNewName)

Renames a remote original filename to a newname.

Sources:

- src/openaf/plugins/SSH.java:422

<a id="api-ssh-rm-0a5cc71a"></a>

## SSH.rm

### SSH.rm(aFilePath)

Removes a remote filename at the provided aFilePath.

Sources:

- src/openaf/plugins/SSH.java:442

<a id="api-ssh-rmdir-fbd8da66"></a>

## SSH.rmdir

### SSH.rmdir(aPath)

Removes a remote directory at the provided aPath.

Sources:

- src/openaf/plugins/SSH.java:461

<a id="api-ssh-sendfile-f88f56ed"></a>

## SSH.sendFile

### SSH.sendFile(aSourceFile, aRemoteFile)

Sends a source file over the SSH connection to be stored on the remote path provided.

Sources:

- src/openaf/plugins/SSH.java:852

<a id="api-ssh-settimeout-4ad79e1a"></a>

## SSH.setTimeout

### SSH.setTimeout(aTimeout)

Sets aTimeout in ms for the SSH connection.

Sources:

- src/openaf/plugins/SSH.java:237

<a id="api-ssh-sftpget-b90110ba"></a>

## SSH.sftpGet

### SSH.sftpGet(aRemoteFile, aLocalFile, monitor) : JavaStream

Retrieves a remote file over the SFTP connection to be stored on the local path provided. If aLocalFile is not provided the remote file contents will be returned as a Java Stream Optionally you can provided a callback function called monitor (see more in ow.format.sshProgress)

Sources:

- src/openaf/plugins/SSH.java:932

<a id="api-ssh-sftpput-95358d93"></a>

## SSH.sftpPut

### SSH.sftpPut(aSource, aRemoteFile, monitor)

Sends aSource file (if string) or a Java stream to a remote file path over a SFTP connection. Optionally you can provided a callback function called monitor (see more in ow.format.sshProgress)

Sources:

- src/openaf/plugins/SSH.java:967

<a id="api-ssh-tunnellocal-24cf1a36"></a>

## SSH.tunnelLocal

### SSH.tunnelLocal(aLocalPort, aRemoteHost, aRemotePort)

Creates a TCP tunnel between a local port and a remote host and port over the SSH connection.

Sources:

- src/openaf/plugins/SSH.java:303

<a id="api-ssh-tunnellocalbind-a715454d"></a>

## SSH.tunnelLocalBind

### SSH.tunnelLocalBind(aLocalInterface, aLocalPort, aRemoteHost, aRemotePort)

Creates a TCP tunnel, on the aLocalInterface only, between a local port and a remote host and port over the SSH connection.

Sources:

- src/openaf/plugins/SSH.java:326

<a id="api-ssh-tunnelremote-bb36b89a"></a>

## SSH.tunnelRemote

### SSH.tunnelRemote(aRemotePort, aLocalAddress, aLocalPort)

Creates a TCP tunnel between a local host and port to be accessed from a remote port over the SSH connection.

Sources:

- src/openaf/plugins/SSH.java:338

<a id="api-ssh-tunnelremotebind-712ce12c"></a>

## SSH.tunnelRemoteBind

### SSH.tunnelRemoteBind(aRemoteInterface, aRemotePort, aLocalAddress, aLocalPort)

Creates a TCP tunnel, on the aRemoteInterface only, between a local host and port to be accessed from a remote  port over the SSH connection.

Sources:

- src/openaf/plugins/SSH.java:361

