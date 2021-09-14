package openaf.plugins;

/**
 * 
 * @author Nuno Aguiar
 *
 */

import java.io.IOException;
import java.net.ServerSocket;
import java.util.HashMap;
import java.util.logging.Level;

import com.nwu.log.Log;

import org.eclipse.jetty.server.Connector;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.ServerConnector;
import org.eclipse.jetty.servlet.ServletHandler;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeFunction;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;

import openaf.AFCmdBase;
import openaf.SimpleLog;
import openaf.SimpleLog.logtype;
import openaf.plugins.HTTPd.AsyncServlet;

// https://www.baeldung.com/jetty-embedded
public class HTTPd2 extends ScriptableObject {
    private static final long serialVersionUID = -8638106468713727782L;
    protected int serverport;
	protected static HashMap<String, Object> sessions = new HashMap<String, Object>();
    protected Server server;

    @Override
	public String getClassName() {
		return "HTTPd2";
	}
	
	private Integer findRandomOpenPortOnAllLocalInterfaces() throws IOException {
		try (ServerSocket socket = new ServerSocket(0)) {
			return socket.getLocalPort();
		}
	}
 
	public class HLog extends Log {
		protected int port; 
		protected NativeFunction callback = null;
		
		public HLog(int port, Object f) {
			super(false);
			this.port = port;
			if (f != null && f instanceof NativeFunction)
				this.callback = (NativeFunction) f;
		}
		
		protected void SimpleLoglog(SimpleLog.logtype type, String message, Exception e) {
			if (callback == null) {
				switch(type) {
				case DEBUG:
					SimpleLog.log(logtype.DEBUG, "[HTTPD " + port + "]" + message, e);
					break;
				case ERROR:
					SimpleLog.log(logtype.ERROR, "[HTTPD " + port + "]" + message, e);
					break;
				case INFO:
					SimpleLog.log(logtype.INFO, "[HTTPD " + port + "]" + message, e);
					break;
				default:
					break;
				}
			} else {
				Context cx = (Context) AFCmdBase.jse.enterContext();
				try {
					callback.call(cx, (Scriptable) AFCmdBase.jse.getGlobalscope(), cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope()), new Object[] { type, message, e });
				} catch(Exception ee) {
					throw ee;
				} finally {
					AFCmdBase.jse.exitContext();
				}
			}
				
		}

		@Override
		public void log(Type type, String message) {
			switch (type) {
			case DEBUG:
				SimpleLoglog(logtype.DEBUG, "[HTTPD " + port + "]" + message, null);
				break;
			case ERROR:
				SimpleLoglog(logtype.ERROR, "[HTTPD " + port + "]" + message, null);
				break;
			case INFO:
				SimpleLoglog(logtype.INFO, "[HTTPD " + port + "]" + message, null);
				break;
			case OFF:
				break;
			default:
				break;
			}
		}
		
		@Override
		public void log(Type type, String message, Exception e) {
			switch (type) {
			case DEBUG:
				SimpleLoglog(logtype.DEBUG, "[HTTPD " + port + "]" + message, e);
				break;
			case ERROR:
				SimpleLoglog(logtype.ERROR, "[HTTPD " + port + "]" + message, e);
				break;
			case INFO:
				SimpleLoglog(logtype.INFO, "[HTTPD " + port + "]" + message, e);
				break;
			case OFF:
				break;
			default:
				break;
			}			
		}
		
		@Override
		public void log(Level type, String message, Exception e) {
			if (type == Level.WARNING) log(Type.DEBUG, message, e);
			if (type == Level.SEVERE) log(Type.ERROR, message, e);
			if (type == Level.INFO) log(Type.INFO, message, e);
		}	
		
		@Override
		public void log(Type type, long id, String message) {
			switch (type) {
			case DEBUG:
				SimpleLoglog(logtype.DEBUG, "[HTTPD " + port + "]|" + id + "|" + message, null);
				break;
			case ERROR:
				SimpleLoglog(logtype.ERROR, "[HTTPD " + port + "]|" + id + "|" + message, null);
				break;
			case INFO:
				SimpleLoglog(logtype.INFO, "[HTTPD " + port + "]|" + id + "|" + message, null);
				break;
			case OFF:
				break;
			default:
				break;
			}			
		}
		
	}

    /**
	 * <odoc>
	 * <key>HTTPd.HTTPd(aPort, aLocalInteface, keyStorePath, keyStorePassword, logFunction, webSockets, aTimeout)</key>
	 * Creates a HTTP server instance on the provided port and optionally on the identified local interface.
	 * If the port provided is 0 or negative a random port will be assigned. To determine what this port is 
	 * you can use the function HTTPServer.getPort().
	 * If keyStorePath is defined, the corresponding SSL Key Store will be used (connections will be https) with
	 * the provided keyStorePassword. Do note that the keyStorePath should be included in the OpenAF classpath.
	 * The logFunction, if defined, will be called by the server whenever there is any logging to be performed 
	 * by the HTTPServer. This function will receive 3 arguments. Example:\
	 * \
	 * plugin("HTTPServer");\
	 * var s = new HTTPd(8091, void 0, void 0, void 0, function(aType, aMsg, anException) {\
	 *    if(aType.toString() != "DEBUG" &amp;&amp; anException.getMessage() != "Broken pipe")\
	 *       logErr("Type: " + aType + " | Message: " + aMsg + anException.printStackTrace());\
	 * });\
	 * s.addEcho("/echo");
	 * s.add("/stuff", function(req) {\
	 *    print(beautifier(req));\
	 *    return s.replyOKText("Stuff!!");\
	 * };\
	 * s.setDefault("/stuff");\
	 * \ 
	 * To generate a SSL key store you can use Java's keytool:\
	 * \
	 * keytool -genkey -keyalg RSA -alias selfsigned -keystore keystore.jks -storepass password -validity 360 -keysize 2048 -ext SAN=DNS:localhost,IP:127.0.0.1  -validity 9999\
	 * \
	 * And then add keystore.jks to the openaf.jar and have keyStorePath = "/keystore.jks".\
	 * \
	 * To support websockets you need to build IWebSock object and provide a timeout. For example:\
	 * \
	 * plugin("HTTPServer");\
	 * var webSock = new Packages.com.nwu.httpd.IWebSock({\
	 *    // onOpen callback\
	 *    oOpen: _ws => { log("Connection open") },\
	 *    // onClose callback\
	 *    oClose: (_ws, aCode, aReason, hasInitByRemote) => { log("Connection close: " + String(aReason)) },\
	 *    // onMessage callback\
	 *    oMessage: (_ws, aMessage) => { _ws.send(aMessage.getTextPayload()); },\
	 *    // onPong callback\
	 *    oPong: (_ws, aPong) => { },\
	 *    // onException callback\
	 *    oException: (_ws, anException) => { logErr(String(anException)); }\
	 * });\
	 * var s = new HTTPd(8091, "127.0.0.1", void 0, void 0, void 0, webSock, 30000); // 30 seconds timeout\
	 * s.addWS("/websocket");  // makes it available at ws://127.0.0.1:8091/websocket\
	 * \
	 * </odoc>
     * @throws Exception
	 */
	@JSConstructor
	public void newHTTPd(int port, Object host, String keyStorePath, Object password, Object errorFunction, Object ws, int timeout) throws Exception {
		if (port <= 0) {
			port = findRandomOpenPortOnAllLocalInterfaces();
		}
		
		serverport = port;

        server = new Server();
		ServerConnector connector = new ServerConnector(server);
        connector.setPort(port);
        server.setConnectors(new Connector[] { connector });
		ServletHandler handler = new ServletHandler();
		handler.addServletWithMapping(AsyncServlet.class, "/");
		server.setHandler(handler);
		server.start();
    }

    /**
	 * <odoc>
	 * <key>HTTPd.getPort() : number</key>
	 * Returns the listen port of the HTTP server instance.
	 * </odoc>
	 */
	@JSFunction
	public int getPort() {
		return serverport;
	}

	@JSFunction
	public Object getJavaObj() {
		return server;
	}

    /**
	 * <odoc>
	 * <key>HTTPd.stop()</key>
	 * Tries to stop the currently running HTTP server instance.
	 * </odoc>
     * @throws Exception
	 */
	@JSFunction
	public void stop() throws Exception {
		server.stop();
    }

	/**
	 * <odoc>
	 * <key>HTTPd.addSession(aSessionID)</key>
	 * Provides a simple session track mechanism adding the session ID provided. See HTTPServer.setSession to add data.
	 * </odoc>
	 */
	@JSFunction
	public static void addSession(String session) {
		setSession(session, null);
	}
	
	/**
	 * <odoc>
	 * <key>HTTPd.getSession(aSessionID) : Object</key>
	 * Retrieves the current data stored for the provided session ID.
	 * </odoc>
	 */
	@JSFunction
	public static Object getSession(String session) {
		return sessions.get(session);
	}

	/**
	 * <odoc>
	 * <key>HTTPd.setSession(aSessionID, anObject)</key>
	 * Sets the provided anObject as the session data for the session ID provided.
	 * </odoc>
	 */
	@JSFunction
	public static void setSession(String session, Object obj) {
		sessions.put(session, obj);
	}
	
	/**
	 * <odoc>
	 * <key>HTTPd.delSession(aSessionID)</key>
	 * Removes the provided session ID data from memory.
	 * </odoc>
	 */
	@JSFunction
	public static void delSession(String session) {
		sessions.remove(session);
	}
	
	/**
	 * <odoc>
	 * <key>HTTPd.hasSession(aSessionID) : boolean</key>
	 * Returns true if the provided session ID was add to memory. False otherwise.
	 * </odoc>
	 */
	@JSFunction
	public static boolean hasSession(String session) {
		return sessions.containsKey(session);
	}

}