package openaf.plugins;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Calendar;

import org.apache.commons.io.IOUtils;
import org.apache.commons.net.ftp.FTPClient;
import org.apache.commons.net.ftp.FTPFile;
import org.apache.commons.net.ftp.FTPReply;
import org.apache.commons.net.ftp.FTPSClient;
import org.mozilla.javascript.NativeJavaObject;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;

import openaf.AFCmdBase;

/**
 *
 * Copyright 2026 Nuno Aguiar
 *
 */
public class FTP extends ScriptableObject {

	private static final long serialVersionUID = 6100710955991642121L;

	protected String login, host, password, protocol = "TLS";
	protected int port;
	protected int timeout = -1;
	protected boolean secure = false;
	protected boolean implicit = false;
	protected boolean passive = true;
	protected boolean binary = true;
	protected FTPClient client;

	@Override
	public String getClassName() {
		return "FTP";
	}

	/**
	 * <odoc>
	 * <key>FTP.FTP(aHost, aPort, aLogin, aPass, isFTPS, isImplicit, aProtocol, isPassive, isBinary, aTimeout) : FTP</key>
	 * Creates an instance of a FTP/FTPS client (and connects) given a host, port, login username and password.
	 * Alternatively you can provide a FTP/FTPS url where aHost = ftp://user:pass@host:port/?timeout=1234&amp;passive=true&amp;binary=true
	 * or ftps://user:pass@host:port/?timeout=1234&amp;passive=true&amp;binary=true&amp;implicit=false&amp;protocol=TLS.
	 * </odoc>
	 * @throws Exception
	 */
	@JSConstructor
	public void newFTP(String host, int port, String login, String pass, boolean secure, boolean implicit, String protocol, boolean passive, boolean binary, int timeout) throws Exception {
		if (host.toLowerCase().startsWith("ftp:") || host.toLowerCase().startsWith("ftps:")) {
			URI uri = new URI(host);
			String scheme = uri.getScheme().toLowerCase();

			if (scheme.equals("ftp") || scheme.equals("ftps")) {
				this.secure = scheme.equals("ftps");
				this.port = uri.getPort();
				if (uri.getUserInfo() != null) {
					if (uri.getUserInfo().indexOf(":") >= 0) {
						this.login = AFCmdBase.afc.dIP(uri.getUserInfo().split(":")[0]);
						this.password = AFCmdBase.afc.dIP(uri.getUserInfo().split(":")[1]);
					} else {
						this.login = AFCmdBase.afc.dIP(uri.getUserInfo());
						this.password = "";
					}
				}

				if (uri.getQuery() != null) {
					String[] parts = uri.getQuery().split("&");
					for(String part : parts) {
						String[] kv = part.split("=", 2);
						String key = kv[0].toLowerCase();
						String value = kv.length > 1 ? kv[1] : "";

						switch(key) {
						case "timeout":
							setTimeout(Integer.parseInt(value));
							break;
						case "passive":
							this.passive = Boolean.parseBoolean(value);
							break;
						case "binary":
							this.binary = Boolean.parseBoolean(value);
							break;
						case "implicit":
							this.implicit = Boolean.parseBoolean(value);
							break;
						case "protocol":
							if (value != null && value.length() > 0) this.protocol = value;
							break;
						}
					}
				}

				this.host = uri.getHost();
				if (this.port <= 0) this.port = this.secure && this.implicit ? 990 : 21;
			} else {
				throw new Exception("Host or FTP/FTPS url not correct.");
			}
		} else {
			this.login = AFCmdBase.afc.dIP(login);
			this.host = host;
			this.password = AFCmdBase.afc.dIP(pass);
			this.port = port > 0 ? port : (secure && implicit ? 990 : 21);
			this.secure = secure;
			this.implicit = implicit;
			if (protocol != null && protocol.length() > 0) this.protocol = protocol;
			this.passive = passive;
			this.binary = binary;
			if (timeout > 0) setTimeout(timeout);
		}

		connectFTP();
	}

	protected void connectFTP() throws IOException {
		if (secure) {
			client = new FTPSClient(protocol, implicit);
		} else {
			client = new FTPClient();
		}

		if (timeout > 0) {
			client.setConnectTimeout(timeout);
			client.setDefaultTimeout(timeout);
			client.setSoTimeout(timeout);
			client.setDataTimeout(Duration.ofMillis(timeout));
		}

		client.connect(host, port);
		if (!FTPReply.isPositiveCompletion(client.getReplyCode())) {
			close();
			throw new IOException("Unable to connect to " + host + ":" + port + " (reply code = " + client.getReplyCode() + ")");
		}

		if (login != null && login.length() > 0) {
			if (!client.login(login, password)) {
				close();
				throw new IOException("FTP login failed for user '" + login + "'");
			}
		}

		if (client instanceof FTPSClient) {
			FTPSClient ftps = (FTPSClient) client;
			ftps.execPBSZ(0);
			ftps.execPROT("P");
		}

		applyModes();
	}

	protected void applyModes() throws IOException {
		if (passive) {
			client.enterLocalPassiveMode();
		} else {
			client.enterLocalActiveMode();
		}

		client.setFileType(binary ? org.apache.commons.net.ftp.FTP.BINARY_FILE_TYPE : org.apache.commons.net.ftp.FTP.ASCII_FILE_TYPE);
	}

	/**
	 * <odoc>
	 * <key>FTP.close()</key>
	 * Closes the FTP/FTPS connection.
	 * </odoc>
	 */
	@JSFunction
	public void close() throws IOException {
		if (client != null) {
			if (client.isConnected()) {
				try {
					client.logout();
				} catch(Exception e) {
					// Ignore logout failures on close.
				}
				client.disconnect();
			}
			client = null;
		}
	}

	/**
	 * <odoc>
	 * <key>FTP.setTimeout(aTimeout)</key>
	 * Sets aTimeout in ms for the FTP/FTPS connection.
	 * </odoc>
	 */
	@JSFunction
	public void setTimeout(int aTimeout) throws IOException {
		timeout = aTimeout;
		if (client != null) {
			client.setConnectTimeout(aTimeout);
			client.setDefaultTimeout(aTimeout);
			client.setSoTimeout(aTimeout);
			client.setDataTimeout(Duration.ofMillis(aTimeout));
		}
	}

	/**
	 * <odoc>
	 * <key>FTP.getFTPClient() : Object</key>
	 * Obtains the internal FTP/FTPS client.
	 * </odoc>
	 */
	@JSFunction
	public Object getFTPClient() {
		return client;
	}

	/**
	 * <odoc>
	 * <key>FTP.setPassiveMode(isPassive)</key>
	 * Switches between passive and active mode.
	 * </odoc>
	 */
	@JSFunction
	public void setPassiveMode(boolean isPassive) throws IOException {
		passive = isPassive;
		if (client != null) applyModes();
	}

	/**
	 * <odoc>
	 * <key>FTP.setBinaryMode(isBinary)</key>
	 * Switches between binary and ascii file transfer mode.
	 * </odoc>
	 */
	@JSFunction
	public void setBinaryMode(boolean isBinary) throws IOException {
		binary = isBinary;
		if (client != null) applyModes();
	}

	/**
	 * <odoc>
	 * <key>FTP.rename(aOriginalName, aNewName)</key>
	 * Renames a remote original filename to a newname.
	 * </odoc>
	 */
	@JSFunction
	public void rename(String original, String newname) throws IOException {
		if (!client.rename(original, newname)) {
			throw new IOException(client.getReplyString());
		}
	}

	/**
	 * <odoc>
	 * <key>FTP.rm(aFilePath)</key>
	 * Removes a remote filename at the provided aFilePath.
	 * </odoc>
	 */
	@JSFunction
	public void rm(String path) throws IOException {
		if (!client.deleteFile(path)) {
			throw new IOException(client.getReplyString());
		}
	}

	/**
	 * <odoc>
	 * <key>FTP.rmdir(aPath)</key>
	 * Removes a remote directory at the provided aPath.
	 * </odoc>
	 */
	@JSFunction
	public void rmdir(String path) throws IOException {
		if (!client.removeDirectory(path)) {
			throw new IOException(client.getReplyString());
		}
	}

	/**
	 * <odoc>
	 * <key>FTP.pwd() : String</key>
	 * Returns the current remote path.
	 * </odoc>
	 */
	@JSFunction
	public String pwd() throws IOException {
		return client.printWorkingDirectory();
	}

	/**
	 * <odoc>
	 * <key>FTP.cd(aPath)</key>
	 * Changes the remote directory to the corresponding path.
	 * </odoc>
	 */
	@JSFunction
	public void cd(String path) throws IOException {
		if (!client.changeWorkingDirectory(path)) {
			throw new IOException(client.getReplyString());
		}
	}

	/**
	 * <odoc>
	 * <key>FTP.mkdir(aPath)</key>
	 * Tries to create a remote directory for the provided aPath.
	 * </odoc>
	 */
	@JSFunction
	public void mkdir(String path) throws IOException {
		if (!client.makeDirectory(path)) {
			throw new IOException(client.getReplyString());
		}
	}

	/**
	 * <odoc>
	 * <key>FTP.listFiles(aPath) : Map</key>
	 * Returns a files array where each entry has filename, longname, filepath, size, permissions, lastModified,
	 * createTime, isDirectory and isFile.
	 * </odoc>
	 */
	@JSFunction
	public Object listFiles(Object opath) throws IOException {
		String path;
		Scriptable no = (Scriptable) AFCmdBase.jse.newObject(AFCmdBase.jse.getGlobalscope());
		ArrayList<Scriptable> list = new ArrayList<Scriptable>();

		if (opath == null || !(opath instanceof String)) {
			path = ".";
		} else {
			path = ((String) opath).replaceAll("/+", "/");
		}

		for(FTPFile f : client.listFiles(path)) {
			if (f != null && f.getName() != null && !f.getName().equals(".") && !f.getName().equals("..")) {
				Scriptable record = (Scriptable) AFCmdBase.jse.newObject(no);
				Calendar ts = f.getTimestamp();
				long time = ts != null ? ts.getTimeInMillis() : 0;

				record.put("filename", record, f.getName());
				record.put("longname", record, f.getRawListing());
				record.put("filepath", record, buildFilePath(path, f.getName()));
				record.put("size", record, f.getSize());
				record.put("permissions", record, getPermissions(f));
				record.put("lastModified", record, time);
				record.put("createTime", record, time);
				record.put("isDirectory", record, f.isDirectory());
				record.put("isFile", record, f.isFile());
				list.add(record);
			}
		}

		no.put("files", no, AFCmdBase.jse.newArray(no, list.toArray()));
		return no;
	}

	/**
	 * <odoc>
	 * <key>FTP.get(aRemoteFilePath, aLocalFilePath) : String</key>
	 * Retrieves a file, using the FTP/FTPS connection, from aRemoteFilePath to aLocalFilePath.
	 * Use FTP.getBytes in case you are reading a binary file into memory.
	 * </odoc>
	 */
	@JSFunction
	public String get(String remoteFile, String localFile) throws IOException {
		if (localFile == null) localFile = remoteFile;
		try (OutputStream os = new FileOutputStream(localFile)) {
			if (!client.retrieveFile(remoteFile, os)) throw new IOException(client.getReplyString());
		}
		return localFile;
	}

	/**
	 * <odoc>
	 * <key>FTP.getBytes(aRemoteFile) : anArrayOfBytes</key>
	 * Returns an array of bytes with the contents of aRemoteFilePath, using the FTP/FTPS connection.
	 * </odoc>
	 */
	@JSFunction
	public Object getBytes(String remoteFile) throws IOException {
		try (InputStream is = client.retrieveFileStream(remoteFile)) {
			if (is == null) throw new IOException(client.getReplyString());
			byte[] res = IOUtils.toByteArray(is);
			if (!client.completePendingCommand()) throw new IOException(client.getReplyString());
			return res;
		}
	}

	/**
	 * <odoc>
	 * <key>FTP.putBytes(aRemoteFilePath, bytes)</key>
	 * Writes an array of bytes on aRemoteFilePath, using the FTP/FTPS connection.
	 * </odoc>
	 */
	@JSFunction
	public void putBytes(String remoteFile, Object bytes) throws IOException {
		if (!(bytes instanceof byte[])) throw new IOException("Expecting an array of bytes");
		try (InputStream is = new ByteArrayInputStream((byte[]) bytes)) {
			if (!client.storeFile(remoteFile, is)) throw new IOException(client.getReplyString());
		}
	}

	/**
	 * <odoc>
	 * <key>FTP.put(aSourceFilePath, aRemoteFilePath)</key>
	 * Copies aSourceFilePath to aRemoteFilePath, using the FTP/FTPS connection.
	 * </odoc>
	 */
	@JSFunction
	public void put(String sourceFile, String remoteFile) throws IOException {
		if (remoteFile == null) remoteFile = sourceFile;
		try (InputStream is = new FileInputStream(sourceFile)) {
			if (!client.storeFile(remoteFile, is)) throw new IOException(client.getReplyString());
		}
	}

	/**
	 * <odoc>
	 * <key>FTP.ftpGet(aRemoteFile, aLocalFile) : JavaStream</key>
	 * Retrieves a remote file over the FTP/FTPS connection to be stored on the local path provided. If aLocalFile is
	 * not provided the remote file contents will be returned as a Java Stream.
	 * </odoc>
	 */
	@JSFunction
	public Object ftpGet(String remoteFile, String localFile) throws IOException {
		if (localFile != null && !localFile.equals("") && !localFile.endsWith("undefined")) {
			get(remoteFile, localFile);
			return remoteFile;
		} else {
			try (InputStream is = client.retrieveFileStream(remoteFile)) {
				if (is == null) throw new IOException(client.getReplyString());
				InputStream res = IOUtils.toBufferedInputStream(is);
				if (!client.completePendingCommand()) throw new IOException(client.getReplyString());
				return res;
			}
		}
	}

	/**
	 * <odoc>
	 * <key>FTP.ftpPut(aSource, aRemoteFile)</key>
	 * Sends aSource file (if string) or a Java stream to a remote file path over a FTP/FTPS connection.
	 * </odoc>
	 * @throws Exception
	 */
	@JSFunction
	public void ftpPut(Object aSource, String aRemoteFile) throws Exception {
		if (aSource instanceof String) {
			put((String) aSource, aRemoteFile);
		} else {
			if (aSource instanceof NativeJavaObject) aSource = ((NativeJavaObject) aSource).unwrap();
			if (aSource instanceof InputStream) {
				try (InputStream is = (InputStream) aSource) {
					if (!client.storeFile(aRemoteFile, is)) throw new IOException(client.getReplyString());
				}
			} else {
				throw new Exception("Expecting a string source file name or a Java Input stream as source");
			}
		}
	}

	protected String buildFilePath(String path, String fileName) {
		if (path == null || path.length() == 0 || path.equals(".")) return fileName;
		if (path.endsWith("/")) return path + fileName;
		return path + "/" + fileName;
	}

	protected String getPermissions(FTPFile file) {
		StringBuilder sb = new StringBuilder();
		sb.append(file.isDirectory() ? "d" : "-");
		appendPermissions(sb, file, FTPFile.USER_ACCESS);
		appendPermissions(sb, file, FTPFile.GROUP_ACCESS);
		appendPermissions(sb, file, FTPFile.WORLD_ACCESS);
		return sb.toString();
	}

	protected void appendPermissions(StringBuilder sb, FTPFile file, int access) {
		sb.append(file.hasPermission(access, FTPFile.READ_PERMISSION) ? "r" : "-");
		sb.append(file.hasPermission(access, FTPFile.WRITE_PERMISSION) ? "w" : "-");
		sb.append(file.hasPermission(access, FTPFile.EXECUTE_PERMISSION) ? "x" : "-");
	}
}
