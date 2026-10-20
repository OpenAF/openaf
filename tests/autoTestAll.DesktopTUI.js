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
  function desktop(ui, opts) {
    ow.loadDesktop(); loadCompiledLib("owrap_desktop_ui_js");
    var d = new OpenWrap.desktop(merge({ provider: "tui" }, opts || {})); d.registerProvider(OpenWrap.desktop.__tui(ui)); return d;
  }
  exports.testViewValidation = function() {
    var d = desktop(terminal());
    eq(OpenWrap.desktop.__view(d, view()).version, 1, "Version normalized");
    [
      { items: [{ id: "x", type: "func", text: "evil()" }] },
      { items: [{ id: "x", type: "text", text: "ok", html: "<b>bad</b>" }] },
      { items: [{ id: "x", type: "select", label: "x", options: ["a"], value: "b" }] },
      { items: [{ id: "x", type: "input", label: "x", value: "\x1b[2J" }] },
      { items: [{ id: "constructor", type: "text", text: "x" }] },
      { items: [{ id: "x", type: "text", text: "a" }, { id: "x", type: "button", label: "b" }] },
      { items: [{ id: "x", type: "text", text: "a", align: "diagonal" }] },
      { items: [{ id: "x", type: "text", text: "a", style: { fg: "not-a-color" } }] },
      { items: [{ id: "x", type: "spacer", lines: 0 }] }
    ].forEach(function(v) { fails(function() { d.window({ view: v }); }, "INVALID_ARGUMENT"); });
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
      // Test cursor movement (left, insert, home, delete, end)
      ui.keys("\x1b[D_X\x1b[H\x1b[3~\x1b[F!\r");
      m = message(); eq(m.payload.values.name, "_XB!", "Cursor left/home/delete/end edits in place");
      ui.keys("\t\x1b[C"); m = message(); eq(m.payload.id, "mode", "Select event ID"); eq(m.payload.values.mode, "two", "Arrow changes selection");
      ui.keys("\t\r"); m = message(); eq(m.type, "action", "Button event"); eq(m.payload.values, { name: "_XB!", mode: "two" }, "Serializable form snapshot");
      ui.keys("\x17"); until(function() { return w.__closed; }); d.wait(5000);
    } finally { d.__cleanup(); }
  };
  exports.testMouse = function() {
    var ui = terminal(); ui.width = 64; ui.height = 22;
    var d = desktop(ui), events = new java.util.concurrent.LinkedBlockingQueue();
    var v = view(); v.title = "Mouse form"; v.border = "rounded";
    v.padding = { top: 1, left: 2, right: 2 }; v.margin = { top: 1 }; v.spacing = 1;
    v.items[3].label = "実行 🚀"; v.items[3].align = "center"; v.items[3].padding = 1;
    v.items.push({ id: "disabled", type: "button", label: "Disabled", disabled: true });
    var a = d.window({ title: "Mouse A", view: v }), b;
    a.on("message", function(e) { events.add(JSON.stringify(e.message)); });
    function message() {
      var m = events.poll(3, java.util.concurrent.TimeUnit.SECONDS);
      eq(m != null, true, "Mouse interaction produces message"); return JSON.parse(String(m));
    }
    function frame() { return ui.output().split("\x1b[H").pop().replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "").split("\r\n"); }
    function report(x, y, button, release) { ui.keys("\x1b[<" + (button || 0) + ";" + x + ";" + y + (release ? "m" : "M")); }
    function click(text, button) {
      until(function() { return frame().some(function(l) { return l.indexOf(text) >= 0; }); });
      var rows = frame(), y = rows.map(function(l) { return l.indexOf(text); }).findIndex(function(i) { return i >= 0; });
      var x = ow.screen.width(rows[y].substring(0, rows[y].indexOf(text))) + 1;
      report(x, y + 1, button); report(x, y + 1, 0, true);
    }
    try {
      wait(a.show()); click("[ 実行 🚀 ]");
      eq(message().payload.id, "go", "Aligned Unicode button inside padded frame activates");
      click("Name:"); ui.keys("Ada\r");
      eq(message().payload.values.name, "Ada", "Click focuses input for keyboard editing");
      click("< >"); eq(message().payload.values.mode, "two", "Select left indicator wraps backwards");
      click("Mode:");
      eq(message().payload.values.mode, "one", "Select row advances");
      click("Disabled"); report(64, 22); report(2, 2, 2); // disabled/status/right button ignored
      click("Name:"); ui.keys("\r");
      eq(message().payload.id, "name", "Ignored clicks and releases produce no duplicate actions");
      b = d.window({ title: "Mouse B", view: { items: [{ id: "other", type: "text", text: "Other tab" }] } });
      wait(b.show()); click("1: Mouse A"); click("[ 実行 🚀 ]");
      eq(message().payload.id, "go", "Click switches logical window tabs");
      var longView = { items: [{ id: "top", type: "text", text: Array(40).join("Scroll line\n") }, { id: "bottom", type: "button", label: "Bottom" }] };
      wait(a.setView(longView)); // Focus follows the only control to the bottom.
      click("Bottom"); eq(message().payload.id, "bottom", "Scrolled targets activate current view revision");
      report(3, 5, 64);
      until(function() { return frame().join("\n").indexOf("Bottom") < 0; });
      report(3, 5, 65); click("Bottom"); eq(message().payload.id, "bottom", "Wheel scroll preserves hit targets");
      ui.width = 40; ui.height = 12;
      until(function() { return frame().length == 12; });
      ui.keys("\t"); click("Bottom"); eq(message().payload.id, "bottom", "Resize rebuilds mouse targets");
      wait(a.setView({ items: [{ id: "boxed", type: "button", label: "Bordered button 🌟 whose label wraps", width: 24, border: "rounded", padding: { left: 1, right: 1 }, align: "right" }] }));
      click("whose"); eq(message().payload.id, "boxed", "Wrapped bordered control uses rendered rows");
    } finally { d.__cleanup(); }
    eq(ui.output().indexOf("\x1b[?1000h\x1b[?1006h") >= 0, true, "Mouse reporting enabled");
    eq(ui.output().indexOf("\x1b[?1000l\x1b[?1006l") >= 0, true, "Mouse reporting restored");
    var off = terminal(), disabled = desktop(off, { providerOptions: { tui: { mouse: false } } });
    try { wait(disabled.start()); } finally { disabled.__cleanup(); }
    eq(off.output().indexOf("\x1b[?1000h"), -1, "Mouse reporting can be disabled");
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
    eq(broken.output().indexOf("\x1b[?1000l\x1b[?1006l") >= 0, true, "Read errors restore mouse reporting");
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
  exports.testScreenStylingAlignAndUTF8 = function() {
    ow.loadScreen();
    // 1. Colors: 16, 256, and truecolor RGB/hex
    var c256 = ow.screen.parseColor(208);
    eq(c256.idx256, 208, "256 color index parsed");
    var cHex = ow.screen.parseColor("#50b4ff");
    eq(cHex.r, 80, "Hex red channel"); eq(cHex.g, 180, "Hex green channel"); eq(cHex.b, 255, "Hex blue channel");
    var sTrue = ow.screen.style("Hello", { fg: "#50b4ff", bg: 236, bold: true, italic: true, underline: true, strikethrough: true }, { colorMode: "truecolor" });
    eq(sTrue.indexOf("\x1b[1;3;4;9;38;2;80;180;255;48;5;236m") === 0, true, "Truecolor + 256 bg + bold/italic/underline/strike SGR");
    var s256 = ow.screen.style("Hello", "BOLD,ITALIC,UNDERLINE,FG(39),BG(236)", { colorMode: "256" });
    eq(s256.indexOf("\x1b[1;3;4;38;5;39;48;5;236m") === 0, true, "256 color string spec parsed");
    var sNone = ow.screen.style("Hello", { fg: "red", bold: true }, { colorMode: "none" });
    eq(sNone, "Hello", "colorMode none emits no ANSI");

    // 2. Alignment (left, center, right) with full UTF-8 (CJK + Emoji + Accents)
    var utfText = "Olá 日本語 🚀"; // O-l-á (3) + space (1) + 日-本-語 (6) + space (1) + 🚀 (2) = 13 visible cols
    eq(ow.screen.width(utfText), 13, "UTF-8 visible width with CJK and emoji");
    var left = ow.screen.alignLine(utfText, 20, "left");
    var center = ow.screen.alignLine(utfText, 20, "center");
    var right = ow.screen.alignLine(utfText, 20, "right");
    eq(ow.screen.width(left), 20, "Left aligned width is exact");
    eq(ow.screen.width(center), 20, "Center aligned width is exact");
    eq(ow.screen.width(right), 20, "Right aligned width is exact");
    eq(center.indexOf("   " + utfText + "    "), 0, "Centered padding 3 left, 4 right");
    eq(right.indexOf("       " + utfText), 0, "Right padding 7 spaces");

    // 3. Box drawing, divider, progress, spacing
    var box = ow.screen.box("Centered UTF-8 🌟", { width: 30, title: "Panel", align: "center", borderStyle: "rounded", colorMode: "256" });
    var boxLines = box.split("\n");
    eq(boxLines.length, 3, "Box has top, content, bottom");
    eq(ow.screen.width(boxLines[0]), 30, "Box top border width");
    eq(ow.screen.width(boxLines[1]), 30, "Box content row width");
    eq(ow.screen.width(boxLines[2]), 30, "Box bottom border width");

    // 4. TUI rendering with rich view (divider, progress, spacer, align, styles, border)
    var ui = terminal(); ui.height = 18; ui.colorMode = "truecolor";
    var d = desktop(ui, { providerOptions: { tui: { theme: "ocean", border: "rounded" } } });
    var richView = {
      title: "Dashboard 🚀",
      subtitle: "UTF-8 & Truecolor",
      align: "center",
      spacing: 1,
      items: [
        { id: "hdr", type: "divider", label: "Metrics" },
        { id: "prog", type: "progress", label: "CPU", value: 75, min: 0, max: 100 },
        { id: "sp", type: "spacer", lines: 1 },
        { id: "msg", type: "text", text: "Aligned right 日本語", align: "right", style: { fg: "#89dceb", bold: true, italic: true } },
        { id: "ok", type: "button", label: "Confirm", align: "center" }
      ]
    };
    var w = d.window({ title: "RichWindow", view: richView });
    try {
      wait(w.show());
      until(function() { return ui.output().indexOf("Dashboard 🚀") >= 0 && ui.output().indexOf("75%") >= 0; });
      eq(ui.output().indexOf("Aligned right 日本語") >= 0, true, "UTF-8 text rendered in TUI");
      wait(w.close()); d.wait(5000);
    } finally { d.__cleanup(); }
  };
})();
