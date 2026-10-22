// Optional HTML desktop facade. No desktop toolkit is loaded by this file.
OpenWrap.desktop = function(options) {
  this.__providers = {};
  this.__windows = {};
  this.__listeners = {};
  this.__commands = new java.util.concurrent.ArrayBlockingQueue(257); // Reserve one slot for shutdown.
  this.__events = new java.util.concurrent.ArrayBlockingQueue(256);
  this.__pending = new java.util.concurrent.atomic.AtomicInteger();
  this.__commandBytes = new java.util.concurrent.atomic.AtomicLong();
  this.__eventBytes = new java.util.concurrent.atomic.AtomicLong();
  this.__lock = new java.util.concurrent.locks.ReentrantLock();
  this.__session = String(java.util.UUID.randomUUID());
  this.__state = "uninitialized";
  this.__timeout = 30000;
  this.__stopping = false;
  this.dialog = {};
  var self = this;
  ["openFile", "saveFile", "confirm", "alert"].forEach(function(name) {
    self.dialog[name] = function(message, opts) {
      var p = name == "confirm" || name == "alert" ? { message: message, options: opts || {} } : { options: message || {} };
      return self.__enqueue("dialog." + name, null, self.__copy(p, 65536));
    };
  });
  this.__configure(options || {});
};

OpenWrap.desktop.prototype.__error = function(code, message) {
  var e = new Error(message);
  e.code = code;
  return e;
};
OpenWrap.desktop.prototype.__copy = function(value, limit) {
  var self = this, seen = [];
  function check(v, depth) {
    if (depth > 32) throw self.__error("INVALID_ARGUMENT", "JSON nesting exceeds 32 levels");
    if (v === null || typeof v == "string" || typeof v == "boolean") return;
    if (typeof v == "number" && isFinite(v)) return;
    if (typeof v != "object" || isJavaObject(v)) throw self.__error("INVALID_ARGUMENT", "Desktop values must be JSON data");
    var tag = Object.prototype.toString.call(v);
    if (tag != "[object Object]" && tag != "[object Array]") throw self.__error("INVALID_ARGUMENT", "Desktop values must be plain JSON data");
    if (seen.indexOf(v) >= 0) throw self.__error("INVALID_ARGUMENT", "Cyclic desktop value");
    seen.push(v);
    Object.keys(v).forEach(function(k) {
      if (k == "__proto__" || k == "constructor" || k == "prototype") throw self.__error("INVALID_ARGUMENT", "Reserved JSON key");
      check(v[k], depth + 1);
    });
    if (Array.isArray(v)) for (var i = 0; i < v.length; i++) check(v[i], depth + 1);
    seen.pop();
  }
  check(value, 0);
  var text = JSON.stringify(value);
  if (new java.lang.String(text).getBytes(java.nio.charset.StandardCharsets.UTF_8).length > limit) throw this.__error("MESSAGE_TOO_LARGE", "Desktop payload exceeds " + limit + " UTF-8 bytes");
  return JSON.parse(text);
};

/** <odoc>
 * <key>ow.desktop.registerProvider(aProvider)</key>
 * Registers a provider implementing SPI version 1 before the desktop session starts.
 * Providers expose describe, probe, start, request and stop. Used by optional oPacks and contract tests.
 * </odoc> */
OpenWrap.desktop.prototype.registerProvider = function(provider) {
  if (this.__state != "uninitialized") throw this.__error("INVALID_STATE", "Register providers before starting desktop");
  ["describe", "probe", "start", "request", "stop"].forEach(function(k) {
    if (typeof provider[k] != "function") throw new Error("Invalid desktop provider: " + k);
  });
  var d = provider.describe();
  if (d.spi != 1 || !/^[a-z][a-z0-9-]*$/.test(d.id)) throw this.__error("INVALID_ARGUMENT", "Invalid provider identity or SPI");
  if (Object.prototype.hasOwnProperty.call(this.__providers, d.id)) throw this.__error("INVALID_ARGUMENT", "Duplicate desktop provider: " + d.id);
  this.__providers[d.id] = provider;
  return this;
};
OpenWrap.desktop.prototype.__configure = function(options) {
  var p = options.provider || "auto";
  if (!/^[a-z][a-z0-9-]*$/.test(p)) throw this.__error("INVALID_ARGUMENT", "Invalid desktop provider");
  if (this.__state != "uninitialized") {
    if (JSON.stringify(this.__copy(options, 65536)) != JSON.stringify(this.__options)) throw this.__error("INVALID_STATE", "Desktop configuration is frozen for this session");
    return this;
  }
  this.__requested = p;
  this.__options = this.__copy(options, 65536);
  if (isDef(options.timeout)) {
    if (!isNumber(options.timeout) || options.timeout < 100 || options.timeout > 300000) throw this.__error("INVALID_ARGUMENT", "timeout must be 100..300000 ms");
    this.__timeout = options.timeout;
  }
  return this;
};
OpenWrap.desktop.prototype.__discover = function() {
  if (this.__discovered) return;
  this.__discovered = true;
  var paths = getOPackPaths(), self = this;
  Object.keys(paths).sort().forEach(function(name) {
    var root = new java.io.File(paths[name]).getCanonicalFile(), file = new java.io.File(root, "desktop-provider.json");
    if (!file.isFile()) return;
    var d = io.readFileJSON(String(file));
    if (d.spi != 1 || !/^[a-z][a-z0-9-]*$/.test(d.id) || typeof d.entry != "string") throw self.__error("INVALID_ARGUMENT", "Invalid desktop descriptor in " + name);
    if (Object.prototype.hasOwnProperty.call(self.__providers, d.id)) throw self.__error("INVALID_ARGUMENT", "Duplicate desktop provider: " + d.id);
    var entry = new java.io.File(root, d.entry).getCanonicalFile();
    if (!entry.toPath().startsWith(root.toPath()) || !entry.isFile()) throw self.__error("INVALID_ARGUMENT", "Desktop provider entry escapes package");
    self.__providers[d.id] = { __entry: String(entry), __root: String(root) };
  });
};
OpenWrap.desktop.prototype.__provider = function(id) {
  var p = this.__providers[id];
  if (!p && id == "tui") {
    loadCompiledLib("owrap_desktop_ui_js");
    p = this.__providers[id] = OpenWrap.desktop.__tui();
  }
  if (p && p.__entry) {
    var mod = require(p.__entry), loaded = mod.create(p.__root);
    if (loaded.describe().id != id || loaded.describe().spi != 1) throw this.__error("INVALID_ARGUMENT", "Provider descriptor identity mismatch");
    ["probe", "start", "request", "stop"].forEach(function(k) { if (typeof loaded[k] != "function") throw new Error("Invalid provider: " + k); });
    this.__providers[id] = loaded;
    p = loaded;
  }
  return p;
};

/** <odoc>
 * <key>ow.desktop.info() : Map</key>
 * Returns session state, selected provider and actual capabilities. Does not start a toolkit.
 * </odoc> */
OpenWrap.desktop.prototype.info = function() {
  return this.__copy({ state: this.__state, sessionId: this.__session, provider: this.__identity || null, capabilities: this.__caps || {} }, 65536);
};
/** <odoc>
 * <key>ow.desktop.start() : oPromise</key>
 * Initializes the selected runtime and resolves to info(), including actual capabilities, without creating a window.
 * </odoc> */
OpenWrap.desktop.prototype.start = function() { return this.__enqueue("desktop.start", null, {}); };
OpenWrap.desktop.prototype.__start = function() {
  if (this.__state == "running") return;
  if (this.__state != "uninitialized") throw this.__error("INVALID_STATE", "Desktop session is " + this.__state);
  this.__discover();
  this.__state = "starting";
  var self = this, attempts = [], ids = this.__requested == "auto" ? ["javafx", "electron"] : [this.__requested];
  for (var i = 0; i < ids.length; i++) {
    var p;
    try {
      p = this.__provider(ids[i]);
      if (!p) throw this.__error("PROVIDER_UNAVAILABLE", "Provider is not installed");
      var probe = p.probe(this.__options);
      if (!probe.available) throw this.__error("PROVIDER_UNAVAILABLE", probe.reason || "Provider unavailable");
      this.__caps = this.__copy(p.start({ sessionId: this.__session, timeout: this.__timeout, options: this.__options }, function(e) { self.__emit(e); }), 65536);
      if (this.__caps.html !== false && this.__caps.messaging) this.__caps.declarativeViews = true;
      this.__active = p;
      this.__identity = this.__copy(p.describe(), 65536);
      this.__state = "running";
      if (!this.__hook) {
        this.__hook = true;
        addOnOpenAFShutdown(function() { self.__cleanup(); });
      }
      return;
    } catch(e) {
      attempts.push(ids[i] + ": " + String(e.message || e));
      if (p) try { p.stop(); } catch(cleanup) {
        this.__state = "failed";
        throw this.__error("PROVIDER_FAILED", attempts.join("; ") + "; cleanup failed: " + cleanup);
      }
    }
  }
  this.__state = "failed";
  throw this.__error("PROVIDER_UNAVAILABLE", attempts.join("; ") + ". Install plugin-DesktopJavaFX, explicitly select tui in a terminal, or register an available provider.");
};
OpenWrap.desktop.prototype.__thread = function(name, fn) {
  var t = new java.lang.Thread(new java.lang.Runnable({ run: fn }), "OpenAF desktop " + name);
  t.setDaemon(true);
  t.start();
  return t;
};
OpenWrap.desktop.prototype.__workers = function() {
  if (this.__worker) return;
  var self = this;
  this.__worker = this.__thread("commands", function() {
    while (!self.__stopping) {
      var job = self.__commands.poll(100, java.util.concurrent.TimeUnit.MILLISECONDS);
      if (job == null) continue;
      try {
        if (job.operation == "shutdown") {
          self.__state = "stopping";
          self.__cleanup();
          self.__state = "stopped";
          job.future.complete("null");
        } else {
          self.__start();
          var win = job.windowId ? self.__windows[job.windowId] : null;
          if (win && win.__closed) throw self.__error("INVALID_STATE", "Window is closed");
          var result;
          if (job.operation == "window.create") {
            if (!self.__caps.multipleWindows && Object.keys(self.__windows).some(function(id) { return id != win.id && self.__windows[id].__created && !self.__windows[id].__closed; })) throw self.__error("UNSUPPORTED_CAPABILITY", "Provider does not support multiple windows");
            if (!self.__caps.windows) throw self.__error("UNSUPPORTED_CAPABILITY", "Provider has no windows");
            if (win.__options.messaging && !self.__caps.messaging) throw self.__error("UNSUPPORTED_CAPABILITY", "Provider has no messaging");
            job.payload = self.__prepare(win);
          }
          if (job.operation.indexOf("dialog.") == 0 && !self.__caps.dialogs) throw self.__error("UNSUPPORTED_CAPABILITY", "Provider has no dialogs");
          if (job.operation == "desktop.start") result = self.info();
          else if (job.operation == "window.setView") {
            if (!self.__caps.declarativeViews) throw self.__error("UNSUPPORTED_CAPABILITY", "Provider has no declarative views");
            var previousView = win.__options.view, previousRevision = win.__viewRevision;
            win.__options.view = job.payload;
            win.__viewRevision++;
            try {
              if (self.__caps.nativeViews) result = self.__active.request({ version: 1, sessionId: self.__session, requestId: job.id, windowId: job.windowId, operation: job.operation, payload: { view: job.payload, viewRevision: win.__viewRevision } });
              else result = self.__send(win, { type: "view", payload: job.payload });
            } catch(viewError) { win.__options.view = previousView; win.__viewRevision = previousRevision; throw viewError; }
          }
          else if (job.operation == "window.send") result = self.__send(win, job.payload);
          else result = self.__active.request({ version: 1, sessionId: self.__session, requestId: job.id, windowId: job.windowId, operation: job.operation, payload: job.payload });
          if (job.operation == "window.create") win.__created = true;
          job.future.complete(JSON.stringify(result == null ? null : self.__copy(result, 8 * 1024 * 1024)));
        }
      } catch(e) {
        if (job.operation == "window.create" && self.__windows[job.windowId]) self.__retire(self.__windows[job.windowId]);
        job.future.completeExceptionally(new java.lang.IllegalStateException(String(e.code || "PROVIDER_FAILED") + ": " + String(e.message || e)));
        self.__emit({ type: "error", windowId: job.windowId, error: { code: e.code || "PROVIDER_FAILED", message: String(e.message || e) } });
        if (self.__active && (e.code == "PROVIDER_FAILED" || e.code == "TIMEOUT")) {
          self.__state = "failed";
          self.__cleanup();
        }
      } finally { self.__pending.decrementAndGet(); self.__commandBytes.addAndGet(-job.bytes); }
    }
  });
  this.__dispatcher = this.__thread("events", function() {
    while (!self.__stopping || !self.__events.isEmpty()) {
      var text = self.__events.poll(100, java.util.concurrent.TimeUnit.MILLISECONDS);
      if (text == null) continue;
      self.__eventBytes.addAndGet(-new java.lang.String(text).getBytes("UTF-8").length);
      var event = JSON.parse(String(text)), win = event.windowId ? self.__windows[event.windowId] : null;
      if (event.type == "closed" && win) {
        if (win.__closed) continue;
        self.__retire(win);
      }
      if (event.type == "providerFailed") {
        self.__state = "failed";
        Object.keys(self.__windows).forEach(function(id) { self.__retire(self.__windows[id]); });
        event.type = "error";
      }
      self.__dispatch(event.type, event, win ? win.__listeners : self.__listeners);
      if (event.type == "closed" && win) win.__listeners = {};
    }
  });
};
OpenWrap.desktop.prototype.__emit = function(event) {
  if (this.__stopping) return;
  if (event.type == "message") {
    var viewWindow = this.__windows[event.windowId];
    if (viewWindow && viewWindow.__options.view) {
      if (event.viewRevision !== viewWindow.__viewRevision) return; // Drop input from a retired view.
      loadCompiledLib("owrap_desktop_ui_js");
      OpenWrap.desktop.__viewEvent(this, viewWindow.__options.view, event.message);
    }
  }
  if (event.type == "navigation") {
    var win = this.__windows[event.windowId];
    if (win) {
      win.__token = null;
      if (win.__socket) try { win.__socket.close(Packages.com.nwu2.httpd.NanoWSD.WebSocketFrame.CloseCode.PolicyViolation, "Navigation revoked messaging", false); } catch(e) {}
      win.__socket = null;
    }
    return;
  }
  var text = JSON.stringify(this.__copy(event, 65536)), bytes = new java.lang.String(text).getBytes("UTF-8").length;
  if (this.__eventBytes.addAndGet(bytes) > 1048576 || !this.__events.offer(text)) {
    this.__eventBytes.addAndGet(-bytes);
    logErr("Desktop QUEUE_FULL: event queue exhausted; session failed");
    this.__state = "failed";
    this.__cleanup();
  }
};
OpenWrap.desktop.prototype.__dispatch = function(type, event, listeners) {
  var self = this;
  Object.keys(listeners).forEach(function(id) {
    if (listeners[id] && listeners[id].type == type) try { listeners[id].fn(event); } catch(e) {
      logErr("Desktop callback failed: " + e);
      if (type != "error") self.__dispatch("error", { type: "error", error: { code: "CALLBACK_FAILED", message: String(e) } }, self.__listeners);
    }
  });
};
OpenWrap.desktop.prototype.__listen = function(listeners, type, fn) {
  if (["ready", "message", "closed", "error", "shutdown"].indexOf(type) < 0 || typeof fn != "function") throw this.__error("INVALID_ARGUMENT", "Invalid desktop event or callback");
  var id = String(java.util.UUID.randomUUID());
  listeners[id] = { type: type, fn: fn };
  return id;
};
OpenWrap.desktop.prototype.on = function(type, fn) { return this.__listen(this.__listeners, type, fn); };
OpenWrap.desktop.prototype.off = function(id) { delete this.__listeners[id]; };
OpenWrap.desktop.prototype.__enqueue = function(operation, windowId, payload) {
  var self = this;
  if (this.__state == "failed" || this.__state == "stopped" || this.__state == "stopping") throw this.__error("INVALID_STATE", "Desktop session is " + this.__state);
  var future = new java.util.concurrent.CompletableFuture(), job = { bytes: new java.lang.String(JSON.stringify(payload || {})).getBytes("UTF-8").length, id: String(java.util.UUID.randomUUID()), operation: operation, windowId: windowId, payload: payload || {}, future: future };
  this.__lock.lock();
  try {
    this.__workers();
    if (operation != "shutdown" && this.__commands.remainingCapacity() <= 1) throw this.__error("QUEUE_FULL", "Desktop command queue exhausted");
    if (this.__commandBytes.addAndGet(job.bytes) > 16 * 1024 * 1024 && operation != "shutdown") {
      this.__commandBytes.addAndGet(-job.bytes);
      throw this.__error("QUEUE_FULL", "Desktop command byte budget exhausted");
    }
    this.__pending.incrementAndGet();
    if (!this.__commands.offer(job)) { this.__pending.decrementAndGet(); this.__commandBytes.addAndGet(-job.bytes); throw this.__error("QUEUE_FULL", "Desktop command queue exhausted"); }
  } finally { this.__lock.unlock(); }
  return $doV(function() {
    try { return JSON.parse(String(future.get(self.__timeout, java.util.concurrent.TimeUnit.MILLISECONDS))); }
    catch(e) {
      if (String(e).indexOf("TimeoutException") >= 0) { self.__state = "failed"; self.__cleanup(); }
      var msg = String(e), match = msg.match(/(PROVIDER_UNAVAILABLE|UNSUPPORTED_CAPABILITY|INVALID_STATE|INVALID_ARGUMENT|TIMEOUT|QUEUE_FULL|MESSAGE_TOO_LARGE|PROVIDER_FAILED|SECURITY_POLICY_UNSUPPORTED): ([\s\S]*)/);
      throw self.__error(match ? match[1] : "TIMEOUT", match ? match[2] : "Desktop operation deadline exceeded: " + operation);
    }
  });
};

/** <odoc>
 * <key>ow.desktop.window(aOptions) : Object</key>
 * Creates a provider-neutral handle. Exactly one of html, url, file or a declarative view is required.
 * Commands return oPromises; on/off subscribe to ready, message, closed and error events.
 * </odoc> */
OpenWrap.desktop.prototype.window = function(options) {
  if (["failed", "stopped", "stopping"].indexOf(this.__state) >= 0) throw this.__error("INVALID_STATE", "Desktop session is " + this.__state);
  var self = this, o = this.__copy(options, 8 * 1024 * 1024);
  var allowed = ["title", "width", "height", "minWidth", "minHeight", "resizable", "html", "url", "file", "assetRoot", "messaging", "security", "view"];
  Object.keys(o).forEach(function(k) { if (allowed.indexOf(k) < 0) throw self.__error("INVALID_ARGUMENT", "Unknown window option: " + k); });
  if (["html", "url", "file", "view"].filter(function(k) { return isDef(o[k]); }).length != 1) throw this.__error("INVALID_ARGUMENT", "Specify exactly one of html, url, file or view");
  ["html", "url", "file"].forEach(function(k) { if (isDef(o[k]) && typeof o[k] != "string") throw self.__error("INVALID_ARGUMENT", k + " must be a string"); });
  if (isDef(o.view)) {
    loadCompiledLib("owrap_desktop_ui_js");
    o.view = OpenWrap.desktop.__view(this, o.view);
    if (isDef(o.messaging)) throw this.__error("INVALID_ARGUMENT", "Views use the built-in action/change/view message contract");
    o.messaging = { types: ["action", "change", "view"] };
  }
  ["width", "height", "minWidth", "minHeight"].forEach(function(k) { if (isDef(o[k]) && (!isNumber(o[k]) || o[k] < 1 || o[k] > 32768)) throw self.__error("INVALID_ARGUMENT", "Invalid " + k); });
  if (isDef(o.title) && typeof o.title != "string") throw this.__error("INVALID_ARGUMENT", "title must be a string");
  if (isDef(o.resizable) && typeof o.resizable != "boolean") throw this.__error("INVALID_ARGUMENT", "resizable must be boolean");
  if (o.url) {
    var uri = new java.net.URI(o.url), scheme = String(uri.getScheme());
    if (["http", "https"].indexOf(scheme) < 0 || uri.getHost() == null || uri.getUserInfo() != null) throw this.__error("INVALID_ARGUMENT", "Only HTTP(S) URLs without credentials are supported");
    if (o.messaging) throw this.__error("SECURITY_POLICY_UNSUPPORTED", "Remote URL messaging is disabled; use hosted HTML/file content");
  }
  if (o.file && !o.assetRoot) throw this.__error("INVALID_ARGUMENT", "file requires assetRoot");
  if (o.messaging) {
    if (!isMap(o.messaging) || !Array.isArray(o.messaging.types) || o.messaging.types.length == 0 || o.messaging.types.some(function(t) { return typeof t != "string" || !/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(t); })) throw this.__error("INVALID_ARGUMENT", "messaging.types must explicitly list allowed message types");
  }
  if (o.messaging && isDef(o.messaging.schemas)) {
    if (!isMap(o.messaging.schemas)) throw this.__error("INVALID_ARGUMENT", "messaging.schemas must be a map");
    Object.keys(o.messaging.schemas).forEach(function(k) {
      if (o.messaging.types.indexOf(k) < 0) throw self.__error("INVALID_ARGUMENT", "Schema for undeclared message type: " + k);
    });
  }
  if (o.security) {
    if (!isMap(o.security)) throw this.__error("INVALID_ARGUMENT", "security must be a capability requirement map");
    Object.keys(o.security).forEach(function(k) {
      if (["rendererSandbox", "strictNavigation", "networkIsolation"].indexOf(k) < 0 || typeof o.security[k] != "boolean") throw self.__error("INVALID_ARGUMENT", "Invalid security requirement: " + k);
    });
  }
  var win = { id: String(java.util.UUID.randomUUID()), __options: o, __listeners: {}, __closed: false, __generation: 1, __viewRevision: 1 };
  win.on = function(type, fn) { return self.__listen(win.__listeners, type, fn); };
  win.off = function(id) { delete win.__listeners[id]; };
  ["show", "hide", "close"].forEach(function(op) { win[op] = function() { return self.__enqueue("window." + op, win.id, {}); }; });
  win.setTitle = function(title) {
    if (typeof title != "string") throw self.__error("INVALID_ARGUMENT", "title must be a string");
    return self.__enqueue("window.setTitle", win.id, { title: title });
  };
  win.setView = function(view) {
    if (!o.view) throw self.__error("INVALID_STATE", "setView requires a view window");
    return self.__enqueue("window.setView", win.id, OpenWrap.desktop.__view(self, view));
  };
  win.send = function(type, payload) {
    if (o.view) {
      if (type != "view") throw self.__error("INVALID_ARGUMENT", "View windows accept send('view', view) or setView(view)");
      return win.setView(payload);
    }
    if (!o.messaging || o.messaging.types.indexOf(type) < 0) throw self.__error("INVALID_ARGUMENT", "Message type is not allowed");
    return self.__enqueue("window.send", win.id, self.__copy({ type: type, payload: payload }, 65536));
  };
  this.__windows[win.id] = win;
  try { win.created = this.__enqueue("window.create", win.id, o); } catch(e) { delete this.__windows[win.id]; throw e; }
  return win;
};
OpenWrap.desktop.prototype.__retire = function(win) {
  win.__closed = true;
  win.__token = null;
  if (win.__socket) try { win.__socket.close(Packages.com.nwu2.httpd.NanoWSD.WebSocketFrame.CloseCode.NormalClosure, "Window closed", false); } catch(e) {}
  win.__socket = null;
};
OpenWrap.desktop.prototype.__cleanup = function() {
  this.__stopping = true;
  Object.keys(this.__windows).forEach(function(id) { this.__retire(this.__windows[id]); }, this);
  var stopError;
  if (this.__active) { var p = this.__active; this.__active = null; try { p.stop(); } catch(e) { stopError = e; } }
  if (this.__server) {
    ow.server.httpd.stop(this.__server);
    this.__server = null;
  }
  var job;
  while ((job = this.__commands.poll()) != null) {
    job.future.completeExceptionally(new java.lang.IllegalStateException("INVALID_STATE: Desktop shut down"));
    this.__pending.decrementAndGet();
    this.__commandBytes.addAndGet(-job.bytes);
  }
  if (stopError) throw stopError;
};
/** <odoc>
 * <key>ow.desktop.shutdown() : oPromise</key>
 * Stops only the desktop session and its owned helper/server. Idempotent.
 * </odoc> */
OpenWrap.desktop.prototype.shutdown = function() {
  var self = this;
  if (this.__shutdownPromise) return this.__shutdownPromise;
  if (this.__state == "failed") {
    this.__shutdownPromise = $doV(function() { self.__cleanup(); self.__state = "stopped"; return null; });
    return this.__shutdownPromise;
  }
  if (this.__stopping || this.__state == "stopped") return $doV(function() { return null; });
  var p = this.__enqueue("shutdown", null, {});
  this.__shutdownPromise = p;
  p.then(function() { self.__dispatch("shutdown", { type: "shutdown" }, self.__listeners); });
  return p;
};
/** <odoc>
 * <key>ow.desktop.wait(aTimeoutMs)</key>
 * Keeps a standalone script alive until windows close, then shuts down desktop resources.
 * An optional deadline raises TIMEOUT after cleanup. Do not call from a desktop callback.
 * </odoc> */
OpenWrap.desktop.prototype.wait = function(timeout) {
  if (this.__dispatcher && java.lang.Thread.currentThread().equals(this.__dispatcher)) throw this.__error("INVALID_STATE", "wait cannot run inside desktop callbacks");
  var start = now(), self = this, timedOut = false;
  while (this.__pending.get() > 0 || Object.keys(this.__windows).some(function(id) { return !self.__windows[id].__closed; })) {
    if (this.__state == "failed") break;
    if (isDef(timeout) && now() - start >= timeout) { timedOut = true; break; }
    sleep(20, true);
  }
  var failed = this.__state == "failed";
  if (failed) this.__cleanup();
  else {
    var stopped = this.shutdown();
    // oPromise clears executing just before publishing its final state. Wait for the state itself.
    var deadline = now() + this.__timeout + 1000;
    while (stopped.state.get() != stopped.states.FAILED && stopped.state.get() != stopped.states.FULFILLED && now() < deadline) sleep(10, true);
    if (stopped.state.get() == stopped.states.FAILED) throw stopped.reason;
    if (stopped.state.get() != stopped.states.FULFILLED) throw this.__error("TIMEOUT", "Desktop shutdown deadline exceeded");
  }
  if (timedOut) throw this.__error("TIMEOUT", "Desktop wait deadline exceeded");
  if (failed) throw this.__error("PROVIDER_FAILED", "Desktop session failed");
};

OpenWrap.desktop.prototype.__prepare = function(win) {
  var o = this.__copy(win.__options, 8 * 1024 * 1024);
  var self = this;
  if (o.security) Object.keys(o.security).forEach(function(k) {
    if (o.security[k] && !self.__caps[k]) throw self.__error("SECURITY_POLICY_UNSUPPORTED", "Provider cannot enforce " + k);
  });
  if (o.view) {
    if (!this.__caps.declarativeViews) throw this.__error("UNSUPPORTED_CAPABILITY", "Provider has no declarative views");
    if (this.__caps.nativeViews) { o.viewRevision = win.__viewRevision; return o; }
    win.__html = OpenWrap.desktop.__viewHTML(o.view);
    o.html = win.__html;
    delete o.view;
  } else if (this.__caps.nativeViews) throw this.__error("UNSUPPORTED_CAPABILITY", "TUI requires a declarative view; HTML/URL/file rendering is unavailable");
  if (o.url || (isDef(o.html) && !o.messaging)) return o;
  if (o.file) {
    var root = new java.io.File(o.assetRoot).getCanonicalFile();
    var entry = new java.io.File(root, o.file).getCanonicalFile();
    if (!root.isDirectory() || !entry.toPath().startsWith(root.toPath()) || !entry.isFile()) throw this.__error("INVALID_ARGUMENT", "File entry must exist inside assetRoot");
    win.__root = root;
    win.__entry = String(root.toPath().relativize(entry.toPath())).replace(/\\/g, "/");
  }
  this.__serve();
  win.__token = String(java.util.UUID.randomUUID()).replace(/-/g, "") + String(java.util.UUID.randomUUID()).replace(/-/g, "");
  win.__sequence = 0;
  win.__outSequence = 0;
  win.__path = "/desktop/" + win.id + "/" + win.__token + "/";
  if (o.messaging) ow.server.httpd.setWebSocketRoute(this.__server, win.__path + "ws");
  win.__url = this.__origin + win.__path + (win.__entry ? win.__entry.split("/").map(encodeURIComponent).join("/") : "index.html");
  delete o.html;
  delete o.file;
  delete o.assetRoot;
  o.url = win.__url;
  return o;
};
OpenWrap.desktop.prototype.__bridgeScript = function(win) {
  var config = { version: 1, sessionId: this.__session, windowId: win.id, generation: win.__generation, types: win.__options.messaging.types, viewRevision: win.__options.view ? win.__viewRevision : null, url: this.__origin.replace("http:", "ws:") + win.__path + "ws" };
  return "<script>(function(c){'use strict';var s=new WebSocket(c.url),n=0,out=0,r=c.viewRevision,handlers=[],readyResolve,readyReject;" +
    "var ready=new Promise(function(a,b){readyResolve=a;readyReject=b;});" +
    "s.onopen=function(){readyResolve();};s.onerror=function(){readyReject(new Error('Desktop connection failed'));};" +
    "s.onmessage=function(e){var m=JSON.parse(e.data);if(m.version!==1||m.sessionId!==c.sessionId||m.windowId!==c.windowId||m.generation!==c.generation||m.sequence!==out+1)return;out=m.sequence;if(r!==null&&m.type==='view'){if(!Number.isSafeInteger(m.viewRevision)||m.viewRevision<=r)return;r=m.viewRevision;}handlers.slice().forEach(function(f){try{f(m);}catch(e){console.error(e);}});};" +
    "function valid(v,seen){if(v===null||typeof v==='string'||typeof v==='boolean')return;if(typeof v==='number'&&isFinite(v))return;if(typeof v!=='object'||seen.indexOf(v)>=0||seen.length>32)throw new Error('JSON data required');var tag=Object.prototype.toString.call(v);if(tag!=='[object Object]'&&tag!=='[object Array]')throw new Error('Plain JSON required');seen.push(v);Object.keys(v).forEach(function(k){if(k==='__proto__'||k==='constructor'||k==='prototype')throw new Error('Reserved key');valid(v[k],seen);});if(Array.isArray(v))for(var i=0;i<v.length;i++)valid(v[i],seen);seen.pop();}" +
    "Object.defineProperty(window,'openafDesktop',{value:Object.freeze({ready:ready,send:function(type,payload){if(c.types.indexOf(type)<0)throw new Error('Message type is not allowed');" +
    "if(s.readyState!==1)throw new Error('Desktop connection not ready');valid(payload,[]);var t=JSON.stringify({version:1,sessionId:c.sessionId,windowId:c.windowId,generation:c.generation,sequence:n+1,viewRevision:r,type:type,payload:payload});" +
    "if(new TextEncoder().encode(t).length>65536||s.bufferedAmount>1048576)throw new Error('Desktop message limit exceeded');s.send(t);n++;},onMessage:function(f){if(typeof f!=='function')throw new Error('Callback required');handlers.push(f);return function(){var i=handlers.indexOf(f);if(i>=0)handlers.splice(i,1);};}}),writable:false,configurable:false});" +
    "})(" + JSON.stringify(config).replace(/</g, "\\u003c") + ");</script>";
};
OpenWrap.desktop.prototype.__serve = function() {
  if (this.__server) return;
  ow.loadServer();
  var self = this, closeCode = Packages.com.nwu2.httpd.NanoWSD.WebSocketFrame.CloseCode;
  function close(ws) { try { ws.close(closeCode.PolicyViolation, "Desktop policy", false); } catch(e) {} }
  function identify(ws) {
    var h = ws.getHandshakeRequest(), path = String(h.getUri()), parts = path.split("/"), win = self.__windows[parts[2]];
    if (!win || win.__closed || !win.__token || !win.__options.messaging || path != win.__path + "ws" || String(h.getHeaders().get("host")) != self.__host || String(h.getHeaders().get("origin")) != self.__origin) return null;
    return win;
  }
  this.__server = ow.server.httpd.start(__, "127.0.0.1", __, __, function() {}, {
    onOpen: function(ws) {
      var w = identify(ws);
      if (!w || w.__socket) { close(ws); return; }
      ws.setMaxMessageSize(65536);
      w.__socket = ws;
    },
    onClose: function(ws) { var w = identify(ws); if (w && w.__socket && w.__socket.equals(ws)) w.__socket = null; },
    onMessage: function(ws, frame) {
      var w = identify(ws);
      try {
        if (!w || !w.__socket || !w.__socket.equals(ws)) throw new Error("Invalid socket");
        var raw = String(frame.getTextPayload());
        if (new java.lang.String(raw).getBytes("UTF-8").length > 65536) throw new Error("Payload limit");
        var m = self.__copy(JSON.parse(raw), 65536);
        if (m.version !== 1 || m.sessionId !== self.__session || m.windowId !== w.id || m.generation !== w.__generation || !Number.isSafeInteger(m.sequence) || m.sequence !== w.__sequence + 1 || w.__options.messaging.types.indexOf(m.type) < 0 || !Object.prototype.hasOwnProperty.call(m, "payload")) throw new Error("Invalid message");
        if (w.__options.messaging.schemas && Object.prototype.hasOwnProperty.call(w.__options.messaging.schemas, m.type)) {
          ow.loadObj();
          ow.obj.schemaValidate(w.__options.messaging.schemas[m.type], m.payload);
        }
        if (w.__options.view && (!Number.isSafeInteger(m.viewRevision) || m.viewRevision < 1 || m.viewRevision > w.__viewRevision)) throw new Error("Invalid view revision");
        w.__sequence = m.sequence;
        if (w.__options.view && m.viewRevision != w.__viewRevision) return;
        self.__emit({ type: "message", windowId: w.id, viewRevision: w.__options.view ? m.viewRevision : null, generation: w.__generation, sequence: m.sequence, message: { type: m.type, payload: m.payload } });
      } catch(e) { close(ws); }
    },
    onException: function(ws) { close(ws); }
  }, 30000, "nwu2");
  this.__host = "127.0.0.1:" + this.__server.getPort();
  this.__origin = "http://" + this.__host;
  // Register each exact WebSocket route when preparing a window.
  ow.server.httpd.route(this.__server, {}, function(req) {
    try {
      var path = String(req.uri), parts = path.split("/"), w = self.__windows[parts[2]], headers = req.header || {};
      if (String(headers.host || headers.Host) != self.__host || String(req.method).toUpperCase() != "GET" || !w || w.__closed || !w.__token || path.indexOf(w.__path) !== 0) return ow.server.httpd.reply("", 403, "text/plain");
      var rel = decodeURIComponent(path.substring(w.__path.length));
      if (rel.indexOf("\u0000") >= 0 || rel.indexOf("\\") >= 0) return ow.server.httpd.reply("", 403, "text/plain");
      var data, mime = "text/html; charset=utf-8";
      if (w.__root) {
        var file = new java.io.File(w.__root, rel).getCanonicalFile();
        if (!file.toPath().startsWith(w.__root.toPath()) || !file.isFile() || file.length() > 8 * 1024 * 1024) return ow.server.httpd.reply("", 403, "text/plain");
        var ext = String(file.getName()).split(".").pop().toLowerCase();
        mime = ({ html: "text/html; charset=utf-8", htm: "text/html; charset=utf-8", js: "text/javascript", css: "text/css", json: "application/json", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", svg: "image/svg+xml", woff: "font/woff", woff2: "font/woff2" })[ext];
        if (!mime) return ow.server.httpd.reply("", 403, "text/plain");
        data = mime.indexOf("text/html") == 0 ? io.readFileString(String(file)) : io.readFileBytes(String(file));
      } else {
        if (rel != "index.html") return ow.server.httpd.reply("", 404, "text/plain");
        data = isDef(w.__html) ? w.__html : w.__options.html;
      }
      if (mime.indexOf("text/html") == 0 && w.__options.messaging) {
        // Only the entry document receives a bridge, not other HTML assets.
        if (rel != (w.__entry || "index.html")) return ow.server.httpd.reply("", 403, "text/plain");
        var bridge = self.__bridgeScript(w);
        data = /<head[\s>]/i.test(data) ? data.replace(/(<head[^>]*>)/i, "$1" + bridge) : bridge + data;
      }
      return ow.server.httpd.reply(typeof data == "string" ? af.fromString2Bytes(data) : data, 200, mime, {
        "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src " + self.__origin.replace("http:", "ws:") + "; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
      });
    } catch(e) { return ow.server.httpd.reply("", 403, "text/plain"); }
  });
};
OpenWrap.desktop.prototype.__send = function(win, message) {
  if (!win || !win.__socket || !win.__socket.isOpen()) throw this.__error("INVALID_STATE", "Frontend messaging is not connected");
  var envelope = this.__copy({ version: 1, sessionId: this.__session, windowId: win.id, generation: win.__generation, sequence: win.__outSequence + 1, type: message.type, payload: message.payload }, 65536);
  if (win.__options.view) envelope.viewRevision = win.__viewRevision;
  if (win.__options.messaging.schemas && Object.prototype.hasOwnProperty.call(win.__options.messaging.schemas, message.type)) {
    ow.loadObj(); ow.obj.schemaValidate(win.__options.messaging.schemas[message.type], message.payload);
  }
  win.__socket.send(JSON.stringify(envelope));
  win.__outSequence++;
  return null;
};
