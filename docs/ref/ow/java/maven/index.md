# ow.java.maven

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.java](../index.md) / [ow.java.maven](index.md)

<a id="api-ow-java-maven-getfile-9879d36b"></a>

## ow.java.maven.getFile

### ow.java.maven.getFile(artifactId, aFilenameTemplate, aOutputDir)

Given the `artifactId` (prefixed with the group id using ".") will try to download the latest version of the `aFilenameTemplate` (where
version will translate to the latest version) on the provided `aOutputDir`.

Example:

```javascript
getFile("com.google.code.gson.gson", "gson-{{version}}.jar", ".")
```

Sources:

- js/owrap.java.js:419

<a id="api-ow-java-maven-getfileversion-094642e1"></a>

## ow.java.maven.getFileVersion

### ow.java.maven.getFileVersion(artifactId, aFilenameTemplate, aVersion, aOutputDir)

Given the `artifactId` (prefixed with the group id using ".") will try to download the specific version of the `aFilenameTemplate` (where
version will translate to the latest version) on the provided `aOutputDir`.

Example:

```javascript
getFile("com.google.code.gson.gson", "gson-{{version}}.jar", "1.2.3", ".")
```

Sources:

- js/owrap.java.js:264

<a id="api-ow-java-maven-getlateststableversion-378f06df"></a>

## ow.java.maven.getLatestStableVersion

### ow.java.maven.getLatestStableVersion(aURI) : String

Get the highest stable version (excluding alpha, beta, milestones, release candidates, snapshots, etc...) from the provided aURI for a Maven 2 repository. Returns undefined if no stable version is found.

Sources:

- js/owrap.java.js:202

<a id="api-ow-java-maven-getlatestversion-639b60e3"></a>

## ow.java.maven.getLatestVersion

### ow.java.maven.getLatestVersion(aURI) : String

Get the latest version from the provide aURI for a Maven 2 repository.

Sources:

- js/owrap.java.js:147

<a id="api-ow-java-maven-getlatestversionga-8c11d457"></a>

## ow.java.maven.getLatestVersionGA

### ow.java.maven.getLatestVersionGA(aGroupId, aArtifactId, onlyStable) : String

Same as getLatestVersionString but with separate aGroupId and aArtifactId (needed when the artifactId itself contains dots, e.g. jakarta.xml.bind:jakarta.xml.bind-api). If onlyStable = true pre-release versions are ignored.

Sources:

- js/owrap.java.js:453

<a id="api-ow-java-maven-getlatestversionstring-9ebdedab"></a>

## ow.java.maven.getLatestVersionString

### ow.java.maven.getLatestVersionString(artifactId, onlyStable) : String

Given the artifactId (prefixed with the group id using ".") will try to determine the latest version and return the corresponding string. If onlyStable = true pre-release versions (alpha, beta, rc, milestones, snapshots, etc...) are ignored.

Sources:

- js/owrap.java.js:440

<a id="api-ow-java-maven-getlicensebyversion-d91ec425"></a>

## ow.java.maven.getLicenseByVersion

### ow.java.maven.getLicenseByVersion(artifactId, aFilenameTemplate, aVersion, aOutputDir)

Given the `artifactId` (prefixed with the group id using ".") will try to update a LICENSES.txt on the provided `aOutputDir` based
on `aFilenameTemplate` (where version will translate to the latest version).

Example:

```javascript
getLicenseByVersion("com.google.code.gson.gson", "gson-{{version}}.jar", "1.2.3", ".")
```

Sources:

- js/owrap.java.js:216

<a id="api-ow-java-maven-getversions-a1bd3f05"></a>

## ow.java.maven.getVersions

### ow.java.maven.getVersions(aURI) : Array

Returns the array of all versions listed in the maven-metadata.xml of the provided aURI for a Maven 2 repository.

Sources:

- js/owrap.java.js:166

<a id="api-ow-java-maven-isstableversion-d2632a67"></a>

## ow.java.maven.isStableVersion

### ow.java.maven.isStableVersion(aVersion) : boolean

Returns false if aVersion looks like a pre-release (e.g. alpha, beta, milestone, rc, cr, preview, ea, snapshot, dev, nightly...) and true otherwise (e.g. 1.2.3, 1.2.3.Final, 1.2.3-jre, 5.0.0.RELEASE, 1.0-GA).

Sources:

- js/owrap.java.js:180

<a id="api-ow-java-maven-processmavenfile-bcd84eda"></a>

## ow.java.maven.processMavenFile

### ow.java.maven.processMavenFile(aFolder, shouldDeleteOld, aLogFunc)

Processes a ".maven.yaml" or ".maven.json" on aFolder. Optionally you can specify that is should not delete old versions and/or provide a specific log function (defaults to log). The ".maven.yaml/json" file is expected to contain an artifacts map with an array of maps each with: group (maven artifact group), id (maven id), version (optionally if not the latest), output (optionally specify a different output folder than aFolder), testFunc (optionally a test function to determine which files should be deleted).

Sources:

- js/owrap.java.js:361

<a id="api-ow-java-maven-removeoldversions-b7833519"></a>

## ow.java.maven.removeOldVersions

### ow.java.maven.removeOldVersions(artifactId, aFilenameTemplate, aVersion, aOutputDir, aFunction)

Given the artifactId (prefixed with the group id using ".") will try to delete from aOutputDir all versions that aren't the specific aVersion  of the aFilenameTemplate (where version will translate to the specific version). Optionally you can provide aFunction that receives the canonical filename of each potential version and will only delete it if the function returns true.

Sources:

- js/owrap.java.js:466

### ow.java.maven.removeOldVersions(artifactId, aFilenameTemplate, aOutputDir, aFunction)

Given the artifactId (prefixed with the group id using ".") will try to delete from aOutputDir all versions that aren't the latest version  of the aFilenameTemplate (where version will translate to the latest version). Optionally you can provide aFunction that receives the canonical filename of each potential version and will only delete it if the function returns true.

Sources:

- js/owrap.java.js:497

<a id="api-ow-java-maven-search-c4aff372"></a>

## ow.java.maven.search

### ow.java.maven.search(aTerm) : Array

Tries to search aTerm in maven.org and then fallsback to archetype-catalog.xml returning an array with groupId and artifactId.

Sources:

- js/owrap.java.js:93

