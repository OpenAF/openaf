# ow.ch.utils

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.ch](../index.md) / [ow.ch.utils](index.md)

## Subcategories

- [ow.ch.utils.mvs](mvs/index.md)

<a id="api-ow-ch-utils-closebuffer-ab593228"></a>

## ow.ch.utils.closeBuffer

### ow.ch.utils.closeBuffer(aName)

Tries to close and flush a channel buffer with aName (if not provided assumes all buffer type channels).

Sources:

- js/owrap.ch.js:5521

<a id="api-ow-ch-utils-flushbuffer-3006d206"></a>

## ow.ch.utils.flushBuffer

### ow.ch.utils.flushBuffer(aName)

Tries to flush a channel buffer with aName (if not provided assumes all buffer type channels).

Sources:

- js/owrap.ch.js:5502

<a id="api-ow-ch-utils-getbuffersubscriber-0e541c62"></a>

## ow.ch.utils.getBufferSubscriber

### ow.ch.utils.getBufferSubscriber(aSourceCh, indexes, byNumber, byTimeInMs, aBufferCh, aTmpBufferCh, aFilterFunc, aBufferFunc) : Function

Returns a channel subscriber function that will buffer set, setall, unsetall and unset operations from `aSourceCh` channel to `aBufferCh` (by
default a dummy channel to be subscribed, if not defined the name will be `aSourceCh` + "::buffer"). As a temporary buffer channel
`aTmpBufferCh` will be used (if not defined the name will be `aSourceCh` + "::`__bufferStorage`"). The `aBufferCh` will be configured with
the provided `indexes`, `byNumber` (number of times to trigger the buffer) and `byTimeInMs` (amount of time in ms to trigger the buffer).
Additionally you can specify `aFilterFunc` (with arguments channel, operation, key(s) and value(s)) that will only buffer if returns false
and `aBufferFunc` that will trigger the buffer flush if it returns true.

NOTE: do call `ow.ch.utils.closeBuffer(aSourceCh)` when it's no longer needed.

Sources:

- js/owrap.ch.js:5545

<a id="api-ow-ch-utils-getelasticindex-dfe9b34a"></a>

## ow.ch.utils.getElasticIndex

### ow.ch.utils.getElasticIndex(aPrefix, aFormat) : Function

Returns a function to be used for generating ElasticSearch indexes with aPrefix-aDate (in the format of YYYY.MM.DD). This helps to generate a specific index per day. If a specific format is needed you can provided it as aFormat (see ow.format.fromDate)).

Sources:

- js/owrap.ch.js:5993

<a id="api-ow-ch-utils-getelasticquery-914cf601"></a>

## ow.ch.utils.getElasticQuery

### ow.ch.utils.getElasticQuery(aQueryString) : Map

Returns a query map using aQueryString (using lucene query string (like in Kibana)) to be used on getAll, for example.

Sources:

- js/owrap.ch.js:6008

<a id="api-ow-ch-utils-getfilehousekeepsubscriber-bb0e6c44"></a>

## ow.ch.utils.getFileHousekeepSubscriber

### ow.ch.utils.getFileHousekeepSubscriber(aFolder, aRegExPattern, howLongAgoInMinutes, dontCompress, aBackupFolder) : Function

Returns a channel subscriber function to perform file housekeep (specially useful with ow.ch.utils.getLogFilePerDate) given the main aFolder where just the newest file whose filename matches aRegExPattern (e.g. "log&#92;&#92;d&#123;4&#125;-&#92;&#92;d&#123;2&#125;-&#92;&#92;d&#123;2&#125;&#92;&#92;.log") will be kept uncompressed. All other files will be gziped (if dontCompress = false) and moved to aBackupFolder (if defined, defaults to aFolder). If howLongAgoInMinutes is defined all  files older than now - howLongAgoInMinutes will be deleted from the aBackupFolder.

Sources:

- js/owrap.ch.js:5867

<a id="api-ow-ch-utils-gethousekeepsubscriber-3ae8fda1"></a>

## ow.ch.utils.getHousekeepSubscriber

### ow.ch.utils.getHousekeepSubscriber(aTargetCh, maxNumberOfKeys) : Function

Returns a channel subscriber function that will keep the channel size to the maximum of maxNumberOfKeys (defaults to 100). If the number of keys is bigger than maxNumberOfKeys than it will perform a channel unset operation (that will, depending on the type of channel, remove the oldest element).

Sources:

- js/owrap.ch.js:5832

<a id="api-ow-ch-utils-getk8sremoteurlarrayfunc-0ced0fb2"></a>

## ow.ch.utils.getK8sRemoteURLArrayFunc

### ow.ch.utils.getK8sRemoteURLArrayFunc(aOptions) : Function

Returns a function to be used as `aRemoteURLArray` in `ow.ch.server.peer`. It will resolve
all IP addresses from a Kubernetes DNS name (typically a headless service for deployments)
using `ow.net.getDNS` and return an array of remote channel URLs.

`aOptions` map entries:

- `dnsName` (String, mandatory) Kubernetes DNS name to resolve
- `recordType` (String, optional) DNS record type (defaults to "a")
- `dnsServer` (String, optional) DNS server to use
- `protocol` (String, optional) URL protocol (defaults to "http")
- `port` (Number, optional) Port to use (defaults to local peer port when numeric)
- `path` (String, optional) URL path (defaults to peer path argument)
- `excludeCurrentIP` (Boolean, optional) Excludes current instance IP from result (defaults to false)
- `currentIP` (String, optional) Explicit current instance IP (otherwise uses POD_IP env var or `ow.net.getHostAddress()`)
- `urlFn` (Function, optional) Custom URL builder fn(ip, ctx)

Example:

```javascript
var peersFn = ow.ch.utils.getK8sRemoteURLArrayFunc({
  dnsName: "openaf-peers.default.svc.cluster.local",
  protocol: "http",
  port: 8090,
  path: "/log"
});
ow.ch.server.peer("__log", 8090, "/log", peersFn);
```

Sources:

- js/owrap.ch.js:6026

<a id="api-ow-ch-utils-getlogfileperdate-81663a47"></a>

## ow.ch.utils.getLogFilePerDate

### ow.ch.utils.getLogFilePerDate(aLogFolder, aTemplate, aFileDateFormat, aLineTemplate, aLineDateFormat) : Function

Returns a function to be used to generate a log file in aLogFolder path. If the log file already exists it will append to it. You can customize the log filename format using a aTemplate (e.g. "log-&#123;&#123;timedate&#125;&#125;.log" by default). The "timedate" is defined on the aFileDateFormat (e.g. "yyyy-MM-dd" by day, "yyyy-MM-dd-HH" by hour (check ow.format.fromDate for more options)). Each line that will be append to the file can be defined by aLineTemplate (e.g. "&#123;&#123;timedate&#125;&#125; &#124; &#123;&#123;type&#125;&#125; &#124; &#123;&#123;message&#125;&#125;"  by default) where "type" is the of logging (INFO, WARN, ERROR), "message" the logged message and "timedate" is defined on the aLineDateFormat (e.g. "yyyy-MM-dd HH:mm:ss.SSS" by default (check ow.format.fromDate for more options)).

Sources:

- js/owrap.ch.js:5924

<a id="api-ow-ch-utils-getlogstashsubscriber-34a654c0"></a>

## ow.ch.utils.getLogStashSubscriber

### ow.ch.utils.getLogStashSubscriber(aTargetCh, aType, aHost, aErrorFunc, shouldHK, stampMap) : Function

Returns a channel subscriber function that will transform changes to a log channel (see startLog and the &#95;&#95;log channel) and will replicate them in aTargetCh (this means expecting the value to have a 'd': date; 'm': message and 't' as the level/type). The value set on aTargetCh will follow the LogStash format setting type to aType and host to aHost. The id and key will be set  to a sha1 hash of the stringify version of the value being set. In case of error aErrorFunc will be invoked providing the exception as an argument. You can also indicate if you want to house keep the original channel to save the script's memory and a stampMap to force entries on all maps sent.

Sources:

- js/owrap.ch.js:5797

<a id="api-ow-ch-utils-getmirrorsubscriber-310a2199"></a>

## ow.ch.utils.getMirrorSubscriber

### ow.ch.utils.getMirrorSubscriber(aTargetCh, aFunc) : Function

Returns a channel subscriber function that will mirror any changes to aTargetCh if aFunc(key, op) returns true when invoked with the key being changed and the corresponding operation.

Sources:

- js/owrap.ch.js:5760

<a id="api-ow-ch-utils-getstatsproxyfunction-163b1155"></a>

## ow.ch.utils.getStatsProxyFunction

### ow.ch.utils.getStatsProxyFunction(aStatsCh) : Function

Returns a proxy function to be use with a proxy channel. The aStatsCh where to store the channel access statistics.

Sources:

- js/owrap.ch.js:5601

<a id="api-ow-ch-utils-graph-edd22f51"></a>

## ow.ch.utils.graph

### ow.ch.utils.graph

Helpers to navigate and query a channel of type `graph` (see `ow.ch.types.graph`). Node ids without a `:` are treated as `doc:` ids.

| Function | Returns | Description |
| --- | --- | --- |
| `neighbors(aName, anId, aOptions)` | Array | Edges connected to a node. Options: `direction` (`"out"`, `"in"` or `"both"`), `type`, `provenance` (String or Array), `evidenceLayer` (String or Array), `minConfidence` |
| `degree(aName, anId, aOptions)` | Number | Number of edges connected to a node (same options as `neighbors`) |
| `path(aName, aFromId, aToId, aOptions)` | Array | Shortest path (BFS) as node ids, `[]` if none. Options: `maxDepth` and all `neighbors` filters |
| `traverse(aName, anId, aOptions)` | Map | `{ nodes, edges }` sub-graph reachable from a node. Options: `depth` (default 1), `direction`, `type`, `provenance` |
| `find(aName, aOptions)` | Array | Nodes matching `type` and/or `text` (case insensitive match on id and props) |
| `stats(aName)` | Map | Node and edge counts plus counts by node type, edge type and provenance |
| `save(aName)` | Boolean | Flushes pending changes to the file (`false` if read-only) |

Example:

```javascript
ow.ch.utils.graph.neighbors("g", "a.md", { direction: "out", type: "LINKS_TO" });
ow.ch.utils.graph.traverse("g", "a.md", { depth: 2 }); // { nodes: [...], edges: [...] }
```

Sources:

- js/owrap.ch.js:6329

<a id="api-ow-ch-utils-keephistory-4a7512ca"></a>

## ow.ch.utils.keepHistory

### ow.ch.utils.keepHistory(timeRepeatExpression, aName, aFunction, withKeys, historySize) : Object

For a given aName channel (preferably a temporary one) will execute aFunction periodically given a timeRepeatExpression (if a Number the ms interval, if a String a cron expression). That aFunction should return aMap for which the withKeys array will be used to determine the keys entries to set it on the provided aName channel (if withKeys is not provided, id will be assumed and filled with nowNano()). The channel aName will be filled with entries with the result of executing aFunction periodically thus keeping an history of results (by default 10 if a historySize is not provided). An object with a stop function will be returned so the keepHistory periodical behaviour of runnning aFunction and keeping the results in the channel aName.

Sources:

- js/owrap.ch.js:5439

<a id="api-ow-ch-utils-poolchanges-3c5e337f"></a>

## ow.ch.utils.poolChanges

### ow.ch.utils.poolChanges(aCh, idKeys, aChM)

When executed pools to find all changes in aCh, using an idKeys array of key map fields, and executing a setAll on aCh for the changed entries. To compare it stores the last version in a 'aCh + "::chMemory"' channel that can be created with aChM map options ($ch type and options entries). Usefull to trigger channel subscribed functions when the aCh type doesn't detect automatically changes. Should be used with small sized channels as datasets are compared in memory.

Sources:

- js/owrap.ch.js:6123

<a id="api-ow-ch-utils-setlogtofile-71cc147d"></a>

## ow.ch.utils.setLogToFile

### ow.ch.utils.setLogToFile(aConfigMap)

Shortcut to set OpenAF's logging into a rotating per date set of log files. You can set any of these options:

- `logFolder` (string) Where the current log file should be written (defaults to '.')
- `filenameTemplate` (string) `ow.template` for the log filename (defaults to 'log-{{timedate}}.log')
- `fileDateFormat` (string) File date format to be used in filenameTemplate (defaults to 'yyyy-MM-dd')
- `lineTemplate` (string) `ow.template` for each log line (defaults to '{{timedate}} | {{type}} | {{message}}\n')
- `lineDateFormat` (string) Date format to be used in lineTemplate (defaults to 'yyyy-MM-dd HH:mm:ss.SSS')
- `HKRegExPattern` (string) Housekeeping regular expression pattern to find log files (defaults to 'log-\\d{4}-\\d{2}-\\d{2}\\.log')
- `HKhowLongAgoInMinutes` (number) How many minutes of logs should be kept (if not defined won't delete files)
- `dontCompress` (boolean) Defines if older files should not be gzip (default to false)
- `backupFolder` (string) If defined older log files will be moved to this folder (if not defined they won't be moved)
- `numberOfEntriesToKeep` (number) Number of OpenAF log channel entries to keep in memory (defaults to 100)
- `setLogOff` (boolean) Turns off console logging (defaults to false)

Sources:

- js/owrap.ch.js:5964

<a id="api-ow-ch-utils-syncch-2e52641d"></a>

## ow.ch.utils.syncCh

### ow.ch.utils.syncCh(aIdxsArray, aSource, aTarget, aSyncFn, aLogFn)

Tries to sync all values from `aSource` with `aTarget` channel using the `aIdxsArray` (list of value indexes field).
Optionally `aSyncFn` can be provided to decide how to sync the values between source and target (defaults to return always true). A `aLogFn`
can be provided so all sync actions can be logged.

Table of sync actions given the return values of a custom syncFn(source, target) : boolean

| source | target | return true | return false |
|--------|--------|-------------|--------------|
| __     | def    | del target  | add source   |
| def    | __     | add target  | del source   |
| def    | def    | set target  | set source   |

Sources:

- js/owrap.ch.js:5678

<a id="api-ow-ch-utils-timeseries-0a475fde"></a>

## ow.ch.utils.timeseries

### ow.ch.utils.timeseries

Helpers to query and feed channels of type `timeseries`. Every function takes the channel name first. A `selector` is a map
`{ metric, labels }` where `metric` and each label value can be a String, an Array (any of), a RegExp or a Function.

| Function | Returns | Description |
| --- | --- | --- |
| `series(aName, aSelector)` | Array | `{ metric, labels }` of the matching series |
| `labels(aName, aMetric)` | Map | Label names with their sorted values for a metric (or all metrics) |
| `latest(aName, aSelector)` | Array | Newest point of each matching series as flat rows |
| `range(aName, aSelector, aOptions)` | Array | Flat rows `{ ts, metric, ...labels, v }`. Options: `from`, `to`, `step` (ms or "1m"), `fn` (`avg`, `min`, `max`, `sum`, `count`, `first`, `last`, `rate`, `increase`; default `avg`), `fill` (`none`, `null`, `zero`, `prev`), `tier` (`raw` or a rollup step to force one) |
| `drop(aName, aSelector)` | Number | Removes the matching series, returns how many |
| `stats(aName)` | Map | Series and point counts, per metric and per tier |
| `housekeep(aName, aOptions)` | Number | Applies retention now (`{ now }` to measure from a given time); returns the removed entries |
| `rebuildRollups(aName)` | | Recomputes every rollup from the raw points |
| `compact(aName)` | Boolean | Rewrites the NDJSON file with the live data only |
| `save(aName)` | Boolean | Flushes pending changes now |
| `collect(aEvery, aName, aSource, aOptions)` | Map | Periodically records metrics (default `ow.metrics.getAll()`); returns `{ once, stop }` |
| `getTimeSeriesSubscriber(aTargetCh, aOptions)` | Function | Channel subscriber that records changes of another channel as points |
| `toOpenMetrics(aName, aSelector, aOptions)` | String | OpenMetrics text of the latest points (or all points with `from`/`to`) |
| `fromOpenMetrics(aName, aText, aOptions)` | Number | Records OpenMetrics text as points; returns how many |
| `pushPrometheus(aName, aPushGwUrl, aJob, aSelector, aOptions)` | Number | Pushes the latest point of each series to a Prometheus push gateway (one request per `groupBy` value); returns how many series were pushed |

With `step`, points are grouped in buckets aligned to the epoch and the row `ts` is the start of the bucket. When rollups exist, the finest
tier that reaches back to `from` and divides `step` is used. `rate` and `increase` treat a decrease in value as a counter reset (on rollup tiers they are approximate).

Example:

```javascript
ow.ch.utils.timeseries.range("m", { metric: "cpu", labels: { host: /^web/ } }, { from: "2026-01-01", step: "5m", fn: "max" });
```

Sources:

- js/owrap.ch.js:6456

