// Copyright 2023 Nuno Aguiar

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
        
        // Encrypt the oJob YAML content
        var yamlContent = af.toYAML(testOJob);
        var encryptedContent = af.encrypt(yamlContent);
        io.writeFileString(tmpOJobEnc, encryptedContent);
        
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
        
        // Encrypt the oJob JSON content
        var jsonContent = stringify(testOJob);
        var encryptedContent = af.encrypt(jsonContent);
        io.writeFileString(tmpOJobEnc, encryptedContent);
        
        io.writeFileString(tmpOAF, "__flags.OJOB_CONSOLE_STDERR = false;oJob(\"" + tmpOJobEnc + "\", { token: \"" + tk + "\" })");

        var r = $openaf(tmpOAF);

        ow.test.assert(r.t, tk, "Problem with oJob encrypted JSON file.");
    };
})()