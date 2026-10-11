(function() {
  function equal(actual, expected, message) { ow.test.assert(actual, expected, message); }
  function fails(fn, name, text) {
    var caught;
    try { fn(); } catch (e) { caught = e; }
    equal(isDef(caught), true, 'Expected ' + name + ': ' + text);
    equal(String(caught.name), name, 'Error kind: ' + text);
    if (text) equal(String(caught.message).indexOf(text) >= 0, true, 'Error location/message: ' + text);
  }
  exports.testJqCorpus = function() {
    io.readFile('jq/cases.json').forEach(function(c) {
      equal($jq(c.input, c.query, {all:true, vars:c.vars || {}}), c.outputs, c.name);
    });
  };
  exports.testJqAPI = function() {
    equal($jq({a:2}), {a:2}, 'Default identity');
    equal($jq([1,2], '.[]'), [1,2], 'Multiple outputs');
    equal($jq({}, 'empty'), undefined, 'Empty stream');
    equal($jq({}, 'null'), null, 'Null output');
    equal($jq({}, 'false'), false, 'False output');
    equal($jq({}, '0'), 0, 'Zero output');
    equal($jq({}, '[]'), [], 'Single empty array');
    equal($jq({}, '[]', {all:true}), [[]], 'Single array in all mode');
    equal($jq({}, 'empty', {all:true}), [], 'Empty stream in all mode');
    equal($jq(null, '.', {all:true}), [null], 'Null input');
    equal($jq('a' + String(now()), 'type'), 'string', 'Rhino concatenated string');
    equal($jq('😀é中文', 'length'), 4, 'Unicode code point length');
    equal($jq([0,-0,1.25,Number.MAX_SAFE_INTEGER], '.'), [0,-0,1.25,Number.MAX_SAFE_INTEGER], 'Number boundary');
    var nums = $jq([Number.MAX_SAFE_INTEGER + 1,1e100,1e-100], '.');
    equal(nums, [Number.MAX_SAFE_INTEGER + 1,1e100,1e-100], 'Double precision range');
    equal($jq({}, 'nan'), null, 'Non-finite jq result uses JSON null');
    equal(1 / $jq(-0, '.'), -Infinity, 'Negative zero preserved');
    var numericKeys = {'0':1, '2147483648':2, '4294967295':3, '01':4};
    equal($jq($jq(numericKeys, '.'), '.'), numericKeys, 'Numeric keys survive repeated conversion');
    var input = {a:[1,2]}, copy = stringify(input);
    equal($jq(input, '.a[0] |= . + 5'), {a:[6,2]}, 'Update expression');
    equal(stringify(input), copy, 'Input unmodified');
    var out = $jq(input, '.'); out.a.push(3);
    equal(input, {a:[1,2]}, 'Output detached');
    var shared = {v:1};
    equal($jq({a:shared,b:shared}, '.'), {a:{v:1},b:{v:1}}, 'Repeated references are JSON values');
    var proto = $jq({}, '{"__proto__":{"polluted":true},"constructor":1,"0":"zero"}');
    equal(Object.prototype.hasOwnProperty.call(proto, '__proto__'), true, 'Own __proto__ property');
    equal(Object.getPrototypeOf(proto), Object.prototype, 'Output prototype intact');
    equal(proto.polluted, undefined, 'No inherited result fields');
    equal(proto[0], 'zero', 'Numeric object key');
    equal($jq(Object.create(null), '.'), {}, 'Null-prototype plain object');
    equal($jq({}, '$min', {vars:{min:2}}), 2, 'Variable binding');
    equal($jq({}, '$min', {vars:{min:null}}), null, 'Null binding');
    fails(function() {$jq({}, '$min');}, 'JqError', 'min');
  };
  exports.testJqErrors = function() {
    fails(function() {$jq();}, 'JqInputError', '$input');
    fails(function() {$jq({}, 1);}, 'JqInputError', 'expression');
    fails(function() {$jq({}, '.', null);}, 'JqInputError', 'options');
    fails(function() {$jq({}, '.', {all:1});}, 'JqInputError', 'options.all');
    fails(function() {$jq({}, '.', {vars:[]});}, 'JqInputError', 'options.vars');
    fails(function() {$jq({}, '.', {vars:{'$bad':1}});}, 'JqInputError', 'Invalid variable');
    [undefined, function() {}, new Date(), /x/, new Number(1), new String('x'), new Boolean(false), java.lang.System, new java.util.HashMap(), NaN, Infinity].forEach(function(v) {
      fails(function() {$jq({bad:v}, '.');}, 'JqInputError', '$input["bad"]');
    });
    fails(function() {$jq([1,,3], '.');}, 'JqInputError', '$input[1]');
    fails(function() {$jq(new Array(1000000), '.');}, 'JqInputError', '$input[0]');
    if (typeof BigInt === 'function') fails(function() {$jq(BigInt(1), '.');}, 'JqInputError', '$input');
    var cycle = {}; cycle.self = cycle;
    fails(function() {$jq(cycle, '.');}, 'JqInputError', '$input["self"]');
    fails(function() {$jq({}, '.', {vars:{bad:undefined}});}, 'JqInputError', '$vars["bad"]');
    var custom = Object.create({inherited:true}); custom.a = 1;
    fails(function() {$jq(custom, '.');}, 'JqInputError', '$input');
    fails(function() {$jq({}, '[');}, 'JqCompileError', '');
    fails(function() {$jq({}, '"unterminated');}, 'JqCompileError', '');
    fails(function() {$jq(1, '1, error("stop")');}, 'JqError', 'stop');
    fails(function() {$jq({}, 'import "missing" as m; m::foo');}, 'JqError', '');
    fails(function() {$jq({}, 'unknown_function');}, 'JqError', '');
    var deep = {}, p = deep;
    for (var i=0;i<514;i++) {p.next={}; p=p.next;}
    fails(function() {$jq(deep, '.');}, 'JqInputError', 'nesting');
  };
  exports.testJqKnownDifferences = function() {
    fails(function() {$jq({foo:1,bar:2}, '.foo |= empty');}, 'JqError', '`|= empty`');
    ['env', '$ENV', 'inputs'].forEach(function(q) {
      fails(function() {$jq({}, q);}, 'JqError', '');
    });
  };
  exports.testJqCache = function() {
    var previous = __flags.JQ_CACHE_SIZE;
    try {
      [256,2,0,256].forEach(function(size) {
        __flags.JQ_CACHE_SIZE = size;
        var q = '{"v":[]}';
        var out = $jq({}, q); out.v.push(1);
        equal($jq({}, q), {v:[]}, 'Literal isolation at cache size ' + size);
        equal($jq({}, '{v:[]} | .v += [1]'), {v:[1]}, 'Literal update first call');
        equal($jq({}, '{v:[]} | .v += [1]'), {v:[1]}, 'Literal update repeated call');
        for (var i=0;i<8;i++) equal($jq({}, String(i)), i, 'Cache churn');
        equal($jq({}, '$x', {vars:{x:1}}), 1, 'First variable');
        equal($jq({}, '$x', {vars:{x:2}}), 2, 'Fresh variable');
        equal($jq({x:3}, '.x'), 3, 'First input');
        equal($jq({x:4}, '.x'), 4, 'Fresh input');
        fails(function() {$jq({}, '[');}, 'JqCompileError', '');
      });
      equal($jq({}, '1' + ' '.repeat(17000)), 1, 'Oversized query bypass');
    } finally { __flags.JQ_CACHE_SIZE = previous; }
  };
  exports.testJqParallel = function() {
    plugin('Threads');
    var workers = new Threads();
    var ready = new java.util.concurrent.CountDownLatch(8);
    var done = new java.util.concurrent.CountDownLatch(8);
    var errors = new java.util.concurrent.ConcurrentLinkedQueue();
    for (var i=0;i<8;i++) (function(id) {
      workers.addThread(function() {
        try {
          ready.countDown();
          if (!ready.await(10, java.util.concurrent.TimeUnit.SECONDS)) throw new Error('Concurrent start timed out');
          for (var n=0;n<16;n++) {
            var out = $jq({x:id}, '{v:[], x:(.x + $n)}', {vars:{n:n}});
            out.v.push(id);
            if (out.x !== id+n || $jq({}, '{v:[]}').v.length !== 0 || !$jq('abc42', 'test("[a-z]+[0-9]+")')) {
              throw new Error('Input, variable, literal or regex isolation failed');
            }
          }
        } catch(e) {errors.add(String(e));}
        finally {done.countDown();}
      });
    })(i);
    try {
      workers.startNoWait();
      equal(done.await(15, java.util.concurrent.TimeUnit.SECONDS), true, 'Concurrent queries finish');
      equal(Number(errors.size()), 0, 'Concurrent query failures: ' + errors.toString());
    } finally {workers.stop();}
  };
})();
