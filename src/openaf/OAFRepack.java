package openaf;

import java.io.FileInputStream;
import java.io.IOException;
import java.net.URI;
import java.nio.file.CopyOption;
import java.nio.file.FileSystem;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import java.util.zip.ZipInputStream;

public class OAFRepack {
    public static void repack(String aOrigFile, String aDestFile) {
        try {
            ZipInputStream zis  = new ZipInputStream((new FileInputStream(aOrigFile)));
            Path path = Paths.get(aDestFile);
            URI uri = URI.create("jar:" + path.toUri());
            Map<String, String> env = new HashMap<>();
            env.put("create", "true");

            ZipFile zipFile = new ZipFile(aOrigFile);
            ZipEntry ze = null;
            try (FileSystem fs = FileSystems.newFileSystem(uri, env)) {
                do {
                    ze = zis.getNextEntry();
                    if (ze != null) {
                        if (!(ze.getName().endsWith("/"))) {
                            System.out.println("--> " + ze.getName());
                                Path nf = fs.getPath(ze.getName());
                                if (nf.getParent() != null && !Files.exists(nf.getParent())) Files.createDirectories(nf.getParent());
                                Files.copy(zipFile.getInputStream(ze), nf, new CopyOption[] { StandardCopyOption.REPLACE_EXISTING });
                        }
                    }
                } while(ze != null);
            }
            zipFile.close();
            zis.close();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    }

    public static void main(String args[]) {
        repack("openaf.jar.orig", "oaf.tmp.zip");
    }
}