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
import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.NativeJavaObject;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.annotations.JSFunction;
import org.mozilla.javascript.xml.XMLObject;

import wedo.open.utils.PMStringConvert;
import wedo.openaf.core.AF;
import wedo.xml.DomWriter;
import wedo.jaf.util.ParameterMapReaderDom;
import wedo.jaf.util.ParameterMap;

public class IO extends wedo.openaf.core.IO {

	private static final long serialVersionUID = 2937437659041890404L;
	
	@JSFunction
	public static boolean fileExists(String aFile) {
		return wedo.openaf.core.IO.fileExists(aFile);
	}
	
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
	public static Object listFiles(String filepath, boolean posix) throws IOException {
		return wedo.openaf.core.IO.listFiles(filepath, posix);
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
		Object stringify = AFCmd.jse.stringify(pmIn);
		try {
			if (encoding == null || encoding.equals("undefined")) encoding = "UTF-8";
			ParameterMap out = PMStringConvert.fromJSON(stringify.toString());
			FileUtils.writeStringToFile(new File(filename), PMStringConvert.toJSON(out), encoding, shouldAppend);

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
		
		switch (AFCmd.detectInput((String) res)) {
		case INPUT_CONFIGPMAP:
			break;
		case INPUT_JSON:
			return wedo.openaf.AF.fromJson((String) res);
		case INPUT_PARAMETER_MAP:
			return wedo.openaf.AF.fromParameterMap((String) res, "UTF-8");
		case INPUT_PMAP:
			return wedo.openaf.AF.fromPMap((String) res, "UTF-8");
		default:
			return res;
		}
		
		if (res == null)
			return new NativeObject();
		else
			return res;
	}	
	
	/**
	 * <odoc>
	 * <key>io.readFileParameterMap(aFilename, anEncoding)</key>
	 * Reads a given file as ParameterMap, optionally providing an encoding.\
	 * Note: aFilename can contain "a.zip::afile" to read from zip files.
	 * </odoc>
	 * @param filename
	 * @param encoding
	 * @return
	 * @throws Exception
	 */
	@JSFunction
	public static Object readFileParameterMap(String filename, String encoding) throws Exception {
		try {
			if (encoding == null || encoding.equals("undefined")) encoding = "UTF-8";
			String pmap = __readFileToString(filename, encoding);
			return wedo.openaf.AF.fromParameterMap(pmap, encoding);
		} catch (IOException e) {
			SimpleLog.log(SimpleLog.logtype.DEBUG, "Error reading file: "
					+ filename + "; " + e.getMessage(), e);
			throw e;
		}
	}
	
	/**
	 * <odoc>
	 * <key>io.readFileJavaParameterMap(aFilename, anEncoding, aNumLines) : JavaParameterMap</key>
	 * Reads a given aFilename as a Java ParameterMap, optionally providing an encoding and aNumLines to skip.\
	 * </odoc>
	 */
	@JSFunction
	public static Object readFileJavaParameterMap(String filename, String encoding, int numLines) throws Exception {
		ParameterMapReaderDom reader = new ParameterMapReaderDom();
		
		if (numLines == 0) numLines = 1;
		if (numLines < 0) numLines = 0;
		
		if (encoding == null || encoding.equals("undefined")) encoding = "UTF-8";
		return reader.unmarshall(new StringReader(removeLines(__readFileToString(filename, encoding), numLines)));
	}
	
	/**
	 * <odoc>
	 * <key>io.readFileJavaPMap(aFilename, anEncoding, aNumLines) : JavaParameterMap</key>
	 * Reads a given aFilename (in PMap format) as a Java ParameterMap, optionally providing an encoding and aNumLines to skip.\
	 * </odoc>
	 */
	@JSFunction
	public static Object readFileJavaPMap(String filename, String encoding, int numLines) throws Exception {
		try {
			if (encoding != null && encoding.equals("undefined")) encoding = "UTF-8";
			return PMStringConvert.fromPMap(removeLines(__readFileToString(filename, encoding), numLines), encoding);
		} catch (IOException | wedo.jaf.services.object.exceptions.OMObjectSerializationException e) {
			SimpleLog.log(SimpleLog.logtype.DEBUG,
					"Error converting from pmap: " + e.getMessage(), e);
			throw e;
		}
	}
	
	/**
	 * <odoc>
	 * <key>io.readFilePMap(aFilename, anEncoding)</key>
	 * Reads a given file as PMap, optionally providing an encoding.\
	 * Note: aFilename can contain "a.zip::afile" to read from zip files.
	 * </odoc>
	 */
	@JSFunction
	public static Object readFilePMap(String filename, String encoding) throws Exception {
		try {
			if (encoding == null || encoding.equals("undefined")) encoding = "UTF-8";
			String pmap = __readFileToString(filename, encoding);
			return wedo.openaf.AF.fromPMap(pmap, encoding);
		} catch (IOException e) {
			SimpleLog.log(SimpleLog.logtype.DEBUG, "Error reading file: "
					+ filename + "; " + e.getMessage(), e);
			throw e;
		}
	}	
	
	/**
	 * <odoc>
	 * <key>io.writeFileConfigPMap(aFilename, aJSONobject, anEncoding)</key>
	 * Writes a JSON object into a config PMap file, optionally providing an encoding
	 * </odoc>
	 * @param filename
	 * @param pmIn
	 * @param encoding
	 * @throws Exception
	 */
	@JSFunction
	public static void writeFileConfigPMap(String filename, Object pmIn, String encoding) throws Exception {
		Object stringify = AFCmd.jse.stringify(pmIn);
		
		try {
			if (encoding == null || encoding.equals("undefined")) encoding = "UTF-8";
			ParameterMap out = PMStringConvert.fromJSON(stringify.toString());
			FileUtils.write(new File(filename), PMStringConvert.toXMLConfigPMap(out), encoding);
		} catch (Exception e) {
			SimpleLog.log(SimpleLog.logtype.DEBUG,
					"Error converting and writing file: " + e.getMessage(), e);
			throw e;
		}	
	}
	
	/**
	 * <odoc>
	 * <key>io.writeFileParameterMap(aFilename, aJSONobject, anEncoding)</key>
	 * Writes a JSON object into a parameter map, optionally providing an encoding
	 * </odoc>
	 * @param filename
	 * @param pmIn
	 * @param encoding
	 * @throws Exception
	 */
	@JSFunction
	public static void writeFileParameterMap(String filename, Object pmIn, String encoding) throws Exception {
		Object stringify = AFCmd.jse.stringify(pmIn);
		try {
			if (encoding == null || encoding.equals("undefined")) encoding = "UTF-8";
			ParameterMap out = PMStringConvert.fromJSON(stringify.toString());
			FileUtils.write(new File(filename), PMStringConvert.toXMLParameterMap(out), encoding);
		} catch (Exception e) {
			SimpleLog.log(SimpleLog.logtype.DEBUG,
					"Error converting and writing file: " + e.getMessage(), e);
			throw e;
		}
	}	
	
	/**
	 * <odoc>
	 * <key>io.writeFileJavaParameterMap(aFilename, aPMIn, anEncoding)</key>
	 * Writes a ParameterMap aFilename given aPMIn Java Parameter Map, optionally providing an encoding
	 * </odoc>
	 */
	@JSFunction
	public static void writeFileJavaParameterMap(String filename, Object pmIn, String encoding) throws FileNotFoundException, UnsupportedEncodingException {
		ParameterMapReaderDom reader = new ParameterMapReaderDom();
		PrintWriter pw;
		
		if (pmIn instanceof NativeJavaObject) {
			pmIn = ((NativeJavaObject) pmIn).unwrap();
		}
		
		if (encoding == null || encoding.equals("undefined")) encoding = "UTF-8";
		pw = new PrintWriter(new File(filename), encoding); 
		pw.println("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
		DomWriter.print(reader.prettyMarshall((ParameterMap) pmIn, new ArrayList<Object>()), pw);
		pw.close();
	}
	/**
	 * <odoc>
	 * <key>io.writeFileJavaPMap(aFilename, aPMIn, anEncoding)</key>
	 * Writes a PMap aFilename given aPMIn Java Parameter Map, optionally providing an encoding
	 * </odoc>
	 */
	@JSFunction
	public static void writeFileJavaPMap(String filename, Object pmIn, String encoding) throws IOException, XMLStreamException {
		if (encoding != null && encoding.equals("undefined")) encoding = "UTF-8";
		if (pmIn instanceof NativeJavaObject) {
			pmIn = ((NativeJavaObject) pmIn).unwrap();
		}
		FileUtils.writeStringToFile(new File(filename), PMStringConvert.toXMLPMap((ParameterMap) pmIn), encoding);
	}
	
	/**
	 * <odoc>
	 * <key>io.writeFilePMap(aFilename, aJSONobject, anEncoding)</key>
	 * Writes a JSON object into a PMap, optionally providing an encoding
	 * </odoc>
	 * @param filename
	 * @param pmIn
	 * @param encoding
	 * @throws Exception
	 */
	@JSFunction
	public static void writeFilePMap(String filename, Object pmIn, String encoding) throws Exception {
		Object stringify = AFCmd.jse.stringify(pmIn);
		try {			
			if (encoding == null || encoding.equals("undefined")) encoding = "UTF-8";	
			ParameterMap out = PMStringConvert.fromJSON(stringify.toString());
			FileUtils.writeStringToFile(new File(filename), PMStringConvert.toXMLPMap(out), encoding);
		} catch (Exception e) {
			SimpleLog.log(SimpleLog.logtype.DEBUG,
					"Error converting and writing file: " + e.getMessage(), e);
			throw e;
		}
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
