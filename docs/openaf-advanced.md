# OpenAF Advanced Guide

[Index](./index.md) | [oJob Reference](./ojob.md) | [Security](./ojob-security.md) | [Flags](./openaf-flags.md) | [Recipes](./ojob-recipes.md) | [Advanced](./openaf-advanced.md)

Deeper coverage of selected modules and patterns.

## 1. Scheduler (ow.server.scheduler)
```javascript
ow.loadServer();
var sch = new ow.server.scheduler();
var id = sch.addEntry("*/10 * * * * *", () => log('tick'), true); // cron, fn, waitForFinish
// Modify later
id = sch.modifyEntry(id, "*/30 * * * * *", () => log('slower'), true);
```
Used internally by periodic oJobs with cron expressions.

## 2. Cron Utilities (ow.format.cron)
```javascript
ow.loadFormat();
var info = ow.format.cron.howManyAgo("*/5 * * * * *", Date.now() - 20000);
// info.isDelayed, info.missedExecutions
```
Useful for custom reliability checks beyond built-in `cronCheck`.

## 3. Channels as Distributed Data Fabric
- `mem` in‑memory
- `mvs` persistent (MapDB / storage engine)
- `big` peer-synchronizable

Pattern: create, expose, peer, cluster.
```javascript
$ch('events').create();
$ch('events').set({id:1},{msg:'hello'});
$ch('events').subscribe((ch,op,k,v)=> log(op+':'+stringify(k)));
```

## 4. Channel Clustering Overview
Declared via `ojob.channels.clusters` enabling node discovery & replication. Each cluster entry initializes an `ow.server.cluster` with periodic verification; combine with persistent channel types for fault tolerance.

## 5. Secure Buckets (ow.sec)
```javascript
ow.loadSec();
ow.sec.openMainSBuckets('masterSecret');
var bucket = $sec('repo','bucket','lock','masterSecret');
bucket.setSecret('bucket','lock','apiKey',{ key:'abc', created:new Date() });
var s = bucket.getSecret('bucket','lock','apiKey');
```
Supports multiple repos, lock-based access, encrypted at rest.

## 6. AI Helpers (ow.ai)
```javascript
ow.loadAI();
var lr = ow.ai.regression().linear([[0,1],[1,3],[2,5]]);
log(lr.string);
```
Combine with `(llm)` built-in job for integrated prompt workflows; set `OAF_MODEL` or use provider-specific configs.

See also: `ow-ai-gpttypes.md` for provider wrappers, standardized interfaces and implementation notes.

## 7. Python Interop Patterns
Use server mode for throughput:
```javascript
ow.loadPython();
ow.python.startServer();
for (var i=0;i<100;i++) ow.python.exec("x = " + i + "*2", {}, []);
ow.python.stopServer();
```
Maintain state across calls with `execPM` persistent map.

## 8. Timeout & Cancellation Composition
Blend `$tb` with external cancel signals:
```javascript
var cancelled=false;
setTimeout(()=> cancelled=true, 3000);
var result = $tb(() => {
  while(!cancelled) {/* work */}
}).timeout(10000).stopWhen(()=>cancelled).exec();
```

## 9. Template Customization
Add namespaced helpers:
```javascript
ow.loadTemplate();
ow.template.addHelpers('x', { upper: s => s.toUpperCase() });
print(templify('Hi {{x_upper name}}', { name:'dev' }));
```

## 10. Structured Logging Strategies
Set `ojob.log.format: json` or env `OJOB_JSONLOG=true`. Combine with external log forwarder reading stderr. Include correlation IDs by inserting into `args` early and referencing in templates.

## 11. Data Validation Chaining
`_$(value,'label').toNumber().isNumber().between(1,100).default(10)` provides readable declarative constraints. Attach to job `check.in` & `check.out` for consistent boundaries.

## 12. DSL Reduction with Built-ins
Favor built-in job shortcuts `(if)`, `(repeat)`, `(each)`, `(parallel)` to minimize JS code, enabling easier reasoning by humans & LLMs while improving change auditability.

## 13. Performance Tuning Levers
- Reduce startup: set `ojob.conAnsi: false` (skip terminal probing)
- Limit thread count: `ojob.numThreads`
- Adjust parallel heuristics: `ojob.flags.PFOREACH.*`
- Prefer `execRequire` for large reusable code blocks vs inline duplicates

## 14. Asynchronous Execution with oPromise

- **$do** – queue work on the standard ForkJoin-backed pool and receive an `oPromise` for fluent `.then` / `.catch` composition. The resolver passed into your function can resolve with returned values or explicit `resolve()` calls, while thrown errors or `reject()` calls route to the rejection chain.
- **$doV** – same contract as `$do` but targets a virtual-thread-per-task executor so launching many concurrent tasks will not consume native threads when the JVM supports Project Loom virtual threads.
- **Coordination helpers** – mix `$doAll` / `$doFirst` (wrappers over `oPromise.all()` / `.race()`) to wait for all tasks or the first completion, enabling fan-out/fan-in patterns without manual synchronization primitives.
- **Cancellation** – call `.cancel()` on any `$do` / `$doV` promise to interrupt the associated thread (mirroring the Threads plugin) and drive the chain into the rejection path for cleanup.

Example fan-out flow using virtual threads:

```javascript
var tasks = [url1, url2, url3].map(url =>
  $doV(() => httpGet(url))
);

$doAll(tasks)
  .then(results => log("Fetched: " + results.length))
  .catch(err => logErr("HTTP error: " + err));
```

Combine with `$tb` or custom cancellation logic for cooperative shutdown when outstanding promises should be abandoned.

## 15. Observability and Telemetry

### Metrics Collection and Exposure

OpenAF provides comprehensive metrics capabilities through `ow.metrics` and integrated oJob telemetry:

```javascript
// Load metrics module
ow.loadMetrics();

// Add custom metrics
ow.metrics.add("customGauge", () => ({ value: getCustomValue() }));
ow.metrics.add("requestCounter", () => ({ value: $get("requestCount") || 0 }));

// Start built-in collectors (CPU, memory, etc.)
ow.metrics.startCollecting();

// Get all metrics
var allMetrics = ow.metrics.getAll();

// Get specific metrics
var someMetrics = ow.metrics.getSome(["customGauge", "mem"]);
```

### oJob Metrics Integration

```yaml
ojob:
  metrics:
    # Passive metrics (HTTP endpoint)
    passive: true
    port   : 9101
    uri    : "/metrics"
    host   : "0.0.0.0"
    
    # Active metrics (push to external systems)
    add:
      customMetric: | #js
        return { value: Math.random() * 100 }
      processedItems: | #js
        return { value: $get("itemsProcessed") || 0 }
    
    # Push to OpenMetrics/Prometheus
    openmetrics:
      url: "http://pushgateway:9091/metrics/job/myapp"
      period: 30000
      metrics: ["customMetric", "mem", "cpu"]
    
    # Push to nAttrMon
    nattrmon:
      url: "http://nattrmon:8080/cvals"
      period: 60000
      metrics: ["customMetric", "processedItems"]
    
    # Collect to channel for historical analysis
    collect:
      active: true
      ch    : "metricsHistory"
      period: 10000
```

### Server Telemetry Features

```javascript
// Load server module
ow.loadServer();

// Passive telemetry endpoint
ow.server.telemetry.passive(9102, "/health", true, "myapp", {
  "myapp_requests_total": {
    text: "Total requests", 
    help: "Number of requests processed", 
    type: "counter" 
  }
});

// Active telemetry pushing
ow.server.telemetry.active(function() {
  // Custom telemetry sender
  var metrics = ow.metrics.getAll();
  // Send to your monitoring system
  log("Sending metrics: " + JSON.stringify(metrics));
}, 30000);

// Send to nAttrMon
var sender = ow.server.telemetry.send2nAttrMon(
  "http://nattrmon:8080/cvals",
  "myapp",
  ["cpu", "mem", "customMetric"]
);
ow.server.telemetry.active(sender, 60000);
```

### OpenMetrics Format Support

Passive telemetry with `useOpenMetrics=true` serves OpenMetrics 1.0 text with
`application/openmetrics-text; version=1.0.0; charset=utf-8` and a final `# EOF` line.
It omits scrape timestamps. Pass `false` as the sixth argument of
`ow.server.telemetry.passive`, or set `ojob.metrics.openMetricsStrict: false`, to
select the legacy Prometheus text response. The JSON response and `f=json` query
override are also available; `f=om` selects the configured metrics text mode.

The object formatter retains its legacy output unless its sixth argument is `true`.
Strict mode supports scalar `unknown` (default), `gauge` and `counter` families;
other types need a structured metric model and are rejected. Help-map keys are the
fully prefixed sample names. Counter metadata uses the family name without
`_total`, while the sample uses `_total`. Strict mode groups each family, escapes
labels and help, uses `<prefix>_id` for array indexes, and rejects colliding names,
duplicate series, invalid timestamps and carriage returns in text. Numeric
timestamps are epoch seconds; a string timestamp argument selects a date label.

```javascript
// Convert metrics to OpenMetrics format
var openMetrics = ow.metrics.fromObj2OpenMetrics(
  ow.metrics.getAll(),      // metrics object
  "myapp",                  // prefix
  undefined,                // omit timestamps for a scrape
  {                         // help text mapping
    "myapp_cpu_load": { help: "CPU load", type: "gauge" },
    "myapp_mem_used": { help: "Memory used bytes", type: "gauge" }
  },
  undefined,                // optional value conversion map
  true                      // strict OpenMetrics 1.0
);

// Expose via HTTP server
var httpd = ow.server.httpd.start(9090);
ow.server.httpd.route(httpd, "/metrics", function(req) {
  return httpd.reply(openMetrics,
    "application/openmetrics-text; version=1.0.0; charset=utf-8", 200, {});
});
```

### Historical Metrics Collection

```yaml
ojob:
  channels:
    create:
    - name: metricsHistory
      type: mvs
      options:
        file: metrics.db
  
  metrics:
    collect:
      active: true
      ch    : metricsHistory
      period: 5000  # Collect every 5 seconds
      some  : ["mem", "cpu", "customMetric"]  # Only specific metrics
```

### Monitoring Integration Examples

```yaml
# Prometheus integration
ojob:
  metrics:
    passive: true
    port   : 9101
    uri    : "/metrics"
    openmetrics: true
    prefix : "myapp"

# Custom alerting
jobs:
- name: "Health Check"
  type: periodic
  typeArgs:
    cron: "*/30 * * * * *"  # Every 30 seconds
  exec: |
    var metrics = ow.metrics.getAll();
    if (metrics.mem.value > 1000000000) {  # 1GB
      log("HIGH MEMORY USAGE: " + ow.format.toBytesAbbreviation(metrics.mem.value));
    }
```

## 16. Terminal Visualization Patterns

The `ow.format` terminal visualization layer is useful for CLIs, live status pages and compact operational output.

### Capability-aware rendering

```javascript
ow.loadFormat();

var caps = ow.format.term.getCapabilities();
var pal  = ow.format.term.getPalette("auto");

log("TTY=" + caps.isTTY + ", color=" + caps.colorMode + ", unicode=" + caps.unicode);
```

Renderers automatically degrade for non-TTY, low-color and non-Unicode environments, so prefer the semantic palette instead of hard-coded ANSI sequences.

### Customizing colors with `__colorFormat`

`__colorFormat` is the global map holding the ANSI colors/styles used by `colorify`, `cprint*`, `printTable`, `printTree`, the `ask*` prompts and markdown rendering (`ow.format.withMD`). Each value is a comma-separated list of `ansiColor` attributes (e.g. `"BOLD,CYAN"`).

| Entry | Purpose |
|-------|---------|
| `key`, `number`, `string`, `boolean`, `date`, `default` | Colors per data type (maps, trees, tables) |
| `askPre`, `askQuestion`, `askChoose`, `askChooseFilter`, `askPos` | Colors for `ask`, `askChoose` and `askChooseMultiple` |
| `askChooseChars` | Characters for choose prompts (`chooseMultipleSelected`, `chooseMultipleUnselected`, `chooseUp`, `chooseDown`, `chooseLine`) |
| `table` | `{ lines, value, title, bandRow, format }`; `format` (`table`, `stable`, `ctable`, `btable`, `bstable`) is the default table renderer for `$output` when no global/explicit format is set |
| `tree` | `{ lines }` color of tree connectors |
| `md` | Markdown theme: `codeBlock`, `codeInline`, `heads` (`h1`–`h4`), `line`, `link`, `bullets`, `list`, `strike`, `note` (missing entries get defaults on first use) |

```javascript
__colorFormat.string = "GREEN";
__colorFormat.table.title = "BOLD,UNDERLINE";
__colorFormat.md.heads.h1 = "CYAN,BOLD";
cprint({ name: "openaf", ok: true, n: 1 });
```

### Side-line themes (`ow.format.withSideLineThemes`)

`ow.format.withSideLine(text, width, lineColor, textColor, theme, extra)` wraps text with a side line or box; `ow.format.withSideLineThemes()` returns the available themes by name (also used by `__colorFormat.md.*.theme`).

A theme is a map of characters: `ltop`, `tmiddle`, `rtop` (top border), `lmiddle`, `rmiddle` (sides), `lbottom`, `bmiddle`, `rbottom` (bottom border) and `tab` (tab replacement, default 3 spaces). Borders are only drawn when the corner characters are defined.

| Family | Themes |
|--------|--------|
| Plain sides | `simpleOneSpace`, `simpleLine`, `doubleOneSpace`, `doubleLine`, `doubleLineBothSides` |
| Sides with tips | `simpleLineWithTips`, `simpleLineWithTopTip`, `simpleLineWithBottomTip`, `simpleLineWithCTips`, `simpleLineWithCTopTip`, `simpleLineWithCBottomTip`, `simpleLineWithRTips`, `simpleLineWithRTopTip`, `simpleLineWithRBottomTip`, `doubleLineWithRTips` |
| Closed boxes | `closedOneSpace`, `closedRect`, `closedDoubleRect`, `closedCurvedRect` |
| Open boxes | `openTopRect`, `openBottomRect`, `openRect`, `openTopCurvedRect`, `openBottomCurvedRect`, `openCurvedRect`, `openCurvedSpace`, `blockCurvedSpace` |

```javascript
ow.loadFormat();
var t = ow.format.withSideLineThemes();
print(ow.format.withSideLine("Hello\nworld", 40, "YELLOW", __, t.closedCurvedRect, { header: " note ", headerAlign: "center" }));
```

For closed themes, `extra` accepts `header`, `footer`, `headerAlign` and `footerAlign` (`left`, `center`, `right`). Add your own themes (names that clash with built-in ones keep the built-in definition) by setting `__flags.sideLineCustomThemes` before calling `withSideLineThemes()`:

```javascript
__flags.sideLineCustomThemes = { arrow: { lmiddle: ">" } };
print(ow.format.withSideLine("custom", __, "GREEN", __, ow.format.withSideLineThemes().arrow));
```

### Dashboard composition

```javascript
print(ow.format.printDashboard([
  [
    { type: "bullet", title: "Storage", data: { value: 72, max: 100, target: 80 } },
    { type: "timeline", title: "Pipeline", data: [
      { label: "build", start: Date.now() - 120000, end: Date.now() - 60000, status: "ok" },
      { label: "test",  start: Date.now() - 60000, end: Date.now(),          status: "warn" }
    ] }
  ],
  [
    { type: "statusMatrix", title: "Fleet", data: { values: [["ok", "ok"], ["warn", "down"]], xLabels: ["a", "b"], yLabels: ["api", "db"] } }
  ]
], { width: 90, border: true }));
```

Use `printDashboard(...)` for explicit layouts and `ow.format.string.grid(...)` when you want a grid of cells that can mix classic renderers (`map`, `tree`, `table`, `chart`) with newer terminal widgets (`sparkline`, `histogram`, `heatmap`, `bullet`, `scatter`, `boxplot`, `timeline`, `statusMatrix`, `progress`, `md`, `text`).

### Live loops

```javascript
var live = ow.format.viz.live(function(ctx) {
  return ow.format.printDashboard([
    { type: "sparkline", title: "load", data: [ctx.frame % 7, 3, 5, 2, 6] },
    { type: "text", title: "size", data: stringify(ctx.size) }
  ], { width: ctx.size.width, height: 8 });
}, { fps: 5, diff: true });
```

The controller returned by `viz.live(...)` exposes `start()`, `stop()`, `update()` and `stats()`. Combine it with `viz.watchResize(...)` or the context `size` argument to keep output responsive.

## 17. AI and Machine Learning Integration

OpenAF provides comprehensive AI capabilities through `ow.ai` for both traditional ML and modern LLM integration.

### Traditional Neural Networks

```javascript
// Load AI module
ow.loadAI();

// Create a neural network
var nn = new ow.ai.network({ 
  type: "perceptron", 
  args: [2, 3, 1]  // 2 inputs, 3 hidden, 1 output
});

// Train the network
nn.train([
  {input: [0,0], output: [0]},
  {input: [0,1], output: [1]},
  {input: [1,0], output: [1]},
  {input: [1,1], output: [0]}
]);

// Use the network
var result = nn.get([1,0]);  // Returns ~1 for XOR
```

### Statistical Analysis

```javascript
// Regression analysis
var regression = ow.ai.regression();
var data = [[0,1],[1,3],[2,5],[3,7]];  // x,y pairs

var linear = regression.linear(data);
log("Equation: " + linear.string);     // y = 2x + 1
log("R²: " + linear.r2);               // Correlation coefficient

// Other regression types
var polynomial = regression.polynomial(data, { order: 2 });
var exponential = regression.exponential(data);
```

### Statistical Values Array

```javascript
// Create statistical tracker
var stats = ow.ai.valuesArray(100);  // Keep last 100 values

// Add values
stats.push(85.2);
stats.push(87.1);
stats.push(92.3);

// Get statistics
log("Average: " + stats.movingAverage());
log("Deviation: " + stats.deviation());
log("Variance: " + stats.variance());
```

### Large Language Models (LLMs)

```javascript
// Create LLM client (OpenAI example)
var llm = ow.ai.gpt({
  type: "openai",
  key : "your-api-key",
  url : "https://api.openai.com/v1",
  model: "gpt-3.5-turbo"
});

// Simple prompt
var response = llm.prompt("Explain quantum computing in simple terms");
log(response);

// Azure OpenAI v1 compatible endpoint
var azureV1 = ow.ai.gpt({
  type: "openai",
  key : "your-azure-api-key",
  url : "https://RESOURCE.openai.azure.com",
  mode: "azure-openai-v1",
  model: "your-deployment-name"
});

// Azure OpenAI legacy deployment endpoint
var azureLegacy = ow.ai.gpt({
  type       : "openai",
  key        : "your-azure-api-key",
  url        : "https://RESOURCE.openai.azure.com",
  mode       : "azure-openai-legacy",
  deployment : "your-deployment-name",
  apiVersion : "2024-10-21"
});

// Azure AI Foundry v1 endpoint
var foundry = ow.ai.gpt({
  type       : "openai",
  key        : "your-foundry-api-key",
  url        : "https://RESOURCE.services.ai.azure.com",
  mode       : "foundry",
  model      : "your-deployment-name"
});

// Azure AI Foundry dated model inference endpoint
var foundryPreview = ow.ai.gpt({
  type       : "openai",
  key        : "your-foundry-api-key",
  url        : "https://RESOURCE.services.ai.azure.com/models",
  mode       : "foundry",
  apiVersion : "2024-05-01-preview",
  model      : "your-deployment-name"
});

// Azure and Foundry modes default to api-key authentication.
// Standard OpenAI mode defaults to Authorization: Bearer.
// Use authType only for compatible proxies or custom authentication:
// authType: "bearer" | "api-key" | "none"

// Conversation
llm.addSystemPrompt("You are a helpful coding assistant");
llm.addUserPrompt("How do I sort an array in JavaScript?");
var answer = llm.prompt();
```

### Multi-Provider LLM Support

```javascript
// OpenAI
var openai = ow.ai.gpt({
  type: "openai",
  key : process.env.OPENAI_KEY,
  model: "gpt-4"
});

// Anthropic Claude
var claude = ow.ai.gpt({
  type: "anthropic", 
  key : process.env.ANTHROPIC_KEY,
  model: "claude-3-sonnet-20240229"
});

// Local Ollama
var ollama = ow.ai.gpt({
  type: "ollama",
  url : "http://localhost:11434",
  model: "llama2"
});

// Google Gemini
var gemini = ow.ai.gpt({
  type: "gemini",
  key : process.env.GEMINI_KEY,
  model: "gemini-2.5-flash"
});
```

### LLM Tool/Function Calling

```javascript
var llm = ow.ai.gpt({ type: "openai", key: "...", model: "gpt-3.5-turbo" });

// Register a tool
llm.setTool("getCurrentWeather", 
  "Get the current weather for a location",
  {
    type: "object",
    properties: {
      location: { type: "string", description: "City name" },
      units: { type: "string", enum: ["celsius", "fahrenheit"] }
    },
    required: ["location"]
  },
  function(params) {
    // Your weather API call here
    return { temperature: 22, condition: "sunny" };
  }
);

// Use the tool in conversation
var response = llm.prompt("What's the weather like in London?");
```

### Image Processing with LLMs

```javascript
var llm = ow.ai.gpt({ type: "openai", key: "...", model: "gpt-4-vision-preview" });

// Analyze an image
var description = llm.promptImage(
  "Describe what you see in this image",
  "/path/to/image.jpg",
  "high"  // detail level
);

// Generate images (OpenAI only)
var imageData = llm.promptImgGen("A sunset over mountains");
io.writeFileBytes("generated.png", imageData[0]);
```

### oJob LLM Integration

```yaml
# Built-in LLM job
jobs:
- name: "AI Analysis"
  from: "ojob llm"
  args:
    __llmPrompt: "Analyze this data and provide insights"
    __llmInPath: "data"
    __llmEnv   : "OPENAI_API_KEY"
    __llmOptions:
      type: "openai"
      model: "gpt-4"
      temperature: 0.3

- name: "Data Processing"
  exec: |
    args.data = { sales: [100, 200, 150], region: "North" };
  to: ["AI Analysis"]
```

### Advanced LLM Patterns

```javascript
// Conversation management
var llm = ow.ai.gpt({...});

// Save/restore conversations
var conversation = llm.getConversation();
$set("chatHistory", conversation);

// Later...
llm.setConversation($get("chatHistory"));

// JSON structured responses
var jsonResponse = llm.prompt(
  "Return product info as JSON", 
  "gpt-3.5-turbo",
  0.1,  // low temperature for consistency
  true  // JSON flag
);
var product = JSON.parse(jsonResponse);

// Batch processing
var results = [];
["item1", "item2", "item3"].forEach(item => {
  results.push(llm.prompt("Analyze: " + item));
});
```

### AI Integration Best Practices

1. **API Key Management**: Use environment variables and `ow.sec` for secure key storage
2. **Error Handling**: LLM calls can fail; wrap in try-catch blocks
3. **Rate Limiting**: Implement delays between calls to respect API limits
4. **Cost Control**: Monitor usage and implement budget controls
5. **Prompt Engineering**: Use clear, specific prompts for better results
6. **Conversation Memory**: Manage conversation history to stay within token limits

```javascript
// Example with error handling and retry
function robustLLMCall(prompt, maxRetries = 3) {
  var llm = ow.ai.gpt({...});
  
  for (var i = 0; i < maxRetries; i++) {
    try {
      return llm.prompt(prompt);
    } catch (e) {
      logWarn("LLM call failed (attempt " + (i+1) + "): " + e.message);
      if (i < maxRetries - 1) sleep(2000);  // Wait before retry
    }
  }
  throw "LLM call failed after " + maxRetries + " attempts";
}
```

## 18. Safe Dynamic Includes
Combine integrity hashes + authorized domains + change auditing flags. For local development disable with environment variable toggles but keep production strict.

## 19. HTTP Path Prefix Support (ow.server.httpd)

OpenAF's embedded HTTP server supports serving all resources and routes under a configurable path prefix. This is useful when deploying behind a reverse proxy that forwards requests under a subpath (e.g. `/app`).

### Setting a prefix

Set the `HTTPD_PREFIX` flag before starting any server. Key `"0"` is the global default for all ports; use a specific port number string to override per port:

```javascript
// Set global prefix /app for all HTTP servers
__flags.HTTPD_PREFIX = { "0": "/app" };

// Or different prefixes per port
__flags.HTTPD_PREFIX = { "0": "", "8080": "/api", "9090": "/gui" };
```

Via oJob YAML:
```yaml
ojob:
  flags:
    HTTPD_PREFIX:
      "0": /app
```

### Prefix utility functions

`ow.server.httpd` provides helper functions to work with prefixes:

| Function | Description |
|----------|-------------|
| `ow.server.httpd.getPrefix(httpdOrPort)` | Returns the normalized prefix for the given server or port |
| `ow.server.httpd.withPrefix(httpdOrPort, uri)` | Prepend the prefix to `uri` (skips absolute URLs) |
| `ow.server.httpd.stripPrefix(httpdOrPort, uri)` | Remove the prefix from a URI for internal routing |
| `ow.server.httpd.normalizePrefix(aPrefix)` | Normalize a raw prefix string (ensures leading `/`, no trailing `/`) |

```javascript
ow.loadServer();
__flags.HTTPD_PREFIX = { "0": "/app" };

var httpd = ow.server.httpd.start(8080);

// Build a prefixed URL
var link = ow.server.httpd.withPrefix(httpd, "/about"); // "/app/about"

// Strip prefix for internal route matching
ow.server.httpd.route(httpd, ow.server.httpd.mapWithExistingFn(httpd, {
  "/about": function(req) {
    return httpd.replyOKText("About page");
  }
}), function(req) {
  var internalURI = ow.server.httpd.stripPrefix(httpd, req.uri);
  return httpd.replyNotFound();
});
```

All built-in GUI pages and static-file handlers automatically respect the configured prefix.

## 20. MCP Client ($mcp)

`$mcp(aOptions)` creates a Model Context Protocol (MCP) client for communicating with LLM tool servers.

### Connection types

| `type` | Description |
|--------|-------------|
| `stdio` (default) | Spawn a local process; communicate over stdin/stdout |
| `remote` / `http` | HTTP JSON-RPC endpoint |
| `sse` | HTTP endpoint with Server-Sent Events responses |
| `ojob` | In-process oJob jobs exposed as MCP tools |
| `dummy` | Local in-memory stub for testing |

```javascript
// stdio MCP server
var client = $mcp({ type: "stdio", cmd: "my-mcp-server" });
client.initialize();
var tools = client.listTools();
var result = client.callTool("myTool", { param: "value" });

// Remote HTTP MCP server
var remote = $mcp({ type: "remote", url: "https://mcp.example.com/mcp" });
remote.initialize();
```

### Authentication (`auth` option)

For `remote`/`http`/`sse` connections:

```javascript
// Static bearer token
var client = $mcp({
  type: "remote",
  url: "https://mcp.example.com/mcp",
  auth: { type: "bearer", token: "my-token" }
});

// OAuth2 client credentials
var client = $mcp({
  type: "remote",
  url: "https://mcp.example.com/mcp",
  auth: {
    type: "oauth2",
    tokenURL: "https://auth.example.com/oauth/token",
    clientId: "my-client",
    clientSecret: "my-secret",
    scope: "mcp:read mcp:write"
  }
});

// OAuth2 authorization_code (opens browser)
var client = $mcp({
  type: "remote",
  url: "https://mcp.example.com/mcp",
  auth: {
    type: "oauth2",
    grantType: "authorization_code",
    authURL: "https://auth.example.com/authorize",
    tokenURL: "https://auth.example.com/oauth/token",
    clientId: "my-client",
    redirectURI: "http://localhost:8080/callback",
    disableOpenBrowser: false  // set true to suppress browser launch
  }
});
```

OAuth2 token URLs can also be auto-discovered from the MCP server's OAuth 2.0 Protected Resource Metadata when `tokenURL`/`authURL` are omitted.

To retain OAuth credentials across sessions, opt in with `auth.tokenStore: { type: "sec", profile: "alice" }`. The built-in adapter uses an encrypted SBucket and coordinates token refresh across local processes. Custom synchronous stores are also supported. See [persistent OAuth, callback login and token stores](mcp-oauth.md) for configuration, failure behavior and storage limitations.

### Resources, callbacks and MCP Apps

See [MCP client capabilities](mcp-client.md) for resource/template APIs, subscriptions,
server-initiated request and notification handlers, sampling/elicitation/roots,
modern continuations, rich results, the optional Apps host contract, verified
draw.io examples and the capability matrix. The default version remains 2025-06-18.

### Tool blacklist

Prevent specific tools from appearing in `listTools()` or being called via `callTool()`:

```javascript
var client = $mcp({
  type: "stdio",
  cmd: "my-mcp-server",
  blacklist: ["dangerousTool", "internalTool"]
});
client.initialize();
// listTools() will not include blacklisted tools
// callTool("dangerousTool", {}) throws an error
```

---
See also: `ojob-security.md`, `openaf-flags.md`, and main references.

### Category distributions: pie, donut and stacked bars

Load `ow.loadFormat()` first. Each renderer returns a string; use `print()` for static
output or return it from a dashboard renderer. Inputs can be `[50, 30, 20]`, a map
such as `{ A: 50, B: 30, C: 20 }`, or records with `label`, `value` and optional
`color`. Values must be finite non-negative numbers; invalid values and colours
throw. Empty input produces `(empty)` and zero totals produce `(no data)`.

```javascript
ow.loadFormat()
var values = [
  { label: "A", value: 50, color: "BLUE" },
  { label: "B", value: 30, color: "GREEN" },
  { label: "C", value: 20, color: "YELLOW" }
]

// One-line category distribution; disable summary text to devote every cell to the bar.
print(ow.format.printStackedBar(values, { width: 40, showPercent: false }))
print(ow.format.printPie(values, { size: "tiny", width: 60 }))

// Small and medium circles. Named sizes describe geometry before external legends.
print(ow.format.printPie(values, { size: "small", mode: "braille" }))
print(ow.format.printPie(values, { size: "medium", mode: "halfblock" }))
print(ow.format.printDonut(values, { size: "small" }))
print(ow.format.printDonut(values, {
  size: "medium", innerRadius: 0.6, centerText: "65%", legend: "right"
}))

// Normalized percentage bar with a separate legend.
print(ow.format.printStackedBar(values, {
  width: 40, normalize: true, showPercent: true, legend: "bottom", palette: "auto"
}))
print(ow.format.printStackedColumns([
  { label: "Host 1", values: { CPU: 50, Memory: 30, Other: 20 } },
  { label: "Host 2", values: { CPU: 20, Memory: 50, Other: 30 } }
], { width: 30, height: 8 }))
```

`small` uses 12×5 geometry and `medium` uses 20×8. Explicit `width`/`height`
constrain the entire output, including legends, and override preset geometry.
Supplying just one dimension derives the other from `cellAspect` after reserving
legend space. Dashboard-allocated dimensions remain bounds unless the widget's
own options explicitly set width or height. `size: "auto"` chooses a fitting
preset. Below 8×4 geometry, pie/donut fall back to a stacked summary; select
`fallback: "text"` for text only. `legend` accepts `auto`, `right`, `bottom`,
`inline` and `none`; a constrained right legend moves below the chart when needed.
Centre text never overwrites the donut ring. If it cannot fit, it goes to the
legend; `centerTextOverflow: "clip"` or `"omit"` changes that policy.

`mode: "auto"` prefers coloured half-blocks, with separate upper/lower colours.
Braille has finer geometry but only one foreground colour per cell: mixed cells
use the majority category, with input-order ties. Monochrome Braille uses stipples;
ASCII geometry uses category letters. Half-block monochrome falls back to ASCII.
`cellAspect` defaults to 0.5 (physical cell width/height); fonts can require adjustment.
Angles are degrees: `startAngle: -90`, `clockwise: true` starts at the top.

Colour is optional. `palette` accepts `auto`, `none`, `16`, `256`, `truecolor`;
`colors` supplies category overrides. `color: false` and `NO_COLOR` suppress ANSI.
Tiny positive slices can have no rendered samples; legends mark them with `*`.
The default `maxCategories: 12` aggregates excess categories as `Other (n)`;
use zero to retain all. Percentages describe the data, not quantized pixel areas.
Duplicate labels remain separate and receive occurrence suffixes.

Compact bars show category IDs and percentages inline; use a bottom legend for full labels.
Stacked bars use stable largest-remainder allocation. Colour Unicode bars use
eighth-cell blocks where representable, falling back to whole cells if more than
two categories share a cell. Monochrome uses category letters. Absolute mode is
`normalize: false, max: 200`; a maximum below the total throws. Column charts use
a shared maximum and consistent category identity across columns. A column chart
too narrow to retain every column throws rather than dropping data.

```javascript
// Mixed dashboard. Grid cells use obj instead of data and accept the same types/options.
print(ow.format.printDashboard([[
  { type: "pie", title: "Distribution", data: values },
  { type: "donut", title: "Share", data: values,
    options: { innerRadius: 0.6, centerText: "65%" } },
  { type: "stackedBar", title: "Resources", data: values,
    options: { legend: "bottom" } }
]], { width: 100, height: 12, border: true }))

// Live output: stop the controller when finished.
var live = ow.format.viz.live(function(ctx) {
  return ow.format.printDashboard([[
    { type: "donut", title: "Live share", data: [50 + ctx.frame % 10, 30, 20],
      options: { size: "auto", legend: "right" } },
    { type: "stackedBar", title: "Resources", data: values }
  ]], {
    width: ctx.size.width, height: Math.max(1, ctx.size.height - 1),
    capabilities: ctx.capabilities, border: true
  })
}, { fps: 4 })
// live.stop()

// Deterministic no-colour rendering, including redirected stdout:
print(ow.format.printPie(values, {
  width: 32, height: 8, palette: "none", unicode: false,
  capabilities: { width: 32, height: 8, ansi: false, unicode: false, colorMode: "none" }
}))
```

Use static rendering when redirecting output to a file, for example save the last
snippet in `distribution.js` and run `openaf -f distribution.js > distribution.txt`.
Explicit capabilities and dimensions do not require a TTY. Renderers do not move
the cursor or perform external I/O. `viz.diffFrames` currently rewrites the frame;
it detects colour-only changes, clears removed rows and preserves the next frame's
cursor origin. It is not a per-cell diff engine.

For text composition, use `visibleLength`, `string.ansiClip` and `string.ansiPad`.
Clipping preserves supported Unicode clusters and complete styling escapes, closes
ANSI styles/hyperlinks, and respects column budgets. Emoji widths follow OpenAF's
`VISIBLELENGTH_WIDE_EMOJI` setting; actual terminal fonts can differ. Capability
width/height overrides apply only to the current call and do not change the cache.

#### Measuring render performance

Use the existing `ow.format.viz.benchmarkRender` after warming up the JVM:

```javascript
var render = function() {
  return ow.format.printPie([50, 30, 20], {
    size: "medium", mode: "braille", palette: "16", legend: "none",
    capabilities: { width: 80, height: 24, ansi: true, unicode: true, colorMode: "16" }
  })
}
for (var i = 0; i < 100; i++) render()
for (var batch = 0; batch < 5; batch++) {
  print(ow.format.viz.benchmarkRender(render, { iterations: 200 }))
}
```

Reference budgets after warm-up: p95 at most 5 ms for a 40-column stacked bar,
15 ms for a medium pie/donut, and 50 ms for a 100×30 mixed dashboard. These are
measurement targets, not portable unit-test timeouts. Record JVM, hardware and
background load when comparing results. `viz.live` also accepts an explicit
`capabilities` map; with it, automatic terminal resize polling is disabled and
updates use the supplied dimensions.

### Diverging bars, treemaps and sparkline annotations

These additions use the same offline rendering and capability options as pie and
stacked charts. They return strings, with no printing or cursor movement.

```javascript
ow.loadFormat()
print(ow.format.printDivergingBars({ Regression: -12, Unchanged: 0, Improvement: 30 }, {
  width: 50, symmetric: true, palette: "auto"
}))
print(ow.format.printTreemap({ API: 50, Cache: 30, Workers: 20 }, {
  width: 40, height: 10, legend: "right", palette: "auto"
}))
print(ow.format.printSparkline([10, 25, null, 40, 70, 55], {
  width: 40, min: 0, max: 100, missing: "gap",
  thresholds: [{ value: 60, color: "RED" }],
  markMin: true, markMax: true, highlightLast: "YELLOW", trend: true
}))
```

Diverging bars accept signed number arrays, category records, or value maps.
The default symmetric range centres the zero axis; `symmetric: false` allocates
negative/positive space according to their respective extents. Explicit `min`
and `max` must include zero and all values. `labels` and `showValue` default to
true. The default width is 40 and the height is the number of values. Monochrome
uses minus/plus bars, so direction remains readable without colour. Very narrow
boxes use signed text. Categories retain their order and are never aggregated.

Treemaps accept the non-negative category formats supported by `printPie`.
Defaults are 40×10, `labels: true`, `cellAspect: 0.5`, and an automatic bottom
legend occupying up to three rows. `legend: "right"` reserves a side panel when
it fits. Balanced recursive slicing splits along the longer physical dimension,
using stable value order and integer cell boundaries. Categories too small to
receive cells are marked `*`; a truncated legend announces hidden categories.
This deliberately favours predictable small layouts over a squarified algorithm.
Labels never extend beyond their rectangles. Use `legend: "none"` to devote the
whole box to geometry. Small boxes use a stacked distribution instead.

Sparkline annotations are opt-in. Existing calls retain their glyphs, sampling
and defaults. Enhanced mode supports:

- `min`/`max`: fixed geometry bounds; values outside the range clamp to the endpoint.
- `missing: "gap" | "skip" | "error"`: handles null, undefined and NaN. Other
  nonnumeric or infinite values throw. The default in enhanced mode is `gap`.
- `markMin`/`markMax`: use ▼/▲, or v/^ in ASCII. Max wins when both markers apply.
- `highlightLast`: true for yellow, or an explicit colour for the last visible value.
- `trend`: append ↑/↓/→, or +/-/= in ASCII, comparing first and last finite values.
- `thresholds: [{value,color}]`: thresholds apply in ascending order.
- `colorScale`: an array of category colours or `{min,max,colors}`. Explicit scale
  bounds give multiple series a consistent colour scale. Threshold colours take
  precedence over the scale; last-value highlighting takes precedence over both.

Enhanced sparklines budget labels, names and annotations inside the requested
width. Downsampling selects the last point in each bin and retains the last
sample. No-colour output still includes geometry, extrema markers and trend.
Both `divergingBars` and `treemap` are dashboard/grid widget types. For example:

```javascript
print(ow.format.printDashboard([[
  { type: "divergingBars", title: "Change", data: { A: -10, B: 25 } },
  { type: "treemap", title: "Capacity", data: { API: 50, Cache: 30, Other: 20 } }
]], { width: 80, height: 12 }))
```

Very small positive percentages are displayed as `<0.1%` at the default precision,
rather than rounded to zero. Aggregated values that overflow a finite JavaScript
sum are labelled `sum > 1.7976931348623157e+308`; normalized shares remain finite.

The optional benchmark is reproducible without external dependencies:

```sh
cd tests
java --enable-native-access=ALL-UNNAMED -jar ../openaf.jar -f benchmark-format-viz.js > /tmp/format-viz-benchmark.json
```

To exercise real colour modes on POSIX systems, run the command with `env -u NO_COLOR`
prefixed; this changes only that child process. Otherwise the benchmark correctly
honours `NO_COLOR` and measures monochrome fallbacks.

It records OS/architecture, JVM, `NO_COLOR` status, warm-up count, five batches of 200 renders,
legacy baselines, twelve-category alternating-colour input, new renderers and a
mixed dashboard. Budgets are reported per renderer. Set
`FORMAT_VIZ_BENCH_ENFORCE=true` to enforce reference-machine budgets; ordinary
unit tests do not assert wall-clock timings. Sample counts can be overridden with
`FORMAT_VIZ_BENCH_WARMUP`, `FORMAT_VIZ_BENCH_ITERATIONS` and `FORMAT_VIZ_BENCH_BATCHES`.

The following candidates remain intentionally unimplemented: horizontal range
charts (highest utility/lowest complexity), percentile strips, grouped bars,
logarithmic histograms, and waterfalls. Quadrant encoding, public raster/renderer
registries and per-cell frame diffs also remain outside this implementation.

### Terminal visualization validation snapshot (2026-11-08)

Phases 1–5 are implemented. Phase 6 automated checks are green for the local
macOS build and the offline Linux minimum-runtime checks below. Native desktop
and Windows visual verification remain explicitly unverified; this snapshot does
not certify a Windows terminal or a GUI terminal emulator.

| Gate | Observed result |
| --- | --- |
| Build with JDK 27.0.1.0.3 | Passed; compiled/repacked JAR produced |
| Complete repository suite | 532/532 passed; 17,413 assertions; colour cases enabled |
| Offline Format exports, macOS arm64 / Java 27 | 76 passed from an unrelated working directory |
| Focused Linux arm64 / Java 21.0.12 checks | 24 passed, no network, read-only JAR/test mounts |
| Linux arm64 / Java 25 checks | 24 passed before the final colon-SGR compatibility correction |
| macOS PTY size checks | Direct input, piped stdin, redirected stdout, resize and stdin preservation passed |
| Linux Java 21 PTY capabilities | stdout TTY and ANSI detected; xterm-256color profile returned |
| Packaged public APIs and offline help | Pie, donut, stacked bars/columns, diverging bars and treemap present |
| Unicode/ANSI regressions | Covered clusters, wide cells, CSI/OSC clipping, retained line breaks, colon SGR in JS and Java |
| Frame/resize lifecycle | Terminal-state emulator verifies changed FG/BG, removed rows and cursor origin; watcher snapshots reused maps and stops polling |
| Headless font previews | Menlo, 11×22 cells, Braille supported; light and dark inspected |
| Optimization visual equivalence | Both font-preview PNGs byte-identical before/after treemap run encoding |
| Native desktop/Windows matrix | Pending: desktop locked; no Windows terminal available |

All ten benchmark budgets passed on both recorded runtimes. The following are the
largest p95 measurements among five batches of 200 renders, after 100 warm-ups.
`NO_COLOR` was absent in both processes; these include real-colour encoding rather
than accidentally timing monochrome fallbacks.

| Renderer | Reference budget, ms | macOS Java 27, ms | Linux Java 21, ms |
| --- | ---: | ---: | ---: |
| `legacySparkline` | 5 | 1 | 2 |
| `legacyHeatmap` | 15 | 2 | 3 |
| `stackedBar` | 5 | 3 | 3 |
| `halfblockPie` | 15 | 9 | 9 |
| `braillePie` | 15 | 12 | 13 |
| `donut` | 15 | 8 | 9 |
| `divergingBars` | 10 | 2 | 2 |
| `treemap` | 40 | 4 | 4 |
| `enhancedSparkline` | 5 | 1 | 1 |
| `mixedDashboard` | 50 | 39 | 38 |

A concurrent-load diagnostic run measured 51 ms p95 for the Linux mixed dashboard;
the table records the controlled run after the full test suite exited. Timing
budgets are reference-machine measurements, not guarantees under competing load.

Explicit sizing regressions also verify that a small pie/donut can expand to
24×12, either dimension derives the other from cell aspect ratio, and dashboard
bounds preserve presets unless widget options explicitly override dimensions.

The unsupported-provider AI fixture was updated to explicitly remove the two
structured-output interfaces on its local test instances. Provider names no longer
imply missing capabilities. The exact unsupported-capability error assertion is
retained, and no production AI implementation was changed.

Relevant tests live in `tests/autoTestAll.Format.js` and are registered after
`Format::Load Format` in the paired YAML. They include `testPrintPieDonut`,
`testPrintStackedDistributions`, `testPrintDivergingBars`, `testPrintTreemap`,
`testSparklineEnhancements`, `testVizRasterEncoders`, `testVizCanvasUnicode`,
`testAnsiClipClusters`, `testVizFrameTerminalState`, `testVizWatchResize`, and
mixed dashboard/grid/live cases. Wall-clock budgets remain in the separate
`tests/benchmark-format-viz.js` harness, not ordinary unit tests.

To rerun the complete suite against the built JAR:

```sh
cd tests
env -u NO_COLOR java --enable-native-access=ALL-UNNAMED -jar ../openaf.jar --ojob -e autoTestAll.yaml
```

To enforce the recorded benchmark budgets on a reference machine:

```sh
env -u NO_COLOR FORMAT_VIZ_BENCH_ENFORCE=true java --enable-native-access=ALL-UNNAMED -jar ../openaf.jar -f benchmark-format-viz.js
```

Native terminal font/raster placement, GUI reflow during resize, and Windows
console integration still require an available native environment. Headless font
previews and byte-level assertions do not claim to replace those checks.
