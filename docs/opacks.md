# oPacks — OpenAF Packages

[Index](./index.md) | [oJob Reference](./ojob.md) | [OpenAF Reference](./openaf.md) | [Security](./ojob-security.md) | [Flags](./openaf-flags.md) | [Advanced](./openaf-advanced.md)

An **oPack** ("OpenAF package", commonly written `opack`) is a self-contained, versioned bundle of OpenAF/JavaScript code — plus optional jars, native binaries, docs and assets — that can be installed into an OpenAF distribution, listed as a dependency, and loaded with `require()`/`loadLib()`/`plugin()` like any built-in library. The `opack` CLI (invoked as `openaf --opack ...`, usually aliased to an `opack` script/binary) is OpenAF's package manager: it installs, updates, removes, searches, packages and publishes opacks, in the same spirit as `npm`, `pip` or `apt` but file/HTTP based and dependency-free.

This document covers the package manifest format, versioning rules, the `opack` CLI, how opacks are resolved and loaded from scripts/oJob, how to build one, and how to stand up your own opack repository ("server"). It was written against this repository (`js/opack.js`, `js/openaf.js`, `js/owrap.format.js`) and the [`openaf-opacks`](https://github.com/OpenAF/openaf-opacks) monorepo, which hosts most publicly available opacks and the CI that keeps [openaf.io/opacks](https://openaf.io/opacks) up to date.

## 1. Anatomy of an opack

An opack is just a directory (or, once packaged, a `.opack` zip file with that directory's contents) containing:

- A **manifest**: `.package.json` or `.package.yaml` (YAML is the convention used across `openaf-opacks`).
- One or more entry-point scripts (e.g. `mylib.js`), optionally an oJob file, jars, native libs, docs (`README.md`), and an offline help database (`.odoc.db`).
- Whatever other files the manifest's `files` list declares.

### 1.1 Manifest fields

```yaml
name       : Badgen                                  # Package name (case-insensitive, must be unique)
version    : '20250821'                              # See "Versioning" below
description: The Badgen library to generate badge like SVG rewritten for OpenAF
author     : Nuno Aguiar
license    : https://github.com/OpenAF/openaf-opacks/blob/master/LICENSE
keywords   : [Badgen, Badge, SVG]                     # Used by `opack search`
bugs       :
  url: https://github.com/OpenAF/openaf-opacks/issues

main       : ''                                       # Script auto-loaded by `opack exec`/`includeOPack` mainless flow
mainJob    : ''                                       # oJob file auto-run instead of `main` when set

repository :
  type: http                                          # "http" or "path"
  url : https://openaf.io/opacks/Badgen.opack          # used when type == http
  # path: /mnt/shared/opacks/Badgen                    # used when type == path
  # backupurl: ...                                     # optional legacy fallback for type == http

dependencies:
  openaf: '>=20230325'                                 # dependency name (case-insensitive) -> version spec

scripts:
  preinstall : ''                                      # OpenAF/shell snippet run before install
  postinstall: ''                                      # ... after install
  preerase   : ''                                      # ... before erase
  posterase  : ''                                      # ... after erase

files:                                                  # every file that belongs to the package (generated)
- .odoc.db
- .package.yaml
- README.md
- badgen.js
filesHash:                                              # SHA-1 per file, used for `opack info` integrity checks
  badgen.js: 43a64a917b35f1b7bd0cf841915676fe7603e167
```

Notes:
- `files` and `filesHash` are generated for you by `opack genpack` — don't hand-maintain them.
- `main`/`mainJob` are only used by `opack exec <name>` and `oPack`/`opackExec()` convenience calls; most opacks leave them empty and are loaded explicitly via `require("badgen.js")`.
- `scripts.*` accept either an OpenAF/JS string (run via `newFn`, with an `args` map giving `args.OPACK_PATH`, plus `args.OAF_PATH`, `args.JAVA_HOME`, `args.OAF_HOME`, `args.OAF_VERSION`, `args.OAF_DIST`, `args.OJOB_HOME`) or an array of shell command strings (each run with `$sh(cmd).envs(...)`, same variables as environment variables) — handy for native build/install steps.
- `repository.type: path` lets you point at a filesystem or network path (e.g. an internal share) instead of an HTTP URL — useful for air-gapped/internal opack servers (see §6).

## 2. Versioning

Three schemes are supported and can be mixed across packages/dependencies:

| Scheme  | Example      | Typical use                          |
|---------|--------------|---------------------------------------|
| Date    | `20260101`   | Convention used by OpenAF core and most `openaf-opacks` packages (`yyyyMMdd`, bump to "today" on every publish) |
| Number  | `1`, `2`, `10` | Simple incrementing counters |
| Semver  | `1.2.3`      | Libraries that follow semantic versioning (an optional leading `v`/`V` is stripped) |

All three compare correctly against each other via `ow.format.compareVersion(a, b)` (available after `ow.loadFormat()`), which:
- treats two pure-integer strings as numbers (`10 > 9`, not lexicographic),
- treats a bare number as `N.0.0` when compared against a dotted version (`1 == 1.0.0`; `1 < 1.2.3`),
- otherwise delegates to semver comparison (`1.2.10 > 1.2.9`),
- never throws — on unparseable input it falls back to a segment-wise numeric/string compare.

Dependency version specs (used in a manifest's `dependencies:` map, and by `includeOPack`) are comma-separated **AND** conditions evaluated by `ow.format.checkVersionSpec(aVersion, aSpec)`:

```
>=20230325            # at least this date/number/semver
>=1.2.3,<2.0.0         # range
1.2.3                  # exact (bare = equality)
```

```javascript
ow.loadFormat()
ow.format.compareVersion("10", "9")                    // 1
ow.format.compareVersion("1", "1.0.0")                  // 0
ow.format.checkVersionSpec("1.5.0", ">=1.2.3,<2.0.0")   // true
```

`opack install`/`opack update` use this to decide whether a locally installed package (or dependency) is missing or outdated, and `opack info` reports `OK`/`FAILED DEPENDENCY` per declared dependency.

## 3. The `opack` CLI

Invoke it as `openaf --opack <verb> [args...] [options]` (packaged distributions usually ship a thin `opack` wrapper script that does exactly that). With no verb it prints help.

| Verb | Purpose |
|------|---------|
| `info <path\|name\|url>` | Show manifest, dependency status and per-file hash-verification status for a package (installed, local dir, `.opack` file/URL, or by name against the remote DB). |
| `search [keyword]` | Search name/description/keywords across configured remote repositories. No keyword lists everything. |
| `install <path\|name\|url> [opts]` | Install a package. |
| `update [name\|-all] [opts]` | Re-run install for an existing package (or all installed packages with `-all`) if a newer version is available. |
| `erase <name\|path> [-force] [-arg x]` | Uninstall — deletes the files listed in the manifest and removes the local DB entry. Refuses if another installed package still depends on it (unless `-force`). |
| `exec <name>` | Loads an installed package's `main` script (or runs its `mainJob` via oJob). |
| `list` | List installed packages. |
| `genpack <dir> [--exclude a,b] [--includeSCM]` | (Re)generate `.package.json`/`.package.yaml` — refreshes `files` and `filesHash` from the directory contents. Doesn't touch `name`/`version`/etc, which you edit by hand. |
| `pack <dir> [--exclude ...]` | Runs `genpack` then zips the directory into `<name>-<version>.opack` in the current directory. |
| `add2db <path>` | Register an already-installed/unpacked local directory into the local opack DB without copying files (useful when developing an opack in place). |
| `remove4db <path> [-i]` | Remove an entry from the local opack DB without deleting files (`-i` = interactive picker). |
| `add2remotedb <path> [dbfile]` | Add a package's manifest to a remote-style index file (default `opack.db`) — this is how you build a repository index (§6). |
| `remove4remotedb <name> [dbfile]` | Remove a package entry from that index. |
| `script <name>` / `daemon <name>` / `ojob <name>` | Generate a native `.sh`/`.bat` launcher for an installed opack that runs it as a plain script / background daemon / oJob respectively (§7). |
| `help` | Print verb/option help. |

### 3.1 Common `install`/`update` options

- `-d <dir>` — install into a specific directory instead of the default (`<OpenAF install path>/<PackageName>`, or `~/.openaf-opack-<PackageName>` if the OpenAF install path isn't writable).
- `-force` — reinstall even if already at the same/newer version, and skip the dependency-satisfied check.
- `-repo <url\|path>` — prepend an extra repository to search for this run only.
- `-deps` — automatically install missing dependencies instead of prompting interactively.
- `-useunzip` — stream-extract to save memory on very large opacks.
- `-noverify` — skip the post-install file-hash verification pass.
- `-cred <user:pass>` — HTTP basic-auth credentials for protected repositories/URLs.
- `-arg <value>` — passed through to `preinstall`/`postinstall` scripts as `arg`.
- `-justcopy` — copy files without registering in the DB or checking versions (used internally by `oJob-common`'s packaging job, see §5).
- `update` also adds: `-all` (update every installed package), `-noerase` (don't delete the old version's files before installing the new one), `-erasefolder` (do remove the old version's install folder — the "keep folder" behavior is the default).

### 3.2 Examples

```bash
# Search the configured remote repositories
opack search kube

# Install straight from the central repository, resolving deps automatically
opack install Kube -deps

# Install a specific package archive
opack install ./Badgen-20250821.opack

# Install from an internal HTTP mirror for this run only
opack install Kube -repo https://opacks.internal.example.com/opack.db

# Inspect what's installed and verify integrity
opack info Kube

# Update everything, without prompting for missing deps
opack update -all -deps

# Remove it
opack erase Kube
```

## 4. Local & remote opack databases

OpenAF tracks packages in small **databases** — each is a zip file containing a single `packages.json` (a map of "target path" → manifest).

- **Local DB** (what's installed on this machine):
  - `<OpenAF install path>/.opack.db` — the system-wide DB, keyed by absolute path (rewritten to `$DIR/...` when the target lives inside the OpenAF install path itself).
  - `~/.openaf-opack.db` — a per-user DB, used automatically when the system-wide file isn't writable, and always merged in alongside it (entries are keyed by install path, so the two rarely overlap).
  - Read via `getOPackLocalDB()` / `getOPackPaths()` / `getOPackPath(name)`; cached and invalidated by file mtime+size (`__flags.OPACK_LOCALDB_CACHE`).
- **Remote DB(s)** (what can be installed): one or more `opack.db` zips (or, per entry, a `packages.json` at a directory path), each mapping package name → manifest whose `repository` field says where to actually fetch the `.opack`/directory from (`type: http` + `url`, or `type: path` + `path`).
  - Read via `getOPackRemoteDB()`, merged across every configured source, cached for `__flags.OPACK_REMOTE_DB_CACHE_TTL` ms (default 60000).

### 4.1 Configuring repositories

Sources are resolved in this order, all additive:

1. `opackCentral` array in `openaf.json` next to the jar (default: `["https://openaf.io/opack.db"]`).
2. The `OAF_OPACKS` environment variable — a comma-separated list of extra `opack.db` URLs/paths, appended on every lookup.
3. `addOPackRemoteDB(aURL)` called from a script before `opack`/`getRemoteDB()` runs.
4. `-repo <url\|path>` on an individual `install`/`update`/`search` invocation (prepended, so it wins ties).

```json
// openaf.json
{
  "opackCentral": [
    "https://openaf.io/opack.db",
    "https://opacks.internal.example.com/opack.db"
  ]
}
```

```bash
OAF_OPACKS="https://opacks.internal.example.com/opack.db" opack search
```

Set `noHomeComms: true` in `openaf.json` (or the equivalent flag) to disable HTTP repository lookups entirely — remote DBs restricted to `type: path` sources still work.

## 5. Using opacks from scripts and oJob

Once installed, an opack's directory sits directly under the OpenAF install path (its default install target), so requiring its files works exactly like requiring a core library:

```javascript
require("kube.js")            // or loadLib("kube.js"), or plugin("SomeJavaPlugin") for jar-backed opacks
$kube().getNS()
```

Useful helpers (all in `js/openaf.js`):
- `getOPackPath(aPackageName)` / `getOPackPaths()` — resolve an installed opack's directory.
- `oPack(aCmdString)` — run any `opack` CLI command from inside a script, e.g. `oPack("install Kube -deps")`.
- `opackExec(aPackageName)` — shortcut equivalent to `opack exec <name>`.
- `includeOPack(aOPackName, aMinVersion)` — **ensure** a dependency is present: installs it (with `-deps`) if missing, updates it if older than `aMinVersion`, throws if it still can't be satisfied afterwards. This is what powers oJob's declarative dependency header.

### 5.1 Declaring opack dependencies in oJob

```yaml
ojob:
  opacks:
  - openaf: ">=20230601"     # minimum OpenAF version
  - S3: ">=20230401"         # opack name: version spec
  - oJob-common               # no spec = accept whatever is installed, install latest if missing
```

On startup, oJob calls `includeOPack` for every entry before running any job — so a job file is self-installing: point `ojob` at it on a fresh machine and its opack dependencies are pulled in automatically (subject to repository configuration and network/`-noHomeComms` restrictions).

## 6. Building & publishing an opack

1. **Write the code** in a plain directory, e.g. `MyLib/mylib.js`, `MyLib/README.md`.
2. **Author the manifest** by hand once: `MyLib/.package.yaml` with `name`, `description`, `author`, `license`, `keywords`, `repository`, `dependencies`, empty `scripts.*`, and a starter `version` (the convention is today's date as `yyyyMMdd`).
3. **Regenerate metadata** whenever files change:
   ```bash
   cd MyLib
   opack genpack . --exclude .git,.github,tests
   ```
   This rewrites `files` and `filesHash`; it does **not** touch `name`/`version`/`dependencies` — bump `version` yourself (again, `yyyyMMdd` by convention) before packing a release.
4. **Build the distributable archive**:
   ```bash
   opack pack . --exclude .git,.github,tests
   # -> MyLib-20260808.opack in the current directory
   ```
5. **Smoke-test it** before publishing:
   ```bash
   opack install ./MyLib-20260808.opack -d /tmp/mylib-test -justcopy
   opack info /tmp/mylib-test
   ```
6. **Publish**: put the `.opack` file wherever your `repository.url`/`repository.path` says it lives (§7), and add/refresh its entry in the repository index the same way (§7).

Helper: `oJob-common`'s `oJobOPack.yaml` ships a **"oPack Pack external"** job that wraps steps 3–4 (and optional non-versioned symlinks) for CI use — see `oJob-common/oJobOPack.yaml`.

### 6.1 Pre/post install & erase scripts

`scripts.preinstall`/`postinstall`/`preerase`/`posterase` run as OpenAF/JS or, if given as an array, as shell commands, with `OPACK_PATH` set to the install target (§1.1). Typical uses: compiling native deps, registering OS services, printing post-install notices, or cleaning up state left outside the tracked `files` list on erase. Returning/exiting non-zero (or throwing) aborts the install/erase.

## 7. Building an opack server (repository)

There is no special server software — an opack repository is just:

1. A place to host the `.opack` files themselves, reachable by HTTP(S) or filesystem/network path.
2. A small **index** (an `opack.db` zip containing one `packages.json`, mapping package name → manifest, each with a `repository` pointer telling clients where to actually fetch that package) so `opack search`/`install <name>` can resolve names without knowing URLs in advance.

This is exactly how `https://openaf.io/opacks` (a plain static file listing of `.opack` files, one per package/version) and `https://openaf.io/opack.db` (the index most installs default to, per `opackCentral` in §4.1) work — no bespoke backend, just static hosting.

### 7.1 Minimal HTTP repository

Any static file host (S3/GCS bucket, GitHub Pages, an nginx directory listing, an internal artifact server) works:

```
https://opacks.example.com/
  opack.db                # the index (see below)
  MyLib-20260808.opack
  OtherPack-20260101.opack
```

Build/update the index incrementally with the CLI itself — `add2remotedb`/`remove4remotedb` read-modify-write the `packages.json` entry inside the zip (creating it if missing):

```bash
# stamp MyLib's current manifest (name/version/dependencies/etc, minus files/hash noise)
# into ./opack.db, ready to upload alongside the .opack files
opack add2remotedb MyLib opack.db

# drop a stale/retired package from the index
opack remove4remotedb OldLib opack.db
```

Point each package's manifest `repository` at where its `.opack` will actually be fetched from, matching the layout above:

```yaml
repository:
  type: http
  url : https://opacks.example.com/MyLib-20260808.opack
```

Then upload `opack.db` and the `.opack` file(s) to the host, and consumers add `https://opacks.example.com/opack.db` to their `opackCentral`/`OAF_OPACKS`/`-repo` (§4.1).

### 7.2 Filesystem/network-path repository

For air-gapped or LAN-only setups, use `type: path` instead of `type: http`, pointing either at an unpacked opack directory or a `.opack` file reachable over a mounted/shared path:

```yaml
repository:
  type: path
  path: /mnt/opacks/MyLib
```

`getOPackRemoteDB()` also accepts a bare directory as a repository *source* (rather than just as a package's `repository.path`): if `<dir>/opack.db` exists it's read the same way as an HTTP index, so a shared network folder can serve as a whole private repository with zero HTTP involved — just add that directory to `opackCentral`/`OAF_OPACKS`/`-repo`.

### 7.3 Reference: the `openaf-opacks` monorepo pattern

The public [`openaf-opacks`](https://github.com/OpenAF/openaf-opacks) repo hosts ~130 opacks as sibling directories, each independently versioned, and automates steps 3–6 above with GitHub Actions:
- `updatePacks.yml` / `updatePackages.yaml` — per opack, refresh dependency jars (`ojob.io/oaf/mavenGetJars`, `ojob.io/oaf/checkOAFJars`), bump `version` to today's date, run `opack genpack .`, and open a PR with the diff.
- `genREADME.yaml` — walks every subdirectory's manifest to regenerate the monorepo's `README.md` table and per-package version badges.
- Actual publication of `.opack` archives and the `opack.db` index to `openaf.io` happens outside this repo (the site's hosting/CI), following the same `opack pack` + `add2remotedb` mechanics described above.

`openaf-opacks/AGENTS.md` is a good quick-reference checklist when contributing an opack there (regenerate the package, bump the date-based version, document changes).

## 8. Running opacks without installing

- **`opack script <name>`** / **`opack daemon <name>`** / **`opack ojob <name>`** — for an already-installed opack, generate a native launcher (`opack_<name>.sh`/`.bat` for `script`/`daemon`; equivalent for `ojob`) that re-invokes `java -jar openaf.jar --script|--daemon|--ojob <opack path>/<main>` with the correct `JAVA_HOME`/classpath baked in, so the package can be handed to `systemd`/Task Scheduler/etc. as a standalone executable.
- **`openaf-sb`** — a sandboxed OpenAF launcher that can run a packaged `.opack`/directory directly (`openaf-sb ./MyLib`) without installing it into the local DB at all; `opack exec`/`opack script` point you at it when you target an unpacked (`opacklocal`) archive that isn't installed.
- **`opack exec <name>`** — for an *installed* package, loads its `main` script (or runs its `mainJob`) in the current process.

## 9. Reference: flags & environment variables

| Name | Effect |
|------|--------|
| `OAF_OPACKS` (env) | Comma-separated extra remote repository sources, merged with `opackCentral`. |
| `opackCentral` (`openaf.json`) | Default list of remote repository sources (`opack.db` URLs/paths). Default: `["https://openaf.io/opack.db"]`. |
| `noHomeComms` (`openaf.json`) | When true, skip HTTP repository lookups (only `type: path` sources are consulted). |
| `__flags.OPACK_REMOTE_DB_CACHE_TTL` | Cache TTL (ms) for merged remote DB lookups. Default `60000`. |
| `__flags.OPACK_LOCALDB_CACHE` | Cache the local DB, invalidated by file mtime+size. Default `true`. |

## 10. See also

- `js/opack.js` — the CLI implementation (verb parsing, install/update/erase/pack/genpack logic).
- `js/openaf.js` — `oPack`, `oJob`, `includeOPack`, `getOPack*`, `addOPackRemoteDB`, DB read/write functions.
- `js/owrap.format.js` — `ow.format.compareVersion` / `ow.format.checkVersionSpec`.
- `oJob-common/oJobOPack.yaml` — CI-friendly packaging job.
- `ojob.md` §"External Dependencies" — the `ojob.opacks:`/`owraps:` header.
- [openaf-opacks](https://github.com/OpenAF/openaf-opacks) — the public opack monorepo and its `AGENTS.md`.
