package openaf.plugins;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.URI;
import java.util.ArrayList;
import java.util.Vector;
import java.lang.String;

import org.apache.commons.io.IOUtils;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;
import org.mozilla.javascript.NativeJavaObject;

import openaf.AFCmdBase;
import openaf.SimpleLog;
import openaf.SimpleLog.logtype;

import com.jcraft.jsch.Channel;
import com.jcraft.jsch.ChannelExec;
import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.ChannelSftp.LsEntry;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.ProxyHTTP;
import com.jcraft.jsch.ProxySOCKS4;
import com.jcraft.jsch.ProxySOCKS5;
import com.jcraft.jsch.Session;
import com.jcraft.jsch.SftpException;
import com.jcraft.jsch.SftpStatVFS;
import com.jcraft.jsch.UIKeyboardInteractive;
import com.jcraft.jsch.UserInfo;
import com.jcraft.jsch.SftpProgressMonitor;

/**
 * 
 * Copyright 2023 Nuno Aguiar
 *
 */
public class SSH extends ScriptableObject {

	/**
	 * 
	 */
	private static final long serialVersionUID = 6884178680852808569L;
	protected String login, host, password;
	protected int port;
	protected Session session;
	protected String identity = null;
	protected boolean compression = false;
	public boolean strictHostKeyChecking = true;
	protected JSch jsch;
	protected int timeout = -1;
	protected Channel sftpChannel;
	protected Channel execChannel;
	
	@Override
	public String getClassName() {
		return "SSH";
	}

	/**
	 * <odoc>
	 * <key>SSH.SSH(aHost, aPort, aLogin, aPass, anIdentificationKey, withCompression, aTimeout, noStrictHostKeyChecking) : SSH</key>
	 * Creates an instance of a SSH client (and connects) given a host, port, login username, password and, 
	 * optionally a identity file path and the indication of use of compression. Alternatively you can provide 
	 * just a simple url where aHost = ssh://user:pass@host:port/identificationKey?timeout=1234&amp;compression=true.
	 * </odoc>
	 * @throws Exception
	 */
	@JSConstructor
	public void newSSH(String host, int port, String login, String pass, Object identityFile, boolean compression, int timeout, boolean noStrictHostKeyChecking) throws Exception {
		if (host.toLowerCase().startsWith(("ssh:"))) {
			URI uri = new URI(host);

			if (uri.getScheme().toLowerCase().equals("ssh")) {
				this.port = uri.getPort();
				if (uri.getUserInfo().indexOf(":") >= 0) {
					this.login = AFCmdBase.afc.dIP(uri.getUserInfo().split(":")[0]);
					this.password = AFCmdBase.afc.dIP(uri.getUserInfo().split(":")[1]);
				} else {
					this.login = AFCmdBase.afc.dIP(uri.getUserInfo());
					this.password = "";
				}
				this.identity = uri.getPath();

				if (uri.getQuery() != null) {
					String[] parts = uri.getQuery().split("&");
					for(String part : parts) {
						switch(part.toLowerCase().split("=")[0]) {
						case "timeout"    : setTimeout(Integer.valueOf(part.toLowerCase().split("=")[1])); break;
						case "compression": this.compression = Boolean.getBoolean(part.toLowerCase().split("=")[1]); break;
						}
					}
				}
				
				this.host = uri.getHost();
				if (this.port <= 0) this.port = 22;
			} else {
				throw new Exception("Host or SSH url not correct.");
			}
		} else {
			this.login = AFCmdBase.afc.dIP(login);
			this.host = host;
			this.password = AFCmdBase.afc.dIP(pass);
			this.port = port;
			
			this.identity = null;
			if(identityFile instanceof String && ((String) identityFile).length() > 0) {
				this.identity = (String) identityFile;
			}
			
			this.compression = compression;
			if (timeout > 0) setTimeout(timeout);
		}

		this.strictHostKeyChecking = !noStrictHostKeyChecking;
	
		connectSSH();
	}
	
	/**
	 * <odoc>
	 * <key>SSH.exec(aCommand, aStdIn, shouldOutputAlso, pty, outputMap, callbackFunc) : Object</key>
	 * Executes a command over the SSH connection. You can optionally provide the input and indicate that it shouldOutputAlso 
	 * (boolean) to stdout and if you want to allocate a pty (boolean). The stderr will be stored in __stderr and also output 
	 * if shouldOutputAlso = true. If outputMap instead of the stdout string a map with stdout, stderr and exitcode will be returned.
	 * A callbackFunc can be provided, if shouldOutputAlso is undefined or false, that will receive, as parameters, an output stream, a error stream and an input stream. If defined the stdout and stderr won't
	 * be available for the outputMap if true. Example:\
	 * \
	 * ssh.exec("someCommand", void 0, void 0, false, void 0, false, function(o, e, i) { ioStreamReadLines(o, (f) => { print("TEST | " + String(f)) }, void 0, false) });\
	 * \
	 * </odoc>
	 */
	@JSFunction
	public Object exec(String command, String input, boolean shouldOutputAlso, boolean pty, boolean returnMap, Object callbackFunc) throws JSchException, IOException {
		return executeSSH(command, input, shouldOutputAlso, pty, returnMap, callbackFunc);
	}
	
	/**
	 * <odoc>
	 * <key>SSH.execSudo(aCommandWithSudo, aUser, aStdIn, shouldOutputAlso, pty, outputMap, callbackFunc) : Object</key>
	 * Executes a command over the SSH connection using sudo to aUser. You can optionally provide the input and indicate that
	 * it shouldOutputAlso (boolean) to stdout and if you want to allocate a pty (boolean). The stderr will be stored in 
	 * __stderr and also output if shouldOutputAlso = true. If outputMap instead of the stdout string a map with stdout, stderr and exitcode will be returned.
	 * A callbackFunc can be provided, if shouldOutputAlso is undefined or false, that will receive, as parameters, an output stream, a error stream and an input stream. If defined the stdout and stderr won't
	 * be available for the outputMap if true. Example:\
	 * \
	 * ssh.execSudo("someCommand", void 0, void 0, false, void 0, false, function(o, e) { ioStreamReadLines(o, (f) => { print("TEST | " + String(f)) }) });\
	 * \
	 * </odoc>
	 */
	@JSFunction
	public Object execSudo(String command, Object user, String input, boolean shouldOutputAlso, boolean pty, boolean returnMap, Object callbackFunc) throws JSchException, IOException {
		String u = "";
		if (user != null && user instanceof Undefined) {
			u = AFCmdBase.afc.dIP((String) user);
		}
		if (this.identity == null)
			return executeSSH("echo " + AFCmdBase.afc.dIP(password) + " | sudo -i -u " + user + " -S /bin/sh -c '" + command + "'", input, shouldOutputAlso, pty, returnMap, callbackFunc);
		else
			return executeSSH("sudo -i -u " + user + " -S /bin/sh -c '" + command + "'", input, shouldOutputAlso, pty, returnMap, callbackFunc);
	}
	
	public static class SUserInfo implements UserInfo, UIKeyboardInteractive {
		protected String passwd;
		
		public SUserInfo(String p) {
			passwd = p;
		}
		
		public String[] promptKeyboardInteractive(String destination, String name,
				String instruction, String[] prompt, boolean[] echo) {
			return null;
		}

		public String getPassphrase() {
			return passwd;
		}

		public String getPassword() {
			return passwd;
		}

		public boolean promptPassphrase(String arg0) {
			return true;
		}

		public boolean promptPassword(String arg0) {
			return true;
		}

		public boolean promptYesNo(String arg0) {
			return true;
		}

		public void showMessage(String arg0) {
			//
		}	
	}
	
	/**
	 * <odoc>
	 * <key>SSH.close()</key>
	 * Closes the SSH connection.
	 * </odoc>
	 */
	@JSFunction
	public void close() {
		if (sftpChannel != null && sftpChannel.isConnected()) sftpChannel.disconnect();
		if (execChannel != null && execChannel.isConnected()) execChannel.disconnect();
		if (session != null) session.disconnect();
	}
	
	/**
	 * <odoc>
	 * <key>SSH.setTimeout(aTimeout)</key>
	 * Sets aTimeout in ms for the SSH connection.
	 * </odoc>
	 */
	@JSFunction
	public void setTimeout(int aTimeout) throws JSchException {
		timeout = aTimeout;
		if (session != null) session.setTimeout(aTimeout);
	}
	
	protected void connectSSH() throws JSchException, IOException {
		if (SimpleLog.getCurrentLogLevel() == logtype.DEBUG) 
			JSch.setLogger(new SSHLogger());
		
     	this.jsch = new JSch(); 
     	
     	if (this.identity != null && this.identity.length() > 0) {
			jsch.addIdentity(this.identity);
     	}
     	
	    session = jsch.getSession(login, host, port);
	    session.setUserInfo(new SUserInfo(password));
	    if (timeout > 0) session.setTimeout(timeout);
	    
     	if (compression) {
     		session.setConfig("compression.s2c", "zlib@openssh.com,zlib,none");
     		session.setConfig("compression.c2s", "zlib@openssh.com,zlib,none");
     		session.setConfig("compression_level", "9");
     	}
		 
		if (!this.strictHostKeyChecking) {
			session.setConfig("StrictHostKeyChecking", "no");
		}

     	session.setConfig("PreferredAuthentications", "publickey,keyboard-interactive,password");
	    
		session.connect();
		execChannel = null;
		sftpChannel = null;
	}

	@JSFunction
	public Object getJsch() {
		return this.jsch;
	}
	
	/**
	 * <odoc>
	 * <key>SSH.tunnelLocal(aLocalPort, aRemoteHost, aRemotePort)</key>
	 * Creates a TCP tunnel between a local port and a remote host and port over the SSH connection.
	 * </odoc>
	 */
	@JSFunction
	public void tunnelLocal(int localport, String remotehost, int remoteport) throws JSchException {
		session.setPortForwardingL(localport, remotehost, remoteport);
	}
	
	/**
	 * <odoc>
	 * <key>SSH.tunnelLocalBind(aLocalInterface, aLocalPort, aRemoteHost, aRemotePort)</key>
	 * Creates a TCP tunnel, on the aLocalInterface only, between a local port and a remote host and port over the
	 * SSH connection.
	 * </odoc>
	 */
	@JSFunction
	public void tunnelLocalBind(String localhost, int localport, String remotehost, int remoteport) throws JSchException {
		session.setPortForwardingL(localhost, localport, remotehost, remoteport);
	}
	
	/**
	 * <odoc>
	 * <key>SSH.tunnelRemote(aRemotePort, aLocalAddress, aLocalPort)</key>
	 * Creates a TCP tunnel between a local host and port to be accessed from a remote port over the SSH connection.
	 * </odoc>
	 */
	@JSFunction
	public void tunnelRemote(int remoteport, String localhost, int localport) throws JSchException {
		session.setPortForwardingR(remoteport, localhost, localport);
	}
	
	/**
	 * <odoc>
	 * <key>SSH.tunnelRemoteBind(aRemoteInterface, aRemotePort, aLocalAddress, aLocalPort)</key>
	 * Creates a TCP tunnel, on the aRemoteInterface only, between a local host and port to be accessed from a remote 
	 * port over the SSH connection.
	 * </odoc>
	 */
	@JSFunction
	public void tunnelRemoteBind(String remotehost, int remoteport, String localhost, int localport) throws JSchException {
		session.setPortForwardingR(remotehost, remoteport, localhost, localport);
	}
	
	/**
	 * 
	 * @author nmaguiar
	 *
	 */
	public static class SSHLogger implements com.jcraft.jsch.Logger {
		@Override
		public boolean isEnabled(int arg0) {
			return true;
		}

		@Override
		public void log(int arg0, String arg1) {
			SimpleLog.log(SimpleLog.logtype.DEBUG,
					"SSH: " + arg1, null);	
		}
		
	}
	
	/**
	 * <odoc>
	 * <key>SSH.getSftpChannel() : Object</key>
	 * Obtains the internal SSH session sftp channel.
	 * </odoc>
	 */
	@JSFunction 
	public Object getSftpChannel() throws JSchException {
		if (sftpChannel == null) {
			sftpChannel = session.openChannel("sftp");
			sftpChannel.connect();
		}
		return sftpChannel;
	}
	
	/**
	 * <odoc>
	 * <key>SSH.getExecChannel() : Object</key>
	 * Obatins the internal SSH session exec channel.
	 * </odoc>
	 */
	@JSFunction 
	public Object getExecChannel() throws JSchException {
		if (execChannel == null) {
			execChannel = session.openChannel("exec");
			execChannel.connect();
		}
		return execChannel;		
	}
	
	/**
	 * <odoc>
	 * <key>SSH.rename(aOriginalName, aNewName)</key>
	 * Renames a remote original filename to a newname. 
	 * </odoc>
	 */
	@JSFunction
	public void rename(String original, String newname) throws JSchException, SftpException {
		ChannelSftp channel = (ChannelSftp) getSftpChannel();
		
		//channel = (ChannelSftp) getSftpChannel();
		if (channel != null) {
			//if (!channel.isConnected()) channel.connect();
			
			channel.rename(original, newname);
		
			//channel.disconnect();
		}
	}
	
	/**
	 * <odoc>
	 * <key>SSH.rm(aFilePath)</key>
	 * Removes a remote filename at the provided aFilePath.
	 * </odoc>
	 */
	@JSFunction
	public void rm(String path) throws JSchException, SftpException {
		ChannelSftp channel = (ChannelSftp) getSftpChannel();
		
		if (channel != null) {
			//if (!channel.isConnected()) channel.connect();
			
			channel.rm(path);
			
			//channel.disconnect();
		}		
	}
	
	/**
	 * <odoc>
	 * <key>SSH.rmdir(aPath)</key>
	 * Removes a remote directory at the provided aPath.
	 * </odoc>
	 */
	@JSFunction
	public void rmdir(String path) throws JSchException, SftpException {
		ChannelSftp channel = (ChannelSftp) getSftpChannel();
		
		//channel = (ChannelSftp) getSftpChannel();
		if (channel != null) {
			//if (!channel.isConnected()) channel.connect();
			
			channel.rmdir(path);
			
			//channel.disconnect();
		}		
	}
	
	/**
	 * <odoc>
	 * <key>SSH.pwd() : String</key>
	 * Returns the current remote path.
	 * </odoc>
	 */
	@JSFunction
	public String pwd() throws JSchException, SftpException {
		ChannelSftp channel = (ChannelSftp) getSftpChannel();
		String res = null;
		
		//channel = (ChannelSftp) getSftpChannel();
		if (channel != null) {
			//if (!channel.isConnected()) channel.connect();
			
			res = channel.pwd();
			
			//channel.disconnect();
		}		
		
		return res;
	}
	
	/**
	 * <odoc>
	 * <key>SSH.get(aRemoteFilePath, aLocalFilePath, monitor) : String</key>
	 * Retrieves a file, using the SFTP connection, from aRemoteFilePath to aLocalFilePath.
	 * Use SSH.getBytes in case you are reading a binary file.
	 * Optionally you can provided a callback function called monitor (see more in ow.format.sshProgress)
	 * </odoc>
	 */
	@JSFunction
	public String get(String remoteFile, String localFile, Object monitor) throws JSchException, SftpException {
		ChannelSftp channel = (ChannelSftp) getSftpChannel();
		String res = null;
		
		if (localFile == null) localFile = remoteFile;
		//channel = (ChannelSftp) getSftpChannel();
		if (channel != null) {
			//if (!channel.isConnected()) channel.connect();

			if (monitor != null && !(monitor instanceof Undefined)) 
				channel.get(remoteFile, localFile, (SftpProgressMonitor) ((NativeJavaObject) monitor).unwrap());
			else
				channel.get(remoteFile, localFile);
			
			//channel.disconnect();
		}		
		
		return res;
	}
	
	/**
	 * <odoc>
	 * <key>SSH.getBytes(aRemoteFile) : anArrayOfBytes</key>
	 * Returns an array of bytes with the contents of aRemoteFilePath, using the SFTP connection.
	 * </odoc>
	 */
	@JSFunction
	public Object getBytes(String remoteFile, Object monitor) throws JSchException, IOException, SftpException {
		ChannelSftp channel = (ChannelSftp) getSftpChannel();
		byte[] res = null;
		
		//channel = (ChannelSftp) getSftpChannel();
		if (channel != null) {
			//if (!channel.isConnected()) channel.connect();
			if (monitor != null && !(monitor instanceof Undefined)) {
				try (InputStream is = channel.get(remoteFile, (SftpProgressMonitor) ((NativeJavaObject) monitor).unwrap())) {
					res = IOUtils.toByteArray(is);
				}
			} else {
				try (InputStream is = channel.get(remoteFile)) {
					res = IOUtils.toByteArray(is);
				}
			}


			//channel.disconnect();
		}
		
		return res;
	}
	
	/**
	 * <odoc>
	 * <key>SSH.putBytes(aRemoteFilePath, bytes, monitor)</key>
	 * Writes an array of bytes on aRemoteFilePath, using the SFTP connection.
	 * Optionally you can provided a callback function called monitor (see more in ow.format.sshProgress)
	 * </odoc>
	 */
	@JSFunction
	public void putBytes(String remoteFile, Object bytes, Object monitor) throws JSchException, SftpException {
		ChannelSftp channel = (ChannelSftp) getSftpChannel();
		
		//channel = (ChannelSftp) getSftpChannel();	
		if (channel != null && bytes instanceof byte[]) {
			//if (!channel.isConnected()) channel.connect();
			
			if (monitor != null && !(monitor instanceof Undefined)) {
				channel.put(new ByteArrayInputStream((byte[]) bytes), remoteFile, (SftpProgressMonitor) ((NativeJavaObject) monitor).unwrap());
			} else {
				channel.put(new ByteArrayInputStream((byte[]) bytes), remoteFile);
			}
			
			//channel.disconnect();
		}
	}
	
	/**
	 * <odoc>
	 * <key>SSH.put(aSourceFilePath, aRemoteFilePath, monitor)</key>
	 * Copies a aSourceFilePath to aRemoteFilePath, using the SFTP connection.
	 * Optionally you can provided a callback function called monitor (see more in ow.format.sshProgress)
	 * </odoc>
	 */
	@JSFunction
	public void put(String sourceFile, String remoteFile, Object monitor) throws JSchException, IOException, FileNotFoundException, SftpException {
		ChannelSftp channel = (ChannelSftp) getSftpChannel();
		String res = null;
		
		if (remoteFile == null) remoteFile = sourceFile;
		//channel = (ChannelSftp) getSftpChannel();
		if (channel != null) {
			//if (!channel.isConnected()) channel.connect();
			try ( InputStream is = new FileInputStream(sourceFile) ) {
				if (monitor != null && !(monitor instanceof Undefined)) {
					channel.put(is, remoteFile, (SftpProgressMonitor) ((NativeJavaObject) monitor).unwrap());
				} else {
					channel.put(is, remoteFile);
				}
			}
			
			//channel.disconnect();
		}
	}
	
	/**
	 * <odoc>
	 * <key>SSH.cd(aPath)</key>
	 * Changes the remote directory to the corresponding path.
	 * </odoc>
	 */
	@JSFunction
	public void cd(String path) throws JSchException, SftpException {
		ChannelSftp channel = (ChannelSftp) getSftpChannel();
		
		//channel = (ChannelSftp) getSftpChannel();
		if (channel != null) {
			//if (!channel.isConnected()) channel.connect();
			
			channel.cd(path);
			
			//channel.disconnect();
		}		
	}
	
	/**
	 * <odoc>
	 * <key>SSH.df(aPath) : Map</key>
	 * Tries to return an object, for the remote provided path, with size, used space, available space, 
	 * availableForRoot space and capacityPercentage.
	 * </odoc>
	 */
	@JSFunction
	public Object df(String path) throws JSchException, SftpException {
		ChannelSftp channel = (ChannelSftp) getSftpChannel();
		Scriptable no = (Scriptable) AFCmdBase.jse.newObject(AFCmdBase.jse.getGlobalscope());
		
		if (path == null || path.length() < 1) {
			path = ".";
		} else {
			path = path.replaceAll("/+", "/");
		}
		
		//channel = (ChannelSftp) getSftpChannel();
		if (channel != null) {
			//if (!channel.isConnected()) channel.connect();
			
			SftpStatVFS ssv = channel.statVFS(path);
			no.put("size", no, ssv.getSize());
			no.put("used", no, ssv.getUsed());
			no.put("available",  no, ssv.getAvailForNonRoot());
			no.put("availableForRoot", no, ssv.getAvail());
			no.put("capacityPerc", no, ssv.getCapacity());
			
			//channel.disconnect();
		}	
		
		return no;
	}
	
	/**
	 * <odoc>
	 * <key>SSH.mkdir(aPath)</key>
	 * Tries to create a remote directory for the provided aPath.
	 * </odoc>
	 */
	@JSFunction
	public void mkdir(String path) throws JSchException, SftpException {
		ChannelSftp channel = (ChannelSftp) getSftpChannel();
		
		//channel = (ChannelSftp) getSftpChannel();
		if (channel != null) {
			//if (!channel.isConnected()) channel.connect();
			
			channel.mkdir(path);
			
			//channel.disconnect();
		}		
	}
	
	/**
	 * <odoc>
	 * <key>SSH.listFiles(aPath) : Map</key>
	 * Returns a files array where each entry has filename, longname, filepath, size, permissions, lastModified, 
	 * createTime, isDirectory and isFile.
	 * </odoc>
	 */
	@JSFunction
	public Object listFiles(Object opath) throws SftpException, JSchException {
		ChannelSftp channel = null;
		String path;
		Scriptable no = (Scriptable) AFCmdBase.jse.newObject(AFCmdBase.jse.getGlobalscope());
		ArrayList<Scriptable> list = new ArrayList<Scriptable>(); 
		
		channel = (ChannelSftp) getSftpChannel();
		
		if (opath == null || !(opath instanceof String)) {
			path = ".";
		} else {
			path = ((String) opath).replaceAll("/+", "/");
		}
		
		if (channel != null) {
			//if (!channel.isConnected()) channel.connect();
			
			Vector v = channel.ls(path);
			if (v != null) {
				for(Object o : v) {
					if (o instanceof LsEntry) {						
						Scriptable record = (Scriptable) AFCmdBase.jse.newObject(no);
						LsEntry lse = (LsEntry) o;
						
						if (!lse.getFilename().equals(".") && !lse.getFilename().equals("..")) {
							record.put("filename",  record, lse.getFilename());
							record.put("longname", record, lse.getLongname());
							record.put("filepath", record, path + "/" + lse.getFilename());
							record.put("size", record, lse.getAttrs().getSize());
							record.put("permissions", record, lse.getAttrs().getPermissionsString());
							record.put("lastModified", record, lse.getAttrs().getMTime());
							record.put("createTime", record, lse.getAttrs().getATime());
							record.put("isDirectory", record, lse.getAttrs().isDir());
							record.put("isFile", record, !lse.getAttrs().isDir());
							list.add(record);
						}
					}
				}
				
				no.put("files", no, AFCmdBase.jse.newArray(no, list.toArray()));
			}
			
			//channel.disconnect();
		}
		
		return no;
	}
	
	protected Object executeSSH(String command, String input, boolean outputStdout, boolean pty, boolean returnMap, Object callbackFunc) throws JSchException, IOException {
		Channel channel = null;
		String output = null;
		String outputErr = "";
		Object res = null;

        channel = session.openChannel("exec");

		if (channel != null) {
			ChannelExec ce = (ChannelExec) channel;
			ce.setCommand(command);

			ce.connect();		
			ce.setPty(pty);
			
			if (input != null && !input.equals("undefined")) {
				OutputStream stdin = ce.getOutputStream();
				stdin.write(input.getBytes());
				stdin.close();
			}
			
			if (channel.isConnected()) {
				StringBuilder sb = new StringBuilder();
				
				Context cx;
				if (callbackFunc != null && callbackFunc instanceof Function) {
					cx = (Context) AFCmdBase.jse.enterContext();
					try {
						((Function) callbackFunc).call(cx, (Scriptable) AFCmdBase.jse.getGlobalscope(), cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope()), new Object[] { ce.getInputStream(), ce.getErrStream(), ce.getOutputStream() });
					} finally {
						if (callbackFunc != null) AFCmdBase.jse.exitContext();
					}
				} else {
					BufferedReader br = new BufferedReader(new InputStreamReader(ce.getInputStream()));
					BufferedReader bre = new BufferedReader(new InputStreamReader(ce.getErrStream()));
					
					for(String line = br.readLine(); line != null; line = br.readLine()) {
						sb.append(line);
						sb.append("\n");
						if (outputStdout) System.out.println(line);
					}
					
					output = sb.toString();
					sb = new StringBuilder();
					
					for(String line = bre.readLine(); line != null; line = bre.readLine()) {
						sb.append(line);
						sb.append("\n");
						if (outputStdout) System.err.println(line);
					}
					
					outputErr = sb.toString();
					br.close();
				}
			}
			
			if (returnMap) {
				openaf.JSEngine.JSMap no = AFCmdBase.jse.getNewMap(null);
				no.put("stdout", output);
				no.put("stderr", outputErr);
				no.put("exitcode", ce.getExitStatus());
				
				res = no.getMap();
			} else {
				Context cx = (Context) AFCmdBase.jse.enterContext();
				cx.evaluateString((Scriptable) AFCmdBase.jse.getGlobalscope(), "__exitcode = " + ce.getExitStatus() + ";", "af", 1, null);
				ScriptableObject.putProperty((Scriptable) AFCmdBase.jse.getGlobalscope(), "__stderr", outputErr);
				AFCmdBase.jse.exitContext();

				res = output;
			}
			//channel.disconnect();
		}
		
		return res;
	}

	static int checkAck(InputStream in) throws IOException {
		int b=in.read();
		// b may be 0 for success,
		//          1 for error,
		//          2 for fatal error,
		//          -1
		if(b==0) return b;
		if(b==-1) return b;

		if(b==1 || b==2){
			StringBuilder sb=new StringBuilder();
			int c;
			do {
				c=in.read();
				sb.append((char)c);
			}
			while(c!='\n');
			if(b==1){ // error
				System.out.print(sb.toString());
			}
			if(b==2){ // fatal error
				System.out.print(sb.toString());
			}
		}
		return b;
	}
	  
	/**
	 * <odoc>
	 * <key>SSH.sendFile(aSourceFile, aRemoteFile)</key>
	 * Sends a source file over the SSH connection to be stored on the remote path provided.
	 * </odoc>
	 */
	@JSFunction
	public void sendFile(String sourceFile, String remoteFile) throws JSchException, IOException {
		boolean ptimestamp = true;
		FileInputStream fis = null;
		
		try {
			String command = "scp " + (ptimestamp ? "-p" : "") + " -t " + remoteFile;
                        Channel channel = session.openChannel("exec");
			((ChannelExec) channel).setCommand(command);
			
			OutputStream out = channel.getOutputStream();
			InputStream in = channel.getInputStream();
			
			//if (!channel.isConnected()) channel.connect();
			
			if (checkAck(in) != 0) {
				return;
			}
			
			File _lfile = new File(sourceFile);
			
			if(ptimestamp) {
				command = "T " + (_lfile.lastModified()/1000) + " 0";
				command += (" " + (_lfile.lastModified()/1000) + " 0\n");
				out.write(command.getBytes());
				out.flush();
				if (checkAck(in) != 0) {
					return;
				}
			}
			
			long filesize = _lfile.length();
			command = "C0644 " + filesize + " ";
			if (sourceFile.lastIndexOf('/') > 0) {
				command += sourceFile.substring(sourceFile.lastIndexOf('/') + 1);
			} else {
				command += sourceFile;
			}
			
			command += "\n";
			
			out.write(command.getBytes());
			out.flush();
			
			if (checkAck(in) != 0) {
				return;
			}
			
			// Sending contents
			fis = new FileInputStream(sourceFile);
			byte[] buf = new byte[1024];
			while(true) {
				int len = fis.read(buf, 0, buf.length);
				if (len <= 0) break;
				out.write(buf, 0, len);
			}
			fis.close();
			fis = null;
			
			buf[0] = 0; 
			out.write(buf, 0, 1);
			out.flush();
			
			if (checkAck(in) != 0) {
				return;
			}
			
			//channel.disconnect();
		} catch (IOException e) {
			try { if(fis != null) fis.close();} catch (Exception ee) {}
			throw e;
		}
	}
	
	/**
	 * <odoc>
	 * <key>SSH.sftpGet(aRemoteFile, aLocalFile, monitor) : JavaStream</key>
	 * Retrieves a remote file over the SFTP connection to be stored on the local path provided. If aLocalFile is
	 * not provided the remote file contents will be returned as a Java Stream
	 * Optionally you can provided a callback function called monitor (see more in ow.format.sshProgress)
	 * </odoc>
	 * @throws IOException 
	 */
	@JSFunction
	public Object sftpGet(String remoteFile, String localFile, Object monitor) throws SftpException, JSchException, IOException {
		ChannelSftp ch = (ChannelSftp) getSftpChannel();
		
		if (localFile == null) localFile = remoteFile;
		if (monitor != null && !(monitor instanceof Undefined)) {
			if (localFile != null && !localFile.equals("") && !localFile.endsWith("undefined")) {
				ch.get(remoteFile, localFile, (SftpProgressMonitor) ((NativeJavaObject) monitor).unwrap());
			} else {
				try ( InputStream is = ch.get(remoteFile, (SftpProgressMonitor) ((NativeJavaObject) monitor).unwrap()) ) {
					return IOUtils.toBufferedInputStream(is);
				}
			}
		} else {
			if (localFile != null && !localFile.equals("") && !localFile.endsWith("undefined")) {
				ch.get(remoteFile, localFile);
			} else {
				try ( InputStream is = ch.get(remoteFile) ) {
					return IOUtils.toBufferedInputStream(is);
				}
			}
		}

		return remoteFile;
	}
	
	/**
	 * <odoc>
	 * <key>SSH.sftpPut(aSource, aRemoteFile, monitor)</key>
	 * Sends aSource file (if string) or a Java stream to a remote file path over a SFTP connection.
	 * Optionally you can provided a callback function called monitor (see more in ow.format.sshProgress)
	 * </odoc>
	 * @throws Exception 
	 */
	@JSFunction
	public void sftpPut(Object aSource, String aRemoteFile, Object monitor) throws Exception {
		ChannelSftp ch = (ChannelSftp) getSftpChannel();
		
		if (monitor != null && !(monitor instanceof Undefined)) {
			if (aSource instanceof String) {
				ch.put((String) aSource, aRemoteFile, (SftpProgressMonitor) ((NativeJavaObject) monitor).unwrap());
			} else {
				if (aSource instanceof NativeJavaObject) aSource = ((NativeJavaObject) aSource).unwrap();
				if (aSource instanceof InputStream) {
					try ( OutputStream os = ch.put(aRemoteFile, (SftpProgressMonitor) ((NativeJavaObject) monitor).unwrap(), 0) ) {
						IOUtils.copyLarge((InputStream) aSource, os);
					}
				} else {
					throw new Exception("Expecting a string source file name or a Java Input stream as source");
				}
			}
		} else {
			if (aSource instanceof String) {
				ch.put((String) aSource, aRemoteFile);
			} else {
				if (aSource instanceof NativeJavaObject) aSource = ((NativeJavaObject) aSource).unwrap();
				if (aSource instanceof InputStream) {
					try ( OutputStream os = ch.put(aRemoteFile) ) {
						IOUtils.copyLarge((InputStream) aSource, os);
					}
				} else {
					throw new Exception("Expecting a string source file name or a Java Input stream as source");
				}
			}
		}
	}	
	
	/**
	 * <odoc>
	 * <key>SSH.getFile(aRemoteFile, aLocalFile) : anArrayOfBytes</key>
	 * Retrieves a remote file over the SSH connection to be stored on the local path provided. If aLocalFile is
	 * not provided the remote file contents will be returned as an array of bytes.
	 * </odoc>
	 */
	@JSFunction
	public byte[] getFile(String remoteFile, String localFile) throws JSchException, IOException {
		if (localFile != null && !localFile.equals("") && !localFile.endsWith("undefined"))
			return getSSHFile(remoteFile, localFile, true);
		else
			return getSSHFile(remoteFile, localFile, false);
	}
	
	public byte[] getSSHFile(String remoteFile, String localFile, boolean fileFlag) throws JSchException, IOException {
		OutputStream fos = null;
		byte[] res = null;
		
		try {
	        String prefix = null;
	        if (fileFlag)
		        if(new File(localFile).isDirectory()) {
		           prefix=localFile + File.separator;
		        }
		      
			// exec 'scp -f rfile' remotely
			String command = "scp -f "+ remoteFile;
                        Channel channel = session.openChannel("exec");
			((ChannelExec)channel).setCommand(command);

			// get I/O streams for remote scp
			OutputStream out = channel.getOutputStream();
			InputStream in = channel.getInputStream();

			if (!channel.isConnected()) channel.connect();

			byte[] buf = new byte[1024];

			// send '\0'
			buf[0] = 0; 
			out.write(buf, 0, 1); 
			out.flush();

			while(true){
				int c=checkAck(in);
				
				if(c!='C'){
					break;
				}

				// read '0644 '
				in.read(buf, 0, 5);

				long filesize = 0L;
				while(true) {
					if(in.read(buf, 0, 1) < 0) {
						// error
						break; 
					}
					if(buf[0] == ' ') break;
					filesize = filesize * 10L + (long)(buf[0] - '0');
				}

				String file = null;
				for(int i=0; ; i++){
					in.read(buf, i, 1);
					if(buf[i] == (byte) 0x0a) {
						file = new String(buf, 0, i);
						break;
					}
				}

				// send '\0'
				buf[0] = 0;
				out.write(buf, 0, 1); 
				out.flush();

				// read a content of lfile
				if (fileFlag)
					fos = new FileOutputStream(prefix==null ? localFile : prefix + file);
				else
					fos = new ByteArrayOutputStream();
				int foo;
				while(true) {
					if (buf.length<filesize) 
						foo = buf.length;
					else 
						foo=(int) filesize;
					
					foo = in.read(buf, 0, foo);
					if(foo < 0) {
						// error 
						break;
					}
					
					fos.write(buf, 0, foo);
					filesize -= foo;
					if(filesize == 0L) break;
				}
				
				fos.flush();
				if (!fileFlag) res = ((ByteArrayOutputStream) fos).toByteArray();
				fos.close();
				fos = null;

				if(checkAck(in) != 0){
					return res;
				}

				// send '\0'
				buf[0] = 0;
				out.write(buf, 0, 1); 
				out.flush();
			}
		} catch(IOException e) {
			try { if(fos!=null) fos.close(); } catch(Exception ee) {}
			throw e;
		}
		
		return res;
	}
}
