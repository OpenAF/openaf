package com.nwu.httpd;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import javax.net.ssl.SSLServerSocketFactory;

import org.xnio.OptionMap;
import org.xnio.Xnio;
import org.xnio.XnioWorker;

import com.nwu.httpd.NanoHTTPD.Response;
import com.nwu.log.Log;

import io.undertow.Undertow;
import io.undertow.server.RoutingHandler;
import io.undertow.server.handlers.ExceptionHandler;
import io.undertow.util.Headers;

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

    public void registerURIResponse(String uri, Class<?> clazz, Map<String, String> props) {
        // You'd intercept the request and call your "responder".
        // If it's EchoResponse, StatusResponse, JSResponse, etc.
        // We'll demonstrate a minimal JSResponse approach:

        routingHandler.get(uri, exchange -> {
            try {
                if (Response.class.isAssignableFrom(clazz)) {
                    Response response = (Response) clazz.getDeclaredConstructor().newInstance();
                    exchange = response.getUndertowResponse(exchange);
                }
            } catch (Exception ex) {
                if (logger != null) {
                    logger.log(Log.Type.ERROR, "Error in registerURIResponse: " + ex.getMessage(), ex);
                }
                exchange.setStatusCode(500);
                exchange.getResponseSender().send("Server error: " + ex.getMessage());
            }
        });
    }

    public void setDefaultResponse(String uri) {
        // Undertow doesn't have a "default" in the same sense as NWU.
        // One approach: add a fallback route that matches "/*" or use .setFallbackHandler().
        routingHandler.setFallbackHandler(exchange -> {
            // You can redirect or call something akin to the "default" URI:
            exchange.setStatusCode(302);
            exchange.getResponseHeaders().put(Headers.LOCATION, uri);
            exchange.endExchange();
        });
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

    @Override
    public HashMap<String, Class> getURIresponses() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getURIresponses'");
    }

    @Override
    public String getDefaultResponse() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getDefaultResponse'");
    }

    @Override
    public HashMap<String, Map<String, String>> getURIproperties() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getURIproperties'");
    }

    @Override
    public Class<?> getURIresponse(String URI) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getURIresponse'");
    }

    @Override
    public Map<String, String> getURIProps(String URI) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getURIProps'");
    }

    @Override
    public HashMap<String, Long> getURIhits() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getURIhits'");
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
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getListeningPort'");
    }

    @Override
    public boolean useGzipWhenAccepted(Response r) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'useGzipWhenAccepted'");
    }

    @Override
    public void makeSecure(SSLServerSocketFactory makeLocalSSLSocketFactory, String[] object) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'makeSecure'");
    }
}
