package openaf;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

import org.apache.commons.io.IOUtils;

public class OAFRepack {
    public static void repack(String aOrigFile, String aDestFile) {

        // TODO: Accept list to exclude
        // TODO: Accept list to include

        try {
            ZipInputStream zis  = new ZipInputStream((new FileInputStream(aOrigFile)));
            ArrayList<String> al = new ArrayList<String>();

            // Count entries
            long zisSize = 0;
            ZipEntry _ze = null;

            do {
                _ze = zis.getNextEntry();
                zisSize++;
            } while(_ze != null);
            zis.close();

            // Preparing input
            ZipFile zipFile = new ZipFile(aOrigFile);
            ZipEntry ze = null;

            // Preparing output 
            ZipOutputStream zos = new ZipOutputStream((new FileOutputStream(aDestFile)));
            zos.setLevel(9);

            // Execute
            zis  = new ZipInputStream((new FileInputStream(aOrigFile)));
            long zosSize = 0;

                do {
                    ze = zis.getNextEntry();
                    if (ze != null) {
                        if (!(ze.getName().endsWith("/"))) {
                            // TODO: If manifest, rebuild manifest
                            zosSize++;
                            System.out.print("\rProgress " + zosSize + "/" + zisSize);

                            // TODO: If jar, uncompress it in memory
                            if(ze.getName().toLowerCase().endsWith(".jar")) {
                                //System.out.println("--J " + ze.getName());
                                ZipInputStream szis = new ZipInputStream(zipFile.getInputStream(ze));
                                ZipEntry sze;

                                while((sze = szis.getNextEntry()) != null) {
                                    if (!al.contains(sze.getName())) {
                                        //System.out.println(" -> " + sze.getName());
                                        ZipEntry newZe = new ZipEntry(sze.getName());
                                        zos.putNextEntry(newZe);
                                        al.add(newZe.getName());
                                        if (!newZe.isDirectory()) {
                                            IOUtils.copy(szis, zos);
                                        }
                                        zos.closeEntry();
                                    } else {
                                        //System.out.println("--D " + sze.getName());
                                    }
                                }
                                szis.close();
                            } else {
                                if (!al.contains(ze.getName())) {
                                    //System.out.println("--> " + ze.getName());

                                    ZipEntry newZe = new ZipEntry(ze.getName());
                                    zos.putNextEntry(newZe);
                                    al.add(newZe.getName());
                                    if (!newZe.isDirectory()) {
                                        IOUtils.copy(zipFile.getInputStream(ze), zos);
                                    }
                                    zos.closeEntry();
                                } else {
                                    //System.out.println("--D " + ze.getName());
                                }
                            }
                        }
                    }
                } while(ze != null);
            //}

            // Closing
            zipFile.close();
            zis.close();
            zos.flush();
            zos.finish();
            zos.close();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    }

    public static void main(String args[]) {
        repack("openaf.jar.orig", "oaf.tmp.zip");
    }
}