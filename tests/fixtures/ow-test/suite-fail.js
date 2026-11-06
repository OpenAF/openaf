exports.register = function(t) {
  t.test('deliberate failure', function(c) { c.assertEqual(2 + 2, 5); });
};
