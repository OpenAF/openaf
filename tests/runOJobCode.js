ow.loadOJob();
ow.loadTest();
var tests = require("./tests/autoTestAll.oJobCode.js");
var failed = 0;
Object.keys(tests).forEach(function(name) {
  try { tests[name](); print(name + ": ok"); }
  catch(e) { failed++; printErr(name + ": " + e); }
});
exit(failed ? 1 : 0);
