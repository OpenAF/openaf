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
                    t.sync(function() { val = arr.pop(); });
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
})();