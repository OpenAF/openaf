# ow.ch.utils.mvs

[Home](../../../../index.md) / [All APIs](../../../../all-apis.md) / [ow](../../../index.md) / [ow.ch](../../index.md) / [ow.ch.utils](../index.md) / [ow.ch.utils.mvs](index.md)

<a id="api-ow-ch-utils-mvs-list-dee70197"></a>

## ow.ch.utils.mvs.list

### ow.ch.utils.mvs.list(aMVSFile) : Array

Returns a list of names of maps in the corresponding aMVSFile.

Sources:

- js/owrap.ch.js:6153

<a id="api-ow-ch-utils-mvs-remove-552a7056"></a>

## ow.ch.utils.mvs.remove

### ow.ch.utils.mvs.remove(aMVSFile, aMapToRemove)

Removes aMapToRemove on the provided aMVSFile.

Sources:

- js/owrap.ch.js:6216

<a id="api-ow-ch-utils-mvs-rename-e522dec2"></a>

## ow.ch.utils.mvs.rename

### ow.ch.utils.mvs.rename(aMVSFile, anOriginalMap, aDestinationMap)

Renames anOriginalMap by aDestinationMap on the provided aMVSFile.

Sources:

- js/owrap.ch.js:6186

<a id="api-ow-ch-utils-mvs-reshard-13279e0a"></a>

## ow.ch.utils.mvs.reshard

### ow.ch.utils.mvs.reshard(aPath, aNewFiles, shouldCompress) : Number

Changes the number of files of an "mvs" channel created with multifile = true on aPath to aNewFiles, redistributing all the entries of all the maps. Returns the number of entries moved. The channel(s) using aPath need to be destroyed first. The new files are built on a temporary folder inside aPath and only replace the current ones (and the mvs-multifile.json manifest) after all the entries are copied and counted. Use shouldCompress = true if the channel was created with it.

Sources:

- js/owrap.ch.js:6247

