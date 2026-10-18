exports.create = function(helper) {
  var process, writer, reader, emit;
  return {
    describe: function() { return { id: "pipe", version: "1", spi: 1 }; },
    probe: function() { return { available: true }; },
    start: function(cfg, callback) {
      emit = callback;
      var args = new java.util.ArrayList();
      [String(java.lang.System.getProperty("java.home")) + "/bin/java", "-Dopenaf.cds.training=true", "-jar", getOpenAFJar(), "-f", helper].forEach(function(a) { args.add(a); });
      process = new java.lang.ProcessBuilder(args).redirectError(java.lang.ProcessBuilder.Redirect.INHERIT).start();
      reader = new java.io.BufferedReader(new java.io.InputStreamReader(process.getInputStream(), "UTF-8"));
      writer = new java.io.BufferedWriter(new java.io.OutputStreamWriter(process.getOutputStream(), "UTF-8"));
      return { windows: true, multipleWindows: true, dialogs: true, messaging: false };
    },
    request: function(r) {
      writer.write(JSON.stringify(r)); writer.newLine(); writer.flush();
      var deadline = now() + 5000;
      while (now() < deadline) {
        if (!reader.ready()) { sleep(10, true); continue; }
        var line = reader.readLine(); if (line == null) throw new Error("Pipe disconnected");
        var response = JSON.parse(String(line));
        if (response.event) { emit(response.event); continue; }
        if (response.sessionId != r.sessionId || response.requestId != r.requestId) throw new Error("Invalid portable response");
        return response.payload;
      }
      throw new Error("Pipe provider deadline");
    },
    stop: function() {
      if (!process) return;
      writer.close();
      if (!process.waitFor(3000, java.util.concurrent.TimeUnit.MILLISECONDS)) process.destroyForcibly();
    }
  };
};
