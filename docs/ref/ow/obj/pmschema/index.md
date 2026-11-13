# ow.obj.pmSchema

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.obj](../index.md) / [ow.obj.pmSchema](index.md)

<a id="api-ow-obj-pmschema-applyschema-27131ae7"></a>

## ow.obj.pmSchema.applySchema

### ow.obj.pmSchema.applySchema(aJavaPM, aSchema) : JavaParameterMap

Given aSchema (produced by ow.obj.pmSchema.fromJavaParameterMap) and aJavaPM (a Java Parameter Map) it  corrects the types where needed (for example: enforce that a integer should really be a long). The corrected Java Parameter Map is returned. If aJavaPM is not a Java Parameter Map it will try to convert to Map and return an output Map instead of JavaParameterMap.

Sources:

- js/owrap.obj.js:3285

<a id="api-ow-obj-pmschema-getschema-e4ccafb1"></a>

## ow.obj.pmSchema.getSchema

### ow.obj.pmSchema.getSchema(aJavaPM) : Map

Builds a type schema from the provided aJavaPM (a Java Parameter Map) to be used with  ow.obj.pmSchema.toJavaParameterMap to enforce a schema of types. If aJavaPM is not a Java Parameter Map it will try to convert to one from a Map.

Sources:

- js/owrap.obj.js:3271

<a id="api-ow-obj-pmschema-makekey-d653c34e"></a>

## ow.obj.pmSchema.makeKey

### ow.obj.pmSchema.makeKey(aJavaPM) : String

Produces a key for the aJavaPM (a Java parameter map or Map) to identify the provided map in a pmSchema when using ow.obj.applySchema.

Sources:

- js/owrap.obj.js:3124

