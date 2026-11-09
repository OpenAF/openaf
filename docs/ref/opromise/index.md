# oPromise

[Home](../index.md) / [All APIs](../all-apis.md) / [oPromise](index.md)

<a id="api-opromise-all-602b12fc"></a>

## oPromise.all

### oPromise.all(anArray) : oPromise

Returns an oPromise that will be resolved when all oPromise part of the anArray are fullfiled. If any of the oPromises fails/rejects the returned oPromise will also be rejected/fail.

Sources:

- js/openaf.js:16106

<a id="api-opromise-catch-6bbde967"></a>

## oPromise.catch

### oPromise.catch(onReject) : oPromise

Adds onRejected to the current oPromise stack to execute if the previous function was rejected and receives the reason as parameter.

Sources:

- js/openaf.js:16090

<a id="api-opromise-race-e467f817"></a>

## oPromise.race

### oPromise.race(anArray) : oPromise

Returns an oPromise that will be resolved when any oPromise part of the anArray is fullfiled. If any of the oPromises fails/rejects the returned oPromise will also be rejected/fail.

Sources:

- js/openaf.js:16167

<a id="api-opromise-then-884156c1"></a>

## oPromise.then

### oPromise.then(onFulfilled, onRejected) : oPromise

Adds onFulfilled to the current oPromise stack to execute if the previous function was resolved successfully and receives the resolve/return value as parameter. Also adds onRejected to the current oPromise stack to execute if the previous function was rejected and receives the reason as parameter.

Sources:

- js/openaf.js:16072

