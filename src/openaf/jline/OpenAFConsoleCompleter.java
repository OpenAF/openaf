// Copyright 2023 Nuno Aguiar

package openaf.jline;

import java.util.List;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.annotations.JSConstructor;
import java.lang.String;

import openaf.AFCmdBase;
import jline.console.completer.Completer;
import static jline.internal.Preconditions.checkNotNull;

public class OpenAFConsoleCompleter extends ScriptableObject implements Completer {

	/**
	 * 
	 */
	private static final long serialVersionUID = 3655679646340836309L;
	protected Function func;

	@Override
	public int complete(final String buffer, final int cursor, final List<CharSequence> candidates) {
		checkNotNull(candidates);
		int ret = -1;
		
		Context cx = (Context) AFCmdBase.jse.enterContext();
        try {
            if (func != null) {
                Object result = func.call(cx, (Scriptable) AFCmdBase.jse.getGlobalscope(),
                    cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope()),
                    new Object[] { buffer, cursor, candidates });
                if (result instanceof Number) ret = ((Number) result).intValue();
            }
        } finally {
            AFCmdBase.jse.exitContext();
        }
		return ret;
	}

	@Override
	public String getClassName() {
		return "OpenAFConsoleCompleter";
	}
	
	public OpenAFConsoleCompleter(Function func) {
		this.func = func;
	}
	
	@JSConstructor
	public void newOpenAFConsoleCompleter(Function func) {
		this.func = func;
	}

}
