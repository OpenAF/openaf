// Copyright 2026 Nuno Aguiar
var cds = require(getOpenAFJar() + "::js/repackCDS.js");

exports.testVMArguments = function() {
  var args = ["-Xshare:off", "-XX:SharedArchiveFile=/old archive", "-XX:ArchiveClassesAtExit=old",
    "-XX:DumpLoadedClassList=old", "-XX:SharedClassListFile=old", "-XX:+PrintSharedArchiveAndExit",
    "-Dopenaf.cds.training=false", "-XX:+UseCompactObjectHeaders", "--add-opens=java.base/java.io=ALL-UNNAMED",
    "-Duser.home=/home with spaces", "-Xmx256m"];
  var copy = args.slice();
  ow.test.assert(cds.filterVMArgs(args), args.slice(7), "Archive generation must retain non-CDS launcher options verbatim.");
  ow.test.assert(args, copy, "Filtering must not mutate the captured launcher arguments.");
};

exports.testPlatformClassList = function() {
  var text = "# class list\njava/lang/String id: 1\norg/w3c/dom/Node id: 2\n" +
    "org/mozilla/javascript/Context id: 3\nopenaf/AFBase id: 4\njava/lang/String id: 1\n" +
    "@lambda-proxy openaf/AFBase ignored\nmissing/CDSClass id: 5\n";
  ow.test.assert(cds.platformClassList(text, java.lang.ClassLoader.getPlatformClassLoader()),
    ["java/lang/String", "org/w3c/dom/Node"], "Fallback must retain only real JDK module resources, without IDs or duplicates.");
};

exports.testTrainingProfiles = function() {
  var dir = String(java.nio.file.Files.createTempDirectory("openaf-cds-profile-"));
  try {
    io.writeFileString(dir + "/.openaf_profile", "print('CDS_PROFILE_SENTINEL');");
    var cmd = [String(java.lang.System.getProperty("java.home")) + "/bin/java", "-Duser.home=" + dir];
    var script = ["-jar", getOpenAFJar(), "-c", "print('CDS_SCRIPT_SENTINEL')"];
    var normal = $sh(cmd.concat(script)).timeout(30000).get(0);
    var training = $sh(cmd.concat(["-Dopenaf.cds.training=true"], script)).timeout(30000).get(0);
    ow.test.assert(normal.exitcode, 0, "Normal startup failed.");
    ow.test.assert(training.exitcode, 0, "Training startup failed.");
    ow.test.assert(normal.stdout.indexOf("CDS_PROFILE_SENTINEL") >= 0, true, "Normal startup must keep user profiles.");
    ow.test.assert(training.stdout.indexOf("CDS_PROFILE_SENTINEL") < 0, true, "Training must not execute a user profile.");
    ow.test.assert(training.stdout.indexOf("CDS_SCRIPT_SENTINEL") >= 0, true, "Training must still execute its script.");
  } finally {
    io.rm(dir);
  }
};

exports.testFailedProbePreservesArchive = function() {
  var dir = String(java.nio.file.Files.createTempDirectory("openaf-cds-failure-"));
  try {
    io.cp(getOpenAFJar(), dir + "/openaf.jar");
    io.writeFileString(dir + "/.shared.oaf", "previous archive sentinel");
    var launcher = dir + (ow.loadFormat().isWindows() ? "/oaf.bat" : "/oaf");
    io.writeFileString(launcher, ow.format.isWindows() ? "@echo off\r\necho invalid-probe\r\n" : "#!/bin/sh\necho invalid-probe\n");
    new java.io.File(launcher).setExecutable(true);
    var script = "try { require(getOpenAFJar()+'::js/repackCDS.js').create(); exit(1); } catch(e) { print('CDS_EXPECTED_FAILURE'); }";
    var result = $sh([String(java.lang.System.getProperty("java.home")) + "/bin/java",
      "-Dopenaf.cds.training=true", "-jar", dir + "/openaf.jar", "-c", script]).timeout(30000).get(0);
    ow.test.assert(result.exitcode, 0, "Failure-preservation subprocess failed.");
    ow.test.assert(result.stdout.indexOf("CDS_EXPECTED_FAILURE") >= 0, true, "An invalid launcher probe must fail.");
    ow.test.assert(io.readFileString(dir + "/.shared.oaf"), "previous archive sentinel", "Failed preparation must preserve the existing archive.");
    ow.test.assert(io.listFiles(dir).files.filter(f => f.filename.startsWith(".openaf-cds-")).length, 0, "Failed preparation must clean its scratch directory.");
  } finally {
    io.rm(dir);
  }
};
