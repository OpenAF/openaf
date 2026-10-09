/*
 * Copyright 2014 James Saryerwinnie
 * SPDX-License-Identifier: Apache-2.0
 * Modified for OpenAF: Java port of the bundled jmespath.js engine, with
 * direct Rhino integration and bounded syntax caching. See LICENSES.txt.
 */
package openaf.core.jmespath;

import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import org.mozilla.javascript.*;

/** Engine-scoped syntax cache and public Rhino entry point. */
public final class PathEngine {
    private static final Object CACHE_KEY = new Object();
    private PathEngine() {}
    private record Entry(Query query, int nodes) {}
    private static final class Cache {
        final LinkedHashMap<String, Entry> entries = new LinkedHashMap<>();
        int chars, nodes;
        synchronized Query compile(String expression, int limit, Values values) {
            if (limit <= 0) {
                entries.clear(); chars = nodes = 0;
                return new Parser(values).parse(expression);
            }
            trim(limit, 0, 0);
            Entry hit = entries.get(expression);
            if (hit != null) return hit.query;
            Query query = new Parser(values).parse(expression);
            int count = query == null ? 0 : query.nodes();
            if (expression.length() <= 16384 && count <= 4096) {
                trim(limit - 1, expression.length(), count);
                entries.put(expression, new Entry(query, count));
                chars += expression.length(); nodes += count;
            }
            return query;
        }
        private void trim(int limit, int extraChars, int extraNodes) {
            Iterator<Map.Entry<String, Entry>> iterator = entries.entrySet().iterator();
            while (iterator.hasNext() && (entries.size() > limit || chars + extraChars > 262144 || nodes + extraNodes > 65536)) {
                Map.Entry<String, Entry> entry = iterator.next();
                chars -= entry.getKey().length(); nodes -= entry.getValue().nodes;
                iterator.remove();
            }
        }
    }
    public static Object search(Context cx, Scriptable scope, Object input, String expression, Object functions) {
        Values values = new Values(cx, scope);
        Scriptable top = ScriptableObject.getTopLevelScope(scope);
        ScriptableObject owner = (ScriptableObject) top;
        Cache cache = (Cache) owner.getAssociatedValue(CACHE_KEY);
        if (cache == null) cache = (Cache) owner.associateValue(CACHE_KEY, new Cache());
        Object flags = values.get(top, "__flags");
        Object size = Undefined.isUndefined(flags) ? Values.UNDEFINED : values.get(flags, "PATH_CACHE_SIZE");
        int limit = Undefined.isUndefined(size) ? 256 : Math.max(0, (int) ScriptRuntime.toNumber(size));
        Query query = cache.compile(expression, limit, values);
        Evaluator evaluator = new Evaluator(values, functions);
        return evaluator.export(evaluator.visit(query, input));
    }
}
