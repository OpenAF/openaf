// OpenWrap v2
// Copyright 2023 Nuno Aguiar
// Java
 
OpenWrap.java = function() {
	return ow.java;
};

/**
 * <odoc>
 * <key>ow.java.getDigestAlgs() : Array</key>
 * Retrieves the current JVM list of digest algorithms (and provider) to be used with ow.java.digestAsHex.
 * </odoc> 
 */
OpenWrap.java.prototype.getDigestAlgs = function() {
    var data = []
    var providers = af.fromJavaArray(java.security.Security.getProviders())

    for(var provider of providers) {
        var svcs = provider.getServices()
        for(var service of svcs) {
            if (String(service.getType()).toLowerCase() == "messagedigest") {
                data.push({ 
                    provider: String(provider.toString()), 
                    algorithm: String(service.getAlgorithm()) 
                })
            }
        }
    }
    
    return data
}

/**
 * <odoc>
 * <key>ow.java.digestAsHex(aAlg, aMessage) : String</key>
 * Given an avaiable JVM aAlg(orithm) (check with ow.java.getDigestAlgs) will return the corresponding aMessage
 *  (which can be a string, byte array, ByteBuffer, File or InputStream) digest in hexadecimal format.
 * </odoc>
 */
OpenWrap.java.prototype.digestAsHex = function(aAlg, aMsg) {
    _$(aAlg, "aAlg").isString().$_()
    return String(Packages.org.apache.commons.codec.digest.DigestUtils(aAlg).digestAsHex(aMsg)) 
}

/**
 * <odoc>
 * <key>ow.java.checkDigest(aDigestString, aMessage) : boolean</key>
 * Given aDigestString (e.g. [algorithm]:[digest]) and aMessage will verify the digest verifies returning true or false
 * </odoc>
 */
OpenWrap.java.prototype.checkDigest = function(aDigest, aMsg) {
    _$(aDigest, "aDigest").isString().$_()
    _$(aMsg, "aMsg").$_()

    var oafi = [ "md2", "md5", "sha1", "sha256", "sha384", "sha512" ]
    var alg = aDigest.substring(0, aDigest.indexOf(":")).toLowerCase()
    var msg = aDigest.substring(alg.length + 1)
    var lst = ow.java.getDigestAlgs()
    if (oafi.indexOf(alg) >= 0 || $from(lst).equals("algorithm", alg).any()) {
        switch(alg) {
        case "md2": return md2(aMsg) == msg
        case "md5": return md5(aMsg) == msg
        case "sha1": return sha1(aMsg) == msg
        case "sha256": return sha256(aMsg) == msg
        case "sha384": return sha384(aMsg) == msg
        case "sha512": return sha512(aMsg) == msg
        default:
            return ow.java.digestAsHex($from(lst).equals("algorithm", alg).at(0).algorithm, aMsg) == msg
        }
    } else {
        throw "'" + alg + "' not supported with this java version."
    }
}

OpenWrap.java.prototype.maven = function() {
    ow.loadObj();
    this.urls = [
        "https://repo1.maven.org/maven2",
        "https://repo.maven.apache.org/maven2"
    ];
};

OpenWrap.java.prototype.maven.prototype._translateArtifact = function(artifactId) {
    return artifactId.replace(/\./g, "/");
};

OpenWrap.java.prototype.maven.prototype._getURL = function() {
    return this.urls[Math.round(Math.random() * (this.urls.length - 1))];
};

/**
 * <odoc>
 * <key>ow.java.maven.search(aTerm) : Array</key>
 * Tries to search aTerm in maven.org and then fallsback to archetype-catalog.xml returning an array with groupId and artifactId.
 * </odoc>
 */
OpenWrap.java.prototype.maven.prototype.search = function(aTerm) {
    plugin("XML");
    ow.loadObj();

    var r = [];
    var res = ow.obj.rest.jsonGet("https://search.maven.org/solrsearch/select?" + ow.obj.rest.writeQuery({ q: aTerm, rows: 999, wt: "json" }));
    if (isDef(res.response.docs) && isArray(res.response.docs)) {
        for(var ii = 0; ii < res.response.docs.length; ii++) {
            r.push({
                groupId: res.response.docs[ii].g,
                artifactId: res.response.docs[ii].a
            });
        }
    }

    if (r.length > 0) return $from(r).sort("groupId").select();

    var xml = new XML(ow.obj.rest.get(this._getURL() + "/archetype-catalog.xml").response).toNativeXML();
    res = eval('xml.archetypes.archetype.(new RegExp(".*" + aTerm + ".*", "i").test(artifactId))');
    for(var ii = 0 ; ii < res.length(); ii++) {
        r.push({
            groupId: res.groupId[ii].toString(),
            artifactId: res.artifactId[ii].toString(),
            description: res.description[ii].toString()
        });
    }

    res = eval('xml.archetypes.archetype.(new RegExp(".*" + aTerm + ".*", "i").test(groupId))');
    for(var ii = 0 ; ii < res.length(); ii++) {
        r.push({
            groupId: res.groupId[ii].toString(),
            artifactId: res.artifactId[ii].toString(),
            description: res.description[ii].toString()
        });
    }

    if (r.length > 0) return $from(r).distinct();

    res = eval('xml.archetypes.archetype.(new RegExp(".*" + aTerm + ".*", "i").test(description))');
    for(var ii = 0 ; ii < res.length(); ii++) {
        r.push({
            groupId: res.groupId[ii].toString(),
            artifactId: res.artifactId[ii].toString(),
            description: res.description[ii].toString()
        });
    }
};

/**
 * <odoc>
 * <key>ow.java.maven.getLatestVersion(aURI) : String</key>
 * Get the latest version from the provide aURI for a Maven 2 repository.
 * </odoc>
 */
OpenWrap.java.prototype.maven.prototype.getLatestVersion = function(aURI) {
    plugin("XML");
    var xml = new XML(ow.obj.rest.get(this._getURL() + "/" + aURI + "/maven-metadata.xml").response);
    var x = xml.toNativeXML();

    var ver = x.versioning.latest.toString();
    if (isUnDef(ver) || ver == "") ver = x.version.toString();

    return ver;
};

/**
 * <odoc>
 * <key>ow.java.maven.getLicenseByVersion(artifactId, aFilenameTemplate, aVersion, aOutputDir)</key>
 * Given the artifactId (prefixed with the group id using ".") will try to update a LICENSES.txt on the provided aOutputDir based
 * on aFilenameTemplate (where version will translate to the latest version).\
 * \
 * Example:\
 *    getLicenseByVersion("com.google.code.gson.gson", "gson-{{version}}.jar", "1.2.3", ".")\
 * \
 * </odoc>
 */
OpenWrap.java.prototype.maven.prototype.getLicenseByVersion = function(artifactId, aFilenameTemplate, aVersion, aOutputDir) {
    var aURI = this._translateArtifact(artifactId);
    var version = _$(aVersion).default(this.getLatestVersion(aURI));
    var filename = templify(aFilenameTemplate.replace(/\.jar$/, ".pom"), {
        version: version
    });
    var ofilename = templify(aFilenameTemplate, {
        version: version
    });

    var m = $rest().get(this._getURL() + "/" + aURI + "/" + version + "/" + filename);
    var mo = af.fromXML2Obj(m);

    io.mkdir(aOutputDir);
    var lics = {};
    if (io.fileExists(aOutputDir + "/LICENSES.txt")) {
        lics = io.readFileYAML(aOutputDir + "/LICENSES.txt");
    }
    var licenseTxt = $rest().get(mo.project.licenses.license.url);

    lics[ofilename] = {
        name: mo.project.licenses.license.name,
        url: mo.project.licenses.license.url,
        version: version,
        "changed from original": false,
        comments: (isDef(mo.project.licenses.license.comments) && 
                   isString(mo.project.licenses.license.comments) ? mo.project.licenses.license.comments : ""),

        license: (isString(licenseTxt) ? licenseTxt.replace(/<[^\>]+\>/g, "").trim() : "")
    };
    io.writeFileYAML(aOutputDir + "/LICENSES.txt", lics);
};

/**
 * <odoc>
 * <key>ow.java.maven.getFileVersion(artifactId, aFilenameTemplate, aVersion, aOutputDir)</key>
 * Given the artifactId (prefixed with the group id using ".") will try to download the specific version of the aFilenameTemplate (where
 * version will translate to the latest version) on the provided aOutputDir.\
 * \
 * Example:\
 *    getFile("com.google.code.gson.gson", "gson-{{version}}.jar", "1.2.3", ".")\
 * \
 * </odoc>
 */
OpenWrap.java.prototype.maven.prototype.getFileVersion = function(artifactId, aFilenameTemplate, aVersion, aOutputDir) {
    var aURI = this._translateArtifact(artifactId);
    var version = aVersion;
    var filename = templify(aFilenameTemplate, {
        version: version
    });

    var h = new ow.obj.http(this._getURL() + "/" + aURI + "/" + version + "/" + filename, "GET", "", __, true, __, true);

    io.mkdir(aOutputDir);
    var rstream = h.responseStream();
    var wstream = io.writeFileStream(aOutputDir + "/" + filename);
    ioStreamCopy(wstream, rstream);
};

OpenWrap.java.prototype.maven.prototype.getDependencies = function(artifactId, aVersion, aOutputDir, aScope, aList, props) {
    loadLodash();
    ow.loadObj();

    var aURI = this._translateArtifact(artifactId);
    var version = (isUnDef(aVersion) ? this.getLatestVersion(aURI) : aVersion);
    var filename = artifactId.substring(artifactId.lastIndexOf(".") + 1) + "-" + version + ".pom";
    var scope = _$(aScope).isString().default("");
    aList = _$(aList).default(new ow.obj.syncArray());
    props = _$(props).isMap().default({});

    var info = new ow.obj.syncArray(), x;
    try {
        var h = $rest({ throwExceptions: false }).get(this._getURL() + "/" + aURI + "/" + version + "/" + filename);
        if (isDef(h.error) && h.error.responseCode == 404) return _.uniqBy(info.toArray(), v => { return v.groupId + "." + v.artifactId; });;

        h = h.replace(/(.*\n)*.*<project( [^>]+)>/, "<project>");
        x = af.fromXML2Obj(h);
    
        if (isDef(x.project.dependencies) && isDef(x.project.dependencies.dependency)) {
            //for(var ii = 0; ii < x.project.dependencies.dependency.length; ii++) {
            parallel4Array(x.project.dependencies.dependency, v => {
                if (isUnDef(v.scope) || (v.scope == scope)) {
                    if (isUnDef(v.optional) || !v.optional) {
                        if (isDef(x.project.properties)) props = merge(props, x.project.properties);

                        var pversion = __;
                        if (isDef(v.version)) {
                            var pversion = String(v.version);
                            if (pversion == "${project.version}") pversion = String(x.project.parent.version);
                            if (isDef(pversion) && pversion.startsWith("${")) pversion = String(props[pversion.replace(/^\${(.+)}$/, "$1")]);
                            var pgroupId = String(v.groupId);
                            if (pgroupId == "${project.groupId}") pgroupId = String(x.project.parent.groupId);
                        }

                        if (isDef(pgroupId)) {
                            info.add({
                                groupId: pgroupId,
                                artifactId: String(v.artifactId),
                                version: (isDef(pversion) ? pversion : __),
                                scope: (isDef(v.scope) ? String(v.scope) : __)
                            });
                            
                            if (aList.indexOf(pgroupId + "." + v.artifactId) < 0) {
                                var rinfo = this.getDependencies(pgroupId + "." + v.artifactId, pversion, __, aScope, aList, props);
                                aList.add(pgroupId + "." + v.artifactId);
                                info.addAll(rinfo);
                            }
                        }
                    }
                }
            });
        }
    } catch(e) {
        if (String(e).indexOf("FileNotFoundException") < 0 &&
            String(e).indexOf("NoSuchFileException") < 0) throw e
    }

    return _.uniqBy(info.toArray(), v => { return v.groupId + "." + v.artifactId; });
};

/**
 * <odoc>
 * <key>ow.java.maven.processMavenFile(aFolder, shouldDeleteOld, aLogFunc)</key>
 * Processes a ".maven.yaml" or ".maven.json" on aFolder. Optionally you can specify that is should not delete old versions and/or
 * provide a specific log function (defaults to log). The ".maven.yaml/json" file is expected to contain an artifacts map with an array
 * of maps each with: group (maven artifact group), id (maven id), version (optionally if not the latest), output (optionally specify a different
 * output folder than aFolder), testFunc (optionally a test function to determine which files should be deleted).
 * </odoc>
 */
OpenWrap.java.prototype.maven.prototype.processMavenFile = function(aDirectory, deleteOld, aLogFunc) {
    var arts;
    if (io.fileExists(aDirectory + "/.maven.yaml")) {
        arts = io.readFileYAML(aDirectory + "/.maven.yaml");
    } else {
        if (io.fileExists(aDirectory + "/.maven.json")) {
            arts = io.readFile(aDirectory + "/.maven.json");
        } else {
            throw "no .maven.yaml or .maven.json found at " + aDirectory;
        }
    }
    aLogFunc = _$(aLogFunc).isFunction().default(log);
    deleteOld = _$(deleteOld).isBoolean().default(true);

    if (isDef(arts) && isDef(arts.artifacts)) {
        var maven = new ow.java.maven();
        arts.artifacts.forEach((arts) => {
            var version, hasVersion = false;

            if (isDef(arts.version) && arts != "latest") {
                version = arts.version;
                hasVersion = true;
            } else {
                version = "{{version}}";
                hasVersion = false;
            }

            var testfunc;
            if (isDef(arts.testFunc)) {
                testfunc = newFn(arts.testFunc);
            }

            var outputDir = _$(arts.output).isString().default(aDirectory);
            var filenameTemplate = _$(arts.template).isString().default(arts.id + "-{{version}}.jar");
            if (hasVersion) {
                aLogFunc("Downloading " + arts.id + " version " + version + " jar file...");
                maven.getFileVersion(arts.group + "." + arts.id, filenameTemplate, version, outputDir);
                try { maven.getLicenseByVersion(arts.group + "." + arts.id, filenameTemplate, version, outputDir); } catch(e) {}
                if (deleteOld) maven.removeOldVersionsSpecific(arts.id, filenameTemplate, version, outputDir, testfunc);
            } else {
                aLogFunc("Downloading latest " + arts.id + " jar file...");
                maven.getFile(arts.group + "." + arts.id, filenameTemplate, outputDir);
                try { maven.getLicenseByVersion(arts.group + "." + arts.id, filenameTemplate, __, outputDir); } catch(e) {}
                if (deleteOld) maven.removeOldVersions(arts.id, filenameTemplate, outputDir, testfunc);
            }
        });
    }
};

/**
 * <odoc>
 * <key>ow.java.maven.getFile(artifactId, aFilenameTemplate, aOutputDir)</key>
 * Given the artifactId (prefixed with the group id using ".") will try to download the latest version of the aFilenameTemplate (where
 * version will translate to the latest version) on the provided aOutputDir.\
 * \
 * Example:\
 *    getFile("com.google.code.gson.gson", "gson-{{version}}.jar", ".")\
 * \
 * </odoc>
 */
OpenWrap.java.prototype.maven.prototype.getFile = function(artifactId, aFilenameTemplate, aOutputDir) {
    var aURI = this._translateArtifact(artifactId);
    var version = this.getLatestVersion(aURI);
    return this.getFileVersion(artifactId, aFilenameTemplate, version, aOutputDir);
};

/**
 * <odoc>
 * <key>ow.java.maven.getLatestVersionString(artifactId) : String</key>
 * Given the artifactId (prefixed with the group id using ".") will try to determine the latest version and return 
 * the corresponding string.
 * </odoc>
 */
OpenWrap.java.prototype.maven.prototype.getLatestVersionString = function(artifactId) {
    var aURI = this._translateArtifact(artifactId)
    var version = this.getLatestVersion(aURI)
    return version
}

/**
 * <odoc>
 * <key>ow.java.maven.removeOldVersions(artifactId, aFilenameTemplate, aVersion, aOutputDir, aFunction)</key>
 * Given the artifactId (prefixed with the group id using ".") will try to delete from aOutputDir all versions that aren't the specific aVersion 
 * of the aFilenameTemplate (where version will translate to the specific version). Optionally you can provide aFunction that receives
 * the canonical filename of each potential version and will only delete it if the function returns true.
 * </odoc>
 */
OpenWrap.java.prototype.maven.prototype.removeOldVersionsSpecific = function(artifactId, aFilenameTemplate, aVersion, aOutputDir, aFunction) {
    var aURI = this._translateArtifact(artifactId);
    var version = aVersion;
    var filename = templify(aFilenameTemplate, {
        version: version
    });
    var filenameT = templify(aFilenameTemplate, {
        version: ".*"
    });    

    if (isUnDef(aFunction)) {
        aFunction = function() { return true; };
    }

    $from(io.listFiles(aOutputDir).files)
    .notEquals("filename", filename)
    .match("filename", filenameT)
    .select((r) => {
        if (aFunction(r.canonicalPath)) io.rm(r.canonicalPath);
    });
};

/**
 * <odoc>
 * <key>ow.java.maven.removeOldVersions(artifactId, aFilenameTemplate, aOutputDir, aFunction)</key>
 * Given the artifactId (prefixed with the group id using ".") will try to delete from aOutputDir all versions that aren't the latest version 
 * of the aFilenameTemplate (where version will translate to the latest version). Optionally you can provide aFunction that receives
 * the canonical filename of each potential version and will only delete it if the function returns true.
 * </odoc>
 */
OpenWrap.java.prototype.maven.prototype.removeOldVersions = function(artifactId, aFilenameTemplate, aOutputDir, aFunction) {
    var aURI = this._translateArtifact(artifactId);
    return this.removeOldVersionsSpecific(artifactId, aFilenameTemplate, this.getLatestVersion(aURI), aOutputDir, aFunction);
};

/**
 * <odoc>
 * <key>ow.java.jcmd(aPid, aJCmd) : String</key>
 * Tries to attach to local JVM with aPid and execute aJCmd returning the output.
 * </odoc>
 */
OpenWrap.java.prototype.jcmd = function(aPid, aCmd) {
    aCmd = _$(aCmd, "aCmd").isString().default("help")
    var vm = Packages.com.sun.tools.attach.VirtualMachine.attach(aPid)
 
    var oo = vm.executeJCmd(aCmd)
    var os = af.newOutputStream()
    ioStreamCopy(os, oo)

    vm.detach()
    return String(os.toString())
}

/**
 * <odoc>
 * <key>ow.java.pidStartJFR(aPid, aDuration, aName, aMaxSize) : String</key>
 * Tries to attach to local JVM with aPid and start a Java Flight Recorder returning the output.
 * </odoc>
 */
OpenWrap.java.prototype.pidStartJFR = function(aPid, aDuration, aName, aMaxSize) {
    aDuration = _$(aDuration, "aDuration").isNumber().default(__)
    aName = _$(aName, "aName").isString().default(__)
    aMaxSize = _$(aMaxSize, "aMaxSize").isString().default(__)

    // Check for Java >= 14
    ow.loadFormat()
    var jver = ow.format.getJavaVersion()
    if (ow.format.semver(jver).getMajor() < 14) throw "Remote start of Java Flight Recorder is only available on Java 14 or later."

    var params = []
    if (isDef(aDuration)) params.push("duration=" + aDuration + "s")
    if (isDef(aName)) params.push("name=" + aName)
    if (isDef(aMaxSize)) params.push("maxsize=" + aMaxSize)

    return ow.java.jcmd(aPid, "JFR.start " + params.join(" "))
}

/**
 * <odoc>
 * <key>ow.java.pidStopJFR(aPid, aName) : String</key>
 * Tries to attach to local JVM with aPid and stop a Java Flight Recorder returning the output.
 * </odoc>
 */
OpenWrap.java.prototype.pidStopJFR = function(aPid, aName) {
    aName = _$(aName, "aName").isString().default(__)

    // Check for Java >= 14
    ow.loadFormat()
    var jver = ow.format.getJavaVersion()
    if (ow.format.semver(jver).getMajor() < 14) throw "Remote stop of Java Flight Recorder is only available on Java 14 or later."


    var params = []
    if (isDef(aName)) params.push("name=" + aName)
    
    return ow.java.jcmd(aPid, "JFR.stop " + params.join(" "))
}

/**
 * <odoc>
 * <key>ow.java.pidDumpJFR(aPid, aName, aFile) : String</key>
 * Tries to attach to local JVM with aPid and dump a Java Flight Recorder returning the output.
 * </odoc>
 */
OpenWrap.java.prototype.pidDumpJFR = function(aPid, aName, aFile) {
    aName = _$(aName, "aName").isString().default(__)
    aFile = _$(aFile, "aFile").isString().default(__)

    // Check for Java >= 14
    ow.loadFormat()
    var jver = ow.format.getJavaVersion()
    if (ow.format.semver(jver).getMajor() < 14) throw "Remote dump of Java Flight Recorder is only available on Java 14 or later."


    var params = []
    if (isDef(aName)) params.push("name=" + aName)
    if (isDef(aFile)) params.push("filename=" + aFile)
    
    return ow.java.jcmd(aPid, "JFR.dump " + params.join(" "))
}

/**
 * <odoc>
 * <key>ow.java.parseJFR(aFile, aFnRec, includeDesc) : Array</key>
 * Given aFile (a Java Flight Recorder file) will parse it and call aFnRec for each event found, if defined. Optionally you can provide aFnRec
 * to receive each event as a map with the following fields: startTime, endTime, duration, name, thread and fields.
 * If includeDesc is true it will include a field (__desc_) for each field added with the description of the field.
 * </odoc>
 */
OpenWrap.java.prototype.parseJFR = function(aFile, aFnRec, includeDesc) {
    includeDesc = _$(includeDesc, "includeDesc").isBoolean().default(false)

    // Check for Java >= 14
    ow.loadFormat()
    var jver = ow.format.getJavaVersion()
    if (ow.format.semver(jver).getMajor() < 14) throw "Parsing Java Flight Recorder files is only available on Java 14 or later."

    // Instantiate the Java Flight Recorder file
    var jfr = new java.nio.file.Path.of(aFile)
    var jfrp = new Packages.jdk.jfr.consumer.RecordingFile(jfr)

    var events = [], shouldReturnData = false
  
    // Check if a function was provided
    // if not provide the default function to return the data in an array
    if (isUnDef(aFnRec)) {
      aFnRec = event => {
        events.push(event)
      }
      shouldReturnData = true
    }
  
    // Helper function for parsing the fields
    // Receives the event and the field
    var fnRec = (ev, f) => {
      var value, t
      
      // Check if the field has a type name
      if (isDef(f.getTypeName)) {
        t = f.getTypeName()
      } else {
        t = f.getClass().getName()
      }
  
      // Switch the type and parse the value
      switch(String(t)) {
        case "boolean": value = Boolean(ev.getBoolean(f.getName())); break
        case "byte": value = ev.getByte(f.getName()); break
        case "char": value = String(ev.getChar(f.getName())); break
        case "double": value = Number(ev.getDouble(f.getName())); break
        case "float": value = Number(ev.getFloat(f.getName())); break
        case "int": value = Number(ev.getInt(f.getName())); break
        case "long": value = Number(ev.getLong(f.getName())); break
        case "short": value = Number(ev.getShort(f.getName())); break
        case "java.lang.Long": value = Number(ev.getLong(f.getName())); break
        case "java.lang.Integer": value = Number(ev.getInt(f.getName())); break
        case "java.lang.Double": value = Number(ev.getDouble(f.getName())); break
        case "java.lang.Float": value = Number(ev.getFloat(f.getName())); break
        case "java.lang.Boolean": value = Boolean(ev.getBoolean(f.getName())); break
        case "java.lang.Byte": value = ev.getByte(f.getName()); break
        case "java.lang.Short": value = Number(ev.getShort(f.getName())); break
        case "java.lang.Character": value = String(ev.getChar(f.getName()));
        case "java.lang.String": value = String(ev.getString(f.getName())); break
        default: 
            var evf = ev.getValue(f.getName())
            // Check if the field is an array
            if (f.isArray()) {
              // Parse the array in parallel
              value = pForEach(af.fromJavaArray(evf), ae => {
                // Parse the fields of the array
                return af.fromJavaArray(ae.getFields()).reduce((acc, field) => {
                  acc[field.getName()] = fnRec(ae, field)
                  if (includeDesc) acc["__desc_" + field.getName()] = field.getLabel() + (field.getDescription() == null ? "" : " - " + field.getDescription())
                  return acc
                }, {})
              })
            } else {
              if (!isNull(evf) && isDef(evf.getFields)) {
                // Parse the fields of the event
                value = af.fromJavaArray(evf.getFields()).reduce((acc, field) => {
                  acc[field.getName()] = fnRec(evf, field)
                  if (includeDesc) acc["__desc_" + field.getName()] = field.getLabel() + (field.getDescription() == null ? "" : " - " + field.getDescription())
                  return acc
                }, {})
              }
            }
        }
  
        return value
    }
  
    // Main loop
    try {
      // While there are more events
      while (jfrp.hasMoreEvents()) {
        // Read the next event
        var event = jfrp.readEvent()
        var fields = {}
  
        // Parse the fields of the event
        af.fromJavaArray(event.getFields()).forEach(f => {
          try {
            /*return { name: f.getName(), typeName: f.getTypeName(), typeId: f.getTypeId(), label: f.getLabel(), description: f.getDescription(), contentType: f.getContentType(), isArray: f.isArray(), value: value }*/
            fields[f.getName()] = fnRec(event, f)
            if (includeDesc) fields["__desc_" + f.getName()] = f.getLabel() + (f.getDescription() == null ? "" : " - " + f.getDescription())
          } catch(e) {
            printErr("Error parsing field " + f.getName() + " of type " + f.getTypeName())
            throw e
          }
        })
  
        // Call the function with the event
        aFnRec({
            startTime: ow.format.fromISODate(String(event.getStartTime().toString())),
            endTime: ow.format.fromISODate(String(event.getEndTime().toString())),
            duration: String(event.getDuration()),
            name: String(event.getEventType().getName()),
            thread: isNull(event.getThread()) ? {} : {
              id: Number(event.getThread().getId()),
              javaName: String(event.getThread().getJavaName()),
              javaid: Number(event.getThread().getJavaThreadId()),
              osName: String(event.getThread().getOSName()),
              osid: Number(event.getThread().getOSThreadId()),
              virtual: Boolean(event.getThread().isVirtual()),
              threadGroup: isNull(event.getThread().getThreadGroup()) ? "n/a" : String(event.getThread().getThreadGroup().getName())
            },
            fields: fields
        })
      }
    } finally {
      jfrp.close()
    }
  
    if (shouldReturnData) return events
}

/**
 * <odoc>
 * <key>ow.java.pidSystemProperties(aPid) : Map</key>
 * Tries to attach to local JVM with aPid and retrieve the system properties.
 * </odoc>
 */
OpenWrap.java.prototype.pidSystemProperties = function(aPid) {
    var vm = Packages.com.sun.tools.attach.VirtualMachine.attach(aPid)
    var props = vm.getSystemProperties()
    vm.detach()
    return af.fromJavaMap(props)
}

/**
 * <odoc>
 * <key>ow.java.pidThreadDump(aPid) : String</key>
 * Tries to attach to local JVM with aPid and execute a thread dump returning the output.
 * </odoc>
 */
OpenWrap.java.prototype.pidThreadDump = function(aPid) {
    var vm = Packages.com.sun.tools.attach.VirtualMachine.attach(aPid)
 
    var oo = vm.executeCommand("threaddump")
    var os = af.newOutputStream()
    ioStreamCopy(os, oo)

    vm.detach()
    return String(os.toString())
}

/**
 * <odoc>
 * <key>ow.java.JMX(aURL, aUser, aPass, aProvider) : JMX</key>
 * Creates a JMX connection to the provided URL (similar to service:jmx:rmi:///jndi/rmi://1.2.3.4:1234/jmxrmi or a map with a host and a port).
 * Optionally, if necessary, aUser and aPass. To customize the JMX provider use aProvider.
 * </odoc>
 */
OpenWrap.java.prototype.JMX = function(aURL, aUser, aPass, aProvider) {
    if (isMap(aURL)) aURL = templify("service:jmx:rmi:///jndi/rmi://{{host}}:{{port}}/jmxrmi", { host: aURL.host, port: aURL.port })
    aURL      = _$(aURL, "aURL").isString().default(__)
    aUser     = _$(aUser, "aUser").isString().default(__)
    aPass     = _$(aPass, "aPass").isString().default(__)
    aProvider = _$(aProvider, "aProvider").isString().default(__)

    plugin("JMX")
    this._jmx = new JMX(aURL, aUser, aPass, aProvider)
}

/**
 * <odoc>
 * <key>ow.java.JMX.queryNames(aQuery) : Array</key>
 * Given aQuery (similar to 'java.lang:*') given a JMX domain it will query the JMX target and return a list of registered domain + name + type ready to be used
 * with ow.java.JMX.getObject. 
 * </odoc>
 */
OpenWrap.java.prototype.JMX.prototype.queryNames = function(aQuery) {
    aQuery = _$(aQuery, "aQuery").isString().default("java.lang:*")
    if (aQuery.indexOf(":") < 0) aQuery += ":*"

    var res = this._jmx.getJavaServerConnection().queryMBeans(new javax.management.ObjectName(aQuery), null)
    return af.fromJavaArray(res.toArray()).map(r => String(r.getObjectName()))
}

/**
 * <odoc>
 * <key>ow.java.JMX.getAll() : Map</key>
 * Will query the JMX target for all registered domains, query the registered objects for each domain and returns a combined map of the corresponding values.
 * </odoc>
 */
OpenWrap.java.prototype.JMX.prototype.getAll = function() {
    var data = {}

    this.getDomains().sort().forEach(d => {
        data[d] = {}
        this.queryNames(d).sort().forEach(obj => {
            data[d] = merge(data[d], this.getObjects(obj))
        })
    })

    return data
}

/**
 * <odoc>
 * <key>ow.java.JMX.getDomains() : Array</key>
 * Will query the JMX target for existing domains to be used with ow.java.JMX.queryNames a return the corresponding list.
 * </odoc>
 */
OpenWrap.java.prototype.JMX.prototype.getDomains = function() {
    //return af.fromJavaArray(this._jmx.getJavaServerConnection().getDomains()).map(d => String(d))
    return this._jmx.getJavaServerConnection().getDomains().map(d => String(d))
}

/**
 * <odoc>
 * <key>ow.java.JMX.getJavaStd() : Map</key>
 * Will query the JMX target for the "java.lang.*" objects and return the corresponding map. 
 * </odoc>
 */
OpenWrap.java.prototype.JMX.prototype.getJavaStd = function() {
    return this.getObjects()
}

/**
 * <odoc>
 * <key>ow.java.JMX.getObjects(aObjectName) : Map</key>
 * Given a JMX domain + name + type or JMX aQuery (similar to the provided to ow.java.JMX.queryNames) will retrieve all objects
 * from each domain, name and type. The returned map will be organized by a map "name" entry with sub-map for each "type".
 * </odoc>
 */
OpenWrap.java.prototype.JMX.prototype.getObjects = function(aObj) {
    var res = { }, errors = []
    this.queryNames(aObj).sort().forEach(obj => {
        var type, name
        obj.substring(obj.indexOf(":") + 1).split(",").forEach(r => {
            var ar = r.split("=")
            if (ar[0] == "type") type = ar[1]
            if (ar[0] == "name") name = ar[1]
        })
        if (isDef(type)) {
            if (isDef(name)) {
                res[type] = {}
                try {
                    res[type][name] = this.getObject(obj)
                } catch(e) {
                    if (String(e).indexOf("java.lang.UnsupportedOperationException") < 0) errors.push({ obj: obj, error: e })
                }
            } else {
                try {
                    res[type] = this.getObject(obj)
                } catch(e) {
                    if (String(e).indexOf("java.lang.UnsupportedOperationException") < 0) errors.push({ obj: obj, error: e })
                }
            }
        }
    })
    if (errors.length > 0) res._errors = errors
    return res
}

/**
 * <odoc>
 * <key>ow.java.JMX.getObject(anObject) : Map</key>
 * Given a JMX anObject will find all the corresponding attributes, retrieve their corresponding values and returning in a map. If any errors
 * occurred a map entry "_errors" with an array of errors will be included in the returned map.
 * </odoc>
 */
OpenWrap.java.prototype.JMX.prototype.getObject = function(aObj) {
    var errors = []

    const _tt = (_o, p) => {
        if (p == "ObjectName") return
        if (!isJavaObject(_o)) {
            $$(data).set(p, _o)
            return
        }
        if (_o instanceof java.lang.String)  {
            $$(data).set(p, String(_o))
            return
        }
        if (_o instanceof java.lang.Number)  {
            $$(data).set(p, Number(_o))
            return
        }
        if (_o instanceof java.lang.Boolean) {
            $$(data).set(p, Boolean(_o))
            return
        }
        if (_o instanceof javax.management.openmbean.CompositeDataSupport) {
            var _cm = af.fromJavaArray(_o.getCompositeType().keySet().toArray())
            _cm.forEach(m => _tt(_o.get(m), p + "." + m) )
            return
        }
        if (_o instanceof javax.management.openmbean.TabularDataSupport) {
            var _cm = af.fromJavaArray(_o.keySet().toArray())
            $$(data).set(p, [])
            _cm.forEach((m1, i) => _tt(_o.get(af.fromJavaArray(m1)), p + "[" + i + "]" ) )
            return
        }
        if (isJavaObject(_o)) {
            if (String(_o.getClass()).startsWith("class [")) {
                $$(data).set(p, [])
                af.fromJavaArray(_o).forEach((m, i) => {
                    _tt(m, p + "[" + i + "]")
                })
                return
            }
        }
        $$(data).set(p, _o)
    }

    var obj = this._jmx.getObject(aObj)
    //var _map = af.fromJavaMap(obj.getAttributes())
    var _map = obj.getAttributes()
    if (isArray(_map.attributes)) {
        var data = {}
        _map.attributes.forEach(attr => {
            try {
                _tt(obj.get(String(attr.name)), String(attr.name))
            } catch(afe) {
                if (String(afe).indexOf("java.lang.UnsupportedOperationException") < 0) errors.push(attr.name + " | " + afe)
            }
        })
        if (errors.length > 0) data._errors = errors
        return data
    }
}

/**
 * <odoc>
 * <key>ow.java.IMAP(aServer, aUser, aPassword, isSSL, aPort, isReadOnly)</key>
 * Creates an instance to access aServer, using aUser and aPassword through a optional aPort and optionally using isSSL = true to use SSL.
 * If isReadOnly = true the folders will be open only as read-only.
 * </odoc>
 */
OpenWrap.java.prototype.IMAP = function(aServer, aUser, aPassword, isSSL, aPort, isReadOnly) {
    this.server = _$(aServer, "server").isString().$_();
    this.user   = _$(aUser, "user").isString().$_();
    this.pass   = _$(aPassword, "password").isString().$_();
    this.isSSL  = _$(isSSL, "isSSL").isBoolean().default(false);
    this.port   = _$(aPort, "port").isNumber().default(__);
    this.ro     = _$(isReadOnly, "isReadOnly").isBoolean().default(false);

    var props = new java.util.Properties();
    this.session = javax.mail.Session.getDefaultInstance(props, null);
    if (this.isSSL) {
        this.store = this.session.getStore("imaps");
    } else {
        this.store = this.session.getStore("imap");
    }

    if (isDef(this.port)) {
        this.store.connect(this.server, this.port, Packages.openaf.AFCmdBase.afc.dIP(this.user), Packages.openaf.AFCmdBase.afc.dIP(this.pass));
    } else {
        this.store.connect(this.server, Packages.openaf.AFCmdBase.afc.dIP(this.user), Packages.openaf.AFCmdBase.afc.dIP(this.pass));
    }

    this.folders = {};
};

OpenWrap.java.prototype.IMAP.prototype.__getFolder = function(aFolder) {
    aFolder = _$(aFolder, "folder").isString().default("Inbox");

    if (isDef(this.folders[aFolder])) {
        return this.folders[aFolder];
    } else {
        this.folders[aFolder] = this.store.getFolder(aFolder);
        if (this.ro) {
            this.folders[aFolder].open(javax.mail.Folder.READ_ONLY);
        } else {
            this.folders[aFolder].open(javax.mail.Folder.READ_WRITE);
        }
        return this.folders[aFolder];
    }
};

/**
 * <odoc>
 * <key>ow.java.IMAP.close(aFolder)</key>
 * Tries to a close a previously aFolder (defaults to "Inbox") automatically open in other operations.
 * </odoc>
 */
OpenWrap.java.prototype.IMAP.prototype.close = function(aFolder) {
    var _c = (aF) => {
        if (isDef(this.folders[aF])) this.folders[aF].close();
    };

    if (isDef(aFolder)) {
        _c(aFolder);
    } else {
        for(var ii in this.folders) {
            _c(ii);
        }
    }
};

/**
 * <odoc>
 * <key>ow.java.IMAP.getMessages(aFolder, aNumber) : Array</key>
 * Tries to retrieve an array of maps of message metadata from aFolder (defaults to Inbox) up to aNumber (defaults to 5) of messages.
 * </odoc>
 */
OpenWrap.java.prototype.IMAP.prototype.getMessages = function(aFolder, aNumber) {
    aFolder = _$(aFolder, "folder").isString().default("Inbox");
    aNumber = _$(aNumber, "number").isNumber().default(5);

    var res = [];
    var end = Number(this.getMessageCount(aFolder));
    var start = end - aNumber;

    for(var ii = end -1; ii >= start; ii--) {
        res.push(this.getMessage(aFolder, ii));
    }
    return res;
};

/**
 * <odoc>
 * <key>ow.java.IMAP.getSortedMessages(aFolder, aType, aTerm, aNumber) : Array</key>
 * For IMAP servers supporting the SORT operation will retrieve an array of maps of message metadata from aFolder (defaults to "Inbox") up to aNumber (defaults to 5)
 * of messages. The list will be filtered by aTerm for aType (e.g. FROM (default), ARRIVAL, CC, DATE, REVERSE, SIZE, SUBJECT, TO).
 * </odoc>
 */
OpenWrap.java.prototype.IMAP.prototype.getSortedMessages = function(aFolder, aType, aTerm, aNumber) {
    aFolder = _$(aFolder, "folder").isString().default("Inbox");
    aNumber = _$(aNumber, "number").isNumber().default(5);
    aType   = _$(aType, "type").isString().default("from");
    aTerm   = _$(aTerm, "term").isString().default("");

    switch(aType.toUpperCase()) {
    case "FROM": 
        aType = Packages.com.sun.mail.imap.SortTerm.FROM;
        aTerm = new javax.mail.search.FromStringTerm(aTerm);
        break;
    case "ARRIVAL": aType = Packages.com.sun.mail.imap.SortTerm.ARRIVAL; break;
    case "CC": 
        aType = Packages.com.sun.mail.imap.SortTerm.CC; 
        aTerm = new javax.mail.search.RecipientTerm(aTerm);
        break;
    case "DATE": aType = Packages.com.sun.mail.imap.SortTerm.DATE; break;
    case "REVERSE": aType = Packages.com.sun.mail.imap.SortTerm.REVERSE; break;
    case "SIZE": aType = Packages.com.sun.mail.imap.SortTerm.SIZE; break;
    case "SUBJECT": 
        aType = Packages.com.sun.mail.imap.SortTerm.SUBJECT; 
        aTerm = new javax.mail.search.SubjectTerm(aTerm);
        break;
    case "TO": 
        aType = Packages.com.sun.mail.imap.SortTerm.TO; 
        aTerm = new javax.mail.search.RecipientTerm(aTerm);
        break;
    }

    var fold = this.__getFolder(aFolder);
    var msgs = fold.getSortedMessages([aType], aTerm);

    var res = [], cc = 0;
    for(var ii in msgs) {
        res.push(this.__translateMsg(msgs[ii]));
        if (cc > aNumber) break; else cc++;
    }
  
    return res;
};

/**
 * <odoc>
 * <key>ow.java.IMAP.getMessageCount(aFolder) : Number</key>
 * Retrieves the current message count for aFolder.
 * </odoc>
 */
OpenWrap.java.prototype.IMAP.prototype.getMessageCount = function(aFolder) {
    aFolder = _$(aFolder, "folder").isString().default("Inbox");

    var fold = this.__getFolder(aFolder);
    return fold.getMessageCount();
};

/**
 * <odoc>
 * <key>ow.java.IMAP.getNewMessageCount(aFolder) : Number</key>
 * Retrieves the current new message count for aFolder.
 * </odoc>
 */
OpenWrap.java.prototype.IMAP.prototype.getNewMessageCount = function(aFolder) {
    aFolder = _$(aFolder, "folder").isString().default("Inbox");

    var fold = this.__getFolder(aFolder);
    return fold.getNewMessageCount();
};

/**
 * <odoc>
 * <key>ow.java.IMAP.getMessageBodyPart(aFolder, aNum, aBodyPartId) : String</key>
 * Retrieves the body part identified as aBodyPartId (starts in 0) from the message aNum on aFolder.
 * </odoc>
 */
OpenWrap.java.prototype.IMAP.prototype.getMessageBodyPart = function(aFolder, aNum, aBodyPartId) {
    aFolder = _$(aFolder, "folder").isString().default("Inbox");

    var fold = this.__getFolder(aFolder);
    var res = fold.getMessage(aNum);
    var res2 = res.getContent().getBodyPart(aBodyPartId);
    if (res2 != null && isDef(res2)) {
        var res3 = res2.getContent();
        if (isJavaObject(res3) && res3 instanceof java.lang.String) {
            res3 = String(res3);
        } 
        return res3;
    }
};

/**
 * <odoc>
 * <key>ow.java.IMAP.getMessage(aFolder, aNum) : Map</key>
 * Tries to retrieve a message metadata map based on aNum from aFolder.
 * </odoc>
 */
OpenWrap.java.prototype.IMAP.prototype.getMessage = function(aFolder, aNum) {
    aFolder = _$(aFolder, "folder").isString().default("Inbox");

    var fold = this.__getFolder(aFolder);
    var res = fold.getMessage(aNum);

    return this.__translateMsg(res);
};

OpenWrap.java.prototype.IMAP.prototype.__translateMsg = function(res) {
    var msg = {};
    if (isDef(res)) {
        msg = {
            num: res.getMessageNumber(),
            from: af.fromJavaArray(res.getFrom()),
            recipients: af.fromJavaArray(res.getAllRecipients()),
            replyTo: af.fromJavaArray(res.getReplyTo()),
            subject: String(res.getSubject()),
            receivedDate: res.getReceivedDate(),
            sentDate: res.getSentDate(),
            encoding: res.getEncoding(),
            size: res.getSizeLong(),
            bodyParts: res.getContent().getCount(),
            object: res
        };
    }
    return msg;
};

/**
 * <odoc>
 * <key>ow.java.IMAP.hasNewMessages(aFolder) : Boolean</key>
 * Tries to determine how many new messagse there are in aFolder (defailt to Inbox)
 * </odoc>
 */
OpenWrap.java.prototype.IMAP.prototype.hasNewMessages = function(aFolder) {
    aFolder = _$(aFolder, "folder").isString().default("Inbox");

    var fold = this.__getFolder(aFolder);
    return fold.hasNewMessages();
};

/**
 * <odoc>
 * <key>ow.java.IMAP.getUnreadMessageCount(aFolder) : Boolean</key>
 * Tries to determine if there are new unread messages in aFolder (defailt to Inbox)
 * </odoc>
 */
OpenWrap.java.prototype.IMAP.prototype.getUnreadMessageCount = function(aFolder) {
    aFolder = _$(aFolder, "folder").isString().default("Inbox");

    var fold = this.__getFolder(aFolder);
    return fold.getUnreadMessageCount();
};

/**
 * <odoc>
 * <key>ow.java.cipher(anAlgorithm)</key>
 * Creates an ow.java.cipher to use anAlgorithm (defaults to RSA/ECB/OAEPWITHSHA-512ANDMGF1PADDING).
 * </odoc>
 */
OpenWrap.java.prototype.cipher = function(anAlgorithm, anSymAlgorithm, anSymSize) {
    this.alg = _$(anAlgorithm).isString().default("RSA/ECB/OAEPWITHSHA-512ANDMGF1PADDING");
    this.aalg = _$(anSymAlgorithm).isString().default("AES");
    this.aalgsize = _$(anSymSize).isNumber().default(128);
};

/**
 * <odoc>
 * <key>ow.java.cipher.symGenKey(aSize) : ArrayBytes</key>
 * Returns a generated symmetric key with aSize (defaults to aSize)
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.symGenKey = function(aSize) {
    aSize = _$(aSize).isNumber().default(this.aalgsize);
    var generator = javax.crypto.KeyGenerator.getInstance(this.aalg);
    generator.init(aSize);
    return generator.generateKey().getEncoded();
};

/**
 * <odoc>
 * <key>ow.java.cipher.symEncrypt(aMessage, aKey) : ArrayBytes</key>
 * Returns a symmetric encrypted aMessage using a previously generated aKey (using ow.java.cipher.symGenKey).
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.symEncrypt = function(plainText, aKey) {
    _$(plainText).$_();
    _$(aKey).$_();

    if (isString(plainText)) plainText = af.fromString2Bytes(plainText);
    if (isString(aKey)) aKey = af.fromString2Bytes(aKey);

    var sks = new javax.crypto.spec.SecretKeySpec(aKey, 0, aKey.length, this.aalg);
    var cipher = javax.crypto.Cipher.getInstance(this.aalg);
    cipher.init(javax.crypto.Cipher.ENCRYPT_MODE, sks);
    return cipher.doFinal(plainText);
};

/**
 * <odoc>
 * <key>ow.java.cipher.symDecrypt(anEncryptedMessage, aKey) : ArrayBytes</key>
 * Returns the decrypted anEncryptedMessage using aKey (used to encrypt with symEncrypt)
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.symDecrypt = function(encryptedMsg, aKey) {
    var sks = new javax.crypto.spec.SecretKeySpec(aKey, 0, aKey.length, this.aalg);
    var cipher = javax.crypto.Cipher.getInstance(this.aalg);
    cipher.init(javax.crypto.Cipher.DECRYPT_MODE, sks);
    return cipher.doFinal(encryptedMsg);
};

/**
 * <odoc>
 * <key>ow.java.cipher.aSymEncrypt(aMessage, aPublicKey) : Map</key>
 * Given aMessage and previously generated aPublicKey will encrypt aMessage with a random symmetric key,
 * encrypt that symmetric key with aPublicKey and return a map with eSymKey (encrypted symmetric key) and eMessage (encrypted message)
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.aSymEncrypt = function(aMessage, aPublicKey) {
    _$(aMessage).$_("Please provide a message to encrypt.");
    _$(aPublicKey).$_("Please provide a public key.");

    var k = this.symGenKey();
    var msg = this.symEncrypt(aMessage, k);
    var ck = this.encrypt(k, aPublicKey);
    k = __;

    return {
        eSymKey : ck,
        eMessage: msg
    };
};

/**
 * <odoc>
 * <key>ow.java.cipher.prototype.aSymDecrypt(eMessage, eSymKey, privateKey) : ArrayBytes</key>
 * Given a previously encrypted eMessage with an encrypted symmetric key, will use the provided privateKey to decrypt
 * eSymKey and use it to decrypt eMessage returning the corresponding decrypted contents.
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.aSymDecrypt = function(eMessage, eSymKey, privateKey) {
    _$(eMessage).$_("Please provide an encrypted message to decrypt.");
    _$(eSymKey).$_("Please provide an encrypted sym key.");
    _$(privateKey).$_("Please provide a private key.");

    var dk = this.decrypt(eSymKey, privateKey, __, true);
    var out = this.symDecrypt(eMessage, dk);
    dk = __;
    return out;
};

/**
 * <odoc>
 * <key>ow.java.cipher.encrypt(aString, aPublicKey) : ArrayBytes</key>
 * Given aPublicKey (from ow.java.cipher.readKey4File or genKeyPair) tries to RSA encrypt aString returning
 * the encrypted ArrayBytes.
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.encrypt = function(plainText, publicKey) {
   _$(plainText).$_("Please provide a string to encrypt.");
   _$(publicKey).$_("Please provide a public key.");

   var cipher = javax.crypto.Cipher.getInstance(this.alg);
   cipher.init(javax.crypto.Cipher.ENCRYPT_MODE, publicKey);
   if (isString(plainText)) plainText = af.fromString2Bytes(plainText);
   var cipherText = cipher.doFinal(plainText);
   return cipherText;
};

/**
 * <odoc>
 * <key>ow.java.cipher.encryptStream(outputStream, aPublicKey) : Stream</key>
 * Given aPublicKey (from ow.java.cipher.readKey4File or genKeyPair) tries to RSA encrypt outputStream returning
 * an encrypted stream.
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.encryptStream = function(oStream, publicKey) {
   if (oStream == null) throw "Please provide an output stream to encrypt.";
   _$(publicKey).$_("Please provide a public key.");
   var cipher = javax.crypto.Cipher.getInstance(this.alg);
   cipher.init(javax.crypto.Cipher.ENCRYPT_MODE, publicKey);
   return new javax.crypto.CipherOutputStream(oStream, cipher);
};

/**
 * <odoc>
 * <key>ow.java.cipher.encrypt2Text(aString, aPublicKey) : String</key>
 * Given aPublicKey (from ow.java.cipher.readKey4File or genKeyPair) tries to RSA encrypt aString to a base64 string
 * returning the encrypted string.
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.encrypt2Text = function(plainText, publicKey) {
   _$(plainText).$_("Please provide a string to encrypt.");
   _$(publicKey).$_("Please provide a public key.");
   return af.fromBytes2String(af.toBase64Bytes(this.encrypt(plainText, publicKey)));
};

/**
 * <odoc>
 * <key>ow.java.cipher.decrypt4Text(aString, privateKey) : String</key>
 * Given aPrivateKey (from ow.java.cipher.readKey4File or genKeyPair) tries to RSA decrypt a base64 encrypted string
 * returning the decrypted string.
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.decrypt4Text = function(cipherText, privateKey) {
   _$(cipherText).$_("Please provide a string to decrypt.");
   _$(privateKey).$_("Please provide a private key.");
   return this.decrypt(af.fromBase64(af.fromString2Bytes(cipherText)), privateKey);
};

/**
 * <odoc>
 * <key>ow.java.cipher.saveKey2File(aFilename, aKey, isPrivate, anAlgorithm)</key>
 * Given a public or private aKey (from ow.java.cipher.readKey4File or genKeyPair) tries to save it to aFilename. If
 * the aKey is private isPrivate must be true, if public is must be false.
 * Optionally a key anAlgorithm can be provided (defaults to RSA).
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.saveKey2File = function(filename, key, isPrivate, anAlgorithm) {
    _$(filename).isString().$_("Please provide a filename.");
    this.saveKey2Stream(new java.io.FileOutputStream(filename), key, isPrivate, anAlgorithm);
};

/**
 * <odoc>
 * <key>ow.java.cipher.saveKey2String(aKey, isPrivate, anAlgorithm) : String</key>
 * Given a public or private aKey (from ow.java.cipher.readKey4File or genKeyPair) tries to return a string representation. If
 * the aKey is private isPrivate must be true, if public is must be false.
 * Optionally a key anAlgorithm can be provided (defaults to RSA).
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.saveKey2String = function(key, isPrivate, anAlgorithm) {
    var os = af.fromString2OutputStream("");
    this.saveKey2Stream(os, key, isPrivate, anAlgorithm);
    return String(os.toString());
};

/**
 * <odoc>
 * <key>ow.java.cipher.saveKey2Stream(aOutputStream, isPrivate, anAlgorithm) : String</key>
 * Given a public or private aKey (from ow.java.cipher.readKey4File or genKeyPair) tries to return output to aOutputStream. If
 * the aKey is private isPrivate must be true, if public is must be false.
 * Optionally a key anAlgorithm can be provided (defaults to RSA).
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.saveKey2Stream = function(aOutputStream, key, isPrivate, anAlgorithm) {
    _$(key).$_("Please provide the key to save.");
    _$(isPrivate).isBoolean().$_("Please indicate if it's a private or public key.");
    anAlgorithm = _$(anAlgorithm).isString().default("RSA");
 
    var keyFactory = java.security.KeyFactory.getInstance(anAlgorithm);
    var spec;
    if (isPrivate) {
       spec = keyFactory.getKeySpec(key, af.getClass("java.security.spec." + anAlgorithm + "PrivateKeySpec"));
    } else {
       spec = keyFactory.getKeySpec(key, af.getClass("java.security.spec." + anAlgorithm + "PublicKeySpec"));
    }
    var modulus = spec.getModulus();
    var exponent = (isPrivate ? spec.getPrivateExponent() : spec.getPublicExponent() );
    var ostream = new java.io.ObjectOutputStream(new java.io.BufferedOutputStream(new Packages.org.apache.commons.codec.binary.Base64OutputStream(aOutputStream)));
    try {
       ostream.writeObject(modulus);
       ostream.writeObject(exponent);
    } catch(e) {
       sprintErr(e);
    } finally {
       ostream.close();
    }
 };

/**
 * <odoc>
 * <key>ow.java.cipher.readKey4File(aFilename, isPrivate, anAlgorithm) : Key</key>
 * Given a key file previously saved with ow.java.cipher.saveKey2File returns the Key object to use with other functions.
 * If the aKey is private isPrivate must be true, if public is must be false.
 * Optionally a key anAlgorithm can be provided (defaults to RSA).
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.readKey4File = function(filename, isPrivate, anAlgorithm) {
   _$(filename).isString().$_("Please provide a filename.");

   return this.readKey4Stream(new java.io.FileInputStream(filename), isPrivate, anAlgorithm);
};

/**
 * <odoc>
 * <key>ow.java.cipher.readKey4String(aString, isPrivate, anAlgorithm) : Key</key>
 * Given a key on aString previously saved with ow.java.cipher.saveKey2String returns the Key object to use with other functions.
 * If the aKey is private isPrivate must be true, if public is must be false.
 * Optionally a key anAlgorithm can be provided (defaults to RSA).
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.readKey4String = function(key, isPrivate, anAlgorithm) {
    var is = af.fromString2InputStream(key);
    return this.readKey4Stream(is, isPrivate, anAlgorithm);
};

/**
 * <odoc>
 * <key>ow.java.cipher.readKey4Stream(aInputStream, isPrivate, anAlgorithm) : Key</key>
 * Given a key on aInputStream previously saved with ow.java.cipher.saveKey2Stream returns the Key object to use with other functions.
 * If the aKey is private isPrivate must be true, if public is must be false.
 * Optionally a key anAlgorithm can be provided (defaults to RSA).
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.readKey4Stream = function(istream, isPrivate, anAlgorithm) {
    _$(isPrivate).isBoolean().$_("Please indicate if it's a private or public key.");
    anAlgorithm = _$(anAlgorithm).isString().default("RSA");

    var oistream = new java.io.ObjectInputStream(new java.io.BufferedInputStream(new Packages.org.apache.commons.codec.binary.Base64InputStream(istream)));
    var key;
    try {
       var modulus = oistream.readObject();
       var exponent = oistream.readObject();
       var keyFactory = java.security.KeyFactory.getInstance(anAlgorithm);
       if (!isPrivate) {
          key = keyFactory.generatePublic(new java.security.spec[anAlgorithm + "PublicKeySpec"](modulus, exponent));
       } else {
          key = keyFactory.generatePrivate(new java.security.spec[anAlgorithm + "PrivateKeySpec"](modulus, exponent));
       }
    } catch(e) {
       sprintErr(e);
    } finally {
       oistream.close();
    }
    return key;
};

/**
 * <odoc>
 * <key>ow.java.cipher.key2encode(aKey) : String</key>
 * Given aKey (from ow.java.cipher.readKey4File or genKeyPair) returns the base 64 corresponding encoded string.
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.key2encode = function(key) {
   _$(key).$_("Please provide a key to encode.");

   return String(java.util.Base64.getEncoder().encodeToString(key.getEncoded()).toString());
};

/**
 * <odoc>
 * <key>ow.java.cipher.msg2encode(anEncryptedMessage) : String</key>
 * Given anEncryptedMessage returns the base 64 encoded string.
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.msg2encode = function(msg) {
   _$(msg).$_("Please provide a message to encode.");
   return String(java.util.Base64.getEncoder().encodeToString(msg));
};
  
/**
 * <odoc>
 * <key>ow.java.cipher.decode2msg(aEncodedMessage) : String</key>
 * Given aEncodedMessage base 64 string returns the original message.
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.decode2msg = function(msg) {
   _$(msg).$_("Please provide a message to decode.");
   return java.util.Base64.getDecoder().decode(af.fromString2Bytes(msg));
};
  
/**
 * <odoc>
 * <key>ow.java.cipher.decode2Key(aKey, isPrivate, anAlgorithm) : Key</key>
 * Given an encoded base 64 key (with ow.java.cipher.key2encode) returns the corresponding Key object.
 * If the aKey is private isPrivate must be true, if public is must be false.
 * Optionally a key anAlgorithm can be provided (defaults to RSA).
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.decode2key = function(key, isPrivate, anAlgorithm) {
   _$(key).$_("Please provide a key to decode.");
   _$(isPrivate).isBoolean().$_("Please indicate if it's a private or public key.");
   anAlgorithm = _$(anAlgorithm).isString().default("RSA");

   var k = java.util.Base64.getDecoder().decode(af.fromString2Bytes(key));
   var keyFactory = java.security.KeyFactory.getInstance(anAlgorithm);
   var keySpec;
   if (isPrivate) {
      keySpec = new java.security.spec.PKCS8EncodedKeySpec(k);
      return keyFactory.generatePrivate(keySpec);
   } else {
      keySpec = new java.security.spec.X509EncodedKeySpec(k);
      return keyFactory.generatePublic(keySpec);
   }
};
   
/**
 * <odoc>
 * <key>ow.java.cipher.decrypt(aEncryptedMessage, aPrivateKey, anAlgorithm) : ArrayBytes</key>
 * Given a previously encrypted message will return the corresponding decrypted message using aPrivateKey.
 * Optionally a key anAlgorithm can be provided (defaults to RSA).
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.decrypt = function(cipherText, privateKey, anAlgorithm, noConversion) {
   _$(cipherText).$_("Please provide an encrypted message to decrypt.");
   _$(privateKey).$_("Please provide a private key.");
   anAlgorithm = _$(anAlgorithm).isString().default(this.alg);

   var cipher = javax.crypto.Cipher.getInstance(anAlgorithm);
   cipher.init(javax.crypto.Cipher.DECRYPT_MODE, privateKey);
   var decryptedText = cipher.doFinal(cipherText);
   return (noConversion ? decryptedText : af.fromBytes2String(decryptedText));
};

// af.fromInputStream2String(t.decryptStream(af.fromBytes2InputStream(t.encrypt("ola", pub)), priv))
/**
 * <odoc>
 * <key>ow.java.cipher.decryptStream(aInputStream, aPrivateKey, anAlgorithm) : Stream</key>
 * Given a previously encrypted aInputStream will return the corresponding decrypted stream using aPrivateKey.
 * Optionally a key anAlgorithm can be provided (defaults to RSA).
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.decryptStream = function(iStream, privateKey, anAlgorithm) {
   if (iStream == null) throw "Please provide an encrypted stream to decrypt.";
   _$(privateKey).$_("Please provide a private key.");  
   anAlgorithm = _$(anAlgorithm).isString().default(this.alg);

   var cipher = javax.crypto.Cipher.getInstance(anAlgorithm);
   cipher.init(javax.crypto.Cipher.DECRYPT_MODE, privateKey);
   return new javax.crypto.CipherInputStream(iStream, cipher);
};

/**
 * <odoc>
 * <key>ow.java.cipher.genKeyPair(aKeySize, aAlg) : Map</key>
 * Given aKeySize (e.g. 2048, 3072, 4096, 7680 and 15360) will return a map with publicKey and privateKey.
 * Optionally you can choose an anAlgorithm (defaults to RSA).
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.genKeyPair = function(size, alg) {
   alg  = _$(alg).default("RSA");
   size = _$(size).default(2048);
   var keyPairGen = java.security.KeyPairGenerator.getInstance(alg);
   keyPairGen.initialize(size);

   var keyPair = keyPairGen.generateKeyPair();
   return {
      publicKey: keyPair.getPublic(),
      privateKey: keyPair.getPrivate()
   };
};

/**
 * <odoc>
 * <key>ow.java.cipher.sign(aPrivateKey, aInputStream, inBytes) : Object</key>
 * Tries to sign the contents from aInputStream using aPrivateKey. Return the signature in an array of bytes or, if inBytes = true,
 * has a base 64 encoded string.
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.sign = function(aPrivateKey, aInputStream, inBytes) {
    var dsa = java.security.Signature.getInstance("SHA256With" + aPrivateKey.getAlgorithm()); 
    dsa.initSign(aPrivateKey);
    ioStreamReadBytes(aInputStream, function(buf) {
        dsa.update(buf, 0, buf.length);
    });
    var res = dsa.sign();
    if (inBytes) {
        return res;
    } else {
        return this.msg2encode(res);
    }
};

/**
 * <odoc>
 * <key>ow.java.cipher.verify(signatureToVerify, aPublicKey, aInputStream, isBytes) : boolean</key>
 * Given aInputStream and aPublicKey will verify if the signatureToVerify is valid. Optionally isBytes = true 
 * the signatureToVerify is an array of bytes instead of base 64 encoded.
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.verify = function(sigToVerify, aPublicKey, aInputStream, isBytes) {
    if (!isBytes) {
        sigToVerify = this.decode2msg(sigToVerify);
    }
    var sig = java.security.Signature.getInstance("SHA256With" + aPublicKey.getAlgorithm());
    sig.initVerify(aPublicKey);
    ioStreamReadBytes(aInputStream, function(buf) {
        sig.update(buf, 0, buf.length);
    });
    return sig.verify(sigToVerify);
};

/**
 * <odoc>
 * <key>ow.java.cipher.getCert4String(aString) : Java</key>
 * Given a X509 certificate string will return the corresponding Java certificate object.
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.getCert4String = function(aString) {
    _$(aString).isString().$_()

    var cf = java.security.cert.CertificateFactory.getInstance("X509")
    var is = af.fromString2InputStream(aString)

    var cert = cf.generateCertificate(is)
    is.close()

    return cert
}

/**
 * <odoc>
 * <key>ow.java.cipher.getCert4File(aFile) : Java</key>
 * Given a X509 certificate aFile will return the corresponding Java certificate object.
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.getCert4File = function(aFile) {
    _$(aFile).isString().$_()

    var cf = java.security.cert.CertificateFactory.getInstance("X509")
    var is = io.readFileStream(aFile)

    var cert = cf.generateCertificate(is)
    is.close()

    return cert
}

/**
 * <odoc>
 * <key>ow.java.cipher.encodeCert(aCert) : String</key>
 * Encodes aCert(ificate) into a base64 PEM representation.
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.encodeCert = function(aCert) {
    _$(aCert, "aCert").$_()
    
    var beginTxt = "-----BEGIN CERTIFICATE KEY-----\n"
    var endTxt = "-----END CERTIFICATE KEY-----\n"
    
    var encoder = java.util.Base64.getMimeEncoder(64, java.lang.System.getProperty("line.separator").getBytes())
    return beginTxt + af.fromBytes2String(encoder.encode(aCert.getEncoded())) + "\n" + endTxt
}

/**
 * <odoc>
 * <key>ow.java.cipher.encodeKey(aKey, isPrivate) : String</key>
 * Encodes private (isPrivate = true) or public key into a base64 key representation.
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.encodeKey = function(aKey, isPrivate) {
    _$(aKey, "aKey").$_()
    isPrivate = _$(isPrivate, "isPrivate").isBoolean().default(false)

    var beginTxt = "-----BEGIN " + (isPrivate ? "PRIVATE" : "PUBLIC") + " KEY-----\n"
    var endTxt = "-----END " + (isPrivate ? "PRIVATE" : "PUBLIC") + " KEY-----\n"
    
    var encoder = java.util.Base64.getMimeEncoder(64, java.lang.System.getProperty("line.separator").getBytes())
    return beginTxt + af.fromBytes2String(encoder.encode(aKey.getEncoded())) + "\n" + endTxt
}

/**
 * <odoc>
 * <key>ow.java.cipher.decodeKey(aString, isPrivate, anAlgorithm) : JavaObject</key>
 * Decode aString base64 key representation (from encodeKey) into a public or private (isPrivate = true) key
 * optionally specifying anAlgorithm (defaults to RSA)
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.decodeKey = function(aString, isPrivate, anAlgorithm) {
    _$(isPrivate).isBoolean().$_("Please indicate if it's a private or public key.")
    anAlgorithm = _$(anAlgorithm).isString().default("RSA")

    var k = af.fromBase64(aString.split("\n").filter(r=>!r.startsWith("-----")).join(""))
    var keySpec, keyFactory = java.security.KeyFactory.getInstance(anAlgorithm)

    if (isPrivate) {
        keySpec = new java.security.spec.PKCS8EncodedKeySpec(k)
        return keyFactory.generatePrivate(keySpec)
    } else {
        keySpec = new java.security.spec.X509EncodedKeySpec(k)
        return keyFactory.generatePublic(keySpec)
    }
}

/**
 * <odoc>
 * <key>ow.java.cipher.genCert(aDn, aPublicKey, aPrivateKey, aValidity, aSigAlgName, aKeyStore, aPassword, aKeyStoreType) : JavaSignature</key>
 * Generates a certificate with aDn (defaults to "cn=openaf"), using aPublicKey and aPrivateKey, for aValidity date (defaults to a date 
 * one year from now). Optionally you can specify aSigAlgName (defaults to SHA256withRSA), a file based aKeyStore and the corresponding
 * aPassword (defaults to "changeit").
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.genCert = function(aDn, aPubKey, aPrivKey, aValidity, aSigAlgName, aKeyStore, aPassword, aKeyStoreType) {
    // Java 21+ does not support sun.security.x509.X509CertImpl
    if (__flags.JAVA_CERT_BC_PROVIDER || String(java.lang.System.getProperty("java.version")).startsWith("21.")) {
        return this.genCertBC(aDn, aPubKey, aPrivKey, aValidity, aSigAlgName, aKeyStore, aPassword, aKeyStoreType)
    }

    aDn = _$(aDn, "dn").regexp(/^cn\=/i).isString().default("cn=openaf");
    aSigAlgName = _$(aSigAlgName, "signature alg name").isString().default("SHA256withRSA");
    aKeyStoreType = _$(aKeyStoreType, "key store type").isString().default(java.security.KeyStore.getDefaultType());
    _$(aPubKey, "public key").$_();
    _$(aPrivKey, "private key").$_();
    aValidity = _$(aValidity, "validity").isDate().default(new Date(now() + (1000 * 60 * 60 * 24 * 365)));

    var info = new Packages.sun.security.x509.X509CertInfo();

    var from = new Date();
    var to = new Date(aValidity);
    
    var interval = new Packages.sun.security.x509.CertificateValidity(from, to);
    var serialNumber = new java.math.BigInteger(64, new java.security.SecureRandom());
    
    var owner = new Packages.sun.security.x509.X500Name(aDn);
    var sigAlgId = Packages.sun.security.x509.AlgorithmId.get(aSigAlgName);

    info.set(Packages.sun.security.x509.X509CertInfo.VALIDITY, interval);
    info.set(Packages.sun.security.x509.X509CertInfo.SERIAL_NUMBER, new Packages.sun.security.x509.CertificateSerialNumber(serialNumber));
    info.set(Packages.sun.security.x509.X509CertInfo.SUBJECT, owner);
    info.set(Packages.sun.security.x509.X509CertInfo.ISSUER, owner);
    info.set(Packages.sun.security.x509.X509CertInfo.KEY, new Packages.sun.security.x509.CertificateX509Key(aPubKey));
    info.set(Packages.sun.security.x509.X509CertInfo.VERSION, new Packages.sun.security.x509.CertificateVersion(Packages.sun.security.x509.CertificateVersion.V3));
    info.set(Packages.sun.security.x509.X509CertInfo.ALGORITHM_ID, new Packages.sun.security.x509.CertificateAlgorithmId(sigAlgId));

    var certificate = new Packages.sun.security.x509.X509CertImpl(info);
    certificate.sign(aPrivKey, aSigAlgName);

    sigAlgId = certificate.get(Packages.sun.security.x509.X509CertImpl.SIG_ALG);
    info.set(Packages.sun.security.x509.CertificateAlgorithmId.NAME + "." + Packages.sun.security.x509.CertificateAlgorithmId.ALGORITHM, sigAlgId);
    certificate = new Packages.sun.security.x509.X509CertImpl(info);
    certificate.sign(aPrivKey, aSigAlgName);

    if (isDef(aKeyStore)) {
        aPassword = _$(aPassword).isString().default("changeit");

        var ks = java.security.KeyStore.getInstance(aKeyStoreType);
        ks.load(null, null);    
        ks.setKeyEntry("main", aPrivKey, (new java.lang.String(aPassword)).toCharArray(), [ certificate ]);
        var fos = io.writeFileStream(aKeyStore);
        ks.store(fos, (new java.lang.String(aPassword)).toCharArray());
        fos.close();
    }

    return certificate;
};

// Equivalent to genCert but using BouncyCastle
OpenWrap.java.prototype.cipher.prototype.genCertBC = function(aDn, aPubKey, aPrivKey, aValidity, aSigAlgName, aKeyStore, aPassword, aKeyStoreType) {
    aDn = _$(aDn, "dn").regexp(/^cn\=/i).isString().default("cn=openaf")
    aSigAlgName = _$(aSigAlgName, "signature alg name").isString().default("SHA256withRSA")
    aKeyStoreType = _$(aKeyStoreType, "key store type").isString().default(java.security.KeyStore.getDefaultType())
    _$(aPubKey, "public key").$_()
    _$(aPrivKey, "private key").$_()
    aValidity = _$(aValidity, "validity").isDate().default(new Date(now() + (1000 * 60 * 60 * 24 * 365)))

    if (af.fromJavaArray(java.security.Security.getProviders()).map(r => String(r)).filter(r => r.startsWith("BC ")).length == 0) {
        if (isDef(getOPackPath("BouncyCastle"))) {
            loadExternalJars(getOPackPath("BouncyCastle"))
        
            java.security.Security.addProvider(new Packages.org.bouncycastle.jce.provider.BouncyCastleProvider())
        } else {
            throw "The BouncyCastle package is required for ow.java.cipher.genCertBC (specially in Java 21)"
        }
    }

    var dnName = new Packages.org.bouncycastle.asn1.x500.X500Name(aDn)
    var certSerialNum = new java.math.BigInteger(String(now()))

    var certBuilder = new Packages.org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder(dnName, certSerialNum, new java.util.Date(), aValidity, dnName, aPubKey)
    var signer = new Packages.org.bouncycastle.operator.jcajce.JcaContentSignerBuilder(aSigAlgName).setProvider(Packages.org.bouncycastle.jce.provider.BouncyCastleProvider.PROVIDER_NAME).build(aPrivKey)
    var certHolder = certBuilder.build(signer)

    if (isDef(aKeyStore)) { 
        aPassword = _$(aPassword).isString().default("changeit")

        var ks = java.security.KeyStore.getInstance(aKeyStoreType)
        ks.load(null, null)
        ks.setKeyEntry("main", aPrivKey, (new java.lang.String(aPassword)).toCharArray(), [ certificate ])
        var fos = io.writeFileStream(aKeyStore)
        ks.store(fos, (new java.lang.String(aPassword)).toCharArray())
        fos.close()

        //var protParam = new java.security.KeyStore.PasswordProtection((new String(aPassword)).toCharArray())
        //var privKeyEntry = new java.security.KeyStore.PrivateKeyEntry(aPrivKey, [ new Packages.org.bouncycastle.cert.jcajce.JcaX509CertificateConverter().getCertificate(certHolder) ])
        //aKeyStore.setEntry("main", privKeyEntry, protParam)
    }

    return certHolder
}

/**
 * <odoc>
 * <key>ow.java.getCMemory(shouldFormat, aReadFileFn, aFileExistsFn) : Map</key>
 * Returns a map with the current cgroup runtime max, total, used and free memory. If shouldFormat = true ow.format.toBytesAbbreviation will be used.
 * Optionally you can provide a aReadFileFn that should expect the full path on a linux cgroup root filesystem
 * and return a string with the corresponding contents.
 * </odoc>
 */
OpenWrap.java.prototype.getCMemory = function(shouldFormat, aReadFileFn, aFileExistsFn) {
    aReadFileFn   = _$(aReadFileFn, "aReadFileFn").isFunction().default(io.readFileString)
    aFileExistsFn = _$(aFileExistsFn, "aFileExistsFn").isFunction().default(io.fileExists)

    // CGroupsV1
    if (aFileExistsFn("/sys/fs/cgroup/memory")) {
        var vals = {
            m: Number(aReadFileFn("/sys/fs/cgroup/memory/memory.limit_in_bytes")),
            t: Number(aReadFileFn("/sys/fs/cgroup/memory/memory.max_usage_in_bytes")),
            f: -1,
            u: Number(aReadFileFn("/sys/fs/cgroup/memory/memory.usage_in_bytes"))
        };
        vals.f = vals.t - vals.u;

        if (shouldFormat) {
            ow.loadFormat();
            return {
                max: ow.format.toBytesAbbreviation(vals.m),
                total: ow.format.toBytesAbbreviation(vals.t),
                used: ow.format.toBytesAbbreviation(vals.u),
                free: ow.format.toBytesAbbreviation(vals.f)
            };
        } else {
            return {
                max: vals.m,
                total: vals.t,
                used: vals.u,
                free: vals.f
            };
        }
    }
    
    // CGroupsV2
    if (aFileExistsFn("/sys/fs/cgroup/memory.stat")) {
        var _fnR = aFile => {
            var data = {}
            io.readFileAsArray(aFile).forEach(r => {
                var _ar = r.split(" ")
                data[_ar[0]] = _ar[1]
            })
        }

        let limit = aReadFileFn("/sys/fs/cgroup/memory.max").trim()
        let usage = aReadFileFn("/sys/fs/cgroup/memory.current").trim()

        var memTotal

        aReadFileFn("/proc/meminfo")
        .split("\n")
        .filter(r => r.startsWith("MemTotal:"))
        .forEach(r => {
            var _ar = r.split(":")
            memTotal = ow.format.fromBytesAbbreviation( _ar[1].trim() )
        })

        if (limit == "max") limit = memTotal

        var vals = {
            m: memTotal,
            t: limit,
            u: usage,
            f: limit - usage
        }

        if (shouldFormat) {
            ow.loadFormat()
            return {
                max: ow.format.toBytesAbbreviation(vals.m),
                total: ow.format.toBytesAbbreviation(vals.t),
                used: ow.format.toBytesAbbreviation(vals.u),
                free: ow.format.toBytesAbbreviation(vals.f)
            };
        } else {
            return {
                max: vals.m,
                total: vals.t,
                used: vals.u,
                free: vals.f
            }
        }
    }
}

/**
 * <odoc>
 * <key>ow.java.getLinuxUptime(aReadFileFn) : Array</key>
 * Parses a Linux uptme info. Optionally you can provide a aReadFileFn that should expect the full path on a
 * linux /proc root filesystem and return a string with the corresponding contents.
 * </odoc>
 */
OpenWrap.java.prototype.getLinuxUptime = function(aReadFileFn) {
    aReadFileFn = _$(aReadFileFn, "aReadFileFn").isFunction().default(io.readFileString)

    var _ar = aReadFileFn("/proc/uptime").trim().split(" ")
    var val = {
        uptime: _ar[0],
        idle  : _ar[1]
    }

    // Calc perc 
    val["idle%"] = parseFloat(Number(val.idle / val.uptime)).toFixed(2)
    return val
}

/**
 * <odoc>
 * <key>ow.java.getCCPU(aReadFileFn) : Map</key>
 * Returns a map with the current cgroup cpu stats. Optionally you can provide a aReadFileFn that should expect the full path on a linux cgroup root filesystem
 * and return a string with the corresponding contents.
 * </odoc>
 */
OpenWrap.java.prototype.getCCPU = function(aReadFileFn) {
    aReadFileFn = _$(aReadFileFn, "aReadFileFn").isFunction().default(io.readFileString)
    
    if (io.fileExists("/sys/fs/cgroup/cpu")) {
        var vals = {
            usage: {
                allSystem: Number(aReadFileFn("/sys/fs/cgroup/cpu/cpuacct.usage_sys")),
                allUser: Number(aReadFileFn("/sys/fs/cgroup/cpu/cpuacct.usage_user")),
                perCpu: aReadFileFn("/sys/fs/cgroup/cpu/cpuacct.usage_percpu").trim().split(" ").map(r=>Number(r)),
                perCpuSystem: aReadFileFn("/sys/fs/cgroup/cpu/cpuacct.usage_percpu_sys").trim().split(" ").map(r=>Number(r)),
                perCpuUser: aReadFileFn("/sys/fs/cgroup/cpu/cpuacct.usage_percpu_user").trim().split(" ").map(r=>Number(r))
            },
            taskStats: af.fromYAML(aReadFileFn("/sys/fs/cgroup/cpu/cpuacct.stat").trim().replace(/^(\w+)/mg,"$1:")),
            throttling: af.fromYAML(aReadFileFn("/sys/fs/cgroup/cpu/cpu.stat").trim().replace(/^(\w+)/mg,"$1:")),
            quota: {
                quota: Number(aReadFileFn("/sys/fs/cgroup/cpu/cpu.cfs_quota_us")),
                period: Number(aReadFileFn("/sys/fs/cgroup/cpu/cpu.cfs_period_us")),
            }
        }

        // quota
        if (vals.quota.quota == -1) {
            vals.quota.limit = "unlimited"
        } else {
            vals.quota.limit = vals.quota.quota / vals.quota.period
        }

        // correct name in stat
        if (isDef(vals.taskStats.system)) {
            vals.taskStats.kernel = vals.taskStats.system
            delete vals.taskStats.system
        }

        // calculate perc
        var _p = n => parseFloat(Number(n)).toFixed(2)
        if (isDef(vals.taskStats)) {
            var _t = vals.taskStats.user + vals.taskStats.kernel
            vals.taskStats["user%"] = _p( (vals.taskStats.user * 100) / _t )
            vals.taskStats["kernel%"] = _p( (vals.taskStats.kernel * 100) / _t )
        }
        if (isArray(vals.usage.perCpu)) {
            vals.usage["perCpu%"] = vals.usage.perCpu.map(r => _p((r * 100) / vals.usage.allUser))
        }
        if (isArray(vals.usage.perCpuSystem)) {
            vals.usage["perCpuSystem%"] = vals.usage.perCpuSystem.map(r => _p((r * 100) / vals.usage.allUser))
        }
        if (isArray(vals.usage.perCpuUser)) {
            vals.usage["perCpuUser%"] = vals.usage.perCpuUser.map(r => _p((r * 100) / vals.usage.allUser))
        }

        return vals
    }
}

/**
 * <odoc>
 * <key>ow.java.getLinuxCPUInfo(aReadFileFn) : Array</key>
 * Parses a Linux CPU info. Optionally you can provide a aReadFileFn that should expect the full path on a
 * linux /proc root filesystem and return a string with the corresponding contents.
 * </odoc>
 */
OpenWrap.java.prototype.getLinuxCPUInfo = function(aReadFileFn) {
    aReadFileFn = _$(aReadFileFn, "aReadFileFn").isFunction().default(io.readFileString)

    var vals = af.fromYAML(aReadFileFn("/proc/cpuinfo").trim().replace(/^$/mg, "---"))
    if (isDef(vals.flags)) vals.flags = vals.flags.trim().split(" ")
    if (isDef(vals.bugs)) vals.bugs = vals.bugs.trim().split(" ")
    return vals
}

/**
 * <odoc>
 * <key>ow.java.getMemory(shouldFormat) : Map</key>
 * Returns a map with the current java runtime max, total, used and free heap memory. If shouldFormat = true ow.format.toBytesAbbreviation will be used.
 * </odoc>
 */
OpenWrap.java.prototype.getMemory = function(shouldFormat) {
	var vals = {
		m: Number(java.lang.Runtime.getRuntime().maxMemory()),
        t: Number(java.lang.Runtime.getRuntime().totalMemory()),
        f: Number(java.lang.Runtime.getRuntime().freeMemory())
	};
	vals.u = vals.t - vals.f;

	if (shouldFormat) {
        ow.loadFormat();
		return {
			max: ow.format.toBytesAbbreviation(vals.m),
			total: ow.format.toBytesAbbreviation(vals.t),
			used: ow.format.toBytesAbbreviation(vals.u),
			free: ow.format.toBytesAbbreviation(vals.f)
		};
	} else {
		return {
			max: vals.m,
			total: vals.t,
			used: vals.u,
			free: vals.f
		};
	}
};

/**
 * <odoc>
 * <key>ow.java.gc()</key>
 * Executes the Java runtime gargabe collector.
 * </odoc>
 */
OpenWrap.java.prototype.gc = function() {
    return java.lang.Runtime.getRuntime().gc();
};

/**
 * <odoc>
 * <key>ow.java.getSystemProperties() : Map</key>
 * Retrieves the current list of system properties.
 * </odoc>
 */
OpenWrap.java.prototype.getSystemProperties = function() {
    return af.fromJavaMap( java.lang.management.ManagementFactory.getRuntimeMXBean().getSystemProperties() );
};

/**
 * <odoc>
 * <key>ow.java.getClassPath() : String</key>
 * Retrieves the initial java classpath.
 * </odoc>
 */
OpenWrap.java.prototype.getClassPath = function() {
    return String(java.lang.management.ManagementFactory.getRuntimeMXBean().getClassPath());
}; 

/**
 * <odoc>
 * <key>ow.java.getInputArguments() : Array</key>
 * List of Java virtual machine input arguments
 * </odoc>
 */
OpenWrap.java.prototype.getInputArguments = function() {
    return af.fromJavaArray( java.lang.management.ManagementFactory.getRuntimeMXBean().getInputArguments() );
};

/**
 * <odoc>
 * <key>ow.java.getLibraryPath() : String</key>
 * Retrieves the initial OS library path.
 * </odoc>
 */
OpenWrap.java.prototype.getLibraryPath = function() {
    return String( java.lang.management.ManagementFactory.getRuntimeMXBean().getLibraryPath() );
}

/**
 * <odoc>
 * <key>ow.java.ini() : Object</key>
 * Returns an object to handle Windows INI / Java properties kind of files. Available methods are:\
 * \
 *   load(content)   - Given a INI/properties file content converts to an internal format\
 *   loadFile(aFile) - Loads a file with load()\
 *   get()           - Returns a map of the internal format representation\
 *   put(aMap)       - Read aMap into the internal format representation (arrays not fully supported)\
 *   save()          - Returns a INI/properties string\
 *   saveFile(aFile) - Saves a file using save()\
 * \
 * Examples:\
 * \
 *   ow.java.ini().loadFile("/etc/os-release").get()\
 *   ow.java.ini().put(myMap).save()
 * </odoc>
 */
OpenWrap.java.prototype.ini = function() {
    var data = {}

    var _r = {
        readProperties: content => {
            var props = new java.util.Properties()
            props.load(af.fromString2InputStream(content))

            var r = {}
            for(var o of props) {
                o[1] = String(o[1])
                if (o[1].toLowerCase() == "true" || o[1].toLowerCase() == "false") o[1] = toBoolean(o[1]) 
                if (isNumber(o[1])) o[1] = Number(o[1])
                r[o[0]] = o[1] 
            }
            return r
        },
        load: content => {
            var t = content.split("\n")

            // remove comments and empty lines
            t = t.map(r => r.trim())
                 .filter(r => !r.startsWith(";") && !r.startsWith("#"))
                 .filter(r => r.length > 0)

            var path = "", buf = ""
            var plns = l => {
                if (isUnDef(l) || l.startsWith("[")) {
                    if (path == "") 
                        data = merge(data, _r.readProperties(buf))
                    else 
                        $$(data).set(path, merge($$(data).get(path), _r.readProperties(buf)))

                    buf = ""
                    if (isDef(l)) {
                        var sec = l.match(/^\[(.+)\]$/)

                        if (isArray(sec) && sec.length > 1) {
                            if (l.startsWith("[.")) 
                                path += sec[1]
                            else
                                path = sec[1]
                        }
                    }
                } else {
                    buf += l + "\n"
                }
            }
            
            t.forEach(plns)
            if (path == "") 
                data = merge(data, _r.readProperties(buf))
            else 
                $$(data).set(path, merge($$(data).get(path), _r.readProperties(buf)))
            return _r
        },
        loadFile: aFile => _r.load(io.readFileString(aFile)),
        get: () => { return data },
        put: m => {
            data = m
            return _r
        },
        save: () => {
            var s = "", ss = "", psec = ""
            traverse(data, (aK, aV, aP, aO) => {
                if (aP.startsWith(".")) aP = aP.substr(1)
                if (!isArray(aV) && !isMap(aV)) {
                    if (aP != psec) {
                        psec = aP
                        if (s.length != 0) s += "\n"
                        s += "[" + psec + "]\n"
                    }
                    s += aK + "=" + aV + "\n"
                }
            })
            s += ss
            return s
        },
        saveFile: aFile => io.writeFileString(aFile, _r.save())
    }
    return _r
}

/**
 * <odoc>
 * <key>ow.java.getAddressType(aAddress) : Map</key>
 * Given aAddress tries to return a map with the following flags: isValidAddress, hostname, ipv4, ipv6 and privateAddress
 * </odoc>
 */
OpenWrap.java.prototype.getAddressType = function(aTxt) {
    ow.loadNet();
    return ow.net.getAddressType(aTxt);
    /*var res ={
        isValidAddress: true,
        hostname: true,
        ipv4: false,
        ipv6: false,
        privateAddress: false
    };
 
    try {
       if (aTxt.trim().match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
          res.ipv4 = true;
          res.hostname = false;

          var addr = java.net.InetAddress.getByName(aTxt);
          if (addr.isSiteLocalAddress() || addr.isLoopbackAddress()) {
             res.privateAddress = true;
          }
       }
 
       if (aTxt.trim().match(/(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/)) {
          res.ipv6 = true;
          res.hostname = false;

          var addr = java.net.InetAddress.getByName(aTxt);
          if (addr.isSiteLocalAddress() || addr.isLoopbackAddress()) {
             res.privateAddress = true;
          }
       }
    } catch (e) {
       res.isValidAddress = false;
       res.hostname = false;
    }
 
    return res;*/
};

/**
 * <odoc>
 * <key>ow.java.getHost2IP(aHost) : String</key>
 * Tries to resolve aHost to an IP address using the default DNS.
 * </odoc>
 */
OpenWrap.java.prototype.getHost2IP = function(aName) {
    ow.loadNet();
    return ow.net.getHost2IP(aName);
    //return String(java.net.InetAddress.getByName(aName).getHostAddress());
};

/**
 * <odoc>
 * <key>ow.java.getIP2Host(aIP) : String</key>
 * Tries to reverse DNS aIP to a host address using the default DNS.
 * </odoc>
 */
OpenWrap.java.prototype.getIP2Host = function(aIP) {
    ow.loadNet();
    return ow.net.getIP2Host(aIP);
    //return String(java.net.InetAddress.getByName(aIP).getCanonicalHostName());
};

/**
 * <odoc>
 * <key>ow.java.getJarVersion(aJarFile) : Array</key>
 * Given aJarFile will return an array of JVM versions used in java classes contained.
 * </odoc>
 */
OpenWrap.java.prototype.getJarVersion = function(aJarFile) {
    var vers = [];

    plugin("ZIP");
    var zip = new ZIP();

    Object.keys( zip.list(aJarFile) ).forEach(r => {
        var v = ow.java.getClassVersion(aJarFile + "::" + r);
        if (vers.indexOf(v) < 0 && isDef(v)) {
            vers.push(v);
        }
    });

    return vers;
};

/**
 * <odoc>
 * <key>ow.java.getClassVersion(aClassBytes) : String</key>
 * Given the class array of bytes (aClassBytes), or a string from which the corresponding bytes will be read, tries to determine the minimum JVM version required to load the class.
 * </odoc>
 */
OpenWrap.java.prototype.getClassVersion = function(aClassBytes) {
    var ver;

    if (isString(aClassBytes)) aClassBytes = io.readFileBytes(aClassBytes);

    switch(aClassBytes[7]) {
    case 45: ver = "1.1"; break;
    case 46: ver = "1.2"; break;
    case 47: ver = "1.3"; break;
    case 48: ver = "1.4"; break;
    case 49: ver = "5"; break;
    case 50: ver = "6"; break;
    case 51: ver = "7"; break;
    case 52: ver = "8"; break;
    case 53: ver = "9"; break;
    case 54: ver = "10"; break;
    case 55: ver = "11"; break;
    case 56: ver = "12"; break;
    case 57: ver = "13"; break;
    case 58: ver = "14"; break;
    }

    return ver;
};

/**
 * <odoc>
 * <key>ow.java.getWhoIs(aQuery, aInitServer) : Map</key>
 * Tries to perform a whois aQuery for a domain or an ip address. Optionally you can provide aInitServer (defaults to whois.iana.org)
 * </odoc>
 */
OpenWrap.java.prototype.getWhoIs = function(aQuery, server) {
    ow.loadNet();
    return ow.net.getWhoIs(aQuery, server);
    /*var ws = new Packages.org.apache.commons.net.whois.WhoisClient();
    server = _$(server).isString().default("whois.iana.org");

    ws.connect(server);
    var res = ws.query(aQuery);
    ws.disconnect();

    var result = {},
    prefix = "",
    suffix = "";
    end = false;

    String(res).split(/\r?\n/).forEach(v => {
        if (!v.match(/^\s*%/) && v.match(/^\s*[^:]+:\s+.+/)) {
            var capture = true,
            preend = false;
            var ar = v.match(/^\s*([^\:]+)\:\s*(.+)$/);
            var key = String(ar[1]),
            value = String(ar[2]);

            value = value.trim().replace(/\n+\s*$/, "");
            key = key.trim();

            if (key == "nserver" || key == "whois" || key == "status" || key == "created" || key == "changed" || key == "source") {
                prefix = "";
                suffix = "";
            }
            if (key == "domain") {
                prefix = "domain ";
                suffix = "";
            }
            if (key == "contact") {
                prefix = value + " ";
                suffix = "";
                capture = false;
            }
            if (key == "remarks") capture = false;
            if (key.indexOf(">>>") >= 0 && value.indexOf("<<<") >= 0) {*/
                //key = key.replace(/>>>\s*/, "");
                /*value = value.replace(/\s*<<</, "");
                preend = true;
            }

            if (capture && !end) {
                if (isDef(result[prefix + key + suffix])) value = result[prefix + key + suffix] + "\n" + value;
                    result[prefix + key + suffix] = value;
            }

            if (preend) end = true;
        }
    });

    if (isDef(result.whois) && result.whois != server) result = ow.java.getWhoIs(aQuery, result.whois);

    return result;*/
};

/**
 * <odoc>
 * <key>ow.java.getLocalJavaPIDs(aUserID, aTmpDir) : Array</key>
 * Will return an array with the pid and the path for hsperf (to use with ow.java.parseHSPerf) that are currently running (hotspot jvms only) in the current system. 
 * If aUserID is not provided the current user name will be used. Optionally you can provide aTmpDir to use a different temporary directory.
 * </odoc>
 */
OpenWrap.java.prototype.getLocalJavaPIDs = function(aUserID, aTmpDir) {
    ow.loadFormat()

    aUserID = _$(aUserID, "aUserID").isString().default(ow.format.getUserName())
    var td = (isString(aTmpDir) ? aTmpDir : ow.format.getTmpDir()) + "/hsperfdata_" + aUserID

    return $from(io.listFiles(td).files)
           .equals("isFile", true)
           .match("filename", "\\d+")
           .select(r => ({
             pid : r.filename,
             path: r.canonicalPath
           }))
}

/**
 * <odoc>
 * <key>ow.java.parseHSPerf(aByteArrayOrFile, retFlat) : Map</key>
 * Given aByteArray or a file path for a java (hotspot jvm) hsperf file (using ow.java.getLocalJavaPIDs or similar) will return the java performance information parsed into a map.
 * If retFlat = true the returned map will be a flat map with each java performance metric and correspondent value plus additional calculations with the prefix "__"
 * </odoc>
 */
OpenWrap.java.prototype.parseHSPerf = function(aByteArray, retFlat) {
    if (isString(aByteArray)) aByteArray = io.readFileBytesRO(aByteArray)

    if (!isByteArray(aByteArray)) throw "aByteArray argument provided not a java byte array"
    retFlat    = _$(retFlat, "retFlat").isBoolean().default(false)

    var buffer = aByteArray, pos

    var readName = function(aNameLen) {
        var sb = ""
        while(aNameLen-- > 0) {
            var ch = buffer[pos++] & 0xff
            if (ch != 0) sb += String.fromCharCode(ch)
        }
        return sb
    }

    var readInt = function() {
        var v = Number(java.math.BigInteger([ buffer[pos++], buffer[pos++], buffer[pos++], buffer[pos++] ].reverse()).intValue())
        return (v < 0 ? Math.pow(2,32) + v : v)
    }

    var readLong = function() {
        var v = Number(java.math.BigInteger([ buffer[pos++], buffer[pos++], buffer[pos++], buffer[pos++], buffer[pos++], buffer[pos++], buffer[pos++], buffer[pos++] ].reverse()).longValue())
        return (v < 0 ? Math.pow(2,32) + v : v)
    }

    var res = {}
    try {
        pos = 0
        var value = readInt()
        if (value != 0xc0c0feca) return 4

        readInt()
        var length = readInt()
        if (length > buffer.length) return 4

        readInt()
        readInt()
        readInt()
        readInt()

        var count = readInt()
        while(count-- > 0) {
            var start = pos
            var len = readInt()

            if (start + len > length) return 4

            var nameStart = readInt()
            if (nameStart + len > length) return 4

            var slen = readInt()
            var kind = readInt()

            var valStart = readInt()
            if (valStart + len > length || valStart < nameStart) return 4

            pos = start + nameStart
            var nameLen = valStart - nameStart

            var propName = readName(nameLen)
            var s = ""
            var type = kind & 0xff
            switch(type) {
            case 0x4a: s += readLong()   ; break
            case 66  : s = readName(slen); break
            default  : s = "0"
            }
            res[propName] = s

            pos = start + len
        }
    } catch(e) {
        throw e
    }

    if (!retFlat) {
        var res2 = {}
        Object.keys(res).forEach(k => {
            nk = k.replace(/\.self$/, "_self")
            nk = nk.replace(/(\.)0*(\d+)(\.)?/g, "[$2]$3")
    
            if (nk.indexOf("[") > 0) {
                var cp = ""
                nk.split("[").forEach((k2, i) => {
                    if (i > 0) cp += "["
                    if (k2 != "") {
                        var obj = $$(res2).get(cp + k2)
                        if (isUnDef(obj)) $$(res2).set(cp + k2, [])
                    }
                    cp += k2
                })
            }
            $$(res2).set(nk, res[k])
        })

        res2.sun.rt.__createVmBeginDate = new Date(Number(res2.sun.rt.createVmBeginTime))
        res2.sun.rt.__createVmEndDate   = new Date(Number(res2.sun.rt.createVmEndTime))
        res2.sun.rt.__vmInitDoneDate    = new Date(Number(res2.sun.rt.vmInitDoneTime))
        res2.sun.rt.__totalRunningTime  = (isDef(res2.sun.os) ? Number(res2.sun.os.hrt.ticks) / 1000000 : __)

        var accTime = 0
        for(var i in res2.sun.gc.collector) {
            if (res2.sun.gc.collector[i].lastEntryTime > 0) {
                res2.sun.gc.collector[i].__lastEntryDate = new Date(Number(res2.sun.rt.createVmBeginTime) + Number(res2.sun.gc.collector[i].lastEntryTime/1000000))
                res2.sun.gc.collector[i].__lastExitDate  = new Date(Number(res2.sun.rt.createVmBeginTime) + Number(res2.sun.gc.collector[i].lastExitTime/1000000))
                res2.sun.gc.collector[i].__lastExecTime  = res2.sun.gc.collector[i].__lastExitDate.getTime() - res2.sun.gc.collector[i].__lastEntryDate.getTime()
                res2.sun.gc.collector[i].__avgExecTime   = (res2.sun.gc.collector[i].time/1000000) / res2.sun.gc.collector[i].invocations

                accTime += res2.sun.gc.collector[i].time/1000000
            }
        }
        for(var i in res2.sun.gc.generation) {
            res2.sun.gc.generation[i].__totalUsed = $from(res2.sun.gc.generation[i].space).sum("used")
        }

        res2.sun.rt.__percAppTime         = 100 - ((accTime / res2.sun.rt.__totalRunningTime) * 100)
        res2.sun.gc.__collectorsAccTimeMs = accTime

        return res2
    } else {
        return res
    }
}

/**
 * <odoc>
 * <key>ow.java.setIgnoreSSLDomains(aList, aPassword)</key>
 * Replaces the current Java SSL socket factory with a version with a custom trust manager that will "ignore" verification
 * of SSL certificates whose domains are part of aList (if no aList is provided defaults DANGEROUSLY to all). Optionally 
 * aPassword for the key store can be forced.\
 * WARNING: this should only be used in advanced setups where you know what are doing since it DISABLES IMPORTANT SECURITY
 * FEATURES.
 * </odoc>
 */
OpenWrap.java.prototype.setIgnoreSSLDomains = function(aList, aPassword) {
    aList = _$(aList, "list").isArray().default(__)

    if (!isNull(java.lang.System.getProperty("javax.net.ssl.trustStorePassword")))
        aPassword = String(java.lang.System.getProperty("javax.net.ssl.trustStorePassword"));

    aPassword = _$(aPassword, "password").isString().default("changeit");

    ow.loadFormat();
    var javaHome = ow.format.getJavaHome(), file;

    if (isNull(java.lang.System.getProperty("javax.net.ssl.trustStore"))) {
        file = "jssecacerts";
        if (!io.fileExists(file)) {
            var sep = String.fromCharCode(java.io.File.separatorChar);
            var dir = String(javaHome + sep + "lib" + sep + "security");
            file = dir + "/jssecacerts";
            if (!io.fileExists(file)) file = dir + "/cacerts";
        }
    } else {
        file = String(java.lang.System.getProperty("javax.net.ssl.trustStore"));
    }

    var tmf = javax.net.ssl.TrustManagerFactory.getInstance(javax.net.ssl.TrustManagerFactory.getDefaultAlgorithm());
    var ks = java.security.KeyStore.getInstance(java.security.KeyStore.getDefaultType());
    ks.load(new java.io.FileInputStream(new java.io.File(file)), (new java.lang.String("changeit")).toCharArray());
    tmf.init(ks);
    var tmf0 = tmf.getTrustManagers()[0];
    var ctx = javax.net.ssl.SSLContext.getInstance("SSL");

    ctx.init(null, [new JavaAdapter(javax.net.ssl.X509TrustManager, {
        __noError: false,
        checkClientTrusted: function(certs, authType) {
            //print("check client trusted");
            tmf0.checkClientTrusted(certs, authType);
        },
        checkServerTrusted: function(certs, authType) {
            //print("check server trusted certs: " + certs.length + " authType: " + authType);
            if (isUnDef(aList)) {
                this.__noError = true
            } else {
                var checks = new Set()
                for(var i = 0; i < certs.length; i++) {
                    checks.add(certs[i].getSubjectDN().getCommonName())
                    let _ar = (af.fromJavaArray(certs[i].getSubjectAlternativeNames().toArray()).map(af.fromJavaArray))
                    _ar.forEach(r => checks.add(r[1]))
             
                    checks.forEach(r => {
                        //print("Checking: " + r)
                        for(var ii = 0; ii < aList.length; ii++) {
                            if (String(r).endsWith(aList[ii])) {
                                this.__noError = true
                            }
                        }
                    })
                }
            }

            try {
                tmf0.checkServerTrusted(certs, authType);
            } catch(e) {
                if (!this.__noError) throw e;
            }
        },
        getAcceptedIssuers: function() {
            //print("accept issuer");
            return tmf0.getAcceptedIssuers();
        }
      })], new java.security.SecureRandom());
      
    javax.net.ssl.SSLContext.setDefault(ctx);
    javax.net.ssl.HttpsURLConnection.setDefaultSSLSocketFactory(ctx.getSocketFactory());
    global.__httpSSLSocketFactory = ctx.getSocketFactory()
    global.__httpX509TrustManager = tmf0
};

OpenWrap.java.prototype.memComm = function(aFile, aSize) {
    _$(aFile, "file").isString().$_();

    this.file = aFile;
    this.fsize = _$(aSize).isNumber().default(4096);
    this.lck = __;

    this.setup();
};

OpenWrap.java.prototype.memComm.prototype.setup = function() {
    var f = new java.io.File(this.file);

    this.channel = java.nio.channels.FileChannel.open(f.toPath(), java.nio.file.StandardOpenOption.READ, java.nio.file.StandardOpenOption.WRITE, java.nio.file.StandardOpenOption.CREATE);
    
    var b = this.channel.map(java.nio.channels.FileChannel.MapMode.READ_WRITE, 0, this.fsize);
    this.charBuf = b.asCharBuffer();
};

OpenWrap.java.prototype.memComm.prototype.lock = function() {
    this.lck = this.channel.lock();
};

OpenWrap.java.prototype.memComm.prototype.unlock = function() {
    if (isDef(this.lck)) this.lck.release();
    this.lck = __;
}

OpenWrap.java.prototype.memComm.prototype.send = function(aMsg) {
    _$(aMsg, "msg").isString().$_();

    if (isDef(this.lck)) {
        if (!this.lck.isValid()) throw "Couldn't send, channel locked.";
    }
    this.charBuf.put((new java.lang.String(aMsg + "\u0000")).toCharArray());
};

OpenWrap.java.prototype.memComm.prototype.rewind = function() {
    this.charBuf.rewind();
};

OpenWrap.java.prototype.memComm.prototype.close = function() {
    this.channel.close();
};

OpenWrap.java.prototype.memComm.prototype.receive = function() {
    var c, s = "";
    do {
        c = this.charBuf.get();
        if (c != 0) s += String.fromCharCode(c);
    } while(c != 0);

    return s;
};

OpenWrap.java.prototype.jsonMemComm = function(aDir, aSize) {
    aSize = _$(aSize, "size").isNumber().default(4096);
    _$(aDir, "dir").isString().$_();

    io.mkdir(aDir);
    this.dir = aDir;
    this.idx = new ow.java.memComm(this.dir + "/index.mem", aSize);
};

OpenWrap.java.prototype.jsonMemComm.prototype.destroy = function() {
    this.idx.close();
    io.rm(this.dir + "/index.mem");
    io.rm(this.dir);
};

OpenWrap.java.prototype.jsonMemComm.prototype.send = function(aObj) {
    _$(aObj, "obj").isObject().$_();
    var t;
    
    this.idx.rewind();
    this.idx.lock();
    try {
        var index = jsonParse(this.idx.receive(), true);

        var s = stringify(aObj, __, "");
        t = nowNano();
        var n = t + ".mem";
        index[t] = n;
        var tmp = new ow.java.memComm(this.dir + "/" + n, s.length * 4);
        tmp.send(s);
    
        this.idx.rewind();
        this.idx.send(stringify(index, __, ""));
        this.idx.unlock();
    } catch(e) {
        this.idx.unlock();
        throw e;
    }

    return t;
};

OpenWrap.java.prototype.jsonMemComm.prototype.receive = function() {
    var received = false; obj = [];
    do {
        try {
            this.idx.lock();
            this.idx.rewind();
            var entries = jsonParse(this.idx.receive(), true);
            Object.keys(entries).map(r => {
                var tmp = new ow.java.memComm(this.dir + "/" + entries[r], io.fileInfo(this.dir + "/" + entries[r]).size);
                obj.push({
                    t: r,
                    o: jsonParse(tmp.receive(), true)
                });
                received = true;
                tmp.close();
                io.rm(entries[r]);
                delete entries[r];

                this.idx.rewind();
                this.idx.send(stringify(entries, __, ""));
            });
            this.idx.unlock();
        } catch(e) {
            this.idx.unlock();
            throw e;
        }
        if (!received) sleep(150, true);
    } while(!received);

    return obj;
};