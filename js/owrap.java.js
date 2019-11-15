// OpenWrap v2
// Author: Nuno Aguiar
// Java
 
OpenWrap.java = function() {
	return ow.java;
};

OpenWrap.java.prototype.maven = function() {
    ow.loadObj();
    this.urls = [
        "http://repo1.maven.org/maven2",
        "http://uk.maven.org/maven2"
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

    var h = new ow.obj.http(this._getURL() + "/" + aURI + "/" + version + "/" + filename, "GET", "", void 0, true, void 0, true);

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

                        var pversion = void 0;
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
                                version: (isDef(pversion) ? pversion : void 0),
                                scope: (isDef(v.scope) ? String(v.scope) : void 0)
                            });
                            
                            if (aList.indexOf(pgroupId + "." + v.artifactId) < 0) {
                                var rinfo = this.getDependencies(pgroupId + "." + v.artifactId, pversion, void 0, aScope, aList, props);
                                aList.add(pgroupId + "." + v.artifactId);
                                info.addAll(rinfo);
                            }
                        }
                    }
                }
            });
        }
    } catch(e) {
        if (String(e).indexOf("FileNotFoundException") < 0) throw e; 
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
                testfunc = new Function(arts.testFunc);
            }

            var outputDir = _$(arts.output).isString().default(aDirectory);
            var filenameTemplate = _$(arts.template).isString().default(arts.id + "-{{version}}.jar");
            if (hasVersion) {
                aLogFunc("Downloading " + arts.id + " version " + version + " jar file...");
                maven.getFileVersion(arts.group + "." + arts.id, filenameTemplate, version, outputDir);
                if (deleteOld) maven.removeOldVersionsSpecific(arts.id, filenameTemplate, version, outputDir, testfunc);
            } else {
                aLogFunc("Downloading latest " + arts.id + " jar file...");
                maven.getFile(arts.group + "." + arts.id, filenameTemplate, outputDir);
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

OpenWrap.java.prototype.cipher = function() {};

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

   var cipher = javax.crypto.Cipher.getInstance("RSA/ECB/OAEPWITHSHA-512ANDMGF1PADDING");
   cipher.init(javax.crypto.Cipher.ENCRYPT_MODE, publicKey);
   var cipherText = cipher.doFinal(af.fromString2Bytes(plainText));
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
   var cipher = javax.crypto.Cipher.getInstance("RSA/ECB/OAEPWITHSHA-512ANDMGF1PADDING");
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
 * <key>ow.java.cipher.saveKey2File(aFilename, aKey, isPrivate)</key>
 * Given a public or private aKey (from ow.java.cipher.readKey4File or genKeyPair) tries to save it to aFilename. If
 * the aKey is private isPrivate must be true, if public is must be false.
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.saveKey2File = function(filename, key, isPrivate) {
   _$(filename).isString().$_("Please provide a filename.");
   _$(key).$_("Please provide the key to save.");
   _$(isPrivate).isBoolean().$_("Please indicate if it's a private or public key.");

   var keyFactory = java.security.KeyFactory.getInstance("RSA");
   var spec;
   if (isPrivate) {
      spec = keyFactory.getKeySpec(key, af.getClass("java.security.spec.RSAPrivateKeySpec"));
   } else {
      spec = keyFactory.getKeySpec(key, af.getClass("java.security.spec.RSAPublicKeySpec"));
   }
   var modulus = spec.getModulus();
   var exponent = (isPrivate ? spec.getPrivateExponent() : spec.getPublicExponent() );
   var ostream = new java.io.ObjectOutputStream(new java.io.BufferedOutputStream(new Packages.org.apache.commons.codec.binary.Base64OutputStream(new java.io.FileOutputStream(filename))));
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
 * <key>ow.java.cipher.readKey4File(aFilename, isPrivate) : Key</key>
 * Given a key file previously saved with ow.java.cipher.saveKey2File returns the Key object to use with other functions.
 * If the aKey is private isPrivate must be true, if public is must be false.
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.readKey4File = function(filename, isPrivate) {
   _$(filename).isString().$_("Please provide a filename.");
   _$(isPrivate).isBoolean().$_("Please indicate if it's a private or public key.");

   var istream = new java.io.FileInputStream(filename);
   var oistream = new java.io.ObjectInputStream(new java.io.BufferedInputStream(new Packages.org.apache.commons.codec.binary.Base64InputStream(istream)));
   var key;
   try {
      var modulus = oistream.readObject();
      var exponent = oistream.readObject();
      var keyFactory = java.security.KeyFactory.getInstance("RSA");
      if (!isPrivate) {
         key = keyFactory.generatePublic(new java.security.spec.RSAPublicKeySpec(modulus, exponent));
      } else {
         key = keyFactory.generatePrivate(new java.security.spec.RSAPrivateKeySpec(modulus, exponent));
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
 * <key>ow.java.cipher.decode2Key(aKey, isPrivate) : Key</key>
 * Given an encoded base 64 key (with ow.java.cipher.key2encode) returns the corresponding Key object.
 * If the aKey is private isPrivate must be true, if public is must be false.
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.decode2key = function(key, isPrivate) {
   _$(key).$_("Please provide a key to decode.");
   _$(isPrivate).isBoolean().$_("Please indicate if it's a private or public key.");

   var k = java.util.Base64.getDecoder().decode(af.fromString2Bytes(key));
   var keyFactory = java.security.KeyFactory.getInstance("RSA");
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
 * <key>ow.java.cipher.decrypt(aEncryptedMessage, aPrivateKey) : ArrayBytes</key>
 * Given a previously encrypted message will return the corresponding decrypted message using aPrivateKey.
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.decrypt = function(cipherText, privateKey) {
   _$(cipherText).$_("Please provide an encrypted message to decrypt.");
   _$(privateKey).$_("Please provide a private key.");

   var cipher = javax.crypto.Cipher.getInstance("RSA/ECB/OAEPWITHSHA-512ANDMGF1PADDING");
   cipher.init(javax.crypto.Cipher.DECRYPT_MODE, privateKey);
   var decryptedText = cipher.doFinal(cipherText);
   return af.fromBytes2String(decryptedText);
};

// af.fromInputStream2String(t.decryptStream(af.fromBytes2InputStream(t.encrypt("ola", pub)), priv))
/**
 * <odoc>
 * <key>ow.java.cipher.decryptStream(aInputStream, aPrivateKey) : Stream</key>
 * Given a previously encrypted aInputStream will return the corresponding decrypted stream using aPrivateKey.
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.decryptStream = function(iStream, privateKey) {
   if (iStream == null) throw "Please provide an encrypted stream to decrypt.";
   _$(privateKey).$_("Please provide a private key.");  
   var cipher = javax.crypto.Cipher.getInstance("RSA/ECB/OAEPWITHSHA-512ANDMGF1PADDING");
   cipher.init(javax.crypto.Cipher.DECRYPT_MODE, privateKey);
   return new javax.crypto.CipherInputStream(iStream, cipher);
};

/**
 * <odoc>
 * <key>ow.java.cipher.genKeyPair(aKeySize) : Map</key>
 * Given aKeySize (e.g. 2048, 3072, 4096, 7680 and 15360) will return a map with publicKey and privateKey.
 * </odoc>
 */
OpenWrap.java.prototype.cipher.prototype.genKeyPair = function(size) {
   size = _$(size).default(2048);
   var keyPairGen = java.security.KeyPairGenerator.getInstance("RSA");
   keyPairGen.initialize(size);

   var keyPair = keyPairGen.generateKeyPair();
   return {
      publicKey: keyPair.getPublic(),
      privateKey: keyPair.getPrivate()
   };
};

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