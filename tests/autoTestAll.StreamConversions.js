// Copyright 2026 Nuno Aguiar
(function() {
  var methods = [
    { name: "Base64 encode", run: function(i, o, keep) { return af.toBase64Stream(i, o, keep); } },
    { name: "Base64 decode", run: function(i, o, keep) { return af.fromBase64Stream(i, o, keep); } },
    { name: "GZIP", run: function(i, o, keep) { return io.gzipStream(i, o, keep); } },
    { name: "GUNZIP", run: function(i, o, keep) { return io.gunzipStream(i, o, keep); } }
  ];

  function bytes(size) {
    var b = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, size);
    new java.util.Random(42).nextBytes(b);
    return b;
  }

  function input(data, state) {
    var delegate = new java.io.ByteArrayInputStream(data);
    return new JavaAdapter(java.io.InputStream, {
      read: function(buffer, offset, length) {
        if (arguments.length == 0) return delegate.read();
        return arguments.length == 1 ? delegate.read(buffer) : delegate.read(buffer, offset, length);
      },
      available: function() { return delegate.available(); },
      close: function() { state.closed++; }
    });
  }

  function output(state) {
    state.bytes = new java.io.ByteArrayOutputStream();
    return new JavaAdapter(java.io.OutputStream, {
      write: function(buffer, offset, length) {
        if (arguments.length == 1) state.bytes.write(buffer);
        else state.bytes.write(buffer, offset, length);
      },
      close: function() { state.closed++; },
      flush: function() { state.flushed++; }
    });
  }

  function caught(fn) {
    try { fn(); } catch (e) { return e; }
    throw "Expected conversion to fail";
  }

  function payload(index, data) {
    return index == 1 ? af.toBase64Bytes(data) : index == 3 ? io.gzip(data) : data;
  }

  exports.testRoundTrips = function() {
    [0, 1, 2, 3, 4, 65535, 65536, 65537, 200003].forEach(function(size) {
      var data = bytes(size);
      var encoded = af.newOutputStream();
      ow.test.assert(isUnDef(af.toBase64Stream(af.fromBytes2InputStream(data), encoded)), true, "Return undefined");
      ow.test.assert(sha256(encoded.toByteArray()), sha256(af.toBase64Bytes(data)), "Base64 encode " + size);
      var decoded = af.newOutputStream();
      af.fromBase64Stream(af.fromBytes2InputStream(encoded.toByteArray()), decoded);
      ow.test.assert(sha256(decoded.toByteArray()), sha256(data), "Base64 round trip " + size);
      var zipped = af.newOutputStream();
      io.gzipStream(af.fromBytes2InputStream(data), zipped);
      ow.test.assert(sha256(io.gunzip(zipped.toByteArray())), sha256(data), "Legacy GUNZIP " + size);
      var unzipped = af.newOutputStream();
      io.gunzipStream(af.fromBytes2InputStream(payload(3, data)), unzipped);
      ow.test.assert(sha256(unzipped.toByteArray()), sha256(data), "Legacy GZIP " + size);
      unzipped = af.newOutputStream();
      io.gunzipStream(af.fromBytes2InputStream(zipped.toByteArray()), unzipped);
      ow.test.assert(sha256(unzipped.toByteArray()), sha256(data), "GZIP round trip " + size);
    });
    ["", "Zg", "Zg==", " Z m\n8=\r\n", "-_8=", "Zg==ignored", "%%%%", "A"].forEach(function(text) {
      var result = af.newOutputStream();
      af.fromBase64Stream(af.fromString2InputStream(text, "UTF-8"), result);
      ow.test.assert(sha256(result.toByteArray()), sha256(af.fromBase64(text)), "Lenient Base64: " + text);
    });
  };

  exports.testOwnership = function() {
    methods.forEach(function(method, index) {
      [undefined, false, true].forEach(function(keep) {
        var si = { closed: 0 }, so = { closed: 0, flushed: 0 };
        var source = input(payload(index, bytes(1)), si), target = output(so);
        ow.test.assert(isUnDef(method.run(source, target, keep)), true, method.name + " return");
        ow.test.assert(si.closed, keep === true ? 0 : 1, method.name + " input ownership");
        ow.test.assert(so.closed, keep === true ? 0 : 1, method.name + " output ownership");
        ow.test.assert(so.flushed > 0, true, method.name + " flush");
        if (index == 0) ow.test.assert(String(so.bytes.toString("US-ASCII")), String(java.util.Base64.getEncoder().encodeToString(bytes(1))), "Padding finalized before return");
        if (index == 2) ow.test.assert(sha256(io.gunzip(so.bytes.toByteArray())), sha256(bytes(1)), "GZIP trailer finalized before return");
        source.close(); target.close();
      });
    });
  };

  exports.testFailures = function() {
    methods.forEach(function(method, index) {
      [false, true].forEach(function(keep) {
        var si = { closed: 0 }, so = { closed: 0, flushed: 0 };
        var broken = new JavaAdapter(java.io.InputStream, {
          read: function() { throw new java.io.IOException("read failure"); },
          close: function() { si.closed++; }
        });
        var e = caught(function() { method.run(broken, output(so), keep); });
        ow.test.assert(String(e).indexOf("read failure") >= 0, true, method.name + " read failure propagated");
        ow.test.assert(si.closed, keep ? 0 : 1, method.name + " failed input ownership");
        ow.test.assert(so.closed, keep ? 0 : 1, method.name + " failed output ownership");

        si = { closed: 0 }; so = { closed: 0 };
        var sink = new JavaAdapter(java.io.OutputStream, {
          write: function() { throw new java.io.IOException("write failure"); },
          close: function() { so.closed++; }
        });
        e = caught(function() { method.run(input(payload(index, bytes(10)), si), sink, keep); });
        ow.test.assert(String(e).indexOf("write failure") >= 0, true, method.name + " write failure propagated");
        ow.test.assert(si.closed, keep ? 0 : 1, method.name + " write failed input ownership");
        ow.test.assert(so.closed, keep ? 0 : 1, method.name + " write failed output ownership");
      });
      [null, undefined, "bad", 123].forEach(function(invalid) {
        var si = { closed: 0 }, so = { closed: 0, flushed: 0 };
        var source = input(bytes(1), si);
        var e = caught(function() { method.run(source, invalid); });
        ow.test.assert(String(e).indexOf("OutputStream") >= 0, true, "Invalid output");
        ow.test.assert(si.closed, 0, "Invalid output must not close input");
        ow.test.assert(source.available(), 1, "Invalid output must not consume input");
        e = caught(function() { method.run(invalid, output(so)); });
        ow.test.assert(String(e).indexOf("InputStream") >= 0, true, "Invalid input");
        ow.test.assert(so.closed, 0, "Invalid input must not close output");
      });
    });
    var gzip = io.gzip(bytes(100));
    [bytes(3), java.util.Arrays.copyOf(gzip, gzip.length - 1)].forEach(function(data) {
      var si = { closed: 0 }, so = { closed: 0, flushed: 0 };
      caught(function() { io.gunzipStream(input(data, si), output(so)); });
      ow.test.assert(si.closed, 1, "Corrupt GZIP input closed");
      ow.test.assert(so.closed, 1, "Corrupt GZIP output closed");
    });
  };

  exports.testFinalizationFailures = function() {
    // One byte remains buffered until the encoder is closed.
    var so = { closed: 0 }, si = { closed: 0 };
    var sink = new JavaAdapter(java.io.OutputStream, {
      write: function() { throw new java.io.IOException("padding failure"); },
      close: function() { so.closed++; }
    });
    var e = caught(function() { af.toBase64Stream(input(bytes(1), si), sink); });
    ow.test.assert(String(e).indexOf("padding failure") >= 0, true, "Finalization failure propagated");
    ow.test.assert(si.closed, 1, "Finalization input cleanup");
    ow.test.assert(so.closed, 1, "Finalization output cleanup");

    methods.forEach(function(method, index) {
      var state = { closed: 0 };
      var flushFailure = new JavaAdapter(java.io.OutputStream, {
        write: function() {},
        flush: function() { throw new java.io.IOException("flush failure"); },
        close: function() { state.closed++; }
      });
      e = caught(function() { method.run(af.fromBytes2InputStream(payload(index, bytes(10))), flushFailure); });
      ow.test.assert(String(e).indexOf("flush failure") >= 0, true, method.name + " flush failure propagated");
      ow.test.assert(state.closed, 1, method.name + " flush failure cleanup");
    });

    var readFailure = new java.io.IOException("original read failure");
    var source = new JavaAdapter(java.io.InputStream, {
      read: function() { throw readFailure; },
      close: function() { throw new java.io.IOException("input close failure"); }
    });
    var target = new JavaAdapter(java.io.OutputStream, {
      write: function() {},
      close: function() { throw new java.io.IOException("output close failure"); }
    });
    // Capture on the Java side: a JS catch unwraps JavaScriptException and hides its suppressed errors.
    var task = new java.util.concurrent.FutureTask(new JavaAdapter(java.util.concurrent.Callable, {
      call: function() { af.toBase64Stream(source, target); return null; }
    }));
    task.run();
    e = caught(function() { task.get(); });
    var error = e.javaException.getCause();
    ow.test.assert(String(error).indexOf("original read failure") >= 0, true, "Original error preserved");
    ow.test.assert(error.getSuppressed().length, 2, "Both cleanup failures suppressed");
  };
})();
