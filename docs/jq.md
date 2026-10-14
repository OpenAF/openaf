# Query JSON with `$jq`

`$jq(input, expression, options)` evaluates jq syntax alongside `$from` (nLinq)
and `$path` (JMESPath). It runs inside the JVM using jackson-jq 1.6.5 in **jq 1.6
compatibility mode**. No jq executable, Node.js, or WebAssembly runtime is needed.

```javascript
$jq({a:2}, '.a');                          // 2
$jq([1,2,3], 'map(. * 2)');                // [2,4,6]
$jq([1,2,3], '.[] | select(. > 1)');       // [2,3]
$jq([1,3], 'map(select(. > $min))', {
  vars: {min:2}
});                                        // [3]
$jq({a:2});                                // {a:2} (expression defaults to ".")
```

## Outputs and variables

jq produces a stream of zero, one, or more JSON values. By default `$jq` unwraps
one output and returns an array for multiple outputs. Zero outputs return
JavaScript `undefined`. A jq `null` result remains `null`.

Use `{all:true}` when the number of emissions matters:

| Expression on `{}` | Default result | `{all:true}` result |
| --- | --- | --- |
| `empty` | `undefined` | `[]` |
| `null` | `null` | `[null]` |
| `[]` | `[]` | `[[]]` |
| `1, 2` | `[1,2]` | `[1,2]` |
| `[1,2]` | `[1,2]` | `[[1,2]]` |

An input array is **one input value**. Use `.[]` to iterate it. All emissions are
collected in memory; this API is not an iterator or a streaming JSON parser.

`options.vars` binds JSON values without textual interpolation. Names omit the
leading `$` and must match `[A-Za-z_][A-Za-z0-9_]*`. Each call has a fresh variable
scope. jq's own `as`, `def`, `reduce`, and `foreach` syntax is also available.

## Value boundary and errors

Inputs and variable values may contain plain objects (including null-prototype
objects), dense arrays, strings, finite JavaScript numbers, booleans, and `null`.
Objects contribute their own enumerable string properties; arrays contribute
their indexed elements. Repeated references are copied independently.

Undefined values, sparse arrays, cycles, dates, functions, regular expressions,
boxed primitives, custom-prototype objects, and wrapped Java objects are rejected.
Convert such values explicitly before querying. Nesting deeper than 512 is
rejected. Conversion does not call `toJSON` or serialize through JSON text.

Results are detached ordinary JavaScript values. jq assignment/update expressions
produce new values without mutating the caller's input. Numeric results use
JavaScript double precision; integers beyond the safe integer range can lose
precision. Non-finite jq numeric outputs become `null`, as in JSON output.

Errors are JavaScript `Error` objects with these names:

- `JqInputError`: invalid arguments or a non-JSON input, with its location.
- `JqCompileError`: an invalid expression reported by the jq compiler.
- `JqError`: evaluation, result conversion, or stack-depth failure.

An error throws even if the query emitted values before failing; no partial result
is returned. jq `try ... catch` and `?` retain their jq semantics.

## Compatibility and implementation

The engine reuses [jackson-jq](https://github.com/eiiches/jackson-jq/tree/develop/1.x),
with Joni 2.2.6 and JCodings 1.0.63 for regex. OpenAF converts directly between
Rhino values and its existing Jackson JSON trees. `$from` and `$path` remain
independent: their ordering, truthiness, and query syntax differ from jq.

Broad jq support is provided by the library, rather than a new OpenAF parser.
This is not a promise of complete jq CLI or language equivalence. Filesystem
module loading, CLI input streams/options, JavaScript callbacks, OpenAF helper
functions, and oafp jq options are outside this API.

The deterministic corpus is in `tests/jq/cases.json`. Validate it against native
jq **1.6** from `tests/`:

```sh
JQ_REFERENCE=/path/to/jq-1.6 java -jar ../openaf.jar -f jq/differential.js
```

Compatibility results and measured performance are recorded in
[the benchmark notes](../tests/benchmarks/jq/README.md).

## Caching

`__flags.JQ_CACHE_SIZE` defaults to 256 compiled expressions per OpenAF engine.
Set it to zero to clear and disable caching on the next call. Lowering it evicts
old entries on the next call. Only successfully compiled expressions are cached;
inputs, variables, outputs, and per-call scopes are never cached.

The FIFO cache retains at most 262,144 expression characters and skips individual
expressions longer than 16,384 characters. Oversized expressions still execute.
The character budget bounds retained source text, not exact compiled heap size.
Built-ins initialize lazily once per classloader and use a read-only root scope.
