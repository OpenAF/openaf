exports.testFramework = function() {
  ow.loadOJob();
  var root=String(new java.io.File('..').getCanonicalPath());
  var r=ow.oJob.runLanguageProcess([String(java.lang.System.getProperty('java.home'))+'/bin/java','-Dopenaf.test.worker=true','-jar',getOpenAFJar(),'-c',"try { loadLib('tests/runTestFramework.js'); exit(2); } catch(e) { printErr(e); exit(1); }"],{pwd:root,timeout:120000,maxOutputBytes:1048576});
  ow.test.assert(r.exitcode,0,'Framework regressions: '+r.stdout+' '+r.stderr);
  ow.test.assert(r.timedOut,false,'Framework regression timeout');
};
