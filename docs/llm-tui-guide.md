# OpenAF LLM TUI Guide (Offline-First)

Guidelines for generating terminal user interface `.js` and oJob `.yaml` files that maximise existing OpenAF TUI primitives and avoid external dependencies.

## Goal

Generate TUIs that:

1. Run offline (no npm, pip, CDN, or external package manager).
2. Reuse built-in OpenAF TUI primitives (`Console` plugin, `ansiColor`, `printTable`, `ow.format.*`).
3. Optionally enhance output with available oPacks (AsciiMo for banners).
4. Are directly runnable from a generated oJob YAML script.

## Prefer this file naming and output structure

For generated projects prefer:

1. `tui.js` — main TUI logic (entry point exported as a callable function)
2. `tui.yaml` — oJob launcher (`load` + call)
3. `README.md` — run instructions

## Built-in TUI primitives (no oPacks required)

All functions below are available in every OpenAF runtime without installing additional oPacks.

### Input

| Function | Purpose |
| --- | --- |
| `plugin("Console")` + `new Console()` | Interactive readline with tab-completion and history |
| `con.readLinePrompt(prompt)` | Read a line with a colored prompt; returns `null` on EOF |
| `con.readChar(allowed)` | Read a single keypress |
| `con.getConsoleReader()` | Access the underlying jLine reader (history, completers) |
| `ask(prompt)` | Simple single-line prompt (no history) |
| `askChoose(prompt, choices)` | Numbered-menu selection |
| `askEncrypt(prompt)` | Masked password / secret input |

### Color and ANSI

| Function | Purpose |
| --- | --- |
| `ansiColor(code, text)` | Apply an ANSI code string to text |
| `ansiStart()` / `ansiStop()` | Enable / disable ANSI output globally |
| `ansiLength(s)` | String length excluding escape codes (for alignment) |

### Output

| Function | Purpose |
| --- | --- |
| `print(s)` / `printnl(s)` / `printErr(s)` | Basic terminal output |
| `printTable(arr, width, count, ansi, theme, bgColor, wordWrap, rowSep, bandRows)` | Formatted ASCII/UTF-8 table |
| `printTree(map, width, options)` | Recursive tree structure |
| `printBars(fmt, hSize, max, min, indicator, space)` | Horizontal bar chart |

### Formatting

| Function | Purpose |
| --- | --- |
| `ow.format.withMD(text, reset, width, bgColor)` | Render Markdown to styled terminal output |
| `ow.format.withSideLine(text, width, sides, topBottom, theme, options)` | Box-bordered content block |
| `ow.format.withSideLineThemes()` | Returns available border theme presets |

### Terminal capabilities

| Function | Returns |
| --- | --- |
| `ow.format.term.getCapabilities(opts)` | `{ isTTY, ansi, width, height, colorDepth, colorMode, unicode, term }` |
| `ow.format.term.getPalette(mode, overrides)` | `{ title, accent, positive, warning, negative, muted, gridLine }` |

`colorMode` values: `"none"` (no color), `"16"`, `"256"`, `"truecolor"`.  
`getCapabilities()` results are cached; pass `{ refresh: true }` to force a re-read.

### Visualization

| Function | Purpose |
| --- | --- |
| `ow.format.printSparkline(series, opts)` | Inline sparkline (single or multi-series) |
| `ow.format.printHistogram(values, opts)` | Horizontal or vertical histogram |
| `ow.format.printBullet(values, opts)` | Bullet / gauge chart |
| `ow.format.printDashboard(widgets, opts)` | Multi-pane bordered dashboard |
| `ow.format.string.lineChart(series, opts)` | ASCII line chart |
| `ow.format.string.progress(val, max, min, size, indicator, space)` | Progress bar string |

All visualization functions accept `palette: "auto"` in `opts` to adapt to the terminal's color depth.

### Layout helpers

| Function | Purpose |
| --- | --- |
| `ow.format.string.wordWrap(str, width, sep, tab)` | Wrap text to a column width |
| `ow.format.string.grid(matrix, x, y, bgPattern)` | Render a 2-D grid of strings |
| `ow.format.string.leftPad(s, n, pad)` / `rightPad` | Padding for alignment |
| `ow.format.viz.layout.split(totalWidth, colWidths)` | Distribute column widths proportionally |
| `ow.format.viz.layout.padLines(text, width, height)` | Pad a block of text to exact dimensions |

### Live / animated output

| Function | Purpose |
| --- | --- |
| `ow.format.viz.live(rendererFn, opts)` | Managed render loop: fps, diff, autoStart, watchResize |
| `ow.format.viz.createCanvas(opts)` | 2-D character drawing buffer (write cells, call render()) |
| `ow.format.viz.diffFrames(prev, next, opts)` | Terminal patch: only redraw changed lines |
| `ow.format.viz.watchResize(cb, opts)` | Fire a callback when the terminal is resized |

## Color scheme reference

Use this standard 6-color semantic palette (ANSI 256) in all generated TUIs. It comes from `mini-a-con.js` and is the established convention in OpenAF TUI projects:

```javascript
var promptColor  = "FG(41)"   // bright green  — user prompt / borders
var accentColor  = "FG(218)"  // pink/magenta  — highlights / titles
var hintColor    = "FG(249)"  // light gray    — hints / secondary text
var errorColor   = "FG(196)"  // bright red    — errors
var successColor = "FG(112)"  // bright green  — success messages
var numericColor = "FG(155)"  // light green   — numbers / metrics
```

Always guard color output with `caps.ansi` so output remains clean when piped:

```javascript
var caps = ow.format.term.getCapabilities()
var colored = caps.ansi ? ansiColor(promptColor, text) : text
```

## withSideLine border themes

`ow.format.withSideLineThemes()` returns an object with these presets:

| Key | Visual style | Use case |
| --- | --- | --- |
| `simpleLine` | single vertical bar | minimal side accent |
| `openCurvedRect` | open-top rounded box | help text, tips |
| `closedCurvedRect` | full rounded box | key content blocks |
| `doubleLineBothSides` | double vertical bars | emphasis, warnings |

Example:

```javascript
print(ow.format.withSideLine(
  "Line 1\nLine 2",
  caps.width,
  promptColor,
  hintColor,
  ow.format.withSideLineThemes().openCurvedRect
))
```

## printDashboard widget types

`ow.format.printDashboard(widgets, opts)` accepts a flat array or a 2-D array (explicit rows).

Supported `type` values per widget:

| Type | `data` format |
| --- | --- |
| `text` | plain string |
| `md` | Markdown string |
| `table` | array of maps |
| `tree` | map / nested map |
| `chart` | `printChart` format string |
| `area` | `ow.format.string.chart` data |
| `bar` | `printBars` format string |
| `sparkline` | number array or multi-series array |
| `histogram` | number array |
| `heatmap` | 2-D number array |
| `bullet` | map or array of maps `{ value, target, min, max, ranges }` |
| `scatter` | array of `{ x, y }` maps |
| `boxplot` | number array or array of arrays |
| `timeline` | array of `{ label, start, end }` maps |
| `statusMatrix` | 2-D array of status strings |
| `progress` | number (0–100 or custom range) |
| `map` | map |
| `func` | function `(w, h) => string` |

Dashboard `opts`:

| Option | Default | Description |
| --- | --- | --- |
| `width` | terminal width | total dashboard width |
| `height` | terminal height − 2 | total dashboard height |
| `columns` | auto | columns when using flat array |
| `border` | `true` | draw widget borders |
| `borderColor` | palette gridLine | ANSI color for borders |
| `borderStyle` | `"simple"` | `"simple"` \| `"rect"` \| `"round"` |
| `palette` | `"auto"` | color palette mode |

Each widget can have: `type`, `data`, `title`, `span` (proportional width, default 1), `options` (forwarded to the widget renderer).

## Terminal capability detection

Always call `ow.format.term.getCapabilities()` at the start of every TUI before any color or width usage. Falls back to 80×24 when not a TTY.

```javascript
ow.loadFormat()
var caps = ow.format.term.getCapabilities()
var ansi = caps.ansi        // boolean: ANSI codes safe to emit
var w    = caps.width       // terminal columns (default 80)
var h    = caps.height      // terminal rows   (default 24)
```

For palette-aware rendering:

```javascript
var pal = ow.format.term.getPalette("auto")
// pal.accent, pal.positive, pal.warning, pal.negative, pal.muted, pal.gridLine
```

## Console input loop pattern

Use this pattern for all interactive TUIs. Do not use `java.io.BufferedReader` directly.

```javascript
plugin("Console")
var con = new Console()

// Optional: restore readline history from a file
// var reader = con.getConsoleReader()
// reader.setHistory(...)

while (true) {
  var raw = con.readLinePrompt(
    (ansi ? ansiColor(promptColor, "➤") : ">") + " "
  )
  if (raw === null) break        // EOF / Ctrl-D
  var line = String(raw).trim()
  if (!line) continue
  if (line === "/quit") break

  // dispatch on line...
}
```

`readLinePrompt` returns `null` on EOF (Ctrl-D). Always check the raw return value for `null` *before* calling `String()` — wrapping in `String(raw || "")` converts `null` to `""` and breaks the EOF check.

## oJob TUI template

```yaml
# tui.yaml
todo:
- Init TUI
- Run TUI

jobs:
- name: Init TUI
  exec: |
    ow.loadFormat()
    load("tui.js")

- name: Run TUI
  exec: |
    runTUI()
```

```javascript
// tui.js
ow.loadFormat()
plugin("Console")

var promptColor  = "FG(41)"
var accentColor  = "FG(218)"
var hintColor    = "FG(249)"
var errorColor   = "FG(196)"
var successColor = "FG(112)"
var numericColor = "FG(155)"

var caps = ow.format.term.getCapabilities()
var ansi = caps.ansi
var w    = caps.width

function colorify(code, text) {
  return ansi ? ansiColor(code, text) : text
}

function runTUI() {
  var con = new Console()

  print(ow.format.withMD(
    "# My TUI\nType **/help** for commands, **/quit** to exit.",
    __, w
  ))

  while (true) {
    var raw = con.readLinePrompt(colorify(promptColor, "➤") + " ")
    if (raw === null) {
      print(colorify(successColor, "Goodbye."))
      return
    }
    var line = String(raw).trim()
    if (!line) continue

    switch (line) {
    case "/quit":
      print(colorify(successColor, "Goodbye."))
      return

    case "/help":
      showHelp()
      break

    case "/status":
      showStatus()
      break

    default:
      printErr(colorify("ITALIC," + errorColor, "!!") + " Unknown command: " + line)
    }
  }
}

function showHelp() {
  print(ow.format.withSideLine(
    "/help     show this help\n" +
    "/status   show status dashboard\n" +
    "/quit     exit",
    w, promptColor, hintColor,
    ow.format.withSideLineThemes().openCurvedRect
  ))
}

function showStatus() {
  var data = [
    { metric: "cpu",    value: 42 },
    { metric: "memory", value: 78 }
  ]
  print(ow.format.printDashboard([
    [
      { type: "table",     title: "Metrics", data: data,            span: 2 },
      { type: "sparkline", title: "CPU %",   data: [10,25,42,38,50], span: 1,
        options: { palette: "auto" } }
    ]
  ], { width: w, border: true, borderStyle: "round" }))
}
```

## Live-updating dashboard pattern

Use `ow.format.viz.live(rendererFn, opts)` for animated screens. It manages the render loop, handles terminal resize, and applies `diffFrames` to redraw only changed lines.

`live` options:

| Option | Default | Description |
| --- | --- | --- |
| `fps` | `8` | target frames per second |
| `diff` | `true` | use `diffFrames` for efficient partial redraws |
| `autoStart` | `true` | start immediately |
| `watchResize` | `true` | re-render on terminal resize |
| `onError(e)` | — | error callback |
| `onStop(info)` | — | called when `.stop()` is invoked |

Returns `{ id, start(), stop(), update(), stats() }`.

```javascript
// live.js
ow.loadFormat()

var data = []

// Collect data on a background timer
var _timer = setInterval(function() {
  data.push(Math.random() * 100)
  if (data.length > 60) data.shift()
}, 1000)

// Start render loop (8 fps default, resize-aware, diff-based)
var _live = ow.format.viz.live(function(ctx) {
  var w = ctx.size.width
  var h = ctx.size.height
  return ow.format.printDashboard([
    [
      { type: "sparkline", title: "Metric (last 60s)",
        data: data.slice(), span: 2, options: { palette: "auto" } },
      { type: "text", title: "Info",
        data: "samples: " + data.length, span: 1 }
    ]
  ], { width: w, height: h - 1, border: true, borderStyle: "round" })
}, { fps: 4 })

// Run for 30 seconds then stop
sleep(30000)
_live.stop()
clearInterval(_timer)
```

```yaml
# live.yaml
todo:
- Run live dashboard

jobs:
- name: Run live dashboard
  exec: |
    ow.loadFormat()
    load("live.js")
```

## Non-TTY / piped output

When `caps.isTTY === false` (output is piped or redirected):

- Omit all `ansiColor` calls — use plain strings.
- Skip progress bars, sparklines, and dashboards unless `--force-color` is explicitly requested.
- `printTable` still works; pass `ansi = false` to disable color in tables.

```javascript
var ansi = caps.ansi  // false when piped
var tableOutput = printTable(rows, w, __, ansi, ansi ? "utf" : __)
```

## Error display pattern

All error output follows the `mini-a` convention:

```javascript
printErr(
  (ansi ? ansiColor("ITALIC," + errorColor, "!!") : "!!") +
  " " + message
)
```

Never use raw `throw` for user-facing errors inside the input loop. Use `try/catch` and display with the pattern above, then continue the loop.

## Optional oPacks to detect and use

| oPack | What it adds |
| --- | --- |
| `AsciiMo` | `AsciiMo.write(text, font)` — ASCII-art banners for TUI headers; `AsciiMo.listFonts()` |

Guard optional oPack usage:

```javascript
var asciiMoPath = getOPackPath("AsciiMo")
if (isDef(asciiMoPath)) {
  load(asciiMoPath + "/asciimo.js")
  var _mo = new AsciiMo()
  // Use first available font; call _mo.listFonts() to enumerate all options
  print(_mo.write("My App", _mo.listFonts()[0]))
} else {
  print(colorify(accentColor, "=== My App ==="))
}
```

## LLM generation rules

1. **Offline-first:** no npm, pip, or CDN — only OpenAF built-ins and oPacks.
2. **Capability guard:** call `ow.format.term.getCapabilities()` at startup; never hardcode `80` or assume ANSI.
3. **Width-aware:** pass `caps.width` to `printTable`, `withMD`, `withSideLine`, and all chart/dashboard calls.
4. **Input loop:** all interactive TUIs use `plugin("Console")` + `con.readLinePrompt()` — not raw Java IO.
5. **Slash commands:** support at minimum `/help` and `/quit`; additional commands follow the `/command` pattern.
6. **Deterministic output:** produce complete runnable files, not snippets.
7. **Semantic color scheme:** use the 6-variable color scheme (`promptColor` … `numericColor`) — no ad-hoc ANSI codes.
8. **Palette-aware viz:** pass `palette: "auto"` in options to all `ow.format.print*` calls.
9. **No blocking sleep loops:** use `ow.format.viz.live` for live screens, not `while(true) { sleep(); print() }`.
10. **oJob launcher:** always wrap TUI scripts in a YAML file with `load` + function call.
11. **Non-TTY safe:** skip color and visualization when `caps.isTTY === false` or `caps.ansi === false`.
12. **Error display:** use the `"!!" + errorColor` + `printErr` pattern for all user-facing errors.

## Acceptance checklist for generated output

1. Runs with `ojob tui.yaml` offline.
2. Calls `ow.format.term.getCapabilities()` before any color or width usage.
3. All ANSI / color output is guarded by `caps.ansi`.
4. All width-sensitive calls receive `caps.width`.
5. Interactive input uses `plugin("Console")` + `con.readLinePrompt()`.
6. Supports at least `/help` and `/quit` slash commands.
7. Error output uses `printErr` with the `"!!" + errorColor` pattern.
8. All `ow.format.print*` visualization calls include `palette: "auto"`.
9. Non-TTY mode falls back to plain-text output without color or progress bars.
10. No external dependencies; optional oPack features are guarded with `getOPackPath`.

## Reference files

1. `https://github.com/OpenAF/mini-a/blob/main/mini-a-con.js` — Reference interactive console session
2. `https://github.com/OpenAF/openaf/blob/master/js/owrap.format.js` — Full `ow.format` / `viz` / `term` API
3. `https://github.com/OpenAF/openaf/blob/master/js/openaf.js` — `printTable`, `ansiColor`, `printTree`, `printBars`
