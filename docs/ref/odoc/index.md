# ODoc

[Home](../index.md) / [All APIs](../all-apis.md) / [ODoc](index.md)

<a id="api-odoc-add-e36e1333"></a>

## ODoc.add

### ODoc.add(aKey, aFullKey, aValue, aFormat)

Adds a ODoc entry given a key (a unique name), a full key (a function or object signature) and a corresponding text value. Optionally set aFormat to "markdown" or "md" to enable Markdown display.

Sources:

- js/odoc.js:17

<a id="api-odoc-addall-9d3786ce"></a>

## ODoc.addAll

### ODoc.addAll(aODoc)

Adds an ODoc Map structure imported from another ODoc object.

Sources:

- js/odoc.js:70

<a id="api-odoc-get-37704008"></a>

## ODoc.get

### ODoc.get(aKey) : Map

Returns the ODoc entry corresponding to the unique key provided.

Sources:

- js/odoc.js:34

<a id="api-odoc-getall-94453dd7"></a>

## ODoc.getAll

### ODoc.getAll() : Map

Returns the ODoc entire Map structure to be exported somewhere else.

Sources:

- js/odoc.js:54

<a id="api-odoc-getkeys-5d3e6d89"></a>

## ODoc.getKeys

### ODoc.getKeys() : Array

Returns an array with all keys from this ODoc.

Sources:

- js/odoc.js:44

