//
// Author: nuno.aguiar@wedotechnologies.com

// Update to the latest version
//
plugin("HTTP");
plugin("ZIP");

// VARIABLES
// ---------
var homeServerURLs = [
     "http://192.168.40.110/d/openaf/latest",
     "http://172.25.1.32/d/openaf/latest"
];
var homeServerURLs2 = [
     "http://192.168.40.110/d/openaf/release",
     "http://172.25.1.32/d/openaf/release"
];
var updateURLs = [
     "http://192.168.40.110/d/openaf",
     "http://172.25.1.32/d/openaf"
];
var currentVersion = getVersion();

// FUNCTIONS
// ---------
function updateURL(pos, version) {
	return updateURLs[pos] + "/openaf-" + version + ".zip";
}


// MAIN
// ----

if (noHomeComms) {
	log("Update functionality has been disabled on this restricted release.");
	exit(0);
}

log("Update to the latest version");
log("Current version = " + currentVersion);

try {
  var curDir    = java.lang.System.getProperty("user.dir") + "";
  var classPath = java.lang.System.getProperty("java.class.path") + "";
} catch (e) {
  logErr("Couldn't retrieve system properties: " + e.message);
  java.lang.System.exit(0);
}

for(var i in homeServerURLs) {
	var homeServerURL = homeServerURLs[i];
	var homeServerURL2 = homeServerURLs2[i];

	log("Trying to contact OpenAF home server = '" + homeServerURL + "'");
	try {
		var homeServer = new HTTP(homeServerURL, undefined, undefined, undefined, false, 5000);
		var latestVersion = homeServer.response().trim();
		var homeServer2 = new HTTP(homeServerURL2, undefined, undefined, undefined, false, 5000);
		var latestVersion2 = homeServer2.response().trim();
		log("Latest base version = " + latestVersion + " (build " + latestVersion2 + ")");

		var force = false;
		for(var j in __args) {
			if (__args[j].matches("--force")) force = true;
		}
		if(latestVersion2 > currentVersion || force) {
			if(latestVersion2 > currentVersion) {
				log("There is a newer version. Downloading it from " + updateURL(i, latestVersion) + ". This may take some seconds.");
			} else {
				log("Downloading it from " + updateURL(i, latestVersion) + ". This may take some seconds.");
			}
			var down = new HTTP(updateURL(i, latestVersion), "GET", "", {}, true, 5000);
			log("Processing download.");
			var zip = new ZIP();
			zip.load(down.responseBytes());
			var oldVersionFile = classPath.replace(/openaf.jar/, "openaf.jar.old");
			log("Backup current version to " + oldVersionFile);
			af.writeFileBytes(oldVersionFile, af.readFileBytes(classPath));
			log("Upgrading openaf.jar");
			try {
				af.writeFileBytes(classPath.replace(/openaf.jar/, "openaf.jar"), zip.getFile("openaf.jar"));
			} catch(e) {
				if(!e.message.match(/NoClassDefFoundError/)) {
					throw e;
				}
			}
			zip.close();
		} else {
			log("This is an updated version. No update needed.");
		}

		break;
	} catch(e) {
		logErr("Error while updating OpenAF: " + e.message);
	}
}

log("Done updating to the latest version."); //" Don't forget to run the --repack option before using for the first time for faster startup times.");
log("Trying to --repack");
af.restartOpenAF(["--repack"]);

//af.load(classPath + "::js/repack.js");