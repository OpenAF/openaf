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
- JavaScript/YAML: 2‑space indent; end statements with semicolons in JS; filenames use kebab/camel to match neighbors.
- No strict linter config is enforced; match surrounding style and minimize diff noise.

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

