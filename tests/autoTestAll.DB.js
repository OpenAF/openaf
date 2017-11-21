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
        af.rm(f);
    
        var t3 = Number(db.q("select count(1) as c from test").results[0].C);
    
        if (t1 != t3)
            throw "Something wrong with the in memory database in reloading.";
    
        db.close();
    };
})();