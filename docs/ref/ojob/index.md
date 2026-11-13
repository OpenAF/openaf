# oJob

[Home](../index.md) / [All APIs](../all-apis.md) / [oJob](index.md)

<a id="api-ojob-__addlog-3c94ef97"></a>

## oJob.&#95;&#95;addLog

### oJob.&#95;&#95;addLog(aOperation, aJobName, aJobExecId, args, anErrorMessage, aId, aTypeArgs) : String

Adds a new log entry to the channel oJob::log for the `aJobName` provided for the following operations:

- `start` (start of a job)
- `success` (successfully end of a job)
- `error` (erroneous end of a job)
- `depsfail` (job not started do to failed dependencies)

Optionally, for the operation error, you can provide also `anErrorMessage`.
Returns the current `aJobExecId` (or the created one for the operation start).

Sources:

- js/owrap.oJob.js:1726

<a id="api-ojob-add2todo-a6fc77be"></a>

## oJob.add2Todo

### oJob.add2Todo(aTodo, aId) : oJob

Add a new aTodo job name or a complete aTodo object with an optional aId.

Sources:

- js/owrap.oJob.js:1705

<a id="api-ojob-addtodos-cb7a9633"></a>

## oJob.addTodos

### oJob.addTodos(aTodoList, aJobtTypeArgs, aId) : oJob

Adds a new aTodoList array of job names. Optionally you can provide aId to segment these specific jobs.

Sources:

- js/owrap.oJob.js:1676

<a id="api-ojob-getid-1f6ec467"></a>

## oJob.getID

### oJob.getID() : String

Returns this oJob instance ID. Useful to lookup logging in the oJob::log channel.

Sources:

- js/owrap.oJob.js:1635

<a id="api-ojob-getjob-84fed592"></a>

## oJob.getJob

### oJob.getJob(aJobName) : Map

Retrieves the aJobName definition map so it can be changed and overwritten with "oJob.setJob(aJobName, aJobMap)".

Sources:

- js/owrap.oJob.js:1655

<a id="api-ojob-getlanguages-0a16f6dc"></a>

## oJob.getLanguages

### oJob.getLanguages(probe) : Array

Lists registered languages, prerequisites and supported process options. With probe=true, performs local availability checks bounded to five seconds; never installs a runtime.

Sources:

- js/owrap.oJob.js:4570

<a id="api-ojob-load-e1234a36"></a>

## oJob.load

### oJob.load(aJobsList, aTodoList, aoJobList, args, aId, init, help)

Loads a set of aJobsList, corresponding aTodoList and a list of aoJobList. Optionally you can provide aId to segment these specific jobs.

Sources:

- js/owrap.oJob.js:406

<a id="api-ojob-ojob-3a59fc4d"></a>

## oJob.oJob

### oJob.oJob() : oJob

Creates an instance of an oJob. O Uses the channel oJob::log for job logging, oJob::jobs for job register, oJob::todo as job todo register and oJob::oJob for oJob instances registry.

Sources:

- js/owrap.oJob.js:5

<a id="api-ojob-registerlanguagecleanup-7bec40a8"></a>

## oJob.registerLanguageCleanup

### oJob.registerLanguageCleanup(aName, aFunction)

Registers one cleanup per adapter, run after oJob workers stop. Replacing a name replaces its callback.

Sources:

- js/owrap.oJob.js:4607

<a id="api-ojob-removejob-abee67f4"></a>

## oJob.removeJob

### oJob.removeJob(aJobName) : oJob

Removes aJobName.

Sources:

- js/owrap.oJob.js:1665

<a id="api-ojob-runlanguageprocess-b2a2c7a3"></a>

## oJob.runLanguageProcess

### oJob.runLanguageProcess(aCommand, aOptions) : Map

Runs an argv array locally with concurrent UTF-8 output capture. Options: pwd, env, timeout (positive milliseconds). Returns stdout, stderr, exitcode, timedOut and descendantTracking. Does not install runtimes or parse output.

Sources:

- js/owrap.oJob.js:4429

<a id="api-ojob-setjob-18a75b65"></a>

## oJob.setJob

### oJob.setJob(aJobName, aJob) : oJob

Adds or overwrites an existing aJobName with the configuration aJob.

Sources:

- js/owrap.oJob.js:1645

<a id="api-ojob-start-7d22471a"></a>

## oJob.start

### oJob.start(args, shouldStop, aId, isSubJob) : oJob

Starts the todo list. Optionally you can provide arguments to be used by each job. Optionally you can provide aId to segment these specific jobs.

Sources:

- js/owrap.oJob.js:2347

<a id="api-ojob-stop-ad284346"></a>

## oJob.stop

### oJob.stop()

Stops all oJob processing.

Sources:

- js/owrap.oJob.js:1999

