// Run from tests/: JQ_REFERENCE=/path/to/jq-1.6 java -jar ../openaf.jar -f jq/differential.js
var reference = getEnv('JQ_REFERENCE') || 'jq';
var version = $sh([reference, '--version']).get(0);
if (version.exitcode !== 0 || !/^jq-1\.6\s*$/.test(version.stdout)) throw new Error('Set JQ_REFERENCE to native jq 1.6; got ' + version.stdout + version.stderr);
var count = 0;
io.readFile('jq/cases.json').forEach(function(c) {
  var argv = [reference, '-c'];
  Object.keys(c.vars || {}).forEach(function(k) {argv.push('--argjson', k, JSON.stringify(c.vars[k]));});
  argv.push('[' + c.query + ']');
  var result = $sh(argv, JSON.stringify(c.input)).get(0);
  if (result.exitcode !== 0) throw new Error(c.name + ': native jq failed: ' + result.stderr);
  var expected = JSON.parse(result.stdout);
  var actual = $jq(c.input, c.query, {all:true, vars:c.vars || {}});
  if (!compare(expected, actual) || !compare(expected, c.outputs)) throw new Error(c.name + ': ' + JSON.stringify({native:expected,actual:actual,fixture:c.outputs}));
  count++;
});
print('Native ' + version.stdout.trim() + ': ' + count + ' cases match $jq and fixtures');
var removal = $sh([reference, '-c', '[.foo |= empty]'], '{"foo":1,"bar":2}').get(0);
if (removal.exitcode !== 0 || !compare(JSON.parse(removal.stdout), [{bar:2}])) throw new Error('Native removal reference changed');
var failed = false;
try {$jq({foo:1,bar:2}, '.foo |= empty');} catch(e) {failed = String(e.name) === 'JqError' && String(e.message).indexOf('`|= empty`') >= 0;}
if (!failed) throw new Error('Known |= empty difference changed; review docs and tests');
print('Known difference verified: |= empty');
