ow.loadFormat();
ow.loadTest();

var day = ow.format.fromDate(new Date(0), "yyyy-MM-dd", "UTC");
ow.test.assert(day, "1970-01-01", "UTC date formatting");
print(stringify({ day: day, size: ow.format.toBytesAbbreviation(2048) }, __, ""));
