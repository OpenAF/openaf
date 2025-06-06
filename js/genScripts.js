// Generate OpenAF scripts
// Copyright 2023 Nuno Aguiar

// VARIABLES
// ---------
var requirements = {
  "javaversion": [ "^1.8" ]
};
var modulesOpens = new Set([
  "java.base/java.io",

])
var modulesExports = new Set([
  "jdk.attach/sun.tools.attach",
  "jdk.internal.jvmstat/sun.jvmstat.monitor",
  "jdk.internal.jvmstat/sun.jvmstat.perfdata.monitor.protocol.local",
  "java.base/sun.security.util",
  "java.base/jdk.internal.misc",
  "java.base/sun.nio.ch",
  "java.management/com.sun.jmx.mbeanserver",
  "java.base/sun.reflect.generics.reflectiveObjects",
  "java.management/sun.management",
  "java.base/sun.security.x509",
  "java.base/sun.security.util"
])

const determineIfModuleExists = (javaVer, module) => {
  if (javaVer < 9) return false

  var [ _m, _e ] = module.split("/")

  let finder = java.lang.module.ModuleFinder.ofSystem()
  let moduleRef = finder.find(_m)
  if (moduleRef.isPresent()) {
    return true
  } else {
    return false
  }
}

var extraArgsForJava8 = ""
//var extraArgsForJava9 = " --add-opens java.base/java.io=ALL-UNNAMED --add-exports jdk.attach/sun.tools.attach=ALL-UNNAMED --add-exports jdk.internal.jvmstat/sun.jvmstat.monitor=ALL-UNNAMED --add-exports jdk.internal.jvmstat/sun.jvmstat.perfdata.monitor.protocol.local=ALL-UNNAMED --add-exports java.base/sun.security.util=ALL-UNNAMED --add-exports=java.base/jdk.internal.misc=ALL-UNNAMED --add-exports=java.base/sun.nio.ch=ALL-UNNAMED --add-exports=java.management/com.sun.jmx.mbeanserver=ALL-UNNAMED --add-exports=jdk.internal.jvmstat/sun.jvmstat.monitor=ALL-UNNAMED --add-exports=java.base/sun.reflect.generics.reflectiveObjects=ALL-UNNAMED --illegal-access=permit";
var extraArgsForJava9 = " --illegal-access=permit "
var extraArgsForJava10 = extraArgsForJava9 + " ";
//var extraArgsForJava11 = " --add-opens java.base/java.io=ALL-UNNAMED --add-exports jdk.attach/sun.tools.attach=ALL-UNNAMED --add-exports jdk.internal.jvmstat/sun.jvmstat.monitor=ALL-UNNAMED --add-exports jdk.internal.jvmstat/sun.jvmstat.perfdata.monitor.protocol.local=ALL-UNNAMED --add-exports java.base/sun.security.util=ALL-UNNAMED --add-exports=java.base/jdk.internal.misc=ALL-UNNAMED --add-exports=java.base/sun.nio.ch=ALL-UNNAMED --add-exports=java.management/com.sun.jmx.mbeanserver=ALL-UNNAMED --add-exports=java.base/sun.reflect.generics.reflectiveObjects=ALL-UNNAMED --add-exports java.management/sun.management=ALL-UNNAMED --illegal-access=permit -Xshare:off";
var extraArgsForJava11 = " --illegal-access=permit -Xshare:off "
var extraArgsForJava12 = extraArgsForJava11 + " ";
//var extraArgsForJava17 = " --add-opens java.base/java.io=ALL-UNNAMED --add-exports jdk.attach/sun.tools.attach=ALL-UNNAMED --add-exports jdk.internal.jvmstat/sun.jvmstat.monitor=ALL-UNNAMED --add-exports jdk.internal.jvmstat/sun.jvmstat.perfdata.monitor.protocol.local=ALL-UNNAMED --add-exports java.base/sun.security.util=ALL-UNNAMED --add-exports=java.base/jdk.internal.misc=ALL-UNNAMED --add-exports=java.base/sun.nio.ch=ALL-UNNAMED --add-exports=java.management/com.sun.jmx.mbeanserver=ALL-UNNAMED --add-exports=java.base/sun.reflect.generics.reflectiveObjects=ALL-UNNAMED --add-exports java.management/sun.management=ALL-UNNAMED --add-exports java.base/sun.security.x509=ALL-UNNAMED --add-exports java.base/sun.security.util=ALL-UNNAMED -Xshare:off";
var extraArgsForJava17 = " -Xshare:off "
var extraArgsForJava24 = " --enable-native-access=ALL-UNNAMED "
var DEFAULT_SH = "/bin/sh";
var noopacks = false;

var __genScriptsUpdate;
if (isUnDef(__genScriptsUpdate)) __genScriptsUpdate = [];

var javaargs = "";
for(var i in __args) {
	if (__args[i].match(/^args=/i)) {
 		javaargs = __args[i].replaceAll("^args=", "");
		__expr = __expr.replace(String(__args[i]), "");
  	}
}
if (javaargs.indexOf("$OAF_JARGS") >= 0) logWarn("There shouldn't be any references to OAF_JARGS in the provided arguments. Generated scripts might no longer work.")
if (javaargs != "") log("Java arguments to use = '" + javaargs + "'");

for(var j in __args) {
   if (__args[j].matches("--noopacks")) noopacks = true;
}

// FUNCTIONS
// ---------
function checkRequirements() {
  var bFoundJavaVer = 0;

  for(i in requirements.javaversion) {
     if(javaVer.match(requirements.javaversion[i])) bFoundJavaVer = 1;
  }

  if(bFoundJavaVer) logErr("Current java version '" + javaVer + "' is not supported");
}

function generateWinBat() {
  var s;

  s = "@echo off\n\n";
  s = s + "set thispath=%~dp0\n"
  s = s + "set DIR=%thispath:~0,-1%\n"
  s = s + "rem if not %JAVA_HOME% == \"\" set JAVA_HOME=\"" + javaHome + "\"\n";
  s = s + "set JAVA_HOME=\"" + javaHome + "\"\n";
  s = s + "set OAF_DIR=\"" + classPath + "\"\n";
  s = s + "\n";
  s = s + "chcp 65001 > NUL\n";
  s = s + "%JAVA_HOME%\\bin\\java %OAF_JARGS% " + javaargs + " -D\"file.encoding=UTF-8\" -D\"java.system.class.loader=openaf.OAFdCL\" -jar %OAF_DIR% %*";
  return s;
}

function generateWinPackBat() {
  var s;

  s = "@echo off\n\n";
  s = s + "set thispath=%~dp0\n"
  s = s + "set DIR=%thispath:~0,-1%\n"
  s = s + "rem if not %JAVA_HOME% == \"\" set JAVA_HOME=\"" + javaHome + "\"\n";
  s = s + "set JAVA_HOME=\"" + javaHome + "\"\n";
  s = s + "set OAF_DIR=\"" + classPath + "\"\n";
  s = s + "\n";
  s = s + "chcp 65001 > NUL\n";
  s = s + "%JAVA_HOME%\\bin\\java %OAF_JARGS% " + javaargs + " -D\"file.encoding=UTF-8\" -D\"java.system.class.loader=openaf.OAFdCL\" -jar %OAF_DIR% --opack -e \"%*\"";
  return s;
}

function generateWinOAFPBat() {
  var s;

  s = "@echo off\n\n";
  s = s + "set thispath=%~dp0\n"
  s = s + "set DIR=%thispath:~0,-1%\n"
  s = s + "rem if not %JAVA_HOME% == \"\" set JAVA_HOME=\"" + javaHome + "\"\n";
  s = s + "set JAVA_HOME=\"" + javaHome + "\"\n";
  s = s + "set OAF_DIR=\"" + classPath + "\"\n";
  s = s + "\n";
  s = s + "chcp 65001 > NUL\n";
  s = s + "%JAVA_HOME%\\bin\\java %OAF_JARGS% " + javaargs + " -D\"file.encoding=UTF-8\" -D\"java.system.class.loader=openaf.OAFdCL\" -jar %OAF_DIR% -c \"load(getOpenAFJar()+'::js/oafp.js')\" -e \"%*\"";
  return s;
}

function generateWinJobBat() {
  var s;

  s = "@echo off\n\n";
  s = s + "set thispath=%~dp0\n"
  s = s + "set DIR=%thispath:~0,-1%\n"
  s = s + "rem if not %JAVA_HOME% == \"\" set JAVA_HOME=\"" + javaHome + "\"\n";
  s = s + "set JAVA_HOME=\"" + javaHome + "\"\n";
  s = s + "set OAF_DIR=\"" + classPath + "\"\n";
  s = s + "\n";
  s = s + "chcp 65001 > NUL\n";
  s = s + "%JAVA_HOME%\\bin\\java %OAF_JARGS% " + javaargs + " -D\"file.encoding=UTF-8\" -D\"java.system.class.loader=openaf.OAFdCL\" -jar %OAF_DIR% --ojob -e \"%*\"";
  return s;
}

function generateWinUpdateBat() {
  var s;
  s = "@echo off\n\n";
  s += "set thispath=%~dp0\n"
  s += "set DIR=%thispath:~0,-1%\n"
  s += "rem if not %JAVA_HOME% == \"\" set JAVA_HOME=\"" + javaHome + "\"\n";
  s += "set JAVA_HOME=\"" + javaHome + "\"\n";
  s += "set OAF_DIR=\"" + classPath + "\"\n";
  s += "\n";
  s = s + "chcp 65001 > NUL\n";
  s += "%JAVA_HOME%\\bin\\java %OAF_JARGS% " + javaargs + " -D\"file.encoding=UTF-8\" -D\"java.system.class.loader=openaf.OAFdCL\" -jar %OAF_DIR% --update\n";
  if (isDef(__genScriptsUpdate) && isArray(__genScriptsUpdate)) {
    __genScriptsUpdate.forEach(r => {
      s += "%JAVA_HOME%\\bin\\java %OAF_JARGS% " + javaargs + " -D\"file.encoding=UTF-8\" -D\"java.system.class.loader=openaf.OAFdCL\" -jar %OAF_DIR% " + r + "\n";
    });
  }
  return s;
}

function generateWinConsoleBat() {
  var s;

  s = "@echo off\n\n";
  s = s + "set thispath=%~dp0\n"
  s = s + "set DIR=%thispath:~0,-1%\n"
  s = s + "rem if not %JAVA_HOME% == \"\" set JAVA_HOME=\"" + javaHome + "\"\n";
  s = s + "set JAVA_HOME=\"" + javaHome + "\"\n";
  s = s + "set OAF_DIR=\"" + classPath + "\"\n";
  s = s + "\n";
  s = s + "chcp 65001 > NUL\n";
  s = s + "%JAVA_HOME%\\bin\\java " + javaargs + " -D\"file.encoding=UTF-8\" -D\"java.system.class.loader=openaf.OAFdCL\" -jar %OAF_DIR% --console %*";
  return s;
}

function generateWinConsolePSBat() {
  var s;

  s = "@echo off\n\n";
  //s = s + "powershell -ExecutionPolicy Unrestricted -command \"&{ [Console]::OutputEncoding = [System.Text.Encoding]::GetEncoding('1252'); $pshost = get-host; $console = $pshost.UI.RawUI; $console.WindowTitle = 'OpenAF-console'; $console.ForegroundColor = 'black'; $console.BackgroundColor = 'white'; $newsize = $console.windowsize; $newsize.width = 120; $newsize.height = 55; $console.windowsize = $newsize; $newsize = $console.buffersize; $newsize.width = 120; $newsize.height = 3000; $console.buffersize = $newsize; Clear-Host; $JAVA_HOME = '" + javaHome + "'; $OAF_DIR = '" + classPath + "'; $cmd = '&\\\"' + $JAVA_HOME + '\\bin\\java\\\" " + javaargs + " -D\\\"java.system.class.loader=openaf.OAFdCL\\\" -jar \"' + $OAF_DIR + '\" --console'; iex $cmd; }\"";
  s = s + "powershell -ExecutionPolicy Unrestricted -command \"&{ $pshost = get-host; $console = $pshost.UI.RawUI; $console.WindowTitle = 'OpenAF-console'; $console.ForegroundColor = 'black'; $console.BackgroundColor = 'white'; $newsize = $console.windowsize; $newsize.width = 120; $newsize.height = 55; $console.windowsize = $newsize; $newsize = $console.buffersize; $newsize.width = 120; $newsize.height = 3000; $console.buffersize = $newsize; Clear-Host; $JAVA_HOME = '" + javaHome + "'; $OAF_DIR = '" + classPath + "'; $cmd = '&\\\"' + $JAVA_HOME + '\\bin\\java\\\" " + javaargs + " -D\\\"java.system.class.loader=openaf.OAFdCL\\\" -jar \"' + $OAF_DIR + '\" --console'; iex $cmd; }\"";
  return s;
}

function generateUnixScript(options, shouldSep, extraOptions, isCon) {
  var s;

  if (typeof shLocation === 'undefined') {
    if (windows == 1) {
      // for cygwin
      shLocation = DEFAULT_SH; 
      javaHome = javaHome.replace(/\\/g, "/");
      javaHome = javaHome.replace(/(\w)\:/,"/cygdrive/$1").toLowerCase();
    } else {
      try {
        if (io.fileExists(DEFAULT_SH)) {
          shLocation = DEFAULT_SH;
        } else {
          shLocation = af.sh("which sh", "", null, false);
        }
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
  s += "cd \"$CDIR\"\n"
  if (isCon) s += "stty -icanon min 1 -echo 2>/dev/null\n";
  s += "#if [ -z \"${JAVA_HOME}\" ]; then \nJAVA_HOME=\"" + javaHome + "\"\n#fi\n";
  s += "OAF_DIR=\"" + classPath + "\"\n";
  if (io.getDefaultEncoding() != "UTF-8") s += "export LANG=\"${LANG:-C.UTF-8}\"\n";
  if (shouldSep) {
    s += "SCRIPT=$1\n";
    s += "if [ $# -gt 0 ]; then\n"
    s += "  shift\n"
    s += "fi"
  }
  if (options.indexOf("$ARGS") >= 0) {
    s += `
if command -v sed > /dev/null 2>&1; then
  escape_space() {
      echo "$1" | sed 's/\\([^\\\\]\\) /\\1\\\\ /g' | sed 's/"/\\\\"/g'
  }

  escaped_args=""
  for arg in "$@"; do
      escaped_arg=$(escape_space "$arg")
      ARGS="$ARGS $escaped_arg"
  done
else
  ARGS=$@
fi
`
  }
  s += "\n";
  s += "\"$JAVA_HOME\"/bin/java $OAF_JARGS " + javaargs + " -D\"file.encoding=UTF-8\" -Djava.system.class.loader=openaf.OAFdCL -Djline.terminal=jline.UnixTerminal -jar $OAF_DIR " + options + "\n";
  if (isDef(extraOptions) && isArray(extraOptions)) {
    extraOptions.forEach(r => {
      s += "\"$JAVA_HOME\"/bin/java $OAF_JARGS " + javaargs + " -D\"file.encoding=UTF-8\" -Djava.system.class.loader=openaf.OAFdCL -Djline.terminal=jline.UnixTerminal -jar $OAF_DIR " + r + "\n";
    });
  }
  s += "EXITCODE=$?\n";
  if (isCon) s += "stty icanon echo 2>/dev/null\n";
  s += "exit $EXITCODE\n";
  return s;
}

// MAIN
// ----

log("Generate scripts");

// Variables
var os        = "";
var curDir    = "";
var javaVer   = "";
var javaHome  = "";
var classPath = "";
var inSameDir = false

var windows = 0;
var shLocation;

try {
  var os        = String(java.lang.System.getProperty("os.name"));
  var curDir    = String(java.lang.System.getProperty("user.dir"));
  var javaVer   = String(java.lang.System.getProperty("java.version")).replace(/^1\./, "").replace(/(\d+).*/, "$1");
  var javaHome  = String(java.lang.System.getProperty("java.home"));
  var classPath = getOpenAFJar();
} catch (e) {
  logErr("Couldn't retrieve system properties: " + e.message);
  java.lang.System.exit(0);
}

var jh = javaHome.replace(/\\/g, "/");
if (jh.substring(0, getOpenAFPath().lastIndexOf("/")+1) == getOpenAFPath()) {
  inSameDir = true
  javaHome = (os.match(/Windows/) ? "%DIR%" : "$DIR") + "/" + jh.substring(getOpenAFPath().lastIndexOf("/")+1)
}
classPath = (os.match(/Windows/) ? "%DIR%" : "$DIR") + "/" + classPath.substring(getOpenAFJar().lastIndexOf("/") + 1)

if(os.match(/Windows/)) {
	log("Identified system as Windows = '" + os + "'");
  windows = 1;
} else {
	log("Identified system as a Unix flavour = '" + os + "'");
  windows = 0;
}

log("Current directory = '" + curDir + "'");
log("Running java version = '" + javaVer + "'");
log("Current classpath = '" + classPath + "'");
log("Java home = '" + javaHome + "'");
log("Checking requirements");

if (!isNull(Number(javaVer))) {
  // modules opens
  if (Number(javaVer) >= 9) {
    javaargs += " " + Array.from(modulesOpens.values()).map(mod => {
      if (determineIfModuleExists(javaVer, mod)) {
        return "--add-opens " + mod + "=ALL-UNNAMED"
      } else {
        logWarn("Module " + mod + " doesn't exist in the current JVM. Ignoring it.")
      }
    }).join(" ").trim() + " "
    // modules exports
    javaargs += " " + Array.from(modulesExports.values()).map(mod => {
      if (determineIfModuleExists(javaVer, mod)) {
        return " --add-exports " + mod + "=ALL-UNNAMED "
      } else {
        logWarn("Module " + mod + " doesn't exist in the current JVM. Ignoring it.")
      }
    }).join(" ").trim() + " "

    javaargs = javaargs.replace(/ +/g, " ").trim()
  }
}

if (Number(javaVer) != null && Number(javaVer) == 8) javaargs += " " + extraArgsForJava8
if (Number(javaVer) != null && Number(javaVer) == 9) javaargs += " " + extraArgsForJava9;  
if (Number(javaVer) != null && Number(javaVer) == 10) javaargs += " " + extraArgsForJava10;
if (Number(javaVer) != null && Number(javaVer) == 11) javaargs += " " + extraArgsForJava11;
if (Number(javaVer) != null && Number(javaVer) > 11 && Number(javaVer) < 17) javaargs += " " + extraArgsForJava12;
if (Number(javaVer) != null && Number(javaVer) >= 17) javaargs += " " + extraArgsForJava17;
if (Number(javaVer) != null && Number(javaVer) >= 24) javaargs += " " + extraArgsForJava24;

var winBat = generateWinBat();
var winPackBat = generateWinPackBat();
var winJobBat = generateWinJobBat();
var winConsoleBat = generateWinConsoleBat();
//var winConsolePSBat = generateWinConsolePSBat();

var unixScript, unixSB, unixSBoJob, unixSBoafp, unixPackScript, unixJobScript, unixConsoleScript, unixUpdateScript, unixOAFPScript

//if (windows == 0) {
  unixScript = generateUnixScript("\"$@\"")
  unixSB = generateUnixScript("-f \"$SCRIPT\" -e \"$ARGS\"", true);
  unixSBoJob = generateUnixScript("--ojob -e \"$SCRIPT $ARGS\"", true)
  unixPackScript = generateUnixScript("--opack -e \"$*\"")
  unixJobScript = generateUnixScript("--ojob -e \"$SCRIPT $ARGS\"", true)
  unixPyScript = generateUnixScript("--py -e \"$SCRIPT $ARGS\"", true)
  unixConsoleScript = generateUnixScript("--console \"$@\"", __, __, true)
  unixOAFPScript = generateUnixScript("-c \"load(getOpenAFJar()+'::js/oafp.js')\" -e \"$ARGS\"")
  unixSBoafp = generateUnixScript("-c \"load(getOpenAFJar()+'::js/oafp.js')\" -e \"_shebang=true $OAFP_ARGS $ARGS\"")
  unixUpdateScript = generateUnixScript("--update", void 0, __genScriptsUpdate);
//}

try {
  if (windows == 1) io.writeFileString(curDir + "\\openaf.bat", winBat);
  if (windows == 1) io.writeFileString(curDir + "\\oaf.bat", winBat);
  if (windows == 1) io.writeFileString(curDir + "\\opack.bat", winPackBat);
  if (windows == 1) io.writeFileString(curDir + "\\ojob.bat", winJobBat);
  if (windows == 1) io.writeFileString(curDir + "\\openaf-console.bat", winConsoleBat);
  if (windows == 1) io.writeFileString(curDir + "\\oafc.bat", winConsoleBat);
  if (windows == 1 && isUnDef(getOPackPath("oafproc")) ) io.writeFileString(curDir + "\\oafp.bat", generateWinOAFPBat())
  //if (windows == 1) io.writeFileString(curDir + "\\openaf-console-ps.bat", winConsolePSBat);
  if (windows == 1) {
    io.writeFileBytes(curDir + "\\openaf.ico", io.readFileBytes(getOpenAFJar() + "::fonts/openaf.ico"));
    sh("powershell \"$sh=New-Object -COM WScript.Shell;$s=$sh.CreateShortcut('" + curDir + "\\OpenAF CONSOLE.lnk');$s.TargetPath='" + curDir + "\\openaf-console-ps.bat';$s.Description='OpenAF-console';$s.IconLocation='" + curDir + "\\openaf.ico';$s.WorkingDirectory='" + curDir + "';$s.save()\"", undefined, undefined, true);
  }
  io.writeFileString(curDir + "/openaf", unixScript);
  io.writeFileString(curDir + "/oaf", unixScript);
  io.writeFileString(curDir + "/openaf-sb", unixSB);
  io.writeFileString(curDir + "/oaf-sb", unixSB);
  io.writeFileString(curDir + "/ojob-sb", unixSBoJob);
  io.writeFileString(curDir + "/oafp-sb", unixSBoafp)
  io.writeFileString(curDir + "/opack", unixPackScript);
  io.writeFileString(curDir + "/ojob", unixJobScript);
  io.writeFileString(curDir + "/pyoaf", unixPyScript)
  io.writeFileString(curDir + "/openaf-console", unixConsoleScript);
  io.writeFileString(curDir + "/oafc", unixConsoleScript);
  if (isUnDef(getOPackPath("oafproc"))) io.writeFileString(curDir + "/oafp", unixOAFPScript)
} catch (e) {
  logErr("Couldn't write file: " + e.message);
  java.lang.System.exit(0);
}

if (windows == 0) {
  try {
	  sh("chmod a+x " + curDir + "/openaf", "", null, false);
	  sh("chmod a+x " + curDir + "/oaf", "", null, false);
    sh("chmod a+x " + curDir + "/openaf-sb", "", null, false);
    sh("chmod a+x " + curDir + "/oaf-sb", "", null, false);
    sh("chmod a+x " + curDir + "/ojob-sb", "", null, false);
    sh("chmod a+x " + curDir + "/oafp-sb", "", null, false)
	  sh("chmod a+x " + curDir + "/opack", "", null, false);
	  sh("chmod a+x " + curDir + "/ojob", "", null, false);
    sh("chmod a+x " + curDir + "/pyoaf", "", null, false)
	  sh("chmod a+x " + curDir + "/openaf-console", "", null, false);
	  sh("chmod a+x " + curDir + "/oafc", "", null, false);
    sh("chmod a+x " + curDir + "/oafp", "", null, false)
  }	catch(e) {
	  logErr("Couldn't change permissions: " + e.message);
  }
} 

log("Verify the generated scripts and change the JAVA_HOME and/or OPENAF variables accordingly");

if (!noopacks) {
  $from(io.listFiles(curDir).files).ends("filename", ".opack").select(function(r) {
     log("Trying to install " + r.filename + "...");
     oPack("install " + r.filepath);
     // After installing try renaming the file (#369)
     try { io.mv(r.filepath, r.filepath.replace(/\.opack$/, ".opack.installed")) } catch(e) { /* ignore errors */ }
  });
}

// Checking opack list
log("Checking oPacks...");
ow.loadObj(); 
loadLodash(); 
_.uniq(ow.obj.fromObj2Array(getOPackLocalDB(), "path").map(r => { 
  return { name: r.name, path: r.path } 
})).map(r => { 
  if (r.name != "OpenAF" && !io.fileExists(r.path)) { 
    oPack("remove4db " + r.name); 
    oPack("add2db " + getOpenAFPath() + r.name);
  } 
});

log("Removing old paths...");
var o = getOPackLocalDB(); 
var p = {}; 
Object.keys(o).forEach(r => { 
  if (r != "OpenAF" && (io.fileExists(r + "/" + PACKAGEYAML) || io.fileExists(r + "/" + PACKAGEJSON))) p[r] = o[r]; 
}); 
log("Rewriting local oPacks db...");
plugin("ZIP"); 
var zip = new ZIP(); 
zip.streamPutFile(getOpenAFPath() + "/.opack.db", "packages.json", af.fromString2Bytes(stringify(p)));

// Checking if reinstall script can be built
/*ow.loadFormat();
var jh = ow.format.getJavaHome().replace(/\\/g, "/");
if (jh.substring(0, jh.lastIndexOf("/")+1) == getOpenAFPath()) {
  if (windows == 1) {
    log("Generating reinstall.bat...");
    io.writeFileString(curDir + "/reinstall.bat", "@echo off\n\n" +  jh.substring(jh.lastIndexOf("/")+1) + "\\bin\\java -jar openaf.jar --install\n");
  } else {
    log("Generating reinstall.sh...");
    io.writeFileString(curDir + "/reinstall.sh", "#!" + shLocation + "\n\n" +  jh.substring(jh.lastIndexOf("/")+1) + "/bin/java -jar openaf.jar --install\n");
    sh("chmod u+x " + curDir + "/reinstall.sh", "", null, false);
  }
}*/

const updateJavaSh = 
`cd $DIR
./ojob ojob.io/oaf/javaUpdate
if [ -e "jre.tgz" ]; then
  rm -rf jre.old 2> /dev/null
  mv jre jre.old
  tar xzf jre.tgz 
fi
cd $CDIR
`

const updateJavaBat = 
`cd /D "%DIR%"
ojob ojob.io/oaf/javaUpdate
IF EXIST "jre.zip" (
    rd /S /Q "jre.old" 2> NUL
    move /Y "jre" "jre.old"
    tar -xf jre.zip -C jre
)
cd /D "%CDIR%"
`

if (!noHomeComms) {
  if (windows == 1) {
    log("Generating update.bat...");
    io.writeFileString(curDir + "/update.bat", generateWinUpdateBat());
  } else {
    log("Generating update.sh...");
    io.writeFileString(curDir + "/update.sh", unixUpdateScript.replace(/\"\$JAVA_HOME\"/, updateJavaSh + "\n\"$JAVA_HOME\""));
    $sh("chmod u+x " + curDir + "/update.sh").exec();
  }
}

log("Done installing scripts");

af.load(getOpenAFJar() + "::js/repack.js");
