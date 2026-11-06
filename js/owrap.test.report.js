// Pure snapshot reporters. Copyright 2026 Nuno Aguiar
(function(P) {
  function text(v) {
    return v === undefined ? '' : String(v)
  }
  // XML 1.0 allowed characters; preserve valid UTF-16 surrogate pairs.
  function xml(v) {
    var input = text(v), clean = ''
    for (var i = 0; i < input.length; i++) {
      var code = input.charCodeAt(i)
      if (code >= 0xD800 && code <= 0xDBFF) {
        var next = input.charCodeAt(i + 1)
        if (next >= 0xDC00 && next <= 0xDFFF) {
          clean += input.charAt(i) + input.charAt(++i)
          continue
        }
        clean += '\uFFFD'
      } else if (code >= 0xDC00 && code <= 0xDFFF || code < 32 && code !== 9 && code !== 10 && code !== 13 || code === 0xFFFE || code === 0xFFFF) clean += '\uFFFD'
      else clean += input.charAt(i)
    }
    return clean.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
  }
  function cell(v) {
    return text(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\|/g, '&#124;').replace(/\r?\n/g, '<br>')
  }
  function rows(source) {
    if (source && source.tests) return source.tests.map(function(t) {
      var a = t.attempts && t.attempts.length ? t.attempts[t.attempts.length - 1] : t
      return Object.assign({}, a, {
        name: t.name,
        status: t.status,
        flaky: t.flaky,
        reason: t.reason,
        durationMs: (t.attempts || []).reduce(function(sum, r) {
          return sum + (r.durationMs || 0)
        }, 0)
      })
    })
    if (source && source.records) return source.records
    return []
  }
  function parts(r) {
    var name = r.name || 'test', i = name.lastIndexOf('::')
    return {
      suite: i < 0 ? 'Test suite' : name.slice(0, i),
      name: i < 0 ? name : name.slice(i + 2)
    }
  }
  function summary(list) {
    var r = {
      tests: list.length,
      failures: 0,
      errors: 0,
      skipped: 0,
      time: 0
    }
    list.forEach(function(t) {
      if (t.status === 'FAIL') r.failures++
      else if (['ERROR', 'TIMEOUT'].indexOf(t.status) >= 0) r.errors++
      else if (t.status !== 'PASS') r.skipped++
      r.time += (t.durationMs || t.elapsedTime || 0) / 1000
    })
    return r
  }
  function attrs(s) {
    return ' tests="' + s.tests + '" failures="' + s.failures + '" errors="' + s.errors + '" skipped="' + s.skipped + '" time="' + s.time + '"'
  }
  P.report = {
    json: function(source) {
      return JSON.stringify(source)
    },
    markdown: function(source) {
      var list = rows(source), s = summary(list)
      var out = '# Test results\n\nTests: ' + s.tests + '; passed: ' + (s.tests - s.failures - s.errors - s.skipped) + '; failed: ' + s.failures + '; errors: ' + s.errors + '; skipped: ' + s.skipped + '\n\n| Suite | Test | Status | Time (ms) | Result |\n|---|---|---|---:|---|\n'
      list.forEach(function(r) {
        var p = parts(r)
        out += '| ' + cell(p.suite) + ' | ' + cell(p.name) + ' | ' + cell(r.status + (r.flaky ? ' (flaky)' : '')) + ' | ' + (r.durationMs || r.elapsedTime || 0) + ' | ' + cell(r.exception || r.result || '') + ' |\n'
      })
      return out
    },
    junit: function(source, id, name) {
      var list = rows(source).slice(), groups = Object.create(null);
      (source.infrastructureErrors || []).forEach(function(e, i) {
        list.push({
          id: 'infrastructure-' + i,
          name: 'Framework::' + (e.phase || 'report'),
          status: 'ERROR',
          exception: e.message
        })
      })
      list.forEach(function(r) {
        var p = parts(r)
        if (!groups[p.suite]) groups[p.suite] = []
        groups[p.suite].push(r)
      })
      var out = '<testsuites id="' + xml(id || 'tests') + '" name="' + xml(name || 'OpenAF tests') + '"' + attrs(summary(list)) + '>'
      Object.keys(groups).sort().forEach(function(k) {
        var rs = groups[k],
          starts = rs.filter(function(r) {
            return typeof r.start === 'number'
          }).map(function(r) {
            return r.start
          })
        out += '<testsuite name="' + xml(k) + '"' + attrs(summary(rs)) + (starts.length ? ' timestamp="' + xml(new Date(Math.min.apply(Math, starts)).toISOString()) + '"' : '') + '>'
        rs.forEach(function(r, i) {
          out += '<testcase id="' + xml(r.id || k + ':' + i) + '" classname="' + xml(k) + '" name="' + xml(parts(r).name) + '" time="' + ((r.durationMs || r.elapsedTime || 0) / 1000) + '">'
          var msg = r.exception || r.reason || '',
            stack = (r.errors || []).map(function(e) {
              return e.stack || e.message
            }).join('\n')
          if (r.status === 'FAIL') out += '<failure message="' + xml(msg) + '" type="AssertionError">' + xml(stack || msg) + '</failure>'
          else if (['ERROR', 'TIMEOUT'].indexOf(r.status) >= 0) out += '<error message="' + xml(msg) + '" type="' + xml(r.status) + '">' + xml(stack || msg) + '</error>'
          else if (r.status !== 'PASS') out += '<skipped message="' + xml(msg || r.status) + '"/>'
          if (r.flaky) out += '<system-out>Passed after retry; see JSON for all attempts.</system-out>'
          out += '</testcase>'
        })
        out += '</testsuite>'
      })
      return out + '</testsuites>'
    }
  }

  /**
   * <odoc format="markdown">
   * <key>ow.test.toMarkdown() : String</key>
   * <![CDATA[
   * Returns a Markdown summary and per-test result table for all recorded executions in this session.
   *
   * For a specific suite run or snapshot, use `ow.test.report.markdown(result)`.
   * ]]>
   * </odoc>
   */
  P.toMarkdown = function() {
    return P.report.markdown(this.getResults())
  }

  /**
   * <odoc format="markdown">
   * <key>ow.test.toJUnitXML(testSuitesId, testSuitesName) : String</key>
   * <![CDATA[
   * Returns JUnit XML for all recorded executions, using `testSuitesId` and `testSuitesName` as identifiers.
   *
   * Durations are expressed in seconds; text and attributes are XML-escaped. For one logical testcase per suite test, including retry attempts, use `ow.test.report.junit(run, testSuitesId, testSuitesName)`.
   * ]]>
   * </odoc>
   */
  P.toJUnitXML = function(id, name) {
    return P.report.junit(this.getResults(), id, name)
  }
  OpenWrap.test._modules.report = true
})(OpenWrap.test.prototype)
