package openaf.rhino;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeJSON;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import java.lang.String;

import openaf.AFCmdBase;
import openaf.JSEngine;

/**
 * Rhino JSEngine implementation
 * 
 * @author Nuno Aguiar
 *
 */
public class RhinoEngine implements JSEngine {
	protected static org.mozilla.javascript.Context cx;
	protected static ScriptableObject globalscope;
	protected static boolean getSerializeDefined = false;
	protected boolean ready = false;
	protected long numberOfLines = 0;
	
	public boolean isReady() {
		return ready;
	}

	public org.mozilla.javascript.Context getNotSafeContext() {
		return cx;
	}
	
	public Object getGlobalscope() {
		return globalscope;
	}
	
	// Creates the getSerialize function to enable safe json stringify for circular cases
	// from https://github.com/isaacs/json-stringify-safe
	public void defineSerialize() {
		if (!(getSerializeDefined)) {
			String source = "function getSerialize (fn, decycle) { function getPath (value, seen, keys) { var index = seen.indexOf(value); var path = [ keys[index] ]; for (index--; index >= 0; index--) { if (seen[index][ path[0] ] === value) { value = seen[index]; path.unshift(keys[index]); }} return '~' + path.join('.'); }";
			source = source + " var seen = [], keys = []; decycle = decycle || function(key, value) {return '[Circular ' + getPath(value, seen, keys) + ']'}; return function(key, value) {var ret = value;if (typeof value === 'object' && value) {if (seen.indexOf(value) !== -1) ret = decycle(key, value); else { seen.push(value); keys.push(key); }} if (fn) ret = fn(key, ret);  return ret;}}";
			Context cx = Context.enter();
			cx.evaluateString((Scriptable) AFCmdBase.jse.getGlobalscope(), source, "internal_getSerialize", 1, null);
			Context.exit();
		}
		
		getSerializeDefined = true;
	}
	
	@Override
	public void start(int compLevel) {
		// Initialize Rhino
		cx = org.mozilla.javascript.Context.enter();
		cx.setOptimizationLevel(compLevel);
		cx.setLanguageVersion(Context.VERSION_ES6); 
		globalscope = cx.initStandardObjects();
		ready = true;
	}
	@Override
	public void stop() {
		Context.exit();
	}
	
	@Override
	public Object createObject() {
		return cx.newObject(this.globalscope);
	}
	
	@Override
	public Object newObject(Object base) {
		return cx.newObject((Scriptable) base);
	}
	
	@Override
	public Object newArray(Object base, Object[] list) {
		return cx.newArray((Scriptable) base, list);
	}

	@Override
	public Object stringify(Object obj) {
		return NativeJSON.stringify(cx, globalscope, obj, null, null);
	}
	
	@Override
	public Object stringify(Object obj, Object replacer, Object space) {
		return NativeJSON.stringify(cx, globalscope, obj, replacer, space);
	}
	
	@Override
	public Object newObject(Object base, String constructorName) {
		return cx.newObject((Scriptable) base, constructorName);
	}

	@Override
	public Object newObject(Object base, String constructorName,
			Object[] args) {
		return cx.newObject((Scriptable) base, constructorName, args);
	}

	@Override
	public Object enterContext() {
		return Context.enter();
	}

	@Override
	public void exitContext() {
		Context.exit();
	}

	@Override
	public long getCurrentNumberOfLines() {
		return numberOfLines;
	}
	
	@Override
	public void addNumberOfLines(String l) {
		long ln = l.split("\r\n|\r|\n").length;
		numberOfLines = numberOfLines + ln;
	}

	@Override
	public Object convertObject(Object anObject) {
		return Context.javaToJS(anObject, (Scriptable) this.getGlobalscope());
	}
//	@Override
//	public Object convertObject(Object anObject) {
//		if(anObject instanceof Map) {
//System.out.println("--> MAP");
//			Map aMap = (Map) anObject;
//			Scriptable no = AFCmd.jse.newObject(AFCmdBase.jse.getGlobalscope());
//			for(Object o : aMap.keySet()) {
//				no.put((String) o, no, convertObject(aMap.get(o)));
//			}
//			return no;
//		}
//		
//		if(anObject instanceof List) {
//System.out.println("--> LIST");
//			List<Object> aList = (List<Object>) anObject;
//			ArrayList<Object> aNewList = new ArrayList<Object>();
//			for(int i = 0; i < aList.size(); i++) {
//				aNewList.add(convertObject(aList.get(i)));
//			}
//			Scriptable no = AFCmd.jse.newArray(AFCmdBase.jse.getGlobalscope(), aNewList.toArray());
//			return no;
//		}
//System.out.println("--> OBJ " + anObject.getClass());
//		return Context.javaToJS(anObject, AFCmdBase.jse.getGlobalscope());
//	}
	
	public class JSMap implements openaf.JSEngine.JSMap {
		Scriptable no;
		Scriptable parentNo;
		
		public JSMap() {
			parentNo = (Scriptable) AFCmdBase.jse.getGlobalscope();
			no = (Scriptable) AFCmdBase.jse.newObject(parentNo);
		}
		
		public JSMap(Scriptable parent) {
			parentNo = parent;
			no = (Scriptable) AFCmdBase.jse.newObject(parentNo);
		}
		
		public void put(String key, Object item) {
			no.put(key, no, item);
		}

		public Object get(String key) {
			return no.get(key, parentNo);
		}
		
		public boolean contains(String key) {
			return no.has(key, parentNo);
		}

		public Object getMap() {
			return no;
		}
	}
	
	public class JSList extends openaf.JSEngine.JSList {
		Scriptable parentNo;
		ArrayList<Object> alist;
		
		public JSList() {
			alist = new ArrayList<Object>();
			parentNo = (Scriptable) AFCmdBase.jse.getGlobalscope();
		}
		
		public JSList(Scriptable parent) {
			alist = new ArrayList<Object>();
			parentNo = parent;
		}
		
		public void add(Object item) {
			alist.add(item);
		}
		
		public Object getList() {
			return AFCmdBase.jse.newArray(parentNo, alist.toArray());
		}

		@Override
		public void addAll(Collection<?> items) {
			alist.addAll(items);
			
		}

		@Override
		public Iterator<Object> iterator() {
			return alist.iterator();
		}
	}

	@Override
	public openaf.JSEngine.JSList getNewList(Object parent) {
		if (parent == null) 
			return new JSList();
		else
			return new JSList((Scriptable) parent);
	}

	@Override
	public openaf.JSEngine.JSMap getNewMap(Object parent) {
		if (parent == null)
			return new JSMap();
		else
			return new JSMap((Scriptable) parent);
	}
	
	
}
