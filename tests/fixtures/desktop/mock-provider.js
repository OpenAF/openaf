exports.create = function(options) {
  options = options || {};
  var emit, session, started = 0, stopped = 0, requests = [];
  return {
    describe: function() { return { id: options.id || "mock", version: "1", spi: 1 }; },
    probe: function() { return { available: options.available !== false, reason: "mock unavailable" }; },
    start: function(config, callback) {
      started++; emit = callback; session = config.sessionId;
      if (options.failStart) throw new Error("mock start failed");
      return { windows: true, multipleWindows: true, messaging: true, dialogs: true, notifications: false, tray: false };
    },
    request: function(envelope) {
      requests.push(envelope.operation);
      if (options.delay) sleep(options.delay, true);
      if (envelope.sessionId !== session || envelope.version !== 1) throw new Error("Invalid portable envelope");
      if (envelope.operation == "window.create") emit({ type: "ready", windowId: envelope.windowId });
      if (envelope.operation == "window.close") emit({ type: "closed", windowId: envelope.windowId });
      if (envelope.operation == "dialog.confirm") return true;
      return null;
    },
    stop: function() { stopped++; if (options.failStop) throw new Error("mock stop failed"); },
    counts: function() { return { started: started, stopped: stopped, requests: requests }; },
    emit: function(event) { emit(event); }
  };
};
