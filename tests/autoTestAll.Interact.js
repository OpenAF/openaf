(function() {
  function ui(keys) {
    var input = String(keys || ""), n = 0, deadline = now() + 5000
    return { closed: false, raw: function(fn) { return fn() }, write: function() {},
      read: function() { if (now() > deadline) throw "Interaction test deadline exceeded"; if (n < input.length) return input.charCodeAt(n++); sleep(5, true); return -2 },
      close: function() { this.closed = true }
    }
  }
  function options() {
    return { mode: "console", view: { items: [
      { id: "slow", type: "button", label: "Slow" },
      { id: "fast", type: "button", label: "Fast" }
    ] }, state: { completed: [], ticks: 0 }, reducer: "Interact fixture reducer" }
  }
  exports.testConcurrentResults = function() {
    var o = options(), terminal = ui("1\n2\n")
    o.consoleUI = terminal
    o.bindings = {
      "action:slow": { job: "Interact fixture handler", args: { delay: 300, label: "slow" } },
      "action:fast": { job: "Interact fixture handler", args: { delay: 10, label: "fast" } }
    }
    var r = ow.screen.interact(o)
    ow.test.assert(r.state.completed, ["fast", "slow"], "Reducers preserve out-of-order concurrent results")
    ow.test.assert(terminal.closed, false, "Borrowed input remains open")
  }
  exports.testTimer = function() {
    var o = options()
    o.consoleUI = ui()
    o.interval = 5
    o.bindings = { timer: { job: "Interact fixture handler", args: { tick: true, delay: 30 } } }
    var r = ow.screen.interact(o)
    ow.test.assert(r.state.ticks, 2, "Timers run while a console prompt is pending")
    o.state = { completed: [], ticks: 0 }
    o.consoleUI = ui("1\n")
    o.view = { items: [{ id: "mode", type: "select", label: "Mode", options: ["one", "two"] }] }
    ow.test.assert(ow.screen.interact(o).state.ticks, 2, "Timers also run while a choice prompt is pending")
  }
  exports.testCloseDrain = function() {
    var o = options()
    o.consoleUI = ui("1\nq\n")
    o.bindings = { "action:slow": { job: "Interact fixture handler", args: { delay: 100, label: "drained" } } }
    var r = ow.screen.interact(o)
    ow.test.assert(r.state.completed, ["drained"], "Closing drains results into final state")
  }
  function clearExpectedFailure(name) {
    // Negative tests create isolated oJob log records; do not count their expected
    // failures as scheduler failures when the outer YAML runner exits.
    ow.oJob.getLogCh().forEach(function(k, v) {
      if (k.name == name && String(k.ojobId).indexOf("|interact-") >= 0 && v.error) ow.oJob.getLogCh().unset(k)
    })
  }
  exports.testHandlerFailure = function() {
    var o = options()
    o.consoleUI = ui()
    o.bindings = { init: "Interact fixture failure" }
    var r = ow.screen.interact(o)
    clearExpectedFailure("Interact fixture failure")
    ow.test.assert(r.state.failure.indexOf("fixture failure") >= 0, true, "Thrown handler errors reach reducer")
  }
  exports.testReducerFailure = function() {
    var o = options(), failed = false
    o.consoleUI = ui()
    o.state.failReducer = true
    o.bindings = { init: "Interact fixture handler" }
    try { ow.screen.interact(o) } catch(e) { failed = String(e).indexOf("reducer failure") >= 0 }
    clearExpectedFailure("Interact fixture reducer")
    ow.test.assert(failed, true, "Reducer errors propagate to caller")
  }
  exports.testTUI = function() {
    ow.loadDesktop()
    loadCompiledLib("owrap_desktop_ui_js")
    var terminal = ui("\r\t\r")
    var originalRead = terminal.read, readyAt = now() + 500
    terminal.read = function() { if (now() < readyAt) { sleep(5, true); return -2 } return originalRead() }
    terminal.ansi = true
    terminal.size = function() { return { width: 80, height: 24 } }
    terminal.altScreen = function(on) { terminal.alt = on }
    var o = options()
    o.mode = "tui"
    o.bindings = {
      "action:slow": { job: "Interact fixture handler", args: { delay: 300, label: "slow" } },
      "action:fast": { job: "Interact fixture handler", args: { delay: 10, label: "fast" } }
    }
    o.terminalUI = terminal
    {
      var r = ow.screen.interact(o)
      ow.test.assert(r.state.completed, ["fast", "slow"], "TUI messages dispatch concurrent jobs")
      ow.test.assert(terminal.alt, false, "TUI restores alternate screen")
    }
  }
  exports.testCapacity = function() {
    var o = options()
    o.concurrency = 1
    o.consoleUI = ui("1\n2\nq\n")
    o.bindings = {
      "action:slow": { job: "Interact fixture handler", args: { delay: 100, label: "slow" } },
      "action:fast": { job: "Interact fixture handler", args: { delay: 10, label: "fast" } }
    }
    ow.test.assert(ow.screen.interact(o).state.completed, ["slow"], "Actions are rejected at capacity")
  }
  exports.testEmbedded = function() {
    var o = options()
    o.state.stopOnInit = true
    o.bindings = { init: "Interact fixture handler" }
    var definition = io.readFileYAML("../ojob.yaml").jobs.filter(function(j) { return j.name == "ojob interact" })[0]
    definition.type = "simple"
    ow.oJob.getJobsCh().set({ name: definition.name }, definition)
    ow.oJob.addShortcuts(definition)
    var todo = ow.oJob.parseTodo({ "(interact)": o })
    ow.test.assert(todo.name, "ojob interact", "Shortcut resolves to embedded job")
    var r = $job(todo, {})
    ow.test.assert(r.interaction.state.stopOnInit, true, "Embedded job returns final state")
  }
  exports.testConsoleControls = function() {
    var o = options(), terminal = ui("1\nAda\n2\nsecret\n3\n2\n3\n\n4\n2\n4\n\n5\n"), output = []
    terminal.write = function(s) { output.push(String(s)) }
    o.consoleUI = terminal
    o.view = { items: [
      { id: "name", type: "input", label: "Name", value: "" },
      { id: "password", type: "input", label: "Password", password: true, value: "" },
      { id: "language", type: "select", label: "Language", options: ["English", "Portuguese"] },
      { id: "enabled", type: "checkbox", label: "Enabled", value: false },
      { id: "finish", type: "button", label: "Finish" }
    ] }
    o.bindings = { "action:finish": { job: "Interact fixture handler", args: { close: true } } }
    var result = ow.screen.interact(o)
    ow.test.assert(result.state.values, { name: "Ada", password: "secret", language: "Portuguese", enabled: "true" }, "Console helpers feed normalized form values to jobs")
    ow.test.assert(output.join("").indexOf("secret"), -1, "Screen password fields stay masked")
  }
  exports.testValidation = function() {
    var o = options(), failed = false
    o.concurrency = 0
    try { ow.screen.interact(o) } catch(e) { failed = true }
    ow.test.assert(failed, true, "Invalid concurrency rejected before opening input")
  }
})()
