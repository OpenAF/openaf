/**
 * <odoc>
 * <key>ODoc(aoDoc)</key>
 * Object to hold an ODoc, the basic structure for OpenAF documentation. You can provide a ODoc structure
 * to initialize this ODoc object.
 * </odoc>
 */
var ODoc = function(aoDoc) {
	this.odoc = {};
	if (isDef(aoDoc)) this.addAll(aoDoc);
}

/**
 * <odoc>
 * <key>ODoc.add(aKey, aFullKey, aValue)</key>
 * Adds a ODoc entry given a key (a unique name), a full key (a function or object signature) and a
 * corresponding text value.
 * </odoc>
 */
ODoc.prototype.add = function(aKey, aFullKey, aValue) {
	var item = {
		"k": aFullKey,
		"t": aValue
	};

	this.odoc[aKey] = item;
}

/**
 * <odoc>
 * <key>ODoc.get(aKey) : Map</key>
 * Returns the ODoc entry corresponding to the unique key provided.
 * </odoc>
 */
ODoc.prototype.get = function(aKey) {
	return this.odoc[aKey];
}

/**
 * <odoc>
 * <key>ODoc.getKeys() : Array</key>
 * Returns an array with all keys from this ODoc.
 * </odoc>
 */
ODoc.prototype.getKeys = function() {
	return Object.keys(this.odoc);
}

/**
 * <odoc>
 * <key>ODoc.getAll() : Map</key>
 * Returns the ODoc entire Map structure to be exported somewhere else.
 * </odoc>
 */
ODoc.prototype.getAll = function() {
	var ret = {};

	for(var i in this.odoc) {
		ret[i] = this.odoc[i];
	}

	return ret;
}

/**
 * <odoc>
 * <key>ODoc.addAll()</key>
 * Adds an ODoc Map structure imported from another ODoc object.
 * </odoc>
 */
ODoc.prototype.addAll = function(aODoc) {
	for(var i in aODoc) {
		this.odoc[i] = aODoc[i];
	}
}

/**
 * <odoc>
 * <key>ODocs(aPath, aODocs, anArrayURLs, offline)</key>
 * Object to hold ODocs objects, search them, load or save them (either offline or online). The parameter aPath
 * should be use as a path to save for offline use or as a path to save for online use. The parameter aODocs
 * is optional but it can be used to link with ODocsGen contents (e.g (new ODocsGen(aMapOfFiles)).getODoc())).
 * It's also possible to additionally specify anArrayURLs to load ODocs via web. Optional you can force it to
 * only work offline (offline = true)
 * </odoc>
 */
var ODocs = function(aPath, aODocs, anArrayURLs, offline) {
	this.aodocs = {};
	this.aodocskeys = {};
	this.loadFromWeb = false;
	this.keyLoadFromWeb = false;
	this.offline = offline;
	this.keysfile = "__odockeys";
	this.arrayurls = anArrayURLs;
	this.aFilename = (isUnDef(aPath)) ? getOpenAFJar() : aPath;
	this.filesIds = {};
	this.loadFile();
	if (isDef(aODocs)) this.addAll(aODocs);
};

ODocs.prototype.loadFile = function(aPath) {
	try { 
		this.load(__, aPath); 
		if(!this.offline && isUnDef(aPath)) {
			this.backgroundLoadWeb(); 
		}
	} catch(e) { 
		// Try another way
		if (isUnDef(aPath)) this.loadWeb();
	}
};

/**
 * <odoc>
 * <key>ODocs.addAll(aODoc)</key>
 * Add an external ODocs structure into these object.
 * </odoc>
 */
ODocs.prototype.addAll = function(aODoc) {
	for(var i in aODoc) {
		this.aodocs[i] = new ODoc(aODoc[i]);
		this.aodocskeys[i] = this.aodocs[i].getKeys();
	}
}

/**
 * <odoc>
 * <key>ODocs.save()</key>
 * Saves the current ODocs into the filename provided on the constructor in a way suitable
 * for offline use.
 * </odoc>
 */
ODocs.prototype.save = function() {
	plugin("ZIP");

	var zip = new ZIP();
	var odocskeys = {};
	try {
		zip.loadFile(this.aFilename + "/.odoc.db");
		odocskeys = af.fromJson(af.fromBytes2String(zip.getFile(this.keysfile)));
	} catch(e) {
	}

	for(var i in this.aodocs) {
		zip.putFile(i, af.fromString2Bytes(beautifier(this.aodocs[i].getAll())));
		odocskeys[i] = this.aodocs[i].getKeys();
	}

	zip.putFile(this.keysfile, af.fromString2Bytes(beautifier(odocskeys)));
	io.writeFileBytes(this.aFilename + "/.odoc.db", zip.generate({"compressionLevel":9}));
	zip.close();
}

/**
 * <odoc>
 * <key>ODocs.saveWeb()</key>
 * Saves the current ODocs into the path provided on the constructor with files suitable from loading
 * from web.
 * </odoc>
 */
ODocs.prototype.saveWeb = function() {
	plugin("ZIP");

	var zip = new ZIP();
	io.mkdir(this.aFilename);
	var odocskeys = {};
	try {
		odocskeys = af.fromJson(zip.gunzip(af.fromBytes2String(io.readFileBytes(this.aFilename + "/" + this.keysfile + ".gz"))));
	} catch(e) {
	}

	for(var i in this.aodocs) {
		io.writeFileBytes(this.aFilename + "/" + i + ".gz", zip.gzip(af.fromString2Bytes(beautifier(this.aodocs[i].getAll()))));
		odocskeys[i] = this.aodocs[i].getKeys();
	}

	io.writeFileBytes(this.aFilename + "/" + this.keysfile + ".gz", zip.gzip(af.fromString2Bytes(beautifier(odocskeys))));
}

ODocs.prototype.loadWeb = function(aID) {
	plugin("HTTP");
	var parent = this;
	
	function getFromWeb(aSuffix) {
 		if (isUnDef(aSuffix) || aSuffix == "undefined.gz") return null;

		for(var i in parent.arrayurls) {
			try {
				var h = new HTTP(parent.arrayurls[i] + "/" + aSuffix, "GET", "", {}, true, 500);
				if (isDef(h)) {
					return h.responseBytes();
				} else {
					return null;
				}
			} catch(e) {
			}
		}
		return null;
	}
	
	try {
		var b;
		//if(!(this.keyLoadFromWeb)) {
			this.keyLoadFromWeb = false;
			b = getFromWeb(this.keysfile + ".gz");
			if (b != null) {
				this.aodocskeys = merge(af.fromJson(af.fromBytes2String(io.gunzip(b))), this.aodocskeys);
				this.keyLoadFromWeb = true;
			}
		//}

		b = getFromWeb(aID + ".gz");
		if (b != null) {
			var odoc = af.fromJson(af.fromBytes2String(io.gunzip(b)));
			this.aodocs[aID] = new ODoc(odoc);
			this.loadFromWeb = true;
			return true;
		} else {
			return false;
		}
	} catch(e) {
		this.loadFromWeb = false;
		return false;
	}
}

ODocs.prototype.load = function(aID, aFilename) {
	plugin("ZIP");

	var zip;
	if (isUnDef(aFilename) && isDef(this.filesIds[aID])) aFileName = this.filesIds[aID];
	if (aFilename.match(/\.(jar|db|zip)$/)) {
		var zipContainer = new ZIP();
		zip = new ZIP(zipContainer.streamGetFile(aFilename, ".odoc.db"));
	} else {
		zip = new ZIP();
		zip.loadFile(aFilename + "/.odoc.db");
	}

	if (this.offline) this.keyLoadFromWeb = false;
	
	var list = zip.list();
	for(var i in list) {
		if (i == this.keysfile) { // && (!(this.keyLoadFromWeb))) {
			var b = zip.getFile(i);
			if (b.length > 1) this.aodocskeys = merge(af.fromJson(af.fromBytes2String(b)), this.aodocskeys);
			continue;
		} else {
			this.filesIds[i] = aFilename;
		}

		if (i == aID) {
			var id = list[i].name;
			var odoc = af.fromJson(af.fromBytes2String(zip.getFile(id)));
			this.aodocs[id] = new ODoc(odoc);
		}
	}

	zip.close();
};

ODocs.prototype.search = function(aTerm, anArrayOfIds) {
	var ids = (isUnDef(anArrayOfIds)) ? Object.keys(this.aodocskeys) : anArrayOfIds;
	var resArray = [];

	for(var id in this.aodocskeys) {
		if (ids.indexOf(id) >= 0) {
			var temp = uniqArray($from(this.aodocskeys[id]).useCase(false).equals(aTerm).select(function(r) { return { "id": id, "key": r};}));
			if (temp.length > 0) {
				var tempCase = uniqArray($from(this.aodocskeys[id]).useCase(true).equals(aTerm).select(function(r) { return {"id": id, "key": r};}));
				if (tempCase.length == 1) {
					return tempCase;
				} else {
					return temp;
				}
				//return [{"id": id, "key": aTerm}];
			} else {
				var res = $from(this.aodocskeys[id]).useCase(false).contains(aTerm).select(function(r) { return {"id": id, "key": r};});
				resArray = resArray.concat(res);
			}
		}
	}

	return resArray;
};

ODocs.prototype.backgroundLoadWeb = function(aID) {
	var parent = this;
	plugin("Threads");
	var t = new Threads();
	t.addThread(function(uuid) { parent.loadWeb(aID); t.stop(true); });
	t.startNoWait();	
}

ODocs.prototype.get = function(aID, aKey) {
    // Clean stuff
    this.aodocs = {};

    if (isUnDef(this.aodocskeys) ||
        this.aodocskeys == {} || 
        isUnDef(this.aodocs[aID])) {
    	try {
			this.load(aID, this.filesIds[aID]);
			if(!this.offline) {
				this.backgroundLoadWeb(aID);
			}
		} catch(e) {
			// Try another way
			this.loadWeb(aID);
		}
    }

    return this.aodocs[aID].get(aKey);
}

ODocs.prototype.getODoc = function(aID) {
	return this.aodocs[aID];
}

/**
 * <odoc>
 * <key>ODocsGen(aMapOfFiles) : ODocsGen</key>
 * Object to generate ODocs structures. Given a map where the key is a ODoc subject and the value is the
 * filesystem path to a javascript or Java source file (e.g. new ODocsGen({"sample": "/some/place/source.java"})).
 * It finds text within odoc xml tags and adds it as odoc text. Inside the odoc xml tags you should have
 * a key xml tag to specify a unique key within a ODoc subject (the key will be interpreted until the first '(', '{' or '['
 * occurs). Per standard practice you should specify the entire signature of a function when describing one.
 * </odoc>
 */
var ODocsGen = function(aMapOfFiles) {
	this.aMapOfFiles = aMapOfFiles;
	this.odoc = {};
	this.genODocs();
}

/**
 * <odoc>
 * <key>ODocsGen.genODoc(aFileName) : Map</key>
 * Generates a ODoc map where each key will be the identified odoc key and the value a map where
 * k will represent the original key and t the associated text.
 * </odoc>
 */
ODocsGen.prototype.genODoc = function(aFilename) {
	var s = io.readFileString(aFilename);

	var xmls = s.replace(/\r/mg, "").replace(/\\\n/mg, "%%br%%").replace(/([\n|%%br%%])[ |\t]+\*+[ |\t]/mg, "$1").replace(/\n+/mg, " ").match(/\<odoc\>.+?\<\/odoc\>/img);
	var odoc = new ODoc();

	for(var i in xmls) {
		var xml = new XMLList(xmls[i]);
		var key = (xml.key + "").replace(/\%\%br\%\%/g, "");

		odoc.add(key.replace(/[\(|\{|\[|\:].+/, ""), xml.key + "", (xml.text() + "").replace(/\%\%br\%\%/g, "\n"));
	}

	return odoc;
}

/**
 * <odoc>
 * <key>ODocsGen.genODocs()</key>
 * The main execution function. Will generate odoc structures for all the files provided to this object
 * </odoc>
 */
ODocsGen.prototype.genODocs = function() {
	for(var i in this.aMapOfFiles) {
		log("Generating odoc for " + i);
		this.odoc[i] = this.genODoc(this.aMapOfFiles[i]);
	}
}

/**
 * <odoc>
 * <key>ODocsGen.getODoc() : Map</key>
 * Gets the current odoc maps per id.
 * </odoc>
 */
ODocsGen.prototype.getODoc = function() {
	var ret = clone(this.odoc);
	for(var i in this.odoc) {
		ret[i] = ret[i].getAll();
	}
	return ret;
}

/**
 * <odoc>
 * <key>ODocsGen.getODocKeys() : Array</key>
 * Gets the current odocs keys per id.
 * </odoc>
 */
ODocsGen.prototype.getODocKeys = function() {
	var ret = {};
	for(var i in this.odoc) {
		ret[i] = this.odoc[i].getKeys();
	}
	return ret;
}

