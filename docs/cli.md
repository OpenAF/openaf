# OpenAF Command-Line Interface Reference

[Index](./index.md) | [oJob Reference](./ojob.md) | [Flags](./openaf-flags.md) | [Advanced](./openaf-advanced.md)

Complete reference for the `openaf` (alias `oaf`) command-line binary. For runtime `__flags` and environment variables, see [openaf-flags.md](./openaf-flags.md).

## Synopsis

```
openaf [options] [script-file]
oaf   [options] [script-file]
```

With no arguments, OpenAF launches the interactive GUI if a desktop is available, otherwise prints help.

## Global options

| Flag | Argument | Description |
|:-----|:---------|:-------------|
| `-h` | – | Show help and exit. |
| `-v` | – | Print version and distribution, then exit. |
| `-helpscript [term]` | optional term | Display scripting help for a search term (loads `js/example.js`). |

## Running code

| Flag | Argument | Description |
|:-----|:---------|:-------------|
| `-c <code>` | JS code | Execute the given JavaScript code string (prepended before any script input). |
| `-e <expr>` | expression | Provide input directly (exposed to scripts as the `expr` global). |
| `-f <file>` | script path | Execute a JavaScript file. Runs in silent mode. |
| `--script <file>` | script/opack path | Execute a script or opack file (sets input type to script). |
| `--daemon <file>` | script/opack path | Execute a script or opack as a daemon (wraps with `ow.server.simpleCheckIn` + `ow.server.daemon`). |
| `-p` | – | Read streaming input from stdin (pipe mode). |
| `-o` | – | Output mode — display `__pmOut` as JSON on stdout. |
| `-s` | – | Silent mode (suppress JSON output). Default for most modes. |
| `-i <type>` | type string | Set the input type for the current run. |
| `--i` | – | Interpret mode — set Rhino optimization level to -1 (disables JIT compilation). Note: this is `--i`, distinct from `-i`. |

## Debugging

| Flag | Argument | Description |
|:-----|:---------|:-------------|
| `-d <file>` | script path | Console-debug mode: load the given file via `loadDebug('<file>')`. Implies silent mode. |
| `-debug` | – | Enable DEBUG log level (`SimpleLog`). Does not consume a script file. |

## Install, update, and maintenance

| Flag | Argument | Description |
|:-----|:---------|:-------------|
| `--install` | – | Generate wrapper scripts (`oaf`, `opack`, `ojob`, `oafp`, `pyoaf`, etc.) in the current directory. |
| `--check` | – | Check if this is the latest released version. |
| `--update` | – | Update OpenAF to the latest version. |
| `--repack` | – | Repack `openaf.jar` for faster startup. |
| `--console` | – | Launch the interactive OpenAF REPL console. |

## Subsystem entry points

| Flag | Argument | Description |
|:-----|:---------|:-------------|
| `--ojob` | – | Execute an oJob (loads the oJob engine). Use with `-e` to pass a YAML file or expression. |
| `--opack` | – | Execute the opack package-manager CLI. Use with `-e` to pass sub-commands. |
| `--py <file>` | script path | Run a Python script with OpenAF bridge support (loads `pyoaf.js`). |
| `--oafpy` | – | Emit the `oaf.py` bridge module for use from standalone Python scripts. See [python.md](./python.md). |
| `--sb <file>` | file path | Generate or prepend an OpenAF/oJob shebang to a JS or YAML file. |
| `--bashcompletion <arg>` | arg | Generate bash completion script. |
| `--zshcompletion <arg>` | arg | Generate zsh completion script. |

## Generated wrapper commands

After running `--install`, the following wrapper scripts are created in the install directory. These are separate binaries (not flags of `openaf`), but are the most common way to invoke the subsystems:

| Command | Equivalent | Purpose |
|:--------|:----------|:--------|
| `oaf` / `openaf` | `openaf` | Main binary. |
| `ojob` | `openaf --ojob -e "$ARGS"` | oJob CLI. |
| `opack` | `openaf --opack -e "$ARGS"` | oPack package manager CLI. |
| `oafp` | `openaf -c "load(getOpenAFJar()+'::js/oafp.js')" -e "$ARGS"` | OpenAF data processor. See [oafp.md](./oafp.md). |
| `pyoaf` | `openaf --py -e "$ARGS"` | Python runner. See [python.md](./python.md). |
| `oafc` / `openaf-console` | `openaf --console` | Interactive REPL. |
| `odoc` | `openaf -c "load(getOpenAFJar()+'::js/odoc.js')" -e "$ARGS"` | Documentation CLI. See [odoc.md](./odoc.md). |
| `update` | `openaf --update` | Update shortcut. |
| `oaf-sb` / `openaf-sb` / `ojob-sb` / `oafp-sb` | `openaf --sb` | Shebang generators. |

## Common usage examples

```bash
# Inline JavaScript
openaf -c 'print("Hello World!");'

# Execute a script file
openaf -f hello.js

# Run an oJob (two equivalent forms)
openaf --ojob -e 'myjob.yaml'
ojob myjob.yaml

# Run the opack package manager
opack list
openaf --opack -e 'list'

# OpenAF data processor: JSON to YAML
cat data.json | oafp in=json out=yaml

# Interactive REPL
openaf --console

# Run a Python script with OpenAF bridge
pyoaf script.py

# Check version
openaf -v
```

## See also

- [openaf-flags.md](./openaf-flags.md) — runtime `__flags` and environment variables.
- [ojob.md](./ojob.md) — oJob YAML reference.
- [oafp.md](./oafp.md) — OpenAF data processor.
- [opacks.md](./opacks.md) — oPack package manager.
- [python.md](./python.md) — Python integration.
- [odoc.md](./odoc.md) — documentation engine.