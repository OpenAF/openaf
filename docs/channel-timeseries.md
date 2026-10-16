# Time series channels: record, retain and query labelled metrics

[Index](./index.md) | [Core](./openaf.md#ow-ch---channels) | [ODoc](./odoc.md)

The `timeseries` channel type stores numeric points identified by a metric name, a set of labels and a timestamp (the Prometheus/OpenMetrics model) as a regular OpenAF channel. It keeps data in memory with an optional append-only NDJSON file, or delegates it to other channels (e.g. `mvs`), applies retention by age and/or count, maintains RRD-like rollups, and `ow.ch.utils.timeseries` adds queries (`range`, `latest`, ...), a collector for `ow.metrics`, a channel subscriber and OpenMetrics import/export. Contracts live in [owrap.ch.js](../js/owrap.ch.js); tests are in [autoTestAll.Channels.js](../tests/autoTestAll.Channels.js) (`testTimeSeriesChannel`, `testTimeSeriesChannelStore`, `testTimeSeriesIntegrations`).

## Create a timeseries channel

```javascript
$ch("m").create(true, "timeseries", { file: "metrics.ndjson", retention: "7d" });
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `file` | String | | Path to the NDJSON log. Without `file` (and `store`) the channel only lives in memory |
| `readOnly` | Boolean | `false` | Reject changes and never write the file |
| `create` | Boolean | `true` | If `false` the file (or store) must already exist |
| `autosave` | String | `"always"` | `"always"` appends on every change, `"debounced"` appends at most every `saveDebounceMs`, `"off"` only appends on `save`/destroy |
| `saveDebounceMs` | Number | `5000` | Minimum interval between appends when `autosave` is `"debounced"` |
| `lock` | String | | Path to a dummy file used as a filesystem lock while loading and writing |
| `compactRatio` | Number | `0.5` | The file is rewritten when more than this ratio of its lines is dead (overwritten, deleted or expired) |
| `store` | Map | | Keep the data on channels of another type instead of memory (see [Keep the data out of memory](#keep-the-data-out-of-memory)). Can't be combined with `file` |
| `chunk` | String/Number | `"1h"` | Time span of each stored chunk (only with `store`) |
| `retention` | String/Number | | How long to keep raw points (`"7d"`, `"90m"`, or ms). Same as `raw.keep` |
| `maxPoints` | Number | | Maximum raw points per series. Same as `raw.maxPoints` |
| `raw` | Map | | `{ keep, maxPoints }` for the raw points |
| `rollups` | Array | | `[ { step: "1m", keep: "1d" }, { step: "1h", keep: "30d" } ]` (see [Rollups](#rollups)) |
| `retentionRef` | String | `"series"` | `"series"` measures `keep` back from the newest point of each series, `"now"` from the current time |
| `housekeepEveryMs` | Number | `0` | Minimum interval between retention runs triggered by writes (`0` runs on every write) |

Durations accept numbers (ms) or abbreviations understood by `ow.format.fromTimeAbbreviation` (`500ms`, `30s`, `5m`, `1h`, `7d`, `1h30m`). The channel never starts threads of its own.

## Keys and values

| Entry | Key | Value |
| --- | --- | --- |
| Point | `{ metric, labels, ts }` | `{ v }` where `v` is a finite number |

`labels` is optional and its values are stored as strings; `ts` is epoch ms, a Date or an ISO string (and defaults to now on `set`). A series is a metric plus its labels; a point is a series plus a `ts`. What `get` and `getAll` return is always `{ metric, labels, ts, v }`.

```javascript
$ch("m").set({ metric: "cpu", labels: { host: "a" }, ts: 1000 }, { v: 0.4 });
$ch("m").set({ metric: "cpu", labels: { host: "a" }, ts: 2000 }, { v: 0.6 });
$ch("m").set({ metric: "cpu", labels: { host: "b" }, ts: "2026-01-01T00:00:00Z" }, { v: 0.1 });
$ch("m").set({ metric: "uptime" }, { v: 3600 });   // ts defaults to now

$ch("m").get({ metric: "cpu", labels: { host: "a" } });             // latest: { metric: "cpu", labels: { host: "a" }, ts: 2000, v: 0.6 }
$ch("m").get({ metric: "cpu", labels: { host: "a" }, ts: 1000 });   // exact point
$ch("m").size();                                                     // 4 (points)
```

Behavior to rely on:

- Setting the same series and `ts` again overwrites the point; out-of-order points are inserted in order.
- `get` without `ts` returns the latest point of the series.
- `unset` with `ts` removes that point; **without `ts` it drops the whole series** (points and rollups). `ow.ch.utils.timeseries.drop` removes many series by selector.
- `getKeys`, `getAll` and `forEach` go series by series (sorted by metric and labels), points in time order. `getKeys`/`getAll` accept a selector `{ metric, labels, from, to }`. `getSortedKeys` sorts all points by `ts`.
- `shift`/`pop` follow the other channel types: they return **and remove** the oldest/newest point of the channel.
- `setAll(aKeyFields, aValues)` takes flat values `{ metric, labels, ts, v }`; the key fields default to `metric`, `labels` and `ts`. It does one write per series (and one file append, or one `mvs` commit per chunk).
- With `readOnly: true`, changes throw `timeseries channel is read-only`.
- Channel subscribers run asynchronously (use `$ch(...).waitForJobs()` when you need to wait for them).

## The NDJSON file

The file is a log: each write appends one line (`{"o":"s",...}` series, `p` point, `r` rollup bucket, `d` delete, `x` drop series) so a write never rewrites the file. Loading replays the log (a truncated last line is ignored). Overwritten, deleted and expired entries become dead lines; when more than `compactRatio` of the lines are dead (checked every 1000 appended lines and on destroy) the file is rewritten with the live data using a temporary file and an atomic move. `ow.ch.utils.timeseries.compact` does it on request.

Retention is not logged: it is applied again when the file is loaded and after writes. Use only one writer per file (or `lock`, for cooperating processes that reopen the channel between writes); use `readOnly: true` for shared reading.

## Query with `ow.ch.utils.timeseries`

Every function takes the channel name first. A **selector** is `{ metric, labels }` where `metric` and each label value can be a String, an Array (any of), a RegExp or a Function; an empty selector matches everything.

| Function | Returns | Description |
| --- | --- | --- |
| `series(aName, aSelector)` | Array | `{ metric, labels }` of the matching series |
| `labels(aName, aMetric)` | Map | Label names with their sorted values (for a metric, or for all) |
| `latest(aName, aSelector)` | Array | The newest point of each matching series as flat rows |
| `range(aName, aSelector, aOptions)` | Array | Flat rows `{ ts, metric, ...labels, v }` (see below) |
| `drop(aName, aSelector)` | Number | Removes the matching series; returns how many |
| `stats(aName)` | Map | `series`, `points`, per `metrics` (series, points, first, last) and per `tiers` entries |
| `housekeep(aName, aOptions)` | Number | Applies retention now (`{ now }` measures from that time); returns the removed entries |
| `rebuildRollups(aName)` | | Recomputes every rollup from the raw points |
| `compact(aName)` | Boolean | Rewrites the NDJSON file with the live data only |
| `save(aName)` | Boolean | Flushes pending appends now (`false` if read-only) |

`range` options:

| Option | Description |
| --- | --- |
| `from`, `to` | Inclusive bounds (epoch ms, Date or ISO string). Default: everything |
| `step` | Bucket size (ms or `"5m"`). Buckets are aligned to the epoch and a row's `ts` is the start of its bucket. Without `step` the raw points are returned |
| `fn` | `avg` (default), `min`, `max`, `sum`, `count`, `first`, `last`, `rate` (per second) or `increase`. `rate` and `increase` treat a decrease of the value as a counter reset |
| `fill` | For buckets without data: `none` (default), `null`, `zero` or `prev` |
| `tier` | Force the raw tier (`"raw"`) or a rollup (its step, e.g. `"1h"`) |

```javascript
var ts = ow.ch.utils.timeseries;

ts.range("m", { metric: "cpu", labels: { host: /^web/ } }, { from: "2026-01-01", step: "5m", fn: "max" });
// [ { ts: 1767225600000, metric: "cpu", host: "web1", v: 0.93 }, ... ]

ts.range("m", { metric: "http_requests_total" }, { step: "1m", fn: "rate" });   // requests per second
ts.latest("m", { metric: "cpu" });                                              // one row per host
ts.labels("m", "cpu");                                                          // { host: [ "a", "b" ] }
```

The rows are flat, so they go straight into `oafp`:

```bash
openaf -c 'ow.loadCh(); $ch("m").create(true,"timeseries",{file:"cpu.ndjson"}); print(stringify(ow.ch.utils.timeseries.range("m",{metric:"cpu"},{step:"2m"}),__,""))' | oafp out=ctable
```

Label names that collide with `ts`, `metric` or `v` are prefixed with `_` in the rows.

## Retention

- `retention` / `raw.keep` drops raw points older than `keep` before the newest point of the same series (`retentionRef: "series"`, the default; it is deterministic and never empties a series that stopped reporting) or before the current time (`retentionRef: "now"`).
- `maxPoints` keeps the newest N raw points of each series.
- Both run on writes (every write by default, or every `housekeepEveryMs`), when the channel is created, and on demand with `ow.ch.utils.timeseries.housekeep(aName)`. Use `housekeep` (or a scheduled job) to trim series that stopped receiving writes with `retentionRef: "now"`.
- Points removed by retention do not notify channel subscribers.
- A point written older than the retention is accepted and removed right away.

## Rollups

Rollups keep aggregated buckets after the raw points are gone (the RRD idea), so long ranges stay cheap and history outlives the raw retention.

```javascript
$ch("m").create(true, "timeseries", {
  file: "metrics.ndjson",
  raw    : { keep: "6h" },                                   // raw points for 6 hours
  rollups: [ { step: "1m", keep: "1d" },                     // 1 minute buckets for a day
             { step: "1h", keep: "30d" } ]                   // 1 hour buckets for 30 days
});
```

Each bucket stores `count`, `sum`, `min`, `max`, `first` and `last` (so `avg`, `min`, `max`, `sum`, `count`, `first`, `last` and `increase` are all answered from it, and a coarser `step` can merge finer buckets exactly when it is a multiple of the bucket size). Buckets are updated on every write.

- `range` with a `step` uses the finest tier whose buckets divide `step` and that still reaches back to `from` (raw points while they exist). Use `tier` to force one.
- A late point is always stored in the raw tier, and updates every rollup whose bucket has not expired.
- Overwriting or removing a point rebuilds its buckets from the raw points when those are complete. When raw data has been trimmed, the bucket is only adjusted (`count`, `sum`, `first`, `last` follow, but `min` and `max` can't narrow).
- On rollup tiers `rate`/`increase` are approximate: a reset inside a bucket is only detected when its `last` is below its `first`.
- Rollups only exist for the writes made after they were configured; `rebuildRollups` recomputes them from the raw points that are still there.

## Keep the data out of memory

By default everything is in memory (and optionally in the NDJSON file). With `store` the data is kept in other OpenAF channels (a `series` index and one chunk channel per tier, named `timeseries::<name>::<part>`) so memory is bounded by that channel's own caching. Points are stored as sorted chunks (key `{ s, b }` with the chunk's start time), so a `range` only reads the chunks it overlaps, and retention drops whole chunks.

```javascript
$ch("m").create(true, "timeseries", { store: { type: "mvs", options: { file: "metrics.db", compact: true } }, chunk: "1h", retention: "30d" });
```

| `store` field | Type | Description |
| --- | --- | --- |
| `type` | String | Channel type used for every part (e.g. `mvs`) |
| `options` | Map or Function | Options for the underlying channels. A Map gets a distinct `map` name per part (so one `mvs` file holds all); a Function receives the part name (`series`, `raw`, `r<step>`) and returns its options |
| `compress` | Boolean | Passed as `shouldCompress` when creating the underlying channels |
| `bulk` | Boolean | Use the underlying channel's `setAll` to write several chunks at once (defaults to `true` for `mvs`) |

With a store, `file`, `autosave`, `saveDebounceMs`, `lock` and `compactRatio` don't apply: every change goes straight to the store. `create: false` throws if the store is empty. Destroying the timeseries channel destroys the underlying ones.

Measured with `mvs` (100,000 points over 20 series, 1 s spacing; indicative numbers on a laptop):

| | Memory | NDJSON file | `mvs` store |
| --- | --- | --- | --- |
| Load 100,000 points in one `setAll` | ~1.1 s | ~1.0 s | ~1.1 s (1.7 s with two rollups) |
| 2,000 points one `set` at a time | ~0.1 s | ~0.2 s | ~2.5 s (4.7 s with two rollups) |
| Reopen with 100,000 points | | ~0.3 s | no replay |
| `range` of one series, all points | ~10 ms | ~10 ms | ~15 ms |
| `latest` over 20 series | ~2 ms | ~2 ms | ~30 ms |

Use a store when the data is large relative to the heap or you can't afford to replay a log at start-up; write in batches (`setAll`) because every `mvs` write is a commit. Notes: `getKeys`, `getAll`, `stats` and `size` on a store walk the series index or all chunks of the selected series; set `compact: true` in the `mvs` options so the file is compacted on destroy.

## Record data

### From `ow.metrics`

`collect(aEvery, aName, aSource, aOptions)` records a source periodically, in the style of `ow.ch.utils.keepHistory`: `aEvery` is a number of ms or a cron expression; `aSource` is omitted (all of `ow.metrics.getAll()`), an Array of metric names, or a function returning a map or an array of `{ metric, labels, v, ts }`. Nested maps extend the metric name with `_` (leading underscores of a key are dropped), array items get an `idx` label, booleans become 0/1 and non numeric values are skipped. Options: `labels` (added to every point), `prefix`, `onError`. It returns `{ once, stop }`; **call `stop()` before the process ends or the channel is destroyed** (the collector also stops itself if the channel no longer exists).

```javascript
$ch("m").create(true, "timeseries", { file: "oaf.ndjson", retention: "2d", retentionRef: "now" });
var col = ow.ch.utils.timeseries.collect(5000, "m", __, { prefix: "oaf_", labels: { app: "demo" } });
// ...
col.stop();
```

### From another channel

`getTimeSeriesSubscriber(aTargetCh, aOptions)` returns a subscriber that records the `set`/`setall` of another channel as points. Options: `metric` (String or `function(key, value)`), `labels` (Array of field names, or a function), `value` (field name or function; defaults to `v`) **or** `values` (Array of field names, one metric `<metric>_<field>` each), `ts` (field name or function; defaults to now) and `ops`.

```javascript
$ch("events").subscribe(ow.ch.utils.timeseries.getTimeSeriesSubscriber("m", { metric: "temp", labels: [ "room" ], value: "t", ts: "when" }));
$ch("events").set({ id: 1 }, { id: 1, room: "kitchen", t: 21.5, when: 1000 });
```

### OpenMetrics (Prometheus text)

`toOpenMetrics(aName, aSelector, aOptions)` returns the latest point of each series (or every point between `from` and `to`) as text: `name{label="value"} value timestamp`. Metric and label names are sanitized, label values escaped. Options: `help` (`{ metric: { help, type } }` for `# HELP`/`# TYPE` lines), `timestamps: false`, `tsUnit` (`"s"` default, `"ms"`). `fromOpenMetrics(aName, aText, aOptions)` records such text as points (options: `labels` added to all, `ts` default timestamp, `tsUnit`) and returns how many.

```javascript
var txt = ow.ch.utils.timeseries.toOpenMetrics("m", { metric: /^cpu/ });
// cpu{host="a"} 0.6 2
// POST txt to a Prometheus push gateway:
$rest().post("http://pushgw:9091/metrics/job/demo", txt);
$ch("copy").create(true, "timeseries", {});
ow.ch.utils.timeseries.fromOpenMetrics("copy", txt);
```

## More use cases

- **Host and JVM history**: `collect` with `retentionRef: "now"` and a rollup per hour gives a cheap local history of `ow.metrics` without an external system.
- **Job durations and SLOs**: record one point per run (`{ metric: "job_seconds", labels: { job: "etl" } }`) and ask `range(..., { step: "1d", fn: "max" })`.
- **Counters**: store the raw counter and use `rate`/`increase`, resets are handled.
- **Sensor and IoT feeds**: a channel subscriber on the receiving channel keeps a bounded history with `maxPoints`.
- **Export**: `range` rows feed `oafp` (`out=ctable`, `out=csv`, `out=md`...); `toOpenMetrics` feeds Prometheus tooling.

## Limits

- One writer per NDJSON file; the whole file content is replayed in memory at load.
- Values are numbers only; for several fields record several metrics or add a `field` label.
- Retention deletes made by the channel do not notify subscribers.

## Source documentation

The same contracts are documented in the source as Markdown ODoc entries (`ow.ch.types.timeseries` and `ow.ch.utils.timeseries`), available with `help ow.ch.types.timeseries` in the console or `openaf -helpscript ow.ch.types.timeseries`. See [odoc.md](./odoc.md#opt-in-to-markdown) for the format.
