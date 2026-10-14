ow.loadPython();
ow.python.setPython("python3");
ow.python.startServer();
try {
  var input = { text: "quote' slash\\ line\n雪 😀" };
  var result = ow.python.exec(
    "_s('python-demo', value)\nresult = _g('python-demo')",
    { value: input }, ["result"], true
  );
  ow.loadTest();
  ow.test.assert(result.result, input, "Exact callback round trip");
  print(stringify(result.result));
} finally {
  $unset("python-demo");
  ow.python.stopServer();
}
