package openaf.core;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import openaf.AFCmdBase;

/** Checks URL-supplied executable options before loading or invoking a JDBC driver. */
final class JdbcUrlPolicy {
    private static final String INIT_FLAG = "DB_ALLOW_JDBC_URL_INIT";
    private static final String CLASSES_FLAG = "DB_ALLOW_JDBC_URL_CUSTOM_CLASSES";
    private static final Set<String> PG_CLASSES = Set.of("socketfactory", "sslfactory",
            "sslhostnameverifier", "sslpasswordcallback", "authenticationpluginclassname", "service",
            "xmlfactoryfactory");
    private static final String[] DB2_PREFIXES = { "jdbc:db2j:net:", "jdbc:derby:net:",
            "jdbc:db2os390sqlj:", "jdbc:db2os390:", "jdbc:informix-sqli:", "jdbc:ibmdb:",
            "jdbc:db2:", "jdbc:ids:", "jdbc:default:connection" };
    private static final Set<String> MYSQL_CLASSES = Set.of("socketfactory", "propertiestransform",
            "connectionlifecycleinterceptors", "queryinterceptors", "statementinterceptors",
            "exceptioninterceptors", "authenticationplugins", "defaultauthenticationplugin",
            "clientinfoprovider", "logger", "profilereventhandler",
            "authenticationwebauthncallbackhandler", "authenticationopenidconnectcallbackhandler",
            "loadbalanceexceptionchecker", "ha.loadbalancestrategy", "haloadbalancestrategy",
            "queryinfocachefactory", "parseinfocachefactory", "serverconfigcachefactory");

    private JdbcUrlPolicy() { }

    static void validate(String driver, String url) throws SQLException {
        if (url == null) return;
        String lower = url.toLowerCase(Locale.ROOT);
        String name = driver == null ? "" : driver;
        boolean h2 = lower.startsWith("jdbc:h2:") || name.equals("org.h2.Driver");
        boolean pg = lower.startsWith("jdbc:postgresql:") || name.equals("org.postgresql.Driver")
                || lower.startsWith("jdbc:yugabytedb:") || name.equals("com.yugabyte.Driver");
        // Connector/J accepts percent escapes in its scheme, including jdbc:%6dysql:.
        int schemeEnd = 0;
        while (schemeEnd < url.length() && (Character.isLetterOrDigit(url.charAt(schemeEnd))
                || "_+:%".indexOf(url.charAt(schemeEnd)) >= 0)) schemeEnd++;
        String scheme;
        try {
            scheme = URLDecoder.decode(url.substring(0, schemeEnd).replace("+", "%2B"),
                    StandardCharsets.UTF_8).toLowerCase(Locale.ROOT);
        } catch (IllegalArgumentException e) {
            scheme = lower;
        }
        boolean mysql = scheme.startsWith("jdbc:mysql:") || scheme.startsWith("jdbc:mysql+srv:")
                || name.equals("com.mysql.cj.jdbc.Driver") || name.equals("com.mysql.jdbc.Driver");
        boolean maria = lower.startsWith("jdbc:mariadb:") || name.equals("org.mariadb.jdbc.Driver");
        List<String> additional = new ArrayList<>();
        if (lower.startsWith("jdbc:duckdb:") || name.equals("org.duckdb.DuckDBDriver")) additional.add("DuckDB");
        if (lower.startsWith("jdbc:sqlserver:") || name.equals("com.microsoft.sqlserver.jdbc.SQLServerDriver")) additional.add("SQL Server");
        if (db2Prefix(lower) >= 0 || name.equals("com.ibm.db2.jcc.DB2Driver")) additional.add("DB2");
        if (lower.startsWith("jdbc:ucanaccess:") || name.equals("net.ucanaccess.jdbc.UcanaccessDriver")) additional.add("UCanAccess");
        if (lower.startsWith("jdbc:xbib:csv:") || name.equals("org.xbib.jdbc.csv.CsvDriver")) additional.add("CSV");
        if (lower.startsWith("jdbc:presto:") || name.equals("com.facebook.presto.jdbc.PrestoDriver")) additional.add("Presto");
        if (lower.startsWith("jdbc:neo4j:") || lower.startsWith("jdbc:neo4j+")
                || name.equals("org.neo4j.jdbc.Neo4jDriver")) additional.add("Neo4j");
        if (!h2 && !pg && !mysql && !maria && additional.isEmpty()) return;

        boolean allowInit = flag(INIT_FLAG), allowClasses = flag(CLASSES_FLAG);
        for (String family : additional) validateAdditional(family, url, allowInit, allowClasses);
        if (h2) {
            int start = url.indexOf(';');
            if (start >= 0) {
                // H2 unescapes the entire token, including the key and the first '='.
                for (String token : splitH2(url.substring(start + 1))) {
                    if (token.isEmpty()) continue;
                    int equals = token.indexOf('=');
                    if (equals < 0) throw malformed("H2");
                    check("H2", token.substring(0, equals), allowInit, allowClasses);
                }
            }
        }
        if (pg || mysql || maria) {
            String family = mysql ? "MySQL/MariaDB" : maria ? "MariaDB" : "PostgreSQL";
            int query = url.indexOf('?');
            if (query >= 0) {
                for (String token : url.substring(query + 1).split("&", -1)) {
                    if (token.isEmpty()) continue;
                    int equals = token.indexOf('=');
                    String key = equals < 0 ? token : token.substring(0, equals);
                    // Split before decoding, so an encoded '&' in a value stays in that value.
                    // Check the raw and decoded keys: MariaDB/pgJDBC retain raw keys,
                    // whereas Connector/J decodes them. Every duplicate is checked.
                    checkFamilies(pg, mysql, maria, key, allowInit, allowClasses);
                    checkFamilies(pg, mysql, maria, decode(key, family), allowInit, allowClasses);
                    if (mysql && equals >= 0) decode(token.substring(equals + 1), family);
                    if (pg && equals >= 0) decode(token.substring(equals + 1), family);
                }
            }
            if (mysql || maria) {
                int authority = url.indexOf("//");
                if (authority >= 0) {
                    int end = authority + 2, depth = 0;
                    for (; end < url.length(); end++) {
                        char c = url.charAt(end);
                        // Connector/J separates the authority before parsing host properties.
                        if ((c == '/' || c == '?' || c == '#') && (mysql || depth == 0)) break;
                        if (mysql) continue;
                        if (c == '(') depth++;
                        if (c == ')' && --depth < 0) throw malformed(family);
                    }
                    inspectHosts(url.substring(authority + 2, end), mysql, maria, allowInit, allowClasses, 0);
                }
            }
        }
    }

    private static boolean flag(String name) {
        if (AFCmdBase.jse == null || !(AFCmdBase.jse.getGlobalscope() instanceof Scriptable)) return false;
        Scriptable scope = (Scriptable) AFCmdBase.jse.getGlobalscope();
        Object flags = ScriptableObject.getProperty(scope, "__flags");
        return flags instanceof Scriptable
                && Boolean.TRUE.equals(ScriptableObject.getProperty((Scriptable) flags, name));
    }

    private static void checkFamilies(boolean pg, boolean mysql, boolean maria, String key,
            boolean allowInit, boolean allowClasses) throws SQLException {
        if (pg) check("PostgreSQL", key, allowInit, allowClasses);
        if (mysql) check("MySQL/MariaDB", key, allowInit, allowClasses);
        if (maria) check("MariaDB", key, allowInit, allowClasses);
    }

    private static void check(String family, String key, boolean allowInit, boolean allowClasses)
            throws SQLException {
        String k = key.trim().toLowerCase(Locale.ROOT);
        boolean init = false, classes = false;
        switch (family) {
            case "H2":
                init = k.equals("init");
                classes = k.equals("database_event_listener");
                break;
            case "PostgreSQL":
                classes = PG_CLASSES.contains(k);
                break;
            case "MySQL/MariaDB":
                init = k.equals("sessionvariables") || k.equals("initsql") || k.equals("useconfigs");
                classes = MYSQL_CLASSES.contains(k) || k.equals("useconfigs");
                break;
            case "MariaDB":
                init = k.equals("initsql") || k.equals("sessionvariables");
                classes = k.equals("socketfactory");
                break;
            case "DuckDB":
                init = k.equals("session_init_sql_file");
                break;
            case "SQL Server":
                classes = k.equals("socketfactoryclass") || k.equals("trustmanagerclass");
                break;
            case "DB2":
                classes = k.equals("pluginclassname") || k.equals("apptokengenclassname");
                break;
            case "UCanAccess":
                classes = k.equals("jackcessopener");
                break;
            case "CSV":
                classes = k.equals("class:") || k.equals("cryptofilterclassname") || k.startsWith("function.");
                // A function's user-chosen name is not safe to echo in an error.
                if (k.startsWith("function.")) k = "function.*";
                break;
            case "Presto":
                classes = k.equals("queryinterceptors");
                break;
            case "Neo4j":
                classes = k.equals("translatorfactory");
                break;
            default:
                break;
        }
        if (init && !allowInit) throw blocked(family, k, INIT_FLAG);
        if (classes && !allowClasses) throw blocked(family, k, CLASSES_FLAG);
    }

    private static void validateAdditional(String family, String url, boolean allowInit, boolean allowClasses)
            throws SQLException {
        if (family.equals("SQL Server")) {
            inspectSqlServer(url, allowInit, allowClasses);
        } else if (family.equals("DB2")) {
            int start = db2Options(url);
            if (start >= 0) inspectSemicolons(family, url.substring(start), true, allowInit, allowClasses);
        } else if (family.equals("DuckDB") || family.equals("UCanAccess")) {
            int start = url.indexOf(';');
            if (start >= 0) inspectSemicolons(family, url.substring(start + 1), false, allowInit, allowClasses);
        } else {
            int query = url.indexOf('?');
            if (family.equals("CSV")) {
                String target = query < 0 ? url : url.substring(0, query);
                if (target.toLowerCase(Locale.ROOT).startsWith("jdbc:xbib:csv:class:")) {
                    check(family, "class:", allowInit, allowClasses);
                }
            }
            int end = url.length();
            if (family.equals("Presto")) {
                int fragment = url.indexOf('#');
                if (fragment >= 0) end = fragment;
            }
            if (query < 0 || query >= end) return;
            for (String token : url.substring(query + 1, end).split("&", -1)) {
                if (token.isEmpty()) continue;
                int equals = token.indexOf('=');
                String key = equals < 0 ? token : token.substring(0, equals);
                check(family, key, allowInit, allowClasses);
                check(family, decode(key, family), allowInit, allowClasses);
                if (equals >= 0) decode(token.substring(equals + 1), family);
            }
        }
    }

    private static void inspectSemicolons(String family, String settings, boolean trailingSemicolon,
            boolean allowInit, boolean allowClasses) throws SQLException {
        if (trailingSemicolon && !settings.isEmpty() && !settings.endsWith(";")) throw malformed(family);
        for (String token : settings.split(";", -1)) {
            if (token.isEmpty()) continue;
            int equals = token.indexOf('=');
            check(family, equals < 0 ? token : token.substring(0, equals), allowInit, allowClasses);
            // UCanAccess ignores tokens without '='; the other two drivers reject them.
            if (equals < 0 && !family.equals("UCanAccess")) throw malformed(family);
        }
    }

    private static int db2Prefix(String lower) {
        for (String prefix : DB2_PREFIXES) {
            if (lower.startsWith(prefix)) return prefix.length();
        }
        return -1;
    }

    private static int db2Options(String url) throws SQLException {
        int start = db2Prefix(url.toLowerCase(Locale.ROOT));
        if (start < 0) start = url.indexOf(':', 5) + 1;
        if (url.startsWith("//", start)) {
            start = url.indexOf('/', start + 2);
            if (start < 0) return -1;
            start++;
        }
        if (start < url.length() && url.charAt(start) == '"') {
            start = url.indexOf('"', start + 1);
            if (start < 0) throw malformed("DB2");
            start++;
        } else {
            while (start < url.length() && url.charAt(start) != ':' && url.charAt(start) != ';') start++;
        }
        return start < url.length() ? start + 1 : -1;
    }

    private static void inspectSqlServer(String url, boolean allowInit, boolean allowClasses) throws SQLException {
        int pos = url.indexOf(';');
        if (pos < 0) return;
        pos++;
        while (pos < url.length()) {
            if (url.charAt(pos) == ';') { pos++; continue; }
            int start = pos;
            while (pos < url.length() && url.charAt(pos) != '=' && url.charAt(pos) != ';') pos++;
            String key = url.substring(start, pos);
            check("SQL Server", key, allowInit, allowClasses);
            if (pos == url.length() || url.charAt(pos) != '=') throw malformed("SQL Server");
            pos++;
            // SQL Server trims control whitespace before recognizing a braced value.
            while (pos < url.length() && url.charAt(pos) <= ' ') pos++;
            if (pos < url.length() && url.charAt(pos) == '{') {
                pos++;
                boolean closed = false;
                while (pos < url.length()) {
                    if (url.charAt(pos++) != '}') continue;
                    if (pos < url.length() && url.charAt(pos) == '}') { pos++; continue; }
                    closed = true;
                    break;
                }
                if (!closed) throw malformed("SQL Server");
                while (pos < url.length() && url.charAt(pos) == ' ') pos++;
                if (pos < url.length() && url.charAt(pos) != ';') throw malformed("SQL Server");
            } else {
                while (pos < url.length() && url.charAt(pos) != ';') pos++;
            }
            if (pos < url.length()) pos++;
        }
    }

    private static List<String> splitH2(String settings) {
        List<String> tokens = new ArrayList<>();
        StringBuilder token = new StringBuilder();
        for (int i = 0; i < settings.length(); i++) {
            char c = settings.charAt(i);
            if (c == '\\' && i + 1 < settings.length()) token.append(settings.charAt(++i));
            else if (c == ';') {
                tokens.add(token.toString());
                token.setLength(0);
            } else token.append(c);
        }
        tokens.add(token.toString());
        return tokens;
    }

    private static void inspectHosts(String hosts, boolean mysql, boolean maria,
            boolean allowInit, boolean allowClasses, int nesting) throws SQLException {
        String family = mysql ? "MySQL/MariaDB" : "MariaDB";
        if (nesting > 16) throw malformed(family);
        for (String segment : splitHosts(hosts, family)) {
            String host = segment.trim();
            // Userinfo is separate from host properties, even when it contains property-like text.
            int at = host.indexOf('@');
            if (at >= 0) host = host.substring(at + 1).trim();
            if (host.startsWith("[") && host.endsWith("]")) {
                String inner = host.substring(1, host.length() - 1);
                if (inner.indexOf('(') >= 0 || inner.indexOf(',') >= 0) {
                    inspectHosts(inner, mysql, maria, allowInit, allowClasses, nesting + 1);
                }
            } else if (host.regionMatches(true, 0, "address=", 0, 8)) {
                int pos = 8;
                while (pos < host.length()) {
                    while (pos < host.length() && Character.isWhitespace(host.charAt(pos))) pos++;
                    if (pos == host.length()) break;
                    if (host.charAt(pos) != '(') throw malformed(family);
                    int end = host.indexOf(')', pos + 1);
                    if (end < 0) throw malformed(family);
                    inspectProperty(host.substring(pos + 1, end), mysql, maria, allowInit, allowClasses);
                    pos = end + 1;
                }
            } else if (host.startsWith("(")) {
                if (!host.endsWith(")")) throw malformed(family);
                for (String property : host.substring(1, host.length() - 1).split(",", -1)) {
                    inspectProperty(property, mysql, maria, allowInit, allowClasses);
                }
            }
        }
    }

    private static void inspectProperty(String property, boolean mysql, boolean maria,
            boolean allowInit, boolean allowClasses) throws SQLException {
        int equals = property.indexOf('=');
        String key = (equals < 0 ? property : property.substring(0, equals)).trim();
        String family = mysql ? "MySQL/MariaDB" : "MariaDB";
        checkFamilies(false, mysql, maria, key, allowInit, allowClasses);
        checkFamilies(false, mysql, maria, decode(key, family), allowInit, allowClasses);
        if (mysql && equals >= 0) decode(property.substring(equals + 1), family);
    }

    private static List<String> splitHosts(String hosts, String family) throws SQLException {
        List<String> result = new ArrayList<>();
        int start = 0, parens = 0, brackets = 0;
        for (int i = 0; i < hosts.length(); i++) {
            if (i == start) {
                // Connector/J separates raw userinfo first; parentheses in passwords
                // are ordinary characters, not structured-host delimiters.
                int at = hosts.indexOf('@', start), comma = hosts.indexOf(',', start);
                if (at >= 0 && (comma < 0 || at < comma)) i = at;
            }
            char c = hosts.charAt(i);
            if (c == '(') parens++;
            if (c == ')' && --parens < 0) throw malformed(family);
            if (parens == 0) {
                if (c == '[') brackets++;
                if (c == ']' && --brackets < 0) throw malformed(family);
            }
            if (c == ',' && parens == 0 && brackets == 0) {
                result.add(hosts.substring(start, i));
                start = i + 1;
            }
        }
        if (parens != 0 || brackets != 0) throw malformed(family);
        result.add(hosts.substring(start));
        return result;
    }

    private static String decode(String text, String family) throws SQLException {
        try {
            return URLDecoder.decode(text, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            throw malformed(family);
        }
    }

    private static SQLException blocked(String family, String key, String flag) {
        return new SQLException("JDBC URL policy blocked " + family + " option '" + key
                + "'; trusted connections require __flags." + flag + " = true", "08004");
    }

    private static SQLException malformed(String family) {
        return new SQLException("JDBC URL policy cannot inspect malformed " + family + " options", "08004");
    }
}
