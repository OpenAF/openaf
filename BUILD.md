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

In an installed OpenAF directory, run `./oaf --repack` after replacing the JAR or
changing the JDK to refresh the `.shared.oaf` archive used by generated launchers.
Repacking trains and validates archive coverage while retaining the existing
class path. See [Shared archive coverage](docs/cds.md) for fallback behavior and
verification commands.

On Linux and macOS, repacking publishes the completed JAR with an atomic rename
so the running JVM can continue loading classes from its original open file.
The temporary JAR and destination must be on the same filesystem; an unsupported
atomic move fails without overwriting the running JAR. Installation symlinks and
JAR permissions are preserved. Windows uses its detached updater after JVM exit.

### Testing

To test the project, you can use the following command:

```bash
cd tests
java -jar ../openaf.jar --ojob -e autoTestAll.yaml
```
