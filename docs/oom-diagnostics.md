# OOM diagnostics with OpenAF

Load `ow.loadJava()` before these examples. Always select `"self"` (the JVM executing the script) or the PID of the affected process. A fresh helper's own heap usage does not describe another service.

```javascript
var snapshot = ow.java.collectOOM("self")
io.writeFileJSON("oom-baseline.json", snapshot)
// In the same Linux container and as the target owner:
var snapshot = ow.java.collectOOM(123)
```

The lightweight snapshot contains JVM version/flags/heap information, source-labelled sections and individual errors. Self instrumentation includes heap/non-heap pools, buffers, GC counters, class and thread counts. Linux adds process status/limits and memory cgroup v1/v2 files resolved from the target's mount information. Raw cgroup values preserve `max` and exact counters. Missing diagnostics do not silently become helper measurements.

```javascript
ow.java.diagnosticCapabilities(123)
ow.java.classHistogram(123) // live objects; may collect and pause
ow.java.classHistogram(123, { live: false }) // includes unreachable objects
io.writeFileString("threads.txt", ow.java.threadDump(123))
ow.java.threadDump(123, { file: "/diagnostics/all-threads.json" }) // supporting JVMs only
ow.java.nativeMemory(123) // reports disabled NMT; does not enable it
ow.java.heapDump(123, "/diagnostics/unique.hprof")
ow.java.heapDump(123, "/diagnostics/unique.hprof.gz", { gzip: true })
```

Files produced by target commands are in the target filesystem. Heap dumps require absolute, unique paths, available disk space, and may cause substantial pauses. The target rejects existing dump files. Compression and all-thread JSON dumps depend on target support. NMT normally needs startup configuration. Snapshots do not request heap dumps, histograms, GC or JFR recording.

## Runtime compatibility

The new HPROF Java core compiles with `javac --release 8`. Self management works through standard management APIs and optional HotSpot MBeans. Java 8 through Java 27 feature availability is detected rather than inferred from the helper's version. Custom runtime images may omit management or attach modules.

External diagnostics first try the Attach API. A Linux HotSpot fallback uses Java Unix-domain sockets (Java 16+), with no JDK executable dependency. It needs the same user and PID/filesystem namespace, readable proc files, an enabled attach mechanism and `/bin/kill` when initialization is needed. Java 8 reduced runtimes without Attach cannot use this fallback; use self instrumentation or a newer helper in the same container. No native library is bundled.

```javascript
ow.java.jcmd(123, "GC.heap_info", {
  transport: "socket", // explicitly exercise the JRE-only route
  timeoutMs: 30000,
  maxOutputBytes: 16777216,
  tmpDir: "/tmp"
})
```

Initialization verifies ownership, process identity and a caught SIGQUIT before creating the trigger and signaling once. Set `initialize:false` to require an existing listener. Configure `tmpDir` when the JVM uses a different attach directory. Socket timeouts cover connect/write and idle response time; the Attach API can block. Timeout/output-limit failures do not cancel an operation already executing, and commands are never retried after submission.

## Reading HPROF without a JDK

```javascript
var summary = ow.java.hprofSummary("unique.hprof.gz")
print(summary.histogram)
ow.java.parseHPROF("unique.hprof", function(record) {
  print(stringify(record))
}, { type: "instance", className: "my/package/Record", values: true, arrayLimit: 16 })
```

The reader makes two streaming passes to resolve names and inherited fields, reopening gzip input for the second pass. It retains metadata and per-class counts, not an object graph. `maxMetadata` defaults to one million name/class entries; exceeding it throws. `parseHPROF` requires a callback; return `false` to stop the output pass. Filters are exact `type`, `className` and `objectId` values. Metadata types are `class`, `instance`, `objectArray`, `primitiveArray` and `root`.

IDs are hexadecimal strings; Java long field values are decimal strings. `values:true` exposes instance fields/static fields and bounded array samples; defaults expose metadata only. Strings remain objects/references, not reconstructed application text. Object references are not recursively expanded. `payloadBytes` measures serialized field/array data, excluding object headers/alignment; it is neither retained size nor an exact heap footprint. Root counts do not establish ownership paths. Use a graph analyzer for dominators and retained sizes.

Supports HotSpot HPROF 1.0.1/1.0.2 with 4/8-byte IDs, segmented heaps and gzip. Unknown heap subrecords and malformed/truncated files throw with offsets. Unknown length-delimited top-level records are skipped with bounded warnings. Android-specific formats are outside this first version. Future oafp input can call the callback interface without accumulating all records.

## Focused validation

```sh
javac --release 8 -d /tmp/oom-tests src/openaf/HPROFReader.java tests/java/HPROFReaderTest.java
java -cp /tmp/oom-tests HPROFReaderTest
```

The Java oJob suite includes the self snapshot/thread/target-validation test. Java 8 source compatibility is distinct from execution on an actual Java 8 OpenAF distribution.

## oafp integration

The sibling oafp Java diagnostics guide documents `in=javadiag`, `in=jcmd`, `in=hprof`, full-stack parsing, OOM extraction, local bundles and report outputs. Collection requires an explicit PID; report outputs analyze supplied evidence.

`ow.java.diagnosticResult(target, command, options)` adds timestamp, duration and status around the existing string API. Failures have an unknown target outcome and are never retried. It does not add a hard Attach API deadline.

`parseJFR(file, callback, includeDesc, options)` now accepts `events` (exact event names), `startTime`, `endTime` and `maxEvents`; return false from callback to stop. Filtering occurs before field conversion. Optional virtual-thread methods are guarded. Legacy three-argument calls preserve their behavior.

Linux socket fallback now resolves NSpid and the target temporary directory through `/proc/PID/root` when namespace PIDs differ. Explicit `transport:"nsenter"` accepts `nsenterPath` and an `nsenterHelper` argument array naming a preinstalled modern OpenAF launcher plus `js/java-diagnostic-helper.js` in the target mount namespace. It enters mount/PID namespaces with target UID/GID using existing caller privileges. Helper output and runtime are bounded; terminating the helper does not cancel the target command. No automatic escalation or retries occur. Live container validation remains outstanding.

JFR options additionally include `exactLongs`, `arrayLimit` (256 default), and `maxDepth` (32 default). Depth truncation is represented explicitly. Array output is capped; use a larger explicit limit when complete arrays are needed.

Use `isolated:true` to execute external diagnostic calls in a disposable modern OpenAF worker JVM, with bounded output and timeout. The worker requires a rebuilt runtime containing these APIs; `workerCommand` can explicitly select another OpenAF launcher argument array. A worker deadline does not cancel commands already executing in the target. Do not assume these features are installed from checkout documentation alone.
