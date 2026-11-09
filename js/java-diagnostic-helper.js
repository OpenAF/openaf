// Explicitly installed helper for the nsenter diagnostic transport.
// The parent supplies one request via its private child environment, never shell interpolation.
ow.loadJava()
var request = jsonParse(getEnv("OPENAF_DIAGNOSTIC_REQUEST"))
try {
  print(stringify({status:"ok",text:ow.java.jcmd(request.target,request.command,request.options)}))
} catch(e) {
  print(stringify({status:"error",error:String(e)}))
}
