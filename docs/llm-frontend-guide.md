# OpenAF LLM Frontend Guide (Offline-First)

Guidelines for generating `.html`, `.md`, `.js`, `.css`, and oJob `.yaml` files that maximize existing OpenAF HTTP server capabilities and local assets.

## Goal

Generate frontends that:

1. Run offline (no CDN dependency).
2. Reuse built-in OpenAF HTTP endpoints and mapped UI libraries.
3. Optionally enhance output with available oPacks (Mermaid, KaTeX, Docsify, XChart, etc.).
4. Are directly runnable from a generated oJob HTTP server.

## Prefer this file naming and output structure

For generated projects prefer:

1. `index.html` (or `index.md`)
2. `app.js`
3. `style.css` (optional)
4. `server.yaml` (oJob HTTP server)
5. `README.md` with run instructions

## Built-in HTTP UI assets (no external CDN)

When server routes are initialized with `mapLibs: true` (`HTTP Start Server` in `oJobHTTPd.yaml`), OpenAF maps local routes such as:

| Type | Route |
| --- | --- |
| JS | `/js/jquery.js` |
| JS | `/js/materialize.js` |
| JS | `/js/chart.js` |
| JS | `/js/handlebars.js` |
| JS | `/js/highlight.js` |
| JS | `/js/njsmap.js` |
| CSS | `/css/materialize.css` |
| CSS | `/css/materialize-icon.css` |
| CSS | `/css/github-markdown.css` |
| CSS | `/css/nJSMap.css` |
| Fonts/Icons | `/fonts/material-design-icons/*`, `/fonts/roboto/*`, `/fonts/openaf.ico`, `/fonts/openaf_*.png` |

Use these local routes first. Do not introduce internet-hosted script/style links unless explicitly requested.

### Observed bundled versions

These are the versions currently visible in the repo snapshot:

| Asset | Version |
| --- | --- |
| jQuery | 3.7.1 |
| Materialize | 2.2.2 |
| Chart.js | 4.5.1 |
| Handlebars | 4.7.8 |

Treat these as the baseline for generated offline UIs unless the repo snapshot changes.

## Server patterns to generate

Use oJob shortcuts from `oJob-common/oJobHTTPd.yaml`:

1. `(httpdStart)` with `mapLibs: true`
2. `(httpdService)` for API endpoints (`/api/*`, `/md2html`, `/healthz`)
3. `(httpdFileBrowse)` (or `HTTP File Browse`) for static files/docs
4. `(httpdDefault)` fallback route
5. `(httpdSSE)` when streaming updates is needed

Always include at least:

1. A root route (`/`) that serves UI.
2. A JSON API route (`/api/status`).
3. A default/fallback handler.

## Markdown to HTML capabilities (built-in)

Prefer built-ins instead of custom converters:

1. `ow.template.parseMD2HTML(markdown, ...)`
2. `ow.template.html.genStaticVersion4MD(markdown)`
3. `ow.server.httpd.replyFileMD(server, basePath, baseURI, requestURI, ...)`

Use these for docs-style UIs, content previews, or `.md`-first interfaces.

### Markdown + HTML + JavaScript integration

For richer markdown-first interfaces:

1. **Embed raw HTML** directly in `.md` files for Materialize components, forms, and styled elements.
2. **Include inline `<script>` blocks** for dynamic behavior (e.g., setting the page title, binding events, initializing widgets).
3. **Use Materialize CSS classes** for responsive forms, buttons, cards, and layout without custom CSS.

Example (in `.md` file):

```markdown
# My Dashboard

<script>
document.title = 'Dashboard | My App'
</script>

<div class="container" style="margin-top: 20px;">
  <div class="row">
    <div class="col s12 m6">
      <div class="card">
        <div class="card-content">
          <span class="card-title">Status</span>
          <p>Loading...</p>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
fetch('/api/status')
  .then(r => r.json())
  .then(d => {
    document.querySelector('.card-content p').innerText = d.status
    document.title = 'Dashboard | ' + d.status
  })
</script>
```

**Rules:**
- Inline `<script>` blocks execute after the page loads, so DOM manipulation is safe.
- Materialize classes work out-of-the-box via the mapped `/css/materialize.css` and `/js/materialize.js`.
- Keep JavaScript in `.md` files minimal; move complex logic to `/api/*` endpoints.
- Set `document.title` early in a script block to avoid UI flash.

## Optional oPacks to detect and use

If present in environment, generated code can leverage:

1. **Mermaid** (`openaf-opacks/Mermaid`): exposes `/js/mermaid.js` and markdown extras.
2. **KaTeX** (`openaf-opacks/KaTeX`): adds `/js/katex.min.js`, `/css/katex.min.css`, KaTeX fonts and markdown math support.
3. **Docsify** (`openaf-opacks/Docsify`): docs site generation from markdown, optional Mermaid integration.
4. **XChart** (`openaf-opacks/XChart`): chart image/html generation in backend.

Rule: optional oPack features must be guarded by availability checks; fallback to core built-ins.

### Observed oPack and library versions

Versions below come from the shipped bundle/runtime when the library exposes one. If the repo files do not surface a library version, the table says so explicitly.

| oPack | oPack version | JS/library | JS/library version |
| --- | --- | --- | --- |
| Mermaid | 20260210 | Mermaid JS | not surfaced in bundle/runtime |
| KaTeX | 20260224 | KaTeX JS | 0.16.28 |
| Docsify | 20211212 | Docsify JS | 4.12.1 |
| XChart | 20240605 | XChart | 3.8.8 (jar filename; Java library) |

## LLM generation rules

1. **Offline-first:** no CDN by default.
2. **Route reuse:** prefer existing mapped libs/routes before inventing new endpoints.
3. **Small API contract:** JSON in/out with explicit error shape (`{ error: "..." }`).
4. **Static + API separation:** keep UI files static and data in `/api/*`.
5. **Safe defaults:** include fallback/default route and basic error replies.
6. **Deterministic output:** produce complete runnable files, not snippets only.
7. **Asset reuse:** prefer `/css/*`, `/fonts/*`, and mapped `/js/*` from OpenAF.
8. **Markdown-native option:** support `.md` rendering endpoint when docs/content are central.
9. **Materialize in markdown:** use raw HTML with Materialize CSS classes directly in `.md` files for forms, cards, modals, and responsive layouts without separate `.html` files.
10. **Dynamic markdown:** embed `<script>` blocks in `.md` to set `document.title`, fetch API data, and bind event handlers; all inline JS runs after DOM loads.
11. **Mobile-first by default:** unless specified otherwise, assume generated UIs must work on both desktop and mobile. Include CSS media queries (`@media (max-width: 900px)`) that adjust layout, hide/show elements, and reflow grids.
12. **Responsive layout patterns:** use CSS Grid (`grid-template-columns: repeat(auto-fit, minmax(360px, 1fr))`) for adaptive layouts that collapse to single column on mobile; use flexbox with `flex-wrap` for buttons and toolbar wrapping; use viewport-relative widths (`width: calc(100vw - 16px)`).
13. **Mobile UX essentials:** (a) hamburger menu for sidebar toggle on mobile (`display: none` desktop, `display: inline-block` mobile); (b) buttons/modals that resize to full viewport minus padding; (c) touch-friendly tap targets (min 44px tall); (d) horizontal scrolling for tables when they exceed viewport width.

## Minimal offline server template (oJob)

```yaml
init:
  port: &PORT 8888
  web : &WEB  .

include:
- oJobHTTPd.yaml

todo:
- (httpdStart): *PORT
  ((mapLibs)): true

- (httpdService): *PORT
  ((uri)): /api/status
  ((execURI)): |
    return ow.server.httpd.reply({
      status: "ok",
      ts: now()
    })

- (httpdService): *PORT
  ((uri)): /md2html
  ((execURI)): |
    var postData = isDef(request.files) && isDef(request.files.postData) ? jsonParse(request.files.postData) : {}
    var markdown = String(_$(postData.markdown).default(""))
    if (markdown.length === 0) return ow.server.httpd.reply({ error: "markdown is required" })
    return ow.server.httpd.reply({ html: ow.template.html.genStaticVersion4MD(markdown) })

- (httpdFileBrowse): *PORT
  ((uri)): /
  ((path)): *WEB
  ((default)): index.html

- (httpdDefault): *PORT
```

## HTML starter that uses local mapped assets

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="/css/materialize.css" />
  <link rel="stylesheet" href="/css/materialize-icon.css" />
  <script src="/js/jquery.js"></script>
  <script src="/js/materialize.js"></script>
  <script src="/js/chart.js"></script>
</head>
<body class="container">
  <h4>OpenAF Offline UI</h4>
  <div id="status"></div>
  <canvas id="c"></canvas>
  <script>
    fetch("/api/status").then(r => r.json()).then(d => {
      $("#status").text("status=" + d.status + " ts=" + d.ts);
      new Chart(document.getElementById("c"), {
        type: "bar",
        data: { labels: ["ok"], datasets: [{ label: "status", data: [1] }] }
      });
    });
  </script>
</body>
</html>
```

## Mobile-responsive HTML example (desktop + mobile)

Follows CHManager patterns: viewport meta tag, CSS variables for theming, media queries for layout breakpoints, hamburger menu, and responsive grid.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My App</title>
  <link rel="stylesheet" href="/css/materialize.css" />
  <style>
    :root {
      --bg: #f5f5f5; --text: #333; --accent: #1976d2; --border: #ddd;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #121212; --text: #e0e0e0; --accent: #90caf9; --border: #333;
      }
    }
    * { box-sizing: border-box; }
    body { background: var(--bg); color: var(--text); font-family: sans-serif; margin: 0; }
    
    /* Desktop: flex row layout */
    #layout { display: flex; min-height: 100vh; }
    #sidebar { width: 250px; background: var(--bg); border-right: 1px solid var(--border); padding: 16px; overflow-y: auto; }
    #main { flex: 1; display: flex; flex-direction: column; }
    #topbar { background: var(--accent); color: white; padding: 12px 16px; display: flex; align-items: center; gap: 8px; }
    #menu-toggle { display: none; cursor: pointer; font-size: 24px; }
    #topbar h1 { margin: 0; flex: 1; font-size: 18px; }
    #content { flex: 1; padding: 16px; overflow-y: auto; }
    
    /* Responsive grid */
    .card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
    .card { background: white; border: 1px solid var(--border); border-radius: 4px; padding: 16px; }
    @media (prefers-color-scheme: dark) {
      .card { background: #1e1e1e; }
    }
    
    /* Mobile: hamburger menu, stacked layout */
    @media (max-width: 768px) {
      body { font-size: 16px; } /* Prevent zoom on iOS input focus */
      #menu-toggle { display: inline-block; }
      #layout { flex-direction: column; }
      #sidebar {
        position: absolute;
        left: 0; top: 48px; bottom: 0;
        width: 75vw; max-width: 280px;
        transform: translateX(-100%);
        transition: transform 0.2s ease;
        z-index: 10;
      }
      #layout.menu-open #sidebar { transform: translateX(0); }
      #layout.menu-open::after {
        content: ""; position: fixed; inset: 0;
        background: rgba(0,0,0,0.4); z-index: 5;
      }
      #content { padding: 12px; }
      .card-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div id="layout">
    <div id="topbar">
      <button id="menu-toggle" onclick="toggleMenu()">☰</button>
      <h1>My App</h1>
      <button class="btn" onclick="refreshData()">⟳</button>
    </div>
    
    <div id="sidebar">
      <h3>Channels</h3>
      <div id="channel-list"></div>
    </div>
    
    <div id="main">
      <div id="content">
        <div class="card-grid" id="cards"></div>
      </div>
    </div>
  </div>

  <script>
    function toggleMenu() {
      document.getElementById('layout').classList.toggle('menu-open')
    }
    
    function refreshData() {
      fetch('/api/data')
        .then(r => r.json())
        .then(d => {
          document.getElementById('cards').innerHTML = d.items
            .map(item => `<div class="card"><h4>${item.name}</h4><p>${item.desc}</p></div>`)
            .join('')
        })
    }
    
    refreshData()
  </script>
</body>
</html>
```

## Acceptance checklist for generated output

1. Runs with `ojob server.yaml` offline.
2. Uses OpenAF mapped assets (`/js/*`, `/css/*`, `/fonts/*`) where possible.
3. Provides at least one API endpoint and one UI route.
4. Has a default fallback route.
5. Uses built-in markdown conversion when markdown is part of output.
6. Guards optional oPack usage and has fallback behavior.
7. **For markdown UI:** includes Materialize HTML/CSS directly in `.md` files, and inline `<script>` blocks for dynamic behavior (e.g., title setting, API fetch).
8. **For markdown UI:** all JavaScript functions in `.md` files defer DOM access until after the script block loads (or use `DOMContentLoaded` if needed).
9. **For HTML UI (desktop + mobile by default):** includes `<meta name="viewport" content="width=device-width, initial-scale=1.0" />` and media queries for layouts that work on both mobile (< 768px) and desktop.
10. **For HTML UI:** hamburger menu or similar mobile navigation if sidebar/complex layout is used; buttons and touch targets are min 44px tall; tables/grids use responsive CSS (Grid with `repeat(auto-fit, minmax(...))` or similar flexbox wrapping).
11. **For HTML UI:** modals and popups scale to viewport (`width: calc(100vw - 16px)` on mobile) and don't assume mouse-only input.

## Reference files

1. `https://github.com/OpenAF/openaf/blob/master/js/owrap.server.js`
2. `https://github.com/OpenAF/oJob-common/blob/master/oJobHTTPd.yaml`
3. `https://github.com/OpenAF/ojob.io/blob/master/httpServers/*.yaml`
4. `https://github.com/OpenAF/mini-a/blob/main/mini-a-web.yaml`
5. `https://github.com/OpenAF/openaf-opacks/blob/master/*/.package.yaml`
6. `https://github.com/OpenAF/openaf-opacks/blob/master/CHManager/public/index.html` – Reference mobile-responsive design with theme switching, hamburger menu, and adaptive grids.
