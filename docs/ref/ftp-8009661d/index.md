# $ftp

[Home](../index.md) / [All APIs](../all-apis.md) / [$ftp](index.md)

<a id="api-ftp-ftp-0e168049"></a>

## $ftp.$ftp

### $ftp.$ftp(aMap) : $ftp

Builds an object to allow access through ftp/ftps. aMap should be a ftp/ftps string with the format: ftp://user:pass@host:port/?timeout=1234&#38;passive=true&#38;binary=true or ftps://user:pass@host:port/?timeout=1234&#38;passive=true&#38;binary=true&#38;implicit=false&#38;protocol=TLS or a map with the keys: host, port, login, pass, secure, implicit, protocol, passive, binary and timeout. See "help FTP.FTP" for more info.

Sources:

- js/openaf.js:17646

<a id="api-ftp-binary-73e43c21"></a>

## $ftp.binary

### $ftp.binary(isBinary) : $ftp

Sets the file transfer mode between binary and ascii.

Sources:

- js/openaf.js:17736

<a id="api-ftp-cd-48310c73"></a>

## $ftp.cd

### $ftp.cd(aPath) : $ftp

Changes the current remote working directory.

Sources:

- js/openaf.js:17691

<a id="api-ftp-close-c16b6a1f"></a>

## $ftp.close

### $ftp.close() : $ftp

Closes a remote host connection defined by aMap.

Sources:

- js/openaf.js:17825

<a id="api-ftp-getfile-9d8aa609"></a>

## $ftp.getFile

### $ftp.getFile(aSource, aTarget) : $ftp

Gets aSource filepath and stores it locally on aTarget from a remote host defined by aMap.

Sources:

- js/openaf.js:17758

<a id="api-ftp-listfiles-0de5bc07"></a>

## $ftp.listFiles

### $ftp.listFiles(aRemotePath) : Array

Returns an array of maps with the listing of aRemotePath provided.

Sources:

- js/openaf.js:17791

<a id="api-ftp-mkdir-0110f1c5"></a>

## $ftp.mkdir

### $ftp.mkdir(aDirectory) : $ftp

Creates aDirectory via FTP/FTPS on a remote host defined by aMap.

Sources:

- js/openaf.js:17747

<a id="api-ftp-passive-5ce204ca"></a>

## $ftp.passive

### $ftp.passive(isPassive) : $ftp

Sets the passive mode for the ftp/ftps connection.

Sources:

- js/openaf.js:17725

<a id="api-ftp-putfile-835fb790"></a>

## $ftp.putFile

### $ftp.putFile(aSource, aTarget) : $ftp

Puts aSource local filepath or Java stream and stores it remotely in aTarget on a remote host defined by aMap.

Sources:

- js/openaf.js:17769

<a id="api-ftp-pwd-7fd2b55d"></a>

## $ftp.pwd

### $ftp.pwd() : String

Returns the current remote working directory.

Sources:

- js/openaf.js:17702

<a id="api-ftp-rename-820e146f"></a>

## $ftp.rename

### $ftp.rename(aSource, aTarget) : $ftp

Renames aSource filepath to aTarget filepath on a remote host defined by aMap.

Sources:

- js/openaf.js:17780

<a id="api-ftp-rm-092511f1"></a>

## $ftp.rm

### $ftp.rm(aFilePath) : $ftp

Remove aFilePath from a remote host defined by aMap.

Sources:

- js/openaf.js:17803

<a id="api-ftp-rmdir-b43cfc86"></a>

## $ftp.rmdir

### $ftp.rmdir(aFilePath) : $ftp

Removes a directory from a remote host defined by aMap.

Sources:

- js/openaf.js:17814

<a id="api-ftp-timeout-c64bd218"></a>

## $ftp.timeout

### $ftp.timeout(aTimeout) : $ftp

Sets aTimeout in ms for the ftp/ftps connection to a remote host defined by aMap.

Sources:

- js/openaf.js:17714

