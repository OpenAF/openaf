exports.testFramework = function() {
  ow.loadOJob();
  var root=String(new java.io.File('..').getCanonicalPath());
  var r=ow.oJob.runLanguageProcess([String(java.lang.System.getProperty('java.home'))+'/bin/java','-Dopenaf.test.worker=true','-jar',getOpenAFJar(),'-c',"try { loadLib('tests/runTestFramework.js'); exit(2); } catch(e) { printErr(e); exit(1); }"],{pwd:root,timeout:120000,maxOutputBytes:1048576});
  ow.test.assert(r.exitcode,0,'Framework regressions: '+r.stdout+' '+r.stderr);
  ow.test.assert(r.timedOut,false,'Framework regression timeout');
};

exports.testYAMLAdapter = function(c) {
  var observed = ow.test.ojob("fixtures/ow-test/yaml-adapter.yaml", {
    trusted: true,
    cwd: String(new java.io.File(".").getCanonicalPath()),
    timeout: 30000,
    expect: { status: "SUCCESS", errors: 0 }
  })
  var result = observed.output.result
  c.assertDeepEqual(result.records.map(function(r) { return [r.name, r.status] }), [
    ["Adapter::Async resources", "PASS"],
    ["Adapter::Cleanup", "PASS"],
    ["Adapter::Missing export", "ERROR"],
    ["Adapter::Child", "FAIL"],
    ["Adapter::Nested failure", "ERROR"],
    ["Adapter::Skip", "SKIP"],
    ["Adapter::Timeout", "TIMEOUT"],
    ["Adapter::Cleanup failure", "ERROR"]
  ])
  c.assertEqual(result.records[0].returnValue, 42, "Returned async task must be awaited")
  c.assertEqual(result.records[0].assertions, 1, "Owned async assertions must be counted")
  c.assertMatch(result.records[2].exception, /Missing test function/)
  c.assertEqual(result.records[3].parentId, result.records[4].id)
  c.assertEqual(result.records[7].errors[0].phase, "cleanup")
  c.assertDeepEqual([result.pass, result.fail, result.skip, result.count, result.asserts, result.exitCode], [2, 5, 1, 8, 3, 1])
  c.assertEqual(result.complete, true)
  c.assertSchema(result, io.readFileJSON("../docs/schemas/ow-test-results.schema.json"))

  var summarize = require("autoTestAll.reporting.js").summarize
  var snapshot = { records: [], infrastructureErrors: [], complete: true }
  c.assertEqual(summarize(snapshot, "empty").exitCode, 2, "Empty runs must fail")
  snapshot.records.push({ status: "PASS", assertions: 1 })
  c.assertEqual(summarize(snapshot, "pass").exitCode, 0)
  c.assertEqual(summarize(snapshot, "scheduler", [{ message: "Job failed" }]).exitCode, 2)
  c.assertEqual(snapshot.infrastructureErrors.length, 0, "Reporting must not mutate the snapshot")
  snapshot.complete = false
  c.assertEqual(summarize(snapshot, "incomplete").exitCode, 2)
}

exports.testYAMLReports = function(c) {
  var dir = c.tmpDir()
  var main = io.readFileYAML("autoTestAll.yaml")
  delete main.ojob.channels
  io.writeFileString(dir + "/autoTestAll.yaml", af.toYAML(main))
  ;["autoTestAll.common.yaml", "autoTestAll.reporting.js"].forEach(function(file) {
    io.writeFileString(dir + "/" + file, io.readFileString(file))
  })
  var command = [String(java.lang.System.getProperty("java.home")) + "/bin/java",
    "-Dopenaf.test.worker=true", "-jar", getOpenAFJar(), "--ojob", "-e", "autoTestAll.yaml"]
  ;[
    { name: "pass", body: "c.assertEqual(1, 1)", exitCode: 0, fail: 0 },
    { name: "failure", body: "c.assertEqual(1, 2)", exitCode: 1, fail: 1 },
    { name: "scheduler", body: "c.assertEqual(1, 1)", schedulerError: true, exitCode: 2, fail: 0 }
  ].forEach(function(scenario) {
    var workflow = {
      include: ["autoTestAll.common.yaml"],
      jobs: [{ name: "Fixture::Test", to: "OpenAF Test", exec: "args.func = function(c) { " + scenario.body + " }" }],
      todo: ["Fixture::Test"]
    }
    if (scenario.schedulerError) {
      workflow.jobs.push({ name: "Fixture::Broken setup", exec: "throw new Error('setup failed')" })
      workflow.todo.push("Fixture::Broken setup")
    }
    io.writeFileString(dir + "/autoTestAll.allJobs.yaml", af.toYAML(workflow))
    var process = ow.oJob.runLanguageProcess(command, { pwd: dir, timeout: 30000, maxOutputBytes: 1048576 })
    c.assertEqual(process.timedOut, false, scenario.name + " must finish")
    c.assertEqual(process.exitcode, scenario.exitCode, process.stdout + " " + process.stderr)
    var result = io.readFileJSON(dir + "/autoTestAll.results.json")
    c.assertEqual(result.complete, true)
    c.assertEqual(result.exitCode, scenario.exitCode)
    c.assertEqual(result.fail, scenario.fail)
    c.assertEqual(result.count, 1)
    c.assertEqual(result.infrastructureErrors.length, scenario.schedulerError ? 1 : 0)
    c.assertEqual(io.readFileString(dir + "/autoTestAll.md"), ow.test.report.markdown(result))
    c.assertEqual(io.readFileString(dir + "/autoTestAllResults.xml"),
      ow.test.report.junit(result, af.getVersion(), "Automatic OpenAF build test"))
  })
}
