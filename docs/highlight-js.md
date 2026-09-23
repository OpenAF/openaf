# Bundled highlight.js

Updated on 2026-09-20 from 11.4.0 to 11.12.0.

`js/highlight.js` is a single minified browser bundle: the upstream common build followed by these upstream language modules: prolog, powershell, pgsql, awk, handlebars, asciidoc, dos, nginx and dockerfile. This preserves all 43 previously registered languages and adds the common build's GraphQL and WebAssembly grammars (45 total). No runtime CDN requests or module downloads are required. Existing `hljs.highlightAll()` integration and the locally maintained light/dark CSS remain compatible.

Source archive: https://registry.npmjs.org/@highlightjs/cdn-assets/-/cdn-assets-11.12.0.tgz

Verified npm integrity: `sha512-KvOKXODaiFmId9xaq3xc5xCL66wVLUuOngDbO9B/kewbFTqdGbn2nJxNhN3H5R1cgDTVj6R8vH0zgiNDEGjpDw==`

The upstream BSD-3-Clause notices remain in the bundle. To reproduce, extract the release archive and concatenate `highlight.min.js` followed by `languages/<name>.min.js` for the modules listed above, separated by newlines.

Validation: loaded the combined bundle, checked preservation of the previous language list, and invoked highlighting for every registered grammar. The opack browser regression suite also checks this source asset when `OPENAF_SOURCE` points to this checkout. Rebuild OpenAF using its normal build process to include the asset in a distributable JAR; editing this file does not update an already installed runtime.
