// Copyright 2023 Nuno Aguiar

(function() {
    exports.testDBInMemory = function() {
        var db = createDBInMem("test", false);
        var l = [{operation: "hi", version:"1"}, {operation: "bye", version:"1"}];
        db.u("create table test (c1 number(12), c2 varchar2(255))");
        db.usArray("insert into test (c1, c2) values (?, ?)",
                    $from(l).select(function(r) { return [r.version, r.operation]; }));
    
        var t1 = l.length;
        var t2 = Number(db.q("select count(1) as c from test").results[0].C);
        ow.test.assert(t1, t2, "Something wrong with the in memory database.");
    
        var f = String((new java.text.SimpleDateFormat("YYYYMMDDHHmmss")).format(new Date())) + ".test";
        db.commit();
        persistDBInMem(db, f);
        db.close();
    
        db = createDBInMem("test2", false);
        loadDBInMem(db, f);
        io.rm(f);
    
        var t3 = Number(db.q("select count(1) as c from test").results[0].C);
    
        if (t1 != t3)
            throw "Something wrong with the in memory database in reloading.";
    
        db.close();
    };

    exports.testDBTypeConversion = function() {
        var db = createDBInMem("test2", false);
        db.convertDates(true);

        var res = db.q("select 1 i, 1.5 f1, 1.0 f2, 'abc' t, now() d from dual").results[0];

        ow.test.assert(res.I === 1, true, "Problem with db integer conversion");
        ow.test.assert(res.F1 === 1.5, true, "Problem with db float conversion 1");
        ow.test.assert(res.F2 === 1.0, true, "Problem with db float conversion 2");
        ow.test.assert(res.T === "abc", true, "Problem with db string conversion");
        ow.test.assert(Object.prototype.toString.call(res.D) == "[object Date]", true, "Problem with db date conversion");

        db.u("create table teste (a varchar(10), b date)");
        db.u("insert into teste values ('aaa', now())");
        db.u("insert into teste values ('bbb', now())");
        db.u("insert into teste values ('ccc', null)");
        
        ow.test.assert(db.q("select * from teste").results.length, 3, "Problem with null dates conversion");

        db.close();
    };

    exports.testDBPreparedStatements = function() {
        var db = createDBInMem("binds_" + genUUID(), false);
        var insert = "insert into binds values (?, ?)", query = "select * from binds where id = ? and val = ?";
        var fails = function(fn, message) {
            var failed = false;
            try { fn(); } catch (e) { failed = true; }
            ow.test.assert(failed, true, message);
        };
        try {
            db.u("create table binds (id integer primary key, val integer)");
            db.us(insert, [1, 10], true);
            fails(() => db.us(insert, [2], true), "Incomplete cached update reused an old value");
            fails(() => db.us(insert, [2, 20, 30], true), "Binding failure was swallowed");
            ow.test.assert(db.q("select * from binds").results.length, 1, "Invalid update wrote a row");
            db.us(insert, [2, null], false);
            ow.test.assert(db.q("select val from binds where id = 2").results[0].VAL, null, "Explicit null was not bound");
            ow.test.assert(db.qs(query, [1, 10], true).results.length, 1, "Cached query failed");
            fails(() => db.qs(query, [1], true), "Incomplete cached query reused an old value");
            fails(() => db.qs(query, [1, 10, 30], false), "Query binding failure was swallowed");
            ow.test.assert(db.qs(query, [1, 10], false).results.length, 1, "Mixed cache flags failed");
            ow.test.assert(db.qs(query, [1, 10], true).results.length, 1, "Mixed cache flags closed a cached statement");
            fails(() => db.usArray(insert, [[3, 30], [4]], 100, true), "Incomplete batch row reused an old value");
            fails(() => db.usArray(insert, [[5, 50], [6, 60, 70]], 100, true), "Batch binding failure was swallowed");
            db.usArray(insert, [[7, null]], 100, false);
            ow.test.assert(db.q("select id from binds where id in (3, 4, 5, 6)").results.length, 0, "Failed batch left pending rows for reuse");
            ow.test.assert(db.q("select val from binds where id = 7").results[0].VAL, null, "Batch null was not bound");
            db.closeStatement(query);
            ow.test.assert(db.getStatements().indexOf(query), -1, "closeStatement retained its cache entry");
            ow.test.assert(db.qs(query, [1, 10], true).results.length, 1, "Reuse after closeStatement failed");
            db.closeAllStatements();
            ow.test.assert(db.getStatements().length, 0, "closeAllStatements retained cache entries");
            ow.test.assert(db.qs(query, [1, 10], true).results.length, 1, "Reuse after closeAllStatements failed");
            db.us(insert, [8, 80], true);
            ow.test.assert(db.q("select * from binds").results.length, 4, "Unexpected writes after invalid binds");
            fails(() => db.usArray(insert, [[9, 90], [1, 11], [10, 100]], 100, true), "Duplicate key batch should fail");
            // Drivers may execute some valid rows before reporting a batch error; no rollback is promised.
            var count = db.q("select * from binds").results.length;
            db.usArray(insert, [[11, 110]], 100, false);
            ow.test.assert(db.q("select * from binds").results.length, count + 1, "Failed execution left queued rows");
        } finally {
            db.close();
        }
    };

    exports.testDBStatementCleanup = function() {
        var db = createDBInMem("cleanup_" + genUUID(), false);
        var core = new Packages.openaf.core.DB();
        var connectionField = core.getClass().getDeclaredField("con");
        connectionField.setAccessible(true);
        var cacheField = core.getClass().getDeclaredField("preparedStatements");
        cacheField.setAccessible(true);
        var prepared = [], failClose = false, closeAttempts = 0;
        var proxy = function(type, delegate, intercept) {
            return java.lang.reflect.Proxy.newProxyInstance(type.getClassLoader(), [type], new JavaAdapter(java.lang.reflect.InvocationHandler, {
                invoke: function(object, method, args) {
                    intercept(String(method.getName()));
                    try { return method.invoke(delegate, args); }
                    catch (e) { throw e.javaException.getCause(); }
                }
            }));
        };
        var connection = db.getConnect();
        var connectionType = java.lang.Class.forName("java.sql.Connection");
        var statementType = java.lang.Class.forName("java.sql.PreparedStatement");
        connectionField.set(core, java.lang.reflect.Proxy.newProxyInstance(connectionType.getClassLoader(), [connectionType], new JavaAdapter(java.lang.reflect.InvocationHandler, {
            invoke: function(object, method, args) {
                var result;
                try { result = method.invoke(connection, args); }
                catch (e) { throw e.javaException.getCause(); }
                if (String(method.getName()) == "prepareStatement") {
                    prepared.push(result);
                    return proxy(statementType, result, name => {
                        if (name == "close") {
                            closeAttempts++;
                            if (failClose) {
                                result.close();
                                java.sql.DriverManager.getConnection("jdbc:openaf-test-close-failure:");
                            }
                        }
                    });
                }
                return result;
            }
        })));
        var params = function(values) {
            var list = Packages.openaf.AFCmdBase.jse.getNewList(null);
            values.forEach(v => list.add(v));
            return list;
        };
        var fails = function(fn) {
            var failed = false;
            try { fn(); } catch (e) { failed = true; }
            ow.test.assert(failed, true, "Expected database failure");
        };
        try {
            db.u("create table cleanup (id integer)");
            fails(() => core.us("insert into cleanup values (?)", params([1, 2]), false));
            ow.test.assert(prepared[0].isClosed(), true, "Uncached failed update leaked its statement");
            fails(() => core.qs("select * from cleanup where id = ?", params([1, 2]), false));
            ow.test.assert(prepared[1].isClosed(), true, "Uncached failed query leaked its statement");
            var rows = Packages.openaf.AFCmdBase.jse.getNewList(null);
            rows.add(params([1, 2]));
            fails(() => core.usArray("insert into cleanup values (?)", rows, 100, false));
            ow.test.assert(prepared[2].isClosed(), true, "Uncached failed batch leaked its statement");
            var sql = "select * from cleanup where id = ?";
            core.qs(sql, params([1]), true);
            core.qs(sql, params([1]), false);
            ow.test.assert(prepared[3].isClosed(), false, "Non-caching query closed a cached statement");
            prepared[3].close();
            core.qs(sql, params([1]), true);
            ow.test.assert(prepared.length, 5, "Closed cached statement was not replaced");
            core.us("insert into cleanup values (?)", params([1]), true);
            core.us("insert into cleanup values (?)", params([2]), false);
            var batchRows = Packages.openaf.AFCmdBase.jse.getNewList(null);
            batchRows.add(params([3]));
            core.usArray("insert into cleanup values (?)", batchRows, 100, false);
            ow.test.assert(prepared[5].isClosed(), false, "Non-caching update or batch closed a cached statement");
            var before = closeAttempts;
            failClose = true;
            fails(() => core.closeAllStatements());
            ow.test.assert(closeAttempts - before, 2, "closeAllStatements stopped after first close error");
            ow.test.assert(cacheField.get(core).size(), 0, "Close failure left cache entries");
            failClose = false;
            core.qs(sql, params([1]), true);
            failClose = true;
            fails(() => core.closeStatement(sql));
            ow.test.assert(cacheField.get(core).size(), 0, "Single close failure left a cache entry");
            failClose = false;
            core.qs(sql, params([1]), true);
            failClose = true;
            fails(() => core.close());
            ow.test.assert(connection.isClosed(), true, "Statement close failure prevented connection cleanup");
        } finally {
            failClose = false;
            core.closeAllStatements();
            db.close();
        }
    };

})();