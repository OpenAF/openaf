# Regenerating the OpenAF Ajv bundle

From the repository root, with Node.js 22+ and npm installed:

```sh
npm ci --prefix tools/ajv --ignore-scripts
npm run build --prefix tools/ajv
```

`package.json` pins Ajv 8.20.0, ajv-formats 3.0.1, Browserify 17.0.1, Babel 7.28.5, and Terser 5.44.1. `package-lock.json` pins the complete dependency tree and integrity hashes. The generated `js/ajv.js` is self-contained and includes the draft-07, 2019-09, and 2020-12 constructors. OpenAF builds and runtime use this checked-in file without Node or npm.

The entrypoint preserves the global `Ajv` constructor and exposes internal `Ajv.OpenAF` helpers used by the OpenAF wrapper. It bundles ajv-formats, preserves custom format overrides, and isolates unknown-format rejection from Ajv's general strict-schema policy. The wrapper retains v6 equivalent-schema caching and routes schema registrations across draft engines.

Babel transpiles the library to ES5. Ajv's generated validators also use `code.es5` by default in the OpenAF wrapper. The build forces Babel's descriptor-based inherited-getter helper: Rhino 1.9.1's `Reflect.get` does not honor the supplied receiver for these getters. This substitution is asserted during generation and is scoped to the bundle; it does not change global `Reflect`. Babel helpers are scoped inside an IIFE to avoid polluting OpenAF globals.

`LICENSES.txt` in this directory collects the pinned Ajv packages' notices and notices for the generated Babel helpers and bundle wrappers. Update the Ajv section of the root `versionsAndDeps.json` and `LICENSES.txt` if dependencies change. The metadata contains local license text, so `buildLicenses.js` can regenerate the root notices without fetching a mutable upstream Ajv license.

After regeneration, rebuild OpenAF with `java -jar _oaf/openaf.jar --ojob -e build.yaml`. From `tests/`, run:

```sh
java -jar ../openaf.jar -c '__flags.OJOB_LOCALPATH="../_oaf/oJob-common"; oJobRunFile("autoTestAll.Schema.yaml");'
java -jar ../openaf.jar -c '__flags.OJOB_LOCALPATH="../_oaf/oJob-common"; oJobRunFile("autoTestAll.yaml");'
```

The local path is needed when the checkout's oPack registry does not resolve `oJobTest.yaml`. Schema tests exercise direct native-class loading, source loading, option translation, draft routing, defaults, references, formats, errors, and Sigil helper behavior. A successful build alone is not proof that compiled classes or documentation examples work.
