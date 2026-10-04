# Scheduling and retries

Use the [periodic recipe](https://github.com/openaf/openaf/blob/master/docs/ojob-recipes.md) and [retry contract](https://github.com/openaf/openaf/blob/master/docs/ojob-security.md). Periodic jobs require registration in `todo` and a daemon lifecycle. Set `waitForFinish` when overlapping executions are unwanted, and register shutdown cleanup for owned resources.

First test one ordinary job invocation with the same body and fixed inputs:

```yaml
ojob:
  sequential: true
  logToConsole: false
jobs:
- name: Tick
  exec: |
    print("tick: ok");
todo:
- Tick
```

Run `ojob tick.yaml`; expect one `tick: ok` and termination. Only then adapt Tick to `type: periodic`, set `typeArgs.cron`, and enable `ojob.daemon`. Test the daemon with an external bounded lifetime and verify cleanup; a successful single invocation does not prove scheduling.

For retry tracking, configure the periodic job's `typeArgs.cronCheck` with `active: true`, a named `ch`, `retries`, and `retryWait`. The counter includes the initial attempt: `retries: 3` permits up to three attempts when `retryWait` is supplied. The default channel is in memory; use a supported persistent backend when restart survival is required. Check exact configuration in the linked recipe rather than treating this as a general retry option for ordinary jobs.
