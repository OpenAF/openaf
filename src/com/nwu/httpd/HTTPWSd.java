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
package com.nwu.httpd;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import javax.net.ssl.SSLServerSocketFactory;

import com.nwu.httpd.NanoWSD.WebSocketFrame.CloseCode;
import com.nwu.httpd.NanoWSD.WebSocket;
import com.nwu.httpd.NanoWSD.WebSocketFrame;
import com.nwu.log.Log;
import com.nwu.log.Log.Type;

import java.lang.String;

/**
 * The HTTPd server. Creates a thread to run the httpd server.
 * 
 * @author Nuno Aguiar <nuno@aguiar.name>
 * 
 */
public class HTTPWSd extends NanoWSD implements IHTTPd {
    protected int myTcpPort;
    protected Thread myThread;
    protected HTTPWSd httpd;
    protected Log log;
    protected String defaultResponse = null;

    @SuppressWarnings("rawtypes")
    protected HashMap<String, Class> URIresponses = new HashMap<String, Class>();
    protected HashMap<String, Long> URIhits = new HashMap<String, Long>();
    protected HashMap<String, Map<String, String>> URIProps = new HashMap<String, Map<String, String>>();
    protected ArrayList<String> gzipaccept = new ArrayList<String>();
    protected ArrayList<String> wsaccept = new ArrayList<String>();

    public String getDefaultResponse() {
        return defaultResponse;
    }

    public void setDefaultResponse(String defaultResponse) {
        httpd.defaultResponse = defaultResponse;
    }

    /**
     * Creates the thread launching the httpd server on the corresponding port.
     * 
     * @param port The port to assign to this server thread.
     * @throws IOException Exception in case the server is unable to assigned to the
     *                     corresponding port.
     */
    public HTTPWSd(Log aLog, int port, IWebSock ws, int timeout) throws IOException {
        super(port);
        super.LOG = aLog.getLogLogger();
        this.ws = ws;
        if (timeout > 0)
            super.start(timeout);
        else
            super.start();
        if (aLog != null)
            this.log = aLog;
        this.httpd = this;
        myTcpPort = port;
        log.log(Type.DEBUG, "ServerSocket created for TCP port: " + myTcpPort);
    }

    /**
     * 
     * @param aLog
     * @param hostname
     * @param port
     * @throws IOException
     */
    public HTTPWSd(Log aLog, String hostname, int port, IWebSock ws, int timeout) throws IOException {
        super(hostname, port);
        super.LOG = aLog.getLogLogger();
        this.ws = ws;
        if (timeout > 0)
            super.start(timeout);
        else
            super.start();
        if (aLog != null)
            this.log = aLog;
        this.httpd = this;
        myTcpPort = port;
        log.log(Type.DEBUG, "ServerSocket created for TCP hostname: " + hostname + "; port: " + myTcpPort);
    }

    public void addToWsAccept(String uri) {
        wsaccept.add(uri);
    }

    @Override
    public Response serve(IHTTPSession session) {
        if (this.isWebsocketRequested(session) && wsaccept.contains(session.getUri())) { 
            return super.serve(session); 
        }

        Map<String, String> files = new HashMap<String, String>();
        Method method = session.getMethod();
        if (Method.PUT.equals(method) || Method.POST.equals(method)) {
            try {
                session.parseBody(files);
            } catch (IOException ioe) {
                return new Response(Response.Status.INTERNAL_ERROR, MIME_PLAINTEXT, new ByteArrayInputStream(
                        ("SERVER INTERNAL ERROR: IOException: " + ioe.getMessage()).getBytes(StandardCharsets.UTF_8)),
                        -1);
            } catch (ResponseException re) {
                return new Response(re.getStatus(), MIME_PLAINTEXT,
                        new ByteArrayInputStream(re.getMessage().getBytes(StandardCharsets.UTF_8)),
                        re.getMessage().length());
            }
        }

        Map<String, String> parms = session.getParms();
        parms.put(super.QUERY_STRING_PARAMETER, session.getQueryParameterString());
        Response res = com.nwu.httpd.HTTPSession.serve(this, log, session.getUri(), method, session.getHeaders(), parms,
                files, session.getOriginalURI());
        try {
            session.getInputStream().skip(session.getInputStream().available());
        } catch (IOException e) {
            log.log(Type.ERROR, "Error emptying buffer: " + e.getMessage());
        }
        return res;
        // return serve(session.getUri(), method, session.getHeaders(), parms, files);
    }

    /**
     * Registers a response class to answer requests on a given URI for this server
     * thread.
     * 
     * (Note: will not add anything if the class provided isn't a subclass of
     * com.nwu.httpd.responses.Response class)
     * 
     * @param URI    The URI to register.
     * @param aClass The response class (com.nwu.httpd.responses.Response) to
     *               register.
     */
    public void registerURIResponse(String URI, Class<?> aClass, Map<String, String> props) {
        if (aClass != null && aClass.asSubclass(com.nwu.httpd.responses.Response.class) != null) {
            URIresponses.put(URI, aClass);
            URIProps.put(URI, props);
            URIhits.put(URI, Long.valueOf(0));
        }
    }

    File myFileDir;

    /**
     * Return the current registered URI response objects. If none is found it will
     * return null.
     * 
     * @return A HashMap where the key is the URI and the value the
     *         com.nwu.httpd.responses.Response class.
     */
    public HashMap<String, Class> getURIresponses() {
        return URIresponses;
    }

    /**
     * Return the current registered URI properties. If none is found it will return
     * null.
     * 
     * @return A HashMap where the key is the URI and the value are Properties.
     * 
     * @see java.util.Properties
     */
    public HashMap<String, Map<String, String>> getURIproperties() {
        return URIProps;
    }

    /**
     * Returns a registered Response Class given an URI
     * 
     * @param URI The URI to lookup the corresponding registered class
     * @return A sub-class of com.nwu.httpd.responses.Response
     */
    public Class<?> getURIresponse(String URI) {
        URI.replaceFirst("/+", "/");

        if (getURIresponses().containsKey(URI)) {
            URIhits.put(URI, URIhits.get(URI) + 1);
            return getURIresponses().get(URI);
        }

        return null;
    }

    /**
     * Returns the properties for the given URI
     * 
     * @param URI The URI to lookup the corresponding properties
     * @return The properties or null if not found
     */
    public Map<String, String> getURIProps(String URI) {
        if (URI.equals(""))
            URI = "/";

        if (getURIproperties().containsKey(URI)) {
            return getURIproperties().get(URI);
        }

        return null;
    }

    /**
     * Return the current hit counters for each URI response object
     * 
     * @return A HashMap where the key is the URI and the value the hit counter
     */
    public HashMap<String, Long> getURIhits() {
        return URIhits;
    }

    /**
     * Provides the current assigned TCP port.
     * 
     * @return the port number.
     */
    public int getMyTcpPort() {
        return myTcpPort;
    }

    /**
     * Obtain the httpd log
     * 
     * @return A current Log object
     */
    public Log getLog() {
        return log;
    }

    public void addToGzipAccept(String mimetype) {
        gzipaccept.add(mimetype.toLowerCase());
    }

    @Override
    public boolean useGzipWhenAccepted(Response r) {
        return r.getMimeType() != null && (r.getMimeType().toLowerCase().contains("text/")
                || (gzipaccept.contains(r.getMimeType().toLowerCase())));
    }

    protected IWebSock ws;

    @Override
    protected WebSocket openWebSocket(IHTTPSession handshake) {
        return new WebSocket(handshake) {
            @Override
            protected void onOpen() {
                ws.oOpen(this);
            }

            @Override
            protected void onClose(CloseCode code, String reason, boolean initiatedByRemote) {
                ws.oClose(this, code, reason, initiatedByRemote);
            }

            @Override
            protected void onException(IOException exception) {
                ws.oException(this, exception);
            }

            @Override
            protected void onMessage(WebSocketFrame message) {
                ws.oMessage(this, message);
            }

            @Override
            protected void onPong(WebSocketFrame pong) {
                ws.oPong(this, pong);
            }
        };
    };

    @Override
    public void makeSecure(SSLServerSocketFactory makeLocalSSLSocketFactory, String[] object) {
        super.makeSecure(makeLocalSSLSocketFactory, object);
    }

}
