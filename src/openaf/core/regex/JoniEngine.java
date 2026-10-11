package openaf.core.regex;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import org.jcodings.specific.UTF8Encoding;
import org.joni.*;
import org.mozilla.javascript.*;

/** Compiled Oniguruma patterns with per-operation matcher state and UTF-16 offsets. */
public final class JoniEngine {
    private JoniEngine() {}

    private static String string(Object value, String name) {
        if (!(value instanceof CharSequence)) throw ScriptRuntime.typeError(name + " must be a string");
        String s = value.toString();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (Character.isHighSurrogate(c)) {
                if (++i >= s.length() || !Character.isLowSurrogate(s.charAt(i)))
                    throw ScriptRuntime.typeError(name + " contains an unpaired surrogate");
            } else if (Character.isLowSurrogate(c)) {
                throw ScriptRuntime.typeError(name + " contains an unpaired surrogate");
            }
        }
        return s;
    }

    private static Object arg(Object[] args, int i) {
        return i < args.length ? args[i] : Undefined.instance;
    }

    private interface Operation {
        Object run(Context cx, Scriptable scope, Object[] args);
    }

    private static void method(Scriptable target, Scriptable scope, String name, Operation operation) {
        BaseFunction fn = new BaseFunction(scope, ScriptableObject.getFunctionPrototype(scope)) {
            @Override public Object call(Context cx, Scriptable callScope, Scriptable self, Object[] args) {
                return operation.run(cx, scope, args);
            }
        };
        ScriptableObject.putProperty(target, name, fn);
    }

    public static Object compile(Context cx, Scriptable scope, Object pattern, Object options) {
        String source = string(pattern, "pattern");
        int flags = Option.CAPTURE_GROUP;
        if (!Undefined.isUndefined(options)) {
            if (!(options instanceof NativeObject)) throw ScriptRuntime.typeError("options must be an object");
            Scriptable opts = (Scriptable) options;
            String[] names = {"ignoreCase", "dotAll", "extended"};
            int[] bits = {Option.IGNORECASE, Option.MULTILINE, Option.EXTEND};
            for (int i = 0; i < names.length; i++) {
                Object v = ScriptableObject.getProperty(opts, names[i]);
                if (v == Scriptable.NOT_FOUND || Undefined.isUndefined(v)) continue;
                if (!(v instanceof Boolean)) throw ScriptRuntime.typeError("options." + names[i] + " must be a boolean");
                if ((Boolean) v) flags |= bits[i];
            }
        }
        byte[] bytes = source.getBytes(StandardCharsets.UTF_8);
        final Regex regex;
        try {
            regex = new Regex(bytes, 0, bytes.length, flags, UTF8Encoding.INSTANCE, Syntax.RUBY);
        } catch (org.joni.exception.JOniException e) {
            throw ScriptRuntime.constructError("SyntaxError", e.getMessage());
        }
        Scriptable result = cx.newObject(scope);
        method(result, scope, "test", (c, s, a) -> {
            Input in = new Input(string(arg(a, 0), "input"));
            return regex.matcher(in.bytes).search(0, in.bytes.length, Option.NONE) >= 0;
        });
        method(result, scope, "match", (c, s, a) -> matches(c, s, regex, string(arg(a, 0), "input"), false));
        method(result, scope, "matchAll", (c, s, a) -> matches(c, s, regex, string(arg(a, 0), "input"), true));
        method(result, scope, "split", (c, s, a) -> split(c, s, regex, string(arg(a, 0), "input"), arg(a, 1)));
        return result;
    }

    private static final class Input {
        final String text;
        final byte[] bytes;
        final int[] utf16;
        final int[] byteOffset;
        Input(String text) {
            this.text = text;
            bytes = text.getBytes(StandardCharsets.UTF_8);
            utf16 = new int[bytes.length + 1];
            byteOffset = new int[text.length() + 1];
            Arrays.fill(utf16, -1);
            int b = 0;
            for (int i = 0; i < text.length();) {
                int cp = text.codePointAt(i);
                utf16[b] = i;
                byteOffset[i] = b;
                b += cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
                i += Character.charCount(cp);
            }
            utf16[b] = text.length();
            byteOffset[text.length()] = b;
        }
        int nextByte(int b) {
            int i = utf16[b];
            return i == text.length() ? bytes.length + 1 : byteOffset[i + Character.charCount(text.codePointAt(i))];
        }
        Object capture(Region region, int n) {
            return region.getBeg(n) < 0 ? Undefined.instance : text.substring(utf16[region.getBeg(n)], utf16[region.getEnd(n)]);
        }
    }

    private static Scriptable matchObject(Context cx, Scriptable scope, Regex regex, Input in, Matcher matcher) {
        Region region = matcher.getEagerRegion();
        Scriptable out = cx.newObject(scope);
        ScriptableObject.putProperty(out, "text", in.text.substring(in.utf16[matcher.getBegin()], in.utf16[matcher.getEnd()]));
        ScriptableObject.putProperty(out, "index", in.utf16[matcher.getBegin()]);
        ScriptableObject.putProperty(out, "end", in.utf16[matcher.getEnd()]);
        Object[] captures = new Object[regex.numberOfCaptures()];
        for (int i = 0; i < captures.length; i++) captures[i] = in.capture(region, i + 1);
        ScriptableObject.putProperty(out, "captures", cx.newArray(scope, captures));
        Scriptable groups = cx.newObject(scope);
        Iterator<NameEntry> names = regex.namedBackrefIterator();
        while (names.hasNext()) {
            NameEntry name = names.next();
            Object value = Undefined.instance;
            for (int n : name.getBackRefs()) if (region.getBeg(n) >= 0) value = in.capture(region, n);
            String key = new String(name.name, name.nameP, name.nameEnd - name.nameP, StandardCharsets.UTF_8);
            // Define an own data property, including names such as __proto__.
            ((ScriptableObject) groups).defineProperty(key, value, ScriptableObject.EMPTY);
        }
        ScriptableObject.putProperty(out, "groups", groups);
        return out;
    }

    private static Object matches(Context cx, Scriptable scope, Regex regex, String text, boolean all) {
        Input in = new Input(text);
        Matcher matcher = regex.matcher(in.bytes);
        List<Object> results = new ArrayList<>();
        int start = 0;
        while (start <= in.bytes.length && matcher.search(start, in.bytes.length, Option.NONE) >= 0) {
            Scriptable match = matchObject(cx, scope, regex, in, matcher);
            if (!all) return match;
            results.add(match);
            int end = matcher.getEnd();
            start = matcher.getBegin() == end ? in.nextByte(end) : end;
        }
        return all ? cx.newArray(scope, results.toArray()) : null;
    }

    private static Object split(Context cx, Scriptable scope, Regex regex, String text, Object limitValue) {
        long limit = Undefined.isUndefined(limitValue) ? 0xffffffffL : ScriptRuntime.toUint32(limitValue);
        List<Object> out = new ArrayList<>();
        if (limit == 0) return cx.newArray(scope, 0);
        Input in = new Input(text);
        Matcher matcher = regex.matcher(in.bytes);
        if (text.isEmpty()) {
            if (matcher.match(0, 0, Option.NONE) < 0) out.add("");
            return cx.newArray(scope, out.toArray());
        }
        int p = 0, q = 0;
        while (q < in.bytes.length) {
            if (matcher.match(q, in.bytes.length, Option.NONE) < 0 || matcher.getEnd() == p) {
                q = in.nextByte(q);
                continue;
            }
            out.add(text.substring(in.utf16[p], in.utf16[matcher.getBegin()]));
            if (out.size() == limit) return cx.newArray(scope, out.toArray());
            p = matcher.getEnd();
            Region region = matcher.getEagerRegion();
            for (int n = 1; n <= regex.numberOfCaptures(); n++) {
                out.add(in.capture(region, n));
                if (out.size() == limit) return cx.newArray(scope, out.toArray());
            }
            q = p;
        }
        out.add(text.substring(in.utf16[p]));
        return cx.newArray(scope, out.toArray());
    }
}
