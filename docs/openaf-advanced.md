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

- **$do** – queue work on the standard ForkJoin-backed pool and receive an `oPromise` for fluent `.then` / `.catch` composition. The resolver passed into your function can resolve with returned values or explicit `resolve()` calls, while thrown errors or `reject()` calls route to the rejection chain.【F:js/openaf.js†L13426-L13455】【F:js/openaf.js†L12472-L12528】
- **$doV** – same contract as `$do` but targets a virtual-thread-per-task executor so launching many concurrent tasks will not consume native threads when the JVM supports Project Loom virtual threads.【F:js/openaf.js†L13444-L13455】【F:js/openaf.js†L12421-L12438】
- **Coordination helpers** – mix `$doAll` / `$doFirst` (wrappers over `oPromise.all()` / `.race()`) to wait for all tasks or the first completion, enabling fan-out/fan-in patterns without manual synchronization primitives.【F:js/openaf.js†L13459-L13479】【F:js/openaf.js†L12532-L12589】
- **Cancellation** – call `.cancel()` on any `$do` / `$doV` promise to interrupt the associated thread (mirroring the Threads plugin) and drive the chain into the rejection path for cleanup.【F:js/openaf.js†L13426-L13455】【F:js/openaf.js†L12664-L12683】

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
  "requests_total": { 
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

```javascript
// Convert metrics to OpenMetrics format
var openMetrics = ow.metrics.fromObj2OpenMetrics(
  ow.metrics.getAll(),      // metrics object
  "myapp",                  // prefix
  new Date(),               // timestamp
  {                         // help text mapping
    "cpu": { text: "CPU usage percentage", type: "gauge" },
    "mem": { text: "Memory usage bytes", type: "gauge" }
  }
);

// Expose via HTTP server
var httpd = ow.server.httpd.start(9090);
ow.server.httpd.route(httpd, "/metrics", function(req) {
  return httpd.replyOKText(openMetrics);
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

## 16. AI and Machine Learning Integration

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

## 17. Safe Dynamic Includes
Combine integrity hashes + authorized domains + change auditing flags. For local development disable with environment variable toggles but keep production strict.

---
See also: `ojob-security.md`, `openaf-flags.md`, and main references.
