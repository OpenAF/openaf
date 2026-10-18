// Lazy shared-view support and the built-in terminal provider. No terminal opens on load.
OpenWrap.desktop.__view = function(desktop, value) {
  var view = desktop.__copy(value, 65536), ids = Object.create(null);
  function fail(text) { throw desktop.__error("INVALID_ARGUMENT", text); }
  function fields(obj, allowed) {
    if (!isMap(obj)) fail("View objects must be maps");
    Object.keys(obj).forEach(function(k) { if (allowed.indexOf(k) < 0) fail("Unknown view field: " + k); });
  }
  function string(v, max) { return typeof v == "string" && v.length <= max; }
  fields(view, ["version", "items"]);
  if (isDef(view.version) && view.version !== 1) fail("Unsupported view version");
  view.version = 1;
  if (!Array.isArray(view.items) || view.items.length > 128) fail("view.items must contain at most 128 items");
  view.items.forEach(function(item) {
    fields(item, ["id", "type", "text", "label", "value", "options"]);
    if (!string(item.id, 64) || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(item.id) || ["constructor", "prototype", "__proto__"].indexOf(item.id) >= 0 || ids[item.id]) fail("View IDs must be unique safe identifiers");
    ids[item.id] = true;
    if (["text", "button", "input", "select"].indexOf(item.type) < 0) fail("Unsupported view item type");
    var allowed = item.type == "text" ? ["id", "type", "text"] : item.type == "button" ? ["id", "type", "label"] : item.type == "input" ? ["id", "type", "label", "value"] : ["id", "type", "label", "value", "options"];
    fields(item, allowed);
    if (item.type == "text") { if (!string(item.text, 8192)) fail("Text requires a string of at most 8192 characters"); }
    else if (!string(item.label, 256)) fail("Controls require a label of at most 256 characters");
    if (item.type == "input" || item.type == "select") {
      if (isUnDef(item.value)) item.value = item.type == "select" && Array.isArray(item.options) ? item.options[0] : "";
      if (!string(item.value, 4096) || /[\x00-\x1f\x7f-\x9f]/.test(item.value)) fail("Control values must be single-line strings of at most 4096 characters");
    }
    if (item.type == "select" && (!Array.isArray(item.options) || item.options.length < 1 || item.options.length > 128 || item.options.some(function(v, i) { return !string(v, 256) || /[\x00-\x1f\x7f-\x9f]/.test(v) || item.options.indexOf(v) != i; }) || item.options.indexOf(item.value) < 0)) fail("Select requires unique string options and a matching value");
  });
  return desktop.__copy(view, 65536);
};
OpenWrap.desktop.__viewEvent = function(desktop, view, message) {
  var m = desktop.__copy(message, 65536), p = m.payload, controls = view.items.filter(function(i) { return i.type == "input" || i.type == "select"; });
  var item = p && view.items.filter(function(i) { return i.id == p.id; })[0];
  function fail() { throw desktop.__error("INVALID_ARGUMENT", "Invalid declarative view event"); }
  if (!isMap(p) || Object.keys(p).sort().join(",") != "id,values" || !isMap(p.values) || !item || (m.type == "action" ? item.type != "button" : m.type != "change" || ["input", "select"].indexOf(item.type) < 0)) fail();
  if (Object.keys(p.values).length != controls.length) fail();
  controls.forEach(function(c) {
    var v = p.values[c.id];
    if (!Object.prototype.hasOwnProperty.call(p.values, c.id) || typeof v != "string" || v.length > 4096 || /[\x00-\x1f\x7f-\x9f]/.test(v) || (c.type == "select" && c.options.indexOf(v) < 0)) fail();
  });
};
// Browser code uses only DOM text/value setters and the existing narrow JSON bridge.
OpenWrap.desktop.__viewHTML = function(view) {
  function frontend(initial) {
    var current, controls = {}, root = document.getElementById("desktop-view");
    function values() { var out = {}; Object.keys(controls).forEach(function(id) { out[id] = controls[id].value; }); return out; }
    function event(type, id) { openafDesktop.send(type, { id: id, values: values() }); }
    function render(next) {
      current = next; controls = {}; root.textContent = "";
      current.items.forEach(function(item) {
        var row = document.createElement("div"), element;
        row.style.margin = "0.7em 0";
        if (item.type == "text") { element = document.createElement("div"); element.style.whiteSpace = "pre-wrap"; element.textContent = item.text; }
        else if (item.type == "button") { element = document.createElement("button"); element.textContent = item.label; element.onclick = function() { event("action", item.id); }; }
        else {
          var label = document.createElement("label"); label.textContent = item.label + " "; row.appendChild(label);
          element = document.createElement(item.type == "select" ? "select" : "input");
          if (item.type == "select") item.options.forEach(function(v) { var opt = document.createElement("option"); opt.value = v; opt.textContent = v; element.appendChild(opt); });
          else { element.type = "text"; element.maxLength = 4096; }
          element.value = item.value; controls[item.id] = element;
          element.onchange = function() { event("change", item.id); };
        }
        element.id = item.id; row.appendChild(element); root.appendChild(row);
      });
    }
    openafDesktop.onMessage(function(m) { if (m.type == "view") render(m.payload); });
    openafDesktop.ready.then(function() { render(initial); }).catch(function() { root.textContent = "Desktop connection failed"; });
  }
  return "<!doctype html><html><head><meta charset='utf-8'><title>OpenAF</title></head><body style='font:16px system-ui;margin:1.5em'><main id='desktop-view'></main><script>(" + frontend.toString() + ")(" + JSON.stringify(view).replace(/</g, "\\u003c") + ");</script></body></html>";
};

// An injected UI is borrowed (used by contract tests); an askConsole UI is owned.
OpenWrap.desktop.__tui = function(injectedUI) {
  var ui, emit, session, thread, lock = new java.util.concurrent.locks.ReentrantLock();
  var running = new java.util.concurrent.atomic.AtomicBoolean(false), resize = new java.util.concurrent.atomic.AtomicBoolean(true), cachedSize, windows = {}, active, lastFrame = "", owns = false, claimed = false;
  if (!OpenWrap.desktop.__terminalOwned) OpenWrap.desktop.__terminalOwned = new java.util.concurrent.atomic.AtomicBoolean(false);
  function error(code, text) { var e = new Error(text); e.code = code; return e; }
  function locked(fn) { lock.lock(); try { return fn(); } finally { lock.unlock(); } }
  function clean(text, multiline) { return String(text).replace(multiline ? /[\x00-\x09\x0b-\x1f\x7f-\x9f]/g : /[\x00-\x1f\x7f-\x9f]/g, " "); }
  function visible() { return Object.keys(windows).filter(function(id) { return windows[id].shown; }); }
  function controls(w) { return w.view.items.filter(function(i) { return i.type != "text"; }); }
  function values(w) {
    var out = {};
    w.view.items.forEach(function(i) { if (i.type == "input" || i.type == "select") out[i.id] = i.value; });
    return out;
  }
  function announce(w, type, item) {
    emit({ type: "message", windowId: w.id, viewRevision: w.revision, message: { type: type, payload: { id: item.id, values: values(w) } } });
  }
  function chooseActive() { var ids = visible(); if (ids.indexOf(active) < 0) active = ids[0]; }
  function close(id) { if (!windows[id]) return; delete windows[id]; chooseActive(); emit({ type: "closed", windowId: id }); }
  function closeAll() { Object.keys(windows).forEach(close); }
  function terminalSize() {
    // ExecPty obtains dimensions through stty. Query only initially/on WINCH.
    // Injected UIs can report size changes directly without native signals.
    if (injectedUI || resize.getAndSet(false) || !cachedSize) cachedSize = ui.size();
    return cachedSize;
  }
  function render() {
    var size = terminalSize(), width = Math.max(1, Math.min(1000, Number(size.width) || 80)), height = Math.max(3, Math.min(1000, Number(size.height) || 24));
    var ids = visible(), w = windows[active], lines = [], focusedRow = 0;
    var tabs = ids.map(function(id, i) { return (id == active ? "[" : " ") + (i + 1) + ": " + clean(windows[id].title, false) + (id == active ? "]" : " "); }).join(" | ");
    if (w) {
      var cs = controls(w), focused = cs[w.focus];
      w.view.items.forEach(function(item) {
        var selected = focused && item.id == focused.id, text;
        if (item.type == "text") text = clean(item.text, true);
        else if (item.type == "button") text = (selected ? "> " : "  ") + "[ " + clean(item.label, false) + " ]";
        else text = (selected ? "> " : "  ") + clean(item.label, false) + ": " + clean(item.value, false) + (item.type == "select" ? "  < >" : selected ? "_" : "");
        if (selected) focusedRow = lines.length;
        String(ow.format.string.wordWrap(text, width)).split(/\r?\n/).forEach(function(line) { lines.push(line); });
      });
      if (w.followFocus) { if (focusedRow < w.scroll) w.scroll = focusedRow; if (focusedRow >= w.scroll + height - 2) w.scroll = focusedRow - height + 3; w.followFocus = false; }
      w.scroll = Math.max(0, Math.min(w.scroll, Math.max(0, lines.length - height + 2)));
      lines = lines.slice(w.scroll, w.scroll + height - 2);
    } else lines = ["No visible windows. Ctrl-C closes the desktop session."];
    while (lines.length < height - 2) lines.push("");
    var rows = [tabs || "OpenAF Desktop TUI"].concat(lines).concat(["Tab: focus  Enter: action/change  Left/Right: select  PgUp/PgDn: scroll  Ctrl-N/P: tabs  Ctrl-W: close  Ctrl-C: close all"]);
    var frame = rows.map(function(s) { return ow.format.string.ansiClip(s, width, ""); }).join("\r\n");
    if (frame != lastFrame) { ui.write("\x1b[H" + rows.map(function(s) { return "\x1b[2K" + ow.format.string.ansiClip(s, width, ""); }).join("\r\n"), false); lastFrame = frame; }
  }
  function key(k) {
    var ids = visible(), w = windows[active];
    if (k == "ctrl-c" || k == "eof") { closeAll(); if (k == "eof") running.set(false); return; }
    if (!w) return;
    if (k == "ctrl-w") { close(w.id); return; }
    if (k == "ctrl-n" || k == "ctrl-p") { active = ids[(ids.indexOf(active) + (k == "ctrl-n" ? 1 : ids.length - 1)) % ids.length]; return; }
    if (k == "pgup" || k == "pgdn") { w.scroll += (k == "pgup" ? -1 : 1) * Math.max(1, Number(terminalSize().height) - 3); return; }
    var cs = controls(w), item = cs[w.focus];
    if (!item) return;
    if (["tab", "down", "shift-tab", "up"].indexOf(k) >= 0) { w.focus = (w.focus + (k == "shift-tab" || k == "up" ? cs.length - 1 : 1)) % cs.length; w.followFocus = true; return; }
    if (k == "enter") { announce(w, item.type == "button" ? "action" : "change", item); return; }
    if (item.type == "select" && (k == "left" || k == "right")) { item.value = item.options[(item.options.indexOf(item.value) + (k == "right" ? 1 : item.options.length - 1)) % item.options.length]; announce(w, "change", item); }
    if (item.type == "input") {
      if (k == "backspace") item.value = item.value.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]$|[\s\S]$/, "");
      else if (typeof k == "string" && Array.from(k).length == 1 && !/[\x00-\x1f\x7f-\x9f]/.test(k) && item.value.length + k.length <= 4096) item.value += k;
    }
  }
  function release() {
    try { if (ui) ui.altScreen(false); }
    finally {
      try { if (owns && ui) ui.close(); }
      finally { if (claimed) { OpenWrap.desktop.__terminalOwned.set(false); claimed = false; } }
    }
  }
  return {
    describe: function() { return { id: "tui", version: "1", spi: 1, execution: "in-process" }; },
    probe: function() {
      var term = String(java.lang.System.getenv("TERM") || "");
      return injectedUI || term != "dumb" ? { available: true } : { available: false, reason: "TUI requires an ANSI controlling terminal" };
    },
    start: function(config, callback) {
      if (claimed || running.get()) throw error("INVALID_STATE", "TUI already started");
      if (!OpenWrap.desktop.__terminalOwned.compareAndSet(false, true)) throw error("PROVIDER_UNAVAILABLE", "Another desktop session owns the terminal");
      claimed = true; emit = callback; session = config.sessionId;
      var ready = new java.util.concurrent.CountDownLatch(1), startupError;
      try {
        ui = injectedUI || askConsole(); owns = !injectedUI;
        if (!ui.ansi) throw error("PROVIDER_UNAVAILABLE", "TUI requires an ANSI controlling terminal");
        if (owns) {
          var terminal = ui.console.getConsoleReader().getTerminal().unwrap();
          terminal.handle(Packages.org.jline.terminal.Terminal.Signal.WINCH, new Packages.org.jline.terminal.Terminal.SignalHandler({ handle: function() { resize.set(true); } }));
        }
        ow.loadFormat(); running.set(true);
        thread = new java.lang.Thread(new java.lang.Runnable({ run: function() {
          try {
            ui.raw(function() {
              ui.altScreen(true); ready.countDown();
              while (running.get()) {
                locked(render);
                var k = askKey(ui, 100);
                if (isDef(k)) locked(function() { key(k); });
              }
            });
          } catch(e) {
            startupError = e;
            if (ready.getCount() == 0 && running.get()) emit({ type: "providerFailed", error: { code: "PROVIDER_FAILED", message: "TUI terminal failed: " + String(e) } });
          } finally { running.set(false); try { release(); } finally { ready.countDown(); } }
        } }), "OpenAF desktop terminal");
        thread.setDaemon(true); thread.start();
        if (!ready.await(2, java.util.concurrent.TimeUnit.SECONDS) || startupError || !running.get()) throw error("PROVIDER_UNAVAILABLE", "Cannot initialize TUI: " + String(startupError || "terminal unavailable"));
        return { windows: true, multipleWindows: true, messaging: true, declarativeViews: true, nativeViews: true, html: false, urls: false, localFiles: false, dialogs: false, notifications: false, tray: false, strictNavigation: true, networkIsolation: true, rendererSandbox: false };
      } catch(e) { running.set(false); if (!thread) release(); throw e; }
    },
    request: function(envelope) {
      if (!running.get()) throw error("INVALID_STATE", "TUI is not running");
      if (envelope.version != 1 || envelope.sessionId != session) throw error("INVALID_ARGUMENT", "Invalid TUI envelope");
      return locked(function() {
        var id = envelope.windowId, o = envelope.payload, w = windows[id];
        if (envelope.operation == "window.create") {
          if (!o.view) throw error("UNSUPPORTED_CAPABILITY", "TUI requires a declarative view");
          windows[id] = { id: id, title: o.title || "OpenAF", revision: o.viewRevision, view: JSON.parse(JSON.stringify(o.view)), shown: false, focus: 0, scroll: 0, followFocus: true };
          emit({ type: "ready", windowId: id }); return null;
        }
        if (!w) throw error("INVALID_STATE", "Unknown TUI window");
        switch (envelope.operation) {
        case "window.show": w.shown = true; active = id; break;
        case "window.hide": w.shown = false; chooseActive(); break;
        case "window.close": close(id); break;
        case "window.setTitle": w.title = o.title; break;
        case "window.setView": w.view = JSON.parse(JSON.stringify(o.view)); w.revision = o.viewRevision; w.focus = 0; w.scroll = 0; w.followFocus = true; break;
        default: throw error("UNSUPPORTED_CAPABILITY", "Unsupported TUI operation: " + envelope.operation);
        }
        return null;
      });
    },
    stop: function() {
      running.set(false);
      if (thread && !thread.equals(java.lang.Thread.currentThread())) {
        thread.join(1500);
        if (thread.isAlive()) throw error("PROVIDER_FAILED", "TUI reader did not stop");
      } else if (!thread && claimed) release();
      windows = {};
    }
  };
};
