# Author and validate an oPack

Use the [package guide](https://github.com/openaf/openaf/blob/master/docs/opacks.md#6-building--publishing-an-opack) and [CLI implementation](https://github.com/openaf/openaf/blob/master/js/opack.js). Preserve the project's existing manifest format and version convention.

1. Define the exact package name, version, description, license, repository location, and runtime/dependency requirements in `.package.yaml` or `.package.json`. Use verified dependency expressions such as `>=20230325` or `>=1.2.3,<2.0.0`; do not use npm `Name@version` syntax.
2. Choose a library loader/export or runnable `main`/`mainJob` entrypoint according to how users consume the package. Installation does not load a library. Keep install/erase hooks minimal and inspect their effects.
3. From the package directory, run `opack genpack . --exclude .git,.github,tests` to regenerate `files` and `filesHash`. Inspect the resulting file list for secrets, prior archives, caches, or unintended files; adapt exclusions to the package. Bump the version explicitly when preparing a release.
4. Run `opack pack . --exclude .git,.github,tests` and inspect the resulting archive. Use the actual generated filename; do not invent a download URL.
5. Copy-install the archive to a fresh temporary directory with `opack install /absolute/path/ActualName-Version.opack -d /temporary/package-dir -justcopy`. Inspect with `opack info /temporary/package-dir` and test the documented entrypoint/loader in an isolated runtime. `-justcopy` is not proof of registration, hooks, dependency installation, or name-based resolution; test normal installation separately in a disposable runtime when those are in scope.

Report the runtime, archive, manifest/dependency checks, and observed behavior. Packaging does not publish a release: upload/index changes belong only to a requested publishing task.
