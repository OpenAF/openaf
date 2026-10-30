# JDBC URL execution policy

OpenAF rejects the JDBC URL options listed below unless explicitly permitted.
Validation runs before driver loading and connection creation in the core DB
implementation. It covers `new DB(...)`, direct core DB calls, H2 helpers such as
`createDBInMem`, and connections created by `ow.obj.pool.DB`.

## Permission flags

Both flags default to `false`. Only the boolean `true` grants permission:

```javascript
__flags.DB_ALLOW_JDBC_URL_INIT = true;
var db = new DB("org.h2.Driver",
    "jdbc:h2:mem:example;INIT=CREATE TABLE example(id INT)", "sa", "");
```

| Flag | Default restriction | What boolean `true` permits | Why permission is required |
| --- | --- | --- | --- |
| `DB_ALLOW_JDBC_URL_INIT` | Reject the initialization options in the table below. | URL-selected initialization SQL, including script files, session assignments and the covered indirect configuration selector. | Opening a connection can otherwise execute SQL supplied through the URL before the application explicitly issues a statement. This can change schemas, data, or session behavior; database features may also let that SQL invoke code. |
| `DB_ALLOW_JDBC_URL_CUSTOM_CLASSES` | Reject the custom-class options in the table below. | URL-selected Java extension classes and the covered indirect configuration selectors. | Loading or constructing a listener, factory, interceptor, authentication hook, or other extension can run Java code with the OpenAF process's permissions. Some hooks execute during connection creation; others run when the corresponding feature is used. |

The flags are independent: enabling initialization does not permit a protected
class-selection option, and enabling custom classes does not permit a protected
initialization option. Missing flags, `false`, and the string `"true"` grant no
permission.

These permissions gate URL mechanisms. Once initialization SQL is permitted,
the custom-classes flag does not inspect or constrain code invoked by that SQL.
Only enable a capability when the complete URL and any referenced configuration
or initialization content are trusted.

The existing `OAF_FLAGS` environment configuration also accepts these flags:

```sh
OAF_FLAGS='{DB_ALLOW_JDBC_URL_INIT: true}' oaf my-script.js
```

Flags apply to subsequent connections across the runtime, including newly created
pool connections. They do not affect existing connections. Trusted scripts may
change them at runtime; these flags do not sandbox scripts that can execute Java
or change OpenAF configuration. Avoid toggling them temporarily in a runtime that
also creates connections from untrusted URLs concurrently.

## Protected options

Property matching is case insensitive. Any occurrence requires permission,
including an empty value or an explicitly named built-in class. Driver defaults
remain available when the property is omitted.

Requiring permission for all explicit values keeps the trust decision at the
capability boundary. It avoids relying on a list of supposedly safe class names
that can change between driver versions. The URL is rejected as a whole so an
application cannot silently continue without initialization it depends on.

| Driver family | Initialization permission | Custom-classes permission |
| --- | --- | --- |
| H2 | `INIT` | `DATABASE_EVENT_LISTENER` |
| PostgreSQL | — | `socketFactory`, `sslfactory`, `sslhostnameverifier`, `sslpasswordcallback`, `authenticationPluginClassName`, `xmlFactoryFactory`, `service` |
| MySQL | `sessionVariables`, `initSql`, `useConfigs` | `socketFactory`, `propertiesTransform`, `connectionLifecycleInterceptors`, `queryInterceptors`, `statementInterceptors`, `exceptionInterceptors`, `authenticationPlugins`, `defaultAuthenticationPlugin`, `clientInfoProvider`, `logger`, `profilerEventHandler`, `authenticationWebAuthnCallbackHandler`, `authenticationOpenidConnectCallbackHandler`, `loadBalanceExceptionChecker`, `ha.loadBalanceStrategy` / `haLoadBalanceStrategy`, `queryInfoCacheFactory` / `parseInfoCacheFactory`, `serverConfigCacheFactory`, `useConfigs` |
| MariaDB | `initSql`, `sessionVariables` | `socketFactory` |
| Yugabyte | — | PostgreSQL options above, using `com.yugabyte.Driver` / `jdbc:yugabytedb:` |
| DuckDB | `session_init_sql_file` | — |
| SQL Server | — | `socketFactoryClass`, `trustManagerClass` |
| DB2 JCC | — | `pluginClassName`, `appTokenGenClassName` |
| UCanAccess | — | `jackcessOpener` |
| CSV (xbib) | — | `jdbc:xbib:csv:class:<class>` targets, `cryptoFilterClassName`, `function.*` |
| Presto | — | `queryInterceptors` |
| Neo4j | — | `translatorFactory` |

PostgreSQL `service` can select custom classes indirectly through a service file.
MySQL `useConfigs` can supply either protected capability and therefore requires
both flags. MySQL URLs use the union of MySQL and MariaDB rules because MariaDB
drivers can accept the `jdbc:mysql:` scheme. This includes the MariaDB `initSql`
option even when a particular MySQL driver ignores it. MySQL fragment text is also
inspected when MariaDB could interpret it as parameters: for example,
`jdbc:mysql://host/db#?socketFactory=CustomClass&permitMysqlScheme=true` is
blocked because MariaDB treats the text after `?` as connection options.

DuckDB's `session_init_sql_file` executes the referenced SQL file when opening the
connection; providing a companion hash does not remove the permission requirement.
SQL Server socket/trust factories, DB2 security/token plugins, UCanAccess file
openers, CSV readers/crypto filters/functions and Presto interceptors can load
application-selected Java classes. PostgreSQL/Yugabyte `xmlFactoryFactory` can
load a class later when SQLXML is used. Neo4j translator factories can load code
when translation is requested; the OpenAF permission preserves Neo4j's own
translator allowlist and does not authorize additional classes in that allowlist.

SQL Server braced values and doubled closing braces are parsed as values, so a
semicolon inside a password does not become an option. DB2 JCC uses raw semicolon
properties after the database separator, including its `ibmdb`, `db2os390`,
`db2os390sqlj`, `db2j:net`, `derby:net`, `ids`, `informix-sqli` and
`default:connection` URL aliases. CSV query names are decoded after splitting;
CSV `class:` targets themselves are raw. Neo4j transport suffixes are recognized.

The validator checks every duplicate and handles H2 backslash escaping, MySQL
percent-encoded property names and schemes, and structured host properties. It
splits parameters before decoding so encoded delimiters within values cannot
become new options. It does not rewrite permitted URLs. Malformed covered option
syntax that cannot be inspected reliably is rejected.

## Errors and migration

A blocked connection throws `java.sql.SQLException` with SQLState `08004`.
The message identifies the family, blocked option, and required flag without
including its value, the URL, or credentials. OpenAF's pre-connection debug message
also omits URL and credential values.

Applications using these options must explicitly opt in when upgrading. Prefer
opening an ordinary connection and running trusted initialization explicitly:

```javascript
var db = createDBInMem("example", false);
db.u("CREATE TABLE example(id INT)");
```

Explicit SQL execution through DB methods is unchanged.

## Coverage boundary

This is an explicit policy for known execution mechanisms, not complete
validation of arbitrary JDBC URLs. Other drivers and unlisted properties retain
their behavior. Driver class names supplement URL-family recognition, so supplying
a different class cannot weaken checks for a recognized URL.

Direct calls to Java `DriverManager`, driver-specific data sources, trusted JVM
configuration such as H2's `h2.urlMap`, stored database startup behavior, arbitrary
destinations, general local-file access, native extension loading, and deserialization options are outside this
policy. Review this list when adding driver integrations or upgrading drivers.

The standalone parser and connection-boundary tests need no external server:

```sh
javac --release 21 -cp 'bin:lib/*' -d /tmp/openaf-jdbc-tests \
  src/openaf/core/JdbcUrlPolicy.java src/openaf/core/DB.java tests/java/JdbcUrlPolicyTest.java
java --enable-native-access=ALL-UNNAMED -cp '/tmp/openaf-jdbc-tests:bin:lib/*' \
  openaf.core.JdbcUrlPolicyTest
```

The regular DB oJob suite additionally tests actual H2 initialization, helpers,
constructor forms, and pools against the built runtime.

Optional real-parser compatibility tests use MySQL Connector/J and MariaDB
Connector/J without connecting to a database. Keep those JARs outside `lib/`:

```sh
javac --release 21 -cp '/tmp/openaf-jdbc-tests:bin:lib/*:/path/to/mysql.jar:/path/to/mariadb.jar' \
  -d /tmp/openaf-jdbc-tests tests/java/JdbcUrlDriverCompatibilityTest.java
java --enable-native-access=ALL-UNNAMED \
  -cp '/tmp/openaf-jdbc-tests:bin:lib/*:/path/to/mysql.jar:/path/to/mariadb.jar' \
  openaf.core.JdbcUrlDriverCompatibilityTest
```

The additional-driver tests exercise the installed oPack JARs without external
database servers (DuckDB uses an isolated in-memory database and a temporary SQL
file). They check actual parsers and safe class-loading markers where available;
DB2 and Yugabyte tests stop at parsing and permission validation. No driver JARs
need to be added to OpenAF's dependencies. The additional-driver checks used
DuckDB 2.0.0.0, SQL Server 9.2.1.jre8, DB2 JCC 12.1.5, UCanAccess 5.0.1,
CSV 1.2.0, Presto 0.299, Yugabyte 42.7.3-yb7 and Neo4j 6.15.1 from the sibling
oPacks (reviewed 30 October 2026):

```sh
javac --release 21 -cp '/tmp/openaf-jdbc-tests:bin:lib/*' \
  -d /tmp/openaf-jdbc-tests tests/java/JdbcUrlAdditionalDriversTest.java
# Run each family in its own JVM; replace duckdb with sqlserver, db2, csv,
# mdb (UCanAccess), presto, yugabytedb or neo4j as appropriate.
java --enable-native-access=ALL-UNNAMED \
  -cp '/tmp/openaf-jdbc-tests:openaf.jar:../openaf-opacks/jdbc-duckdb/*' \
  openaf.core.JdbcUrlAdditionalDriversTest duckdb
```

The oPack review covered all 23 `jdbc-*` packages present in the sibling checkout.
Additional rules were added only for confirmed execution mechanisms; packages with
no confirmed hook retain their behavior. Oracle provider/DRCP paths and Drill
embedded mode have not been comprehensively validated. The Yugabyte wrapper's
PostgreSQL class/scheme example differs from its shipped driver's actual class
and scheme; core policy recognizes both families without changing that wrapper.
