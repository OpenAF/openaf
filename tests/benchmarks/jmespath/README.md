# JMESPath cache assessment and comparison

The initial sections record the pre-implementation assessment. The final section
documents the implemented Java port and its validation.

Run from the repository root:

```sh
sh tests/benchmarks/jmespath/run.sh
```

Requires a JDK, the existing `openaf.jar`, and Maven Central access on first run.
Dependencies are stored in `/tmp/openaf-jmes-bench`, not added to OpenAF.
The script uses JMESPath Java 0.6.0 with its Jackson adapter, Jackson core/databind
2.22.2 and annotations 2.22. Results are written to
`/tmp/openaf-jmes-bench/results.json`. The checked-in JSON files preserve the
assessment runs, including all five timing samples per mode.

## Cache assessment

`js/jmespath.js` exposes `compile()` but `search()` constructs a parser and parses
on every call. Its interpreter and runtime are private, so the existing public
`compile()` alone does not provide an evaluate-compiled-query API.

A useful implementation would cache the AST inside the library, keyed by the
exact expression string. Keep a fresh Runtime/TreeInterpreter for each call:
functions can change between calls, and `$path()` builds functions (including
`opath`) that capture the current input. Caching those closures risks stale input
and retains potentially large objects. Do not cache results.

Use a bounded cache scoped to the JS engine/context, with an explicit clear
operation. A starting point to measure is 256 expressions, an expression-length
limit, and a total size/node budget; an entry limit alone does not bound retained
memory. Bypass oversized expressions. Cache only successful parses. Start with
FIFO for low overhead; assess LRU only if real workloads show churn. The benchmark
prototype uses 256-entry FIFO but does not implement production size budgets.

Two AST mutability details matter:

* `ExpressionReference` tags its child node with `jmespathType`. It writes the same
  tag during evaluation; avoid assuming ASTs are fully immutable or sharing them
  across independently executing engines without reviewing this behavior.
* `Literal` returns `node.value` directly. With cached ASTs, modifying an object or
  array result (or passing it to a mutating custom function) can corrupt future
  evaluations. The harness reproduces this failure. Its safe variant clones
  object/array literals on evaluation, preserving the fresh-parse behavior.
  Production code should use a purpose-built JSON-value clone and test nested
  literals, reentrancy, custom-function mutation, and returned-value mutation.

The benchmark injects an experimental cache into a source copy using `eval()`;
no runtime source or JAR is changed. It keeps fresh runtimes and protects literals.
The source replacements are deliberately specific to this checkout.

Before shipping, add focused regression coverage for all AST node types, literal
isolation, exprefs, changing custom functions/current inputs, nested `$path()`
calls, invalid queries, eviction, cache clear/disable, and engine concurrency.
Benchmark unique-query misses and mixed-hit workloads too. This assessment does
not establish that enabling caching by default is the right policy.

## Measurement design

All timed JS modes execute inside OpenAF, not Node/V8. Java modes run in the same
JVM through a helper. Inputs contain deterministic `{name, score}` rows, with
`score = (index * 37) % 100`. Queries and output equality checks are in `bench.js`.

Each mode gets a warmup batch followed by five measured batches. JS mode order
alternates forward/reverse between rounds. Reported numbers are medians in
milliseconds per operation. Java-only cached batches use five times the fixture
iteration count because operations are short. Input creation and initial Java
parsing are outside timing except in the conversion mode.

* `js`: current library `search()`, including parsing and runtime creation.
* `jsCached`: safe AST cache hit, including fresh runtime creation.
* `path` / `pathCached`: complete `$path()` calls, including custom-function setup.
* `javaCached`: Java-only loop, reused compiled expression and Jackson input.
* `javaCompile`: Java-only loop, expression compiled on every call, reused input.
* `javaBridge`: compiled Java query and reused input, called once per JS iteration.
* `javaConvert`: JS stringify, Jackson parse, compiled Java evaluation, result
  stringify, and JS parse on every call.

The JS library is loaded from this checkout. The `$path()` wrapper comes from the
existing built JAR. Results depend on that JAR, JVM, hardware and warmup; this is a
small diagnostic benchmark, not JMH or a guarantee for arbitrary queries.
Conversion uses a JSON round trip and therefore only tests JSON-compatible data,
not preservation of object identity, dates, Java objects, or all number semantics.
Java modes test standard functions, not OpenAF's custom-function compatibility.
For the initial assessment, the source/JAR was not rebuilt and the full suite
was not run; that stage added only an isolated benchmark and assessment.

Java adapter/compiled-expression documentation:
https://github.com/burtcorp/jmespath-java#basic-usage
The upstream repository is archived, which matters for a production adoption
decision independently of these timing results.

## Results

Measured on arm64, JDK 27. Values below are milliseconds per operation from run 1.

| Query | JS | Cached JS | $path | Cached $path | Java reused | Java compile/call | Java with conversion |
|---|---:|---:|---:|---:|---:|---:|---:|
| lookup | 0.038198 | 0.016723 | 0.648877 | 0.630334 | 0.000047 | 0.001730 | 0.005919 |
| filter-100 | 0.364551 | 0.332609 | 0.979552 | 0.947562 | 0.004030 | 0.007659 | 0.060392 |
| filter-10000 | 30.944404 | 32.271163 | 31.798617 | 32.817767 | 0.431568 | 0.447558 | 5.462938 |
| sort-1000 | 21.061071 | 21.386368 | 22.240740 | 22.715838 | 0.155079 | 0.168751 | 0.655915 |

On this run, AST caching reduced the raw lookup from about 38 to 17 microseconds
(2.3x), but the full `$path()` lookup only changed from about 649 to 630
microseconds (3%). For the 100-row filter, the raw library improved by about 9%
and `$path()` by about 3%. The 10,000-row filter and 1,000-row sort showed no
benefit; small regressions should not be interpreted as a reliable cache penalty
without a more controlled benchmark. Parsing is a small fraction of those costs.

Java's traversal advantage was much larger than the cache gain. Including the
JSON round trip, the tested queries still ran faster than the JS library. This
makes an optional Java backend worth prototyping for large, JSON-only workloads,
but does not justify replacing `$path()` without extension and semantic parity.

Recommendation: treat AST caching as a modest, compatibility-sensitive optimization.
For `$path()` small-query performance, separately profile custom-function table
construction; safely reusing input-independent descriptors may offer more benefit,
while per-call closures must stay fresh. For large inputs, investigate the Java
backend with end-to-end representative workloads, rather than expecting caching
to solve traversal cost.

A second fresh-JVM run (`results-run2.json`) reproduced the pattern: lookup
38.31 -> 16.76 microseconds in the raw JS library, but 645.53 -> 623.73
microseconds through `$path()` (3.4%). Its 10,000-row filter was 31.72 ms raw JS,
32.93 ms cached JS, 0.43 ms Java with reused input, and 4.93 ms Java including
conversion. Sorting 1,000 rows took 21.84 ms raw JS and 0.62 ms Java including
conversion. These two processes support the direction of the finding; they do
not provide statistical confidence intervals.

## Feasibility of a Java-backed `$path()`

**Feasible as an opt-in backend; not a drop-in dependency substitution.**

The installed Rhino `NativeObject` implements `Map`, and `NativeArray` implements
`List`. A small additional probe passes actual JS objects directly to Java's
`JcfRuntime` without serialization:

```sh
# After run.sh has compiled the helper:
java -jar openaf.jar -f tests/benchmarks/jmespath/direct-probe.js
```

The saved `results-direct.json` shows matching lookup, filter, expression-reference
sorting, missing-property and explicit-undefined results. Selecting `@` returned
the same input object (`===`), showing that Java execution does not inherently
require losing identity. This is a feasibility check, not a timed native-adapter
benchmark. Upstream explicitly describes JCF as a development/testing adapter;
it is not the recommended production integration.

The same probe found real compatibility gaps:

* A sparse array selected with `items[*]` serialized as `[1,null,3]` with current
  JS behavior, but `[1,3]` through JCF. JSON serialization hides the JS
  undefined/hole distinction here, so deep behavioral tests are also needed.
* A concatenated JS string arrived as Rhino `ConsString`; JCF's type detection
  rejected it with `Unknown node type`. A Rhino adapter must normalize string
  representations and handle undefined, missing properties, holes, wrappers,
  numeric representations, and object/property access intentionally.

A credible implementation plan:

1. Implement a production `BaseRuntime<Object>`/adapter for Rhino values rather
   than round-tripping JSON. Construct native JS arrays/objects for generated
   results and preserve input references where existing `$path()` does so.
   Preserve JS return types and the no-input `$path()` type-constant API.
2. Bridge existing `_func` callbacks and `_signature` declarations into Java's
   function API. Use the current Rhino context/scope and pass the argument array
   in the existing shape. Expression references need explicit bridging because
   Java represents them as `Expression` objects, while JS uses tagged AST nodes.
   Respect user overrides, `PATH_CFN`, validation errors and side effects.
3. Keep execution state per invocation, including `_locals`, root input and the
   active custom-function map. Nested `path()`/`opath()` calls need a reentrant
   context stack with cleanup on exceptions; a single mutable global context is
   insufficient. Callbacks must execute on the appropriate Rhino thread/context.
4. Design compiled-expression caching together with the function bridge. Java's
   `FunctionCallNode` stores both its runtime and function implementation. A cache
   keyed only by query can therefore retain obsolete callback bindings. Either
   use stable dispatchers that resolve the active invocation's functions, or
   scope cached expressions to an immutable registry identity/version and ensure
   those registries do not capture per-call inputs. Recheck literal-result
   isolation on the Java side too.
5. Begin behind explicit backend selection with clear unsupported-query errors.
   Avoid silent retry after evaluation: custom functions may already have had
   side effects. Any fallback decision should happen before execution.
6. Run differential tests against current `$path()` across standard queries,
   OpenAF functions, user callbacks, nested calls, return types/identity, errors,
   literals and concurrency. Then benchmark the actual adapter and callback
   bridge on representative oafp/OpenAF workloads. Jackson measurements do not
   establish the speed of this unimplemented Rhino adapter.

The pure-Java work can remain fast while callbacks into JS still cost time;
queries dominated by OpenAF custom functions may gain much less than these
standard-query fixtures. The current full `$path()` function-table construction
would also remain overhead unless redesigned. Maintaining Java-native versions
of common pure functions can be considered after profiling, while JS callbacks
preserve extensibility.

Recommendation: prototype an opt-in Java-backed `$path()` with a Rhino adapter
and stable callback dispatch, retaining the existing JS backend as the default
until parity is demonstrated. The measured large-input advantage makes this a
more promising performance direction than AST caching alone. Dependency size,
license review and ownership of the archived upstream dependency should be part
of the production decision. At that assessment stage, no production backend
had been implemented.

## Java port: final end-to-end validation

The replacement uses a Java port of the existing engine, not the Burt/Jackson
implementation measured above. Run three fresh JVMs against a rebuilt JAR:

```sh
sh tests/benchmarks/jmespath/run-native.sh
```

No external dependencies are required. Set `PATH_BENCH_DIR` to choose an output
directory or `PATH_BENCH_JAVA` to choose a Java executable. The default output
directory is `/tmp/openaf-path-bench`. Saved `results-native-run{1,2,3}.json`
files identify the exact tested JAR by SHA-256 and include every timing sample.

These runs use JDK 27 on aarch64, five samples per mode after warmup, and no
concurrent suite/build activity. Each fixture's results agree across all modes.
The table reports the median of the three per-process medians, in ms/call.

| Query | JS $path | Java $path | Java without cache | Speedup |
|---|---:|---:|---:|---:|
| lookup | 0.6211 | 0.5779 | 0.5776 | 1.07x |
| filter-100 | 0.6863 | 0.5946 | 0.5944 | 1.15x |
| filter-10000 | 5.1190 | 1.4772 | 1.4473 | 3.47x |
| sort-1000 | 14.4975 | 1.4223 | 1.4435 | 10.19x |
| callback-100 | 1.1264 | 0.6645 | 0.6698 | 1.70x |
| nested | 1.6009 | 1.5550 | 1.5748 | 1.03x |
| unique-query-churn | 1.2778 | 0.5857 | 0.5772 | 2.18x |

Unlike the original raw-library JS experiment, these timings use the bundled
compiled JS implementation and complete `$path()` wrappers. Comparisons with
the earlier interpreted-source/Jackson figures are not direct speedup measures.

The port improves large traversals and standard-function sorting substantially.
Small/nested calls remain dominated by the unchanged extension-registration
work. Cached versus uncached Java timings are similar on these short expressions;
these samples do not establish a general cache speedup. Unique-query churn uses
identical per-mode query sequences, with new expressions on every call.

`coldMs` records the first timed call per fixture/mode in a shared JVM, with JS
measured first. It includes differing initialization/JIT states and is diagnostic,
not a fair comparison of independent application cold starts. These are small
benchmarks, not JMH confidence intervals or guarantees for other workloads.

Compatibility validation: 603 focused assertions pass on JDK 27 and a temporary
Temurin 21.0.12.1 runtime, including native types/identity, callback traces,
532 query cases, cache limits, concurrency, and prototype-independent literal
templates. The normal full-suite orchestrator is blocked by an existing Format
job definition placed under `todo`. A test-only in-memory registration lets the
entire intended test set run without changing that repository file.

The final rebuilt artifact passed the complete intended suite: 388/388 tests,
6,011 assertions, using that test-only registration correction and the local
`_oaf/oJob-common` dependency path. The unadjusted orchestrator remains blocked
by the existing Format definition; no unrelated test definition was edited.
