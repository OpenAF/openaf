package com.nwu.httpd;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.Map;
import javax.net.ssl.SSLServerSocketFactory;

import io.undertow.Undertow;
import io.undertow.server.HttpHandler;
import io.undertow.server.HttpServerExchange;
import io.undertow.server.handlers.form.FormData;
import io.undertow.server.handlers.form.FormData.FormValue;
import io.undertow.server.handlers.form.FormDataParser;
import io.undertow.server.handlers.form.FormParserFactory;
import io.undertow.util.Headers;
import io.undertow.util.HttpString;

import com.nwu.httpd.NanoHTTPD.Method;
import com.nwu.httpd.NanoHTTPD.Response;
import com.nwu.log.Log;
import com.nwu.log.Log.Type;

public class UndertowHTTPd implements IHTTPd {
    protected Undertow server;
    protected int myTcpPort;
    protected String hostname;
    protected Log log;
    protected String defaultResponse = null;

    protected HashMap<String, Class> URIresponses = new HashMap<>();
    protected HashMap<String, Long> URIhits = new HashMap<>();
    protected HashMap<String, Map<String, String>> URIProps = new HashMap<>();
    protected ArrayList<String> gzipaccept = new ArrayList<>();
    protected boolean alive = false;

    public UndertowHTTPd(Log aLog, int port) throws IOException {
        this(aLog, "0.0.0.0", port);
    }

    public UndertowHTTPd(Log aLog, String host, int port) throws IOException {
        this.log = aLog;
        this.hostname = host;
        this.myTcpPort = port;
        HttpHandler handler = this::handleRequest;
        this.server = Undertow.builder().addHttpListener(port, host).setHandler(handler).build();
        if (aLog != null) this.log = aLog;
        start();
    }

    private void handleRequest(HttpServerExchange exchange) throws Exception {
        String uri = exchange.getRequestPath();
        String original = exchange.getRequestURI();
        Method method = Method.lookup(exchange.getRequestMethod().toString());
        Map<String,String> headers = new HashMap<>();
        exchange.getRequestHeaders().forEach(h -> headers.put(h.getHeaderName().toString(), h.getFirst()));
        Map<String,String> params = new HashMap<>();
        for (Map.Entry<String, Deque<String>> e : exchange.getQueryParameters().entrySet()) {
            if(e.getValue()!=null && !e.getValue().isEmpty()) params.put(e.getKey(), e.getValue().getFirst());
        }
        Map<String,String> files = new HashMap<>();
        if (exchange.isBlocking()) {
            FormDataParser parser = FormParserFactory.builder().build().createParser(exchange);
            if (parser != null) {
                FormData data = parser.parseBlocking();
                for (String field : data) {
                    for (FormValue val : data.get(field)) {
                        if (val.isFile()) {
                            files.put(field, val.getPath().toAbsolutePath().toString());
                        } else {
                            params.put(field, val.getValue());
                        }
                    }
                }
            } else if ("POST".equalsIgnoreCase(exchange.getRequestMethod().toString()) ||
                       "PUT".equalsIgnoreCase(exchange.getRequestMethod().toString())) {
                InputStream is = exchange.getInputStream();
                String body = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                params.put("body", body);
            }
        }
        com.nwu.httpd.NanoHTTPD.Response resp = HTTPSession.serve(this, log, uri, method, headers, params, files, original);
        if (resp == null) {
            exchange.setStatusCode(404);
            exchange.getResponseSender().send("Not Found");
            return;
        }
        exchange.setStatusCode(resp.getStatus().getRequestStatus());
        if (resp.getMimeType() != null) {
            exchange.getResponseHeaders().put(Headers.CONTENT_TYPE, resp.getMimeType());
        }
        for(Map.Entry<String,String> e : resp.getHeaders().entrySet()) {
            exchange.getResponseHeaders().put(HttpString.tryFromString(e.getKey()), e.getValue());
        }
        InputStream data = resp.getData();
        if (data != null) {
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            data.transferTo(bos);
            exchange.getResponseSender().send(ByteBuffer.wrap(bos.toByteArray()));
        } else {
            exchange.endExchange();
        }
    }

    @Override
    public void registerURIResponse(String URI, Class<?> aClass, Map<String, String> props) {
        if (aClass != null && aClass.asSubclass(com.nwu.httpd.responses.Response.class) != null) {
            URIresponses.put(URI, aClass);
            URIProps.put(URI, props);
            URIhits.put(URI, Long.valueOf(0));
        }
    }

    @Override
    public HashMap<String, Class> getURIresponses() { return URIresponses; }

    @Override
    public void setDefaultResponse(String dr) { defaultResponse = dr; }

    @Override
    public String getDefaultResponse() { return defaultResponse; }

    @Override
    public HashMap<String, Map<String, String>> getURIproperties() { return URIProps; }

    @Override
    public Class<?> getURIresponse(String URI) {
        URI = URI.replaceFirst("/+", "/");
        if (getURIresponses().containsKey(URI)) {
            URIhits.put(URI, URIhits.get(URI) + 1);
            return getURIresponses().get(URI);
        }
        return null;
    }

    @Override
    public Map<String, String> getURIProps(String URI) {
        if (URI.equals("")) URI = "/";
        if (getURIproperties().containsKey(URI)) {
            return getURIproperties().get(URI);
        }
        return null;
    }

    @Override
    public HashMap<String, Long> getURIhits() { return URIhits; }

    @Override
    public int getMyTcpPort() { return myTcpPort; }

    @Override
    public Log getLog() { return log; }

    @Override
    public int getListeningPort() { return myTcpPort; }

    @Override
    public void addToGzipAccept(String mimetype) { gzipaccept.add(mimetype.toLowerCase()); }

    @Override
    public void addToWsAccept(String uri) { }

    @Override
    public boolean useGzipWhenAccepted(Response r) {
        return r.getMimeType() != null && (r.getMimeType().toLowerCase().contains("text/") ||
                gzipaccept.contains(r.getMimeType().toLowerCase()));
    }

    @Override
    public void stop() { if (alive) { server.stop(); alive=false; } }

    @Override
    public void makeSecure(SSLServerSocketFactory makeLocalSSLSocketFactory, String[] object) { /* not implemented */ }

    @Override
    public void start() throws IOException { if (!alive) { server.start(); alive = true; } }

    @Override
    public boolean isAlive() { return alive; }
}
