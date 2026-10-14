ow.loadTest();
var completed = $atomic(0, "long");
var failed = $atomic(0, "long");
$doA2B(
  function(send) { [1, 2, 3].forEach(function(n) { send(n); }); },
  function(n) { if (n === 2) throw "fixture failure"; completed.inc(); },
  2, 100,
  function(error, n) { failed.inc(); },
  false
);
ow.test.assert(Number(completed.get()), 2, "completed work");
ow.test.assert(Number(failed.get()), 1, "observed failure");
print("concurrency: ok");
