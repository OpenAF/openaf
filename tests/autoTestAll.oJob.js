// Copyright 2023 Nuno Aguiar

(function() {
    exports.testOJobHelpExamples = function() {
        ow.loadOJob();
        __initializeCon();
        var oldSimpleUI = __flags.OJOB_HELPSIMPLEUI, oldAnsi = __conAnsi;
        try {
            [true, false].forEach(function(simpleUI) {
                __flags.OJOB_HELPSIMPLEUI = simpleUI;
                __conAnsi = true;
                [42, 0, true, false, { value: 1 }, [1, 2], "two words"].forEach(function(value) {
                    var help = { expects: [{ name: "value", example: value }] };
                    ow.test.assert(ow.oJob.showHelp(help, {}, true), true, "Help should be displayed");
                    ow.test.assert(help.expects[0].example, value, "Help should preserve the example value");
                });
            });
        } finally {
            __flags.OJOB_HELPSIMPLEUI = oldSimpleUI;
            __conAnsi = oldAnsi;
        }
    };

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
        io.writeFileString(tmpOAF, "__flags.OJOB_CONSOLE_STDERR = false;oJob(\"" + tmpOJob + "\", { token: \"" + tk + "\" })");

        var r = $openaf(tmpOAF);

        ow.test.assert(r.t, tk, "Problem with oJob function.");
    };

    exports.testOJobShortcuts = function() {
        var testOJob = {
            todo: [
                { "(sample": 1, "((y": -1 }
            ],
            jobs: [
                {
                    name: "test",
                    typeArgs: {
                        shortcut: {
                            name  : "sample",
                            keyArg: "x",
                            args  : { y: "y" }
                        }
                    },
                    exec: "__pm.x = args.x; __pm.y = args.y;"
                }
            ]
        }

        var tk = genUUID()
        var tmpOJob = io.createTempFile("oJob", ".yaml").replace(/\\/g, "/")
        var tmpOAF  = io.createTempFile("oJob", ".js").replace(/\\/g, "/")
        io.writeFileString(tmpOJob, af.toYAML(testOJob))
        io.writeFileString(tmpOAF, "__flags.OJOB_CONSOLE_STDERR = false;oJob(\"" + tmpOJob + "\", { })")

        var r = $openaf(tmpOAF)

        ow.test.assert(Number(r.x), 1, "Problem with oJob shortcut keyArg.")
        ow.test.assert(Number(r.y), -1, "Problem with oJob shortcut args.")
    }

    exports.testOJobShortcutOutput = function() {
        var testOJob = {
            todo: [
                { "(set     )": "test",
                  "((path  ))": "x" },
                { "(output  )": "test", 
                  "((format))": "pm" }
            ]
        }

        var tk = genUUID()
        var tmpOJob = io.createTempFile("oJob", ".yaml").replace(/\\/g, "/")
        var tmpOAF  = io.createTempFile("oJob", ".js").replace(/\\/g, "/")
        io.writeFileString(tmpOJob, af.toYAML(testOJob))
        io.writeFileString(tmpOAF, "__flags.OJOB_CONSOLE_STDERR = false;oJob(\"" + tmpOJob + "\", { x: 123 })")

        var r = $openaf(tmpOAF)

        ow.test.assert(Number(r.result), 123, "Problem with oJob shortcut output.")
    }

    exports.testOJobArgsMultipleLevels = function() {
        var testOJob = {
            todo: [ "a" ],
            jobs: [
                { 
                    name: "a",
                    to  : [
                        { "(if)": "1==1",
                          "((then))": [ "b", { name: "c" } ] }
                    ],
                    args: { test: 123 }
                }, {
                    name : "b",
                    exec : "if (args.test == 123) __pm.a = true"
                }, {
                    name : "c",
                    exec : "if (args.test == 123) __pm.b = true"
                }
            ]
        }

        var tk = genUUID()
        var tmpOJob = io.createTempFile("oJob", ".yaml").replace(/\\/g, "/")
        var tmpOAF  = io.createTempFile("oJob", ".js").replace(/\\/g, "/")
        io.writeFileString(tmpOJob, af.toYAML(testOJob))
        io.writeFileString(tmpOAF, "__flags.OJOB_CONSOLE_STDERR = false;oJob(\"" + tmpOJob + "\", { })")

        var r = $openaf(tmpOAF)

        ow.test.assert(r.a, true, "Problem with oJob args multiple levels (1).")
        ow.test.assert(r.b, true, "Problem with oJob args multiple levels (2).")
    }

    exports.testOJobPass = function() {
        var testOJob = {
            "todo": [ "a" ],
            "jobs": [
              {
                "name": "a",
                "from": [ {
                    "(pass)": {
                      "test1": "{{outside}}",
                      "test2": "ok"
                    }
                  }
                ],
                "exec": "if (args.test1 == 'yes') __pm.test = true; else __pm.test = false"
              }
            ]
          }

        var tk = genUUID()
        var tmpOJob = io.createTempFile("oJob", ".yaml").replace(/\\/g, "/")
        var tmpOAF  = io.createTempFile("oJob", ".js").replace(/\\/g, "/")
        io.writeFileString(tmpOJob, af.toYAML(testOJob))
        io.writeFileString(tmpOAF, "__flags.OJOB_CONSOLE_STDERR = false;oJob(\"" + tmpOJob + "\", { outside: 'yes' })")

        var r = $openaf(tmpOAF)

        ow.test.assert(r.test, true, "Problem with oJob pass.")
    }

    exports.testOJobInitArray = function() {
        var testOJob = {
            "jobs": [ {
                "name": "a",
                "typeArgs": {
                    "single": true
                },
                "exec": "sleep(50, true);__pm = merge(__pm, args)"
            } ],
            "todo": [ {
                "name": "a",
                "args": [ { "x": 1, "y": -1 }, { "x": 2, "y": -2 } ]
            } ]
          }

        var tk = genUUID()
        var tmpOJob = io.createTempFile("oJob", ".yaml").replace(/\\/g, "/")
        var tmpOAF  = io.createTempFile("oJob", ".js").replace(/\\/g, "/")
        io.writeFileString(tmpOJob, af.toYAML(testOJob))

        io.writeFileString(tmpOAF, "__flags.OJOB_CONSOLE_STDERR = false;__flags.OJOB_INIT_ARRAY_ARGS_LIST = true;oJob(\"" + tmpOJob + "\", [{ a: 1 }, { b: 2 }])")
        var r = $openaf(tmpOAF)
        ow.test.assert(isMap(r) && isDef(r._list), true, "Problem with oJob init array (1).")

        io.writeFileString(tmpOAF, "__flags.OJOB_CONSOLE_STDERR = false;__flags.OJOB_INIT_ARRAY_ARGS_LIST = false;oJob(\"" + tmpOJob + "\", [{ a: 1 }, { b: 2 }])")
        var r2 = $openaf(tmpOAF)
        ow.test.assert(isMap(r2) && r2.b == 2 && r2.a == 1, true, "Problem with oJob init array (2).")
    }

    exports.testOJobChecks = function() {
        var testOJob = {
            todo: ["a"],
            jobs: [
                { name:"a",
                  to  :["b"],
                  exec: "args.data = { ns  : \"test\" }"},
                { name : "b",
                  check: {
                    in: { 
                      data     : "isMap",
                      "data.ns": "isString.default(\"n/a\")",
                      "data.n2": "isString.default(\"n/a\")"
                    }
                  },
                  exec :"__pm.data = args.data"
                }
            ]
        }

        var tk = genUUID()
        var tmpOJob = io.createTempFile("oJob", ".yaml").replace(/\\/g, "/")
        var tmpOAF  = io.createTempFile("oJob", ".js").replace(/\\/g, "/")
        io.writeFileString(tmpOJob, af.toYAML(testOJob))

        io.writeFileString(tmpOAF, "__flags.OJOB_CONSOLE_STDERR = false;__flags.OJOB_INIT_ARRAY_ARGS_LIST = true;oJob(\"" + tmpOJob + "\", { })")
        var r = $openaf(tmpOAF)
        
        ow.test.assert(r.data.ns, "test", "Problem with oJob simple check.")
        ow.test.assert(r.data.n2, "n/a", "Problem with oJob path check.")
    }

    exports.testOJobPass = function() {
        var testOJob = {
            todo: [ { name: "a", args: { a: 1, b: -1, c: 5 } } ],
            jobs: [
                { name: "a",
                  from: [ { "(pass)": { a: 2, c: null } } ],
                  exec: "__pm.a = args.a; __pm.b = args.b; __pm.c = args.c"}
            ]
        }

        var tk = genUUID()
        var tmpOJob = io.createTempFile("oJob", ".yaml").replace(/\\/g, "/")
        var tmpOAF  = io.createTempFile("oJob", ".js").replace(/\\/g, "/")
        io.writeFileString(tmpOJob, af.toYAML(testOJob))

        io.writeFileString(tmpOAF, "__flags.OJOB_CONSOLE_STDERR = false;oJob(\"" + tmpOJob + "\", { })")
        var r = $openaf(tmpOAF)
        
        ow.test.assert(r.a, 2, "Problem with oJob pass normal argument.")
        ow.test.assert(r.c, __, "Problem with oJob pass undefined/null argument.")
    }

    exports.testOJobDefaultArgs = function() {
        var testOJob = {
            todo: [
                { name: "Test Default Args", args: { providedValue: "actualValue", config: { database: { port: 5432 } } } }
            ],
            jobs: [
                {
                    name: "Test Default Args",
                    args: {
                        simpleDefault: "${missingValue:-defaultValue}",
                        existingValue: "${providedValue:-shouldNotUseThis}", 
                        numericDefault: "${missingNumber:-42}",
                        nestedDefault: "${config.database.host:-localhost}",
                        existingNested: "${config.database.port:-3306}",
                        circularRef: "${circularRef:-circular}"
                    },
                    exec: "__pm.simpleDefault = args.simpleDefault; __pm.existingValue = args.existingValue; __pm.numericDefault = args.numericDefault; __pm.nestedDefault = args.nestedDefault; __pm.existingNested = args.existingNested; __pm.circularRef = args.circularRef;"
                }
            ]
        }

        var tmpOJob = io.createTempFile("oJob", ".yaml").replace(/\\/g, "/")
        var tmpOAF  = io.createTempFile("oJob", ".js").replace(/\\/g, "/")
        io.writeFileString(tmpOJob, af.toYAML(testOJob))
        io.writeFileString(tmpOAF, "__flags.OJOB_CONSOLE_STDERR = false;oJob(\"" + tmpOJob + "\", { })")

        var r = $openaf(tmpOAF)

        ow.test.assert(r.simpleDefault, "defaultValue", "Problem with oJob default args for missing value.")
        ow.test.assert(r.existingValue, "actualValue", "Problem with oJob default args for existing value.")
        ow.test.assert(r.numericDefault, "42", "Problem with oJob default args for numeric default.")
        ow.test.assert(r.nestedDefault, "localhost", "Problem with oJob default args for nested missing value.")
        ow.test.assert(r.existingNested, 5432, "Problem with oJob default args for existing nested value.")
        ow.test.assert(r.circularRef, "${circularRef:-circular}", "Problem with oJob default args circular reference prevention.")
    }

    exports.testOJobTodoDefaultArgs = function() {
        var testOJob = {
            todo: [
                { name: "Test Default Args", args: { providedValue: "actualValue", config: { database: { port: 5432 } }, simpleDefault: "${missingValue:-defaultValue}", existingValue: "${providedValue:-shouldNotUseThis}", numericDefault: "${missingNumber:-42}", nestedDefault: "${config.database.host:-localhost}", existingNested: "${config.database.port:-3306}", circularRef: "${circularRef:-circular}" } }
            ],
            jobs: [
                {
                    name: "Test Default Args",
                    exec: "__pm.simpleDefault = args.simpleDefault; __pm.existingValue = args.existingValue; __pm.numericDefault = args.numericDefault; __pm.nestedDefault = args.nestedDefault; __pm.existingNested = args.existingNested; __pm.circularRef = args.circularRef;"
                }
            ]
        }

        var tmpOJob = io.createTempFile("oJob", ".yaml").replace(/\\/g, "/")
        var tmpOAF  = io.createTempFile("oJob", ".js").replace(/\\/g, "/")
        io.writeFileString(tmpOJob, af.toYAML(testOJob))
        io.writeFileString(tmpOAF, "__flags.OJOB_CONSOLE_STDERR = false;oJob(\"" + tmpOJob + "\", { })")

        var r = $openaf(tmpOAF)

        ow.test.assert(r.simpleDefault, "defaultValue", "Problem with oJob todo default args for missing value.")
        ow.test.assert(r.existingValue, "actualValue", "Problem with oJob todo default args for existing value.")
        ow.test.assert(r.numericDefault, "42", "Problem with oJob todo default args for numeric default.")
        ow.test.assert(r.nestedDefault, "localhost", "Problem with oJob todo default args for nested missing value.")
        ow.test.assert(r.existingNested, 5432, "Problem with oJob todo default args for existing nested value.")
        ow.test.assert(r.circularRef, "${circularRef:-circular}", "Problem with oJob todo default args circular reference prevention.")
    }

    exports.testOJobEncryptedYAML = function() {
        var testOJob = {
            todo: [ "Test" ],
            jobs: [
                {
                    name: "Test",
                    exec: "__pm.status = 'ok'; __pm.t = args.token;"
                }
            ]
        };

        var tk = genUUID();
        var tmpOJobEnc = io.createTempFile("oJob", ".yaml.enc").replace(/\\/g, "/");
        var tmpOAF  = io.createTempFile("oJob", ".js").replace(/\\/g, "/");

        // Encrypt the oJob YAML content using byte-based encryption
        var yamlContent = af.toYAML(testOJob);
        var encryptedBytes = af.encryptString2Bytes(yamlContent);
        io.writeFileBytes(tmpOJobEnc, encryptedBytes);

        io.writeFileString(tmpOAF, "__flags.OJOB_CONSOLE_STDERR = false;oJob(\"" + tmpOJobEnc + "\", { token: \"" + tk + "\" })");

        var r = $openaf(tmpOAF);

        ow.test.assert(r.t, tk, "Problem with oJob encrypted YAML file.");
    };

    exports.testOJobEncryptedJSON = function() {
        var testOJob = {
            todo: [ "Test" ],
            jobs: [
                {
                    name: "Test",
                    exec: "__pm.status = 'ok'; __pm.t = args.token;"
                }
            ]
        };

        var tk = genUUID();
        var tmpOJobEnc = io.createTempFile("oJob", ".json.enc").replace(/\\/g, "/");
        var tmpOAF  = io.createTempFile("oJob", ".js").replace(/\\/g, "/");

        // Encrypt the oJob JSON content using byte-based encryption
        var jsonContent = stringify(testOJob);
        var encryptedBytes = af.encryptString2Bytes(jsonContent);
        io.writeFileBytes(tmpOJobEnc, encryptedBytes);

        io.writeFileString(tmpOAF, "__flags.OJOB_CONSOLE_STDERR = false;oJob(\"" + tmpOJobEnc + "\", { token: \"" + tk + "\" })");

        var r = $openaf(tmpOAF);

        ow.test.assert(r.t, tk, "Problem with oJob encrypted JSON file.");
    };

    exports.testOJobExternalExecArgs = function() {
        ow.loadOJob();
        var marker = io.createTempFile("oJobExternalExec", ".marker").replace(/\\/g, "/");
        var result = io.createTempFile("oJobExternalExec", ".json").replace(/\\/g, "/");
        var argsFile = io.createTempFile("oJobExternalExec", ".args.yaml").replace(/\\/g, "/");
        var jobFile = io.createTempFile("oJobExternalExec", ".yaml").replace(/\\/g, "/");
        io.rm(marker);
        io.rm(result);
        try {
            var expression = "io.writeFileString(" + stringify(marker) + ", 'executed'); ({ injected: true })";
            var own = ow.oJob.__processArgs({ __oJobExec: expression, safe: "own" }, __, __, true);
            var inheritedInput = Object.create({ __oJobExec: expression });
            inheritedInput.safe = "inherited";
            var inherited = ow.oJob.__processArgs(inheritedInput, __, __, true);
            ow.test.assert(io.fileExists(marker), false, "Map argument expressions must remain inert.");
            ow.test.assert(own.safe, "own", "Own-property argument maps remain data.");
            ow.test.assert(inherited.safe, "inherited", "Inherited-property argument maps remain data.");

            var queued = [];
            var localOJob = Object.create(OpenWrap.oJob.prototype);
            localOJob.__id = "compat";
            localOJob.addTodo = function(aOJobID, aJobsCh, aTodoCh, aJobName, aJobArgs) {
                queued.push({ name: aJobName, args: aJobArgs });
            };
            localOJob.addTodos([ { name: "No top-level args", args: "({ noTopValue: 1 })" } ], __, "compat");
            localOJob.add2Todo({ name: "Dynamic todo", args: "({ dynamicValue: 2 })" }, "compat");
            ow.test.assert(queued[0].args.noTopValue, 1, "Trusted todo string args must execute without top-level args.");
            ow.test.assert(queued[1].args.dynamicValue, 2, "Trusted dynamic todo string args must execute.");

            io.writeFileString(jobFile, af.toYAML({
                ojob: { sequential: true },
                todo: [ { name: "Safe", args: "({ todoValue: 'todo' })" } ],
                jobs: [ {
                    name: "Safe",
                    args: "({ jobValue: 'job' })",
                    exec: "io.writeFileString(args.resultFile, stringify({ safe: args.safe, todoValue: args.todoValue, jobValue: args.jobValue, injected: args.injected }))"
                } ]
            }));
            io.writeFileString(argsFile, af.toYAML({
                resultFile: result,
                safe: "external",
                __oJobExec: expression
            }));

            var r = $sh().sh([ow.format.getJavaHome() + "/bin/java", "-jar", getOpenAFPath() + "openaf.jar", "--ojob", "-e", jobFile + " -f " + argsFile]).get(0);
            ow.test.assert(r.exitcode, 0, "Trusted oJob with external argument file should run.");
            ow.test.assert(io.fileExists(marker), false, "External -f __oJobExec must not execute.");
            ow.test.assert(io.fileExists(result), true, "Trusted job body must run: " + r.stdout + r.stderr);
            var output = io.readFile(result);
            ow.test.assert(output.safe, "external", "Normal external arguments must reach the job.");
            ow.test.assert(output.todoValue, "todo", "Trusted todo argument expressions must still execute.");
            ow.test.assert(output.jobValue, "job", "Trusted job argument expressions must still execute.");
            ow.test.assert(isUnDef(output.injected), true, "External executable expression result must not reach the job.");
        } finally {
            [marker, result, argsFile, jobFile].forEach(function(file) { if (io.fileExists(file)) io.rm(file); });
        }
    };

    exports.testOJobStrictParsing = function() {
        ow.loadOJob();
        var files = [], markers = [];
        var oldIntegrity = OJOB_INTEGRITY, oldIntegrityStrict = OJOB_INTEGRITY_STRICT;
        var oldIntegrityWarn = OJOB_INTEGRITY_WARN, oldValidationStrict = OJOB_VALIDATION_STRICT;
        var oldSignatureStrict = OJOB_SIGNATURE_STRICT, oldSignatureKey = OJOB_SIGNATURE_KEY;
        var oldYAMLUnsafe = __flags.YAML.unsafe;
        var oldJSONUnsafe = __JSONformat.unsafe;
        function payload(marker) {
            return "!!js/eval (function(){ io.writeFileString(" + stringify(marker) + ", 'executed'); return 'value'; })()";
        }
        function expectRejected(file) {
            var rejected = false;
            try { ow.oJob.__loadFile(file); } catch(e) { rejected = String(e).indexOf("OJOB VALIDATION") >= 0; }
            ow.test.assert(rejected, true, "Strict validation must reject an unvalidated oJob.");
        }
        try {
            __flags.YAML.unsafe = true;
            __JSONformat.unsafe = true;
            OJOB_INTEGRITY = {};
            OJOB_INTEGRITY_STRICT = false;
            OJOB_INTEGRITY_WARN = false;
            OJOB_SIGNATURE_STRICT = false;
            OJOB_VALIDATION_STRICT = true;

            var jsonFile = io.createTempFile("oJobStrict", ".json").replace(/\\/g, "/");
            var jsonMarker = jsonFile + ".marker";
            files.push(jsonFile); markers.push(jsonMarker); io.rm(jsonMarker);
            io.writeFileString(jsonFile, stringify({ probe: payload(jsonMarker), todo: [], jobs: [] }));
            expectRejected(jsonFile);
            ow.test.assert(io.fileExists(jsonMarker), false, "Strict JSON validation must happen before executable values.");

            var yamlFile = io.createTempFile("oJobStrict", ".yaml").replace(/\\/g, "/");
            var yamlMarker = yamlFile + ".marker";
            files.push(yamlFile); markers.push(yamlMarker); io.rm(yamlMarker);
            io.writeFileString(yamlFile, "probe: !!js/eval " + payload(yamlMarker).slice(10) + "\ntodo: []\njobs: []\n");
            expectRejected(yamlFile);
            ow.test.assert(io.fileExists(yamlMarker), false, "Strict YAML validation must happen before executable tags.");

            ow.oJob.getRawIncludes(yamlFile);
            ow.test.assert(io.fileExists(yamlMarker), false, "Raw include inspection must not execute YAML tags.");

            var unsignedFile = io.createTempFile("oJobUnsigned", ".json").replace(/\\/g, "/");
            var unsignedMarker = unsignedFile + ".marker";
            files.push(unsignedFile); markers.push(unsignedMarker); io.rm(unsignedMarker);
            io.writeFileString(unsignedFile, stringify({ probe: payload(unsignedMarker), todo: [], jobs: [] }));
            OJOB_VALIDATION_STRICT = false;
            OJOB_SIGNATURE_STRICT = true;
            OJOB_SIGNATURE_KEY = __;
            ow.oJob.__loadFile(unsignedFile);
            ow.test.assert(io.fileExists(unsignedMarker), false, "Strict signature policy must reject unsigned executable values.");

            ow.loadObj(); ow.loadJava();
            var keypair = (new ow.java.cipher()).genKeyPair();
            var keylessFile = io.createTempFile("oJobMissingSignatureKey", ".json").replace(/\\/g, "/");
            var keylessMarker = keylessFile + ".marker";
            files.push(keylessFile); markers.push(keylessMarker); io.rm(keylessMarker);
            io.writeFileString(keylessFile, stringify(ow.obj.sign(keypair.privateKey, { probe: payload(keylessMarker), todo: [], jobs: [] })));
            ow.oJob.__loadFile(keylessFile);
            ow.test.assert(io.fileExists(keylessMarker), false, "Strict signature policy must reject definitions when the verification key is missing.");

            var signedFile = io.createTempFile("oJobSigned", ".json").replace(/\\/g, "/");
            var signedMarker = signedFile + ".marker";
            files.push(signedFile); markers.push(signedMarker); io.rm(signedMarker);
            var signed = ow.obj.sign(keypair.privateKey, { probe: payload(signedMarker), todo: [], jobs: [] });
            io.writeFileString(signedFile, stringify(signed));
            OJOB_SIGNATURE_KEY = keypair.publicKey;
            ow.oJob.__loadFile(signedFile);
            ow.test.assert(io.fileExists(signedMarker), true, "Valid signatures must authorize trusted executable values.");

            var invalidFile = io.createTempFile("oJobInvalidSignature", ".json").replace(/\\/g, "/");
            var invalidMarker = invalidFile + ".marker";
            files.push(invalidFile); markers.push(invalidMarker); io.rm(invalidMarker);
            var invalid = clone(signed);
            invalid.probe = payload(invalidMarker);
            io.writeFileString(invalidFile, stringify(invalid));
            ow.oJob.__loadFile(invalidFile);
            ow.test.assert(io.fileExists(invalidMarker), false, "Invalid signatures must be rejected before executable values.");

            OJOB_SIGNATURE_STRICT = false;
            OJOB_SIGNATURE_KEY = oldSignatureKey;

            var trustedFile = io.createTempFile("oJobTrusted", ".json").replace(/\\/g, "/");
            var trustedMarker = trustedFile + ".marker";
            files.push(trustedFile); markers.push(trustedMarker); io.rm(trustedMarker);
            io.writeFileString(trustedFile, stringify({ probe: payload(trustedMarker), todo: [], jobs: [] }));
            OJOB_VALIDATION_STRICT = false;
            ow.oJob.__loadFile(trustedFile);
            ow.test.assert(io.fileExists(trustedMarker), true, "Trusted legacy executable values must remain supported outside strict validation.");

            var pinnedFile = io.createTempFile("oJobPinned", ".json").replace(/\\/g, "/");
            var pinnedMarker = pinnedFile + ".marker";
            files.push(pinnedFile); markers.push(pinnedMarker); io.rm(pinnedMarker);
            var pinned = stringify({ probe: payload(pinnedMarker), todo: [], jobs: [] });
            io.writeFileString(pinnedFile, pinned);
            OJOB_INTEGRITY = {};
            OJOB_INTEGRITY[io.fileInfo(pinnedFile).canonicalPath] = "sha256-" + sha256(pinned);
            OJOB_INTEGRITY_STRICT = true;
            OJOB_VALIDATION_STRICT = true;
            ow.oJob.__loadFile(pinnedFile);
            ow.test.assert(io.fileExists(pinnedMarker), true, "Exact integrity-verified bytes must retain trusted executable values.");
        } finally {
            OJOB_INTEGRITY = oldIntegrity;
            OJOB_INTEGRITY_STRICT = oldIntegrityStrict;
            OJOB_INTEGRITY_WARN = oldIntegrityWarn;
            OJOB_VALIDATION_STRICT = oldValidationStrict;
            OJOB_SIGNATURE_STRICT = oldSignatureStrict;
            OJOB_SIGNATURE_KEY = oldSignatureKey;
            __flags.YAML.unsafe = oldYAMLUnsafe;
            __JSONformat.unsafe = oldJSONUnsafe;
            files.concat(markers).forEach(function(file) { if (io.fileExists(file)) io.rm(file); });
        }
    };

    exports.testOJobIntegritySingleFetch = function() {
        ow.loadOJob();
        ow.loadServer();
        var oldIntegrity = OJOB_INTEGRITY, oldIntegrityStrict = OJOB_INTEGRITY_STRICT;
        var oldIntegrityWarn = OJOB_INTEGRITY_WARN, oldValidationStrict = OJOB_VALIDATION_STRICT;
        var oldSignatureStrict = OJOB_SIGNATURE_STRICT, oldDomains = ow.oJob.authorizedDomains.slice(0);
        var marker = io.createTempFile("oJobIntegrity", ".marker").replace(/\\/g, "/");
        var localFile = io.createTempFile("oJobIntegrity", ".json").replace(/\\/g, "/");
        var server, requests = 0;
        io.rm(marker);
        try {
            var benign = stringify({ todo: [], jobs: [] });
            var malicious = stringify({
                probe: "!!js/eval io.writeFileString(" + stringify(marker) + ", 'executed')",
                todo: [], jobs: []
            });
            io.writeFileString(localFile, benign);
            var canonical = io.fileInfo(localFile).canonicalPath;
            OJOB_INTEGRITY = {};
            ow.test.assert(isUnDef(ow.oJob.verifyIntegrity(localFile)), true, "Unregistered integrity entries must remain undefined.");
            OJOB_INTEGRITY[canonical] = "sha256-" + sha256(benign);
            ow.test.assert(ow.oJob.verifyIntegrity(localFile), true, "Dash integrity syntax must validate matching content.");
            OJOB_INTEGRITY[canonical] = "sha256:" + sha256(benign);
            ow.test.assert(ow.oJob.verifyIntegrity(localFile), true, "Colon integrity syntax must validate matching content.");
            OJOB_INTEGRITY[canonical] = "sha256-" + sha256("different");
            ow.test.assert(ow.oJob.verifyIntegrity(localFile), false, "Integrity mismatches must remain false.");

            var port = findRandomOpenPort();
            server = ow.server.httpd.start(port, "127.0.0.1", __, __, __, __, __, "java");
            ow.server.httpd.route(server, {
                "/job.json": function(req) {
                    return server.replyOKText(requests++ == 0 ? benign : malicious);
                }
            });

            var url = "http://127.0.0.1:" + port + "/job.json";
            ow.oJob.authorizedDomains.push("127.0.0.1");
            OJOB_INTEGRITY = {};
            OJOB_INTEGRITY[url] = "sha256-" + sha256(benign);
            OJOB_INTEGRITY_STRICT = true;
            OJOB_INTEGRITY_WARN = false;
            OJOB_VALIDATION_STRICT = true;
            OJOB_SIGNATURE_STRICT = false;

            ow.oJob.__loadFile(url);
            ow.test.assert(requests, 1, "Integrity-checked oJobs must fetch the definition once.");
            ow.test.assert(io.fileExists(marker), false, "A later remote response must not replace the verified bytes.");
        } finally {
            if (isDef(server)) ow.server.httpd.stop(server);
            if (io.fileExists(marker)) io.rm(marker);
            if (io.fileExists(localFile)) io.rm(localFile);
            OJOB_INTEGRITY = oldIntegrity;
            OJOB_INTEGRITY_STRICT = oldIntegrityStrict;
            OJOB_INTEGRITY_WARN = oldIntegrityWarn;
            OJOB_VALIDATION_STRICT = oldValidationStrict;
            OJOB_SIGNATURE_STRICT = oldSignatureStrict;
            ow.oJob.authorizedDomains = oldDomains;
        }
    };

    exports.testOJobAuthorizedDomainRedirects = function() {
        var oldDomains = ow.oJob.authorizedDomains.slice(0), oldFile = ow.oJob.__file, oldFileList = ow.oJob.fileList.slice(0), server
        var deniedRequests = new java.util.concurrent.atomic.AtomicInteger(0)
        var allowedRequests = new java.util.concurrent.atomic.AtomicInteger(0)
        var credentialAuthorization
        var oldJSONUnsafe = __JSONformat.unsafe
        try {
            var port = findRandomOpenPort()
            server = ow.server.httpd.start(port, "127.0.0.1", __, __, __, __, __, "java")
            ow.server.httpd.route(server, {
                "/denied.json": function() {
                    return server.reply("", "text/plain", 302, { Location: "http://localhost:" + port + "/payload.json" })
                },
                "/payload.json": function() {
                    deniedRequests.incrementAndGet()
                    return server.replyOKText(stringify({ todo: [], jobs: [] }))
                },
                "/allowed.json": function() {
                    return server.reply("", "text/plain", 302, { Location: "/control.json" })
                },
                "/control.json": function() {
                    allowedRequests.incrementAndGet()
                    return server.replyOKText(stringify({ todo: [], jobs: [] }))
                },
                "/control-yaml.json": function() {
                    return server.replyOKText("todo: []\njobs:\n  - name: YAML control\n")
                },
                "/unsafe-json.json": function() {
                    return server.replyOKText('{"ojob":{"probe":"!!js/eval 40 + 2"},"todo":[],"jobs":[]}')
                },
                "/credential.json": function(req) {
                    credentialAuthorization = req.header.authorization
                    if (isUnDef(credentialAuthorization)) return server.reply("Authentication required", "text/plain", 401, { "WWW-Authenticate": "Basic realm=\"ojob-test\"" })
                    return server.replyOKText(stringify({ todo: [], jobs: [] }))
                }
            })

            ow.oJob.authorizedDomains = [ "127.0.0.1" ]
            var denied = false
            try { ow.oJob.__loadFile("http://127.0.0.1:" + port + "/denied.json") } catch(e) { denied = String(e).indexOf("Unauthorized URL redirect") >= 0 }
            ow.test.assert(denied, true, "A redirect to a forbidden hostname should be rejected.")
            ow.test.assert(deniedRequests.get(), 0, "The forbidden redirect destination should not be contacted.")

            ow.oJob.__loadFile("http://127.0.0.1:" + port + "/allowed.json")
            ow.test.assert(allowedRequests.get(), 1, "An authorized relative redirect should still load.")

            var yaml = ow.oJob.__loadFile("http://127.0.0.1:" + port + "/control-yaml")
            ow.test.assert(yaml.jobs[0].name, "YAML control", "Extensionless authorized YAML should retain its legacy parsing behavior.")

            __JSONformat.unsafe = true
            var executableJSON = ow.oJob.__loadFile("http://127.0.0.1:" + port + "/unsafe-json")
            ow.test.assert(executableJSON.ojob.probe, 42, "Trusted authorized JSON executable values should remain supported outside strict validation.")

            ow.oJob.__loadFile("http://user:password@127.0.0.1:" + port + "/credential.json")
            ow.test.assert(isDef(credentialAuthorization) && String(credentialAuthorization).startsWith("Basic "), true, "Authorized credential URLs should still authenticate to their original origin.")
        } finally {
            if (isDef(server)) ow.server.httpd.stop(server)
            ow.oJob.authorizedDomains = oldDomains
            ow.oJob.__file = oldFile
            ow.oJob.fileList = oldFileList
            __JSONformat.unsafe = oldJSONUnsafe
        }
    };

    exports.testOJobShutdownConsole = function() {
        var tmpOJob = io.createTempFile("oJobShutdown", ".yaml").replace(/\\/g, "/");
        try {
            ["", "; __con = null", "; __con = { getTerminal: function() { throw new Error('unavailable terminal'); } }"].forEach(function(consoleState) {
                io.writeFileString(tmpOJob, af.toYAML({
                    ojob: { logToConsole: true },
                    todo: ["Initialize terminal", "Shutdown probe"],
                    jobs: [
                        { name: "Initialize terminal", exec: "__initializeCon()" + consoleState },
                        { name: "Shutdown probe", type: "shutdown", exec: "sleep(200); print('SHUTDOWN_BODY_RAN');" }
                    ]
                }));
                var r = $sh().sh([ow.format.getJavaHome() + "/bin/java", "-jar", getOpenAFPath() + "openaf.jar", "--ojob", "-e", tmpOJob]).get(0);
                var output = String(r.stdout) + String(r.stderr);
                ow.test.assert(r.exitcode, 0, "Shutdown child JVM failed");
                ow.test.assert(output.indexOf("SHUTDOWN_BODY_RAN") >= 0, true, "Shutdown job did not run");
                ow.test.assert(output.indexOf("Terminal has been closed") < 0, true, "Shutdown logging used a closed terminal");
                ow.test.assert(/\[Shutdown probe\].*STARTED/.test(output), true, "Shutdown start event missing");
                ow.test.assert(/\[Shutdown probe\].*SUCCESS/.test(output), true, "Shutdown success event missing");
                ow.test.assert(output.indexOf("| ERROR |") < 0, true, "Shutdown console fallback logged an error: " + output);
            });
        } finally {
            io.rm(tmpOJob);
        }
    };

})()
