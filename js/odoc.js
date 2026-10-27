// OpenAF oDoc
// Copyright 2023 Nuno Aguiar

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
 * <key>ODoc.add(aKey, aFullKey, aValue, aFormat)</key>
 * Adds a ODoc entry given a key (a unique name), a full key (a function or object signature) and a
 * corresponding text value. Optionally set aFormat to "markdown" or "md" to enable Markdown display.
 * </odoc>
 */
ODoc.prototype.add = function(aKey, aFullKey, aValue, aFormat) {
	var item = {
		"k": aFullKey,
		"t": aValue
	};

	if (aFormat == "markdown" || aFormat == "md") item.format = "markdown";
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
 * <key>ODoc.addAll(aODoc)</key>
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
 * can be a directory containing .odoc.db, a standalone database ZIP, or a JAR/ZIP containing .odoc.db.
 * Saving requires a directory path. The parameter aODocs
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
	this.arrayurls = anArrayURLs || [];
	this.aFilename = (isUnDef(aPath)) ? getOpenAFJar() : aPath;
	this.filesIds = {};
	this.loadFile(aPath);
	if (isDef(aODocs)) this.addAll(aODocs);
};

/**
 * <odoc>
 * <key>ODocs.loadFile(aPath)</key>
 * Loads a local documentation index. Defaults to the constructor path. Online fallback and background
 * refresh are enabled only when offline is false and no explicit aPath was supplied.
 * </odoc>
 */
ODocs.prototype.loadFile = function(aPath) {
	try { 
		this.load(__, isDef(aPath) ? aPath : this.aFilename);
		if(!this.offline && isUnDef(aPath)) {
			this.backgroundLoadWeb(); 
		}
	} catch(e) { 
		// Try another way
		if (!this.offline && isUnDef(aPath)) this.loadWeb();
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
		delete this.filesIds[i];
	}
}

/**
 * <odoc>
 * <key>ODocs.save()</key>
 * Saves the current ODocs into .odoc.db in the directory provided on the constructor in a way suitable
 * for offline use.
 * </odoc>
 */
ODocs.prototype.save = function() {
  plugin("ZIP");
  var zip = new ZIP();
  var odocskeys = {};
  try {
    io.mkdir(this.aFilename);
    try {
      zip.loadFile(this.aFilename + "/.odoc.db");
      odocskeys = af.fromJson(af.fromBytes2String(zip.getFile(this.keysfile)));
    } catch(e) {
      if (io.fileExists(this.aFilename + "/.odoc.db")) throw e;
    }
    for(var i in this.aodocs) {
      zip.putFile(i, af.fromString2Bytes(beautifier(this.aodocs[i].getAll())));
      odocskeys[i] = this.aodocs[i].getKeys();
    }
    zip.putFile(this.keysfile, af.fromString2Bytes(beautifier(odocskeys)));
    io.writeFileBytes(this.aFilename + "/.odoc.db", zip.generate({ compressionLevel: 9 }));
  } finally {
    zip.close();
  }
}

/**
 * <odoc>
 * <key>ODocs.saveWeb()</key>
 * Saves the current ODocs into the path provided on the constructor with files suitable for loading
 * from web.
 * </odoc>
 */
ODocs.prototype.saveWeb = function() {
  io.mkdir(this.aFilename);
  var odocskeys = {};
  var keysPath = this.aFilename + "/" + this.keysfile + ".gz";
  if (io.fileExists(keysPath)) {
    var input = io.readFileStream(keysPath);
    odocskeys = __streamCodec.use([input], () => af.fromJson(__streamCodec.gunzipText(input)));
  }
  for(var i in this.aodocs) {
    var output = io.writeFileStream(this.aFilename + "/" + i + ".gz");
    __streamCodec.use([output], () => __streamCodec.gzipText(beautifier(this.aodocs[i].getAll()), output));
    odocskeys[i] = this.aodocs[i].getKeys();
  }
  var output = io.writeFileStream(keysPath);
  __streamCodec.use([output], () => __streamCodec.gzipText(beautifier(odocskeys), output));
}

/**
 * <odoc>
 * <key>ODocs.loadWeb(aID) : Boolean</key>
 * Loads web documentation from the configured URLs, trying the next URL on invalid responses.
 * Without aID, loads only the index. Returns false when offline or loading fails.
 * </odoc>
 */
ODocs.prototype.loadWeb = function(aID) {
  if (this.offline) return false;
  plugin("HTTP");
  var parent = this;
  function getFromWeb(aSuffix) {
    for(var i = 0; i < parent.arrayurls.length && !parent.offline; i++) {
      try {
        var h = new HTTP(parent.arrayurls[i] + "/" + aSuffix, "GET", "", {}, true, 500, true);
        // Decode within the loop so an invalid response can fall back to the next URL.
        var stream = h.responseStream();
        var data = af.fromJson(__streamCodec.use([stream], () => __streamCodec.gunzipText(stream)));
        if (!isMap(data)) continue;
        if (aSuffix == parent.keysfile + ".gz" &&
            !Object.keys(data).every(k => isArray(data[k]))) continue;
        if (aSuffix != parent.keysfile + ".gz" &&
            !Object.keys(data).every(k => isMap(data[k]) && isString(data[k].k) && isString(data[k].t))) continue;
        return data;
      } catch(e) {
      } finally {
        if (isDef(h)) { try { h.close(); } catch(ignore) {} }
      }
    }
  }
  if (!this.keyLoadFromWeb) {
    var keys = getFromWeb(this.keysfile + ".gz");
    if (isDef(keys)) {
      this.aodocskeys = merge(keys, this.aodocskeys);
      this.keyLoadFromWeb = true;
    }
  }
  if (this.offline) return false;
  if (isUnDef(aID)) return this.keyLoadFromWeb;
  var data = getFromWeb(aID + ".gz");
  this.loadFromWeb = isDef(data);
  if (this.loadFromWeb) {
    this.aodocs[aID] = new ODoc(data);
    this.aodocskeys[aID] = this.aodocs[aID].getKeys();
  }
  return this.loadFromWeb;
}

/**
 * <odoc>
 * <key>ODocs.load(aID, aFilename)</key>
 * Loads a local documentation index and optionally one subject. Uses the remembered subject source
 * or constructor path when aFilename is omitted. Accepts directories and standalone or nested ZIP archives.
 * </odoc>
 */
ODocs.prototype.load = function(aID, aFilename) {
  plugin("ZIP");
  if (isUnDef(aFilename)) aFilename = this.filesIds[aID];
  if (isUnDef(aFilename)) aFilename = this.aFilename;
  var zip = new ZIP(), zipContainer;
  try {
    if (/\.(jar|db|zip)$/i.test(aFilename)) {
      zip.loadFile(aFilename);
      if (isDef(zip.list()[".odoc.db"])) {
        zipContainer = zip;
        zip = new ZIP(zipContainer.getFile(".odoc.db"));
      }
    } else {
      zip.loadFile(aFilename + "/.odoc.db");
    }
    if (this.offline) this.keyLoadFromWeb = false;
    var keys = af.fromJson(af.fromBytes2String(zip.getFile(this.keysfile)));
    for(var id in keys) {
      if (this.filesIds[id] != aFilename) delete this.aodocs[id];
      this.filesIds[id] = aFilename;
      this.aodocskeys[id] = keys[id];
    }
    if (isDef(aID) && isDef(keys[aID])) {
      this.aodocs[aID] = new ODoc(af.fromJson(af.fromBytes2String(zip.getFile(aID))));
    }
  } finally {
    try { zip.close(); } finally { if (isDef(zipContainer)) zipContainer.close(); }
  }
};

/**
 * <odoc>
 * <key>ODocs.search(aTerm, anArrayOfIds) : Array</key>
 * Returns id/key candidates across the selected subjects. Prefers case-sensitive exact keys, then
 * case-insensitive exact keys, then substrings. Ambiguous keys retain each matching subject.
 * </odoc>
 */
ODocs.prototype.search = function(aTerm, anArrayOfIds) {
  var ids = isUnDef(anArrayOfIds) ? Object.keys(this.aodocskeys) : anArrayOfIds;
  var exact = [], folded = [], partial = [], term = String(aTerm), lower = term.toLowerCase();
  ids.forEach(id => {
    (this.aodocskeys[id] || []).forEach(key => {
      var item = { id: id, key: key };
      if (key == term) exact.push(item);
      if (key.toLowerCase() == lower) folded.push(item);
      if (key.toLowerCase().indexOf(lower) >= 0) partial.push(item);
    });
  });
  var result = exact.length ? exact : (folded.length ? folded : partial);
  return uniqArray(result).sort(function(a, b) {
    var ak = a.key.toLowerCase(), bk = b.key.toLowerCase();
    return ak < bk ? -1 : ak > bk ? 1 : a.key < b.key ? -1 : a.key > b.key ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
};

ODocs.prototype.backgroundLoadWeb = function(aID) {
  if (this.offline || this.arrayurls.length == 0) return;
  var parent = this;
  plugin("Threads");
  var t = new Threads();
  t.addThread(function(uuid) { try { parent.loadWeb(aID); } finally { t.stop(true); } });
  t.startNoWait();
}

/**
 * <odoc>
 * <key>ODocs.get(aID, aKey) : Map</key>
 * Returns the raw entry for a subject and key, loading missing subjects lazily and retaining cached entries.
 * Returns undefined if the entry cannot be found. Offline mode prevents web fallback.
 * </odoc>
 */
ODocs.prototype.get = function(aID, aKey) {
  if (isUnDef(this.aodocs[aID])) {
    try {
      this.load(aID, this.filesIds[aID]);
      if (!this.offline && isDef(this.aodocs[aID])) this.backgroundLoadWeb(aID);
    } catch(e) {
      // A missing or invalid local archive can fall back below when online.
    }
    if (isUnDef(this.aodocs[aID]) && !this.offline) this.loadWeb(aID);
  }
  return isDef(this.aodocs[aID]) ? this.aodocs[aID].get(aKey) : undefined;
}

/**
 * <odoc>
 * <key>ODocs.getODoc(aID) : ODoc</key>
 * Returns a currently loaded subject without loading it. Returns undefined if the subject is not cached.
 * </odoc>
 */
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
 * <key>ODocsGen.genODoc(aFileName) : ODoc</key>
 * Generates a ODoc map where each key will be the identified odoc key and the value a map where
 * k will represent the original key and t the associated text.
 * </odoc>
 */
ODocsGen.prototype.genODoc = function(aFilename) {
  var source = io.readFileString(aFilename).replace(/\r/g, "");
  var blocks = source.match(/<odoc(?:\s+[^>]*?)?>[\s\S]*?<\/odoc>/gi) || [];
  var odoc = new ODoc();
  blocks.forEach(function(block, index) {
    var markdown = /^<odoc\s+format\s*=\s*["'](?:markdown|md)["']\s*>/i.test(block);
    var oldWhitespace = XML.ignoreWhitespace;
    try {
      if (markdown) {
        block = block.replace(/^[ \t]*\*(?: |(?=$))/mg, "");
        XML.ignoreWhitespace = false;
      } else {
        block = block.replace(/\\\n/mg, "%%br%%").replace(/([\n|%%br%%])[ |\t]+\*+[ |\t]/mg, "$1").replace(/\n+/mg, " ");
      }
      var xml = new XMLList(block);
      var key = String(xml.key).replace(/%%br%%/g, "").trim();
      var text = String(xml.text());
      if (markdown) {
        // Rhino's text() omits CDATA nodes; children() includes them as text.
        text = "";
        var children = xml.children();
        for (var i = 0; i < children.length(); i++) {
          if (children[i].nodeKind() == "text") text += String(children[i]);
        }
        text = text.replace(/^(?:[ \t]*\n)+/, "").replace(/(?:\n[ \t]*)+$/, "");
      } else text = text.replace(/%%br%%/g, "\n");
      odoc.add(key.replace(/[({\[:].*$/, "").trim(), key, text, markdown ? "markdown" : undefined);
    } catch(e) {
      throw new Error("Invalid odoc in " + aFilename + " (entry " + (index + 1) + "): " + e);
    } finally {
      XML.ignoreWhitespace = oldWhitespace;
    }
  });
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
	var ret = {}
	for(var i in this.odoc) {
		ret[i] = this.odoc[i].getAll()
	}
	return ret
}

/**
 * <odoc>
 * <key>ODocsGen.getODocKeys() : Map</key>
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

