# ow.python

[Home](../../index.md) / [All APIs](../../all-apis.md) / [ow](../index.md) / [ow.python](index.md)

<a id="api-ow-python-exec-8dce7d23"></a>

## ow.python.exec

### ow.python.exec(aPythonCode, aInput, aOutputArray, throwExceptions, shouldFork) : Map

Exchanges JSON values via named Python variables. Names must be ASCII identifiers and not keywords. A started embedded server preserves variables, imports and functions across serialized calls; otherwise a fresh process is used. shouldFork=true isolates a call. Errors print by default; throwExceptions=true throws on stderr, nonzero exits or bridge failures. Missing results return undefined.

Sources:

- js/owrap.python.js:409

<a id="api-ow-python-execpm-0fca482b"></a>

## ow.python.execPM

### ow.python.execPM(aPythonCode, aInput, throwExceptions, shouldFork) : Map

Exchanges a JSON map through &#95;&#95;pm. Mutate &#95;&#95;pm to return values. Uses the persistent server when started; shouldFork=true runs an isolated process. Errors print by default; throwExceptions=true throws on stderr, nonzero exits or bridge failures. Failed calls without a result return undefined.

Sources:

- js/owrap.python.js:397

<a id="api-ow-python-execstandalone-b33bd8ae"></a>

## ow.python.execStandalone

### ow.python.execStandalone(aPythonCodeOrFile, aInput, throwExceptions, aArgv) : Map

Executes a .py file or inline code in standalone mode with callbacks. Returns a process result with exitcode, inherits stdin and streams stdout/stderr (the returned output strings are empty). aInput is reserved. Explicit aArgv overrides OAF&#95;PY&#95;ARGC/OAF&#95;PY&#95;ARG&#95;n. File execution preserves &#95;&#95;file&#95;&#95;, &#95;&#95;name&#95;&#95;, sys.argv&#91;0&#93;, script import directory and future imports. throwExceptions defaults to false; true throws on stderr or a nonzero exit. Stop the bridge when done.

Sources:

- js/owrap.python.js:422

<a id="api-ow-python-getversion-b65381c5"></a>

## ow.python.getVersion

### ow.python.getVersion() : Number

Returns the Python major version (2 or 3), or -1 after failed detection.

Sources:

- js/owrap.python.js:341

<a id="api-ow-python-reset-28dc5445"></a>

## ow.python.reset

### ow.python.reset(noException, tryOthers)

Detects the configured interpreter using --version. tryOthers enables python3 fallback. noException records failure as version=-1. The successful interpreter is retained. Stop the bridge before resetting.

Sources:

- js/owrap.python.js:305

<a id="api-ow-python-setpython-d8254ac3"></a>

## ow.python.setPython

### ow.python.setPython(aPythonPath)

Selects and detects the interpreter executable. Stop the bridge first. Paths may contain spaces.

Sources:

- js/owrap.python.js:329

<a id="api-ow-python-startserver-22d57fd1"></a>

## ow.python.startServer

### ow.python.startServer(aPort, aSendPort, aFn, isAlone) : String

Acquires a bridge reference, returning its token. Embedded mode owns a persistent, serialized Python namespace. isAlone=true starts only the callback listener for standalone scripts. Modes cannot be mixed until stopped. aFn receives connect, exec and error events. Startup has a bounded readiness check.

Sources:

- js/owrap.python.js:162

<a id="api-ow-python-stopserver-01dda6ce"></a>

## ow.python.stopServer

### ow.python.stopServer(aPort, force) : Boolean

Releases one explicit start reference. Stops owned resources at zero, or immediately with force=true. Returns true only when resources were stopped; repeated stops return false. aPort is retained for compatibility.

Sources:

- js/owrap.python.js:259

