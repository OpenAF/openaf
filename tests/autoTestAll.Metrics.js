(function() {
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
