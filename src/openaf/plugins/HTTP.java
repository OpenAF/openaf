package openaf.plugins;

/**
 * Core HTTP plugin
 * @author Nuno Aguiar
 *
 */
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Authenticator;
import java.net.CookieHandler;
import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.HttpURLConnection;
import java.net.PasswordAuthentication;
import java.net.URL;
import java.nio.charset.Charset;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.lang.String;
import java.util.concurrent.ConcurrentHashMap;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.io.IOUtils;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeFunction;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;

import openaf.AFCmdBase;
import openaf.SimpleLog;
import openaf.plugins.HTTPws.WebSockets;

public class HTTP extends ScriptableObject {
	protected static CookieManager ckman = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
	protected HTTPResponse output = new HTTPResponse("", -1, null, "");
	protected Object outputObj = null;
	protected Object errorObj = null;
	protected Authenticator authenticator = null;
	protected boolean forceBasic = false;
	protected String l = null;
	protected String p = null;
	protected String lpsID = null;
	static protected ConcurrentHashMap<String, LPs> lps = new ConcurrentHashMap<String, LPs>();
	
	protected class LPs {
		String l;
		String p;

		public LPs(String ll, String pp) {
			this.l = ll;
			this.p = pp;
		}
	}

	/**
	 * 
	 */
	private static final long serialVersionUID = -2025553185688930581L;

	public static class HTTPResponse {
		/**
		 * 
		 */
		public String response;
		public byte[] responseBytes;
		public int responseCode;
		public String contentType;
		public Map<String, List<String>> responseHeaders;
		public InputStream responseStream;
		
		public HTTPResponse(String response, int responseCode, Map<String, List<String>> map, String contentType) {
			this.response = response;
			this.responseCode = responseCode;
			this.responseHeaders = map;
			this.contentType = contentType;
		}
		
		public HTTPResponse(byte[] response, int responseCode, Map<String, List<String>> map, String contentType) {
			this.responseBytes = response;
			this.responseCode = responseCode;
			this.responseHeaders = map;
			this.contentType = contentType;
		}
		
		public HTTPResponse(InputStream stream, int responseCode, Map<String, List<String>> map, String contentType) {
			this.responseStream = stream;
			this.responseCode = responseCode;
			this.responseHeaders = map;
			this.contentType = contentType;
		}

	}
	
	/**
	 * 
	 */
	@Override
	public String getClassName() {
		return "HTTP";
	}

	/**
	 * <odoc>
	 * <key>HTTP.http(aURL, aRequestType, aIn, aRequestMap, isBytes, aTimeout, returnStream)</key>
	 * Builds a HTTP request for the aURL provided with aRequestType (e.g. "GET" or "POST") sending
	 * aIn body request (or "") and optionally sending aRequestMap headers and optionally specifying 
	 * if the response isBytes and providing an optional custom HTTP aTimeout.  
	 * If needed use java.lang.System.setProperty("sun.net.http.allowRestrictedHeaders", "true") to 
	 * allow you to use restricted request headers. If returnStream = true, the response will be in 
	 * the form of a JavaStream (please use the returnStream function).
	 * </odoc>
	 */
	@JSConstructor
	public void newHTTP(String url, String requestType, Object in, NativeObject request, boolean bytes, int timeout, boolean stream) throws IOException {
		exec(url, requestType, in, request, bytes, timeout, stream);
	}
	
	/**
	 * <odoc>
	 * <key>HTTP.login(aUser, aPassword, forceBasic, urlPartial)</key>
	 * Tries to build a simple password authentication with the provided aUser and aPassword (encrypted or not).
	 * By default it tries to use the Java Password Authentication but it forceBasic = true it will force basic
	 * authentication to be use. It's advisable to use urlPartial to associate a login/password to a specific
	 * URL location.
	 * </odoc>
	 */
	@JSFunction
	public void login(final String user, final String pass, boolean forceBasic, String urlPartial) {
		if (urlPartial == null || urlPartial.equals("undefined") || urlPartial.equals("")) {
			urlPartial = "default";
		}		

		if (!forceBasic) {
			lps.put(urlPartial, new LPs(user, pass));
			
			if (authenticator == null) {
				authenticator = new Authenticator() {
					public PasswordAuthentication getPasswordAuthentication() {
						URL url = getRequestingURL();
						String getKey = null;
						for(String key : lps.keySet()) {
							if (key != "default" && url.toString().startsWith(key)) getKey = key;
						}
						if (getKey == null) {
							return new PasswordAuthentication (AFCmdBase.afc.dIP(lps.get("default").l), (AFCmdBase.afc.dIP(lps.get("default").p)).toCharArray());
						} else {
							return new PasswordAuthentication (AFCmdBase.afc.dIP(lps.get(getKey).l), (AFCmdBase.afc.dIP(lps.get(getKey).p)).toCharArray());
						}
					}
				};
				Authenticator.setDefault(authenticator);
			}
		} 

		l = user;
		p = pass;
		
		//Authenticator.setDefault(authenticator);
		if (forceBasic) {
			this.forceBasic = true;
		}
		SimpleLog.log(SimpleLog.logtype.DEBUG, "HTTP connection with authentication for " + user, null);
	}
	
	/**
	 * <odoc>
	 * <key>HTTP.exec(aUrl, aRequestType, aIn, aRequestMap, isBytes, aTimeout, returnStream) : Object</key>
	 * Builds a HTTP request for the aURL provided with aRequestType (e.g. "GET" or "POST") sending
	 * aIn body request (or "") and optionally sending aRequestMap headers and optionally specifying 
	 * if the response isBytes and providing an optional custom HTTP aTimeout. 
	 * If returnStream = true the response and return value will be in the form of a JavaStream.
	 * </odoc>
	 */
	@JSFunction
	public Object exec(String url, String requestType, Object in, NativeObject request, boolean bytes, int timeout, boolean stream) throws IOException {
		Properties requestProps = new Properties();
		
		if (requestType.equals("undefined") || requestType == null) {
			requestType = "GET";
		}
		if (url.equals("undefined") || url == null) {
			return new HTTPResponse("No URL", -1, null, "");
		}
		if (in.equals("undefined") || in == null) {
			in = "";
		}
		
		if (request != null) {
			for(Object o : request.keySet()) {
				requestProps.put(o, request.get(o));
			}
		}
		
		output = request(url, requestType, in, requestProps, bytes, stream, timeout);
		Context cx = (Context) AFCmdBase.jse.enterContext();
		Scriptable no = cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope());
		AFCmdBase.jse.exitContext();

		no.put("responseCode", no, output.responseCode);
		no.put("contentType", no, output.contentType);
		
		if (stream) {
			return output.responseStream;
		}
		
		if (bytes) {
			no.put("responseBytes", no, output.responseBytes);
		} else {
			no.put("response", no, output.response);	
		}
		
		outputObj = no;
	
		return outputObj;
	}
	
	/**
	 * <odoc>
	 * <key>HTTP.get(aUrl, aIn, aRequestMap, isBytes, aTimeout, returnStream)</key>
	 * Builds a HTTP request for the aURL with a GET sending
	 * aIn body request (or "") and optionally sending aRequestMap headers and optionally specifying 
	 * if the response isBytes and providing an optional custom HTTP aTimeout. If returnStream = true, the response will be in 
	 * the form of a JavaStream (please use the returnStream function).
	 * </odoc>
	 */
	@JSFunction
	public Object get(String url, Object in, NativeObject request, boolean bytes, int timeout, boolean stream) throws IOException {
		return exec(url, "GET", in, request, bytes, timeout, stream);
	}

	/**
	 * <odoc>
	 * <key>HTTP.getBytes(aUrl, aIn, aRequestMap, aTimeout)</key>
	 * Builds a HTTP request returning bytes for the aURL with a GET sending
	 * aIn body request (or "") and optionally sending aRequestMap headers and providing an optional custom HTTP aTimeout. 
	 * </odoc>
	 */
	@JSFunction
	public Object getBytes(String url, Object in, NativeObject request, int timeout) throws IOException {
		return exec(url, "GET", in, request, true, timeout, false);
	}

	/**
	 * <odoc>
	 * <key>HTTP.getStream(aUrl, aIn, aRequestMap, aTimeout)</key>
	 * Builds a HTTP request, returning a JavaStream, for the aURL with a GET sending
	 * aIn body request (or "") and optionally sending aRequestMap headers and optionally providing a custom HTTP aTimeout. 
	 * </odoc>
	 */
	@JSFunction
	public Object getStream(String url, Object in, NativeObject request, int timeout) throws IOException {
		return exec(url, "GET", in, request, false, timeout, true);
	}
	
	/**
	 * <odoc>
	 * <key>HTTP.get(aUrl, aIn, aRequestMap, isBytes, aTimeout, returnStream)</key>
	 * Builds a HTTP request for the aURL with a POST sending
	 * aIn body request (or "") and optionally sending aRequestMap headers and optionally specifying 
	 * if the response isBytes and providing an optional custom HTTP aTimeout. If returnStream = true, the response will be in 
	 * the form of a JavaStream (please use the returnStream function).
	 * </odoc>
	 */
	@JSFunction
	public Object post(String url, Object in, NativeObject request, boolean bytes, int timeout, boolean stream) throws IOException {
		return exec(url, "POST", in, request, bytes, timeout, stream);
	}
	
	/**
	 * <odoc>
	 * <key>HTTP.getResponse() : Object</key>
	 * Returns the HTTP request result string or array of bytes. 
	 * </odoc>
	 */
	@JSFunction
	public Object getResponse() {
		return outputObj;
	}
	
	/**
	 * <odoc>
	 * <key>HTTP.getErrorResponse() : Object</key>
	 * Returns the HTTP request error result string. 
	 * </odoc>
	 */
	@JSFunction
	public Object getErrorResponse() {
		return errorObj;
	}
	
	/**
	 * <odoc>
	 * <key>HTTP.responseCode() : Number</key>
	 * Returns the HTTP request response code (e.g. 404, 500, ...)
	 * </odoc>
	 */
	@JSFunction
	public long responseCode() {
		return output.responseCode;
	}
	
	/**
	 * <odoc>
	 * <key>HTTP.responseHeaders() : Map</key>
	 * Returns a Map with the response headers of the HTTP request.
	 * </odoc>
	 */
	@JSFunction
	public Map<String, List<String>> responseHeaders() {
		return output.responseHeaders;
	}
	
	/**
	 * <odoc>
	 * <key>HTTP.responseType() : String</key>
	 * Returns the HTTP request response content mime type.
	 * </odoc>
	 */
	@JSFunction
	public String responseType() {
		return output.contentType;
	}
	
	/**
	 * <odoc>
	 * <key>HTTP.responseStream() : JavaStream</key>
	 * Returns a JavaStream if the option of returnStream = true in the previous instance function called.
	 * </odoc>
	 */
	@JSFunction
	public Object responseStream() {
		return output.responseStream;
	}
	
	/**
	 * <odoc>
	 * <key>HTTP.responseBytes() : ArrayOfBytes</key>
	 * Returns the HTTP request result as an array of bytes (if isBytes = true)
	 * </odoc>
	 */
	@JSFunction
	public Object responseBytes() {
		return output.responseBytes;
	}
	
	/**
	 * <odoc>
	 * <key>HTTP.response() : String</key>
	 * Returns the HTTP request result as a string (if isBytes = false or default)
	 * </odoc>
	 */
	@JSFunction
	public String response() {
		return output.response;
	}
	
	/**
	 * <odoc>
	 * <key>HTTP.wsConnect(anURL, onConnect, onMsg, onError, onClose, aTimeout, supportSelfSigned) : WebSocketClient</key>
	 * Tries to establish a websocket connection (ws or wss) and returns a jetty WebSocketClient java object.
	 * As callbacks you should defined onConnect, onMsg, onError and onClose. The onConnect callback will 
	 * provide, as argument, the created session that you should use to send data; the onMsg callback will
	 * provide, as arguments, aType (either "text" or "bytes"), aPayload (string or array of bytes) and an offset
	 * and length (in case type is "bytes"); the onError callback will provide the cause; the onClose callback
	 * will provide aStatusCode and aReason. You can optionally provide aTimeout (number) and indicate if self signed SSL
	 * certificates should be accepted (supportSelfSigned = true). Example:\
	 * \
	 * plugin("HTTP");\
	 * var session; var output = "";\
	 * var client = (new HTTP()).wsConnect("ws://echo.websocket.org",\
	 *   function(aSession) { log("Connected"); session = aSession; },\
	 *   function(aType, aPayload, aOffset, aLength) { if (aType == "text") output += aPayload; },\
	 *   function(aCause) { logErr(aCause); },\
	 *   function(aStatusCode, aReason) { log("Closed (" + aReason + ")"); }\
	 * );\
	 * session.getRemote().sendString("Hello World!");\
	 * while(output.length &lt; 1) { sleep(100); };\
	 * client.stop();\
	 * print(output);\
	 * \
	 * NOTE: this functionality is only available if used with JVM >= 1.8\
	 * \
	 * </odoc>
	 */
	@JSFunction
	public Object wsConnect(String anURL, NativeFunction onConnect, NativeFunction onMsg, NativeFunction onError, NativeFunction onClose, Object aTimeout, boolean supportSelfSigned) throws Exception {
		return WebSockets.wsConnect(authenticator, l, p, anURL, onConnect, onMsg, onError, onClose, aTimeout, supportSelfSigned);
	}

	/**
	 * <odoc>
	 * <key>HTTP.wsClient(anURL, onConnect, onMsg, onError, onClose, aTimeout, supportSelfSigned) : WebSocketsReply</key>
	 * Tries to establish a websocket connection (ws or wss) and returns a jetty WebSocketClient java object.
	 * As callbacks you should defined onConnect, onMsg, onError and onClose. The onConnect callback will 
	 * provide, as argument, the created session that you should use to send data; the onMsg callback will
	 * provide, as arguments, aType (either "text" or "bytes"), aPayload (string or array of bytes) and an offset
	 * and length (in case type is "bytes"); the onError callback will provide the cause; the onClose callback
	 * will provide aStatusCode and aReason. You can optionally provide aTimeout (number) and indicate if self signed SSL
	 * certificates should be accepted (supportSelfSigned = true). Example:\
	 * \
	 * plugin("HTTP");\
	 * var session; var output = "";\
	 * var res = (new HTTP()).wsClient("ws://echo.websocket.org",\
	 *   function(aSession) { log("Connected"); session = aSession; },\
	 *   function(aType, aPayload, aOffset, aLength) { if (aType == "text") output += aPayload; },\
	 *   function(aCause) { logErr(aCause); },\
	 *   function(aStatusCode, aReason) { log("Closed (" + aReason + ")"); }\
	 * );\
	 * session.getRemote().sendString("Hello World!");\
	 * while(output.length &lt; 1) { sleep(100); };\
	 * res.client.stop();\
	 * print(output);\
	 * \
	 * NOTE: this functionality is only available if used with JVM >= 1.8\
	 * \
	 * </odoc>
	 */
	@JSFunction
	public Object wsClient(String anURL, NativeFunction onConnect, NativeFunction onMsg, NativeFunction onError, NativeFunction onClose, Object aTimeout, boolean supportSelfSigned) throws Exception {
		return WebSockets.wsClient(authenticator, l, p, anURL, onConnect, onMsg, onError, onClose, aTimeout, supportSelfSigned);
	}

	/**
	 * 
	 * @param aURL
	 * @param method
	 * @param request
	 * @param in
	 * @return
	 * @throws IOException
	 */
	protected HTTPResponse request(String aURL, String method, Object in, Properties request, boolean bytes, boolean stream, int timeout) throws IOException {
		//if (this.authenticator != null && !forceBasic) Authenticator.setDefault(this.authenticator);
		CookieHandler.setDefault(ckman);
		
		URL url = new URL(aURL);
		
		HttpURLConnection con = (HttpURLConnection) url.openConnection();
		con.setRequestMethod(method);
	
		//con.addRequestProperty("Accept-Charset", Charset.defaultCharset().displayName());
		con.addRequestProperty("host", url.getHost());
		con.addRequestProperty("Accept", "*/*");
		
		if (request != null) {
			for(Object key : request.keySet()) {
				con.addRequestProperty((String) key, (String) request.get(key));
			}
		}
		
		if (forceBasic) {
			con.addRequestProperty("Authorization", "Basic " + new String(Base64.encodeBase64(new String(l + ":" + p).getBytes())));
		}
		
		if (timeout > 0) con.setConnectTimeout(timeout);
		if (timeout > 0) con.setReadTimeout(timeout);
		
		InputStream is = null;
		
		if (!(in instanceof org.mozilla.javascript.Undefined))
			if (in instanceof String) {
				if (!in.equals("")) {
					con.setDoOutput(true);
					con.addRequestProperty("content-length", String.valueOf(((String) in).length()));
					OutputStream os = con.getOutputStream();
					IOUtils.write((String) in, os, Charset.defaultCharset());
					os.flush();
					os.close();
					is = con.getInputStream();
					//con.setDoInput(true);
					//IOUtils.closeQuietly(con.getOutputStream());
				}
			} else {
				con.setDoOutput(true);
				con.addRequestProperty("content-length", String.valueOf(((byte[]) in).length));
				OutputStream os = con.getOutputStream();
				IOUtils.write((byte[]) in, os);
				os.flush();
				os.close();
				is = con.getInputStream();
				//con.setDoInput(true);
				//IOUtils.closeQuietly(con.getOutputStream());
			}
		
		//con.setDoInput(true);
		if (is == null) {
			con.setDoInput(true);
			is = con.getInputStream();
		}
		
		//con.connect(); 
		try {
			SimpleLog.log(SimpleLog.logtype.DEBUG, "URL = " + aURL + "; method = " + method + "; cookiesize = " + ckman.getCookieStore().getCookies().size(),  null);
			//SimpleLog.log(SimpleLog.logtype.DEBUG, "URL = " + aURL + "; method = " + method + "; responsecode = " + con.getResponseCode() + "; cookiesize = " + ckman.getCookieStore().getCookies().size(), null);
		
			//con.setDoInput(true);
			
			HTTPResponse r;		
			int responseCode = con.getResponseCode();
			Map<String, List<String>> headerFields = con.getHeaderFields();
			String contentType = con.getContentType();
			
			if (bytes) {
				if (stream)
					r = new HTTPResponse(is, responseCode, headerFields, contentType);
				else
					r = new HTTPResponse(IOUtils.toByteArray(is), responseCode, headerFields, contentType);
			} else {
				if (stream)
					r = new HTTPResponse(is, responseCode, headerFields, contentType);
				else
					r = new HTTPResponse(IOUtils.toString(is, Charset.defaultCharset()), responseCode, headerFields, contentType);
			}
			
			//if (this.authenticator != null) 
			//	Authenticator.setDefault(null);
			
			return r;
		} catch(Exception e) {
			if (con.getErrorStream() != null) {
				errorObj = IOUtils.toString(con.getErrorStream(), Charset.defaultCharset());
				SimpleLog.log(SimpleLog.logtype.DEBUG, "Response = " + IOUtils.toString(con.getErrorStream(), Charset.defaultCharset()), e);
			} else {
				errorObj = IOUtils.toString(con.getInputStream(), Charset.defaultCharset());
				SimpleLog.log(SimpleLog.logtype.DEBUG, "Response = " + IOUtils.toString(con.getErrorStream(), Charset.defaultCharset()), e);
			}
			throw e;
		}
	}
}
