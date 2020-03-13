# OpenAF <a href="/"><img align="right" src="images/openaf_small.png"></a>

## Installing

### Operating system install

On an empty folder:

| OS | Command/Instructions |
|----|----------------------|
| **Windows** | Download and execute:<br/> https://openaf.io/win64/install.bat |
| **Mac** | Execute on a Terminal:<br/> wget -O - https://openaf.io/mac64/install.sh \| sh |
| **Unix x86** | Execute on a shell:<br/> wget -O - https://openaf.io/unix64/install.sh \| sh|
| **Unix arm32** | Execute on a shell:<br/> wget -O - https://openaf.io/arm32/install.sh \| sh |
| **Unix arm64** | Execute on a shell:<br/> wget -O - https://openaf.io/arm64/install.sh \| sh |

### Docker container

Use the docker container:

````bash
docker run -ti openaf/openaf
````

([more details](#Docker\ containers))

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

* Java: JRE 1.7
* Memory: 128MB (for installing and updating, runtime can be lower)
* Storage: around 160MB (for installing and updating, runtime can be 64MB)

(storage requirements can be made lower if needed, _tbc_)

### Docker containers

You can use any of the following docker container images

| Description | Docker Pull Command |
|:----------- |:------------------- |
| Main openaf **stable** build providing an already installed openaf in /openaf. Updated every day. | ````docker pull openaf/openaf:stable```` |
| Based on the main openaf/openaf image has as entry point the openaf-console. | ````docker pull openaf/openaf-console```` |
| Based on the main openaf/openaf image comes with the ojob-common opack pre-installed and running the /openaf/main.yaml ojob. You can customise by copying your main ojob yaml file to /openaf/main.yaml. | ````docker pull openaf/openaf-ojob```` |
| Main openaf **nightly** build providing an already installed openaf in /openaf. Updated every day. | ````docker pull openaf/openaf:nightly```` |
| Based on the main openaf/openaf:nightly image has as entry point the openaf-console. | ````docker pull openaf/openaf-console:nightly```` |
| Based on the main openaf/openaf:nightly image comes with the ojob-common opack pre-installed and running the /openaf/main.yaml ojob. You can customise by copying your main ojob yaml file to /openaf/main.yaml. | ````docker pull openaf/openaf-ojob:nightly```` |

(see more in [openaf-dockers](https://github.com/OpenAF/openaf-dockers))

## Automatic update

````bash
openaf --update
````

## Documentation

* [How to](How-to)
* [All functions, objects, plugins and libraries](documentation)
* [oJob](oJob)
* [OpenAF Channels](OpenAF-Channels)
* [OpenAF oPromises](OpenAF-oPromise)
* [Code tips & tricks](Tips-&-tricks)

## Building

After cloning the repository locally execute: 
````bash 
ojob build.yaml
````

## Testing a build

After building, on the tests sub-folder, the recommend way is to use the just openaf just built:

````bash
ojob autoTestAll.yaml
````

But you can use a previous stable openaf build if the ow.test and ojob functionality could be broken by your changes.

## Uninstall

Just delete the original empty folder where you executed the install command.

## Links

* https://github.com/OpenAF/openaf-templates - Code/oJob templates
* https://openaf.io/opacks - OpenAF packages
* https://openafs.blogspot.com - OpenAF code snippets and functionality explained