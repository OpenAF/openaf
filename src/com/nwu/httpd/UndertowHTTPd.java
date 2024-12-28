package com.nwu.httpd;

import java.io.IOException;
import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.util.HashMap;
import java.util.Map;

import javax.net.ssl.SSLServerSocketFactory;

import org.xnio.OptionMap;
import org.xnio.Xnio;
import org.xnio.XnioWorker;

import com.nwu.httpd.responses.Response;
import com.nwu.log.Log;
import io.undertow.Undertow;
import io.undertow.server.RoutingHandler;
import io.undertow.server.handlers.ExceptionHandler;

/**
 * A minimal Undertow-based server wrapper to emulate the IHTTPd methods.
 * 
 * Copyright (c) 2024 Nuno Aguiar
 */
public class UndertowHTTPd implements IHTTPd {

    private int port;
    private String host;
    private String keyStorePath;
    private String keyStorePassword;
    private Log logger;
    private Object ws;
    private int timeout;

    private Undertow server;
    private RoutingHandler routingHandler;
    private boolean alive = false;

    public UndertowHTTPd(int port, String host,
                         String keyStorePath,
                         String keyStorePassword,
                         Log logger,
                         Object ws,
                         int timeout) {
        this.port = port;
        this.host = (host != null) ? host : "0.0.0.0";
        this.keyStorePath = keyStorePath;
        this.keyStorePassword = keyStorePassword;
        this.logger = logger;
        this.ws = ws;
        this.timeout = timeout;
    }

    public void start() throws IOException {
        routingHandler = new RoutingHandler();
        ExceptionHandler exHandler = new ExceptionHandler(routingHandler);

        // Undertow builder
        Undertow.Builder builder = Undertow.builder()
                .addHttpListener(port, host)
                .setHandler(exHandler);

        // TODO: SSL
        // builder.addHttpsListener(port, host, createSSLContext(keyStorePath, keyStorePassword));

        // TODO: websockets

        // add XNIO provider
        Xnio xnio = Xnio.getInstance();
        XnioWorker worker = xnio.createWorker(OptionMap.builder().getMap());

        builder = builder.setWorker(worker);

        server = builder.build();
        server.start();
        alive = true;
        if (logger != null) {
            logger.log(Log.Type.INFO, "HTTP server started on port: " + port);
        }
    }

    public void stop() {
        if (server != null) {
            server.stop();
            alive = false;
            if (logger != null) {
                logger.log(Log.Type.INFO, "HTTP server stopped.");
            }
        }
    }

    public boolean isAlive() {
        return alive;
    }

    protected void _exec(io.undertow.server.HttpServerExchange exchange, String uri, Class<?> clazz, Map<String, String> props) {
        try {
            System.out.println("Handling URI: " + uri);
            System.out.println("Class: " + clazz.getName());
            if (Response.class.isAssignableFrom(clazz)) {
                String registeredUri = uri;

                if (uri.indexOf('/', 1) > -1) {
                    registeredUri = registeredUri.substring(0, uri.indexOf('/', 1));
                }
                
                if (!this.getURIresponses().containsKey(registeredUri)) {
                    registeredUri = this.getDefaultResponse();
                }
        
                if (this.getURIresponses().containsKey(registeredUri)) {
                    com.nwu.httpd.responses.Response response = null;
        
                    System.out.println("Using response class '" + this.getURIresponses().get(registeredUri).getName() + "' for URI = '" + registeredUri + "'"); 

                    try {
                        Constructor<?> c = this.getURIresponse(registeredUri).getDeclaredConstructor(IHTTPd.class, String.class, Map.class);
                        response = (com.nwu.httpd.responses.Response) c.newInstance(this, registeredUri, this.getURIProps(registeredUri));
                        response.executeUndertow(exchange);
                    } catch (InstantiationException | IllegalAccessException | SecurityException | NoSuchMethodException | IllegalArgumentException | InvocationTargetException e) {
                        e.printStackTrace();
                    } finally {
                        if (response != null) response.getUndertowResponse(exchange);
                    }
                }
            } else {
                System.err.println("Class not supported: " + clazz.getName());
                if (logger != null) {
                    logger.log(Log.Type.ERROR, "Class not supported: " + clazz.getName());
                }
                exchange.setStatusCode(500);
                exchange.getResponseSender().send("Server error: Class not supported: " + clazz.getName());
            }
        } catch (Exception ex) {
            System.err.println("Error in registerURIResponse: " + ex.getMessage());
            if (logger != null) {
                logger.log(Log.Type.ERROR, "Error in registerURIResponse: " + ex.getMessage(), ex);
            }
            exchange.setStatusCode(500);
            exchange.getResponseSender().send("Server error: " + ex.getMessage());
        }
    }

    public void registerURIResponse(String uri, Class<?> clazz, Map<String, String> props) {
        // You'd intercept the request and call your "responder".
        // If it's EchoResponse, StatusResponse, JSResponse, etc.
        // We'll demonstrate a minimal JSResponse approach:
        System.out.println("Registering URI: " + uri);
        URIresponses.put(uri, clazz);
        URIhits.put(uri, 0L);
        URIProps.put(uri, props);

        routingHandler.get(uri, exchange -> {
            this._exec(exchange, uri, clazz, props);
        });
    }

    public void setDefaultResponse(String uri) {
        // Undertow doesn't have a "default" in the same sense as NWU.
        // One approach: add a fallback route that matches "/*" or use .setFallbackHandler().
        routingHandler.setFallbackHandler(exchange -> {
            // You can redirect or call something akin to the "default" URI:
            //exchange.setStatusCode(302);
            //exchange.getResponseHeaders().put(Headers.LOCATION, uri);
            //exchange.endExchange();
            _exec(exchange, uri, this.getURIresponse(uri), this.getURIProps(uri));
        });

        this.defaultResponse = uri;
    }

    public void addToGzipAccept(String mime) {
        // Undertow can handle GZIP by adding a GZIP encoding handler in the pipeline.
        if (logger != null) {
            logger.log(Log.Type.DEBUG, "GZIP mime accept not implemented in Undertow wrapper: " + mime);
        }
    }

    public void addToWsAccept(String uri) {
        // Undertow WebSocket usage typically requires:
        //   Handlers.websocket(new WebSocketConnectionCallback() { ... })
        // You can store this, then add route. 
        if (logger != null) {
            logger.log(Log.Type.INFO, "WebSocket not fully implemented in Undertow wrapper yet, URI=" + uri);
        }
    }

    public void makeSecure(Object sslSocketFactory, String[] protocols) {
        // specify an SSLContext in the builder:
        // Undertow.Builder.addHttpsListener(...)
        if (logger != null) {
            logger.log(Log.Type.INFO, "makeSecure not implemented in Undertow wrapper yet.");
        }
    }

	@SuppressWarnings("rawtypes")
	protected HashMap<String, Class> URIresponses = new HashMap<String, Class>();
	protected HashMap<String, Long> URIhits = new HashMap<String, Long>();
	protected HashMap<String, Map<String, String>> URIProps = new HashMap<String, Map<String, String>>();
    protected String defaultResponse = null;

    @SuppressWarnings("rawtypes")
    @Override
    public HashMap<String, Class> getURIresponses() {
        return URIresponses;
    }

    @Override
    public String getDefaultResponse() {
        return this.defaultResponse;
    }

    @Override
    public HashMap<String, Map<String, String>> getURIproperties() {
        return URIProps;
    }

    @Override
    public Class<?> getURIresponse(String URI) {
        URI.replaceFirst("/+", "/");

		if (getURIresponses().containsKey(URI)) {
			URIhits.put(URI, URIhits.get(URI) + 1);
			return getURIresponses().get(URI);
		}

		return null;
    }

    @Override
    public Map<String, String> getURIProps(String URI) {
		if (URI.equals(""))
			URI = "/";

		if (getURIproperties().containsKey(URI)) {
			return getURIproperties().get(URI);
		}

		return null;
    }

    @Override
    public HashMap<String, Long> getURIhits() {
        return URIhits;
    }

    @Override
    public int getMyTcpPort() {
        return port;
    }

    @Override
    public Log getLog() {
        return logger;
    }

    @Override
    public int getListeningPort() {
        return port;
    }

    @Override
    public boolean useGzipWhenAccepted(com.nwu.httpd.NanoHTTPD.Response r) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'useGzipWhenAccepted'");
    }

    @Override
    public void makeSecure(SSLServerSocketFactory makeLocalSSLSocketFactory, String[] object) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'makeSecure'");
    }
}
