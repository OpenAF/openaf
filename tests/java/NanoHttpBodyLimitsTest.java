import java.io.*;
import java.lang.reflect.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

/** Standalone in-memory HTTP sessions: java -Xmx128m -cp 'bin:openaf.jar:lib/*' NanoHttpBodyLimitsTest. */
public class NanoHttpBodyLimitsTest {
    static void check(boolean ok, String message) { if (!ok) throw new AssertionError(message); }
    static class Result { String response; int created; Throwable failure; }
    static abstract class Fixture {
        final AtomicInteger callbacks = new AtomicInteger();
        CountDownLatch entered, release;
        boolean failResponse, failCleanup;
        abstract Result execute(String wire) throws Exception;
        void callback(String uri) {
            callbacks.incrementAndGet();
            if (uri.equals("/fail")) throw new IllegalStateException("handler failure");
            if (uri.equals("/hold")) {
                entered.countDown();
                try { check(release.await(5, TimeUnit.SECONDS), "Budget test timed out"); }
                catch (InterruptedException e) { throw new RuntimeException(e); }
            }
        }
    }
    static String request(String method, String uri, String framing, String body) {
        return method + " " + uri + " HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n" + framing + "\r\n" + body;
    }
    static void status(Result r, int status) { check(r.response.startsWith("HTTP/1.1 " + status + " "), "Expected " + status + ", got " + r.response + " failure=" + r.failure); }
    static long reserved() throws Exception {
        Field f = openaf.core.HttpRequestBodyBudget.class.getDeclaredField("reserved"); f.setAccessible(true); return f.getLong(null);
    }
    static String multipart(int parts) {
        StringBuilder b = new StringBuilder();
        for (int i=0; i<parts; i++) b.append("--test-boundary\r\nContent-Disposition: form-data; name=\"f").append(i).append("\"; filename=\"x\"\r\nContent-Type: text/plain\r\n\r\nx\r\n");
        return b.append("--test-boundary--\r\n").toString();
    }
    static void test(Fixture f) throws Exception {
        int before = f.callbacks.get();
        Result r = f.execute(request("POST", "/", "Content-Length: 2049\r\n", ""));
        status(r,413); check(r.created == 0 && f.callbacks.get() == before, "Oversize reached storage/callback");
        for (String framing : new String[]{"Content-Length: -1\r\n", "Content-Length: nope\r\n", "Content-Length: 9999999999999999999999\r\n", "Content-Length: 1\r\nContent-Length: 2\r\n", "Transfer-Encoding: chunked\r\n", "Transfer-Encoding: chunked\r\nContent-Length: 1\r\n"}) {
            r = f.execute(request("POST", "/", framing, "")); status(r,400); check(r.created == 0, "Invalid framing created temporary file");
        }
        for (String method : new String[]{"POST","PUT"}) {
            for (int size : new int[]{0,16,1024,2048}) {
                r = f.execute(request(method,"/","Content-Length: " + size + "\r\n", "x".repeat(size)));
                status(r,200);
                check(r.created <= (method.equals("PUT") ? 2 : 1), "Repeated parsing duplicated temporary files");
                check(reserved() == 0, "Successful request leaked reservation");
            }
        }
        status(f.execute(request("POST","/","Content-Length: 1\r\nContent-Length: 1\r\n","x")),200);
        status(f.execute(request("GET","/","Content-Length: 2049\r\n","")),413);
        status(f.execute(request("POST","/","Content-Length: 2048\r\n","short")),400);
        System.setProperty("openaf.http.nano.maxMultipartParts","2");
        for (int parts : new int[]{2,3}) {
            String body = multipart(parts);
            r = f.execute(request("POST","/","Content-Length: " + body.length() + "\r\nContent-Type: multipart/form-data; boundary=test-boundary\r\n",body));
            status(r,parts == 2 ? 200 : 413);
            if (parts == 3) check(r.created == 0, "Multipart flood created entry files before rejection");
        }
        System.clearProperty("openaf.http.nano.maxMultipartParts");
        f.execute(request("POST","/fail","Content-Length: 1024\r\n","x".repeat(1024)));
        check(reserved() == 0, "Handler failure leaked reservation");
        f.failResponse = true;
        f.execute(request("POST","/","Content-Length: 1024\r\n","x".repeat(1024)));
        f.failResponse = false;
        check(reserved() == 0, "Response failure leaked reservation");
        status(f.execute(request("POST","/","Content-Length: 1\r\n","x")),200);
    }
    static class NwuFixture extends Fixture {
        final Server server = new Server();
        class Server extends com.nwu.httpd.NanoHTTPD {
            Server() { super("127.0.0.1", 0); }
            @Override public Response serve(IHTTPSession session) {
                try {
                    Map<String,String> first = new HashMap<>(), second = new HashMap<>();
                    session.parseBody(first); session.parseBody(second);
                    check(first.equals(second), "Repeated parse changed file map");
                    callback(session.getUri());
                    return newFixedLengthResponse("ok");
                } catch (ResponseException e) { return newFixedLengthResponse(e.getStatus(), MIME_PLAINTEXT, e.getMessage()); }
                catch (IOException e) { return newFixedLengthResponse(Response.Status.INTERNAL_ERROR, MIME_PLAINTEXT, e.getMessage()); }
            }
            Result wire(String wire) throws Exception {
                Result result = new Result();
                List<String> names = new ArrayList<>();
                DefaultTempFileManager manager = new DefaultTempFileManager() {
                    @Override public void clear() { super.clear(); if (failCleanup) throw new IllegalStateException("simulated cleanup failure"); }
                    @Override public TempFile createTempFile(String hint) throws Exception {
                        TempFile file = super.createTempFile(hint); result.created++; names.add(file.getName()); return file;
                    }
                };
                ByteArrayOutputStream response = new ByteArrayOutputStream();
                InputStream wireInput = new ByteArrayInputStream(wire.getBytes(StandardCharsets.UTF_8)) {
                    boolean closed;
                    @Override public synchronized int read(byte[] b, int off, int len) { return closed ? -1 : super.read(b,off,len); }
                    @Override public synchronized int read() { return closed ? -1 : super.read(); }
                    @Override public void close() { closed = true; }
                };
                boolean[] outputClosed = {false};
                OutputStream out = new OutputStream() {
                    public void write(int b) throws IOException { if (failResponse) throw new IOException("response failure"); response.write(b); }
                    public void close() throws IOException { outputClosed[0] = true; wireInput.close(); }
                };
                HTTPSession session = new HTTPSession(manager, wireInput, out);
                try { while (!outputClosed[0]) session.execute(); }
                catch (java.net.SocketException closed) {}
                catch (Exception e) { result.failure = e; }
                finally {
                    result.response = response.toString(StandardCharsets.UTF_8);
                    for (String name : names) check(!new File(name).exists(), "Temporary file retained: " + name);
                }
                return result;
            }
        }
        @Override Result execute(String wire) throws Exception { return server.wire(wire); }
    }
    static class Nwu2Fixture extends Fixture {
        final Server server = new Server();
        class Server extends com.nwu2.httpd.NanoHTTPD {
            Server() { super("127.0.0.1", 0); }
            @Override public Response serve(IHTTPSession session) {
                try {
                    Map<String,String> first = new HashMap<>(), second = new HashMap<>();
                    session.parseBody(first); session.parseBody(second);
                    check(first.equals(second), "Repeated parse changed file map");
                    callback(session.getUri());
                    return newFixedLengthResponse("ok");
                } catch (ResponseException e) { return newFixedLengthResponse(e.getStatus(), MIME_PLAINTEXT, e.getMessage()); }
                catch (IOException e) { return newFixedLengthResponse(Response.Status.INTERNAL_ERROR, MIME_PLAINTEXT, e.getMessage()); }
            }
            Result wire(String wire) throws Exception {
                Result result = new Result();
                List<String> names = new ArrayList<>();
                DefaultTempFileManager manager = new DefaultTempFileManager() {
                    @Override public void clear() { super.clear(); if (failCleanup) throw new IllegalStateException("simulated cleanup failure"); }
                    @Override public TempFile createTempFile(String hint) throws Exception {
                        TempFile file = super.createTempFile(hint); result.created++; names.add(file.getName()); return file;
                    }
                };
                ByteArrayOutputStream response = new ByteArrayOutputStream();
                InputStream wireInput = new ByteArrayInputStream(wire.getBytes(StandardCharsets.UTF_8)) {
                    boolean closed;
                    @Override public synchronized int read(byte[] b, int off, int len) { return closed ? -1 : super.read(b,off,len); }
                    @Override public synchronized int read() { return closed ? -1 : super.read(); }
                    @Override public void close() { closed = true; }
                };
                boolean[] outputClosed = {false};
                OutputStream out = new OutputStream() {
                    public void write(int b) throws IOException { if (failResponse) throw new IOException("response failure"); response.write(b); }
                    public void close() throws IOException { outputClosed[0] = true; wireInput.close(); }
                };
                HTTPSession session = new HTTPSession(manager, wireInput, out);
                try { while (!outputClosed[0]) session.execute(); }
                catch (java.net.SocketException closed) {}
                catch (Exception e) { result.failure = e; }
                finally {
                    result.response = response.toString(StandardCharsets.UTF_8);
                    for (String name : names) check(!new File(name).exists(), "Temporary file retained: " + name);
                }
                return result;
            }
        }
        @Override Result execute(String wire) throws Exception { return server.wire(wire); }
    }
    public static void main(String[] args) throws Exception {
        Map<String,String> previous = new HashMap<>();
        for (String name : new String[]{"maxBodyBytes","maxBufferedBytes","maxMultipartParts"}) previous.put(name,System.getProperty("openaf.http.nano."+name));
        System.setProperty("openaf.http.nano.maxBodyBytes","2048");
        System.setProperty("openaf.http.nano.maxBufferedBytes","8192");
        System.clearProperty("openaf.http.nano.maxMultipartParts");
        ExecutorService workers = Executors.newFixedThreadPool(2);
        CountDownLatch release = new CountDownLatch(1);
        try {
            Fixture first = new NwuFixture(), second = new Nwu2Fixture();
            if (args.length > 0) { test(args[0].equals("nwu") ? first : second); return; }
            test(first); test(second);
            String pipelined = "POST / HTTP/1.1\r\nHost: localhost\r\nConnection: keep-alive\r\nContent-Length: 1\r\n\r\nx" + request("POST","/","Content-Length: 1\r\n","x");
            for (Fixture f : new Fixture[]{first,second}) {
                String response = f.execute(pipelined).response;
                check(response.split("HTTP/1.1 200 ",-1).length == 3,"Keep-alive state did not reset");
            }
            CountDownLatch entered = new CountDownLatch(2);
            first.entered=second.entered=entered; first.release=second.release=release;
            String held = request("POST","/hold","Content-Length: 2048\r\n","x".repeat(2048));
            Future<Result> one=workers.submit(() -> first.execute(held)), two=workers.submit(() -> second.execute(held));
            check(entered.await(5,TimeUnit.SECONDS),"Both parsers did not reserve bodies");
            check(reserved()==8192,"Shared aggregate reservation missing");
            Result denied=first.execute(request("POST","/","Content-Length: 1\r\n","x"));
            status(denied,503); check(denied.created==0,"Aggregate rejection created a temporary file");
            release.countDown(); status(one.get(5,TimeUnit.SECONDS),200); status(two.get(5,TimeUnit.SECONDS),200);
            check(reserved()==0,"Aggregate budget did not recover");
            status(second.execute(request("POST","/","Content-Length: 1\r\n","x")),200);
            for (Fixture f : new Fixture[]{first,second}) {
                long before = reserved();
                f.failCleanup = true;
                Result failed = f.execute(request("POST","/","Content-Length: 1024\r\n","x".repeat(1024)));
                f.failCleanup = false;
                check(failed.failure instanceof IllegalStateException, "Cleanup failure was hidden");
                check(reserved() == before + 2048, "Cleanup failure released charged storage");
            }
            System.out.println("Both NanoHTTPD parsers: limits, framing, multipart, cleanup, repeat/keepalive and shared aggregate recovery PASS");
        } finally {
            release.countDown(); workers.shutdownNow(); workers.awaitTermination(5,TimeUnit.SECONDS);
            previous.forEach((name,value) -> { if(value==null)System.clearProperty("openaf.http.nano."+name);else System.setProperty("openaf.http.nano."+name,value); });
        }
    }
}
