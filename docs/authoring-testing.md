# Test and troubleshoot your automation

[Tutorial](./authoring.md) | [Recipes](./authoring-recipes.md) | [Contributor tests](./testing.md)

Test a user script without an OpenAF source checkout or oJob-common: call `ow.loadTest()`, then `ow.test.assert(actual, expected, message)`. The complete [test-filter.js](../examples/authoring/test-filter.js) runs alongside [records.json](../examples/authoring/records.json):

```sh
openaf -f test-filter.js
```

Expect `filter assertions: ok`. This checks transformation behavior, not CLI parsing, filesystem errors, or scheduling. Test those through the actual entry point too.

## Check the whole interface

For both versions of the [tutorial](./authoring.md), verify:

| Condition | Expected observation |
| --- | --- |
| Sample array, status omitted | Only the active record |
| `status=inactive` | Only the inactive record |
| `status=missing` or empty input array | `[]`, successful completion |
| Missing file, malformed JSON, or JSON object | Diagnostic, exit 1, no successful JSON output |
| Missing `input` (including no arguments) | Script fails; oJob's mandatory-argument help prints usage and returns successfully before execution |
| Optional `output` | File equals parsed stdout; existing file replaced |
| HTTP 404/500 or wrong JSON shape | Failure observed rather than successful data |
| Child exits nonzero | Failure propagates to CLI |
| Periodic workflow | Multiple ticks, termination, shutdown cleanup |
| Handled job error | Cleanup runs, `to` is skipped, recovery observed |

Exit code alone is insufficient for general oJobs. These CLI examples explicitly use `exit(1)` in error handlers. Reusable jobs should choose propagation or recovery instead of terminating their host process.

Repository maintainers can run the end-to-end fixtures with:

```sh
python3 tools/docs/test_examples.py --jar openaf.jar
```

The runner requires Python 3 and Java, uses the chosen JAR, loopback HTTP, scratch directories, and process deadlines, and reports runtime version and JAR hash. On POSIX it kills timed-out process groups. `--integration` additionally tests already-installed Badgen; it never installs packages. CI runs the default suite against its build artifact. See [coverage](./documentation-coverage.md) for reports and static checks.

## Test an embedded module from a file

The [self-contained workflow](../examples/authoring/code-separation.yaml) embeds `handlers.js`, and [test-code-separation.js](../examples/authoring/test-code-separation.js) calls its `Normalize` export directly. From a source checkout, run:

```sh
ojob examples/authoring/code-separation.yaml text=hello
# HELLO

ojob examples/authoring/code-separation.yaml -exportcode dir=/tmp/openaf-module-test
(cd /tmp/openaf-module-test && openaf -f /absolute/path/to/openaf/examples/authoring/test-code-separation.js)
# module assertions: ok
```

Use a fresh scratch directory and substitute your checkout's absolute path. Edit `/tmp/openaf-module-test/handlers.js`, run the assertions again, then import the changes:

```sh
ojob examples/authoring/code-separation.yaml -importcode dir=/tmp/openaf-module-test output=/tmp/code-separation.updated.yaml
ojob /tmp/code-separation.updated.yaml text=hello
# HELLO for the original module
```

The first test verifies the exported module's argument mutations. The last command verifies the embedded module and oJob wiring. Embedded source takes precedence over disk files, so editing an exported file alone does not change the original workflow. Modules use OpenAF's `require` contract; they are not automatically Node.js programs. For raw `exec` bodies, supply the job variables and any adapter protocol in a harness, or test them through an oJob.

Contributor regressions for source exchange and embedded loading:

```sh
python3 tests/test-ojob-code.py --jar openaf.jar
java -jar openaf.jar -f tests/runOJobCode.js
```

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `fs` or `process` undefined | Replace Node APIs with documented OpenAF facilities. |
| Missing helper | Verify `ow.load*()`/package loader and runtime version. Source edits do not update a JAR. |
| Next job cannot see data | Check `todo`, sequential execution, `shareArgs`, `args.init`, and named storage. |
| Number validation rejects CLI value | Convert string arguments before numeric validation. |
| Unexpected HTTP/process result | Check the exact helper's contract; `$rest`, `$fetch`, and `$sh` differ. |
| Logs contaminate JSON | Separate stderr and stdout; use `ojob.logToConsole: false`. |
| Work finishes after exit | Wait with supported oPromise/concurrency APIs; assert completion counts. |
| Daemon never returns | Check stop conditions and resource cleanup; use an external deadline. |
| Inspecting YAML causes activity | `-compile`, `-jobs`, and related commands load dependencies; plain parsing is a different check. |

For AI-assisted debugging provide the command, version, small input, expected output, and actual diagnostics with secrets removed. Ask for source-backed APIs and a clear distinction between static inspection and execution.
