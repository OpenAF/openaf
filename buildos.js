// Build OpenAF
//
plugin("ZIP");

var params = processExpr();

var OPENAF_BUILD_HOME = (isUndefined(params.withDir)) ? "." : params.withDir;
var OPENAF_JSON = (isDef(params.withJSON)) ? params.withJSON : undefined;
var OPENAF_DIST = (isDef(params.withDist)) ? params.withDist : undefined;
var OPENAF_LIB = OPENAF_BUILD_HOME + "/lib";
var OPENAF_SRC = OPENAF_BUILD_HOME + "/src";
var OPENAF_BIN = OPENAF_BUILD_HOME + "/bin";
var OPENAF_JS = OPENAF_BUILD_HOME + "/js";
var JAVAC = "javac";
var smallClassPath = "";

var EXTERNAL = false;
if (isDefined(params.external)) EXTERNAL = true;

log("Building params:");
log("   BUILD_HOME = " + OPENAF_BUILD_HOME);
log("   JSON       = " + OPENAF_JSON);
log("   DIST       = " + OPENAF_DIST);
log("   LIB        = " + OPENAF_LIB);
log("   SRC        = " + OPENAF_SRC);
log("   BIN        = " + OPENAF_BIN);
log("   JS         = " + OPENAF_JS);
log("   JAVAC      = " + JAVAC);
log("   EXTERNAL   = " + EXTERNAL);

var INTERNAL_LICENSE = "See license info in openaf.jar/LICENSE and openaf.jar/LICENSES.txt";
var EXTERNAL_LICENSE = "See license info in openaf.jar/LICENSE and openaf.jar/LICENSES.txt";

function buildDeps() {
	loadUnderscore();

	// Check javascript dependencies
	var l = io.listFilenames(OPENAF_BUILD_HOME + "/js");
	var ss = {};

	for (var i in l) {
		if (l[i].match(/\.js$/))
			ss[l[i]] = _.uniq(io.readFileString(l[i]).match(/plugin\([^\)]+\)/g))
	};

	return ss;
}

function buildClasspath() {
	var classpath = "";

	var listfiles = io.listFiles(OPENAF_LIB);

	if (isUndefined(listfiles)) {
		logErr("Didn't found the OPENAF_LIB. Please configure it.");
		java.lang.System.exit(0);
	}

	for (var i in listfiles.files) {
		if (!listfiles.files[i].filename.match("\.jar$")) continue;
		if (listfiles.files[i].filename.match("af.jar") || listfiles.files[i].filename.match("af.jar")) continue;
		log("Including " + listfiles.files[i].filename);
		classpath += listfiles.files[i].filepath;
		smallClassPath += " " + listfiles.files[i].filename + "";
		if (i < (listfiles.files.length - 1)) classpath += PATHSEPARATOR;
	}

	var tmp = smallClassPath + " compiledJS.jar";
	for (var i = 0; i <= Math.floor(smallClassPath.length / 70); i++) {
		tmp = tmp.substr(0, i * 70) + "\n " + tmp.substr(i * 70, tmp.length);
	}
	smallClassPath = tmp;

	return classpath;
}

function listFiles(aPath, aFilter, aExcludeFilter) {
	var listfiles = io.listFiles(aPath);
	var arrayFiles = [];

	for (i in listfiles.files) {
		if (listfiles.files[i].isDirectory) {
			arrayFiles = arrayFiles.concat(listFiles(listfiles.files[i].filepath, aFilter, aExcludeFilter));
		} else {
			if (listfiles.files[i].filename.match(new RegExp(aFilter))) {
				if (!(isDefined(aExcludeFilter) && (listfiles.files[i].filepath.replace(/\\/g, "/").match(new RegExp(aExcludeFilter)) != null)))
					arrayFiles.push(listfiles.files[i].filepath);
			}
		}
	}

	return arrayFiles;
}

function buildSource() {
	var sourcePath = "";

	log("Finding sources...");
	var excludeFilter;
	excludeFilter = "plugins/Wedo";
	var arrayList = listFiles(OPENAF_SRC, ".+\.java$", excludeFilter);
	log("Found #" + arrayList.length + " java sources.");
	sourcePath = arrayList.join(" ");

	return sourcePath;
}

// MAIN
// ----
log("Init build");
var os = java.lang.System.getProperty("os.name") + "";
var PATHSEPARATOR = (os.match(/Windows/)) ? ";" : ":";

var dateFormat = new java.text.SimpleDateFormat("yyyyMMdd");
var release = (isDef(params.withVersion)) ? params.withVersion : dateFormat.format(new java.util.Date());

log("Building release " + release);
var classpath = buildClasspath();

log("Changing AFCmdOS for release = " + release);
var javaAFCmd = io.readFileString(OPENAF_SRC + "/openaf/AFCmdBase.java");
javaAFCmd = javaAFCmd.replace(/public static String VERSION = "([0-9]+)";/m, "public static String VERSION = \"" + release + "\";");

if (EXTERNAL)
	javaAFCmd = javaAFCmd.replace(/public static String LICENSE = "([^\"]+)";/m, "public static String LICENSE = \"" + EXTERNAL_LICENSE + "\";");
else
	javaAFCmd = javaAFCmd.replace(/public static String LICENSE = "([^\"]+)";/m, "public static String LICENSE = \"" + INTERNAL_LICENSE + "\";");

if (isDef(OPENAF_DIST))
	javaAFCmd = javaAFCmd.replace(/public static String DISTRIBUTION = "([^\"]+)";/m, "public static String DISTRIBUTION = \"" + OPENAF_DIST + "\";");

io.writeFileString(OPENAF_SRC + "/openaf/AFCmdBase.java", javaAFCmd);

log("Changing openaf.js variables according with release");
var jsOpenAF = io.readFileString(OPENAF_BUILD_HOME + "/js/openaf.js");
if (EXTERNAL)
	jsOpenAF = jsOpenAF.replace(/var noHomeComms = ([a-z]+);/m, "var noHomeComms = true;");
else
	jsOpenAF = jsOpenAF.replace(/var noHomeComms = ([a-z]+);/m, "var noHomeComms = false;");

io.writeFileString(OPENAF_BUILD_HOME + "/js/openaf.js", jsOpenAF);

io.rm(OPENAF_BIN);
io.mkdir(OPENAF_BIN);
var cmd = JAVAC + " -cp " + classpath + " -source 1.7 -target 1.7 -Xlint:deprecation -d " + OPENAF_BIN + " " + buildSource();
log("Compiling...");
log(af.sh(cmd, "", undefined, true));
if (__exitcode != 0) {
	logErr("Error compiling: " + __stderr);
}

var tempJar = new ZIP(io.readFileBytes(OPENAF_BUILD_HOME + "/jar-in-jar-loader.zip"));
var binFiles = listFiles(OPENAF_BIN, "\.class$");
log("#" + binFiles.length + " binary files identified.");
binFiles = binFiles.concat(classpath.split(PATHSEPARATOR));
//var transformPathBin = (os.match(/Windows/)) ? OPENAF_BIN.replace(/\//g, "\\") : OPENAF_BIN;
//var transformPathLib = (os.match(/Windows/)) ? OPENAF_LIB.replace(/\//g, "\\") : OPENAF_LIB;
var transformPathBin = OPENAF_BIN;
var transformPathLib = OPENAF_LIB;
for (var i in binFiles) {
	tempJar.putFile(binFiles[i].replace(transformPathLib, "").replace(transformPathBin, "").replace(/\\/g, "/").replace(/^\//, ""), io.readFileBytes(binFiles[i]));
}

log("Adding extra files...");

var packjson = io.readFile(OPENAF_BUILD_HOME + "/.package.json");
packjson.version = release + "";
//tempJar.putFile("log4j.properties", io.readFileBytes(OPENAF_BUILD_HOME + "/log4j.properties"));
tempJar.putFile("versionsAndDeps.json", io.readFileBytes(OPENAF_BUILD_HOME + "/versionsAndDeps.json"));
tempJar.putFile("LICENSE", io.readFileBytes(OPENAF_BUILD_HOME + "/LICENSE"));
tempJar.putFile("LICENSES.txt", io.readFileBytes(OPENAF_BUILD_HOME + "/LICENSES.txt"));
/*if (isUnDef(OPENAF_JSON)) {
	tempJar.putFile("openaf.json", io.readFileBytes(OPENAF_BUILD_HOME + "/openaf.json"));
        log("Added " + OPENAF_BUILD_HOME + "/openaf.json...");
} else {
	tempJar.putFile("openaf.json", io.readFileBytes(OPENAF_JSON));
        log("Added " + OPENAF_JSON + "...");
}*/
tempJar.putFile(".package.json", af.fromString2Bytes(beautifier(packjson)));

log("Adding css files...");
var cssList = listFilesRecursive(OPENAF_BUILD_HOME + "/css");
for (i in cssList) {
	var file = cssList[i];
	if (file.isFile) {
		tempJar.putFile(file.filepath.replace(OPENAF_BUILD_HOME, "").replace(/\\/g, "/").replace(/^\//, ""), io.readFileBytes(OPENAF_BUILD_HOME + "" + file.filepath.replace(OPENAF_BUILD_HOME, "")));
	}
};

log("Adding fonts files...");
var fontsList = listFilesRecursive(OPENAF_BUILD_HOME + "/fonts");
for (i in fontsList) {
	var file = fontsList[i];
	if (file.isFile) {
		tempJar.putFile(file.filepath.replace(OPENAF_BUILD_HOME, "").replace(/\\/g, "/").replace(/^\//, ""), io.readFileBytes(OPENAF_BUILD_HOME + "" + file.filepath.replace(OPENAF_BUILD_HOME, "")));
	}
}

log("Adding hbs files...");
var hbsList = listFilesRecursive(OPENAF_BUILD_HOME + "/hbs");
for (i in hbsList) {
	var file = hbsList[i];
	if (file.isFile) {
		tempJar.putFile(file.filepath.replace(OPENAF_BUILD_HOME, "").replace(/\\/g, "/").replace(/^\//, ""), io.readFileBytes(OPENAF_BUILD_HOME + "" + file.filepath.replace(OPENAF_BUILD_HOME, "")));
	}
}

var jsList = io.listFiles(OPENAF_BUILD_HOME + "/js").files;
var origjssha = {
	files: []
};
var destjssha = {
	files: []
};
try {
	origjssha = io.readFile(OPENAF_BUILD_HOME + "/buildSHA.json");
} catch (e) {}

io.mkdir(OPENAF_BUILD_HOME + "/jsmin");
io.mkdir(OPENAF_BUILD_HOME + "/jslib");

var zipJSlib = new ZIP();
var validationForCompile = (filename) => { return (filename != "synaptic.js" && filename != "materialize.js" && filename != "handlebars.js" && filename != "jquery.js" && filename != "highlight.js"); };
var validationForRequireCompile = (filename) => { return (filename == "handlebars.js" || filename == "showdown.js" || filename == "synaptic.js"); };

//for(i in jsList) {
parallel4Array(jsList, function (i) {
try {	
	var file = i;
	if (file.isFile) {
		//if (file.filename == 'ow.waf.js' || file.filename == 'ow.portal.js') return i;
		log("Adding " + file.filename);
		if (file.filename !== 'example.js' &&
			file.filename !== 'underscore.js' &&
			file.filename !== 'materialize.js' &&
			file.filename !== 'showdown.js' &&
			file.filename !== 'stream.js' &&
			file.filename !== 'js-yaml.js' &&
			file.filename !== 'highlight.js' &&
			file.filename !== 'ajv.js' &&
			file.filename !== 'fusejs.js' &&
			file.filename !== 'handlebars.js' &&
			file.filename !== 'jquery.js') {

			var doIt = true;
			var origF = $from(origjssha.files).equals("file", file.filename).select();
			if (origF.length > 0) {
				if (sha1(io.readFileStream(OPENAF_BUILD_HOME + "/js/" + file.filename)) == origF[0].orig &&
					sha1(io.readFileStream(OPENAF_BUILD_HOME + "/jsmin/" + file.filename)) == origF[0].dest) {
					destjssha.files.push(origF[0]);
					doIt = false;
				}
			}

			if (doIt) {
				log("-> Compiling " + file.filename);
				var output = af.sh("java -jar " + OPENAF_BUILD_HOME + "/compiler.jar --language_out ECMASCRIPT5 --env CUSTOM --strict_mode_input false --rewrite_polyfills false --js " + OPENAF_BUILD_HOME + "/js/" + file.filename + " --js_output_file " + OPENAF_BUILD_HOME + "/jsmin/" + file.filename, "", null, false);
				log("<- Compiled  " + file.filename);
				destjssha.files.push({
					file: file.filename,
					orig: sha1(io.readFileStream(OPENAF_BUILD_HOME + "/js/" + file.filename)),
					dest: sha1(io.readFileStream(OPENAF_BUILD_HOME + "/jsmin/" + file.filename))
				});
				if (output.length > 0) log(file.filename + ": " + output);
				if (__stderr.length > 0) {
					if (__stderr.match(/ WARNING - /))
						logWarn(file.filename + ": " + __stderr);
					else
						logErr(file.filename + ": " + __stderr);
				}
			}

			if (validationForCompile(file.filename))
			  af.compileToClasses(file.filename.replace(/\./g, "_"), io.readFileString(OPENAF_BUILD_HOME + "/jsmin/" + file.filename), OPENAF_BUILD_HOME + "/jslib");
			if (validationForRequireCompile(file.filename))
			  af.compileToClasses(file.filename.replace(/\./g, "_"), "var __" + file.filename.replace(/\./g, "_") + " = function(require, exports, module) {" + io.readFileString(OPENAF_BUILD_HOME + "/jsmin/" + file.filename) + "}", OPENAF_BUILD_HOME + "/jslib");
			sync(function () {
				tempJar.putFile("js/" + file.filename, io.readFileBytes(OPENAF_BUILD_HOME + "/jsmin/" + file.filename));
				if (validationForCompile(file.filename) || validationForRequireCompile(file.filename)) zipJSlib.putFile(file.filename.replace(/\./g, "_") + ".class", io.readFileBytes(OPENAF_BUILD_HOME + "/jslib/" + file.filename.replace(/\./g, "_") + ".class" ));
			}, tempJar);
		} else {
			if (validationForCompile(file.filename))
			  af.compileToClasses(file.filename.replace(/\./g, "_"), io.readFileString(OPENAF_BUILD_HOME + "/js/" + file.filename), OPENAF_BUILD_HOME + "/jslib");
			if (validationForRequireCompile(file.filename))
			  af.compileToClasses(file.filename.replace(/\./g, "_"), "var __" + file.filename.replace(/\./g, "_") + " = function(require, exports, module) {" + io.readFileString(OPENAF_BUILD_HOME + "/js/" + file.filename) + "}", OPENAF_BUILD_HOME + "/jslib");			  
			sync(function () {
				tempJar.putFile("js/" + file.filename, io.readFileBytes(OPENAF_BUILD_HOME + "/js/" + file.filename));
				if (validationForCompile(file.filename) || validationForRequireCompile(file.filename)) zipJSlib.putFile(file.filename.replace(/\./g, "_") + ".class", io.readFileBytes(OPENAF_BUILD_HOME + "/jslib/" + file.filename.replace(/\./g, "_") + ".class" ));				
			}, tempJar);
		}
	}
	return i;
} catch(e) { }
return true;
});

tempJar.putFile("compiledJS.jar", zipJSlib.generate({"compressionLevel": 9}));
zipJSlib.close();

try {
	io.writeFile(OPENAF_BUILD_HOME + "/buildSHA.json", destjssha);
} catch (e) {
	sprintErr(e);
}

// Build Manifest
log("Adding manifest");
var manifest = "Manifest-Version: 1.0\n";
manifest += "Rsrc-Class-Path: ./" + smallClassPath + "\n";
manifest += "Class-Path: .\n";
manifest += "Rsrc-Main-Class: openaf._AFCmdOS\n";
manifest += "Main-Class: org.eclipse.jdt.internal.jarinjarloader.JarRsrcLoader\n";
tempJar.putFile("META-INF/MANIFEST.MF", af.fromString2Bytes(manifest));
tempJar.putFile("META-INF/services/javax.script.ScriptEngineFactory", af.fromString2Bytes("openaf.OAFEngineFactory"));

// Build ODoc
try {
	log("Building ODoc documentation");
	var helpFiles = {
		"odoc": OPENAF_BUILD_HOME + "/js/odoc.js",
		"ow.test": OPENAF_BUILD_HOME + "/js/owrap.test.js",
		"ow.format": OPENAF_BUILD_HOME + "/js/owrap.format.js",
		"ow.template": OPENAF_BUILD_HOME + "/js/owrap.template.js",
		"ow.java": OPENAF_BUILD_HOME + "/js/owrap.java.js",
		"ow.server": OPENAF_BUILD_HOME + "/js/owrap.server.js",
		"ow.obj": OPENAF_BUILD_HOME + "/js/owrap.obj.js",
		"ow.ai": OPENAF_BUILD_HOME + "/js/owrap.ai.js",
		"ow.ch": OPENAF_BUILD_HOME + "/js/owrap.ch.js",
		"ow.oJob": OPENAF_BUILD_HOME + "/js/owrap.oJob.js",
		"ow.metrics": OPENAF_BUILD_HOME + "/js/owrap.metrics.js",
		"ow.python": OPENAF_BUILD_HOME + "/js/owrap.python.js",
		"afbase": OPENAF_BUILD_HOME + "/src/openaf/AFBase.java",
		"io": OPENAF_BUILD_HOME + "/src/openaf/IOBase.java",
		"iocore": OPENAF_BUILD_HOME + "/src/openaf/core/IO.java",
		"csv": OPENAF_BUILD_HOME + "/src/openaf/core/CSV.java",
		"db": OPENAF_BUILD_HOME + "/src/openaf/core/DB.java",
		"console": OPENAF_BUILD_HOME + "/src/openaf/plugins/Console.java",
		"threads": OPENAF_BUILD_HOME + "/src/openaf/plugins/Threads.java",
		"email": OPENAF_BUILD_HOME + "/src/openaf/plugins/Email.java",
		"http": OPENAF_BUILD_HOME + "/src/openaf/plugins/HTTP.java",
		"httpd": OPENAF_BUILD_HOME + "/src/openaf/plugins/HTTPServer.java",
		"jmx": OPENAF_BUILD_HOME + "/src/openaf/plugins/JMX.java",
		"jmxserver": OPENAF_BUILD_HOME + "/src/openaf/plugins/JMXServer.java",
		"ssh": OPENAF_BUILD_HOME + "/src/openaf/plugins/SSH.java",
		"snmp": OPENAF_BUILD_HOME + "/src/openaf/plugins/SNMP.java",
		"snmpd": OPENAF_BUILD_HOME + "/src/openaf/plugins/SNMPServer.java",
		"xml": OPENAF_BUILD_HOME + "/src/openaf/plugins/XML.java",
		"xls": OPENAF_BUILD_HOME + "/src/openaf/plugins/XLS.java",
		//"svn": OPENAF_BUILD_HOME + "/src/openaf/plugins/SVN.java",
		"git": OPENAF_BUILD_HOME + "/src/openaf/plugins/GIT.java",
		//"smb": OPENAF_BUILD_HOME + "/src/openaf/plugins/SMB.java",
		"zip": OPENAF_BUILD_HOME + "/src/openaf/plugins/ZIP.java",
		//"ignite": OPENAF_BUILD_HOME + "/src/openaf/plugins/Ignite.java",
		"bsdiff": OPENAF_BUILD_HOME + "/src/openaf/plugins/BSDiff.java",
		"scope": OPENAF_BUILD_HOME + "/js/openaf.js",
		"scopesigil": OPENAF_BUILD_HOME + "/js/openafsigil.js",
		"index": OPENAF_BUILD_HOME + "/js/example.js"
	};
	saveHelp(OPENAF_BUILD_HOME, helpFiles);
	log("Generating oDoc for Web");
	io.mkdir(OPENAF_BUILD_HOME + "/odocweb");
	saveHelpWeb(OPENAF_BUILD_HOME + "/odocweb", helpFiles);
	tempJar.putFile(".odoc.db", io.readFileBytes(OPENAF_BUILD_HOME + "/.odoc.db"));
} catch (e) {
	logErr(e);
}

if (isUnDef(OPENAF_JSON)) {
	tempJar.putFile("openaf.json", io.readFileBytes(OPENAF_BUILD_HOME + "/openaf.json"));
        log("Added " + OPENAF_BUILD_HOME + "/openaf.json...");
} else {
	tempJar.putFile("openaf.json", io.readFileBytes(OPENAF_JSON));
        log("Added " + OPENAF_JSON + "...");
}

//Build deps
log("Building dependencies");
io.writeFileString(OPENAF_BUILD_HOME + "/dependencies.json", stringify(buildDeps()));

log("Creating the openaf.jar in " + OPENAF_BUILD_HOME);
io.rm(OPENAF_BUILD_HOME + "/openaf.jar");
tempJar.generate2File(OPENAF_BUILD_HOME + "/openaf.jar", { compressionLevel: 9 }, true);
tempJar.close();

log("Done build");
