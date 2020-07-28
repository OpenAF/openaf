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
import java.lang.String;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeFunction;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;

import openaf.AFCmdBase;
import openaf.SimpleLog;

/**
 * Core Threads plugin
 * 
 * @author Nuno Aguiar
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
	
	/**
	 * Callback support
	 *
	 */
	public class ScriptFunction implements Callable<Boolean>, Runnable {
		protected NativeFunction aFunction;
		protected Context cx;
		protected UUID uuid;
		
		/**
		 * Build with aFunction
		 * 
		 * @param aFunction
		 */
		public ScriptFunction(UUID uuid, NativeFunction aFunction) {
			this.aFunction = aFunction;
			this.uuid = uuid;
		}

		@Override
		public Boolean call() throws Exception {
			cx = (Context) AFCmdBase.jse.enterContext();
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
	public void addOpenAFShutdownHook(final NativeFunction aFunction) {
		Runtime.getRuntime().addShutdownHook(new Thread(new Runnable() {
			public void run() {
				try {
					Context cx = (Context) AFCmdBase.jse.enterContext();
					aFunction.call(cx, (Scriptable) AFCmdBase.jse.getGlobalscope(), cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope()), new Object[]{ });
				} catch (Exception e) {
					throw e;
				} finally {
					AFCmdBase.jse.exitContext();
				}
			}
		}));
	}
	
	/**
	 * <odoc>
	 * <key>Threads.addThread(aFunction) : String</key>
	 * Add a thread to call aFunction as callback. Returns an UUID associated with the thread. The aFunction will receive
	 * the corresponding UUID as the first parameter.
	 * </odoc>
	 */
	@JSFunction
	public String addThread(NativeFunction aFunction) {
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
	 * Uses a thread pool situable for scheduled threads where you can specify the numberOfThreads to use (by defauly the number of cores).
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
	 * Uses a thread pool situable for fixed threads where you can specify the numberOfThreads to use (by defauly the number of cores).
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
	 * Uses a thread pool situable for single threads where you can specify the numberOfThreads to use (by defauly the number of cores).
	 * Note: it ignores any previous thread added using addThread; It won't work if any of the other start* or init* methods has been used.
	 * </odoc>
	 */
	@JSFunction
	public void initSingleThreadPool() {
		if (executor == null) {
			executor = Executors.newSingleThreadExecutor();
		}
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
	public String addScheduleThread(NativeFunction aFunction, double delay) {
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
	public String addCachedThread(NativeFunction aFunction) {
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
	public String addFixedThread(NativeFunction aFunction) throws Exception {
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
	public String addSingleThread(NativeFunction aFunction) {
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
	public String addScheduleThreadAtFixedRate(NativeFunction aFunction, double time) {
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
	public String addScheduleThreadWithFixedDelay(NativeFunction aFunction, double time) {
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
	public void sync(NativeFunction aFunction) {
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
