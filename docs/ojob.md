# oJob YAML Reference Guide

oJob is OpenAF's job orchestration framework that allows you to define, schedule, and execute jobs using YAML configuration files. This comprehensive guide covers all aspects of creating and using oJob YAML files.

## Table of Contents

1. [Basic Structure](#basic-structure)
2. [Help Section](#help-section)
3. [Initialization](#initialization)
4. [oJob Configuration](#ojob-configuration)
5. [Todo List](#todo-list)
6. [Including Other oJobs](#including-other-ojobs)
7. [Job Definitions](#job-definitions)
8. [Code Separation](#code-separation)
9. [Advanced Features](#advanced-features)
10. [Built-in Jobs](#built-in-jobs)
11. [Examples](#examples)

## Basic Structure

An oJob YAML file consists of several main sections:

```yaml
# Optional: Help information
help:
  text: "Description of what this oJob does"
  expects:
  - name: arg1
    desc: "Description of argument 1"

# Optional: Initialization values
init:
  someValue: "default value"

# Optional: oJob configuration
ojob:
  daemon: false
  logToConsole: true

# Optional: Include other oJob files
include:
- another-ojob.yaml

# Required: Job definitions
jobs:
- name: "My First Job"
  exec: |
    print("Hello World!")

# Required: Execution order
todo:
- "My First Job"
```

## Help Section

The help section provides documentation for humans about what the oJob does and which arguments it expects.

```yaml
help:
  text: "Detailed description of the oJob functionality"
  expects:
  - name: inputFile
    desc: "Path to the input file to process"
    mandatory: true
    example: "/path/to/file.txt"
  - name: outputDir
    desc: "Directory where results will be saved"
    mandatory: false
    example: "/tmp/output"
  - name: verbose
    desc: "Enable verbose logging"
    options: ["true", "false"]
  - name: mode
    desc: "Processing mode"
    moptions: ["fast", "thorough", "debug"]
  - name: password
    desc: "Authentication password"
    secret: true
```

### Help Properties

- `text`: Main description of the oJob
- `expects`: Array of expected arguments
  - `name`: Argument name
  - `desc`: Description of the argument
  - `mandatory`: Whether the argument is required
  - `example`: Example value
  - `options`: Array of valid values (single choice)
  - `moptions`: Array of valid values (multiple choice)
  - `secret`: Whether the argument should be hidden when prompted

## Initialization

The `init` section provides default values that are available to all jobs as `args.init`.

```yaml
init:
  database:
    host: "localhost"
    port: 5432
  apiEndpoint: "https://api.example.com"
  retryCount: 3
  timeout: 30000
```

## oJob Configuration

The `ojob` section controls how the oJob executes and behaves.

### Execution Control

```yaml
ojob:
  # Thread management
  numThreads: 4                # Force specific number of threads
  poolThreadFactor: 2          # Multiply cores by this factor
  
  # Execution behavior
  async: false                 # Execute jobs async instead of sequential
  sequential: true             # Force sequential execution
  shareArgs: false             # Share argument changes between jobs
  daemon: false                # Keep running as daemon
  timeInterval: 50             # Daemon check interval in ms
  
  # Dependencies
  depsWait: false              # Wait for dependencies even if others fail
  depsTimeout: 300000          # Max time to wait for dependencies (ms)
  depsOnFail: |                # Code to execute when dependency fails
    logErr("Dependency failed: " + job.name)
  
  # Templates and arguments
  templateArgs: true           # Process {{}} handlebars in args
  argsFromEnvs: true           # Load environment variables as args
  initTemplateEscape: false    # Escape {{ in init values
  
  # Timing
  cronInLocalTime: false       # Use local time for cron expressions
```

### Logging Configuration

```yaml
ojob:
  # Console logging
  logToConsole: true           # Output job messages to stderr
  logOJob: false               # Use OpenAF logging for jobs
  logJobs: true                # Log job execution
  logArgs: false               # Log arguments before each job
  logLimit: 3                  # Number of executions to keep in log
  logHistory: 10               # Factor of job logs to keep
  ignoreNoLog: false           # Ignore job-level nolog settings
  
  # Console appearance
  conAnsi: true                # Enable ANSI terminal detection
  conWidth: 128                # Force console width
  
  # File logging
  logToFile:
    logFolder: "/var/log"
    HKhowLongAgoInMinutes: 2880
  
  # Structured logging
  log:
    format: json               # Use JSON format
    level: INFO
```

### External Dependencies

```yaml
ojob:
  # Include built-in oJob definitions
  includeOJob: true
  
  # OpenAF Packages
  opacks:
  - openaf: ">=20230601"     # Minimum version
  - S3: ">=20230401"
  - oJob-common              # Latest version
  
  # OpenWrap libraries
  owraps:
  - Server
  - Java
  
  # JavaScript libraries
  loads:
  - anotherJS.js
  loadLibs:
  - utils.js
```

### Process Control

```yaml
ojob:
  # Unique execution
  unique:
    pidFile: "myjob.pid"       # PID file for uniqueness
    killPrevious: false        # Kill previous instance
  
  # Error handling
  catch: |                     # Global error handler
    logErr("Global error: " + exception)
  
  # Stall detection
  checkStall:
    everySeconds: 60           # Check interval
    killAfterSeconds: 120      # Kill after this time
    checkFunc: |               # Custom stall check function
      return false // Add your logic here
```

### Channel Management

```yaml
ojob:
  channels:
    recordLog: false           # Record OpenAF logs
    
    # Create channels
    create:
    - name: myChannel
      type: mvs
      options:
        file: data.db
    
    # Expose channels via HTTP
    expose: true
    port: 8080
    host: "0.0.0.0"
    
    # Authentication
    auth:
    - login: user1
      pass: pass1
      permissions: "rw"
    
    # Peer connections
    peers:
    - "https://peer.example.com:8080/chs/myChannel"
    
    # Clustering
    clusters:
    - name: mainCluster
      checkPeriod: 2500
      host: "localhost"
      port: 8080
```

### Metrics and Monitoring

```yaml
ojob:
  metrics:
    # Passive metrics (expose endpoint)
    passive: true
    port: 8080
    uri: "/metrics"
    openMetrics: true
    openMetricsPrefix: "ojob"
    
    # Active metrics (push to external systems)
    active:
      openmetrics:
        url: "http://pushgateway:9091/metrics/job/test"
        prefix: "myapp"
        metrics: ["custom-metric", "mem"]
      
      nattrmon:
        url: "http://user:pass@nattrmon:7777/remote"
        attrPrefix: "oJob/"
        metrics: ["custom-metric", "mem"]
      
      periodInMs: 5000
    
    # Collect metrics to channel
    collect:
      ch: metricsChannel
      period: 5000
      some: ["mem", "cpu"]
    
    # Custom metrics
    add:
      custom-metric: |
        return { value: Math.random() * 100 }
```

### Language Support

```yaml
ojob:
  langs:
  - lang: mylang
    shell: "mylang -"
    pre: "var args = JSON.parse('{{args}}');\n"
    pos: "\nconsole.log(JSON.stringify(args));\n"
    returnRE: "\\s*#\\s+return (.+)[\\s\\n]*$"
    returnFn: |
      return "console.log(JSON.stringify({" + _args + "}));"
```

### Security and Integrity

```yaml
ojob:
  # File integrity checking
  integrity:
    list:
    - "external-ojob.yaml": "sha256:abc123..."
    - "https://remote.com/ojob": "md5:def456..."
    strict: false              # Reject if integrity fails
    warn: true                 # Log warnings for integrity failures
  
  # Debugging
  debug: true                  # Enable debug mode for jobs
```

## Todo List

The `todo` section defines what jobs to execute and in what order.

### Simple Todo

```yaml
todo:
- "Job 1"                    # Execute by name
- "Job 2"
- name: "Job 3"              # Execute with custom args
  args:
    customParam: "value"
```

### Conditional Execution

```yaml
todo:
- name: "Conditional Job"
  when: "production"         # Only run when state is "production"
  args:
    env: "prod"
```

### Multiple Arguments

```yaml
todo:
- name: "Parallel Execution Job"
  args:
  - input: "file1.txt"     # First execution
    output: "result1.txt"
  - input: "file2.txt"     # Second execution (parallel)
    output: "result2.txt"
```

### Built-in Shortcuts

oJob provides many built-in shortcuts for common operations:

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
  
# Set values
- (set): myKey
    value: "some value"
  
# Get values
- (get): myKey
  
# File operations
- (fileget): "config.json"
  ((out)): config
  
# Channel operations
- (ch): "myChannel"
  ((op)): "set"
  ((k)): { id: 1 }
  ((v)): { name: "test" }
  
# Output formatting
- (output): results
  ((format)): "json"
  
# Template processing
- (template): "Hello {{name}}!"
  ((data)): { name: "World" }
  
# Ask for input
- (ask): "Please enter your name"
    
# Wait/delay
- (wait): 5000               # Wait 5 seconds
  
# Logging
- (log): "Processing started"
  ((level)): "INFO"
  
# Run external oJob
- (runfile): "external.yaml"
  ((args)): { param: "value" }
  
# Repeat operations
- (repeat): 3
  ((todo)):
  - "Repeated Job"
  
# Each loop
- (each): "items"
  ((todo)):
  - "Process Item"
  
# Query data
- (query): "[?status=='active']"
  ((from)): "data"
  ((to)): "activeItems"
  
# State management
- (state): "processing"
- (stateOn): "processing"
  ((default)): "Continue Processing"
  
# Debug
- (debug):                   # Pause for debugging
  
# Conversion
- (convert): "inputData"
  ((outFormat)): "yaml"
  ((outKey)): "yamlData"
```

## Including Other oJobs

### Include Complete oJobs

```yaml
include:
- "common-jobs.yaml"         # Local file
- "MyOPack::jobs.yaml"       # From an oPack
- "ojob.io/common/utils"     # Remote oJob
```

### Include Only Jobs (Not Todo)

```yaml
jobsInclude:
- "job-definitions.yaml"
- "ojob.io/db/operations"
```

## Job Definitions

Jobs are the building blocks of oJob. Each job defines a unit of work.

### Basic Job Structure

```yaml
jobs:
- name: "Basic Job"
  type: simple               # Job type (default)
  exec: |                    # Code to execute
    print("Hello from " + job.name)
    args.result = "success"
```

### Job Types

#### Simple Jobs (default)

```yaml
jobs:
- name: "Simple Job"
  type: simple
  exec: |
    // Your JavaScript code here
    log("Processing...")
```

#### Periodic Jobs

```yaml
jobs:
- name: "Scheduled Job"
  type: periodic
  typeArgs:
    cron: "0 */5 * * * *"     # Every 5 minutes
    # OR
    timeInterval: 300000      # Every 5 minutes in ms
    waitForFinish: true       # Don't start new if previous still running
  exec: |
    log("Periodic execution at " + new Date())
```

#### Shutdown Jobs

```yaml
jobs:
- name: "Cleanup Job"
  type: shutdown
  exec: |
    log("Cleaning up before shutdown")
    // Cleanup code here
```

#### Subscribe Jobs

```yaml
jobs:
- name: "Channel Subscriber"
  type: subscribe
  typeArgs:
    chSubscribe: "dataChannel"
  exec: |
    log("Channel operation: " + op + " on " + ch)
    log("Key: " + stringify(k))
    log("Value: " + stringify(v))
```

#### External oJob Jobs

```yaml
jobs:
- name: "External Job Runner"
  type: jobs
  typeArgs:
    file: "external-ojob.yaml"
    # OR
    url: "https://example.com/remote-ojob.yaml"
```

### Job Dependencies

```yaml
jobs:
- name: "Dependent Job"
  deps:
  - "Prerequisite Job"
  - name: "Another Prerequisite"
    onSuccess: |
        log("Prerequisite succeeded")
    onFail: |
        log("Prerequisite failed")
        return false  # Stop execution
  exec: |
    log("All dependencies satisfied")
```

### Job Arguments and Templates

```yaml
jobs:
- name: "Templated Job"
  args:
    defaultValue: "hello"
    templateValue: "{{args.input}}-processed"
  exec: |
    log("Default: " + args.defaultValue)
    log("Template result: " + args.templateValue)
```

### Error Handling

```yaml
jobs:
- name: "Error Prone Job"
  catch: |
    logErr("Job failed: " + exception)
    // Handle error, return false to propagate
    return true  // Error handled
  exec: |
    if (Math.random() > 0.5) {
        throw "Random failure"
    }
```

### Job Languages

oJob supports multiple languages beyond JavaScript:

```yaml
jobs:
# Python
- name: "Python Job"
  lang: python
  exec: |
    import json
    print("Python is running")
    args['pythonResult'] = 'success'
  
# Shell/Bash
- name: "Shell Job"
  lang: shell
  exec: |
    echo "Running shell command"
    export RESULT="shell-success"
    echo '{"shellResult": "'$RESULT'"}'
  
# SSH Remote
- name: "Remote SSH Job"
  lang: ssh
  exec: |
    echo "Running on remote server"
    hostname
  typeArgs:
    shell: "/bin/bash"
  
# PowerShell
- name: "PowerShell Job"
  lang: powershell
  exec: |
    Write-Host "PowerShell is running"
    $_args.psResult = "success"
  
# Go
- name: "Go Job"
  lang: go
  exec: |
    fmt.Println("Go is running")
    args["goResult"] = "success"
  
# Ruby
- name: "Ruby Job"
  lang: ruby
  exec: |
    puts "Ruby is running"
    args['rubyResult'] = 'success'
  
# Node.js
- name: "Node Job"
  lang: node
  exec: |
    console.log("Node.js is running")
    args.nodeResult = "success"
```

### Job Execution Control

```yaml
jobs:
- name: "Controlled Job"
  typeArgs:
    timeout: 30000           # Max execution time (ms)
    single: true             # Don't parallelize array args
    async: false             # Force synchronous execution
    noLog: true              # Don't log this job
    pwd: "/tmp"              # Working directory
    when: ["init", "ready"]  # Only run in these states
    stopWhen: |              # Stop condition
    return args.shouldStop == true
    lock: "myLock"           # Mutual exclusion lock
    lockCh: "lockChannel"    # Channel for locks
  exec: |
    // Job code here
```

### Job Validation

```yaml
jobs:
- name: "Validated Job"
  check:
    in:                      # Input validation
        inputFile: isString
        port: toNumber.isNumber.default(8080)
        enabled: toBoolean.isBoolean.default(false)
    out:                     # Output validation
        result: isString.oneOf(['success', 'failure'])
        count: isNumber.default(0)
  exec: |
    // Validation happens automatically
    args.result = "success"
    args.count = 42
```

### Job Inheritance

```yaml
jobs:
- name: "Base Job"
  exec: |
    log("Base functionality")
      
- name: "Extended Job"
  from:
  - "Base Job"             # Execute before main job
  to:
  - "Cleanup Job"          # Execute after main job
  exec: |
    log("Main functionality")
```

### Job Help

```yaml
jobs:
- name: "Documented Job"
  help:
    text: "This job processes data files"
    expects:
    - name: inputFile
      desc: "Path to input file"
    - name: format
      desc: "Output format"
  exec: |
    // Job implementation
```

## Code Separation

The `code` section allows separating JavaScript code from job definitions:

```yaml
code:
  utils.js: |
    exports.processData = function(data) {
      return data.map(item => item.toUpperCase())
    }
  
  config.json: |
    {
      "apiUrl": "https://api.example.com",
      "timeout": 30000
    }

jobs:
- name: "Code Using Job"
  typeArgs:
    execRequire: "utils.js"  # Load and call exports.jobName
  # Alternative: reference file directly
  # typeArgs:
  #   file: "config.json"
```

## Advanced Features

### State Management

```yaml
todo:
- (state): "initializing"
- name: "State Dependent Job"
  when: "initializing"
- (state): "processing"
- name: "Processing Job"
  when: "processing"
```

### Metrics Collection

```yaml
ojob:
  metrics:
    add:
      processedItems: |
        return { count: $get("processedCount") || 0 }

jobs:
- name: "Metric Updating Job"
  exec: |
    ow.oJob.setMetric("processedItems", {
        type: "processedItems",
        count: args.itemCount
    })
```

### Channel Operations

```yaml
jobs:
- name: "Channel Writer"
  exec: |
    $ch("dataChannel").set(
        { id: args.id },
        { data: args.data, timestamp: now() }
    )
  
- name: "Channel Reader"
  exec: |
    var data = $ch("dataChannel").getAll()
    args.results = data
```

### Template Processing

```yaml
jobs:
- name: "Template Job"
  exec: |
    var template = "Hello {{name}}, welcome to {{app}}!"
    var data = { name: args.userName, app: "oJob" }
    args.message = templify(template, data)
```

## Built-in Jobs

oJob includes many built-in jobs for common operations. These are available when `ojob.includeOJob` is true (default).

### Common Built-in Jobs

- `ojob parallel` - Execute jobs in parallel
- `ojob if` - Conditional execution
- `ojob output` - Format and display output
- `ojob set` - Set variables
- `ojob get` - Get variables
- `ojob template` - Process templates
- `ojob channel` - Channel operations
- `ojob run file` - Execute external oJobs
- `ojob log` - Logging
- `ojob wait` - Delays and waits
- `ojob ask` - Interactive prompts
- `ojob query` - Data querying
- `ojob repeat` - Loops and repetition

## Examples

### Simple Data Processing

```yaml
help:
  text: "Process CSV data and generate report"
  expects:
  - name: inputFile
    desc: "CSV file to process"
    mandatory: true
  - name: outputFormat
    desc: "Output format"
    options: ["json", "yaml", "xml"]

init:
  outputFormat: json

jobs:
- name: Load Data
  check:
    in:
        inputFile: isString
  exec: |
    args.data = $csv().fromFile(args.inputFile).getList()
    log("Loaded " + args.data.length + " records")

- name: Process Data
  deps: 
  - Load Data
  exec: |
    args.processed = args.data.map(row => {
        row.processed_at = new Date().toISOString()
        row.status = 'processed'
        return row
    })

- name: Generate Output
  deps: 
  - Process Data
  exec: |
    switch(args.outputFormat) {
    case 'yaml':
        io.writeFileString("output.yaml", af.toYAML(args.processed))
        break
    case 'xml':
        io.writeFileString("output.xml", af.toXML(args.processed))
        break
    default:
        io.writeFileString("output.json", stringify(args.processed, "", 2))
    }
    log("Output written to output." + args.outputFormat)

todo:
- Load Data
- Process Data
- Generate Output
```

### Scheduled Monitoring

```yaml
ojob:
  daemon: true
  logToConsole: true

init:
  checkInterval: 300000  # 5 minutes
  alertThreshold: 90

jobs:
- name: Check System Health
  type: periodic
  typeArgs:
    timeInterval: "{{init.checkInterval}}"
    waitForFinish: true
  exec: |
    var cpuUsage = ow.metrics.get().cpu.usage
    var memUsage = ow.metrics.get().mem.usage
    
    if (cpuUsage > args.init.alertThreshold) {
      log("HIGH CPU USAGE: " + cpuUsage + "%")
    }
    
    if (memUsage > args.init.alertThreshold) {
      log("HIGH MEMORY USAGE: " + memUsage + "%")
    }

todo:
- Check System Health
```

### API Data Pipeline

```yaml
ojob:
  channels:
    create:
    - name: apiData
      type: simple

init:
  apiUrl: "https://api.example.com/data"
  batchSize: 100

jobs:
- name: Fetch API Data
  type: periodic
  typeArgs:
    cron: "0 */10 * * * *"  # Every 10 minutes
  exec: |
    var response = $rest().get(args.init.apiUrl)
    $ch("apiData").setAll(["id"], response.data)
    log("Fetched " + response.data.length + " records")

- name: Process Batch
  type: subscribe
  typeArgs:
    chSubscribe: apiData
  exec: |
    if (op == "setall") {
        var batch = $ch("apiData").getAll()
        if (batch.length >= args.init.batchSize) {
          // Process batch
          batch.forEach(record => {
            record.processed = true
            record.processedAt = now()
          })
          
          // Clear processed data
          $ch("apiData").unsetAll(["id"], batch)
          log("Processed batch of " + batch.length + " records")
        }
    }

todo:
- Fetch API Data
- Process Batch
```

### Interactive Setup

```yaml
help:
  text: Interactive application setup

jobs:
- name: Gather Configuration
  exec: |
    args.config = {}
      
- name: Database Setup
  deps: 
  - Gather Configuration
  exec: |
    var dbHost = ask("Database host: ", "localhost")
    var dbPort = ask("Database port: ", "5432")
    var dbName = ask("Database name: ")
      
    args.config.database = {
        host: dbHost,
        port: Number(dbPort),
        name: dbName
    }

- name: API Configuration
  deps: 
  - Gather Configuration
  exec: |
    var apiUrl = ask("API URL: ")
    var apiKey = ask("API Key: ", null, null, true) // secret
      
    args.config.api = {
        url: apiUrl,
        key: apiKey
    }

- name: Save Configuration
  deps: 
  - Database Setup
  - API Configuration
  exec: |
    io.writeFileString("config.json", stringify(args.config, "", 2))
    log("Configuration saved to config.json")

todo:
- Gather Configuration
- Database Setup
- API Configuration
- Save Configuration
```

This comprehensive guide covers all aspects of creating and using oJob YAML files. For more specific use cases and advanced patterns, refer to the OpenAF documentation and the extensive library of built-in jobs available in the oJob ecosystem.
