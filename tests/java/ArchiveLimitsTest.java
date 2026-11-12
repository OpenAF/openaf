import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.zip.*;
import openaf.core.ArchiveLimits;
import openaf.plugins.ZIP;

/** Standalone regression: java -Xmx128m -cp 'bin:openaf.jar:lib/*' ArchiveLimitsTest. */
public class ArchiveLimitsTest {
    interface Action { void run() throws Exception; }
    static void check(boolean value, String message) { if (!value) throw new AssertionError(message); }
    static void reject(Action action) throws Exception {
        try { action.run(); throw new AssertionError("Archive quota was not enforced"); }
        catch (ArchiveLimits.LimitException expected) {}
    }
    static void setting(String key, long value, Action action) throws Exception {
        String name = "openaf.archive." + key, previous = System.getProperty(name);
        System.setProperty(name, Long.toString(value));
        try { action.run(); } finally { if (previous == null) System.clearProperty(name); else System.setProperty(name, previous); }
    }
    static byte[] archive(int entries, int size) throws IOException {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(bytes)) {
            for (int i = 0; i < entries; i++) {
                zip.putNextEntry(new ZipEntry("entry" + i)); zip.write(new byte[size]); zip.closeEntry();
            }
        }
        return bytes.toByteArray();
    }
    static byte[] gzip(int size) throws IOException {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        try (GZIPOutputStream gzip = new GZIPOutputStream(bytes)) { gzip.write(new byte[size]); }
        return bytes.toByteArray();
    }
    public static void main(String[] args) throws Exception {
        byte[] zipBytes = archive(2, 32), gzipBytes = gzip(32);
        ZIP zip = new ZIP();
        zip.load(zipBytes);
        check(((byte[]) zip.getFile("entry0")).length == 32, "ZIP control failed");
        check(((byte[]) ZIP.gunzip(gzipBytes)).length == 32, "GZIP control failed");
        check(((byte[]) openaf.core.IO.gunzip(gzipBytes)).length == 32, "IO GZIP control failed");
        setting("maxEntryBytes", 16, () -> {
            reject(() -> zip.load(zipBytes));
            check(((byte[]) zip.getFile("entry0")).length == 32, "Failed load destroyed previous archive");
            reject(() -> ZIP.gunzip(gzipBytes));
            reject(() -> openaf.core.IO.gunzip(gzipBytes));
            reject(() -> openaf.core.StreamConversions.convert(new ByteArrayInputStream(gzipBytes), new ByteArrayOutputStream(), false, openaf.core.StreamConversions.Format.GUNZIP));
        });
        setting("maxTotalBytes", 48, () -> reject(() -> new ZIP().load(zipBytes)));
        ByteArrayOutputStream members = new ByteArrayOutputStream();
        members.write(gzipBytes); members.write(gzipBytes);
        setting("maxTotalBytes", 48, () -> reject(() -> ZIP.gunzip(members.toByteArray())));
        setting("maxEntries", 1, () -> reject(() -> new ZIP().load(zipBytes)));
        setting("maxInputBytes", 8, () -> reject(() -> new ZIP().load(zipBytes)));
        setting("maxInputBytes", 8, () -> reject(() -> ZIP.gunzip(gzipBytes)));
        byte[] bomb = archive(1, 2 * 1024 * 1024), gzBomb = gzip(2 * 1024 * 1024);
        setting("maxRatio", 1, () -> {
            reject(() -> new ZIP().load(bomb));
            reject(() -> ZIP.gunzip(gzBomb));
        });
        // Implicit draining, skip and single-byte reads must share the budget.
        setting("maxEntryBytes", 16, () -> {
            try (ZipInputStream in = ArchiveLimits.zip(new ByteArrayInputStream(zipBytes))) {
                in.getNextEntry(); reject(in::getNextEntry); reject(in::getNextEntry);
            }
            try (InputStream in = ArchiveLimits.gunzip(new ByteArrayInputStream(gzipBytes))) { reject(() -> in.skip(32)); }
            try (InputStream in = ArchiveLimits.gunzip(new ByteArrayInputStream(gzipBytes))) { reject(() -> { while (in.read() >= 0) {} }); }
            try (InputStream in = (InputStream) new ZIP().getCompressInputStream(new ByteArrayInputStream(gzipBytes))) { reject(in::readAllBytes); }
            try (org.apache.commons.compress.archivers.ArchiveInputStream<?> in = (org.apache.commons.compress.archivers.ArchiveInputStream<?>) new ZIP().getArchiveInputStream(new ByteArrayInputStream(zipBytes))) {
                in.getNextEntry(); reject(in::getNextEntry);
            }
        });
        Path file = Files.createTempFile("archive-limits-", ".zip");
        try {
            Files.write(file, zipBytes);
            setting("maxTotalBytes", 48, () -> reject(() -> new ZIP().loadFile(file.toString())));
            setting("maxEntries", 1, () -> reject(() -> new ZIP().streamGetFile(file.toString(), "entry0")));
            setting("maxEntryBytes", 16, () -> reject(() -> new ZIP().streamGetFileStream(file.toString(), "entry0")));
            ZIP control = new ZIP(); control.loadFile(file.toString());
            try (InputStream in = (InputStream) control.streamGetFileStream(file.toString(), "entry0")) {
                check(in.readAllBytes().length == 32, "Stream control failed");
            }
            check(control.getFile("absent") == null, "Missing entry contract changed");
            control.close();
        } finally { zip.close(); Files.deleteIfExists(file); }
        System.out.println("ZIP/GZIP quotas and legitimate controls PASS");
    }
}
