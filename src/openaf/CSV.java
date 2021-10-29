package openaf;


import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.lang.String;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.csv.CSVRecord;
import org.apache.commons.csv.QuoteMode;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.NativeFunction;
import org.mozilla.javascript.NativeJavaObject;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;

import openaf.JSEngine.JSMap;

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
	protected openaf.core.CSV csv;
	protected CSVFormat csvFormat = CSVFormat.DEFAULT.withQuoteMode(QuoteMode.NON_NUMERIC);
	protected Map<String, Integer> heads = null;

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
		this.csv = new openaf.core.CSV(csv);
	}
	
	@JSFunction
	public void load(String aFile) throws IOException {
		csv.load(aFile);
	}

	@JSFunction
	public Object getStreamFormat() {
		return this.csvFormat;
	}

	@JSFunction
	public void setStreamFormat(Object objs) {
		if (objs instanceof NativeJavaObject) {
			this.csvFormat = (CSVFormat) ((NativeJavaObject) objs).unwrap();
		}

		if (objs instanceof NativeObject) {
			NativeObject obj = (NativeObject) objs;
			JSEngine.JSMap jsMap = AFCmdBase.jse.getNewMap(AFCmdBase.jse.getGlobalscope());
			
			for(Object id : obj.getAllIds()) {
				jsMap.put((String) id, obj.get(id));
			}

			if (jsMap.contains("format")) {
				switch(((String) jsMap.get("format")).toUpperCase()) {
				case "DEFAULT": this.csvFormat = CSVFormat.DEFAULT; break;
				case "EXCEL": this.csvFormat = CSVFormat.EXCEL; break;
				case "INFORMIX_UNLOAD": this.csvFormat = CSVFormat.INFORMIX_UNLOAD; break;
				case "INFORMIX_UNLOAD_CSV": this.csvFormat = CSVFormat.INFORMIX_UNLOAD_CSV; break;
				case "MYSQL": this.csvFormat = CSVFormat.MYSQL; break;
				case "RFC4180": this.csvFormat = CSVFormat.RFC4180; break;
				case "ORACLE": this.csvFormat = CSVFormat.ORACLE; break;
				case "POSTGRESQL_CSV": this.csvFormat = CSVFormat.POSTGRESQL_CSV; break;
				case "POSTGRESQL_TEXT": this.csvFormat = CSVFormat.POSTGRESQL_TEXT; break;
				case "TDF": this.csvFormat = CSVFormat.TDF; break;
				default: this.csvFormat = CSVFormat.DEFAULT;
				}
			}
			
			if (jsMap.contains("quoteMode")) {
				switch(((String) jsMap.get("quoteMode")).toUpperCase()) {
				case "ALL": this.csvFormat = this.csvFormat.withQuoteMode(QuoteMode.ALL); break;
				case "ALL_NON_NULL": this.csvFormat = this.csvFormat.withQuoteMode(QuoteMode.ALL_NON_NULL); break;
				case "MINIMAL": this.csvFormat = this.csvFormat.withQuoteMode(QuoteMode.MINIMAL); break;
				case "NON_NUMERIC": this.csvFormat = this.csvFormat.withQuoteMode(QuoteMode.NON_NUMERIC); break;
				case "NONE": this.csvFormat = this.csvFormat.withQuoteMode(QuoteMode.NONE); break;
				default: this.csvFormat = this.csvFormat.withQuoteMode(QuoteMode.NON_NUMERIC);
				}
			}
			
			if (jsMap.contains("withHeader") && ((boolean) jsMap.get("withHeader"))) {
				this.csvFormat = this.csvFormat.withHeader();
			}

			if (jsMap.contains("withHeaders")) {
				int c = 0;
				NativeArray na = ((NativeArray) jsMap.get("withHeaders"));
				String[] hs = new String[na.size()];

				this.heads = new HashMap<String, Integer>();
				for(Object ob : na) {
					hs[c] = (String) ob;
					this.heads.put((String) ob, java.lang.Integer.valueOf(c++));
				}
				this.csvFormat = this.csvFormat.withHeader(hs);
			}

			if (jsMap.contains("withDelimiter")) {
				this.csvFormat = this.csvFormat.withDelimiter(((String) jsMap.get("withDelimiter")).charAt(0));
			}

			if (jsMap.contains("withEscape")) {
				this.csvFormat = this.csvFormat.withEscape(((String) jsMap.get("withEscape")).charAt(0));
			}	

			if (jsMap.contains("withNullString")) {
				this.csvFormat = this.csvFormat.withNullString((String) jsMap.get("withNullString"));
			}
		}
	}

	@JSFunction
	public void toStream(Object aStream, NativeFunction func) throws IOException {
		if (aStream instanceof OutputStream) {
			BufferedWriter bw = new BufferedWriter(new OutputStreamWriter((OutputStream) aStream));

			try {
				Context cx = (Context) AFCmdBase.jse.enterContext();
				CSVPrinter ppp = new CSVPrinter(bw, this.csvFormat);
				
				Object res;
				do {
					Object[] values = new Object[this.heads.size()];
					res = func.call(cx, (Scriptable) AFCmdBase.jse.getGlobalscope(), cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope()), new Object[] { });
					if (res instanceof NativeObject) {
						NativeObject obj = ((NativeObject) res);
						for(String head : this.heads.keySet()) {
							if (obj.containsKey(head)) {
								values[this.heads.get(head)] = obj.get(head);
							}
						}
						ppp.printRecord(values);
					}
				} while(res != null && res instanceof NativeObject);
				ppp.flush();
				ppp.close();
			} finally {
				AFCmdBase.jse.exitContext();
			}
		}
	}

	@JSFunction
	public void fromStream(Object aStream, NativeFunction func) throws IOException {
		if (aStream instanceof InputStream) {
			boolean hasHeaders = false;
			String[] headers = null;
			Reader reader = new InputStreamReader(((InputStream) aStream), "UTF-8");
			CSVParser parser = new CSVParser(reader, this.csvFormat.withSkipHeaderRecord());
			
			if (parser.getHeaderMap() != null || this.heads != null) {
				if (this.heads == null) this.heads = parser.getHeaderMap();

				hasHeaders = true;
				headers = new String[this.heads.size()];
				for(String head : this.heads.keySet()) {
					headers[this.heads.get(head)] = head;
				}
			}

			try {
				for(CSVRecord record : parser) {
					Context cx = (Context) AFCmdBase.jse.enterContext();
					
					try {
						JSMap m = AFCmdBase.jse.getNewMap(null);
						int c = 0;
						for(Object value : record) {
							if (hasHeaders && headers.length > c) {
								m.put(headers[c], value);
							} else {
								m.put(Integer.toString(c), value);
							}
							c++;
						}
						func.call(cx, (Scriptable) AFCmdBase.jse.getGlobalscope(), cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope()), new Object[] { m.getMap() });
					} catch(Exception ee) {
						throw ee;
					} finally {
						AFCmdBase.jse.exitContext();
					};
				}
			} finally {
				parser.close();
				reader.close();
			}
	
		}		
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
 
