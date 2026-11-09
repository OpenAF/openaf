exports.testOOM = function() {
  ow.loadJava()
  var result = ow.java.collectOOM("self")
  ow.test.assert(isDef(result.sections.memory.data.heap.used), true, "Self heap metrics")
  ow.test.assert(result.target, "self", "Explicit target")
  ow.test.assert(ow.java.threadDump("self").length > 0, true, "Thread dump")
  var rejected = false
  try { ow.java.collectOOM("invalid") } catch(e) { rejected = true }
  ow.test.assert(rejected, true, "Reject invalid target")
}

// Verify the packaged Java class and JavaScript graph wrappers together.
exports.testHPROFIndex = function() {
  ow.loadJava()
  var root = String(java.nio.file.Files.createTempDirectory("openaf-hprof-api-"))
  var dump = root + "/sample.hprof"
  try {
    var out = new java.io.DataOutputStream(new java.io.FileOutputStream(dump))
    try {
      out.writeBytes("JAVA PROFILE 1.0.2")
      out.writeByte(0)
      out.writeInt(8)
      out.writeLong(1)
      out.writeByte(28)
      out.writeInt(0)
      out.writeInt(39)
      out.writeByte(5)
      out.writeLong(1)
      out.writeByte(35)
      out.writeLong(1)
      out.writeInt(0)
      out.writeInt(3)
      out.writeByte(10)
      out.writeInt(1)
      out.writeInt(2)
      out.writeInt(3)
    } finally { out.close() }
    ow.test.assert(ow.java.hprofIndex(dump, root + "/index").objects, 1, "Packaged HPROF index class")
    var object = ow.java.hprofObject(root + "/index", "0x1", { arrayLimit: 2 })
    ow.test.assert(object.sample, [1, 2], "Bounded array values")
    ow.test.assert(object.truncated, true, "Array truncation exposed")
    ow.test.assert(ow.java.hprofFind(root + "/index").objects.length, 1, "Object search")
    ow.test.assert(ow.java.hprofPath(root + "/index", "0x1").found, true, "Root object path")
    ow.test.assert(ow.java.hprofReferences(root + "/index", "0x1").references, [], "No incoming references")
    var rejected = false
    try { ow.java.hprofPath(root + "/index", "0x1", { maxVisited: -1 }) } catch(e) { rejected = true }
    ow.test.assert(rejected, true, "Invalid traversal bound rejected")
  } finally { io.rm(root) }
}
