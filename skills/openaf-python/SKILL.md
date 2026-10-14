---
name: openaf-python
description: Implement and debug OpenAF-to-Python and Python-to-OpenAF workflows, including data exchange, persistent sessions, callbacks, standalone scripts, CLI arguments, and Python oJob steps.
---

# Python integration

Use this skill independently by copying the folder or supplying this file as instructions.
Execution requires OpenAF and an external Python interpreter; code generation does not require
a checkout. If execution is unavailable, provide runnable code and state that it is untested.

Read the [Python guide](https://github.com/openaf/openaf/blob/master/docs/python.md) for contracts,
[implementation and API help](https://github.com/openaf/openaf/blob/master/js/owrap.python.js)
for version-sensitive behavior, and [protocol](https://github.com/openaf/openaf/blob/master/docs/dev/python-oaf-server.md)
only when working on transport. These links follow master: compare with `openaf -c 'print(getVersion())'`
and installed help. Older JARs may not include repaired persistence, exception forwarding or the
fourth standalone argv argument. Do not promise those behaviors without checking the runtime.

## Choose the mode and owner

- `ow.loadPython(); ow.python.exec(code, input, outputNames, throwExceptions, shouldFork)` exchanges
  JSON-compatible values through named Python variables. Without a server it uses a fresh process.
- `startServer()` followed by `exec`/`execPM` preserves imports, variables and functions in a serialized
  session. Each explicit start acquires a reference; pair it with `stopServer()` in `finally`.
  `stopServer(__, true)` forces cleanup. Stop before changing modes or interpreters.
- `$py(codeOrFile, input, outputNames, throwExceptions, shouldFork)` implicitly starts the global
  session once. `$pyStop()` forces global cleanup, so use it only when owning that session.
  `shouldFork=true` isolates one execution while allowing callbacks to an existing listener.
- `execPM(code, input, throwExceptions, shouldFork)` exposes input as `__pm`. Mutate `__pm`, then
  assign the returned map; it does not mutate the original JS input object.
- `execStandalone(codeOrFile, reservedInput, throwExceptions, argv)` runs a whole script with
  callbacks and returns a process map containing `exitcode`. `reservedInput` is unused. It starts
  standalone mode when needed; stop it in `finally`. `$pyExec` forwards the same arguments.

Configure `OAF_PYTHON` or call `setPython("/path/to/python3")` before starting. The value is an
executable path, not a shell command containing flags. `reset(false, true)` probes the configured
interpreter and then `python3`; `getVersion()` returns 2 or 3. The bridge retains Python 2 syntax
compatibility, but verify on Python 2 if required. `OAF_PYTHON_VER` is an assumption until detection.

## Exchange data and callbacks

Use input maps instead of concatenating values into Python source. Output names and input keys
must be ASCII Python identifiers, not keywords or names starting `__oaf_`. Values must serialize
as JSON; return plain data rather than functions or class instances. Persistent calls run serially;
failed code can leave state changes behind, and background Python threads are outside output isolation.

Python `_oaf(expression)` (alias `_`) evaluates JavaScript in the owning OpenAF process; `_g(key)`
and `_s(key, value)` access its `$get`/`$set` store. `_d(value)` JSON-encodes a Python value. These
callbacks require a running bridge and evaluate trusted code. Keys are quoted by the helpers.

Runnable round trip (also in [examples/round-trip.js](examples/round-trip.js)):

```javascript
ow.loadPython();
ow.python.setPython("python3");
ow.python.startServer();
try {
  var input = { text: "quote' slash\\ line\n雪 😀" };
  var result = ow.python.exec(
    "_s('python-demo', value)\nresult = _g('python-demo')",
    { value: input }, ["result"], true
  );
  ow.loadTest();
  ow.test.assert(result.result, input, "Exact callback round trip");
  print(stringify(result.result));
} finally {
  $unset("python-demo");
  ow.python.stopServer();
}
```

## Files, CLI and inverse integration

`pyoaf "script name.py" "argument with spaces" --help` or
`oaf --py "script name.py" "argument with spaces" --help` preserves Python arguments and returns
Python's exit status. Put OpenAF options before `--py`. `--py -e script.py` remains a legacy form.
Standalone files retain `__file__`, `__name__`, `sys.argv` and sibling imports; future imports work
because user code is compiled separately. An explicit fourth argv array (even `[]`) overrides
`OAF_PY_ARGC`/`OAF_PY_ARG_<n>`; omitted argv uses those legacy environment variables.

For Python → OpenAF, generate `oaf --oafpy > oaf.py`, then use
`from oaf import _oaf, _g, _s`. Import owns an OpenAF child, checks initialization and registers exit
cleanup. Regenerate after changing OpenAF installations. No external Python package is required.

## oJob and errors

Use `lang: python` with `exec: |`, or `typeArgs.execPy: path/to/script.py`. The code receives `args`
as a dictionary and `id`; update `args['key']` to return job values. Both routes request exception
propagation. The engine owns the shared session until shutdown; individual jobs must not stop it.
Set `typeArgs.noTemplate: true` when Python contains literal template syntax. See the
[oJob guide](https://github.com/openaf/openaf/blob/master/docs/ojob.md) for scheduling and error handlers.

`throwExceptions` defaults to false: stderr/errors print and missing results return undefined.
Set it true when the caller must fail on Python errors, stderr, nonzero status or bridge failures.
Even warnings on stderr trigger exceptions. Standalone calls return `exitcode`; inspect it when
not throwing. Keep cleanup in `finally`. Report Python 2 and Windows checks separately from tests
on Python 3 or Unix; successful source tests do not verify an older installed JAR.
