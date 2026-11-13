import openaf.HPROFIndex;
import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.zip.GZIPOutputStream;

/** Deterministic ownership, String-layout, bounds and large-array tests; requires bundled H2. */
public class HPROFIndexTest {
    static void check(boolean ok, String message) { if (!ok) throw new AssertionError(message); }
    static class Fixture {
        final int ids;
        final ByteArrayOutputStream meta = new ByteArrayOutputStream(), heap = new ByteArrayOutputStream();
        final DataOutputStream m = new DataOutputStream(meta), h = new DataOutputStream(heap);
        final Map<String,Long> names = new HashMap<String,Long>();
        long next = 0x10000;
        Fixture(int width) { ids = width; }
        void id(DataOutputStream d, long value) throws Exception { if (ids == 8) d.writeLong(value); else d.writeInt((int)value); }
        long name(String text) throws Exception {
            if (names.containsKey(text)) return names.get(text);
            long n = next++; byte[] bytes = text.getBytes("UTF-8");
            m.writeByte(1); m.writeInt(0); m.writeInt(ids + bytes.length); id(m,n); m.write(bytes); names.put(text,n); return n;
        }
        void clazz(long c, String name, long parent, String[] fields, int[] types, String stat, int statType, long statValue) throws Exception {
            long nameId = name(name);
            m.writeByte(2); m.writeInt(0); m.writeInt(8 + 2 * ids); m.writeInt(1); id(m,c); m.writeInt(0); id(m,nameId);
            h.writeByte(32); id(h,c); h.writeInt(0); id(h,parent); for (int i=0;i<5;i++) id(h,0); h.writeInt(16); h.writeShort(0);
            h.writeShort(stat == null ? 0 : 1);
            if (stat != null) { id(h,name(stat)); h.writeByte(statType); if (statType == 2) id(h,statValue); else h.writeInt((int)statValue); }
            h.writeShort(fields.length);
            for (int i=0;i<fields.length;i++) { id(h,name(fields[i])); h.writeByte(types[i]); }
        }
        void instance(long id, long c, int[] types, long... values) throws Exception {
            ByteArrayOutputStream bytes = new ByteArrayOutputStream(); DataOutputStream d = new DataOutputStream(bytes);
            for (int i=0;i<types.length;i++) { if (types[i] == 2) id(d,values[i]); else if (types[i] == 8) d.writeByte((int)values[i]); else d.writeInt((int)values[i]); }
            h.writeByte(33); id(h,id); h.writeInt(0); id(h,c); h.writeInt(bytes.size()); h.write(bytes.toByteArray());
        }
        void array(long id, int size, long first, long last) throws Exception {
            h.writeByte(34); id(h,id); h.writeInt(0); h.writeInt(size); id(h,90);
            for (int i=0;i<size;i++) id(h,i==0?first:i==size-1?last:0);
        }
        void bytes(long id, byte[] bytes) throws Exception {
            h.writeByte(35); id(h,id); h.writeInt(0); h.writeInt(bytes.length); h.writeByte(8); h.write(bytes);
        }
        void chars(long id, String text) throws Exception {
            h.writeByte(35); id(h,id); h.writeInt(0); h.writeInt(text.length()); h.writeByte(5);
            for (char ch : text.toCharArray()) h.writeChar(ch);
        }
        void root(long id) throws Exception { h.writeByte(5); id(h,id); }
        void write(File file, boolean gzip) throws Exception {
            try (DataOutputStream out = new DataOutputStream(gzip ? new GZIPOutputStream(new FileOutputStream(file)) : new FileOutputStream(file))) {
                out.writeBytes("JAVA PROFILE 1.0.2"); out.writeByte(0); out.writeInt(ids); out.writeLong(1);
                out.write(meta.toByteArray()); out.writeByte(28); out.writeInt(0); out.writeInt(heap.size()); out.write(heap.toByteArray());
            }
        }
    }
    static Fixture fixture(int ids, int arraySize) throws Exception {
        Fixture f = new Fixture(ids);
        f.clazz(10,"TestNode",0,new String[]{"next","array"},new int[]{2,2},null,0,0);
        f.clazz(20,"java/lang/String",0,new String[]{"value","offset","count"},new int[]{2,10,10},null,0,0);
        f.clazz(21,"java/lang/String",0,new String[]{"value","coder"},new int[]{2,8},null,0,0);
        f.clazz(22,"java/lang/StringUTF16",0,new String[]{},new int[]{},"HI_BYTE_SHIFT",10,0);
        f.clazz(30,"java/lang/ref/Reference",0,new String[]{"referent"},new int[]{2},null,0,0);
        f.clazz(31,"java/lang/ref/WeakReference",30,new String[]{},new int[]{},null,0,0);
        f.clazz(32,"Shadow",30,new String[]{"referent"},new int[]{2},null,0,0);
        f.clazz(70,"Holder",0,new String[]{},new int[]{},"retained",2,5000);
        f.clazz(90,"[Ljava/lang/Object;",0,new String[]{},new int[]{},null,0,0);
        f.instance(1001,10,new int[]{2,2},0,2000); f.root(1001);
        f.instance(1002,10,new int[]{2,2},1002,0);
        f.array(2000,arraySize,1001,3000);
        f.instance(3000,21,new int[]{2,8},3001,1); f.bytes(3001,"AΩ🚀".getBytes("UTF-16LE"));
        f.instance(4000,31,new int[]{2},6000); f.root(4000);
        f.instance(5000,10,new int[]{2,2},0,0); f.root(70);
        f.instance(6000,21,new int[]{2,8},6001,0); f.bytes(6001,"café".getBytes("ISO-8859-1"));
        f.instance(7000,20,new int[]{2,10,10},7001,1,2); f.chars(7001,"xΩZy");
        f.instance(8000,32,new int[]{2,2},3000,6000); f.root(8000);
        return f;
    }
    @SuppressWarnings("unchecked")
    public static void main(String[] args) throws Exception {
        File root = Files.createTempDirectory("hprof-index-tests-").toFile();
        try {
            for (int ids : new int[]{4,8}) for (boolean gzip : new boolean[]{false,true}) {
                String suffix = ids + "-" + gzip;
                File source = new File(root,suffix + ".hprof"), directory = new File(root,suffix);
                fixture(ids,40).write(source,gzip);
                Map<String,Object> built = HPROFIndex.build(source.toString(),directory.toString(),10000000,1000,1000000);
                check(Boolean.TRUE.equals(built.get("complete")),"completed index");
                try { HPROFIndex.build(source.toString(),directory.toString(),10000000,1000,1000000); throw new AssertionError("overwrite allowed"); } catch (IOException expected) {}
                try (HPROFIndex index = new HPROFIndex(directory.toString())) {
                    Map<String,Object> text = (Map<String,Object>)index.object("0xBB8",0,4,100,null).get("string");
                    check("AΩ🚀".equals(text.get("value")),"compact UTF-16 from target byte order");
                    text = (Map<String,Object>)index.object("0x1770",0,4,100,null).get("string");
                    check("café".equals(text.get("value")),"Latin-1");
                    text = (Map<String,Object>)index.object("0x1b58",0,4,1,null).get("string");
                    check("Ω".equals(text.get("value")) && Boolean.TRUE.equals(text.get("truncated")),"legacy char offset/count and bounds");
                    check(((List<?>)index.object("0x1f40",0,4,100,null).get("fields")).size()==2,"shadowed fields preserved");
                    Map<String,Object> path = index.path("0xbb8",64,10000,10000,30000,false);
                    check(Boolean.TRUE.equals(path.get("found")),"strong path");
                    List<Map<String,Object>> refs = (List<Map<String,Object>>)index.references("0x7d0",false,0,100,false).get("references");
                    check(refs.stream().anyMatch(r -> "[39]".equals(r.get("label"))),"array tail beyond default sample");
                    check(Boolean.TRUE.equals(index.path("0x1388",64,10000,10000,30000,false).get("found")),"class static root");
                    // Shadow's inherited referent and WeakReference.referent must both be excluded.
                    check(Boolean.FALSE.equals(index.path("0x1770",64,10000,10000,30000,false).get("found")),"weak-only target excluded");
                    check(Boolean.TRUE.equals(index.path("0x1770",64,10000,10000,30000,true).get("found")),"explicit weak inclusion");
                    check(Boolean.FALSE.equals(index.path("0x3ea",64,10000,10000,30000,false).get("found")),"unrooted cycle terminates");
                    path = index.path("0xbb8",64,1,10000,30000,false);
                    check(Boolean.TRUE.equals(path.get("truncated")) && "maxVisited".equals(path.get("limitReached")),"visited limit explicit");
                    path = index.path("0xbb9",1,10000,10000,30000,false);
                    check(Boolean.TRUE.equals(path.get("truncated")) && "maxDepth".equals(path.get("limitReached")),"depth limit explicit");
                    path = index.path("0xbb8",64,10000,1,30000,false);
                    check(Boolean.TRUE.equals(path.get("truncated")) && "maxEdges".equals(path.get("limitReached")),"edge limit explicit");
                    Map<String,Object> found = index.find("java/lang/String","Ω",null,10,1000,100,null);
                    check(((List<?>)found.get("objects")).size()==2,"string search");
                    found = index.find("java/lang/String",null,null,1,1000,100,null);
                    check(found.get("nextCursor")!=null,"find pagination");
                    check(((List<?>)index.find("java/lang/String",null,(String)found.get("nextCursor"),10,1000,100,null).get("objects")).size()==4,"resume cursor");
                    Map<String,Object> tail = index.object("0x7d0",39,1,100,null);
                    check(((List<?>)tail.get("sample")).get(0).equals("0xbb8"),"seek array page");
                }
            }
            File large = new File(root,"large.hprof"); fixture(8,2000000).write(large,false);
            File directory = new File(root,"large-index");
            HPROFIndex.build(large.toString(),directory.toString(),100000000,1000,1000000);
            try (HPROFIndex index = new HPROFIndex(directory.toString())) {
                check(((List<?>)index.references("0x7d0",false,0,100,false).get("references")).stream().anyMatch(r -> "[1999999]".equals(((Map<?,?>)r).get("label"))),"large array tail indexed");
            }
            File capped = new File(root,"capped");
            try { HPROFIndex.build(large.toString(),capped.toString(),10,1000,1000); throw new AssertionError("decompression cap ignored"); } catch (IOException expected) { check(expected.getMessage().contains("maxDumpBytes"),"dump size cap"); }
            File broken = new File(root,"broken.hprof"); Files.write(broken.toPath(),new byte[]{1,2,3});
            File badIndex = new File(root,"incomplete");
            try { HPROFIndex.build(broken.toString(),badIndex.toString(),1000,1000,1000); throw new AssertionError("bad heap accepted"); } catch (IOException expected) {}
            try { new HPROFIndex(badIndex.toString()); throw new AssertionError("incomplete index accepted"); } catch (Exception expected) {}
            System.out.println("HPROF index fixtures passed");
        } finally {
            try (java.util.stream.Stream<Path> paths = Files.walk(root.toPath())) {
                paths.sorted(Comparator.reverseOrder()).forEach(p -> { try { Files.delete(p); } catch (IOException e) { throw new RuntimeException(e); } });
            }
        }
    }
}
