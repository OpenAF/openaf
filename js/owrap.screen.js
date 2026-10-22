// OpenWrap Screen TUI and rich terminal styling/layout library.
OpenWrap.screen = function(options) {
  ow.loadFormat();
  this.__options = {};
  this.configure(options || {});
  return this;
};

/** <odoc>
 * <key>ow.screen.configure(aOptions) : ow.screen</key>
 * Configures default screen options (theme, colorMode, unicode, borderStyle, align, spacing, padding, etc.).
 * </odoc> */
OpenWrap.screen.prototype.configure = function(options) {
  if (!isMap(options)) return this;
  var self = this;
  Object.keys(options).forEach(function(k) { self.__options[k] = options[k]; });
  return this;
};

/** <odoc>
 * <key>ow.screen.capabilities(aOptions) : Map</key>
 * Detects terminal capabilities including colorMode ("none", "16", "256", "truecolor"), colorDepth,
 * unicode support, width, and height. Respects NO_COLOR, FORCE_COLOR, COLORTERM, and TERM.
 * </odoc> */
OpenWrap.screen.prototype.capabilities = function(options) {
  var opts = isMap(options) ? options : {};
  var term = String(getEnv("TERM") || "");
  var ct = String(getEnv("COLORTERM") || "");
  var tp = String(getEnv("TERM_PROGRAM") || "");
  var lang = String(getEnv("LANG") || getEnv("LC_ALL") || "");
  var mode = opts.colorMode || this.__options.colorMode || "auto";
  if (mode == "auto") {
    var forceColor = String(getEnv("FORCE_COLOR") || "");
    if (isDef(getEnv("NO_COLOR")) && String(getEnv("NO_COLOR")) !== "") mode = "none";
    else if (forceColor == "3") mode = "truecolor";
    else if (forceColor == "2") mode = "256";
    else if (forceColor == "1") mode = "16";
    else if (forceColor == "0") mode = "none";
    else if (opts.ansi === false) mode = "none";
    else if (/24bit|truecolor/i.test(ct) || /iTerm\.app|WezTerm|vscode|alacritty|kitty|ghostty/i.test(tp) || /direct|truecolor/i.test(term)) mode = "truecolor";
    else if (/256color/i.test(term)) mode = "256";
    else if (opts.ansi === true || (term && term != "dumb")) mode = "256";
    else mode = "none";
  }
  var depth = mode == "truecolor" ? 16777216 : mode == "256" ? 256 : mode == "16" ? 16 : 0;
  var unicode = isBoolean(opts.unicode) ? opts.unicode : isBoolean(this.__options.unicode) ? this.__options.unicode : (lang.toUpperCase().indexOf("ASCII") < 0);
  var w = Number(opts.width || this.__options.width || getEnv("COLUMNS") || 80);
  var h = Number(opts.height || this.__options.height || getEnv("LINES") || 24);
  return {
    isTTY: java.lang.System.console() != null,
    ansi: mode != "none",
    width: w > 0 ? w : 80,
    height: h > 0 ? h : 24,
    colorDepth: depth,
    colorMode: mode,
    unicode: unicode,
    term: term
  };
};

OpenWrap.screen.__namedColors = {
  black:   { ansi16: 30, idx256: 0,   rgb: [0, 0, 0],       css: "#000000" },
  red:     { ansi16: 31, idx256: 1,   rgb: [205, 49, 49],   css: "#cd3131" },
  green:   { ansi16: 32, idx256: 2,   rgb: [13, 188, 121],  css: "#0dbc79" },
  yellow:  { ansi16: 33, idx256: 3,   rgb: [229, 229, 16],  css: "#e5e510" },
  blue:    { ansi16: 34, idx256: 4,   rgb: [36, 114, 200],  css: "#2472c8" },
  magenta: { ansi16: 35, idx256: 5,   rgb: [188, 63, 188],  css: "#bc3fbc" },
  cyan:    { ansi16: 36, idx256: 6,   rgb: [17, 168, 205],  css: "#11a8cd" },
  white:   { ansi16: 37, idx256: 7,   rgb: [229, 229, 229], css: "#e5e5e5" },
  gray:    { ansi16: 90, idx256: 244, rgb: [128, 128, 128], css: "#808080" },
  grey:    { ansi16: 90, idx256: 244, rgb: [128, 128, 128], css: "#808080" },
  bright_black:   { ansi16: 90, idx256: 8,  rgb: [102, 102, 102], css: "#666666" },
  bright_red:     { ansi16: 91, idx256: 9,  rgb: [241, 76, 76],   css: "#f14c4c" },
  bright_green:   { ansi16: 92, idx256: 10, rgb: [35, 209, 139],  css: "#23d18b" },
  bright_yellow:  { ansi16: 93, idx256: 11, rgb: [245, 245, 67],  css: "#f5f543" },
  bright_blue:    { ansi16: 94, idx256: 12, rgb: [59, 142, 234],  css: "#3b8eea" },
  bright_magenta: { ansi16: 95, idx256: 13, rgb: [214, 112, 214], css: "#d670d6" },
  bright_cyan:    { ansi16: 96, idx256: 14, rgb: [41, 184, 219],  css: "#29b8db" },
  bright_white:   { ansi16: 97, idx256: 15, rgb: [255, 255, 255], css: "#ffffff" },
  orange:  { ansi16: 33, idx256: 208, rgb: [255, 135, 0],   css: "#ff8700" },
  purple:  { ansi16: 35, idx256: 135, rgb: [175, 95, 255],  css: "#af5fff" },
  pink:    { ansi16: 95, idx256: 211, rgb: [255, 135, 175], css: "#ff87af" },
  teal:    { ansi16: 36, idx256: 37,  rgb: [0, 175, 175],   css: "#00afaf" },
  gold:    { ansi16: 93, idx256: 220, rgb: [255, 215, 0],   css: "#ffd700" },
  indigo:  { ansi16: 34, idx256: 63,  rgb: [95, 95, 255],   css: "#5f5fff" },
  lime:    { ansi16: 92, idx256: 118, rgb: [135, 255, 0],   css: "#87ff00" },
  coral:   { ansi16: 91, idx256: 209, rgb: [255, 135, 95],  css: "#ff875f" },
  slate:   { ansi16: 90, idx256: 60,  rgb: [95, 95, 135],   css: "#5f5f87" },
  sky:     { ansi16: 96, idx256: 117, rgb: [135, 215, 255], css: "#87d7ff" }
};

OpenWrap.screen.__rgbTo256 = function(r, g, b) {
  r = Math.max(0, Math.min(255, Math.round(Number(r) || 0)));
  g = Math.max(0, Math.min(255, Math.round(Number(g) || 0)));
  b = Math.max(0, Math.min(255, Math.round(Number(b) || 0)));
  if (r === g && g === b) {
    if (r < 8) return 16;
    if (r > 248) return 231;
    return Math.round(((r - 8) / 247) * 24) + 232;
  }
  var cr = Math.round((r / 255) * 5), cg = Math.round((g / 255) * 5), cb = Math.round((b / 255) * 5);
  return 16 + (36 * cr) + (6 * cg) + cb;
};

OpenWrap.screen.__rgbTo16 = function(r, g, b) {
  var best = 37, bestDist = Infinity;
  var names = Object.keys(OpenWrap.screen.__namedColors);
  for (var i = 0; i < 16 && i < names.length; i++) {
    var entry = OpenWrap.screen.__namedColors[names[i]];
    var dr = r - entry.rgb[0], dg = g - entry.rgb[1], db = b - entry.rgb[2];
    var dist = dr * dr + dg * dg + db * db;
    if (dist < bestDist) { bestDist = dist; best = entry.ansi16; }
  }
  return best;
};

OpenWrap.screen.__256ToRgb = function(idx) {
  idx = Math.max(0, Math.min(255, Math.round(Number(idx) || 0)));
  if (idx < 16) {
    var keys = ["black","red","green","yellow","blue","magenta","cyan","white","bright_black","bright_red","bright_green","bright_yellow","bright_blue","bright_magenta","bright_cyan","bright_white"];
    return OpenWrap.screen.__namedColors[keys[idx]].rgb.slice();
  }
  if (idx >= 232) {
    var v = 8 + (idx - 232) * 10;
    return [v, v, v];
  }
  var n = idx - 16;
  var steps = [0, 95, 135, 175, 215, 255];
  return [steps[Math.floor(n / 36) % 6], steps[Math.floor(n / 6) % 6], steps[n % 6]];
};

/** <odoc>
 * <key>ow.screen.parseColor(aSpec) : Map</key>
 * Parses a color specification (named color, 0-255 number, "FG(n)", "BG(n)", "#rgb", "#rrggbb",
 * "rgb(r,g,b)", or [r,g,b]) into a normalized descriptor with { type, r, g, b, idx256, ansi16, css }.
 * Returns null if invalid or empty.
 * </odoc> */
OpenWrap.screen.prototype.parseColor = function(spec) {
  if (isUnDef(spec) || spec === null || spec === "") return null;
  if (typeof spec == "number" && isFinite(spec) && spec >= 0 && spec <= 255) {
    var idx = Math.round(spec), rgb = OpenWrap.screen.__256ToRgb(idx);
    return {
      type: "256", r: rgb[0], g: rgb[1], b: rgb[2], idx256: idx,
      ansi16: OpenWrap.screen.__rgbTo16(rgb[0], rgb[1], rgb[2]),
      css: "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")"
    };
  }
  if (Array.isArray(spec) && spec.length === 3 && spec.every(function(x) { return typeof x == "number" && isFinite(x) && x >= 0 && x <= 255; })) {
    var r = Math.round(spec[0]), g = Math.round(spec[1]), b = Math.round(spec[2]);
    return {
      type: "rgb", r: r, g: g, b: b,
      idx256: OpenWrap.screen.__rgbTo256(r, g, b),
      ansi16: OpenWrap.screen.__rgbTo16(r, g, b),
      css: "rgb(" + r + "," + g + "," + b + ")"
    };
  }
  if (typeof spec != "string") return null;
  var s = spec.trim();
  if (!s || s.toLowerCase() == "default" || s.toLowerCase() == "none") return null;
  var lower = s.toLowerCase().replace(/[\s-]+/g, "_");
  if (lower.indexOf("fg_") === 0) lower = lower.substring(3);
  else if (lower.indexOf("bg_") === 0) lower = lower.substring(3);
  if (Object.prototype.hasOwnProperty.call(OpenWrap.screen.__namedColors, lower)) {
    var c = OpenWrap.screen.__namedColors[lower];
    return { type: "named", name: lower, r: c.rgb[0], g: c.rgb[1], b: c.rgb[2], idx256: c.idx256, ansi16: c.ansi16, css: c.css };
  }
  var m;
  if ((m = /^#([0-9a-fA-F]{3})$/.exec(s))) {
    var r1 = parseInt(m[1][0] + m[1][0], 16), g1 = parseInt(m[1][1] + m[1][1], 16), b1 = parseInt(m[1][2] + m[1][2], 16);
    return { type: "rgb", r: r1, g: g1, b: b1, idx256: OpenWrap.screen.__rgbTo256(r1, g1, b1), ansi16: OpenWrap.screen.__rgbTo16(r1, g1, b1), css: "rgb(" + r1 + "," + g1 + "," + b1 + ")" };
  }
  if ((m = /^#([0-9a-fA-F]{6})$/.exec(s))) {
    var r2 = parseInt(m[1].substring(0, 2), 16), g2 = parseInt(m[1].substring(2, 4), 16), b2 = parseInt(m[1].substring(4, 6), 16);
    return { type: "rgb", r: r2, g: g2, b: b2, idx256: OpenWrap.screen.__rgbTo256(r2, g2, b2), ansi16: OpenWrap.screen.__rgbTo16(r2, g2, b2), css: "#" + m[1].toLowerCase() };
  }
  if ((m = /^(?:(?:fg_|bg_)?rgb)\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.exec(s))) {
    var r3 = Number(m[1]), g3 = Number(m[2]), b3 = Number(m[3]);
    if (r3 <= 255 && g3 <= 255 && b3 <= 255) {
      return { type: "rgb", r: r3, g: g3, b: b3, idx256: OpenWrap.screen.__rgbTo256(r3, g3, b3), ansi16: OpenWrap.screen.__rgbTo16(r3, g3, b3), css: "rgb(" + r3 + "," + g3 + "," + b3 + ")" };
    }
  }
  if ((m = /^(?:(?:fg|bg|color)\(\s*(\d{1,3})\s*\)|(\d{1,3}))$/i.exec(s))) {
    var idx2 = Number(m[1] || m[2]);
    if (idx2 >= 0 && idx2 <= 255) return this.parseColor(idx2);
  }
  return null;
};

/** <odoc>
 * <key>ow.screen.colorSeq(aSpec, isBackground, aColorMode) : String</key>
 * Returns the SGR parameter sequence (e.g. "38;2;80;180;255" or "38;5;39" or "36") for a color
 * specification given the target colorMode ("truecolor", "256", "16", "none").
 * </odoc> */
OpenWrap.screen.prototype.colorSeq = function(spec, isBg, colorMode) {
  var mode = colorMode || this.capabilities().colorMode;
  if (mode == "none") return "";
  var c = (isMap(spec) && isNumber(spec.idx256)) ? spec : this.parseColor(spec);
  if (!c) return "";
  if (mode == "truecolor" && (c.type == "rgb" || c.type == "named")) {
    return (isBg ? "48;2;" : "38;2;") + c.r + ";" + c.g + ";" + c.b;
  }
  if (mode == "truecolor" || mode == "256") {
    if (c.type == "named" && c.idx256 < 16 && mode == "16") {
      return String(isBg ? c.ansi16 + 10 : c.ansi16);
    }
    return (isBg ? "48;5;" : "38;5;") + c.idx256;
  }
  return String(isBg ? c.ansi16 + 10 : c.ansi16);
};

/** <odoc>
 * <key>ow.screen.parseStyle(aStyle) : Map</key>
 * Parses a style string (e.g. "BOLD,ITALIC,FG(39),BG(#1e1e2e)") or style map
 * ({ fg, bg, bold, dim, faint, italic, underline, doubleUnderline, blink, invert, reverse, hidden, strikethrough, align })
 * into a normalized style map.
 * </odoc> */
OpenWrap.screen.prototype.parseStyle = function(style) {
  var out = {};
  if (isUnDef(style) || style === null) return out;
  var self = this;
  if (typeof style == "string") {
    var tokens = [];
    var tmp = style.replace(/(?:(?:fg_|bg_)?rgb|fg|bg|color)\([^)]*\)/gi, function(m) {
      tokens.push(m);
      return "__TOK_" + (tokens.length - 1) + "__";
    });
    tmp.split(",").forEach(function(part) {
      var t = part.trim().replace(/__TOK_(\d+)__/g, function(_, i) { return tokens[Number(i)]; });
      if (!t) return;
      var u = t.toUpperCase();
      if (u == "BOLD" || u == "INTENSITY_BOLD") out.bold = true;
      else if (u == "DIM" || u == "FAINT" || u == "INTENSITY_FAINT") out.dim = true;
      else if (u == "ITALIC") out.italic = true;
      else if (u == "UNDERLINE") out.underline = true;
      else if (u == "DOUBLE_UNDERLINE" || u == "UNDERLINE_DOUBLE") out.doubleUnderline = true;
      else if (u == "BLINK" || u == "BLINK_SLOW" || u == "BLINK_FAST") out.blink = true;
      else if (u == "REVERSE" || u == "INVERT" || u == "NEGATIVE_ON") out.reverse = true;
      else if (u == "HIDDEN" || u == "CONCEAL_ON") out.hidden = true;
      else if (u == "STRIKETHROUGH") out.strikethrough = true;
      else if (u == "LEFT" || u == "CENTER" || u == "RIGHT") out.align = u.toLowerCase();
      else if (/^BG(_|\()/i.test(t)) {
        var bgc = self.parseColor(t);
        if (bgc) out.bg = t;
      } else {
        var fgc = self.parseColor(t);
        if (fgc) out.fg = t;
      }
    });
    return out;
  }
  if (isMap(style)) {
    if (isDef(style.fg) && style.fg !== null && style.fg !== "") out.fg = style.fg;
    else if (isDef(style.color) && style.color !== null && style.color !== "") out.fg = style.color;
    if (isDef(style.bg) && style.bg !== null && style.bg !== "") out.bg = style.bg;
    else if (isDef(style.background) && style.background !== null && style.background !== "") out.bg = style.background;
    if (style.bold) out.bold = true;
    if (style.dim || style.faint) out.dim = true;
    if (style.italic) out.italic = true;
    if (style.underline) out.underline = true;
    if (style.doubleUnderline) out.doubleUnderline = true;
    if (style.blink) out.blink = true;
    if (style.reverse || style.invert) out.reverse = true;
    if (style.hidden || style.conceal) out.hidden = true;
    if (style.strikethrough || style.strike) out.strikethrough = true;
    if (typeof style.align == "string" && ["left", "center", "right"].indexOf(style.align.toLowerCase()) >= 0) out.align = style.align.toLowerCase();
  }
  return out;
};

/** <odoc>
 * <key>ow.screen.sgr(aStyle, aColorMode) : String</key>
 * Returns the complete ANSI SGR escape sequence (e.g. "\x1b[1;3;38;5;39m") for aStyle.
 * Returns "" if no attributes are active or colorMode is "none" (unless force is used).
 * </odoc> */
OpenWrap.screen.prototype.sgr = function(style, colorMode) {
  var mode = colorMode || this.capabilities().colorMode;
  if (mode == "none") return "";
  var st = this.parseStyle(style), codes = [];
  if (st.bold) codes.push("1");
  if (st.dim) codes.push("2");
  if (st.italic) codes.push("3");
  if (st.underline) codes.push("4");
  if (st.blink) codes.push("5");
  if (st.reverse) codes.push("7");
  if (st.hidden) codes.push("8");
  if (st.strikethrough) codes.push("9");
  if (st.doubleUnderline) codes.push("21");
  if (isDef(st.fg)) { var f = this.colorSeq(st.fg, false, mode); if (f) codes.push(f); }
  if (isDef(st.bg)) { var b = this.colorSeq(st.bg, true, mode); if (b) codes.push(b); }
  return codes.length > 0 ? "\x1b[" + codes.join(";") + "m" : "";
};

/** <odoc>
 * <key>ow.screen.style(aText, aStyle, aOptions) : String</key>
 * Applies rich ANSI styling (foreground/background 16/256/truecolor, bold, dim/faint, italic,
 * underline, doubleUnderline, blink, reverse/invert, hidden, strikethrough) to aText.
 * Preserves nested resets by re-applying the outer SGR sequence before continuing.
 * </odoc> */
OpenWrap.screen.prototype.style = function(text, style, options) {
  var str = isDef(text) && text !== null ? String(text) : "";
  if (!str && (!isMap(options) || !options.padEmpty)) return "";
  var opts = isMap(options) ? options : {};
  var mode = opts.colorMode || (opts.force ? "truecolor" : this.capabilities(opts).colorMode);
  var seq = this.sgr(style, mode);
  if (!seq) return str;
  var reset = "\x1b[0m";
  var body = str.replace(/\x1b\[0?m/g, reset + seq);
  return seq + body + (opts.noReset ? "" : reset);
};

/** <odoc>
 * <key>ow.screen.stripAnsi(aText) : String</key>
 * Removes ANSI CSI and OSC escape sequences from aText.
 * </odoc> */
OpenWrap.screen.prototype.stripAnsi = function(text) {
  return String(isDef(text) && text !== null ? text : "").replace(/\x1b(?:\[[0-9;?]*[ -\/]*[@-~]|\][^\u0007\u001b]*(?:\u0007|\x1b\\))/g, "");
};

/** <odoc>
 * <key>ow.screen.sanitize(aText, allowMultiline) : String</key>
 * Sanitizes untrusted application text by stripping ANSI/OSC escape sequences and C0/C1 control characters.
 * </odoc> */
OpenWrap.screen.prototype.sanitize = function(text, allowMultiline) {
  var s = String(isDef(text) && text !== null ? text : "");
  // Strip OSC sequences and CSI sequences so untrusted strings cannot inject terminal escapes
  s = s.replace(/\x1b\][^\u0007\u001b]*(?:\u0007|\x1b\\)/g, " ");
  s = s.replace(/\x1b\[[0-9;?]*[ -\/]*[@-~]/g, " ");
  return s.replace(allowMultiline ? /[\x00-\x09\x0b-\x1f\x7f-\x9f]/g : /[\x00-\x1f\x7f-\x9f]/g, " ");
};

/** <odoc>
 * <key>ow.screen.graphemes(aText) : Array</key>
 * Splits a plain UTF-8 string into user-perceived grapheme clusters (handling surrogate pairs,
 * combining marks, skin-tone modifiers, variation selectors, keycaps, regional indicator flags, and ZWJ sequences).
 * </odoc> */
OpenWrap.screen.prototype.graphemes = function(text) {
  var str = String(isDef(text) && text !== null ? text : "");
  var out = [], idx = 0;
  while (idx < str.length) {
    var part = ow.format.string._nextWrapToken(str, idx);
    if (!part || part.next <= idx) {
      var cp = str.codePointAt(idx);
      var step = (isDef(cp) && cp > 0xFFFF) ? 2 : 1;
      out.push(str.slice(idx, idx + step));
      idx += step;
    } else {
      out.push(part.token);
      idx = part.next;
    }
  }
  return out;
};

/** <odoc>
 * <key>ow.screen.width(aText) : Number</key>
 * Returns the visible terminal column width of aText (ignoring ANSI sequences and counting wide CJK/emoji as 2 columns).
 * </odoc> */
OpenWrap.screen.prototype.width = function(text) {
  return visibleLength(String(isDef(text) && text !== null ? text : ""));
};

/** <odoc>
 * <key>ow.screen.clip(aText, aWidth, aEllipsis) : String</key>
 * Clips aText to at most aWidth visible columns without splitting UTF-8 grapheme clusters or ANSI escapes.
 * </odoc> */
OpenWrap.screen.prototype.clip = function(text, width, ellipsis) {
  var s = String(isDef(text) && text !== null ? text : "");
  var maxW = Math.max(0, Number(width) || 0);
  var ell = isDef(ellipsis) ? String(ellipsis) : "";
  if (visibleLength(s) <= maxW) return s;
  var limit = Math.max(0, maxW - visibleLength(ell)), out = "", w = 0, hasEsc = false, idx = 0;
  while (idx < s.length) {
    var part = ow.format.string._nextWrapToken(s, idx);
    if (!part || part.next <= idx) break;
    if (/^\x1b\[/.test(part.token)) {
      out += part.token;
      hasEsc = true;
      idx = part.next;
      continue;
    }
    if (w + part.width > limit) break;
    out += part.token;
    w += part.width;
    idx = part.next;
  }
  return out + ell + (hasEsc ? "\x1b[0m" : "");
};

/** <odoc>
 * <key>ow.screen.alignLine(aText, aWidth, aAlign, aFillChar, aFillStyle) : String</key>
 * Aligns a single line of text ("left", "center", or "right") within aWidth visible columns,
 * clipping if longer and padding with aFillChar (optionally styled with aFillStyle).
 * Full UTF-8 wide characters and ANSI sequences are preserved accurately.
 * </odoc> */
OpenWrap.screen.prototype.alignLine = function(text, width, align, fillChar, fillStyle, options) {
  var maxW = Math.max(0, Number(width) || 0);
  var clipped = this.clip(isDef(text) ? String(text) : "", maxW, "");
  var vis = visibleLength(clipped);
  var rem = Math.max(0, maxW - vis);
  var ch = (typeof fillChar == "string" && fillChar.length > 0) ? this.graphemes(fillChar)[0] : " ";
  var chW = Math.max(1, visibleLength(ch));
  var mode = isMap(options) && options.colorMode ? options.colorMode : this.capabilities(options).colorMode;
  var self = this;
  function pad(cols) {
    if (cols <= 0) return "";
    var count = Math.floor(cols / chW), extra = cols - count * chW;
    var raw = repeat(count, ch) + (extra > 0 ? repeat(extra, " ") : "");
    return fillStyle ? self.style(raw, fillStyle, { colorMode: mode }) : raw;
  }
  var al = String(align || this.__options.align || "left").toLowerCase();
  if (al == "right") return pad(rem) + clipped;
  if (al == "center") {
    var left = Math.floor(rem / 2), right = rem - left;
    return pad(left) + clipped + pad(right);
  }
  return clipped + pad(rem);
};

/** <odoc>
 * <key>ow.screen.align(aText, aWidth, aAlign, aFillChar, aFillStyle) : String</key>
 * Aligns multi-line text ("left", "center", or "right") to aWidth visible columns per line.
 * </odoc> */
OpenWrap.screen.prototype.align = function(text, width, align, fillChar, fillStyle, options) {
  var self = this;
  return String(isDef(text) && text !== null ? text : "").split(/\r?\n/).map(function(line) {
    return self.alignLine(line, width, align, fillChar, fillStyle, options);
  }).join("\n");
};

/** <odoc>
 * <key>ow.screen.wrap(aText, aWidth) : Array</key>
 * Word-wraps aText to aWidth visible columns (preserving grapheme clusters, wide characters, and ANSI codes)
 * and returns an array of wrapped lines.
 * </odoc> */
OpenWrap.screen.prototype.wrap = function(text, width) {
  var w = Math.max(1, Number(width) || 80);
  var raw = String(isDef(text) && text !== null ? text : "");
  var lines = [];
  var self = this;
  raw.split(/\r?\n/).forEach(function(paragraph) {
    if (paragraph === "") { lines.push(""); return; }
    String(ow.format.string.wordWrap(paragraph, w)).split(/\r?\n/).forEach(function(l) {
      if (visibleLength(l) > w) {
        // Hard-wrap single unbreakable tokens wider than w
        var cur = "", cw = 0, idx = 0;
        while (idx < l.length) {
          var part = ow.format.string._nextWrapToken(l, idx);
          if (!part || part.next <= idx) break;
          if (/^\x1b\[/.test(part.token)) { cur += part.token; idx = part.next; continue; }
          if (cw + part.width > w && cw > 0) {
            lines.push(cur);
            cur = part.token;
            cw = part.width;
          } else {
            cur += part.token;
            cw += part.width;
          }
          idx = part.next;
        }
        if (cur.length > 0 || cw > 0) lines.push(cur);
      } else {
        lines.push(l);
      }
    });
  });
  return lines.length > 0 ? lines : [""];
};

/** <odoc>
 * <key>ow.screen.space(aLines, aOptions) : Array</key>
 * Applies padding ({ top, bottom, left, right } or number) and margins ({ top, bottom, left, right } or number)
 * and item gap spacing to an array of lines or string.
 * </odoc> */
OpenWrap.screen.prototype.space = function(lines, options) {
  var opts = isMap(options) ? options : {};
  var arr = Array.isArray(lines) ? lines.slice() : String(isDef(lines) ? lines : "").split(/\r?\n/);
  function expandBox(v) {
    if (typeof v == "number" && isFinite(v)) { var n = Math.max(0, Math.round(v)); return { top: n, bottom: n, left: n, right: n }; }
    if (isMap(v)) return {
      top: Math.max(0, Math.round(Number(v.top || v.y || 0))),
      bottom: Math.max(0, Math.round(Number(v.bottom || v.y || 0))),
      left: Math.max(0, Math.round(Number(v.left || v.x || 0))),
      right: Math.max(0, Math.round(Number(v.right || v.x || 0)))
    };
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }
  var pad = expandBox(opts.padding), mar = expandBox(opts.margin);
  var width = isNumber(opts.width) ? Math.max(1, Math.round(opts.width)) : arr.reduce(function(m, l) { return Math.max(m, visibleLength(l)); }, 0) + pad.left + pad.right + mar.left + mar.right;
  var innerW = Math.max(0, width - mar.left - mar.right - pad.left - pad.right);
  var align = opts.align || "left";
  var bgStyle = opts.bgStyle || null;
  var self = this;
  var out = [];
  var marL = repeat(mar.left, " "), marR = repeat(mar.right, " ");
  var padL = bgStyle ? self.style(repeat(pad.left, " "), bgStyle, opts) : repeat(pad.left, " ");
  var padR = bgStyle ? self.style(repeat(pad.right, " "), bgStyle, opts) : repeat(pad.right, " ");
  var emptyInner = bgStyle ? self.style(repeat(innerW + pad.left + pad.right, " "), bgStyle, opts) : repeat(innerW + pad.left + pad.right, " ");
  var emptyMargin = repeat(width, " ");
  for (var mt = 0; mt < mar.top; mt++) out.push(emptyMargin);
  for (var pt = 0; pt < pad.top; pt++) out.push(marL + emptyInner + marR);
  arr.forEach(function(l) {
    var aligned = self.alignLine(l, innerW, align, " ", bgStyle, opts);
    out.push(marL + padL + aligned + padR + marR);
  });
  for (var pb = 0; pb < pad.bottom; pb++) out.push(marL + emptyInner + marR);
  for (var mb = 0; mb < mar.bottom; mb++) out.push(emptyMargin);
  return out;
};

OpenWrap.screen.__borders = {
  rounded: { tl: "╭", tr: "╮", bl: "╰", br: "╯", h: "─", v: "│", lt: "├", rt: "┤" },
  single:  { tl: "┌", tr: "┐", bl: "└", br: "┘", h: "─", v: "│", lt: "├", rt: "┤" },
  double:  { tl: "╔", tr: "╗", bl: "╚", br: "╝", h: "═", v: "║", lt: "╠", rt: "╣" },
  heavy:   { tl: "┏", tr: "┓", bl: "┗", br: "┛", h: "━", v: "┃", lt: "┣", rt: "┫" },
  ascii:   { tl: "+", tr: "+", bl: "+", br: "+", h: "-", v: "|", lt: "+", rt: "+" },
  none:    { tl: " ", tr: " ", bl: " ", br: " ", h: " ", v: " ", lt: " ", rt: " " }
};

/** <odoc>
 * <key>ow.screen.borderChars(aStyle, aUnicode) : Map</key>
 * Returns the box-drawing characters for aStyle ("rounded", "single", "double", "heavy", "ascii", "none").
 * Automatically falls back to "ascii" when aUnicode is false.
 * </odoc> */
OpenWrap.screen.prototype.borderChars = function(style, unicode) {
  var st = String(style || this.__options.borderStyle || "rounded").toLowerCase();
  if (unicode === false && st != "none") st = "ascii";
  return OpenWrap.screen.__borders[st] || OpenWrap.screen.__borders.rounded;
};

/** <odoc>
 * <key>ow.screen.hr(aWidth, aOptions) : String</key>
 * Renders a horizontal rule / divider of aWidth columns with optional label, align ("left", "center", "right"),
 * character, and style.
 * </odoc> */
OpenWrap.screen.prototype.hr = function(width, options) {
  var opts = isMap(options) ? options : {};
  var caps = this.capabilities(opts);
  var w = Math.max(1, Number(width || caps.width || 80));
  var ch = opts.char ? this.graphemes(String(opts.char))[0] : (caps.unicode ? "─" : "-");
  var lineStyle = opts.style || opts.lineStyle || "FAINT";
  var label = isDef(opts.label) && String(opts.label).length > 0 ? " " + this.sanitize(opts.label, false) + " " : "";
  if (!label || visibleLength(label) >= w - 2) {
    return this.style(this.alignLine(label, w, opts.align || "center", ch), lineStyle, { colorMode: caps.colorMode });
  }
  var lw = visibleLength(label), rem = w - lw;
  var align = String(opts.align || "center").toLowerCase();
  var leftCols = align == "left" ? Math.min(2, rem) : align == "right" ? Math.max(0, rem - 2) : Math.floor(rem / 2);
  var rightCols = Math.max(0, rem - leftCols);
  var styledLabel = this.style(label, opts.labelStyle || opts.style || "BOLD", { colorMode: caps.colorMode });
  return this.style(repeat(leftCols, ch), lineStyle, { colorMode: caps.colorMode }) +
         styledLabel +
         this.style(repeat(rightCols, ch), lineStyle, { colorMode: caps.colorMode });
};

/** <odoc>
 * <key>ow.screen.box(aContent, aOptions) : String</key>
 * Renders a bordered box/panel around aContent (string or array of lines).
 * Options: width, height, title, titleAlign ("left", "center", "right"), footer, footerAlign,
 * align ("left", "center", "right"), padding (number or {top,bottom,left,right}), borderStyle
 * ("rounded", "single", "double", "heavy", "ascii", "none"), borderColor/borderStyleSpec, titleStyle, style.
 * </odoc> */
OpenWrap.screen.prototype.box = function(content, options) {
  var opts = isMap(options) ? options : {};
  var caps = this.capabilities(opts);
  var bchars = this.borderChars(opts.borderStyle || "rounded", caps.unicode);
  var pad = typeof opts.padding == "number" ? { top: 0, bottom: 0, left: opts.padding, right: opts.padding } :
            isMap(opts.padding) ? { top: Number(opts.padding.top || 0), bottom: Number(opts.padding.bottom || 0), left: Number(opts.padding.left || 0), right: Number(opts.padding.right || 0) } :
            { top: 0, bottom: 0, left: 1, right: 1 };
  var rawLines = Array.isArray(content) ? content : String(isDef(content) ? content : "").split(/\r?\n/);
  var totalW = Math.max(4, Number(opts.width || caps.width || 80));
  var innerW = Math.max(1, totalW - 2 - pad.left - pad.right);
  var self = this;
  var wrapped = [];
  rawLines.forEach(function(l) {
    self.wrap(l, innerW).forEach(function(wl) { wrapped.push(wl); });
  });
  var bStyle = opts.borderColor || opts.borderStyleSpec || "FAINT";
  var tStyle = opts.titleStyle || "BOLD";
  var cStyle = opts.style || null;
  var align = opts.align || "left";
  var mode = caps.colorMode;

  function buildEdge(leftCh, rightCh, fillCh, label, labelAlign, lStyle) {
    var edgeW = totalW - 2;
    if (!label) return self.style(leftCh + repeat(edgeW, fillCh) + rightCh, bStyle, { colorMode: mode });
    var cleanLbl = " " + self.clip(self.sanitize(label, false), Math.max(1, edgeW - 2), "") + " ";
    var lblW = visibleLength(cleanLbl);
    var rem = Math.max(0, edgeW - lblW);
    var al = String(labelAlign || "left").toLowerCase();
    var lCols = al == "right" ? Math.max(0, rem - 1) : al == "center" ? Math.floor(rem / 2) : Math.min(1, rem);
    var rCols = Math.max(0, rem - lCols);
    return self.style(leftCh + repeat(lCols, fillCh), bStyle, { colorMode: mode }) +
           self.style(cleanLbl, lStyle, { colorMode: mode }) +
           self.style(repeat(rCols, fillCh) + rightCh, bStyle, { colorMode: mode });
  }

  var out = [];
  out.push(buildEdge(bchars.tl, bchars.tr, bchars.h, opts.title, opts.titleAlign || "left", tStyle));
  var vLeft = this.style(bchars.v, bStyle, { colorMode: mode });
  var vRight = this.style(bchars.v, bStyle, { colorMode: mode });
  var padL = repeat(pad.left, " "), padR = repeat(pad.right, " ");
  for (var pt = 0; pt < pad.top; pt++) {
    var emptyRow = padL + repeat(innerW, " ") + padR;
    out.push(vLeft + (cStyle ? this.style(emptyRow, cStyle, { colorMode: mode }) : emptyRow) + vRight);
  }
  var targetRows = isNumber(opts.height) ? Math.max(1, opts.height - 2 - pad.top - pad.bottom) : wrapped.length;
  for (var i = 0; i < targetRows; i++) {
    var line = i < wrapped.length ? wrapped[i] : "";
    var aligned = padL + this.alignLine(line, innerW, align, " ", null, { colorMode: mode }) + padR;
    out.push(vLeft + (cStyle ? this.style(aligned, cStyle, { colorMode: mode }) : aligned) + vRight);
  }
  for (var pb = 0; pb < pad.bottom; pb++) {
    var emptyRowB = padL + repeat(innerW, " ") + padR;
    out.push(vLeft + (cStyle ? this.style(emptyRowB, cStyle, { colorMode: mode }) : emptyRowB) + vRight);
  }
  out.push(buildEdge(bchars.bl, bchars.br, bchars.h, opts.footer, opts.footerAlign || "right", opts.footerStyle || bStyle));
  return out.join("\n");
};

OpenWrap.screen.__themes = {
  default: {
    none: {
      tabBar: { bold: true },
      tabActive: { bold: true, reverse: true },
      tabInactive: {},
      border: {},
      title: { bold: true },
      text: {},
      heading: { bold: true, underline: true },
      muted: {},
      label: { bold: true },
      focusLabel: { bold: true },
      input: { underline: true },
      focusInput: { bold: true, reverse: true },
      select: {},
      focusSelect: { bold: true, reverse: true },
      button: { bold: true },
      focusButton: { bold: true, reverse: true },
      progressFilled: { bold: true },
      progressEmpty: {},
      badge: { bold: true, reverse: true },
      statusBar: { reverse: true },
      scrollbarThumb: { bold: true },
      scrollbarTrack: {},
      accent: { bold: true },
      positive: { bold: true },
      warning: { bold: true },
      negative: { bold: true }
    },
    "16": {
      tabBar: { fg: "white", bg: "black" },
      tabActive: { fg: "black", bg: "cyan", bold: true },
      tabInactive: { fg: "white", dim: true },
      border: { fg: "cyan", dim: true },
      title: { fg: "bright_cyan", bold: true },
      text: { fg: "white" },
      heading: { fg: "bright_cyan", bold: true, underline: true },
      muted: { fg: "white", dim: true },
      label: { fg: "cyan", bold: true },
      focusLabel: { fg: "bright_yellow", bold: true },
      input: { fg: "bright_white", underline: true },
      focusInput: { fg: "black", bg: "bright_cyan", bold: true },
      select: { fg: "bright_white" },
      focusSelect: { fg: "black", bg: "bright_cyan", bold: true },
      button: { fg: "cyan", bold: true },
      focusButton: { fg: "black", bg: "bright_yellow", bold: true },
      progressFilled: { fg: "green", bold: true },
      progressEmpty: { fg: "white", dim: true },
      badge: { fg: "black", bg: "cyan", bold: true },
      statusBar: { fg: "black", bg: "white" },
      scrollbarThumb: { fg: "cyan", bold: true },
      scrollbarTrack: { fg: "white", dim: true },
      accent: { fg: "cyan", bold: true },
      positive: { fg: "green", bold: true },
      warning: { fg: "yellow", bold: true },
      negative: { fg: "red", bold: true }
    },
    "256": {
      tabBar: { fg: 252, bg: 236 },
      tabActive: { fg: 232, bg: 39, bold: true },
      tabInactive: { fg: 246, bg: 236 },
      border: { fg: 240 },
      title: { fg: 39, bold: true },
      text: { fg: 252 },
      heading: { fg: 81, bold: true, underline: true },
      muted: { fg: 244 },
      label: { fg: 117, bold: true },
      focusLabel: { fg: 220, bold: true },
      input: { fg: 255, bg: 237 },
      focusInput: { fg: 232, bg: 117, bold: true },
      select: { fg: 255, bg: 237 },
      focusSelect: { fg: 232, bg: 117, bold: true },
      button: { fg: 39, bg: 237, bold: true },
      focusButton: { fg: 232, bg: 220, bold: true },
      progressFilled: { fg: 76, bold: true },
      progressEmpty: { fg: 239 },
      badge: { fg: 232, bg: 39, bold: true },
      statusBar: { fg: 252, bg: 236 },
      scrollbarThumb: { fg: 39, bold: true },
      scrollbarTrack: { fg: 238 },
      accent: { fg: 39, bold: true },
      positive: { fg: 76, bold: true },
      warning: { fg: 214, bold: true },
      negative: { fg: 196, bold: true }
    },
    truecolor: {
      tabBar: { fg: "#cdd6f4", bg: "#1e1e2e" },
      tabActive: { fg: "#11111b", bg: "#89b4fa", bold: true },
      tabInactive: { fg: "#9399b2", bg: "#1e1e2e" },
      border: { fg: "#585b70" },
      title: { fg: "#89b4fa", bold: true },
      text: { fg: "#cdd6f4" },
      heading: { fg: "#89dceb", bold: true, underline: true },
      muted: { fg: "#7f849c" },
      label: { fg: "#89b4fa", bold: true },
      focusLabel: { fg: "#f9e2af", bold: true },
      input: { fg: "#cdd6f4", bg: "#313244" },
      focusInput: { fg: "#11111b", bg: "#89dceb", bold: true },
      select: { fg: "#cdd6f4", bg: "#313244" },
      focusSelect: { fg: "#11111b", bg: "#89dceb", bold: true },
      button: { fg: "#89b4fa", bg: "#313244", bold: true },
      focusButton: { fg: "#11111b", bg: "#f9e2af", bold: true },
      progressFilled: { fg: "#a6e3a1", bold: true },
      progressEmpty: { fg: "#45475a" },
      badge: { fg: "#11111b", bg: "#89b4fa", bold: true },
      statusBar: { fg: "#cdd6f4", bg: "#1e1e2e" },
      scrollbarThumb: { fg: "#89b4fa", bold: true },
      scrollbarTrack: { fg: "#313244" },
      accent: { fg: "#89b4fa", bold: true },
      positive: { fg: "#a6e3a1", bold: true },
      warning: { fg: "#f9e2af", bold: true },
      negative: { fg: "#f38ba8", bold: true }
    }
  },
  ocean: {
    truecolor: {
      tabBar: { fg: "#e0f2fe", bg: "#0c4a6e" },
      tabActive: { fg: "#082f49", bg: "#38bdf8", bold: true },
      tabInactive: { fg: "#7dd3fc", bg: "#0c4a6e" },
      border: { fg: "#0284c7" },
      title: { fg: "#38bdf8", bold: true },
      text: { fg: "#f0f9ff" },
      heading: { fg: "#7dd3fc", bold: true, underline: true },
      muted: { fg: "#64748b" },
      label: { fg: "#38bdf8", bold: true },
      focusLabel: { fg: "#fde047", bold: true },
      input: { fg: "#f0f9ff", bg: "#075985" },
      focusInput: { fg: "#082f49", bg: "#7dd3fc", bold: true },
      select: { fg: "#f0f9ff", bg: "#075985" },
      focusSelect: { fg: "#082f49", bg: "#7dd3fc", bold: true },
      button: { fg: "#38bdf8", bg: "#075985", bold: true },
      focusButton: { fg: "#082f49", bg: "#fde047", bold: true },
      progressFilled: { fg: "#34d399", bold: true },
      progressEmpty: { fg: "#0369a1" },
      badge: { fg: "#082f49", bg: "#38bdf8", bold: true },
      statusBar: { fg: "#e0f2fe", bg: "#0c4a6e" },
      scrollbarThumb: { fg: "#38bdf8", bold: true },
      scrollbarTrack: { fg: "#075985" },
      accent: { fg: "#38bdf8", bold: true },
      positive: { fg: "#34d399", bold: true },
      warning: { fg: "#fbbf24", bold: true },
      negative: { fg: "#fb7185", bold: true }
    }
  },
  light: {
    truecolor: {
      tabBar: { fg: "#1e293b", bg: "#e2e8f0" },
      tabActive: { fg: "#ffffff", bg: "#2563eb", bold: true },
      tabInactive: { fg: "#475569", bg: "#e2e8f0" },
      border: { fg: "#94a3b8" },
      title: { fg: "#1d4ed8", bold: true },
      text: { fg: "#0f172a" },
      heading: { fg: "#1d4ed8", bold: true, underline: true },
      muted: { fg: "#64748b" },
      label: { fg: "#1e40af", bold: true },
      focusLabel: { fg: "#b45309", bold: true },
      input: { fg: "#0f172a", bg: "#f1f5f9" },
      focusInput: { fg: "#ffffff", bg: "#2563eb", bold: true },
      select: { fg: "#0f172a", bg: "#f1f5f9" },
      focusSelect: { fg: "#ffffff", bg: "#2563eb", bold: true },
      button: { fg: "#1d4ed8", bg: "#e2e8f0", bold: true },
      focusButton: { fg: "#ffffff", bg: "#d97706", bold: true },
      progressFilled: { fg: "#16a34a", bold: true },
      progressEmpty: { fg: "#cbd5e1" },
      badge: { fg: "#ffffff", bg: "#2563eb", bold: true },
      statusBar: { fg: "#1e293b", bg: "#e2e8f0" },
      scrollbarThumb: { fg: "#2563eb", bold: true },
      scrollbarTrack: { fg: "#cbd5e1" },
      accent: { fg: "#2563eb", bold: true },
      positive: { fg: "#16a34a", bold: true },
      warning: { fg: "#d97706", bold: true },
      negative: { fg: "#dc2626", bold: true }
    }
  },
  monochrome: {
    truecolor: {}
  }
};

/** <odoc>
 * <key>ow.screen.getTheme(aTheme, aColorMode, aOverrides) : Map</key>
 * Returns a resolved TUI theme map for the given theme name ("default", "ocean", "light", "monochrome")
 * or custom theme object and colorMode ("none", "16", "256", "truecolor").
 * </odoc> */
OpenWrap.screen.prototype.getTheme = function(theme, colorMode, overrides) {
  var mode = colorMode || this.capabilities().colorMode;
  var name = typeof theme == "string" ? theme.toLowerCase() : (typeof this.__options.theme == "string" ? this.__options.theme.toLowerCase() : "default");
  if (name == "monochrome" || mode == "none") {
    return merge(clone(OpenWrap.screen.__themes.default.none), isMap(theme) ? theme : (isMap(overrides) ? overrides : {}));
  }
  var family = OpenWrap.screen.__themes[name] || OpenWrap.screen.__themes.default;
  var baseMode = family[mode] || family.truecolor || OpenWrap.screen.__themes.default[mode] || OpenWrap.screen.__themes.default["256"];
  var merged = merge(clone(OpenWrap.screen.__themes.default[mode] || OpenWrap.screen.__themes.default["256"]), clone(baseMode));
  if (isMap(this.__options.theme)) merged = merge(merged, this.__options.theme);
  if (isMap(theme)) merged = merge(merged, theme);
  if (isMap(overrides)) merged = merge(merged, overrides);
  return merged;
};

/** <odoc>
 * <key>ow.screen.progress(aValue, aMax, aMin, aWidth, aOptions) : String</key>
 * Renders a smooth Unicode/ASCII progress bar with optional percentage/label and 16/256/truecolor styling.
 * </odoc> */
OpenWrap.screen.prototype.progress = function(value, max, min, width, options) {
  var opts = isMap(options) ? options : {};
  var caps = this.capabilities(opts);
  var th = this.getTheme(opts.theme, caps.colorMode);
  var lo = isNumber(min) ? Number(min) : 0;
  var hi = isNumber(max) ? Number(max) : 100;
  var span = (hi - lo) || 1;
  var val = Math.max(lo, Math.min(hi, Number(value) || 0));
  var ratio = Math.max(0, Math.min(1, (val - lo) / span));
  var pct = Math.round(ratio * 100);
  var showPct = opts.showPercent !== false;
  var suffix = showPct ? " " + ow.format.string.leftPad(String(pct), 3, " ") + "%" : "";
  var prefix = isDef(opts.label) && String(opts.label).length > 0 ? this.sanitize(opts.label, false) + ": " : "";
  var totalW = Math.max(10, Number(width || caps.width || 40));
  var barW = Math.max(4, totalW - visibleLength(prefix) - visibleLength(suffix) - 2);
  var filled = Math.round(ratio * barW), empty = Math.max(0, barW - filled);
  var fChar = caps.unicode ? "█" : "#";
  var eChar = caps.unicode ? "░" : "-";
  var fStr = this.style(repeat(filled, fChar), isDef(opts.filledStyle) ? opts.filledStyle : th.progressFilled, { colorMode: caps.colorMode });
  var eStr = this.style(repeat(empty, eChar), isDef(opts.emptyStyle) ? opts.emptyStyle : th.progressEmpty, { colorMode: caps.colorMode });
  var lblStr = prefix ? this.style(prefix, isDef(opts.labelStyle) ? opts.labelStyle : th.label, { colorMode: caps.colorMode }) : "";
  var pctStr = suffix ? this.style(suffix, isDef(opts.percentStyle) ? opts.percentStyle : th.muted, { colorMode: caps.colorMode }) : "";
  return lblStr + "[" + fStr + eStr + "]" + pctStr;
};

/** <odoc>
 * <key>ow.screen.run(aViewOrWindowOptions, aOnMessageFn, aDesktopOptions) : Object</key>
 * Convenience helper to launch an interactive TUI view session using ow.desktop({ provider: "tui" }).
 * </odoc> */
OpenWrap.screen.prototype.run = function(viewOrWinOpts, onMessage, desktopOpts) {
  ow.loadDesktop();
  var dOpts = merge({ provider: "tui" }, isMap(desktopOpts) ? desktopOpts : {});
  var d = new OpenWrap.desktop(dOpts);
  var wOpts = (isMap(viewOrWinOpts) && isDef(viewOrWinOpts.view)) ? viewOrWinOpts : { title: (isMap(viewOrWinOpts) && viewOrWinOpts.title) || "OpenAF Screen", view: viewOrWinOpts };
  var win = d.window(wOpts);
  if (typeof onMessage == "function") win.on("message", function(e) { onMessage(e, win, d); });
  win.show();
  d.wait();
  return win;
};
