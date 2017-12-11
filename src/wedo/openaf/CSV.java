package wedo.openaf;


import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;

/**
 * 
 * @author Nuno Aguiar
 *
 */
public class CSV extends ScriptableObject {

	/**
	 * 
	 */
	private static final long serialVersionUID = -7745871696050328345L;
	protected wedo.openaf.core.CSV csv;
	

	@Override
	public String getClassName() {
		return "CSV";
	}

	@JSFunction
	public void clear() {
	     csv.clear();
	}

	@JSFunction
	public void setSeparator(String sep) {
		csv.setSeparator(sep);
	}
	
	@JSFunction
	public void setStringDelimiter(String sdelim) {
		csv.setStringDelimiter(sdelim);
	}
	
	@JSConstructor
	public void newCSV(String csv) throws IOException {
		this.csv = new wedo.openaf.core.CSV(csv);
	}
	
	@JSFunction
	public void load(String aFile) throws IOException {
		csv.load(aFile);
	}
	
	@JSFunction
	public void fromCsv(String aCSVString) throws IOException {
		csv.fromCSV(aCSVString);
	}
	
	@JSFunction
	public void toCsv(NativeArray o, Object h) {
		ArrayList<HashMap<String, Object>> records = new ArrayList<HashMap<String ,Object>>();
		
		for (Object obj : o) {
			if (obj instanceof NativeObject) {
				HashMap<String, Object> record = new HashMap<String, Object>();
				for(Object key : ((NativeObject) obj).keySet()) {
					record.put((String) key, ((NativeObject) obj).get(key));
				}
				records.add(record);
			}
		}
		
		if (h == null || h instanceof Undefined)
			csv.toCsv(records, null);
		else
			csv.toCsv(records, ((NativeArray) h).toArray());
	}
	
	@JSFunction
	public void p(String s) {
	   csv.p(s);
	}
	
	@JSFunction
	public long writeFile(String aFile) throws IOException {
		return csv.writeFile(aFile);
	}
	
	@JSFunction
	public String w() throws IOException {
		return csv.w();
	}
	
	@JSFunction
	public long readFile(String aFile) throws IOException {
		return csv.readFile(aFile);
	}

	@JSFunction
	public Object csv()	{
		ArrayList<HashMap<String, Object>> al = csv.csv();
		ArrayList<Scriptable> records = new ArrayList<Scriptable>();
		
		for(HashMap<String, Object> alRecord : al) {
			Scriptable record = (Scriptable) AFCmdBase.jse.newObject(AFCmdBase.jse.getGlobalscope());
			
			for(String key : alRecord.keySet()) {
				record.put(key, record, alRecord.get(key));
			}
			
			records.add(record);
		}
		
		return AFCmdBase.jse.newArray(AFCmdBase.jse.getGlobalscope(), records.toArray());
	}	

}
 