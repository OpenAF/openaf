package openaf;

import java.io.*;
import java.nio.file.*;
import java.security.MessageDigest;
import java.sql.*;
import java.util.*;
import java.util.zip.GZIPInputStream;

/** Disk-backed HPROF ownership queries. H2 is already bundled with OpenAF. */
public final class HPROFIndex implements AutoCloseable {
    private final Connection db;
    private final File directory;
    private final RandomAccessFile heap;
    private final int ids;

    private static Map<String,Object> map(Object... pairs) {
        Map<String,Object> result = new LinkedHashMap<String,Object>();
        for (int i = 0; i < pairs.length; i += 2) result.put((String)pairs[i], pairs[i + 1]);
        return result;
    }

    private static String id(Object value) {
        String text = String.valueOf(value);
        if (!text.matches("0[xX][0-9a-fA-F]{1,16}")) throw new IllegalArgumentException("Expected a hexadecimal HPROF object ID");
        return "0x" + Long.toHexString(Long.parseUnsignedLong(text.substring(2), 16));
    }

    private static Connection connect(File dir, boolean existing) throws Exception {
        String path = new File(dir, "graph").getCanonicalPath();
        if (path.indexOf(';') >= 0) throw new IllegalArgumentException("Index path cannot contain a semicolon");
        Class.forName("org.h2.Driver");
        return DriverManager.getConnection("jdbc:h2:file:" + path + ";CACHE_SIZE=8192;MAX_MEMORY_ROWS=1024;MAX_MEMORY_UNDO=1024;DB_CLOSE_ON_EXIT=FALSE;LAZY_QUERY_EXECUTION=TRUE" + (existing ? ";IFEXISTS=TRUE" : ""), "sa", "");
    }

    // An index is queryable only after its transaction and completion marker are durable.
    public HPROFIndex(String dir) throws Exception {
        directory = new File(dir).getCanonicalFile();
        Connection opened = connect(directory, true);
        RandomAccessFile input = null;
        try {
            try (Statement s = opened.createStatement(); ResultSet r = s.executeQuery("SELECT value_text FROM index_meta WHERE meta_key='complete'")) {
                if (!r.next() || !"true".equals(r.getString(1))) throw new IOException("Incomplete HPROF index");
            }
            try (Statement s = opened.createStatement(); ResultSet r = s.executeQuery("SELECT value_text FROM index_meta WHERE meta_key='schemaVersion'")) {
                if (!r.next() || !"1".equals(r.getString(1))) throw new IOException("Unsupported HPROF index version");
            }
            input = new RandomAccessFile(new File(directory, "heap.hprof"), "r");
            input.seek(19);
            ids = input.readInt();
            if (ids != 4 && ids != 8) throw new IOException("Invalid indexed heap ID width");
            db = opened;
            heap = input;
        } catch (Exception e) {
            if (input != null) input.close();
            opened.close();
            throw e;
        }
    }

    private static void metadata(Connection c, String key, String value) throws SQLException {
        try (PreparedStatement p = c.prepareStatement("INSERT INTO index_meta VALUES(?,?)")) {
            p.setString(1, key); p.setString(2, value); p.executeUpdate();
        }
    }

    // Keep a self-contained seekable copy, with a hash of the decompressed bytes.
    private static String copyHeap(String file, File target, long maxBytes) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (BufferedInputStream source = new BufferedInputStream(new FileInputStream(file))) {
            source.mark(2);
            boolean gzip = source.read() == 31 && source.read() == 139;
            source.reset();
            try (InputStream input = gzip ? new GZIPInputStream(source) : source;
                 OutputStream output = new BufferedOutputStream(new FileOutputStream(target))) {
                byte[] buffer = new byte[65536];
                long total = 0;
                int n;
                while ((n = input.read(buffer)) != -1) {
                    if (total > maxBytes - n) throw new IOException("Decompressed heap exceeds maxDumpBytes");
                    total += n;
                    digest.update(buffer, 0, n);
                    output.write(buffer, 0, n);
                }
            }
        }
        StringBuilder hex = new StringBuilder();
        for (byte b : digest.digest()) hex.append(String.format("%02x", b & 255));
        return hex.toString();
    }

    // Batched inserts and H2's disk-backed sorting bound heap use independently of graph size.
    public static Map<String,Object> build(String file, String dir, long maxDumpBytes, int maxMetadata, long maxMetadataBytes) throws Exception {
        if (maxDumpBytes < 1) throw new IllegalArgumentException("Invalid maxDumpBytes");
        File directory = new File(dir).getCanonicalFile();
        if (directory.exists() || !directory.mkdirs()) throw new IOException("Index destination must be a new directory");
        String hash = copyHeap(file, new File(directory, "heap.hprof"), maxDumpBytes);
        try (Connection c = connect(directory, false); RandomAccessFile raw = new RandomAccessFile(new File(directory, "heap.hprof"), "r")) {
            try (Statement s = c.createStatement()) {
                s.execute("CREATE TABLE index_meta(meta_key VARCHAR PRIMARY KEY,value_text VARCHAR)");
                s.execute("CREATE TABLE objects(obj_id VARCHAR(18) PRIMARY KEY,node_kind VARCHAR,class_id VARCHAR(18),class_name VARCHAR,data_offset BIGINT,array_length BIGINT,element_type INT)");
                s.execute("CREATE TABLE object_fields(owner_id VARCHAR(18),ordinal INT,field_name VARCHAR,declaring_class VARCHAR,value_type INT,value_text VARCHAR,PRIMARY KEY(owner_id,ordinal))");
                s.execute("CREATE TABLE roots(obj_id VARCHAR(18),root_kind INT)");
                s.execute("CREATE TABLE edges(src VARCHAR(18),dst VARCHAR(18),edge_label VARCHAR,weak_edge BOOLEAN)");
            }
            c.setAutoCommit(false);
            final long[] counts = {0, 0, 0};
            raw.seek(19);
            final int ids = raw.readInt();
            try (PreparedStatement nodes = c.prepareStatement("INSERT INTO objects VALUES(?,?,?,?,?,?,?)");
                 PreparedStatement fields = c.prepareStatement("INSERT INTO object_fields VALUES(?,?,?,?,?,?)");
                 PreparedStatement roots = c.prepareStatement("INSERT INTO roots VALUES(?,?)");
                 PreparedStatement edges = c.prepareStatement("INSERT INTO edges VALUES(?,?,?,?)")) {
                class Writer {
                    int pending;
                    void edge(String from, Object target, String label, boolean weak) throws SQLException {
                        String to = id(target);
                        if ("0x0".equals(to)) return;
                        edges.setString(1, from); edges.setString(2, to); edges.setString(3, label); edges.setBoolean(4, weak);
                        edges.addBatch(); counts[1]++;
                        if (++pending >= 512) flush();
                    }
                    void flush() throws SQLException {
                        nodes.executeBatch(); fields.executeBatch(); roots.executeBatch(); edges.executeBatch();
                        c.commit(); pending = 0;
                    }
                    @SuppressWarnings("unchecked")
                    void accept(Map<String,Object> r) throws Exception {
                        String kind = (String)r.get("type"), owner = id(r.get("id"));
                        if (number(r.get("unparsedFieldBytes"), 0) != 0) throw new IOException("Unresolved instance field layout for " + owner);
                        if ("root".equals(kind)) {
                            roots.setString(1, owner); roots.setInt(2, ((Number)r.get("rootKind")).intValue()); roots.addBatch(); counts[2]++;
                        } else {
                            nodes.setString(1, owner); nodes.setString(2, kind); nodes.setString(3, (String)r.get("classId"));
                            nodes.setString(4, (String)("class".equals(kind) ? r.get("name") : r.get("className")));
                            nodes.setLong(5, number(r.get("dataOffset"), 0)); nodes.setLong(6, number(r.get("length"), 0)); nodes.setInt(7, (int)number(r.get("elementType"), 0));
                            nodes.addBatch(); counts[0]++;
                            if (r.get("classId") != null) edge(owner, r.get("classId"), "<class>", false);
                            Map<String,Object> classRefs = (Map<String,Object>)r.get("classReferences");
                            if (classRefs != null) for (Map.Entry<String,Object> e : classRefs.entrySet()) edge(owner, e.getValue(), e.getKey(), false);
                            List<Map<String,Object>> details = (List<Map<String,Object>>)r.get("class".equals(kind) ? "staticDetails" : "fieldDetails");
                            if (details != null) {
                                int ordinal = 0;
                                for (Map<String,Object> f : details) {
                                    int type = ((Number)f.get("valueType")).intValue();
                                    String name = String.valueOf(f.get("name")), declaring = String.valueOf(f.get("declaringClass"));
                                    Object value = f.get("value");
                                    fields.setString(1, owner); fields.setInt(2, ordinal++); fields.setString(3, name); fields.setString(4, declaring); fields.setInt(5, type); fields.setString(6, String.valueOf(value)); fields.addBatch();
                                    if (type == 2) edge(owner, value, declaring + "." + name, "java/lang/ref/Reference".equals(declaring) && "referent".equals(name));
                                    if (++pending >= 512) flush();
                                }
                            }
                            if ("objectArray".equals(kind)) {
                                raw.seek(((Number)r.get("dataOffset")).longValue());
                                long length = ((Number)r.get("length")).longValue();
                                for (long i = 0; i < length; i++) {
                                    long value = ids == 8 ? raw.readLong() : raw.readInt() & 0xffffffffL;
                                    edge(owner, "0x" + Long.toHexString(value), "[" + i + "]", false);
                                }
                            }
                        }
                        if (++pending >= 512) flush();
                    }
                }
                final Writer writer = new Writer();
                new HPROFReader().read(new File(directory, "heap.hprof").toString(), r -> {
                    try { writer.accept(r); return true; }
                    catch (Exception e) { throw new IndexFailure(e); }
                }, true, 0, maxMetadata, maxMetadataBytes);
                writer.flush();
            } catch (IndexFailure e) { throw e.problem; }
            try (Statement s = c.createStatement()) {
                s.execute("CREATE INDEX incoming_edges ON edges(dst)");
                s.execute("CREATE INDEX outgoing_edges ON edges(src)");
                s.execute("CREATE INDEX root_objects ON roots(obj_id)");
                s.execute("CREATE INDEX object_classes ON objects(class_name,obj_id)");
            }
            metadata(c, "schemaVersion", "1"); metadata(c, "sha256", hash); metadata(c, "complete", "true");
            c.commit();
            return map("schemaVersion", 1, "directory", directory.toString(), "complete", true, "objects", counts[0], "references", counts[1], "roots", counts[2], "sha256", hash);
        }
    }

    private static class IndexFailure extends RuntimeException {
        final Exception problem;
        IndexFailure(Exception e) { super(e); problem = e; }
    }

    private static long number(Object n, long fallback) { return n == null ? fallback : ((Number)n).longValue(); }

    private static int limit(int value, int max, String name) {
        if (value < 1 || value > max) throw new IllegalArgumentException("Invalid " + name);
        return value;
    }

    private Map<String,Object> node(String objectId) throws SQLException {
        try (PreparedStatement p = db.prepareStatement("SELECT * FROM objects WHERE obj_id=?")) {
            p.setString(1, objectId);
            try (ResultSet r = p.executeQuery()) {
                if (!r.next()) return map("id", objectId, "missing", true);
                return map("id", objectId, "type", r.getString("node_kind"), "classId", r.getString("class_id"), "className", r.getString("class_name"), "dataOffset", r.getLong("data_offset"), "length", r.getLong("array_length"), "elementType", r.getInt("element_type"));
            }
        }
    }

    private List<Map<String,Object>> fields(String objectId) throws SQLException {
        List<Map<String,Object>> result = new ArrayList<Map<String,Object>>();
        try (PreparedStatement p = db.prepareStatement("SELECT * FROM object_fields WHERE owner_id=? ORDER BY ordinal")) {
            p.setString(1, objectId);
            try (ResultSet r = p.executeQuery()) {
                while (r.next()) result.add(map("name", r.getString("field_name"), "declaringClass", r.getString("declaring_class"), "valueType", r.getInt("value_type"), "value", r.getString("value_text")));
            }
        }
        return result;
    }

    private String field(List<Map<String,Object>> fields, String name) {
        for (Map<String,Object> f : fields) if (name.equals(f.get("name"))) return (String)f.get("value");
        return null;
    }

    // String layout and byte order come from the dump, never from the collector's JVM.
    private Map<String,Object> string(String objectId, int maxChars, String byteOrder) throws Exception {
        List<Map<String,Object>> f = fields(objectId);
        String value = field(f, "value");
        if (value == null) return map("decoded", false, "reason", "String backing array unavailable");
        Map<String,Object> array = node(id(value));
        if (!"primitiveArray".equals(array.get("type"))) return map("decoded", false, "reason", "String backing array missing");
        int element = ((Number)array.get("elementType")).intValue();
        long length = ((Number)array.get("length")).longValue(), offset = 0, chars;
        String coder = field(f, "coder");
        boolean utf16 = element == 8 && "1".equals(coder);
        if (element != 5 && !(element == 8 && ("0".equals(coder) || utf16))) return map("decoded", false, "reason", "Unsupported String layout or coder");
        if (element == 5) {
            String off = field(f, "offset"), count = field(f, "count");
            offset = off == null ? 0 : Long.parseLong(off);
            chars = count == null ? length - offset : Long.parseLong(count);
        } else {
            if (utf16 && length % 2 != 0) return map("decoded", false, "reason", "Odd UTF-16 backing length");
            chars = utf16 ? length / 2 : length;
        }
        if (offset < 0 || chars < 0 || offset > length || chars > length - offset) return map("decoded", false, "reason", "Invalid String slice");
        boolean little = false;
        if (utf16) {
            if (byteOrder != null && !"little".equals(byteOrder) && !"big".equals(byteOrder)) throw new IllegalArgumentException("utf16ByteOrder must be little or big");
            if (byteOrder == null) {
                try (Statement s = db.createStatement(); ResultSet r = s.executeQuery("SELECT f.value_text FROM object_fields f JOIN objects o ON o.obj_id=f.owner_id WHERE o.class_name='java/lang/StringUTF16' AND f.field_name='HI_BYTE_SHIFT' LIMIT 1")) {
                    if (r.next()) byteOrder = "0".equals(r.getString(1)) ? "little" : "8".equals(r.getString(1)) ? "big" : null;
                }
            }
            if (byteOrder == null) return map("decoded", false, "reason", "UTF-16 byte order unavailable; set utf16ByteOrder explicitly");
            little = "little".equals(byteOrder);
        }
        int take = (int)Math.min(chars, maxChars);
        heap.seek(((Number)array.get("dataOffset")).longValue() + offset * (element == 5 ? 2 : 1));
        StringBuilder out = new StringBuilder(take);
        for (int i = 0; i < take; i++) {
            int a = heap.readUnsignedByte();
            if (element == 5 || utf16) {
                int b = heap.readUnsignedByte();
                out.append((char)(little ? a | b << 8 : a << 8 | b));
            } else out.append((char)a);
        }
        return map("decoded", true, "value", out.toString(), "length", chars, "truncated", chars > take);
    }

    // Arrays and strings are bounded; object references remain IDs for deliberate follow-up.
    public Map<String,Object> object(String objectId, long arrayOffset, int arrayLimit, int stringLimit, String byteOrder) throws Exception {
        objectId = id(objectId);
        if (arrayOffset < 0) throw new IllegalArgumentException("Invalid arrayOffset");
        limit(arrayLimit, 100000, "arrayLimit"); limit(stringLimit, 1000000, "stringLimit");
        Map<String,Object> result = node(objectId);
        if (Boolean.TRUE.equals(result.get("missing"))) return result;
        result.put("fields", fields(objectId));
        if ("java/lang/String".equals(result.get("className"))) result.put("string", string(objectId, stringLimit, byteOrder));
        String type = (String)result.get("type");
        if ("objectArray".equals(type) || "primitiveArray".equals(type)) {
            long length = ((Number)result.get("length")).longValue();
            int element = "objectArray".equals(type) ? 2 : ((Number)result.get("elementType")).intValue();
            int width = element == 2 ? ids : element == 4 || element == 8 ? 1 : element == 5 || element == 9 ? 2 : element == 6 || element == 10 ? 4 : 8;
            long start = Math.min(arrayOffset, length), take = Math.min(arrayLimit, length - start);
            heap.seek(((Number)result.get("dataOffset")).longValue() + start * width);
            List<Object> values = new ArrayList<Object>();
            for (long i = 0; i < take; i++) {
                switch (element) {
                    case 2: values.add("0x" + Long.toHexString(ids == 8 ? heap.readLong() : heap.readInt() & 0xffffffffL)); break;
                    case 4: values.add(heap.readBoolean()); break;
                    case 5: values.add(String.valueOf(heap.readChar())); break;
                    case 6: values.add(heap.readFloat()); break;
                    case 7: values.add(heap.readDouble()); break;
                    case 8: values.add(heap.readByte()); break;
                    case 9: values.add(heap.readShort()); break;
                    case 10: values.add(heap.readInt()); break;
                    case 11: values.add(Long.toString(heap.readLong())); break;
                    default: throw new IOException("Invalid indexed element type");
                }
            }
            result.put("sample", values); result.put("arrayOffset", start); result.put("truncated", start + take < length);
        }
        return result;
    }

    // Search scans indexed rows in stable ID order and returns a resume cursor.
    public Map<String,Object> find(String className, String contains, String afterId, int count, int maxScanned, int stringLimit, String byteOrder) throws Exception {
        limit(count, 10000, "limit"); limit(maxScanned, 10000000, "maxScanned"); limit(stringLimit, 1000000, "stringLimit");
        String sql = "SELECT obj_id FROM objects WHERE obj_id>?" + (className == null ? "" : " AND class_name=?") + " ORDER BY obj_id LIMIT ?";
        List<Map<String,Object>> rows = new ArrayList<Map<String,Object>>();
        long scanned = 0, undecoded = 0, partial = 0;
        String cursor = afterId == null ? "" : id(afterId);
        boolean exhausted = false;
        try (PreparedStatement p = db.prepareStatement(sql)) {
            int i = 1; p.setString(i++, cursor); if (className != null) p.setString(i++, className); p.setInt(i, maxScanned + 1);
            try (ResultSet r = p.executeQuery()) {
                while (rows.size() < count && scanned < maxScanned) {
                    if (!r.next()) { exhausted = true; break; }
                    cursor = r.getString(1); scanned++;
                    Map<String,Object> row = node(cursor);
                    if (contains != null) {
                        if (!"instance".equals(row.get("type")) || !"java/lang/String".equals(row.get("className"))) continue;
                        Map<String,Object> text = string(cursor, stringLimit, byteOrder);
                        if (Boolean.TRUE.equals(text.get("truncated"))) partial++;
                        if (!Boolean.TRUE.equals(text.get("decoded"))) { undecoded++; continue; }
                        if (!String.valueOf(text.get("value")).contains(contains)) continue;
                        row.put("string", text);
                    }
                    rows.add(row);
                }
                if (!exhausted && !r.next()) exhausted = true;
            }
        }
        return map("objects", rows, "scanned", scanned, "undecodedStrings", undecoded, "partialStrings", partial, "nextCursor", exhausted ? null : cursor, "exhausted", exhausted);
    }

    // Both directions use indexes; pagination never expands the whole adjacency list.
    public Map<String,Object> references(String objectId, boolean incoming, long offset, int count, boolean includeWeak) throws Exception {
        objectId = id(objectId); limit(count, 10000, "limit");
        if (offset < 0) throw new IllegalArgumentException("Invalid offset");
        List<Map<String,Object>> rows = new ArrayList<Map<String,Object>>();
        String sql = "SELECT * FROM edges WHERE " + (incoming ? "dst" : "src") + "=?" + (includeWeak ? "" : " AND weak_edge=FALSE") + " ORDER BY src,dst,edge_label LIMIT ? OFFSET ?";
        boolean more;
        try (PreparedStatement p = db.prepareStatement(sql)) {
            p.setString(1, objectId); p.setInt(2, count + 1); p.setLong(3, offset);
            try (ResultSet r = p.executeQuery()) {
                while (rows.size() < count && r.next()) rows.add(map("from", r.getString("src"), "to", r.getString("dst"), "label", r.getString("edge_label"), "weak", r.getBoolean("weak_edge")));
                more = r.next();
            }
        }
        return map("references", rows, "nextOffset", more ? offset + rows.size() : null, "includeWeak", includeWeak);
    }

    // Reverse breadth-first traversal uses a separate disk-backed visited table and queue.
    public Map<String,Object> path(String objectId, int maxDepth, int maxVisited, long maxEdges, long timeoutMs, boolean includeWeak) throws Exception {
        objectId = id(objectId); limit(maxDepth, 10000, "maxDepth"); limit(maxVisited, 10000000, "maxVisited");
        if (maxEdges < 1 || timeoutMs < 1) throw new IllegalArgumentException("Invalid traversal limits");
        File scratch = Files.createTempDirectory("hprof-path-").toFile();
        long visited = 1, examined = 0, sequence = 0, deadline = System.nanoTime() + Math.min(timeoutMs, 86400000L) * 1000000;
        String stop = null, found = null;
        boolean depthLimited = false;
        List<Map<String,Object>> segments = new ArrayList<Map<String,Object>>();
        Integer rootKind = null;
        try (Connection work = connect(scratch, false)) {
            work.setAutoCommit(false);
            try (Statement s = work.createStatement()) { s.execute("CREATE TABLE queue(seq BIGINT GENERATED ALWAYS AS IDENTITY,obj_id VARCHAR(18) PRIMARY KEY,child_id VARCHAR(18),edge_label VARCHAR,weak_edge BOOLEAN,depth INT)"); }
            try (PreparedStatement add = work.prepareStatement("INSERT INTO queue(obj_id,child_id,edge_label,weak_edge,depth) VALUES(?,?,?,?,?)");
                 PreparedStatement next = work.prepareStatement("SELECT * FROM queue WHERE seq>? ORDER BY seq LIMIT 1");
                 PreparedStatement seen = work.prepareStatement("SELECT 1 FROM queue WHERE obj_id=?");
                 PreparedStatement roots = db.prepareStatement("SELECT root_kind FROM roots WHERE obj_id=? LIMIT 1");
                 PreparedStatement parents = db.prepareStatement("SELECT src,edge_label,weak_edge FROM edges WHERE dst=?" + (includeWeak ? "" : " AND weak_edge=FALSE"));
                 PreparedStatement child = work.prepareStatement("SELECT * FROM queue WHERE obj_id=?")) {
                add.setString(1, objectId); add.setString(2, null); add.setString(3, null); add.setBoolean(4, false); add.setInt(5, 0); add.executeUpdate();
                search: while (true) {
                    if (System.nanoTime() >= deadline) { stop = "timeoutMs"; break; }
                    next.setLong(1, sequence);
                    String current; int depth;
                    try (ResultSet r = next.executeQuery()) {
                        if (!r.next()) break;
                        current = r.getString("obj_id"); depth = r.getInt("depth"); sequence = r.getLong("seq");
                    }
                    roots.setString(1, current);
                    try (ResultSet r = roots.executeQuery()) { if (r.next()) { found = current; rootKind = r.getInt(1); break; } }
                    if (depth >= maxDepth) { depthLimited = true; continue; }
                    parents.setString(1, current);
                    try (ResultSet r = parents.executeQuery()) {
                        while (r.next()) {
                            if (System.nanoTime() >= deadline) { stop = "timeoutMs"; break search; }
                            if (examined >= maxEdges) { stop = "maxEdges"; break search; }
                            examined++;
                            String parent = r.getString(1);
                            seen.setString(1, parent);
                            try (ResultSet old = seen.executeQuery()) { if (old.next()) continue; }
                            if (visited >= maxVisited) { stop = "maxVisited"; break search; }
                            add.setString(1, parent); add.setString(2, current); add.setString(3, r.getString(2)); add.setBoolean(4, r.getBoolean(3)); add.setInt(5, depth + 1); add.executeUpdate(); visited++;
                            if (visited % 512 == 0) work.commit();
                        }
                    }
                }
                if (found != null) {
                    String current = found;
                    while (!current.equals(objectId)) {
                        child.setString(1, current);
                        try (ResultSet r = child.executeQuery()) {
                            if (!r.next()) throw new IOException("Broken traversal queue");
                            String to = r.getString("child_id");
                            segments.add(map("from", current, "to", to, "label", r.getString("edge_label"), "weak", r.getBoolean("weak_edge")));
                            current = to;
                        }
                    }
                }
            }
            work.commit();
        } finally {
            File[] files = scratch.listFiles();
            if (files != null) for (File f : files) Files.deleteIfExists(f.toPath());
            Files.deleteIfExists(scratch.toPath());
        }
        if (found == null && stop == null && depthLimited) stop = "maxDepth";
        return map("target", objectId, "found", found != null, "root", found == null ? null : node(found), "rootKind", rootKind,
            "path", segments, "visited", visited, "examinedEdges", examined, "truncated", stop != null, "limitReached", stop, "includeWeak", includeWeak,
            "meaning", "One shortest reference path from an HPROF GC root; not a dominator or retained-size calculation");
    }

    public void close() throws Exception {
        try { heap.close(); } finally { db.close(); }
    }
}
