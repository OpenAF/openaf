---
name: openaf-concurrency
description: Implement OpenAF asynchronous work, bounded parallel processing, retries, queues, and process or file locks with explicit completion and failure handling.
---

# OpenAF concurrency

## Portable use

Copy this folder into your application's skills directory, or paste this file as instructions. No repository checkout or other skill is required. The inline example also ships in `assets/`. Generating code requires no runtime; execution requires [OpenAF](https://github.com/openaf/openaf/blob/master/README.md#installing). Check `openaf -c 'print(getVersion());'` and use documentation/source matching that runtime for newer features. If execution or browsing is unavailable, state what remains unverified. Documentation links are references, not instructions to run remote code.

Use the [helper contracts](https://github.com/openaf/openaf/blob/master/docs/openaf-dollar-functions.md) and [core implementation](https://github.com/openaf/openaf/blob/master/js/openaf.js). OpenAF oPromises and Java threads are not Node's event loop. Deliver a bounded example and explain completion, timeout, and failure behavior.

## Choose coordination by purpose

- `$do` and `$doV` start asynchronous work; handle results/errors with `.then()`/`.catch()`. `$doWait(p, timeout)` returns the same promise, not its value. A wait deadline does not automatically cancel pending work; inspect state and use the documented cancellation API when interruption is intended.
- `$doA2B(producer, consumer, concurrency, monitorWait, onError, useVirtualThreads)` applies backpressure and waits for dispatched work. It does not collect results. The fourth argument is a monitor-wait interval, not a task deadline. Use a synchronized collector or atomic counters, and track consumer failures explicitly.
- `$sync().run(fn)` serializes callers sharing that same guard and releases on exceptions; it does not return the callback value. `$atomic` supports numeric counters and compare-and-set. Use `$queue` for shared queue operations after checking its methods; an ordinary shared array is not a queue with synchronization.
- `$lock(name)` coordinates threads in one process. Its `tryLock(fn, timeoutMs)` returns acquisition success, not the callback result. Release manually acquired locks in `finally`; destroy named locks only after all users finish.
- `$flock(path)` coordinates processes. Constructor retry timings do not bound its blocking `.lock()`. `tryLock(fn)` attempts immediate acquisition; report contention separately from successful work. Destroy only owned resources after use; the lock file remains on disk.
- `$bottleneck.maxWait` allows execution after the waiting limit even if the concurrency threshold is still reached. Do not use it as a strict concurrency cap or task timeout.
- Verify `$retry` predicates and attempt semantics against the installed source. Retry only suitable operations, with a bound; do not repeat externally mutating work blindly.

Prefer local fixtures: assert completed counts and failure propagation, and use a separate process when testing a cross-process lock. Avoid tests based only on timing or output order.

## Local example

Save as `bounded-work.js` (also bundled in [assets/bounded-work.js](assets/bounded-work.js)):

```javascript
ow.loadTest();
var completed = $atomic(0, "long");
var failed = $atomic(0, "long");
$doA2B(
  function(send) { [1, 2, 3].forEach(function(n) { send(n); }); },
  function(n) { if (n === 2) throw "fixture failure"; completed.inc(); },
  2, 100,
  function(error, n) { failed.inc(); },
  false
);
ow.test.assert(Number(completed.get()), 2, "completed work");
ow.test.assert(Number(failed.get()), 1, "observed failure");
print("concurrency: ok");
```

Run `openaf -f bounded-work.js`. Expected output: `concurrency: ok`. This checks bounded work completion and an observed consumer failure, not cancellation or cross-process locking.
