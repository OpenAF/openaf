# oJob YAML Reference Guide

[Index](./index.md) | [oJob Reference](./ojob.md) | [Security](./ojob-security.md) | [Flags](./openaf-flags.md) | [Recipes](./ojob-recipes.md) | [Advanced](./openaf-advanced.md)

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
  text   : "Description of what this oJob does"
  expects:
  - name: arg1
    desc: "Description of argument 1"

# Optional: Initialization values
init:
  someValue: "default value"

# Optional: oJob configuration
ojob:
  daemon      : false
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
  text   : "Detailed description of the oJob functionality"
  expects:
  - name     : inputFile
    desc     : "Path to the input file to process"
    mandatory: true
    example  : "/path/to/file.txt"
  - name     : outputDir
    desc     : "Directory where results will be saved"
    mandatory: false
    example  : "/tmp/output"
  - name     : verbose
    desc     : "Enable verbose logging"
    options  : ["true", "false"]
  - name     : mode
    desc     : "Processing mode"
    moptions : ["fast", "thorough", "debug"]
  - name     : password
    desc     : "Authentication password"
    secret   : true
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

> See below [Job State Management](#job-state-management) for more on state management.

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

### Default Arguments in Todo

Todo entries also support default argument values using the `"${key:-defaultValue}"` syntax, allowing you to provide fallback values for arguments that may not be defined:

```yaml
todo:
- name: "Job with Default Args"
  args:
    # Use "localhost" if "serverHost" is not defined
    host: "${serverHost:-localhost}"
    # Use 3306 if "dbPort" is not defined
    port: "${dbPort:-3306}"
    # Use existing value if "mode" is provided, otherwise use "default"
    mode: "${mode:-default}"
    # Works with nested paths - use "INFO" if config.log.level is not defined
    logLevel: "${config.log.level:-INFO}"
```

**Key features in todo entries:**
- **Runtime resolution**: Default values are resolved when the todo entry is processed
- **Inheritance**: These processed arguments are passed to the target job
- **Template integration**: Works seamlessly with oJob's template processing
- **Nested support**: Supports dot notation for nested object properties
- **Type preservation**: Values are processed as strings but maintain their intended types

**Usage examples:**
```yaml
# Todo entry with various default patterns
todo:
- name: "Database Migration Job"
  args:
    # Database connection defaults
    dbHost: "${DB_HOST:-localhost}"
    dbPort: "${DB_PORT:-5432}"
    dbName: "${DB_NAME:-myapp}"
    
    # Processing options with defaults
    batchSize: "${BATCH_SIZE:-1000}"
    timeout: "${TIMEOUT:-30000}"
    
    # Feature flags with defaults
    dryRun: "${DRY_RUN:-false}"
    verbose: "${VERBOSE:-true}"
    
    # Nested configuration defaults
    config:
      retryCount: "${config.retries:-3}"
      backoffMs: "${config.backoff:-5000}"
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
  exec: | #js                # Code to execute
    print("Hello from " + job.name)
    args.result = "success"
```

### Job Types

#### Simple Jobs (default)

```yaml
jobs:
- name: "Simple Job"
  type: simple
  exec: | #js
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
  exec: | #js
    log("Periodic execution at " + new Date())
```

#### Shutdown Jobs

```yaml
jobs:
- name: "Cleanup Job"
  type: shutdown
  exec: | #js
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
  exec: | #js
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
  - name     : "Another Prerequisite"
    onSuccess: | #js
        log("Prerequisite succeeded")
    onFail   : | #js
        log("Prerequisite failed")
        return false  # Stop execution
  exec: | #js
    log("All dependencies satisfied")
```

### Job Arguments and Templates

```yaml
jobs:
- name: "Templated Job"
  args:
    defaultValue: "hello"
    templateValue: "{{args.input}}-processed"
  exec: | #js
    log("Default: " + args.defaultValue)
    log("Template result: " + args.templateValue)
```

#### Default Arguments

oJob supports default argument values using the `"${key:-defaultValue}"` syntax. This allows you to specify fallback values for arguments that may not be provided:

```yaml
jobs:
- name: "Job with Default Args"
  args:
    # Use "defaultHost" if "serverHost" is not defined
    host: "${serverHost:-defaultHost}"
    # Use 8080 if "serverPort" is not defined
    port: "${serverPort:-8080}"
    # Use existing value if "environment" is provided, otherwise use "development"
    env: "${environment:-development}"
    # Works with nested paths - use "localhost" if config.database.host is not defined
    dbHost: "${config.database.host:-localhost}"
  exec: | #js
    log("Connecting to: " + args.host + ":" + args.port)
    log("Environment: " + args.env)
    log("Database host: " + args.dbHost)

todo:
- name: "Job with Default Args"
  args:
    serverHost: "production.example.com"
    config:
      database:
        host: "db.example.com"
```

**Key features:**
- **Fallback values**: If the specified key is undefined, the default value is used
- **Type preservation**: Default values are treated as strings but can represent any value
- **Nested paths**: Supports dot notation for nested object properties (e.g., `config.database.host`)
- **Circular reference prevention**: A key cannot reference itself as a default to prevent infinite loops
- **Runtime evaluation**: Default values are resolved when arguments are processed before job execution
- **String values only**: The syntax only works with string values containing the exact pattern `"${key:-default}"`

**Examples:**
- `"${missingKey:-defaultValue}"` → `"defaultValue"` (if `missingKey` is undefined)
- `"${existingKey:-defaultValue}"` → value of `existingKey` (if `existingKey` exists)
- `"${config.timeout:-30000}"` → `"30000"` (if `config.timeout` is undefined)
- `"${circularRef:-circularRef}"` → `"${circularRef:-circularRef}"` (prevents circular reference)

**Usage contexts:**
This default argument syntax can be used in:
- Job `args` sections
- Arguments passed from `from` jobs to current jobs
- Any string value within job argument processing

**Note:** This feature is processed by the `__defaultArgs` function during argument preparation, which occurs before job execution and when processing job dependencies.

### Error Handling

```yaml
jobs:
- name : "Error Prone Job"
  catch: | #js
    logErr("Job failed: " + exception)
    // Handle error, return false to propagate
    return true  // Error handled
  exec : | #js
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
  exec: | #python
    import json
    print("Python is running")
    args['pythonResult'] = 'success'
  
# Shell/Bash
- name: "Shell Job"
  lang: shell
  exec: | #shell
    echo "Running shell command"
    # To use input args
    # echo $aInputArgs
    # OR
    # echo {{aInputArgs}}
    export RESULT="shell-success"
    # To output args
    echo '{"shellResult": "'$RESULT'"}'
  
# SSH Remote
- name    : "Remote SSH Job"
  lang    : ssh
  exec    : | #shell
    echo "Running on remote server"
    hostname
  typeArgs:
    shell: "/bin/bash"
  
# PowerShell
- name: "PowerShell Job"
  lang: powershell
  exec: | #powershell
    Write-Host "PowerShell is running"
    $_args.psResult = "success"
  
# Python
- name: "Python Job"
  lang: python
  exec: | #python
    print("Python is running")
    args['pythonResult'] = 'success'

# Alternative Python execution
- name: "Python File Job"
  typeArgs:
    execPy: "/path/to/script.py"
  exec: |
    # Python script will be executed
# Go
- name: "Go Job"
  lang: go
  exec: | #go
    fmt.Println("Go is running")
    args["goResult"] = "success"
  
# Ruby
- name: "Ruby Job"
  lang: ruby
  exec: | #ruby
    puts "Ruby is running"
    args['rubyResult'] = 'success'
  
# Node.js
- name: "Node Job"
  lang: node
  exec: | #js
    console.log("Node.js is running")
    args.nodeResult = "success"
```

> If not 'lang' entry is provided it's assumed to be `javascript`/`oaf`/`js` which defaults to OpenAF's javascript

### Job Execution Control

```yaml
jobs:
- name    : "Controlled Job"
  typeArgs:
    timeout : 30000           # Max execution time (ms)
    single  : true             # Don't parallelize array args
    async   : false             # Force synchronous execution
    noLog   : true              # Don't log this job
    pwd     : "/tmp"              # Working directory
    when    : ["init", "ready"]  # Only run in these states
    stopWhen: |              # Stop condition
      return args.shouldStop == true
      lock: "myLock"           # Mutual exclusion lock
      lockCh: "lockChannel"    # Channel for locks
  exec    : |
    // Job code here
```

### Job Validation

oJob provides comprehensive input and output validation through the `check` section:

```yaml
jobs:
- name : "Validated Job"
  check:
    in:                      # Input validation
      inputFile: isString    # Must be a string
      port     : toNumber.isNumber.default(8080)  # Convert to number, default 8080
      enabled  : toBoolean.isBoolean.default(false)  # Convert to boolean, default false
      config   : isMap       # Must be an object/map
      items    : isArray.default([])  # Must be array, default empty
      level    : isString.oneOf(['debug', 'info', 'warn', 'error']).default('info')
      timeout  : isNumber.between(1000, 60000).default(30000)  # Between 1-60 seconds
    out:                     # Output validation  
      result: isString.oneOf(['success', 'failure'])  # Must be one of these values
      count : isNumber.default(0)  # Must be number, default 0
      data  : isMap.default({})    # Must be map, default empty object
  exec : | #js
    // Input validation happens automatically before this code runs
    // args.inputFile is guaranteed to be a string
    // args.port is guaranteed to be a number (converted from string if needed)
    // args.enabled is guaranteed to be a boolean
    
    // Process the validated inputs
    log("Processing file: " + args.inputFile + " on port: " + args.port);
    
    // Set outputs - these will be validated too
    args.result = "success"
    args.count = 42
    args.data = { processed: true, timestamp: new Date() }
    // Output validation happens automatically after this code runs
```

#### Advanced Validation Examples

```yaml
jobs:
- name: "Advanced Validation"
  check:
    in:
      # String validations
      email    : isString.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)  # Email regex
      username : isString.minLength(3).maxLength(20)          # Length constraints
      password : isString.minLength(8).hasUpperCase().hasLowerCase().hasNumber()
      
      # Number validations
      age      : isNumber.between(0, 150)                     # Age range
      score    : isNumber.multipleOf(0.5).between(0, 100)     # Score in 0.5 increments
      
      # Array validations
      tags     : isArray.minLength(1).maxLength(10)           # 1-10 items
      emails   : isArray.eachIsString()                       # Each item must be string
      
      # Object validations
      settings : isMap.hasKeys(['theme', 'language'])         # Must have required keys
      metadata : isSchema({                                   # JSON Schema validation
        type: "object",
        properties: {
          version: { type: "string" },
          created: { type: "string", format: "date-time" }
        },
        required: ["version"]
      })
      
      # Conditional validation
      database : check("args.useDatabase", "isMap.hasKeys(['host', 'port'])")
      
    out:
      # Ensure outputs meet requirements
      processedCount: isNumber.min(0)
      errors        : isArray.default([])
      status        : isString.oneOf(['completed', 'failed', 'partial'])
  exec : | #js
    // All inputs are validated and converted as needed
    args.processedCount = 100
    args.status = "completed"
```

### Job Inheritance

```yaml
jobs:
- name: "Base Job"
  exec: | #js
    log("Base functionality")
      
- name: "Extended Job"
  from:
  - "Base Job"             # Execute before main job
  to  :
  - "Cleanup Job"          # Execute after main job
  exec: | #js
    log("Main functionality")
```

### Job Help

```yaml
jobs:
- name: "Documented Job"
  help:
    text   : "This job processes data files"
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
  utils.js: | #js
    exports.processData = function(data) {
      return data.map(item => item.toUpperCase())
    }
  
  config.json: | #json
    {
      "apiUrl": "https://api.example.com",
      "timeout": 30000
    }

jobs:
- name    : "Code Using Job"
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
- (if    ): "args.env == 'prod'"
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
  ((out  )): config
  
# Channel operations
- (ch  ): "myChannel"
  ((op)): "set"
  ((k )): { id: 1 }
  ((v )): { name: "test" }
  
# Output formatting
- (output  ): results
  ((format)): "json"
  
# Template processing
- (template): "Hello {{name}}!"
  ((data  )): { name: "World" }
  
# Ask for input
- (ask): "Please enter your name"
    
# Wait/delay
- (wait): 5000               # Wait 5 seconds
  
# Logging
- (log    ): "Processing started"
  ((level)): "INFO"
  
# Run external oJob
- (runfile): "external.yaml"
  ((args )): { param: "value" }
  
# Repeat operations
- (repeat): 3
  ((todo)):
  - "Repeated Job"
  
# Each loop
- (each  ): "items"
  ((todo)):
  - "Process Item"
  
# Query data
- (query ): "[?status=='active']"
  ((from)): "data"
  ((to  )): "activeItems"
  
# State management
- (state    ): "processing"
- (stateOn  ): "processing"
  ((default)): "Continue Processing"
  
# Debug
- (debug):                   # Pause for debugging
  
# Conversion
- (convert    ): "inputData"
  ((outFormat)): "yaml"
  ((outKey   )): "yamlData"
```

#### Built-in Jobs and Shortcut Correlation

| Built-in Job         | Shortcut Equivalent   |
|----------------------|----------------------|
| ojob pass            | (pass)               |
| ojob parallel        | (parallel)           |
| ojob if              | (if)                 |
| ojob repeat          | (repeat)             |
| ojob repeat with each| (each)               |
| ojob run             | (run)                |
| ojob run file        | (runfile)            |
| ojob todo            | (todo)               |
| ojob wait            | (wait)               |
| ojob exit            | (fail)               |
| ojob get             | (get)                |
| ojob set             | (set)                |
| ojob unset           | (unset)              |
| ojob get pm          |                      |
| ojob file get        | (fileget)            |
| ojob query           | (query)              |
| ojob convert         | (convert)            |
| ojob split to items  | (split)              |
| ojob channel         | (ch)                 |
| ojob output          | (output)             |
| ojob print           | (print)              |
| ojob print md        | (printmd)            |
| ojob log             | (log)                |
| ojob template        | (template)           |
| ojob template folder | (templateFolder)     |
| ojob find/replace    | (findReplace)        |
| ojob function        | (fn)                 |
| ojob oafp            | (oafp)               |
| ojob sec get         | (secget)             |
| ojob set envs        | (setenvs)            |
| ojob state           | (state)              |
| ojob set state       | (state)              |
| ojob get state       |                      |
| ojob check           | (check)              |
| ojob job             |                      |
| ojob options         | (options)            |
| ojob llm             | (llm)                |
| ojob report          |                      |
| ojob job report      |                      |
| ojob deps report     |                      |
| ojob final report    |                      |
| ojob final deps report|                     |
| ojob job final report|                      |
| ojob ask             | (ask)                |
| ojob questions       | (questions)          |

> Not all built-in jobs have a direct shortcut equivalent. Shortcuts provide a concise way to invoke common jobs in the `todo` section.

> To the list of arguments that apply to an shortcut run `ojob -shortcuts ojob something`; to get help on each argument run `ojob -jobhelp ojob something`

---

#### Built-in Job Arguments Reference

**(pass)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-------------------|-----------------------------------------------------------------------------|
| __args          | (pass)            | The args to inject                                                          |
| __debug         | ((debug))         | Boolean to print args before injection                                      |
| __templateArgs  | ((templateArgs))  | Boolean to apply template to each string in args                            |

**(get)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-------------------|-----------------------------------------------------------------------------|
| __key           | (get)    | Map key to retrieve                                                         |
| __path          | ((path)) | Path to consider from the __key                                             |

**(set)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-------------------|-----------------------------------------------------------------------------|
| __key           | (set)    | Map key                                                                     |
| __path          | ((path)) | Path to value from current args                                             |
| __data          | ((data)) | Data to set                                                                 |
| __templateArgs  | ((templateArgs)) | Apply template to each entry in __data                                      |
| __debug         | ((debug)) | Print current args                                                          |

**(unset)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-----------------------------------------------------------------------------|
| __key           | (unset) | Map key to unset                                                            |

**(fileget)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-------------------|-----------------------------------------------------------------------------|
| __file          | (fileget) | File path to YAML/JSON file                                                 |
| __path          | ((path)) | Path of the file contents                                                   |
| __cache         | ((cache)) | Boolean to cache file contents                                              |
| __ttl           | ((ttl)) | TTL for cache                                                               |
| __out           | ((out)) | Path on args to set contents                                                |
| __key           | ((key)) | Key to set content if __out not defined                                     |

**(template)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-------------------|-----------------------------------------------------------------------------|
| template        | (template) | Template string                                                             |
| templateFile    | ((templateFile)) | Template file                                                               |
| data            | ((data)) | Data to use                                                                 |
| dataFile        | ((dataFile)) | Data file (yaml/json)                                                       |
| outputFile      | ((outputFile)) | Output file path                                                            |
| __key           | ((key)) | Key holding template/data                                                   |
| __tpath         | ((tpath)) | Path to template                                                            |
| __dpath         | ((dpath)) | Path to data                                                                |
| __outPath       | ((outPath)) | Output path                                                                 |
| __out           | ((out)) | Output key                                                                  |

**(templateFolder)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-------------------|-----------------------------------------------------------------------------|
| templateFolder  | (templateFolder) | Folder with templates                                                       |
| __templatePath  | ((templatePath)) | Path over recursive list of files                                           |
| outputFolder    | ((outputFolder)) | Output folder                                                               |
| data            | ((data)) | Data to use                                                                 |
| dataFile        | ((dataFile)) | Data file                                                                   |
| __key           | ((key)) | Key holding template/data                                                   |
| __dpath         | ((dpath)) | Path to data                                                                |
| logJob          | ((logJob)) | Logging job                                                                 |
| metaTemplate    | ((metaTemplate)) | Interpret json/yaml files as argument maps                                  |

**(findReplace)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-------------------|-----------------------------------------------------------------------------|
| __key           | (findReplace) | Key holding replacements                                                    |
| __path          | ((path)) | Path to replacements                                                        |
| inputKey        | ((inputKey)) | Key holding string to replace                                               |
| inputPath       | ((inputPath)) | Path to string to replace                                                   |
| inputFile       | ((inputFile)) | File to read contents from                                                  |
| outputFile      | ((outputFile)) | File to write output to                                                     |
| useRegExp       | ((useRegExp)) | Interpret replacements as regexp                                            |
| flagsRegExp     | ((flagsRegExp)) | Regexp flags                                                               |
| logJob          | ((logJob)) | Logging job                                                                 |

**(ch)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-------------------|-----------------------------------------------------------------------------|
| __name          | (ch) | Channel name                                                                |
| __op            | ((op)) | Operation (set, get, unset, setall, unsetall, getall, getkeys)              |
| __key           | ((key)) | Key for operation args                                                      |
| __kpath         | ((kpath)) | Path for keys                                                               |
| key             | ((k)) | Key for set/get/unset                                                       |
| keys            | ((ks)) | Keys for setall/unsetall                                                    |
| value           | ((v)) | Value for set/get/unset                                                     |
| values          | ((vs)) | Values for setall/unsetall                                                  |
| __vpath         | ((vpath)) | Path for values                                                             |
| extra           | ((extra)) | Extra argument for getall/getkeys                                           |

**(print)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-------------------|-----------------------------------------------------------------------------|
| msg             | (print) | Message template                                                            |
| __key           | ((key)) | Key to retrieve                                                             |
| __path          | ((path)) | Path to consider from __key                                                 |
| level           | ((level)) | Message level (info/error)                                                  |

**(printmd)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-------------------|-----------------------------------------------------------------------------|
| __text          | (printmd) | Text template to parse                                                      |
| __outputMD      | ((outputMD)) | Boolean to output as markdown                                               |

**(log)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-------------------|-----------------------------------------------------------------------------|
| msg             | (log) | Message template                                                            |
| __key           | ((key)) | Key to retrieve                                                             |
| __path          | ((path)) | Path to consider from __key                                                 |
| level           | ((level)) | Message level (info/warn/error)                                             |
| options         | ((options)) | Extra options for log functions                                             |

**(fn)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-------------------|-----------------------------------------------------------------------------|
| __fn            | (fn) | Function to execute                                                         |
| __key           | ((key)) | Key to retrieve previous results                                            |
| __path          | ((path)) | Path for function arguments                                                 |
| __fnPath        | ((fnPath)) | Path to set function result                                                 |

**(output)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-------------------|-----------------------------------------------------------------------------|
| __key           | (output) | Key to retrieve results                                                     |
| __path          | ((path)) | Path to map/array over results                                              |
| __format        | ((format)) | Output format                                                               |
| __title         | ((title)) | Title key for output                                                        |
| __internal      | ((internal)) | Show internal oJob entries                                                  |
| __function      | ((function)) | Print/log function                                                          |

**(todo)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-------------------|-----------------------------------------------------------------------------|
| todo            | (todo) | String or array of todo maps                                                |
| isolateArgs     | ((isolateArgs)) | Isolate args from all others                                                |
| isolateJob      | ((isolateJobs)) | Run job in different scope                                                  |
| templateArgs    | ((templateArgs)) | Apply template to each string in args                                       |
| shareArgs       | ((shareArgs)) | Share args between jobs sequentially                                        |
| __debug         | ((debug)) | Print job execution parameters                                              |

**(runfile)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-------------------|-----------------------------------------------------------------------------|
| __job           | (runfile) | YAML/JSON ojob file or remote URL                                           |
| __args          | ((args)) | Args to provide to external ojob                                            |
| __out           | ((out)) | Path on args to set contents                                                |
| __key           | ((key)) | Key to set content if __out not defined                                     |
| __inKey         | ((inKey)) | Merge args with content from provided key                                   |
| __usePM         | ((usePM)) | Output to __pm                                                              |
| __inPM          | ((inPM)) | Input from provided key to __pm                                             |
| __templateArgs  | ((templateArgs)) | Apply template to each string in args                                       |
| __debug         | ((debug)) | Print job execution parameters                                              |

**(parallel)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-------------------|-----------------------------------------------------------------------------|
| todo            | (parallel) | String or array of todo maps                                                |
| isolateArgs     | ((isolateArgs)) | Isolate args from all others                                                |
| isolateJob      | ((isolateJob)) | Run job in different scope                                                  |
| templateArgs    | ((templateArgs)) | Apply template to each string in args                                       |
| shareArgs       | ((shareArgs)) | Share args between jobs sequentially                                        |
| isolateArgs     | on each entry | Isolate args from all others only on this entry                     |
| isolateJob      | on each entry | Run job in different scope only on this entry                              |
| templateArgs    | on each entry | Apply template to each string in args only on this entry               |
| shareArgs       | on each entry | Share args between jobs sequentially only on this entry                  |
| __debug         | ((debug)) | Print job execution parameters                                              |

**(wait)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-------------------|-----------------------------------------------------------------------------|
| time            | ((wait)) | Amount of time in ms to pause execution                                     |

**(fail)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-------------------|-----------------------------------------------------------------------------|
| code            | (fail) | Exit code number                                                            |
| force           | ((force)) | Boolean to halt processing instead of exit                                  |

**(convert)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-------------------|-----------------------------------------------------------------------------|
| __inKey         | (convert) | Input key for contents to convert                                           |
| __inPath        | ((inPath)) | Path on input contents                                                      |
| __inFormat      | ((inFormat)) | Format of input contents (yaml, json, xml, ndjson, slon)                    |
| __outKey        | ((outKey)) | Output key for converted object                                             |
| __outPath       | ((outPath)) | Path on output contents                                                     |

**(questions)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-------------------|-----------------------------------------------------------------------------|
| __questions     | (questions) | Map structure for askStruct                                                 |

**(ask)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-------------------|-----------------------------------------------------------------------------|
| __question      | (ask) | Question to ask                                                             |
| __answers       | ((answers)) | Map of answers to store into args                                           |
| __force         | ((force)) | Force asking even if value is defined                                       |

**(oafp)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-------------------|-----------------------------------------------------------------------------|
| __params        | (oafp) | Parameters to provide to oafp                                               |

**(llm)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-------------------|-----------------------------------------------------------------------------|
| __llmPrompt     | (llm) | Prompt to send to LLM model                                                 |
| __llmContext    | ((context)) | Context of input data                                                       |
| __llmInPath     | ((inPath)) | Path to consider from __llmInKey                                            |
| __llmInKey      | ((inKey)) | Key for input data                                                          |
| __llmEnv        | ((env)) | Environment variable for $llm options                                       |
| __llmOptions    | ((options)) | Options for $llm                                                            |
| __llmOutPath    | ((outPath)) | Path to store result                                                        |
| __llmDebug      | ((debug)) | Print job execution parameters                                              |

**(secget)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-------------------|-----------------------------------------------------------------------------|
| secKey          | (secget) | SBucket key                                                                 |
| secRepo         | ((secRepo)) | SBucket repository                                                          |
| secBucket       | ((secBucket)) | SBucket name                                                                |
| secPass         | ((secPass)) | SBucket password                                                            |
| secOut          | ((secOut)) | Args path to map secret                                                     |
| secMainPass     | ((secMainPass)) | SBucket repository password                                                 |
| secFile         | ((secFile)) | SBucket file                                                                |
| secDontAsk      | ((secDontAsk)) | Don't ask for passwords                                                     |
| secIgnore       | ((secIgnore)) | Ignore errors for missing sec parameters                                    |
| secEnv          | ((secEnv)) | Retrieve secret from env variable                                           |

**(query)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-------------------|-----------------------------------------------------------------------------|
| __query         | (query) | Query map for ow.obj.filter or af.fromNLinq                                 |
| __type          | ((type)) | Type of query (path, sql, nlinq)                                            |
| __from          | ((from)) | Path to args key to query                                                   |
| __to            | ((to)) | Path to store results in args                                               |
| __toKey         | ((toKey)) | Key to set results                                                          |
| __key           | ((key)) | Key for input/output                                                        |

**(optionOn)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-------------------|-----------------------------------------------------------------------------|
| __optionOn      | (optionOn) | Variable in args to define which todos to add                               |
| __lowerCase     | ((lowerCase)) | Compare optionOn in lower case                                              |
| __upperCase     | ((upperCase)) | Compare optionOn in upper case                                              |
| __todos         | ((todos)) | Map of option values to todo arrays                                         |
| __default       | ((default)) | Default array of todos                                                      |
| __async         | ((async)) | Run todos in async mode                                                     |

**(state)**
| Argument        | Shortcut argument | Description                                                                 |
|-----------------|-------------------|-----------------------------------------------------------------------------|
| __state         | (state) | State to change to                                                          |

---

## Examples

```yaml
todo:
# Security operations
- (secget     ): "mySecretKey"
  ((secRepo  )): "secrets"
  ((secBucket)): "app-secrets"

# Print markdown
- (printmd): |
    # Status Report
    Current status: {{status}}
  
# Function execution  
- (fn    ): "myFunction"
  ((args)): { param: "value" }
  
# Split operations
- (split    ): "item1,item2,item3"
  ((sep    )): ","
  ((outPath)): "items"
  
# Options/switch operations
- (options): "environment"
  ((dev  )):
  - "Development Job"
  ((prod )):
  - "Production Job"
  
# Environment variable setting
- (setenvs):
    DATABASE_URL: "{{config.db.url}}"
    API_KEY: "{{secrets.apikey}}"
    
# Job planning and checking
- (check    ): "Validation Job"
  ((actions)):
    create: "Create Resource"
    update: "Update Resource"
    
# Find and replace operations
- (replace  ): "input text"
  ((replace)): "old"
  ((with   )): "new"
  ((outPath)): "result"

# OAFP (OpenAF Processing) operations
- (oafp     ): "data"
  ((from   )): "json"
  ((to     )): "yaml"
  ((outPath)): "convertedData"
```

### Example 1: Basic Hello World

```yaml
help:
  text: "A simple Hello World example"
  
jobs:
- name: "Hello World"
  exec: |
    print("Hello, World!")
```

### Example 2: File Processing with Arguments

```yaml
help:
  text: "Processes a file and outputs results"
  expects:
  - name: inputFile
    desc: "The file to process"
  - name: outputDir
    desc: "Where to save the results"

init:
  outputDir: "/tmp/results"

ojob:
  logToConsole: true

jobs:
- name: "Process File"
  exec: |
    var lines = readFile(args.inputFile).split("\n");
    var result = lines.length;
    writeFile(args.outputDir + "/result.txt", "Line count: " + result);
```

### Example 3: Conditional Execution

```yaml
help:
  text: "Runs different jobs based on the environment"

jobs:
- name: "Setup"
  exec: |
    if (args.env == "prod") {
      // Production setup
    } else {
      // Development setup
    }
```

### Example 4: Parallel Job Execution

```yaml
help:
  text: "Processes multiple files in parallel"

jobs:
- name: "List files"
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
      // Executes the array of jobs defined in the 'each' parameter with the 'file' map
      each(file)   
    })

- name: Process file
  exec: | #js
    print(`  🗂️ file ${args.canonicalPath} with ${args.size} bytes processed.`)
```

The `each` section allows a job to call other jobs in parallel for each element in a list or array:



### Example 5: Using Templates

```yaml
help:
  text: "Demonstrates the use of templates in oJob"

jobs:
- name: "Generate Config"
  args:
    env: "production"
  exec: |
    var template = "server {\n  listen 80;\n  server_name {{domain}};\n}\n";
    var data = { domain: "example.com" };
    var config = templify(template, data);
    writeFile("/etc/nginx/conf.d/example.com.conf", config);
```

### Example 6: Error Handling

```yaml
help:
  text: "Shows how to handle errors in oJob"

jobs:
- name: "Faulty Job"
  catch: | #js
    logErr("Job failed: " + exception)
    // Handle error, return false to propagate
    return true  // Error handled
  exec : | #js
    if (Math.random() > 0.5) {
        throw "Random failure"
    }
```

### Example 6.5: Default Arguments

```yaml
help:
  text: "Demonstrates default argument values"
  expects:
  - name: environment
    desc: "Environment to deploy to (dev, staging, prod)"
    example: "dev"
  - name: database_host
    desc: "Database server hostname"
    example: "db.example.com"
  - name: api_port
    desc: "Port for the API server"
    example: "3000"

jobs:
- name: "Configuration Setup"
  args:
    # Environment defaults to "development" if not provided
    env: "${environment:-development}"
    # Database connection with nested path fallback
    dbHost: "${config.database.host:-localhost}"
    dbPort: "${config.database.port:-5432}"
    dbName: "${config.database.name:-myapp}"
    # API configuration with fallbacks
    apiPort: "${api_port:-3000}"
    apiHost: "${api_host:-0.0.0.0}"
    # Service URLs with environment-based defaults
    logServiceUrl: "${log_service_url:-http://localhost:8080/logs}"
    # Feature flags with boolean defaults  
    enableDebug: "${debug_mode:-false}"
  exec: | #js
    log("Environment: " + args.env)
    log("Database: " + args.dbHost + ":" + args.dbPort + "/" + args.dbName)
    log("API Server: " + args.apiHost + ":" + args.apiPort)
    log("Log Service: " + args.logServiceUrl)
    log("Debug Mode: " + args.enableDebug)
    
    // Configuration object for other jobs to use
    args.config = {
      environment: args.env,
      database: {
        host: args.dbHost,
        port: parseInt(args.dbPort),
        name: args.dbName
      },
      api: {
        host: args.apiHost,
        port: parseInt(args.apiPort)
      },
      services: {
        logging: args.logServiceUrl
      },
      features: {
        debug: args.enableDebug === "true"
      }
    }

todo:
- name: "Configuration Setup"
  args:
    # Only provide some values, others will use defaults
    environment: "staging"
    api_port: "4000"
    config:
      database:
        host: "staging-db.example.com"
        name: "staging_myapp"
```

### Example 7: Using Multiple Languages

```yaml
help:
  text: "Demonstrates using different languages in jobs"

jobs:
# Python
- name: "Python Job"
  lang: python
  exec: | #python
    import json
    print("Python is running")
    args['pythonResult'] = 'success'
  
# Shell/Bash
- name: "Shell Job"
  lang: shell
  exec: | #shell
    echo "Running shell command"
    # To use input args
    # echo $aInputArgs
    # OR
    # echo {{aInputArgs}}
    export RESULT="shell-success"
    # To output args
    echo '{"shellResult": "'$RESULT'"}'
  
# SSH Remote
- name    : "Remote SSH Job"
  lang    : ssh
  exec    : | #shell
    echo "Running on remote server"
    hostname
  typeArgs:
    shell: "/bin/bash"
  
# PowerShell
- name: "PowerShell Job"
  lang: powershell
  exec: | #powershell
    Write-Host "PowerShell is running"
    $_args.psResult = "success"
  
# Go
- name: "Go Job"
  lang: go
  exec: | #go
    fmt.Println("Go is running")
    args["goResult"] = "success"
  
# Ruby
- name: "Ruby Job"
  lang: ruby
  exec: | #ruby
    puts "Ruby is running"
    args['rubyResult'] = 'success'
  
# Node.js
- name: "Node Job"
  lang: node
  exec: | #js
    console.log("Node.js is running")
    args.nodeResult = "success"
```

### Example 8: Job Dependencies

```yaml
help:
  text: "Demonstrates job dependencies"

jobs:
- name: "Main Job"
  deps:
  - "Setup Job"
  - name     : "Config Job"
    onSuccess: | #js
        log("Config loaded")
    onFail   : | #js
        log("Config failed")
        return false  # Stop execution
  exec: | #js
    log("All dependencies satisfied")
```

### Example 9: Job Each Processing

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
      // Executes the array of jobs defined in the 'each' parameter with the 'file' map
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

### Example 10: State Management

```yaml
todo:
- (state): "initializing"
- name   : "State Dependent Job"
  when   : "initializing"
- (state): "processing"
- name   : "Processing Job"
  when   : "processing"
```

### Example 11: Metrics Collection

```yaml
ojob:
  metrics:
    add:
      processedItems: | #js
        return { count: $get("processedCount") || 0 }

jobs:
- name: "Metric Updating Job"
  exec: | #js
    ow.oJob.setMetric("processedItems", {
        type: "processedItems",
        count: args.itemCount
    })
```

### Example 12: Channel Operations

```yaml
jobs:
- name: "Channel Writer"
  exec: | #js
    $ch("dataChannel").set(
        { id: args.id },
        { data: args.data, timestamp: now() }
    )
  
- name: "Channel Reader"
  exec: | #js
    var data = $ch("dataChannel").getAll()
    args.results = data
```

### Example 13: Template Processing

```yaml
jobs:
- name: "Template Job"
  exec: | #js
    var template = "Hello {{name}}, welcome to {{app}}!"
    var data = { name: args.userName, app: "oJob" }
    args.message = templify(template, data)
```

### Example 14: Job Shortcut Support

oJob supports shortcut definitions that create convenient shorthand syntax for jobs:

```yaml
jobs:
- name    : "My Custom Job"
  typeArgs:
    shortcut:
      name  : "mycustom"       # Creates (mycustom) shortcut
      keyArg: "inputValue"     # Main argument for the shortcut
      args  :                  # Mapping of shortcut args to job args
        output: "__output"     # Creates ((output)) shortcut arg
        format: "__format"     # Creates ((format)) shortcut arg
  exec    : | #js
    // Job logic here
```

- **Adding a shortcut to an existing job**
  1. Add a `typeArgs.shortcut` map to the job you want to expose through shortcut syntax.
  2. Set `name` to the identifier that will become `(name)` in the `todo` list.
  3. Use `keyArg` when you want the unnamed value after `(name)` to feed a specific job argument.
  4. Map each named shortcut argument `((arg))` to the underlying job argument in the `args` map.
  5. Configure optional fields such as `nolog: true` to inherit additional behaviour.

  Refer to [`docs/ojob-all.yaml`](./ojob-all.yaml) for the complete structure of `typeArgs.shortcut`, including optional fields like `nolog` and detailed comments about each entry. A practical example lives in [`ojob.yaml`](../ojob.yaml) where the `ojob pass` job publishes the `(pass)` shortcut by mapping its `__args`, `__debug`, and `__templateArgs` parameters so they can be provided directly from shortcut notation.

Usage in todo:
```yaml
todo:
- (mycustom): "input data"
  ((output)): "result"
  ((format)): "json"
```

### Example 15: Job Security Features

```yaml
jobs:
- name: "Secure Job"
  exec: | #js
    // Access secure data using SBucket
    var secret = $sec("mysecrets", "mypassword").get("apikey")
    
todo:
- (secget     ): "database.password"
  ((secRepo  )): "myrepo"
  ((secBucket)): "secrets"
```

### Example 16: Job Markdown Support

```yaml
todo:
- (printmd   ): | #handlebars
    # Status Report
    
    Processing completed with {{results.count}} items.
    
    ## Results:
    {{#each results.items}}
    - **{{name}}**: {{status}}
    {{/each}}
  ((outputMD)): false  # Parse as markdown (default)
```

### Example 17: Job LLM Integration

```yaml
jobs:
- name: "AI Analysis"
  exec: | #js
    var prompt = "Analyze this data and provide insights"
    var result = $llm().withContext(args.data, "sales data").promptJSON(prompt)
    args.analysis = result

todo:
- (llm      ): "Summarize the following data in 3 bullet points"
  ((inKey  )): "salesData"
  ((inPath )): "records"
  ((context)): "monthly sales figures"
  ((outPath)): "summary"
```

> Use the OAF_MODEL environment variable to specify the LLM model to use similarily to OAFP_MODEL

### Example 18: Job State Management

```yaml
jobs:
- name    : "State Dependent Job"
  typeArgs:
    when: ["processing", "ready"]  # Only run in these states
  exec    : |
    // This job only runs when state is 'processing' or 'ready'
    
todo:
- (state): "initializing"
- "Setup Job"
- (state): "processing" 
- "State Dependent Job"
```

### Example 19: Additional Built-in Jobs

```yaml
todo:
# Security operations
- (secget     ): "mySecretKey"
  ((secRepo  )): "secrets"
  ((secBucket)): "app-secrets"

# Print markdown
- (printmd    ): |
    # Status Report
    Current status: {{status}}
  
# Function execution  
- (fn    ): "myFunction"
  ((args)): { param: "value" }
  
# Split operations
- (split    ): "item1,item2,item3"
  ((sep    )): ","
  ((outPath)): "items"
  
# Options/switch operations
- (options): "environment"
  ((dev  )):
  - "Development Job"
  ((prod )):
  - "Production Job"
  
# Environment variable setting
- (setenvs):
    DATABASE_URL: "{{config.db.url}}"
    API_KEY: "{{secrets.apikey}}"
    
# Job planning and checking
- (check    ): "Validation Job"
  ((actions)):
    create: "Create Resource"
    update: "Update Resource"
    
# Find and replace operations
- (replace  ): "input text"
  ((replace)): "old"
  ((with   )): "new"
  ((outPath)): "result"
  
# OAFP (OpenAF Processing) operations
- (oafp     ): "data"
  ((from   )): "json"
  ((to     )): "yaml"
  ((outPath)): "convertedData"
```

### Example 20: Advanced Monitoring and Metrics

```yaml
ojob:
  daemon: true
  metrics:
    active :
      nattrmon:
        url       : "http://monitor:7777/remote"
        attrPrefix: "DataPipeline/"
        periodInMs: 30000
    collect:
      ch    : "metricsHistory"
      period: 10000
      some  : ["mem", "cpu", "custom-throughput"]
    add    :
      custom-throughput: | #js
        return { 
          value: $get("processedFiles") || 0,
          timestamp: now() 
        }

jobs:
- name    : "Health Check"
  type    : periodic
  typeArgs:
    cron     : "*/30 * * * * *"  # Every 30 seconds
    cronCheck: |
      return ow.oJob.getState() === "running"
  exec    : | #js
    var health = {
      status: "healthy",
      uptime: now() - $get("startTime"),
      processed: $get("processedFiles") || 0
    }
    $ch("health").set("current", health)

- name    : "Cleanup Old Files"
  type    : periodic  
  typeArgs:
    cron: "0 0 2 * * *"  # Daily at 2 AM
  exec    : | #js
    var cutoff = now() - (7 * 24 * 60 * 60 * 1000)  # 7 days ago
    // Cleanup logic here

todo:
- (state): "running"
- "Health Check"
- "Cleanup Old Files"
```

### Example 21: Cron Reliability & Retries (cronCheck)

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

### Example 22: Integrity, Auditing & Change Detection

Provide hashes to detect tampering and enable auditing flags:

```yaml
ojob:
  integrity:
    list:
    - dep.yaml: sha256:abcd...
    warn: true
```
Set env `OJOB_CHECK_JOB_CHANGES=true` / `OJOB_CHECK_JOB_REMOVAL=true` for dynamic mutation warnings.

### Example 23: Environment Variable Injection

`ojob.argsFromEnvs: true` converts all environment variables to args (lowercased + underscores). Use `initTemplateEscape: true` to preserve literal handlebars in `init`.

### Example 24: Global vs Job catch

`ojob.catch` defines a fallback error handler (vars: exception, job, args, id). Individual jobs can also declare `catch:` overriding it.

### Example 25: Unique Execution Control

```yaml
ojob:
  unique:
    pidFile     : service.pid
    killPrevious: true
```

Rejects concurrent instances (or replaces prior if `killPrevious`). Runtime control args: `stop`, `restart`, `forcestop`, `status`.

### Example 26: Channel Exposure Auditing

`ojob.channels.audit: true` (or template string) logs HTTP channel operations with key & user info.

### Example 27: Structured JSON Logs

Enable with env `OJOB_JSONLOG=true` or:
```yaml
ojob:
  log:
    format: json
```

### Example 28: cronInLocalTime

`ojob.cronInLocalTime: true` evaluates cron schedules using local timezone.

### Example 29: Code Embedding Precedence

When a file name exists under `code:` its content overrides filesystem counterparts for `execFile` / `execRequire` resolution, enabling fully self-contained distributions.

### Example 30: Arg Parallelism Control

Array args run in parallel unless `typeArgs.single: true` or global `numThreads <= 1`. Use for rate-limited APIs or ordered processing.

### Example 31: Timeout & stopWhen

`typeArgs.timeout` enforces a max duration; if exceeded an exception is raised. `typeArgs.stopWhen` (function) is evaluated on timeout to allow graceful termination.

### Example 32: Locks (`lock` / `lockCh`)

Mutual exclusion across async jobs sharing the same `typeArgs.lock` name; defaults to channel `oJob::locks`. Customize storage via `lockCh` for distributed scenarios.

### Example 33: Inspect Internal Job Log

```javascript
print($ch('oJob::log').getAll())
```

### Example 34: Flag Overrides in YAML

```yaml
ojob:
  flags:
    OJOB_CHECK_JOB_CHANGES: true
    OJOB_CHECK_JOB_REMOVAL: true
```

See `openaf-flags.md` for exhaustive list.
