/* -*- Mode: java; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

package org.mozilla.javascript.optimizer;

import static org.mozilla.classfile.ClassFileWriter.ACC_FINAL;
import static org.mozilla.classfile.ClassFileWriter.ACC_PRIVATE;
import static org.mozilla.classfile.ClassFileWriter.ACC_PUBLIC;
import static org.mozilla.classfile.ClassFileWriter.ACC_STATIC;
import static org.mozilla.classfile.ClassFileWriter.ACC_VOLATILE;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import org.mozilla.classfile.ByteCode;
import org.mozilla.classfile.ClassFileWriter;
import org.mozilla.javascript.CodeGenUtils;
import org.mozilla.javascript.CompilerEnvirons;
import org.mozilla.javascript.JSDescriptor;
import org.mozilla.javascript.Node;
import org.mozilla.javascript.ScriptOrFn;
import org.mozilla.javascript.Token;
import org.mozilla.javascript.ast.FunctionNode;
import org.mozilla.javascript.ast.Name;
import org.mozilla.javascript.ast.ScriptNode;
import org.mozilla.javascript.ast.TemplateCharacters;

/**
 * This class generates code for a given IR tree.
 *
 * @author Norris Boyd
 * @author Roger Lawrence
 */
/** OpenAF fork of Rhino 1.9.1 Codegen (MPL-2.0).
 * Upstream: org.mozilla:rhino:1.9.1 sources, optimizer/Codegen.java.
 * Kept in the optimizer package to use pinned package-private optimizer contracts.
 * Only class ownership and class-file-limit retries differ from upstream.
 */
public class OpenAFCodegen {
    private String entryClassName;

    /** Compile an IR already optimized by the pinned upstream Codegen. */
    public void compilePartitioned(CompilerEnvirons env, JSDescriptor.Builder<?> builder,
            String className, ScriptNode tree, String source) {
        compileToClassFile(env, builder, new OptJSCode.BuilderEnv(className),
                className, tree, source, false);
    }
    private int partitionSize = Integer.MAX_VALUE;
    private int shardStart;
    private int shardEnd;
    private Object[] generatedClasses;

    public Object[] getGeneratedClasses() { return generatedClasses; }

    String owner(ScriptNode n) {
        int shard = getIndex(n) / partitionSize;
        return shard == 0 ? entryClassName : entryClassName + "Shard" + shard;
    }

    private boolean owns(ScriptNode n) {
        int index = getIndex(n);
        return index >= shardStart && index < shardEnd;
    }

    private byte[] generateClasses(String rawSource) {
        var classes = new ArrayList<Object>();
        for (int start = 0; start < scriptOrFnNodes.length; start = shardEnd) {
            shardStart = start;
            shardEnd = (int) Math.min((long) start + partitionSize, scriptOrFnNodes.length);
            mainClassName = owner(scriptOrFnNodes[start]);
            mainClassSignature = ClassFileWriter.classNameToSignature(mainClassName);
            itsConstantList = null;
            itsConstantListSize = 0;
            classes.add(mainClassName);
            classes.add(generateCode(rawSource));
        }
        generatedClasses = classes.toArray();
        mainClassName = entryClassName;
        mainClassSignature = ClassFileWriter.classNameToSignature(mainClassName);
        return (byte[]) generatedClasses[1];
    }

    private void emitShardInitializers(ClassFileWriter cfw, boolean regexp) {
        String name = regexp ? REGEXP_INIT_METHOD_NAME : TEMPLATE_LITERAL_INIT_METHOD_NAME;
        String signature = regexp ? REGEXP_INIT_METHOD_SIGNATURE : TEMPLATE_LITERAL_INIT_METHOD_SIGNATURE;
        cfw.startMethod(name, signature, (short) (ACC_STATIC | ACC_PUBLIC));
        for (int start = 0; start < scriptOrFnNodes.length; ) {
            int end = (int) Math.min((long) start + partitionSize, scriptOrFnNodes.length);
            boolean needed = !regexp;
            for (int i = start; i < end; i++) needed |= scriptOrFnNodes[i].getRegexpCount() > 0;
            if (needed) {
                if (regexp) cfw.addALoad(0);
                cfw.addInvoke(ByteCode.INVOKESTATIC, owner(scriptOrFnNodes[start]),
                        start == 0 ? name + "Local" : name, signature);
            }
            start = end;
        }
        cfw.add(ByteCode.RETURN);
        cfw.stopMethod(regexp ? 1 : 0);
    }

    private byte[] compileToClassFile(
            CompilerEnvirons compilerEnv,
            JSDescriptor.Builder<?> builder,
            OptJSCode.BuilderEnv builderEnv,
            String mainClassName,
            ScriptNode scriptOrFn,
            String rawSource,
            boolean returnFunction) {
        this.compilerEnv = compilerEnv;


        if (Token.printTrees) {
            System.out.println(scriptOrFn.toStringTree(scriptOrFn));
        }

        if (returnFunction) {
            CodeGenUtils.fillInForTopLevelFunction(
                    builder, scriptOrFn.getFunctionNode(0), rawSource, compilerEnv);
            scriptOrFn = scriptOrFn.getFunctionNode(0);
        } else {
            CodeGenUtils.fillInForScript(builder, scriptOrFn, rawSource, compilerEnv);
        }

        this.entryClassName = mainClassName;
        this.mainClassName = mainClassName;
        this.mainClassSignature = ClassFileWriter.classNameToSignature(mainClassName);

        initScriptNodesData(scriptOrFn, builder, builderEnv);

        // The optimized IR and descriptor tree stay intact across retries.
        for (partitionSize = 64; ; partitionSize /= 2) {
            for (int i = 0; i < builders.length; i++) {
                OptJSCode.Builder<?> code = (OptJSCode.Builder<?>) builders[i].code;
                OptJSCode.BuilderEnv env = new OptJSCode.BuilderEnv(owner(scriptOrFnNodes[i]));
                OptJSCode.Builder<?> replacement = scriptOrFnNodes[i] instanceof FunctionNode
                        ? new OptJSFunctionCode.Builder(env) : new OptJSScriptCode.Builder(env);
                replacement.index = code.index;
                replacement.methodName = code.methodName;
                replacement.methodType = code.methodType;
                replacement.resumeName = code.resumeName;
                replacement.resumeType = code.resumeType;
                if (builders[i].constructor == code) builders[i].constructor = replacement;
                builders[i].setCode(replacement);
            }
            try {
                return generateClasses(rawSource);
            } catch (ClassFileWriter.ClassFileFormatException ex) {
                if (partitionSize == 1) {
                    throw new IllegalArgumentException(
                            "Native compilation limit: a single function body cannot fit in a JVM class", ex);
                }
            }
        }
    }

    private <U extends ScriptOrFn<U>> void initScriptNodesData(
            ScriptNode scriptOrFn,
            JSDescriptor.Builder<U> builder,
            OptJSCode.BuilderEnv builderEnv) {
        ArrayList<ScriptNode> x = new ArrayList<>();
        ArrayList<JSDescriptor.Builder<?>> b = new ArrayList<>();
        collectScriptNodes_r(scriptOrFn, builder, builderEnv, x, b);

        int count = x.size();
        scriptOrFnNodes = new ScriptNode[count];
        builders = new JSDescriptor.Builder[count];
        scriptOrFnNodes = x.toArray(scriptOrFnNodes);
        builders = b.toArray(builders);

        scriptOrFnIndexes = new HashMap<>();
        for (int i = 0; i != count; ++i) {
            scriptOrFnIndexes.put(scriptOrFnNodes[i], i);
        }
    }

    private <U extends ScriptOrFn<U>> void collectScriptNodes_r(
            ScriptNode n,
            JSDescriptor.Builder<U> builder,
            OptJSCode.BuilderEnv builderEnv,
            List<ScriptNode> x,
            List<JSDescriptor.Builder<?>> b) {

        @SuppressWarnings("unchecked")
        OptJSCode.Builder<U> code =
                (OptJSCode.Builder<U>)
                        ((n instanceof FunctionNode)
                                ? new OptJSFunctionCode.Builder(builderEnv)
                                : new OptJSScriptCode.Builder(builderEnv));
        code.index = x.size();
        code.methodName = getBodyMethodName(n, x.size());
        code.methodType = getNonDirectBodyMethodSIgnature(n);
        if (isGenerator(n)) {
            code.resumeName = code.methodName + "_gen";
            code.resumeType = GENERATOR_METHOD_SIGNATURE;
        }
        builder.setCode(code);
        builderEnv.hasRegExpLiterals |= (n.getRegexpCount() > 0);
        builderEnv.hasTemplateLiterals |= (n.getTemplateLiteralCount() > 0);
        CodeGenUtils.setConstructor(builder, n);

        x.add(n);
        b.add(builder);
        int nestedCount = n.getFunctionCount();
        for (int i = 0; i != nestedCount; ++i) {
            var f = n.getFunctionNode(i);
            var fb = builder.createChildBuilder();
            CodeGenUtils.fillInForNestedFunction(fb, builder, f);
            collectScriptNodes_r(f, fb, builderEnv, x, b);
        }
    }

    static byte[] generateOptJSCode(
            String mainClass,
            String methodName,
            String methodType,
            String resumeName,
            String resumeType,
            boolean isFunction,
            int index) {
        String sourceFile = "";
        ClassFileWriter cfw =
                new ClassFileWriter(
                        mainClass + "ojsc" + Integer.toString(index),
                        isFunction
                                ? "org.mozilla.javascript.optimizer.OptJSFunctionCode"
                                : "org.mozilla.javascript.optimizer.OptJSScriptCode",
                        sourceFile);
        generateOptJSCodeCtor(cfw, isFunction);
        generateOptJSCodeExecute(cfw, mainClass, methodName, methodType);
        generateOptJSCodeResume(cfw, mainClass, resumeName, GENERATOR_METHOD_SIGNATURE);
        return cfw.toByteArray();
    }

    private static void generateOptJSCodeCtor(ClassFileWriter cfw, boolean isFunction) {
        cfw.startMethod("<init>", "()V", ACC_PUBLIC);
        cfw.addALoad(0);
        cfw.addInvoke(
                ByteCode.INVOKESPECIAL,
                isFunction
                        ? "org.mozilla.javascript.optimizer.OptJSFunctionCode"
                        : "org.mozilla.javascript.optimizer.OptJSScriptCode",
                "<init>",
                "()V");
        cfw.add(ByteCode.RETURN);
        cfw.stopMethod(1);
    }

    private static void generateOptJSCodeExecute(
            ClassFileWriter cfw, String mainClass, String methodName, String methodType) {
        cfw.startMethod("execute", methodType, (short) (ACC_PUBLIC | ACC_FINAL));
        cfw.addALoad(1);
        cfw.addALoad(2);
        cfw.addALoad(3);
        cfw.addALoad(4);
        cfw.addALoad(5);
        cfw.addALoad(6);
        cfw.addInvoke(ByteCode.INVOKESTATIC, mainClass, methodName, methodType);
        cfw.add(ByteCode.ARETURN);
        cfw.stopMethod(7);
        // 5: this, cx, js function, new.target, scope, js this, args[]
    }

    private static void generateOptJSCodeResume(
            ClassFileWriter cfw, String mainClass, String methodName, String methodType) {
        cfw.startMethod("resume", methodType, (short) (ACC_PUBLIC | ACC_FINAL));
        if (methodName == null) {
            cfw.add(ByteCode.ACONST_NULL);
        } else {
            cfw.addALoad(1);
            cfw.addALoad(2);
            cfw.addALoad(3);
            cfw.addALoad(4);
            cfw.addILoad(5);
            cfw.addALoad(6);
            cfw.addInvoke(ByteCode.INVOKESTATIC, mainClass, methodName, methodType);
        }
        cfw.add(ByteCode.ARETURN);
        cfw.stopMethod(7);
        // 5: this, cx, js function, new.target, scope, js this, args[]
    }

    private byte[] generateCode(String rawSource) {
        boolean hasScript = (scriptOrFnNodes[0].getType() == Token.SCRIPT);
        boolean hasFunctions = (scriptOrFnNodes.length > 1 || !hasScript);
        boolean isStrictMode = scriptOrFnNodes[0].isInStrictMode();

        String sourceFile = scriptOrFnNodes[0].getSourceName();
        ClassFileWriter cfw = new ClassFileWriter(mainClassName, SUPER_CLASS_NAME, sourceFile);
        cfw.addField(ID_FIELD_NAME, "I", ACC_PRIVATE);
        if (shardStart == 0) cfw.addField(
                DESCRIPTORS_FIELD_NAME,
                "[Lorg/mozilla/javascript/JSDescriptor;",
                (short) (ACC_PUBLIC | ACC_STATIC));

        generateLookupAccessor(cfw);

        int count = scriptOrFnNodes.length;
        for (int i = shardStart; i != shardEnd; ++i) {
            ScriptNode n = scriptOrFnNodes[i];

            OpenAFBodyCodegen bodygen = new OpenAFBodyCodegen();
            bodygen.cfw = cfw;
            bodygen.codegen = this;
            bodygen.compilerEnv = compilerEnv;
            bodygen.scriptOrFn = n;
            bodygen.scriptOrFnIndex = i;
            if (n instanceof FunctionNode) {
                bodygen.scriptOrFnType = "Lorg/mozilla/javascript/JSFunction;";
                bodygen.scriptOrFnClass = "org.mozilla.javascript.JSFunction";
            } else {
                bodygen.scriptOrFnType = "Lorg/mozilla/javascript/JSScript;";
                bodygen.scriptOrFnClass = "org.mozilla.javascript.JSScript";
            }

            // Upstream emission caches JVM label/local-slot ids on the IR. A failed
            // single-class attempt (or a smaller-shard retry) cannot reuse those ids.
            resetEmissionState(n);
            bodygen.generateBodyCode();

            if (n.getType() == Token.FUNCTION) {
                OptFunctionNode ofn = OptFunctionNode.get(n);
                if (ofn.isTargetOfDirectCall()) {
                    emitDirectConstructor(cfw, ofn);
                    int pcount = ofn.fnode.getParamCount();
                    if (pcount != 0) {
                        emitNonDirectCall(cfw, ofn);
                    }
                }
            }
        }

        emitRegExpInit(cfw);
        emitTemplateLiteralInit(cfw);
        emitConstantDudeInitializers(cfw);
        if (shardStart == 0 && partitionSize != Integer.MAX_VALUE) {
            emitShardInitializers(cfw, true);
            emitShardInitializers(cfw, false);
        }

        return cfw.toByteArray();
    }

    private static void resetEmissionState(Node node) {
        node.removeProp(Node.LABEL_ID_PROP);
        node.removeProp(Node.LOCAL_PROP);
        for (Node child = node.getFirstChild(); child != null; child = child.getNext()) {
            resetEmissionState(child);
        }
        Object ids = node.getProp(Node.OBJECT_IDS_PROP);
        if (ids instanceof Object[]) {
            for (Object id : (Object[]) ids) {
                if (id instanceof Node) resetEmissionState((Node) id);
            }
        }
        if (node instanceof FunctionNode) {
            Node init = ((FunctionNode) node).getGeneratorParamInitBlock();
            if (init != null) resetEmissionState(init);
        }
    }

    private void emitNonDirectCall(ClassFileWriter cfw, OptFunctionNode ofn) {
        // We'll make a method with the same name as the body method but with a non direct
        // signature.

        cfw.startMethod(
                getBodyMethodName(ofn.fnode),
                getNonDirectBodyMethodSIgnature(ofn.fnode),
                (short) (ACC_STATIC | ACC_PUBLIC));

        cfw.addALoad(0);
        cfw.addALoad(1);
        cfw.addALoad(2);
        cfw.addALoad(3);
        cfw.addALoad(4);
        cfw.addALoad(5);
        int pcount = ofn.fnode.getParamCount();
        if (pcount != 0) {
            // loop invariant:
            // stack top == arguments array from addALoad4()
            for (int p = 0; p != pcount; ++p) {
                cfw.add(ByteCode.ARRAYLENGTH);
                cfw.addPush(p);
                int undefArg = cfw.acquireLabel();
                int beyond = cfw.acquireLabel();
                cfw.add(ByteCode.IF_ICMPLE, undefArg);
                // get array[p]
                cfw.addALoad(5);
                cfw.addPush(p);
                cfw.add(ByteCode.AALOAD);
                cfw.add(ByteCode.GOTO, beyond);
                cfw.markLabel(undefArg);
                pushUndefined(cfw);
                cfw.markLabel(beyond);
                // Only one push
                cfw.adjustStackTop(-1);
                cfw.addPush(0.0);
                // restore invariant
                cfw.addALoad(5);
            }
        }

        cfw.addInvoke(
                ByteCode.INVOKESTATIC,
                mainClassName,
                getBodyMethodName(ofn.fnode),
                getBodyMethodSignature(ofn.fnode));
        cfw.add(ByteCode.ARETURN);

        cfw.stopMethod(6);
        // 5: function, cx, scope, js this, args[]
    }

    private void emitDirectConstructor(ClassFileWriter cfw, OptFunctionNode ofn) {
        /*
            we generate ..
                Scriptable directConstruct(<directCallArgs>) {
                    Scriptable newInstance = createObject(cx, scope);
                    Object val = <body-name>(cx, scope, newInstance, <directCallArgs>);
                    if (val instanceof Scriptable) {
                        return (Scriptable) val;
                    }
                    return newInstance;
                }
        */
        cfw.startMethod(
                getDirectCtorName(ofn.fnode),
                getBodyMethodSignature(ofn.fnode),
                (short) (ACC_STATIC | ACC_PUBLIC));

        int argCount = ofn.fnode.getParamCount();
        int firstLocal = (5 + argCount * 3) + 1;

        cfw.addALoad(1); // this
        cfw.add(ByteCode.CHECKCAST, OpenAFCodegen.JSFUNCTION_CLASS_NAME);
        cfw.addALoad(0); // cx
        cfw.addALoad(3); // scope
        cfw.addInvoke(
                ByteCode.INVOKEVIRTUAL,
                "org/mozilla/javascript/BaseFunction",
                "createObject",
                "(Lorg/mozilla/javascript/Context;"
                        + "Lorg/mozilla/javascript/Scriptable;"
                        + ")Lorg/mozilla/javascript/Scriptable;");
        cfw.addAStore(firstLocal);

        cfw.addALoad(0);
        cfw.addALoad(1);
        cfw.add(ByteCode.ACONST_NULL);
        cfw.addALoad(2);
        cfw.addALoad(firstLocal);
        for (int i = 0; i < argCount; i++) {
            cfw.addALoad(5 + (i * 3));
            cfw.addDLoad(6 + (i * 3));
        }
        cfw.addALoad(5 + argCount * 3);
        cfw.addInvoke(
                ByteCode.INVOKESTATIC,
                mainClassName,
                getBodyMethodName(ofn.fnode),
                getBodyMethodSignature(ofn.fnode));
        int exitLabel = cfw.acquireLabel();
        cfw.add(ByteCode.DUP); // make a copy of direct call result
        cfw.add(ByteCode.INSTANCEOF, "org/mozilla/javascript/Scriptable");
        cfw.add(ByteCode.IFEQ, exitLabel);
        // cast direct call result
        cfw.add(ByteCode.CHECKCAST, "org/mozilla/javascript/Scriptable");
        cfw.add(ByteCode.ARETURN);
        cfw.markLabel(exitLabel);

        cfw.addALoad(firstLocal);
        cfw.add(ByteCode.ARETURN);

        cfw.stopMethod((short) (firstLocal + 1));
    }

    static boolean isGenerator(ScriptNode node) {
        return (node.getType() == Token.FUNCTION) && ((FunctionNode) node).isGenerator();
    }

    private void generateLookupAccessor(ClassFileWriter cfw) {
        cfw.startMethod(
                "getLookup",
                "()Ljava/lang/invoke/MethodHandles$Lookup;",
                (short) (ACC_STATIC | ACC_PUBLIC));
        cfw.addInvoke(
                ByteCode.INVOKESTATIC,
                "java.lang.invoke.MethodHandles",
                "lookup",
                "()Ljava/lang/invoke/MethodHandles$Lookup;");
        cfw.add(ByteCode.ARETURN);
        cfw.stopMethod(0);
    }

    private void emitRegExpInit(ClassFileWriter cfw) {
        // precompile all regexp literals

        int totalRegCount = 0;
        for (int i = 0; i != scriptOrFnNodes.length; ++i) {
            if (owns(scriptOrFnNodes[i])) totalRegCount += scriptOrFnNodes[i].getRegexpCount();
        }
        if (totalRegCount == 0) {
            return;
        }

        cfw.startMethod(
                (shardStart == 0 && partitionSize != Integer.MAX_VALUE) ? REGEXP_INIT_METHOD_NAME + "Local" : REGEXP_INIT_METHOD_NAME,
                REGEXP_INIT_METHOD_SIGNATURE,
                (short) (ACC_STATIC | ACC_PUBLIC));
        cfw.addField("_reInitDone", "Z", (short) (ACC_STATIC | ACC_PRIVATE | ACC_VOLATILE));
        cfw.add(ByteCode.GETSTATIC, mainClassName, "_reInitDone", "Z");
        int doInit = cfw.acquireLabel();
        cfw.add(ByteCode.IFEQ, doInit);
        cfw.add(ByteCode.RETURN);
        cfw.markLabel(doInit);

        // get regexp proxy and store it in local slot 1
        cfw.addALoad(0); // context
        cfw.addInvoke(
                ByteCode.INVOKESTATIC,
                "org/mozilla/javascript/ScriptRuntime",
                "checkRegExpProxy",
                "(Lorg/mozilla/javascript/Context;" + ")Lorg/mozilla/javascript/RegExpProxy;");
        cfw.addAStore(1); // proxy

        // We could apply double-checked locking here but concurrency
        // shouldn't be a problem in practice
        for (int i = 0; i != scriptOrFnNodes.length; ++i) {
            ScriptNode n = scriptOrFnNodes[i];
            if (!owns(n)) continue;
            int regCount = n.getRegexpCount();
            for (int j = 0; j != regCount; ++j) {
                String reFieldName = getCompiledRegexpName(n, j);
                String reFieldType = "Ljava/lang/Object;";
                String reString = n.getRegexpString(j);
                String reFlags = n.getRegexpFlags(j);
                cfw.addField(reFieldName, reFieldType, (short) (ACC_STATIC | ACC_PRIVATE));
                cfw.addALoad(1); // proxy
                cfw.addALoad(0); // context
                cfw.addPush(reString);
                if (reFlags == null) {
                    cfw.add(ByteCode.ACONST_NULL);
                } else {
                    cfw.addPush(reFlags);
                }
                cfw.addInvoke(
                        ByteCode.INVOKEINTERFACE,
                        "org/mozilla/javascript/RegExpProxy",
                        "compileRegExp",
                        "(Lorg/mozilla/javascript/Context;"
                                + "Ljava/lang/String;Ljava/lang/String;"
                                + ")Ljava/lang/Object;");
                cfw.add(ByteCode.PUTSTATIC, mainClassName, reFieldName, reFieldType);
            }
        }

        cfw.addPush(1);
        cfw.add(ByteCode.PUTSTATIC, mainClassName, "_reInitDone", "Z");
        cfw.add(ByteCode.RETURN);
        cfw.stopMethod(2);
    }

    /**
     * Overview:
     *
     * <pre>
     * for each fn in functions(script) do
     *   let field = []
     *   for each templateLiteral in templateLiterals(fn) do
     *     let values = concat([[cooked(s), raw(s)] | s <- strings(templateLiteral)])
     *     field.push(values)
     *   end
     *   class[getTemplateLiteralName(fn)] = field
     * end
     * </pre>
     */
    private void emitTemplateLiteralInit(ClassFileWriter cfw) {
        // emit all template literals

        int totalTemplateLiteralCount = 0;
        for (ScriptNode n : scriptOrFnNodes) {
            totalTemplateLiteralCount += n.getTemplateLiteralCount();
        }

        cfw.startMethod(
                (shardStart == 0 && partitionSize != Integer.MAX_VALUE) ? TEMPLATE_LITERAL_INIT_METHOD_NAME + "Local" : TEMPLATE_LITERAL_INIT_METHOD_NAME,
                TEMPLATE_LITERAL_INIT_METHOD_SIGNATURE,
                (short) (ACC_STATIC | ACC_PUBLIC));
        cfw.addField("_qInitDone", "Z", (short) (ACC_STATIC | ACC_PRIVATE | ACC_VOLATILE));

        cfw.add(ByteCode.GETSTATIC, mainClassName, "_qInitDone", "Z");
        int doInit = cfw.acquireLabel();
        cfw.add(ByteCode.IFEQ, doInit);
        cfw.add(ByteCode.RETURN);
        cfw.markLabel(doInit);

        // We could apply double-checked locking here but concurrency
        // shouldn't be a problem in practice
        for (ScriptNode n : scriptOrFnNodes) {
            if (!owns(n)) continue;
            int qCount = n.getTemplateLiteralCount();
            if (qCount == 0) continue;
            String qFieldName = getTemplateLiteralName(n);
            String qFieldType = "[Ljava/lang/Object;";
            cfw.addField(qFieldName, qFieldType, (short) (ACC_STATIC | ACC_PRIVATE));
            cfw.addPush(qCount);
            cfw.add(ByteCode.ANEWARRAY, "java/lang/Object");
            for (int j = 0; j < qCount; ++j) {
                List<TemplateCharacters> strings = n.getTemplateLiteralStrings(j);
                cfw.add(ByteCode.DUP);
                cfw.addPush(j);
                cfw.addPush(strings.size() * 2);
                cfw.add(ByteCode.ANEWARRAY, "java/lang/String");
                int k = 0;
                for (TemplateCharacters s : strings) {
                    // cooked value
                    cfw.add(ByteCode.DUP);
                    cfw.addPush(k++);
                    if (s.getValue() != null) {
                        cfw.addPush(s.getValue());
                    } else {
                        cfw.add(ByteCode.ACONST_NULL);
                    }
                    cfw.add(ByteCode.AASTORE);
                    // raw value
                    cfw.add(ByteCode.DUP);
                    cfw.addPush(k++);
                    cfw.addPush(s.getRawValue());
                    cfw.add(ByteCode.AASTORE);
                }
                cfw.add(ByteCode.AASTORE);
            }
            cfw.add(ByteCode.PUTSTATIC, mainClassName, qFieldName, qFieldType);
        }

        cfw.addPush(true);
        cfw.add(ByteCode.PUTSTATIC, mainClassName, "_qInitDone", "Z");
        cfw.add(ByteCode.RETURN);
        cfw.stopMethod(0);
    }

    private void emitConstantDudeInitializers(ClassFileWriter cfw) {
        int N = itsConstantListSize;
        if (N == 0) return;

        cfw.startMethod("<clinit>", "()V", (short) (ACC_STATIC | ACC_FINAL));

        double[] array = itsConstantList;
        for (int i = 0; i != N; ++i) {
            double num = array[i];
            String constantName = "_k" + i;
            String constantType = getStaticConstantWrapperType(num);
            cfw.addField(constantName, constantType, (short) (ACC_STATIC | ACC_PRIVATE));
            int inum = (int) num;
            if (inum == num) {
                cfw.addPush(inum);
                cfw.addInvoke(
                        ByteCode.INVOKESTATIC,
                        "java/lang/Integer",
                        "valueOf",
                        "(I)Ljava/lang/Integer;");
            } else {
                cfw.addPush(num);
                addDoubleWrap(cfw);
            }
            cfw.add(ByteCode.PUTSTATIC, mainClassName, constantName, constantType);
        }

        cfw.add(ByteCode.RETURN);
        cfw.stopMethod(0);
    }

    void pushNumberAsObject(ClassFileWriter cfw, double num) {
        if (num == 0.0) {
            if (1 / num > 0) {
                // +0.0
                cfw.add(
                        ByteCode.GETSTATIC,
                        "org/mozilla/javascript/ScriptRuntime",
                        "zeroObj",
                        "Ljava/lang/Integer;");
            } else {
                cfw.addPush(num);
                addDoubleWrap(cfw);
            }

        } else if (num == 1.0) {
            cfw.add(
                    ByteCode.GETSTATIC,
                    "org/mozilla/javascript/optimizer/OptRuntime",
                    "oneObj",
                    "Ljava/lang/Integer;");
            return;

        } else if (num == -1.0) {
            cfw.add(
                    ByteCode.GETSTATIC,
                    "org/mozilla/javascript/optimizer/OptRuntime",
                    "minusOneObj",
                    "Ljava/lang/Integer;");

        } else if (Double.isNaN(num)) {
            cfw.add(
                    ByteCode.GETSTATIC,
                    "org/mozilla/javascript/ScriptRuntime",
                    "NaNobj",
                    "Ljava/lang/Double;");

        } else if (itsConstantListSize >= 2000) {
            // There appears to be a limit in the JVM on either the number
            // of static fields in a class or the size of the class
            // initializer. Either way, we can't have any more than 2000
            // statically init'd constants.
            cfw.addPush(num);
            addDoubleWrap(cfw);

        } else {
            int N = itsConstantListSize;
            int index = 0;
            if (N == 0) {
                itsConstantList = new double[64];
            } else {
                double[] array = itsConstantList;
                while (index != N && array[index] != num) {
                    ++index;
                }
                if (N == array.length) {
                    array = new double[N * 2];
                    System.arraycopy(itsConstantList, 0, array, 0, N);
                    itsConstantList = array;
                }
            }
            if (index == N) {
                itsConstantList[N] = num;
                itsConstantListSize = N + 1;
            }
            String constantName = "_k" + index;
            String constantType = getStaticConstantWrapperType(num);
            cfw.add(ByteCode.GETSTATIC, mainClassName, constantName, constantType);
        }
    }

    private static void addDoubleWrap(ClassFileWriter cfw) {
        cfw.addInvoke(
                ByteCode.INVOKESTATIC,
                "org/mozilla/javascript/optimizer/OptRuntime",
                "wrapDouble",
                "(D)Ljava/lang/Double;");
    }

    private static String getStaticConstantWrapperType(double num) {
        int inum = (int) num;
        if (inum == num) {
            return "Ljava/lang/Integer;";
        }
        return "Ljava/lang/Double;";
    }

    static void pushUndefined(ClassFileWriter cfw) {
        cfw.add(
                ByteCode.GETSTATIC,
                "org/mozilla/javascript/Undefined",
                "instance",
                "Ljava/lang/Object;");
    }

    int getIndex(ScriptNode n) {
        return scriptOrFnIndexes.get(n);
    }

    String getDirectCtorName(ScriptNode n) {
        return "_n" + getIndex(n);
    }

    String getBodyMethodName(ScriptNode n) {
        return getBodyMethodName(n, getIndex(n));
    }

    String getBodyMethodName(ScriptNode n, int index) {
        return "_c_" + cleanName(n) + "_" + index;
    }

    /**
     * List of illegal characters in unqualified names as specified in
     * https://docs.oracle.com/javase/specs/jvms/se25/html/jvms-4.html#jvms-4.2.2
     */
    private static Pattern illegalChars = Pattern.compile("[.;\\[/<>]");

    /** Gets a Java-compatible "informative" name for the ScriptOrFnNode */
    String cleanName(final ScriptNode n) {
        String result = "";
        if (n instanceof FunctionNode) {
            Name name = ((FunctionNode) n).getFunctionName();
            if (name == null) {
                result = "anonymous";
            } else {
                result = name.getIdentifier();
            }
        } else {
            result = "script";
        }
        return illegalChars.matcher(result).replaceAll("_");
    }

    String getNonDirectBodyMethodSIgnature(ScriptNode n) {
        StringBuilder sb = new StringBuilder();
        sb.append('(');
        sb.append("Lorg/mozilla/javascript/Context;");
        if (n instanceof FunctionNode) {
            sb.append("Lorg/mozilla/javascript/JSFunction;");
        } else {
            sb.append("Lorg/mozilla/javascript/JSScript;");
        }
        sb.append(
                "Ljava/lang/Object;"
                        + "Lorg/mozilla/javascript/Scriptable;"
                        + "Ljava/lang/Object;");
        sb.append("[Ljava/lang/Object;)Ljava/lang/Object;");
        return sb.toString();
    }

    String getBodyMethodSignature(ScriptNode n) {
        StringBuilder sb = new StringBuilder();
        sb.append('(');
        sb.append("Lorg/mozilla/javascript/Context;");
        if (n instanceof FunctionNode) {
            sb.append("Lorg/mozilla/javascript/JSFunction;");
        } else {
            sb.append("Lorg/mozilla/javascript/JSScript;");
        }
        sb.append(
                "Ljava/lang/Object;"
                        + "Lorg/mozilla/javascript/Scriptable;"
                        + "Ljava/lang/Object;");
        if (n.getType() == Token.FUNCTION) {
            OptFunctionNode ofn = OptFunctionNode.get(n);
            if (ofn.isTargetOfDirectCall()) {
                int pCount = ofn.fnode.getParamCount();
                for (int i = 0; i != pCount; i++) {
                    sb.append("Ljava/lang/Object;D");
                }
            }
        }
        sb.append("[Ljava/lang/Object;)Ljava/lang/Object;");
        return sb.toString();
    }

    String getCodeInitMethodName(OptFunctionNode ofn) {
        return "_i" + getIndex(ofn.fnode);
    }

    String getCompiledRegexpName(ScriptNode n, int regexpIndex) {
        return "_re" + getIndex(n) + "_" + regexpIndex;
    }

    String getTemplateLiteralName(ScriptNode n) {
        return "_q" + getIndex(n);
    }

    static RuntimeException badTree() {
        throw new RuntimeException("Bad tree in codegen");
    }

    public void setMainMethodClass(String className) {
        mainMethodClass = className;
    }

    static final String DEFAULT_MAIN_METHOD_CLASS = "org.mozilla.javascript.optimizer.OptRuntime";

    private static final String SUPER_CLASS_NAME = "java.lang.Object";

    static final String ID_FIELD_NAME = "_id";

    static final String DESCRIPTOR_CLASS_SIGNATURE = "Lorg/mozilla/javascript/JSDescriptor;";
    static final String DESCRIPTORS_FIELD_NAME = "_descriptors";
    static final String DESCRIPTORS_FIELD_SIGNATURE = "[" + DESCRIPTOR_CLASS_SIGNATURE;

    static final String REGEXP_INIT_METHOD_NAME = "_reInit";
    static final String REGEXP_INIT_METHOD_SIGNATURE = "(Lorg/mozilla/javascript/Context;)V";

    static final String TEMPLATE_LITERAL_INIT_METHOD_NAME = "_qInit";
    static final String TEMPLATE_LITERAL_INIT_METHOD_SIGNATURE = "()V";

    static final String CODE_INIT_SIGNATURE = "(Lorg/mozilla/javascript/Context;" + ")V";

    static final String CODE_CONSTRUCTOR_SIGNATURE = "(Lorg/mozilla/javascript/Context;I)V";

    static final String JSFUNCTION_CLASS_NAME = "org.mozilla.javascript.JSFunction";
    static final String JSFUNCTION_CLASS_SIGNATURE = "org/mozilla/javascript/JSFunction";
    static final String JSFUNCTION_CONSTRUCTOR_SIGNATURE =
            "("
                    + "Lorg/mozilla/javascript/Context;"
                    + "Lorg/mozilla/javascript/Scriptable;"
                    + "Lorg/mozilla/javascript/JSDescriptor;"
                    + "Lorg/mozilla/javascript/Scriptable;"
                    + "Lorg/mozilla/javascript/Scriptable;"
                    + ")V";

    static final String GENERATOR_METHOD_SIGNATURE =
            "("
                    + "Lorg/mozilla/javascript/Context;"
                    + "Lorg/mozilla/javascript/JSFunction;"
                    + "Ljava/lang/Object;"
                    + "Lorg/mozilla/javascript/Scriptable;"
                    + "I"
                    + "Ljava/lang/Object;)Ljava/lang/Object;";


    private CompilerEnvirons compilerEnv;

    ScriptNode[] scriptOrFnNodes;
    JSDescriptor.Builder[] builders;
    private HashMap<ScriptNode, Integer> scriptOrFnIndexes;

    private String mainMethodClass = DEFAULT_MAIN_METHOD_CLASS;

    String mainClassName;
    String mainClassSignature;

    private double[] itsConstantList;
    private int itsConstantListSize;
}
