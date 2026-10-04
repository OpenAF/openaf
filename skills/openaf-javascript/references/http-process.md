# HTTP and subprocess results

Read the selected helper in [core source](https://github.com/openaf/openaf/blob/master/js/openaf.js) and the [core guide](https://github.com/openaf/openaf/blob/master/docs/openaf.md). `$rest`, `$fetch`, and `$sh` have different contracts; do not assume a browser Response or Node child-process object.

For HTTP, choose JSON, text, or bytes explicitly using supported methods. Verify whether errors throw or return data, where status/headers are exposed, and whether the operation is synchronous or returns an oPromise. Inspect `$fetch` options in the [additional helpers guide](https://github.com/openaf/openaf/blob/master/docs/openaf-dollar-functions.md#network-and-process-helpers). Use timeouts supported by that API, preserve authentication externally, and test a non-success response as well as valid data.

For `$sh`, inspect execution and result collection methods before reading exit code, stdout, or stderr. Pass data using supported argument/input mechanisms; interpolating untrusted input into a command string invokes shell parsing. An exit code of zero does not prove a workflow succeeded: assert expected output or effects too. Test a failing command with harmless fixtures. Preserve output intended for machine parsing separately from diagnostics.
