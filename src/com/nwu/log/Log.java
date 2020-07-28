/**       
 *	   Licensed to the Apache Software Foundation (ASF) under one
 *     or more contributor license agreements.  See the NOTICE file
 *     distributed with this work for additional information
 *     regarding copyright ownership.  The ASF licenses this file
 *     to you under the Apache License, Version 2.0 (the
 *     "License"); you may not use this file except in compliance
 *     with the License.  You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing,
 *     software distributed under the License is distributed on an
 *     "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *     KIND, either express or implied.  See the License for the
 *     specific language governing permissions and limitations
 *     under the License.
 */
package com.nwu.log;

import java.util.logging.Level;
import java.lang.String;

/**
 * General logging using log4j
 * 
 * @author Nuno Aguiar <nuno@aguiar.name>
 * 
 */
public class Log {
	/**
	 * Classifies the type of log message
	 * 
	 * @author Nuno Aguiar <nuno@aguiar.name>
	 */
	public enum Type {
		FINE, INFO, ERROR, DEBUG, OFF
	};

	/**
	 * Log4J default message pattern
	 */
	protected static String LOG_DEFAULT_PATTERN = "%d{dd MMM yyyy HH:mm:ss,SSS};[%p]; %m%n";

	protected String logName;
	//protected Logger lOG4j;
	protected java.util.logging.Logger lOG;
	protected boolean useLog4J;

	public Log(String loggerName) {
		this(loggerName, true);
	}
	
	/**
	 * Creates a instance to log for loggerName. Log4j is configured to output
	 * to console using LOG4J_DEFAULT_PATTERN. The log level is set to INFO.
	 * 
	 * @param loggerName
	 *            The log4j Logger name
	 */
	public Log(String loggerName, boolean useLog4J) {
		logName = loggerName;
		this.useLog4J = useLog4J;
		this.lOG = java.util.logging.Logger.getLogger(loggerName);
		
		/*BasicConfigurator.configure(new ConsoleAppender(new PatternLayout(
				LOG4J_DEFAULT_PATTERN)));*/

		lOG.setLevel(getOutputType2JavaLevel(Type.INFO));
	}

	/**
	 * Creates a instance to log for loggerName. Log4j is configured to output
	 * to console using LOG4J_DEFAULT_PATTERN.
	 * 
	 * @param loggerName
	 *            The log4j Logger name
	 * @param type
	 *            The log level to use
	 */
	public Log(String loggerName, Type type) {
		logName = loggerName;
		lOG = java.util.logging.Logger.getLogger(loggerName);
		
		/*BasicConfigurator.configure(new ConsoleAppender(new PatternLayout(
				LOG4J_DEFAULT_PATTERN)));*/
		
		lOG.setLevel(getOutputType2JavaLevel(type));
	}

	public Log() {
		this(true);
	}
	
	/**
	 * Creates a instance to log for loggerName without configuring Log4j
	 * Use only for overridden the default behavior
	 * 
	 * @param loggerName
	 *            The log4j Logger name
	 * @param type
	 *            The log level to use
	 */
	public Log(boolean useLog4j) {
		this.useLog4J = useLog4j;
	}
	
	/**
	 * Log a generic message.
	 * 
	 * @param type Type of message (type OFF won't actually do anything)
	 * @param message The message to log
	 */
	public void log(Type type, String message) {
		switch (type) {
		case DEBUG:
			lOG.log(java.util.logging.Level.WARNING, message);
			break;
		case ERROR:
			lOG.severe(message);
			break;
		case INFO:
			lOG.info(message);
			break;
		case FINE:
			lOG.fine(message);
			break;
		default:
			break;
		}
	}
	
	public void log(Type level, String message, Exception e) {
		log(level, message + " | " + e.getMessage());
		if (level == Type.DEBUG) e.printStackTrace();		
	}
	
	public void log(java.util.logging.Level level, String message) {
		if (level == Level.WARNING) log(com.nwu.log.Log.Type.DEBUG, message);
		if (level == Level.SEVERE) log(com.nwu.log.Log.Type.ERROR, message);
		if (level == Level.INFO) log(com.nwu.log.Log.Type.INFO, message);
		if (level == Level.FINE) log(com.nwu.log.Log.Type.FINE, message);
	}
	
	public void log(java.util.logging.Level level, String message, Exception e) {
		log(level, message + " | " + e.getMessage());
		if (level == Level.WARNING) e.printStackTrace();
	}
	
	public void severe(String message) {
		log(java.util.logging.Level.SEVERE, message);
	}
	
	/**
	 * Log a thread message.
	 * 
	 * @param type Type of message (type OFF won't actually do anything)
	 * @param id The thread id
	 * @param message The message to log
	 */
	public void log(Type type, long id, String message) {
		switch (type) {
		case DEBUG:
			lOG.log(java.util.logging.Level.WARNING, id + "|" + message);
			break;
		case ERROR:
			lOG.severe(id + "|" + message);
			break;
		case INFO:
			lOG.info(id + "|" + message);
			break;
		case FINE:
			lOG.fine(id + "|" + message);
			break;
		default:
			break;
		}
	}
	
	public static java.util.logging.Level getOutputType2JavaLevel(Type type) {
		switch (type) {
		case DEBUG:
			return java.util.logging.Level.WARNING;
		case ERROR:
			return java.util.logging.Level.SEVERE;
		case INFO:
			return java.util.logging.Level.INFO;
		case FINE:
			return java.util.logging.Level.FINE;
		case OFF:
			return java.util.logging.Level.OFF;
		}
		
		return java.util.logging.Level.OFF;
	}
	
	public java.util.logging.Logger getLogLogger() {
		return this.lOG;
	}

}
