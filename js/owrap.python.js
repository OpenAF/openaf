// OpenWrap v2 - Python bridge
// Copyright 2026 Nuno Aguiar

OpenWrap.python = function() {
  var interpreter = getEnv("OAF_PYTHON"), version = getEnv("OAF_PYTHON_VER");
  this.python = isDef(interpreter) && interpreter != "null" ? interpreter : "python";
  this.version = isDef(version) && version != "null" ? Number(version) : 3;
  this.cServer = $atomic();
  this.running = false;
  this.mode = "embedded";
  this.__lock = new java.util.concurrent.locks.ReentrantLock();
  this.__clients = new java.util.concurrent.ConcurrentHashMap();
  this.__standalone = new java.util.concurrent.ConcurrentHashMap();
};

// ASCII source literals containing UTF-8 JSON avoid a second layer of Python escapes.
OpenWrap.python.prototype.__encode = function(value) {
  return String(java.util.Base64.getEncoder().encodeToString(af.fromString2Bytes(stringify(value, __, ""), "UTF-8")));
};

OpenWrap.python.prototype.initCode = function(includeCoding) {
  var code = includeCoding ? "# -*- coding: utf-8 -*-\n" : "";
  code += `import json
import socket
import base64
__oaf_namespace = globals()

def _d(obj):
    return json.dumps(obj)

def __oaf_run(encoded, namespace):
    import base64, json, sys
    payload = json.loads(base64.b64decode(encoded).decode('utf-8'))
    namespace.update(payload['input'])
    eval(compile(payload['code'], '<openaf>', 'exec'), namespace, namespace)
    result = namespace['__pm'] if payload['pm'] else dict((k, namespace[k]) for k in payload['output'])
    sys.stdout.write(payload['marker'] + json.dumps(result) + '\\n')

`;
  if (isDef(this.token)) code += `def _(expression):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.connect(('127.0.0.1', ${this.port}))
        s.sendall(json.dumps({'e': expression, 't': '${this.token}'}).encode('utf-8') + b'\\n')
        chunks = []
        while True:
            chunk = s.recv(4096)
            if not chunk:
                break
            chunks.append(chunk)
        result = b''.join(chunks).decode('utf-8')
    finally:
        s.close()
    if result.startswith('__OAF__Exception'):
        raise Exception(result)
    return json.loads(result)

def _oaf(expression):
    return _(expression)

def _g(key):
    return _('$get(' + json.dumps(key) + ')')

def _s(key, value):
    return _('$set(' + json.dumps(key) + ', ' + _d(value) + ')')

`;
  return code;
};

// One UTF-8 request line; the response is delimited by EOF.
OpenWrap.python.prototype.__request = function(request, timeout) {
  var socket = new java.net.Socket();
  try {
    socket.connect(new java.net.InetSocketAddress("127.0.0.1", this.sport), 1000);
    socket.setSoTimeout(isDef(timeout) ? timeout : 1500000);
    ioStreamWrite(socket.getOutputStream(), stringify(request, __, "") + "\n");
    socket.getOutputStream().flush();
    return jsonParse(String(af.fromInputStream2String(socket.getInputStream())));
  } finally { socket.close(); }
};

OpenWrap.python.prototype.__serverCode = function() {
  return this.initCode(true) + `import sys, os, threading, traceback
if sys.version_info[0] == 2:
    from StringIO import StringIO
    import SocketServer as socketserver
else:
    from io import StringIO
    import socketserver

namespace = dict(globals())
namespace['__name__'] = '__main__'
namespace['__oaf_namespace'] = namespace
execution_lock = threading.RLock()
class Handler(socketserver.BaseRequestHandler):
    def handle(self):
        self.request.settimeout(1500)
        response = {'stdout': '', 'stderr': '', 'exitcode': 0}
        try:
            chunks = []
            while True:
                chunk = self.request.recv(4096)
                if not chunk:
                    raise ValueError('Truncated request')
                chunks.append(chunk)
                if b'\\n' in chunk:
                    break
            raw = b''.join(chunks)
            frame, extra = raw.split(b'\\n', 1)
            if extra.strip():
                raise ValueError('Multiple request frames')
            request = json.loads(frame.decode('utf-8'))
            if not isinstance(request, dict) or request.get('t') != '${this.token}':
                raise ValueError('Unauthorized request')
            if request.get('exit'):
                os._exit(0)
            if request.get('ping'):
                response['ready'] = True
            elif 'e' in request:
                with execution_lock:
                    out, err = StringIO(), StringIO()
                    oldout, olderr = sys.stdout, sys.stderr
                    try:
                        sys.stdout, sys.stderr = out, err
                        eval(compile(request['e'], '<openaf-request>', 'exec'), namespace, namespace)
                    except BaseException:
                        response['exitcode'] = 1
                        traceback.print_exc(file=err)
                    finally:
                        sys.stdout, sys.stderr = oldout, olderr
                        response['stdout'], response['stderr'] = out.getvalue(), err.getvalue()
            else:
                raise ValueError('Missing expression')
        except BaseException:
            response['exitcode'] = 1
            response['stderr'] = traceback.format_exc()
        try:
            self.request.sendall(json.dumps(response).encode('utf-8'))
        finally:
            self.request.close()

class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True
server = Server(('127.0.0.1', ${this.sport}), Handler)
server.serve_forever()
`;
};

/**
 * <odoc>
 * <key>ow.python.startServer(aPort, aSendPort, aFn, isAlone) : String</key>
 * Acquires a bridge reference, returning its token. Embedded mode owns a persistent, serialized Python
 * namespace. isAlone=true starts only the callback listener for standalone scripts. Modes cannot be mixed
 * until stopped. aFn receives connect, exec and error events. Startup has a bounded readiness check.
 * </odoc>
 */
OpenWrap.python.prototype.startServer = function(aPort, aSendPort, aFn, isAlone) {
  isAlone = _$(isAlone, "isAlone").isBoolean().default(false);
  this.__lock.lock();
  try {
    var mode = isAlone ? "standalone" : "embedded";
    if (this.running) {
      if (this.mode != mode) throw "Python bridge already running in " + this.mode + " mode.";
      if (isDef(this.__process) && !this.__process.isAlive()) {
        this.stopServer(__, true);
        throw "Python bridge process exited; start the bridge again.";
      }
      this.cServer.inc();
      return this.token;
    }
    if (this.version != 2 && this.version != 3) throw "Can't start python 2 or 3.";
    this.mode = mode;
    this.token = String(java.util.UUID.randomUUID());
    aFn = _$(aFn).isFunction().default((t, e) => { if (t == "error") printErr(e); });
    ow.loadServer();
    ow.loadObj();
    this.port = isDef(aPort) ? aPort : findRandomOpenPort();
    try {
      ow.server.socket.start(this.port, (clt) => {
        this.__clients.put(clt, true);
        try {
          clt.setSoTimeout(15000);
          aFn("connect", clt.getInetAddress().getHostAddress());
          var bytes = new java.io.ByteArrayOutputStream(), stream = clt.getInputStream(), b;
          while ((b = stream.read()) != -1 && b != 10) bytes.write(b);
          var line = b == 10 ? String(bytes.toString("UTF-8")) : null, result;
          try {
            if (line === null) throw "Truncated request";
            var request = jsonParse(String(line));
            if (!isMap(request) || request.t != this.token || !isString(request.e)) throw "Invalid or unauthorized request";
            aFn("exec", request);
            result = stringify(af.eval(request.e), __, "");
            if (isUnDef(result)) result = "null";
          } catch(e) {
            result = "__OAF__Exception: " + String(e);
          }
          ioStreamWrite(clt.getOutputStream(), result);
          clt.getOutputStream().flush();
        } catch(e) { aFn("error", e); }
        finally { this.__clients.remove(clt); clt.close(); }
      }, __, "127.0.0.1");
      this.server = true;
      if (!isAlone) {
        this.sport = isDef(aSendPort) ? aSendPort : findRandomOpenPort();
        this.__log = io.createTempFile("openaf-python-", ".log");
        var command = new java.util.ArrayList();
        [this.python, "-u", "-c", this.__serverCode()].forEach(v => command.add(String(v)));
        this.__process = new java.lang.ProcessBuilder(command).redirectErrorStream(true)
          .redirectOutput(new java.io.File(this.__log)).start();
        var deadline = now() + 10000, ready = false;
        while (now() < deadline) {
          if (!this.__process.isAlive()) throw "Python startup failed: " + io.readFileString(this.__log);
          try {
            var reply = this.__request({ ping: true, t: this.token }, 300);
            if (reply.ready === true) { ready = true; break; }
          } catch(e) {}
          sleep(50, true);
        }
        if (!ready) throw "Python startup timed out: " + io.readFileString(this.__log);
      }
      this.running = true;
      this.cServer.set(1);
      if (!this.__shutdownRegistered) {
        addOnOpenAFShutdown(() => { this.stopServer(__, true); });
        this.__shutdownRegistered = true;
      }
      return this.token;
    } finally {
      if (!this.running) this.stopServer(__, true);
    }
  } finally { this.__lock.unlock(); }
};

// Implicit use acquires only the initial reference, including concurrent callers.
OpenWrap.python.prototype.__ensureServer = function(standalone) {
  this.__lock.lock();
  try {
    if (!this.running) this.startServer(__, __, __, standalone);
    else if (this.mode != (standalone ? "standalone" : "embedded"))
      throw "Python bridge already running in " + this.mode + " mode.";
  } finally { this.__lock.unlock(); }
};

/**
 * <odoc>
 * <key>ow.python.stopServer(aPort, force) : Boolean</key>
 * Releases one explicit start reference. Stops owned resources at zero, or immediately with force=true.
 * Returns true only when resources were stopped; repeated stops return false. aPort is retained for compatibility.
 * </odoc>
 */
OpenWrap.python.prototype.stopServer = function(aPort, force) {
  this.__lock.lock();
  try {
    if (!this.running && isUnDef(this.token)) return false;
    if (!force && this.cServer.get() > 1) { this.cServer.dec(); return false; }
    try {
      var children = this.__standalone.keySet().iterator();
      while (children.hasNext()) {
        var child = children.next();
        child.destroyForcibly();
        child.waitFor();
      }
      this.__standalone.clear();
      if (isDef(this.__process)) {
        this.__process.destroy();
        if (!this.__process.waitFor(2, java.util.concurrent.TimeUnit.SECONDS)) {
          this.__process.destroyForcibly();
          this.__process.waitFor();
        }
      }
    } finally {
      try {
        var clients = this.__clients.keySet().iterator();
        while (clients.hasNext()) { try { clients.next().close(); } catch(e) {} }
        this.__clients.clear();
        if (isDef(this.server)) ow.server.socket.stop(this.port);
      }
      finally {
        if (isDef(this.__log)) io.rm(this.__log);
        ["__process", "__log", "sport", "server", "port", "token"].forEach(k => { delete this[k]; });
        this.running = false;
        this.cServer.set(0);
        this.mode = "embedded";
      }
    }
    return true;
  } finally { this.__lock.unlock(); }
};

/**
 * <odoc>
 * <key>ow.python.reset(noException, tryOthers)</key>
 * Detects the configured interpreter using --version. tryOthers enables python3 fallback. noException
 * records failure as version=-1. The successful interpreter is retained. Stop the bridge before resetting.
 * </odoc>
 */
OpenWrap.python.prototype.reset = function(noException, tryOthers) {
  if (this.running) throw "Stop the Python bridge before resetting the interpreter.";
  var candidates = tryOthers ? [this.python, "python3"] : [this.python], error;
  for (var i = 0; i < candidates.length; i++) {
    try {
      var result = $sh([candidates[i], "--version"]).get(0);
      var match = (String(result.stdout) + "\n" + String(result.stderr)).match(/Python\s+([23])\./);
      if (result.exitcode != 0 || !match) throw "Unrecognized Python version";
      this.python = candidates[i];
      this.version = Number(match[1]);
      return;
    } catch(e) { error = e; }
  }
  this.version = -1;
  if (!noException) throw "Can't find or determine python version (" + error + ")";
};

/**
 * <odoc>
 * <key>ow.python.setPython(aPythonPath)</key>
 * Selects and detects the interpreter executable. Stop the bridge first. Paths may contain spaces.
 * </odoc>
 */
OpenWrap.python.prototype.setPython = function(aPython) {
  if (this.running) throw "Stop the Python bridge before changing the interpreter.";
  this.python = _$(aPython, "aPython").isString().$_();
  this.reset();
};

/**
 * <odoc>
 * <key>ow.python.getVersion() : Number</key>
 * Returns the Python major version (2 or 3), or -1 after failed detection.
 * </odoc>
 */
OpenWrap.python.prototype.getVersion = function() { return this.version; };

OpenWrap.python.prototype.__exec = function(code, input, output, pm, throwExceptions, shouldFork) {
  _$(code, "python code").isString().$_();
  input = _$(input, "input").isMap().default({});
  output = _$(output, "output").isArray().default([]);
  throwExceptions = _$(throwExceptions, "throwExceptions").isBoolean().default(false);
  if (this.version < 0) throw "Appropriate Python version not found. Please setPython first.";
  var keywords = "False None True and as assert async await break class continue def del elif else except exec finally for from global if import in is lambda nonlocal not or pass print raise return try while with yield".split(" ");
  if (!pm) Object.keys(input).concat(output).forEach(k => {
    if (!isString(k) || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(k) || keywords.indexOf(k) >= 0 || k.indexOf("__oaf_") == 0)
      throw "Invalid Python variable name: " + k;
  });
  var marker = "__OAF_RESULT_" + String(java.util.UUID.randomUUID()) + "__";
  var payload = this.__encode({ code: code, input: pm ? { __pm: input } : input, output: output, pm: pm, marker: marker });
  var source = "__oaf_run('" + payload + "', __oaf_namespace)\n", result, error, value;
  try {
    if (shouldFork || isUnDef(this.sport)) {
      result = $sh([this.python, "-c", this.initCode(true) + source]).get(0);
    } else {
      ow.loadObj();
      result = this.__request({ e: source, t: this.token });
    }
    if (!isMap(result) || !isString(result.stdout) || !isString(result.stderr)) throw "Malformed Python bridge response";
    var index = result.stdout.lastIndexOf(marker);
    if (index >= 0) {
      if (index > 0) printnl(result.stdout.substring(0, index));
      value = jsonParse(result.stdout.substring(index + marker.length));
      if (!isMap(value)) throw "Malformed Python result";
    } else {
      if (result.stdout.length) printnl(result.stdout);
      error = "Missing Python result";
    }
    if (result.stderr.length) error = result.stderr;
    if (isDef(result.exitcode) && result.exitcode != 0) error = (error || "Python process failed") + " (exitcode " + result.exitcode + ")";
  } catch(e) { error = String(e); }
  if (isDef(error)) {
    printErr(error);
    if (throwExceptions) throw "python: " + error;
  }
  return value;
};

/**
 * <odoc>
 * <key>ow.python.execPM(aPythonCode, aInput, throwExceptions, shouldFork) : Map</key>
 * Exchanges a JSON map through __pm. Mutate __pm to return values. Uses the persistent server when started;
 * shouldFork=true runs an isolated process. Errors print by default; throwExceptions=true throws on stderr,
 * nonzero exits or bridge failures. Failed calls without a result return undefined.
 * </odoc>
 */
OpenWrap.python.prototype.execPM = function(code, input, throwExceptions, shouldFork) {
  return this.__exec(code, input, [], true, throwExceptions, shouldFork);
};

/**
 * <odoc>
 * <key>ow.python.exec(aPythonCode, aInput, aOutputArray, throwExceptions, shouldFork) : Map</key>
 * Exchanges JSON values via named Python variables. Names must be ASCII identifiers and not keywords.
 * A started embedded server preserves variables, imports and functions across serialized calls; otherwise
 * a fresh process is used. shouldFork=true isolates a call. Errors print by default; throwExceptions=true
 * throws on stderr, nonzero exits or bridge failures. Missing results return undefined.
 * </odoc>
 */
OpenWrap.python.prototype.exec = function(code, input, output, throwExceptions, shouldFork) {
  return this.__exec(code, input, output, false, throwExceptions, shouldFork);
};

/**
 * <odoc>
 * <key>ow.python.execStandalone(aPythonCodeOrFile, aInput, throwExceptions, aArgv) : Map</key>
 * Executes a .py file or inline code in standalone mode with callbacks. Returns a process result with
 * exitcode, inherits stdin and streams stdout/stderr (the returned output strings are empty). aInput is reserved. Explicit aArgv overrides OAF_PY_ARGC/OAF_PY_ARG_n.
 * File execution preserves __file__, __name__, sys.argv[0], script import directory and future imports.
 * throwExceptions defaults to false; true throws on stderr or a nonzero exit. Stop the bridge when done.
 * </odoc>
 */
OpenWrap.python.prototype.execStandalone = function(codeOrFile, aInput, throwExceptions, aArgv) {
  this.__ensureServer(true);
  _$(codeOrFile, "aPythonCodeOrFile").isString().$_();
  var argv = [];
  if (isDef(aArgv)) argv = _$(aArgv, "aArgv").isArray().$_();
  else {
    var count = parseInt(getEnv("OAF_PY_ARGC"), 10);
    for (var i = 0; i < count; i++) argv.push(getEnv("OAF_PY_ARG_" + i));
  }
  argv.forEach(v => { _$(v, "argv value").isString().$_(); });
  var file = codeOrFile.indexOf("\n") < 0 && /\.py$/.test(codeOrFile) && io.fileExists(codeOrFile);
  var payload = this.__encode({ file: file ? codeOrFile : null, code: file ? null : codeOrFile });
  var bootstrap = this.initCode(true) + `import os, sys
__oaf_payload = json.loads(base64.b64decode('${payload}').decode('utf-8'))
if __oaf_payload['file'] is not None:
    __file__ = __oaf_payload['file']
    sys.argv[0] = __file__
    sys.path[0] = os.path.dirname(os.path.abspath(__file__))
    with open(__file__, 'rb') as __oaf_source:
        __oaf_compiled = compile(__oaf_source.read(), __file__, 'exec')
else:
    sys.argv[0] = '-c'
    sys.path[0] = ''
    __oaf_compiled = compile(__oaf_payload['code'], '<string>', 'exec')
__name__ = '__main__'
eval(__oaf_compiled, globals(), globals())
`;
  var temporary = io.createTempFile("oafpy", ".py"), child;
  try {
    io.writeFileString(temporary, bootstrap);
    var stderr = false, command = new java.util.ArrayList();
    [this.python, temporary].concat(argv).forEach(v => command.add(String(v)));
    child = new java.lang.ProcessBuilder(command)
      .redirectInput(java.lang.ProcessBuilder.Redirect.INHERIT).start();
    this.__standalone.put(child, true);
    $doWait($doAll([
      $do(() => { child.getInputStream().transferTo(java.lang.System.out); java.lang.System.out.flush(); }),
      $do(() => { stderr = child.getErrorStream().transferTo(java.lang.System.err) > 0; java.lang.System.err.flush(); })
    ]));
    var result = { exitcode: Number(child.waitFor()), stdout: "", stderr: "" };
    if (throwExceptions && (stderr || result.exitcode != 0)) throw "python: standalone execution failed (exitcode " + result.exitcode + ")";
    return result;
  } finally {
    if (isDef(child)) {
      if (child.isAlive()) { child.destroyForcibly(); child.waitFor(); }
      this.__standalone.remove(child);
    }
    io.rm(temporary);
  }
};
