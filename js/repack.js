//
// Author: nuno.aguiar@wedotechnologies.com

plugin("ZIP");

//Check if a Jar was repacked
function isRepackJar(aJarFilePath) {
	var res = true;

	var aJar = new ZIP();
	try {
		aJar.loadFile(aJarFilePath);
		var listJar = aJar.list();

		for(i in listJar) {
			if(listJar[i].name.match(/jarinjarloader/) && listJar[i].name.match(/eclipse/)) {
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

	for(i in plugins) {
		var libsOut = _.flatten($from(vad.plugins).equals("name", plugins[i]).equals("removable", true).select(function(r) { return r.deps; }));
		var libsIn  = _.flatten($from(vad.plugins).not().equals("name", plugins[i]).select(function(r) { return r.deps; }));

		toExclude = toExclude.concat(_.without(libsOut, libsIn));
	}

	return _.uniq(toExclude);
}

try {
  var curDir    = java.lang.System.getProperty("user.dir") + "";
  var classPath = java.lang.System.getProperty("java.class.path") + "";
} catch (e) {
  logErr("Couldn't retrieve system properties: " + e.message);
  java.lang.System.exit(0);
}

log("Repacking OpenAF for faster loading");

var zip    = new ZIP();
var zipNew = new ZIP();

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

	
if (!irj || __expr != "") {
	var oldVersionFile = classPath.replace(/openaf.jar/, "openaf.jar.orig");
	
	if (!irj) {
		log("Backup to " + oldVersionFile);
		af.writeFileBytes(oldVersionFile, af.readFileBytes(classPath));
	}
	
	var toExclude = [];
	if (__expr != "") toExclude = getModulesToExclude();

	zip.loadFile(oldVersionFile);
	var list = zip.list();

	for(i in list) {
		var el = list[i];
		
		if (toExclude.indexOf(el.name) > 0) {
			log("Excluding " + el.name);
			continue;
		}
		
		if(el.name.match(/\.jar$/)) {
			var zipTemp = new ZIP();
			zipTemp.load(zip.getFile(el.name));
			var listTemp = zipTemp.list();
			for (ii in listTemp) {
				var elTemp = listTemp[ii];
				if (!(elTemp.name.match(/MANIFEST.MF$/)) && !(elTemp.name.match(/ECLIPSE_.RSA$/))) {
					zipNew.putFile(elTemp.name, zipTemp.getFile(elTemp.name));
				}
			}
			zipTemp.close();
		} else {
			if( el.name.match(/MANIFEST.MF$/) ) {
				var str = af.fromBytes2String(zip.getFile(el.name));
				if ((str.match(/jarinjarloader/) && str.match(/eclipse/) )) {
					str = str.replace(/org\.eclipse\.jdt\.internal\.jarinjarloader\.JarRsrcLoader/, Packages.wedo.openaf.AFCmdBase.afc.getClass().getName());
					zipNew.putFile(el.name, af.fromString2Bytes(str));
				}
			} else {				
				if (!(el.name.match(/jarinjarloader/))) 
					zipNew.putFile(el.name, zip.getFile(el.name));
			}
		}
	}

	af.writeFileBytes(classPath, zipNew.generate({"compressionLevel": 9}));
	zip.close();
	zipNew.close();

} else {
	log("No repacking needed.");
}

log("Done repacking OpenAF.jar");
// We need to stop
java.lang.System.exit(0);
} catch(e) { printErr(e); e.javaException.printStackTrace(); }