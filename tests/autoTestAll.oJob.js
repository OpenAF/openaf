(function() {
    exports.testOJob = function() {
        var testOJob = {
            todo: [
                "Test"
            ],
            jobs: [
                {
                    name: "Test",
                    exec: "__pm.status = 'ok'; __pm.t = args.token;"
                }
            ]
        };
        
        var tk = genUUID();
        var tmpOJob = io.createTempFile("oJob", ".yaml").replace(/\\/g, "/");
        var tmpOAF  = io.createTempFile("oJob", ".js").replace(/\\/g, "/");
        io.writeFileString(tmpOJob, af.toYAML(testOJob));
        io.writeFileString(tmpOAF, "oJob(\"" + tmpOJob + "\", { token: \"" + tk + "\" })");

        var r = $openaf(tmpOAF);

        ow.test.assert(r.t, tk, "Problem with oJob function.");
    };
})();