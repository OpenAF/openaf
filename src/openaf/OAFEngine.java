package openaf;

import com.google.gson.JsonObject;
import org.apache.commons.io.IOUtils;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import java.io.Reader;

import javax.script.AbstractScriptEngine;
import javax.script.Bindings;
import javax.script.Invocable;
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

public class OAFEngine extends AbstractScriptEngine implements ScriptEngine, AutoCloseable, Invocable {   
    protected OAFEngineFactory engine;
    protected ScriptContext context;
    protected ScriptEngineFactory factory;

    protected Bindings bindings = new SimpleBindings();
    protected Bindings globalBindings = new SimpleBindings();

    protected static AFCmdOS afcmd;

    static {
        if (AFCmdBase.afc != null) {
            afcmd = (AFCmdOS) AFCmdBase.afc;
        } else {
            afcmd = new AFCmdOS();
        }
    }

    OAFEngine(ScriptEngineFactory factory) {
        this.factory = factory;
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
			return afcmd.execute(new JsonObject(), "", true, new StringBuilder(IOUtils.toString(reader)), false);
		} catch (Exception e) {
			throw (ScriptException) new ScriptException(e.getMessage()).initCause(e);
		}
    }

    @Override
    public Object eval(Reader reader, Bindings bindings) throws ScriptException {
        try {
			return afcmd.execute(new JsonObject(), "", true, new StringBuilder(IOUtils.toString(reader)), false);
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
			return afcmd.execute(new JsonObject(), "", true, new StringBuilder(line), false);
		} catch (Exception e) {
			throw (ScriptException) new ScriptException(e.getMessage()).initCause(e);
		}
    }

    @Override
    public Object eval(String line, Bindings b) throws ScriptException {
        try {
			return afcmd.execute(new JsonObject(), "", true, new StringBuilder(line), false);
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

	@Override
	public <T> T getInterface(Class<T> clasz) {
		return getInterface(this, clasz);
	}

	@Override
	public <T> T getInterface(Object thiz, Class<T> clasz) {
        Context ctx = (Context) AFCmdBase.jse.enterContext();
        @SuppressWarnings("unchecked")
        T t = (T) ctx.jsToJava(thiz, clasz);
        AFCmdBase.jse.exitContext();
        return t;
	}

	@Override
	public Object invokeFunction(String name, Object... args) throws ScriptException, NoSuchMethodException {
        Context ctx = (Context) AFCmdBase.jse.enterContext();
        ScriptableObject gs = (ScriptableObject) AFCmdBase.jse.getGlobalscope();
        Object res = null;
        try { 
            Object o = gs.getProperty(gs, name);
            if (o instanceof Function) {
                Scriptable json = ctx.newObject(gs);
                for(Object k : bindings.keySet()) {
                    json.put(k.toString(), json, bindings.get(k));
                }
                res = ((Function) o).call(ctx, gs, json, args);
            }
            return res;
        } catch (Exception e) {
            throw e;
        } finally {
            AFCmdBase.jse.exitContext();
        }
	}

	@Override
	public Object invokeMethod(Object thiz, String name, Object... args) throws ScriptException, NoSuchMethodException {
        Context ctx = (Context) AFCmdBase.jse.enterContext();
        ScriptableObject gs = (ScriptableObject) AFCmdBase.jse.getGlobalscope();
        Object res = null;
        try { 
            Object o = gs.getProperty(gs, name);
            if (o instanceof Function) {
                res = ((Function) o).call(ctx, gs, gs, args);
            }
            return res;
        } catch (Exception e) {
            throw e;
        } finally {
            AFCmdBase.jse.exitContext();
        }
	}

}