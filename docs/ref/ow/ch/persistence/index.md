# ow.ch.persistence

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.ch](../index.md) / [ow.ch.persistence](index.md)

<a id="api-ow-ch-persistence-create-31d155c7"></a>

## ow.ch.persistence.create

### ow.ch.persistence.create(aChannel, aFilename, anArrayOfKeys, shouldCompress, forAll)

Adds a channel identified by the name aChannel, trying to restore data from aFilename given anArrayOfKeys (strings representing the key fields). Optionally indicating if keys should be compressed in memory with shouldCompress = true and/or existing subscribers should run for all elements (forAll = true)

Sources:

- js/owrap.ch.js:7123

<a id="api-ow-ch-persistence-getsubscriberfunc-acca1599"></a>

## ow.ch.persistence.getSubscriberFunc

### ow.ch.persistence.getSubscriberFunc(aFilename)

Returns a function to be used with ow.ch.subscribe persisting any existing or new data into aFilename provided.

Sources:

- js/owrap.ch.js:7059

<a id="api-ow-ch-persistence-restore-a76b1a11"></a>

## ow.ch.persistence.restore

### ow.ch.persistence.restore(aChannel, aFilename, anArrayOfKeys) : Number

Tries to restore that previously persisted using ow.ch.getSubscribeFunc from the aFilename using  anArrayOfKeys (strings representing the string list of fields used as index). The values will be restored to the aChannel name provided. Returns -1 in case of error or the data loaded length otherwise.

Sources:

- js/owrap.ch.js:7093

