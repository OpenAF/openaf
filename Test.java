import javax.script.ScriptEngineManager;
import javax.script.ScriptEngine;
import javax.script.ScriptException;

public class Test {
    public static void main(String args[]) {
        ScriptEngineManager factory = new ScriptEngineManager();
        ScriptEngine engine = factory.getEngineByName("OpenAF");

        try {
            engine.eval("tlog('OpenAF version = {{version}} with distribution = {{dist}}', { version: getVersion(), dist: getDistribution() } )");
            engine.eval("print(getOpenAFPath())")
        } catch(ScriptException e) {
            e.printStackTrace();
        }
    }
}
