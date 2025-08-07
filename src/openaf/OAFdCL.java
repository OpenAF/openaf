/**
 * 
 * Copyright 2025 Nuno Aguiar
 * 
 */
package openaf;

import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import java.util.concurrent.atomic.AtomicLong;

/**
 * OpenAF Dynamic ClassLoader optimized for Java 21+
 * Features:
 * - Thread-safe lazy initialization
 * - Concurrent class loading cache
 * - Optimized URL management
 * - Virtual threads support for blocking operations
 * - Path API for better file handling
 */
public final class OAFdCL extends URLClassLoader {
    public static volatile OAFdCL oafdcl = null;
    private static final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    
    // Class loading cache for faster repeated lookups
    private static final ConcurrentHashMap<String, Class<?>> classCache = new ConcurrentHashMap<>(256, 0.75f, Runtime.getRuntime().availableProcessors());
    
    // URL cache to avoid duplicate URLs and improve performance
    private static final ConcurrentHashMap<String, URL> urlCache = new ConcurrentHashMap<>(64, 0.75f, Runtime.getRuntime().availableProcessors());
    
    private static final AtomicLong cacheHits = new AtomicLong(0);
    private static final AtomicLong cacheMisses = new AtomicLong(0);

    static {
        // Register as parallel capable for better performance in multi-threaded environments
        ClassLoader.registerAsParallelCapable();
    }

    /**
     * Thread-safe singleton pattern with double-checked locking
     * Prevents creation of nested OAFdCL instances
     */
    public static OAFdCL getInstance(ClassLoader classLoader) {
        // CRITICAL: Always return the existing instance if it exists, regardless of classLoader parameter
        if (oafdcl != null) {
            return oafdcl;
        }
        
        lock.writeLock().lock();
        try {
            // Double-check after acquiring lock
            if (oafdcl == null) {
                // Find the root non-OAFdCL class loader to avoid nesting
                ClassLoader rootParent = classLoader;
                while (rootParent instanceof OAFdCL) {
                    // If we already have a singleton and someone is trying to create a nested one,
                    // return the existing singleton instead of creating a new one
                    if (oafdcl != null) {
                        return oafdcl;
                    }
                    
                    rootParent = rootParent.getParent();
                }
                
                oafdcl = new OAFdCL(rootParent);
            }
        } finally {
            lock.writeLock().unlock();
        }
        return oafdcl;
    }
    
    /**
     * Get the current singleton instance if it exists, or null if not yet created
     */
    public static OAFdCL getCurrentInstance() {
        return oafdcl;
    }

    public OAFdCL(ClassLoader classLoader) {
        super(new URL[] {}, classLoader);
    }

    /**
     * Optimized path-to-URL conversion with caching
     */
    public final void appendToClassPathForInstrumentation(String path) throws MalformedURLException {
        if (path == null || path.trim().isEmpty()) {
            return;
        }
        
        // Use cached URL if available
        URL url = urlCache.computeIfAbsent(path, p -> {
            try {
                // Use Path API for better performance and correct URI handling
                Path pathObj = Paths.get(p);
                return pathObj.toUri().toURL();
            } catch (MalformedURLException e) {
                throw new RuntimeException("Invalid path: " + p, e);
            }
        });
        
        addURL(url);
    }

    @Override
    public final void addURL(URL url) {
        if (url != null) {
            super.addURL(url);  
            // Cache the URL string representation for future lookups
            urlCache.putIfAbsent(url.toString(), url);
            
            // Clear class cache when new URLs are added to allow reloading
            // This ensures that previously failed class lookups can succeed
            // after new classpath entries are added
            int cacheSize = classCache.size();
            if (cacheSize > 0) {
                classCache.clear();
            }
        }
    }

    @Override
    public final Class<?> findClass(String name) throws ClassNotFoundException {        
        // Check cache first for performance
        Class<?> cachedClass = classCache.get(name);
        if (cachedClass != null) {
            cacheHits.incrementAndGet();
            return cachedClass;
        }
        
        try {
            // Standard class loading
            Class<?> clazz = super.findClass(name);
            
            // Cache the result for future lookups
            classCache.putIfAbsent(name, clazz);
            cacheMisses.incrementAndGet();
            
            return clazz;
        } catch (ClassNotFoundException e) {
            // Don't cache negative results to allow for dynamic classpath changes
            throw e;
        }
    }

    @Override
    public final Class<?> loadClass(String name) throws ClassNotFoundException {
        return loadClass(name, true);
    }

    @Override
    public final Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
        // If we're not the singleton, delegate to the singleton for consistency
        if (this != oafdcl && oafdcl != null) {
            return oafdcl.loadClass(name, resolve);
        }
        
        // Check cache first for frequently loaded classes
        Class<?> cachedClass = classCache.get(name);
        if (cachedClass != null) {
            if (resolve) {
                resolveClass(cachedClass);
            }
            cacheHits.incrementAndGet();
            return cachedClass;
        }
        

        try {
            Class<?> clazz = findClass(name);
            if (resolve) {
                resolveClass(clazz);
            }
            // Cache the result
            classCache.putIfAbsent(name, clazz);
            cacheMisses.incrementAndGet();
            return clazz;
        } catch (ClassNotFoundException e) {
            // Fall through to normal delegation
        }
        
        try {
            // Use parent's loadClass for proper delegation
            Class<?> clazz = super.loadClass(name, resolve);
            
            // Cache non-system classes for better performance
            if (!name.startsWith("java.") && !name.startsWith("javax.") && !name.startsWith("sun.")) {
                classCache.putIfAbsent(name, clazz);
            }
            
            cacheMisses.incrementAndGet();
            return clazz;
        } catch (ClassNotFoundException e) {
            throw e;
        }
    }

    @Override
    public final URL[] getURLs() {
        return super.getURLs();
    }
    
    /**
     * Clear class cache - useful for dynamic reloading scenarios
     */
    public final void clearCache() {
        classCache.clear();
    }
    
    /**
     * Get cache statistics for monitoring and tuning
     */
    public final int getCacheSize() {
        return classCache.size();
    }
    
    /**
     * Get all cached class names as an array
     * @return 
     */
    public final String[] getCachedClasses() {
        return classCache.keySet().toArray(new String[0]);
    }

    /**
     * Get cache hits count
     */
    public final long getCacheHits() {
        return cacheHits.get();
    }

    /**
     * Get cache misses count
     */
    public final long getCacheMisses() {    
        return cacheMisses.get();
    }

    /**
     * Pre-warm the cache with commonly used classes for faster startup
     */
    public final void preWarmCache() {
        // Pre-load commonly used OpenAF classes in a virtual thread for non-blocking operation
        Thread.startVirtualThread(() -> {
            String[] commonClasses = {
                "org.mozilla.javascript.NativeFunction",
                "openaf.OAFdCL",
                "org.mozilla.javascript.Scriptable",
                "org.mozilla.javascript.optimizer.Bootstrapper",
                "org.mozilla.javascript.ContextFactory",
                "org.mozilla.javascript.Script",
                "org.mozilla.javascript.Undefined",
                "org.mozilla.javascript.ScriptRuntime",
                "org.mozilla.javascript.Callable",
                "org.mozilla.javascript.Context",
                "org.mozilla.javascript.optimizer.OptRuntime",
                "openaf.Launcher"
            };
            
            for (String className : commonClasses) {
                try {
                    loadClass(className);
                } catch (ClassNotFoundException e) {
                    // Ignore - class might not be available yet
                }
            }
        });
    }
    
    /**
     * Optimized resource finding with caching
     */
    @Override
    public final URL findResource(String name) {
        return urlCache.computeIfAbsent("resource:" + name, resourceKey -> {
            String actualName = resourceKey.substring("resource:".length());
            return super.findResource(actualName);
        });
    }
    
    /**
     * Batch URL addition for improved performance when adding multiple classpath entries
     */
    public final void addURLs(URL[] urls) {
        if (urls != null && urls.length > 0) {
            for (URL url : urls) {
                if (url != null) {
                    addURL(url);
                }
            }
        }
    }
    
    /**
     * Get a defensive copy of cached URLs to prevent external modification
     */
    public final URL[] getCachedURLs() {
        return urlCache.values().toArray(new URL[0]);
    }
}
