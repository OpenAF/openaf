# ow.ch.types

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.ch](../index.md) / [ow.ch.types](index.md)

<a id="api-ow-ch-types-all-6a52c15f"></a>

## ow.ch.types.all

### ow.ch.types.all

This channel type aggregates access to several channels. The creation options are:

- `chs` (Array) An array of names of channels to aggregate.
- `fn` (Function) A function that will receive an operation, a key and value (when applicable)) to return which channel name should be used (if no return or void all channels will be considered).
- `errFn` (Function) A function to call with: the name of this channel, the exception, the target channel, the operation and the arguments whenever a error occurs accessing a channel.
- `fnTrans` (Function) A function to translate the key (for example, to remove elements used only on fn).
- `fnKeys` (Function) Allows to filter an array of resulting keys, from different channels, for: getKeys, getSortedKeys
- `fnValues` (Function) Allows to filter an array of resulting values, from different channels, for: getAll, get, getSet, set and unset
- `treatAll` (Boolean) If true size, setAll and unsetAll will be executed individually and fn called for each (default is false and size will take the first result)

Sources:

- js/owrap.ch.js:4370

<a id="api-ow-ch-types-big-605e2aef"></a>

## ow.ch.types.big

### ow.ch.types.big

This OpenAF channel implementation stores key/values in a compressed in-memory structure (`ow.obj.big`) optimized
for large datasets. It accepts no creation options beyond the inherited shouldCompress parameter.

Example:

```javascript
ow.ch.create("myBig", true, "big");
```

Note: the underlying `ow.obj.big` storage uses a sorted index so getSortedKeys reflects insertion/modification order.

Sources:

- js/owrap.ch.js:26

<a id="api-ow-ch-types-buffer-3dc098d0"></a>

## ow.ch.types.buffer

### ow.ch.types.buffer

This OpenAF implementation establishes a buffer to another channel. The creation options are:

- `bufferCh` (String) The channel that will receive data from the buffer channel.
- `bufferIdxs` (Array) An array of keys to use for faster performance (defaults to []).
- `bufferByTime` (Number) How much time before flushing contents from the buffer channel (default 2500ms).
- `bufferByNumber` (Number) How many entries before flushing contents from the buffer channel (default 100).
- `bufferTmpCh` (String) The auxiliary temporary buffer storage channel to use (default creates [name]::`__bufferStorage`).
- `bufferFunc` (Function) Optional function that if returns true will trigger the buffer flush to bufferCh.

Sources:

- js/owrap.ch.js:809

<a id="api-ow-ch-types-cache-502d6acc"></a>

## ow.ch.types.cache

### ow.ch.types.cache

This OpenAF channel implementation provides a caching layer around a function or another channel. The creation options are:

- `func` (Function) Function called with the key map when a cache miss occurs; its return value is stored and returned.
- `ttl` (Number) Time-to-live in ms before cached entries expire (defaults to 5000ms).
- `size` (Number) Maximum number of entries to keep in cache; -1 means unlimited (defaults to -1).
- `method` (String) Eviction method: "t" (time-based TTL, default) or "p" (count-based, evicts oldest when size is exceeded).
- `default` (Object) Optional default value to store and return on a cache miss if func is not defined.
- `useDefault` (Boolean) If true the default value is returned instead of calling func on a miss.
- `ch` (String/Channel) Optional backing storage channel (defaults to an auto-created [name]::`__cache` simple channel).

Example:

```javascript
ow.ch.create("myCache", false, "cache", { func: k => $rest().get("http://api/data/" + k.id), ttl: 60000 });
```

Sources:

- js/owrap.ch.js:576

<a id="api-ow-ch-types-db-6b2334ee"></a>

## ow.ch.types.db

### ow.ch.types.db

This OpenAF channel implementation wraps access to a db table. The creation options are:

- `db` (Database) The database object to access the database table (or a JSON/SLON string with 'url', 'user', 'pass', 'timeout', 'driver').
- `from` (String) The name of the database table or object (don't use double quotes).
- `keys` (Array) An array of fields keys to use (don't use double quotes).
- `cs` (Boolean) Determines if the database is case sensitive for table and field names (defaults to false).

Sources:

- js/owrap.ch.js:165

<a id="api-ow-ch-types-dummy-50c587a9"></a>

## ow.ch.types.dummy

### ow.ch.types.dummy

This OpenAF channel implementation is a no-op sink: all write operations (set, setAll, unset, unsetAll) are silently
discarded, all read operations (get, getAll, getKeys, size, forEach) return empty results. Useful for disabling a
channel without changing calling code. Accepts no creation options.

Example:

```javascript
ow.ch.create("blackhole", false, "dummy");
```

Sources:

- js/owrap.ch.js:1011

<a id="api-ow-ch-types-elasticsearch-d4dd713b"></a>

## ow.ch.types.elasticsearch

### ow.ch.types.elasticsearch

This OpenAF implementation connects to an ElasticSearch (ES) server/cluster. The creation options are:

- `index` (String/Function) The ES index to use or a function to return the name (see also `ow.ch.utils.getElasticIndex`).
- `format` (String) If index is a string will use format with `ow.ch.utils.getElasticIndex`.
- `idKey` (String) The ES key id field. Defaults to 'id'.
- `url` (String) The HTTP(S) URL to access the ES server/cluster.
- `user` (String) Optionally provide a user name to access the ES server/cluster.
- `pass` (String) Optionally provide a password to access the ES server/cluster (encrypted or not).
- `fnId` (String/Function) Optionally called on every operation to calculate the idKey with the key provided as argument. If string will the corresponding hash function (md5/sha1/etc...) with sortMapKeys + stringify.
- `size` (Number) Optionally getAll/getKeys to return more than 10 records (up to 10000).
- `stamp` (Map) Optionally merge with stamp map.
- `timeout` (Number) Optional request timeout in ms.
- `preAction` (Function) Optional function to be called before every request.

The getAll/getKeys functions accept an extra argument to provide a ES query map to restrict the results.

Sources:

- js/owrap.ch.js:3325

<a id="api-ow-ch-types-etcd-c9ad14c9"></a>

## ow.ch.types.etcd

### ow.ch.types.etcd

This OpenAF channel implementation connects to an etcd v2 key/value store. The creation options are:

- `url` (String) The HTTP(S) URL of the etcd daemon (e.g. http://etcd-host:2379). Mandatory.
- `folder` (String) Optional key prefix/folder path to scope all channel operations (defaults to root).
- `throwExceptions` (Boolean) If true (default) HTTP errors from etcd will be thrown as exceptions.
- `default` (Object) Optional default value to return when a request fails instead of throwing.
- `preAction` (Function) Optional function called before every HTTP request (receives the `$rest` options map).

Note: this implementation targets the etcd v2 HTTP API (/v2/keys). For etcd v3 consider an alternative approach.

Example:

```javascript
ow.ch.create("myEtcd", false, "etcd", { url: "http://etcd:2379", folder: "/myapp" });
```

Sources:

- js/owrap.ch.js:4228

<a id="api-ow-ch-types-file-3542613f"></a>

## ow.ch.types.file

### ow.ch.types.file

This OpenAF implementation implements a simple channel on a single JSON, YAML or TOON file. The creation options are:

- `file` (String) The filepath to the JSON or YAML file to use (if multifile is false)
- `path` (String) The path to use to store JSON, YAML or TOON objects to use (if multifile is true)
- `yaml` (Boolean) Use YAML instead of JSON (defaults to false)
- `toon` (Boolean) Use TOON instead of JSON (defaults to false)
- `compact` (Boolean) If JSON and compact = true the JSON format will be compacted (defaults to false or shouldCompress option)
- `multifile` (Boolean) If true instead of keeping values in one file it will be kept in multiple files (*)
- `multipart` (Boolean) If YAML and multipart = true the YAML file will be multipart
- `key` (String) If a key contains "key" it will be replaced by the "key" value
- `multipath` (Boolean) Supports string keys with paths (e.g. `ow.obj.setPath`) (defaults to false)
- `lock` (String) If defined the filepath to a dummy file for filesystem lock while accessing the file
- `gzip` (Boolean) If true the output file will be gzip (defaults to false)
- `lz4` (Boolean) If true the output file will be lz4 (defaults to false)
- `tmp` (Boolean) If true "file" will be temporary and destroyed upon execution/process end

(*) - Be aware that although there is a very small probability of collision between the unique id (sha-512) for filenames it still exists

Sources:

- js/owrap.ch.js:1402

<a id="api-ow-ch-types-graph-8b7a2417"></a>

## ow.ch.types.graph

### ow.ch.types.graph

Channel over a knowledge graph stored in a single JSON file, using the Mini-A wiki graph format:
`{ version, nodes: { id: { id, type, props } }, edges: [ { from, to, type, provenance, props } ], ... }`.

Creation options:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `file` | String | _required_ | Path to the graph JSON file |
| `readOnly` | Boolean | `false` | Reject changes and never write the file |
| `create` | Boolean | `true` | If `false` the file must already exist; otherwise an empty graph is started |
| `autosave` | String | `"always"` | `"always"`, `"debounced"` or `"off"`; pending changes are always flushed on destroy |
| `saveDebounceMs` | Number | `5000` | Minimum ms between saves when `autosave` is `"debounced"` |
| `lock` | String | | Path to a dummy file used as a filesystem lock while loading/saving |
| `store` | Map | | `{ type, options, compress, bulk }`: keep nodes, edges and other sections in channels of that type (e.g. `mvs`) instead of memory; can't be combined with `file` |

Keys and values:

- **Node**: key `{ id }` (e.g. `{ id: "doc:readme.md" }`), value `{ id, type, props }`.
- **Edge**: key `{ from, to, type, provenance, page, section }`, value `{ from, to, type, provenance, props }`.
  `provenance` is `EXTRACTED`, `INFERRED` or `AMBIGUOUS` (default); `page` and `section` map to `props.page` and `props.section`.
- Setting an edge requires both nodes to exist; unsetting a node also removes its edges.
- File sections not handled by the channel (e.g. `communities`, `summaries`) are preserved on save.

Example:

```javascript
$ch("g").create(true, "graph", { file: "graph.json" });
$ch("g").set({ id: "doc:a.md" }, { type: "document", props: { title: "A" } });
$ch("g").set({ id: "doc:b.md" }, { type: "document", props: { title: "B" } });
$ch("g").set({ from: "doc:a.md", to: "doc:b.md", type: "LINKS_TO" }, {});
ow.ch.utils.graph.path("g", "a.md", "b.md"); // [ "doc:a.md", "doc:b.md" ]
```

Use `ow.ch.utils.graph` to navigate the graph. The whole file is rewritten on save, so avoid several writers over the same file.

Sources:

- js/owrap.ch.js:1904

<a id="api-ow-ch-types-ignite-f72b40ed"></a>

## ow.ch.types.ignite

### ow.ch.types.ignite

This channel type uses plugin-Ignite 3.1 tables with JSON keys and values. The creation options are:

- `ignite` (Ignite) Use a previously instantiated Ignite plugin (defaults to a new instance).
- `gridName` (String) Use a specific Ignite node/client name.
- `client` (Boolean) Connect a thin client instead of starting an embedded node.
- `configuration` (Map) Ignite.configure options, including addresses or configFile/workDir.
- `persist` (String) Persistent Ignite 3 work directory (alias for configuration.workDir).
- `cacheName` (String) Shared backing table name (defaults to the channel name).
- `keepOnDestroy` (Boolean) Keep the backing table when destroying the channel (default false).

Sources:

- js/owrap.ch.js:4136

<a id="api-ow-ch-types-mvs-1226626f"></a>

## ow.ch.types.mvs

### ow.ch.types.mvs

The channel type mvs uses H2 MVStore to keep key/value structures either in memory or in files.
The creation options are:

- `file` (String) If not defined it will default to the in-memory implementation otherwise a file.
- `shouldCompress` (Boolean) Specifies if it should compress the entire structure or not.
- `compact` (Boolean) Upon channel create/destroy it will try to run a compact operation over the file to save space.
- `map` (String/Function) The map name (defaults to 'default'). If defined as a function it will receive the key as argument if possible (only for get/set/unset/setall)
for sharding purposes.

- `multifile` (Boolean) If true keys will be spread (by key hash) across several MVStore files on "path" (defaults to false) (*)
- `path` (String) The folder where to keep the MVStore files (required if multifile is true)
- `files` (Number) The number of MVStore files to use if multifile is true (defaults to 4 or to the number already in use on "path")

The map will be created if it doesn't exist. Operations getKeys/getAll can be paginated with the extra map argument containing start and end

(*) - With multifile the files are named mvs-NN.db and a mvs-multifile.json manifest records the number of files (to change it use `ow.ch.utils.mvs.reshard`).
All other options apply to each file. getKeys/getAll (including start/end pagination) and pop/shift go through the files in order (no global key ordering).
Each file can be handled individually with `ow.ch.utils.mvs`.

Sources:

- js/owrap.ch.js:3867

<a id="api-ow-ch-types-ops-59f9eda7"></a>

## ow.ch.types.ops

### ow.ch.types.ops

This OpenAF channel implementation encapsulates access based on functions. The creation options are a map of
keys where each value is a function.

Example:

```javascript
ow.ch.create("logic", false, "ops", { hello: name => "hi " + name });
```

Sources:

- js/owrap.ch.js:501

<a id="api-ow-ch-types-prometheus-ce8ba9d6"></a>

## ow.ch.types.prometheus

### ow.ch.types.prometheus

This OpenAF implementation connects to a prometheus server. The creation options are:

- `urlQuery` (String) The URL of a prometheus server (e.g. http://prometheus:9090)
- `urlPushGW` (String) The URL of a prometheus push gateway server (e.g. http://prometheus:9091).
- `prefix` (String) If defined the prefix for all openmetrics.
- `gwGroup` (Map) A map of grouping labels for data ingestion by the push gw (job label must be defined).
- `helpMap` (Map) The helpMap for the openmetrics (see more in `ow.metrics.fromObj2OpenMetrics`).

The forEach/getSet/pop/shift/unsetAll functions are not supported.
The size function retrieves the total number of labels.
The get/getAll function enables instant query (with the extra map key query), query range query (with the extra map keys query, start and end) and label values query (with the extra map key label).
The set/setAll functions only consider the value(s) argument, the key(s) is ignored.

Note: query by specific series are not currently supported.

Sources:

- js/owrap.ch.js:3711

<a id="api-ow-ch-types-proxy-178926af"></a>

## ow.ch.types.proxy

### ow.ch.types.proxy

This OpenAF implementation establishes a proxy to another channel. The creation options are:

- `chTarget` (String) The channel that will receive all operations (if proxyFunc doesn't return).
- `proxyFunc` (Function) Function that receives a map (by reference that can be changed) with: op (operation),
name (target channel), function (where applicable), full (where applicable), match (the match of getSet), k (the key(s)),
v (the value(s)) and timestamp. If this function returns something no operation will be executed on the chTarget and the
value returned by the function will be the value returned by this channel.
For `getSet`, the callback also receives an outcome map and can set `outcome.changed` to `false` for a no-op or `true` for a mutation.
When omitted, overridden calls retain their legacy subscriber notifications.

Sources:

- js/owrap.ch.js:1080

<a id="api-ow-ch-types-remote-179b6a4c"></a>

## ow.ch.types.remote

### ow.ch.types.remote

This OpenAF channel implementation connects to a remote channel exposed via `ow.ch.server.expose` or `ow.ch.server.peer`. The creation options are:

- `url` (String) The HTTP(S) URL of the remote exposed channel (e.g. http://server:8090/channel).
- `login` (String) Optional username for HTTP basic authentication.
- `password` (String) Optional password for HTTP basic authentication (encrypted or not).
- `timeout` (Number) Optional connection and request timeout in ms.
- `default` (Object) Optional default value to return when the request fails instead of throwing.
- `stopWhen` (Function) Optional function that, if it returns true, stops the underlying HTTP request retry.
- `throwExceptions` (Boolean) If true (default) exceptions from the remote server will be thrown locally.
- `preAction` (Function) Optional function called before every HTTP request (receives the `$rest` options map).

Example:

```javascript
ow.ch.create("myRemote", false, "remote", { url: "http://server:8090/myChannel" });
$ch("myRemote").set({ id: 1 }, { id: 1, name: "test" });
```

Note: the remote channel relies on `ow.ch.server.expose`/peer on the server side and uses the OpenAF REST channel
protocol over HTTP(S). For two-way synchronization between nodes consider using `ow.ch.server.peer` instead.

Sources:

- js/owrap.ch.js:3129

<a id="api-ow-ch-types-simple-5cc09496"></a>

## ow.ch.types.simple

### ow.ch.types.simple

This OpenAF channel implementation is the default in-memory key/value store (used when no type is specified in `ow.ch.create`).
It stores entries in a JavaScript Map keyed by a deterministic JSON serialization of the key map, preserving
modification-time order for getSortedKeys. Accepts no creation options.

Example:

```javascript
ow.ch.create("myChannel");                    // uses "simple" by default
ow.ch.create("myChannel", false, "simple");   // explicit
```

Sources:

- js/owrap.ch.js:1300

<a id="api-ow-ch-types-simpleold-d5f5d1f7"></a>

## ow.ch.types.simpleold

### ow.ch.types.simpleold

This OpenAF channel implementation is the legacy in-memory key/value store backed by a plain JavaScript object. It is kept for backward compatibility; prefer the "simple" type for new channels. Accepts no creation options.



Sources:

- js/owrap.ch.js:1191

<a id="api-ow-ch-types-timeseries-98d66d93"></a>

## ow.ch.types.timeseries

### ow.ch.types.timeseries

Channel over labelled numeric time series (metric + labels + timestamp), kept in memory with an optional append-only NDJSON file,
or delegated to other channels (e.g. `mvs`) with `store`. Supports retention (age and/or count) and stored rollups (RRD-like).

Creation options:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `file` | String | | Path to an NDJSON log file. Without `file` (and `store`) the channel only lives in memory |
| `readOnly` | Boolean | `false` | Reject changes and never write the file |
| `create` | Boolean | `true` | If `false` the file (or store) must already exist |
| `autosave` | String | `"always"` | `"always"` appends on every change, `"debounced"` appends at most every `saveDebounceMs`, `"off"` only on `save`/destroy |
| `saveDebounceMs` | Number | `5000` | Minimum ms between appends when `autosave` is `"debounced"` |
| `lock` | String | | Path to a dummy file used as a filesystem lock while loading and writing |
| `compactRatio` | Number | `0.5` | The file is rewritten (compacted) when more than this ratio of its lines is dead (overwritten, deleted or expired) |
| `store` | Map | | `{ type, options, compress, bulk }`: keep the data in chunks stored on channels of that type (e.g. `mvs`); can't be combined with `file` |
| `chunk` | String/Number | `"1h"` | Time span of each stored chunk (only used with `store`) |
| `retention` | String/Number | | How long to keep raw points (e.g. `"7d"`), relative to the newest point of each series (see `retentionRef`). Same as `raw.keep` |
| `maxPoints` | Number | | Maximum raw points per series. Same as `raw.maxPoints` |
| `raw` | Map | | `{ keep, maxPoints }` for the raw points |
| `rollups` | Array | | `[ { step: "1m", keep: "1d" }, { step: "1h", keep: "30d" } ]`: aggregated buckets kept per series (`count`, `sum`, `min`, `max`, `first`, `last`) |
| `retentionRef` | String | `"series"` | `"series"` measures `keep` back from the newest point of the series, `"now"` from the current time |
| `housekeepEveryMs` | Number | `0` | Minimum ms between retention runs triggered by writes (`0` = on every write) |

Keys and values:

- **Key**: `{ metric, labels, ts }`. `labels` is a map (values are stored as strings); `ts` is epoch ms, a Date or an ISO string (defaults to now on `set`).
- **Value**: `{ v }` where `v` is a number.
- `get` without `ts` returns the latest point; the value returned is always `{ metric, labels, ts, v }`.
- `unset` with `ts` removes a point; without `ts` it drops the whole series (points and rollups).
- `getKeys`/`getAll` accept a selector map `{ metric, labels, from, to }`; `pop`/`shift` return the key of the newest/oldest point.

Example:

```javascript
$ch("m").create(true, "timeseries", { file: "cpu.ndjson", retention: "7d" });
$ch("m").set({ metric: "cpu", labels: { host: "a" }, ts: 1000 }, { v: 0.4 });
$ch("m").set({ metric: "cpu", labels: { host: "a" }, ts: 2000 }, { v: 0.6 });
ow.ch.utils.timeseries.range("m", { metric: "cpu" }, { step: "1s", fn: "avg" });
```

Retention deletes made by the channel itself do not notify channel subscribers. Use `ow.ch.utils.timeseries` to query.

Sources:

- js/owrap.ch.js:2353

