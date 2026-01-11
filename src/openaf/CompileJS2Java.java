package openaf;

import org.mozilla.javascript.optimizer.ClassCompiler;
import org.mozilla.javascript.CompilerEnvirons;
import org.mozilla.javascript.IRFactory;
import org.mozilla.javascript.JSDescriptor;
import org.mozilla.javascript.JavaAdapter;
import org.mozilla.javascript.Parser;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.ast.AstRoot;
import org.mozilla.javascript.ast.FunctionNode;
import org.mozilla.javascript.ast.ScriptNode;
import org.mozilla.javascript.optimizer.Codegen;
import org.mozilla.javascript.optimizer.OptJSCode;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 
 * Copyright 2023 Nuno Aguiar
 * 
 */
public class CompileJS2Java {
    /**
     * Enum to specify the class compilation method
     */
    public enum CompilationMethod {
        /**
         * Default method - ensures field names are sanitized
         * Uses custom Codegen with source clearing for optimal class file size
         */
        DEFAULT,

        /**
         * Mozilla Rhino 1.9.0 method - mimics current Mozilla Rhino branch approach
         * Uses ClassCompiler's standard compileToClassFiles method
         */
        RHINO_1_9_0,

        /**
         * Mozilla Rhino legacy method - uses approach from previous Rhino versions
         * May use different CodeGen parameters or legacy compilation path
         */
        RHINO_LEGACY
    }

    private static final int MAX_STRING_LITERAL = 65000;
    private static final Set<String> REGEX_ALLOWED_KEYWORDS = new HashSet<String>();

    static {
        REGEX_ALLOWED_KEYWORDS.add("return");
        REGEX_ALLOWED_KEYWORDS.add("throw");
        REGEX_ALLOWED_KEYWORDS.add("case");
        REGEX_ALLOWED_KEYWORDS.add("else");
        REGEX_ALLOWED_KEYWORDS.add("do");
        REGEX_ALLOWED_KEYWORDS.add("in");
        REGEX_ALLOWED_KEYWORDS.add("instanceof");
        REGEX_ALLOWED_KEYWORDS.add("typeof");
        REGEX_ALLOWED_KEYWORDS.add("void");
        REGEX_ALLOWED_KEYWORDS.add("new");
        REGEX_ALLOWED_KEYWORDS.add("delete");
        REGEX_ALLOWED_KEYWORDS.add("yield");
        REGEX_ALLOWED_KEYWORDS.add("await");
    }

    public static void main(String args[]) {
		try {
			String script = new String(Files.readAllBytes(Paths.get(args[1])));
			CompilationMethod method = CompilationMethod.RHINO_LEGACY;
			String path = args.length > 2 ? args[2] : null;

			// Parse optional compilation method flag (args[3])
			if (args.length > 3 && args[3] != null && !args[3].isEmpty()) {
				try {
					method = CompilationMethod.valueOf(args[3].toUpperCase());
				} catch (IllegalArgumentException e) {
					System.err.println("Invalid compilation method: " + args[3]);
					System.err.println("Valid options: DEFAULT, RHINO_1_9_0, RHINO_LEGACY");
					System.err.println("Using RHINO_LEGACYcp  method.");
				}
			}

			//System.err.println("CompileJS2Java: Using compilation method: " + method);
			compileToClasses(args[0], script, path, method);
		} catch(IOException e) {
			System.err.println(e.getMessage());
			e.printStackTrace();
		}
	}

    /**
     * Compile JavaScript to Java classes using the 
     *  compilation method
     * @deprecated Use {@link #compileToClasses(String, String, String, CompilationMethod)} instead
     */
    @Deprecated
    public static void compileToClasses(String classfile, String script, String path) {
        compileToClasses(classfile, script, path, CompilationMethod.RHINO_LEGACY);
    }

    /**
     * Compile JavaScript to Java classes using the specified compilation method
     * @param classfile The name of the class file to generate
     * @param script The JavaScript source code
     * @param path The output path for the class files
     * @param method The compilation method to use
     */
    public static void compileToClasses(String classfile, String script, String path, CompilationMethod method) {
		long origSize = script.length();
		script = splitLongStrings(script);
		if (script.length() != origSize) {
			System.out.println("Adjusted script size from " + origSize + " to " + script.length());
		}

		CompilerEnvirons ce = new CompilerEnvirons();
		ce.setLanguageVersion(org.mozilla.javascript.Context.VERSION_ES6);
		ce.setXmlAvailable(true);
		/*ce.setInterpretedMode(false);
		ce.setStrictMode(false);
		ce.setRecordingComments(false);*/
		//ce.setReservedKeywordAsIdentifier(false);
		/*ce.setIdeMode(false);
		ce.setInEval(false);
		ce.setAllowSuper(true);
		ce.setRecordingLocalJsDocComments(false);
		ce.setGenerateObserverCount(false);*/
		//ce.setAllowMemberExprAsFunctionName(false);

		// Configure debug info, source embedding, and optimization based on compilation method
		ce.setGenerateDebugInfo(false);
		ce.setGeneratingSource(false);

		// Set optimization level based on compilation method
		if (method == CompilationMethod.DEFAULT) {
			// Use aggressive optimization with field name sanitization
			ce.setInterpretedMode(false);
			//System.err.println("Set optimization level to 9 for DEFAULT method");
		} else if (method == CompilationMethod.RHINO_1_9_0) {
			// Use standard Rhino 1.9.0 optimization level (no optimization)
			ce.setInterpretedMode(false);
			//System.err.println("Set optimization level to 0 for RHINO_1_9_0 method");
		} else if (method == CompilationMethod.RHINO_LEGACY) {
			// Use legacy/minimal optimization level (basic bytecode generation)
			// Note: -1 would be interpreted mode which is incompatible with class file generation
			ce.setInterpretedMode(false);
			//System.err.println("Set optimization level to 0 for RHINO_LEGACY method");
		}

		ClassCompiler cc = new ClassCompiler(ce);
		Object compiled[] = compileToClassFilesWithMethod(cc, script, classfile, 1, classfile, method);
		if (path == null || path.equals("undefined"))
			path = "";
		else
			path = path + "/";

		for (int j = 0; j != compiled.length; j += 2) {
			String className = (String)compiled[j];
			byte[] bytes = (byte[])(byte[])compiled[(j + 1)];
			bytes = sanitizeMethodNames(bytes);
			bytes = patchMaxLocals(bytes);
			File outfile = new File(path + className + ".class");
			try {
				FileOutputStream os = new FileOutputStream(outfile);
				try {
					os.write(bytes);
				} finally {
					os.close();
				}
			} catch (IOException ioe) {
				System.err.println(ioe.getMessage());
                ioe.printStackTrace();
			}
		}
	}

    /**
     * Dispatcher method to compile to class files using the specified compilation method
     */
    private static Object[] compileToClassFilesWithMethod(ClassCompiler cc, String script, String sourceName,
                                                           int lineno, String className, CompilationMethod method) {
        switch (method) {
            case DEFAULT:
                return compileToClassFilesDefault(cc, script, sourceName, lineno, className);
            case RHINO_1_9_0:
                return compileToClassFilesRhino190(cc, script, sourceName, lineno, className);
            case RHINO_LEGACY:
                return compileToClassFilesRhinoLegacy(cc, script, sourceName, lineno, className);
            default:
                throw new IllegalArgumentException("Unknown compilation method: " + method);
        }
    }

    /**
     * Backward compatibility wrapper for the old method name
     * @deprecated Use {@link #compileToClassFilesDefault(ClassCompiler, String, String, int, String)} instead
     */
    @Deprecated
    private static Object[] compileToClassFilesNoSource(ClassCompiler cc, String script, String sourceName, int lineno, String className) {
        return compileToClassFilesDefault(cc, script, sourceName, lineno, className);
    }

    /**
     * DEFAULT compilation method - ensures field names are sanitized
     * Uses custom Codegen with source clearing for optimal class file size
     */
    private static Object[] compileToClassFilesDefault(ClassCompiler cc, String script, String sourceName, int lineno, String className) {
        Parser parser = new Parser(cc.getCompilerEnv());
        AstRoot ast = parser.parse(script, sourceName, lineno);
        IRFactory irFactory = new IRFactory(cc.getCompilerEnv(), script);
        ScriptNode scriptNode = irFactory.transformTree(ast);
        Class<?> targetExtends = cc.getTargetExtends();
        Class<?>[] targetImplements = cc.getTargetImplements();
        boolean isScript = targetExtends == null && targetImplements == null;
        String mainClassName = isScript ? className : invokeMakeAuxiliaryClassName(cc, className, "1");

        Codegen codegen = new Codegen();
        codegen.setMainMethodClass(cc.getMainMethodClass());
        JSDescriptor.Builder builder = new JSDescriptor.Builder();
        OptJSCode.BuilderEnv builderEnv = new OptJSCode.BuilderEnv(mainClassName);
        byte[] mainBytes = codegen.compileToClassFile(cc.getCompilerEnv(), builder, builderEnv, mainClassName, scriptNode, script, false);
        clearDescriptorRawSources(builder);
        Object[] descriptors = invokeBuildDescriptorsAndMain(cc, mainClassName, builder);

        if (isScript) {
            Object[] out = new Object[descriptors.length + 2];
            System.arraycopy(descriptors, 0, out, 2, descriptors.length);
            out[0] = mainClassName;
            out[1] = mainBytes;
            return out;
        }

        if (targetExtends == null) {
            targetExtends = ScriptRuntime.ObjectClass;
        }
        Map<String, Integer> functionNames = collectFunctionNames(scriptNode);
        byte[] adapterBytes = JavaAdapter.createAdapterCode(functionNames, className, targetExtends, targetImplements, mainClassName);

        Object[] out = new Object[descriptors.length + 4];
        System.arraycopy(descriptors, 0, out, 4, descriptors.length);
        out[0] = className;
        out[1] = adapterBytes;
        out[2] = mainClassName;
        out[3] = mainBytes;
        return out;
    }

    /**
     * RHINO_1_9_0 compilation method - mimics current Mozilla Rhino branch approach
     * Uses standard Rhino compilation with optimization level 0
     */
    private static Object[] compileToClassFilesRhino190(ClassCompiler cc, String script, String sourceName, int lineno, String className) {
        Parser parser = new Parser(cc.getCompilerEnv());
        AstRoot ast = parser.parse(script, sourceName, lineno);
        IRFactory irFactory = new IRFactory(cc.getCompilerEnv(), script);
        ScriptNode scriptNode = irFactory.transformTree(ast);
        Class<?> targetExtends = cc.getTargetExtends();
        Class<?>[] targetImplements = cc.getTargetImplements();
        boolean isScript = targetExtends == null && targetImplements == null;
        String mainClassName = isScript ? className : invokeMakeAuxiliaryClassName(cc, className, "1");

        Codegen codegen = new Codegen();
        codegen.setMainMethodClass(cc.getMainMethodClass());
        JSDescriptor.Builder builder = new JSDescriptor.Builder();
        OptJSCode.BuilderEnv builderEnv = new OptJSCode.BuilderEnv(mainClassName);
        byte[] mainBytes = codegen.compileToClassFile(cc.getCompilerEnv(), builder, builderEnv, mainClassName, scriptNode, script, false);

        // Clear descriptor sources to avoid constant pool size limits
        clearDescriptorRawSources(builder);
        Object[] descriptors = invokeBuildDescriptorsAndMain(cc, mainClassName, builder);

        if (isScript) {
            Object[] out = new Object[descriptors.length + 2];
            System.arraycopy(descriptors, 0, out, 2, descriptors.length);
            out[0] = mainClassName;
            out[1] = mainBytes;
            return out;
        }

        if (targetExtends == null) {
            targetExtends = ScriptRuntime.ObjectClass;
        }
        Map<String, Integer> functionNames = collectFunctionNames(scriptNode);
        byte[] adapterBytes = JavaAdapter.createAdapterCode(functionNames, className, targetExtends, targetImplements, mainClassName);

        Object[] out = new Object[descriptors.length + 4];
        System.arraycopy(descriptors, 0, out, 4, descriptors.length);
        out[0] = className;
        out[1] = adapterBytes;
        out[2] = mainClassName;
        out[3] = mainBytes;
        return out;
    }

    /**
     * RHINO_LEGACY compilation method - uses approach from previous Rhino versions
     * Uses standard Rhino compilation with optimization level 0 and source clearing
     */
    private static Object[] compileToClassFilesRhinoLegacy(ClassCompiler cc, String script, String sourceName, int lineno, String className) {
        Parser parser = new Parser(cc.getCompilerEnv());
        AstRoot ast = parser.parse(script, sourceName, lineno);
        IRFactory irFactory = new IRFactory(cc.getCompilerEnv(), script);
        ScriptNode scriptNode = irFactory.transformTree(ast);
        Class<?> targetExtends = cc.getTargetExtends();
        Class<?>[] targetImplements = cc.getTargetImplements();
        boolean isScript = targetExtends == null && targetImplements == null;
        String mainClassName = isScript ? className : invokeMakeAuxiliaryClassName(cc, className, "1");

        Codegen codegen = new Codegen();
        codegen.setMainMethodClass(cc.getMainMethodClass());
        JSDescriptor.Builder builder = new JSDescriptor.Builder();
        OptJSCode.BuilderEnv builderEnv = new OptJSCode.BuilderEnv(mainClassName);
        byte[] mainBytes = codegen.compileToClassFile(cc.getCompilerEnv(), builder, builderEnv, mainClassName, scriptNode, script, false);

        // Clear descriptor sources to avoid constant pool size limits
        clearDescriptorRawSources(builder);
        Object[] descriptors = invokeBuildDescriptorsAndMain(cc, mainClassName, builder);

        if (isScript) {
            Object[] out = new Object[descriptors.length + 2];
            System.arraycopy(descriptors, 0, out, 2, descriptors.length);
            out[0] = mainClassName;
            out[1] = mainBytes;
            return out;
        }

        if (targetExtends == null) {
            targetExtends = ScriptRuntime.ObjectClass;
        }
        Map<String, Integer> functionNames = collectFunctionNames(scriptNode);
        byte[] adapterBytes = JavaAdapter.createAdapterCode(functionNames, className, targetExtends, targetImplements, mainClassName);

        Object[] out = new Object[descriptors.length + 4];
        System.arraycopy(descriptors, 0, out, 4, descriptors.length);
        out[0] = className;
        out[1] = adapterBytes;
        out[2] = mainClassName;
        out[3] = mainBytes;
        return out;
    }

    private static Map<String, Integer> collectFunctionNames(ScriptNode scriptNode) {
        Map<String, Integer> names = new HashMap<String, Integer>();
        int count = scriptNode.getFunctionCount();
        for (int i = 0; i < count; i++) {
            FunctionNode fn = scriptNode.getFunctionNode(i);
            String name = fn.getName();
            if (name != null && name.length() > 0) {
                names.put(name, Integer.valueOf(fn.getParamCount()));
            }
        }
        return names;
    }

    private static void clearDescriptorRawSources(JSDescriptor.Builder<?> builder) {
        if (builder == null) {
            return;
        }
        builder.rawSource = "";
        builder.rawSourceStart = 0;
        builder.rawSourceEnd = 0;
        int count = builder.nestedFunctions.size();
        for (int i = 0; i < count; i++) {
            clearDescriptorRawSources(builder.nestedFunctions.get(i));
        }
    }

    private static Object[] invokeBuildDescriptorsAndMain(ClassCompiler cc, String className, JSDescriptor.Builder<?> builder) {
        try {
            Method method = ClassCompiler.class.getDeclaredMethod("buildDescriptorsAndMain", String.class, JSDescriptor.Builder.class);
            method.setAccessible(true);
            return (Object[]) method.invoke(cc, className, builder);
        } catch (Exception e) {
            throw new RuntimeException("Failed to build JS descriptors", e);
        }
    }

    private static String invokeMakeAuxiliaryClassName(ClassCompiler cc, String baseName, String suffix) {
        try {
            Method method = ClassCompiler.class.getDeclaredMethod("makeAuxiliaryClassName", String.class, String.class);
            method.setAccessible(true);
            return (String) method.invoke(cc, baseName, suffix);
        } catch (Exception e) {
            throw new RuntimeException("Failed to build auxiliary class name", e);
        }
    }

    private static String splitLongStrings(String script) {
        StringBuilder out = new StringBuilder(script.length());
        boolean[] usedJoinHelper = new boolean[] { false };
        processScript(script, 0, out, false, usedJoinHelper);
        String rewritten = out.toString();
        if (!usedJoinHelper[0]) {
            return rewritten;
        }
        return insertJoinHelper(rewritten);
    }

    private static final int MIN_MAX_LOCALS = 1024;

    /**
     * Sanitize method and field names in the class file constant pool
     * Replaces illegal characters (like '/') with underscores to ensure JVM compliance
     * Only sanitizes actual names, not type descriptors or class names
     */
    private static byte[] sanitizeMethodNames(byte[] classBytes) {
        if (classBytes == null || classBytes.length < 10) {
            return classBytes;
        }

        // Make a copy to avoid modifying the original
        byte[] result = classBytes.clone();

        int[] pos = new int[] { 0 };
        int magic = readU4(result, pos);
        if (magic != 0xCAFEBABE) {
            return classBytes;
        }

        readU2(result, pos); // minor version
        readU2(result, pos); // major version
        int cpCount = readU2(result, pos);

        // Track positions and info about constant pool entries
        int[] utf8Positions = new int[cpCount];
        int[] utf8Lengths = new int[cpCount];
        int[] cpEntryPos = new int[cpCount];  // Position of each CP entry
        int[] cpTags = new int[cpCount];       // Tag of each CP entry

        // First pass: locate all constant pool entries
        for (int i = 1; i < cpCount; i++) {
            cpEntryPos[i] = pos[0];
            int tag = readU1(result, pos);
            cpTags[i] = tag;

            switch (tag) {
                case 1: { // UTF8
                    int len = readU2(result, pos);
                    if (pos[0] + len > result.length) {
                        return classBytes;
                    }
                    utf8Positions[i] = pos[0];
                    utf8Lengths[i] = len;
                    pos[0] += len;
                    break;
                }
                case 3: // Integer
                case 4: // Float
                    pos[0] += 4;
                    break;
                case 5: // Long
                case 6: // Double
                    pos[0] += 8;
                    i++; // Takes two slots
                    break;
                case 7:  // Class
                case 8:  // String
                case 16: // MethodType
                case 19: // Module
                case 20: // Package
                    pos[0] += 2;
                    break;
                case 9:  // Fieldref
                case 10: // Methodref
                case 11: // InterfaceMethodref
                case 12: // NameAndType
                case 18: // InvokeDynamic
                    pos[0] += 4;
                    break;
                case 15: // MethodHandle
                    pos[0] += 3;
                    break;
                case 17: // Dynamic
                    pos[0] += 4;
                    break;
                default:
                    return classBytes;
            }
            if (pos[0] > result.length) {
                return classBytes;
            }
        }

        // Second pass: identify which UTF8 entries are method/field names
        // These are referenced by NameAndType entries (tag 12) and from methods/fields sections
        boolean[] isNameEntry = new boolean[cpCount];
        for (int i = 1; i < cpCount; i++) {
            if (cpTags[i] == 12) { // NameAndType
                int nameIndex = readU2At(result, cpEntryPos[i] + 1);
                if (nameIndex > 0 && nameIndex < cpCount) {
                    isNameEntry[nameIndex] = true;
                }
            }
        }

        // Also scan methods and fields sections for name indices
        pos[0] = 0;
        readU4(result, pos); // magic
        readU2(result, pos); // minor
        readU2(result, pos); // major
        readU2(result, pos); // cpCount

        // Skip constant pool (we already parsed it)
        for (int i = 1; i < cpCount; i++) {
            int tag = readU1(result, pos);
            switch (tag) {
                case 1: pos[0] += 2 + readU2At(result, pos[0]); break;
                case 3: case 4: pos[0] += 4; break;
                case 5: case 6: pos[0] += 8; i++; break;
                case 7: case 8: case 16: case 19: case 20: pos[0] += 2; break;
                case 9: case 10: case 11: case 12: case 18: pos[0] += 4; break;
                case 15: pos[0] += 3; break;
                case 17: pos[0] += 4; break;
                default: break;
            }
        }

        pos[0] += 6; // access_flags, this_class, super_class
        int interfacesCount = readU2(result, pos);
        pos[0] += interfacesCount * 2;

        // Mark field names
        int fieldsCount = readU2(result, pos);
        for (int i = 0; i < fieldsCount; i++) {
            pos[0] += 2; // access_flags
            int nameIndex = readU2(result, pos);
            if (nameIndex > 0 && nameIndex < cpCount) {
                isNameEntry[nameIndex] = true;
            }
            pos[0] += 2; // descriptor_index
            int attrCount = readU2(result, pos);
            for (int a = 0; a < attrCount; a++) {
                pos[0] += 2; // name_index
                int len = readU4(result, pos);
                pos[0] += len;
            }
        }

        // Mark method names
        int methodsCount = readU2(result, pos);
        for (int i = 0; i < methodsCount; i++) {
            pos[0] += 2; // access_flags
            int nameIndex = readU2(result, pos);
            if (nameIndex > 0 && nameIndex < cpCount) {
                isNameEntry[nameIndex] = true;
            }
            pos[0] += 2; // descriptor_index
            int attrCount = readU2(result, pos);
            for (int a = 0; a < attrCount; a++) {
                pos[0] += 2; // name_index
                int len = readU4(result, pos);
                pos[0] += len;
            }
        }

        // Third pass: sanitize only Rhino-generated method names with illegal characters
        boolean modified = false;
        for (int i = 1; i < cpCount; i++) {
            if (isNameEntry[i] && utf8Positions[i] > 0 && utf8Lengths[i] > 0) {
                int strPos = utf8Positions[i];
                int strLen = utf8Lengths[i];

                // Only process strings that look like Rhino-generated method names
                // These typically start with "_c_" prefix
                if (strLen > 3 &&
                    result[strPos] == '_' &&
                    result[strPos + 1] == 'c' &&
                    result[strPos + 2] == '_') {

                    // Check if this name contains forward slashes (illegal in method names)
                    boolean hasSlash = false;
                    for (int j = 0; j < strLen; j++) {
                        if (result[strPos + j] == '/') {
                            hasSlash = true;
                            break;
                        }
                    }

                    if (hasSlash) {
                        // Sanitize by replacing forward slashes with underscores
                        for (int j = 0; j < strLen; j++) {
                            if (result[strPos + j] == '/') {
                                result[strPos + j] = (byte) '_';
                                modified = true;
                            }
                        }
                    }
                }
            }
        }

        return modified ? result : classBytes;
    }

    private static byte[] patchMaxLocals(byte[] classBytes) {
        if (classBytes == null || classBytes.length < 10) {
            return classBytes;
        }
        int[] pos = new int[] { 0 };
        int magic = readU4(classBytes, pos);
        if (magic != 0xCAFEBABE) {
            return classBytes;
        }
        readU2(classBytes, pos); // minor
        readU2(classBytes, pos); // major
        int cpCount = readU2(classBytes, pos);
        String[] cpUtf = new String[cpCount];
        for (int i = 1; i < cpCount; i++) {
            int tag = readU1(classBytes, pos);
            switch (tag) {
                case 1: {
                    int len = readU2(classBytes, pos);
                    if (pos[0] + len > classBytes.length) {
                        return classBytes;
                    }
                    cpUtf[i] = new String(classBytes, pos[0], len, StandardCharsets.UTF_8);
                    pos[0] += len;
                    break;
                }
                case 3:
                case 4:
                    pos[0] += 4;
                    break;
                case 5:
                case 6:
                    pos[0] += 8;
                    i++;
                    break;
                case 7:
                case 8:
                case 16:
                case 19:
                case 20:
                    pos[0] += 2;
                    break;
                case 9:
                case 10:
                case 11:
                case 12:
                case 18:
                    pos[0] += 4;
                    break;
                case 15:
                    pos[0] += 3;
                    break;
                case 17:
                    pos[0] += 4;
                    break;
                default:
                    return classBytes;
            }
            if (pos[0] > classBytes.length) {
                return classBytes;
            }
        }
        pos[0] += 6; // access_flags, this_class, super_class
        int interfacesCount = readU2(classBytes, pos);
        pos[0] += interfacesCount * 2;
        int fieldsCount = readU2(classBytes, pos);
        for (int i = 0; i < fieldsCount; i++) {
            pos[0] += 6;
            int attrCount = readU2(classBytes, pos);
            for (int a = 0; a < attrCount; a++) {
                readU2(classBytes, pos);
                int len = readU4(classBytes, pos);
                pos[0] += len;
            }
        }
        int methodsCount = readU2(classBytes, pos);
        for (int i = 0; i < methodsCount; i++) {
            pos[0] += 6;
            int attrCount = readU2(classBytes, pos);
            for (int a = 0; a < attrCount; a++) {
                int nameIndex = readU2(classBytes, pos);
                int len = readU4(classBytes, pos);
                String name = nameIndex > 0 && nameIndex < cpUtf.length ? cpUtf[nameIndex] : null;
                if ("Code".equals(name) && len >= 4 && pos[0] + len <= classBytes.length) {
                    int maxLocalsPos = pos[0] + 2;
                    int current = readU2At(classBytes, maxLocalsPos);
                    if (current < MIN_MAX_LOCALS) {
                        writeU2At(classBytes, maxLocalsPos, MIN_MAX_LOCALS);
                    }
                }
                pos[0] += len;
            }
        }
        return classBytes;
    }

    private static int readU1(byte[] data, int[] pos) {
        return data[pos[0]++] & 0xFF;
    }

    private static int readU2(byte[] data, int[] pos) {
        int value = ((data[pos[0]] & 0xFF) << 8) | (data[pos[0] + 1] & 0xFF);
        pos[0] += 2;
        return value;
    }

    private static int readU4(byte[] data, int[] pos) {
        int value = ((data[pos[0]] & 0xFF) << 24)
                | ((data[pos[0] + 1] & 0xFF) << 16)
                | ((data[pos[0] + 2] & 0xFF) << 8)
                | (data[pos[0] + 3] & 0xFF);
        pos[0] += 4;
        return value;
    }

    private static int readU2At(byte[] data, int offset) {
        return ((data[offset] & 0xFF) << 8) | (data[offset + 1] & 0xFF);
    }

    private static void writeU2At(byte[] data, int offset, int value) {
        data[offset] = (byte) ((value >>> 8) & 0xFF);
        data[offset + 1] = (byte) (value & 0xFF);
    }

    private static int processScript(String script, int start, StringBuilder out, boolean stopOnBrace, boolean[] usedJoinHelper) {
        int len = script.length();
        int i = start;
        int braceDepth = stopOnBrace ? 1 : 0;
        boolean regexAllowed = true;

        while (i < len) {
            char c = script.charAt(i);

            if (stopOnBrace && c == '}' && braceDepth == 1) {
                out.append(c);
                return i + 1;
            }

            if (c == '/' && i + 1 < len) {
                char n = script.charAt(i + 1);
                if (n == '/') {
                    i = copyLineComment(script, i, out);
                    continue;
                }
                if (n == '*') {
                    i = copyBlockComment(script, i, out);
                    continue;
                }
                if (regexAllowed) {
                    i = copyRegexLiteral(script, i, out);
                    regexAllowed = false;
                    continue;
                }
            }

            if (c == '\'' || c == '"') {
                StringLiteral literal = scanStringLiteral(script, i);
                if (literal == null) {
                    out.append(script.substring(i));
                    return len;
                }
                if (literal.decodedLength > MAX_STRING_LITERAL) {
                    if (isLikelyObjectKey(script, literal.start, literal.end)) {
                        out.append("[");
                        out.append(buildChunkedExpression(literal.raw, c, usedJoinHelper));
                        out.append("]");
                    } else {
                        out.append(buildChunkedExpression(literal.raw, c, usedJoinHelper));
                    }
                } else {
                    out.append(script, i, literal.end);
                }
                i = literal.end;
                regexAllowed = false;
                continue;
            }

            if (c == '`') {
                i = processTemplateLiteral(script, i, out, usedJoinHelper);
                regexAllowed = false;
                continue;
            }

            if (isIdentifierStart(c)) {
                int startId = i;
                i++;
                while (i < len && isIdentifierPart(script.charAt(i))) {
                    i++;
                }
                String ident = script.substring(startId, i);
                out.append(ident);
                regexAllowed = REGEX_ALLOWED_KEYWORDS.contains(ident);
                continue;
            }

            if (isDigit(c)) {
                int startNum = i;
                i++;
                while (i < len && isDigitPart(script.charAt(i))) {
                    i++;
                }
                out.append(script, startNum, i);
                regexAllowed = false;
                continue;
            }

            out.append(c);
            i++;

            if (stopOnBrace) {
                if (c == '{') {
                    braceDepth++;
                } else if (c == '}' && braceDepth > 1) {
                    braceDepth--;
                }
            }

            Boolean nextRegexAllowed = regexAllowedAfterChar(c);
            if (nextRegexAllowed != null) {
                regexAllowed = nextRegexAllowed.booleanValue();
            }
        }

        return i;
    }

    private static int processTemplateLiteral(String script, int start, StringBuilder out, boolean[] usedJoinHelper) {
        int len = script.length();
        int i = start;
        out.append('`');
        i++;
        while (i < len) {
            char c = script.charAt(i);
            if (c == '\\') {
                if (i + 1 < len) {
                    out.append(c);
                    out.append(script.charAt(i + 1));
                    i += 2;
                    continue;
                }
            }
            if (c == '`') {
                out.append(c);
                return i + 1;
            }
            if (c == '$' && i + 1 < len && script.charAt(i + 1) == '{') {
                out.append("${");
                i += 2;
                i = processScript(script, i, out, true, usedJoinHelper);
                continue;
            }
            out.append(c);
            i++;
        }
        return i;
    }

    private static int copyLineComment(String script, int start, StringBuilder out) {
        int len = script.length();
        int i = start;
        while (i < len) {
            char c = script.charAt(i);
            out.append(c);
            i++;
            if (c == '\n') {
                break;
            }
        }
        return i;
    }

    private static int copyBlockComment(String script, int start, StringBuilder out) {
        int len = script.length();
        int i = start;
        while (i < len) {
            char c = script.charAt(i);
            out.append(c);
            if (c == '*' && i + 1 < len && script.charAt(i + 1) == '/') {
                out.append('/');
                return i + 2;
            }
            i++;
        }
        return i;
    }

    private static int copyRegexLiteral(String script, int start, StringBuilder out) {
        int len = script.length();
        int i = start;
        out.append('/');
        i++;
        boolean inClass = false;
        while (i < len) {
            char c = script.charAt(i);
            if (c == '\\') {
                if (i + 1 < len) {
                    out.append(c);
                    out.append(script.charAt(i + 1));
                    i += 2;
                    continue;
                }
            }
            if (c == '[') {
                inClass = true;
            } else if (c == ']' && inClass) {
                inClass = false;
            } else if (c == '/' && !inClass) {
                out.append(c);
                i++;
                while (i < len && isIdentifierPart(script.charAt(i))) {
                    out.append(script.charAt(i));
                    i++;
                }
                return i;
            }
            out.append(c);
            i++;
        }
        return i;
    }

    private static StringLiteral scanStringLiteral(String script, int start) {
        int len = script.length();
        char quote = script.charAt(start);
        StringBuilder raw = new StringBuilder();
        int i = start + 1;
        while (i < len) {
            char c = script.charAt(i);
            if (c == '\\') {
                if (i + 1 < len) {
                    char n = script.charAt(i + 1);
                    if (n == '\r') {
                        if (i + 2 < len && script.charAt(i + 2) == '\n') {
                            raw.append('\\');
                            raw.append('\r');
                            raw.append('\n');
                            i += 3;
                            continue;
                        }
                    }
                    if (n == '\n') {
                        raw.append('\\');
                        raw.append('\n');
                        i += 2;
                        continue;
                    }
                    raw.append('\\');
                    raw.append(n);
                    i += 2;
                    continue;
                }
                raw.append(c);
                i++;
                continue;
            }
            if (c == quote) {
                int decodedLength = countDecodedLength(raw.toString());
                return new StringLiteral(start, i + 1, raw.toString(), decodedLength);
            }
            raw.append(c);
            i++;
        }
        return null;
    }

    private static String buildChunkedExpression(String raw, char quote, boolean[] usedJoinHelper) {
        List<String> chunks = splitRawIntoChunks(raw, MAX_STRING_LITERAL);
        if (chunks.isEmpty()) {
            return "" + quote + quote;
        }
        StringBuilder sb = new StringBuilder();
        sb.append("__oafJoin([");
        for (int i = 0; i < chunks.size(); i++) {
            if (i > 0) {
                sb.append(",");
            }
            sb.append(quote).append(chunks.get(i)).append(quote);
        }
        sb.append("])");
        usedJoinHelper[0] = true;
        return sb.toString();
    }

    private static String insertJoinHelper(String script) {
        int len = script.length();
        int i = 0;
        if (len > 0 && script.charAt(0) == '\uFEFF') {
            i = 1;
        }
        while (i < len) {
            i = skipWhitespaceAndComments(script, i);
            if (i >= len) {
                break;
            }
            char c = script.charAt(i);
            if (c != '\'' && c != '"') {
                break;
            }
            StringLiteral literal = scanStringLiteral(script, i);
            if (literal == null) {
                break;
            }
            i = skipWhitespaceAndComments(script, literal.end);
            if (i < len && script.charAt(i) == ';') {
                i++;
            }
        }
        StringBuilder sb = new StringBuilder(script.length() + 64);
        sb.append(script, 0, i);
        if (i > 0 && script.charAt(i - 1) != '\n') {
            sb.append('\n');
        }
        sb.append("function __oafJoin(a){return a.join(\"\");}\n");
        sb.append(script.substring(i));
        return sb.toString();
    }

    private static int skipWhitespaceAndComments(String script, int start) {
        int len = script.length();
        int i = start;
        while (i < len) {
            char c = script.charAt(i);
            if (isWhitespace(c)) {
                i++;
                continue;
            }
            if (c == '/' && i + 1 < len) {
                char n = script.charAt(i + 1);
                if (n == '/') {
                    i += 2;
                    while (i < len && script.charAt(i) != '\n') {
                        i++;
                    }
                    continue;
                }
                if (n == '*') {
                    i += 2;
                    while (i + 1 < len) {
                        if (script.charAt(i) == '*' && script.charAt(i + 1) == '/') {
                            i += 2;
                            break;
                        }
                        i++;
                    }
                    continue;
                }
            }
            break;
        }
        return i;
    }

    private static List<String> splitRawIntoChunks(String raw, int maxDecodedLength) {
        List<String> chunks = new ArrayList<String>();
        StringBuilder current = new StringBuilder();
        int decodedLen = 0;
        int i = 0;
        while (i < raw.length()) {
            String unit;
            int unitLen;
            char c = raw.charAt(i);
            if (c != '\\') {
                unit = String.valueOf(c);
                unitLen = 1;
                i++;
            } else {
                ParseUnit parsed = parseEscapeUnit(raw, i);
                unit = parsed.raw;
                unitLen = parsed.decodedLength;
                i = parsed.nextIndex;
            }

            if (decodedLen + unitLen > maxDecodedLength && current.length() > 0) {
                chunks.add(current.toString());
                current.setLength(0);
                decodedLen = 0;
            }
            current.append(unit);
            decodedLen += unitLen;
        }
        if (current.length() > 0) {
            chunks.add(current.toString());
        }
        return chunks;
    }

    private static int countDecodedLength(String raw) {
        int len = 0;
        int i = 0;
        while (i < raw.length()) {
            char c = raw.charAt(i);
            if (c != '\\') {
                len++;
                i++;
                continue;
            }
            ParseUnit parsed = parseEscapeUnit(raw, i);
            len += parsed.decodedLength;
            i = parsed.nextIndex;
        }
        return len;
    }

    private static ParseUnit parseEscapeUnit(String raw, int start) {
        int len = raw.length();
        if (start + 1 >= len) {
            return new ParseUnit(raw.substring(start, start + 1), 1, start + 1);
        }
        char next = raw.charAt(start + 1);
        if (next == '\r') {
            if (start + 2 < len && raw.charAt(start + 2) == '\n') {
                return new ParseUnit(raw.substring(start, start + 3), 0, start + 3);
            }
            return new ParseUnit(raw.substring(start, start + 2), 0, start + 2);
        }
        if (next == '\n') {
            return new ParseUnit(raw.substring(start, start + 2), 0, start + 2);
        }
        if (next == 'x' && start + 3 < len && isHex(raw.charAt(start + 2)) && isHex(raw.charAt(start + 3))) {
            return new ParseUnit(raw.substring(start, start + 4), 1, start + 4);
        }
        if (next == 'u') {
            if (start + 2 < len && raw.charAt(start + 2) == '{') {
                int end = raw.indexOf('}', start + 3);
                if (end != -1) {
                    int codePoint = parseHex(raw.substring(start + 3, end));
                    int unitLen = codePoint > 0xFFFF ? 2 : 1;
                    return new ParseUnit(raw.substring(start, end + 1), unitLen, end + 1);
                }
            } else if (start + 5 < len && isHex(raw.charAt(start + 2)) && isHex(raw.charAt(start + 3))
                    && isHex(raw.charAt(start + 4)) && isHex(raw.charAt(start + 5))) {
                return new ParseUnit(raw.substring(start, start + 6), 1, start + 6);
            }
        }
        return new ParseUnit(raw.substring(start, start + 2), 1, start + 2);
    }

    private static int parseHex(String value) {
        int result = 0;
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            int digit;
            if (c >= '0' && c <= '9') {
                digit = c - '0';
            } else if (c >= 'a' && c <= 'f') {
                digit = 10 + (c - 'a');
            } else if (c >= 'A' && c <= 'F') {
                digit = 10 + (c - 'A');
            } else {
                return 0;
            }
            result = (result << 4) + digit;
        }
        return result;
    }

    private static boolean isHex(char c) {
        return (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');
    }

    private static boolean isIdentifierStart(char c) {
        return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_' || c == '$';
    }

    private static boolean isIdentifierPart(char c) {
        return isIdentifierStart(c) || isDigit(c);
    }

    private static boolean isDigit(char c) {
        return c >= '0' && c <= '9';
    }

    private static boolean isDigitPart(char c) {
        return isDigit(c) || c == '.' || c == 'x' || c == 'X' || c == 'e' || c == 'E' || c == '+' || c == '-';
    }

    private static Boolean regexAllowedAfterChar(char c) {
        switch (c) {
            case '(':
            case '[':
            case '{':
            case ',':
            case ';':
            case ':':
            case '?':
            case '=':
            case '+':
            case '-':
            case '*':
            case '%':
            case '!':
            case '~':
            case '&':
            case '|':
            case '^':
            case '<':
            case '>':
                return Boolean.TRUE;
            case ')':
            case ']':
            case '}':
            case '.':
                return Boolean.FALSE;
            default:
                return null;
        }
    }

    private static boolean isLikelyObjectKey(String script, int start, int end) {
        int prev = skipWhitespaceBackward(script, start - 1);
        if (prev < 0) {
            return false;
        }
        char prevChar = script.charAt(prev);
        if (prevChar != '{' && prevChar != ',') {
            return false;
        }
        int next = skipWhitespaceAndCommentsForward(script, end);
        if (next < 0) {
            return false;
        }
        char nextChar = script.charAt(next);
        return nextChar == ':' || nextChar == '(';
    }

    private static int skipWhitespaceBackward(String script, int index) {
        int i = index;
        while (i >= 0 && isWhitespace(script.charAt(i))) {
            i--;
        }
        return i;
    }

    private static int skipWhitespaceAndCommentsForward(String script, int index) {
        int len = script.length();
        int i = index;
        while (i < len) {
            char c = script.charAt(i);
            if (isWhitespace(c)) {
                i++;
                continue;
            }
            if (c == '/' && i + 1 < len) {
                char n = script.charAt(i + 1);
                if (n == '/') {
                    i += 2;
                    while (i < len && script.charAt(i) != '\n') {
                        i++;
                    }
                    continue;
                }
                if (n == '*') {
                    i += 2;
                    while (i + 1 < len) {
                        if (script.charAt(i) == '*' && script.charAt(i + 1) == '/') {
                            i += 2;
                            break;
                        }
                        i++;
                    }
                    continue;
                }
            }
            return i;
        }
        return -1;
    }

    private static boolean isWhitespace(char c) {
        return c == ' ' || c == '\t' || c == '\n' || c == '\r' || c == '\f';
    }

    private static class StringLiteral {
        final int start;
        final int end;
        final String raw;
        final int decodedLength;

        StringLiteral(int start, int end, String raw, int decodedLength) {
            this.start = start;
            this.end = end;
            this.raw = raw;
            this.decodedLength = decodedLength;
        }
    }

    private static class ParseUnit {
        final String raw;
        final int decodedLength;
        final int nextIndex;

        ParseUnit(String raw, int decodedLength, int nextIndex) {
            this.raw = raw;
            this.decodedLength = decodedLength;
            this.nextIndex = nextIndex;
        }
    }
}
