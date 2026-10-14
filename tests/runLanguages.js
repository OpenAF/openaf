// Standalone CI entrypoint: run against the built artifact without oJob-common installation.
ow.loadOJob();
ow.loadTest();
var tests = require(getEnv("OJOB_LANGUAGE_TEST_SOURCE") || "./tests/autoTestAll.Languages.js");
var report = { pass: 0, fail: 0, tests: [], runtimes: ow.oJob.getLanguages(true) };
Object.keys(tests).forEach(name => {
  try { tests[name](); report.pass++; report.tests.push({name:name, status:"pass"}); }
  catch (e) { report.fail++; report.tests.push({name:name, status:"fail", error:String(e)}); printErr(name + ": " + e); }
});
io.writeFileJSON("tests/languages-results.json", report);
print("Language tests: " + report.pass + " passed, " + report.fail + " failed");
exit(report.fail ? 1 : 0);
