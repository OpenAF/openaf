# pods

[Home](../index.md) / [All APIs](../all-apis.md) / [pods](index.md)

<a id="api-pods-declare-0755c0df"></a>

## pods.declare

### pods.declare(aId, exports)

Declares a new module, aId, as the provided exports literal.

Sources:

- js/openaf.js:7265

<a id="api-pods-define-928f34ca"></a>

## pods.define

### pods.define(aId, aDepsArray, aFactoryFunction)

Defines a new module given aId, aDepsArray with depend id modules and a factory function.

Sources:

- js/openaf.js:7226

<a id="api-pods-require-89601f9a"></a>

## pods.require

### pods.require(aIds, aCallbackFunction)

Requires a module or a list of modules and all of its dependencies. Optionally you can provide aCallbackFunction to inject the required modules into.

Sources:

- js/openaf.js:7299

