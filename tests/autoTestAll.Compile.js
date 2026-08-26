// Copyright 2023 Nuno Aguiar

(function() {
    var __compileScratch = "autoTestAll.compile.tmp/";

    var __resetScratch = function() {
        io.rm(__compileScratch);
        io.mkdir(__compileScratch);
    };

    exports.testLoadCompiledRoundTrip = function() {
        __resetScratch();
        var file = __compileScratch + "compA.js";
        io.writeFileString(file, "var __compATestVal = function(x) { return x * 2; }");

        var r = loadCompiled(file, false, false);
        ow.test.assert(r, true, "loadCompiled should report true on first compile+load.");
        ow.test.assert(__compATestVal(21), 42, "Compiled function didn't return the expected value.");

        var files = io.listFiles(__compileScratch + ".openaf_precompiled").files.map(f => f.filename);
        ow.test.assert(files.filter(f => f.endsWith(".jar")).length, 1, "Expected exactly one .jar artifact per compilation.");

        io.rm(__compileScratch);
    };

    // Regression test for two bugs that were live before this session's fixes:
    // (1) A single string literal over the JVM's 65535-byte constant-pool UTF8 limit made
    //     ClassCompiler throw "IllegalArgumentException: Too big string" during compilation -
    //     CompileJS2Java's splitLongStrings() breaks it into a join() of smaller chunks first.
    // (2) Rhino 1.9.1's ClassCompiler under-reports max_locals in the generated "<X>Main" descriptor
    //     builder, so simply loading *any* compiled class - regardless of size - threw
    //     "VerifyError: Local variable table overflow" until the fix scoped the max_locals floor to
    //     that class only (see CLASSGEN-PLAN.md). dontLoad=false below exercises that load, not just
    //     the compile.
    exports.testLoadCompiledLargeScript = function() {
        __resetScratch();
        var file = __compileScratch + "compBig.js";

        var bigLiteral = "x".repeat(70000);
        ow.test.assert(bigLiteral.length > 65535, true, "Test setup error: literal isn't actually large enough.");
        var body = "var __compBigTestVal = function() { return \"" + bigLiteral + "\".length; }\n";

        io.writeFileString(file, body);
        var r = loadCompiled(file, false, false);
        ow.test.assert(r, true, "loadCompiled should succeed (compile AND load) on a >65535-byte string literal.");
        ow.test.assert(__compBigTestVal(), 70000, "Large compiled script didn't run correctly.");

        io.rm(__compileScratch);
    };

    exports.testRequireCompiledRoundTrip = function() {
        __resetScratch();
        var file = __compileScratch + "modA.js";
        io.writeFileString(file, "exports.f = function(x) { return x + 100; }");

        var mod = requireCompiled(file, false, false);
        ow.test.assert(mod.f(5), 105, "requireCompiled module export didn't behave as expected.");

        io.rm(__compileScratch);
    };

    exports.testLoadCompiledStaleRecompile = function() {
        __resetScratch();
        var file = __compileScratch + "compC.js";
        io.writeFileString(file, "var __compCTestVal = 1;");
        loadCompiled(file, false, false);
        ow.test.assert(__compCTestVal, 1, "Initial compile didn't set expected value.");

        var artifact = __compileScratch + ".openaf_precompiled/compC_js.jar";
        var beforeMs = io.fileInfo(artifact).lastModified;

        java.lang.Thread.sleep(1100);
        io.writeFileString(file, "var __compCTestVal = 2;");
        var r = loadCompiled(file, false, false);
        ow.test.assert(r, true, "loadCompiled should report true after a stale recompile.");
        ow.test.assert(__compCTestVal, 2, "Recompiled script didn't pick up the updated source.");

        var afterMs = io.fileInfo(artifact).lastModified;
        ow.test.assert(afterMs >= beforeMs, true, "Artifact wasn't rewritten on recompile.");

        io.rm(__compileScratch);
    };

    exports.testLoadCompiledPurgesStaleLayout = function() {
        __resetScratch();
        var file = __compileScratch + "compD.js";
        io.writeFileString(file, "var __compDTestVal = 7;");

        // Simulate a leftover directory from the old loose-.class layout / a different OpenAF
        // version: present, but without this version's marker file.
        var precompiled = __compileScratch + ".openaf_precompiled";
        io.mkdir(precompiled);
        io.writeFileString(precompiled + "/compD_js.class", "not a real class file");

        var r = loadCompiled(file, false, false);
        ow.test.assert(r, true, "loadCompiled should recompile past a stale/foreign precompiled layout.");
        ow.test.assert(__compDTestVal, 7, "Compiled function value wrong after purging a stale layout.");

        var files = io.listFiles(precompiled).files.map(f => f.filename);
        ow.test.assert(files.indexOf("compD_js.class") < 0, true, "Stale loose .class file should have been purged.");
        ow.test.assert(files.filter(f => f.endsWith(".jar")).length, 1, "Expected exactly one .jar artifact after purge+recompile.");

        io.rm(__compileScratch);
    };

    // Regression test for scoping the max_locals floor to the "<X>Main" descriptor builder instead of
    // every generated class: applying it everywhere (as before) inflated every JVM stack frame and
    // cut recursion depth by ~15-20x versus interpreted code (measured ~200 vs ~3000+ frames).
    exports.testLoadCompiledRecursionDepth = function() {
        __resetScratch();
        var file = __compileScratch + "compRec.js";
        io.writeFileString(file, "function __compRecFn(n) { if (n <= 0) return 0; return 1 + __compRecFn(n - 1); }");

        loadCompiled(file, false, false);

        // StackOverflowError is a JVM Error, not caught reliably as a plain JS exception once thrown
        // deep in a recursive call chain, so a regression here could otherwise crash this whole test
        // run instead of failing cleanly. Calling from this shallow, top-level context (rather than
        // from inside another already-deep call) gives the catch enough stack margin to run.
        var result, caught;
        try {
            result = __compRecFn(3000);
        } catch (e) {
            caught = e;
        }
        ow.test.assert(isUnDef(caught), true, "Compiled recursive function overflowed the stack at depth 3000: " + caught);
        ow.test.assert(result, 3000, "Compiled recursive function should handle at least 3000 stack frames.");

        io.rm(__compileScratch);
    };
})();
