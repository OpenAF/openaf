## Building the Project

### Build

To build the project, you need to have Java JDK >= 24 installed. Once you have Java JDK installed, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/openaf/openaf
   cd openaf
   ```

2. Install OpenAF:

   ```bash
   mkdir _oaf
   cd _oaf
   curl https://openaf.io/openaf.jar -o openaf.jar
   java -jar openaf.jar --install
   cd ..
   ```

3. Build the project:

   ```bash
   _oaf/ojob build.yaml
   ```

This will create two main files:

* openaf.jar
* openaf.jar.orig

### Testing

To test the project, you can use the following command:

```bash
cd tests
java -jar ../openaf.jar --ojob -e autoTestAll.yaml
```
