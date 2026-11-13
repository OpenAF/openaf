# ow.dev

[Home](../../index.md) / [All APIs](../../all-apis.md) / [ow](../index.md) / [ow.dev](index.md)

## Subcategories

- [ow.dev.JSDebug](jsdebug/index.md)

<a id="api-ow-dev-jsdebug-0938b21e"></a>

## ow.dev.JSDebug

### ow.dev.JSDebug(shouldTrack)

Creates a JSDebug helper object for instrumenting JavaScript functions at runtime. If shouldTrack is true all wraps are recorded in a "&#95;&#95;debug" channel so they can later be undone in bulk via ow.dev.JSDebug.unSetAll().

Sources:

- js/owrap.dev.js:288

<a id="api-ow-dev-doh-1682706e"></a>

## ow.dev.doh

### ow.dev.doh(aString, aType, aProvider) : String

Resolves aString via DNS-over-HTTPS. aString can be a hostname, a URL string or a java.net.URL object. aType is the DNS record type: "a" (default), "aaaa", "cname" or a numeric type code. aProvider selects the upstream resolver: "cloudfare" (default) or "google"; alternatively a custom function(addr, type, numericType) can be supplied. Results are cached using the TTL returned by the provider. Returns the resolved address string or the original value on failure.

Sources:

- js/owrap.dev.js:174

<a id="api-ow-dev-loadchfn-4cd0c867"></a>

## ow.dev.loadChFn

### ow.dev.loadChFn()

Registers a custom OpenAF channel type called "fn" that delegates all channel operations (get, set, unset, getKeys, forEach, getAll, etc.) to user-supplied functions provided via the options map at channel creation time. Useful for wrapping arbitrary data sources as channels.

Sources:

- js/owrap.dev.js:10

<a id="api-ow-dev-loadignite-111ca612"></a>

## ow.dev.loadIgnite

### ow.dev.loadIgnite(aGridName, aIgnite, secretKey, isClient, aOptions)

Initialises an Apache Ignite grid named `aGridName` and extends oPromise with two extra methods:

- `thenAny(aFunc, aRejFunc, aGridName)`: executes `aFunc` on any single node in the grid
- `thenAll(aFunc, aRejFunc, aGridName)`: broadcasts `aFunc` to all nodes in the grid

Optionally an already-created Ignite instance can be supplied via `aIgnite`. `secretKey` and `isClient`
are forwarded to Ignite.start() when creating a new grid instance. Ignite 3 rejects the legacy `secretKey`;
use `aOptions` username/password for authenticated clients. `aOptions` is passed to Ignite.configure().
Each compute node must run OpenAF with plugin-Ignite 3.1. Functions cannot capture local variables.
Results must be JSON-serializable (or undefined). Repeated calls retain previously loaded grids.

Sources:

- js/owrap.dev.js:129

<a id="api-ow-dev-loadpooldb-c53b09d5"></a>

## ow.dev.loadPoolDB

### ow.dev.loadPoolDB()

Registers a custom OpenAF channel type called "pooldb" backed by a pooled database connection (defaults to an H2 in-memory database). The channel options must include a tableName property and may optionally supply a dbPool (an ow.obj.pool.DB instance).

Sources:

- js/owrap.dev.js:82

