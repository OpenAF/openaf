# OpenAF

This a Java & Javascript based "swiss-army knife" scripting DevOps tool for different automation challenges with minimal requirements and footprint, extensible through packages (opacks).

## Minimum requirements

  * Java: JRE 1.7
  * Memory: 128MB (for installing and updating, runtime can be lower)
  * Storage: around 160MB (for installing and updating, runtime can be 64MB)

## Download & Install

### Linux & Mac
You can download the latest releases:

  * [Stable build](https://openaf.io/openaf.jar)
  * [Nightly test build](https://openaf.io/nightly/openaf.jar)
  
And install it in any empty folder you wish (included in your PATH):

````
java -jar openaf.jar --install
````
  
### Windows
In windows you can download an install.bat to get you everything (java & openaf):

  * [Stable build](https://openaf.io/win64/install.bat)
  * [Nightly test build](https://openaf.io/win64/nightly/install.bat)
  
And execute on any empty folder (included in your PATH):

````
install.bat
````

p.s. You might need to click on "More Info" and "Run" if you get a Windows warning.
  
## Docker containers

Use it directly in docker

  * Stable build: ````docker pull openaf/openaf:latest````
  * Nightly test build: ````docker pull openaf/openaf:nightly````
  
## Documentation

You can find the documentation in https://github.com/OpenAF/openaf/wiki#documentation.
  
## Build it

You can build it yourself also by cloning from https://github.com/openaf/openaf.git and using the latest stable build execute:

````
ojob build.yaml
````

and run the automated tests:

````
cd tests & java -jar ../openaf.jar --ojob -e autoTestAll.yaml
````

## Uninstall

Just delete the original empty folder where you executed the install command.
