package openaf.plugins;

import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.net.ServerSocket;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Level;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeFunction;
import org.mozilla.javascript.NativeJavaObject;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;

import openaf.AFCmdBase;
import openaf.SimpleLog;
import openaf.SimpleLog.logtype;
import openaf.plugins.HTTPd.JSResponse;

import com.nwu.httpd.Codes;
import com.nwu.httpd.IHTTPd;
import com.nwu.httpd.IWebSock;
import com.nwu.httpd.UndertowHTTPd;
import com.nwu.httpd.NanoHTTPD.Response.IStatus;
import com.nwu.httpd.responses.EchoResponse;
import com.nwu.httpd.responses.FileResponse;
import com.nwu.httpd.responses.StatusResponse;
import com.nwu.log.Log;

/**
 * Copyright (C) 2024 Nuno Aguiar
 */

public class HTTPServer extends ScriptableObject {

    // Feature flag between nwu and undertow
    public static boolean useUndertow = false; 

    private static final long serialVersionUID = -8638106468713717782L;

    // If using NWU: hold a reference to IHTTPd
    protected IHTTPd httpd;
    // If using Undertow: hold a reference to Undertow-based server
    protected UndertowHTTPd undertowHttpd;

    // Common fields
    protected static HashMap<String, Object> sessions = new HashMap<String, Object>();
    protected String id;
    protected int serverport;
    public static Map<String, NativeFunction> callbacks = new ConcurrentHashMap<String, NativeFunction>();

    @Override
    public String getClassName() {
        return "HTTPd";
    }

    // Custom logger
    public class HLog extends Log {
        protected int port; 
        protected NativeFunction callback = null;

        public HLog(int port, Object f) {
            super(false);
            this.port = port;
            if (f != null && f instanceof NativeFunction) {
                this.callback = (NativeFunction) f;
            }
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
                    callback.call(cx,
                                  (Scriptable) AFCmdBase.jse.getGlobalscope(),
                                  cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope()),
                                  new Object[] { type, message, e });
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
            if (type == Level.SEVERE)  log(Type.ERROR, message, e);
            if (type == Level.INFO)    log(Type.INFO,  message, e);
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

    @JSConstructor
    public void newHTTPd(int port, Object host, String keyStorePath, Object password,
                         Object errorFunction, Object ws, int timeout)
                         throws IOException {

        if (port <= 0) {
            port = findRandomOpenPortOnAllLocalInterfaces();
        }
        this.serverport = port;

        // NWU or Undertow?
        if (!useUndertow) {
            // --- Original nwu code ---
            if (ws instanceof NativeJavaObject) {
                ws = ((NativeJavaObject) ws).unwrap();
            }

            if (host == null || host instanceof Undefined) {
                if (ws == null || ws instanceof Undefined) {
                    httpd = new com.nwu.httpd.HTTPd((Log) new HLog(port, errorFunction), port);
                } else {
                    httpd = new com.nwu.httpd.HTTPWSd((Log) new HLog(port, errorFunction),
                                                       port, (IWebSock) ws, timeout);
                }
            } else {
                if (ws == null || ws instanceof Undefined) {
                    httpd = new com.nwu.httpd.HTTPd((Log) new HLog(port, errorFunction),
                                                    (String) host, port);
                } else {
                    httpd = new com.nwu.httpd.HTTPWSd((Log) new HLog(port, errorFunction),
                                                       (String) host, port, (IWebSock) ws, timeout);
                }
            }

            if (keyStorePath != null && !keyStorePath.equals("undefined") &&
                password != null && !(password instanceof Undefined)) {

                httpd.stop();
                if ((new java.io.File(keyStorePath)).exists()) {
                    httpd.makeSecure(com.nwu.httpd.HTTPd.makeLocalSSLSocketFactory(
                                     keyStorePath,
                                     AFCmdBase.afc.dIP(((String) password)).toCharArray()),
                                     null);
                } else {
                    httpd.makeSecure(com.nwu.httpd.HTTPd.makeSSLSocketFactory(
                                     keyStorePath,
                                     AFCmdBase.afc.dIP(((String) password)).toCharArray()),
                                     null);
                }
                httpd.start();
            }

            // Gzip config
            httpd.addToGzipAccept("text/plain");
            httpd.addToGzipAccept("application/javascript");
            httpd.addToGzipAccept("text/css");
            httpd.addToGzipAccept("application/json");
            httpd.addToGzipAccept("application/xml");
            httpd.addToGzipAccept("text/richtext");
            httpd.addToGzipAccept("text/html");

        } else {
            // Undertow code
            // We instantiate our Undertow-based wrapper passing relevant parameters.
            undertowHttpd = new UndertowHTTPd(
                port,
                (host instanceof String) ? (String) host : null,
                keyStorePath,
                (password instanceof String) ? (String) password : null,
                new HLog(port, errorFunction),
                ws,
                timeout
            );
            // Start Undertow server now
            undertowHttpd.start();
        }

        id = Integer.toString(port) + this.hashCode();
    }

    // Helper method: find an open random port
    private Integer findRandomOpenPortOnAllLocalInterfaces() throws IOException {
        try (ServerSocket socket = new ServerSocket(0)) {
            return socket.getLocalPort();
        }
    }

    // -----------------------------------------------------------------------
    // Below are the wrappers for the public methods
    // They now check if we are using NWU or Undertow
    // -----------------------------------------------------------------------

    @JSFunction
    public int getPort() {
        return this.serverport;
    }

    @JSFunction
    public void stop() {
        if (!useUndertow) {
            if (httpd != null) httpd.stop();
        } else {
            if (undertowHttpd != null) undertowHttpd.stop();
        }
    }

    @JSFunction
    public boolean isAlive() {
        if (!useUndertow) {
            return (httpd != null) && httpd.isAlive();
        } else {
            return (undertowHttpd != null) && undertowHttpd.isAlive();
        }
    }

    @JSFunction
    public void addWS(String uri) throws Exception {
        if (!useUndertow) {
            if (httpd != null) {
                httpd.addToWsAccept(uri);
            }
        } else {
            if (undertowHttpd != null) {
                //undertowHttpd.addWS(uri);
				throw new Exception("Undertow WS not supported yet.");
            }
        }
    }

    @JSFunction
    public void addEcho(String uri) {
        if (!useUndertow) {
            if (httpd != null) {
                httpd.registerURIResponse(uri, EchoResponse.class, null);
            }
        } else {
            if (undertowHttpd != null) {
                undertowHttpd.registerURIResponse(uri, EchoResponse.class, null);
            }
        }
    }

    @JSFunction
    public void addStatus(String uri) {
        if (!useUndertow) {
            if (httpd != null) {
                httpd.registerURIResponse(uri, StatusResponse.class, null);
            }
        } else {
            if (undertowHttpd != null) {
                undertowHttpd.registerURIResponse(uri, StatusResponse.class, null);
            }
        }
    }

    @JSFunction
    public void add(String uri, NativeFunction callback) {
        callbacks.put(this.serverport + ":" + uri, callback);

        Map<String, String> props = new HashMap<String, String>();
        props.put("uri", uri);

        if (!useUndertow) {
            if (httpd != null) {
                httpd.registerURIResponse(uri, JSResponse.class, props);
            }
        } else {
            if (undertowHttpd != null) {
                undertowHttpd.registerURIResponse(uri, JSResponse.class, props);
            }
        }
    }

    @JSFunction
    public void setDefault(String uri) {
        if (!useUndertow) {
            if (httpd != null) {
                httpd.setDefaultResponse(uri);
            }
        } else {
            if (undertowHttpd != null) {
                undertowHttpd.setDefaultResponse(uri);
            }
        }
    }

    @JSFunction
    public void addFileBrowse(String uri, String filepath) {
        Map<String, String> props = new HashMap<String, String>();
        props.put("publichtml", filepath);

        if (!useUndertow) {
            if (httpd != null) {
                httpd.registerURIResponse(uri, FileResponse.class, props);
            }
        } else {
            if (undertowHttpd != null) {
                undertowHttpd.registerURIResponse(uri, FileResponse.class, props);
            }
        }
    }

    @JSFunction
    public void addXDTServer(String uri,
                             NativeFunction authFunction,
                             NativeFunction opsBroker)
       throws ClassNotFoundException, IllegalAccessException,
              IllegalArgumentException, InvocationTargetException,
              NoSuchMethodException, SecurityException {

        Map<String, String> props = new HashMap<String, String>();
        props.put("uri", uri);

        if (AFCmdBase.afcmd.equals("AFCmdWeDo")) {
            Class<?> cl = Class.forName("openaf.plugins.HTTPd.XDTServerResponse");
            cl.getDeclaredMethod("setAuthfunction", NativeFunction.class).invoke(this, authFunction);
            cl.getDeclaredMethod("setOpsfunction", NativeFunction.class).invoke(this, opsBroker);

            if (!useUndertow) {
                if (httpd != null) {
                    httpd.registerURIResponse(uri, cl, props);
                }
            } else {
                if (undertowHttpd != null) {
                    undertowHttpd.registerURIResponse(uri, cl, props);
                }
            }
        }
    }

    // -----------------------------------------------------------------------
    // The reply methods remain the same. The difference is just in how they're
    // eventually handled by the underlying NWU or Undertow implementation.
    // -----------------------------------------------------------------------

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

    @JSFunction
    public Object reply(String data, String mimetype, int code, Object headers) {
        Context cx = (Context) AFCmdBase.jse.enterContext();
        Scriptable no = cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope());
        AFCmdBase.jse.exitContext();

        if(mimetype == null || mimetype.equals("undefined")) {
            mimetype = Codes.MIME_DEFAULT_BINARY;
        }
        if(code <= 0) {
            code = 200;
        }

        no.put("status", no, code);
        no.put("mimetype", no, mimetype);
        no.put("data", no, data);
        no.put("header", no, headers);

        return no; 
    }

    @JSFunction
    public Object replyBytes(Object data, String mimetype, int code, Object headers) {
        Context cx = (Context) AFCmdBase.jse.enterContext();
        Scriptable no = cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope());
        AFCmdBase.jse.exitContext();

        if (data instanceof org.mozilla.javascript.NativeJavaArray) {
            data = ((org.mozilla.javascript.NativeJavaArray) data).unwrap();
        }

        if(mimetype == null || mimetype.equals("undefined")) {
            mimetype = Codes.MIME_DEFAULT_BINARY;
        }
        if(code <= 0) {
            code = 200;
        }

        no.put("status", no, code);
        no.put("mimetype", no, mimetype);
        no.put("data", no, (byte[]) data);
        no.put("header", no, headers);

        return no;
    }

    @JSFunction
    public Object replyStream(Object data, String mimetype, int code, Object headers) {
        Context cx = (Context) AFCmdBase.jse.enterContext();
        Scriptable no = cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope());
        AFCmdBase.jse.exitContext();

        if(mimetype == null || mimetype.equals("undefined")) {
            mimetype = Codes.MIME_DEFAULT_BINARY;
        }
        if(code <= 0) {
            code = 200;
        }
        if (data instanceof NativeJavaObject) {
            data = ((NativeJavaObject) data).unwrap();
        }

        no.put("status", no, code);
        no.put("mimetype", no, mimetype);
        no.put("stream", no, data);
        no.put("header", no, headers);

        return no;
    }

    // Sessions
    @JSFunction
    public static void addSession(String session) {
        setSession(session, null);
    }

    @JSFunction
    public static Object getSession(String session) {
        return sessions.get(session);
    }

    @JSFunction
    public static void setSession(String session, Object obj) {
        sessions.put(session, obj);
    }

    @JSFunction
    public static void delSession(String session) {
        sessions.remove(session);
    }

    @JSFunction
    public static boolean hasSession(String session) {
        return sessions.containsKey(session);
    }

    public static IStatus translateToNanoHTTPD(int code) {
        return com.nwu.httpd.NanoHTTPD.Response.Status.lookup(code);
    }
}
