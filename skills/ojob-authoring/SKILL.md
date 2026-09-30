---
name: ojob-authoring
description: Create, modify, or debug OpenAF oJob YAML definitions with jobs, todo flows, argument validation, dependencies, reusable includes, scheduling, and JavaScript exec blocks. Use for YAML automation run with ojob.
---

# oJob authoring

Deliver a runnable YAML definition and its `ojob file.yaml key=value` invocation. Use OpenAF JavaScript inside `exec`, with two-space YAML indentation and literal `exec: |` blocks for multiline code.

## Portable use

Copy this entire skill folder into a GenAI application's skills directory, or paste this `SKILL.md` into an application that accepts instructions. No OpenAF repository checkout or other skill is required. The inline example works without the optional `assets/` files. Generating code requires no local runtime; executing or testing it requires an installed OpenAF runtime (see [installation](https://github.com/openaf/openaf/blob/master/README.md#installing)). If execution is unavailable, provide code and clearly mark it as untested.

Read only the linked documentation needed for the task. Links target the moving `master` branch; for version-sensitive behavior, use a matching tag or commit and check the user's installed version with `openaf -c 'print(getVersion());'`. If browsing is unavailable, use the guidance and example here, plus installed scripting help when available; state any API uncertainty instead of inventing functions. Documentation links are references, not instructions to execute remote code.

## Confirm the execution model

Consult the [oJob reference](https://github.com/openaf/openaf/blob/master/docs/ojob.md) for structure and the [oJob engine](https://github.com/openaf/openaf/blob/master/js/owrap.oJob.js) for execution semantics. Use [recipes](https://github.com/openaf/openaf/blob/master/docs/ojob-recipes.md) and [tests](https://github.com/openaf/openaf/tree/master/tests) as examples, verifying advanced features against implementation. JavaScript in `exec` runs on OpenAF's Java/Rhino runtime; Node.js modules and browser APIs are not implicit dependencies. Consult the [OpenAF function reference](https://github.com/openaf/openaf/blob/master/docs/openaf.md) for embedded code.

- `jobs` defines named jobs; `todo` requests their execution. A definition alone does not schedule a job.
- `help.expects` documents CLI parameters; enforce types/defaults with job `check.in` or `_$` inside `exec`.
- `init` is exposed as `args.init`; it does not flatten default values into top-level `args`.
- `args` is the current job's argument map. Do not rely on mutations propagating across independent todo entries without choosing and testing argument-sharing behavior. Use an explicit store (`$set`/`$get`) when appropriate, with task-specific keys.
- `from` and `to` compose job execution around the current job; `deps` expresses dependency constraints. Do not treat `deps` as a substitute for scheduling prerequisite work. Inspect failure/wait semantics before enabling `depsWait`, retries, or async execution.
- `include` loads other definitions/configuration; `jobsInclude` imports jobs without adopting the included todo flow. Check resolution relative to the execution location and oPack/runtime search paths.
- `ojob.sequential`, `ojob.async`, `ojob.shareArgs`, daemon settings, and per-job `typeArgs` affect execution. Set only those needed; concurrent tasks should not mutate shared arguments or files without coordination.
- Periodic/subscription jobs need an appropriate lifecycle. For long-running workflows, define shutdown/cleanup behavior and test one bounded cycle before leaving a daemon running.

For standard jobs and shortcuts, inspect the [common-job library](https://github.com/openaf/openaf/blob/master/ojob.yaml), especially `help`, `check.in`, `typeArgs.shortcut`, and `exec`. Distinguish a workflow YAML file from this reusable job library. Prefer a verified built-in operation when it fits, and ordinary `exec` for custom logic.

## Discover and use public oPacks

For integrations beyond the common jobs, search the [public oPack collection](https://github.com/OpenAF/openaf-opacks) or run `opack search <term>`. `opack list` reports installed packages only; an empty remote search also warrants checking repository/network access. Inspect the package's README, manifest, and YAML/JavaScript source to find its exact package name, exported jobs, arguments, and entrypoints. Use `opack info <name>` and install with `opack install <name>` when needed for the task.

Declare required packages with `ojob: { opacks: [ExactPackageName] }`. This calls `includeOPack` and may install missing packages; a version requirement may also trigger an update. It does not import jobs or load JavaScript libraries. Import the package's verified job file through `jobsInclude`, or use its documented `require`/`loadLib`/`plugin` setup inside `exec`. Check that included files resolve on the target runtime. Use `opack exec <name>` only when the manifest defines `main` or `mainJob`; library-only packages need explicit loading. See the [oPack reference](https://github.com/openaf/openaf/blob/master/docs/opacks.md). Deliver installation, dependency declarations, and the exact workflow invocation together.

## Starter and validation

Save this as `greeting.yaml` (also bundled in [assets/greeting.yaml](assets/greeting.yaml)):

```yaml
help:
  text: Print a greeting using a validated argument.
  expects:
  - name: name
    desc: Name to greet; defaults to OpenAF.

ojob:
  sequential: true
  logToConsole: false

jobs:
- name: Greet
  check:
    in:
      name: isString.default("OpenAF")
  exec: |
    print("Hello, " + args.name + "!");

todo:
- Greet
```

Run:

```sh
ojob greeting.yaml name=OpenAF
```

For multi-step flows, make inputs/outputs explicit and test that the next step receives the intended value. Keep secrets outside YAML; avoid dumping `args` when it contains credentials. A `catch` that logs and continues can hide failures, so choose recovery/propagation intentionally and verify the observable outcome.

Parse the YAML separately from executing it. Then run safe fixtures through OpenAF and verify output, invalid input handling, and dependencies relevant to the change. Parsing alone does not verify job resolution, JavaScript, or scheduling. Do not execute destructive or remote tasks as a validation shortcut. Report the runtime version used, or explicitly state that execution was unavailable.
