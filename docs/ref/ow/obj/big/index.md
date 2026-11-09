# ow.obj.big

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.obj](../index.md) / [ow.obj.big](index.md)

<a id="api-ow-obj-big-create-207c006e"></a>

## ow.obj.big.create

### ow.obj.big.create(shouldCompressKeys) : Object

Creates a "big" map object that compresses contents in memory. Optionally if `shouldCompressKeys` = true
the key map will also be compressed. See also:

- `ow.obj.big.set`
- `ow.obj.big.setAll`
- `ow.obj.big.get`
- `ow.obj.big.find`

Sources:

- js/owrap.obj.js:1248

<a id="api-ow-obj-big-find-cf5fbc2b"></a>

## ow.obj.big.find

### ow.obj.big.find(aFunction) : Array

Will execute the provided aFunction providing each key available. For the keys where the function returns true the corresponding value will be gathered into the final resulting array.

Sources:

- js/owrap.obj.js:1525

<a id="api-ow-obj-big-get-5d07fa83"></a>

## ow.obj.big.get

### ow.obj.big.get(aKeyMap) : Map

Retrieves a value map given the provided `aKeyMap`.
Example:

```javascript
var big = ow.obj.big.create();
var data = [
		{"name": "Anne", "country": "USA", "company": "Wedo"},
		{"name": "Rui", "country": "Portugal", "company": "Wedo"},
		{"name": "Paulo", "country": "Portugal", "company": "Sonae"},
		{"name": "Peter", "country": "USA", "company": "ACME"},
		{"name": "Louis", "country": "USA", "company": "ACME"}
];
big.setAll(["name"], data);
big.get({"name": "Rui"}); // {"name": "Rui", "country": "Portugal", "company": "Wedo"}
```

Sources:

- js/owrap.obj.js:1459

<a id="api-ow-obj-big-getsize-f41b4afa"></a>

## ow.obj.big.getSize

### ow.obj.big.getSize() : Number

Returns the current number of keys available.

Sources:

- js/owrap.obj.js:1402

<a id="api-ow-obj-big-remove-d0412542"></a>

## ow.obj.big.remove

### ow.obj.big.remove(aKeyMap)

Removes aKeyMap and corresponding value.

Sources:

- js/owrap.obj.js:1324

<a id="api-ow-obj-big-set-d00d91f0"></a>

## ow.obj.big.set

### ow.obj.big.set(aKeyMap, aValueMap, aTimestamp)

Sets `aValueMap` associated with a `aKeyMap`. Optionally you can set the internal `aTimestamp` for the record.
Example:

```javascript
var big = ow.obj.big.create();
big.set({"name": "Anne"}, {"name": "Anne", "country": "USA", "company": "Wedo"});
```

Sources:

- js/owrap.obj.js:1269

<a id="api-ow-obj-big-setall-ebb0e71e"></a>

## ow.obj.big.setAll

### ow.obj.big.setAll(anArrayKeyNames, anArrayOfValues, aTimestamp)

Given `anArrayOfValues` will set them internally using the keys on `anArrayKeyNames` to define
the corresponding keys. Optionally you can set the internal `aTimestamp` for the record.

Example:

```javascript
var big = ow.obj.big.create();
var data = [
		{"name": "Anne", "country": "USA", "company": "Wedo"},
		{"name": "Rui", "country": "Portugal", "company": "Wedo"},
		{"name": "Paulo", "country": "Portugal", "company": "Sonae"},
		{"name": "Peter", "country": "USA", "company": "ACME"},
		{"name": "Louis", "country": "USA", "company": "ACME"}
];
big.setAll(["name", "country"], data);
```

Sources:

- js/owrap.obj.js:1344

