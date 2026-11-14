# Repository Guidelines

## Project Structure & Module Organization
- Code: Java in `src/openaf/**` (packages `openaf.*`), plus JS utilities in `js/`, templating in `hbs/`, CSS in `css/`, fonts in `fonts/` and documentation in `docs/`.
- Build assets: `lib/`, `bin/`, `jslib/`, `jsmin/`.
- Outputs: `openaf.jar` and `openaf.jar.orig` at the repo root after a build.
- Tests: under `tests/` (paired `autoTestAll.*.yaml` orchestrators and `*.js` test logic).

## Build, Test, and Development Commands
- Build (OpenAF installed): `ojob build.yaml` — compiles Java and assembles `openaf.jar`.
- Build (local bootstrap): `_oaf/ojob build.yaml` — use the workflow from BUILD.md.
- Test (recommended): `cd tests && ojob autoTestAll.yaml` — runs the full suite and writes `autoTestAll.results.json` plus SVG summaries.
- Test (using built JAR): `cd tests && java -jar ../openaf.jar --ojob -e autoTestAll.yaml`.
- Quick run example: `java -jar openaf.jar --version` or `openaf -c 'print("ok");'` if CLI installed.

## Coding Style & Naming Conventions
- Java: standard conventions (classes `CamelCase`, methods/fields `camelCase`, constants `UPPER_SNAKE`). Indent with 4 spaces, UTF‑8, LF endings.
- Java packages: keep under `openaf.*`; place new plugins in `src/openaf/plugins/` when appropriate.
- JavaScript/YAML: use 2-space indentation in new code; preserve the surrounding indentation in existing blocks. Filenames use kebab/camel to match neighbors.
- JavaScript: omit optional statement-ending semicolons in new code. Retain required separators in `for` headers, between same-line statements, and wherever automatic semicolon insertion would change parsing (for example before a following `(` or `[` expression). Keep spacing readable and avoid reformatting unrelated legacy code.
- Code sections: separate logical sections (validation, setup, processing, cleanup and return/output) with a blank line. Keep closely related statements together; do not insert blank lines between every statement. This follows the section spacing found in older code such as `js/owrap.obj.js` at commit `3f1445b0` (2023-11-10).
- Section comments: introduce each logical code section with a short comment describing its purpose, using `//` in Java/JavaScript and `#` in YAML. Keep comments small and useful (for example, `// Set credentials` or `// Set timeout`); avoid narrating each statement. Apply these rules to new or changed sections without reformatting unrelated legacy code.
- ODoc: place documentation immediately above the corresponding function or the registration block for generated methods. Use `<odoc format="markdown">` for Markdown content, backticks for API names and parameters, and CDATA for examples or XML-sensitive text. Preserve help keys/signatures and ensure moved module documentation remains included in generated help.
- No strict linter config is enforced; match surrounding style and minimize diff noise.

## oJob YAML Coding Style
- Use `ojob.yaml` as the reference for reusable job definitions. Use 2-space indentation for new YAML and preserve the indentation of existing files. Match its indentless sequence style under keys such as `jobs:`, `expects:` and `check` lists.
- Separate jobs with a blank line and a short `#` comment naming their purpose; match existing dashed comment separators where used. Separate top-level configuration, job definitions and execution lists with blank lines when present.
- Give jobs descriptive names and keep related fields together: `name`, execution metadata (`type`, `typeArgs`, dependencies when applicable), `help`, `check`, then `exec`. Include only fields the job needs. Match nearby colon alignment within small related mappings, without realigning unrelated jobs.
- For reusable jobs, describe their purpose in `help.text` and inputs in `help.expects` (`name` and `desc`, plus `required` when applicable). Declare input validation and defaults in `check.in`, following existing chains such as `isString.default(...)` and `toBoolean.isBoolean.default(...)`.
- Use `exec: |` for multiline JavaScript so line breaks and section comments are preserved. Apply the JavaScript spacing, short section comments and semicolon rules above inside executable blocks.
- Follow existing `typeArgs.shortcut` conventions when exposing a shortcut (`name`, `keyArg`, and argument mappings as needed). Preserve established argument names and output contracts (`args`, `$set`/`$get`) when extending existing jobs.

## Testing Guidelines
- Framework: OpenAF oJob + JS tests in `tests/` driven by `autoTestAll.*.yaml`.
- Naming: add focused `autoTestAll.<Area>.{yaml,js}` pairs; prefer small, deterministic tests.
- Coverage: include tests for new behavior and regressions; update any golden outputs if applicable.
- Run `ojob autoTestAll.yaml` before pushing; ensure SVG badges (`tests/*.svg`) and `*.results.json` reflect success.

## Commit & Pull Request Guidelines
- Commits: imperative, concise subjects (e.g., "Add …", "Fix …", "Upgrade …"); group related changes.
- PRs: include a clear description, rationale, breaking‑changes note, and how to test. Link issues. Include build/test results and any doc updates.
- Checklist: build passes, tests green, no unrelated changes, follows directory/package conventions.

## Security & Configuration Tips
- Requirements: build with JDK 24+; runtime JRE 21+ (see README/BUILD). Avoid committing large binaries beyond the produced JARs. Review external deps in `pom.xml` and `dependencies.json` when updating.

