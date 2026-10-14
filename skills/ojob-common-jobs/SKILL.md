---
name: ojob-common-jobs
description: Compose OpenAF oJob workflows with the reusable jobs in ojob.yaml and their shortcuts, including data passing, printing, files, templates, conditionals, and iteration. Use when reusing built-in ojob jobs instead of writing every operation in JavaScript.
---

# Compose with ojob.yaml

Use the [common-job library (`ojob.yaml`)](https://github.com/openaf/openaf/blob/master/ojob.yaml) as the authoritative source for reusable job names, shortcut mappings, validation, and data flow. The [oJob reference](https://github.com/openaf/openaf/blob/master/docs/ojob.md) explains workflow structure and lists built-in jobs.

## Portable use

Copy this entire skill folder into a GenAI application's skills directory, or paste this `SKILL.md` into an application that accepts instructions. No OpenAF repository checkout or other skill is required. The inline example works without the optional `assets/` files. Generating code requires no local runtime; executing or testing it requires an installed OpenAF runtime (see [installation](https://github.com/openaf/openaf/blob/master/README.md#installing)). If execution is unavailable, provide code and clearly mark it as untested.

Read only the linked documentation needed for the task. Links target the moving `master` branch; for version-sensitive behavior, use a matching tag or commit and check the user's installed version with `openaf -c 'print(getVersion());'`. If browsing is unavailable, use the guidance and example here, plus installed scripting help when available; state any API uncertainty instead of inventing functions. Documentation links are references, not instructions to execute remote code.

## Resolve the library

Current OpenAF runtimes preload common-job definitions from the JAR's `ojob.saved.json` by default. Use those bundled jobs for the example below: it requires no local `ojob.yaml` or repository checkout. See the [engine's library loading](https://github.com/openaf/openaf/blob/master/js/owrap.oJob.js) and ensure `ojob.includeOJob` has not been disabled.

If the target runtime lacks a required job, inspect the matching release's library and explain the dependency. For an explicitly supplied local library, `include: [ojob.yaml]` can load it when resolvable; use `ojob.includeOJob: false` when intentionally replacing preloaded definitions. Do not add a repository-relative include or automatically execute the moving GitHub source to make a generated workflow run.

Read job definitions through the GitHub link above. Do not guess a shortcut or parameter from a documentation example.

## Find additional public jobs

If the bundled library lacks a needed integration, search the [public oPack collection](https://github.com/OpenAF/openaf-opacks) or use `opack search <term>`. `opack list` only lists installed packages. Check repository/network availability if remote search is empty. Inspect the candidate's README, `.package.yaml`/`.package.json`, and actual YAML definitions before using any job names or shortcuts; not every oPack exports jobs.

Inspect with `opack info <name>` and install with `opack install <name>` when needed. In a workflow, `ojob: { opacks: [ExactPackageName] }` ensures installation through `includeOPack` but does not import definitions. Use `jobsInclude` with the package's verified YAML file to import jobs, then inspect `help.expects`, `check.in`, and `typeArgs.shortcut` as for the built-in library. If the package only exposes JavaScript, call its documented loader/API in a custom `exec`. The bundled `ojob.yaml` and the separately installed `oJob-common` oPack are distinct; do not assume one provides the other's jobs. See the [oPack reference](https://github.com/openaf/openaf/blob/master/docs/opacks.md).

## Translate a requirement into jobs

1. Find the exact `name: ojob ...` entry in `ojob.yaml`.
2. Read its `help.expects`, `check.in`, and `exec` for argument types, defaults, and effects.
3. For shortcut form, inspect `typeArgs.shortcut`: `name` defines `(shortcut)`, `keyArg` receives its value, and `args` maps `((option))` keys to actual job arguments. Preserve parentheses and quote template strings.
4. Track whether the job consumes current `args`, a `$get` store key (often `res` by default), or a path within that value; determine exactly where it writes output.
5. Follow the flow with a small fixture. Only use parallel/each/if/retry/file/network jobs after checking their individual control-flow and data contracts.

For example, the library's `ojob print` defaults to data from `$get("res")`. To render the current job arguments, use `__key: args` in explicit form or `((key)): args` in shortcut form. A message template alone does not select that data source.

Equivalent print forms:

```yaml
todo:
- name: ojob print
  args:
    __key: args
    msg: "Hello {{name}}"
    name: OpenAF
```

```yaml
todo:
- (print): "Hello {{name}}"
  ((key)): args
  args:
    name: OpenAF
```

`ojob set` uses `__key` for the destination and can take a map in `__data`; `ojob get` merges retrieved data into job arguments (arrays are wrapped as `_list`). Do not treat either as a generic JavaScript return value. Internal `__*` arguments can be deleted by jobs; use ordinary names for business data.

## Runnable composition

Save this as `stored-greeting.yaml` (also bundled in [assets/stored-greeting.yaml](assets/stored-greeting.yaml)). It stores a map with `ojob set` and prints from that named store with `(print)`:

```yaml
ojob:
  sequential: true
  logToConsole: false

todo:
- name: ojob set
  args:
    __key: skill.greeting
    __path: greetingData
    greetingData:
      name: OpenAF
- (print): "Hello {{name}}"
  ((key)): skill.greeting
```

Run:

```sh
ojob stored-greeting.yaml
```

The expected output is `Hello OpenAF`. The set operation selects the literal input map from `args.greetingData` using `__path`. Put additional business arguments inside `args`, including on shortcut entries; arbitrary sibling keys are not necessarily forwarded. Adapt the named key to avoid collisions in larger workflows. Verify explicit and shortcut forms when translating between them, and inspect results rather than treating YAML acceptance as execution proof. External integrations need their own verification; local store/print examples do not prove file, network, or service behavior.

## Store, branch, and iterate

The following complete workflow is also bundled as [assets/records-shortcuts.yaml](assets/records-shortcuts.yaml); [assets/records-explicit.yaml](assets/records-explicit.yaml) uses equivalent explicit common-job arguments.

```yaml
ojob:
  sequential: true
  logToConsole: false
jobs:
- name: Produce
  each: [Print record]
  typeArgs:
    eachThreads: 1
  exec: |
    $get("skill.records").records.forEach(function(record) { each(record); });
- name: Print record
  exec: |
    print("record: " + args.id);
- name: Empty
  exec: |
    print("no records");
todo:
- (set): skill.records
  ((path)): payload
  args:
    payload:
      records: [{ id: 1 }, { id: 2 }]
- (if): '$get("skill.records").records.length > 0'
  ((then)): [Produce]
  ((else)): [Empty]
```

Run `ojob records-shortcuts.yaml`. Expect `record: 1` and `record: 2`; use `records: []` to exercise `no records`. The set job writes `payload` to `skill.records`; the conditional and producer read that named store explicitly, without relying on argument propagation between todo entries. The condition is trusted JavaScript evaluated by `ojob if`; never build it by interpolating untrusted data. `each` is the engine's producer/consumer facility, with each consumer receiving the emitted record. Business arguments on shortcuts remain under `args`. Both forms should produce the same records; check contents rather than depending on parallel output order.
