package wedo.openaf.plugins;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.UnknownHostException;
import java.util.ArrayList;

import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;

import jcifs.smb.NtlmPasswordAuthentication;
import jcifs.smb.SmbException;
import jcifs.smb.SmbFile;
import jcifs.smb.SmbFileInputStream;
import wedo.openaf.AFCmdBase;

/**
 * OpenAF plugin to access remote Windows/Samba shares using jcifs
 * 
 * @author Nuno Aguiar <nuno.aguiar@wedotechnologies.com>
 *
 */
public class SMB extends ScriptableObject {

	private static final long serialVersionUID = 2794123619215765456L;
	protected NtlmPasswordAuthentication npa;
	protected SmbFile smbf;
	
	@Override
	public String getClassName() {
		return "SMB";
	}
	
	@JSConstructor
	public void newSMB(String shareURL, String aDomain, String aUser, String aPassword) throws IOException, InstantiationException, IllegalAccessException {
		npa = new NtlmPasswordAuthentication(aDomain, aUser, AFCmdBase.afc.dIP(aPassword));
		smbf = new SmbFile(shareURL, npa);
		smbf.connect();
	}
	
	@JSFunction
	public Object getSmbFile() {
		return smbf;
	}
	
	@JSFunction
	public Object listFiles() throws IOException {
		Scriptable no = (Scriptable) AFCmdBase.jse.newObject(AFCmdBase.jse.getGlobalscope());
		ArrayList<Scriptable> list = new ArrayList<Scriptable>(); 
		
		SmbFile[] ss = smbf.listFiles();
		
		for(int i = 0; i < ss.length; i++) {
			Scriptable record = (Scriptable) AFCmdBase.jse.newObject(no);
			record.put("filename", record, ss[i].getName());
			record.put("filepath", record, ss[i].getParent() + ss[i].getName());
			record.put("size", record, ss[i].length());
			record.put("permissions", record, ss[i].getPermission().getName());
			record.put("lastModified", record, ss[i].getLastModified());
			record.put("createTime", record, ss[i].createTime());
			record.put("isDirectory", record, ss[i].isDirectory());
			record.put("isFile", record, ss[i].isFile());
			list.add(record);
		}
		
		no.put("files", no, AFCmdBase.jse.newArray(no, list.toArray()));
		return no;
	}
	
	@JSFunction
	public Object getFile(String aSource, String aTarget) throws MalformedURLException, SmbException, UnknownHostException {
		SmbFile f = new SmbFile(aSource, npa);
		SmbFileInputStream sfis = new SmbFileInputStream(f);
//		IOUtils.
		return null;
	}
}
