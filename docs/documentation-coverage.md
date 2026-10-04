# Documentation coverage and executable examples

[Index](./index.md) | [Authoring](./authoring.md) | [Testing](./authoring-testing.md)

Coverage has several independent dimensions. A symbol mentioned in prose is not necessarily explained, and a source docstring does not prove an example works.

| Dimension | Evidence |
| --- | --- |
| Source documentation | An ODoc `<key>` in tracked JavaScript or Java source |
| Prose mention | Literal occurrence in repository guides or skills; useful for discovery only |
| Reviewed authoring contract | Curated reference and loader entry in [coverage.json](../tools/docs/coverage.json) |
| Runnable example | Linked canonical `.js`/`.yaml` file and named fixture test |
| Executed example | Successful test report for a specific runtime version and JAR SHA-256 |

## Generate the inventory

From the repository root, with Python 3:

```sh
python3 tools/docs/check.py --report /tmp/openaf-doc-coverage.json
python3 tools/docs/test_examples.py --jar openaf.jar --report /tmp/openaf-example-results.json
python3 tools/docs/check.py --execution-report /tmp/openaf-example-results.json --report /tmp/openaf-doc-coverage.json
```

The static checker validates inline local Markdown link destinations and registered embedded example copies. It does not fetch external links, resolve reference-style links, or validate heading fragments. Canonical examples in the new authoring guides are linked rather than copied. Existing skill copies registered in the manifest must match their asset exactly, ignoring outer whitespace.

Run the checker's own negative regression cases with `python3 -m unittest discover -s tools/docs -p 'test_check.py'`; they cover broken links, copied-code drift, source candidates, and stale execution evidence.

The JSON inventory collects ODoc keys from tracked `js/` and `src/openaf/` sources, column-zero global function and OpenWrap prototype candidates, and top-level built-in jobs from `ojob.yaml`. Each entry links to source locations and matching prose. Candidate extraction is deliberately conservative: it misses dynamic definitions, nested object APIs, and undocumented Java exports, and may include private implementation functions. **Candidate counts are an audit backlog, not a public-API coverage percentage.** Built-in job metadata remains canonical in `ojob.yaml`; inspect its `help`, `check`, and `typeArgs.shortcut` fields when expanding coverage.

Initial static baseline (2026-10-04): 2,178 distinct inventory entries, including 1,792 with ODoc keys and 386 candidates without matching keys. The curated subset starts with nine API contracts and seven workflow/integration features. Regenerate the report for current counts; these categories do not measure documentation completeness.

The curated inventory starts with the authoring task contracts and workflow features exercised by this change. It is not a claim that other documented APIs lack contracts. Extend it after checking actual signatures, defaults, output shapes, failures, and loaders. Source metadata and execution status remain separate, because a local JAR can differ from the working tree.

## Keep coverage current

When changing an authoring-facing API or adding a recipe:

1. Update its source ODoc and canonical guide; specify version restrictions when known.
2. Add a small runnable fixture or reuse an existing one. Include sample input, invocation, expected output, dependencies, and failure behavior.
3. Register the contract/feature and test in `coverage.json`. New embedded copies also need a `copies` entry.
4. Run the checks with the selected runtime. Reports mark entries executed only when the named test passed and its example files ran in a successful suite. The checker rejects reports whose runner or executed example hashes have changed. Static-only runs leave execution unverified.

The CI workflow runs static checks and the default runtime suite against its built JAR, then uploads both reports. Tests isolate file writes in temporary directories, bind HTTP fixtures to loopback, bound process lifetimes, and verify outputs and cleanup. Badgen integration is opt-in (`--integration`), requires an installed package, and never installs it. No paid providers or remote service credentials are required by the default suite.

## Prioritize the next gaps

Use the inventory to review candidates without ODoc and widely used APIs without practical examples. Prioritize file/stream IO, HTTP, subprocesses, argument/data flow, package loading, resource lifetimes, and failure handling before obscure helpers. Promote entries from mention to reviewed contract only after checking the implementation; promote execution only with a fresh report.

For AI retrieval, use `symbol`, `sources`, `mentioned_in`, and curated `loader`, `reference`, `examples`, and `test` fields to select small relevant documents. Retain runtime provenance and uncertainty. The portable [skills index](./index.md#portable-authoring-skills) remains the instruction entry point; this inventory supplies evidence rather than a competing instruction system.

Repository guides are the first publication surface. Website synchronization and a minimum-version runtime matrix are separate follow-ups; a successful current-JAR run does not establish historical compatibility.
