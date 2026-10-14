package openaf.core.jq;

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.IdentityHashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import net.thisptr.jackson.jq.BuiltinFunctionLoader;
import net.thisptr.jackson.jq.JsonQuery;
import net.thisptr.jackson.jq.Scope;
import net.thisptr.jackson.jq.Versions;
import net.thisptr.jackson.jq.exception.JsonQueryException;
import org.mozilla.javascript.*;

/** jq 1.6 evaluation with detached JSON values and engine-local syntax caching. */
public final class JqEngine {
    private static final Object CACHE_KEY = new Object();
    private static final int MAX_ENTRY_CHARS = 16384;
    private static final int MAX_CACHE_CHARS = 262144;
    private static final int MAX_DEPTH = 512;
    private JqEngine() {}

    private static final class Builtins {
        static final Scope ROOT = create();
        private static Scope create() {
            Scope root = Scope.newEmptyScope();
            BuiltinFunctionLoader.getInstance().loadFunctions(Versions.JQ_1_6, root);
            // Keep the default NullModuleLoader: no filesystem or classpath imports.
            return root;
        }
    }

    private static final class Cache {
        final LinkedHashMap<String, JsonQuery> entries = new LinkedHashMap<>();
        int chars;
        synchronized JsonQuery compile(String expression, int limit) throws JsonQueryException {
            if (limit <= 0) {
                entries.clear(); chars = 0;
                return JsonQuery.compile(expression, Versions.JQ_1_6);
            }
            trim(limit, 0);
            JsonQuery query = entries.get(expression);
            if (query != null) return query;
            query = JsonQuery.compile(expression, Versions.JQ_1_6);
            if (expression.length() <= MAX_ENTRY_CHARS) {
                trim(limit - 1, expression.length());
                entries.put(expression, query);
                chars += expression.length();
            }
            return query;
        }
        private void trim(int limit, int extra) {
            Iterator<Map.Entry<String, JsonQuery>> iterator = entries.entrySet().iterator();
            while (iterator.hasNext() && (entries.size() > limit || chars + extra > MAX_CACHE_CHARS)) {
                chars -= iterator.next().getKey().length();
                iterator.remove();
            }
        }
    }

    public static Object search(Context cx, Scriptable scope, Object input, Object expression, Object options) {
        ScriptableObject top = (ScriptableObject) ScriptableObject.getTopLevelScope(scope);
        Converter values = new Converter(cx, top);
        try {
            String query = Undefined.isUndefined(expression) ? "." : values.string(expression, "expression");
            boolean all = false;
            NativeObject variables = null;
            if (!Undefined.isUndefined(options)) {
                NativeObject opts = values.object(options, "options");
                Object mode = ScriptableObject.getProperty(opts, "all");
                if (mode != Scriptable.NOT_FOUND && !Undefined.isUndefined(mode)) {
                    if (!(mode instanceof Boolean)) throw values.error("JqInputError", "options.all must be a boolean");
                    all = (Boolean) mode;
                }
                Object vars = ScriptableObject.getProperty(opts, "vars");
                if (vars != Scriptable.NOT_FOUND && !Undefined.isUndefined(vars)) variables = values.object(vars, "options.vars");
            }
            JsonNode in = values.input(input, "$input", 0);
            Scope call = Scope.newChildScope(Builtins.ROOT);
            if (variables != null) {
                for (Object id : variables.getIds()) {
                    String name = id.toString();
                    if (!name.matches("[A-Za-z_][A-Za-z0-9_]*"))
                        throw values.error("JqInputError", "Invalid variable name at options.vars[" + TextNode.valueOf(name) + "]");
                    call.setValue(name, values.input(values.property(variables, id), "$vars[" + TextNode.valueOf(name) + "]", 0));
                }
            }
            Cache cache = (Cache) top.getAssociatedValue(CACHE_KEY);
            if (cache == null) cache = (Cache) top.associateValue(CACHE_KEY, new Cache());
            Object flags = ScriptableObject.getProperty(top, "__flags");
            Object size = flags instanceof Scriptable s ? ScriptableObject.getProperty(s, "JQ_CACHE_SIZE") : Scriptable.NOT_FOUND;
            int limit = size == Scriptable.NOT_FOUND || Undefined.isUndefined(size) ? 256 : Math.max(0, (int) Context.toNumber(size));
            JsonQuery compiled;
            try {
                compiled = cache.compile(query, limit);
            } catch (JsonQueryException e) {
                throw values.error("JqCompileError", e.getMessage());
            }
            List<Object> outputs = new ArrayList<>();
            compiled.apply(call, in, node -> outputs.add(values.output(node, 0)));
            if (all || outputs.size() > 1) return cx.newArray(top, outputs.toArray());
            return outputs.isEmpty() ? Undefined.instance : outputs.get(0);
        } catch (JsonQueryException e) {
            throw values.error("JqError", e.getMessage());
        } catch (StackOverflowError e) {
            throw values.error("JqError", "Query or value exceeds the available stack depth");
        }
    }

    private static final class Converter {
        final Context cx;
        final Scriptable scope;
        final IdentityHashMap<Object, Boolean> ancestors = new IdentityHashMap<>();
        Converter(Context cx, Scriptable scope) { this.cx = cx; this.scope = scope; }
        JavaScriptException error(String name, String message) {
            Scriptable error = cx.newObject(scope, "Error", new Object[]{message});
            ScriptableObject.putProperty(error, "name", name);
            return new JavaScriptException(error, "$jq", 0);
        }
        String string(Object value, String path) {
            if (value instanceof CharSequence) return value.toString();
            throw error("JqInputError", path + " must be a string");
        }
        NativeObject object(Object value, String path) {
            if (value instanceof NativeObject obj && (obj.getPrototype() == null
                || obj.getPrototype() == ScriptableObject.getObjectPrototype(scope))) return obj;
            throw error("JqInputError", "Expected a plain JSON object at " + path);
        }
        Object property(Scriptable object, Object id) {
            return id instanceof Number n ? object.get(n.intValue(), object) : object.get(id.toString(), object);
        }
        JsonNode input(Object value, String path, int depth) {
            if (depth > MAX_DEPTH) throw error("JqInputError", "JSON nesting exceeds " + MAX_DEPTH + " at " + path);
            if (value == null) return NullNode.instance;
            if (value instanceof CharSequence text) return TextNode.valueOf(text.toString());
            if (value instanceof Boolean b) return BooleanNode.valueOf(b);
            if (value instanceof Number n && !(value instanceof BigInteger)) {
                double number = n.doubleValue();
                if (!Double.isFinite(number)) throw error("JqInputError", "Non-finite number at " + path);
                if (number == Math.rint(number) && Math.abs(number) <= 9007199254740991d
                    && Double.doubleToRawLongBits(number) != Double.doubleToRawLongBits(-0d)) return LongNode.valueOf((long) number);
                return DoubleNode.valueOf(number);
            }
            if (!(value instanceof NativeArray) && !(value instanceof NativeObject))
                throw error("JqInputError", "Unsupported JSON value at " + path);
            if (ancestors.put(value, Boolean.TRUE) != null) throw error("JqInputError", "Cyclic JSON value at " + path);
            try {
                if (value instanceof NativeArray array) {
                    long length = array.getLength();
                    if (length > Integer.MAX_VALUE) throw error("JqInputError", "Array too large at " + path);
                    // Do not preallocate from an unvalidated length: sparse arrays fail below.
                    ArrayNode result = JsonNodeFactory.instance.arrayNode();
                    for (int i = 0; i < length; i++) {
                        if (!array.has(i, array)) throw error("JqInputError", "Sparse array at " + path + "[" + i + "]");
                        result.add(input(array.get(i, array), path + "[" + i + "]", depth + 1));
                    }
                    return result;
                }
                NativeObject object = object(value, path);
                ObjectNode result = JsonNodeFactory.instance.objectNode();
                for (Object id : object.getIds()) {
                    String key = id.toString();
                    result.set(key, input(property(object, id), path + "[" + TextNode.valueOf(key) + "]", depth + 1));
                }
                return result;
            } finally {
                ancestors.remove(value);
            }
        }
        Object output(JsonNode value, int depth) {
            if (depth > MAX_DEPTH) throw error("JqError", "Result nesting exceeds " + MAX_DEPTH);
            if (value == null || value.isNull()) return null;
            if (value.isTextual()) return value.textValue();
            if (value.isBoolean()) return value.booleanValue();
            if (value.isNumber()) {
                double number = value.doubleValue();
                return Double.isFinite(number) ? number : null;
            }
            if (value.isArray()) {
                Object[] elements = new Object[value.size()];
                for (int i = 0; i < elements.length; i++) elements[i] = output(value.get(i), depth + 1);
                return cx.newArray(scope, elements);
            }
            if (value.isObject()) {
                ScriptableObject result = (ScriptableObject) cx.newObject(scope);
                Iterator<Map.Entry<String, JsonNode>> fields = value.fields();
                while (fields.hasNext()) {
                    Map.Entry<String, JsonNode> field = fields.next();
                    // Define own data properties, including __proto__, without invoking setters.
                    Object item = output(field.getValue(), depth + 1);
                    long index = ScriptRuntime.indexFromString(field.getKey());
                    if (index >= 0) result.put((int) index, result, item);
                    else result.defineProperty(field.getKey(), item, ScriptableObject.EMPTY);
                }
                return result;
            }
            throw error("JqError", "Unsupported jq result type: " + value.getNodeType());
        }
    }
}
