import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Path;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import openaf.AFBase;
import openaf.AFCmdBase;
import openaf.rhino.RhinoEngine;
import org.mozilla.javascript.BaseFunction;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.Scriptable;

/** Run with compiled checkout classes, openaf.jar and lib/* on the classpath. */
public class ShellProcessTest {
    private static final int SIZE = 1024 * 1024;

    private static NativeArray command(String mode) {
        return new NativeArray(new Object[] {
            Path.of(System.getProperty("java.home"), "bin", "java").toString(),
            "-cp", System.getProperty("java.class.path"), ShellProcessTest.class.getName(), "child", mode
        });
    }

    private static Scriptable run(String mode, String input, Object timeout, Object callback, boolean dontWait, Object exitCallback)
            throws Exception {
        return (Scriptable) new AFBase().sh(command(mode), input, timeout, false, null, true,
                callback, "UTF-8", dontWait, null, exitCallback);
    }

    private static Object value(Scriptable result, String key) {
        return result.get(key, result);
    }

    private static void check(boolean condition, String message) {
        if (!condition) throw new AssertionError(message);
    }

    private static void child(String mode) throws Exception {
        switch (mode) {
            case "stderr":
                System.err.print("e".repeat(SIZE));
                System.err.flush();
                System.out.print("done");
                break;
            case "duplex":
                System.out.print("o".repeat(SIZE));
                System.out.flush();
                System.out.print(System.in.readAllBytes().length);
                break;
            case "input":
                System.out.print(System.in.readAllBytes().length);
                break;
            case "sleep":
                Thread.sleep(30000);
                break;
            case "short":
                Thread.sleep(800);
                break;
            default:
                throw new IllegalArgumentException(mode);
        }
    }

    public static void main(String[] args) throws Exception {
        if (args.length > 0 && "child".equals(args[0])) {
            child(args[1]);
            return;
        }
        AFCmdBase.jse = new RhinoEngine();
        AFCmdBase.jse.start(-1);
        System.out.println("AFBase loaded from " + AFBase.class.getProtectionDomain().getCodeSource().getLocation());
        Scriptable result = run("stderr", null, 5000, null, false, null);
        check("done".equals(value(result, "stdout")), "stderr pressure lost stdout");
        check(((String) value(result, "stderr")).length() == SIZE, "stderr pressure lost stderr");
        check(((Number) value(result, "exitcode")).intValue() == 0, "stderr pressure killed successful child");

        result = run("duplex", "i".repeat(SIZE), 5000, null, false, null);
        check(((String) value(result, "stdout")).equals("o".repeat(SIZE) + SIZE), "duplex copy changed output or input");
        check(((Number) value(result, "exitcode")).intValue() == 0, "duplex child failed");
        result = run("input", null, 5000, null, false, null);
        check("0".equals(value(result, "stdout")), "unsupplied stdin was not closed");

        long started = System.nanoTime();
        result = run("sleep", "i".repeat(SIZE), 250, null, false, null);
        check(TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - started) < 4000, "stdin write bypassed timeout");
        check(((Number) value(result, "exitcode")).intValue() != 0, "timeout did not stop child");

        AtomicBoolean callbackCalled = new AtomicBoolean();
        AtomicBoolean callbackContent = new AtomicBoolean();
        result = run("input", null, 5000, new BaseFunction() {
            @Override public Object call(Context cx, Scriptable scope, Scriptable self, Object[] streams) {
                try {
                    callbackCalled.set(true);
                    OutputStream input = (OutputStream) streams[2];
                    input.write(new byte[] {1, 2, 3});
                    input.close();
                    callbackContent.set(new String(((InputStream) streams[0]).readAllBytes()).equals("3"));
                    return null;
                } catch (Exception e) { throw new RuntimeException(e); }
            }
        }, false, null);
        check(callbackCalled.get() && callbackContent.get(), "stream callback input/output ownership changed");
        check("".equals(value(result, "stdout")), "callback-consumed output was captured twice");

        result = (Scriptable) new AFBase().sh(command("short"), null, 5000, true, null, true,
                null, null, false, null, null);
        check(((Number) value(result, "exitcode")).intValue() == 0, "inheritIO child failed");
        check("".equals(value(result, "stdout")) && "".equals(value(result, "stderr")), "inheritIO captured output");
        Object text = new AFBase().sh(command("stderr"), null, 5000, false, null, false,
                null, null, false, null, null);
        Scriptable globals = (Scriptable) AFCmdBase.jse.getGlobalscope();
        check("done".equals(text), "String return contract changed");
        check(((String) globals.get("__stderr", globals)).length() == SIZE, "global stderr contract changed");
        check(((Number) globals.get("__exitcode", globals)).intValue() == 0, "global exit status changed");

        AtomicBoolean exitCalled = new AtomicBoolean();
        result = run("sleep", null, null, null, false, new BaseFunction() {
            @Override public Object call(Context cx, Scriptable scope, Scriptable self, Object[] process) {
                exitCalled.set(true);
                return "force";
            }
        });
        check(exitCalled.get() && ((Number) value(result, "exitcode")).intValue() != 0, "exit callback cancellation changed");

        started = System.nanoTime();
        result = run("short", null, null, null, true, null);
        check(TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - started) < 600, "dontWait waited for completion");
        check(((Number) value(result, "exitcode")).intValue() == -1, "dontWait exit status changed");
        check("".equals(value(result, "stdout")) && "".equals(value(result, "stderr")), "dontWait output changed");

        CountDownLatch entered = new CountDownLatch(1);
        AtomicBoolean interrupted = new AtomicBoolean();
        Thread caller = new Thread(() -> {
            AFCmdBase.jse.enterContext();
            try {
                entered.countDown();
                run("sleep", null, null, null, false, null);
            } catch (InterruptedException expected) {
                interrupted.set(true);
            } catch (Exception e) {
                throw new RuntimeException(e);
            } finally {
                AFCmdBase.jse.exitContext();
            }
        });
        caller.start();
        check(entered.await(2, TimeUnit.SECONDS), "cancellation fixture did not start");
        Thread.sleep(150);
        caller.interrupt();
        caller.join(4000);
        check(!caller.isAlive() && interrupted.get(), "interruption did not cancel shell wait");
        Thread.sleep(1000);
        check(ProcessHandle.current().children().noneMatch(ProcessHandle::isAlive), "shell test left a child running");
        System.out.println("PASS shell pipe pressure, duplex input, EOF, timeout, callbacks, dontWait and interruption");
    }
}
