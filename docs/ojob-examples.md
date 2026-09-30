# Learning oJob from ojob.io

[Index](./index.md) | [Reference](./ojob.md) | [Runnable recipes](./ojob-recipes.md)

The reference and recipes were checked against `js/owrap.oJob.js`, `js/ojob.js`, the built-in definitions in `ojob.yaml`, and the sibling `ojob.io` checkout. The September 2026 inventory read all 457 `.yaml`/`.yml` files recursively, including hidden directories: all parsed, and 451 contained a top-level `jobs` or `todo` array. The remaining files include workflow/configuration/data files. This was a source review, not execution of the integration collection.

The collection contains older and newer idioms. Use the implementation to resolve disagreements: an option found in one example is not necessarily supported. In particular, `shareArgs` is valid while `sharedArgs` is not, and environment names retain their case. The local files below correspond to source paths in the [oJob.io repository](https://github.com/OpenAF/oJob.io).

## Patterns to learn first

| Pattern | Source example | What to examine |
| --- | --- | --- |
| Small CLI utility | [formats/json2yaml.yaml](https://github.com/OpenAF/oJob.io/blob/master/formats/json2yaml.yaml) | `help.expects`, input checking, filesystem input, and `ow.oJob.output`. |
| Input checks and producer/consumer work | [docker/mirrorImages.yaml](https://github.com/OpenAF/oJob.io/blob/master/docker/mirrorImages.yaml) | `from` for setup, `check.in` for each worker, and `each(item)` emission. Requires `skopeo` and registry access. |
| Streaming an export | [es/export.yaml](https://github.com/OpenAF/oJob.io/blob/master/es/export.yaml) | `each` consumers and the ElasticSearch oPack. Requires an Elasticsearch service. |
| Multi-stage import | [formats/openmetrics2prometheus.yaml](https://github.com/OpenAF/oJob.io/blob/master/formats/openmetrics2prometheus.yaml) | Composition, worker error handling, and external tools. |
| Templates stored in `init` | [ojob/templates/cron.yaml](https://github.com/OpenAF/oJob.io/blob/master/ojob/templates/cron.yaml) | A generator that prints a separate definition with `todo`, `daemon`, and periodic shell jobs. |
| Data-driven template rendering | [template/apply.yaml](https://github.com/OpenAF/oJob.io/blob/master/template/apply.yaml) | Data input, template helpers, and optional file output. |
| Several execution languages | [cheatsheet/ojob/langs.yaml](https://github.com/OpenAF/oJob.io/blob/master/cheatsheet/ojob/langs.yaml) | Argument exchange and `# return` in shell/SSH examples; external interpreters must be installed. |
| Shortcut composition | [cheatsheet/ojob/shortcuts.yaml](https://github.com/OpenAF/oJob.io/blob/master/cheatsheet/ojob/shortcuts.yaml) | Nested shortcuts and `from`/`to`. Cross-check spellings with `ojob -shortcuts`; the cheatsheet includes historical examples. |
| HTTP or STDIO MCP service | [ai/mcps/mcp-rss.yaml](https://github.com/OpenAF/oJob.io/blob/master/ai/mcps/mcp-rss.yaml) | `oJobMCP.yaml`, package versions, YAML anchors reused across transports, `daemon`, and a PID file. Requires the declared packages and network access for feed operations. |
| External definitions as jobs | [ai/mcps/mcp-db.yaml](https://github.com/OpenAF/oJob.io/blob/master/ai/mcps/mcp-db.yaml) | `type: jobs` with `typeArgs.url` delegates to another definition; it is distinct from composing a local job's body. |

`check` occurs in 541 job definitions in this snapshot, with `from` in 159, `to` in 175, and `each` in 13. The [validation order](./ojob.md#validation-order-and-supported-checks) and [composition rules](./ojob.md#job-inheritance) are therefore useful before adapting the larger integrations.

## Authoring and packaging tools

These definitions can generate files or execute supplied code. Read their source and help before use; the examples below identify their purpose without running them.

| Source | Purpose |
| --- | --- |
| [ojob/genJob.yaml](https://github.com/OpenAF/oJob.io/blob/master/ojob/genJob.yaml) | Generate a job entry with argument comments from job help metadata. |
| [ojob/genMD.yaml](https://github.com/OpenAF/oJob.io/blob/master/ojob/genMD.yaml) | Generate Markdown from the help layout expected by this tool; inspect its legacy `Help`-job lookup before applying it to top-level `help`. |
| [ojob/code.yaml](https://github.com/OpenAF/oJob.io/blob/master/ojob/code.yaml) | Extract or replace code in YAML definitions. |
| [ojob/compile.yaml](https://github.com/OpenAF/oJob.io/blob/master/ojob/compile.yaml) | Build a compressed definition; separate from the CLI's include-expanding `-compile` option. |
| [ojob/script.yaml](https://github.com/OpenAF/oJob.io/blob/master/ojob/script.yaml) | Generate a Unix launcher with an embedded definition. |
| [ojob/genOJobEnc.yaml](https://github.com/OpenAF/oJob.io/blob/master/ojob/genOJobEnc.yaml) | Generate encoded variants; inspect its formats rather than equating encoding with encryption. |
| [ojob/templates/test.yaml](https://github.com/OpenAF/oJob.io/blob/master/ojob/templates/test.yaml) | Generate a functionality-test definition. |
| [ojob/templates/httpd.yaml](https://github.com/OpenAF/oJob.io/blob/master/ojob/templates/httpd.yaml) | Generate an HTTP service definition. |
| [ojob/templates/ssh.yaml](https://github.com/OpenAF/oJob.io/blob/master/ojob/templates/ssh.yaml) | Generate remote-machine command jobs. |
| [ojob/templates/pods.yaml](https://github.com/OpenAF/oJob.io/blob/master/ojob/templates/pods.yaml) | Generate Kubernetes pod command jobs. |

Generator YAML often holds a second YAML document as a string in `init`. Distinguish the generator's own settings from the generated service's settings. Likewise, YAML anchors and aliases reuse parsed data; they do not schedule jobs by themselves.

## Adapting a definition

1. Read `help`, `ojob.opacks`, `include`/`jobsInclude`, and `ojob.loadLibs`. They establish arguments and dependencies. Package versions in examples are requirements for those definitions, not a statement of the latest release.
2. Follow the `todo` list, then the referenced jobs' `from`, `to`, `deps`, and `each`. Defining a job does not schedule it.
3. Trace each value through `args`, `args.init`, and named `$set`/`$get` storage. Enable sequential argument sharing explicitly when required.
4. Check whether it opens a listener, remains a daemon, uses `unique.killPrevious`, writes files, or invokes an external command. Preserve or change those behaviors deliberately when adapting it.
5. Use the CLI's `-jobs`, `-todo`, `-deps`, and `-compile` on a trusted local copy to inspect resolved definitions. These options still load dependencies; use a plain YAML reader if you only need the original document.

The [local recipes](./ojob-recipes.md) isolate these orchestration patterns from package, cloud, credential, and service prerequisites.
