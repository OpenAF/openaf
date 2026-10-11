(function() {
  // OpenAF compare() treats an undefined-valued property as missing. Check these
  // results recursively so optional captures are verified as actual undefined values.
  function equal(actual, expected, message) {
    if (Array.isArray(expected)) {
      ow.test.assert(Array.isArray(actual), true, message + ' array');
      ow.test.assert(actual.length, expected.length, message + ' length');
      expected.forEach((v, i) => {
        ow.test.assert(Object.prototype.hasOwnProperty.call(actual, i), true, message + ' own index ' + i);
        equal(actual[i], v, message + '[' + i + ']');
      });
    } else if (isMap(expected)) {
      ow.test.assert(Object.keys(actual).sort(), Object.keys(expected).sort(), message + ' keys');
      Object.keys(expected).forEach(k => equal(actual[k], expected[k], message + '.' + k));
    } else ow.test.assert(actual, expected, message);
  }
  function fails(fn, name) {
    var caught;
    try { fn(); } catch (e) { caught = e; }
    equal(isDef(caught), true, 'Expected ' + name);
    equal(String(caught.name), name, 'Error type');
  }
  exports.testJoniMatching = function() {
    var re = joniRegExp('(?<name>[A-Za-z]+)-([0-9]+)');
    equal(re.match('item-42'), {text:'item-42', index:0, end:7, captures:['item','42'], groups:{name:'item'}}, 'Structured captures');
    equal(re.test('item-42'), true, 'Test');
    equal(re.test('nothing'), false, 'No test match');
    equal(re.match('nothing'), null, 'No first match');
    equal(re.matchAll('nothing'), [], 'No matches');
    equal(re.matchAll('item-42 other-7').map(m => m.index), [0,8], 'All offsets');
    equal(re.match('item-42').index, 0, 'Reusable pattern has no lastIndex');
    equal(joniRegExp('foo\\Kbar').match('foobar').text, 'bar', 'Keep construct');
    equal(joniRegExp('(?<pair>a\\g<pair>?b)').match('aabb').text, 'aabb', 'Recursive subexpression');
    equal(joniRegExp('(?<n>a)|(?<n>b)').match('b').groups.n, 'b', 'Duplicate names');
    equal(joniRegExp('(?<n>a)?(b)').match('b').captures, [undefined,'b'], 'Optional capture');
    var groups = joniRegExp('(?<__proto__>a)').match('a').groups;
    equal(Object.prototype.hasOwnProperty.call(groups, '__proto__'), true, 'Own group property');
    equal(groups.__proto__, 'a', 'Group value');
    equal(joniRegExp('é', {ignoreCase:true}).test('É'), true, 'Unicode ignoreCase');
    equal(joniRegExp('a.b').test('a\nb'), false, 'Default dot');
    equal(joniRegExp('a.b', {dotAll:true}).test('a\nb'), true, 'dotAll');
    equal(joniRegExp('a # comment\n b', {extended:true}).test('ab'), true, 'Extended');
    equal(joniRegExp('^b$').test('a\nb\nc'), true, 'Ruby line anchors');
    equal($from([{s:'item-42'},{s:'no'}]).where(row => re.test(row.s)).select().length, 1, 'Predicate integration');
  };
  exports.testJoniUnicode = function() {
    var input = 'é😀e\u0301中文';
    equal(joniRegExp('(?<n>中)').match(input), {text:'中', index:5, end:6, captures:['中'], groups:{n:'中'}}, 'UTF-16 positions');
    equal(joniRegExp('').matchAll('😀é').map(m => m.index), [0,2,3], 'Empty matches advance by code point');
    equal(joniRegExp('').matchAll('').length, 1, 'Empty input empty match');
    equal(joniRegExp('a|$').matchAll('a').map(m => m.index), [0,1], 'Trailing empty match');
    equal(joniRegExp('\\X').matchAll('e\u0301😀').map(m => m.text), ['e\u0301','😀'], 'Graphemes');
    equal(joniRegExp('').replaceAll('😀é', '|'), '|😀|é|', 'Empty replacements preserve code points');
  };
  exports.testJoniReplacement = function() {
    var re = joniRegExp('(?<name>[A-Za-z]+)-([0-9]+)');
    equal(re.replace('item-42 other-7', '$<name>'), 'item other-7', 'First replacement');
    equal(re.replaceAll('item-42 other-7', '$2'), '42 7', 'All replacement');
    var template = "$$:$&:$1:$2:$01:$12:$99:$0:$<name>:$<missing>:$`:$'";
    var source = 'x item-42 y';
    equal(re.replace(source, template), source.replace(/(?<name>[A-Za-z]+)-([0-9]+)/, template), 'Dollar replacement tokens');
    equal(joniRegExp('(a)?b').replace('b', '$1/$<x>'), '/$<x>', 'Unmatched and absent names');
    var calls = [];
    equal(re.replaceAll('item-42 other-7', function() {
      var args = Array.prototype.slice.call(arguments);
      calls.push(args);
      equal(re.test('x-1'), true, 'Reentrant callback');
      return args[2];
    }), '42 7', 'Callback result');
    equal(calls[1], ['other-7','other','7',8,'item-42 other-7',{name:'other'}], 'Callback arguments');
    equal(joniRegExp('a').replace('a', function() { equal(arguments.length, 3, 'No groups argument'); return 12; }), '12', 'Callback coercion');
    var marker = new Error('callback');
    try { re.replace('x-1', function() { throw marker; }); } catch (e) { equal(e === marker, true, 'Callback error identity'); return; }
    throw new Error('Callback did not throw');
  };
  exports.testJoniSplit = function() {
    [
      ['', '😀é', ''], ['', '', ''], ['x', '', 'x'], [',', 'a,b,', ','],
      ['(,)', 'a,b,c', '(,)'], ['(a)?b', 'xbx', '(a)?b'], ['(?=b)', 'abb', '(?=b)'],
      ['a*', 'baac', 'a*'], ['$', 'abc', '$'], ['^', 'abc', '^']
    ].forEach(c => {
      [undefined,0,1,2,3,100,-1,4294967296,2.9,NaN].forEach(limit => {
        equal(joniRegExp(c[0]).split(c[1], limit), c[1].split(new RegExp(c[2], 'u'), limit), 'Split ' + c[0] + ' limit ' + limit);
      });
    });
  };
  exports.testJoniErrors = function() {
    [undefined,null,1,/a/,{},[]].forEach(p => fails(() => joniRegExp(p), 'TypeError'));
    [null,1,[],{ignoreCase:1},{dotAll:'yes'},{extended:null}].forEach(o => fails(() => joniRegExp('a', o), 'TypeError'));
    fails(() => joniRegExp('('), 'SyntaxError');
    fails(() => joniRegExp('\ud800'), 'TypeError');
    var re = joniRegExp('a');
    ['test','match','matchAll','split'].forEach(method => {
      [undefined,null,1,{},'\udc00','a\ud800'].forEach(input => fails(() => re[method](input), 'TypeError'));
    });
    fails(() => re.replace('a', 1), 'TypeError');
    fails(() => re.replaceAll('\ud800', 'x'), 'TypeError');
  };
  exports.testJoniParallel = function() {
    plugin('Threads');
    var re = joniRegExp('(?<name>[a-z]+)-([0-9]+)');
    var workers = new Threads();
    var ready = new java.util.concurrent.CountDownLatch(8);
    var done = new java.util.concurrent.CountDownLatch(8);
    var errors = new java.util.concurrent.ConcurrentLinkedQueue();
    for (var i = 0; i < 8; i++) (function(id) {
      workers.addThread(function() {
        try {
          ready.countDown();
          if (!ready.await(10, java.util.concurrent.TimeUnit.SECONDS)) throw new Error('Concurrent start timed out');
          for (var n = 0; n < 16; n++) {
            var input = 'item-' + id;
            var m = re.match(input);
            if (m.text !== input || m.captures[1] !== String(id) || re.replace(input, '$2') !== String(id))
              throw new Error('Matcher state leaked between calls');
            m.groups.name = 'changed';
            if (re.match(input).groups.name !== 'item') throw new Error('Result state leaked');
          }
        } catch (e) { errors.add(String(e)); }
        finally { done.countDown(); }
      });
    })(i);
    try {
      workers.startNoWait();
      equal(done.await(15, java.util.concurrent.TimeUnit.SECONDS), true, 'Concurrent matches finish');
      equal(Number(errors.size()), 0, 'Concurrent match failures: ' + errors.toString());
    } finally { workers.stop(); }
  };
})();
