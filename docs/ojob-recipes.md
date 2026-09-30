# oJob Recipes

[Index](./index.md) | [oJob Reference](./ojob.md) | [Security](./ojob-security.md) | [Examples from ojob.io](./ojob-examples.md)

Each YAML block below is a complete definition. Save it to a file and run `ojob file.yaml`. The periodic and subscriber recipes run until interrupted; the template recipe writes `greeting.txt`. These examples need only OpenAF. Larger integrations and their dependencies are listed in the [examples map](./ojob-examples.md).

## 1. Arguments, defaults, and output

Save as `greet.yaml`; run `ojob greet.yaml name=Ada count=2 -json`. Omit `count` to use 1. `help` describes the interface; `check.in` converts and validates input. `ow.oJob.output` respects the CLI's output format.

```yaml
help:
  text: Produce a greeting
  expects:
  - name: name
    desc: Person to greet
    mandatory: true
    example: Ada
  - name: count
    desc: Number of greetings (defaults to 1)
    example: "2"

ojob:
  logToConsole: false

todo:
- Greet

jobs:
- name: Greet
  check:
    in:
      name: isString
      count: toNumber.isNumber.default(1)
  exec: |
    if (args.count < 1 || args.count > 10 || Math.floor(args.count) != args.count) {
      throw "count must be an integer between 1 and 10";
    }
    var greetings = [];
    for (var i = 0; i < args.count; i++) greetings.push("Hello " + args.name);
    ow.oJob.output({ greetings: greetings }, args);
```

## 2. Compose preparation and formatting around a job

`from` runs before `exec`; `to` runs after it. Only `Calculate` is scheduled. The output is `42`.

```yaml
ojob:
  logToConsole: false

todo:
- Calculate

jobs:
- name: Prepare
  exec: |
    args.value = 21;

- name: Calculate
  from: [Prepare]
  to: [Display]
  check:
    in:
      value: isNumber
    out:
      result: isNumber
  exec: |
    args.result = args.value * 2;

- name: Display
  exec: |
    print(args.result);
```

## 3. Query and output without custom JavaScript

`((key)): args` selects the invocation map; `((from))` and `((to))` are paths in that map. A JMESPath expression needs `((type)): path`. `(output): args` with `((path))` selects a property; `(output): active` would instead read `$get("active")`.

```yaml
ojob:
  sequential: true
  shareArgs: true
  logToConsole: false

todo:
- (pass):
    records:
    - { name: Ada, status: active }
    - { name: Grace, status: inactive }
- (query): "[?status=='active']"
  ((type)): path
  ((key)): args
  ((from)): records
  ((to)): active
- (output): args
  ((path)): active
  ((format)): json
```

## 4. Sequential iteration over argument maps

`(each)` visits each array element in order and merges that element's properties into the child job's arguments. It differs from the producer/consumer `jobs[].each` pattern below.

```yaml
ojob:
  sequential: true
  shareArgs: true
  logToConsole: false

todo:
- (pass):
    items:
    - { name: Ada }
    - { name: Grace }
- (each): items
  ((key)): args
  ((todo)): [Greet item]

jobs:
- name: Greet item
  check:
    in:
      name: isString
  exec: |
    print("Hello " + args.name);
```

## 5. Producer/consumer fan-out

The producer calls `each(map)` for each work item. Consumer jobs receive that map plus `init`; pass other required values explicitly. `eachThreads` belongs on the producer and limits consumer concurrency. Output order is unspecified. This follows the structure used by `docker/mirrorImages.yaml` without invoking a registry or external command.

```yaml
ojob:
  logToConsole: false

init:
  prefix: Item

todo:
- Produce

jobs:
- name: Produce
  each: [Consume]
  typeArgs:
    eachThreads: 2
  exec: |
    [1, 2, 3].forEach(function(value) {
      each({ value: value });
    });

- name: Consume
  check:
    in:
      value: isNumber
  exec: |
    print(args.init.prefix + " " + args.value);
```

## 6. Write a template result to a file

`((outputFile))` selects a file. `((out))` selects a stored result key and does not write a file. Keep global argument templating disabled here so `{{name}}` is resolved using the template job's `data`.

```yaml
ojob:
  templateArgs: false
  logToConsole: false

todo:
- (template): "Hello {{name}}!"
  ((data)): { name: World }
  ((outputFile)): greeting.txt
```

## 7. Periodic service

Registration in `todo` and `daemon: true` are both needed for this service. Stop with Ctrl-C. The top-level daemon callback receives no `args`; scheduled work belongs in the periodic job.

```yaml
ojob:
  daemon: true
  cronInLocalTime: false

todo:
- Tick
- Cleanup

jobs:
- name: Tick
  type: periodic
  typeArgs:
    cron: "*/5 * * * * *"
    waitForFinish: true
  exec: |
    log("Tick " + new Date());

- name: Cleanup
  type: shutdown
  exec: |
    log("Service stopped");
```

For retry tracking, add this map under the periodic job's `typeArgs`:

```yaml
cronCheck:
  active: true
  ch: oJob::cron
  retries: 3
  retryWait: 2000
```

The counter includes the initial attempt. The default channel is in memory; it does not retain missed-run history across process restarts. See [state and scheduling](./ojob.md#state-and-scheduling).

## 8. Channel subscription

The channel exists before the subscriber is registered. Subscribe callbacks receive `args.ch`, `args.op`, `args.k`, and `args.v`. This example remains running after publishing one event so the asynchronous subscriber can process it; stop with Ctrl-C.

```yaml
ojob:
  daemon: true
  channels:
    create:
    - name: events

todo:
- Observe
- Publish

jobs:
- name: Observe
  type: subscribe
  typeArgs:
    chSubscribe: events
  exec: |
    if (args.op == "set") print(args.v.message);

- name: Publish
  exec: |
    $ch("events").set({ id: 1 }, { message: "Hello subscriber" });
```

## 9. Recover from an error

A truthy return from `catch` marks the failure handled. Without that return, a logging-only handler leaves it unhandled. `to` is skipped when the body throws; put mandatory cleanup inside `try/finally`.

```yaml
ojob:
  sequential: true
  shareArgs: true
  logToConsole: false

todo:
- Read optional value
- Report

jobs:
- name: Read optional value
  exec: |
    throw "Example failure";
  catch: |
    args.value = "fallback";
    return true;

- name: Report
  exec: |
    print(args.value);
```

## 10. Select a branch from an argument

Run with `mode=fast` or `mode=full`; the default is `fast`. `(optionOn)` takes the **argument name**, while `((todos))` maps its possible values to todo lists.

```yaml
ojob:
  sequential: true
  shareArgs: true
  logToConsole: false

todo:
- Configure
- (optionOn): mode
  ((todos)):
    fast: [Fast]
    full: [Full]

jobs:
- name: Configure
  check:
    in:
      mode: isString.oneOf(['fast', 'full']).default('fast')

- name: Fast
  exec: |
    print("Fast selected");

- name: Full
  exec: |
    print("Full selected");
```

## Adapting integration examples

For secrets, use `(secget)` with `((secOut))` to choose the destination in `args`, then validate the resulting fields. A configured secret repository is required; `(run)` is for an external definition, not a local job name.

For metrics, configure `ojob.metrics.add` for collectors, `ojob.metrics.passive` for an endpoint, and `ojob.metrics.active` for push delivery. The push interval is `ojob.metrics.active.periodInMs`, alongside `openmetrics` or `nattrmon`. Use [instrumentation](./instrumentation.md) for tracing rather than treating metrics as job execution records.

For package jobs, copy the source definition's `ojob.opacks` **and** its `include`/`jobsInclude` entries. HTTP/MCP shortcuts are supplied by those libraries. Review the [source examples](./ojob-examples.md) before adapting an integration to your environment.
