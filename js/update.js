//
// Author: Nuno Aguiar

// Update to the latest version
//
plugin("HTTP");
plugin("ZIP");

// VARIABLES
// ---------
var homeServerURLs = __openafRelease;
var homeServerURLs2 = __openafBuild;
var updateURLs = __openafDownload;
var currentVersion = getVersion();

var endCommand = "";
var updated = false;

// FUNCTIONS
// ---------
function updateURL(pos, version) {
	return updateURLs[pos] + "/openaf-" + version + ".jar";
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
  var os        = String(java.lang.System.getProperty("os.name"));
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
			//var zip = new ZIP();
			//zip.load(down.responseBytes());
			var oldVersionFile = classPath.replace(/openaf.jar/, "openaf.jar.old");
			log("Backup current version to " + oldVersionFile);
			io.writeFileBytes(oldVersionFile, io.readFileBytes(classPath));
			log("Upgrading openaf.jar");
			try {
				io.writeFileBytes(classPath.replace(/openaf.jar/, "openaf.jar.tmp"), down.responseBytes());
				updated = true;
			} catch(e) {
				if(!e.message.match(/NoClassDefFoundError/)) {
					throw e;
				}
			}
			//zip.close();
		} else {
			log("This is an updated version. No update needed.");
		}

		break;
	} catch(e) {
		logErr("Error while updating OpenAF: " + e.message);
	}
}

log("Done updating to the latest version."); //" Don't forget to run the --repack option before using for the first time for faster startup times.");
log("Trying to --repack...");

if (updated) {
	io.writeFileBytes(classPath.replace(/\\/g, "/"), io.readFileBytes(classPath.replace(/openaf.jar/, "openaf.jar.tmp")));
	af.rm(classPath.replace(/openaf.jar/, "openaf.jar.tmp"));

	af.restartOpenAF(["--repack"]);
}

//af.load(classPath + "::js/repack.js");
