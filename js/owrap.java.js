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
    var filename = templify(aFilenameTemplate, {
        version: version
    });

    var h = new ow.obj.http(this._getURL() + "/" + aURI + "/" + version + "/" + filename, "GET", "", void 0, true, void 0, true);

    io.mkdir(aOutputDir);
    var rstream = h.responseStream();
    var wstream = io.writeFileStream(aOutputDir + "/" + filename);
    ioStreamCopy(wstream, rstream);
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
    var version = this.getLatestVersion(aURI);
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