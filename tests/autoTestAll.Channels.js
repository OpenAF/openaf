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
