/**
 * 
 * Copyright 2023 Nuno Aguiar
 * 
 */
package openaf;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.lang.management.ManagementFactory;

/**
 * Startup optimization utilities for OpenAF running on Java 21+
 * Provides performance enhancements for class loading and initialization
 */
public final class StartupOptimizer {
    
    private static volatile boolean optimizationEnabled = true;
    private static volatile ExecutorService virtualThreadExecutor;
    
    static {
        // Check if we're running on Java 21+ for virtual thread support
        String version = System.getProperty("java.version");
        int majorVersion = Integer.parseInt(version.split("\\.")[0]);
        
        if (majorVersion >= 21) {
            // Use virtual thread executor for non-blocking initialization tasks
            virtualThreadExecutor = Executors.newVirtualThreadPerTaskExecutor();
        } else {
            // Fallback to traditional thread pool for older Java versions
            virtualThreadExecutor = Executors.newCachedThreadPool();
        }
    }
    
    /**
     * Initialize OpenAF components asynchronously for faster startup
     */
    public static void optimizeStartup() {
        if (!optimizationEnabled) {
            return;
        }
        
        // Pre-warm the OAFdCL classloader cache
        CompletableFuture.runAsync(() -> {
            OAFdCL loader = OAFdCL.getInstance(ClassLoader.getSystemClassLoader());
            if (loader != null) {
                loader.preWarmCache();
            }
        }, virtualThreadExecutor);
        
        // Pre-load frequently used system properties
        CompletableFuture.runAsync(() -> {
            preloadSystemProperties();
        }, virtualThreadExecutor);
        
        // Initialize JIT compilation hints
        CompletableFuture.runAsync(() -> {
            initializeJITHints();
        }, virtualThreadExecutor);
    }
    
    /**
     * Pre-load commonly accessed system properties to avoid repeated lookups
     */
    private static void preloadSystemProperties() {
        String[] commonProperties = {
            "java.version",
            "java.home",
            "user.dir",
            "file.separator",
            "path.separator",
            "line.separator",
            "os.name",
            "os.arch",
            "java.class.path"
        };
        
        for (String prop : commonProperties) {
            System.getProperty(prop);
        }
    }
    
    /**
     * Provide JIT compilation hints for frequently used methods
     */
    private static void initializeJITHints() {
        try {
            // Force compilation of commonly used string operations
            String testString = "openaf.test.performance";
            testString.contains("test");
            testString.startsWith("openaf");
            testString.indexOf(".");
            
            // Force compilation of common collection operations
            java.util.concurrent.ConcurrentHashMap<String, Object> testMap = 
                new java.util.concurrent.ConcurrentHashMap<>();
            testMap.put("test", "value");
            testMap.get("test");
            testMap.containsKey("test");
            
        } catch (Exception e) {
            // Ignore any issues with JIT hints
        }
    }
    
    /**
     * Get startup performance metrics
     */
    public static StartupMetrics getStartupMetrics() {
        return new StartupMetrics();
    }
    
    /**
     * Disable startup optimization (useful for debugging)
     */
    public static void disableOptimization() {
        optimizationEnabled = false;
    }
    
    /**
     * Enable startup optimization
     */
    public static void enableOptimization() {
        optimizationEnabled = true;
    }
    
    /**
     * Shutdown the optimization executor
     */
    public static void shutdown() {
        if (virtualThreadExecutor != null && !virtualThreadExecutor.isShutdown()) {
            virtualThreadExecutor.shutdown();
        }
    }
    
    /**
     * Container class for startup performance metrics
     */
    public static class StartupMetrics {
        private final long startTime;
        private final long totalMemory;
        private final long freeMemory;
        private final int processorCount;
        
        public StartupMetrics() {
            this.startTime = ManagementFactory.getRuntimeMXBean().getStartTime();
            Runtime runtime = Runtime.getRuntime();
            this.totalMemory = runtime.totalMemory();
            this.freeMemory = runtime.freeMemory();
            this.processorCount = runtime.availableProcessors();
        }
        
        public long getStartTime() { return startTime; }
        public long getTotalMemory() { return totalMemory; }
        public long getFreeMemory() { return freeMemory; }
        public long getUsedMemory() { return totalMemory - freeMemory; }
        public int getProcessorCount() { return processorCount; }
        public long getUptime() { 
            return ManagementFactory.getRuntimeMXBean().getUptime(); 
        }
        
        @Override
        public String toString() {
            return String.format(
                "StartupMetrics{uptime=%dms, usedMemory=%dMB, processors=%d}",
                getUptime(),
                getUsedMemory() / (1024 * 1024),
                processorCount
            );
        }
    }
}
