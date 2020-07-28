package openaf.plugins;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.String;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import openaf.AFCmdBase;
import openaf.SimpleLog;
import openaf.SimpleLog.logtype;

/**
 * 
 * @author Nuno Aguiar
 *
 */
public class Beautifiers extends ScriptableObject {

	/**
	 * 
	 */
	private static final long serialVersionUID = 533470149211177787L;

	@Override
	public String getClassName() {
		return "Beautifiers";
	}
	
	static {
		StringBuilder includeScript = new StringBuilder();
		try {
			InputStream in1 = AFCmdBase.class.getResourceAsStream("/js/vkbeautify.js");
			BufferedReader reader = new BufferedReader(new InputStreamReader(in1));
	
			String line;
			while ((line = reader.readLine()) != null) {
				includeScript.append(line);
				includeScript.append('\n');
			}
			reader.close();
		} catch (IOException e) {
			SimpleLog.log(logtype.ERROR,
					"Error loading file vkbeautify.js: " + e.getMessage(), e);
		}
		
		Context cx = (Context) AFCmdBase.jse.enterContext();
		try {
			cx.evaluateString((Scriptable) AFCmdBase.jse.getGlobalscope(),
					includeScript.toString(), "vkbeautify", 1, null);
		} catch (Exception e) {
			SimpleLog.log(logtype.ERROR,
					"Error reading file vkbeautify.js: " + e.getMessage(), e);
		} finally {
			AFCmdBase.jse.exitContext();
		}
	}

}
