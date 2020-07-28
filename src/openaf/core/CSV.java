package openaf.core;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringReader;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.lang.String;

import openaf.SimpleLog;

/**
 * Core CSV plugin
 * 
 * @author Nuno Aguiar
 */
public class CSV {
	protected enum valuetypes { STRING, NUMBER };
	protected Map<Long, String> header = new ConcurrentHashMap<Long, String>();
	//protected Map<String, String> value = new HashMap<String, String>();
	protected Map<Long, valuetypes> headerType = new ConcurrentHashMap<Long, valuetypes>();
	protected List<Map<String, String>> values = Collections.synchronizedList(new ArrayList<Map<String, String>>());
	protected boolean isDetermineTypesComplete = false;
	protected String separator = ";";
	protected String stringDelimeter = "\"";

	/**
	 * <odoc>
	 * <key>CSV.clear()</key>
	 * Clears all internal structures. This will clear all data stored previously in this instance.
	 * </odoc>
	 */
	public void clear() {
		this.header.clear();
		this.values.clear();
		this.headerType.clear();
	}

	/**
	 * <odoc>
	 * <key>CSV.setSeparator(aSeparator)</key>
	 * Sets the default separator to use when building a CSV output (default is ;)
	 * </odoc>
	 */
	public void setSeparator(String sep) {
		separator = sep;
	}

	/**
	 * <odoc>
	 * <key>CSV.setStringDelimiter(aDelimiter)</key>
	 * Sets the default string delimited to use when building a CSV output (default is ")
	 * </odoc>
	 */
	public void setStringDelimiter(String sdelim) {
		stringDelimeter = sdelim;
	}

	/**
	 * being deprecated
	 */
	public void load(String aFile) throws IOException {
		FileReader fr = null;
		try {
			fr = new FileReader(aFile);
			BufferedReader br = new BufferedReader(fr);

			String line = br.readLine();

			if (line != null) readHeader(line);
			while ((line = br.readLine()) != null) {
				readValue(line);
			}

			br.close();
		} catch (IOException e) {
			//SimpleLog.log(SimpleLog.logtype.ERROR, "Error reading file: " + aFile + ": "+ e.getMessage(),e);
			throw e;
		} finally {
			if (fr != null)
				try {
					fr.close();
				} catch (IOException e) {
					//SimpleLog.log(SimpleLog.logtype.ERROR, "Error closing file: " + aFile + ": "+ e.getMessage(),e);
					throw e;
				}
		}
	}

	/**
	 * <odoc>
	 * <key>CSV.CSV(aCsvString)</key>
	 * Creates a new instance of the CSV object. Optionally you can provide a string that contains
	 * a CSV.
	 * </odoc>
	 */
	public CSV(String csv) throws IOException {
		isDetermineTypesComplete = false;
		if (csv.length() > 0) {
			readString(csv);
		}
	}

	protected void readHeader(String line) {
		int pos = 0;
		for(String h : line.split(separator)) {
			header.put(Long.valueOf(pos), h);
			pos++;
		}
	}

	protected void determineTypes(String line) {
		int pos = 0;
		for(String v : line.split(separator)) {
			if (v.startsWith(stringDelimeter) && v.endsWith(stringDelimeter)) {
				headerType.put(Long.valueOf(pos), valuetypes.STRING);
			} else {
				if (v.length()>0) {
					try {
						Double.valueOf(v);
						headerType.put(Long.valueOf(pos), valuetypes.NUMBER);
					} catch (Exception e) {
						headerType.put(Long.valueOf(pos), valuetypes.STRING);
					}
				}
			}
			pos++;
		}

		if (headerType.size() == header.size()) {
			isDetermineTypesComplete = true;
		}
	}

	protected void readValue(String line) {
		long pos = 0;
		Map<String, String> value = new HashMap<String, String>();

		if (!isDetermineTypesComplete) determineTypes(line);

		for(String v : line.split(separator)) {
			if (headerType.get(Long.valueOf(pos)) != null &&
					headerType.get(Long.valueOf(pos)).equals(valuetypes.STRING)) {
				if (v != null)
					if (v.equals("\"\"")) {
						v = "";
					} else {
						if (v.length() > 2) {
							if (v.indexOf(stringDelimeter) == 0) v = v.substring(1, v.length() -1);
							if (v.indexOf(stringDelimeter) == (v.length() -1)) v = v.substring(0, v.length() - 2);
						}
					}
			}
			value.put(header.get(Long.valueOf(pos)), v);
			pos++;
		}

		values.add(value);
	}

	protected long readString(String c) throws IOException {
		StringReader sr = new StringReader(c);
		BufferedReader br = new BufferedReader(sr);

		clear();
		long numberOfLines = -1;

		try {	 
			String line = br.readLine();
			numberOfLines = 1;
			if (line != null) readHeader(line);

			while ((line = br.readLine()) != null) {
				readValue(line);
				numberOfLines++;
			}

			br.close();
		} catch (IOException e) {
			//SimpleLog.log(SimpleLog.logtype.ERROR, "Error reading string representation: " + e.getMessage(), e);
			throw e;
		} 
		return numberOfLines;
	}

	/**
	 * <odoc>
	 * <key>CSV.fromCSV(aCSVString)</key>
	 * Tries to convert aCSVString into an internal csv format.
	 * </odoc>
	 */
	public void fromCSV(String csv) throws IOException {
		readString(csv);
	}
	
	/**
	 * <odoc>
	 * <key>CSV.toCsv(anArrayOfMaps, anArrayOfKeys)</key>
	 * Tries to convert a javascript anArrayOfMaps into an internal csv format. The array should be composed of
	 * maps whose elements must have the same keys (example: [ { "F1": 1, "F2": abc}, { "F1": 2, "F2": xyz } ]).
	 * Optionally anArrayOfKeys can be provided to restrict the keys used and to force their order.
	 * </odoc>
	 */
	public void toCsv(ArrayList<HashMap<String, Object>> o, Object[] heads) {
		clear();
		HashMap<String, String> value = null;

		long pos = -1;

		if (o == null) return;

		for (int l = 0; l < o.size(); l++) {
			HashMap<String, Object> obj = o.get(l);
			if(heads == null)
				heads = obj.keySet().toArray();

			pos = 0;
			value = new HashMap<String, String>();

			for (int i = 0; i < ((Object[]) heads).length; i++) {
				String key = (String) ((Object[]) heads)[i];
				if (l == 0) {
					header.put(Long.valueOf(pos), key.toString());
					if ((obj.get(key) instanceof Double) || 
							(obj.get(key) instanceof Integer) || 
							(obj.get(key) instanceof Long))
						headerType.put(Long.valueOf(pos), valuetypes.NUMBER);
					else {
						headerType.put(Long.valueOf(pos), valuetypes.STRING);
					}
				}

				if (obj.get(key) != null) 
					value.put(key.toString(), obj.get(key).toString());
				else 
					value.put(key.toString(), null);

				pos++;
			}

			if (value.size() > 0)
				values.add(value);
		}
	}

	/**
	 * being deprecated
	 */
	public void p(String s) {
		System.out.println(s);
	}

	/**
	 * <odoc>
	 * <key>CSV.writeFile(aFilename) : Number</key>
	 * Tries to write the internal CSV representation into aFilename. If successful it will return the number
	 * of lines written, otherwise an exception will be raised.
	 * </odoc>
	 */
	public long writeFile(String aFile) throws IOException {
		PrintWriter pw = null;
		long numberOfLines = -1;

		try {
			pw = new PrintWriter(aFile);
			String line = "";

			for (long i = 0; i < this.header.keySet().size(); i++) {
				line = line + header.get(Long.valueOf(i));
				if (i < this.header.keySet().size() - 1) {
					line = line + separator;
				}
			}

			pw.println(line);
			numberOfLines = 1;

			for (Map<?, ?> v : values) {
				line = "";

				for (long i = 0; i < header.keySet().size(); i++) {
					if (headerType.get(Long.valueOf(i)) == valuetypes.NUMBER) {
						line = line + ((String) v.get(header.get(Long.valueOf(i))));
					} else {
						line = line + stringDelimeter + ((String)v.get(this.header.get(Long.valueOf(i)))) + stringDelimeter;
					}

					if (i < this.header.keySet().size() - 1) {
						line = line + separator;
					}
				}

				if (numberOfLines == this.values.size()) {
					pw.print(line);
				} else {
					pw.println(line);
				}

				numberOfLines++;
			}

			pw.flush();
		} catch (IOException e) {
			SimpleLog.log(SimpleLog.logtype.DEBUG, "Error reading file: " + aFile + ": " + e.getMessage(), e);
			throw e;
		} finally {
			if (pw != null) {
				pw.close();
			}
		}

		return numberOfLines;
	}

	/**
	 * <odoc>
	 * <key>CSV.w() : String</key>
	 * Returns the current CSV internal representation in the form of a string.
	 * </odoc>
	 */
	public String w() throws IOException {
		StringWriter sw = null;
		PrintWriter pw = null;

		sw = new StringWriter();
		pw = new PrintWriter(sw);
		String line = "";

		for (long i = 0; i < header.keySet().size(); i++) {
			line = line + ((String) header.get(Long.valueOf(i)));
			if (i < header.keySet().size() - 1) {
				line = line + separator;
			}
		}

		pw.println(line);

		for (Map<String, String> v : values) {
			line = "";
			for (long i = 0; i < header.keySet().size(); i++) {
				if (headerType.get(Long.valueOf(i)) == valuetypes.NUMBER)
					line = line + ((String)v.get(header.get(Long.valueOf(i))));
				else {
					line = line + stringDelimeter + ((String)v.get(header.get(Long.valueOf(i)))) + stringDelimeter;
				}

				if (i < header.keySet().size() - 1) {
					line = line + separator;
				}
			}
			pw.println(line);
		}

		pw.flush();
		sw.flush();

		try {
			pw.close();
			sw.close();
		} catch (IOException e) {
			//SimpleLog.log(SimpleLog.logtype.ERROR, "Error converting to string: " + e.getMessage(), e);
			throw e;
		}

		return sw.toString().replaceFirst("[\r\n]$", "");
	}

	/**
	 * <odoc>
	 * <key>CSV.readFile(aFilename) : Number</key>
	 * Tries to read aFilename into the internal CSV representation. If successful the number of read lines will
	 * be returned. Otherwise an exception will be raised.
	 * </odoc>
	 */
	public long readFile(String aFile) throws IOException {
		clear();
		FileReader fr = null;
		long numberOfLines = -1;

		try {
			fr = new FileReader(aFile);
			BufferedReader br = new BufferedReader(fr);

			String line = br.readLine();
			numberOfLines = 1;
			if (line != null) readHeader(line);

			while ((line = br.readLine()) != null) {
				readValue(line);
				numberOfLines++;
			}

			br.close();
		} catch (IOException e) {
			//SimpleLog.log(SimpleLog.logtype.ERROR, "Error reading file: " + aFile + ": " + e.getMessage(), e);
			throw e;
		} finally {
			if (fr != null)
				try {
					fr.close();
				} catch (IOException e) {
					//SimpleLog.log(SimpleLog.logtype.ERROR, "Error closing file: " + aFile + ": " + e.getMessage(), e);
					throw e;
				}
		}
		return numberOfLines;
	}

	/**
	 * <odoc>
	 * <key>CSV.csv() : Array</key>
	 * Returns a javascript array of maps with the current internal CSV representation.
	 * </odoc>
	 */
	public ArrayList<HashMap<String, Object>> csv() {
		ArrayList<HashMap<String, Object>> records = new ArrayList<HashMap<String, Object>>();

		for (Map<String, String> v : values) {
			// jsong.writeStartObject();
			HashMap<String, Object> record = new HashMap<String, Object>();

			for (long i = 0; i < header.keySet().size(); i++) {
				if (this.headerType.get(Long.valueOf(i)) == valuetypes.NUMBER)
					try {
						Long l = Long.getLong((String) v.get(header.get(Long.valueOf(i))));
						// jsong.writeNumberField((String)
						// header.get(Long.valueOf(i)), l.longValue());
						record.put((String) header.get(Long.valueOf(i)), l.longValue());
					} catch (Exception e) {
						try {
							Double d = Double.valueOf((String) v.get(header.get(Long.valueOf(i))));
							// jsong.writeNumberField((String)header.get(Long.valueOf(i)),
							// d.doubleValue());
							record.put((String) header.get(Long.valueOf(i)), d.doubleValue());
						} catch (Exception e1) {
							// jsong.writeStringField((String)header.get(Long.valueOf(i)),
							// (String)v.get(header.get(Long.valueOf(i))));
							record.put((String) header.get(Long.valueOf(i)), (String) v.get(header.get(Long.valueOf(i))));
						}
					}
				else {
					// jsong.writeStringField((String)header.get(Long.valueOf(i)),
					// (String)v.get(header.get(Long.valueOf(i))));
					record.put((String) header.get(Long.valueOf(i)), (String) v.get(header.get(Long.valueOf(i))));
				}
			}
			// jsong.writeEndObject();
			records.add(record);
		}

		// return AFCmd.cx.evaluateString(AFCmd.globalscope, "JSON.parse('" +
		// out.toString() + "');", "<csv>" + System.currentTimeMillis(), 1,
		// null);
		return records;
	}


}
