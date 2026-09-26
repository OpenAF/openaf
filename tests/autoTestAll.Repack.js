// Copyright 2026 Nuno Aguiar
var repackFile = require(getOpenAFJar() + "::js/repackFile.js");

exports.testOpenJar = function() {
  if (ow.loadFormat().isWindows()) return; // Windows uses the detached updater.
  plugin("ZIP");
  var dir = String(java.nio.file.Files.createTempDirectory("openaf-repack-"));
  var oldJar, newJar;
  try {
    var target = dir + "/openaf.jar", candidate = target + ".tmp", link = dir + "/linked.jar";
    var zip = new ZIP();
    zip.putFile("late-resource", af.fromString2Bytes("original lazy-loaded resource"));
    zip.generate2File(target); zip.close();
    zip = new ZIP();
    zip.putFile("late-resource", af.fromString2Bytes("replacement"));
    zip.generate2File(candidate); zip.close();
    var files = java.nio.file.Files, path = new java.io.File(target).toPath();
    var permissions = java.nio.file.attribute.PosixFilePermissions.fromString("rwxr-x---");
    files.setPosixFilePermissions(path, permissions);
    files.createSymbolicLink(new java.io.File(link).toPath(), path);
    oldJar = new java.util.jar.JarFile(target);
    var entry = oldJar.getJarEntry("late-resource");
    repackFile.replace(candidate, link);
    // Read only after replacement, like a class first needed during shutdown.
    var stream = oldJar.getInputStream(entry);
    try {
      ow.test.assert(String(new java.lang.String(stream.readAllBytes(), "UTF-8")),
        "original lazy-loaded resource", "An open JAR must retain its original contents.");
    } finally { stream.close(); }
    newJar = new java.util.jar.JarFile(target);
    stream = newJar.getInputStream(newJar.getJarEntry("late-resource"));
    try {
      ow.test.assert(String(new java.lang.String(stream.readAllBytes(), "UTF-8")),
        "replacement", "New readers must see the replacement.");
    } finally { stream.close(); }
    ow.test.assert(files.isSymbolicLink(new java.io.File(link).toPath()), true, "Preserve installation symlinks.");
    ow.test.assert(files.getPosixFilePermissions(path).equals(permissions), true, "Preserve JAR permissions.");
    ow.test.assert(io.fileExists(candidate), false, "Successful publication must consume the candidate.");
  } finally {
    if (oldJar) oldJar.close();
    if (newJar) newJar.close();
    io.rm(dir);
  }
};

exports.testFailedReplacement = function() {
  if (ow.loadFormat().isWindows()) return;
  var dir = String(java.nio.file.Files.createTempDirectory("openaf-repack-failure-"));
  try {
    var target = dir + "/openaf.jar";
    io.writeFileString(target, "original");
    var failed = false;
    try { repackFile.replace(target + ".missing", target); } catch(e) { failed = true; }
    ow.test.assert(failed, true, "Missing candidate must fail.");
    ow.test.assert(io.readFileString(target), "original", "Failed publication must preserve the original.");
  } finally { io.rm(dir); }
};
