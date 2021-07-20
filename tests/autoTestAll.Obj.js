(function() {
    exports.testFlatten = function() {
        ow.loadObj();

        var ar = [];
        ar.push({ a: 1, b: true, c: "a"});
        ar.push({ a: 2, b: true, c: "a"});
        ar.push({ a: 3, b: true, c: "a", d: [ 5,6,7 ]});
        ar.push({ a: 4, b: true, c: "a", d: { a: 12, b: true, c: "b" }});
        ar.push({ a: 5, b: true, c: "a", d: { a: 34, b: true, c: "c" }});
        ar.push({ a: 6, b: true, c: "a", d: { a: 89, b: true, c: "d", d: [ { x: 1, y: 2 } ] }});
        ar.push({ a: 7, b: true, c: "a", d: { a: 99, b: true, c: "e", d: [ { x: 1, y: 2 }, { x: 3, y: 4} ] }});

        var res = ow.obj.flatten(ar);
        ow.test.assert(res.length, 10, "Total result from ow.obj.flatten is different from expected");
        ow.test.assert($from(res).equals("d_d_x", 3).at(0).d_d_y, 4, "Problem with value on map inside an array");
        ow.test.assert($from(res).equals("b", true).count(), 10, "Problem with replication of booleans");
        ow.test.assert($from(res).equals("c", "a").count(), 10, "Problem with replication of strings");
        ow.test.assert($from(res).equals("d_d_x", 3).notEquals("d_a", 99).none(), true, "Problem with replication of numbers");
        ow.test.assert($from(res).equals("d_b", true).count(), 5, "Problem with replication of map through sub-arrays");
        ow.test.assert($from(res).equals("d_d_x", "").count(), 7, "Problem with initalizing no existing values");

        var res2 = ow.obj.flatten(ar, ":");
        ow.test.assert(res2.length, 10, "Total result from ow.obj.flatten is different from expected for different separator");
        ow.test.assert($from(res2).equals("d:d:x", 3).at(0)["d:d:y"], 4, "Problem with value on map inside an array for different separator");
        ow.test.assert($from(res2).equals("b", true).count(), 10, "Problem with replication of booleans for different separator");
        ow.test.assert($from(res2).equals("c", "a").count(), 10, "Problem with replication of strings for different separator");
        ow.test.assert($from(res2).equals("d:d:x", 3).notEquals("d:a", 99).none(), true, "Problem with replication of numbers for different separator");
        ow.test.assert($from(res2).equals("d:b", true).count(), 5, "Problem with replication of map through sub-arrays for different separator");
        ow.test.assert($from(res2).equals("d:d:x", "").count(), 7, "Problem with initalizing no existing values for different separator");

        var res3 = ow.obj.flatten(ar, ":", "n/a");
        ow.test.assert(res3.length, 10, "Total result from ow.obj.flatten is different from expected for different separator and default n/a");
        ow.test.assert($from(res3).equals("d:d:x", 3).at(0)["d:d:y"], 4, "Problem with value on map inside an array for different separator and default n/a");
        ow.test.assert($from(res3).equals("b", true).count(), 10, "Problem with replication of booleans for different separator and default n/a");
        ow.test.assert($from(res3).equals("c", "a").count(), 10, "Problem with replication of strings for different separator and default n/a");
        ow.test.assert($from(res3).equals("d:d:x", 3).notEquals("d:a", 99).none(), true, "Problem with replication of numbers for different separator and default n/a");
        ow.test.assert($from(res3).equals("d:b", true).count(), 5, "Problem with replication of map through sub-arrays for different separator and default n/a");
        ow.test.assert($from(res3).equals("d:d:x", "n/a").count(), 7, "Problem with initalizing no existing values for different separator and default n/a");
    };

    exports.testRESTErrors = function() {
        ow.loadObj();

        var res200 = ow.obj.rest.get("https://httpstat.us/200");
        ow.test.assert(res200.responseCode, 200, "Problem with obtaining a HTTP 200 code");

        var res400;
        try {
            res400 = ow.obj.rest.get("https://httpstat.us/400");
        } catch(e) {
            res400 = ow.obj.rest.exceptionParse(e);
        }
        ow.test.assert(res400.responseCode, 400, "Problem with obtaining and parsing the HTTP 400 code");

        var res401;
        try {
            res401 = ow.obj.rest.get("https://httpstat.us/401");
        } catch(e) {
            res401 = ow.obj.rest.exceptionParse(e);
        }
        ow.test.assert(res401.responseCode, 401, "Problem with obtaining and parsing the HTTP 401 code");

        var res500;
        try {
            res500 = ow.obj.rest.get("https://httpstat.us/500");
        } catch(e) {
            res500 = ow.obj.rest.exceptionParse(e);
        }
        ow.test.assert(res500.responseCode, 500, "Problem with obtaining and parsing the HTTP 500 code");
    };

    exports.testGetPath = function() {
        ow.loadObj();

        var a = { a : 1, b : { c: 2, d: [0, 1] } };

        ow.test.assert(ow.obj.getPath(a, "b.c"), 2, "Problem with retriving a number with ow.obj.getPath");
        ow.test.assert(ow.obj.getPath(a, "b.d"), [0, 1], "Problem with retriving an array with ow.obj.getPath");
        ow.test.assert(ow.obj.getPath(a, "b.d[0]"), 0, "Problem with retriving an element of an array with ow.obj.getPath");
    };

     exports.testSetPath = function() {
        ow.loadObj();

        var a = { a : 1, b : { c: 2, d: [0, 1] } };

        ow.test.assert(ow.obj.getPath(ow.obj.setPath(a, "b.c", 1234), "b.c"), 1234, "Problem with retriving a number after ow.obj.setPath");
        ow.test.assert(ow.obj.getPath(ow.obj.setPath(a, "b.d", [ 0, 1, 2 ]), "b.d"), [0, 1, 2], "Problem with retriving an array after ow.obj.setPath");
        ow.test.assert(ow.obj.getPath(ow.obj.setPath(a, "b.d[0]", 4321), "b.d[0]"), 4321, "Problem with retriving an element of an array after ow.obj.setPath");
    };   

    exports.testFuzzySearch = function() {
        ow.loadObj();

        var data = [{n: "World War I"}, {n: "World War II"}, {n: "Name a war"}, {n: "Name some war"}];

        var res1 = ow.obj.fuzzySearch(["n"], data, "world");
        var res2 = ow.obj.fuzzySearch(["n"], data, "name");

        ow.test.assert(res1.length, 2, "Problem fuzzy searching by world.");
        ow.test.assert(res2.length, 2, "Problem fuzzy searching by name.");
    };

    exports.testArray2Obj = function() {
        ow.loadObj();

        var ar = [{a:1, b:true}, {a:2, b:false}, {a:3, b:true}];

        var res1 = ow.obj.fromArray2Obj(ar);
        var res2 = ow.obj.fromArray2Obj(ar, "a");

        ow.test.assert(Object.keys(res1), ["row0", "row1", "row2"], "Problem with array to obj simple");
        ow.test.assert(res1.row1.b, false, "Problem with array to obj simple 2");
        ow.test.assert(Object.keys(res2), [ "1", "2", "3" ], "Problem with array to obj indexed by a field");
        ow.test.assert(res2["2"].b, false, "Problem with array to obj indexed by a filed 2");
    };

    exports.testObj2Array = function() {
        ow.loadObj();

        var ar = { "a1": { a:1, b: true}, "a2": { a:2, b: false}, "a3": { a:3, b: true} };
        var res1 = ow.obj.fromObj2Array(ar); 
        var res2 = ow.obj.fromObj2Array(ar, "key");
        
        ow.test.assert(res1[1].b, false, "Problem with obj to array simple.");
        ow.test.assert(res2[1].key, "a2", "Problem with obj to array simple 2");
    };

    exports.testArray2OrdObj = function() {
        ow.loadObj();

        var ar = [ {a:1}, {a:2}, {a:3}];
        var res = ow.obj.fromArray2OrderedObj(ar);

        ow.test.assert(res["0"], 1, "Problem with first map element on array to ordered object");
        ow.test.assert(res["2"], 3, "Problem with last map element on array to ordered object");
        ow.test.assert(res["1"], 2, "Problem with middle map element on array to ordered object");
    };

    exports.testOrdObj2Array = function() {
        ow.loadObj();

        var ar = { "1": { a:1}, "2": {a:2}, "3": {a:3}}
        var res = ow.obj.fromOrderedObj2Array(ar);

        ow.test.assert(res[0], 1, "Problem with first map element on array to ordered object");
        ow.test.assert(res[2], 3, "Problem with last map element on array to ordered object");
        ow.test.assert(res[1], 2, "Problem with middle map element on array to ordered object");

        ar = { "row_2": { a:3}, "row_1": {a:2}, "row_0": {a:1}};
        res = ow.obj.fromOrderedObj2Array(ar, (a,b) => { return Number(a.replace(/row_/,"")) - Number(b.replace(/row_/,"")) });

        ow.test.assert(res[0], 1, "Problem with first map element on array to ordered object with function");
        ow.test.assert(res[2], 3, "Problem with last map element on array to ordered object with function");
        ow.test.assert(res[1], 2, "Problem with middle map element on array to ordered object with function");
    };    

    exports.testSyncArray = function() {
        ow.loadObj();

        var ar = new ow.obj.syncArray([3,2,1]);
        ow.test.assert(Number(ar.get(1)), Number(2), "Problem with syncArray.get.");
        ow.test.assert(ar.length(), 3, "Problem with syncArray length.");

        ar.add(4);
        ow.test.assert(ar.indexOf(2), 1, "Problem with syncArray indexOf.");
        ar.remove(1);
        ow.test.assert(ar.indexOf(2), -1, "Problem with syncArray indexOf or remove.");
        ar.set(1, 2);
        ow.test.assert(ar.indexOf(2), 1, "Problem with syncArray set.");
        ow.test.assert(Number(ar.toArray()[2]), Number(4), "Problem with syncArray toArray.");
    };

    exports.testSchema = function() {
        var schema = {
            "required": [
              "id"
            ],
            "properties": {
                "id": {
                    "type": "integer"
                },
                "name": {
                    "type": "string",
                    "maxLength": 40
                },
                "description": {
                    "type": "string"
                }
            }
        };

        ow.loadObj();
        ow.test.assert(ow.obj.schemaCheck(schema), true, "Problem with schema check.");
        var wrongSchema = clone(schema); wrongSchema.properties.id.type = "long";
        ow.test.assert(ow.obj.schemaCheck(wrongSchema), false, "Problem with wrong schema check.");

        ow.test.assert(ow.obj.schemaValidate(schema, { id: 1234 }), true, "Problem with simple schema validation.");
        ow.test.assert(ow.obj.schemaCompile(schema)({ id: 1234, name: "Teste" + repeat(40, '-') }), false, "Problem with schema length validation.");

        ow.obj.schemaAdd("test", schema);
        ow.test.assert(ow.obj.schemaValidate("test", { id: 1234 }), true, "Problem with simple added schema validation.");
        ow.obj.schemaRemove("test");
    };

    exports.testObjPool = function() {
        ow.loadObj();

        var createOps = [], closeOps = [], keepOps = [];
        var createFunc = () => {
            var u = genUUID();
            createOps.push("CREATED " + u);
            return u;
        };
        var closeFunc = (u) => {
            closeOps.push("CLOSE " + u);
        };
        var keepFunc = (u) => {
            keepOps.push("KEEP " + u);
        };

        var p = ow.obj.pool.create();
        p.setMax(2); 
        p.setFactory(createFunc, closeFunc, keepFunc);

        var res;
        p.use((u) => { res = u; });
        ow.test.assert(createOps.length, 1, "Provided pool object was not the first created.");
        p.use((u) => { res = u; });
        ow.test.assert(createOps.length, 1, "Provided pool object was not reused.");

        res = "";
        var promise = $do( () => { 
            p.use( (u) => {
                sleep(50);
                res = u; 
            }); 
        }); 
        p.use((u) => { sleep(5); });
        $doWait(promise);

        ow.test.assert(createOps.length, 2, "Provided pool object was not the second created.");

        res = "";
        promise = $do( () => { 
            p.use( (u) => {
                sleep(50);
            }); 
        }); 
        p.use((u) => { res = u; sleep(5); return false; });
        p.use((u) => { sleep(5); });
        $doWait(promise);

        ow.test.assert(createOps.length, 3, "Althought an object was considered dirty a new one was not created.");
        ow.test.assert(closeOps.length, 1, "Althought an object was considered dirty it wasn't closed.");
        ow.test.assert($from(p.__pool).equals("obj", res).count(), 0, "Althought an object was considered dirty it wasn't removed from the pool.");

        p.setKeepalive(1);
        sleep(2000);
        ow.test.assert(keepOps.length > 0, true, "Keepalive didn't trigger as expected.");
        p.stop();

        createOps = []; closeOps = []; keepOps = [];
        p = ow.obj.pool.create();
        p.setMin(2); 
        p.setFactory(createFunc, closeFunc, keepFunc);
        p.start();

        ow.test.assert(createOps.length, 2, "Minimum number of objects in pool is not correct.");

        p.stop();
        ow.test.assert(closeOps.length, 2, "Objects in pool were not closed properly.");
    };

    exports.testObjGen = function() {
        var data = [
            { n: "one", w: 1 },
            { n: "two", w: 99 }
        ];

        var r1 = ow.obj.oneOf(data, "w");
        var r2 = ow.obj.oneOf(data, "w");
        var r3 = ow.obj.oneOf(data, "w");

        var oneSum = 0, twoSum = 0;
        if (r1.n == "one") oneSum++;
        if (r2.n == "one") oneSum++;
        if (r3.n == "one") oneSum++;
        if (r1.n == "two") twoSum++;
        if (r2.n == "two") twoSum++;
        if (r3.n == "two") twoSum++;

        ow.test.assert(twoSum > oneSum, true, "Problem with ow.obj.oneOf");
    };

    exports.testObjFnGen = function() {
        var data = [
            { fn: () => "one", w: 1 },
            { fn: () => "two", w: 99 }
        ];

        var r1 = ow.obj.oneOfFn(data, "w");
        var r2 = ow.obj.oneOfFn(data, "w");
        var r3 = ow.obj.oneOfFn(data, "w");

        var oneSum = 0, twoSum = 0;

        if (r1 == "one") oneSum++;
        if (r2 == "one") oneSum++;
        if (r3 == "one") oneSum++;
        if (r1 == "two") twoSum++;
        if (r2 == "two") twoSum++;
        if (r3 == "two") twoSum++;

        ow.test.assert(twoSum > oneSum, true, "Problem with ow.obj.oneOfFn");
    };

    exports.testRandomRange = function() {
        var r = ow.obj.randomRange(-5, 10);
        ow.test.assert(r >= -5 && r <= 10, true, "Problem with ow.obj.randomRange");
    };

    exports.testRandomDateRange = function() {
        var r = ow.obj.randomDateRange("yyyyMMdd", "20200101", "20201231");
        ow.test.assert(r.getTime() >= ow.format.toDate("20200101", "yyyyMMdd").getTime(), true, "Problem with ow.obj.randomDateRange (1)");
        ow.test.assert(r.getTime() <= ow.format.toDate("20201231", "yyyyMMdd").getTime(), true, "Problem with ow.obj.randomDateRange (2)");
    };

    exports.testSignObj = function() {
        // Generate a RSA key pair
        ow.loadJava();
        var cipher = new ow.java.cipher();
        var keypair = cipher.genKeyPair();

        // Example map
        var data = {
            x: 1,
            y: -1
        }

        // Signing map
        data = ow.obj.sign(keypair.privateKey, data);

        // Verify
        ow.test.assert(ow.obj.signVerify(keypair.publicKey, data), true, "Problem on verify of signed object (1)");

        // Changing map
        var ndata = clone(data);
        ndata.y = 1;

        // Verify changed
        ow.test.assert(ow.obj.signVerify(keypair.publicKey, ndata), false, "Problem on verify of signed object (2)");
    };
})();