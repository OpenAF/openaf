import java.io.*;
import java.lang.reflect.*;
import java.util.*;

/** Standalone: javac -cp bin -d bin tests/java/WebSocketLimitsTest.java; java -Xmx64m -cp bin WebSocketLimitsTest */
public class WebSocketLimitsTest {
    private static final int LIMIT = 1024 * 1024;
    private static void check(boolean ok, String message) { if (!ok) throw new AssertionError(message); }
    private static byte[] frame(int opcode, boolean fin, int length) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write((fin ? 128 : 0) | opcode);
        if (length < 126) out.write(length);
        else if (length <= 65535) { out.write(126); out.write(length >>> 8); out.write(length); }
        else { out.write(127); for (int shift = 56; shift >= 0; shift -= 8) out.write((int) ((long) length >>> shift) & 255); }
        out.write(new byte[length]);
        return out.toByteArray();
    }
    private static byte[] join(byte[]... frames) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        for (byte[] f : frames) out.write(f);
        return out.toByteArray();
    }
    private static class HeaderOnly extends ByteArrayInputStream {
        HeaderOnly(int length) throws IOException { super(Arrays.copyOf(frame(2, true, length), 10)); }
        @Override public int read(byte[] b, int off, int len) { throw new AssertionError("Payload read before oversized header rejection"); }
    }
    private static class Fixture { Object socket; int messages; int code; int pongs; byte[] last; }
    private static Object session(Class<?> type, InputStream in) {
        return Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, (p,m,a) -> {
            if (m.getName().equals("getInputStream")) return in;
            if (m.getName().equals("getHeaders")) return new HashMap<String,String>();
            throw new AssertionError("Unexpected handshake access: " + m.getName());
        });
    }
    private static Fixture nwu(InputStream in) {
        Fixture f = new Fixture();
        f.socket = new com.nwu.httpd.NanoWSD.WebSocket((com.nwu.httpd.NanoHTTPD.IHTTPSession) session(com.nwu.httpd.NanoHTTPD.IHTTPSession.class, in)) {
            protected void onOpen() {}
            protected void onClose(com.nwu.httpd.NanoWSD.WebSocketFrame.CloseCode c, String r, boolean remote) { f.code = c.getValue(); }
            protected void onMessage(com.nwu.httpd.NanoWSD.WebSocketFrame m) { f.messages++; f.last = m.getBinaryPayload(); }
            protected void onPong(com.nwu.httpd.NanoWSD.WebSocketFrame m) { f.pongs++; }
            protected void onException(IOException e) {}
        };
        return f;
    }
    private static Fixture nwu2(InputStream in) {
        Fixture f = new Fixture();
        f.socket = new com.nwu2.httpd.NanoWSD.WebSocket((com.nwu2.httpd.NanoHTTPD.IHTTPSession) session(com.nwu2.httpd.NanoHTTPD.IHTTPSession.class, in)) {
            protected void onOpen() {}
            protected void onClose(com.nwu2.httpd.NanoWSD.WebSocketFrame.CloseCode c, String r, boolean remote) { f.code = c.getValue(); }
            protected void onMessage(com.nwu2.httpd.NanoWSD.WebSocketFrame m) { f.messages++; f.last = m.getBinaryPayload(); }
            protected void onPong(com.nwu2.httpd.NanoWSD.WebSocketFrame m) { f.pongs++; }
            protected void onException(IOException e) {}
        };
        return f;
    }
    private static Fixture receive(String pkg, byte[] bytes, Integer limit) throws Exception {
        Fixture f = pkg.equals("nwu") ? nwu(new ByteArrayInputStream(bytes)) : nwu2(new ByteArrayInputStream(bytes));
        Class<?> base = f.socket.getClass().getSuperclass();
        if (limit != null) base.getMethod("setMaxMessageSize", int.class).invoke(f.socket, limit);
        Field state = base.getDeclaredField("state"); state.setAccessible(true);
        @SuppressWarnings({"unchecked","rawtypes"}) Object open = Enum.valueOf((Class) state.getType(), "OPEN");
        state.set(f.socket, open);
        Field out = base.getDeclaredField("out"); out.setAccessible(true); out.set(f.socket, new ByteArrayOutputStream());
        Method read = base.getDeclaredMethod("readWebsocket"); read.setAccessible(true); read.invoke(f.socket);
        Field fragments = base.getDeclaredField("continuousFrames"); fragments.setAccessible(true);
        check(((List<?>) fragments.get(f.socket)).isEmpty(), pkg + " retains fragments after close");
        return f;
    }
    private static void test(String pkg) throws Exception {
        Class<?> parser = Class.forName("com." + pkg + ".httpd.NanoWSD$WebSocketFrame");
        Method read = parser.getMethod("read", InputStream.class);
        try { read.invoke(null, new HeaderOnly(LIMIT + 1)); throw new AssertionError("Oversized frame accepted"); }
        catch (InvocationTargetException e) {
            Object cause = e.getCause();
            check(cause instanceof IOException, pkg + " allocated/read oversized payload: " + cause);
            check(cause.getClass().getMethod("getCode").invoke(cause).toString().equals("MessageTooBig"), "Wrong close code");
        }
        check(read.invoke(null, new ByteArrayInputStream(frame(2, true, LIMIT))) != null, "Boundary frame rejected");
        Fixture f = receive(pkg, frame(2, true, LIMIT + 1), null);
        check(f.code == 1009 && f.messages == 0, "Default socket limit missing");
        f = receive(pkg, frame(2, true, LIMIT + 1), LIMIT + 1);
        check(f.messages == 1, "Explicit larger limit rejected");
        f = receive(pkg, join(frame(2,false,3), frame(0,true,2)), 4);
        check(f.code == 1009 && f.messages == 0, "Fragment aggregate limit missing");
        f = receive(pkg, join(frame(2,false,4), frame(9,true,1), frame(10,true,1), frame(0,true,0), frame(1,true,2)), 4);
        check(f.messages == 2 && f.pongs == 1, "Controls/reset/ordinary text rejected at message boundary");
        for (int count : new int[]{256, 257}) {
            ByteArrayOutputStream wire = new ByteArrayOutputStream();
            for (int i=0; i<count; i++) wire.write(frame(i == 0 ? 2 : 0, i == count-1, 0));
            f = receive(pkg, wire.toByteArray(), Integer.MAX_VALUE);
            check(count == 256 ? f.messages == 1 : f.messages == 0 && f.code == 1009, "Empty fragment-count limit missing");
        }
        for (int limit : new int[]{0, -1}) {
            try { receive(pkg, new byte[0], limit); throw new AssertionError("Invalid limit accepted"); }
            catch (InvocationTargetException e) { check(e.getCause() instanceof IllegalArgumentException, "Wrong invalid-limit exception"); }
        }
        System.out.println(pkg + " WebSocket limits PASS");
    }
    public static void main(String[] args) throws Exception {
        if (args.length > 0) test(args[0]); else { test("nwu"); test("nwu2"); }
    }
}
