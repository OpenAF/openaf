package openaf;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/** Local oJob language processes. No Rhino calls are made from worker threads. */
public final class OJobLanguageProcess {
    private OJobLanguageProcess() { }

    // How long to keep draining stdout/stderr after the process exited (see run)
    private static final long DRAIN_GRACE_MS = 2000;

    private static Thread drain(InputStream input, ByteArrayOutputStream output) {
        Thread thread = new Thread(() -> {
            try (InputStream stream = input) {
                byte[] buffer = new byte[8192];
                int count;
                while ((count = stream.read(buffer)) != -1) output.write(buffer, 0, count);
            } catch (IOException ignored) {
                // Termination closes the pipes; captured output remains available.
            }
        }, "oJob-language-output");
        thread.setDaemon(true);
        thread.start();
        return thread;
    }

    private static boolean track(Process process, Map<Long, ProcessHandle> descendants) {
        try {
            process.descendants().forEach(p -> descendants.put(p.pid(), p));
            return true;
        } catch (RuntimeException e) {
            // Some containers/sandboxes deny OS process enumeration.
            return false;
        }
    }

    private static void terminate(Process process, Map<Long, ProcessHandle> descendants) {
        track(process, descendants);
        List<ProcessHandle> children = new ArrayList<>(descendants.values());
        for (int i = children.size() - 1; i >= 0; i--) children.get(i).destroyForcibly();
        process.destroyForcibly();
    }

    /** Request: command string array, optional env map, cwd and timeout milliseconds. */
    public static String run(String request) throws IOException, InterruptedException {
        JsonObject options = new Gson().fromJson(request, JsonObject.class);
        List<String> command = new ArrayList<>();
        options.getAsJsonArray("command").forEach(v -> command.add(v.getAsString()));
        if (command.isEmpty()) throw new IllegalArgumentException("Language command is empty");
        ProcessBuilder builder = new ProcessBuilder(command);
        if (options.has("cwd")) builder.directory(Path.of(options.get("cwd").getAsString()).toFile());
        if (options.has("env")) options.getAsJsonObject("env").entrySet().forEach(e ->
            builder.environment().put(e.getKey(), e.getValue().getAsString()));
        long timeout = options.has("timeout") ? options.get("timeout").getAsLong() : 0;
        if (timeout < 0) throw new IllegalArgumentException("Language timeout must be positive");
        long start = System.nanoTime();
        Process process = builder.start();
        process.getOutputStream().close();
        ByteArrayOutputStream stdout = new ByteArrayOutputStream();
        ByteArrayOutputStream stderr = new ByteArrayOutputStream();
        Thread out = drain(process.getInputStream(), stdout);
        Thread err = drain(process.getErrorStream(), stderr);
        Map<Long, ProcessHandle> descendants = new LinkedHashMap<>();
        boolean timedOut = false;
        boolean descendantTracking = true;
        long lastTrack = 0, exitedAt = 0;
        try {
            while (process.isAlive() || out.isAlive() || err.isAlive()) {
                long nowNs = System.nanoTime();
                // Enumerating OS processes is expensive: refresh the descendants snapshot at most every 100ms
                if (process.isAlive() && nowNs - lastTrack >= TimeUnit.MILLISECONDS.toNanos(100)) {
                    descendantTracking &= track(process, descendants);
                    lastTrack = nowNs;
                }
                if (!process.isAlive()) {
                    // A detached grandchild that inherited stdout/stderr keeps the pipes (and drain threads) open
                    // after the process itself exited: don't wait for it beyond a short grace period
                    if (exitedAt == 0) exitedAt = nowNs;
                    if (nowNs - exitedAt >= TimeUnit.MILLISECONDS.toNanos(DRAIN_GRACE_MS)) break;
                } else if (timeout > 0 && TimeUnit.NANOSECONDS.toMillis(nowNs - start) >= timeout) {
                    timedOut = true;
                    terminate(process, descendants);
                    break;
                }
                Thread.sleep(10);
            }
            if (timedOut) {
                process.waitFor(2, TimeUnit.SECONDS);
                out.join(1000);
                err.join(1000);
            }
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("stdout", stdout.toString(StandardCharsets.UTF_8));
            result.put("stderr", stderr.toString(StandardCharsets.UTF_8));
            result.put("exitcode", process.isAlive() ? -1 : process.exitValue());
            result.put("timedOut", timedOut);
            result.put("descendantTracking", descendantTracking);
            return new Gson().toJson(result);
        } catch (InterruptedException e) {
            terminate(process, descendants);
            Thread.currentThread().interrupt();
            throw e;
        } finally {
            if (process.isAlive() || Thread.currentThread().isInterrupted()) terminate(process, descendants);
            process.getInputStream().close();
            process.getErrorStream().close();
        }
    }
}
