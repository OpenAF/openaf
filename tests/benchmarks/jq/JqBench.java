package bench;

import java.util.LinkedHashMap;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import net.thisptr.jackson.jq.*;

/** Benchmark-only JSON text round trip; uses the same jq version and builtins. */
public final class JqBench {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final Scope ROOT = Scope.newEmptyScope();
    private static final LinkedHashMap<String, JsonQuery> CACHE = new LinkedHashMap<>();
    static { BuiltinFunctionLoader.getInstance().loadFunctions(Versions.JQ_1_6, ROOT); }
    public static String evaluate(String input, String expression) throws Exception {
        JsonQuery query = CACHE.get(expression);
        if (query == null) {
            query = JsonQuery.compile(expression, Versions.JQ_1_6);
            if (CACHE.size() == 256) CACHE.remove(CACHE.keySet().iterator().next());
            CACHE.put(expression, query);
        }
        ArrayNode out = MAPPER.createArrayNode();
        query.apply(Scope.newChildScope(ROOT), MAPPER.readTree(input), out::add);
        return MAPPER.writeValueAsString(out);
    }
}
