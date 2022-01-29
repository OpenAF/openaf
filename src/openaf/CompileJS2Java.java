package openaf;

import org.mozilla.javascript.optimizer.ClassCompiler;
import org.mozilla.javascript.CompilerEnvirons;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

/**
 * 
 * @author Nuno Aguiar
 * 
 */
public class CompileJS2Java {
    public static void main(String args[]) {
		try {
			String script = new String(Files.readAllBytes(Paths.get(args[1])));
			compileToClasses(args[0], script, args[2]);
		} catch(IOException e) {
			System.err.println(e.getMessage());
			e.printStackTrace();
		}        
    }

    public static void compileToClasses(String classfile, String script, String path) {
		CompilerEnvirons ce = new CompilerEnvirons();
		ce.setOptimizationLevel(9);
		ce.setLanguageVersion(org.mozilla.javascript.Context.VERSION_ES6); 
		ClassCompiler cc = new ClassCompiler(ce);
		Object compiled[] = cc.compileToClassFiles(script, classfile, 1, classfile);
		if (path == null || path.equals("undefined"))
			path = "";
		else
			path = path + "/";

		for (int j = 0; j != compiled.length; j += 2) {
			String className = (String)compiled[j];
			byte[] bytes = (byte[])(byte[])compiled[(j + 1)];
			File outfile = new File(path + className + ".class");
			try {
				FileOutputStream os = new FileOutputStream(outfile);
				try {
					os.write(bytes);
				} finally {
					os.close();
				}
			} catch (IOException ioe) {
				System.err.println(ioe.getMessage());
                ioe.printStackTrace();
			}
		} 
	}
}