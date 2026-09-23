import java.nio.file.*;
import java.util.zip.*;
import java.io.*;
import openaf.OAFRepack;

/** Checks the Java repacker's merging of module provider descriptors. */
public class JLineRepackTest {
    public static void main(String[] args) throws Exception {
        Path dir = Files.createTempDirectory("openaf-jline-repack-");
        Path source = dir.resolve("source.jar"), output = dir.resolve("output.jar");
        String service = "META-INF/services/org.jline.terminal.spi.TerminalProvider";
        try {
            try (ZipOutputStream out = new ZipOutputStream(Files.newOutputStream(source))) {
                for (String module : new String[] { "jline-terminal", "jline-terminal-jni", "jline-native" }) {
                    String name = module + "-4.4.3.jar";
                    out.putNextEntry(new ZipEntry(name));
                    Files.copy(Path.of("lib", name), out);
                    out.closeEntry();
                }
            }
            OAFRepack.repack(source.toString(), output.toString(), "openaf.Launcher");
            try (ZipFile zip = new ZipFile(output.toFile())) {
                String providers = new String(zip.getInputStream(zip.getEntry(service)).readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
                for (String provider : new String[] { "JniTerminalProvider", "ExecTerminalProvider", "DumbTerminalProvider" }) {
                    if (!providers.contains(provider)) throw new AssertionError("Missing " + provider);
                }
                if (zip.getEntry("META-INF/jline/providers/jni") == null) throw new AssertionError("Missing JNI runtime descriptor");
                if (zip.stream().noneMatch(e -> e.getName().endsWith(".dll"))) throw new AssertionError("Missing Windows native library");
                if (zip.stream().noneMatch(e -> e.getName().endsWith(".so"))) throw new AssertionError("Missing Linux native library");
            }
            System.out.println("JLineRepackTest passed");
        } finally { Files.deleteIfExists(source); Files.deleteIfExists(output); Files.deleteIfExists(dir); }
    }
}
