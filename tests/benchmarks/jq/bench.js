// End-to-end calls, with equivalent outputs checked before timing each fixture.
loadExternalJars(getEnv('JQ_BENCH_DIR') || '/tmp/openaf-jq-bench');
var fixtures = [
  {name:'lookup-small', size:10, jq:'.items[0].name', path:'items[0].name', count:500,
    from:function(input) {return $from(input.items).first().name;}},
  {name:'filter-medium', size:100, jq:'[.items[] | select(.score >= 50) | .name]', path:'items[?score >= `50`].name', count:100,
    from:function(input) {return $from(input.items).greaterEquals('score',50).select(function(x) {return x.name;});}},
  {name:'filter-large', size:10000, jq:'[.items[] | select(.score >= 50) | .name]', path:'items[?score >= `50`].name', count:5,
    from:function(input) {return $from(input.items).greaterEquals('score',50).select(function(x) {return x.name;});}},
  {name:'sort-medium', size:1000, jq:'.items | sort_by(.score) | .[-10:] | map(.name)', path:'sort_by(items,&score)[-10:].name', count:10,
    from:function(input) {return $from(input.items).sort('score').select(function(x) {return x.name;}).slice(-10);}},
  {name:'reduce-large', size:10000, jq:'reduce .items[].score as $s (0; .+$s)', path:'sum(items[].score)', count:5,
    from:function(input) {return $from(input.items).sum('score');}},
  {name:'query-churn', size:10, jq:'.items[0].name', path:'items[0].name', count:300, churn:true,
    from:function(input) {return $from(input.items).first().name;}}
];
var oldCache = __flags.JQ_CACHE_SIZE, oldPath = __flags.ALTERNATIVES.path, sink;
var report = {java:String(java.lang.System.getProperty('java.version')), architecture:String(java.lang.System.getProperty('os.arch')),
  jarSHA256:sha256(io.readFileBytes(getOpenAFJar())), rounds:5, rows:[]};
var firstStart = java.lang.System.nanoTime();
$jq({}, '.');
report.firstJqCallMs = Number(java.lang.System.nanoTime()-firstStart)/1e6;
function median(a) {return a.slice().sort(function(a,b) {return a-b;})[Math.floor(a.length/2)];}
try {
  __flags.ALTERNATIVES.path = true;
  fixtures.forEach(function(f) {
    var input = {items:[]};
    for (var i=0;i<f.size;i++) input.items.push({name:'item-'+i, score:(i*37)%100});
    var samples = {jq:[], jqUncached:[], jsonRoundTrip:[], path:[], from:[]}, cold = {}, serial = {};
    Object.keys(samples).forEach(function(m) {serial[m]=0;});
    function evaluate(mode) {
      var q = f.jq + (f.churn ? ' # query-' + (++serial[mode]) : '');
      if (mode === 'jq' || mode === 'jqUncached') {
        __flags.JQ_CACHE_SIZE = mode === 'jq' ? 256 : 0;
        return $jq(input, q, {all:true});
      }
      if (mode === 'jsonRoundTrip') return JSON.parse(String(Packages.bench.JqBench.evaluate(JSON.stringify(input), q)));
      if (mode === 'path') return [$path(input, f.path + (f.churn ? ' '.repeat(serial[mode]) : ''))];
      return [f.from(input)];
    }
    function batch(mode, count) {
      var start = java.lang.System.nanoTime();
      for (var i=0;i<count;i++) sink = evaluate(mode);
      return Number(java.lang.System.nanoTime()-start)/1e6/count;
    }
    var expected = $jq(input, f.jq, {all:true});
    Object.keys(samples).forEach(function(mode) {
      cold[mode] = batch(mode, 1);
      if (!compare(sink, expected)) throw new Error('Output mismatch: ' + f.name + '/' + mode);
      batch(mode, f.count);
    });
    for (var round=0;round<5;round++) {
      var order = Object.keys(samples); if (round % 2) order.reverse();
      order.forEach(function(mode) {samples[mode].push(batch(mode, f.count));});
    }
    var medians = {}; Object.keys(samples).forEach(function(mode) {medians[mode]=median(samples[mode]);});
    var runtime = java.lang.Runtime.getRuntime();
    var row = {name:f.name, rows:f.size, count:f.count, coldMs:cold, msPerOperation:medians, samples:samples,
      observedHeapBytes:Number(runtime.totalMemory()-runtime.freeMemory())};
    report.rows.push(row); print(JSON.stringify(row));
  });
} finally {__flags.JQ_CACHE_SIZE=oldCache; __flags.ALTERNATIVES.path=oldPath;}
io.writeFileString(getEnv('JQ_BENCH_RESULT') || '/tmp/openaf-jq-bench/results.json', JSON.stringify(report,null,2));
