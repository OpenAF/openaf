package wedo.openaf;

import java.awt.Desktop;
import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.DataInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.MalformedURLException;
import java.nio.charset.Charset;
import java.util.zip.ZipFile;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.IdScriptableObject;
import org.mozilla.javascript.NativeJSON;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

import wedo.openaf.SimpleLog.logtype;

/**
 * 
 * @author Nuno Aguiar <nuno.aguiar@wedotechnologies.com>
 * 
 */
public class AFCmdOS extends AFCmdBase  {
	final public static String argHelp = "Usage: openaf [options]\n\n"
			+ "Options:\n" 
			+ "   -e (input)         - provide input directly instead of using stdin\n"
			+ "   -p                 - received streaming input (OS pipe)\n"
			+ "   -f (script file)   - provide a script file directly\n"
			+ "\n"
			+ "   --install          - generates scripts to use openaf on the current directory\n"
			+ "   --check            - checks if this is the current version\n"
			+ "   --update           - updates to the most current version\n"
			+ "   --console          - interactive OpenAF console\n"
			+ "   --repack           - repack OpenAF.jar for faster startup times\n"
			+ "   --daemon           - executes a script/opack as a daemon\n"
			+ "   --script           - executes a script/opack\n"
			+ "\n"
			+ "   -h                 - show this help information\n"
			+ "   -helpscript (term) - show help on a search term on scripting\n"
			+ "\n(version " + VERSION + " (" + DISTRIBUTION + "), " + LICENSE + ")";
	final protected static String OPTION_OUTPUT_TYPE = "-o";
	final protected static String OPTION_DEBUG = "-debug";
	final protected static String OPTION_EXPR = "-e";
	final protected static String OPTION_HELP = "-h";
	final protected static String OPTION_SCRIPTHELP = "-helpscript";
	final protected static String OPTION_INPUT_TYPE = "-i";
	final protected static String OPTION_INSTALL = "--install";
	final protected static String OPTION_CHECK = "--check";
	final protected static String OPTION_UPDATE = "--update";
	final protected static String OPTION_REPACK = "--repack";
	final protected static String OPTION_OPACK = "--opack";
	final protected static String OPTION_CONSOLE = "--console";
	final protected static String OPTION_OJOB = "--ojob";
	final protected static String OPTION_SCRIPTOPTION = "--script";
	final protected static String OPTION_DAEMON = "--daemon";
	final protected static String OPTION_PIPE = "-p";
	final protected static String OPTION_CODE = "-c";
	final protected static String OPTION_SCRIPTFILE = "-f";
	final protected static String OPTION_INTERPRET = "--i";
	final protected static String PREFIX_SCRIPT = "script:";
	final protected static String OPACK = ".package.json";
	public static enum outputtype { OUTPUT_JSON };
	public static enum inputtype { INPUT_EXPR, INPUT_JSON, INPUT_SCRIPT, INPUT_AUTO };

	
	//public static org.mozilla.javascript.Context cx;
	//public static ScriptableObject globalscope;
	//public static JSEngine jse;
	public static ZipFile zip;
	
	protected inputtype INPUT_TYPE = inputtype.INPUT_AUTO;
	protected String exprInput = "";
	protected String scriptfile = "";
	protected String code = "";
	protected String classfile = "";
	protected String injectscriptfile = "";
	protected long numberOfIncludedLines = 0;
	
	protected boolean silentMode = false;
	protected boolean pipe = false;
	protected boolean compile = false;
	protected boolean filescript = false;
	protected boolean classscript = false;
	protected boolean opack = false;
	protected boolean console = false;
	protected boolean ojob = false;
	protected boolean injectscript = false;
	protected boolean daemon = false;
	protected boolean injectcode = false;
	protected JsonObject pmIn, pmOut;

	//public static String[] args;
	
	@Override
	public String dIP(String aPass) {
		return AFBase.decryptIfPossible(aPass);
	}
	
	/**
	 * 
	 */
	public AFCmdOS() {	
		super();
		afc = this;
	}
	
	/**
	 * 
	 */
	protected void showHelp() {
		showHelp(argHelp);
	}	
		
	/**
	 * 
	 */
	protected void install() {
		INPUT_TYPE = inputtype.INPUT_SCRIPT;
		silentMode = true;
		
		InputStream is = getClass().getResourceAsStream("/js/genScripts.js");
		OutputStream os = System.out;
		
		try {
			execute(is, os, "");
		} catch (Exception e) {
			SimpleLog.log(logtype.ERROR, "Error generating OpenAF scripts: " + e.getMessage(), e);
		}
		
		System.exit(0);
	}
	
	/**
	 * 
	 */
	protected void check() {
		INPUT_TYPE = inputtype.INPUT_SCRIPT;
		silentMode = true;
		
		InputStream is = getClass().getResourceAsStream("/js/check.js");
		OutputStream os = System.out;
		
		try {
			execute(is, os, "");
		} catch (Exception e) {
			SimpleLog.log(logtype.ERROR, "Error generating checking version: " + e.getMessage(), e);
		}
		System.exit(0);
	}
	
	/**
	 * 
	 */
	protected void update() {
		INPUT_TYPE = inputtype.INPUT_SCRIPT;
		silentMode = true;
		
		InputStream is = getClass().getResourceAsStream("/js/update.js");
		OutputStream os = System.out;
		
		try {
			execute(is, os, "");
		} catch (Exception e) {
			SimpleLog.log(logtype.ERROR, "Error generating updating version: " + e.getMessage(), e);
		}
		
		System.exit(0);
	}
	
	/**
	 * 
	 * @throws IOException
	 */
	protected void showHelpScript() throws IOException {		
		INPUT_TYPE = inputtype.INPUT_SCRIPT;
		silentMode = true;
		
		InputStream is = getClass().getResourceAsStream("/js/example.js");
		OutputStream os = System.out;
		
		try {
			execute(is, os, "");
		} catch (Exception e) {
			SimpleLog.log(logtype.ERROR, "Error obtaining script help: " + e.getMessage(), e);
		}
		
		System.exit(0);		
	}
	
	/**
	 * Process arguments
	 * 
	 * @param args
	 * @throws MalformedURLException 
	 */
	protected void processArgs(String[] args) throws MalformedURLException {
		boolean checkNext = false;
		boolean url = false;
		boolean operation = false;
		String checkOption = "";
		
		for (String a : args) {
			if (checkNext) {
				checkNext = false;
				switch (checkOption) { 			
				case OPTION_EXPR:
					exprInput = a;
					continue;
				case OPTION_SCRIPTFILE:
					scriptfile = a;
					continue;
				case OPTION_DAEMON:
					scriptfile = a;
					continue;					
				case OPTION_CODE:
					code = a;
					continue;
				}	
			}
			switch(a) {
			case OPTION_PIPE:
				pipe = true;
				continue;
			case OPTION_OUTPUT_TYPE:
				checkNext = true;
				checkOption = OPTION_OUTPUT_TYPE;
				continue;
			case OPTION_INPUT_TYPE:
				checkNext = true;
				checkOption = OPTION_INPUT_TYPE;
				continue;
			case OPTION_EXPR:
				checkNext = true;
				checkOption = OPTION_EXPR;
				continue;
			case OPTION_DEBUG:
				SimpleLog.currentLogLevel = SimpleLog.logtype.DEBUG;
				continue;
			case OPTION_SCRIPTFILE:
				checkNext = true;
				checkOption = OPTION_SCRIPTFILE;
				filescript = true;
				continue;
			case OPTION_SCRIPTOPTION:
				checkNext = true;
				silentMode = true;
				INPUT_TYPE = inputtype.INPUT_SCRIPT;
				checkOption = OPTION_SCRIPTFILE;
				filescript = true;
				continue;
			case OPTION_DAEMON:
				checkNext = true;
				silentMode = true;
				INPUT_TYPE = inputtype.INPUT_SCRIPT;
				checkOption = OPTION_DAEMON;
				filescript = true;
				daemon = true;
				continue;
			case OPTION_HELP:
				showHelp();
				continue;
			case OPTION_INSTALL:
				install();
				continue;
			case OPTION_UPDATE:
				update();
				continue;		
			case OPTION_OPACK:
				filescript = true;
				silentMode = true;
				INPUT_TYPE = inputtype.INPUT_SCRIPT;
				opack = true;
				injectscript = true;
				injectscriptfile = "/js/opack.js";
				continue;
            case OPTION_OJOB:
                filescript = true;
                silentMode = true;
                INPUT_TYPE = inputtype.INPUT_SCRIPT;
                ojob = true;
                injectscript = true;
                injectscriptfile = "/js/ojob.js";
                continue;
			case OPTION_CONSOLE:
				filescript = true;
				silentMode = true;
				INPUT_TYPE = inputtype.INPUT_SCRIPT;
				console = true;
				injectscript = true;
				injectscriptfile = "/js/openafconsole.js";
				continue;
			case OPTION_REPACK:
				filescript = true;
				silentMode = true;
				INPUT_TYPE = inputtype.INPUT_SCRIPT;
				injectscript = true;
				injectscriptfile = "/js/repack.js";
				continue;
			case OPTION_INTERPRET:
				AFCmdBase.optLevel = -1;
				AFCmdBase.restartEngine();
				continue;	
			case OPTION_CHECK:
				check();
				continue;
			case OPTION_CODE:
				checkNext = true;
				silentMode = true;
				checkOption = OPTION_CODE;
				code = "";
				injectcode = true;
				continue;
			case OPTION_SCRIPTHELP:
				try {
					showHelpScript();
				} catch (IOException e) {
					SimpleLog.log(logtype.ERROR, "Error obtaining script example: " + e.getMessage(), e);
				}
				continue;
			}
		}
	}
	
	/**
	 * 
	 * @param in
	 * @param out
	 * @param op
	 * @throws Exception
	 */
	protected void execute(InputStream in, OutputStream out, String op) throws Exception {
		boolean processScript = false;
		
		StringBuilder input = new StringBuilder();
		
		// Check repack
		if (this.getClass().getResourceAsStream("/af.jar") != null &&
			!injectscriptfile.contains("repack"))
			System.err.println("Warning: Please consider repacking OpenAF (use --repack).");
		
		// 1. Read the input from stdin and option -e and from a file
		//
		
		StringBuilder theInput = new StringBuilder();
		pmIn = new JsonObject();
		
		BufferedReader br = new BufferedReader(new InputStreamReader(in));
		
		if (pipe) {
			String lineO = "";
			while((lineO = br.readLine()) != null) {
				input.append(lineO);
				input.append("\n");
			}
		} else {
			while (br.ready()) {
				input.append(br.readLine());
				input.append("\n");
			}			
		}
		
		//br.close();
		
		if (INPUT_TYPE != inputtype.INPUT_EXPR) {
			if (!exprInput.equals("")) {
				theInput.append(exprInput);
			} else {
				theInput.append(input);
			}
		} else {
			theInput.append(input);
			INPUT_TYPE = inputtype.INPUT_SCRIPT;
		}
		
		// 2. Recognize input
		//
		pmOut = new JsonObject();
		
		// 2.1 Auto detect the input
		if (INPUT_TYPE == inputtype.INPUT_AUTO) {
			if (theInput.toString().startsWith(PREFIX_SCRIPT) || theInput.toString().startsWith("#!")) 
				INPUT_TYPE = inputtype.INPUT_SCRIPT;
		} 
		
		if (theInput.length() > 0) {
			switch(INPUT_TYPE) {
			case INPUT_JSON:
				pmIn = (new com.google.gson.Gson()).fromJson(theInput.toString(), JsonObject.class);
				break;
			case INPUT_SCRIPT:
				processScript = true;
				break;
			default:
				break;
			}
		}
		
		JsonObject pmOut = execute(pmIn, op, processScript, theInput, false);
		
		// 4. Generate output
		//
		if (!silentMode) {
			String outS = "";
			
			outS = pmOut.toString();
			
			out.write(outS.getBytes());
			out.write('\n');
			out.flush();
			out.close();
		}
	}
	
	/**
	 * 
	 * @param in
	 * @param out
	 * @param appoperation2
	 * @throws Exception  
	 */
	protected JsonObject execute(JsonObject pmIn,
			String op, boolean processScript, StringBuilder theInput, boolean isolatePMs) throws Exception {

		// 3. Process input
		//
		INPUT_TYPE = inputtype.INPUT_SCRIPT;
		
		if (((!pipe) && (!filescript) && (!processScript) && (!injectcode))) {
			if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
				injectscript = true;
				injectscriptfile = "/js/openafgui.js";
				filescript = true;
				silentMode = true;
			}
		}

		if (processScript || filescript || injectcode) {
			// Obtain script
			String script;
			
			if (filescript) {				
				if (injectscript) {
					script =  IOUtils.toString(getClass().getResourceAsStream(injectscriptfile), "UTF-8");
				} else {		    	
			    	boolean isZip = false;
			    	boolean isOpack = false;
			    	JsonObject pm = null;
			    	ZipFile tmpZip = null;
			    	
			    	// Determine if it's opack/zip
			    	DataInputStream dis = new DataInputStream(new BufferedInputStream(new FileInputStream(scriptfile.replaceFirst("::[^:]+$", ""))));
			    	int test = dis.readInt();
			    	dis.close();
			    	if (test == 0x504b0304) {
			    		isZip = true;
				    	try {
				    		tmpZip = new ZipFile(scriptfile.replaceFirst("::[^:]+$",  ""));
				    		isOpack = tmpZip.getEntry(OPACK) != null;
				    		zip = tmpZip;
				    	} catch(Exception e) {}
				    
				    	if (isOpack) {
				    		if (scriptfile.indexOf("::") <= 0) {
					    		pm = new Gson().fromJson(IOUtils.toString(zip.getInputStream(zip.getEntry(OPACK)), (Charset) null), JsonObject.class);
					    		try {
					    			pm.get("main");
					    		} catch(Exception e) { 
					    			isZip = false; 
					    		}
				    		} 
				    	}
			    	}
   	
			    	// Read normal script or opack/zip
			    	if (isZip) {
			    		if (scriptfile.indexOf("::") <= 0 && isOpack) {
				    		if (pm.get("main").getAsString().length() > 0) {
				    			script = IOUtils.toString(zip.getInputStream(zip.getEntry(pm.get("main").getAsString())), "UTF-8");
				    			scriptfile = scriptfile + "/" + pm.get("main").getAsString();
				    		} else {
				    			throw new Exception("Can't execute main script in " + scriptfile);
				    		}
			    		} else {
			    			try {
			    				script = IOUtils.toString(zip.getInputStream(zip.getEntry(scriptfile.replaceFirst(".+::", ""))), "UTF-8");
			    			} catch(NullPointerException e) {
			    				throw new Exception("Can't find " + scriptfile.replaceFirst(".+::", ""));
			    			}
			    		}
			    	} else {
			    		script = FileUtils.readFileToString(new File(scriptfile), (Charset) null);
				    	zip = null;
			    	}
			    }
			    	
			} else {
				script = theInput.toString();
			}
			
			script = script.replaceAll("^#.*", "//");
			script = script.replaceFirst(PREFIX_SCRIPT, "");
			
			if (daemon) script = "ow.loadServer().simpleCheckIn('" + scriptfile + "'); " + script + "; ow.loadServer().daemon();";
			if (injectcode) script += code;
			
			Context cx = (Context) jse.getNotSafeContext();
			cx.setErrorReporter(new WeDoOpenRhinoErrorReporter());
			
			String includeScript = "";
			NativeObject jsonPMOut = new NativeObject();
			
			synchronized(this) {
				Object opmIn;
				opmIn = AFBase.jsonParse(pmIn.toString());
				
				ScriptableObject.putProperty((Scriptable) jse.getGlobalscope(), "pmIn", opmIn);
				ScriptableObject.putProperty((Scriptable) jse.getGlobalscope(), "__pmIn", opmIn);
									
				// Add pmOut object
				Object opmOut = Context.javaToJS(jsonPMOut, (Scriptable) jse.getGlobalscope());
				ScriptableObject.putProperty((Scriptable) jse.getGlobalscope(), "pmOut", opmOut);
				ScriptableObject.putProperty((Scriptable) jse.getGlobalscope(), "__pmOut", opmOut);
				
				// Add expr object
				Object opmExpr = Context.javaToJS(exprInput, (Scriptable) jse.getGlobalscope());
				ScriptableObject.putProperty((Scriptable) jse.getGlobalscope(), "expr", opmExpr);
				ScriptableObject.putProperty((Scriptable) jse.getGlobalscope(), "__expr", opmExpr);
				ScriptableObject.putProperty((Scriptable) jse.getGlobalscope(), "__args", args);
				
				// Add scriptfile object
				Object scriptFile = Context.javaToJS(scriptfile, (Scriptable) jse.getGlobalscope());
				ScriptableObject.putProperty((Scriptable) jse.getGlobalscope(), "__scriptfile", scriptFile);
				ScriptableObject.putProperty((Scriptable) jse.getGlobalscope(), "__iszip", (zip == null) ? false: true);
	
				// Add AF class
				ScriptableObject.defineClass((Scriptable) jse.getGlobalscope(), AFBase.class, false, true);
				
				// Add DB class
				ScriptableObject.defineClass((Scriptable) jse.getGlobalscope(), DB.class, false, true);
				
				// Add CSV class
				ScriptableObject.defineClass((Scriptable) jse.getGlobalscope(), CSV.class, false, true);
				
				// Add IO class
				ScriptableObject.defineClass((Scriptable) jse.getGlobalscope(), IOBase.class, false, true);			
				
				// Add this object
				Scriptable afScript = null;
				//if  (!ScriptableObject.hasProperty((Scriptable) jse.getGlobalscope(), "AF")) {
					afScript = (Scriptable) jse.newObject((Scriptable) jse.getGlobalscope(), "AF");
				//}
				
				if (!ScriptableObject.hasProperty((Scriptable) jse.getGlobalscope(), "af"))
					((IdScriptableObject) jse.getGlobalscope()).put("af", (Scriptable) jse.getGlobalscope(), afScript);
				
				// Add the IO object
				if (!ScriptableObject.hasProperty((Scriptable) jse.getGlobalscope(), "io"))
					((IdScriptableObject) jse.getGlobalscope()).put("io", (Scriptable) jse.getGlobalscope(), jse.newObject(jse.getGlobalscope(), "IO"));
				
			}
			
			// Compile & execute script
			try {
				InputStream in1 = getClass().getResourceAsStream("/js/openaf.js");
				includeScript = IOUtils.toString(in1, (Charset) null);
				numberOfIncludedLines = numberOfIncludedLines + includeScript.split("\r\n|\r|\n").length;
				AFCmdBase.jse.addNumberOfLines(includeScript);
			} catch (Exception e) {
				SimpleLog.log(logtype.DEBUG, "Error including openaf.js", e);
			}
			cx.setErrorReporter(new WeDoOpenRhinoErrorReporter());
			
			if (isolatePMs) {
				script = "(function(__pIn) { var __pmOut = {}; var __pmIn = __pIn; " + script + "; return __pmOut; })(" + AFBase.jsonParse(pmIn.toString()) + ")";
			}
			
			Context cxl = (Context) jse.enterContext();
			org.mozilla.javascript.Script compiledScript = cxl.compileString(includeScript + script, scriptfile, 1, null);
			Object res = compiledScript.exec(cxl, (Scriptable) jse.getGlobalscope());
			jse.exitContext();
			
			if (isolatePMs && res != null && !(res instanceof Undefined)) {
				jsonPMOut = (NativeObject) res;
			} else {
				// Obtain pmOut as output
				jsonPMOut = (NativeObject) ((ScriptableObject) jse.getGlobalscope()).get("__pmOut");	
			}
			
			// Convert to ParameterMap
			Object stringify = NativeJSON.stringify(cx, (Scriptable) jse.getGlobalscope(), jsonPMOut, null, null);
			Gson gson = new com.google.gson.Gson();
			pmOut = gson.fromJson(stringify.toString(), JsonObject.class);
			
			// Leave Rhino
			//org.mozilla.javascript.Context.exit();
			//jse.exitContext();
		}
		
		return pmOut;
	}
	
	/**
	 * Main program
	 *  
	 * @param args
	 */
	public static void main(String[] args) {
		afcmd = "AFCmdOS";
		// Java version check
		String version = System.getProperty("java.version");
		if (version.startsWith("1.7") && version.lastIndexOf('_') > 0 &&
			Integer.valueOf(version.substring(version.lastIndexOf('_') +1)) < 32) {
			System.err.println("Warning: You are using java " + version + ". Please consider upgrading to >= 1.7.0_32.");
		}
	
		AFCmdOS afc = new AFCmdOS();
		AFCmdBase.args = args;
		
		try {			
			afc.processArgs(args);				
		} catch (MalformedURLException e1) {
			SimpleLog.log(SimpleLog.logtype.ERROR, "Error with the URL: " + e1.getMessage(), null);
			SimpleLog.log(SimpleLog.logtype.DEBUG, "", e1);
		}
		
		try {
			afc.execute(System.in, System.out, "");					
		} catch (Exception e1) {
			SimpleLog.log(SimpleLog.logtype.ERROR, "Error while executing operation: " + e1.getMessage(), null);
			SimpleLog.log(SimpleLog.logtype.DEBUG, "", e1);
		}
	}


}
