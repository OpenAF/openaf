# CSV

[Home](../index.md) / [All APIs](../all-apis.md) / [CSV](index.md)

<a id="api-csv-csv-45aab7c4"></a>

## CSV.CSV

### CSV.CSV(aCsvString)

Creates a new instance of the CSV object. Optionally you can provide a string that contains a CSV.

Sources:

- src/openaf/core/CSV.java:98

<a id="api-csv-clear-24aea99d"></a>

## CSV.clear

### CSV.clear()

Clears all internal structures. This will clear all data stored previously in this instance.

Sources:

- src/openaf/core/CSV.java:35

<a id="api-csv-csv-3b730369"></a>

## CSV.csv

### CSV.csv() : Array

Returns a javascript array of maps with the current internal CSV representation.

Sources:

- src/openaf/core/CSV.java:419

<a id="api-csv-fromcsv-70df46a0"></a>

## CSV.fromCSV

### CSV.fromCSV(aCSVString)

Tries to convert aCSVString into an internal csv format.

Sources:

- src/openaf/core/CSV.java:194

<a id="api-csv-fromstream-7fbe4f6e"></a>

## CSV.fromStream

### CSV.fromStream(aStream, aFunction)

Tries to read a CSV from aStream a calls aFunction with a map representing the fields of each line. The format is determined by CSV.setStreamFormat and each map entry will have either the number of the field or the corresponding name depending on the header options.

Sources:

- src/openaf/core/CSV.java:467

<a id="api-csv-readfile-e86f3bee"></a>

## CSV.readFile

### CSV.readFile(aFilename) : Number

Tries to read aFilename into the internal CSV representation. If successful the number of read lines will be returned. Otherwise an exception will be raised.

Sources:

- src/openaf/core/CSV.java:378

<a id="api-csv-setseparator-26494448"></a>

## CSV.setSeparator

### CSV.setSeparator(aSeparator)

Sets the default separator to use when building a CSV output (default is ;)

Sources:

- src/openaf/core/CSV.java:47

<a id="api-csv-setstreamformat-08ca6a99"></a>

## CSV.setStreamFormat

### CSV.setStreamFormat(aMap)

Set the options that will be used with CSV.fromStream. Available options are:

- `format` (String)
  You can choose between DEFAULT, EXCEL, INFORMIX_UNLOAD, INFORMIX_UNLOAD_CSV, MYSQL, RFC4180, ORACLE, POSTGRESQL_CSV, POSTGRESQL_TEXT and TDF (please check http://commons.apache.org/proper/commons-csv/user-guide.html)
- `withHeader` (Boolean)
  Tries to automatically use the available header
- `withHeaders` (Array)
  An array of header strings in the order that data lines will appear.
- `quoteMode` (String)
  You can choose between ALL, ALL_NON_NULL, MINIMAL, NON_NUMERIC and NONE.
- `withDelimiter` (String)
  A single character as a custom delimiter
- `withEscape` (String)
  A single character as a custom escape
- `withNullString` (String)

Sources:

- src/openaf/core/CSV.java:486

<a id="api-csv-setstringdelimiter-725dee25"></a>

## CSV.setStringDelimiter

### CSV.setStringDelimiter(aDelimiter)

Sets the default string delimited to use when building a CSV output (default is ")

Sources:

- src/openaf/core/CSV.java:57

<a id="api-csv-tocsv-85fb375f"></a>

## CSV.toCsv

### CSV.toCsv(anArrayOfMaps, anArrayOfKeys)

Tries to convert a javascript `anArrayOfMaps` into an internal csv format. The array should be composed of
maps whose elements must have the same keys (example: `[ { "F1": 1, "F2": abc}, { "F1": 2, "F2": xyz } ]`).
Optionally `anArrayOfKeys` can be provided to restrict the keys used and to force their order.

Sources:

- src/openaf/core/CSV.java:204

<a id="api-csv-tostream-8f487df0"></a>

## CSV.toStream

### CSV.toStream(aStream, aFunction)

Tries to write a CSV to aStream calling aFunction and expecting it to return a map with the fields previously set with CSV.setStreamFormat and corresponding values for each line (each call will represent a line). The fields need to be specificed in withHeaders map property in CSV.setStreamFormat. The aFunction will be called continuosly until a different output from a map is returned. Note: aStream won't be closed.

Sources:

- src/openaf/core/CSV.java:476

<a id="api-csv-w-0fd3a152"></a>

## CSV.w

### CSV.w() : String

Returns the current CSV internal representation in the form of a string.

Sources:

- src/openaf/core/CSV.java:325

<a id="api-csv-writefile-3ea6ee5e"></a>

## CSV.writeFile

### CSV.writeFile(aFilename) : Number

Tries to write the internal CSV representation into aFilename. If successful it will return the number of lines written, otherwise an exception will be raised.

Sources:

- src/openaf/core/CSV.java:263

