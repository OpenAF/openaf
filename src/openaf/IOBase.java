package openaf;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.lang.String;

import org.apache.commons.io.FileUtils;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.annotations.JSFunction;
import org.mozilla.javascript.xml.XMLObject;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

public class IOBase extends openaf.core.IO {

	private static final long serialVersionUID = 2937437659041890404L;
	
	@JSFunction
 	public static boolean fileExists(String aFile) {
  		return openaf.core.IO.fileExists(aFile);
  	}
	
	@JSFunction
	public static String getFileEncoding(String aFile) throws IOException {
		return openaf.core.IO.getFileEncoding(aFile);
	}
	
	@JSFunction
	public static String getDefaultEncoding() {
		return openaf.core.IO.getDefaultEncoding();
	}
	
	@JSFunction
	public static void convertFileToEncoding(String origFile, String newFile, String encoding) throws IOException {
		openaf.core.IO.convertFileToEncoding(origFile, newFile, encoding);
	}
	
	@JSFunction
	public static Object listFiles(String filepath, boolean posix) throws IOException {
		return openaf.core.IO.listFiles(filepath, posix);
	}	
	
	@JSFunction
	public static Object fileInfo(String filepath) throws IOException {
		return openaf.core.IO.fileInfo(filepath);
	}
	
	@JSFunction
	public static Object listFilenames(String filepath, boolean fullPath) throws IOException {
		return openaf.core.IO.listFilenames(filepath, fullPath);
	}
	
	@JSFunction
	public static Scriptable readFileAsArray(String filename, String encoding) throws IOException {
		return (Scriptable) openaf.core.IO.readFileAsArray(filename, encoding);
	}
	
	@JSFunction
	public static String readFileString(String filename, String encoding) throws IOException {
		return openaf.core.IO.readFileString(filename, encoding);
	}	

	@JSFunction
	public static Object readFileXML(String filename, int skipLines, String encoding) throws IOException {
		return openaf.core.IO.readFileXML(filename, skipLines, encoding);
	}

	@JSFunction
	public static Object readFileBytes(String filename) throws IOException {
		return openaf.core.IO.readFileBytes(filename);
	}	
	
	@JSFunction
	public static void writeFile(String filename, Object pmIn, String encoding, boolean shouldAppend) throws Exception {
		//openaf.core.IO.writeFile(filename, pmIn, encoding, shouldAppend);
		Object stringify = AFCmdBase.jse.stringify(pmIn);
		try {
			if (encoding == null || encoding.equals("undefined")) encoding = "UTF-8";
			JsonObject out = (new Gson()).fromJson(stringify.toString(), JsonObject.class);
			FileUtils.writeStringToFile(new File(filename), (new Gson()).toJson(out), encoding, shouldAppend);

		} catch (Exception e) {
			SimpleLog.log(SimpleLog.logtype.DEBUG,
					"Error writing file: " + e.getMessage(), e);
			throw e;
		}
	}	

	@JSFunction
	public static void writeFileString(String filename, String pmIn, String encoding, boolean shouldAppend) throws IOException {
		openaf.core.IO.writeFileString(filename, pmIn, encoding, shouldAppend);
	}	
	
	@JSFunction
	public static void writeFileXML(String filename, Object xml, String encoding, boolean shouldAppend) throws IOException {
		if (!(xml instanceof XMLObject))
			xml = null;
		openaf.core.IO.writeFileXML(filename, xml, encoding, shouldAppend);
	}	
	
	@JSFunction
	public static void writeFileBytes(String filename, Object pmIn) throws Exception {
		openaf.core.IO.writeFileBytes(filename, pmIn);
	}	
	
	@JSFunction
	public static void writeFileAsArray(String filename, Object lines, String encoding) throws Exception {	
		openaf.core.IO.writeFileAsArray(filename, lines, encoding);
	}	
	
	@JSFunction
	public static Object readFile(String filename, String encoding) throws Exception {
		Object res = openaf.core.IO.readFile(filename, encoding);
	  
		if (encoding == null || encoding.equals("undefined")) encoding = "UTF-8";
		return openaf.AFBase.jsonParse((String) res, true);
	}	

	@JSFunction
	public static Object gzip(Object dataIn) throws IOException {
		return openaf.core.IO.gzip(dataIn);
	}

	@JSFunction
	public static Object gunzip(Object dataIn) throws IOException {
		return openaf.core.IO.gunzip(dataIn);
	}

	@JSFunction
	public static Object randomAccessFile(String filename, String mode) throws FileNotFoundException {
		return openaf.core.IO.randomAccessFile(filename, mode);
	}
	
	@JSFunction
	public static Object writeFileGzipStream(String filename) throws IOException {
		return openaf.core.IO.writeFileGzipStream(filename);
	}
	
	@JSFunction
	public static Object readFileGzipStream(String filename) throws IOException {
		return openaf.core.IO.readFileGzipStream(filename);
	}
	
	@JSFunction
	public static Object readFileStream(String filename) throws IOException {
		return openaf.core.IO.readFileStream(filename);
	}
	
	@JSFunction
	public static Object writeFileStream(String filename, boolean shouldAppend) throws IOException {
		return openaf.core.IO.writeFileStream(filename, shouldAppend);
	}
}
