# Publishing OpenAF to Maven Central

This optional distribution path leaves `ojob build.yaml`, installation, oPacks,
updates, repacking and the existing CI unchanged. It publishes the official
**repacked `openaf.jar`**, never `openaf.jar.orig`. Java packages remain `openaf.*`.
The original `pom.xml` continues to describe the existing build.

## Coordinates and release identity

Set repository variable `CENTRAL_GROUP_ID` to your **existing verified** namespace,
for example `io.github.REPLACE_WITH_VERIFIED_ACCOUNT` (replace the entire account
placeholder with its lowercase verified spelling). The script rejects placeholders.
Do not assume `io.github.openaf` is authorized. Portal ownership is an external
prerequisite; syntax validation cannot prove ownership. Keep this variable stable:
changing it creates different coordinates. No namespace registration is performed.

Artifact ID is `openaf`. Only exact published, non-draft, non-prerelease GitHub
release tags are accepted by CI:

| Release tag | Maven version |
| --- | --- |
| `v20261015` | `20261015` |
| `v20261015-20261028` | `20261015-20261028` |

Both date components must be valid dates; the suffix must not predate the base.
These numeric/hyphen versions are Maven release versions, not snapshots. The old
POM version is ignored. The build receives the complete mapped version through
`openafVERSION` and `openafDIST=stable`; compiled `AFCmdBase.VERSION` and
`DISTRIBUTION` must match. A nightly/t8 binary is rejected. A stable rebuild of an
old tag is a new build from that source, not a claim of byte identity with an old
GitHub release asset. Publishing after a release is intentional; ordinary CI
never triggers this workflow.

## Architecture and provenance

`publish-maven.yml` resolves the selected GitHub release to a peeled tag commit,
checks out that exact commit, uses JDK 25 and the official oJob build, then runs
the full suite and checks the JSON failure count. It transfers the tested JAR and
matching build-generated Java sources via an immutable Actions artifact from the
same workflow run, and checks its commit and SHA-256. It does not reuse arbitrary
nightly/PR artifacts. Publishing tooling comes from the dispatched workflow ref;
use the reviewed `t8` branch. Older release commits need not contain this tooling.

`tools/central/publish.py` checks HEAD/tag identity and the exact permitted source
version substitutions, rejects unexpected tracked edits, and stages a concrete
POM with literal coordinates. It generates deterministic sources/documentation
archives, attaches the existing binary as the unclassified main artifact using
a pinned GMavenPlus build-only script (build-helper attaches sources and Javadoc), signs with Maven GPG, and invokes Central plugin 0.12.0 with
`skipUpload=true` first. Maven compilation and ordinary JAR creation are disabled.
The primary artifact's bytes are never rewritten by this path.

The script validates the bundle file list, coordinates, metadata, absence of
transitive dependencies, signatures, four checksums per artifact, sources and
Javadoc contents, and the binary hash. It installs into a separate temporary
Maven repository, resolves a minimal consumer, runs a Java consumer reading the
compiled version, and compares hashes again. `--upload` repeats the Central
existence check and invokes deployment only after these checks. Central itself
also rejects duplicate releases. A network error during the existence check is
fatal; only HTTP 404 means absent. Check pending Portal deployments too: an
unpublished pending deployment is not visible in the repository existence check.

Sources include real `src/**/*.java`, including vendored sources compiled by the
official builder; no generated JS bytecode is presented as invented Java source.
Javadoc documents `openaf` and subpackages against the embedded binary classpath,
with Java release 21, UTF-8, no timestamp, and `-Xdoclint:none` for existing malformed
comments. Warnings remain visible; Javadoc errors fail staging.

## Credentials, signing, and environment

Create a GitHub environment **maven-central**, restrict deployment branches to the
reviewed publishing branch (`t8`), require reviewers, and prevent self-approval
where available. Store these environment secrets only there:

* `CENTRAL_USERNAME`: Central Portal publishing-token username.
* `CENTRAL_PASSWORD`: Central Portal publishing-token password, not a GitHub password.
* `GPG_PRIVATE_KEY`: ASCII armored private signing key.
* `GPG_PASSPHRASE`: private-key passphrase.

Publish the corresponding public key to a public keyserver accepted by Central.
Export a private key securely with `gpg --armor --export-secret-keys KEY_ID` and
enter it directly in the secret UI; never commit it. CI imports it in a temporary
GNUPGHOME and removes that directory and generated settings on exit. The Maven
server ID is `central`; settings reference environment variables rather than
embedding token values. GPG uses `MAVEN_GPG_PASSPHRASE`, never a command-line secret.
Do not enable Maven debug logging or shell tracing with credentials loaded.

Dry runs use **maven-central-validation** and generate an ephemeral local GPG key.
Do not put publishing secrets in that environment or repository-wide secrets.
Dry-run steps do not reference publishing secrets and cannot request an upload.
The workflow has only `contents: read`; version-specific concurrency prevents
simultaneous executions for a tag within this repository.

## Local dry run

Use an isolated clean checkout of the selected tag so unrelated work is safe.
Install JDK 25, Maven 3.9.x (CI pins 3.9.11; Maven 3.10.x also supported), Python 3,
GPG, and OpenAF following [BUILD.md](../../BUILD.md). Do not use Maven 4.

```sh
git checkout --detach refs/tags/v20261015-20261028
# Copy the reviewed publishing files here if this old tag predates the tooling.
```

Build and test using the official commands:

```sh
ojob build.yaml openafVERSION=20261015-20261028 openafDIST=stable
```

```sh
(cd tests && java -jar ../openaf.jar --ojob -e autoTestAll.yaml)
python3 -c 'import json; assert json.load(open("tests/autoTestAll.results.json"))["fail"] == 0'
java -jar openaf.jar --version
java -jar openaf.jar -v # OpenAF CLI version display
python3 -m unittest discover -s tools/central -p 'test_*.py'
```

For production signing, import the release key into your local GPG keyring and
set `MAVEN_GPG_PASSPHRASE` securely in your environment. For validation only:

```sh
export GNUPGHOME=$(mktemp -d)
chmod 700 "$GNUPGHOME"
gpg --batch --passphrase '' --quick-generate-key 'Validation <test@example.invalid>' rsa3072 sign 1d
python3 tools/central/publish.py --tag v20261015-20261028 --group io.github.YOUR_VERIFIED_ACCOUNT
# Replace YOUR_VERIFIED_ACCOUNT with the actual lowercase account.
```

No Portal credentials are needed for this command. Internet access is required to
check immutability and resolve Maven plugins. Output defaults to
`target/central-release`; choose a new `--output` directory for each attempt.
The signed bundle is `target/central-release/target/central-publishing/central-bundle.zip`.
`verification.json` records the commit, coordinates, binary hash and upload status.
Do not upload a bundle signed with a disposable validation key. Archive filenames
and timestamps are reproducible; the existing official builder uses timestamps,
network bootstrap and mutable build dependencies, so this pipeline does **not**
claim independently byte-reproducible OpenAF builds. Hash identity is enforced
between the selected tested build and the Maven artifact.

A local real upload additionally requires secure Maven settings at `~/.m2/settings.xml`:

```xml
<settings><servers><server><id>central</id>
  <username>${env.CENTRAL_USERNAME}</username>
  <password>${env.CENTRAL_PASSWORD}</password>
</server></servers></settings>
```

Only when ready, add `--upload` to the script. Default is manual Portal approval.
Add `--auto-publish` **together with** `--upload` to opt into automatic publication.
These commands are instructions for a future release, not part of implementation validation.

## First GitHub Actions publication

1. Merge/review the publishing files on `t8`. Configure the stable group variable,
   protected environments, production secrets and public GPG key as above.
2. Select **Publish Maven Central → Run workflow**, use reviewed `t8`, enter an
   existing stable release tag and leave **dry_run=true**, **auto_publish=false**.
3. Require a successful build, full test suite, Javadoc generation, signed bundle
   verification and local consumer resolution. Review the coordinates and hash in
   the workflow summary. Resolve any errors; do not bypass a failed check.
4. Run again for the same release with **dry_run=false**. Approve the protected
   environment job after reviewing the exact source commit and coordinates.
5. The plugin uploads and waits for Central validation. With the default toggle,
   visit [Central deployments](https://central.sonatype.com/publishing/deployments),
   review the validated deployment, and explicitly publish it there. With
   **auto_publish=true**, the approved job authorizes automatic publication.
6. Confirm the Portal's final state and repository availability before announcing
   publication. Upload success/validation is not proof of publication.

No upload was performed while implementing this feature.

## Consumption and limitations

```xml
<dependency>
  <groupId>io.github.REPLACE_WITH_VERIFIED_ACCOUNT</groupId>
  <artifactId>openaf</artifactId>
  <version>REPLACE_WITH_RELEASE_VERSION</version>
</dependency>
```

The repacked executable is an uber JAR: OpenAF and embedded dependency classes
are at the root, and its Main-Class is `openaf.Launcher`. The pre-repack `.orig`
uses a jar-in-jar loader and is deliberately excluded. Ordinary classpath API
consumption is supported for the repacked artifact, as checked by the minimal
consumer. No external runtime dependencies are declared because the executable
already embeds them. Bundled Rhino, Jetty, logging and other packages can collide
with versions in a host application; Maven cannot mediate those embedded copies.
Use an isolated process/classloader when appropriate. No shading, relocation,
thin JAR or `openaf-core` API contract is introduced. Some APIs require native
facilities, external programs, environment configuration or optional oPacks.
The build targets Java 21 bytecode; actual compatibility also depends on embedded
library requirements. Publishing uses JDK 25 and does not lower runtime requirements.

## Troubleshooting and duplicate prevention

* Namespace errors: compare the literal group variable with Portal authorization.
  Changing a placeholder is configuration, not namespace verification.
* Version/source mismatch: build the exact tag using the mapped full version and
  stable distribution. Never relabel a nightly binary. Local staging intentionally
  rejects unrelated tracked edits; use a clean isolated checkout.
* Javadoc errors: inspect the failing symbol and binary/source match. Existing
  comment warnings are tolerated; source-resolution errors are fatal.
* GPG errors: check the selected key, passphrase environment and public keyserver
  availability. Never print the private key or passphrase to diagnose a failure.
* Maven/plugin errors: use Maven 3.9/3.10 and JDK 25, check network access. Missing
  bundle files, bad checksums, signatures or consumer failures block upload.
* Existing coordinates: do not overwrite or silently skip. Inspect Central and
  pending deployments, cancel redundant pending work in Portal, or select a real
  subsequent OpenAF release. Never invent a Maven-only replacement version.
* Interrupted upload: inspect Portal before retrying. A successful upload may
  remain pending manual approval, and a repository check alone cannot detect it.

See the official [Central Maven plugin documentation](https://central.sonatype.org/publish/publish-portal-maven/)
for `skipUpload`, manual approval, validation and Maven compatibility.
