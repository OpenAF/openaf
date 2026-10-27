package openaf.core;

import java.io.FilterInputStream;
import java.io.FilterOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

import org.apache.commons.codec.binary.Base64OutputStream;
import org.apache.commons.io.IOUtils;
import org.mozilla.javascript.NativeJavaObject;

/** Shared bounded-memory conversions; the public JavaScript APIs live on af and io. */
public final class StreamConversions {
    private static final int BUFFER_SIZE = 64 * 1024;

    public enum Format { BASE64_ENCODE, BASE64_DECODE, GZIP, GUNZIP }

    private StreamConversions() { }

    private static InputStream leaveOpen(InputStream stream) {
        return new FilterInputStream(stream) {
            @Override
            public void close() { }
        };
    }

    private static OutputStream leaveOpen(OutputStream stream) {
        return new FilterOutputStream(stream) {
            @Override
            public void write(byte[] bytes, int offset, int length) throws IOException {
                out.write(bytes, offset, length);
            }

            @Override
            public void close() { }
        };
    }

    public static void convert(Object input, Object output, boolean shouldNotClose, Format format)
            throws IOException {
        if (input instanceof NativeJavaObject) input = ((NativeJavaObject) input).unwrap();
        if (output instanceof NativeJavaObject) output = ((NativeJavaObject) output).unwrap();
        if (!(input instanceof InputStream)) {
            throw new IllegalArgumentException("input must be a Java InputStream.");
        }
        if (!(output instanceof OutputStream)) {
            throw new IllegalArgumentException("output must be a Java OutputStream.");
        }

        // Validate first. Resources then own cleanup even when a converter constructor fails.
        try (InputStream source = shouldNotClose ? leaveOpen((InputStream) input) : (InputStream) input;
             OutputStream target = shouldNotClose ? leaveOpen((OutputStream) output) : (OutputStream) output) {
            byte[] buffer = new byte[BUFFER_SIZE];
            if (format == Format.GUNZIP) {
                try (InputStream decoded = new GZIPInputStream(leaveOpen(source), BUFFER_SIZE)) {
                    IOUtils.copyLarge(decoded, target, buffer);
                }
            } else {
                // Closing the converter finalizes padding/trailers but never closes target twice.
                try (OutputStream encoded = format == Format.GZIP
                        ? new GZIPOutputStream(leaveOpen(target), BUFFER_SIZE)
                        : new Base64OutputStream(leaveOpen(target), format == Format.BASE64_ENCODE, 0, null)) {
                    IOUtils.copyLarge(source, encoded, buffer);
                }
            }
            target.flush();
        }
    }
}
