# Threads

[Home](../index.md) / [All APIs](../all-apis.md) / [Threads](index.md)

<a id="api-threads-threads-b3e67a90"></a>

## Threads.Threads

### Threads.Threads() : Threads

Creates a new instance of a group of threads to manage.

Sources:

- src/openaf/plugins/Threads.java:156

<a id="api-threads-addcachedthread-158f25b0"></a>

## Threads.addCachedThread

### Threads.addCachedThread(aFunction) : String

Adds to the cached thread pool aFunction to be executed. Returns an UUID associated with the thread. The aFunction will receive the corresponding UUID as the first parameter. Note: it calls initCachedThreadPool if it wasn't previously and it won't work if any of the other start&#42; of init&#42; methods has been used previously.

Sources:

- src/openaf/plugins/Threads.java:508

<a id="api-threads-addfixedthread-bf3e6f6e"></a>

## Threads.addFixedThread

### Threads.addFixedThread(aFunction) : String

Adds to the fixed thread pool aFunction to be executed. Returns an UUID associated with the thread. The aFunction will receive the corresponding UUID as the first parameter. Note: it calls initFixedThreadPool if it wasn't previously and it won't work if any of the other start&#42; of init&#42; methods has been used previously.

Sources:

- src/openaf/plugins/Threads.java:525

<a id="api-threads-addopenafshutdownhook-840d34d4"></a>

## Threads.addOpenAFShutdownHook

### Threads.addOpenAFShutdownHook(aFunction)

Adds aFunction to try to execute whenever OpenAF is going to shutdown. The latest hook added will be the first to be executed until the first hook added.

Sources:

- src/openaf/plugins/Threads.java:178

<a id="api-threads-addschedulethread-0233e7df"></a>

## Threads.addScheduleThread

### Threads.addScheduleThread(aFunction, aDelay) : String

Adds to the scheduled thread pool aFunction to be executed within aDelay in ms. Returns an UUID associated with the thread. The aFunction will receive the corresponding UUID as the first parameter. Note: it calls initScheduledThreadPool if it wasn't previously and it won't work if any of the other start&#42; or init&#42; methods has been used previously.

Sources:

- src/openaf/plugins/Threads.java:491

<a id="api-threads-addschedulethreadatfixedrate-40e39e6e"></a>

## Threads.addScheduleThreadAtFixedRate

### Threads.addScheduleThreadAtFixedRate(aFunction, aRate) : String

Adds to the scheduled thread pool aFunction to be executed at a fixed aRate in ms. Returns an UUID associated with the thread. The aFunction will receive the corresponding UUID as the first parameter. Note: it calls initScheduledThreadPool if it wasn't previously and it won't work if any of the other start&#42; or init&#42; methods has been used previously.

Sources:

- src/openaf/plugins/Threads.java:559

<a id="api-threads-addschedulethreadwithfixeddelay-80367eb4"></a>

## Threads.addScheduleThreadWithFixedDelay

### Threads.addScheduleThreadWithFixedDelay(aFunction, aDelay) : String

Adds to the scheduled thread pool aFunction to be executed at a fixed aDelay in ms. Returns an UUID associated with the thread. The aFunction will receive the corresponding UUID as the first parameter. Note: it calls initScheduledThreadPool if it wasn't previously and it won't work if any of the other start&#42; or init&#42; methods has been used previously.

Sources:

- src/openaf/plugins/Threads.java:576

<a id="api-threads-addsinglethread-df39c4d5"></a>

## Threads.addSingleThread

### Threads.addSingleThread(aFunction) : String

Adds to the single thread pool aFunction to be executed. Returns an UUID associated with the thread. The aFunction will receive the corresponding UUID as the first parameter. Note: it calls initSingleThreadPool if it wasn't previously and it won't work if any of the other start&#42; of init&#42; methods has been used previously.

Sources:

- src/openaf/plugins/Threads.java:542

<a id="api-threads-addthread-cb1c4aab"></a>

## Threads.addThread

### Threads.addThread(aFunction) : String

Add a thread to call aFunction as callback. Returns an UUID associated with the thread. The aFunction will receive the corresponding UUID as the first parameter.

Sources:

- src/openaf/plugins/Threads.java:314

<a id="api-threads-addvirtualthread-24ce05db"></a>

## Threads.addVirtualThread

### Threads.addVirtualThread(aFunction) : String

Adds to the virtual thread executor aFunction to be executed. Returns an UUID associated with the thread.

Sources:

- src/openaf/plugins/Threads.java:477

<a id="api-threads-armfastexitonshutdown-e984a3ee"></a>

## Threads.armFastExitOnShutdown

### Threads.armFastExitOnShutdown(anExitCode)

Arms an extra JVM shutdown hook that waits for every other OpenAF-registered shutdown hook/action (see addOpenAFShutdownHook and the Java-side registerShutdownAction) to finish, then calls Threads.nativeExit(anExitCode) itself - the same fast-exit trick exit(code, true) uses, but triggered automatically once JVM shutdown actually begins rather than requiring an explicit exit(code, true) call. This covers cases like a script simply finishing, Ctrl-C or SIGTERM, where the JVM's own trailing teardown (including the safepoint wait for JIT compiler threads that can delay exit by several seconds) would otherwise still run after the hooks are done. Calling this does nothing on its own: it only takes effect once real JVM shutdown starts, so normal execution and daemon/server processes that intentionally stay alive (non-daemon threads still running) are unaffected. As with exit(code, true), once armed, any shutdown hook or File.deleteOnExit() entry not registered through OpenAF will NOT run once shutdown starts. Idempotent: calling it again just updates the exit code that will be used.

Sources:

- src/openaf/plugins/Threads.java:262

<a id="api-threads-getnumberofcores-e348affb"></a>

## Threads.getNumberOfCores

### Threads.getNumberOfCores() : number

Returns the number of cores identified by Java.

Sources:

- src/openaf/plugins/Threads.java:167

<a id="api-threads-initcachedthreadpool-d11ef787"></a>

## Threads.initCachedThreadPool

### Threads.initCachedThreadPool()

Uses a thread pool situable for cached threads. Note: it ignores any previous thread added using addThread; It won't work if any of the other start&#42; or init&#42; methods has been used.

Sources:

- src/openaf/plugins/Threads.java:397

<a id="api-threads-initfixedthreadpool-74abe313"></a>

## Threads.initFixedThreadPool

### Threads.initFixedThreadPool(numberOfThreads)

Uses a thread pool situable for fixed threads where you can specify the numberOfThreads to use (by default the number of cores). Note: it ignores any previous thread added using addThread; It won't work if any of the other start&#42; or init&#42; methods has been used.

Sources:

- src/openaf/plugins/Threads.java:430

<a id="api-threads-initscheduledthreadpool-92465c71"></a>

## Threads.initScheduledThreadPool

### Threads.initScheduledThreadPool(numberOfThreads)

Uses a thread pool situable for scheduled threads where you can specify the numberOfThreads to use (by default the number of cores). Note: it ignores any previous thread added using addThread; It won't work if any of the other start&#42; or init&#42; methods has been used.

Sources:

- src/openaf/plugins/Threads.java:411

<a id="api-threads-initsinglethreadpool-d706d731"></a>

## Threads.initSingleThreadPool

### Threads.initSingleThreadPool(numberOfThreads)

Uses a thread pool situable for single threads where you can specify the numberOfThreads to use (by default the number of cores). Note: it ignores any previous thread added using addThread; It won't work if any of the other start&#42; or init&#42; methods has been used.

Sources:

- src/openaf/plugins/Threads.java:449

<a id="api-threads-initvirtualthreadpertaskexecutor-3857c3c8"></a>

## Threads.initVirtualThreadPerTaskExecutor

### Threads.initVirtualThreadPerTaskExecutor()

Uses a virtual thread per task executor (Java 21).

Sources:

- src/openaf/plugins/Threads.java:464

<a id="api-threads-nativeexit-33a92fcc"></a>

## Threads.nativeExit

### Threads.nativeExit(anExitCode)

Terminates the current process immediately at the operating system level (the C library's &#95;exit), bypassing the JVM's own shutdown sequence entirely - including JVM-registered shutdown hook threads and the safepoint HotSpot uses to wait for JIT compiler threads, which can otherwise delay process exit by several seconds (observed up to &#126;10s) when a compilation is still in flight. Because JVM-level cleanup is skipped, call Threads.runOpenAFShutdownHooksNow() first for any cleanup that must still happen (this is what exit(code, true) does). Falls back to Runtime.halt (not guaranteed to avoid the delay this method exists to avoid) if the native call is unavailable on this platform.

Sources:

- src/openaf/plugins/Threads.java:232

<a id="api-threads-runopenafshutdownhooksnow-dd85a1c1"></a>

## Threads.runOpenAFShutdownHooksNow

### Threads.runOpenAFShutdownHooksNow()

Synchronously runs, in the current thread, every shutdown hook/action registered so far via addOpenAFShutdownHook (and Java-side registrations such as io.createTempDir's cleanup) - in the reverse order they were added. Each one is guarded to run at most once, so it is safe to call this and still let the normal JVM shutdown sequence run afterwards (e.g. via System.exit): already-run hooks will be skipped there. Intended to be used right before Threads.nativeExit.

Sources:

- src/openaf/plugins/Threads.java:211

<a id="api-threads-setrequestedexitcode-d78c5550"></a>

## Threads.setRequestedExitCode

### Threads.setRequestedExitCode(anExitCode)

Records anExitCode as the status the process is about to exit with (to be called right before System.exit) so that, if armFastExitOnShutdown is armed, the fast exit preserves it instead of using the armed exit code.

Sources:

- src/openaf/plugins/Threads.java:302

<a id="api-threads-start-3b0cbeb4"></a>

## Threads.start

### Threads.start()

Start normally all threads added. Will wait for the end of execution of all threads. Note: it won't work if any of the other start&#42; or init&#42; methods has been used.

Sources:

- src/openaf/plugins/Threads.java:328

<a id="api-threads-startatfixedrate-6f5b8fa0"></a>

## Threads.startAtFixedRate

### Threads.startAtFixedRate(aTime)

Start all threads and restarts them at a fixed rate determined by aTime (in ms) independently of the time when the thread execution ends. Execution will stop upon Threads.stop.  Note: it won't work if any of the other start&#42; or init&#42; methods has been used.

Sources:

- src/openaf/plugins/Threads.java:361

<a id="api-threads-startnowait-a1beeeef"></a>

## Threads.startNoWait

### Threads.startNoWait()

Start normally all threads added. Will not wait for the end of the execution of all threads. See Threads.waitForThreads for waiting for the execution of threads when needed or, in alternative, to Threads.start. Note: it won't work if any of the other start&#42; or init&#42; methods has been used.

Sources:

- src/openaf/plugins/Threads.java:343

<a id="api-threads-startwithfixedrate-a9144077"></a>

## Threads.startWithFixedRate

### Threads.startWithFixedRate(aTime)

Start all threads and restarts them at a fixed rate determined by aTime (in ms) starting on the time when the thread execution ends. Execution will stop upon Threads.stop. Note: it won't work if any of the other start&#42; or init&#42; methods has been used.

Sources:

- src/openaf/plugins/Threads.java:379

<a id="api-threads-stop-8645179d"></a>

## Threads.stop

### Threads.stop(shouldForce)

Stop all thread execution. If all threads need to be stopped immediately without waiting for the end of thread execution then used shouldForce = true.

Sources:

- src/openaf/plugins/Threads.java:593

<a id="api-threads-sync-45b8ee43"></a>

## Threads.sync

### Threads.sync(aFunction)

Try to execute the aFunction in a synchronized method. Useful in parallel processing to safely access variables/resources shared between threads.

Sources:

- src/openaf/plugins/Threads.java:625

<a id="api-threads-waitforthreads-b686fb34"></a>

## Threads.waitForThreads

### Threads.waitForThreads(aTimeout) : boolean

Waits for all threads to finish during aTimeout period (in ms). Returns true if all threads stopped or false otherwise.

Sources:

- src/openaf/plugins/Threads.java:610

