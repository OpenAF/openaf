// OpenAF testing kernel. Extensions are loaded only when used.
// Copyright 2026 Nuno Aguiar
OpenWrap.test = function() {
  if (isDef(ow.test)) return ow.test
  this._default = true
  this._init({})
}
OpenWrap.test._modules = Object.create(null)
OpenWrap.test._moduleLock = new java.util.concurrent.locks.ReentrantLock()
OpenWrap.test._context = new java.lang.ThreadLocal();

(function(P) {
  function copy(v) {
    return JSON.parse(JSON.stringify(v))
  }
  function locked(lock, fn) {
    lock.lock()
    try {
      return fn()
    } finally {
      lock.unlock()
    }
  }
  function errorText(e) {
    try {
      return String(e)
    } catch (ignore) {
      return '[unprintable exception]'
    }
  }
  function typed(name, message) {
    var e = new Error(message)
    e.name = name
    return e
  }
  P._copy = copy
  P._locked = function(fn) {
    return locked(this._lock, fn)
  }
  P._error = typed
  P._init = function(options) {
    this._lock = new java.util.concurrent.locks.ReentrantLock()
    this._publishLock = new java.util.concurrent.locks.ReentrantLock()
    this._timers = new java.lang.ThreadLocal()
    this.sessionId = String(java.util.UUID.randomUUID())
    this.options = Object.assign({ failurePolicy: 'record' }, options || {})
    this._channelName = this._default ? '__owTest::tests' : '__owTest::' + this.sessionId
    this.reset()
    if (typeof this.options.output === 'boolean') this.setOutput(this.options.output)
  }
  P._owner = function() {
    var c = OpenWrap.test._context.get()
    return this._default && c != null ? c.session : this
  }
  P._load = function(name) {
    locked(OpenWrap.test._moduleLock, function() {
      if (!OpenWrap.test._modules[name]) loadCompiledLib('owrap_test_' + name + '_js', true)
      if (!OpenWrap.test._modules[name]) throw typed('UnsupportedCapabilityError', 'Test module unavailable: ' + name)
    })
  }
  P.createSession = function(options) {
    var s = Object.create(P)
    s._init(options)
    return s
  }

  /**
   * <odoc format="markdown">
   * <key>ow.test.reset()</key>
   * <![CDATA[
   * Resets counters, results, suite definitions and profiling state for this session.
   *
   * Throws `TestBusyError` while tests, timers or a suite run are active, and `SessionPoisonedError` for a poisoned session. Available after `ow.loadTest()`.
   * ]]>
   * </odoc>
   */
  P.reset = function() {
    var s = this
    s._locked(function() {
      if (s._poisoned) throw typed('SessionPoisonedError', 'A poisoned session cannot be reset')
      if (s._active || s._timerCount || s._running) throw typed('TestBusyError', 'Cannot reset an active session')
      s.__countTest = $atomic()
      s.__countPass = $atomic()
      s.__countFail = $atomic()
      s.__countAssert = $atomic()
      s.__profile = Object.create(null)
      s._history = Object.create(null)
      s._records = []
      s._runs = []
      s._infrastructureErrors = []
      s._unsafeContexts = []
      s._definitions = []
      s._sequence = 0
      s._active = 0
      s._timerCount = 0
      s._cancelled = false
      s._poisoned = false
      s._timers.remove()
      s.__showStackTrace = true
      s.__keepStackTrace = false
      s.__memoryprofile = false
      s.__showOutput = true
      if (s._channelCreated) {
        s.getChannel().destroy()
        s._channelCreated = false
      }
    })
  };

  /**
   * <odoc format="markdown">
   * <key>ow.test.getCountTest() : Number</key>
   * <![CDATA[
   * Returns the current count of executed tests. Assertions are counted separately by `ow.test.getCountAssert()`.
   * ]]>
   * </odoc>
   */
  /**
   * <odoc format="markdown">
   * <key>ow.test.getCountPass() : Number</key>
   * <![CDATA[
   * Returns the current count of tests that passed.
   * ]]>
   * </odoc>
   */
  /**
   * <odoc format="markdown">
   * <key>ow.test.getCountFail() : Number</key>
   * <![CDATA[
   * Returns the current count of tests that failed.
   * ]]>
   * </odoc>
   */
  /**
   * <odoc format="markdown">
   * <key>ow.test.getCountAssert() : Number</key>
   * <![CDATA[
   * Returns the current count of assertion calls, including assertions that failed.
   * ]]>
   * </odoc>
   */
  ['Test', 'Pass', 'Fail', 'Assert'].forEach(function(k) {
    P['getCount' + k] = function() {
      return Number(this['__count' + k].get())
    }
  })

  /**
   * <odoc format="markdown">
   * <key>ow.test.setOutput(aBooleanSetting)</key>
   * <![CDATA[
   * Enables or disables test output with `aBooleanSetting`. Enabled by default.
   * ]]>
   * </odoc>
   */
  P.setOutput = function(v) {
    this.__showOutput = !!v
  }

  /**
   * <odoc format="markdown">
   * <key>ow.test.setShowStackTrace(aBooleanSetting)</key>
   * <![CDATA[
   * Enables or disables Java exception stack-trace output with `aBooleanSetting`. Enabled by default; output also requires `setOutput(true)`.
   * ]]>
   * </odoc>
   */
  P.setShowStackTrace = function(v) {
    this.__showStackTrace = !!v
  }

  /**
   * <odoc format="markdown">
   * <key>ow.test.setKeepStackTrace(aBooleanSetting)</key>
   * <![CDATA[
   * Enables or disables retaining Java exception stack traces in execution records with `aBooleanSetting`. Disabled by default.
   * ]]>
   * </odoc>
   */
  P.setKeepStackTrace = function(v) {
    this.__keepStackTrace = !!v
  }

  /**
   * <odoc format="markdown">
   * <key>ow.test.setMemoryProfile(aBooleanSetting)</key>
   * <![CDATA[
   * Enables or disables process-heap sampling for timers with `aBooleanSetting`. Disabled by default.
   *
   * Samples do not force garbage collection and are not per-test allocation measurements.
   * ]]>
   * </odoc>
   */
  P.setMemoryProfile = function(v) {
    this.__memoryprofile = !!v
  }
  P._diagnostic = function(e, phase) {
    var s = this, d = {
      phase: phase,
      message: errorText(e)
    }
    s._locked(function() {
      if (s._infrastructureErrors.length < 100) s._infrastructureErrors.push(d)
    })
  }
  P._log = function(message) {
    if (this.__showOutput) try {
      log(message)
    } catch (e) {
      this._diagnostic(e, 'output')
    }
  }
  P._assertion = function() {
    var s = this._owner(), c = OpenWrap.test._context.get()
    if (c != null && c.closed) throw typed('LateAssertionError', 'Assertion after test completion')
    s.__countAssert.inc()
    if (c != null && c.session === s) c.assertions.inc()
    return s
  }

  /**
   * <odoc format="markdown">
   * <key>ow.test.assert(aResult, checkValue, errorMessage, notShowDiff)</key>
   * <![CDATA[
   * Compares `aResult` with `checkValue` using the existing OpenAF `compare` function. Throws `errorMessage` on a mismatch.
   *
   * When `notShowDiff` is `true`, omits the actual and expected values from the thrown message. Each call counts as one assertion. Available after `ow.loadTest()`.
   * ]]>
   * </odoc>
   */
  P.assert = function(actual, expected, message, notShowDiff) {
    this._assertion()
    if (!compare(actual, expected)) throw message + (notShowDiff ? '' : ' (got ' + stringify(actual) + ' but expected ' + stringify(expected, undefined, '') + ')')
  }
  P._encode = function(value) {
    var seen = [], nodes = 0
    function visit(v, depth) {
      if (++nodes > 10000 || depth > 32) return { type: 'truncated' }
      if (v === undefined) return { type: 'undefined' }
      if (v === null || typeof v === 'boolean') return v
      if (typeof v === 'string') return v.length > 32768 ? {
        type: 'string',
        value: v.slice(0, 32768),
        truncated: true
      } : v
      if (typeof v === 'number') return isFinite(v) ? v : {
        type: 'number',
        value: String(v)
      }
      if (typeof v === 'bigint' || typeof v === 'symbol') return {
        type: typeof v,
        value: String(v)
      }
      if (typeof v === 'function') return { type: 'function' }
      if ((v instanceof java.lang.Object)) return {
        type: 'java',
        className: String(v.getClass().getName())
      }
      var i = seen.indexOf(v)
      if (i >= 0) return {
        type: 'reference',
        id: i
      }
      seen.push(v)
      if (v instanceof Date) return {
        type: 'date',
        value: isNaN(v.getTime()) ? 'invalid' : v.toISOString()
      }
      if (v instanceof RegExp) return {
        type: 'regexp',
        value: String(v)
      }
      if (v instanceof Map) {
        var entries = []
        v.forEach(function(value, key) {
          if (entries.length < 1000) entries.push([visit(key, depth + 1), visit(value, depth + 1)])
        })
        return {
          type: 'map',
          entries: entries
        }
      }
      if (v instanceof Set) {
        var values = []
        v.forEach(function(value) {
          if (values.length < 1000) values.push(visit(value, depth + 1))
        })
        return {
          type: 'set',
          values: values
        }
      }
      var out = Array.isArray(v) ? [] : Object.create(null)
      Object.keys(v).slice(0, 1000).forEach(function(k) {
        var d = Object.getOwnPropertyDescriptor(v, k)
        out[k] = /^(authorization|cookie|password|passwd|secret|token|api[-_]?key)$/i.test(k) ? '[REDACTED]' :
          (d && 'value' in d ? visit(d.value, depth + 1) : { type: 'accessor' })
      })
      return out
    }
    try {
      var encoded = visit(value, 0)
      if (typeof this.options.redact === 'function') {
        encoded = this.options.redact(encoded)
        seen = []
        nodes = 0
        encoded = visit(encoded, 0)
      }
      return encoded
    } catch (e) {
      return {
        type: 'unavailable',
        message: errorText(e)
      }
    }
  }
  P._exception = function(e, phase) {
    var r = {
      name: 'Error',
      message: errorText(e),
      phase: phase || 'body'
    }
    try {
      if (e && e.name) r.name = String(e.name)
      if (e && e.stack) r.stack = String(e.stack).slice(0, 32768)
    } catch (ignore) { }
    [
      'code',
      'operator',
      'path',
      'expected',
      'actual',
      'differences',
      'truncated',
      'result',
      'observations',
      'lastError'
    ].forEach(function(k) {
      try {
        if (e && e[k] !== undefined) r[k] = e[k]
      } catch (ignore) { }
    })
    return this._encode(r)
  }
  P.timer = function(key, options) {
    key = String(key)
    options = options || {}
    var s = this, started = now(), startNano = nowNano(), ended = false, elapsed
    var memory = s.__memoryprofile || options.memory, runtime = java.lang.Runtime.getRuntime()
    var startTotal = memory ? Number(runtime.totalMemory()) : undefined,
      startFree = memory ? Number(runtime.freeMemory()) : undefined
    var startUsed = memory ? Number(runtime.totalMemory()) - Number(runtime.freeMemory()) : undefined
    s._locked(function() {
      if (!s.__profile[key]) s.__profile[key] = {
        hits: $atomic(),
        sum: $atomic(),
        last: $atomic(),
        active: 0
      }
      s.__profile[key].start = started
      s.__profile[key].active++
      s._timerCount++
    })
    var handle = {
      key: key,
      start: started,
      stop: function() {
        return s._locked(function() {
          if (ended) return elapsed
          elapsed = Math.max(0, (nowNano() - startNano) / 1000000)
          ended = true
          var p = s.__profile[key], ms = Math.floor(elapsed)
          p.hits.inc()
          p.sum.getAdd(ms)
          p.last.set(ms)
          p.min = p.min === undefined ? ms : Math.min(p.min, ms)
          p.max = p.max === undefined ? ms : Math.max(p.max, ms)
          p.active--
          s._timerCount--
          if (memory) handle.memory = {
            mode: 'processHeap',
            forcedGC: false,
            startUsed: startUsed,
            endUsed: Number(runtime.totalMemory()) - Number(runtime.freeMemory())
          }
          if (memory) {
            handle.memory.delta = handle.memory.endUsed - startUsed
            handle.memory.startTotalMem = startTotal
            handle.memory.startFreeMem = startFree
            handle.memory.stopTotalMem = Number(runtime.totalMemory())
            handle.memory.stopFreeMem = Number(runtime.freeMemory())
            Object.assign(p, handle.memory)
          }
          return elapsed
        })
      }
    }
    return handle
  }

  /**
   * <odoc format="markdown">
   * <key>ow.test.start(aKey) : String</key>
   * <![CDATA[
   * Starts a timer for `aKey` and returns the supplied key. `ow.test.stop(aKey)` stops the most recent matching timer on the current thread.
   *
   * Nested timers with the same key use a per-thread stack; elapsed time uses a monotonic clock.
   * ]]>
   * </odoc>
   */
  P.start = function(key) {
    var stack = this._timers.get()
    if (stack == null) {
      stack = Object.create(null)
      this._timers.set(stack)
    }
    var k = String(key)
    if (!stack[k]) stack[k] = []
    stack[k].push(this.timer(k))
    return key
  }

  /**
   * <odoc format="markdown">
   * <key>ow.test.stop(aKey) : Number</key>
   * <![CDATA[
   * Stops the most recent active timer for `aKey` on the current thread and returns elapsed time in integer milliseconds.
   *
   * Without a matching timer, returns `undefined`, or throws `TimerStateError` when the session uses `strict: true`.
   * ]]>
   * </odoc>
   */
  P.stop = function(key) {
    var stack = this._timers.get(), k = String(key)
    if (stack == null || !stack[k] || !stack[k].length) {
      if (this.options.strict) throw typed('TimerStateError', 'No active timer: ' + k)
      return undefined
    }
    var result = Math.floor(stack[k].pop().stop())
    if (!stack[k].length) delete stack[k]
    if (!Object.keys(stack).length) this._timers.remove()
    return result
  }
  P.profile = function(key, fn) {
    var t = this.timer(key)
    try {
      return fn()
    } finally {
      t.stop()
    }
  }

  /**
   * <odoc format="markdown">
   * <key>ow.test.profileReset(aProfileKey)</key>
   * <![CDATA[
   * Resets the counters and timing statistics for `aProfileKey`. Throws `TestBusyError` while that profile has active timers.
   * ]]>
   * </odoc>
   */
  P.profileReset = function(key) {
    var s = this
    key = String(key)
    s._locked(function() {
      if (s.__profile[key] && s.__profile[key].active) throw typed('TestBusyError', 'Profile is active: ' + key)
      s.__profile[key] = {
        hits: $atomic(),
        sum: $atomic(),
        last: $atomic(),
        active: 0
      }
    })
  }

  /**
   * <odoc format="markdown">
   * <key>ow.test.getProfile() : Map</key>
   * <![CDATA[
   * Returns a detached map of profile keys and their `hits`, `sum`, `last`, `start`, `max` and `min` values.
   *
   * Elapsed times are in integer milliseconds; `start` is a wall-clock timestamp. Timing values without completed samples may be `undefined`.
   * ]]>
   * </odoc>
   */
  P.getProfile = function() {
    var s = this
    return s._locked(function() {
      var out = Object.create(null)
      Object.keys(s.__profile).forEach(function(k) {
        var p = s.__profile[k], hits = Number(p.hits.get())
        out[k] = {
          hits: hits,
          sum: Number(p.sum.get()),
          last: hits ? Number(p.last.get()) : undefined,
          start: p.start,
          min: p.min,
          max: p.max
        }
      })
      return out
    })
  };

  /**
   * <odoc format="markdown">
   * <key>ow.test.getProfileHits(aProfileKey) : Number</key>
   * <![CDATA[
   * Returns the number of completed timer executions for `aProfileKey`, or `0` when no profile exists.
   * ]]>
   * </odoc>
   */
  /**
   * <odoc format="markdown">
   * <key>ow.test.getProfileAvg(aProfileKey) : Number</key>
   * <![CDATA[
   * Returns the average elapsed time in milliseconds for `aProfileKey`, or `undefined` when there are no completed executions.
   * ]]>
   * </odoc>
   */
  /**
   * <odoc format="markdown">
   * <key>ow.test.getProfileLast(aProfileKey) : Number</key>
   * <![CDATA[
   * Returns the last elapsed time in milliseconds for `aProfileKey`, or `undefined` when there are no completed executions.
   * ]]>
   * </odoc>
   */
  /**
   * <odoc format="markdown">
   * <key>ow.test.getProfileMax(aProfileKey) : Number</key>
   * <![CDATA[
   * Returns the maximum elapsed time in milliseconds for `aProfileKey`, or `undefined` when there are no completed executions.
   * ]]>
   * </odoc>
   */
  /**
   * <odoc format="markdown">
   * <key>ow.test.getProfileMin(aProfileKey) : Number</key>
   * <![CDATA[
   * Returns the minimum elapsed time in milliseconds for `aProfileKey`, or `undefined` when there are no completed executions.
   * ]]>
   * </odoc>
   */
  ['Hits', 'Avg', 'Last', 'Max', 'Min'].forEach(function(k) {
    P['getProfile' + k] = function(key) {
      var p = this.getProfile()[key]
      if (!p) return k === 'Hits' ? 0 : undefined
      return k === 'Avg' ? (p.hits ? p.sum / p.hits : undefined) : p[k.toLowerCase()]
    }

    /**
     * <odoc format="markdown">
     * <key>ow.test.getAllProfileHits() : Map</key>
     * <![CDATA[
     * Returns a map of all profile keys to their completed execution counts.
     * ]]>
     * </odoc>
     */
    /**
     * <odoc format="markdown">
     * <key>ow.test.getAllProfileAvg() : Map</key>
     * <![CDATA[
     * Returns a map of all profile keys to their average elapsed times in milliseconds. Profiles without completed executions have an `undefined` average.
     * ]]>
     * </odoc>
     */
    /**
     * <odoc format="markdown">
     * <key>ow.test.getAllProfileLast() : Map</key>
     * <![CDATA[
     * Returns a map of all profile keys to their last elapsed times in milliseconds. Profiles without completed executions have an `undefined` last value.
     * ]]>
     * </odoc>
     */
    if (['Hits', 'Avg', 'Last'].indexOf(k) >= 0) P['getAllProfile' + k] = function() {
      var s = this, r = Object.create(null)
      Object.keys(s.getProfile()).forEach(function(key) {
        r[key] = s['getProfile' + k](key)
      })
      return r
    }
  })

  /**
   * <odoc format="markdown">
   * <key>ow.test.getChannel() : Channel</key>
   * <![CDATA[
   * Returns the channel used for compatibility test results. The default session uses `__owTest::tests`; independent sessions use private channels.
   *
   * The session owns authoritative results. Editing channel entries does not change execution history.
   * ]]>
   * </odoc>
   */
  P.getChannel = function() {
    var s = this
    return s._locked(function() {
      var ch = $ch(s._channelName)
      if (!s._channelCreated) {
        ch.create()
        s._channelCreated = true
      }
      return ch
    })
  }

  /**
   * <odoc format="markdown">
   * <key>ow.test.getExecHistory() : Array</key>
   * <![CDATA[
   * Returns a detached snapshot of test execution history, including repeated executions.
   * ]]>
   * </odoc>
   */
  P.getExecHistory = function() {
    var s = this
    return s._locked(function() {
      return Object.keys(s._history).map(function(k) {
        return copy(s._history[k])
      })
    })
  }
  P._publish = function(name) {
    var s = this
    if (!s._default && !s._channelCreated) return
    locked(s._publishLock, function() {
      try {
        var h = s._locked(function() {
          return copy(s._history[name])
        });
        ['hits', 'pass', 'fail'].forEach(function(k) {
          h[k] = $atomic(h[k])
        })
        s.getChannel().set(name, h)
      } catch (e) {
        s._diagnostic(e, 'channel')
      }
    })
  }
  P._contextFor = function(record, options) {
    var s = this,
      disposers = [],
      c = {
        session: s,
        id: record.id,
        record: record,
        options: options,
        assertions: $atomic(),
        closed: false,
        childrenFailed: false,
        errors: [],
        tasks: [],
        taskCompletions: [],
        foreignPromises: []
      }
    c.deadline = options.timeout === undefined ? undefined : nowNano() + options.timeout * 1000000
    c.defer = function(fn) {
      if (c.closed) throw typed('ClosedContextError', 'Context is closed')
      if (typeof fn !== 'function') throw new Error('Cleanup must be a function')
      s._locked(function() {
        if (c.closed) throw typed('ClosedContextError', 'Context is closed')
        disposers.push(fn)
      })
      return fn
    }
    c.bind = function(fn) {
      return function() {
        if (c.closed) throw typed('ClosedContextError', 'Context is closed')
        var old = OpenWrap.test._context.get(), receiver = this, args = arguments
        OpenWrap.test._context.set(c)
        try {
          return fn.apply(receiver, args)
        } finally {
          if (old == null) OpenWrap.test._context.remove()
          else OpenWrap.test._context.set(old)
        }
      }
    }
    c.tmpDir = function() {
      var p = io.createTempDir('ow-test-')
      c.defer(function() {
        io.rm(p)
      })
      return p
    }
    c.channel = function() {
      var name = 'ow-test::' + String(java.util.UUID.randomUUID()), ch = $ch(name)
      ch.create()
      c.defer(function() {
        ch.destroy()
      })
      return ch
    }
    c._cleanup = function() {
      while (disposers.length) {
        try {
          disposers.pop()()
        } catch (e) {
          if (c.closed) s._diagnostic(e, 'deferredCleanup')
          else c.errors.push(s._exception(e, 'cleanup'))
        }
      }
    }
    c.skip = function(reason) {
      throw typed('SkipError', reason || 'Skipped')
    }
    c.checkCancelled = function() {
      if (c.deadline !== undefined && nowNano() > c.deadline) throw typed('TimeoutError', 'Execution deadline exceeded')
      if (s._cancelled) throw typed('CancelledError', 'Session cancelled')
    };
    [
      'assert',
      'assertEqual',
      'assertNotEqual',
      'assertDeepEqual',
      'assertMatch',
      'assertContains',
      'assertThrows',
      'assertSchema',
      'assertApprox',
      'assertType',
      'assertCalled',
      'eventually',
      'mock',
      'spy',
      'spawn',
      'await'
    ].forEach(function(k) {
      c[k] = function() {
        return s[k].apply(s, arguments)
      }
    })
    return c
  }
  P._invokeBounded = function(c, fn, timeout) {
    if (timeout === undefined) return c.bind(fn)()
    if (!(timeout > 0) || !isFinite(timeout)) throw new Error('timeout must be positive')
    var s = this,
      executor = java.util.concurrent.Executors.newSingleThreadExecutor(),
      done = new java.util.concurrent.CountDownLatch(1),
      value,
      error,
      threw = false
    c.workerDone = done
    var future = executor.submit(new java.util.concurrent.Callable({
      call: function() {
        try {
          value = c.bind(fn)()
        } catch (e) {
          error = e
          threw = true
        } finally {
          done.countDown()
        }
        return null
      }
    }))
    try {
      if (!done.await(timeout, java.util.concurrent.TimeUnit.MILLISECONDS)) {
        future.cancel(true)
        if (!done.await(1000, java.util.concurrent.TimeUnit.MILLISECONDS)) {
          s._poisoned = true
          c.unsafeCleanup = true
        }
        throw typed('TimeoutError', 'Execution exceeded ' + timeout + 'ms')
      }
      if (threw) throw error
      return value
    } finally {
      executor.shutdownNow()
    }
  }
  P._deferCleanup = function(c) {
    var s = this
    c.cleanupDone = new java.util.concurrent.CountDownLatch(1)
    s._locked(function() {
      s._unsafeContexts.push(c)
    })
    if (c.foreignFuture) {
      s._diagnostic('Future cancellation does not confirm termination; resources retained', 'cleanup')
      return
    }
    var thread = new java.lang.Thread(new java.lang.Runnable({
      run: function() {
        if (c.workerDone) c.workerDone.await()
        c.taskCompletions.forEach(function(t) {
          t.done.await()
        })
        c.foreignPromises.forEach(function(t) {
          while (t.executing.get() || !t.executors.isEmpty()) java.lang.Thread.sleep(5)
        });
        (c.waitCleanup || []).forEach(function(other) {
          other.cleanupDone.await()
        })
        try {
          c._cleanup()
        } finally {
          c.cleanupDone.countDown()
        }
      }
    }), 'ow-test-deferred-cleanup')
    thread.setDaemon(true)
    thread.start()
  }
  P._perform = function(name, fn, options) {
    var s = this._owner()
    options = Object.assign({}, s.options, options || {})
    if (['record', 'throw', 'failFast'].indexOf(options.failurePolicy) < 0) throw new Error('Unknown failure policy')
    if (options.evidenceMode && ['local', 'mock', 'replay', 'live', 'mixed'].indexOf(options.evidenceMode) < 0) throw new Error('Unknown test evidence mode')
    if (s._poisoned) throw typed('SessionPoisonedError', 'A previous task has not terminated')
    var parent = OpenWrap.test._context.get(), record, timer, value, thrown = false, original
    s._locked(function() {
      s._active++
      s.__countTest.inc()
      record = {
        id: s.sessionId + ':' + (++s._sequence),
        name: String(name),
        parentId: parent == null ? undefined : parent.id,
        start: now(),
        status: 'PASS',
        errors: [],
        evidenceMode: options.evidenceMode || 'local'
      }
    })
    timer = s.timer(name)
    var c = s._contextFor(record, options)
    OpenWrap.test._context.set(c)
    s._log(name + ' | TEST')
    try {
      c.checkCancelled()
      value = options.legacy ? fn(c) : s._invokeBounded(c, function() {
        return fn(c)
      }, options.timeout)
      if (!options.legacy && value && (value instanceof oPromise || (value instanceof java.lang.Object) && value instanceof java.util.concurrent.Future || typeof value.then === 'function')) {
        s._load('async')
        value = s.await(value, options.timeout)
      }
      if (c.tasks.length) {
        s._load('async')
        c.tasks.forEach(function(t) {
          s.await(t, options.timeout)
        })
      }
      if (!options.legacy && c.childrenFailed) throw typed('ChildTestError', 'A nested test failed')
    } catch (e) {
      thrown = true
      original = e
      record.errors.push(s._exception(e, 'body'))
      if (s.__showStackTrace && s.__showOutput) try {
        e.javaException.printStackTrace()
      } catch (ignore) { }
      if (s.__keepStackTrace) try {
        record.stackTrace = getJavaStackTrace(e)
      } catch (ignore) { }
      var n = e && e.name
      record.status = n === 'SkipError' ? 'SKIP' : n === 'TimeoutError' ? 'TIMEOUT' : n === 'CancelledError' ? 'CANCELLED' : options.legacy || n === 'AssertionError' ? 'FAIL' : 'ERROR'
    } finally {
      try {
        c.taskCompletions.forEach(function(t) {
          if (t.done.getCount() > 0) {
            t.task.cancel('Test finished')
            if (!t.done.await(1000, java.util.concurrent.TimeUnit.MILLISECONDS)) {
              if (!t.started.get() && !t.task.executing.get() && t.task.executors.isEmpty()) t.done.countDown()
              else {
                s._poisoned = true
                c.unsafeCleanup = true
              }
            }
          }
        })
        if (!c.unsafeCleanup) c._cleanup()
        else c.errors.push(s._exception(typed('CleanupDeferredError', 'Worker still running; session cannot be reused'), 'cleanup'))
      } finally {
        c.closed = true
        if (c.unsafeCleanup) s._deferCleanup(c)
        if (parent == null) OpenWrap.test._context.remove()
        else OpenWrap.test._context.set(parent)
        record.elapsedTime = timer.stop()
        record.durationMs = record.elapsedTime
        record.assertions = Number(c.assertions.get())
      }
      record.errors = record.errors.concat(c.errors)
      if (c.errors.length && (record.status === 'PASS' || record.status === 'SKIP')) record.status = 'ERROR'
      if (record.errors.length) record.exception = record.errors.map(function(e) {
        return e.message
      }).join('\n')
      if (timer.memory) {
        record.memory = timer.memory;
        ["startTotalMem", "startFreeMem", "stopTotalMem", "stopFreeMem"].forEach(function(k) {
          record[k] = timer.memory[k]
        })
        record.diffMem = timer.memory.delta
      }
      record.returnValue = s._encode(value)
      var failed = ['PASS', 'SKIP'].indexOf(record.status) < 0
      s._locked(function() {
        s._active--
        if (failed) s.__countFail.inc()
        else s.__countPass.inc()
        var h = s._history[name]
        if (!h) h = s._history[name] = {
          test: String(name).replace(/.+::/, ''),
          suite: String(name).indexOf('::') > 0 ? String(name).replace(/::.+/, '') : 'Test suite',
          hits: 0,
          pass: 0,
          fail: 0,
          start: record.start,
          executions: []
        }
        if (record.exitCode !== undefined) h.exitCode = record.exitCode
        h.hits++
        if (failed) h.fail++
        else h.pass++
        h.executions.push(copy(record))
        s._records.push(copy(record))
      })
      if (parent != null && failed) parent.childrenFailed = true
      s._publish(name)
      s._log(name + ' | ' + record.status + (record.exception ? ' | ' + record.exception : ''))
      if (failed && options.failurePolicy === 'failFast') s._cancelled = true
    }
    if (options.failurePolicy === 'throw' && record.status !== 'PASS' && record.status !== 'SKIP') throw thrown ? original : typed('CleanupError', record.exception)
    return {
      value: value,
      record: copy(record),
      failed: record.status !== 'PASS'
    }
  }

  /**
   * <odoc format="markdown">
   * <key>ow.test.test(aTest, aFunction, aArgMap) : Object</key>
   * <![CDATA[
   * Runs `aFunction` as the test named `aTest`. Names containing `::` provide report grouping.
   *
   * The callback receives:
   *
   * 1. A function for logging a map, array, string or other result value.
   * 2. The optional `aArgMap`.
   *
   * Returns the callback result on success and `undefined` on failure under the default `record` policy. A successful callback may also return `undefined`; use `execute()` or `getResults()` for an explicit status. Available after `ow.loadTest()`.
   *
   * ```javascript
   * ow.loadTest()
   * ow.test.test("Example::sum", function() {
   *   ow.test.assert(1 + 1, 2, "Unexpected sum")
   * })
   * ```
   * ]]>
   * </odoc>
   */
  P.test = function(name, fn, args, options) {
    var s = this._owner()
    var r = s._perform(name, function(c) {
      return fn(function(v) {
        c.record.result = (isMap(v) || Array.isArray(v)) ? af.toSLON(s._encode(v)) : s._encode(v)
        s._log(name + ' | ' + c.record.result)
      }, args)
    }, Object.assign({}, options, { legacy: true }))
    return r.failed ? undefined : r.value
  }
  P.execute = function(name, fn, options) {
    return this._perform(name, fn, options).record
  }

  /**
   * <odoc format="markdown">
   * <key>ow.test.testExternally(aTest, aCommand, aTimeout) : Object</key>
   * <![CDATA[
   * Runs `aCommand` as the test named `aTest`, with an optional `aTimeout` in milliseconds. A nonzero exit code records a failure.
   *
   * Returns standard output on success and `undefined` on failure under the default `record` policy. A name containing `::` provides report grouping. Available after `ow.loadTest()`.
   * ]]>
   * </odoc>
   */
  P.testExternally = function(name, command, timeout, options) {
    return this.test(name, function() {
      var r = $sh(command, '').timeout(timeout).get(0), c = OpenWrap.test._context.get()
      c.record.exitCode = r.exitcode
      if (r.exitcode !== 0) throw 'exit code ' + r.exitcode
      return r.stdout
    }, undefined, options)
  }
  P.cancel = function() {
    this._cancelled = true
  }
  P.getResults = function() {
    var s = this
    return s._locked(function() {
      return copy({
        schemaVersion: 1,
        sessionId: s.sessionId,
        records: s._records,
        runs: s._runs,
        infrastructureErrors: s._infrastructureErrors,
        complete: s._active === 0 && !s._poisoned
      })
    })
  }
  P.capabilities = function() {
    return {
      version: 1,
      sessions: true,
      suites: true,
      ojobProcess: true,
      nativePromises: false,
      compositionTracing: false,
      sandbox: false
    }
  }
  P.report = {};
  ['json', 'markdown', 'junit'].forEach(function(k) {
    P.report[k] = function() {
      P._load('report')
      return P.report[k].apply(P.report, arguments)
    }
  })
  var methods = {
    assert: [
      'assertEqual',
      'assertNotEqual',
      'assertDeepEqual',
      'assertMatch',
      'assertContains',
      'assertThrows',
      'assertSchema',
      'assertApprox',
      'assertType'
    ],
    run: ['suite', 'run', 'runFiles', 'discover'],
    report: ['toMarkdown', 'toJUnitXML'],
    mock: ['mock', 'spy', 'assertCalled'],
    async: ['eventually', 'spawn', 'await'],
    ojob: ['ojob']
  }
  Object.keys(methods).forEach(function(module) {
    methods[module].forEach(function(name) {
      var stub = function() {
        this._load(module)
        if (P[name] === stub) throw new Error('Missing test method: ' + name)
        return P[name].apply(this, arguments)
      }
      P[name] = stub
    })
  })
})(OpenWrap.test.prototype)
