# ow.ai.normalize

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.ai](../index.md) / [ow.ai.normalize](index.md)

<a id="api-ow-ai-normalize-denormalizewithschema-f47d5485"></a>

## ow.ai.normalize.denormalizeWithSchema

### ow.ai.normalize.denormalizeWithSchema(aMapOfNormalizedData, aMapSchema, convertBools) : Map

Tries to denormalize aMapOfNormalizedData (result from ow.ai.normalize.withSchema) according with aMapSchema provided.

Sources:

- js/owrap.ai.js:6269

<a id="api-ow-ai-normalize-intarray-665ab975"></a>

## ow.ai.normalize.intArray

### ow.ai.normalize.intArray(anArray) : Array

Returns anArray where all numbers have been rounded to an integer value.

Sources:

- js/owrap.ai.js:6253

<a id="api-ow-ai-normalize-quantitize-ce6799b2"></a>

## ow.ai.normalize.quantitize

### ow.ai.normalize.quantitize(anArray, aLevels) : Array

Given anArray of numbers tries to quantitize returning an array of values between 0 and aLevels. If aLevels is not provided it will default to 10.

Sources:

- js/owrap.ai.js:6228

<a id="api-ow-ai-normalize-scalearray-dc381fc0"></a>

## ow.ai.normalize.scaleArray

### ow.ai.normalize.scaleArray(anArray, aMax, aMin) : Array

Given anArray of numbers tries to normalize returning an array of values between 0 and 1. If aMax or aMin are not provided they will be infered from the provided anArray.

Sources:

- js/owrap.ai.js:6194

<a id="api-ow-ai-normalize-softmax-b0e3b7a8"></a>

## ow.ai.normalize.softMax

### ow.ai.normalize.softMax(anArray, aTemperature) : Array

Given anArray of numbers tries to apply a Softmax function returning an array of values between 0 and 1. If aTemperature is provided it will be used to control the smoothness of the output.

Sources:

- js/owrap.ai.js:6208

<a id="api-ow-ai-normalize-tofeaturesarray-5ab229a0"></a>

## ow.ai.normalize.toFeaturesArray

### ow.ai.normalize.toFeaturesArray(anArrayOfObjects, ignoredAttrs) : Map

Tries to convert anArrayOfObjects into an array of array of values where each value is positioned in the resulting array by the corresponding key sorted. The result will be a map with the resulting array in 'data' (with the features values ignoring any key on ignoredAttrs), the 'ignoredAttrs' and keys with all the 'keys' identified.

Sources:

- js/owrap.ai.js:6461

<a id="api-ow-ai-normalize-withschema-c82518c9"></a>

## ow.ai.normalize.withSchema

### ow.ai.normalize.withSchema(aSimpleMapOfData, aMapSchema, convertBools) : Array

Tries to normalize and return `aSimpleMapOfData` normalized according with `aMapSchema` provided. Each element of `aMapSchema`
should be a map describing how to normalize `aSimpleMapOfData`. Example:

```javascript
var ar = [
   {name:'workout', duration:'120', enjoy: true, time:1455063275, tags:['gym', 'weights'], crucial: false },
   {name:'lunch', duration:'45', enjoy: false, time:1455063275, tags:['salad', 'wine'], crucial: true },
   {name:'sleep', duration:'420', enjoy: true, time:1455063275, tags:['bed', 'romance'], crucial: true}
];

var sar = {
   name    : { col: 0, oneOf: [ 'workout', 'lunch', 'sleep' ] },
   duration: { col: 1, min: 0, max: 1000 },
   enjoy   : { col: 2 },
   tags    : { col: 3, anyOf: [ 'gym', 'weights', 'salad', 'wine', 'bed', 'romance' ] },
   crucial : { col: 4, scaleOf: [
     { val: true,  weight: 0.85 },
     { val: false, weight: 0.15 }
   ]},
};

$from(ar).sort("time").select((r) => { return normalize(r, sar); });
```

Sources:

- js/owrap.ai.js:6350

