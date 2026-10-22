// Lazy shared-view support and the built-in terminal provider. No terminal opens on load.
OpenWrap.desktop.__view = function(desktop, value) {
  ow.loadScreen();
  var view = desktop.__copy(value, 65536), ids = Object.create(null);
  function fail(text) { throw desktop.__error("INVALID_ARGUMENT", text); }
  function fields(obj, allowed) {
    if (!isMap(obj)) fail("View objects must be maps");
    Object.keys(obj).forEach(function(k) { if (allowed.indexOf(k) < 0) fail("Unknown view field: " + k); });
  }
  function string(v, max) { return typeof v == "string" && v.length <= max; }
  function checkAlign(v) {
    if (isDef(v) && ["left", "center", "right"].indexOf(v) < 0) fail("align must be left, center or right");
  }
  function checkInt(v, min, max, name) {
    if (isDef(v) && (typeof v != "number" || !Number.isInteger(v) || v < min || v > max)) fail("Invalid " + name);
  }
  function checkBoxSpacing(v, name, max) {
    if (isUnDef(v)) return;
    if (typeof v == "number") { checkInt(v, 0, max, name); return; }
    if (!isMap(v)) fail("Invalid " + name);
    fields(v, ["top", "bottom", "left", "right", "x", "y"]);
    Object.keys(v).forEach(function(k) { checkInt(v[k], 0, max, name + "." + k); });
  }
  function checkColor(v, name) {
    if (isUnDef(v)) return;
    if (!ow.screen.parseColor(v)) fail("Invalid color in " + name);
  }
  function checkStyle(v, name) {
    if (isUnDef(v)) return;
    if (typeof v == "string") {
      if (v.length > 256 || /[\x00-\x1f\x7f-\x9f]/.test(v)) fail("Invalid style string in " + name);
      return;
    }
    if (!isMap(v)) fail("Style must be a string or map in " + name);
    fields(v, ["fg", "bg", "color", "background", "bold", "dim", "faint", "italic", "underline", "doubleUnderline", "blink", "reverse", "invert", "hidden", "conceal", "strikethrough", "strike", "align"]);
    ["fg", "bg", "color", "background"].forEach(function(k) { checkColor(v[k], name + "." + k); });
    ["bold", "dim", "faint", "italic", "underline", "doubleUnderline", "blink", "reverse", "invert", "hidden", "conceal", "strikethrough", "strike"].forEach(function(k) {
      if (isDef(v[k]) && typeof v[k] != "boolean") fail("Style flag " + k + " must be boolean");
    });
    checkAlign(v.align);
  }

  fields(view, ["version", "title", "subtitle", "align", "spacing", "padding", "margin", "border", "borderStyle", "theme", "style", "items"]);
  if (isDef(view.version) && view.version !== 1) fail("Unsupported view version");
  view.version = 1;
  if (isDef(view.title) && (!string(view.title, 256) || /[\x00-\x1f\x7f-\x9f]/.test(view.title))) fail("Invalid view title");
  if (isDef(view.subtitle) && (!string(view.subtitle, 512) || /[\x00-\x1f\x7f-\x9f]/.test(view.subtitle))) fail("Invalid view subtitle");
  checkAlign(view.align);
  checkInt(view.spacing, 0, 8, "spacing");
  checkBoxSpacing(view.padding, "padding", 16);
  checkBoxSpacing(view.margin, "margin", 16);
  if (isDef(view.border) && typeof view.border != "boolean" && ["rounded", "single", "double", "heavy", "ascii", "none"].indexOf(view.border) < 0) fail("Invalid view border");
  if (isDef(view.borderStyle) && ["rounded", "single", "double", "heavy", "ascii", "none"].indexOf(view.borderStyle) < 0) fail("Invalid view borderStyle");
  if (isDef(view.theme) && typeof view.theme != "string" && !isMap(view.theme)) fail("Invalid view theme");
  if (typeof view.theme == "string" && !string(view.theme, 64)) fail("Invalid view theme");
  checkStyle(view.style, "view.style");

  if (!Array.isArray(view.items) || view.items.length > 128) fail("view.items must contain at most 128 items");
  var commonProps = ["id", "type", "align", "style", "labelStyle", "focusStyle", "padding", "margin", "spacing", "width", "border", "borderStyle", "disabled"];
  view.items.forEach(function(item) {
    if (!isMap(item)) fail("View items must be maps");
    if (!string(item.id, 64) || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(item.id) || ["constructor", "prototype", "__proto__"].indexOf(item.id) >= 0 || ids[item.id]) fail("View IDs must be unique safe identifiers");
    ids[item.id] = true;
    var types = ["text", "button", "input", "select", "divider", "spacer", "progress"];
    if (types.indexOf(item.type) < 0) fail("Unsupported view item type");
    var typeSpecific = {
      text: ["text", "title"],
      button: ["label"],
      input: ["label", "value", "placeholder"],
      select: ["label", "value", "options"],
      divider: ["label", "char"],
      spacer: ["lines"],
      progress: ["label", "value", "min", "max", "showPercent"]
    }[item.type];
    fields(item, commonProps.concat(typeSpecific));
    checkAlign(item.align);
    checkStyle(item.style, item.id + ".style");
    checkStyle(item.labelStyle, item.id + ".labelStyle");
    checkStyle(item.focusStyle, item.id + ".focusStyle");
    checkBoxSpacing(item.padding, item.id + ".padding", 16);
    checkBoxSpacing(item.margin, item.id + ".margin", 16);
    checkInt(item.spacing, 0, 8, item.id + ".spacing");
    checkInt(item.width, 1, 1000, item.id + ".width");
    if (isDef(item.border) && typeof item.border != "boolean" && ["rounded", "single", "double", "heavy", "ascii", "none"].indexOf(item.border) < 0) fail("Invalid item border");
    if (isDef(item.borderStyle) && ["rounded", "single", "double", "heavy", "ascii", "none"].indexOf(item.borderStyle) < 0) fail("Invalid item borderStyle");
    if (isDef(item.disabled) && typeof item.disabled != "boolean") fail("disabled must be boolean");

    if (item.type == "text") {
      if (!string(item.text, 8192)) fail("Text requires a string of at most 8192 characters");
      if (isDef(item.title) && (!string(item.title, 256) || /[\x00-\x1f\x7f-\x9f]/.test(item.title))) fail("Invalid text title");
    } else if (item.type == "divider") {
      if (isDef(item.label) && (!string(item.label, 256) || /[\x00-\x1f\x7f-\x9f]/.test(item.label))) fail("Invalid divider label");
      if (isDef(item.char) && (!string(item.char, 8) || item.char.length < 1 || /[\x00-\x1f\x7f-\x9f]/.test(item.char))) fail("Invalid divider char");
    } else if (item.type == "spacer") {
      if (isUnDef(item.lines)) item.lines = 1;
      checkInt(item.lines, 1, 32, item.id + ".lines");
    } else if (item.type == "progress") {
      if (isDef(item.label) && (!string(item.label, 256) || /[\x00-\x1f\x7f-\x9f]/.test(item.label))) fail("Invalid progress label");
      if (typeof item.value != "number" || !isFinite(item.value)) fail("Progress value must be a finite number");
      if (isDef(item.min) && (typeof item.min != "number" || !isFinite(item.min))) fail("Progress min must be a finite number");
      if (isDef(item.max) && (typeof item.max != "number" || !isFinite(item.max))) fail("Progress max must be a finite number");
      if (isDef(item.showPercent) && typeof item.showPercent != "boolean") fail("Progress showPercent must be boolean");
    } else {
      if (!string(item.label, 256)) fail("Controls require a label of at most 256 characters");
    }
    if (item.type == "input") {
      if (isDef(item.placeholder) && (!string(item.placeholder, 256) || /[\x00-\x1f\x7f-\x9f]/.test(item.placeholder))) fail("Invalid input placeholder");
    }
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
  if (!isMap(p) || Object.keys(p).sort().join(",") != "id,values" || !isMap(p.values) || !item || item.disabled || (m.type == "action" ? item.type != "button" : m.type != "change" || ["input", "select"].indexOf(item.type) < 0)) fail();
  if (Object.keys(p.values).length != controls.length) fail();
  controls.forEach(function(c) {
    var v = p.values[c.id];
    if (!Object.prototype.hasOwnProperty.call(p.values, c.id) || typeof v != "string" || v.length > 4096 || /[\x00-\x1f\x7f-\x9f]/.test(v) || (c.type == "select" && c.options.indexOf(v) < 0)) fail();
  });
};

// Browser code uses only DOM text/value/style property setters and the existing narrow JSON bridge.
OpenWrap.desktop.__viewHTML = function(view) {
  function frontend(initial) {
    var current, controls = {}, root = document.getElementById("desktop-view");
    function values() { var out = {}; Object.keys(controls).forEach(function(id) { out[id] = controls[id].value; }); return out; }
    function event(type, id) { openafDesktop.send(type, { id: id, values: values() }); }
    function applyStyle(el, st, align) {
      if (align && ["left", "center", "right"].indexOf(align) >= 0) el.style.textAlign = align;
      if (!st || typeof st != "object") return;
      if (st.bold) el.style.fontWeight = "bold";
      if (st.italic) el.style.fontStyle = "italic";
      var dec = [];
      if (st.underline || st.doubleUnderline) dec.push("underline");
      if (st.strikethrough || st.strike) dec.push("line-through");
      if (dec.length) el.style.textDecoration = dec.join(" ");
      if (st.dim || st.faint) el.style.opacity = "0.7";
      if (typeof st.fg == "string") el.style.color = st.fg;
      else if (typeof st.color == "string") el.style.color = st.color;
      if (typeof st.bg == "string") el.style.backgroundColor = st.bg;
      else if (typeof st.background == "string") el.style.backgroundColor = st.background;
      if (st.align && ["left", "center", "right"].indexOf(st.align) >= 0) el.style.textAlign = st.align;
    }
    function render(next) {
      current = next; controls = {}; root.textContent = "";
      applyStyle(root, current.style, current.align);
      if (current.title) {
        var h1 = document.createElement("h2");
        h1.style.margin = "0 0 0.25em 0";
        h1.textContent = current.title;
        root.appendChild(h1);
      }
      if (current.subtitle) {
        var sub = document.createElement("div");
        sub.style.opacity = "0.75";
        sub.style.marginBottom = "0.8em";
        sub.textContent = current.subtitle;
        root.appendChild(sub);
      }
      current.items.forEach(function(item) {
        var row = document.createElement("div"), element;
        row.style.margin = "0.7em 0";
        applyStyle(row, item.style, item.align || current.align);
        if (item.border) {
          row.style.border = "1px solid #888";
          row.style.borderRadius = item.border == "rounded" ? "6px" : "2px";
          row.style.padding = "0.5em 0.75em";
        }
        if (item.type == "text") {
          if (item.title) {
            var tt = document.createElement("div");
            tt.style.fontWeight = "bold";
            tt.style.marginBottom = "0.25em";
            tt.textContent = item.title;
            row.appendChild(tt);
          }
          element = document.createElement("div");
          element.style.whiteSpace = "pre-wrap";
          element.textContent = item.text;
        } else if (item.type == "divider") {
          element = document.createElement("hr");
          element.style.border = "none";
          element.style.borderTop = "1px solid #999";
          if (item.label) {
            element = document.createElement("div");
            element.style.borderBottom = "1px solid #999";
            element.style.fontWeight = "bold";
            element.textContent = item.label;
          }
        } else if (item.type == "spacer") {
          element = document.createElement("div");
          element.style.height = ((item.lines || 1) * 1.2) + "em";
        } else if (item.type == "progress") {
          if (item.label) {
            var pl = document.createElement("label");
            pl.textContent = item.label + " ";
            row.appendChild(pl);
          }
          element = document.createElement("progress");
          var min = typeof item.min == "number" ? item.min : 0;
          var max = typeof item.max == "number" ? item.max : 100;
          element.max = Math.max(1, max - min);
          element.value = Math.max(0, Math.min(element.max, item.value - min));
        } else if (item.type == "button") {
          element = document.createElement("button");
          element.textContent = item.label;
          if (item.disabled) element.disabled = true;
          element.onclick = function() { if (!item.disabled) event("action", item.id); };
        } else {
          var label = document.createElement("label");
          label.textContent = item.label + " ";
          applyStyle(label, item.labelStyle);
          row.appendChild(label);
          element = document.createElement(item.type == "select" ? "select" : "input");
          if (item.type == "select") {
            item.options.forEach(function(v) { var opt = document.createElement("option"); opt.value = v; opt.textContent = v; element.appendChild(opt); });
          } else {
            element.type = "text";
            element.maxLength = 4096;
            if (item.placeholder) element.placeholder = item.placeholder;
          }
          if (item.disabled) element.disabled = true;
          element.value = item.value;
          controls[item.id] = element;
          element.onchange = function() { if (!item.disabled) event("change", item.id); };
        }
        element.id = item.id;
        row.appendChild(element);
        root.appendChild(row);
      });
    }
    openafDesktop.onMessage(function(m) { if (m.type == "view") render(m.payload); });
    openafDesktop.ready.then(function() { render(initial); }).catch(function() { root.textContent = "Desktop connection failed"; });
  }
  return "<!doctype html><html><head><meta charset='utf-8'><title>OpenAF</title></head><body style='font:16px system-ui;margin:1.5em'><main id='desktop-view'></main><script>(" + frontend.toString() + ")(" + JSON.stringify(view).replace(/</g, "\\u003c") + ");</script></body></html>";
};

// An injected UI is borrowed (used by contract tests); an askConsole UI is owned.
OpenWrap.desktop.__tui = function(injectedUI) {
  var ui, emit, session, thread, providerConfig = {}, lock = new java.util.concurrent.locks.ReentrantLock();
  var running = new java.util.concurrent.atomic.AtomicBoolean(false), resize = new java.util.concurrent.atomic.AtomicBoolean(true), cachedSize, windows = {}, active, lastFrame = "", owns = false, claimed = false;
  var hitMap = [], mouseOn = false;
  if (!OpenWrap.desktop.__terminalOwned) OpenWrap.desktop.__terminalOwned = new java.util.concurrent.atomic.AtomicBoolean(false);
  function error(code, text) { var e = new Error(text); e.code = code; return e; }
  function locked(fn) { lock.lock(); try { return fn(); } finally { lock.unlock(); } }
  function clean(text, multiline) { return ow.screen.sanitize(text, multiline); }
  function visible() { return Object.keys(windows).filter(function(id) { return windows[id].shown; }); }
  function controls(w) { return w.view.items.filter(function(i) { return (i.type == "button" || i.type == "input" || i.type == "select") && !i.disabled; }); }
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
  function resolveTuiOptions(w) {
    var dOpts = (providerConfig && isMap(providerConfig.options)) ? providerConfig.options : {};
    var pOpts = (dOpts.providerOptions && isMap(dOpts.providerOptions.tui)) ? dOpts.providerOptions.tui : {};
    var v = w ? w.view : {};
    var caps = ow.screen.capabilities({
      colorMode: pOpts.colorMode || (isMap( ui ) && isDef(ui.colorMode) ? ui.colorMode : "auto"),
      unicode: isBoolean(pOpts.unicode) ? pOpts.unicode : (isMap(ui) && isBoolean(ui.unicode) ? ui.unicode : undefined),
      ansi: ui ? ui.ansi : true
    });
    var th = ow.screen.getTheme(v.theme || pOpts.theme || "default", caps.colorMode);
    var frameBorder = isDef(v.border) ? v.border : (isDef(pOpts.border) ? pOpts.border : false);
    var borderStyle = v.borderStyle || (typeof frameBorder == "string" ? frameBorder : (pOpts.borderStyle || "rounded"));
    return { caps: caps, theme: th, frameBorder: Boolean(frameBorder && frameBorder !== "none"), borderStyle: borderStyle, pOpts: pOpts };
  }
  function syncCursors(w) {
    if (!w.cursors) w.cursors = {};
    w.view.items.forEach(function(item) {
      if (item.type == "input") {
        var gLen = ow.screen.graphemes(item.value || "").length;
        if (isUnDef(w.cursors[item.id]) || w.cursors[item.id] > gLen) w.cursors[item.id] = gLen;
      }
    });
  }
  function renderItem(w, item, selected, innerW, ctx) {
    var mode = ctx.caps.colorMode, u = ctx.caps.unicode, th = ctx.theme;
    var align = item.align || (isMap(item.style) && item.style.align) || w.view.align || "left";
    var itemW = item.width ? Math.min(innerW, Math.max(4, item.width)) : innerW;
    var rawLines = [];

    if (item.type == "spacer") {
      var n = Math.max(1, Number(item.lines) || 1);
      for (var si = 0; si < n; si++) rawLines.push("");
      return rawLines;
    }

    if (item.type == "divider") {
      rawLines.push(ow.screen.hr(itemW, {
        label: item.label,
        char: item.char,
        align: align,
        style: item.style || th.border,
        labelStyle: item.labelStyle || th.title,
        colorMode: mode,
        unicode: u
      }));
    } else if (item.type == "progress") {
      var pStr = ow.screen.progress(item.value, item.max, item.min, itemW, {
        label: item.label,
        showPercent: item.showPercent,
        filledStyle: item.style || th.progressFilled,
        emptyStyle: th.progressEmpty,
        labelStyle: item.labelStyle || th.label,
        colorMode: mode,
        unicode: u
      });
      rawLines.push(pStr);
    } else if (item.type == "text") {
      var txt = clean(item.text, true);
      var txtStyle = item.style || th.text;
      if (item.title && !item.border) {
        var hdr = ow.screen.style(clean(item.title, false), item.labelStyle || th.heading, { colorMode: mode });
        rawLines.push(hdr);
      }
      ow.screen.wrap(txt, itemW).forEach(function(line) {
        rawLines.push(txtStyle ? ow.screen.style(line, txtStyle, { colorMode: mode }) : line);
      });
    } else if (item.type == "button") {
      var bPrefix = selected ? "> " : "  ";
      var bCore = "[ " + clean(item.label, false) + " ]";
      var bSt = selected ? (item.focusStyle || th.focusButton) : (item.style || (item.disabled ? th.muted : th.button));
      var pSt = selected ? th.focusLabel : th.muted;
      var lineB = ow.screen.style(bPrefix, pSt, { colorMode: mode }) + ow.screen.style(bCore, bSt, { colorMode: mode });
      ow.screen.wrap(lineB, itemW).forEach(function(l) { rawLines.push(l); });
    } else if (item.type == "select") {
      var sPrefix = selected ? "> " : "  ";
      var sLbl = clean(item.label, false) + ": ";
      var sVal = clean(item.value, false);
      var sInd = "  < >";
      var pStS = selected ? th.focusLabel : th.muted;
      var lStS = selected ? (item.labelStyle || th.focusLabel) : (item.labelStyle || th.label);
      var vStS = selected ? (item.focusStyle || th.focusSelect) : (item.style || th.select);
      var lineS = ow.screen.style(sPrefix, pStS, { colorMode: mode }) +
                  ow.screen.style(sLbl, lStS, { colorMode: mode }) +
                  ow.screen.style(sVal, vStS, { colorMode: mode }) +
                  ow.screen.style(sInd, selected ? th.accent : th.muted, { colorMode: mode });
      ow.screen.wrap(lineS, itemW).forEach(function(l) { rawLines.push(l); });
    } else if (item.type == "input") {
      var iPrefix = selected ? "> " : "  ";
      var iLbl = clean(item.label, false) + ": ";
      var valClean = clean(item.value, false);
      var gs = ow.screen.graphemes(valClean);
      var cur = isDef(w.cursors && w.cursors[item.id]) ? Math.max(0, Math.min(gs.length, w.cursors[item.id])) : gs.length;
      var pStI = selected ? th.focusLabel : th.muted;
      var lStI = selected ? (item.labelStyle || th.focusLabel) : (item.labelStyle || th.label);
      var vStI = selected ? (item.focusStyle || th.focusInput) : (item.style || th.input);
      var valRendered;
      if (selected) {
        if (cur >= gs.length) {
          valRendered = ow.screen.style(valClean + "_", vStI, { colorMode: mode });
        } else {
          var before = gs.slice(0, cur).join("");
          var at = gs[cur];
          var after = gs.slice(cur + 1).join("");
          valRendered = ow.screen.style(before, vStI, { colorMode: mode }) +
                        ow.screen.style(at, { reverse: true, bold: true, underline: true }, { colorMode: mode }) +
                        ow.screen.style(after, vStI, { colorMode: mode }) +
                        ow.screen.style("_", th.accent, { colorMode: mode });
        }
      } else if (valClean.length === 0 && item.placeholder) {
        valRendered = ow.screen.style(clean(item.placeholder, false), th.muted, { colorMode: mode });
      } else {
        valRendered = ow.screen.style(valClean, vStI, { colorMode: mode });
      }
      var lineI = ow.screen.style(iPrefix, pStI, { colorMode: mode }) +
                  ow.screen.style(iLbl, lStI, { colorMode: mode }) +
                  valRendered;
      ow.screen.wrap(lineI, itemW).forEach(function(l) { rawLines.push(l); });
    }

    if (item.border && item.border !== "none") {
      var bStyle = typeof item.border == "string" ? item.border : (item.borderStyle || ctx.borderStyle);
      var boxed = ow.screen.box(rawLines, {
        width: itemW,
        title: item.title || (item.type != "text" ? item.label : undefined),
        align: align,
        padding: item.padding,
        borderStyle: bStyle,
        borderColor: selected ? th.focusLabel : th.border,
        titleStyle: selected ? th.focusLabel : th.title,
        colorMode: mode,
        unicode: u
      });
      rawLines = boxed.split("\n");
    } else if (isDef(item.padding) || isDef(item.margin) || align != "left") {
      rawLines = ow.screen.space(rawLines, {
        width: innerW,
        align: align,
        padding: item.padding,
        margin: item.margin,
        colorMode: mode
      });
    }
    return rawLines;
  }

  function render() {
    var size = terminalSize(), width = Math.max(1, Math.min(1000, Number(size.width) || 80)), height = Math.max(3, Math.min(1000, Number(size.height) || 24));
    var ids = visible(), w = windows[active], lines = [], focusedRow = 0, itemHits = [];
    hitMap = [];
    var ctx = resolveTuiOptions(w), mode = ctx.caps.colorMode, th = ctx.theme;

    var tabX = 1;
    var tabs = ids.map(function(id, i) {
      var isAct = id == active;
      var tText = (isAct ? "[" : " ") + (i + 1) + ": " + clean(windows[id].title, false) + (isAct ? "]" : " ");
      var tw = ow.screen.width(tText);
      hitMap.push({ x: tabX, end: Math.min(width, tabX + tw - 1), y: 1, windowId: id });
      tabX += tw + 3;
      return ow.screen.style(tText, isAct ? th.tabActive : th.tabInactive, { colorMode: mode });
    }).join(ow.screen.style(" | ", th.tabBar, { colorMode: mode }));

    var headerRow = tabs ? ow.screen.alignLine(tabs, width, "left", " ", th.tabBar, { colorMode: mode }) :
                           ow.screen.alignLine(ow.screen.style("OpenAF Desktop TUI", th.title, { colorMode: mode }), width, "left", " ", th.tabBar, { colorMode: mode });

    var bodyHeight = Math.max(1, height - 2);
    var contentW = ctx.frameBorder && width >= 6 ? width - 2 : width;

    if (w) {
      syncCursors(w);
      var cs = controls(w);
      if (cs.length > 0 && (w.focus < 0 || w.focus >= cs.length)) w.focus = 0;
      var focused = cs[w.focus];

      if (w.view.title) {
        lines.push(ow.screen.alignLine(ow.screen.style(clean(w.view.title, false), th.heading, { colorMode: mode }), contentW, w.view.align || "left", " ", null, { colorMode: mode }));
      }
      if (w.view.subtitle) {
        lines.push(ow.screen.alignLine(ow.screen.style(clean(w.view.subtitle, false), th.muted, { colorMode: mode }), contentW, w.view.align || "left", " ", null, { colorMode: mode }));
      }
      var gap = Math.max(0, Number(w.view.spacing) || 0);
      w.view.items.forEach(function(item, idx) {
        var selected = Boolean(focused && item.id == focused.id);
        if (selected) focusedRow = lines.length;
        var itemLines = renderItem(w, item, selected, contentW, ctx);
        itemLines.forEach(function(l) {
          if (!item.disabled && ["button", "input", "select"].indexOf(item.type) >= 0) {
            var plain = String(l).replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "");
            var lead = /^ */.exec(plain)[0].length, text = plain.replace(/ +$/, "");
            if (text.length > lead) itemHits.push({ x: lead + 1, end: ow.screen.width(text), y: lines.length, id: item.id,
              previous: item.type == "select" ? ow.screen.width(text.substring(0, text.lastIndexOf("<"))) + 1 : -1 });
          }
          lines.push(l);
        });
        var itemGap = isNumber(item.spacing) ? item.spacing : gap;
        if (itemGap > 0 && idx < w.view.items.length - 1) {
          for (var g = 0; g < itemGap; g++) lines.push("");
        }
      });

      if (isDef(w.view.padding) || isDef(w.view.margin)) {
        function edge(v, side, axis) { return typeof v == "number" ? v : (v && (v[side] || v[axis])) || 0; }
        var dx = edge(w.view.padding, "left", "x") + edge(w.view.margin, "left", "x");
        var dy = edge(w.view.padding, "top", "y") + edge(w.view.margin, "top", "y");
        var right = edge(w.view.padding, "right", "x") + edge(w.view.margin, "right", "x");
        itemHits.forEach(function(h) { h.x += dx; h.end = Math.min(h.end + dx, contentW - right); h.previous += dx; h.y += dy; });
        focusedRow += dy;
        lines = ow.screen.space(lines, { width: contentW, padding: w.view.padding, margin: w.view.margin, colorMode: mode });
      }

      var viewportH = ctx.frameBorder && bodyHeight >= 3 ? bodyHeight - 2 : bodyHeight;
      if (w.followFocus) {
        if (focusedRow < w.scroll) w.scroll = focusedRow;
        if (focusedRow >= w.scroll + viewportH) w.scroll = focusedRow - viewportH + 1;
        w.followFocus = false;
      }
      var maxScroll = Math.max(0, lines.length - viewportH);
      w.scroll = Math.max(0, Math.min(w.scroll, maxScroll));
      var framed = ctx.frameBorder && bodyHeight >= 3 && width >= 6;
      var totalLines = lines.length;
      itemHits.forEach(function(h) {
        var row = h.y - w.scroll;
        if (row < 0 || row >= viewportH) return;
        var limit = contentW - (totalLines > viewportH && contentW >= 10 ? 1 : 0);
        h.end = Math.min(h.end, limit);
        h.x += framed ? 1 : 0; h.end += framed ? 1 : 0; h.previous += framed ? 1 : 0;
        h.y = row + 2 + (framed ? 1 : 0);
        h.windowId = w.id; h.revision = w.revision;
        if (h.x <= h.end) hitMap.push(h);
      });
      var visibleLines = lines.slice(w.scroll, w.scroll + viewportH);
      while (visibleLines.length < viewportH) visibleLines.push("");

      // Optional scrollbar indicator when content overflows
      if (totalLines > viewportH && contentW >= 10) {
        var thumbSize = Math.max(1, Math.round((viewportH / totalLines) * viewportH));
        var thumbStart = maxScroll > 0 ? Math.round((w.scroll / maxScroll) * (viewportH - thumbSize)) : 0;
        var sbThumb = ow.screen.style(ctx.caps.unicode ? "┃" : "#", th.scrollbarThumb, { colorMode: mode });
        var sbTrack = ow.screen.style(ctx.caps.unicode ? "│" : "|", th.scrollbarTrack, { colorMode: mode });
        visibleLines = visibleLines.map(function(l, ri) {
          var isThumb = ri >= thumbStart && ri < thumbStart + thumbSize;
          return ow.screen.alignLine(l, contentW - 1, "left", " ", null, { colorMode: mode }) + (isThumb ? sbThumb : sbTrack);
        });
      }

      if (ctx.frameBorder && bodyHeight >= 3 && width >= 6) {
        var boxedBody = ow.screen.box(visibleLines, {
          width: width,
          height: bodyHeight,
          title: clean(w.title, false),
          borderStyle: ctx.borderStyle,
          borderColor: th.border,
          titleStyle: th.title,
          padding: 0,
          colorMode: mode,
          unicode: ctx.caps.unicode
        });
        lines = boxedBody.split("\n");
      } else {
        lines = visibleLines;
      }
    } else {
      lines = [ow.screen.style("No visible windows. Ctrl-C closes the desktop session.", th.muted, { colorMode: mode })];
      while (lines.length < bodyHeight) lines.push("");
    }

    var helpText = "Tab: focus  Enter: action/change  Left/Right: select/cursor  PgUp/PgDn: scroll  Ctrl-N/P: tabs  Ctrl-W: close  Ctrl-C: close all";
    var statusRow = ow.screen.alignLine(ow.screen.style(helpText, th.statusBar, { colorMode: mode }), width, "left", " ", th.statusBar, { colorMode: mode });

    var rows = [headerRow].concat(lines).concat([statusRow]);
    var frame = rows.map(function(s) { return ow.screen.clip(s, width, ""); }).join("\r\n");
    if (frame != lastFrame) {
      ui.write("\x1b[H" + rows.map(function(s) { return "\x1b[2K" + ow.screen.clip(s, width, ""); }).join("\r\n"), false);
      lastFrame = frame;
    }
  }
  function mouse(m) {
    if (m.release || (m.button & 32)) return;
    var size = terminalSize(), w = windows[active];
    if (m.x > size.width || m.y > size.height) return;
    if (m.button == 64 || m.button == 65) {
      if (w && m.y > 1 && m.y < size.height) w.scroll += m.button == 64 ? -3 : 3;
      return;
    }
    if (m.button != 0) return;
    var h = hitMap.filter(function(h) { return h.y == m.y && m.x >= h.x && m.x <= h.end; })[0];
    if (!h) return;
    if (!h.id) { if (windows[h.windowId] && windows[h.windowId].shown) active = h.windowId; return; }
    if (!w || h.windowId != active || h.revision != w.revision) return;
    var cs = controls(w), index = cs.map(function(i) { return i.id; }).indexOf(h.id);
    if (index < 0) return;
    w.focus = index;
    var item = cs[index];
    if (item.type == "button") announce(w, "action", item);
    else if (item.type == "select") key(m.x == h.previous ? "left" : "right");
  }
  function key(k) {
    var ids = visible(), w = windows[active];
    if (k == "ctrl-c" || k == "eof") { closeAll(); if (k == "eof") running.set(false); return; }
    if (!w) return;
    if (k == "ctrl-w") { close(w.id); return; }
    if ((k == "ctrl-n" || k == "ctrl-p") && ids.length > 0) { active = ids[(ids.indexOf(active) + (k == "ctrl-n" ? 1 : ids.length - 1)) % ids.length]; return; }
    if (k == "pgup" || k == "pgdn") { w.scroll += (k == "pgup" ? -1 : 1) * Math.max(1, Number(terminalSize().height) - 3); return; }
    syncCursors(w);
    var cs = controls(w);
    if (cs.length === 0) {
      if (k == "up" || k == "down") w.scroll += (k == "up" ? -1 : 1);
      return;
    }
    var item = cs[w.focus];
    if (!item) return;
    if (["tab", "down", "shift-tab", "up"].indexOf(k) >= 0) { w.focus = (w.focus + (k == "shift-tab" || k == "up" ? cs.length - 1 : 1)) % cs.length; w.followFocus = true; return; }
    if (k == "enter" || (k == " " && item.type == "button")) { announce(w, item.type == "button" ? "action" : "change", item); return; }
    if (item.type == "select") {
      if (k == "left" || k == "right" || k == " ") {
        item.value = item.options[(item.options.indexOf(item.value) + (k == "left" ? item.options.length - 1 : 1)) % item.options.length];
        announce(w, "change", item);
      } else if (k == "home") {
        item.value = item.options[0]; announce(w, "change", item);
      } else if (k == "end") {
        item.value = item.options[item.options.length - 1]; announce(w, "change", item);
      }
      return;
    }
    if (item.type == "input") {
      var gs = ow.screen.graphemes(item.value || "");
      var cur = isDef(w.cursors[item.id]) ? Math.max(0, Math.min(gs.length, w.cursors[item.id])) : gs.length;
      if (k == "left") { w.cursors[item.id] = Math.max(0, cur - 1); }
      else if (k == "right") { w.cursors[item.id] = Math.min(gs.length, cur + 1); }
      else if (k == "home" || k == "ctrl-a") { w.cursors[item.id] = 0; }
      else if (k == "end" || k == "ctrl-e") { w.cursors[item.id] = gs.length; }
      else if (k == "ctrl-u") { item.value = gs.slice(cur).join(""); w.cursors[item.id] = 0; }
      else if (k == "ctrl-k") { item.value = gs.slice(0, cur).join(""); w.cursors[item.id] = cur; }
      else if (k == "backspace") {
        if (cur > 0) {
          gs.splice(cur - 1, 1);
          item.value = gs.join("");
          w.cursors[item.id] = cur - 1;
        }
      } else if (k == "delete") {
        if (cur < gs.length) {
          gs.splice(cur, 1);
          item.value = gs.join("");
          w.cursors[item.id] = cur;
        }
      } else if (typeof k == "string" && ow.screen.graphemes(k).length == 1 && !/[\x00-\x1f\x7f-\x9f]/.test(k) && item.value.length + k.length <= 4096) {
        gs.splice(cur, 0, k);
        item.value = gs.join("");
        w.cursors[item.id] = cur + 1;
      }
    }
  }
  function release() {
    try {
      try { if (ui && mouseOn) ui.write("\x1b[?1000l\x1b[?1006l", false); }
      finally { mouseOn = false; if (ui) ui.altScreen(false); }
    }
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
      claimed = true; emit = callback; session = config.sessionId; providerConfig = config || {};
      var ready = new java.util.concurrent.CountDownLatch(1), startupError;
      try {
        ui = injectedUI || askConsole(); owns = !injectedUI;
        if (!ui.ansi) throw error("PROVIDER_UNAVAILABLE", "TUI requires an ANSI controlling terminal");
        if (owns) {
          var terminal = ui.console.getConsoleReader().getTerminal().unwrap();
          terminal.handle(Packages.org.jline.terminal.Terminal.Signal.WINCH, new Packages.org.jline.terminal.Terminal.SignalHandler({ handle: function() { resize.set(true); } }));
        }
        ow.loadFormat(); ow.loadScreen(); running.set(true);
        thread = new java.lang.Thread(new java.lang.Runnable({ run: function() {
          try {
            ui.raw(function() {
              ui.altScreen(true);
              mouseOn = resolveTuiOptions().pOpts.mouse !== false;
              if (mouseOn) ui.write("\x1b[?1000h\x1b[?1006h", false);
              ready.countDown();
              while (running.get()) {
                locked(render);
                var k = askKey(ui, 100, { mouse: mouseOn });
                if (isDef(k)) locked(function() {
                  if (isMap(k) && k.type == "mouse") {
                    // Rebuild targets after resize or concurrent view/window changes.
                    render(); mouse(k);
                  } else key(k);
                });
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
          windows[id] = { id: id, title: o.title || "OpenAF", revision: o.viewRevision, view: JSON.parse(JSON.stringify(o.view)), shown: false, focus: 0, scroll: 0, followFocus: true, cursors: {} };
          emit({ type: "ready", windowId: id }); return null;
        }
        if (!w) throw error("INVALID_STATE", "Unknown TUI window");
        switch (envelope.operation) {
        case "window.show": w.shown = true; active = id; break;
        case "window.hide": w.shown = false; chooseActive(); break;
        case "window.close": close(id); break;
        case "window.setTitle": w.title = o.title; break;
        case "window.setView": w.view = JSON.parse(JSON.stringify(o.view)); w.revision = o.viewRevision; w.focus = 0; w.scroll = 0; w.followFocus = true; w.cursors = {}; break;
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
