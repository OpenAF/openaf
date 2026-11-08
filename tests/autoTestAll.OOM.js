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
