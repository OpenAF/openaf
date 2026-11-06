// Dedicated worker entry; request data is JSON, never evaluated as source.
(function() {
  __flags.OAF_PRECOMPILE_LEVEL = 0
  var root = getEnv('OW_TEST_SOURCE_ROOT')
  ow.loadTest()
  ow.loadOJob()
  if (root) {
    loadLib(root + '/js/owrap.test.js')
    ow.test = undefined
    ow.test = new OpenWrap.test()
    loadLib(root + '/js/owrap.oJob.js')
    Object.setPrototypeOf(ow.oJob, OpenWrap.oJob.prototype)
  }
  var request = io.readFileJSON(getEnv('OW_TEST_REQUEST'))
  if (request.version !== 1 || typeof request.requestId !== 'string' || typeof request.file !== 'string' || typeof request.resultFile !== 'string') throw new Error('Invalid worker request')
  var session = ow.test.createSession({ output: false }),
    events = [],
    lock = new java.util.concurrent.locks.ReentrantLock(),
    complete = true,
    errors = [],
    mocked = []
  ow.oJob.__testObserver = function(event) {
    lock.lock()
    try {
      if (events.length >= request.maxEvents) {
        complete = false
        throw new Error('Trace event budget exceeded')
      }
      event.sequence = events.length
      event.timestamp = now()
      events.push(session._encode(event))
    } finally {
      lock.unlock()
    }
  }
  ow.oJob.__testTransform = function(job) {
    if (!Object.prototype.hasOwnProperty.call(request.mocks, job.name)) return job
    var copy = Object.assign({}, job), mock = request.mocks[job.name]
    mocked.push(job.name)
    // Replace the named definition before composition; preserve dependencies and metadata.
    copy.exec = 'var __mock = ' + JSON.stringify(mock) + '; if (__mock.delayMs) sleep(__mock.delayMs); if (__mock.error !== undefined) throw new Error(String(__mock.error)); Object.assign(args, __mock.output === undefined ? __mock : __mock.output);'
    delete copy.lang
    delete copy.file
    return copy
  }
  try {
    $set("res", {})
    var definition = ow.oJob.__loadFile(request.file, !!request.job)
    if (!definition) throw new Error('Workflow definition was not loaded')
    ow.oJob.load(definition.jobs, definition.todo, definition.ojob, request.args, undefined, definition.init, definition.help)
    if (request.job) {
      if (!ow.oJob.getJobsCh().get({ name: request.job })) throw new Error('Unknown job: ' + request.job)
      ow.oJob.addTodos([request.job])
    }
    Object.keys(request.mocks).forEach(function(name) {
      if (mocked.indexOf(name) < 0) throw new Error('Unknown mock job: ' + name)
    })
    ow.oJob.start(request.args, true)
  } catch (e) {
    errors.push(session._exception(e, 'workflow'))
  }
  finally {
    ow.oJob.__testObserver = undefined
    ow.oJob.__testTransform = undefined
  }
  var last = events.filter(function(e) {
    return e.type === 'job.end'
  }).pop()
  var output = last ? session._copy(last.args) : {};
  ['objId', 'execid', '__id'].forEach(function(k) {
    delete output[k]
  })
  var result = {
    version: 1,
    requestId: request.requestId,
    complete: complete,
    status: errors.length || events.some(function(e) {
      return e.type === 'job.error' || e.type === 'job.log' && ['error', 'depsfail'].indexOf(e.operation) >= 0
    }) ? 'ERROR' : 'SUCCESS',
    evidenceMode: mocked.length ? 'mixed' : 'live',
    mockedJobs: mocked,
    events: events,
    errors: errors,
    output: output,
    capabilities: {
      scheduledJobs: true,
      composition: false
    }
  }
  io.writeFileJSON(request.resultFile, result)
  exit(complete ? 0 : 2)
})()
