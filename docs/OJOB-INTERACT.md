# Event-driven interaction jobs

`ojob interact` keeps a console, TUI or JavaFX view open while existing jobs handle
user input and timer events. See [the complete example](../examples/ojob-interact.yaml).
From the repository root, build with `ojob build.yaml`, then run:

```sh
java -jar openaf.jar --ojob -e "examples/ojob-interact.yaml mode=tui"
```

Choose `mode=console` for line input or `mode=javafx` for a graphical window.
Use a build containing this feature; JavaFX additionally requires `plugin-DesktopJavaFX`.

```yaml
include:
- ojob.yaml
todo:
- (interact):
    mode: console
    view:
      items:
      - { id: go, type: button, label: Run }
    state: { count: 0 }
    bindings:
      action:go: Work
    reducer: Update
jobs:
- name: Work
  exec: args.message = "Finished"
- name: Update
  exec: |
    if (args.error) args.state.error = args.error
    else args.state.count++
    args.close = true
```

Options: `mode` defaults to `console`; `title`, `view`, `state`, `bindings`,
`reducer`, `concurrency` (default 4) and `interval` (milliseconds, optional).
Bindings use `init`, `action:<id>`, `change:<id>` and `timer`. A binding is a job
name or `{job: name, args: {...}}`. Initialization finishes before timers start.

Handlers receive independent `event`, `values` and `state` snapshots, plus binding
arguments. Their changed arguments become `result` for the reducer. Reducers run
serially and receive **current** `state`, the original `event`, `result` or `error`.
Set `args.state`, optionally `args.view` and `args.close`. A new view replaces the
whole view, including field values; retain desired field values in state.
Uncaught handler failures reach the reducer; a job's explicit catch policy remains
in effect. Reducer failures terminate the session after draining handlers.

At most `concurrency` handlers run together. Actions received at capacity are
rejected; changes coalesce per field and timer ticks coalesce. A timer binding has
at most one invocation running. Events for replaced views are discarded. This
coordinates returned state, not external side effects or global variables inside jobs.

Console mode presents numbered controls and accepts completed lines. Timer and
reducer processing continues during input; view output waits for the next prompt.
If a view changes during input, that answer is discarded and the new menu is shown.
Use `q`, EOF or Ctrl-C at the main action prompt to close; cancelling a field selection returns to the action prompt. TUI uses the existing terminal provider and JavaFX
uses the optional graphical provider. Neither provider is selected implicitly.

Closing stops event acceptance and timers, closes the display and drains running
handlers and their reducers. The embedded job returns `{state, outcome}` in
`args.interaction`. Jobs should return results instead of printing while the UI is
active: process-wide output is not captured. Cooperative or forced cancellation is
not provided.

`ow.screen.interact(options)` is also callable directly. `consoleUI` may supply a
borrowed `askConsole`-compatible object (`read`, `write`, `raw`) for custom input
or deterministic testing; it is never closed by the session.

For a borrowed TUI terminal, provide `terminalUI` with the `askConsole` contract,
including `ansi`, `size` and `altScreen`. The provider restores its terminal state
and leaves the borrowed terminal open.

Console text and password fields use `ask`, and select/checkbox fields use
`askChoose`. ANSI terminals retain the normal arrow-key selection; plain terminals
use numbered choices. Password fields pass `"*"` as the mask rather than echoing
input. Native text prompts keep JLine cursor editing, history and completion.

The prompt helpers accept an optional final options map. For example:

```javascript
var ui = askConsole()
try {
  var options = { onIdle: function() { processPendingEvents(); return !finished }, pollInterval: 50 }
  var name = ask("Name: ", __, ui, true, ui.write, options)
  var choice = askChoose("Action", ["Run", "Close"], __, __, ui, options)
} finally {
  ui.close()
}
```

`onIdle` runs on the input thread before reads and while waiting, with a default
poll interval of 50 milliseconds. Return `false` to cancel (`null` for `ask`,
`undefined` for choice helpers). Exceptions propagate after input cleanup. Keep the
callback short and avoid starting another prompt or printing over the current one.
The same options are forwarded by `askEncrypt`, `askDef`, `askN`, `ask1` and
`askStruct`. Existing calls without options retain their original input behavior.
