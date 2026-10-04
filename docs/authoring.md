# From an OpenAF script to an oJob

[Index](./index.md) | [Recipes](./authoring-recipes.md) | [Testing](./authoring-testing.md)

This tutorial reads a JSON array, selects a status, optionally writes a result file, and prints JSON. It requires only OpenAF; no oPacks or credentials. Download the files in [examples/authoring](../examples/authoring/) and run commands from that directory. Existing output files are overwritten.

## Choose an entry point

| Use | When it fits |
| --- | --- |
| A `.js` script | A small utility or custom algorithm with ordinary JavaScript control flow. |
| An oJob `.yaml` | Named stages, reusable jobs, input checks, dependencies, scheduling, or operational help. |
| oafp | A conversion or query already expressible through its CLI options; see [oafp](./oafp.md). |

OpenAF runs on Java/Rhino. Node's `fs`, `process`, npm resolution, and browser globals are not implicit APIs. Use `io`, `processExpr`, `$sh`, and verified `ow.*` loaders. Check `openaf -c 'print(getVersion());'` and use `openaf -helpscript io.readFileJSON` for installed API help.

## 1. Read and filter records

[records.json](../examples/authoring/records.json) has one active and one inactive record. The complete [filter-records.js](../examples/authoring/filter-records.js) accepts `input`, optional `status` (default `active`), and optional `output`:

```sh
openaf -f filter-records.js -e 'input=records.json;status=active;output=selected.json'
```

Expected stdout and parsed contents of `selected.json`:

```json
[{"id":1,"status":"active"}]
```

`processExpr()` reads the semicolon-separated expression from `-e`. `_$` validates the filename and supplies the status default. `io.readFileJSON` parses the file; a separate array check verifies shape. `$from(records).equals(...).select()` returns the selected records. `io.writeFileJSON` writes them when requested; `print(stringify(...))` keeps stdout machine-readable.

The outer `catch` writes diagnostics to stderr and exits with code 1. Omit `input` to try that failure; use `status=missing` for a valid empty result (`[]`). Quote the expression so the shell does not interpret semicolons. See [CLI](./cli.md) for shebang arguments, which use space-separated tokens instead.

## 2. Split the task into jobs

The complete [filter-records.yaml](../examples/authoring/filter-records.yaml) implements the same interface:

```sh
ojob filter-records.yaml input=records.json status=active output=selected.json
```

`help.expects` describes arguments. `check.in` and `check.out` enforce contracts. `todo` schedules the jobs; definitions alone do not run. `sequential: true` orders stages and `shareArgs: true` carries their `args` changes forward:

| Stage | Reads | Adds or produces |
| --- | --- | --- |
| Read | `args.input`, `args.status` | `args.records`; default status |
| Filter | `args.records`, `args.status` | `args.result` |
| Write | `args.result`, optional `args.output` | JSON on stdout and optionally in a file |

Sequential execution alone does not opt into argument sharing. `init` is available as `args.init`; it is not intermediate results. Named `$set`/`$get` storage is another mechanism with a different lifetime; ordinary stage outputs can stay in `args`.

When `input` is absent, `help.expects` with `mandatory: true` makes this oJob show help and return successfully before executing jobs. The script instead exits with code 1. To test workflow failure, supply `input=absent.json` or a file containing a JSON object. The top-level `catch` deliberately exits with code 1 for execution failures. If an automation requires missing arguments to fail too, set `ojob.showHelp: false` and let `check.in` validate them. Verify observable output as well as exit status. Disabling console logging keeps JSON clean.

## 3. Compose or depend

`from` and `to` compose code before and after a job body. `deps` controls prerequisites; it is not a function call or argument-passing mechanism. Schedule prerequisites in `todo`. The [composition recipe](./ojob-recipes.md#2-compose-preparation-and-formatting-around-a-job) isolates composition.

Use `try/finally` for mandatory cleanup: throwing skips ordinary `to` code. A `catch` returning true marks failure handled; logging alone does not. The [cleanup example](../examples/authoring/cleanup.yaml) demonstrates both behaviors with a temporary file.

## 4. Verify and extend

```sh
openaf -f test-filter.js
```

The [standalone assertions](../examples/authoring/test-filter.js) verify selection and empty results. Test both CLIs with missing input, invalid JSON, and an object instead of an array. See [Testing](./authoring-testing.md) for end-to-end checks.

Continue with [authoring recipes](./authoring-recipes.md). Use [ojob-all.yaml](./ojob-all.yaml) as a syntax catalog, not an executable scaffold. For AI-assisted work, consult the [JavaScript skill](../skills/openaf-javascript/SKILL.md) and [oJob skill](../skills/ojob-authoring/SKILL.md).
