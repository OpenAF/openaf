package wedo.openaf.plugins;

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

import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeFunction;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;

import wedo.openaf.AFCmdBase;
import wedo.openaf.SimpleLog;

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
	 * </odoc>
	 */
	@JSFunction
	public void start() throws InterruptedException {
		executor = Executors.newCachedThreadPool();
		executor.invokeAll(threads);
	}
	
	/**
	 * <odoc>
	 * <key>Threads.startNoWait()</key>
	 * Start normally all threads added. Will not wait for the end of the execution of all threads.
	 * See Threads.waitForThreads for waiting for the execution of threads when needed or, in alternative,
	 * to Threads.start.
	 * </odoc>
	 */
	@JSFunction
	public void startNoWait() throws InterruptedException, ExecutionException {
		executor = Executors.newCachedThreadPool();
		for(Runnable c : threads) {
			executor.execute(c);
		}
	}
	
	/**
	 * <odoc>
	 * <key>Threads.startAtFixedRate(aTime)</key>
	 * Start all threads and restarts them at a fixed rate determined by aTime (in ms) independently of the time
	 * when the thread execution ends. Execution will stop upon Threads.stop. 
	 * </odoc>
	 */
	@JSFunction
	public void startAtFixedRate(double time) {
		executor = Executors.newScheduledThreadPool(threads.size());
		for(Runnable c : threads) {
			((ScheduledExecutorService) executor).scheduleAtFixedRate(c, 0, (Double.valueOf(time)).longValue(), TimeUnit.MILLISECONDS);
		}
	}
	
	/**
	 * <odoc>
	 * <key>Threads.startWithFixedRate(aTime)</key>
	 * Start all threads and restarts them at a fixed rate determined by aTime (in ms) starting on the time when
	 * the thread execution ends. Execution will stop upon Threads.stop.
	 * </odoc>
	 */
	@JSFunction
	public void startWithFixedRate(double time) {
		executor = Executors.newScheduledThreadPool(threads.size());
		for(Runnable c : threads) {
			((ScheduledExecutorService) executor).scheduleWithFixedDelay(c, 0, (Double.valueOf(time)).longValue(), TimeUnit.MILLISECONDS);
		}		
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
