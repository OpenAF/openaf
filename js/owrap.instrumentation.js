/**
 * Generic, opt-in instrumentation. Providers never own application execution.
 * See docs/instrumentation.md for the record contract and lifecycle.
 */
OpenWrap.instrumentation = function() {
  this.apiVersion = 1;
  this._enabled = false;
  this._context = new java.lang.ThreadLocal();
  this._suppressed = new java.lang.ThreadLocal();
  this._providers = {};
  this._lock = new java.util.concurrent.locks.ReentrantLock();
  this._errors = new java.util.concurrent.atomic.AtomicLong();
  this._filtered = new java.util.concurrent.atomic.AtomicLong();
  this._config = { jobs: true, http: true, logs: true, sampleRatio: 1, resource: {} };
};

(function(P) {
  function copy(v) { return JSON.parse(JSON.stringify(v)); }
  function locked(lock, fn) { lock.lock(); try { return fn(); } finally { lock.unlock(); } }
  function positive(v, fallback) { return typeof v === "number" && isFinite(v) && v > 0 ? v : fallback; }
  P._copy = copy;
  P._locked = locked;
  P._positive = positive;
  P._time = function() {
    var i = java.time.Instant.now();
    return String(java.math.BigInteger.valueOf(i.getEpochSecond()).multiply(new java.math.BigInteger("1000000000")).add(java.math.BigInteger.valueOf(i.getNano())));
  };
  P._id = function() { return String(java.util.UUID.randomUUID()).replace(/-/g, ""); };
  P.configure = function(options) {
    options = options || {};
    if (typeof options.sampleRatio !== "undefined" && !(typeof options.sampleRatio === "number" && options.sampleRatio >= 0 && options.sampleRatio <= 1)) throw "sampleRatio must be between 0 and 1";
    this._config = Object.assign({}, this._config, options);
    return this;
  };
  P.enable = function() { this._enabled = true; return this; };
  P.disable = function() { this._enabled = false; return this; };
  P.isEnabled = function(signal) { return this._enabled && !this._suppressed.get() && (!signal || this._config[signal] !== false); };
  P.captureContext = function() { var c = this._context.get(); return c == null ? undefined : copy(c); };
  P.withContext = function(context, fn) {
    var previous = this._context.get();
    if (context) this._context.set(copy(context)); else this._context.remove();
    try { return fn(); } finally { if (previous == null) this._context.remove(); else this._context.set(previous); }
  };
  P.bind = function(fn, context) {
    if (typeof fn !== "function") return fn;
    var self = this, c = arguments.length > 1 ? context : self.captureContext(), suppressed = self._suppressed.get();
    return function() {
      var receiver = this, args = arguments;
      return self.withContext(c, function() {
        if (suppressed) return self.suppress(function() { return fn.apply(receiver, args); });
        return fn.apply(receiver, args);
      });
    };
  };
  P.suppress = function(fn) {
    var old = this._suppressed.get(); this._suppressed.set(true);
    try { return fn(); } finally { if (old == null) this._suppressed.remove(); else this._suppressed.set(old); }
  };
  P.registerProvider = function(name, provider) {
    if (!name || !provider) throw "Provider name and implementation required";
    var self = this;
    locked(this._lock, function() { if (self._providers[name]) throw "Provider already registered: " + name; self._providers[name] = provider; });
    return provider;
  };
  P.unregisterProvider = function(name) { var self = this; return locked(this._lock, function() { var p = self._providers[name]; delete self._providers[name]; return p; }); };
  P._each = function(fn) {
    var self = this, ps = locked(this._lock, function() { return Object.keys(self._providers).map(function(n) { return self._providers[n]; }); });
    ps.forEach(function(p) { try { self.suppress(function() { fn(p); }); } catch(e) { self._errors.incrementAndGet(); } });
  };
  P._emit = function(signal, record) {
    var self = this;
    try {
      record.version = 1; record.id = record.id || self._id(); record.signal = signal;
      record.resource = copy(self._config.resource || {}); record.scope = { name: "openaf", version: "1" };
      if (typeof self._config.filter === "function") {
        record = self.suppress(function() { return self._config.filter(record); });
        if (!record) { self._filtered.incrementAndGet(); return; }
      }
      self._each(function(p) { var fn = p["on" + signal]; if (typeof fn === "function") fn.call(p, copy(record)); });
    } catch(e) { self._errors.incrementAndGet(); }
  };
  P.flush = function(timeoutMs) {
    var deadline = Date.now() + positive(timeoutMs, 5000);
    this._each(function(p) { if (p.flush) p.flush(Math.max(0, deadline - Date.now())); });
    return this.getStats();
  };
  P.shutdown = function(timeoutMs) {
    this.disable(); var deadline = Date.now() + positive(timeoutMs, 5000);
    this._each(function(p) { if (p.shutdown) p.shutdown(Math.max(0, deadline - Date.now())); });
    return this.getStats();
  };
  P.getStats = function() {
    var self = this, providers = {};
    locked(this._lock, function() { Object.keys(self._providers).forEach(function(n) { try { providers[n] = self._providers[n].getStats ? self._providers[n].getStats() : {}; } catch(e) {} }); });
    return { enabled: self._enabled, providerErrors: Number(self._errors.get()), filtered: Number(self._filtered.get()), providers: providers };
  };
  P.extract = function(headers) {
    var h = {}; Object.keys(headers || {}).forEach(function(k) { h[k.toLowerCase()] = String(headers[k]); });
    var m = /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})(.*)$/.exec(h.traceparent || "");
    if (!m || m[1] === "ff" || /^0+$/.test(m[2]) || /^0+$/.test(m[3]) || (m[1] === "00" && m[5] !== "") || (m[5] && m[5][0] !== "-")) return undefined;
    var state = h.tracestate || "", keys = {};
    if (state.length > 512 || state.split(",").length > 32 || state.split(",").some(function(s) {
      if (!s) return !!state;
      var p = s.trim().split("=");
      if (p.length !== 2 || !/^(?:[a-z][a-z0-9_\-*\/]{0,255}|[a-z0-9][a-z0-9_\-*\/]{0,240}@[a-z][a-z0-9_\-*\/]{0,13})$/.test(p[0]) || !/^[\x20-\x2b\x2d-\x3c\x3e-\x7e]{1,256}$/.test(p[1]) || / $/.test(p[1]) || keys[p[0]]) return true;
      keys[p[0]] = true; return false;
    })) state = "";
    return { traceId: m[2], spanId: m[3], sampled: (parseInt(m[4], 16) & 1) === 1, traceState: state, remote: true };
  };
  P.inject = function(headers, context) {
    var result = Object.assign({}, headers || {}), c = context || this.captureContext();
    if (!c) return result;
    Object.keys(result).forEach(function(k) { if (/^(traceparent|tracestate)$/i.test(k)) delete result[k]; });
    result.traceparent = "00-" + c.traceId + "-" + c.spanId + (c.sampled ? "-01" : "-00");
    if (c.traceState) result.tracestate = c.traceState;
    return result;
  };
  P.startSpan = function(name, options) {
    var self = this, o = options || {}, active = self.isEnabled(), parent = typeof o.parent !== "undefined" ? o.parent : self.captureContext();
    if (!active) return { context: parent, setAttribute: function() { return this; }, addEvent: function() { return this; }, recordException: function() { return this; }, setStatus: function() { return this; }, end: function() {} };
    var c = { traceId: parent ? parent.traceId : self._id(), spanId: self._id().slice(0, 16), sampled: parent ? parent.sampled : Math.random() < self._config.sampleRatio, traceState: parent ? parent.traceState : "" };
    var start = java.lang.System.nanoTime(), ended = new java.util.concurrent.atomic.AtomicBoolean(false);
    var record = { traceId: c.traceId, spanId: c.spanId, parentSpanId: parent ? parent.spanId : "", traceState: c.traceState, sampled: c.sampled, name: String(name), kind: o.kind || "INTERNAL", startTimeUnixNano: self._time(), attributes: copy(o.attributes || {}), events: [], status: { code: "UNSET" } };
    return {
      context: c,
      setAttribute: function(k, v) { if (!ended.get()) record.attributes[k] = v; return this; },
      addEvent: function(n, a) { if (!ended.get() && record.events.length < 128) record.events.push({ name: String(n), timeUnixNano: self._time(), attributes: a || {} }); return this; },
      recordException: function(e) { return this.addEvent("exception", { "exception.type": e && e.name ? String(e.name) : "Error", "exception.message": String(e) }); },
      setStatus: function(code, message) { if (!ended.get()) record.status = { code: code, message: message || "" }; return this; },
      end: function() {
        if (!ended.compareAndSet(false, true)) return;
        record.endTimeUnixNano = self._time(); record.durationNano = String(java.math.BigInteger.valueOf(java.lang.System.nanoTime()).subtract(java.math.BigInteger.valueOf(start)));
        if (c.sampled) self._emit("Span", record);
      }
    };
  };
  P.withSpan = function(name, options, fn) {
    if (typeof options === "function") { fn = options; options = {}; }
    if (!this.isEnabled()) return fn(this.startSpan(name));
    var self = this, span = self.startSpan(name, options);
    return self.withContext(span.context, function() {
      try { return fn(span); } catch(e) { if (!options || options.recordExceptions !== false) span.recordException(e); span.setStatus("ERROR"); throw e; } finally { span.end(); }
    });
  };
  P.log = function(severity, body, attributes) {
    if (!this.isEnabled("logs")) return;
    var c = this.captureContext() || {};
    this._emit("Log", { timeUnixNano: this._time(), severity: severity, body: typeof body === "undefined" ? "" : body, attributes: attributes || {}, traceId: c.traceId, spanId: c.spanId, sampled: c.sampled });
  };
  P.metric = function(name, type, options) {
    if (["counter", "upDownCounter", "histogram", "gauge", "cumulative"].indexOf(type) < 0) throw "Invalid instrument type";
    var self = this, o = options || {}, bounds = o.bounds || [0, 5, 10, 25, 50, 75, 100, 250, 500, 750, 1000, 2500, 5000, 7500, 10000];
    if (type === "histogram" && bounds.some(function(v, i) { return typeof v !== "number" || !isFinite(v) || (i > 0 && v <= bounds[i-1]); })) throw "Histogram bounds must be finite and increasing";
    var record = function(value, attributes) {
      if (!self.isEnabled()) return;
      if (typeof value !== "number" || !isFinite(value) || ((type === "counter" || type === "cumulative") && value < 0)) throw "Invalid metric value";
      var attrs = {}; (o.attributeKeys || []).forEach(function(k) { if (attributes && typeof attributes[k] !== "undefined") attrs[k] = attributes[k]; });
      self._emit("Metric", { name: name, type: type, unit: o.unit || "", description: o.description || "", value: value, bounds: bounds, attributes: attrs, timeUnixNano: self._time() });
    };
    return { add: record, record: record, set: record };
  };
  ["counter", "upDownCounter", "histogram", "gauge"].forEach(function(t) { P[t] = function(n, o) { return this.metric(n, t, o); }; });
  P.collectMetrics = function(mappings) {
    if (!this.isEnabled()) return;
    ow.loadMetrics(); var self = this;
    (mappings || []).forEach(function(m) {
      if (["gauge", "cumulative"].indexOf(m.type) < 0 || !m.name || !m.collector) throw "Metric mapping requires name, collector and gauge/cumulative type";
      var value = ow.metrics.getSome([m.collector])[m.collector];
      (m.path || "").split(".").filter(Boolean).forEach(function(k) { value = value == null ? undefined : value[k]; });
      if (typeof value === "number" && isFinite(value)) self.metric(m.name, m.type, m).record(value, m.attributes);
    });
  };
  P.httpClient = function(client, args, exec) {
    var self = this, a = Array.prototype.slice.call(args), options = a[7] || {};
    if (!self.isEnabled("http") || options.instrumentation === false) return exec.apply(client, a);
    var parent = self.extract(a[3]) || self.captureContext(), attrs = { "http.request.method": String(a[1] || "GET").toUpperCase() };
    try { var u = new java.net.URI(String(a[0])); attrs["server.address"] = String(u.getHost()); attrs["server.port"] = Number(u.getPort()); attrs["url.scheme"] = String(u.getScheme()); } catch(e) {}
    return self.withSpan("HTTP " + attrs["http.request.method"], { parent: parent, kind: "CLIENT", attributes: attrs, recordExceptions: false }, function(span) {
      a[3] = self.inject(a[3]);
      try { return exec.apply(client, a); } finally { try { var code = Number(client.responseCode()); span.setAttribute("http.response.status_code", code); if (code >= 400) span.setStatus("ERROR"); } catch(e) {} }
    });
  };
  P.httpHandler = function(handler, route) {
    var self = this;
    return function(req) {
      var receiver = this, args = arguments;
      if (!self.isEnabled("http")) return handler.apply(receiver, args);
      if (req && req.__openafTelemetry) return self.suppress(function() { return handler.apply(receiver, args); });
      return self.withContext(self.extract(req.header || req.headers), function() {
        return self.withSpan("HTTP " + String(req.method || "GET") + " " + (route || "handler"), { kind: "SERVER", recordExceptions: false, attributes: { "http.request.method": String(req.method || "GET"), "http.route": route || "handler" } }, function(span) {
          var r = handler.apply(receiver, args); if (req.__openafInstrumentationError) { span.setStatus("ERROR"); delete req.__openafInstrumentationError; } var status = r && (r.status || r.responseCode);
          if (status) { span.setAttribute("http.response.status_code", Number(status)); if (Number(status) >= 500) span.setStatus("ERROR"); }
          return r;
        });
      });
    };
  };

  // One daemon worker per provider; no worker exists until a provider is started.
  P._worker = function(fn, interval) {
    var self = this, alive = new java.util.concurrent.atomic.AtomicBoolean(true);
    var thread = new java.lang.Thread(new JavaAdapter(java.lang.Runnable, { run: function() {
      while (alive.get()) {
        try { java.lang.Thread.sleep(interval); if (alive.get()) fn(); } catch(e) { if (alive.get()) self._errors.incrementAndGet(); }
      }
    }}), "openaf-instrumentation");
    thread.setDaemon(true); thread.start();
    return { stop: function() { alive.set(false); thread.interrupt(); } };
  };
  P.batchProvider = function(send, options) {
    var self = this, o = options || {}, qs = { Span: [], Log: [], Metric: [] }, lock = new java.util.concurrent.locks.ReentrantLock(), sending = new java.util.concurrent.locks.ReentrantLock();
    var stats = { dropped: 0, sent: 0, rejected: 0, failures: 0, retries: 0 }, closed = false, shutdownComplete = false;
    var max = positive(o.maxPending, 2048), batchSize = positive(o.batchSize, 512), retryBudget = positive(o.retryBudgetMs, 30000);
    function enqueue(r) { locked(lock, function() { if (closed) return; var q = qs[r.signal]; if (q.length >= max) { q.shift(); stats.dropped++; } q.push({ record: copy(r), first: Date.now(), attempts: 0, due: 0 }); }); }
    var p = { onSpan: enqueue, onLog: enqueue, onMetric: enqueue };
    p.flush = function(ms) {
      var deadline = Date.now() + Math.max(0, typeof ms === "number" ? ms : 5000);
      if (!sending.tryLock(Math.max(0, deadline - Date.now()), java.util.concurrent.TimeUnit.MILLISECONDS)) return false;
      try {
        while (Date.now() < deadline) {
          var did = false;
          Object.keys(qs).forEach(function(signal) {
            if (Date.now() >= deadline) return;
            var batch = locked(lock, function() { var q = qs[signal]; while (q.length && q[0].attempts > 0 && Date.now() - q[0].first >= retryBudget) { q.shift(); stats.failures++; } if (!q.length || q[0].due > Date.now()) return []; return q.splice(0, batchSize); });
            if (!batch.length) return;
            did = true; var result;
            try { result = self.suppress(function() { return send(signal, batch.map(function(e) { return e.record; }), Math.max(1, deadline - Date.now())); }) || {}; }
            catch(e) { result = { retry: true }; }
            locked(lock, function() {
              if (shutdownComplete) { stats.dropped += batch.length; return; }
              if (result.retry) {
                stats.retries++;
                var again = batch.filter(function(e) { e.attempts++; e.due = Date.now() + (typeof result.retryAfterMs === "number" ? Math.max(0, result.retryAfterMs) : Math.min(10000, 500 * Math.pow(2, Math.min(e.attempts, 5))) * (0.8 + Math.random() * 0.4)); if (Date.now() - e.first >= retryBudget) { stats.failures++; return false; } return true; });
                qs[signal] = again.concat(qs[signal]);
                while(qs[signal].length > max) { qs[signal].shift(); stats.dropped++; }
              } else { stats.sent += batch.length - (result.rejected || 0); stats.rejected += result.rejected || 0; }
            });
          });
          if (!did) break;
        }
      } finally { sending.unlock(); }
      return true;
    };
    p.getStats = function() { return locked(lock, function() { var s = copy(stats); s.pending = {}; Object.keys(qs).forEach(function(k) { s.pending[k] = qs[k].length; }); return s; }); };
    p._worker = self._worker(function() { if (o.beforeFlush) o.beforeFlush(); p.flush(positive(o.timeoutMs, 5000)); }, positive(o.intervalMs, 5000));
    p.shutdown = function(ms) { locked(lock, function() { closed = true; }); p._worker.stop(); p.flush(ms); locked(lock, function() { shutdownComplete = true; Object.keys(qs).forEach(function(k) { stats.dropped += qs[k].length; qs[k] = []; }); }); };
    return p;
  };
  P.channelProvider = function(options) {
    ow.loadCh(); var self = this, o = options || {}, prefix = o.prefix || "__telemetry", names = {}, locks = {}, max = positive(o.maxRecords, 10000), age = positive(o.retentionMs, 900000), evicted = new java.util.concurrent.atomic.AtomicLong();
    ["Span", "Log", "Metric"].forEach(function(s) { names[s] = prefix + "::" + s.toLowerCase(); if ($ch().list().indexOf(names[s]) >= 0) throw "Channel already exists: " + names[s]; $ch(names[s]).create(); locks[s] = new java.util.concurrent.locks.ReentrantLock(); });
    function prune(s) {
      var ch = $ch(names[s]), rs = ch.getAll().sort(function(a,b) { return a.receivedAt - b.receivedAt; }), cutoff = Date.now() - age;
      rs.forEach(function(r, i) { if (r.receivedAt < cutoff || i < rs.length - max) { ch.unset({ id: r.id }); evicted.incrementAndGet(); } });
    }
    var forward = o.remote ? self.batchProvider(function(signal, records, timeout) {
      var remote = o.remote[signal]; if (!remote) return {};
      // Own the temporary remote channel to impose the current flush deadline.
      var n = prefix + "::forward::" + signal;
      var deadlineTimeout = Math.min(timeout, positive(o.timeoutMs, 5000));
      $ch(n).create("remote", Object.assign({}, remote, { timeout: deadlineTimeout, preAction: function(restOptions) {
        if (typeof remote.preAction === "function") remote.preAction(restOptions);
        restOptions.options = Object.assign({}, restOptions.options || {}, { timeout: deadlineTimeout, instrumentation: false });
        restOptions.retry = 0;
      } }));
      try { $ch(n).setAll(["id"], records); return {}; } finally { $ch(n).destroy(); }
    }, o) : undefined;
    var p = {};
    ["Span", "Log", "Metric"].forEach(function(s) { p["on" + s] = function(r) { self.suppress(function() { locked(locks[s], function() { $ch(names[s]).set({ id: r.id }, Object.assign({}, r, { receivedAt: Date.now() })); prune(s); }); if (forward) forward["on" + s](r); }); }; });
    var worker = self._worker(function() { Object.keys(names).forEach(function(s) { locked(locks[s], function() { prune(s); }); }); }, Math.min(age, 30000));
    p.channels = names;
    p.flush = function(ms) { if (forward) return forward.flush(ms); };
    p.shutdown = function(ms) { worker.stop(); if (forward) forward.shutdown(ms); };
    p.getStats = function() { return { channels: names, evicted: Number(evicted.get()), forwarding: forward ? forward.getStats() : undefined }; };
    p.exposeChannels = function(server, path, authFn) {
      if (!server || typeof authFn !== "function") throw "An existing HTTP server and authentication function are required";
      Object.keys(names).forEach(function(s) {
        var endpoint = (path || "/telemetry") + "/" + s.toLowerCase();
        ow.ch.server.expose(names[s], server, endpoint, function(u, pw, session, req) { var allowed = authFn(u, pw, session, req); req.channelPermission = "r"; return allowed; });
        var routes = ow.server.httpd.__routes[Number(server.getPort())];
        var original = routes[endpoint];
        routes[endpoint] = function(req) { return self.suppress(function() { return original(req); }); };
        self._inspectionPaths = self._inspectionPaths || {}; self._inspectionPaths[Number(server.getPort()) + ":" + endpoint] = true;
      });
      return names;
    };
    return p;
  };
})(OpenWrap.instrumentation.prototype);
