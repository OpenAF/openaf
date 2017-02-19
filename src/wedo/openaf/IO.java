package wedo.openaf;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringReader;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;

import javax.xml.stream.XMLStreamException;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.NativeJavaObject;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.annotations.JSFunction;
import org.mozilla.javascript.xml.XMLObject;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

import wedo.openaf.core.AF;

public class IO extends wedo.openaf.core.IO {

	private static final long serialVersionUID = 2937437659041890404L;
	
	@JSFunction
	public static String getFileEncoding(String aFile) throws IOException {
		return wedo.openaf.core.IO.getFileEncoding(aFile);
	}
	
	@JSFunction
	public static String getDefaultEncoding() {
		return wedo.openaf.core.IO.getDefaultEncoding();
	}
	
	@JSFunction
	public static void convertFileToEncoding(String origFile, String newFile, String encoding) throws IOException {
		wedo.openaf.core.IO.convertFileToEncoding(origFile, newFile, encoding);
	}
	
	@JSFunction
	public static Object listFiles(String filepath) throws IOException {
		return wedo.openaf.core.IO.listFiles(filepath);
	}	
	
	@JSFunction
	public static Object fileInfo(String filepath) throws IOException {
		return wedo.openaf.core.IO.fileInfo(filepath);
	}
	
	@JSFunction
	public static Object listFilenames(String filepath, boolean fullPath) throws IOException {
		return wedo.openaf.core.IO.listFilenames(filepath, fullPath);
	}
	
	@JSFunction
	public static Scriptable readFileAsArray(String filename, String encoding) throws IOException {
		return (Scriptable) wedo.openaf.core.IO.readFileAsArray(filename, encoding);
	}
	
	@JSFunction
	public static String readFileString(String filename, String encoding) throws IOException {
		return wedo.openaf.core.IO.readFileString(filename, encoding);
	}	

	@JSFunction
	public static Object readFileXML(String filename, int skipLines, String encoding) throws IOException {
		return wedo.openaf.core.IO.readFileXML(filename, skipLines, encoding);
	}

	@JSFunction
	public static Object readFileBytes(String filename) throws IOException {
		return wedo.openaf.core.IO.readFileBytes(filename);
	}	
	
	@JSFunction
	public static void writeFile(String filename, Object pmIn, String encoding, boolean shouldAppend) throws Exception {
		//wedo.openaf.core.IO.writeFile(filename, pmIn, encoding, shouldAppend);
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
		wedo.openaf.core.IO.writeFileString(filename, pmIn, encoding, shouldAppend);
	}	
	
	@JSFunction
	public static void writeFileXML(String filename, Object xml, String encoding, boolean shouldAppend) throws IOException {
		if (!(xml instanceof XMLObject))
			xml = null;
		wedo.openaf.core.IO.writeFileXML(filename, xml, encoding, shouldAppend);
	}	
	
	@JSFunction
	public static void writeFileBytes(String filename, Object pmIn) throws Exception {
		wedo.openaf.core.IO.writeFileBytes(filename, pmIn);
	}	
	
	@JSFunction
	public static void writeFileAsArray(String filename, Object lines, String encoding) throws Exception {	
		/*
		if (lines instanceof NativeArray) {
			if (encoding != null && encoding.equals("undefined")) encoding = null;
			
			NativeArray na = (NativeArray) lines;
			ArrayList<String> al = new ArrayList<String>();
			
			for (Object line : na) {
				al.add(Context.toString(line));
			}
		*/
			wedo.openaf.core.IO.writeFileAsArray(filename, lines, encoding);
		//} 
	}	
	
	@JSFunction
	public static Object readFile(String filename, String encoding) throws Exception {
		Object res = wedo.openaf.core.IO.readFile(filename, encoding);
	  
                try {
			if (encoding == null || encoding.equals("undefined")) enconding = "UTF-8";
			JsonObject out = (new Gson()).fromJson((String) res, JsonObject.class);
			return (new Gson()).toJson(out);
		} catch(Exception e) {
			SimpleLog.log(SimpleLog.logtype.DEBUG,
					"Error parsing file: " + e.getMessage(), e);a
			throw e; 	
		}
		return "";
	}	

	@JSFunction
	public static Object gzip(Object dataIn) throws IOException {
		return wedo.openaf.core.IO.gzip(dataIn);
	}

	@JSFunction
	public static Object gunzip(Object dataIn) throws IOException {
		return wedo.openaf.core.IO.gunzip(dataIn);
	}

	@JSFunction
	public static Object randomAccessFile(String filename, String mode) throws FileNotFoundException {
		return wedo.openaf.core.IO.randomAccessFile(filename, mode);
	}
	
	@JSFunction
	public static Object writeFileGzipStream(String filename) throws IOException {
		return wedo.openaf.core.IO.writeFileGzipStream(filename);
	}
	
	@JSFunction
	public static Object readFileGzipStream(String filename) throws IOException {
		return wedo.openaf.core.IO.readFileGzipStream(filename);
	}
	
	@JSFunction
	public static Object readFileStream(String filename) throws IOException {
		return wedo.openaf.core.IO.readFileStream(filename);
	}
	
	@JSFunction
	public static Object writeFileStream(String filename) throws IOException {
		return wedo.openaf.core.IO.writeFileStream(filename);
	}
}
