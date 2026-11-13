# ow.metrics

[Home](../../index.md) / [All APIs](../../all-apis.md) / [ow](../index.md) / [ow.metrics](index.md)

<a id="api-ow-metrics-add-c4a7da84"></a>

## ow.metrics.add

### ow.metrics.add(aName, aFunction)

Adds aName metric whose values are a map returned by aFunction.

Sources:

- js/owrap.metrics.js:253

<a id="api-ow-metrics-collectmetrics-508989b7"></a>

## ow.metrics.collectMetrics

### ow.metrics.collectMetrics(aName, aFunction) : Object

Executes aFunction while collecting functions metrics under the name aName. Returns whatever the function returns or throws any exception.

Sources:

- js/owrap.metrics.js:407

<a id="api-ow-metrics-collectmetrics4fn-7fdc8791"></a>

## ow.metrics.collectMetrics4Fn

### ow.metrics.collectMetrics4Fn(aName, aFn)

Adds extra code to an existing aFn to collect functions metrics under the name aName. If the same aName and aFn has been already executed before it will throw an exception "Already collecting for the provided function."

Sources:

- js/owrap.metrics.js:369

<a id="api-ow-metrics-exists-90368a1b"></a>

## ow.metrics.exists

### ow.metrics.exists(aName) : Boolean

Determines if metric aName is currenly assigned.

Sources:

- js/owrap.metrics.js:265

<a id="api-ow-metrics-fromobj2openmetrics-ed098280"></a>

## ow.metrics.fromObj2OpenMetrics

### ow.metrics.fromObj2OpenMetrics(aObj, aPrefix, aTimestamp, aHelpMap, aConvMap, aStrict) : String

Given aObj will return a string of open metric (prometheus) metric strings. Optionally you can provide a prefix (defaults to "metric")  and/or aTimestamp (a number in seconds or a label field, that will be used for all aObj values) and aConvMap composed of a key with a map of possible values and corresponding translation to numbers. Note: prefixes should not start with a digit. Set aStrict to true for OpenMetrics 1.0 text with grouped metadata and a final EOF marker. Strict mode supports unknown (default), gauge and counter scalar families, rejects name/series collisions and unsupported types, uses a prefix&#95;id array label, and requires timestamps in epoch seconds (or a date label field).

Sources:

- js/owrap.metrics.js:521

<a id="api-ow-metrics-fromopenmetrics2array-0bf52fbb"></a>

## ow.metrics.fromOpenMetrics2Array

### ow.metrics.fromOpenMetrics2Array(aLines) : Array

Given an array or string newline delimited string following the OpenMetrics format  will try to return an array with each metric, value, labels, timestamp and perceived prefix.

Sources:

- js/owrap.metrics.js:440

<a id="api-ow-metrics-getall-b4dad3f0"></a>

## ow.metrics.getAll

### ow.metrics.getAll() : Map

Returns a map with all registered metrics.

Sources:

- js/owrap.metrics.js:297

<a id="api-ow-metrics-getsome-f255c66b"></a>

## ow.metrics.getSome

### ow.metrics.getSome(anArrayOfNames) : Map

Returns just the metrics in the provided anArrayOfNames.

Sources:

- js/owrap.metrics.js:275

<a id="api-ow-metrics-startcollecting-df7b4b3c"></a>

## ow.metrics.startCollecting

### ow.metrics.startCollecting(aChName, aPeriod, some, noDate)

Starts collecting metrics on aChName (defaults to '&#95;&#95;metrics') every aPeriod ms (defaults to 1000ms) optionally just some (array) metrics.

Sources:

- js/owrap.metrics.js:307

<a id="api-ow-metrics-stopcollecting-3cb726b4"></a>

## ow.metrics.stopCollecting

### ow.metrics.stopCollecting(aChName)

Stops collecting metrics on aChName (defaults to '&#95;&#95;metrics')

Sources:

- js/owrap.metrics.js:347

