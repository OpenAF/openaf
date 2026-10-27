// Copyright 2026 Nuno Aguiar

(function() {
    exports.testUnsupportedStrictSignaturePolicy = function() {
        var base = String(java.nio.file.Files.createTempDirectory("openaf-signature-policy-"))
        var script = base + "/marker.js"
        var marker = base + "/marker.txt"
        var module = base + "/module.js"
        var result = base + "/result.json"
        var javaBin = ow.format.getJavaHome() + "/bin/java"
        var jar = getOpenAFJar()
        io.writeFileString(script, "io.writeFileString(" + stringify(marker) + ", 'executed');")
        io.writeFileString(module, "global.__signaturePolicyMarker = (global.__signaturePolicyMarker || 0) + 1; module.exports = global.__signaturePolicyMarker;")

        function run(env, args) {
            return $sh().envs(merge({ OAF_SIGNATURE_STRICT: "false", OAF_VALIDATION_STRICT: "false" }, env), true).sh([javaBin, "-jar", jar].concat(args)).get(0)
        }

        try {
            var strict = run({ OAF_SIGNATURE_STRICT: " true " }, ["-f", script])
            ow.test.assert(io.fileExists(marker), false, "Environment-rejected source must not execute.")
            ow.test.assert((String(strict.stdout) + String(strict.stderr)).indexOf("signature format is defined") >= 0, true, "Strict rejection should explain the unsupported signature format.")

            var validation = run({ OAF_VALIDATION_STRICT: "true" }, ["-f", script])
            ow.test.assert(io.fileExists(marker), false, "Combined validation rejection must happen before execution.")
            ow.test.assert((String(validation.stdout) + String(validation.stderr)).indexOf("signature format is defined") >= 0, true, "Combined validation should report the fail-closed signature policy.")

            var control = run({}, ["-f", script])
            ow.test.assert(control.exitcode, 0, "Non-strict script loading should remain available: " + control.stderr)
            ow.test.assert(io.fileExists(marker), true, "Non-strict control source should execute.")

            var program = "global.__signaturePolicyMarker=0;" +
                "var first=require(" + stringify(module) + ",true);" +
                "OAF_SIGNATURE_STRICT=true;" +
                "var cached=false,lib=false,cjs=false;" +
                "try{require(" + stringify(module) + ")}catch(e){cached=String(e).indexOf('signature format is defined')>=0}" +
                "try{loadCompiledLib('owrap_test_js')}catch(e){lib=String(e).indexOf('signature format is defined')>=0}" +
                "try{loadCompiledRequire('slonParse_js')}catch(e){cjs=String(e).indexOf('signature format is defined')>=0}" +
                "io.writeFile(" + stringify(result) + ",{first:first,count:global.__signaturePolicyMarker,cached:cached,lib:lib,cjs:cjs});"
            var cacheResult = run({}, ["-c", program])
            ow.test.assert(cacheResult.exitcode, 0, "Isolated cache-policy probe should complete: " + cacheResult.stderr)
            var evidence = io.readFile(result)
            ow.test.assert(evidence.first, 1, "Non-strict require control should execute once.")
            ow.test.assert(evidence.count, 1, "Cached source must not execute under signature strict mode.")
            ow.test.assert(evidence.cached && evidence.lib && evidence.cjs, true, "Strict policy should reject source and compiled cache paths.")
        } finally {
            io.rm(base)
        }
    }
})()
