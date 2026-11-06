// Process-isolated oJob verification. Trusted workflows only; a JVM is not a sandbox.
(function(P) {
  P.ojob = function(file, options) {
    var s = this._owner(), o = options || {}
    if (o.trusted !== true) throw s._error('PermissionError', 'oJob execution requires trusted:true; untrusted workflows require an external sandbox')
    if (o.mode && o.mode !== 'process') throw s._error('UnsupportedCapabilityError', 'Only process isolation is supported')
    if (o.expect && o.expect.componentsExecuted) throw s._error('UnsupportedCapabilityError', 'Compiled from/to components do not expose faithful execution events')
    if (!(o.timeout === undefined || typeof o.timeout === 'number' && o.timeout > 0 && isFinite(o.timeout))) throw new Error('Invalid workflow timeout')
    if (o.memoryMB !== undefined && (!Number.isInteger(o.memoryMB) || o.memoryMB < 16 || o.memoryMB > 65536)) throw new Error('memoryMB must be between 16 and 65536')
    if (o.maxEvents !== undefined && (!Number.isInteger(o.maxEvents) || o.maxEvents < 1 || o.maxEvents > 100000)) throw new Error('Invalid trace event budget')
    var dir = String(io.createTempDir('ow-test-worker-')),
      requestFile = dir + '/request.json',
      resultFile = dir + '/result.json'
    try {
      var request = {
        version: 1,
        requestId: String(java.util.UUID.randomUUID()),
        file: String(new java.io.File(file).getCanonicalPath()),
        job: o.job,
        args: o.args || {},
        mocks: o.mocks || {},
        resultFile: resultFile,
        maxEvents: o.maxEvents || 10000
      }
      io.writeFileJSON(requestFile, request)
      var env = { OW_TEST_REQUEST: requestFile };
      ['PATH', 'SystemRoot', 'WINDIR', 'TMPDIR', 'TMP', 'TEMP'].forEach(function(k) {
        var v = getEnv(k)
        if (v !== undefined && v !== null) env[k] = String(v)
      })
      Object.keys(o.env || {}).forEach(function(k) {
        env[k] = String(o.env[k])
      })
      var javaExe = String(java.lang.System.getProperty('java.home')) + '/bin/java',
        jar = String(new java.io.File(getOpenAFJar()).getCanonicalPath())
      var script = "loadCompiledLib('owrap_test_worker_js');"
      // Development harness only. Production loads the worker from the selected OpenAF artifact.
      if (o.sourceRoot) {
        env.OW_TEST_SOURCE_ROOT = String(new java.io.File(o.sourceRoot).getCanonicalPath())
        script = "loadLib(getEnv('OW_TEST_SOURCE_ROOT')+'/js/owrap.test.worker.js');"
      }
      var command = [javaExe, '-Dopenaf.test.worker=true', '-Xmx' + (o.memoryMB || 256) + 'm', '-jar', jar, '-c', script]
      var process = JSON.parse(String(Packages.openaf.OJobLanguageProcess.run(JSON.stringify({
        command: command,
        cwd: o.cwd || String(new java.io.File(file).getCanonicalFile().getParent()),
        env: env,
        clearEnvironment: true,
        timeout: o.timeout || 30000,
        maxOutputBytes: 1048576
      }))))
      if (process.timedOut) {
        var e = s._error('TimeoutError', 'Workflow worker exceeded deadline')
        e.process = process
        throw e
      }
      if (!io.fileExists(resultFile)) throw s._error('WorkerProtocolError', 'Worker produced no completed result (exit ' + process.exitcode + '): ' + process.stderr)
      if (Number(java.nio.file.Files.size(new java.io.File(resultFile).toPath())) > 16777216) throw s._error('WorkerProtocolError', 'Worker result exceeds 16 MiB')
      var result = io.readFileJSON(resultFile)
      if (result.requestId !== request.requestId || result.version !== 1 || !result.complete || process.exitcode !== 0) throw s._error('WorkerProtocolError', 'Incomplete or invalid worker result')
      result.process = {
        exitCode: process.exitcode,
        outputTruncated: process.outputTruncated,
        descendantTracking: process.descendantTracking
      }
      var expect = Object.assign({ status: 'SUCCESS' }, o.expect || {})
      s._load('assert')
      var executed = result.events.filter(function(e) {
        return e.type === 'job.start'
      }).map(function(e) {
        return e.job
      })
      if (expect.status !== undefined) s.assertEqual(result.status, expect.status)
      if (expect.jobsExecuted) s.assertDeepEqual(executed, expect.jobsExecuted);
      (expect.jobsNotExecuted || []).forEach(function(name) {
        s.assertEqual(executed.indexOf(name), -1, 'Unexpected job: ' + name)
      })
      if (expect.output !== undefined) s.assertDeepEqual(result.output, expect.output)
      if (expect.schema) s.assertSchema(result.output, expect.schema)
      if (expect.errors !== undefined) s.assertEqual(result.events.filter(function(e) {
        return e.type === 'job.error'
      }).length, expect.errors);
      (o.invariants || []).forEach(function(fn) {
        s.assertEqual(fn(result), true, 'Workflow invariant failed')
      })
      return result
    } finally {
      io.rm(dir)
    }
  }
  OpenWrap.test._modules.ojob = true
})(OpenWrap.test.prototype)
