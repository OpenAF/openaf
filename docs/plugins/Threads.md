# Threads Java Plugin Reference

The `Threads` plugin provides multi-threading, concurrency control, fixed/cached/scheduled/virtual thread pools (Java 21+ Project Loom), synchronized blocks, and OS native exit handles.

---

## Loading Syntax

```javascript
plugin("Threads");
var threads = new Threads();
```

---

## API Methods

| Category | Method | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Batch Threading** | `addThread(fn)` | `Function(uuid)` | `String` | Registers thread function and returns UUID. |
| | `start()` | *none* | `void` | Executes all added threads in parallel and waits for all to complete. |
| | `startNoWait()` | *none* | `void` | Executes added threads in parallel asynchronously. |
| | `startAtFixedRate(rateMs)` | `double` | `void` | Schedules added threads at fixed rate. |
| | `startWithFixedRate(delayMs)` | `double` | `void` | Schedules added threads with fixed delay after execution. |
| **Pool Executors** | `initCachedThreadPool()` / `addCachedThread(fn)` | `Function` | `String` | Cached thread pool execution. |
| | `initFixedThreadPool(n)` / `addFixedThread(fn)` | `int, Function` | `String` | Fixed-size thread pool execution. |
| | `initSingleThreadPool()` / `addSingleThread(fn)` | `Function` | `String` | Single worker thread execution. |
| | `initScheduledThreadPool(n)` | `int` | `void` | Initializes timer/scheduler pool. |
| | `addScheduleThread(fn, delayMs)` | `Function, double` | `String` | One-shot execution after delay. |
| | `addScheduleThreadAtFixedRate(fn, rateMs)` | `Function, double` | `String` | Recurring execution at fixed rate. |
| | `addScheduleThreadWithFixedDelay(fn, delayMs)` | `Function, double` | `String` | Recurring execution with fixed delay between runs. |
| | `initVirtualThreadPerTaskExecutor()` / `addVirtualThread(fn)` | `Function` | `String` | Java 21+ Project Loom virtual thread per task execution. |
| **Control & Sync** | `stop(force)` | `boolean` | `void` | Stops executor (`force = true` invokes `shutdownNow()`). |
| | `waitForThreads(timeoutMs)` | `double` | `boolean` | Waits for thread completion up to timeout. |
| | `sync(fn)` | `Function` | `void` | Executes function inside synchronized block. |
| | `getNumberOfCores()` | *none* | `int` | Returns `Runtime.getRuntime().availableProcessors()`. |
| **Shutdown & Fast Exit**| `addOpenAFShutdownHook(fn)` | `Function` | `void` | Registers callback invoked upon OpenAF process shutdown. |
| | `runOpenAFShutdownHooksNow()` | *none* | `void` | Executes all shutdown hooks synchronously in reverse order. |
| | `nativeExit(code)` | `int` | `void` | Immediately terminates process via C `_exit` (bypassing slow JVM teardowns). |
| | `armFastExitOnShutdown(code)` | `int` | `void` | Arms fast-exit hook on shutdown. |

---

## Practical Code Example

```javascript
plugin("Threads");
var t = new Threads();

// Virtual Threads (Java 21+)
t.initVirtualThreadPerTaskExecutor();
for (var i = 0; i < 5; i++) {
  let taskId = i;
  t.addVirtualThread(uuid => {
    sleep(100);
    print("Virtual Thread " + taskId + " (" + uuid + ") done.");
  });
}

// Synchronized Resource Access
var sharedCounter = 0;
t.sync(() => {
  sharedCounter++;
});

// Scheduled Thread
t.addScheduleThread(() => {
  print("Executed after 1.5s delay");
}, 1500);
```
