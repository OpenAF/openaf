// These historical comparisons use the JavaScript $path backend explicitly.
__flags.ALTERNATIVES.path=false;
// Run from repository root. Temporary dependencies: /tmp/openaf-jmes-bench/*.jar
loadExternalJars('/tmp/openaf-jmes-bench');
loadCompiledLib('jmespath_js'); // Prevent $path from replacing the instrumented library.
var source = io.readFileString('js/jmespath.js');
var original;
eval(source); original = jmespath;
// Benchmark-only bounded FIFO cache; every evaluation still creates its runtime.
var patched = source.replace('  function search(data, expression, funcs) {',
  '  var cache = Object.create(null), keys = [];\n  function search(data, expression, funcs) {')
  .replace('var node = parser.parse(expression);',
    'var node = cache[expression]; if (node === undefined) { node = parser.parse(expression); cache[expression] = node; keys.push(expression); if (keys.length > 256) delete cache[keys.shift()]; }');
eval(patched); var cached = jmespath;
// Protect object/array literals from mutation by results or custom functions.
eval(patched.replace('return node.value;', 'return node.value !== null && typeof node.value === "object" ? JSON.parse(JSON.stringify(node.value)) : node.value;'));
var safeCached = jmespath;
function check(ok, message) { if (!ok) throw new Error(message); }
var literalQuery = '`{"a":[1]}`';
var x = cached.search({}, literalQuery, {}); x.a.push(2);
check(cached.search({}, literalQuery, {}).a.length === 2, 'Expected unsafe cache mutation demonstration');
x = safeCached.search({}, literalQuery, {}); x.a.push(2);
check(safeCached.search({}, literalQuery, {}).a.length === 1, 'Safe cache leaked literal mutation');
for (var e=0; e<300; e++) safeCached.search({}, '`'+e+'`', {});
check(safeCached.search({}, literalQuery, {}).a.length === 1, 'Cache eviction/reparse failed');
for (var e=0; e<2; e++) {
  var failed=false;
  try { safeCached.search({}, '[?', {}); } catch (err) { failed=true; }
  check(failed, 'Invalid expression unexpectedly accepted');
}
var fnQuery = 'custom(@)';
function custom(n) { return {custom: {_func: function() { return n; }, _signature: [{types: [safeCached.types.any]}]}}; }
check(safeCached.search({}, fnQuery, custom(1)) === 1 && safeCached.search({}, fnQuery, custom(2)) === 2, 'Stale custom function');
var fixtures = [
  {name:'lookup', size:10, query:'items[0].name', count:3000},
  {name:'filter-100', size:100, query:'items[?score >= `50`].name', count:400},
  {name:'filter-10000', size:10000, query:'items[?score >= `50`].name', count:10},
  {name:'sort-1000', size:1000, query:'sort_by(items, &score)[-10:].name', count:30}
];
var output = {java: String(java.lang.System.getProperty('java.version')), rounds:5, rows:[], checks:['literal mutation isolated', 'custom function replacement respected', 'eviction/reparse', 'invalid queries throw repeatedly', '$path outputs equal', 'JS/Java outputs equal']};
var sink;
function timed(fn, count) {
  var start = java.lang.System.nanoTime();
  for (var i=0; i<count; i++) sink = fn();
  return Number(java.lang.System.nanoTime()-start)/1e6/count;
}
function median(a) { return a.sort(function(a,b) { return a-b; })[Math.floor(a.length/2)]; }
fixtures.forEach(function(f) {
  var data = {items:[]};
  for (var i=0; i<f.size; i++) data.items.push({name:'item-'+i, score:(i*37)%100});
  var json = JSON.stringify(data), helper = new Packages.bench.JmesBench(json, f.query);
  var expected = JSON.stringify(original.search(data, f.query, {}));
  jmespath=original; check(expected === JSON.stringify($path(data,f.query)), f.name+' $path mismatch');
  jmespath=safeCached; check(expected === JSON.stringify($path(data,f.query)), f.name+' cached $path mismatch');
  check(expected === String(helper.result()), f.name+' Java mismatch');
  check(expected === JSON.stringify(safeCached.search(data,f.query,{})), f.name+' cache mismatch');
  var modes = {
    js: function() { return original.search(data,f.query,{}); },
    jsCached: function() { return safeCached.search(data,f.query,{}); },
    path: function() { jmespath=original; return $path(data,f.query); },
    pathCached: function() { jmespath=safeCached; return $path(data,f.query); },
    javaBridge: function() { return helper.search(); },
    javaConvert: function() { return JSON.parse(String(helper.convert(JSON.stringify(data)))); }
  };
  // Warm every mode, including Java-only loops, before taking samples.
  Object.keys(modes).forEach(function(k) { timed(modes[k],f.count); });
  helper.run(f.count*5,f.query,false); helper.run(f.count,f.query,true);
  var samples = {};
  Object.keys(modes).concat(['javaCached','javaCompile']).forEach(function(k) { samples[k]=[]; });
  for (var r=0;r<5;r++) {
    var order=Object.keys(modes); if(r%2) order.reverse();
    order.forEach(function(k) { samples[k].push(timed(modes[k],f.count)); });
    samples.javaCached.push(Number(helper.run(f.count*5,f.query,false)));
    samples.javaCompile.push(Number(helper.run(f.count,f.query,true)));
  }
  var medians={}; Object.keys(samples).forEach(function(k) { medians[k]=median(samples[k].slice()); });
  output.rows.push({name:f.name,size:f.size,count:f.count,msPerOperation:medians,samples:samples});
  print(f.name+' '+JSON.stringify(medians));
});
io.writeFileString('/tmp/openaf-jmes-bench/results.json',JSON.stringify(output,null,2));
