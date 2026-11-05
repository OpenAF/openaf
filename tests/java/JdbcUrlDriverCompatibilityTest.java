package openaf.core;

import java.sql.SQLException;
import java.util.Map;

import com.mysql.cj.conf.ConnectionUrlParser;
import org.mariadb.jdbc.Configuration;

/** Optional server-free tests; supply Connector/J and MariaDB JARs on the classpath. */
public class JdbcUrlDriverCompatibilityTest {
    private static int checks;

    private static void check(boolean value, String message) {
        checks++;
        if (!value) throw new AssertionError(message);
    }

    private static void blocked(String url, String option) throws Exception {
        try {
            JdbcUrlPolicy.validate("", url);
            throw new AssertionError("Policy missed " + option);
        } catch (SQLException e) {
            check("08004".equals(e.getSQLState()), "Wrong SQLState");
            check(e.getMessage().contains(option.toLowerCase(java.util.Locale.ROOT)), "Wrong option");
        }
    }

    public static void main(String[] args) throws Exception {
        for (String url : new String[] {
                "jdbc:mysql://host/db?%73ocketFactory=probe.Factory",
                "jdbc:%6dysql://host/db?socketFactory=probe.Factory",
                "jdbc:mysql+srv://host/db?socketFactory=probe.Factory",
                "jdbc:mysql:loadbalance://host1,host2/db?socketFactory=probe.Factory" }) {
            Map<String, String> props = ConnectionUrlParser.parseConnectionString(url).getProperties();
            check("probe.Factory".equals(props.get("socketFactory")), "Real MySQL query parser differs");
            blocked(url, "socketFactory");
        }
        for (String key : new String[] { "loadBalanceExceptionChecker", "ha.loadBalanceStrategy",
                "haLoadBalanceStrategy", "queryInfoCacheFactory", "parseInfoCacheFactory", "serverConfigCacheFactory" }) {
            String url = "jdbc:mysql:loadbalance://host1,host2/db?" + key + "=probe.Factory";
            check("probe.Factory".equals(ConnectionUrlParser.parseConnectionString(url).getProperties().get(key)),
                    "Real MySQL hook parser differs");
            blocked(url, key);
        }
        for (String url : new String[] {
                "jdbc:mysql://address=(host=host)(%73ocketFactory=probe.Factory)/db",
                "jdbc:mysql://(host=host,socketFactory=probe.Factory)/db",
                "jdbc:mysql://user:pass@[(host=host,socketFactory=probe.Factory),host2]/db" }) {
            Map<String, String> props = ConnectionUrlParser.parseConnectionString(url).getHosts().get(0).getHostProperties();
            check("probe.Factory".equals(props.get("socketFactory")), "Real MySQL host parser differs");
            blocked(url, "socketFactory");
        }
        for (String url : new String[] {
                "jdbc:mysql://user:p)ass@host/db", "jdbc:mysql://user:p(ass@host/db",
                "jdbc:mysql://host/db?password=socketFactory%3Dx%26initSql%3Dy",
                "jdbc:mysql://address=(host=host)(password=socketFactory=ordinary)/db" }) {
            ConnectionUrlParser parser = ConnectionUrlParser.parseConnectionString(url);
            parser.getProperties();
            parser.getHosts();
            JdbcUrlPolicy.validate("", url);
            checks++;
        }
        for (String key : new String[] { "initSql", "sessionVariables", "socketFactory" }) {
            String url = "jdbc:mariadb://host/db?" + key + "=probe";
            Configuration config = Configuration.parse(url);
            String value = (String) Configuration.class.getMethod(key).invoke(config);
            check("probe".equals(value), "Real MariaDB query parser differs");
            blocked(url, key);
        }
        // Connector/J ignores fragments, but MariaDB treats # as database/value text.
        String fragment = "jdbc:mysql://host/db#?socketFactory=probe.Factory&permitMysqlScheme=true";
        check(ConnectionUrlParser.parseConnectionString(fragment).getProperties().isEmpty(), "MySQL fragment changed");
        check("probe.Factory".equals(Configuration.parse(fragment).socketFactory()), "MariaDB fragment behavior changed");
        blocked(fragment, "socketFactory");
        System.out.println("JdbcUrlDriverCompatibilityTest passed: " + checks + " checks");
    }
}
