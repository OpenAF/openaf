# $bottleneck

[Home](../index.md) / [All APIs](../all-apis.md) / [$bottleneck](index.md)

<a id="api-bottleneck-destroy-a3b90339"></a>

## $bottleneck.destroy

### $bottleneck.destroy()

Destroys any existing bottleneck definition.

Sources:

- js/openaf.js:12326

<a id="api-bottleneck-exec-8b9e021e"></a>

## $bottleneck.exec

### $bottleneck.exec(args) : Object

Creates a bottleneck `aName` to execute `aFunction` with the provided `args`. Returns what the function returns:

```javascript
$bottleneck("myFunc", (a, b) => { ... return result; })
.maxExec(3)
.maxWait(5000)
.exec(2, 4);

$bottleneck("myFunc").exec(2, 2);
```

Sources:

- js/openaf.js:12336

<a id="api-bottleneck-maxexec-3e0e78fe"></a>

## $bottleneck.maxExec

### $bottleneck.maxExec(aMaxNumber) : Object

Creates a bottleneck to a maximum concurrent execution number of aMaxNumber.

Sources:

- js/openaf.js:12319

<a id="api-bottleneck-maxwait-0c262f4a"></a>

## $bottleneck.maxWait

### $bottleneck.maxWait(aMs) : Object

Creates a bottleneck holding the function execution for a max period of aMs.

Sources:

- js/openaf.js:12312

