// Sample showcasing js/owrap.screen.js (ow.screen) and OpenAF UI capabilities.
//
// Usage:
//   Static showcase (default):
//     openaf -f examples/screen-ui-sample.js
//   Interactive TUI declarative view (ow.screen.run / ow.desktop "tui"):
//     openaf -f examples/screen-ui-sample.js -e "mode=tui"
//   Animated live dashboard (ow.format.viz.live):
//     openaf -f examples/screen-ui-sample.js -e "mode=live"
//   Graphical desktop window (requires plugin-DesktopJavaFX):
//     openaf -f examples/screen-ui-sample.js -e "mode=javafx"

ow.loadFormat()
ow.loadScreen()

var params = processExpr(" ")
var mode = String(_$(params.mode, "mode").default("static")).toLowerCase()

var caps = ow.screen.capabilities()
var termW = Math.min(100, Math.max(60, caps.width || 80))

function showStaticShowcase() {
  // 1. Banner & Horizontal Rules (ow.screen.hr, ow.screen.box, ow.screen.style)
  print(ow.screen.box([
    ow.screen.style("OpenAF Screen (ow.screen) & Terminal UI Showcase", "BOLD,FG(#89dceb)"),
    ow.screen.style("Detected terminal: " + caps.width + "x" + caps.height +
      " | colorMode=" + caps.colorMode + " (depth=" + caps.colorDepth + ")" +
      " | unicode=" + caps.unicode, "FAINT")
  ], {
    width: termW,
    title: "js/owrap.screen.js",
    titleAlign: "left",
    footer: "mode=static | try -e \"mode=tui\" or -e \"mode=live\"",
    footerAlign: "right",
    borderStyle: "double",
    borderColor: "FG(#89b4fa)",
    padding: { top: 0, bottom: 0, left: 2, right: 2 },
    align: "center"
  }))
  print("")

  // 2. Rich Text Styling, Colors & Nested Reset Preservation (ow.screen.style, parseStyle)
  print(ow.screen.hr(termW, { label: "1. Styling, Truecolor & Grapheme-Safe Clipping", align: "left", style: "FG(#585b70)" }))

  var stylesDemo = [
    ow.screen.style("BOLD", "BOLD"),
    ow.screen.style("ITALIC", "ITALIC"),
    ow.screen.style("UNDERLINE", "UNDERLINE"),
    ow.screen.style("DOUBLE_UNDERLINE", { doubleUnderline: true, fg: "cyan" }),
    ow.screen.style("STRIKETHROUGH", "STRIKETHROUGH,FG(214)"),
    ow.screen.style("REVERSE", "REVERSE,FG(39)"),
    ow.screen.style("256-Color FG(213)", "FG(213),BOLD"),
    ow.screen.style("Hex #a6e3a1 on #1e1e2e", { fg: "#a6e3a1", bg: "#1e1e2e", bold: true }),
    ow.screen.style("rgb(249,226,175)", "FG(rgb(249,226,175)),ITALIC")
  ].join("  ")
  print("  " + stylesDemo)

  var nested = ow.screen.style(
    "Outer style [ " + ow.screen.style("inner highlight", "BOLD,FG(#f38ba8)") + " ] outer style automatically restored!",
    { fg: "#89b4fa", italic: true }
  )
  print("  " + nested)

  var utfSample = "UTF-8 & Emoji: Olá 🌍 こんにちは 👨‍👩‍👧‍👦 café"
  var graphemes = ow.screen.graphemes(utfSample)
  var clipped = ow.screen.clip(ow.screen.style(utfSample, "FG(#cba6f7)"), 28, "…")
  print("  Graphemes: " + graphemes.length + " clusters | Visible width: " + ow.screen.width(utfSample) +
        " cols | Clipped(28): " + clipped)
  print("")

  // 3. Box Styles (rounded, left-accent callout, drop-shadow) & Sub-Cell Progress Bars
  print(ow.screen.hr(termW, { label: "2. Box Borders, Left-Accent Callouts, Drop Shadows & Smooth Progress", align: "left", style: "FG(#585b70)" }))

  var boxW = Math.floor((termW - 4) / 3)
  var b1 = ow.screen.box(
    "Sub-cell 1/8th smooth blocks:\n" +
    ow.screen.progress(68.4, 100, 0, boxW - 4, { label: "CPU", theme: "default", smooth: true }) + "\n" +
    ow.screen.progress(42.5, 100, 0, boxW - 4, { label: "MEM", theme: "ocean", barStyle: "thin" }),
    { width: boxW, title: "rounded + smooth", borderStyle: "rounded", borderColor: "FG(#89b4fa)" }
  ).split("\n")

  var b2 = ow.screen.box(
    "Textual-style thick left-accent callout card without outer frame clutter.\n" +
    ow.screen.progress(83.7, 100, 0, boxW - 3, { label: "API", theme: "ocean" }),
    { width: boxW, title: "left-accent callout", borderStyle: "left", borderColor: "FG(#38bdf8)", style: { bg: "#181825" } }
  ).split("\n")

  var b3 = ow.screen.box(
    "Elevated card with right & bottom drop shadow.\n" +
    ow.screen.progress(91.2, 100, 0, boxW - 5, { label: "DSK", filledStyle: "BOLD,FG(#f38ba8)" }),
    { width: boxW, title: "shadow: true", footer: "91% used", borderStyle: "single", shadow: true, borderColor: "FG(#f9e2af)" }
  ).split("\n")

  var maxLines = Math.max(b1.length, b2.length, b3.length)
  for (var i = 0; i < maxLines; i++) {
    print(
      ow.screen.alignLine(b1[i] || "", boxW, "left") + "  " +
      ow.screen.alignLine(b2[i] || "", boxW, "left") + "  " +
      ow.screen.alignLine(b3[i] || "", boxW, "left")
    )
  }
  print("")

  // 4. Markdown, SideLines, Tables & Trees (ow.format.withMD, withSideLine, printTable, printTree)
  print(ow.screen.hr(termW, { label: "3. Markdown, SideLines, Tables & Trees", align: "left", style: "FG(#585b70)" }))

  var mdText = ow.format.withMD(
    "### OpenAF Formatting Primitives\n" +
    "- **Markdown**: `ow.format.withMD` renders headings, **bold**, *italics*, and `code`.\n" +
    "- **SideLine**: `ow.format.withSideLine` wraps blocks with curved accent borders.",
    __, termW - 6
  )
  print(ow.format.withSideLine(
    mdText.trim(),
    termW,
    "FG(41)",
    "FG(249)",
    ow.format.withSideLineThemes().openCurvedRect
  ))

  var tableData = [
    { Component: "ow.screen", Module: "js/owrap.screen.js", Features: "SGR styles, boxes, shadows, smooth progress, keybar" },
    { Component: "ow.desktop", Module: "js/owrap.desktop*.js", Features: "2D row views, checkbox, table, sparkline (TUI & JavaFX)" },
    { Component: "ow.format.viz", Module: "js/owrap.format.js", Features: "Dashboards, charts, sparklines, live diff loop" },
    { Component: "Console / Core", Module: "js/openaf.js", Features: "printTable, printTree, askChoose, readLinePrompt" }
  ]
  var tblStr = printTable(tableData, Math.floor(termW * 0.68), false, caps.ansi, caps.unicode ? "utf" : undefined)
  var treeStr = printTree({
    "OpenAF UI": {
      Terminal: ["ow.screen", "ow.format.viz", "Console"],
      Desktop: ["provider: tui", "provider: javafx"],
      Web: ["oJobHTTPd.yaml", "Materialize + Chart.js"]
    }
  }, Math.floor(termW * 0.28))

  var tblLines = tblStr.trim().split("\n")
  var treeLines = treeStr.trim().split("\n")
  var sideRows = Math.max(tblLines.length, treeLines.length)
  var leftW = Math.floor(termW * 0.70)
  for (var r = 0; r < sideRows; r++) {
    print(ow.screen.alignLine(tblLines[r] || "", leftW, "left") + "  " + (treeLines[r] || ""))
  }
  print("")

  // 5. Multi-Pane Visualizations & Dashboard (ow.format.printDashboard) + ow.screen.keybar
  print(ow.screen.hr(termW, { label: "4. Terminal Visualizations & Keybinding Footer", align: "left", style: "FG(#585b70)" }))

  var distValues = [
    { label: "API", value: 48, color: "BLUE" },
    { label: "Workers", value: 32, color: "GREEN" },
    { label: "Cache", value: 20, color: "YELLOW" }
  ]

  var dash = ow.format.printDashboard([
    [
      {
        type: "donut",
        title: "Workload Share (Donut)",
        data: distValues,
        span: 1,
        options: { size: "small", innerRadius: 0.55, centerText: "100%", legend: "right", palette: "auto" }
      },
      {
        type: "divergingBars",
        title: "Latency Delta ms (Diverging)",
        data: { "Auth": -18, "Search": -5, "Checkout": 12, "Reports": 29 },
        span: 1,
        options: { symmetric: true, palette: "auto" }
      }
    ],
    [
      {
        type: "sparkline",
        title: "Throughput req/s (Annotated Sparkline)",
        data: [120, 135, 128, 160, 195, 175, 210, 240, 225, 260, 255, 290],
        span: 1,
        options: {
          min: 100, max: 300,
          markMin: true, markMax: true, trend: true,
          highlightLast: "GREEN",
          palette: "auto"
        }
      },
      {
        type: "stackedBar",
        title: "Cluster Capacity (Stacked Bar)",
        data: distValues,
        span: 1,
        options: { normalize: true, showPercent: true, legend: "bottom", palette: "auto" }
      }
    ]
  ], {
    width: termW,
    height: 16,
    border: true,
    borderStyle: "round",
    palette: "auto"
  })
  print(dash)
  print(ow.screen.keybar([
    { key: "Tab", label: "Focus" },
    { key: "Enter/Space", label: "Activate" },
    { key: "Arrows", label: "Adjust" },
    { key: "Ctrl-W", label: "Close" },
    { key: "mode=tui", label: "Interactive Demo" }
  ], termW, { theme: "default" }))
}

function runInteractiveView(providerName) {
  var themes = ["default", "ocean", "light", "monochrome"]
  var borders = ["rounded", "single", "double", "heavy", "left", "ascii"]
  var state = {
    name: "Developer",
    secret: "s3cr3t",
    theme: "default",
    border: "rounded",
    autoRefresh: "true",
    progress: 62.5,
    telemetry: [42, 48, 55, 51, 64, 72, 68, 79, 85, 81, 90, 94],
    status: "Use Tab/Arrows or Mouse! Focus & scroll are preserved across live updates."
  }

  function buildView() {
    return {
      title: "OpenAF Declarative UI (" + providerName.toUpperCase() + ")",
      subtitle: "Side-by-side rows, checkboxes, masked inputs, tables & sparklines",
      theme: state.theme,
      border: state.border,
      borderStyle: state.border,
      spacing: 1,
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      items: [
        {
          id: "banner",
          type: "text",
          title: "Status Callout",
          text: state.status,
          border: "left",
          style: { bold: true, fg: "#89dceb" }
        },
        { id: "div1", type: "divider", label: "Credentials & Appearance (2-Column Row)" },
        {
          id: "rowInputs",
          type: "row",
          gap: 3,
          items: [
            { id: "name", type: "input", label: "User", value: state.name, placeholder: "Type a name...", fieldWidth: 14, span: 1 },
            { id: "secret", type: "input", label: "Token", value: state.secret, password: true, fieldWidth: 12, span: 1 }
          ]
        },
        {
          id: "rowSelects",
          type: "row",
          gap: 3,
          items: [
            { id: "theme", type: "select", label: "Theme", options: themes, value: state.theme, span: 1 },
            { id: "border", type: "select", label: "Border", options: borders, value: state.border, span: 1 },
            { id: "autoRefresh", type: "checkbox", label: "Live Telemetry", value: state.autoRefresh, span: 1 }
          ]
        },
        { id: "div2", type: "divider", label: "Metrics & Service Table" },
        {
          id: "rowMetrics",
          type: "row",
          gap: 3,
          items: [
            { id: "prog", type: "progress", label: "Progress", value: state.progress, min: 0, max: 100, showPercent: true, smooth: true, span: 1 },
            { id: "spark", type: "sparkline", label: "Req/s", values: state.telemetry, min: 20, max: 100, trend: true, span: 1 }
          ]
        },
        {
          id: "svcTable",
          type: "table",
          columns: ["Service", "State", "Latency"],
          rows: [
            { Service: "API Gateway", State: "ONLINE", Latency: "12 ms" },
            { Service: "Worker Pool", State: state.autoRefresh == "true" ? "STREAMING" : "PAUSED", Latency: "28 ms" }
          ]
        },
        {
          id: "rowActions",
          type: "row",
          gap: 2,
          items: [
            { id: "step", type: "button", label: "Advance +12.5%", variant: "primary", span: 1 },
            { id: "apply", type: "button", label: "Apply & Sample", variant: "success", span: 1 },
            { id: "quit", type: "button", label: "Close", variant: "error", span: 1 }
          ]
        }
      ]
    }
  }

  function handleMessage(event, win) {
    var msg = event.message
    var vals = msg.payload.values
    state.name = vals.name
    state.secret = vals.secret
    state.theme = vals.theme
    state.border = vals.border
    state.autoRefresh = vals.autoRefresh

    if (msg.type == "action" && msg.payload.id == "quit") {
      win.close()
      return
    }
    if (msg.type == "action" && msg.payload.id == "step") {
      state.progress = (state.progress + 12.5) % 112.5
      if (state.progress > 100) state.progress = 0
      state.telemetry.push(Math.round(30 + Math.random() * 65))
      if (state.telemetry.length > 12) state.telemetry.shift()
      state.status = "Progress=" + state.progress + "% | Focus remained on [Advance +12.5%]!"
    } else {
      state.telemetry.push(Math.round(30 + Math.random() * 65))
      if (state.telemetry.length > 12) state.telemetry.shift()
      state.status = "Hello, " + (state.name || "OpenAF") + " (Token length=" + state.secret.length + ") | Theme=" + state.theme
    }
    win.setView(buildView())
  }

  if (providerName == "tui") {
    ow.screen.run(
      { title: "OpenAF Screen TUI", view: buildView() },
      function(event, win) { handleMessage(event, win) }
    )
  } else {
    ow.loadDesktop({ provider: providerName })
    var win = ow.desktop.window({ title: "OpenAF Desktop UI", width: 780, height: 620, view: buildView() })
    win.on("message", function(event) { handleMessage(event, win) })
    win.show()
    ow.desktop.wait()
  }
}

function runLiveDashboard() {
  var series = [40, 48, 52, 49, 60, 68, 64, 72, 78, 74, 82, 85]
  var ticks = 0
  var maxTicks = 20

  var live = ow.format.viz.live(function(ctx) {
    ticks++
    series.push(Math.max(10, Math.min(100, Math.round(series[series.length - 1] + (Math.random() * 16 - 8)))))
    if (series.length > 24) series.shift()

    var w = Math.min(100, ctx.size.width || 80)
    var header = ow.screen.box(
      ow.screen.style("Live Animated Dashboard (ow.format.viz.live + ow.screen)", "BOLD,FG(#89dceb)") + " — Frame " + ticks + "/" + maxTicks,
      { width: w, borderStyle: "rounded", borderColor: "FG(#89b4fa)", align: "center" }
    )
    var body = ow.format.printDashboard([
      [
        {
          type: "sparkline",
          title: "Live Telemetry",
          data: series.slice(),
          span: 2,
          options: { min: 0, max: 100, markMin: true, markMax: true, trend: true, highlightLast: "YELLOW", palette: "auto" }
        },
        {
          type: "donut",
          title: "Load Split",
          data: [
            { label: "Busy", value: series[series.length - 1], color: "GREEN" },
            { label: "Idle", value: Math.max(0, 100 - series[series.length - 1]), color: "BLUE" }
          ],
          span: 1,
          options: { size: "small", innerRadius: 0.5, centerText: series[series.length - 1] + "%", palette: "auto" }
        }
      ]
    ], { width: w, height: 10, border: true, borderStyle: "round", palette: "auto" })

    return header + "\n" + body
  }, { fps: 4 })

  sleep(5000)
  live.stop()
}

if (mode == "tui" || mode == "javafx") {
  runInteractiveView(mode)
} else if (mode == "live") {
  runLiveDashboard()
} else {
  showStaticShowcase()
}
