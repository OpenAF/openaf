package wedo.openaf.plugins;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;

import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;
import org.tmatesoft.svn.core.SVNDepth;
import org.tmatesoft.svn.core.SVNException;
import org.tmatesoft.svn.core.SVNURL;
import org.tmatesoft.svn.core.internal.wc.DefaultSVNOptions;
import org.tmatesoft.svn.core.wc.SVNClientManager;
import org.tmatesoft.svn.core.wc.SVNCommitClient;
import org.tmatesoft.svn.core.wc.SVNConflictChoice;
import org.tmatesoft.svn.core.wc.SVNDiffClient;
import org.tmatesoft.svn.core.wc.SVNLogClient;
import org.tmatesoft.svn.core.wc.SVNRevision;
import org.tmatesoft.svn.core.wc.SVNUpdateClient;
import org.tmatesoft.svn.core.wc.SVNWCClient;
import org.tmatesoft.svn.core.wc.SVNWCUtil;
import org.tmatesoft.svn.core.wc.admin.SVNLookClient;

import wedo.openaf.AFCmdBase;

/**
 * SVN plugin
 * 
 * @author Nuno Aguiar
 * 
 */
public class SVN extends ScriptableObject {

	/**
	 * 
	 */
	private static final long serialVersionUID = -4095602172480399852L;
	protected SVNClientManager svncli;
	protected SVNURL svnurl;
	
	@Override
	public String getClassName() {
		return "SVN";
	}
	
	/**
	 * <odoc>
	 * <key>SVN.SVN(aURL, aUsername, aPassword, aFile, aPort) : SVN</key>
	 * Creates a new SVN instance object for the give SVN URL (e.g http://... ; svn://... ; file://... svn+ssh:// ...).
	 * To authenticate in the remote SVN (if needed), fFor svn+ssh you can also provide aUsername, aPassword, aFile and 
	 * aPort; for file only the aUsername will be considered; for http, svn and https only the aUsername and aPassword 
	 * will be considered.
	 * </odoc>
	 * @throws IllegalAccessException 
	 * @throws InstantiationException 
	 */
	@SuppressWarnings("deprecation")
	@JSConstructor
	public void newSVN(String url, Object userName, Object pass, Object file, int port) throws SVNException, InstantiationException, IllegalAccessException {
		svnurl = SVNURL.parseURIEncoded(url);
		
		if (!(userName instanceof Undefined) && !(pass instanceof Undefined)) {
			String p = AFCmdBase.afc.dIP((String) pass);
			if (svnurl.getProtocol().equals("svn") || svnurl.getProtocol().equals("http") || svnurl.getProtocol().equals("https")) {
				DefaultSVNOptions options = SVNWCUtil.createDefaultOptions(true);
				svncli = SVNClientManager.newInstance(options, (String) userName, (String) p);
			}
			if (svnurl.getProtocol().equals("svn+ssh")) {
				if (!(file instanceof Undefined)) System.setProperty("svnkit.ssh2.key", (String) file);
				System.setProperty("svnkit.ssh2.username", (String) userName);
				System.setProperty("svnkit.ssh2.password", p);
				System.setProperty("svnkit.ssh2.port", Integer.toString(port));
				
				svncli = SVNClientManager.newInstance();
			}
			//if (svnurl.getProtocol().equals("https")) {
			//	svna.add(SVNSSLAuthentication.newInstance(new File((String) file), ((String) pass).toCharArray(), true, svnurl, false));
			//	svncli.setAuthenticationManager(new BasicAuthenticationManager((SVNAuthentication[]) svna.toArray()));				
			//}
			if (svnurl.getProtocol().equals("file")) {
				DefaultSVNOptions options = SVNWCUtil.createDefaultOptions(true);
				svncli = SVNClientManager.newInstance(options, (String) userName, (String) p);
			}	
		} 
		
		if (svncli == null) svncli = SVNClientManager.newInstance();
	}
	
	protected SVNRevision parseRevision(String revision) {
		SVNRevision rev;
		
		switch(revision.toUpperCase()) {
		case "HEAD": rev = SVNRevision.HEAD; break;
		case "WORKING": rev = SVNRevision.WORKING; break;
		case "PREVIOUS": rev = SVNRevision.PREVIOUS; break;
		case "BASE": rev = SVNRevision.BASE; break;
		case "COMMITTED": rev = SVNRevision.COMMITTED; break;
		default: 
			rev = SVNRevision.parse(revision); break;
		}
		
		return rev;
	}

	/**
	 * <odoc>
	 * <key>SVN.checkout(aFilePathDestiny, aRevision) : Number</key>
	 * Checkout a given aFilePathDestiny from the connected repository. The aRevision can be the number of the revision
	 * or HEAD, WORKING, PREVIOUS, BASE or COMMITED. Returns the value of the checkout revision.
	 * </odoc>
	 */
	@JSFunction
	public long checkout(Object destiny, String revision) throws SVNException {
		SVNUpdateClient uCli = getUpdateClient();
		uCli.setIgnoreExternals(false);
		
		if (destiny == null || destiny instanceof Undefined) destiny = (String) ".";
	
		return uCli.doCheckout(svnurl, new File((String) destiny), parseRevision(revision), parseRevision(revision), SVNDepth.fromRecurse(true), true);
	}
	
	/**
	 * <odoc>
	 * <key>SVN.commit(anArrayOfFroms, aCommitMessage, useForce) : Object</key>
	 * Commits anArrayOfFroms paths on the filesystem with aCommitMessage. If necessary to force commit, in case of conflict,
	 * you can use useForce = true. Returns a SVNCommitInfo object.
	 * </odoc>
	 */
	@JSFunction
	public Object commit(NativeArray froms, String commitMessage, boolean force) throws SVNException {
		SVNCommitClient uCli = getCommitClient();
		ArrayList<File> files = new ArrayList<File>();
		for(long i = 0; i < froms.getLength(); i++) {
			files.add(new File(froms.get(i).toString()));
		}
		return uCli.doCommit(Arrays.copyOf(files.toArray(), files.size(), File[].class), false, commitMessage, null, null, false, force, SVNDepth.fromRecurse(true));
	}
	
	/**
	 * <odoc>
	 * <key>SVN.add(anArrayOfFilePaths, shouldForce, createParentDirectories)</key>
	 * Flags all file paths in anArrayOFilePaths to be added on to the SVN repository on commit. To force the operation
	 * you can optionally use shouldForce = true and you can optionally indicate to createParentDirectories. 
	 * </odoc>
	 */
	@JSFunction
	public void add(NativeArray paths, boolean force, boolean mkdir) throws SVNException {
		ArrayList<File> files = new ArrayList<File>();
		for(long i = 0; i < paths.getLength(); i++) {
			files.add(new File(paths.get(i).toString()));
		}		
		getWCClient().doAdd(Arrays.copyOf(files.toArray(), files.size(), File[].class), force, mkdir, false, null, false, false, false, true);
	}
	
	/**
	 * <odoc>
	 * <key>SVN.lock(anArrayOfFilePaths, stealLock, lockMessage)</key>
	 * Locks all file paths in anArrayOfFilePaths. Optionally you can stealLock = true and provided a lockMessage.
	 * </odoc>
	 */
	@JSFunction
	public void lock(NativeArray paths, boolean stealLock, String lockMessage) throws SVNException {
		ArrayList<File> files = new ArrayList<File>();
		for(long i = 0; i < paths.getLength(); i++) {
			files.add(new File(paths.get(i).toString()));
		}		
		getWCClient().doLock(Arrays.copyOf(files.toArray(), files.size(), File[].class), stealLock, lockMessage);
	}
	
	/**
	 * <odoc>
	 * <key>SVN.unlock(anArrayOfFilePaths, breakLock)</key>
	 * Unlocks all file paths in anArrayOfFilePaths. Optionally you can indicate to breakLock = true.
	 * </odoc>
	 */
	@JSFunction
	public void unlock(NativeArray paths, boolean breakLock) throws SVNException {
		ArrayList<File> files = new ArrayList<File>();
		for(long i = 0; i < paths.getLength(); i++) {
			files.add(new File(paths.get(i).toString()));
		}		
		getWCClient().doUnlock(Arrays.copyOf(files.toArray(), files.size(), File[].class), breakLock);
	}
	
	/**
	 * <odoc>
	 * <key>SVN.delete(anArrayOfFilePaths, forceDelete)</key>
	 * Deletes all file paths in anArrayOfFilePaths from the current working copy (including file system 
	 * level delete). Optionally you can indicate to forceDelete = true. 
	 * </odoc>
	 */
	@JSFunction
	public void delete(String path, boolean force) throws SVNException {
		getWCClient().doDelete(new File(path), force, false);
	}
	
	/**
	 * <odoc>
	 * <key>SVN.revert(anArrayOfFilePaths)</key>
	 * Reverts all file paths in anArrayOfFilePaths from the current working copy.
	 * </odoc>
	 */
	@JSFunction
	public void revert(NativeArray paths) throws SVNException {
		ArrayList<File> files = new ArrayList<File>();
		for(long i = 0; i < paths.getLength(); i++) {
			files.add(new File(paths.get(i).toString()));
		}		
		getWCClient().doRevert(Arrays.copyOf(files.toArray(), files.size(), File[].class), SVNDepth.INFINITY, null);
	}
	
	/**
	 * <odoc>
	 * <key>SVN.resolve(aFilePath, conflictChoice)</key>
	 * Resolves a conflict for the provided aFilePath. For the conflictChoice choose one of the available options: 
	 * Base, Merged, Mine_Conflict, Mine_Full, Postpone, Theirs_Conflict and Theirs_Full.
	 * </odoc>
	 */
	@JSFunction
	public void resolve(String path, String conflictChoice) throws SVNException {
		SVNConflictChoice scc = null;
		switch(conflictChoice.toUpperCase()) {
		case "BASE"  : scc = SVNConflictChoice.BASE; break;
		case "MERGED": scc = SVNConflictChoice.MERGED; break;
		case "MINE_CONFLICT": scc = SVNConflictChoice.MINE_CONFLICT; break;
		case "MINE_FULL": scc = SVNConflictChoice.MINE_FULL; break;
		case "POSTPONE": scc = SVNConflictChoice.POSTPONE; break;
		case "THEIRS_CONFLICT": scc = SVNConflictChoice.THEIRS_CONFLICT; break;
		case "THEIRS_FULL": scc = SVNConflictChoice.THEIRS_FULL; break;
		}
		getWCClient().doResolve(new File(path), SVNDepth.INFINITY, scc);
	}
	
	/**
	 * <odoc>
	 * <key>SVN.cleanup(aFilePath)</key>
	 * Executes a SVN cleanup on the provided aFilePath.
	 * </odoc>
	 */
	@JSFunction
	public void cleanup(String path) throws SVNException {
		getWCClient().doCleanup(new File(path));
	}
	
	/**
	 * <odoc>
	 * <key>SVN.getFile(aFilePath, aRevision) : JavaByteArrayOutputStream</key>
	 * Tries to retrieve a file from the provide aFilePath for aRevision (HEAD, WORKING, PREVIOUS,
	 * BASE or COMMITTED).
	 * </odoc>
	 */
	@JSFunction
	public ByteArrayOutputStream getFile(String path, String revision) throws SVNException {
		ByteArrayOutputStream dst = new ByteArrayOutputStream();
		getWCClient().doGetFileContents(new File(path), parseRevision(revision), parseRevision(revision), true, dst);
		return dst;
	}
	
	/**
	 * <odoc>
	 * <key>SVN.update(anArrayOfFroms, aRevision) : anArrayOfNumbers</key>
	 * Commits anArrayOfFroms paths on the filesystem. The aRevision can be the number of the revision
	 * or HEAD, WORKING, PREVIOUS, BASE or COMMITED. Returns the value of each update revision.
	 * </odoc>
	 */
	@JSFunction
	public long[] update(NativeArray froms, String revision) throws SVNException {
		SVNUpdateClient uCli = getUpdateClient();
		ArrayList<File> files = new ArrayList<File>();
		for(long i = 0; i < froms.getLength(); i++) {
			files.add(new File(froms.get(i).toString()));
		}
		return uCli.doUpdate(Arrays.copyOf(files.toArray(), files.size(), File[].class), parseRevision(revision), SVNDepth.fromRecurse(true), false, false);
	}
	
	/**
	 * <odoc>
	 * <key>SVN.getURL() : Object</key>
	 * Returns the current SVN URL.
	 * </odoc>
	 */
	@JSFunction
	public SVNURL getURL() {
		return svnurl;
	}
	
	/**
	 * <odoc>
	 * <key>SVN.getClientManager() : SVNClientManager</key>
	 * Returns a SVNClientManager object.
	 * </odoc>
	 */
	@JSFunction
	public SVNClientManager getClientManager() {
		return svncli;
	}
	
	/**
	 * <odoc>
	 * <key>SVN.getCommitClient() : SVNCommitClient</key>
	 * Returns a SVNCommitClient object.
	 * </odoc>
	 */
	@JSFunction
	public SVNCommitClient getCommitClient() {
		return svncli.getCommitClient();
	}
	
	/**
	 * <odoc>
	 * <key>SVN.getUpdateClient() : SVNUpdateClient</key>
	 * Returns a SVNUpdateClient object.
	 * </odoc>
	 */
	@JSFunction
	public SVNUpdateClient getUpdateClient() {
		return svncli.getUpdateClient();
	}
	
	/**
	 * <odoc>
	 * <key>SVN.getDiffClient() : SVNDiffClient</key>
	 * Returns a SVNDiffClient object.
	 * </odoc>
	 */
	@JSFunction
	public SVNDiffClient getDiffClient() {
		return svncli.getDiffClient();
	}
	
	/**
	 * <odoc>
	 * <key>SVN.getWCClient() : SVNWCClient</key>
	 * Returns a WCClient object.
	 * </odoc>
	 */
	@JSFunction
	public SVNWCClient getWCClient() {
		return svncli.getWCClient();
	}
	
	/**
	 * <odoc>
	 * <key>SVN.getLogClient() : SVNLogClient</key>
	 * Returns a LogClient object.
	 * </odoc>
	 */
	@JSFunction
	public SVNLogClient getLogClient() {
		return svncli.getLogClient();
	}
	
	/**
	 * <odoc>
	 * <key>SVN.getLookClient() : SVNLookClient</key>
	 * Returns a SVNLookClient object.
	 * </odoc>
	 */
	@JSFunction
	public SVNLookClient getLookClient() {
		return svncli.getLookClient();
	}
}
