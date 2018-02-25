(function() {
    exports.testXLSSimple = function() {
        io.rm("autoTestAll.xlsx");
        plugin("XLS");
        var xls = new XLS();
        var sheet = xls.getSheet("testSheet");
    
        var arr = [];
        arr.push({"First": "AA1", "Last": "AA2"});
        arr.push({"First": "BB1", "Last": "BB2"});
        arr.push({"First": "CC1", "Last": "CC2"});
    
        xls.setTable(sheet, "B", 2, arr);
        xls.writeFile("autoTestAll.xlsx");
        xls.close();
    };

    exports.testXLSLoad = function() {
        plugin("XLS");
        var xls = new XLS("autoTestAll.xlsx");
        var sheet = xls.getSheet("testSheet");
    
        var arr = xls.getTable(sheet, true, "B", "2");
        xls.close();
        ow.test.assert(arr.table[1].First, "BB1", "Problem 1 with getting cell value");
        ow.test.assert(arr.table[2].Last, "CC2", "Problem 2 with getting cell value");
        io.rm("autoTestAll.xlsx");
    };
})();