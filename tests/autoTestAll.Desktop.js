(function() {
  var assert = function(a, b, text) { ow.test.assert(a, b, text); };
  var fixture = function(options) { return require("fixtures/desktop/mock-provider.js").create(options); };
  var desktop = function(options) { return new OpenWrap.desktop(options || { provider: "mock" }); };
  var awaitResult = function(p) {
    var deadline = now() + 5000;
    while (p.state.get() != p.states.FAILED && p.state.get() != p.states.FULFILLED && now() < deadline) sleep(10, true);
    if (p.state.get() == p.states.FAILED) throw p.reason;
    assert(p.state.get(), p.states.FULFILLED, "Desktop operation settled");
    return p.value;
  };
  var throws = function(fn, code) {
    var error;
    try { fn(); } catch(e) { error = e; }
    assert(isDef(error), true, "Expected failure " + code);
    assert(error.code, code, "Structured failure code");
  };
  exports.testLazyAndRegistration = function() {
    ow.loadDesktop();
    assert(ow.loadDesktop() === ow.desktop, true, "Loader is cached");
    assert(ow.desktop.info().state, "uninitialized", "No toolkit on load");
    var d = desktop(), p = fixture();
    d.registerProvider(p);
    throws(function() { d.registerProvider(p); }, "INVALID_ARGUMENT");
    assert(p.counts().started, 0, "Registration does not start provider");
    try { assert(awaitResult(d.start()).capabilities.windows, true, "Explicit initialization discovers capabilities without a window"); }
    finally { awaitResult(d.shutdown()); }
    throws(function() { desktop().registerProvider({}); }, undefined);
  };
  exports.testSelectionAndFailure = function() {
    var d = desktop({ provider: "auto" }), fx = fixture({ id: "javafx", available: false }), electron = fixture({ id: "electron" });
    d.registerProvider(fx).registerProvider(electron);
    var w = d.window({ html: "hello" });
    try {
      awaitResult(w.show());
      assert(d.info().provider.id, "electron", "Auto skips unavailable provider");
      assert(fx.counts().started, 0, "Unavailable provider not started");
      assert(d.info().capabilities.notifications, false, "Actual capabilities");
      throws(function() { d.__configure({ provider: "javafx" }); }, "INVALID_STATE");
      awaitResult(w.close()); d.wait(5000);
    } finally { d.__cleanup(); }
    d = desktop({ provider: "missing" });
    w = d.window({ html: "hello" });
    $doWait(w.created, 5000);
    assert(w.created.state.get(), w.created.states.FAILED, "Explicit missing provider fails");
    assert(w.created.reason.code, "PROVIDER_UNAVAILABLE", "Missing provider error");
    d.__cleanup();
    d = desktop({ provider: "auto" });
    fx = fixture({ id: "javafx", failStart: true }); electron = fixture({ id: "electron" });
    d.registerProvider(fx).registerProvider(electron);
    w = d.window({ html: "hello" });
    try { awaitResult(w.created); assert(fx.counts().stopped, 1, "Failed initialization cleaned up"); assert(d.info().provider.id, "electron", "Auto recovers from clean initialization failure"); } finally { awaitResult(d.shutdown()); }
  };
  exports.testWindowsAndOrdering = function() {
    var d = desktop(), p = fixture({ delay: 5 }), closed = new java.util.concurrent.CountDownLatch(2);
    d.registerProvider(p);
    var a = d.window({ html: "a" }), b = d.window({ html: "b", width: 400, height: 300 });
    a.on("closed", function() { closed.countDown(); }); b.on("closed", function() { closed.countDown(); });
    try {
      awaitResult(a.show()); awaitResult(b.show()); awaitResult(a.hide()); awaitResult(a.setTitle("new"));
      assert(p.counts().started, 1, "Windows share runtime");
      assert(awaitResult(d.dialog.confirm("Continue?")), true, "Dialog JSON result");
      awaitResult(a.close()); awaitResult(b.close());
      assert(closed.await(2, java.util.concurrent.TimeUnit.SECONDS), true, "Closed events delivered once");
      d.wait(5000); awaitResult(d.shutdown());
      assert(p.counts().stopped, 1, "Idempotent shutdown");
      assert(p.counts().requests.slice(0, 4), ["window.create", "window.create", "window.show", "window.show"], "FIFO command order");
    } finally { d.__cleanup(); }
  };
  exports.testValidationAndSerialization = function() {
    var d = desktop();
    throws(function() { d.window({ html: "a", url: "https://example.com" }); }, "INVALID_ARGUMENT");
    throws(function() { d.window({ url: "file:///etc/passwd" }); }, "INVALID_ARGUMENT");
    throws(function() { d.window({ url: "http://user:pass@localhost/" }); }, "INVALID_ARGUMENT");
    throws(function() { d.window({ file: "index.html" }); }, "INVALID_ARGUMENT");
    throws(function() { d.window({ html: "a", modal: true }); }, "INVALID_ARGUMENT");
    throws(function() { d.window({ url: "https://example.com", messaging: { types: ["click"] } }); }, "SECURITY_POLICY_UNSUPPORTED");
    throws(function() { d.__copy({ value: NaN }, 100); }, "INVALID_ARGUMENT");
    throws(function() { d.__copy({ value: function() {} }, 100); }, "INVALID_ARGUMENT");
    throws(function() { d.__copy(new java.util.HashMap(), 100); }, "INVALID_ARGUMENT");
    var cycle = {}; cycle.self = cycle;
    throws(function() { d.__copy(cycle, 100); }, "INVALID_ARGUMENT");
    throws(function() { d.__copy("€€", 7); }, "MESSAGE_TOO_LARGE");
    assert(d.__copy({ x: [1, null, false] }, 100), { x: [1, null, false] }, "JSON round trip");
    d.registerProvider(fixture());
    var strict = d.window({ html: "a", security: { rendererSandbox: true } });
    try { $doWait(strict.created, 5000); assert(strict.created.reason.code, "SECURITY_POLICY_UNSUPPORTED", "Actual provider cannot weaken security requirement"); }
    finally { awaitResult(d.shutdown()); }
  };
  exports.testCallbacksAndShutdown = function() {
    var d = desktop(), p = fixture(), errors = new java.util.concurrent.CountDownLatch(1);
    d.registerProvider(p);
    var w = d.window({ html: "hello" });
    try {
      awaitResult(w.created);
      d.on("error", function(e) { if (e.error.code == "CALLBACK_FAILED") errors.countDown(); });
      w.on("message", function() { throw new Error("intentional callback failure"); });
      p.emit({ type: "message", windowId: w.id, message: { type: "test", payload: {} } });
      assert(errors.await(2, java.util.concurrent.TimeUnit.SECONDS), true, "Callback error observable");
      awaitResult(w.close()); d.wait(5000);
      assert(d.info().state, "stopped", "Wait cleans up runtime");
      throws(function() { d.window({ html: "new" }); }, "INVALID_STATE");
    } finally { d.__cleanup(); }
  };
  exports.testMessagingAndAssets = function() {
    var d = desktop(), p = fixture(); d.registerProvider(p);
    var w = d.window({ html: "<h1>Hello</h1>", messaging: { types: ["status"] } });
    try {
      awaitResult(w.created);
      var r = $rest().get(w.__url);
      assert(String(r).indexOf("openafDesktop") >= 0, true, "Hosted entry contains narrow bridge");
      throws(function() { w.send("other", {}); }, "INVALID_ARGUMENT");
      throws(function() { awaitResult(w.send("status", {})); }, "INVALID_STATE");
      d.__emit({ type: "navigation", windowId: w.id });
      assert(w.__token, null, "Navigation revokes credentials");
    } finally { awaitResult(d.shutdown()); }
  };
  exports.testProcessContract = function() {
    var helper = String(new java.io.File("fixtures/desktop/pipe-helper.js").getCanonicalPath());
    var d = desktop({ provider: "pipe" });
    d.registerProvider(require("fixtures/desktop/pipe-provider.js").create(helper));
    var w = d.window({ html: "pipe test" });
    try {
      awaitResult(w.show());
      assert(awaitResult(d.dialog.confirm("Process boundary")), true, "Boolean crosses real pipe boundary");
      awaitResult(w.close()); d.wait(5000);
    } finally { d.__cleanup(); }
  };
  exports.testHandshakeAndFrameLimits = function() {
    var expected = "s3pPLMBiTxaQ9kYGzzhZRbK+xOo=";
    assert(String(Packages.com.nwu.httpd.NanoWSD.makeAcceptKey("dGhlIHNhbXBsZSBub25jZQ==")), expected, "RFC 6455 legacy handshake vector");
    assert(String(Packages.com.nwu2.httpd.NanoWSD.makeAcceptKey("dGhlIHNhbXBsZSBub25jZQ==")), expected, "RFC 6455 NWU2 handshake vector");
    var frame = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 10);
    // A declared 65537-byte payload with no payload bytes must fail the size gate before allocation/read.
    frame[0] = -127; frame[1] = 127; frame[7] = 1; frame[9] = 1;
    var error;
    try { Packages.com.nwu2.httpd.NanoWSD.WebSocketFrame.read(new java.io.ByteArrayInputStream(frame), 65536); } catch(e) { error = e; }
    assert(String(error).indexOf("Frame limit exceeded") >= 0, true, "Frame limit checked before payload read");
  };
  exports.testWebSocketSecurity = function() {
    var d = desktop(); d.registerProvider(fixture());
    var w = d.window({ html: "<h1>Bridge</h1>", messaging: { types: ["click", "status"], schemas: { click: { type: "object", required: ["id"], properties: { id: { type: "integer" } }, additionalProperties: false } } } });
    var socket, received = new java.util.concurrent.CountDownLatch(1);
    function connect(origin) {
      var raw = new java.net.Socket("127.0.0.1", Number(d.__server.getPort())); raw.setSoTimeout(3000);
      raw.getOutputStream().write(af.fromString2Bytes("GET " + w.__path + "ws HTTP/1.1\r\nHost: " + d.__host + "\r\nOrigin: " + origin + "\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nSec-WebSocket-Version: 13\r\n\r\n"));
      var input = raw.getInputStream(), header = "", ch;
      while (header.indexOf("\r\n\r\n") < 0 && header.length < 8192 && (ch = input.read()) != -1) header += String.fromCharCode(ch);
      assert(header.indexOf("101") >= 0, true, "WebSocket upgrade response");
      assert(header.indexOf("s3pPLMBiTxaQ9kYGzzhZRbK+xOo=") >= 0, true, "Standard handshake accept");
      return raw;
    }
    function send(raw, message) {
      var bytes = af.fromString2Bytes(JSON.stringify(message)), out = new java.io.ByteArrayOutputStream();
      out.write(129);
      if (bytes.length < 126) out.write(128 + bytes.length);
      else { out.write(254); out.write(bytes.length >> 8); out.write(bytes.length & 255); }
      [1,2,3,4].forEach(function(v) { out.write(v); });
      for (var i = 0; i < bytes.length; i++) out.write((bytes[i] & 255) ^ ((i % 4) + 1));
      raw.getOutputStream().write(out.toByteArray());
    }
    function frame(raw) { return Packages.com.nwu2.httpd.NanoWSD.WebSocketFrame.read(raw.getInputStream(), 65536); }
    function waitDisconnect() { var deadline = now() + 2000; while (w.__socket && now() < deadline) sleep(10, true); }
    try {
      awaitResult(w.created);
      w.on("message", function(e) { if (e.message.type == "click" && e.message.payload.id == 21) received.countDown(); });
      socket = connect(d.__origin);
      send(socket, { version: 1, sessionId: d.__session, windowId: w.id, generation: 1, sequence: 1, type: "click", payload: { id: 21 } });
      assert(received.await(3, java.util.concurrent.TimeUnit.SECONDS), true, "Valid authenticated message reaches callback");
      awaitResult(w.send("status", { ready: true }));
      assert(JSON.parse(String(frame(socket).getTextPayload())).type, "status", "Backend message reaches frontend");
      // Duplicate sequence and a wrong origin must close without dispatching a message.
      send(socket, { version: 1, sessionId: d.__session, windowId: w.id, generation: 1, sequence: 1, type: "click", payload: { id: 21 } });
      assert(String(frame(socket).getOpCode()), "Close", "Duplicate sequence closes connection");
      socket.close(); socket = null; waitDisconnect();
      socket = connect("https://untrusted.example");
      assert(String(frame(socket).getOpCode()), "Close", "Untrusted origin denied");
      socket.close(); socket = null;
      var invalid = [
        { windowId: "another-window" }, { generation: 0 }, { type: "unregistered" }, { payload: { id: "wrong-type" } }
      ];
      invalid.forEach(function(change) {
        waitDisconnect(); socket = connect(d.__origin);
        var message = { version: 1, sessionId: d.__session, windowId: w.id, generation: 1, sequence: 2, type: "click", payload: { id: 21 } };
        Object.keys(change).forEach(function(k) { message[k] = change[k]; });
        send(socket, message);
        assert(String(frame(socket).getOpCode()), "Close", "Invalid destination/generation/type/schema denied");
        socket.close(); socket = null;
      });
      var raw = new java.net.Socket("127.0.0.1", Number(d.__server.getPort())); raw.setSoTimeout(3000);
      try {
        raw.getOutputStream().write(af.fromString2Bytes("GET " + w.__path + "index.html HTTP/1.1\r\nHost: attacker.example\r\nConnection: close\r\n\r\n"));
        var first = new java.io.BufferedReader(new java.io.InputStreamReader(raw.getInputStream())).readLine();
        assert(String(first).indexOf("403") >= 0, true, "Invalid Host rejected");
      } finally { raw.close(); }
    } finally { if (socket) socket.close(); awaitResult(d.shutdown()); }
  };
  exports.testRootedFiles = function() {
    var dir = String(java.nio.file.Files.createTempDirectory("openaf-desktop-assets-")), root = dir + "/assets";
    io.mkdir(root); io.writeFileString(root + "/index.html", "<h1>Rooted file</h1>"); io.writeFileString(dir + "/secret.html", "secret");
    var d = desktop(); d.registerProvider(fixture());
    var w = d.window({ file: "index.html", assetRoot: root });
    function status(path) {
      var socket = new java.net.Socket("127.0.0.1", Number(d.__server.getPort())); socket.setSoTimeout(3000);
      try {
        socket.getOutputStream().write(af.fromString2Bytes("GET " + path + " HTTP/1.1\r\nHost: " + d.__host + "\r\nConnection: close\r\n\r\n"));
        return String(new java.io.BufferedReader(new java.io.InputStreamReader(socket.getInputStream())).readLine());
      } finally { socket.close(); }
    }
    try {
      awaitResult(w.created);
      assert(status(w.__path + "index.html").indexOf("200") >= 0, true, "Rooted entry served");
      assert(status(w.__path + "%2e%2e/secret.html").indexOf("403") >= 0, true, "Encoded traversal blocked");
      if (String(java.lang.System.getProperty("os.name")).toLowerCase().indexOf("windows") < 0) {
        java.nio.file.Files.createSymbolicLink(java.nio.file.Path.of(root + "/leak.html"), java.nio.file.Path.of(dir + "/secret.html"));
        assert(status(w.__path + "leak.html").indexOf("403") >= 0, true, "Symlink escape blocked");
      }
    } finally { awaitResult(d.shutdown()); io.rm(dir); }
  };
})();
