# Generic instrumentation

Instrumentation is opt-in and has no OpenTelemetry dependency. Loading
`ow.loadInstrumentation()` does not enable capture. Existing jobs and HTTP calls
remain unchanged until `enable()` is called. No exporter or server is started
implicitly.

```javascript
var ins = ow.loadInstrumentation();
ins.configure({ resource: { "service.name": "orders" } });
var channel = ins.channelProvider({ prefix: "ordersTelemetry" });
ins.registerProvider("channels", channel);
ins.enable();
try {
  ins.withSpan("import orders", function(span) {
    span.setAttribute("batch.size", 10);
    log("Import started");
    ins.counter("orders.imported", { unit: "{order}" }).add(10);
  });
} finally {
  ins.shutdown(5000);
}
```

## Configuration and public helpers

`configure(options)` merges configuration; it never enables instrumentation.
Options are `jobs`, `http`, `logs` (true), `sampleRatio` (1), `resource` (map),
and `filter(record)` (return a modified record, or false to discard it).
Root sampling uses the ratio; child spans honor the parent's sampled bit.
An unsampled context continues to propagate. `enable()`, `disable()`,
`isEnabled()`, `flush(timeoutMs)`, `shutdown(timeoutMs)` and `getStats()` manage
capture and providers. The default lifecycle budget is 5000 ms.

An oJob can explicitly configure capture:

```yaml
ojob:
  instrumentation:
    enabled: true
    resource:
      service.name: nightly-import
```

`startSpan(name, options)` returns a span without changing active context.
`withSpan(name, options, fn)` makes it current for the synchronous callback and
ends it in `finally`, preserving callback return values and exceptions. A span
provides `context`, `setAttribute(key,value)`, `addEvent(name,attributes)`,
`recordException(error)`, `setStatus("UNSET"|"OK"|"ERROR",message)` and `end()`.
End is idempotent. Options include `parent`, `kind` and `attributes`.
For asynchronous work, bind the callback or explicitly use `withContext`.
Returning a promise does not extend `withSpan` past the callback's return.

`captureContext()`, `withContext(context,fn)`, and `bind(fn,context)` isolate and
restore thread-local context. `bind(fn)` captures the current context. Passing
an explicit undefined context binds a fresh root scope. `suppress(fn)` excludes
telemetry implementation work and is preserved across bound callbacks.

`inject(headers,context)` returns a new map. `extract(headers)` validates W3C
traceparent and tracestate; invalid traceparent is ignored and malformed
tracestate is discarded. Baggage is not propagated.

## Automatic instrumentation boundaries

- Actual oJob executions, asynchronous dispatch, repeated jobs, nested jobs and
  timeout workers carry context. Periodic/subscription/shutdown executions start
  fresh roots, avoiding a stale registration context.
- `$do`, promise callbacks, `pForEach` workers and `threadBox` preserve captured
  context. Raw user-created Java threads require `bind`.
- `ow.obj.http` and legacy `http0` produce client spans; `$rest` inherits these.
  Explicit valid caller trace headers take precedence over ambient context.
  For direct `exec`, pass `{ instrumentation: false }` as the eighth argument;
  `$rest` uses its `options` map. Disabled capture never adds trace headers.
- `ow.server.httpd.route` captures server handler execution. For direct
  `HTTPServer.add`, use `ins.httpHandler(handler, routeName)` explicitly.
  Server spans end when the handler returns; streamed client spans end when the
  stream is handed to the caller. Neither measures full streamed-body transfer.
- `log`, `logWarn`, `logErr` and `lognl` emit one correlated record at call time,
  including asynchronous output. Raw `print` is not captured.

HTTP telemetry omits bodies, credentials and query strings. Job arguments are
not included. Application log bodies and explicitly supplied exception messages
may contain sensitive data; use `filter` to redact according to the application.
The HTTP wrapper excludes automatic exception text because client exceptions
can contain URLs and response bodies.

## Metrics

`counter(name,options).add(value,attributes)`,
`upDownCounter(name,options).add(value,attributes)`,
`gauge(name,options).set(value,attributes)` and
`histogram(name,options).record(value,attributes)` emit observations.
Options include `unit`, `description`, `attributeKeys` (empty by default), and
explicit ascending `bounds` for histograms. Counters reject negative values;
all instruments reject non-finite observations.

Use `collectMetrics(mappings)` to sample selected existing `ow.metrics` values.
Each mapping specifies `collector`, dotted `path`, `name`, `type` (`gauge` or
`cumulative`), plus optional unit and attribute options. Values are never
classified automatically. Exporters own aggregation; the channel stores the
original observations.

## Provider contract (API version 1)

`registerProvider(name,provider)` installs callbacks `onSpan`, `onLog`, and
`onMetric`; `flush(timeoutMs)`, `shutdown(timeoutMs)` and `getStats()` are optional.
Duplicate names fail; `unregisterProvider` removes and returns a provider without
implicitly destroying it. Callbacks receive independent JSON copies, execute
under suppression, and must return promptly. Provider exceptions are counted
and cannot replace application failures. `batchProvider(send,options)` supplies
a bounded daemon-backed queue for remote providers.

Every record has `version:1`, `id`, `signal` (`Span`, `Log`, `Metric`), `resource`
and `scope`. Spans contain W3C IDs, parent ID, name/kind, attributes, events,
status, start/end epoch nanoseconds and monotonic duration. Logs contain time,
severity, body, attributes and optional trace correlation. Metric observations
contain name/type/unit, time, value, attributes and histogram bounds. Epoch
nanoseconds are decimal strings to avoid JavaScript integer precision loss.

## Channels and remote access

`channelProvider(options)` creates `<prefix>::span`, `::log`, and `::metric`
channels. Defaults: 10,000 records per signal, 15-minute retention, oldest-first
eviction. Expiry also runs periodically. Channels remain inspectable after
shutdown; their owner can destroy them explicitly.

```javascript
ow.loadServer();
var server = ow.server.httpd.start(8443, "127.0.0.1");
channel.exposeChannels(server, "/telemetry", function(user, password) {
  return user === "viewer" && password === $sec().get("telemetryViewerPassword");
});
// A separate OpenAF process can create a remote channel at /telemetry/span.
```

Use an appropriately configured TLS server for access beyond loopback. The
provider requires an existing server and authentication callback and enforces
read-only access. It does not expose remote configuration controls.

Optional forwarding uses `remote: { Span: {url,login,password}, Log: {...},
Metric: {...} }` with existing channel protocol endpoints that allow writes.
Records retain stable IDs across retries. The receiver owns its retention.
Forwarding defaults to 512-record batches, a five-second interval, 2,048 pending
records per signal, a five-second timeout and a 30-second retry budget.
Overflow drops the oldest pending records. This is in-memory best-effort
forwarding; retries may duplicate a delivery, and abrupt exits may lose data.

Inspection endpoints, forwarding and export operations suppress instrumentation
to prevent feedback loops. `getStats()` reports provider errors, filtering,
eviction, pending queues, rejected records, retries and overflow.
