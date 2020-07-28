package openaf;

import java.nio.file.CopyOption;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.io.File;
import java.io.IOException;
import java.lang.String;

/**
 * 
 * @author Nuno Aguiar
 * 
 */
public class _AFCmdOS {
    public static String[] args;
    protected static boolean checkedRepack = false;

    public static void repack() {
        if (checkedRepack) return;

        // Check repack
        if (OAFRepack.class.getResourceAsStream("/js.jar") != null) {
            System.err.println("Repacking OpenAF...");
            File currentJar;
            try {
                currentJar = new File(Class.forName("openaf.AFCmdBase").getProtectionDomain().getCodeSource().getLocation().toURI());
            } catch(Exception e) {
                currentJar = new File(java.lang.System.getProperties().getProperty("java.class.path"));
            }
            try {
                Files.copy(currentJar.toPath(), (new File(currentJar + ".orig")).toPath(),
                        new CopyOption[] { StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.COPY_ATTRIBUTES });
            } catch (IOException e) {
                SimpleLog.log(SimpleLog.logtype.ERROR, "Error with copying " + currentJar.toPath() + " to " + currentJar.toPath() + ".orig: " + e.getMessage(), null);
                SimpleLog.log(SimpleLog.logtype.DEBUG, "", e);
            }

            boolean unix = ( System.getProperty("os.name").indexOf("Windows") < 0);
            String sep = "";
            if (!unix) sep = "\""; else sep = "'";

            StringBuffer targs = new StringBuffer();
            targs.append(sep + java.lang.System.getProperty("java.home") + java.io.File.separator + "bin" + java.io.File.separator + "java" + sep);
            targs.append(" -jar ");
            targs.append(sep + currentJar.getPath() + sep);

            for(String s : args) {
                targs.append(" "); targs.append(s); 
            }
            try {
                OAFRepack.repackAndReplace(currentJar.getPath(), targs.substring(0, targs.length()));
            } catch (IOException e) {
                SimpleLog.log(SimpleLog.logtype.ERROR, "Error with the repack: " + e.getMessage(), null);
                SimpleLog.log(SimpleLog.logtype.DEBUG, "", e);
            }
        }

        checkedRepack = true;
    }

    public static void main(String[] args) {
        _AFCmdOS.args = args;
        _AFCmdOS.repack();
        AFCmdOS.main(args);
    }
}
