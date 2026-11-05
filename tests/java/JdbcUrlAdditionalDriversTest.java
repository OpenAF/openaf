package openaf.core;

import java.io.IOException;
import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.net.InetAddress;
import java.net.Socket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.sql.Connection;
import java.sql.Driver;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.HexFormat;
import java.util.List;
import java.util.Properties;
import java.util.StringTokenizer;
import javax.net.SocketFactory;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import openaf.AFCmdBase;
import openaf.JSEngine;

/** Run one named family per JVM with that family's oPack JARs on the classpath. No external DB is needed. */
public class JdbcUrlAdditionalDriversTest {
    private static int checks, markerCalls;
    private static Scriptable scope;
    private static final String INIT = "DB_ALLOW_JDBC_URL_INIT";
    private static final String CLASSES = "DB_ALLOW_JDBC_URL_CUSTOM_CLASSES";
    private static final String NAME = JdbcUrlAdditionalDriversTest.class.getName();

    public static class Marker {
        static { markerCalls++; }
        public Marker() { markerCalls++; }
    }
    public static class CryptoMarker {
        static { markerCalls++; }
        public CryptoMarker(String parameter) { markerCalls++; }
    }
    public static class FunctionMarker {
        static { markerCalls++; }
        public static String echo() { return "marker"; }
    }
    public static class SocketMarker extends SocketFactory {
        public SocketMarker() { markerCalls++; }
        public Socket createSocket() throws IOException { throw new IOException("Inert test factory"); }
        public Socket createSocket(String h, int p) throws IOException { throw new IOException("Inert test factory"); }
        public Socket createSocket(String h, int p, InetAddress a, int l) throws IOException { throw new IOException("Inert test factory"); }
        public Socket createSocket(InetAddress h, int p) throws IOException { throw new IOException("Inert test factory"); }
        public Socket createSocket(InetAddress h, int p, InetAddress a, int l) throws IOException { throw new IOException("Inert test factory"); }
    }

    private static void check(boolean value, String message) {
        checks++;
        if (!value) throw new AssertionError(message);
    }

    private static void flags(boolean init, boolean classes) {
        Scriptable flags = Context.getCurrentContext().newObject(scope);
        ScriptableObject.putProperty(flags, INIT, init);
        ScriptableObject.putProperty(flags, CLASSES, classes);
        ScriptableObject.putProperty(scope, "__flags", flags);
    }

    private static void blocked(String url, String flag) throws Exception {
        int before = markerCalls;
        try {
            new DB().newDB("openaf.guard.MissingDriver", url, null, null, null);
            throw new AssertionError("Expected policy rejection");
        } catch (SQLException e) {
            check("08004".equals(e.getSQLState()), "Wrong policy SQLState");
            check(e.getMessage().contains(flag), "Missing permission flag");
        }
        check(markerCalls == before, "Rejected URL initialized a class");
    }

    private static Object call(Class<?> type, Object target, String name, Class<?>[] types, Object... args)
            throws Exception {
        Method m = type.getDeclaredMethod(name, types);
        m.setAccessible(true);
        return m.invoke(target, args);
    }

    private static Connection connect(String driver, String url) throws Exception {
        DB db = new DB();
        db.newDB(driver, url, null, null, null);
        return (Connection) db.getConnect();
    }

    private static void permittedMarker(String driver, String url) throws Exception {
        int before = markerCalls;
        flags(false, true);
        try (Connection ignored = connect(driver, url)) {
            // A valid function configuration may return a connection; invalid marker types fail below.
        } catch (Exception e) {
            check(!(e instanceof SQLException) || !"08004".equals(((SQLException) e).getSQLState()),
                    "Permission did not reach the driver");
        }
        check(markerCalls > before, "Permitted hook did not initialize its marker");
        flags(false, false);
    }

    private static void duckdb(Path directory) throws Exception {
        Path sql = directory.resolve("init.sql");
        Files.writeString(sql, "CREATE TABLE policy_marker(id INTEGER);\n");
        String hash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(sql)));
        String url = "jdbc:duckdb:;session_init_sql_file=" + sql + ";session_init_sql_file_sha256=" + hash;
        blocked(url, INIT);
        flags(false, true);
        blocked(url, INIT);
        flags(true, false);
        try (Connection c = connect("org.duckdb.DuckDBDriver", url);
                Statement s = c.createStatement(); ResultSet rs = s.executeQuery("SELECT COUNT(*) FROM policy_marker")) {
            check(rs.next() && rs.getInt(1) == 0, "Permitted SQL file did not create the marker");
        }
        flags(false, false);
        try (Connection c = connect("org.duckdb.DuckDBDriver", "jdbc:duckdb:;threads=2");
                Statement s = c.createStatement(); ResultSet rs = s.executeQuery("SELECT 1")) {
            check(rs.next() && rs.getInt(1) == 1, "Ordinary DuckDB connection changed");
        }
    }

    private static void sqlserver() throws Exception {
        Class<?> driver = Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
        Object instance = driver.getConstructor().newInstance();
        String prefix = "jdbc:sqlserver://localhost;";
        for (char whitespace = 0; whitespace <= ' '; whitespace++) {
            String escaped = prefix + "password=" + whitespace + "{p;socketFactoryClass=literal};databaseName=db";
            Properties parsed = (Properties) call(driver, instance, "parseAndMergeProperties",
                    new Class<?>[] { String.class, Properties.class }, escaped, new Properties());
            check("p;socketFactoryClass=literal".equals(parsed.getProperty("password")),
                    "SQL Server pre-brace whitespace grammar changed");
            check(parsed.getProperty("socketFactoryClass") == null, "Password became a factory");
            JdbcUrlPolicy.validate("", escaped);
            checks++;
        }
        String ordinary = prefix + "password={p}};trustManagerClass=literal};databaseName=db";
        Properties props = (Properties) call(driver, instance, "parseAndMergeProperties",
                new Class<?>[] { String.class, Properties.class }, ordinary, new Properties());
        check(!props.containsKey("trustManagerClass"), "Real SQL Server brace parsing differs");
        JdbcUrlPolicy.validate("", ordinary);
        checks++;
        String url = prefix + "socketFactoryClass=" + NAME + "$SocketMarker";
        props = (Properties) call(driver, instance, "parseAndMergeProperties",
                new Class<?>[] { String.class, Properties.class }, url, new Properties());
        check((NAME + "$SocketMarker").equals(props.getProperty("socketFactoryClass")), "Real factory URL did not parse");
        blocked(url, CLASSES);
        blocked(prefix + "trustManagerClass=probe.TrustManager", CLASSES);
        flags(false, true);
        JdbcUrlPolicy.validate("", url);
        Class<?> connection = Class.forName("com.microsoft.sqlserver.jdbc.SQLServerConnection");
        Constructor<?> cc = connection.getDeclaredConstructor(String.class);
        cc.setAccessible(true);
        Object con = cc.newInstance("probe");
        Field field = connection.getDeclaredField("socketFactoryClass");
        field.setAccessible(true);
        field.set(con, props.getProperty("socketFactoryClass"));
        Class<?> finder = Class.forName("com.microsoft.sqlserver.jdbc.SocketFinder");
        Constructor<?> ctor = finder.getDeclaredConstructor(String.class, connection);
        ctor.setAccessible(true);
        Object f = ctor.newInstance("probe", con);
        Object factory = call(finder, f, "getSocketFactory", new Class<?>[0]);
        check(factory instanceof SocketMarker && markerCalls == 1, "Permitted socket factory was not constructed");
    }

    private static void db2() throws Exception {
        Class<?> driver = Class.forName("com.ibm.db2.jcc.DB2Driver");
        for (String property : new String[] { "pluginClassName", "appTokenGenClassName" }) {
            String options = "password={literal;" + property + "=probe.Plugin;";
            String url = "jdbc:db2://localhost:50000/db:" + options;
            Properties p = (Properties) call(driver, null, "tokenizeURLProperties",
                    new Class<?>[] { StringTokenizer.class, String.class, Properties.class },
                    new StringTokenizer(options, ";=", true), url, new Properties());
            check("probe.Plugin".equals(p.getProperty(property)), "DB2 treated braces as escaping");
            blocked(url, CLASSES);
            flags(false, true);
            JdbcUrlPolicy.validate("", url);
            checks++;
            flags(false, false);
        }
    }

    private static void csv(Path directory) throws Exception {
        String driver = "org.xbib.jdbc.csv.CsvDriver";
        String base = "jdbc:xbib:csv:" + directory;
        String[] urls = { "jdbc:xbib:csv:class:" + NAME + "$Marker",
                base + "?%63ryptoFilterClassName=" + NAME + "$CryptoMarker",
                base + "?function.marker=" + NAME + "$FunctionMarker.echo()" };
        for (String url : urls) {
            blocked(url, CLASSES);
            permittedMarker(driver, url);
        }
        try (Connection ignored = connect(driver, base)) { checks++; }
    }

    private static void mdb(Path directory) throws Exception {
        String url = "jdbc:ucanaccess://" + directory + "/missing.mdb;jackcessOpener=" + NAME + "$Marker";
        blocked(url, CLASSES);
        permittedMarker("net.ucanaccess.jdbc.UcanaccessDriver", url);
    }

    private static void presto() throws Exception {
        String url = "jdbc:presto://localhost:8080/db?user=probe&queryInterceptors=" + NAME + "$Marker";
        blocked(url, CLASSES);
        flags(false, true);
        JdbcUrlPolicy.validate("", url);
        Class<?> uri = Class.forName("com.facebook.presto.jdbc.PrestoDriverUri");
        Constructor<?> ctor = uri.getDeclaredConstructor(String.class, Properties.class);
        ctor.setAccessible(true);
        try { ctor.newInstance(url, new Properties()); }
        catch (InvocationTargetException expected) { /* Marker intentionally does not implement QueryInterceptor. */ }
        check(markerCalls > 0, "Permitted Presto interceptor did not initialize");
        flags(false, false);
        String ordinary = "jdbc:presto://localhost:8080/db?user=probe";
        JdbcUrlPolicy.validate("", ordinary);
        check(ctor.newInstance(ordinary, new Properties()) != null, "Ordinary Presto parsing changed");
    }

    private static void yugabyte() throws Exception {
        Class<?> driver = Class.forName("com.yugabyte.Driver");
        for (String property : new String[] { "socketFactory", "sslfactory", "sslhostnameverifier",
                "sslpasswordcallback", "authenticationPluginClassName", "xmlFactoryFactory" }) {
            String url = "jdbc:yugabytedb://localhost/db?" + property + "=probe.Factory";
            Properties p = (Properties) driver.getMethod("parseURL", String.class, Properties.class)
                    .invoke(null, url, new Properties());
            check("probe.Factory".equals(p.getProperty(property)), "Real Yugabyte parsing changed");
            blocked(url, CLASSES);
            flags(false, true);
            JdbcUrlPolicy.validate("", url);
            checks++;
            flags(false, false);
        }
    }

    private static void neo4j() throws Exception {
        String url = "jdbc:neo4j://localhost/db?translatorFactory=DEFAULT";
        blocked(url, CLASSES);
        flags(false, true);
        JdbcUrlPolicy.validate("", url);
        Class<?> driver = Class.forName("org.neo4j.jdbc.Neo4jDriver");
        Object instance = driver.getConstructor().newInstance();
        List<?> factories = (List<?>) call(driver, instance, "getSqlTranslatorFactory",
                new Class<?>[] { String.class, String.class }, "DEFAULT", null);
        check(factories.size() == 1, "Permitted built-in translator changed");
        List<?> denied = (List<?>) call(driver, instance, "getSqlTranslatorFactory",
                new Class<?>[] { String.class, String.class }, "java.lang.String", null);
        check(denied.isEmpty(), "OpenAF permission weakened the driver's translator allowlist");
    }

    public static void main(String[] args) throws Exception {
        JSEngine savedEngine = AFCmdBase.jse;
        Path directory = Files.createTempDirectory(Path.of(".").toAbsolutePath(), "jdbc-policy-");
        Context cx = Context.enter();
        try {
            scope = cx.initStandardObjects();
            AFCmdBase.jse = (JSEngine) Proxy.newProxyInstance(JSEngine.class.getClassLoader(),
                    new Class<?>[] { JSEngine.class }, (proxy, method, argv) ->
                            method.getName().equals("getGlobalscope") ? scope : null);
            flags(false, false);
            switch (args[0]) {
                case "duckdb": duckdb(directory); break;
                case "sqlserver": sqlserver(); break;
                case "db2": db2(); break;
                case "csv": csv(directory); break;
                case "mdb": mdb(directory); break;
                case "presto": presto(); break;
                case "yugabytedb": yugabyte(); break;
                case "neo4j": neo4j(); break;
                default: throw new IllegalArgumentException("Unknown test family");
            }
            System.out.println("JdbcUrlAdditionalDriversTest " + args[0] + " passed: " + checks + " checks");
        } finally {
            AFCmdBase.jse = savedEngine;
            Context.exit();
            try (var files = Files.list(directory)) {
                for (Path file : files.toList()) Files.delete(file);
            }
            Files.delete(directory);
        }
    }
}
