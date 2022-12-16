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
})();