# OpenAF <a href="/"><img align="right" src="images/openaf_small.png"></a>

## Download

| Build | URL |
|:----- |:--- |
| Latest stable build | https://openaf.io/openaf.jar |
| Latest nightly build | https://openaf.io/nightly/openaf.jar |

## Installing 

````bash
java -jar openaf.jar --install
````

### Minimum requirements

* Java: JRE 1.7 (full support for JRE 1.9 is on going (see [issue #23](../issues/23)))
* Memory: 128MB (for installing and updating, runtime can be lower)
* Storage: around 160MB (for installing and updating, runtime can be 64MB)

(storage requirements can be made lower if needed, _tbc_)

### Docker containers

You can use any of the following docker container images

| Description | Docker Pull Command |
|:----------- |:------------------- |
| Main openaf **nightly** build providing an already installed openaf in /openaf. Updated every day. | ````docker pull openaf/openaf:nightly```` |
| Based on the main openaf/openaf:nightly image has as entry point the openaf-console. | ````docker pull openaf/openaf-console:nightly```` |
| Based on the main openaf/openaf:nightly image comes with the ojob-common opack pre-installed and running the /openaf/main.yaml ojob. You can customise by copying your main ojob yaml file to /openaf/main.yaml. | ````docker pull openaf/openaf-ojob:nightly```` |

## Update

````bash
openaf --update
````

## Documentation

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