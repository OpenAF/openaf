# ow.test modernization implementation status

This document tracks the implementation of the [accepted roadmap](./ow-test-modernization.md), authorized across core and optional oPacks on 2026-11-06. It distinguishes delivered behavior from gated follow-ups. The full aspirational roadmap is **not all enabled**. Unsupported execution/instrumentation modes fail explicitly.

## Delivered components

| Phase | Implemented | Placement |
|---|---|---|
| 1 — correctness | Owned monotonic timers; per-thread legacy frames; idempotent stops; locked commits; detached histories/results; failure policies; corrected pure XML/Markdown reports; explicit CI completion and exit handling | Core `owrap.test.js`, `owrap.test.report.js`, CI/test orchestrators |
| 2 — assertions/lifecycle | Rich assertions, cycle-aware JS/Java collection comparison, schema instances, suites/hooks, fixtures, tags/names, skips/TODO, retries/flaky outcomes, hook deadlines, deferred cleanup | Core assertion/run modules; `ow.obj.schemaCreate` |
| 3 — isolation | Scoped own-method mocks, spies, response sequences, argument predicates, call snapshots, descriptor restoration and ownership enforcement | Core mock module |
| 4 — oJob | Fresh-JVM worker, explicit trusted boundary, individual jobs/full workflows, pre-compilation definition mocks, scheduled execution/state/log events, expectations and invariants | Core oJob/worker modules and narrow oJob seams; owning `oJob-common/oJobTest.yaml` wrappers |
| 5 — integrations | Explicit live/mock/replay modes; versioned redacted recordings; REST, injected JDBC/channel/MCP/process adapters; deterministic duplicate/reordered message fixtures | Optional `TestContracts` |
| 6 — concurrency | Eventually, OpenAF oPromise/Java Future adapters, owned async tasks, explicit context binding, concurrent top-level suites, stable reporting order, cancellation/poisoning | Core async/run modules |
| 7 — properties | Seeded integer/float/string/array/map/record/JSON generators, bounded schema subset, custom generators, shrinking, fixture replay, distribution counters and budgets | Optional `TestProperty` |
| 8 — measurement | Explicit line/function/branch probes and LCOV, scheduled-job coverage, separate benchmarks/percentiles/comparison, explicit mutation runner and inconclusive outcomes | Optional `TestCoverage` |
| 9 — agents/verification | Versioned manifests, read-only MCP descriptors, explicit sandbox-provider boundary, regression fixtures, pre/postconditions, trace invariants, model tests, bounded BFS, SMT-LIB process adapter and proof-backend interface | Optional `TestAgent`, `TestVerify` |

No third-party dependencies, services, runner or LLM were added. Optional code is in the sibling `openaf-opacks` repository, not eagerly loaded into OpenAF. All five new packs have package manifests and local smoke tests. oJob-common changes are in its own repository; the installed copy inside this checkout was not rewritten.

## Validation and practical limits

The independent framework harness checks actual values and process status without relying on ow.test's own pass/fail decisions. It covers legacy return/argument semantics, profiles, histories, rich comparisons, XML parsing, schema isolation, hooks, fixtures, retries, fail-fast, concurrent completion, mocks, async ownership, cooperative/noncooperative deadlines, deferred cleanup, worker results and published result schemas.

The full repository orchestrator completed **507 executions: 506 passed, 1 failed, 12,953 assertions**, with `complete:true`, no infrastructure errors, and process exit status **1**. The failure is `AI::OpenAI jsonSchemaPrompt unsupported provider`: the test expects `JSON Schema responses not supported by this provider`, while the implementation throws `Error: LLM_DECISION_INVALID_REQUEST`. The same failure was reproduced using the original `js/owrap.test.js` from HEAD with the same AI implementation. It is outside this modernization and was not changed. This full run preceded the final focused cleanup/encoding/worker-argument fixes; those are covered by the final focused validation.

Final validation against the serially rebuilt artifact:

- **73 independent framework checks passed** (`tests/runTestFramework.js`).
- **25 extension/integration checks passed** (`tests/runTestExtensions.js`): generators/shrinking, contracts/replay, message ordering, model exploration, coverage/benchmarks/mutation results, manifest rejection, oJob-common success/failure propagation, live loopback HTTP, prepared H2 queries, private channels, and Z3 sat/unsat/parser-error outcomes.
- All five package smoke entry points passed; their manifests/file hashes were regenerated.
- Lazy core modules and a workflow worker also passed from an unrelated working directory.
- JAR ZIP integrity and packaged JS matching generated build sources passed. CI YAML parsing, shell syntax and whitespace checks passed.

Reproduction from the core checkout:

```sh
java -Dopenaf.test.worker=true -jar openaf.jar -c "try { loadLib('tests/runTestFramework.js'); exit(2); } catch(e) { printErr(e); exit(1); }"
OW_TEST_COMMON=../oJob-common OW_TEST_LIVE=1 OW_TEST_Z3=/path/to/z3 \
  java -Dopenaf.test.worker=true -jar openaf.jar -c "try { loadLib('tests/runTestExtensions.js'); exit(2); } catch(e) { printErr(e); exit(1); }"
```

The extension runner defaults to the sibling `openaf-opacks`; override `OW_TEST_OPACK_ROOT` when needed. Omit `OW_TEST_LIVE`, `OW_TEST_Z3`, or `OW_TEST_COMMON` to skip their optional checks. The core runner uses `OW_TEST_SOURCE=1` for source-loading development checks.

Local validation uses macOS and Java 27. The new CI matrix targets Linux/macOS/Windows on Java 21 and 25, but hosted results are pending. Socket-dependent validation requires permission to bind local ports. Z3 5.3.3 was already installed and was used for sat/unsat/parser-error checks; no solver installation was performed.

Builds use the repository's `build.yaml`. A final packaging attempt overlapped an oPack command opening the JAR and hit a ZIP-header race; that run was stopped, and final validation uses a serial rebuild from a separate, validated copy of the current `openaf.jar`/`openaf.jar.orig` pair. Do not launch consumers of the output JAR until repacking and completion generation have finished.

## Deliberately gated or incomplete work

| Capability | Current boundary | Next evidence needed |
|---|---|---|
| Native JS Promise | Rejected; oPromise and Future supported | Engine-owned queue/rejection/context tests in interpreted and compiled modes |
| `from`/`to` component traces | Only actual scheduled jobs are reported; composition semantics remain intact | A source-map/instrumentation PoC preserving lexical scope, returns, exceptions and language adapters |
| Automatic JS coverage | Explicit probes only | A parser/debugger implementation with source identity, compiled/interpreted parity and semantic-preservation regressions |
| Java coverage | No JaCoCo orchestration | Optional version-pinned JVM agent integration and JDK compatibility tests |
| Automatic mutation generation / weak-assertion analysis | Explicit mutation spans and caller-provided runner only | Safe AST operators, isolated runner, equivalent-mutant handling and cost budgets |
| Untrusted execution | Denied without an administrator-provided sandbox adapter and explicit policy | Real OS/container providers with negative escape/resource-limit tests on supported platforms |
| AI source-to-test generation | Manifests and execution interface supplied; no generation agent bundled | External mini-a/agent integration, controlled generation/evaluation corpus and sandbox provider |
| MCP execution/replay publication | Read-only descriptors supplied; servers start only by explicit host integration | Authenticated host tool adapter backed by a concrete sandbox policy |
| Lean proof checking | Explicit backend interface only | Maintained formal specification, theorem identity, reproducible checker artifact and model-to-code assumptions |
| Universal JSON Schema generators | A bounded, documented subset; unsupported keywords reject | Solver-backed generation or bounded rejection with explicit unsatisfiable-schema outcomes |
| Cross-platform runtime proof | CI matrix configured | Passing hosted jobs on all six OS/JDK combinations |

Generic Java Future cancellation does not prove termination. On timeout its session is poisoned and resources are retained rather than cleaned up while unknown work may still be active. For owned tasks, cleanup waits for confirmed termination. JVM subprocess isolation does not restrict filesystem/network permissions, and descendant enumeration can be denied by the OS. Hard untrusted-code limits require the separate sandbox provider.

## Review and release units

1. Kernel, reporting, legacy regressions and CI outcome checks.
2. Assertions/schema factory, suites/fixtures and concurrent scheduling.
3. Mocks and async ownership/cancellation.
4. Bounded process support, workflow observer/transform seams and worker tests.
5. oJob-common wrapper fixes and adapters (separate repository).
6. Five optional oPacks, each independently reviewable and installable (separate repository).
7. Published API guide, schema and feasibility-gated follow-ups.

These changes are uncommitted. No PR, push, release or package publication was performed. Existing unrelated workspace changes remain outside the implementation scope.
