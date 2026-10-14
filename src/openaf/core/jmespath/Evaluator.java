/*
 * Copyright 2014 James Saryerwinnie
 * SPDX-License-Identifier: Apache-2.0
 * Modified for OpenAF: Java port of the bundled jmespath.js engine, with
 * direct Rhino integration and bounded syntax caching. See LICENSES.txt.
 */
package openaf.core.jmespath;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.IdentityHashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import org.mozilla.javascript.*;

/** Per-invocation evaluator and callback bridge. See LICENSES.txt. */
final class Evaluator {
    record Reference(Query query) {}
    Object export(Object value) { return value instanceof Reference ref ? exposeRef(ref.query) : value; }
    private Scriptable exposeRef(Query query) {
        Scriptable view = expose(query); v.put(view, "jmespathType", "Expref"); return view;
    }
    final Values v;
    private final Map<String, Object> custom = new LinkedHashMap<>();
    private final IdentityHashMap<Query, Object> literals = new IdentityHashMap<>();
    private final IdentityHashMap<Query, Scriptable> views = new IdentityHashMap<>();
    private Scriptable receiver;
    private Scriptable table;
    Evaluator(Values values, Object functions) {
        v = values;
        v.export = this::export;
        if (functions != null && !Undefined.isUndefined(functions)) {
            for (String name : v.enumerableKeys(functions)) if (ScriptRuntime.toBoolean(v.call(functions, "hasOwnProperty", name))) custom.put(name, v.get(functions, name));
        }
        if (custom.containsKey("__proto__")) receiver();
    }
    Object visit(Query query, Object input) {
        if (query == null) throw v.error("TypeError", "Cannot read property \"type\" from undefined");
        Scriptable view = views.get(query);
        if (view != null) query = read(view);
        List<Query> c = query.children;
        switch (query.type) {
            case "Field":
                if (input == null || !v.isObject(input)) return null;
                Object field = v.get(input, query.name);
                return Undefined.isUndefined(field) ? null : field;
            case "Subexpression":
                Object current = visit(c.get(0), input);
                for (int i = 1; i < c.size(); i++) {
                    current = visit(c.get(1), current);
                    if (current == null) return null;
                }
                return current;
            case "IndexExpression": return visit(c.get(1), visit(c.get(0), input));
            case "Index":
                if (!v.isArray(input)) return null;
                double raw = ScriptRuntime.toNumber(query.value);
                double index = raw < 0 ? v.length(input) + raw : raw;
                Object result = v.get(input, Values.str(index));
                return Undefined.isUndefined(result) ? null : result;
            case "Slice":
                if (!v.isArray(input)) return null;
                int n = v.length(input);
                double step = c.get(2) == null ? 1 : ScriptRuntime.toNumber(c.get(2).value);
                if (step == 0) throw v.error("RuntimeError", "Invalid slice, step cannot be 0");
                double start = c.get(0) == null ? (step < 0 ? n - 1 : 0) : cap(n, ScriptRuntime.toNumber(c.get(0).value), step);
                double stop = c.get(1) == null ? (step < 0 ? -1 : n) : cap(n, ScriptRuntime.toNumber(c.get(1).value), step);
                List<Object> sliced = new ArrayList<>();
                for (double i = start; step > 0 ? i < stop : i > stop; i += step) sliced.add(v.get(input, Values.str(i)));
                return v.array(sliced);
            case "Projection": case "ValueProjection": case "FilterProjection":
                Object base = visit(c.get(0), input);
                boolean object = query.type.equals("ValueProjection");
                if (object ? !v.isObject(base) : !v.isArray(base)) return null;
                List<Object> collected = new ArrayList<>();
                if (object) {
                    List<Object> elements = new ArrayList<>();
                    for (String key : v.keys(base)) elements.add(v.get(base, key));
                    for (Object element : elements) {
                        Object value = visit(c.get(1), element);
                        if (value != null) collected.add(value);
                    }
                } else if (query.type.equals("FilterProjection")) {
                    List<Object> filtered = new ArrayList<>();
                    for (int i = 0; i < v.length(base); i++) {
                        Object element = v.get(base, i);
                        if (!v.falseValue(visit(c.get(2), element))) filtered.add(v.get(base, i));
                    }
                    for (Object element : filtered) {
                        Object value = visit(c.get(1), element);
                        if (value != null) collected.add(value);
                    }
                } else {
                    for (int i = 0; i < v.length(base); i++) {
                        Object value = visit(c.get(1), v.get(base, i));
                        if (value != null) collected.add(value);
                    }
                }
                return v.array(collected);
            case "Comparator":
                Object first = visit(c.get(0), input), second = visit(c.get(1), input);
                return switch (query.name) {
                    case "EQ" -> v.equal(first, second); case "NE" -> !v.equal(first, second);
                    case "GT" -> ScriptRuntime.compare(first, second, Token.GT);
                    case "GTE" -> ScriptRuntime.compare(first, second, Token.GE);
                    case "LT" -> ScriptRuntime.compare(first, second, Token.LT);
                    case "LTE" -> ScriptRuntime.compare(first, second, Token.LE);
                    default -> throw v.error("Error", "Unknown comparator: " + query.name);
                };
            case "Flatten":
                Object original = visit(c.get(0), input);
                if (!v.isArray(original)) return null;
                List<Object> flat = new ArrayList<>();
                for (int i = 0; i < v.length(original); i++) {
                    Object element = v.get(original, i);
                    if (v.isArray(element)) for (int j = 0, size = v.length(element); j < size; j++) flat.add(v.get(element, j));
                    else flat.add(element);
                }
                return v.array(flat);
            case "Identity": case "Current": return input;
            case "MultiSelectList":
                if (input == null) return null;
                List<Object> list = new ArrayList<>();
                for (Query child : c) list.add(visit(child, input));
                return v.array(list);
            case "MultiSelectHash":
                if (input == null) return null;
                Scriptable hash = v.object();
                for (Query child : c) v.put(hash, child.name, visit(child.children.get(0), input));
                return hash;
            case "OrExpression":
                Object left = visit(c.get(0), input);
                return v.falseValue(left) ? visit(c.get(1), input) : left;
            case "AndExpression":
                Object lhs = visit(c.get(0), input);
                return v.falseValue(lhs) ? lhs : visit(c.get(1), input);
            case "NotExpression": return v.falseValue(visit(c.get(0), input));
            case "Literal":
                if (!literals.containsKey(query)) literals.put(query, v.thaw(query.value));
                return literals.get(query);
            case "Pipe": return visit(c.get(1), visit(c.get(0), input));
            case "Function":
                List<Object> args = new ArrayList<>();
                for (Query child : c) args.add(visit(child, input));
                return call(query.name == null ? "undefined" : query.name, args);
            case "ExpressionReference":
                return new Reference(c.get(0));
            default: throw v.error("Error", "Unknown node type: " + query.type);
        }
    }
    static double cap(int length, double value, double step) {
        if (value < 0) { value += length; if (value < 0) value = step < 0 ? -1 : 0; }
        else if (value >= length) value = step < 0 ? length - 1 : length;
        return value;
    }
    private Scriptable expose(Query query) {
        Scriptable existing = views.get(query);
        if (existing != null) return existing;
        Scriptable result = v.object(); views.put(query, result);
        v.put(result, "type", query.type);
        if (query.name != null) v.put(result, "name", query.name);
        if (query.type.equals("Literal") || query.type.equals("Index") || query.type.equals("Number")) {
            if (!literals.containsKey(query)) literals.put(query, v.thaw(query.value));
            v.put(result, "value", literals.get(query));
        }
        if (query.type.equals("KeyValuePair")) v.put(result, "value", expose(query.children.get(0)));
        else if (!query.children.isEmpty() || List.of("MultiSelectList", "MultiSelectHash", "Function").contains(query.type)) {
            List<Object> children = new ArrayList<>();
            for (Query child : query.children) children.add(child == null ? null : query.type.equals("Slice") ? child.value : expose(child));
            v.put(result, "children", v.array(children));
        }
        return result;
    }
    private Query read(Object object) {
        if (object == null || Undefined.isUndefined(object)) return null;
        String type = Values.str(v.get(object, "type"));
        Object name = v.get(object, "name");
        if (type.equals("KeyValuePair")) return Query.named(type, Values.str(name), Arrays.asList(read(v.get(object, "value"))));
        List<Query> children = new ArrayList<>();
        Object raw = v.get(object, "children");
        if (!Undefined.isUndefined(raw)) for (int i = 0, n = v.length(raw); i < n; i++) {
            Object child = v.get(raw, i);
            children.add(type.equals("Slice") ? child == null ? null : Query.value("Number", child) : read(child));
        }
        return new Query(type, Undefined.isUndefined(name) ? null : Values.str(name), v.get(object, "value"), children);
    }
    Object ref(Object node, Object value) { return visit(node instanceof Reference ref ? ref.query : read(node), value); }
    Object call(String name, List<Object> args) {
        Object descriptor = table == null ? custom.getOrDefault(name, Values.UNDEFINED) : v.get(v.get(receiver, "functionTable"), name);
        if (table == null && Undefined.isUndefined(descriptor) && Builtins.has(name)) {
            Builtins.validate(this, name, args);
            return Builtins.call(this, name, args);
        }
        if (table == null && Undefined.isUndefined(descriptor)) descriptor = v.get(v.object(), name);
        if (Undefined.isUndefined(descriptor)) throw v.error("Error", "Unknown function: " + name + "()");
        validate(name, args, v.get(descriptor, "_signature"));
        Object callback = v.get(descriptor, "_func");
        return v.call(callback, "call", receiver(), v.array(args));
    }
    void validate(String name, List<Object> args, Object signature) {
        int n = v.length(signature);
        Object last = v.get(signature, n - 1);
        boolean variadic = ScriptRuntime.toBoolean(v.get(last, "variadic"));
        arity(name, args.size(), n, variadic);
        for (int i = 0; i < n; i++) {
            Object types = v.get(v.get(signature, i), "types");
            int[] expected = new int[v.length(types)];
            for (int j = 0; j < expected.length; j++) expected[j] = (int) ScriptRuntime.toNumber(v.get(types, j));
            argument(name, i, args.get(i), expected);
        }
    }
    void arity(String name, int actual, int required, boolean variadic) {
        if (variadic ? actual < required : actual != required) throw v.error("Error", "ArgumentError: " + name + "() takes "
            + (variadic ? "at least" : "") + required + (required == 1 ? " argument" : " arguments") + " but received " + actual);
    }
    static final String[] TYPE_NAMES = {"number", "any", "string", "array", "object", "boolean", "expression", "null", "Array<number>", "Array<string>"};
    static String typeName(int type) { return type < 0 || type >= TYPE_NAMES.length ? "undefined" : TYPE_NAMES[type]; }
    boolean matches(int actual, int expected, Object value) {
        if (expected == 1) return true;
        if (expected == 8 || expected == 9) {
            if (actual != 3) return false;
            for (int i = 0, n = v.length(value); i < n; i++) if (v.type(v.get(value, i)) != (expected == 8 ? 0 : 2)) return false;
            return true;
        }
        return actual == expected;
    }
    void argument(String name, int i, Object value, int[] expected) {
        int actual = v.type(value);
        for (int type : expected) if (matches(actual, type, value)) return;
        StringBuilder types = new StringBuilder();
        for (int type : expected) { if (!types.isEmpty()) types.append(','); types.append(typeName(type)); }
        throw v.error("Error", "TypeError: " + name + "() expected argument " + (i + 1) + " to be type " + types
            + " but received type " + typeName(actual) + " instead.");
    }
    private List<Object> list(Object array) {
        List<Object> result = new ArrayList<>();
        for (int i = 0, n = v.length(array); i < n; i++) result.add(v.get(array, i));
        return result;
    }
    private BaseFunction function(Function<Object[], Object> body) {
        BaseFunction function = new BaseFunction() {
            @Override public Object call(Context cx, Scriptable scope, Scriptable self, Object[] args) { return body.apply(args); }
        };
        function.setParentScope(v.scope);
        function.setPrototype(ScriptableObject.getFunctionPrototype(v.scope));
        return function;
    }
    private Scriptable receiver() {
        if (receiver != null) return receiver;
        receiver = v.object(); table = v.object();
        v.put(receiver, "functionTable", table);
        for (String name : Builtins.names()) {
            Scriptable descriptor = v.object();
            BaseFunction fn = function(a -> Builtins.call(this, name, list(a[0])));
            v.put(descriptor, "_func", fn);
            v.put(descriptor, "_signature", Builtins.signature(this, name));
            v.put(table, name, descriptor);
            v.put(receiver, Builtins.method(name), fn);
        }
        custom.forEach((key, value) -> v.put(table, key, value));
        Scriptable interpreter = v.object();
        v.put(receiver, "_interpreter", interpreter);
        v.put(interpreter, "runtime", receiver);
        v.put(interpreter, "visit", function(a -> ref(a[0], a[1])));
        v.put(interpreter, "search", function(a -> ref(a[0], a[1])));
        v.put(interpreter, "capSliceRange", function(a -> cap((int) ScriptRuntime.toNumber(a[0]), ScriptRuntime.toNumber(a[1]), ScriptRuntime.toNumber(a[2]))));
        v.put(interpreter, "computeSliceParams", function(a -> {
            int len = (int) ScriptRuntime.toNumber(a[0]); Object parts = a[1];
            Object s = v.get(parts, 2); double step = s == null ? 1 : ScriptRuntime.toNumber(s);
            if (step == 0) throw v.error("RuntimeError", "Invalid slice, step cannot be 0");
            Object start = v.get(parts, 0), stop = v.get(parts, 1);
            return v.array(start == null ? step < 0 ? len - 1 : 0 : cap(len, ScriptRuntime.toNumber(start), step),
                stop == null ? step < 0 ? -1 : len : cap(len, ScriptRuntime.toNumber(stop), step), step);
        }));
        v.put(receiver, "_getTypeName", function(a -> v.type(a[0]) < 0 ? Values.UNDEFINED : v.type(a[0])));
        v.put(receiver, "_typeMatches", function(a -> matches((int) ScriptRuntime.toNumber(a[0]), (int) ScriptRuntime.toNumber(a[1]), a[2])));
        v.put(receiver, "_validateArgs", function(a -> { validate(Values.str(a[0]), list(a[1]), a[2]); return Values.UNDEFINED; }));
        v.put(receiver, "callFunction", function(a -> call(Values.str(a[0]), list(a[1]))));
        v.put(receiver, "createKeyFunction", function(a -> function(b -> {
            Object result = ref(a[0], b[0]);
            if (!ScriptRuntime.toBoolean(v.call(a[1], "includes", v.type(result))))
                throw v.error("Error", "TypeError: expected one of " + Values.str(a[1]) + ", received " + v.type(result));
            return result;
        })));
        return receiver;
    }
}
