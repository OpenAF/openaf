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
						  "'-all'  : Tries to update all packages locally installed",
						  "'-cred' : Provide authentication credentials (e.g. user:pass)",
		                  "'-erase': When updating delete the package frist"]
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
 	"add2remotedb": {},
	"remove2remotedb": {},
	"help" : {}
};

plugin("ZIP");
plugin("HTTP");
ow.loadFormat();

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

		if (!isUndefined(verb["help"])) {
			print("   " + i + repeat(maxVerb - i.length + 1, ' ') + " - " + verb.help );
			for(let j in verb.optionshelp) {
				print(repeat(maxVerb, ' ') + "          " + verb.optionshelp[j]);
			}
		}
	}

	print("");
	print("(version " + af.getVersion() + ", " + Packages.wedo.openaf.AFCmdBase.LICENSE +")");
}

// Retrieve OPack file using HTTP
function getHTTPOPack(aURL) {
	if (!isUndefined(zipCache[aURL])) {
		return zipCache[aURL];
	}

	log("Retriving " + aURL);
	try {
		var http = execHTTPWithCred(aURL.replace(/ /g, "%20"), "GET", "", {}, true);
		var opack = new ZIP(http.responseBytes());
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
	if (!isUndefined(remoteDB)) return remoteDB;

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
	//io.writeFileBytes(aDB, zip.generate({"compressionLevel":9}));
  } catch(e) {
  	logErr(e.message);
  }
  //zip.close();
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

	try {
		if (!io.fileInfo(fileDB).permissions.match(/w/)) {
			throw fileDB + " is not acessible. Please check permissions.";
		}
	} catch(e) {
		if (!(e.message.match(/NoSuchFileException/))) {
			throw e;
		}
	}

	try {
		aTarget = (new java.io.File(aTarget)).getCanonicalPath() + "";
	} catch(e) {
		logErr(e.message);
	}

	var packages = {};
	var zip = new ZIP();
	try {
		//zip = new ZIP(io.readFileBytes(fileDB));
		packages = fromJsonYaml(af.fromBytes2String(zip.streamGetFile(fileDB, PACKAGESJSON)));
	} catch(e) {
		 if (!(e.message.match(/FileNotFoundException/))) logErr(e.message);
	}

	if (!isUndefined(packages)) {
		packages[aTarget] = aPackage;
	} else {
		packages = {};
		packages[aTarget] = aPackage;
	}

	try {
		zip.streamPutFile(fileDB, PACKAGESJSON, af.fromString2Bytes(stringify(packages)));
		//io.writeFileBytes(fileDB, zip.generate({"compressionLevel":9}));
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
	
	var packages = getLocalDB(true);

	if (isUndefined(packag)) {
		var packageFound = findLocalDBByName(packageName);

		if (!isUndefined(packageFound)) {
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
		if (!isUndefined(localDB)) return localDB;

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

	if(isUndefined(aName) || aName.length <= 0) return;

	for(let target in packages) {
		var packag = packages[target];
		if (packag.name.toUpperCase() == aName.toUpperCase()) return packag;
	}
}

// OpenPack find a package target by name
function findLocalDBTargetByName(aName) {
	var packages = getLocalDB();

	if(isUndefined(aName) || aName.length <= 0) return;

	for(let target in packages) {
		var packag = packages[target];
		if (packag.name.toUpperCase() == aName.toUpperCase()) return target;
	}
}

// dependencies
function verifyDeps(packag) {
	//var fileDB = getOpenAFPath() + "/" + PACKAGESJSON_DB;
	var packages = getOPackLocalDB();
	var results = {};

	/*if (!io.fileInfo(fileDB).permissions.match(/r/)) {
		throw fileDB + " is not acessible. Please check permissions.";
	}*/

	/*try {
		//var zip = new ZIP(io.readFileBytes(fileDB));
		var zip = new ZIP();
		packages = fromJsonYaml(af.fromBytes2String(zip.streamGetFile(fileDB, PACKAGESJSON)));
		//zip.close();
	} catch(e) {
		//logErr(e.message);
	}*/

	for(let dep in packag.dependencies) {
		var version = packag.dependencies[dep];

		var compareTo = findLocalDBByName(dep);
		results[dep] = false;
		if (!isUndefined(compareTo)) {
			if (compareTo.version == version)                          							{ results[dep] = true; continue; }
			if (version.match(/^\>\=/) && compareTo.version >= version.replace(/^\>\=/, ""))  	{ results[dep] = true; continue; }
			if (version.match(/^\<\=/) && compareTo.version <= version.replace(/^\<\=/, ""))  	{ results[dep] = true; continue; }
			if (version.match(/^\<(?=[^=])/) && compareTo.version < version.replace(/^\</, "")) { results[dep] = true; continue; }
			if (version.match(/^\>(?=[^=])/) && compareTo.version > version.replace(/^\>/, "")) { results[dep] = true; continue; }
		}
	}

	return results;
}

// OpenPack local register remove
function removeLocalDB(aPackage, aTarget) {
	var fileDB = getOpenAFPath() + "/" + PACKAGESJSON_DB;

	if (!io.fileInfo(fileDB).permissions.match(/w/)) {
		throw fileDB + " is not acessible. Please check permissions.";
	}

	aTarget = (new java.io.File(aTarget)).getCanonicalPath() + "";

	var packages = {};

	var zip = new ZIP();
	try {
		//zip = new ZIP(io.readFileBytes(fileDB));
		packages = fromJsonYaml(af.fromBytes2String(zip.streamGetFile(fileDB, PACKAGESJSON)));
	} catch(e) {
		logErr(e.message);
	}

	if (!isUndefined(packages)) {
		delete packages[aTarget];

		try {
			zip.streamPutFile(fileDB, PACKAGESJSON, af.fromString2Bytes(stringify(packages)));
			//io.writeFileBytes(fileDB, zip.generate({"compressionLevel":9}));
		} catch (e) {
			logErr(e.message);
			return;
		}
	}
	//zip.close();

	log("Package " + aPackage.name + " removed from local OpenPack DB");
}

// Check OpenAF in local DB
function checkOpenAFinDB() {
	var packag = getPackage(getOpenAFJar());

	if (isUndefined(packag.name)) return;

	addLocalDB(packag, getOpenAFPath());
}

// ----------------------------------------------------------
// FILESYSTEM UTILITIES
// ----------------------------------------------------------

// Read local files recursively
function listFiles(startPath, relPath, excludingList) {
	var files = [];
	if (isUnDef(excludingList)) excludingList = [];

	if (isUndefined(relPath)) relPath = "";
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
				var rfs = io.readFileStream(startPath + "/" + files[i]);
				filesHash[files[i]] = sha1(rfs) + "";
				rfs.close();
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
			zip = new ZIP(http.responseBytes());
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
			var rfs = io.readFileStream(startPath + "/" + file);
			hash = sha1(rfs) + "";
			rfs.close();
			break;
		case "http":
			hash = sha1(http.responseBytes()) + "";
			break;
		case "opack":
			if (location == "opack") 
				hash = sha1(zip.streamGetFile(file));
			else
				hash = sha1(zip.getFile(file)) + "";
			break;
		case "opackhttp":
			if (location == "opackhttp")
				hash = sha1(zip.streamGetFile(file));
			else
				hash = sha1(zip.getFile(file)) + "";
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
	af.rm(target);
}

// Make directory
function mkdir(aNewDirectory) {
    af.mkdir(aNewDirectory);
}

// Remove directory
function rmdir(aNewDirectory) {
	af.rm(aNewDirectory);
}

// ----------------------------------------------------------
// SCRIPT UTILITIES
// ----------------------------------------------------------

// Get credentials
function execHTTPWithCred(aURL, aRequestType, aIn, aRequestMap, isBytes, aTimeout, returnStream) {
	if (isUnDef(__remoteHTTP)) __remoteHTTP = new HTTP();
    var res;

	try {
		res = __remoteHTTP.exec(aURL, aRequestType, aIn, aRequestMap, isBytes, aTimeout, returnStream);
	} catch(e) {
		if (String(e.message).match(/code: 401/)) {
			if (isUnDef(__remoteUser) || isUnDef(__remotePass)) {
				plugin("Console");
				var con = new Console();
				__remoteUser = con.readLinePrompt("Enter authentication user: ");
				__remotePass = con.readLinePrompt("Enter authentication password: ", "*");
			}
			__remoteHTTP.login(__remoteUser, Packages.wedo.openaf.AFCmdBase.afc.dIP(__remotePass), aURL);
			res = __remoteHTTP.exec(aURL, aRequestType, aIn, aRequestMap, isBytes, aTimeout, returnStream);
		} else {
			throw e;
		}
	}

	if (returnStream)
		return res;
	else
		return __remoteHTTP;
}

// Find OpenAF she-bang
function getOpenAFSB() {
  var os = java.lang.System.getProperty("os.name") + "";
  var currentClassPath = java.lang.management.ManagementFactory.getRuntimeMXBean().getClassPath() + "";

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
function getOpenAFJar() {
  	var currentClassPath = java.lang.management.ManagementFactory.getRuntimeMXBean().getClassPath() + "";

  	return currentClassPath;
}

// Find OpenAF
function getOpenAF() {
  var os = java.lang.System.getProperty("os.name") + "";
  var currentClassPath = java.lang.management.ManagementFactory.getRuntimeMXBean().getClassPath() + "";

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
		var s = new Function(aScript);
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

	if (isUndefined(packPath)) return packag;

	// determine if HTTP or local
	if (packPath.match(/^http/i)) {
		if (packPath.match(/\.(opack)|(jar)$/i)) {
			// Remote OPack
			var opack = getHTTPOPack(packPath);
			if (isUndefined(opack)) return;

			// There should be no \n usually associated with package.json scripts
			try {
				packag = fromJsonYaml(af.fromBytes2String(opack.getFile(PACKAGEJSON)).replace(/\n/g, "") + "");
			} catch(e) {
				packag = fromJsonYaml(af.fromBytes2String(opack.getFile(PACKAGEYAML)) + "");
			}
			if (isUndefined(packag.files)) {
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
					output = af.fromBytes2String(http.responseBytes()).replace(/\n/g, "");
					retry = false;
				} catch(e) {
					http = execHTTPWithCred(packPath.replace(/ /g, "%20") + "/" + PACKAGEYAML, "GET", "", {}, true);
					output = af.fromBytes2String(http.responseBytes());
					retry = false;
				}
				packag = fromJsonYaml(output);
				if (isUndefined(packag)) throw(packPath + "/" + PACKAGESJSON);
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
				if (isUndefined(packag.files)) {
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
					packag = io.readFile(packPath + "/" + PACKAGEJSON);
				} catch(e) {
					packag = io.readFileYAML(packPath + "/" + PACKAGEYAML);
				}
				packag.__filelocation = "local";
				packag.__target = (new java.io.File(packPath)).getCanonicalPath() + "";

				if (isUndefined(packag.files)) {
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
	if(isUndefined(args[0]) || args[0] == "") return;

	var packag = getPackage(args[0]);
	var remote = false;

	if (isUndefined(packag) || isUndefined(packag["name"])) {
		packag = findLocalDBByName(args[0]);

		if (isUndefined(packag) || isUndefined(packag["name"])) {
			var packs = getRemoteDB();
			var packFound = findCaseInsensitive(packs, args[0]);
			if (isUndefined(packFound)) {
				logErr("No entry for '" + args[0] + "' on remote OPack database.");
				logErr("Package not found.");
				return;
			} else {
				packag = getPackage(packFound.repository.url);
				if (isUndefined(packag) && !(isUndefined(packFound.repository.backupurl))) {
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

	ansiStart();
	print(ansiColor("bold", "INSTALLED IN: ") + args[0]);
	print(ansiColor("bold", "NAME        : ") + packag.name);
	print(ansiColor("bold", "VERSION     : ") + packag.version);
	print(ansiColor("bold", "DESCRIPTION : ") + packag.description);
	print(ansiColor("bold", "AUTHOR      : ") + packag.author);
	print(ansiColor("bold", "REPOSITORY  : ") + "[" + packag.repository.type + "] " + packag.repository.url);
	print(ansiColor("bold", "DEPENDS ON  :"));
	print("");

	var depsResults;
	if(!remote) depsResults = verifyDeps(packag);

	for(let i in packag.dependencies) {
		var depend = packag.dependencies[i];

		if (!remote)
			print("\t" + i + ": " + depend + " [" + ((depsResults[i]) ? "OK" : "FAILED DEPENDENCY") + "]");
		else
			print("\t" + i + ": " + depend);
	}
	var hashResults;
	if(!remote) hashResults = verifyHashList(args[0], packag.filesHash);
	print(ansiColor("bold", "FILES       :") + "\n");
	for(let i in packag.files) {
		var file = packag.files[i];
		var canGo = true;

		if (file == PACKAGEJSON || file == PACKAGEYAML) canGo = false;
		if (isUnDef(file) || file == null) canGo = false;

		if (canGo) {
			if (!remote) {
				var status;
				if (isUndefined(hashResults[file])) {
					status = "not installed";
				} else {
					status = (hashResults[file]) ? "OK" : "CHANGED!";
				}
				
				print("\t" + file.replace(new RegExp("^" + args[0].replace(/\./g, "\\."), "") + "/", "").replace(/^\/*/, "") + " [" + status + "]");
			} else {
				print("\t" + file.replace(new RegExp("^" + args[0].replace(/\./g, "\\."), "") + "/", "").replace(/^\/*/, ""));
			}
		}
	}
	ansiStop();
}

// LIST
function __opack_list(args) {
	var packages = getLocalDB(true);

	var sortIds = {};
	for(let i in packages) {
		if (isDef(packages[i].name)) 
			sortIds[packages[i].name.toLowerCase()] = i;
	}

	var packsIds = Object.keys(sortIds).sort();
	for (let packageId in packsIds) {
		packag = sortIds[packsIds[packageId]];
		if (packag == 'OpenPackDB') continue;
		ansiStart();
		print(ansiColor("bold", "[" + packages[packag].name + "]") + " (version " + ansiColor("green", packages[packag].version) + "):" + " " + ansiColor("cyan", packag) + "");
		ansiStop();
    }
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
	if (isUndefined(args[0]) || args[0].length <= 0)
		return;

	if (!isUndefined(args[0]) && args[0].toUpperCase() == 'OPENAF') {
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
	if (isUnDef(output)) output = getOpenAFPath() + "/" + packag.name;

	if (isUndefined(packag.name)) {
		//logErr("Couldn't find package on location " + args[0]);

		log("Checking remote OPack database");
		var packs = getRemoteDB();
		var packFound = findCaseInsensitive(packs, args[0]);
		if (isUndefined(packFound)) {
			logErr("No entry for '" + args[0] + "' on remote OPack database.");
			return;
		} else {
			packag = getPackage(packFound.repository.url);
			if (!forceOutput) output = getOpenAFPath() + "/" + packag.name;
			args[0] = packag.repository.url;
		}
	}

	// Verify version
	if (checkVersion(packag, force) || justCopy) {
		log((justCopy ? "COPYING" : "INSTALLING") + " -- " + packag.name + " version " + packag.version);
	} else {
		log("Checking remote OPack database");
		var packs = getRemoteDB();
		var packFound = findCaseInsensitive(packs, args[0]);
		if (isUndefined(packFound)) {
			logErr("No entry for '" + args[0] + "' on remote OPack database.");
			return;
		} else {
			packag = getPackage(packFound.repository.url);
			if (!forceOutput) output = getOpenAFPath() + "/" + packag.name;
			args[0] = packag.repository.url;
		}
		if (checkVersion(packag, force)) {
			log("UPDATING -- " + packag.name + " version " + packag.version);
		} else {
			return;
		}
	}

	// Verify deps
	var depsResults = verifyDeps(packag);
	if (!force && !justCopy)
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
				if (isUndefined(packFound)) {
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
    if (!isUndefined(packag.scripts.preinstall) && !justCopy) runScript(packag.scripts.preinstall);

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
			//for(i in packag.files) {
			parallel4Array(packag.files, function(apackfile) {
				mkdir(outputPath);
				var message = "Copying " + apackfile.replace(new RegExp("^" + args[0].replace(/\./g, "\\."), "") + "/", "") + "...";
				log(message);

				try {
					if (!useunzip) {
						var opack = new ZIP();
						ioStreamCopy(io.writeFileStream(outputPath + "/" + apackfile), opack.streamGetFileStream(args[0], apackfile));
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
	if (!isUndefined(args[0]) && args[0].toUpperCase() == 'OPENAF') {
		logErr("Please use 'openaf' to execute OpenAF");
		return;
	}

	packag = findLocalDBByName(args[0]);
	var target;

	if (typeof packag == 'undefined' || typeof packag["name"] == 'undefined') {
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

	if (typeof packag.main !== 'undefined' && packag.main.length > 0)
		af.load(target + "/" + packag.main);
	else {
		if (isDef(packag.mainJob) && packag.mainJob.length > 0) {
			oJobRunFile(target + "/" + packag.mainJob);
		} else {
			logErr("Can't load package " + packag.name);
		}
	}
}

// UPDATE
function update(args) {
	if (!isUndefined(args[0]) && args[0].toUpperCase() == 'OPENAF') {
		logErr("Please use 'openaf --update' to update OpenAF");
		return;
	}

	var force = false;
	var foundRepo = false;
	var foundArg = false;
	var foundCred = false;
	var all = false;
	var erase = false;

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
		if (args[i] == "-erase") erase = true;
		if (args[i] == "-cred") foundCred = true;
	}
	var packag = getPackage(args[0]);

    if (all) {
    	var ops = [];

    	if (force) ops.push("-force");
    	if (erase) ops.push("-erase");

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

	if (!isUndefined(packag) &&
		(typeof packag.name == 'undefined' ||
		 packag.__filelocation == 'local'))
		//packag = getOPackRemoteDB()[packag.name];
		packag = getOPackRemoteDB()[$from(Object.keys(getOPackRemoteDB())).equals(args[0]).select()[0]];

	// Verify version
	if (!isUndefined(packag) &&
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

	if (erase) erase(args);
	install(args);
}

// ERASE
function erase(args) {
	if (!isUndefined(args[0]) && args[0].toUpperCase() == 'OPENAF') {
		logErr("Can't delete OpenAF. Please delete manually or using another package manager (e.g. RPM)");
		return;
	}

	checkOpenAFinDB();
	var packag = getPackage(args[0]);
	var force = false;
	var foundArg = false;

    for(let i in args) {
    	if (foundArg) {
    		arg = args[i];
    		foundArg = false;
    	}

    	if (args[i] == "-arg") foundArg = true;
    	if (args[i] == "-force") force = true;
    }

	if (typeof packag == 'undefined' || typeof packag["name"] == 'undefined') {
		packag = findLocalDBByName(args[0]);

		if (typeof packag == 'undefined' || typeof packag["name"] == 'undefined') {
			logErr("Package not found.");
			return;
		} else {
			args[0] = findLocalDBTargetByName(args[0]);
			packag.__filelocation = "local";
		}
	} else {
		args[0] = packag.name;
	}

	// Find deps
	if (typeof packag.dependencies !== 'undefined' &&
		!force) {
		var packages = getLocalDB(true);
		for(let pack in packages) {
			if (isArray(packages[pack].dependencies) &&
				typeof packages[pack].dependencies[packag.name] !== 'undefined') {
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

			biggestMessage = 0;
			for(let i in packag.files) {
				var message = "Removing " + packag.files[i].replace(/^\/*/, "") + "...\r";
				if (message.length > biggestMessage) biggestMessage = message.length;
				lognl(message);
				deleteFile(args[0] + "/" + packag.files[i].replace(/^\/*/, ""));
			}

			var list = io.listFiles(args[0]);
			for(let i in list.files) {
				if (list.files[i].isDirectory) {
					rmdir(list.files[i].filepath);
				}
			}
			rmdir(args[0]);
			log("Package " + packag.name + " erased." + repeat(biggestMessage, " "));
			removeLocalDB(packag, args[0]);
			break;
		}
		default: // TODO: IMPLEMENT SEARCH LOCAL DB FOR OPACK INFO
	}

	if (typeof packag.scripts.posterase !== 'undefined') runScript(packag.scripts.posterase);
}

// REMOVE LOCAL
function remove(args) {
        checkOpenAFindDB();
	var packag = findLocalDBByName(args[0]);

	if (typeof packag["name"] == 'undefined') {
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

	if (typeof packag["name"] == 'undefined') {
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

	if (typeof packag["name"] == 'undefined') {
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
		print(ansiColor("bold", "[" + result.name + "]") + " (version " + ansiColor("green", result.version) + "):");
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
	af.rm(packName);
	
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
	packageNew.main                = (typeof packag.main !== 'undefined')                ? packag.main                : "";
	packageNew.mainJob             = (typeof packag.mainJob !== 'undefined')             ? packag.mainJob             : "";
	packageNew.license             = (typeof packag.license !== 'undefined')             ? packag.license             : "The licence description";
	packageNew.version             = (typeof packag.version !== 'undefined')             ? packag.version             : "20010101";
	packageNew.dependencies        = (typeof packag.dependencies !== 'undefined')        ? packag.dependencies        : {"packa": ">=20100101", "packb": "<20120101" };

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
        case 'info': __opack_info(params); break;
        case 'install': install(params); break;
        case 'erase': erase(params); break;
        case 'list': __opack_list(params); break;
        case 'genpack': genpack(params); break;
        case 'pack': pack(params); break;
        case 'add2db': add(params); break;
        case 'remove2db': remove(params); break;
        case 'add2remotedb': addCentral(params); break;
        case 'remove2remotedb': removeCentral(params); break;
        case 'search': __opack_search(params); break;
        case 'update': update(params); break;
		case 'exec': __opack_exec(params); break;
		case 'help': showhelp = 1; showHelp(); break;
        }

		showhelp = 0;
	}
}

if (showhelp) showHelp();
if (isDef(__opackParams)) __opackParams = undefined;