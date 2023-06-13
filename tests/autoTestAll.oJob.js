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
})()