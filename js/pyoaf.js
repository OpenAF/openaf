var __p = processExpr(" "), __r
var __pf = Object.keys(__p).filter(r => __p[r].length == 0)
if (__pf.length > 0 && io.fileExists(__pf[0])) {
    ow.loadPython()
    ow.python.setPython("python3")
    __r = ow.python.execStandalone("exit_code=0\n" + io.readFileString(__pf[0]), { args: __p }, ["exit_code"], true)
} else {
    throw "No python file provided of found."
}

if (typeof __r != "undefined")
    exit(__r.exit_code)
else
    exit(0)