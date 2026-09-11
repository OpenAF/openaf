# OpenAF Interactive Console (oafc / openaf-console)

[Index](./index.md) | [CLI Reference](./cli.md) | [OpenAF Reference](./openaf.md) | [Flags](./openaf-flags.md)

The interactive console is OpenAF's REPL: a line editor (with history, completion and multi-line
input) on top of the same JavaScript engine used to run scripts. Anything that isn't a built-in
console command is evaluated as OpenAF/JavaScript and, unless output has been turned off, the
result is printed.

## Starting the console

```bash
openaf --console      # raw flag
oafc                   # generated wrapper (recommended)
openaf-console         # generated wrapper (same as oafc)
```

All three are equivalent; `oafc`/`openaf-console` are thin wrapper scripts created by
`--install` (see [cli.md](./cli.md#generated-wrapper-commands)) that just run
`openaf --console "$@"`.

On startup the console:
- Loads `.openaf-console_profile` from the user's home/OpenAF directory, if present, and runs its
  contents as console commands (one per line) — useful for predefining aliases or DB connections.
- Loads/saves command history to `.openaf-console_history` in the same directory.
- Prints a version banner and, unless `noHomeComms` is set, checks for a newer OpenAF release.

## Basic usage

```
$ oafc
openaf:1> print("Hello World!");
Hello World!
openaf:2> 1 + 1
2
openaf:3> var db = new DB("org.h2.Driver", "jdbc:h2:mem:", "sa", "")
openaf:4> sql db select 1 as a, 2 as b
```

- Expressions that evaluate to a value (not just statements) have their result printed automatically.
- Multi-line input is supported by default (`multi` command toggles it) — an unbalanced brace/paren
  keeps the prompt open for the next line.
- `Ctrl-C` / `Ctrl-D` behave as usual for exiting or interrupting.

## Built-in commands

These are reserved words handled directly by the console (anything else is treated as a script
command). Run `help` with no arguments inside the console to see this list live; `help <term>`
searches the same offline help database used by `<odoc>`-documented functions (see
[odoc.md](./odoc.md)).

| Command | Description | Example |
|:--------|:-------------|:--------|
| `help` | Show the help screen, or look up a term in the offline help database. | `help`, `help AF`, `help scope` |
| `exit` | Exit the console. | `exit` |
| `time` | Toggle timing of every command executed (default off). | `time` |
| `output` | Toggle printing of command results (default on). | `output` |
| `beautify` | Toggle beautified/pretty-printed output (default on). | `beautify` |
| `color` | Toggle ANSI colorized output (default on when the terminal supports ANSI); `color on`/`color off` set it explicitly. | `color`, `color off` |
| `desc` | Describe the available methods/properties of a class. | `desc AF` |
| `scope` | List the current JS scope, optionally filtered by a regexp. | `scope sha` |
| `alias` | Create (or list) an alias for a console command line. With no argument, lists current aliases. | `alias ola=print("hi");` |
| `watch` | With no argument, reports whether watch is active. `watch on` / `watch off` toggle it without changing the expression. `watch <expr>` re-evaluates `<expr>` before every prompt. `watch <N> <expr>` live-refreshes `<expr>`'s output every `N` seconds until `q` is pressed. | `watch new Date();`, `watch 5 ow.server.getThreadsInfo()` |
| `pause` | Toggle pausing long output at the terminal height (default on). | `pause` |
| `table <expr>` | Evaluate `<expr>` and render an array-of-maps result as an ASCII table. | `table listFiles(".")` |
| `tree` | With no argument, reports whether persistent tree rendering is active (default on). `tree on` / `tree off` switch all subsequent map/array output between tree and flat table view. `tree <expr>` renders `<expr>`'s result as a tree once, without changing the persistent mode. | `tree off`, `tree myObj` |
| `view <expr>` | Evaluate `<expr>` and render a map/array result as a tree (default) or flat table, depending on the `tree` setting. With no argument (or `on`/`off`), reports/toggles a separate persistent "view" mode instead. | `view myObj` |
| `sql <db> <stmt>` | Run a `SELECT` over a `DB` object variable and print a table. | `sql db select * from t` |
| `dsql <db> <stmt>` | Describe the columns a query would produce, without fetching rows. | `dsql db select * from t` |
| `esql <db> <stmt>` | Execute a non-SELECT statement (INSERT/UPDATE/DDL) over a `DB` object. | `esql db update t set a=1` |
| `diff <A> with[New\|Changes\|Full] <B>` | Show differences between two objects/variables; `with` shows just the diff, `withChanges` just changed keys, `withNew` diff+changes, `withFull` the complete merged view. | `diff a with b`, `diff a withChanges b` |
| `pin <prefix>` | Prepend `<prefix>` to every subsequent command until an empty line is entered (or `pin` is invoked again). | `pin sql db` |
| `multi` | Toggle multi-line expression entry (default on). | `multi` |
| `edit` | Compose a command in `$EDITOR` (or `vi`); `edit last` / `edit history` reopen a previous command. | `edit last` |
| `clear` | Clear the screen. | `clear` |
| `reset` | Reset the terminal (Unix consoles only), useful after a program leaves it in a bad state. | `reset` |
| `purge` | Purge the entire command history. | `purge` |

## Built-in aliases

A few convenience aliases ship enabled by default (see `alias` with no arguments to list all
currently defined aliases, including any you add):

| Alias | Expands to | Example |
|:------|:-----------|:--------|
| `opack <args>` | `oPack(<args>)` — run the opack manager without leaving the console. | `opack list` |
| `ojob <file> [k=v ...]` | Runs the given oJob file, passing remaining tokens as arguments (via `processExpr`). | `ojob myjob.yaml env=prod` |
| `ojobio` | Shortcut for `oJobRunFile("ojob.io")`. | `ojobio` |
| `sh [command]` | Drop into (or run one command in) the underlying system shell. | `sh ls -la` |
| `encryptText` | Prompts for text and prints its encrypted form (see `askEncrypt`). | `encryptText` |

Custom aliases are defined with `alias name=<console command line>` and cannot reuse a reserved
word. Aliases persist only for the session unless recreated from `.openaf-console_profile`.

## See also

- [cli.md](./cli.md) — full `openaf`/`oaf` flag reference and generated wrapper scripts.
- [odoc.md](./odoc.md) — the offline help database used by `help <term>`.
- [openaf-flags.md](./openaf-flags.md) — `noHomeComms` and other runtime flags.
