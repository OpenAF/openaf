# OpenAF

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

* Java: JRE 1.8
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

## Building

After cloning the repository locally execute: 

````
ojob build.yaml
````

## Testing a build

After building, on the tests sub-folder, the recommend way is to use the just openaf just built:

````
ojob autoTestAll.yaml
````

But you can use a previous stable openaf build if the ow.test and ojob functionality could be broken by your changes.

## Links

* https://github.com/OpenAF/openaf-templates - Code/oJob templates
* https://openaf.io/opacks - OpenAF packages
* https://openafs.blogspot.com - OpenAF code snippets and functionality explained
