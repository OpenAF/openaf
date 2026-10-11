package openaf.plugins;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FilterInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.lang.String;
import java.net.URI;
import java.nio.file.CopyOption;
import java.nio.file.FileSystem;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.OpenOption;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

import org.apache.commons.compress.archivers.ArchiveException;
import org.apache.commons.compress.archivers.ArchiveStreamFactory;
import org.apache.commons.compress.compressors.CompressorException;
import org.apache.commons.compress.compressors.CompressorStreamFactory;
import org.apache.commons.io.IOUtils;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.NativeJavaArray;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;

import openaf.AFCmdBase;
import openaf.SimpleLog;
import openaf.SimpleLog.logtype;

/**
 * Core ZIP plugin 
 * Copyright 2023 Nuno Aguiar
 *
 */
public class ZIP extends ScriptableObject {

	/**
	 * 
	 */
	private static final long serialVersionUID = -411758788276719694L;
	protected ZipFile zipFile;
	private final java.util.Set<ZipFile> streamFiles = ConcurrentHashMap.newKeySet();
	protected Map<String, ZipEntry> zipEntries = new ConcurrentHashMap<String, ZipEntry>();
	protected Map<String, byte[]> zipData = new ConcurrentHashMap<String, byte[]>();

	static final ConcurrentHashMap<URI, FileSystem> fileSystems = new ConcurrentHashMap<>();
	static final ReentrantLock lock = new ReentrantLock();

	@Override
	public String getClassName() {
		return "ZIP";
	}

	/**
	 * 
	 * @param data
	 * @throws InterruptedException 
	 * @throws IOException 
	 */
//	@JSConstructor
//	public void newZIP(String data) throws IOException {
//		if (data != null && !data.equals("undefined"))
//			load(data);
//	}
	
	protected void waitForFileSystem(URI uri) {
		while(fileSystems.containsKey(uri)) {
			lock.unlock();
			try {
				Thread.sleep(100);
			} catch (InterruptedException e) { }
			lock.lock();
		}
	}

	/**
	 * <odoc>
	 * <key>ZIP.ZIP(anArrayOfBytes) : ZIP</key>
	 * Creates a ZIP object instance. If anArrayOfBytes is provided it will read it as a ZIP compressed contents into
	 * the ZIP object.
	 * </odoc>
	 */
	@JSConstructor
	public void newZIP(Object data) throws IOException {
		if (data != null && !data.equals("undefined") && !(data instanceof Undefined))
			load(data);
	}
	
	/**
	 * <odoc>
	 * <key>ZIP.gzip(anObject) : ArrayOfBytes</key>
	 * Will gzip/compress the contents of the anObject into an array of bytes. To uncompress use ZIP.gunzip.
	 * </odoc>
	 */
	@JSFunction
	public static Object gzip(Object dataIn) throws IOException {
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		
		GZIPOutputStream gos = new GZIPOutputStream(baos);
		IOUtils.write((byte[]) dataIn, gos);
		
		gos.flush();
		gos.close();
		baos.flush();
		baos.close();
		
		return baos.toByteArray();
	}
	
	/**
	 * <odoc>
	 * <key>ZIP.gunzip(anArrayOfBytes) : anObject</key>
	 * Will gunzip/uncompress the provided anArrayOfBytes into the original anObject compressed with ZIP.gzip.
	 * </odoc>
	 */
	@JSFunction
	public static Object gunzip(Object dataIn) throws IOException {
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		
		GZIPInputStream gis = new GZIPInputStream(new ByteArrayInputStream((byte[]) dataIn));
		IOUtils.copy(gis, baos);
		
		gis.close();
		baos.flush();
		baos.close();
		
		return baos.toByteArray();		
	}
	
	/**
	 * <odoc>
	 * <key>ZIP.clean()</key>
	 * Will clean all internal data regarding any previously ZIP contents handled by this object.
	 * </odoc>
	 */
	protected void clean() {
		zipData = new ConcurrentHashMap<String, byte[]>();
		zipEntries = new ConcurrentHashMap<String, ZipEntry>();
	}
	
	/**
	 * <odoc>
	 * <key>ZIP.close()</key>
	 * Closes the loaded ZIP file and all outstanding entry streams associated with this object.
	 * </odoc>
	 */
	@JSFunction
	public synchronized void close() throws IOException {
		clean();
		IOException failure = null;
		if (zipFile != null) {
			streamFiles.add(zipFile);
			zipFile = null;
		}
		for (ZipFile file : streamFiles) {
			try {
				file.close();
			} catch (IOException e) {
				if (failure == null) failure = e;
				else failure.addSuppressed(e);
			}
		}
		streamFiles.clear();
		if (failure != null) throw failure;
	}

	/**
	 * <odoc>
	 * <key>ZIP.getFile(aFilename) : anArrayOfBytes</key>
	 * Will uncompress the corresponding aFilename from the ZIP contents into an array of bytes. Returns null if the entry is absent.
	 * </odoc>
	 */
	@JSFunction
	public synchronized Object getFile(String name) throws IOException {
		Object res = zipData.get(name);
		if (res != null) {
			return res;
		} else {
			ZipEntry entry = zipEntries.get(name);
			if (zipFile == null || entry == null) return null;
			try (InputStream is = zipFile.getInputStream(entry)) {
				return IOUtils.toByteArray(is);
			}
		}
	}
	
	/**
	 * <odoc>
	 * <key>ZIP.putFile(aFilename, anArrayOfBytes)</key>
	 * Will add anArrayOfBytes to the ZIP contents as aFilename.
	 * </odoc>
	 */
	@JSFunction
	public void putFile(String name, Object data) {
		byte[] bytes;
		
		SimpleLog.log(logtype.DEBUG, "put file with data of type " + data.getClass().getName(), null);
		
		if (data instanceof byte[]) {
			bytes = (byte[]) data;
		} else {
			bytes = data.toString().getBytes();
		}
		
		ZipEntry e = new ZipEntry(name);
		
		zipEntries.put(name, e);
		zipData.put(name, bytes);
	}
	
	/**
	 * <odoc>
	 * <key>ZIP.remove(aFilename)</key>
	 * Will remove aFilename from the ZIP contents.
	 * </odoc>
	 */
	@JSFunction
	public ZIP remove(String name) {
		zipEntries.remove(name);
		zipData.remove(name);
		
		return this;
	}
	
	/**
	 * <odoc>
	 * <key>ZIP.streamGetFile(aFilePath, aName) : anArrayOfBytes</key>
	 * Retrieves aName file from aFilePath zip file without loading the zip file contents into memory returning the 
	 * file contents as an array of bytes, or null if the entry is absent. Uses an independent archive handle.
	 * </odoc>
	 */
	@JSFunction
	public Object streamGetFile(String aFilePath, String name) throws IOException {
		try (ZipFile file = new ZipFile(aFilePath)) {
			ZipEntry entry = file.getEntry(name);
			if (entry == null) return null;
			try (InputStream stream = file.getInputStream(entry)) {
				return IOUtils.toByteArray(stream);
			}
		}
	}

	/**
	 * <odoc>
	 * <key>ZIP.streamGetFileStream(aFilePath, aName) : JavaInputStream</key>
	 * Retrieves aName file from aFilePath zip file without loading the zip file contents into memory returning a 
	 * Java InputStream, or null if the entry is absent. Each stream owns an independent archive handle.
	 * Close the stream after use to release that handle. ZIP.close() also closes outstanding streams.
	 * </odoc>
	 */
	@JSFunction
	public synchronized Object streamGetFileStream(String aFilePath, String name) throws Exception {
		final ZipFile file = new ZipFile(aFilePath);
		try {
			ZipEntry entry = file.getEntry(name);
			if (entry == null) {
				file.close();
				return null;
			}
			InputStream stream = new FilterInputStream(file.getInputStream(entry)) {
				@Override
				public void close() throws IOException {
					synchronized (ZIP.this) {
						try (ZipFile archive = file) {
							super.close();
						} finally {
							streamFiles.remove(file);
						}
					}
				}
			};
			streamFiles.add(file);
			return stream;
		} catch (Exception e) {
			try { file.close(); } catch (IOException closeError) { e.addSuppressed(closeError); }
			throw e;
		}
	}

	/**
	 * <odoc>
	 * <key>ZIP.streamPutFile(aFilePath, aName, anArrayOfBytes)</key>
	 * Sets a aName file on the aFilePath ZIP provided with the anArrayOfBytes provided. All missing directories
	 * will be created.
	 * </odoc>
	 */
	@JSFunction
	public void streamPutFile(String aFilePath, String name, Object data, boolean useTempFile) throws IOException {
		Path path = Paths.get(aFilePath);
		URI uri = URI.create("jar:" + path.toUri());
		Map<String, String> env = new HashMap<>();
		env.put("create", "true");
		if (useTempFile) env.put("useTempFile", "true");

		lock.lock();
		waitForFileSystem(uri);
		try (FileSystem fs = FileSystems.newFileSystem(uri, env)) {
			fileSystems.put(uri, fs);
			SimpleLog.log(logtype.DEBUG, "put file with data of type " + data.getClass().getName(), null);
			Path nf = fs.getPath(name);
			
			try { 
				if (nf.getParent() != null && Files.notExists(nf.getParent())) {
					Files.createDirectories(nf.getParent());
				}
			
				if (!Files.isDirectory(nf))
					Files.write(nf, (byte[]) data, new OpenOption[] { StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE });
				else {
					if (Files.notExists(nf)) 
						Files.createDirectory(nf);
				}
			} catch(NoSuchFileException nsfe) {
			}
		} finally {
			fileSystems.remove(uri);
			lock.unlock();
		}
	}
	
	/**
	 * <odoc>
	 * <key>ZIP.streamPutFileStream(aFilePath, aName, aJavaInputStream, useTempFile)</key>
	 * Sets a aName file on the aFilePath ZIP provided with the aJavaInputStream provided. All missing directories
	 * will be created. Optionally you can specify if a temp file should be used instead of memory (useTempFile = true). 
	 * Additionally, for performance, you can provide an array of maps (composed of "n" name of file and "s" javaInputStream) instead of 
	 * aJavaInputStream (aName will be ignored in this case).
	 * </odoc>
	 */
	@JSFunction
	public void streamPutFileStream(String aFilePath, String name, Object data, boolean useTempFile) throws IOException {
		Path path = Paths.get(aFilePath);
		URI uri = URI.create("jar:" + path.toUri());
		Map<String, String> env = new HashMap<>();
		env.put("create", "true");
		if (useTempFile) env.put("useTempFile", "true");
		
		lock.lock();
		waitForFileSystem(uri);
		try (FileSystem fs = FileSystems.newFileSystem(uri, env)) {
			fileSystems.put(uri, fs);
			SimpleLog.log(logtype.DEBUG, "put file with data of type " + data.getClass().getName(), null);
		
			if (data instanceof NativeArray) {
				NativeArray ldata = (NativeArray) data;
				for(Object obj : ldata) {
					if (obj instanceof NativeObject) {
						NativeObject m = (NativeObject) obj;
						if (m.has("s", ldata) && m.has("n", ldata)) {
							Path nf = fs.getPath((String) m.get("n"));
							if (nf.getParent() != null && !Files.exists(nf.getParent())) Files.createDirectories(nf.getParent());

							Files.copy((InputStream) m.get("s"), nf, new CopyOption[]{ StandardCopyOption.REPLACE_EXISTING });
						}
					}
				}
			} else {
				Path nf = fs.getPath(name);
				if (nf.getParent() != null && !Files.exists(nf.getParent())) Files.createDirectories(nf.getParent());

				if (data instanceof InputStream)
					Files.copy((InputStream) data, nf, new CopyOption[]{ StandardCopyOption.REPLACE_EXISTING });
				else
					Files.write(nf, (byte[]) data);
			}
		} finally {
			fileSystems.remove(uri);
			lock.unlock();
		}
	}
	
	/**
	 * <odoc>
	 * <key>ZIP.streamRemoveFile(aFilePath, aName)</key>
	 * Removes a file/directory aName from the aFilePath ZIP file provided.
	 * </odoc>
	 */
	@JSFunction
	public void streamRemoveFile(String aFilePath, String name, boolean useTempFile) throws IOException {
		Path path = Paths.get(aFilePath);
		URI uri = URI.create("jar:" + path.toUri());
		Map<String, String> env = new HashMap<>();
		env.put("create", "true");
		if (useTempFile) env.put("useTempFile", "true");
		
		lock.lock();
		waitForFileSystem(uri);
		try (FileSystem fs = FileSystems.newFileSystem(uri, env)) {	
			fileSystems.put(uri, fs);		
			Path nf = fs.getPath(name);
			Files.deleteIfExists(nf);
		} finally {
			fileSystems.remove(uri);
			lock.unlock();
		}
	}

	/**
	 * <odoc>
	 * <key>ZIP.streamCreate(aFilePath)</key>
	 * Creates an empty ZIP file on aFilePath.
	 * </odoc>
	 */
	@JSFunction
	public void streamCreate(String aFilePath) throws IOException {
		ZIP z = new ZIP();
		z.generate2File(aFilePath, null, true);
		z.close();
	}

	/**
	 * <odoc>
	 * <key>ZIP.streamCreateFolder(aFilePath, aFolder) : boolean</key>
	 * Creates aFolder on aFilePath ZIP file. Returns true if the folder was created or false if it already existed.
	 * </odoc>
	 */
	@JSFunction
	public boolean streamCreateFolder(String aFilePath, String aFolder) throws IOException {
		URI uri = URI.create("jar:" + Paths.get(aFilePath).toUri());
		Map<String, String> env = new HashMap<>();
		env.put("create", "true");
		FileSystem fs = null;

		lock.lock();
		waitForFileSystem(uri);
		try {
			fs = FileSystems.newFileSystem(uri, env);
			fileSystems.put(uri, fs);

			Path nf = fs.getPath(aFolder);
			if (Files.notExists(nf)) {
				Files.createDirectory(nf);
				return true;
			} else {
				return false;
			}
		} finally {
			if (fs != null) {
				fs.close();
			}
			fileSystems.remove(uri);
			lock.unlock();
		}
	}

	/**
	 * <odoc>
	 * <key>ZIP.generate(aMapOfOptions, dontReload) : anArrayOfBytes</key>
	 * Will generate a ZIP anArrayOfBytes contents (that can then by saved into a file) given the provided options (a map
	 * where you can specify the compressionLevel as a number). If dontReload = true then the internal ZIP object contents
	 * won't be reloaded after generating. Example:\
	 * \
	 * plugin("ZIP");\
	 * var zip = new ZIP();\
	 * var text = new java.lang.String("Some example test to zip into a zip file");\
	 * var openaf = io.readFileBytes("c:\\apps\\OpenAF\\openaf.jar");\
	 * zip.putFile("text.txt", text.getBytes());\
	 * zip.putFile("openaf.jar", openaf);\
	 * var newZip = zip.generate({"compressionLevel": 9});\
	 * var zip = new ZIP(newZip);\
	 * print(beautifier(zip.list()));\
	 * \
	 * </odoc>
	 */
	@JSFunction
	public Object generate(Object options, boolean dontReload) throws IOException {		
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		ZipOutputStream zos = new ZipOutputStream(baos);
		
		if (zos != null) {
			try {
				if (options != null && options.equals("undefined") && !(options instanceof Undefined)) {
					String _r = (String) ((NativeObject) options).get("compressionLevel");
					zos.setMethod(ZipOutputStream.DEFLATED);
					if (_r != null) zos.setLevel(Integer.parseInt(_r));
				}
					
				SimpleLog.log(logtype.DEBUG, "number of entries " + zipEntries.size(), null);
				for(Object ze : zipEntries.keySet()) {
					SimpleLog.log(logtype.DEBUG, "generating " + zipEntries.get(ze).getName(), null);
					
					ZipEntry newZe = new ZipEntry(zipEntries.get(ze).getName());
					zos.putNextEntry(newZe); 
					if(zipData.containsKey(newZe.getName())) 
						IOUtils.write(zipData.get(zipEntries.get(ze).getName()), zos);
					else
						if(!newZe.isDirectory()) 
							IOUtils.copy(zipFile.getInputStream(newZe), zos);
					
					zos.closeEntry(); 
				}
			} finally {
				zos.flush();
				zos.finish();
				zos.close();
			}
		}

		baos.flush();
		baos.close();

		SimpleLog.log(logtype.DEBUG, "generated " + baos.size(), null);
		
		if (!dontReload) load(baos.toByteArray());
		
		return baos.toByteArray();
	}
	
	/**
	 * <odoc>
	 * <key>ZIP.generate2File(aFile, aMapOfOptions, dontReload) : anArrayOfBytes</key>
	 * Will generate a ZIP into aFile given the provided options (a map where you can specify the compressionLevel
	 * as a number). If dontReload = true then the internal ZIP object contents won't be reloaded after
	 * generating.
	 * </odoc>
	 */
	@JSFunction
	public void generate2File(String aFile, Object options, boolean dontReload) throws IOException {
		try ( FileOutputStream baos = new FileOutputStream(aFile) ) {
			try ( ZipOutputStream zos = new ZipOutputStream(baos) ) {
				if (options != null && options.equals("undefined") && !(options instanceof Undefined)) {
					String _r = (String) ((NativeObject) options).get("compressionLevel");
					zos.setMethod(ZipOutputStream.DEFLATED);
					if (_r != null) zos.setLevel(Integer.parseInt(_r));
				}
					
				SimpleLog.log(logtype.DEBUG, "number of entries " + zipEntries.size(), null);
				for(Object ze : zipEntries.keySet()) {
					SimpleLog.log(logtype.DEBUG, "generating " + zipEntries.get(ze).getName(), null);
					
					ZipEntry newZe = new ZipEntry(zipEntries.get(ze).getName());
					zos.putNextEntry(newZe); 
					if(zipData.containsKey(newZe.getName())) 
						IOUtils.write(zipData.get(zipEntries.get(ze).getName()), zos);
					else
						if(!newZe.isDirectory()) 
							IOUtils.copy(zipFile.getInputStream(newZe), zos);
					
					zos.closeEntry(); 
				}

				zos.flush();
				zos.finish();
			}

			baos.flush();
		}

		if (!dontReload) load(org.apache.commons.io.FileUtils.readFileToByteArray(new File(aFile)));
	}
	
	/**
	 * <odoc>
	 * <key>ZIP.load(anArrayOfBytes)</key>
	 * Loads anArrayOfBytes ZIP contents into the internal object structures.
	 * </odoc>
	 */
	@JSFunction
	public ZIP load(Object data) throws IOException {
		clean();
		
		if (data instanceof NativeJavaArray) data = ((NativeJavaArray) data).unwrap();
		ByteArrayInputStream bais = new ByteArrayInputStream((byte[]) data);
		ZipInputStream zis = new ZipInputStream(bais);
		ZipEntry ze;
		
		while((ze = zis.getNextEntry()) != null) {
			zipEntries.put(ze.getName(), ze);
			zipData.put(ze.getName(), IOUtils.toByteArray(zis));
			SimpleLog.log(logtype.DEBUG, "loading " + ze.getName(), null);
		}
		
		return this;
	}
	
	/**
	 * <odoc>
	 * <key>ZIP.list(aFilePath) : Map</key>
	 * Will list all files and folders of the loaded ZIP contents into a Map with name, size, compressedSize, comment,
	 * crc and time. Optionally you can provide a zip aFilePath instead of using the current in-memory zip.
	 * </odoc>
	 * @throws IOException 
	 */
	@JSFunction
	public Object list(Object aFilePath) throws IOException {
		HashMap<String, Map<String, Object>> names = new HashMap<String, Map<String, Object>>();
		Map<String, ZipEntry> zes = new HashMap<String, ZipEntry>();
	
		if (aFilePath != null && !(aFilePath instanceof Undefined) && aFilePath instanceof String) {
			ZipInputStream _zis = new ZipInputStream(new FileInputStream((String) aFilePath));
			ZipEntry _ze = null;
			do {
				_ze = _zis.getNextEntry();
				if (_ze != null) zes.put(_ze.getName(), _ze);
			} while(_ze != null);
			_zis.close();
		} else {
			zes = zipEntries;
		}
		
		for(Object ze : zes.keySet()) {
			Map<String, Object> entry = new HashMap<String, Object>();
			entry.put("name", ((ZipEntry) zes.get(ze)).getName());
			entry.put("size", ((ZipEntry) zes.get(ze)).getSize());
			entry.put("compressedSize", ((ZipEntry) zes.get(ze)).getCompressedSize());
			entry.put("comment", ((ZipEntry) zes.get(ze)).getComment());
			entry.put("crc", ((ZipEntry) zes.get(ze)).getCrc());
			entry.put("time", ((ZipEntry) zes.get(ze)).getTime());
			
			names.put(((ZipEntry) zes.get(ze)).getName(), entry);
		}

		Context cx = (Context) AFCmdBase.jse.enterContext();
		Scriptable no = cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope());
		for (Map.Entry<String, Map<String, Object>> entry : names.entrySet()) {
			Scriptable noChild = cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope());
			for(Map.Entry<String, Object> childEntry : entry.getValue().entrySet() ) {
				noChild.put(childEntry.getKey(), noChild, childEntry.getValue());
			}
			no.put(entry.getKey(), no, noChild);
		}
		AFCmdBase.jse.exitContext();
		
		return no;
	}
	
	/**
	 * <odoc>
	 * <key>ZIP.loadFile(aFilename)</key>
	 * Will load a ZIP file aFilename into the ZIP object internal structure.
	 * </odoc>
	 */
	@JSFunction
	public synchronized ZIP loadFile(String filename) throws IOException {
		if (zipFile != null) zipFile.close();
		zipFile = null;
		clean();
		
		zipFile = new ZipFile(filename);
		ZipEntry ze;
		Enumeration<? extends ZipEntry> e = zipFile.entries();
		
		while(e.hasMoreElements()) {
			ze = e.nextElement();
			SimpleLog.log(logtype.DEBUG, "loading " + ze.getName(), null);
			zipEntries.put(ze.getName(), ze);
		}
		
		return this;
	}
	
	@JSFunction
	public Object getCompressOutputStream(Object outputStream, String compression) throws CompressorException {
		return new CompressorStreamFactory().createCompressorOutputStream(compression, (OutputStream) outputStream);
	}
	
	@JSFunction
	public Object getArchiveInputStream(Object inputStream) throws ArchiveException {
		return new ArchiveStreamFactory().createArchiveInputStream((InputStream) inputStream);
	}
	
	@JSFunction
	public Object getCompressInputStream(Object inputStream) throws CompressorException {
		return new CompressorStreamFactory().createCompressorInputStream((InputStream) inputStream);
	}
}
