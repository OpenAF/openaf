package openaf.plugins.HTTPws;

import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.Context;

import java.net.URI;
import java.net.Authenticator;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.lang.String;

import openaf.AFCmdBase;
import org.mozilla.javascript.Undefined;

import org.eclipse.jetty.client.HttpClient;
import org.eclipse.jetty.client.HttpClientTransport;
import org.eclipse.jetty.client.transport.HttpClientTransportOverHTTP;

import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.annotations.WebSocket;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketOpen;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketMessage;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketClose;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketError;
import org.eclipse.jetty.websocket.client.WebSocketClient;

import java.nio.ByteBuffer;

import java.util.concurrent.Future;

/**
 * HTTP plugin websockets extension
 * debug with -Dorg.eclipse.jetty.util.log.class=org.eclipse.jetty.util.log.StdErrLog -Dorg.eclipse.jetty.client.LEVEL=DEBUG
 * Copyright 2023 Nuno Aguiar
 */

public class WebSockets {
    public WebSocketClient client;
    public Future<Session> fut;

    static public class WebSocketsReply {
        public WebSocketClient client;
        public Future<Session> fut;
    }

    static public Object wsConnect(Authenticator authenticator, String u, String p, String anURL, Function onConnect, Function onMsg, Function onError,
            Function onClose, Object aTimeout, boolean supportSelfSigned) throws Exception {
        Object res = wsClient(authenticator, u, p, anURL, onConnect, onMsg, onError, onClose, aTimeout, supportSelfSigned);
        return ((WebSocketsReply) res).fut;
    }

    static public Object wsClient(Authenticator authenticator, String u, String p, String anURL, Function onConnect, Function onMsg, Function onError,
            Function onClose, Object aTimeout, boolean supportSelfSigned) throws Exception {

        URI uri = URI.create(anURL);
        WebSocketClient client;
        HttpClient hclient = null;

        if (anURL.toLowerCase().startsWith("wss")) {
            org.eclipse.jetty.util.ssl.SslContextFactory.Client ssl = new org.eclipse.jetty.util.ssl.SslContextFactory.Client();
            if (supportSelfSigned) { 
                ssl.setValidateCerts(false); 
                ssl.setTrustAll(true); 
            }
            HttpClientTransport transport = new HttpClientTransportOverHTTP();
            hclient = new org.eclipse.jetty.client.HttpClient(transport);
            hclient.setSslContextFactory(ssl);
            client = new org.eclipse.jetty.websocket.client.WebSocketClient(hclient);
        } else {
            client = new org.eclipse.jetty.websocket.client.WebSocketClient();
            //} else {
            //	hclient = new HttpClient();
        }

        if (u != null && p != null) {
            if (authenticator != null) Authenticator.setDefault(authenticator);
            org.eclipse.jetty.client.AuthenticationStore authStore = client.getHttpClient().getAuthenticationStore();
            authStore.addAuthentication(new org.eclipse.jetty.client.BasicAuthentication(uri, "", AFCmdBase.afc.dIP(u), new String(AFCmdBase.afc.dIP(p).toCharArray())));
            if (hclient != null) {
                hclient.getAuthenticationStore().addAuthentication(new org.eclipse.jetty.client.BasicAuthentication(uri, "", AFCmdBase.afc.dIP(u), new String(AFCmdBase.afc.dIP(p).toCharArray())));
            }
            //client.getHttpClient().getAuthenticationStore().addAuthentication(new org.eclipse.jetty.client.util.BasicAuthentication(uri, "", AFCmdBase.afc.dIP(u), new String(AFCmdBase.afc.dIP(p).toCharArray())));
            //if (hclient != null) hclient.getAuthenticationStore().addAuthentication(new org.eclipse.jetty.client.util.BasicAuthentication(uri, "", AFCmdBase.afc.dIP(u), new String(AFCmdBase.afc.dIP(p).toCharArray())));;
        }

        //client = new WebSocketClient(hclient);

        try {
            @SuppressWarnings("removal")
            org.eclipse.jetty.websocket.client.ClientUpgradeRequest request = null;
            if (u != null && p != null) {
                @SuppressWarnings("removal")
                org.eclipse.jetty.websocket.client.ClientUpgradeRequest tempRequest = new org.eclipse.jetty.websocket.client.ClientUpgradeRequest();
                request = tempRequest;
                String s = new String(AFCmdBase.afc.dIP(u) + ":" + new String(AFCmdBase.afc.dIP(p).toCharArray()));
                request.setHeader("Authorization",
                        "Basic " + new String(org.apache.commons.codec.binary.Base64.encodeBase64(s.getBytes())));
                /*client.getHttpClient().getAuthenticationStore().addAuthentication(
                    new BasicAuthentication(uri, "", this.l, this.p)
                );*/
            }

            if (hclient != null) hclient.start();
            client.start();
            EventSocket socket = new EventSocket(onConnect, onMsg, onError, onClose);
            Future<org.eclipse.jetty.websocket.api.Session> fut;
            if (request == null) {
                @SuppressWarnings("removal")
                Future<org.eclipse.jetty.websocket.api.Session> tempFut = client.connect(socket, uri);
                fut = tempFut;
            } else {
                @SuppressWarnings("removal")
                Future<org.eclipse.jetty.websocket.api.Session> tempFut = client
                .connect(socket, uri, request);
                fut = tempFut;
            }
            
            org.eclipse.jetty.websocket.api.Session session;
            if (!(aTimeout instanceof Undefined))
                session = fut.get((long) aTimeout, TimeUnit.MILLISECONDS);
            else
                session = fut.get();

            WebSocketsReply res = new WebSocketsReply();
            res.fut = fut;
            res.client = client;

            return res;
        } catch (Exception e) {
            client.stop();
            throw e;
        }
    }

    @WebSocket
    public static class EventSocket {
        Function onConnect, onMsg, onError, onClose;

        public EventSocket(Function onConnect, Function onMsg, Function onError, Function onClose) {
            this.onConnect = onConnect;
            this.onMsg = onMsg;
            this.onError = onError;
            this.onClose = onClose;
        }

        @OnWebSocketOpen
        public void OnWebSocketOpen(Session sess) {
            //super.OnWebSocketOpen(sess);
            try {
                Context cx = (Context) AFCmdBase.jse.enterContext();
                this.onConnect.call(cx, (Scriptable) AFCmdBase.jse.getGlobalscope(),
                        cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope()), new Object[] { sess });
            } catch (Exception e) {
                throw e;
            } finally {
                AFCmdBase.jse.exitContext();
            }
        }

        @OnWebSocketMessage
        public void onWebSocketText(String payload) {
            //super.onWebSocketText(payload);
            try {
                Context cx = (Context) AFCmdBase.jse.enterContext();
                this.onMsg.call(cx, (Scriptable) AFCmdBase.jse.getGlobalscope(),
                        cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope()),
                        new Object[] { "text", payload });
            } catch (Exception e) {
                throw e;
            } finally {
                AFCmdBase.jse.exitContext();
            }
        }

        @OnWebSocketMessage
        public void onWebSocketBinary(ByteBuffer byteBuffer, org.eclipse.jetty.websocket.api.Callback callback) {
            //super.onWebSocketBinary(byteBuffer, callback);
            try {
                Context cx = (Context) AFCmdBase.jse.enterContext();
                this.onMsg.call(cx, (Scriptable) AFCmdBase.jse.getGlobalscope(),
                    cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope()),
                    new Object[] { "bytes", byteBuffer });
                callback.succeed();
            } catch (Exception e) {
                callback.fail(e);
                throw e;
            } finally {
                AFCmdBase.jse.exitContext();
            }
        }

        @OnWebSocketClose
        public void onWebSocketClose(int statusCode, String reason) {
            //super.onWebSocketClose(statusCode, reason);
            try {
                Context cx = (Context) AFCmdBase.jse.enterContext();
                this.onClose.call(cx, (Scriptable) AFCmdBase.jse.getGlobalscope(),
                        cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope()),
                        new Object[] { statusCode, reason });
            } catch (Exception e) {
                throw e;
            } finally {
                AFCmdBase.jse.exitContext();
            }
        }

        @OnWebSocketError
        public void onWebSocketError(Throwable cause) {
            //super.onWebSocketError(cause);
            try {
                Context cx = (Context) AFCmdBase.jse.enterContext();
                this.onError.call(cx, (Scriptable) AFCmdBase.jse.getGlobalscope(),
                        cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope()), new Object[] { cause });
            } catch (Exception e) {
                throw e;
            } finally {
                AFCmdBase.jse.exitContext();
            }
        }
    }
}