package openaf;

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
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.net.MalformedURLException;
import java.nio.charset.Charset;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.zip.ZipFile;
import java.util.regex.Pattern;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.IdScriptableObject;
import org.mozilla.javascript.JSDescriptor;
import org.mozilla.javascript.JSScript;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeJSON;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.Script;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

import openaf.SimpleLog.logtype;

import java.lang.String;

/**
 * 
 * Copyright 2023 Nuno Aguiar
 * 
 */
public class AFCmdOS extends AFCmdBase {

	final public static String argHelp = "Usage: openaf [options]\n\n"
			+ "Options:\n" 
			+ "   -e (input)         - provide input directly instead of using stdin\n"
			+ "   -c (input)         - provide javascript code directly\n"
			+ "   -p                 - received streaming input (OS pipe)\n"
			+ "   -o                 - output mode (__pmOut displayed)\n"
			+ "   -f (script file)   - provide a script file directly\n"
			+ "\n"
			+ "   --install          - generates scripts to use openaf on the current directory\n"
			+ "   --check            - checks if this is the current version\n"
			+ "   --update           - updates to the most current version\n"
			+ "   --console          - interactive OpenAF console\n"
			+ "   --repack           - repack OpenAF.jar for faster startup times\n"
			+ "   --daemon           - executes a script/opack as a daemon\n"
			+ "   --script           - executes a script/opack\n"
			+ "   --sb               - generates or pre-appends openaf/ojob shebang to a js script or ojob yaml/json\n"
			+ "   --py               - runs a python script with openaf extensions\n"
			+ "\n"
			+ "   -h                 - show this help information\n"
			+ "   -v                 - show the version\n"
			+ "   -helpscript (term) - show help on a search term on scripting\n"
			+ "\n(version " + VERSION + " (" + DISTRIBUTION + "), " + LICENSE + ")";
	final protected static String OPTION_OUTPUT_MODE = "-o";
	final protected static String OPTION_DEBUG = "-debug";
	final protected static String OPTION_EXPR = "-e";
	final protected static String OPTION_CDEBUG = "-d";
	final protected static String OPTION_SILENT = "-s";
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
	final protected static String OPTION_BASHCOMPLETION = "--bashcompletion";
	final protected static String OPTION_ZSHCOMPLETION = "--zshcompletion";
	final protected static String OPTION_PIPE = "-p";
	final protected static String OPTION_CODE = "-c";
	final protected static String OPTION_SCRIPTFILE = "-f";
	final protected static String OPTION_VERSION = "-v";
	final protected static String OPTION_SB = "--sb";
	final protected static String OPTION_PY = "--py";
	final protected static String OPTION_OAFPY = "--oafpy";
	final protected static String OPTION_INTERPRET = "--i";
	final protected static String PREFIX_SCRIPT = "script:";
	final protected static String OPACK = ".package.json";
	public static enum outputtype { OUTPUT_JSON };
	public static enum inputtype { INPUT_EXPR, INPUT_JSON, INPUT_SCRIPT, INPUT_AUTO };

	public static ZipFile zip;
	
	// Performance caches for newScriptInstance
	private static final Map<String, Class<?>> classCache = new ConcurrentHashMap<>();
	private static final Map<Class<?>, Constructor<?>> constructorCache = new ConcurrentHashMap<>();
	private static final Map<String, Field> fieldCache = new ConcurrentHashMap<>();
	private static final Map<String, JSDescriptor<?>> descriptorCache = new ConcurrentHashMap<>();
	private static final Map<Class<?>, Boolean> initializedClasses = new ConcurrentHashMap<>();
	
	// Regex pattern cache to avoid recompilation
	private static final Pattern ZIP_SUFFIX_PATTERN = Pattern.compile("::[^:]+$");
	private static final Pattern PREFIX_PATTERN = Pattern.compile(".+::");
	private static final Pattern SHEBANG_PATTERN = Pattern.compile("^#.*");
	
	// Resource stream cache
	private static final Map<String, String> resourceStreamCache = new ConcurrentHashMap<>();
	
	// Compiled script cache for commonly used scripts
	private static final Map<String, org.mozilla.javascript.Script> compiledScriptCache = new ConcurrentHashMap<>();
	
	protected inputtype INPUT_TYPE = inputtype.INPUT_AUTO;
	protected String exprInput = "";
	protected String scriptfile = "";
	protected String code = "";
	protected String classfile = "";
	protected String injectscriptfile = "";
	protected String injectclassfile = "";
	protected long numberOfIncludedLines = 0;
	
	protected boolean __noSLF4JErrorOnly = true;

	protected boolean silentMode = true;
	protected boolean silenceRepack = false;
	protected boolean pipe = false;
	protected boolean compile = false;
	protected boolean filescript = false;
	protected boolean classscript = false;
	protected boolean opack = false;
	protected boolean console = false;
	protected boolean cdebug = false;
	protected boolean ojob = false;
	protected boolean injectscript = false;
	protected boolean injectclass = false;
	protected boolean daemon = false;
	protected boolean injectcode = false;
	protected com.google.gson.JsonObject pmIn, pmOut;

	//public static String[] args;
	
	@Override
	public String dIP(Object aPass) {
		if (aPass instanceof String) {
			if (!dontDIP && !((String) aPass).startsWith("$raw$")) {
				return (String) AFBase.decryptIfPossible((String) aPass);
			} else {
				if (((String) aPass).startsWith("$raw$")) return ((String) aPass).substring(5);
				return (String) aPass;
			}
		} 
		if (aPass instanceof Function) {
			try {
				Context cx = (Context) AFCmdBase.jse.enterContext();
				return (String) ((Function) aPass).call(cx, (Scriptable) AFCmdBase.jse.getGlobalscope(),
                            cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope()),
                            new Object[] { });
			} catch(Exception e) {
				return "";
			} finally {
				AFCmdBase.jse.exitContext();
			}
		}
		return null;
	}

	/**
	 * 
	 */
	public AFCmdOS() {	
		super();
		afc = this;
		afcmd = "AFCmdOS";
	}

	public AFCmdOS(boolean isEmbedded) {
		super();
		afc = this;
		afcmd = "AFCmdOS";
		this.__noSLF4JErrorOnly = !isEmbedded;
	}
	
	public void setNoSLF4JErrorOnly(boolean aFlag) {
		__noSLF4JErrorOnly = aFlag;
	}

	/**
	 * 
	 */
	protected void showHelp() {
		showHelp(argHelp);
	}	
		
	protected void showVersion() {
		showHelp("version: " + VERSION + "\ndistribution: " + DISTRIBUTION);
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
		} finally {
			if (is != null) {
				try { 
					is.close(); 
				} catch(Exception e) { }
			}
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
		} finally {
			if (is != null) {
				try { 
					is.close(); 
				} catch(Exception e) { }
			}
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
		} finally {
			if (is != null) {
				try { 
					is.close(); 
				} catch(Exception e) { }
			}
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
		} finally {
			if (is != null) is.close();
		}
		
		System.exit(0);		
	}
	
	/**
	 * Process arguments
	 * 
	 * @param args
	 * @throws MalformedURLException 
	 */
	protected void processArgs(String[] args) {
		boolean checkNext = false;
		String checkOption = "";
		
		for (String a : args) {
			if (checkNext) {
				checkNext = false;
				switch (checkOption) { 			
				case OPTION_EXPR:
					exprInput = a;
					continue;
				case OPTION_SCRIPTFILE:
					if (cdebug) code = "loadDebug('" + a + "')"; else scriptfile = a;
					continue;
				case OPTION_SB:
					exprInput = a;
					continue;
				case OPTION_PY:
					exprInput = a;
					continue;
				case OPTION_BASHCOMPLETION:
					exprInput = a;
					continue;
				case OPTION_ZSHCOMPLETION:
					exprInput = a;
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
			case OPTION_SILENT:
				silentMode = true;
				continue;
			case OPTION_OUTPUT_MODE:
				silentMode = false;
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
			case OPTION_CDEBUG:
			    cdebug = true;
				silentMode = true;
				checkNext = true;
				checkOption = OPTION_SCRIPTFILE;
				code = "";
				injectcode = true;
				continue;
			case OPTION_SCRIPTFILE:
				checkNext = true;
				checkOption = OPTION_SCRIPTFILE;
				filescript = true;
				silentMode = true;
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
			case OPTION_VERSION:
			    showVersion();
				continue;
			case OPTION_INSTALL:
				//install();
				silenceRepack = true;
				filescript = false;
				silentMode = true;
				INPUT_TYPE = inputtype.INPUT_SCRIPT;
				injectclass = true;
				injectclassfile = "genScripts_js";
				continue;
			case OPTION_OAFPY:
				filescript = false;
				silentMode = true;
				INPUT_TYPE = inputtype.INPUT_SCRIPT;
				injectclass = true;
				injectclassfile = "oafpy_js";
				continue;
			case OPTION_UPDATE:
				//update();
				silenceRepack = true;
				filescript = false;
				silentMode = true;
				INPUT_TYPE = inputtype.INPUT_SCRIPT;
				injectclass = true;
				injectclassfile = "update_js";
				continue;		
			case OPTION_OPACK:
				filescript = false;
				silentMode = true;
				INPUT_TYPE = inputtype.INPUT_SCRIPT;
				opack = true;
				//injectscript = true;
				//injectscriptfile = "/js/opack.js";
				injectclass = true;
				injectclassfile = "opack_js";
				continue;
			case OPTION_SB:
				checkNext = true;
                filescript = false;
                silentMode = true;
				INPUT_TYPE = inputtype.INPUT_SCRIPT;
				checkOption = OPTION_SB;
				injectclass = true;
                injectclassfile = "genSB_js";
                continue;
			case OPTION_PY:
				filescript = false;
				silentMode = true;
				INPUT_TYPE = inputtype.INPUT_SCRIPT;
				injectclass = true;
				injectclassfile = "pyoaf_js";
				continue;
			case OPTION_BASHCOMPLETION:
				checkNext = true;
				filescript = false;
				silentMode = true;
				INPUT_TYPE = inputtype.INPUT_SCRIPT;
				checkOption = OPTION_BASHCOMPLETION;
				injectclass = true;
				injectclassfile = "bashcompletion_js";
				continue;
			case OPTION_ZSHCOMPLETION:
				checkNext = true;
				filescript = false;
				silentMode = true;
				INPUT_TYPE = inputtype.INPUT_SCRIPT;
				checkOption = OPTION_ZSHCOMPLETION;
				injectclass = true;
				injectclassfile = "zshcompletion_js";
				continue;
            case OPTION_OJOB:
                filescript = false;
                silentMode = true;
                INPUT_TYPE = inputtype.INPUT_SCRIPT;
                ojob = true;
                //injectscript = true;
				//injectscriptfile = "/js/ojob.js";
				injectclass = true;
                injectclassfile = "ojob_js";
                continue;
			case OPTION_CONSOLE:
				filescript = false;
				silentMode = true;
				INPUT_TYPE = inputtype.INPUT_SCRIPT;
				console = true;
				//injectscript = true;
				//injectscriptfile = "/js/openafconsole.js";
				injectclass = true;
				injectclassfile = "openafconsole_js";
				continue;
			case OPTION_REPACK:
				filescript = false;
				silentMode = true;
				silenceRepack = true;
				INPUT_TYPE = inputtype.INPUT_SCRIPT;
				//injectscript = true;
				//injectscriptfile = "/js/repack.js";
				injectclass = true;
				injectclassfile = "repack_js";
				continue;
			case OPTION_INTERPRET:
				AFCmdBase.optLevel = -1;
				AFCmdBase.restartEngine();
				continue;	
			case OPTION_CHECK:
				//check();
				filescript = false;
				silentMode = true;
				INPUT_TYPE = inputtype.INPUT_SCRIPT;
				injectclass = true;
				injectclassfile = "check_js";
				continue;
			case OPTION_CODE:
				checkNext = true;
				silentMode = true;
				checkOption = OPTION_CODE;
				code = "";
				injectcode = true;
				continue;
			case OPTION_SCRIPTHELP:
				/*try {
					showHelpScript();
				} catch (IOException e) {
					SimpleLog.log(logtype.ERROR, "Error obtaining script example: " + e.getMessage(), e);
				}*/
				filescript = false;
				silentMode = true;
				INPUT_TYPE = inputtype.INPUT_SCRIPT;
				injectclass = true;
				injectclassfile = "example_js";
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
		
		
		// 1. Read the input from stdin and option -e and from a file
		//
		
		StringBuilder theInput = new StringBuilder();
		
		BufferedReader br = new BufferedReader(new InputStreamReader(in));
		
		if (pipe) {
			String lineO = "";
			while((lineO = br.readLine()) != null) {
				input.append(lineO);
				input.append("\n");
			}
		} else {
			if (!filescript && !ojob && !injectcode) {
				while (br.ready()) {
					input.append(br.readLine());
					input.append("\n");
				}			
			}
		}
		
		//br.close();
		
		if (INPUT_TYPE != inputtype.INPUT_EXPR) {
			//if (!exprInput.equals("")) {
				//theInput.append(exprInput);
			//} else {
				theInput.append(input);
			//}
		} else {
			theInput.append(input);
			INPUT_TYPE = inputtype.INPUT_SCRIPT;
		}
		
		// 2. Recognize input
		//
		
		// 2.1 Auto detect the input
		if (theInput.length() > 0) {
			if (INPUT_TYPE == inputtype.INPUT_AUTO) {
				if (theInput.toString().startsWith(PREFIX_SCRIPT) || theInput.toString().startsWith("#!")) 
					INPUT_TYPE = inputtype.INPUT_SCRIPT;
				else
					INPUT_TYPE = inputtype.INPUT_JSON;
			} 
		
			switch(INPUT_TYPE) {
			case INPUT_JSON:
				try {
					pmIn = (new com.google.gson.Gson()).fromJson(theInput.toString(), JsonObject.class);
					break;
				} catch(Exception e) {
					INPUT_TYPE = inputtype.INPUT_SCRIPT;
				}
			case INPUT_SCRIPT:
				pmIn = new JsonObject();
				processScript = true;
				break;
			default:
				pmIn = new JsonObject();
				break;
			}
		} else {
			//pmIn = new JsonObject();
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
	protected com.google.gson.JsonObject execute(com.google.gson.JsonObject pmIn,
			String op, boolean processScript, StringBuilder theInput, boolean isolatePMs) throws Exception {

		// 3. Process input
		//
		INPUT_TYPE = inputtype.INPUT_SCRIPT;
		
		if (((!pipe) && (!filescript) && (!processScript) && (!injectcode) && (!injectclass))) {
			if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
				injectclass = true;
				injectclassfile = "openafgui_js";
				filescript = false;
				silentMode = true;
			}
		}

		if (processScript || filescript || injectcode || injectclass) {
			// Obtain script
			String script = "";
			
			if (filescript) {				
				if (injectscript) {
					// Cache resource streams to avoid repeated I/O
					script = resourceStreamCache.computeIfAbsent(injectscriptfile, key -> {
						java.io.InputStream stream = getClass().getResourceAsStream(key);
						if (stream != null) {
							try {
								return IOUtils.toString(stream, "UTF-8");
							} catch (IOException e) {
								return "";
							} finally {
								try { stream.close(); } catch (IOException e) { }
							}
						}
						return "";
					});
				} else {		    	
			    	boolean isZip = false;
			    	boolean isOpack = false;
			    	com.google.gson.JsonObject pm = null;
			    	ZipFile tmpZip = null;
			    	
					// Determine if it's opack/zip
					if (!scriptfile.endsWith(".js")) {
						String baseScriptPath = ZIP_SUFFIX_PATTERN.matcher(scriptfile).replaceFirst("");
						DataInputStream dis = new DataInputStream(new BufferedInputStream(new FileInputStream(baseScriptPath)));
						int test = 0;
						if (dis != null) {
							try {
								test = dis.readInt();
							} finally {
								dis.close();
							}
						}
						
						if (test == 0x504b0304) {
							isZip = true;
							try {
								tmpZip = new ZipFile(baseScriptPath);
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
		    				String innerPath = PREFIX_PATTERN.matcher(scriptfile).replaceFirst("");
		    				script = IOUtils.toString(zip.getInputStream(zip.getEntry(innerPath)), "UTF-8");
		    			} catch(NullPointerException e) {
		    				String innerPath = PREFIX_PATTERN.matcher(scriptfile).replaceFirst("");
		    				throw new Exception("Can't find " + innerPath);
		    			}
		    		}
		    	} else {
		    		script = FileUtils.readFileToString(new File(scriptfile), (Charset) null);
			    	zip = null;
		    	}
		    }
		    	
		} else {
			if (!injectclass) script = theInput.toString();
		}
		
		if (script != null) {
				if (injectcode) script = code + "\n" + script;
				if (script.startsWith("#") || script.startsWith(PREFIX_SCRIPT)) {
					script = SHEBANG_PATTERN.matcher(script).replaceAll("//");
					script = script.replaceFirst(Pattern.quote(PREFIX_SCRIPT), "");
				}
				
				if (daemon) script = "ow.loadServer().simpleCheckIn('" + scriptfile + "'); " + script + "; ow.loadServer().daemon();";
			}
			
			Context cx = (Context) jse.getNotSafeContext();
			//cx.setErrorReporter(new OpenRhinoErrorReporter()); 
			
			NativeObject jsonPMOut = new NativeObject();

			Object opmIn; 
			Scriptable gscope = (Scriptable) jse.getGlobalscope();
			Object noSLF4JErrorOnly = Context.javaToJS(__noSLF4JErrorOnly, gscope);
			
			// Issue 34 - Already initialized in AFCmdBase static block
			/*if (__noSLF4JErrorOnly) {
				// Set logging to ERROR 
				try {
					ch.qos.logback.classic.Logger rootLogger = (ch.qos.logback.classic.Logger) org.slf4j.LoggerFactory.getLogger(ch.qos.logback.classic.Logger.ROOT_LOGGER_NAME);
					for (ch.qos.logback.classic.Logger logger : rootLogger.getLoggerContext().getLoggerList()) {
						if (logger.getLevel() != ch.qos.logback.classic.Level.ERROR) {
							logger.setLevel(ch.qos.logback.classic.Level.ERROR);
						}
					}
				} catch (Exception e) {
				}
			}*/

			if (pmIn != null) {
				opmIn = AFBase.jsonParse(pmIn.toString(), false);
			} else {
				opmIn = AFCmdBase.jse.newObject(gscope);
			}
			
			// ScriptableObject operations are thread-safe, no need for synchronization during startup
			ScriptableObject.putProperty(gscope, "__noSLF4JErrorOnly", noSLF4JErrorOnly);

			ScriptableObject.putProperty(gscope, "pmIn", opmIn);
			ScriptableObject.putProperty(gscope, "__pmIn", opmIn);

			// Add pmOut object
			Object opmOut = Context.javaToJS(jsonPMOut, gscope);
			ScriptableObject.putProperty(gscope, "pmOut", opmOut);
			ScriptableObject.putProperty(gscope, "__pmOut", opmOut);

			// Add expr object
			Object opmExpr = Context.javaToJS(exprInput, gscope);
			ScriptableObject.putProperty(gscope, "expr", opmExpr);
			ScriptableObject.putProperty(gscope, "__expr", opmExpr);
			ScriptableObject.putProperty(gscope, "__args", args);

			// Add scriptfile object
			if (filescript) {
				Object scriptFile = Context.javaToJS(scriptfile, gscope);
				ScriptableObject.putProperty(gscope, "__scriptfile", scriptFile);
				ScriptableObject.putProperty(gscope, "__iszip", (zip == null) ? false: true);
			}

			// Add AF class (only if not already defined)
			if (!ScriptableObject.hasProperty(gscope, "AF"))
				ScriptableObject.defineClass(gscope, AFBase.class, false, true);

			// Add DB class (only if not already defined)
			if (!ScriptableObject.hasProperty(gscope, "DB"))
				ScriptableObject.defineClass(gscope, DB.class, false, true);

			// Add CSV class (only if not already defined)
			if (!ScriptableObject.hasProperty(gscope, "CSV"))
				ScriptableObject.defineClass(gscope, CSV.class, false, true);

			// Add IO class (only if not already defined)
			if (!ScriptableObject.hasProperty(gscope, "IO"))
				ScriptableObject.defineClass(gscope, IOBase.class, false, true);

			// Add this object
			Scriptable afScript = null;
			afScript = (Scriptable) jse.newObject(gscope, "AF");

			if (!ScriptableObject.hasProperty(gscope, "af"))
				ScriptableObject.putProperty(gscope, "af", afScript);

			// Add the IO object
			if (!ScriptableObject.hasProperty(gscope, "io"))
				ScriptableObject.putProperty(gscope, "io", jse.newObject(gscope, "IO"));

			AFBase.runFromClass(newScriptInstance("openaf_js"));
			cx.setErrorReporter(new OpenRhinoErrorReporter());
			
			if (isolatePMs) {
				script = "(function(__pIn) { var __pmOut = {}; var __pmIn = __pIn; " + script + "; return __pmOut; })(" + pmIn + ")";
			}

			script = "try{" + script + "\n;} catch(_e) { $err(_e) }";
			
			Object res = null;
			if (injectscript || filescript || injectcode || processScript) {
				Context cxl = (Context) jse.enterContext();
				// Cache commonly compiled scripts to avoid recompilation
				String cacheKey = (filescript ? scriptfile : "inline_" + System.identityHashCode(script));
				org.mozilla.javascript.Script compiledScript = compiledScriptCache.get(cacheKey);
				if (compiledScript == null) {
					compiledScript = cxl.compileString(script, scriptfile, 1, null);
					// Only cache file scripts, not inline ones, to save memory
					if (filescript && compiledScriptCache.size() < 256) {
						compiledScriptCache.put(cacheKey, compiledScript);
					}
				}
				Object tempRes = compiledScript.exec(cxl, gscope, gscope);
				res = tempRes;
				jse.exitContext();
			} 

			if (injectclass) {
				res = AFBase.runFromClass(newScriptInstance(injectclassfile));
			}
			
			if (isolatePMs && res != null && !(res instanceof Undefined)) {
				jsonPMOut = (NativeObject) res;
			} else {
				// Obtain pmOut as output
				jsonPMOut = (NativeObject) ((ScriptableObject) jse.getGlobalscope()).get("__pmOut");	
			}
			
			// Convert to ParameterMap
			Object stringify = NativeJSON.stringify(cx, gscope, jsonPMOut, null, null);
			try {
				// Issue #125
				Class.forName("com.google.gson.Gson");
				Class.forName("com.google.gson.internal.Primitives");
				Gson gson = new Gson();
				pmOut = gson.fromJson(stringify.toString(), JsonObject.class);
			} catch(Exception e) {
				//
			}
		}
		
		return pmOut;
	}
	
	/**
	 * Main program
	 *  
	 * @param args
	 */
	public static void main(String[] args) {
		// Java version check
		/*String version = System.getProperty("java.version");
		if (version.startsWith("1.7") && version.lastIndexOf('_') > 0 &&
			Integer.valueOf(version.substring(version.lastIndexOf('_') +1)) < 32) {
			System.err.println("Warning: You are using java " + version + ". Please consider upgrading to >= 1.7.0_32.");
		}*/

		AFCmdOS afc = new AFCmdOS();
		AFCmdBase.args = args;

		//try {			
			afc.processArgs(args);				
		/*} catch (MalformedURLException e1) {
			SimpleLog.log(SimpleLog.logtype.ERROR, "Error with the URL: " + e1.getMessage(), null);
			SimpleLog.log(SimpleLog.logtype.DEBUG, "", e1);
		}*/
		
		try {
			afc.execute(System.in, System.out, "");					
		} catch (Exception e1) {
			SimpleLog.log(SimpleLog.logtype.ERROR, "Error while executing operation: " + e1.getMessage(), null);
			SimpleLog.log(SimpleLog.logtype.DEBUG, "", e1);
		}
	}

	// Helper to initialize a class only once
	private static void initCompiledClassOnce(Class<?> cls) throws Exception {
		if (!initializedClasses.containsKey(cls)) {
			AFBase.initCompiledClass(cls);
			initializedClasses.put(cls, Boolean.TRUE);
		}
	}

	private static Script newScriptInstance(String className) throws Exception {
		// Fast path: check descriptor cache first (most common case)
		JSDescriptor<?> cachedDescriptor = descriptorCache.get(className);
		if (cachedDescriptor != null) {
			return new JSScript((JSDescriptor) cachedDescriptor, null);
		}
		
		// Cache class lookup
		Class<?> cls = classCache.computeIfAbsent(className, key -> {
			try {
				return Class.forName(key);
			} catch (ClassNotFoundException e) {
				throw new RuntimeException(e);
			}
		});
		
		// Try cached constructor approach (second fastest)
		Constructor<?> constructor = constructorCache.get(cls);
		if (constructor != null) {
			try {
				Script script = (Script) constructor.newInstance();
				initCompiledClassOnce(cls);
				return script;
			} catch (Exception e) {
				// Cache was invalid, remove it and continue
				constructorCache.remove(cls);
			}
		}

		// Try to get and cache constructor
		try {
			constructor = cls.getDeclaredConstructor();
			constructorCache.put(cls, constructor);
			Script script = (Script) constructor.newInstance();
			initCompiledClassOnce(cls);
			return script;
		} catch (NoSuchMethodException e) {
			// Fall through to descriptor approach
		}
		
		// Descriptor-based approach
		try {
			Class.forName(className + "Main", true, cls.getClassLoader());
			
			// Cache field lookup and accessibility
			Field field = fieldCache.computeIfAbsent(className, key -> {
				try {
					Field f = cls.getDeclaredField("_descriptors");
					f.setAccessible(true);
					return f;
				} catch (NoSuchFieldException e) {
					throw new RuntimeException(e);
				}
			});
			
			JSDescriptor<?>[] descriptors = (JSDescriptor<?>[]) field.get(null);
			if (descriptors == null || descriptors.length == 0 || descriptors[0] == null) {
				throw new IllegalStateException("Missing JS descriptors for " + className);
			}
			
			// Cache descriptor for future fast-path access
			descriptorCache.put(className, descriptors[0]);
			initCompiledClassOnce(cls);
			return new JSScript((JSDescriptor) descriptors[0], null);
		} catch (Throwable initFailure) {
			return compileScriptFromResource(cls, className);
		}
	}

	private static Script compileScriptFromResource(Class<?> cls, String className) throws Exception {
		String resourceName = "js/openaf.js";
		// Cache compiled resource scripts
		String cacheKey = "resource_" + className;
		org.mozilla.javascript.Script cached = compiledScriptCache.get(cacheKey);
		if (cached != null) {
			return cached;
		}
		
		try (InputStream in = cls.getClassLoader().getResourceAsStream(resourceName)) {
			if (in == null) {
				throw new IllegalStateException("Unable to load " + resourceName + " for " + className);
			}
			Context cx = (Context) AFCmdBase.jse.enterContext();
			try {
				InputStreamReader reader = new InputStreamReader(in, StandardCharsets.UTF_8);
				org.mozilla.javascript.Script compiled = cx.compileReader(reader, resourceName, 1, null);
				// Cache for future use
				if (compiledScriptCache.size() < 256) {
					compiledScriptCache.put(cacheKey, compiled);
				}
				return compiled;
			} finally {
				AFCmdBase.jse.exitContext();
			}
		}
	}


}
