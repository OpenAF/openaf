# Testing with ow.test

`ow.loadTest()` retains the existing `test`, `testExternally`, `assert`, counters, timers, history and reporting entry points. New assertions, suites, async helpers, mocks and workflow testing load on first use. No external runner or LLM is required.

```javascript
ow.loadTest();
var tests = ow.test.createSession({ output: false });
tests.suite('UserService', function(t) {
  t.fixture('users', function(c) { return c.channel(); });
  t.beforeEach(function(c) { c.fixture('users').set('alice', {name: 'Alice'}); });
  t.test('creates user', function(c) {
    c.assertEqual(c.fixture('users').get('alice').name, 'Alice');
  });
});
var result = tests.run();
io.writeFileString('results.xml', tests.report.junit(result));
exit(result.exitCode);
```

## Compatibility and results

Legacy `test(name, fn, args)` passes `(setResult, args)` to the callback. A passing test returns the original value, including `undefined`. A failure records `FAIL` and returns `undefined`. Existing `assert` retains `compare()` semantics and string exceptions. Nested legacy failures continue to count independently. New `execute(name, fn, options)` passes an execution context and returns a detached result; a failed nested test fails its modern parent.

`test` accepts an optional fourth argument and `testExternally` an optional fourth argument with `failurePolicy: 'record' | 'throw' | 'failFast'`. The default is `record`. Throwing occurs after recording and cleanup. Fail-fast cancels later scheduling cooperatively; it cannot undo already-running work. `execute` and `run` accept the same policy. Suite runs report `exitCode` 0 (pass), 1 (test failure) or 2 (infrastructure/incomplete run). Call `exit(result.exitCode)` explicitly: OpenAF's script launcher can print an uncaught exception without returning a nonzero process exit code.

`getResults()` returns `{schemaVersion:1, sessionId, records, runs, infrastructureErrors, complete}`. Execution records have IDs, parent IDs, status, assertion count, duration in milliseconds, errors with phases, and an encoded return value. Suite runs contain logical tests with every attempt and a `flaky` flag. Statuses are `PASS`, `FAIL`, `ERROR`, `SKIP`, `TODO`, `TIMEOUT`, `CANCELLED`, `BLOCKED`. Legacy counters count started executions, including retries; suite summaries separately count logical cases, attempts and assertions. A started skipped execution is non-failing in legacy counters; declared skip/TODO cases are not started.

Histories and results are detached snapshots. Reading a report never converts live channel counters to numbers. The default channel remains `__owTest::tests`; session channels are private and created on demand. Channel entries preserve atomic hit/pass/fail counters. The internal session owns authoritative results: externally editing the compatibility channel does not edit execution history. Repeated executions retain separate IDs.

`ow.test.report.json(snapshot)`, `.markdown(snapshot)` and `.junit(snapshot, id, name)` are pure reporters. Legacy `toMarkdown()` / `toJUnitXML(id, name)` report all executions; pass a suite run to `report.junit` to report one testcase per logical test with total attempt time. XML escapes attributes and text and replaces characters forbidden by XML 1.0. Infrastructure failures become error testcases. JUnit consumers differ in handling retry metadata; JSON retains all details.

Result encoding bounds depth, node count, strings and property count. Cycles use reference envelopes, undefined/nonfinite numbers use typed envelopes, and Java objects are represented by class name. Known secret property names are redacted. Arbitrary exception messages, URL query parameters and custom property names can still contain sensitive data: review artifacts before sharing. Encoded values are diagnostic data, not automatically executable replay fixtures.

## Assertions

| API | Semantics |
|---|---|
| `assertEqual(actual, expected)` | Strict primitive/reference equality, with `NaN` equal to `NaN` and signed zero equal |
| `assertNotEqual(actual, expected)` | Negation of that equality |
| `assertDeepEqual(actual, expected, message, options)` | Bounded recursive structural comparison |
| `assertMatch(value, regex)` | String match using a fresh regex; preserves caller `lastIndex` |
| `assertContains(collection, item)` | String substring, structural array member, Map key/Set membership, Java collection member/map key |
| `assertThrows(fn, matcher)` | Synchronous throw; matches string, regex, or `{name,message,javaClass,predicate}`; accepts thrown undefined/null |
| `assertSchema(value, schema)` | Isolated draft-aware JSON Schema validation without coercion, default insertion or removal |
| `assertApprox(actual, expected, tolerance)` | Absolute tolerance number or `{absolute,relative}`; tolerance must be nonnegative |
| `assertType(value, type)` | JS type, `null`, `array`, `date`, `regexp`, `map`, `set`, or `{javaClass}` |

Structural comparison distinguishes a missing key from an undefined value, null from undefined, and an array hole from an undefined element. JS plain objects compare enumerable own keys independent of order; getters are not invoked, and accessor identities must match. Cycles and alias topology must correspond. Dates compare valid epoch times; invalid dates fail. Regex source and flags must match. ES Map keys and Set members use native membership semantics, not structural key matching. Symbols/nonenumerable properties are outside this comparator's data model.

Java arrays, lists and maps compare structurally with exact runtime class matching; Java map keys retain JVM key semantics. Supported Java scalar wrappers, BigInteger/BigDecimal and date classes use `equals`. Thus BigDecimal scale matters and arbitrary Java numeric values are not silently converted to JS numbers. Unsupported Java classes and custom JS instances require explicit user assertions. Node budgets reject pathological comparisons rather than hanging.

New assertion errors have `name: 'AssertionError'`, code, operator, expected, actual, path and machine-readable differences. `ow.obj.schemaCreate(options)` also exposes independent `inspect`, `schemaCompile`, `schemaValidate`, `schemaAdd`, `schemaRemove` helpers. Global schema registrations/options are unchanged.

## Suites, hooks and resources

Suite builders provide `test`, nested `suite`, `beforeAll`, `afterAll`, `beforeEach`, `afterEach`, `skip`, `todo`, `fixture`, and assertion methods. Hooks receive a context. Setup runs outer-to-inner; teardown runs inner-to-outer in reverse registration order. Teardown errors are aggregated and do not erase the body error. A failing `beforeAll` blocks descendant tests and still runs eligible cleanup.

Tests/suites accept `tags`, `timeout` in milliseconds, and `retries`; tests also accept `skip`/`todo`. `run({tags:['fast'], names:['Suite::case'], workers:4})` filters before hooks and schedules independent top-level suites concurrently. Cases within a top-level suite remain sequential. Reports follow declaration order regardless of completion order. Parallel tests must not mutate shared application globals. Fail-fast under concurrency prevents future starts where observed; already-started suites can finish.

`fixture(name, factory, {scope:'test'|'suite'})` lazily creates a resource. Factories call `c.defer(disposer)` to register cleanup. Suite fixtures may depend only on suite fixtures. Contexts provide `tmpDir()`, `channel()`, `defer()`, `bind(fn)`, `skip(reason)`, `checkCancelled()`, assertion methods and async/mock helpers. Cleanup is LIFO. `bind` propagates context to explicitly owned work; arbitrary Java threads do not inherit it.

Deadlines interrupt cooperative work. If a thread does not stop within the cancellation grace period, the session becomes poisoned, completion is false, and resource cleanup waits for actual termination. A poisoned session cannot be reset or reused. This is detection and containment, not an OS-enforced time limit. Use process workers for work that can block indefinitely. Fixture/setup callbacks without an explicit timeout remain trusted synchronous code.

`runFiles(files, options)` loads sorted modules that export `register(t)` or `test*` functions. Loading modules executes their top-level code. `discover(files, {mode:'manifest'})` reads version-1 JSON manifests without executing source.

## Async work, mocks and profiling

`eventually(probe, {equals, timeout:5000, interval:100, backoff:1, maxInterval:1000})` polls a value; use `predicate` instead of `equals` for custom conditions. Probe exceptions propagate unless an explicit `retryOn(error)` accepts them. The last observation and observation count accompany timeout errors. Polling deadlines cannot interrupt a blocking probe.

`c.spawn(fn)` creates an owned OpenAF `$do` task; execution waits for owned tasks and attempts cancellation before cleanup. `await(task, timeout)` supports OpenAF oPromise and Java Future. Native JS Promise and arbitrary thenables are rejected: their queue semantics are not assumed to match Node or browsers.

```javascript
tests.execute('payment failure', function(c) {
  c.mock(service, 'charge', [{returns: 1}, {throws: new Error('Unavailable')}]);
  c.assertEqual(service.charge(), 1);
  c.assertThrows(function() { service.charge(); }, 'Unavailable');
  c.assertCalled(service, 'charge', 2);
});
```

Mocks require an active owner and an own writable/configurable JS data method. `spy` calls the original and records arguments/results/errors. Handles expose detached `calls()` and idempotent `restore()`. Replacements support a function or bounded response sequence and optional `match(args)`. Restoration preserves the exact descriptor. A second mock of the same member is rejected; calls from unrelated contexts use the original method. Java-backed members, accessors and prototype/global rewriting are unsupported. Inject JS adapters for Java, JDBC, REST, channels, processes and MCP clients.

`timer(key)` returns an idempotent stop handle; legacy `start(key)`/`stop(key)` use per-thread LIFO frames, so identical nested/concurrent keys are independent. Durations use `nowNano()`; wall timestamps are metadata only. Legacy profile summaries remain integer milliseconds. Missing hits are zero; missing extrema/average/last are undefined. `profile(key, fn)` stops in `finally`. Resetting active profiles/sessions is rejected. Memory profiling samples whole-process heap use without forced GC; it is not per-test allocation accounting or a benchmark.

## Isolated oJob verification

```javascript
var observed = tests.ojob('orders.yaml', {
  trusted: true,
  job: 'ProcessOrder',
  args: {orderId: 123},
  mocks: {CheckInventory: {output: {available: true}}},
  timeout: 30000,
  expect: {status: 'SUCCESS', jobsExecuted: ['ProcessOrder']}
});
```

A fresh JVM receives a versioned JSON request in a private temporary directory, an explicit environment allowlist plus `env`, a heap limit (`memoryMB`, default 256), bounded process output, and a deadline. User startup profiles are suppressed with `openaf.test.worker`. No shell interpolation is used. Temporary worker files are removed. The process runner reports whether descendant tracking was available; platforms can deny that facility, so this is not a sandbox guarantee.

Omit `job` to run the workflow's todo list. Selective job mocks transform definitions before compilation and can specify `output`, `error`, `delayMs`; flat argument maps are also accepted. `from`/`to` composition remains intact. The trace reports actual **scheduled job** starts/ends/errors, scheduler log outcomes and explicit state changes. Composed components are not reported as independently executed jobs: instrumentation that changes their shared lexical scope would be misleading. Failed dependency/scheduler logs affect workflow status. Handled job exceptions count according to the resulting oJob outcome.

`expect` supports status (defaults to SUCCESS), exact observed start order (`jobsExecuted`), forbidden jobs, output, output schema and unhandled job error count. `invariants` are predicates over the result. In concurrent workflows, use predicates for partial-order checks instead of asserting a total order. Output is the last completed job's returned args, excluding internal execution IDs; it can still include oJob's `init` data. Traces have bounded diagnostic snapshots. These checks establish observed behavior only, never universal workflow properties. A result distinguishes live and mixed/mocked execution.

Worker requests must set `trusted:true`. Untrusted generated code needs an externally provisioned OS/container sandbox with filesystem/network policy and enforceable resource limits. No such provider is silently substituted with an ordinary JVM.

## Optional oPacks

The sibling `openaf-opacks` repository contains five dependency-free optional modules:

| oPack | Entry point | Delivered capability |
|---|---|---|
| TestProperty | `require('test-property.js').create(session)` | Seeded generators, shrinking, replay, bounded schema subset |
| TestContracts | `require('test-contracts.js').create(session)` | Explicit mock/replay/live modes, REST and injected JDBC/channel/MCP/process adapters |
| TestCoverage | `require('test-coverage.js').create()` | Explicit probes/LCOV, job coverage, benchmarks, explicit mutation runner |
| TestVerify | `require('test-verify.js').create(session)` | Preconditions/postconditions, trace invariants, model tests, bounded exploration, SMT-LIB process adapter and backend interface |
| TestAgent | `require('test-agent.js').create(session, options)` | Manifest validation, read-only MCP descriptors, external sandbox execution boundary |

Automatic statement/branch instrumentation, JaCoCo orchestration, automatic mutation generation, native Promise queue ownership, Lean proof integration, source-to-test generation and OS sandbox providers are not supplied. These remain feasibility-gated follow-ups in the roadmap. Tests, properties, contracts, bounded models and backend proof artifacts retain distinct evidence labels.

The session snapshot schema is published at [ow-test-results.schema.json](./schemas/ow-test-results.schema.json). Suite summaries include `hookAssertions` in the total assertion count. A session can provide a custom `redact(encodedValue)` function for application-specific artifact filtering; it must be synchronous and return serializable data. Generic Java Future cancellation cannot establish whether its body terminated, so a Future timeout poisons the owning session and retains its resources rather than cleaning them up while unknown work may still use them.

`TestVerify.smt(argv, formula, options)` additionally supports an explicitly installed SMT-LIB command with bounded output and a deadline. It records satisfiable/unsatisfiable/unknown outcomes for the encoded formula, with backend identity, version, formula hash and assumptions. No solver is installed by this API.
