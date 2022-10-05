// OPack
//

// ****
// DATA
// ****

// Verbs to be used
var verbs = {
	"info": {
		"help"        : "Provides information about the current package.",
		"optionshelp" : [ "If no option is provided will look for the package in the current directory.",
		                  "If an URL is provided will look for the package in the repository.",
		                  "Else it will try to access the directory specified." ]
	},
	"search": {
		"help"        : "Searches for a keyword on the repository.",
		"optionshelp" : [ "Searches the keyword passed as an option." ]
	},
	"install": {
		"help"        : "Install a package",
		"optionshelp" : [ "Provide the path or URL to the package directory or opack file.",
		                  "'-d'       : Installation directory for package.",
		                  "'-force'   : Force installation",
		                  "'-repo'    : Use an alternatively repository for dependencies",
		                  "'-deps'    : Automatically try to install dependencies",
		                  "'-useunzip': Alternatively use unzip to save memory",
						  "'-noverify': Don't run hash verification on the end",
						  "'-cred'    : Provide authentication credentials (e.g. user:pass)",
		                  "'-arg'     : Pass an argument to the pre/post install scripts"]
	},
	"erase": {
		"help"        : "Deletes a package",
		"optionshelp" : [ "Deletes a package on the path specified",
		                  "(only files declared on the package.json will be deleted)",
		                  "'-force': Force operation even with package dependencies",
		                  "'-arg'  : Pass an argument to the pre/post erase scripts"]
	},
	"update": {
		"help"		  : "Updates a package",
		"optionshelp" : [ "The install/erase verbs options are valid also for update.",
				"'-all'       : Tries to update all packages locally installed",
				"'-cred'      : Provide authentication credentials (e.g. user:pass)",
				"'-noerase'   : When updating don't delete the package first",
			  "'-erasefolder: Erase previous version folder while updating to a new version"]
	},
	"exec": {
		"help"		  : "Executes code from an installed package",
		"optionshelp" : [ "Loads the main script of a local installed package." ]
	},
	"list": {
		"help"        : "List installed packages",
		"optionshelp" : []
	},
	"pack": {
		"help"        : "Generates a opack file from a packaging directory",
		"optionshelp" : ""
	},
	"genpack": {
		"help"        : "Generates a package.json for packaging.",
		"optionshelp" : ""
	},
	"add2db": {
		"help"        : "Add an already installed package to the local OpenPack database",
		"optionshelp" : []
 	},
 	"remove4db": {
 		"help"        : "Remove a package entry from the local OpenPack database",
 		"optionshelp" : []
	},
	"script": {
		"help"        : "Creates a shell script, on the current path, to execute a opack (--script)"
	},
	"daemon": {
		"help"        : "Creates a shell script, on the current path, to execute an opack as a daemon (--daemon)"
	},
	"ojob"  : {
		"help"        : "Creates a shell script, on the current path, to execute an opack as a ojob (--ojob)"
	},	 
 	"add2remotedb": {},
	"remove2remotedb": {},
	"help" : {}
};

plugin("ZIP");
plugin("HTTP");
ow.loadFormat();
ow.loadObj();

var localDB;
var remoteDB;
var zipCache = {};
var outputPath;
var verb;
var arg;
var __remoteUser;
var __remotePass;
var __remoteHTTP;

// *********
// FUNCTIONS
// *********

// ----------------------------------------------------------
// HELP
// ----------------------------------------------------------

// Provide a help screen
function showHelp() {
	print("Usage: opack [verb] [package/path] [options]\n");

	var maxVerb = 0;
	for (let i in verbs) {
		if (i.length > maxVerb) maxVerb = i.length;
	}

    print("Verbs:\n");
	for(let i in verbs) {
		var verb = verbs[i];

		if (!isUnDef(verb["help"])) {
			print("   " + i + repeat(maxVerb - i.length + 1, ' ') + " - " + verb.help );
			for(let j in verb.optionshelp) {
				print(repeat(maxVerb, ' ') + "          " + verb.optionshelp[j]);
			}
		}
	}

	print("");
	print("(version " + af.getVersion() + ", " + Packages.openaf.AFCmdBase.LICENSE +")");
}

// Retrieve OPack file using HTTP
function getHTTPOPack(aURL) {
	if (!isUnDef(zipCache[aURL])) {
		return zipCache[aURL];
	}

	log("Retrieving " + aURL);
	try {
		var http = execHTTPWithCred(aURL.replace(/ /g, "%20"), "GET", "", {}, true);
		var opack = new ZIP(http);
		zipCache[aURL] = opack;
		return opack;
	} catch(e) {
		logErr("Can't retrieve " + aURL + " (" + e.message + ")");
		return;
	}
}

// ----------------------------------------------------------
// OPENPACK REMOTE DB
// ----------------------------------------------------------

// OpenPack get packages
function getRemoteDB() {
	if (!isUnDef(remoteDB)) return remoteDB;

	remoteDB = getOPackRemoteDB();

	return remoteDB;
}

// Add a package to a remote DB
function addRemoteDB(aPackage, aDB) {
  var packages = {};

  plugin("ZIP");

  var zip = new ZIP();
  try {
  	//zip.loadFile(aDB);

  	packages = fromJsonYaml(af.fromBytes2String(zip.streamGetFile(aDB, OPACKCENTRALJSON)));
  } catch(e) {
  }

  delete aPackage["__filelocation"];
  delete aPackage["filesHash"];
  packages[aPackage.name] = aPackage;

  try {
  	zip.streamPutFile(aDB, OPACKCENTRALJSON, af.fromString2Bytes(stringify(packages)));
  } catch(e) {
  	logErr(e.message);
  }
}

// Delete a package from a remote DB
function removeRemoteDB(aPackage, aDB) {
  var packages = {};

  plugin("ZIP");

  var zip = new ZIP();
  try {
  	//zip.loadFile(aDB);

  	packages = fromJsonYaml(af.fromBytes2String(zip.streamGetFile(aDB, OPACKCENTRALJSON)));
  } catch(e) {
  }

  delete packages[aPackage];

  try {
  	zip.streamPutFile(aDB, OPACKCENTRALJSON, af.fromString2Bytes(stringify(packages)));
	//io.writeFileBytes(aDB, zip.generate({"compressionLevel":9}));
  } catch(e) {
  	logErr(e.message);
  }
  //zip.close();
}

// ----------------------------------------------------------
// OPENPACK LOCAL DB
// ----------------------------------------------------------

// OpenPack local register add
function addLocalDB(aPackage, aTarget) {
	var fileDB = getOpenAFPath() + "/" + PACKAGESJSON_DB;
	var homeDB = __gHDir() + "/" + PACKAGESJSON_USERDB;
	var homeDBCheck = io.fileExists(homeDB);
	var fileDBCheck = io.fileExists(fileDB);
	var includeInFileDB = true;

	try {
		if (fileDBCheck && io.fileInfo(fileDB).permissions.indexOf("w") < 0) {
			includeInFileDB = false;
			//if (homeDBCheck) {
				logWarn("'" + fileDB + "' is not accessible. Reverting to per-user oPack db.");
			//} else {
			//	throw fileDB + " is not accessible. Please check permissions.";
			//}
		}
		if (homeDBCheck && io.fileInfo(homeDB).permissions.indexOf("w") < 0) {
			throw homeDB + " is not accessible. Please check permissions.";
		}
	} catch(e) {
		if (!(e.message.match(/NoSuchFileException/))) {
			throw e;
		}
	}

	try {
		var fi = String(java.io.File(aTarget).getCanonicalPath())
		aTarget = fi.replace(/\/$/, "")
		var cop = getOpenAFPath().replace(/\/$/, "")
		//aTarget = String((new java.io.File(aTarget)).getCanonicalPath())
		if (aTarget.length > cop.length &&
		    aTarget.substring(0, cop.length) == cop) {
			aTarget = "$DIR" + aTarget.substring(cop.length)
		}
	} catch(e) {
		logErr(e.message);
	}

	var packages = {};
	var zip = new ZIP();

	try {
		packages = fromJsonYaml(af.fromBytes2String(zip.streamGetFile(fileDB, PACKAGESJSON)));
	} catch(e) {
		if (!(e.message.match(/FileNotFoundException/))) logErr(e.message);
	}
	if (homeDBCheck) {
		try {
			var p = fromJsonYaml(af.fromBytes2String(zip.streamGetFile(homeDB, PACKAGESJSON)))
			for (var pi in p) {
				if (pi.startsWith("$DIR")) delete p[pi]
			}
			packages = merge(p, packages)
		} catch(e) {
			if (!(e.message.match(/FileNotFoundException/))) logErr(e.message);
		}
	}

	// No OpenAF on packages from files
	for(var pi in packages) { if (packages[pi].name == "OpenAF") delete packages[pi] }

	if (!isUnDef(packages)) {
		packages[aTarget] = aPackage;
	} else {
		packages = {};
		packages[aTarget] = aPackage;
	}

	try {
		if (includeInFileDB)
			zip.streamPutFile(fileDB, PACKAGESJSON, af.fromString2Bytes(stringify(packages)));
		else {
			// No OpenAF on homeDB
			for(var pi in packages) { 
				if (packages[pi].name == "OpenAF") delete packages[pi] 
				if (pi.startsWith("$DIR")) delete packages[pi]
			}
			zip.streamPutFile(homeDB, PACKAGESJSON, af.fromString2Bytes(stringify(packages)));
		}
	} catch (e) {
		logErr(e.message);
		return;
	}
	//zip.close();

	if (aPackage.name.toUpperCase() != 'OPENAF')
		log("Package " + aPackage.name + " added to local OpenPack DB");
}

// OpenPack local register get version
function getPackVersion(packageName, packag) {
	if (packageName.toUpperCase() == "OPENAF") return getVersion();
	
	//var packages = getLocalDB(true);
	if (isUnDef(packag)) {
		var packageFound = findLocalDBByName(packageName);

		if (!isUnDef(packageFound)) {
			return packageFound.version;
		} else {
			return;
		}
	} else {
		return packag.version;
	}
}

// OpenPack get packages
function getLocalDB(shouldRefresh) {
	if (shouldRefresh == false)
		if (!isUnDef(localDB)) return localDB;

	localDB = getOPackLocalDB();
	if (compare(localDB, {})) checkOpenAFinDB();

	return localDB;
}

// OpenPack find a package by target
function findLocalDBByTarget(aTarget) {
	var packages = getLocalDB();
	return packages[aTarget];
}

// OpenPack find a package by name
function findLocalDBByName(aName) {
	var packages = getLocalDB();

	if(isUnDef(aName) || aName.length <= 0) return;
	var res;

	for(var target in packages) {
		var packag = packages[target];
		if (packag.name.toUpperCase() == aName.toUpperCase() ||
		    ow.format.string.separatorsToUnix(target) == ow.format.string.separatorsToUnix(aName)) {
			if (isDef(res)) {
				if (ow.format.string.separatorsToUnix(target) == ow.format.string.separatorsToUnix(aName)) res = packag;
			} else {
				res = packag;
			}

			res.__target = target
		}
	}

	return res;
}

// OpenPack find a package target by name
function findLocalDBTargetByName(aName) {
	var packages = getLocalDB();

	if(isUnDef(aName) || aName.length <= 0) return;
	var res;

	for(var target in packages) {
		var packag = packages[target];
		if (packag.name.toUpperCase() == aName.toUpperCase())  {
			res = target;
		}
	}

	return res;
}

// dependencies
function verifyDeps(packag) {
	//var packages = getOPackLocalDB();
	var results = {};

	if (isMap(packag.dependencies)) {
		for(let dep in packag.dependencies) {
			var version = packag.dependencies[dep];
	
			var compareTo = findLocalDBByName(dep);
			results[dep] = false;
			if (!isUnDef(compareTo)) {
				if (compareTo.version == version)                          							{ results[dep] = true; continue; }
				if (version.match(/^\>\=/) && compareTo.version >= version.replace(/^\>\=/, ""))  	{ results[dep] = true; continue; }
				if (version.match(/^\<\=/) && compareTo.version <= version.replace(/^\<\=/, ""))  	{ results[dep] = true; continue; }
				if (version.match(/^\<(?=[^=])/) && compareTo.version < version.replace(/^\</, "")) { results[dep] = true; continue; }
				if (version.match(/^\>(?=[^=])/) && compareTo.version > version.replace(/^\>/, "")) { results[dep] = true; continue; }
			}
		}
	}

	return results;
}

// OpenPack local register remove
function removeLocalDB(aPackage, aTarget) {
	var fileDB = getOpenAFPath() + "/" + PACKAGESJSON_DB;
	var homeDB = __gHDir() + "/" + PACKAGESJSON_USERDB;
	var homeDBCheck = io.fileExists(homeDB);
	var includeInFileDB = true;

	if (isMap(aPackage) && isDef(aPackage.name) && aPackage.name == "OpenAF") return

	if (io.fileInfo(fileDB).permissions.indexOf("w") < 0) {
		if (homeDBCheck) {
			if (io.fileInfo(homeDB).permissions.indexOf("w") < 0) {
				throw "Can't access '" + fileDB + "' neither '" + homeDB + "'.";
			}		
			includeInFileDB = false;
		} else {
			throw fileDB + " is not accessible. Please check permissions.";
		}
	}

	var fi = String(java.io.File(aTarget).getCanonicalPath())
	aTarget = fi.replace(/\/$/, "")
	var cop = getOpenAFPath().replace(/\/$/, "")
	//aTarget = String((new java.io.File(aTarget)).getCanonicalPath())
	if (aTarget.length > cop.length &&
		aTarget.substring(0, cop.length) == cop) {
		aTarget = "$DIR" + aTarget.substring(cop.length)
	}
	var packages = {}, packagesLocal = {};
	var zip = new ZIP();
	try {
		if (includeInFileDB) {
			packages = fromJsonYaml(af.fromBytes2String(zip.streamGetFile(fileDB, PACKAGESJSON)))
			// No OpenAF on db
			for(var pi in packages) { if (packages[pi].name == "OpenAF") delete packages[pi] }
		}
		if (homeDBCheck) {
			packagesLocal = fromJsonYaml(af.fromBytes2String(zip.streamGetFile(homeDB, PACKAGESJSON)))
			// No OpenAF on homeDB
			for(var pi in packagesLocal) { 
				if (packagesLocal[pi].name == "OpenAF") delete packagesLocal[pi] 
				if (pi.startsWith("$DIR")) delete packagesLocal[pi]
			}
		}
	} catch(e) {
		logErr(e.message);
	}

	if (isDef(packages) || isDef(packagesLocal)) {
		var removed = false;
		if (includeInFileDB) {
			try {
				if (isDef(packages) && isDef(packages[aTarget])) {
					delete packages[aTarget];
					removed = true;
				}
				if (removed) zip.streamPutFile(fileDB, PACKAGESJSON, af.fromString2Bytes(stringify(packages)));
			} catch (e) {
				logErr(e.message);
				return;
			}
		} 
		if (homeDBCheck) {
			try {
				if (isDef(packagesLocal) && isDef(packagesLocal[aTarget])) {
					delete packagesLocal[aTarget];
					removed = true;
				}
				for (var pi in packagesLocal) {
					if (packagesLocal[pi].name == "OpenAF") delete packagesLocal[pi]
					if (pi.startsWith("$DIR")) delete packagesLocal[pi]
				}
				
				if (removed) zip.streamPutFile(homeDB, PACKAGESJSON, af.fromString2Bytes(stringify(packagesLocal)));
			} catch (e) {
				logErr(e.message);
				return;
			}
		}

		if (!removed) 
			logWarn("Package can't be removed from oPack database.");
		else
			log("Package " + aPackage.name + " removed from local OpenPack DB");
	}
	//zip.close();	
}

// Check OpenAF in local DB
function checkOpenAFinDB() {
	// deprecated
	/*var packag = getPackage("OpenAF")

	if (isUnDef(packag) || isUnDef(packag.name)) return;

	addLocalDB(packag, "OpenAF");*/
}

// ----------------------------------------------------------
// FILESYSTEM UTILITIES
// ----------------------------------------------------------

// Read local files recursively
function listFiles(startPath, relPath, excludingList) {
	var files = [];
	if (isUnDef(excludingList)) excludingList = [];

	if (isUnDef(relPath)) relPath = "";
	startPath = startPath.replace(/\\+/g, "/");
	relPath = relPath.replace(/\\+/g, "/");

	var list = io.listFiles(startPath + "/" + relPath);
	for(let i in list.files) {
		var file = list.files[i];
		if (excludingList.indexOf(file.filename) >= 0) continue;

		if(file.isFile) {
			files.push(relPath + file.filename.replace(/\\+/g, "/"));
		} else {
			//files.push(relPath + file.filename);
			files = files.concat(listFiles(startPath, file.filepath.replace(/\\/g, "/").replace(new RegExp(startPath + "[\\\\/]*", ""), "") + "/"));
		}
	}

	return files;
}

function generateHash(aObject) {
	var res = "";

	if (isString(aObject)) {
		if (io.isBinaryFile(aObject)) {
			var rfs = io.readFileStream(aObject);
			res = String(sha1(rfs));
			rfs.close();
		} else {	
			var rfs = io.readFileStream(aObject);
			var digest = Packages.org.apache.commons.codec.digest.DigestUtils.getDigest(Packages.org.apache.commons.codec.digest.MessageDigestAlgorithms.SHA_1);
			ioStreamReadBytes(rfs, (bs) => {
				var nbs = [];
				for(var ibs in bs) {
					if (bs[ibs] != 13) nbs.push(bs[ibs]);
				}
				digest.update(nbs);
			});
			res = String(Packages.org.apache.commons.codec.binary.Hex.encodeHexString(digest.digest()));
		}		
	}

	if (isByteArray(aObject)) {
		if (isBinaryArray(aObject)) {
			return sha1(aObject);
		} else {
			var nbs = [];
			for(var ibs in aObject) {
				if (aObject[ibs] != 13) nbs.push(aObject[ibs]);
			}
			return sha1(nbs);
		}
	}

	if (res == "") throw "Object type for generateHash couldn't be determined.";

	return res;
}

// Read local files an generate hash
function listFilesWithHash(startPath, excludingList) {
	var filesHash = {};

	var files = listFiles(startPath, undefined, excludingList);
    var c = 0, cmax = 0;
	
	for (let i in files) {
		c++;
		try {
			var str = "Checking (" + ow.format.round((c * 100) / files.length) + "%) " + ow.format.addNumberSeparator(c) + " files\r";
			lognl(str);
			if (str.length > cmax) cmax = str.length;
			if (!(files[i].match(new RegExp(PACKAGEJSON + "$", ""))) && !(files[i].match(new RegExp(PACKAGEYAML + "$", "")))) {
				filesHash[files[i]] = generateHash(startPath + "/" + files[i]);
			}
		} catch (e) {
		}
	}
	if (c > 0) {
		lognl(repeat(cmax, " ") + "\r");
		log("All files checked.");
	}

	return filesHash;
}

// Verify a list of hash
function verifyHashList(startPath, filesHash) {
	var results = {};
	var location = "local";
	var http;
	var zip = new ZIP();

	if (startPath.match(/^http/)) {
		location = "http";
	}

	if (startPath.match(/\.(opack)|(jar)$/)) {
		if (location == "http") {
			location = "opackhttp";
			http = execHTTPWithCred(startPath.replace(/ /g, "%20"), "GET", "", {}, true);
			zip = new ZIP(http);
		} else {
			location = "opack";
			zip = new ZIP();
			//zip.loadFile(startPath);
		}
	}

	if (location == "http") {
	    http = execHTTPWithCred(startPath.replace(/ /g, "%20") + "/" + file.replace(/ /g, "%20"));
	}
	
	var c = 0;
	for(let file in filesHash) {
		c++;
		
		printnl("Verifying (" + ow.format.round((c * 100) / Object.keys(filesHash).length) + "%) " + ow.format.addNumberSeparator(c) + " files\r");
		results[file] = false;
		var hash;

		switch(location) {
		case "local": 
			hash = generateHash(startPath + "/" + file);
			break;
		case "http":
			hash = generateHash(http);
			break;
		case "opack":
			if (location == "opack") 
				hash = generateHash(zip.streamGetFile(file));
			else
				hash = generateHash(zip.getFile(file));
			break;
		case "opackhttp":
			if (location == "opackhttp")
				hash = generateHash(zip.streamGetFile(file));
			else
				hash = generateHash(zip.getFile(file));
			break;
		}

		//if (location == 'local') ;
		if (hash == filesHash[file])
			results[file] = true;
	}
	if (c > 0) print("");

	zip.close();

	return results;
}

// Copy files from source to target
function copyFile(source, target) {
	mkdir(target.replace(/\/[^\/]+$/, "\/"));
	try {
		java.nio.file.Files.copy(java.nio.file.Paths.get(source), java.nio.file.Paths.get(target), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
	} catch(e) {
		if (!(e.message.match(/DirectoryNotEmptyException/))) throw e;
	}
}

// Delete files from target
function deleteFile(target) {
	return io.rm(target);
}

// Make directory
function mkdir(aNewDirectory) {
    return io.mkdir(aNewDirectory);
}

// Remove directory
function rmdir(aNewDirectory, shouldCheck) {
	if (shouldCheck && 
		io.fileExists(aNewDirectory) && 
		$from(io.listFiles(aNewDirectory).files)
		.equals("isFile", true)
		.any()) return;
	return io.rm(aNewDirectory);
}

// ----------------------------------------------------------
// SCRIPT UTILITIES
// ----------------------------------------------------------

// Get credentials
function execHTTPWithCred(aURL, aRequestType, aIn, aRequestMap, isBytes, aTimeout, returnStream) {
	//if (isUnDef(__remoteHTTP)) __remoteHTTP = new HTTP();
	if (isUnDef(__remoteHTTP)) __remoteHTTP = new ow.obj.http();
    var res;

	ow.loadNet()
	var path = ow.net.path4URL(aURL), host = ow.net.host4URL(aURL)
	path = path.substring(0, path.lastIndexOf("/"))

	try {
		res = __remoteHTTP.exec(aURL, aRequestType, aIn, aRequestMap, isBytes, aTimeout, returnStream);
		if (res.responseCode == 401) throw "code: 401";
	} catch(e) {
		if (String(e).indexOf("code: 401") >= 0) {
			// Ensure bucket default exists
			var si
			try {
				try { $sec(__, "opack").get("opack::") } catch(e1) { $sec(__, "opack").set("opack::", {}) }
				
				si = $sec(__, "opack").get("opack::" + host + "::" + path)
			} catch(ee) {
			}

			if (isMap(si) && (isUnDef(__remoteUser) || isUnDef(__remotePass))) { __remoteUser = Packages.openaf.AFCmdBase.afc.dIP(si.u); __remotePass = Packages.openaf.AFCmdBase.afc.dIP(si.p) }
			if (isDef(__remoteUser) && isDef(__remotePass)) __remoteHTTP.login(Packages.openaf.AFCmdBase.afc.dIP(__remoteUser), Packages.openaf.AFCmdBase.afc.dIP(__remotePass), aURL)

			if (isUnDef(__remoteUser) || isUnDef(__remotePass)) {
				__remoteUser = ask("Enter authentication user: ");
				__remotePass = ask("Enter authentication password: ", String.fromCharCode(0));
			}
			__remoteHTTP.login(Packages.openaf.AFCmdBase.afc.dIP(__remoteUser), Packages.openaf.AFCmdBase.afc.dIP(__remotePass), aURL);
			res = __remoteHTTP.exec(aURL, aRequestType, aIn, aRequestMap, isBytes, aTimeout, returnStream);
			if (res.responseCode == 200) {
				try {
					$sec(__, "opack").set("opack::" + host + "::" + path, {
						u: __remoteUser,
						p: __remotePass
					})
				} catch(e2) {}
			}
		} else {
			throw e;
		}
	}

	if (returnStream) {
		return res;
	} else {
		return res.responseBytes;
	}
}

// Find OpenAF she-bang
function getOpenAFSB() {
	var os = String(java.lang.System.getProperty("os.name"));
	var currentClassPath = getOpenAFJar();
  //var currentClassPath = java.lang.management.ManagementFactory.getRuntimeMXBean().getClassPath() + "";

  var openafsb;
  if (os.match(/Windows/)) {
  	openafsb = currentClassPath.replace(/openaf\.jar/, "openaf.bat");
  } else {
  	openafsb = currentClassPath.replace(/openaf\.jar/, "openaf-sb");
  }

  try {
    io.readFileString(openafsb);
  } catch (e) {
    logErr("Can't access " + openafsb);
    return null;
  }

  if (os.match(/Windows/)) {
  	return openafsb + " -s -i script -f ";
  } else {
  	return openafsb;
  }
}

// Find OpenAF jar
/*function getOpenAFJar() {
  return String(ow.format.getClasspath());
}*/

// Find OpenAF
function getOpenAF() {
	var os = ow.format.getOS();
  var currentClassPath = getOpenAFJar();

  var openaf;
  if (os.match(/Windows/)) {
  	openaf = currentClassPath.replace(/openaf\.jar/, "openaf.bat");
  } else {
  	openaf = currentClassPath.replace(/openaf\.jar/, "openaf");
  }

  try {
    io.readFileString(openaf);
  } catch (e) {
    logErr("Can't access " + openaf);
    return null;
  }

  if (os.match(/Windows/)) {
  	return openaf + " -s -i script -f ";
  } else {
  	return openaf;
  }
}

// Fix she-bang
function fixSheBang(aFile) {
    var fileArray = io.readFileAsArray(aFile);
   	if (fileArray[0].match(/^\#\!/)) {
    	fileArray[0] = "#!/usr/bin/env " + getOpenAFSB();
   	}
   	io.writeFileAsArray(aFile, fileArray);

   	// Fix execution permissions also
	try {
		af.sh("chmod u+rx " + aFile);
	} catch (e) {}
}

// Run a script
function runScript(aScript) {
	try {
		var s = newFn(aScript);
		s();
	} catch(e) {
		logErr(e);
	}
}

// Find case insensitive
function findCaseInsensitive(aObject, aKey) {
	for(i in aObject) {
		if (i.toUpperCase() == aKey.toUpperCase())
			return aObject[i];
	}

	return undefined;
}

function fromJsonYaml(aString) {
	try {
		return af.fromJson(aString);
	} catch(e) {
		return af.fromYAML(aString);
	}
}

// ----------------------------------------------------------
// VERB FUNCTIONS
// ----------------------------------------------------------


function getPackage(packPath) {
	var packag = {};

	if (isUnDef(packPath)) return packag;

	// determine if HTTP or local
	if (packPath.match(/^http/i)) {
		if (packPath.match(/\.(opack)|(jar)$/i)) {
			// Remote OPack
			var opack = getHTTPOPack(packPath);
			if (isUnDef(opack)) return;

			// There should be no \n usually associated with package.json scripts
			try {
				packag = fromJsonYaml(af.fromBytes2String(opack.getFile(PACKAGEJSON)).replace(/\n/g, "") + "");
			} catch(e) {
				packag = fromJsonYaml(af.fromBytes2String(opack.getFile(PACKAGEYAML)) + "");
			}
			if (isUnDef(packag.files)) {
				packag.files = [];
				var listOfFiles = opack.list();
				for(let i in listOfFiles) {
					packag.files.push(i);
				}
			}
			packag.__filelocation = "opackurl";
		} else {
			// URL identified
			try {
				var http, output;
				try {
					http = execHTTPWithCred(packPath.replace(/ /g, "%20") + "/" + PACKAGEJSON, "GET", "", {}, true);
					// There should be no \n usually associated with package.json scripts
					output = af.fromBytes2String(http).replace(/\n/g, "");
					retry = false;
				} catch(e) {
					try {
						http = execHTTPWithCred(packPath.replace(/ /g, "%20") + "/" + PACKAGEYAML, "GET", "", {}, true);
						output = af.fromBytes2String(http);
						retry = false;
					} catch(e1) {
						logErr("Error while retrieving remote package: " + String(e1));
					}
				}
				packag = fromJsonYaml(output);
				if (isUnDef(packag)) throw(packPath + "/" + PACKAGESJSON);
				packag.__filelocation = "url";
			} catch(e) {
				logErr("Didn't find a package on '" + packPath + "' (" + e.message + ")");
				return;					
			}
 		}
	} else {
		if (packPath.match(/\.(opack)|(jar)$/i)) {
			// Local OPack
			try {
				var opack = new ZIP();
				//opack.loadFile(packPath);
				try {
					packag = fromJsonYaml(af.fromBytes2String(opack.streamGetFile(packPath, PACKAGEJSON)) + "");
				} catch(e) {
					packag = fromJsonYaml(af.fromBytes2String(opack.streamGetFile(packPath, PACKAGEYAML)) + "");
				}
				if (isUnDef(packag.files)) {
					packag.files = [];
					var listOfFiles = opack.list();
					for(let i in listOfFiles) {
						packag.files.push(i);
					}
				}
				packag.__filelocation = "opacklocal";
				//opack.close();
			} catch(e) {
				printErr(e.message);
				return;
			}
		} else {
			// File identified
			try {
				try {
					packag = io.readFileJSON(packPath + "/" + PACKAGEJSON);
				} catch(e) {
					packag = io.readFileYAML(packPath + "/" + PACKAGEYAML);
				}
				packag.__filelocation = "local";
				packag.__target = String((new java.io.File(packPath)).getCanonicalPath());

				if (isUnDef(packag.files)) {
					packag.files = listFiles(packPath);
				}
			} catch(e) {
				return packag;
			}
		}
	}

	return packag;
}

// INFO
function __opack_info(args) {
	if(isUnDef(args[0]) || args[0] == "") return;

	var packag = getPackage(args[0]);
	var remote = false;

	if (isUnDef(packag) || isUnDef(packag["name"])) {
		packag = findLocalDBByName(args[0]);

		if (isUnDef(packag) || isUnDef(packag["name"])) {
			var packs = getRemoteDB();
			var packFound = findCaseInsensitive(packs, args[0]);
			if (isUnDef(packFound)) {
				logErr("No entry for '" + args[0] + "' on remote OPack database.");
				logErr("Package not found.");
				return;
			} else {
				packag = getPackage(packFound.repository.url);
				if (isUnDef(packag) && !(isUnDef(packFound.repository.backupurl))) {
					packag = getPackage(packFound.repository.backupurl)
				}
				args[0] = packag.repository.url;
				packag.__filelocation = "remote";
				//remote = true;
			}
		} else {
			args[0] = findLocalDBTargetByName(args[0]);
			packag.__filelocation = "local";
		}
	} else {
		packag.__filelocation = "local";
	}

	if (packag.__filelocation.match(/local$/)) remote = false; else remote = true;

	var iinfo = {};
	iinfo = {
		"Installed in": args[0],
		"Name"        : packag.name,
		"Version"     : packag.version,
		"Description" : packag.description,
		"Author"      : packag.author,
		"Repository"  : "[" + packag.repository.type + "] " + packag.repository.url,
	};
	print( printMap(iinfo) );

	var depsResults, ideps = [];
	if(!remote) depsResults = verifyDeps(packag);

	if (isMap(packag.dependencies)) {
		for(let i in packag.dependencies) {
			var depend = packag.dependencies[i];
	
			if (!remote) {
				ideps.push({ package: i, status: ((depsResults[i]) ? "OK" : "FAILED DEPENDENCY") });
			} else {
				ideps.push({ package: i });
			}
		}
	}

	print(ansiColor("bold", "Depends on:") + "\n");
	print( printTable(ideps) );

	var hashResults, iFiles = [];
	if(!remote) hashResults = verifyHashList(args[0], packag.filesHash);
	//print(ansiColor("bold", "FILES       :") + "\n");
	for(let i in packag.files) {
		var file = packag.files[i];
		var canGo = true;

		if (file == PACKAGEJSON || file == PACKAGEYAML) canGo = false;
		if (isUnDef(file) || file == null) canGo = false;

		if (canGo) {
			if (!remote) {
				var status;
				if (isUnDef(hashResults[file])) {
					status = "not installed";
				} else {
					status = (hashResults[file]) ? "OK" : "CHANGED!";
				}
				
				iFiles.push({ file: file.replace(new RegExp("^" + args[0].replace(/\./g, "\\."), "") + "/", "").replace(/^\/*/, ""), status: status });
				//print("\t" + file.replace(new RegExp("^" + args[0].replace(/\./g, "\\."), "") + "/", "").replace(/^\/*/, "") + " [" + status + "]");
			} else {
				iFiles.push({ file: file.replace(new RegExp("^" + args[0].replace(/\./g, "\\."), "") + "/", "").replace(/^\/*/, "") });
				//print("\t" + file.replace(new RegExp("^" + args[0].replace(/\./g, "\\."), "") + "/", "").replace(/^\/*/, ""));
			}
		}
	}

	ansiStart(); print( "\n" + ansiColor("bold", "Files:") + "\n"); ansiStop();
	print( printTable(iFiles) );
}

// LIST
function __opack_list(args) {
	var packages = getLocalDB(true);

	var usea = __conStatus || __initializeCon(); 

	//var packsIds = Object.keys(sortIds).sort(), ar = [];
	var ar = [];
	var packsIds = $from(packages)
	               .attach("iname", r => r.name.toLowerCase())
				   .attach("key", r => ow.format.string.separatorsToUnix(r._key))
				   .sort("iname")
				   .distinct("_key")

	for (var packageId in packsIds) {
		//packag = packages[packsIds[packageId]];
		var packag = packsIds[packageId];
		if (packag == 'OpenPackDB') continue;
		if (packages[packag].key == 'OpenAF') continue;
		if (!usea) {
			ansiStart();
			print(ansiColor("bold", "[" + packages[packag].name + "]") + " (version " + ansiColor("green", packages[packag].version) + "):" + " " + ansiColor("cyan", packages[packag].key.replace(new RegExp("^" + getOpenAFPath()), "(openaf)/")) + "");
			ansiStop();
		} else {
			ar.push({
				name   : packages[packag].name,
				version: packages[packag].version,
				path   : packages[packag].key.replace(new RegExp("^" + getOpenAFPath()), "[openaf]/")
			});
		}
	}
	if (ar.length > 0) print( printTable(ar) );
	
}

// Check version given package and force parameters
function checkVersion(packag, force) {
	var installedVersion = getPackVersion(packag.name);

	if (installedVersion > packag.version && !force) {
		log("Installed version is newer " + installedVersion);
		return 0;
	} else {
		if (installedVersion == packag.version && !force) {
			log(packag.name + ", version " + installedVersion + ", already installed in '" + findLocalDBTargetByName(packag.name) + "'.");
			return 0;
		} else {
			return 1;
		}
	}
}

// INSTALL
function install(args) {
	if (isUnDef(args[0]) || args[0].length <= 0)
		return;

	if (!isUnDef(args[0]) && args[0].toUpperCase() == 'OPENAF') {
		logErr("Can't install OpenAF. Please install manually or using another package manager (e.g. RPM). To update execute 'openaf --update'.");
		return;
	}

    checkOpenAFinDB();

    // Find other options
    var foundOutput = false;
    var force = false;
    var foundRepo = false;
	  var foundArg = false;
	  var foundCred = false;
    var justCopy = false;
    var useunzip = false;
    var nohash = false;
    var deps = false;
    var forceOutput = false;
    var output;

    for(let i in args) {
    	if (foundOutput) {
    		output = args[i];
    		foundOutput = false;
    		forceOutput = true;
    	}

    	if (foundRepo) {
    		if (__opackCentral.indexOf(args[i]) < 0) __opackCentral.unshift(args[i]);
    		foundRepo = false;
    	}

    	if (foundArg) {
    		arg = args[i];
    		foundArg = false;
		}
		
		if (foundCred) {
			var cred = args[i];
			if (cred.indexOf(":") > 0) [__remoteUser, __remotePass] = cred.split(/:/);
			foundCred = false;
		}

    	if (args[i] == "-d") foundOutput = true;
    	if (args[i] == "-force") force = true;
    	if (args[i] == "-repo") foundRepo = true;
    	if (args[i] == "-deps") deps = true;
    	if (args[i] == "-arg") foundArg = true;
    	if (args[i] == "-justcopy") justCopy = true;
    	if (args[i] == "-noverify") nohash = true;
		if (args[i] == "-useunzip") useunzip = true;
		if (args[i] == "-cred") foundCred = true;
    }
	var packag = getPackage(args[0]);

	if (isUnDef(packag.name) && packag.__filelocation != "opackurl") {
		//logErr("Couldn't find package on location " + args[0]);

		log("Checking remote OPack database");
		var packs = getRemoteDB();
		var packFound = findCaseInsensitive(packs, args[0]);
		if (isUnDef(packFound)) {
			logErr("No entry for '" + args[0] + "' on remote OPack database.");
			return;
		} else {
			packag = getPackage(packFound.repository.url);
			//if (!forceOutput) output = getOpenAFPath() + "/" + packag.name;
			args[0] = packag.repository.url;
		}
	}
	if (isUnDef(output) && !forceOutput) {
		if (io.fileInfo(getOpenAFPath()).permissions.indexOf("w") >= 0) {
			output = getOpenAFPath() + packag.name;
		} else {
			output = __gHDir() + "/.openaf-opack-" + packag.name; 
		}
	}
	log("Install folder: " + output);


	// Verify version
	if (checkVersion(packag, force) || justCopy) {
		log((justCopy ? "COPYING" : "INSTALLING") + " -- " + packag.name + " version " + packag.version);
	} else {
		log("No need to install/update " + args[0]);
		return;
	}

	// Verify deps
	var depsResults = verifyDeps(packag);
	if (!force && !justCopy && isMap(packag.dependencies))
		for(let i in packag.dependencies) {
			var depend = packag.dependencies[i];

			if (!(depsResults[i])) {
				logErr("Failed dependency on '" + i + "', version " + depend + ".");

				if (i.toUpperCase() == 'OPENAF') {
					logErr("Please update OpenAF (e.g. 'openaf --update')");
					return;
				}

				log("Checking remote OPack database");
				var packs = getRemoteDB();
				var packFound = findCaseInsensitive(packs, i);
				if (isUnDef(packFound)) {
					logErr("No entry for '" + i + "' on remote OPack database.");
					return;
				}

				if (!deps) {
					plugin("Console");
					try {
						var con = new Console();
						printnl("Do you want to try to install '" + i + "' [Y/N]: ");
						var res = con.readChar("YNyn"); print(res);
						if (res == 'N' || res == 'n') {
							return;
						}
					} catch(e) {
						return;
					}
				}

				var newArgs = args.slice(0);
				newArgs[0] = packs[i].repository.url;
				install(newArgs);

			}
		}

	outputPath = output;
    if (!isUnDef(packag.scripts.preinstall) && !justCopy) runScript(packag.scripts.preinstall);

	switch(packag.__filelocation) {
		case "url":
			log("Copying remote files...");
			//for(i in packag.files) {
			mkdir(outputPath);
			var pres = parallel4Array(packag.files, function(apackfile) {
				var message = "Copying " + apackfile + "...";
				log(message);
				
				try {
					var http = execHTTPWithCred(args[0].replace(/ /g, "%20") + "/" + apackfile.replace(/ /g, "%20"), "GET", "", {}, true, undefined, true);
					//io.writeFileBytes(outputPath + "/" + apackfile, http.responseBytes());
					ioStreamCopy(io.writeFileStream(outputPath + "/" + apackfile), http);
				} catch(e) {
					logErr("Can't copy remote file '" + apackfile + "' (" + e.message + ")");
					return 0;
				}
				return 1;
			});
			if (pres.length == packag.files.length) 
				log("All files copied.");
			else
				log("Not all files were copied (" + pres.length + "/" + packag.files.length + ")");
			break;
		case "opackurl":
			var opack = getHTTPOPack(args[0]);
			if(typeof opack == 'undefined') return;

			biggestMessage = 0;
			for(var i in packag.files) {
				var str = "Unpacking " + packag.files[i] + "...\r";
				if (str.length > biggestMessage) biggestMessage = str.length;
			}
			parallel4Array(packag.files, function(apackfile) {
				mkdir(outputPath);
				var message = "Unpacking " + apackfile + "...\r";
				lognl(message);

				try {
					io.writeFileBytes(outputPath + "/" + apackfile, opack.getFile(apackfile));
				} catch(e) {
					logErr("Can't write " + outputPath + "/" + apackfile + " (" + e.message + ")");
					return;
				}
				return 1;
			});
			lognl(repeat(biggestMessage, " ") + "\r");
			log("All files unpacked.");
		    break;
		case "local": {
			log("Copying files");
			biggestMessage = 0;
			outputPath = outputPath.replace(/\/{2,}/g, "/");
			//for(i in packag.files) {
			parallel4Array(packag.files, function(apackfile) {
				try {
					mkdir(outputPath);
					var message = "Copying " + apackfile.replace(new RegExp("^" + args[0].replace(/\./g, "\\."), "") + "/", "") + "...";
					log(message);
					copyFile(args[0] + "/" + apackfile, outputPath + "/" + apackfile.replace(new RegExp("^" + args[0].replace(/\./g, "\\."), "") + "/", ""));
				} catch(e) {
					logErr(e);
				}
				return 1;
			});
			log("All files copied.");
			break;
		}
		case "opacklocal": {
			log("Copying files");
			biggestMessage = 0;
			outputPath = outputPath.replace(/\/{2,}/g, "/");
			//for(i in packag.files) {
			parallel4Array(packag.files, function(apackfile) {
				mkdir(outputPath);
				var message = "Copying " + apackfile.replace(new RegExp("^" + args[0].replace(/\./g, "\\."), "") + "/", "") + "...";
				log(message);

				try {
					if (!useunzip) {
						var opack = new ZIP();
						ioStreamCopy(io.writeFileStream(outputPath + "/" + apackfile), opack.streamGetFileStream(args[0], apackfile));
						opack.close();
					} else {
						sh("unzip -o " + args[0] + " " + apackfile + " -d " + outputPath);
						if (__exitcode != 0) {
							throw "Unzip exit code " + __exitcode + " for " + apackfile;
						}
					}
				} catch(e) {
					logErr("Can't write " + outputPath + "/" + apackfile + " (" + e.message + ")");
					return;
				}
				return 1;
			});
			log("All files copied.");
			break;
		}
	}

	if (!nohash) {
	    log("Verifying package files installed...");
		var hashResults = verifyHashList(outputPath, packag.filesHash);
		for(let i in packag.files) {
			var file = packag.files[i];
			if (file == PACKAGEJSON || file == PACKAGEYAML) continue;
			if (!(hashResults[file])) {
				logErr("File '" + file + "' not equal to declared hash ('" + packag.filesHash[file] + "')");
				//return;
			}
		}
	}

	if (typeof packag.scripts.postinstall !== 'undefined' && !justCopy) runScript(packag.scripts.postinstall);

	log("Package " + packag.name + " installed.");
	delete packag["__filelocation"];
	if (!justCopy) addLocalDB(packag, outputPath);
}

// EXEC
function __opack_exec(args) {
	if (!isUnDef(args[0]) && args[0].toUpperCase() == 'OPENAF') {
		logErr("Please use 'openaf' to execute OpenAF");
		return;
	}

	packag = findLocalDBByName(args[0]);
	var target;

	if (isUnDef(packag) || isUnDef(packag["name"])) {
		packag = getPackage(args[0]);
		if (packag.__filelocation != 'local') {
			if (packag.__filelocation == 'opacklocal') {
				logErr("Please use 'openaf-sb " + args[0] + "' instead.");
				return;
			} else {
				logErr("Package not found (note: only installed or local packages can be executed)");
				return;
			}
		}
		target = args[0];
	} else {
		target = findLocalDBTargetByName(args[0]);
	}

	if (isString(packag.main) && packag.main.length > 0)
		af.load(target + "/" + packag.main);
	else {
		if (isDef(packag.mainJob) && packag.mainJob.length > 0) {
			oJobRunFile(target + "/" + packag.mainJob);
		} else {
			logErr("Can't load package " + packag.name);
		}
	}
}

// SCRIPT
function __opack_script(args, isDaemon, isJob) {
	if (!isUnDef(args[0]) && args[0].toUpperCase() == 'OPENAF') {
		logErr("Please use 'openaf' to execute OpenAF");
		return;
	}

	packag = findLocalDBByName(args[0]);
	var target;

	if (isUnDef(packag) || isUnDef(packag["name"])) {
		packag = getPackage(args[0]);
		if (packag.__filelocation != 'local') {
			if (packag.__filelocation == 'opacklocal') {
				logErr("Please use 'openaf-sb " + args[0] + "' instead.");
				return;
			} else {
				logErr("Package not found (note: only installed or local packages can be executed)");
				return;
			}
		}
		target = args[0];
	} else {
		target = findLocalDBTargetByName(args[0]);
	}

	var DEFAULT_SH = "/bin/sh";
	var javaHome  = java.lang.System.getProperty("java.home") + "";
	var classPath = getOpenAFJar();
	var os        = java.lang.System.getProperty("os.name") + "";
	var curDir    = java.lang.System.getProperty("user.dir") + "";
	var windows   = (os.match(/Windows/)) ? 1 : 0;
	var javaargs = "";
	var params = splitBySeparator(__expr, " ");
	var inSameDir = false
	for(var i in params) {
		var param = splitBySeparator(params[i], "=");
		if (param.length == 2 && param[0] == "args") javaargs = param[1];
	}

	var jh = javaHome.replace(/\\/g, "/");
	if (jh.substring(0, getOpenAFPath().lastIndexOf("/")+1) == getOpenAFPath()) {
		inSameDir = true
		javaHome = (os.match(/Windows/) ? "%DIR%" : "$DIR") + "/" + jh.substring(getOpenAFPath().lastIndexOf("/")+1)
	}
	classPath = (os.match(/Windows/) ? "%DIR%" : "$DIR") + "/" + classPath.substring(getOpenAFJar().lastIndexOf("/") + 1)

	function generateUnixScript(options) {
		var s;
	  
		if (typeof shLocation === 'undefined') {
		  if (windows == 1) {
			// for cygwin
			shLocation = DEFAULT_SH; 
			javaHome = javaHome.replace(/\\/g, "/");
			javaHome = javaHome.replace(/(\w)\:/,"/cygdrive/$1").toLowerCase();
		  } else {
			try {
			  shLocation = sh("which sh", "", null, false);
			} catch (e) {
			  logErr("Couldn't determine path for sh, assuming " + DEFAULT_SH + ": " + e.message);
			  shLocation = DEFAULT_SH;
			}
		  }
	  
		  log("sh located in "+ shLocation);
		}
	  
		s = "#!" + shLocation + "\n";
		s += "CDIR=`pwd`\n"
		s += "cd `dirname $0`\n"
		s += "DIR=`pwd`\n"
		s += "cd $CDIR\n"
		s = s + "stty -icanon min 1 -echo 2>/dev/null\n";
		s = s + "#if [ -z \"${JAVA_HOME}\" ]; then \nJAVA_HOME=\"" + javaHome + "\"\n#fi\n";
		s = s + "OPENAF_DIR=\"" + classPath + "\"\n";
		s = s + "\n";
		s = s + "\"$JAVA_HOME\"/bin/java " + javaargs + " -Djline.terminal=jline.UnixTerminal -jar $OPENAF_DIR " + options + "\n";
		s = s + "EXITCODE=$?\n";
		s = s + "stty icanon echo 2>/dev/null\n";
		s = s + "exit $EXITCODE\n";
		return s;
	}

	function generateWinScript(options) {
		var s;
  
		s = "@echo off\n\n";
		s = s + "set thispath=%~dp0\n"
		s = s + "set DIR=%thispath:~0,-1%\n"
		s = s + "rem if not %JAVA_HOME% == \"\" set JAVA_HOME=\"" + javaHome + "\"\n";
		s = s + "set JAVA_HOME=\"" + javaHome + "\"\n";
		s = s + "set OPENAF_DIR=\"" + classPath + "\"\n";
		s = s + "\n";
		s = s + "%JAVA_HOME%\\bin\\java " + javaargs + " -jar %OPENAF_DIR% " + options + "\n";
		return s;
	}

	loadLodash();
	var scriptCommand = (isDaemon) ? "--daemon " : "--script ";
	if (isString(packag.main) && packag.main.length > 0 && !isJob) {
		if (windows) {
			io.writeFileString(curDir + "/opack_" + _.camelCase(packag.name) + ".bat", generateWinScript(scriptCommand + target + "/" + packag.main + " -e \"%*\""));
			log("Created script in " + curDir + "/opack_" + _.camelCase(packag.name) + ".bat");
			
		} else {
			io.writeFileString(curDir + "/opack_" + _.camelCase(packag.name), generateUnixScript(scriptCommand + target + "/" + packag.main + " -e \"$*\""));
			sh("chmod u+x " + curDir + "/opack_" + _.camelCase(packag.name));
			log("Created script in " + curDir + "/opack_" + _.camelCase(packag.name));
		}
	} else {
		if (isDef(packag.mainJob) && packag.mainJob.length > 0) {
			if (windows) {
				io.writeFileString(curDir + "/opack_" + _.camelCase(packag.name) + ".bat", generateWinScript("--ojob -e \"" + target + "/" + packag.mainJob + " %*\""));
				log("Created script in " + curDir + "/opack_" + _.camelCase(packag.name) + ".bat");
			} else {
				io.writeFileString(curDir + "/opack_" + _.camelCase(packag.name), generateUnixScript("--ojob -e \"" + target + "/" + packag.mainJob + " $*\""));
				sh("chmod u+x " + curDir + "/opack_" + _.camelCase(packag.name));
				log("Created script in " + curDir + "/opack_" + _.camelCase(packag.name));
			}
		} else {
			logErr("Can't generate ojob script for package " + packag.name);
		}
	}
}

// UPDATE
function update(args) {
	if (!isUnDef(args[0]) && args[0].toUpperCase() == 'OPENAF') {
		logErr("Please use 'openaf --update' to update OpenAF");
		return;
	}

	var force = false;
	var foundRepo = false;
	var foundArg = false;
	var foundCred = false;
	var all = false;
	var ferase = true;
	var derase = true;

	for(let i in args) {
		if (foundRepo) {
			if (__opackCentral.indexOf(args[i]) < 0) __opackCentral.unshift(args[i]);
			foundRepo = false;
		}

		if (foundArg) {
			arg = args[i];
			foundArg = false;
		}

		if (foundCred) {
			var cred = args[i];
			if (cred.indexOf(":") > 0) [__remoteUser, __remotePass] = cred.split(/:/);
			foundCred = false;
		}

    if (args[i] == "-arg") foundArg = true;
    if (args[i] == "-force") force = true;
    if (args[i] == "-repo") foundRepo = true;
    if (args[i] == "-all") all = true;
		if (args[i] == "-noerase") ferase = false;
		if (args[i] == "-cred") foundCred = true;
		if (args[i] == "-erasefolder") derase = false;
	}
	var packag = getPackage(args[0]);

	if (all) {
		var ops = [];

		if (force) ops.push("-force");
		if (ferase) ops.push("-noerase");

		var packages = getOPackLocalDB();
		for(let i in packages) {
			if (packages[i].name.toUpperCase() == 'OPENAF') continue;
			var pack = [];
			pack.push(packages[i].name);
			pack = pack.concat(ops);
			update(pack);
		}

		return;
	}

	if (!isUnDef(packag) &&
		(typeof packag.name == 'undefined' ||
		 packag.__filelocation == 'local'))
		//packag = getOPackRemoteDB()[packag.name];
		packag = getOPackRemoteDB()[$from(Object.keys(getOPackRemoteDB())).equals(args[0]).at(0)];

	// Verify version
	if (!isUnDef(packag) &&
		(typeof packag.name !== 'undefined')) {
	    if (checkVersion(packag, force)) {
	    	if ((typeof packag.__filelocation !== 'undefined') &&
	    		!(packag.__filelocation.match(/opack/))
	    		) args[0] = packag.repository.url;
			log("UPDATING -- " + packag.name + " version " + packag.version);
	    } else {
	    	log("No need to update " + packag.name);
	    	return;
	    }
	} else {
		if (!force)
			logErr("Can't update!");
		else
			install(args);

		return;
	}

	if (ferase) erase(clone(args), derase);
	install(args);
}

// ERASE
function erase(args, dontRemoveDir) {
	if (!isUnDef(args[0]) && args[0].toUpperCase() == 'OPENAF') {
		logErr("Can't delete OpenAF. Please delete manually or following the uninstall instructions.");
		return;
	}

	checkOpenAFinDB();
	var packag = getPackage(args[0]);
	var force = false;
	var foundArg = false;

    for(var i in args) {
    	if (foundArg) {
    		arg = args[i];
    		foundArg = false;
    	}

    	if (args[i] == "-arg") foundArg = true;
    	if (args[i] == "-force") force = true;
    }

	if (isUnDef(packag) || isUnDef(packag["name"])) {
		packag = findLocalDBByName(args[0])

		if (isUnDef(packag) || isUnDef(packag["name"])) {
			logErr("Package not found.");
			return;
		} else {
			//args[0] = findLocalDBTargetByName(args[0]);
			packag.__filelocation = "local";
			//packag.__target = orig;
		}
	} else {
		args[0] = packag.name;
	}

	// Find deps
	if (isMap(packag.dependencies) &&
		!force) {
		var packages = getLocalDB(true);
		for(var pack in packages) {
			if (isMap(packages[pack].dependencies) &&
				typeof packages[pack].dependencies[packag.name] !== 'undefined' &&
				packag.name != "OpenAF") {
				logErr("'" + packages[pack].name + "' depends on '" + packag.name + "'");
				return;
			}
		}
	}

	if (typeof packag.scripts.preerase !== 'undefined') runScript(packag.scripts.preerase);

	switch(packag.__filelocation) {
		case "url": logErr("Can't remove non local packages"); break;
		case "opackurl": logErr("Can't remove non local packages"); break;
		case "opacklocal": logErr("Please provide a local installed package location or the package name"); break;
		case "local": {
			log("Erasing files");

			if (io.fileExists(packag.__target) && io.fileInfo(packag.__target).permissions.indexOf("w") < 0) throw "No write permissions over '" + packag.__target + "'";

			biggestMessage = 0;
			for(var i in packag.files) {
				var message = "Removing " + packag.files[i].replace(/^\/*/, "") + "...\r";
				if (message.length > biggestMessage) biggestMessage = message.length;
				lognl(message);
				deleteFile(packag.__target + "/" + packag.files[i].replace(/^\/*/, ""));
			}

			// Remove precompiled
			var list = listFilesRecursive(packag.__target);
			for(var i in list) {
				if (list[i].isDirectory) {
					if (list[i].filename == ".openaf_precompiled") {
						rmdir(list[i].filepath)
					} else {
						rmdir(list[i].filepath, true)
					}
				}
			}
			if (!dontRemoveDir) rmdir(packag.__target, true);
			if (!(io.fileExists(packag.__target) && io.listFiles(packag.__target).files.length > 0)) 
				log("Package " + packag.name + " erased." + repeat(biggestMessage, " "));
			else
				logWarn("Package " + packag.name + " could not be erased." + repeat(biggestMessage, " "));
			removeLocalDB(packag, packag.__target);
			break;
		}
		default: // TODO: IMPLEMENT SEARCH LOCAL DB FOR OPACK INFO
	}

	if (typeof packag.scripts.posterase !== 'undefined') runScript(packag.scripts.posterase);
}

// REMOVE LOCAL
function remove(args) {
    checkOpenAFinDB();
	var packag = findLocalDBByName(args[0]);

	if (isDef(packag) && isUnDef(packag["name"])) {
		logErr("Package not found on the local OpenPack DB.");
		return;
	} else {
		args[0] = findLocalDBTargetByName(args[0]);
		log("Removing from the local OpenPack DB: " + packag.name + "(" + packag.version + ")" + " [" + findLocalDBTargetByName(packag.name) + "]");
		removeLocalDB(packag, args[0]);
	}
}

// REMOVE CENTRAL
function removeCentral(args) {
	removeRemoteDB(args[0], args[1]);
}

// ADD CENTRAL
function addCentral(args) {
	var packag = getPackage(args[0]);

	if (isUnDef(packag["name"])) {
		logErr("Package not found");
		return;
	} else {
		log("Adding to central");
		addRemoteDB(packag, args[1]);
	}
}

// ADD LOCAL
function add(args) {
	checkOpenAFinDB();
	var packag = getPackage(args[0]);

	if (isUnDef(packag["name"])) {
		logErr("Package not found.");
		return;
	} else {
		if (packag.__filelocation !== 'local') {
			logErr("Can't add non unpacked packs.");
			return;
		}

		delete packag["__filelocation"];
		log("Adding to the local OpenPack DB: " + packag.name + "(" + packag.version + ")" + " [" + args[0] + "]");
		addLocalDB(packag, args[0]);
	}
}

// SEARCH
function __opack_search(args) {
	var results = [];

    // Find other options
    var foundRepo = false;
    var showAll = false;

    for(let i in args) {
    	if (foundRepo) {
    		if (__opackCentral.indexOf(args[i]) < 0) __opackCentral.unshift(args[i]);
    		foundRepo = false;
    	}

    	if (args[i] == "-repo") foundRepo = true;
    }

    if (typeof args[0] == 'undefined' || args[0].trim() == "") showAll = true;

    var packs = getRemoteDB();
    var packsKeys = Object.keys(packs).sort();

	for(let packId in packsKeys) {
		var pack = packsKeys[packId];
		if (showAll) {
			results.push({"name": packs[pack].name, "version": packs[pack].version, "description": packs[pack].description});
		} else {
			if (packs[pack].name.match(new RegExp(args[0], "i")) ||
				packs[pack].description.match(new RegExp(args[0], "i"))) {
				results.push({"name": packs[pack].name, "version": packs[pack].version, "description": packs[pack].description});
			}
			for(let keyword in packs[pack].keywords) {
				if (keyword.match(new RegExp(args[0], "i"))) {
					results.push({"name": packs[pack].name, "version": packs[pack].version, "description": packs[pack].description});
				}
			}
		}
	}

	$from(results).sort("name").select((result) => {
		ansiStart(); 
		print(ansiColor("bold", "[" + result.name + "]") + " (version " + ansiColor("green", String(result.version)) + "):");
		print(result.description + "\n");
		ansiStop();
	});
}

// PACK
function pack(args) {
	genpack(args);

	var packag = {};
	try { packag = getPackage(args[0]) } catch(e) {};

	var zip = new ZIP();
	var packName = packag.name + "-" + packag.version + ".opack";
	io.rm(packName);
	
	var c = 0, cmax = 0;
	
	for(let i in packag.files) {
		c++;
		file = packag.files[i];
		var str = "Packing (" + ow.format.round((c * 100) / packag.files.length) + "%) " + ow.format.addNumberSeparator(c) + " files\r";
		lognl(str);
		if (str.length > cmax) cmax = str.length;
		var rfs = io.readFileStream(args[0] + "/" + file);
		zip.streamPutFileStream(packName, file, rfs);
		rfs.close();
	}
	if (c > 0) {
		lognl(repeat(cmax, " "));
		log("All files packed.");
	}

    log("Writing " + packName);
	//io.writeFileBytes(packName, zip.generate({"compressionLevel": 9}));

	//zip.close();
}

// GENPACK
function genpack(args) {
	var packag = {};
	var excludeList = [ ".svn", ".git" ];
	try { packag = getPackage(args[0]) } catch(e) {};

	for(let i in args) {
    	if (args[i] == "--includeSCM") excludeList = [];
	}
	for(let i in args) {
    	if (args[i] == "--exclude") {
			log("Excluding '" + args[Number(i) + 1] + "'...");
			excludeList.push(args[Number(i) + 1]);
		}
    }
	var packageNew = {};

	packageNew.author              = (typeof packag.author !== 'undefined')              ? packag.author              : "The author(s) name(s)";
	packageNew.scripts             = (typeof packag.scripts !== 'undefined')             ? packag.scripts             : { "preerase":"", "posterase":"", "preinstall":"", "postinstall":"" };
	if (typeof packag.scripts !== 'undefined') {
		packageNew.scripts.preerase    = (typeof packag.scripts.preerase !== 'undefined')    ? packag.scripts.preerase    : "";
		packageNew.scripts.posterase   = (typeof packag.scripts.posterase !== 'undefined')   ? packag.scripts.posterase   : "";
		packageNew.scripts.preinstall  = (typeof packag.scripts.preinstall !== 'undefined')  ? packag.scripts.preinstall  : "";
		packageNew.scripts.postinstall = (typeof packag.scripts.postinstall !== 'undefined') ? packag.scripts.postinstall : "";
	}
	packageNew.keywords            = (typeof packag.keywords !== 'undefined')            ? packag.keywords            : ['Keyword1', 'keyword2'];
	packageNew.bugs                = (typeof packag.bugs !== 'undefined')                ? packag.bugs                : {"url": "URL to track bugs"};
	packageNew.repository          = (typeof packag.repository !== 'undefined')          ? packag.repository          : {"type": "http", "url": "URL to main repository"};
	packageNew.description         = (typeof packag.description !== 'undefined')         ? packag.description         : "A nice description";
	packageNew.name                = (typeof packag.name !== 'undefined')                ? packag.name                : "A_nice_name";
	packageNew.main                = (isString(packag.main))                             ? packag.main                : "";
	packageNew.mainJob             = (typeof packag.mainJob !== 'undefined')             ? packag.mainJob             : "";
	packageNew.license             = (typeof packag.license !== 'undefined')             ? packag.license             : "The licence description";
	packageNew.version             = (typeof packag.version !== 'undefined')             ? packag.version             : "20010101";
	packageNew.dependencies        = (isMap(packag.dependencies))                        ? packag.dependencies        : {"packa": ">=20100101", "packb": "<20120101" };

	if (isDef(packag.odoc) && isObject(packag.odoc)) {
		for(let i in packag.odoc) {
			log("Generating help for key " + i + " from " + packag.odoc[i] + "...");
			saveHelp(args[0], packag.odoc[i]);
		}
		packageNew.odoc = packag.odoc;
	}

	packageNew.files = listFiles(args[0], undefined, excludeList);
	if (packageNew.files.indexOf(PACKAGEJSON) < 0 && packageNew.files.indexOf(PACKAGEYAML) < 0) {
		if (args.indexOf("-injson") < 0)
			packageNew.files.push(PACKAGEYAML);
		else
			packageNew.files.push(PACKAGEJSON);
	}
	packageNew.filesHash = Object(listFilesWithHash(args[0], excludeList));
	if ((args.indexOf("-injson") >= 0 || packageNew.files.indexOf(PACKAGEJSON) >= 0) && args.indexOf("-inyaml") < 0) {
	    log("Writing " + args[0] + "/" + PACKAGEJSON);
		io.writeFileString(args[0] + "/" + PACKAGEJSON, stringify(packageNew));			
	} else {
	    log("Writing " + args[0] + "/" + PACKAGEYAML);
		io.writeFileString(args[0] + "/" + PACKAGEYAML, af.toYAML(packageNew));	
	}
}

// ----------------------------------------------------------
// MAIN
// ----------------------------------------------------------

var showhelp = (isUnDef(__opackParams)) ? 1 : 0;
var verbfound = 0;
var params = (isUnDef(__opackParams)) ? __expr.split(/ +/) : __opackParams.split(/ +/);

// Check for existing verbs
for(let i in verbs) {
	if (verbfound) continue;

	if (params[0] == i) {
		params.splice(0, 1);

		verb = i;

		switch(verb) {
			case 'info'           : __opack_info(params); break;
			case 'install'        : install(params); break;
			case 'erase'          : erase(params); break;
			case 'list'           : __opack_list(params); break;
			case 'genpack'        : genpack(params); break;
			case 'pack'           : pack(params); break;
			case 'add2db'         : add(params); break;
			case 'remove4db'      : remove(params); break;
			case 'add2remotedb'   : addCentral(params); break;
			case 'remove4remotedb': removeCentral(params); break;
			case 'script'         : __opack_script(params); break;
			case 'daemon'         : __opack_script(params, true); break;
			case 'ojob'           : __opack_script(params, false, true); break;
			case 'search'         : __opack_search(params); break;
			case 'update'         : update(params); break;
			case 'exec'           : __opack_exec(params); break;
			case 'help'           : showhelp = 1; showHelp(); break;
		}

		showhelp = 0;
	}
}

if (showhelp) showHelp();
if (isDef(__opackParams)) __opackParams = undefined;