package openaf;

import org.mozilla.javascript.ErrorReporter;
import org.mozilla.javascript.EvaluatorException;

/**
 * 
 * @author Nuno Aguiar
 *
 */
public class OpenRhinoErrorReporter implements ErrorReporter {
	protected long initialLoad = 0;
	
	/**
	 * 
	 * @param log
	 */
	public OpenRhinoErrorReporter() {
		this.initialLoad = AFCmdBase.jse.getCurrentNumberOfLines();
	}
	
	/**
	 * 
	 * @param lineText
	 * @param lineOffset
	 * @return
	 */
	protected String pointString(String lineText, int lineOffset) {
		if (lineText != null) {
			StringBuilder res = new StringBuilder(lineText + "\n");
			for(int a = 0; a < lineOffset; a++) res.append(' ');
			res.append("^\n");
			return res.toString();
		} else {
			return "";
		}
	}
	
	@Override
	public void error(String message, String sourceURI, int line,
            String lineText, int lineOffset) {
		this.initialLoad = AFCmdBase.jse.getCurrentNumberOfLines(); 
		initialLoad = AFCmdBase.jse.getCurrentNumberOfLines(); 
		long l = ((line - initialLoad) < 0) ? line : (line - initialLoad);
		String source = (sourceURI != null && sourceURI.length() > 0) ? "[" + sourceURI + "]" : "";
		
		SimpleLog.log(SimpleLog.logtype.ERROR, 
				"ERROR " + source + " -- " + message + ", line: " + l + ", column: " + lineOffset + ", global line: " + line + "\n" + pointString(lineText, lineOffset), 
				null);
	}

	@Override
	public EvaluatorException runtimeError(String message, String sourceURI, int line,
            String lineText, int lineOffset) {
		this.initialLoad = AFCmdBase.jse.getCurrentNumberOfLines();
		String source = (sourceURI != null && sourceURI.length() > 0) ? "[" + sourceURI + "]" : "";
		
		SimpleLog.log(SimpleLog.logtype.DEBUG, 
				"RUNTIME ERROR " + source + " -- " + message + ", line: " + line + ", column: " + lineOffset + "\n" + pointString(lineText, lineOffset), 
				null);
		return new EvaluatorException(
                message, sourceURI, line, lineText, lineOffset);
	}

	@Override
	public void warning(String message, String sourceURI, int line,
            String lineText, int lineOffset) {
		this.initialLoad = AFCmdBase.jse.getCurrentNumberOfLines();
		long l = ((line - initialLoad) < 0) ? line : (line - initialLoad);
		String source = (sourceURI != null && sourceURI.length() > 0) ? "[" + sourceURI + "]" : "";
		
		SimpleLog.log(SimpleLog.logtype.DEBUG, 
				"WARNING " + source + " -- " + message + ", line: " + l + ", column: " + lineOffset + ", global line: " + line + "\n" + pointString(lineText, lineOffset), 
				null);
	}

}
