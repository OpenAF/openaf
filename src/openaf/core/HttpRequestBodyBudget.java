package openaf.core;

/** Shared admission budget for both bundled NanoHTTPD parsers. */
public final class HttpRequestBodyBudget {
    private HttpRequestBodyBudget() {}
    private static long reserved;

    private static long setting(String name, long fallback) {
        long value = Long.parseLong(System.getProperty("openaf.http.nano." + name, Long.toString(fallback)));
        if (value < 1 || value > Integer.MAX_VALUE) throw new IllegalArgumentException("Invalid NanoHTTPD quota: " + name);
        return value;
    }

    public static long maxBodyBytes() { return setting("maxBodyBytes", 8L * 1024 * 1024); }
    public static int maxMultipartParts() { return (int) setting("maxMultipartParts", 1024); }

    /** Reserve twice the body: raw spool plus extracted PUT/multipart copies. */
    public static synchronized Reservation acquire(long bytes) {
        if (bytes < 0 || bytes > maxBodyBytes()) throw new IllegalArgumentException("Invalid request body size");
        long amount = bytes * 2;
        long limit = setting("maxBufferedBytes", 128L * 1024 * 1024);
        if (amount > limit - reserved) return null;
        reserved += amount;
        return new Reservation(amount);
    }

    public static final class Reservation implements AutoCloseable {
        private final long amount;
        private boolean closed;
        private Reservation(long amount) { this.amount = amount; }
        @Override public void close() {
            synchronized (HttpRequestBodyBudget.class) {
                if (!closed) { reserved -= amount; closed = true; }
            }
        }
    }
}
