package wedo.openaf;

import java.io.File;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.zip.ZipFile;

import wedo.openaf.rhino.RhinoEngine;

/**
 * 
 * @author Nuno Aguiar
 * 
 */
public class AFCmdBase {
	public static String VERSION = "20171210";
	public static String DISTRIBUTION = "nightly";
	public static String LICENSE = "See license info in openaf.jar/LICENSE and openaf.jar/LICENSES.txt";
	
	public static JSEngine jse;
	public static String afcmd = "AFCmdBase"; 
	public static String[] args;
	public static AFCmdBase afc;
	public static ZipFile zip;
	public static int optLevel = 9;
	
	public String dIP(String aPass) {
		return AFBase.decryptIfPossible(aPass);
	}
	
	public AFCmdBase() {	
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
		jse.start(optLevel);
	}
	
	protected void showHelp(String argHelp) {
		SimpleLog.log(SimpleLog.logtype.INFO, argHelp, null);
		System.exit(0);
	}
	
	public static String getJarFilePath(@SuppressWarnings("rawtypes") Class aclass) {
		File f = new File(System.getProperty("java.class.path"));
		//File dir = f.getAbsoluteFile().getParentFile();
		String path = f.getAbsoluteFile().toString();
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
