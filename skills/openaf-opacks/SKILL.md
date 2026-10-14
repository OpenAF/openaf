---
name: openaf-opacks
description: Discover, inspect, install, and use public OpenAF oPacks in JavaScript and oJob workflows. Use when finding an OpenAF package for a capability, selecting its loader or entrypoint, or resolving package dependencies.
---

# Discover and use public oPacks

Find an existing package for the requested capability, verify its API, and deliver runnable OpenAF code with explicit dependencies. Prefer built-in OpenAF facilities when they already fit; search public oPacks before building a service client or adding a Java library from scratch.

## Portable use

Copy this folder into an application's skills directory or use this file as instructions. No repository checkout or other skill is required. Discovery can use a browser; execution requires [OpenAF](https://github.com/openaf/openaf/blob/master/README.md#installing). If the runtime or network is unavailable, use available documentation or installed package source and mark unverified steps explicitly.

## Discover and inspect

1. Search the [public oPack collection and catalog](https://github.com/OpenAF/openaf-opacks) by capability, protocol, file format, or service name. Follow package links rather than assuming every package lives in that monorepo. With OpenAF installed, use:

   ```sh
   opack search badge
   opack search Badgen
   opack list
   opack info Badgen
   ```

   `search` queries configured remote repositories; `list` reports installed packages. Search terms are case-insensitive regular expressions; quote patterns in the shell. `opack search` without a term lists the remote catalog. `info` can resolve an installed package first, so compare its version/source with the public candidate when investigating newer functionality. If the `opack` wrapper is unavailable, use `openaf --opack search badge` or `java -jar /path/to/openaf.jar --opack search badge`.

2. Read the selected package's README, `.package.yaml` or `.package.json`, and the relevant source/examples. Confirm the manifest's `name` and `version`, dependencies (including OpenAF), license, repository, install hooks, and `main`/`mainJob`. Repository directory names, install names, library filenames, and exported symbols need not match.

3. Verify the exact loader, method signature, arguments, return shape, and cleanup requirements against that package version. GitHub `master` can differ from the published or installed archive; use matching source when version-sensitive. Do not maintain a fixed package/version catalog inside the skill.

An empty search is inconclusive: repository failures may produce no results. Check connectivity, `opackCentral`, `OAF_OPACKS`, and `noHomeComms` before claiming a package is absent. The default public index is `https://openaf.io/opack.db`; `opack search badge -repo https://openaf.io/opack.db` adds it for that invocation. Respect intentionally offline configuration and use the public repository or installed README as a fallback. Do not change global repository settings just to discover a package.

## Install and resolve

Install the selected dependency when needed within the user's task; discovery alone needs no installation:

```sh
opack install Badgen
opack info Badgen
openaf -c 'print(getOPackPath("Badgen"));'
```

`-deps` permits automatic dependency installation; `-d /chosen/path` selects an installation directory. Install hooks can execute code, so inspect them as part of choosing the package. Avoid blanket updates, `-force`, or `-noverify` for ordinary setup. For reproducibility, record the installed version and use a verified versioned archive/source when available; do not invent npm-style `Name@version` syntax or archive URLs.

`getOPackPath("ExactName")` returns an installed path or undefined and does not install anything. Check it before constructing paths. `includeOPack("ExactName")` ensures installation and can install dependencies; its optional version argument can cause updates. It is not an API loader or a read-only availability check. Check the target runtime's implementation before using version expressions: supported comparison behavior can vary across releases.

## Choose the package's entrypoint

| Package interface | How to consume it |
| --- | --- |
| Exported JavaScript module | Use its documented `require("file.js")` and returned exports; OpenAF `require` is not Node.js. |
| Global JavaScript library | Use its documented `loadLib("file.js")` or other loader, then its defined symbols. |
| Java plugin or driver | Follow the package's classpath/plugin initialization; installation alone does not establish a usable class. |
| YAML job library | Resolve its documented file through `jobsInclude`, then schedule the exported jobs in `todo`. |
| Runnable package | Use `opack exec ExactName` only when the manifest supplies `main` or `mainJob`; verify its argument contract. |

For oJob, `ojob: { opacks: [Badgen] }` invokes dependency checks and may install a missing package. It does not load `badgen.js` or import package jobs. A JavaScript call still needs its loader in `exec`; a job library still needs `jobsInclude`. Check include resolution on the target runtime. `opack script`, `opack daemon`, and `opack ojob` generate launchers, not library imports.

## Small runnable example

[Badgen](https://github.com/OpenAF/openaf-opacks/tree/master/Badgen) exports `badgen` from `badgen.js`. After installing it, save this as `badge.js` (also provided in [assets/badge.js](assets/badge.js)):

```javascript
var packPath = getOPackPath("Badgen");
if (isUnDef(packPath)) throw "Install the dependency first: opack install Badgen";
var badges = require("badgen.js");
var svg = badges.badgen({ label: "build", status: "passing", color: "green" });
if (!isString(svg) || svg.indexOf("<svg") < 0) throw "Expected SVG output";
print(svg);
```

Run `openaf -f badge.js > badge.svg`. This explicitly checks installation and uses the library API; it does not assume a runnable package entrypoint. For oJob, put the same JavaScript in a job's `exec: |`, schedule it in `todo`, and declare `ojob.opacks` only if automatic dependency installation is intended.

Verify a small local operation and its output, then test the requested integration within its intended scope. Report the OpenAF version, package version, exact invocation, and what passed. Successful discovery, installation, or library loading alone does not prove a remote service integration works.

## References

- [oPack guide](https://github.com/openaf/openaf/blob/master/docs/opacks.md): installation, manifests, repositories, and CLI options.
- [CLI implementation](https://github.com/openaf/openaf/blob/master/js/opack.js): search, info, install, and exec behavior.
- [Runtime helpers](https://github.com/openaf/openaf/blob/master/js/openaf.js): `getOPackPath`, `getOPackLocalDB`, `getOPackRemoteDB`, `includeOPack`, and loading.
- [oJob engine](https://github.com/openaf/openaf/blob/master/js/owrap.oJob.js): dependency checks and include resolution.

## Author a package

When creating or changing an oPack, follow [references/authoring.md](references/authoring.md) for manifest, packaging, and isolated validation. Discovery and consumption do not require this workflow.
