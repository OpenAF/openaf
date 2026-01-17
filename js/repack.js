//
// Copyright 2024 Nuno Aguiar

plugin("ZIP");
ow.loadObj()
ow.loadFormat()
ow.loadNet()
__logFormat.async = false

var createTmp = false;

//Check if a Jar was repacked and if main class is no longer openaf.Launcher
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
	
	var vad = io.readFileJSON(getOpenAFJar() + "::versionsAndDeps.json");

	for(let i in plugins) {
		var libsOut = _.flatten($from(vad.plugins).equals("name", plugins[i]).equals("removable", true).select(function(r) { return r.deps; }));
		var libsIn  = _.flatten($from(vad.plugins).notEquals("name", plugins[i]).select(function(r) { return r.deps; }));
	
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
var forceRepack = false;

var irj = isRepackJar(classPath);
log("Checking OpenAF launcher...")
if (irj && isUnDef(getEnv("__OAF_MAINCLASS"))) {
	var _zip = new ZIP()
	var str = af.fromBytes2String(_zip.streamGetFile(classPath, "META-INF/MANIFEST.MF"))
	if (str.match(/Main-Class: openaf.Launcher/)) {
		var _newClass = (isDef(mainClass)) ? mainClass : "openaf.AFCmdOS"
		log("Replacing main class with " + _newClass + "...")
		str = str.replace(/Main-Class: openaf.Launcher/g, "Main-Class: " + _newClass)
		// On Windows the JVM holds the JAR open, so defer to repack + swap
		if (os.toLowerCase().indexOf("windows") >= 0) {
			mainClass = _newClass
			forceRepack = true
			log("Will update MANIFEST during repack (Windows lock).")
		} else {
			_zip.streamPutFile(classPath, "META-INF/MANIFEST.MF", af.fromString2Bytes(str))
		}
	}
}

//try {
// Set .package.json	

packJson = jsonParse(af.fromBytes2String(zip.streamGetFile(getOpenAFJar(), ".package.json")));
packJson.version = getVersion();

var fileDB = getOpenAFPath() + "/" + PACKAGESJSON_DB;

var packages = {};
var zipdb = new ZIP();
try {
	packages = af.fromJson(af.fromBytes2String(zipdb.streamGetFile(fileDB, PACKAGESJSON)));
} catch(e) {
	 if (!(e.message.match(/FileNotFoundException|NoSuchFileException/))) logErr(e.message);
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
		logWarn("OpenCli needs to be updated to match the version " + af.getVersion());
		if (io.fileExists(r.path + "/.url")) {
			var _url = io.readFileYAML(r.path + "/.url")
			var _c = ""
			if (isDef(_url.c2)) _c = $t(_url.c2, {version: getVersion(), distribution: getDistribution() }); _c = String(eval(_url.c))
			var [host,port] = ow.net.host4URL(_c).split(":")
			if (!noHomeComms && ow.net.testPort(host,port)) {
				logWarn("Trying to execute 'opack install " + _c + "'...")
				restartOpenAF(["--opack", "-e", "install " + _c], __, true)
				exit(0, true)
			} else {
				logWarn("Please execute --> 'opack install " + _c + "' or equivalent. <--" )
			}
		}
	} else {
		log("Executing prepack actions from oPack '" + r.name + "'");
		try {
			var s = newFn(r.scripts.prerepack);
			s();
		} catch(e) {
			logErr("opack '" + r.name + "': " + e);
		}
	}
});

if (!irj || __expr != "" || Object.keys(includeMore).length > 0 || forceRepack) {
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

	var c = 0, maxS = 0
	for(let i in list) {
		c++;
		var el = list[i];

		var m = "Progress " + Math.round(c * 100 / Object.keys(list).length) + "% (" + c + "/" + Object.keys(list).length + ")\r"
		if (maxS < m.length) maxS = m.length
		lognl(m);
		
		if (toExclude.indexOf(el.name) >= 0) {
			lognl(repeat(maxS, " ") + "\r")
			log("Excluding " + el.name);
			continue;
		}  
		
		if(el.name.match(/\.jar$/)) {
			var zipTemp = new ZIP();

			/*if (el.name.match(/tools-attach.jar$/) &&
			    Packages.jodd.util.ClassLoaderUtil.findToolsJar() != null) {
				zipTemp.loadFile(String(Packages.jodd.util.ClassLoaderUtil.findToolsJar()));
			} else {*/
				if (!el.outside) 
					zipTemp.load(zip.getFile(el.name));
				else
					zipTemp.loadFile(el.outsideName);
			//}
			
			var listTemp = zipTemp.list();
							
			for (let ii in listTemp) {
				var elTemp = listTemp[ii];
				if (!(elTemp.name.match(/MANIFEST.MF$/)) && 
				    !(elTemp.name.match(/ECLIPSE_.RSA$/)) &&
				    (elTemp.name != "META-INF/services/java.net.spi.InetAddressResolverProvider") &&
					(elTemp.name != "META-INF/services/sun.net.spi.nameservice.NameServiceDescriptor")) {
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
				if (el.name != "META-INF/services/java.net.spi.InetAddressResolverProvider" && 
					el.name != "META-INF/services/sun.net.spi.nameservice.NameServiceDescriptor") {
					if (!(el.name.match(/jarinjarloader/))) {
						if (!el.outside)
							zipNew.putFile(el.name, zip.getFile(el.name));
						else
							zipNew.putFile(el.name, io.readFileBytes(el.outsideName));
					}
				}
			}
		}
	}

	ow.loadObj();
	var ilist = "JarIndex-Version: 1.0\n\n" + 
				$from($m4a(zipNew.list()))
				.notStarts("name", "META-INF/")
				.ends("name", "/")
				.select((r)=>{ return r.name.substr(0, r.name.length -1); })
				.join("\n")
	zipNew.putFile("META-INF/INDEX.LIST", af.fromString2Bytes(ilist));
	ow.format.printWithWaiting(() => {
		zipNew.generate2File(classPath + ".tmp", {"compressionLevel": 9}, true)
	}, "Writing new repacked openaf.jar ", "Repacked openaf.jar done.", "Problem with repacking openaf.jar!", __, __, lognl)
	createTmp = true;
	zip.close();
	zipNew.close();
} else {
	log("OpenAF is repacked.");
}

if (createTmp) {
	var _tmpPath = classPath.replace(/openaf.jar/, "openaf.jar.tmp")
	var _isWindows = os.toLowerCase().indexOf("windows") >= 0
	if (_isWindows) {
		try {
			var _updBat = classPath.replace(/openaf.jar/, "update-openaf.bat")
			var _bat = [
				"@echo off",
				"setlocal EnableExtensions",
				"set DIR=%~dp0",
				"set SRC=\"%DIR%openaf.jar.tmp\"",
				"set DST=\"%DIR%openaf.jar\"",
				":wait",
				"timeout /T 1 /NOBREAK >nul",
				"copy %SRC% %DST% >nul 2>&1",
				"if errorlevel 1 goto wait",
				"del %SRC% >nul 2>&1",
				//"if errorlevel 1 goto wait",
				"set OAF_JARGS=\"-Xshare:dump -XX:SharedArchiveFile=%DIR%.shared.oaf %OAF_JARGS%\"",
				"\"%DIR%oaf.bat\" -c \"ow.loadOJob();loadOAFP();loadTOON();loadJSYAML();loadPy();ow.loadSec();loadLodash();loadFuse();ow.loadFormat();ow.loadObj();ow.loadServer();loadUnderscore();ow.loadMetrics();loadJSYAML();ow.loadPython();ow.loadTemplate();loadHandlebars();__initializeCon();loadCompiledLib('jmespath_js');oafp({data:'()'});oJobRun({todo:[]})\"",
				"del /F /Q \"%~f0\" >nul 2>&1"
			].join("\r\n")
			io.writeFileString(_updBat, _bat)
			// Launch updater detached to swap files after this process exits
			//$sh([_updBat.replace(/\//g, "\\")]).exec()
			$sh(_updBat).dontWait(true).get()
			log("Scheduled Windows update of openaf.jar; exiting to unlock file...")
			exit(0, true)
		} catch(e) {
			logErr("Couldn't schedule Windows update: " + e)
			$err(e)
		}
	} else {
		io.writeFileBytes(classPath.replace(/\\/g, "/"), io.readFileBytes(_tmpPath))
		io.rm(_tmpPath)
	}
}

// Create archived classes (CDS)
log("(re)Creating OpenAF shared archive...");
//var _res = $sh([ow.format.getJavaHome() + "/bin/java", "-XX:ArchiveClassesAtExit=" + getOpenAFPath() + ".shared.oaf", "-jar", getOpenAFJar(), "-c", "ow.loadOJob();loadOAFP();ow.loadSec();loadLodash();loadFuse();ow.loadFormat();ow.loadObj();ow.loadServer();loadUnderscore();ow.loadMetrics();loadJSYAML();ow.loadPython();ow.loadTemplate();loadHandlebars();__initializeCon();loadCompiledLib('jmespath_js');oafp({data:'()'});oJobRun({todo:[]})"])
//           .get(0)
var _jaorig = getEnv("OAF_JARGS")
if (isUnDef(_jaorig)) _jaorig = ""
var os = String(java.lang.System.getProperty("os.name"))
var isWindows = os.toLowerCase().indexOf("windows") >= 0

var _res = $sh([getOpenAFPath() + "oaf" + (isWindows ? ".bat" : ""), "-c", "ow.loadOJob();loadOAFP();ow.loadSec();loadLodash();loadFuse();ow.loadFormat();ow.loadObj();ow.loadServer();loadUnderscore();ow.loadMetrics();loadJSYAML();ow.loadPython();ow.loadTemplate();loadHandlebars();__initializeCon();loadCompiledLib('jmespath_js');oafp({data:'()'});oJobRun({todo:[]})"])
           .envs({ OAF_JARGS: "-Xshare:dump -XX:SharedArchiveFile=" + getOpenAFPath() + ".shared.oaf " + _jaorig }, true)
		   .get(0)
if (_res.exitcode != 0) {
	logErr("Error creating OpenAF shared archive: " + _res.stderr);
}

log("Done repacking OpenAF.jar");
// We need to stop
//exit(0, true)
//} catch(e) { $err(e) }