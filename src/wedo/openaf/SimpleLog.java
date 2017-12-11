package wedo.openaf;

import java.util.logging.Level;
import java.util.logging.Logger;

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

	/**
	 * Logs an entry with a specific log type including the exception stack trace to be displayed if the level of debug is DEBUG.
	 * 
	 * @param level The level of debug of the current log entry
	 * @param log The log message
	 * @param e The associated exception (can be null if none is available)
	 */
	public static void log(logtype level, String log, Exception e) {
		switch(currentLogLevel) {
		case DEBUG:
			System.err.println(log);
			if (e != null) e.printStackTrace();
			break;
		case ERROR:
			if (level == logtype.INFO) System.err.println(log);
			if (level == logtype.ERROR) System.err.println(log);
			break;
		case INFO:
			if (level == logtype.INFO) System.err.println(log);
			break;
		}
	}
}
