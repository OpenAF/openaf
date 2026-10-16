(function() {
  exports.testOpenMetricsStrict = function() {
    ow.loadMetrics();
    var strict = (obj, help, timestamp, conv) => ow.metrics.fromObj2OpenMetrics(obj, "app", timestamp, help, conv, true);
    var text = strict({ rows: [{ host: "a", value: 1, enabled: true }, { host: "b", value: 2, enabled: false }] }, {
      app_rows_value: { help: 'Value\\unit\n"quoted"', type: "gauge" }
    });
    ow.test.assert(text.endsWith("# EOF\n"), true, "Strict output must end with EOF");
    ow.test.assert(text.split("# TYPE app_rows_value gauge").length, 2, "Metadata must occur once per family");
    ow.test.assert(text.indexOf('app_rows_value{app_id="1",host="b"} 2\n') < text.indexOf("# TYPE app_rows_enabled"), true, "Families must remain grouped");
    ow.test.assert(text.indexOf('# HELP app_rows_value Value\\\\unit\\n\\"quoted\\"\n') >= 0, true, "Help must be escaped and separated from samples");
    ow.test.assert(text.indexOf('app_rows_enabled{app_id="1",host="b"} 0\n') >= 0, true, "Boolean values must be numeric");
    var special = { label: 'line\nnext\\n" café', value: 3 };
    var parsed = ow.metrics.fromOpenMetrics2Array(strict(special));
    ow.test.assert(parsed[0].labels.label, special.label, "Strict label escaping must round trip");
    ow.test.assert(strict([1, 2]), '# TYPE app unknown\napp{app_id="0"} 1\napp{app_id="1"} 2\n# EOF\n', "Scalar arrays must emit their actual values");
    ow.test.assert(strict({}), "# EOF\n", "Empty exposition must contain EOF");
    ow.test.assert(strict({ requests_total: 5 }, { app_requests_total: { type: "counter" } }), '# TYPE app_requests counter\napp_requests_total 5\n# EOF\n', "Counter metadata must name the family without _total");
    ow.test.assert(strict({ value: 2 }, {}, 123.5).indexOf("app_value 2 123.5\n") >= 0, true, "Numeric timestamp must be seconds");
    ow.test.assert(strict({ date: "1970-01-01T00:02:03.500Z", value: 2 }, {}, "date").indexOf("app_value 2 123.5\n") >= 0, true, "Date labels must become epoch seconds");
    ow.test.assert(strict({ status: "ok" }, {}, __, { status: { ok: 1 } }).indexOf("app_status{status=\"ok\"} 1\n") >= 0, true, "Value conversion must work in strict mode");
    ow.test.assert(strict({ plus: Infinity, minus: -Infinity }).indexOf("app_plus +Inf\n") >= 0, true, "Infinity must use OpenMetrics spelling");
    ow.test.assert(strict({ value: NaN }).indexOf("app_value NaN\n") >= 0, true, "NaN must remain a sample value");
    ow.test.assert(ow.metrics.fromObj2OpenMetrics({ value: 2 }, "app"), "app_value 2\n", "Legacy formatter output must remain unchanged");
    [
      () => strict({ "a-b": 1, a_b: 2 }),
      () => strict({ "a-b": "x", a_b: "y", value: 1 }),
      () => strict({ value: 2 }, { app_value: { type: "histogram" } }),
      () => strict({ value: -1 }, { app_value: { type: "counter" } }),
      () => strict({ value: NaN }, { app_value: { type: "counter" } }),
      () => strict({ value: 2 }, {}, Infinity),
      () => strict({ value: 2, date: "bad" }, {}, "date"),
      () => strict({ label: "bad\rtext", value: 2 }),
      () => strict({ requests: 1, requests_total: 2 }, { app_requests: { type: "counter" } }),
      () => strict({ requests: 1, requests_created: 2 }, { app_requests: { type: "counter" } })
    ].forEach(fn => {
      var rejected = false;
      try { fn(); } catch(e) { rejected = /Invalid strict OpenMetrics:/.test(String(e)); }
      ow.test.assert(rejected, true, "Invalid strict exposition must fail clearly");
    });
  };

  exports.testOpenMetricsEndpoint = function() {
    ow.loadServer();
    ow.loadMetrics();
    ow.loadObj();
    var oldGetAll = ow.metrics.getAll, oldGetSome = ow.metrics.getSome;
    ow.metrics.getAll = () => ({ fixture: { value: 3, host: "café" }, other: { value: 4 } });
    ow.metrics.getSome = names => names.indexOf("fixture") >= 0 ? { fixture: { value: 3, host: "café" } } : {};
    try {
      ["nwu", "java", "nwu2"].forEach(impl => {
        var port = findRandomOpenPort();
        var hs = ow.server.httpd.start(port, "127.0.0.1", __, __, __, __, __, impl);
        try {
          ow.server.telemetry.passive(hs, "/metrics", true, "app");
          ow.server.telemetry.passive(hs, "/legacy", true, "app", __, false);
          ow.server.telemetry.passive(hs, "/healthz", false, "app");
          var base = "http://127.0.0.1:" + port;
          var client = new ow.obj.http();
          var body = client.get(base + "/metrics").response;
          var headers = client.responseHeaders();
          var contentType = Object.keys(headers).filter(key => key.toLowerCase() == "content-type").map(key => String(headers[key]))[0];
          ow.test.assert(contentType.indexOf("application/openmetrics-text") >= 0 && contentType.indexOf("version=1.0.0") >= 0 && contentType.toLowerCase().indexOf("charset=utf-8") >= 0, true, impl + ": strict content type");
          ow.test.assert(body, '# TYPE app_fixture_value unknown\napp_fixture_value{host="café"} 3\n# TYPE app_other_value unknown\napp_other_value 4\n# EOF\n', impl + ": UTF-8 strict body without scrape timestamps");
          ow.test.assert(JSON.parse((new ow.obj.http()).get(base + "/healthz").response), ow.metrics.getAll(), impl + ": default JSON response");
          ow.test.assert((new ow.obj.http()).get(base + "/legacy").response.indexOf("# EOF") < 0, true, impl + ": legacy opt out");
          // The Java backend currently includes the query in req.uri and does not populate req.params.
          if (impl != "java") {
            ow.test.assert((new ow.obj.http()).get(base + "/metrics?s=fixture").response, '# TYPE app_fixture_value unknown\napp_fixture_value{host="café"} 3\n# EOF\n', impl + ": filtered metrics");
            ow.test.assert(JSON.parse((new ow.obj.http()).get(base + "/metrics?f=json&s=fixture").response), ow.metrics.getSome(["fixture"]), impl + ": JSON override");
            ow.test.assert((new ow.obj.http()).get(base + "/healthz?f=om").response.endsWith("# EOF\n"), true, impl + ": OpenMetrics override");
            ow.test.assert((new ow.obj.http()).get(base + "/metrics?s=missing").response, "# EOF\n", impl + ": empty strict response");
          }
        } catch(e) {
          throw new Error(impl + ": " + String(e));
        } finally {
          ow.server.httpd.stop(hs);
        }
      });
    } finally {
      ow.metrics.getAll = oldGetAll;
      ow.metrics.getSome = oldGetSome;
    }
  };

  exports.testOpenMetricsLabels = function() {
    ow.loadMetrics();
    var expected = {
      comma: "a,b=c",
      quote: 'say "hello", x=y',
      braces: "a}b{c",
      empty: "",
      path: "C:\\tmp\\file",
      newline: "first\nsecond",
      literal: "first\\nsecond",
      ending: "last\\",
      unicode: "café 中文"
    };
    var labels = Object.keys(expected).map(function(key) {
      return key + '="' + expected[key].replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n") + '"';
    }).join(",");
    var line = "sample_total{" + labels + "} 12.5";
    [line, [line]].forEach(function(input) {
      var result = ow.metrics.fromOpenMetrics2Array(input);
      ow.test.assert(result.length, 1, "One sample expected");
      ow.test.assert(result[0].labels, expected, "Quoted label contents must survive parsing");
      ow.test.assert(result[0].value, 12.5, "Sample value preserved");
    });
    var special = ow.metrics.fromOpenMetrics2Array('sample{__proto__="value"} 1')[0].labels;
    ow.test.assert(Object.prototype.hasOwnProperty.call(special, "__proto__"), true, "Label must be an own property");
    ow.test.assert(special.__proto__, "value", "Special label name preserved");
  };

  exports.testOpenMetricsCompatibility = function() {
    ow.loadMetrics();
    var result = ow.metrics.fromOpenMetrics2Array('# HELP sample A sample\n\nsample_total{code="200", path="/ok"} 3 123\nsample_count 4\nempty{} 0');
    ow.test.assert(result.length, 3, "Comments and blank lines ignored");
    result = ["sample_total", "sample_count", "empty"].map(function(name) {
      return result.filter(function(sample) { return sample.metric == name; })[0];
    });
    ow.test.assert(result[0].metric, "sample_total", "Metric name preserved");
    ow.test.assert(result[0].labels, { code: "200", path: "/ok" }, "Ordinary labels preserved");
    ow.test.assert(result[0].value, 3, "Numeric conversion preserved");
    ow.test.assert(result[0].timestamp, 123, "Timestamp preserved");
    ow.test.assert(isUnDef(result[1].timestamp), true, "Absent timestamp preserved");
    ow.test.assert(result[0].prefix, "sample", "Prefix inference preserved");
    ow.test.assert(result[1].labels, {}, "Unlabeled sample");
    ow.test.assert(result[2].labels, {}, "Empty label set");
  };

  exports.testOpenMetricsInvalidLabels = function() {
    ow.loadMetrics();
    [
      'sample{a="unterminated} 1',
      'sample{a="bad "quote""} 1',
      'sample{a="bad\\q"} 1',
      'sample{a=unquoted} 1',
      'sample{a="x" b="y"} 1',
      'sample{a="x",,b="y"} 1'
    ].forEach(function(line) {
      var rejected = false;
      try { ow.metrics.fromOpenMetrics2Array(line); } catch(e) {
        rejected = /Invalid OpenMetrics (sample|labels):/.test(String(e));
      }
      ow.test.assert(rejected, true, "Malformed labels must produce a clear error: " + line);
    });
  };
})();
