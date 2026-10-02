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

    // 36,000 distinct literals overflow Rhino's single-class constant pool.
    // Function boundaries deliberately cross the initial 64-body partition.
    var __partitionSource = function() {
        var source = "var shared = 7; var __hoisted = right(3); function buildThing(x) { return new Thing(x); } function right(x) { var n = 0; try { for (var k = 0; k < 2; k++) { if (x >= 0) n += x; } return n; } finally { shared += 0; } }\n";
        for (var i = 0; i < 600; i++) {
            source += "function part" + i + "(x) { return [";
            for (var j = 0; j < 60; j++) source += "'unique_" + i + "_" + j + "',";
            source += "x + shared," + i + ".5]; }\n";
        }
        source += [
            "function left(x) { return right(x) + part599(x)[60]; }",
            "function Thing(x) { this.value = left(x); }",
            "function make(x) { let y = x; return function(z) { y += z; return y + shared; }; }",
            "function strict() { 'use strict'; return this === undefined; }",
            "function* gen() { yield left(2); yield /ab+/i.test('ABBB'); }",
            "function tag(s, x) { return s.raw[0] + x + s[1]; }",
            "function template() { return tag`before${left(1)}after`; }",
            "function caught() { try { throw new Error('expected'); } catch(e) { return e.message; } }",
            "var closure = make(10), iterator = gen();",
            "var __partitionResult = JSON.stringify([left(3), buildThing(4).value, closure(2), closure(3), strict(), iterator.next().value, iterator.next().value, template(), caught(), right.toString(), part599(3)[0], part599(3)[61], __hoisted, template()]);"
        ].join("\n");
        return source;
    };

    var __validConstantPool = function(bytes) {
        var u2 = p => ((bytes[p] & 255) << 8) | (bytes[p + 1] & 255);
        var count = u2(8), pos = 10, refs = [];
        if (count < 1) return false;
        for (var i = 1; i < count; i++) {
            var tag = bytes[pos++] & 255;
            switch(tag) {
                case 1: pos += 2 + u2(pos); break;
                case 3: case 4: pos += 4; break;
                case 5: case 6: pos += 8; i++; break;
                case 7: case 8: case 16: case 19: case 20:
                    refs.push(u2(pos)); pos += 2; break;
                case 9: case 10: case 11: case 12:
                    refs.push(u2(pos), u2(pos + 2)); pos += 4; break;
                case 17: case 18:
                    refs.push(u2(pos + 2)); pos += 4; break;
                case 15: refs.push(u2(pos + 1)); pos += 3; break;
                default: return false;
            }
            if (pos > bytes.length) return false;
        }
        return pos + 6 <= bytes.length && refs.every(r => r > 0 && r < count);
    };

    exports.testPartitionedCompilation = function() {
        __resetScratch();
        try {
            var source = __partitionSource();
            // force interpreted evaluation in a separate context to compare semantics
            var cx = org.mozilla.javascript.Context.enter();
            var previous = cx.isInterpretedMode();
            var expected;
            try {
                cx.setInterpretedMode(true);
                var scope = cx.initStandardObjects();
                cx.evaluateString(scope, source, "partition-reference", 1, null);
                expected = String(org.mozilla.javascript.ScriptableObject.getProperty(scope, "__partitionResult"));
            } finally {
                cx.setInterpretedMode(previous);
                org.mozilla.javascript.Context.exit();
            }
            var jar = __compileScratch + "PartitionJar.jar";
            af.compileToJar("PartitionJar", source, jar);
            af.runFromExternalClass("PartitionJar", jar);
            ow.test.assert(__partitionResult, expected, "Partitioned JAR semantics differ from interpreted execution.");
            var loose = __compileScratch + "loose";
            io.mkdir(loose);
            af.compileToClasses("PartitionLoose", source, loose);
            af.runFromExternalClass("PartitionLoose", loose);
            ow.test.assert(__partitionResult, expected, "Partitioned loose-class semantics differ from interpreted execution.");
            var classes = io.listFiles(loose).files.filter(f => f.filename.endsWith(".class"));
            ow.test.assert(classes.some(f => /Shard[0-9]+\.class$/.test(f.filename)), true, "Expected generated body shards.");
            classes.forEach(f => {
                var bytes = io.readFileBytes(f.filepath);
                ow.test.assert(__validConstantPool(bytes), true, "Invalid constant-pool entry or reference bounds: " + f.filename);
            });
            var file = __compileScratch + "partitionLoad.js";
            io.writeFileString(file, source);
            loadCompiled(file, false, false);
            ow.test.assert(__partitionResult, expected, "loadCompiled partitioned script changed behavior.");
            io.writeFileString(__compileScratch + "partitionModule.js", source + "\nexports.result = __partitionResult;");
            ow.test.assert(requireCompiled(__compileScratch + "partitionModule.js", false, false).result, expected, "requireCompiled partitioned module changed behavior.");
        } finally {
            io.rm(__compileScratch);
        }
    };

    exports.testCompilationFailurePreservesJar = function() {
        __resetScratch();
        try {
            var jar = __compileScratch + "Preserved.jar";
            af.compileToJar("Preserved", "var __preserved = 42;", jar);
            var before = sha256(io.readFileBytes(jar));
            var failed = false;
            try { af.compileToJar("Preserved", "function broken( {", jar); } catch(e) { failed = true; }
            ow.test.assert(failed, true, "Unrelated parse error should propagate.");
            ow.test.assert(sha256(io.readFileBytes(jar)), before, "Failed recompilation replaced the previous JAR.");
            var small = __compileScratch + "small";
            io.mkdir(small);
            af.compileToClasses("Small", "function small() { return 1; }", small);
            ow.test.assert(io.listFiles(small).files.some(f => /Shard/.test(f.filename)), false, "Small script should retain the single-class path.");
        } finally { io.rm(__compileScratch); }
    };


    exports.testPartitionSizeRetry = function() {
        __resetScratch();
        try {
            var source = "";
            for (var i = 0; i < 96; i++) {
                source += "function adaptive" + i + "() { return [";
                for (var j = 0; j < 600; j++) source += "'adaptive_" + i + "_" + j + "',";
                source += "42]; }\n";
            }
            source += "var __adaptiveResult = adaptive95()[600];";
            var loose = __compileScratch + "adaptive";
            io.mkdir(loose);
            af.compileToClasses("Adaptive", source, loose);
            // A 64-body shard still overflows; the retry must reduce it to 32.
            ow.test.assert(io.fileExists(loose + "/AdaptiveShard3.class"), true, "Expected partition-size reduction after a shard overflow.");
            af.runFromExternalClass("Adaptive", loose);
            ow.test.assert(__adaptiveResult, 42, "Reduced partition didn't execute correctly.");
            var jar = __compileScratch + "Limit.jar";
            af.compileToJar("Limit", "var __limitValue = 42;", jar);
            var before = sha256(io.readFileBytes(jar));
            var oversized = "function oversized() { return [";
            for (var k = 0; k < 36000; k++) oversized += "'single_" + k + "',";
            oversized += "42]; }";
            var failure;
            try { af.compileToJar("Limit", oversized, jar); } catch(e) { failure = String(e); }
            ow.test.assert(isDef(failure) && /Native compilation limit/.test(failure), true, "A single oversized body must report the explicit native compilation limit: " + failure);
            ow.test.assert(sha256(io.readFileBytes(jar)), before, "Terminal partition failure replaced the previous JAR.");
        } finally { io.rm(__compileScratch); }
    };

})();
