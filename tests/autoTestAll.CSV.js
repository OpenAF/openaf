(function() {
    exports.testCSV = function() {
        var csvString = "A;B;C\r\n1;a;\"b\"\n2;1;\"2\"";
        var csv = new CSV(csvString);
        if (csv.csv()[0].A != 1 ||
            csv.csv()[0].B != 'a' ||
            csv.csv()[0].C != 'b') throw "Failed CSV generation on constructor!";
        var csvString = "A;B;C\n1;\"a\";\"b\"\n2;\"1\";\"2\"";
        if(csv.w().replace(/\r/g, "") !== csvString) throw "Failed to convert CSV back to string!";
    
        var csvObj = csv.csv();
        csv.clear();
        csv.toCsv(csvObj);
        if (csv.csv()[0].A != 1 ||
            csv.csv()[0].B != 'a' ||
            csv.csv()[0].C != 'b') throw "Failed CSV generation on toCsv!";    
    };

    exports.testStreamCSV = function() {
        var csv = new CSV();

        // Testing writing
        var os = io.writeFileStream("autoTestAll.csv");
        csv.setStreamFormat( { format: "DEFAULT", withHeader: true, quoteMode: "NON_NUMERIC", withHeaders: ["A", "B", "C"]} );

        var oo = [];
        oo.push({ A: "1", B: "a", C: 2 });
        oo.push({ A: "2", B: 1, C: "2" });
        var oss = clone(oo);

        csv.toStream(os, function() {
            return oo.pop();
        });
        os.close();

        // Testing reading
        var is = io.readFileStream("autoTestAll.csv");
        var ot = [];

        csv = new CSV();
        csv.setStreamFormat( { format: "DEFAULT", withHeader: true, quoteMode: "NON_NUMERIC", withHeaders: ["A", "B", "C"]} );
        csv.fromStream(is, function(aMap) {
            ot.push(aMap);
        });
        is.close();

        ow.test.assert($path(oss, "[?A=='1'].B"), $path(ot, "[?A=='1'].B"), "Read CSV file not equal to written CSV file.");

        io.rm("autoTestAll.csv");
    };

    exports.testToFromArrayCSV = function() {
        var csv = new CSV();

        var oo = [];
        oo.push({ A: "1", B: "a", C: 2 });
        oo.push({ A: "2", B: 1, C: "2" });

        csv.fromArray2File(oo, "autoTestAll.csv");
        var ot = csv.fromFile2Array("autoTestAll.csv");

        ow.test.assert($path(oo, "[?A=='1'].B"), $path(ot, "[?A=='1'].B"), "Read CSV file to array not equal from array to CSV file.");

        io.rm("autoTestAll.csv");
    };
})();
