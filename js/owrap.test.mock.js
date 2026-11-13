// Scoped JavaScript mocks; Java-backed members must be injected behind an adapter.
(function(P) {
  var owners = [], lock = new java.util.concurrent.locks.ReentrantLock()
  function locked(fn) {
    lock.lock()
    try {
      return fn()
    } finally {
      lock.unlock()
    }
  }
  P.mock = function(target, key, replacement, options) {
    var s = this._owner(), c = OpenWrap.test._context.get(), o = options || {}
    if (c == null || c.session !== s) throw new Error('Mocks require an active owning test context')
    if (!target || (target instanceof java.lang.Object)) throw s._error('UnsupportedCapabilityError', 'Inject a JavaScript adapter for Java-backed objects')
    if (typeof replacement !== 'function' && !Array.isArray(replacement)) throw new Error('Mock replacement must be a function or response sequence')
    return locked(function() {
      if (owners.some(function(x) {
        return x.target === target && x.key === key
      })) throw s._error('MockOwnershipError', 'Member already mocked: ' + key)
      var descriptor = Object.getOwnPropertyDescriptor(target, key)
      if (!descriptor || !('value' in descriptor) || typeof descriptor.value !== 'function' || (!descriptor.writable && !descriptor.configurable)) throw new Error('Mock requires an own writable data method')
      var original = descriptor.value, history = [], active = true, index = 0, entry = {
        target: target,
        key: key
      }
      var handle = {
        calls: function() {
          return locked(function() {
            return s._copy(history)
          })
        },
        restore: function() {
          return locked(function() {
            if (!active) return
            Object.defineProperty(target, key, descriptor)
            active = false
            owners.splice(owners.indexOf(entry), 1)
          })
        }
      }
      var wrapped = function() {
        var receiver = this, args = Array.prototype.slice.call(arguments), current = OpenWrap.test._context.get()
        // Unrelated tests and threads see the real member, never another test's replacement.
        if (current !== c) return original.apply(receiver, args)
        var encodedArgs = s._encode(args)
        var call = locked(function() {
          var r = {
            index: history.length,
            args: encodedArgs,
            startedAt: now()
          }
          history.push(r)
          return r
        }),
          start = nowNano()
        try {
          if (o.match && !o.match(args)) throw s._error('MockArgumentsError', 'Arguments did not match ' + key)
          var value
          if (Array.isArray(replacement)) {
            var response = locked(function() {
              if (index >= replacement.length) throw s._error('MockSequenceError', 'Mock sequence exhausted: ' + key)
              return replacement[index++]
            })
            if (response && Object.prototype.hasOwnProperty.call(response, 'throws')) throw response.throws
            value = typeof response === 'function' ? response.apply(receiver, args) : response && Object.prototype.hasOwnProperty.call(response, 'returns') ? response.returns : response
          } else value = replacement.apply(receiver, args)
          var encodedValue = s._encode(value)
          locked(function() {
            call.returnValue = encodedValue
          })
          return value
        } catch (e) {
          var encodedError = s._exception(e, 'mock')
          locked(function() {
            call.error = encodedError
          })
          throw e
        }
        finally {
          locked(function() {
            call.durationMs = (nowNano() - start) / 1000000
          })
        }
      }
      Object.defineProperty(target, key, Object.assign({}, descriptor, { value: wrapped }))
      entry.context = c
      entry.handle = handle
      owners.push(entry)
      c.defer(handle.restore)
      return handle
    })
  }
  P.spy = function(target, key) {
    return this.mock(target, key, target[key])
  }
  P.assertCalled = function(target, key, count, options) {
    var s = this._assertion(),
      c = OpenWrap.test._context.get(),
      calls = locked(function() {
        var entry = owners.filter(function(x) {
          return x.target === target && x.key === key && x.context === c
        })[0]
        if (!entry) throw new Error('No mock owned by this test')
        return entry.handle.calls()
      })
    if (options && options.args) {
      s._load('assert')
      calls = calls.filter(function(call) {
        return s._compare(call.args, s._encode(options.args)).equal
      })
    }
    if (calls.length !== count) {
      s._load('assert')
      s._fail('called', calls.length, count)
    }
  }
  OpenWrap.test._modules.mock = true
})(OpenWrap.test.prototype)
