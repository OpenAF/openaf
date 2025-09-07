package openaf;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
        if (version == null || version.isEmpty()) return true;
        // Try to extract the leading major version number (handles cases like "25-ea")
        Matcher m = Pattern.compile("^(\\d+)").matcher(version);
        if (m.find()) {
            try {
                int major = Integer.parseInt(m.group(1));
                return major < 21;
            } catch (NumberFormatException e) {
                // fall through to conservative default below
            }
        }
        // Fallback: try previous behavior but strip non-digits just in case
        String[] parts = version.split("\\.");
        if (parts.length > 0) {
            String first = parts[0].replaceAll("\\D", "");
            if (!first.isEmpty()) {
                try {
                    int major = Integer.parseInt(first);
                    return major < 21;
                } catch (NumberFormatException e) {
                    // ignore and fall through
                }
            }
        }
        // If we can't determine, be conservative and require upgrade
        return true;
    }
}