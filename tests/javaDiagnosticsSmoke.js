ow.loadJava()
load('js/owrap.java.js')
Object.keys(OpenWrap.java.prototype).forEach(k => ow.java[k] = OpenWrap.java.prototype[k])
var file=io.createTempFile('java-jfr-test-', '.jfr'), recording=new Packages.jdk.jfr.Recording()
try {
 recording.enable('jdk.ThreadSleep').withThreshold(java.time.Duration.ZERO)
 recording.start()
 sleep(20,true)
 sleep(20,true)
 recording.stop()
 recording.dump(java.nio.file.Paths.get(file))
 var count=0
 ow.java.parseJFR(file,e=>{count++; return false},false,{events:['jdk.ThreadSleep'],maxEvents:1})
 if(count!==1) throw 'Expected exactly one selected event, got '+count
 print('JFR event filter, maxEvents and cancellation passed')
} finally { recording.close(); io.rm(file) }

var snapshot = ow.java.collectOOM("self")
if (!snapshot.sections.memory.data.heap) throw new Error("Missing self heap")
var result = ow.java.diagnosticResult("self", "VM.version")
if (result.status !== "ok") throw new Error(stringify(result))
var response = ow.java.__diagWorker(String(getPid()), "VM.version", {timeoutMs:10000,maxOutputBytes:100000})
if (String(response).indexOf("VM") < 0) throw new Error("Unexpected worker response")
var timedOut = false
try { ow.java.__diagWorker(String(getPid()), "VM.version", {timeoutMs:1,maxOutputBytes:100000}) }
catch(e) { timedOut = String(e).indexOf("deadline") >= 0 }
if (!timedOut) throw new Error("Worker deadline not enforced")
print("Self snapshot, diagnostic result, worker attach and deadline passed")
