//
// Author: Nuno Aguiar

plugin("ZIP");
ow.loadObj();

var createTmp = false;

//Check if a Jar was repacked
function isRepackJar(aJarFilePath) {
	var res = true;

	var aJar = new ZIP();
	try {
		aJar.loadFile(aJarFilePath);
		var listJar = aJar.list();

		for(let i in listJar) {
			//if(listJar[i].name.match(/jarinjarloader/) && listJar[i].name.match(/eclipse/)) {
			if (listJar[i].name.match(/\/js\.jar/)) {
				res = false;
			}
		}
	} catch(e) { }
	aJar.close();

	return res;
}

function getModulesToExclude() {
	loadUnderscore();
	var plugins = __expr.split(/,/);
	var toExclude = [];

	var vad = io.readFile(getOpenAFJar() + "::versionsAndDeps.json");

	for(let i in plugins) {
		var libsOut = _.flatten($from(vad.plugins).equals("name", plugins[i]).equals("removable", true).select(function(r) { return r.deps; }));
		var libsIn  = _.flatten($from(vad.plugins).not().equals("name", plugins[i]).select(function(r) { return r.deps; }));
	
		toExclude = toExclude.concat(_.without(libsOut, libsIn));
	}

	toExclude = _.uniq(toExclude);
	for(var i in toExclude) {
		if (isDef(toExclude[i]) && toExclude[i].match(/^lib\//)) {
			toExclude[i] = toExclude[i].replace(/^lib\//, "");
		}
	}

	return toExclude;
}

function isRepacked() {
	return irj;
}

function repackIncludeFile(aZipPath, aFilePath) {
	includeMore[aZipPath] = {
		name: aZipPath,
		outside: true,
		outsideName: aFilePath
	}
}

function repackSetMainClass(aClass) {
	mainClass = aClass;
}

try {
  var curDir    = java.lang.System.getProperty("user.dir") + "";
  var classPath = getOpenAFJar();
  var os        = String(java.lang.System.getProperty("os.name"));
} catch (e) {
  logErr("Couldn't retrieve system properties: " + e.message);
  java.lang.System.exit(0);
}

log("Checking if repacking OpenAF for faster loading is needed...");

var zip    = new ZIP();
var zipNew = new ZIP();
var includeMore = {}; 
var mainClass = undefined;

var irj = isRepackJar(classPath);

try {
// Set .package.json	

packJson = jsonParse(af.fromBytes2String(zip.streamGetFile(getOpenAFJar(), ".package.json")));
packJson.version = getVersion();

var fileDB = getOpenAFPath() + "/" + PACKAGESJSON_DB;

var packages = {};
var zipdb = new ZIP();
try {
	packages = af.fromJson(af.fromBytes2String(zipdb.streamGetFile(fileDB, PACKAGESJSON)));
} catch(e) {
	 if (!(e.message.match(/FileNotFoundException/))) logErr(e.message);
}

if (!isUndefined(packages)) {
	packages["OpenAF"] = packJson;
} else {
	packages = {};
	packages["OpenAF"] = packJson;
}

try {
	zipdb.streamPutFile(fileDB, PACKAGESJSON, af.fromString2Bytes(stringify(packages)));
} catch (e) {
	logErr(e.message);
}

// PreRepack actions
$from(ow.obj.fromObj2Array(getOPackLocalDB(), "path")).notEmpty("scripts.prerepack").select(function(r) {
	if (r.name == "OpenCli" && r.version != af.getVersion()) {
		logWarn("Please update OpenCli to match the version " + af.getVersion());
		if (io.fileExists(r.path + "/.url")) {
			logWarn("by executing 'opack install " + eval( io.readFileYAML(r.path + "/.url").c ) + "'" );
		}
	} else {
		log("Executing prepack actions from oPack '" + r.name + "'");
		try {
			var s = new Function(r.scripts.prerepack);
			s();
		} catch(e) {
			logErr("opack '" + r.name + "': " + e);
		}
	}
});

if (!irj || __expr != "" || Object.keys(includeMore).length > 0) {
	var oldVersionFile = classPath.replace(/openaf.jar/, "openaf.jar.orig");
    
    if (!noHomeComms) syncFn(() => {
        if (!io.fileExists(oldVersionFile)) {
            var dist = getDistribution() + "/";
            if (dist == "stable/") dist = "";
            
            var url = "https://openaf.io/" + dist + "openaf-" + getVersion() + ".jar";
            logWarn("Trying to download from '" + url + "'...");
            $rest().get2File(oldVersionFile, url);

            if (!(io.fileExists(oldVersionFile) && io.fileInfo(oldVersionFile).size > 0)) {
                logErr("Couldn't download '" + url + "'");
            }
        }
    });

	if (!irj) {
		log("Backup to " + oldVersionFile);
		io.writeFileBytes(oldVersionFile, io.readFileBytes(classPath));
	}
	
	var toExclude = [];
	if (__expr != "") toExclude = getModulesToExclude();

	try {
		zip.loadFile(oldVersionFile);
	} catch(e) {
		logErr("For the repack operation, excluding or adding modules the original un-repacked openaf.jar version (openaf.jar.orig) is needed!");
		throw e;
	}
	
	var list = zip.list(oldVersionFile);
	list = merge(list, includeMore);

	var c = 0;
	for(let i in list) {
		c++;
		var el = list[i];

		lognl("Progress " + Math.round(c * 100 / Object.keys(list).length) + "% (" + c + "/" + Object.keys(list).length + ")\r");
		
		if (toExclude.indexOf(el.name) >= 0) {
			log("Excluding " + el.name);
			continue;
		}  
		
		if(el.name.match(/\.jar$/)) {
			var zipTemp = new ZIP();

			if (el.name.match(/tools-attach.jar$/) &&
			    Packages.jodd.util.ClassLoaderUtil.findToolsJar() != null) {
				zipTemp.loadFile(String(Packages.jodd.util.ClassLoaderUtil.findToolsJar()));
			} else {
				if (!el.outside) 
					zipTemp.load(zip.getFile(el.name));
				else
					zipTemp.loadFile(el.outsideName);
			}
			
			var listTemp = zipTemp.list();
							
			for (let ii in listTemp) {
				var elTemp = listTemp[ii];
				if (!(elTemp.name.match(/MANIFEST.MF$/)) && !(elTemp.name.match(/ECLIPSE_.RSA$/))) {
					zipNew.putFile(elTemp.name, zipTemp.getFile(elTemp.name));	
				}
			}
			zipTemp.close();
		} else {
			if( el.name.match(/MANIFEST.MF$/) ) {
				var str;

				str = af.fromBytes2String(zip.getFile(el.name));
				
				var newClass = (isDef(mainClass)) ? mainClass : "openaf.AFCmdOS"; 
				if ((str.match(/jarinjarloader/) && str.match(/eclipse/) )) {
					str = str.replace(/org\.eclipse\.jdt\.internal\.jarinjarloader\.JarRsrcLoader/, newClass);
				} else {
					str = str.replace(/^Main-Class: .+$/m, "Main-Class: " + newClass);
                }
				zipNew.putFile(el.name, af.fromString2Bytes(str));
			} else {				
				if (!(el.name.match(/jarinjarloader/))) {
					if (!el.outside)
						zipNew.putFile(el.name, zip.getFile(el.name));
					else
						zipNew.putFile(el.name, io.readFileBytes(el.outsideName));
				}
			}
		}
	}

	ow.loadObj();
	var ilist = "JarIndex-Version: 1.0\n\n" + 
				$from(ow.obj.fromObj2Array(zipNew.list()))
				.notStarts("name", "META-INF/")
				.ends("name", "/")
				.select((r)=>{ return r.name.substr(0, r.name.length -1); })
				.join("\n");
	zipNew.putFile("META-INF/INDEX.LIST", af.fromString2Bytes(ilist));
	log("Writing new repacked openaf.jar...");
	zipNew.generate2File(classPath + ".tmp", {"compressionLevel": 9}, true);
	createTmp = true;
	zip.close();
	zipNew.close();
} else {
	log("OpenAF is repacked.");
}

if (createTmp) {
	io.writeFileBytes(classPath.replace(/\\/g, "/"), io.readFileBytes(classPath.replace(/openaf.jar/, "openaf.jar.tmp")));
	io.rm(classPath.replace(/openaf.jar/, "openaf.jar.tmp"));
}

log("Done repacking OpenAF.jar");
// We need to stop (but no longer needed)
//java.lang.System.exit(0);
} catch(e) { printErr(e); if (isDef(e.javaException)) se.javaException.printStackTrace(); }