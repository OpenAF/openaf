# $$

[Home](../index.md) / [All APIs](../all-apis.md) / [$$](index.md)

<a id="api-get-4b05599e"></a>

## $$.get

### $$.get(aPath) : Object

Given `aObject` it will try to parse the `aPath` and retrieve the corresponding object under that path. Example:

```javascript
var a = { a : 1, b : { c: 2, d: [0, 1] } };

print($$(a).get("b.c")); // 2
sprint($$(a).get("b.d")); // [0, 1]
print($$(a).get("b.d[0]")); // 0
```

Sources:

- js/openafsigil.js:35

<a id="api-geti-e249530e"></a>

## $$.getI

### $$.getI(aPath) : Object

Given `aObject` it will try to parse the `aPath` (in a case-insensitive way) and retrieve the corresponding object under that path. Example:

```javascript
var a = { a : 1, b : { c: 2, d: [0, 1] } };

print($$(a).getI("b.C")); // 2
sprint($$(a).getI("B.d")); // [0, 1]
print($$(a).getI("B.D[0]")); // 0
```

Sources:

- js/openafsigil.js:68

<a id="api-set-3e79498e"></a>

## $$.set

### $$.set(aPath, aNewValue) : Object

Given `aObject` it will try to parse the `aPath` and set the corresponding object under that path to `aNewValue`. Example:

```javascript
var a = { a : 1, b : { c: 2, d: [0, 1] } };

sprint($$(a).set("b.c", 123)); // { a : 1, b : { c: 123, d: [0, 1] } }
```

Sources:

- js/openafsigil.js:113

<a id="api-unset-d30854db"></a>

## $$.unset

### $$.unset(aPath) : Object

Given `aObject` it will try to parse the `aPath` and unset the corresponding object under that path. Example:

```javascript
var a = { a : 1, b : { c: 2, d: [0, 1] } };

sprint($$(a).set("b.c")); // { a : 1, b : { d: [0, 1] } }
```

Sources:

- js/openafsigil.js:154

