package openaf;

/**
 * 
 * Copyright 2025 Nuno Aguiar
 * 
 */

public class Launcher {
    public static void main(String[] args) {
        // Java version check
		String version = System.getProperty("java.version");

        // If lower than 21 print warning and end
        if (isJavaVersionBelow21(version)) {
            System.err.println("Warning: You are using java " + version + ". Please use or upgrade to Java >= 21.");
            System.exit(1);
        }

        // Proceed with the normal execution
        try {
            Class<?> cls = Class.forName("openaf._AFCmdOS");
            cls.getMethod("main", String[].class).invoke(null, (Object) args);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static boolean isJavaVersionBelow21(String version) {
        String[] parts = version.split("\\.");
        int major = Integer.parseInt(parts[0]);
        return major < 21;
    }
}