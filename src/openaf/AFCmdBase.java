package openaf;

import java.io.File;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.zip.ZipFile;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeFunction;
import org.mozilla.javascript.Scriptable;
import openaf.rhino.RhinoEngine;
import java.lang.String;

/**
 * 
 * Copyright 2023 Nuno Aguiar
 * 
 */
public class AFCmdBase {
	public static String VERSION = "20250726";
	public static String DISTRIBUTION = "nightly";
	public static String LICENSE = "See license info in openaf.jar/LICENSE and openaf.jar/LICENSES.txt";
	
	public static JSEngine jse;
	public static String afcmd = "AFCmdBase"; 
	public static String[] args;
	public static AFCmdBase afc;
	public static ZipFile zip;
	public static int optLevel = 9;
	public static boolean dontDIP = false;
	
	public String dIP(Object aPass) {
		if (aPass instanceof String) {
			if (!dontDIP && !((String) aPass).startsWith("$raw$")) {
				return (String) AFBase.decryptIfPossible((String) aPass);
			} else {
				if (((String) aPass).startsWith("$raw$")) return ((String) aPass).substring(5);
				return (String) aPass;
			}
		} 
		if (aPass instanceof NativeFunction) {
			try {
				Context cx = (Context) AFCmdBase.jse.enterContext();
				return (String) ((NativeFunction) aPass).call(cx, (Scriptable) AFCmdBase.jse.getGlobalscope(),
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

	public String fURL(Object aF) {
		if (aF instanceof String) {
			return (String) aF;
		} 
		if (aF instanceof NativeFunction) {
			try {
				Context cx = (Context) AFCmdBase.jse.enterContext();
				return (String) ((NativeFunction) aF).call(cx, (Scriptable) AFCmdBase.jse.getGlobalscope(),
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
	
	public AFCmdBase() {	
		// Initialize startup optimization for Java 21+
		StartupOptimizer.optimizeStartup();
		
		final ExecutorService executor = Executors.newCachedThreadPool();
		executor.execute(new Runnable() {
			@Override
			public void run() {
				SimpleLog.init();
				executor.shutdown();
			}
		});		
		restartEngine();
		afc = this;
	}
	
	public static void restartEngine() {
		jse = new RhinoEngine();
		jse.start((System.getenv().get("OAF_LEVEL") != null ? Integer.parseInt(System.getenv("OAF_LEVEL")) : optLevel));
	}
	
	protected void showHelp(String argHelp) {
		SimpleLog.log(SimpleLog.logtype.INFO, argHelp, null);
		System.exit(0);
	}
	
	public static String getJarFilePath(@SuppressWarnings("rawtypes") Class aclass) {
		String cp = System.getProperty("java.class.path");
		String[] cps = cp.split(java.io.File.pathSeparator);
		String path = null;

		for(String _cp : cps) {
			if (_cp.endsWith("openaf.jar")) {
				File f = new File(_cp);
				path = f.getAbsoluteFile().toString();
			}
		}
		
		return path;
	}
	
	/**
	 * Correct the input string adding the xml header if needed
	 * 
	 * @param pmIn the input text
	 * @return the corrected output
	 */
	public String correctInput(String pmIn) {
		if (!pmIn.startsWith("<?xml")) {
			pmIn = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" + pmIn;
		}
		
		return pmIn;
	}
}
