// Copyright 2023 Nuno Aguiar

(function() {
    this.chType = "big";

    var withFileChannel = function(options, fn) {
        var path = String(java.nio.file.Files.createTempDirectory("openaf-channel-"));
        var name = "file-regression-" + genUUID();
        try {
            $ch(name).create(false, "file", merge({ path: path, multifile: true }, options));
            fn($ch(name), path);
        } finally {
            $ch(name).destroy();
            io.rm(path);
        }
    };

    // Futures surface raw Java exceptions that Rhino script catch blocks can miss.
    var runLifecycleWorkers = function(fn) {
        var pool = java.util.concurrent.Executors.newFixedThreadPool(8);
        var start = new java.util.concurrent.CountDownLatch(1);
        var futures = [];
        try {
            for (var w = 0; w < 8; w++) {
                (function(worker) {
                    futures.push(pool.submit(new java.util.concurrent.Callable({ call: function() {
                        start.await();
                        fn(worker);
                        return true;
                    } })));
                })(w);
            }
            start.countDown();
            futures.forEach(function(f) { f.get(60, java.util.concurrent.TimeUnit.SECONDS); });
        } finally {
            start.countDown();
            pool.shutdownNow();
            pool.awaitTermination(10, java.util.concurrent.TimeUnit.SECONDS);
        }
    };

    exports.testConcurrentLifecycle = function() {
        var prefix = "lifecycle-" + genUUID() + "-";
        var type = prefix + "type";
        var registry = {};
        var completed = new java.util.concurrent.atomic.AtomicInteger();
        // Like the Dynamo backend: different channel names mutate one shared JS map.
        ow.ch.__types[type] = {
            create: function(name) { registry[name] = {}; },
            destroy: function(name) { delete registry[name]; }
        };
        try {
            runLifecycleWorkers(function(worker) {
                for (var i = 0; i < 500; i++) {
                    var name = prefix + worker + "-" + i;
                    $ch(name).create(false, type);
                    ow.test.assert($ch().list().indexOf(name) >= 0, true, "Listing must include live channel");
                    $ch(name).destroy();
                    completed.incrementAndGet();
                }
            });
            ow.test.assert(Number(completed.get()), 4000, "All lifecycle operations must complete");
            ow.test.assert(Object.keys(registry).length, 0, "Backend registrations must be removed");
            ["channels", "subscribers", "peers", "expose", "jobs", "vers", "lock", "lock2"].forEach(function(key) {
                ow.test.assert(Object.keys(ow.ch[key]).filter(function(n) { return n.indexOf(prefix) == 0; }).length,
                    0, "Lifecycle must not retain " + key + " entries");
            });
        } finally {
            ow.ch.list().filter(function(n) { return n.indexOf(prefix) == 0; }).forEach(function(n) { $ch(n).destroy(); });
            delete ow.ch.__types[type];
        }
    };

    exports.testLifecycleIdempotency = function() {
        var name = "lifecycle-same-" + genUUID(), type = name + "-type";
        var creates = new java.util.concurrent.atomic.AtomicInteger();
        var destroys = new java.util.concurrent.atomic.AtomicInteger();
        ow.ch.__types[type] = {
            create: function(n) { creates.incrementAndGet(); sleep(5, true); },
            destroy: function(n) { destroys.incrementAndGet(); sleep(5, true); }
        };
        try {
            runLifecycleWorkers(function() { $ch(name).create(false, type); });
            ow.test.assert(Number(creates.get()), 1, "Concurrent duplicate creates must initialize once");
            var originalLock = ow.ch.lock[name];
            $ch(name).create(false, type);
            ow.test.assert(ow.ch.lock[name] === originalLock, true, "Duplicate create must preserve locks");
            runLifecycleWorkers(function() { $ch(name).destroy(); });
            ow.test.assert(Number(destroys.get()), 1, "Concurrent duplicate destroys must clean up once");
            ow.test.assert(isUnDef(ow.ch.lock[name]) && isUnDef(ow.ch.lock2[name]), true, "Destroy must remove both locks");
            $ch(name).create(false, type);
            ow.test.assert(ow.ch.lock[name] === originalLock, false, "Recreation must allocate a new lock");
        } finally {
            $ch(name).destroy();
            delete ow.ch.__types[type];
        }
    };

    exports.testLifecycleFailureAndReentry = function() {
        var name = "lifecycle-failure-" + genUUID(), type = name + "-type", child = name + "-child";
        var failCreate = true, failDestroy = true;
        ow.ch.__types[type] = {
            create: function(n) {
                if (failCreate) throw "expected create failure";
                $ch(child).create();
                ow.ch.list();
            },
            destroy: function(n) {
                if (failDestroy) throw "expected destroy failure";
                $ch(child).destroy();
            }
        };
        try {
            var caught = false;
            try { $ch(name).create(false, type); } catch(e) { caught = true; }
            ow.test.assert(caught, true, "Backend create errors must propagate");
            ow.test.assert(ow.ch.list().indexOf(name), -1, "Failed creation must not publish channel");
            failCreate = false;
            // Another thread proves that the lifecycle lock was released on failure.
            runLifecycleWorkers(function() { $ch(name).create(false, type); });
            var originalLock = ow.ch.lock[name];
            caught = false;
            try { $ch(name).destroy(); } catch(e) { caught = true; }
            ow.test.assert(caught, true, "Backend destroy errors must propagate");
            ow.test.assert(ow.ch.lock[name] === originalLock, true, "Failed destruction must preserve locks for retry");
            failDestroy = false;
            runLifecycleWorkers(function() { $ch(name).destroy(); });
            ow.test.assert(ow.ch.list().indexOf(child), -1, "Backend lifecycle must support nested channel cleanup");
        } finally {
            failDestroy = false;
            $ch(name).destroy();
            $ch(child).destroy();
            delete ow.ch.__types[type];
        }
    };

    exports.testFileMultifileReadDelete = function() {
        [{}, { yaml: true }, { toon: true }].forEach(function(format) {
            [{}, { gzip: true }, { lz4: true }].forEach(function(compression) {
                withFileChannel(merge(format, compression), function(ch, path) {
                    var first = { id: 1, text: "saved café" };
                    var second = { id: 2, text: "second" };
                    ch.set({ id: 1 }, first);
                    ch.setAll(["id"], [second]);
                    ow.test.assert(ch.get({ id: 1 }), first, "Multifile get must return stored data");
                    ow.test.assert(ch.getAll(), [first, second], "Multifile getAll must return stored data");
                    ch.unset({ id: 1 });
                    ow.test.assert(ch.get({ id: 1 }), __, "Unset must remove the value file");
                    ch.unsetAll(["id"], [second]);
                    ow.test.assert(ch.size(), 0, "UnsetAll must clear the index");
                    ow.test.assert(io.listFiles(path).files.length, 1, "Only the index should remain after deletion");
                });
            });
        });
    };

    exports.testFileIterationKeys = function() {
        [false, true].forEach(function(multifile) {
            withFileChannel({ multifile: multifile }, function(ch) {
                var key = { id: 1 }, value = { text: "saved" }, seen = [];
                ch.set(key, value);
                ch.forEach(function(k, v) { seen.push({ key: k, value: v }); });
                ow.test.assert(seen, [{ key: key, value: value }], "File iteration must return original keys and values");
            });
        });
    };

    exports.testFileMultifileConfiguredKey = function() {
        withFileChannel({ key: "id" }, function(ch) {
            var value = { id: "record", text: "saved" };
            ch.set({ id: "record" }, value);
            ow.test.assert(ch.get({ id: "record" }), value, "Multifile reads must normalize configured keys like writes");
            ch.unset({ id: "record" });
            ow.test.assert(ch.get({ id: "record" }), __, "Configured keys must also be deleted");
        });
    };

    var withProxyChannel = function(fn) {
        var target = "proxy-target-" + genUUID();
        var proxy = "proxy-regression-" + genUUID();
        try {
            $ch(target).create(false, "simple");
            $ch(proxy).create(false, "proxy", { chTarget: target, proxyFunc: function(m) {} });
            fn($ch(proxy), $ch(target));
        } finally {
            $ch(proxy).destroy();
            $ch(target).destroy();
        }
    };

    exports.testProxyBulkDelete = function() {
        withProxyChannel(function(proxy, target) {
            var records = [{ id: 1, text: "first" }, { id: 2, text: "second" }, { id: 3, text: "keep" }];
            proxy.setAll(["id"], records);
            proxy.unsetAll(["id"], records.slice(0, 2));
            ow.test.assert(target.getAll(), [records[2]], "Proxy bulk delete must remove only the requested records");
        });
    };

    exports.testProxyQueue = function() {
        ["pop", "shift"].forEach(function(op) {
            withProxyChannel(function(proxy, target) {
                // Values deliberately differ from keys to detect double removal or value-as-key lookups.
                var first = { text: "first" }, last = { text: "last" };
                target.set({ id: 1 }, first, 1000);
                target.set({ id: 2 }, last, 2000);
                ow.test.assert(proxy[op](), op == "pop" ? last : first, "Proxy queue must return the removed value");
                ow.test.assert(target.getAll(), [op == "pop" ? first : last], "Proxy queue must remove exactly one entry");
                ow.test.assert(proxy[op](), op == "pop" ? first : last, "Proxy queue must return the remaining value");
                ow.test.assert(proxy[op](), __, "Empty proxy queue must return undefined");
                ow.test.assert(target.size(), 0, "Proxy queue must drain the target");
            });
        });
    };

    exports.testShiftError = function() {
        var name = "shift-error-" + genUUID();
        var failure = new Error("queue backend failure");
        try {
            $ch(name).create(false, "proxy", {
                chTarget: "unused",
                proxyFunc: function(m) {
                    if (m.op == "size") return 1;
                    if (m.op == "shift") throw failure;
                }
            });
            var caught;
            try { $ch(name).shift(); } catch (e) { caught = e; }
            ow.test.assert(caught === failure, true, "Shift must preserve the original backend error");
            ow.test.assert(ow.ch.lock2[name].isLocked(), false, "Shift must release its lock after failure");
        } finally {
            $ch(name).destroy();
        }
    };

    exports.testMVSUtils = function() {
        io.rm("testMVS.db");

        $ch("mvs").create(1, "mvs", { file: "testMVS.db", map: "teste" });
        $ch("mvs").set(1, 1); 
        $ch("mvs").set(2, 2);
        $ch("mvs").set(3, 3);

        var res = ow.ch.utils.mvs.list("testMVS.db");
        ow.test.assert(res, [ "teste" ], "Problem with listing maps on a mvs file.");

        ow.ch.utils.mvs.rename("testMVS.db", "teste", "teste2");
        res = ow.ch.utils.mvs.list("testMVS.db");
        ow.test.assert(res, [ "teste2" ], "Problem with listing maps on a mvs file (2).");
        ow.ch.utils.mvs.rename("testMVS.db", "teste2", "teste");

        $ch("mvs").destroy();
        res = ow.ch.utils.mvs.list("testMVS.db");
        ow.test.assert(res, [ "teste" ], "Problem with listing maps on a mvs file (3).");

        ow.ch.utils.mvs.remove("testMVS.db", "teste");
        res = ow.ch.utils.mvs.list("testMVS.db");
        ow.test.assert(res, [ ], "Problem with listing maps on a mvs file (4).");

        io.rm("testMVS.db");
    };

    var withMVSMultifile = function(fn) {
        var path = String(java.nio.file.Files.createTempDirectory("openaf-mvs-"));
        try {
            fn(path);
        } finally {
            io.rm(path);
        }
    };

    exports.testMVSMultifile = function() {
        withMVSMultifile(function(path) {
            var name = "mvs-multifile-" + genUUID();
            $ch(name).create(1, "mvs", { multifile: true, path: path, files: 3 });
            for(var i = 0; i < 50; i++) $ch(name).set({ id: i }, { id: i, v: i * 2 });

            ow.test.assert($ch(name).size(), 50, "Problem with mvs multifile size.");
            ow.test.assert($ch(name).get({ id: 7 }), { id: 7, v: 14 }, "Problem with mvs multifile get.");
            ow.test.assert($ch(name).getKeys().length, 50, "Problem with mvs multifile getKeys.");
            ow.test.assert($ch(name).getAll().length, 50, "Problem with mvs multifile getAll.");

            var files = io.listFilenames(path).filter(f => f.endsWith(".db"));
            ow.test.assert(files.length, 3, "Problem with the number of mvs multifile files.");
            ow.test.assert(io.readFileJSON(path + "/mvs-multifile.json").files, 3, "Problem with mvs multifile manifest.");

            $ch(name).unset({ id: 7 });
            ow.test.assert(isUnDef($ch(name).get({ id: 7 })), true, "Problem with mvs multifile unset.");
            $ch(name).unsetAll(["id"], [{ id: 1 }, { id: 2 }, { id: 3 }]);
            ow.test.assert($ch(name).size(), 46, "Problem with mvs multifile unsetAll.");
            $ch(name).setAll(["id"], [{ id: 100, v: 1 }, { id: 101, v: 2 }]);
            ow.test.assert($ch(name).size(), 48, "Problem with mvs multifile setAll.");
            $ch(name).destroy();

            // Re-open without files: the manifest must be honored
            $ch(name).create(1, "mvs", { multifile: true, path: path });
            ow.test.assert($ch(name).size(), 48, "Problem with mvs multifile reopen.");
            ow.test.assert($ch(name).get({ id: 100 }), { id: 100, v: 1 }, "Problem with mvs multifile reopen get.");
            $ch(name).destroy();
        });
    };

    exports.testMVSMultifileManifestMismatch = function() {
        withMVSMultifile(function(path) {
            var name = "mvs-multifile-" + genUUID();
            $ch(name).create(1, "mvs", { multifile: true, path: path, files: 2 });
            $ch(name).destroy();

            var failed = false;
            try { $ch(name).create(1, "mvs", { multifile: true, path: path, files: 5 }); } catch(e) { failed = true; }
            ow.test.assert(failed, true, "mvs multifile should fail on a different number of files.");
            try { $ch(name).destroy(); } catch(e) {}
        });
    };

    exports.testMVSMultifilePagination = function() {
        withMVSMultifile(function(path) {
            var name = "mvs-multifile-" + genUUID();
            $ch(name).create(1, "mvs", { multifile: true, path: path, files: 4 });
            try {
                for(var i = 0; i < 40; i++) $ch(name).set({ id: i }, { id: i });
                var all = $ch(name).getKeys();
                [[0, 5], [3, 17], [9, 31], [35, 40], [0, 40], [38, 100]].forEach(r => {
                    ow.test.assert($ch(name).getKeys({ start: r[0], end: r[1] }), all.slice(r[0], r[1]), "Problem with mvs multifile getKeys pagination " + r);
                });
                ow.test.assert($ch(name).getAll({ start: 10, end: 20 }).map(r => r.id), all.slice(10, 20).map(r => r.id), "Problem with mvs multifile getAll pagination.");

                ow.test.assert($ch(name).shift(), all[0], "Problem with mvs multifile shift.");
                ow.test.assert($ch(name).pop(), all[all.length - 1], "Problem with mvs multifile pop.");
                ow.test.assert($ch(name).size(), 38, "Problem with mvs multifile size after shift/pop.");
            } finally {
                $ch(name).destroy();
            }
        });
    };

    exports.testMVSShiftPop = function() {
        var name = "mvs-shiftpop-" + genUUID();
        $ch(name).create(1, "mvs", { map: name });
        try {
            $ch(name).set({ id: 1 }, { id: 1, v: "a" });
            $ch(name).set({ id: 2 }, { id: 2, v: "b" });
            $ch(name).set({ id: 3 }, { id: 3, v: "c" });
            ow.test.assert($ch(name).shift(), { id: 1, v: "a" }, "Problem with mvs shift.");
            ow.test.assert($ch(name).pop(), { id: 3, v: "c" }, "Problem with mvs pop.");
            ow.test.assert($ch(name).getKeys(), [{ id: 2 }], "Problem with mvs keys after shift/pop.");
        } finally {
            $ch(name).destroy();
        }
    };

    exports.testMVSMultifileReshard = function() {
        withMVSMultifile(function(path) {
            var name = "mvs-multifile-" + genUUID();
            $ch(name).create(1, "mvs", { multifile: true, path: path, files: 2, map: "m1" });
            for(var i = 0; i < 60; i++) $ch(name).set({ id: i }, { id: i, v: i * 3 });

            var failed = false;
            try { ow.ch.utils.mvs.reshard(path, 5); } catch(e) { failed = true; }
            ow.test.assert(failed, true, "mvs reshard should fail while a channel is using the path.");
            $ch(name).destroy();

            ow.test.assert(ow.ch.utils.mvs.reshard(path, 5), 60, "Problem with the number of entries resharded.");
            ow.test.assert(io.readFileJSON(path + "/mvs-multifile.json").files, 5, "Problem with the manifest after reshard.");
            ow.test.assert(io.listFilenames(path).filter(f => f.endsWith(".db")).length, 5, "Problem with the number of files after reshard.");
            ow.test.assert(io.fileExists(path + "/.reshard-tmp"), false, "Reshard should remove its temporary folder.");

            $ch(name).create(1, "mvs", { multifile: true, path: path, map: "m1" });
            ow.test.assert($ch(name).size(), 60, "Problem with size after reshard.");
            for(var i = 0; i < 60; i++) ow.test.assert($ch(name).get({ id: i }), { id: i, v: i * 3 }, "Problem with get after reshard for " + i);
            $ch(name).destroy();

            // Shrinking down to a single file
            ow.test.assert(ow.ch.utils.mvs.reshard(path, 1), 60, "Problem resharding down to one file.");
            $ch(name).create(1, "mvs", { multifile: true, path: path, map: "m1" });
            ow.test.assert($ch(name).get({ id: 59 }), { id: 59, v: 177 }, "Problem with get after reshard to one file.");
            $ch(name).destroy();
        });
    };

    exports.testMVSMultifileSharing = function() {
        withMVSMultifile(function(path) {
            var n1 = "mvs-multifile-" + genUUID(), n2 = "mvs-multifile-" + genUUID();
            $ch(n1).create(1, "mvs", { multifile: true, path: path, files: 2 });
            $ch(n2).create(1, "mvs", { multifile: true, path: path, files: 2 });
            $ch(n1).set({ id: 1 }, { id: 1 });
            ow.test.assert($ch(n2).get({ id: 1 }), { id: 1 }, "Problem with mvs multifile sharing.");
            $ch(n1).destroy();
            $ch(n2).set({ id: 2 }, { id: 2 });
            ow.test.assert($ch(n2).size(), 2, "Problem with mvs multifile after destroying a sharing channel.");
            $ch(n2).destroy();
        });
    };

    exports.testCreateChannel = function() {
        var ops;
        if (this.chType == "cache") {
            ops = {
                func: (aK) => {
                    return aK;
                }
            };
        }
        $ch(this.chType).create(true, this.chType, ops);
        $ch(this.chType).size();
    };

    exports.testSettingData = function() {
        var l = io.listFiles(getOpenAFPath()).files
        $ch(this.chType).unsetAll(["filepath"], $ch(this.chType).getKeys());
        $ch(this.chType).setAll(["filepath"], l);
        ow.test.assert(l.length, $ch(this.chType).size(), "Channel didn't store all values.");
    };

    exports.testUnsettingData = function() {
        var l1 = io.listFiles(getOpenAFPath()).files
        var l2 = listFilesRecursive(getOpenAFPath())
        $ch(this.chType).setAll(["filepath"], l1);
        $ch(this.chType).setAll(["filepath"], l2);
        ow.test.assert(l2.length, $ch(this.chType).size(), "Channel didn't store all values for unset test.");
        $ch(this.chType).unsetAll(["filepath"], l1);
        ow.test.assert(l2.length - l1.length, $ch(this.chType).size(), "Channel didn't unset all values correclty.");
    };

    exports.testDestroyChannel = function() {
        $ch(this.chType).destroy();
    };

    exports.testChannelSubscribers = function() {
        $ch("_t1_").create();
        $ch("_t2_").create();
        $ch("_t3_").create();
        $ch("_t4_").create();

        $ch("_t1_").subscribe(ow.ch.utils.getMirrorSubscriber("_t2_"));
        $ch("_t1_").subscribe(ow.ch.utils.getMirrorSubscriber("_t3_"));

        $ch("_t1_").setAll(["filepath"], listFilesRecursive(getOpenAFPath())); 
        $ch("_t1_").waitForJobs(); sleep(100);

        ow.test.assert($ch("_t1_").size(), $ch("_t2_").size(), "Differences between channel 1 and 2");
        ow.test.assert($ch("_t1_").size(), $ch("_t3_").size(), "Differences between channel 1 and 3");

        $ch("_t2_").subscribe(ow.ch.utils.getMirrorSubscriber("_t4_"));
        $ch("_t2_").waitForJobs(); sleep(100);

        ow.test.assert($ch("_t2_").size(), $ch("_t4_").size(), "Differences between channel 2 and 4");

        $ch("_t1_").destroy();
        $ch("_t2_").destroy();
        $ch("_t3_").destroy();
        $ch("_t4_").destroy();
    };

    exports.testAuditLog = function() {
        var port = findRandomOpenPort();
        var chName = "__test_" + port;

        $ch(chName).create();
        $ch(chName).expose(port, undefined, () => { return true; });

        var opsAudit = [];

        ow.ch.server.setLog((aMap) => {
            opsAudit.push({ o: aMap.op, c: aMap.name, u: aMap.request.user, p: aMap.request.channelPermission });
        });

        $ch("remote" + chName).createRemote("http://abc:123@127.0.0.1:" + port + "/" + chName);
        $ch("remote" + chName).size();
        $ch("remote" + chName).set(1,1);
        $ch("remote" + chName).unset(1);

        ow.test.assert($from(opsAudit).equals("o", "AUTH_OK").equals("c", chName).equals("u", "abc").any(), true, "Problem with auditing remote channel access authentication.");
        ow.test.assert($from(opsAudit).equals("o", "GET").equals("c", chName).equals("u", "abc").equals("p", "rw").any(), true, "Problem with auditing remote channel get rest operation.");        
        ow.test.assert($from(opsAudit).equals("o", "SET").equals("c", chName).equals("u", "abc").equals("p", "rw").any(), true, "Problem with auditing remote channel set rest operation.");                
        ow.test.assert($from(opsAudit).equals("o", "REMOVE").equals("c", chName).equals("u", "abc").equals("p", "rw").any(), true, "Problem with auditing remote channel remove rest operation.");                        

        $ch(chName).destroy();
    };

    exports.testKeepHistory = function() {
        var t = ow.ch.utils.keepHistory(100, "__keepHistoryTest", () => { return { tt: new Date() } });
        sleep(1500, true);
        t.stop();
        ow.test.assert($ch("__keepHistoryTest").size() <= 11, true, "Problem with a simple ow.ch.utils.keepHistory setup.");

        $ch("__keepHistoryTest").destroy();
        var t = ow.ch.utils.keepHistory(100, "__keepHistoryTest", () => { return { id: nowNano(), tt: new Date() } }, ["id"], 20);
        sleep(2500, true);
        t.stop();
        ow.test.assert(19 <= $ch("__keepHistoryTest").size() <= 21, true, "Problem with changing history size on ow.ch.utils.keepHistory.");
    };

    exports.testHousekeeping = function() {
        $ch(this.chType + "HK").destroy();
        $ch(this.chType + "HK").create();
        $ch(this.chType + "HK").subscribe(ow.ch.utils.getHousekeepSubscriber(this.chType + "HK", 3));

        for(var i = 0; i < 10; i++) {
            $ch(this.chType + "HK").set(i, i);
        }

        while($ch(this.chType + "HK").size() > 3) {
            sleep(1000);
        }
        $ch(this.chType + "HK").waitForJobs(15000);
        ow.test.assert($ch(this.chType + "HK").size(), 3, "Housekeep subscriber didn't remove all values in time.");

        for(var i = 10; i < 20; i++) {
            $ch(this.chType + "HK").set(i, i);
        }
        
        while($ch(this.chType + "HK").size() > 3) {
            sleep(1000);
        }
        $ch(this.chType + "HK").waitForJobs(15000);
        ow.test.assert($ch(this.chType + "HK").size(), 3, "Housekeep subscriber didn't remove all values after setting.");
        $ch(this.chType + "HK").destroy();
    };
 
    exports.testGraphChannel = function() {
        var dir = String(java.nio.file.Files.createTempDirectory("openaf-graph-"));
        var file = dir + "/graph.json";
        var name = "graph-test-" + genUUID();
        var g = ow.ch.utils.graph;
        try {
            // Seed with a mini-a style file holding an extra section that must survive saves
            io.writeFileJSON(file, { version: 2, nodes: { "doc:a.md": { id: "doc:a.md", type: "document", props: { title: "A" } } }, edges: [], communities: [ { id: 1 } ] });
            $ch(name).create(false, "graph", { file: file });
            $ch(name).set({ id: "doc:b.md" }, { type: "document", props: { title: "B" } });
            $ch(name).set({ id: "concept:x" }, { type: "concept" });
            $ch(name).set({ id: "concept:island" }, { type: "concept" });
            $ch(name).set({ from: "doc:a.md", to: "doc:b.md", type: "LINKS_TO", provenance: "extracted" }, { props: { page: "a.md" } });
            $ch(name).set({ from: "doc:b.md", to: "concept:x", type: "MENTIONS" }, {});
            $ch(name).set({ from: "doc:b.md", to: "concept:x", type: "MENTIONS" }, {});
            ow.test.assert($ch(name).size(), 6, "Problem with graph size (edge dedupe)");
            ow.test.assert($ch(name).get({ id: "doc:b.md" }).props.title, "B", "Problem getting a graph node");
            ow.test.assert($ch(name).get({ from: "doc:a.md", to: "doc:b.md", type: "LINKS_TO", provenance: "EXTRACTED", page: "a.md" }).provenance, "EXTRACTED", "Problem getting a graph edge");

            var failed = false;
            try { $ch(name).set({ from: "doc:a.md", to: "doc:none", type: "T" }, {}); } catch(e) { failed = true; }
            ow.test.assert(failed, true, "Graph edge to a missing node must fail");

            ow.test.assert(g.path(name, "a.md", "concept:x"), [ "doc:a.md", "doc:b.md", "concept:x" ], "Problem with graph path");
            ow.test.assert(g.path(name, "a.md", "concept:island"), [], "Graph path to a disconnected node must be empty");
            ow.test.assert(g.path(name, "a.md", "concept:x", { maxDepth: 1 }), [], "Graph path must respect maxDepth");
            ow.test.assert(g.neighbors(name, "b.md", { direction: "out" }).length, 1, "Problem with graph neighbors (out)");
            ow.test.assert(g.neighbors(name, "b.md").length, 2, "Problem with graph neighbors (both)");
            ow.test.assert(g.degree(name, "b.md", { type: "MENTIONS" }), 1, "Problem with graph degree");
            ow.test.assert(g.traverse(name, "a.md", { depth: 1 }).nodes.length, 2, "Problem with graph traverse depth 1");
            ow.test.assert(g.traverse(name, "a.md", { depth: 2 }).nodes.length, 3, "Problem with graph traverse depth 2");
            ow.test.assert(g.find(name, { type: "concept" }).length, 2, "Problem with graph find by type");
            ow.test.assert(g.stats(name).edges, 2, "Problem with graph stats");

            // Persistence, preserved sections and reload
            var saved = io.readFileJSON(file);
            ow.test.assert(saved.communities, [ { id: 1 } ], "Graph channel must preserve unknown sections");
            $ch(name).destroy();
            $ch(name).create(false, "graph", { file: file });
            ow.test.assert($ch(name).size(), 6, "Problem reloading a graph");

            // Cascade delete
            $ch(name).unset({ id: "doc:b.md" });
            ow.test.assert($ch(name).size(), 3, "Unsetting a graph node must remove its edges");
            $ch(name).destroy();

            // Read-only
            $ch(name).create(false, "graph", { file: file, readOnly: true });
            failed = false;
            try { $ch(name).set({ id: "z" }, {}); } catch(e) { failed = true; }
            ow.test.assert(failed, true, "Read-only graph must reject changes");
            ow.test.assert($ch(name).size(), 3, "Read-only graph must keep its content");
            $ch(name).destroy();

            // Debounced autosave flushes on destroy
            $ch(name).create(false, "graph", { file: file, autosave: "debounced", saveDebounceMs: 3600000 });
            $ch(name).set({ id: "doc:late" }, { type: "document" });
            $ch(name).set({ id: "doc:later" }, { type: "document" });
            ow.test.assert(isDef(io.readFileJSON(file).nodes["doc:later"]), false, "Debounced graph must not save immediately");
            $ch(name).destroy();
            ow.test.assert(isDef(io.readFileJSON(file).nodes["doc:later"]), true, "Debounced graph must save on destroy");
        } finally {
            $ch(name).destroy();
            io.rm(dir);
        }
    };

    exports.testGraphChannelStore = function() {
        var dir = String(java.nio.file.Files.createTempDirectory("openaf-graph-store-"));
        var file = dir + "/graph.db";
        var name = "graph-store-test-" + genUUID();
        var g = ow.ch.utils.graph;
        var opts = { store: { type: "mvs", options: { file: file } } };
        try {
            $ch(name).create(true, "graph", opts);
            $ch(name).set({ id: "doc:a.md" }, { type: "document", props: { title: "A" } });
            $ch(name).set({ id: "doc:b.md" }, { type: "document", props: { title: "B" } });
            $ch(name).set({ id: "concept:x" }, { type: "concept" });
            $ch(name).set({ id: "concept:island" }, { type: "concept" });
            $ch(name).set({ from: "doc:a.md", to: "doc:b.md", type: "LINKS_TO", provenance: "extracted" }, { props: { page: "a.md" } });
            $ch(name).set({ from: "doc:b.md", to: "concept:x", type: "MENTIONS" }, {});
            $ch(name).set({ from: "doc:b.md", to: "concept:x", type: "MENTIONS" }, { props: { w: 2 } });
            ow.test.assert($ch(name).size(), 6, "Problem with graph store size (edge dedupe)");
            ow.test.assert($ch(name).get({ from: "doc:b.md", to: "concept:x", type: "MENTIONS" }).props.w, 2, "Problem updating a graph store edge");
            ow.test.assert($ch(name).get({ id: "doc:b.md" }).props.title, "B", "Problem getting a graph store node");

            var failed = false;
            try { $ch(name).set({ from: "doc:a.md", to: "doc:none", type: "T" }, {}); } catch(e) { failed = true; }
            ow.test.assert(failed, true, "Graph store edge to a missing node must fail");

            ow.test.assert(g.path(name, "a.md", "concept:x"), [ "doc:a.md", "doc:b.md", "concept:x" ], "Problem with graph store path");
            ow.test.assert(g.path(name, "a.md", "concept:island"), [], "Graph store path to a disconnected node must be empty");
            ow.test.assert(g.neighbors(name, "b.md").length, 2, "Problem with graph store neighbors");
            ow.test.assert(g.degree(name, "b.md", { direction: "out" }), 1, "Problem with graph store degree");
            ow.test.assert(g.traverse(name, "a.md", { depth: 2 }).nodes.length, 3, "Problem with graph store traverse");
            ow.test.assert(g.find(name, { type: "concept" }).length, 2, "Problem with graph store find");
            ow.test.assert(g.stats(name).edges, 2, "Problem with graph store stats");
            ow.test.assert(g.stats(name).nodeTypes.concept, 2, "Problem with graph store stats (node types)");

            // Persistence through the store channel
            $ch(name).destroy();
            $ch(name).create(false, "graph", opts);
            ow.test.assert($ch(name).size(), 6, "Problem reloading a graph from its store");
            ow.test.assert(g.path(name, "a.md", "concept:x").length, 3, "Problem navigating a reloaded graph store");

            // Cascade delete
            $ch(name).unset({ id: "doc:b.md" });
            ow.test.assert($ch(name).size(), 3, "Unsetting a graph store node must remove its edges");
            ow.test.assert(g.neighbors(name, "concept:x").length, 0, "Unsetting a graph store node must clean the adjacency");
            $ch(name).destroy();

            // Read-only + missing store
            $ch(name).create(false, "graph", { store: opts.store, readOnly: true });
            failed = false;
            try { $ch(name).set({ id: "z" }, {}); } catch(e) { failed = true; }
            ow.test.assert(failed, true, "Read-only graph store must reject changes");
            ow.test.assert($ch(name).size(), 3, "Read-only graph store must keep its content");
            $ch(name).destroy();
            // Batch writes (single commit on mvs) must behave like sequential sets
            var bn = name + "-bulk";
            [ true, false ].forEach(function(bulk) {
                var bfile = dir + "/bulk-" + bulk + ".db";
                var bopts = { store: { type: "mvs", bulk: bulk, options: { file: bfile } } };
                $ch(bn).create(true, "graph", bopts);
                var ks = [ "id", "from", "to", "type", "provenance" ];
                $ch(bn).setAll(ks, [
                    { id: "doc:a", type: "document" }, { id: "doc:b", type: "document" }, { id: "doc:c" },
                    { from: "doc:a", to: "doc:b", type: "LINKS_TO", provenance: "EXTRACTED", props: { w: 1 } },
                    { from: "doc:a", to: "doc:b", type: "LINKS_TO", provenance: "EXTRACTED", props: { w: 2 } },
                    { from: "doc:b", to: "doc:c", type: "LINKS_TO" },
                    { from: "doc:c", to: "doc:c", type: "SELF" }
                ]);
                ow.test.assert($ch(bn).size(), 6, "Problem with graph store batch size (bulk=" + bulk + ")");
                ow.test.assert($ch(bn).get({ from: "doc:a", to: "doc:b", type: "LINKS_TO", provenance: "EXTRACTED" }).props.w, 2, "Batch edge duplicates must keep the last (bulk=" + bulk + ")");
                ow.test.assert(g.degree(bn, "doc:b"), 2, "Problem with graph store batch adjacency (bulk=" + bulk + ")");
                ow.test.assert(g.degree(bn, "doc:c"), 2, "Problem with graph store batch adjacency, self edge (bulk=" + bulk + ")");
                ow.test.assert(g.path(bn, "doc:a", "doc:c"), [ "doc:a", "doc:b", "doc:c" ], "Problem with graph store batch path (bulk=" + bulk + ")");
                var bfailed = false;
                try { $ch(bn).setAll([ "from", "to", "type" ], [ { from: "doc:a", to: "doc:zzz", type: "T" } ]); } catch(e) { bfailed = true; }
                ow.test.assert(bfailed, true, "Batch edge to a missing node must fail (bulk=" + bulk + ")");
                // a second batch extends the existing adjacency
                $ch(bn).setAll([ "id", "from", "to", "type" ], [ { id: "doc:d" }, { from: "doc:a", to: "doc:d", type: "LINKS_TO" } ]);
                ow.test.assert(g.degree(bn, "doc:a"), 2, "Second batch must extend the adjacency (bulk=" + bulk + ")");
                $ch(bn).destroy();
                $ch(bn).create(true, "graph", bopts);
                ow.test.assert($ch(bn).size(), 8, "Problem reloading a batch written graph store (bulk=" + bulk + ")");
                $ch(bn).destroy();
            });

            failed = false;
            try { $ch(name).create(false, "graph", { create: false, store: { type: "mvs", options: { file: dir + "/none.db" } } }); } catch(e) { failed = true; }
            ow.test.assert(failed, true, "Missing graph store with create=false must fail");
        } finally {
            $ch(name).destroy();
            io.rm(dir);
        }
    };

    // Battery shared by the memory/file and the store flavours of the timeseries channel
    var __tsCommon = function(name) {
        var u = ow.ch.utils.timeseries;
        var K = (h, ts) => ({ metric: "cpu", labels: { host: h }, ts: ts });
        for (var i = 1; i <= 5; i++) $ch(name).set(K("a", i * 1000), { v: i });
        $ch(name).set(K("b", 1000), { v: 10 });
        $ch(name).set({ metric: "mem", ts: 1000 }, { v: 7 });
        ow.test.assert($ch(name).size(), 7, "Problem with timeseries size");
        ow.test.assert($ch(name).get({ metric: "cpu", labels: { host: "a" } }).v, 5, "Problem getting the latest timeseries point");
        ow.test.assert($ch(name).get({ metric: "cpu", labels: { host: "a" } }).ts, 5000, "Problem getting the latest timeseries ts");
        ow.test.assert($ch(name).get(K("a", 2000)).v, 2, "Problem getting an exact timeseries point");
        ow.test.assert($ch(name).get(K("a", 2500)), __, "Missing timeseries point must be undefined");
        ow.test.assert($ch(name).get({ metric: "nope" }), __, "Missing timeseries must be undefined");

        // Overwrite, out-of-order, timestamp formats
        $ch(name).set(K("a", 3000), { v: 30 });
        ow.test.assert($ch(name).size(), 7, "Overwriting a timeseries point must not add one");
        ow.test.assert($ch(name).get(K("a", 3000)).v, 30, "Problem overwriting a timeseries point");
        $ch(name).set(K("a", 500), { v: 0.5 });
        ow.test.assert($ch(name).get(K("a", 500)).v, 0.5, "Problem with an out-of-order timeseries point");
        ow.test.assert($ch(name).getKeys({ metric: "cpu", labels: { host: "a" } })[0].ts, 500, "An out-of-order timeseries point must be sorted");
        // shift and pop return and remove the oldest and newest points
        ow.test.assert($ch(name).shift().ts, 500, "Problem with timeseries shift");
        ow.test.assert($ch(name).get(K("a", 500)), __, "Shift must remove the oldest timeseries point");
        ow.test.assert($ch(name).pop().ts, 5000, "Problem with timeseries pop");
        $ch(name).set(K("a", 5000), { v: 5 });
        ow.test.assert($ch(name).size(), 7, "Problem with the timeseries size after shift and pop");
        $ch(name).set({ metric: "iso", ts: "1970-01-01T00:00:10.000Z" }, { v: 1 });
        ow.test.assert($ch(name).get({ metric: "iso" }).ts, 10000, "Problem with an ISO timeseries timestamp");
        $ch(name).set({ metric: "iso", ts: new Date(20000) }, { v: 2 });
        ow.test.assert($ch(name).get({ metric: "iso" }).ts, 20000, "Problem with a Date timeseries timestamp");
        $ch(name).unset({ metric: "iso" });
        ow.test.assert($ch(name).get({ metric: "iso" }), __, "Unsetting a timeseries without ts must drop it");
        var failed = false;
        try { $ch(name).set(K("a", 6000), { v: "x" }); } catch(e) { failed = true; }
        ow.test.assert(failed, true, "A non numeric timeseries value must fail");
        failed = false;
        try { $ch(name).set({ labels: {} }, { v: 1 }); } catch(e) { failed = true; }
        ow.test.assert(failed, true, "A timeseries key without metric must fail");

        // Keys, selectors
        var ks = $ch(name).getKeys();
        ow.test.assert(ks.length, 7, "Problem with timeseries getKeys");
        ow.test.assert(ks[0].metric, "cpu", "Problem with the timeseries getKeys order");
        ow.test.assert($ch(name).getKeys({ metric: "cpu", labels: { host: "a" }, from: 2000, to: 4000 }).map(k => k.ts), [ 2000, 3000, 4000 ], "Problem with the timeseries getKeys selector");
        ow.test.assert($ch(name).getAll({ metric: "mem" })[0].v, 7, "Problem with the timeseries getAll selector");
        ow.test.assert($ch(name).getSortedKeys()[0].ts, 1000, "Problem with timeseries getSortedKeys");
        ow.test.assert(u.series(name, { metric: "cpu" }).length, 2, "Problem with timeseries series");
        ow.test.assert(u.series(name, { metric: /^c/, labels: { host: [ "a", "z" ] } }).length, 1, "Problem with timeseries series regexp/array selector");
        ow.test.assert(u.labels(name, "cpu"), { host: [ "a", "b" ] }, "Problem with timeseries labels");

        // Queries
        var r = (sel, o) => u.range(name, sel, o);
        var a = { metric: "cpu", labels: { host: "a" } };
        ow.test.assert(r(a, { from: 2000, to: 4000 }).map(x => x.v), [ 2, 30, 4 ], "Problem with raw timeseries range");
        ow.test.assert(r(a)[0], { ts: 1000, metric: "cpu", host: "a", v: 1 }, "Problem with the flat timeseries range row");
        ow.test.assert(r(a, { step: "2s", fn: "avg" }).map(x => [ x.ts, x.v ]), [ [ 0, 1 ], [ 2000, 16 ], [ 4000, 4.5 ] ], "Problem with timeseries range avg");
        ow.test.assert(r(a, { step: 2000, fn: "sum" }).map(x => x.v), [ 1, 32, 9 ], "Problem with timeseries range sum");
        ow.test.assert(r(a, { step: 2000, fn: "min" }).map(x => x.v), [ 1, 2, 4 ], "Problem with timeseries range min");
        ow.test.assert(r(a, { step: 2000, fn: "max" }).map(x => x.v), [ 1, 30, 5 ], "Problem with timeseries range max");
        ow.test.assert(r(a, { step: 2000, fn: "count" }).map(x => x.v), [ 1, 2, 2 ], "Problem with timeseries range count");
        ow.test.assert(r(a, { step: 2000, fn: "first" }).map(x => x.v), [ 1, 2, 4 ], "Problem with timeseries range first");
        ow.test.assert(r(a, { step: 2000, fn: "last" }).map(x => x.v), [ 1, 30, 5 ], "Problem with timeseries range last");
        ow.test.assert(r({ metric: "cpu" }, { step: 10000, fn: "count" }).length, 2, "A timeseries range must return a row per series");
        ow.test.assert(r(a, { from: 0, to: 6000, step: 1000, fn: "last", fill: "zero" }).map(x => x.v), [ 0, 1, 2, 30, 4, 5, 0 ], "Problem with timeseries range fill zero");
        ow.test.assert(r({ metric: "cpu", labels: { host: "b" } }, { from: 0, to: 3000, step: 1000, fn: "last", fill: "prev" }).map(x => x.v), [ null, 10, 10, 10 ], "Problem with timeseries range fill prev");
        failed = false;
        try { r(a, { step: 1000, fn: "median" }); } catch(e) { failed = true; }
        ow.test.assert(failed, true, "An unknown timeseries fn must fail");
        ow.test.assert(u.latest(name, { metric: "cpu" }).map(x => x.v), [ 5, 10 ], "Problem with timeseries latest");

        // Counters: a decrease is a reset
        [ [ 0, 0 ], [ 1000, 10 ], [ 2000, 20 ], [ 3000, 5 ], [ 4000, 15 ], [ 5000, 25 ] ].forEach(p => $ch(name).set({ metric: "reqs", ts: p[0] }, { v: p[1] }));
        ow.test.assert(r({ metric: "reqs" }, { step: 2000, fn: "increase" }).map(x => x.v), [ 10, 15, 20 ], "Problem with timeseries increase");
        ow.test.assert(r({ metric: "reqs" }, { step: 2000, fn: "rate" }).map(x => x.v), [ 5, 7.5, 10 ], "Problem with timeseries rate");

        // setAll, stats, drop
        $ch(name).setAll([ "metric", "labels", "ts" ], [ { metric: "disk", labels: { d: "x" }, ts: 1000, v: 1 }, { metric: "disk", labels: { d: "x" }, ts: 2000, v: 2 }, { metric: "disk", labels: { d: "y" }, ts: 1000, v: 3 } ]);
        var st = u.stats(name);
        ow.test.assert(st.series, 6, "Problem with timeseries stats series");
        ow.test.assert(st.metrics.disk.points, 3, "Problem with timeseries stats points");
        ow.test.assert(st.metrics.disk.last, 2000, "Problem with timeseries stats last");
        ow.test.assert(u.drop(name, { metric: "disk" }), 2, "Problem with timeseries drop");
        $ch(name).unsetAll([ "metric", "labels", "ts" ], [ { metric: "reqs", ts: 0 }, { metric: "reqs", ts: 1000 } ]);
        ow.test.assert($ch(name).getKeys({ metric: "reqs" }).length, 4, "Problem with timeseries unsetAll");
        $ch(name).unset({ metric: "reqs" });
        $ch(name).unset({ metric: "mem" });
        ow.test.assert($ch(name).size(), 6, "Problem with timeseries size after drops");
    };

    var __tsRetention = function(name, opts) {
        // retention is measured from the newest point of the series
        $ch(name).create(true, "timeseries", merge({ retention: "2s", housekeepEveryMs: 0 }, opts));
        for (var i = 1; i <= 10; i++) $ch(name).set({ metric: "m", ts: i * 1000 }, { v: i });
        ow.test.assert($ch(name).getKeys().map(k => k.ts), [ 8000, 9000, 10000 ], "Problem with timeseries retention");
        $ch(name).set({ metric: "m", ts: 1000 }, { v: 1 });
        ow.test.assert($ch(name).size(), 3, "A point older than the retention must be dropped");
        if (isDef(opts.file)) {
            $ch(name).destroy();
            $ch(name).create(false, "timeseries", merge({ retention: "2s" }, opts));
            ow.test.assert($ch(name).getKeys().map(k => k.ts), [ 8000, 9000, 10000 ], "Retention must hold after reloading a timeseries file");
        }
        $ch(name).destroy();
    };

    var __tsMaxPoints = function(name, opts) {
        $ch(name).create(true, "timeseries", merge({ maxPoints: 2 }, opts));
        for (var i = 1; i <= 5; i++) $ch(name).set({ metric: "m", ts: i * 1000 }, { v: i });
        $ch(name).set({ metric: "n", ts: 1000 }, { v: 1 });
        ow.test.assert($ch(name).getKeys({ metric: "m" }).map(k => k.ts), [ 4000, 5000 ], "Problem with timeseries maxPoints");
        ow.test.assert($ch(name).size(), 3, "maxPoints must apply per series");
        $ch(name).destroy();
    };

    var __tsRollups = function(name, opts) {
        var u = ow.ch.utils.timeseries;
        // raw: 3s, 1s buckets: 5s, 10s buckets: forever
        $ch(name).create(true, "timeseries", merge({ raw: { keep: "3s" }, rollups: [ { step: "10s" }, { step: "1s", keep: "5s" } ], housekeepEveryMs: 0 }, opts));
        for (var i = 0; i < 20; i++) $ch(name).set({ metric: "m", labels: { h: "a" }, ts: i * 1000 }, { v: i });
        var s = { metric: "m" };
        ow.test.assert($ch(name).getKeys().map(k => k.ts), [ 16000, 17000, 18000, 19000 ], "Problem with the raw retention of a timeseries with rollups");
        var st = u.stats(name);
        ow.test.assert(st.tiers.r1000.entries, 6, "Problem with the rollup retention");
        ow.test.assert(st.tiers.r10000.entries, 2, "Problem counting the rollup buckets");
        ow.test.assert(u.range(name, s, { step: "10s", fn: "avg" }).map(x => [ x.ts, x.v ]), [ [ 0, 4.5 ], [ 10000, 14.5 ] ], "Problem reading rollups (avg)");
        ow.test.assert(u.range(name, s, { step: "10s", fn: "min", tier: "10s" }).map(x => x.v), [ 0, 10 ], "Problem reading rollups (min)");
        ow.test.assert(u.range(name, s, { step: "10s", fn: "max", tier: "10s" }).map(x => x.v), [ 9, 19 ], "Problem reading rollups (max)");
        ow.test.assert(u.range(name, s, { step: "10s", fn: "sum", tier: "10s" }).map(x => x.v), [ 45, 145 ], "Problem reading rollups (sum)");
        ow.test.assert(u.range(name, s, { step: "10s", fn: "first", tier: "10s" }).map(x => x.v), [ 0, 10 ], "Problem reading rollups (first)");
        ow.test.assert(u.range(name, s, { step: "10s", fn: "last", tier: "10s" }).map(x => x.v), [ 9, 19 ], "Problem reading rollups (last)");
        ow.test.assert(u.range(name, s, { step: "10s", fn: "increase", tier: "10s" }).map(x => x.v), [ 9, 10 ], "Problem reading rollups (increase)");
        ow.test.assert(u.range(name, s, { fn: "count", tier: "10s" }).map(x => [ x.ts, x.v ]), [ [ 0, 10 ], [ 10000, 10 ] ], "Problem reading a rollup tier without step");
        ow.test.assert(u.range(name, s, { from: 16000, step: "1s", fn: "last" }).map(x => x.v), [ 16, 17, 18, 19 ], "The finest tier must be used when it covers 'from'");
        ow.test.assert(u.range(name, s, { from: 14000, step: "1s", fn: "last" }).map(x => x.v), [ 14, 15, 16, 17, 18, 19 ], "The 1s rollup must cover what raw dropped");
        // a late point inside an expired 1s bucket only reaches the 10s tier
        $ch(name).set({ metric: "m", labels: { h: "a" }, ts: 1000 }, { v: 100 });
        ow.test.assert(u.range(name, s, { step: "10s", fn: "count", tier: "10s" }).map(x => x.v), [ 11, 10 ], "Problem with a late point on rollups");
        ow.test.assert(u.stats(name).tiers.r1000.entries, 6, "A late point must not recreate an expired rollup bucket");
        ow.test.assert($ch(name).size(), 4, "A late point must not stay in the raw tier");
        $ch(name).destroy();

        // Overwriting or removing a point fixes the buckets when raw is complete
        $ch(name).create(true, "timeseries", merge({ rollups: [ { step: "10s" } ] }, opts));
        s = { metric: "o" };
        [ [ 0, 1 ], [ 1000, 5 ], [ 2000, 3 ] ].forEach(p => $ch(name).set({ metric: "o", ts: p[0] }, { v: p[1] }));
        var q = f => u.range(name, s, { step: "10s", fn: f, tier: "10s" })[0].v;
        ow.test.assert([ q("count"), q("sum"), q("min"), q("max") ], [ 3, 9, 1, 5 ], "Problem with rollup aggregates");
        $ch(name).set({ metric: "o", ts: 1000 }, { v: 2 });
        ow.test.assert([ q("count"), q("sum"), q("min"), q("max") ], [ 3, 6, 1, 3 ], "Overwriting a point must fix the rollup bucket");
        $ch(name).unset({ metric: "o", ts: 2000 });
        ow.test.assert([ q("count"), q("sum"), q("min"), q("max"), q("last") ], [ 2, 3, 1, 2, 2 ], "Removing a point must fix the rollup bucket");
        $ch(name).unset({ metric: "o", ts: 0 });
        $ch(name).unset({ metric: "o", ts: 1000 });
        ow.test.assert(u.range(name, s, { step: "10s", tier: "10s" }), [], "An empty rollup bucket must be removed");
        // rebuild after rollups were not there
        [ [ 0, 1 ], [ 1000, 5 ] ].forEach(p => $ch(name).set({ metric: "o", ts: p[0] }, { v: p[1] }));
        u.rebuildRollups(name);
        ow.test.assert(q("sum"), 6, "Problem rebuilding rollups");
        $ch(name).destroy();
    };

    exports.testTimeSeriesChannel = function() {
        var dir = String(java.nio.file.Files.createTempDirectory("openaf-ts-"));
        var file = dir + "/ts.ndjson";
        var name = "ts-test-" + genUUID();
        try {
            // memory only
            $ch(name).create(true, "timeseries", {});
            __tsCommon(name);
            $ch(name).destroy();
            ow.test.assert(io.fileExists(file), false, "A memory timeseries must not write files");

            // file
            $ch(name).create(true, "timeseries", { file: file });
            __tsCommon(name);
            var before = $ch(name).getAll();
            $ch(name).destroy();
            $ch(name).create(false, "timeseries", { file: file });
            ow.test.assert($ch(name).getAll(), before, "Problem reloading a timeseries file");
            ow.test.assert($ch(name).size(), 6, "Problem with the size of a reloaded timeseries");

            // a truncated last line must not break loading or the next append
            $ch(name).destroy();
            io.writeFileString(file, "{\"o\":\"p\",\"s\":", __, true);
            $ch(name).create(false, "timeseries", { file: file });
            ow.test.assert($ch(name).size(), 6, "A truncated timeseries line must be ignored");
            $ch(name).set({ metric: "after", ts: 1 }, { v: 1 });
            $ch(name).destroy();
            $ch(name).create(false, "timeseries", { file: file });
            ow.test.assert($ch(name).get({ metric: "after" }).v, 1, "Problem appending after a truncated timeseries line");
            $ch(name).destroy();

            // compaction: overwrites and deletes are dead lines
            io.rm(file);
            $ch(name).create(true, "timeseries", { file: file, compactRatio: 0.3 });
            for (var i = 0; i < 20; i++) $ch(name).set({ metric: "c", ts: 1000 }, { v: i });
            for (var i = 0; i < 10; i++) { $ch(name).set({ metric: "d", ts: i }, { v: i }); $ch(name).unset({ metric: "d", ts: i }); }
            var lines = () => io.readFileString(file).split("\n").filter(l => l.length > 0).length;
            ow.test.assert(lines() > 30, true, "The timeseries file must be append-only");
            ow.test.assert($ch(name).size(), 1, "Problem with a timeseries with dead lines");
            $ch(name).destroy();
            ow.test.assert(lines() <= 3, true, "Destroying a timeseries channel must compact a mostly dead file");
            $ch(name).create(false, "timeseries", { file: file });
            ow.test.assert($ch(name).get({ metric: "c" }).v, 19, "Problem reading a compacted timeseries file");
            ow.test.assert(ow.ch.utils.timeseries.compact(name), true, "Problem compacting a timeseries on request");
            $ch(name).destroy();

            // read-only
            $ch(name).create(false, "timeseries", { file: file, readOnly: true });
            var failed = false;
            try { $ch(name).set({ metric: "z", ts: 1 }, { v: 1 }); } catch(e) { failed = true; }
            ow.test.assert(failed, true, "Read-only timeseries must reject changes");
            ow.test.assert($ch(name).size(), 1, "Read-only timeseries must keep its content");
            $ch(name).destroy();
            failed = false;
            try { $ch(name).create(true, "timeseries", { file: dir + "/none.ndjson", create: false }); } catch(e) { failed = true; }
            ow.test.assert(failed, true, "A missing timeseries file with create=false must fail");

            // debounced autosave flushes on destroy
            io.rm(file);
            $ch(name).create(true, "timeseries", { file: file, autosave: "debounced", saveDebounceMs: 3600000 });
            $ch(name).set({ metric: "late", ts: 1 }, { v: 1 });
            $ch(name).set({ metric: "later", ts: 1 }, { v: 1 });
            ow.test.assert(io.fileExists(file) && io.readFileString(file).indexOf("later") >= 0, false, "Debounced timeseries must not append immediately");
            $ch(name).destroy();
            ow.test.assert(io.readFileString(file).indexOf("later") >= 0, true, "Debounced timeseries must append on destroy");

            // retention, count limit and rollups (also persisted and reloaded)
            io.rm(file);
            __tsRetention(name, {});
            __tsMaxPoints(name, {});
            __tsRollups(name, {});
            io.rm(file);
            __tsRetention(name, { file: file });
            io.rm(file);
            __tsRollups(name, { file: file });
            io.rm(file);
            var ro = { file: file, rollups: [ { step: "10s" } ] };
            $ch(name).create(true, "timeseries", ro);
            [ [ 0, 1 ], [ 1000, 5 ] ].forEach(p => $ch(name).set({ metric: "m", ts: p[0] }, { v: p[1] }));
            $ch(name).destroy();
            $ch(name).create(false, "timeseries", ro);
            var sum10 = () => ow.ch.utils.timeseries.range(name, { metric: "m" }, { step: "10s", fn: "sum", tier: "10s" }).map(x => x.v);
            ow.test.assert(sum10(), [ 6 ], "Problem persisting rollups");
            $ch(name).unset({ metric: "m", ts: 1000 });
            $ch(name).destroy();
            $ch(name).create(false, "timeseries", ro);
            ow.test.assert(sum10(), [ 1 ], "Problem persisting rollup changes");
            $ch(name).destroy();

            // retention measured from now and housekeep on demand
            $ch(name).create(true, "timeseries", { retention: "1h", retentionRef: "now", housekeepEveryMs: 3600000 });
            $ch(name).set({ metric: "new", ts: now() }, { v: 1 });
            $ch(name).set({ metric: "old", ts: 1000 }, { v: 1 });
            ow.test.assert(ow.ch.utils.timeseries.housekeep(name), 1, "Problem with timeseries housekeep");
            ow.test.assert($ch(name).getKeys().map(k => k.metric), [ "new" ], "Housekeep must drop what is older than the retention from now");
            $ch(name).destroy();
        } finally {
            $ch(name).destroy();
            io.rm(dir);
        }
    };

    exports.testTimeSeriesChannelStore = function() {
        var dir = String(java.nio.file.Files.createTempDirectory("openaf-ts-store-"));
        var name = "ts-store-test-" + genUUID();
        var u = ow.ch.utils.timeseries;
        var so = f => ({ store: { type: "mvs", options: { file: dir + "/" + f + ".db" } }, chunk: "2s" });
        var opts = so("ts");
        try {
            $ch(name).create(true, "timeseries", opts);
            __tsCommon(name);
            var before = $ch(name).getAll();
            $ch(name).destroy();
            $ch(name).create(false, "timeseries", opts);
            ow.test.assert($ch(name).getAll(), before, "Problem reopening a timeseries store");
            $ch(name).destroy();

            var failed = false;
            try { $ch(name).create(true, "timeseries", { create: false, store: { type: "mvs", options: { file: dir + "/empty.db" } } }); } catch(e) { failed = true; }
            ow.test.assert(failed, true, "A missing timeseries store with create=false must fail");
            failed = false;
            try { $ch(name).create(true, "timeseries", { file: dir + "/x.ndjson", store: { type: "mvs" } }); } catch(e) { failed = true; }
            ow.test.assert(failed, true, "A timeseries can't use file and store together");

            // retention, count limit and rollups over chunks
            __tsRetention(name, so("ret"));
            __tsMaxPoints(name, so("max"));
            __tsRollups(name, so("roll"));

            // many points across many chunks in one setAll
            $ch(name).create(true, "timeseries", { store: { type: "mvs", options: { file: dir + "/b.db" } }, chunk: "1s" });
            var vals = [];
            for (var i = 0; i < 500; i++) vals.push({ metric: "big", labels: { n: "1" }, ts: i * 100, v: i });
            $ch(name).setAll([ "metric", "labels", "ts" ], vals);
            ow.test.assert($ch(name).size(), 500, "Problem with a timeseries store setAll");
            ow.test.assert(u.range(name, { metric: "big" }, { from: 9500, to: 10499 }).map(x => x.v), [ 95, 96, 97, 98, 99, 100, 101, 102, 103, 104 ], "Problem reading a timeseries store across chunks");
            ow.test.assert(u.range(name, { metric: "big" }, { from: 9500, to: 10499, step: "1s", fn: "count" }).map(x => x.v), [ 5, 5 ], "Problem with a timeseries store range");
            $ch(name).destroy();
        } finally {
            try { $ch(name).destroy(); } catch(e) {}
            io.rm(dir);
        }
    };

    exports.testTimeSeriesIntegrations = function() {
        var u = ow.ch.utils.timeseries;
        var name = "ts-int-" + genUUID(), src = "ts-src-" + genUUID(), name2 = "ts-int2-" + genUUID();
        try {
            $ch(name).create(true, "timeseries", {});

            // channel subscriber
            $ch(src).create();
            $ch(src).subscribe(u.getTimeSeriesSubscriber(name, { metric: "temp", labels: [ "room" ], value: "t", ts: "when" }));
            $ch(src).set({ id: 1 }, { id: 1, room: "kitchen", t: 21.5, when: 1000 });
            $ch(src).set({ id: 2 }, { id: 2, room: "kitchen", t: 22, when: 2000 });
            $ch(src).setAll([ "id" ], [ { id: 3, room: "hall", t: 18, when: 2000 } ]);
            $ch(src).waitForJobs(15000);
            ow.test.assert($ch(name).get({ metric: "temp", labels: { room: "kitchen" } }).v, 22, "Problem with the timeseries subscriber (set)");
            ow.test.assert($ch(name).get({ metric: "temp", labels: { room: "hall" }, ts: 2000 }).v, 18, "Problem with the timeseries subscriber (setAll)");
            ow.test.assert($ch(name).size(), 3, "Problem with the timeseries subscriber size");
            $ch(src).destroy();
            u.drop(name, {});

            // multiple value fields
            $ch(src).create();
            $ch(src).subscribe(u.getTimeSeriesSubscriber(name, { metric: "cpu", labels: [ "host" ], values: [ "user", "sys" ], ts: "when" }));
            $ch(src).set({ id: 1 }, { id: 1, host: "a", user: 0.3, sys: 0.1, when: 5000 });
            $ch(src).waitForJobs(15000);
            ow.test.assert(u.series(name, {}).map(s => s.metric).sort(), [ "cpu_sys", "cpu_user" ], "Problem with the timeseries subscriber (values)");
            $ch(src).destroy();
            u.drop(name, {});

            // collector
            var col = u.collect(__, name, () => ({ jvm: { mem: { used: 10, free: 5 }, name: "x" }, up: true, cpus: [ 1, 2 ] }), { labels: { app: "t" }, prefix: "oaf_" });
            ow.test.assert(col.once(), 5, "Problem with the timeseries collector");
            ow.test.assert(u.series(name, { metric: "oaf_jvm_mem_used" }).length, 1, "Problem with the timeseries collector metric names");
            ow.test.assert(u.latest(name, { metric: "oaf_up" })[0].v, 1, "Problem with the timeseries collector booleans");
            ow.test.assert(u.latest(name, { metric: "oaf_cpus", labels: { idx: "1" } })[0].v, 2, "Problem with the timeseries collector arrays");
            ow.test.assert(u.latest(name, { metric: "oaf_up" })[0].app, "t", "Problem with the timeseries collector labels");
            u.drop(name, {});
            var n = 0;
            var col2 = u.collect(50, name, () => [ { metric: "tick", labels: { k: "v" }, v: ++n } ]);
            var tries = 0;
            while($ch(name).size() < 2 && tries++ < 100) sleep(50);
            col2.stop();
            ow.test.assert($ch(name).size() >= 2, true, "The periodic timeseries collector must record points");
            var sz = $ch(name).size();
            sleep(200);
            ow.test.assert($ch(name).size() <= sz + 1, true, "A stopped timeseries collector must stop recording");
            u.drop(name, {});

            // OpenMetrics
            $ch(name).set({ metric: "http_requests_total", labels: { code: "200", path: "/a,b \"q\"" }, ts: 1500 }, { v: 10 });
            $ch(name).set({ metric: "http_requests_total", labels: { code: "500", path: "/x" }, ts: 1500 }, { v: 2 });
            $ch(name).set({ metric: "http_requests_total", labels: { code: "500", path: "/x" }, ts: 2500 }, { v: 3 });
            $ch(name).set({ metric: "temp.c", ts: 1500 }, { v: 1.5 });
            var txt = u.toOpenMetrics(name, {}, { help: { http_requests_total: { help: "Requests", type: "counter" } } });
            ow.test.assert(txt.indexOf("# TYPE http_requests_total counter") >= 0, true, "Problem with the OpenMetrics type line");
            ow.test.assert(txt.indexOf("http_requests_total{code=\"500\",path=\"/x\"} 3 2.5") >= 0, true, "Problem with the OpenMetrics latest line");
            ow.test.assert(txt.indexOf("temp_c 1.5 1.5") >= 0, true, "Problem with the OpenMetrics metric name");
            ow.test.assert(u.toOpenMetrics(name, { metric: "temp.c" }, { timestamps: false }), "temp_c 1.5\n", "Problem with OpenMetrics without timestamps");
            ow.test.assert(u.toOpenMetrics(name, { metric: "http_requests_total", labels: { code: "500" } }, { from: 0 }).split("\n").filter(l => l.length > 0).length, 2, "Problem exporting all points as OpenMetrics");
            $ch(name2).create(true, "timeseries", {});
            ow.test.assert(u.fromOpenMetrics(name2, u.toOpenMetrics(name, {}, { from: 0 }), { labels: { src: "t" } }), 4, "Problem importing OpenMetrics");
            ow.test.assert($ch(name2).get({ metric: "http_requests_total", labels: { code: "200", path: "/a,b \"q\"", src: "t" }, ts: 1500 }).v, 10, "Problem importing OpenMetrics labels");
            ow.test.assert($ch(name2).get({ metric: "http_requests_total", labels: { code: "500", path: "/x", src: "t" } }).ts, 2500, "Problem importing OpenMetrics timestamps");
            ow.test.assert(u.fromOpenMetrics(name2, "# comment\nfoo 4\nbar{a=\"1\"} 5 7", { ts: 100 }), 2, "Problem importing OpenMetrics without timestamps");
            ow.test.assert($ch(name2).get({ metric: "foo" }).ts, 100, "Problem with the default OpenMetrics timestamp");
            ow.test.assert($ch(name2).get({ metric: "bar", labels: { a: "1" } }).ts, 7000, "Problem with the OpenMetrics timestamp unit");
        } finally {
            [ name, name2, src ].forEach(n => { try { $ch(n).destroy(); } catch(e) {} });
        }
    };

    exports.testTimeSeriesConcurrency = function() {
        var u = ow.ch.utils.timeseries;
        var name = "ts-conc-" + genUUID();
        var errors = [];
        try {
            $ch(name).create(true, "timeseries", { rollups: [ { step: "1s" } ] });
            plugin("Threads");
            var N = 1500;
            var th = new Threads();
            [ 0, 1 ].forEach(function(w) {
                th.addThread(function() {
                    try { for (var i = 0; i < N; i++) $ch(name).set({ metric: "s", labels: { k: "1" }, ts: 1000 + i * 2 + w }, { v: i }); } catch(e) { errors.push("w" + w + ": " + e); }
                });
            });
            th.addThread(function() {
                try {
                    for (var i = 0; i < 100; i++) {
                        u.range(name, { metric: "s" }, { step: "1s", fn: "avg" });
                        u.latest(name, {});
                        $ch(name).getKeys();
                        u.stats(name);
                    }
                } catch(e) { errors.push("reader: " + e); }
            });
            th.addThread(function() {
                try { for (var i = 0; i < 300; i++) $ch(name).setAll([ "metric", "labels", "ts" ], [ { metric: "b", ts: i * 10, v: i }, { metric: "b", ts: i * 10 + 1, v: i } ]); } catch(e) { errors.push("batch: " + e); }
            });
            th.start();
            th.stop();
            ow.test.assert(errors, [], "Concurrent timeseries access failed");
            ow.test.assert($ch(name).size(), N * 2 + 600, "Concurrent timeseries writes lost points");
            var ts = $ch(name).getKeys({ metric: "s" }).map(k => k.ts);
            var sorted = true;
            for (var i = 1; i < ts.length; i++) if (ts[i] <= ts[i - 1]) sorted = false;
            ow.test.assert(sorted, true, "Concurrent timeseries writes broke the point order");
            var tot = u.range(name, { metric: "s" }, { step: "1d", fn: "count", tier: "1s" }).reduce((a, r) => a + r.v, 0);
            ow.test.assert(tot, N * 2, "Concurrent timeseries writes broke the rollups");
        } finally {
            try { $ch(name).destroy(); } catch(e) {}
        }
    };

    exports.testAll = function() {
        $ch("allA").destroy();
        $ch("allB").destroy();
        $ch("allC").destroy();

        $ch("allA").create();
        $ch("allB").create();
        var flag = false;
        $ch("allC").create(1, "all", { chs: [ "allA", "allB" ], fn: (aOp, aK) => { 
           if (flag) {
             return ["allB"];
           } else {
             return ["allA", "allB"];
           } 
        }});

        $ch("allC").setAll(["canonicalPath"], io.listFiles(".").files);

        ow.test.assert($ch("allA").size(), $ch("allB").size(), "Problem 1 with all channel sync");
        ow.test.assert($ch("allA").size(), $ch("allC").size(), "Problem 2 with all channel sync");
    
        flag = true; 
        $ch("allC").set({ canonicalPath: "_mytest" }, { canonicalPath: "_mytest" });
        ow.test.assert($ch("allA").size() < $ch("allB").size(), true, "Problem with all channel with function");
        ow.test.assert($ch("allB").size(), $ch("allC").size(), "Problem with all channel sync with function");
    };

    exports.setChType = function(aChType) {
        this.chType = aChType;
    };

    exports.testElasticIndex = () => {
        var today = ow.loadFormat().fromDate(new Date(), "yyyy.MM.dd");
        ow.test.assert(ow.ch.utils.getElasticIndex("a test")(), "a test-" + today, "Problem with getElasticIndex default format.");
        today = ow.format.fromDate(new Date(), "yyyyMMdd");
        ow.test.assert(ow.ch.utils.getElasticIndex("a test", "yyyyMMdd")(), "a test-" + today, "Problem with getElasticIndex custom format.");
    };
})();
