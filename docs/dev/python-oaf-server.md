# OpenAF–Python bridge protocol

The implementation is [owrap.python.js](../../js/owrap.python.js). Both directions bind to
`127.0.0.1`, use a per-lifetime token, accept one UTF-8 JSON request terminated by LF (`\n`)
per TCP connection, and close the connection after one response. **Responses are delimited by
EOF, not by newline.** Buffer bytes before decoding UTF-8; do not decode individual socket chunks.
These are trusted local code-execution endpoints, not sandboxes.

## Python → OpenAF (callback listener, `port`)

Request fields: `{"e":"2 + 2","t":"<token>"}` followed by LF. `e` is JavaScript evaluated
by `af.eval`. `_`, `_oaf`, `_g` and `_s` use this listener. `_g` and `_s` JSON-quote their keys.

Success is the JSON-encoded expression value (`4` in this example); an undefined value becomes
`null`. Evaluation, malformed-request and authorization errors are **plain text** beginning
`__OAF__Exception: `, not a JSON string or structured error object. Python helpers raise an
exception on that prefix and otherwise parse the complete response as JSON. An incomplete
request ending at EOF is rejected. The callback listener has a 15-second request-read timeout.

## OpenAF → Python (embedded execution listener, `sport`)

Request fields: `{"e":"print('hello')","t":"<token>"}` followed by LF. `e` is Python source
compiled in a persistent per-server namespace. One lock serializes execution and stdout/stderr
capture. It is released and the original streams restored in `finally`, including on SystemExit.
Successful execution returns:

```json
{"stdout":"hello\n","stderr":"","exitcode":0}
```

Python failures return captured output, a traceback in `stderr`, and `exitcode: 1`. This is a
request status, not a process exit code. Malformed, truncated or unauthorized frames also return
that error envelope. Bytes are accumulated through LF before UTF-8 decoding. The listener has a
1500-second request-read timeout; EOF before LF terminates reading with an error.

Two control requests are implemented on this direction only:

- `{"ping":true,"t":"<token>"}` returns the normal empty success envelope plus `"ready":true`.
- `{"exit":true,"t":"<token>"}` exits the child immediately without a response. OpenAF normally
  stops its owned process through its process handle, rather than relying on this request.

`exec` and `execPM` encode their JSON payload as UTF-8/base64 inside `e`. The execution helper
injects inputs, compiles the user code separately, and appends a unique result marker plus JSON
to captured stdout. OpenAF extracts that marker even if preceding output has no trailing newline.
User output preceding the marker is printed; stderr, missing/malformed results, nonzero status
and transport failures follow `throwExceptions` (false by default). `execPM` returns `__pm`;
`exec` returns the requested named variables. The result marker is an internal convention.

No correlation IDs, status requests, varsGet/varsSet messages, TLS, or structured callback-error
extensions are implemented. Standalone mode starts only the callback listener and launches each
script as a separate process; it does not provide a persistent Python execution namespace.

See the [Python guide](../python.md) for lifecycle, API signatures, argv precedence and examples.
