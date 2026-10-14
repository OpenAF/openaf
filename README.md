# OpenAF

[![Build and Test](https://github.com/OpenAF/openaf/actions/workflows/build-and-test.yml/badge.svg)](https://github.com/OpenAF/openaf/actions/workflows/build-and-test.yml)
![asserts](tests/asserts.svg)
[![tests](tests/results.svg)](tests/autoTestAll.md)

## Installing

### Operating system install

On an empty folder:

| OS | Command/Instructions |
|----|----------------------|
| **Windows** | Download and execute:<br/> https://openaf.io/win64/install.bat |
| **Mac** | Execute on a Terminal:<br/>````wget -O - https://openaf.io/mac64/install.sh \| sh```` |
| **Unix x86** | Execute on a shell:<br/>````wget -O - https://openaf.io/unix64/install.sh \| sh```` |
| **Unix arm32** | Execute on a shell:<br/>````wget -O - https://openaf.io/arm32/install.sh \| sh```` |
| **Unix arm64** | Execute on a shell:<br/>````wget -O - https://openaf.io/arm64/install.sh \| sh````|

### Docker container

Use the docker container:

````bash
docker run -ti openaf/openaf
````

(see more in [openaf-dockers](https://github.com/OpenAF/openaf-dockers))

### Download JAR file

Download just the Java JAR file:

| Build | URL |
|:----- |:--- |
| Latest stable build | https://openaf.io/openaf.jar |
| Latest nightly build | https://openaf.io/nightly/openaf.jar |

and the execute on an empty folder:

````bash
java -jar openaf.jar --install
````

### Minimum requirements

* Java: JRE 21
* Memory: 128MB (for installing and updating, runtime can be lower)
* Storage: around 160MB (for installing and updating, runtime can be 64MB)

(storage requirements can be made lower if needed, _tbc_)

## How to run a script

### How to run a "Hello World" script

| Step | Instruction | Sample |
|:----:|-------------|--------|
| 1 | Create a "hello.js" file | ````print("Hello World!");```` |
| 2 | Execute on the same folder as the "hello.js" file | ````$ openaf -f hello.js```` |

### How to run in-line code

#### Windows

````sh
PS > openaf -c "print('Hello World!');"
````

#### Unix

````sh
$ openaf -c 'print("Hello World!");'
````

## Update and uninstall

### Update

````sh
openaf --update
````

### Uninstall

Just delete the original empty folder where you executed the install command.

## Documentation

* [How to](https://docs.openaf.io/docs/howto/)
* [All functions, objects, plugins and libraries](https://docs.openaf.io/docs/reference/)
* [oJob](https://docs.openaf.io/docs/concepts/oJob.html)
* [OpenAF Channels](https://docs.openaf.io/docs/concepts/OpenAF-Channels.html)
* [OpenAF oPromises](https://docs.openaf.io/docs/concepts/OpenAF-oPromise.html)
<!--* [Code tips & tricks](Tips-&-tricks)-->

### Repository documentation

* [Documentation index](docs/index.md)
* [Getting started](docs/getting-started.md)
* [Write a script and turn it into an oJob](docs/authoring.md)
* [Authoring recipes](docs/authoring-recipes.md)
* [Test your scripts and oJobs](docs/authoring-testing.md)
* [CLI reference](docs/cli.md)
* [OpenAF overview](docs/openaf.md)
* [Advanced OpenAF features](docs/openaf-advanced.md)
* [Command-line flags](docs/openaf-flags.md)
* [oJob overview](docs/ojob.md)
* [oJob reference catalog](docs/ojob-all.yaml)
* [oJob security guidance](docs/ojob-security.md)
* [oJob recipes](docs/ojob-recipes.md)
* [LLM integration guide](docs/llm-guide.md)
* [OpenAF AI GPT types](docs/ow-ai-gpttypes.md)
* [Changelog](CHANGELOG.md)
* Additional developer notes in [docs/dev/](docs/dev/)

## Building

After cloning the repository locally execute: 

````
ojob build.yaml
````

## Testing a build

After running `ojob build.yaml`, run the test suite with the newly built `openaf.jar`. From the repository root:

```bash
cd tests
java --enable-native-access=ALL-UNNAMED -jar ../openaf.jar --ojob -e autoTestAll.yaml
```

The suite requires the `oJob-common` oPack. Check the printed pass/fail counts and `tests/autoTestAll.results.json` (paths relative to the repository root); a successful run has `fail: 0`. The suite also writes a Markdown report to `tests/autoTestAll.md` and JUnit XML to `tests/autoTestAllResults.xml`. Check the results even when the command exits successfully, since the runner currently exits with code 0 after reporting test failures.

To run a focused suite, replace `autoTestAll.yaml` with an area-specific runner, for example:

```bash
# Run from tests/
java --enable-native-access=ALL-UNNAMED -jar ../openaf.jar --ojob -e autoTestAll.IO.yaml
```

If changes affect `ow.test` or oJob itself, you can also run `ojob autoTestAll.yaml` from `tests/` using a previously installed stable OpenAF. That command uses the installed runtime; use the explicit JAR command above to validate the new build. See [BUILD.md](BUILD.md) for build prerequisites and bootstrap instructions.

## Links

* https://github.com/OpenAF/openaf-templates - Code/oJob templates
* https://openaf.io/opacks - OpenAF packages
* https://docs.openaf.io - OpenAF code snippets and functionality explained
