# $ssh

[Home](../index.md) / [All APIs](../all-apis.md) / [$ssh](index.md)

<a id="api-ssh-ssh-85742e02"></a>

## $ssh.$ssh

### $ssh.$ssh(aMap) : $ssh

Builds an object to allow access through ssh. aMap should be a ssh string with the format: ssh://user:pass@host:port/identificationKey?timeout=1234&#38;compression=true or a map with the keys: host, port, login, pass, id (file key) / key (string representation), compress and timeout. See "help SSH.SSH" for more info.

Sources:

- js/openaf.js:17659

<a id="api-ssh-cb-cc6e1639"></a>

## $ssh.cb

### $ssh.cb(aCallback) : $ssh

Sets aCallback function to execute during the execution of commands on a remote host defined by aMap (host, port, login, pass, id, compress and timeout).

Sources:

- js/openaf.js:17742

<a id="api-ssh-close-94c0a898"></a>

## $ssh.close

### $ssh.close() : $ssh

Closes a remote host connection defined by aMap (host, port, login, pass, id, compress and timeout).

Sources:

- js/openaf.js:17866

<a id="api-ssh-deltunnellocal-76f16583"></a>

## $ssh.delTunnelLocal

### $ssh.delTunnelLocal(aLocalInterface, aLocalPort) : $ssh

Deletes a local tunnel mapping aLocalInterface:aLocalPort

Sources:

- js/openaf.js:17923

<a id="api-ssh-deltunnelremote-0347735e"></a>

## $ssh.delTunnelRemote

### $ssh.delTunnelRemote(aRemoteInterface, aRemotePort) : $ssh

Deletes a remote tunnel mapping aRemoteInterface:aRemotePort

Sources:

- js/openaf.js:17934

<a id="api-ssh-exec-39ba05b0"></a>

## $ssh.exec

### $ssh.exec(aIdx) : Array

Executes a list of commands previously set on a remote host connection defined by aMap (host, port, login, pass, id, compress and timeout). IO is inherit. If aIdx is provided it will return the map entry for the corresponding command on the array otherwise it will return the array.

Sources:

- js/openaf.js:17996

<a id="api-ssh-exit-df7ed379"></a>

## $ssh.exit

### $ssh.exit(aFunc) : $ssh

Sets a callback aFunc to execute upon a command execution s a remote host connection defined by aMap (host, port, login, pass, id, compress and timeout).

Sources:

- js/openaf.js:18023

<a id="api-ssh-get-af4af1de"></a>

## $ssh.get

### $ssh.get(aIdx) : Object

Executes a list of commands previously set on a remote host connection defined by aMap (host, port, login, pass, id, compress and timeout). IO is not inherit. If aIdx is provided it will return the map entry for the corresponding command on the array otherwise it will return the array.

Sources:

- js/openaf.js:17945

<a id="api-ssh-getfile-f36e6c05"></a>

## $ssh.getFile

### $ssh.getFile(aSource, aTarget) : $ssh

Gets aSource filepath and stores it locally on aTarget from a remote host defined by aMap (host, port, login, pass, id, compress and timeout).

Sources:

- js/openaf.js:17777

<a id="api-ssh-getjson-e028b44b"></a>

## $ssh.getJson

### $ssh.getJson(aIdx) : Object

Executes a list of commands previously set on a remote host connection defined by aMap (host, port, login, pass, id, compress and timeout). IO is not inherit. If aIdx is provided it will return the map entry for the corresponding command on the array otherwise it will return the array. The stdout and stderr will be pre-parsed from json to objects.

Sources:

- js/openaf.js:17972

<a id="api-ssh-listfiles-0772e499"></a>

## $ssh.listFiles

### $ssh.listFiles(aRemotePath) : Array

Returns an array of maps with the listing of aRemotePath provided.

Sources:

- js/openaf.js:17810

<a id="api-ssh-mkdir-b76e25c3"></a>

## $ssh.mkdir

### $ssh.mkdir(aDirectory) : $ssh

Creates aDirectory via SFTP on a remote host defined by aMap (host, port, login, pass, id, compress and timeout).

Sources:

- js/openaf.js:17766

<a id="api-ssh-prefix-539d8e2f"></a>

## $ssh.prefix

### $ssh.prefix(aPrefix, aTemplate) : $ssh

When executing aCmd (with .get) it will use ow.format.streamSHPrefix with aPrefix and optionally aTemplate.

Sources:

- js/openaf.js:17753

<a id="api-ssh-pty-fb9c9c8c"></a>

## $ssh.pty

### $ssh.pty(aFlag) : $ssh

Sets the flag to use or not a pty term allocation on the ssh connection to a remote host defined by aMap (host, port, login, pass, id, key, compress and timeout).

Sources:

- js/openaf.js:17844

<a id="api-ssh-putfile-f182e86f"></a>

## $ssh.putFile

### $ssh.putFile(aSource, aTarget) : $ssh

Puts aSource local filepath and stores it remotely in aTarget on a remote host defined by aMap (host, port, login, pass, id, compress and timeout).

Sources:

- js/openaf.js:17788

<a id="api-ssh-pwd-31100b8c"></a>

## $ssh.pwd

### $ssh.pwd(aPwd) : $ssh

Sets aPwd directory for getting and sending files to a remote host defined by aMap (host, port, login, pass, id, compress and timeout).

Sources:

- js/openaf.js:17720

<a id="api-ssh-rename-000898c2"></a>

## $ssh.rename

### $ssh.rename(aSource, aTarget) : $ssh

Renames aSource filepath to aTarget filepath on a remote host defined by aMap (host, port, login, pass, id, compress and timeout).

Sources:

- js/openaf.js:17799

<a id="api-ssh-rm-7d48366e"></a>

## $ssh.rm

### $ssh.rm(aFilePath) : $ssh

Remove aFilePath from a remote host defined by aMap (host, port, login, pass, id, compress and timeout).

Sources:

- js/openaf.js:17822

<a id="api-ssh-rmdir-6c576ffe"></a>

## $ssh.rmdir

### $ssh.rmdir(aFilePath) : $ssh

Removes a directory from a remote host defined by aMap (host, port, login, pass, id, compress and timeout).

Sources:

- js/openaf.js:17833

<a id="api-ssh-sh-1095b09c"></a>

## $ssh.sh

### $ssh.sh(aCmd, aIn) : $ssh

Sets aCmd to be executed with an optional aIn (stdin) on the remote host defined by aMap (host, port, login, pass, id, compress and timeout).

Sources:

- js/openaf.js:17709

<a id="api-ssh-timeout-1b76bfc9"></a>

## $ssh.timeout

### $ssh.timeout(aTimeout) : $ssh

Sets aTimeout in ms for the ssh/sftp connection to a remote host defined by aMap (host, port, login, pass, id, compress and timeout).

Sources:

- js/openaf.js:17731

<a id="api-ssh-tunnellocal-56ed1286"></a>

## $ssh.tunnelLocal

### $ssh.tunnelLocal(aLocalPort, aRemoteHost, aRemotePort) : $ssh

Creates a local tunnel mapping aLocalPort to aRemoteHost:aRemotePort using the ssh connection defined by aMap (host, port, login, pass, id, compress and timeout).

Sources:

- js/openaf.js:17879

<a id="api-ssh-tunnellocalbind-452f43aa"></a>

## $ssh.tunnelLocalBind

### $ssh.tunnelLocalBind(aLocalInterface, aLocalPort, aRemoteHost, aRemotePort) : $ssh

Creates a local tunnel mapping aLocalInterface:aLocalPort to aRemoteHost:aRemotePort using the ssh connection defined by aMap (host, port, login, pass, id, compress and timeout).

Sources:

- js/openaf.js:17890

<a id="api-ssh-tunnelremote-44e4710d"></a>

## $ssh.tunnelRemote

### $ssh.tunnelRemote(aRemotePort, aLocalAddress aLocalPort) : $ssh

Creates a remote tunnel mapping aRemotePort to aLocalAddress:aLocalPort using the ssh connection defined by aMap (host, port, login, pass, id, compress and timeout).

Sources:

- js/openaf.js:17901

<a id="api-ssh-tunnelremotebind-1f6a785a"></a>

## $ssh.tunnelRemoteBind

### $ssh.tunnelRemoteBind(aRemoteInterface, aRemotePort, aLocalAddress aLocalPort) : $ssh

Creates a remote tunnel mapping aRemoteInterface:aRemotePort to aLocalAddress:aLocalPort using the ssh connection defined by aMap (host, port, login, pass, id, compress and timeout).

Sources:

- js/openaf.js:17912

