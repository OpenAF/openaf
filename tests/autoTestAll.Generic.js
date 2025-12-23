// Copyright 2023 Nuno Aguiar

(function() {
    exports.testGetVersion = function() {
        print(getVersion());
    };

    exports.testClone = function() {
        ow.test.assert(123, clone(123), "Problem with clone of a number")
        ow.test.assert(true, clone(true), "Problem with clone of a boolean")
        ow.test.assert("abc", clone("abc"), "Problem with clone of a string")
        ow.test.assert(__, clone(null), "Problem with clone of a null")
        ow.test.assert(__, clone(__), "Problem with clone of a undefined")
        ow.test.assert({ x: 1, y: "a" }, clone({ x: 1, y: "a" }), "Problem with clone of a map")
        ow.test.assert([1, 2, 3], clone([1, 2, 3]), "Problem with clone of an array")

        var test = {
            n: 123,
            s: "test",
            nl: null,
            vd: __,
            mp: {
                n: 123,
                s: "test",
                nl: null,
                vd: __,
                mp2: { x: 1, y: -1 },
                ar: [ 1, 2, { x: 1, y: -1 }, [1, "t", { a: 1, b: 2 }]]
            },
            ar: [ 1, 2, { x: 1, y: -1 }, [1, "t", { a: 1, b: 2 }]]
        }
        ow.test.assert(stringify(test,__,""), stringify(clone(test),__,""), "Problem with mutiple types object")
    }

    exports.testPrints = function() {
        print("Hello World!");
        printErr("Bye World!"); printErrnl("?");
        printnl("no"); print(" line");        
    };

    exports.testSPrints = function() {
        var a = { a: 1, b: "a", c: [1, { d: 3 }]};
        sprint(a);
        sprintErr(a); sprintErrnl(a);
        sprintnl(a); sprint(a);         
    };

    exports.testLogs = function() {
        log("Hello World!");
        logErr("Bye World!"); logWarn("?");
        lognl("no"); log(" line");
    };
 
    exports.testRange = function() {
        ow.test.assert(range(5).length, 5, "Problem with range size")
        ow.test.assert(range(1, 5)[0], 5, "Problem with range start")
        ow.test.assert(range(5, -10)[0], -10, "Problem with negative range start")
        ow.test.assert((function() { try { range(-5); return 1 } catch(e) { return String(e) } })(), "RangeError: Inappropriate array length.", "Problem with negative range count")
    }

    exports.testDBPG = function() {
        var db = new DB("jdbc:postgresql://hh-pgsql-public.ebi.ac.uk:5432/pfmegrnargs", "reader", "NWDMCE5xdipIjRrp");

        var res = db.q("select 2+2 a");
        ow.test.assert(isArray(res.results), true, "Problem with DB result (1)");
        ow.test.assert(res.results[0].a, 4, "Problem with DB result (2)"); 

        db.close();
    };

    exports.testSHA1 = function() {
        var test = "This is a nice test";
        if (sha1(test) != "9f1fec3ac96692fd985447639e00a4b19598c0ea") {
            throw("value returned different from expected");
        }
    };

    exports.testSHA256 = function() {
        var test = "This is a nice test";
        if (sha256(test) != "05692badaa2233bd7b5839940ab75f44fe82470eeaf8f9c24c54f25ead80b09c") {
            throw("value returned different from expected");
        }        
    };
  
    exports.testSHA384 = function() {
        var test = "This is a nice test";
        if (sha384(test) != "2067005e336676ed8aa0445b7593dea7fb3ecb77453353e84105c229e0878fc721fe63d56ca0f82a9111fc1aa5fdf656") {
            throw("value returned different from expected");
        }
    };

    exports.testSHA512 = function() {
        var test = "This is a nice test";
        if (sha512(test) != "62a8e0e5513e5a32609a5960418119ad682c6d8cde55f190e77df1e12d465dfd7876c487737efce4e3f59e4815a7caa51d1c95c291ac1373b61f283e41a8adbd") {
            throw("value returned different from expected");
        }        
    };

    exports.testBCrypt = function() {
        var test = "This is a nice test";
        var res = bcrypt(test);
        ow.test.assert(bcrypt(test, res), true, "Problem with BCrypt simple test (default rounds)");

        res = bcrypt(test, void 0, 4);
        ow.test.assert(bcrypt(test, res), true, "Problem with BCrypt with 4 rounds.");

        res = bcrypt(test, void 0, 12);
        ow.test.assert(bcrypt(test, res), true, "Problem with BCrypt with 12 rounds.");
    };

    exports.testPSelect = function() {
        var arr = io.listFiles(getOpenAFPath()).files;

        ow.test.assert(
            $from(arr).select((r) => { return 1; }),
            $from(arr).pselect((r) => { return 1; }),
            "Problem with $from.pselect()."
        );
    };

    exports.testPath = function() {
        ow.test.assert($path({ x: true }, "to_number(if(x, '1', '0'))"), 1, "Problem with $path if")
        ow.test.assert($path({ y: true }, "assign(@, 'x', `false`)"), { x: false, y: true }, "Problem with $path assign")
        ow.test.assert($path({ y: { a: 1 } }, "assignp('y', 'x', `false`)"), { y: { a: 1, x: false } }, "Problem with $path assignp")
        ow.test.assert($path({}, "env('PATH')"), getEnv("PATH"), "Problem with $path env")
        ow.test.assert($path({}, "envs('^PATH$')"), [ { name: 'PATH', value: getEnv("PATH") } ], "Problem with $path envs")
        ow.test.assert($path({}, "timeagoAbbr(now('5000'))"), "5secs", "Problem with $path timeagoAbbr")
        ow.test.assert($path({}, "date_diff(now('60000'), 'minutes', __)"), 1, "Problem with $path date_diff")
        ow.test.assert($path({}, "to_bytesAbbr(`2048`)"), "2 KB", "Problem with $path to_bytesAbbr")
        ow.test.assert($path({}, "to_numAbbr(`2000`)"), "2k", "Problem with $path to_numAbbr")
        ow.test.assert($path({}, "from_siAbbr('2m')"), 0.002, "Problem with $path from_siAbbr")
        ow.test.assert($path({}, "from_timeAbbr('5s')"), 5000, "Problem with $path from_timeAbbr")
        ow.test.assert($path({}, "timeago(now('1000'))"), "1 seconds ago", "Problem with $path timeago")
        ow.test.assert($path({}, "upper_case('AbC')"), "ABC", "Problem with $path upper_case")
        ow.test.assert($path({}, "lower_case('AbC')"), "abc", "Problem with $path lower_case")
        ow.test.assert($path({}, "concat('a', concat('b', 'c'))"), "abc", "Problem with $path concat")
        ow.test.assert($path({ x: { a: 1, b: 0 }}, "to_slon(x)"), "(a: 1, b: 0)", "Problem with $path to_slon")
        ow.test.assert($path({ x: { a: 1, b: 0 }}, "to_json(x,'')"), "{\"a\":1,\"b\":0}", "Problem with $path to_json")
        ow.test.assert($path({ x: { a: 1, b: 0 }}, "to_json(@,'')"), "{\"x\":{\"a\":1,\"b\":0}}", "Problem with $path to_json")
        ow.test.assert($path({}, "trim('  abc ')"), "abc", "Problem with $path trim")
        ow.test.assert($path({ a: 1 }, "nvl(b, '0')"), "0", "Problem with $path nvl")
        ow.test.assert($path({}, "add(`2`, `3`)"), 5, "Problem with $path add")
        ow.test.assert($path({}, "sub(`2`, `3`)"), -1, "Problem with $path sub")
        ow.test.assert($path({}, "mul(`2`, `3`)"), 6, "Problem with $path mul")
        ow.test.assert($path({}, "div(`6`, `3`)"), 2, "Problem with $path div")
        ow.test.assert($path({}, "mod(`6`, `3`)"), 0, "Problem with $path mod")
        ow.test.assert($path({}, "range(`2`)"), [ 1, 2 ], "Problem with $path range")
    }

    exports.testGetSet = function() {
        $set("_test", 1)
        ow.test.assert($get("_test"), 1, "Problem with $get (1)")

        $set("_test", { a: 1, b: 2 })
        ow.test.assert($get("_test"), { a: 1, b: 2 }, "Problem with $get (2)")

        $set("_test", [ 1, 2, 3 ])
        ow.test.assert($get("_test"), [ 1, 2, 3 ], "Problem with $get (3)")

        $set("_test", "test")
        ow.test.assert($get("_test"), "test", "Problem with $get (4)")

        $set("_test", true)
        ow.test.assert($get("_test"), true, "Problem with $get (5)")
    }
 
    exports.testLock = function() {
        var res = false
        $lock("a").tryLock(() => {
            res = $lock("a").isLocked()
        })

        ow.test.assert(res, true, "Problem with $lock.tryLock")
        ow.test.assert($lock("a").isLocked(), false, "Problem with $lock.isLocked")
    }

    exports.testFLock = function() {
        var res = false
        var tmp = io.createTempFile("test")
        $flock(tmp).tryLock(() => {
            res = $flock(tmp).isLocked()
        })

        ow.test.assert(res, true, "Problem with $lock.tryLock")
        ow.test.assert($flock(tmp).isLocked(), false, "Problem with $lock.isLocked")
    }

    exports.testQueue = function() {
        var q = $queue([1, "2a", "b3"])

        ow.test.assert(q.size(), 3, "Problem with $queue size")
        ow.test.assert(q.peek(), 1, "Problem with $queue peek")
        ow.test.assert(q.poll(), 1, "Problem with $queue poll")
        ow.test.assert(q.size(), 2, "Problem with $queue size after poll")
        ow.test.assert(q.peek(), "2a", "Problem with $queue peek after poll")
        q.add(4)
        ow.test.assert(q.isEmpty(), false, "Problem with $queue isEmpty")
        ow.test.assert(q.size(), 3, "Problem with $queue size after add")
        ow.test.assert(q.poll(), "2a", "Problem with $queue poll after add")
        ow.test.assert(q.peek(), "b3", "Problem with $queue peek after add")
        ow.test.assert(q.poll(), "b3", "Problem with $queue poll after second add")
        ow.test.assert(q.poll(), 4, "Problem with $queue poll after third add")
        ow.test.assert(q.size(), 0, "Problem with $queue size after all polls")
        ow.test.assert(q.poll(), null, "Problem with $queue poll after all polls")
        ow.test.assert(q.peek(), null, "Problem with $queue peek after all polls")
        ow.test.assert(q.isEmpty(), true, "Problem with $queue isEmpty after all polls")

        q.addAll([5, 6, 7])
        ow.test.assert(q.toArray(), [5.0, 6.0, 7.0], "Problem with $queue toArray")
        q.remove(6)
        ow.test.assert(q.toArray(), [5, 7], "Problem with $queue remove")
        ow.test.assert(q.has(5), true, "Problem with $queue has (1)")
        ow.test.assert(q.has(6), false, "Problem with $queue has (2)")
        ow.test.assert(q.has(7), true, "Problem with $queue has (3)")
    }

    exports.testCache = function() {
        $cache("cache")
        .fn((k) => {
            return merge(k, { "_T": nowUTC() });
        })
        .ttl(250)
        .create();

        var ini = $cache("cache").get({ a: 1 });
        ow.test.assert($cache("cache").get({ a: 1 })._T, ini._T, "Problem with immediate cache.");
        sleep(300, true);
        ow.test.assert($cache("cache").get({ a : 1})._T != ini._T, true, "Problem with cache timeout.");

        $cache("cache").destroy();

        // Create
        $cache("cache")
        .fn((k) => {
            return k;
        })
        .ttl(50)
        .inFile("autoTestAll.Cache.db")
        .create();

        // get some results in cache
        $cache("cache").get({ a: 1 });
        $cache("cache").get({ a: 2 });
        $cache("cache").get({ a: 3 });

        // let go
        $cache("cache").inFile("autoTestAll.Cache.db").destroy();

        io.rm("autoTestAll.Cache.db");
        // create again unsing file
        $cache("cache")
        .fn((k) => {
            return k;
        })
        .ttl(50)
        .inFile("autoTestAll.Cache.db")
        .create();

        // Check values
        ow.test.assert($cache("cache").get({ a: 2 }), { a: 2 }, "Problem storing cache.");

        $cache("cache").inFile("autoTestAll.Cache.db").destroy();
        io.rm("autoTestAll.Cache.db");
    };

    exports.testMerge = function() {
        var a = { a: 1, b: 2};
        var b = { b: 3, c: 1};
        
        ow.test.assert(merge(a, b), { a: 1, b: 3, c: 1}, "Didn't merge correctly a and b.");
        ow.test.assert(a, { a: 1, b: 2}, "After a,b merge a changed.");
        ow.test.assert(b, { b: 3, c: 1}, "After a,b merge b changed.");
        
        a = { a: 1, b: 2};
        b = { b: 3, c: 1};
        
        ow.test.assert(merge(b, a), { a: 1, b: 2, c: 1}, "Didn't merge correctly b and a.");
        ow.test.assert(a, { a: 1, b: 2}, "After b,a merge a changed.");
        ow.test.assert(b, { b: 3, c: 1}, "After b,a merge b changed.");    
    };

    exports.testShell = function() {
        var isWindows = java.lang.System.getProperty("os.name").match(/Windows/);
        //var cP = java.lang.System.getProperty("java.class.path") + "";
        var cP = "1234567890";
        var res = "";
        //var cs, c;

        if (isWindows) {
            //c = cP.replace(/.$/, "\?");
            res = sh("echo " + cP).replace(/[\n\r]/g, "");
        } else {
            //cs = cP.replace(/\\/g, "/");
            //c = cs.replace(/.$/, "\?");
            res = sh("echo " + cP).replace(/\n/g, "");
        }

        if (res != cP)
            throw "Shell result wasn't expected: '" + res + "' expected '" + cP + "'";
    };

    exports.testShellWithMap = function() {
        var isWindows = java.lang.System.getProperty("os.name").match(/Windows/);
        //var cP = java.lang.System.getProperty("java.class.path") + "";
        var cP = "1234567890";
        var res = "";
        //var cs, c;

        if (isWindows) {
            //c = cP.replace(/.$/, "\?");
            res = sh("echo " + cP, void 0, void 0, void 0, void 0, true);
        } else {
            //cs = cP.replace(/\\/g, "/");
            //c = cs.replace(/.$/, "\?");
            res = sh("echo " + cP, void 0, void 0, void 0, void 0, true);
        }
        if (res.stdout.replace(/[\n\r]/g, "") != cP && res.exitcode == 0 && res.stderr == "")
            throw "Shell result wasn't expected: '" + res + "' expected '" + cP + "'";
    };

    exports.testEncoding = function() {
        ow.test.assert(toEncoding("€", "UTF-8"), utf8("€"), "Problem with utf8 or toEncoding function.");        
    };

    exports.testFormatConversionBytes = function() {
        var testString = "This is a very nice test \"'?«»+*~^\\|!@#$%&/()=?}][{<>";
		var res = af.fromBytes2String(af.fromString2Bytes(testString));
		if (res != testString) {
			throw "result different: " + res;
		}
    };

    exports.testFormatConversionStream = function() {
        var str = "my test string where hi = olá";

        var istream = af.fromString2InputStream(str);
        var ostream = af.newOutputStream();
        ioStreamCopy(ostream, istream);
        ow.test.assert(String(ostream.toString()), str, "Problem with creating input stream from string");

        istream = af.fromBytes2InputStream(af.fromString2Bytes(str));
        ostream = af.newOutputStream();
        ioStreamCopy(ostream, istream);
        ow.test.assert(String(ostream.toString()), str, "Problem with creating input stream from an array of bytes");

        ow.test.assert(String(af.fromString2OutputStream(str).toString()), str, "Problem with converting string to an output stream");

        istream = af.fromString2InputStream(str);
        ow.test.assert(String(af.fromInputStream2String(istream)), str, "Problem with converting an input stream into a string");

        istream = af.fromString2InputStream(str);
        ow.test.assert(af.fromBytes2String(af.fromInputStream2Bytes(istream)), str, "Problem with converting an input stream into an array of bytes");
    };

    exports.testFormatConversionBase64 = function() {
		ow.test.assert(af.fromBytes2String(af.fromBase64(af.toBase64Bytes("OpenAF"))), "OpenAF", "Problem with af.fromBase64 or af.toBase64Bytes");        
    };

    exports.testObjectCompression = function() {
        var obj = { "a": 1, "b": 2, "c": 3 };
        
        var cobj = compress(obj);
        var uobj = uncompress(cobj);
    
        if (uobj.a != 1 || uobj.b != 2 || uobj.c != 3)
            throw "Something wrong with compressing and uncompressing objects.";        
    };

    exports.testRest = function() {
        var res = $rest({ 
            timeout: 1,
            default: { no: "way" }
        }).get("https://dns.google.com/resolv?" + $rest().query({ type: "a", name: "openaf.io" }));

        ow.test.assert(res, { no: "way" }, "Problem with rest timeout.");

        res = $rest({ 
            timeout: 2500,
            default: { no: "way" }
        }).get("https://dns.google.com/resolve?" + $rest().query({ type: "a", name: "openaf.io" }));

        ow.test.assert(isDef(res.Status), true, "Problem with rest call.");

        res = $rest({
            throwExceptions: false,
            default: { found: "n/a" }
        }).put("https://openaf.impossible.domain.local", { mission: "impossible" });

        ow.test.assert(res.found, "n/a", "Problem with throwExceptions.");

        res = $rest({
            preAction: (m) => {
                m.reqHeaders = {
                    openaf: "true"
                };
                return m;
            }
        }).get("https://postman-echo.com/get");
        ow.test.assert(res.headers.openaf, "true", "Problem with preAction.");
    };

    exports.testRest2Stream = function() {
        // TODO: 
    };

    exports.testRest2File = function() {
        // TODO: 
    };

    exports.testRestUpload = function() {
        // TODO: 
    };

    exports.testDoA2B = function() {
        ow.loadObj();
        var aa = $atomic(0), ab = $atomic(0);
        $doA2B((fn) => {
            var ii;
            for(var ii = 0; ii < 550; ii++) {
                fn(ii);
                aa.inc();
            }
            print("aa " + aa.get());
            print("ab " + ab.get());
        }, v => {
            if (!isNumber(v) && v <= 550) throw "Not a number"
            ab.inc();
            return true;
        }, __, __, e => {
            logErr(e)
            throw e
        });
        print("ab " + ab.get());
        ow.test.assert(ab.get(), 550, "Problem with do A2B.");
    };

    exports.testAwaitAll = function() {
        var p = [], c = $atomic(), r = $atomic()
        for(var i = 0; i < 2; i++) {
            p.push($do(() => {
                c.inc()
                $await("test").wait()
                r.inc()
            }))
        }

        do { sleep(50, true) } while(c.get() < 2)
        $await("test").notifyAll()
        $doWait($doAll(p))
   
        ow.test.assert(r.get(), 2, "Problem with await notifyAll.")
    }

    exports.testAwait = function() {
        sync(() => {
            var state = 0, err1, err2, ini = now()
            var p1 = $doV(() => {
                $await("testF").wait(30000)
                ow.test.assert(state, 1, "Problem with await (1)")
                //sleep(150, true);
                $await("test1").notify()
                $await("testF2").wait(30000)
                ow.test.assert(state, 2, "Problem with await (2)")
            }).catch(e => {
                err1 = e;
            })
            
            while(p1 == 0 && !p1.executing && now() - ini < 60000) sleep(50, true)
    
            var p2 = $doV(() => {
                state = 1
                $await("testF").notify()
                $await("test1").wait(5000)
                state = 2
                $await("testF2").notify()
            }).catch(e => {
                err2 = e;
            });
    
    
            $doWait($doAll([p1, p2]));
            if (isDef(err1)) throw err1;
            if (isDef(err2)) throw err2;

            $await("testF").destroy()
            $await("testF2").destroy()
        })
    };

    exports.testRetry = function() {
        var c = 0;
        $retry(() => {
            c++;
            throw "AI";
        }, 3);

        ow.test.assert(c, 3, "Problem with retry if all fail.");

        c = 0;
        $retry(() => {
            c++;
        }, 3);

        ow.test.assert(c, 1, "Problem with retry if it's successfull.");

        c = 0;
        var shouldError = true;
        $retry(() => {
            c++;
            if (shouldError) throw "AI";
        }, (e) => {
            if (String(e) == "AI") shouldError = false;
            return true;
        });

        ow.test.assert(c, 2, "Problem with retry if it tries to use a function (1).");

        c = 0;
        shouldError = true;
        $retry(() => {
            c++;
            if (shouldError) throw "AI";
        }, (e) => {
            if (String(e) == "AI") shouldError = false;
            return false;
        });

        ow.test.assert(c, 1, "Problem with retry if it tries to use a function (2).");
    };

    exports.testTB = function() {
        var __state = 0, err;

        $tb()
        .timeout(100)
        .exec(() => {
            try {
                __state = 1;
                sleep(200, true);
                __state = 2;
            } catch(e) {
                err = e;
            }
        });

        if (isDef(err)) throw err;
        ow.test.assert(__state, 1, "Problem with threadBox timeout (1).");

        __state = 0;
        $tb()
        .timeout(250)
        .exec(() => {
            try {
                __state = 1;
                sleep(200, true);
                __state = 2;
            } catch(e) {
                err = e;
            }
        });

        if (isDef(err) && !(err.javaException instanceof java.lang.InterruptedException)) throw err;
        ow.test.assert(__state, 2, "Problem with threadBox timeout (2).");

        __state = 0;
        $tb()
        .stopWhen((v) => {
            if (__state > 0) return true;
        })
        .exec(() => {
            try {
                __state = 1;
                sleep(100, true);
                __state = 2;
            } catch(e) {
                err = e;
            }
        });

        if (isDef(err) && !(err.javaException instanceof java.lang.InterruptedException)) throw err;
        ow.test.assert(__state, 1, "Problem with stopWhen.");
    };

    exports.testDo = function() {
        var success = false;
        $doWait($do((s, f) => {
            success = true;
            s(true);
            return true;
        }));

        ow.test.assert(success, true, "Problem with simple $do");

        success = false;
        $doWait($do((s, f) => {
            success = false;
            s(123);
        }).then((v) => {
            if (v == 123) success = true;
            return v;
        }));

        ow.test.assert(success, true, "Problem with $do().then() using onFullfilment");

        success = false;
        $doWait($do((s, f) => {
            success = false;
            return 123;
        }).then((v) => {
            if (v == 123) success = true;
            return v;
        }));

        ow.test.assert(success, true, "Problem with $do().then() using return");

        success = true;
        $doWait($do((s, f) => {
            success = true;
            f(123);
            return true;
        }).then((v) => {
            if (v == 123) success = true;
            return v;
        }).catch((r) => {
            if (r == 123) success = false;
        }));

        ow.test.assert(success, false, "Problem with $do().then().catch() using onReject");

        success = true;
        $doWait($do((s, f) => {
            success = true;
            throw 123;
        }).then((v) => {
            if (v == 123) success = true;
            return v;
        }).catch((r) => {
            if (String(r) == 123) success = false;
        }));

        ow.test.assert(success, false, "Problem with $do().then().catch() using throw");

        success = true;
        var res = false;
        $doWait($do(() => {
            success = true;
            return success;
        }).then((v) => {
            if (v) success = true; else success = false;
            return v;
        }).catch((r) => {
            if (r == 123) res = true; else res = false;
        }).then((v) => {
            if (!v) success = false; else success = true;
            throw 123;
        }).catch((r) => {
            if (r == 123) res = false; else res = true;
        }));

        ow.test.assert(res, false, "Problem with multiple $do().then().catch()");
    };

    exports.testDoCancel = function() {
        var interrupted = $atomic(false, "boolean")
        var cancelled = $atomic(false, "boolean")
        var start = now()

        var p = $do(() => {
            while(true) {
                sleep(1000, true)
                if ((now() - start) > 5000) throw "timeout"
            }
        }).catch((reason) => {
            if (String(reason) == "cancelled" || String(reason).toLowerCase().indexOf("interrupted") >= 0) {
                cancelled.set(true)
                interrupted.set(true)
            }
            $await("testDoCancel").notify()
        })

        $doWait(p, 1500)
        var cRes = p.cancel("cancelled")
        $await("testDoCancel").wait(2000)

        ow.test.assert(cRes, true, "Problem cancelling $do");
        ow.test.assert(interrupted.get(), true, "Problem interrupting $do thread")
        ow.test.assert(cancelled.get(), true, "Problem propagating $do cancellation")
    };

    exports.testDoVCancel = function() {
        var interrupted = $atomic(false, "boolean");
        var cancelled = $atomic(false, "boolean");
        var start = now();

        var p = $doV(() => {
            while(true) {
                sleep(1000, true)
                if ((now() - start) > 5000) throw "timeout"
            }
        }).catch((reason) => {
            if (String(reason) == "cancelled" || String(reason).toLowerCase().indexOf("interrupted") >= 0) {
                cancelled.set(true)
                interrupted.set(true)
            }
            $await("testDoVCancel").notify()
        })

        $doWait(p, 1500)
        var cRes = p.cancel("cancelled")
        $await("testDoVCancel").wait(2000)

        ow.test.assert(cRes, true, "Problem cancelling $doV");
        ow.test.assert(interrupted.get(), true, "Problem interrupting $doV thread");
        ow.test.assert(cancelled.get(), true, "Problem propagating $doV cancellation");
    };

    exports.testDoAll = function() {
        var success = [];

        $doWait($doAll([
            1,
            $do((s, f) => {
                s(2);
            })
        ]).then((values) => {
            if (compare(values, [1, 2])) success = values;
            return values;
        }));

        ow.test.assert(success.sort(), [1, 2], "Problem with $doAll()");

        var res = false;
        $doWait($doAll([
            1,
            $do((s, f) => {
                f(2);
            })
        ]).then((values) => {
            if (compare(values, [1, 2])) success = values;
            return values;
        }).catch((reason) => {
            if (reason == 2) res = true;
        }));

        ow.test.assert(res, true, "Problem with $doAll().catch()");
    };

    exports.testDoFirst = function() {
        var success = 0;

        $doWait($doFirst([
            1,
            $do((s, f) => {
                sleep(50);
                s(2);
            })
        ]).then((value) => {
            if (value == 1) success = 1;
            return value;
        }));

        sleep(50);
        ow.test.assert(success, 1, "Problem with $doFirst()");

        var res = false;
        $doWait($doFirst([
            $do((s, f) => {
                sleep(50);
                f(2);
            })
        ]).then((values) => {
            if (compare(values, [1, 2])) success = values;
            return values;
        }).catch((reason) => {
            if (reason == 2) res = true;
        }));

        sleep(50);
        ow.test.assert(res, true, "Problem with $doFirst().catch()");
    };    

    exports.testParallel = function() {
        // Array parallel processing
        //
        var arr = [];
        for(var i = 0; i < 1000; i++) { arr.push(i); }

        var res = parallelArray(arr,
            function(pr,cr,ir,ar) {
                return cr + pr;
            },
            0,
            function(ar) {
                var sum = 0;
                for(var i in ar) {
                    sum += ar[i];
                }
                return sum;
            }
        );

        if (res != 499500)
            throw "Something wrong with the parallel processing of an array.";

        // Simple array parallel processing
        //
        arr = [];
        var ctrl;
        var count = 0;
        for(var i = 0; i < 1000; i++) { arr.push(i); }

        res = parallel4Array(arr, function(aValue) {
            ctrl.__threads.sync(function() { count++; });
            return aValue;
        },
        undefined,
        ctrl);

        ow.test.assert(res.length, count, "Problem with parallel4Array.");

        // Parallel processing
        //
        var c = 0
        res = parallel(uuid => uuid, 5, r => r.length)

        if (res != 5)
            throw "Something wrong with the parallel processing.";
    };

    exports.testCrypt = function() {
        var res1 = af.crypt("secret", "$1$xxxx");
        var res2 = af.crypt("secret", "xx");

        ow.test.assert(res1, "$1$xxxx$aMkevjfEIpa35Bh3G4bAc.", "Problem with crypt for MD5");
        ow.test.assert(res2, "xxWAum7tHdIUw", "Problem with crypt for DES");
    };

    exports.testEncryptDecrypt = function() {
        var res1 = "My very secret sentence.";

        ow.test.assert(af.decrypt(af.encrypt(res1, "openappframework"), "openappframework"), res1, "Problem with default encrypt/decrypt.");
        ow.test.assert(af.decrypt(af.encrypt(res1, "1234567890123456"), "1234567890123456"), res1, "Problem with custom encrypt/decrypt.");
    };

    exports.testPForEach = function() {
        var files = listFilesRecursive("..")
        var res = pForEach(files, r => {
            return r.isFile ? 1 : 0
        })
        ow.test.assert($from(res).count(), files.length, "Problem with pForEach (1)")
        ow.test.assert($from(res).sum(), $from(files).equals("isFile", true).count(), "Problem with pForEach (2)")

        files = io.listFiles(".").files
        res = pForEach(files, r => {
            return r.isFile ? 1 : 0
        })
        ow.test.assert($from(res).count(), files.length, "Problem with pForEach (3)")
        ow.test.assert($from(res).sum(), $from(files).equals("isFile", true).count(), "Problem with pForEach (4)")
    }

    exports.test2FA = function() {
        ow.loadFormat();

        var code = af.create2FACredentials("test", "openaf");
        var init = new Date();

        var token = af.get2FAToken(code.encryptedKey);

        ow.test.assert(af.validate2FA(code.encryptedKey, token), true, "Problem while validating a 2FA generated " + ow.format.timeago(init).toLowerCase());
        ow.test.assert(af.validate2FA(code.encryptedKey, token + 1), false, "Problem while validating a wrong 2FA key generated " + ow.format.timeago(init).toLowerCase());
    };

    exports.testJavaRegExp = function() {
        var text = "This is a test within a Test";

        ow.test.assert(text.match(/test/i)[0], javaRegExp(text).match("test", "i")[0], "Problem with javaRegExp match");
        ow.test.assert(text.match(/test/ig)[0], javaRegExp(text).match("test", "ig")[0], "Problem with javaRegExp match with g modifier");
        ow.test.assert(text.match(/test/ig)[0], javaRegExp(text).matchAll("test", "i")[0], "Problem with javaRegExp matchAll");
        ow.test.assert(text.replace(/test/i, "dump"), javaRegExp(text).replace("test", "dump", "i"), "Problem with javaRegExp replace");
        ow.test.assert(text.replace(/test/ig, "dump"), javaRegExp(text).replace("test", "dump", "ig"), "Problem with javaRegExp replace with g modifier");
        ow.test.assert(new RegExp("test", "i").test(text), javaRegExp(text).test("test", "i"), "Problem with javaRegExp test");

        javaRegExp().preCompile("test", "i");
        ow.test.assert(text.match(/test/i)[0], javaRegExp(text).match("test", "i")[0], "Problem with javaRegExp match (precompiled)");
        ow.test.assert(text.match(/test/ig)[0], javaRegExp(text).match("test", "ig")[0], "Problem with javaRegExp match with g modifier (precompiled)");
        ow.test.assert(text.match(/test/ig)[0], javaRegExp(text).matchAll("test", "i")[0], "Problem with javaRegExp matchAll (precompiled)");
        ow.test.assert(text.replace(/test/i, "dump"), javaRegExp(text).replace("test", "dump", "i"), "Problem with javaRegExp replace (precompiled)");
        ow.test.assert(text.replace(/test/ig, "dump"), javaRegExp(text).replace("test", "dump", "ig"), "Problem with javaRegExp replace with g modifier (precompiled)");
        ow.test.assert(new RegExp("test", "i").test(text), javaRegExp(text).test("test", "i"), "Problem with javaRegExp test (precompiled)");
        javaRegExp().removePreCompiled("test", "i");

        ow.test.assert(text.split(/test/i)[0], javaRegExp(text).split("test", "i")[0], "Problem with javaRegExp split");
    };

    exports.testYAML = function() {
        var r = {
            a: 1,
            b: "123",
            c: true,
            d: [ 1, 2, 3],
            e: {
                a: 1,
                b: "123",
                c: true
            }
        };

        ow.test.assert(af.toYAML(r), "a: 1\nb: '123'\nc: true\nd:\n- 1\n- 2\n- 3\ne:\n  a: 1\n  b: '123'\n  c: true\n", "Problem converting to yaml.");
        ow.test.assert(af.fromYAML("a: 1\nb: '123'\nc: true\nd:\n- 1\n- 2\n- 3\ne:\n  a: 1\n  b: '123'\n  c: true\n"), r, "Problem converting from yaml.");
    };

    exports.testXML2And4Obj = function() {
        var orig = { 
            something: { 
                a: "abc123", 
                b: [ 
                    { 
                        item: { 
                            x: "123", 
                            y: "-123" 
                        }
                    }, 
                    { 
                        item: { 
                            x: "2" 
                        }
                    }, { 
                        item: { 
                            x: "3" 
                        }
                    }
                ], 
                c: "1" 
            }
        };

        var dest = af.fromXML2Obj(af.fromObj2XML(orig));
        ow.test.assert(dest, orig, "Problem with conversion between javascript and XML.");
    };

    exports.testMap22Array = function() {
        ow.test.assert($m2a(['a', 'b', 'c'], { a: 1, b: 2, c: 3}), [1, 2, 3], "Problem with $m2a.");
        ow.test.assert($a2m(['a', 'b', 'c'], [1, 2, 3]), { a: 1, b: 2, c: 3 }, "Problem with $a2m.");
        ow.test.assert(stringify(sortMapKeys({c:1, a:2, b:3 }), void 0, ""), "{\"a\":2,\"b\":3,\"c\":1}", "Problem with sortMapKeys.");

        ow.loadObj();
        var fnargs = $fnDef4Help("ow.obj.rest.jsonGet");
        ow.test.assert(fnargs, ["aBaseURI","aIndexMap","aLoginOrFunction","aPassword","aTimeout","aRequestMap","aHTTP", "retBytes", "options"], "Problem with getting arguments from help using $fnDef4Help.");

        var res = $fnM2A(ow.obj.rest.jsonGet, ow.obj.rest, fnargs, { aBaseURI: "https://postman-echo.com/get" });
        ow.test.assert(res.url, "https://postman-echo.com/get", "Problem with $fnM2A.");

        res = $fnM("ow.obj.rest.jsonGet", { aBaseURI: "https://postman-echo.com/get" });
        ow.test.assert(res.url, "https://postman-echo.com/get", "Problem with $fnM.");
    };

    exports.testVoidShortcut = function() {
        ow.test.assert(__, void 0, "Problem with shortcut __");
    };

    exports.testEnvs = function() {
        var envsList = getEnvs();
        var testEnv = Object.keys(envsList)[0];
        var testVal = envsList[testEnv];

        ow.test.assert(testVal, getEnv(testEnv), "Problem with getEnvs/getEnv.");
        ow.test.assert(getEnv(genUUID()), __, "Problem with getEnv not defined.");
    };

    exports.testGetPath = function() {
        ow.loadObj();

        var a = { a : 1, b : { c: 2, d: [0, 1] } };

        ow.test.assert($$(a).get("b.c"), 2, "Problem with retrieving a number with $$().get()");
        ow.test.assert($$(a).get("b.d"), [0, 1], "Problem with retrieving an array with $$().get()");
        ow.test.assert($$(a).get("b.d[0]"), 0, "Problem with retrieving an element of an array with $$().get()");
    };

     exports.testSetPath = function() {
        ow.loadObj();

        var a = { a : 1, b : { c: 2, d: [0, 1] } };

        ow.test.assert($$($$(a).set("b.c", 1234)).get("b.c"), 1234, "Problem with retrieving a number after $$().set()");
        ow.test.assert($$($$(a).set("b.d", [ 0, 1, 2 ])).get("b.d"), [0, 1, 2], "Problem with retrieving an array after $$().set()");
        ow.test.assert($$($$(a).set("b.d[0]", 4321)).get("b.d[0]"), 4321, "Problem with retrieving an element of an array after $$().set()");
    };       

    exports.testSearchKeyAndValues = function() {
        var a = { abc: 123, m: { xpto: 2, arr: [ { bbb: 1 }, { bbb: 2}]}, o: "oi"};

        ow.test.assert(searchKeys(a, "xpto"), { ".m.xpto": 2 }, "Problem with searching a simple key.");
        ow.test.assert(searchKeys(a, "bbb"), {
            ".m.arr[0].bbb": 1,
            ".m.arr[1].bbb": 2
        }, "Problem with searching a key inside an array.");

        ow.test.assert(searchValues(a, "123"), { ".abc": 123 }, "Problem with searching a simple value.");
        ow.test.assert(searchValues(a, "2"), { ".abc": 123, ".m.xpto": 2, ".m.arr[1].bbb": 2 }, "Problem with searching multiple values.");

        searchKeys(a, "xpto", void 0, (k, v, p) => { ow.obj.setPath(a, p + "." + k, "AI!"); });
        ow.test.assert(a.m.xpto, "AI!", "Problem with function on searchKeys.");

        searchValues(a, "oi", void 0, (k, v, p) => { ow.obj.setPath(a, p + "." + k, 456); });
        ow.test.assert(a.o, 456, "Problem with function on searchValues.");
    };

    exports.testSQL = function() {
        var a = [
            { id: 1, f: true,  t: "even" },
            { id: 2, f: false, t: "odd"  },
            { id: 3, f: true,  t: "even" },
            { id: 4, f: false, t: "odd"  }
        ]

        ow.test.assert($sql(a, "select id", "nlinq").length, 4, "Problem with nlinq $sql (1)")
        ow.test.assert($sql(a, "select id where t = 'even'", "nlinq").length, 2, "Problem with nlinq $sql (2)")

        ow.test.assert($sql(a, "select count(1) \"C\"")[0].C, "4", "Problem with h2 $sql (1)")
        ow.test.assert($sql(a, "select count(1) \"C\" where t = 'even'")[0].C, "2", "Problem with h2 $sql (2)")

        ow.test.assert($sql().sql("select count(1) \"A\", true \"B\", 'test' \"C\", 123 \"D\""), [{A: "1", B: true, C: "test", D: 123}], "Problem with h2 $sql (3)")
        ow.test.assert($sql().table("a", a).table("b", $from(a).equals("t", "even").select()).sql("select CNTE, CNTO from (select count(1) cntE from a where t = 'even') E, (select count(1) cntO from b where t= 'odd') O"), [{CNTE: "2", CNTO: "0"}], "Problem with h2 $sql (4)")
    }

    exports.testNDJSON = function() {
        var o = [];
        var filename = "autoTest.ndjson";
        o.push({ a: 1, b: true, c: "test 1"});
        o.push({ a: 2, b: false, c: "test 2"});
        o.push({ a: 3, b: true, c: "test 3"});

        io.rm(filename);
        for(var oo in o) {
            io.writeLineNDJSON(filename, o[oo]);
        }

        var r = [];
        io.readLinesNDJSON(filename, (obj) => {
            r.push(o);
        });
        io.rm(filename);
    };

    exports.testMapArray = function() {
        var o = [];
        o.push({ a: 1, b: true, c: "test 1"});
        o.push({ a: 2, b: false, c: "test 2"});
        o.push({ a: 3, b: true, c: "test 3"});

        var r = mapArray(o, ["a", "b"]);
        ow.test.assert(r.length, 3, "Problem with mapArray returning the full original array");
        ow.test.assert(isDef(r[0].c), false, "Problem with mapArray selectors (1)");
        ow.test.assert(isDef(r[0].b), true, "Problem with mapArray selectors (2)");

        var r2 = mapArray(o, ["a", "c"], 1);
        ow.test.assert(r2.length, 1, "Problem with mapArray returning the full original array limited");
        ow.test.assert(isDef(r2[0].b), false, "Problem with mapArray selectors (1) limited");
        ow.test.assert(isDef(r2[0].a), true, "Problem with mapArray selectors (2) limited");
    };

    exports.testIsFunctions = function() {
        ow.test.assert(isArray([1, 2, 3]), true, "Failed to identify an array.");
        ow.test.assert(isBinaryArray([1, 2, 3]), true, "Failed to identify a binary array.");
        ow.test.assert(isBinaryArray([32, 32, 32]), false, "Failed to negatively identify a binary array.");
        ow.test.assert(isBoolean(true), true, "Failed to identify a boolean value.");
        ow.test.assert(isDate(new Date()), true, "Failed to identify a date.");
        ow.test.assert(isFunction(isFunction), true, "Failed to identify a function.");
        ow.test.assert(isJavaObject(new java.lang.String()), true, "Failed to identify a java object.");
        ow.test.assert(isMap({}), true, "Failed to identify a map.");
        ow.test.assert(isNumber(123), true, "Failed to identify a number.");
        ow.test.assert(isObject({}), true, "Failed to identify an object.");
        ow.test.assert(isString("hello"), true, "Failed to identify a string.");
        ow.test.assert(isNull(null), true, "Failed to identify a null.");
    };

    exports.testDescType = function() {
        ow.test.assert(descType([1,2,3]), "array", "(descType) Failed to identify an array.");
        ow.test.assert(descType(true), "boolean", "(descType) Failed to identify a boolean value.");
        ow.test.assert(descType(new Date()), "date", "(descType) Failed to identify a date.");
        ow.test.assert(descType(isFunction), "function", "(descType) Failed to identify a function.");
        ow.test.assert(descType(new java.lang.String()), "java", "(descType) Failed to identify a java object.");
        ow.test.assert(descType({}), "map", "(descType) Failed to identify a map.");
        ow.test.assert(descType(123), "number", "(descType) Failed to identify a number.");
        ow.test.assert(descType("hello"), "string", "(descType) Failed to identify a string.");
        ow.test.assert(descType(null), "null", "(descType) Failed to identify a null.");        
    };

    exports.testAFParse = function() {
        var ar = af.parse("(function() { a = a + 1; return a })()", "test")
        ow.test.assert(ar.length, 1, "Problem with simple AF JS parse.")

        ar = af.parse("test1 = () => 123\ntest4 = () => 456\ntest7 = () => 789")
        ow.test.assert(ar.length, 3, "Problem with multiple lines AF JS parse.")
        ow.test.assert(ar[0].indexOf("123") > 0 && ar[2].indexOf("789") > 0, true, "Problem with AF parsing")
    }

    exports.testAFScopeIds = function() {
        var ar = af.fromJavaArray( af.getScopeIds() ).map(s=>String(s))

        ow.test.assert(ar.length > 0, true, "Problem on get scope ids (1).")
        ow.test.assert(ar.indexOf("print") > 0, true, "Problem on get scope ids (2).")
    }

    exports.testSigil = function() {
        var res;

        try { res = false; var aaabbb; _$(aaabbb).$_(); } catch(e) { res = true; }
        ow.test.assert(res, true, "Problem with mandatory.");
        try { res = false; var aaabbb; res = _$(aaabbb).default(true); } catch(e) { res = true; }
        ow.test.assert(res, true, "Problem with default.");

        try { res = false; _$("123").isTNumber(); } catch(e) { res = true; }
        ow.test.assert(res, true, "Problem with isTNumber (1).");

        try { res = false; _$(123).isTNumber(); } catch(e) { res = true; }
        ow.test.assert(res, false, "Problem with isTNumber (2).");

        try { res = false; _$("a").Number(); } catch(e) { res = true; }
        ow.test.assert(res, true, "Problem with Number (1).");

        try { res = false; _$(123).Number(); } catch(e) { res = true; }
        ow.test.assert(res, true, "Problem with Number (2).");

        try { res = false; _$(123).isString(); } catch(e) { res = true; }
        ow.test.assert(res, true, "Problem with isString (1).");

        try { res = false; _$("123").isString(); } catch(e) { res = true; }
        ow.test.assert(res, false, "Problem with isString (2).");

        try { res = false; _$(3).between(1, 3); } catch(e) { res = true; }
        ow.test.assert(res, true, "Problem with between (1).");

        try { res = false; _$(2).between(1, 3); } catch(e) { res = true; }
        ow.test.assert(res, false, "Problem with between (2).");

        try { res = false; _$(3).betweenEquals(1, 3); } catch(e) { res = true; }
        ow.test.assert(res, false, "Problem with betweenEquals (1).");

        try { res = false; _$(4).betweenEquals(1, 3); } catch(e) { res = true; }
        ow.test.assert(res, true, "Problem with betweenEquals (2).");

        try { res = false; _$(3).oneOf([1, 2, 3]); } catch(e) { res = true; }
        ow.test.assert(res, false, "Problem with oneOf (1).");

        try { res = false; _$(4).oneOf([1, 2, 3]); } catch(e) { res = true; }
        ow.test.assert(res, true, "Problem with oneOf (2).");

        try { res = false; _$([1, 2]).anyOf([1, 2, 3]); } catch(e) { res = true; }
        ow.test.assert(res, false, "Problem with anyOf (1).");

        try { res = false; _$([1, 4]).anyOf([1, 2, 3]); } catch(e) { res = true; }
        ow.test.assert(res, true, "Problem with anyOf (2).");

        try { res = false; _$([1, 2]).isArray(); } catch(e) { res = true; }
        ow.test.assert(res, false, "Problem with isArray (1).");

        try { res = false; _$(4).isArray(); } catch(e) { res = true; }
        ow.test.assert(res, true, "Problem with isArray (2).");

        try { res = false; _$(genUUID()).isUUID(); } catch(e) { res = true; }
        ow.test.assert(res, true, "Problem with isUUID (1).");

        try { res = false; _$("1" + genUUID()).isUUID(); } catch(e) { res = true; }
        ow.test.assert(res, false, "Problem with isUUID (2).");

        try { res = false; _$(4).expr("{{v}} > 0 && {{v}} < 5 && {{v}} != 3"); } catch(e) { res = true; }
        ow.test.assert(res, false, "Problem with expr (1).");

        try { res = false; _$(3).expr("{{v}} > 0 && {{v}} < 5 && {{v}} != 3"); } catch(e) { res = true; }
        ow.test.assert(res, true, "Problem with expr (2).");

        try { res = false; _$(4).check(v => { return v - 4 == 0; }); } catch(e) { res = true; }
        ow.test.assert(res, false, "Problem with check (1).");

        try { res = false; _$(3).check(v => { return v - 4 == 0; }); } catch(e) { res = true; }
        ow.test.assert(res, true, "Problem with check (2).");

        // Conversion
        try { res = _$("123 ").toNumber().isNumber().$_() } catch(e) { res = __ }
        ow.test.assert(res, 123, "Problem with toNumber (1)")

        try { res = _$("1o3").toNumber().isNumber().$_() } catch(e) { res = __ }
        ow.test.assert(res, __, "Problem with toNumber (2)")

        try { res = _$(12.34).toString().isString().$_() } catch(e) { res = __ }
        ow.test.assert(res, "12.34", "Problem with toString (1)")

        try { res = _$(" trUe ").toBoolean().isBoolean().$_() } catch(e) { res = __ }
        ow.test.assert(res, true, "Problem with toBoolean (1)")

        try { res = _$(" 45, 32, , 1a2 ").toArray().isArray().$_() } catch(e) { res = __ }
        ow.test.assert(res, ["45","32","","1a2"], "Problem with toArray (1)")

        try { res = _$(" { a: 12, b: true, c: 'abc' }").toMap().isMap().$_() } catch(e) { res = __ }
        ow.test.assert(res, {a:12,b:true,c:'abc'}, "Problem with toMap (1)")
    };
})();
