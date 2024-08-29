var homeDir = __gHDir()
__bfprintFlag = false
 
switch(expr) {
case "oaf"   :
    var shell1 = io.readFileString(getOpenAFJar() + "::complete/completion_bash.hbs").replace(/{{request}}/g, "sh {{home}}/.openaf_completion_{{tool}}.sh").replace(/{{tool}}/g, "oaf").replace(/{{home}}/g, homeDir)
    var shell2 = io.readFileString(getOpenAFJar() + "::complete/completion_oaf.sh")
    io.writeFileString(homeDir + "/.openaf_completion_oaf.sh", shell2)
    print(shell1)
    break
case "ojob"  :
    var shell1 = io.readFileString(getOpenAFJar() + "::complete/completion_bash.hbs").replace(/{{request}}/g, "sh {{home}}/.openaf_completion_{{tool}}.sh").replace(/{{tool}}/g, "ojob").replace(/{{home}}/g, homeDir)
    oJobRunFile(getOpenAFJar() + "::complete/completion.yaml", { file: getOpenAFJar() + "::complete/completion_ojob.yaml", tool: "ojob", keyout: "true" })
    io.writeFileString(homeDir + "/.openaf_completion_ojob.sh", $get("out").output)
    print(shell1)
    break
case "oafp"  :
    var shell1 = io.readFileString(getOpenAFJar() + "::complete/completion_bash.hbs").replace(/{{request}}/g, "sh {{home}}/.openaf_completion_{{tool}}.sh").replace(/{{tool}}/g, "oafp").replace(/{{home}}/g, homeDir)
    var shell2 = io.readFileString(getOpenAFJar() + "::complete/completion_oafp.sh")
    io.writeFileString(homeDir + "/.openaf_completion_oafp.sh", shell2)
    print(shell1)
    break
case "opack" :
    var shell1 = io.readFileString(getOpenAFJar() + "::complete/completion_bash.hbs").replace(/{{request}}/g, "sh {{home}}/.openaf_completion_{{tool}}.sh").replace(/{{tool}}/g, "opack").replace(/{{home}}/g, homeDir)
    var shell2 = io.readFileString(getOpenAFJar() + "::complete/completion_opack.sh")
    io.writeFileString(homeDir + "/.openaf_completion_opack.sh", shell2)
    print(shell1)
    break
default:
}

exit(0, true)