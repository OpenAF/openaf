# OpenAF Advanced Guide

Deeper coverage of selected modules and patterns.

## 1. Scheduler (ow.server.scheduler)
```javascript
ow.loadServer();
var sch = new ow.server.scheduler();
var id = sch.addEntry("*/10 * * * * *", () => log('tick'), true); // cron, fn, waitForFinish
// Modify later
id = sch.modifyEntry(id, "*/30 * * * * *", () => log('slower'), true);
```
Used internally by periodic oJobs with cron expressions.

## 2. Cron Utilities (ow.format.cron)
```javascript
ow.loadFormat();
var info = ow.format.cron.howManyAgo("*/5 * * * * *", Date.now() - 20000);
// info.isDelayed, info.missedExecutions
```
Useful for custom reliability checks beyond built-in `cronCheck`.

## 3. Channels as Distributed Data Fabric
- `mem` in‑memory
- `mvs` persistent (MapDB / storage engine)
- `big` peer-synchronizable

Pattern: create, expose, peer, cluster.
```javascript
$ch('events').create();
$ch('events').set({id:1},{msg:'hello'});
$ch('events').subscribe((ch,op,k,v)=> log(op+':'+stringify(k)));
```

## 4. Channel Clustering Overview
Declared via `ojob.channels.clusters` enabling node discovery & replication. Each cluster entry initializes an `ow.server.cluster` with periodic verification; combine with persistent channel types for fault tolerance.

## 5. Secure Buckets (ow.sec)
```javascript
ow.loadSec();
ow.sec.openMainSBuckets('masterSecret');
var bucket = $sec('repo','bucket','lock','masterSecret');
bucket.setSecret('bucket','lock','apiKey',{ key:'abc', created:new Date() });
var s = bucket.getSecret('bucket','lock','apiKey');
```
Supports multiple repos, lock-based access, encrypted at rest.

## 6. AI Helpers (ow.ai)
```javascript
ow.loadAI();
var lr = ow.ai.regression().linear([[0,1],[1,3],[2,5]]);
log(lr.string);
```
Combine with `(llm)` built-in job for integrated prompt workflows; set `OAF_MODEL` or use provider-specific configs.

## 7. Python Interop Patterns
Use server mode for throughput:
```javascript
ow.loadPython();
ow.python.startServer();
for (var i=0;i<100;i++) ow.python.exec("x = " + i + "*2", {}, []);
ow.python.stopServer();
```
Maintain state across calls with `execPM` persistent map.

## 8. Timeout & Cancellation Composition
Blend `$tb` with external cancel signals:
```javascript
var cancelled=false;
setTimeout(()=> cancelled=true, 3000);
var result = $tb(() => {
  while(!cancelled) {/* work */}
}).timeout(10000).stopWhen(()=>cancelled).exec();
```

## 9. Template Customization
Add namespaced helpers:
```javascript
ow.loadTemplate();
ow.template.addHelpers('x', { upper: s => s.toUpperCase() });
print(templify('Hi {{x_upper name}}', { name:'dev' }));
```

## 10. Structured Logging Strategies
Set `ojob.log.format: json` or env `OJOB_JSONLOG=true`. Combine with external log forwarder reading stderr. Include correlation IDs by inserting into `args` early and referencing in templates.

## 11. Data Validation Chaining
`_$(value,'label').toNumber().isNumber().between(1,100).default(10)` provides readable declarative constraints. Attach to job `check.in` & `check.out` for consistent boundaries.

## 12. DSL Reduction with Built-ins
Favor built-in job shortcuts `(if)`, `(repeat)`, `(each)`, `(parallel)` to minimize JS code, enabling easier reasoning by humans & LLMs while improving change auditability.

## 13. Performance Tuning Levers
- Reduce startup: set `ojob.conAnsi: false` (skip terminal probing)
- Limit thread count: `ojob.numThreads`
- Adjust parallel heuristics: `ojob.flags.PFOREACH.*`
- Prefer `execRequire` for large reusable code blocks vs inline duplicates

## 14. Observability Enhancement
Add custom metric functions under `ojob.metrics.add` and expose via passive endpoint or push to `openmetrics` / `nattrmon`. Use `collect` for historical channel snapshots amenable to downstream ETL.

## 15. Safe Dynamic Includes
Combine integrity hashes + authorized domains + change auditing flags. For local development disable with environment variable toggles but keep production strict.

---
See also: `ojob-security.md`, `openaf-flags.md`, and main references.
