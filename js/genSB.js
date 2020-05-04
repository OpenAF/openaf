var tmpl = "#!/usr/bin/env {{openAFPath}}oaf-sb\n\nvar params = processExpr(\" \");\n// sprint(params)\n\n";

if (io.fileExists(expr)) {
    if (io.readFileString(expr).replace(/\n/g, "").trim().substring(0, 2) == "#!") 
        logWarn("Shebang entry on file '" + expr + "' detected. Ignoring request.");
    else {
        io.writeFileString(expr, templify(tmpl, {
            openAFPath: getOpenAFPath()
        }) + io.readFileString(expr));
        $sh("chmod u+x " + expr)
        .prefix("chmod")
        .get(0);
        log("Pre-appended openaf shebang instructions to file: " + expr);
        log("Use the 'params' variable to access any parameter you pass executing the script like: " + io.fileInfo(expr).canonicalPath + " abc=123 xzy=aaa");

    }
} else {
    // No file exists
    io.writeFileString(expr, templify(tmpl, {
        openAFPath: getOpenAFPath()
    }));
    $sh("chmod u+x " + expr)
    .prefix("chmod")
    .get(0);
    log("Generated openaf shebang file: " + expr);
    log("Use the 'params' variable to access any parameter you pass executing the script like: " + io.fileInfo(expr).canonicalPath + " abc=123 xzy=aaa");
}