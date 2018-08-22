package openaf;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Type;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.Charset;
import java.nio.file.CopyOption;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Scanner;
import java.util.zip.ZipFile;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.apache.commons.codec.binary.Base64;
import org.apache.commons.codec.binary.Hex;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.mozilla.javascript.Callable;
import org.mozilla.javascript.CompilerEnvirons;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextFactory;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.NativeJSON;
import org.mozilla.javascript.NativeJavaArray;
import org.mozilla.javascript.NativeJavaObject;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.Script;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.mozilla.javascript.annotations.JSFunction;
import org.mozilla.javascript.commonjs.module.Require;
import org.mozilla.javascript.commonjs.module.RequireBuilder;
import org.mozilla.javascript.commonjs.module.provider.SoftCachingModuleScriptProvider;
import org.mozilla.javascript.commonjs.module.provider.UrlModuleSourceProvider;
import org.mozilla.javascript.optimizer.ClassCompiler;
import org.mozilla.javascript.tools.debugger.Main;
import org.mozilla.javascript.xml.XMLObject;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import com.warrenstrange.googleauth.GoogleAuthenticatorQRGenerator;
import openaf.JSEngine.JSList;
import openaf.JSEngine.JSMap;
import openaf.SimpleLog.logtype;

/**
 * 
 * @author Nuno Aguiar
 * 
 */
public class AFBase extends ScriptableObject {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private static final String K = "openappframework";

	@JSFunction
	public static Object fromJson(String in) throws Exception {
		return jsonParse(in);
    }		

	/**
	 * <odoc>
	 * <key>af.restartOpenAF(aCommandLineArray)</key>
	 * Terminates the current OpenAF execution and tries to start a new with the same command
	 * line, if aCommandLineArray is not provided. If aCommandLineArray is provided each array
	 * element will be use sequentially to build the command line to start a new OpenAF instance. 
	 * </odoc>
	 */
	@JSFunction
	public static void restartOpenAF(Object args) throws IOException {
		String javaBin = java.lang.System.getProperty("java.home") + java.io.File.separator + "bin" + java.io.File.separator + "java";
		File currentJar;
		try {
			currentJar = new File(Class.forName("openaf.AFCmdBase").getProtectionDomain().getCodeSource().getLocation().toURI());
		} catch(Exception e) {
			currentJar = new File(java.lang.System.getProperties().getProperty("java.class.path"));
		}
		
		/* is it a jar file? */
		if(!currentJar.getName().endsWith(".jar"))
			return;
	
		/* Build command: java -jar application.jar */
		ArrayList<String> command = new ArrayList<String>();
		command.add(javaBin);
		command.add("-jar");
		command.add(currentJar.getPath());
		
		if (args instanceof NativeArray) {
			ArrayList<String> al = new ArrayList<String>();
			for(Object o : ((NativeArray) args).toArray()) {
				al.add(o.toString());	
			}
		
			for(String c : al) {
				command.add(c);
			}
		} else {
			for(String c : AFCmdBase.args) {
				command.add(c);
			}
		}
	
		ProcessBuilder builder = new ProcessBuilder(command);
		builder.inheritIO();
		builder.start();
		java.lang.System.exit(0);
	}

	/**
	 * 
	 * @param url
	 * @return
	 */
	public static String correctUrlString(String url) {
		if (!url.endsWith("/"))
			url = url + "/";

		return url;
	}
	
	/**
	 * 
	 * @param out
	 * @return
	 */
	@JSFunction
	public static Object jsonParse(String out) {
		Context cx = (Context) AFCmdBase.jse.enterContext();
		Object ret;
		
		if (!(out != null && out.length() > 0)) {
			ret = AFCmdBase.jse.newObject(AFCmdBase.jse.getGlobalscope());
		} else {
			ret = NativeJSON.parse(cx, (Scriptable) AFCmdBase.jse.getGlobalscope(), out, new Callable() {
				@Override
				public Object call(Context cx, Scriptable scope,
						Scriptable thisObj, Object[] args) {
					return args[1];
				} 
			});
		}
		AFCmdBase.jse.exitContext();
		return ret;
	}
	
	@JSFunction
	public static Object toJavaMap(Object json) {
		Context cx = (Context) AFCmdBase.jse.enterContext();
		
		if (json instanceof NativeObject) {
			Type type = new TypeToken<Map<String, Object>>(){}.getType();
			
			Map<String, String> m = (new Gson()).fromJson((String) NativeJSON.stringify(cx, (Scriptable) AFCmdBase.jse.getGlobalscope(), json, null, "  "), type);
			return m;
		}
		
		AFCmdBase.jse.exitContext();
		return null;
	}
	
	@JSFunction
	public static Object fromJavaMap(Object m) {
		Type type = new TypeToken<Map<String, Object>>(){}.getType();
		if (m instanceof NativeJavaObject) m = ((NativeJavaObject) m).unwrap();
		
		Object res = m;
		try {
			res = jsonParse((new Gson()).toJson(m, type));
		} catch (Exception e) {} 
		return res;
	}

	/**
	 * <odoc>
	 * <key>af.js2s(aObject) : String</key>
	 * Tries to convert an object into a beautified string representation.
	 * </odoc>
	 */
	@JSFunction
	public String js2s(Object no) {
		AFCmdBase.jse.defineSerialize();
		
		if (no instanceof Undefined) return "undefined";
 		if (no instanceof NativeJavaObject) 
			no = ((NativeJavaObject) no).unwrap().toString();
 		if (no instanceof XMLObject) {
 			no = fromXML(no);
 		}
 		
 		Context cx = (Context) AFCmdBase.jse.enterContext();
 		Object stringify;
 		synchronized(AFCmdBase.jse.getGlobalscope()) {
	 		stringify = AFCmdBase.jse.stringify(no, cx.evaluateString(
							(Scriptable) AFCmdBase.jse.getGlobalscope(), "getSerialize()", "", 1, null), 2);
 		}
 		AFCmdBase.jse.exitContext();
		
		return stringify.toString();
	}
	

	/**
	 * <odoc>
	 * <key>af.p(aString)</key>
	 * Outputs to stdout aString ending with a newline.
	 * </odoc>
	 */
	@JSFunction
	public void p(String p) {
		System.out.println(p);
	}

	/**
	 * <odoc>
	 * <key>af.pnl(aString)</key>
	 * Outputs to stdout aString without a newline on the end.
	 * </odoc>
	 */
	@JSFunction
	public void pnl(String p) {
		System.out.print(p);
	}
	
	/**
	 * <odoc>
	 * <key>af.e(aString)</key>
	 * Outputs to stderr aString ending with a newline.
	 * </odoc>
	 */
	@JSFunction
	public void e(String p) {
		System.err.println(p);
	}
	
	/**
	 * <odoc>
	 * <key>af.enl(aString)</key>
	 * Outputs to stderr aString without a newline on the end.
	 * </odoc>
	 */
	@JSFunction
	public void enl(String p) {
		System.err.print(p);
	}
	
	
	/**
	 * <odoc>
	 * <key>af.fromBytes2String(anArrayOfBytes) : aString</key>
	 * Converts anArrayOfBytes into a string.
	 * </odoc>
	 */
	@JSFunction
	public String fromBytes2String(Object bytes) {
		byte[] conv;
		if (bytes instanceof NativeJavaArray) {
			conv = (byte[]) ((NativeJavaArray) bytes).unwrap();
		} else {
			conv = (byte[]) bytes;
		}
		return new String(conv);
	}
	
	/**
	 * <odoc>
	 * <key>af.fromString2Bytes(aString) : anArrayOfBytes</key>
	 * Converts aString into anArrayOfBytes.
	 * </odoc>
	 */
	@JSFunction
	public Object fromString2Bytes(String s) {
		return s.getBytes();
	}
	
	/**
	 * <odoc>
	 * <key>af.fromXML(aXMLObject) : aString</key>
	 * Converts aXMLObject (E4X) into a String. Warning: beware that E4X is an obsolete object.
	 * </odoc>
	 */
	@JSFunction
	public static String fromXML(Object xml) {
		if (xml instanceof XMLObject) 
			return ((String) (ScriptableObject.callMethod((XMLObject) xml, "toXMLString", new Object[0])));
		else 
			return null;
	}
	
	/**
	 * <odoc>
	 * <key>af.mkdir(aNewDirectory) : boolean</key>
	 * Tries to create aNewDirectory. Returns true if successfull, false otherwise.
	 * </odoc>
	 */
	@JSFunction
	public boolean mkdir(String newDirectory) throws IOException {
		return (new File(newDirectory)).mkdirs();
	}
	
	/**
	 * <odoc>
	 * <key>af.sleep(aTime)</key>
	 * Suspends the current script execution (if using Threads only the thread executing this function) for a 
	 * period of aTime in ms. For example aTime = 1000 would result in suspending the execution for 1 second.
	 * </odoc>
	 */
	@JSFunction
	public synchronized void sleep(double time) {
		try {
			Thread.sleep((long) time);
		} catch (InterruptedException e) {
		}
	}
	
	/**
	 * <odoc>
	 * <key>af.sh(commandArguments, aStdIn, aTimeout, shouldInheritIO, aDirectory, returnMap) : String/Map</key>
	 * Tries to execute commandArguments (either a String or an array of strings) in the operating system. Optionally
	 * aStdIn can be provided, aTimeout can be defined for the execution and if shouldInheritIO is true the stdout, stderr and stdin
	 * will be inherit from OpenAF. If shouldInheritIO is not defined or false it will return the stdout of the command execution.
	 * It's possible also to provide a different working aDirectory.
	 * The variables __exitcode and __stderr can be checked for the command exit code and the stderr output correspondingly. In alternative 
	 * if returnMap = true a map will be returned with stdout, stderr and exitcode.
	 * </odoc>
	 */
	@JSFunction
	public Object sh(Object s, String in, Object timeout, boolean inheritIO, Object directory, boolean returnObj) throws IOException, InterruptedException {
		ProcessBuilder pb = null;
		if (s instanceof NativeArray) {
			ArrayList<String> al = new ArrayList<String>();
			for(Object o : ((NativeArray) s).toArray()) {
				al.add(o.toString());	
			}
			
			pb = new ProcessBuilder(Arrays.copyOf(al.toArray(), al.size(), String[].class));
		} else {
			if (System.getProperty("os.name").startsWith("Windows")) {
				pb = new ProcessBuilder(((String) s).split(" (?=([^\"]*\"[^\"]*\")*[^\"]*$)"));
			} else {
				pb = new ProcessBuilder(((String) s).split(" (?=([^\']*\'[^\']*\')*[^\']*$)"));
			}
		} 
		
		if (inheritIO) pb.inheritIO();
		if (!(directory == null || directory instanceof org.mozilla.javascript.Undefined)) {
			pb.directory(new File((String) directory));
		}
		
		final Process p = pb.start();
		//p = Runtime.getRuntime().exec(s);
			
		if (in != null) {
			try {
				OutputStream stdin = p.getOutputStream();
				stdin.write(in.getBytes());
				stdin.close();
			} catch(IOException e) {}
		}

		InputStream is, iserr;
		if(inheritIO) {
			is = null; iserr = null;
			IOUtils.copy(p.getInputStream(), System.out);
			IOUtils.copy(p.getErrorStream(), System.err);
		} else {
			is = p.getInputStream();
			iserr = p.getErrorStream();
		}

		String lines = new String(); 
		String linesErr = new String();

		int exit = -1; 
		try {
			if (timeout == null || timeout instanceof org.mozilla.javascript.Undefined) {
				if (is != null   ) lines = IOUtils.toString(is, (Charset) null);
				if (iserr != null) linesErr = IOUtils.toString(iserr, (Charset) null);
				exit = p.waitFor(); 
				if (is != null   ) is.close();
				if (iserr != null) iserr.close();
			} else {
				Thread t = new Thread() {
					public void run() {
						try {
							p.waitFor();						
						} catch(InterruptedException e) {
							return;
						}
					}
				};
				//t.start();
				long tt = Double.valueOf(Double.parseDouble(timeout.toString())).longValue();
				if (tt >= 0) {
					try {
						//t.join(tt); // not working in some cases
						long limit = java.lang.System.currentTimeMillis() + tt;
						while(java.lang.System.currentTimeMillis() < limit && p.isAlive()) {
							Thread.sleep(10);
							//long now = java.lang.System.currentTimeMillis();
							//if (limit > now) t.wait(limit - now);
						}
					} catch(InterruptedException e) {
						t.interrupt();
						Thread.currentThread().interrupt();
					} finally {
						if (is != null    && !p.isAlive()) lines = IOUtils.toString(is, (Charset) null);
						if (iserr != null && !p.isAlive()) linesErr = IOUtils.toString(iserr, (Charset) null);
						p.destroy();
						p.destroyForcibly();
						if (is != null   ) is.close();
						if (iserr != null) iserr.close();
					}
					if (!p.isAlive()) exit = p.exitValue();
				} else {
					return null;
				}
			}
		} catch(IllegalMonitorStateException e) {
			//exit = p.exitValue();
		}

		p.getInputStream().close();
		p.getErrorStream().close();
		
		if (returnObj) {
			JSEngine.JSMap no = AFCmdBase.jse.getNewMap(null);
			no.put("stdout", lines);
			no.put("stderr", linesErr);
			no.put("exitcode", exit);
			return no.getMap();
		} else {
			((ScriptableObject) AFCmdBase.jse.getGlobalscope()).defineProperty("__exitcode", exit, ScriptableObject.PERMANENT);
			((ScriptableObject) AFCmdBase.jse.getGlobalscope()).defineProperty("__stderr", linesErr, ScriptableObject.PERMANENT);
			return lines;
		}
	}
	

	/**
	 * <odoc>
	 * <key>af.rm(aFilePath)</key>
	 * Tries to delete a file or a directory on the provided aFilePath. In case it's a directory it will try to 
	 * recursively delete all directory contents.
	 * </odoc>
	 */
	@JSFunction
	public boolean rm(String filepath) throws java.io.IOException {
		File file = new File(filepath);

		if (!(file.isDirectory())) {
			return Files.deleteIfExists(Paths.get(filepath, new String[0]));
		} 
		
		FileUtils.deleteDirectory(new File(filepath));
		return true;
	}
	
	/**
	 * <odoc>
	 * <key>af.rename(aSourceFilePath, aTargetFilePath)</key>
	 * Tries to rename aSourceFilePath to aTargetFilePath.
	 * </odoc>
	 * @throws IOException 
	 */
	@JSFunction
	public boolean rename(String orig, String dest) {
		return (new File(orig)).renameTo(new File(dest));
	}

	/**
	 * <odoc>
	 * <key>af.mv(aSourceFilePath, aTargetFilePath)</key>
	 * Tries to move aSourceFilePath to aTargetFilePath preserving file attributes.
	 * </odoc>
	 * @throws IOException 
	 */
	@JSFunction
	public boolean mv(String orig, String dest) throws IOException {
		return Files.move((new File(orig)).toPath(), (new File(dest)).toPath(), new CopyOption[] { StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE }) != null;
	}

	/**
	 * <odoc>
	 * <key>af.cp(aSourceFilePath, aTargetFilePath)</key>
	 * Tries to copy aSourceFilePath to aTargetFilePath preserving file attributes.
	 * </odoc>
	 * @throws IOException 
	 */
	@JSFunction
	public boolean cp(String orig, String dest) throws IOException {
		Files.copy((new File(orig)).toPath(), (new File(dest)).toPath(), new CopyOption[] { StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.COPY_ATTRIBUTES, StandardCopyOption.ATOMIC_MOVE });
		return (new File(orig)).delete();
	}
	
	/**
	 * <odoc>
	 * <key>af.encrypt(aString, aKey) : String</key>
	 * Encrypts the provided aString as password for most of the OpenAF password
	 * functionality. If aKey is provided it will encrypt using it.
	 * </odoc>
	 * @throws Exception 
	 */
	@JSFunction
	public static String encrypt(String aString, Object key) throws Exception {
		if (key == null || key instanceof Undefined) key = "openappframework";
		if (key instanceof String) key = ((String) key).getBytes();
		if (((byte[]) key).length < 16) throw new Exception("Invalid key size. Key should be, at least, 16 bytes."); 

		SecureRandom sc = new SecureRandom();
		byte[] biv = sc.generateSeed(16);
		IvParameterSpec iv = new IvParameterSpec(biv);
		SecretKeySpec skeySpec = new SecretKeySpec((byte[]) key, "AES");

		Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5PADDING");
		cipher.init(Cipher.ENCRYPT_MODE, skeySpec, iv);

		byte[] encrypted = cipher.doFinal(aString.getBytes());
		return (Hex.encodeHexString(encrypted) + Hex.encodeHexString(biv)).toUpperCase();
	}
	
	/**
	 * <odoc>
	 * <key>af.decrypt(aString, aKey) : String</key>
	 * Decrypts the provided aString with the provided aKey. 
	 * </odoc>
	 * @throws Exception
	 */
	@JSFunction
	public static String decrypt(String aString, Object key) throws Exception {
		if (key == null || key instanceof Undefined) key = "openappframework"; 
		if (key instanceof String) key = ((String) key).getBytes();
		
		if (((byte[]) key).length < 16) throw new Exception("Invalid key size. Key should be, at least, 16 bytes."); 
		String initVector = aString.substring(aString.length() - 32);
		IvParameterSpec iv = new IvParameterSpec(Hex.decodeHex(initVector.toCharArray()));
		SecretKeySpec skeySpec = new SecretKeySpec((byte[]) key, "AES");

		Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5PADDING");
		cipher.init(Cipher.DECRYPT_MODE, skeySpec, iv);

		byte[] original = cipher.doFinal(Hex.decodeHex(aString.substring(0, aString.length()-32).toCharArray()));

		return new String(original);
	}
	
	/**
	 * Try to decrypt the password if encrypted. Otherwise return the same password.
	 * 
	 * @param aPassword
	 * @return
	 */
	public static String decryptIfPossible(String aPassword) {
		try {                          
			String r = decrypt(aPassword, K);
			if (r == null) return aPassword; else return r;
		} catch (Exception e) {
			return aPassword;
		}
	}
	
	@JSFunction
	public void writeFile(String filename, Object pmIn, String encoding, boolean sa) throws Exception {
		throw(new Exception("af.writeFile was deprecated. Please replace with io.writeFile."));
	}
	
	@JSFunction
	public void writeFileString(String filename, String pmIn, String encoding, boolean sa) throws Exception {
		throw(new Exception("af.writeFileString was deprecated. Please replace with io.writeFileString."));
	}
	
	@JSFunction
	public void writeFileXML(String filename, Object xml, String encoding, boolean sa) throws Exception {
		throw(new Exception("af.writeFileXML was deprecated. Please replace with io.writeFileXML."));
	}

	@JSFunction
	public void writeFileBytes(String filename, Object pmIn) throws Exception {
		throw(new Exception("af.writeFileBytes was deprecated. Please replace with io.writeFileBytes."));
	}
	
	@JSFunction
	public void writeFileAsArray(String filename, Object lines, String encoding) throws Exception {
		throw(new Exception("af.writeFileAsArray was deprecated. Please replace with io.writeFileAsArray."));
	}

	@JSFunction
	public Object listFiles(String filepath) throws Exception {
		throw(new Exception("af.listFiles was deprecated. Please replace with io.listFiles."));
	}
	
	@JSFunction
	public Object readFile(String filename, String encoding) throws Exception {
		throw(new Exception("af.readFile was deprecated. Please replace with io.readFile."));
	}

	@JSFunction
	public Object readFileAsArray(String filename, String encoding) throws Exception {
		throw(new Exception("af.readFileAsArray was deprecated. Please replace with io.readFileAsArray."));
	}

	@JSFunction
	public String readFileString(String filename, String encoding) throws Exception {
		throw(new Exception("af.readFileString was deprecated. Please replace with io.readFileString."));
	}
		
	@JSFunction
	public Object readFileXML(String filename, int skipLines, String encoding) throws Exception {
		throw(new Exception("af.readFileXML was deprecated. Please replace with io.readFileXML."));
	}
	
	@JSFunction
	public Object readFileBytes(String filename) throws Exception {
		throw(new Exception("af.readFileBytes was deprecated. Please replace with io.readFileBytes."));
	}	


	/**
	 * <odoc>
	 * <key>af.plugin(aPluginClass)</key>
	 * Loads a OpenAF's plugin class (aPluginClass).
	 * </odoc>
	 */
	@SuppressWarnings("unchecked")
	@JSFunction
	public void plugin(String clName) throws ReflectiveOperationException {
		try {
			@SuppressWarnings("rawtypes")
			Class cl = Class.forName(clName);
		
			ScriptableObject.defineClass((Scriptable) AFCmdBase.jse.getGlobalscope(), cl, false, true);
		} catch (ClassNotFoundException | IllegalAccessException | InstantiationException | InvocationTargetException e) {
			SimpleLog.log(SimpleLog.logtype.DEBUG, "Cannot find class: " + clName + "; " + e.getMessage(), e);
			throw e;
		}
	}
	
	/**
	 * <odoc>
	 * <key>af.externalPlugin(anArrayOfClasspathEntries, aPluginClass)</key>
	 * Loads a OpenAF's plugin identified by the aPluginClass that isn't available in the initial OpenAF's classpath,
	 * loaded from a list of jars/folders in anArrayOfClasspathEntries.
	 * </odoc> 
	 */
	@SuppressWarnings("unchecked")
	@JSFunction 
	public void externalPlugin(Object locs, String clName) throws Exception {
		try {
			ArrayList<URL> aURLs = new ArrayList<URL>();
			if (!(locs instanceof NativeArray)) return;
			AFCmdBase.jse.enterContext();
			for(Object loc : (NativeArray) locs) {
				aURLs.add(new URL(Context.toString(loc)));
			}
			AFCmdBase.jse.exitContext();
			URL[] urls = {};
			urls = aURLs.toArray(urls);
			URLClassLoader loader = new URLClassLoader(urls, Thread.currentThread().getContextClassLoader());
			@SuppressWarnings("rawtypes")
			Class cl = Class.forName(clName, true, loader);
			
			ScriptableObject.defineClass((Scriptable) AFCmdBase.jse.getGlobalscope(), cl, false, true);
		} catch (ClassNotFoundException | IllegalAccessException | InstantiationException | InvocationTargetException | MalformedURLException e) {
			SimpleLog.log(SimpleLog.logtype.DEBUG, "Cannot find class: " + clName + "; " + e.getMessage(), e);
			throw e;
		}
	}
	
	/**
	 * <odoc>
	 * <key>af.externalClass(anArrayOfClasspathEntries, aClassName) : JavaClass</key>
	 * Returns an external Java class with the aClassName, not included in the initial OpenAF's classpath, loaded from a list
	 * of jars/folders in anArrayOfClasspathEntries.  
	 * </odoc>
	 */
	@SuppressWarnings("rawtypes")
	@JSFunction
	public Class<?> externalClass(Object locs, String clName) throws Exception {
		try {
			ArrayList<URL> aURLs = new ArrayList<URL>();
			if (!(locs instanceof NativeArray)) return null;
			AFCmdBase.jse.enterContext();
			for(Object loc : (NativeArray) locs) {
				aURLs.add(new URL(Context.toString(loc)));
			}
			AFCmdBase.jse.exitContext();
			URL[] urls = {};
			urls = aURLs.toArray(urls);
			URLClassLoader loader = new URLClassLoader(urls, Thread.currentThread().getContextClassLoader());
			Class<?> cl = Class.forName(clName, true, loader);
			
			return cl;
		} catch (ClassNotFoundException | MalformedURLException e) {
			SimpleLog.log(SimpleLog.logtype.DEBUG, "Cannot find class: " + clName + "; " + e.getMessage(), e);
			throw e;
		}
	}
	
	/**
	 * <odoc>
	 * <key>af.externalClassLoader(anArrayOfClasspathEntries) : ClassLoader</key>
	 * Returns a ClassLoader suitable to be use with af.getClass to dynamically load Java classes that weren't included 
	 * on the initial OpenAF's classpath and are included in the jars/folders provided in anArrayOfClasspathEntries.
	 * </odoc>
	 */
	@JSFunction
	public Object externalClassLoader(Object locs) throws MalformedURLException {
		try {
			ArrayList<URL> aURLs = new ArrayList<URL>();
			if (!(locs instanceof NativeArray)) return null;
			AFCmdBase.jse.enterContext();
			for(Object loc : (NativeArray) locs) {
				aURLs.add(new URL(Context.toString(loc)));
			}
			AFCmdBase.jse.exitContext();
			URL[] urls = {};
			urls = aURLs.toArray(urls);
			URLClassLoader loader = new URLClassLoader(urls, Thread.currentThread().getContextClassLoader());
			
			return loader;
		} catch (MalformedURLException e) {
			SimpleLog.log(SimpleLog.logtype.DEBUG, "Cannot find urls; " + e.getMessage(), e);
			throw e;
		}
	}
	
	/**
	 * <odoc>
	 * <key>af.externalAddClasspath(aURL)</key>
	 * Tries to add aURL to the current classpath. Don't forget that directories must end with a '/', for 
	 * example: file:/my/own/dir/\
	 * \
	 * Note: This might not work for some JVMs.  
	 * </odoc>
	 */
	@JSFunction
	public void externalAddClasspath(String url) throws NoSuchMethodException, SecurityException, IllegalAccessException, IllegalArgumentException, InvocationTargetException, MalformedURLException {
		ClassLoader sysloader = ClassLoader.getSystemClassLoader();
		Method method = URLClassLoader.class.getDeclaredMethod("addURL", new Class[] { URL.class });
		method.setAccessible(true);
		method.invoke(sysloader, new Object[]{ new URL(url) });
	}
	
	/**
	 * <odoc>
	 * <key>af.load(aFilename)</key>
	 * Loads an OpenAF script/file aFilename. The variable __loadedfrom will always be set to the aFilename value a
	 * after each execution. The aFilename can be composed not only by a filename but also with a zip/opack
	 * file where it resides (for example: "aZipFile.zip::aScriptInsideTheZip.js"). The variable __loadedfromzip would hold, 
	 * in this case, the zip file from which the script was executed.  
	 * </odoc>
	 */
	@JSFunction
	public void load(String js) throws Exception {
		String includeScript = null;

		// Provide a similar behavior to the require function
		if (!js.matches(".+\\.[^\\.]+$")) {
			js = js + ".js";
		}
		
		if (js.indexOf("::") > 0) {
			ZipFile zip = new ZipFile(js.replaceFirst("::.+",  ""));
			includeScript = IOUtils.toString(new InputStreamReader(zip.getInputStream(zip.getEntry(js.replaceFirst(".+::", "")))));
			zip.close();
			ScriptableObject.putProperty((Scriptable) AFCmdBase.jse.getGlobalscope(), "__loadedfromzip", js.replaceFirst("::[^:]+$",  ""));
		} else {
			try {
				if (AFCmdBase.zip != null &&
					AFCmdBase.zip.getEntry(js) != null) {
					includeScript = IOUtils.toString(AFCmdBase.zip.getInputStream(AFCmdBase.zip.getEntry(js)), (Charset) null);
				} else {
					if (ScriptableObject.getProperty((Scriptable) AFCmdBase.jse.getGlobalscope(), "__loadedfromzip") != Scriptable.NOT_FOUND) {
						String zipfile = ScriptableObject.getProperty((Scriptable) AFCmdBase.jse.getGlobalscope(), "__loadedfromzip").toString();
						try {
							ZipFile zip = new ZipFile(zipfile);
							includeScript = IOUtils.toString(new InputStreamReader(zip.getInputStream(zip.getEntry(js))));
							zip.close();
							ScriptableObject.putProperty((Scriptable) AFCmdBase.jse.getGlobalscope(), "__loadedfromzip", zipfile);
						} catch (Exception e) {		
							SimpleLog.log(logtype.DEBUG, "Error trying to load from a recurring zip: " + zipfile + " for '" + js + "'", e);
						}
					}
					
					if (includeScript == null)
						includeScript = FileUtils.readFileToString(new File(js), (Charset) null);
				}
			} catch (IOException e) {
				SimpleLog.log(logtype.DEBUG,
						"Error loading file: " + js + "; " + e.getMessage(), e);
				throw e;
			}			
		}

		Context cx = (Context) AFCmdBase.jse.enterContext();
		try {
			ScriptableObject.putProperty((Scriptable) AFCmdBase.jse.getGlobalscope(), "__loadedfrom", js);
			includeScript = includeScript.replaceAll("^#[^\n]*\n", "//\n");
			compile(includeScript, js);
			//cx.evaluateString(AFCmdBase.jse.getGlobalscope(), includeScript.toString(), js, 1, null);
		} catch (Exception e) {
			SimpleLog.log(logtype.DEBUG,
					"Error reading file: " + js + "; " + e.getMessage(), e);
			//AFCmdBase.jse.exitContext();
			throw e;
		} finally {
			AFCmdBase.jse.exitContext();
		}
	}

	/**
	 * <odoc>
	 * <key>af.compile(aScriptString, aSourceName) : Object</key>
	 * Compiles the aScriptString executing it and returning the corresponding result. 
	 * Optionally you can provide aSourceName.
	 * </odoc>
	 */
	@JSFunction
	public Object compile(String script, String name) {
		Context cx = (Context) AFCmdBase.jse.enterContext();
		org.mozilla.javascript.Script compiledScript = cx.compileString(script, name, 1, null);
		AFCmdBase.jse.addNumberOfLines(script);
		Object ret = compiledScript.exec(cx, (Scriptable) AFCmdBase.jse.getGlobalscope());
		AFCmdBase.jse.exitContext();
		
		return ret;
	}
	
	/**
	 * <odoc>
	 * <key>af.compileToClasses(aClassfile, aScriptString, aPath)</key>
	 * Given aClassfile name, aScriptString and, optionally, a filesystem aPath it will generate Java bytecode
	 * as result of compiling the aScriptString into a filesystem aClassfile (on the provided aPath). Example:\
	 * \
	 * af.compileToClasses("SomeClass", "print('hello world!');", "/some/path")\
	 * \
	 * </odoc>
	 */
	@JSFunction
	public void compileToClasses(String classfile, String script, String path) {
		ClassCompiler cc = new ClassCompiler(new CompilerEnvirons());
		Object compiled[] = cc.compileToClassFiles(script, classfile, 1, classfile);
		if (path == null || path.equals("undefined"))
			path = "";
		else
			path = path + "/";
		
		for (int j = 0; j != compiled.length; j += 2) {
			String className = (String)compiled[j];
			byte[] bytes = (byte[])(byte[])compiled[(j + 1)];
			File outfile = new File(path + className + ".class");
			try {
				FileOutputStream os = new FileOutputStream(outfile);
				try {
					os.write(bytes);
				} finally {
					os.close();
				}
			} catch (IOException ioe) {
				SimpleLog.log(logtype.ERROR, ioe.getMessage(), ioe);
			}
		} 
	}
	
	/**
	 * <odoc>
	 * <key>af.runFromClass(aCompiledJavascriptClass) : Object</key>
	 * Runs aCompiledJavascriptClass returning it's output. Example:\
	 * \
	 * af.compileToClasses("SomeClass", "print('hello world!');", "/some/path");\
	 * var aScriptClass = af.externalClass(["file://some/path/"], "SomeClass");\
	 * af.runFromClass(aScriptClass.newInstance());\
	 * \
	 * </odoc>
	 */
	@JSFunction
	static public Object runFromClass(Object cl) {
		Context cx = (Context) AFCmdBase.jse.enterContext();
		Object ret = ((Script) cl).exec(cx, (Scriptable) AFCmdBase.jse.getGlobalscope());
		AFCmdBase.jse.exitContext();
		
		return ret;
		//OptRuntime.main((Script) cl, new String[0]);
	}
	
	/**
	 * <odoc>
	 * <key>af.fromBase64(aBase) : anArrayOfBytes</key>
	 * Given aBase as a string or an array of bytes will convert it to anArrayOfBytes in Base 64.
	 * </odoc>
	 */
	@JSFunction
	public byte[] fromBase64(Object aBaseString) {
		if (aBaseString instanceof String) {
			return Base64.decodeBase64((String) aBaseString);
		} else {
			return Base64.decodeBase64((byte[]) aBaseString);
		}
	}
	
	/**
	 * <odoc>
	 * <key>af.toBase64Bytes(arrayOfBytes) : anArrayOfBytes</key>
	 * Given arrayOfBytes as a string or an array of bytes in Base 64 will convert it back to an array of bytes.
	 * </odoc>
	 */
	@JSFunction
	public Object toBase64Bytes(Object arrayOfBytes) {
		if (arrayOfBytes instanceof String) {
			return Base64.encodeBase64(((String) arrayOfBytes).getBytes());
		} else {
			return Base64.encodeBase64((byte[]) arrayOfBytes);
		}
	}
	
	/**
	 * <odoc>
	 * <key>af.fromArray2Bytes(anArray) : anArrayOfBytes</key>
	 * Converts a javascript array of integers into a Java anArrayOfBytes.
	 * </odoc>
	 */
	@JSFunction
	public Object fromArray2Bytes(Object arr) {
		ByteArrayOutputStream obs = new ByteArrayOutputStream();
		
		if (arr instanceof NativeArray) {
			NativeArray narr = (NativeArray) arr;
			for(long i = 0; i < narr.size(); i++) {
				Double num = Double.parseDouble(narr.get(i).toString());
				//Integer num = (Integer) narr.get(i);
				obs.write(num.intValue());
			}
		}
		
		return obs.toByteArray();
	}
	
	/**
	 * <odoc>
	 * <key>af.fromBytes2Array(anArrayOfBytes) : Array</key>
	 * Converts a Java anArrayOfBytes into a javascript array of integers with the value representation of 
	 * each byte.
	 * </odoc>
	 */
	@JSFunction
	public Object fromBytes2Array(Object arr) {
		ArrayList<Integer> out = new ArrayList<Integer>();
		
		if (arr instanceof byte[]) {
			byte[] barr = (byte[]) arr;
			for(int i = 0; i < barr.length; i++) {
				out.add(Integer.valueOf((int) barr[i]));
			}
		}
		
		if (arr instanceof NativeJavaArray) {
			byte[] barr = (byte[]) ((NativeJavaArray) arr).unwrap();
			for(int i = 0; i < barr.length; i++) {
				out.add(Integer.valueOf((int) barr[i]));
			}			
		} 
		
		Scriptable no = (Scriptable) AFCmdBase.jse.newArray(AFCmdBase.jse.createObject(), out.toArray());
		return no;
	}
	
	/**
	 * Ask a question on the stdin waiting for a line
	 * 
	 * @param message
	 * @return
	 */
	@JSFunction
	public String ask(String message) {
		String retMessage;
		
		// http://illegalargumentexception.blogspot.pt/2010/09/java-systemconsole-ides-and-testing.html
		
		Scanner input = new Scanner(System.in);
		System.out.println(message);
		retMessage = input.nextLine();
		input.close();
		
		return retMessage;
	}
	
	/**
	 * Ask a question on the stdin waiting for a byte
	 */
	@JSFunction
	public String askChar(String message) {
		String retMessage;
		
		Scanner input = new Scanner(System.in);
		System.out.println(message);
		retMessage = Byte.valueOf(input.nextByte()).toString();
		input.close();
		
		return retMessage;
	}
	
	/**
	 * <odoc>
	 * <key>af.getClass(aName, aLoader) : JavaClass</key>
	 * Returns the JavaClass object the Java class identified by aName. Optionally you can provide a Java classloader (
	 * this can be the result of using af.externalClassLoader).
	 * </odoc>
	 */
	@JSFunction
	public Class<?> getClass(String name, Object loader) throws ClassNotFoundException {
		if (loader != null &&
			loader instanceof ClassLoader) {
			return Class.forName(name, true, (ClassLoader) loader);
		} else {
			return Class.forName(name);
		}
	}	
	
	/**
	 * <odoc>
	 * <key>af.getVersion() : String</key>
	 * Returns the current OpenAF's build version. 
	 * </odoc>
	 */
	@JSFunction
	public String getVersion() {
		return AFCmdBase.VERSION;
	}	
	
	/**
	 * <odoc>
	 * <key>af.getDistribution() : String</key>
	 * Returns the current OpenAF's distribution channel. 
	 * </odoc>
	 */
	@JSFunction
	public String getDistribution() {
		return AFCmdBase.DISTRIBUTION;
	}		
	
	/**
	 * <odoc>
	 * <key>af.getOpenAFJar() : String</key>
	 * Retrives the fullpath for the OpenAF jar.
	 * </odoc>
	 */
	@JSFunction
	public static String getOpenAFJar() {
		return AFCmdBase.getJarFilePath(AFCmdBase.class);
	}	
	/**
	 * <odoc>
	 * <key>af.sync(aFunction, aObject)</key>
	 * When running in multithreaded scripts will ensure that aFunction is synchronized. Optionally
	 * aObject for synchronization can be provided.
	 * </odoc>
	 */
	@JSFunction
	public static Object sync(Object aFunc, Object sObj) {
		if (aFunc instanceof Function) {
			Object syncObject = null;
			if (sObj != Undefined.instance) {
				syncObject = sObj;
			}
			return new org.mozilla.javascript.Synchronizer((Function) aFunc, syncObject);
		}
		return null;
	}
	
	/**
	 * <odoc>
	 * <key>af.loadRequire(arrayOfPaths, isSandboxed)</key>
	 * Will redefine the require function on the current scope to use the arrayOfPaths provided. 
	 * Optionally you can the require function can provide a sandbox enviroment if isSandboxed = true.
	 * </odoc>
	 */
	@JSFunction
	public static Object loadRequire(Object mPaths, boolean sandboxed) {
		RequireBuilder rb = new RequireBuilder();
		rb.setSandboxed(sandboxed);
		List<URI> uris = new ArrayList<URI>();
		if (mPaths instanceof Undefined) return null;
		if (mPaths != null) {
			ArrayList<Object> modulePath = new ArrayList<Object>();
			if (mPaths instanceof NativeArray) {
				for (Object obj : ((NativeArray) mPaths))
					modulePath.add((String) obj);
			} else {
				modulePath.add(mPaths);
			}
			for (Object path : modulePath) {
				try {
					URI uri = new URI((String) path);
					if (!uri.isAbsolute()) {
						uri = new File((String) path).toURI().resolve("");
					}
					if (!uri.toString().endsWith("/")) {
						uri = new URI(uri + "/");
					}
					uris.add(uri);
				} catch(URISyntaxException usx) {
					throw new RuntimeException(usx);
				}
			}
		}
		rb.setModuleScriptProvider(new SoftCachingModuleScriptProvider(new UrlModuleSourceProvider(uris, null)));
		
		Require require = rb.createRequire((Context) AFCmdBase.jse.getNotSafeContext(), (Scriptable) AFCmdBase.jse.getGlobalscope());
		require.install((Scriptable) AFCmdBase.jse.getGlobalscope());
		return require;
	}
	
	@Override
	public String getClassName() {
		return "AF";
	}

	/**
	 * <odoc>
	 * <key>af.showDebugger(shouldRedirect)</key>
	 * Shows the default Rhino debugger. If shouldRedirect is true then stdin, stdout and stderr will be 
	 * redirected to the debugger's console.
	 * </odoc>
	 */
	@JSFunction
	public static void showDebugger(boolean shouldRedirect) throws IOException {
		Context cx = (Context) AFCmdBase.jse.getNotSafeContext();
		ContextFactory factory = cx.getFactory();
		
		final Main dbg = new Main("OpenAF Script Debugger");
		
		dbg.attachTo(factory);
		if(shouldRedirect) {
			System.setIn(dbg.getIn());
			System.setOut(dbg.getOut());
			System.setErr(dbg.getErr());
		}
		
		dbg.setBreakOnExceptions(true);
		//dbg.setBreakOnEnter(true);
		//dbg.setBreakOnReturn(true);
		dbg.setScope((Scriptable) AFCmdBase.jse.getGlobalscope());
		dbg.setSize(800, 600);
		dbg.setVisible(true);
		dbg.doBreak();
		dbg.setExitAction(new Runnable() {
			@Override
			public void run() {
				dbg.detach();
				dbg.dispose();		
			}
		});

//		try (Reader reader = new FileReader(aScript)) {
//			cx.evaluateReader((Scriptable) AFCmdBase.jse.getGlobalscope(), reader, aScript, 1, null);
//		} catch(Exception e) {
//			SimpleLog.log(logtype.ERROR, "Error trying to load: '" + aScript + "'", e);
//		}
	}
	
	/**
	 * <odoc>
	 * <key>af.getScopeIds() : Array</key>
	 * Returns an array of the current scope IDs.
	 * </odoc>
	 */
	@JSFunction
	public Object[] getScopeIds() {
		return ((ScriptableObject) AFCmdBase.jse.getGlobalscope()).getIds();
	}	

	/**
	 * <odoc>
	 * <key>af.eval(aScript) : Object</key>
	 * Performs the equivalent version of the javascript eval function for the provided aScript. Returns 
	 * the corresponding result of the evaluation.
	 * </odoc>
	 */
	@JSFunction
	public static Object eval(String script) {
		Context cx = (Context) AFCmdBase.jse.enterContext();
		Object ret = cx.evaluateString((Scriptable) AFCmdBase.jse.getGlobalscope(), script, "", 1, null);
		AFCmdBase.jse.exitContext();
		return ret;
	}	

	/**
	 * <odoc>
	 * <key>af.crypt(aKey, aSalt) : String</key>
	 * Tries to mimic crypt(3) password encryption using the org.apache.commons.codec.digest.Crypt.crypt function. Please
	 * check https://commons.apache.org/proper/commons-codec/apidocs/org/apache/commons/codec/digest/Crypt.html for more.
	 * </odoc>
	 */
	@JSFunction
	public String crypt(String key, String salt) {
		return org.apache.commons.codec.digest.Crypt.crypt(key, salt);
	}
	
	/**
	 * <odoc>
	 * <key>af.fromInputStream2String(aStream) : String</key>
	 * Tries to convert an input aStream into a String.
	 * </odoc>
	 */
	@JSFunction
	public String fromInputStream2String(Object aStream) throws IOException {
		if (aStream instanceof NativeJavaObject) aStream = ((NativeJavaObject) aStream).unwrap();
		if (aStream instanceof InputStream) {
			return IOUtils.toString((InputStream) aStream, System.getProperty("file.encoding"));
		}

		return null;
	}

	/**
	 * <odoc>
	 * <key>af.fromInputStream2Bytes(aStream) : anArrayOfBytes</key>
	 * </odoc>
	 */
	@JSFunction
	public Object fromInputStream2Bytes(Object aStream) throws IOException {
		if (aStream instanceof NativeJavaObject) aStream = ((NativeJavaObject) aStream).unwrap();
		if (aStream instanceof InputStream) {
			return IOUtils.toByteArray((InputStream) aStream);
		}

		return null;
	}

	/**
	 * <odoc>
	 * <key>af.fromBytes2OutputStream(anArrayOfBytes) : Stream</key>
	 * Converts anArrayOfBytes into a ByteArrayOutputStream. After using this stream you can, for example, use
	 * .toString and toByteArray methods from the resulting stream.
	 * </odoc>
	 */
	@JSFunction
	public Object fromBytes2OutputStream(Object bytes) throws IOException {
		ByteArrayOutputStream baos = new ByteArrayOutputStream();

		if (bytes instanceof NativeJavaArray) bytes = ((NativeJavaArray) bytes).unwrap();
		if (bytes != null && !(bytes instanceof Undefined) && bytes instanceof byte[]) {
			baos.write((byte[]) bytes);
		}

		return baos;
	}

	/**
	 * <odoc>
	 * <key>af.fromString2OutputStream(aString) : Stream</key>
	 * Converts aString into a ByteArrayOutputStream. After using this stream you can, for example, use
	 * .toString and toByteArray methods from the resulting stream.
	 * </odoc>
	 */
	@JSFunction
	public Object fromString2OutputStream(String str) throws IOException {
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		if (str != null) baos.write(str.getBytes());
		return baos;
	}

	/**
	 * <odoc>
	 * <key>af.fromBytes2InputStream(anArrayOfBytes) : Stream</key>
	 * Converts anArrayOfBytes into a ByteArrayInputStream.
	 * </odoc>
	 */
	@JSFunction
	public Object fromBytes2InputStream(Object bytes) {
		if (bytes instanceof NativeJavaArray) bytes = ((NativeJavaArray) bytes).unwrap();
		if (bytes != null && !(bytes instanceof Undefined) && bytes instanceof byte[]) {
			return new ByteArrayInputStream((byte[]) bytes);
		} else {
			return new ByteArrayInputStream(new String().getBytes());
		}
	}

	/**
	 * <odoc>
	 * <key>af.fromString2InputStream(aString) : Stream</key>
	 * Converts aString into a ByteArrayInputStream.
	 * </odoc>
	 */
	@JSFunction
	public Object fromString2InputStream(String str) {
		if (str != null)
			return fromBytes2InputStream(str.getBytes());
		else
			return fromBytes2InputStream((new String().getBytes()));
	}

	/**
	 * <odoc>
	 * <key>af.newOutputStream() : Stream</key>
	 * Creates a new ByteArrayOutputStream. After using this stream you can, for example, use
	 * .toString and toByteArray methods from the resulting stream.
	 * </odoc>
	 */
	@JSFunction
	public Object newOutputStream() {
		return new ByteArrayOutputStream();
	}

	// TOTP/2FA

	@JSFunction
	/**
	 * <odoc>
	 * <key>af.create2FACredentials(anAccountName, anIssuer) : Map</key>
	 * Given anAccountName and anIssuer will create a the 2FA/TOTP (Time-Based One-Time Password) returning a map with
	 * the scratchCodes, the verificationCode, the key, the openaf encryptedKey, the QR code URL 
	 * and the OTP URL.
	 * </odoc>
	 */
	public Object create2FACredentials(String issuer, String accountName) throws Exception {
		JSMap map = AFCmdBase.jse.getNewMap(null);

		if (issuer == null) issuer = "openaf";
		if (accountName == null) accountName = "user@openaf.io";

		GoogleAuthenticator gauth = new GoogleAuthenticator();
		GoogleAuthenticatorKey gkey = gauth.createCredentials();
		JSList sCds = AFCmdBase.jse.getNewList(null);
		sCds.addAll(gkey.getScratchCodes());
		map.put("scratchCodes", sCds.getList());
		map.put("verificationCode", String.format("%06d", gkey.getVerificationCode()));
		map.put("key", gkey.getKey());
		map.put("encryptedKey", encrypt(gkey.getKey(), null));
		map.put("qrChart", GoogleAuthenticatorQRGenerator.getOtpAuthURL(issuer, accountName, gkey));
		map.put("otpURL", GoogleAuthenticatorQRGenerator.getOtpAuthTotpURL(issuer, accountName, gkey));

		return map.getMap();
	}

	@JSFunction
	/**
	 * <odoc>
	 * <key>af.validate2FA(aKey, aToken) : boolean</key>
	 * Given aToken and a 2FA aKey returns true if it's valid. Note: it will use
	 * the current date/time of the system so it must be in sync with the authenticator
	 * app; scratchCodes are not handled.
	 * </odoc>
	 */
	public boolean validate2FA(String aKey, String aToken) {
		GoogleAuthenticator gauth = new GoogleAuthenticator();
		return gauth.authorize(AFCmdBase.afc.dIP(aKey), Integer.valueOf(aToken));
	}

	@JSFunction
	/**
	 * <odoc>
	 * <key>af.get2FAToken(aKey, aSpecificTime) : String</key>
	 * Given 2FA aKey it will return the current token. Note: it will use the current
	 * date/time of the system so it must be in sync with the authenticator. Optionally
	 * you can provide aSpecificTime.
	 * </odoc>
	 */
	public String get2FAToken(String aKey, double ti) {
		GoogleAuthenticator gauth = new GoogleAuthenticator();

		long t = -1;
		if (!(Double.isNaN(ti))) {
			t = (new Double(ti)).longValue();
		}
		
		if (t >= 0)
        	return String.format("%06d", gauth.getTotpPassword(AFCmdBase.afc.dIP(aKey), t));
		else
			return String.format("%06d", gauth.getTotpPassword(AFCmdBase.afc.dIP(aKey)));
	}
}
