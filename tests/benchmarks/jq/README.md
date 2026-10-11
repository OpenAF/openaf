# OpenAF jq compatibility and performance

Run from the repository root after `ojob build.yaml`:

```sh
sh tests/benchmarks/jq/run.sh
```

The runner compiles a benchmark-only helper with dependencies already in `lib/`
and loads it from `/tmp/openaf-jq-bench`. It does not download dependencies or
modify the production JAR. Set `JQ_BENCH_DIR`, `JQ_BENCH_JAVA`, or
`JQ_BENCH_RESULT` to override the temporary directory, Java executable, or output
JSON file. The default report is `/tmp/openaf-jq-bench/results.json`.

## What is measured

Every operation starts with a Rhino input and returns Rhino results. Correctness
is checked against the same expected output before timing each fixture.

- `jq`: complete `$jq` call with direct Rhino/Jackson conversion and syntax cache.
- `jqUncached`: complete call with `JQ_CACHE_SIZE=0`.
- `jsonRoundTrip`: Rhino stringify, Jackson parse, cached jq evaluation, Jackson
  stringify, and Rhino parse, using the same engine and jq compatibility version.
- `path`: equivalent complete `$path` call with the existing Java backend.
- `from`: equivalent `$from` operation.

The fixtures cover small lookups, 100-row and 10,000-row filters, a 1,000-row sort,
a 10,000-row reduction, and unique query churn. Churn uses unique jq comments;
JMESPath uses unique whitespace. Each mode receives a warmup batch and five
measured batches, with alternating mode order. Reports retain every sample and
use the median milliseconds per call.

`firstJqCallMs` includes lazy built-in initialization but excludes JVM startup.
Per-fixture `coldMs` is the first measured call for that mode after earlier
fixtures/initialization; it is not a fresh-process cold start. Fixture construction
is outside timing. `observedHeapBytes` samples total JVM heap in use after all
modes of a fixture; it is a cumulative observation, not per-engine allocation or
peak memory. JVM warmup, GC, machine load, and mode order affect these small
measurements. This is a diagnostic harness, not JMH or a universal speed ranking.

## Compatibility checks

From `tests/`:

```sh
java -jar ../openaf.jar --ojob -e autoTestAll.Jq.yaml
JQ_REFERENCE=/path/to/jq-1.6 java -jar ../openaf.jar -f jq/differential.js
```

The oJob tests require the existing `oJob-common` package. For a development JAR
whose package registry does not find it, set `__flags.OJOB_LOCALPATH` to an
installed `oJob-common` directory before invoking `oJob("autoTestAll.Jq.yaml")`.

| Capability | Verification |
| --- | --- |
| Selectors, slices, optional access, pipes, commas, constructors | Native jq 1.6 corpus |
| Variables, bindings, definitions, reduce, foreach, recursion | Native jq 1.6 corpus |
| Sorting, grouping, entries, flatten, range, string interpolation | Native jq 1.6 corpus |
| Regex test/capture/substitution, assignment, update, paths | Native jq 1.6 corpus |
| Empty output, null, false, numeric and Unicode values | Corpus and API assertions |
| Detached results, variable/cache isolation, concurrency, rejected inputs | OpenAF regression assertions |
| `.foo |= empty` | Known upstream difference: native jq removes `foo`; jackson-jq throws |
| `env`, `$ENV`, `inputs`, filesystem imports | Unavailable through this API |

The corpus contains 51 passing native comparisons and one separately checked
known difference. It is not exhaustive jq conformance coverage. Native tests
require exactly jq 1.6; the system jq on the validation machine is jq 1.7.1,
so jq 1.6 was built separately in `/tmp` for these checks.

## Recorded results (2026-10-11)

Three fresh JVM runs on JDK 27/aarch64, each with five measured batches. The
following values are the median of the three per-run medians, in milliseconds
per operation. Raw samples, heap observations, and the final JAR SHA-256 are in
[run 1](results-run1.json), [run 2](results-run2.json), and [run 3](results-run3.json).

| Fixture | `$jq` cached | `$jq` uncached | JSON round trip | `$path` Java | `$from` |
| --- | ---: | ---: | ---: | ---: | ---: |
| lookup-small | 0.0055 | 0.0161 | 0.0201 | 0.6523 | 0.0642 |
| filter-medium | 0.0563 | 0.0631 | 0.0823 | 0.6189 | 0.5619 |
| filter-large | 4.6494 | 4.5353 | 6.5007 | 1.5716 | 36.0366 |
| sort-medium | 0.4233 | 0.4382 | 0.6371 | 0.9980 | 57.5846 |
| reduce-large | 3.1360 | 3.0778 | 4.7366 | 2.0119 | 220.2871 |
| query-churn | 0.0123 | 0.0119 | 0.0183 | 0.5886 | 0.0605 |

First `$jq` calls took 98.7–100.0 ms, including lazy built-in loading.
Direct conversion was 1.40–3.66 times faster than the JSON text round trip in these fixtures.
`$path` remained faster for the 10,000-row filter and reduction. Query caching
helped repeated small queries; it offered little benefit on traversal-heavy or
unique-query workloads. These results support the Java adapter choice without
establishing a universal fastest query method.

Validation:

- Build and repack succeeded; the final JAR passed 245 focused jq assertions,
  including eight simultaneous worker threads and Unicode regex resources.
- All 51 corpus cases matched a separately built native jq 1.6. The `|= empty`
  difference was checked explicitly against both engines.
- A billion-element sparse array was rejected under `-Xmx128m`, confirming that
  invalid array lengths do not trigger proportional preallocation.
- The full intended suite passed 400/400 tests and 6,337 assertions. Its normal
  orchestrator is blocked by existing misplaced Console/Format definitions;
  validation registered `Console::askKey`, `Format::Ansi clip and pad`, and
  `Format::Default table format` in memory only. Those repository files were
  preserved. This full run preceded the final allocation-only safeguard;
  focused and native checks were rerun after the final rebuild.
- Runtime checks used JDK 27. The adapter also compiled with `javac --release 21`;
  a separate JRE 21 runtime was not available for execution testing.
