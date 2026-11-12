package openaf.core;

import java.io.*;
import java.nio.file.*;
import java.util.Enumeration;
import java.util.zip.*;

/** Operation-scoped decompression quotas. Properties are trusted process configuration. */
public final class ArchiveLimits {
    private ArchiveLimits() {}

    public static final class LimitException extends IOException {
        public LimitException(String quota) { super("Archive quota exceeded: " + quota); }
    }

    private static long setting(String name, long fallback) {
        long value = Long.parseLong(System.getProperty("openaf.archive." + name, Long.toString(fallback)));
        if (value < 1 || value > Long.MAX_VALUE / 2) throw new IllegalArgumentException("Archive quota must be positive: " + name);
        return value;
    }

    public static final class Budget {
        final long input = setting("maxInputBytes", 256L * 1024 * 1024);
        final long entry = setting("maxEntryBytes", 64L * 1024 * 1024);
        final long total = setting("maxTotalBytes", 256L * 1024 * 1024);
        final long count = setting("maxEntries", 100000);
        final long ratio = setting("maxRatio", 1000);
        long entries, expanded, current;
        IOException failure;

        public void next() throws IOException {
            healthy();
            if (entries >= count) fail("entry count");
            entries++;
            current = 0;
        }

        void healthy() throws IOException { if (failure != null) throw failure; }
        void fail(String quota) throws IOException { failure = new LimitException(quota); throw failure; }
        void produced(long bytes, long compressed) throws IOException {
            healthy();
            if (bytes > entry - current) fail("expanded entry bytes");
            if (bytes > total - expanded) fail("expanded total bytes");
            current += bytes;
            expanded += bytes;
            // One MiB startup allowance avoids penalizing small, highly compressible files.
            if (expanded > 1024 * 1024 && (expanded - 1024 * 1024 - 1) / ratio >= compressed) fail("expansion ratio");
        }

        public void checkInput(long bytes) throws IOException {
            healthy();
            if (bytes > input) fail("compressed input bytes");
        }
    }

    private static final class Counted extends FilterInputStream {
        final Budget budget;
        long bytes;
        Counted(InputStream source, Budget budget) { super(source); this.budget = budget; }
        @Override public int read() throws IOException {
            budget.healthy();
            int result = in.read();
            if (result >= 0) { bytes++; budget.checkInput(bytes); }
            return result;
        }
        @Override public int read(byte[] b, int off, int len) throws IOException {
            budget.healthy();
            int n = in.read(b, off, (int) Math.min(len, Math.min(Integer.MAX_VALUE, budget.input - bytes + 1)));
            if (n > 0) { bytes += n; budget.checkInput(bytes); }
            return n;
        }
        @Override public long skip(long n) throws IOException { return skipByReading(this, n); }
        @Override public boolean markSupported() { return false; }
        @Override public void reset() throws IOException { throw new IOException("Archive stream cannot reset"); }
    }

    private static long skipByReading(InputStream in, long bytes) throws IOException {
        byte[] buffer = new byte[8192];
        long read = 0;
        while (read < bytes) {
            int n = in.read(buffer, 0, (int) Math.min(buffer.length, bytes - read));
            if (n < 0) break;
            read += n;
        }
        return read;
    }

    private static InputStream bounded(InputStream source, Budget budget, java.util.function.LongSupplier compressed, long declared) {
        return new FilterInputStream(source) {
            long bytes;
            @Override public int read() throws IOException {
                byte[] one = new byte[1];
                return read(one, 0, 1) < 0 ? -1 : one[0] & 255;
            }
            @Override public int read(byte[] b, int off, int len) throws IOException {
                budget.healthy();
                try {
                    int n = in.read(b, off, (int) Math.min(len, Math.min(8192, budget.entry - budget.current + 1)));
                    if (n > 0) {
                        if (declared >= 0 && n > declared - bytes) budget.fail("declared entry size");
                        budget.produced(n, compressed.getAsLong());
                        bytes += n;
                    }
                    return n;
                } catch (IOException e) {
                    budget.failure = e;
                    try { close(); } catch (IOException cleanup) { e.addSuppressed(cleanup); }
                    throw e;
                }
            }
            @Override public long skip(long n) throws IOException { return skipByReading(this, n); }
            @Override public boolean markSupported() { return false; }
            @Override public void reset() throws IOException { throw new IOException("Archive stream cannot reset"); }
        };
    }

    public static InputStream gunzip(InputStream source) throws IOException {
        Budget budget = new Budget();
        Counted counted = new Counted(source, budget);
        budget.next();
        return bounded(new GZIPInputStream(counted), budget, () -> counted.bytes, -1);
    }

    /** ZipInputStream overrides include implicit draining in getNextEntry/closeEntry. */
    public static ZipInputStream zip(InputStream source) throws IOException {
        Budget budget = new Budget();
        Counted counted = new Counted(source, budget);
        return new ZipInputStream(counted) {
            boolean active;
            @Override public ZipEntry getNextEntry() throws IOException {
                budget.healthy();
                if (active) closeEntry();
                ZipEntry next = super.getNextEntry();
                if (next != null) { budget.next(); active = true; }
                return next;
            }
            @Override public void closeEntry() throws IOException {
                budget.healthy();
                if (active) {
                    byte[] buffer = new byte[8192];
                    while (read(buffer) >= 0) {}
                    active = false;
                }
            }
            @Override public int read(byte[] b, int off, int len) throws IOException {
                budget.healthy();
                try {
                    int n = super.read(b, off, (int) Math.min(len, Math.min(8192, budget.entry - budget.current + 1)));
                    if (n > 0) budget.produced(n, counted.bytes);
                    return n;
                } catch (IOException e) {
                    budget.failure = e;
                    try { close(); } catch (IOException cleanup) { e.addSuppressed(cleanup); }
                    throw e;
                }
            }
            @Override public long skip(long n) throws IOException { return skipByReading(this, n); }
        };
    }

    /** Preflight the raw central directory before deduplication or entry extraction. */
    public static void checkZipFile(ZipFile file) throws IOException {
        Budget budget = new Budget();
        budget.checkInput(Files.size(Paths.get(file.getName())));
        Enumeration<? extends ZipEntry> entries = file.entries();
        long compressed = 0;
        while (entries.hasMoreElements()) {
            ZipEntry e = entries.nextElement();
            budget.next();
            if (e.getSize() < 0 || e.getCompressedSize() < 0) budget.fail("unknown entry size");
            if (e.getCompressedSize() > budget.input - compressed) budget.fail("compressed entry total");
            compressed += e.getCompressedSize();
            budget.produced(e.getSize(), compressed);
        }
    }

    public static InputStream compressor(InputStream source) throws org.apache.commons.compress.compressors.CompressorException, IOException {
        Budget budget = new Budget();
        Counted counted = new Counted(source, budget);
        InputStream decoded = new org.apache.commons.compress.compressors.CompressorStreamFactory(false, 65536)
                .createCompressorInputStream(new BufferedInputStream(counted));
        budget.next();
        InputStream limited = bounded(decoded, budget, () -> counted.bytes, -1);
        return new org.apache.commons.compress.compressors.CompressorInputStream() {
            @Override public int read(byte[] b, int off, int len) throws IOException { int n = limited.read(b, off, len); count(n); return n; }
            @Override public int read() throws IOException { int n = limited.read(); if (n >= 0) count(1); return n; }
            @Override public long skip(long n) throws IOException { return skipByReading(this, n); }
            @Override public void close() throws IOException { limited.close(); }
        };
    }

    public static org.apache.commons.compress.archivers.ArchiveInputStream<?> archive(InputStream source)
            throws org.apache.commons.compress.archivers.ArchiveException {
        Budget budget = new Budget();
        Counted counted = new Counted(source, budget);
        org.apache.commons.compress.archivers.ArchiveInputStream<?> raw =
                new org.apache.commons.compress.archivers.ArchiveStreamFactory().createArchiveInputStream(new BufferedInputStream(counted));
        return new org.apache.commons.compress.archivers.ArchiveInputStream<org.apache.commons.compress.archivers.ArchiveEntry>() {
            InputStream current;
            @Override public org.apache.commons.compress.archivers.ArchiveEntry getNextEntry() throws IOException {
                budget.healthy();
                if (current != null) { byte[] b = new byte[8192]; while (read(b) >= 0) {} }
                org.apache.commons.compress.archivers.ArchiveEntry e = raw.getNextEntry();
                if (e != null) {
                    budget.next();
                    current = bounded(raw, budget, () -> counted.bytes, -1);
                } else current = null;
                return e;
            }
            @Override public boolean canReadEntryData(org.apache.commons.compress.archivers.ArchiveEntry e) { return raw.canReadEntryData(e); }
            @Override public int read(byte[] b, int off, int len) throws IOException {
                budget.healthy();
                int n = current == null ? -1 : current.read(b, off, len);
                count(n);
                return n;
            }
            @Override public int read() throws IOException { byte[] b = new byte[1]; return read(b,0,1) < 0 ? -1 : b[0] & 255; }
            @Override public long skip(long n) throws IOException { return skipByReading(this, n); }
            @Override public void close() throws IOException { raw.close(); }
        };
    }

    public static void checkFile(String path) throws IOException { new Budget().checkInput(Files.size(Paths.get(path))); }

    public static InputStream entry(InputStream source, ZipEntry entry) throws IOException {
        Budget budget = new Budget();
        budget.next();
        return bounded(source, budget, () -> entry.getCompressedSize(), entry.getSize());
    }
}
