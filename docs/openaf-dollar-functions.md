# Additional OpenAF `$` Functions

[Index](./index.md) | [Core reference](./openaf.md) | [Advanced guide](./openaf-advanced.md)

This reference fills gaps in the guides for public functions and aliases defined in `js/openaf.js` whose names start with `$`. Signatures below use `...` for positional arguments; timeout and TTL values are in milliseconds unless stated otherwise. Helpers load their supporting libraries automatically where needed.

## Existing references

The following helpers already have documentation elsewhere under `docs/`:

| Functions | Reference |
| --- | --- |
| `$$`, `$from`, `$path`, `$tb`, `$sh`, `$ftp`, `$ch` | [Core reference](./openaf.md) |
| `$do`, `$doV`, `$doAll`, `$doFirst` | [Asynchronous oPromise helpers](./openaf.md) (see the `$do / $doV` section) |
| `$pyStart`, `$py`, `$pyExec`, `$pyStop` | [Python shortcuts](./python.md) |
| `$mcp` | [MCP client](./openaf-advanced.md#20-mcp-client-mcp) and [OAuth](./mcp-oauth.md) |
| `$rest`, `$csv` | [LLM guide](./llm-guide.md) (REST API calls and CSV examples) |
| `$job`, `$llm`, `$set`, `$get`, `$unset` | [oJob reference](./ojob.md) |
| `$sql` | [OpenAF Processor](./oafp.md) |

## Templates, formatting, and queries

### `$t(aTemplateString, someData)`

Alias for `templify`: renders a Handlebars template and returns a string. If `someData` is omitted, the calling context (`this`) supplies the data. An undefined or empty template returns an empty string. See the [template engine](./openaf.md#template-engine) for helpers and syntax.

```javascript
$t("Hello {{name}}", { name: "Ana" }); // "Hello Ana"
```

### `$f(aString, ...)` and `$ft(aString, ...)`

Return a string formatted with Java's `java.util.Formatter` syntax: `%[argument_index$][flags][width][.precision]conversion`. Both convert JavaScript dates to Java calendars for date/time conversions. `$f` passes numeric arguments through Rhino's Java conversion; `$ft` explicitly converts integral numbers to Java integer/long values, which is useful for `%d`. The optional `__$f.locale` setting selects the formatter locale; otherwise Java's default locale applies.

```javascript
$f("Hello %s", "Ana");       // "Hello Ana"
$ft("count=%04d", 12);       // "count=0012"
$f("Time: %tT", new Date());
```

### `$$from(a)`

Loads the bundled JLinq library and returns a JLinq query for an array. For a map, it first creates an array of single-key maps, one per property. This is the JLinq helper; `$from` uses nLinq and has a separate API. In the console, `desc $$from([])` lists available methods.

### `$stream(a)`

Loads the bundled Stream.js library. With an argument, returns `Stream(a)` for fluent stream processing; without an argument, returns the `Stream` constructor for static operations.

```javascript
var doubled = $stream([1, 2, 3]).map(v => v * 2).toArray();
// [2, 4, 6]
```

## Maps, arrays, and named arguments

### `$m2a(aDef, aMap)` and `$a2m(aDef, aArray)`

`$m2a` orders map values using the keys in `aDef`. Missing/undefined values leave unassigned positions; the array can be shorter than `aDef` when trailing keys are missing. `$a2m` assigns array values to the corresponding keys in `aDef`; missing array entries produce undefined values. Invalid/omitted definitions and inputs default to empty arrays/maps.

```javascript
$m2a(["c", "b", "a"], { a: 1, b: 2, c: 3 }); // [3, 2, 1]
$a2m(["a", "b", "c"], [1, 2, 3]);            // { a: 1, b: 2, c: 3 }
```

### `$a4m(anArray, aKey, dontRemove)` and `$m4a(aMap, aKey)`

`$a4m` converts an array of maps into a map of maps, using each row's `aKey` value as its map key. Without a key, or when a row has no key value, it uses names such as `row0` and `row1`. Rows are cloned, and by default the key field is removed from the output rows; pass `true` as the third argument (`dontRemove`) to retain it. `$m4a` converts a map of maps into an array and optionally adds each map key as a field named `aKey`.

```javascript
var keyed = $a4m([{ id: "A", value: 1 }], "id", true);
// { A: { id: "A", value: 1 } }
$m4a({ A: { value: 1 } }, "id"); // [{ value: 1, id: "A" }]
```

### `$fnDef4Help(aFnName)`

Searches OpenAF's help database for a function and extracts argument names from the first matching signature. Strips a leading `global.` or `this.` and caches successful lookups. Returns an empty array if no help entry matches. Load the relevant plugin/library before looking up its functions.

### `$fnM2A(aFn, aInst, aDef, aMap)`

Calls `aFn.apply(aInst, $m2a(aDef, aMap))` and returns the function's result. Use an explicit ordered argument definition to call a function with a map of named arguments. `aInst` supplies the receiver, or defaults to `null`.

```javascript
var calculator = { add: function(a, b) { return a + b; } };
$fnM2A(calculator.add, calculator, ["a", "b"], { b: 3, a: 2 }); // 5
```

### `$fnM(aFnName, aMap)`

Resolves a dotted function name such as `"h.get"`, obtains its argument names from help, and invokes it through `$fnM2A`. The instance must be accessible to the runtime's name evaluation. This relies on available help signatures; use `$fnM2A` with an explicit definition when the help entry is missing or ambiguous.

## Channels, caching, and concurrency limits

### `$channels(aChannel)`

The full-name equivalent of `$ch`: both names refer to the same function. Returns a wrapper around `ow.ch` for the named channel; `$channels().list()` lists channels. It supports creation/destruction, keyed reads/writes, subscriptions, queue operations, persistence, and remote exposure. See [the core channel reference](./openaf.md#ch-shortcut).

### `$cache(aName)`

Returns a cache configuration shared by name within the OpenAF process. Configure it before `.create()` or the first `.get(key)`, which creates the cache channel automatically. The default loader is `key => key`.

| Method | Behavior |
| --- | --- |
| `.fn(loader)` | Computes a value from a cache key. |
| `.ttl(ms)` | Sets the validity period for cached values. |
| `.maxSize(count)` | Sets the maximum number of cached entries. |
| `.byPopularity()` | Prefers keeping popular entries when the cache is full. |
| `.byDefault(true, value)` | Uses a default value while loading in the background. |
| `.byDefault(false)` | Tries the previous value; waits for the loader if none is available. |
| `.ch(name)` | Uses an existing backing channel. |
| `.inFile(path)` | Creates an `mvs` backing channel; use instead of `.ch()`. |
| `.create()` | Creates the cache channel and returns the wrapper. |
| `.get(key)`, `.set(key, value)`, `.unset(key)` | Reads, overrides, or invalidates an entry. |
| `.setAll(keys, values)` | Bulk write using the channel's key-field/value-array convention. |
| `.size()`, `.getAll()`, `.getKeys()` | Inspects cached entries. |
| `.destroy()` | Destroys the cache and its configured backing channel and removes the named configuration. |

```javascript
var cache = $cache("squares").ttl(30000).fn(k => ({ value: k.n * k.n })).create();
try {
  cache.get({ n: 4 }); // { value: 16 }
} finally {
  cache.destroy();
}
```

### `$bottleneck(aName, aFn)`

Returns a named wrapper that limits concurrent calls to `aFn`; `.exec(...)` invokes it synchronously and returns its result. Reusing the name retrieves the same wrapper; providing a new function updates it. `.maxExec(count)` sets the concurrency threshold, `.maxWait(ms)` sets how long a waiting call delays before proceeding, and `.destroy()` removes the named definition. The default concurrency is based on OpenAF's core count and thread-pool factor.

A positive `.maxWait()` is a waiting limit, after which execution proceeds even if the concurrency threshold is still reached; it is not a timeout on the function itself.

```javascript
var limited = $bottleneck("multiply", (a, b) => a * b).maxExec(3).maxWait(5000);
limited.exec(2, 4); // 8
limited.destroy();
```

## Synchronization and queues

### `$atomic(aInit, aType)`

Wraps a Java atomic value. Defaults to initial value `0` and type `"long"`; supported types are `"int"`, `"long"`, and `"boolean"` (supply a boolean initial value for the latter).

All types provide `.get()`, `.set(value)`, `.getSet(value)` (returns the previous value), `.setIf(expected, value)` (compare-and-set, returns success), and `.getObj()` (underlying Java object). Numeric types also provide `.inc()`/`.dec()` (return the new value) and `.getAdd(delta)` (returns the previous value).

```javascript
var count = $atomic(0, "long");
count.inc();         // 1
count.getAdd(4);     // 1; stored value becomes 5
count.setIf(5, 10);  // true
```

### `$sync()`

Creates an independent reentrant lock with `.run(aFn)`. Calls using the same returned object execute one at a time; separate `$sync()` objects have separate locks. `.run()` blocks while acquiring the lock, releases it in `finally`, propagates exceptions, and does not return the callback's value.

```javascript
var guard = $sync();
var rows = [];
guard.run(() => { rows.push({ value: 1 }); });
```

### `$lock(aName)`

Returns a process-local named Java reentrant lock. `.lock()` waits interruptibly; `.unlock()` releases it. `.tryLock(aFn, aTimeoutMS)` acquires the lock immediately, or waits up to the supplied timeout, executes the callback only when acquired, and releases it automatically. It returns `true` when the callback runs and `false` when acquisition fails; callback exceptions propagate. `.isLocked()` reports whether held, `.getObject()` exposes the Java lock, and `.destroy()` removes the named reference. Destroy only after users have finished with the lock.

```javascript
var lock = $lock("update-record");
lock.lock();
try {
  // Update shared state.
} finally {
  lock.unlock();
}
lock.destroy();
```

### `$flock(aLockFile, aTimeout, aWaitPerCall)`

Creates/reuses a file-backed lock for coordination across processes. Constructor defaults are `60000` for retrying file access and `2500` between attempts; these values do not bound `.lock()`, which waits for the filesystem lock.

`.lock()` returns success as a boolean. `.unlock()` releases the local lock when its acquisition count reaches zero. `.tryLock(aFn)` runs the callback only if it can acquire the file lock immediately, releases it afterward, and returns success. `.isLocalLocked()` checks this process's lock; `.isLocked()` probes filesystem availability. `.getObject()` exposes the random-access file, `.getMainObject()` exposes local bookkeeping, and `.destroy()` releases/closes resources and removes the local reference. The lock file itself is not deleted.

```javascript
var fileLock = $flock("/tmp/openaf-example.lock");
try {
  var ran = fileLock.tryLock(() => {
    // Work while holding the filesystem lock.
  });
} finally {
  fileLock.destroy();
}
```

### `$await(aName)`

Wraps Java monitor wait/notify for a shared name. `.wait(timeout)` blocks until notified or until the optional timeout expires. `.notify()` wakes one waiter; `.notifyAll()` wakes all current waiters. `.destroy()` notifies all and removes the named monitor. Notifications are not queued: coordinate startup and recheck your condition after waking. Finish using the monitor before destroying it.

### `$queue(anArray)`

Wraps a thread-safe `ConcurrentLinkedQueue`, optionally populated with `anArray`. `.add(item)`, `.remove(item)`, `.addAll(items)`, and `.has(item)` return booleans. `.isEmpty()`, `.size()`, and `.toArray()` inspect the queue. `.peek()` reads the head; `.poll()` removes and returns it. Empty reads return `null`. Null items are not supported by the underlying queue.

```javascript
var queue = $queue(["first", "second"]);
queue.add("third");
queue.poll();    // "first"
queue.toArray(); // ["second", "third"]
```

## Retry and asynchronous coordination

### `$throwIfUnDef(aFunc)`

Returns a zero-argument function that calls `aFunc`, returns its result, and throws `"undefined"` if the result is undefined. Useful for adapting polling functions to `$retry`; it does not forward arguments to `aFunc`.

### `$retry(aFunc, aNumTries)`

Calls `aFunc` and returns its first successful result. A numeric second argument is the total attempt count (default `1`). Alternatively, provide a callback receiving each exception: return `true` to retry or `false` to stop. Retries have no built-in delay. If all attempts fail, the helper **returns the last exception**, rather than throwing it.

```javascript
var attempts = 0;
var result = $retry($throwIfUnDef(() => {
  attempts++;
  return attempts >= 3 ? "ready" : undefined;
}), 3); // "ready"
```

### `$doWait(aPromise, aWaitTimeout)`

Blocks until an OpenAF `oPromise` fulfills or fails, and returns that same promise. An optional timeout is an overall waiting deadline. It does not return the resolved value or automatically cancel pending work when the deadline expires. Use `.then()`/`.catch()` to handle results; inspect the promise state and call `.cancel()` if timed-out work should be interrupted. See [the core reference](./openaf.md) for `$do`, `$doV`, `$doAll`, and `$doFirst`.

```javascript
var pending = $do(() => 2 + 3).then(value => { print(value); });
$doWait(pending);
```

### `$doA2B(aAFn, aBFn, noc, defaultTimeout, aErrorFunction, useVirtualThreads)`

Calls producer `aAFn(send)`; each `send(value)` dispatches `aBFn(value)` asynchronously, applying backpressure at the `noc` concurrency limit (default: core count). Waits for dispatched work before returning; it does not collect callback results. `defaultTimeout` defaults to `2500` and is the monitor-wait interval, not a task deadline. Pass an error handler `(exception, value)` for consumer failures. `true` as the sixth argument (`useVirtualThreads`) selects `$doV`; otherwise it uses `$do`.

```javascript
$doA2B(
  send => { [1, 2, 3].forEach(value => { send(value); }); },
  value => { print(value * 2); },
  2, 2500,
  (error, value) => { logErr("Failed for " + value + ": " + error); },
  false
);
```

## Network and process helpers

### `$jsonrpc(aOptions)`

Creates a JSON-RPC 2.0 client for a child process or HTTP endpoint.

| Option | Meaning / default |
| --- | --- |
| `type` | `"stdio"` (default), `"remote"`/`"http"`, `"sse"`, or `"dummy"`. A URL without a command selects remote/SSE automatically. |
| `cmd` | Child command for stdio, in a string/map/array form accepted by `$sh`. |
| `url` | Remote endpoint. |
| `timeout` | Operation timeout, default `60000`. |
| `pwd` | Child working directory; otherwise uses `JSONRPC.cmd.defaultDir` if set. |
| `envs` | Child environment overrides, merged with the parent environment by default. |
| `envsOnly` | `true` uses only `envs`; default `false`. |
| `options` | Additional `$rest` options for remote requests. |
| `sse` | Expect JSON-RPC messages in SSE `data:` events; default `false`. |
| `debug` | Print protocol messages; default `false`. |
| `shared` | Share connections for identical configurations; default `false`. |

The returned client supports `.type(type)`, `.url(url)`, `.sh(cmd)`, `.pwd(path)`, `.envs(map)`, `.exec(method, params, notification)`, and `.destroy()`. Method calls return the result directly; notifications (`notification: true`) expect no response and return undefined. Always destroy clients when finished.

```javascript
var client = $jsonrpc({ type: "remote", url: "http://localhost:8080/rpc" });
try {
  var result = client.exec("sum", { values: [1, 2] });
  client.exec("logEvent", { message: "done" }, true);
} finally {
  client.destroy();
}
```

### `$fetch(aURL, aOptions)`

Returns an OpenAF `oPromise` for an HTTP response wrapper. Omitting options defaults to `{ method: "GET" }`; when supplying an options map, include `method`. Supported methods are GET, POST, PUT, DELETE, PATCH, and HEAD. Supply request headers through `requestHeaders` and request content through `body`; other options are passed to `$rest`.

The response has `status`, `ok` (status 200–299), `headers`, and body readers `.json()`, `.text()`, `.bytes()`, and `.blob()` (the latter two return Java byte arrays). In this implementation `.body()` also consumes and returns text. Consume the stream once: a reader closes the stream and HTTP client. Call `.close()` if you do not consume it. The exposed `bodyUsed` property is initialized to `false` and does not track subsequent reads. This is an OpenAF wrapper with a partial Response API.

```javascript
var request = $fetch("http://localhost:8080/data", { method: "GET" })
  .then(response => {
    try {
      print(response.text());
    } finally {
      response.close();
    }
  })
  .catch(error => { logErr(String(error)); });
$doWait(request);
```

### `$ssh(aMap)`

Creates a fluent SSH client from a map (`host`, `port`, `login`, `pass`, `id` for a key-file path, `key` for inline key content, `compress`, `timeout`), an SSH URL, or an existing `SSH` plugin instance. Map defaults are port `22` and compression `false`. See [the SSH plugin](./plugins/SSH.md) for connection details.

`.sh(command, stdin)` queues commands; `.get(index)` executes them and captures `{ stdout, stderr, exitcode }`, returning the indexed result or the result array. `.getJson(index)` parses captured JSON output; `.exec(index)` executes with inherited output. Other methods include `.timeout(ms)`, `.pty(flag)`, `.cb(callback)`, `.prefix(prefix, template)`, `.exit(callback)`, file operations `.getFile(source, target)`/`.putFile(source, target)`, `.listFiles(path)`, `.mkdir(path)`, `.rename(source, target)`, `.rm(path)`, `.rmdir(path)`, and tunnel creation/deletion helpers. `.close()` releases the connection and any temporary inline-key file.

```javascript
var remote = $ssh({ host: "server.example", login: "user", id: "/path/to/key" });
try {
  var result = remote.sh("hostname").get(0);
  print(result.stdout);
} finally {
  remote.close();
}
```

### `$openaf(aScript, aPMIn, aOpenAF, extraJavaParamsArray)`

Runs an OpenAF script in a child process with `__pm` initialized from `aPMIn` (default `{}`), then returns the child's final `__pm` decoded from JSON. By default it uses the current Java executable and OpenAF JAR. `aOpenAF` can be a JAR path/command string or a command array; use an array for explicit launcher arguments. The helper appends its own script-input arguments to that array, so pass a fresh array if it will be reused elsewhere.

The implementation accepts `extraJavaParamsArray`, but the automatically selected launcher is built before those parameters are considered. To provide JVM options explicitly, include them before `-jar` in `aOpenAF`.

```javascript
// worker.js: __pm.total = __pm.a + __pm.b;
var result = $openaf("worker.js", { a: 2, b: 3 });
// { a: 2, b: 3, total: 5 }
```

## Output and diagnostics

### `$output(aObj, args, aFunc, shouldReturn)` and `$o(...)`

`$o` is an alias for `$output`. Formats/prints an object according to `args.__format` (or `args.__FORMAT`), falling back to `global.__format` and then `"human"`. Common formats include `json`, `prettyjson`, `slon`, `ndjson`, `xml`, `yaml`, `table`, `stable`, `ctable`, `btable`, `tree`, `ctree`, `ntree`, `html`, `text`, `md`, `map`, `jsmap`, `csv`, and `human`.

Use `true` as the fourth argument (`shouldReturn`) to return rendered text instead of printing for rendering formats. Human/default rendering uses `aFunc` when supplied; prefer an explicit format when requesting a string. `args.__path`, `args.__from`, and `args.__sql` optionally transform data first, and `args.__csv` configures CSV output. Markdown maps/arrays accept `args.mdformat` as `"structured"` (default), `"json"`, or `"yaml"`.

`btable` renders columns separated by two spaces, with heavy Unicode rules (`━`) under headings. It uses terminal-aware colors, alternating record banding, and a row-count footer. Rules remain Unicode when ANSI colors are unavailable. Set `__rowsep: true` to add light rules (`─`) between complete records; separators are disabled by default and never split wrapped continuation lines or follow the last record. `__width` sets a positive integer wrapping width (numeric strings are accepted); otherwise the available terminal width is used, or no width limit if there is no terminal. Uppercase aliases `__ROWSEP` and `__WIDTH` are accepted; lowercase options take precedence. `__rowsep` also accepts boolean strings.

```javascript
$output(rows, { __format: "btable", __rowsep: true, __width: 130 });
var text = $output(rows, { __format: "btable", __width: "130" }, undefined, true);
```

The `res`, `key`, `args`, `pm`, and `set_<name>` formats route values into oJob arguments, `__pm`, or `$set` storage rather than returning formatted text. See the [oJob reference](./ojob.md) for output conventions.

```javascript
var text = $output({ count: 3 }, { __format: "json" }, undefined, true);
// '{"count":3}'
$o([{ name: "Ana", count: 3 }], { __format: "table" });
```

### `$err(exception, rethrow, returnStr, code)`

Prints a formatted exception diagnostic. With `OAF_ERRSTACK` enabled, it includes available stack/source context; `code` can supply source text, while an existing exception source file may be read automatically. `returnStr: true` returns the diagnostic string instead of printing. Otherwise `rethrow: true` throws the exception after printing. Returning a string exits before the rethrow step, so do not combine both flags expecting a throw.

```javascript
try {
  throw new Error("Example failure");
} catch (error) {
  var diagnostic = $err(error, false, true);
  print(diagnostic);
}
```
