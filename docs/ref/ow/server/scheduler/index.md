# ow.server.scheduler

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.server](../index.md) / [ow.server.scheduler](index.md)

<a id="api-ow-server-scheduler-addentry-5910a8d6"></a>

## ow.server.scheduler.addEntry

### ow.server.scheduler.addEntry(aCronExpr, aFunction, waitForFinish) : String

Adds a new scheduler entry with a given aCronExpr"ession" that will trigger the scheduled execution of aFunction. If waitForFinish = true it will not execute until the previous execution has finished. Returns an UUID that can be used with the function modifyEntry later, if needed.

Sources:

- js/owrap.server.js:1084

<a id="api-ow-server-scheduler-modifyentry-ef52da9c"></a>

## ow.server.scheduler.modifyEntry

### ow.server.scheduler.modifyEntry(aUUID, aCronExpr, aFunction, waitForFinish) : String

Changes an existing scheduler entry (aUUID) with a given aCronExpr"ession" that will trigger the scheduled execution of aFunction. If waitForFinish = true it will not execute until the previous execution has finished.

Sources:

- js/owrap.server.js:1107

<a id="api-ow-server-scheduler-nextuuid-141c5dd5"></a>

## ow.server.scheduler.nextUUID

### ow.server.scheduler.nextUUID() : String

Returns the uuid of the next entry that will be executed.

Sources:

- js/owrap.server.js:1151

<a id="api-ow-server-scheduler-resetschthread-9ac452fa"></a>

## ow.server.scheduler.resetSchThread

### ow.server.scheduler.resetSchThread(aErrFunction)

Resets the current scheduler thread pool adding a loop cached thread that will sleep until the next execution is due. When it executes it will add a new cached thread to execute the scheduled entry by executing the entry function provided, as argument, it's uuid.

Sources:

- js/owrap.server.js:1178

<a id="api-ow-server-scheduler-scheduler-2b08e3d3"></a>

## ow.server.scheduler.scheduler

### ow.server.scheduler.scheduler()

Creates a new instance of a cron based scheduler with its own thread pool.

Sources:

- js/owrap.server.js:1054

<a id="api-ow-server-scheduler-stop-a8ce6456"></a>

## ow.server.scheduler.stop

### ow.server.scheduler.stop()

Attempts to force stop the current scheduler thread pool.

Sources:

- js/owrap.server.js:1070

<a id="api-ow-server-scheduler-timeuntilnext-2d6b467f"></a>

## ow.server.scheduler.timeUntilNext

### ow.server.scheduler.timeUntilNext() : Number

Returns the number of ms until the next scheduled execution.

Sources:

- js/owrap.server.js:1129

