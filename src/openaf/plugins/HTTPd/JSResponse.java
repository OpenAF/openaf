package openaf.plugins.HTTPd;

import java.io.ByteArrayInputStream;
import java.util.HashMap;
import java.util.Map;
import java.lang.String;
import java.lang.Exception;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeFunction;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.Scriptable;

import openaf.AFCmdBase;
import openaf.SimpleLog;
import openaf.SimpleLog.logtype;
import openaf.plugins.HTTPServer;

import com.nwu.httpd.Codes;
import com.nwu.httpd.IHTTPd;
import com.nwu.httpd.NanoHTTPD.Response.IStatus;
import com.nwu.httpd.Request;
import com.nwu.httpd.responses.Response;

/**
 * 
 * @author Nuno Aguiar
 *
 */
public class JSResponse extends Response {
	Map<String, String> props;
	
	/**
	 * 
	 * @param httpd
	 * @param rUri
	 * @param props
	 */
	public JSResponse(IHTTPd httpd, String rUri, Map<String, String> props) {
		super(httpd, rUri, props);
		this.props = props; 
	}
	
	public Scriptable toScriptable(Map<String, String> map) {
		Context cx = (Context) AFCmdBase.jse.enterContext();
		Scriptable res = cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope());
		AFCmdBase.jse.exitContext();
		
		for(Object obj : map.keySet()) {
			res.put((String) obj, res, map.get(obj));
		}
		
		return res;
	}
	
	public void execute(Request request) {
		Context cx = (Context) AFCmdBase.jse.enterContext();
		
		try {
			Scriptable json = cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope());
			
			json.put("uri", json, request.getUri());
			json.put("originalURI", json, request.getOriginalURI());
			json.put("method", json, request.getMethod().toString());
			json.put("header", json, toScriptable(request.getHeader()));
			json.put("params", json, toScriptable(request.getParams()));
			json.put("files", json, toScriptable(request.getFiles()));
			
			NativeFunction func = HTTPServer.callbacks.get(this.httpd.getListeningPort() + ":" + props.get("uri"));
			Object ret = null; 
			if (func != null) {
				try {
					ret = func.call(cx, (Scriptable) AFCmdBase.jse.getGlobalscope(), cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope()), new Object[] {json});
				} catch(Exception e) {
					System.err.println("HTTPd error on request=" + AFCmdBase.jse.stringify(json, null, "").toString() + " with exception=" + e.getMessage());
					e.printStackTrace();
				}
			}
			
			if (ret == null) { ret = new String(""); }
			if (ret instanceof NativeObject) {
				NativeObject no = (NativeObject) ret;
				
				if (no.containsKey("status")) {
					Object ss = no.get("status");
					if (ss instanceof IStatus) 
						this.status = (IStatus) no.get("status");
					else 
						this.status = HTTPServer.translateToNanoHTTPD(Double.valueOf(ss.toString()).intValue());
				} else
					this.status = Codes.HTTP_OK;
				
				if (no.containsKey("mimetype"))
					this.mimeType = (String) no.get("mimetype");
				else
					this.mimeType = Codes.MIME_PLAINTEXT;
				
				if (no.containsKey("header")) {
					@SuppressWarnings("unchecked")
					Map<String, Object> map = ((Map<String, Object>) no.get("header"));
					HashMap<String, Object> hm = new HashMap<String, Object>();
					if (map != null) hm.putAll(map);
					for(String key : hm.keySet()) {
						if (key == null) continue;
						//ArrayList<String> values = new ArrayList<String>((List<String>) hm.get(key));
						//String value = values.toString().substring(values.toString().indexOf("[")+1, values.toString().lastIndexOf("]"));
						String value = hm.get(key).toString();
						this.getHeader().put(key, value); 
					}
				}
				
				if (no.containsKey("data")) {
					this.data = new ByteArrayInputStream( 
						(no.get("data") instanceof String) ? no.get("data").toString().getBytes("UTF-8")
									                        : (byte[]) no.get("data"));
						
					this.size =	((no.get("data") instanceof String) ? no.get("data").toString().getBytes("UTF-8").length
									                        : ((byte[]) no.get("data")).length);
				} else {
					if (no.containsKey("stream")) {
						this.data = (java.io.InputStream) no.get("stream");
					} else {
						this.data = new ByteArrayInputStream( ret.toString().getBytes("UTF-8"));
						this.size = ret.toString().length();
					}
				}
				
			} else {
				this.status = Codes.HTTP_OK;
				this.mimeType = Codes.MIME_PLAINTEXT;
				this.data = new ByteArrayInputStream( ret.toString().getBytes("UTF-8"));
				this.size = ret.toString().getBytes("UTF-8").length;
			}
		} catch (Exception e) {
			//throw e;
			SimpleLog.log(logtype.DEBUG, "Exception " + e.getMessage(), e);
		} finally {
			AFCmdBase.jse.exitContext();
		}

		
	}
}
