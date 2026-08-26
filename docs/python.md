# Python & OpenAF

OpenAF can drive a Python interpreter as a subprocess and exchange data/code with it in several
ways, ranging from one-off variable exchange to a persistent bidirectional bridge that lets Python
call back into OpenAF. This guide covers every entry point, from JavaScript-side `ow.python` calls
to running standalone `.py` files from the command line with real `sys.argv` arguments.

## Contents
1. [How it fits together](#how-it-fits-together)
2. [ow.python - the core module](#owpython---the-core-module)
3. [Global shortcuts ($py, $pyExec, ...)](#global-shortcuts-py-pyexec-)
4. [Running .py files from the command line (--py / pyoaf)](#running-py-files-from-the-command-line---py--pyoaf)
5. [Passing command-line arguments to Python](#passing-command-line-arguments-to-python)
6. [Calling back into OpenAF from independent Python code (--oafpy)](#calling-back-into-openaf-from-independent-python-code---oafpy)
7. [Python inside oJob (lang: python)](#python-inside-ojob-lang-python)
8. [Configuration (environment variables)](#configuration-environment-variables)
9. [Choosing the right approach](#choosing-the-right-approach)

---

## How it fits together

There is no embedded Python runtime inside OpenAF (no Jython/GraalPy) - OpenAF always shells out to
a real `python`/`python3` executable found on the `PATH` (or pointed at explicitly). What changes
between the approaches below is **how code/data cross the process boundary**:

- **`ow.python.exec` / `execPM`** - short-lived `python -c ...` calls (or a persistent server for
  fast repeats) that exchange JSON-encoded *variables*, not files or argv.
- **`ow.python.execStandalone`** - runs a whole `.py` file/inline code as its own process, with a
  small bridge injected so the Python code can call back into OpenAF (`_()`, `_oaf()`, `_g()`,
  `_s()`). This is what backs the `--py` CLI option and the generated `pyoaf` launcher.
- **`--oafpy`** - the inverse direction: generates a standalone `oaf.py` module you `import` from
  Python code you run *yourself* (not via `oaf`), which spins up an OpenAF background process for
  you to call back into.

---

## ow.python - the core module

Load it once with `ow.loadPython()`, then use `ow.python`:

```javascript
ow.loadPython();

// Optional: point at a specific interpreter (default: "python", or $OAF_PYTHON)
ow.python.setPython("/usr/bin/python3");

print("Python version: " + ow.python.getVersion()); // 2 or 3
```

### exec - inject variables, capture variables

```javascript
var result = ow.python.exec(
  "c = a + b\nresult = c * 2",
  { a: 5, b: 3 },      // input variables (JSON-encoded into Python)
  ["c", "result"]      // names of Python variables to capture back
);

print(result.c);      // 8
print(result.result); // 16
```

Each call spawns a fresh `python -c ...` unless a server is already running (see below), in which
case it reuses it transparently.

### execPM - a persistent map instead of named in/out variables

`execPM` is convenient when you want to keep evolving a single object across calls instead of
naming inputs/outputs individually. The map is exposed as the Python variable `__pm`:

```javascript
var pythonMap = { counter: 0, data: [] };

pythonMap = ow.python.execPM(`
counter += 1
data.append("item_" + str(counter))
total = len(data)
`, pythonMap);

print(pythonMap.counter); // 1
print(pythonMap.data);    // ["item_1"]
print(pythonMap.total);   // 1
```

Note: `execPM` does not mutate `aInput` in place - it returns a **new** map with `__pm`'s final
state, so reassign the result (as above) if you want the update to stick.

### Server mode - fast repeated calls, state persists across calls

Starting a server keeps a single Python process alive and dispatches each `exec`/`execPM` call to
it over a local TCP socket, avoiding the cost of spawning a new interpreter each time. Top-level
Python state (variables, imports) persists between calls:

```javascript
ow.python.startServer();

var r1 = ow.python.exec("x = 10\ny = x * 2", {}, ["y"]);
var r2 = ow.python.exec("z = y + 5", {}, ["z"]); // y persists from the previous call
print(r2.z); // 25

ow.python.stopServer();
```

`startServer(aPort, aSendPort, aFn, isAlone)` accepts an optional receive port, send port, an event
callback (`"connect"`, `"exec"`, `"error"`), and `isAlone` to start only in standalone mode (used
internally by `execStandalone`, see below) without spawning a background Python listener.

### execStandalone - run a whole script (or inline code) as its own process

Unlike `exec`/`execPM`, `execStandalone` doesn't exchange variables with the caller. It runs a
`.py` file (or inline code) as a **full, independent process**, with the OpenAF bridge code
prepended so the script itself can call back into OpenAF:

```javascript
ow.loadPython();
ow.python.setPython("python3");

ow.python.execStandalone("/path/to/script.py");
```

Inside `script.py`, the bridge injects these helper functions automatically:

```python
_oaf("2 + 2")              # evaluate an OpenAF/JS expression, get the result back
_g("someVar")              # $get("someVar") from OpenAF
_s("someVar", 123)         # $set("someVar", 123) in OpenAF
```

This is the mechanism behind the `--py` CLI flag and the generated `pyoaf` launcher script
(see below) - including real command-line argument support.

---

## Global shortcuts ($py, $pyExec, ...)

For quick scripting, four global functions wrap the module above without an explicit `ow.loadPython()`:

| Function | Equivalent to | Notes |
|---|---|---|
| `$pyStart()` | `ow.loadPython(); ow.python.startServer()` | Starts the background server |
| `$py(code, input, output)` | `ow.python.exec(...)` | Starts the server first if needed |
| `$pyExec(codeOrFile, input)` | `ow.python.execStandalone(...)` | Runs standalone, no return value |
| `$pyStop()` | `ow.python.stopServer(__, true)` | Stops the background server |

```javascript
$pyStart();
var res = $py("result = a * b", { a: 6, b: 7 }, ["result"]);
print(res.result); // 42
$pyStop();
```

---

## Running .py files from the command line (--py / pyoaf)

`oaf --py <script.py> [args...]` runs a Python file directly through `ow.python.execStandalone`,
with the OpenAF bridge (`_oaf`, `_g`, `_s`, ...) available inside the script.

Running `oaf --install` (or any first-time setup) also generates a standalone launcher next to the
other helper scripts (`oaf`, `ojob`, `opack`, ...):

- **`pyoaf`** on Linux/macOS
- **`pyoaf.bat`** on Windows

```sh
./pyoaf myscript.py
```
```bat
pyoaf.bat myscript.py
```

Both are thin wrappers that just call `oaf --py`; use whichever is more convenient for your
environment/shebang setup.

---

## Passing command-line arguments to Python

Both `--py` and the generated `pyoaf`/`pyoaf.bat` launcher forward everything after the script name
as **real `sys.argv` entries** - exactly like invoking `python script.py arg1 arg2` directly:

```sh
./pyoaf greet.py "Ada Lovelace" --loud
```

```python
# greet.py
import sys

name = sys.argv[1]
loud = "--loud" in sys.argv[2:]

msg = "Hello, " + name + "!"
print(msg.upper() if loud else msg)
```

```
$ ./pyoaf greet.py "Ada Lovelace" --loud
HELLO, ADA LOVELACE!
```

Under the hood the launcher scripts capture `"$@"` (or `%*` on Windows) into indexed environment
variables - `OAF_PY_ARGC` plus `OAF_PY_ARG_0`, `OAF_PY_ARG_1`, ... - which
`ow.python.execStandalone` reads and passes straight through to the spawned Python process as
argv. Using indexed variables (rather than joining args into one string) means arguments containing
spaces, `=`, `;`, or other special characters survive intact:

```sh
./pyoaf process.py "path with spaces/file.csv" "key=value" "a;b;c"
```

```python
import sys
print(sys.argv[1:])
# ['path with spaces/file.csv', 'key=value', 'a;b;c']
```

You can also set `OAF_PY_ARGC`/`OAF_PY_ARG_<n>` yourself (or from any other script that shells out
to `oaf --py`) if you're not going through the generated `pyoaf` launcher - `execStandalone` doesn't
care how they got set, only that they're present.

---

## Calling back into OpenAF from independent Python code (--oafpy)

If you want to run Python entirely on your own (not via `oaf --py`) but still call back into
OpenAF - e.g. from an existing Python codebase, a notebook, or a script launched by something
else - generate the companion `oaf.py` module:

```sh
oaf --oafpy > oaf.py
```

Then, from your own Python script (in the same directory, or as `oaf/__init__.py` in a package):

```python
import oaf
from oaf import _, _d, _oaf, _g, _s

print(_oaf("2 + 2"))          # 4, evaluated by OpenAF
_s("myVar", {"a": 1})         # $set("myVar", {"a": 1}) in OpenAF
print(_g("myVar"))            # {"a": 1}
```

Importing `oaf` transparently starts an `oaf -c "ow.loadPython().startServer(...)"` background
process and registers an `atexit` hook to terminate it when your Python script exits.

---

## Python inside oJob (lang: python)

oJob jobs can be written in Python directly with `lang: python`. Under the hood this uses `$py`
(server mode), so the job's `args` map is passed in as Python variables and any keys your Python
code writes back to `args` are merged back into the oJob execution context:

```yaml
jobs:
- name: "Python Job"
  lang: python
  exec: | #python
    import json
    print("Python is running")
    args['pythonResult'] = 'success'

# Or point at an existing .py file instead of inline code
- name: "Python File Job"
  typeArgs:
    execPy: "/path/to/script.py"
```

See `ojob.md` (Job Languages section) for the full list of supported `lang` values.

---

## Configuration (environment variables)

| Variable | Purpose | Default |
|---|---|---|
| `OAF_PYTHON` | Path/command of the Python interpreter to use | `python` |
| `OAF_PYTHON_VER` | Major Python version to assume (skips auto-detection) | `3` |
| `OAF_PY_ARGC`, `OAF_PY_ARG_<n>` | Set by `pyoaf`/`pyoaf.bat` to forward CLI args as real `sys.argv` (see above) | unset |

`ow.python.setPython(aPython)` / `ow.python.reset(noException, tryOthers)` let you change or
re-detect the interpreter and version at runtime instead of using the environment variables.

---

## Choosing the right approach

| I want to... | Use |
|---|---|
| Run a couple of Python expressions and get values back into JS | `ow.python.exec` / `$py` |
| Keep a Python "session" alive across many small calls (state persists) | `ow.python.startServer()` + `exec`, or `$pyStart`/`$pyStop` |
| Evolve one object across calls without naming in/out vars each time | `ow.python.execPM` |
| Run an existing `.py` file as-is, optionally calling back into OpenAF | `ow.python.execStandalone` / `oaf --py` / `pyoaf` |
| Give a Python script real CLI arguments (`sys.argv`) | `pyoaf`/`pyoaf.bat` launcher |
| Call OpenAF from Python code you run independently (not via `oaf`) | `oaf --oafpy > oaf.py`, then `import oaf` |
| Write an oJob step in Python | `lang: python` (or `typeArgs.execPy`) |

For the raw wire protocol used between the Python bridge process and OpenAF (if you're implementing
a custom client), see `dev/python-oaf-server.md`.
