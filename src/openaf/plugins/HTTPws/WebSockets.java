package openaf.plugins.HTTPws;

import org.mozilla.javascript.NativeFunction;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.Context;

import java.net.URI;
import java.net.Authenticator;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import openaf.AFCmdBase;
import org.mozilla.javascript.Undefined;


/**
 * HTTP plugin websockets extension
 * @author Nuno Aguiar
 */

public class WebSockets {
    static public class WebSocketsReply {
        public org.eclipse.jetty.websocket.client.WebSocketClient client;
        public Future<org.eclipse.jetty.websocket.api.Session> fut;
    }

    static public Object wsConnect(Authenticator authenticator, String u, String p, String anURL, NativeFunction onConnect, NativeFunction onMsg, NativeFunction onError,
            NativeFunction onClose, Object aTimeout, boolean supportSelfSigned) throws Exception {
        Object res = wsClient(authenticator, u, p, anURL, onConnect, onMsg, onError, onClose, aTimeout, supportSelfSigned);
        return ((WebSocketsReply) res).fut;
    }

    static public Object wsClient(Authenticator authenticator, String u, String p, String anURL, NativeFunction onConnect, NativeFunction onMsg, NativeFunction onError,
            NativeFunction onClose, Object aTimeout, boolean supportSelfSigned) throws Exception {

        class EventSocket extends org.eclipse.jetty.websocket.api.WebSocketAdapter {
            NativeFunction onConnect, onMsg, onError, onClose;

            public EventSocket(NativeFunction onConnect, NativeFunction onMsg, NativeFunction onError,
                    NativeFunction onClose) {
                this.onConnect = onConnect;
                this.onMsg = onMsg;
                this.onError = onError;
                this.onClose = onClose;
            }

            @Override
            public void onWebSocketConnect(org.eclipse.jetty.websocket.api.Session sess) {
                super.onWebSocketConnect(sess);
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

            @Override
            public void onWebSocketText(String payload) {
                super.onWebSocketText(payload);
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

            @Override
            public void onWebSocketBinary(byte[] payload, int offset, int len) {
                super.onWebSocketBinary(payload, offset, len);
                try {
                    Context cx = (Context) AFCmdBase.jse.enterContext();
                    this.onMsg.call(cx, (Scriptable) AFCmdBase.jse.getGlobalscope(),
                            cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope()),
                            new Object[] { "bytes", payload, offset, len });
                } catch (Exception e) {
                    throw e;
                } finally {
                    AFCmdBase.jse.exitContext();
                }
            }

            @Override
            public void onWebSocketClose(int statusCode, String reason) {
                super.onWebSocketClose(statusCode, reason);
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

            @Override
            public void onWebSocketError(Throwable cause) {
                super.onWebSocketError(cause);
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

        URI uri = URI.create(anURL);
        org.eclipse.jetty.websocket.client.WebSocketClient client;
        org.eclipse.jetty.client.HttpClient hclient;

        if (anURL.toLowerCase().startsWith("wss")) {
            org.eclipse.jetty.util.ssl.SslContextFactory ssl = new org.eclipse.jetty.util.ssl.SslContextFactory(
                    supportSelfSigned);
            if (supportSelfSigned)
                ssl.setValidateCerts(false);
            //hclient = new HttpClient(ssl);
            client = new org.eclipse.jetty.websocket.client.WebSocketClient(ssl);
        } else {
            client = new org.eclipse.jetty.websocket.client.WebSocketClient();
            //} else {
            //	hclient = new HttpClient();
        }

        if (u != null && p != null) {
            if (authenticator != null)
                Authenticator.setDefault(authenticator);
            client.getHttpClient().getAuthenticationStore()
                    .addAuthentication(new org.eclipse.jetty.client.util.BasicAuthentication(uri, "", AFCmdBase.afc.dIP(u),
                            new String(AFCmdBase.afc.dIP(p).toCharArray())));
        }

        //client = new WebSocketClient(hclient);

        try {
            org.eclipse.jetty.websocket.client.ClientUpgradeRequest request = null;
            if (u != null && p != null) {
                request = new org.eclipse.jetty.websocket.client.ClientUpgradeRequest();
                String s = new String(AFCmdBase.afc.dIP(u) + ":" + new String(AFCmdBase.afc.dIP(p).toCharArray()));
                request.setHeader("Authorization",
                        "Basic " + new String(org.apache.commons.codec.binary.Base64.encodeBase64(s.getBytes())));
                /*client.getHttpClient().getAuthenticationStore().addAuthentication(
                    new BasicAuthentication(uri, "", this.l, this.p)
                );*/
            }

            client.start();
            EventSocket socket = new EventSocket(onConnect, onMsg, onError, onClose);
            Future<org.eclipse.jetty.websocket.api.Session> fut;
            if (request == null) {
                fut = client.connect(socket, uri);
            } else {
                fut = client.connect(socket, uri, request);
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
}