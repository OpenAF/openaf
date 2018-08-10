package openaf.core;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.RandomAccessFile;
import java.io.UnsupportedEncodingException;
import java.nio.file.DirectoryStream;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.file.CopyOption;
import java.nio.file.attribute.BasicFileAttributes;
import java.nio.file.attribute.PosixFileAttributes;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.ArrayList;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.annotations.JSFunction;
import org.mozilla.universalchardet.UniversalDetector;

import openaf.AFBase;
import openaf.AFCmdBase;
import openaf.JSEngine;
import openaf.SimpleLog;

/**
 * Core IO plugin
 * 
 * @author Nuno Aguiar
 *
 */
public class IO extends ScriptableObject {

	/**
	 * <odoc>
	 * <key>io.getFileEncoding(aFile)</key>
	 * Tries to determine the file encoding of a given file and returns the same.
	 * </odoc>
	 * 
	 * @param aFile
	 * @return
	 * @throws IOException
	 */
	@JSFunction
	public static String getFileEncoding(String aFile) throws IOException {
		byte[] buf = new byte[4096];
		
		FileInputStream fis = new FileInputStream(aFile);
		UniversalDetector detector = new UniversalDetector(null);

	    int nread;
	    while ((nread = fis.read(buf)) > 0 && !detector.isDone()) {
	      detector.handleData(buf, 0, nread);
	    }
	    detector.dataEnd();
	    String encoding = detector.getDetectedCharset();
	    detector.reset();
	    fis.close();
	    
	    return encoding;
	}
	
	/**
	 * <odoc>
	 * <key>io.getDefaultEncoding()</key>
	 * Returns the current default encoding used.
	 * </odoc>
	 * @return
	 */
	@JSFunction
	public static String getDefaultEncoding() {
		return System.getProperty("file.encoding");
	}
	
	/**
	 * <odoc>
	 * <key>io.convertFileToEncoding(aOriginalFile, aNewFile, anEncoding)</key>
	 * Converts an original file into a new file using the provided enconding.
	 * </odoc>
	 * 
	 * @param origFile
	 * @param newFile
	 * @param encoding
	 * @throws IOException
	 */
	@JSFunction
	public static void convertFileToEncoding(String origFile, String newFile, String encoding) throws IOException {
		if (encoding == null || encoding.equals("undefined")) encoding = System.getProperty("file.encoding");
		FileUtils.writeStringToFile(new File(newFile), FileUtils.readFileToString(new File(origFile), getFileEncoding(origFile)), encoding);
	}
	
	/**
	 * <odoc>
	 * <key>io.listFiles(aFilePath, usePosix)</key>
	 * Returns a files array with a map with filename, filepath, lastModified, createTime, lastAccess, 
	 * size, permissions, isDirectory and isFile for each entry on a file path. Alternatively you can specify
	 * to usePosix=true and it will add to the map the owner, group and full permissions of each file and folder.
	 * </odoc>
	 * @param filepath
	 * @return
	 * @throws IOException
	 */
	@JSFunction
	public static Object listFiles(String filepath, boolean posix) throws IOException {
        JSEngine.JSMap no = AFCmdBase.jse.getNewMap(null);
        JSEngine.JSList filesMap = AFCmdBase.jse.getNewList(null);
        File f = new File(filepath);
        
        if (f != null) {
                File files[] = f.listFiles();
                if (files != null) {
                        for(File file : files) {
                                if (file != null) {
                                		BasicFileAttributes attr;
                                		if (posix) {
                                			try {
                                				attr = Files.readAttributes(file.toPath(), PosixFileAttributes.class, LinkOption.NOFOLLOW_LINKS);
                                			} catch(Exception e) {
                                				posix = false;
                                				attr = Files.readAttributes(file.toPath(), BasicFileAttributes.class, LinkOption.NOFOLLOW_LINKS);
                                			}
                                		} else {
                                			attr = Files.readAttributes(file.toPath(), BasicFileAttributes.class, LinkOption.NOFOLLOW_LINKS);
                                		}
                                		
                                        JSEngine.JSMap fileMap = AFCmdBase.jse.getNewMap(no.getMap());
                                        
                                                StringBuilder sb = new StringBuilder();
                                                fileMap.put("isDirectory", file.isDirectory());
                                                fileMap.put("isFile", file.isFile());
                                                fileMap.put("filename", file.getName());
												fileMap.put("filepath", file.getPath().replaceAll("\\\\", "/"));
												fileMap.put("canonicalPath", file.getCanonicalPath().replaceAll("\\\\", "/"));
                                                fileMap.put("lastModified", file.lastModified());
                                                fileMap.put("createTime", attr.creationTime().toMillis());
                                                fileMap.put("lastAccess", attr.lastAccessTime().toMillis());
                                                fileMap.put("size", file.length());
                                                if (file.canExecute()) sb.append("x");
                                                if (file.canRead())    sb.append("r");
                                                if (file.canWrite())   sb.append("w");
                                                fileMap.put("permissions", sb.toString());
                                                if (posix) {
                                                	fileMap.put("group", ((PosixFileAttributes) attr).group().getName());
                                                	fileMap.put("user", ((PosixFileAttributes) attr).owner().getName());
                                                	fileMap.put("posixPermissions", PosixFilePermissions.toString(((PosixFileAttributes) attr).permissions()));
                                                }
                                                
                                        filesMap.add(fileMap.getMap());
                                }
                        }
                        
                        no.put("files", filesMap.getList());
                }
        }
        
        return no.getMap();
	}
	
	/**
	 * <odoc>
	 * <key>io.fileInfo(aFilePath)</key>
	 * Returns a file map with filename, filepath, lastModified, createTime, lastAccess, 
	 * size, permissions, isDirectory and isFile.
	 * </odoc>
	 */
	@JSFunction
	public static Object fileInfo(String filepath) throws IOException {
		JSEngine.JSMap no = AFCmdBase.jse.getNewMap(null);
		File file = new File(filepath);
		if (file != null) {
			BasicFileAttributes attr = Files.readAttributes(file.toPath(), BasicFileAttributes.class, LinkOption.NOFOLLOW_LINKS);
			
			StringBuilder sb = new StringBuilder();
			no.put("isDirectory", file.isDirectory());
			no.put("isFile", file.isFile());
			no.put("filename", file.getName());
			no.put("filepath", file.getPath().replaceAll("\\\\", "/"));
			no.put("canonicalPath", file.getCanonicalPath().replaceAll("\\\\", "/"));
			no.put("lastModified", file.lastModified());
			no.put("createTime", attr.creationTime().toMillis());
			no.put("lastAccess", attr.lastAccessTime().toMillis());
			no.put("size", file.length());
			if (file.canExecute()) sb.append("x");
			if (file.canRead())    sb.append("r");
			if (file.canWrite())   sb.append("w");
			no.put("permissions", sb.toString());
		}		
		
		return no.getMap();
	}

	/**
	 * <odoc>
	 * <key>io.listFilenames(aFilePath, fullPath)</key>
	 * Returns a files array with a map with filepath (if fullPath = true) or filename otherwise.
	 * </odoc>
	 */
	@JSFunction
	public static Object listFilenames(String filepath, boolean fullPath) throws IOException {
		ArrayList<String> records = new ArrayList<String>();
		//File f = new File(filepath);
		Path f = FileSystems.getDefault().getPath(filepath);
		
		if (f != null) {
			//File files[] = f.listFiles();
			DirectoryStream<Path> stream = Files.newDirectoryStream(f);
			if (stream != null) {
				for(Path file : stream) {
					if (file != null) {
						if (fullPath) 
							records.add(file.getFileName().toString());
						else 
							records.add(file.toAbsolutePath().toString());
					}
				}
			}
		}
		
		return AFCmdBase.jse.newArray(AFCmdBase.jse.getGlobalscope(), records.toArray());
	}
	
	/**
	 * <odoc>
	 * <key>io.readFileAsArray(aFilename, anEncoding)</key>
	 * Reads a file, optionally providing a specific encoding to use, and returns an array where each 
	 * line is an array element.
	 * </odoc>
	 * @param filename
	 * @param encoding
	 * @return
	 * @throws IOException
	 */
	@JSFunction
	public static Object readFileAsArray(String filename, String encoding) throws IOException {
		JSEngine.JSList out = AFCmdBase.jse.getNewList(null);
		
		try {
			if (encoding == null || encoding.equals("undefined")) encoding = "UTF-8";
			out.addAll(FileUtils.readLines(new File(filename), encoding));			
		} catch (IOException e) {
			SimpleLog.log(SimpleLog.logtype.DEBUG, "Error reading file: "
					+ filename + "; " + e.getMessage(), e);
			throw e;
		}
		
		return out.getList();
	}
	
	/**
	 * <odoc>
	 * <key>io.readFileString(aFilename, anEncoding)</key>
	 * Reads a file, optionally providing a specific encoding to use, and returns a string with the entire contents of the file.\
	 * Note: aFilename can contain "a.zip::afile" to read from zip files.
	 * </odoc>
	 * @param filename
	 * @param encoding
	 * @return
	 * @throws IOException
	 */
	@JSFunction
	public static String readFileString(String filename, String encoding) throws IOException {
		try {
			if (encoding == null || encoding.equals("undefined")) encoding = "UTF-8";
			return __readFileToString(filename, encoding);
		} catch (IOException e) {
			SimpleLog.log(SimpleLog.logtype.DEBUG, "Error reading file: "
					+ filename + "; " + e.getMessage(), e);
			throw e;
		}
	}
	
	protected static byte[] __readFileToBytes(String filename) throws IOException {
		if (filename.indexOf("::") > -1) {
			// Is inside zip
			String[] fileComponents = filename.split("::");
			ZipFile zf = new ZipFile(fileComponents[0]);
			ZipEntry ze = zf.getEntry(fileComponents[1]);
			return IOUtils.toByteArray(zf.getInputStream(ze));
		} else {
			return FileUtils.readFileToByteArray(new File(filename));
		}
	}
	
	protected static String __readFileToString(String filename, String encoding) throws UnsupportedEncodingException, IOException {
		return new String(__readFileToBytes(filename), encoding);
	}
	
	/**
	 * Auxiliary function to remove the first numLines
	 * 
	 * @param lines
	 * @param numLines
	 * @return
	 */
	protected static String removeLines(String lines, long numLines) {
		for(long i = 0; i < numLines; i++) {
			lines = lines.substring(lines.indexOf("\n"));
		}
		return lines;
	}
	
	/**
	 * <odoc>
	 * <key>io.readFileXML(aFilename, numOfLinesToSkip, anEncoding)</key>
	 * Reads a file, optionally providing a specific encoding to use and/or the number of lines to skip (e.g. 1 to exclude
	 * the xml main header) and returns the contents in a XML object.\
	 * Note: aFilename can contain "a.zip::afile" to read from zip files.
	 * </odoc>
	 */
	@JSFunction
	public static Object readFileXML(String filename, int skipLines, String encoding) throws IOException {
		try {
			if (encoding == null || encoding.equals("undefined")) encoding = "UTF-8";
			return AFCmdBase.jse.newObject(AFCmdBase.jse.getGlobalscope(), "XMLList", new Object[] { 
				removeLines(__readFileToString(filename, encoding), skipLines)
			});
		} catch (IOException e) {
			SimpleLog.log(SimpleLog.logtype.DEBUG, "Error reading file: "
					+ filename + "; " + e.getMessage(), e);
			throw e;
		}
	}
	
	/**
	 * <odoc>
	 * <key>io.readFileBytes(aFilename)</key>
	 * Reads a file into an array of bytes.\
	 * Note: aFilename can contain "a.zip::afile" to read from zip files.
	 * </odoc>
	 * @param filename
	 * @return
	 * @throws IOException
	 */
	@JSFunction
	public static Object readFileBytes(String filename) throws IOException {
		try {
			return __readFileToBytes(filename);
		} catch (IOException e) {
			SimpleLog.log(SimpleLog.logtype.DEBUG, "Error reading file: "
					+ filename + "; " + e.getMessage(), e);
			throw e;
		}
	}	
	
	/**
	 * <odoc>
	 * <key>io.writeFile(aFilename, aJSONobject, anEncoding, shouldAppend)</key>
	 * Writes a JSON object into the given filename, optionally with the provided encoding and/or determine
	 * if it shouldAppend to an existing file.
	 * </odoc>
	 */
	@JSFunction
	public static void writeFile(String filename, Object pmIn, String encoding, boolean shouldAppend) throws Exception {
		Object stringify = AFCmdBase.jse.stringify(pmIn);
		try {
			if (encoding == null || encoding.equals("undefined")) encoding = "UTF-8";
			FileUtils.writeStringToFile(new File(filename), stringify.toString(), encoding, shouldAppend);

		} catch (Exception e) {
			SimpleLog.log(SimpleLog.logtype.DEBUG,
					"Error writing file: " + e.getMessage(), e);
			throw e;
		}
	}	
	
	/**
	 * <odoc>
	 * <key>io.writeFileString(aFilename, aJSONobject, anEncoding, shouldAppend)</key>
	 * Writes a string into the given filename, optionally with the provided encoding and/or determine
	 * if it shouldAppend to an existing file.
	 * </odoc>
	 */
	@JSFunction
	public static void writeFileString(String filename, String pmIn, String encoding, boolean shouldAppend) throws IOException {
		try { 
			if (encoding == null || encoding.equals("undefined")) encoding = "UTF-8";
			FileUtils.writeStringToFile(new File(filename), pmIn, encoding, shouldAppend);
		} catch (Exception e) {
			SimpleLog.log(SimpleLog.logtype.DEBUG,
					"Error writing file: " + e.getMessage(), e);
			throw e;
		}
	}	
	
	/**
	 * <odoc>
	 * <key>io.writeFileXML(aFilename, aXMLobject, anEncoding, shouldAppend)</key>
	 * Writes a XML object into the given filename, optionally with the provided encoding and/or determine
	 * if it shouldAppend to an existing file.
	 * </odoc>
	 */
	@JSFunction
	public static void writeFileXML(String filename, Object xml, String encoding, boolean shouldAppend) throws IOException {
		try {
			if (encoding == null || encoding.equals("undefined")) encoding = "UTF-8";
			String res = "";
	 		if (xml != null) 
	 			res = AFBase.fromXML(xml);
	 		FileUtils.writeStringToFile(new File(filename), res, encoding, shouldAppend);
		} catch (IOException e) {
			throw e;
		}
	}	
	
	/**
	 * <odoc>
	 * <key>io.writeFileBytes(aFilename, anArrayOfBytes)</key>
	 * Writes an array of bytes into the given filename.
	 * </odoc>
	 */
	@JSFunction
	public static void writeFileBytes(String filename, Object pmIn) throws Exception {
		try {
			FileUtils.writeByteArrayToFile(new File(filename), (byte[]) pmIn);
		} catch (Exception e) {
			SimpleLog.log(SimpleLog.logtype.DEBUG,
					"Error writing file: " + e.getMessage(), e);
			throw e;
		}
	}	
	
	/**
	 * <odoc>
	 * <key>io.writeFileAsArray(aFilename, anArrayOfLines, anEncoding)</key>
	 * Writes an array of string lines into a file, optionally with the provided encoding
	 * </odoc>
	 */
	@JSFunction
	public static void writeFileAsArray(String filename, Object lines, String encoding) throws Exception {	
		ArrayList<String> al = new ArrayList<String>();
		
		if (lines instanceof NativeArray) {
			if (encoding != null && encoding.equals("undefined")) encoding = null;
			
			NativeArray na = (NativeArray) lines;
			al = new ArrayList<String>();
			
			for (Object line : na) {
				al.add(Context.toString(line));
			}
		} 
		
		AFCmdBase.jse.enterContext();
		try {
			PrintWriter pw;
			if (encoding != null && encoding.length() > 0)
				pw = new PrintWriter(filename, encoding);
			else
				pw = new PrintWriter(filename);
			
			for (Object line : al.toArray()) {
				pw.println(line);
			}
			pw.close();
		} catch (Exception e) {
			SimpleLog.log(SimpleLog.logtype.DEBUG,
					"Error writing file: " + e.getMessage(), e);
			//AFCmdBase.jse.exitContext();
			throw e;
		} finally {
			AFCmdBase.jse.exitContext();
		}
	}
	
	/**
	 * <odoc>
	 * <key>io.readFile(aFilename, anEncoding)</key>
	 * Reads a file auto detecting between JSON, ParameterMap, PMap and configuration PMap, optionally providing an encoding.\
	 * Note: aFilename can contain "a.zip::afile" to read from zip files.
	 * </odoc>
	 * @param filename
	 * @param encoding
	 * @return
	 * @throws Exception
	 */
	@JSFunction
	public static Object readFile(String filename, String encoding) throws Exception {
		try {
			if (encoding == null || encoding.equals("undefined")) encoding = "UTF-8";
			String out = __readFileToString(filename, encoding);

			return out;
		} catch (IOException e) {
			SimpleLog.log(SimpleLog.logtype.DEBUG, "Error reading file: "
					+ filename + "; " + e.getMessage(), e);
			throw e;
		}
	}

	/**
	 * <odoc>
	 * <key>io.gzip(anObject) : anArrayOfBytes</key>
	 * Compresses an object into an array of bytes.
	 * </odoc>
	 * 
	 * @param dataIn
	 * @return
	 * @throws IOException
	 */
	@JSFunction
	public static Object gzip(Object dataIn) throws IOException {
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		
		GZIPOutputStream gos = new GZIPOutputStream(baos);
		if (dataIn instanceof org.mozilla.javascript.NativeJavaArray) {
			dataIn = ((org.mozilla.javascript.NativeJavaArray) dataIn).unwrap();
		}
		IOUtils.write((byte[]) dataIn, gos);
		
		gos.flush();
		gos.close();
		baos.flush();
		baos.close();
		
		return baos.toByteArray();
	}
	
	/**
	 * <odoc>
	 * <key>io.gunzip(anArrayOfBytes) : anObject</key>
	 * Uncompresses a gziped array of bytes.
	 * </odoc>
	 * 
	 * @param dataIn
	 * @return
	 * @throws IOException
	 */
	@JSFunction
	public static Object gunzip(Object dataIn) throws IOException {
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		
		if (dataIn instanceof org.mozilla.javascript.NativeJavaArray) {
			dataIn = ((org.mozilla.javascript.NativeJavaArray) dataIn).unwrap();
		}
		GZIPInputStream gis = new GZIPInputStream(new ByteArrayInputStream((byte[]) dataIn));
		IOUtils.copy(gis, baos);
		
		gis.close();
		baos.flush();
		baos.close();
		
		return baos.toByteArray();		
	}
	
	/** 
	 * <odoc>
	 * <key>io.randomAccessFile(aFilename, aMode) : RandomAccessFile</key>
	 * Creates a java RandomAccessFile to enable random access to files
	 * and returns the same.
	 * </odoc>
	 * 
	 * @param filename
	 * @param mode
	 * @return
	 * @throws FileNotFoundException
	 */
	@JSFunction
	public static Object randomAccessFile(String filename, String mode) throws FileNotFoundException {
		RandomAccessFile raf = new RandomAccessFile(filename, mode);
		
		return raf;
	}
	
	/**
	 * <odoc>
	 * <key>io.writeFileGzipStream(aFilename) : JavaStream</key>
	 * Creates and returns a JavaStream to write to a gzip aFilename. For example:\
	 * \
	 * var stream = io.writeFileGzipStream("afile.txt.gz");\
	 * ioStreamWrite(stream, "Hello "); // you can also use ioStreamWriteBytes \
	 * ioStreamWrite(stream, "World!");\
	 * stream.close();\
	 * \
	 * </odoc>
	 */
	@JSFunction
	public static Object writeFileGzipStream(String filename) throws IOException {
		return new GZIPOutputStream(FileUtils.openOutputStream(new File(filename)));
	}
	
	/**
	 * <odoc>
	 * <key>io.readFileGzipStream(aFilename) : JavaStream</key>
	 * Creates and returns a JavaStream to read from a gzip aFilename. For example:\
	 * \
	 * var stream = io.readFileGzipStream("afile.txt.gz");\
	 * ioStreamRead(stream, function(buffer) { // you can also use ioStreamReadBytes \
	 *    printnl(buffer);\
	 * });\
	 * stream.close();\
	 * \
	 * </odoc>
	 */
	@JSFunction
	public static Object readFileGzipStream(String filename) throws IOException {
		return new GZIPInputStream(FileUtils.openInputStream(new File(filename)));
	}
	
	/**
	 * <odoc>
	 * <key>io.writeFileStream(aFilename) : JavaStream</key>
	 * Creates and returns a JavaStream to write to aFilename. For example:\
	 * \
	 * var stream = io.writeFileStream("afile.txt");\
	 * ioStreamWrite(stream, "Hello "); // you can also use ioStreamWriteBytes \
	 * ioStreamWrite(stream, "World!");\
	 * stream.close();\
	 * \
	 * </odoc>
	 */
	@JSFunction
	public static Object writeFileStream(String filename) throws IOException {
		return FileUtils.openOutputStream(new File(filename));
	}

	/**
	 * <odoc>
	 * <key>io.readFileStream(aFilename) : JavaStream</key>
	 * Creates and returns a JavaStream to read aFilename. For example:\
	 * \
	 * var stream = io.readFileStream("afile.txt");\
	 * ioStreamRead(stream, function(buffer) { // you can also use ioStreamReadBytes \
	 *    printnl(buffer);\
	 * });\
	 * stream.close();\
	 * \
	 * </odoc>
	 */
	@JSFunction
	public static Object readFileStream(String filename) throws IOException {
		return FileUtils.openInputStream(new File(filename));
	}

	@Override
	public String getClassName() {
		return "IO";
	}

	/**
	 * <odoc>
	 * <key>io.fileExists(aFilename) : boolean</key>
	 * Returns true or false to determine if aFilename exists on the filesystem.
	 * </odoc>
	 */
	@JSFunction
	public static boolean fileExists(String aFile) {
		return (new File(aFile)).exists();
	}

	/**
	 * <odoc>
	 * <key>io.mkdir(aNewDirectory) : boolean</key>
	 * Tries to create aNewDirectory. Returns true if successfull, false otherwise.
	 * </odoc>
	 */
	@JSFunction
	public boolean mkdir(String newDirectory) throws IOException {
		return (new File(newDirectory)).mkdirs();
	}

	/**
	 * <odoc>
	 * <key>io.rm(aFilePath)</key>
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
	 * <key>io.rename(aSourceFilePath, aTargetFilePath)</key>
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
	 * <key>io.mv(aSourceFilePath, aTargetFilePath)</key>
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
	 * <key>io.cp(aSourceFilePath, aTargetFilePath)</key>
	 * Tries to copy aSourceFilePath to aTargetFilePath preserving file attributes.
	 * </odoc>
	 * @throws IOException 
	 */
	@JSFunction
	public boolean cp(String orig, String dest) throws IOException {
		Files.copy((new File(orig)).toPath(), (new File(dest)).toPath(), new CopyOption[] { StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.COPY_ATTRIBUTES, StandardCopyOption.ATOMIC_MOVE });
		return (new File(orig)).delete();
	}
}
