import java.io.*;
import java.net.*;
import java.net.http.*;
import java.time.Duration;
import java.lang.reflect.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import org.mozilla.javascript.*;
import openaf.AFCmdBase;
import openaf.plugins.HTTPServer;
import openaf.rhino.RhinoEngine;

/** Standalone loopback regression. Requires permission to bind/connect local sockets. */
public class JavaHttpBodyLimitTest {
    static void check(boolean ok, String message) { if (!ok) throw new AssertionError(message); }
    static HttpResponse<String> post(HttpClient client, String uri, int size, boolean chunked) throws Exception {
        byte[] body = new byte[size]; java.util.Arrays.fill(body, (byte) 'x');
        HttpRequest.BodyPublisher publisher = chunked ? HttpRequest.BodyPublishers.ofInputStream(() -> new ByteArrayInputStream(body)) : HttpRequest.BodyPublishers.ofByteArray(body);
        return client.send(HttpRequest.newBuilder(URI.create(uri)).timeout(Duration.ofSeconds(5)).POST(publisher).build(), HttpResponse.BodyHandlers.ofString());
    }
    public static void main(String[] args) throws Exception {
        String previous = System.getProperty("openaf.http.java.maxBodyBytes");
        System.setProperty("openaf.http.java.maxBodyBytes", "16");
        AFCmdBase.jse = new RhinoEngine(); AFCmdBase.jse.start(-1);
        HTTPServer server = new HTTPServer();
        AtomicInteger calls = new AtomicInteger();
        server.newHTTPd(0, "127.0.0.1", null, null, null, null, 5000, "java");
        try (HttpClient client = HttpClient.newHttpClient()) {
            server.add("/custom", new BaseFunction() {
                @Override public Object call(Context cx, Scriptable scope, Scriptable self, Object[] args) {
                    calls.incrementAndGet();
                    Scriptable request = (Scriptable) args[0];
                    Object bytes = request.get("bytes", request), data = request.get("data", request);
                    if (bytes instanceof byte[]) check(((byte[]) bytes).length == data.toString().length(), "Request body representation changed");
                    return "ok";
                }
            });
            server.setDefault("/custom"); server.addEcho("/echo");
            String root = "http://127.0.0.1:" + server.getPort();
            for (String path : new String[]{"/custom", "/echo", "/fallback"}) {
                for (boolean chunked : new boolean[]{false, true}) {
                    check(post(client, root + path, 0, chunked).statusCode() == 200, "Empty body rejected");
                    check(post(client, root + path, 15, chunked).statusCode() == 200, "Small body rejected");
                    check(post(client, root + path, 16, chunked).statusCode() == 200, "Exact limit rejected");
                    int before = calls.get();
                    check(post(client, root + path, 17, chunked).statusCode() == 413, "Oversized body accepted: " + path + " chunked=" + chunked);
                    check(calls.get() == before, "Callback ran after rejection");
                }
            }
            // A declared oversize request must get 413 without uploading any body.
            try (Socket socket = new Socket("127.0.0.1", server.getPort())) {
                socket.setSoTimeout(3000);
                socket.getOutputStream().write(("POST /custom HTTP/1.1\r\nHost: localhost\r\nContent-Length: 1000000000\r\nConnection: close\r\n\r\n").getBytes(java.nio.charset.StandardCharsets.US_ASCII));
                String status = new BufferedReader(new InputStreamReader(socket.getInputStream())).readLine();
                check(status != null && status.contains(" 413 "), "Declared oversize waited for payload");
            }
            // An unfinished large chunk must receive 413 after the first excess byte.
            try (Socket socket = new Socket("127.0.0.1", server.getPort())) {
                socket.setSoTimeout(3000);
                socket.getOutputStream().write(("POST /custom HTTP/1.1\r\nHost: localhost\r\nTransfer-Encoding: chunked\r\nConnection: close\r\n\r\n3b9aca00\r\n" + "x".repeat(17)).getBytes(java.nio.charset.StandardCharsets.US_ASCII));
                String status = new BufferedReader(new InputStreamReader(socket.getInputStream())).readLine();
                check(status != null && status.contains(" 413 "), "Oversized chunk was drained before rejection");
            }
            server.setMaxRequestBodySize(32);
            check(post(client, root + "/custom", 32, true).statusCode() == 200, "Explicit larger limit failed");
            for (int limit : new int[]{0, -1}) {
                try { server.setMaxRequestBodySize(limit); throw new AssertionError("Invalid limit accepted"); }
                catch (IllegalArgumentException expected) {}
            }
            check(post(client, root + "/custom", 1, false).statusCode() == 200, "Listener failed to recover");
        } finally {
            server.stop();
            if (previous == null) System.clearProperty("openaf.http.java.maxBodyBytes"); else System.setProperty("openaf.http.java.maxBodyBytes", previous);
        }
        Field field = HTTPServer.class.getDeclaredField("javaExecutor"); field.setAccessible(true);
        ThreadPoolExecutor owned = (ThreadPoolExecutor) field.get(server);
        check(owned.isShutdown() && owned.awaitTermination(5, TimeUnit.SECONDS), "Owned executor leaked after stop");
        check(owned.getMaximumPoolSize() == 8 && owned.getQueue().remainingCapacity() == 64, "Default executor unbounded");
        server.stop();
        String oldWorkers = System.getProperty("openaf.http.java.maxWorkers"), oldQueue = System.getProperty("openaf.http.java.maxQueuedRequests");
        System.setProperty("openaf.http.java.maxWorkers", "1"); System.setProperty("openaf.http.java.maxQueuedRequests", "1");
        Method factory = HTTPServer.class.getDeclaredMethod("newJavaExecutor"); factory.setAccessible(true);
        ThreadPoolExecutor bounded = (ThreadPoolExecutor) factory.invoke(null);
        CountDownLatch entered = new CountDownLatch(1), release = new CountDownLatch(1);
        try {
            bounded.execute(() -> { entered.countDown(); try { release.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } });
            check(entered.await(5, TimeUnit.SECONDS), "Worker not started");
            bounded.execute(() -> {});
            try { bounded.execute(() -> {}); throw new AssertionError("Overload not rejected"); } catch (RejectedExecutionException expected) {}
            check(bounded.getLargestPoolSize() == 1 && bounded.getQueue().size() == 1, "Executor exceeded bounds");
            HTTPServer live = new HTTPServer();
            CountDownLatch liveEntered = new CountDownLatch(1), liveRelease = new CountDownLatch(1);
            live.newHTTPd(0, "127.0.0.1", null, null, null, null, 5000, "java");
            try (HttpClient liveClient = HttpClient.newHttpClient()) {
                try {
                live.add("/blocked", new BaseFunction() {
                    @Override public Object call(Context cx, Scriptable scope, Scriptable self, Object[] args) {
                        liveEntered.countDown();
                        try { liveRelease.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                        return "ok";
                    }
                });
                live.addEcho("/echo");
                String root = "http://127.0.0.1:" + live.getPort();
                HttpRequest request = HttpRequest.newBuilder(URI.create(root + "/blocked")).timeout(Duration.ofSeconds(5)).build();
                var first = liveClient.sendAsync(request, HttpResponse.BodyHandlers.ofString());
                check(liveEntered.await(5, TimeUnit.SECONDS), "Live worker did not start");
                var second = liveClient.sendAsync(request, HttpResponse.BodyHandlers.ofString());
                ThreadPoolExecutor pool = (ThreadPoolExecutor) field.get(live);
                long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(5);
                while (pool.getQueue().isEmpty() && System.nanoTime() < deadline) Thread.sleep(10);
                check(pool.getQueue().size() == 1, "Live request did not fill queue");
                try (Socket excess = new Socket("127.0.0.1", live.getPort())) {
                    excess.setSoTimeout(500);
                    excess.getOutputStream().write("GET /echo HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n".getBytes(java.nio.charset.StandardCharsets.US_ASCII));
                    try { excess.getInputStream().read(); } catch (IOException overload) { /* Rejection need not be an HTTP response. */ }
                    check(pool.getLargestPoolSize() == 1 && pool.getQueue().size() == 1, "Live listener exceeded worker/queue bounds");
                }
                liveRelease.countDown();
                check(first.get(5, TimeUnit.SECONDS).statusCode() == 200 && second.get(5, TimeUnit.SECONDS).statusCode() == 200, "Queued requests failed to recover");
                check(post(liveClient, root + "/echo", 1, false).statusCode() == 200, "Listener did not recover after overload");
                } finally { liveRelease.countDown(); }
            } finally { liveRelease.countDown(); live.stop(); }
        } finally {
            release.countDown(); bounded.shutdownNow(); bounded.awaitTermination(5, TimeUnit.SECONDS);
            if (oldWorkers == null) System.clearProperty("openaf.http.java.maxWorkers"); else System.setProperty("openaf.http.java.maxWorkers", oldWorkers);
            if (oldQueue == null) System.clearProperty("openaf.http.java.maxQueuedRequests"); else System.setProperty("openaf.http.java.maxQueuedRequests", oldQueue);
        }
        System.out.println("Java HTTP body limits, routes, recovery and worker bounds PASS");
    }
}
