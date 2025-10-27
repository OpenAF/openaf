# OpenAF Guide for LLM Code Generation

**Version: 1.0**
**Target Audience: Large Language Models (LLMs) for automated code generation**

This document provides comprehensive guidance for generating OpenAF JavaScript (.js) files and oJob YAML (.yaml) files. It consolidates patterns, best practices, and examples to help LLMs produce correct, idiomatic OpenAF code.

---

## Table of Contents

1. [Introduction to OpenAF](#introduction-to-openaf)
2. [OpenAF JavaScript Files](#openaf-javascript-files)
3. [oJob YAML Files](#ojob-yaml-files)
4. [Common Patterns and Best Practices](#common-patterns-and-best-practices)
5. [Complete Examples](#complete-examples)
6. [Quick Reference](#quick-reference)

---

## Introduction to OpenAF

### What is OpenAF?

OpenAF is a comprehensive JavaScript framework that extends the Mozilla Rhino JavaScript interpreter for Java environments. It provides:

- **Enhanced JavaScript**: Extended with powerful helper functions and utilities
- **oJob Framework**: YAML-based job orchestration system
- **OpenWrap Extensions**: Modular libraries (ow.*) for specialized functionality
- **Multi-language Support**: Execute Python, Shell, SSH, PowerShell, etc. within jobs
- **Built-in Security**: Secure storage, integrity checking, and validation
- **Channel System**: Distributed data management and pub/sub
- **AI Integration**: LLM support and traditional ML capabilities

### Key Concepts

- **args**: The global arguments object available in all job executions
- **Channels**: Key/value stores with pub/sub capabilities ($ch)
- **oPromises**: Asynchronous execution primitives ($do, $doV)
- **Validation**: Type checking and transformation (_$)
- **Templates**: Handlebars-based templating (templify)
- **nLinq**: LINQ-like query capabilities ($from)

---

## OpenAF JavaScript Files

### Basic Structure

OpenAF JavaScript files use standard JavaScript syntax with OpenAF-specific global functions and objects.

```javascript
// Basic OpenAF script structure

// 1. Load required libraries
ow.loadFormat();
ow.loadServer();

// 2. Parameter validation
_$(myParam, "myParam").isString().$_();

// 3. Main logic
var result = doSomething();

// 4. Output
print(stringify(result));
```

### Core Helper Functions

#### 1. `$$` - Object Inspection and Manipulation

```javascript
// Type checking
$$(myVar).isString()      // Returns true/false
$$(myVar).isNumber()      // Returns true/false
$$(myVar).isArray()       // Returns true/false
$$(myVar).isMap()         // Returns true/false
$$(myVar).isDef()         // Returns true/false

// Property access with dot notation
var obj = { user: { name: "John", age: 30 } };
$$(obj).get("user.name")           // Returns "John"
$$(obj).set("user.email", "john@example.com")
$$(obj).unset("user.age")

// Case-insensitive access
$$(obj).getI("USER.NAME")
```

#### 2. `_$` - Parameter Validation

```javascript
// Basic validation with error throwing
_$(username, "username").isString().$_();
_$(age, "age").isNumber().default(18);
_$(email, "email").isString().notEquals("");

// Type conversion
_$(value, "value").toNumber();
_$(value, "value").toString();
_$(value, "value").toBoolean();

// String validations
_$(email, "email").isEmail();
_$(id, "id").isUUID();
_$(text, "text").minLength(5).maxLength(100);

// Number validations
_$(age, "age").isNumber().between(0, 150);
_$(score, "score").isNumber().multipleOf(0.5);

// Array validations
_$(items, "items").isArray().minLength(1);
_$(emails, "emails").isArray().eachIsString();

// Object validations
_$(config, "config").isMap().hasKeys(['host', 'port']);
_$(data, "data").isSchema(schema);

// Conditional validation
_$(value, "value").check(v => v > 0, "Value must be positive");
_$(user, "user").expr("v.age >= 18", "User must be an adult");
```

#### 3. `$from` - nLinq Query Processing

```javascript
var data = [
  { name: "John", age: 25, city: "New York" },
  { name: "Jane", age: 30, city: "Boston" },
  { name: "Bob", age: 35, city: "Chicago" }
];

// Basic filtering
var adults = $from(data).greater("age", 25).select();

// Chained operations
var result = $from(data)
  .contains("city", "New")
  .or()
  .greater("age", 30)
  .select();

// Aggregation
$from(data).min("age")
$from(data).max("age")
$from(data).average("age")
$from(data).sum("age")
$from(data).count()

// Sorting and limiting
$from(data).sort("age").limit(5).select()
$from(data).sort("-age").select()  // Descending

// Grouping
$from(data).group("city").select()

// Transformations
$from(data).select(item => ({
  name: item.name,
  isAdult: item.age >= 18
}))
```

#### 4. `$path` - JMESPath Query & Transform

```javascript
var data = { a: [ {x:1,y:2}, {x:2,y:3}, {x:3,y:4} ] };

$path(data, "a[?x>`1`].y");           // [3,4]
$path(data, "a[].{sum: x + y}");      // [{sum:3},{sum:5},{sum:7}]
$path([1,2,3,4,5], "[1:4:2]");        // [2,4]

// Custom functions
var custom = {
  inc: {
    _func: v => Number(v)+1,
    _signature: [{types: [$path().number]}]
  }
};
$path(10, "inc(@)", custom);  // 11
```

#### 5. `$ch` - Channel Operations

```javascript
// Create channel
$ch("myChannel").create();

// Set/get values
$ch("myChannel").set({id: 1}, {name: "John"});
var user = $ch("myChannel").get({id: 1});

// Get all data
var all = $ch("myChannel").getAll();
var keys = $ch("myChannel").getKeys();

// Subscribe to changes
$ch("myChannel").subscribe((ch, op, key, value) => {
  log("Operation: " + op);
});

// Channel size and destruction
var size = $ch("myChannel").size();
$ch("myChannel").destroy();
```

#### 6. `$do` / `$doV` - Asynchronous Operations

```javascript
// Basic async execution
$do((resolve, reject) => {
  var data = heavyComputation();
  resolve(data);
})
.then(result => log("Done: " + result))
.catch(err => logErr(err));

// Virtual thread execution (Loom)
$doV(() => {
  return fetchData();
})
.then(data => processData(data));

// Parallel execution
var tasks = [url1, url2, url3].map(url =>
  $doV(() => httpGet(url))
);

$doAll(tasks)
  .then(results => log("Fetched: " + results.length))
  .catch(err => logErr(err));

// Race condition
$doFirst([task1, task2, task3])
  .then(fastest => log("First result: " + fastest));
```

#### 7. `$sh` - Shell Command Execution

```javascript
// Basic command
var res = $sh("ls -1").get(0);
print(res.out);

// Chained execution
$sh()
  .sh("echo first")
  .sh("echo second 1>&2")
  .exec();

// Parse output
var data = $sh("cat data.json").getJson(0);
var yaml = $sh("cat config.yaml").getYaml(0);
```

#### 8. `$tb` - Thread Box (Timeout Control)

```javascript
// Execute with timeout
$tb(() => {
  heavyWork();
})
.timeout(5000)
.exec();

// With stop condition
$tb(taskFn)
  .timeout(10000)
  .stopWhen(() => shouldStop())
  .exec();
```

#### 9. `templify` - Template Expansion

```javascript
// Basic template
var name = "World";
var out = templify("Hello {{name}}!");  // "Hello World!"

// With data object
var template = "User: {{user.name}}, Age: {{user.age}}";
var data = { user: { name: "John", age: 30 } };
var result = templify(template, data);
```

### OpenWrap Extensions (ow.*)

#### ow.format - Formatting Utilities

```javascript
ow.loadFormat();

// Date formatting
ow.format.fromDate(new Date(), "yyyy-MM-dd HH:mm:ss");
ow.format.toDate("2023-12-25", "yyyy-MM-dd");

// Number formatting
ow.format.round(3.14159, 2);              // 3.14
ow.format.toBytesAbbreviation(1048576);   // "1 MB"

// Time utilities
ow.format.timeago(someTimestamp);
ow.format.elapsedTime4ms(duration);

// String utilities
ow.format.string.genPass(12, ["lowercase", "uppercase", "numbers"]);
```

#### ow.obj - Object Utilities and REST

```javascript
ow.loadObj();

// REST operations
var data = ow.obj.rest.jsonGet("https://api.example.com/data");
var response = ow.obj.rest.jsonPost("https://api.example.com/users", postData);

// Object path operations
ow.obj.getPath(obj, "user.settings.theme");
ow.obj.setPath(obj, "user.settings.theme", "dark");

// Object filtering
ow.obj.filter(arrayOfObjects, {name: "John", age: 30});
```

#### ow.ch - Advanced Channel Operations

```javascript
ow.loadCh();

// Create different channel types
ow.ch.new("myChannel", "mem");          // In-memory
ow.ch.new("persistent", "mvs", {        // Persistent
  file: "data.db"
});
ow.ch.new("distributed", "big");        // Peer-to-peer

// Operations
ow.ch.set("myChannel", "key1", {data: "value"});
var value = ow.ch.get("myChannel", "key1");
var all = ow.ch.getAll("myChannel");
ow.ch.destroy("myChannel");
```

#### ow.ai - Artificial Intelligence

```javascript
ow.loadAI();

// LLM usage
var llm = ow.ai.gpt({
  type: "openai",
  key: "your-api-key",
  model: "gpt-3.5-turbo"
});

var response = llm.prompt("Explain quantum computing");

// With conversation
llm.addSystemPrompt("You are a helpful assistant");
llm.addUserPrompt("What is JavaScript?");
var answer = llm.prompt();

// Image analysis (if supported)
var description = llm.promptImage(
  "Describe this image",
  "/path/to/image.jpg",
  "high"
);

// Regression analysis
var data = [[0,1], [1,3], [2,5]];
var result = ow.ai.regression().linear(data);
log("Equation: " + result.string);
```

#### ow.sec - Security Utilities

```javascript
ow.loadSec();

// Open secure storage
ow.sec.openMainSBuckets("masterPassword");

// Store secret
$sec("repo", "bucket", "lockPass", "masterPass")
  .setSecret("bucket", "lockPass", "apiKey", {
    key: "abc123"
  });

// Retrieve secret
var secret = $sec("repo", "bucket", "lockPass", "masterPass")
  .getSecret("bucket", "lockPass", "apiKey");

// Close storage
ow.sec.closeMainSBuckets();
```

#### ow.server - Server Utilities

```javascript
ow.loadServer();

// HTTP server
var httpd = ow.server.httpd.start(8080);
ow.server.httpd.route(httpd, {
  "/api": function(req) {
    return httpd.replyOKJSON({status: "ok"});
  }
});

// Scheduler
var sch = new ow.server.scheduler();
sch.addEntry("*/5 * * * * *", () => {
  log("Every 5 seconds");
}, true);
```

#### ow.metrics - Metrics Collection

```javascript
ow.loadMetrics();

// Add custom metrics
ow.metrics.add("customMetric", () => ({
  value: Math.random() * 100
}));

// Start collection
ow.metrics.startCollecting();

// Get metrics
var all = ow.metrics.getAll();
var some = ow.metrics.getSome(["cpu", "mem", "customMetric"]);

// OpenMetrics format
var openMetrics = ow.metrics.fromObj2OpenMetrics(
  ow.metrics.getAll(),
  "myapp",
  new Date()
);
```

#### ow.template - Template Engine

```javascript
ow.loadTemplate();

// Execute template
var template = "Hello {{name}}!";
var result = ow.template.execTemplate(template, {name: "World"});

// Register custom helpers
ow.template.addHelpers("my", {
  upper: str => str.toUpperCase(),
  formatDate: date => ow.format.fromDate(date, "yyyy-MM-dd")
});

// Use custom helpers
var tmpl = "Welcome {{my_upper name}}";
var result = ow.template.execTemplate(tmpl, {name: "john"});
```

#### ow.test - Testing Framework

```javascript
ow.loadTest();

// Basic assertion
ow.test.assert(actual, expected, "Values should be equal");

// Test suite
function testUserValidation() {
  ow.test.assert(validateUser({name: "John"}), true, "Valid user");
  ow.test.assert(validateUser({name: ""}), false, "Empty name");
}

testUserValidation();
log("Tests passed: " + ow.test.getCountPass());
log("Tests failed: " + ow.test.getCountFail());
```

### File I/O Operations

```javascript
// Read files
var content = io.readFileString("/path/to/file.txt");
var jsonData = io.readFileJSON("/path/to/data.json");
var yamlData = io.readFileYAML("/path/to/config.yaml");
var bytes = io.readFileBytes("/path/to/binary");

// Write files
io.writeFileString("/path/to/file.txt", content);
io.writeFileJSON("/path/to/data.json", data);
io.writeFileYAML("/path/to/config.yaml", config);
io.writeFileBytes("/path/to/binary", bytes);

// File operations
io.cp("source.txt", "dest.txt");
io.mv("old.txt", "new.txt");
io.rm("file.txt");
io.mkdir("newdir");

// File info
var exists = io.fileExists("/path/to/file");
var info = io.fileInfo("/path/to/file");
var list = io.listFiles("/path/to/dir");
var files = io.listFilenames("/path/to/dir");
```

### Logging

```javascript
// Basic logging
log("Information message");
logWarn("Warning message");
logErr("Error message");

// Templated logging
var user = {name: "John", age: 30};
tlog("User {{name}} is {{age}} years old", user);
```

### HTTP Operations

```javascript
// Simple GET
var response = $rest().get("https://api.example.com/data");

// POST with data
var postData = {name: "John", email: "john@example.com"};
var response = $rest().post("https://api.example.com/users", postData);

// With headers
var response = $rest({
  headers: {
    "Authorization": "Bearer token123",
    "Content-Type": "application/json"
  }
}).get("https://api.example.com/secure");

// Error handling
try {
  var response = $rest().get("https://api.example.com/data");
  if (response.responseCode >= 400) {
    throw "HTTP Error: " + response.responseCode;
  }
  var data = JSON.parse(response.response);
} catch(e) {
  logErr("Request failed: " + e);
}
```

---

## oJob YAML Files

### Basic Structure

Every oJob YAML file follows this structure:

```yaml
# 1. Help section (optional but recommended)
help:
  text: "Description of what this oJob does"
  expects:
  - name: inputFile
    desc: "Path to input file"
    mandatory: true

# 2. Initialization (optional)
init:
  defaultTimeout: 30000
  batchSize: 100

# 3. oJob configuration (optional)
ojob:
  async: false
  logToConsole: true

# 4. Include other oJobs (optional)
include:
- common-jobs.yaml

# 5. Job definitions (required)
jobs:
- name: "My Job"
  exec: |
    log("Hello World")

# 6. Execution order (required)
todo:
- "My Job"
```

### Help Section

```yaml
help:
  text: "Detailed description of the oJob"
  expects:
  - name: inputFile
    desc: "Path to the input file to process"
    mandatory: true
    example: "/path/to/file.txt"

  - name: outputDir
    desc: "Directory where results will be saved"
    mandatory: false
    example: "/tmp/output"

  - name: mode
    desc: "Processing mode"
    moptions: ["fast", "thorough", "debug"]

  - name: password
    desc: "Authentication password"
    secret: true
```

### Initialization Section

```yaml
init:
  # Default values available as args.init.*
  database:
    host: "localhost"
    port: 5432
  apiEndpoint: "https://api.example.com"
  retryCount: 3
  timeout: 30000
```

### oJob Configuration

```yaml
ojob:
  # Execution control
  async: false                 # Execute jobs asynchronously
  sequential: true             # Force sequential execution
  numThreads: 4                # Number of threads
  daemon: false                # Run as daemon

  # Logging
  logToConsole: true           # Output to console
  logJobs: true                # Log job execution
  logArgs: false               # Log arguments
  log:
    format: json               # JSON logging format
    level: INFO

  # Dependencies
  opacks:
  - openaf: ">=20230601"
  - S3

  owraps:
  - Server
  - Format

  # Templates and arguments
  templateArgs: true           # Process {{}} in args
  argsFromEnvs: true           # Load env vars as args

  # Channels
  channels:
    create:
    - name: myChannel
      type: mvs
      options:
        file: data.db

  # Metrics
  metrics:
    passive: true
    port: 9100
    add:
      customMetric: |
        return { value: $get("counter") || 0 }

  # Security
  integrity:
    list:
    - "config.yaml": "sha256:abc123..."
    strict: false
    warn: true

  # Unique execution
  unique:
    pidFile: "myjob.pid"
    killPrevious: false
```

### Job Definitions

#### Basic Job Structure

```yaml
jobs:
- name: "Basic Job"
  exec: |
    log("Processing...")
    args.result = "success"
```

#### Job with Dependencies

```yaml
jobs:
- name: "Prerequisite Job"
  exec: |
    log("Setting up...")
    args.config = {ready: true}

- name: "Main Job"
  deps:
  - "Prerequisite Job"
  exec: |
    log("Config ready: " + args.config.ready)
```

#### Job with Input/Output Validation

```yaml
jobs:
- name: "Validated Job"
  check:
    in:
      inputFile: isString
      port: toNumber.isNumber.default(8080)
      enabled: toBoolean.default(false)
      config: isMap
      items: isArray.default([])
      level: isString.oneOf(['debug','info','warn','error']).default('info')
    out:
      result: isString.oneOf(['success','failure'])
      count: isNumber.default(0)
  exec: |
    log("Processing " + args.inputFile);
    args.result = "success";
    args.count = 42;
```

#### Job Types

**Periodic Job:**
```yaml
jobs:
- name: "Scheduled Task"
  type: periodic
  typeArgs:
    cron: "0 */5 * * * *"     # Every 5 minutes
    waitForFinish: true
  exec: |
    log("Running scheduled task at " + new Date())
```

**Shutdown Job:**
```yaml
jobs:
- name: "Cleanup"
  type: shutdown
  exec: |
    log("Cleaning up before shutdown...")
```

**Subscribe Job:**
```yaml
jobs:
- name: "Channel Monitor"
  type: subscribe
  typeArgs:
    chSubscribe: "dataChannel"
  exec: |
    log("Channel: " + ch + ", Operation: " + op);
    log("Value: " + stringify(v));
```

#### Multi-Language Jobs

```yaml
jobs:
# JavaScript (default)
- name: "JS Job"
  exec: |
    log("JavaScript execution");

# Python
- name: "Python Job"
  lang: python
  exec: | #python
    import json
    print("Python is running")
    args['result'] = 'success'

# Shell
- name: "Shell Job"
  lang: shell
  exec: | #shell
    echo "Shell command"
    export RESULT="done"
    echo '{"status": "ok"}'

# SSH (remote execution)
- name: "Remote Job"
  lang: ssh
  typeArgs:
    shell: "/bin/bash"
  exec: | #shell
    hostname
    uptime
```

#### Job with Error Handling

```yaml
jobs:
- name: "Error Prone Job"
  catch: |
    logErr("Job failed: " + exception);
    return true;  # Error handled
  exec: |
    if (Math.random() > 0.5) {
      throw "Random failure";
    }
```

#### Job with Timeout and Locks

```yaml
jobs:
- name: "Controlled Job"
  typeArgs:
    timeout: 30000           # Max 30 seconds
    lock: "myLock"           # Mutual exclusion
    stopWhen: |
      return args.shouldStop == true
  exec: |
    // Job code here
```

#### Job Inheritance (from/to)

```yaml
jobs:
- name: "Base Job"
  exec: |
    log("Base functionality");

- name: "Extended Job"
  from:
  - "Base Job"             # Execute before
  to:
  - "Cleanup Job"          # Execute after
  exec: |
    log("Main functionality");
```

#### Job with Each (Parallel Processing)

```yaml
jobs:
- name: "Process Files"
  each:
  - "Process Single File"
  exec: |
    var files = io.listFiles("data/").files;
    files.forEach(file => {
      each(file);  # Parallel execution
    });

- name: "Process Single File"
  exec: |
    log("Processing: " + args.filename);
```

#### Job with Default Arguments

```yaml
jobs:
- name: "Job with Defaults"
  args:
    host: "${serverHost:-localhost}"
    port: "${serverPort:-8080}"
    env: "${environment:-development}"
    dbHost: "${config.database.host:-localhost}"
  exec: |
    log("Connecting to: " + args.host + ":" + args.port);
```

### Todo Section (Execution Order)

#### Simple Todo

```yaml
todo:
- "Job 1"
- "Job 2"
- name: "Job 3"
  args:
    customParam: "value"
```

#### Conditional Execution

```yaml
todo:
- name: "Conditional Job"
  when: "production"
  args:
    env: "prod"
```

#### Multiple Arguments (Parallel Execution)

```yaml
todo:
- name: "Process Multiple"
  args:
  - input: "file1.txt"
    output: "result1.txt"
  - input: "file2.txt"
    output: "result2.txt"
```

#### Todo with Default Arguments

```yaml
todo:
- name: "Database Job"
  args:
    dbHost: "${DB_HOST:-localhost}"
    dbPort: "${DB_PORT:-5432}"
    timeout: "${TIMEOUT:-30000}"
```

### Built-in Jobs and Shortcuts

OpenAF includes many built-in jobs accessible through shortcuts:

```yaml
todo:
# Conditional execution
- (if): "args.env == 'prod'"
  ((then)):
  - "Production Job"
  ((else)):
  - "Development Job"

# Parallel execution
- (parallel):
  - "Job A"
  - "Job B"
  - "Job C"

# Set/Get values
- (set): myKey
  value: "some value"

- (get): myKey

# File operations
- (fileget): "config.json"
  ((out)): config

# Output
- (output): results
  ((format)): "json"

# Template processing
- (template): "Hello {{name}}!"
  ((data)): {name: "World"}

# Logging
- (log): "Processing started"
  ((level)): "INFO"

# Wait/delay
- (wait): 5000  # 5 seconds

# Run external oJob
- (runfile): "external.yaml"
  ((args)): {param: "value"}

# Repeat operations
- (repeat): 3
  ((todo)):
  - "Repeated Job"

# Query data
- (query): "[?status=='active']"
  ((from)): "data"
  ((to)): "activeItems"

# LLM integration
- (llm): "Summarize this data"
  ((inKey)): "salesData"
  ((context)): "monthly sales figures"
  ((outPath)): "summary"

# Security
- (secget): "apiKey"
  ((secRepo)): "main"
  ((secBucket)): "prod"

# Channel operations
- (ch): "myChannel"
  ((op)): "set"
  ((k)): {id: 1}
  ((v)): {name: "John"}
```

---

## Common Patterns and Best Practices

### Pattern 1: Parameter Validation

**JavaScript:**
```javascript
// Validate all inputs
_$(args.inputFile, "inputFile").isString().$_();
_$(args.port, "port").isNumber().between(1024, 65535).default(8080);
_$(args.enabled, "enabled").isBoolean().default(false);

// Continue with validated parameters
processFile(args.inputFile, args.port);
```

**oJob:**
```yaml
jobs:
- name: "My Job"
  check:
    in:
      inputFile: isString
      port: toNumber.isNumber.between(1024,65535).default(8080)
      enabled: toBoolean.default(false)
  exec: |
    # Parameters are validated and converted
```

### Pattern 2: Error Handling

**JavaScript:**
```javascript
try {
  var result = riskyOperation();
  log("Success: " + stringify(result));
} catch(e) {
  logErr("Operation failed: " + e);
  // Handle or rethrow
  throw e;
}
```

**oJob:**
```yaml
jobs:
- name: "Safe Job"
  catch: |
    logErr("Error: " + exception);
    return true;  # Handled
  exec: |
    riskyOperation();
```

### Pattern 3: File Processing Pipeline

**JavaScript:**
```javascript
// Read files
var files = io.listFiles("input/").files;

// Process each file
files.forEach(file => {
  try {
    var data = io.readFileJSON(file.filepath);
    var processed = transformData(data);
    io.writeFileJSON("output/" + file.filename, processed);
    log("Processed: " + file.filename);
  } catch(e) {
    logErr("Failed: " + file.filename + " - " + e);
  }
});
```

**oJob:**
```yaml
jobs:
- name: "Process Files"
  each:
  - "Process Single File"
  exec: |
    var files = io.listFiles("input/").files;
    files.forEach(file => each(file));

- name: "Process Single File"
  exec: |
    try {
      var data = io.readFileJSON(args.filepath);
      var processed = transformData(data);
      io.writeFileJSON("output/" + args.filename, processed);
    } catch(e) {
      logErr("Failed: " + args.filename);
    }
```

### Pattern 4: REST API Integration

**JavaScript:**
```javascript
ow.loadObj();

function callAPI(endpoint, data) {
  try {
    var response = ow.obj.rest.jsonPost(
      "https://api.example.com" + endpoint,
      data
    );
    return response;
  } catch(e) {
    logErr("API call failed: " + e);
    throw e;
  }
}

var result = callAPI("/users", {name: "John"});
```

**oJob:**
```yaml
jobs:
- name: "Call API"
  check:
    in:
      endpoint: isString
      data: isMap
    out:
      response: isMap
  exec: |
    ow.loadObj();
    try {
      args.response = ow.obj.rest.jsonPost(
        "https://api.example.com" + args.endpoint,
        args.data
      );
    } catch(e) {
      logErr("API failed: " + e);
      throw e;
    }

todo:
- name: "Call API"
  args:
    endpoint: "/users"
    data: {name: "John"}
```

### Pattern 5: Database Operations

**JavaScript:**
```javascript
// Connect to database
var db = new DB("jdbc:postgresql://localhost:5432/mydb", "user", "pass");

try {
  // Execute query
  var results = db.q("SELECT * FROM users WHERE active = ?", [true]);

  // Process results
  results.results.forEach(user => {
    log("User: " + user.NAME);
  });

} finally {
  db.close();
}
```

**oJob:**
```yaml
init:
  db:
    url: "jdbc:postgresql://localhost:5432/mydb"
    user: "dbuser"
    pass: "dbpass"

jobs:
- name: "Query Database"
  exec: |
    var db = new DB(
      args.init.db.url,
      args.init.db.user,
      args.init.db.pass
    );

    try {
      var results = db.q(
        "SELECT * FROM users WHERE active = ?",
        [true]
      );
      args.users = results.results;
    } finally {
      db.close();
    }

- name: "Process Users"
  deps:
  - "Query Database"
  exec: |
    args.users.forEach(user => {
      log("User: " + user.NAME);
    });
```

### Pattern 6: Channel-based Communication

**JavaScript:**
```javascript
// Create channel
$ch("events").create();

// Producer
$ch("events").set(
  {id: Date.now()},
  {type: "user.login", user: "john"}
);

// Consumer (subscribe)
$ch("events").subscribe((ch, op, key, value) => {
  if (value.type === "user.login") {
    log("User logged in: " + value.user);
  }
});
```

**oJob:**
```yaml
ojob:
  channels:
    create:
    - name: events
      type: mem

jobs:
- name: "Producer"
  exec: |
    $ch("events").set(
      {id: now()},
      {type: "user.login", user: "john"}
    );

- name: "Consumer"
  type: subscribe
  typeArgs:
    chSubscribe: "events"
  exec: |
    if (v.type === "user.login") {
      log("User logged in: " + v.user);
    }
```

### Pattern 7: Metrics and Monitoring

**JavaScript:**
```javascript
ow.loadMetrics();

// Add custom metric
ow.metrics.add("processedItems", () => ({
  value: global.processedCount || 0,
  timestamp: now()
}));

// Start collecting
ow.metrics.startCollecting();

// Update metric
global.processedCount = (global.processedCount || 0) + 1;

// Get metrics
var metrics = ow.metrics.getAll();
log("Memory: " + metrics.mem.value);
```

**oJob:**
```yaml
ojob:
  metrics:
    passive: true
    port: 9100
    add:
      processedItems: |
        return {
          value: $get("processedCount") || 0,
          timestamp: now()
        }

jobs:
- name: "Process Item"
  exec: |
    # Do processing
    var count = $get("processedCount") || 0;
    $set("processedCount", count + 1);
```

### Pattern 8: Scheduled Tasks

**oJob:**
```yaml
ojob:
  daemon: true

jobs:
- name: "Hourly Task"
  type: periodic
  typeArgs:
    cron: "0 0 * * * *"  # Every hour
    waitForFinish: true
    cronCheck:
      active: true
      retries: 3
      retryWait: 5000
  exec: |
    log("Running hourly task");
    performMaintenance();

- name: "Cleanup"
  type: periodic
  typeArgs:
    cron: "0 0 2 * * *"  # Daily at 2 AM
  exec: |
    log("Running daily cleanup");
    cleanupOldFiles();
```

### Pattern 9: Parallel Processing with Batching

**oJob:**
```yaml
init:
  batchSize: 50

jobs:
- name: "Process in Batches"
  each:
  - "Process Batch"
  exec: |
    var items = getAllItems();
    var batches = [];

    for (var i = 0; i < items.length; i += args.init.batchSize) {
      batches.push(items.slice(i, i + args.init.batchSize));
    }

    batches.forEach((batch, idx) => {
      each({batch: batch, index: idx});
    });

- name: "Process Batch"
  typeArgs:
    lock: "write"
  exec: |
    log("Processing batch " + args.index);
    args.batch.forEach(item => {
      processItem(item);
    });
```

### Pattern 10: Configuration Management

**oJob:**
```yaml
help:
  text: "Application with environment-based configuration"
  expects:
  - name: env
    desc: "Environment (dev/staging/prod)"
    moptions: ["dev", "staging", "prod"]

init:
  dev:
    apiUrl: "http://localhost:3000"
    dbHost: "localhost"
  staging:
    apiUrl: "https://staging-api.example.com"
    dbHost: "staging-db.example.com"
  prod:
    apiUrl: "https://api.example.com"
    dbHost: "prod-db.example.com"

jobs:
- name: "Load Config"
  exec: |
    var env = args.env || "dev";
    args.config = args.init[env];
    log("Using " + env + " configuration");

- name: "Connect"
  deps:
  - "Load Config"
  exec: |
    log("Connecting to: " + args.config.apiUrl);
    # Use args.config.*
```

---

## Complete Examples

### Example 1: Simple Data Processing Script (JavaScript)

```javascript
// data-processor.js
// Process JSON data files and generate summary

// Load required libraries
ow.loadFormat();

// Validate arguments
_$(args.inputDir, "inputDir").isString().$_("Input directory required");
_$(args.outputFile, "outputFile").isString().$_("Output file required");

// Initialize counters
var totalRecords = 0;
var processedFiles = 0;
var errors = [];

// Get all JSON files
var files = io.listFilenames(args.inputDir)
  .filter(f => f.endsWith('.json'));

log("Found " + files.length + " files to process");

// Process each file
files.forEach(file => {
  try {
    var filepath = args.inputDir + "/" + file;
    var data = io.readFileJSON(filepath);

    if (isArray(data)) {
      totalRecords += data.length;
    } else {
      totalRecords += 1;
    }

    processedFiles++;
    log("Processed: " + file);

  } catch(e) {
    logErr("Error processing " + file + ": " + e);
    errors.push({file: file, error: String(e)});
  }
});

// Generate summary
var summary = {
  timestamp: new Date(),
  filesProcessed: processedFiles,
  totalFiles: files.length,
  totalRecords: totalRecords,
  errors: errors
};

// Write output
io.writeFileJSON(args.outputFile, summary);

log("Summary written to: " + args.outputFile);
log("Files processed: " + processedFiles + "/" + files.length);
log("Total records: " + totalRecords);
```

### Example 2: Data Processing Pipeline (oJob)

```yaml
# data-pipeline.yaml
# Complete data processing pipeline with validation and error handling

help:
  text: "Process data files and generate reports"
  expects:
  - name: inputDir
    desc: "Directory containing input files"
    mandatory: true
  - name: outputDir
    desc: "Directory for output files"
    mandatory: true
  - name: format
    desc: "Output format (json/csv)"
    moptions: ["json", "csv"]

init:
  batchSize: 100
  maxErrors: 10

ojob:
  async: false
  logToConsole: true
  metrics:
    passive: true
    port: 9100

jobs:
- name: "Validate Inputs"
  check:
    in:
      inputDir: isString
      outputDir: isString
      format: isString.oneOf(['json','csv']).default('json')
  exec: |
    # Check directories exist
    if (!io.fileExists(args.inputDir)) {
      throw "Input directory does not exist: " + args.inputDir;
    }

    # Create output directory if needed
    io.mkdir(args.outputDir);

    log("Validation passed");

- name: "Load Files"
  deps:
  - "Validate Inputs"
  exec: |
    # Get all JSON files
    args.files = io.listFilenames(args.inputDir)
      .filter(f => f.endsWith('.json'));

    log("Found " + args.files.length + " files");

    # Initialize counters
    $set("processedCount", 0);
    $set("errorCount", 0);
    $set("results", []);

- name: "Process Files"
  deps:
  - "Load Files"
  each:
  - "Process Single File"
  exec: |
    args.files.forEach(file => {
      each({
        filename: file,
        inputDir: args.inputDir,
        format: args.format
      });
    });

- name: "Process Single File"
  catch: |
    logErr("Error processing file: " + exception);
    var count = $get("errorCount") || 0;
    $set("errorCount", count + 1);
    return true;  # Continue processing
  exec: |
    var filepath = args.inputDir + "/" + args.filename;

    # Read and validate
    var data = io.readFileJSON(filepath);
    _$(data, "data").isArray().$_();

    # Transform data
    var processed = data.map(item => ({
      id: item.id,
      value: item.value * 2,
      timestamp: new Date()
    }));

    # Store results
    var results = $get("results") || [];
    results = results.concat(processed);
    $set("results", results);

    # Update counter
    var count = $get("processedCount") || 0;
    $set("processedCount", count + 1);

    log("Processed: " + args.filename);

- name: "Generate Report"
  deps:
  - "Process Files"
  exec: |
    var results = $get("results") || [];
    var processed = $get("processedCount") || 0;
    var errors = $get("errorCount") || 0;

    var report = {
      timestamp: new Date(),
      filesProcessed: processed,
      totalFiles: args.files.length,
      totalRecords: results.length,
      errors: errors,
      data: results
    };

    # Write output
    var outputFile = args.outputDir + "/report." + args.format;

    if (args.format === "json") {
      io.writeFileJSON(outputFile, report);
    } else {
      # Convert to CSV
      var csv = $csv()
        .fromArray2d(results)
        .toString();
      io.writeFileString(outputFile, csv);
    }

    log("Report written: " + outputFile);
    log("Processed: " + processed + "/" + args.files.length);
    log("Errors: " + errors);

todo:
- "Validate Inputs"
- "Load Files"
- "Process Files"
- "Generate Report"
```

### Example 3: REST API Service (oJob)

```yaml
# api-service.yaml
# RESTful API service with metrics and health checks

help:
  text: "Start REST API service"
  expects:
  - name: port
    desc: "Port to listen on"
    example: "8080"

init:
  port: 8080

ojob:
  daemon: true
  channels:
    create:
    - name: requests
      type: mem
  metrics:
    passive: true
    port: 9100
    add:
      requestCount: |
        return { value: $ch("requests").size() }

include:
- oJob-common::oJobHTTPd.yaml

jobs:
- name: "Start API Server"
  from:
  - "HTTP Start Server"
  - "HTTP Healthz"
  - "HTTP Metrics"
  exec: |
    log("API Server starting on port " + args.init.port);

- name: "API - Get Users"
  deps:
  - "Start API Server"
  to:
  - "HTTP Apply Service"
  args:
    port: 8080
    uri: "/api/users"
    execURI: |
      # Log request
      $ch("requests").set(
        {id: now()},
        {method: request.method, uri: request.uri}
      );

      # Get users from database
      var users = [
        {id: 1, name: "John"},
        {id: 2, name: "Jane"}
      ];

      return server.replyOKJSON(users);

- name: "API - Create User"
  deps:
  - "Start API Server"
  to:
  - "HTTP Apply Service"
  args:
    port: 8080
    uri: "/api/users/create"
    execURI: |
      if (request.method !== "POST") {
        return server.reply("Method not allowed", 405, {}, {});
      }

      var data = JSON.parse(request.data);
      _$(data.name, "name").isString().$_();

      # Create user
      var newUser = {
        id: now(),
        name: data.name,
        created: new Date()
      };

      log("Created user: " + data.name);

      return server.replyOKJSON(newUser);

todo:
- "Start API Server"
- "API - Get Users"
- "API - Create User"
```

### Example 4: Scheduled ETL Pipeline (oJob)

```yaml
# etl-pipeline.yaml
# Scheduled ETL pipeline with error recovery

help:
  text: "ETL pipeline for data synchronization"

init:
  sourceDB:
    url: "jdbc:postgresql://source-db:5432/mydb"
    user: "etl_user"
    pass: "etl_pass"
  targetDB:
    url: "jdbc:postgresql://target-db:5432/warehouse"
    user: "warehouse_user"
    pass: "warehouse_pass"
  batchSize: 1000

ojob:
  daemon: true
  logToFile:
    logFolder: "/var/log/etl"
  metrics:
    passive: true
    port: 9100

jobs:
- name: "ETL Extract"
  type: periodic
  typeArgs:
    cron: "0 0 * * * *"  # Every hour
    waitForFinish: true
    cronCheck:
      active: true
      retries: 3
      retryWait: 10000
  exec: |
    log("Starting extraction...");

    var db = new DB(
      args.init.sourceDB.url,
      args.init.sourceDB.user,
      args.init.sourceDB.pass
    );

    try {
      var results = db.q(
        "SELECT * FROM transactions WHERE processed = false LIMIT ?",
        [args.init.batchSize]
      );

      $set("extractedData", results.results);
      log("Extracted " + results.results.length + " records");

    } finally {
      db.close();
    }

- name: "ETL Transform"
  deps:
  - "ETL Extract"
  exec: |
    var data = $get("extractedData") || [];

    # Transform data
    var transformed = data.map(record => ({
      id: record.ID,
      amount: record.AMOUNT,
      currency: record.CURRENCY || "USD",
      date: new Date(record.DATE),
      processed_at: new Date()
    }));

    $set("transformedData", transformed);
    log("Transformed " + transformed.length + " records");

- name: "ETL Load"
  deps:
  - "ETL Transform"
  exec: |
    var data = $get("transformedData") || [];

    if (data.length === 0) {
      log("No data to load");
      return;
    }

    var db = new DB(
      args.init.targetDB.url,
      args.init.targetDB.user,
      args.init.targetDB.pass
    );

    try {
      # Begin transaction
      db.begin();

      # Insert records
      data.forEach(record => {
        db.u(
          "INSERT INTO transactions (id, amount, currency, date, processed_at) VALUES (?, ?, ?, ?, ?)",
          [record.id, record.amount, record.currency, record.date, record.processed_at]
        );
      });

      # Commit transaction
      db.commit();
      log("Loaded " + data.length + " records");

    } catch(e) {
      db.rollback();
      logErr("Load failed: " + e);
      throw e;
    } finally {
      db.close();
    }

- name: "ETL Cleanup"
  deps:
  - "ETL Load"
  exec: |
    log("ETL cycle completed successfully");

    # Clear temporary data
    $unset("extractedData");
    $unset("transformedData");

todo:
- "ETL Extract"
- "ETL Transform"
- "ETL Load"
- "ETL Cleanup"
```

### Example 5: LLM-Powered Data Analysis (oJob)

```yaml
# ai-analysis.yaml
# Use LLM to analyze data and generate insights

help:
  text: "AI-powered data analysis"
  expects:
  - name: dataFile
    desc: "JSON file with data to analyze"
    mandatory: true
  - name: outputFile
    desc: "Output file for analysis results"
    mandatory: true

ojob:
  argsFromEnvs: true  # Get OPENAI_API_KEY from environment

jobs:
- name: "Load Data"
  check:
    in:
      dataFile: isString
      outputFile: isString
  exec: |
    # Load data
    args.data = io.readFileJSON(args.dataFile);
    log("Loaded data with " + args.data.length + " records");

- name: "Analyze with AI"
  deps:
  - "Load Data"
  exec: |
    ow.loadAI();

    # Initialize LLM
    var llm = ow.ai.gpt({
      type: "openai",
      key: args.openai_api_key,
      model: "gpt-3.5-turbo"
    });

    # Add system prompt
    llm.addSystemPrompt(
      "You are a data analyst. Analyze the provided data and generate insights."
    );

    # Prepare data summary
    var summary = {
      recordCount: args.data.length,
      fields: Object.keys(args.data[0] || {}),
      sample: args.data.slice(0, 3)
    };

    # Ask for analysis
    llm.addUserPrompt(
      "Analyze this data and provide 5 key insights:\n\n" +
      JSON.stringify(summary, null, 2)
    );

    # Get response
    var analysis = llm.prompt();
    args.analysis = analysis;

    log("Analysis complete");

- name: "Generate Report"
  deps:
  - "Analyze with AI"
  exec: |
    var report = {
      timestamp: new Date(),
      dataFile: args.dataFile,
      recordCount: args.data.length,
      analysis: args.analysis
    };

    # Write report
    io.writeFileJSON(args.outputFile, report);

    log("Report written to: " + args.outputFile);
    print("\n--- AI Analysis ---\n");
    print(args.analysis);
    print("\n-------------------\n");

todo:
- "Load Data"
- "Analyze with AI"
- "Generate Report"
```

---

## Quick Reference

### Common Validation Patterns

```javascript
// JavaScript
_$(arg, "name").isString().$_();
_$(arg, "name").isNumber().between(0, 100).default(50);
_$(arg, "name").isBoolean().default(false);
_$(arg, "name").isArray().minLength(1);
_$(arg, "name").isMap().hasKeys(['a', 'b']);
_$(arg, "name").isString().oneOf(['a', 'b', 'c']);
```

```yaml
# oJob
check:
  in:
    arg: isString
    arg: toNumber.isNumber.between(0,100).default(50)
    arg: toBoolean.default(false)
    arg: isArray.minLength(1)
    arg: isMap.hasKeys(['a','b'])
    arg: isString.oneOf(['a','b','c'])
```

### Common oJob Shortcuts

```yaml
# Conditional
- (if): "condition"
  ((then)): [jobs]
  ((else)): [jobs]

# Parallel
- (parallel): [job1, job2, job3]

# Data operations
- (get): key
- (set): key
  value: data
- (fileget): "file.json"
  ((out)): varName

# Output
- (output): varName
  ((format)): "json"
- (log): "message"

# Control
- (wait): milliseconds
- (repeat): count
  ((todo)): [jobs]

# External
- (runfile): "other.yaml"
  ((args)): {key: value}

# LLM
- (llm): "prompt"
  ((context)): "context"
  ((inKey)): inputKey
  ((outPath)): outputPath
```

### File Operations

```javascript
// Read
io.readFileString(path)
io.readFileJSON(path)
io.readFileYAML(path)
io.readFileBytes(path)

// Write
io.writeFileString(path, content, encoding, append)
io.writeFileJSON(path, data)
io.writeFileYAML(path, data)
io.writeFileBytes(path, bytes)

// Operations
io.cp(source, target)
io.mv(source, target)
io.rm(path)
io.mkdir(path)
io.fileExists(path)
io.fileInfo(path)
io.listFiles(path)
io.listFilenames(path)
```

### HTTP/REST Operations

```javascript
// GET
var response = $rest().get(url);
var data = ow.obj.rest.jsonGet(url);

// POST
var response = $rest().post(url, data);
var data = ow.obj.rest.jsonPost(url, postData);

// With options
$rest({
  timeout: 30000,
  headers: {"Authorization": "Bearer token"}
}).get(url);
```

### Channel Operations

```javascript
// Create
$ch("name").create();
ow.ch.new("name", "mem");

// Operations
$ch("name").set(key, value);
$ch("name").get(key);
$ch("name").getAll();
$ch("name").size();
$ch("name").destroy();

// Subscribe
$ch("name").subscribe((ch, op, k, v) => {
  log("Event: " + op);
});
```

### Async Operations

```javascript
// Execute async
$do(() => { return result; })
  .then(r => log(r))
  .catch(e => logErr(e));

// Parallel execution
$doAll([task1, task2, task3])
  .then(results => process(results));

// First to complete
$doFirst([task1, task2, task3])
  .then(fastest => log(fastest));
```

### Logging

```javascript
log("message");           // Info
logWarn("message");       // Warning
logErr("message");        // Error
tlog("{{msg}}", {msg: "Hello"});  // Templated
```

---

## Summary for LLMs

When generating OpenAF code:

1. **JavaScript Files (.js)**:
   - Use standard JavaScript syntax
   - Validate inputs with `_$()`
   - Load required libraries with `ow.load*()`
   - Use OpenAF helper functions ($$, $from, $path, $ch, etc.)
   - Handle errors with try/catch
   - Log operations with log(), logErr(), logWarn()

2. **oJob Files (.yaml)**:
   - Start with help section
   - Define init for defaults
   - Configure ojob section as needed
   - Define jobs with name and exec
   - Use check for validation
   - Specify execution order in todo
   - Use built-in shortcuts when possible

3. **Best Practices**:
   - Always validate inputs
   - Handle errors gracefully
   - Use appropriate data types
   - Log important operations
   - Use channels for shared state
   - Leverage built-in jobs/functions
   - Follow OpenAF naming conventions

4. **Common Mistakes to Avoid**:
   - Missing `$_()` after validation chains
   - Forgetting to load required libraries
   - Not handling async operations correctly
   - Missing error handling
   - Incorrect YAML indentation
   - Using undefined variables

---

**Document End**
