// --py consumes the script and all following arguments, including OpenAF-looking flags.
var __pyArgs = Array.prototype.map.call(__args, String);
var __pyIndex = __pyArgs.indexOf("--py");
__pyArgs = __pyArgs.slice(__pyIndex + 1);
var __pyLegacy = __pyArgs[0] == "-e";
if (__pyLegacy) __pyArgs.shift();
var __pyFile = __pyArgs.shift();
if (!__pyFile || !io.fileExists(__pyFile)) throw "No Python file provided or found.";
ow.loadPython();
ow.python.reset(false, isUnDef(getEnv("OAF_PYTHON")) || getEnv("OAF_PYTHON") == "null");
var __pyResult;
try {
  __pyResult = ow.python.execStandalone(__pyFile, __, false,
    __pyLegacy && __pyArgs.length == 0 ? __ : __pyArgs);
} finally { ow.python.stopServer(__, true); }
exit(__pyResult.exitcode);
