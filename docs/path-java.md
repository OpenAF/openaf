# Java `$path()` engine

`$path(obj, expression, customFunctions)` uses a Java port of OpenAF's bundled
JMESPath engine by default. Its parser, evaluator, and standard functions operate
directly on Rhino values. OpenAF extensions and custom `_func` callbacks continue
to execute JavaScript in the active context.

```javascript
$path({ items: [{ score: 70 }, { score: 20 }] }, 'items[?score >= `50`]');

// Explicit rollback for subsequent calls:
__flags.ALTERNATIVES.path = false;
// Restore the Java default:
__flags.ALTERNATIVES.path = true;
```

Backend selection happens before evaluation. Errors propagate without retrying
through the other backend, so callbacks with side effects execute only once.
The bundled `jmespath` JS library, its exports and browser asset remain available.
`$path()` without an input still returns its existing numeric type constants.
`PATH_CFN`, function overrides, nested `path()`/`opath()` and `PATH_SAFE` retain
existing behavior.

`af.pathJava(obj, expression, customFunctions)` calls the Java engine directly.
Like `jmespath.search()`, it includes standard JMESPath functions; use `$path()`
for OpenAF's extension registration and argument normalization.

## Syntax caching

```javascript
__flags.PATH_CACHE_SIZE = 256; // Default maximum entries
__flags.PATH_CACHE_SIZE = 0;   // Disable and clear on the next Java call
```

The FIFO cache belongs to the Rhino top-level scope. It stores immutable syntax,
not query results, inputs, scopes or callback bindings. Concurrent cache access
is synchronized; each evaluation has its own state. Object/array literals retain
identity within an evaluation but are fresh across calls.

Queries longer than 16,384 characters or containing more than 4,096 AST nodes
execute uncached. Aggregate admission budgets are 262,144 expression characters
and 65,536 AST nodes, in addition to the configured entry limit. These are cache
budgets, not query execution limits or exact heap-byte estimates. Parse failures
are never cached. Changing function implementations or flags requires no cache
invalidation because function dispatch uses the current invocation.

## Compatibility and validation

The bundled JS implementation is the differential reference. The Java port
preserves existing behavior, including sparse-array handling, undefined/null
distinctions, reference identity, callback signatures/receivers and legacy
function quirks such as lexicographic `sort()` of numeric arrays. Error names and
messages are preserved; stack locations differ between implementations.

Run the focused suite against the rebuilt JAR from `tests`:

```sh
java -jar ../openaf.jar --ojob -e autoTestAll.Path.yaml
```

For direct execution of every focused test (with a visible completion marker):

```sh
java -jar openaf.jar -c 'ow.loadTest(); var t=require("./tests/autoTestAll.Path.js"); Object.keys(t).forEach(k=>t[k]()); print("Path tests passed");'
```

The test suite compares value graphs, native JS types, reference relationships,
mutation traces and errors, including nested/custom functions and concurrent
calls. The full automatic suite includes these tests.

The end-to-end benchmark needs no external library downloads:

```sh
java -jar openaf.jar -f tests/benchmarks/jmespath/native.js
```

It compares complete `$path()` calls using JS, cached Java and uncached Java,
including callbacks, nested calls and unique-query churn. See the benchmark
README and saved native-run results for measured timings. Earlier Jackson
benchmarks used a different implementation and must not be treated as timings
for this port.

Validation of the rebuilt artifact: 603 focused assertions pass on Java 21 and
Java 27. The complete intended suite passes 388/388 tests (6,011 assertions)
with a test-only in-memory correction for an existing misplaced Format job
definition and the local `_oaf/oJob-common` dependency path. The original
Format test definition was left unchanged.
