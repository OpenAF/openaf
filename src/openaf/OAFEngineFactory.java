package openaf;

import javax.script.ScriptEngineFactory;
import javax.script.ScriptEngine;
import java.util.ArrayList;
import java.util.List;
import java.lang.String;

/**
 * 
 * @author Nuno Aguiar
 * 
 */

public class OAFEngineFactory implements ScriptEngineFactory {
    public String engineName = "OpenAF";
    //public String engineName = "python";
    public ArrayList<String> extensions = new ArrayList<String>();
    public ArrayList<String> mimetypes = new ArrayList<String>();

    public OAFEngineFactory() {
        extensions.add("js");
        extensions.add("oaf");

        mimetypes.add("application/openaf");
        mimetypes.add("application/javascript");
    }

    public ScriptEngine getScriptEngine() {
        return new OAFEngine(this);
    }

    public String getProgram(String... statements) {
        StringBuffer ret = new StringBuffer();

        for (int i = 0; i < statements.length; i++) {
            ret.append(statements[i]);
            ret.append("\n");
        }

        return ret.toString();
    }

    public String getOutputStatement(String toDisplay) {
        return "print(" + toDisplay + ");";
    }

    public String getMethodCallSyntax(String obj, String m, String... args) {
        String ret = obj;
        ret += "." + m + "(";
        for (int i = 0; i < args.length; i++) {
            ret += args[i];
            if (i == args.length - 1)
                ret += ")";
            else
                ret += ",";
        }

        return ret;
    }

    public Object getParameter(String key) {
        if (key == null)
            return null;

        if (key.equals(ScriptEngine.ENGINE))           return getEngineName();
        if (key.equals(ScriptEngine.ENGINE_VERSION))   return getEngineVersion();
        if (key.equals(ScriptEngine.NAME))             return engineName;
        if (key.equals(ScriptEngine.LANGUAGE))         return getLanguageName();
        if (key.equals(ScriptEngine.LANGUAGE_VERSION)) return getLanguageVersion();

        return null;
    }

    public String getLanguageVersion() {
        return AFCmdBase.VERSION;
    }

    public String getLanguageName() {
        return engineName;
    }

    public List<String> getNames() {
        ArrayList<String> list = new ArrayList<String>();

        list.add(engineName);

        return list;
    }

    public List<String> getMimeTypes() {
        return mimetypes;
    }

    public List<String> getExtensions() {
        return extensions;
    }

    public String getEngineVersion() {
        return AFCmdBase.VERSION;
    }

    public String getEngineName() {
        return engineName;
    }
}