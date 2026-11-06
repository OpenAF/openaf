// Standalone suites and lifecycle. Copyright 2026 Nuno Aguiar
(function(P) {
  function options(o) {
    o = o || {}
    if (o.retries !== undefined && (!Number.isInteger(o.retries) || o.retries < 0)) throw new Error('retries must be a nonnegative integer')
    if (o.timeout !== undefined && (!(o.timeout > 0) || !isFinite(o.timeout))) throw new Error('timeout must be positive milliseconds')
    return o
  }
  P.suite = function(name, define, opts) {
    var s = this,
      root = {
        name: String(name),
        options: options(opts),
        children: [],
        hooks: {
          beforeAll: [],
          afterAll: [],
          beforeEach: [],
          afterEach: []
        },
        fixtures: Object.create(null)
      }
    function builder(node) {
      var t = {};
      ['beforeAll', 'afterAll', 'beforeEach', 'afterEach'].forEach(function(k) {
        t[k] = function(fn) {
          if (typeof fn !== 'function') throw new Error('Hook must be a function')
          node.hooks[k].push(fn)
        }
      })
      t.test = function(n, fn, o) {
        if (typeof fn !== 'function') throw new Error('Test must be a function')
        node.children.push({
          name: String(n),
          fn: fn,
          options: options(o)
        })
      }
      t.suite = function(n, fn, o) {
        var child = {
          name: String(n),
          options: options(o),
          children: [],
          hooks: {
            beforeAll: [],
            afterAll: [],
            beforeEach: [],
            afterEach: []
          },
          fixtures: Object.create(null)
        }
        node.children.push(child)
        fn(builder(child))
      }
      t.skip = function(n, reason) {
        node.children.push({
          name: String(n),
          options: {
            skip: true,
            reason: reason || 'Skipped'
          }
        })
      }
      t.todo = function(n) {
        node.children.push({
          name: String(n),
          options: { todo: true }
        })
      }
      t.fixture = function(n, fn, o) {
        o = o || {}
        if (node.fixtures[n]) throw new Error('Duplicate fixture: ' + n)
        if (o.scope && ['test', 'suite'].indexOf(o.scope) < 0) throw new Error('Unknown fixture scope')
        node.fixtures[n] = {
          factory: fn,
          scope: o.scope || 'test'
        }
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
        'assertType'
      ].forEach(function(k) {
        t[k] = function() {
          return s[k].apply(s, arguments)
        }
      })
      return t
    }
    if (s._running) throw new Error('Cannot register a suite while running')
    define(builder(root))
    s._definitions.push(root)
    return this
  }
  P.run = function(runOptions) {
    var s = this, o = options(Object.assign({}, s.options, runOptions || {})), started = now(), nano = nowNano()
    if (['record', 'throw', 'failFast'].indexOf(o.failurePolicy) < 0) throw new Error('Unknown failure policy');
    ['tags', 'names'].forEach(function(k) {
      if (o[k] !== undefined && (!Array.isArray(o[k]) || o[k].some(function(v) {
        return typeof v !== 'string'
      }))) throw new Error(k + ' must be an array of strings')
    })
    if (o.workers !== undefined && (!Number.isInteger(o.workers) || o.workers < 1 || o.workers > 256)) throw new Error('workers must be an integer between 1 and 256')
    s._locked(function() {
      if (s._running || s._active) throw s._error('TestBusyError', 'Session is active')
      s._running = true
    })
    s._cancelled = false
    var run = {
      schemaVersion: 1,
      runId: String(java.util.UUID.randomUUID()),
      startedAt: new Date(started).toISOString(),
      complete: true,
      status: 'PASS',
      tests: [],
      suites: [],
      infrastructureErrors: [],
      environment: {
        openafVersion: getVersion(),
        javaVersion: String(java.lang.System.getProperty('java.version')),
        os: String(java.lang.System.getProperty('os.name'))
      }
    }
    function selected(name, tags) {
      return (!o.names || o.names.indexOf(name) >= 0) && (!o.tags || o.tags.every(function(t) {
        return tags.indexOf(t) >= 0
      }))
    }
    function hasSelected(node, path, tags) {
      var full = path.concat(node.name), ts = tags.concat(node.options.tags || [])
      return node.children ? node.children.some(function(n) {
        return hasSelected(n, full, ts)
      }) : selected(full.join('::'), ts)
    }
    function invoke(fn, c) {
      var result = fn(c)
      if (result && (result instanceof oPromise || (result instanceof java.lang.Object) && result instanceof java.util.concurrent.Future || typeof result.then === 'function')) {
        s._load('async')
        return s.await(result, c.options.timeout)
      }
      return result
    }
    function hook(fn, c, phase) {
      try {
        return s._invokeBounded(c, function() {
          return invoke(fn, c)
        }, c.options.timeout)
      } catch (e) {
        var x = s._exception(e, phase)
        if (!(phase === 'beforeAll' && e && e.name === 'SkipError')) s._locked(function() {
          run.infrastructureErrors.push(x)
        })
        return { hookError: x }
      }
    }
    function executeNode(node, ancestors, path, tags, blocked) {
      var full = path.concat(node.name), name = full.join('::'), allTags = tags.concat(node.options.tags || [])
      if (!hasSelected(node, path, tags)) return
      if (node.children) {
        var inherited = Object.assign.apply(Object, [{}, o].concat(ancestors.map(function(a) {
          return a.node.options
        }), [node.options]))
        var suite = { name: name },
          sc = s._contextFor({ id: run.runId + ':suite:' + name }, { timeout: inherited.timeout }),
          state = {
            node: node,
            context: sc,
            values: Object.create(null)
          }
        s._locked(function() {
          run.suites.push(suite)
        })
        var failed = blocked
        try {
          if (!failed && !s._cancelled) node.hooks.beforeAll.forEach(function(fn) {
            if (!failed) {
              var r = hook(fn, sc, 'beforeAll')
              if (r && r.hookError) failed = r.hookError.name === 'SkipError' ? {
                skip: true,
                reason: r.hookError.message
              } : {
                skip: false,
                reason: r.hookError.message
              }
            }
          })
          node.children.forEach(function(child) {
            executeNode(child, ancestors.concat(state), full, allTags, failed)
          })
        } finally {
          if (!blocked && !s._poisoned) node.hooks.afterAll.slice().reverse().forEach(function(fn) {
            hook(fn, sc, 'afterAll')
          })
          if (!s._poisoned) sc._cleanup()
          suite.assertions = Number(sc.assertions.get())
          sc.closed = true
          if (s._poisoned) {
            sc.waitCleanup = s._locked(function() {
              return s._unsafeContexts.slice()
            })
            s._deferCleanup(sc)
          }
          s._locked(function() {
            run.infrastructureErrors = run.infrastructureErrors.concat(sc.errors)
          })
        }
        return
      }
      var test = {
        definitionId: name,
        name: name,
        tags: allTags,
        attempts: [],
        status: 'PASS',
        flaky: false
      }
      s._locked(function() {
        run.tests.push(test)
      })
      if (blocked || s._cancelled || node.options.skip || node.options.todo) {
        test.status = blocked ? (blocked.skip ? 'SKIP' : 'BLOCKED') : s._cancelled ? 'CANCELLED' : node.options.todo ? 'TODO' : 'SKIP'
        test.reason = blocked ? blocked.reason : node.options.reason
        return
      }
      var testOptions = Object.assign.apply(Object, [{}, o].concat(ancestors.map(function(a) {
        return a.node.options
      }), [node.options, { failurePolicy: 'record' }])),
        retries = testOptions.retries || 0
      for (var n = 0; n <= retries; n++) {
        var r = s.execute(name, function(c) {
          var values = Object.create(null), resolving = Object.create(null), entered = [], bodyError
          c.fixture = function(key) {
            var owner
            for (var i = ancestors.length - 1; i >= 0; i--)if (ancestors[i].node.fixtures[key]) {
              owner = ancestors[i]
              break
            }
            if (!owner) throw new Error('Unknown fixture: ' + key)
            var f = owner.node.fixtures[key],
              store = f.scope === 'suite' ? owner.values : values,
              target = f.scope === 'suite' ? owner.context : c
            if (Object.prototype.hasOwnProperty.call(store, key)) return store[key]
            if (resolving[key]) throw new Error('Cyclic fixture: ' + key)
            resolving[key] = true
            try {
              if (f.scope === 'suite') target.fixture = function(dependency) {
                var depOwner
                for (var j = ancestors.length - 1; j >= 0; j--)if (ancestors[j].node.fixtures[dependency]) {
                  depOwner = ancestors[j]
                  break
                }
                if (!depOwner || depOwner.node.fixtures[dependency].scope !== 'suite') throw new Error('Suite fixtures may depend only on suite fixtures')
                return c.fixture(dependency)
              }
              store[key] = target.bind(function() {
                return f.factory(target)
              })()
              return store[key]
            } finally {
              delete resolving[key]
            }
          }
          try {
            ancestors.forEach(function(a) {
              entered.push(a)
              a.node.hooks.beforeEach.forEach(function(fn) {
                try {
                  invoke(fn, c)
                } catch (e) {
                  if (!(e && e.name === 'SkipError')) c.errors.push(s._exception(e, 'beforeEach'))
                  throw e
                }
              })
            })
            return invoke(node.fn, c)
          } finally {
            entered.reverse().forEach(function(a) {
              a.node.hooks.afterEach.slice().reverse().forEach(function(fn) {
                try {
                  invoke(fn, c)
                } catch (e) {
                  c.errors.push(s._exception(e, 'afterEach'))
                }
              })
            })
          }
        }, testOptions)
        test.attempts.push(r)
        test.status = r.status
        if (r.status === 'PASS' || r.status === 'SKIP' || r.status === 'TIMEOUT' || r.status === 'CANCELLED' || r.errors.some(function(e) {
          return e.phase !== 'body'
        })) break
      }
      test.flaky = test.status === 'PASS' && test.attempts.length > 1
      if (['PASS', 'SKIP'].indexOf(test.status) < 0 && o.failurePolicy === 'failFast') s._cancelled = true
    }
    try {
      if ((o.workers || 1) === 1) s._definitions.forEach(function(node) {
        executeNode(node, [], [], [], undefined)
      })
      else {
        var pool = java.util.concurrent.Executors.newFixedThreadPool(o.workers), pending = []
        try {
          s._definitions.forEach(function(node) {
            pending.push(pool.submit(new java.util.concurrent.Callable({
              call: function() {
                executeNode(node, [], [], [], undefined)
                return null
              }
            })))
          })
          pending.forEach(function(f) {
            f.get()
          })
        }
        finally {
          pool.shutdownNow()
        }
      }
    }
    catch (e) {
      run.complete = false
      run.infrastructureErrors.push(s._exception(e, 'runner'))
    }
    finally {
      s._running = false
    }
    var order = []
    function index(node, path) {
      var name = path.concat(node.name)
      if (node.children) node.children.forEach(function(n) {
        index(n, name)
      })
      else order.push(name.join('::'))
    }
    s._definitions.forEach(function(n) {
      index(n, [])
    })
    run.tests.sort(function(a, b) {
      return order.indexOf(a.name) - order.indexOf(b.name)
    })
    run.suites.sort(function(a, b) {
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0
    })
    var sum = {
      tests: run.tests.length,
      passed: 0,
      failed: 0,
      errors: 0,
      skipped: 0,
      todo: 0,
      timedOut: 0,
      cancelled: 0,
      blocked: 0,
      attempts: 0,
      assertions: 0
    }
    var keys = {
      PASS: 'passed',
      FAIL: 'failed',
      ERROR: 'errors',
      SKIP: 'skipped',
      TODO: 'todo',
      TIMEOUT: 'timedOut',
      CANCELLED: 'cancelled',
      BLOCKED: 'blocked'
    }
    run.tests.forEach(function(t) {
      sum[keys[t.status]]++
      sum.attempts += t.attempts.length
      t.attempts.forEach(function(a) {
        sum.assertions += a.assertions
      })
    })
    run.infrastructureErrors = run.infrastructureErrors.concat(s._copy(s._infrastructureErrors))
    sum.hookAssertions = run.suites.reduce(function(total, suite) {
      return total + (suite.assertions || 0)
    }, 0)
    sum.assertions += sum.hookAssertions
    run.summary = sum
    run.durationMs = (nowNano() - nano) / 1000000
    run.complete = run.complete && !s._poisoned
    if (!run.complete || run.infrastructureErrors.length) run.status = 'ERROR'
    else if (sum.failed + sum.errors + sum.timedOut + sum.blocked + sum.cancelled) run.status = 'FAIL'
    run.exitCode = run.status === 'PASS' ? 0 : run.status === 'ERROR' ? 2 : 1
    s._locked(function() {
      s._runs.push(s._copy(run))
    })
    if (o.failurePolicy === 'throw' && run.status !== 'PASS') {
      var e = s._error('TestRunError', 'Test run failed')
      e.result = run
      throw e
    }
    return s._copy(run)
  }
  P.discover = function(files, opts) {
    opts = opts || {}
    if (opts.mode !== 'manifest') throw new Error('Discovery requires mode: manifest; executing modules uses runFiles')
    return files.slice().sort().map(function(file) {
      var manifest = io.readFileJSON(file)
      if (manifest.version !== 1 || !Array.isArray(manifest.tests)) throw new Error('Invalid test manifest: ' + file)
      return {
        file: file,
        tests: manifest.tests
      }
    })
  }
  P.runFiles = function(files, opts) {
    var s = this
    files.slice().sort().forEach(function(file) {
      var module = require(file)
      s.suite(file, function(t) {
        if (typeof module.register === 'function') module.register(t)
        else Object.keys(module).filter(function(k) {
          return /^test/.test(k) && typeof module[k] === 'function'
        }).sort().forEach(function(k) {
          t.test(k, module[k])
        })
      })
    })
    return s.run(opts)
  }
  OpenWrap.test._modules.run = true
})(OpenWrap.test.prototype)
