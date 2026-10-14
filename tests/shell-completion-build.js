// Run from the checkout: java -jar openaf.jar -f tests/shell-completion-build.js
try {
  var config = io.readFileYAML('build.yaml');
  var job = config.jobs.filter(j => j.name == 'Prepare shell complete')[0];
  if (job.deps.indexOf('Prepare ojob saved') < 0) throw 'Missing saved-job dependency';
  global.path = io.fileInfo('.').canonicalPath;
  ow.loadFormat();
  var start = job.exec.indexOf('var completions =');
  var end = job.exec.indexOf('// Only replace', start);
  eval(job.exec.substring(start, end));
  completions.forEach(r => print(r.tool + ': generation, syntax and output passed'));
  var code = job.exec.substring(start, end).replace(/\$sh\(/g, 'fakeSh(');
  [
    { exitcode: 0, stdout: 'WARN: missing saved jobs\n', stderr: '' },
    { exitcode: 1, stdout: '#!/bin/sh\necho :2\n', stderr: 'generation failed' },
    { exitcode: 0, stdout: '#!/bin/sh\nif then\n', stderr: '' },
    { exitcode: 0, stdout: '#!/bin/sh\necho missing-directive\n', stderr: '' }
  ].forEach(fixture => {
    var fakeSh = function(cmd, input) {
      if (cmd[0] != 'sh') return { get: function() { return fixture; } };
      return $sh(cmd, input);
    };
    var rejected = false;
    try { eval(code); } catch(e) { rejected = true; }
    if (!rejected) throw 'Invalid generator output was not rejected: ' + fixture.stdout;
  });
  print('PASS: warning-only output, generator failure, invalid syntax and missing directive rejected');
} catch(e) { printErr(e); exit(1); }
