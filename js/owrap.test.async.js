// Explicit OpenAF async adapters. No native Promise queue pumping. Copyright 2026 Nuno Aguiar
(function(P) {
  P.await = function(task, timeout) {
    var s = this._owner(), c = OpenWrap.test._context.get()
    timeout = timeout === undefined ? 5000 : timeout
    if (!(timeout > 0) || !isFinite(timeout)) throw new Error('timeout must be positive')
    if (c && c.deadline !== undefined) timeout = Math.max(1, Math.min(timeout, (c.deadline - nowNano()) / 1000000))
    var deadline = nowNano() + timeout * 1000000
    if (task instanceof oPromise) {
      while (task.executing.get() || !task.executors.isEmpty() || task.state.get() === task.states.NEW || task.state.get() === task.states.PREFAILED) {
        if (nowNano() >= deadline) {
          task.cancel('Test deadline')
          var grace = nowNano() + 1000000000
          while (task.executing.get() && nowNano() < grace) sleep(1)
          if (c && task.executing.get()) {
            s._poisoned = true
            c.unsafeCleanup = true
            c.foreignPromises.push(task)
          }
          throw s._error('TimeoutError', 'oPromise did not settle within ' + timeout + 'ms')
        }
        if (c) c.checkCancelled()
        sleep(1)
      }
      if (task.state.get() === task.states.FAILED) throw task.reason
      return task.value
    }
    if ((task instanceof java.lang.Object) && task instanceof java.util.concurrent.Future) {
      try {
        return task.get(timeout, java.util.concurrent.TimeUnit.MILLISECONDS)
      } catch (e) {
        if (e.javaException instanceof java.util.concurrent.TimeoutException) {
          task.cancel(true)
          if (c) {
            s._poisoned = true
            c.unsafeCleanup = true
            c.foreignFuture = true
          }
          throw s._error('TimeoutError', 'Future deadline')
        }
        throw e
      }
    }
    throw s._error('UnsupportedCapabilityError', 'Only OpenAF oPromise and Java Future are supported')
  }
  P.spawn = function(fn) {
    var c = OpenWrap.test._context.get()
    if (c == null) throw new Error('spawn requires an active test')
    var done = new java.util.concurrent.CountDownLatch(1),
      started = new java.util.concurrent.atomic.AtomicBoolean(false),
      task = $do(function() {
        started.set(true)
        try {
          return c.bind(fn)()
        } finally {
          done.countDown()
        }
      })
    c.session._locked(function() {
      c.tasks.push(task)
      c.taskCompletions.push({
        task: task,
        done: done,
        started: started
      })
    })
    return task
  }
  P.eventually = function(fn, opts) {
    this._load('assert')
    var s = this._assertion(),
      o = Object.assign({
        timeout: 5000,
        interval: 100,
        backoff: 1,
        maxInterval: 1000
      }, opts || {})
    if (!(o.timeout > 0) || !(o.interval > 0) || !(o.backoff >= 1) || !(o.maxInterval > 0) || ![o.timeout, o.interval, o.backoff, o.maxInterval].every(isFinite)) throw new Error('Invalid polling budget')
    var end = nowNano() + o.timeout * 1000000, interval = o.interval, last, count = 0, lastError
    do {
      count++
      try {
        last = fn()
        lastError = undefined
        var ok = o.predicate ? o.predicate(last) : s._compare(last, o.equals).equal
        if (ok) return last
      }
      catch (e) {
        lastError = String(e)
        if (!o.retryOn || !o.retryOn(e)) throw e
      }
      var c = OpenWrap.test._context.get()
      if (c) c.checkCancelled()
      var left = (end - nowNano()) / 1000000
      if (left <= 0) break
      sleep(Math.max(1, Math.floor(Math.min(left, interval))))
      interval = Math.min(o.maxInterval, interval * o.backoff)
    } while (nowNano() < end)
    var error = s._error('TimeoutError', 'Eventually assertion timed out after ' + count + ' observations')
    error.actual = s._encode(last)
    error.expected = s._encode(o.equals)
    error.observations = count
    error.lastError = lastError
    throw error
  }
  OpenWrap.test._modules.async = true
})(OpenWrap.test.prototype)
