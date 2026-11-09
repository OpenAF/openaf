# ow.java

[Home](../../index.md) / [All APIs](../../all-apis.md) / [ow](../index.md) / [ow.java](index.md)

## Subcategories

- [ow.java.IMAP](imap/index.md)
- [ow.java.JMX](jmx/index.md)
- [ow.java.cipher](cipher/index.md)
- [ow.java.maven](maven/index.md)

<a id="api-ow-java-imap-0843ef62"></a>

## ow.java.IMAP

### ow.java.IMAP(aServer, aUser, aPassword, isSSL, aPort, isReadOnly)

Creates an instance to access aServer, using aUser and aPassword through a optional aPort and optionally using isSSL = true to use SSL. If isReadOnly = true the folders will be open only as read-only.

Sources:

- js/owrap.java.js:929

<a id="api-ow-java-jmx-7f0ccbf5"></a>

## ow.java.JMX

### ow.java.JMX(aURL, aUser, aPass, aProvider) : JMX

Creates a JMX connection to the provided URL (similar to service:jmx:rmi:///jndi/rmi://1.2.3.4:1234/jmxrmi or a map with a host and a port). Optionally, if necessary, aUser and aPass. To customize the JMX provider use aProvider.

Sources:

- js/owrap.java.js:751

<a id="api-ow-java-__diagnamespacecommand-b8249643"></a>

## ow.java.&#95;&#95;diagNamespaceCommand

### ow.java.&#95;&#95;diagNamespaceCommand(target, command, options) : String

Explicit nsenter transport. nsenterHelper is an argument array naming an already installed
modern OpenAF launcher and java-diagnostic-helper.js inside the target mount namespace.
Uses existing caller privileges and target UID/GID. Never retries submitted commands.

Sources:

- js/owrap.java.js:3146

<a id="api-ow-java-checkdigest-2daf01cd"></a>

## ow.java.checkDigest

### ow.java.checkDigest(aDigestString, aMessage) : boolean

Given aDigestString (e.g. &#91;algorithm&#93;:&#91;digest&#93;) and aMessage will verify the digest verifies returning true or false

Sources:

- js/owrap.java.js:47

<a id="api-ow-java-cipher-77db9e4b"></a>

## ow.java.cipher

### ow.java.cipher(anAlgorithm)

Creates an ow.java.cipher to use anAlgorithm (defaults to RSA/ECB/OAEPWITHSHA-512ANDMGF1PADDING).

Sources:

- js/owrap.java.js:1181

<a id="api-ow-java-classhistogram-b31c1a92"></a>

## ow.java.classHistogram

### ow.java.classHistogram(target, options) : Map

Captures a histogram. Defaults to live objects and may trigger GC/pause; `live:false` includes unreachable objects.

Sources:

- js/owrap.java.js:3054

<a id="api-ow-java-collectoom-463c3019"></a>

## ow.java.collectOOM

### ow.java.collectOOM(target, options) : Map

Returns a lightweight timestamped snapshot with section sources and errors. Does not request GC or dumps.
Target must be `self` or a PID. Linux evidence includes proc status/limits and resolved cgroup memory files.

Sources:

- js/owrap.java.js:2989

<a id="api-ow-java-diagnosticcapabilities-a238ecc8"></a>

## ow.java.diagnosticCapabilities

### ow.java.diagnosticCapabilities(target, options) : Map

Reports helper runtime and target diagnostic help. Requires `self` or an explicit PID.
Java 8 supports self management; the Linux socket fallback requires Java 16+.

Sources:

- js/owrap.java.js:2966

<a id="api-ow-java-diagnosticresult-ca98d07f"></a>

## ow.java.diagnosticResult

### ow.java.diagnosticResult(target, command, options) : Map

Collects diagnostic text with timing and an explicit uncertain outcome on failure.
Does not retry. A timeout never guarantees cancellation in the target JVM.

Sources:

- js/owrap.java.js:3131

<a id="api-ow-java-digestashex-d8790ea6"></a>

## ow.java.digestAsHex

### ow.java.digestAsHex(aAlg, aMessage) : String

Given an avaiable JVM aAlg(orithm) (check with ow.java.getDigestAlgs) will return the corresponding aMessage  (which can be a string, byte array, ByteBuffer, File or InputStream) digest in hexadecimal format.

Sources:

- js/owrap.java.js:35

<a id="api-ow-java-gc-c5c4c3ba"></a>

## ow.java.gc

### ow.java.gc()

Executes the Java runtime gargabe collector.

Sources:

- js/owrap.java.js:2034

<a id="api-ow-java-getaddresstype-0d95c480"></a>

## ow.java.getAddressType

### ow.java.getAddressType(aAddress) : Map

Given aAddress tries to return a map with the following flags: isValidAddress, hostname, ipv4, ipv6 and privateAddress

Sources:

- js/owrap.java.js:2198

<a id="api-ow-java-getccpu-de68087f"></a>

## ow.java.getCCPU

### ow.java.getCCPU(aReadFileFn) : Map

Returns a map with the current cgroup cpu stats. Optionally you can provide a aReadFileFn that should expect the full path on a linux cgroup root filesystem and return a string with the corresponding contents.

Sources:

- js/owrap.java.js:1925

<a id="api-ow-java-getcmemory-1c5b0251"></a>

## ow.java.getCMemory

### ow.java.getCMemory(shouldFormat, aReadFileFn, aFileExistsFn) : Map

Returns a map with the current cgroup runtime max, total, used and free memory. If shouldFormat = true ow.format.toBytesAbbreviation will be used. Optionally you can provide a aReadFileFn that should expect the full path on a linux cgroup root filesystem and return a string with the corresponding contents.

Sources:

- js/owrap.java.js:1813

<a id="api-ow-java-getclasspath-ada183ec"></a>

## ow.java.getClassPath

### ow.java.getClassPath() : String

Retrieves the initial java classpath.

Sources:

- js/owrap.java.js:2054

<a id="api-ow-java-getclassversion-5e018796"></a>

## ow.java.getClassVersion

### ow.java.getClassVersion(aClassBytes) : String

Given the class array of bytes (aClassBytes), or a string from which the corresponding bytes will be read, tries to determine the minimum JVM version required to load the class.

Sources:

- js/owrap.java.js:2289

<a id="api-ow-java-getdigestalgs-f6c3175d"></a>

## ow.java.getDigestAlgs

### ow.java.getDigestAlgs() : Array

Retrieves the current JVM list of digest algorithms (and provider) to be used with ow.java.digestAsHex.

Sources:

- js/owrap.java.js:10

<a id="api-ow-java-gethost2ip-7750527c"></a>

## ow.java.getHost2IP

### ow.java.getHost2IP(aHost) : String

Tries to resolve aHost to an IP address using the default DNS.

Sources:

- js/owrap.java.js:2243

<a id="api-ow-java-getip2host-1e0718b1"></a>

## ow.java.getIP2Host

### ow.java.getIP2Host(aIP) : String

Tries to reverse DNS aIP to a host address using the default DNS.

Sources:

- js/owrap.java.js:2255

<a id="api-ow-java-getinputarguments-1adaf01f"></a>

## ow.java.getInputArguments

### ow.java.getInputArguments() : Array

List of Java virtual machine input arguments

Sources:

- js/owrap.java.js:2064

<a id="api-ow-java-getjarversion-6fa294bc"></a>

## ow.java.getJarVersion

### ow.java.getJarVersion(aJarFile) : Array

Given aJarFile will return an array of JVM versions used in java classes contained.

Sources:

- js/owrap.java.js:2267

<a id="api-ow-java-getlibrarypath-aa90dd2b"></a>

## ow.java.getLibraryPath

### ow.java.getLibraryPath() : String

Retrieves the initial OS library path.

Sources:

- js/owrap.java.js:2074

<a id="api-ow-java-getlinuxcpuinfo-d854de83"></a>

## ow.java.getLinuxCPUInfo

### ow.java.getLinuxCPUInfo(aReadFileFn) : Array

Parses a Linux CPU info. Optionally you can provide a aReadFileFn that should expect the full path on a linux /proc root filesystem and return a string with the corresponding contents.

Sources:

- js/owrap.java.js:1986

<a id="api-ow-java-getlinuxuptime-39960f57"></a>

## ow.java.getLinuxUptime

### ow.java.getLinuxUptime(aReadFileFn) : Array

Parses a Linux uptme info. Optionally you can provide a aReadFileFn that should expect the full path on a linux /proc root filesystem and return a string with the corresponding contents.

Sources:

- js/owrap.java.js:1904

<a id="api-ow-java-getlocaljavapids-78fa6f12"></a>

## ow.java.getLocalJavaPIDs

### ow.java.getLocalJavaPIDs(aUserID, aTmpDir) : Array

Will return an array with the pid and the path for hsperf (to use with ow.java.parseHSPerf) that are currently running (hotspot jvms only) in the current system.  If aUserID is not provided the current user name will be used. Optionally you can provide aTmpDir to use a different temporary directory.

Sources:

- js/owrap.java.js:2391

<a id="api-ow-java-getmemory-e6c7951f"></a>

## ow.java.getMemory

### ow.java.getMemory(shouldFormat) : Map

Returns a map with the current java runtime max, total, used and free heap memory. If shouldFormat = true ow.format.toBytesAbbreviation will be used.

Sources:

- js/owrap.java.js:2002

<a id="api-ow-java-getsystemproperties-0d693b00"></a>

## ow.java.getSystemProperties

### ow.java.getSystemProperties() : Map

Retrieves the current list of system properties.

Sources:

- js/owrap.java.js:2044

<a id="api-ow-java-getwhois-c6393ce1"></a>

## ow.java.getWhoIs

### ow.java.getWhoIs(aQuery, aInitServer) : Map

Tries to perform a whois aQuery for a domain or an ip address. Optionally you can provide aInitServer (defaults to whois.iana.org)

Sources:

- js/owrap.java.js:2325

<a id="api-ow-java-heapdump-5f041f12"></a>

## ow.java.heapDump

### ow.java.heapDump(target, file, options) : Map

Explicitly writes a heap dump in the target filesystem. Defaults to live objects; may pause and collect.
`live:false` includes unreachable objects. `gzip` requests target-supported compression.
Existing files are never overwritten. Use an absolute unique path.

Sources:

- js/owrap.java.js:3098

<a id="api-ow-java-hprofsummary-94f4fd71"></a>

## ow.java.hprofSummary

### ow.java.hprofSummary(file, options) : Map

Returns HPROF header, counts and a class histogram without retaining the object graph.
`maxMetadata` bounds name/class metadata. Summary payload bytes exclude object headers and alignment.

Sources:

- js/owrap.java.js:2848

<a id="api-ow-java-ini-1ad80f84"></a>

## ow.java.ini

### ow.java.ini() : Object

Returns an object to handle Windows INI / Java properties kind of files. Available methods are:

- `load(content)`: Given a INI/properties file content converts to an internal format
- `loadFile(aFile)`: Loads a file with load()
- `get()`: Returns a map of the internal format representation
- `put(aMap)`: Read `aMap` into the internal format representation (arrays not fully supported)
- `save()`: Returns a INI/properties string
- `saveFile(aFile)`: Saves a file using save()

Examples:

```javascript
ow.java.ini().loadFile("/etc/os-release").get()
ow.java.ini().put(myMap).save()
```

Sources:

- js/owrap.java.js:2084

<a id="api-ow-java-jcmd-17477770"></a>

## ow.java.jcmd

### ow.java.jcmd(aPid, aJCmd, options) : String

Executes a target diagnostic command and returns text. Use `self` for the current JVM.
Options: `transport` (auto, attach, socket), `tmpDir`, `initialize` (true), `timeoutMs` (30000),
`maxOutputBytes` (16777216). Socket deadlines apply on Linux Java 16+; the Attach API may block.
Attach socket status errors throw. A timeout does not cancel target execution. No submitted command is retried.

Sources:

- js/owrap.java.js:2866

<a id="api-ow-java-nativememory-961da956"></a>

## ow.java.nativeMemory

### ow.java.nativeMemory(target, options) : Map

Returns a native-memory summary. NMT generally needs startup enablement; this method does not enable it.

Sources:

- js/owrap.java.js:3120

<a id="api-ow-java-parsehprof-ff3f6a69"></a>

## ow.java.parseHPROF

### ow.java.parseHPROF(file, callback, options) : Map

Streams HotSpot HPROF records through `callback`; return false to stop. Reads plain or gzip files in two passes.
Options: `values` (false), `arrayLimit` (32), `maxMetadata` (1000000), `maxMetadataBytes` (268435456 string bytes), `type`, `className`, `objectId`.
IDs and long field values are strings. Payload bytes are serialized sizes, not retained sizes.

Sources:

- js/owrap.java.js:2826

<a id="api-ow-java-parsehsperf-f9d4f576"></a>

## ow.java.parseHSPerf

### ow.java.parseHSPerf(aByteArrayOrFile, retFlat, options) : Map

Given aByteArray or a file path for a java (hotspot jvm) hsperf file (using ow.java.getLocalJavaPIDs or similar) will return the java performance information parsed into a map. If retFlat = true the returned map will be a flat map with each java performance metric and correspondent exact string value. Nested output includes available derived calculations with the prefix "&#95;&#95;". Supports HotSpot perfdata 2.0 (Java 8+), with long scalars and UTF-8 strings. options.metadata=true returns &#123;values, header, entries&#125;; entries use original counter names. options.strict=true throws descriptive parse errors, including unsupported counter types/shapes; otherwise unsupported counters are skipped and invalid or inaccessible buffers return 4. File and argument errors throw. Header overflow reports counters that could not be stored. Derived timer values use the reported frequency; application time is an estimate.

Sources:

- js/owrap.java.js:2413

<a id="api-ow-java-parsejfr-b138bff0"></a>

## ow.java.parseJFR

### ow.java.parseJFR(aFile, aFnRec, includeDesc) : Array

Given aFile (a Java Flight Recorder file) will parse it and call aFnRec for each event found, if defined. Optionally you can provide aFnRec to receive each event as a map with the following fields: startTime, endTime, duration, name, thread and fields. If includeDesc is true it will include a field (&#95;&#95;desc&#95;) for each field added with the description of the field.

Sources:

- js/owrap.java.js:578

<a id="api-ow-java-pidcheckjfr-fbfc8a05"></a>

## ow.java.pidCheckJFR

### ow.java.pidCheckJFR(aPid) : String

Tries to attach to local JVM with aPid and check the current Java Flight Recorder recording status.

Sources:

- js/owrap.java.js:567

<a id="api-ow-java-piddumpjfr-c805a963"></a>

## ow.java.pidDumpJFR

### ow.java.pidDumpJFR(aPid, aName, aFile) : String

Tries to attach to local JVM with aPid and dump a Java Flight Recorder returning the output.

Sources:

- js/owrap.java.js:548

<a id="api-ow-java-pidstartjfr-46dbf03e"></a>

## ow.java.pidStartJFR

### ow.java.pidStartJFR(aPid, aDuration, aName, aMaxSize) : String

Tries to attach to local JVM with aPid and start a Java Flight Recorder returning the output.

Sources:

- js/owrap.java.js:511

<a id="api-ow-java-pidstopjfr-0a204724"></a>

## ow.java.pidStopJFR

### ow.java.pidStopJFR(aPid, aName) : String

Tries to attach to local JVM with aPid and stop a Java Flight Recorder returning the output.

Sources:

- js/owrap.java.js:531

<a id="api-ow-java-pidsystemproperties-5ab47bce"></a>

## ow.java.pidSystemProperties

### ow.java.pidSystemProperties(aPid) : Map

Tries to attach to local JVM with aPid and retrieve the system properties.

Sources:

- js/owrap.java.js:728

<a id="api-ow-java-pidthreaddump-3d5b4e35"></a>

## ow.java.pidThreadDump

### ow.java.pidThreadDump(aPid) : String

Tries to attach to local JVM with aPid and execute a thread dump returning the output.

Sources:

- js/owrap.java.js:741

<a id="api-ow-java-setignoressldomains-9fe6427e"></a>

## ow.java.setIgnoreSSLDomains

### ow.java.setIgnoreSSLDomains(aList, aPassword)

Replaces the current Java SSL socket factory with a version with a custom trust manager that will "ignore" verification of SSL certificates whose domains are part of aList (if no aList is provided defaults DANGEROUSLY to all). Optionally  aPassword for the key store can be forced.

WARNING: this should only be used in advanced setups where you know what are doing since it DISABLES IMPORTANT SECURITY FEATURES.

Sources:

- js/owrap.java.js:2578

<a id="api-ow-java-threaddump-195ac6ea"></a>

## ow.java.threadDump

### ow.java.threadDump(target, options) : String

Returns a platform-thread dump. `file` requests a virtual-thread-capable JSON file on supporting JVMs.

Sources:

- js/owrap.java.js:3066

