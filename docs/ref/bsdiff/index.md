# BSDiff

[Home](../index.md) / [All APIs](../all-apis.md) / [BSDiff](index.md)

<a id="api-bsdiff-bsdiff-e5416042"></a>

## BSDiff.BSDiff

### BSDiff.BSDiff()

Creates a new BSDiff instance to diff and patch binary files.

Sources:

- src/openaf/plugins/BSDiff.java:44

<a id="api-bsdiff-diff-bf05d06a"></a>

## BSDiff.diff

### BSDiff.diff(anOldFile, aNewFile, aPatchFile)

Given anOldFile and aNewFile binary file, the two will be compared and a new compressed aPatchFile will be generated. Check compression to be used with BSDiff.getCompression().

Sources:

- src/openaf/plugins/BSDiff.java:54

<a id="api-bsdiff-diffbytes-d241a816"></a>

## BSDiff.diffBytes

### BSDiff.diffBytes(oldArrayOfBytes, newArrayOfBytes) : ArrayOfBytes

Given oldArrayOfBytes and newArrayOfBytes, the two will be compared and a new compressed ArrayOfBytes will be generated and returned. Check compression to be used with BSDiff.getCompression().

Sources:

- src/openaf/plugins/BSDiff.java:86

<a id="api-bsdiff-getcompression-340707f4"></a>

## BSDiff.getCompression

### BSDiff.getCompression() : String

Returns the current compression method in use.

Sources:

- src/openaf/plugins/BSDiff.java:114

<a id="api-bsdiff-patchbytes-5c3bc526"></a>

## BSDiff.patchBytes

### BSDiff.patchBytes(oldArrayOfBytes, patchArrayOfBytes) : ArrayOfBytes

Given an oldArrayOfBytes will apply patchArrayOfBytes (produced by diff/diffBytes) returning a new patched array of bytes.

Sources:

- src/openaf/plugins/BSDiff.java:125

### BSDiff.patchBytes(oldFile, patchFile, newFile) : ArrayOfBytes

Given an oldFile will apply a patchFile (produced by diff/diffBytes) and write the result to newFile.

Sources:

- src/openaf/plugins/BSDiff.java:139

<a id="api-bsdiff-setcompression-e8213118"></a>

## BSDiff.setCompression

### BSDiff.setCompression(aCompression)

Sets a different compression method to be used (based on Apache Commons Compression available methods).

Sources:

- src/openaf/plugins/BSDiff.java:103

