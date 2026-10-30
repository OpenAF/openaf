package openaf.core;

import java.lang.reflect.Proxy;
import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.sql.Connection;
import java.sql.Driver;
import java.sql.DriverManager;
import java.sql.DriverPropertyInfo;
import java.sql.SQLException;
import java.util.Locale;
import java.util.Properties;
import java.util.logging.Logger;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import openaf.AFCmdBase;
import openaf.JSEngine;
import openaf.OAFdCL;
import openaf.SimpleLog;

/** Standalone, server-free policy and driver-boundary regression tests. */
public class JdbcUrlPolicyTest {
    private static int checks, initializations, constructions, connections, listenerInitializations, listenerCalls;
    private static Scriptable scope;
    private static final String INIT = "DB_ALLOW_JDBC_URL_INIT";
    private static final String CLASSES = "DB_ALLOW_JDBC_URL_CUSTOM_CLASSES";

    private static void check(boolean result, String message) {
        checks++;
        if (!result) throw new AssertionError(message);
    }

    private static void flags(Object init, Object classes) {
        Scriptable flags = Context.getCurrentContext().newObject(scope);
        if (init != null) ScriptableObject.putProperty(flags, INIT, init);
        if (classes != null) ScriptableObject.putProperty(flags, CLASSES, classes);
        ScriptableObject.putProperty(scope, "__flags", flags);
    }

    private static void blocked(String driver, String url, String option, String flag) throws Exception {
        try {
            // A nonexistent class proves that validation happens before Class.forName.
            new DB().connect(driver, url, null, null, null);
            throw new AssertionError("Expected rejection for " + option);
        } catch (SQLException e) {
            check("08004".equals(e.getSQLState()), "Wrong SQLState");
            check(e.getMessage().contains(option.toLowerCase(Locale.ROOT)), "Missing option");
            check(e.getMessage().contains(flag), "Missing flag");
            check(!e.getMessage().contains("sensitive-value"), "Leaked a value");
            check(!e.getMessage().contains("jdbc:"), "Leaked the URL");
        }
    }

    private static void blocked(String url, String option, String flag) throws Exception {
        blocked("openaf.guard.MissingDriver", url, option, flag);
    }

    private static void allowed(String driver, String url) throws Exception {
        JdbcUrlPolicy.validate(driver, url);
        checks++;
    }

    private static void malformed(String url) throws Exception {
        try {
            JdbcUrlPolicy.validate("openaf.guard.MissingDriver", url);
            throw new AssertionError("Expected malformed rejection");
        } catch (SQLException e) {
            check("08004".equals(e.getSQLState()), "Wrong malformed SQLState");
            check(!e.getMessage().contains(url), "Malformed error leaked URL");
        }
    }

    public static class ProbeDriver implements Driver {
        static { initializations++; }
        public ProbeDriver() { constructions++; }
        public boolean acceptsURL(String url) { return url.startsWith("jdbc:mysql://guard-probe/"); }
        public Connection connect(String url, Properties props) {
            if (!acceptsURL(url)) return null;
            connections++;
            return (Connection) Proxy.newProxyInstance(getClass().getClassLoader(),
                    new Class<?>[] { Connection.class }, (proxy, method, args) -> {
                        if (method.getReturnType() == boolean.class) return false;
                        return null;
                    });
        }
        public DriverPropertyInfo[] getPropertyInfo(String url, Properties props) { return new DriverPropertyInfo[0]; }
        public int getMajorVersion() { return 1; }
        public int getMinorVersion() { return 0; }
        public boolean jdbcCompliant() { return false; }
        public Logger getParentLogger() { return Logger.getGlobal(); }
    }

    public static class ProbeListener implements org.h2.api.DatabaseEventListener {
        static { listenerInitializations++; }
        public void init(String url) { listenerCalls++; }
    }

    private static void additionalDrivers() throws Exception {
        String[][] cases = {
            { "jdbc:duckdb:;session_init_sql_file=sensitive-value", "session_init_sql_file", INIT },
            { "jdbc:sqlserver://host;socketFactoryClass=sensitive-value", "socketfactoryclass", CLASSES },
            { "jdbc:sqlserver://host;trustManagerClass={sensitive-value}", "trustmanagerclass", CLASSES },
            { "jdbc:db2://host:50000/db:pluginClassName=sensitive-value;", "pluginclassname", CLASSES },
            { "jdbc:db2:db:appTokenGenClassName=sensitive-value;", "apptokengenclassname", CLASSES },
            { "jdbc:ucanaccess:///tmp/missing.mdb;jackcessOpener=sensitive-value", "jackcessopener", CLASSES },
            { "jdbc:xbib:csv:class:sensitive-value", "class:", CLASSES },
            { "jdbc:xbib:csv:/tmp?cryptoFilterClassName=sensitive-value", "cryptofilterclassname", CLASSES },
            { "jdbc:xbib:csv:/tmp?function.sensitive-value=example.Factory.method()", "function.*", CLASSES },
            { "jdbc:xbib:csv:/tmp?%63ryptoFilterClassName=sensitive-value", "cryptofilterclassname", CLASSES },
            { "jdbc:presto://host:8080/db?queryInterceptors=sensitive-value", "queryinterceptors", CLASSES },
            { "jdbc:presto://host:8080/db?query%49nterceptors=sensitive-value", "queryinterceptors", CLASSES },
            { "jdbc:yugabytedb://host/db?socketFactory=sensitive-value", "socketfactory", CLASSES },
            { "jdbc:yugabytedb://host/db?xmlFactoryFactory=sensitive-value", "xmlfactoryfactory", CLASSES },
            { "jdbc:postgresql:db?xmlFactoryFactory=sensitive-value", "xmlfactoryfactory", CLASSES },
            { "jdbc:neo4j://host/db?translatorFactory=sensitive-value", "translatorfactory", CLASSES },
            { "jdbc:neo4j+s://host/db?translatorFactory=DEFAULT", "translatorfactory", CLASSES },
            { "jdbc:neo4j+ssc:http://host/db?translatorFactory=sensitive-value", "translatorfactory", CLASSES },
            { "jdbc:sqlserver://host;socketFactoryClass=;socketFactoryClass=sensitive-value", "socketfactoryclass", CLASSES },
            { "jdbc:sqlserver://host;password={p}};trustManagerClass=text};socketFactoryClass=sensitive-value", "socketfactoryclass", CLASSES },
            { "jdbc:db2://host/db:password={p;pluginClassName=sensitive-value};", "pluginclassname", CLASSES },
            { "jdbc:ucanaccess:///tmp/missing.mdb;jackcessOpener=;jackcessOpener=sensitive-value", "jackcessopener", CLASSES }
        };
        flags(false, false);
        for (String[] c : cases) blocked(c[0], c[1], c[2]);
        for (String prefix : new String[] { "db2", "ibmdb", "db2os390", "db2os390sqlj",
                "db2j:net", "derby:net", "ids", "informix-sqli" }) {
            blocked("jdbc:" + prefix + "://host:50000/db:pluginClassName=sensitive-value;", "pluginclassname", CLASSES);
        }
        for (String[] c : new String[][] {
                { "org.duckdb.DuckDBDriver", "jdbc:other:;session_init_sql_file=sensitive-value", "session_init_sql_file", INIT },
                { "com.microsoft.sqlserver.jdbc.SQLServerDriver", "jdbc:other://host;socketFactoryClass=sensitive-value", "socketfactoryclass", CLASSES },
                { "com.ibm.db2.jcc.DB2Driver", "jdbc:other:db:pluginClassName=sensitive-value;", "pluginclassname", CLASSES },
                { "net.ucanaccess.jdbc.UcanaccessDriver", "jdbc:other:db;jackcessOpener=sensitive-value", "jackcessopener", CLASSES },
                { "org.xbib.jdbc.csv.CsvDriver", "jdbc:other:db?cryptoFilterClassName=sensitive-value", "cryptofilterclassname", CLASSES },
                { "com.facebook.presto.jdbc.PrestoDriver", "jdbc:other:db?queryInterceptors=sensitive-value", "queryinterceptors", CLASSES },
                { "com.yugabyte.Driver", "jdbc:other:db?socketFactory=sensitive-value", "socketfactory", CLASSES },
                { "org.neo4j.jdbc.Neo4jDriver", "jdbc:other:db?translatorFactory=sensitive-value", "translatorfactory", CLASSES }
        }) blocked(c[0], c[1], c[2], c[3]);

        for (String url : new String[] {
                "jdbc:duckdb:;threads=2",
                "jdbc:sqlserver://host;password={p;socketFactoryClass=literal};databaseName=db",
                "jdbc:sqlserver://host;password=\t{p;socketFactoryClass=literal};databaseName=db",
                "jdbc:sqlserver://host;password={p}};trustManagerClass=literal};databaseName=db",
                "jdbc:sqlserver://host;password=socketFactoryClass=literal;databaseName=db",
                "jdbc:sqlserver://host;socket%46actoryClass=ignored",
                "jdbc:db2://host/db:user=literal;password=pluginClassName=literal;",
                "jdbc:db2://host/\"db:pluginClassName=literal;\":user=literal;",
                "jdbc:ucanaccess:///tmp/missing.mdb;password=jackcessOpener=literal",
                "jdbc:xbib:csv:/tmp/class:literal?separator=,",
                "jdbc:xbib:csv:%63lass:literal",
                "jdbc:xbib:csv:/tmp?password=cryptoFilterClassName%3Dliteral%26function.foo%3Dx",
                "jdbc:presto://host:8080/db?user=literal#?queryInterceptors=fragment",
                "jdbc:yugabytedb://host/db?password=socketFactory%3Dliteral%26xmlFactoryFactory%3Dx",
                "jdbc:neo4j://host/db?password=translatorFactory%3Dliteral"
        }) allowed("openaf.guard.MissingDriver", url);
        malformed("jdbc:sqlserver://host;password={unclosed;socketFactoryClass=literal");
        malformed("jdbc:sqlserver://host;password={closed}trailing");
        malformed("jdbc:db2://host/db:pluginClassName=missing-terminator");
        malformed("jdbc:xbib:csv:/tmp?crypto%ZZFilterClassName=x");
        flags(true, false);
        allowed("", cases[0][0]);
        for (String[] c : cases) if (c[2].equals(CLASSES)) blocked(c[0], c[1], c[2]);
        flags(false, true);
        blocked(cases[0][0], cases[0][1], INIT);
        for (String[] c : cases) if (c[2].equals(CLASSES)) allowed("", c[0]);
        flags(true, true);
        for (String[] c : cases) allowed("", c[0]);
    }

    public static void main(String[] args) throws Exception {
        JSEngine savedEngine = AFCmdBase.jse;
        OAFdCL savedLoader = OAFdCL.oafdcl;
        Locale savedLocale = Locale.getDefault();
        Context cx = Context.enter();
        try {
            scope = cx.initStandardObjects();
            AFCmdBase.jse = (JSEngine) Proxy.newProxyInstance(JSEngine.class.getClassLoader(),
                    new Class<?>[] { JSEngine.class }, (proxy, method, argv) ->
                            method.getName().equals("getGlobalscope") ? scope : null);
            Locale.setDefault(Locale.forLanguageTag("tr-TR"));
            flags(null, null);
            for (String key : new String[] { "INIT", "init", "I\\NIT", "\\I\\N\\I\\T", "INIT\\" }) {
                blocked("jdbc:h2:mem:guard;" + key + "=sensitive-value", "init", INIT);
            }
            blocked("jdbc:h2:mem:guard;INIT=;INIT=", "init", INIT);
            blocked("jdbc:h2:mem:guard;PASSWORD=sensitive-value;DATABASE_EVENT_LISTENER=", "database_event_listener", CLASSES);
            for (Object notTrue : new Object[] { Boolean.FALSE, "true", 1, cx.newObject(scope) }) {
                flags(notTrue, notTrue);
                blocked("jdbc:h2:mem:guard;INIT=", "init", INIT);
                blocked("jdbc:h2:mem:guard;DATABASE_EVENT_LISTENER=", "database_event_listener", CLASSES);
            }
            flags(false, false);
            for (String key : new String[] { "socketFactory", "sslfactory", "sslhostnameverifier",
                    "sslpasswordcallback", "authenticationPluginClassName", "service" }) {
                blocked("jdbc:postgresql://host/db?" + key + "=sensitive-value", key, CLASSES);
                blocked("jdbc:postgresql:db?" + key.toUpperCase(Locale.ROOT), key, CLASSES);
            }
            for (String key : new String[] { "socketFactory", "propertiesTransform", "connectionLifecycleInterceptors",
                    "queryInterceptors", "statementInterceptors", "exceptionInterceptors", "authenticationPlugins",
                    "defaultAuthenticationPlugin", "clientInfoProvider", "logger", "profilerEventHandler",
                    "authenticationWebAuthnCallbackHandler", "authenticationOpenidConnectCallbackHandler",
                    "loadBalanceExceptionChecker", "ha.loadBalanceStrategy", "haLoadBalanceStrategy",
                    "queryInfoCacheFactory", "parseInfoCacheFactory", "serverConfigCacheFactory" }) {
                blocked("jdbc:mysql://host/db?" + key + "=sensitive-value", key, CLASSES);
                blocked("jdbc:mysql://address=(host=host)(" + key + "=sensitive-value)/db", key, CLASSES);
            }
            for (String url : new String[] {
                    "jdbc:mysql://host/db?%73ocketFactory=sensitive-value",
                    "jdbc:%6dysql://host/db?socketFactory=sensitive-value",
                    "jdbc:mysql+srv://host/db?socketFactory=sensitive-value",
                    "jdbc:mysql:loadbalance://host1,host2/db?socketFactory=sensitive-value",
                    "jdbc:mysql:replication://[::1],host2/db?socketFactory=sensitive-value",
                    "jdbc:mysql://address=(host=host)(socketFactory=sensitive-value)/db",
                    "jdbc:mysql://(host=host,%73ocketFactory=sensitive-value)/db",
                    "jdbc:mysql://user:password@[(host=host,socketFactory=sensitive-value),host2]/db",
                    "jdbc:mysql://host/db?socketFactory=&socketFactory=sensitive-value",
                    "jdbc:mysql://host/db?socketFactory=sensitive-value&socketFactory=",
                    "jdbc:mariadb://host/db?socketFactory=sensitive-value" }) {
                blocked(url, "socketfactory", CLASSES);
            }
            for (String family : new String[] { "mysql", "mariadb" }) {
                for (String key : new String[] { "sessionVariables", "initSql" }) {
                    blocked("jdbc:" + family + "://host/db?" + key + "=sensitive-value", key, INIT);
                }
            }
            blocked("org.h2.Driver", "jdbc:unknown:db;INIT=", "init", INIT);
            blocked("org.postgresql.Driver", "jdbc:unknown:db?socketFactory=", "socketfactory", CLASSES);
            blocked("com.mysql.cj.jdbc.Driver", "jdbc:unknown://host/db?queryInterceptors=", "queryinterceptors", CLASSES);
            blocked("org.mariadb.jdbc.Driver", "jdbc:unknown://host/db?initSql=", "initsql", INIT);

            for (String url : new String[] {
                    "jdbc:h2:mem:INIT=plain;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
                    "jdbc:h2:mem:guard;PASSWORD=some\\;INIT=still-password",
                    "jdbc:postgresql:db?password=socketFactory%3Dsensitive-value%26service%3Dx",
                    "jdbc:mysql://host/db?password=socketFactory%3Dsensitive-value%26initSql%3Dx",
                    "jdbc:mysql://user:socketFactory=ordinary@host/db?connectTimeout=1000",
                    "jdbc:mysql://user:p)ass@host/db", "jdbc:mysql://user:p(ass@host/db",
                    "jdbc:mysql://(host=host,password=socketFactory=ordinary)/db",
                    "jdbc:mysql://address=(host=host)(password=socketFactory=ordinary)/db",
                    "jdbc:mysql://[::1]:3306,host/db?sslMode=VERIFY_IDENTITY",
                    "jdbc:mariadb://address=(localSocket=/tmp/ordinary)(host=host)/db?password=100%literal",
                    "jdbc:unknown:db?INIT=anything&socketFactory=anything" }) {
                allowed("openaf.guard.MissingDriver", url);
            }
            malformed("jdbc:h2:mem:guard;broken");
            malformed("jdbc:mysql://host/db?socket%ZZFactory=x");
            malformed("jdbc:mysql://host/db?password=%ZZ");
            malformed("jdbc:mysql://address=(host=host/db?password=x");
            malformed("jdbc:mysql://address=(host=host)trailing/db");

            flags(true, false);
            allowed("", "jdbc:h2:mem:guard;INIT=CREATE TABLE marker(id INT)");
            allowed("", "jdbc:mariadb://host/db?initSql=SELECT 1&sessionVariables=x=1");
            blocked("jdbc:h2:mem:guard;DATABASE_EVENT_LISTENER=", "database_event_listener", CLASSES);
            blocked("jdbc:mysql://host/db?useConfigs=", "useconfigs", CLASSES);
            flags(false, true);
            allowed("", "jdbc:postgresql:db?socketFactory=builtin&service=trusted");
            blocked("jdbc:h2:mem:guard;INIT=", "init", INIT);
            blocked("jdbc:mysql://host/db?useConfigs=", "useconfigs", INIT);
            flags(true, true);
            allowed("", "jdbc:mysql://host/db?useConfigs=trusted&socketFactory=builtin&sessionVariables=x=1");

            // Engine/scope/flags absent must deny permission.
            ScriptableObject.deleteProperty(scope, "__flags");
            blocked("jdbc:h2:mem:guard;INIT=", "init", INIT);
            JSEngine activeEngine = AFCmdBase.jse;
            AFCmdBase.jse = null;
            blocked("jdbc:h2:mem:guard;INIT=", "init", INIT);
            AFCmdBase.jse = activeEngine;
            Scriptable savedScope = scope;
            scope = null;
            blocked("jdbc:h2:mem:guard;INIT=", "init", INIT);
            scope = savedScope;

            flags(false, false);
            PrintStream savedErr = System.err;
            SimpleLog.logtype savedLogLevel = SimpleLog.currentLogLevel;
            ByteArrayOutputStream log = new ByteArrayOutputStream();
            try {
                System.setErr(new PrintStream(log));
                SimpleLog.currentLogLevel = SimpleLog.logtype.DEBUG;
                try {
                    new DB().newDB("openaf.guard.MissingDriver",
                            "jdbc:h2:mem:secret-location;INIT=secret-sql", "secret-user", "secret-password", null);
                    throw new AssertionError("Expected logging probe rejection");
                } catch (SQLException e) {
                    check("08004".equals(e.getSQLState()), "Logging probe did not reach policy");
                }
            } finally {
                System.setErr(savedErr);
                SimpleLog.currentLogLevel = savedLogLevel;
            }
            check(log.toString().contains("New DB connection requested"), "Debug probe did not log");
            check(!log.toString().contains("secret-"), "Pre-connection debug log leaked secrets");

            String listenerUrl = "jdbc:h2:mem:guard_listener;DATABASE_EVENT_LISTENER='openaf.core.JdbcUrlPolicyTest$ProbeListener'";
            blocked("org.h2.Driver", listenerUrl, "database_event_listener", CLASSES);
            check(listenerInitializations == 0 && listenerCalls == 0, "Listener loaded without permission");
            flags(false, true);
            DB listenerDb = new DB();
            listenerDb.connect("org.h2.Driver", listenerUrl, null, null, null);
            listenerDb.close();
            check(listenerInitializations == 1 && listenerCalls == 1, "Permitted listener did not initialize");

            String probeClass = "openaf.core.JdbcUrlPolicyTest$ProbeDriver";
            String probeUrl = "jdbc:mysql://guard-probe/db?sessionVariables=x=1";
            flags(false, false);
            blocked(probeClass, probeUrl, "sessionvariables", INIT);
            check(initializations == 0 && constructions == 0 && connections == 0, "Driver loaded before rejection");
            OAFdCL.oafdcl = new OAFdCL(JdbcUrlPolicyTest.class.getClassLoader());
            flags(true, false);
            DB db = new DB();
            db.connect(probeClass, probeUrl, null, null, null);
            db.close();
            check(initializations == 1 && constructions == 1 && connections == 1, "Fallback connection failed");
            check(probeUrl.equals(db.url), "URL was rewritten");
            flags(false, false);
            blocked(probeClass, probeUrl, "sessionvariables", INIT);
            check(connections == 1, "Registered fallback bypassed new policy");
            flags(true, false);
            db.connect(probeClass, probeUrl, null, null, null);
            db.close();
            check(constructions == 1 && connections == 2, "Normal registered connection failed");
            additionalDrivers();
            System.out.println("JdbcUrlPolicyTest passed: " + checks + " checks");
        } finally {
            AFCmdBase.jse = savedEngine;
            OAFdCL.oafdcl = savedLoader;
            Locale.setDefault(savedLocale);
            Context.exit();
        }
    }
}
