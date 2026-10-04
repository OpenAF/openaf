# oJob YAML Reference Guide

[Index](./index.md) | [oJob Reference](./ojob.md) | [Security](./ojob-security.md) | [Flags](./openaf-flags.md) | [Recipes](./ojob-recipes.md) | [Advanced](./openaf-advanced.md)

oJob is OpenAF's job orchestration framework that allows you to define, schedule, and execute jobs using YAML configuration files. This guide describes the implementation in [owrap.oJob.js](../js/owrap.oJob.js) and the command-line entry point in [ojob.js](../js/ojob.js). Start with the runnable [recipes](./ojob-recipes.md); use the [ojob.io examples map](./ojob-examples.md) to find larger applications.

## Table of Contents

1. [Basic Structure](#basic-structure)
2. [Help Section](#help-section)
3. [Initialization](#initialization)
4. [oJob Configuration](#ojob-configuration)
5. [Todo List](#todo-list)
6. [Including Other oJobs](#including-other-ojobs)
7. [Job Definitions](#job-definitions)
   - [Basic Job Structure](#basic-job-structure)
   - [Job Types](#job-types) — simple, periodic, shutdown, subscribe, jobs (external)
   - [Job Dependencies](#job-dependencies)
8. [Code Separation](#code-separation)
9. [Built-in Jobs](#built-in-jobs)
   - [Built-in Job Shortcuts](#built-in-job-shortcuts) — `(if)`, `(parallel)`, `(each)`, etc.
   - [Built-in Jobs and Shortcut Correlation](#built-in-jobs-and-shortcut-correlation) — mapping table
   - [Built-in Job Arguments Reference](#built-in-job-arguments-reference) — per-job argument mappings
10. [Command-line Usage](#command-line-usage)
11. [State and Scheduling](#state-and-scheduling)
12. [Examples](#examples)

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

# Job definitions (can come from includes or built-ins)
jobs:
- name: "My First Job"
  exec: |
    print("Hello World!")

# Execution order
todo:
- "My First Job"
```

## Command-line Usage

Save a definition as `hello.yaml` and run `ojob hello.yaml name=World`. Arguments are available on `args`; convert numbers and booleans with `check.in` before using them. YAML and JSON definitions are supported.

| Command | Purpose |
| --- | --- |
| `ojob -h` | CLI help (not the definition's help). |
| `ojob hello.yaml -jobhelp` | Definition help. |
| `ojob hello.yaml -jobhelp Greet` | Help for the job named `Greet`; place its name last. |
| `ojob hello.yaml -i` | Prompt for arguments from `help.expects`, then execute. |
| `ojob hello.yaml name=World -f params.yaml` | Read additional arguments from YAML, JSON or SLON; put `-f` and its filename last. Explicit CLI values take precedence over file values. |
| `ojob hello.yaml -jobs` | List available job names from the expanded definition. |
| `ojob hello.yaml -todo` | List normalized todo job names. |
| `ojob hello.yaml -deps` | Show dependency and composition paths. |
| `ojob hello.yaml -compile` | Expand includes and print YAML. This does not compile JavaScript to native code. |
| `ojob hello.yaml -tojson` | Expand includes and print JSON. |
| `ojob hello.yaml -which` | Show local/oPack lookup result or an explicit URL. |
| `ojob -global` | List definitions in `OJOB_LOCALPATH`. |
| `ojob -shortcuts` | List registered shortcut mappings. |
| `ojob -shortcuts ojob output` | Filter shortcut mappings by job/shortcut name. |
| `ojob -syntax` | Show the bundled annotated YAML reference. |
| `ojob -reference` / `ojob -mdreference` | Show the bundled Markdown reference, rendered or raw. |
| `ojob hello.yaml -json` | Set `args.__format=json` for `ow.oJob.output`; ordinary `print` calls are unaffected. |
| `ojob hello.yaml -gb64json` | Set `args.__format=gb64json`. |
| `ojob hello.yaml -nocolor` | Disable ANSI job-status output. |

Inspection commands such as `-compile` use the definition loader: they resolve includes and can load oPacks and JavaScript libraries. They do not run the todo list, but they are not a side-effect-free YAML parser. `-compile`, `-tojson`, `-jobs`, `-todo`, and `-deps` refuse encrypted definitions or detected encrypted includes. See [encrypted definitions](./ojob-security.md#encrypted-definitions).

The CLI counts failed entries in `oJob::log` after execution and exits nonzero when it finds failures. A `catch` handler that returns `true` marks an error as handled; logging an error alone does not do that. Disabling job logging also affects this final error-count mechanism.

`-reference` and `-syntax` read resources inside the installed JAR. Editing this checkout's documentation changes those commands only after packaging a new JAR.

## Help Section

The help section documents the definition and drives interactive prompting. Missing arguments explicitly marked `mandatory: true` cause help to be displayed before normal execution (unless `ojob.showHelp: false`). Use `check.in` for runtime validation and defaults; `example`, `options`, and `moptions` are help/prompt metadata, not validation rules. With `-i`, `moptions` selections become a comma-separated string.

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

The `ojob` section controls how the oJob executes and behaves. The following blocks illustrate configuration groups, not a single configuration to copy wholesale. See the recipes for minimal complete definitions.

### Execution Control

```yaml
ojob:
  # Thread management
  numThreads: 4                # Force specific number of threads
  poolThreadFactor: 2          # Multiply cores by this factor
  
  # Execution behavior
  async: false                 # Execute jobs async instead of sequential
  sequential: true             # Force sequential execution
  shareArgs: true              # Pass results between sequential todos
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
  cronInLocalTime: false       # false selects UTC; true selects local time
```

`async` defaults to `false`. `async: true` forces `sequential: false`. Otherwise `sequential` defaults to `OJOB_SEQUENTIAL` (shipped as `true`), and the engine fallback for `shareArgs` in sequential mode is `OJOB_SHAREARGS` (shipped as `true`). However, `oJobRunFile` supplies `{ shareArgs: false }` when no options map is supplied, including the normal CLI path. Set these explicitly when a pipeline depends on argument sharing. `shareArgs` is the option name; `sharedArgs` is not an alias.

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
  
  # File logging (all options mirror ow.ch.utils.setLogToFile)
  logToFile:
    logFolder: "/var/log"              # Where the current log file is written (default: '.')
    filenameTemplate: "log-{{timedate}}.log"  # Template for log filename (uses timedate)
    fileDateFormat: "yyyy-MM-dd"       # Date format for filename (daily); use 'yyyy-MM-dd-HH' for hourly
    lineTemplate: "{{timedate}} | {{type}} | {{{message}}}\n"  # Template per log line
    lineDateFormat: "yyyy-MM-dd HH:mm:ss.SSS"  # Date format used inside each line
    HKRegExPattern: "log-\\d{4}-\\d{2}-\\d{2}\\.log"  # Regex to identify log files for housekeeping
    HKhowLongAgoInMinutes: 2880        # Minutes of logs to retain; older files are deleted (omit to disable)
    dontCompress: false                # Set true to skip gzip compression of older log files
    backupFolder: "/var/log/backup"    # Move older log files here (omit to keep in logFolder)
    numberOfEntriesToKeep: 100         # In-memory OpenAF log channel entries to keep
    setLogOff: false                   # Set true to suppress console logging
  
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
    strict: true               # Require a registered hash when checking is active
    warn: false                # Abort on a hash mismatch
  
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
  typeArgs:
    when: "production"       # Only run when state is "production"
  args:
    env: "prod"
```

> See below [state and scheduling](#state-and-scheduling) for more on state management.

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
- **Type preservation**: When a string value is exactly `"${key}"` the resolved value keeps its original type (number, boolean, array, object, etc.). When a token appears inside a longer string (e.g. `"prefix-${key}-suffix"`) the result is always a string.
- **Inline interpolation**: Tokens can appear anywhere inside a string value and multiple tokens may be combined — e.g. `"${host:-localhost}:${port:-8080}"`. Note that when multiple tokens are interpolated into a string context, each resolved value is converted via `String()` before concatenation.
- **Escaping**: Use a YAML single-quoted value such as '\${key}' to preserve literal `${key}`. Odd backslash counts escape substitution; even counts allow it.

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

### Include Jobs Without Their Todo

```yaml
jobsInclude:
- "job-definitions.yaml"
- "ojob.io/db/operations"
```

`include` merges the included jobs, todo, configuration, init, code and help. Included todo entries precede the including file's entries. `jobsInclude` suppresses the included `todo` and `help`, but still merges `ojob`, `init`, `code`, and jobs; it does **not** isolate configuration or library-loading effects. The including file's map values take precedence during merging.

Local paths resolve from the process working directory, with lookup in installed oPack roots and `OJOB_LOCALPATH`. Use `MyOPack::path/jobs.yaml` to identify an oPack explicitly. A bare authorized domain such as `ojob.io/...` becomes HTTPS; an extensionless remote path normally receives `.json`. See [remote loading and integrity](./ojob-security.md).

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
    log("Channel operation: " + args.op + " on " + args.ch);
    log("Key: " + stringify(args.k));
    log("Value: " + stringify(args.v));
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

`deps` checks execution status; it does not enqueue the prerequisite. Put prerequisites in `todo` too. Use `from`/`to` when you want to compose reusable code into a job. In sequential mode, list prerequisites before dependents. A dependency handler receives `args`, `job`, and `id`; returning `true` from `onFail` permits proceeding despite the failed dependency.


```yaml
jobs:
- name: "Dependent Job"
  deps:
  - "Prerequisite Job"
  - name     : "Another Prerequisite"
    onSuccess: | #js
      log("Prerequisite succeeded");
      return true;
    onFail   : | #js
      log("Prerequisite failed");
      return false; // Do not proceed after failure
  exec: | #js
    log("All dependencies satisfied")
```

### Job Arguments and Templates

`args` is the current invocation's map; `args.init` contains top-level `init`. In sequential mode with `shareArgs: true`, the previous result stored as `$get("res")` is merged into the next invocation. `$set("name", value)` / `$get("name")` provide explicitly named shared values; these are separate from properties on `args`.

Job `args` are merged during execution and can overwrite caller/todo values. Prefer `check.in` with `.default(...)` for overridable defaults. An array of argument maps runs the same job once per element; `typeArgs.single: true` processes the elements serially. This is independent of ordering between todo entries.

`ojob.templateArgs: true` enables Handlebars expansion in string arguments, with `args` as the template root: use `{{input}}`, not `{{args.input}}`. A job can opt out with `typeArgs.noTemplateArgs: true`. `${...}` argument substitution is separate and does not require Handlebars. Set `initTemplateEscape: true` when `init` contains templates intended for a later rendering step.


```yaml
jobs:
- name: "Templated Job"
  args:
    defaultValue: "hello"
    templateValue: "{{input}}-processed"
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

A whole token such as `${port}` preserves the referenced value's type. A fallback such as `${missing:-8080}` is a **string**; use `toNumber.isNumber.default(8080)` in `check.in` when a number is required. Embedded tokens, such as `http://${host:-localhost}:${port:-8080}`, produce strings. Dot paths are supported.

An unresolved whole token becomes undefined; an unresolved embedded token contributes an empty string. A token referring to its own destination key is left unchanged with a warning, even if it specifies a fallback. This is a direct self-reference check, not a general dependency resolver for chains of references.

Use YAML single quotes for escaped tokens: `'\${name}'` produces literal `${name}`. An odd number of preceding backslashes escapes substitution; an even number permits it and retains those backslashes.

### Error Handling

A job's `catch` takes precedence over `ojob.catch`; `onerror` is an alias when `catch` is absent. Handlers receive `exception`, `args`, `job`, `id`, and `deps`. Return `true` to recover and retain modified arguments. Returning `false`, returning nothing, or throwing leaves the failure unhandled. `to` is ordinary composed code, not a `finally` block: it is skipped if earlier code throws. Use JavaScript `try/finally` for per-invocation cleanup.


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

oJob supports external language runners as well as OpenAF JavaScript. Install the corresponding interpreter before using a runner. The fragments below are alternatives; SSH also needs an `args.ssh` connection map (often populated by `secget`).

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
    $_args | Add-Member -NotePropertyName psResult -NotePropertyValue "success" -Force

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
    args["goResult"] = "success"
  
# Ruby
- name: "Ruby Job"
  lang: ruby
  exec: | #ruby
    args['rubyResult'] = 'success'
  
# Node.js
- name: "Node Job"
  lang: node
  exec: | #js
    args.nodeResult = "success"
```

Without `lang`, jobs run as **OpenAF JavaScript** (`oaf`, `js`, or `javascript`), with OpenAF APIs in the current JVM. `lang: node` runs **Node.js** in a separate process: it has Node APIs and JSON arguments, not OpenAF globals. There is no TypeScript adapter.

Node, Go, Ruby, Perl, Swift, PowerShell, and Java exchange `args` through UTF-8 JSON files. stdout and stderr are logs and no longer interfere with results. A successful job must produce a JSON object; the generated wrapper does this automatically. Results merge using the existing OpenAF `merge` behavior (including array concatenation). Failed jobs never merge their result. JSON cannot represent arbitrary runtime objects or exact integers beyond JavaScript's safe range.

```yaml
jobs:
- name: Java example
  lang: java
  typeArgs:
    langTimeout: 30000
    langArgs:
      javaImports: [java.time.Instant]
      javaClasspath: []
  exec: |
    System.out.println("Java is running");
    args.put("javaResult", Instant.now().toString());
```

Java uses a JDK 21+ source launcher, defaulting to the current Java installation, and Gson from the OpenAF distribution. `exec` (or `file`) is a Java method body with `Map<String,Object> args`. JSON numbers are `Long` or `Double`; use `Number` when reading them. Imports omit the final semicolon; classpath entries are paths, not a platform-separated string. No dependencies are downloaded. Java source is literal by default; set `noTemplate: false` to opt into source templating. Other existing language defaults remain unchanged.

For these local structured runners:

| Option | Meaning |
| --- | --- |
| `typeArgs.langExecutable` | Executable name or path, overriding the adapter default; e.g. `pwsh` instead of `powershell`. |
| `typeArgs.langExecutableArgs` | Array of extra arguments before the script arguments. |
| `typeArgs.langTimeout` | Positive milliseconds covering compilation and execution; absent means unlimited. Separate from job-level `timeout`. |
| `typeArgs.pwd` | Child working directory. Paths and executable arguments containing spaces are supported. |
| `typeArgs.shellPrefix` | Prefix buffered stdout/stderr log lines after execution. |
| `typeArgs.noTemplate` | Keep source literal when true. Pass data through `args` rather than interpolating it into code. |

Temporary input, source, and result files are removed on success, failure, and timeout. Timeouts terminate the direct process and tracked descendants. OS restrictions can prevent descendant enumeration, and deliberately detached children are not a containment guarantee. The process helper reports `descendantTracking` so callers can distinguish that limitation.

`ow.oJob.getLanguages()` lists registered languages, prerequisites, and supported process options. `getLanguages(true)` additionally runs local probes with a five-second limit; it does not install software. `available: null` means the adapter has no local probe. Python retains `OAF_PYTHON` and its existing bridge configuration; new process options are rejected for Python, shell/SSH, and legacy adapters that do not advertise support.

**Migration:** built-in structured runners now require the generated result file; printing JSON alone or exiting before the wrapper finishes no longer returns arguments. stdout is always logging. Arguments are no longer copied into environment variables for these runners; use their existing `args` variable (`$_args` in PowerShell, `$args` in Perl). Source runs from a temporary file; Node's `require` resolves from the child working directory. Python retains its existing bridge. `sh`, `shell`, SSH and Kubernetes retain their current conventions, including shell `# return` support.

### Custom language adapters

Existing `ojob.langs` entries using `shell`, `pre`, `pos`, `withFile`, `returnRE`, `returnFn`, or `langFn` retain their contract, including overrides of built-in names. To use file-based argument exchange, explicitly register `protocol: json-file-v1` with an `executable`, `extension`, optional `scriptArgs`/`versionArgs`, and `pre`/`pos` wrappers. The wrapper reads `OJOB_ARGS_FILE` and writes a JSON object to `OJOB_RESULT_FILE`. `pre` receives template variables `argsFile`, `resultFile`, and `langArgs`; `pos` is literal source. Paths are also available through the environment, avoiding source quoting issues.

For adapters implementing their own protocol, `ow.oJob.runLanguageProcess(argv, {pwd, env, timeout})` returns `{stdout, stderr, exitcode, timedOut, descendantTracking}` with concurrent UTF-8 output capture. `env` overlays the inherited environment; stdin is closed. Set `processOptions: true` only when the adapter implements the documented process options. Register cleanup with `ow.oJob.registerLanguageCleanup(name, fn)`; it runs after oJob workers stop.

The optional Rust oPack retains complete Rust programs, environment arguments, and JSON stdout results, with compilation caching and bounded execution. Prolog and Kubernetes remain optional adapters with their existing interfaces.

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
      return $get("shouldStop") === true;
    lock: "myLock"           # Mutual exclusion lock
    lockCh: "oJob::locks"     # Channel for locks
  exec    : |
    // Job code here
```

`stopWhen` is compiled as a separate function, with no injected `args`, `job`, `id`, or `deps`. Use explicit shared state such as `$get("shouldStop")`. It is evaluated by the thread-box controller; it is not a cleanup callback. `timeout` is in milliseconds. `pwd` applies to supported external language runners, not JavaScript's working directory.

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

#### Validation order and supported checks

For a composed job, the order is:

```text
check._in → from / earlier → check.in → exec → check.out → to / then → check._out
```

The before/after jobs also retain their own compiled checks. Checks use methods from OpenAF's `_$` validator; see [the sigil reference](./sigil.md). Use `isString`, `isNumber`, `isMap`, `isArray`, `toNumber`, `toBoolean`, `oneOf(...)`, `match(...)`, and `default(...)` as appropriate. A chain without `default(...)` ends in a required-value assertion. Unknown method names are filtered by the compiler, so do not assume familiar validation methods from another library work here. Use explicit JavaScript assertions for checks not provided by `_$`.

```yaml
jobs:
- name: Validate request
  check:
    _in:
      config: isMap
    in:
      config.port: toNumber.isNumber.default(8080)
      mode: isString.oneOf(['fast', 'full']).default('fast')
      optionalLabel: isString.default(__)
    out:
      result: isMap
    _out:
      result.ok: isBoolean
  exec: |
    if (args.config.port < 1 || args.config.port > 65535) {
      throw "port must be between 1 and 65535";
    }
    args.result = { ok: true };
```

Quote an entire YAML scalar if the JavaScript expression includes `: `, or use a block scalar. `default(__)` allows a missing value. The `check` declarations validate/change `args`; they do not validate the YAML document itself.

### Job Inheritance

`from` (alias `earlier`) and `to` (alias `then`) compose code around the current `exec`. They accept names or todo-style maps, including shortcuts. Only the composed job needs to be in `todo`; scheduling its helper jobs separately runs those helpers again. These helpers are not separate scheduled invocations, and their job types do not turn composed code into periodic or shutdown work.


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

`execFile` (or `typeArgs.file`) reads the job body from a file. `execRequire` (or `typeArgs.execRequire`) calls the module export whose name **exactly matches the job name**, passing `args`. `ojob.execRequire` supplies a common module for jobs without inline bodies. Mutate `args` inside the exported function.

The `code` map embeds source by filename. Embedded modules enter the `require` cache; other embedded code can be resolved by `typeArgs.file`. For example:

```yaml
todo:
- Normalize

jobs:
- name: Normalize
  check:
    in:
      text: isString.default("hello")
  execRequire: handlers.js

code:
  handlers.js: |
    (function() {
      exports.Normalize = function(args) {
        args.text = args.text.toUpperCase();
        print(args.text);
      };
    })();
```

Avoid an inline `exec` when using `execRequire`: the module call is generated only when the inline body is empty. A JSON data file is not an executable job body; read it with `io.readFileJSON` or `ojob file get`.

## State and Scheduling

Set state explicitly with `(state)` or `ow.oJob.setState("ready")`; use `typeArgs.when` for jobs restricted to that state. Do not rely on an implicit initial state. `when` directly on a todo entry is not read by the dispatcher.

Periodic, subscribe, and shutdown definitions must appear in `todo` to register them. Use `ojob.daemon: true` to keep a service running after registration. `ojob.daemonFunc` is a global callback run at `ojob.timeInterval` (default 100 ms); returning `true` requests termination. It is not a job-level property and receives no job arguments.

Periodic jobs use either `typeArgs.timeInterval` in milliseconds or a cron expression; a positive interval takes precedence if both are supplied. `cronInLocalTime: true` selects local time, while `false` selects UTC. `waitForFinish: true` prevents overlapping scheduled executions. See the complete [periodic recipe](./ojob-recipes.md#7-periodic-service).

`cronCheck` is a map with `active`, `ch`, `retries`, `retryWait`, and optional `cron` (defaults to the job's cron). The channel holds `{ name, last, status, retries }`. The default channel is in memory: retaining missed-run information across restarts requires a suitable persistent channel. The failure counter starts at 1; retries continue while it is less than `retries`, and only when `retryWait` is provided. Thus `retries: 3` allows up to three attempts, including the initial attempt. This mechanism is not a general durable queue.

## Built-in Jobs

`ojob.includeOJob` defaults to `true` and loads packaged built-in jobs. Additional shortcuts such as `(httpdStart)` or `(stdioMCP)` come from included libraries (for example `oJobHTTPd.yaml` or `oJobMCP.yaml`); declaring an oPack alone does not include its job definitions.

### Built-in Job Shortcuts

A shortcut expands to an ordinary `{ name, args, typeArgs }` todo entry. Spaces before closing parentheses are allowed. Put one primary shortcut in each map; secondary keys use double parentheses. Only registered secondary keys are mapped. If a built-in has an argument without a shortcut mapping, pass it under ordinary `args`.

```yaml
ojob:
  sequential: true
  shareArgs: true
  logToConsole: false

todo:
- (pass):
    name: World
- (log): "Hello {{name}}"
- (output): args
  ((path)): name
  ((format)): json
```

Shortcuts also work inside `from` and `to`. `(run)` and `(runfile)` both run **external definitions**; use a job name directly, `(todo)`, or `$job("Name", args)` to invoke a job in the current definition.

### Built-in Jobs and Shortcut Correlation

The following mappings follow `parseTodo` in `js/owrap.oJob.js`. The CLI's `-shortcuts` output is the authority for your installed version. Built-in job metadata in `ojob.yaml` can contain additional argument names; it does not override an existing parser mapping.

| Shortcut | Job | Primary argument |
| --- | --- | --- |
| `(if)` | `ojob if` | `__condition` |
| `(parallel)` | `ojob parallel` | `todo` |
| `(pass)` | `ojob pass` | `__args` |
| `(wait)` | `ojob wait` | `time` |
| `(optionOn)` | `ojob options` | `__optionOn` |
| `(fail)` | `ojob exit` | `code` |
| `(fn)` | `ojob function` | `__fn` |
| `(check)` | `ojob check` | `_checks` |
| `(query)` | `ojob query` | `__query` |
| `(output)` | `ojob output` | `__key` |
| `(repeat)` | `ojob repeat` | `__times` |
| `(secget)` | `ojob sec get` | `secKey` |
| `(each)` | `ojob repeat with each` | `__path` |
| `(state)` | `ojob set state` | `__state` |
| `(stateOn)` | `ojob state` | `stateOn` |
| `(template)` | `ojob template` | `template` |
| `(templateFolder)` | `ojob template folder` | `—` |
| `(jobdebug)` | `ojob job debug` | `job` |
| `(jobsdebug)` | `ojob job debug` | `jobs` |
| `(log)` | `ojob log` | `msg` |
| `(printmd)` | `ojob print md` | `__text` |
| `(print)` | `ojob print` | `msg` |
| `(ch)` | `ojob channel` | `__name` |
| `(runfile)` | `ojob run file` | `__job` |
| `(get)` | `ojob get` | `__key` |
| `(set)` | `ojob set` | `__key` |
| `(unset)` | `ojob unset` | `__key` |
| `(fileget)` | `ojob file get` | `__file` |
| `(todo)` | `ojob todo` | `todo` |
| `(findReplace)` | `ojob find/replace` | `__key` |
| `(debug)` | `ojob debug` | `—` |
| `(run)` | `ojob run file` | `__job` |
| `(convert)` | `ojob convert` | `__inKey` |
| `(ask)` | `ojob ask` | `__answers` |
| `(questions)` | `ojob questions` | `__questions` |
| `(oafp)` | `ojob oafp` | `__params` |
| `(llm)` | `ojob llm` | `__llmPrompt` |

### Built-in Job Arguments Reference

Each entry lists the registered shortcut attributes and the job arguments they populate. For descriptions, inspect `ojob your.yaml -jobhelp ojob output` (substitute the full built-in job name), or consult [ojob.yaml](../ojob.yaml).

**`(if)` → `ojob if`**

If the provided "condition" is evaluated as true it will execute the "then" jobs otherwise it will execute the "else" jobs

`((then))` → `__then`; `((else))` → `__else`; `((debug))` → `__debug`.

**`(parallel)` → `ojob parallel`**

Executes an ojob sub-todo in parallel.

`((isolateArgs))` → `isolateArgs`; `((isolateJob))` → `isolateJob`; `((templateArgs))` → `templateArgs`; `((shareArgs))` → `shareArgs`; `((debug))` → `__debug`.

**`(pass)` → `ojob pass`**

Placeholder/pass job to allow for arguments injection

`((debug))` → `__debug`; `((templateArgs))` → `__templateArgs`.

**`(wait)` → `ojob wait`**

Waits for a specific amount of time

No secondary shortcut attributes.

**`(optionOn)` → `ojob options`**

Adds new "todo" entries depending on the value of a provided args variable.

`((lowerCase))` → `__lowerCase`; `((upperCase))` → `__upperCase`; `((todos))` → `__todos`; `((default))` → `__default`; `((async))` → `__async`.

**`(fail)` → `ojob exit`**

Ends all processing with an exit code

`((force))` → `force`.

**`(fn)` → `ojob function`**

Executes the provided function mapping any args to the function arguments using the odoc help available for the provided function.

`((key))` → `__key`; `((path))` → `__path`; `((fnPath))` → `__fnPath`.

**`(check)` → `ojob check`**

`((actions))` → `_actions`.

**`(query)` → `ojob query`**

Performs a query (using ow.obj.filter) to the existing args.

`((type))` → `__type`; `((from))` → `__from`; `((to))` → `__to`; `((toKey))` → `__toKey`; `((key))` → `__key`.

**`(output)` → `ojob output`**

Prints the current arguments to the console.

`((path))` → `__path`; `((format))` → `__format`; `((title))` → `__title`; `((internal))` → `__internal`; `((function))` → `__function`.

**`(repeat)` → `ojob repeat`**

Repeats sequentially, for a specific number of "times", the provided list of "jobs" (one or more)

`((todo))` → `__jobs`.

**`(secget)` → `ojob sec get`**

This job will get a SBucket secret and map it to oJob's args

`((secRepo))` → `secRepo`; `((secBucket))` → `secBucket`; `((secPass))` → `secPass`; `((secOut))` → `secOut`; `((secMainPass))` → `secMainPass`; `((secFile))` → `secFile`; `((secDontAsk))` → `secDontAsk`; `((secIgnore))` → `secIgnore`; `((secEnv))` → `secEnv`.

**`(each)` → `ojob repeat with each`**

Repeats the configured "jobs" (one or more jobs) sequentially for each element of the provided "key" list.

`((key))` → `__key`; `((todo))` → `__jobs`.

**`(state)` → `ojob set state`**

Changes the current state.

No secondary shortcut attributes.

**`(stateOn)` → `ojob state`**

Changes the current state depending on the value of a provided args variable.

`((lowerCase))` → `lowerCase`; `((upperCase))` → `upperCase`; `((validStates))` → `validStates`; `((default))` → `default`.

**`(template)` → `ojob template`**

Applies the OpenAF template over the provided data producing an output.

`((templateFile))` → `templateFile`; `((data))` → `data`; `((dataFile))` → `dataFile`; `((outputFile))` → `outputFile`; `((key))` → `__key`; `((tpath))` → `__tpath`; `((dpath))` → `__dpath`; `((outPath))` → `__outPath`; `((out))` → `__out`.

**`(templateFolder)` → `ojob template folder`**

The current parser has a misspelled primary attribute for this shortcut. Use the full job name with `args.templateFolder` instead of relying on the shortcut value.

Given a templateFolder it will execute 'ojob template' for each (recursively), with the provided data, to output to outputFolder. Optionally metaTemplate can be use where each json/yaml file in templateFolder all or part of the arguments for 'ojob template'.

`((templatePath))` → `__templatePath`; `((data))` → `data`; `((dataFile))` → `dataFile`; `((outputFolder))` → `outputFolder`; `((key))` → `__key`; `((dpath))` → `__dpath`; `((logJob))` → `logJob`; `((metaTemplate))` → `metaTemplate`.

**`(jobdebug)` → `ojob job debug`**

Provides an alternative to print based debug.

`((lineColor))` → `lineColor`; `((textColor))` → `textColor`; `((theme))` → `theme`; `((emoticons))` → `emoticons`; `((signs))` → `signs`; `((includeTime))` → `includeTime`.

**`(jobsdebug)` → `ojob job debug`**

Provides an alternative to print based debug.

`((lineColor))` → `lineColor`; `((textColor))` → `textColor`; `((theme))` → `theme`; `((emoticons))` → `emoticons`; `((signs))` → `signs`; `((includeTime))` → `includeTime`.

**`(log)` → `ojob log`**

Logs a message line given an OpenAF template

`((key))` → `__key`; `((path))` → `__path`; `((level))` → `level`; `((options))` → `options`.

**`(printmd)` → `ojob print md`**

Parses an input text as simple ascii markdown

`((outputMD))` → `__outputMD`.

**`(print)` → `ojob print`**

Prints a message line given an OpenAF template

`((key))` → `__key`; `((path))` → `__path`; `((level))` → `level`.

**`(ch)` → `ojob channel`**

Provides a set of operations over an OpenAF channel

`((op))` → `__op`; `((key))` → `__key`; `((kpath))` → `__kpath`; `((k))` → `key`; `((ks))` → `keys`; `((v))` → `value`; `((vs))` → `values`; `((vpath))` → `__vpath`; `((extra))` → `extra`.

**`(runfile)` → `ojob run file`**

Executes an external YAML/JSON ojob file or a remote URL with the provided args.

`((args))` → `__args`; `((out))` → `__out`; `((key))` → `__key`; `((inKey))` → `__inKey`; `((usePM))` → `__usePM`; `((inPM))` → `__inPM`; `((templateArgs))` → `__templateArgs`; `((debug))` → `__debug`.

**`(get)` → `ojob get`**

Retrieves a specific map key (or path) using $get

`((path))` → `__path`.

**`(set)` → `ojob set`**

Sets a "key" with the current value on a "path", or provided data, using $set

`((path))` → `__path`.

**`(unset)` → `ojob unset`**

Unsets a "key" using $unset

No secondary shortcut attributes.

**`(fileget)` → `ojob file get`**

Retrieves a specific map key (or path) from an YAML or JSON file provided.

`((path))` → `__path`; `((cache))` → `__cache`; `((ttl))` → `__ttl`; `((out))` → `__out`; `((key))` → `__key`.

**`(todo)` → `ojob todo`**

Executes an ojob sub-todo.

`((isolateArgs))` → `isolateArgs`; `((isolateJob))` → `isolateJob`; `((templateArgs))` → `templateArgs`; `((shareArgs))` → `shareArgs`; `((debug))` → `__debug`.

**`(findReplace)` → `ojob find/replace`**

Performs an in-memory find/replace on a provided string or file and outputs to args.output or, optionally, to a file.

`((path))` → `__path`; `((inputKey))` → `inputKey`; `((inputPath))` → `inputPath`; `((inputFile))` → `inputFile`; `((outputFile))` → `outputFile`; `((useRegExp))` → `useRegExp`; `((flagsRegExp))` → `flagsRegExp`; `((logJob))` → `logJob`.

**`(debug)` → `ojob debug`**

Outputs the current args and res values to help debug an ojob flow.

No secondary shortcut attributes.

**`(run)` → `ojob run file`**

Executes an external YAML/JSON ojob file or a remote URL with the provided args.

`((args))` → `__args`; `((out))` → `__out`; `((key))` → `__key`; `((inKey))` → `__inKey`; `((usePM))` → `__usePM`; `((inPM))` → `__inPM`; `((templateArgs))` → `__templateArgs`; `((debug))` → `__debug`.

**`(convert)` → `ojob convert`**

Converts string content into an internal object (map/array)

`((inPath))` → `__inPath`; `((inFormat))` → `__inFormat`; `((outPath))` → `__outPath`; `((outKey))` → `__outKey`.

**`(ask)` → `ojob ask`**

Asks for user input and stores the result into args if the args value is not yet defined.

`((question))` → `__question`; `((force))` → `__force`.

**`(questions)` → `ojob questions`**

Asks a list of questions and stores the answers into args.

No secondary shortcut attributes.

**`(oafp)` → `ojob oafp`**

No secondary shortcut attributes.

**`(llm)` → `ojob llm`**

"Executes a LLM (Local Language Model) prompt using $llm"

`((context))` → `__llmContext`; `((inPath))` → `__llmInPath`; `((outPath))` → `__llmOutPath`; `((options))` → `__llmOptions`; `((inKey))` → `__llmInKey`; `((env))` → `__llmEnv`; `((debug))` → `__llmDebug`.

The parser does not register `(options)`, `(split)`, `(replace)`, or `(setenvs)`. Use `(optionOn)` for option dispatch and `(findReplace)` for replacement, with the argument shapes documented by their jobs. `(oafp)` takes an oafp parameter **map**, for example `{ data: '[1,2]', in: json, out: yaml }`; it has no `((from))`, `((to))`, or `((outPath))` attributes. `(convert)` has `((inFormat))`, not `((outFormat))`. `(debug)` prints diagnostic data; it is not a debugger breakpoint.

### Custom Shortcuts

```yaml
todo:
- (greet): Ada
  ((prefix)): Hello

jobs:
- name: Greet
  typeArgs:
    shortcut:
      name: greet
      keyArg: person
      args:
        prefix: greeting
  check:
    in:
      person: isString
      greeting: isString.default("Hi")
  exec: |
    print(args.greeting + " " + args.person);
```

Custom shortcut names must be distinct from built-ins. Use `typeArgs.shortcut.nolog` for shortcut metadata and `typeArgs.noLog` for a job's execution logging.

## Examples

The [recipe collection](./ojob-recipes.md) provides complete examples for arguments, composition, query/output, fan-out, templates, periodic jobs, subscriptions, and error recovery. The [ojob.io examples map](./ojob-examples.md) connects those patterns to real YAML definitions and their prerequisites.
