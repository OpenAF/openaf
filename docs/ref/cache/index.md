# $cache

[Home](../index.md) / [All APIs](../all-apis.md) / [$cache](index.md)

<a id="api-cache-bydefault-43e343a9"></a>

## $cache.byDefault

### $cache.byDefault(useDefault, aDefault) : Object

Changes the behaviour of the cache to either use the default value (aDefault) if useDefault is true (launching the cache function in background) or try to use the previous value in the cache if useDefault  is false (if a previous value is not available the cache function will be called and the .get will wait for it).

Sources:

- js/openaf.js:12197

<a id="api-cache-bypopularity-0e069639"></a>

## $cache.byPopularity

### $cache.byPopularity() : Object

Changes the behaviour of the cache to use the most popular entries and prefer to discard the least popular ones  when the cache is full (maxSize is defined).

Sources:

- js/openaf.js:12186

<a id="api-cache-ch-10dae75b"></a>

## $cache.ch

### $cache.ch(aChannelName) : Object

Uses a pre-existing channel (e.g. aChannelName) as the cache channel.

Sources:

- js/openaf.js:12157

<a id="api-cache-fn-ebd23afc"></a>

## $cache.fn

### $cache.fn(aFunction) : Object

Defines the aFunction use to get aKey. The returned object will be cached.

Sources:

- js/openaf.js:12143

<a id="api-cache-get-9bf85ff6"></a>

## $cache.get

### $cache.get(aKey) : Object

Shortcut to use a cache channel. Returns an object that can be used like this:

```javascript
$cache("numbers")
.ttl(30000)
.fn((aKey) => { ... return result; })
.create()

$cache("numbers").get(myKey);

$cache("numbers").destroy();
```

Sources:

- js/openaf.js:12229

<a id="api-cache-infile-d0aeff45"></a>

## $cache.inFile

### $cache.inFile(aFile) : Object

Creates a mvs channel to hold the cache data in aFile. Note: don't use $cache.ch if you use this option.

Sources:

- js/openaf.js:12171

<a id="api-cache-maxsize-26dd2668"></a>

## $cache.maxSize

### $cache.maxSize(aSize) : Object

Establishes the max number of entries cached at any given point in time.

Sources:

- js/openaf.js:12164

<a id="api-cache-ttl-c30f4193"></a>

## $cache.ttl

### $cache.ttl(aTTL) : Object

Defines the time-to-live (aTTL) to consider a cached result as valid.

Sources:

- js/openaf.js:12150

