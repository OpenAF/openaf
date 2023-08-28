// Copyright 2023 Nuno Aguiar

(function() {
    exports.testCSV = function() {
        var csvString = "A;B;C\r\n1;a;\"b\"\n2;1;\"2\"";
        var csv = new CSV(csvString);
        ow.test.assert(csv.csv()[0].A != 1 ||
            csv.csv()[0].B != 'a' ||
            csv.csv()[0].C != 'b', false, "Failed CSV generation on constructor!")
        var csvString = "A;B;C\n1;\"a\";\"b\"\n2;\"1\";\"2\"";
        ow.test.assert(csv.w().replace(/\r/g, "") !== csvString, false, "Failed to convert CSV back to string!")
    
        var csvObj = csv.csv();
        csv.clear();
        csv.toCsv(csvObj);
        ow.test.assert(csv.csv()[0].A != 1 ||
            csv.csv()[0].B != 'a' ||
            csv.csv()[0].C != 'b', false, "Failed CSV generation on toCsv!")
    };

    exports.test$CSV = function() {
        var csvString = "A;B;C\r\n1;a;\"b\"\n2;1;\"2\""
        var ar = $csv().withDelimiter(";").fromInString(csvString).toOutArray()
        ow.test.assert(ar[0].A != 1 || ar[0].B != 'a' || ar[0].C != 'b', false, "Failed $CSV generation on constructor")

        var csvString = "A;B;C\n1;a;b\n2;1;2"
        var out = af.newOutputStream()
        $csv()
        .withDelimiter(";")
        .toOutStream(out)
        .fromInArray( $csv()
                      .withDelimiter(";")
                      .fromInString(csvString)
                      .toOutArray() 
        )
        ow.test.assert(String(out.toString()).replace(/\r/g, "").trim() !== csvString, false, "Failed to convert $CSV back to string!")

    }

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

    exports.testToFromArray$CSV = function() {
        var oo = []
        oo.push({ A: "1", B: "a", C: 2 })
        oo.push({ A: "2", B: 1, C: "2" })

        $csv().toOutFile("autoTestAll1.csv").fromInArray(oo)
        var ot = $csv().fromInFile("autoTestAll1.csv").toOutArray()

        ow.test.assert($path(oo, "[?A=='1'].B"), $path(ot, "[?A=='1'].B"), "Read CSV file to array not equal from a ($csv)")
        io.rm("autoTestAll1.csv")
    }
})();
