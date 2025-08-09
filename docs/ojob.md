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
9. [Built-in Jobs](#built-in-jobs)
10. [Advanced Features](#advanced-features)
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
    recordLog       : false    # Record OpenAF logs
    recordLogHistory: -1       # Number of log entries to keep (-1 unlimited)
    
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
- name: "Basic Job"          # unique name (mandatory)
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

## Built-in Jobs

oJob includes many built-in jobs for common operations. These are available when `ojob.includeOJob` is true (default).

### Common Built-in Jobs

**Core Execution Jobs:**
- `ojob pass` - Placeholder/pass job to allow for arguments injection
- `ojob parallel` - Execute jobs in parallel
- `ojob if` - Conditional execution based on conditions
- `ojob repeat` - Repeats sequentially for a specific number of times
- `ojob repeat with each` - Repeats for each element in a provided list
- `ojob run` - Execute a single job with specific arguments
- `ojob run file` - Execute external YAML/JSON ojob files or remote URLs
- `ojob todo` - Execute an ojob sub-todo list
- `ojob wait` - Wait for a specific amount of time
- `ojob exit` - End all processing with an exit code

**Data Management Jobs:**
- `ojob get` - Retrieve a specific map key or path using $get
- `ojob set` - Set a key with current value or provided data using $set
- `ojob unset` - Unset a key using $unset
- `ojob get pm` - Get process manager data
- `ojob file get` - Retrieve data from YAML or JSON files
- `ojob query` - Perform queries using ow.obj.filter on existing args
- `ojob convert` - Convert string content into internal objects (map/array)
- `ojob split to items` - Split strings into arrays

**Output and Logging Jobs:**
- `ojob output` - Print current arguments to console with formatting
- `ojob print` - Print a message line using OpenAF templates
- `ojob print md` - Parse and display simple ASCII markdown
- `ojob log` - Log a message line using OpenAF templates
- `ojob debug` - Output current args and res values for debugging

**Template and Processing Jobs:**
- `ojob template` - Apply OpenAF templates over provided data
- `ojob template folder` - Process template folders recursively
- `ojob find/replace` - Perform in-memory find/replace operations
- `ojob function` - Execute OpenAF functions dynamically
- `ojob oafp` - OpenAF Processing operations for data transformation

**Channel Operations:**
- `ojob channel` - Provide operations over OpenAF channels

**Security and Environment:**
- `ojob sec get` - Get SBucket secrets and map to oJob args
- `ojob set envs` - Set job args based on environment variables

**State Management:**
- `ojob state` - Change the current execution state
- `ojob set state` - Set the current state
- `ojob get state` - Get the current state into args.state

**Interactive and User Input:**
- `ojob ask` - Interactive prompts for user input
- `ojob questions` - Handle multiple interactive questions

**Planning and Validation:**
- `ojob check` - Check and validate inputs with actions
- `ojob job` - Organize idempotent jobs with checks and actions
- `ojob options` - Handle switch/options based execution

**AI and Advanced Processing:**
- `ojob llm` - Execute LLM (Local Language Model) prompts

**Reporting Jobs:**
- `ojob report` - Output job execution reports
- `ojob job report` - Output job planning reports  
- `ojob deps report` - Output dependency tree reports
- `ojob final report` - Output reports upon ojob termination
- `ojob final deps report` - Output dependency reports upon termination
- `ojob job final report` - Output job reports upon termination

### Built-in Job Shortcuts

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

### Specialized Built-in Jobs

oJob includes many more built-in jobs for specific operations:

```yaml
todo:
# Security operations
- (secget): "mySecretKey"
  ((secRepo)): "secrets"
  ((secBucket)): "app-secrets"

# Print markdown
- (printmd): |
    # Status Report
    Current status: {{status}}
  
# Function execution  
- (fn): "myFunction"
  ((args)): { param: "value" }
  
# Split operations
- (split): "item1,item2,item3"
  ((sep)): ","
  ((outPath)): "items"
  
# Options/switch operations
- (options): "environment"
  ((dev)):
  - "Development Job"
  ((prod)):
  - "Production Job"
  
# Environment variable setting
- (setenvs):
    DATABASE_URL: "{{config.db.url}}"
    API_KEY: "{{secrets.apikey}}"
    
# Job planning and checking
- (check): "Validation Job"
  ((actions)):
    create: "Create Resource"
    update: "Update Resource"
    
# Find and replace operations
- (replace): "input text"
  ((replace)): "old"
  ((with)): "new"
  ((outPath)): "result"
  
# OAFP (OpenAF Processing) operations
- (oafp): "data"
  ((from)): "json"
  ((to)): "yaml"
  ((outPath)): "convertedData"
```

## Advanced Features

### Job Each Processing

The `each` section allows a job to call other jobs in parallel for each element in a list or array:

```yaml
jobs:
# Example: Process multiple files in parallel
- name: List files to process
  from:
  - (pass  ):
      aFilePath: "."
  - (fn    ): io.listFiles
    ((key )): res
  each: 
  - Process file
  exec: | #js
    $get("res").files.forEach(file => {
      print(`⚙️ Processing file ${file.canonicalPath}...`)
      each(file)
    })

- name: Process file
  exec: | #js
    print(`  🗂️ file ${args.canonicalPath} with ${args.size} bytes processed.`)
```

The `each` functionality:
- Calls the specified jobs in parallel
- Passes the current arguments as the `each(data)` parameter
- Each call receives the data passed to the `each()` function
- Useful for parallel processing of collections

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

### Job Shortcut Support

oJob supports shortcut definitions that create convenient shorthand syntax for jobs:

```yaml
jobs:
- name: "My Custom Job"
  typeArgs:
    shortcut:
      name: "mycustom"         # Creates (mycustom) shortcut
      keyArg: "inputValue"     # Main argument for the shortcut
      args:                    # Mapping of shortcut args to job args
        output: "__output"     # Creates ((output)) shortcut arg
        format: "__format"     # Creates ((format)) shortcut arg
  exec: |
    // Job logic here
```

Usage in todo:
```yaml
todo:
- (mycustom): "input data"
  ((output)): "result"
  ((format)): "json"
```

### Job Security Features

```yaml
jobs:
- name: "Secure Job"
  exec: |
    // Access secure data using SBucket
    var secret = $sec("mysecrets", "mypassword").get("apikey")
    
todo:
- (secget): "database.password"
  ((secRepo)): "myrepo"
  ((secBucket)): "secrets"
```

### Job Markdown Support

```yaml
todo:
- (printmd): |
    # My Report
    
    Processing completed with {{results.count}} items.
    
    ## Results:
    {{#each results.items}}
    - **{{name}}**: {{status}}
    {{/each}}
  ((outputMD)): false  # Parse as markdown (default)
```

### Job LLM Integration

```yaml
jobs:
- name: "AI Analysis"
  exec: |
    var prompt = "Analyze this data and provide insights"
    var result = $llm().withContext(args.data, "sales data").promptJSON(prompt)
    args.analysis = result

todo:
- (llm): "Summarize the following data in 3 bullet points"
  ((inKey)): "salesData"
  ((inPath)): "records"
  ((context)): "monthly sales figures"
  ((outPath)): "summary"
```

> Use the OAF_MODEL environment variable to specify the LLM model to use similarily to OAFP_MODEL

### Job State Management

```yaml
jobs:
- name: "State Dependent Job"
  typeArgs:
    when: ["processing", "ready"]  # Only run in these states
  exec: |
    // This job only runs when state is 'processing' or 'ready'
    
todo:
- (state): "initializing"
- "Setup Job"
- (state): "processing" 
- "State Dependent Job"
```

### Additional Built-in Jobs

oJob includes many more built-in jobs for specific operations:

```yaml
todo:
# Security operations
- (secget): "mySecretKey"
  ((secRepo)): "secrets"
  ((secBucket)): "app-secrets"

# Print markdown
- (printmd): |
    # Status Report
    Current status: {{status}}
  
# Function execution  
- (fn): "myFunction"
  ((args)): { param: "value" }
  
# Split operations
- (split): "item1,item2,item3"
  ((sep)): ","
  ((outPath)): "items"
  
# Options/switch operations
- (options): "environment"
  ((dev)):
  - "Development Job"
  ((prod)):
  - "Production Job"
  
# Environment variable setting
- (setenvs):
    DATABASE_URL: "{{config.db.url}}"
    API_KEY: "{{secrets.apikey}}"
    
# Job planning and checking
- (check): "Validation Job"
  ((actions)):
    create: "Create Resource"
    update: "Update Resource"
    
# Find and replace operations
- (replace): "input text"
  ((replace)): "old"
  ((with)): "new"
  ((outPath)): "result"
  
# OAFP (OpenAF Processing) operations
- (oafp): "data"
  ((from)): "json"
  ((to)): "yaml"
  ((outPath)): "convertedData"
```

### Advanced Monitoring and Metrics

```yaml
ojob:
  daemon: true
  metrics:
    active:
      nattrmon:
        url: "http://monitor:7777/remote"
        attrPrefix: "DataPipeline/"
        periodInMs: 30000
    collect:
      ch: "metricsHistory"
      period: 10000
      some: ["mem", "cpu", "custom-throughput"]
    add:
      custom-throughput: |
        return { 
          value: $get("processedFiles") || 0,
          timestamp: now() 
        }

jobs:
- name: "Health Check"
  type: periodic
  typeArgs:
    cron: "*/30 * * * * *"  # Every 30 seconds
    cronCheck: |
      return ow.oJob.getState() === "running"
  exec: |
    var health = {
      status: "healthy",
      uptime: now() - $get("startTime"),
      processed: $get("processedFiles") || 0
    }
    $ch("health").set("current", health)

- name: "Cleanup Old Files"
  type: periodic  
  typeArgs:
    cron: "0 0 2 * * *"  # Daily at 2 AM
  exec: |
    var cutoff = now() - (7 * 24 * 60 * 60 * 1000)  # 7 days ago
    // Cleanup logic here

todo:
- (state): "running"
- "Health Check"
- "Cleanup Old Files"
```

### Cron Reliability & Retries (cronCheck)

Periodic jobs can recover missed runs & retry failures using `typeArgs.cronCheck`.

```yaml
jobs:
- name    : Sample Periodic
  type    : periodic
  typeArgs:
    cron         : "*/15 * * * * *"
    waitForFinish: true
    cronCheck    :
      active   : true
      ch       : oJob::cron
      retries  : 3
      retryWait: 2000
  exec    : | #js
    if (Math.random() < 0.2) throw "transient error";
    log("OK " + new Date())
```

Channel schema per job: `{ name, last, status, retries }`.

### Integrity, Auditing & Change Detection

Provide hashes to detect tampering and enable auditing flags:

```yaml
ojob:
  integrity:
    list:
    - dep.yaml: sha256:abcd...
    warn: true
```
Set env `OJOB_CHECK_JOB_CHANGES=true` / `OJOB_CHECK_JOB_REMOVAL=true` for dynamic mutation warnings.

### Environment Variable Injection

`ojob.argsFromEnvs: true` converts all environment variables to args (lowercased + underscores). Use `initTemplateEscape: true` to preserve literal handlebars in `init`.

### Global vs Job catch

`ojob.catch` defines a fallback error handler (vars: exception, job, args, id). Individual jobs can also declare `catch:` overriding it.

### Unique Execution Control

```yaml
ojob:
  unique:
    pidFile     : service.pid
    killPrevious: true
```

Rejects concurrent instances (or replaces prior if `killPrevious`). Runtime control args: `stop`, `restart`, `forcestop`, `status`.

### Channel Exposure Auditing

`ojob.channels.audit: true` (or template string) logs HTTP channel operations with key & user info.

### Structured JSON Logs

Enable with env `OJOB_JSONLOG=true` or:
```yaml
ojob:
  log:
    format: json
```

### cronInLocalTime

`ojob.cronInLocalTime: true` evaluates cron schedules using local timezone.

### Code Embedding Precedence

When a file name exists under `code:` its content overrides filesystem counterparts for `execFile` / `execRequire` resolution, enabling fully self-contained distributions.

### Arg Parallelism Control

Array args run in parallel unless `typeArgs.single: true` or global `numThreads <= 1`. Use for rate-limited APIs or ordered processing.

### Timeout & stopWhen

`typeArgs.timeout` enforces a max duration; if exceeded an exception is raised. `typeArgs.stopWhen` (function) is evaluated on timeout to allow graceful termination.

### Locks (`lock` / `lockCh`)

Mutual exclusion across async jobs sharing the same `typeArgs.lock` name; defaults to channel `oJob::locks`. Customize storage via `lockCh` for distributed scenarios.

### Inspect Internal Job Log

```javascript
print($ch('oJob::log').getAll())
```

### Flag Overrides in YAML

```yaml
ojob:
  flags:
    OJOB_CHECK_JOB_CHANGES: true
    OJOB_CHECK_JOB_REMOVAL: true
```

See `openaf-flags.md` for exhaustive list.
