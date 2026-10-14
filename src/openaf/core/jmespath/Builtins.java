/*
 * Copyright 2014 James Saryerwinnie
 * SPDX-License-Identifier: Apache-2.0
 * Modified for OpenAF: Java port of the bundled jmespath.js engine, with
 * direct Rhino integration and bounded syntax caching. See LICENSES.txt.
 */
package openaf.core.jmespath;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.mozilla.javascript.*;

/** Standard functions translated from the bundled jmespath.js. */
final class Builtins {
    private record Spec(int[][] types, boolean variadic, String method) {}
    private static final Map<String, Spec> FUNCTIONS = new LinkedHashMap<>();
    static {
        add("abs", "Abs", false, new int[]{0}); add("avg", "Avg", false, new int[]{8});
        add("ceil", "Ceil", false, new int[]{0}); add("contains", "Contains", false, new int[]{2,3}, new int[]{1});
        add("ends_with", "EndsWith", false, new int[]{2}, new int[]{2}); add("floor", "Floor", false, new int[]{0});
        add("length", "Length", false, new int[]{2,3,4}); add("map", "Map", false, new int[]{6}, new int[]{3});
        add("max", "Max", false, new int[]{8,9}); add("merge", "Merge", true, new int[]{4});
        add("max_by", "MaxBy", false, new int[]{3}, new int[]{6}); add("sum", "Sum", false, new int[]{8});
        add("starts_with", "StartsWith", false, new int[]{2}, new int[]{2}); add("min", "Min", false, new int[]{8,9});
        add("min_by", "MinBy", false, new int[]{3}, new int[]{6}); add("type", "Type", false, new int[]{1});
        add("keys", "Keys", false, new int[]{4}); add("values", "Values", false, new int[]{4});
        add("sort", "Sort", false, new int[]{9,8}); add("sort_by", "SortBy", false, new int[]{3}, new int[]{6});
        add("join", "Join", false, new int[]{2}, new int[]{9}); add("reverse", "Reverse", false, new int[]{2,3});
        add("to_array", "ToArray", false, new int[]{1}); add("to_string", "ToString", false, new int[]{1});
        add("to_number", "ToNumber", false, new int[]{1}); add("not_null", "NotNull", true, new int[]{1});
    }
    private static void add(String name, String method, boolean variadic, int[]... types) {
        FUNCTIONS.put(name, new Spec(types, variadic, "_function" + method));
    }
    static boolean has(String name) { return FUNCTIONS.containsKey(name); }
    static Set<String> names() { return FUNCTIONS.keySet(); }
    static String method(String name) { return FUNCTIONS.get(name).method; }
    static void validate(Evaluator e, String name, List<Object> args) {
        Spec spec = FUNCTIONS.get(name);
        e.arity(name, args.size(), spec.types.length, spec.variadic);
        for (int i = 0; i < spec.types.length; i++) e.argument(name, i, args.get(i), spec.types[i]);
    }
    static Object signature(Evaluator e, String name) {
        Spec spec = FUNCTIONS.get(name); List<Object> args = new ArrayList<>();
        for (int[] types : spec.types) {
            Scriptable descriptor = e.v.object(); List<Object> ids = new ArrayList<>();
            for (int type : types) ids.add(type);
            e.v.put(descriptor, "types", e.v.array(ids));
            args.add(descriptor);
        }
        if (spec.variadic) e.v.put((Scriptable) args.get(args.size() - 1), "variadic", true);
        return e.v.array(args);
    }
    static Object call(Evaluator e, String name, List<Object> args) {
        Values v = e.v;
        Object a = args.isEmpty() ? Values.UNDEFINED : args.get(0);
        Object b = args.size() < 2 ? Values.UNDEFINED : args.get(1);
        switch (name) {
            case "abs": return Math.abs(ScriptRuntime.toNumber(a));
            case "ceil": return Math.ceil(ScriptRuntime.toNumber(a));
            case "floor": return Math.floor(ScriptRuntime.toNumber(a));
            case "avg": case "sum":
                Object sum = 0.0;
                for (int i = 0; i < v.length(a); i++) sum = ScriptRuntime.add(sum, v.get(a, i), v.cx);
                return name.equals("avg") ? ScriptRuntime.toNumber(sum) / v.length(a) : sum;
            case "contains": return ScriptRuntime.toNumber(v.call(a, "indexOf", b)) >= 0;
            case "starts_with": return Values.str(a).startsWith(Values.str(b));
            case "ends_with": return Values.str(a).endsWith(Values.str(b));
            case "length": return v.isObject(a) ? v.keys(a).size() : v.get(a, "length");
            case "map":
                List<Object> mapped = new ArrayList<>();
                for (int i = 0; i < v.length(b); i++) mapped.add(e.ref(a, v.get(b, i)));
                return v.array(mapped);
            case "merge":
                Scriptable merged = v.object();
                for (Object input : args) for (String key : v.enumerableKeys(input)) v.put(merged, key, v.get(input, key));
                return merged;
            case "max": case "min":
                int length = v.length(a);
                if (length == 0) return null;
                Object extreme = v.get(a, 0);
                if (v.type(extreme) == 0) {
                    double number = name.equals("max") ? Double.NEGATIVE_INFINITY : Double.POSITIVE_INFINITY;
                    for (int i = 0; i < v.length(a); i++) number = name.equals("max")
                        ? Math.max(number, ScriptRuntime.toNumber(v.get(a, i))) : Math.min(number, ScriptRuntime.toNumber(v.get(a, i)));
                    return number;
                }
                for (int i = 1; i < v.length(a); i++) {
                    Object element = v.get(a, i);
                    if (name.equals("max") ? ScriptRuntime.toNumber(v.call(extreme, "localeCompare", element)) < 0
                        : ScriptRuntime.toNumber(v.call(element, "localeCompare", extreme)) < 0) extreme = element;
                }
                return extreme;
            case "max_by": case "min_by":
                Object boundary = name.equals("max_by") ? Double.NEGATIVE_INFINITY : Double.POSITIVE_INFINITY;
                Object record = Values.UNDEFINED;
                for (int i = 0; i < v.length(a); i++) {
                    Object element = v.get(a, i), key = e.ref(b, element);
                    int type = v.type(key);
                    if (type != 0 && type != 2) throw v.error("Error", "TypeError: expected one of 0,2, received " + (type < 0 ? "undefined" : type));
                    if (ScriptRuntime.compare(key, boundary, name.equals("max_by") ? Token.GT : Token.LT)) {
                        boundary = key; record = element;
                    }
                }
                return record;
            case "type":
                int type = v.type(a);
                return type < 0 ? Values.UNDEFINED : type == 6 ? "expref" : Evaluator.typeName(type);
            case "keys": return v.array(v.keys(a));
            case "values":
                List<Object> values = new ArrayList<>();
                for (String key : v.keys(a)) values.add(v.get(a, key));
                return v.array(values);
            case "join": return v.call(b, "join", a);
            case "reverse":
                if (v.type(a) == 2) {
                    String text = Values.str(a); StringBuilder reverse = new StringBuilder();
                    for (int i = text.length() - 1; i >= 0; i--) reverse.append(text.charAt(i));
                    return reverse.toString();
                }
                Object reversed = v.call(a, "slice", 0);
                v.call(reversed, "reverse"); return reversed;
            case "to_array": return v.type(a) == 3 ? a : v.array(a);
            case "to_string": return v.type(a) == 2 ? a : v.stringify(a);
            case "to_number":
                if (v.type(a) == 0) return a;
                if (v.type(a) == 2) { double number = ScriptRuntime.toNumber(a); return Double.isNaN(number) ? null : number; }
                return null;
            case "not_null":
                for (Object value : args) if (v.type(value) != 7) return value;
                return null;
            case "sort":
                Object sorted = v.call(a, "slice", 0);
                v.call(sorted, "sort"); return sorted;
            case "sort_by": return sortBy(e, a, b);
            default: throw v.error("Error", "Unknown function: " + name + "()");
        }
    }
    private static Object sortBy(Evaluator e, Object input, Object ref) {
        Values v = e.v;
        Object sorted = v.call(input, "slice", 0);
        if (v.length(sorted) == 0) return sorted;
        int required = v.type(e.ref(ref, v.get(sorted, 0)));
        if (required != 0 && required != 2) throw v.error("Error", "TypeError");
        List<Object> decorated = new ArrayList<>();
        for (int i = 0; i < v.length(sorted); i++) decorated.add(v.array(i, v.get(sorted, i)));
        Scriptable entries = v.array(decorated);
        BaseFunction comparator = new BaseFunction() {
            @Override public Object call(Context cx, Scriptable scope, Scriptable self, Object[] args) {
                Object a = e.ref(ref, v.get(args[0], 1)), b = e.ref(ref, v.get(args[1], 1));
                int ta = v.type(a), tb = v.type(b);
                if (ta != required || tb != required) throw v.error("Error", "TypeError: expected " + required + ", received "
                    + ((ta != required ? ta : tb) < 0 ? "undefined" : (ta != required ? ta : tb)));
                if (ScriptRuntime.compare(a, b, Token.GT)) return 1;
                if (ScriptRuntime.compare(a, b, Token.LT)) return -1;
                return ScriptRuntime.toNumber(v.get(args[0], 0)) - ScriptRuntime.toNumber(v.get(args[1], 0));
            }
        };
        comparator.setParentScope(v.scope); comparator.setPrototype(ScriptableObject.getFunctionPrototype(v.scope));
        v.call(entries, "sort", comparator);
        for (int i = 0; i < v.length(entries); i++) ScriptRuntime.setObjectIndex(sorted, i, v.get(v.get(entries, i), 1), v.cx, v.scope);
        return sorted;
    }
}
