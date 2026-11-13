# ow.ch

[Home](../../index.md) / [All APIs](../../all-apis.md) / [ow](../index.md) / [ow.ch](index.md)

## Subcategories

- [ow.ch.comms](comms/index.md)
- [ow.ch.persistence](persistence/index.md)
- [ow.ch.server](server/index.md)
- [ow.ch.types](types/index.md)
- [ow.ch.utils](utils/index.md)

<a id="api-ow-ch-create-bfa713ed"></a>

## ow.ch.create

### ow.ch.create(aName, shouldCompress, type, options) : ow.ch

Creates a channel of key/values with `aName`. Optionally you can specify if keys should also
be compressed in memory (`shouldCompress` = true), a channels implementation `type` and corresponding
`options` in a map.

Example:

```javascript
ow.ch.create("myChan", false, "db", { db: myDB, from: "TABLE" });
```

Sources:

- js/owrap.ch.js:4639

<a id="api-ow-ch-destroy-3d3f6e18"></a>

## ow.ch.destroy

### ow.ch.destroy(aName) : ow.ch

Deletes all data and removes references to the channel aName, including its locks. Stop producers and wait for pending channel operations/subscriber jobs before destroying a channel. Channel creation, destruction and listing are serialized; destruction does not drain active operations.

Sources:

- js/owrap.ch.js:4749

<a id="api-ow-ch-foreach-03b4e1b1"></a>

## ow.ch.forEach

### ow.ch.forEach(aName, aFunction) : ow.ch

Will execute the provided aFunction with each key and value for the channel identified by the aName provided.

Sources:

- js/owrap.ch.js:4914

<a id="api-ow-ch-get-e7f2bbb1"></a>

## ow.ch.get

### ow.ch.get(aName, aKey) : ow.ch

Returns the value associated with the provided aKey on the channel identified by aName.

Sources:

- js/owrap.ch.js:5211

<a id="api-ow-ch-getall-e4ae8da1"></a>

## ow.ch.getAll

### ow.ch.getAll(aName, fullInfo) : Array

Will return all values for the channel identified by the aName provided.

Sources:

- js/owrap.ch.js:4928

<a id="api-ow-ch-getkeys-658b6069"></a>

## ow.ch.getKeys

### ow.ch.getKeys(aName, full) : Array

Returns all keys in the form of an array for the channel identified by the aName provided. Optionally you can specify full = yes to obtain the detailed internal key index.

Sources:

- js/owrap.ch.js:4971

<a id="api-ow-ch-getset-37665e4d"></a>

## ow.ch.getSet

### ow.ch.getSet(aName, aMatchMap, aKey, aValue, aTimestamp, aUUID)

Tries to update the channel identified by the provided aName with aKey and aValue only if it's possible to get the same aKey and  aMatchMap matches the current aValue. Optionally you can provide the internal aTimestamp (if the provided aTimestamp is smaller than getVersion the value will not be set)

Sources:

- js/owrap.ch.js:5271

<a id="api-ow-ch-getsortedkeys-2c50db92"></a>

## ow.ch.getSortedKeys

### ow.ch.getSortedKeys(aName, full) : Array

Returns all keys in the form of an array for the channel identified by the aName provided by order of the last modification. Optionally you can specify full = yes to obtain the detailed internal key index.

Sources:

- js/owrap.ch.js:4984

<a id="api-ow-ch-getversion-1b3d681e"></a>

## ow.ch.getVersion

### ow.ch.getVersion(aName) : Number

Returns the current version (usually a timestamp) for the aName channel.

Sources:

- js/owrap.ch.js:4678

<a id="api-ow-ch-list-3a049b3b"></a>

## ow.ch.list

### ow.ch.list() : Array

Returns a list the current channels available.

Sources:

- js/owrap.ch.js:4734

<a id="api-ow-ch-pop-6afef07c"></a>

## ow.ch.pop

### ow.ch.pop(aName) : Object

Mimics a LIFO queue behaviour by returning the last modified key/value entry for the channel aName. The entry will be removed from the channel.

Sources:

- js/owrap.ch.js:5242

<a id="api-ow-ch-push-16bdbd71"></a>

## ow.ch.push

### ow.ch.push(aName, aKey, aValue) : ow.ch

Equivalent to ow.ch.set trying to set, for the channel aName, aKey and aValue trying to mimic a queue behaviour.

Sources:

- js/owrap.ch.js:5069

<a id="api-ow-ch-set-7d84ed61"></a>

## ow.ch.set

### ow.ch.set(aName, aKey, aValue, aTimestamp)

Tries to insert/update the channel identified by the provided aName with aKey and aValue. Optionally you can provide the internal aTimestamp (if the provided aTimestamp is smaller than getVersion the value will not be set)

Sources:

- js/owrap.ch.js:5002

<a id="api-ow-ch-setall-f740880c"></a>

## ow.ch.setAll

### ow.ch.setAll(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp)

Given anArrayOfKeys composed of strings identifying the key fields from the anArrayOfMapData provided will try to insert/update all values on the channel identified by aName. Optionally you can provide aTimestamp  (if the provided aTimestamp is smaller than getVersion the value will not be set)

Sources:

- js/owrap.ch.js:5080

<a id="api-ow-ch-shift-d2f991f6"></a>

## ow.ch.shift

### ow.ch.shift(aName) : Object

Mimics a FIFO queue behaviour by returning the first modified key/value entry for the channel aName. The entry will be removed from the channel.

Sources:

- js/owrap.ch.js:5341

<a id="api-ow-ch-size-da977773"></a>

## ow.ch.size

### ow.ch.size(aName) : Number

Returns the number of keys currently available for the channel aName.

Sources:

- js/owrap.ch.js:4784

<a id="api-ow-ch-stopalljobs-1c541cd1"></a>

## ow.ch.stopAllJobs

### ow.ch.stopAllJobs(aName) : ow.ch

Each channel subscription (using ow.ch.subscribe) will create internal jobs (threads). To stop all these immediately provide the channel aName.

Sources:

- js/owrap.ch.js:4719

<a id="api-ow-ch-subscribe-3815acd1"></a>

## ow.ch.subscribe

### ow.ch.subscribe(aName, aFunction, onlyFromNowm, anId) : String

Adds a callback function to the channel `aName`. The callback function will receive, as arguments:
the channel name, the operation, a key or an array of keys (for operation = setall/unsetall), a value or an array
of values (for operation = setall/unsetall) and the `ow.ch` object. Returns the subscriber id.
Optionally you can specify that existing
elements won't trigger operation = set callback calls and/or a custom subscriber `anId`.

Possible operations:

- `set`
- `setall`
- `unset`
- `unsetall`

Sources:

- js/owrap.ch.js:4828

<a id="api-ow-ch-unset-20706383"></a>

## ow.ch.unset

### ow.ch.unset(aName, aKey, aTimestamp) : ow.obj.channel

Tries to remove all associations to the provided aKey on the channel identified by aName. Optionally aTimestamp can be provided.

Sources:

- js/owrap.ch.js:5375

<a id="api-ow-ch-unsetall-b06ccb3b"></a>

## ow.ch.unsetAll

### ow.ch.unsetAll(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp)

Given anArrayOfKeys composed of strings identifying the key fields from the anArrayOfMapData provided will try to delete all values on the channel identified by aName. Optionally you can provide aTimestamp  (if the provided aTimestamp is smaller than getVersion the value will not be set)

Sources:

- js/owrap.ch.js:5145

<a id="api-ow-ch-unsubscribe-bf5292d9"></a>

## ow.ch.unsubscribe

### ow.ch.unsubscribe(aName, aId) : ow.ch

Tries to unsubscribe aId callback from the channel identified by the aName provided.

Sources:

- js/owrap.ch.js:4882

<a id="api-ow-ch-unsubscribeall-6561f4a8"></a>

## ow.ch.unsubscribeAll

### ow.ch.unsubscribeAll(aName) : ow.ch

Tries to unsubscribe all callback functions from the channel identified by the aName provided.

Sources:

- js/owrap.ch.js:4900

<a id="api-ow-ch-waitforjobs-e4de1923"></a>

## ow.ch.waitForJobs

### ow.ch.waitForJobs(aName, aTimeout) : ow.ch

Each channel subscription (using ow.ch.subscribe) will create internal jobs (threads). To wait for  this jobs to finish provide the channel aName and, optionally, aTimeout.

Sources:

- js/owrap.ch.js:4690

