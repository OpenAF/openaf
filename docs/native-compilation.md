# Native JavaScript compilation

`af.compileToJar` and `af.compileToClasses` share `CompileJS2Java` with the build
compiler. Their signatures and the `loadCompiled` / `requireCompiled` interfaces
are unchanged. Successful runtime compilation writes no notices to stdout.

Small scripts use the bundled Rhino generator. If Rhino 1.9.1 throws the
confirmed constant-pool error (`ClassFileFormatException: out of range index`),
OpenAF reuses the already parsed and optimized IR with its partitioned generator.
It does not split JavaScript statements or fall back to interpreted execution.

The requested name remains the entry class, with one shared descriptor registry.
Bodies are assigned in descriptor order to that class and deterministic
`<name>Shard1`, `<name>Shard2`, etc. classes. Each class initially owns at most
64 bodies, including the script body. Generators, literal helpers, direct-call
adapters, constructors, numeric constants, regular expressions, and template
storage stay with their owning body. Direct calls and function trampolines use
the owning class. Entry-class literal initialization delegates in descriptor
order. Class generation clears cached JVM labels and local slots between
attempts while preserving optimized IR, scopes, function indexes, and descriptors.

A shard class-file limit halves the partition size. If one body still cannot
fit, compilation reports `Native compilation limit` with the original cause.
Unrelated errors on the normal compilation path propagate without retry.
Every generated class is returned in the existing `(className, bytes)` layout,
so both writers include all shards. Function source slices and method-name
sanitization are retained; the `max_locals` repair still applies only to the
`<name>Main` descriptor builder. Compilation completes before publishing a JAR,
so a compilation failure preserves an existing artifact.

## Upstream provenance

`src/org/mozilla/javascript/optimizer/OpenAFCodegen.java` and
`OpenAFBodyCodegen.java` derive from `Codegen.java` and `BodyCodegen.java` in the
Maven source artifact `org.mozilla:rhino:1.9.1`. They retain the MPL-2.0 license.
The optimizer package placement is required for Rhino's package-private builder
and optimizer contracts. The bundled Rhino implementation and dependency version
remain unchanged. Changes are confined to body ownership, retry generation state,
shared registry access, and cross-class invocation and initialization.

## Regression verification

`tests/autoTestAll.Compile.{yaml,js}` covers JAR and loose-class execution,
`loadCompiled`, `requireCompiled`, interpreted/compiled language behavior,
constant-pool inspection, small-script behavior, adaptive partition sizing, and
failed JAR replacement. The deterministic 600-function fixture contains 36,000
unique literals and reproduces the upstream constant-pool exception.
