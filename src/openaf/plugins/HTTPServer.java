package openaf.plugins;

/**
 * 
 * Copyright 2025 Nuno Aguiar
 * 
 * HTTPServer plugin with dual implementation support:
 * 1. Legacy NWU HTTPd implementation (default)
 * 2. Java built-in HttpServer implementation
 * 
 * To use Java implementation, set: HTTPServer.USE_JAVA_HTTP_SERVER = true
 * 
 * Features supported by both implementations:
 * - HTTP and HTTPS support
 * - Custom request handlers
 * - Static file serving
 * - Echo and status endpoints
 * - Session management
 * 
 * Features only supported by NWU implementation:
 * - WebSocket support
 * - XDT Server
 * - Direct access to underlying HTTP server object
 *
 */
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.lang.reflect.InvocationTargetException;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.logging.Level;
import java.lang.String;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpsConfigurator;
import com.sun.net.httpserver.HttpsServer;
import javax.net.ssl.SSLContext;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeFunction;
import org.mozilla.javascript.NativeJavaObject;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.mozilla.javascript.UniqueTag;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;

import openaf.AFCmdBase;
import openaf.SimpleLog;
import openaf.SimpleLog.logtype;
import openaf.plugins.HTTPd.JSResponse;

import com.nwu.httpd.Codes;
import com.nwu.httpd.IHTTPd;
import com.nwu.httpd.IWebSock;
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
	
	// Flag to control which HTTP server implementation to use
	// // public static String DEFAULT_HTTP_SERVER = "java"; // Use Java built-in HttpServer
	public static String DEFAULT_HTTP_SERVER = "nwu";
	protected boolean USE_JAVA_HTTP_SERVER = DEFAULT_HTTP_SERVER.equals("java") ? true: false;
	
	// NWU implementation fields
	protected IHTTPd httpd;
	
	// Java implementation fields  
	protected HttpServer javaHttpServer;
	protected HttpsServer javaHttpsServer;
	protected boolean isSecure = false;
	protected Map<String, HttpHandler> javaHandlers = new ConcurrentHashMap<>();
	protected String defaultHandler = null;
	
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
	 * <key>HTTPd.HTTPd(aPort, aLocalInteface, keyStorePath, keyStorePassword, logFunction, webSockets, aTimeout, aVersion)</key>
	 * Creates a HTTP server instance on the provided port and optionally on the identified local interface.
	 * If the port provided is 0 or negative a random port will be assigned. To determine what this port is 
	 * you can use the function HTTPServer.getPort().
	 * If aVersion = "java" is provided the Java built-in HttpServer implementation will be used.
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
	 */
	@JSConstructor
	public void newHTTPd(int port, Object host, String keyStorePath, Object password, Object errorFunction, Object ws, int timeout, String version) throws IOException {
		if (port <= 0) {
			port = findRandomOpenPortOnAllLocalInterfaces();
		}

		if (version.equals("java")) {
			USE_JAVA_HTTP_SERVER = true;
		} else {
			USE_JAVA_HTTP_SERVER = DEFAULT_HTTP_SERVER.equals("java");
		}

		serverport = port;
		
		if (USE_JAVA_HTTP_SERVER) {
			// Use Java built-in HTTP server implementation
			initializeJava21HttpServer(port, host, keyStorePath, password, errorFunction);
		} else {
			// Use existing NWU implementation
			initializeNWUHttpServer(port, host, keyStorePath, password, errorFunction, ws, timeout);
		}
		
		id = Integer.toString(port) + this.hashCode();
	}
	
	private void initializeJava21HttpServer(int port, Object host, String keyStorePath, Object password, Object errorFunction) throws IOException {
		InetSocketAddress address;
		if (host == null || host instanceof Undefined) {
			address = new InetSocketAddress(port);
		} else {
			address = new InetSocketAddress((String) host, port);
		}
		
		if (keyStorePath != null && !keyStorePath.equals("undefined") && 
			password != null && !(password instanceof Undefined)) {
			// HTTPS server
			javaHttpsServer = HttpsServer.create(address, 0);
			
			try {
				// Create SSL context
				SSLContext sslContext = SSLContext.getInstance("TLS");
				
				// Load keystore
				java.security.KeyStore ks = java.security.KeyStore.getInstance("JKS");
				char[] passwordChars = AFCmdBase.afc.dIP(((String) password)).toCharArray();
				
				if ((new java.io.File(keyStorePath)).exists()) {
					try (java.io.FileInputStream fis = new java.io.FileInputStream(keyStorePath)) {
						ks.load(fis, passwordChars);
					}
				} else {
					try (InputStream is = HTTPServer.class.getResourceAsStream(keyStorePath)) {
						ks.load(is, passwordChars);
					}
				}
				
				javax.net.ssl.KeyManagerFactory kmf = javax.net.ssl.KeyManagerFactory.getInstance("SunX509");
				kmf.init(ks, passwordChars);
				
				sslContext.init(kmf.getKeyManagers(), null, null);
				javaHttpsServer.setHttpsConfigurator(new HttpsConfigurator(sslContext));
				
				javaHttpsServer.setExecutor(Executors.newCachedThreadPool());
				javaHttpsServer.start();
				isSecure = true;
				
			} catch (Exception e) {
				throw new IOException("Failed to configure HTTPS", e);
			}
		} else {
			// HTTP server
			javaHttpServer = HttpServer.create(address, 0);
			javaHttpServer.setExecutor(Executors.newCachedThreadPool());
			javaHttpServer.start();
			isSecure = false;
		}
	}
	
	private void initializeNWUHttpServer(int port, Object host, String keyStorePath, Object password, Object errorFunction, Object ws, int timeout) throws IOException {
		if (ws instanceof NativeJavaObject) ws = ((NativeJavaObject) ws).unwrap();
		
		if (host == null || host instanceof Undefined) {
			if (ws == null || ws instanceof Undefined) 
				httpd = new com.nwu.httpd.HTTPd((Log) new HLog(port, errorFunction), port);
			else
				httpd = new com.nwu.httpd.HTTPWSd((Log) new HLog(port, errorFunction), port, (IWebSock) ws, timeout);
		} else {
			if (ws == null || ws instanceof Undefined)
				httpd = new com.nwu.httpd.HTTPd((Log) new HLog(port, errorFunction), (String) host, port);
			else
				httpd = new com.nwu.httpd.HTTPWSd((Log) new HLog(port, errorFunction), (String) host, port, (IWebSock) ws, timeout);
		}

		if (keyStorePath != null && !keyStorePath.equals("undefined") &&
			password != null && !(password instanceof Undefined)) {
			httpd.stop();
			if ((new java.io.File(keyStorePath)).exists()) {
				httpd.makeSecure(com.nwu.httpd.HTTPd.makeLocalSSLSocketFactory(keyStorePath, AFCmdBase.afc.dIP(((String) password)).toCharArray()), null);
			} else {
				httpd.makeSecure(com.nwu.httpd.HTTPd.makeSSLSocketFactory(keyStorePath, AFCmdBase.afc.dIP(((String) password)).toCharArray()), null);
			}
			
			httpd.start();
		}
		
		httpd.addToGzipAccept("text/plain");
		httpd.addToGzipAccept("application/javascript");
		httpd.addToGzipAccept("text/css");
		httpd.addToGzipAccept("application/json");
		httpd.addToGzipAccept("application/xml");
		httpd.addToGzipAccept("text/richtext");
		httpd.addToGzipAccept("text/html");
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
		if (USE_JAVA_HTTP_SERVER) {
			if (javaHttpServer != null) {
				javaHttpServer.stop(0);
			}
			if (javaHttpsServer != null) {
				javaHttpsServer.stop(0);
			}
		} else {
			if (httpd != null) {
				httpd.stop();
			}
		}
	}

	@JSFunction
	public boolean isAlive() {
		if (USE_JAVA_HTTP_SERVER) {
			if (isSecure && javaHttpsServer != null) {
				return javaHttpsServer.getAddress() != null;
			} else if (javaHttpServer != null) {
				return javaHttpServer.getAddress() != null;
			}
			return false;
		} else {
			return httpd != null && httpd.isAlive();
		}
	}

	@JSFunction
	public void addWS(String uri) {
		if (USE_JAVA_HTTP_SERVER) {
			// WebSocket support would require additional implementation
			// For now, throw an exception indicating it's not supported
			throw new UnsupportedOperationException("WebSocket support not implemented for Java HTTP server");
		} else {
			if (httpd != null) {
				httpd.addToWsAccept(uri);
			}
		}
	}

	@JSFunction
	public IHTTPd getHTTPObj() {
		if (USE_JAVA_HTTP_SERVER) {
			throw new UnsupportedOperationException("getHTTPObj() not available for Java HTTP server implementation");
		}
		return httpd;
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
		if (USE_JAVA_HTTP_SERVER) {
			// Remove previous handler/context if already exists for this URI
			if (javaHandlers.containsKey(uri)) {
				if (isSecure && javaHttpsServer != null) {
					javaHttpsServer.removeContext(uri);
				} else if (javaHttpServer != null) {
					javaHttpServer.removeContext(uri);
				}
				javaHandlers.remove(uri);
			}

			HttpHandler echoHandler = new HttpHandler() {
				@Override
				public void handle(HttpExchange exchange) throws IOException {
					StringBuilder response = new StringBuilder();
					response.append("Method: ").append(exchange.getRequestMethod()).append("\n");
					response.append("URI: ").append(exchange.getRequestURI()).append("\n");
					response.append("Headers:\n");
					exchange.getRequestHeaders().forEach((key, values) -> {
						response.append("  ").append(key).append(": ").append(String.join(", ", values)).append("\n");
					});
					
					try (InputStream is = exchange.getRequestBody()) {
						byte[] body = is.readAllBytes();
						if (body.length > 0) {
							response.append("Body:\n").append(new String(body, StandardCharsets.UTF_8));
						}
					}
					
					byte[] responseBytes = response.toString().getBytes(StandardCharsets.UTF_8);
					exchange.getResponseHeaders().set("Content-Type", "text/plain");
					exchange.sendResponseHeaders(200, responseBytes.length);
					try (OutputStream os = exchange.getResponseBody()) {
						os.write(responseBytes);
					}
				}
			};
			
			if (isSecure && javaHttpsServer != null) {
				javaHttpsServer.createContext(uri, echoHandler);
			} else if (javaHttpServer != null) {
				javaHttpServer.createContext(uri, echoHandler);
			}
		} else {
			httpd.registerURIResponse(uri, EchoResponse.class, null);
		}
	}
	
	/**
	 * <odoc>
	 * <key>HTTPd.addStatus(aURI)</key>
	 * Adds a status responder to the provided URI. Useful for debugging proposes
	 * </odoc>
	 */
	@JSFunction
	public void addStatus(String uri) {
		if (USE_JAVA_HTTP_SERVER) {
			// Remove previous handler/context if already exists for this URI
			if (javaHandlers.containsKey(uri)) {
				if (isSecure && javaHttpsServer != null) {
					javaHttpsServer.removeContext(uri);
				} else if (javaHttpServer != null) {
					javaHttpServer.removeContext(uri);
				}
				javaHandlers.remove(uri);
			}

			HttpHandler statusHandler = new HttpHandler() {
				@Override
				public void handle(HttpExchange exchange) throws IOException {
					String response = "Server Status: OK\nPort: " + serverport + "\nTimestamp: " + new java.util.Date();
					byte[] responseBytes = response.getBytes(StandardCharsets.UTF_8);
					exchange.getResponseHeaders().set("Content-Type", "text/plain");
					exchange.sendResponseHeaders(200, responseBytes.length);
					try (OutputStream os = exchange.getResponseBody()) {
						os.write(responseBytes);
					}
				}
			};
			
			if (isSecure && javaHttpsServer != null) {
				javaHttpsServer.createContext(uri, statusHandler);
			} else if (javaHttpServer != null) {
				javaHttpServer.createContext(uri, statusHandler);
			}
		} else {
			httpd.registerURIResponse(uri, StatusResponse.class, null);
		}
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
		
		if (USE_JAVA_HTTP_SERVER) {
			// Remove previous handler/context if already exists for this URI
			if (javaHandlers.containsKey(uri)) {
				if (isSecure && javaHttpsServer != null) {
					javaHttpsServer.removeContext(uri);
				} else if (javaHttpServer != null) {
					javaHttpServer.removeContext(uri);
				}
				javaHandlers.remove(uri);
			}

			Java21HttpHandler handler = new Java21HttpHandler(uri, callback, serverport);
			javaHandlers.put(uri, handler);

			if (isSecure && javaHttpsServer != null) {
				javaHttpsServer.createContext(uri, handler);
			} else if (javaHttpServer != null) {
				javaHttpServer.createContext(uri, handler);
			}
		} else {
			Map<String, String> props = new HashMap<String, String>();
			props.put("uri", uri);
			
			httpd.registerURIResponse(uri, JSResponse.class, props);
		}
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
		if (USE_JAVA_HTTP_SERVER) {
			defaultHandler = uri;
			HttpHandler defaultRedirectHandler = new HttpHandler() {
				@Override
				public void handle(HttpExchange exchange) throws IOException {
					String location = uri;
					exchange.getResponseHeaders().set("Location", location);
					exchange.sendResponseHeaders(302, -1);
				}
			};

			// Remove previous handler/context for "/" if it exists
			if (javaHandlers.containsKey("/")) {
				if (isSecure && javaHttpsServer != null) {
					javaHttpsServer.removeContext("/");
				} else if (javaHttpServer != null) {
					javaHttpServer.removeContext("/");
				}
				javaHandlers.remove("/");
			}

			javaHandlers.put("/", defaultRedirectHandler);

			if (isSecure && javaHttpsServer != null) {
				javaHttpsServer.createContext("/", defaultRedirectHandler);
			} else if (javaHttpServer != null) {
				javaHttpServer.createContext("/", defaultRedirectHandler);
			}
		} else {
			httpd.setDefaultResponse(uri);
		}
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
		if (USE_JAVA_HTTP_SERVER) {
			// Remove previous handler/context if already exists for this URI
			if (javaHandlers.containsKey(uri)) {
				if (isSecure && javaHttpsServer != null) {
					javaHttpsServer.removeContext(uri);
				} else if (javaHttpServer != null) {
					javaHttpServer.removeContext(uri);
				}
				javaHandlers.remove(uri);
			}

			HttpHandler fileHandler = new HttpHandler() {
				@Override
				public void handle(HttpExchange exchange) throws IOException {
					String path = exchange.getRequestURI().getPath();
					String relativePath = path.substring(uri.length());
					if (relativePath.startsWith("/")) {
						relativePath = relativePath.substring(1);
					}
					
					java.io.File file = new java.io.File(filepath, relativePath);
					
					if (!file.exists()) {
						String response = "File not found";
						exchange.sendResponseHeaders(404, response.length());
						try (OutputStream os = exchange.getResponseBody()) {
							os.write(response.getBytes(StandardCharsets.UTF_8));
						}
						return;
					}
					
					if (file.isDirectory()) {
						// List directory contents
						StringBuilder response = new StringBuilder();
						response.append("<html><body><h2>Directory: ").append(relativePath).append("</h2><ul>");
						java.io.File[] files = file.listFiles();
						if (files != null) {
							for (java.io.File f : files) {
								String name = f.getName();
								if (f.isDirectory()) {
									name += "/";
								}
								response.append("<li><a href=\"").append(name).append("\">").append(name).append("</a></li>");
							}
						}
						response.append("</ul></body></html>");
						
						byte[] responseBytes = response.toString().getBytes(StandardCharsets.UTF_8);
						exchange.getResponseHeaders().set("Content-Type", "text/html");
						exchange.sendResponseHeaders(200, responseBytes.length);
						try (OutputStream os = exchange.getResponseBody()) {
							os.write(responseBytes);
						}
					} else {
						// Serve file
						String contentType = java.net.URLConnection.guessContentTypeFromName(file.getName());
						if (contentType == null) {
							contentType = "application/octet-stream";
						}
						
						exchange.getResponseHeaders().set("Content-Type", contentType);
						exchange.sendResponseHeaders(200, file.length());
						
						try (OutputStream os = exchange.getResponseBody();
							 java.io.FileInputStream fis = new java.io.FileInputStream(file)) {
							byte[] buffer = new byte[8192];
							int bytesRead;
							while ((bytesRead = fis.read(buffer)) != -1) {
								os.write(buffer, 0, bytesRead);
							}
						}
					}
				}
			};
			
			if (isSecure && javaHttpsServer != null) {
				javaHttpsServer.createContext(uri, fileHandler);
			} else if (javaHttpServer != null) {
				javaHttpServer.createContext(uri, fileHandler);
			}
		} else {
			Map<String, String> props = new HashMap<String, String>();
			props.put("publichtml", filepath);
			httpd.registerURIResponse(uri, FileResponse.class, props);
		}
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
		if (USE_JAVA_HTTP_SERVER) {
			throw new UnsupportedOperationException("XDT Server not implemented for Java HTTP server");
		} else {
			Map<String, String> props = new HashMap<String, String>();
			props.put("uri", uri);
			
			if (AFCmdBase.afcmd.equals("AFCmdWeDo")) {
				Class<?> cl = Class.forName("openaf.plugins.HTTPd.XDTServerResponse");
				cl.getDeclaredMethod("setAuthfunction", NativeFunction.class).invoke(this, authFunction);
				cl.getDeclaredMethod("setOpsfunction", NativeFunction.class).invoke(this, opsBroker);
				
				httpd.registerURIResponse(uri, cl, props);
			}
		}
	}
	
	/**
	 * <odoc>
	 * <key>HTTPd.replyOKText(data, aMapOfHeaders) : Object</key>
	 * Builds a response object suitable to provide a reply to a HTTP request for a function used with the HTTPServer.add method.
	 * It will return a text mimetype with the provided data and a HTTP code of OK. Also you can provide the map
	 * of extra HTTP headers.
	 * </odoc>
	 */
	@JSFunction
	public Object replyOKText(String data, Object headers) {
		Context cx = (Context) AFCmdBase.jse.enterContext();
		Scriptable no = cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope());
		AFCmdBase.jse.exitContext();
		
		no.put("status", no, 200);
		no.put("mimetype", no, Codes.MIME_PLAINTEXT);
		no.put("data", no, data);
		no.put("header", no, headers);
		
		return no;
	}
	
	/**
	 * <odoc>
	 * <key>HTTPd.replyOKXML(data, aMapOfHeaders) : Object</key>
	 * Builds a response object suitable to provide a reply to a HTTP request for a function used with the HTTPServer.add method.
	 * It will return a XML mimetype with the provided data (in string format) and a HTTP code of OK. Also you can provide the map
	 * of extra HTTP headers.
	 * </odoc>
	 */
	@JSFunction
	public Object replyOKXML(String data, Object headers) {
		Context cx = (Context) AFCmdBase.jse.enterContext();
		Scriptable no = cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope());
		AFCmdBase.jse.exitContext();
		
		no.put("status", no, 200);
		no.put("mimetype", no, "text/xml");
		no.put("data", no, data);
		no.put("header", no, headers);
		
		return no;
	}
	
	/**
	 * <odoc>
	 * <key>HTTPd.replyOKHTML(data, aMapOfHeaders) : Object</key>
	 * Builds a response object suitable to provide a reply to a HTTP request for a function used with the HTTPServer.add method.
	 * It will return a HTML mimetype with the provided data (in string format) and a HTTP code of OK. Also you can provide the map
	 * of extra HTTP headers.
	 * </odoc>
	 */
	@JSFunction
	public Object replyOKHTML(String data, Object headers) {
		Context cx = (Context) AFCmdBase.jse.enterContext();
		Scriptable no = cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope());
		AFCmdBase.jse.exitContext();
		
		no.put("status",  no, 200);
		no.put("mimetype", no, Codes.MIME_HTML);
		no.put("data", no, data);
		no.put("header", no, headers);
		
		return no;
	}

	/**
	 * <odoc>
	 * <key>HTTPd.replyOKJSON(data, aMapOfHeaders) : Object</key>
	 * Builds a response object suitable to provide a reply to a HTTP request for a function used with the HTTPServer.add method.
	 * It will return a JSON mimetype with the provided data (in string format) and a HTTP code of OK. Also you can provide the map
	 * of extra HTTP headers.
	 * </odoc>
	 */
	@JSFunction
	public Object replyOKJSON(String data, Object headers) {
		Context cx = (Context) AFCmdBase.jse.enterContext();
		Scriptable no = cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope());
		AFCmdBase.jse.exitContext();
		
		no.put("status", no, 200);
		no.put("mimetype", no, Codes.MIME_JSON);
		no.put("data", no, data);
		no.put("header", no, headers);

		return no;
	}
	
	/**
	 * <odoc>
	 * <key>HTTPd.replyOKBin(data, aMapOfHeaders) : Object</key>
	 * Builds a response object suitable to provide a reply to a HTTP request for a function used with the HTTPServer.add method.
	 * It will return application/octet-stream mimetype with the provided data (as an array of bytes) and a HTTP code of OK.  Also you can provide the map
	 * of extra HTTP headers.
	 * </odoc>
	 */
	@JSFunction
	public Object replyOKBin(String data, Object headers) {
		Context cx = (Context) AFCmdBase.jse.enterContext();
		Scriptable no = cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope());
		AFCmdBase.jse.exitContext();

		no.put("status", no, 200);
		no.put("mimetype", no, Codes.MIME_DEFAULT_BINARY);
		no.put("data", no, data);
		no.put("header", no, headers);

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
		if (data instanceof org.mozilla.javascript.NativeJavaArray) {
			data = ((org.mozilla.javascript.NativeJavaArray) data).unwrap();
		}

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
	 * <key>HTTPd.replyStream(stream, aMimetype, aHTTPCode, aMapOfHeaders) : Object</key>
	 * Builds a response object suitable to provide a reply to a HTTP request for a function used with the HTTPServer.add method.
	 * It will return aMimetype (string representation) with the provided input stream, the aHTTPCode and the map
	 * of extra HTTP headers.
	 * </odoc>
	 */
	@JSFunction
	public Object replyStream(Object data, String mimetype, int code, Object headers) {
		Context cx = (Context) AFCmdBase.jse.enterContext();
		Scriptable no = cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope());
		AFCmdBase.jse.exitContext();

		if(mimetype == null || mimetype.equals("undefined")) mimetype = Codes.MIME_DEFAULT_BINARY;
		if(code <= 0) code = 200;

		if (data instanceof NativeJavaObject) data = ((NativeJavaObject) data).unwrap();
		
		no.put("status", no, code);
		no.put("mimetype", no, mimetype);
		no.put("stream", no, data);
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
		return com.nwu.httpd.NanoHTTPD.Response.Status.lookup(code);
		/*
		switch(code) {
		case 101: return com.nwu.httpd.NanoHTTPD.Response.Status.SWITCH_PROTOCOL; 
		case 200: return com.nwu.httpd.NanoHTTPD.Response.Status.OK; 
		case 201: return com.nwu.httpd.NanoHTTPD.Response.Status.CREATED; 
		case 202: return com.nwu.httpd.NanoHTTPD.Response.Status.ACCEPTED; 
		case 204: return com.nwu.httpd.NanoHTTPD.Response.Status.NO_CONTENT; 
		case 206: return com.nwu.httpd.NanoHTTPD.Response.Status.PARTIAL_CONTENT; 
		case 207: return com.nwu.httpd.NanoHTTPD.Response.Status.MULTI_STATUS;
		case 301: return com.nwu.httpd.NanoHTTPD.Response.Status.REDIRECT;
		case 302: return com.nwu.httpd.NanoHTTPD.Response.Status.FOUND;
		case 303: return com.nwu.httpd.NanoHTTPD.Response.Status.REDIRECT_SEE_OTHER;
		case 304: return com.nwu.httpd.NanoHTTPD.Response.Status.NOT_MODIFIED; 
		case 307: return com.nwu.httpd.NanoHTTPD.Response.Status.TEMPORARY_REDIRECT;
		case 400: return com.nwu.httpd.NanoHTTPD.Response.Status.BAD_REQUEST; 
		case 401: return com.nwu.httpd.NanoHTTPD.Response.Status.UNAUTHORIZED; 
		case 403: return com.nwu.httpd.NanoHTTPD.Response.Status.FORBIDDEN; 
		case 404: return com.nwu.httpd.NanoHTTPD.Response.Status.NOT_FOUND; 
		case 405: return com.nwu.httpd.NanoHTTPD.Response.Status.METHOD_NOT_ALLOWED;
		case 406: return com.nwu.httpd.NanoHTTPD.Response.Status.NOT_ACCEPTABLE;
		case 408: return com.nwu.httpd.NanoHTTPD.Response.Status.REQUEST_TIMEOUT;
		case 409: return com.nwu.httpd.NanoHTTPD.Response.Status.CONFLICT;
		case 410: return com.nwu.httpd.NanoHTTPD.Response.Status.GONE;
		case 411: return com.nwu.httpd.NanoHTTPD.Response.Status.LENGTH_REQUIRED;
		case 412: return com.nwu.httpd.NanoHTTPD.Response.Status.PRECONDITION_FAILED;
		case 413: return com.nwu.httpd.NanoHTTPD.Response.Status.PAYLOAD_TOO_LARGE;
		case 415: return com.nwu.httpd.NanoHTTPD.Response.Status.UNSUPPORTED_MEDIA_TYPE;
		case 416: return com.nwu.httpd.NanoHTTPD.Response.Status.RANGE_NOT_SATISFIABLE; 
		case 417: return com.nwu.httpd.NanoHTTPD.Response.Status.EXPECTATION_FAILED;
		case 429: return com.nwu.httpd.NanoHTTPD.Response.Status.TOO_MANY_REQUESTS;
		case 500: return com.nwu.httpd.NanoHTTPD.Response.Status.INTERNAL_ERROR;
		case 501: return com.nwu.httpd.NanoHTTPD.Response.Status.NOT_IMPLEMENTED;
		case 503: return com.nwu.httpd.NanoHTTPD.Response.Status.SERVICE_UNAVAILABLE;
		case 505: return com.nwu.httpd.NanoHTTPD.Response.Status.UNSUPPORTED_HTTP_VERSION;
		default: return Codes.HTTP_OK;
		}*/
	}
	
	/**
	 * Custom HttpHandler implementation for Java HTTP server
	 */
	public class Java21HttpHandler implements HttpHandler {
		private final NativeFunction callback;
		
		public Java21HttpHandler(String uri, NativeFunction callback, int port) {
			this.callback = callback;
		}
		
		@Override
		public void handle(HttpExchange exchange) throws IOException {
			try {
				// Convert HttpExchange to request object similar to NWU implementation
				Object request = convertHttpExchangeToRequest(exchange);
				
				// Call the JavaScript callback
				Context cx = (Context) AFCmdBase.jse.enterContext();
				Object result = null;
				try {
					result = callback.call(cx, (Scriptable) AFCmdBase.jse.getGlobalscope(), 
						cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope()), new Object[] { request });
				} finally {
					AFCmdBase.jse.exitContext();
				}
				
				// Convert result to HTTP response
				sendResponse(exchange, result);
				
			} catch (Exception e) {
				// Send error response
				String response = "Internal Server Error: " + e.getMessage();
				exchange.sendResponseHeaders(500, response.length());
				try (OutputStream os = exchange.getResponseBody()) {
					os.write(response.getBytes(StandardCharsets.UTF_8));
				}
				System.err.println("Error handling request: " + e.getMessage());
			}
		}
		
		private Object convertHttpExchangeToRequest(HttpExchange exchange) {
			Context cx = (Context) AFCmdBase.jse.enterContext();
			Scriptable request = cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope());
			AFCmdBase.jse.exitContext();
			
			// Basic request properties
			request.put("method", request, exchange.getRequestMethod());
			request.put("uri", request, exchange.getRequestURI().toString());
			request.put("path", request, exchange.getRequestURI().getPath());
			request.put("query", request, exchange.getRequestURI().getQuery());
			
			// Headers
			Scriptable headers = cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope());
			exchange.getRequestHeaders().forEach((key, values) -> {
				if (values.size() == 1) {
					headers.put(key.toLowerCase(), headers, values.get(0));
				} else {
					headers.put(key.toLowerCase(), headers, values.toArray(new String[0]));
				}
			});
			request.put("header", request, headers);
			
			// Body (if any)
			try (InputStream is = exchange.getRequestBody()) {
				byte[] body = is.readAllBytes();
				if (body.length > 0) {
					request.put("data", request, new String(body, StandardCharsets.UTF_8));
					request.put("bytes", request, body);
				}
			} catch (IOException e) {
				// Handle error
			}
			
			return request;
		}
		
		private void sendResponse(HttpExchange exchange, Object result) throws IOException {
			if (result instanceof Scriptable) {
				Scriptable response = (Scriptable) result;
				
				// Get status code
				int status = 200;
				Object statusObj = response.get("status", response);
				if (statusObj instanceof Number) {
					status = ((Number) statusObj).intValue();
				}
				
				// Get content type
				String contentType = "text/plain";
				Object mimeObj = response.get("mimetype", response);
				if (mimeObj instanceof String) {
					contentType = (String) mimeObj;
				}
				
				// Set headers
				exchange.getResponseHeaders().set("Content-Type", contentType);
				Object headerObj = response.get("header", response);
				if (headerObj instanceof Scriptable) {
					Scriptable headers = (Scriptable) headerObj;
					for (Object key : headers.getIds()) {
						if (key instanceof String) {
							String headerName = (String) key;
							Object headerValue = headers.get(headerName, headers);
							if (headerValue instanceof String) {
								exchange.getResponseHeaders().set(headerName, (String) headerValue);
							}
						}
					}
				}
				
				// Send response
				byte[] responseBytes = null;
				Object dataObj = response.get("data", response);
				Object streamObj = response.get("stream", response);
				
				if (streamObj != null && !(streamObj instanceof Undefined) && !(streamObj instanceof UniqueTag)) {
					// Handle stream
					if (streamObj instanceof InputStream) {
						try (InputStream is = (InputStream) streamObj) {
							responseBytes = is.readAllBytes();
						}
					}
				} else if (dataObj != null && !(dataObj instanceof Undefined) && !(dataObj instanceof UniqueTag)) {
					if (dataObj instanceof byte[]) {
						responseBytes = (byte[]) dataObj;
					} else {
						responseBytes = dataObj.toString().getBytes(StandardCharsets.UTF_8);
					}
				}
				
				if (responseBytes == null) {
					responseBytes = new byte[0];
				}
				
				exchange.sendResponseHeaders(status, responseBytes.length);
				try (OutputStream os = exchange.getResponseBody()) {
					os.write(responseBytes);
				}
			} else {
				// Default response
				String response = (result != null) ? result.toString() : "";
				exchange.sendResponseHeaders(200, response.length());
				try (OutputStream os = exchange.getResponseBody()) {
					os.write(response.getBytes(StandardCharsets.UTF_8));
				}
			}
		}
	}
}
