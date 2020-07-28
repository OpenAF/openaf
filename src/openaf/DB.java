package openaf;

/**
 * 
 * @author Nuno Aguiar
 *
 */

import java.io.IOException;
import java.lang.String;
import java.sql.SQLException;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;

import openaf.JSEngine.JSList;

public class DB extends ScriptableObject {
	private static final long serialVersionUID = 3021524629835159503L;
	protected openaf.core.DB coreDB;

	@Override
	public String getClassName() {
		return "DB";
	}
	
	@JSConstructor
	public void newDB(String driver, String url, String login, String pass, String timeout) throws Exception {
		coreDB = new openaf.core.DB();
		coreDB.newDB(driver, url, login, pass, timeout);
	}

	@JSFunction
	public Object getStatements() {
		return coreDB.getStatements();
	}
	
	@JSFunction
	public void close() throws SQLException {
		coreDB.close();
	}
	
	@JSFunction
	public Object getConnect() {
		return coreDB.getConnect();
	}
	
	@JSFunction
	public void closeStatement(String aQuery) throws SQLException {
		coreDB.closeStatement(aQuery);
	}
	
	@JSFunction
	public void closeAllStatements() throws SQLException {
		coreDB.closeAllStatements();
	}
	
	@JSFunction
	public void p(String p) {
		System.out.println(p);
	}

	@JSFunction
	public Object q(String query) throws IOException, SQLException {
		return coreDB.q(query);
	}
	
	@JSFunction
	public Object qs(String query, Object objs, boolean keepStatement) throws IOException, SQLException {
		if (objs instanceof NativeArray) {
			NativeArray lines = (NativeArray) objs;
			JSEngine.JSList jslist = AFCmdBase.jse.getNewList(AFCmdBase.jse.getGlobalscope());
			for(Object line : lines) {
				jslist.add(line);
			}
			
			return coreDB.qs(query, jslist, keepStatement);
		} else
			return coreDB.qs(query, AFCmdBase.jse.getNewList(AFCmdBase.jse.getGlobalscope()), keepStatement);
	}
	
	@JSFunction
	public Object qsRS(String query, Object objs) throws IOException, SQLException {
		if (objs instanceof NativeArray) {
			NativeArray lines = (NativeArray) objs;
			JSEngine.JSList jslist = AFCmdBase.jse.getNewList(AFCmdBase.jse.getGlobalscope());
			for(Object line : lines) {
				jslist.add(line);
			}
			
			return coreDB.qsRS(query, jslist);
		} else
			return coreDB.qsRS(query, AFCmdBase.jse.getNewList(AFCmdBase.jse.getGlobalscope()));
	}

	@JSFunction 
	public Object qLob(String sql) throws Exception {
		return coreDB.qLob(sql);	}
	
	@JSFunction
	public int u(String sql) throws SQLException {
		return coreDB.u(sql);
	}
	
	@JSFunction
	public int us(String sql, Object objs, boolean keepStatement) throws SQLException {
		if (objs instanceof NativeArray) {
			NativeArray lines = (NativeArray) objs;
			JSEngine.JSList jslist = AFCmdBase.jse.getNewList(AFCmdBase.jse.getGlobalscope());
			for(Object line : lines) {
				jslist.add(line);
			}
			
			return coreDB.us(sql, jslist, keepStatement);
		} else
			return -1;
	}
	
	@JSFunction
	public int usArray(String sql, Object objs, int batchSize, boolean keepStatement) throws SQLException {
		if (objs instanceof NativeArray) {
			NativeArray lines = (NativeArray) objs;
			JSEngine.JSList jslist = AFCmdBase.jse.getNewList(AFCmdBase.jse.getGlobalscope());
			for(Object line : lines) {
				if (line instanceof NativeArray) {
					NativeArray sublines = (NativeArray) line;
					JSEngine.JSList jsSubList = AFCmdBase.jse.getNewList(AFCmdBase.jse.getGlobalscope());
					for(Object subline : sublines) {
						jsSubList.add(subline);
					}
					jslist.add(jsSubList);
				}
			}
			
			return coreDB.usArray(sql, jslist, batchSize, keepStatement);
		} else {
			return -1;
		}
	}
	
	@JSFunction
	public int uLob(String sql, Object lob) throws SQLException {
		return coreDB.uLob(sql, lob);
	}

	@JSFunction
	public int uLobs(String sql, Object lobs) throws SQLException {
		if (lobs instanceof NativeArray) {
			NativeArray lines = (NativeArray) lobs;
			JSEngine.JSList jslist = AFCmdBase.jse.getNewList(AFCmdBase.jse.getGlobalscope());
			for(Object line : lines) {
				jslist.add(line);
			}
			
			return coreDB.uLobs(sql, jslist);
		} else {
			return -1;
		}
	}	

	@JSFunction
	public void commit() throws SQLException {
		coreDB.commit();
	}

	@JSFunction
	public void rollback() throws SQLException {
		coreDB.rollback();
	}

	@JSFunction
	public String h2StartServer(int port, NativeArray args) throws SQLException {
		JSList jslist = null;
		
		if (args instanceof NativeArray) {
			jslist = AFCmdBase.jse.getNewList(AFCmdBase.jse.getGlobalscope());
			for(Object arg : args) {
				jslist.add(arg);
			}
		}
	
		return coreDB.h2StartServer(port, jslist);
	}
	
	@JSFunction
	public void h2StopServer() {
		coreDB.h2StopServer();
	}

	@JSFunction
	public void convertDates(boolean toggle) {
		coreDB.convertDates(toggle);
	}
}
