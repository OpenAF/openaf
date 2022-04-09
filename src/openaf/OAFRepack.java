package openaf;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.Reader;
import java.io.StringWriter;
import java.io.UnsupportedEncodingException;
import java.io.Writer;
import java.util.ArrayList;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

import jodd.util.ClassLoaderUtil;
import java.lang.String;
/**
 * 
 * @author Nuno Aguiar
 * 
 */
public class OAFRepack {
    protected static final int DEFAULT_BUFFER_SIZE = 1024 * 4;

    // Rewritten from IOUtils
    public static long copy(final InputStream is, final OutputStream os) throws IOException {
        long count = 0; int n;
        byte[] buffer = new byte[DEFAULT_BUFFER_SIZE];

        while (-1 != (n = is.read(buffer))) {
            os.write(buffer, 0, n);
            count += n;
        }
        return count;
    }

    public static long copy(final Reader ir, final Writer or) throws IOException {
        long count = 0; int n;
        char[] buffer = new char[DEFAULT_BUFFER_SIZE];

        while (-1 != (n = ir.read(buffer))) {
            or.write(buffer, 0, n);
            count += n;
        }
        return count;
    }

    public static String toString(final InputStream is, final String encoding) throws IOException {
        final InputStreamReader in = new InputStreamReader(is, encoding);
        try (final StringWriter sw = new StringWriter()) {
            copy(in, sw);
            return sw.toString();
        }
    }

    public static void write(final String str, final OutputStream os, String encoding) throws UnsupportedEncodingException, IOException {
        if (str != null) {
            os.write(str.getBytes(encoding));
        }
    }

    public static String javaHome() {
        String home = System.getProperty("java.home");
		if (home == null) {
			return null;
		}
		int i = home.lastIndexOf('\\');
		int j = home.lastIndexOf('/');
		if (j > i) {
			i = j;
        }

		return home.substring(0, i);
    }
    
    public static File findToolsJar() {
		String javaHome = javaHome();
		if (javaHome == null) {
			return null;
		}
		String tools = new File(javaHome).getAbsolutePath() + File.separatorChar + "lib" + File.separatorChar + "tools.jar";
		File toolsFile = new File(tools);
		if (toolsFile.exists()) {
			return toolsFile;
        }
		return null;
    }
    
    public static void repack(String aOrigFile, String aDestFile, String mainClass) throws Exception {

        // TODO: Accept list to exclude
        // TODO: Accept list to include
        
        ZipInputStream zis = null;
        FileInputStream fis = null;
        try {
            fis = new FileInputStream(aOrigFile);
            if (fis == null) throw new Exception("Couldn't read input file " + aOrigFile);

            zis = new ZipInputStream(fis);
            if (zis == null) throw new Exception("Couldn't read zip input file " + aOrigFile);

            ArrayList<String> al = new ArrayList<String>();

            // Count entries
            long zisSize = 0;
            ZipEntry _ze = null;

            try {
                do {
                    _ze = zis.getNextEntry();
                    zisSize++;
                } while (_ze != null);
            } finally {
                zis.close();
            }

            // Preparing input
            ZipFile zipFile = new ZipFile(aOrigFile);
            FileInputStream fis2 = null;
            ZipInputStream zis2 = null;
            if (zipFile != null) {
                try {
                    ZipEntry ze = null;

                    // Preparing output
                    FileOutputStream fos = new FileOutputStream(aDestFile);
                    if (fos == null) throw new Exception("Couldn't write output file " + aDestFile);
                    ZipOutputStream zos = new ZipOutputStream(fos);
                    if (zos == null) throw new Exception("Couldn't write output zip file " + aDestFile);

                    try {
                        zos.setMethod(ZipOutputStream.DEFLATED);
                        zos.setLevel(9);
        
                        // Execute
                        fis2 = new FileInputStream(aOrigFile);
                        if (fis2 == null) throw new Exception("Couldn't read internal file " + aOrigFile);
                        zis2 = new ZipInputStream(fis2);
                        if (zis2 == null) throw new Exception("Couldn't read zip internal file " + aOrigFile);
                        long zosSize = 0;
            
                        try {
                            do {
                                ze = zis2.getNextEntry();
                                zosSize++;
                                if (ze != null) {
                                    if (!(ze.getName().endsWith("/"))) {
                                        System.out.print("\rRepack progress " + zosSize + "/" + zisSize + " ("
                                                + Math.round((zosSize * 100) / zisSize) + "%)");
                
                                        if (ze.getName().toLowerCase().endsWith(".jar")) {
                                            ZipInputStream szis = null;
                                            InputStream sfis = null;
                                            try {
                                                if (ze.getName().toLowerCase().endsWith("tools-attach.jar") &&
                                                    findToolsJar() != null) {
                                                    sfis = new FileInputStream(findToolsJar());
                                                    szis = new ZipInputStream(sfis);
                                                } else {
                                                    sfis = zipFile.getInputStream(ze);
                                                    szis = new ZipInputStream(sfis);
                                                }
                                                
                                                ZipEntry sze;
                    
                                                while ((sze = szis.getNextEntry()) != null) {
                                                    if (!al.contains(sze.getName()) && !sze.getName().endsWith("MANIFEST.MF")
                                                            && !sze.getName().endsWith("ECLIPSE_.RSA")) {
                                                        ZipEntry newZe = new ZipEntry(sze.getName());
                                                        zos.putNextEntry(newZe);
                                                        al.add(newZe.getName());
                                                        if (!newZe.isDirectory()) {
                                                            copy(szis, zos);
                                                        }
                                                        zos.closeEntry();
                                                    }
                                                }
                                            } finally {
                                                if (szis != null) szis.close();
                                                if (sfis != null) sfis.close();
                                            }
                                        } else {
                                            if (!al.contains(ze.getName()) && !ze.getName().endsWith("MANIFEST.MF")
                                                    && !ze.getName().endsWith("ECLIPSE_.RSA")) {
                
                                                ZipEntry newZe = new ZipEntry(ze.getName());
                                                zos.putNextEntry(newZe);
                                                al.add(newZe.getName());
                                                if (!newZe.isDirectory()) {
                                                    InputStream cIs = zipFile.getInputStream(ze);
                                                    if (cIs != null) {
                                                        try {
                                                            copy(cIs, zos);
                                                        } finally {
                                                            cIs.close();
                                                        }
                                                    }
                                                }
                                                zos.closeEntry();
                                            } else {
                                                if (!al.contains(ze.getName()) && ze.getName().endsWith("MANIFEST.MF")) {
                                                    ZipEntry newZe = new ZipEntry(ze.getName());
                                                    zos.putNextEntry(newZe);
                                                    InputStream cIs = zipFile.getInputStream(ze);
                                                    if (cIs != null) {
                                                        try {
                                                            String manif = toString(cIs, "UTF-8");
                                                            if ((manif.indexOf("jarinjarloader") >= 0 && manif.indexOf("eclipse") >= 0)) {
                                                                manif = manif.replaceFirst(
                                                                        "org\\.eclipse\\.jdt\\.internal\\.jarinjarloader\\.JarRsrcLoader",
                                                                        mainClass);
                                                            } else {
                                                                manif = manif.replaceFirst("^Main-Class: .+$", "Main-Class: " + mainClass);
                                                            }
                                                            write(manif, zos, "UTF-8");
                                                            zos.closeEntry();
                                                        } finally {
                                                            cIs.close();
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            } while (ze != null);
                            System.out.println(
                                    "\rRepack progress " + zosSize + "/" + zisSize + " (" + Math.round((zosSize * 100) / zisSize) + "%)");
    
                        } finally {
                            zis2.close();
                            fis2.close();
                        }
                    } finally {
                        zos.flush();
                        zos.finish();
                        zos.close();
                        fos.close();
                    }
                } finally {
                    // Closing
                    zipFile.close();
                }
            }
        } catch (IOException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        } finally {
            if (zis != null) zis.close();
            if (fis != null) fis.close();
        }
    }

    public static void repackAndReplace(String jarFile, String cmd) throws Exception {
        repack(jarFile, jarFile + ".tmp", "openaf.AFCmdOS");
        
        ArrayList<String> command = new ArrayList<String>();
        boolean unix = ( System.getProperty("os.name").indexOf("Windows") < 0);
        if (unix) {
            command.add("/bin/sh");
            command.add("-c");
            command.add("sleep 1 && mv '" + jarFile + ".tmp' '" + jarFile + "' > /dev/null && " + cmd + ""); 
        } else {
            command.add("cmd");
            command.add("/c");
            command.add("ping -n 1 127.0.0.1 > NUL && move \"" + jarFile + ".tmp\" \"" + jarFile + "\" >NUL && " + cmd + ""); 
        }

        ProcessBuilder builder = new ProcessBuilder(command);
		builder.inheritIO();
		builder.start();
		java.lang.System.exit(0);
    }

    public static void main(String args[]) throws Exception {
        if (args.length >= 1) {
            System.out.println("Repacking " + args[0]);

            String cmd = "java -jar openaf.jar -h";
            if (args.length > 1) cmd = args[1];
            repackAndReplace(args[0], cmd.replaceAll("--force", ""));
        }
    }
}