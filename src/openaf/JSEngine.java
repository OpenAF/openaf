package openaf;

import java.util.Collection;
import java.util.Iterator;
import java.lang.String;

/**
 * Generic JS Engine interface
 * 
 * @author Nuno Aguiar
 *
 */
public interface JSEngine {

	public void start(int optimizationLevel); 
	public void stop();
	
	public void defineSerialize();
	
	public Object createObject();
	public Object newObject(Object basedObject);
	public Object newObject(Object basedObject, String constructorName);
	public Object newObject(Object basedObject, String constructorName, Object[] args);
	public Object newArray(Object basedObject, Object[] list);
	public Object stringify(Object obj);
	public Object stringify(Object obj, Object replacer, Object space);
	
	public Object getGlobalscope();
	public Object getNotSafeContext();
	public Object enterContext();
	public void exitContext();
	public boolean isReady();
	public long getCurrentNumberOfLines();
	public void addNumberOfLines(String l);
	
	public abstract class JSList implements Iterable {
		public abstract void add(Object item);
		public abstract void addAll(Collection<?> items);
		public abstract Object getList();
		public abstract Iterator<Object> iterator();
	}
	
	public interface JSMap {
		public abstract boolean contains(String key);
		public abstract Object get(String key);
		public abstract void put(String key, Object item);
		public abstract Object getMap();
	}
	
	public JSList getNewList(Object parent);
	public JSMap getNewMap(Object parent);
	public Object convertObject(Object anObject);
}
