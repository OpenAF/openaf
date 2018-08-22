(function() {
    exports.testGetVersion = function() {
        print(getVersion());
    };

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
        arr = [];
        for(var i = 0; i < 1000; i++) { arr.push(i); }

        res = parallel(
            function(uuid, t)  {
                var sum = 0;
                while(arr.length > 0) {
                    var val;
                    sync(() => { val = arr.pop(); }, arr);
                    sum += (isDefined(val) ? val : 0);
                }
                log("Thread: " + uuid + "; " + sum);
                return sum;
            }, undefined,
            function(ar) {
                var sum = 0;
                for(var i in ar) {
                    sum += ar[i];
                }
                return sum;
            }
        );

        if (res != 499500)
            throw "Something wrong with the parallel processing.";
    };

    exports.testCSV = function() {
        var csvString = "A;B;C\r\n1;a;\"b\"\n2;1;\"2\"";
        var csv = new CSV(csvString);
        if (csv.csv()[0].A != 1 ||
            csv.csv()[0].B != 'a' ||
            csv.csv()[0].C != 'b') throw "Failed CSV generation on constructor!";
        var csvString = "A;B;C\n1;\"a\";\"b\"\n2;\"1\";\"2\"";
        if(csv.w().replace(/\r/g, "") !== csvString) throw "Failed to convert CSV back to string!";
    
        var csvObj = csv.csv();
        csv.clear();
        csv.toCsv(csvObj);
        if (csv.csv()[0].A != 1 ||
            csv.csv()[0].B != 'a' ||
            csv.csv()[0].C != 'b') throw "Failed CSV generation on toCsv!";    
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

        ow.test.assert(af.toYAML(r), "a: 1\nb: '123'\nc: true\nd:\n  - 1\n  - 2\n  - 3\ne:\n  a: 1\n  b: '123'\n  c: true\n", "Problem converting to yaml.");
        ow.test.assert(af.fromYAML("a: 1\nb: '123'\nc: true\nd:\n  - 1\n  - 2\n  - 3\ne:\n  a: 1\n  b: '123'\n  c: true\n"), r, "Problem converting from yaml.");
    };

    exports.testGetPath = function() {
        ow.loadObj();

        var a = { a : 1, b : { c: 2, d: [0, 1] } };

        ow.test.assert($$(a).get("b.c"), 2, "Problem with retriving a number with $$().get()");
        ow.test.assert($$(a).get("b.d"), [0, 1], "Problem with retriving an array with $$().get()");
        ow.test.assert($$(a).get("b.d[0]"), 0, "Problem with retriving an element of an array with $$().get()");
    };

     exports.testSetPath = function() {
        ow.loadObj();

        var a = { a : 1, b : { c: 2, d: [0, 1] } };

        ow.test.assert($$($$(a).set("b.c", 1234)).get("b.c"), 1234, "Problem with retriving a number after $$().set()");
        ow.test.assert($$($$(a).set("b.d", [ 0, 1, 2 ])).get("b.d"), [0, 1, 2], "Problem with retriving an array after $$().set()");
        ow.test.assert($$($$(a).set("b.d[0]", 4321)).get("b.d[0]"), 4321, "Problem with retriving an element of an array after $$().set()");
    };       

    exports.testSearchKeyAndValues = function() {
        var a = { abc: 123, m: { xpto: 2, arr: [ { bbb: 1 }, { bbb: 2}]}};

        ow.test.assert(searchKeys(a, "xpto"), { ".m.xpto": 2 }, "Problem with searching a simple key.");
        ow.test.assert(searchKeys(a, "bbb"), {
            ".m.arr[0].bbb": 1,
            ".m.arr[1].bbb": 2
        }, "Problem with searching a key inside an array.");

        ow.test.assert(searchValues(a, "123"), { ".abc": 123 }, "Problem with searching a simple value.");
        ow.test.assert(searchValues(a, "2"), { ".abc": 123, ".m.xpto": 2, ".m.arr[1].bbb": 2 }, "Problem with searching multiple values.");
    };

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
})();