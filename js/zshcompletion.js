var homeDir = __gHDir()
__bfprintFlag = false

switch(expr) {
case "oaf"   :
    var shell1 = io.readFileString(getOpenAFJar() + "::complete/completion_zsh.hbs").replace(/{{tool}}/g, "oaf").replace(/{{home}}/g, homeDir)
    var shell2 = io.readFileString(getOpenAFJar() + "::complete/completion_oaf.sh")
    io.writeFileString(homeDir + "/.openaf_completion_oaf.sh", shell2)
    print(shell1)
    break
/*case "ojob"  :
    var shell1 = io.readFileString(getOpenAFJar() + "::complete/completion_zsh.hbs").replace(/{{tool}}/g, "ojob")
    break*/
case "oafp"  :
    var shell1 = io.readFileString(getOpenAFJar() + "::complete/completion_zsh.hbs").replace(/{{tool}}/g, "oafp").replace(/{{home}}/g, homeDir)
    var shell2 = io.readFileString(getOpenAFJar() + "::complete/completion_oafp.sh")
    io.writeFileString(homeDir + "/.openaf_completion_oafp.sh", shell2)
    print(shell1)
    break
/*case "opack" :
    var shell1 = io.readFileString(getOpenAFJar() + "::complete/completion_zsh.hbs").replace(/{{tool}}/g, "opack")
    break*/
default: 
    logErr("Unknown completion target: " + expr)
}

exit(0, true)