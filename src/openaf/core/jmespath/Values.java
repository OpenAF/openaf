/*
 * Copyright 2014 James Saryerwinnie
 * SPDX-License-Identifier: Apache-2.0
 * Modified for OpenAF: Java port of the bundled jmespath.js engine, with
 * direct Rhino integration and bounded syntax caching. See LICENSES.txt.
 */
package openaf.core.jmespath;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.mozilla.javascript.*;

/** Rhino operations used by the port; no conversion of the input tree. */
final class Values {
    static final Object UNDEFINED = Undefined.instance;
    final Context cx;
    final Scriptable scope;
    java.util.function.Function<Object, Object> export = value -> value;
    Values(Context cx, Scriptable scope) { this.cx = cx; this.scope = scope; }
    static String str(Object value) { return ScriptRuntime.toString(value); }
    static Object found(Object value) { return value == Scriptable.NOT_FOUND ? UNDEFINED : value; }
    Object get(Object object, String key) {
        object = export.apply(object);
        return found(ScriptRuntime.getObjectElem(object, key, cx, scope));
    }
    Object get(Object object, int index) {
        object = export.apply(object);
        return found(ScriptRuntime.getObjectIndex(object, index, cx, scope));
    }
    void put(Scriptable object, String key, Object value) { ScriptRuntime.setObjectElem(object, key, value, cx, scope); }
    int length(Object object) { return (int) ScriptRuntime.toNumber(get(object, "length")); }
    Scriptable array(List<?> values) { return cx.newArray(scope, values.stream().map(export).toArray()); }
    Scriptable array(Object... values) { return cx.newArray(scope, java.util.Arrays.stream(values).map(export).toArray()); }
    Scriptable object() { return cx.newObject(scope); }
    Object call(Object target, String name, Object... args) {
        return ScriptRuntime.getPropAndThis(export.apply(target), name, cx, scope).call(cx, scope, args);
    }
    Object globalCall(String object, String name, Object... args) { return call(get(scope, object), name, args); }
    RuntimeException error(String name, String message) {
        Scriptable error = cx.newObject(scope, "Error", new Object[]{message});
        put(error, "name", name);
        return new JavaScriptException(error, "pathJava", 0);
    }
    Object parseJSON(String json) { return NativeJSON.parse(cx, scope, json, (context, callScope, self, args) -> args[1]); }
    Object stringify(Object value) { return NativeJSON.stringify(cx, scope, value, null, null); }
    String tag(Object value) {
        if (value instanceof Evaluator.Reference) return "Object";
        if (value == null) return "Null";
        if (Undefined.isUndefined(value)) return "Undefined";
        if (value instanceof CharSequence) return "String";
        if (value instanceof Number && !(value instanceof java.math.BigInteger)) return "Number";
        if (value instanceof Boolean) return "Boolean";
        if (value instanceof Scriptable s) {
            String name = s.getClassName();
            if (List.of("Object", "Array", "String", "Number", "Boolean").contains(name)
                && !ScriptableObject.hasProperty(s, SymbolKey.TO_STRING_TAG)) return name;
        }
        Object prototype = get(get(scope, "Object"), "prototype");
        String text = str(ScriptRuntime.call(cx, get(prototype, "toString"), value, new Object[0], scope));
        return text.substring(8, text.length() - 1);
    }
    boolean isArray(Object value) { return tag(value).equals("Array"); }
    boolean isObject(Object value) { return tag(value).equals("Object"); }
    int type(Object value) {
        if (value instanceof Evaluator.Reference) return 6;
        return switch (tag(value)) {
            case "Number" -> 0; case "String" -> 2; case "Array" -> 3;
            case "Object" -> "Expref".equals(get(value, "jmespathType")) ? 6 : 4;
            case "Boolean" -> 5; case "Null" -> 7; default -> -1;
        };
    }
    List<String> keys(Object object) {
        Object keys = globalCall("Object", "keys", object);
        List<String> result = new ArrayList<>();
        for (int i = 0, n = length(keys); i < n; i++) result.add(str(get(keys, i)));
        return result;
    }
    List<String> enumerableKeys(Object object) {
        Object enumeration = ScriptRuntime.enumInit(object, cx, scope, ScriptRuntime.ENUMERATE_KEYS_NO_ITERATOR);
        List<String> result = new ArrayList<>();
        while (ScriptRuntime.enumNext(enumeration, cx)) result.add(str(ScriptRuntime.enumId(enumeration, cx)));
        return result;
    }
    boolean own(Object object, String key) {
        Object prototype = get(get(scope, "Object"), "prototype");
        return ScriptRuntime.toBoolean(ScriptRuntime.call(cx, get(prototype, "hasOwnProperty"), object, new Object[]{key}, scope));
    }
    boolean falseValue(Object value) {
        if (ScriptRuntime.shallowEq(value, "") || ScriptRuntime.shallowEq(value, false) || value == null) return true;
        if (isArray(value)) return length(value) == 0;
        if (isObject(value)) {
            for (String key : enumerableKeys(value)) {
                // Preserve the reference implementation's receiver call, including overrides.
                if (ScriptRuntime.toBoolean(call(value, "hasOwnProperty", key))) return false;
            }
            return true;
        }
        return false;
    }
    boolean equal(Object a, Object b) {
        if (ScriptRuntime.shallowEq(a, b)) return true;
        if (!tag(a).equals(tag(b))) return false;
        if (isArray(a)) {
            int n = length(a);
            if (n != length(b)) return false;
            for (int i = 0; i < n; i++) if (!equal(get(a, i), get(b, i))) return false;
            return true;
        }
        if (isObject(a)) {
            // Retain the JS implementation's missing/undefined comparison behavior.
            Map<String, Boolean> seen = new LinkedHashMap<>();
            for (String key : enumerableKeys(a)) {
                if (own(a, key) && !equal(get(a, key), get(b, key))) return false;
                seen.put(key, true);
            }
            for (String key : enumerableKeys(b)) if (own(b, key) && !seen.containsKey(key)) return false;
            return true;
        }
        return false;
    }
    Object freeze(Object value) {
        if (value instanceof NativeArray) {
            List<Object> list = new ArrayList<>();
            for (int i = 0, n = length(value); i < n; i++) list.add(freeze(get(value, i)));
            return Collections.unmodifiableList(list);
        }
        if (value instanceof NativeObject) {
            Map<String, Object> map = new LinkedHashMap<>();
            for (Object id : ((Scriptable) value).getIds()) {
                String key = str(id);
                map.put(key, freeze(get(value, key)));
            }
            return Collections.unmodifiableMap(map);
        }
        return value instanceof CharSequence ? value.toString() : value;
    }
    Object thaw(Object value) {
        if (value instanceof Scriptable) return value;
        if (value instanceof List<?> list) {
            List<Object> result = new ArrayList<>();
            for (Object child : list) result.add(thaw(child));
            return array(result);
        }
        if (value instanceof Map<?, ?> map) {
            Scriptable result = object();
            map.forEach((key, child) -> ScriptableObject.defineProperty(result, (String) key, thaw(child), 0));
            return result;
        }
        return value;
    }
}
