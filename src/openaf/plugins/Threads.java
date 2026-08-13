package openaf.plugins;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.lang.String;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;

import openaf.AFCmdBase;
import openaf.SimpleLog;

/**
 * Core Threads plugin
 * 
 * Copyright 2023 Nuno Aguiar
 *
 */
public class Threads extends ScriptableObject {
	/**
	 * 
	 */
	private static final long serialVersionUID = -7619794920784767023L;
	protected ExecutorService executor;
	protected List<ScriptFunction> threads;
	protected HashMap<String, Object> sessions = new HashMap<String, Object>();
	private static final AtomicLong shutdownHookSequence = new AtomicLong();
	// Registry of guarded shutdown actions, most-recently-added first, so they can be run synchronously
	// (e.g. by nativeExit) instead of only via the JVM's own (slow, sometimes ~10s-delayed) shutdown sequence.
	private static final java.util.concurrent.CopyOnWriteArrayList<Runnable> shutdownActions = new java.util.concurrent.CopyOnWriteArrayList<Runnable>();

	private static boolean isShutdownHookDebugEnabled() {
		return Boolean.parseBoolean(System.getProperty("openaf.shutdownhook.debug", "false"));
	}

	/**
	 * Registers aAction both as a normal JVM shutdown hook and in the internal registry consulted by
	 * runOpenAFShutdownHooksNow/nativeExit. A guard ensures aAction runs at most once even if both
	 * paths end up trying to run it.
	 */
	private static void registerGuardedShutdownAction(final Runnable aAction, final String aThreadName) {
		final java.util.concurrent.atomic.AtomicBoolean ran = new java.util.concurrent.atomic.AtomicBoolean(false);
		Runnable guarded = new Runnable() {
			public void run() {
				if (ran.compareAndSet(false, true)) aAction.run();
			}
		};
		shutdownActions.add(0, guarded);
		Runtime.getRuntime().addShutdownHook(new Thread(guarded, aThreadName));
	}

	/**
	 * Java-side entry point (used e.g. by IO.createTempDir) to register cleanup that should also run
	 * as part of runOpenAFShutdownHooksNow/nativeExit, not just as a raw JVM shutdown hook.
	 */
	public static void registerShutdownAction(Runnable aAction) {
		registerGuardedShutdownAction(aAction, "OpenAF-shutdown-action-" + shutdownHookSequence.incrementAndGet());
	}
	
	/**
	 * Callback support
	 *
	 */
	public class ScriptFunction implements Callable<Boolean>, Runnable {
		protected Function aFunction;
		//protected Context cx;
		protected UUID uuid;
		
		/**
		 * Build with aFunction
		 * 
		 * @param aFunction
		 */
		public ScriptFunction(UUID uuid, Function aFunction) {
			this.aFunction = aFunction;
			this.uuid = uuid;
		}

		@Override
		public Boolean call() throws Exception {
			Context cx = (Context) AFCmdBase.jse.enterContext();
			try {
				aFunction.call(cx, (Scriptable) AFCmdBase.jse.getGlobalscope(), cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope()), new Object[]{ uuid.toString() });
			} catch (Exception e) {
				//AFCmdBase.jse.exitContext();
				throw e;
			} finally {
				AFCmdBase.jse.exitContext();
			}
			return true;
		}

		@Override
		public void run() {
			try {
				call(); 
			} catch (Exception e) {
				SimpleLog.log(SimpleLog.logtype.DEBUG, "Thread exception: " + e.getMessage(), e);
			}
		}
	}
	
	@Override
	public String getClassName() {
		return "Threads";
	}

	@JSFunction
	public Object getThreads() {
		return this.threads;
	}

	@JSFunction
	public Object getExecutorService() {
		return this.executor;
	}

	/**
	 * <odoc>
	 * <key>Threads.Threads() : Threads</key>
	 * Creates a new instance of a group of threads to manage.
	 * </odoc>
	 */
	@JSConstructor
	public void newThread() {
		threads = Collections.synchronizedList(new ArrayList<ScriptFunction>(new ArrayList<ScriptFunction>()));
 	}
	
	/**
	 * <odoc>
	 * <key>Threads.getNumberOfCores() : number</key>
	 * Returns the number of cores identified by Java.
	 * </odoc>
	 */
	@JSFunction
	public int getNumberOfCores() {
		return Runtime.getRuntime().availableProcessors();
	}
	
	/**
	 * <odoc>
	 * <key>Threads.addOpenAFShutdownHook(aFunction)</key>
	 * Adds aFunction to try to execute whenever OpenAF is going to shutdown. The latest hook added will be the
	 * first to be executed until the first hook added.
	 * </odoc>
	 */
	@JSFunction
	public void addOpenAFShutdownHook(final Function aFunction) {
		final long hookId = shutdownHookSequence.incrementAndGet();
		Runnable action = new Runnable() {
			public void run() {
				final boolean debug = isShutdownHookDebugEnabled();
				final long startedAt = System.nanoTime();
				if (debug) System.err.println("[openaf shutdown hook " + hookId + "] start class=" + aFunction.getClass().getName());
				try {
					Context cx = (Context) AFCmdBase.jse.enterContext();
					aFunction.call(cx, (Scriptable) AFCmdBase.jse.getGlobalscope(), cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope()), new Object[]{ });
				} catch (Exception e) {
					if (debug) System.err.println("[openaf shutdown hook " + hookId + "] failed after " + ((System.nanoTime() - startedAt) / 1_000_000) + "ms: " + e);
					throw e;
				} finally {
					try {
						AFCmdBase.jse.exitContext();
					} finally {
						if (debug) System.err.println("[openaf shutdown hook " + hookId + "] end after " + ((System.nanoTime() - startedAt) / 1_000_000) + "ms");
					}
				}
			}
		};
		registerGuardedShutdownAction(action, "OpenAF-shutdown-hook-" + hookId);
	}

	/**
	 * <odoc>
	 * <key>Threads.runOpenAFShutdownHooksNow()</key>
	 * Synchronously runs, in the current thread, every shutdown hook/action registered so far via
	 * addOpenAFShutdownHook (and Java-side registrations such as io.createTempDir's cleanup) - in the
	 * reverse order they were added. Each one is guarded to run at most once, so it is safe to call this
	 * and still let the normal JVM shutdown sequence run afterwards (e.g. via System.exit): already-run
	 * hooks will be skipped there. Intended to be used right before Threads.nativeExit.
	 * </odoc>
	 */
	@JSFunction
	public static void runOpenAFShutdownHooksNow() {
		for (Runnable action : shutdownActions) {
			try {
				action.run();
			} catch (Throwable t) {
				// best-effort: one failing hook shouldn't block the others or the exit that follows
			}
		}
	}

	/**
	 * <odoc>
	 * <key>Threads.nativeExit(anExitCode)</key>
	 * Terminates the current process immediately at the operating system level (the C library's
	 * _exit), bypassing the JVM's own shutdown sequence entirely - including JVM-registered shutdown
	 * hook threads and the safepoint HotSpot uses to wait for JIT compiler threads, which can otherwise
	 * delay process exit by several seconds (observed up to ~10s) when a compilation is still in
	 * flight. Because JVM-level cleanup is skipped, call Threads.runOpenAFShutdownHooksNow() first for
	 * any cleanup that must still happen (this is what exit(code, true) does). Falls back to
	 * Runtime.halt (not guaranteed to avoid the delay this method exists to avoid) if the native call
	 * is unavailable on this platform.
	 * </odoc>
	 */
	@JSFunction
	public static void nativeExit(int anExitCode) {
		try {
			System.out.flush();
			System.err.flush();
		} catch (Throwable t) {
			// ignore: proceed to exit regardless
		}
		try {
			boolean windows = System.getProperty("os.name", "").toLowerCase().contains("win");
			com.sun.jna.Function exitFn = com.sun.jna.Function.getFunction(windows ? "msvcrt" : "c", "_exit");
			exitFn.invokeVoid(new Object[] { Integer.valueOf(anExitCode) });
		} catch (Throwable t) {
			Runtime.getRuntime().halt(anExitCode);
		}
	}

	/**
	 * <odoc>
	 * <key>Threads.addThread(aFunction) : String</key>
	 * Add a thread to call aFunction as callback. Returns an UUID associated with the thread. The aFunction will receive
	 * the corresponding UUID as the first parameter.
	 * </odoc>
	 */
	@JSFunction
	public String addThread(Function aFunction) {
		UUID uuid = UUID.randomUUID();
		threads.add(new ScriptFunction(uuid, aFunction));
		return uuid.toString();
	}
	
	/**
	 * <odoc>
	 * <key>Threads.start()</key>
	 * Start normally all threads added. Will wait for the end of execution of all threads.
	 * Note: it won't work if any of the other start* or init* methods has been used.
	 * </odoc>
	 */
	@JSFunction
	public void start() throws InterruptedException {
		if (executor == null) {
			executor = Executors.newCachedThreadPool();
			executor.invokeAll(threads);
		}
	}
	
	/**
	 * <odoc>
	 * <key>Threads.startNoWait()</key>
	 * Start normally all threads added. Will not wait for the end of the execution of all threads.
	 * See Threads.waitForThreads for waiting for the execution of threads when needed or, in alternative,
	 * to Threads.start. Note: it won't work if any of the other start* or init* methods has been used.
	 * </odoc>
	 */
	@JSFunction
	public void startNoWait() throws InterruptedException, ExecutionException {
		if (executor == null) {
			executor = Executors.newCachedThreadPool();
			for(Runnable c : threads) {
				executor.execute(c);
			}
		}
	}
	
	/**
	 * <odoc>
	 * <key>Threads.startAtFixedRate(aTime)</key>
	 * Start all threads and restarts them at a fixed rate determined by aTime (in ms) independently of the time
	 * when the thread execution ends. Execution will stop upon Threads.stop. 
	 * Note: it won't work if any of the other start* or init* methods has been used.
	 * </odoc>
	 */
	@JSFunction
	public void startAtFixedRate(double time) {
		if (executor == null) {
			executor = Executors.newScheduledThreadPool(threads.size());
			for(Runnable c : threads) {
				((ScheduledExecutorService) executor).scheduleAtFixedRate(c, 0, (Double.valueOf(time)).longValue(), TimeUnit.MILLISECONDS);
			}
		}
	}
	
	/**
	 * <odoc>
	 * <key>Threads.startWithFixedRate(aTime)</key>
	 * Start all threads and restarts them at a fixed rate determined by aTime (in ms) starting on the time when
	 * the thread execution ends. Execution will stop upon Threads.stop.
	 * Note: it won't work if any of the other start* or init* methods has been used.
	 * </odoc>
	 */
	@JSFunction
	public void startWithFixedRate(double time) {
		if (executor == null) {
			executor = Executors.newScheduledThreadPool(threads.size());
			for(Runnable c : threads) {
				((ScheduledExecutorService) executor).scheduleWithFixedDelay(c, 0, (Double.valueOf(time)).longValue(), TimeUnit.MILLISECONDS);
			}		
		}
	}

	/**
	 * <odoc>
	 * <key>Threads.initCachedThreadPool()</key>
	 * Uses a thread pool situable for cached threads.
	 * Note: it ignores any previous thread added using addThread; It won't work if any of the other start* or init* methods has been used.
	 * </odoc>
	 */
	@JSFunction
	public void initCachedThreadPool() {
		executor = Executors.newCachedThreadPool();
	}

	/**
	 * <odoc>
	 * <key>Threads.initScheduledThreadPool(numberOfThreads)</key>
	 * Uses a thread pool situable for scheduled threads where you can specify the numberOfThreads to use (by default the number of cores).
	 * Note: it ignores any previous thread added using addThread; It won't work if any of the other start* or init* methods has been used.
	 * </odoc>
	 */
	@JSFunction
	public void initScheduledThreadPool(int nThreads) {
		if (executor == null) {
			// Get number of cores if undefined
			if (nThreads < 1) {
				nThreads = this.getNumberOfCores();
			}

			executor = Executors.newScheduledThreadPool(nThreads);
		}	
	}

	/**
	 * <odoc>
	 * <key>Threads.initFixedThreadPool(numberOfThreads)</key>
	 * Uses a thread pool situable for fixed threads where you can specify the numberOfThreads to use (by default the number of cores).
	 * Note: it ignores any previous thread added using addThread; It won't work if any of the other start* or init* methods has been used.
	 * </odoc>
	 */
	@JSFunction
	public void initFixedThreadPool(int nThreads) {
		if (executor == null) {
			// Get number of cores if undefined
			if (nThreads < 1) {
				nThreads = this.getNumberOfCores();
			}

			executor = Executors.newFixedThreadPool(nThreads);
		}	
	}

	/**
	 * <odoc>
	 * <key>Threads.initSingleThreadPool(numberOfThreads)</key>
	 * Uses a thread pool situable for single threads where you can specify the numberOfThreads to use (by default the number of cores).
	 * Note: it ignores any previous thread added using addThread; It won't work if any of the other start* or init* methods has been used.
	 * </odoc>
	 */
	@JSFunction
	public void initSingleThreadPool() {
		if (executor == null) {
			executor = Executors.newSingleThreadExecutor();
		}
	}
	
	// Virtual threads support (Java 21)
	/**
	 * <odoc>
	 * <key>Threads.initVirtualThreadPerTaskExecutor()</key>
	 * Uses a virtual thread per task executor (Java 21).
	 * </odoc>
	 */
	@JSFunction
	public void initVirtualThreadPerTaskExecutor() {
		if (executor == null) {
			executor = Executors.newVirtualThreadPerTaskExecutor();
		}
	}

	/**
	 * <odoc>
	 * <key>Threads.addVirtualThread(aFunction) : String</key>
	 * Adds to the virtual thread executor aFunction to be executed. Returns an UUID associated with the thread.
	 * </odoc>
	 */
	@JSFunction
	public String addVirtualThread(Function aFunction) {
		if (executor == null) initVirtualThreadPerTaskExecutor();
		UUID uuid = UUID.randomUUID();
		executor.execute((Runnable) new ScriptFunction(uuid, aFunction));
		return uuid.toString();
	}

	/**
	 * <odoc>
	 * <key>Threads.addScheduleThread(aFunction, aDelay) : String</key>
	 * Adds to the scheduled thread pool aFunction to be executed within aDelay in ms. Returns an UUID associated with the thread. The aFunction will receive
	 * the corresponding UUID as the first parameter. Note: it calls initScheduledThreadPool if it wasn't previously and it won't work if any of the other
	 * start* or init* methods has been used previously.
	 * </odoc>
	 */
	@JSFunction
	public String addScheduleThread(Function aFunction, double delay) {
		if (executor == null) initScheduledThreadPool(this.getNumberOfCores());

		UUID uuid = UUID.randomUUID();
		((ScheduledExecutorService) executor).schedule((Runnable) new ScriptFunction(uuid, aFunction), (Double.valueOf(delay)).longValue(), TimeUnit.MILLISECONDS);
		return uuid.toString();
	}

	/**
	 * <odoc>
	 * <key>Threads.addCachedThread(aFunction) : String</key>
	 * Adds to the cached thread pool aFunction to be executed. Returns an UUID associated with the thread. The aFunction will receive
	 * the corresponding UUID as the first parameter. Note: it calls initCachedThreadPool if it wasn't previously and it won't work if any of the other
	 * start* of init* methods has been used previously.
	 * </odoc>
	 */
	@JSFunction
	public String addCachedThread(Function aFunction) {
		if (executor == null) initCachedThreadPool();

		UUID uuid = UUID.randomUUID();
		executor.execute((Runnable) new ScriptFunction(uuid, aFunction));
		return uuid.toString();	
	}

	/**
	 * <odoc>
	 * <key>Threads.addFixedThread(aFunction) : String</key>
	 * Adds to the fixed thread pool aFunction to be executed. Returns an UUID associated with the thread. The aFunction will receive
	 * the corresponding UUID as the first parameter. Note: it calls initFixedThreadPool if it wasn't previously and it won't work if any of the other
	 * start* of init* methods has been used previously.
	 * </odoc>
	 */
	@JSFunction
	public String addFixedThread(Function aFunction) throws Exception {
		if (executor == null) throw new Exception("Please use initFixedThreadPool first.");

		UUID uuid = UUID.randomUUID();
		executor.execute((Runnable) new ScriptFunction(uuid, aFunction));
		return uuid.toString();	
	}

	/**
	 * <odoc>
	 * <key>Threads.addSingleThread(aFunction) : String</key>
	 * Adds to the single thread pool aFunction to be executed. Returns an UUID associated with the thread. The aFunction will receive
	 * the corresponding UUID as the first parameter. Note: it calls initSingleThreadPool if it wasn't previously and it won't work if any of the other
	 * start* of init* methods has been used previously.
	 * </odoc>
	 */
	@JSFunction
	public String addSingleThread(Function aFunction) {
		if (executor == null) initSingleThreadPool();

		UUID uuid = UUID.randomUUID();
		executor.execute((Runnable) new ScriptFunction(uuid, aFunction));
		return uuid.toString();	
	}

	/**
	 * <odoc>
	 * <key>Threads.addScheduleThreadAtFixedRate(aFunction, aRate) : String</key>
	 * Adds to the scheduled thread pool aFunction to be executed at a fixed aRate in ms. Returns an UUID associated with the thread. The aFunction will receive
	 * the corresponding UUID as the first parameter. Note: it calls initScheduledThreadPool if it wasn't previously and it won't work if any of the other
	 * start* or init* methods has been used previously.
	 * </odoc>
	 */
	@JSFunction
	public String addScheduleThreadAtFixedRate(Function aFunction, double time) {
		if (executor == null) initScheduledThreadPool(this.getNumberOfCores());

		UUID uuid = UUID.randomUUID();
		((ScheduledExecutorService) executor).scheduleAtFixedRate((Runnable) new ScriptFunction(uuid, aFunction), 0, (Double.valueOf(time)).longValue(), TimeUnit.MILLISECONDS);
		return uuid.toString();
	}

	/**
	 * <odoc>
	 * <key>Threads.addScheduleThreadWithFixedDelay(aFunction, aDelay) : String</key>
	 * Adds to the scheduled thread pool aFunction to be executed at a fixed aDelay in ms. Returns an UUID associated with the thread. The aFunction will receive
	 * the corresponding UUID as the first parameter. Note: it calls initScheduledThreadPool if it wasn't previously and it won't work if any of the other
	 * start* or init* methods has been used previously.
	 * </odoc>
	 */
	@JSFunction
	public String addScheduleThreadWithFixedDelay(Function aFunction, double time) {
		if (executor == null) initScheduledThreadPool(this.getNumberOfCores());

		UUID uuid = UUID.randomUUID();
		((ScheduledExecutorService) executor).scheduleWithFixedDelay((Runnable) new ScriptFunction(uuid, aFunction), 0, (Double.valueOf(time)).longValue(), TimeUnit.MILLISECONDS);
		return uuid.toString();
	}
	
	/**
	 * <odoc>
	 * <key>Threads.stop(shouldForce)</key>
	 * Stop all thread execution. If all threads need to be stopped immediately without waiting for the end of thread execution
	 * then used shouldForce = true.
	 * </odoc>
	 */
	@JSFunction
	public void stop(boolean force) {
		if (executor != null)
			if (force) { 
				executor.shutdownNow();
			} else {
				executor.shutdown();
			}
	}
	
	/**
	 * <odoc>
	 * <key>Threads.waitForThreads(aTimeout) : boolean</key>
	 * Waits for all threads to finish during aTimeout period (in ms). Returns true if all threads stopped or
	 * false otherwise.
	 * </odoc>
	 */
	@JSFunction
	public boolean waitForThreads(double timeout) throws InterruptedException {
		if (executor != null)
			return executor.awaitTermination(Double.valueOf(timeout).longValue(), TimeUnit.MILLISECONDS);
		else
			return false;
	}
	
	/**
	 * <odoc>
	 * <key>Threads.sync(aFunction)</key>
	 * Try to execute the aFunction in a synchronized method. Useful in parallel processing to safely access variables/resources
	 * shared between threads.
	 * </odoc>
	 */
	@JSFunction
	public void sync(Function aFunction) {
	    if (executor == null) return;
	    
		synchronized(executor) {
			Context cx = (Context) AFCmdBase.jse.enterContext();
			try {
				aFunction.call(cx, (Scriptable) AFCmdBase.jse.getGlobalscope(), cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope()), new Object[]{});
			} catch(Exception e) {
				//AFCmdBase.jse.exitContext();
				throw e;
			} finally {
				AFCmdBase.jse.exitContext();
			}
		}
	}
}
