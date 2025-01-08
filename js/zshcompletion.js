var homeDir = __gHDir()
__bfprintFlag = false
__conStatus = false

function _r(_e) {
    switch(_e) {
    case "oaf"   :
        var shell1 = io.readFileString(getOpenAFJar() + "::complete/completion_zsh.hbs").replace(/{{request}}/g, "sh {{home}}/.openaf_completion_{{tool}}.sh").replace(/{{tool}}/g, "oaf").replace(/{{home}}/g, homeDir)
        var shell2 = io.readFileString(getOpenAFJar() + "::complete/completion_oaf.sh")
        io.writeFileString(homeDir + "/.openaf_completion_oaf.sh", shell2)
        print(shell1)
        break
    case "ojob"  :
        var shell1 = io.readFileString(getOpenAFJar() + "::complete/completion_zsh.hbs").replace(/{{request}}/g, "sh {{home}}/.openaf_completion_{{tool}}.sh").replace(/{{tool}}/g, "ojob").replace(/{{home}}/g, homeDir)
        
        var _url = "https://ojob.io/oaf/openaf_completion_ojob_zsh_" + getDistribution() + ".sh"
        if (toBoolean(getEnv("OAF_COMPLETION_OJOB_BUILD")) || isDef($rest().head(_url).error) ) {
            var fs = io.createTempFile("ojob", "")
            io.writeFileString(fs, io.readFileString(getOpenAFJar() + "::complete/completion_ojob.yaml"))
            var ojobio = $rest().get("https://ojob.io/index.json").init.l.map(r => r.replace(/^https:\/\/(.+)\.(yaml|json|yml|sh|bat)$/,"$1")).filter(r => !r.startsWith("https:"))
            var s = "\n- name: ojob.io/\n  desc: oJob.io online repository\n  opts:\n" + ojobio.map(r => "  - name: " + r).join("\n")
            io.writeFileString(fs, s, __, true)
    
            oJobRunFile(getOpenAFJar() + "::complete/completion.yaml", { file: fs, tool: "ojob", keyout: "true" })    
            io.writeFileString(homeDir + "/.openaf_completion_ojob.sh", $get("out").output)
        } else {
            var fs = io.createTempFile("ojob", "")
            $rest().get2File(fs, _url)
            io.writeFileString(homeDir + "/.openaf_completion_ojob.sh", io.readFileString(fs).replace(/\x0d/g, ""))
        }
    
        print(shell1)
        break
    case "oafp"  :
        var shell1 = io.readFileString(getOpenAFJar() + "::complete/completion_zsh.hbs").replace(/{{request}}/g, "sh {{home}}/.openaf_completion_{{tool}}.sh").replace(/{{tool}}/g, "oafp").replace(/{{home}}/g, homeDir)
        var shell2 = io.readFileString(getOpenAFJar() + "::complete/completion_oafp.sh")
        io.writeFileString(homeDir + "/.openaf_completion_oafp.sh", shell2)
        print(shell1)
        break
    case "opack" :
        var shell1 = io.readFileString(getOpenAFJar() + "::complete/completion_zsh.hbs").replace(/{{request}}/g, "sh {{home}}/.openaf_completion_{{tool}}.sh").replace(/{{tool}}/g, "opack").replace(/{{home}}/g, homeDir)
        var shell2 = io.readFileString(getOpenAFJar() + "::complete/completion_opack.sh")
        io.writeFileString(homeDir + "/.openaf_completion_opack.sh", shell2)
        print(shell1)
        break
    default: 
    }
}

if (expr == "all") {
    _r("oaf")
    _r("ojob")
    _r("oafp")
    _r("opack")
} else {
    _r(expr)
}

exit(0, true)