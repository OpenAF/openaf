# Authoring recipes for scripts and oJobs

[Tutorial](./authoring.md) | [Testing](./authoring-testing.md) | [oJob recipes](./ojob-recipes.md)

Linked files are canonical runnable examples. Run from their directory or copy them to a scratch directory. The automated runner uses temporary directories, a loopback HTTP fixture, and process deadlines. Optional integrations are excluded by default.

| Task | Script | oJob | Observable result |
| --- | --- | --- | --- |
| Filter JSON | [filter-records.js](../examples/authoring/filter-records.js) | [filter-records.yaml](../examples/authoring/filter-records.yaml) | Identical arrays on stdout and in the optional file |
| Get JSON over HTTP | [http-json.js](../examples/authoring/http-json.js) | [http-json.yaml](../examples/authoring/http-json.yaml) | Array, or diagnostic and exit 1 |
| Run a process | [process.js](../examples/authoring/process.js) | [process.yaml](../examples/authoring/process.yaml) | `{stdout, stderr, exitcode}` on success; exit 1 on child failure |
| Load Badgen | [badge.js](../skills/openaf-opacks/assets/badge.js) | [package.yaml](../examples/authoring/package.yaml) | SVG; requires the installed Badgen oPack |

## HTTP

For a manual fixture run `python3 -m http.server 8080 --bind 127.0.0.1` from the examples directory, then in another terminal:

```sh
openaf -f http-json.js -e 'url=http://127.0.0.1:8080/records.json'
ojob http-json.yaml url=http://127.0.0.1:8080/records.json
```

Both print the input array. Change the path to `/missing.json` to exercise HTTP failure; stop the server with Ctrl-C afterwards. Python is only a fixture prerequisite here. `$rest(...).get()` returns decoded JSON, not a browser `Response`. The examples enable `throwExceptions` and set `connectionTimeout: 5000`, then validate the response shape. This is not a complete workflow deadline; the test runner supplies one.

Do not reuse this contract for `$fetch`, which returns an oPromise wrapping a response with body readers and cleanup. See [HTTP and process contracts](../skills/openaf-javascript/references/http-process.md).

## Processes

Create `command.json` containing `["java","-version"]`, then run:

```sh
openaf -f process.js -e 'command=command.json'
ojob process.yaml command=command.json
```

Java generally writes its version to stderr; nonempty stderr is not by itself failure. The examples inspect `exitcode`. Try `["java","--not-an-openaf-java-option"]` for a harmless failed command. An argv array avoids shell interpolation; explicitly invoking a shell restores shell semantics. These examples execute your supplied command and do not impose a universal child-process deadline.

## Packages

The Badgen pair is an **optional integration**, not offline proof:

```sh
opack info Badgen
opack install Badgen
openaf -f badge.js
ojob package.yaml
```

Copy the linked script into your scratch directory first. Inspect the package manifest and API for your version. `getOPackPath("Badgen")` checks discovery; `require("badgen.js")` loads its actual export. The examples fail if missing and do not install it. `ojob.opacks` can declare dependencies, but resolution may install or update packages and does not import jobs or JavaScript. Use `jobsInclude` for a verified job library. See [oPacks](./opacks.md#5-using-opacks-from-scripts-and-ojob).

## Concurrency and scheduling

Run `ojob composition.yaml` using [composition.yaml](../examples/authoring/composition.yaml): expect `prepared`, then `42`. `Prepare` is scheduled separately and is a dependency of `Calculate`; `Double` and `Display` are composed through `from` and `to`, not independently scheduled. Sequential argument sharing carries the prepared value.

Run `ojob bounded-workers.yaml` using [bounded-workers.yaml](../examples/authoring/bounded-workers.yaml): expect `record: 1`, `record: 2`, and `record: 3`, in any order. The producer emits three maps to at most two concurrent consumers and the process completes after consumption.

[bounded-work.js](../skills/openaf-concurrency/assets/bounded-work.js) uses two consumers, waits, and asserts two successes and one observed failure. It prints `concurrency: ok`. The [producer/consumer recipe](./ojob-recipes.md#5-producerconsumer-fan-out) demonstrates `each` and `eachThreads`; this differs from sequential `(each)`. Parallel outputs need not retain input order; ordinary shared variables are not automatically synchronized.

[bounded-periodic.yaml](../examples/authoring/bounded-periodic.yaml) registers a one-second cron job and stops after at least two ticks. `waitForFinish` prevents overlap; `daemonFunc` returns true to stop. A shutdown job prints `cleanup: ok`. Run `ojob bounded-periodic.yaml`; expect two or more ticks, cleanup, and termination. The test runner adds a deadline so scheduler failures cannot hang CI.

[cleanup.yaml](../examples/authoring/cleanup.yaml) deliberately throws after opening a file. `finally` closes and removes it, `catch` handles the known error, and a later job verifies recovery. `to` must not run. Execute only in a scratch directory: it owns `temporary.txt`.
