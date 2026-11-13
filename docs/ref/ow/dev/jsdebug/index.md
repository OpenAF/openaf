# ow.dev.JSDebug

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.dev](../index.md) / [ow.dev.JSDebug](index.md)

<a id="api-ow-dev-jsdebug-setall-99406512"></a>

## ow.dev.JSDebug.setAll

### ow.dev.JSDebug.setAll(aObject, aPrefix, aSuffix, eachLineTmpl)

Iterates over all function members of aObject (by name string) and calls JSDebug.setFn() on each, injecting aPrefix/aSuffix and an optional per-line eachLineTmpl into every function body. Non-function members are recursed into.

Sources:

- js/owrap.dev.js:367

<a id="api-ow-dev-jsdebug-setfn-2eb60cdb"></a>

## ow.dev.JSDebug.setFn

### ow.dev.JSDebug.setFn(aObject, aMethod, aFn, aPrefix, aSuffix, eachLineTmpl) : Map

Instruments a single function identified by the string name aObject and the string aMethod (or a top-level function when aObject == aMethod). The body of the target function is rewritten: aPrefix is injected after the opening brace, aSuffix before the closing brace, and the optional eachLineTmpl is interpolated after each intermediate line (template variables: obj, method, lineNum). aFn can supply an alternative original function to use as source. Returns a map with origFn, newFn, fn, method and object fields.

Sources:

- js/owrap.dev.js:410

<a id="api-ow-dev-jsdebug-settestingwrap-c4b44657"></a>

## ow.dev.JSDebug.setTestingWrap

### ow.dev.JSDebug.setTestingWrap(aName, aObject, aMethod, aFn)

Wraps aMethod on aObject so that its body is executed inside an ow.test.test() block named aName. Returns the same map as JSDebug.setFn().

Sources:

- js/owrap.dev.js:304

<a id="api-ow-dev-jsdebug-settestingwrapall-637de568"></a>

## ow.dev.JSDebug.setTestingWrapAll

### ow.dev.JSDebug.setTestingWrapAll(aObject)

Calls JSDebug.setTestingWrap() on every function member of aObject (by name string), wrapping each method in an ow.test.test() block. Non-function members are recursed into.

Sources:

- js/owrap.dev.js:389

<a id="api-ow-dev-jsdebug-unsetall-7435d3ff"></a>

## ow.dev.JSDebug.unSetAll

### ow.dev.JSDebug.unSetAll()

Restores all functions previously wrapped via JSDebug.setFn() back to their original implementations. Only effective when shouldTrack was set to true at construction time.

Sources:

- js/owrap.dev.js:352

<a id="api-ow-dev-jsdebug-unsetfn-702e1fb5"></a>

## ow.dev.JSDebug.unSetFn

### ow.dev.JSDebug.unSetFn(aMap)

Restores a previously wrapped function to its original implementation. aMap must contain object and method fields (as returned by JSDebug.setFn()). When shouldTrack is true the wrap record is also removed from the "&#95;&#95;debug" channel.

Sources:

- js/owrap.dev.js:318

