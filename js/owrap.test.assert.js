// Copyright 2026 Nuno Aguiar
(function(P) {
  function same(a, b) {
    return a === b || typeof a === 'number' && typeof b === 'number' && isNaN(a) && isNaN(b)
  }
  function pointer(k) {
    return String(k).replace(/~/g, '~0').replace(/\//g, '~1')
  }
  P._compare = function(a, b, options) {
    options = options || {}
    var left = [],
      right = [],
      nodes = 0,
      diffs = [],
      limit = options.maxNodes || 10000,
      javaLeft = new java.util.IdentityHashMap(),
      javaRight = new java.util.IdentityHashMap()
    function diff(path, kind, x, y) {
      if (diffs.length < 10) diffs.push({
        path: path,
        kind: kind,
        actual: x,
        expected: y
      })
      return false
    }
    function walk(x, y, path) {
      if (++nodes > limit) throw new Error('Comparison node budget exceeded')
      if (same(x, y)) return true
      if (x === null || y === null || typeof x !== typeof y || x === undefined || y === undefined) return diff(path, 'value', x, y)
      if (typeof x !== 'object') return diff(path, 'value', x, y)
      var jx = (x instanceof java.lang.Object), jy = (y instanceof java.lang.Object)
      if (jx || jy) {
        if (!(jx && jy)) return diff(path, 'type', x, y)
        var cx = String(x.getClass().getName()), cy = String(y.getClass().getName())
        if (cx !== cy) return diff(path, 'javaType', x, y)
        if (javaLeft.containsKey(x) || javaRight.containsKey(y)) return javaLeft.containsKey(x) && javaRight.containsKey(y) && Number(javaLeft.get(x)) === Number(javaRight.get(y)) || diff(path, 'reference', x, y)
        var identity = javaLeft.size()
        javaLeft.put(x, identity)
        javaRight.put(y, identity)
        if (x.getClass().isArray()) {
          if (x.length !== y.length) return diff(path, 'length', x.length, y.length)
          for (var j = 0; j < x.length; j++)if (!walk(x[j], y[j], path + '/' + j)) return false
          return true
        }
        if (x instanceof java.util.List) {
          if (x.size() !== y.size()) return diff(path, 'length', x.size(), y.size())
          for (var j = 0; j < x.size(); j++)if (!walk(x.get(j), y.get(j), path + '/' + j)) return false
          return true
        }
        if (x instanceof java.util.Map) {
          if (x.size() !== y.size()) return diff(path, 'size', x.size(), y.size())
          var it = x.keySet().iterator()
          while (it.hasNext()) {
            var k = it.next()
            if (!y.containsKey(k) || !walk(x.get(k), y.get(k), path + '/' + pointer(k))) return diff(path, 'entry', x, y)
          }
          return true
        }
        if (/^(java.lang.(String|Boolean|Byte|Short|Integer|Long|Float|Double|Character)|java.math.(BigDecimal|BigInteger)|java.util.Date|java.sql.(Date|Time|Timestamp))$/.test(cx)) return x.equals(y) || diff(path, 'javaValue', x, y)
        throw new Error('Unsupported Java comparator: ' + cx)
      }
      var i = left.indexOf(x), j = right.indexOf(y)
      if (i >= 0 || j >= 0) return i >= 0 && i === j || diff(path, 'reference', x, y)
      left.push(x)
      right.push(y)
      if (x instanceof Date || y instanceof Date) return x instanceof Date && y instanceof Date && !isNaN(x.getTime()) && x.getTime() === y.getTime() || diff(path, 'date', x, y)
      if (x instanceof RegExp || y instanceof RegExp) return x instanceof RegExp && y instanceof RegExp && String(x) === String(y) || diff(path, 'regexp', x, y)
      if (x instanceof Map || y instanceof Map) {
        if (!(x instanceof Map && y instanceof Map) || x.size !== y.size) return diff(path, 'map', x, y)
        var ok = true
        x.forEach(function(v, k) {
          if (!y.has(k) || !walk(v, y.get(k), path + '/' + pointer(k))) ok = false
        })
        return ok
      }
      if (x instanceof Set || y instanceof Set) {
        if (!(x instanceof Set && y instanceof Set) || x.size !== y.size) return diff(path, 'set', x, y)
        var ok = true
        x.forEach(function(v) {
          if (!y.has(v)) ok = false
        })
        return ok || diff(path, 'membership', x, y)
      }
      if (Array.isArray(x) !== Array.isArray(y)) return diff(path, 'type', x, y)
      if (Array.isArray(x)) {
        if (x.length !== y.length) return diff(path, 'length', x.length, y.length)
      }
      else {
        var px = Object.getPrototypeOf(x), py = Object.getPrototypeOf(y)
        if (px !== null && px !== Object.prototype || py !== null && py !== Object.prototype) throw new Error('Custom objects require an explicit comparator')
      }
      var kx = Object.keys(x).sort(), ky = Object.keys(y).sort()
      if (kx.length !== ky.length) return diff(path, 'keys', kx, ky)
      for (var n = 0; n < kx.length; n++) {
        var k = kx[n]
        if (k !== ky[n]) return diff(path, 'keys', kx, ky)
        var dx = Object.getOwnPropertyDescriptor(x, k), dy = Object.getOwnPropertyDescriptor(y, k)
        if (!('value' in dx) || !('value' in dy)) {
          if (dx.get !== dy.get || dx.set !== dy.set) return diff(path + '/' + pointer(k), 'accessor', x, y)
        }
        else if (!walk(dx.value, dy.value, path + '/' + pointer(k))) return false
      }
      return true
    }
    return {
      equal: walk(a, b, ''),
      differences: diffs
    }
  }
  P._fail = function(operator, actual, expected, message, diffs) {
    var e = new Error(message || ('Assertion failed: ' + operator))
    e.name = 'AssertionError'
    e.code = 'OWTEST_ASSERTION'
    e.operator = operator
    e.actual = this._encode(actual)
    e.expected = this._encode(expected)
    e.differences = this._encode(diffs || [])
    e.path = diffs && diffs.length ? diffs[0].path : ''
    throw e
  }
  P.assertEqual = function(a, b, m) {
    this._assertion()
    if (!same(a, b)) this._fail('equal', a, b, m)
  }
  P.assertNotEqual = function(a, b, m) {
    this._assertion()
    if (same(a, b)) this._fail('notEqual', a, b, m)
  }
  P.assertDeepEqual = function(a, b, m, o) {
    this._assertion()
    var r = this._compare(a, b, o)
    if (!r.equal) this._fail('deepEqual', a, b, m, r.differences)
  }
  P.assertMatch = function(v, re, m) {
    this._assertion()
    if (!(re instanceof RegExp)) throw new Error('Expected RegExp')
    var copy = new RegExp(re.source, String(re).slice(String(re).lastIndexOf('/') + 1))
    if (typeof v !== 'string' || !copy.test(v)) this._fail('match', v, String(re), m)
  }
  P.assertContains = function(collection, item, m) {
    this._assertion()
    var s = this, ok = false
    if (typeof collection === 'string') ok = typeof item === 'string' && collection.indexOf(item) >= 0
    else if (Array.isArray(collection)) ok = collection.some(function(v) {
      return s._compare(v, item).equal
    })
    else if (collection instanceof Map || collection instanceof Set) ok = collection.has(item)
    else if ((collection instanceof java.lang.Object) && collection instanceof java.util.Map) ok = collection.containsKey(item)
    else if ((collection instanceof java.lang.Object) && collection instanceof java.util.Collection) {
      var it = collection.iterator()
      while (it.hasNext()) if (s._compare(it.next(), item).equal) {
        ok = true
        break
      }
    }
    else throw new Error('Unsupported collection')
    if (!ok) this._fail('contains', collection, item, m)
  }
  P.assertThrows = function(fn, expected, m) {
    this._assertion()
    var thrown = false, error
    try {
      fn()
    } catch (e) {
      thrown = true
      error = e
    }
    var ok = thrown, text = String(error)
    if (ok && expected !== undefined) {
      if (typeof expected === 'string') ok = text.indexOf(expected) >= 0
      else if (expected instanceof RegExp) ok = new RegExp(expected.source, String(expected).slice(String(expected).lastIndexOf('/') + 1)).test(text)
      else if (expected && typeof expected === 'object') {
        if (expected.name) ok = error && String(error.name) === expected.name
        if (ok && expected.message !== undefined) ok = expected.message instanceof RegExp ? new RegExp(expected.message.source, String(expected.message).slice(String(expected.message).lastIndexOf('/') + 1)).test(text) : text.indexOf(String(expected.message)) >= 0
        if (ok && expected.javaClass) ok = !!(error && error.javaException && String(error.javaException.getClass().getName()) === expected.javaClass)
        if (ok && expected.predicate) ok = expected.predicate(error) === true
      } else throw new Error('Unsupported exception matcher')
    }
    if (!ok) this._fail('throws', thrown ? text : '[did not throw]', expected, m)
    return error
  }
  P.assertApprox = function(a, b, t, m) {
    this._assertion()
    if (t !== undefined && typeof t !== 'number' && (t === null || typeof t !== 'object')) throw new Error('Invalid tolerance')
    var abs = typeof t === 'number' ? t : t && t.absolute !== undefined ? t.absolute : 0,
      rel = typeof t === 'object' && t && t.relative !== undefined ? t.relative : 0
    if (typeof a !== 'number' || typeof b !== 'number' || typeof abs !== 'number' || typeof rel !== 'number' || !isFinite(abs) || !isFinite(rel) || abs < 0 || rel < 0) throw new Error('Invalid approximate comparison')
    if (isNaN(a) || isNaN(b) || !(a === b || isFinite(a) && isFinite(b) && Math.abs(a - b) <= Math.max(abs, rel * Math.max(Math.abs(a), Math.abs(b))))) this._fail('approx', a, b, m)
  }
  P.assertType = function(v, type, m) {
    this._assertion()
    var actual = v === null ? 'null' : Array.isArray(v) ? 'array' : v instanceof Date ? 'date' : v instanceof RegExp ? 'regexp' : v instanceof Map ? 'map' : v instanceof Set ? 'set' : typeof v
    var ok = typeof type === 'string' ? actual === type : !!(type && type.javaClass && (v instanceof java.lang.Object) && String(v.getClass().getName()) === type.javaClass)
    if (!ok) this._fail('type', actual, type, m)
  }
  P.assertSchema = function(value, schema, m) {
    var s = this._assertion()
    ow.loadObj()
    if (!s._schema) s._locked(function() {
      if (!s._schema) s._schema = ow.obj.schemaCreate({
        useDefaults: false,
        coerceTypes: false,
        removeAdditional: false,
        allErrors: true
      })
    })
    var r = s._schema.inspect(schema, value)
    if (!r.valid) s._fail('schema', value, schema, m, r.errors.map(function(e) {
      return {
        path: e.instancePath || '',
        kind: e.keyword,
        message: e.message
      }
    }))
  }
  OpenWrap.test._modules.assert = true
})(OpenWrap.test.prototype)
