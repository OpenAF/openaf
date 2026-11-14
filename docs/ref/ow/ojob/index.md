# ow.oJob

[Home](../../index.md) / [All APIs](../../all-apis.md) / [ow](../index.md) / [ow.oJob](index.md)

<a id="api-ow-ojob-addjob-e994d211"></a>

## ow.oJob.addJob

### ow.oJob.addJob(aJobsCh, aName, jobDeps, jobType, aJobTypeArgs, jobArgs, jobFunc, jobFrom, jobTo, jobHelp, jobCatch, jobEach, jobLang, jobFile, jobCheck)

Provided aJobsCh (a jobs channel) adds a new job with the provided aName, an array of jobDeps (job dependencies), a jobType (e.g. simple, periodic, shutdown), aJobTypeArgs (a map), jobArgs and a jobFunc (a job function).  Optionally you can inherit the job definition from a jobFrom and/or jobTo name ("from" will execute first, "to" will execute after). Also you can include jobHelp.

Sources:

- js/owrap.oJob.js:3414

<a id="api-ow-ojob-addtodo-3023f13c"></a>

## ow.oJob.addTodo

### ow.oJob.addTodo(aOJobID, aJobsCh, aTodoCh, aJobName, aJobArgs, aJobType, aJobTypeArgs)

Provided aOJobID (a oJob instance), aJobsCh (a jobs channel), aTodoCh (a todo channel), aJobArgs (job arguments). Optionally you can force the aJobType and aJobTypeArgs.

Sources:

- js/owrap.oJob.js:3886

<a id="api-ow-ojob-askonhelp-b0833ccf"></a>

## ow.oJob.askOnHelp

### ow.oJob.askOnHelp(aHelpMap, aUI) : Map

Collects job arguments interactively. Pass an askConsole-compatible UI to borrow its terminal, or true to open an independent terminal and close it on completion. Without aUI, retains the default process console and output.

Sources:

- js/owrap.oJob.js:2251

<a id="api-ow-ojob-getincludes-dfc79e9a"></a>

## ow.oJob.getIncludes

### ow.oJob.getIncludes(aFile) : Map

Returns a map with include and jobsInclude arrays (if any).

Sources:

- js/owrap.oJob.js:1553

<a id="api-ow-ojob-getjobsch-f5b543ed"></a>

## ow.oJob.getJobsCh

### ow.oJob.getJobsCh() : Channel

Gets the oJob::jobs channel

Sources:

- js/owrap.oJob.js:1665

<a id="api-ow-ojob-getlogch-468e1458"></a>

## ow.oJob.getLogCh

### ow.oJob.getLogCh() : Channel

Gets the oJob::log channel

Sources:

- js/owrap.oJob.js:1679

<a id="api-ow-ojob-getmainch-dd7f0682"></a>

## ow.oJob.getMainCh

### ow.oJob.getMainCh() : Channel

Gets the oJob::oJob channel

Sources:

- js/owrap.oJob.js:1686

<a id="api-ow-ojob-getmetric-9fb90c6d"></a>

## ow.oJob.getMetric

### ow.oJob.getMetric(aMetricId)

Retrieves the current metric identified by aMetricId

Sources:

- js/owrap.oJob.js:2843

<a id="api-ow-ojob-getmetrics-a13f1fb5"></a>

## ow.oJob.getMetrics

### ow.oJob.getMetrics(aType) : Function

Returns a function to be used with ow.metrics.add to add functions by metric aType

Sources:

- js/owrap.oJob.js:2868

<a id="api-ow-ojob-getmetricsch-bd36f588"></a>

## ow.oJob.getMetricsCh

### ow.oJob.getMetricsCh() : Channel

Gets the oJob::metrics channel

Sources:

- js/owrap.oJob.js:1693

<a id="api-ow-ojob-getrawincludes-7e7caa65"></a>

## ow.oJob.getRawIncludes

### ow.oJob.getRawIncludes(aFile) : Map

Returns a map with include and jobsInclude arrays from the raw file (no include resolution).

Sources:

- js/owrap.oJob.js:1585

<a id="api-ow-ojob-getstate-37cf5bca"></a>

## ow.oJob.getState

### ow.oJob.getState() : String

Get current global state, if defined.

Sources:

- js/owrap.oJob.js:2814

<a id="api-ow-ojob-gettodoch-b8e25a7b"></a>

## ow.oJob.getTodoCh

### ow.oJob.getTodoCh() : Channel

Gets the oJob::todo channel

Sources:

- js/owrap.oJob.js:1672

<a id="api-ow-ojob-isencrypteddefinition-352f39d8"></a>

## ow.oJob.isEncryptedDefinition

### ow.oJob.isEncryptedDefinition(aFile) : boolean

Returns true if aFile ends with .yaml.enc or .json.enc (query/hash ignored).

Sources:

- js/owrap.oJob.js:1541

<a id="api-ow-ojob-loadfile-09decaf5"></a>

## ow.oJob.loadFile

### ow.oJob.loadFile(aFile, args, aId)

Loads the configuration from a YAML or JSON `aFile` and loads all configuration.
Optionally you can provide `aId` to segment these specific jobs.

Example of YAML:

```yaml
# Name your includes
#
include:
  - hello.js   # Some nice hello function

# Define the jobs
jobs:
   # Start processing
   - name        : Start processing
     exec        : >
        log("init");
        //sprint(ow.oJob.getJobsCh().getAll());

# Stop processing
   - name        : Stop processing
     type        : shutdown
     exec        : >
        log("done");
        sprint(ow.oJob.getLogCh().getAll());

# Hello world after start processing
   - name	      : Hello world
     deps          :
        - Start processing
     exec 	      : >
        sprint(args);
        hello("nuno");

# Bye world
   - name        : Bye
     deps        :
        - Hello world
        - Say the time
     exec        :
        print("bye, nice to meet you.");

# Say the time regularly
   - name        : Say the time
     type        : periodic
     typeArgs    :
        timeInterval   : 1000
        waitForFinish  : true
        cron           : "*\/5 * * * * *"
     exec        : >
        print(new Date());

# List what to do
todo:
   - Start processing
   - Say the time
   - Hello world
   - Bye
   - Stop processing

# This will be a daemon
ojob:
   daemon: false
   unique:
      pidFile     : helloworld.pid
      killPrevious: true
   channels:
      expose     : true
      port       : 17878
      permissions: r
      #list       :
      #  - oJob::log
      #auth       :
      #  - login: ojob
      #    pass : ojob
      #    permissions: r
```

Sources:

- js/owrap.oJob.js:1404

<a id="api-ow-ojob-loadjson-5f18f10c"></a>

## ow.oJob.loadJSON

### ow.oJob.loadJSON(aJSON, dontLoadTodos) : Object

Loads aJSON oJob configuration and returns the processed map (with all includes processed).

Sources:

- js/owrap.oJob.js:749

<a id="api-ow-ojob-loadjobs-eca6748b"></a>

## ow.oJob.loadJobs

### ow.oJob.loadJobs(aFile, args, noReturn) : Array



Sources:

- js/owrap.oJob.js:1499

<a id="api-ow-ojob-previewfile-4a90517d"></a>

## ow.oJob.previewFile

### ow.oJob.previewFile(aFile) : Map

Returns a map with a preview of the oJob configuration that would be executed with aFile.

Sources:

- js/owrap.oJob.js:1528

<a id="api-ow-ojob-run-00a28487"></a>

## ow.oJob.run

### ow.oJob.run(providedArgs, aId)

Tries to run the current loaded configuration jobs (on the corresponding channels) with the provided arguments (providedArgs). Optionally you can provide aId to segment these specific jobs.

Sources:

- js/owrap.oJob.js:2802

<a id="api-ow-ojob-runallshutdownjobs-f695bf7f"></a>

## ow.oJob.runAllShutdownJobs

### ow.oJob.runAllShutdownJobs()

Tries to run all the shutdown type jobs accumulated until now.

Sources:

- js/owrap.oJob.js:1651

<a id="api-ow-ojob-runfile-9f76483c"></a>

## ow.oJob.runFile

### ow.oJob.runFile(aFile, args, aId, isSubJob, aOptionsMap)

Loads aFile configuration and executes the oJob defined with the provided args. Optionally you can provide aId to segment these specific jobs.

Sources:

- js/owrap.oJob.js:1513

<a id="api-ow-ojob-runjob-de7e184f"></a>

## ow.oJob.runJob

### ow.oJob.runJob(aJob, provideArgs, aId)

With jobs defined try to execute/start aJob, with the provideArgs, directly passing any existing todo list.  Optionally you can provide aId to segment this specific jobs.

Sources:

- js/owrap.oJob.js:2891

<a id="api-ow-ojob-setmetric-83b023b2"></a>

## ow.oJob.setMetric

### ow.oJob.setMetric(aId, aMetricObj)

Sets aMetricObj for the metric identified with aId

Sources:

- js/owrap.oJob.js:2853

<a id="api-ow-ojob-setstate-ca0b6cc3"></a>

## ow.oJob.setState

### ow.oJob.setState(aState)

Sets the current global state to be used with todo.when

Sources:

- js/owrap.oJob.js:2826

<a id="api-ow-ojob-showhelp-3ec8fb88"></a>

## ow.oJob.showHelp

### ow.oJob.showHelp(aHelpMap, args, showAnyway) : boolean

Given a job help map and the current arguments determines if there is a need to show help usage text and shows it on stdout. Returns true if help was output, false otherwise.

Sources:

- js/owrap.oJob.js:2325

