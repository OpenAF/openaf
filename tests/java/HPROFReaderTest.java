import openaf.HPROFReader;
import java.io.*;
import java.util.*;
import java.util.zip.GZIPOutputStream;

/** Run with: javac --release 8 -d /tmp/oom-tests src/openaf/HPROFReader.java tests/java/HPROFReaderTest.java */
public class HPROFReaderTest {
    static void check(boolean ok) { if (!ok) throw new AssertionError(); }
    static byte[] fixture(int ids) throws Exception {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream(); DataOutputStream d = new DataOutputStream(bytes);
        d.writeBytes("JAVA PROFILE 1.0.2"); d.writeByte(0); d.writeInt(ids); d.writeLong(1);
        d.writeByte(28); d.writeInt(0); d.writeInt(1+ids+4+4+1+12);
        d.writeByte(35); for(int i=0;i<ids;i++)d.writeByte(255); d.writeInt(0); d.writeInt(3); d.writeByte(10);d.writeInt(1);d.writeInt(2);d.writeInt(3);
        return bytes.toByteArray();
    }
    public static void main(String[] args) throws Exception {
        for(int ids:new int[]{4,8})for(boolean gzip:new boolean[]{false,true}){
            File f=File.createTempFile("hprof-test", ".hprof");
            try{
                try(OutputStream out=gzip?new GZIPOutputStream(new FileOutputStream(f)):new FileOutputStream(f)){out.write(fixture(ids));}
                final int[] seen={0};
                Map<String,Object> result=new HPROFReader().read(f.toString(),r->{seen[0]++;check(((List<?>)r.get("sample")).size()==2);check(r.get("id").equals(ids==8?"0xffffffffffffffff":"0xffffffff"));return false;},true,2,100);
                check(seen[0]==1);check(Boolean.TRUE.equals(result.get("stopped")));
                check(((Number)new HPROFReader().read(f.toString(),null,false,0,100).get("objects")).longValue()==1);
                try(FileOutputStream out=new FileOutputStream(f)){out.write(Arrays.copyOf(fixture(ids),fixture(ids).length-1));}
                try{new HPROFReader().read(f.toString(),null,false,0,100);throw new AssertionError("truncation accepted");}catch(IOException expected){check(expected.getMessage().contains("offset"));}
            }finally{f.delete();}
        }
        File large=File.createTempFile("hprof-large", ".hprof");
        try {
            byte[] base=fixture(8);
            try(DataOutputStream out=new DataOutputStream(new BufferedOutputStream(new FileOutputStream(large)))){
                out.write(base,0,31);
                for(int i=0;i<2000000;i++)out.write(base,31,base.length-31);
            }
            check(large.length()>32000000);
            check(((Number)new HPROFReader().read(large.toString(),null,false,0,100).get("objects")).longValue()==2000000);
        } finally { large.delete(); }
        System.out.println("HPROF fixtures passed");
    }
}
