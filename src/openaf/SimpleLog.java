package openaf;

import java.util.logging.Level;
import java.util.logging.Logger;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeFunction;
import org.mozilla.javascript.Scriptable;

import java.lang.String;

/** 
 * Simple Log
 * 
 * With static methods allows for a very simple and straightforward logging 
 * 
 * @author Nuno Aguiar
 * 
 */ 
public class SimpleLog {
	public static enum logtype { INFO, ERROR, DEBUG };
	public static logtype currentLogLevel = logtype.ERROR;
	protected static boolean ready = false;
	protected static NativeFunction nFunc = null; 
	
	public static void setNFunc(NativeFunction fn) {
		nFunc = fn;
	}

	/**
	 * Initializes with a SimpleLogAppender
	 * 
	 * @see SimpleLogAppender
	 */
	public static void init() {
		//BasicConfigurator.configure(new SimpleLogAppender());
		ready = true;
	}
	
	/**
	 * Obtains the current log level
	 * 
	 * @return Returns the current log level
	 */
	public static logtype getCurrentLogLevel() {
		return currentLogLevel;
	}

	/**
	 * Sets the current log level 
	 * 
	 * @param currentLogLevel
	 */
	public static void setCurrentLogLevel(logtype currentLogLevel) {
		SimpleLog.currentLogLevel = currentLogLevel;
		switch(currentLogLevel) {
		case DEBUG: Logger.getGlobal().setLevel(Level.ALL); break;
		case ERROR: Logger.getGlobal().setLevel(Level.SEVERE); break;
		case INFO: Logger.getGlobal().setLevel(Level.INFO); break;
		}
		
	}

	protected static void _log(String aString) {
		if (nFunc == null) {
			System.err.println(aString);
		} else {
			Context cx = (Context) AFCmdBase.jse.enterContext();
			try {
				nFunc.call(cx, (Scriptable) AFCmdBase.jse.getGlobalscope(), cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope()), new Object[] { aString });
			} catch(Exception e) {
				System.err.println(e.getMessage());
			} finally {
				AFCmdBase.jse.exitContext();
			}
		}
	}

	/**
	 * Logs an entry with a specific log type including the exception stack trace to be displayed if the level of debug is DEBUG.
	 * 
	 * @param level The level of debug of the current log entry
	 * @param log The log message
	 * @param e The associated exception (can be null if none is available)
	 */
	public static void log(logtype level, String log, Exception e) {
		if (log != null && level != null) {
			switch(currentLogLevel) {
			case DEBUG:
				_log(log);
				if (e != null) e.printStackTrace();
				break;
			case ERROR:
				if (level == logtype.INFO) _log(log);
				if (level == logtype.ERROR) _log(log);
				break;
			case INFO:
				if (level == logtype.INFO) _log(log);
				break;
			}
		}
	}
}
