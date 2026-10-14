# JSON extraction and interactive prompts

`io.extractJSON(file, path, outputStream, options)` copies one JSON value without
loading it into memory. Paths are arrays of literal object keys and numeric array
indices; `[]` selects the root. It returns `false` and writes nothing when absent.
The caller owns and closes the output stream.

```javascript
var output = io.writeFileStream("request.json");
try {
  if (!io.extractJSON("capture.har", ["log", "entries", 0, "request"], output)) {
    throw "Request not found";
  }
} finally {
  output.close();
}
```

The local input must be UTF-8 and remain unchanged throughout the operation.
Extraction preserves number spelling, escapes and whitespace. It stops after the
selected value, so it does not validate the unread suffix. `cancel`, `progress`
and `maxNodes` options are passed to the scanner; copy progress restarts at zero.
A cancelled copy can leave partial output. Use `io.scanJSON` for full traversal,
metadata inspection or validation, and `io.readStreamJSON` for reconstructed values.

`askConsole()` opens a controlling terminal independently of process stdin/stdout.
This is useful when a script consumes piped data or writes machine-readable output.
It throws when no controlling terminal is available.

```javascript
var ui = askConsole();
try {
  var answers = askStruct([
    { name: "target", type: "choose", options: ["development", "production"] },
    { name: "features", type: "multiple", options: ["logs", "metrics"] },
    { name: "password", type: "secret" }
  ], ui);
} finally {
  ui.close();
}
```

`askChoose`, `askChooseMultiple`, `askDef` and `askStruct` accept an optional final
UI argument. `ask` and `askEncrypt` accept console, noAnsi and writer
arguments; `ask1` accepts console and writer. `askN` accepts a console. An injected writer receives
`(text, newline)`, where `newline === false` suppresses a newline.
Without ANSI support, choices use numbered menus; multiple selections accept
comma-separated numbers, blank selects none, and EOF cancels.

For oJob argument collection, use `ow.oJob.askOnHelp(help, true)` to open and close
an independent terminal automatically, or pass an existing UI as the second
argument. Existing calls retain their process console behavior. Borrowed UIs are
never closed by prompt helpers or oJob.

Set `__flags.OJOB_INTERACTIVETTY = true` in the OpenAF profile to use an independent
terminal for the `ojob file.yaml -i` argument wizard. The default is `false`.
