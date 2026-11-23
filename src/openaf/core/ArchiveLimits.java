package openaf.core;

import java.io.*;
import java.nio.file.*;
import java.util.Enumeration;
import java.util.zip.*;

import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.Undefined;

import openaf.AFCmdBase;
import openaf.JSEngine;

/** Operation-scoped decompression quotas configured by the JVM or trusted runtime code. */
public final class ArchiveLimits {
    private ArchiveLimits() {}

    public static final class LimitException extends IOException {
        public LimitException(String quota) { super("Archive quota exceeded: " + quota); }
    }

    private static Scriptable archiveFlags() {
        JSEngine engine = AFCmdBase.jse;
        if (engine == null || !(engine.getGlobalscope() instanceof Scriptable scope)) return null;
        if (!(scope.get("__flags", scope) instanceof Scriptable flags)) return null;
        return flags.get("ARCHIVE", flags) instanceof Scriptable archive ? archive : null;
    }

    private static long setting(Scriptable flags, String name, long fallback) {
        // JVM settings take precedence over runtime flags.
        String property = System.getProperty("openaf.archive." + name);
        if (property != null) {
            long value = Long.parseLong(property);
            if (value < 1 || value > Long.MAX_VALUE / 2) throw new IllegalArgumentException("Archive quota must be positive: " + name);
            return value;
        }

        // Accept positive, exactly representable JavaScript integers.
        Object flag = flags == null ? Scriptable.NOT_FOUND : flags.get(name, flags);
        if (flag == Scriptable.NOT_FOUND || Undefined.isUndefined(flag)) return fallback;
        if (flag instanceof Number number) {
            double value = number.doubleValue();
            if (value >= 1 && value <= 9_007_199_254_740_991L && value == Math.floor(value)) return (long) value;
        }
        throw new IllegalArgumentException("__flags.ARCHIVE." + name + " must be a positive safe integer");
    }

    public static final class Budget {
        final long input, entry, total, count, ratio;
        long entries, expanded, current;
        IOException failure;

        public Budget() {
            this(64L * 1024 * 1024);
        }

        private Budget(long defaultEntryBytes) {
            // Capture the configured limits when the archive operation starts.
            Scriptable flags = archiveFlags();
            input = setting(flags, "maxInputBytes", 256L * 1024 * 1024);
            entry = setting(flags, "maxEntryBytes", defaultEntryBytes);
            total = setting(flags, "maxTotalBytes", 256L * 1024 * 1024);
            count = setting(flags, "maxEntries", 100000);
            ratio = setting(flags, "maxRatio", 1000);
        }

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
        return new ZipStream(new Counted(source, new Budget()));
    }

    /** Remote oPacks stage expanded bytes on disk and have a larger default entry limit. */
    public static ZipStream opackZip(InputStream source) {
        return new ZipStream(new Counted(source, new Budget(128L * 1024 * 1024)));
    }

    public static final class ZipStream extends ZipInputStream {
        private final Counted counted;
        private final Budget budget;
        private boolean active, endOfEntries;
        private long entryLimit;

        private ZipStream(Counted counted) {
            super(counted);
            this.counted = counted;
            budget = counted.budget;
            entryLimit = budget.entry;
        }

        @Override public ZipEntry getNextEntry() throws IOException {
            budget.healthy();
            if (active) closeEntry();
            if (endOfEntries) return null;
            ZipEntry next = super.getNextEntry();
            if (next != null) {
                budget.next();
                entryLimit = budget.entry;
                active = true;
            } else {
                endOfEntries = true;
            }
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
                int n = super.read(b, off, (int) Math.min(len, Math.min(8192, entryLimit - budget.current + 1)));
                if (n > 0) {
                    budget.produced(n, counted.bytes);
                    if (budget.current > entryLimit) budget.fail("package manifest bytes");
                }
                return n;
            } catch (IOException e) {
                budget.failure = e;
                try { close(); } catch (IOException cleanup) { e.addSuppressed(cleanup); }
                throw e;
            }
        }

        @Override public long skip(long n) throws IOException { return skipByReading(this, n); }

        public void limitPackageManifest() {
            if (!active || budget.current != 0) throw new IllegalStateException("Manifest limit must be set before reading the entry");
            entryLimit = Math.min(budget.entry, 4L * 1024 * 1024);
        }

        public void finish() throws IOException {
            // ZIP readers stop at the central directory. Bytes already read ahead were counted.
            budget.healthy();
            if (!endOfEntries) throw new IOException("ZIP entries have not been fully read");
            counted.transferTo(OutputStream.nullOutputStream());
        }
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
