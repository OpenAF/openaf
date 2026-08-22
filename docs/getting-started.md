# Getting Started with OpenAF

[Index](./index.md) | [CLI Reference](./cli.md) | [OpenAF Reference](./openaf.md) | [oJob Reference](./ojob.md)

OpenAF is a JavaScript framework that extends the Mozilla Rhino engine with utilities for Java environments — scripting, job orchestration, data processing, HTTP servers, and more.

## 1. Install

OpenAF requires **Java JRE 21+** (JDK 24+ to build from source).

### Operating system install

On an empty folder:

| OS | Command |
|----|---------|
| **Windows** | Download and execute https://openaf.io/win64/install.bat |
| **Mac** | `wget -O - https://openaf.io/mac64/install.sh \| sh` |
| **Unix x86** | `wget -O - https://openaf.io/unix64/install.sh \| sh` |
| **Unix arm32** | `wget -O - https://openaf.io/arm32/install.sh \| sh` |
| **Unix arm64** | `wget -O - https://openaf.io/arm64/install.sh \| sh` |

### Docker

```bash
docker run -ti openaf/openaf
```

See [openaf-dockers](https://github.com/OpenAF/openaf-dockers) for more images.

### Download JAR

Download from https://openaf.io/openaf.jar (nightly: https://openaf.io/nightly/openaf.jar), then on an empty folder:

```bash
java -jar openaf.jar --install
```

This generates wrapper scripts (`oaf`, `ojob`, `opack`, `oafp`, `pyoaf`, etc.) in the current directory.

### Minimum requirements

- Java: JRE 21+
- Memory: 128 MB (install/update); runtime can be lower
- Storage: ~160 MB (install); runtime ~64 MB

## 2. Verify the install

```bash
openaf -v          # or: oaf -v
```

You should see the version and distribution string.

## 3. Hello World

### Inline code

```bash
openaf -c 'print("Hello World!");'
```

### Script file

Create `hello.js`:

```javascript
print("Hello World!");
```

Run it:

```bash
openaf -f hello.js
```

### Interactive REPL

```bash
openaf --console
```

## 4. Your first oJob

oJob is OpenAF's YAML-based job orchestration. Create `hello.yaml`:

```yaml
jobs:
- name: Hello
  exec: |
    print("Hello from oJob!");

todo:
- Hello
```

Run it:

```bash
ojob hello.yaml
# or: openaf --ojob -e 'hello.yaml'
```

## 5. Data processing with oafp

`oafp` is the OpenAF data processor — a multi-format `jq`/`yq`/`xq`/`csvkit` replacement:

```bash
# JSON to YAML
cat data.json | oafp in=json out=yaml

# Filter with JMESPath
cat users.json | oafp path="[*].email" out=lines

# SQL over CSV
oafp data=sales.csv in=csv sql="SELECT region, SUM(amount) AS total GROUP BY region" out=mdtable
```

See [oafp.md](./oafp.md) for the full reference.

## 6. Where to go next

1. **[cli.md](./cli.md)** — every command-line flag and wrapper script.
2. **[openaf.md](./openaf.md)** — core JavaScript helpers (`$$`, `_$`, `$from`, `$path`, channels, etc.).
3. **[ojob.md](./ojob.md)** — oJob YAML structure, built-in jobs, and advanced features.
4. **[ojob-recipes.md](./ojob-recipes.md)** — practical, composable job recipes.
5. **[opacks.md](./opacks.md)** — package manager and reusable libraries.
6. **[plugins.md](./plugins.md)** — Java plugins (HTTP, SSH, FTP, Email, JMX, SNMP, ZIP, etc.).
7. **[python.md](./python.md)** — running Python from OpenAF and vice versa.
8. **[sigil.md](./sigil.md)** — template interpolation and secret injection.
9. **[openaf-flags.md](./openaf-flags.md)** — runtime flags and environment variables.

## 7. Update and uninstall

```bash
openaf --update    # update to latest version
```

To uninstall, delete the folder where you ran the install command.

## 8. Building from source

See [BUILD.md](../BUILD.md) for build instructions. In short, after cloning:

```bash
mkdir _oaf && cd _oaf && curl https://openaf.io/openaf.jar -o openaf.jar && java -jar openaf.jar --install && cd ..
_oaf/ojob build.yaml
```

This produces `openaf.jar` and `openaf.jar.orig` at the repo root.