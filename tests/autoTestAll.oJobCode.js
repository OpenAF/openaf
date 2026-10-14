// Embedded source regression tests; also runnable without oJob-common.
(function() {
  function runEmbedded(body, extraJob) {
    var definition = io.createTempFile("ojob-code-", ".yaml");
    var script = io.createTempFile("ojob-code-", ".js");
    var key = "embedded-" + genUUID() + ".js";
    var code = {};
    code[key] = body;
    var job = merge({name: "Test", execFile: key}, extraJob || {});
    if (job.execRequire == "MODULE") { delete job.execFile; job.execRequire = key; }
    io.writeFileYAML(definition, {ojob: {includeOJob: false, logToConsole: false}, jobs: [job], todo: ["Test"], code: code});
    var source = getEnv("OJOB_CODE_SOURCE");
    io.writeFileString(script, "ow.loadOJob();" + (source ? "load(" + stringify(source) + "); Object.keys(OpenWrap.oJob.prototype).forEach(function(k) { ow.oJob[k] = OpenWrap.oJob.prototype[k]; });" : "") + "oJobRunFile(" + stringify(definition) + ");");
    try { return $openaf(script); }
    finally { io.rm(definition); io.rm(script); }
  }
  exports.testEmbeddedBodyWithFunctionCall = function() {
    var result = runEmbedded("__pm.value = String(42);");
    ow.test.assert(result.value, "42", "Function calls must not hide embedded execFile bodies in require.cache");
  };
  exports.testEmbeddedBodyWithoutFunctionCall = function() {
    var result = runEmbedded("__pm.value = 42;");
    ow.test.assert(result.value, 42, "Embedded assignment body must still execute");
  };
  exports.testEmbeddedModuleStillRequires = function() {
    var result = runEmbedded("(function() { exports.Test = function(args) { __pm.value = args.input + 1; }; })();", {execFile: __, execRequire: "MODULE", args: {input: 41}});
    ow.test.assert(result.value, 42, "Embedded module exports must still execute");
  };
})();
