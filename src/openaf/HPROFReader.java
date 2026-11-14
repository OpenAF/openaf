package openaf;

import java.io.*;
import java.util.*;
import java.util.zip.GZIPInputStream;

/** Streaming HotSpot HPROF reader. No object graph is retained. Java 8 compatible. */
public final class HPROFReader {
    public interface Visitor {
        boolean visit(Map<String,Object> record);
    }

    // Store reader state and metadata
    private DataInputStream in;
    private long offset;
    private int ids;
    private final Map<String,String> strings = new HashMap<String,String>();
    private final Map<String,String> classes = new HashMap<String,String>();
    private final Map<String,List<Object[]>> fields = new HashMap<String,List<Object[]>>();
    private final Map<String,String> supers = new HashMap<String,String>();
    private int metadataLimit = 1000000;
    private long records, objects;
    private boolean stopped;

    // Read unsigned values
    private long u(int n) throws IOException {
        // Initialize the value
        long v = 0;

        // Read bytes in network order
        for (int i = 0; i < n; i++) {
            v = (v << 8) | in.readUnsignedByte();
            offset++;
        }

        // Return the decoded value
        return v;
    }

    private String id() throws IOException {
        return "0x"+Long.toHexString(u(ids));
    }

    // Skip record data
    private void skip(long n) throws IOException {
        if(n<0) fail("negative length");
        while(n>0) {
            long k=in.skip(n);
            if(k==0) {
                in.readByte();
                k=1;
            }
            offset+=k;
            n-=k;
        }
    }
    private void fail(String s) throws IOException {
        throw new IOException(s+" at HPROF offset "+offset);
    }
    private int size(int t) throws IOException {
        switch(t) {
            case 2:return ids;
            case 4:case 8:return 1;
            case 5:case 9:return 2;
            case 6:case 10:return 4;
            case 7:case 11:return 8;
            default:fail("invalid value type "+t);
            return 0;
        }
    }
    private Object value(int t) throws IOException {
        if(t==2)return id();
        long v=u(size(t));
        switch(t) {
            case 4:return v!=0;
            case 5:return String.valueOf((char)v);
            case 6:return Float.intBitsToFloat((int)v);
            case 7:return Double.longBitsToDouble(v);
            case 8:return (int)(byte)v;
            case 9:return (int)(short)v;
            case 10:return (int)v;
            default:return Long.toString(v);
        }
    }
    private Map<String,Object> row(String type) {
        Map<String,Object> r=new LinkedHashMap<String,Object>();
        r.put("type",type);
        r.put("offset",offset);
        return r;
    }
    private void checkMetadata() throws IOException {
        if((long)strings.size()+classes.size()+fields.size()>metadataLimit)fail("metadata limit exceeded");
    }
    private List<Object[]> layout(String c) throws IOException {
        List<Object[]> out=new ArrayList<Object[]>();
        Set<String> seen=new HashSet<String>();
        while(fields.containsKey(c)) {
            if(!seen.add(c))fail("cyclic class hierarchy");
            out.addAll(fields.get(c));
            c=supers.get(c);
        }
        return out;
    }
    public Map<String,Object> read(String file, Visitor visitor, boolean values, int arrayLimit, int maxMetadata) throws IOException {
        return read(file, visitor, values, arrayLimit, maxMetadata, 268435456L);
    }
    public Map<String,Object> read(String file, Visitor visitor, boolean values, int arrayLimit, int maxMetadata, long maxMetadataBytes) throws IOException {
        if(maxMetadataBytes<1)throw new IllegalArgumentException("Invalid metadata byte limit");
        long metadataBytes=0;
        if(arrayLimit<0||maxMetadata<1)throw new IllegalArgumentException("Invalid HPROF limits");
        metadataLimit=maxMetadata;
        Map<String,Object> result=new LinkedHashMap<String,Object>();
        Map<String,long[]> histogram=new TreeMap<String,long[]>();
        Map<String,Long> counts=new TreeMap<String,Long>();
        List<String> warnings=new ArrayList<String>();
        // First pass resolves names and inherited field layouts without retaining objects.
        for(int pass=0;pass<2;pass++) {
            offset=0;
            records=0;
            objects=0;
            InputStream raw=new BufferedInputStream(new FileInputStream(file));
            raw.mark(2);
            int a=raw.read(),b=raw.read();
            raw.reset();
            try(DataInputStream stream=new DataInputStream(a==31&&b==139?new GZIPInputStream(raw):raw)) {
                in=stream;
                StringBuilder header=new StringBuilder();
                int ch;
                while((ch=(int)u(1))!=0) {
                    if(header.length()>64)fail("invalid header");
                    header.append((char)ch);
                }
                if(!header.toString().matches("JAVA PROFILE 1\\.0\\.[12]"))fail("unsupported header");
                ids=(int)u(4);
                if(ids!=4&&ids!=8)fail("unsupported ID width");
                long timestamp=u(8);
                result.put("header",header.toString());
                result.put("identifierSize",ids);
                result.put("timestamp",Long.toString(timestamp));
                while(!stopped) {
                    int tag=in.read();
                    if(tag<0)break;
                    offset++;
                    u(4);
                    long len=u(4),end=offset+len;
                    if(end<offset)fail("record overflow");
                    if(tag==1&&pass==0) {
                        String key=id();
                        long n=end-offset;
                        if(n>16777216)fail("string too large");
                        metadataBytes+=n;
                        if(metadataBytes>maxMetadataBytes)fail("metadata string byte limit exceeded");
                        byte[] data=new byte[(int)n];
                        in.readFully(data);
                        offset+=n;
                        strings.put(key,new String(data,"UTF-8"));
                    }
                    else if(tag==2&&pass==0) {
                        u(4);
                        String c=id();
                        u(4);
                        classes.put(c,id());
                    }
                    else if(tag==12||tag==28) {
                        while(offset<end&&!stopped) {
                            int sub=(int)u(1);
                            Map<String,Object> r;
                            if(sub==32) {
                                r=row("class");
                                String c=id();
                                r.put("id",c);
                                u(4);
                                String parent=id();
                                Map<String,Object> classRefs=new LinkedHashMap<String,Object>();
                                classRefs.put("<super>",parent);
                                classRefs.put("<classLoader>",id());
                                classRefs.put("<signers>",id());
                                classRefs.put("<protectionDomain>",id());
                                skip(ids*2L);
                                r.put("classReferences",classRefs);
                                r.put("instanceSize",u(4));
                                int n=(int)u(2);
                                for(int j=0;j<n;j++) {
                                    long entry=u(2);
                                    int t=(int)u(1);
                                    Object v=value(t);
                                    if(t==2)classRefs.put("<constantPool:"+entry+">",v);
                                }
                                n=(int)u(2);
                                Map<String,Object> statics=new LinkedHashMap<String,Object>();
                                List<Map<String,Object>> staticDetails=new ArrayList<Map<String,Object>>();
                                for(int j=0;j<n;j++) {
                                    String name=id();
                                    int t=(int)u(1);
                                    Object v=value(t);
                                    if(pass==1&&values) {
                                        statics.put(strings.get(name),v);
                                        Map<String,Object> detail=new LinkedHashMap<String,Object>();
                                        detail.put("name",strings.get(name));
                                        detail.put("declaringClass",strings.get(classes.get(c)));
                                        detail.put("valueType",t);
                                        detail.put("value",v);
                                        staticDetails.add(detail);
                                    }
                                }
                                n=(int)u(2);
                                List<Object[]> fs=new ArrayList<Object[]>();
                                for(int j=0;j<n;j++)fs.add(new Object[] {
                                    id(),(int)u(1),c
                                }
                                );
                                if(pass==0) {
                                    fields.put(c,fs);
                                    supers.put(c,parent);
                                }
                                r.put("name",strings.get(classes.get(c)));
                                if(values) {
                                    r.put("statics",statics);
                                    r.put("staticDetails",staticDetails);
                                }
                            }
                            else if(sub==33) {
                                r=row("instance");
                                r.put("id",id());
                                u(4);
                                String c=id();
                                r.put("classId",c);
                                r.put("className",strings.get(classes.get(c)));
                                long n=u(4),stop=offset+n;
                                r.put("payloadBytes",n);
                                if(pass==1&&values) {
                                    Map<String,Object> vals=new LinkedHashMap<String,Object>();
                                    List<Map<String,Object>> details=new ArrayList<Map<String,Object>>();
                                    for(Object[] f:layout(c)) {
                                        String name=strings.get((String)f[0]);
                                        Object v=value((Integer)f[1]);
                                        vals.put((String)f[0]+":"+name,v);
                                        Map<String,Object> detail=new LinkedHashMap<String,Object>();
                                        detail.put("name",name);
                                        detail.put("declaringClass",strings.get(classes.get((String)f[2])));
                                        detail.put("valueType",f[1]);
                                        detail.put("value",v);
                                        details.add(detail);
                                        if(offset>stop)fail("field layout exceeds instance");
                                    }
                                    r.put("fields",vals);
                                    r.put("fieldDetails",details);
                                    r.put("unparsedFieldBytes",stop-offset);
                                }
                                skip(stop-offset);
                            }
                            else if(sub==34||sub==35) {
                                r=row(sub==34?"objectArray":"primitiveArray");
                                r.put("id",id());
                                u(4);
                                long n=u(4);
                                r.put("length",n);
                                int t=2;
                                if(sub==34) {
                                    String c=id();
                                    r.put("classId",c);
                                    r.put("className",strings.get(classes.get(c)));
                                }
                                else {
                                    t=(int)u(1);
                                    r.put("elementType",t);
                                }
                                r.put("dataOffset",offset);
                                long bytes=n*size(t);
                                r.put("payloadBytes",bytes);
                                int take=pass==1&&values?(int)Math.min(n,arrayLimit):0;
                                List<Object> sample=new ArrayList<Object>();
                                for(int j=0;j<take;j++)sample.add(value(t));
                                skip(bytes-(long)take*size(t));
                                if(values) {
                                    r.put("sample",sample);
                                    r.put("truncated",n>take);
                                }
                            }
                            else {
                                r=row("root");
                                r.put("rootKind",sub);
                                r.put("id",id());
                                switch(sub) {
                                    case 255:case 5:case 7:break;
                                    case 1:skip(ids);
                                    break;
                                    case 2:case 3:skip(8);
                                    break;
                                    case 4:case 6:skip(4);
                                    break;
                                    case 8:skip(8);
                                    break;
                                    default:fail("unsupported heap subrecord "+sub);
                                }
                            }
                            if(offset>end)fail("heap record exceeds boundary");
                            if(pass==1) {
                                records++;
                                String type=(String)r.get("type");
                                counts.put(type,counts.containsKey(type)?counts.get(type)+1:1);
                                if(type.equals("root")) {
                                    String root="root:"+r.get("rootKind");
                                    counts.put(root,counts.containsKey(root)?counts.get(root)+1:1);
                                }
                                if(r.containsKey("payloadBytes")) {
                                    objects++;
                                    String key=r.containsKey("className")?String.valueOf(r.get("className")):"primitive:"+r.get("elementType");
                                    long[] h=histogram.get(key);
                                    if(h==null) {
                                        h=new long[2];
                                        histogram.put(key,h);
                                    }
                                    h[0]++;
                                    h[1]+=((Number)r.get("payloadBytes")).longValue();
                                }
                                if(visitor!=null&&!visitor.visit(r))stopped=true;
                            }
                            if(pass==0)checkMetadata();
                        }
                    }
                    else if(pass==1&&tag!=1&&tag!=2&&tag!=44&&tag!=4&&tag!=5&&tag!=10&&tag!=14&&warnings.size()<100)warnings.add("Skipped top-level tag "+tag);
                    if(!stopped) {
                        if(offset>end)fail("record exceeds boundary");
                        skip(end-offset);
                    }
                    checkMetadata();
                }
            }
            catch(EOFException e) {
                throw new IOException("Truncated HPROF at offset "+offset,e);
            }
        }
        List<Map<String,Object>> rows=new ArrayList<Map<String,Object>>();
        for(Map.Entry<String,long[]> e:histogram.entrySet()) {
            Map<String,Object> r=row("histogram");
            r.remove("offset");
            r.put("className",e.getKey());
            r.put("count",e.getValue()[0]);
            r.put("payloadBytes",e.getValue()[1]);
            rows.add(r);
        }
        result.put("histogram",rows);
        result.put("counts",counts);
        result.put("records",records);
        result.put("objects",objects);
        result.put("stopped",stopped);
        result.put("warnings",warnings);
        return result;
    }
}
