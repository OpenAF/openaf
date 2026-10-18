(function() {
  var eq = function(a, b, text) { ow.test.assert(a, b, text); };
  function wait(p) { var end = now() + 5000; while (p.state.get() != p.states.FAILED && p.state.get() != p.states.FULFILLED && now() < end) sleep(10, true); if (p.state.get() == p.states.FAILED) throw p.reason; eq(p.state.get(), p.states.FULFILLED, "Desktop command settled"); return p.value; }
  function until(fn) { var end = now() + 3000; while (!fn() && now() < end) sleep(10, true); eq(Boolean(fn()), true, "Bounded terminal condition"); }
  function fails(fn, code) { var e; try { fn(); } catch(err) { e = err; } eq(e && e.code, code, "Expected structured error"); }
  function view() { return { items: [{ id: "status", type: "text", text: "Hello" }, { id: "name", type: "input", label: "Name", value: "" }, { id: "mode", type: "select", label: "Mode", options: ["one", "two"], value: "one" }, { id: "go", type: "button", label: "Go" }] }; }
  function terminal() {
    var queue = new java.util.concurrent.LinkedBlockingQueue(), output = new java.util.concurrent.ConcurrentLinkedQueue();
    return { ansi: true, width: 60, height: 12, rawOn: false, alt: false, closes: 0,
      read: function(timeout) { var c = queue.poll(isDef(timeout) ? timeout : 100, java.util.concurrent.TimeUnit.MILLISECONDS); return c == null ? -2 : Number(c); },
      size: function() { return { width: this.width, height: this.height }; },
      write: function(s) { output.add(String(s)); },
      raw: function(fn) { this.rawOn = true; try { return fn(); } finally { this.rawOn = false; } },
      altScreen: function(on) { this.alt = on; }, close: function() { this.closes++; },
      keys: function(text) { for (var i = 0; i < text.length; i++) queue.add(java.lang.Integer.valueOf(text.charCodeAt(i))); },
      output: function() { return String(output.toArray().join("")); }
    };
  }
  function desktop(ui) {
    ow.loadDesktop(); loadCompiledLib("owrap_desktop_ui_js");
    var d = new OpenWrap.desktop({ provider: "tui" }); d.registerProvider(OpenWrap.desktop.__tui(ui)); return d;
  }
  exports.testViewValidation = function() {
    var d = desktop(terminal());
    eq(OpenWrap.desktop.__view(d, view()).version, 1, "Version normalized");
    [ { items: [{ id: "x", type: "func", text: "evil()" }] }, { items: [{ id: "x", type: "text", text: "ok", html: "<b>bad</b>" }] }, { items: [{ id: "x", type: "select", label: "x", options: ["a"], value: "b" }] }, { items: [{ id: "x", type: "input", label: "x", value: "\x1b[2J" }] }, { items: [{ id: "constructor", type: "text", text: "x" }] }, { items: [{ id: "x", type: "text", text: "a" }, { id: "x", type: "button", label: "b" }] } ].forEach(function(v) { fails(function() { d.window({ view: v }); }, "INVALID_ARGUMENT"); });
    fails(function() { d.window({ view: view(), html: "hello" }); }, "INVALID_ARGUMENT");
    fails(function() { d.window({ view: view(), messaging: { types: ["x"] } }); }, "INVALID_ARGUMENT");
    fails(function() { d.window({ html: 123 }); }, "INVALID_ARGUMENT");
    eq(d.info().state, "uninitialized", "Validation does not start terminal");
  };
  exports.testNativeViews = function() {
    var ui = terminal(), d = desktop(ui), w = d.window({ title: "First", view: view(), security: { networkIsolation: true, strictNavigation: true } });
    try {
      wait(w.show()); until(function() { return ui.output().indexOf("Hello") >= 0; });
      eq(d.info().capabilities.declarativeViews, true, "Actual view capability");
      eq(d.info().capabilities.html, false, "No fake browser capability");
      eq(isUnDef(d.__server), true, "Native views open no HTTP service");
      var next = view(); next.items[0].text = "Updated"; wait(w.setView(next));
      until(function() { return ui.output().indexOf("Updated") >= 0; });
      next.items[0].text = "Sent"; wait(w.send("view", next)); until(function() { return ui.output().indexOf("Sent") >= 0; });
      fails(function() { w.send("status", {}); }, "INVALID_ARGUMENT");
      // Old-view input may race replacement; it must be retired before schema checks.
      d.__emit({ type: "message", windowId: w.id, viewRevision: 1, message: { type: "action", payload: { id: "retired", values: {} } } });
      fails(function() { d.__emit({ type: "message", windowId: w.id, viewRevision: w.__viewRevision, message: { type: "action", payload: { id: "retired", values: {} } } }); }, "INVALID_ARGUMENT");
      var p = d.dialog.alert("No native dialog"); $doWait(p, 5000); eq(p.reason.code, "UNSUPPORTED_CAPABILITY", "Unsupported dialogs fail");
      var html = d.window({ html: "<h1>Not a terminal view</h1>" }); $doWait(html.created, 5000); eq(html.created.reason.code, "UNSUPPORTED_CAPABILITY", "Browser content rejected");
      wait(w.close()); d.wait(5000);
    } finally { d.__cleanup(); }
    eq(ui.rawOn, false, "Raw attributes restored"); eq(ui.alt, false, "Alternate screen restored"); eq(ui.closes, 0, "Borrowed UI not closed");
  };
  exports.testControlsAndMessages = function() {
    var ui = terminal(), d = desktop(ui), events = new java.util.concurrent.LinkedBlockingQueue(), w = d.window({ view: view() });
    w.on("message", function(e) { events.add(JSON.stringify(e.message)); });
    function message() { var m = events.poll(3, java.util.concurrent.TimeUnit.SECONDS); eq(m != null, true, "Keyboard produces a message"); return JSON.parse(String(m)); }
    try {
      wait(w.show()); ui.keys("A😀\x7fB\r");
      var m = message(); eq(m.type, "change", "Input commits on enter"); eq(m.payload.values.name, "AB", "Unicode backspace removes full character");
      ui.keys("\t\x1b[C"); m = message(); eq(m.payload.id, "mode", "Select event ID"); eq(m.payload.values.mode, "two", "Arrow changes selection");
      ui.keys("\t\r"); m = message(); eq(m.type, "action", "Button event"); eq(m.payload.values, { name: "AB", mode: "two" }, "Serializable form snapshot");
      ui.keys("\x17"); until(function() { return w.__closed; }); d.wait(5000);
    } finally { d.__cleanup(); }
  };
  exports.testTabsResizeAndEscapes = function() {
    var ui = terminal(), d = desktop(ui), a = d.window({ title: "A\x1b]52;c;attack\x07", view: view() }), b = d.window({ title: "B", view: { items: [{ id: "large", type: "text", text: Array(80).join("Line\n") }] } });
    try {
      wait(a.show()); wait(b.show()); until(function() { return ui.output().indexOf("[2: B]") >= 0; });
      ui.keys("\x10"); until(function() { return ui.output().indexOf("[1: A") >= 0; });
      eq(ui.output().indexOf("\x1b]52"), -1, "Titles cannot inject terminal control sequences");
      var length = ui.output().length; ui.width = 25; ui.height = 6; until(function() { return ui.output().length > length; });
      wait(a.hide()); ui.keys("\x1b[6~"); wait(b.setTitle("Resized")); until(function() { return ui.output().indexOf("Resized") >= 0; });
      ui.keys("\x03"); until(function() { return a.__closed && b.__closed; }); d.wait(5000);
    } finally { d.__cleanup(); }
  };
  exports.testOwnershipAndFailure = function() {
    var ui = terminal(), a = desktop(ui), b = desktop(terminal());
    try {
      wait(a.start()); var p = b.start(); $doWait(p, 5000); eq(p.reason.code, "PROVIDER_UNAVAILABLE", "One terminal owner");
    } finally { a.__cleanup(); b.__cleanup(); }
    var bad = terminal(); bad.ansi = false; var d = desktop(bad);
    try { var p = d.start(); $doWait(p, 5000); eq(p.reason.code, "PROVIDER_UNAVAILABLE", "Non-ANSI terminal rejected"); } finally { d.__cleanup(); }
    eq(OpenWrap.desktop.__terminalOwned.get(), false, "Failed startup releases ownership");
    var broken = terminal(); broken.read = function() { throw new Error("terminal disconnected"); };
    d = desktop(broken);
    try { var p = d.start(); $doWait(p, 5000); until(function() { return !OpenWrap.desktop.__terminalOwned.get(); }); } finally { d.__cleanup(); }
    eq(broken.rawOn, false, "Read errors restore raw mode"); eq(broken.alt, false, "Read errors restore screen");
  };
  exports.testEventSecurityAndHTML = function() {
    var d = desktop(terminal()), v = OpenWrap.desktop.__view(d, view());
    [ { type: "view", payload: v }, { type: "action", payload: { id: "name", values: { name: "x", mode: "one" } } }, { type: "action", payload: { id: "go", values: { name: "x", mode: "evil" } } }, { type: "action", payload: { id: "go", values: { name: "x" } } } ].forEach(function(m) { fails(function() { OpenWrap.desktop.__viewEvent(d, v, m); }, "INVALID_ARGUMENT"); });
    v.items[0].text = "</script><script>evil()</script>\x1b[2J";
    var html = OpenWrap.desktop.__viewHTML(v);
    eq(html.indexOf("</script><script>evil()"), -1, "View data cannot break out of script");
    eq(html.indexOf(".textContent" ) >= 0, true, "Browser renders text using DOM setters");
    eq(html.indexOf("innerHTML"), -1, "No HTML interpolation sink");
    var graph = new OpenWrap.desktop({ provider: "mock" }); graph.registerProvider(require("fixtures/desktop/mock-provider.js").create());
    var w = graph.window({ view: view() });
    try { wait(w.created); eq(Boolean(graph.__server), true, "Graphical views reuse HTTP bridge"); eq(w.__html.indexOf("desktop-view") >= 0, true, "Same view becomes graphical HTML"); }
    finally { graph.__cleanup(); }
  };
})();
