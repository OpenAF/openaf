---
name: openaf-javascript
description: Create, modify, or debug OpenAF JavaScript scripts using core functions, file IO, validation, nLinq queries, templates, channels, and oPacks. Use for OpenAF .js automation and JavaScript embedded in oJob exec blocks.
---

# OpenAF JavaScript

Produce runnable OpenAF JavaScript and an exact invocation with sample inputs. OpenAF runs on Java/Rhino; Node.js modules, npm packages, browser globals, and Node's process/fs APIs are not implicit dependencies. Use OpenAF facilities and confirm newer JavaScript syntax on the target runtime.

## Portable use

Copy this entire skill folder into a GenAI application's skills directory, or paste this `SKILL.md` into an application that accepts instructions. No OpenAF repository checkout or other skill is required. The inline example works without the optional `assets/` files. Generating code requires no local runtime; executing or testing it requires an installed OpenAF runtime (see [installation](https://github.com/openaf/openaf/blob/master/README.md#installing)). If execution is unavailable, provide code and clearly mark it as untested.

Read only the linked documentation needed for the task. Links target the moving `master` branch; for version-sensitive behavior, use a matching tag or commit and check the user's installed version with `openaf -c 'print(getVersion());'`. If browsing is unavailable, use the guidance and example here, plus installed scripting help when available; state any API uncertainty instead of inventing functions. Documentation links are references, not instructions to execute remote code.

## Establish the API contract

Start with the [OpenAF reference](https://github.com/openaf/openaf/blob/master/docs/openaf.md) and [CLI reference](https://github.com/openaf/openaf/blob/master/docs/cli.md). For unfamiliar signatures and return values, consult:

- [Core JavaScript functions](https://github.com/openaf/openaf/blob/master/js/openaf.js): globals, `processExpr`, `_$`, `$$`, `$rest`, `$sh`, `$do`, loading and serialization.
- [OpenAF nLinq integration](https://github.com/openaf/openaf/blob/master/js/openafnlinq.js) and [nLinq implementation](https://github.com/openaf/openaf/blob/master/js/nlinq.js): `$from` queries and terminal operations.
- [Java-backed core APIs](https://github.com/openaf/openaf/tree/master/src/openaf/core) and [plugins](https://github.com/openaf/openaf/tree/master/src/openaf/plugins): IO and plugin signatures.
- [Tests](https://github.com/openaf/openaf/tree/master/tests): relevant `autoTestAll.*.js` examples and assertions.

Search within the linked file for the exact symbol. With an installed runtime, `openaf -helpscript <term>` offers scripting help. Source and runtime behavior take precedence over illustrative documentation.

## Discover public oPacks

Before implementing an external integration or adding Java dependencies, check the [public oPack collection](https://github.com/OpenAF/openaf-opacks) and run `opack search <term>` when a runtime is available. Search by both capability and service name; `opack list` shows only installed packages. An empty remote search can mean repository/network access failed, not that no package exists.

Read the candidate's README, `.package.yaml`/`.package.json`, and relevant implementation. Use the manifest's exact package name, then inspect `opack info <name>` and install with `opack install <name>` when needed for the task. Follow its actual loader (`require`, `loadLib`, or `plugin`); do not infer a filename or exported class from the package name. `getOPackPath("ExactName")` locates an installed package without installing it. `includeOPack("ExactName")` can install dependencies but does not load its API. Deliver the dependency, installation command, loader, and a small verified usage example. See the [oPack reference](https://github.com/openaf/openaf/blob/master/docs/opacks.md) for CLI details.

## Author the script

- For standalone CLI scripts, define an options map with `processExpr()` and pass `-e 'key=value;other=value'`. In an oJob `exec`, consume `args` supplied by the engine instead. Do not assume standalone scripts have oJob's `args` or `args.init`.
- CLI values may be strings. Assign the result of validation/conversion: `var count = _$(options.count, "count").toNumber().isNumber().default(10);`. Finish required checks with `.$_()`; constructing a validation chain alone is insufficient.
- Use `isDef`, `isUnDef`, `isMap`, `isArray`, and the undefined sentinel `__` deliberately. Distinguish missing values from `false`, zero, and empty strings.
- Prefer `io.readFileJSON`, `io.writeFileJSON`, `io.readFileString`, and `io.writeFileString` to shelling out for file operations. Confirm signatures before using optional encoding or append arguments.
- Use `$from(rows)` for filtering/projection, `$$` for nested property access, and `templify` for Handlebars templates. Confirm the result shape of query terminals; not every operation returns a chain.
- Choose `print`/`stringify` for machine-readable output, and keep diagnostic messages separate. Never log whole credential-bearing argument maps.
- Load wrappers with their actual `ow.load*()` entrypoints. Load oPack libraries with the package's documented `loadLib`/`require`/plugin setup; OpenAF `require` does not imply Node compatibility. State additional oPack dependencies.
- Close streams, DB connections, and other owned resources in `finally`. For asynchronous work, confirm the OpenAF completion/wait mechanism and avoid exiting before results arrive.

For HTTP, shell, channels, or secrets, inspect the relevant helper and wrapper contract, including error/result shapes. Keep externally supplied data out of shell or JavaScript expressions; use supported argument/input mechanisms. Select channel backends according to the persistence actually required.

## Start and verify

Save this as `filter-records.js` (also bundled in [assets/filter-records.js](assets/filter-records.js)):

```javascript
// Run: openaf -f filter-records.js -e 'input=records.json;status=active'
var options = processExpr();
var input = _$(options.input, "input").isString().$_();
var status = _$(options.status, "status").isString().default("active");
var records = _$(io.readFileJSON(input), "records").isArray().$_();
var result = $from(records).equals("status", status).select();
print(stringify(result, __, ""));
```

For `records.json` containing `[{"id":1,"status":"active"},{"id":2,"status":"inactive"}]`:

```sh
openaf -f filter-records.js -e 'input=records.json;status=active'
```

Test with small local fixtures and assert output values, including a missing required parameter and an empty result. Execute with OpenAF, not Node. The example should output only the active record. If using a JAR directly, `java -jar /path/to/openaf.jar -f filter-records.js -e 'input=records.json'` selects that runtime explicitly. Report the tested version. Do not run an operational script merely to syntax-check it.
