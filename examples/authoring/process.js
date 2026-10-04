// command is a JSON file containing an argv array, not a shell expression.
try {
  var file = _$(processExpr().command, "command").isString().$_();
  var command = _$(io.readFileJSON(file), "argv").isArray().$_();
  if (command.length === 0) throw "argv must not be empty";
  command.forEach(function(arg) { _$(arg, "argv element").isString().$_(); });
  var result = $sh(command).get(0);
  if (Number(result.exitcode) !== 0) throw "Child exited with " + result.exitcode;
  print(stringify({ stdout: result.stdout, stderr: result.stderr, exitcode: Number(result.exitcode) }, __, ""));
} catch (error) {
  printErr("process: " + error);
  exit(1);
}
