package openaf.plugins;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.lang.String;

import org.eclipse.jgit.api.CheckoutCommand;
import org.eclipse.jgit.api.CloneCommand;
import org.eclipse.jgit.api.CommitCommand;
import org.eclipse.jgit.api.FetchCommand;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.Status;
import org.eclipse.jgit.api.TransportCommand;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.InvalidRemoteException;
import org.eclipse.jgit.api.errors.TransportException;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.eclipse.jgit.lib.Ref;
import org.eclipse.jgit.revwalk.RevCommit;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;
import openaf.AFCmdBase;

/**
 * GIT plugin
 * 
 * @author Nuno Aguiar
 * 
 */
public class GIT extends ScriptableObject {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	protected String login;
	protected String pass;

	@Override
	public String getClassName() {
		return "GIT";
	}

	protected Git git;
	
	/**
	 * <odoc>
	 * <key>GIT.GIT(aDirectory, aUser, aPassword)</key>
	 * Creates a GIT object instance to access a GIT repository on the aDirectory provided.
	 * Optionally you can provide also a login and password for remote repositories.
	 * </odoc>
	 */
	@JSConstructor
	public void newGIT(Object dir, Object alogin, Object apass) throws IOException { 	
		// Remove JGit logging except for errors
		//((org.slf4j.helpers.NOPLogger) LoggerFactory.getLogger(org.eclipse.jgit.util.FS.class)).setLevel(ch.qos.logback.classic.Level.ERROR);
		//((ch.qos.logback.classic.Logger) LoggerFactory.getLogger(org.eclipse.jgit.util.FS.class)).setLevel(ch.qos.logback.classic.Level.ERROR);
		//((ch.qos.logback.classic.Logger) LoggerFactory.getLogger(org.eclipse.jgit.util.FS_Win32.class)).setLevel(ch.qos.logback.classic.Level.ERROR);
		//((ch.qos.logback.classic.Logger) LoggerFactory.getLogger(org.eclipse.jgit.util.FS_Win32_Cygwin.class)).setLevel(ch.qos.logback.classic.Level.ERROR);
		//((ch.qos.logback.classic.Logger) LoggerFactory.getLogger(org.eclipse.jgit.util.FS_POSIX.class)).setLevel(ch.qos.logback.classic.Level.ERROR);
		open(dir);
		if (alogin != null && !(alogin instanceof Undefined) &&
			apass != null && !(apass instanceof Undefined)) {
			login = AFCmdBase.afc.dIP((String) alogin);
			pass = AFCmdBase.afc.dIP((String) apass);
		}
	}
	
	/**
	 * <odoc>
	 * <key>GIT.open(aDirectory)</key>
	 * Opens a GIT repository on the aDirectory provided.
	 * </odoc>
	 * @throws IOException 
	 */
	@JSFunction
	public void open(Object dir) throws IOException {
		if (!(dir instanceof Undefined) && !((String) dir).equals("")) {
			git = Git.open(new File((String) dir));
		}
	}
	
	/**
	 * <odoc>
	 * <key>GIT.init(aDirectory)</key>
	 * Initializes a GIT repository on the aDirectory provided.
	 * </odoc>
	 */
	@JSFunction
	public void init(Object dir) throws IllegalStateException, GitAPIException {
		if (!(dir instanceof Undefined) && !((String) dir).equals("")) {
			git = Git.init().setDirectory(new File((String) dir)).call();
		}
	}
	
	/**
	 * <odoc>
	 * <key>GIT.clone(aURL, aDirectory, cloneAll, aBranchName, aUser, aPassword)</key>
	 * Clones aURL GIT repository to the aDirectory provided. Optionally, if you want all branches cloned you can indicate that
	 * with cloneAll = true. If don't want all branches cloned but a specific one you can indicate it with aBranchName.
	 * </odoc>
	 */
	@JSFunction
	public void clone(Object aURL, Object dir, boolean cloneAll, Object branch, String aUser, String aPass) throws InvalidRemoteException, TransportException, GitAPIException {
		if (!(dir instanceof Undefined) && !((String) dir).equals("") && !(aURL instanceof Undefined) && !((String) aURL).equals("")) {
			CloneCommand clone = ((CloneCommand) setCred(Git.cloneRepository())).setURI((String) aURL).setDirectory(new File((String) dir));
			if (!(branch instanceof Undefined) && !((String) branch).equals("")) {
				clone = clone.setBranchesToClone(Collections.singleton((String) branch));
				clone = clone.setBranch((String) branch);
				clone = clone.setCloneAllBranches(cloneAll);
			}
			if (aUser != null && aPass != null) clone.setCredentialsProvider(new UsernamePasswordCredentialsProvider(AFCmdBase.afc.dIP(aUser), AFCmdBase.afc.dIP(aPass)));
			git = clone.call();
		}
	}
	
	/**
	 * <odoc>
	 * <key>GIT.checkout(aPath, aBranchName) : JavaRef</key>
	 * Checkouts the current GIT repository to aPath. Optionally you can provide aBranchName to checkout a specific branch.
	 * </odoc>
	 */
	@JSFunction
	public Object checkout(Object aPath, Object aBranchName) throws Exception {
		if (git != null) {
			CheckoutCommand check = git.checkout();
			if (!(aBranchName instanceof Undefined) && !((String) aBranchName).equals(""))
				check = check.setName((String) aBranchName);
			Ref checkout;
			if (!(aPath instanceof Undefined) && !((String) aPath).equals(""))
				checkout = check.addPath((String) aPath).call();
			else
				checkout = check.call();
			return checkout;
		} else {
			throw new Exception("Repository not open");
		}
	}
	
	/**
	 * <odoc>
	 * <key>GIT.add(aFilePattern) : JavaDirCache</key>
	 * Adds a given aFilePattern (e.g. "some.file.txt" or "someFiles*") to the current open repository. Throws a "Repository not open" 
	 * exception if the repository is not open.
	 * </odoc>
	 * @throws Exception 
	 */
	@JSFunction
	public Object add(String aFilePattern) throws Exception {
		if (git != null)
			return git.add().addFilepattern(aFilePattern).call();
		else 
			throw new Exception("Repository not open");
	}
	
	/**
	 * <odoc>
	 * <key>GIT.remove(aFilePattern)</key>
	 * Removes a given aFilePattern (e.g. "some.file.txt" or "someFiles*") from the current open repository. Throws an exception if not possible.
	 * </odoc>
	 */
	@JSFunction
	public void remove(String aFilePattern) throws Exception {
		if (git != null)
			git.rm().addFilepattern(aFilePattern).call();
		else
			throw new Exception("Repository not open");
	}
	
	@JSFunction
	public Object getStatus(Object aDirectory) throws Exception {
		Scriptable record = (Scriptable) AFCmdBase.jse.newObject(AFCmdBase.jse.getGlobalscope());
		
		Status status;
		if (git != null) {
			if (!(aDirectory instanceof Undefined) && !((String) aDirectory).equals("")) {
				status = git.status().addPath((String) aDirectory).call();
			} else {
				status = git.status().call();
			}
			
			record.put("added", record, AFCmdBase.jse.newArray(record, status.getAdded().toArray()));
			record.put("changed", record, AFCmdBase.jse.newArray(record, status.getChanged().toArray()));
			record.put("conflicting",  record, AFCmdBase.jse.newArray(record, status.getConflicting().toArray()));
			record.put("ignoredNotInIndex",  record, AFCmdBase.jse.newArray(record, status.getIgnoredNotInIndex().toArray()));
			record.put("missing",  record, AFCmdBase.jse.newArray(record, status.getMissing().toArray()));
			record.put("modified",  record, AFCmdBase.jse.newArray(record, status.getModified().toArray()));
			record.put("removed",  record, AFCmdBase.jse.newArray(record, status.getRemoved().toArray()));			
		} else 
			throw new Exception("Repository not open");
		
		return record;
	}
	
	/**
	 * <odoc>
	 * <key>GIT.getJavaGit() : JavaGit</key>
	 * Returns the internal Java GIT object.
	 * </odoc>
	 */
	@JSFunction
	public Object getJavaGit() {
		return git;
	}
	
	protected TransportCommand<?, ?> setCred(TransportCommand<?, ?> c) {
		if (login != null & pass != null) {
			c.setCredentialsProvider(new UsernamePasswordCredentialsProvider(login, pass));
		}
		
		return c;
	}
	
	/**
	 * <odoc>
	 * <key>GIT.push()</key>
	 * Performs a push command on the current opened GIT repository.
	 * </odoc>
	 */
	@JSFunction
	public void push() throws Exception {
		if (git != null)
			setCred(git.push()).call();
		else
			throw new Exception("Repository not open");
	}
 
       	/**
	 * <odoc>
	 * <key>GIT.pull()</key>
	 * Performs a pull command on the current opened GIT repository.
	 * </odoc>
	 */
	@JSFunction
	public void pull() throws Exception {
		if (git != null)
			setCred(git.pull()).call();
		else
			throw new Exception("Repository not open");
	}
 

	/**
	 * <odoc>
	 * <key>GIT.fetch(aRemote)</key>
	 * Performs a fetch command on the current open GIT repository.
	 * Optionally you can provide aRemote.
	 * </odoc>
	 * @throws Exception 
	 */
	@JSFunction
	public void fetch(Object aRemote) throws Exception {
		if (git != null) {
			FetchCommand fetch = (FetchCommand) setCred(git.fetch());
			if (!(aRemote instanceof Undefined) && !((String) aRemote).equals("")) {
				fetch = fetch.setRemote((String) aRemote);
			}
			fetch.call();
		}
		else
			throw new Exception("Repository not open");
	}
	
	/**
	 * <odoc>
	 * <key>GIT.branchCreate(aBranchName)</key>
	 * Creates a branch with the provided aBranchName on the current open GIT repository.
	 * </odoc>
	 */
	@JSFunction
	public void branchCreate(String aBranchName) throws Exception {
		if (git != null)
			git.branchCreate().setName(aBranchName).call();
		else
			throw new Exception("Repository not open");
	}
	
	/**
	 * <odoc>
	 * <key>GIT.branchRename(aOldName, aNewName)</key>
	 * Renames aOldName branch with aNewName on the current open GIT repository.
	 * </odoc>
	 */
	@JSFunction
	public void branchRename(String oldName, String newName) throws Exception {
		if (git != null)
			git.branchRename().setOldName(oldName).setNewName(newName).call();
		else
			throw new Exception("Repository not open");
	}
	
	/**
	 * <odoc>
	 * <key>GIT.branchDelete(aBranchName)</key>
	 * Deletes a branch named aBranchName from the current open GIT repository.
	 * </odoc>
	 */
	@JSFunction
	public void branchDelete(String aBranchName) throws Exception {
		if (git != null)
			git.branchDelete().setBranchNames(aBranchName).call();
		else
			throw new Exception("Repository not open");
	}
	
	/**
	 * <odoc>
	 * <key>GIT.branchList()</key>
	 * Lists the name and objectId for each branch available on the current open GIT repository.
	 * </odoc>
	 */
	@JSFunction
	public Object branchList() throws Exception {
		ArrayList<Scriptable> records = new ArrayList<Scriptable>();
		
		if (git != null) {
			List<Ref> list = git.branchList().call();
			for(Ref i : list) {
				Scriptable record = (Scriptable) AFCmdBase.jse.newObject(AFCmdBase.jse.getGlobalscope());
				
				record.put("name", record, i.getName());
				record.put("objectId", record, i.getObjectId().getName());
				//record.put("target",  record, i.getTarget());
				//record.put("peeledObjectId", record, i.getPeeledObjectId());
				
				records.add(record);
			}
		} else
			throw new Exception("Repository not open");
		
		return AFCmdBase.jse.newArray(AFCmdBase.jse.getGlobalscope(), records.toArray());
	}

	/**
	 * <odoc>
	 * <key>GIT.branch() : String</key>
	 * Returns the current branch for the repository.
	 * </odoc>
	 */
	@JSFunction
	public Object branch() throws Exception {
		String branch = "";

		if (git != null) {
			branch = git.status().getRepository().getBranch();
		}

		return branch;
	}
	
	@JSFunction
	public Object remoteBranchList(String anURL) throws Exception {
		if (git != null) {
			return Git.lsRemoteRepository().setRemote(anURL).setHeads(true).call();
		} else {
			throw new Exception("Repository not open");
		}
	}
	
	/**
	 * <odoc>
	 * <key>GIT.close()</key>
	 * Closes the current open GIT repository.
	 * </odoc>
	 */
	@JSFunction
	public void close() throws Exception {
		if (git != null) 
			git.close();
		else
			throw new Exception("Repository not open");
	}
	
	/**
	 * <odoc>
	 * <key>GIT.commit(aMessage, aName, anEmail) : JavaRevCommit</key>
	 * Commits the current open GIT repository with aMessage provided. Throws an exception if not possible.
	 * Optionally you can also provide aName and anEmail.
	 * </odoc>
	 * @throws Exception 
	 */
	@JSFunction
	public Object commit(String aMessage, Object name, Object email) throws Exception {
		if (git != null) {
			CommitCommand commit = git.commit().setMessage(aMessage);
			if (!(name instanceof Undefined) && !((String) name).equals("") &&
				!(email instanceof Undefined) && !((String) email).equals("")) {
				commit = commit.setAuthor((String) name, (String) email);
			}
			RevCommit revcommit = commit.call();	
			return revcommit;
		}
		else
			throw new Exception("Repository not open");
	}
}
