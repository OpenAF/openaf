//
// Author: Nuno Aguiar

// VARIABLES
// ---------
var requirements = {
  "javaversion": [ "^1.7" ]
};
var DEFAULT_SH = "/bin/sh";
var noopacks = false;

var javaargs = "";
for(var i in __args) {
	if (__args[i].match(/^args=/i)) javaargs = __args[i].replaceAll("^args=", "");
}
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
  s = s + "rem if not %JAVA_HOME% == \"\" set JAVA_HOME=\"" + javaHome + "\"\n";
  s = s + "set JAVA_HOME=\"" + javaHome + "\"\n";
  s = s + "set OPENAF_DIR=\"" + classPath + "\"\n";
  s = s + "\n";
  s = s + "%JAVA_HOME%\\bin\\java " + javaargs + " -jar %OPENAF_DIR% %*";
  return s;
}

function generateWinPackBat() {
  var s;

  s = "@echo off\n\n";
  s = s + "rem if not %JAVA_HOME% == \"\" set JAVA_HOME=\"" + javaHome + "\"\n";
  s = s + "set JAVA_HOME=\"" + javaHome + "\"\n";
  s = s + "set OPENAF_DIR=\"" + classPath + "\"\n";
  s = s + "\n";
  s = s + "%JAVA_HOME%\\bin\\java " + javaargs + " -jar %OPENAF_DIR% --opack -e \"%*\"";
  return s;
}

function generateWinJobBat() {
	  var s;

	  s = "@echo off\n\n";
	  s = s + "rem if not %JAVA_HOME% == \"\" set JAVA_HOME=\"" + javaHome + "\"\n";
	  s = s + "set JAVA_HOME=\"" + javaHome + "\"\n";
	  s = s + "set OPENAF_DIR=\"" + classPath + "\"\n";
	  s = s + "\n";
	  s = s + "%JAVA_HOME%\\bin\\java " + javaargs + " -jar %OPENAF_DIR% --ojob -e \"%*\"";
	  return s;
	}

function generateWinConsoleBat() {
  var s;

  s = "@echo off\n\n";
  s = s + "rem if not %JAVA_HOME% == \"\" set JAVA_HOME=\"" + javaHome + "\"\n";
  s = s + "set JAVA_HOME=\"" + javaHome + "\"\n";
  s = s + "set OPENAF_DIR=\"" + classPath + "\"\n";
  s = s + "\n";
  s = s + "%JAVA_HOME%\\bin\\java " + javaargs + " -jar %OPENAF_DIR% --console %*";
  return s;
}

function generateWinConsolePSBat() {
  var s;

  s = "@echo off\n\n";
  s = s + "powershell -ExecutionPolicy Unrestricted -command \"&{ [Console]::OutputEncoding = [System.Text.Encoding]::GetEncoding(1252); $pshost = get-host; $console = $pshost.UI.RawUI; $console.WindowTitle = 'OpenAF-console'; $console.ForegroundColor = 'black'; $console.BackgroundColor = 'white'; $newsize = $console.buffersize; $newsize.width = 120; $newsize.height = 3000; $console.buffersize = $newsize; $newsize = $console.windowsize; $newsize.width = 120; $newsize.height = 55; $console.windowsize = $newsize; Clear-Host; $JAVA_HOME = '" + javaHome + "'; $OPENAF_DIR = '" + classPath + "'; $cmd = '&\\\"' + $JAVA_HOME + '\\bin\\java\\\" " + javaargs + " -jar \"' + $OPENAF_DIR + '\" --console'; iex $cmd; }\"";
  return s;
}

function generateUnixScript(options){
  var s;

  if (typeof shLocation === 'undefined') {
    if (windows == 1) {
      // for cygwin
      shLocation = DEFAULT_SH; 
      javaHome = javaHome.replace(/\\/g, "/");
      javaHome = javaHome.replace(/(\w)\:/,"/cygdrive/$1").toLowerCase();
    } else {
      try {
        shLocation = af.sh("which sh", "", null, false);
      } catch (e) {
        logErr("Couldn't determine path for sh, assuming " + DEFAULT_SH + ": " + e.message);
        shLocation = DEFAULT_SH;
      }
    }

    log("sh located in "+ shLocation);
  }

  s = "#!" + shLocation + "\n\n";
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

// MAIN
// ----

log("Generate scripts");

// Variables
var os        = "";
var curDir    = "";
var javaVer   = "";
var javaHome  = "";
var classPath = "";

var windows = 0;
var shLocation;

try {
  var os        = java.lang.System.getProperty("os.name") + "";
  var curDir    = java.lang.System.getProperty("user.dir") + "";
  var javaVer   = java.lang.System.getProperty("java.version") + "";
  var javaHome  = java.lang.System.getProperty("java.home") + "";
  var classPath = java.lang.System.getProperty("java.class.path") + "";
  
  classPath = (new java.io.File(classPath)).getAbsoluteFile();
} catch (e) {
  logErr("Couldn't retrieve system properties: " + e.message);
  java.lang.System.exit(0);
}

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

var winBat = generateWinBat();
var winPackBat = generateWinPackBat();
var winJobBat = generateWinJobBat();
var winConsoleBat = generateWinConsoleBat();
var winConsolePSBat = generateWinConsolePSBat();
var unixScript = generateUnixScript("\"$@\"");
var unixSB = generateUnixScript("-s -i script -f \"$@\"");
var unixPackScript = generateUnixScript("--opack -e \"$*\"");
var unixJobScript = generateUnixScript("--ojob -e \"$*\"");
var unixConsoleScript = generateUnixScript("--console \"$@\"");

try {
  if (windows == 1) io.writeFileString(curDir + "\\openaf.bat", winBat);
  if (windows == 1) io.writeFileString(curDir + "\\opack.bat", winPackBat);
  if (windows == 1) io.writeFileString(curDir + "\\ojob.bat", winJobBat);
  if (windows == 1) io.writeFileString(curDir + "\\openaf-console.bat", winConsoleBat);
  if (windows == 1) io.writeFileString(curDir + "\\openaf-console-ps.bat", winConsolePSBat);
  if (windows == 1) {
    io.writeFileBytes(curDir + "\\openaf.ico", io.readFileBytes(getOpenAFJar() + "::fonts/openaf.ico"));
    sh("powershell \"$sh=New-Object -COM WScript.Shell;$s=$sh.CreateShortcut('" + curDir + "\\OpenAF CONSOLE.lnk');$s.TargetPath='" + curDir + "\\openaf-console-ps.bat';$s.Description='OpenAF-console';$s.IconLocation='" + curDir + "\\openaf.ico';$s.WorkingDirectory='" + curDir + "';$s.save()\"", undefined, undefined, true);
  }
  io.writeFileString(curDir + "/openaf", unixScript);
  io.writeFileString(curDir + "/openaf-sb", unixSB);
  io.writeFileString(curDir + "/opack", unixPackScript);
  io.writeFileString(curDir + "/ojob", unixJobScript);
  io.writeFileString(curDir + "/openaf-console", unixConsoleScript);
} catch (e) {
  logErr("Couldn't write file: " + e.message);
  java.lang.System.exit(0);
}

if (windows == 0) {
  try {
	  sh("chmod u+x " + curDir + "/openaf", "", null, false);
	  sh("chmod u+x " + curDir + "/openaf-sb", "", null, false);
	  sh("chmod u+x " + curDir + "/opack", "", null, false);
	  sh("chmod u+x " + curDir + "/ojob", "", null, false);
	  sh("chmod u+x " + curDir + "/openaf-console", "", null, false);
  }	catch(e) {
	  logErr("Couldn't change permissions: " + e.message);
  }
} 

log("Verify the generated scripts and change the JAVA_HOME and/or OPENAF variables accordingly");

if (!noopacks) {
  $from(io.listFiles(curDir).files).ends("filename", ".opack").select(function(r) {
     log("Trying to install " + r.filename + "...");
     oPack("install " + r.filepath);
  });
}

log("Done installing scripts");

af.load(classPath + "::js/repack.js");
