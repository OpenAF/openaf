package openaf.plugins;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.lang.String;

import org.apache.commons.compress.compressors.CompressorException;
import org.apache.commons.compress.compressors.CompressorStreamFactory;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;

import io.sigpipe.jbsdiff.DefaultDiffSettings;
import io.sigpipe.jbsdiff.Diff;
import io.sigpipe.jbsdiff.DiffSettings;
import io.sigpipe.jbsdiff.InvalidHeaderException;
import io.sigpipe.jbsdiff.Patch;

/**
 * BSDiff plugin
 * OpenAF plugin to provide binary diff
 * 
 * @author Nuno Aguiar
 *
 */
public class BSDiff extends ScriptableObject {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	protected String compression = CompressorStreamFactory.BZIP2;
	
	@Override
	public String getClassName() {
		return "BSDiff";
	}

	/**
	 * <odoc>
	 * <key>BSDiff.BSDiff()</key>
	 * Creates a new BSDiff instance to diff and patch binary files.
	 * </odoc>
	 */
	@JSConstructor
	public void BSDiff() {
	}
	
	/**
	 * <odoc>
	 * <key>BSDiff.diff(anOldFile, aNewFile, aPatchFile)</key>
	 * Given anOldFile and aNewFile binary file, the two will be compared and a new compressed aPatchFile will be generated.
	 * Check compression to be used with BSDiff.getCompression().
	 * </odoc>
	 */
	@JSFunction
	public void diff(String oldFile, String newFile, String patchFile) throws IOException, CompressorException, InvalidHeaderException {
		byte[] oldBytes = null;
		byte[] newBytes = null;

		try ( FileInputStream oldin = new FileInputStream(new File(oldFile)) ) {
			oldBytes = new byte[(int)(new File(oldFile)).length()];
			oldin.read(oldBytes);
			//oldin.close();
		}

		
		try ( FileInputStream newin = new FileInputStream(new File(newFile)) ) {
			newBytes = new byte[(int)(new File(newFile)).length()];
			newin.read(newBytes);
			//newin.close();
		}

		try ( FileOutputStream out = new FileOutputStream(patchFile) ) {
			DiffSettings settings = new DefaultDiffSettings(compression);
			Diff.diff(oldBytes, newBytes, out, settings);
			//out.close();
		}
	}
	
	/**
	 * <odoc>
	 * <key>BSDiff.diffBytes(oldArrayOfBytes, newArrayOfBytes) : ArrayOfBytes</key>
	 * Given oldArrayOfBytes and newArrayOfBytes, the two will be compared and a new compressed ArrayOfBytes will be generated
	 * and returned. Check compression to be used with BSDiff.getCompression().
	 * </odoc>
	 */
	@JSFunction
	public Object diffBytes(Object oldBytes, Object newBytes) throws CompressorException, InvalidHeaderException, IOException {		
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		
		DiffSettings settings = new DefaultDiffSettings(compression);
		Diff.diff((byte[]) oldBytes, (byte[]) newBytes, out, settings);
		
		return out.toByteArray();
	}
	
	/**
	 * <odoc>
	 * <key>BSDiff.setCompression(aCompression)</key>
	 * Sets a different compression method to be used (based on Apache Commons Compression available methods).
	 * </odoc>
	 */
	@JSFunction
	public void setCompression(String c) {
		compression = c;
	}
	
	/**
	 * <odoc>
	 * <key>BSDiff.getCompression() : String</key>
	 * Returns the current compression method in use.
	 * </odoc>
	 */
	@JSFunction
	public String getCompression() {
		return compression;
	}
	
	/**
	 * <odoc>
	 * <key>BSDiff.patchBytes(oldArrayOfBytes, patchArrayOfBytes) : ArrayOfBytes</key>
	 * Given an oldArrayOfBytes will apply patchArrayOfBytes (produced by diff/diffBytes) returning a new patched array of bytes.
	 * </odoc>
	 */
	@JSFunction
	public Object patchBytes(Object oldBytes, Object newBytes) throws CompressorException, InvalidHeaderException, IOException {		
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		Patch.patch((byte[]) oldBytes, (byte[]) newBytes, out);
		
		return out.toByteArray();
	}
	
	/**
	 * <odoc>
	 * <key>BSDiff.patchBytes(oldFile, patchFile, newFile) : ArrayOfBytes</key>
	 * Given an oldFile will apply a patchFile (produced by diff/diffBytes) and write the result to newFile.
	 * </odoc>
	 */
	@JSFunction
	public void patch(String oldFile, String newFile, String patchFile) throws CompressorException, InvalidHeaderException, IOException {	
		byte[] oldBytes = null; 
		byte[] newBytes = null;

		try ( FileInputStream oldin = new FileInputStream(new File(oldFile)) ) {
			oldBytes = new byte[(int)(new File(oldFile)).length()];
			oldin.read(oldBytes);
			//oldin.close();
		}
		
		try ( FileInputStream newin = new FileInputStream(new File(newFile)) ) {
			newBytes = new byte[(int)(new File(newFile)).length()];
			newin.read(newBytes);
			//newin.close();
		};

		try ( FileOutputStream out = new FileOutputStream(patchFile) ) {
			Patch.patch(oldBytes, newBytes, out);
			//out.close();
		}
	}
}
