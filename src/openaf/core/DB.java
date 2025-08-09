package openaf.core;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;
import java.io.StringWriter;
import java.nio.charset.Charset;
import java.sql.Connection;
import java.sql.Driver;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Properties;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicLong;
import java.lang.String;

import org.apache.commons.io.IOUtils;
import org.h2.tools.Server;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.IdScriptableObject;
import org.mozilla.javascript.Scriptable;

import openaf.AFCmdBase;
import openaf.JSEngine;
import openaf.OAFdCL;
import openaf.SimpleLog;

/**
 * Core DB plugin
 * 
 * Copyright 2023 Nuno Aguiar
 *
 */
public class DB {
	static protected final String ORACLE_DRIVER = "oracle.jdbc.OracleDriver";
	static protected final String POSTGRESQL_DRIVER = "org.postgresql.Driver";
	static protected final String H2_DRIVER = "org.h2.Driver";
	static public HashMap<String, String> drivers = new HashMap<String, String>();
	protected final Long LIMIT_RESULTS = 100000000L;
	protected Connection con;
	protected Server h2Server;
	protected ConcurrentHashMap<String, PreparedStatement> preparedStatements = new ConcurrentHashMap<String, PreparedStatement>();
	protected boolean convertDates = false;
	public String url;
	
	static {
		drivers.put("jdbc:oracle:", ORACLE_DRIVER);
		drivers.put("jdbc:postgresql:", POSTGRESQL_DRIVER);
		drivers.put("jdbc:h2:", H2_DRIVER);
	}

	/**
	 * <odoc>
	 * <key>DB.db(aDriver, aURL, aLogin, aPassword, aTimeout)</key>
	 * Creates a new instance of the object DB providing java class aDriver (e.g. oracle.jdbc.OracleDriver)
	 * that must be included on OpenAF's classpath, a JDBC aURL, aLogin and aPassword. If the aDriver is 
	 * null or undefined the Oracle driver will be used. Optionally you can provide aTimeout in ms.\
	 * \
	 * Examples of JDBC URLs:\
	 * \
	 * - Oracle Thin: jdbc:oracle:thin:@{{host}}:{{port}}:{{database}}\
	 * - PostgreSQL : jdbc:postgresql://{{host}}:{{port}}/{{database}}\
	 * - H2         : jdbc:h2:{{file}}
	 * </odoc>
	 */
	public void newDB(String driver, String url, String login, String pass, String timeout) throws Exception {
		// Are we in the wrong constructor?
		if (driver.startsWith("jdbc:")) {
			if (url != null) {
				// Ok, use it as if it was another constructor
				for(String prefix : drivers.keySet()) {
					if (driver.startsWith(prefix)) connect(drivers.get(prefix), driver, url, login, pass);
				}
				if (url.startsWith("jdbc:oracle"))     connect(ORACLE_DRIVER, driver, url, login, pass);
				if (url.startsWith("jdbc:postgresql")) connect(POSTGRESQL_DRIVER, driver, url, login, pass);
				if (url.startsWith("jdbc:h2"))         connect(H2_DRIVER, driver, url, login, pass);
			}
		} else {
			SimpleLog.log(SimpleLog.logtype.DEBUG, "New DB with driver='" + driver + "'|url='" + url + "'|login='"+login+"'|pass='"+pass+"'|timeout='"+timeout+"'", null);
			connect(driver, url, login, pass, timeout);
		}
	}

	/**
	 * <odoc>
	 * <key>DB.close()</key>
	 * Closes the database connection for this DB object instance. In case of error an exception will be
	 * thrown.
	 * </odoc>
	 */
	public void close() throws SQLException {
		if (con != null) {
			//try {
				closeAllStatements();
				con.close();
			//} catch (SQLException e) {
				//SimpleLog.log(SimpleLog.logtype.ERROR, "Error closing database " + url + ": " + e.getMessage(), e);
			//	throw e;
			//}
		}
	}
	
	/**
	 * <odoc>
	 * <key>DB.getStatements() : Array</key>
	 * Returns the current list of database prepared statements that weren't closed it. Do close them,
	 * as soon as possible, using the DB.closeStatement or DB.closeAllStatements functions. 
	 * </odoc>
	 */
	public Object getStatements() {
		JSEngine.JSList statements = AFCmdBase.jse.getNewList(null);
		statements.addAll(preparedStatements.keySet());
		return statements.getList();
		
	}
	
	/**
	 * <odoc>
	 * <key>DB.getConnect() : JavaObject</key>
	 * Returns a Java database connection. 
	 * </odoc>
	 */
	public Object getConnect() {
		return con;
	}
	
	/**
	 * <odoc>
	 * <key>DB.closeStatement(aStatement)</key>
	 * Closes the corresponding prepared statement. If an error occurs during this process
	 * an exception will be thrown.
	 * </odoc>
	 */
	public void closeStatement(String aQuery) throws SQLException {
		if (con != null) {
			PreparedStatement ps = preparedStatements.get(aQuery);
			if (ps != null) {
				ps.close();
				preparedStatements.remove(aQuery);
			}
		}
	}
	
	/**
	 * <odoc>
	 * <key>DB.closeAllStatements()</key>
	 * Tries to close all prepared statements for this DB object instance. If an error occurs
	 * during this process an exception will be thrown.
	 * </odoc>
	 */
	public void closeAllStatements() throws SQLException {
		if (con != null) {
			for(PreparedStatement ps : preparedStatements.values()) {
				ps.close();
			}
		}
	}
	
	/**
	 * <odoc>
        * <key>DB.q(aQuery) : Map</key>
         * Executes the SQL query provided in aQuery on the current DB connection. It returns a Map with a
         * results array where each element corresponds to one row. In case of error an exception will be
         * thrown.
         * </odoc>
         */
	public Object q(String query) throws IOException, SQLException {
		if (con != null) {
			//try {
				PreparedStatement ps = con.prepareStatement(query);
				ResultSet rs = ps.executeQuery();
				
				int numberColumns = rs.getMetaData().getColumnCount();
				JSEngine.JSMap no = AFCmdBase.jse.getNewMap(null);
				
				JSEngine.JSList records = AFCmdBase.jse.getNewList(no.getMap());
				
				while(rs.next()) { // && count < LIMIT_RESULTS) {
					JSEngine.JSMap record = AFCmdBase.jse.getNewMap(records.getList());
					
					for(int i = 1; i <= numberColumns; i++) {
						if ((rs.getMetaData().getColumnType(i) == java.sql.Types.NUMERIC) ||
						    (rs.getMetaData().getColumnType(i) == java.sql.Types.DECIMAL) ||
						    (rs.getMetaData().getColumnType(i) == java.sql.Types.DOUBLE)  ||
							(rs.getMetaData().getColumnType(i) == java.sql.Types.FLOAT) ||
							(rs.getMetaData().getColumnType(i) == java.sql.Types.INTEGER)) {
							// TODO: Need to change for more performance
							
							if (rs.getObject(i) != null) {
								//jsong.writeNumberField(rs.getMetaData().getColumnLabel(i), new BigDecimal(rs.getObject(i).toString()));
								record.put(rs.getMetaData().getColumnLabel(i), Double.valueOf(rs.getObject(i).toString()) );
							} else {
								//jsong.writeNumberField(rs.getMetaData().getColumnLabel(i), null);
								record.put(rs.getMetaData().getColumnLabel(i), null);
							}
						} else {
							if((rs.getMetaData().getColumnType(i) == java.sql.Types.CLOB) ||
							   (rs.getMetaData().getColumnType(i) == java.sql.Types.LONGVARCHAR)) {
								try {
									InputStream in;
									if (rs.getMetaData().getColumnType(i) == java.sql.Types.CLOB)
											in = rs.getClob(i).getAsciiStream();
									else
											in = rs.getAsciiStream(i);
									StringWriter w = new StringWriter();
									IOUtils.copy(in, w, (Charset) null);
									record.put(rs.getMetaData().getColumnLabel(i), w.toString());
								} catch(Exception e) {
									SimpleLog.log(SimpleLog.logtype.DEBUG, "Problem getting clob", e);
									record.put(rs.getMetaData().getColumnLabel(i),  null);
								}
								continue;
							}
							
							if((rs.getMetaData().getColumnType(i) == java.sql.Types.BLOB) ||
							   (rs.getMetaData().getColumnType(i) == java.sql.Types.BINARY) ||
							   (rs.getMetaData().getColumnType(i) == java.sql.Types.LONGVARBINARY)) {
								try {
									InputStream in;
									if (rs.getMetaData().getColumnType(i) == java.sql.Types.BLOB)
											in = rs.getBlob(i).getBinaryStream();
									else
											in = rs.getBinaryStream(i);
									record.put(rs.getMetaData().getColumnLabel(i), IOUtils.toByteArray(in));
								} catch(Exception e) {
									SimpleLog.log(SimpleLog.logtype.DEBUG, "Problem getting blob", e);
									record.put(rs.getMetaData().getColumnLabel(i), null);
								}
								continue;
							}

							if (rs.getMetaData().getColumnType(i) == java.sql.Types.BOOLEAN) {
								if (rs.getBoolean(i)) {
									record.put(rs.getMetaData().getColumnLabel(i), true);
								} else {
									record.put(rs.getMetaData().getColumnLabel(i), false);
								}
								continue;
							}

							if (convertDates) {
								if((rs.getMetaData().getColumnType(i) == java.sql.Types.DATE)) {
									if (rs.getDate(i) != null)
										record.put(rs.getMetaData().getColumnLabel(i), AFCmdBase.jse.newObject((Scriptable) AFCmdBase.jse.getGlobalscope(), "Date", new Object[] { rs.getDate(i).getTime() }));
									else
										record.put(rs.getMetaData().getColumnLabel(i), null);
									continue;
								}

								if((rs.getMetaData().getColumnType(i) == java.sql.Types.TIMESTAMP) || 
								   (rs.getMetaData().getColumnType(i) == java.sql.Types.TIMESTAMP_WITH_TIMEZONE) ||
								   (rs.getMetaData().getColumnTypeName(i).equals("TIMESTAMP WITH TIME ZONE"))) {
									if (rs.getTimestamp(i) != null)
										record.put(rs.getMetaData().getColumnLabel(i), AFCmdBase.jse.newObject((Scriptable) AFCmdBase.jse.getGlobalscope(), "Date", new Object[] { rs.getTimestamp(i).getTime() }));
									else
										record.put(rs.getMetaData().getColumnLabel(i), null);
									continue;
								}

								if((rs.getMetaData().getColumnType(i) == java.sql.Types.TIME) ||
								(rs.getMetaData().getColumnType(i) == java.sql.Types.TIME_WITH_TIMEZONE)) {
									if (rs.getTime(i) != null)
										record.put(rs.getMetaData().getColumnLabel(i), AFCmdBase.jse.newObject((Scriptable) AFCmdBase.jse.getGlobalscope(), "Date", new Object[] { rs.getTime(i).getTime() }));
									else  
										record.put(rs.getMetaData().getColumnLabel(i), null);
									continue;
								}
							}

							if (rs.getObject(i) != null) {
								//jsong.writeStringField(rs.getMetaData().getColumnLabel(i), rs.getObject(i).toString());
								record.put(rs.getMetaData().getColumnLabel(i), rs.getObject(i).toString());
							} else {
								//jsong.writeStringField(rs.getMetaData().getColumnLabel(i), null);
								record.put(rs.getMetaData().getColumnLabel(i), null);
							}
						}
					}
					
					records.add(record.getMap());
				}

				rs.close();
				ps.close();
				no.put("results", records.getList());

				return no.getMap();
			//} catch (SQLException e) {
			//	throw e;
			//}
		}
		return null;
	}
	
	/**
	 * <odoc>
	 * <key>DB.qsRS(aQuery, arrayOfBindVariables) : Map</key>
	 * Performs aQuery (SQL) on the current DB object instance using the bind variables from the arrayOfBindVariables.
	 * It returns a java ResultSet object that should be closed after use. In case of error an 
	 * exception will be thrown. If you specify to use keepStatement do close this
	 * query, as soon as possible, using DB.closeStatement(aQuery) (where you provide an exactly equal statement to 
	 * aQuery) or DB.closeAllStatements.
	 * </odoc>
	 */
	public Object qsRS(String query, JSEngine.JSList bindVariables) throws IOException, SQLException {
		if (con != null) {
			//try {
				PreparedStatement ps = null;
				ps = con.prepareStatement(query);
				
				int ii = 0;
				for (Object obj : bindVariables ) {
					ii++;
					ps.setObject(ii, obj);
				}
				
				ResultSet rs = ps.executeQuery();
		
				return rs;
			//} catch (SQLException e) {
			//	throw e;
			//}
		}
		return null;
	}
	
	/**
	 * <odoc>
	 * <key>DB.qs(aQuery, arrayOfBindVariables, keepStatement) : Map</key>
	 * Performs aQuery (SQL) on the current DB object instance using the bind variables from the arrayOfBindVariables.
	 * It returns a Map with a results array that will have an element per result set line. In case of error an 
	 * exception will be thrown. Optionally you can specify to keepStatement (e.g. boolean) to keep from closing
	 * the prepared statement used for reuse in another qs call. If you specify to use keepStatement do close this
	 * query, as soon as possible, using DB.closeStatement(aQuery) (where you provide an exactly equal statement to 
	 * aQuery) or DB.closeAllStatements.
	 * </odoc>
	 */
	public Object qs(String query, JSEngine.JSList bindVariables, boolean keepStatement) throws IOException, SQLException {
		if (con != null) {
			//try {
				PreparedStatement ps = preparedStatements.get(query);
				if (ps == null) {
					ps = con.prepareStatement(query);
					if (keepStatement) preparedStatements.putIfAbsent(query, ps);
				}
				
				int ii = 0;
				for (Object obj : bindVariables ) {
					ii++;
					ps.setObject(ii, obj);
				}
				
				ResultSet rs = ps.executeQuery();
				
				int numberColumns = rs.getMetaData().getColumnCount();
				JSEngine.JSMap no = AFCmdBase.jse.getNewMap(null);
				JSEngine.JSList records = AFCmdBase.jse.getNewList(no.getMap());
				
				while(rs.next()) { // && count < LIMIT_RESULTS) {
					JSEngine.JSMap record = AFCmdBase.jse.getNewMap(records.getList());
					
					for(int i = 1; i <= numberColumns; i++) {
						if ((rs.getMetaData().getColumnType(i) == java.sql.Types.NUMERIC) ||
						    (rs.getMetaData().getColumnType(i) == java.sql.Types.DECIMAL) ||
						    (rs.getMetaData().getColumnType(i) == java.sql.Types.DOUBLE)  ||
							(rs.getMetaData().getColumnType(i) == java.sql.Types.FLOAT) ||
							(rs.getMetaData().getColumnType(i) == java.sql.Types.INTEGER)) {
							// TODO: Need to change for more performance
							
							if (rs.getObject(i) != null) {
								//jsong.writeNumberField(rs.getMetaData().getColumnLabel(i), new BigDecimal(rs.getObject(i).toString()));
								record.put(rs.getMetaData().getColumnLabel(i), Double.valueOf(rs.getObject(i).toString()) );
							} else {
								//jsong.writeNumberField(rs.getMetaData().getColumnLabel(i), null);
								record.put(rs.getMetaData().getColumnLabel(i), null);
							}
						} else {
							if((rs.getMetaData().getColumnType(i) == java.sql.Types.CLOB) ||
							   (rs.getMetaData().getColumnType(i) == java.sql.Types.LONGVARCHAR))	{
								InputStream in;
								if (rs.getMetaData().getColumnType(i) == java.sql.Types.CLOB)
										in = rs.getClob(i).getAsciiStream();
								else
										in = rs.getAsciiStream(i);
								
								StringWriter w = new StringWriter();
								IOUtils.copy(in, w, (Charset) null);
								record.put(rs.getMetaData().getColumnLabel(i), w.toString());
								continue;
							}
							
							if((rs.getMetaData().getColumnType(i) == java.sql.Types.BLOB) ||
							   (rs.getMetaData().getColumnType(i) == java.sql.Types.BINARY) ||
							   (rs.getMetaData().getColumnType(i) == java.sql.Types.LONGVARBINARY)) {
								InputStream in;
								if (rs.getMetaData().getColumnType(i) == java.sql.Types.BLOB)
										in = rs.getBlob(i).getBinaryStream();
								else
										in = rs.getBinaryStream(i);
								record.put(rs.getMetaData().getColumnLabel(i), IOUtils.toByteArray(in));
								continue;
							}

							if (convertDates) {
								if((rs.getMetaData().getColumnType(i) == java.sql.Types.DATE)) {
									record.put(rs.getMetaData().getColumnLabel(i), AFCmdBase.jse.newObject((Scriptable) AFCmdBase.jse.getGlobalscope(), "Date", new Object[] { rs.getDate(i).getTime() }));
									continue;
								}

								if((rs.getMetaData().getColumnType(i) == java.sql.Types.TIMESTAMP) || 
								   (rs.getMetaData().getColumnType(i) == java.sql.Types.TIMESTAMP_WITH_TIMEZONE) ||
								   (rs.getMetaData().getColumnTypeName(i).equals("TIMESTAMP WITH TIME ZONE"))) {
									record.put(rs.getMetaData().getColumnLabel(i), AFCmdBase.jse.newObject((Scriptable) AFCmdBase.jse.getGlobalscope(), "Date", new Object[] { rs.getTimestamp(i).getTime() }));
									continue;
								}

								if((rs.getMetaData().getColumnType(i) == java.sql.Types.TIME) ||
								(rs.getMetaData().getColumnType(i) == java.sql.Types.TIME_WITH_TIMEZONE)) {
									record.put(rs.getMetaData().getColumnLabel(i), AFCmdBase.jse.newObject((Scriptable) AFCmdBase.jse.getGlobalscope(), "Date", new Object[] { rs.getTime(i).getTime() }));
									continue;
								}
							}

							if (rs.getObject(i) != null) {
								//jsong.writeStringField(rs.getMetaData().getColumnLabel(i), rs.getObject(i).toString());
								record.put(rs.getMetaData().getColumnLabel(i), rs.getObject(i).toString());
							} else {
								//jsong.writeStringField(rs.getMetaData().getColumnLabel(i), null);
								record.put(rs.getMetaData().getColumnLabel(i), null);
							}
						}
					}
					
					records.add(record.getMap());
				}
				
				rs.close();
				if (!keepStatement) ps.close();
				no.put("results", records.getList());

				return no.getMap();
			//} catch (SQLException e) {
			//	throw e;
			//}
		}
		return null;
	}
	
	/**
	 * <odoc>
	 * <key>DB.qLob(aSQL) : Object</key>
         * Executes aSQL on the current DB object returning only the first row and column. If that column is a
         * CLOB a string is returned; if it is a BLOB a byte array is provided. Errors will raise an exception.
         * </odoc>
         */
	public Object qLob(String sql) throws Exception {
		if (con != null) {
			//try {
				PreparedStatement ps = con.prepareStatement(sql);
				ResultSet rs = ps.executeQuery();
				
				rs.next();
				if(rs.getMetaData().getColumnType(1) == java.sql.Types.CLOB) {
					StringWriter w = new StringWriter();
					try {
						InputStream in = rs.getClob(1).getAsciiStream();
						IOUtils.copy(in, w, (Charset) null);
					} catch(Exception e) {
						SimpleLog.log(SimpleLog.logtype.DEBUG, "Problem getting clob", e);
					}
					return w.toString();
				} 
				if (rs.getMetaData().getColumnType(1) == java.sql.Types.BLOB) {
					try {
						InputStream in = rs.getBlob(1).getBinaryStream();
						return IOUtils.toByteArray(in);
					} catch(Exception e) {
						SimpleLog.log(SimpleLog.logtype.DEBUG, "Problem getting blob", e);
						return null;
					}
				}
				
				rs.close();
				ps.close();
			//} catch (SQLException e) {
				//SimpleLog.log(SimpleLog.logtype.ERROR, "Error executing query " + sql + ": " + e.getMessage(), e);
			//	throw e;
			//}
		}
		return null;
	}
	
	/**
	 * <odoc>
	 * <key>DB.u(aSQL) : Number</key>
	 * Executes a SQL statement on the current DB object instance. On success it will return
	 * the number of rows affected. In case of error an exception will be thrown.
	 * </odoc>
	 */
	public int u(String sql) throws SQLException {
		if (con != null) {
			//try {
				Statement cs = con.createStatement();
			    int res = cs.executeUpdate(sql);
			    cs.close();
			    
			    return res;
			//} catch (SQLException e) {
				//SimpleLog.log(SimpleLog.logtype.ERROR, "Error executing sql " + sql + ": " + e.getMessage(), e);
			//	throw e;
			//}			
		}
		return -1;
	}
	
	/**
	 * <odoc>
	 * <key>DB.us(aSQL, anArray, keepStatement) : Number</key>
	 * Executes a SQL statement on the current DB object instance that can have bind variables that 
	 * can be specified on anArray. On success it will return the number of rows affected. In case of
	 * error an exception will be thrown. Optionally you can specify to keepStatement (e.g. boolean) to keep from closing
	 * the prepared statement used for reuse in another us call. If you specify to use keepStatement do close this
	 * query, as soon as possible, using DB.closeStatement(aQuery) (where you provide an exactly equal statement to 
	 * aQuery) or DB.closeAllStatements.
	 * </odoc>
	 */
	public int us(String sql, JSEngine.JSList objs, boolean keepStatement) throws SQLException {
		if (con != null) {
			//try { 
				PreparedStatement ps = preparedStatements.get(sql);
				if (ps != null) {
					keepStatement = true;
				} else {
					ps = con.prepareStatement(sql);
					if (keepStatement) preparedStatements.putIfAbsent(sql, ps);
				}

				//if (objs instanceof JSEngine.JSList) {
					int i = 0;
					for (Object obj : objs ) {
						i++;
						if (obj instanceof org.mozilla.javascript.IdScriptableObject) {
							if (((org.mozilla.javascript.IdScriptableObject) obj).getClassName().equals("Date")) {
								obj = Context.jsToJava(obj, java.util.Date.class);
							}
						}

						try {
							ps.setObject(i, obj);
						} catch(Exception e) {
							System.err.println("ERROR: " + e.getMessage());
							e.printStackTrace();
						}
					}
				//}
				int res = ps.executeUpdate();
				if (!keepStatement) ps.close();
				
				return res;
			//} catch (SQLException e) {
			//	throw e;
			//}
		}
		return -1;
	}
	
	/**
	 * <odoc>
	 * <key>DB.usArray(aSQL, anArrayOfArrays, aBatchSize, keepStatement) : Number</key>
	 * Executes, and commits, a batch of a SQL statement on the current DB object instance that can have bind variables that 
	 * can be specified on an array, for each record, as part of anArrayOfArrays. On success it will return the number of rows 
	 * affected. In case of error an exception will be thrown. Optionally you can specify to keepStatement (e.g. boolean) to keep
	 * from closing the prepared statement used for reuse in another usArray call. If you specify to use keepStatement do close this
	 * query, as soon as possible, using DB.closeStatement(aQuery) (where you provide an exactly equal statement to 
	 * aQuery) or DB.closeAllStatements. You can also specify aBatchSize (default is 1000) to indicate when a commit
	 * should be performed while executing aSQL for each array of bind variables in anArrayOfArrays.\
	 * \
	 * Example:\
	 * \
	 * var values = [ [1,2], [2,2], [3,3], [4,5]];\
	 * db.usArray("INSERT INTO A (c1, c2) VALUES (?, ?)", values, 2);\
	 * \
	 * </odoc>
	 */
	public long usArray(String sql, JSEngine.JSList objs, int batchSize, boolean keepStatement) throws SQLException {
		if (con != null) {
			//try {
				PreparedStatement ps = preparedStatements.get(sql);
				if (ps != null) {
					keepStatement = true;
				} else {
					ps = con.prepareStatement(sql);
					if (keepStatement) preparedStatements.putIfAbsent(sql, ps);
				}
				
				int count = 0;
				long res = 0; // Use long to prevent overflow with large datasets
				if (batchSize <= 0) batchSize = 1000;
				
				// Use enhanced iteration for better performance
				for(Object obj : objs) {
					JSEngine.JSList paramList = (JSEngine.JSList) obj;
					int paramIndex = 1; // JDBC parameters are 1-indexed
					
					// Optimized parameter setting
					for(Object param : paramList) {
						ps.setObject(paramIndex++, param);
					}
					ps.addBatch();
					
					if (++count % batchSize == 0) {
						int[] batchResults = ps.executeBatch();
						// Use enhanced for-loop for better performance
						for(int rowCount : batchResults) {
							if (rowCount > 0) res += rowCount;
						}
						ps.clearBatch(); // Clear batch after execution for memory efficiency
					}
				}
				
				// Execute remaining batches
				if (count % batchSize != 0) {
					int[] batchResults = ps.executeBatch();
					for(int rowCount : batchResults) {
						if (rowCount > 0) res += rowCount;
					}
					ps.clearBatch();
				}
				
				if (!keepStatement) ps.close();
				
				// Handle potential overflow
				return res > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) res;
			//} catch (SQLException e) {
			//	throw e;
			//}
		}
		return -1;
	}
	
	/**
	 * -odoc-
	 * <key>DB.usArrayHighPerf(aSQL, anArrayOfArrays, aBatchSize, keepStatement, useVirtualThreads) : Number</key>
	 * High-performance version of usArray optimized for Java 21+. Executes, and commits, a batch of a SQL statement 
	 * on the current DB object instance with enhanced performance optimizations including optional virtual thread support
	 * for very large datasets. Parameters are the same as usArray with an additional useVirtualThreads boolean parameter.
	 * When useVirtualThreads is true, the method will use virtual threads for concurrent batch processing (requires Java 21+).
	 * The virtual thread implementation automatically partitions the work across multiple lightweight threads, creating
	 * separate PreparedStatement instances for each thread to ensure thread safety. Falls back to standard processing
	 * if virtual threads are not available or if an error occurs during virtual thread processing.
	 * This method provides significant performance improvements for large datasets while maintaining full compatibility.
	 * -/odoc-
	 */
	/*public int usArray2(String sql, JSEngine.JSList objs, int batchSize, boolean keepStatement, boolean useVirtualThreads) throws SQLException {
		if (con == null) return -1;
		
		PreparedStatement ps = preparedStatements.get(sql);
		if (ps != null) {
			keepStatement = true;
		} else {
			ps = con.prepareStatement(sql);
			if (keepStatement) preparedStatements.putIfAbsent(sql, ps);
		}
		
		if (batchSize <= 0) batchSize = 1000;
		
		// For very large datasets and Java 21+, use virtual threads
		// Note: size check removed since JSList doesn't expose size() method
		// Virtual thread processing can be enabled based on other criteria
		if (useVirtualThreads) {
			return processWithVirtualThreads(ps, objs, batchSize, keepStatement);
		}
		
		// Standard optimized processing
		return processStandard(ps, objs, batchSize, keepStatement);
	}
	
	private int processStandard(PreparedStatement ps, JSEngine.JSList objs, int batchSize, boolean keepStatement) throws SQLException {
		int count = 0;
		long totalRowsAffected = 0;
		
		try {
			for (Object obj : objs) {
				JSEngine.JSList paramList = (JSEngine.JSList) obj;
				setParameters(ps, paramList);
				ps.addBatch();
				
				if (++count % batchSize == 0) {
					totalRowsAffected += executeBatchAndSum(ps);
					ps.clearBatch();
				}
			}
			
			// Execute remaining batch
			if (count % batchSize != 0) {
				totalRowsAffected += executeBatchAndSum(ps);
				ps.clearBatch();
			}
			
		} finally {
			if (!keepStatement) ps.close();
		}
		
		return totalRowsAffected > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) totalRowsAffected;
	}
	
	private int processWithVirtualThreads(PreparedStatement ps, JSEngine.JSList objs, int batchSize, boolean keepStatement) throws SQLException {
		try {
			// Check if virtual threads are available (Java 21+)
			if (!isVirtualThreadsAvailable()) {
				SimpleLog.log(SimpleLog.logtype.DEBUG, "Virtual threads not available, falling back to standard processing", null);
				return processStandard(ps, objs, batchSize, keepStatement);
			}
			
			// Determine optimal number of virtual threads (usually 2-4x CPU cores for I/O bound tasks)
			int numThreads = Math.max(2, Runtime.getRuntime().availableProcessors() * 2);
			
			// Create virtual thread executor
			ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
			
			try {
				// Split the work into chunks for parallel processing
				List<List<Object>> chunks = partitionWork(objs, numThreads);
				List<Future<Long>> futures = new ArrayList<>();
				
				// Submit each chunk to a virtual thread
				for (List<Object> chunk : chunks) {
					Future<Long> future = executor.submit(() -> {
						return processChunk(chunk, ps.getConnection().prepareStatement(ps.toString()), batchSize);
					});
					futures.add(future);
				}
				
				// Collect results from all virtual threads
				AtomicLong totalRowsAffected = new AtomicLong(0);
				for (Future<Long> future : futures) {
					try {
						totalRowsAffected.addAndGet(future.get());
					} catch (Exception e) {
						SimpleLog.log(SimpleLog.logtype.ERROR, "Error in virtual thread processing: " + e.getMessage(), e);
						throw new SQLException("Virtual thread processing failed", e);
					}
				}
				
				return totalRowsAffected.get() > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) totalRowsAffected.get();
				
			} finally {
				executor.shutdown();
				if (!keepStatement) ps.close();
			}
			
		} catch (Exception e) {
			SimpleLog.log(SimpleLog.logtype.DEBUG, "Virtual thread processing failed, falling back to standard: " + e.getMessage(), e);
			return processStandard(ps, objs, batchSize, keepStatement);
		}
	}
	
	private boolean isVirtualThreadsAvailable() {
		try {
			// Check if virtual threads are available (Java 21+)
			Executors.class.getMethod("newVirtualThreadPerTaskExecutor");
			return true;
		} catch (NoSuchMethodException e) {
			return false;
		}
	}
	
	private List<List<Object>> partitionWork(JSEngine.JSList objs, int numPartitions) {
		List<List<Object>> partitions = new ArrayList<>();
		
		// Initialize partitions
		for (int i = 0; i < numPartitions; i++) {
			partitions.add(new ArrayList<>());
		}
		
		// Distribute work across partitions in round-robin fashion
		int partitionIndex = 0;
		for (Object obj : objs) {
			partitions.get(partitionIndex).add(obj);
			partitionIndex = (partitionIndex + 1) % numPartitions;
		}
		
		// Remove empty partitions
		partitions.removeIf(List::isEmpty);
		
		return partitions;
	}
	
	private long processChunk(List<Object> chunk, PreparedStatement ps, int batchSize) throws SQLException {
		long totalRowsAffected = 0;
		int count = 0;
		
		try {
			for (Object obj : chunk) {
				JSEngine.JSList paramList = (JSEngine.JSList) obj;
				setParameters(ps, paramList);
				ps.addBatch();
				
				if (++count % batchSize == 0) {
					totalRowsAffected += executeBatchAndSum(ps);
					ps.clearBatch();
				}
			}
			
			// Execute remaining batch
			if (count % batchSize != 0) {
				totalRowsAffected += executeBatchAndSum(ps);
				ps.clearBatch();
			}
			
		} finally {
			ps.close();
		}
		
		return totalRowsAffected;
	}
	
	private void setParameters(PreparedStatement ps, JSEngine.JSList paramList) throws SQLException {
		int paramIndex = 1;
		for (Object param : paramList) {
			// Handle special JavaScript objects efficiently
			if (param instanceof org.mozilla.javascript.IdScriptableObject) {
				if (((org.mozilla.javascript.IdScriptableObject) param).getClassName().equals("Date")) {
					param = Context.jsToJava(param, java.util.Date.class);
				}
			}
			ps.setObject(paramIndex++, param);
		}
	}
	
	private long executeBatchAndSum(PreparedStatement ps) throws SQLException {
		int[] results = ps.executeBatch();
		long sum = 0;
		for (int rowCount : results) {
			if (rowCount > 0) sum += rowCount;
		}
		return sum;
	}*/
	
	/**
	 * <odoc>
	 * <key>DB.uLob(aSQL, aLOB) : Number</key>
	 * Executes a SQL statement on the current DB object instance to update a CLOB or BLOB provided
	 * in aLOB. On success it will return the number of rows affected. In case of error an exception
	 * will be thrown.
	 * </odoc>
	 */
	public int uLob(String sql, Object lob) throws SQLException {
		if (con != null) {
			//try {
				PreparedStatement ps = con.prepareStatement(sql);
				//Clob clobOut = con.createClob();

				if (lob instanceof org.mozilla.javascript.NativeJavaArray) {
					lob = ((org.mozilla.javascript.NativeJavaArray) lob).unwrap();
				}

				if (lob instanceof byte[]) {
					ps.setBlob(1, new ByteArrayInputStream((byte []) lob));
				} else {
					StringReader sw = new StringReader((String) lob);
					//IOUtils.copy(sw, clobOut.setAsciiStream(1));
					ps.setCharacterStream(1, sw, ((String) lob).length());
					//clobOut.free();
				}
				int res = ps.executeUpdate();
				ps.close();
				
				return res;
			//} catch (SQLException e) {
				//SimpleLog.log(SimpleLog.logtype.ERROR, "Error executing sql " + sql + ": " + e.getMessage(), e);
			//	throw e;
			//}			
		}		
		return -1;
	}
	
	/**
	 * <odoc>
	 * <key>DB.uLobs(aSQL, anArray) : Number</key>
	 * Executes a SQL statement on the current DB object instance that can have CLOB or BLOB bind
	 * variables that can be specified on anArray. On success it will return the number of rows
	 * affected. In case of error an exception will be thrown.
	 * </odoc>
	 */
	public int uLobs(String sql, JSEngine.JSList lobs) throws SQLException {
		if (con != null) {
			//try {
				PreparedStatement ps = con.prepareStatement(sql);
					int i = 0;
					for(Object lob : lobs) {
						i++;
						
						if (lob instanceof org.mozilla.javascript.NativeJavaArray) {
							lob = ((org.mozilla.javascript.NativeJavaArray) lob).unwrap();
						}
						
						if (lob instanceof byte[]) {
							ps.setBlob(i, new ByteArrayInputStream((byte []) lob));
						} else {
							StringReader sw = new StringReader((String) lob);
							ps.setCharacterStream(i, sw, ((String) lob).length());
						}
					}
					int res = ps.executeUpdate();
					ps.close();
					
					return res;

			//} catch (SQLException e) {
			//	throw e;
			//}			
		}		
		return -1;
	}	
	
	/**
	 * <odoc>
	 * <key>DB.commit()</key>
         * Commits the current transaction associated with this DB object.
         * An exception will be thrown if any database error occurs.\
         * \
         * Example:\
         * \
         * db.u("INSERT INTO A VALUES (1)");\
         * db.commit();\
         * </odoc>
         */
	public void commit() throws SQLException {
		if (con != null) {
			try {
				con.commit();
			} catch (SQLException e) {
				SimpleLog.log(SimpleLog.logtype.DEBUG, "Error while commit on " + url + ": " + e.getMessage(), e);
				throw e;
			}
		}
	}
	
	/**
	 * <odoc>
	 * <key>DB.rollback(dontIgnoreError)</key>
	 * Rollbacks the current database session on the current DB object instance.
	 * In case of error an exception will be thrown if dontIgnoreError = true
	 * </odoc>
	 */
	public void rollback(boolean dontIgnoreError) throws SQLException {
		if (con != null) {
			try {
				con.rollback();
			} catch (SQLException e) {
				if (!dontIgnoreError) {
					SimpleLog.log(SimpleLog.logtype.DEBUG, "Error while rollback on " + url + ": " + e.getMessage(), e);
				} else {
					SimpleLog.log(SimpleLog.logtype.ERROR, "Error while rollback on " + url + ": " + e.getMessage(), e);
					throw e;
				}
			}
		}
	}
	
    protected void connect(String driver, String url, String login, String pass, String timeout) throws Exception {
		//try {
			if (OAFdCL.oafdcl != null) 
				Class.forName(driver, true, OAFdCL.oafdcl);
			else 
				Class.forName(driver);
			this.url = url;
			
			Properties props = new Properties();
			
			if (login != null) props.setProperty("user", AFCmdBase.afc.dIP(login));
			if (pass != null)  props.setProperty("password", AFCmdBase.afc.dIP(pass));
			try {
				if (timeout != null && Integer.valueOf(timeout) > 0) {
					props.setProperty("connectTimeout", timeout);
				}
			} catch(java.lang.NumberFormatException e) {
				// ignore
			};
			
			try {
				con = DriverManager.getConnection(url, props);
				try {
					con.setAutoCommit(false);
				} catch(Exception e) {
					SimpleLog.log(SimpleLog.logtype.DEBUG, "Error on setAutoCommit: " + e.getMessage(), e);
				}
			} catch(SQLException e) {
				if (e.getMessage().contains("No suitable driver found")) {
					SimpleLog.log(SimpleLog.logtype.DEBUG, "Using OAFdCL to load '" + driver + "': " + e.getMessage(), e);
					Driver pdriver = (Driver) Class.forName(driver, true, OAFdCL.oafdcl).getDeclaredConstructor().newInstance();
					DriverManager.registerDriver(new openaf.DBProxy(pdriver));
					con = DriverManager.getConnection(url, props);
					try {
						con.setAutoCommit(false);
					} catch(Exception e1) {
						SimpleLog.log(SimpleLog.logtype.DEBUG, "Error on setAutoCommit: " + e1.getMessage(), e1);
					}
				} else {
					throw e;
				}
			}

		//} catch (ClassNotFoundException | SQLException e) {
			//SimpleLog.log(SimpleLog.logtype.ERROR, "Error connecting to database " + url + " using " + driver + ": " + e.getMessage(), e);
		//	throw e;
		//}
	}
	
	/**
	 * <odoc>
	 * <key>DB.h2StartServer(aPort, aListOfArguments) : String</key>
	 * Starts a H2 server on aPort (if provided) with an array of arguments (supported options are: 
	 * -tcpPort, -tcpSSL, -tcpPassword, -tcpAllowOthers, -tcpDaemon, -trace, -ifExists, -baseDir, -key).
	 * After creating the access URL will be returned. In case of error an exception will be thrown.
	 * </odoc>
	 */
	public String h2StartServer(int port, JSEngine.JSList args) throws SQLException {
		if (port < 0) {
			
		} else {
			ArrayList<String> al = new ArrayList<String>();
			if (args != null) {
				al.add("-tcpPort");
				al.add(port + "");				
				for(Object o : args) {
					al.add(o + "");
				}
					
				h2Server = Server.createTcpServer((String[]) al.toArray(new String[al.size()])).start();
				return h2Server.getURL();
			} else {
				if(port > 0) {
					al.add("-tcpPort");
					al.add(port + "");
				}
				
				h2Server = Server.createTcpServer((String[]) al.toArray(new String[al.size()])).start();
				return h2Server.getURL();			
			}
		}
		return "";
		
	}
	
	/**
	 * <odoc>
	 * <key>DB.h2StopServer()</key>
	 * Stops a H2 server started for this DB instance.
	 * </odoc>
	 */
	public void h2StopServer() {
		h2Server.stop();
	}

	/**
	 * <odoc>
	 * <key>DB.convertDates(aFlag)</key>
	 * Sets to true or false (defaults to false) the conversion of Dates to javascript Date objects instead of strings.
	 * </odoc>
	 */
	public void convertDates(boolean toggle) {
		convertDates = toggle;
	}

	/**
	 * <odoc>
	 * <key>DB.setAutoCommit(aFlag)</key>
	 * Sets to true or false (defaults to false) the current database connection auto-commit.
	 * </odoc>
	 */
    public void setAutoCommit(boolean toggle) throws Exception {
		if (con != null) {
			con.setAutoCommit(toggle);
		} else {
			throw new Exception("No connection defined.");
		}
	}

	/**
	 * <odoc>
	 * <key>DB.getAutoCommit() : boolean</key>
	 * Retrieves the current database connection auto-commit flag state.
	 * </odoc>
	 */
	public boolean getAutoCommit() throws Exception {
		if (con != null) {
			return con.getAutoCommit();
		} else {
			throw new Exception("No connection defined.");
		}
	}
}
