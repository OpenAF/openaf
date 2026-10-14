// All bridge resources belong to these tests, never the global oJob bridge.
function bridge() {
  ow.loadPython();
  var py = new OpenWrap.python();
  py.reset(false, true);
  return py;
}
function eq(actual, expected, message) { ow.test.assert(actual, expected, message); }
function fails(fn, match) {
  var error;
  try { fn(); } catch(e) { error = String(e); }
  eq(isString(error) && error.indexOf(match) >= 0, true, "Expected error: " + match + "; got " + error);
}
exports.testRoundTrips = function() {
  var py = bridge(), data = { s: "quote'\" slash\\ literal\\n line\n tab\t 雪 😀", a: [true, false, null, 42], nested: { x: "\r\n" } };
  try {
    [false, true].forEach(server => {
      if (server) py.startServer();
      eq(py.exec("result = value", { value: data }, ["result"], true).result, data, "Exact JSON round trip");
      eq(py.execPM("__pm['count'] = 2", merge(data, { count: 1 }), true), merge(data, { count: 2 }), "PM map");
      eq(py.exec("import sys\nsys.stdout.write('no newline')\nx = 7", {}, ["x"], true).x, 7, "Unterminated output");
      eq(py.exec("result = value", { value: 42, eval: 1, compile: 2, dict: 3 }, ["result"], true).result, 42, "Builtin names are valid input variables");
      eq(py.exec("dict = 4\nresult = dict", {}, ["result"], true).result, 4, "User code can shadow result construction builtins");
    });
    var large = "雪".repeat(700000);
    eq(py.exec("size = len(value)", { value: large }, ["size"], true, true).size, large.length, "Fork payload exceeds argv limits");
    eq(py.exec("import sys\nresult = [sys.argv[0], sys.path[0], '__file__' in globals()]", {}, ["result"], true, true).result, ["-c", "", false], "Fork retains inline execution semantics");
    fails(() => py.exec("pass", { "x;bad": 1 }, [], true), "Invalid Python variable");
  } finally { py.stopServer(__, true); }
};
exports.testSessionAndLifecycle = function() {
  var py = bridge(), other = bridge();
  try {
    var token = py.startServer();
    eq(py.startServer(), token, "Nested start");
    eq(py.cServer.get(), 2, "Reference count");
    eq(py.stopServer(), false, "First release retains server");
    py.exec("import math\nx = 12\ndef twice(v):\n    return v * 2", {}, [], true);
    eq(py.exec("y = twice(x) + int(math.sqrt(9))", {}, ["y"], true).y, 27, "Persistent functions and imports");
    fails(() => py.startServer(__, __, __, true), "mode");
    other.startServer();
    eq(other.exec("isolated = 'x' not in globals()", {}, ["isolated"], true).isolated, true, "Independent namespace");
    var releasedPort = py.port;
    eq(py.stopServer(), true, "Final release");
    var rebound = new java.net.ServerSocket(releasedPort); rebound.close();
    eq(py.stopServer(), false, "Idempotent stop");
    eq(other.exec("x = 9", {}, ["x"], true).x, 9, "Independent process ownership");
    py.startServer();
    eq(py.exec("fresh = 'x' not in globals()", {}, ["fresh"], true).fresh, true, "Restart clears state");
    py.__process.destroyForcibly(); py.__process.waitFor();
    fails(() => py.startServer(), "exited");
    eq(py.running, false, "Dead child releases resources");
    py.startServer();
  } finally { py.stopServer(__, true); other.stopServer(__, true); }
};
exports.testErrorsAndConcurrency = function() {
  var py = bridge();
  try {
    py.startServer();
    fails(() => py.exec("print('before failure')\nraise ValueError('expected failure')", {}, [], true), "expected failure");
    eq(py.exec("raise ValueError('default error')"), __, "Default error policy");
    fails(() => py.exec("import sys\nsys.stderr.write('warning')", {}, [], true), "warning");
    eq(py.exec("x = 8", {}, ["x"], true).x, 8, "Streams restored after failure");
    py.exec("globals = 'valid input name'", {}, [], true);
    eq(py.exec("y = globals", {}, ["y"], true).y, "valid input name", "User names do not shadow bridge namespace lookup");
    fails(() => py.exec("import sys\nsys.exit(7)", {}, [], true, true), "exitcode 7");
    var replies = pForEach([1, 2, 3, 4], n => py.__request({ t: py.token, e: "import time\nprint('start" + n + "')\ntime.sleep(0.03)\nprint('end" + n + "')" }));
    replies.forEach((r, i) => eq(r.stdout, "start" + (i + 1) + "\nend" + (i + 1) + "\n", "Serialized output"));
    var request = py.__request;
    py.__request = () => null;
    fails(() => py.execPM("pass", {}, true), "Malformed Python bridge response");
    py.__request = () => ({ stdout: "", stderr: "" });
    fails(() => py.exec("pass", {}, [], true), "Missing Python result");
    py.__request = request;
    py.__process.destroyForcibly(); py.__process.waitFor();
    eq(py.exec("pass"), __, "Transport errors obey default exception policy");
    fails(() => py.exec("pass", {}, [], true), "python:");
  } finally { py.stopServer(__, true); }
};
exports.testInterpreterAndStartup = function() {
  var py = bridge(), interpreter = py.python;
  py.python = "/nonexistent/openaf-python";
  py.reset(false, true);
  eq(py.python, "python3", "Fallback candidate retained");
  py.python = "/nonexistent/openaf-python";
  fails(() => py.startServer(), "Exception");
  eq(py.running, false, "Failed startup clears running");
  eq(isUnDef(py.token) && isUnDef(py.server) && isUnDef(py.__process), true, "Startup rollback");
  py.setPython(interpreter);
  var serverCode = py.__serverCode;
  py.__serverCode = () => "raise RuntimeError('startup child failure')";
  fails(() => py.startServer(), "startup child failure");
  eq(isUnDef(py.token) && isUnDef(py.__process), true, "Exited startup child rollback");
  py.__serverCode = serverCode;
  try { py.startServer(); eq(py.exec("x = 1", {}, ["x"], true).x, 1, "Recovery"); }
  finally { py.stopServer(__, true); }
};
exports.testCallbacksAndFrames = function() {
  var py = bridge(), key = "python-'\\雪";
  try {
    py.startServer();
    var value = "line\nslash\\雪😀";
    eq(py.exec("_s(key, value)\nresult = _g(key)", { key: key, value: value }, ["result"], true).result, value, "Quoted callback keys");
    fails(() => py.exec("_(\"throw 'callback failure'\")", {}, [], true), "__OAF__Exception");
    var probe = `import socket, json
s = socket.create_connection(('127.0.0.1', port))
raw = json.dumps({'t': token, 'e': "print('雪😀')"}, ensure_ascii=False).encode('utf-8') + b'\\n'
for n in range(len(raw)):
    s.sendall(raw[n:n+1])
s.shutdown(socket.SHUT_WR)
chunks = []
while True:
    data = s.recv(4096)
    if not data: break
    chunks.append(data)
s.close()
result = json.loads(b''.join(chunks).decode('utf-8'))
`;
    eq(py.exec(probe, { port: py.sport, token: py.token }, ["result"], true, true).result.stdout, "雪😀\n", "Fragmented UTF-8");
    var socket = new java.net.Socket("127.0.0.1", py.sport);
    socket.setSoTimeout(2000);
    try {
      ioStreamWrite(socket.getOutputStream(), '{"t":'); socket.shutdownOutput();
      eq(jsonParse(String(af.fromInputStream2String(socket.getInputStream()))).exitcode, 1, "EOF rejects truncated request");
    } finally { socket.close(); }
    eq(py.__request({ t: "bad", e: "pass" }).exitcode, 1, "Unauthorized request rejected");
  } finally { py.stopServer(__, true); $unset(key); }
};
exports.testStandalone = function() {
  var py = bridge(), dir = io.createTempFile("python space ", "");
  io.rm(dir); io.mkdir(dir);
  var script = dir + "/test script.py";
  try {
    io.writeFileString(dir + "/sibling.py", "value = 23\n");
    io.writeFileString(script, "from __future__ import print_function\nimport sibling, sys\n_s('python-standalone', {'file': __file__, 'name': __name__, 'argv': sys.argv, 'value': sibling.value})\nsys.exit(7)\n");
    var res = py.execStandalone(script, __, false, ["space arg", "", "--help", "雪"]);
    eq(res.exitcode, 7, "Standalone exitcode");
    eq($get("python-standalone"), { file: script, name: "__main__", argv: [script, "space arg", "", "--help", "雪"], value: 23 }, "Standalone file semantics");
    eq(py.cServer.get(), 1, "Implicit standalone starts once");
    eq(py.execStandalone("pass", __, false, []).exitcode, 0, "Inline standalone");
    eq(py.cServer.get(), 1, "Repeated standalone retains reference");
    eq(py.execStandalone("json = 42\nsocket = 43\n_s('python-standalone', {'value': _g('python-standalone')['value'] + 1})", __, true, []).exitcode, 0, "Callback modules cannot be shadowed by user globals");
    eq($get("python-standalone").value, 24, "Callbacks still exchange values after module shadowing");
    fails(() => py.execStandalone("import sys\nsys.stderr.write('warning')", __, true, []), "standalone execution failed");
  } finally { py.stopServer(__, true); io.rm(dir); $unset("python-standalone"); }
};
exports.testSubprocess = function() {
  var py = bridge();
  if (py.version != 3) { print("SKIP Python subprocess driver requires Python 3"); return; }
  var script = io.fileExists("python-subprocess.py") ? "python-subprocess.py" : "tests/python-subprocess.py";
  var result = $sh([py.python, script, getOpenAFJar()]).timeout(180000).get(0);
  eq(result.exitcode, 0, "Packaged subprocess regressions: " + result.stdout + result.stderr);
};
