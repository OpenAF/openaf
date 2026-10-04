// Deterministic protocol tests plus real-runtime checks with explicit prerequisite skips.
(function() {
  var snippets = {
    node: 'console.log("node log"); args.ok = true;',
    ruby: 'puts "ruby log"\nargs["ok"] = true',
    perl: 'print "perl log\\n"; $args->{ok} = JSON::PP::true;',
    go: 'fmt.Println("go log"); args["ok"] = true',
    swift: 'print("swift log")\nargs["ok"] = true',
    powershell: 'Write-Output "powershell log"\n$_args | Add-Member -NotePropertyName ok -NotePropertyValue $true -Force',
    java: 'System.out.println("java log"); args.put("ok", true);'
  };
  function failure(fn, text) {
    var error;
    try { fn(); } catch (e) { error = String(e); }
    ow.test.assert(isString(error) && error.indexOf(text) >= 0, true, "Expected failure: " + text + "; got " + error);
  }
  function nodeAvailable() {
    try { return ow.oJob.runLanguageProcess(["node", "--version"], {timeout:5000}).exitcode == 0; } catch(e) { return false; }
  }
  exports.testLanguageRoundTrips = function() {
    ow.loadOJob();
    var required = String(getEnv("OJOB_TEST_REQUIRED_LANGS") || "").split(",");
    var probes = ow.oJob.getLanguages(true);
    required.filter(lang => lang.length > 0 && lang != "undefined").forEach(lang => {
      var entry = probes.filter(p => p.lang == lang)[0];
      ow.test.assert(isDef(entry) && entry.available === true, true, "Required runtime unavailable: " + lang);
    });
    Object.keys(snippets).forEach(lang => {
      var probe = probes.filter(p => p.lang == lang)[0];
      if (!probe.available) {
        ow.test.assert(required.indexOf(lang) < 0, true, "Required runtime missing: " + lang + " " + probe.diagnostic);
        print("SKIP language " + lang + ": " + probe.diagnostic);
        return;
      }
      var input = { text: "quote'\" backtick` slash\\ line\n雪 café {{literal}}", nested: { values: [null, true, false, 12, "x"] }, large: "z".repeat(180000) };
      var result = ow.oJob.__runLanguage(lang, snippets[lang], clone(input), { noTemplate: true, langTimeout: 90000 }, "round trip " + lang);
      ow.test.assert(result.ok, true, lang + " mutation");
      delete result.ok;
      ow.test.assert(compare(result, merge(clone(input), clone(input))), true, lang + " JSON round trip preserves existing merge semantics");
    });
  };
  exports.testLanguageFailuresAndCleanup = function() {
    ow.loadOJob();
    if (!nodeAvailable()) { print("SKIP language failure tests: node unavailable"); return; }
    var dir = io.createTempDir("ojob-test-");
    var marker = dir + "/path.json";
    var capture = "require('fs').writeFileSync(" + stringify(marker) + ", JSON.stringify(process.env.OJOB_ARGS_FILE));";
    var input = { untouched: { x: 1 } };
    try {
      failure(() => ow.oJob.__runLanguage("node", capture + "args.untouched.x=2; process.exit(7);", input, {noTemplate:true}, "failed"), "exit status 7");
      ow.test.assert(input.untouched.x, 1, "Failed jobs must not merge args");
      ow.test.assert(io.fileExists(JSON.parse(io.readFileString(marker))), false, "Failure removes input file");
      failure(() => ow.oJob.__runLanguage("node", "process.exit(0)", {}, {}, "missing"), "Missing JSON result");
      failure(() => ow.oJob.__runLanguage("node", "args=[]", {}, {}, "invalid"), "JSON object");
      failure(() => ow.oJob.__runLanguage("node", "process.on('exit',()=>require('fs').writeFileSync(process.env.OJOB_RESULT_FILE,'bad JSON'))", {}, {}, "malformed"), "Invalid JSON result");
      failure(() => ow.oJob.__runLanguage("node", "", {}, {langExecutable:"ojob-nonexistent-runtime-123"}, "missing runtime"), "execute");
      failure(() => ow.oJob.__runLanguage("node", "", {}, {langTimeout:0}, "bad timeout"), "positive");
      failure(() => ow.oJob.__runLanguage("node", capture + "while(true){}", {}, {noTemplate:true,langTimeout:500}, "timeout"), "timed out");
      ow.test.assert(io.fileExists(JSON.parse(io.readFileString(marker))), false, "Timeout removes input file");
      var r = ow.oJob.runLanguageProcess(["node", "-e", "process.stdout.write('a'.repeat(200000));process.stderr.write('b'.repeat(200000));"], {timeout:10000});
      ow.test.assert([r.exitcode,r.stdout.length,r.stderr.length,r.timedOut], [0,200000,200000,false], "Concurrent pipe draining");
      var spaced = dir + "/working directory";
      io.mkdir(spaced);
      var cwd = ow.oJob.__runLanguage("node", "args.cwd=process.cwd()", {}, {pwd:spaced}, "cwd");
      ow.test.assert(cwd.cwd.replace(/\\/g,"/"), String(new java.io.File(spaced).getCanonicalPath()).replace(/\\/g,"/"), "Working directory with spaces");
      var templated = ow.oJob.__runLanguage("node", 'args.out="{{value}}"', {value:"rendered"}, {}, "template");
      ow.test.assert(templated.out,"rendered","Legacy template default");
    } finally { io.rm(dir); }
  };
  exports.testLanguageProcessTree = function() {
    ow.loadOJob();
    if (!nodeAvailable()) { print("SKIP process tree: node unavailable"); return; }
    var code = "const c=require('child_process').spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'}); console.log(c.pid); setInterval(()=>{},1000);";
    var r = ow.oJob.runLanguageProcess(["node", "-e", code], {timeout:1000});
    ow.test.assert(r.timedOut,true,"Process tree timed out");
    var pid=Number(r.stdout.trim());
    ow.test.assert(pid>0,true,"Child PID captured");
    var child=java.lang.ProcessHandle.of(pid);
    try {
      if (!r.descendantTracking) { print("SKIP descendant termination: OS denied process enumeration"); return; }
      for(var i=0;i<50 && child.isPresent() && child.get().isAlive();i++) sleep(20,true);
      ow.test.assert(child.isPresent() && child.get().isAlive(),false,"Tracked child terminated");
    } finally { if (child.isPresent() && child.get().isAlive()) child.get().destroyForcibly(); }
  };
  exports.testLanguageConfiguration = function() {
    ow.loadOJob();
    if (!nodeAvailable()) { print("SKIP configuration: node unavailable"); return; }
    var executable=ow.oJob.runLanguageProcess(["node","-p","process.execPath"],{timeout:5000}).stdout.trim();
    var value=ow.oJob.__runLanguage("node","args.selected=process.execArgv.indexOf('--no-warnings')>=0",{}, {langExecutable:executable,langExecutableArgs:["--no-warnings"]},"explicit runtime");
    ow.test.assert(value.selected,true,"Executable and runtime argv selection");
    var old=ow.oJob.__langs.protocolTest;
    try {
      var descriptor=clone(ow.oJob.__langs.node);
      descriptor.lang="protocolTest";
      ow.oJob.load([],[],{langs:[descriptor]});
      var result=ow.oJob.__runLanguage("protocolTest","args.custom=true",{}, {noTemplate:true},"custom protocol");
      ow.test.assert(result.custom,true,"Custom protocol adapter");
    } finally { if(isDef(old)) ow.oJob.__langs.protocolTest=old; else delete ow.oJob.__langs.protocolTest; }
    var dir=io.createTempDir("ojob-java-test-");
    try {
      var source=dir+"/LanguageFixture.java";
      io.writeFileString(source,'package fixture; public class LanguageFixture { public static String value() { return "classpath"; } }');
      var compiler=String(java.lang.System.getProperty("java.home"))+"/bin/javac";
      if(!io.fileExists(compiler) && !io.fileExists(compiler+".exe")) { print("SKIP Java classpath fixture: javac unavailable"); return; }
      var compiled=ow.oJob.runLanguageProcess([compiler,"-d",dir,source],{timeout:15000});
      ow.test.assert(compiled.exitcode,0,"Compile Java classpath fixture: "+compiled.stderr);
      var javaResult=ow.oJob.__runLanguage("java",'args.put("import", LanguageFixture.value()); args.put("literal", "{{unchanged}}");',{}, {langTimeout:15000,langArgs:{javaImports:["fixture.LanguageFixture"],javaClasspath:[dir]}},"Java imports");
      ow.test.assert([javaResult.import,javaResult.literal],["classpath","{{unchanged}}"],"Java imports, classpath and literal default");
      if (io.fileExists(getOpenAFJar()+".orig")) {
        var dependency=ow.oJob.__languageJavaDependency;
        try {
          ow.oJob.__languageJavaDependency=function(directory) { return dependency.call(this,directory,getOpenAFJar()+".orig"); };
          var nested=ow.oJob.__runLanguage("java",'args.put("nested", true);',{}, {langTimeout:15000},"nested Gson");
          ow.test.assert(nested.nested,true,"Java JSON dependency from unrepacked distribution");
        } finally { ow.oJob.__languageJavaDependency=dependency; }
      } else print("SKIP unrepacked dependency: openaf.jar.orig unavailable");
    } finally { io.rm(dir); }
  };
  exports.testLanguageRegistration = function() {
    ow.loadOJob();
    var old = ow.oJob.__langs.customTest;
    try {
      ow.oJob.load([], [], {langs:[{lang:"customTest",langFn:"args.custom=true;"}]});
      ow.test.assert(ow.oJob.__langs.customTest.langFn,"args.custom=true;","Legacy adapter registration");
      failure(() => ow.oJob.load([{name:"unsupported Python process option",lang:"python",typeArgs:{langTimeout:5},exec:"pass"}],[],{}), "does not support local process options");
      ow.test.assert(ow.oJob.getLanguages().filter(p=>p.lang=="java")[0].options.indexOf("langTimeout")>=0,true,"Java capability");
      ow.test.assert(ow.oJob.getLanguages().filter(p=>p.lang=="python")[0].options.length,0,"Python does not advertise unsupported process options");
    } finally {
      if (isDef(old)) ow.oJob.__langs.customTest=old; else delete ow.oJob.__langs.customTest;
    }
  };
  exports.testLanguageOJobIntegration = function() {
    ow.loadOJob();
    if (!nodeAvailable()) { print("SKIP language integration: node unavailable"); return; }
    var python = ow.oJob.getLanguages(true).filter(p => p.lang == "python")[0].available;
    var definition = {ojob:{logToConsole:false,shareArgs:true},todo:["foreign","finish"], jobs:[
      {name:"before",exec:"args.before=true;"},
      {name:"after",exec:"args.after=true;"},
      {name:"foreign",lang:"node",from:["before"],to:["after"],exec:"args.foreign=args.before;"},
      {name:"finish",exec:"print('OJOB_TEST_RESULT='+stringify(args,__,''));"}
    ]};
    if (python) { definition.jobs.push({name:"python",lang:"python",exec:"args['python'] = True"}); definition.todo.splice(1,0,"python"); }
    var dir = io.createTempDir("ojob-integration-");
    try {
      var file = dir + "/job.json";
      var source=dir+"/job source.js";
      io.writeFileString(source, definition.jobs[2].exec);
      definition.jobs[2].file=source;
      delete definition.jobs[2].exec;
      io.writeFileJSON(file, definition);
      var javaExe = String(java.lang.System.getProperty("java.home")) + "/bin/java";
      var result = ow.oJob.runLanguageProcess([javaExe,"-jar",getOpenAFJar(),"--ojob","-e",file], {timeout:30000});
      ow.test.assert(result.exitcode,0,"oJob subprocess exit: " + result.stderr);
      var line = result.stdout.split(/\r?\n/).filter(l=>l.indexOf("OJOB_TEST_RESULT=")==0)[0];
      ow.test.assert(isString(line),true,"oJob result marker: " + result.stdout + result.stderr);
      var args = JSON.parse(line.substring("OJOB_TEST_RESULT=".length));
      ow.test.assert([args.before,args.foreign,args.after],[true,true,true],"from/to and foreign args propagation");
      if (python) ow.test.assert(args.python,true,"Python oJob bridge");
      definition.ojob.langs=[{lang:"node",langFn:"args.foreign=args.before;args.override=true;"}];
      io.writeFileJSON(file,definition);
      var legacy=ow.oJob.runLanguageProcess([javaExe,"-jar",getOpenAFJar(),"--ojob","-e",file],{timeout:30000});
      var legacyLine=legacy.stdout.split(/\r?\n/).filter(l=>l.indexOf("OJOB_TEST_RESULT=")==0)[0];
      ow.test.assert(legacy.exitcode,0,"Legacy override process exit");
      ow.test.assert(isString(legacyLine),true,"Legacy override result marker");
      ow.test.assert(JSON.parse(legacyLine.substring("OJOB_TEST_RESULT=".length)).override,true,"Legacy custom adapter overrides a built-in name");
    } finally { io.rm(dir); }
  };
})();
