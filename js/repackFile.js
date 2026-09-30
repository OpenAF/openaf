// Publish a repacked JAR without truncating the file used by the running JVM.
// Copyright 2026 Nuno Aguiar

exports.replace = function(candidate, destination) {
  var files = java.nio.file.Files;
  var source = new java.io.File(candidate).toPath();
  // Follow an installation symlink, retaining the link itself.
  var target = new java.io.File(destination).toPath().toRealPath();
  files.setPosixFilePermissions(source, files.getPosixFilePermissions(target));
  // Both files must be on the same filesystem. Fail safely rather than falling
  // back to overwriting an inode from which the JVM may still load classes.
  files.move(source, target, java.nio.file.StandardCopyOption.ATOMIC_MOVE,
    java.nio.file.StandardCopyOption.REPLACE_EXISTING);
};
