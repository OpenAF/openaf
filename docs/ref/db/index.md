# DB

[Home](../index.md) / [All APIs](../all-apis.md) / [DB](index.md)

<a id="api-db-close-b3af939c"></a>

## DB.close

### DB.close()

Closes the database connection for this DB object instance. In case of error an exception will be thrown.

Sources:

- src/openaf/core/DB.java:101

<a id="api-db-closeallstatements-b7b4d8ef"></a>

## DB.closeAllStatements

### DB.closeAllStatements()

Tries to close all prepared statements for this DB object instance. If an error occurs during this process an exception will be thrown.

Sources:

- src/openaf/core/DB.java:150

<a id="api-db-closestatement-e005b80a"></a>

## DB.closeStatement

### DB.closeStatement(aStatement)

Closes the corresponding prepared statement. If an error occurs during this process an exception will be thrown.

Sources:

- src/openaf/core/DB.java:138

<a id="api-db-commit-d644a61b"></a>

## DB.commit

### DB.commit()

Commits the current transaction associated with this DB object.
An exception will be thrown if any database error occurs.

Example:

```javascript
db.u("INSERT INTO A VALUES (1)");
db.commit();
```

Sources:

- src/openaf/core/DB.java:941

<a id="api-db-convertdates-14a5f1f7"></a>

## DB.convertDates

### DB.convertDates(aFlag)

Sets to true or false (defaults to false) the conversion of Dates to javascript Date objects instead of strings.

Sources:

- src/openaf/core/DB.java:1086

<a id="api-db-db-fc8a9ced"></a>

## DB.db

### DB.db(aDriver, aURL, aLogin, aPassword, aTimeout)

Creates a new instance of the object DB providing java class `aDriver` (e.g. oracle.jdbc.OracleDriver)
that must be included on OpenAF's classpath, a JDBC `aURL`, `aLogin` and `aPassword`. If the `aDriver` is
null or undefined the Oracle driver will be used. Optionally you can provide `aTimeout` in ms.

Examples of JDBC URLs:

- Oracle Thin: `jdbc:oracle:thin:@{{host}}:{{port}}:{{database}}`
- PostgreSQL: `jdbc:postgresql://{{host}}:{{port}}/{{database}}`
- H2: `jdbc:h2:{{file}}`

Covered URL initialization SQL and custom-class hooks are blocked by default.
Trusted URLs require the boolean flags `__flags.DB_ALLOW_JDBC_URL_INIT` and/or
`__flags.DB_ALLOW_JDBC_URL_CUSTOM_CLASSES`. See docs/jdbc-url-policy.md for covered options.

Sources:

- src/openaf/core/DB.java:63

<a id="api-db-getautocommit-ed0908c2"></a>

## DB.getAutoCommit

### DB.getAutoCommit() : boolean

Retrieves the current database connection auto-commit flag state.

Sources:

- src/openaf/core/DB.java:1110

<a id="api-db-getconnect-ddbe8118"></a>

## DB.getConnect

### DB.getConnect() : JavaObject

Returns a Java database connection.

Sources:

- src/openaf/core/DB.java:128

<a id="api-db-getstatements-1334903e"></a>

## DB.getStatements

### DB.getStatements() : Array

Returns the current list of database prepared statements that weren't closed it. Do close them, as soon as possible, using the DB.closeStatement or DB.closeAllStatements functions.

Sources:

- src/openaf/core/DB.java:114

<a id="api-db-h2startserver-4c1c2001"></a>

## DB.h2StartServer

### DB.h2StartServer(aPort, aListOfArguments) : String

Starts a H2 server on aPort (if provided) with an array of arguments (supported options are:  -tcpPort, -tcpSSL, -tcpPassword, -tcpAllowOthers, -tcpDaemon, -trace, -ifExists, -baseDir, -key). After creating the access URL will be returned. In case of error an exception will be thrown.

Sources:

- src/openaf/core/DB.java:1040

<a id="api-db-h2stopserver-cc49e945"></a>

## DB.h2StopServer

### DB.h2StopServer()

Stops a H2 server started for this DB instance.

Sources:

- src/openaf/core/DB.java:1076

<a id="api-db-q-0388acaf"></a>

## DB.q

### DB.q(aQuery) : Map

Executes the SQL query provided in aQuery on the current DB connection. It returns a Map with a results array where each element corresponds to one row. In case of error an exception will be thrown.

Sources:

- src/openaf/core/DB.java:192

<a id="api-db-qlob-c76dfd8b"></a>

## DB.qLob

### DB.qLob(aSQL) : Object

Executes aSQL on the current DB object returning only the first row and column. If that column is a CLOB a string is returned; if it is a BLOB a byte array is provided. Errors will raise an exception.

Sources:

- src/openaf/core/DB.java:493

<a id="api-db-qs-334973e2"></a>

## DB.qs

### DB.qs(aQuery, arrayOfBindVariables, keepStatement) : Map

Performs aQuery (SQL) on the current DB object instance using the bind variables from the arrayOfBindVariables. It returns a Map with a results array that will have an element per result set line. In case of error an  exception will be thrown. Optionally you can specify to keepStatement (e.g. boolean) to keep from closing the prepared statement used for reuse in another qs call. If you specify to use keepStatement do close this query, as soon as possible, using DB.closeStatement(aQuery) (where you provide an exactly equal statement to  aQuery) or DB.closeAllStatements. Cached statements remain open until explicitly closed, including when later calls use keepStatement=false. Every execution requires a complete set of bind values.

Sources:

- src/openaf/core/DB.java:357

<a id="api-db-qsrs-76b19a51"></a>

## DB.qsRS

### DB.qsRS(aQuery, arrayOfBindVariables) : Map

Performs aQuery (SQL) on the current DB object instance using the bind variables from the arrayOfBindVariables. It returns a java ResultSet object that should be closed after use. In case of error an  exception will be thrown. If you specify to use keepStatement do close this query, as soon as possible, using DB.closeStatement(aQuery) (where you provide an exactly equal statement to  aQuery) or DB.closeAllStatements.

Sources:

- src/openaf/core/DB.java:325

<a id="api-db-rollback-6f284764"></a>

## DB.rollback

### DB.rollback(dontIgnoreError)

Rollbacks the current database session on the current DB object instance. In case of error an exception will be thrown if dontIgnoreError = true

Sources:

- src/openaf/core/DB.java:968

<a id="api-db-setautocommit-81b51721"></a>

## DB.setAutoCommit

### DB.setAutoCommit(aFlag)

Sets to true or false (defaults to false) the current database connection auto-commit.

Sources:

- src/openaf/core/DB.java:1096

<a id="api-db-u-934d91a6"></a>

## DB.u

### DB.u(aSQL) : Number

Executes a SQL statement on the current DB object instance. On success it will return the number of rows affected. In case of error an exception will be thrown.

Sources:

- src/openaf/core/DB.java:527

<a id="api-db-ulob-395903c4"></a>

## DB.uLob

### DB.uLob(aSQL, aLOB) : Number

Executes a SQL statement on the current DB object instance to update a CLOB or BLOB provided in aLOB. On success it will return the number of rows affected. In case of error an exception will be thrown.

Sources:

- src/openaf/core/DB.java:864

<a id="api-db-ulobs-df181029"></a>

## DB.uLobs

### DB.uLobs(aSQL, anArray) : Number

Executes a SQL statement on the current DB object instance that can have CLOB or BLOB bind variables that can be specified on anArray. On success it will return the number of rows affected. In case of error an exception will be thrown.

Sources:

- src/openaf/core/DB.java:902

<a id="api-db-us-cb7caf63"></a>

## DB.us

### DB.us(aSQL, anArray, keepStatement) : Number

Executes a SQL statement on the current DB object instance that can have bind variables that  can be specified on anArray. On success it will return the number of rows affected. In case of error an exception will be thrown. Optionally you can specify to keepStatement (e.g. boolean) to keep from closing the prepared statement used for reuse in another us call. If you specify to use keepStatement do close this query, as soon as possible, using DB.closeStatement(aQuery) (where you provide an exactly equal statement to  aQuery) or DB.closeAllStatements. Cached statements remain open until explicitly closed, including when later calls use keepStatement=false. Every execution requires a complete set of bind values.

Sources:

- src/openaf/core/DB.java:550

<a id="api-db-usarray-b1970cc9"></a>

## DB.usArray

### DB.usArray(aSQL, anArrayOfArrays, aBatchSize, keepStatement) : Number

Executes, and commits, a batch of a SQL statement on the current DB object instance that can have bind variables that
can be specified on an array, for each record, as part of `anArrayOfArrays`. On success it will return the number of rows
affected. In case of error an exception will be thrown. Optionally you can specify to `keepStatement` (e.g. boolean) to keep
from closing the prepared statement used for reuse in another usArray call. If you specify to use `keepStatement` do close this
query, as soon as possible, using DB.closeStatement(`aQuery`) (where you provide an exactly equal statement to
`aQuery`) or DB.closeAllStatements. Cached statements remain open until explicitly closed,
including when later calls use `keepStatement`=false. Every execution requires a complete set of bind values. You can also specify `aBatchSize` (default is 1000) to indicate when a commit
should be performed while executing `aSQL` for each array of bind variables in `anArrayOfArrays`.

Example:

```javascript
var values = [ [1,2], [2,2], [3,3], [4,5]];
db.usArray("INSERT INTO A (c1, c2) VALUES (?, ?)", values, 2);
```

Sources:

- src/openaf/core/DB.java:580

