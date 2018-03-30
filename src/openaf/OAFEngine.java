package openaf;

import com.google.gson.JsonObject;

import org.apache.commons.io.IOUtils;

import java.io.Reader;
import javax.script.Bindings;
import javax.script.ScriptContext;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineFactory;
import javax.script.ScriptException;
import javax.script.SimpleBindings;

/**
 * 
 * @author Nuno Aguiar
 * 
 */

public class OAFEngine implements ScriptEngine, AutoCloseable {   
    protected OAFEngineFactory engine;
    protected ScriptContext context;
    protected ScriptEngineFactory factory;

    protected Bindings bindings = new SimpleBindings();
    protected Bindings globalBindings = new SimpleBindings();

    protected static AFCmdOS afcmd;

    static {
		afcmd = new AFCmdOS();
    }

    @Override
    public Bindings createBindings() {
        return new SimpleBindings();
    }
    
    @Override
    public Object eval(Reader reader) throws ScriptException {
        return eval(reader, this.context);
    }

    @Override
    public Object eval(Reader reader, ScriptContext context) throws ScriptException {
        try {
            this.setContext(context);
			return afcmd.execute(new JsonObject(), "", true, new StringBuilder(IOUtils.toString(reader)), true);
		} catch (Exception e) {
			throw (ScriptException) new ScriptException(e.getMessage()).initCause(e);
		}
    }

    @Override
    public Object eval(Reader reader, Bindings bindings) throws ScriptException {
        try {
			return afcmd.execute(new JsonObject(), "", true, new StringBuilder(IOUtils.toString(reader)), true);
		} catch (Exception e) {
			throw (ScriptException) new ScriptException(e.getMessage()).initCause(e);
		}
    }
    
    @Override
    public Object eval(String line) throws ScriptException { 
        return eval(line, this.context);
    }

    @Override
    public Object eval(String line, ScriptContext context) throws ScriptException {
        try {
            this.setContext(context);
			return afcmd.execute(new JsonObject(), "", true, new StringBuilder(line), true);
		} catch (Exception e) {
			throw (ScriptException) new ScriptException(e.getMessage()).initCause(e);
		}
    }

    @Override
    public Object eval(String line, Bindings b) throws ScriptException {
        try {
			return afcmd.execute(new JsonObject(), "", true, new StringBuilder(line), true);
		} catch (Exception e) {
			throw (ScriptException) new ScriptException(e.getMessage()).initCause(e);
		}
    }

    @Override
    public ScriptEngineFactory getFactory() {
        return factory;
    }
    
    @Override
    public Object get(String name) {
        return bindings.get(name);
    }
    
    @Override
    public void put(String name, Object val) throws IllegalArgumentException {
        bindings.put(name, val);
    }

    @Override
    public Bindings getBindings(int scope) {
        if (scope == ScriptContext.ENGINE_SCOPE) {
            return this.bindings;
        }

        return this.globalBindings;
    }

    @Override
    public void setBindings(Bindings bindings, int scope) {
        if (scope == ScriptContext.ENGINE_SCOPE) {
            this.bindings = bindings;
        }

        this.globalBindings = bindings;        
    }

    @Override
    public ScriptContext getContext() {
        return context;
    }

    @Override
    public void setContext(ScriptContext c) {
        context = c;
    }

    @Override
    public void close() {
    
    }

	public void setFactory(OAFEngineFactory oafEngineFactory) {
        engine = oafEngineFactory;
	}
}