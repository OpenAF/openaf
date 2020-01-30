/**
 * 
 * @author Nuno Aguiar
 * 
 */
package openaf;

import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLClassLoader;
import java.io.File;

public class OAFdCL extends URLClassLoader {
    public static OAFdCL oafdcl = null;

    final public static OAFdCL getInstance(ClassLoader classLoader) {
        if (oafdcl == null) {
            oafdcl = new OAFdCL(classLoader);
        }

        return oafdcl;
    }

    public OAFdCL(ClassLoader classLoader) {
        super(new URL[] {}, classLoader);
        if (oafdcl == null) {
            ClassLoader.registerAsParallelCapable();
            oafdcl = this;
        }
    }

    final public void appendToClassPathForInstrumentation(String path) throws MalformedURLException {
        super.addURL( (new File(path)).toURI().toURL() );
    }

    @Override
    final public void addURL(URL url) {
        super.addURL(url);
    }

    @Override
    final public Class<?> findClass(String aName) throws ClassNotFoundException {
        return super.findClass(aName);
    }

    @Override
    final public Class<?> loadClass(String aName, boolean resolve) throws ClassNotFoundException {
        return super.loadClass(aName, resolve);
    }

    @Override
    final public URL[] getURLs() {
        return super.getURLs();
    }
}