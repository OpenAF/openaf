package wedo.openaf.plugins;

/**
 * 
 * @author Nuno Aguiar
 *
 */
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.net.ServerSocket;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Level;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeFunction;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;

import wedo.openaf.AFCmdBase;
import wedo.openaf.SimpleLog;
import wedo.openaf.SimpleLog.logtype;
import wedo.openaf.plugins.HTTPd.JSResponse;

import com.nwu.httpd.Codes;
import com.nwu.httpd.HTTPd;
import com.nwu.httpd.NanoHTTPD.Response.IStatus;
import com.nwu.httpd.responses.EchoResponse;
import com.nwu.httpd.responses.FileResponse;
import com.nwu.httpd.responses.StatusResponse;
import com.nwu.log.Log;

public class HTTPServer extends ScriptableObject {

	/**
	 * 
	 */
	private static final long serialVersionUID = -8638106468713717782L;
	protected HTTPd httpd;
	protected static HashMap<String, Object> sessions = new HashMap<String, Object>();
	protected String id;
	protected int serverport;
	public static Map<String, NativeFunction> callbacks = new ConcurrentHashMap<String, NativeFunction>();

	/**
	 * 
	 * @return
	 */
	@Override
	public String getClassName() {
		return "HTTPd";
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
	 * <key>HTTPd.HTTPd(aPort, aLocalInteface, keyStorePath, keyStorePassword, logFunction)</key>
	 * Creates a HTTP server instance on the provided port and optionally on the identified local interface.
	 * If the port provided is 0 or negative a random port will be assigned. To determine what this port is 
	 * you can use the function HTTPServer.getPort().
	 * If keyStorePath is defined, the corresponding SSL Key Store will be used (connections will be https) with
	 * the provided keyStorePassword. Do note that the keyStorePath should be included in the OpenAF classpath.
	 * The logFunction, if defined, will be called by the server whenever there is any logging to be performed 
	 * by the HTTPServer. This function will receive 3 arguments. Example:\
	 * \
	 * plugin("HTTPServer");\
	 * var s = new HTTPd(8091, undefined, undefined, undefined, function(aType, aMsg, anException) {\
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
	 * And then add keystore.jks to the openaf.jar and have keyStorePath = "/keystore.jks".
	 * </odoc>
	 */
	@JSConstructor
	public void newHTTPd(int port, Object host, String keyStorePath, Object password, Object errorFunction) throws IOException {
		if (port <= 0) {
			port = findRandomOpenPortOnAllLocalInterfaces();
		}
		
		serverport = port;
		
		if (host == null || host instanceof Undefined) {
			httpd = new com.nwu.httpd.HTTPd((Log) new HLog(port, errorFunction), port);
		} else {
			httpd = new com.nwu.httpd.HTTPd((Log) new HLog(port, errorFunction), (String) host, port);
		}

		if (keyStorePath != null && !keyStorePath.equals("undefined") &&
			password != null && !(password instanceof Undefined)) {
			httpd.stop();
			httpd.makeSecure(com.nwu.httpd.HTTPd.makeSSLSocketFactory(keyStorePath, ((String) password).toCharArray()), null);
			httpd.start();
		}
		
		httpd.addToGzipAccept("text/plain");
		httpd.addToGzipAccept("application/javascript");
		httpd.addToGzipAccept("text/css");
		httpd.addToGzipAccept("application/json");
		httpd.addToGzipAccept("application/xml");
		httpd.addToGzipAccept("text/richtext");
		httpd.addToGzipAccept("text/html");
		
		id = Integer.toString(port) + this.hashCode();
	}
	
	private Integer findRandomOpenPortOnAllLocalInterfaces() throws IOException {
		try (ServerSocket socket = new ServerSocket(0)) {
			return socket.getLocalPort();
		}
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
	
	/**
	 * <odoc>
	 * <key>HTTPd.stop()</key>
	 * Tries to stop the currently running HTTP server instance.
	 * </odoc>
	 */
	@JSFunction
	public void stop() {
		httpd.stop();
	}

	/**
	 * <odoc>
	 * <key>HTTPd.addEcho(aURI)</key>
	 * Adds a echo responder to the provided URI. Useful for debugging http requests to 
	 * a server instance. 
	 * </odoc>
	 */
	@JSFunction
	public void addEcho(String uri) {
		httpd.registerURIResponse(uri, EchoResponse.class, null);
	}
	
	/**
	 * <odoc>
	 * <key>HTTPd.addStatus(aURI)</key>
	 * Adds a status responder to the provided URI. Useful for debugging proposes
	 * </odoc>
	 */
	@JSFunction
	public void addStatus(String uri) {
		httpd.registerURIResponse(uri, StatusResponse.class, null);
		//httpd.createContext(uri, new StatusHandler());
	}
	

	/**
	 * <odoc>
	 * <key>HTTPd.add(aURI, aFunction)</key>
	 * Adds a custom responder to the provided URI. Any call to the URI will trigger a call to 
	 * the provided function. The function will receive the request as an argument. For example:\
	 * \
	 *   var hs = new HTTPd(1234);\
	 *   hs.add("/example", function(req) { hs.replyOKText(beautifier(req)); }
	 * \
	 * </odoc>
	 */
	@JSFunction
	public void add(String uri, NativeFunction callback) {
		callbacks.put(this.serverport + ":" + uri, callback);
		
		Map<String, String> props = new HashMap<String, String>();
		props.put("uri", uri);
		
		httpd.registerURIResponse(uri, JSResponse.class, props);
	}
	
	/**
	 * <odoc>
	 * <key>HTTPd.setDefault(aURI)</key>
	 * Sets the default URI to redirect all requests that don't have a responder associated. For example:\
	 * \
	 *   var hs = new HTTPd(1234);\
	 *   hs.addEcho("/echo");\
	 *   hs.setDefault("/echo");\
	 * \
	 * </odoc>
	 */
	@JSFunction
	public void setDefault(String uri) {
		httpd.setDefaultResponse(uri);
	}
	
	/**
	 * <odoc>
	 * <key>HTTPd.addFileBrowse(aURI, aFilepath)</key>
	 * Adds a responder to the provided URI that provides a very basic file browse to the provided
	 * aFilepath. Warning: keep in mind that this will expose files without any credential checking.
	 * </odoc>
	 */
	@JSFunction
	public void addFileBrowse(String uri, String filepath) {
		Map<String, String> props = new HashMap<String, String>();
		props.put("publichtml", filepath);
		httpd.registerURIResponse(uri, FileResponse.class, props);
	}
	
	/**
	 * <odoc>
	 * <key>HTTPd.addXDTServer(aURI, aAuthFunction, aOpsBrokerFunction)</key>
	 * Adds a WeDo XDT server responder to the provided URI with authentication provided by the aAuthFunction
	 * and operations provided by the aOpsBrokerFunction. For example:\
	 * \
	 *   var hs = new HTTPd(1234);\
	 *   hs.addXDTServer('/xdt',\
	 *     function(auth) {\
	 *        if (auth.getUser() == 'adm' &amp;&amp; auth.getPass() == 'Password1') {\
	 *           return true;\
	 *        } else {\
	 *        	 return false;\
	 *        }\
	 *     },\
	 *     function(sessionId, operation, paramIn, request) {\
	 *        switch(operation) {\
	 *           case "HelloWorld":\
	 *              return {"hello": "world!"};\
	 *           case "Ping":\
	 *              return paramIn;\
	 *           default:\
	 *              return paramIn;\
	 *        }\
	 *     }\
	 *   );\
	 * \
	 * </odoc>
	 * @throws ClassNotFoundException 
	 * @throws SecurityException 
	 * @throws NoSuchMethodException 
	 * @throws InvocationTargetException 
	 * @throws IllegalArgumentException 
	 * @throws IllegalAccessException 
	 */
	@JSFunction
	public void addXDTServer(String uri, NativeFunction authFunction, NativeFunction opsBroker) throws ClassNotFoundException, IllegalAccessException, IllegalArgumentException, InvocationTargetException, NoSuchMethodException, SecurityException {
		Map<String, String> props = new HashMap<String, String>();
		props.put("uri", uri);
		
		if (AFCmdBase.afcmd.equals("AFCmdWeDo")) {
			Class<?> cl = Class.forName("wedo.openaf.plugins.HTTPd.XDTServerResponse");
			cl.getDeclaredMethod("setAuthfunction", NativeFunction.class).invoke(this, authFunction);
			cl.getDeclaredMethod("setOpsfunction", NativeFunction.class).invoke(this, opsBroker);
			
			httpd.registerURIResponse(uri, cl, props);
		}
	}
	
	/**
	 * <odoc>
	 * <key>HTTPd.replyOKText(data) : Object</key>
	 * Builds a response object suitable to provide a reply to a HTTP request for a function used with the HTTPServer.add method.
	 * It will return a text mimetype with the provided data and a HTTP code of OK.
	 * </odoc>
	 */
	@JSFunction
	public Object replyOKText(String data) {
		Context cx = (Context) AFCmdBase.jse.enterContext();
		Scriptable no = cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope());
		AFCmdBase.jse.exitContext();
		
		no.put("status", no, 200);
		no.put("mimetype", no, Codes.MIME_PLAINTEXT);
		no.put("data", no, data);
		
		return no;
	}
	
	/**
	 * <odoc>
	 * <key>HTTPd.replyOKXML(data) : Object</key>
	 * Builds a response object suitable to provide a reply to a HTTP request for a function used with the HTTPServer.add method.
	 * It will return a XML mimetype with the provided data (in string format) and a HTTP code of OK.
	 * </odoc>
	 */
	@JSFunction
	public Object replyOKXML(String data) {
		Context cx = (Context) AFCmdBase.jse.enterContext();
		Scriptable no = cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope());
		AFCmdBase.jse.exitContext();
		
		no.put("status", no, 200);
		no.put("mimetype", no, "text/xml");
		no.put("data", no, data);
		
		return no;
	}
	
	/**
	 * <odoc>
	 * <key>HTTPd.replyOKHTML(data) : Object</key>
	 * Builds a response object suitable to provide a reply to a HTTP request for a function used with the HTTPServer.add method.
	 * It will return a HTML mimetype with the provided data (in string format) and a HTTP code of OK.
	 * </odoc>
	 */
	@JSFunction
	public Object replyOKHTML(String data) {
		Context cx = (Context) AFCmdBase.jse.enterContext();
		Scriptable no = cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope());
		AFCmdBase.jse.exitContext();
		
		no.put("status",  no, 200);
		no.put("mimetype", no, Codes.MIME_HTML);
		no.put("data", no, data);
		
		return no;
	}

	/**
	 * <odoc>
	 * <key>HTTPd.replyOKJSON(data) : Object</key>
	 * Builds a response object suitable to provide a reply to a HTTP request for a function used with the HTTPServer.add method.
	 * It will return a JSON mimetype with the provided data (in string format) and a HTTP code of OK.
	 * </odoc>
	 */
	@JSFunction
	public Object replyOKJSON(String data) {
		Context cx = (Context) AFCmdBase.jse.enterContext();
		Scriptable no = cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope());
		AFCmdBase.jse.exitContext();
		
		no.put("status", no, 200);
		no.put("mimetype", no, Codes.MIME_JSON);
		no.put("data", no, data);
		
		return no;
	}
	
	/**
	 * <odoc>
	 * <key>HTTPd.replyOKBin(data) : Object</key>
	 * Builds a response object suitable to provide a reply to a HTTP request for a function used with the HTTPServer.add method.
	 * It will return application/octet-stream mimetype with the provided data (as an array of bytes) and a HTTP code of OK. 
	 * </odoc>
	 */
	@JSFunction
	public Object replyOKBin(String data) {
		Context cx = (Context) AFCmdBase.jse.enterContext();
		Scriptable no = cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope());
		AFCmdBase.jse.exitContext();

		no.put("status", no, 200);
		no.put("mimetype", no, Codes.MIME_DEFAULT_BINARY);
		no.put("data", no, data);
		
		return no;
	}
	
	/**
	 * <odoc>
	 * <key>HTTPd.reply(data, aMimetype, aHTTPCode, aMapOfHeaders) : Object</key>
	 * Builds a response object suitable to provide a reply to a HTTP request for a function used with the HTTPServer.add method.
	 * It will return aMimetype (string representation) with the provided data (string format) and the aHTTPCode and the map
	 * of extra HTTP headers.
	 * </odoc>
	 */
	@JSFunction
	public Object reply(String data, String mimetype, int code, Object headers) {
		Context cx = (Context) AFCmdBase.jse.enterContext();
		Scriptable no = cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope());
		AFCmdBase.jse.exitContext();

		if(mimetype == null || mimetype.equals("undefined")) mimetype = Codes.MIME_DEFAULT_BINARY;
		if(code <= 0) code = 200;
		
		no.put("status", no, code);
		no.put("mimetype", no, mimetype);
		no.put("data", no, data);
		no.put("header", no, headers);
		
		return no;	
	}
	
	/**
	 * <odoc>
	 * <key>HTTPd.replyBytes(data, aMimetype, aHTTPCode, aMapOfHeaders) : Object</key>
	 * Builds a response object suitable to provide a reply to a HTTP request for a function used with the HTTPServer.add method.
	 * It will return aMimetype (string representation) with the provided data (as an array of bytes), the aHTTPCode and the map
	 * of extra HTTP headers.
	 * </odoc>
	 */
	@JSFunction
	public Object replyBytes(Object data, String mimetype, int code, Object headers) {
		Context cx = (Context) AFCmdBase.jse.enterContext();
		Scriptable no = cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope());
		AFCmdBase.jse.exitContext();

		if(mimetype == null || mimetype.equals("undefined")) mimetype = Codes.MIME_DEFAULT_BINARY;
		if(code <= 0) code = 200;
		
		no.put("status", no, code);
		no.put("mimetype", no, mimetype);
		no.put("data", no, (byte[]) data);
		no.put("header", no, headers);
		
		return no;			
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
	
	public static IStatus translateToNanoHTTPD(int code) {
		switch(code) {
		case 101: return com.nwu.httpd.NanoHTTPD.Response.Status.SWITCH_PROTOCOL; 
		case 200: return com.nwu.httpd.NanoHTTPD.Response.Status.OK; 
		case 201: return com.nwu.httpd.NanoHTTPD.Response.Status.CREATED; 
		case 202: return com.nwu.httpd.NanoHTTPD.Response.Status.ACCEPTED; 
		case 204: return com.nwu.httpd.NanoHTTPD.Response.Status.NO_CONTENT; 
		case 206: return com.nwu.httpd.NanoHTTPD.Response.Status.PARTIAL_CONTENT; 
		case 301: return com.nwu.httpd.NanoHTTPD.Response.Status.REDIRECT;
		case 303: return com.nwu.httpd.NanoHTTPD.Response.Status.REDIRECT_SEE_OTHER;
		case 304: return com.nwu.httpd.NanoHTTPD.Response.Status.NOT_MODIFIED; 
		case 400: return com.nwu.httpd.NanoHTTPD.Response.Status.BAD_REQUEST; 
		case 401: return com.nwu.httpd.NanoHTTPD.Response.Status.UNAUTHORIZED; 
		case 403: return com.nwu.httpd.NanoHTTPD.Response.Status.FORBIDDEN; 
		case 404: return com.nwu.httpd.NanoHTTPD.Response.Status.NOT_FOUND; 
		case 405: return com.nwu.httpd.NanoHTTPD.Response.Status.METHOD_NOT_ALLOWED;
		case 406: return com.nwu.httpd.NanoHTTPD.Response.Status.NOT_ACCEPTABLE;
		case 408: return com.nwu.httpd.NanoHTTPD.Response.Status.REQUEST_TIMEOUT;
		case 409: return com.nwu.httpd.NanoHTTPD.Response.Status.CONFLICT;
		case 416: return com.nwu.httpd.NanoHTTPD.Response.Status.RANGE_NOT_SATISFIABLE; 
		case 500: return com.nwu.httpd.NanoHTTPD.Response.Status.INTERNAL_ERROR;
		case 501: return com.nwu.httpd.NanoHTTPD.Response.Status.NOT_IMPLEMENTED;
		case 505: return com.nwu.httpd.NanoHTTPD.Response.Status.UNSUPPORTED_HTTP_VERSION;
		default: return Codes.HTTP_OK;
		}
	}
}
