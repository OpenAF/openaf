/**
 * 
 * @author Nuno Aguiar
 * 
 */
package openaf;

import java.net.URL;
import java.net.URLClassLoader;

public class OAFdCL extends URLClassLoader {
    protected static OAFdCL oafdcl = null;

    public static OAFdCL getInstance(ClassLoader classLoader) {
        if (oafdcl == null) {
            oafdcl = new OAFdCL(classLoader);
        }

        return oafdcl;
    }

    public OAFdCL(ClassLoader classLoader) {
        super(new URL[] {}, classLoader);
        if (oafdcl == null) oafdcl = this;
    }

    @Override
    public void addURL(URL url) {
        super.addURL(url);
    }

    @Override
    public Class<?> findClass(String aName) throws ClassNotFoundException {
        return super.findClass(aName);
    }

    @Override
    public Class<?> loadClass(String aName, boolean resolve) throws ClassNotFoundException {
        return super.loadClass(aName, resolve);
    }

    @Override
    public URL[] getURLs() {
        return super.getURLs();
    }
}