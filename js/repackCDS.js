// Train and validate the archive consumed by the generated OpenAF launchers.
// Copyright 2026 Nuno Aguiar

exports.filterVMArgs = function(args) {
  return args.filter(arg => !/^(-Xshare:|-XX:(SharedArchiveFile|SharedClassListFile|DumpLoadedClassList|ArchiveClassesAtExit|AOTCache|AOTMode|AOTConfiguration)=|-XX:[+-](PrintSharedArchiveAndExit|RecordDynamicDumpInfo)|-Dopenaf\.cds\.training=)/.test(arg));
};

exports.platformClassList = function(text, loader) {
  var seen = {}, names = [];
  text.split(/\r?\n/).forEach(line => {
    if (!line || /^[#@]/.test(line)) return;
    var name = line.split(/\s+/)[0];
    if (seen[name]) return;
    var resource = loader.getResource(name + ".class");
    if (resource != null && String(resource.getProtocol()) == "jrt") {
      seen[name] = true;
      names.push(name);
    }
  });
  return names;
};

exports.create = function() {
  ow.loadFormat();
  var jar = getOpenAFJar(), archive = getOpenAFPath() + ".shared.oaf";
  var windows = ow.format.isWindows();
  var launcher = getOpenAFPath() + (windows ? "oaf.bat" : "oaf");
  var scratch = String(java.nio.file.Files.createTempDirectory(
    new java.io.File(archive).getParentFile().toPath(), ".openaf-cds-"));
  var candidate = scratch + "/archive.jsa", list = scratch + "/classes.lst";
  var marker = "__OPENAF_CDS_VM__";
  var probe = "print('" + marker + "' + JSON.stringify({ home: String(java.lang.System.getProperty('java.home')), args: af.fromJavaArray(java.lang.management.ManagementFactory.getRuntimeMXBean().getInputArguments().toArray()) }))";
  var env = { OAF_FLAGS: "{}" };
  var run = (cmd, extraEnv) => $sh(cmd).envs(merge(clone(env), extraEnv || {}), true).timeout(120000).get(0);
  var output = r => String(r.stdout || "") + "\n" + String(r.stderr || "");
  var vm, javaCmd;

  try {
    // Query the generated launcher, so compact headers, module flags and custom
    // installation arguments agree with the processes that will use the archive.
    if (io.fileExists(launcher)) {
      var probeResult = run([launcher, "-c", probe], {
        OAF_JARGS: (getEnv("OAF_JARGS") || "") + " -Dopenaf.cds.training=true"
      });
      var lines = String(probeResult.stdout || "").split(/\r?\n/).filter(l => l.startsWith(marker));
      if (probeResult.exitcode != 0 || lines.length != 1) throw "Could not read the generated launcher's JVM configuration";
      vm = jsonParse(lines[0].substring(marker.length));
    } else {
      // Build-only trees may not have generated launchers yet.
      vm = {
        home: String(java.lang.System.getProperty("java.home")),
        args: af.fromJavaArray(java.lang.management.ManagementFactory.getRuntimeMXBean().getInputArguments().toArray())
      };
    }
    javaCmd = [vm.home + "/bin/java"].concat(exports.filterVMArgs(vm.args));
    javaCmd.push("-Dopenaf.cds.training=true");
    // These options are already represented in the probed VM arguments.
    env.JAVA_TOOL_OPTIONS = "";
    env.JDK_JAVA_OPTIONS = "";
    env._JAVA_OPTIONS = "";

    var warmup = [
      "ow.loadOJob(); ow.loadMetrics(); loadLodash(); loadUnderscore();",
      "loadJSYAML(); loadHandlebars(); loadCompiledLib('jmespath_js');",
      "af.fromYAML('value: 1'); templify('{{value}}', {value: 1});",
      "$set('res', {});",
      "oJobRun({ojob:{logToConsole:false},jobs:[{name:'OpenAF CDS warmup',exec:'args.value = 1 + 1; print(\"__OPENAF_CDS_TRAINED__\")'}],todo:['OpenAF CDS warmup']}, {});"
    ].join("\n");
    var trained = run(javaCmd.concat(["-Xshare:auto", "-XX:DumpLoadedClassList=" + list, "-jar", jar, "-c", warmup]));
    var hasTraining = trained.exitcode == 0 && output(trained).indexOf("__OPENAF_CDS_TRAINED__") >= 0 && io.fileExists(list);
    if (!hasTraining) logWarn("CDS warmup did not complete; retaining default archive coverage.");
    var modes = hasTraining ? ["application", "platform", "default"] : ["default"];
    var selected, classCount = 0;

    for (var mode of modes) {
      var options = ["-Xshare:dump", "-XX:SharedArchiveFile=" + candidate];
      if (io.fileExists(candidate)) io.rm(candidate);
      if (mode == "application") options.push("-XX:SharedClassListFile=" + list);
      if (mode == "platform") {
        // A nonempty Class-Path directory prevents application-archive reuse.
        // Keep directory loading intact and still cover the JDK classes used by
        // OpenAF. Include the standard list to retain its ordinary coverage.
        var standard = vm.home + "/lib/classlist";
        var names = exports.platformClassList(io.readFileString(list) + "\n" +
          (io.fileExists(standard) ? io.readFileString(standard) : ""), java.lang.ClassLoader.getPlatformClassLoader());
        if (!names.length) continue;
        classCount = names.length;
        io.writeFileString(scratch + "/platform.lst", names.join("\n") + "\n");
        options.push("-XX:SharedClassListFile=" + scratch + "/platform.lst");
      }
      var dumped = run(javaCmd.concat(options, ["-jar", jar]));
      if (dumped.exitcode != 0 || !io.fileExists(candidate)) continue;
      // A successful dump can still produce an unusable archive. Verify using
      // the actual JAR/class path and require sharing (no silent JVM fallback).
      var checked = run(javaCmd.concat(["-Xshare:on", "-XX:SharedArchiveFile=" + candidate,
        "-XX:+PrintSharedArchiveAndExit", "-jar", jar]));
      if (checked.exitcode == 0 && /archive is valid/.test(output(checked))) {
        selected = mode;
        break;
      }
    }

    if (isUnDef(selected)) throw "No usable CDS archive was generated; the previous archive was preserved";
    // Publish only a validated file. Both paths are on the same filesystem.
    java.nio.file.Files.move(new java.io.File(candidate).toPath(), new java.io.File(archive).toPath(),
      java.nio.file.StandardCopyOption.ATOMIC_MOVE, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
    var result = { mode: selected, trained: hasTraining, platformClasses: selected == "platform" ? classCount : 0 };
    log("OpenAF shared archive validated (" + selected + " coverage" + (selected == "platform" ? ": " + classCount + " JDK classes" : "") + ").");
    return result;
  } finally {
    io.rm(scratch);
  }
};
