// OPENAF common functions
// Copyright 2023 Nuno Aguiar

af.eval("const self = this; const global = self; const __ = void 0; const __oafInit = Number(java.lang.System.currentTimeMillis());");

/**
 * <odoc>
 * <key>getOpenAFJar() : String</key>
 * Returns the complete filepath and name for the OpenAF jar file. (Shortcut for af.getOpenAFJar()).
 * If __forcedOpenAFJar is defined the corresponding value will be used (useful when detection of the OpenAF jar
 * doesn't work as expected or when OpenAF is embedded. 
 * </odoc>
 */
var __forcedOpenAFJar;
function getOpenAFJar() {
	var res = "";
	if (isDef(__forcedOpenAFJar)) 
		res = __forcedOpenAFJar;
	else
		res = String(af.getOpenAFJar()).replace(/\\/g, "/");
	
	return res;
}

var noHomeComms = false;
var __genScriptsUpdate = [];
var __noSLF4JErrorOnly;
//Set openaf variables

/**
 * <odoc>
 * <key>isJavaClass(aObj) : boolean</key>
 * Return true if aObj is a Java class, false otherwise
 * </odoc>
 */
const isJavaClass = function(obj) {
	if (Object.prototype.toString.call(obj).indexOf(" JavaClass") >= 0) return true; else return false
}

/**
 * <odoc>
 * <key>isJavaObject(aObj) : boolean</key>
 * Returns true if aObj is a Java object, false otherwise
 * </odoc>
 */
const isJavaObject = obj => {
	//var s = Object.prototype.toString.call(obj);
	//return (s === '[object JavaObject]' || s === '[object JavaArray]');
	/*try {
		if (obj.getClass() instanceof java.lang.Object)
			return true
		else
			return false
	} catch(e) {
		if (String(e).indexOf("getClass") >= 0) {
			try {
				var s = Object.prototype.toString.call(obj)
				return s.indexOf("object Java") >= 0
			} catch(e1) {
				return false
			}
		}
		return false
	}*/
	try {
		if (obj != null && typeof obj.getClass === 'function' && Object.prototype.toString.call(obj) === '[object JavaObject]') {
			return true
		} else {
			return false
		}
	} catch(e) {
		return obj.getClass() instanceof java.lang.Object
	}
}

/**
 * <odoc>
 * <key>isJavaArray(aObj) : boolean</key>
 * Returns true if aObj is a Java array, false otherwise
 * </odoc>
 */
const isJavaArray = obj => {
	try {
		if (obj != null && typeof obj.getClass === 'function' && Object.prototype.toString.call(obj) === '[object JavaArray]') {
			return true
		} else {
			return false
		}
	} catch(e) {
		return obj.getClass() instanceof java.lang.Object
	}
}

/**
 * <odoc>
 * <key>isDef(aObject) : boolean</key>
 * Returns true if the provided aObject is defined as a javascript variable. It will return false otherwise.
 * (see also isUnDef). Shortcut for the isDefined function.
 * </odoc>
 */
const isDef = aObject => isJavaObject(aObject) || typeof aObject !== 'undefined'

/**
 * <odoc>
 * <key>isUnDef(aObject) : boolean</key>
 * Returns true if the provided aObject is undefined as a javascript variable. It will return false otherwise.
 * (see also isDef). Shortcut for the isUndefined function.
 * </odoc>
 */
const isUnDef = aObject => !isJavaObject(aObject) && typeof aObject == 'undefined'

/**
 * <odoc>
 * <key>getEnvs() : Map</key>
 * Returns a map of key and values with the operating system environment variables.
 * </odoc>
 */
const getEnvs = function() {
	return af.fromJavaMap(java.lang.System.getenv());
}

const __envs = getEnvs()

/**
 * <odoc>
 * <key>getEnvsDef(aEnv, aVar, aDefault, isJson) : Object</key>
 * Given an environment variable aEnv name will check if a value is provided and return it if so. Otherwise it will check
 * the value of aVar and return it if defined. If aVar is also not defined it will return aDefault. Optionally if isJson=true
 * the value of the provided aEnv will be parsed from JSON or SLON.
 * </odoc>
 */
const getEnvsDef = (aEnv, aVar, aDefault, isJson) => {
	if (isDef(aVar)) return aVar
	if (isDef(__envs[aEnv])) {
		if (isJson && isDef(af.fromJSSLON)) {
			return af.fromJSSLON(__envs[aEnv], true)
		} else {
			return __envs[aEnv]
		}
	} else {
		return aDefault
	}
}

// List of authorized domains from which to run ojobs
var OJOB_AUTHORIZEDDOMAINS = getEnvsDef("OJOB_AUTHORIZEDDOMAINS", OJOB_AUTHORIZEDDOMAINS, [ "ojob.io" ], true)

var __openaf;
if (isUnDef(__openaf)) __openaf =
// BEGIN_SET__OPENAF
{
   "noHomeComms"   : false,
   "opackCentral"  : [ "https://openaf.io/opack.db" ],
   "openafBuild"   : [ "https://openaf.io/build" ],
   "openafRelease" : [ "https://openaf.io/release" ],
   "openafDownload": [ "https://openaf.io" ],
   "odoc"          : [ "https://openaf.io/odoc" ]
}
// END_SET__OPENAF
/*try {
	__openaf = io.readFile(getOpenAFJar() + "::openaf.json");
} catch(e) {
	__openaf = {};
}*/
noHomeComms = (isDef(__openaf.noHomeComms)) ? __openaf.noHomeComms : false;
var __opackCentral = (isDef(__openaf.opackCentral)) ? __openaf.opackCentral : [
	"http://openaf.io/opack.db" 
]
var __openafBuild = (isDef(__openaf.openafBuild)) ? __openaf.openafBuild : [
	"http://openaf.io/build"
]
var __openafRelease = (isDef(__openaf.openafRelease)) ? __openaf.openafRelease : [
	"http://openaf.io/release"
]
var __openafDownload = (isDef(__openaf.openafDownload)) ? __openaf.openafDownload : [
	"https//openaf.io"
]
var __odoc = (isDef(__openaf.odoc)) ? __openaf.odoc : [
	"http://openaf.io/odoc"
]

//const __addToOpenAFjs = (isDef(__openaf.addToOpenAFjs)) ? __openaf.addToOpenAFjs : undefined;
//const __addToOpenAFConsolejs = (isDef(__openaf.addToOpenAFConsolejs)) ? __openaf.addToOpenAFConsolejs : undefined;

const __separator = String(java.lang.System.lineSeparator());

// Hash list of oaf scripts (each key value is a filepath; value is [hash-alg]-[hash])
var OAF_INTEGRITY = getEnvsDef("OAF_INTEGRITY", OAF_INTEGRITY, {}, true)
// If OAF_INTEGRITY_WARN is false OAF execution is halted if any integrity hash is found to be different
var OAF_INTEGRITY_WARN = getEnvsDef("OAF_INTEGRITY_WARN", OAF_INTEGRITY_WARN, true)
// If OAF_INTEGRITY_STRICT is true no OAF will execute if it's integrity is not verified.
var OAF_INTEGRITY_STRICT = getEnvsDef("OAF_INTEGRITY_STRICT", OAF_INTEGRITY_STRICT, false)
// If OAF_SIGNATURE_STRICT is true no OAF will execute if it's signature is not valid.
var OAF_SIGNATURE_STRICT = getEnvsDef("OAF_SIGNATURE_STRICT", OAF_SIGNATURE_STRICT, false)
// Use OAF_SIGNATURE_KEY key java object to validate OAF signatures;
var OAF_SIGNATURE_KEY = getEnvsDef("OAF_SIGNATURE_KEY", OAF_SIGNATURE_KEY, __)
// If OAF_VALIDATION_STRICT = true no OAF will execute if the signature doesn't exist or is not valid or if it's integrity wasn't checked & passed.
var OAF_VALIDATION_STRICT = getEnvsDef("OAF_VALIDATION_STRICT", OAF_VALIDATION_STRICT, false)

var __flags = ( typeof __flags != "undefined" && "[object Object]" == Object.prototype.toString.call(__flags) ? __flags : {
	OJOB_SEQUENTIAL            : true,
	OJOB_SHAREARGS             : true,
	OJOB_HELPSIMPLEUI          : false,
	OJOB_JOBSIGNORELOG         : ["oJob Log", "ojob run"],
	OJOB_CONSOLE_STDERR        : getEnvsDef("OJOB_CONSOLE_STDERR", __, true),
	OJOB_INIT_ARRAY_ARGS_LIST  : true,
	OJOB_CHECK_JOB_REMOVAL     : false,
	OJOB_CHECK_JOB_CHANGES     : false,
	OAF_CLOSED                 : false,
	OAF_PRECOMPILE_LEVEL       : 2,
	OAF_ERRSTACK               : true,   // If true $err will print the stack trace
	TEMPLATE_SET               : true,
	VISIBLELENGTH              : true,
	MD_NOMAXWIDTH              : true,
	MD_SHOWDOWN_OPTIONS        : {},
	MD_CODECLIP                : true,   // If true, code blocks will have a button to copy the code to the clipboard
	MD_DARKMODE                : "false", // Possible values: "auto", "true", "false"
	USE_JAVA_GENUUID           : true,
	ANSICOLOR_CACHE            : true,
	ANSICOLOR_ASK              : true,
	OPENMETRICS_LABEL_MAX      : true,   // If false openmetrics label name & value length won't be restricted,
	TREE: {
		fullKeySize: true,
		fullValSize: false,
		withValues : true,
		wordWrap   : true,
		compact    : true,
		mono       : false,
		color      : true
	},
	TABLE: {
		wordWrap           : true,
		wordWrapUseSep     : false,
		wordWrapLimitFactor: 2,
		bandRows           : true
	},
	CONSOLE: {
		view: "tree"
	},
	IO: {
		bufferSize: 1024
	},
	ALTERNATIVES: {
		traverse : true,
		extend   : true,
		merge    : true,
		jsonParse: true,
		listFilesRecursive: true,
		colorify : true
	},
	WITHMD: {
		htmlFilter: true
	},
	OAFP: {
		libs: []
	},
	SH: {
		prefixLog: false
	},
	NET: {
		getDNSExtended: false
	},
	ALTERNATIVE_HOME            : String(java.lang.System.getProperty("java.io.tmpdir")),
	ALTERNATIVE_PROCESSEXPR     : true,
	HTTP_TIMEOUT                : __,
	HTTP_CON_TIMEOUT            : __,
	HTTP_DEFAULT_HEADERS		: true,
	HTTP_USE_MEDIA_TYPE         : false,
	HTTPD_THREADS               : "auto",
	HTTPD_BUFSIZE               : 8192,
	HTTPD_CUSTOMURIS 			: {},
	HTTPD_DEFAULT_IMPL          : "nwu2",
	SQL_QUERY_METHOD            : "auto",
	SQL_QUERY_H2_INMEM          : false,
	SQL_QUERY_COLS_DETECT_SAMPLE: 25,
	DOH_PROVIDER                : "cloudflare",
	PRINT_BUFFER_STREAM         : 8192,
	JAVA_CERT_BC_PROVIDER       : false,
	PATH_CFN                    : __,             // $path custom functions (execute loadCompiledLib("jmespath_js") before using)
	PATH_SAFE                   : false,
	PFOREACH                    : {
		seq_thrs_ms        : 6,
		threads_thrs       : 2,
		waitms             : 50,
		forceSeq           : false,
		seq_ratio          : 1
	}
})

// -------

/**
 * Get serialize version detecting circular references (internal use)
 *
 */
var getSerialize = function(fn, decycle) {
	function getPath (value, seen, keys) {
		var index = seen.indexOf(value);
		var path = [ keys[index] ];
		for (index--; index >= 0; index--) {
			if (seen[index][ path[0] ] === value) {
				value = seen[index];
				path.unshift(keys[index]);
			}
		}
		return '~' + path.join('.');
	}
	var seen = [], keys = [];
	decycle = decycle || function(key, value) {
		return '[Circular ' + getPath(value, seen, keys) + ']'
	};

	return function(key, value) {
		var ret = value;
		if (typeof value === 'object' && value) {
			if (seen.indexOf(value) !== -1)
				ret = decycle(key, value);
			else {
				seen.push(value);
				keys.push(key);
			}
		}
		if (fn) ret = fn(key, ret);
		return ret;
	}
}

//UTILS
//-----

var __bfprintFlag = true;
/**
 * <odoc>
 * <key>print(aStr)</key>
 * Prints the aStr to the stdout (with a new line on the end) (example: print("hello world!"))
 * </odoc>
 */
const print = function(str) {
	str = _$(str, "str").default("");
	if (__bfprintFlag) {
		bfprint(str);
	} else {
		af.p(str);
	}
}

var __bfprint = {}
var __bfprintErr = {}
var __bfprintCodePage = io.getDefaultEncoding()
const bfprintnl = function(str, codePage) {
	if (isUnDef(codePage)) codePage = __bfprintCodePage
	if (isUnDef(__bfprint[codePage])) __bfprint[codePage] = new java.io.BufferedWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(java.io.FileDescriptor.out), codePage), __flags.PRINT_BUFFER_STREAM)

	__bfprint[codePage].write(str)
	__bfprint[codePage].flush()
}

const bfprintErrnl = function(str, codePage) {
	if (isUnDef(codePage)) codePage = __bfprintCodePage
	if (isUnDef(__bfprintErr[codePage])) __bfprintErr[codePage] = new java.io.BufferedWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(java.io.FileDescriptor.err), codePage), __flags.PRINT_BUFFER_STREAM)

	__bfprintErr[codePage].write(str)
	__bfprintErr[codePage].flush()
}

const bfprintSetStreamSize = function(aStreamSize) {
	__flags.PRINT_BUFFER_STREAM = aStreamSize
	__bfprint = {}
	__bfprintErr = {}
}

const bfprint = function(str, codePage) {
	bfprintnl(str + __separator, codePage);
}

const bfprintErr = function(str, codePage) {
	bfprintErrnl(str + __separator, codePage);
}

/**
 * <odoc>
 * <key>sprint(aStr)</key>
 * "Stringifies" and prints the aStr to the stdout (with a new line on the end) (example: sprint("hello world!"))
 * </odoc>
 */
const sprint = function(str, delim) { delim = (isUnDef(delim) ? "  " : delim); return print(stringify(str, undefined, delim)); }

/**
 * <odoc>
 * <key>lprint(aStr, withColor)</key>
 * "SLONs" and prints the aStr to the stdout (with a new line on the end)
 * </odoc>
 */
const lprint = function(str, c) { return print(c ? af.toCSLON(str) : af.toSLON(str)) }

/**
 * <odoc>
 * <key>bprint(aStr)</key>
 * "Beautifies" and prints the aStr to the stdout (with a new line on the end) (example: bprint("hello world!"))
 * </odoc>
 */
const bprint = function(str) { return print(beautifier(str)); }
/**
 * <odoc>
 * <key>cprint(aStr)</key>
 * "Stringifies" in ANSI color and prints the aStr to the stdout (with a new line on the end) (example: cprint("hello world!"))
 * </odoc>
 */
const cprint = function(str, delim) { ansiStart(); print(colorify(str)); ansiStop(); }

/**
 * <odoc>
 * <key>yprint(aObj, multidoc, sanitize, shouldColor)</key>
 * Prints aObj in YAML. If multiDoc = true and aJson is an array the output will be multi-document. If sanitize = true all Java objects will be converted to avoid parsing errors.
 * </odoc>
 */
const yprint = function(str, multidoc, sanitize, shouldColor) { return print(af.toYAML(str, multidoc, sanitize, shouldColor)); }

/**
 * <odoc>
 * <key>printnl(aStr)</key>
 * Prints the aStr to the stdout (without adding a new line on the end) (example: printnl("hello world!"))
 * </odoc>
 */
const printnl = function(str) {
	str = _$(str, "str").default("");
	if (__bfprintFlag) {
		bfprintnl(str);
	} else {
		af.pnl(str);
	}
}

/**
 * <odoc>
 * <key>sprintnl(aStr)</key>
 * "Stringifies" and prints the aStr to the stdout (without adding a new line on the end) (example: sprintnl("hello world!"))
 * </odoc>
 */
const sprintnl = function(str, delim) { delim = (isUnDef(delim) ? "  " : delim); return printnl(stringify(str, undefined, delim)); }
/**
 * <odoc>
 * <key>lprintnl(aStr, withColor)</key>
 * "SLONs" and prints the aStr to the stdout (without adding a new line on the end)
 * </odoc>
 */
const lprintnl = function(str, c) { return printnl(c ? af.toCSLON(str) : af.toSLON(str)) }
/**
 * <odoc>
 * <key>bprintnl(aStr)</key>
 * "Beautifies" and prints the aStr to the stdout (without adding a new line on the end) (example: bprintnl("hello world!"))
 * </odoc>
 */
const bprintnl = function(str) { return printnl(beautifier(str)); }
/**
 * <odoc>
 * <key>cprintnl(aStr)</key>
 * "Stringifies" in ANSI color and prints the aStr to the stdout (with a new line on the end) (example: cprintnl("hello world!"))
 * </odoc>
 */
const cprintnl = function(str, delim) { ansiStart(); printnl(colorify(str)); ansiStop(); }

/**
 * <odoc>
 * <key>tprintln(aTemplateString, someData)</key>
 * Using Handlebars and the functionality provided in ow.template, will use the aTemplateString as a Handlebars template
 * and print, withouth a new line, the parsed output. Optionally you can provide someData as data for the Handlebars template 
 * otherwise the current scope will be used.\
 * \
 * Example:\
 * \
 * var someText = "Hello World!";\
 * tprintln("Hi, {{someText}}"); // Hi, Hello World!
 * </odoc>
 */
const tprintnl = function(aTemplateString, someData) {
	someData = (isUnDef(someData)) ? this : someData;
	printnl(templify(aTemplateString, someData));
}

/**
 * <odoc>
 * <key>tprint(aTemplateString, someData)</key>
 * Using Handlebars and the functionality provided in ow.template, will use the aTemplateString as a Handlebars template
 * and print the parsed output. Optionally you can provide someData as data for the Handlebars template 
 * otherwise the current scope will be used.\
 * \
 * Example:\
 * \
 * var someText = "Hello World!";\
 * tprint("Hi, {{someText}}"); // Hi, Hello World!
 * </odoc>
 */
const tprint = function(aTemplateString, someData) {
	tprintnl(aTemplateString + __separator, someData);
}

/**
 * <odoc>
 * <key>printErr(aStr)</key>
 * Prints the aStr to the stderr (with a new line on the end) (example: printErr("Hupps!! A problem!"))
 * </odoc>
 */
const printErr = function(str) {
	str = _$(str, "str").default("");
	if (__bfprintFlag) {
		bfprintErr(str);
	} else {
		af.e(str);
	}
}

/**
 * <odoc>
 * <key>sprintErr(aStr)</key>
 * "Stringifies" and prints the aStr to the stderr (with a new line on the end) (example: sprintErr("Hupps!! A problem!"))
 * </odoc>
 */
const sprintErr = function(str, delim) { delim = (isUnDef(delim) ? "  " : delim); return printErr(stringify(str, undefined, delim)); }
/**
 * <odoc>
 * <key>lprintErr(aStr, withColor)</key>
 * "SLONs" and prints the aStr to the stderr (with a new line on the end)
 * </odoc>
 */
const lprintErr = function(str, c) { return printErr(c ? af.toCSLON(str) : af.toSLON(str)) }

/**
 * <odoc>
 * <key>bprintErr(aStr)</key>
 * "Beautifies" and prints the aStr to the stderr (with a new line on the end) (example: bprintErr("Hupps!! A problem!"))
 * </odoc>
 */
const bprintErr = function(str) { return printErr(beautifier(str)); }
/**
 * <odoc>
 * <key>cprintErr(aStr)</key>
 * "Stringifies" in ANSI color and prints the aStr to the stderr (with a new line on the end) (example: cprintErr("Hupps!! A problem!"))
 * </odoc>
 */
const cprintErr = function(str) { ansiStart(); printErr(colorify(str)); ansiStop(); }

/**
 * <odoc>
 * <key>yprintErr(aObj, multidoc)</key>
 * Prints aObj in YAML to stderr. If multiDoc = true and aJson is an array the output will be multi-document.
 * </odoc>
 */
const yprintErr = function(str, multidoc) { return printErr(af.toYAML(str, multidoc)); }

/**
 * <odoc>
 * <key>printErrnl(aStr)</key>
 * Prints the aStr to the stderr (without adding a new line on the end) (example: printErrnl("Hupps!! A problem!"))
 * </odoc>
 */
const printErrnl = function(str) {
	str = _$(str, "str").default("");
	if (__bfprintFlag) {
		bfprintErrnl(str);
	} else {
		af.enl(str);
	}
}

/**
 * <odoc>
 * <key>sprintErrnl(aStr)</key>
 * "Stringifies" and prints the aStr to the stderr (without adding a new line on the end) (example: sprintErrnl("Hupps!! A problem!"))
 * </odoc>
 */
const sprintErrnl = function(str, delim) { delim = (isUnDef(delim) ? "  " : delim); return printErrnl(stringify(str, undefined, delim)); }
/**
 * <odoc>
 * <key>lprintErrnl(aStr, withColor)</key>
 * "SLONs" and prints the aStr to the stderr (without adding a new line on the end)
 * </odoc>
 */
const lprintErrnl = function(str, c) { return printErrnl(c ? af.toCSLON(str) : af.toSLON(str)) }

/**
 * <odoc>
 * <key>bprintErrnl(aStr)</key>
 * "Beautifies" and prints the aStr to the stderr (without adding a new line on the end) (example: bprintErrnl("Hupps!! A problem!"))
 * </odoc>
 */
const bprintErrnl = function(str) { return printErrnl(beautifier(str)); }

/**
 * <odoc>
 * <key>cprintErrnl(aStr)</key>
 * "Stringifies" in ANSI color and prints the aStr to the stderr (with a new line on the end) (example: cprintErrnl("Hupps!! A problem!"))
 * </odoc>
 */
const cprintErrnl = function(str, delim) { ansiStart(); printErrnl(colorify(str)); ansiStop(); }

/**
 * <odoc>
 * <key>tprintErrnl(aTemplateString, someData)</key>
 * Using Handlebars and the functionality provided in ow.template, will use the aTemplateString as a Handlebars template
 * and print, to the stderr without new line, the parsed output. Optionally you can provide someData as data for the Handlebars template 
 * otherwise the current scope will be used.\
 * \
 * Example:\
 * \
 * var someText = "Hello World!";\
 * tprintErrnl("Hi, {{someText}}"); // Hi, Hello World!
 * </odoc>
 */
const tprintErrnl = function(aTemplateString, someData) {
	someData = (isUnDef(someData)) ? this : someData;
	printErrnl(templify(aTemplateString, someData));
}

/**
 * <odoc>
 * <key>tprintErr(aTemplateString, someData)</key>
 * Using Handlebars and the functionality provided in ow.template, will use the aTemplateString as a Handlebars template
 * and print, to the stderr, the parsed output. Optionally you can provide someData as data for the Handlebars template 
 * otherwise the current scope will be used.\
 * \
 * Example:\
 * \
 * var someText = "Hello World!";\
 * tprintErr("Hi, {{someText}}"); // Hi, Hello World!
 * </odoc>
 */
const tprintErr = function(aTemplateString, someData) {
	tprintErrnl(aTemplateString + __separator, someData);
}

/**
 * <odoc>
 * <key>printChart(aFormatString, hSize, vSize, aMax, aMin, dColor) : String</key>
 * Produces a line chart given aFormatString, a hSize (horizontal max size), a vSize (vertical max size), aMax (the axis max value) and aMin 
 * (the axis min value). The aFormatString should be composed of "&lt;dataset&gt; &lt;units&gt; [&lt;function[:color][:legend]&gt; ...]":\
 * \
 *    The dataset should be an unique name (data can be cleaned with ow.format.string.dataClean);\
 *    The units can be: int, dec1, dec2, dec3, dec4, dec, bytes and si;\
 *    Each function should return the corresponding current value (optionally it can be a number directly);\
 *    Optionally each color should use any combinations similar to ansiColor (check 'help ansiColor');\
 *    Optionally each legend, if used, will be included in a bottom legend;\
 * \
 *    If function "-min" it will overwrite the aMin\
 *    If function "-max" it will overwrite the aMax\
 *    If function "-hsize" it will overwrite the hSize\
 *    If function "-vsize" it will overwrite the vSize\
 * \
 * </odoc>
 */
const printChart = function(as, hSize, vSize, aMax, aMin, options) {
	_$(as, "aFormatString").isString().$_()
	
	var _d = as.trim().split(/ +/)
	var name = _$(_d.shift(), "name").isString().$_()
	var type = _$(_d.shift(), "type").oneOf(["int", "dec1", "dec2", "dec3", "dec4", "dec", "bytes", "si", "clean"]).$_()

	aMax    = _$(aMax, "aMax").isNumber().default(__)
	aMin    = _$(aMin, "aMin").isNumber().default(__)
	hSize   = _$(hSize, "hSize").isNumber().default(isUnDef(__con) ? __ : __con.getTerminal().getWidth())
	vSize   = _$(vSize, "vSize").isNumber().default(isUnDef(__con) ? __ : __con.getTerminal().getHeight() - 5)
	options = _$(options, "options").isMap().default({})

	if (type == "clean" && name != "__") {
		ow.format.string.dataClean(name)
		return
	}
	var useColor = false
	var colors = [], titles = []

	if (_d.filter(r => !r.startsWith("-")).filter(r => r.indexOf(":") > 0).length > 0) {
		if (_d.filter(r => r.indexOf(":") > 0).length != _d.length) throw "Please provide a color for all series functions."
		useColor = true
	}

	var data = _d.filter(r => !r.startsWith("-")).map(r => {
		try {
			if (useColor) {
				var _ar = r.split(":")
				colors.push(_ar[1])
				titles.push((_ar.length > 2) ? _ar[2] : "")
				return isNumber(_ar[0]) ? _ar[0] : global[_ar[0]]() 
			} else {
				return isNumber(r) ? r : global[r]()
			}	
		} catch(dme) {
			throw "Error on '" + r + "': " + dme
		}
	}).filter(r => isDef(r))

	_d.filter(r => r.startsWith("-")).forEach(r => {
		var _ar = r.split(":")
		switch(_ar[0]) {
		case "-max": aMax = Number(_ar[1]); break
		case "-min": aMin = Number(_ar[1]); break
		case "-hsize": hSize = Number(_ar[1]); break
		case "-vsize": vSize = Number(_ar[1]); break
		}
	})

	//var options = { symbols: [ '+', '|', '-', '-', '-', '\\', '/', '\\', '/', '|' ] }
	var options = merge(options, { max: aMax, min: aMin })
	if (useColor) options.colors = colors

	switch(type) {
	case "int":
		options.format = x => $f("%2.0f", Number(x))
		break
	case "dec":
		options.format = x => String(x)
		break
	case "dec1":
		options.format = x => Number(x).toFixed(1)
		break
	case "dec2":
		options.format = x => Number(x).toFixed(2)
		break
	case "dec3":
		options.format = x => Number(x).toFixed(3)
		break
	case "dec4":
		options.format = x => Number(x).toFixed(4)
		break
	case "bytes":
		options.format = x => ow.format.toBytesAbbreviation(x)
		break
	case "si":
		options.format = x => ow.format.toAbbreviation(x)
		break
	}

	var _out
	var useLegend = useColor & titles.reduce((pV, cV, cI, aR) => { if (cV == "") return 0; return pV + cV.length }, 0 ) > 0
	try {
		//io.writeFileString("/tmp/test", name + "; " + stringify(data, __, true) + "; " + hSize + "; " + vSize + "; " + stringify(options, __, true) + "\n", __, true)
		if (name != "__") {
			_out = ow.format.string.dataLineChart(name, data, hSize, useLegend ? vSize -2 : vSize, options)
		} else {
			_out = ow.format.string.lineChart(data, merge({ width: hSize, height: useLegend ? vSize -2 : vSize }, options))
		}
	} catch(e) {
		//io.writeFileString("/tmp/test", "ERROR: " + name + " " + stringify(data,__,"") + " " + stringify(options,__,"") + " | " + e + "\n", __, true)
		throw e
	} 
	if (useLegend) {
		_out += "\n\n  " + ow.format.string.lineChartLegend(titles, options).map(r => r.symbol + " " + r.title).join("  ")
	}
	
	return _out
}

/**
 * <odoc>
 * <key>printBars(aFormatString, hSize, aMax, aMin, aIndicatorChar, aSpaceChar) : String</key>
 * Produces horizontal bars given aFormatString, a hSize (horizontal max size), aMax (the axis max value) and aMin 
 * (the axis min value). The aFormatString should be composed of "&lt;units&gt; [&lt;function[:color][:legend]&gt; ...]":\
 * \
 *    The units can be: int, dec1, dec2, dec3, dec, bytes and si;\
 *    Each function should return the corresponding current value (optionally it can be a number directly);\
 *    Optionally each color should use any combinations similar to ansiColor (check 'help ansiColor');\
 *    Optionally each legend, if used, will be included in a bottom legend;\
 * \
 * </odoc>
 */
const printBars = function(as, hSize, aMax, aMin, aIndicatorChar, aSpaceChar) {
	_$(as, "aFormatString").isString().$_()
	
	var _d = as.trim().split(/ +/)
	var type = _$(_d.shift(), "type").oneOf(["int", "dec1", "dec2", "dec3", "dec", "bytes", "si"]).$_()

	aMax  = _$(aMax, "aMax").isNumber().default(__)
	aMin  = _$(aMin, "aMin").isNumber().default(__)
	hSize = _$(hSize, "hSize").isNumber().default(isUnDef(__con) ? __ : __con.getTerminal().getWidth())

	aIndicatorChar = _$(aIndicatorChar, "aIndicatorChar").isString().default("━")
	aSpaceChar     = _$(aSpaceChar, "aSpaceChar").isString().default(" ")

	var useColor = false
	var colors = [], titles = []

	if (_d.filter(r => r.indexOf(":") > 0).length > 0) {
		if (_d.filter(r => r.indexOf(":") > 0).length != _d.length) throw "Please provide a color for all series functions."
		useColor = true
	}

	var data = _d.filter(r => !r.startsWith("-")).map(r => {
		try {
			if (useColor) {
				var _ar = r.split(":")
				colors.push(_ar[1])
				titles.push((_ar.length > 2) ? _ar[2] : "")
				return isNumber(_ar[0]) ? _ar[0] : global[_ar[0]]() 
			} else {
				return isNumber(r) ? r : global[r]()
			}	
		} catch(dme) {
			throw "Error on '" + r + "': " + dme
		}
	}).filter(r => isDef(r))

	_d.filter(r => r.startsWith("-")).forEach(r => {
		var _ar = r.split(":")
		switch(_ar[0]) {
		case "-max": aMax = Number(_ar[1]); break
		case "-min": aMin = Number(_ar[1]); break
		case "-hsize": hSize = Number(_ar[1]); break
		}
	})

	if (isUnDef(aMax)) aMax = $from(data).max()
	if (isUnDef(aMin)) aMin = $from(data).min()
	if (aMin > 0) aMin = 0

	var fn

	switch(type) {
	case "int":
		fn = x => $f("%2.0f", Number(x))
		break
	case "dec":
		fn = x => String(x)
		break
	case "dec1":
		fn = x => Number(x).toFixed(1)
		break
	case "dec2":
		fn = x => Number(x).toFixed(2)
		break
	case "dec3":
		fn = x => Number(x).toFixed(3)
		break
	case "bytes":
		fn = x => ow.format.toBytesAbbreviation(x)
		break
	case "si":
		fn = x => ow.format.toAbbreviation(x)
		break
	}

	var _out = {}, values = []
	try {
		var maxTitle = titles.reduce((pV,cV,cI,aR) => {
			return Math.max(Number(pV), (isString(cV) ? ansiLength(cV) : ("f" + ansiLength(String(cI)))))
		}, 0)
		var maxValue = data.reduce((pV,cV,cI,aR) => {
			var _v = fn(cV)
			values.push(_v)
			return Math.max(pV, ansiLength(String(_v)))
		}, 0)
		data.forEach((d, i) => {
			var _vv = $f("%" + maxValue + "s", String(values[i]))
			var _s = hSize -1 -2 -2 -2 -maxTitle -maxValue
			var _v = ansiColor(colors[i], ow.format.string.progress(Number(d), Number(aMax), Number(aMin), Number(aMax > _s ? _s : aMax), aIndicatorChar, aSpaceChar)) + " :" + _vv
			if (isDef(titles[i])) {
				_out[titles[i]] = $f("%" + maxTitle + "s", _v)
			} else {
				_out["f" + String(i)] = $f("%" + maxTitle + "s", _v)
			}
		})
		return printTree(_out)
	} catch(e) {
		throw e
	} 
}

/**
 * <odoc>
 * <key>printTable(anArrayOfEntries, aWidthLimit, displayCount, useAnsi, aTheme, aBgColor, wordWrap, useRowSep, bandRows) : String</key>
 * Returns a ASCII table representation of anArrayOfEntries where each entry is a Map with the same keys.
 * Optionally you can specify aWidthLimit, useAnsi, bandRows and/or aBgColor.
 * If you want to include a count of rows just use displayCount = true. If useAnsi = true you can provide a theme (e.g. "utf" or "plain")
 * </odoc>
 */
const printTable = function(anArrayOfEntries, aWidthLimit, displayCount, useAnsi, aTheme, aBgColor, wordWrap, useRowSep, bandRows) {
	var inCount = anArrayOfEntries.length

	if (inCount == 0) return ""

	ow.loadObj()
	var maxsize = {};
	var anArrayOfIdxs = []
	aBgColor  = _$(aBgColor, "aBgColor").isString().default(__)
	wordWrap  = _$(wordWrap, "wordWrap").isBoolean().default(__flags.TABLE.wordWrap)
	useRowSep = _$(useRowSep, "useRowSep").isBoolean().default(__flags.TABLE.wordWrapUseSep)
	bandRows  = _$(bandRows, "bandRows").isBoolean().default(__flags.TABLE.bandRows)

	var colorMap = __colorFormat.table || {}

	if (isDef(aBgColor)) {
		colorMap.lines = aBgColor + "," + colorMap.lines
		colorMap.value = aBgColor + "," + colorMap.value
		colorMap.title = aBgColor + "," + colorMap.title
	}
	var _colorMap = {
		lines: ansiColor(colorMap.lines, "").replace(/\u001b\[m$/, ""),
		value: ansiColor(colorMap.value, "").replace(/\u001b\[m$/, ""),
		title: ansiColor(colorMap.title, "").replace(/\u001b\[m$/, "")
	}

	ow.loadFormat()
	if (isUnDef(aTheme)) {
		if (!ow.format.isWindows()) {
			if (isUnDef(useAnsi) && __initializeCon()) {
				useAnsi = __conAnsi;
			}
			aTheme = (__conAnsi ? "utf" : "plain")
		} else {
			if (__initializeCon()) {
				if (!ansiWinTermCap()) ansiStart();
				if (isDef(__con) && isDef(__con.getTerminal().getOutputEncoding())) aTheme = (__conAnsi ? "utf" : "plain");
				if (isUnDef(useAnsi)) {
					useAnsi = __conAnsi;
				}
			}
		}
	}

	var hLine = "-", vLine = "|", hvJoin = "+";
	if (aTheme == "utf") {
		hLine = "─";
		vLine = "│";
		hvJoin = "┼";
	}

	//var pShouldBand = false
	var _getColor = (aValue, ii, prev) => {
		var shouldBand
		if (bandRows) {
			// Given anArrayOfIdxs with a list of intervals, if ii is in one of them, then band
			shouldBand = false
			var _found = false
			var acc = 0
			for(var _ii = 0; !_found && _ii < anArrayOfIdxs.length; _ii++) {
				var pos = anArrayOfIdxs[_ii]
				if (acc <= ii && ii < pos) {
					shouldBand = _ii % 2 != 0
					_found = true
				}
				acc = pos
			}
		} else {
			shouldBand = false
		}
		var _bg = isDef(aBgColor) ? aBgColor + "," + (shouldBand ? __colorFormat.table.bandRow+"," : "") : (shouldBand ? __colorFormat.table.bandRow+"," : "") + ""
		var _aValue = String(aValue).trim()
		if (isNumber(_aValue) && ((isUnDef(prev) || String(prev).trim() == "") || (isDef(prev) && isNumber(prev)))) return _bg + __colorFormat.number
		if (_aValue == "true" || _aValue == "false") return _bg + __colorFormat.boolean
		if (isString(aValue)) return _bg + __colorFormat.string
		if (isDate(aValue)) return _bg + __colorFormat.date
		return _bg + __colorFormat.default
	}

	if (!Array.isArray(anArrayOfEntries)) return "";
	if (isUnDef(aWidthLimit)) aWidthLimit = -1;

	if (anArrayOfEntries.length == 0) return ""
	anArrayOfEntries = anArrayOfEntries.map(r => "[object Object]" != Object.prototype.toString.call(r) ? { " ": r } : r)

	// If wordwrap generate new array
	if (aWidthLimit > 0) {
		var _t = ow.format.string.wordWrapArray(anArrayOfEntries, aWidthLimit, visibleLength(vLine), useRowSep ? s => ansiColor("FAINT", "-".repeat(s)) : __, true)
		anArrayOfEntries = _t.lines
		anArrayOfIdxs = _t.idx
	}
	
	// Find sizes
	var cols = Object.keys(anArrayOfEntries[0])
	anArrayOfEntries.forEach(row => {
		cols.forEach(col => {
			let _v = row[col]
			if (isString(_v) && _v.length >= 20 && isDate(new Date(_v))) {
				_v = new Date(_v).toISOString().replace("Z","").replace("T"," ")
				row[col] = new Date(row[col])
			} else 
				//_v = isJavaObject(_v) ? String(_v) : _v
				_v = String(_v)
			let ansiLength_v = visibleLength(_v)
			if (isUnDef(maxsize[col])) 
				maxsize[col] = visibleLength(col)
			if (maxsize[col] < ansiLength_v) maxsize[col] = ansiLength_v
		})
	})

	// Produce table
	//$from(anArrayOfEntries.map((row, ii) => ({ row: row, ii: ii }))).pselect(_row => {
	var _output = new ow.obj.syncArray(range(anArrayOfEntries.length))
	pForEach(anArrayOfEntries, (row, ii) => {
		var output = []
		var lineSize = 0
		var outOfWidth = false
		var colsLengthMinusOne = cols.length - 1
		var colNum
	
		if (ii == 0) {
			output.push(useAnsi ? _colorMap.title : "")
			lineSize = 1; outOfWidth = false; colNum = 0;
			cols.forEach(col => {
				if (outOfWidth) return
				lineSize += maxsize[col] + 1
				if (aWidthLimit > 0 && lineSize > (aWidthLimit+3)) {
					output.push((useAnsi ? [ _colorMap.title, "...", "\u001b[m" ].join("") : "...")); outOfWidth = true
				} else {
					var ansiLengthCol = visibleLength(col);
					var _ps = ' '.repeat(Math.floor((maxsize[col] - ansiLengthCol)/2))
					var _pe = ' '.repeat(Math.round((maxsize[col] - ansiLengthCol) / 2))
					output.push(useAnsi ? [ _colorMap.title, _ps, col, _pe, "\u001b[m" ].join("") : _ps + col + _pe)
					if (colNum < colsLengthMinusOne) output.push(useAnsi ? [ _colorMap.lines, vLine, "\u001b[m" ].join("") : vLine)
				}
				colNum++
			})
			output.push(__separator)
			lineSize = 1; outOfWidth = false; colNum = 0;
			cols.forEach(col => {
				if (outOfWidth) return;
				lineSize += maxsize[col] + 1;
				if (aWidthLimit > 0 && lineSize > (aWidthLimit+3)) {
					output.push(useAnsi ? [ _colorMap.lines, "...", "\u001b[m" ].join("") : "...")
					outOfWidth = true
				} else {
					output.push((useAnsi ? [ _colorMap.lines, hLine.repeat(maxsize[col]), "\u001b[m" ].join("") : hLine.repeat(maxsize[col])))
					if (colNum < (cols.length-1)) output.push(useAnsi ? [_colorMap.lines, hvJoin, "\u001b[m" ].join("") : hvJoin)
				}
				colNum++
			})
			output.push(__separator)
		}

		lineSize = 1; outOfWidth = false; colNum = 0
		cols.forEach((col, jj) => {
			if (outOfWidth) return;
			lineSize += maxsize[col] + 1
			if (aWidthLimit > 0 && lineSize > (aWidthLimit+3)) {
				output.push("..."); outOfWidth = true
			} else {	
				//var value = isDate(row[col]) ? row[col].toISOString().replace("Z","").replace("T"," ") : String(row[col]).replace(/\n/g, " ")
				var value = isDate(row[col]) ? row[col].toISOString().replace("Z","").replace("T"," ") : String(row[col]).replace(/\n/g, " ")
				var _pe = ' '.repeat(maxsize[col] - visibleLength(value))
				output.push(useAnsi ? ansiColor(_getColor(row[col], ii, ii > (useRowSep ? 1 : 0) ? anArrayOfEntries[ii-(useRowSep ? 2 : 1)][col] : __), value + _pe, __, __, jj != cols.length -1) : value + _pe)
				if (colNum < (cols.length-1)) output.push(useAnsi ? [ _colorMap.lines, vLine, "\u001b[m" ].join("") : vLine)
			}
			colNum++
		})
		output.push(__separator)
		_output.set(ii, output.join(""))
	})

	if (displayCount) {
		var summary = "[#" + inCount + " " + ((inCount <= 1) ? "row" : "rows") + "]"
		_output.add(useAnsi ? [ _colorMap.lines, summary, "\u001b[m" ].join("") : summary)
	}
	
	return _output.toArray().join("") + "\u001b[m"
}

/**
 * <odoc>
 * <key>printTree(aObj, aWidth, aOptions) : String</key>
 * Given aObj(ect) will return a tree with the object elements. Optionaly you can specificy aWidth and/or aOptions:
 * noansi (boolean) no ansi character sequences, curved (boolean) for UTF curved characters, wordWrap (boolean) to wrap long string values, compact (boolean) to compact tree lines, fullKeySize (boolean) to
 * pad the each entry key, fullValSize (boolean) to pad the entire key and value and withValues (boolean) to include or not each key values
 * </odoc>
 */
const printTree = function(_aM, _aWidth, _aOptions, _aPrefix, _isSub) {
	let slines, line, endc, strc, ssrc, midc, skey
	_aOptions = _$(_aOptions, "aOptions").isMap().default({})

	// Merge with default options
	_aOptions = merge(merge(merge({
		noansi: false,
		curved: true,
		fullKeySize: true,
		fullValSize: false,
		withValues: true,
		wordWrap: true,
		compact: true,
		minSize: 5
	}, __flags.TREE), __colorFormat.tree), _aOptions)

	// Decide on decorations to use 
	if (_aOptions.compact) {
		if (_aOptions.mono) {
			slines = 2
			line = "│"
			endc = (_aOptions.curved ? "╰ " : "└ ")
			//strc = (_aOptions.noansi ? "/ " : "┬ ")
			strc = (_aOptions.curved ? "╭ " : "┌ ")
			ssrc = "─ "
			midc = "├ "
			skey = ": "
			_aOptions.color = false
		} else {
			slines = 2
			line = (_aOptions.noansi ? "|" : "│") 
			endc = (_aOptions.noansi ? "\\ " : (_aOptions.curved ? "╰ " : "└ "))
			//strc = (_aOptions.noansi ? "/ " : "┬ ")
			strc = (_aOptions.noansi ? "/ " :  (_aOptions.curved ? "╭ " : "┌ "))
			ssrc = (_aOptions.noansi ? "- " : "─ ")
			midc = (_aOptions.noansi ? "| " : "├ ")
			skey = ": "
		}
	} else {
		slines = 3
		line = (_aOptions.noansi ? "|" : "│") 
		endc = (_aOptions.noansi ? "\\- " : (_aOptions.curved ? "╰─ " : "└─ "))
		strc = (_aOptions.noansi ? "/- " :  (_aOptions.curved ? "╭─ " : "┌─ "))
		ssrc = (_aOptions.noansi ? "-- " : "── ")
		midc = (_aOptions.noansi ? "|- " : "├─ ")
		skey = ": "
	}

	// Don't repeat options if already done as a sub-call
	ow.loadFormat()
	ow.loadObj()
	if (!ow.format.isWindows()) {
		if (isUnDef(_aOptions.noansi) && __initializeCon()) {
			_aOptions.noansi = !__conAnsi
		}
	} else {
		if (__initializeCon()) {
			if (!ansiWinTermCap()) ansiStart()
			if (isUnDef(_aOptions.noansi)) _aOptions.noansi = !__conAnsi
		}
	}

	_aPrefix  = _$(_aPrefix, "aPrefix").isString().default("")
	_aWidth   = _$(_aWidth, "aWidth").isNumber().default(__)
	if (isUnDef(_aWidth) && isDef(__con)) _aWidth = Number(__con.getTerminal().getWidth())

	// Prepare aux functions
	var _clr = __, _ac = __, _al = __
	if (!_aOptions.noansi) {
		_dt = aO => {
			if (null == aO) return "null"
			try {
				if ("function" === typeof aO.getClass && "[object JavaObject]" === Object.prototype.toString.call(aO)) return "java"
			} catch(e) {
				if (aO.getClass() instanceof java.lang.Object) return "java"
			}
			if ("undefined" == typeof aO) return "undefined"
			if ("boolean" == typeof aO) return "boolean"
			if ("number" === typeof aO) return "number"
			if ("string" == typeof aO) return "string"
			if ("undefined" !== typeof aO.getDate) return "date"
		}
		//_acr = () => _ac("RESET","")
		_clr = aO => {
			//if (_clrCache[String(aO)]) return _clrCache[String(aO)]
			if (_clrCache.containsKey(String(aO))) return _clrCache.get(String(aO))

			let result
			let dt = _dt(aO)
			switch(dt) {
			case "null"   : result = [_acCFdefault, "null", "\u001b[m"].join(""); break
			case "number" : result = [_acCFnumber, String(aO), "\u001b[m"].join(""); break
			case "string" : result = [_acCFstring, String(aO), "\u001b[m"].join(""); break
			case "boolean": result = [_acCFboolean, String(aO), "\u001b[m"].join(""); break
			case "date"   : result = [_acCFdate, aO.toISOString().replace("Z","").replace("T"," "), "\u001b[m"].join(""); break
			case "java"   : result = [_acCFstring, String(aO.toString()), "\u001b[m"].join(""); break
			default       : result = [_acCFdefault, String(aO), "\u001b[m"].join(""); break
			}
			//_clrCache[String(aO)] = result
			_clrCache.put(String(aO), result)
			return result
		}
		_ac  = (aAnsi, aString) => {
			if (!__conConsole || ((isDef(_aOptions.color) && !_aOptions.color))) return aString

			aAnsi = aAnsi.trim().toUpperCase()
			if (_aOptions.bgcolor && aAnsi.length > 0) {
				aAnsi += "," + _aOptions.bgcolor
			}
		
			if (aAnsi.length == 0) return aString

			if (__ansiColorCache[aAnsi]) return [__ansiColorCache[aAnsi], aString].join("")
		
			return ansiColor(aAnsi, aString, true, true)
		}
		var _clrCache = new ow.obj.syncMap()
		var _acCFdefault = _ac(__colorFormat.default, "").replace("\u001b[m", "")
		var _acCFnumber = _ac(__colorFormat.number, "").replace("\u001b[m", "")
		var _acCFstring = _ac(__colorFormat.string, "").replace("\u001b[m", "")
		var _acCFboolean = _ac(__colorFormat.boolean, "").replace("\u001b[m", "")
		var _acCFdate = _ac(__colorFormat.date, "").replace("\u001b[m", "")
		var _acCFstring  = _ac(__colorFormat.string, "").replace("\u001b[m", "")
		_al  = m => (__flags.VISIBLELENGTH ? visibleLength(m) : m.replace(/\033\[[0-9;]*m/g, "").length)
	} else {
		_clr = s => s
		_ac  = (o, s) => s
		_al  = s => s.length
	}
	//_ac("RESET", "")

	var _tw = (ps, s, mx) => {
		if ((ps.length + _aOptions.minSize) >= mx || mx <= 0) throw "Insufficient width (length = " + (ps.length + _aOptions.minSize) + "; max = " + mx + ")"
		var ar = new Set()
		var i = 0, mxp = Math.floor(mx * 0.25)
		var sub, ni
		do {
			sub = s.substr(i, mx)
			if ((ni = sub.indexOf("\n")) >= 0) {
				ar.add(s.substr(i, ni))
				i += ni + 1
			} else {
				if (s.length > i+mx+1 && s.substr(i, mx+1).match(/ [^ ]+$/)) {
					var mxp = sub.lastIndexOf(" ")
					ar.add(s.substr(i, mxp))
					i += mxp + 1
				} else {
					ar.add(sub)
					i += mx
				}
			}
		} while(i < s.length)
		return Array.from(ar)
	}

	let _pt = (aM, aWidth, aOptions, aPrefix, isSub) => {
		//isSub = _$(isSub, "isSub").isBoolean().default(false)
		var isAr = Array.isArray(aM)
		if ("[object Object]" != Object.prototype.toString.call(aM) && !isAr) throw "Not a map or array"
	
		var out, aMKeys = Object.keys(aM), size = aMKeys.length, ksize = __, vsize = __
		
		// Render key and value
		var _get = (k, v) => {
		  var _k = (isAr ? ["[", k, "]"].join("") : k), _r
		  if (aOptions.withValues) {
			_r = [_ac(__colorFormat.key, _k),
						   _ac("", ("undefined" !== typeof ksize ? " ".repeat(ksize - _k.length) : "")),
						   _ac("", (!("[object Object]" == Object.prototype.toString.call(v) || Array.isArray(v)) ? [_ac(__colorFormat.tree.lines, skey), _clr(v)].join("") : ""))].join("")
		  } else {
			_r = _k
		  }
		  return _r
		}
	  
		// Determine max sizes of keys and values
		var _getCache = {}
		if (aOptions.fullKeySize || aOptions.fullValSize) {
			if (aOptions.fullKeySize) ksize = 0
			if (aOptions.fullValSize) vsize = 0
			aMKeys.forEach(k => {
				if (aOptions.fullKeySize) {
					//var _k = (isAr ? ["[", k, "]"].join("") : k) 
					var _kl = isAr ? k.length + 2 : k.length 
					if (_kl > ksize) ksize = _kl
				}
				if (aOptions.fullValSize) {
					var _gR = _get(k, aM[k])
					var lv = _al(_gR)
					_getCache[k] = _gR
					if (lv > vsize) vsize = lv
				}
			}) 
		}
		
		// Text wrap function
		var _wf = (m, p) => {
			if (!aOptions.wordWrap) return m
		
			if (!isString(m)) return m
		
			if (isString(p)) p = ["undefined" !== typeof p ? p : "", " "].join("")
		
			let mIO = m.indexOf(": ")
			let mSub = m.substring(mIO + 2)
		
			var ss = aWidth
			var ps = _al(p)
			var ms = _al(mSub)
		
			if (m.indexOf("\n") < 0) {
				if (mIO < 0 || ps + ms - 2 < ss) return m
			}
		
			const mIO0 = m.substring(0, mIO + 2)
			const _res = [mIO0,
					_tw(mIO0, mSub, ss-ps-1).map((_l, ii) => {
						if (ii == 0) return _l
						return [_ac("RESET", p), _ac(__colorFormat.string, _l)].join("")
					}).join("\n")].join("")
		
			return _res
		}
	  
		//var _out = new ow.obj.syncMap()
		//parallel4Array(aMKeys.map((k, i) => ({ k: k, i: i })), _v => {
		var out = pForEach(aMKeys, (k, i) => {
			//try {
			let v = aOptions.fullValSize ? _getCache[k] : _get(k, aM[k]), lv = _al(v)
			
			let ksizeOrAlKPlusSline = ("undefined" !== typeof ksize ? ksize : _al(k)) + slines
			let vsizeOrLvPlusSline = ("undefined" !== typeof vsize ? vsize : lv) + slines
			let aPrefix2 = _ac(__colorFormat.tree.lines, (i < (size-1) ? line : " ") + " ".repeat(ksizeOrAlKPlusSline))

			let wfResult = _wf(v, aPrefix + aPrefix2)
			let repeatResult = _ac("", ("undefined" !== typeof vsize ? " ".repeat(vsize - lv+1) : " "))

			let prefix = (i > 0 && size <= (i+1)) ? [aPrefix, _ac(__colorFormat.tree.lines, endc)].join("") : (i == 0) ? _ac(__colorFormat.tree.lines, (size == 1 ? ssrc : strc)) : [aPrefix, _ac(__colorFormat.tree.lines, midc)].join("")
			let reset = (i == 0 || i > 0) ? __ansiColorCache["RESET"] : ""
			let suffix

			if ("undefined" !== typeof aM[k] && aM[k] != null && ("[object Object]" == Object.prototype.toString.call(aM[k]) || Array.isArray(aM[k]))) {
				suffix = _pt(aM[k], aWidth, aOptions, [aPrefix, _ac(__colorFormat.tree.lines, [(i < (size-1) ? line : " "), " ".repeat(vsizeOrLvPlusSline)].join(""))].join(""), true)
			}

			//_out.put(i, [prefix, wfResult, repeatResult, suffix, reset].join(""))
			return [prefix, wfResult, repeatResult, suffix, reset].join("")
			//} catch(e) {
			//	printErr(e)
			//}
		})
		//out = _out.getKeys().sort((a, b) => a - b).map(k => _out.get(k))
		//_out.clear()
		//_out = __
	  
		if (out.length > 0) {
			out = ("undefined" !== typeof out[out.length - 1] && out[out.length - 1].endsWith("\n") ? out.slice(0, -1) : out)
		}
		
		var _res = out.join("\n") + (!isSub ? (!__conConsole ? "" : __ansiColorCache["RESET"]) : "")
		return _res
	}
	var res = _pt(_aM, _aWidth, _aOptions, _aPrefix, _isSub)
	return res
}

/**
 * <odoc>
 * <key>printTreeOrS(aObj, aWidth, aOptions) : String</key>
 * Tries to use printTree with the provided arguments. In case printTree throws an exception (like insufficient width)
 * if will fallback to colorify or stringify (if the noansi option is true).
 * </odoc>
 */
const printTreeOrS = function(aM, aWidth, aOptions) {
	try {
		return printTree(aM, aWidth, aOptions)
	} catch(e) {
		aOptions = merge(__flags.TREE, aOptions)
		if (aOptions.fullKeySize) {
			aOptions.fullKeySize = false
			try {
				return printTree(aM, aWidth, aOptions)
			} catch(e1) {
				aOptions = merge({ noansi: false }, aOptions)
				if (aOptions.noansi) {
					return stringify(aM)
				} else {
					return colorify(aM, aOptions)
				}
			}
		} else {
			aOptions = merge({ noansi: false }, aOptions)
			if (aOptions.noansi) {
				return stringify(aM)
			} else {
				return colorify(aM, aOptions)
			}
		}
	}
}

/**
 * <odoc>
 * <key>printMap(aMap, aWidth, aTheme, useAnsi) : String</key>
 * Returns a ASCII map representation of aMap optionally with a give aWidth, aTheme and/or useAnsi boolean. aTheme can be "utf" or "plain" depending on the
 * terminal capabilities.
 * </odoc>
 */
const printMap = function(aValueR, aWidth, aTheme, useAnsi) {
	if (!isMap(aValueR) && !isArray(aValueR)) throw "Not a map or array.";

	if (isUnDef(aTheme)) {
		ow.loadFormat();
		if (!ow.format.isWindows()) {
			aTheme = (__conAnsi ? "utf" : "plain");
			if (isUnDef(useAnsi) && __initializeCon()) {
				useAnsi = __conAnsi;
			}
		} else {
			if (__initializeCon()) {
				if (!ansiWinTermCap()) ansiStart();
				if (isDef(__con) && isDef(__con.getTerminal().getOutputEncoding())) aTheme = (__conAnsi ? "utf" : "plain");
				if (isUnDef(useAnsi)) {
					useAnsi = __conAnsi;
				}
			}
		}
	}
	
	__initializeCon();
	var matrix = [], matrixrule = [], maxX = 0,	maxY = 0, cM = [], al = [];

	var _getColor = (aValue) => {
		if (isNumber(aValue)) return __colorFormat.number;
		if (isString(aValue)) return __colorFormat.string;
		if (isBoolean(aValue)) return __colorFormat.boolean;
		return __colorFormat.default;
	};

	var _r = (aValue, igX, igY) => {
		if (isMap(aValue) || isArray(aValue)) {
			igX = _$(igX).isNumber().default(0);
			igY = _$(igY).isNumber().default(0);

			var x = igX, y = igY;
			if (isMap(aValue)) {
				var origX = x, aValue2 = {};
				for (var key in aValue) {
					if (isFunction(aValue[key])) 
						delete aValue[key];
					else
						aValue2[key] = aValue[key];
				}
				aValue = aValue2;
				for (var key in aValue) {
					var value = aValue[key];

					origX = x;
					if (isUnDef(matrix[x])) matrix[x] = [];

					matrix[x][igY] = key + ":";
					if (isUnDef(al[x])) al[x] = [];

					al[x][igY] = "r";
					if (useAnsi) {
						if (isUnDef(cM[x])) cM[x] = [];
						cM[x][igY] = __colorFormat.key;
					}

					if (!isMap(value) && !isArray(value)) {
						matrix[x][igY + 1] = String(value);
						al[x][igY + 1] = "l";
						if (useAnsi) {
							if (isUnDef(cM[x])) cM[x] = [];
							cM[x][igY + 1] = _getColor(value);
						}
						x++;
					} else {
						if (x != 0 && matrixrule.indexOf(x - 1) < 0) matrixrule.push(x);
						x = x + _r(value, x, igY + 1) - 1;
					}
				}

				if (isObject(aValue) && Object.keys(aValue).length == 0) {
					if (isUnDef(matrix[x])) matrix[x] = [];
					if (isUnDef(al[x])) al[x] = [];

					matrix[x][igY] = "{}";
					al[x][igY] = "c";

					matrix[x][igY + 1] = "-";
					al[x][igY + 1] = "l";

					if (useAnsi) {
						if (isUnDef(cM[x])) cM[x] = [];
						cM[x][igY] = __colorFormat.key;
						cM[x][igY + 1] = _getColor(__);
					}
					x++;
				}
				matrixrule.push(x);
				x++;
			}

			if (isArray(aValue)) {
				var origX = x;
				for (var ii in aValue) {
					var o = aValue[ii];

					origX = x;
					if (isUnDef(matrix[x])) matrix[x] = [];
					if (isUnDef(al[x])) al[x] = [];
					matrix[x][igY] = "[" + ii + "]";
					al[x][igY] = "r";
					if (useAnsi) {
						if (isUnDef(cM[x])) cM[x] = [];
						cM[x][igY] = __colorFormat.key;
					}

					if (!isMap(o) && !isArray(o)) {
						matrix[x][igY + 1] = String(o);
						al[x][igY + 1] = "l";
						if (useAnsi) {
							if (isUnDef(cM[x])) cM[x] = [];
							cM[x][igY + 1] = _getColor(o);
						}
						x++;
					} else {
						if (x != 0 && matrixrule.indexOf(x - 1) < 0) matrixrule.push(x);
						x = x + _r(o, x, igY + 1) - 1;
					}
				}
				if (aValue.length == 0) {
					if (isUnDef(matrix[x])) matrix[x] = [];
					if (isUnDef(al[x])) al[x] = [];
					matrix[x][igY] = "[]";
					al[x][igY] = "c";
					matrix[x][igY + 1] = "-";
					al[x][igY + 1] = "l";
					if (useAnsi) {
						if (isUnDef(cM[x])) cM[x] = [];
						cM[x][igY] = __colorFormat.key;
						cM[x][igY + 1] = _getColor(__);
					}
					x++;
				}
				matrixrule.push(x);
				x++;
			}

			return x - igX;
		}

		return 0;
	};

	_r(aValueR);

	maxX = matrix.length;
	for (var x in matrix) {
		if (maxY < matrix[x].length) maxY = matrix[x].length;
	}

	var cM2EmptyLine = () => {
		cM2[cm2Line] = [];
		for (var y = 0; y < maxY; y++) {
			cM2[cm2Line][y] = "";
		}
		cm2Line++;
	};
	var cM2 = [], cm2Line = 0;
	var out = new Packages.de.vandermeer.asciitable.v2.V2_AsciiTable();
	out.addRule();
	cM2EmptyLine();
	for (var x = 0; x < maxX; x++) {
		if (matrixrule.indexOf(x) >= 0) {
			out.addRule();
			cM2EmptyLine();
		}
		if (isUnDef(matrix[x])) matrix[x] = [];
		if (isUnDef(al[x])) al[x] = [];
		if (useAnsi && isUnDef(cM2[cm2Line])) cM2[cm2Line] = [];
		for (var y = 0; y < maxY; y++) {
			if (isUnDef(matrix[x][y])) {
				matrix[x][y] = "";
				al[x][y] = "l";
				if (useAnsi) cM2[cm2Line][y] = "";
			} else {
				if (useAnsi) cM2[cm2Line][y] = cM[x][y];
			}
		}
		cm2Line++;
		out.addRow.apply(out, matrix[x]).setAlignment(al[x]);
	}

	out.addRule();
	cM2EmptyLine();
	global.__matrix = matrix;
	global.__matrixrule = matrixrule;
	global.__cm = cM2;

	if (isUnDef(aTheme)) {
		if (io.getDefaultEncoding() == "UTF-8") {
			if (!openafOldTheme && ansiWinTermCap()) {
				aTheme = Packages.de.vandermeer.asciitable.v2.themes.OpenAFTableThemes.OPENAF_UTF_LIGHT.get();
			} else {
				aTheme = Packages.de.vandermeer.asciitable.v2.themes.V2_E_TableThemes.UTF_LIGHT.get();
			}
		} else {
			aTheme = Packages.de.vandermeer.asciitable.v2.themes.V2_E_TableThemes.PLAIN_7BIT.get();
		}
	}

	if (isString(aTheme)) {
		switch(aTheme) {
		case "utf"  : 
			if (!openafOldTheme && ansiWinTermCap()) {
				aTheme = Packages.de.vandermeer.asciitable.v2.themes.OpenAFTableThemes.OPENAF_UTF_LIGHT.get();
			} else {
				aTheme = Packages.de.vandermeer.asciitable.v2.themes.V2_E_TableThemes.UTF_LIGHT.get();
			}
			break;
		case "plain": aTheme = Packages.de.vandermeer.asciitable.v2.themes.V2_E_TableThemes.PLAIN_7BIT.get(); break;
		default     : aTheme = Packages.de.vandermeer.asciitable.v2.themes.V2_E_TableThemes.PLAIN_7BIT.get(); break;
		}
	}
	
	aWidth = _$(aWidth).isNumber().default(isUnDef(__con) ? __ : __con.getTerminal().getWidth() - 2);
	Packages.openaf.asciitable.render.WidthAnsiLongestWordTab.setCallback(function(str) { return visibleLength(str) })
	var rt = new Packages.openaf.asciitable.render.AnsiAsciiTableRenderer(true);
	rt.setTheme(aTheme);
	rt.setWidth(new Packages.openaf.asciitable.render.WidthAnsiLongestWordTab(aWidth));
	var o;
	if (useAnsi)
		o = String(rt.render(out, cM2, __colorFormat.table.lines));
	else
		o = String(rt.render(out));

	return o;
}

var __con, __conStatus, __conAnsi, __conConsole;
if (isUnDef(__conAnsi) && isDef(java.lang.System.getenv().get("TERM"))) {
	__conAnsi = true
}
if (isUnDef(__conAnsi) && String(java.lang.System.getProperty("file.encoding")) != "UTF-8") {
	__conAnsi = false;
}
if (java.lang.System.getenv().get("OAF_CONSOLE") != null) {
	if (String(java.lang.System.getenv().get("OAF_CONSOLE")).toLowerCase().trim() == "true") {
		__conConsole = true
	} else {
		__conAnsi = false
		__conConsole = false
	}
}
if (isUnDef(__conConsole)) {
	__conConsole = java.lang.System.console() != null
}

function __initializeCon() {
	if (isDef(__conStatus)) return __conStatus;

	try {
		af.getClass("jline.console.ConsoleReader");
	} catch(e) {
		while(__con == "") sleep(25);
		__conStatus = true;
		__conAnsi = (isDef(__conAnsi) ? __conAnsi : true);
		if (__conAnsi == true) __ansiColorFlag = true;
		return true;
	}
	
	if (isUnDef(__con) && isUnDef(global.__engineScript)) {
		__con = "";
		plugin("Console");
		try {
			var ___c = new Console();
			__con = (___c).getConsoleReader();
			__conStatus = true;
			__conAnsi = (isDef(__conAnsi) ? __conAnsi : (___c).isAnsiSupported());
			if (__conAnsi == true) __ansiColorFlag = true;
			return true;
		} catch(e) {
			__conStatus = false;
			__conAnsi = (isDef(__conAnsi) ? __conAnsi : false);
			return false;
		}
	} else {
		while(__con == "" && __conConsole) sleep(25, true)
		__conStatus = true;
		__conAnsi = (isDef(__conAnsi) ? __conAnsi : true);
		if (__conAnsi == true) __ansiColorFlag = true;
		return true;
	}
}
 
var __ansiColorCache = {
	RESET: "\x1b[m"
}
const __ansiColorPrep = function(aAnsi) {
	var jansi = JavaImporter(Packages.org.fusesource.jansi)
	var aString = "RRR"

	var nAnsi = []
	aAnsi.split(",").forEach(r => {
		if (r.startsWith("BG(")) {
			var bg = r.match(/BG\((\d+)\)/)
			if (!isNull(bg)) aString = "\033[48;5;" + bg[1] + "m" + aString
		} else if (r.startsWith("FG(")) {
			var fg = r.match(/FG\((\d+)\)/)
			if (!isNull(fg)) aString = "\033[38;5;" + fg[1] + "m" + aString
		} else {
			nAnsi.push(r)
		}
	})

	var o 
	if (nAnsi.length > 0) {
		o = String(jansi.Ansi.ansi().render("@|" + nAnsi.join(",").toLowerCase() + " " + aString + "|@"))
	} else {
		o = aString
	}

	return o.substring(0, o.indexOf("RRR"))
	//return new Function("s", "return \"" + o.replace("RRR", "\"+s+\"") + "\"")
}
/**
 * <odoc>
 * <key>ansiColor(aAnsi, aString, force, noCache, noReset) : String</key>
 * Returns the ANSI codes together with aString, if determined that the current terminal can handle ANSI codes (overridden
 * by force = true), with the attributes defined in aAnsi. Please use with ansiStart() and ansiStop().
 * The optional noReset boolean flag will remove ansi reset as part of the string returned.
 * The attributes separated by commas can be:\
 * \
 * BLACK; RED; GREEN; YELLOW; BLUE; MAGENTA; CYAN; WHITE;\
 * FG_BLACK; FG_RED; FG_GREEN; FG_YELLOW; FG_BLUE; FG_MAGENTA; FG_CYAN; FG_WHITE;\
 * BG_BLACK; BG_RED; BG_GREEN; BG_YELLOW; BG_BLUE; BG_MAGENTA; BG_CYAN; BG_WHITE;\
 * BOLD; FAINT; INTENSITY_BOLD; INTENSITY_FAINT; ITALIC; UNDERLINE; BLINK_SLOW; BLINK_FAST; BLINK_OFF; NEGATIVE_ON; NEGATIVE_OFF; CONCEAL_ON; CONCEAL_OFF; UNDERLINE_DOUBLE; UNDERLINE_OFF;\
 * \
 * </odoc>
 */
const ansiColor = function(aAnsi, aString, force, noCache, noReset) {
	if (!force && !__ansiColorFlag) return aString
	aAnsi = _$(aAnsi, "aAnsi").isString().default("");
	aString = _$(aString, "aString").isString().default("");
	force = _$(force, "force").isBoolean().default(false);
	noCache = _$(noCache, "noCache").isBoolean().default(!__flags.ANSICOLOR_CACHE)

	var ansis = force || __conConsole
	
	if (ansis && aAnsi.length > 0) {
		if (noCache) return __ansiColorPrep(aAnsi) + aString + (noReset ? "" : __ansiColorCache["RESET"])
		if (isDef(__ansiColorCache[aAnsi])) return __ansiColorCache[aAnsi] + aString + (noReset ? "" : __ansiColorCache["RESET"])

		__ansiColorCache[aAnsi] = __ansiColorPrep(aAnsi)
		return __ansiColorCache[aAnsi] + aString + (noReset ? "" : __ansiColorCache["RESET"])
	} else {
		return aString;
	}
}

var __ansiColorFlag = String(java.lang.System.getProperty("os.name")).match(/Windows/) ? true : false;
var __ansiColorValue;
var openafOldTheme = false;

/**
 * <odoc>
 * <key>ansiWinTermCap() : boolean</key>
 * Determines in Windows if the current terminal has support for newer capabilities or not (e.g. cmd.exe)
 * </odoc>
 */
const ansiWinTermCap = function() {
	if (String(java.lang.System.getProperty("os.name")).match(/Windows/)) {
		if (isDef(__ansiColorValue)) return (__ansiColorValue > 3);

		var k32 = Packages.com.sun.jna.Native.loadLibrary("kernel32", Packages.com.sun.jna.platform.win32.Kernel32, com.sun.jna.win32.W32APIOptions.UNICODE_OPTIONS);
		var hout = k32.GetStdHandle(k32.STD_OUTPUT_HANDLE);
		var herr = k32.GetStdHandle(k32.STD_ERROR_HANDLE);
		var mode = new com.sun.jna.ptr.IntByReference();
		if (k32.GetConsoleMode(hout, mode)) {
			__ansiColorValue = mode.getValue();
			k32.SetConsoleMode(hout, 7); //15
			k32.SetConsoleMode(herr, 7); 
			if (__ansiColorValue <= 3) __bfprintFlag = false;
			return (__ansiColorValue > 3);
		} else {
			__bfprintFlag = false;
			return false;
		}
	} else {
		return true;
	}
}

/**
 * <odoc>
 * <key>ansiStart(force)</key>
 * Prepares to output ansi codes if the current terminal is capable off (unless force = true). Use with ansiColor() and ansiStop().
 * </odoc>
 */
const ansiStart = function(force) {
	if (__ansiColorFlag) {
		ansiWinTermCap();
		/*if (isUnDef(__ansiColorValue) && String(java.lang.System.getProperty("os.name")).match(/Windows/)) {
			var k32 = Packages.com.sun.jna.Native.loadLibrary("kernel32", Packages.com.sun.jna.platform.win32.Kernel32, com.sun.jna.win32.W32APIOptions.UNICODE_OPTIONS);
			var hout = k32.GetStdHandle(k32.STD_OUTPUT_HANDLE);
			var herr = k32.GetStdHandle(k32.STD_ERROR_HANDLE);
			var mode = new com.sun.jna.ptr.IntByReference();
			if (k32.GetConsoleMode(hout, mode)) {
				__ansiColorValue = mode.getValue();
				k32.SetConsoleMode(hout, 7); //15
				k32.SetConsoleMode(herr, 7); //
				__ansiColorFlag = true;
			}
		}*/
	} 
	if (!__initializeCon()) return false;
	var con = __con;
	var ansis = force || (__conAnsi && (java.lang.System.console() != null));
	var jansi = JavaImporter(Packages.org.fusesource.jansi);
	if (ansis) {
		java.lang.System.out.flush(); java.lang.System.err.flush();
		jansi.AnsiConsole.systemInstall();
	}
	//}
}

/**
 * <odoc>
 * <key>ansiStop(force)</key>
 * Disables the output of ansi codes if the current terminal is capable off (unless force = true). Use with ansiColor() and ansiStart().
 * </odoc>
 */
const ansiStop = function(force) {
	if (__ansiColorFlag) {
		if (isDef(__ansiColorValue) && String(java.lang.System.getProperty("os.name")).match(/Windows/)) {
			var k32 = Packages.com.sun.jna.Native.loadLibrary("kernel32", Packages.com.sun.jna.platform.win32.Kernel32, com.sun.jna.win32.W32APIOptions.UNICODE_OPTIONS);
			var hout = k32.GetStdHandle(k32.STD_OUTPUT_HANDLE);
			var herr = k32.GetStdHandle(k32.STD_ERROR_HANDLE);
			k32.SetConsoleMode(hout, __ansiColorValue);
			k32.SetConsoleMode(herr, __ansiColorValue);
		}
	} else {
		if (!__initializeCon()) return false;
		var con = __con;
		var ansis = force || (__conAnsi && (java.lang.System.console() != null));
		var jansi = JavaImporter(Packages.org.fusesource.jansi);
		if (ansis) {
			jansi.AnsiConsole.systemUninstall();
			java.lang.System.out.flush(); java.lang.System.err.flush();
		}
	}
}

/**
 * <odoc>
 * <key>ansiLength(aString) : Number</key>
 * Tries to return the aString length without any ansi control sequences.
 * </odoc>
 */

const ansiLength = function(aString, force, useVisibleLength) {
	_$(aString, "aString").isString().$_()
	useVisibleLength = _$(useVisibleLength, "useVisibleLength").isBoolean().default(__flags.VISIBLELENGTH)

	var ansis = force || (__conAnsi && (java.lang.System.console() != null))
	var s 
	if (ansis) {
		s = aString.replace(/\033\[[0-9;]*m/g, "")
	} else {
		s = aString
	}

	if (useVisibleLength)
		return Number(visibleLength(s))
	else
		return Number(s.length)
}

/**
 * Builds a JSON WeDo date type
 *
 * <blockquote><code>
 * wedoDate(2001, 12, 30, 15, 36, 25, 123);
 *
 * @param  {Number} year   The year
 * @param  {Number} month  The month
 * @param  {Number} day    The day
 * @param  {Number} hour   The hours
 * @param  {Number} minute The minutes
 * @param  {Number} second The seconds
 * @param  {Number} ms     The milliseconds
 * @return {JSON}        The WeDo Date type
 *
 * <odoc>
 * <key>wedoDate(year, month, day, hour, minute, second, ms) : Map</key>
 * Builds and returns a wedoDate JSON object given either a year, a month, a day, a hour, a minute, a
 * second and ms or a Date object.
 * </odoc>
 */
const wedoDate = function(year, month, day, hour, minute, second, ms) {
	if ((typeof year) == "number")
		return {"__wedo__type__": "date",
		"content"       : [year + "-" + month + "-" + day + "T" + hour + ":" + minute + ":" + second + "." + ms + "Z"]};

		if (Object.prototype.toString.call(year) == "[object Date]") {
			return {"__wedo__type__": "date",
				"content"       : [year]};
		}

		return {};
}

/**
 * <odoc>
 * <key>beautifier(anObject) : String</key>
 * Shortcut for the af.js2s function providing a human readable representation of the javascript object provided.
 * </odoc>
 */
const beautifier = function(aobj) {
	if (aobj instanceof java.lang.Object) aobj = String(aobj);
	return af.js2s(aobj);
}

/**
 * <odoc>
 * <key>stringify(anObject, replacer, space) : String</key>
 * Converts anObject into a string representation of the same. This is equivalent to the JSON.stringify function.
 * If space isn't defined a "  " (2 spaces) is assumed as the default value. Reverts to the beautifier function
 * if it isn't possible to apply stringify to the current object. 
 * To see more info on the remaining parameters please check https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
 * </odoc>
 */
const stringify = function(aobj, replacer, space) {
	if (aobj instanceof java.lang.Object) aobj = String(aobj);
	if (isUnDef(space)) space = "  ";
	if (isUnDef(replacer)) replacer = (k,v) => (v != null && typeof v.getClass === 'function' && Object.prototype.toString.call(v) === '[object JavaObject]' ? (String(v).startsWith("org.mozilla.javascript.UniqueTag") ? __ : String(v.toString()) ) : v)
	try {
		return JSON.stringify(aobj, replacer, space);
	} catch(e) {
		try {
			return beautifier(aobj);
		} catch(e1) {
			throw e;
		}
	}
}

/**
 * <odoc>
 * <key>colorify(aObject) : String</key>
 * Tries to ANSI colorify a json aObject for use with cprint, cprintErr, cprintErrnl and cprintnl
 * </odoc> 
 */
var __colorFormat = {
	//key: "BOLD,BLACK",
	key: "INTENSITY_BOLD",
	number: "GREEN",
	string: "CYAN",
	boolean: "RED",
	date: "MAGENTA",
	default: "YELLOW",
	askPre: "YELLOW,BOLD",
	askQuestion: "BOLD",
	askChoose: "BOLD,CYAN",
	askChooseFilter: "UNDERLINE",
	askPos: "BLUE",
	askChooseChars: {
		chooseMultipleSelected: "[x]",
		chooseMultipleUnselected: "[ ]",
		chooseUp: "^",
		chooseDown: "v",
		chooseLine: ">"
	},
	table: { lines: "RESET", value: "RESET", title: "BOLD", bandRow: "BOLD" },
	tree: { lines: "" },
	sideLineCustomThemes: {},
	md: {
		codeBlock: {
			line: "YELLOW,BOLD",
			text: "NEGATIVE_ON,ITALIC",
			theme: "openCurvedSpace"
		},
		heads: {
			h1: "WHITE,BOLD,UNDERLINE",
			h2: "BOLD,UNDERLINE",
			h3: "BOLD",
			h4: "UNDERLINE"
		},
		line: "FAINT",
		link: {
			text: "UNDERLINE",
			url: "FAINT"
		},
		bullets: "BOLD",
		list: "BOLD",
		note: {
			line: "FAINT",
			text: __,
			theme: "simpleLine"
		}
	}
};
const colorify = function(json, aOptions, spacing) {
	aOptions = _$(aOptions, "options").isMap().default({})
	var _ac = c => c + (isDef(aOptions.bgcolor) ? (c.trim().length > 0 ? "," : "") + aOptions.bgcolor : "")

	if (typeof json == 'string' || null == json) {
		return json
	}

	if (__flags.ALTERNATIVES.colorify) {
		aOptions.spacing = _$(aOptions.spacing, "options.spacing").isNumber().default(2)
		spacing = _$(spacing, "spacing").isNumber().default(aOptions.spacing)
		var _sl = _$(aOptions.simple, "options simple").isBoolean().default(false)
	
		var _cl = (value, _t) => {
			var _v 
			switch(_t) {
			case "number"   : _v = ansiColor(_ac(__colorFormat.number), String(value)); break
			case "boolean"  : _v = ansiColor(_ac(__colorFormat.boolean), String(value)); break
			case "string"   : _v = ansiColor(_ac(__colorFormat.string), '"' + value + '"'); break
			case "date"     : _v = ansiColor(_ac(__colorFormat.date), value.toISOString()); break
			case "undefined": _v = ansiColor(_ac(__colorFormat.default), "undefined"); break
			case "null"     : _v = ansiColor(_ac(__colorFormat.default), "null"); break
			default         : _v = ansiColor(_ac(__colorFormat.default), String(value)); break
			}
			return _v
		}

		var ks = Object.keys(json)
		var ksl = ks.length
		var pdt = descType(json)
		var psp = ansiColor(_ac(""),repeat(spacing - aOptions.spacing, " "))
		var sp = ansiColor(_ac(""),repeat(spacing, " "))

		if (ksl == 0) {
			if (pdt == "array") return ansiColor(_ac(""), "[]")
			if (pdt == "object" || pdt == "map") return ansiColor(_ac(""), "{}")
		}
		if (pdt != "object" && pdt != "map" && pdt != "array") return _cl(json, pdt)

		var out = new Set()
		out.add(ansiColor(_ac(""), pdt == "map" ? "{\n" : "[\n"))
		out.add(pForEach(ks, (key, i) => {
			var _pout = new Set()
			var value = json[key]
			var _t = descType(value)
			var _keyp = [sp, (pdt == "map" ? [ansiColor(_ac(""),(_sl ? '' : '"')), ansiColor(_ac(__colorFormat.key), key), (_sl ? '' : ansiColor(_ac(""),'"')), ansiColor(_ac(""),': ')].join("") : "")].join("")
			var _keys = ((i+1) < ksl ? ansiColor(_ac(""), ",\n") : "\n")
			if (_t != "object" && _t != "map" && _t != "array") {
				_pout.add([_keyp, _cl(value, _t), _keys].join(""))
			} else {
				if (Object.keys(value).length == 0) _pout.add([_keyp, ansiColor(_ac(""), (pdt == "array" ? "[]" : "{}")), _keys].join(""))
				else _pout.add(_keyp + colorify(value, aOptions, spacing + aOptions.spacing) + _keys)
			}
			return Array.from(_pout).join("")
		}).join(""))
		out.add([psp, ansiColor(_ac(""), (pdt == "map" ? "}" : "]"))].join(""))
	
		return Array.from(out).join("")
	} else {
		if (typeof json != 'string') {
			json = stringify(json, __, 2)
		}

		var _r = String(json).replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
			var cls = 'number';
			if (/^"/.test(match)) {
				if (/:$/.test(match)) {
					cls = 'key';
				} else {
					cls = 'string';
				}
			} else if (/true|false/.test(match)) {
				cls = 'boolean';
			} else if (/null/.test(match)) {
				cls = 'null';
			}
			var res = ""; 
			switch(cls) {
			case "key"    : 
			   if (isDef(__colorFormat) && isDef(__colorFormat.key)) res = ansiColor(_ac(__colorFormat.key), match); else res = match; break;
			case "number" : 
			   if (isDef(__colorFormat) && isDef(__colorFormat.number)) res = ansiColor(_ac(__colorFormat.number), match); else res = match; break;
			case "string" : 
			   if (isDef(__colorFormat) && isDef(__colorFormat.string)) res = ansiColor(_ac(__colorFormat.string), match); else res = match; break;
			case "boolean": 
			   if (isDef(__colorFormat) && isDef(__colorFormat.boolean)) res = ansiColor(_ac(__colorFormat.boolean), match); else res = match; break;
			default: 
			   if (isDef(__colorFormat) && isDef(__colorFormat.default)) res = ansiColor(_ac(__colorFormat.default), match); else res = match;
			}
			return res;
		})
	
		return (isDef(aOptions.bgcolor) ? _r.replace(/\u001b\[m([ ,\{\}\[\]]+)/g, ansiColor(_ac("RESET"), "$1")) : _r)
	}
}

__JSONformat = {
  unsafe: true
};
/**
 * <odoc>
 * <key>jsonParse(aString, alternative, unsafe, ignoreNonJson) : Map</key>
 * Shorcut for the native JSON.parse that returns an empty map if aString is not defined, empty or unparsable.
 * </odoc>
 */
const jsonParse = function(astring, alternative, unsafe, ignoreNonJson) {
	if (isDef(astring) && String(astring).length > 0) {
		if (ignoreNonJson && isString(astring)) {
			let startIndex, endIndex
			let startIndexA = astring.indexOf("[")
			let endIndexA   = astring.lastIndexOf("]")
			let startIndexM = astring.indexOf("{")
			let endIndexM   = astring.lastIndexOf("}")
			// No map but array exists
			if (startIndexM < 0 && endIndexM < 0 && startIndexA > -1 && endIndexA > -1) {
				startIndex = startIndexA
				endIndex   = endIndexA
			}
			// Map exists and array exists
			if (startIndexM > -1 && endIndexM > -1 && startIndexA > -1 && endIndexA > -1) {
				startIndex = startIndexA < startIndexM ? startIndexA : startIndexM
				endIndex   = startIndexA < startIndexM ? endIndexA : endIndexM
			}
			// Map exists but array doesn't
			if (startIndexM > -1 && endIndexM > -1 && startIndexA < 0 && endIndexA < 0) {
				startIndex = startIndexM
				endIndex   = endIndexM
			}

			if (startIndex >= 0 && endIndex >= 0 && startIndex < endIndex) {
				astring = astring.substring(startIndex)
				astring = astring.substring(0, (endIndex - startIndex) + 1)
			}
		}
		try {
			var a;
			if (_$(alternative).default(__flags.ALTERNATIVES.jsonParse)) {
				a = af.jsonParse(astring, true);
			} else {
				a = JSON.parse(astring);
			}
			if (__JSONformat.unsafe && unsafe) {
				traverse(a, (aK, aV, aP, aO) => { if (isString(aV) && aV.startsWith("!!js/eval ")) aO[aK] = eval(aV.slice(10)); });
			}
			return a;
		} catch(e) {
			return astring;
		}
	} else {
		return {};
	}
}

/**
 * <odoc>
 * <key>templify(aTemplateString, someData) : String</key>
 * Using Handlebars and the functionality provided in ow.template, will use the aTemplateString as a Handlebars template
 * and return the parsed output. Optionally you can provide someData as data for the Handlebars template 
 * otherwise the current scope will be used.\
 * \
 * Example:\
 * \
 * var someText = "Hello World!";\
 * var retText = templify("Hi, {{someText}}"); // Hi, Hello World!
 * </odoc>
 */
const templify = function(aTemplateString, someData) {
	someData = (isUnDef(someData)) ? this : someData
	if (isUnDef(ow.template)) { ow.loadTemplate(); ow.template.addOpenAFHelpers() }
	if (isUnDef(aTemplateString) || aTemplateString == "") return ""
	return String(ow.template.parse(String(aTemplateString), someData))
}

const $t = templify

/**
 * <odoc>
 * <key>sleep(millis, shouldCheck)</key>
 * Shortcut for af.sleep function. Will pause execution for a given period of time expressed in milliseconds.
 * If shouldCheck is true it will enforce checking if the time has really passed or not.
 * </odoc>
 */
const sleep = function(millis, shouldCheck, alternative) {
	var ini = now();
	if (alternative) {
		af.sleep(millis);
	} else {
		java.util.concurrent.TimeUnit.MILLISECONDS.sleep(millis);			
	}
	if (shouldCheck) {
		// Something went wrong.
		while((now() - ini) < millis) {
			if ((millis - (now() - ini)) > 0) 
				java.util.concurrent.TimeUnit.MILLISECONDS.sleep(millis - (now() - ini));
		}
	}
}

/**
 * <odoc>
 * <key>genUUID(useSecureRandom) : String</key>
 * Generates and returns an UUID using a javascript algorithm (if needed you can refer to the 
 * AF operation AF.KeyGenerator.GenerateUUID).
 * </odoc>
 */
const genUUID = function(useSecureRandom) {
	if (useSecureRandom || __flags.USE_JAVA_GENUUID) 
		return String(java.util.UUID.randomUUID())
	else {
		// Internal generate UUID
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1)
		};
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
		s4() + '-' + s4() + s4() + s4()
	}
}

/**
 * <odoc>
 * <key>toCSV(anArray) : CSV</key>
 * Converts a given javascript anArray into a CSV object instance.
 * </odoc>
 */
const toCSV = function(anArray) {
	var csv = new CSV();
	csv.toCsv(anArray);
	return csv;
}

var __logStatus;
if (isUnDef(__logStatus)) __logStatus = false;
var __logFormat = {
	dateFormat: "yyyy-MM-dd HH:mm:ss.SSS",
	separator : " | ",
	indent    : "",
	async     : true,
	asyncLevel: 3,
	profile   : false,
	format    : "default"
};
var __logPromise;

const __initializeLogPromise = function() {
	if (__logFormat.async) {
		if (isUnDef(__logPromise)) {
			__logPromise = $do(() => {}).catch((e) => {});
			addOnOpenAFShutdown(() => {
				$doWait(__logPromise, 5000);
			});
			return true;
		} else {
			if (__logPromise.executors.size() > __logPromise.asyncLevel) {
				$doWait(__logPromise);
			}
			return false;
		}
	}
}

/**
 * <odoc>
 * <key>logFlush(aTimeout)</key>
 * Will wait for the current log promise to finish. Optionally you can provide aTimeout in milliseconds.
 * </odoc>
 */
function logFlush(aTimeout) {
	aTimeout = _$(aTimeout, "timeout").isNumber().default(__)
	$doWait(__logPromise, aTimeout)
}

/**
 * <odoc>
 * <key>setLog(aMap)</key>
 * Sets the current log output settings:\
 * \
 * - off        (boolean) Turns off output to stdout/stderr\
 * - offInfo    (boolean) Turns off output of INFO\
 * - offError   (boolean) Turns off output of ERROR\
 * - offWarn    (boolean) Turns off output of WARN\
 * - dateFormat (string)  ow.format.fromDate format for date\
 * - dateTZ     (string)  Time zone to use with ow.format.fromDate\
 * - separator  (string)  String to use as separator\
 * - async      (boolean) Run in async mode\
 * - profile    (boolean) Gathers memory and system load stats\
 * - format     (string)  Sets the format to output logs (e.g. json, slon, human)\
 * \
 * </odoc>
 */
const setLog = function(aMap) {
	__logFormat = merge(__logFormat, aMap);
}

/**
 * <odoc>
 * <key>startLog(externalLogging, hkItems)</key>
 * Starts collecting log messages logged with log* functions. See stopLog() and dumpLog().
 * You can also specify externalLogging, a custom channel subscribe function and a different number
 * of hkItems (housekeeping items) from the default 100 (if -1 it won't delete items).
 * </odoc>
 */
const startLog = function(externalLogging, hkItems) {
	hkItems = _$(hkItems, "hkItems").isNumber().default(100);
	$ch("__log").create(true, "simple");
	if (hkItems > -1 && isUnDef(__logFormat.hk)) __logFormat.hk = $ch("__log").subscribe(ow.ch.utils.getHousekeepSubscriber("__log", hkItems));
	__logStatus = true;
	global.__logQueue = [];
	if (isDef(externalLogging) && isFunction(externalLogging)) {
		addOnOpenAFShutdown(function() {
			stopLog();
		});
		return $ch("__log").subscribe(externalLogging);
	}
}

/**
 * <odoc>
 * <key>getChLog() : Channel</key>
 * Returns the current log dump channel.
 * </odoc>
 */
const getChLog = function() {
	if (__logStatus) 
		return $ch("__log");
	else
		return undefined;
}

/**
 * <odoc>
 * <key>dumpLog() : Array</key>
 * Returns an array with collected log messages. Each entry has: d - timestamp; t - type; m - message.
 * </odoc>
 */
const dumpLog = function() {
	return $ch("__log").getAll();
}

/**
 * <odoc>
 * <key>stopLog()</key>
 * Will stop collecting log messages and will reset everything. User dumpLog() before stopping if you intend
 * to keep the recorded log messages.
 * </odoc>
 */
const stopLog = function() {
	__logStatus = false;
	/*if (isDef(global.__logQueue) && global.__logQueue > 0) {
		var it = now();
		while((now() - it < 3000) && global.__logQueue > 0) {
			$ch("__log").waitForJobs();
		}
		delete global.__logQueue;
	}*/
	//sleep(100);
	$ch("__log").waitForJobs(-1);
	$ch("__log").destroy();
	__logFormat.hk = __
}

/**
 * <odoc>
 * <key>log(msg, formatOptions)</key>
 * Outputs to the current stdout a line composed of the current date, indication of INFO and the provided msg.
 * Optionally you can provide a formatOptions map for overriding the defaults from setLog.
 * Note: you can use startLog, stopLog and dumpLog to keep an internal record of theses messages.
 * </odoc>
 */
const log = function(msg, formatOptions) {
	var data = (new Date()).toJSON(), nw = nowNano(), k, v;
	__clogInfo.inc();
	if (isDef(__logFormat)) formatOptions = merge(__logFormat, formatOptions);
	if (__logStatus) {
		var f = () => {
			k = { n: nw, t: "INFO" };
			v = { n: nw, d: data, t: "INFO", m: msg };
			if (isDef(formatOptions) && formatOptions.profile) {
				v.freeMem = Number(java.lang.Runtime.getRuntime().freeMemory());
				v.totalMem = Number(java.lang.Runtime.getRuntime().totalMemory());
				v.systemLoad = getCPULoad();
			}
			$ch("__log").set(k, v);
		};
		if (isDef(formatOptions) && formatOptions.async) {
			if (isDef(global.__logQueue)) global.__logQueue.push(nw + "S");
			__initializeLogPromise();
			__logPromise = __logPromise.then(f, ()=> {
				if (isDef(global.__logQueue)) deleteFromArray(global.__logQueue, global.__logQueue.indexOf(nw + "S"));
			}).then(() => {
				if (isDef(global.__logQueue)) deleteFromArray(global.__logQueue, global.__logQueue.indexOf(nw + "S"));
			});
		} else 
			f();
	}
	var go = (isDef(formatOptions) && (formatOptions.off || formatOptions.offInfo)) ? false : true;
	if (go) {
		if (isUnDef(__conStatus)) __initializeCon();
		var f = () => {
			formatOptions = _$(formatOptions).isMap().default({});
			formatOptions.format = _$(formatOptions.format).isString().default("default");
			switch(formatOptions.format) {
			case "json":
				sprint({ "@timestamp": new Date(data), level: "INFO", message: msg }, "");
				break;
			case "slon":
				print(af.toSLON({ "@timestamp": new Date(data), level: "INFO", message: msg }));
				break;
			default:
				var sep = (isDef(formatOptions) && (isDef(formatOptions.separator))) ? formatOptions.separator : " | ";
				var ind = (isDef(formatOptions) && (isDef(formatOptions.indent))) ? formatOptions.indent : "";
				ansiStart();
				data = (isDef(formatOptions) && isDef(formatOptions.dateFormat)) ? ow.loadFormat().fromDate(new Date(data), formatOptions.dateFormat, formatOptions.dateTZ) : data;
				print(ind + ansiColor("BOLD", data) + sep + "INFO" + sep + msg);
				ansiStop();
			}
			return 1;
		};
		if (isDef(formatOptions) && formatOptions.async) {
			if (isDef(global.__logQueue)) global.__logQueue.push(nw + "S");
			__initializeLogPromise();
			__logPromise = __logPromise.then(f, ()=>{
				if (isDef(global.__logQueue)) deleteFromArray(global.__logQueue, global.__logQueue.indexOf(nw + "S"));
			}).then(() => {
				if (isDef(global.__logQueue)) deleteFromArray(global.__logQueue, global.__logQueue.indexOf(nw + "S"));
			});
		} else 
			f();
	}
}

/**
 * <odoc>
 * <key>tlog(msg, someData, formatOptions)</key>
 * Outputs to the current stdout a line composed of the current date, indication of INFO and the provided msg using the templify function.
 * Optionally you can provide also someData and you can provide a formatOptions map for overriding the defaults from setLog.
 * Note: you can use startLog, stopLog and dumpLog to keep an internal record of theses messages.
 * </odoc>
 */
const tlog = function(msg, someData, formatOptions) {
	log(templify(msg, someData), formatOptions);
}

/**
 * <odoc>
 * <key>lognl(msg, formatOptions)</key>
 * Outputs to the current stdout, without a new line, a sentence composed of the current date, indication of INFO and the provided msg.
 * Optionally you can provide a formatOptions map for overriding the defaults from setLog.
 * Note: you can use startLog, stopLog and dumpLog to keep an internal record of theses messages.
 * </odoc>
 */
const lognl = function(msg, formatOptions) {
	var data = (new Date()).toJSON(), nw = nowNano(), k, v;
	__clogInfo.inc();
	if (isDef(__logFormat)) formatOptions = merge(__logFormat, formatOptions);
	if (__logStatus) {
		var f = () => {
			k = { n: nw, t: "INFO" };
			v = { n: nw, d: data, t: "INFO", m: msg };
			if (isDef(formatOptions) && formatOptions.profile) {
				v.freeMem = Number(java.lang.Runtime.getRuntime().freeMemory());
				v.totalMem = Number(java.lang.Runtime.getRuntime().totalMemory());
				v.systemLoad = getCPULoad();
			}
			$ch("__log").set(k, v);
		};
		if (isDef(formatOptions) && formatOptions.async) {
			if (isDef(global.__logQueue)) global.__logQueue.push(nw + "S");
			__initializeLogPromise();
			__logPromise = __logPromise.then(f, ()=>{
				if (isDef(global.__logQueue)) deleteFromArray(global.__logQueue, global.__logQueue.indexOf(nw + "S"));
			}).then(() => {
				if (isDef(global.__logQueue)) deleteFromArray(global.__logQueue, global.__logQueue.indexOf(nw + "S"));
			});
		} else 
			f();
	}
	var go = (isDef(formatOptions) && (formatOptions.off || formatOptions.offInfo)) ? false : true;
	if (go) {
		if (isUnDef(__conStatus)) __initializeCon();
		var f = () => {
			formatOptions = _$(formatOptions).isMap().default({});
			formatOptions.format = _$(formatOptions.format).isString().default("default");
			switch(formatOptions.format) {
			case "json":
				sprintnl({ "@timestamp": new Date(data), level: "INFO", message: msg }, "");
				break;
			case "slon":
				printnl(af.toSLON({ "@timestamp": new Date(data), level: "INFO", message: msg }));
				break;
			default:
				var sep = (isDef(formatOptions) && (isDef(formatOptions.separator))) ? formatOptions.separator : " | ";
				var ind = (isDef(formatOptions) && (isDef(formatOptions.indent))) ? formatOptions.indent : "";
				ansiStart();
				data = (isDef(formatOptions) && isDef(formatOptions.dateFormat)) ? ow.loadFormat().fromDate(new Date(data), formatOptions.dateFormat, formatOptions.dateTZ) : data;
				printnl(ind + ansiColor("BOLD", data) + sep + "INFO" + sep + msg);
				ansiStop();
			}

			return 1;
		};
		if (isDef(formatOptions) && formatOptions.async) {
			if (isDef(global.__logQueue)) global.__logQueue.push(nw + "S");
			__initializeLogPromise();
			__logPromise = __logPromise.then(f, ()=>{
				if (isDef(global.__logQueue)) deleteFromArray(global.__logQueue, global.__logQueue.indexOf(nw + "S"));
			}).then(() => {
				if (isDef(global.__logQueue)) deleteFromArray(global.__logQueue, global.__logQueue.indexOf(nw + "S"));
			});
		} else 
			f();	
		
	}
}

/**
 * <odoc>
 * <key>tlognl(msg, someData, formatOptions)</key>
 * Outputs to the current stdout, without a new line, a sentence composed of the current date, indication of INFO and the provided msg using the templify function.
 * Optionally you can provide a formatOptions map for overriding the defaults from setLog.
 * Optinionally you can provide also someData.
 * </odoc>
 */
const tlognl = function(msg, someData, formatOptions) {
	lognl(templify(msg, someData), formatOptions);
}

/**
 * <odoc>
 * <key>logErr(msg, formatOptions)</key>
 * Outputs to the current stderr a line composed of the current date, indication of ERROR and the provided msg.
 * Optionally you can provide a formatOptions map for overriding the defaults from setLog.
 * Note: you can use startLog, stopLog and dumpLog to keep an internal record of theses messages.
 * </odoc>
 */
const logErr = function(msg, formatOptions) {
	var data = (new Date()).toJSON(), nw = nowNano(), k, v;
	__clogErr.inc();
	if (isDef(__logFormat)) formatOptions = merge(__logFormat, formatOptions);
	if (__logStatus) {
		var f = () => {
			k = { n: nw, t: "ERROR" };
			v = { n: nw, d: data, t: "ERROR", m: msg };
			if (isDef(formatOptions) && formatOptions.profile) {
				v.freeMem = Number(java.lang.Runtime.getRuntime().freeMemory());
				v.totalMem = Number(java.lang.Runtime.getRuntime().totalMemory());
				v.systemLoad = getCPULoad();
			}
			$ch("__log").set(k, v);
		};
		if (isDef(formatOptions) && formatOptions.async) {
			if (isDef(global.__logQueue)) global.__logQueue.push(nw);
			__initializeLogPromise();
			__logPromise = __logPromise.then(f, ()=>{
				if (isDef(global.__logQueue)) deleteFromArray(global.__logQueue, global.__logQueue.indexOf(nw));
			}).then(() => {
				if (isDef(global.__logQueue)) deleteFromArray(global.__logQueue, global.__logQueue.indexOf(nw));
			});
		} else 
			f();
	}
	var go = (isDef(formatOptions) && (formatOptions.off || formatOptions.offError)) ? false : true;
	if (go) {
		if (isUnDef(__conStatus)) __initializeCon();
		var f = () => {
			formatOptions = _$(formatOptions).isMap().default({});
			formatOptions.format = _$(formatOptions.format).isString().default("default");
			switch(formatOptions.format) {
			case "json":
				sprintErr({ "@timestamp": new Date(data), level: "ERROR", message: msg }, "");
				break;
			case "slon":
				printErr(af.toSLON({ "@timestamp": new Date(data), level: "ERROR", message: msg }));
				break;
			default:
				var sep = (isDef(formatOptions) && (isDef(formatOptions.separator))) ? formatOptions.separator : " | ";
				var ind = (isDef(formatOptions) && (isDef(formatOptions.indent))) ? formatOptions.indent : "";
				ansiStart();
				data = (isDef(formatOptions) && isDef(formatOptions.dateFormat)) ? ow.loadFormat().fromDate(new Date(data), formatOptions.dateFormat, formatOptions.dateTZ) : data;
				printErr(ind + ansiColor("BOLD", data) + sep + ansiColor("red", "ERROR") + sep + msg);
				ansiStop();
			}

			return 1;
		};
		if (isDef(formatOptions) && formatOptions.async) {
			if (isDef(global.__logQueue)) global.__logQueue.push(nw + "S");
			__initializeLogPromise();
			__logPromise = __logPromise.then(f, ()=>{
				if (isDef(global.__logQueue)) deleteFromArray(global.__logQueue, global.__logQueue.indexOf(nw + "S"));
			}).then(() => {
				if (isDef(global.__logQueue)) deleteFromArray(global.__logQueue, global.__logQueue.indexOf(nw + "S"));
			});
		} else 
			f();		

	}	
}

/**
 * <odoc>
 * <key>logWarn(msg, formatOptions)</key>
 * Outputs to the current warning in a line composed of the current date, indication of WARN and the provided msg.
 * Optionally you can provide a formatOptions map for overriding the defaults from setLog.
 * Note: you can use startLog, stopLog and dumpLog to keep an internal record of theses messages.
 * </odoc>
 */
const logWarn = function(msg, formatOptions) {
	var data = (new Date()).toJSON(), nw = nowNano(), k, v;
	__clogWarn.inc();
	if (isDef(__logFormat)) formatOptions = merge(__logFormat, formatOptions);
	if (__logStatus) {
		var f = () => {
			k = { n: nw, t: "WARN" };
			v = { n: nw, d: data, t: "WARN", m: msg };
			if (isDef(formatOptions) && formatOptions.profile) {
				v.freeMem = Number(java.lang.Runtime.getRuntime().freeMemory());
				v.totalMem = Number(java.lang.Runtime.getRuntime().totalMemory());
				v.systemLoad = getCPULoad();
			}
			$ch("__log").set(k, v);
		};
		if (isDef(formatOptions) && formatOptions.async) {
			if (isDef(global.__logQueue)) global.__logQueue.push(nw);
			__initializeLogPromise();
			__logPromise = __logPromise.then(f, ()=>{
				if (isDef(global.__logQueue)) deleteFromArray(global.__logQueue, global.__logQueue.indexOf(nw));
			}).then(() => {
				if (isDef(global.__logQueue)) deleteFromArray(global.__logQueue, global.__logQueue.indexOf(nw));
			});
		} else 
			f();
	}
	var go = (isDef(formatOptions) && (formatOptions.off || formatOptions.offWarn)) ? false : true;
	if (go) {
		if (isUnDef(__conStatus)) __initializeCon();
		var f = () => {
			formatOptions = _$(formatOptions).isMap().default({});
			formatOptions.format = _$(formatOptions.format).isString().default("default");
			switch(formatOptions.format) {
			case "json":
				sprint({ "@timestamp": new Date(data), level: "WARN", message: msg }, "");
				break;
			case "slon":
				print(af.toSLON({ "@timestamp": new Date(data), level: "WARN", message: msg }));
				break;
			default:
				var sep = (isDef(formatOptions) && (isDef(formatOptions.separator))) ? formatOptions.separator : " | ";
				var ind = (isDef(formatOptions) && (isDef(formatOptions.indent))) ? formatOptions.indent : "";
				ansiStart();
				data = (isDef(formatOptions) && isDef(formatOptions.dateFormat)) ? ow.loadFormat().fromDate(new Date(data), formatOptions.dateFormat, formatOptions.dateTZ) : data;
				print(ind + ansiColor("BOLD", data) + sep + ansiColor("yellow", "WARN") + sep + msg);
				ansiStop();
			}
			return 1;
		};
		if (isDef(formatOptions) && formatOptions.async) {
			if (isDef(global.__logQueue)) global.__logQueue.push(nw + "S");
			__initializeLogPromise();
			__logPromise = __logPromise.then(f, ()=>{
				if (isDef(global.__logQueue)) deleteFromArray(global.__logQueue, global.__logQueue.indexOf(nw + "S"));
			}).then(() => {
				if (isDef(global.__logQueue)) deleteFromArray(global.__logQueue, global.__logQueue.indexOf(nw + "S"));
			});
		} else 
			f();		
	}		
}

/**
 * <odoc>
 * <key>tlogErr(msg, someData, formatOptions)</key>
 * Outputs to the current stderr a line composed of the current date, indication of ERROR and the provided msg using the templify function.
 * Optionally you can provide a formatOptions map for overriding the defaults from setLog. 
 * Optinionally you can provide also someData.
 * </odoc>
 */
const tlogErr = function(msg, someData, formatOptions) {
	logErr(templify(msg, someData), formatOptions);
}

/**
 * <odoc>
 * <key>tlogWarn(msg, someData, formatOptions)</key>
 * Outputs to the current warning in a line composed of the current date, indication of WARN and the provided msg using the templify function.
 * Optionally you can provide a formatOptions map for overriding the defaults from setLog. 
 * Optinionally you can provide also someData.
 * </odoc>
 */
const tlogWarn = function(msg, someData, formatOptions) {
	logWarn(templify(msg, someData), formatOptions);
}

/**
 * <odoc>
 * <key>isJavaException(aObject) : boolean</key>
 * Determines if aObject is a java exception object or a javascript exception with an embeeded java exception.
 * </odoc>
 */
const isJavaException = function(aObj) {
	if (isObject(aObj)) {
		if (isJavaObject(aObj)) {
			return aObj instanceof java.lang.Exception;
		}
		if (isDef(aObj.javaException) && isJavaObject(aObj.javaException)) {
			return aObj.javaException instanceof java.lang.Exception;
		}
	}
	return false;
}

/**
 * <odoc>
 * <key>getJavaStackTrace(anException) : Array</key>
 * Given a javascript anException, if it's a wrapped or directly a java exception it will try to obtain the corresponding stack
 * trace information in the form of an array.
 * </odoc>
 */
const getJavaStackTrace = function(anException) {
	if (isJavaException(anException)) {
		var ar = [], res = [];
		if (isDef(anException.javaException))
			ar = af.fromJavaArray(anException.javaException.getStackTrace());
		else
			ar = af.fromJavaArray(anException.getStackTrace());

		ar.forEach(r => {
			res.push({
				moduleName: r.getModuleName(),
				moduleVersion: r.getModuleVersion(),
				qclassLoaderName: r.getClassLoaderName(),
				className: r.getClassName(),
				methodName: r.getMethodName(),
				lineNumber: r.getLineNumber(),
				fileName: r.getFileName(),
				nativeMethod: r.isNativeMethod()
			});
		});

		return res;
	} else {
		return anException;
	}
}

/**
 * <odoc>
 * <key>repeat(nTimes, aStr) : String</key>
 * Will build a string composed of aStr repeated nTimes.
 * </odoc>
 */
const repeat = (nTimes, aStr) => aStr.repeat(nTimes)

/**
 * <odoc>
 * <key>now() : Number</key>
 * Will return the current system time in milliseconds.
 * </odoc>
 */
const now = function() {
	return Number(java.lang.System.currentTimeMillis());
}

/**
 * <odoc>
 * <key>nowE() : Number</key>
 * Returns the current epoch time in seconds.
 * </odoc>
 */
const nowE = function() {
	return Number(java.time.Instant.now().getEpochSecond())
}

/**
 * <odoc>
 * <key>nowNanoE() : Number</key>
 * Returns the current epoch time in nanoseconds.
 * </odoc>
 */
const nowNanoE = function() {
	var t = java.time.Instant.now()
	return $f("%.0f%09.0f", t.getEpochSecond(), t.getNano())
}

/**
 * <odoc>
 * <key>nowUTC() : Number</key>
 * Will return the current system time in milliseconds.
 * </odoc>
 */
const nowUTC = function() {
	return Number(java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("UTC")).getTimeInMillis());
}

/**
 * <odoc>
 * <key>nowTZ() : Number</key>
 * Returns the same as now() but adjusted with the local timezone offset.
 * </odoc>
 */
const nowTZ = function() {
	return now() - Number(new Date().getTimezoneOffset() * 1000)
}

/**
 * <odoc>
 * <key>nowNano() : Number</key>
 * Will return the current system time in nanoseconds.
 * </odoc>
 */
const nowNano = function() {
	return Number(java.lang.System.nanoTime());
}

/**
 * <odoc>
 * <key>md2(anObject) : String</key>
 * Will return of the MD2 in hexadecimal format for a given anObject.\
 * For files you can provide a file stream: var s = io.readFileStream(getOpenAFJar()); md2(s); s.close()
 * </odoc>
 */
const md2 = function(obj) {
	var DigestUtils = org.apache.commons.codec.digest.DigestUtils;
	return DigestUtils.md2Hex(obj) + "";
}


/**
 * <odoc>
 * <key>md5(anObject) : String</key>
 * Will return of the MD5 in hexadecimal format for a given anObject.\
 * For files you can provide a file stream: var s = io.readFileStream(getOpenAFJar()); md5(s); s.close()
 * </odoc>
 */
const md5 = function(obj) {
	var DigestUtils = org.apache.commons.codec.digest.DigestUtils;
	return DigestUtils.md5Hex(obj) + "";
}

/**
 * <odoc>
 * <key>sha1(anObject) : String</key>
 * Will return of the SHA-1 in hexadecimal format for a given anObject.\
 * For files you can provide a file stream: var s = io.readFileStream(getOpenAFJar()); sha1(s); s.close()
 * </odoc>
 */
const sha1 = function(obj) {
	var DigestUtils = org.apache.commons.codec.digest.DigestUtils;
	return DigestUtils.sha1Hex(obj) + "";
}

/**
 * <odoc>
 * <key>sha256(anObject) : String</key>
 * Will return of the SHA-256 in hexadecimal format for a given anObject.\
 * For files you can provide a file stream: var s = io.readFileStream(getOpenAFJar()); sha256(s); s.close()
 * </odoc>
 */
const sha256 = function(obj) {
	var DigestUtils = org.apache.commons.codec.digest.DigestUtils;
	return DigestUtils.sha256Hex(obj) + "";
}

/**
 * <odoc>
 * <key>sha384(anObject) : String</key>
 * Will return of the SHA-384 in hexadecimal format for a given anObject.\
 * For files you can provide a file stream: var s = io.readFileStream(getOpenAFJar()); sha384(s); s.close()
 * </odoc>
 */
const sha384 = function(obj) {
	var DigestUtils = org.apache.commons.codec.digest.DigestUtils;
	return DigestUtils.sha384Hex(obj) + "";
}

/**
 * <odoc>
 * <key>sha512(anObject) : String</key>
 * Will return of the SHA-512 in hexadecimal format for a given anObject.\
 * For files you can provide a file stream: var s = io.readFileStream(getOpenAFJar()); sha512(s); s.close()
 * </odoc>
 */
const sha512 = function(obj) {
	var DigestUtils = org.apache.commons.codec.digest.DigestUtils;
	return DigestUtils.sha512Hex(obj) + "";
}

/**
 * <odoc>
 * <key>hmacSHA256(data, key, toHex) : ArrayOfBytes</key>
 * Given data and a key will calculate the hash-based message authentication code (HMAC) using the SHA256 hash
 * function. Optionally if toHex = true the output will be converted to hexadecimal lower case.
 * </odoc>
 */
const hmacSHA256 = function(data, key, toHex, alg) {
	var alg = _$(alg).default("HmacSHA256");
	if (isString(key)) key = (new java.lang.String(key)).getBytes("UTF-8");
	var mac = javax.crypto.Mac.getInstance(alg);
	mac.init(new javax.crypto.spec.SecretKeySpec(key, alg));
	var res = mac.doFinal(new java.lang.String(data).getBytes("UTF-8"));
	if (toHex) {
		ow.loadFormat();
		res = ow.format.string.toHex(res, "").toLowerCase();
	}
	return res;
}

/**
 * <odoc>
 * <key>hmacSHA512(data, key, toHex) : ArrayOfBytes</key>
 * Given data and a key will calculate the hash-based message authentication code (HMAC) using the SHA512 hash
 * function. Optionally if toHex = true the output will be converted to hexadecimal lower case.
 * </odoc>
 */
const hmacSHA512 = function(data, key, toHex) {
	return hmacSHA256(data, key, toHex, "HmacSHA512");
}

/**
 * <odoc>
 * <key>hmacSHA384(data, key, toHex) : ArrayOfBytes</key>
 * Given data and a key will calculate the hash-based message authentication code (HMAC) using the SHA384 hash
 * function. Optionally if toHex = true the output will be converted to hexadecimal lower case.
 * </odoc>
 */
const hmacSHA384 = function(data, key, toHex) {
	return hmacSHA256(data, key, toHex, "HmacSHA384");
}

/**
 * <odoc>
 * <key>hmacSHA1(data, key, toHex) : ArrayOfBytes</key>
 * Given data and a key will calculate the hash-based message authentication code (HMAC) using the SHA1 hash
 * function. Optionally if toHex = true the output will be converted to hexadecimal lower case.
 * </odoc>
 */
const hmacSHA1 = function(data, key, toHex) {
	return hmacSHA256(data, key, toHex, "HmacSHA1")
}

/**
 * <odoc>
 * <key>bcrypt(aText, aVerifyHash, hashingRounds) : String/boolean</key>
 * If aText is provided it will return the resulting string of applying the bcrypt hash to aText. Optionally the bcrypt hashingRounds (between 4 and 
 * 31, default 10) can be provided (note: the more rounds, the more slower and secure).
 * If aVerifyHash is provided it will return a boolean determining if the provided aVerifyHash (result of a previous bcrypt)
 * matches the aText provided (hashingRounds will be ignored since the hash string already provides the rounds used).
 * </odoc>
 */
const bcrypt = function(aText, aVerifyHash, hashingRounds) {
	_$(aText).isString().$_("Please provide a string text");
	_$(aVerifyHash).isString();
	_$(hashingRounds).isNumber().check((v) => { return (v >= 4 || v <= 31); }, "hashingRounds need to be between 4 and 31");

	var salt;
	if (isDef(hashingRounds)) {
		salt = Packages.org.springframework.security.crypto.bcrypt.BCrypt.gensalt(hashingRounds);
	} else {
		salt = Packages.org.springframework.security.crypto.bcrypt.BCrypt.gensalt();
	}

	if (isDef(aVerifyHash)) {
		return Packages.org.springframework.security.crypto.bcrypt.BCrypt.checkpw(aText, aVerifyHash);
	} else {
		return String(Packages.org.springframework.security.crypto.bcrypt.BCrypt.hashpw(aText, salt));
	}
}

/**
 * <odoc>
 * <key>splitBySeparator(aString, aSeparator) : Array</key>
 * Will split aString using the provided aSeparator. If the aSeparator is escaped (for example if ';' is the aSeparator and 
 * aString 'abc\\;def;123" only the second ';' will be considered.
 * </odoc>
 */
const splitBySeparator = function(aString, aSep) {
	if (isUnDef(aString) || aString == null) return []
	if (isUnDef(aSep)) aSep = ";"

	return aString.replace(new RegExp(aSep, "g"), "\\" + aSep)
					.replace(new RegExp("\\\\\\\\(?=" + aSep + ")", "g") , "")
					.split("\\" + aSep + "")
}

/**
 * <odoc>
 * <key>splitBySepWithEnc(text, separator, enclosures, includeEnclosures) : array</key>
 * Given a text, a separator, a list of enclosures and a flag includeEnclosures, this function will split the text by the separator
 * while ignoring the separator inside the enclosures. If includeEnclosures is true, the enclosures will be included in the result.
 * If includeEnclosures is false, the enclosures will be removed from the result.
 * </odoc>
 */
const splitBySepWithEnc = function(text, separator, enclosures, includeEnclosures) {
	_$(text, "text").isString().$_()
	separator  = _$(separator, "separator").isString().default("\\s+")
	enclosures = _$(enclosures, "enclosures").isArray().default([])
	includeEnclosures = _$(includeEnclosures, "includeEnclosures").isBoolean().default(false)

	// If the text is empty, return an empty array
	if (text.length === 0) {
		return []
	}
	// Create a regular expression that matches any of the enclosures
	let enclosureRegex = new RegExp(`(${enclosures.map(([start, end]) => `\\${start}[^\\${end}]*\\${end}`).join('|')})`, 'g')
	// Find all the enclosures in the text
	let matches = text.match(enclosureRegex) || []
	// Replace the separator with a null character if it is inside an enclosure
	let splitText = text
	// Replace the separator with a colon if it is not inside an enclosure
	matches.forEach(match => {
		// Replace the separator with a colon
		splitText = splitText.replace(match, match.replace(new RegExp(separator, 'g'), '\0'));
	})
	// Split the text by the separator
	return splitText.split(new RegExp(separator)).map(part => {
		// Remove the enclosures from the result if includeEnclosures is false
		let trimmedPart = part.replace(/\0/g, separator).trim()
		// Include the enclosures in the result if includeEnclosures is true
		if (includeEnclosures) {
			return trimmedPart
		} else {
			// Remove the enclosures from the result
			for (let [start, end] of enclosures) {
				// If the part starts with the start enclosure and ends with the end enclosure, remove the enclosures
				if (trimmedPart.startsWith(start) && trimmedPart.endsWith(end)) {
					return trimmedPart.slice(1, -1)
				}
			}
		}
		return trimmedPart
	})
}

/**
 * <odoc>
 * <key>splitKVBySeparator(aString, aOptions) : Map</key>
 * Given aString with multiple key/value entries will return a map with the same. Optionally you can provide aOptions:\
 * \
 *    sep  - the key/value entries separator (defaults to " ")\
 *    ksep - the key separator from a value (defaults to "=")\
 *    esc  - the escape character (defaults to "\\")\
 *    qto  - the quote character (defaults to "\"")\
 *    nul  - the null representation (defaults to null)\
 * \
 * </odoc>
 */
const splitKVBySeparator = function(aString, aOptions) {
	_$(aString, "aString").isString().$_()
	aOptions = _$(aOptions, "aOptions").isMap().default({})
	aOptions = merge({
		sep : " ",
		ksep: "=",
		esc : "\\",
		qto : "\"",
		nul : null
	}, aOptions)
	
	aSep = aOptions.sep
	var aKSep = aOptions.ksep
	var aEsc  = aOptions.esc
	var aQto  = aOptions.qto
	
	var res = {}, isK = true, isV = false, isQ = false, buf = "", k = __, v = __
	aString = aString.trimStart()

	for(var i = 0; i < aString.length; i++) {
		// ignore more than one separator
		if (!isQ && i > 0 && aString[i-1] == aSep && aString[i] == aSep) continue
		// if it's a key/value separator switch to value
		if (!isQ && isK && aString[i] == aKSep) {
			if (i == 0 || aString[i - 1] != aEsc) {
				isK = false
				isV = true
				k = buf
				v = __
				buf = ""
				continue
			}
		}
		// if it's a separator and it's value switch to key
		if (!isQ && isV && aString[i] == aSep) {
			if (aString[i - 1] != aEsc) {
				isK = true
				isV = false
				v = buf
				buf = ""
				res[k] = v
				continue
			}
		}
		// if it's an alone key
		if (!isQ && isK && aString[i] == aSep) {
			isK = true
			isV = false
			k = buf
			v = __
			buf = ""
			res[k] = aOptions.nul 
			continue
		}
		// if it's a quote
		if (aString[i] == aQto) {
			// if it's a beginning of a quote
			if (i == 0 || (!isQ && aString[i-1] != aEsc)) { isQ = true; continue }
			// if it's the end of a quote
			if (isQ && aString[i-1] != aEsc) { isQ = false; continue }
		}
		// if it reached this far it's text
		if (i > 0 && aString[i-1] == aEsc && aString[i] == aEsc) {
			// If escape is escaped
			buf += aEsc
		} else {
			// Unless it's escape keep it
			if (aString[i] != aEsc || (i < aString.length && aString[i+1] != aSep && aString[i+1] != "\"" && aString[i+1] != "'")) buf += aString[i]
		}
	}
	if (buf.length > 0) {
		if (isK) { k = buf; v = __ }
		if (isV) { v = buf }
		buf = ""
		res[k] = (isUnDef(v) ? aOptions.nul : v)
	}

	return res
}

/**
 * <odoc>
 * <key>processExpr(aSeparator, ignoreCase, aSource) : Map</key>
 * Will access the current contents of the OpenAF -e argument (if a different aSource is not defined) looking for pairs of key values in the form "a=5;b=1;c=xpto\\;"
 * and will produce a Map with { "a": 5, "b": 1, "c": "xpto;" }. If no aSeparator is provided ';' will be assumed.
 * __pmIn values will be also included. If ignoreCase = true all keys will be lower cased.
 * </odoc>
 */
const processExpr = function(aSep, ignoreCase, aSource) {
	aSource = _$(aSource, "aSource").isString().default(__expr);
	aSep    = _$(aSep, "aSep").isString().default(";");
	var pairs = {}

	if (!__flags.ALTERNATIVE_PROCESSEXPR) {
		var args = splitBySeparator(aSource, aSep);
	
		for(var argIdx in args) {
			var arg = args[argIdx];
	
			var pair = splitBySeparator(arg, "=");
			if (!ignoreCase)
				pairs[String(pair[0])] = (isUnDef(pair[1]) ? "" : pair[1]);
			else
				pairs[String(pair[0]).toLowerCase()] = (isUnDef(pair[1]) ? "" : pair[1]);
		}
	} else {
		var args = splitKVBySeparator(aSource, { sep: aSep, nul: "" })
	
		Object.keys(args).forEach(arg => {
			if (!ignoreCase) {
				pairs[arg] = args[arg]
			} else {
				pairs[arg.toLowerCase()] = args[arg]
			}
		})
	}

	//load __pmIn to pairs
	for (var attrname in __pmIn) { 
		if (!ignoreCase)
			pairs[String(attrname)] = __pmIn[attrname];
		else 
			pairs[String(attrname).toLowerCase()] = __pmIn[attrname];
	}

	return pairs
}

/**
 * <odoc>
 * <key>getVersion() : String</key>
 * Shortcut for the af.getVersion (see more af.getVersion) function. Will return the current version of OpenAF
 * being used.
 * </odoc>
 */
const getVersion = function() {
	return af.getVersion();
}

/**
 * <odoc>
 * <key>getDistribution() : String</key>
 * Returns the current distribution channel for this version of OpenAF.
 * </odoc>
 */
const getDistribution = function() {
	return af.getDistribution();
}

/**
 * <odoc>
 * <key>getOpenAFPath() : String</key>
 * Returns the filesystem path to the openaf.jar currently being used for the script execution.
 * </odoc>
 */
var __OpenAFJar;
const getOpenAFPath = function() {
	if (isDef(__forcedOpenAFJar)) {
		__OpenAFJar = String(new java.io.File(__forcedOpenAFJar).getParent());
	} else {
		if (isUnDef(__OpenAFJar)) {
			var ar = String(java.lang.System.getProperty("java.class.path")).split(java.io.File.pathSeparator);
			var res;
			ar.map(f => {
				if (f.match(/openaf\.jar$/)) {
					res = String(java.io.File(f).getAbsolutePath());
					res = res.replace(/openaf\.jar$/, "").replace(/\\/g, "/");
					res = res.replace(/[/\\][^/\\]+$/, "");
				}
			});
			__OpenAFJar = res;
		}	
	}

	return __OpenAFJar;
}

__flags.OJOB_LOCALPATH = getOpenAFPath() + "ojobs"

//------------------------------------------
//OPACK functions
//------------------------------------------

const PACKAGEJSON  = ".package.json";
const PACKAGEYAML  = ".package.yaml";
const PACKAGESJSON = "packages.json";
const PACKAGESJSON_DB = ".opack.db";
const PACKAGESJSON_CENTRALDB = "opack.db"
const PACKAGESJSON_USERDB = ".openaf-opack.db";
const OPACKCENTRALJSON = "packages.json";

var __opackParams;
var __opackOpenAF;
/**
 * <odoc>
 * <key>oPack(aParameters)</key>
 * Tries to execute oPack with aParameters string. These string is equivalent to the opack command-line commands.
 * aParameters = "help" will, for example, print all the help information. 
 * </odoc> 
 */
const oPack = function(aCmd) { 
	__opackParams = aCmd;
	load(getOpenAFJar() + "::js/opack.js");
}

/**
 * <odoc>
 * <key>oJob(aFile, args, aId, aOptionsMap, shouldReturn)</key>
 * Shortcut for oJobRunFile return the result on the variable __pm. Keep in mind that it doesn't support concurrency.
 * If shouldReturn is true it will return the result (from ow.oJob.output if used) of the job instead of the __pm variable.
 * </odoc>
 */
const oJob = function(aFile, args, aId, aOptionsMap, shouldReturn) {
	if (shouldReturn) {
		var _id = genUUID()
		args = merge(args, { __format: "key", __key: _id })
		oJobRunFile(aFile, args, aId, aOptionsMap)
		var _res = $get(_id)
		delete _res.__format
		delete _res.__key
		delete _res.init
		return _res
	} else {
		args = merge({ "__format": "pm" }, args)
		if (isDef(__pm._list)) __pm._list = __
		if (isDef(__pm._map)) __pm._list = __
		if (isDef(__pm.result)) __pm.result = __
		oJobRunFile(aFile, args, aId, aOptionsMap)
		if (isDef(__pm._list)) return __pm._list
		if (isDef(__pm._map)) return __pm._map
		return __pm.result
	}
}

/**
 * <odoc>
 * <key>addOPackRemoteDB(aURL)</key>
 * Adds a path to an opack.db file to the current search path.
 * </odoc>
 */
const addOPackRemoteDB = function(aURL) {
	if (__opackCentral.indexOf(aURL) < 0) __opackCentral.push(aURL)
}

/**
 * <odoc>
 * <key>getOPackRemoteDB() : Array</key>
 * Returns an Array of maps. Each map element is an opack package description registered in the OpenAF central repository.
 * </odoc>
 */
const getOPackRemoteDB = function() {
	var packages = {};

	plugin("ZIP")
	var zip

	// Check for OAF_OPACKS environment variable
	// If it exists, add the remote opack repositories
	if (isString(getEnv("OAF_OPACKS"))) {
		getEnv("OAF_OPACKS").split(",").forEach(url => addOPackRemoteDB(url) )
	}
	for(var i in __opackCentral) {
		if (!noHomeComms && __opackCentral[i].toLowerCase().startsWith("http")) {
			try {
				var _stream = $rest({ connectionTimeout: 1500 }).get2Stream(__opackCentral[i])
				//http = new HTTP(, "GET", "", {}, true, 1500);
				//zip = new ZIP(http.responseBytes());
				zip = new ZIP(af.fromInputStream2Bytes(_stream))
				packages = merge(packages, af.fromJson(af.fromBytes2String(zip.getFile(OPACKCENTRALJSON))))
			} catch(e) {
				// Continue to next
			} finally {
				if (isDef(zip)) zip.close()
			}
		} else if (io.fileExists(__opackCentral[i]) && io.fileInfo(__opackCentral[i]).isDirectory) {
			if (io.fileExists(__opackCentral[i] + "/" + PACKAGESJSON_CENTRALDB)) {
				try {
					zip = new ZIP(io.readFileBytes(__opackCentral[i] + "/" + PACKAGESJSON_CENTRALDB))
					packages = merge(packages, af.fromJson(af.fromBytes2String(zip.getFile(OPACKCENTRALJSON))))
				} finally {
					if (isDef(zip)) zip.close()
				}
			}
		}
	}
	
	//if (isUnDef(http)) return packages;

	//packages = af.fromJson(af.fromBytes2String(zip.getFile(OPACKCENTRALJSON)));
	//if (!isUnDef(zip)) zip.close();
	return packages;
}
 
/**
 * <odoc>
 * <key>getOPackLocalDB() : Array</key>
 * Returns an Array of maps. Each map element is an opack package description of the currently 
 * locally, and per user, installed opack packages.
 * </odoc>
 */
const getOPackLocalDB = function() {
	var fileDB = getOpenAFPath() + "/" + PACKAGESJSON_DB;
	var homeDB = __gHDir() + "/" + PACKAGESJSON_USERDB;
	var packages = {};
	var exc, homeDBCheck = false;

	if (isUnDef(__opackOpenAF)) {
		__opackOpenAF = io.readFileJSON(getOpenAFJar() + "::.package.json")
		__opackOpenAF.version = getVersion()
	}

	// Verify fileDB and homeDB
	try {
		if (!io.fileInfo(fileDB).permissions.match(/r/) && io.fileInfo(fileDB).permissions != "") {
			exc = fileDB + " is not acessible. Please check permissions (" + io.fileInfo(fileDB).permissions + ").";
		}
		homeDBCheck = io.fileExists(homeDB);
		if (homeDBCheck && !io.fileInfo(homeDB).permissions.match(/r/) && io.fileInfo(homeDB).permissions != "") {
			exc = homeDB + " is not acessible. Please check permissions (" + io.fileInfo(homeDB).permissions + ").";
		}
	} catch(e) {
		exc = e;
	}

	if (isUnDef(exc)) {
		try {
			plugin("ZIP");
			var zip = new ZIP(io.readFileBytes(fileDB));
			packages = af.fromJson(af.fromBytes2String(zip.getFile(PACKAGESJSON)));
			zip.close();

			if (homeDBCheck) {
				var zip = new ZIP(io.readFileBytes(homeDB));
				var packagesLocal = af.fromJson(af.fromBytes2String(zip.getFile(PACKAGESJSON)));
				packages = merge(packagesLocal, packages)
				zip.close();
			}

			for(var pack in packages) {
				if (packages[pack].name == "OpenAF") packages[pack].version = getVersion()
				if (pack.startsWith("$DIR/")) {
					var newPack = pack.replace("$DIR/", getOpenAFPath())
					packages[newPack] = packages[pack]
					delete packages[pack]
				}
			}
		} catch(e) {
			exc = e;
		}
	}

	if (isDef(exc) && isDef(exc.message) && (!exc.message.match(/NoSuchFileException/))) throw exc;

	// No OpenAF on packages loaded
	for(var pi in packages) { if (packages[pi].name == "OpenAF") delete packages[pi] }
	packages["OpenAF"] = __opackOpenAF

	return packages;
}

/**
 * <odoc>
 * <key>getOPackPaths() : Array</key>
 * Returns an array of strings with the paths for each of the installed opacks.
 * </odoc>
 */
const getOPackPaths = function() {
	var packages = getOPackLocalDB();

	var paths = {};
	for(var pack in packages) {
		paths[packages[pack].name] = pack;
	}

	return paths;
}

/**
 * <odoc>
 * <key>getOPackPath(aPackage) : String</key>
 * Given aPackage name (a opack name) will search the opack and if installed will return the filesystem
 * path where the opack is installed.
 * </odoc>
 */
const getOPackPath = function(aPackage) {
	var paths = getOPackPaths();
	return paths[aPackage];
}

/**
 * <odoc>
 * <key>opackExec(aPackageName)</key>
 * Tries to execute the provided opack aPackageName.
 * </odoc>
 */
const opackExec = function(aPackageName) {
	__expr = "exec " + aPackageName + " " + __expr;
	load(getOpenAFJar() + "::js/opack.js");
}

var __loadedJars = [];
/**
 * <odoc>
 * <key>loadExternalJars(aPath, dontCheck)</key>
 * Given a path will try to add to the current classpath (using af.externalAddClasspath) all files with the extension
 * '.jar'. Optionally you can override the dontCheck if it was loaded with this command previously.
 * </odoc>
 */
const loadExternalJars = function(aPath, dontCheck) {
	if (!io.fileExists(aPath) || io.fileInfo(aPath).isFile) throw "Folder not found.";
	$from(io.listFiles(aPath).files).ends("filename", '.jar').sort("-filename").select((v) => {
		var libfile = v.filename;
		if (!dontCheck && __loadedJars.indexOf(libfile) < 0) {
			af.externalAddClasspath(new java.io.File(v.canonicalPath).toURI().toURL(), true );
			__loadedJars.push(libfile);
		}
	});
}
 
/**
 * 0 - no force pre-compilation
 * 1 - pre-compilation of opacks
 * 2 - pre-compilation of opacks and loadLibs
 * 3 - pre-compilation of all scripts
 */
var __preCompileLevel = __flags.OAF_PRECOMPILE_LEVEL

var __loadPreParser = function(s) { return s }
const __codeVerify = function(aCode, aFile) {
	_$(aCode, "aCode").isString().$_()
	aFile     = _$(aFile, "aFile").isString().default("untitled")

	var validation = false

	var verifyFn = function(aFile) {
		_$(aFile, "aFile").isString().$_();
	
		if (isUnDef(OAF_INTEGRITY[aFile]) && isDef(OAF_INTEGRITY[io.fileInfo(aFile).canonicalPath]))
			aFile = io.fileInfo(aFile).canonicalPath

		if (isDef(OAF_INTEGRITY[aFile])) {	
			var valid = false;
	
			if (OAF_INTEGRITY[aFile].indexOf("-") >= 0) {
				[alg, h] = OAF_INTEGRITY[aFile].split("-")
				switch (alg) {
				case "sha256": valid = (sha256(aCode) == h); break;
				case "sha512": valid = (sha512(aCode) == h); break;
				case "sha384": valid = (sha384(aCode) == h); break;
				case "sha1"  : valid = (sha1(aCode) == h);   break;
				case "md5"   : valid = (md5(aCode) == h);    break;
				case "md2"   : valid = (md2(aCode) == h);    break;
				default      : valid = false;
				}

				// If a file is on the OAF_INTEGRITY list close code execution
				__flags.OAF_CLOSED = true
			}
	
			return valid;
		} else {
			return __;
		}
	};

	// Verify integrity 
	if (Object.keys(OAF_INTEGRITY).length > 0) {
		Packages.openaf.SimpleLog.log(Packages.openaf.SimpleLog.logtype.DEBUG, "oaf checking integrity of '" + aFile + "'", null);

		var ig = verifyFn(aFile);
		if (isDef(ig) && ig == false) {
			if (OAF_INTEGRITY_WARN) {
				logWarn("INTEGRITY OF '" + aFile + "' failed. Please check the source and update the corresponding integrity hash list. Execution will continue.");
			} else {
				throw "INTEGRITY OF '" + aFile + "' failed. Please check the source and update the corresponding integrity hash list.";
			}
		} else {
			if (OAF_INTEGRITY_STRICT && ig != true) {
				throw "INTEGRITY OF '" + aFile + "' failed. Please check the source and update the corresponding integrity hash list.";
			} else {
				if (ig == true) validation = true;
			}
		}
	}
	if (OAF_VALIDATION_STRICT && !validation) {
		throw "OAF VALIDATION OF '" + aFile + "' failed.";
	}
}

const loadDebug = aScript => ow.loadDebug().load(aScript)
const requireDebug = (aScript, aForce) => ow.loadDebug().require(aScript, aForce)

/**
 * <odoc>
 * <key>load(aScript)</key>
 * Provides a shortcut for the af.load function (see more af.load). If the provided aScript is not found
 * this function will try to search the script on the openaf.jar::js folder and on the installed opacks.
 * If it doesn't find the provided aScript it will throw an exception "Couldn't find aScript".
 * </odoc>
 */
const load = function(aScript, loadPrecompiled) {
	var error = [], inErr = false;
	var fn = function(aS, aLevel) {
		var res = false, err;
		if (aS.indexOf("::") < 0 && (loadPrecompiled || __flags.OAF_PRECOMPILE_LEVEL >= aLevel) && io.fileExists(aS)) {
			try {
				var cl = io.fileInfo(aS).filename.replace(/\.js$/, "_js");
				res = loadCompiled(aS);
				if (isDef(global["__" + cl]) && isFunction(global["__" + cl])) {
					var exp = {}, mod = { id: cl, uri: cl, exports: exp };
					global["__" + cl].call({}, load, exp, mod);
					global[io.fileInfo(aS).filename.replace(/\.js$/, "")] = exp;
					return aS;
				}
			} catch(e1) {
				if (e1.message == "\"exports\" is not defined.") {
					io.rm(io.fileInfo(aS).canonicalPath.substr(0, io.fileInfo(aS).canonicalPath.length - io.fileInfo(aS).filename.length) + ".openaf_precompiled");
					var exp = requireCompiled(aS);
					global[io.fileInfo(aS).filename.replace(/\.js$/, "")] = exp;
					return aS;
				} else {
					err = e1
				}
			}
		}
		if (!res || isDef(err)) {
			try {
				__codeVerify(aS, aScript)
				if (__flags.OAF_CLOSED) af.load(aS); else af.load(aS, __loadPreParser);
				err = __
			} catch(e2) {
				if (e2.message == "\"exports\" is not defined.") {
					var exp = require(aS);
					err = __
					global[io.fileInfo(aS).filename.replace(/\.js$/, "")] = exp;
					return aS;
				} else {
					err = e2;
				}
			}
		}

		if (isDef(err)) throw err; else return aScript;
	};

	if (io.fileExists(aScript) || aScript.indexOf("::") > 0) {
		return fn(aScript, 3);
	} else {
		//paths["__default"] = getOpenAFJar() + "::js/";
		if (/^\@([^\/]+)\/(.+)\.js$/.test(aScript)) {
			var _ar = aScript.match(/^\@([^\/]+)\/(.+)\.js$/)
			var _path = getOPackPath(_ar[1])
			var _file = _path + "/" + _ar[2] + ".js"
			if (io.fileExists(_file)) {
				return fn(_file, 1)
			} else {
				new Error("ERROR: Library '" + aScript + "' not found.")
			}
		} else {
			var paths = getOPackPaths()
			for(var i in paths) {
				try {
					paths[i] = paths[i].replace(/\\+/g, "/");
					if (io.fileExists(paths[i] + "/" + aScript)) return fn(paths[i] + "/" + aScript, 1);
				} catch(_e) {
					if (_e.message.indexOf("java.io.FileNotFoundException") < 0 &&
						_e.message.indexOf("java.nio.file.NoSuchFileException") < 0 &&
						_e.message.indexOf("java.lang.NullPointerException: entry") < 0) {
							error.push(_e);
							inErr = true;
					}
				}
			}
		}


		global.__loadedfrom = _$(global.__loadedfrom).default(__)
		if (isDef(__loadedfrom)) {
			return fn(__loadedfrom.replace(/[^\/]+$/, "") + aScript, 3);
		}

		throw new Error("Couldn't find or load '" + aScript + "' (" + String(error.join("; ")) + ")");
	}
}

/**
 * <odoc>
 * <key>loadPy(aPyScript, aInput, aOutputArray, dontStop) : Map</key>
 * Provides a shortcut for the $py function (see more in $py). If the provided aPyScript is not found
 * this function will try to search the python script on the installed opacks.
 * If it doesn't find the provided aScript it will throw an exception "Couldn't find aPyScript".
 * If aInput map is defined each entry will be converted into python variables. If aOutputArray is
 * defined the python variables string names in the array will be returned as a map.
 * </odoc>
 */
const loadPy = function(aPyScript, aInput, aOutputArray, dontStop) {
	var error = "";

	if (io.fileExists(aPyScript)) {
		$pyStart();
		var res = $py(aPyScript, aInput, aOutputArray);
		if (!dontStop) $pyStop();
		return res;
	} else {
		var paths = getOPackPaths();

		var error;
		for(var i in paths) {
			try {
				paths[i] = paths[i].replace(/\\+/g, "/");
				if (io.fileExists(paths[i] + "/" + aPyScript)) {
					$pyStart();
					var res = $py(paths[i] + "/" + aPyScript, aInput, aOutputArray);
					if (!dontStop) $pyStop();
					return res;
				}
			} catch(e) {
				error = e;
			}
		}

		if (isDef(error)) {
			throw aPyScript + ": " + String(error);
		} else {
			throw aPyScript + ": " + "Couldn't find aPyScript.";
		}
	}
}

/**
 * <odoc>
 * <key>requireCompiled(aScript, dontCompile, dontLoad) : Object</key>
 * Loads aScript, through require, previously compile or it will be compiled if (dontCompile is not true).
 * IF dontLoad = true the module exports won't be returned.
 * </odoc>
 */
const requireCompiled = function(aScript, dontCompile, dontLoad) {
	var res = false, cl, clFile, clFilepath;
	if (io.fileExists(aScript)) {
		var info = io.fileInfo(aScript);
		if (info.isFile) {
			var path = info.canonicalPath.substr(0, info.canonicalPath.indexOf(info.filename)) + ".openaf_precompiled/";
			if (info.filename.endsWith(".js")) {
				cl = info.filename.replace(/\./g, "_");
				clFile = cl + ".class";
				clFilepath = path + clFile;
				// Check version and recompile if needed
				if (!io.fileExists(path + "." + getDistribution() + "-" + getVersion())) {
					io.rm(path)
				}
				if (!(io.fileExists(path) && io.fileExists(clFilepath)) ||
					info.lastModified > io.fileInfo(clFilepath).lastModified) {
					if (!dontCompile) {
						io.mkdir(path);
						io.writeFileString(path + "." + getDistribution() + "-" + getVersion(), "")
						io.rm(clFilepath);
						var code = io.readFileString(info.canonicalPath)
						__codeVerify(code, aScript)
						if (!__flags.OAF_CLOSED) code = __loadPreParser(code) 
						af.compileToClasses(cl, "var __" + cl + " = function(require, exports, module) {" + io.readFileString(info.canonicalPath) + "}", path);
					}
				}
				aScript = clFilepath;
			}
			if (!dontLoad && aScript.endsWith(".class")) {
				try {
					af.getClass(cl);
				} catch(e) {
					if (String(e).match(/ClassNotFoundException/) && !dontCompile) {
						af.runFromExternalClass(cl, path);
						var exp = {}, mod = { id: cl, uri: cl, exports: exp };

						global["__" + cl].call({}, requireCompiled, exp, mod);
						//exp = mod.exports || exp;
					
						return mod.exports;
					} else {
						throw e;
					}
				}
			}
		}
	}
}

/**
 * <odoc>
 * <key>loadCompiled(aScript, dontCompile, dontLoad) : boolean</key>
 * Tries to load an OpenAF script as a compiled class. If a compiled class file doesn't exist in the same path 
 * it will try to compile and load from the compiled code. If a compiled class file exists in the same path it
 * will recompile it if the modified date of the original aScript is newer than the class. 
 * If the class was already loaded or can't be loaded it will return false. Returns true otherwise.
 * Optionally you can force to not compile dontCompile=true or just to compile with dontLoad=true
 * </odoc>
 */
const loadCompiled = function(aScript, dontCompile, dontLoad) {
	var res = false, cl, clFile, clFilepath;
	if (io.fileExists(aScript)) {
		var info = io.fileInfo(aScript);
		if (info.isFile) {
			var path = info.canonicalPath.substr(0, info.canonicalPath.indexOf(info.filename)) + ".openaf_precompiled/";
			if (info.filename.endsWith(".js") || info.filename.endsWith("_profile")) {
				cl = info.filename.replace(/\./g, "_");
				clFile = cl + ".class";
				clFilepath = path + clFile;
				// Check version and recompile if needed
				if (!io.fileExists(path + "." + getDistribution() + "-" + getVersion())) {
					io.rm(path)
				}
				if (!(io.fileExists(path) && io.fileExists(clFilepath)) ||
					info.lastModified > io.fileInfo(clFilepath).lastModified) {
					if (!dontCompile) {
						io.mkdir(path);
						io.writeFileString(path + "." + getDistribution() + "-" + getVersion(), "")
						io.rm(clFilepath);
						var code = io.readFileString(info.canonicalPath)
						__codeVerify(code, aScript)
						if (!__flags.OAF_CLOSED) code = __loadPreParser(code) 
						af.compileToClasses(cl, code, path);
					}
				}
				aScript = clFilepath;
			}
			if (!dontLoad && aScript.endsWith(".class")) {
				try {
					af.getClass(cl);
				} catch(e) {
					if (String(e).match(/ClassNotFoundException/) && !dontCompile) {
						af.runFromExternalClass(cl, path);
						res = true;
					} else {
						throw e;
					}
				}
			}
		}
	}
	return res;
}

/**
 * <odoc>
 * <key>plugin(aPlugin, aClass)</key>
 * Provides a shortcut for the af.plugin function. It also provides a shortcut for plugins with
 * the java package "openaf.plugins" (e.g. af.plugin("openaf.plugins.HTTP") is the same
 * as plugin("HTTP")). In alternative you can provide plugin aClass if it's different from aPlugin. 
 * </odoc>
 */
var __loadedPlugins;
const plugin = function(aPlugin, aClass) {
	if (isUnDef(__loadedPlugins)) __loadedPlugins = {};
	var pluginLoaded;
	try {
		if (!aPlugin.match(/\./)) {
			pluginLoaded = "openaf.plugins." + aPlugin;
			
			if (__loadedPlugins[pluginLoaded + (isDef(aClass) ? "::aClass" : "")]) return;
			// Because ZIP is used in getOPackPath
			if (aPlugin != "ZIP" && isDef(getOPackPath("plugin-" + aPlugin))) {
				af.externalPlugin(
					$from(io.listFilenames(getOPackPath("plugin-" + aPlugin)))
					.ends(".jar")
					.select((f) => {
						return (new java.io.File(f)).toURI().toURL();
					}),
					"openaf.plugins." + (isDef(aClass) ? aClass : aPlugin)
				);
			} else {
				af.plugin("openaf.plugins." + (isDef(aClass) ? aClass : aPlugin));
			}
			__loadedPlugins[pluginLoaded + (isDef(aClass) ? "::aClass" : "")] = true;

			return;
		}
	} catch(e) {
	}

	pluginLoaded = aPlugin;
	if (__loadedPlugins[pluginLoaded]) return;
	try {
		// Because ZIP is used in getOPackPath
		if (aPlugin != "ZIP" && isDef(getOPackPath("plugin-" + aPlugin))) {
			af.externalPlugin(
				$from(io.listFilenames(getOPackPath("plugin-" + aPlugin)))
				.ends(".jar")
				.select((f) => {
					return (new java.io.File(f)).toURI().toURL();
				}),
				aPlugin
			);
		} else {
			af.plugin(aPlugin);
		}
		__loadedPlugins[pluginLoaded] = true;
	} catch(e) {
		if (String(e).indexOf("java.lang.ClassNotFoundException: SMB") >= 0) {
			throw("The SMB plugin is no longer included. Please install the SMB oPack (\"opack install plugin-smb\").");
		}
		if (String(e).indexOf("java.lang.ClassNotFoundException: Ignite") >= 0) {
			throw("The Ignite plugin is no longer included. Please install the Ignite oPack (\"opack install plugin-ignite\").");
		}
		if (String(e).indexOf("java.lang.ClassNotFoundException: SVN") >= 0) {
			throw("The SVN plugin is no longer included. Please install the SVN oPack (\"opack install plugin-svn\").");
		}
		if (String(e).indexOf("java.lang.ClassNotFoundException: XLS") >= 0) {
			throw("The XLS plugin is no longer included. Please install the XLS oPack (\"opack install plugin-xls\").");
		}
		if (String(e).indexOf("java.lang.ClassNotFoundException: DOC") >= 0) {
			throw("The DOC plugin is no longer included. Please install the XLS oPack (\"opack install plugin-xls\").");
		}
		if (String(e).indexOf("java.lang.ClassNotFoundException: GIT") >= 0) {
			throw("The GIT plugin is no longer included. Please install the GIT oPack (\"opack install plugin-git\").");
		}
	}
}

/**
 * <odoc>
 * <key>isUndefined(aObject) : boolean</key>
 * Returns true if the provided aObject is undefined as a javascript variable. It will return false otherwise.
 * (see also isDefined)
 * </odoc>
 */
const isUndefined = function(aObject) {
	return (typeof aObject == 'undefined') ? true : false;
}

/**
 * <odoc>
 * <key>isDefined(aObject) : boolean</key>
 * Returns true if the provided aObject is defined as a javascript variable. It will return false otherwise.
 * (see also isUndefined)
 * </odoc>
 */
const isDefined = function(aObject) {
	return (!isUnDef(aObject));
}

//if (isUnDef(Object.values)) Object.values = (m) => { return Object.keys(m).map(r => m[r]); };

/**
 * <odoc>
 * <key>isBinaryArray(anArrayOfChars, confirmLimit, previousResult) : boolean</key>
 * Tries to determine if the provided anArrayOfChars is binary or text. The detection is performed with the first 1024 chars (
 * that can be changed if confirmLimit is provided). Additionally is possible to link multiple calls providing the last result
 * on previousResult for multiple subsequences of a main array of chars sequence. Should work for utf8, iso-8859-1, iso-8859-7,
 *  windows-1252 and windows-1253. Returns true if file is believed to be binary.
 * </odoc>
 */
const isBinaryArray = function(anArrayOfChars, confirmLimit) {
	var rcstream = 0;
	confirmLimit = _$(confirmLimit).isNumber().default(1024);
	var isit = {
		text: 0,
		bin : 0
	};

	function evaluateIsIt() {
		if (isit.bin == 0)
			return false;
		else
			return true;
	}

	for(var ii = 0; ii < anArrayOfChars.length; ii++) {
		var c = anArrayOfChars[ii];

		// based on https://www.java-forums.org/advanced-java/82143-how-check-if-file-plain-text-binary.html
		if (c == 9 || c == 10 || c == 11 || c == 13 || (c >= 32 && c <= 126)) {
			isit.text++;
		} else if (c == 153 || (c >= 160 && c <= 255)) {
			isit.text++;
		} else if (c == 884 || c == 885 || c == 890 || c == 894 || (c >= 900 && c <= 974)) {
			isit.text++;
		} else {
			isit.bin++;
		}
		rcstream++;
		if (confirmLimit > 0 && rcstream >= confirmLimit) return evaluateIsIt();
	}

	return evaluateIsIt();
}

/**
 * <odoc>
 * <key>listFilesRecursive(aPath, usePosix, aFnErr) : Map</key>
 * Performs the io.listFiles function recursively given aPath. The returned map will be equivalent to
 * the io.listFiles function (see more in io.listFiles). Alternatively you can specify
 * to usePosix=true and it will add to the map the owner, group and full permissions of each file and folder.
 * When __flags.ALTERNATIVES.listFilesRecursive=true the processing will be done in parallel and aFnErr will be called
 * in case of an error.
 * </odoc>
 */
const listFilesRecursive = function(aPath, usePosix, aFnErr) {
	if (isUnDef(aPath)) return []

	if (__flags.ALTERNATIVES.listFilesRecursive && getNumberOfCores() > 2) {
		aFnErr = _$(aFnErr, "aFnErr").isFunction().default(printErr)
		ow.loadObj()
		var ret = new ow.obj.syncArray(), stack = $queue([ aPath ]), _ps = new ow.obj.syncArray()
		var ini = $atomic(), end = $atomic()

		var fn = () => {
			try {
				ini.inc()
				while(!stack.isEmpty()) {
					var currentPath = stack.poll()

					var files = io.listFiles(currentPath, usePosix)
					var _ret  = new Set()
		
					if (isDef(files) && isDef(files.files)) {
						for (var file of files.files) {
							file.path = currentPath
							_ret.add(file)
							if (file.isDirectory) {
								stack.add(file.filepath)
								_ps.add($doV(fn))
							}
						}
					}
		
					ret.addAll(Array.from(_ret))
				}
			} catch(e) {
				aFnErr(e)
			} finally {
				end.inc()
			}

			return true
		}

		_ps.add($doV(fn))
		do {
			try {
				$doWait($doAll(_ps.toArray()))
			} catch(ee) {
				$err(ee)
			}
		} while(ini.get() > end.get())

		return ret.toArray()
	} else {
		var ret = new Set(), stack = [aPath], visited = new Set()

		while (stack.length > 0) {
			var currentPath = stack.pop()
			var files = io.listFiles(currentPath, usePosix)
	
			if (isUnDef(files) || isUnDef(files.files)) continue
	
			for (var file of files.files) {
				file.path = currentPath
				ret.add(file)
				if (file.isDirectory && !visited.has(file.filepath)) {
					stack.push(file.filepath)
					visited.add(file.filepath)
				}
			}
		}
	
		return Array.from(ret)
	}
}

/**
 * <odoc>
 * <key>cls()</key>
 * Tries to clear the screen. The commands to try to clean the screen are given in ANSI.
 * </odoc>
 */
const cls = function() {
	var jansi = JavaImporter(Packages.org.fusesource.jansi);

	if (!__initializeCon()) return false;

	if(__conAnsi) {
		jansi.AnsiConsole.systemInstall();
		printnl(jansi.Ansi.ansi().eraseScreen().cursor(0,0).reset());
		jansi.AnsiConsole.systemUninstall();
	}
}

/**
 * <odoc>
 * <key>conReset() : boolean</key>
 * Tries to reset the console to its original state. Returns true if successful.
 * </odoc>
 */
const conReset = function() {
	if (String(java.lang.System.getProperty("os.name")).match(/Windows/)) return true
	if (!__initializeCon() || isUnDef(__con)) return false
	__con.getTerminal().settings.set("sane")
	return true
}

/**
 * <odoc>
 * <key>beep()</key>
 * Tries to produce a beep sound.
 * </odoc>
 */
const beep = function() {
	Packages.java.awt.Toolkit.getDefaultToolkit().beep();
}

/**
 * <odoc>
 * <key>objOrStr(aObj, aStr) : String</key>
 * Given aObj (a map or an array) will try to assess if aStr is an aObj key (using $$.get).
 * If yes, it will return the corresponding aObj value otherwise it will return aStr.
 * </odoc>
 */
const objOrStr = function(aObj, aStr) {
	if (!isMap(aObj) && !isArray(aObj)) return aStr;
	var r = $$(aObj).get(aStr);
	if (isUnDef(r)) r = aStr;
	return r;
}

/**
 * <odoc>
 * <key>watch(waitFor, aCommand, beautifyFlag, noPrint)</key>
 * Executes javascript aCommand provided every waitFor periods of time (expressed in ms). The screen
 * will be cleared and the execution will repeat indefinitely until the 'q' key is pressed. 
 * Optionally a beautifyFlag can be provided to execute the beautifier function on the aCommand result.
 * </odoc>
 */
const watch = function(waitFor, aCommand, beautifyFlag, noPrint) {
	var c = -2;

	plugin("Threads");
	if (isUnDef(__conStatus)) __initializeCon();
	plugin("Console");
	var con = new Console();
	var t = new Threads();

	t.addScheduleThreadAtFixedRate(function() {
		var out = "";
		try {
			out = af.eval(aCommand);
		} catch (e) {
			out = e.message;
		}

		if (beautifyFlag) out = beautifier(out);

		if (noPrint) {
			cls();
			print(out);
			print("Press 'q' to quit. (refreshed at " + new Date() + ")");
		}
	}, waitFor);

	try {
		t.startNoWait();

		while(c != 3 && c != 113) {
			var tmpC = Number(con.readCharNB());
			if (tmpC > 0) c = tmpC;
		}

		print("");
		t.stop();
	} catch(e) {
		printErr(e.message);
		t.stop();
	}
}

/**
 * <odoc>
 * <key>quickSort(items, aCompareFunction) : Array</key>
 * Performs a quick sort algorithm on the items array provided. Optionally aCompareFunction can be
 * provided. The sorted array will be returned.
 * </odoc>
 */
const quickSort = function(items, aCompareFunction) {
	function swap(items, firstIndex, secondIndex){
		var temp = items[firstIndex];
		items[firstIndex] = items[secondIndex];
		items[secondIndex] = temp;
	}

	function partition(items, left, right, aCompareFunction) {
		var pivot   = items[Math.floor((right + left) / 2)],
		i       = left,
		j       = right;

		while (i <= j) {
			while(aCompareFunction(items[i], pivot) < 0) {
				i++;
			}

			while(aCompareFunction(items[j], pivot) > 0) {
				j--;
			}

			if (i <= j) {
				swap(items, i, j);
				i++;
				j--;
			}
		}

		return i;
	}

	if (isUnDef(aCompareFunction)) {
		aCompareFunction = function(a, b) { return a - b; }
	}

	function qsort(items, aCompareFunction, left, right) {
		var index;
		if (items.length > 1) {
			index = partition(items, left, right, aCompareFunction);

			if (left < index - 1) {
				qsort(items, aCompareFunction, left, index - 1);
			}

			if (index < right) {
				qsort(items, aCompareFunction, index, right);
			}
		}
		return items;
	}

	return qsort(items, aCompareFunction, 0, items.length - 1);
}


/**
 * (extracted and chnaged from)
 * jQuery JavaScript Library v2.0.3
 * http://jquery.com/
 *
 * Copyright 2005, 2013 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2013-07-03T13:30Z
 *
 * <odoc>
 * <key>extend([deep], target [, object1][, objectN]) : Object</key>
 * Merges the contents of two or more objects together into the first object (target). If deep is specified
 * the copy will be recursive. This function is equivalent to JQuery's extend function. See more in 
 * https://api.jquery.com/jquery.extend/
 * </odoc>
 */
const extend = function() {
	if (__flags.ALTERNATIVES.extend) {
		let deep = false
		let target = arguments[0] || {}

		let _sources = []
		for (var i = 1; i < arguments.length; i++) { _sources[i - 1] = arguments[i] }

		if (typeof target === "boolean") {
			deep = target
			target = _sources.shift()
		}
		if (typeof target !== "object" && typeof target !== "function") {
			target = {}
		}

		let stack = [{ target, sources: _sources }]
		while (stack.length > 0) {
			let { target, sources } = stack.pop()
			for (let source of sources) {
				if (source != null) {
					for (let key of Object.keys(source)) {
						let src = target[key]
						let copy = source[key]
						if (target === copy) {
							continue
						}
						let copyIsArray = false
						let _clone
						if (deep && copy && ((!(copy instanceof java.lang.Object) && "undefined" === typeof copy.getDate && typeof copy === "object") || typeof copy === "function")) {

							if (Array.isArray(copy)) {
								copyIsArray = true
								_clone = src && Array.isArray(src) ? src : []
							} else {
								_clone = src && typeof src === "object" ? src : {}
							}
							target[key] = _clone
							stack.push({ target: _clone, sources: [copy] })
						} else if (copy !== undefined) {
							target[key] = copy
						}
					}
				}
			}
		}
		return target
	} else {
		var class2type = {
			"[object Boolean]":   "boolean",
			"[object Number]":    "number",
			"[object String]":    "string",
			"[object Function]":  "function",
			"[object Array]":     "array",
			"[object Date]":      "date",
			"[object RegExp]":    "regexp",
			"[object Object]":    "object",
			"[object Error]":     "error"
		};

		var core_toString = class2type.toString,
		core_hasOwn   = class2type.hasOwnProperty;

		var jQuery = {};

		jQuery.isFunction = function( obj ) {
			return jQuery.type(obj) === "function";
		};

		jQuery.isArray = Array.isArray;

		jQuery.type = function( obj ) {
			if ( obj == null ) {
				return String( obj );
			}
			return typeof obj === "object" || typeof obj === "function" ?
					class2type[ core_toString.call(obj) ] || "object" :
						typeof obj;
		};

		jQuery.isPlainObject = function( obj ) {
			if (isJavaObject(obj)) return false;
			
			if ( jQuery.type( obj ) !== "object" || obj.nodeType ) {
				return false;
			}

			try {
				if ( obj.constructor && !core_hasOwn.call( obj.constructor.prototype, "isPrototypeOf" ) ) {
					return false;
				}
			} catch ( e ) {
				return false;
			}

			return true;
		};


		var options,
		name,
		src,
		copy,
		copyIsArray,
		clone,
		target = arguments[0] || {},
		i = 1,
		length = arguments.length,
		deep = false;

		if ( typeof target === "boolean" ) {
			deep = target;
			target = arguments[1] || {};
			i = 2;
		}

		if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
			target = {};
		}

		if ( length === i ) {
			target = this;
			--i;
		}

		for ( ; i < length; i++ ) {
			if ( (options = arguments[ i ]) != null ) {
				for ( name in options ) {
					src = target[ name ];
					copy = options[ name ];

					if ( target === copy ) {
						continue;
					}

					if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
						if ( copyIsArray ) {
							copyIsArray = false;
							clone = src && jQuery.isArray(src) ? src : [];

						} else {
							clone = src && jQuery.isPlainObject(src) ? src : {};
						}

						target[ name ] = extend( deep, clone, copy );

					} else if ( copy !== undefined ) {
						target[ name ] = copy;
					}
				}
			}
		}

		return target;
	}
}

/**
 * <odoc>
 * <key>exit(anExitCode, force)</key>
 * Immediately exits execution with the provided exit code. 
 * Optionally force=true can be provided but no shutdown triggers will be executed (use only as a last option)
 * </odoc>
 */
const exit = function(exitCode, force) {
	if(isUnDef(exitCode)) exitCode = 0

	if (force)
		java.lang.Runtime.getRuntime().halt(exitCode)
	else
		java.lang.System.exit(exitCode)
}

/**
 * <odoc>
 * <key>clone(anObject) : aClonedObject</key>
 * Creates a new copy of a JavaScript object.
 * </odoc>
 */
const clone = function(aObject) {
	//if (Array.isArray(aObject)) return aObject.slice(0);
	if (isNull(aObject) || isUnDef(aObject)) return __
	if (!isObject(aObject)) return aObject
	if (Array.isArray(aObject)) return aObject.map(r=>isObject(r) ? clone(r) : r)
	return aObject.__proto__ instanceof Object ? extend(true, aObject) : extend(true, {}, aObject)
}

/**
 * <odoc>
 * <key>merge(anObjectA, anObjectB) : aMergedObject</key>
 * Merges a JavaScript object A with a JavaScript object B a returns the result as a new object.
 * </odoc>
 */
const merge = function(objA, objB, alternative, deDup) {
	if (isUnDef(alternative)) alternative = __flags.ALTERNATIVES.merge

	if ("undefined" === typeof objA) return objB
	if ("undefined" === typeof objB) return objA

	if (alternative) {
		let stack = []
		let result

		if (!isArray(objA) && isArray(objB)) {
			return merge(objB, objA, alternative, deDup)
		}
		if (isArray(objA) && isArray(objB)) {
			return objB.map(b => merge(objA, b, alternative, deDup))
		}

		if (isArray(objA) && !isArray(objB)) {
			objA = clone(objA)
			result = objA 
		} else {
			result = Object.assign({}, objA)
		}
		stack.push({ objA, objB, result })

		while (stack.length > 0) {
			let { objA, objB, result } = stack.pop()

			if (isMap(objA) && isArray(objB)) {
				for (let i in objB) {
					stack.push({ objA: Object.assign({}, objA), objB: objB[i], result: objB[i] })
				}
			} else if (isMap(objB) && isArray(objA)) {
				for (let i in objA) {
					stack.push({ objA: objA[i], objB: Object.assign({}, objB), result: objA[i] })
				}
			} else {
				if (isDef(objB) && isMap(objB) && !isNull(objB)) {
					Object.keys(objB).forEach(k => {
						if (!isMap(objB[k]) && !isArray(objB[k])) {
							result[k] = objB[k]
						} else {
							if (isArray(objB[k])) {
								if (isUnDef(result[k])) result[k] = []

								if (deDup) {
									result[k] = result[k].concat(objB[k].filter(s => arrayContains(result[k], s) < 0))
								} else {
									result[k] = result[k].concat(objB[k])
								}
							} else if (isMap(objB[k])) {
								if (isUnDef(result[k])) result[k] = {}
								stack.push({ objA: result[k], objB: objB[k], result: result[k] })
							}
						}
					})
				}
			}
		}
		return result
	} else {
		if (!isArray(objA) && isArray(objB)) {
			for(var i in objB) { objB[i] = merge(objB[i], clone(objA), alternative, deDup); }
			return objB;
		}
		if (!isArray(objB) && isArray(objA)) {
			for(var i in objA) { objA[i] = merge(objA[i], clone(objB), alternative, deDup); }
			return objA;
		}
		return extend(true, clone(objA), objB)
	}
}

/**
 * <odoc>
 * <key>uniqArray(anArray) : Array</key>
 * Returns anArray with no duplicates entries (including duplicate maps).
 * </odoc>
 */
const uniqArray = function(anArray) {
	if (!isArray(anArray)) return anArray;

	var r = [];
	anArray.forEach(s => {
		if (arrayContains(r, s) < 0) r.push(s);
	});
	return r;
}

/**
 * <odoc>
 * <key>stopOpenAFAndRun(aCommandLineArray, addCommand)</key>
 * Terminates the current OpenAF execution while trying to execute the commands on the aCommandLineArray.
 * Optionally you can use addCommand boolean flag (true) to allow for shell like commands on the current operating system.
 * To restart OpenAF please use the restartOpenAF function.
 * </odoc>
 */
const stopOpenAFAndRun = function(aCommandLineArray, addCommand) {
	_$(aCommandLineArray).isArray().$_("Please provide a command line array.");
	addCommand = _$(addCommand).isBoolean().default(false);

	if (addCommand) {
		var unix = ( java.lang.System.getProperty("os.name").indexOf("Windows") < 0);
		if (unix) {
			aCommandLineArray.unshift("/c");
			aCommandLineArray.unshift("cmd");	
		} else {
			aCommandLineArray.unshift("-c");
			aCommandLineArray.unshift("/bin/sh");	
		}
	}
	var builder = new java.lang.ProcessBuilder(aCommandLineArray);
	builder.inheritIO();
	builder.start();
	java.lang.System.exit(0);
}

/**
 * <odoc>
 * <key>restartOpenAF(aCommandLineArray, preCommandLineArray)</key>
 * Terminates the current OpenAF execution and tries to start a new with the same command
 * line, if aCommandLineArray is not provided. If aCommandLineArray is provided each array
 * element will be use sequentially to build the command line to start a new OpenAF instance. 
 * preCommandLineArray can be used to provide java arguments if defined.
 * </odoc>
 */
const restartOpenAF = function(aCommandLineArray, preLineArray, noStop) {
	var javaBin = java.lang.System.getProperty("java.home") + java.io.File.separator + "bin" + java.io.File.separator + "java";
	var currentJar = getOpenAFJar();
	
	/* is it a jar file? */
	if(!currentJar.endsWith(".jar"))
		return;

	/* Build command: java -jar application.jar */
	var command = new java.util.ArrayList();
	command.add(javaBin);
	if (isDef(preLineArray)) {
		for(var c in preLineArray) {
			command.add(preLineArray[c]);
		}
	} else {
		var ar = java.lang.management.ManagementFactory.getRuntimeMXBean().getInputArguments();
		for(var ari = 0; ari < ar.size(); ari++) {
			command.add(String(ar.get(ari)));
		}
	}
	command.add("-jar");
	command.add(currentJar);
	if (isUnDef(aCommandLineArray)) {
		for(var c in __args) {
			command.add(__args[c]);
		}
	} else {
		for(var c in aCommandLineArray) {
			command.add(aCommandLineArray[c]);
		}
	}

	var builder = new java.lang.ProcessBuilder(command);
	builder.inheritIO();
	builder.start();
	if (!noStop) java.lang.System.exit(0);
}

/**
 * <odoc>
 * <key>forkOpenAF(aCommandLineArray, preCommandLineArray) : Promise</key>
 * Starts another OpenAF with the same command line, if aCommandLineArray is not provided. 
 * If aCommandLineArray is provided each array element will be use sequentially to build
 * the command line to start a new OpenAF instance. preCommandLineArray can be used to 
 * provide java arguments if defined.
 * </odoc>
 */
const forkOpenAF = function(aCommandLineArray, preLineArray) {
	return $do(() => {
		restartOpenAF(aCommandLineArray, preLineArray, true);
	});
}

/**
 * <odoc>
 * <key>compare(X, Y) : Boolean</key>
 * Compares a X object to a Y object at the content level. If they are equal the function will return true
 * otherwise it will return false.
 * </odoc>
 */
const compare = function(x, y) {
	'use strict';

	if (x === null || x === undefined || y === null || y === undefined) { return x === y; }
	if (x.constructor !== y.constructor) { return false; }
	if (x instanceof Function) { return x === y; }
	if (x instanceof RegExp) { return x === y; }
	if (x === y || x.valueOf() === y.valueOf()) { return true; }
	if (Array.isArray(x) && x.length !== y.length) { return false; }
	if (x instanceof Date) { return false; }
	if (!(x instanceof Object)) { return false; }
	if (!(y instanceof Object)) { return false; }

	var p = Object.keys(x), q = Object.keys(y);
	if (p.length != q.length) return false;
	for(var k in x) { 
		var v = x[k];
		if (isUnDef(y[k]) || (!compare(v, y[k]))) return false;
	}
	
	return true;
}

/**
 * <odoc>
 * <key>arrayContains(anArray, aObj, aPreFilter) : Number</key>
 * Tries to find aObj in anArray returning the position where it's first found or -1 if not found.
 * Optionally aPreFilter function can prepare each object for comparing.
 * </odoc>
 */
const arrayContains = function(anArray, aObj, aPreFilter) {
	_$(anArray).isArray().$_();

	var ii, found = false;
	for(ii = 0; ii < anArray.length && !found; ii++) {
		var o = (isFunction(aPreFilter)) ? aPreFilter(anArray[ii]) : anArray[ii];
		if (compare(aObj, o)) found = true;
	}

	return (found ? ii-1 : -1);
}

/**
 * <odoc>
 * <key>inherit(Child, Parent)</key>
 * Associates a Child object to a Parent simulating a inheritance relationship. This is done by
 * copying the Parent prototype to the Child prototype. This is similar to "Parent.call(this, arg1, arg2)"
 * </odoc>
 */
const inherit = function(Child, Parent) {
	Child.prototype = Object.create(Parent.prototype);
	Child.prototype.constructor = Child;
}

/**
 * <odoc>
 * <key>visibleLength(aString) : Number</key>
 * More complete af.visibleLength function
 * </odoc>
 */
const __visibleLength = "H4sIAAAAAAAAAO2daXIjNwyF/+c2wP0Pl0rcAB4WshdJHo/rfWWP1d0kVhKklJQo8mF0z6fVk5fR/3/kv1wxX9dgmP48KnN5UYnKg3Xo+MXapPn661Jy2VIxUSXt6hPH580fqnerSHw9W3f7ZfX5K8uikWgpqT119zweNqy8eUiFQeZP7kT4GFBqF7pJnnqX+6uuxeXLW/WJkaRdtvrMqZhXPlEgN+9SIJ4USLbdOYLqczVu9LiFNNEQZrqSghgL4Y1ZYrLC2eggUvX7eAmvvKWPNbGMeRS9KUQyF6QeLXwEOaj6QX4Ndy2DOM0gGiBbPFRiU7PE3zp0rcmm4ra3iGTDvMuJjUbVtHBLsyYI+BTHph+CYc66TRI3Y6zhaLN+2uSLN2yDtcbfwzjUhVYLQSraHS6l+I+p0bKmCspa68dhl4XUpMfiG04PGWl+YHNQ7oPPDKh29/ymhqGoVPccTr8StyAZEBfVcUGJig/QtLcV59UkPyx4LiGqJzxvM3enu07ItXpVX11MfAmRtheHjU/R9yZBvN7bFmBM/NxxYLyJyw/8aVMlXZlRMTG1KUUnUpVNLZevUPyTwA1+vpU5lFc7i0V6Tsnr9m7k3sPn3HGVry/3P+1wTU8TI8thHR3EW70lLqmA2QRVLOyDuxLtjvzEj1hVtAXWbU9zAlaNtLIVf2H1WHtwfahsG5xoefZ0tGltBpbvQdLe/k3Hjbltz6T56dLU+upd87Zth/Ke5KbU6CGDlEnwuC2x/vBPTABvrvHQRcVb3tSoRTrPiRJHya3aoK+29zzgXDyVP6TyaCdlG2KbQJ+qpQvkqyyBFkqzIO9csglRoDzSEawSGt8OeyWqkbb9lG1UMWESu9diefICZca71vVMeI0YF31j8UibYoi8/NuzUb+WQKWoizcIEXmaVS0+aly6SAvySbXOJltGIZd5VODo34btPKJlniXBp50fsg7FHJ/UNfqbLLiGe93P6nFPQ41levDQ4iwtGdwyOZgwygGviqVpLMJsP5N5CZyy5BfyybRyyPxk9tmBjcLiaRTeS7pgx6T2rtsLV5Kr0CDZGW/umjVe+vq12trwY4dj2sAMC9llORc6wu4GdQ67lVL7YWEUT17Vn/LTdszVVtiBHLdg6R1csxWzyK6GxDWOUtjQhb4pQHm9m9f5ejdHC3S1BXTsuR+bJ1ntEn8We+tJ5ZNxm+Ue+uxX+tw67np1LvWjtDVpIGoz4YqUvf0m6LRInozJTXxrNYllBD4mwOFdsvWOOfMbidiUGC2SV9/p+KcUvnbELwqzxpscg14foFXbDX/i1vTmqzY9PlALe9GAvkzlRXRYp+fP1MYFehmNxU5vWuLTq00qawy+HMu2ojuxITwJeokbJnPpYLv6xlUpZcrG8Mq72P9s2sNHdVGOjw8DMdaH/viYU3yPFq9MoED0j95hC3iT/BKT7JbB5kwfhrn4qtVbiSGLm6xu4SAujaT0/PbfK6vQ7FyKUNlR5rZ3pa80LkKwfvQi1/T/zVyL9xv8/1QAvy0xtwbB5wfMLVMmc57Pt1nJrfZ6b9a+O5p/0Xz+JlNPlfwt8SKEEEIIIYQQQgghhBBCCPnl/Pb/fk0IIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQ8qPoh3vf4OiD58nB6alwcqUflRe97Def32lWxHGdcHxqUW4q/CfpknIAbjwXwWs8nBYPXpU4BjTpDJnu+63TQOcgZxdkOlQ6xTCM3Gk6sUrL1aK9wmGgK5ljCKaDS/PZuZLzUuWkeMSJrKOsKmnZLBTbQbDbpkXUpFK7aav++U/2H2fHUv+J5HqrRru1nKZGbhSzs5mg/SYa7+LyHNM62Bce2UG4eRj0U6MHzfA4fPPwYoOqUt3Ao/SoSYli5TFKhXT9bbr1CTYVGVrsv5j3MKh1mHs1uyZDwXW19IDA0y8KtsqvU0w2lcXOPIZ0q3eBO4sjz9EZlwApths2DmzCQ7vIr5QD2G3RyeNt7czkX1tjStQiAj2ikJImUvEypmxpG54K9Lq+VO0c89gJTps4Nd0zVyNR60du7qmE/EsMeJBUJYzYupqEp0C+FI0T7VWjpHXM3FlbcMm2azZUY6IWKw4h9cCnpytZ2sO7D0G3XbAJzt9Jbqub9qpVqnlopajuozt7UE9Fz7ZAWpOQMhdeIrKlvi2OrehxJbaCCaTWLszMk6FTfTlU4vi4O/YIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCEnvON/OiaEEEIIIYQQQsj3cPpG/vlb/rMe9z5P4AcYhBBCCCGEEELIc3R49cd54X368AVkD9Tf7iL+1XKXe2fTxu8vJOe8Gq8nqf4s8N2hfutnWvo6KRPpCyLxq19PUlzEZMFJXvpOStdoX5m5Eg5fBYmmi8reuuJq9xga7j3cclYuX5X7VML1MQDZGnqdSbzhSrt31cZv5Vm4r/Mz3FtuOP75F8Cu/6jh/wAA"
var __visibleLength2
const visibleLength = str => {
	if (isUnDef(__visibleLength2)) __visibleLength2 = af.fromBytes2String(io.gunzip(af.fromBase64(__visibleLength)))
	
	str = str.replace(/\033\[[0-9;]*m/g, "")
	var l = 0
	for(var i = 0; i < str.length; i++) {
		var _c = str.charCodeAt(i)
		if (_c <= 254)
			l += 1
		else
			l += Number(__visibleLength2[str.charCodeAt(i) - 32])
	}
	return l
}

/**
 * <odoc>
 * <key>$$from : Array</key>
 * Shortcut for the JLinq library for easy query and access to arrays/objects. To see all the available options
 * please refer to http://hugoware.net/Projects/jlinq and the list of available functions by executing,
 * in the openaf-console: "desc $$from([])".
 * </odoc>
 */
const $$from = function(a) {
	loadCompiledLib("jlinq_js");

	if(Object.prototype.toString.call(a) == '[object Array]') {
		return jl.from(a);
	} else {
		return jl.from(Object.keys(a).map(function(key) { 
			var r = {};
			r[key] = a[key];
			return r;
		}));
		//throw "Only queries to arrays of objects.";
	}
};

/**
 * <odoc>
 * <key>$from : Array</key>
 * Shortcut for the nLinq library for easy query and access to arrays/objects. To see all the available options
 * please refer to https://github.com/nmaguiar/nLinq/blob/main/Reference.md and the list of available functions by executing,
 * in the openaf-console: "desc $from([])".
 * </odoc>
 */
var $from = function(a) {
	loadCompiledLib("openafnlinq_js");
	return $from(a);
};

/**
 * <odoc>
 * <key>$path(obj, path, customFunctions) : Object</key>
 * Shortcut for the JMESPath library for easy query and access to arrays/objects. To see all the available options
 * please refer to http://jmespath.org. Optional you can provide a map of customFunctions. Examples:\
 * \
 * [Slicing]: \
 *   $path(arr, "[0:5]"); $path(arr, "[5:10]"); $path(arr, "[:5]"); $path(arr, "[::2]"); $path(arr, "[::-1]");\
 * \
 * [Projections]: \
 *   $path(arr, "a[*].first"); $path(arr, "a.*.b"); $path(arr, "[]");\
 * \
 * [Filters]: \
 *   $path(arr, "a[?b=='xyz'].c"); $path(arr, "a[?b>`1`].x");\
 * \
 * [MultiSelect]: \
 *   $path(arr, "a[].[x, y]"); $path(arr, "a[].{ x: x, y: y }");\
 * \
 * [Pipe]: \
 *   $path(arr, "a[*].b | [0]"); \
 * \
 * [Functions]: \
 *   abs(x), avg(x), contains(x, y), ceil(x), floor(x), join(x, arr), keys(obj), length(x), map(expr, arr), max(x), max_by(x, y), merge(a, b), min(a), min_by(a, b), not_null(a), reverse(arr), sort(arr), sort_by(a, y), starts_with(a, b), ends_with(a, b), sum(a), to_array(a), to_string(a), to_number(a), type(a), values(a)\
 *   $path(arr, "a[?contains(@, 'b') == `true`]")\
 * \
 * [OpenAF custom functions]: \
 *   a2m(arrFields, arrValues), a4m(arr, 'key', dontRemove), m2a(arrFields, obj), m4a(obj, 'key'), count_by(arr, 'field'), format(x, 'format'), formatn(x, 'format'), group(arr, 'field'), group_by(arr, 'field1,field2'), unique(arr), to_map(arr, 'field'), to_date(x), to_datef(x, format) from_datef(x, format), to_isoDate(x), flat_map(x), search_keys(arr, 'text'), search_values(arr, 'text'), delete(map, 'field'), substring(a, ini, end),\
 *  template(a, 'template'), t(a, 'template'), templateF(x, 'template'), tF(x, 'template'), to_bytesAbbr(x), to_numAbbr(x), from_bytesAbbr(x), from_siAbbr(x), from_timeAbbr(x), timeago(x), from_ms(x, 'format'), replace(x, 're', 'flags', 'replaceText'), split(x, 'sep'), trim(x), index_of(x, 'search'), last_index_of(x, 'search'), lower_case(x), upper_case(x), concat(x, y), match(x, 're', 'flags'), amerge(x, y), to_slon(x), from_slon(x), to_json(x), from_json(x, str), to_yaml(x, isMultiDoc), from_yaml(x), trim(x), nvl(x, v), to_toml(x), from_toml(x)
 * add(x, y), sub(x, y), mul(x, y), div(x, y), mod(x, y)\
 * split(x, sep), split_re(x, sepRE), split_sep(x, sepRE, encls), date_diff(d, unit, nullValue)\
 * insert(obj, 'field', value), now(negativeTimeDiff)\
 * get(nameOrPath), set(obj, path), setp(obj, path, name)\
 * range(count), ranges(count, start, step)\
 * inc(name), dec(name), getc(name), unset(obj, name)\
 * k2a(map, keyre, outkey, removeNulls), geta(nameOrPath, arrayIndex)\
 * sql_format(sql, options), sort_semver(arrayVersions), sort_by_semver(arrayMaps, jmespathStringToVersionField)\
 * semver(version, operation, argument)\
 * progress(value, max, min, size, indicator, space),\
 * to_csv(array, options), from_csv(str, options)\
 * ch(name, op, arg1, arg2), path(obj, jmespath), opath(jmespath)\
 * to_ms(date), timeagoAbbr(x)\
 * env(str), envs(regex)\
 * oafp(json/slon)\
 * if(cond, then, else)\
 * assign(obj, path, value), assignp(objPathStr, path, value)\
 * random(min, max), srandom(min, max)\
 * at(arrayIndex)\
 * to_numSpace(num, space), from_numSpace(num, space)\
 * 
 * Functions only active if flag PATH_SAFE is false:\
 *   ojob(name, argsJSSLON)\
 *   sh(command, stdin), sh_json(command, stdin), sh_jsslon(command, stdin), sh_yaml(command, stdin)\
 * \
 * Custom functions:\
 *   $path(2, "example(@)", { example: { _func: (a) => { return Number(a) + 10; }, _signature: [ { types: [ $path().number ] } ] } });\
 * \
 * </odoc>
 */
const $path = function(aObj, aPath, customFunctions) {
	loadCompiledLib("jmespath_js");
	
	let _locals = {}
	aPath = _$(aPath, "aPath").isString().default("@")
	customFunctions = _$(customFunctions, "customFunctions").isMap().default({})
	customFunctions = merge(__flags.PATH_CFN, customFunctions)
	customFunctions = merge({
		count_by: {
			_func: ar => $from(ar[0]).countBy(ar[1]),
			_signature: [ { types: [ jmespath.types.array ] }, { types: [ jmespath.types.string ] } ]
		},
		group: {
			_func: ar => $from(ar[0]).group(ar[1]),
			_signature: [ { types: [ jmespath.types.array ] }, { types: [ jmespath.types.string ] } ]
		},
		group_by: {
			_func: ar => $from(ar[0]).groupBy(ar[1]),
			_signature: [ { types: [ jmespath.types.array ] }, { types: [ jmespath.types.string ] } ]
		},
		unique: {
			_func: ar => uniqArray(ar[0]),
			_signature: [ { types: [ jmespath.types.array ] } ]
		},
		to_map: {
			_func: ar => $from(ar[0]).mselect(__, ar[1]),
			_signature: [ { types: [ jmespath.types.array ] }, { types: [ jmespath.types.string ] } ]
		},
		substring: {
			_func: ar => String(ar[0]).substring(ar[1], ar[2]),
			_signature: [ { types: [ jmespath.types.string ] }, { types:  [ jmespath.types.number ] }, { types:  [ jmespath.types.number ] } ]
		},
		flat_map: {
			_func: ar => ow.loadObj().flatMap(ar[0]),
			_signature: [ { types: [ jmespath.types.array, jmespath.types.object ] } ]
		},
		search_keys: {
			_func: ar => searchKeys(ar[0], ar[1]),
			_signature: [ { types: [ jmespath.types.any ] }, { types: [ jmespath.types.string ] } ]
		},
		search_values: {
			_func: ar => searchValues(ar[0], ar[1]),
			_signature: [ { types: [ jmespath.types.any ] }, { types: [ jmespath.types.string ] } ]
		},
		delete: {
			_func: ar => { $$(ar[0]).unset(ar[1]); return ar[0] },
			_signature: [ { types: [ jmespath.types.object ] }, { types: [ jmespath.types.string ] } ]
		},
		insert: {
			_func: ar => { $$(ar[0]).set(ar[1],ar[2]); return ar[0] },
			_signature: [ { types: [ jmespath.types.object ] }, { types: [ jmespath.types.string ] }, { types: [ jmespath.types.any ] } ]
		},
		format: {
			_func: ar => $ft(ar[1], ar[0]),
			_signature: [ { types: [ jmespath.types.string, jmespath.types.number ] }, { types: [ jmespath.types.string ] } ] 
		},
		formatn: {
			_func: ar => $f(ar[1], ar[0]),
			_signature: [ { types: [ jmespath.types.string, jmespath.types.number ] }, { types: [ jmespath.types.string ] } ] 
		},
		template: {
			_func: ar => $t(ar[1], ar[0]),
			_signature: [ { types: [ jmespath.types.any ] }, { types: [ jmespath.types.string ] } ]
		},
		templateF: {
			_func: ar => { ow.loadTemplate(); ow.template.addConditionalHelpers(); ow.template.addFormatHelpers(); return $t(ar[1], ar[0]) },
			_signature: [ { types: [ jmespath.types.any ] }, { types: [ jmespath.types.string ] } ]
		},
		t: {
			_func: ar => $t(ar[1], ar[0]),
			_signature: [ { types: [ jmespath.types.any ] }, { types: [ jmespath.types.string ] } ]
		},
		tF: {
			_func: ar => { ow.loadTemplate(); ow.template.addConditionalHelpers(); ow.template.addFormatHelpers(); return $t(ar[1], ar[0]) },
			_signature: [ { types: [ jmespath.types.any ] }, { types: [ jmespath.types.string ] } ]
		},
		to_isoDate: {
			_func: ar => {
				ow.loadFormat()
				var _r = isNumber(ar[0]) ? new Date(ar[0]) : ow.format.fromISODate(ar[0])
				if (isDate(_r)) return _r.toISOString(); else return ar[0]
			},
			_signature: [ { types: [ jmespath.types.any ] } ]
		},
		to_date: {
			_func: ar => {
				ow.loadFormat()
				return isNumber(ar[0]) ? new Date(ar[0]) : ow.format.fromISODate(ar[0])
			},
			_signature: [ { types: [ jmespath.types.any ] } ]
		},
		to_datef: {
			_func: ar => ow.loadFormat().toDate(ar[0], ar[1]),
			_signature: [ { types: [ jmespath.types.any ] }, { types: [ jmespath.types.string ] } ]
		},
		from_datef: {
			_func: ar => ow.loadFormat().fromDate(ar[0], ar[1]),
			_signature: [ { types: [ jmespath.types.any ] }, { types: [ jmespath.types.string ] } ]
		},
		date_diff: {
			_func: ar => {
				ow.loadFormat()
				let a = ar[0], p = ar[1], isN = ar[2]

				if (isDef(a) && a != null) {
					var res = "seconds"
					if (isDef(p) && p != null && isString(p)) res = p
					try {
							switch(res) {
							case "minutes": return ow.format.dateDiff.inMinutes(new Date(a))
							case "hours"  : return ow.format.dateDiff.inHours(new Date(a))
							case "days"   : return ow.format.dateDiff.inDays(new Date(a))
							case "months" : return ow.format.dateDiff.inMonths(new Date(a))
							case "weeks"  : return ow.format.dateDiff.inWeeks(new Date(a))
							case "years"  : return ow.format.dateDiff.inYears(new Date(a))
							case "seconds":
							default:
									return ow.format.dateDiff.inSeconds(new Date(a))
							}
					} catch(e) {
							return (isString(isN) ? isN : null)
					}
				} else {
					return (isString(isN) ? isN : null)
				}
			},
			_signature: [ { types: [ jmespath.types.any ] }, { types: [ jmespath.types.string ] }, { types: [ jmespath.types.any ] } ]
		},
		a2m: {
			_func: ar => $a2m(ar[0], ar[1]),
			_signature: [ { types: [ jmespath.types.array ] }, { types: [ jmespath.types.array ] } ]
		},
		a4m: {
			_func: ar => $a4m(ar[0], ar[1], ar[2]),
			_signature: [ { types: [ jmespath.types.array ] }, { types: [ jmespath.types.string ] }, { types: [ jmespath.types.boolean ] } ]
		},
		m2a: {
			_func: ar => $m2a(ar[0], ar[1]),
			_signature: [ { types: [ jmespath.types.array ] }, { types: [ jmespath.types.object ] } ]
		},
		m4a: {
			_func: ar => $m4a(ar[0], ar[1]),
			_signature: [ { types: [ jmespath.types.object ] }, { types: [ jmespath.types.string ] } ]
		},
		to_bytesAbbr: {
			_func: ar => ow.loadFormat().toBytesAbbreviation(ar[0]),
			_signature: [ { types: [ jmespath.types.number ] } ]
		},
		to_numAbbr: {
			_func: ar => ow.loadFormat().toAbbreviation(ar[0]),
			_signature: [ { types: [ jmespath.types.number ] } ]
		},
		to_numSpace: {
			_func: ar => ow.loadFormat().toNumberSpacing(ar[0], ar[1]),
			_signature: [ { types: [ jmespath.types.number ] }, { types: [ jmespath.types.string ] } ]
		},
		from_numSpace: {
			_func: ar => ow.loadFormat().fromNumberSpacing(ar[0], ar[1]),
			_signature: [ { types: [ jmespath.types.string ] }, { types: [ jmespath.types.string ] } ]
		},
		from_bytesAbbr: {
			_func: ar => ow.loadFormat().fromBytesAbbreviation(ar[0]),
			_signature: [ { types: [ jmespath.types.string ] } ]
		},
		from_siAbbr: {
			_func: ar => ow.loadFormat().fromSIAbbreviation(ar[0]),
			_signature: [ { types: [ jmespath.types.string ] } ]
		},
		from_timeAbbr: {
			_func: ar => ow.loadFormat().fromTimeAbbreviation(ar[0]),
			_signature: [ { types: [ jmespath.types.string ] } ]
		},
		timeago: {
			_func: ar => ow.loadFormat().timeago(isDate(ar[0]) ? ar[0].getTime() : ar[0]),
			_signature: [ { types: [ jmespath.types.any, jmespath.types.string ] } ]
		},
		timeagoAbbr: {
			_func: ar => ow.loadFormat().timeago(isDate(ar[0]) ? ar[0].getTime() : ar[0], true),
			_signature: [ { types: [ jmespath.types.any, jmespath.types.string ] } ]
		},
		from_ms: {
			_func: ar => ow.loadFormat().elapsedTime4ms(ar[0], (ar[1].trim().startsWith("{") ? jsonParse(ar[1],__,__,true) : (ar[1].trim().startsWith("(") ? af.fromSLON(ar[1]) : __))),
			_signature: [ { types: [ jmespath.types.number ] }, { types: [ jmespath.types.string ]} ]
		},
		to_ms: {
			_func: ar => isDate(ar[0]) ? ar[0].getTime() : ar[0],
			_signature: [ { types: [ jmespath.types.any ] } ]
		},
		replace: {
			_func: ar => ar[0].replace(new RegExp(ar[1], ar[2]), ar[3]),
			_signature: [ { types: [ jmespath.types.string ] }, { types: [ jmespath.types.string ] }, { types: [ jmespath.types.string ] }, { types: [ jmespath.types.string ] } ]
		},
		trim: {
			_func: ar => ar[0].trim(),
			_signature: [ { types: [ jmespath.types.string ] } ]
		},
		split: {
			_func: ar => ar[0].split(ar[1]),
			_signature: [ { types: [ jmespath.types.string ] }, { types: [ jmespath.types.string ] } ]
		},
		split_re: {
			_func: ar => ar[0].split(new RegExp(ar[1])),
			_signature: [ { types: [ jmespath.types.string ] }, { types: [ jmespath.types.string ] } ]
		},
		index_of: {
			_func: ar => ar[0].indexOf(ar[1]),
			_signature: [ { types: [ jmespath.types.string ] }, { types: [ jmespath.types.string ] } ]
		},
		last_index_of: {
			_func: ar => ar[0].lastIndexOf(ar[1]),
			_signature: [ { types: [ jmespath.types.string ] }, { types: [ jmespath.types.string ] } ]
		},
		upper_case: {
			_func: ar => ar[0].toUpperCase(),
			_signature: [ { types: [ jmespath.types.string ] } ]
		},
		lower_case: {
			_func: ar => ar[0].toLowerCase(),
			_signature: [ { types: [ jmespath.types.string ] } ]
		},
		concat: {
			_func: ar => ar[0].concat(ar[1]),
			_signature: [ { types: [ jmespath.types.string, jmespath.types.array ] }, { types: [ jmespath.types.string, jmespath.types.array ] } ]
		},
		match: {
			_func: ar => (new RegExp(ar[1], ar[2])).test(ar[0]),
			_signature: [ { types: [ jmespath.types.string ] }, { types: [ jmespath.types.string ] }, { types: [ jmespath.types.string ] } ]
		},
		amerge: {
			_func: ar => merge(ar[0], ar[1]),
			_signature: [ { types: [ jmespath.types.array, jmespath.types.object ] }, { types: [ jmespath.types.array, jmespath.types.object ] } ]
		},
		to_slon: {
			_func: ar => af.toSLON(ar[0]),
			_signature: [ { types: [ jmespath.types.any ] } ]
		},
		from_slon: {
			_func: ar => af.fromSLON(ar[0]),
			_signature: [ { types: [ jmespath.types.string ] } ]
		},
		from_json: {
			_func: ar => jsonParse(ar[0], __, __, true),
			_signature: [ { types: [ jmespath.types.string ] } ]
		},
		from_csv: {
			_func: ar => $csv(af.fromJSSLON(ar[1])).fromInString(ar[0]).toOutArray(),
			_signature: [ { types: [ jmespath.types.string ] }, { types: [ jmespath.types.string ] } ]
		},
		to_csv: {
			_func: ar => {
				var os = af.newOutputStream()
				$csv(af.fromJSSLON(ar[1])).toOutStream(os).fromInArray(ar[0])
				return String(os.toString())
			},
			_signature: [ { types: [ jmespath.types.array ] }, { types: [ jmespath.types.string ] } ]
		},
		to_json: {
			_func: ar => stringify(ar[0], __, ar[1]),
			_signature: [ { types: [ jmespath.types.any ] }, { types: [ jmespath.types.string ] } ]
		},
		to_yaml: {
			_func: ar => af.toYAML(ar[0], ar[1]),
			_signature: [ { types: [ jmespath.types.any ] }, { types: [ jmespath.types.boolean ] } ]
		},
		from_yaml: {
			_func: ar => af.fromYAML(ar[0]),
			_signature: [ { types: [ jmespath.types.string ] } ]
		},
		to_toml: {
			_func: ar => af.toTOML(ar[0]),
			_signature: [ { types: [ jmespath.types.any ] } ]
		},
		from_toml: {
			_func: ar => af.fromTOML(ar[0]),
			_signature: [ { types: [ jmespath.types.string ] } ]
		},
		trim: {
			_func: ar => ar[0].trim(),
			_signature: [ { types: [ jmespath.types.string ] } ]
		},
		nvl: {
			_func: ar => (isNull(ar[0]) || isUnDef(ar[0]) ? ar[1] : ar[0]),
			_signature: [ { types: [ jmespath.types.any ] }, { types: [ jmespath.types.any ] } ]
		},
		add: {
			_func: ar => ar[0] + ar[1],
			_signature: [ { types: [ jmespath.types.number ] }, { types: [ jmespath.types.number ] } ]
		},
		sub: {
			_func: ar => ar[0] - ar[1],
			_signature: [ { types: [ jmespath.types.number ] }, { types: [ jmespath.types.number ] } ]
		},
		mul: {
			_func: ar => ar[0] * ar[1],
			_signature: [ { types: [ jmespath.types.number ] }, { types: [ jmespath.types.number ] } ]
		},
		div: {
			_func: ar => ar[0] / ar[1],
			_signature: [ { types: [ jmespath.types.number ] }, { types: [ jmespath.types.number ] } ]
		},
		mod: {
			_func: ar => ar[0] % ar[1],
			_signature: [ { types: [ jmespath.types.number ] }, { types: [ jmespath.types.number ] } ]
		},
		split_sep: {
			_func: ar => splitBySepWithEnc(ar[0], ar[1], ar[2], false),
			_signature: [ { types: [ jmespath.types.string ] }, { types: [ jmespath.types.string ] }, { types: [ jmespath.types.array ] } ]
		},
		now: {
			_func: ar => now() - ar[0],
			_signature: [ { types: [ jmespath.types.any ] } ]
		},
		get: {
			_func: ar => $$(_locals).get(ar[0]) || $$(aObj).get(ar[0]),
			_signature: [ { types: [ jmespath.types.string ] } ]
		},
		set: {
			_func: ar => { $$(_locals).set(ar[1], ar[0]); return ar[0] },
			_signature: [ { types: [ jmespath.types.any ] }, { types: [ jmespath.types.string ] } ]
		},
		setp: {
			_func: ar => { $$(_locals).set(ar[2], $$(ar[0]).get(ar[1])); return ar[0] },
			_signature: [ { types: [ jmespath.types.any ] }, { types: [ jmespath.types.string ] }, { types: [ jmespath.types.string ] } ]
		},
		range: {
			_func: ar => range(ar[0]),
			_signature: [ { types: [ jmespath.types.number ] } ]
		},
		ranges: {
			_func: ar => range(ar[0], ar[1], ar[2]),
			_signature: [ { types: [ jmespath.types.number ] }, { types: [ jmespath.types.number ] }, { types: [ jmespath.types.number ] } ]
		},
		inc: {
			_func: ar => {
				var _prev = $get(ar[0])
				if (isUnDef(_prev)) { 
					_prev = $atomic()
					$set(ar[0], _prev)
				}
				return _prev.inc()
			},
			_signature: [ { types: [ jmespath.types.string ] } ]
		},
		dec: {
			_func: ar => {
				var _prev = $get(ar[0])
				if (isUnDef(_prev)) {
					_prev = $atomic()
					$set(ar[0], _prev)
				}
				return _prev.dec()
			},
			_signature: [ { types: [ jmespath.types.string ] } ]
		},
		getc: {
			_func: ar => $get(ar[0]).get(),
			_signature: [ { types: [ jmespath.types.string ] } ]
		},
		unset: {
			_func: ar => {
				$unset(ar[1])
				return ar[0]
			},
			_signature: [ { types: [ jmespath.types.any ] }, { types: [ jmespath.types.string ] } ]
		},
		k2a: {
			_func: ar => {
				ow.loadObj()
				return ow.obj.key2array(ar[0], ar[1], ar[2], ar[3])
			},
			_signature: [ { types: [ jmespath.types.object ] }, { types: [ jmespath.types.string ] }, { types: [ jmespath.types.any ] }, { types: [ jmespath.types.boolean ] } ]
		},
		geta: {
			_func: ar => $$(_locals).get(ar[0])[ar[1]] || $$(aObj).get(ar[0])[ar[1]],
			_signature: [ { types: [ jmespath.types.string ] }, { types: [ jmespath.types.number ] } ]
		},
		sql_format: {
			_func: ar => ow.loadFormat().sqlFormat(ar[0], af.fromJSSLON(ar[1])),
			_signature: [ { types: [ jmespath.types.string ] }, { types: [ jmespath.types.string ] } ]
		},
		sort_semver: {
			_func: ar => ow.loadFormat().sortSemanticVersions(ar[0]),
			_signature: [ { types: [ jmespath.types.array ] } ]
		},
		sort_by_semver: {
			_func: ar => {
				ow.loadFormat()
				return ar[0].sort((a, b) => {
					var aVal = $path(a, ar[1])
					var bVal = $path(b, ar[1])
					return new org.semver4j.Semver(aVal).isEqualTo(bVal) ? 0 : new org.semver4j.Semver(aVal).isGreaterThan(bVal) ? 1 : -1
				})
			},
			_signature: [ { types: [ jmespath.types.array ] }, { types: [ jmespath.types.string ] } ]
		},
		semver: {
			_func: ar => ow.format.semver(ar[0])[ar[1]](isNull(ar[2]) ? __ : ar[2]),
			_signature: [ { types: [ jmespath.types.string ] }, { types: [ jmespath.types.string ] }, { types: [ jmespath.types.null, jmespath.types.string ] } ]
		},
		progress: {
			_func: ar => {
				ow.loadFormat()
				for(var i = 1; i < ar.length; i++) { if (isNull(ar[i])) ar[i] = __ }
				return ow.format.string.progress(ar[0], ar[1], ar[2], ar[3], ar[4], ar[5])
			},
			_signature: [ { types: [ jmespath.types.number ] }, { types: [ jmespath.types.null,jmespath.types.number ] }, { types: [ jmespath.types.null,jmespath.types.number ] }, { types: [ jmespath.types.null,jmespath.types.number ] }, { types: [ jmespath.types.null,jmespath.types.string ] }, { types: [ jmespath.types.null,jmespath.types.string ] } ]
		},
		env: {
			_func: ar => {
				return getEnv(ar[0])
			},
			_signature: [ { types: [ jmespath.types.string ] } ]
		},
		envs: {
			_func: ar => {
				var _e = getEnvs()
				return Object.keys(_e).filter(k => k.match(new RegExp(ar[0]))).map(k => ({ name: k, value: _e[k] }))
			},
			_signature: [ { types: [ jmespath.types.string ] } ]
		},
		assign: {
			_func: ar => {
				$$(ar[0]).set(ar[1], ar[2])
				return ar[0]
			},
			_signature: [ { types: [ jmespath.types.any ] }, { types: [ jmespath.types.string ] }, { types: [ jmespath.types.any ] } ]
		},
		assignp: {
			_func: ar => {
				$$($path(aObj, ar[0])).set(ar[1], ar[2])
				return aObj
			},
			_signature: [ { types: [ jmespath.types.string ] }, { types: [ jmespath.types.string ] }, { types: [ jmespath.types.any ] } ]
		},
		at: {
			_func: ar => ar[0][ar[1]],
			_signature: [ { types: [ jmespath.types.array ] }, { types: [ jmespath.types.number ] } ]
		},
		random: {
			_func: ar => {
				return Math.floor(Math.random() * (ar[1] - ar[0] + 1) + ar[0])
			},
			_signature: [ { types: [ jmespath.types.number ] }, { types: [ jmespath.types.number ] } ]
		},
		srandom: {
			_func: ar => {
				return Math.floor(af.secureRandom() * (ar[1] - ar[0] + 1) + ar[0])
			},
			_signature: [ { types: [ jmespath.types.number ] }, { types: [ jmespath.types.number ] } ]
		},
		oafp: {
			_func: ar => {
				var _id = genUUID()
				var _mp = merge({ out: "key", "__key": _id }, af.fromJSSLON(ar[0]))
				loadOAFP()
				oafp(_mp)
				var _r = $get(_id)
				$unset(_id)
				return _r
			}, 
			_signature: [ { types: [ jmespath.types.string ] } ]
		},
		ojob: {
			_func: ar => {
				if (!__flags.PATH_SAFE) {
					var _res = oJob(ar[0], isString(ar[1]) ? af.fromJSSLON(ar[1]) : ar[1], __, __, true)
					return _res
				} else {
					throw "ojob is disabled due to PATH_SAFE flag"
				}
			},
			_signature: [ { types: [ jmespath.types.string ] }, { types: [ jmespath.types.any ] } ]
		},
		sh: {
			_func: ar => {
				if (!__flags.PATH_SAFE) {
					return $sh(ar[0], ar[1]).get(0)
				} else {
					throw "sh is disabled due to PATH_SAFE flag"
				}
			},
			_signature: [ { types: [ jmespath.types.string ] }, { types: [ jmespath.types.string ] } ]
		},
		sh_json: {
			_func: ar => {
				if (!__flags.PATH_SAFE) {
					return $sh(ar[0], ar[1]).getJson(0)
				} else {
					throw "sh_json is disabled due to PATH_SAFE flag"
				}
			},
			_signature: [ { types: [ jmespath.types.string ] }, { types: [ jmespath.types.string ] } ]
		},
		sh_jsslon: {
			_func: ar => {
				if (!__flags.PATH_SAFE) {
					return $sh(ar[0], ar[1]).getJsSlon(0)
				} else {
					throw "sh_jsslon is disabled due to PATH_SAFE flag"
				}
			},
			_signature: [ { types: [ jmespath.types.string ] }, { types: [ jmespath.types.string ] } ]
		},
		sh_yaml: {
			_func: ar => {
				if (!__flags.PATH_SAFE) {
					return $sh(ar[0], ar[1]).getYaml(0)
				} else {
					throw "sh_yaml is disabled due to PATH_SAFE flag"
				}
			},
			_signature: [ { types: [ jmespath.types.string ] }, { types: [ jmespath.types.string ] } ]
		},
		if: {
			_func: ar => {
				if (ar[0]) {
					return ar[1]
				} else {
					return ar[2]
				}
			},
			_signature: [ { types: [ jmespath.types.boolean ] }, { types: [ jmespath.types.any ] }, { types: [ jmespath.types.any ] } ]
		},
		ch: {
			_func: ar => {
				var ar2 = af.fromJSSLON(ar[2]), ar3 = af.fromJSSLON(ar[3])
				switch(ar[1]) {
				case "get"     : return $ch(ar[0]).get(ar2)
				case "set"     : 
					$ch(ar[0]).set(ar2, ar3)
					return ar3
				case "unset"   : 
					$ch(ar[0]).unset(ar2)
					return ar2
				case "size"    : return $ch(ar[0]).size()
				case "getAll"  : return $ch(ar[0]).getAll(ar2)
				case "getKeys" : return $ch(ar[0]).getKeys(ar2)
				case "unsetAll": return $ch(ar[0]).unsetAll(ar2, ar3)
				}
				return ar2
			},
			_signature: [ { types: [ jmespath.types.string ] }, { types: [ jmespath.types.string ] }, { types: [ jmespath.types.any ] }, { types: [ jmespath.types.any ] } ]
		}
	}, customFunctions)
	customFunctions = merge({
		path: {
			_func: (a) => $path(a[0], a[1], customFunctions),
			_signature: [ { types: [ jmespath.types.any ] }, { types: [ jmespath.types.string ] } ]
		},
		opath: {
			_func: (a) => $path(aObj, a[0], customFunctions),
			_signature: [ { types: [ jmespath.types.string ] } ]
		}
	}, customFunctions)

	if (isDef(aObj))
		return jmespath.search(aObj, aPath, customFunctions);
	else
		return jmespath.types;
};

/**
 * <odoc>
 * <key>$stream</key>
 * Shortcut for the streamjs library for easy query and access to streams of data. To see all the available options
 * please refer to https://github.com/winterbe/streamjs/blob/master/APIDOC.md.
 * </odoc>
 */
const $stream = function(a) {
	loadCompiledLib("stream_js");
	
	if (isUnDef(a)) return Stream;
	return Stream(a);
};

//Parallel processing
var __cpucores;

/**
 * <odoc>
 * <key>getNumberOfCores(realValue) : Number</key>
 * Try to identify the current number of cores on the system where the script is being executed.
 * </odoc>
 */
const getNumberOfCores = function(realValue) {
	if (isDef(__cpucores) && !realValue) return __cpucores
	plugin("Threads")

	var t = new Threads()
	var _cc = Number(t.getNumberOfCores())

	if (isUnDef(__cpucores)) __cpucores = _cc

	return _cc
}

/**
 * <odoc>
 * <key>getCPULoad(useAlternative) : Number</key>
 * Tries to obtain the current system load average (equivalent to top). If not available a negative value
 * will be returned. Optionally you can specify to use the current system load if useAlternative = true.
 * If the current system doesn't provide a load average it will fallback to the current system load.
 * </odoc>
 */
const getCPULoad = function(useAlternative) {
		if (useAlternative) {
			return Number(java.lang.management.ManagementFactory.getOperatingSystemMXBean().getSystemCpuLoad() * getNumberOfCores(true));
		} else {
		var res = Number(java.lang.management.ManagementFactory.getOperatingSystemMXBean().getSystemLoadAverage());
		if (res < 0) res = Number(java.lang.management.ManagementFactory.getOperatingSystemMXBean().getSystemCpuLoad() * getNumberOfCores(true));
		return res;
	}
}

/**
 * <odoc>
 * <key>getPid() : String</key>
 * Tries to retrieve the current script execution operating system PID and returns it.
 * </odoc>
 */
const getPid = function() {
	return (Packages.java.lang.management.ManagementFactory.getRuntimeMXBean().getName() + "").replace(/(\d+).+/, "$1");
}

/**
 * <odoc>
 * <key>addOnOpenAFShutdown(aFunction) : Boolean</key>
 * Adds aFunction to try to execute whenever OpenAF is going to shutdown. The latest hook added will be the first to be
 * executed until the first hook added (actually a shortcut for Threads.addOpenAFShutdownHook).
 * </odoc>
 */
const addOnOpenAFShutdown = function(aFunction) {
	plugin("Threads");
	try {
		(new Threads()).addOpenAFShutdownHook(function() {
			try {
				aFunction();
			} catch(e) {}
		});
		return true;
	} catch(e) {
		return false;
	}
}

/**
 * <odoc>
 * <key>pidCheck(aPid) : Boolean</key>
 * Verifies if aPid is running (returning true) or not (returning false).
 * </odoc>
 */
const pidCheck = function(aPid) {
	try {
		aPid = Number(aPid);
		if (java.lang.System.getProperty("os.name").match(/Windows/)) {
			if (af.sh("cmd /c tasklist /NH /FI \"PID eq " + aPid + "\"").match(aPid)) {
				return true;
			} 
		} else {
			if ($sh("kill -0 " + aPid).get(0).exitcode == 0) return true
		}
	} catch(e) {
	}
	
	return false;
}

/**
 * <odoc>
 * <key>pidCheckIn(aFilename) : boolean</key>
 * Uses the contents of aFilename to determine if there is an existing process running with the pid 
 * recorded on the file. If it's running it will return false, if not it will return true and record
 * the current pid on the aFilename. The function pidCheckOut will be added as a hook to run on the 
 * end of the current process. 
 * </odoc>
 */
const pidCheckIn = function(aFilename) {
	var checkPid;
	
	try {
		checkPid = io.readFileString(aFilename);
		if (isString(checkPid)) checkPid = checkPid.replace(/^(\d+)[.\n\r]*/mg, "$1");
		if (pidCheck(checkPid)) return false;
	} catch(e) {
	}
	
	io.writeFileString(aFilename, getPid());
	plugin("Threads");
	(new Threads()).addOpenAFShutdownHook(function() {
		pidCheckOut(aFilename);
	})
	return true;
}

/**
 * <odoc>
 * <key>pidKill(aPidNumber, isForce) : boolean</key>
 * Tries to terminate a process with aPidNumber. If successful it will return true otherwise it will
 * return false. If necessary, a boolean true value on isForce, will force the termination of the process.
 * </odoc>
 */
const pidKill = function(aPidNumber, isForce) {
	try {
		var force = "";
		if (java.lang.System.getProperty("os.name").match(/Windows/)) {
			if (isForce) force = "/F";
			if (af.sh("cmd /c taskkill "+ force + " /PID " + aPidNumber)) {
				return true;
			}
		} else {
			force = (isForce) ? "-9" : "-2";
			af.sh("kill " + force + " " + aPidNumber);
			if (__exitcode == 0) {
				return true;
			}
		}
	} catch(e) {
	}

	return false;
}

/**
 * <odoc>
 * <key>pidCheckOut(aFilename) : boolean</key>
 * Removes the pid information from aFilename and deletes the file if possible. 
 * If successful returns true, if not returns false. 
 * </odoc>
 */
const pidCheckOut = function(aFilename) {
	try {
		io.writeFileString(aFilename, "");
		if (io.rm(aFilename)) {
			return true;
		}
	} catch(e) {
	}
	
	return false;
}

/**
 * <odoc>
 * <key>splitArray(anArray, numberOfParts) : Array</key>
 * Returns the result of the split of anArray into equals numberOfParts (when possible).
 * If numberOfParts is not provided the current result of getNumberOfCores() will be used. 
 * </odoc>
 */
const splitArray = function(anArray, numberOfParts) {
	var res = [];
	if (isUnDef(numberOfParts)) numberOfParts = getNumberOfCores()
	
	if (numberOfParts >= anArray.length) {
		for(var i in anArray) { res.push([anArray[i]]); }
	} else {
		for(var i = 0; i < numberOfParts; i++) {
			var lower = Math.round(anArray.length/numberOfParts * i);
			var upper = Math.round(anArray.length/numberOfParts * (i+1));
			res.push(anArray.slice(lower, upper));
		}
	}
	
	return res;
}

/**
 * <odoc>
 * <key>parallel(aFunction, numThreads, aAggFunction, aControlMap) : Object</key>
 * Executes a function in a specific number of threads (each function will receive a corresponding uuid). 
 * The returned result of each function execution is kept in an array. If no aAggFunction is provided this array will
 * be returned, otherwise the array will be passed to the aAggFunction for processing and the corresponding result of
 * aAggFunction will be returned. If no numThreads is provided, the number of threads will be automatically determined.
 * Optionally you can provide a empty map as aControlMap that it will be filled with aControlMap.__threads with the 
 * threads object, the aControlMap.__numThreads for the number of threads in use and a thread __uuid list.
 * </odoc>
 */
const parallel = function(aFunction, numThreads, aAggFunction, threads) {
	plugin("Threads");

	var __threads = new Threads(), _cpucores
	_cpucores = getNumberOfCores()
	if (isUnDef(numThreads)) {
		numThreads = _cpucores + 1;
		balance = true;
	}

	if (isDef(threads)) {
		threads["__threads"]  = __threads;
		threads["__numThreads"] = numThreads;
		threads.uuids = [];
	}
	
	var __cooldown = $atomic()
	var balance = false;
	function __balance() {
		var l = getCPULoad();
		if (l > numThreads) {
			__cooldown.inc()
			while (l > numThreads && __cooldown.get() < numThreads) {
				sleep((l - numThreads) * 2000);
				l = getCPULoad();
			}
			cooldown.dec()
		}
	}
	
	var results = [];
	for(var i = 0; i < numThreads; i++) {
		var uuid = __threads.addThread(function(uuid) {
			results.push(aFunction(uuid, __threads));
			if (balance) __balance();
		});
		if (isDef(threads)) {
			threads.uuids.push(uuid);
		}
	}

	__threads.start();
	__threads.stop();

	// Aggregate results
	if(isUnDef(aAggFunction))
		return results;
	else
		return aAggFunction(results);
}

/**
 * <odoc>
 * <key>parallelArray(anArray, aReduceFunction, initValue, aAggFunction, numThreads, aControlMap) : Object</key>
 * Given anArray, divides it in subsets for processing in a specific number of threads. In each thread aReduceFunction(pr, cv, i, arr),
 * where pr = previous result, cv = current value, i = index and arr = array subset, will be executed for each value in sequence.
 * The pr value for the first execution on each thread will have the value initValue if provided. The returned result, in each thread,
 * will be placed into an array. If aAggFunction is defined, the resulting array will be passed to the aAggFunction for processing
 * and the corresponding result of aAggFunction will be returned. If no numThreads is provided, the number of threads will be 
 * automatically determined. Optionally you can provide a empty map as aControlMap that it will be filled with aControlMap.__threads
 * with the threads object, the aControlMap.__numThreads for the number of threads in use and a thread __uuid list.
 * </odoc>
 */
const parallelArray = function(anArray, aReduceFunction, initValues, aAggFunction, numThreads, threads) {
	plugin("Threads");

	if (isUnDef(anArray) || isUnDef(aReduceFunction)) {
		throw "Need an array and a function.";
	}
	
	if (!isArray(anArray)) {
		anArray = Object.keys(anArray);
		if (!isArray(anArray)) {
			throw "The object provided is not an array.";
		}
	}

	var __cooldown = 0;
	var balance = false;
	function __balance() {
		var l = getCPULoad();
		if (l > numThreads) {
			cooldown.inc()
			while (l > numThreads && cooldown.get() < numThreads) {
				sleep((l - numThreads) * 2000);
				l = getCPULoad();
			}
			cooldown.dec()
		}
	}
	
	var results = [];
	var __threads = new Threads();
	_cpucores = getNumberOfCores()
	if (isUnDef(numThreads)) {
		numThreads = _cpucores + 1;
		balance = true;
	}

	// Map it to threads
	var myMap = [];
	if (numThreads >= anArray.length) {
		for(var i in anArray) { myMap.push([anArray[i]]); }
	} else {
		for(var i = 0; i < numThreads; i++) {
			var lower = Math.round(anArray.length/numThreads * i);
			var upper = Math.round(anArray.length/numThreads * (i+1));
			myMap.push(anArray.slice(lower, upper));
		}
	}
	
	if (isDef(threads)) {
		threads["__threads"]  = __threads;
		threads["__numThreads"] = numThreads;
		threads.uuids = [];
		threads.uuidsArrayLength = {};
	}

	// Reduce it
	var xx = {};
	for(var x in myMap) {
		var uuid = __threads.addThread(function(uuid) {
			var subres = xx[uuid].reduce(aReduceFunction, initValues);
			__threads.sync(function() { results.push(subres); } );
			if (balance) __balance();
		});
		xx[uuid] = myMap[x];
		
		if (isDef(threads)) {
			threads.uuids.push(uuid); 
			threads.uuidsArrayLength[uuid] = myMap[x].length;
		}
	}

	__threads.start();
	__threads.stop();

	// Aggregate results
	if(isUnDef(aAggFunction))
		return results;
	else
		return aAggFunction(results, this);
}

/**
 * <odoc>
 * <key>parallel4Array(anArray, aFunction, numThreads, aControlMap) : Object</key>
 * Given anArray, divides it in subsets for processing in a specific number of threads. In each thread aFunction(aValue)
 * will be executed for each value in sequence. An array with all the aFunction results will be returned. If no numThreads is 
 * provided, the number of threads will be automatically determined. Optionally you can provide a empty map as aControlMap
 * that it will be filled with aControlMap.__threads with the threads object, the aControlMap.__numThreads for the number of
 * threads in use and a thread __uuid list. Example:\
 * \
 * var count = 0;\
 * var ctrl = {};\
 * var res = parallel4Array(thingsToProcess,\
 *    function(aValue) {\
 *       ctrl.__threads.sync(function() { count++; }) // Sync access to a shared variable\
 *       return processValue(aValue);\
 *    },\
 *    undefined,\
 *    ctrl\
 * );\
 * </odoc>
 */
const parallel4Array = function(anArray, aFunction, numberOfThreads, threads) {
	var res = parallelArray(anArray,
		function(p, c, ii, a) {
			var subres = aFunction(c, ii)
			return [ subres ].concat(p)
		},
		[],
		function(arr) { var res = []; for(var i in arr) { res = res.concat(arr[i]); } return res },
		numberOfThreads,
		threads
	)
	return res
}

/**
 * <odoc>
 * <key>pForEach(anArray, aFn, aErrFn, aUseSeq) : Array</key>
 * Given anArray, divides it in subsets for processing in a specific number of threads. In each thread aFn(aValue, index)
 * will be executed for each value in sequence. The results of each aFn will be returned in the same order as the original
 * array. If an error occurs during the execution of aFn, aErrFn will be called with the error. If aUseSeq is true the
 * sequential execution will be forced.\
 * \
 * Example:\
 * \
 * var res = pForEach(thingsToProcess,\
 *   function(aValue, index) {\
 *     return processValue(aValue)\
 *   },\
 *   function(e) {\
 *     printErr(e)\
 *   }
 * )\
 * </odoc>
 */
const pForEach = (anArray, aFn, aErrFn, aUseSeq) => {
	_$(anArray, "anArray").isArray().$_()
	_$(aFn, "aFn").isFunction().$_()
	aErrFn = _$(aErrFn, "aErrFn").isFunction().default(printErr)


	var fRes, times, execs, _nc, arS = anArray.length
	// If anArray is empty, just return an empty array
	if (arS == 0) return []
	// If anArray is just one element, just return it
	if (arS == 1) {
		try {
			return [ aFn(anArray[0], 0) ]
		} catch(e) {
			aErrFn(e)
			return []
		}
	} else {
		ow.loadObj()
		fRes = new ow.obj.syncArray(), times = $atomic(), execs = $atomic(0, "long"), _nc = getNumberOfCores()
	}

	const calculatePartitions = (arraySize, numThreads) => {
		const partitions = []
		const chunkSize = Math.floor(arraySize / numThreads)
		const remainder = arraySize % numThreads
		
		var start = 0
		for (var i = 0; i < numThreads; i++) {
			var end = start + chunkSize + (i < remainder ? 1 : 0)
			partitions.push({ start, end })
			start = end
		}
		return partitions
	}

	var pres = calculatePartitions(arS, _nc)
	var _ts = [], parts = $atomic(0, "long")

	// If not enough cores or if too many threads in the pool then go sequential
	var _tpstats = __getThreadPools()
	//lprint(_tpstats)
	var beSeq = aUseSeq || pres.length == 1 || _nc < 3 || __flags.PFOREACH.forceSeq || _tpstats.active / _nc > __flags.PFOREACH.seq_ratio

	const waitMs = __flags.PFOREACH.waitms
	const seqThresholdMs = __flags.PFOREACH.seq_thrs_ms
	const threads_thrs = __flags.PFOREACH.threads_thrs
	const seq_ratio = __flags.PFOREACH.seq_ratio

	const fnPar = function(ipart, part) {
		return () => {
			var _ar = []
			try {
				for (var j = part.start; j < part.end; j++) {
					try {
						var init = nowNano()
						var _R = aFn(anArray[j], j)
						times.getAdd(nowNano() - init)
						execs.inc()
						_ar.push(_R)
					} catch (ee) {
						aErrFn(ee)
						_ar.push(__)
					}
				}
				fRes.add( { i: ipart, r: _ar } )
			} catch(e) { 
				aErrFn(e)
			}
		}
	}

	for(var _i_ = 0; _i_ < pres.length; _i_++) {
		try {
			if (beSeq) {
				// Use a regular for loop for better performance
				var ar = []
				for (var j = pres[_i_].start; j < pres[_i_].end; j++) {
					try {
						var init = nowNano()
						var _R = aFn(anArray[j], j)
						times.getAdd(nowNano() - init)
						execs.inc()
						ar.push(_R)
					} catch (ee) {
						aErrFn(ee)
						ar.push(__)
					}
				}
				fRes.add( { i: _i_, r: ar } )
				parts.inc()
			} else {
				_ts.push( $do( fnPar(_i_, pres[_i_]) ).then(() => parts.inc() ).catch(derr => { parts.inc(); aErrFn(derr) } ) )
				
				// Cool down and go sequential if too many threads
				_tpstats = __getThreadPools()
				if (_tpstats.queued > _tpstats.poolSize / threads_thrs) {
					$doWait(_ts.pop())
				}
			}
		} catch(eee) {
			aErrFn(eee) 
		} finally {
			// If execution time per call is too low, go sequential
			if ( typeof aUseSeq === "undefined" && pres.length > 1 && _nc >= 3 ) {
				if ( ((times.get() / execs.get() ) / 1000000) < seqThresholdMs || __getThreadPools().active / _nc > seq_ratio) {
					beSeq = true
				} else {
					beSeq = false
				}
			}
		}
	}

	var tries = 0
	do {
		$doWait($doAll(_ts))
		if (parts.get() < pres.length) sleep(__getThreadPools().queued * waitMs, true)
		tries++
	} while(parts.get() < pres.length && tries < 100)

	var res = []
	fRes.toArray().sort((a, b) => a.i - b.i).forEach(rs => {
		res = res.concat(rs.r)
	})
	fRes.clear()
	fRes = __

	return res
}

/** 
 * <odoc>
 * <key>compress(anObject) : ArrayOfBytes</key>
 * Compresses a JSON object into an array of bytes suitable to be uncompressed using the uncompress function.
 * </odoc>
 */
const compress = function(anObject) {
	return io.gzip(af.fromString2Bytes(stringify(anObject, __, "")));
}

/**
 * <odoc>
 * <key>uncompress(aResultOfTheCompressFunction) : Object</key>
 * Uncompresses a JSON object, compressed by using the compress function, into a JSON object.
 * </odoc>
 */
const uncompress = function(aCompressedObject) {
	return JSON.parse(af.fromBytes2String(io.gunzip(aCompressedObject)));
}

/**
 * <odoc>
 * <key>isArray(aObj) : boolean</key>
 * Returns true if aObj is an array, false otherwise.
 * </odoc>
 */
const isArray = Array.isArray

/**
 * <odoc>
 * <key>isMap(aObj) : boolean</key>
 * Returns true if aObj is a map, false otherwise.
 * </odoc>
 */
const isMap = a => (Object.prototype.toString.call(a) == "[object Object]")

/**
 * <odoc>
 * <key>isObject(aObj) : boolean</key>
 * Returns true if aObj is an object, false otherwise;
 * </odoc>
 */
const isObject = obj => {
	var type = typeof obj
	return type === 'function' || type === 'object' && !!obj
}

/**
 * <odoc>
 * <key>isFunction(aObj) : boolean</key>
 * Returns true if aObj is a function, false otherwise;
 * </odoc>
 */
const isFunction = obj => typeof obj == 'function' || false

/**
 * <odoc>
 * <key>isString(aObj) : boolean</key>
 * Returns true if aObj is a string, false otherwise
 * </odoc>
 */
const isString = obj => typeof obj == 'string' || false

/**
 * <odoc>
 * <key>isNumber(aObj) : boolean</key>
 * Returns true if aObj can be a number, false otherwise
 * </odoc>
 */
const isNumber = obj => !isNaN(parseFloat(obj)) && isFinite(obj)

/**
 * <odoc>
 * <key>isInteger(aObj) : boolean</key>
 * Returns true if aObj doesn't have a decimal component.
 * </odoc>
 */
const isInteger = obj => isNumber(obj) && Number.isSafeInteger(obj)

/**
 * <odoc>
 * <key>isDecimal(aObj) : boolean</key>
 * Returns true if aObj has a decimal component.
 * </odoc>
 */
const isDecimal = obj => isNumber(obj) && !isInteger(obj)

/**
 * <odoc>
 * <key>isTNumber(aObj) : boolean</key>
 * Returns true if aObj is of type number, false otherwise
 * </odoc>
 */
const isTNumber = obj => typeof obj === "number"

/**
 * <odoc>
 * <key>isDate(aObj) : boolean</key>
 * Returns true if aObj is a date, false otherwise
 * </odoc>
 */
const isDate = obj => (null != obj) && !isNaN(obj) && ("undefined" !== typeof obj.getDate)
/**
 * <odoc>
 * <key>isBoolean(aObj) : boolean</key>
 * Returns true if aObj is boolean, false otherwise
 * </odoc>
 */
const isBoolean = obj => typeof obj == 'boolean' || false

/**
 * <odoc>
 * <key>isNull(aObj) : boolean</key>
 * Returns true if aObj is null, false otherwise
 * </odoc>
 */
const isNull = obj => obj == null || false

/**
 * <odoc>
 * <key>isByteArray(aObj) : boolean</key>
 * Returns true if aObj is a byte array object, false otherwise.
 * </odoc>
 */
const isByteArray = function(obj) {
	try {
		return (isDef(obj.getClass) && (obj.getClass().getName() == "byte[]" || obj.getClass().getTypeName() == "byte[]"))
	} catch(e) {
		return false
	}
}

/**
 * <odoc>
 * <key>isUUID(aObj) : boolean</key>
 * Returns true if aObj is an UUID.
 * </odoc>
 */
const isUUID = function(obj) {
	if (isString(obj) && obj.match(/^\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b$/)) {
		return true;
	} else {
		return false;
	}
}

/**
 * <odoc>
 * <key>descType(aObject) : String</key>
 * Given aObject will try to return the apparent type withing: undefined, null, bytearray,
 * javaclass, java, boolean, array, number, string, function, date, map and object.
 * </odoc>
 */
const descType = function(aObj) {
	if (isUnDef(aObj)) return "undefined"
	if (isNull(aObj)) return "null"
	if (isByteArray(aObj)) return "bytearray"
	if (isJavaClass(aObj)) return "javaclass"
	if (isJavaObject(aObj)) return "java"
	if (isBoolean(aObj)) return "boolean"
	if (isArray(aObj)) return "array"
	if (isNumber(aObj)) return "number"
	if (isString(aObj)) return "string"
	if (isFunction(aObj)) return "function"
	if (isDate(aObj)) return "date"
	if (isMap(aObj)) return "map"
	if (isObject(aObj)) return "object"
}

/**
 * <odoc>
 * <key>toBoolean(aObj) : Boolean</key>
 * Tries to convert aObj (String, Number or Boolean) into a boolean value
 * </odoc>
 */
const toBoolean = function(aObj) {
	if (isBoolean(aObj)) return aObj;
	if (isNumber(aObj)) return Boolean(aObj);
	if (isString(aObj)) return (aObj.trim().toLowerCase() == 'true');
	return aObj;
}

/**
 * <odoc>
 * <key>loadLib(aLib, forceReload, aFunction) : boolean</key>
 * Loads the corresponding javascript library and keeps track if it was already loaded or not (in __loadedLibs).
 * Optionally you can force reload and provide aFunction to execute after the successful loading.
 * Returns true if successfull, false otherwise.
 * </odoc>
 */
var __loadedLibs;
if (isUnDef(__loadedLibs)) __loadedLibs = {};
const loadLib = function(aLib, forceReload, aFunction) {
	if (forceReload ||
		isUnDef(__loadedLibs[aLib.toLowerCase()]) || 
		__loadedLibs[aLib.toLowerCase()] == false) {
		load(aLib, (__flags.OAF_PRECOMPILE_LEVEL >= 2 ? true : false));
		__loadedLibs[aLib.toLowerCase()] = true;
		if (isDef(aFunction)) aFunction();
		return true;
	}
	
	return false;
}

/**
 * <odoc>
 * <key>loadCompiledLib(aLibClass, forceReload, aFunction, withSync) : boolean</key>
 * Loads the corresponding compiled javascript library class and keeps track if it was already loaded or not (in __loadedLibs).
 * Optionally you can force reload and provide aFunction to execute after the successful loading.
 * Returns true if successfull, false otherwise.
 * </odoc>
 */
const loadCompiledLib = function(aClass, forceReload, aFunction, withSync) {
	if (forceReload ||
		isUnDef(__loadedLibs[aClass.toLowerCase()]) || 
		__loadedLibs[aClass.toLowerCase()] == false) {
		if (withSync) {
			sync(() => {
				af.runFromClass(af.getClass(aClass).newInstance())
				__loadedLibs[aClass.toLowerCase()] = true
			}, __loadedLibs)
		} else {
			af.runFromClass(af.getClass(aClass).newInstance())
			__loadedLibs[aClass.toLowerCase()] = true
		}
		if (isDef(aFunction)) aFunction()
		return true
	}
	
	return false;
}

const loadCompiledRequire = function(aClass, forceReload, aFunction) {
	if (forceReload ||
		isUnDef(__loadedLibs[aClass.toLowerCase()]) || 
		__loadedLibs[aClass.toLowerCase()] == false) {		
		af.runFromClass(af.getClass(aClass).newInstance());
		var exp = {}, mod = { id: aClass, uri: aClass, exports: exp };
		global["__" + aClass](loadCompiledRequire, exp, mod);
		//exp = mod.exports || exp;
		__loadedLibs[aClass.toLowerCase()] = true;
		if (isDef(aFunction)) aFunction(mod.exports);
		return mod.exports;
	} else {
		var exp = {}, mod = { id: aClass, uri: aClass, exports: exp };
		global["__" + aClass](loadCompiledRequire, exp, mod);
		//exp = mod.exports || exp;
	
		return mod.exports;
	}
}

/**
 * <odoc>
 * <key>sync(aFunction, anObject)</key>
 * Will ensure that aFunction is synchronized, in multi-threaded scripts. Optionally you can provide
 * anObject to synchronized upon.
 * </odoc>
 */
const sync = function(aFunction, anObj) {
	var foundException = false;
	var exception;
	
	af.sync(function() {
		try {
			aFunction();
		} catch(e) {
			foundException = true;
			exception = e;
		}
	}, anObj)();
	
	if (foundException) throw exception;
}

/**
 * <odoc>
 * <key>syncFn(aFunction, anObject) : Object</key>
 * Will ensure that aFunction is synchronized, in multi-threaded scripts (alternative to sync). Optionally you can provide
 * anObject to synchronized upon. Returns the result of aFunction.
 * </odoc>
 */
const syncFn = function(aFunction, anObj) {
   var foundException = false, exception;

   var r = new Packages.org.mozilla.javascript.Synchronizer(function() { 
	  try { 
		 return aFunction();
	  } catch(e) {
		 foundException = true;
		 exception = e;
	  }
   }, anObj)();

   if (foundException) throw exception;
   return r;
}


//FROM https://github.com/gmac/pods.js
//BEGIN ------------------------------

//pods.js
//Tiny managers for module definition and dependency management.
//(c) 2012-2014 Greg MacWilliam.
//Freely distributed under the MIT license.

//Pod instance constructor function:
function Pod(name) {
	this.name = name;
	this._m = {};
}

//Pod static instance store:
Pod._m = {};

/**
 * <odoc>
 * <key>pods.define(aId, aDepsArray, aFactoryFunction)</key>
 * Defines a new module given aId, aDepsArray with depend id modules and a factory function.
 * </odoc>
 */
//Defines a new module.
//@param String id: the reference id for the module.
//@param Array deps: an optional array of dependency ids.
//@param Function factory: a factory function or exports object for the module.
Pod.define = function (id, deps, factory) {
	// Resolve dependency array:
	if (!(deps instanceof Array)) {
		factory = deps;
		deps = [];
	}
	
	// Error if id or factory were not provided:
	if (!id || !factory) {
		throw ('invalid definition');
	}
	
	// Resolve exports as a factory function:
	if (typeof factory != 'function') {
		var exports = factory;
		factory = function () {
			return exports;
		};
	}
	
	// Set new module definition:
	this._m[id] = {
		d: deps,
		f: factory
	};
	
	return this;
};

/**
 * <odoc>
 * <key>pods.declare(aId, exports)</key>
 * Declares a new module, aId, as the provided exports literal.
 * </odoc>
 */
//Declares a new module as the provided exports literal:
//Signature 1:
//@param String id: reference id of the module.
//@param Object exports: an object of any type to be assigned to the specified id.
//Signature 2:
//@param Object definitions: an object of key-value pairs to define as modules.
Pod.declare = function (id, exports) {
	var defs = id;
	
	if (typeof id == 'string') {
		defs = {};
		defs[id] = exports;
	}
	
	function factory(exports) {
		return function () {
			return exports;
		};
	}
	
	for (id in defs) {
		if (defs.hasOwnProperty(id)) {
			this.define(id, factory(defs[id]));
		}
	}
	return this;
};

/**
 * <odoc>
 * <key>pods.require(aIds, aCallbackFunction)</key>
 * Requires a module or a list of modules and all of its dependencies. Optionally you can provide
 * aCallbackFunction to inject the required modules into.
 * </odoc>
 */
//Requires a module. This fetches the module and all of its dependencies.
//@param String/Array req: the id (or list of ids) to require.
//@param Function callback: an optional callback to inject the required modules into.
Pod.require = function (req, callback) {
	var single = !(req instanceof Array);
	
	// Wrap a single dependency definition in an array.
	req = single ? [req] : req.slice();
	
	for (var i = 0; i < req.length; i++) {
		var id = req[i];
	
		if (this._m.hasOwnProperty(id)) {
			// Known module reference:
			// Pull module definition from key table.
			var mod = this._m[id];
	
			// If the module has no existing export,
			// Resolve dependencies and create module. 
			if (!mod.e) {
				// If module is active within the working dependency path chain,
				// throw a circular reference error.
				if (mod._) throw ('circular reference to ' + id);
	
				// Flag module as active within the path chain.
				mod._ = 1;
	
				// Run factory function with recursive require call to fetch dependencies:
				mod.e = mod.f.apply(null, this.require(mod.d));
	
				// Release module from the active path.
				mod._ = 0;
			}
	
			// Replace dependency reference with the resolved module.
			req[i] = mod.e;
		} else if (id === this.name || id === 'pod') {
			// Pod self-reference:
			req[i] = this;
		} else {
			// Error for undefined module references.
			throw (id + ' is undefined');
		}
	}
	
	// If a callback function was provided,
	// Inject dependency array into the callback.
	if (typeof callback == 'function') {
		callback.apply(null, req);
	}
	
	// If directly referenced by ID, return module.
	// otherwise, return array of all required modules.
	return single ? req[0] : req;
};

//Extend static methods to all instances:
Pod.prototype = {
	define: Pod.define,
	declare: Pod.declare,
	require: Pod.require
};

var pods;
if (isUnDef(pods)) pods = new Pod();

//FROM https://github.com/gmac/pods.js
//END --------------------------------

/**
 * 
 * loadRequire(anArrayOfPaths, useSandbox)
 * Will add the require function to the current scope. The require function optionally use anArrayOfPaths
 * to search for scripts. If anArrayOfPaths is not provided all opack directories and current working directory will be 
 * used. Optionally you can also useSandbox = true to ensure that require loading is "sandboxed". 
 *
 */
/*function loadRequire(paths, useSandbox) {
	function toURI(aPath) {
		return String(new java.io.File(aPath).toURI().toURL().toExternalForm());
	}
	
	if (isUnDef(paths)) {
		paths = [];
		var opackpaths = getOPackPaths(); 
		for(var opack in opackpaths) {
			paths.push(toURI(opackpaths[opack]));
		}
		paths.push(toURI(java.lang.System.getProperty("user.dir")));
	}
	
	af.loadRequire(paths, useSandbox);
}
loadRequire();
*/

/**
 * <odoc>
 * <key>require(aScript) : Object</key>
 * Will try to load aScript from the directories specified in the loadRequire function (by default all opack directories
 * plus the current working directory). Returns the exports object manipulated in aScript (note: results are cached)
 * </odoc>
 */
const require = function(aScript, force) {
	var o, f, exports = {}, module = { id: aScript, uri: aScript, exports: exports };
	
	if (isUnDef(require.cache)) require.cache = {};

	if (!force && isFunction(require.cache[aScript])) {
		f = require.cache[aScript];
	} else {	
		var fPath = aS => {
			if (!io.fileExists(aS)) {
				var origScript = String(aS)
				for(var opack in getOPackPaths()) {
					if (opack != "OpenAF") {
						var path = getOPackPath(opack) + "/" + origScript
						if (io.fileExists(path)) {
							aS = path
						}
					}
				}
			}
			return aS
		}

		if (aScript.match(/::/)) {
			var comps = aScript.match(/(.+)::(.+)/);
			plugin("ZIP");
			var zip = new ZIP();
			o = af.fromBytes2String(zip.streamGetFile(fPath(comps[1]), comps[2]));
		} else {	
			o = io.readFileString(fPath(aScript));
		}
		
		if (isUnDef(o)) throw "Couldn't load '" + aScript + "'"
		o = ";" + o
		__codeVerify(o, aScript)
		if (!__flags.OAF_CLOSED) o = __loadPreParser(o)
		f = new Function('require', 'exports', 'module', o);
		require.cache[aScript] = f;
	}

	f.call({}, require, exports, module);

	//exports = module.exports || exports;
	
	return module.exports;
}

// OpenWrap
//

var OpenWrap = function() {}
//if (isUnDef(OpenWrap))
//	OpenWrap = function() {}

//if (isUnDef(ow))
//	ow = new OpenWrap();

/**
 * <odoc>
 * <key>ow.loadDebug()</key>
 * Loads OpenWrap debug functionality.
 * </odoc>
 */
OpenWrap.prototype.loadDebug = function() { loadCompiledLib("owrap_debug_js"); if (isUnDef(ow.debug)) { ow.debug = new OpenWrap.debug(); /*pods.declare("ow.debug", ow.debug);*/ }; return ow.debug; };
/**
 * <odoc>
 * <key>ow.loadDev()</key>
 * Loads OpenWrap dev functionality. Basically functions being tested.
 * </odoc>
 */
OpenWrap.prototype.loadDev = function() { loadCompiledLib("owrap_dev_js"); if (isUnDef(ow.dev)) { ow.dev = new OpenWrap.dev(); /*pods.declare("ow.dev", ow.dev);*/ }; return ow.dev; };
/**
 * <odoc>
 * <key>ow.loadNet()</key>
 * Loads OpenWrap net functionality. Basically functions for net.
 * </odoc>
 */
OpenWrap.prototype.loadNet = function() { loadCompiledLib("owrap_net_js"); if (isUnDef(ow.net)) { ow.net = new OpenWrap.net(); /*pods.declare("ow.net", ow.net);*/ }; return ow.net; };
/**
 * <odoc>
 * <key>ow.loadSec()</key>
 * Loads OpenWrap sec functionality. Basically functions for sec.
 * </odoc>
 */
OpenWrap.prototype.loadSec = function() { loadCompiledLib("owrap_sec_js"); if (isUnDef(ow.sec)) { ow.sec = new OpenWrap.sec(); /*pods.declare("ow.sec", ow.sec);*/ }; return ow.sec; };
/**
 * <odoc>
 * <key>ow.loadFormat()</key>
 * Loads OpenWrap format functionality. Basically functions to help with the formatting of strings, numbers, dates, etc...
 * </odoc>
 */
//OpenWrap.prototype.loadFormat = function() { loadLib(getOpenAFJar() + "::js/owrap.format.js"); ow.format = new OpenWrap.format(); pods.declare("ow.format", ow.format); return ow.format; }
OpenWrap.prototype.loadFormat = function() { loadCompiledLib("owrap_format_js"); if (isUnDef(ow.format)) { ow.format = new OpenWrap.format(); /*pods.declare("ow.format", ow.format);*/ }; return ow.format; };
/**
 * <odoc>
 * <key>ow.loadTest()</key>
 * Loads OpenWrap test functionality. Basically functions to unit test other functionality.
 * </odoc>
 */
//OpenWrap.prototype.loadTest = function() { loadLib(getOpenAFJar() + "::js/owrap.test.js"); ow.test = new OpenWrap.test(); pods.declare("ow.test", ow.test); return ow.test; }
OpenWrap.prototype.loadTest = function() { loadCompiledLib("owrap_test_js"); if (isUnDef(ow.test)) { ow.test = new OpenWrap.test(); /*pods.declare("ow.test", ow.test);*/ }; return ow.test; };
/**
 * <odoc>
 * <key>ow.loadAI()</key>
 * Loads OpenWrap AI functionality.
 * </odoc>
 */
//OpenWrap.prototype.loadAI = function() { loadLib(getOpenAFJar() + "::js/owrap.ai.js"); ow.ai = new OpenWrap.ai(); pods.declare("ow.ai", ow.ai); return ow.ai; }
OpenWrap.prototype.loadAI = function() { loadCompiledLib("owrap_ai_js"); if (isUnDef(ow.ai)) { ow.ai = new OpenWrap.ai(); /*pods.declare("ow.ai", ow.ai);*/ }; return ow.ai; };
/**
 * <odoc>
 * <key>ow.loadServer()</key>
 * Loads OpenWrap Server functionality. Basically functions to wrap access to server functionality.
 * </odoc>
 */
//OpenWrap.prototype.loadServer = function() { loadLib(getOpenAFJar() + "::js/owrap.server.js"); ow.server = new OpenWrap.server(); pods.declare("ow.server", ow.server); return ow.server; }
OpenWrap.prototype.loadServer = function() { loadCompiledLib("owrap_server_js"); if (isUnDef(ow.server)) { ow.server = new OpenWrap.server(); /*pods.declare("ow.server", ow.server);*/ }; return ow.server; };
/**
 * <odoc>
 * <key>ow.loadMetrics()</key>
 * Loads OpenWrap Metrics functionality. Basically functions to wrap access to server functionality.
 * </odoc>
 */
//OpenWrap.prototype.loadMetrics = function() { loadLib(getOpenAFJar() + "::js/owrap.server.js"); ow.server = new OpenWrap.server(); pods.declare("ow.server", ow.server); return ow.server; }
OpenWrap.prototype.loadMetrics = function() { loadCompiledLib("owrap_metrics_js"); if (isUnDef(ow.metrics)) { ow.metrics = new OpenWrap.metrics(); /*pods.declare("ow.metrics", ow.metrics);*/ }; return ow.metrics; };
/**
 * <odoc>
 * <key>ow.loadPython()</key>
 * Loads OpenWrap Python functionality.
 * </odoc>
 */
//OpenWrap.prototype.loadPython = function() { loadLib(getOpenAFJar() + "::js/owrap.server.js"); ow.server = new OpenWrap.server(); pods.declare("ow.server", ow.server); return ow.server; }
OpenWrap.prototype.loadPython = function() { loadCompiledLib("owrap_python_js"); if (isUnDef(ow.python)) { ow.python = new OpenWrap.python(); /*pods.declare("ow.python", ow.python);*/ }; return ow.python; };
/**
 * <odoc>
 * <key>ow.loadTemplate()</key>
 * Loads OpenWrap template functionality. Basically functions to wrap access to Handlebars functionality.
 * </odoc>
 */
//OpenWrap.prototype.loadTemplate = function() { loadLib(getOpenAFJar() + "::js/owrap.template.js"); ow.template = new OpenWrap.template(); pods.declare("ow.template", ow.template); return ow.template; }
OpenWrap.prototype.loadTemplate = function() { loadCompiledLib("owrap_template_js"); if (isUnDef(ow.template)) { ow.template = new OpenWrap.template(); /*pods.declare("ow.template", ow.template);*/ }; return ow.template; };
/**
 * <odoc>
 * <key>ow.loadObj()</key>
 * Loads OpenWrap object functionality. 
 * </odoc>
 */
//OpenWrap.prototype.loadObj = function() { loadLib(getOpenAFJar() + "::js/owrap.obj.js"); ow.obj = new OpenWrap.obj(); pods.declare("ow.obj", ow.obj); return ow.obj; }
OpenWrap.prototype.loadObj = function() { loadCompiledLib("owrap_obj_js"); if (isUnDef(ow.obj)) { ow.obj = new OpenWrap.obj(); /*pods.declare("ow.obj", ow.obj);*/ }; return ow.obj; };
/**
 * <odoc>
 * <key>ow.loadCh()</key>
 * Loads OpenWrap channels functionality. 
 * </odoc>
 */
//OpenWrap.prototype.loadCh = function() { loadLib(getOpenAFJar() + "::js/owrap.ch.js"); ow.ch = new OpenWrap.ch(); pods.declare("ow.ch", ow.ch); return ow.ch; }
OpenWrap.prototype.loadCh = function() { loadCompiledLib("owrap_ch_js"); if (isUnDef(ow.ch)) { ow.ch = new OpenWrap.ch(); /*pods.declare("ow.ch", ow.ch);*/ }; return ow.ch; };
/**
 * <odoc>
 * <key>ow.loadOJob()</key>
 * Loads OpenWrap oJob functionality. 
 * </odoc>
 */
//OpenWrap.prototype.loadOJob = function() { loadLib(getOpenAFJar() + "::js/owrap.oJob.js"); ow.oJob = new OpenWrap.oJob(); pods.declare("ow.oJob", ow.oJob); return ow.oJob; }
OpenWrap.prototype.loadOJob = function() { loadCompiledLib("owrap_oJob_js"); if (isUnDef(ow.oJob)) { ow.oJob = new OpenWrap.oJob(); /*pods.declare("ow.oJob", ow.oJob);*/ }; return ow.oJob; };
/**
 * <odoc>
 * <key>ow.loadOBook()</key>
 * Loads OpenWrap oBook functionality. 
 * </odoc>
 */
OpenWrap.prototype.loadOBook = function() { loadCompiledLib("owrap_oBook_js"); if (isUnDef(ow.oBook)) { ow.oBook = new OpenWrap.oBook(); /*pods.declare("ow.oBook", ow.oBook)*/ }; return ow.oBook }
/**
 * <odoc>
 * <key>ow.loadJava()</key>
 * Loads OpenWrap Java functionality. 
 * </odoc>
 */
OpenWrap.prototype.loadJava = function() { loadCompiledLib("owrap_java_js"); if (isUnDef(ow.java)) { ow.java = new OpenWrap.java(); /*pods.declare("ow.java", ow.java);*/ }; return ow.java; };

var ow = new OpenWrap()

/**
 * <odoc>
 * <key>loadHandlebars()</key>
 * Loads the Handlebars javascript library into scope. Example:\
 * \
 * loadHandlebards();\
 * var source = "&lt;m&gt;{{#each lines}}\t&lt;s name=\"{{key}}\"&gt;{{value}}&lt;/s&gt;\n{{/each}}\n&lt;/m&gt;";\
 * var data = { "lines": [ { "name": "n1", "value": "v1" }, { "name": "n2", "value": "v2" } ] };\
 * var template = Handlebars.compile(source);\
 * print(template(data));\
 * data.lines.push({"name": "n3", "value": "v3"});\
 * print(template(data));\
 * \
 * See more documentation in: http://handlebarsjs.com/\
 * \
 * </odoc>
 */
const loadHandlebars = function() {
	var res = loadCompiledLib("handlebars_js");
	if (res) pods.declare("Handlebars", loadHandlebars());
}

/**
 * <odoc>
 * <key>loadUnderscore()</key>
 * Loads the Underscore javascript library into scope (using the loadash alternative).\
 * \
 * See more in: http://underscorejs.org and https://lodash.com/docs
 * </odoc>
 */
const loadUnderscore = function() {
	/*var res = loadCompiledLib("lodash_js");
	if (res) pods.declare("Underscore", loadUnderscore());
	if (res) pods.declare("Lodash", loadUnderscore());*/
	try {
		loadCompiledLib("lodash_js");
	} catch(e) {
		loadLib(getOpenAFJar() + "::js/lodash.js");
	}
}

/**
 * <odoc>
 * <key>loadFuse()</key>
 * Loads the FuseJS javascript library into scope.\
 * \
 * See more in: http://fusejs.io/
 * </odoc>
 */
const loadFuse = function() {
	var res = loadCompiledLib("fusejs_js");
	if (res) pods.declare("FuseJS", loadFuse());
}

/**
 * <odoc>
 * <key>loadDiff()</key>
 * Loads the JsDiff javascript library into scope (check https://github.com/kpdecker/jsdiff).
 * </odoc>
 */
const loadDiff = function() {
	var res = loadCompiledLib("diff_js");
	global.JsDiff = global.Diff;
	if (res) pods.declare("JsDiff", loadDiff());
}

const loadAjv = function() {
	var res = loadCompiledLib("ajv_js");
	if (res) pods.declare("Ajv", loadAjv());
}

/**
 * <odoc>
 * <key>loadLodash()</key>
 * Loads the loadash javascript library.\
 * \
 * See more in https://lodash.com/docs
 * </odoc>
 */
const loadLodash = function() {
	loadUnderscore();
}

/**
 * <odoc>
 * <key>loadHelp()</key>
 * Loads into scope the ODoc objects for documentation support.
 * </odoc>
 */
const loadHelp = function() {
	var res = loadCompiledLib("odoc_js");
	if (res) pods.declare("Help", loadHelp());
}

var __odocsurl;
if (isUnDef(__odocsurl)) __odocsurl = __odoc;
var __odocs, __odocsfiles = [];
var __offlineHelp;
if (isUnDef(__offlineHelp)) {
	/*if (noHomeComms)
		__offlineHelp = true;
	else
		__offlineHelp = false;*/
	__offlineHelp = true;
}


/**
 * <odoc>
 * <key>setOfflineHelp(aBoolean)</key>
 * Forces help (odoc) to be retrieved locally (if aBoolean is true) or reestablishes the normal behaviour
 * of retrieving from online first (if aBoolean is false)
 * </odoc>
 */
const setOfflineHelp = function(aBoolean) {
	__offlineHelp = aBoolean;
	if (isDef(__odocs)) __odocs = undefined; //__odocs.offline = __offlineHelp;
}

/**
 * <odoc>
 * <key>searchHelp(aTerm, aPath, anArrayOfIds) : Map</key>
 * Searches the OpenAF ODoc help system for a specific term. Optionally you can provide a path of where to 
 * search for ODoc help files. If an exact match is found the function will return an array with a single
 * a map with the corresponding ODoc id, key, fullkey and text. If no exact match is found the function will
 * return an array of alternative matches or an empty array if no alternatives are found. Optionally you can
 * also restrict by anArrayOfIds.
 * </odoc>
 */
const searchHelp = function(aTerm, aPath, aId) {
	loadHelp();

	if (isUnDef(__odocs)) __odocs = new ODocs(__, __, __odocsurl, __offlineHelp);
	if (isDef(aPath)) __odocs.loadFile(aPath);
	var keys = __odocs.search(aTerm, aId);

	if (keys.length != 1) {
		var newloaded = false;
		var paths = [ getOpenAFJar() ];
		try {
			paths = paths.concat(Object.keys(getOPackLocalDB()));
		} catch(e) {
		}
		paths.forEach(path => {
			if (!(path.match(/\.(jar|db|zip)/))) path += "/";
			if (__odocsfiles.indexOf(path) < 0) {
				__odocs.loadFile(path);
				__odocsfiles.push(path);
				newloaded = true;
			}
		});

		// Try again now with the extra odocs loaded
		if (newloaded) keys = __odocs.search(aTerm, aId);
	}
	
	if (keys.length == 1) {
		var contents = __odocs.get(keys[0].id, keys[0].key);
		return [ {
			"id": keys[0].id,
			"key": keys[0].key,
			"fullkey": contents.k,
			"text": contents.t
		} ];
	} else {
		keys = keys.sort(function(a, b) { return (a.key.toLowerCase() > b.key.toLowerCase()) ? 1 : -1; });
	}
	return uniqArray(keys);
}

/**
 * <odoc>
 * <key>saveHelp(aPath, aMapOfFiles)</key>
 * Given aMapOfFiles, or basically an array of JavaScript or Java source filenames, each file will 
 * be processed for ODoc XML tags and the corresponding ODoc database will be generated on the 
 * provided aPath suitable for offline use.
 * </odoc>
 */
const saveHelp = function(aPath, aMapOfFiles) {
	loadHelp();
	
	var odgen = new ODocsGen(aMapOfFiles);
	var odsave = new ODocs(aPath + "/", odgen.getODoc());
	odsave.save();
}

/**
 * <odoc>
 * <key>saveHelpWeb(aPath, aMapOfFiles)</key>
 * Given aMapOfFiles, or basically an array of JavaScript or Java source filenames, each file will 
 * be processed for ODoc XML tags and the corresponding ODoc database will be generated on the 
 * provided aPath suitable for online use.
 * </odoc>
 */
const saveHelpWeb = function(aPath, aMapOfFiles) {
	loadHelp();
	
	var odgen = new ODocsGen(aMapOfFiles);
	var odsave = new ODocs(aPath, odgen.getODoc());
	odsave.saveWeb();
}

// InMem DB HELP functions

/**
 * <odoc>
 * <key>createDBInMem(aName, dontClose, aLogin, aPass, inMemFileSystem, inMemCompressed, useNIO) : DB</key>
 * Creates a DB object instantiated with an in-memory database for the given name. Optionally you can 
 * specify that you don't want it to close on db.close (but all data will be lost on exiting OpenAF).
 * Optionally you can also specify aLogin and aPass. This is a H2 database so do check more documentation
 * on http://www.h2database.com/. 
 * Also optionally you can specify if you want the in-memory database to be file based (inMemFileSystem) which 
 * is slower than normal; to be compressed (inMemCompressed) which is slower than normal and inMemFileSystem;
 * to store data outside the VM's heap (useNIO). Do note that if inMemFileSystem and inMemCompressed are selected
 * only inMemCompressed will be used. And useNIO will only affect inMemFileSystem or inMemCompressed options.
 * </odoc>
 */
const createDBInMem = function(aName, dontClose, aLogin, aPass, inMemFileSystem, inMemCompressed, useNIO) {
	var suffix = (dontClose) ? ";DB_CLOSE_DELAY=-1" : "";
	var login = (isUnDef(aLogin)) ? "sa" : aLogin;
	var pass = (isUnDef(aPass)) ? "sa" : aPass;
	var type = "mem";
	if (inMemFileSystem) type = "memFS";
	if (inMemCompressed) type = "memLZF";
	if ((inMemFileSystem || inMemCompressed) && useNIO) type = "nio" + type.replace(/mem/, "Mem");
	
	return new DB("org.h2.Driver", "jdbc:h2:" + type + ":" + aName, login, pass);
}

/**
 * <odoc>
 * <key>createDBServer(aFile, aPort, aLogin, aPass) : DB</key>
 * Creates a DB object instantiated with a server based H2 database, on the provided aPort (defaults to 9090), for the aFile provided. Optionally you can use
 * aLogin and aPass(word).
 * </odoc>
 */
const createDBServer = function(aFile, aPort, aLogin, aPass) {
	aPort = _$(aPort).isNumber().default(9090);
	aFile = _$(aFile).isString().$_("Please provide a filename");

	return new DB("org.h2.Driver", "jdbc:h2:" + aFile + ";AUTO_SERVER=TRUE;AUTO_SERVER_PORT=" + aPort, aLogin, aPass);
};

/**
 * <odoc>
 * <key>createDB(aFile, aLogin, aPass) : DB</key>
 * Creates a DB object instantiated with a file based H2 database for the aFile provided. Optionally you can use
 * aLogin and aPass(word).
 * </odoc>
 */
const createDB = function(aFile, aLogin, aPass) {
	aFile = _$(aFile).isString().$_("Please provide a filename");
	return new DB("org.h2.Driver", "jdbc:h2:" + io.getCanonicalPath(aFile), aLogin, aPass);
};

/**
 * <odoc>
 * <key>showH2Console() : Console</key>
 * Instantiates and returns a H2 Console object openning a browser (if possible) to interact with the H2 Console. With 
 * the returned object you can later invoke .shutdown() or unload it from the console. Invoking a second time will result in
 * a port bind error since it the first instance wasn't shutdown.
 * </odoc>
 */
const showH2Console = function() {
	var o = new Packages.org.h2.tools.Console();
	o.runTool();
	return o;
};

/**
 * <odoc>
 * <key>persistDBInMem(aDB, aFilename) : Array</key>
 * Tries to persist a in-memory database, aDB object, previously created by the function createDBInMem into a SQL aFilename.
 * This can later be used to load again using the loadDBInMem function.
 * </odoc>
 */
const persistDBInMem = function(aDB, aFilename) {
	return aDB.q("script to '" + aFilename + "'");
}

/**
 * <odoc>
 * <key>loadDBInMem(aDB, aFilename)</key>
 * Tries to load to a in-memory database, aDB object, previously created by the function createDBInMem from a SQL aFilename
 * probably created by the function persistDBInMem.
 * </odoc>
 */
const loadDBInMem = function(aDB, aFilename) {
	return aDB.u("runscript from '" + aFilename + "'");
}

/**
 * <odoc>
 * <key>traverse(aObject, aFunction) : Map</key>
 * Traverses aObject executing aFunction for every single element. The aFunction will receive the arguments: aKey, aValue, aPath, aObject.
 * </odoc>
 */
const traverse = function(aObject, aFunction, aParent) {
	if (__flags.ALTERNATIVES.traverse) {
		let stack = [{ obj: aObject, keys: (isJavaObject(aObject)) ? [] : Object.keys(aObject), parent: "" }]

		while (stack.length > 0) {
		  let _d = stack.pop()
		  for(let _key in _d.keys) {
			var __k = _d.keys[_key]
			let value = _d.obj[__k]
			if (isDef(value) && !isNull(value) && (isArray(value) || isMap(value))) {
			  let newParent = _d.parent + (isNaN(Number(__k)) ? `.${__k}` : (isNumber(__k) ? `[${__k}]` : `["${__k}"]`))
			  stack.push({ obj: value, keys: (isJavaObject(value)) ? [] : Object.keys(value), parent: newParent })
			}
			aFunction(__k, value, _d.parent, _d.obj) 
		  }
		}
	} else {
		var keys = (isJavaObject(aObject)) ? [] : Object.keys(aObject);
		var parent = isUnDef(aParent) ? "" : aParent;

		for(var i in keys) {
			if (isObject(aObject[keys[i]])) {
				var newParent = parent + ((isNaN(Number(keys[i]))) ? 
								"." + keys[i] : 
								(isNumber(keys[i]) ? "[" + keys[i] + "]" : "[\"" + keys[i] + "\"]"));
				traverse(aObject[keys[i]], aFunction, newParent, aObject);
			}
			
			aFunction(keys[i], aObject[keys[i]], parent, aObject);
		}
	}
}

/**
 * <odoc>
 * <key>searchKeys(aObject, aSearchKey, useCase, actFunc) : Map</key>
 * Traverses aObject looking for key matches, ignoring case if useCase is true, of the regular expression aSearchKey.
 * Each element found is added to the returned Map. The element key will represent the path from aObject to it. Tip: The actFunc 
 * can use ow.obj.setPath to replace a value: "(key, value, path) => { ow.obj.setPath(aObject, path + '.' + key, replaceValue); }"
 * </odoc>
 */
const searchKeys = function(aObject, aSearchKey, useCase, actFunc) {
	var res = {};
	var usecase = useCase ? "" : "i";
	
	traverse(aObject, function(key, value, path) {
		if (key.match(new RegExp(aSearchKey, usecase))) {
			res[path + ((isNaN(Number(key))) ? "." + key : "[\"" + key + "\"]")] = (typeof value == 'object') ? clone(value) : value;
			if (isDef(actFunc) && isFunction(actFunc)) actFunc(key, value, path);
		}
	});
	return res;
}

/**
 * <odoc>
 * <key>searchValues(aObject, aSearchValue, useCase, actFunc) : Map</key>
 * Traverse aObject looking for value matches, ignoring case if useCase is true, of the regular expression aSearchKey. 
 * Each value found is added to the returned Map linked to the path representation of where it was found. Optionally
 * you can provide an actFunc that receives the key, value and path. Tip: The actFunc can use ow.obj.setPath to 
 * replace a value: "(key, value, path) => { ow.obj.setPath(aObject, path + '.' + key, replaceValue); }"
 * </odoc>
 */
const searchValues = function(aObject, aSearchValue, useCase, actFunc) {
	var res = {};
	var usecase = useCase ? "" : "i";
	
	traverse(aObject, function(key, value, path) {
		if (String(value).match(new RegExp(aSearchValue, usecase))) {
			res[path + ((isNaN(Number(key))) ? "." + key : "[\"" + key + "\"]")] = (typeof value == 'object') ? clone(value) : value;
			if (isDef(actFunc) && isFunction(actFunc)) actFunc(key, value, path);
		}
	});
	return res;
}

/**
 * <odoc>
 * <key>mapArray(anArray, selectors, limit) : Array</key>
 * Helper functions to map selectors (inputs for ow.obj.getPath) from anArray returning the filtered array. IF
 * selectors is a string or just one array entry the result will be an array with just the value results.
 * Optionally you can also limit the number of results to the first "limit" (number).
 * </odoc>
 */
const mapArray = function(anArray, selectors, limit) {
	_$(anArray).isArray("Please provide an array.");
	var res = [], c = 1;

	if (isString(selectors)) selectors = [ selectors ];
	if (isArray(selectors)) {
		for(var jj in anArray) {
			if (isDef(limit) & isNumber(limit)) {
				if (c > limit) {
					return res;
				} else {
					c++;
				}
			} 
			ow.loadObj();
			var entry = {};
			if (selectors.length == 1) {
				entry = ow.obj.getPath(anArray[jj], selectors[0]);
			} else {
				for(var ii in selectors) {
					entry[selectors[ii]]= ow.obj.getPath(anArray[jj], selectors[ii]);
				}
			}
			res.push(entry);
		}
	}

	return res;
}

/**
 * <odoc>
 * <key>searchArray(anArray, aPartialMap, useRegEx, ignoreCase, useParallel) : Array</key>
 * Shortcut to ow.obj.searchArray.
 * </odoc>
 */
const searchArray = function(anArray, aPartialMap, useRegEx, ignoreCase, useParallel) {
	return ow.loadObj.searhArray(anArray, aPartialMap, useRegEx, ignoreCase, useParallel);
}

/**
 * <odoc>
 * <key>flatten(aObject, noKeyValSeparation) : Array</key>
 * Given aObject it will traverse it and create an array where each element will have a key and a val(ue). The key will 
 * begin with a "." whenever it's a children key on aObject. This function is useful when trying to find specific keys
 * or values across a Map. Optionally you can specify that you don't want each array element with the key and the value
 * as separate elements but rather a directly as key and value.
  * </odoc>
 */
const flatten = function(aObject, noKeyValSeparation) {
	var f = []; 
	traverse(aObject, function(key, val, pat) { 
		var e = {};
		if (noKeyValSeparation) 
			e[pat + (pat.length > 0 ? "." : "") + key] = (typeof val =='object') ? clone(val) : val; 
		else
			e = { 
				"key": pat + (pat.length > 0 ? "." : "") + key,
				"val": (typeof val =='object') ? clone(val) : val
			};
		f.push(e); 
	});
	return f;
}

/**
 * <!--odoc>
 * <key>showDebugger(shouldRedirect)</key>
 * Starts the a graphical Rhino debugger instance, typically from the openaf-console. The stdin, stdout and stderr
 * can be redirected to the debugger by having shouldRedirect = true. The Rhino context will be shared between the
 * debugger and the original script that invoked it (for example: openaf-console).
 * </odoc-->
 */
/*function showDebugger(shouldRedirect) {
	print("Trying to create a debugger instance...");
	af.showDebugger(shouldRedirect);
	print("Please use File|Run to select the script you wish to debug.");
}*/

/**
 * <odoc>
 * <key>openInBrowser(anURL) : Boolean</key>
 * Tries to open anURL on the current OS desktop browser. Returns false if it's unable to open the OS desktop browser for some reason.
 * </odoc>
 */
const openInBrowser = function(aURL) {
	try { 
		java.awt.Desktop.getDesktop().browse(new java.net.URI(aURL)); 
		return true;
	} catch(e) { 
		return false;
	}
}

/**
 * <odoc>
 * <key>checkLatestVersion() : String</key>
 * Tries to determine what is the latest available version for OpenAF. Compare it with getVersion() to determine
 * if you need an update.
 * </odoc>
 */
const checkLatestVersion = function() {	
	plugin("HTTP");
	var version = -1;
	if (noHomeComms) return version;

	var homeServerURLs2 = __openafRelease;
	
	homeServerURLs2.forEach(function(aURL) {
		try { 
			var homeServer2 = new HTTP(aURL, undefined, undefined, undefined, false, 2500);
			version = homeServer2.response().trim();
		} catch(e) {
		}
	});
	
	return version;
}



/**
 * <odoc>
 * <key>sh(commandArguments, aStdIn, aTimeout, shouldInheritIO, aDirectory, returnMap, callbackFunc, anEncoding, dontWait, envsMap) : String</key>
 * Tries to execute commandArguments (either a String or an array of strings) in the operating system as a shortcut for 
 * AF.sh except that it will run them through the OS shell. Optionally aStdIn can be provided, aTimeout can be defined 
 * for the execution and if shouldInheritIO is true the stdout, stderr and stdin will be inherit from OpenAF. If 
 * shouldInheritIO is not defined or false it will return the stdout of the command execution. It's possible also to 
 * provide a different working aDirectory. If envsMap (a map of strings) is defined the environment variables will be replaced by envsMap.
 * The variables __exitcode and __stderr can be checked for the command exit code and the stderr output correspondingly.
 * In alternative if returnMap = true a map will be returned with stdout, stderr and exitcode.
 * A callbackFunc can be provided, if shouldInheritIO is undefined or false, that will receive, as parameters, an output 
 * stream, a error stream and an input stream (see help af.sh for an example). If defined the stdout and stderr won't be available for the returnMap if true.
 * </odoc>
 */
const sh = function(commandArguments, aStdIn, aTimeout, shouldInheritIO, aDirectory, returnMap, callbackFunc, anEncoding, dontWait, envsMap) {
	if (typeof commandArguments == "string") {
		if (java.lang.System.getProperty("os.name").match(/Windows/)) {
			return af.sh(["cmd", "/c", commandArguments], aStdIn, aTimeout, shouldInheritIO, aDirectory, returnMap, callbackFunc, anEncoding, dontWait, envsMap);
		} else {
			return af.sh(["/bin/sh", "-c", commandArguments], aStdIn, aTimeout, shouldInheritIO, aDirectory, returnMap, callbackFunc, anEncoding, dontWait, envsMap);
		}
	} else {
		return af.sh(commandArguments, aStdIn, aTimeout, shouldInheritIO, aDirectory, returnMap, callbackFunc, anEncoding, dontWait, envsMap);
	}
}

/**
 * <odoc>
 * <key>findRandomOpenPort() : number</key>
 * Tries to find a random open port on all network interfaces. Useful to start network servers on an available port. 
 * </odoc>
 */
const findRandomOpenPort = function() {
	try {
		var s = new java.net.ServerSocket(0);
		var port = s.getLocalPort();
		s.close();
		return port;
	} catch(e) {
		return -1;
	}
}

// STREAM HANDLING
//

var __ioNIO = true;
/**
 * <odoc>
 * <key>ioSetNIO(aFlag)</key>
 * Sets the default use of NIO in ioStream* functions. It's overridden if the ioStream* function defines
 * a value for the useNIO function argument.
 * </odoc>
 */
const ioSetNIO = function(aFlag) {
	_$(aFlag).isBoolean();
	__ioNIO = aFlag;
}

/**
 * <odoc>
 * <key>ioStreamWrite(aStream, aString, aBufferSize, useNIO)</key>
 * Given a Java input or output stream helps to write aString into the same. Optionally you can provide a different
 * aBufferSize (default: 1024) and/or also specify that Java NIO functionality should be used. 
 * </odoc>
 */
const ioStreamWrite = function(aStream, aString, aBufferSize, useNIO) {
	if (isUnDef(useNIO) && isDef(__ioNIO)) useNIO = __ioNIO;
	if (useNIO) {
		Packages.org.apache.commons.io.IOUtils.write(aString, aStream, "utf-8");
	} else {
		var bufferSize = (isUnDef(aBufferSize)) ? __flags.IO.bufferSize : aBufferSize;
		var channel;
		try {
			channel = aStream.getChannel();
		} catch(e) {
			channel = java.nio.channels.Channels.newChannel(aStream);
		}
		var buffer = java.nio.ByteBuffer.allocate(bufferSize);

		buffer.clear();
		buffer.put(af.fromString2Bytes(aString));
		buffer.flip();

		while(buffer.hasRemaining()) {
			channel.write(buffer);
		}
	}
}

/**
 * <odoc>
 * <key>ioStreamWriteBytes(aStream, aArrayBytes, aBufferSize, useNIO)</key>
 * Given a Java input or output stream helps to write aArrayBytes into the same. Optionally you can provide a different
 * aBufferSize (default: 1024) and/or also specify that Java NIO functionality should be used. 
 * </odoc>
 */
const ioStreamWriteBytes = function(aStream, aArrayBytes, aBufferSize, useNIO) {
	if (isUnDef(useNIO) && isDef(__ioNIO)) useNIO = __ioNIO;
	if (useNIO) {
		Packages.org.apache.commons.io.IOUtils.write(aArrayBytes, aStream);
	} else {
		var bufferSize = (isUnDef(aBufferSize)) ? __flags.IO.bufferSize : aBufferSize;
		var channel;
		try {
			channel = aStream.getChannel();
		} catch(e) {
			channel = java.nio.channels.Channels.newChannel(aStream);
		}
		var buffer = java.nio.ByteBuffer.allocate(bufferSize);

		buffer.clear();
		buffer.put(aArrayBytes);
		buffer.flip();

		while(buffer.hasRemaining()) {
			channel.write(buffer);
		}
	}
}

/**
 * <odoc>
 * <key>ioStreamRead(aStream, aFunction, aBufferSize, useNIO, encoding)</key>
 * Given a Java input or output stream helps to read strings by using aFunction with a string argument for each buffer size 
 * (default 1024 characters). Optionally you can provide a different aBufferSize (default: 1024) and/or also specify that 
 * Java NIO functionality should be used. If aFunction returns true the read operation stops.
 * </odoc>
 */
const ioStreamRead = function(aStream, aFunction, aBufferSize, useNIO, encoding) {
	if (isUnDef(useNIO) && isDef(__ioNIO)) useNIO = __ioNIO;
	encoding = _$(encoding).isString().default(io.getDefaultEncoding());
	var bufferSize = (isUnDef(aBufferSize)) ? __flags.IO.bufferSize : aBufferSize;

	if (useNIO) {
		var channel;
		try {
			channel = aStream.getChannel();
		} catch(e) {
			channel = java.nio.channels.Channels.newChannel(aStream);
		}

		var buffer = java.nio.ByteBuffer.allocate(bufferSize);

		//var bRead = channel.read(buffer);
		var bRead = Packages.org.apache.commons.io.IOUtils.read(channel, buffer);
		while(bRead > 0) {
			buffer.flip();

			/*var buf = [];
			while(buffer.hasRemaining()) {
				buf.push(Number(buffer.get()));
			}*/

			//var res = aFunction(af.fromBytes2String(af.fromArray2Bytes(buf)));
			var res = aFunction(String(java.nio.charset.Charset.forName(encoding).newDecoder().decode(buffer).toString()));
			if (res == true) {
				channel.close();
				aStream.close();
				return;
			}

			buffer.clear();
			//bRead = channel.read(buffer);
			bRead = Packages.org.apache.commons.io.IOUtils.read(channel, buffer);
		}

		channel.close();
		aStream.close();
	} else {
		var buffer = af.fromString2Bytes(repeat(bufferSize, ' '));

		var aRead;
		do {
			aRead = aStream.read(buffer, 0, bufferSize);
			if (aRead > 0) {
				var res = aFunction(af.fromBytes2String(af.fromArray2Bytes(af.fromBytes2Array(buffer).slice(0, aRead))));
				if (res == true) {
					return;
				}
			}
		} while(aRead >= 0);
	}
}

/**
 * <odoc>
 * <key>ioStreamReadLines(aStream, aFunctionPerLine, aSeparator, useNIO, anEncoding)</key>
 * Given aStream will read the entire buffer and call aFunctionPerLine(withALine) per each \n found.
 * Aditionally you can specify a different aSeparator for each line other than "\n". 
 * If aFunctionPerLine returns true the read operation stops. Optionally you can also provide anEncoding.
 * </odoc>
 */
const ioStreamReadLines = function(aStream, aFunction, aSeparator, useNIO, anEncoding) {
	if (isUnDef(useNIO) && isDef(__ioNIO)) useNIO = __ioNIO;
	var buf = "", go = true;
	if (isUnDef(aSeparator)) aSeparator = __separator;

	ioStreamRead(aStream, function(buffer) {
		if (go) {
			var res;
			buf += buffer;
			while (buf.indexOf(aSeparator) >= 0) {
				res = aFunction(buf.substring(0, buf.indexOf(aSeparator)));
				buf = buf.substring(buf.indexOf(aSeparator) + 1);
				if (res == true) { buf = ""; go = false; return; }
			}
			return res;
		}
	}, __, useNIO, anEncoding);
	while (buf.indexOf(aSeparator) >= 0 && go) {
		var res = aFunction(buf.substring(0, buf.indexOf(aSeparator)));
		buf = buf.substring(buf.indexOf(aSeparator) + 1);
		if (res == true) { buf = ""; go = false; return; }
	}
	if (buf.length > 0 && go) {
		var res = aFunction(buf);
		buf = "";
		if (res == true) { buf = ""; go = false; return; }
	}
}

/**
 * <odoc>
 * <key>ioStreamCopy(aOutputStream, aInputStream)</key>
 * Copies the contents of a Java aInputStream to a Java aOutputStream. The two streams will 
 * be closed in the end.
 * </odoc>
 */
const ioStreamCopy = function(aOutputStream, aInputStream) {
	Packages.org.apache.commons.io.IOUtils.copyLarge(aInputStream, aOutputStream);
	Packages.org.apache.commons.io.IOUtils.closeQuietly(aInputStream);
	Packages.org.apache.commons.io.IOUtils.closeQuietly(aOutputStream);
}

/**
 * <odoc>
 * <key>ioStreamReadBytes(aStream, aFunction, aBufferSize, useNIO)</key>
 * Given a Java input or output stream helps to read an array of bytes by using aFunction with anArrayOfBytes argument for 
 * each buffer size (default 1024 characters). Optionally you can provide a different aBufferSize (default: 1024) and/or 
 * also specify that Java NIO functionality should be used. If aFunction returns true the read operation stops.
 * </odoc>
 */
const ioStreamReadBytes = function(aStream, aFunction, aBufferSize, useNIO) {
	if (isUnDef(useNIO) && isDef(__ioNIO)) useNIO = __ioNIO;
	var bufferSize = (isUnDef(aBufferSize)) ? __flags.IO.bufferSize : aBufferSize;

	if (useNIO) {
		var channel;
		try {
			channel = aStream.getChannel();
		} catch(e) {
			channel = java.nio.channels.Channels.newChannel(aStream);
		}
		var buffer = java.nio.ByteBuffer.allocate(bufferSize);

		var bRead = Packages.org.apache.commons.io.IOUtils.read(channel, buffer);
		//var bRead = channel.read(buffer);
		while(bRead > 0) {
			buffer.flip();

			/*var buf = [];
			while(buffer.hasRemaining()) {
				buf.push(Number(buffer.get()));
			}*/
			var buf = newJavaArray(java.lang.Byte.TYPE, buffer.remaining());
			buffer.get(buf, 0, buf.length);

			var res = aFunction(buf);
			if (res == true) {
				channel.close();
				aStream.close();
				return;
			}

			buffer.clear();
			bRead = Packages.org.apache.commons.io.IOUtils.read(channel, buffer);
		}

		channel.close();
		aStream.close();
	} else {
		var buffer = af.fromString2Bytes(repeat(bufferSize, ' '));

		var aRead;
		do {
			aRead = aStream.read(buffer, 0, bufferSize);
			if (aRead > 0) {
				var res = aFunction(af.fromArray2Bytes(af.fromBytes2Array(buffer).slice(0, aRead)));
				if (res == true) {
					return;
				}
			}
		} while(aRead >= 0);

		aStream.close();
	}
}

/**
 * <odoc>
 * <key>toEncoding(aString, anEncoding) : String</key>
 * Converts the provided aString to a different anEncoding (by default UTF-8).
 * </odoc>
 */
const toEncoding = function(aString, anEncoding) {
	if (isUnDef(anEncoding)) anEncoding = "UTF-8";
	return String(new java.lang.String(af.fromString2Bytes(aString), anEncoding));
}

/**
 * <odoc>
 * <key>utf8(aString) : String</key>
 * Converts the provided aString into UTF-8 encoding.
 * </odoc>
 */
const utf8 = function(aString) {
	return toEncoding(aString, "UTF-8");
}

/**
 * <odoc>
 * <key>getFromZip(aZipFile, aResource, inBytes, anEncoding, notInMemory) : anArrayOfBytes</key>
 * Retrieves aResource, as anArrayOfBytes, from aZipFile. This resource can be inBytes = true or
 * not and anEncoding can be provided. If the resource to retrieve is big you can use notInMemory = true
 * for a slower but less memory retrieval.
 * </odoc>
 */
const getFromZip = function(aZipFile, aResource, isBy, encoding, notInMemory) {
	plugin("ZIP");

	if (isDef(aResource)) {
		var zip = new ZIP(), ab;
		if (notInMemory) {
			zip.loadFile(aZipFile);
			ab = zip.getFile(aResource);
			zip.close();
		} else {
			ab = zip.streamGetFile(aZipFile, aResource);
		}
		if (isBy)
			return ab;
		else {
			ab = af.fromBytes2String(ab);
			if (isDef(encoding)) ab = toEncoding(ab, encoding);
			return ab;
		}
	} else {
		return null;
	}
}

//Array.from polyfill from MDN

//Production steps of ECMA-262, Edition 6, 22.1.2.1
//Reference: https://people.mozilla.org/~jorendorff/es6-draft.html#sec-array.from
// if (!Array.from) {
// 	Array.from = (function () {
// 		var toStr = Object.prototype.toString;
// 		var isCallable = function (fn) {
// 			return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
// 		};
// 		var toInteger = function (value) {
// 			var number = Number(value);
// 			if (isNaN(number)) { return 0; }
// 			if (number === 0 || !isFinite(number)) { return number; }
// 			return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
// 		};
// 		var maxSafeInteger = Math.pow(2, 53) - 1;
// 		var toLength = function (value) {
// 			var len = toInteger(value);
// 			return Math.min(Math.max(len, 0), maxSafeInteger);
// 		};

// 		// The length property of the from method is 1.
// 		return function from(arrayLike/*, mapFn, thisArg */) {
// 			// 1. Let C be the this value.
// 			var C = this;

// 			// 2. Let items be ToObject(arrayLike).
// 			var items = Object(arrayLike);

// 			// 3. ReturnIfAbrupt(items).
// 			if (arrayLike == null) {
// 				throw new TypeError("Array.from requires an array-like object - not null or undefined");
// 			}

// 			// 4. If mapfn is undefined, then let mapping be false.
// 			var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
// 			var T;
// 			if (typeof mapFn !== 'undefined') {
// 				// 5. else      
// 				// 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
// 				if (!isCallable(mapFn)) {
// 					throw new TypeError('Array.from: when provided, the second argument must be a function');
// 				}

// 				// 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
// 				if (arguments.length > 2) {
// 					T = arguments[2];
// 				}
// 			}

// 			// 10. Let lenValue be Get(items, "length").
// 			// 11. Let len be ToLength(lenValue).
// 			var len = toLength(items.length);

// 			// 13. If IsConstructor(C) is true, then
// 			// 13. a. Let A be the result of calling the [[Construct]] internal method of C with an argument list containing the single item len.
// 			// 14. a. Else, Let A be ArrayCreate(len).
// 			var A = isCallable(C) ? Object(new C(len)) : new Array(len);

// 			// 16. Let k be 0.
// 			var k = 0;
// 			// 17. Repeat, while k < len… (also steps a - h)
// 			var kValue;
// 			while (k < len) {
// 				kValue = items[k];
// 				if (mapFn) {
// 					A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
// 				} else {
// 					A[k] = kValue;
// 				}
// 				k += 1;
// 			}
// 			// 18. Let putStatus be Put(A, "length", len, true).
// 			A.length = len;
// 			// 20. Return A.
// 			return A;
// 		};
// 	}());
// }

/**
 * <odoc>
 * <key>newJavaArray(aJavaClass, aSize) : JavaArrayClass</key>
 * Creates a new Java Array object for the aJavaClass type for a provided aSize.\
 * \
 * Examples:\
 * \
 * newJavaArray(java.lang.String, 5);\
 * newJavaArray(java.lang.Integer.TYPE, 2);\
 * \
 * </odoc>
 */
const newJavaArray = function(aJavaClass, aSize) {
	return java.lang.reflect.Array.newInstance(aJavaClass, aSize);
}

/**
 * <odoc>
 * <key>threadBox(aExecFunction, aTimeout, aStopFunction)</key>
 * Tries to execute aExecFunction inside a thread. If aTimeout is defined the thread
 * will be terminated if it's still executing after aTimeout. If aStopFunction is defined 
 * it will receive, as argument, a boolean indicating if the thread has stopped (true). If this
 * function returns true the thread execution will be terminated, if false will continue.\
 * Note: see threadBoxCtrlC as aStopFunction to stop executing on Ctrl-C
 * </odoc>
 */
const threadBox = function(aFunction, aTimeout, aStopFunction) {
	if (isUnDef(aStopFunction)) aStopFunction = (aR) => { if (!aR) sleep(25); return aR; };

	var done = false;
	var exc = __;

	plugin("Threads");
	var t = new Threads();
	t.addVirtualThread(function(uuid) {
		try {
			aFunction(uuid);
		} catch(e) {
			exc = e;
			throw e;
		} finally {
			done = true;
		}
		
		return done;
	});
	t.startNoWait();

	var res = false;
	if (isDef(aTimeout)) {
		var s = now();
		while(!res && !done && ((now() - s) < aTimeout)) {
			res = aStopFunction(done);
		}
	} else {
		while(!res && !done) {
			res = aStopFunction(done);
		}
	}
	
	t.stop(true);

	if (isDef(exc)) throw exc;
	
	return (done ? true : (res == true ? "stop" : "timeout"));
}

/**
 * <odoc>
 * <key>$tb(aFunction) : Result</key>
 * Shorcut for a "thread-box" to execute aFunction. The "thread" will timeout with the provided execution timeout (in ms)
 * or stop whenever the stopWhen function returns true (called continuously or after each timeout). Examples:\
 * \
 *    $tb().timeout(5000).exec(aFunc);  // Executes aFunc to a maximum of 5 seconds. Afterwards the aFunc is stopped.\
 *    $tb(aFunc).timeout(5000).exec();  // Sames as previous, aFunc can be provided before or on exec.\
 *    $tb().timeout(500).stopWhen(aStopFunc).exec(); // Stops when aStopFunc is true.\
 * 
 * </odoc>
 */
const $tb = function(aFunction) {
	var tb = function(afu) {
		this._timeout  = __;
		this._stopfunc = __;
		this._func     = afu;
	};

	tb.prototype.timeout = function(aTimeout) {
		this._timeout = aTimeout;
		return this;
	};

	tb.prototype.stopWhen = function(aStopFunction) {
		this._stopfunc = aStopFunction;
		return this;
	};

	tb.prototype.exec = function(aFunc) {
		if (isDef(aFunc) && isFunction(aFunc)) this._func = aFunc;
		return threadBox(this._func, this._timeout, this._stopfunc);
	};

	return new tb(aFunction);
};

var __openaf_rest = { urls: {}, stats: false };
const $rest = function(ops) {
	ow.loadObj();
	var _toptions = {};
	var _rest = function(aOptions) {
		_toptions = _$(aOptions).isMap().default({ });
		_toptions.default = _$(_toptions.default, "default").isMap().default({});
		_toptions.throwExceptions = _$(_toptions.throwExceptions, "throwExceptions").isBoolean().default(false);
		_toptions.collectAllStats = _$(_toptions.collectAllStats, "collectAllStats").isBoolean().default(__openaf_rest.stats);
		_toptions.preAction = _$(_toptions.preAction, "preAction").isFunction().default(__);
		_toptions.uriQuery = _$(_toptions.uriQuery, "uriQuery").isBoolean().default(false);
		_toptions.downloadResume = _$(_toptions.downloadResume, "downloadResume").isBoolean().default(false);
		_toptions.retry = _$(_toptions.retry, "retry").isNumber().default(0);
		_toptions.retryWait = _$(_toptions.retryWait, "retryWait").isNumber().default(1500);
		_toptions.login = _$(_toptions.login, "login").default(__);
		_toptions.pass = _$(_toptions.pass, "pass").default(__);
		_toptions.options = _$(_toptions.options, "options").isMap().default(__)
		_toptions.requestHeaders = _$(_toptions.requestHeaders, "requestHeaders").isMap().default(__flags.HTTP_DEFAULT_HEADERS ? { Accept: "*/*" } : __)
	};

	_rest.prototype.__check = function(aBaseURI) {
		// try URL based
		if (isDef(__openaf_rest.urls[aBaseURI])) {
			if (isDef(__openaf_rest.urls[aBaseURI]) && __openaf_rest.urls[aBaseURI].off) return false;
		} 

		if (Object.keys(__openaf_rest.urls).length > 0) {
			// try host based
			try {
				var url = java.net.URL(aBaseURI);
				var host = String(url.getHost() + ":" + url.getPort());
				
				if (isDef(__openaf_rest.urls[host]) && __openaf_rest.urls[host].off) return false;
			} catch(e) { }
		} else {
			return true;
		}

		return true;
	};
	_rest.prototype.__stats = function(aBaseURI, isFail, aETime) {
		if (_toptions.collectAllStats) {
			if (isUnDef(__openaf_rest.urls[aBaseURI])) __openaf_rest.urls[aBaseURI] = {};
			__openaf_rest.urls[aBaseURI].c = (isDef(__openaf_rest.urls[aBaseURI].c) ? __openaf_rest.urls[aBaseURI].c + 1 : 1);
			if (isFail) __openaf_rest.urls[aBaseURI].f = (isDef(__openaf_rest.urls[aBaseURI].f) ? __openaf_rest.urls[aBaseURI].f + 1 : 1);
			if (!isFail && isDef(aETime)) __openaf_rest.urls[aBaseURI].t = (isDef(__openaf_rest.urls[aBaseURI].t) ? __openaf_rest.urls[aBaseURI].t + aETime : aETime);

			if (Object.keys(__openaf_rest.urls).length > 0) {
				// try host based
				try {
					var url = java.net.URL(aBaseURI);
					var port = url.getPort();
					if (port == -1) {
						switch(String(url.getProtocol())) {
						case "http" : port = 80;  break;
						case "https": port = 443; break;
						}
					}
					var host = String(url.getHost() + ":" + port);

					if (isUnDef(__openaf_rest.urls[host])) __openaf_rest.urls[host] = {};
					__openaf_rest.urls[host].c = (isDef(__openaf_rest.urls[host].c) ? __openaf_rest.urls[host].c + 1 : 1);
					if (isFail) __openaf_rest.urls[host].f = (isDef(__openaf_rest.urls[host].f) ? __openaf_rest.urls[host].f + 1 : 1);
					if (!isFail && isDef(aETime)) __openaf_rest.urls[host].t = (isDef(__openaf_rest.urls[host].t) ? __openaf_rest.urls[host].t + aETime : aETime);
				} catch(e) { }
			}

			Packages.openaf.SimpleLog.log(Packages.openaf.SimpleLog.logtype.DEBUG, "REST call to '" + aBaseURI + "' fail=" + isFail + (!isFail ? "; time=" + aETime : ""), null);
		}
	};
	_rest.prototype.__f1 = function(aFn, aSubFn, aBaseURI, aIdxMap, retBytes, aVerb) {
		var res, parent = this;
		aIdxMap = _$(aIdxMap).isMap().default({});
		if (_toptions.uriQuery) {
			aBaseURI += "?" + $rest().query(aIdxMap);
			aIdxMap = {};
		}
		var fdef = [ "aBaseURL", "aIdxMap", "login", "pass", "conTimeout", "reqHeaders", "urlEncode", "httpClient", "retBytes", "options" ];
		if (parent.__check(aBaseURI)) {
			var c = _toptions.retry, error, __t;
			do {
				error = __;
				try {
					if (isDef(_toptions.timeout) || isDef(_toptions.stopWhen)) {
						var _r = $tb(() => {
							if (isDef(_toptions.preAction)) { 
								var _a = $a2m(fdef, [ aBaseURI, aIdxMap, _toptions.login, _toptions.pass, _toptions.connectionTimeout, _toptions.requestHeaders, _toptions.urlEncode, _toptions.httpClient, retBytes, _toptions.options ]);
								_a.aVerb = aVerb;
								var rres = _toptions.preAction(_a);
								var args;
								if (isDef(rres) && rres != null) 
									args = $m2a(fdef, rres);
								else
									args = [ aBaseURI, aIdxMap, _toptions.login, _toptions.pass, _toptions.connectionTimeout, _toptions.requestHeaders, _toptions.urlEncode, _toptions.httpClient, retBytes, _toptions.options ];
								res = aFn[aSubFn].apply(aFn, args);
							} else {
								__t = now();
								res = aFn[aSubFn](aBaseURI, aIdxMap, _toptions.login, _toptions.pass, _toptions.connectionTimeout, _toptions.requestHeaders, _toptions.httpClient, retBytes, _toptions.options );
								__t = now() - __t;
							}		
						}).timeout(_toptions.timeout).stopWhen(_toptions.stopWhen).exec();
						if (_r !== true) {
							parent.__stats(aBaseURI, true, __t);
							if (_toptions.throwExceptions) throw _r; else res = _toptions.default;
						} else {
							parent.__stats(aBaseURI, false, __t);
						}
					} else {
						if (isDef(_toptions.preAction)) { 
							var _a = $a2m(fdef, [ aBaseURI, aIdxMap, _toptions.login, _toptions.pass, _toptions.connectionTimeout, _toptions.requestHeaders, _toptions.urlEncode, _toptions.httpClient, retBytes, _toptions.options ]);
							_a.aVerb = aVerb;
							var rres = _toptions.preAction(_a);
							var args;
							if (isDef(rres) && rres != null) 
								args = $m2a(fdef, rres);
							else
								args = [ aBaseURI, aIdxMap, _toptions.login, _toptions.pass, _toptions.connectionTimeout, _toptions.requestHeaders, _toptions.urlEncode, _toptions.httpClient, retBytes, _toptions.options ];
							__t = now();
							res = aFn[aSubFn].apply(aFn, args);
							__t = now() - __t;
						} else {
							__t = now();
							res = aFn[aSubFn](aBaseURI, aIdxMap, _toptions.login, _toptions.pass, _toptions.connectionTimeout, _toptions.requestHeaders, _toptions.httpClient, retBytes, _toptions.options);
							__t = now() - __t;
						}
						parent.__stats(aBaseURI, false, __t);
					}
				} catch(e) {
					parent.__stats(aBaseURI, true, __t);
					error = e;
					c--;
					if (c > 0) sleep(_toptions.retryWait, true);
				}
			} while(isDef(error) && c > 0);

			if (isDef(error)) {
				if (_toptions.throwExceptions) {
					throw error;
				} else {
					res = merge({ error: ow.obj.rest.exceptionParse(error) }, _toptions.default);
				}
			}
		} else {
			if (_toptions.throwExceptions) 
				throw "Access to " + aBaseURI + " is currently internally disabled."; 
			else 
				res = _toptions.default;
		}
		return res;
	};
	_rest.prototype.__f2 = function(aFn, aSubFn, aBaseURI, aDataRowMap, aIdxMap, retBytes, aVerb) {
		var res, parent = this;
		aIdxMap = _$(aIdxMap).isMap().default({});
		if (_toptions.uriQuery) {
			aBaseURI += "?" + $rest().query(aIdxMap);
			aIdxMap = {};
		}
		var fdef = [ "aBaseURL", "aIdxMap", "aDataRowMap", "login", "pass", "conTimeout", "reqHeaders", "urlEncode", "httpClient", "retBytes", "aMethod", "options" ];
		if (parent.__check(aBaseURI)) {
			var c = _toptions.retry, error;
			do {
				error = __;
				try {
					if (isDef(_toptions.timeout) || isDef(_toptions.stopWhen)) {
						var _r = $tb(() => {
							if (isDef(_toptions.preAction)) { 
								var _a = $a2m(fdef, [ aBaseURI, aIdxMap, aDataRowMap, _toptions.login, _toptions.pass, _toptions.connectionTimeout, _toptions.requestHeaders, _toptions.urlEncode, _toptions.httpClient, retBytes, _toptions.options ]);
								_a.aVerb = aVerb;
								var rres = _toptions.preAction(_a);
								var args;
								if (isDef(rres) && rres != null) 
									args = $m2a(fdef, rres);
								else
									args = [ aBaseURI, aIdxMap, aDataRowMap, _toptions.login, _toptions.pass, _toptions.connectionTimeout, _toptions.requestHeaders, _toptions.urlEncode, _toptions.httpClient, retBytes, _toptions.options ];
								res = aFn[aSubFn].apply(aFn, args);
							} else {
								res = aFn[aSubFn](aBaseURI, aIdxMap, aDataRowMap, _toptions.login, _toptions.pass, _toptions.connectionTimeout, _toptions.requestHeaders, _toptions.urlEncode, _toptions.httpClient, retBytes, _toptions.options);
							}
						}).timeout(_toptions.timeout).stopWhen(_toptions.stopWhen).exec();
						if (_r !== true) {
							parent.__stats(aBaseURI, true);
							if (_toptions.throwExceptions) throw _r; else res = _toptions.default;
						} else {
							parent.__stats(aBaseURI, false);
						}
					} else {
						if (isDef(_toptions.preAction)) { 
							var _a = $a2m(fdef, [ aBaseURI, aIdxMap, aDataRowMap, _toptions.login, _toptions.pass, _toptions.connectionTimeout, _toptions.requestHeaders, _toptions.urlEncode, _toptions.httpClient, retBytes, _toptions.options ]);
							_a.aVerb = aVerb;
							var rres = _toptions.preAction(_a);
							var args;
							if (isDef(rres) && rres != null) 
								args = $m2a(fdef, rres);
							else
								args = [ aBaseURI, aIdxMap, aDataRowMap, _toptions.login, _toptions.pass, _toptions.connectionTimeout, _toptions.requestHeaders, _toptions.urlEncode, _toptions.httpClient, retBytes, _toptions.options ];
							res = aFn[aSubFn].apply(aFn, args);
						} else {
							res = aFn[aSubFn](aBaseURI, aIdxMap, aDataRowMap, _toptions.login, _toptions.pass, _toptions.connectionTimeout, _toptions.requestHeaders, _toptions.urlEncode, _toptions.httpClient, retBytes, _toptions.options);
						}
						parent.__stats(aBaseURI, false);
					}
				} catch(e) {
					parent.__stats(aBaseURI, true);
					error = e;
					c--;
					if (c > 0) sleep(_toptions.retryWait, true);
				}
			} while(isDef(error) && c > 0);
			
			if (isDef(error)) {
				if (_toptions.throwExceptions) {
					throw error;
				} else {
					res = merge({ error: ow.obj.rest.exceptionParse(error) }, _toptions.default);
				}
			}
		} else {
			if (_toptions.throwExceptions) 
				throw "Access to " + aBaseURI + " is currently internally disabled."; 
			else 
				res = _toptions.default;
		}			
		return res;
	};
	/**
	 * <odoc>
	 * <key>$rest.get(aBaseURI, aIdxMap) : Map</key>
	 * Shortcut for ow.obj.rest.jsonGet (see help ow.obj.rest.jsonGet) using aOptions ($rest(aOptions).): login (function or string),
	 *  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object),
	 * default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between
	 * throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available) 
	 * and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and
	 * returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).
	 * </odoc>
	 */
	_rest.prototype.get = function(aBaseURI, aIdxMap) {
		return this.__f1(ow.obj.rest, "jsonGet", aBaseURI, aIdxMap, __, "get");
	};
	/**
	 * <odoc>
	 * <key>$rest.get2Stream(aBaseURI, aIdxMap) : JavaStream</key>
	 * Shortcut for ow.obj.rest.jsonGet (see help ow.obj.rest.jsonGet) using aOptions ($rest(aOptions).): login (function or string),
	 *  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object),
	 * default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between
	 * throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available) 
	 * and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and
	 * returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).
	 * </odoc>
	 */
	_rest.prototype.get2Stream = function(aBaseURI, aIdxMap) {
		return this.__f1(ow.obj.rest, "get", aBaseURI, aIdxMap, true, "get");
	};
		/**
	 * <odoc>
	 * <key>$rest.get2File(aFilePath, aBaseURI, aIdxMap)</key>
	 * Shortcut for ow.obj.rest.jsonGet (see help ow.obj.rest.jsonGet) using aOptions ($rest(aOptions).): login (function or string),
	 *  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object),
	 * default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between
	 * throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available) 
	 * and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and
	 * returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).
	 * The byte output will be saved into aFilePath. Optional $rest(aOptions.downloadResume = true) will resume download of a file if it exists.
	 * </odoc>
	 */
	_rest.prototype.get2File = function(aFilePath, aBaseURI, aIdxMap) {
		if (_toptions.downloadResume && io.fileExists(aFilePath)) {
			if (isUnDef(_toptions.requestHeaders)) _toptions.requestHeaders = {};
			_toptions.requestHeaders.Range = "bytes=" + io.fileInfo(aFilePath).size + "-";
			ioStreamCopy(io.writeFileStream(aFilePath, true), this.__f1(ow.obj.rest, "get", aBaseURI, aIdxMap, true, "get"));
		} else {
			ioStreamCopy(io.writeFileStream(aFilePath), this.__f1(ow.obj.rest, "get", aBaseURI, aIdxMap, true, "get"));
		}
	};
	/**
	 * <odoc>
	 * <key>$rest.post(aBaseURI, aDataRowMap, aIdxMap) : Map</key>
	 * Shortcut for ow.obj.rest.jsonCreate (see help ow.obj.rest.jsonCreate) using aOptions ($rest(aOptions).): login (function or string),
	 *  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object),
	 * default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between
	 * throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available) 
	 * and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and
	 * returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).
	 * </odoc>
	 */
	_rest.prototype.post = function(aBaseURI, aDataRowMap, aIdxMap) {
		return this.__f2(ow.obj.rest, "jsonCreate", aBaseURI, aDataRowMap, aIdxMap, __, "post");
	};
	/**
	 * <odoc>
	 * <key>$rest.post2Stream(aBaseURI, aDataRowMap, aIdxMap) : JavaStream</key>
	 * Shortcut for ow.obj.rest.jsonCreate (see help ow.obj.rest.jsonCreate) using aOptions ($rest(aOptions).): login (function or string),
	 *  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object),
	 * default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between
	 * throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available) 
	 * and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and
	 * returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).
	 * </odoc>
	 */	
	_rest.prototype.post2Stream = function(aBaseURI, aDataRowMap, aIdxMap) {
		return this.__f2(ow.obj.rest, "create", aBaseURI, aDataRowMap, aIdxMap, true, "post");
	};
	/**
	 * <odoc>
	 * <key>$rest.postUpload(aBaseURI, aDataRowMap, aIdxMap) : Map</key>
	 * Shortcut for ow.obj.rest.upload (see help ow.obj.rest.upload with post) using aOptions ($rest(aOptions).): login (function or string),
	 *  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object),
	 * default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between
	 * throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available) 
	 * and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and
	 * returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).
	 * </odoc>
	 */
	_rest.prototype.postUpload = function(aBaseURI, aDataRowMap, aIdxMap) {
		return this.__f2(ow.obj.rest, "upload", aBaseURI, aDataRowMap, aIdxMap, __, "post");
	};
	/**
	 * <odoc>
	 * <key>$rest.postUpload2Stream(aBaseURI, aDataRowMap, aIdxMap) : JavaStream</key>
	 * Shortcut for ow.obj.rest.upload (see help ow.obj.rest.upload with post) using aOptions ($rest(aOptions).): login (function or string),
	 *  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object),
	 * default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between
	 * throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available) 
	 * and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and
	 * returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).
	 * </odoc>
	 */
	_rest.prototype.postUpload2Stream = function(aBaseURI, aDataRowMap, aIdxMap) {
		return this.__f2(ow.obj.rest, "upload", aBaseURI, aDataRowMap, aIdxMap, true, "post");
	};
	/**
	 * <odoc>
	 * <key>$rest.post2File(aFilePath, aBaseURI, aDataRowMap, aIdxMap)</key>
	 * Shortcut for ow.obj.rest.jsonCreate (see help ow.obj.rest.jsonCreate) using aOptions ($rest(aOptions).): login (function or string),
	 *  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object),
	 * default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between
	 * throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available) 
	 * and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and
	 * returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).
	 * The byte output will be saved into aFilePath. Optional $rest(aOptions.downloadResume = true) will resume download of a file if it exists.
	 * </odoc>
	 */	
	_rest.prototype.post2File = function(aFilePath, aBaseURI, aDataRowMap, aIdxMap) {
		if (_toptions.downloadResume && io.fileExists(aFilePath)) {
			if (isUnDef(_toptions.requestHeaders)) _toptions.requestHeaders = {};
			_toptions.requestHeaders.Range = "bytes=" + io.fileInfo(aFilePath).size + "-";
			ioStreamCopy(io.writeFileStream(aFilePath, true), this.__f2(ow.obj.rest, "create", aBaseURI, aDataRowMap, aIdxMap, true, "post"));
		} else {
			ioStreamCopy(io.writeFileStream(aFilePath), this.__f2(ow.obj.rest, "create", aBaseURI, aDataRowMap, aIdxMap, true, "post"));
		}
	};	
	/**
	 * <odoc>
	 * <key>$rest.put(aBaseURI, aDataRowMap, aIdxMap) : Map</key>
	 * Shortcut for ow.obj.rest.jsonSet (see help ow.obj.rest.jsonSet) using aOptions ($rest(aOptions).): login (function or string),
	 *  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object),
	 * default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between
	 * throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available) 
	 * and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and
	 * returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).
	 * </odoc>
	 */
	_rest.prototype.put = function(aBaseURI, aDataRowMap, aIdxMap) {
		return this.__f2(ow.obj.rest, "jsonSet", aBaseURI, aDataRowMap, aIdxMap, __, "put");
	};
	/**
	 * <odoc>
	 * <key>$rest.put2Stream(aBaseURI, aDataRowMap, aIdxMap) : JavaStream</key>
	 * Shortcut for ow.obj.rest.jsonSet (see help ow.obj.rest.jsonSet) using aOptions ($rest(aOptions).): login (function or string),
	 *  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object),
	 * default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between
	 * throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available) 
	 * and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and
	 * returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).
	 * </odoc>
	 */
	_rest.prototype.put2Stream = function(aBaseURI, aDataRowMap, aIdxMap) {
		return this.__f2(ow.obj.rest, "set", aBaseURI, aDataRowMap, aIdxMap, true, "put");
	};
	/**
	 * <odoc>
	 * <key>$rest.putUpload(aBaseURI, aDataRowMap, aIdxMap) : Map</key>
	 * Shortcut for ow.obj.rest.upload (see help ow.obj.rest.upload with put) using aOptions ($rest(aOptions).): login (function or string),
	 *  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object),
	 * default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between
	 * throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available) 
	 * and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and
	 * returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).
	 * </odoc>
	 */
	_rest.prototype.putUpload = function(aBaseURI, aDataRowMap, aIdxMap) {
		return this.__f2(ow.obj.rest, "upload", aBaseURI, aDataRowMap, aIdxMap, __, "put");
	};
	/**
	 * <odoc>
	 * <key>$rest.putUpload2Stream(aBaseURI, aDataRowMap, aIdxMap) : JavaStream</key>
	 * Shortcut for ow.obj.rest.upload (see help ow.obj.rest.upload with post) using aOptions ($rest(aOptions).): login (function or string),
	 *  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object),
	 * default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between
	 * throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available) 
	 * and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and
	 * returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).
	 * </odoc>
	 */
	_rest.prototype.putUpload2Stream = function(aBaseURI, aDataRowMap, aIdxMap) {
		return this.__f2(ow.obj.rest, "upload", aBaseURI, aDataRowMap, aIdxMap, true, "put");
	};
	/**
	 * <odoc>
	 * <key>$rest.put2File(aFilePath, aBaseURI, aDataRowMap, aIdxMap)</key>
	 * Shortcut for ow.obj.rest.jsonSet (see help ow.obj.rest.jsonSet) using aOptions ($rest(aOptions).): login (function or string),
	 *  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object),
	 * default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between
	 * throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available) 
	 * and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and
	 * returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).
	 * The byte output will be saved into aFilePath. Optional $rest(aOptions.downloadResume = true) will resume download of a file if it exists.
	 * </odoc>
	 */
	_rest.prototype.put2File = function(aFilePath, aBaseURI, aDataRowMap, aIdxMap) {
		if (_toptions.downloadResume && io.fileExists(aFilePath)) {
			if (isUnDef(_toptions.requestHeaders)) _toptions.requestHeaders = {};
			_toptions.requestHeaders.Range = "bytes=" + io.fileInfo(aFilePath).size + "-";
			ioStreamCopy(io.writeFileStream(aFilePath, true), this.__f2(ow.obj.rest, "set", aBaseURI, aDataRowMap, aIdxMap, true, "put"));
		} else {
			ioStreamCopy(io.writeFileStream(aFilePath), this.__f2(ow.obj.rest, "set", aBaseURI, aDataRowMap, aIdxMap, true, "put"));
		}
	};
	/**
	 * <odoc>
	 * <key>$rest.delete(aBaseURI, aIdxMap) : Map</key>
	 * Shortcut for ow.obj.rest.jsonRemove (see help ow.obj.rest.jsonRemove) using aOptions ($rest(aOptions).): login (function or string),
	 *  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object),
	 * default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between
	 * throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available) 
	 * and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and
	 * returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).
	 * </odoc>
	 */
	_rest.prototype.delete = function(aBaseURI, aIdxMap) {
		return this.__f1(ow.obj.rest, "jsonRemove", aBaseURI, aIdxMap, __, "delete");
	};
	/**
	 * <odoc>
	 * <key>$rest.delete2Stream(aBaseURI, aIdxMap) : JavaStream</key>
	 * Shortcut for ow.obj.rest.jsonRemove (see help ow.obj.rest.jsonRemove) using aOptions ($rest(aOptions).): login (function or string),
	 *  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object),
	 * default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between
	 * throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available) 
	 * and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and
	 * returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).
	 * </odoc>
	 */
	_rest.prototype.delete2Stream = function(aBaseURI, aIdxMap) {
		return this.__f1(ow.obj.rest, "remove", aBaseURI, aIdxMap, true, "delete");
	};
	/**
	 * <odoc>
	 * <key>$rest.delete2File(aFilePath, aBaseURI, aIdxMap)</key>
	 * Shortcut for ow.obj.rest.jsonRemove (see help ow.obj.rest.jsonRemove) using aOptions ($rest(aOptions).): login (function or string),
	 *  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object),
	 * default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between
	 * throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available) 
	 * and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and
	 * returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).
	 * The byte output will be saved into aFilePath. Optional $rest(aOptions.downloadResume = true) will resume download of a file if it exists.
	 * </odoc>
	 */
	_rest.prototype.delete2File = function(aFilePath, aBaseURI, aIdxMap) {
		if (_toptions.downloadResume && io.fileExists(aFilePath)) {
			if (isUnDef(_toptions.requestHeaders)) _toptions.requestHeaders = {};
			_toptions.requestHeaders.Range = "bytes=" + io.fileInfo(aFilePath).size + "-";
			ioStreamCopy(io.writeFileStream(aFilePath, true), this.__f1(ow.obj.rest, "remove", aBaseURI, aIdxMap, true, "delete"));
		} else {
			ioStreamCopy(io.writeFileStream(aFilePath), this.__f1(ow.obj.rest, "remove", aBaseURI, aIdxMap, true, "delete"));
		}
	};
	/**
	 * <odoc>
	 * <key>$rest.patch(aBaseURI, aDataRowMap, aIdxMap) : Map</key>
	 * Shortcut for ow.obj.rest.jsonPatch (see help ow.obj.rest.jsonPatch) using aOptions ($rest(aOptions).): login (function or string),
	 *  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object),
	 * default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between
	 * throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available) 
	 * and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and
	 * returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).
	 * </odoc>
	 */
	_rest.prototype.patch = function(aBaseURI, aDataRowMap, aIdxMap) {
		return this.__f2(ow.obj.rest, "jsonPatch", aBaseURI, aDataRowMap, aIdxMap, __, "patch");
	};
	/**
	 * <odoc>
	 * <key>$rest.patch2Stream(aBaseURI, aDataRowMap, aIdxMap) : JavaStream</key>
	 * Shortcut for ow.obj.rest.jsonPatch (see help ow.obj.rest.jsonPatch) using aOptions ($rest(aOptions).): login (function or string),
	 *  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object),
	 * default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between
	 * throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available) 
	 * and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and
	 * returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).
	 * </odoc>
	 */
	_rest.prototype.patch2Stream = function(aBaseURI, aDataRowMap, aIdxMap) {
		return this.__f2(ow.obj.rest, "patch", aBaseURI, aDataRowMap, aIdxMap, true, "patch");
	};
	/**
	 * <odoc>
	 * <key>$rest.patchUpload(aBaseURI, aDataRowMap, aIdxMap) : Map</key>
	 * Shortcut for ow.obj.rest.upload (see help ow.obj.rest.upload with patch) using aOptions ($rest(aOptions).): login (function or string),
	 *  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object),
	 * default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between
	 * throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available) 
	 * and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and
	 * returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).
	 * </odoc>
	 */
	_rest.prototype.patchUpload = function(aBaseURI, aDataRowMap, aIdxMap) {
		return this.__f2(ow.obj.rest, "upload", aBaseURI, aDataRowMap, aIdxMap, __, "patch");
	};
	/**
	 * <odoc>
	 * <key>$rest.patchUpload2Stream(aBaseURI, aDataRowMap, aIdxMap) : JavaStream</key>
	 * Shortcut for ow.obj.rest.upload (see help ow.obj.rest.upload with patch) using aOptions ($rest(aOptions).): login (function or string),
	 *  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object),
	 * default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between
	 * throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available) 
	 * and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and
	 * returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).
	 * </odoc>
	 */
	_rest.prototype.patchUpload2Stream = function(aBaseURI, aDataRowMap, aIdxMap) {
		return this.__f2(ow.obj.rest, "upload", aBaseURI, aDataRowMap, aIdxMap, true, "patch");
	};
	/**
	 * <odoc>
	 * <key>$rest.patch2File(aFilePath, aBaseURI, aDataRowMap, aIdxMap)</key>
	 * Shortcut for ow.obj.rest.jsonPatch (see help ow.obj.rest.jsonPatch) using aOptions ($rest(aOptions).): login (function or string),
	 *  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object),
	 * default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between
	 * throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available) 
	 * and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and
	 * returns a map with changes (aBaseURL, aIdxMap, aDataRowMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms). 
	 * The byte output will be saved into aFilePath. Optional $rest(aOptions.downloadResume = true) will resume download of a file if it exists.
	 * </odoc>
	 */
	_rest.prototype.patch2File = function(aFilePath, aBaseURI, aDataRowMap, aIdxMap) {
		if (_toptions.downloadResume && io.fileExists(aFilePath)) {
			if (isUnDef(_toptions.requestHeaders)) _toptions.requestHeaders = {};
			_toptions.requestHeaders.Range = "bytes=" + io.fileInfo(aFilePath).size + "-";
			ioStreamCopy(io.writeFileStream(aFilePath, true), this.__f2(ow.obj.rest, "patch", aBaseURI, aDataRowMap, aIdxMap, true, "patch"));
		} else {
			ioStreamCopy(io.writeFileStream(aFilePath), this.__f2(ow.obj.rest, "patch", aBaseURI, aDataRowMap, aIdxMap, true, "patch"));
		}
	};
	/**
	 * <odoc>
	 * <key>$rest.head(aBaseURI, aIdxMap)</key>
	 * Shortcut for ow.obj.rest.head (see help ow.obj.rest.head) using aOptions ($rest(aOptions).): login (function or string),
	 *  pass (word), connectionTimeout (in ms), requestHeaders (map), urlEncode (boolean), uriQuery (boolean), httpClient (ow.obj.http object),
	 * default (map to return when there is an exception), throwExceptions (boolean defaulting to false controlling between
	 * throwing exceptions on different from 2xx http codes or connection issues or returning a map (merge with default if available) 
	 * and an error entry), collectAllStats (boolean with default false to store per uri or host:port statitics), preAction function that receives and
	 * returns a map with changes (aBaseURL, aIdxMap, login, pass, conTimeout, reqHeaders, urlEncode and httpClient), retry (number) and retryWait (time in ms).
	 * </odoc>
	 */
	_rest.prototype.head = function(aBaseURI, aIdxMap) {
		return this.__f1(ow.obj.rest, "head", aBaseURI, aIdxMap, __, "head");
	};
	/**
	 * <odoc>
	 * <key>$rest.query(aMap) : String</key>
	 * Shortcut for ow.obj.rest.writeQuery (see help ow.obj.rest.writeQuery).
	 * </odoc>
	 */
	_rest.prototype.query = function(aMap) {
		return ow.obj.rest.writeQuery(aMap);
	};
	/**
	 * <odoc>
	 * <key>$rest.index(aMap) : String</key>
	 * Shortcut for ow.obj.rest.writeIndexes (see help ow.obj.rest.writeIndexes).
	 * </odoc>
	 */	
	_rest.prototype.index = function(aMap) {
		return ow.obj.rest.writeIndexes(aMap);
	};

	return new _rest(ops);
};

/**
 * <odoc>
 * <key>$jsonrpc(aOptions) : Map</key>
 * Creates a JSON-RPC client that can be used to communicate with a JSON-RPC server
 * or a local process using stdio. The aOptions parameter is a map with the following
 * possible keys: type (string, default "stdio" for local process or "remote" for remote server),
 * url (string, required for remote server), timeout (number, default 60000 ms
 * for remote server), cmd (string, required for local process),
 * and options (map, optional additional options for remote server).
 * The returned map has the following methods: type (to set the type),
 * url (to set the URL for remote server), sh (to set the command for local
 * process), exec (to execute a method with parameters),
 * and destroy (to stop the client). The exec method returns a promise that resolves
 * to the result of the method call or an error if the call fails.
 * Example usage:\
 * \
 * var client = $jsonrpc({type: "remote", url: "http://example.com/api", timeout: 5000});\
 * client.exec("methodName", {param1: "value1", param2: "value2"}).then(result => {\
 *     log("Result:", result);\
 * }).catch(error => {\
 *     logErr("Error:", error);\
 * });\
 * \
 * var localClient = $jsonrpc({type: "stdio", cmd: "myLocalProcess"});\
 * localClient.exec("localMethod", {param1: "value1"}).then(result => {\
 *     log("Local Result:", result);\
 * }).catch(error => {\
 *     logErr("Local Error:", error);\
 * });\
 * </odoc>
 */
const $jsonrpc = function(aOptions) {
	aOptions = _$(aOptions, "aOptions").isMap().default({})
	aOptions.type = _$(aOptions.type, "aOptions.type").isString().default("stdio")
	aOptions.timeout = _$(aOptions.timeout, "aOptions.timeout").isNumber().default(60000)

	const _r = {
		_ids: $atomic(1, "long"),
		_p  : __,
		_s  : false,
		_q  : {},
		_r  : {},
		type: type => {
			aOptions.type = type
			return _r
		},
		url : url => {
			aOptions.url = url
			aOptions.type = "remote"
			return _r
		},
		sh  : cmd => {
			aOptions.cmd = cmd
			aOptions.type = "stdio"
			_r._p = $doV(() => {
				$tb(() => {
					_r._s = false
					$sh(cmd)
					.cb((o, e, i) => {
						$doWait($doAll(
							[
								// in stream
								$do(() => {
									do {
										var _id = _r._ids.get()
										$await("__jsonrpc_q-" + _id).wait()
										if (isMap(_r._q[_id]) && isDef(_r._q[_id].method)) {
											var msg = stringify({
												jsonrpc: "2.0",
												id: _id,
												method: _r._q[_id].method,
												params: _r._q[_id].params
											}, __, "") + "\n"
											ioStreamWrite(i, msg)
                                            i.flush()
											delete _r._q[_id]
											_r._ids.inc()
										}
										$await("__jsonrpc_q-" + _id).destroy()
										$await("__jsonrpc_r-" + _id).notify()
									} while(!_r._s)
								}),
								// out stream
								$do(() => {
									do {
										var _id = _r._ids.get()
										$await("__jsonrpc_r-" + _id).wait()
										ioStreamReadLines(o, line => {
											var _l = jsonParse(line)
											_r._r[_l.id] = _l
											$await("__jsonrpc_a-" + _l.id).notify()
											$await("__jsonrpc_r-" + _id).destroy()
											return false
										}, __, false)
                                        o.flush()
									} while(!_r._s)
								})
							]
						))
					})
					.get()
				}).stopWhen(() => _r._s).exec()
			})
			return _r
		},
		exec: (aMethod, aParams) => {
			switch(aOptions.type) {
			case "stdio" :
				var _id = _r._ids.get()
				_r._q[_id] = {
					method: _$(aMethod, "aMethod").isString().$_(),
					params: _$(aParams, "aParams").isMap().default({})
				}
				$await("__jsonrpc_q-" + _id).notifyAll()
				$await("__jsonrpc_a-" + _id).wait(aOptions.timeout)
				var _res
				if (isMap(_r._r[_id])) {
					_res = _r._r[_id]
					delete _r._r[_id]
				}
				$await("__jsonrpc_a-" + _id).destroy()
				return isDef(_res) && isDef(_res.result) ? _res.result : _res
			case "remote":
			default      :
				_$(aOptions.url, "aOptions.url").isString().$_()
				aOptions.options = _$(aOptions.options, "aOptions.options").isMap().default({})
				aMethod = _$(aMethod, "aMethod").isString().$_()
				aParams = _$(aParams, "aParams").isMap().default({})

				var res = $rest(aOptions.options).post(aOptions.url, {
					jsonrpc: "2.0",
					method: aMethod,
					params: aParams,
					id: aOptions.id || _r._ids.inc()
				})
				if (isDef(res)) {
					if (isDef(res.error) && (isDef(res.error.response))) return res.error.response
					if (isDef(res.result)) return res.result
				}
			}
		},
		destroy: () => {
            _r._s = true
			if (isDef(_r._p)) {
				$doWait(_r._p)
			}
		}
	}
	return _r
}
 
/**
 * <odoc>
 * <key>$fetch(aURL, aOptions) : oPromise</key>
 * Tries to fetch aURL using the provided aOptions (a map with the following possible keys: method, body, headers, requestHeaders, downloadResume,
 * connectionTimeout, uriQuery, urlEncode, login, pass, httpClient and retry). The method will return a promise that will resolve to a response object
 * with the following methods: body, bodyUsed, headers, ok, status, json, bytes, blob and text. Example:\
 * \
 * var response = $fetch("https://httpbin.org/post", { method: "POST", body: { a: 1, b: 2 }, headers: { "Content-Type": "application/json" } });\
 * response.then(function(aResponse) { print(aResponse.status); });\
 * \
 * The response object will have the following methods:\
 * \
 * - body() : returns a Java InputStream with the response body\
 * - bodyUsed : returns true if the body was already read\
 * - headers : returns a map with the response headers\
 * - ok : returns true if the response status is between 200 and 299\
 * - status : returns the response status\
 * - json() : returns the response body as a JSON object\
 * - bytes() : returns the response body as a byte array\
 * - blob() : returns the response body as a byte array\
 * - text() : returns the response body as a string\
 * \
 * </odoc>
 */
const $fetch = function(aURL, aOptions) {
	aOptions = _$(aOptions, "aOptions").isMap().default({ method: "GET"})

	ow.loadObj()
	var _h = new ow.obj.http()
	aOptions.headers = aOptions.requestHeaders
	aOptions.httpClient = _h

	var _pR = (_hc, _m) => {
		// TODO: incomplete, check https://developer.mozilla.org/en-US/docs/Web/API/Response
		var bodyUsed = false
		var _rr = $rest(aOptions)[_m + "2Stream"](aURL, aOptions.body)
		var _fn = isS => {
			var ostream = af.newOutputStream()
			ioStreamCopy(ostream, _rr)
			bodyUsed = true
			if (isS) {
				return ostream.toString()
			} else {
				return ostream.toByteArray()
			}	
		}
		return {
			body: () => _fn(true),
			bodyUsed: bodyUsed,
			headers: _hc.responseHeaders(),
			ok: _hc.responseCode() >= 200 && _hc.responseCode() < 300,
			status: _hc.responseCode(),
			json: () => jsonParse(_fn(true)),
			bytes: () => _fn(false),
			blob: () => _fn(false),
			text: () => _fn(true)
		}
	}

	return $do(() => {
		switch(aOptions.method.toUpperCase()) {
		case "GET"   : return _pR( _h, "get" ) 
		case "POST"  : return _pR( _h, "post" ) 
		case "PUT"   : return _pR( _h, "put" ) 
		case "DELETE": return _pR( _h, "delete" ) 
		case "PATCH" : return _pR( _h, "patch" ) 
		case "HEAD"  : return _pR( _h, "head" ) 
		}
	})
}

/**
 * <odoc>
 * <key>$pyStart()</key>
 * Start python process on the background. Should be stopped with $pyStop.
 * </odoc>
 */
const $pyStart = function() {
	ow.loadPython();
	ow.python.startServer();
};

/**
 * <odoc>
 * <key>$py(aPythonCodeOrFile, aInput, aOutputArray) : Map</key>
 * Executes aPythonCodeOrFile using a map aInput as variables in python and returns a map with python 
 * variables in aOutputArray.
 * </odoc>
 */
const $py = function(aPythonCode, aInput, aOutputArray) {
	$pyStart();
	if (aPythonCode.indexOf("\n") < 0 && aPythonCode.endsWith(".py") && io.fileExists(aPythonCode)) aPythonCode = io.readFileString(aPythonCode);
	return ow.python.exec(aPythonCode, aInput, aOutputArray);
};

/**
 * <odoc>
 * <key>$pyExec(aPythonCodeOrFile, aInput)</key>
 * Executes aPythonCodeOrFile using a map aInput as variables in python. The python execution will be 'standalone', with access to OpenAF functionality,
 * but no output will be returned.
 * </odoc>
 */
const $pyExec = function(aPythonCodeOrFile, aInput) {
	ow.loadPython()
	ow.python.execStandalone(aPythonCodeOrFile, aInput)
}

/**
 * <odoc>
 * <key>$pyStop()</key>
 * Stops the background python process started by $pyStart.
 * </odoc>
 */
const $pyStop = function() {
	ow.python.stopServer(__, true);
};

/**
 * <odoc>
 * <key>$openaf(aScript, aPMIn, aOpenAF, extraJavaParamsArray) : Object</key>
 * Tries to start an external process running openaf (if aOpenAF is provided, as a string or array, it will be used as the command to invoke openaf) to execute
 * aScript setting the __pm variable to aPMIn. Upon execution end the __pm contents will be returned by the function.
 * </odoc>
 */
const $openaf = function(aScript, aPMIn, aOpenAF, extraJavaParamsArray) {
	var javaPath = java.lang.System.getProperty("java.home") + java.io.File.separator + "bin" + java.io.File.separator + "java";

	if (isUnDef(aOpenAF)) {
		if (isDef(__forcedOpenAFJar)) 
			aOpenAF = [ javaPath, "-jar", __forcedOpenAFJar ]; 
		else
			aOpenAF = [ javaPath, "-jar", getOpenAFJar() ];
	} else {
		if (isString(aOpenAF)) {
			if (aOpenAF.indexOf("-jar") < 0 && aOpenAF.indexOf("java") < 0) {
				// Needs java prefixed
				aOpenAF = javaPath + " -jar " + aOpenAF;
			}
		} else if (isArray(aOpenAF)) {
			// it's okay
		} else {
			throw "Please provide a string or array for the aOpenAF parameter.";
		}
	}
	var arr = [java.lang.System.getProperty("java.home") + java.io.File.separator + "bin" + java.io.File.separator + "java"];
	if (isArray(extraJavaParamsArray)) arr = arr.concat(extraJavaParamsArray)
	
	aOpenAF = _$(aOpenAF).default(arr.concat(["-jar", getOpenAFJar()]));
	aPMIn   = _$(aPMIn).isObject().default({});
	var cmd;
	if (isArray(aOpenAF)) {
		cmd = aOpenAF;
		cmd.push("-p");
		cmd.push("-i");
		cmd.push("script");
	} else {
		cmd = aOpenAF + " -p -i script";
	}

	var separator = "-=?OpEnAf?=-";
	var res = $sh().sh(cmd, "__pm = jsonParse(" + stringify(aPMIn, __, "") + "); load('" + aScript.replace(/\\/g, "/") + "'); print('" + separator + "' + stringify(__pm, __, ''));").get(0);
	res = res.stdout.substr(res.stdout.indexOf(separator) + separator.length, res.stdout.length);
	return jsonParse(res);
};

__$f = {
	//locale: java.util.Locale.US
}
/**
 * <odoc>
 * <key>$f(aString, arg1, arg2, ...) : String</key>
 * Formats aString with arg1, arg2 and any other arguments provided using java.util.Formatter. The format is composed
 * of "%[argument_index$][flags][width][.precision]conversion". Do note that javascript numbers are converted to java.lang.Float. If you
 * need it to convert to Integer, Long, Double, Float and BigDecimal please use $ft. The javascript Date type will be converted to java Calendar.
 * So possible values:\
 * \
 *    argument_index: number\
 *    flags         : '-' (left-justified); '#'; '+' (include sign); ' ' (leading space); '0' (zero-padded); ',' (separators); '(' (enclose negative values)\
 *    conversion    : b/B (boolean), h/H (hash), s/S (string), "-" (left justify), c/C (character)\
 * \
 * Examples:\
 * \
 *    $f("Time %tT", new Date())\
 *    $f("Date: %1$tm %1te, %1tY %1$tT", new Date())\
 * \
 *    $f("%.2f", 1.9)\
 *    $f("%10.2f", 1.9)\
 * \
 * </odoc>
 */
const $f = function() {
	var ff;
	if (isDef(__$f.locale)) {
		ff = new java.util.Formatter(__$f.locale);
	} else {
		ff = new java.util.Formatter();
	}
	var f = ff.format;

	for (var k in arguments) {
		if (isDate(arguments[k])) {
			var sdf = new java.text.SimpleDateFormat();
			sdf.format(arguments[k]);
			arguments[k] = sdf.getCalendar()
		}
	}

	return String(f.apply(ff, arguments));
}

/**
 * <odoc>
 * <key>$ft(aString, arg1, arg2, ...) : String</key>
 * Equivalant to $f but number types are converted to Integer, Long, Double, Float and BigDecimal.
 * </odoc>
 */
const $ft = function() {
	var ff;
	if (isDef(__$f.locale)) {
		ff = new java.util.Formatter(__$f.locale);
	} else {
		ff = new java.util.Formatter();
	}
	var f = ff.format;

	for (var k in arguments) {
		if (isDate(arguments[k])) {
			var sdf = new java.text.SimpleDateFormat();
			sdf.format(arguments[k]);
			arguments[k] = sdf.getCalendar()
		}
		if (isNumber(arguments[k]) && !isDecimal(arguments[k])) {
			if (arguments[k] > java.lang.Integer.MAX_VALUE || arguments[k] < java.lang.Integer.MIN_VALUE) {
				arguments[k] = new java.lang.Long(arguments[k]);
			} else {
				if (arguments[k] > java.lang.BigDecimal.MAX_VALUE || arguments[k] < java.lang.BigDecimal.MIN_VALUE) {
					arguments[k] = new java.math.BigDecimal(arguments[k]);
				} else {
					arguments[k] = new java.lang.Integer(arguments[k]);
				}
			}
		}
	}

	return String(f.apply(ff, arguments));
}

const $bottleneck = function(aName, aFn) {
	if (isUnDef(global.__bottleneck)) global.__bottleneck = {};
	var parent = this;

	var __b = function(aN, aF) {
		aN = _$(aN).default("bottleneck");
		this.name = aN;
		this.attw = -1;
		this.aF = aF;
		this.ance = __cpucores * __threadPoolFactor;
		this.atomic = $atomic();
	};

	/**
	 * <odoc>
	 * <key>$bottleneck.maxWait(aMs) : Object</key>
	 * Creates a bottleneck holding the function execution for a max period of aMs.
	 * </odoc>
	 */
	__b.prototype.maxWait = function(aTTW) { this.attw = aTTW; return this; };
	/**
	 * <odoc>
	 * <key>$bottleneck.maxExec(aMaxNumber) : Object</key>
	 * Creates a bottleneck to a maximum concurrent execution number of aMaxNumber.
	 * </odoc>
	 */	
	__b.prototype.maxExec = function(aNCE) { this.ance = aNCE; return this; };
	/**
	 * <odoc>
	 * <key>$bottleneck.destroy()</key>
	 * Destroys any existing bottleneck definition.
	 * </odoc>
	 */
	__b.prototype.destroy = function() {
		delete global.__bottleneck[aName];
	};

	/**
	 * <odoc>
	 * <key>$bottleneck.exec(args) : Object</key>
	 * Creates a bottleneck aName to execute aFunction with the provided args. Returns what the function returns:\
	 * \
	 * $bottleneck("myFunc", (a, b) => { ... return result; })\
	 * .maxExec(3)\
	 * .maxWait(5000)\
	 * .exec(2, 4);\
	 * \
	 * $bottleneck("myFunc").exec(2, 2);\
	 * \
	 * </odoc>
	 */
	__b.prototype.exec = function(args) {
		var timeout = false, init = now();
		while (this.atomic.get() >= this.ance && !timeout) {
			if (this.attw > 0) {
				if ((now() - init) > this.attw) timeout = true;
				
				sleep(this.attw, true);
			} 
		}
		this.atomic.inc();
		var res;
		try {
			res = this.aF.apply(parent, arguments);
			this.atomic.dec();
		} catch(e) {
			this.atomic.dec();
			throw e;
		}
		return res;
	};

	if (isUnDef(global.__bottleneck[aName])) 
		global.__bottleneck[aName] = new __b(aName, aFn);
	else {
		if (isDef(aFn)) global.__bottleneck[aName].aF = aFn;
	}

	return global.__bottleneck[aName];
};

const $cache = function(aName) {
	if (isUnDef(global.__$cache)) global.__$cache = {}

	var __c = function(aN) {
		aN = _$(aN).default("cache")
		this.name  = aN
		this.func  = k => k
		this.attl  = __
		this.ach   = __
		this.msize = __
		this.method = "t"
		this.default = __
	}

	/**
	 * <odoc>
	 * <key>$cache.fn(aFunction) : Object</key>
	 * Defines the aFunction use to get aKey. The returned object will be cached.
	 * </odoc>
	 */
	__c.prototype.fn        = function(aFunc) { this.func   = aFunc;    return this }
	/**
	 * <odoc>
	 * <key>$cache.ttl(aTTL) : Object</key>
	 * Defines the time-to-live (aTTL) to consider a cached result as valid.
	 * </odoc>
	 */
	__c.prototype.ttl       = function(aTtl)  { this.attl   = aTtl;     return this }
	/**
	 * <odoc>
	 * <key>$cache.ch(aChannelName) : Object</key>
	 * Uses a pre-existing channel (e.g. aChannelName) as the cache channel.
	 * </odoc>
	 */
	__c.prototype.ch        = function(aCh)   { this.ach    = aCh;      return this }
	/**
	 * <odoc>
	 * <key>$cache.maxSize(aSize) : Object</key>
	 * Establishes the max number of entries cached at any given point in time.
	 * </odoc>
	 */
	__c.prototype.maxSize   = function(asize) { this.msize  = asize;    return this }
	/**
	 * <odoc>
	 * <key>$cache.inFile(aFile) : Object</key>
	 * Creates a mvs channel to hold the cache data in aFile. Note: don't use $cache.ch if you use this option.
	 * </odoc>
	 */
	__c.prototype.inFile = function(aFile) {
		$ch(this.name + "::filecache").create(1, "mvs", {
			file: aFile,
			compact: true,
			map: this.name
		})
		this.ach = this.name + "::filecache"
		return this
	}
	/**
	 * <odoc>
	 * <key>$cache.byPopularity() : Object</key>
	 * Changes the behaviour of the cache to use the most popular entries and prefer to discard the least popular ones 
	 * when the cache is full (maxSize is defined).
	 * </odoc>
	 */
	__c.prototype.byPopularity = function() {
		this.method = "p"
		return this
	}
	/**
	 * <odoc>
	 * <key>$cache.byDefault(useDefault, aDefault) : Object</key>
	 * Changes the behaviour of the cache to either use the default value (aDefault) if useDefault is true
	 * (launching the cache function in background) or try to use the previous value in the cache if useDefault 
	 * is false (if a previous value is not available the cache function will be called and the .get will wait for it).
	 * </odoc>
	 */
	__c.prototype.byDefault = function(useDefault, aDefault) {
		this.useDefault = useDefault
		this.default = aDefault
		return this
	}
	__c.prototype.create = function() {
		_$(this.func).isFunction().$_("Please provide a function (fn).")

		syncFn(() => {
			if ($ch().list().indexOf(this.name) < 0) {
				$ch(this.name).create(1, "cache", {
					func: this.func,
					ttl: this.attl,
					ch: this.ach,
					size: this.msize,
					method: this.method,
					default: this.default,
					useDefault: this.useDefault
				})
			}
		}, this.name)

		return this
	}
	/**
	 * <odoc>
	 * <key>$cache.get(aKey) : Object</key>
	 * Shortcut to use a cache channel. Returns an object that can be used like this:\
	 * \
	 * $cache("numbers")\
	 * .ttl(30000)\
	 * .fn((aKey) => { ... return result; })\
	 * .create()\
	 * \
	 * $cache("numbers").get(myKey);\
	 * \
	 * $cache("numbers").destroy();\
	 * \
	 * </odoc>
	 */
	__c.prototype.get    = function(aK) {
		if ($ch().list().indexOf(this.name) < 0) {
			this.create()
		}

		return $ch(this.name).get(aK)
	}
	__c.prototype.destroy = function() {
		if ($ch().list().indexOf(this.name) < 0) {
			this.create()
		}
		
		if (isDef(this.ach)) {
			if (isString(this.ach)) 
				$ch(this.ach).destroy()
			else
				this.ach.destroy()
		}
		$ch(this.name).destroy()
		delete global.__$cache[this.name]
	}
	__c.prototype.unset  = function(aK) {
		if ($ch().list().indexOf(this.name) < 0) {
			this.create()
		}
		
		$ch(this.name).unset(aK)
		return this
	}
	__c.prototype.size   = function() {
		if ($ch().list().indexOf(this.name) < 0) {
			this.create()
		}
		
		return $ch(this.name).size()
	}
	__c.prototype.set    = function(aK, aV) {
		if ($ch().list().indexOf(this.name) < 0) {
			this.create()
		}
		$ch(this.name).set(aK, aV)
		return this
	}
	__c.prototype.setAll = function(aK, aV) {
		if ($ch().list().indexOf(this.name) < 0) {
			this.create()
		}
		$ch(this.name).setAll(aK, aV)
		return this
	}
	__c.prototype.getAll = function() {
		if ($ch().list().indexOf(this.name) < 0) {
			this.create()
		}
		return $ch(this.name).getAll()
	};
	__c.prototype.getKeys = function() {
		if ($ch().list().indexOf(this.name) < 0) {
			this.create()
		}
		return $ch(this.name).getKeys()
	}

	if (isUnDef(global.__$cache[aName])) global.__$cache[aName] = new __c(aName)

	return global.__$cache[aName]
}

/**
 * <odoc>
 * <key>$sync() : Object</key>
 * Returns an object with a 'run(aFn)' function that will execute the provided aFn in a synchronized way.
 * The run function will lock the execution until the aFn is finished. This is useful to
 * ensure that only one thread is executing the aFn at a time.\
 * \
 * Example:\
 * \
 * var s = $sync()\
 * s.run(() => {\
 *     // Your code here, only one thread will execute this at a time\
 * })
 * </odoc>
 */
function $sync() {
	const _l = new java.util.concurrent.locks.ReentrantLock()

	const fnS = function(aFn) {
		_l.lock()
		try {
			aFn()
		} finally {
			_l.unlock()
		}
	}

	return {
		run: fnS
	}
}

/**
 * <odoc>
 * <key>$queue(anArray) : Object</key>
 * Returns an object with the following methods:\
 * - add(aItem) : adds aItem to the queue and returns true if successful\
 * - remove(aItem) : removes aItem from the queue and returns true if successful\
 * - addAll(aItems) : adds all aItems to the queue and returns true if successful\
 * - has(aItem) : returns true if aItem is in the queue\
 * - isEmpty() : returns true if the queue is empty\
 * - size() : returns the size of the queue\
 * - toArray() : returns the queue as an array\
 * - peek() : returns the first item in the queue without removing it\
 * - poll() : returns the first item in the queue and removes it\
 * 
 * The queue is implemented using a java.util.concurrent.ConcurrentLinkedQueue, which is thread-safe and allows concurrent access.\
 * If anArray is provided, it will be added to the queue using addAll.
 * </odoc>
 */
const $queue = function(anArray) {
	var _r = {
		_q    : new java.util.concurrent.ConcurrentLinkedQueue(),
		add   : aItem => Boolean(_r._q.add(aItem)),
		remove: aItem => Boolean(_r._q.remove(aItem)),
		addAll: aItems => Boolean(_r._q.addAll(aItems)),
		has   : aItem => Boolean(_r._q.contains(aItem)),
		isEmpty: () => Boolean(_r._q.isEmpty()),
		size  : () => Number(_r._q.size()),
		toArray: () => af.fromJavaArray(_r._q.toArray()),
		peek  : () => _r._q.peek(),
		poll  : () => _r._q.poll()
	}
	if (isArray(anArray)) _r.addAll(anArray)
	return _r
}

/**
 * <odoc>
 * <key>threadBoxCtrlC() : Boolean</key>
 * Meant to be use as a stopFunction for threadBox will return true if
 * Ctrl-C is detected and false otherwise. If the current terminal can't
 * support ANSI if will default to false.
 * </odoc>
 */
const threadBoxCtrlC = function() {
	if (isUnDef(__conStatus)) __initializeCon();
	var c = new Console();
	if (__conAnsi) {
		if (c.readCharNB() == 3) return true; else return false;
	} else {
		return false;
	}
}

var alert;
if (isUnDef(alert)) alert = function(msg) {
	printErr(String(msg));
};

var __timeout = {};
const setTimeout = function(aFunction, aPeriod) {
	sleep(aPeriod);
	var args = [];
	for(var i = 2; i <= arguments.length; i++) { args.push(arguments[i]); }
	aFunction.apply(this, args);
}

const setInterval = function(aFunction, aPeriod) {
	plugin("Threads");
	var t = new Threads();

	var args = [];
	for(var i = 2; i <= arguments.length; i++) { args.push(arguments[i]); }
	var pf = aFunction;
	var parent = this;

	var f = function(uuid) {
		aFunction.apply(parent, args);
	}

	var uuid = t.addThread(f);
	__timeout[uuid] = t;
	t.startAtFixedRate(aPeriod);
	return uuid;
}

const clearInterval = function(uuid) {
	var t = __timeout[uuid];
	t.stop();
	delete __timeout[uuid];
}

/**
 * <odoc>
 * <key>range(aCount, aStart, aStep) : Array</key>
 * Generates an array with aCount of numbers starting at 1. Optionally you can provide a different
 * aStart number and/or aStep increment.
 * </odoc>
 */
const range = (aCount, aStart, aStep) => {
	aStart = _$(aStart, "aStart").isNumber().default(1)
	aCount = _$(aCount, "aCount").isNumber().default(1)
	aStep  = _$(aStep, "aStep").isNumber().default(1)


	return Array.from(Array(aCount).keys(), n => (n + aStart) * aStep)
}

/**
 * <odoc>
 * <key>deleteFromArray(anArray, anIndex) : Array</key>
 * Deletes the array element at anIndex from the provided anArray. Returns the new array with the element removed.
 * </odoc>
 */
const deleteFromArray = function(anArray, anIndex) {
	anArray.splice(anIndex, 1);
	return anArray;
}

// ****
// oJob

// Hash list of oJob urls and filepaths (each key value is a the url/canonical filepath; value is [hash-alg]-[hash])
// Do note that ojob.io urls need to be converted: ojob.io/echo -> https://ojob.io/echo.json
var OJOB_INTEGRITY = getEnvsDef("OJOB_INTEGRITY", OJOB_INTEGRITY, {}, true)
// If OJOB_INTEGRITY_WARN is false oJob execution is halted if any integrity hash is found to be different
var OJOB_INTEGRITY_WARN = getEnvsDef("OJOB_INTEGRITY_WARN", OJOB_INTEGRITY_WARN, true) 
// If OJOB_INTEGRITY_STRICT is true no oJob will execute if it's integrity is not verified.
var OJOB_INTEGRITY_STRICT = getEnvsDef("OJOB_INTEGRITY_STRICT", OJOB_INTEGRITY_STRICT, false)
// If OJOB_SIGNATURE_STRICT is true no oJob will execute if it's signature is not valid.
var OJOB_SIGNATURE_STRICT = getEnvsDef("OJOB_SIGNATURE_STRICT", OJOB_SIGNATURE_STRICT, false)
// Use OJOB_SIGNATURE_KEY key java object to validate oJob signatures;
var OJOB_SIGNATURE_KEY = getEnvsDef("OJOB_SIGNATURE_KEY", OJOB_SIGNATURE_KEY, __)
// If OJOB_VALIDATION_STRICT = true no oJob will execute if the signature doesn't exist or is not valid or if it's integrity wasn't checked & passed.
var OJOB_VALIDATION_STRICT = getEnvsDef("OJOB_VALIDATION_STRICT", OJOB_VALIDATION_STRICT, false)

/**
 * <odoc>
 * <key>oJobRunFile(aFile, args, aId, aOptionsMap, isSubJob)</key>
 * Runs a oJob aFile with the provided args (arguments).
 * Optionally you can provide aId to segment these specific jobs.
 * </odoc>
 */ 
const oJobRunFile = function(aYAMLFile, args, aId, aOptionsMap, isSubJob) {
	var oo
	if (isDef(aId)) {
		loadCompiledLib("owrap_oJob_js")
		oo = new OpenWrap.oJob()
	} else {
		oo = ow.loadOJob()
	}

	aOptionsMap = _$(aOptionsMap, "aOptionsMap").isMap().default({ shareArgs: false })

	$set("res", {})
	var _h = oo.__help
	oo.__help = {}
	oo.runFile(aYAMLFile, args, aId, isSubJob, aOptionsMap)
	oo.__help = _h
}

/**
 * <odoc>
 * <key>oJobRunFileAsync(aFile, args, aId, aOptionsMap, isSubJob) : oPromise</key>
 * Runs a oJob aFile async with the provided args (arguments).
 * Optionally you can provide aId to segment these specific jobs.
 * Returns the corresponding promise.
 * </odoc>
 */
const oJobRunFileAsync = function(aYAMLFile, args, aId, aOptionsMap, isSubJob) {
	return $do(() => {
		var oo = (isDef(aId) ? new OpenWrap.oJob() : ow.loadOJob());
		return oo.runFile(aYAMLFile, args, aId, isSubJob, aOptionsMap);
	});
}

/**
 * <odoc>
 * <key>oJobRun(aJson, args, aId)</key>
 * Runs a oJob from aJson definition with the provided args (arguments).
 * Optionally you can provide aId to segment these specific jobs.
 * </odoc>
 */
const oJobRun = function(aJson, args, aId) {
	var oo;
	if (isDef(aId)) {
		loadCompiledLib("owrap_oJob_js");
		oo = new OpenWrap.oJob();
	} else {
		oo = ow.loadOJob();
	}

	var s = oo.loadJSON(aJson);
	oo.load(s.jobs, s.todo, s.ojob, args, aId, s.init);
	oo.start(args, true, aId);
}

/**
 * <odoc>
 * <key>oJobRunJob(aJob, args, aId, waitForFinish) : boolean</key>
 * Shortcut for ow.oJob.runJob. Please see help for ow.oJob.runJob.
 * Optionally you can provide aId to segment this specific job. If aJob is a string it will try to retrieve the job
 * from the jobs channel. Returns true if the job executed or false otherwise (e.g. failed deps).
 * </odoc>
 */
const oJobRunJob = function(aJob, args, aId, rArgs) {
	var oo;
	if (isDef(aId)) {
		loadCompiledLib("owrap_oJob_js");
		oo = new OpenWrap.oJob();
		oo.__ojob = clone(ow.oJob.__ojob)
	} else {
		oo = ow.loadOJob();
	}
	aJob = oo.parseTodo(aJob)
	if (isString(aJob)) {
		if (isUnDef(aId)) aId = "";
		var job = oo.getJobsCh().get({ name: aJob })
		
		if (isDef(job)) {
			return oo.runJob(job, args, aId, rArgs, rArgs);
		} else {
			throw "Job '" + aJob + "' not found.";
		}
	} else {
		var job = oo.getJobsCh().get({ name: aJob.name })
		if (isDef(job)) {
			return oo.runJob(merge(job, aJob), args, aId, rArgs, rArgs)
		} else {
			return oo.runJob(aJob, args, aId, rArgs, rArgs)
		}
	}
}

/**
 * <odoc>
 * <key>$job(aJob, args, aId, isolate) : Object</key>
 * Shortcut to oJobRunJob and ow.oJob.runJob to execute aJob with args and returned the changed arguments.
 * Optionally aId can be also provided. If isolate=true it will also clean the key 'res' and try to return the result of ow.oJob.output.
 * </odoc>
 */
const $job = function(aJob, args, aId, isolate) {
	isolate = _$(isolate, "isolate").isBoolean().default(false)

	if (isUnDef(aId)) aId = "|" + genUUID()
	if (isolate) {
		$set("res", {})
		var _b = oJobRunJob(aJob, merge(args, { __format: "key", __key: aId}), aId, true)
		if (_b) {
			var _r = $get(aId)
			$unset(aId)
			return _r
		} else {
			return __
		}
	} else {
		return oJobRunJob(aJob, args, aId, true)
	}
}

/**
 * <odoc>
 * <key>oJobRunJobAsync(aJob, args, aId) : oPromise</key>
 * Creates an oPromise to run the same arguments for oJobRunJob thus executing the job async. Returns
 * the generate oPromise.
 * </odoc>
 */
const oJobRunJobAsync = function(aJob, args, aId) {
	return $doV(() => {
		oJobRunJob(aJob, args, aId);
		return true
	});
}

/**
 * <odoc>
 * <key>getEnv(anEnvironmentVariable) : String</key>
 * Returns the current value of the operating system anEnvironmentVariable.
 * </odoc>
 */
const getEnv = function(anEnvironmentVariable) {
	var r = java.lang.System.getenv().get(anEnvironmentVariable);
	if (isNull(r)) return __;
	return String(r); 
}

/**
 * <odoc>
 * <key>loadJSYAML()</key>
 * Loads the JS-YAML library.
 * </odoc>
 */
const loadJSYAML = function() {
	loadCompiledLib("js-yaml_js", __, __, true)
}

/**
 * <odoc>
 * <key>loadOAFP()</key>
 * Loads the OpenAF processor that can be used with the function oafp. Example:\
 * \
 * # Thread unsafe example\
 * oafp({ data: "(abc: 123, xyz: 456)", out: "pm" })\
 * sprint(__pm._map)\
 * \
 * # Thread safe example\
 * oafp({ data: "(abc: 123, xyz: 456)", out: "key", __key: "myresult" })\
 * sprint($get("myresult"))\
 * \
 * </odoc>
 */
const loadOAFP = function() {
	if (isDef(global.oafp)) return
	let origExpr = __expr, origParams = global.params

	__expr = "____ojob=true"
	global.params = { ____ojob: true }
	if (isDef(getOPackPath("oafproc"))) {
		loadLib(getOPackPath("oafproc") + "/oafp.js")
	} else {
		loadLib(getOpenAFJar() + "::js/oafp.js")
	}

	__expr = origExpr
	global.params = origParams
}

loadCompiledLib("openafsigil_js")

/**
 * <odoc>
 * <key>_i$(aValue, aPrefixMessage) : Object</key>
 * Same as _$ but if aValue is not defined and aPrefixMessage if defined it will use ask() or askEncrypt() to 
 * interactively ask the user for the value with the prompt "[aPrefixMessage]: ". Should only be
 * used if user interaction is expected but to force not be interactiv you can set __i$interactive to false). Note: askEncrypt will be used if aPrefixMessage has any reference to "secret" or "pass".
 * </odoc>
 */
var __i$interactive = true;
const _i$ = (aValue, aPrefixMessage) => {
	if (__i$interactive && isUnDef(aValue) && isString(aPrefixMessage)) {
		if (aPrefixMessage.toLowerCase().indexOf("secret") >= 0 || 
			aPrefixMessage.toLowerCase().indexOf("pass") >= 0
		   ) {
			aValue = askEncrypt(aPrefixMessage + ": ");
		} else {
			aValue = ask(aPrefixMessage + ": ");
		}
		if (aValue == "") aValue = __;
	}
	return _$(aValue, aPrefixMessage);
}

var __correctYAML = false;

const __gHDir = () => {
	var _e = getEnv("OAF_HOME")
	if (isDef(_e)) return _e
	var d = String(java.lang.System.getProperty("user.home"))
	if (io.fileInfo(d).permissions.indexOf("w") < 0) d = __flags.ALTERNATIVE_HOME
	return d
}

/**
 * <odoc>
 * <key>newFn() : Function</key>
 * Builds a new Function handling any debug needs if necessary.
 * </odoc>
 */
const newFn = function() {
	var args = []
	for(var i in arguments) {
		args.push(arguments[i])
	}
	
	if (isDef(global.__debugLoadPreParser)) {
		var code = args.pop()
		code = ow.debug.debug(code, __, true)
		args.push(code)
	}
	//return af.eval("(function(" + args.join(",") + "){" + code + "})")
	return Function.apply(null, args)
}

/**
 * <odoc>
 * <key>af.runFromExternalClass(aClassName, aPath)</key>
 * Tries to "execute" aClassName from a previously compiled OpenAF script, with af.compileToClasses, on aPath.\
 * \
 * Example:\
 *    af.compileToClasses("MyClass", "var myOpen = 'AF Class'", ".");\
 *    af.runFromExternalClass("MyClass", ".");\
 *    myOpen; // AF Class\
 * \
 * </odoc>
 */
AF.prototype.runFromExternalClass = function(aClass, aPath) {
	try {
		af.runFromClass(af.getClass(aClass).newInstance());
	} catch(e) {
		if (String(e).match(/ClassNotFoundException/)) {
			var cl = af.externalClass([ (new java.io.File(aPath)).toURI().toURL() ], aClass);
			af.runFromClass(cl.newInstance());
		}
	}
};
/**
 * <odoc>
 * <key>AF.fromJavaArray(aJavaArray) : Array</key>
 * Tries to convert aJavaArray into a native an array.
 * </odoc>
 */
AF.prototype.fromJavaArray = function(aJavaArray) {
	var ar = [];
	for(var el in aJavaArray) {
		ar.push(aJavaArray[el]);
	}
	return ar;
};

/**
 * <odoc>
 * <key>AF.swap(anArray, anIndex1, anIndex2) : Array</key>
 * Swaps the elements at anIndex1 and anIndex2 in anArray.
 * Returns the new array with the elements swapped.
 * </odoc>
 */
AF.prototype.swap = function(anArray, anIndex1, anIndex2) {
	_$(anIndex1, "anIndex1").isNumber().$_()
	_$(anIndex2, "anIndex2").isNumber().$_()
	_$(anArray, "anArray").isArray().$_("Please provide an array to swap elements in.");

	var pp = java.util.ArrayList(anArray)
	java.util.Collections.swap(pp, anIndex1, anIndex2)
	return af.fromJavaArray(pp)
}

/**
 * <odoc>
 * <key>AF.printStackTrace(aFunction) : Object</key>
 * Executes aFunction but if it throws an exception and the exception is a Java exception
 * it will print the exception's stack trace.
 * </odoc>
 */
AF.prototype.printStackTrace = function(aFn) {
	try {
		return aFn();
	} catch(e) {
		if (isDef(e.javaException)) 
			e.javaException.printStackTrace();
		else
			throw e;
	}
};
/**
 * <odoc>
 * <key>AF.getEncoding(anArrayOfBytesORString) : String</key>
 * Given anArrayOfBytesORString will try to detect which encode is used and returns a string with the identified charset encoding.
 * </odoc>
 */
AF.prototype.getEncoding = function(aBytesOrString) {
	var res; 

	if (isString(aBytesOrString)) aBytesOrString = af.fromString2Bytes(aBytesOrString);

	var detector = new Packages.org.mozilla.universalchardet.UniversalDetector(null);
	for(var ii = 0; ii < aBytesOrString.length && !detector.isDone(); ii = ii + __flags.IO.bufferSize) { 
		detector.handleData(aBytesOrString, ii, ((aBytesOrString.length - ii) >= __flags.IO.bufferSize ? __flags.IO.bufferSize : (aBytesOrString.length - __flags.IO.bufferSize)));
	}
	detector.dataEnd();
	res = detector.getDetectedCharset();
	detector.reset();

	return res;
};

/**
 * <odoc>
 * <key>AF.setInteractiveTerminal()</key>
 * Sets the current terminal to be interactive (no echo, no buffering).
 * </odoc>
 */
AF.prototype.setInteractiveTerminal = () => isDef(__con) ? __con.getTerminal().settings.set("-icanon min 1 -echo") : __
/**
 * <odoc>
 * <key>AF.unsetInteractiveTerminal()</key>
 * Unsets the current terminal to be interactive (no echo, no buffering).
 * </odoc>
 */
AF.prototype.unsetInteractiveTerminal = () => isDef(__con) ? __con.getTerminal().settings.set("icanon echo") : __

__YAMLformat = {
  indent: 2,
  arrayIndent: false,
  lineWidth: -1,
  unsafe: true
};
/**
 * <odoc>
 * <key>AF.toYAML(aJson, multiDoc, sanitize, shouldColor) : String</key>
 * Tries to dump aJson into a YAML string. If multiDoc = true and aJson is an array the output will be multi-document. If sanitize = true all Java objects will be converted to avoid parsing errors.
 * </odoc>
 */
AF.prototype.toYAML = function(aJson, multiDoc, sanitize, shouldColor) { 
	loadJSYAML()
	if (sanitize) {
		aJson = clone(aJson)
		traverse(aJson, (aK, aV, aP, aO) => {
			if (isJavaObject(aV)) aO[aK] = String(aV)
		})
	}
	var o = { indent: __YAMLformat.indent, noArrayIndent: !__YAMLformat.arrayIndent, lineWidth: __YAMLformat.lineWidth }
	var _r
	if (isArray(aJson) && multiDoc) {
		_r = aJson.map(y => jsyaml.dump(y, o)).join("\n---\n\n")
	} else {
		_r = jsyaml.dump(aJson, o)
	}
	if (shouldColor) {
		var fn = (o, s) => {
			s = s.trim()
			if (s == "true" || s == "false") s = toBoolean(s)
			switch(descType(s)) {
			case "string": return ansiColor(__colorFormat.string, o)
			case "number": return ansiColor(__colorFormat.number, o)
			case "boolean": return ansiColor(__colorFormat.boolean, o)
			case "date": return ansiColor(__colorFormat.date, o)
			default: return o
			} 
		}
		_r = pForEach(_r.split("\n"), s => {
			var change = false
			if (!change && /^(\-|\s+\-)([^(\#|\/\/|\:)]+)\:( +.*)?$/.test(s)) {
				// key in array
				if (!/^(\-|\s+\-)\s+['"][^'"]+:/.test(s.trim())) {
					s = s.replace(/^(\-|\s+\-)([^(\#|\/\/|\:)]+)\:( +.*)?$/, ansiColor(__colorFormat.key, "$1") + ansiColor(__colorFormat.key, "$2:") + fn("$3", s.replace(/^(\-|\s+\-)([^(\#|\/\/|\:)]+)\:( +.*)?$/, "$3")))
					change = true
				}
			}
			if (!change && /^(\-|\s+\-)/.test(s)) {
				// array
				s = s.replace(/^(\-|\s+\-)(.+)/, ansiColor(__colorFormat.default, "$1") + fn("$2", s.replace(/^(\-|\s+\-)(.+)/, "$2")))
				change = true
			}
			if (!change && /^([^(\#|\/\/|\:)][^\:]*)\:( +.*)?$/.test(s)) {
				// key with value
				s = s.replace(/^([^(\#|\/\/|\:)][^\:]*)\:( +.*)?$/, ansiColor(__colorFormat.key, "$1:") + fn("$2", s.replace(/^([^(\#|\/\/|\:)][^\:]*)\:( +.*)?$/, "$2")))
				change = true
			} 
			/*if (/((\#|\/\/)+.+)$/.test(s)) {
				// comment
				s = s.replace(/((\#|\/\/)+.+)$/, ansiColor("faint,italic", "$1"))	
				change = true
			}*/
			if (!change) {
				// default
				s = ansiColor(__colorFormat.default, s)
			}

			return s
		}).join("\n")
	}
	return _r
}

/**
 * <odoc>
 * <key>AF.fromYAML(aYaml) : Object</key>
 * Tries to parse aYaml into a javascript map.
 * </odoc>
 */
AF.prototype.fromYAML = function(aYAML, unsafe) { 
	loadJSYAML(); 
	//if (__correctYAML) aYAML = aYAML.replace(/^(\t+)/mg, (m) => { if (isDef(m)) return repeat(m.length, "  "); }); 
		var res;
		if (__YAMLformat.unsafe && unsafe) {
				var t = new jsyaml.Type('tag:yaml.org,2002:js/eval', { kind: 'scalar', resolve: function() { return true }, construct: function(d){ return eval(d) }, predicate: isString, represent: function(o) { return o } });
				var s = jsyaml.DEFAULT_SCHEMA.extend([t]); 
			res = jsyaml.loadAll(aYAML, { schema: s }); 
		} else {
		res = jsyaml.loadAll(aYAML); 
		}
	if (isArray(res) && res.length == 1) {
		return res[0];
	} else {
		return res;
	}
};

/**
 * <odoc>
 * <key>af.fromTOML(aTOML) : Object</key>
 * Tries to parse aTOML into a javascript object
 * </odoc>
 */
AF.prototype.fromTOML = function(aTOML) {
	var tm = new Packages.com.fasterxml.jackson.dataformat.toml.TomlMapper()
	return jsonParse(tm.readTree(aTOML).toString())
}

/**
 * <odoc>
 * <key>io.readFileTOML(aFile) : Object</key>
 * Tries to read aFile and parse it as TOML into a javascript object.
 * </odoc>
 */
IO.prototype.readFileTOML = function(aFile) {
	return af.fromTOML(new java.io.File(aFile))
}

/**
 * <odoc>
 * <key>af.toTOML(aObj) : String</key>
 * Tries to convert aObj into a TOML string.
 * </odoc>
 */
AF.prototype.toTOML = function(aObj) {
	var tm = new Packages.com.fasterxml.jackson.dataformat.toml.TomlMapper()
	if (isMap(aObj)) {
		return String(tm.writeValueAsString(af.toJavaMap(aObj)))
	} else {
		return __
	}
}

/**
 * <odoc>
 * <key>af.nvl(aValue, aDefault) : Object</key>
 * Returns aValue if it is defined or aDefault otherwise.
 * </odoc>
 */
AF.prototype.nvl = (aValue, aDefault) => ("undefined" !== typeof aValue) && (aValue != null) ? aValue : aDefault

/**
 * <odoc>
 * <key>io.writeFileTOML(aFile, aObj)</key>
 * Tries to write aObj into aFile as TOML.
 * </odoc>
 */
IO.prototype.writeFileTOML = function(aFile, aObj) {
	io.writeFileString(aFile, af.toTOML(aObj))
}

/**
 * <odoc>
 * <key>io.unzip(zipFile, targetDir, logFn, logErrFn)</key>
 * Tries to unzip a zipFile into targetDir. Optionally you can provide a logFn and logErrFn to log the progress.
 * The logFn will receive the following object:\
 * \
 *   { type: "file" | "dir", source: [zip entry], target: [targetPath] }\
 * \
 * </odoc>
 */
IO.prototype.unzip = function(zipFile, targetDir, logFn, logErrFn) {
	logFn     = _$(logFn, "logFn").isFunction().default(print)
	logErrFn  = _$(logErrFn, "logErrFn").isFunction().default(printErr)
	zipFile   = _$(zipFile, "zipFile").isString().$_()
	targetDir = _$(targetDir, "targetDir").isString().default(".")
 
	var fis = new java.io.FileInputStream(zipFile)
	var zis = new java.util.zip.ZipInputStream(fis)

	var ne = zis.getNextEntry()
	while (!isNull(ne)) {
		var p = String(ne.getName()).lastIndexOf("/")
		var _targetDir = targetDir + "/" + String(ne.getName()).substring(0, p)
		var _targetFile = String(ne.getName()).substring(p + 1)

		if (!io.fileExists(_targetDir)) {
			try {
				logFn("Creating dir " + _targetDir, {
					type: "dir",
					target: _targetDir
				})
				io.mkdir(_targetDir)
			} catch(e) {
				logErrFn("ERROR: [" + _targetDir + "] " + e, e)
			}
		}

		if (!ne.isDirectory() && _targetFile.length > 0) {
			try {
				logFn("Extracting " + String(ne.getName()) + " -> " + _targetDir + "/" + _targetFile, {
					type: "file",
					source: String(ne.getName()),
					target: _targetDir + "/" + _targetFile
				})
				var wtmp = io.writeFileStream(_targetDir + "/" + _targetFile)
				Packages.org.apache.commons.io.IOUtils.copyLarge(zis, wtmp)
				wtmp.close()
			} catch(e) {
				logErrFn("ERROR: [" + _targetDir + " | " + _targetFile + "] " + e, e)
			}
		}
		
		zis.closeEntry()
		ne = zis.getNextEntry()
	}
}

/**
 * <odoc>
 * <key>io.zip(targetDir, zipFile, logFn, logErrFn)</key>
 * Tries to zip a targetDir into a zipFile. Optionally you can provide a logFn and logErrFn to log the progress.
 * The logFn will receive the following object:\
 * \
 *   { type: "file" | "dir", source: [io.listFile entry], target: [targetPath] }\
 * \
 * </odoc>
 */
IO.prototype.zip = function(targetDir, zipFile, logFn, logErrFn) {
	logFn     = _$(logFn, "logFn").isFunction().default(print)
	logErrFn  = _$(logErrFn, "logErrFn").isFunction().default(printErr)
	targetDir = _$(targetDir, "targetDir").isString().$_()
	zipFile   = _$(zipFile, "zipFile").isString().$_()

	var fos = new java.io.FileOutputStream(zipFile)
	var zos = new java.util.zip.ZipOutputStream(fos)

	listFilesRecursive(targetDir).forEach(f => {
		try {
			var zipEntryName = f.filepath.substring(targetDir.length + 1)
			if (f.isFile) {
				logFn("Adding " + f.filepath + " to zip as " + zipEntryName, {
					type: "file",
					source: f,
					target: zipEntryName
				})
				var fis = new java.io.FileInputStream(f.filepath)
				zos.putNextEntry(new java.util.zip.ZipEntry(zipEntryName))
				Packages.org.apache.commons.io.IOUtils.copyLarge(fis, zos)
				zos.closeEntry()
				fis.close()
			} else {
				logFn("Adding directory " + f.filepath + " to zip as " + zipEntryName, {
					type: "dir",
					source: f,
					target: zipEntryName + "/"
				})
				zos.putNextEntry(new java.util.zip.ZipEntry(zipEntryName + "/"))
				zos.closeEntry()
			}
		} catch(e) {
			logErrFn("ERROR: [" + f.filepath + "] " + e, e)
		}
	})

	zos.close()
	fos.close()
}

/**
 * <odoc>
 * <key>io.lz4(anInput) : bytes</key>
 * Compresses anInput using LZ4 compression and returns the compressed bytes.
 * </odoc>
 */
IO.prototype.lz4 = function(anInput) {
	if (isUnDef(anInput)) return anInput
	if (isMap(anInput) || isArray(anInput)) anInput = stringify(anInput, __, true)

	var byteOut
	if (isString(anInput)) anInput = af.fromString2Bytes(anInput)
	if (isJavaArray(anInput) && !isJavaObject(anInput)) {
		// It's not a Java stream
		byteOut = new java.io.ByteArrayOutputStream()
	} else {
		byteOut = anInput
	}
	
	var lz4Out
	try {
		lz4Out = new org.apache.commons.compress.compressors.lz4.FramedLZ4CompressorOutputStream(byteOut)
		lz4Out.write(anInput)
	} catch(e) {
		throw e
	} finally {
		if (isDef(lz4Out)) lz4Out.close()
	}
	return byteOut.toByteArray()
}

/**
 * <odoc>
 * <key>io.readFileLZ4Stream(aFile) : InputStream</key>
 * Reads aFile as a LZ4 compressed file and returns the InputStream to read
 * from. This is useful to read large files that are compressed with LZ4 without decompressing them
 * into memory.
 * </odoc>
 */
IO.prototype.writeFileLZ4Stream = function(aFile) {
	var byteOut = io.writeFileStream(aFile)
	var lz4Out = new org.apache.commons.compress.compressors.lz4.FramedLZ4CompressorOutputStream(byteOut)
	return lz4Out
}

/**
 * <odoc>
 * <key>io.unlz4(anInput) : Map/String</key>
 * Decompresses anInput using LZ4 compression and returns the decompressed map or string.
 * </odoc>
 */
IO.prototype.unlz4 = function(anInput) {
	if (isUnDef(anInput)) return anInput
	
	var byteIn
	if (isJavaArray(anInput) && !isJavaObject(anInput)) {
		// It's not a Java stream
		byteIn = new java.io.ByteArrayInputStream(anInput)
	} else {
		byteIn = anInput
	}

	var resultOut = new java.io.ByteArrayOutputStream(), lz4In
	try {
		lz4In = new org.apache.commons.compress.compressors.lz4.FramedLZ4CompressorInputStream(byteIn)
		var buffer = newJavaArray(java.lang.Byte.TYPE, __flags.IO.bufferSize)
		var len = lz4In.read(buffer)
		while (len !== -1) {
			resultOut.write(buffer, 0, len)
			len = lz4In.read(buffer)
		}
	} catch(e) {
		throw e
	} finally {
		if (isDef(lz4In)) lz4In.close()
	}

	var out = resultOut.toString("UTF-8")
	return jsonParse(out)
}

/**
 * <odoc>
 * <key>io.readFileLZ4Stream(aFile) : InputStream</key>
 * Reads aFile as a LZ4 compressed stream and returns the InputStream to read from.
 * This is useful to read large files that are compressed with LZ4 without decompressing them
 * into memory.
 * </odoc>
 */
IO.prototype.readFileLZ4Stream = function(aFile) {
	var byteIn = io.readFileStream(aFile)
	var lz4In = new org.apache.commons.compress.compressors.lz4.FramedLZ4CompressorInputStream(byteIn)
	return lz4In
}

/**
 * <odoc>
 * <key>AF.toSLON(aObject, aTheme) : String</key>
 * Converts aObject map/array into SLON representation (see more in help for ow.format.toSLON)
 * </odoc>
 */
AF.prototype.toSLON = function(aObject, aTheme) {
	ow.loadFormat();
	return ow.format.toSLON(aObject, aTheme);
}

/**
 * <odoc>
 * <key>AF.toCSLON(aObject, aTheme) : String</key>
 * Converts aObject map/array into SLON representation with ansi colors (see more in help for ow.format.toCSLON)
 * </odoc>
 */
AF.prototype.toCSLON = function(aObject, aTheme) {
	ow.loadFormat()
	return ow.format.toCSLON(aObject, aTheme)
}

/**
 * <odoc>
 * <key>AF.fromSLON(aString) : Map</key>
 * Converts a SLON (https://github.com/nmaguiar/slon) string representation into the original map.
 * </odoc>
 */
AF.prototype.fromSLON = function(aString) {
	if (!isString(aString) || aString == "" || isNull(aString)) return ""

	var _sp = loadCompiledRequire("slonParse_js")
	return _sp.parse(aString)
}

/**
 * <odoc>
 * <key>AF.fromJSSLON(aString) : Object</key>
 * Tries to convert the provided aString into an object. The string might be JSON or SLON.
 * </odoc>
 */
AF.prototype.fromJSSLON = function(aString) {
	if (!isString(aString) || aString == "" || isNull(aString)) return aString

	try {
		aString = aString.trim()
		if (aString.startsWith("$raw$")) return aString.substring(5)
		if (aString.startsWith("{") || /^\[\s*\{.+\}\s*\]$/.test(aString)) {
			return jsonParse(aString, __, __, true)
		} else {
			return af.fromSLON(aString)
		}
	} catch(e) {
		return aString
	}
}

/**
 * <odoc>
 * <key>AF.fromNLinq(aString) : Map</key>
 * Converts a nLinq chained command line string representation into a suitable map to be used with $from.query.
 * </odoc>
 */
AF.prototype.fromNLinq = function(aString) {
	if (!isString(aString) || aString == "" || isNull(aString)) return {}

	var _np = loadCompiledRequire("nlinqParse_js")
	return _np.parse(aString)
}

/**
 * <odoc>
 * <key>AF.fromSQL(aString) : Map</key>
 * Converts a SQL expression into an ASP map.
 * </odoc>
 */
AF.prototype.fromSQL = function(aString) {
	if (!isString(aString) || aString == "" || isNull(aString)) return {}

	var _np = loadCompiledRequire("sqlParse_js")
	return _np.parse(aString)
}

/**
 * <odoc>
 * <key>AF.fromSQL2NLinq(aSQL) : Map</key>
 * Converts a SQL expression into a suitable map to be used with $from.query.
 * </odoc>
 */
AF.prototype.fromSQL2NLinq = function(sql, preParse) {
	var ast = (isDef(preParse) ? preParse : af.fromSQL(sql))

	var _r = { transform: [] }
	if (isDef(ast) && isArray(ast.ast)) {
	  var _ast = ast.ast[0]
  
	  // SELECT
	  if (_ast.type == "select") {
		// from
		if (isArray(_ast.from)) {
			_r.from = _ast.from[0].table
		}
		// columns
		if (isArray(_ast.columns)) {
		  var everything = false
		  _r.select = {}
		  _ast.columns.forEach(c => {
			if (c.expr.column == "*") everything = true
			if (isDef(c.expr) && c.expr.type == "column_ref" && c.expr.column != "*") {
			  _r.select[c.expr.column] = ""
			}
			if (isDef(c.expr) && c.expr.type == "double_quote_string") {
			  _r.select[c.expr.value] = ""
			}
		  })
		  if (everything) delete _r.select
		}
		// where
		if (isMap(_ast.where)) {
		  _r.where = []
  
		  var _begin = (p) => _r.where.push({ cond: (p ? "or" : "and") + "Begin", args: [] })
		  var _end   = () => _r.where.push({ cond: "end", args: [] })

		  var _operator = (op, isOr, isNot) => {
			var _a = op.left
			var _b = op.right
			var _p
  
			switch(op.operator) {
			case "<" : _p = isOr ? (isNot ? "orNotL" : "orL") : (isNot ? "notL" : "l"); _r.where.push({ cond: _p + 'ess', args: [ (isDef(_a.value) ? _a.value : _a.column), _b.value ]}); break
			case ">" : _p = isOr ? (isNot ? "orNotG" : "orG") : (isNot ? "notG" : "g"); _r.where.push({ cond: _p + 'reater', args: [ (isDef(_a.value) ? _a.value : _a.column), _b.value ]}); break
			case "<=": _p = isOr ? (isNot ? "orNotL" : "orL") : (isNot ? "notL" : "l"); _r.where.push({ cond: _p + 'essEquals', args: [ (isDef(_a.value) ? _a.value : _a.column), _b.value ]}); break
			case ">=": _p = isOr ? (isNot ? "orNotG" : "orG") : (isNot ? "notG" : "g"); _r.where.push({ cond: _p + 'reaterEquals', args: [ (isDef(_a.value) ? _a.value : _a.column), _b.value ]}); break
			case "<>":
			case "!=": _p = isOr ? (!isNot ? "orNotE" : "orE") : (!isNot ? "notE" : "e"); _r.where.push({ cond: _p + 'quals', args: [ (isDef(_a.value) ? _a.value : _a.column), _b.value ]}); break
			case "=" : _p = isOr ? (isNot ? "orNotE" : "orE") : (isNot ? "notE" : "e"); _r.where.push({ cond: _p + 'quals', args: [ (isDef(_a.value) ? _a.value : _a.column), _b.value ]}); break
  
			case "RLIKE":
			case "LIKE" : 
				_p = isOr ? (isNot ? "orNotM" : "orM") : (isNot ? "notM" : "m")
				var _re = "^" + _b.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[%_]|\\[[^]]*\\]|[^%_[]+/g, function(match) {
					if (match === "%") {
						return ".*"
					}
					if (match === "_") {
						return "."
					}
					if (match.startsWith("[") && match.endsWith("]")) {
						return match
					}
					return match
				}) + "$"

				_r.where.push({ cond: _p + "atch", args: [ (isDef(_a.value) ? _a.value : _a.column), _re ] })
				break
			case "NOT LIKE" : 
				_p = isOr ? "orNotM" : "notM"
				var _re = "^" + _b.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[%_]|\\[[^]]*\\]|[^%_[]+/g, function(match) {
					if (match === "%") {
						return ".*"
					}
					if (match === "_") {
						return "."
					}
					if (match.startsWith("[") && match.endsWith("]")) {
						return match
					}
					return match
				}) + "$"

				_r.where.push({ cond: _p + "atch", args: [ (isDef(_a.value) ? _a.value : _a.column), _re ] })
				break

			case "AND": _begin(op, false); _process(_a, false, isNot); _process(_b, false, isNot); _end(); break
			case "OR" : _begin(op, true); _process(_a, false, isNot); _process(_b, true, isNot); _end(); break
  
			case "IS"     : _p = isOr ? (isNot ? "orNotE" : "orE") : (isNot ? "notE" : "e"); _r.where.push({ cond: _p + 'quals', args: [ (isDef(_a.value) ? _a.value : _a.column), _b.value ]}); break
			case "IS NOT" : _p = isOr ? (isNot ? "orE" : "orNotE") : (isNot ? "e" : "notE"); _r.where.push({ cond: _p + 'quals', args: [ (isDef(_a.value) ? _a.value : _a.column), _b.value ]}); break
			case "REGEXP" : _p = isOr ? (isNot ? "orNotM" : "orM") : (isNot ? "notM" : "m"); _r.where.push({ cond: _p + "atch", args: [ (isDef(_a.value) ? _a.value : _a.column), _b.value ] }); break
			case "BETWEEN": _p = isOr ? (isNot ? "orNotB" : "orB") : (isNot ? "notB" : "b"); _r.where.push({ cond: _p + "etweenEquals", args: [ (isDef(_a.value) ? _a.value : _a.column), _b.value[0].value, _b.value[1].value ] }); break

			case "IN":
				_p = isOr ? (isNot ? "orNotM" : "orM") : (isNot ? "notM" : "m")
				var _vs = "^(" + _b.value.map(r => r.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|") + ")$"
				_r.where.push({ cond: _p + "atch", args: [ (isDef(_a.value) ? _a.value : _a.column), _vs ] });
				break
			}
		  }
  
		  var _process = (op, isOr, isNot) => {
			switch(op.type) {
			case "binary_expr": 
				_operator(op, isOr, isNot)
				break
			case "function"   : _operator(op.args.value[0], isOr, true); break;
			}
		  }
		  
		  _process(_ast.where)
		}
		// order by
		if (isArray(_ast.orderby)) {
		  var _args = []
		  _ast.orderby.forEach(k => {
			if (k.expr.type == "column_ref") {
			  if (k.type == "DESC") {
				_args.push("-" + (isDef(k.expr.value) ? k.expr.value : k.expr.column))
			  } else {
				_args.push((isDef(k.expr.value) ? k.expr.value : k.expr.column))
			  }
			}
		  })
		  _r.transform.push({ func: "sort", args: _args })
		}
		// limit
		if (isMap(_ast.limit)) {
		  if (isArray(_ast.limit.value)) {
			if (_ast.limit.value[0].type == "number") _r.transform.push({ func: "limit", args: [ _ast.limit.value[0].value ] })
		  }
		}
	  }
	}
  
	return _r
}

/**
 * <odoc>
 * <key>$llm(aModel) : $llm</key>
 * Shortcut for $gpt on the owrap.AI library.
 * </odoc>
 */
const $llm = function(aModel) {
	if (global.$gpt) return $gpt(aModel)
	ow.loadAI()
	return $gpt(aModel)
}

/**
 * <odoc>
 * <key>$sql(aObject, aSQL, aMethod) : Array</key>
 * Given an aObject (map or array) will try to execute aSQL (SQL expression) and return the corresponding results.
 * Optionally you can provide aMethod to be used (e.g. "auto" (default) or "nlinq" or "h2"). "nlinq" it's the fastest but doesn't
 * support aggregations or multi-field combinations; "h2" is the more complete but will require a lot more resources, it's slower.\
 * \
 * NOTE: In "h2" you can use the table _TMP for your queries.
 * </odoc>
 */
const $sql = function(aObj, aSQL, aMethod) {
	var _sql, chain = false
	
	if (isUnDef(aObj) || (isDef(aObj) && isUnDef(aSQL))) chain = true
	if (isDef(aSQL)) aSQL = aSQL.trim()

	// Determine method ot use
	if (chain) aMethod = "h2"
	if (isUnDef(aMethod)) {
		if (__flags.SQL_QUERY_METHOD == "auto") {
			_sql = af.fromSQL(aSQL)
			if (isDef(_sql) && isArray(_sql.ast) && _sql.ast.length > 0) {
				if (_sql.ast[0].groupby != null ||
					aSQL.match(/FROM +_TMP(,|$| )/i) ||
					$from(_sql.ast[0].columns)
					.notEquals("expr.type", "column_ref")
					.notEquals("expr.type", "double_quote_string")
					.any() ||
					Object.keys(searchValues(_sql.ast[0], "function"))
					.filter(r => r.endsWith(".type"))
					.length > 0) {
						aMethod = "h2"
				}
			}
		} else {
			aMethod = __flags.SQL_QUERY_METHOD
		}
	}

	if (aMethod != "h2") {
		if (isUnDef(_sql)) _sql = af.fromSQL(aSQL)
		var _r = af.fromSQL2NLinq(aSQL, _sql)
		return $from(isDef(_r.from) ? $$(aObj).get(_r.from) : aObj).query(_r)
	} else {
		let db, tf, defs = {}
		ow.loadObj()

		let createDB = () => {
			if (isMap(aObj) && isDef(aObj.db)) {
				db = aObj.db
			} else {
				var _n = nowNano()
				if (__flags.SQL_QUERY_H2_INMEM) {
					db = createDBInMem("t" + _n)
				} else {
					tf = io.createTempFile("openaf_query")
					db = new DB("jdbc:h2:" + tf, "sa", "sa")
				}
			}
			db.convertDates(true)
		}

		let __objGetSamples = aObj => {
			var r = new Set()
			if (isArray(aObj)) {
				if (aObj.length > 0) {
					var s = Math.min(__flags.SQL_QUERY_COLS_DETECT_SAMPLE, aObj.length)
					for(var i = 0; i < s; i++) {
						r.add(aObj[Math.floor(Math.random() * aObj.length)])
					}
				}
			}
			return Array.from(r)
		}

		let __sql = {
			close: () => {
				db.close()
				if (isDef(tf)) io.rm(tf)
			},
			getTableDef: (aTable) => {
				aTable = _$(aTable, "aTable").isString().default("_TMP")
				return defs[aTable]
			},
			streamTable: (aTable, aStreamReadFn, aErrFn, aBufferSize, aFieldOveride) => {
				aTable = _$(aTable, "aTable").isString().default("_TMP")
				aStreamReadFn = _$(aStreamReadFn, "aStreamReadFn").isFunction().$_()
				aBufferSize = _$(aBufferSize, "aBufferSize").isNumber().default(__flags.IO.bufferSize)
				aErrFn = _$(aErrFn, "aErrFn").isFunction().default(logErr)

				var dumpFn = arrData => {
					try {
						ow.obj.fromArray2DB(arrData, db, aTable, __, true, (_e, sql, value) => printErr("Error while dumping data for sql query: " + _e))
					} catch(e) {
						db.rollback()
						aErrFn("Error while dumping data: " + e)
					}
				}

				var c = 0, _bufData = []
				do {
					var _d = aStreamReadFn()
					if (isUnDef(defs[aTable]) && isMap(_d)) {
						// Create the table
						defs[aTable] = ow.obj.fromObj2DBTableCreate(aTable, _d, aFieldOveride, true)
						try {
							db.u(defs[aTable])
							db.commit()
						} catch(e) {
							db.rollback()
							aErrFn("Error while creating table: " + e)
						}
					}
					// Buffer data
					_bufData.push(_d)
					c++

					// Dump data if necessary (buffer size)
					if (c % aBufferSize == 0) {
						dumpFn(_bufData)
						_bufData = []
					}
				} while(isDef(_d))

				// Dump remaining data
				if (_bufData.length > 0) {
					dumpFn(_bufData)
					_bufData = []
				}
				
				return __sql
			},
			table: (aTable, _obj, aFieldOveride) => {
				aTable = _$(aTable, "aTable").isString().default("_TMP")
				
				// Convert map to array
				if (isUnDef(_obj)) _obj = [{}]
				if (isMap(_obj)) _obj = $from(_obj).select()
				if (isArray(_obj)) {
					if (_obj.length != 0) {
						try {
							defs[aTable] = ow.obj.fromObj2DBTableCreate(aTable, __objGetSamples(_obj), aFieldOveride, true)
							db.u(defs[aTable])
							ow.obj.fromArray2DB(_obj, db, aTable, __, true, (_e, sql, value) => printErr("Error while dumping data for sql query: " + _e))
							db.commit()
						} catch(e) {
							db.rollback()
							throw e
						}
					}
				}

				return __sql
			},
			query: (_sql, dontClose) => {
				dontClose = _$(dontClose, "dontClose").isBoolean().default(true)

				// Remove from of aSQL			
				if (!chain && !_sql.match(/FROM _TMP(,|$| )/i)) 
					_sql = _sql.trim().replace(/(FROM .+?)?( +GROUP| +LIMIT| +ORDER| +WHERE|$)/i, " FROM _TMP$2")

				// Execute the query
				var _r
				try {
					_r = db.q(_sql)
				} catch(e) {
					throw e
				} finally {
					if (!dontClose) {
						__sql.close()
					}
				}

				if (isDef(_r) && isDef(_r.results)) {
					traverse(_r.results, (aK, aV, aP, aO) => {
						if (aV == "TRUE" || aV == "FALSE") aO[aK] = toBoolean(aV)
					})
					return _r.results
				} else {
					return __
				}
			},
			closeQuery: (_sql) => __sql.query(_sql, false)
		}

		createDB()
		if (isDef(aObj))
			return __sql.table("_TMP", aObj).closeQuery(aSQL)
		else
			return __sql
	}
}

/**
 * <odoc>
 * <key>af.fromXML2Obj(xml, ignored, aPrefix, reverseIgnored) : Object</key>
 * Tries to convert a XML object into a javascript object. Tag attributes will be ignored unless the corresponding tag name is included
 * on the ignored array and attributes will be added to the corresponding map with a prefix "_" (or aPrefix).
 * Optionally if reverseIgnored = true the ignored array will be used to not include the tag name in the ignored array.
 * </odoc>
 */
AF.prototype.fromXML2Obj = function (xml, ignored, aPrefix, reverseIgnored) {
	ignored = _$(ignored).isArray().default(__);
	aPrefix = _$(aPrefix).isString().default("_");
	reverseIgnored = _$(reverseIgnored).isBoolean().default(false)

	if (typeof xml != "xml") {
		if (isString(xml)) {
			xml = xml.replace(/^<\?xml[^?]*\?>/, "");
			xml = new XMLList("<xml>" + xml + "</xml>");
		} else {
			throw "Please provide a string or a XML object.";
		}
	}

	var r, children = xml.children(), attributes = xml.attributes(), length = children.length();
	if (length == 0) {
		r = xml.toString();
	} else if (length == 1 && isNull(children[0].localName())) {
		var text = String(children[0].toString())
		if (text) {
			r = text;
		}
	}
	if (r == __) {
		r = {};
		for (var ichild in children) {
			var child = children[ichild];
			var name
			if (!isNull(child.localName())) {
				name = String(child.localName())
				var json = af.fromXML2Obj(child, ignored, aPrefix, reverseIgnored)
				var value = r[name];
				if (isDef(value)) {
					if (isString(value)) {
						r[name] = [value]
						r[name].push(json);
					} else {
						if (!isArray(value)) {
							value = [ value ];
							r[name] = value;
						}
						value.push(json);
					}
				} else {
					r[name] = json;
				}
			}
		}
	}
	if (attributes.length()) {
		var a = {}, c = 0;
		for (var iattribute in attributes) {
			var attribute = attributes[iattribute]
			var name = String(attribute.localName())
			var _go = ignored && ignored.indexOf(name) == -1
			if ((!reverseIgnored && _go) || (reverseIgnored && !_go)) {
				a[aPrefix + name] = attribute.toString()
				c++
			}
		}
		if (c > 0) {
			if (isMap(r)) a = merge(a, r); else (isString(r) && r.length > 0 ? a[aPrefix] = r : __);
			return a;
		}
	}

	return r;
};

/**
 * <odoc>
 * <key>af.fromObj2XML(aMap, sanitize, aAttrKey) : String</key>
 * Tries to convert aMap into a similiar XML strucuture returned as string.
 * Note that no validation of XML strucuture is performed. 
 * If aAttrKey string is defined it will be used to prefix attributes (from af.fromXML2Obj).
 * Tips: ensure each map is under a map key.
 * </odoc>
 */
AF.prototype.fromObj2XML = function (obj, sanitize, aAttrKey, aPrefix, aSuffix) {
	aPrefix = _$(aPrefix).isString().default("")
	aSuffix = _$(aSuffix).isString().default("")
	if (sanitize) {
		obj = clone(obj)
		traverse(obj, (aK, aV, aP, aO) => {
			if (isJavaObject(aV)) aO[aK] = String(aV)
		})
	}
	var keys
	if (isString(aAttrKey)) {
		keys = Object.keys(obj).sort((a, b) => {
			if (a === "_") return 1
			if (b === "_") return -1
			return 0
		})
	} else {
		keys = Object.keys(obj)
	}
	var xml = aPrefix;
	for (var i = 0; i <= keys.length - 1; i++) {
		var prop = keys[i]
		if (obj[prop] instanceof Array) {
			for (var array in obj[prop]) {
				xml += af.fromObj2XML(new Object(obj[prop][array]), sanitize, aAttrKey, "<" + prop + ">", "</" + prop + ">")
			}
		} else if (isDate(obj[prop])) {
			xml += "<" + prop + ">" + obj[prop].toISOString() + "</" + prop + ">"
		} else if (typeof obj[prop] == "object") {
			xml += af.fromObj2XML(new Object(obj[prop]), sanitize, aAttrKey, "<" + prop + ">", "</" + prop + ">")
		} else {
			if (isString(aAttrKey) && prop.startsWith("_")) {
				if (prop == "_") {
					xml += obj[prop]
				} else {
					xml = xml.replace(/>$/, ` ${prop.substring(1)}="${obj[prop]}">`)
				}
			} else {
				xml += "<" + prop + ">" + obj[prop] + "</" + prop + ">"
			}
		}
	}
	xml += aSuffix
	xml = xml.replace(/<\/?[0-9]{1,}>/g, '');
	return xml;
};

/**
 * <odoc>
 * <key>AF.encryptText()</key>
 * Interactevly asks to enter a text and then uses af.encrypt to print to stdout the result.
 * </odoc>
 */
AF.prototype.encryptText = function() { plugin("Console"); print("Encrypted text: " + af.encrypt((new Console()).readLinePrompt("Enter text: ", "*"))); };

/**
 * <odoc>
 * <key>AF.protectSystemExit(shouldProtect, aMessage)</key>
 * Protects the current execution against a exit instruction if shouldProtect = true (otherwise it will unprotect). If protected
 * a security exception with aMessage (string) followed by the exit status will be thrown or the result of calling function aMessage
 * with the exit status as a parameter.
 * </odoc>
 */
AF.prototype.protectSystemExit = function(shouldProtect, aMessage) {
	if(shouldProtect) {
		var fn;
		if (isDef(aMessage) && isString(aMessage)) {
			fn = function(status) { return aMessage + status; };
		} else {
			if (isDef(aMessage) && isFunction(aMessage)) {
				fn = aMessage;
			} else {
				fn = function(status) { return "Ignoring exit with status: " + status; }; 
			}
		}
		java.lang.System.setSecurityManager(new JavaAdapter(java.lang.SecurityManager, { checkExit: (status) => { throw fn(status); }, checkPermission: (perm) => { }}));
	} else {
		java.lang.System.setSecurityManager(new JavaAdapter(java.lang.SecurityManager, { checkExit: (status) => { }, checkPermission: (perm) => { }}));
	}
};
/**
 * <odoc>
 * <key>io.pipeLn(aFunc)</key>
 * Starts a wait on stdin calling aFunc everytime a line is sent to stdin. The wait cycle breaks
 * when aFunc returns true.
 * </odoc>
 */
IO.prototype.pipeLn = function(aFunc) {
	var is = new java.io.InputStreamReader(java.lang.System.in)
	var br = new java.io.BufferedReader(is)

	var cont = true
	while(cont) {
		var line = br.readLine()
		if (line != null) cont = !aFunc(line); else cont = false
	}
}
/**
 * <odoc>
 * <key>io.pipeCh(aFunc)</key>
 * Starts a wait on stdin calling aFunc everytime a character is sent to stdin. The wait cycle breaks
 * when aFunc returns true.
 * </odoc>
 */
IO.prototype.pipeCh = function(aFunc) {
	var br = new java.io.BufferedReader(new java.io.InputStreamReader(java.lang.System.in))
  
	var cont = true
	while(cont) {
	  var c = br.read()
	  if (c != null) cont = !aFunc(c); else cont = false
	}
}
/**
 * <odoc>
 * <key>io.readFileBytesRO(aFile) : ByteArray</key>
 * Tries to read aFile in read-only mode (even if being used by another process) and returns the corresponding byte array.
 * </odoc>
 */
IO.prototype.readFileBytesRO = function(aFile) {
	var buffer = newJavaArray(java.lang.Byte.TYPE, io.fileInfo(aFile).size)
	var fc = java.nio.channels.FileChannel.open((new java.io.File(aFile)).toPath(), java.nio.file.StandardOpenOption.READ)
	var dst = java.nio.ByteBuffer.wrap(buffer)
	fc.read(dst)
	fc.close()
	return buffer
}
/**
 * <odoc>
 * <key>io.readFileTARBytes(aTARFile, aFilePath, isGzip) : ByteArray</key>
 * Given aTARFile (or stream) will try to retrieve aFilePath and return the corresponding byte array. If aTARFile is a stream
 * you should specify with isGzip = true/false if it has been "gzipped".
 * </odoc>
 */
IO.prototype.readFileTARBytes = function(aTARFile, aFilePath, isGzip) {
	var br
	io.readFileTAR2Stream(aTARFile, isGzip, _is => {
		if (_is != "null") {
			var _e = _is.getNextTarEntry()
			while(_e != null && _e.getName() != aFilePath) {
				_e = _is.getNextTarEntry()	
			}
			if (_e != null && _e.getName() == aFilePath) {
				br = Packages.org.apache.commons.io.IOUtils.toByteArray(_is)
			}
		}
	})
	return br
}
/**
 * <odoc>
 * <key>io.readFileTARStream(aTARFile, aFilePath, isGzip, aFunc)</key>
 * Given aTARFile (or stream) will try to retrieve aFilePath and call aFunc(tion) with the corresponding Java input stream. If aTARFile is a stream
 * you should specify with isGzip = true/false if it has been "gzipped".
 * </odoc>
 */
IO.prototype.readFileTARStream = function(aTARFile, aFilePath, isGzip, aFunc) {
	io.readFileTAR2Stream(aTARFile, isGzip, _is => {
		if (_is != "null") {
			var _e = _is.getNextTarEntry()
			while(_e != null && _e.getName() != aFilePath) {
				_e = _is.getNextTarEntry()	
			}
			if (_e != null && _e.getName() == aFilePath) {
				aFunc(_is)
			}
		}
	})
}
/**
 * <odoc>
 * <key>io.readFileTAR2Stream(aTARfile, isGzip, aFunc)</key>
 * Given aTARFile (or stream) will call aFunc(tion) with the corresponding Java TAR input stream. If aTARFile is a stream
 * you should specify with isGzip = true/false if it has been "gzipped". Note: for direct usage use io.readFileTARStream
 * </odoc>
 */
IO.prototype.readFileTAR2Stream = function(aTARfile, isGzip, aFunc) {
	isGzip = _$(isGzip, "isGzip").isBoolean().default(false)
	aFunc  = _$(aFunc, "aFunc").isFunction().$_()

	var isJ, isGZ
	if (isJavaObject(aTARfile)) {
		isJ = true
	} else {
		isJ = false
		isGZ = isGzip || (aTARfile.endsWith(".tar.gz") || aTARfile.endsWith(".tgz"))
	}

	var iss
	if (!isJ) {
		if (isGZ) 
			iss = io.readFileGzipStream(aTARfile)
		else
			iss = io.readFileStream(aTARfile)
	} else {
		if (isGZ)
			iss = java.util.zip.GZIPInputStream(aTARfile)
		else
			iss = aTARfile
	}
	var _is = Packages.org.apache.commons.compress.archivers.tar.TarArchiveInputStream(iss)

	aFunc(_is)

	_is.close()
	iss.close()
}
/**
 * <odoc>
 * <key>io.writeFileTAR4Stream(aTARfile, isGzip, aFunc)</key>
 * Given aTARfile (or output stream (with isGzip = true/false)) will call aFunc with the Java TAR output stream.
 * Note: for direct usage use io.writeFileTARStream
 * </odoc>
 */
IO.prototype.writeFileTAR4Stream = function(aTARfile, isGzip, aFunc) {
	isGzip = _$(isGzip, "isGzip").isBoolean().default(false)
	aFunc  = _$(aFunc, "aFunc").isFunction().$_()

	var isJ, isGZ
	if (isJavaObject(aTARfile)) {
		isJ = true
	} else {
		isJ = false
		isGZ = isGzip || (aTARfile.endsWith(".tar.gz") || aTARfile.endsWith(".tgz"))
	}

	var oss
	if (!isJ) {
		if (isGZ) 
			oss = io.writeFileGzipStream(aTARfile)
		else
			oss = io.writeFileStream(aTARfile)
	} else {
		if (isGZ)
			oss = java.util.zip.GZIPOutputStream(aTARfile)
		else
			oss = aTARfile
	}
	var _os = Packages.org.apache.commons.compress.archivers.tar.TarArchiveOutputStream(oss)
	_os.setLongFileMode(Packages.org.apache.commons.compress.archivers.tar.TarArchiveOutputStream.LONGFILE_GNU)

	aFunc(_os)

	Packages.org.apache.commons.io.IOUtils.closeQuietly(oss)
	Packages.org.apache.commons.io.IOUtils.closeQuietly(_os)
}
/**
 * <odoc>
 * <key>io.writeFileTARBytes(aTARfile, aFilePath, isGzip, aArrayBytes)</key>
 * Given aTARfile (or output stream (with isGzip = true/false)) will write aArrayBytes into aFilePath in the TAR file/stream.
 * Note: for multiple files use io.writeFileTARStream
 * </odoc>
 */
IO.prototype.writeFileTARBytes = function(aTARFile, aFilePath, isGzip, aArrayBytes) {
	io.writeFileTARStream(aTARFile, isGzip, aFn => {
		aFn(aFilePath, af.fromBytes2InputStream(aArrayBytes))
	})
}
/**
 * <odoc>
 * <key>io.writeFileTARStream(aTARfile, isGzip, aFunc, aDefaultMap)</key>
 * Given aTARfile (or output stream (with isGzip = true/false)) will call aFunc(tion) providing, as argument, a writer function
 * with three arguments: aFilePath, a Java input stream for the contents and the modification date for the target file. 
 * Optionally aDefaultDate can be provided to be used whenever a date is not provided or for folders.
 * </odoc>
 */
IO.prototype.writeFileTARStream = function(aTARFile, isGzip, aFunc, aDefaultMap) {
	aDefaultMap = _$(aDefaultMap, "aDefaultMap").isMap().default({ lastModified: new Date() })

	io.writeFileTAR4Stream(aTARFile, isGzip, _os => {
		if (_os != "null") {
			aFunc((aFilePath, aStream, aInfoMap) => {
				aInfoMap = _$(aInfoMap, "aInfoMap").isMap().default(aDefaultMap)
				if (isNumber(aInfoMap.lastModified)) aInfoMap.lastModified = new Date(aInfoMap.lastModified)

				var f = new java.io.File(aFilePath)
				var _e = _os.createArchiveEntry(f, aFilePath)
				if (isNumber(aInfoMap.size)) _e.setSize(aInfoMap.size); else _e.setSize(aStream.available())
				_e.setModTime(aInfoMap.lastModified)
				if (isNumber(aInfoMap.uid)) _e.setUserId(aInfoMap.uid)
				if (isNumber(aInfoMap.gid)) _e.setGroupId(aInfoMap.gid)
				if (isNumber(aInfoMap.mode)) _e.setMode(aInfoMap.mode)
				_os.putArchiveEntry(_e)
				Packages.org.apache.commons.io.IOUtils.copyLarge(aStream, _os)
				_os.closeArchiveEntry()
			})
		}
	})
}
/**
 * <odoc>
 * <key>io.listFilesTAR(aTARfile, isGzip) : Array</key>
 * Given aTARfile (or output stream (with isGzip = true/false)) will return an array with the TAR file entries. Each entry will
 * have: isDirectory (boolean), isFile (boolean), canonicalPath (string), filepath (string), filename (string), size (number),
 * lastModified (date), groupId (string), group (string), userId (string) and user (string). 
 * </odoc> 
 */
IO.prototype.listFilesTAR = function(aTARfile, isGzip) {
	var files = new Set()
	var m2l = mode => (mode & 0o400 ? 'r' : '-') + (mode & 0o200 ? 'w' : '-') + (mode & 0o100 ? 'x' : '-') + (mode & 0o040 ? 'r' : '-') + (mode & 0o020 ? 'w' : '-') + (mode & 0o010 ? 'x' : '-') + (mode & 0o004 ? 'r' : '-') + (mode & 0o002 ? 'w' : '-') + (mode & 0o001 ? 'x' : '-')
	
	io.readFileTAR2Stream(aTARfile, isGzip, _is => {
		if (_is != "null") {
			var _e = _is.getNextEntry()
			while(_e != null) {
				files.add({
					isDirectory  : _e.isDirectory(),
					isFile       : _e.isFile(),
					isLink       : _e.isLink(),
					isSymLink    : _e.isSymbolicLink(),
					canonicalPath: String(_e.getName()),
					filepath     : String(_e.getName()),
					filename     : String(_e.getName()).substring(String(_e.getName()).lastIndexOf("/")+1),
					size         : Number(_e.getSize()),
					lastModified : (_e.getLastModifiedDate() == null ? __ : new Date(_e.getLastModifiedDate().getTime())),
					groupId      : Number(_e.getGroupId()),
					group        : String(_e.getGroupName()),
					userId       : Number(_e.getUserId()),
					user         : String(_e.getUserName()),
					mode         : Number(_e.getMode()),
					permissions  : m2l(Number(_e.getMode())),
					linkName	 : String(_e.getLinkName())
				})
				_e = _is.getNextTarEntry()
			}
		}
	})

	return Array.from(files)
}
/**
 * <odoc>
 * <key>io.readFileYAML(aYAMLFile) : Object</key>
 * Tries to read aYAMLFile into a javascript object. 
 * </odoc>
 */
IO.prototype.readFileYAML = function(aYAMLFile, unsafe) { 
	var r = io.readFileString(aYAMLFile); 
	if (__YAMLformat.unsafe && !unsafe) {
		r = r.replace(/(\!\!js\/eval .+)/g, "\"$1\"");
	}
	return af.fromYAML(r, unsafe); 
}
/**
 * <odoc>
 * <key>io.readFileJSON(aJSONFile) : Object</key>
 * Tries to read aJSONFile into a javascript object. 
 * </odoc>
 */
IO.prototype.readFileJSON = function(aJSONFile, unsafe) { 
	return jsonParse(io.readFileString(aJSONFile), true, unsafe); 
}
/**
 * <odoc>
 * <key>io.writeFileYAML(aYAMLFile, aObj, multidoc)</key>
 * Tries to write a javascript aObj into a aYAMLFile. If multiDoc = true and aJson is an array the output will be multi-document.
 * </odoc>
 */
IO.prototype.writeFileYAML = function(aYAMLFile, aObj, multidoc) { return io.writeFileString(aYAMLFile, af.toYAML(aObj, multidoc)); };
/**
 * <odoc>
 * <key>io.writeFileJSON(aJSONFile, aObj, aSpace)</key>
 * Tries to write a javascript aObj into a aJSONFile with an optional aSpace.
 * </odoc>
 */
IO.prototype.writeFileJSON = function(aJSONFile, aObj, aSpace) { return io.writeFileString(aJSONFile, stringify(aObj, __, aSpace)) };

/**
 * <odoc>
 * <key>io.writeLineNDJSON(aNDJSONFile, aObj, aEncode)</key>
 * Writes aObj into a single line on aNDJSONFile (newline delimited JSON) (or an output stream). Optionally you can provide
 * an encoding (only is a string filename is provided)
 * </odoc>
 */
IO.prototype.writeLineNDJSON = function(aNDJSONFile, aObj, aEncode) {
	if (!isJavaObject(aNDJSONFile)) {
		io.writeFileString(aNDJSONFile, stringify(aObj, __, "")+__separator, aEncode, true)
	} else {
		ioStreamWrite(aNDJSONFile, stringify(aObj, __, "")+__separator)
	}
};

/**
 * <odoc>
 * <key>io.readLinesNDJSON(aNDJSONFile, aFuncCallback, aErrorCallback, anEncoding)</key>
 * Opens aNDJSONFile (a newline delimited JSON) (a filename or an input stream) as a stream call aFuncCallback with each parse JSON. If
 * aFuncCallback returns true the cycle will be interrupted. For any parse error it calls the aErrorCallback 
 * with each exception.
 * </odoc>
 */
IO.prototype.readLinesNDJSON = function(aNDJSONFile, aFuncCallback, aErrorCallback, anEncoding) {
	var rfs
	if (!isJavaObject(aNDJSONFile)) {
		rfs = io.readFileStream(aNDJSONFile)
	} else {
		rfs = aNDJSONFile
	}
	ioStreamReadLines(rfs, (line) => {
		try {
			return aFuncCallback(jsonParse(line, true));
		} catch(e) {
			aErrorCallback(e);
		}
	}, __, __, anEncoding)
};

/**
 * <odoc>
 * <key>io.readStreamJSON(aJSONFile, aValFunc) : Map</key>
 * Reads a JSON file (aJSONFile) without loading all structures to memory (usefull to handling large JSON files).
 * The aValFunc receives a single string argument with the current JSON path being processed (for example $.log.entries[123].request),
 * where "$" is the root of the JSON document. When aValFunc returns true the current JSON structure is recorded in memory.
 * If aValFunc is not defined it will return true for all paths. Returns the JSON structure recorded in memory.\
 * \
 * Example:\
 * \
 *    var amap = io.readStreamJSON("someFile.har",\
 *                                 path => (/^\$\.log\.entries\[\d+\]\.request/).test(path))\
 * \
 * </odoc>
 */
IO.prototype.readStreamJSON = function(aJSONFile, aValFunc) {
	_$(aJSONFile, "aJSONFile").isString().$_()
	aValFunc = _$(aValFunc, "aValFunc").isFunction().default(() => true)

	var is = java.io.FileReader(aJSONFile)
	var jr = Packages.com.google.gson.stream.JsonReader(is)
	jr.setLenient(true)
	
	try {
		var pending = 0, nam, res = new Set()

		do {
			var val = __, hasVal = false, path = String(jr.getPath())
			var next = String(jr.peek().toString())

			switch(next) {
			case "BEGIN_OBJECT": jr.beginObject(); pending++; break
			case "BEGIN_ARRAY" : jr.beginArray();  pending++; break
			case "END_OBJECT"  : jr.endObject();   pending--; break
			case "END_ARRAY"   : jr.endArray();    pending--; break
			case "STRING"      : hasVal = true; val = String(jr.nextString())   ; break
			case "BOOLEAN"     : hasVal = true; val = Boolean(jr.nextBoolean()) ; break
			case "DOUBLE"      : hasVal = true; val = Number(jr.nextDouble())   ; break
			case "NUMBER"      : hasVal = true; val = Number(jr.nextDouble())   ; break
			case "INT"         : hasVal = true; val = Number(jr.nextInt())      ; break
			case "LONG"        : hasVal = true; val = Number(jr.nextLong())     ; break
			case "NULL"        : hasVal = true; val = jr.nextNull()             ; break
			case "NAME"        : nam = String(jr.nextName()); break
			case "END_DOCUMENT": pending = 0; break
			default            : if (!jr.hasNext()) pending = 0
			}
		
			if (hasVal && aValFunc(path) > 0) {
				res.add({ k: path, v: val })
			}
		} while(pending > 0)
	} catch(e) {
		throw e
	} finally {
		jr.close()
		is.close()
	}

	var tmp = Array.from(res)
	var result = {}
	tmp.forEach(r => $$(result).set(r.k.substring(2), r.v))
	
	return result
}

/**
 * <odoc>
 * <key>io.isBinaryFile(aFile, confirmLimit) : boolean</key>
 * Tries to determine if the provided aFile is a binary or text file by checking the first 1024 chars (limit can be changed using
 * confirmLimit). Returns true if file is believed to be binary. Based on the function isBinaryArray.
 * </odoc>
 */
IO.prototype.isBinaryFile = function(aFile, confirmLimit) {
	var rstream = io.readFileStream(aFile);
	var rcstream = 0;
	var isBin = true;
	confirmLimit = _$(confirmLimit).isNumber().default(1024);

	var v = [];
	while((rstream.available() > 0) && (confirmLimit > 0 && rcstream < confirmLimit)) {
		rcstream++;
		v.push(rstream.read());
	}
	rstream.close();
	isBin = isBinaryArray(v, confirmLimit);
	
	return isBin;
};

/**
 * <odoc>
 * <key>io.onDirEvent(aPath, aFn, aFnErr) : Promise</key>
 * Given aPath of a directory will return a promise ($do) that, for every create, modify or delete event that happens on aPath it will call aFn with two parameters: kind and filename. 
 * The 'kind' string can be one of four events: ENTRY_CREATE, ENTRY_DELETE, ENTRY_MODIFY, OVERFLOW (meaning events were lost or discarded). The 'filename' represents the filename affected.
 * Optionally aFnErr function can be provided to handle any errors and, in case aPath no longer exists, aFnErr will be called with the string "ENTRY_NA". Example:\
 * \
 * var p = io.onDirEvent("myDir", (kind, filename) => {\
 *    log("Event '" + kind + "' on '" + filename + "'");\
 * }, e => {\
 *    if (isString(e) &amp;&amp; e == "ENTRY_NA") logWarn("myDir no longer exists."); else logErr(e);\
 * });\
 * \
 * $doWait(p);\
 * \
 * </odoc>
 */
IO.prototype.onDirEvent = function(aPath, aFn, aFnErr) {
	_$(aPath, "path").isString().$_();
	_$(aFn, "fn").isFunction().$_();

	if(!io.fileExists(aPath)) throw "'" + aPath + "' doesn't exist.";
	if(!io.fileInfo(aPath).isDirectory) throw "'" + aPath + "' is not a directory.";

	aFnErr = _$(aFnErr, "fnErr").isFunction().default(e => { if (!(isString(e) && e == "ENTRY_NA")) printErr(e); });

	return $do(() => {
		var watcher = java.nio.file.FileSystems.getDefault().newWatchService();
		var path = java.nio.file.Paths.get(aPath);
		path.register(watcher, java.nio.file.StandardWatchEventKinds.ENTRY_CREATE, java.nio.file.StandardWatchEventKinds.ENTRY_DELETE, java.nio.file.StandardWatchEventKinds.ENTRY_MODIFY);
		
		var goOn = true;
		do {
			var key = watcher.take();
			if (!isNull(key)) {
				var events = key.pollEvents();
				for(var eventI in events.toArray()) {
					var event = events.toArray()[eventI];
					aFn(String(event.kind()), String(event.context()));
				}
				if (!key.reset()) goOn = false;
			} else {
				goOn = false;
			}
		} while(goOn);
		
		aFnErr("ENTRY_NA");
	})
	.catch((e) => {
		aFnErr(e);
	});
};

/**
 * <odoc>
 * <key>csv.fromArray2File(anArray, aFile, withHeadersOrStreamFormat) : Number</key>
 * Tries to wirte anArray to aFile. If withHeadersOrStreamFormat is provided, if an array it will 
 * be interpreted as the files of headers otherwise as the new streamFormat object to use.
 * </odoc>
 */
CSV.prototype.fromArray2File = function(anArray, aFile, withHeadersOrStreamFormat) {
	var os = io.writeFileStream(aFile);

	if (anArray.length <= 0) return 0;
	var csv = new CSV();

	if (isDef(withHeadersOrStreamFormat)) {
		if (isArray(withHeadersOrStreamFormat)) {
			csv.setStreamFormat({ withHeaders: withHeadersOrStreamFormat });
		} else {
			if (isMap(withHeadersOrStreamFormat) && isUnDef(withHeadersOrStreamFormat.withHeaders)) withHeadersOrStreamFormat.withHeaders = Object.keys(anArray[0]);
			csv.setStreamFormat(withHeadersOrStreamFormat);
		}
	} else {
		csv.setStreamFormat({ withHeaders: Object.keys(anArray[0]) });
	}
	 
	var c = 0;
	try {
		csv.toStream(os, function() {
			if (c < anArray.length) return anArray[c++];
		});
	} finally {
		os.close();
	}
	return c;
};

/**
 * <odoc>
 * <key>csv.fromFile2Array(aFile, withHeadersOrStreamFormat) : Array</key>
 * Tries to read a CSV file and convert it into an array. If withHeadersOrStreamFormat is provided, if an array it will 
 * be interpreted as the files of headers otherwise as the new streamFormat object to use.
 * </odoc>
 */
CSV.prototype.fromFile2Array = function(aFile, withHeadersOrStreamFormat) {
	var res = [];
	var is = io.readFileStream(aFile);
	var csv = new CSV();

	if (isDef(withHeadersOrStreamFormat)) {
		if (isArray(withHeadersOrStreamFormat)) {
			csv.setStreamFormat({ withHeaders: withHeadersOrStreamFormat });
		} else {
			csv.setStreamFormat(withHeadersOrStreamFormat);
		}
	} else {
		csv.setStreamFormat({ withHeader: true });
	}

	try {
		csv.fromStream(is, function(m) {
			res.push(m);
		});
	} finally {
		is.close();
	}

	return res;
};


/**
 * <odoc>
 * <key>$fnDef4Help(aFnName) : Array</key>
 * Tries to retrieve an array of function argument names for the provided search string aFnName.
 * </odoc>
 */
const $fnDef4Help = (aFnName) => {
	_$(aFnName, "aFnName").isString().$_()
	aFnName = aFnName.replace(/^(global\.|this\.)/, "")

	if (isUnDef(global.__oaf_fnDef_cache)) global.__oaf_fnDef_cache = {}
	if (isDef(__oaf_fnDef_cache[aFnName])) return __oaf_fnDef_cache[aFnName]
	var res = searchHelp(aFnName)

	if (isDef(res) && isArray(res) && res.length > 0) {
		var _r = res[0].fullkey.replace(/ +/g, "").replace(/.+\((.*)\) *:*.*/, "$1").split(/,/)
		__oaf_fnDef_cache[aFnName] = _r
		return _r
	}
	return []; 
};

/**
 * <odoc>
 * <key>$m2a(aDef, aMap) : Array</key>
 * Tries to convert aMap into an array using the aDef array of keys for the values order in the output array. Example:\
 * \
 * $m2a(['c', 'b', 'a'], { a: 1, b: 2, c: 3 })    // [ 3, 2, 1 ]\
 * \
 * </odoc>
 */
const $m2a = (aDef, aMap) => {
	aDef = _$(aDef).isArray().default([]);
	aMap = _$(aMap).isMap().default({});

	var args = [], c = 0;
	for (var ii in aDef) {
		if (isDef(aMap[aDef[ii]])) args[c] = aMap[aDef[ii]];
		c++;
	}
	return args;
}

/**
 * <odoc>
 * <key>sortMapKeys(aMap, moreLevels) : Map</key>
 * Tries to sort the first level map keys returning the rewritten map. 
 * If moreLevels=true it will try to recursively map sub maps.
 * </odoc>
 */
const sortMapKeys = (aMap, moreLevels) => {
	let keys = Object.keys(aMap).sort()
	let result = {}

	for(let i = 0; i < keys.length; i++) {
		let key = keys[i]
		let value = aMap[key]

		if (Array.isArray(value)) {
			result[key] = value.map(item => {
				if (typeof item === 'object' && item !== null && item !== undefined) {
					return sortMapKeys(item, moreLevels)
				} else {
					return item
				}
			})
		} else if (moreLevels && typeof value === 'object' && value !== null && value !== undefined) {
			result[key] = sortMapKeys(value, moreLevels)
		} else {
			result[key] = value
		}
	}

	return result
}

/**
 * <odoc>
 * <key>$a4m(anArray, aKey, dontRemove) : Array</key>
 * Tries to create a map of maps from the provided anArrays. Optionally if aKey is provided
 * it will be used to create the map keys (otherwise will fallback to "row[number]"). And can also
 * optionally indicate by dontRemove = true that aKey shouldn't be removed from each map.
 * \
 * var a = [\
 *   { "abc": "123", "xpt": "000", "key": "A1" },\
 *   { "abc": "456", "xpt": "001", "key": "A2" },\
 *   { "abc": "789", "xpt": "002", "key": "A3" }\
 * ]\
 * \
 * $a4m(a, "key");\
 * // {\
 * //   "A1": { "abc": "123", "xpt": "000" },\
 * //   "A2": { "abc": "456", "xpt": "001" },\
 * //   "A3": { "abc": "789", "xpt": "002" }\
 * // }\
 * \
 * </odoc>
 */
const $a4m = (anArray, aKey, dontRemove) => {
	ow.loadObj()
	return ow.obj.fromArray2Obj(anArray, aKey, dontRemove)
}

/**
 * <odoc>
 * <key>$m4a(aMap, aKey) : Array</key>
 * Tries to create an array of maps from the provided aMap map of maps. Optionally if aKey is provided
 * it will be added to each array map with the map key. Example:\
 * \
 * var a = {\
 *    "A1": { "abc": "123", "xpt": "000" },\
 *    "A2": { "abc": "456", "xpt": "001" },\
 *    "A3": { "abc": "789", "xpt": "002" }\
 * }\
 * \
 * $m4a(a, "key");\
 * // [\
 * //  { "key": "A1", "abc": "123", "xpt": "000" },\
 * //  { "key": "A2", "abc": "456", "xpt": "001" },\
 * //  { "key": "A3", "abc": "789", "xpt": "002" }\
 * // ]\
 * \
 * </odoc>
 */
const $m4a = (aMap, aKey) => {
	ow.loadObj()
	return ow.obj.fromObj2Array(aMap, aKey)
}

/**
 * <odoc>
 * <key>$a2m(aDef, aArray) : Array</key>
 * Tries to convert aArray into a map using the aDef array of keys for the map keys' value assignment in the output map. Example:\
 * \
 * $a2m(['a', 'b', 'c'], [1, 2, 3])    // { a: 1, b: 2, c: 3 }\
 * \
 * </odoc>
 */
const $a2m = (aDef, aArray) => {
	aDef = _$(aDef).isArray().default([]);
	aArray = _$(aArray).isArray().default([]);

	var args = {};
	for (var ii in aDef) {
		args[aDef[ii]] = aArray[ii];
	}
	return args;
}

/**
 * <odoc>
 * <key>$fnM2A(aFn, aInstance, aDefinitionArray, aMap) : Object</key>
 * Tries to execute aFn, with aInstance if it's a function of an instance, using aMap of arguments that translate to aFn list of
 * arguments. Returns whatever the function executed returns. Example:\
 * \
 * plugin("HTTP");\
 * var h = new HTTP();\
 * $fnM2A(h.get, h, $fnDef4Help("HTTP.get"), { aUrl: "https://openaf.io/build", isBytes: false, returnStream: false });\
 * \
 * </odoc>
 */
const $fnM2A = (aFn, aInst, aDef, aMap) => {
	_$(aFn).isFunction().$_("Please provide a function.");
	aInst = _$(aInst).isObject().default(null);

	return aFn.apply(aInst, $m2a(aDef, aMap));
}

/**
 * <odoc>
 * <key>$fnM(aFnName, aMap) : Object</key>
 * Calls aFnName function trying to determine the name of the arguments from OpenAF's help or accessible source code (throws an exception
 * if it can't determine the arguments) and then builds the arguments used to call aFnName using the values of keys in aMap. Example:\
 * \
 * plugin("HTTP"); var h = new HTTP();\
 * $fnM("h.get", { aUrl: "https://openaf.io/release" });\
 * \
 * </odoc>
 */
const $fnM = (aFnName, aMap) => {
	_$(aFnName).isString().$_("Please provide a function name string.");
	aMap = _$(aMap).isMap().default({});

	var [ , aInst, aFn ] = aFnName.match(/(.+)\.([^.]+)/);

	var objType = Object.prototype.toString.call(Object.getPrototypeOf(eval(aInst))).replace(/\[object (.+)\]/, "$1");
	var fnArgs = $fnDef4Help((objType == "Object" ? aInst : objType) + "." + aFn);

	if (isUnDef(fnArgs)) {
		fnArgs = eval(aFnName + ".toString().split(/\n/)[1].replace(/function .+\((.+)\).*/, '$1').split(/,/)");
		if (isDef(fnArgs) && isArray(fnArgs) && fnsArgs[0].match(/^ +/)) throw "can't determine arguments";
	}

	if (isDef(fnArgs) && isArray(fnArgs)) {
		return $fnM2A(eval(aFnName), eval(aInst), fnArgs, aMap);
	} else {
		throw "can not determine arguments.";
	}
}

// var $sec = function() { 
// 	ow.loadSec(); 
// 	return $sec.apply(this, arguments);
// }
ow.loadSec();

/**
 * <odoc>
 * <key>ask(aPrompt, aMask) : String</key>
 * Stops for user interaction prompting aPrompt waiting for an entire line of characters and, optionally, masking the user input with aMask (e.g. "*").
 * Returns the user input.
 * </odoc>
 */
const ask = (aPrompt, aMask, _con, noAnsi) => {
	aPrompt = _$(aPrompt, "aPrompt").isString().default("> ");
	if (isUnDef(_con)) { plugin("Console"); _con = new Console(); }
	if (__conAnsi && __flags.ANSICOLOR_ASK && !noAnsi) {
		var _v = _con.readLinePrompt(ansiColor(__colorFormat.askPre, "? ") + ansiColor(__colorFormat.askQuestion, aPrompt), aMask)
		var _m = (isUnDef(aMask) ? _v : (aMask == String.fromCharCode(0) ? "---" : repeat(_v.length, aMask)))
		printErr("\x1b[1A\x1b[0G" + ansiColor(__colorFormat.askPos, "\u2713") + " " + aPrompt + "[" + ansiColor(__colorFormat.string, _m) + "]")
		return _v
	} else {
		return _con.readLinePrompt(aPrompt, aMask)
	}
}

/**
 * <odoc>
 * <key>askEncrypt(aPrompt) : String</key>
 * Similar to ask but the return user input will be encrypted.
 * If an empty string is entered by the user the function will return undefined.
 * </odoc>
 */
const askEncrypt = (aPrompt, _con) => {
	aPrompt = _$(aPrompt).isString().default(": ");
	var v = ask(aPrompt, String.fromCharCode(0), _con);
	if (isString(v) && v == "") return __;
	return af.encrypt(v);
}

/**
 * <odoc>
 * <key>ask1(aPrompt, allowed) : String</key>
 * Stops for user interaction prompting aPrompt waiting for a single character within the allowed string (a set of characters).
 * Returns the user input.
 * </odoc>
 */
const ask1 = (aPrompt, allowed, _con) => {
	if (isDef(aPrompt)) printnl(aPrompt);
	if (isUnDef(_con)) { plugin("Console"); _con = new Console(); }
	return _con.readChar(allowed);
}

/**
 * <odoc>
 * <key>askN(aPromptFn, aStopFn) : String</key>
 * Stops for a multi-line user interaction prompting, for each line, the result of calling aPromptFn that receives the current user input 
 * (if a string is provided it will default to a function that returns that string). The interaction will stop when aStopFn function, that receives the current
 * user input as an argument, returns true (if the function is not provided it will default to 3 new lines).
 * </odoc>
 */
const askN = (aPromptFn, aStopFn, _con) => {
	aStopFn = _$(aStopFn, "aStopFn").isFunction().default(text => {
		return text.match(/\n\n\n$/);
	});
	if (isString(aPromptFn)) aPromptFn = new Function("return " + aPromptFn);
	if (isUnDef(_con)) { plugin("Console"); _con = new Console(); }
	var r = "";
	do {
		var l = _con.readLinePrompt(aPromptFn(r));
		r += l + "\n";
	} while (!aStopFn(r));
	return r;
}

/**
 * <odoc>
 * <key>askDef(aInit, aQuestion, isSecret, isVoidable) : String</key>
 * If aInit is not defined will ask aQuestion (if isSecret = true it will askEncrypt) and return
 * the value. If isVoidable = true and no answer is provided it will return undefined.
 * </odoc>
 */
const askDef = (aInit, aQuestion, isSecret, isVoidable) => {
	aQuestion = _$(aQuestion, "aQuestion").isString().default("Question: ");
	if (isUnDef(aInit)) {
		var r;
		if (isSecret) r = askEncrypt(aQuestion); else r = ask(aQuestion);
		if (isVoidable && isString(r) && r.length == 0) r = __;
		return r; 
	} else {
		return aInit;
	}
}

/**
 * <odoc>
 * <key>askChoose(aPrompt, anArray, aMaxDisplay, aHelpText) : Number</key>
 * Stops for user interaction prompting aPrompt waiting for a single character to choose from the provided anArray of options. Optionally
 * you can provide aMaxDisplay to limit the number of options displayed at a time. Returns the index of the chosen option.
 * </odoc>
 */
const askChoose = (aPrompt, anArray, aMaxDisplay, aHelpText) => {
	_$(aPrompt, "aPrompt").isString().$_()
	_$(anArray, "anArray").isArray().$_()
	aMaxDisplay = _$(aMaxDisplay, "aMaxDisplay").isNumber().default(5)
	aHelpText = _$(aHelpText, "aHelpText").isString().default(ansiColor("FAINT,ITALIC","(arrows to move, enter to select)"))

	let chooseLine = __colorFormat.askChooseChars.chooseLine
	let chooseLineSize = visibleLength(chooseLine) + 1
	let chooseUp = __colorFormat.askChooseChars.chooseUp
	let chooseDown = __colorFormat.askChooseChars.chooseDown
	let chooseDirSize = Math.max(visibleLength(chooseUp), visibleLength(chooseDown)) + 1
	let filter = ""

	if (__flags.ANSICOLOR_ASK) {
		anArray = clone(anArray)
		plugin("Console")
		let _con = new Console(), _maxl = _con.getConsoleReader().getTerminal().getWidth(), _maxls = Math.max(chooseDirSize, chooseLineSize)
		anArray = anArray.map(l => {
			if (l.length + _maxls >= _maxl)
				return l.substring(0, _maxl - _maxls - 4) + "..."
			else
				return l
		})

		if (anArray.length < aMaxDisplay) aMaxDisplay = anArray.length
		var _v = ansiColor(__colorFormat.askPre, "? ") + ansiColor(__colorFormat.askQuestion, aPrompt) + " " + aHelpText
		printErr("\x1B[?25l" + _v)

		let option = 0, firstTime = true, span = 0
		let maxSpace = anArray.reduce((a, b) => { return a.length > b.length ? a : b }).length
		ow.loadFormat()
		let _print = () => {
			if (option > (aMaxDisplay-2)) span = option - aMaxDisplay + 1; else span = 0
			var _o = anArray
					 .map((l, i) => {
						if (i >= span && i - span < aMaxDisplay) {
							if (i == option) {
								var _l = ansiColor(__colorFormat.askChoose, chooseLine + " " + l + repeat(maxSpace - l.length + chooseLineSize -1, " "))
								if (filter.length > 0) {
									_l = _l.replace(filter, ansiColor(__colorFormat.askChooseFilter, filter))
								}
								return _l
							} else {
								var s = ((span > 0 && i == span) ? chooseUp : ((i - span == aMaxDisplay-1 && anArray.length > aMaxDisplay) ? chooseDown : " "))
								return ansiColor("RESET", ansiColor(__colorFormat.askChoose, s) + " " + l + repeat(maxSpace - l.length + chooseDirSize -1, " "))
							}
						}
						return ""
					 })
					 .filter(l => l.length > 0)
					 .join("\n")
			if (!firstTime) ow.format.string.ansiMoveUp(aMaxDisplay); else firstTime = false
			print(_o)
		}

		let c = 0
		do {
			_print()
			var _c = _con.readChar("")
			c = String(_c).charCodeAt(0)
			if (c == 27) {
				filter = ""
				c = String(_con.readChar("")).charCodeAt(0)
				if (c == 91 || c == 79) {
					c = String(_con.readChar("")).charCodeAt(0)
					if (c == 66 && option < anArray.length - 1) option++
					if (c == 65 && option > 0) option--
				}
			} else {
				if (c == 127) {
					if (filter.length > 0) filter = filter.substring(0, filter.length - 1)
				} else {
					if (c >= 32 && c < 255) filter += _c
				}
				if (filter.length > 0) {
					option = anArray.findIndex(v => v.toLowerCase().indexOf(filter.toLowerCase()) >= 0)
				}
			}
		} while (c != 13 && c != 10)
		ow.format.string.ansiMoveUp(aMaxDisplay)
		printErr(range(aMaxDisplay).map(r => repeat(maxSpace + chooseDirSize, " ")).join("\n"))
		ow.format.string.ansiMoveUp(aMaxDisplay+1)
		printErrnl(repeat(_v.length, " ") + "\r")
		printErr("\n\x1b[1A\x1b[0G" + ansiColor(__colorFormat.askPos, "\u2713") + " " + aPrompt + "[" + ansiColor(__colorFormat.string, anArray[option]) + "]")
		ow.format.string.ansiMoveUp(2)
		printErr("\x1B[?25h\n")

		return option
	} else {
		throw "Choose options not supported on the current terminal."
	}

	return __
}

/**
 * <odoc>
 * <key>askChooseMultiple(aPrompt, anArray, aMaxDisplay, aHelpText) : Array</key>
 * Stops for user interaction prompting aPrompt waiting for a single character to choose multiple from the provided anArray of options. Optionally
 * you can provide aMaxDisplay to limit the number of options displayed at a time. Returns an array with the chosen options.
 * </odoc>
 */
const askChooseMultiple = (aPrompt, anArray, aMaxDisplay, aHelpText) => {
	_$(aPrompt, "aPrompt").isString().$_()
	_$(anArray, "anArray").isArray().$_()
	aMaxDisplay = _$(aMaxDisplay, "aMaxDisplay").isNumber().default(5)
	aHelpText = _$(aHelpText, "aHelpText").isString().default(ansiColor("FAINT,ITALIC","(arrows to move, space to select, enter to submit)"))

	let chooseMultipleSelected = __colorFormat.askChooseChars.chooseMultipleSelected
	let chooseMultipleEmpty    = __colorFormat.askChooseChars.chooseMultipleUnselected
	let chooseMultipleSize     = Math.max(visibleLength(chooseMultipleSelected), visibleLength(chooseMultipleEmpty)) + 1

	let chooseLine = __colorFormat.askChooseChars.chooseLine
	let chooseLineSize = visibleLength(chooseLine) + 1
	let chooseUp = __colorFormat.askChooseChars.chooseUp
	let chooseDown = __colorFormat.askChooseChars.chooseDown
	let chooseDirSize = Math.max(visibleLength(chooseUp), visibleLength(chooseDown)) + 1
	let filter = ""

	if (__flags.ANSICOLOR_ASK) {
		aSelectMap = new Map()
		plugin("Console")
		let _con = new Console(), _maxl = _con.getConsoleReader().getTerminal().getWidth(), _maxls = Math.max(chooseDirSize, chooseLineSize) + chooseMultipleSize
		anArray = anArray.map(l => {
			if (l.length + _maxls >= _maxl)
				return l.substring(0, _maxl - _maxls - 4) + "..."
			else
				return l
		})
		anArray.forEach(v => aSelectMap.set(v, false) )

		if (anArray.length < aMaxDisplay) aMaxDisplay = anArray.length
		var _v = ansiColor(__colorFormat.askPre, "? ") + ansiColor(__colorFormat.askQuestion, aPrompt) + " " + aHelpText
		printErr("\x1B[?25l" + _v)

		let option = 0, firstTime = true, span = 0
		let maxSpace = anArray.reduce((a, b) => { return a.length > b.length ? a : b }).length
		let _print = () => {
			if (option > (aMaxDisplay-2)) span = option - aMaxDisplay + 1; else span = 0
			var _o = anArray
					 .map((l, i) => {
						if (i >= span && i - span < aMaxDisplay) {
							selectChar = (aSelectMap.get(l) ? chooseMultipleSelected : chooseMultipleEmpty)
							if (i == option) {
								var _l = ansiColor(__colorFormat.askChoose, chooseLine + " " + selectChar + " " + l + repeat(maxSpace - l.length + chooseLineSize + chooseMultipleSize -5, " "))
								if (filter.length > 0) {
									_l = _l.replace(filter, ansiColor(__colorFormat.askChooseFilter, filter))
								}
								return _l
							} else {
								var s = ((span > 0 && i == span) ? chooseUp : ((i - span == aMaxDisplay-1 && anArray.length > aMaxDisplay) ? chooseDown : " "))
								return ansiColor("RESET", ansiColor(__colorFormat.askChoose, s) + " " + selectChar + " " + l + repeat(maxSpace - l.length + chooseDirSize + chooseMultipleSize -5, " "))
							}
						}
						return ""
					 })
					 .filter(l => l.length > 0)
					 .join("\n")
			if (!firstTime) ow.format.string.ansiMoveUp(aMaxDisplay); else firstTime = false
			printErr(_o)
		}

		let c = 0
		do {
			_print()
			var _c = _con.readChar("")
			c = String(_c).charCodeAt(0)
			if (c == 27) {
				filter = ""
				c = String(_con.readChar("")).charCodeAt(0)
				if (c == 91 || c == 79) {
					c = String(_con.readChar("")).charCodeAt(0)
					if (c == 66 && option < anArray.length - 1) option++
					if (c == 65 && option > 0) option--
				}
			} else if (c == 32) {
				aSelectMap.set(anArray[option], !aSelectMap.get(anArray[option]))
			} else {
				if (c == 127) {
					if (filter.length > 0) filter = filter.substring(0, filter.length - 1)
				} else {
					if (c > 32 && c < 255) filter += _c
				}
				if (filter.length > 0) {
					option = anArray.findIndex(v => v.toLowerCase().indexOf(filter.toLowerCase()) >= 0)
				}
			}
		} while (c != 13 && c != 10)
		ow.format.string.ansiMoveUp(aMaxDisplay)
		printErr(range(aMaxDisplay).map(r => repeat(maxSpace + chooseDirSize + chooseMultipleSize, " ")).join("\n"))
		ow.format.string.ansiMoveUp(aMaxDisplay+1)
		printErrnl(repeat(_v.length, " ") + "\r")

		let options = []
		aSelectMap.forEach((v, k) => { if (v) options.push(k) })
		printErr("\n\x1b[1A\x1b[0G" + ansiColor(__colorFormat.askPos, "\u2713") + " " + aPrompt + "[" + ansiColor(__colorFormat.string, options.join(", ") ) + "]")

		ow.format.string.ansiMoveUp(2)
		printErr("\x1B[?25h\n")

		return options
	} else {
		throw "Choose options not supported on the current terminal."
	}

	return __
}

/**
 * <odoc>
 * <key>askStruct(anArrayOfQuestions) : Array</key>
 * Given anArrayOfQuestions with a structure like:\
 * \
 * [\
 *  { name: "question1", prompt: "Question 1", type: "question" },\
 *  { name: "question2", prompt: "Question 2", type: "secret" },\
 *  { name: "question3", prompt: "Question 3", type: "char", options: "YN" },\
 *  { name: "question4", prompt: "Question 4", type: "choose", options: ["Option 1", "Option 2", "Option 3"], output: "index" },\
 *  { name: "question5", prompt: "Question 5", type: "multiple", options: ["Option 1", "Option 2", "Option 3"], max: 2 }\
 * ]\
 * \
 * Will prompt the user for each question and return an array with the answers.\
 * \
 * The type can be:\
 * \
 * - "question" (default)\
 * - "secret"\
 * - "char" (requires options)\
 * - "choose" (requires options)\
 * - "multiple" (requires options)
 * </odoc>
 */
const askStruct = (ar) => {
	if (isArray(ar)) {
		var _r = ar.map(t => {
			_$(t.name, "name").isString().$_()
			var __r = { name: t.name }
			
			t.prompt = _$(t.prompt, 'prompt').isString().default(t.name + ':') 
			t.type   = _$(t.type, 'type').oneOf(['?', 'question', 'secret', 'char', 'choose', 'multiple']).default('?')
			if (!t.prompt.endsWith(" ")) t.prompt += " "
			if (isString(t.help)) t.help = ansiColor("FAINT,ITALIC", t.help)

			switch(t.type) {
			case 'secret'  : __r.answer = askEncrypt(t.prompt); break
			case 'char'    : __r.answer = ask1(t.prompt, t.options); break
			case 'choose'  : __r.answer = t.options[askChoose(t.prompt, t.options, t.max, t.help)]; break
			case 'multiple': __r.answer = askChooseMultiple(t.prompt, t.options, t.max, t.help); break
			case "question": 
			case '?'       : 
			default        : __r.answer = ask(t.prompt)
			}
			if (isDef(t.output) && t.output == "index") {
				if (isArray(__r.answer)) {
					__r.answer = __r.answer.map(a => t.options.indexOf(a))
				} else {
					__r.answer = t.options.indexOf(__r.answer)
				}
			}
			return __r
		})
		return _r
	}
}

/**
 * <odoc>
 * <key>$channels(aChannel)</key>
 * Please check more details with the help from ow.ch. The available methods are:\
 * \
 * Channel basics:\
 * \
 * - create(shouldCompress, aType, options)\
 * - list()\
 * - destroy()\
 * - size()\
 * - subscribe(aFunction, onlyFromNow, anId)\
 * - unsubscribe(aId)\
 * - forEach(aFunction)\
 * - getAll(fullInfo)\
 * - getKeys(fullInfo)\
 * - getSortedKeys(fullInfo)\
 * - set(aKey, aValue, aForcedTimestamp)\
 * - setAll(keysArray, valuesArray, aForcedTimestamp)\
 * - unsetAll(keysArray, valuesArray, aForcedTimestamp)\
 * - get(aKey)\
 * - getSet(aMatch, aKey, aValue, aForcedTimestamp)\
 * - unset(aKey, aForcedTimestamp)\
 * - push(aKey, aValue)\
 * - pop(aKey)\
 * - shift(aKey)\
 * - stopJobs()\
 * - waitForJobs(aTimeout)\
 * - getName()\
 * \
 * Channel basic persistence:\
 * \
 * - storeAdd(aFilename, anArrayOfKeys, shouldCompress, runSubscribersForAll)\
 * - storeRestore(aFilename, anArrayOfKeys)\
 * \
 * Inter-channel HTTP REST:\
 * \
 * - expose(aLocalPortOrServer, aPath, aLogin, aPassword)\
 * - peer(aLocalPortOrServer, aPath, aRemoteURL, aAuthFunc, aUnAuthFunc, aMaxTime, aMaxCount)\
 * - unpeer(aRemoteURL)\
 * - createRemote(aURL, aTimeout, aLogin, aPass)
 * </odoc>
 */
const $channels = function(a) {
	ow.loadCh();
	
	return {
		getName      : function() { return a; },
		create       : function(shouldCompress, type, opts) { 
			if (isString(shouldCompress) && isMap(type)) {
				ow.ch.create(a, 1, shouldCompress, type)
			} else {
				ow.ch.create(a, shouldCompress, type, opts); return $channels(a)
			}
		},
		list         : function() { return ow.ch.list(); },
		destroy      : function() { ow.ch.destroy(a); return $channels(a); },
		size         : function() { return ow.ch.size(a); },
		subscribe    : function(aFunction, onlyFromNow, anId) { return ow.ch.subscribe(a, aFunction, onlyFromNow, anId); },
		unsubscribe  : function(aId) { ow.ch.unsubscribe(a, aId); return $channels(a); },
		forEach      : function(aFunction, x) { ow.ch.forEach(a, aFunction, x); return $channels(a); },
		getAll       : function(x) { return ow.ch.getAll(a, x); },
		getKeys      : function(full, x) { return ow.ch.getKeys(a, full, x); },
		getSortedKeys: function(full, x) { return ow.ch.getSortedKeys(a, full, x); },
		set          : function(aKey, aValue, aTs, aU, x) { return ow.ch.set(a, aKey, aValue, aTs, aU, x); },
		setAll       : function(aKeys, aValues, aTs, aU, x) { return ow.ch.setAll(a, aKeys, aValues, aTs, aU, x); },
		unsetAll     : function(aKeys, aValues, aTs, aU, x) { return ow.ch.unsetAll(a, aKeys, aValues, aTs, aU, x); },
		get          : function(aKey, x) { return ow.ch.get(a, aKey, x); },
		getSet       : function(aMatch, aKey, aValue, aForcedTimestamp, aU, x) { return ow.ch.getSet(a, aMatch, aKey, aValue, aForcedTimestamp, aU, x); },
		unset        : function(aKey, aTs, aU, x) { ow.ch.unset(a, aKey, aTs, aU, x); return $channels(a); },
		push         : function(aKey, aValue) { ow.ch.push(a, aKey, aValue); return $channels(a); },
		pop          : function(aKey) { return ow.ch.pop(a, aKey); },
		shift        : function(aKey) { return ow.ch.shift(a, aKey); },
		getVersion   : function() { return ow.ch.getVersion(a); },
		
		storeAdd     : function(aFilename, anArrayOfKeys, shouldCompress, forAll) { ow.ch.persistence.create(a, aFilename, anArrayOfKeys, shouldCompress, forAll); return $channels(a) },
		storeRestore : function(aFilename, anArrayOfKeys) { ow.ch.persistence.restore(a, aFilename, anArrayOfKeys); return $channels(a); },
		
		expose       : function(aLocalPortOrServer, aPath, aAuthFunc, aUnAuthFunc, noCheck) { return ow.ch.server.expose(a, aLocalPortOrServer, aPath, aAuthFunc, aUnAuthFunc, noCheck); },
		peer         : function(aLocalPortOrServer, aPath, aRemoteURL, aAuthFunc, aUnAuthFunc, aMaxTime, aMaxCount) { return ow.ch.server.peer(a, aLocalPortOrServer, aPath, aRemoteURL, aAuthFunc, aUnAuthFunc, aMaxTime, aMaxCount); },
		unpeer       : function(aRemoteURL) { return ow.ch.server.unpeer(a, aRemoteURL); },
		
		createRemote : function(aURL, aTimeout, aLogin, aPassword) {
			var u = new java.net.URL(Packages.openaf.AFCmdBase.afc.fURL(aURL));
			var urlPort = u.getPort();
			
			if (urlPort < 0 && u.getProtocol() == "https") urlPort = 443;
			if (urlPort < 0) urlPort = 80;
			
			var login, pass;
			if (isUnDef(aLogin)) {
				login = (u.getUserInfo() != null) ? String(java.net.URLDecoder.decode(u.getUserInfo().substring(0, u.getUserInfo().indexOf(":")), "UTF-8")) : undefined;
				pass  = (u.getUserInfo() != null) ? String(java.net.URLDecoder.decode(u.getUserInfo().substring(u.getUserInfo().indexOf(":") + 1), "UTF-8")) : undefined;
			} else {
				login = aLogin;
				pass  = aPassword;
			};

			var opts = {
				"login"   : login,
				"password": pass,
				"url"     : String(u.getProtocol() + "://" + u.getHost() + ":" + urlPort + u.getPath())
			};
			
			ow.ch.create(a, true, "remote", opts);
			return $channels(a);
		},
		
		stopJobs     : function() { ow.ch.stopAllJobs(a); return $channels(a); },
		waitForJobs  : function(aTimeout) { ow.ch.waitForJobs(a, aTimeout); return $channels(a); }
	}
}

/**
 * <odoc>
 * <key>$ch(aChannel)</key>
 * Please check more details with the help from ow.ch. The available methods are:\
 * \
 * Channel basics:\
 * \
 * - create(shouldCompress, aType, options)\
 * - list()\
 * - destroy()\
 * - size()\
 * - subscribe(aFunction, onlyFromNow, anId)\
 * - unsubscribe(aId)\
 * - forEach(aFunction)\
 * - getAll()\
 * - getKeys(fullInfo)\
 * - getSortedKeys(fullInfo)\
 * - set(aKey, aValue, aForcedTimestamp)\
 * - setAll(keysArray, valuesArray, aForcedTimestamp)\
 * - get(aKey)\
 * - getSet(aMatch, aKey, aValue, aForcedTimestamp)\
 * - unset(aKey, aForcedTimestamp)\
 * - push(aKey, aValue)\
 * - pop(aKey)\
 * - shift(aKey)\
 * - stopJobs()\
 * - waitForJobs(aTimeout)\
 * - getName()\
 * \
 * Channel basic persistence:\
 * \
 * - storeAdd(aFilename, anArrayOfKeys, shouldCompress)\
 * - storeRestore(aFilename, anArrayOfKeys)\
 * \
 * Inter-channel HTTP REST:\
 * \
 * - expose(aLocalPortOrServer, aPath, aAuthFunc, aUnAuthFunc)\
 * - peer(aLocalPortOrServer, aPath, aRemoteURL, aAuthFunc, aUnAuthFunc)\
 * - unpeer(aRemoteURL)\
 * - createRemote(aURL, aTimeout)
 * </odoc>
 */
const $ch = $channels;

var __threadPools
var __threadPoolFactor = 2
var __virtualExecutor

const __resetThreadPool = function(poolFactor) {
	__threadPoolFactor = poolFactor
   if (isDef(__threadPools)) { __threadPools.forEach(r => r.shutdown()); __threadPools.length = 0 }
   // Shutdown virtual thread executor if present
   if (isDef(__virtualExecutor)) { __virtualExecutor.shutdown(); __virtualExecutor = undefined; }
	__threadPools = __
	__getThreadPool()
}

const __getThreadPool = function(wantVirt) {
   // Use virtual threads if flag enabled
   if (wantVirt) {
	   if (isUnDef(__virtualExecutor)) {
		   // Create a virtual-thread-per-task executor
		   __virtualExecutor = java.util.concurrent.Executors.newVirtualThreadPerTaskExecutor();
	   }
	   return __virtualExecutor;
   }
   if (isUnDef(__threadPools)) {
	   if (isUnDef(__cpucores)) __cpucores = getNumberOfCores()
	   __threadPools = [ new java.util.concurrent.ForkJoinPool(__cpucores * __threadPoolFactor, java.util.concurrent.ForkJoinPool.defaultForkJoinWorkerThreadFactory, null, true) ]
   }

	for(let i = 0; i < __threadPools.length; i++) {
		if (__threadPools[i].getActiveThreadCount() < __threadPools[i].getParallelism()) return __threadPools[i]
	}
	__threadPools.push( new java.util.concurrent.ForkJoinPool(__cpucores * __threadPoolFactor, java.util.concurrent.ForkJoinPool.defaultForkJoinWorkerThreadFactory, null, true) )
	return __threadPools[__threadPools.length - 1]
}

const __getThreadPools = function() {
	var _r = {
		pools: 0,
		active: 0,
		running: 0,
		queued: 0,
		steals: 0,
		tasks: 0,
		parallelism: 0,
		poolSize: 0
	}

	if (isDef(__threadPools)) {
		__threadPools.forEach(r => {
			_r.pools += 1
			_r.active += r.getActiveThreadCount()
			_r.running += r.getRunningThreadCount()
			_r.queued += r.getQueuedSubmissionCount()
			_r.steals += r.getStealCount()
			_r.tasks += r.getQueuedTaskCount()
			_r.parallelism += r.getParallelism()
			_r.poolSize += Number(r.getPoolSize())
		})
	}

	return _r
}

/**
 * <odoc>
 * <key>oPromise(aFunction, aRejFunction, useVirtualThreads) : oPromise</key>
 * Custom Promise-like implementation. If you provide aFunction, this aFunction will be executed async in a thread and oPromise
 * object will be immediatelly returned. Optionally this aFunction can receive a resolve and reject functions for to you use inside
 * aFunction to provide a result with resolve(aResult) or an exception with reject(aReason). If you don't call theses functions the
 * returned value will be used for resolve or any exception thrown will be use for reject. You can use the "then" method to add more
 * aFunction that will execute once the previous as executed successfully (in a stack fashion). The return/resolve value from the 
 * previous function will be passed as the value for the second. You can use the "catch" method to add aFunction that will receive
 * a string or exception for any exception thrown with the reject functions. You can also provide a aRejFunction that works like a "catch"
 * method as previously described. 
 * Optionally if useVirtualThreads is true, the aFunction will be executed in a virtual thread, otherwise it will be executed in a normal thread.
 * </odoc>
 */
 const oPromise = function(aFunction, aRejFunction, useVirtualThreads) {
	this.states = {
		NEW: 0, FULFILLED: 1, PREFAILED: 2, FAILED: 3
	};

	this.state = $atomic(this.states.NEW, "int");
	this.executing = $atomic(false, "boolean");
	this.executors = new java.util.concurrent.ConcurrentLinkedQueue();
	this.vThreads = useVirtualThreads || false
	
	this.then(aFunction, aRejFunction);
};

/**
 * <odoc>
 * <key>oPromise.then(onFulfilled, onRejected) : oPromise</key>
 * Adds onFulfilled to the current oPromise stack to execute if the previous function was resolved successfully and receives the resolve/return
 * value as parameter. Also adds onRejected to the current oPromise stack to execute if the previous function was rejected and receives the
 * reason as parameter.
 * </odoc>
 */
oPromise.prototype.then = function(aResolveFunc, aRejectFunc) {
	if (isDef(aRejectFunc) && isFunction(aRejectFunc)) this.executors.add({ type: "reject", func: aRejectFunc });
	if (isDef(aResolveFunc) && isFunction(aResolveFunc)) {
		this.executors.add({ type: "exec", func: aResolveFunc});
		this.__exec();
	}
	return this;
};

/**
 * <odoc>
 * <key>oPromise.catch(onReject) : oPromise</key>
 * Adds onRejected to the current oPromise stack to execute if the previous function was rejected and receives the
 * reason as parameter.
 * </odoc>
 */
oPromise.prototype.catch = function(onReject) {
	if (isDef(onReject) && isFunction(onReject)) {
		this.executors.add({ type: "reject", func: onReject });
		this.__exec();
	}
	return this;
};

/**
 * <odoc>
 * <key>oPromise.all(anArray) : oPromise</key>
 * Returns an oPromise that will be resolved when all oPromise part of the anArray are fullfiled. If any of the oPromises
 * fails/rejects the returned oPromise will also be rejected/fail.
 * </odoc>
 */
oPromise.prototype.all = function(anArray) {
	if (this.state.get() != this.states.NEW || this.executing.get() == true) throw "oPromise is already executing.";

	var parent = this;

	this.then((res, rej) => {
		var shouldStop = false;
		var values = [];
		
		try {
			while(!shouldStop) {
				for(var iii in anArray) {
					if (anArray[iii] != null) {
						if (anArray[iii] instanceof oPromise) {
							if (!anArray[iii].executing.get()) {
								switch(anArray[iii].state.get()) {
								case anArray[iii].states.NEW:
									shouldStop = false;
									break;
								case anArray[iii].states.PREFAILED:
									shouldStop = false;
									break;
								case anArray[iii].states.FAILED:
									shouldStop = true;
									rej(anArray[iii].reason);
									break;
								case anArray[iii].states.FULFILLED:
									values.push(anArray[iii].value);
									anArray = deleteFromArray(anArray, iii);
									break;
								}
							} else {
								shouldStop = false;
							}
						} else {
							values.push(anArray[iii]);
							anArray = deleteFromArray(anArray, iii);
						}
					}
				}
				if (anArray.length <= 0) shouldStop = true;
			}
		
			res(values);
		} catch(e) {
			rej(e);
		}

		return values;
	});

	return this;
};

/**
 * <odoc>
 * <key>oPromise.race(anArray) : oPromise</key>
 * Returns an oPromise that will be resolved when any oPromise part of the anArray is fullfiled. If any of the oPromises
 * fails/rejects the returned oPromise will also be rejected/fail.
 * </odoc>
 */
oPromise.prototype.race = function(anArray) {
	if (this.state.get() != this.states.NEW || this.executing.get() == true) throw "oPromise is already executing.";
	
	var parent = this;

	this.then((res, rej) => {
		var shouldStop = false;
		var c = 0;
		
		try {
			while(!shouldStop) {
				for(var i in anArray) {
					if (anArray[i] != null) {
						if (anArray[i] instanceof oPromise) {
							if (!anArray[i].executing.get()) {
								switch(anArray[i].state.get()) {
								case anArray[i].states.NEW:
									shouldStop = false;				
									break;
								case anArray[i].states.PREFAILED:
									shouldStop = false;				
									break;
								case anArray[i].states.FAILED:
									shouldStop = true;
									rej(anArray[i].reason);
									return this;
								case anArray[i].states.FULFILLED:
									shouldStop = true;
									res(anArray[i].value);
									return this;
								}
							} else {
								shouldStop = false;
							}
						} else {
							shoudStop = true;
							res(anArray[i]);
							return this;
						}
					}
				}
			}
		} catch(e) {
			rej(e);
		}
		res();
		return this;
	});

	return this;    
};

oPromise.prototype.reject = function(aReason) {
	this.reason = aReason;
	this.state.set(this.states.PREFAILED);

	return this;
};

oPromise.prototype.resolve = function(aValue) {
	//if (this.state == this.states.FULFILLED) this.state = this.states.NEW;
	this.state.setIf(this.states.FULFILLED, this.states.NEW)
	this.value = (!isJavaObject(aValue) && isUnDef(aValue)) ? null : aValue;
	return this;
};

oPromise.prototype.cancel = function() {
	if (isDef(this.__f)) {
		return this.__f.cancel(true);
	}
};

oPromise.prototype.__exec = function() {
	var thisOP = this;

	do {
		try {
			this.__f = __getThreadPool(this.vThreads).submit(new java.lang.Runnable({
				run: () => {
					//var ignore = false;
					//syncFn(() => { if (thisOP.executing.get()) ignore = true; else thisOP.executing.set(true); }, thisOP.executing.get());
					if (!thisOP.executing.setIf(false, true)) return
					//if (ignore) return;
					
					try {
						while (thisOP.executors.size() > 0) {
							var f = thisOP.executors.poll();
							// Exec
							if (thisOP.state.get() != thisOP.states.PREFAILED && 
								thisOP.state.get() != thisOP.states.FAILED && 
								f != null && isDef(f) && f.type == "exec" && isDef(f.func) && isFunction(f.func)) {
								var res, done = false;
								try {
									var checkResult = $atomic(true, "boolean");
									if (isDef(thisOP.value)) {
										res = f.func(thisOP.value);
									} else {
										res = f.func(function (v) { checkResult.set(false); thisOP.resolve(v); },
													function (r) { checkResult.set(false); thisOP.reject(r); });
									}

									if (checkResult.get() &&
										(isJavaObject(res) || isDef(res)) &&
										res != null &&
										(thisOP.state.get() == thisOP.states.NEW || thisOP.state.get() == thisOP.states.FULFILLED)) {
										res = thisOP.resolve(res);
									}
								} catch (e) {
									thisOP.reject(e);
								}
							}
							// Reject
							if (thisOP.state.get() == thisOP.states.PREFAILED || thisOP.state.get() == thisOP.states.FAILED) {
								while (f != null && isDef(f) && f.type != "reject" && isDef(f.func) && isFunction(f.func)) {
									f = thisOP.executors.poll();
								}

								if (f != null && isDef(f) && isDef(f.func) && isFunction(f.func)) {
									try {
										f.func(thisOP.reason);
										thisOP.state.set(thisOP.states.FULFILLED);
									} catch (e) {
										thisOP.state.set(thisOP.states.FAILED);
										throw e;
									}
								} else {
									if (isUnDef(f) || f == null) thisOP.state.set(thisOP.states.FAILED);
								}
							}
						}
					} catch(ee) {
						throw ee;
					} finally {
						//syncFn(() => { thisOP.executing.set(false); }, thisOP.executing.get());
						thisOP.executing.set(false)

						if (thisOP.executors.isEmpty()) {
							thisOP.state.setIf(thisOP.states.NEW, thisOP.states.FULFILLED);
							thisOP.state.setIf(thisOP.states.PREFAILED, thisOP.states.FAILED);
						}
					}

					/*if (thisOP.state == thisOP.states.PREFAILED && thisOP.executors.isEmpty()) {
						thisOP.state = thisOP.states.FAILED;
					}*/
				}
			}));
		} catch(e) {
			if (String(e).indexOf("RejectedExecutionException") < 0) throw e;
		}
		// Try again if null
	} while(isUnDef(this.__f) || this.__f == null);

};

const javaRegExp = (text) => {
	var s = java.lang.String(text);
	var calcMods = (mods) => {
		if (isUnDef(mods)) return 0;
		if (isNumber(mods)) return mods;

		var v = 0;

		if (mods.indexOf("i") >= 0) v += java.util.regex.Pattern.CASE_INSENSITIVE;
		if (mods.indexOf("m") >= 0) v += java.util.regex.Pattern.MULTILINE;

		return v;
	};

	var addPC = (regexp, mods) => {
		if (isUnDef(global.__javaRegExp)) {
			global.__javaRegExp = {};
		}

		var id = regexp + String(mods);
		global.__javaRegExp[id] = java.util.regex.Pattern.compile(regexp, calcMods(mods));
		return id;
	};

	var removePC = (regexp, mods) => {
		if (isUnDef(global.__javaRegExp)) return;
		var id = regexp + String(mods);
		delete global.__javaRegExp[id];
		return id;
	};

	var getPC = (regexp, mods) => {
		if (isUnDef(global.__javaRegExp)) {
			return java.util.regex.Pattern.compile(regexp, calcMods(mods));
		} else {
			var id = regexp + String(mods);
			if (isDef(global.__javaRegExp[id])) {
				return global.__javaRegExp[id];
			} else {
				return java.util.regex.Pattern.compile(regexp, calcMods(mods));
			}
		}
	};

	return {
		/**
		 * <odoc>
		 * <key>javaRegExp(text).match(regExp, mods) : Array</key>
		 * Mimics, using Java, the javascript match function. Supported mods are "g", "m" and "i" or the java integer composed 
		 * mods. Returns the corresponding array.
		 * </odoc>
		 */
		match: (regexp, mods) => {
			var m = getPC(regexp, mods).matcher(s);
			var r = [];
			if (isDef(mods) && mods.indexOf("g") >= 0) {
				while(m.find()) { r.push(String(m.group())); }
			} else {
				m.find();
				r.push(String(m.group()));
			}
			return r;
		},
		/**
		 * <odoc>
		 * <key>javaRegExp(text).matchAll(regExp, mods) : Array</key>
		 * Mimics, using Java, the javascript match function with the "g" modifier. Supported mods are "m" and "i" or the java integer composed 
		 * mods. Returns the corresponding array.
		 * </odoc>
		 */
		matchAll: (regexp, mods) => {
			var m = getPC(regexp, mods).matcher(s);
			var r = [];
			while(m.find()) { r.push(String(m.group())); }
			return r;
		},
		/**
		 * <odoc>
		 * <key>javaRegExp(text).match(regExp, mods) : Array</key>
		 * Mimics, using Java, the javascript match function. Supported mods are "g", "m" and "i" or the java integer composed 
		 * mods. Returns the corresponding array.
		 * </odoc>
		 */
		replace: (regexp, replaceStr, mods) => {
			var m = getPC(regexp, mods).matcher(s);
			if (isDef(mods) && mods.indexOf("g") >= 0) {
				return String(m.replaceAll(replaceStr));
			} else {
				return String(m.replaceFirst(replaceStr));
			}     
		},
		/**
		 * <odoc>
		 * <key>javaRegExp(text).replaceAll(regExp, mods) : Array</key>
		 * Mimics, using Java, the javascript replace function with the "g" modifier. Supported mods are "m" and "i" or the java integer composed 
		 * mods. Returns the corresponding array.
		 * </odoc>
		 */
		replaceAll: (regexp, replaceStr, mods) => {
			var m = getPC(regexp, mods).matcher(s);
			return String(m.replaceAll(replaceStr));
		},
		/**
		 * <odoc>
		 * <key>javaRegExp().preCompile(regExp, mods)</key>
		 * Pre-compiles the regExp with the corresponding mods to be used by match, matchAll, replace, replaceAll, split and test until removePreCompiled
		 * is invoked for the same combination of regExp and mods.
		 * </odoc>
		 */
		preCompile: (regexp, mods) => {
			return addPC(regexp, mods);
		},
		/**
		 * <odoc>
		 * <key>javaRegExp().removePreCompiled(regExp, mods)</key>
		 * Removes a previously added pre compiled combination of regExp and mods.
		 * </odoc>
		 */
		removePreCompiled: (regexp, mods) => {
			return removePC(regexp, mods);
		},
		/**
		 * <odoc>
		 * <key>javaRegExp(text).split(regExp, mods) : Array</key>
		 * Returns an array of the result of spliting text using the provided regExp and mods. Supported mods are "g", "m" and "i" or the java integer composed 
		 * mods.
		 * </odoc>
		 */
		split: (regexp, mods) => {
			var ar = getPC(regexp, mods).split(s);
			var res = [];
			for(var ii = 0; ii < ar.length; ii++) {
				res.push(String(ar[ii]));
			}
			return res;
		},
		/**
		 * <odoc>
		 * <key>javaRegExp(text).test(regExp, mods) : boolean</key>
		 * Mimics, using Java, the javascript RegExp test function. Supported mods are "g", "m" and "i" or the java integer composed 
		 * mods. Returns the corresponding boolean value.
		 * </odoc>
		 */
		test: (regexp, mods) => {
			var m = getPC(regexp, mods).matcher(s);
			return m.find();
		}
	};
};

/**
 * <odoc>
 * <key>includeOPack(aOPackName, aMinVersion)</key>
 * Ensures that aOPackName is installed. Optionally you can provide a minimal opack version. If the opack is not installed,
 * can't be installed or cannot be updated to a version bigger or equal to aMinVersion an exception will be thrown.
 * </odoc>
 */
const includeOPack = function(aOPackName, aMinVersion) {
	_$(aOPackName).isString("The opack name needs to be a string").$_("Please provide an opack name.");
	if (isDef(aMinVersion) && !(isNumber(aMinVersion) || isString(aMinVersion))) throw "Please provide a number or string version.";

	if (aOPackName.toLowerCase() == "openaf") {
		if (isDef(aMinVersion)) {
			if (getVersion() < aMinVersion) throw("The OpenAF version is " + getVersion() + ". It needs to be updated to " + aMinVersion);
		}
		return true;
	}
	if (io.fileExists(aOPackName) && io.fileInfo(aOPackName).isDirectory) {
		// Check if it already exists
		if (isDef(getOPackPath(aOPackName))) {
			var version = $from(getOPackLocalDB()).equals("name", aOPackName).at(0).version
			// Check version
			if (version < aMinVersion) {
				oPack("add2db " + oPackName)
			}
		} else {
			// add it if it's on the same directory
			oPack("add2db " + aOPackName)
		}
	}
	if (isUnDef(getOPackPath(aOPackName))) {
		oPack("install " + aOPackName + " -deps");
		if (isUnDef(getOPackPath(aOPackName))) throw "Couldn't install opack '" + aOPackName + "'.";
	}
	if (isDef(aMinVersion)) {
		var version = $path(getOPackLocalDB(), "to_array(*)[?name==`" + aOPackName + "`] | [0].version");
		if (version < aMinVersion) {
			oPack("update " + aOPackName);
			version = $path(getOPackLocalDB(), "to_array(*)[?name==`" + aOPackName + "`] | [0].version");
			if (version < aMinVersion) throw "Couldn't update opack " + aOPackName + " from version " + version + " to >=" + aMinVersion;
		}
	}    
	return true;
};

/**
 * <odoc>
 * <key>$atomic(aInitValue, aType) : Object</key>
 * Creates an atomic object of aType (defaults to long) to be get/set atomically on a multithreading script initialized with aInitValue.
 * aType can be "int", "long" and "boolean". Each with different methods:\
 * \
 *    int.dec          - Decrement an integer\
 *    int.inc          - Increment an integer\
 *    int.get          - Get the current integer\
 *    int.getSet(n)    - Get and Set the current integer\
 *    int.getAdd(n)    - Get and Add to the current integer\
 *    int.setIf(t, n)  - Set the current integer to n if current value is t\
 *    int.set          - Set the current integer\
 * \
 *    long.dec         - Decrement an long\
 *    long.inc         - Increment an long\
 *    long.get         - Get the current long\
 *    long.getSet(n)   - Get and Set the current long\
 *    long.getAdd(n)   - Get and Add to the current long\
 *    long.setIf(t, n) - Set the current long to n if current value is t\
 *    long.set         - Set the current long\
 * \
 *    boolean.get         - Get the current boolean\
 *    boolean.set         - Set the current boolean\
 *    boolean.getSet      - Get and Set the current boolean\
 *    boolean.setIf(t, n) - Set the current boolean to n if current value is t\
 * \
 * </odoc>
 */
 const $atomic = function(aInit, aType) {
	aInit = _$(aInit).default(0);
	aType = _$(aType).isString().oneOf([ "int", "long", "boolean" ]).default("long");

	var _fNum = function(obj) { this.v = obj; };
	_fNum.prototype.getObj        = function()  { return this.v; };
	_fNum.prototype.dec           = function()  { return this.v.decrementAndGet(); };
	_fNum.prototype.inc           = function()  { return this.v.incrementAndGet(); };
	_fNum.prototype.get           = function()  { return this.v.get(); };
	_fNum.prototype.getSet        = function(n) { return this.v.getAndSet(n); };
	_fNum.prototype.getAdd        = function(n) { return this.v.getAndAdd(n); };
	_fNum.prototype.set           = function(n) { return this.v.set(n); };
	_fNum.prototype.setIf         = function(t, n) { return this.v.compareAndSet(t, n); }

	var _fBol = function() { this.v = new java.util.concurrent.atomic.AtomicBoolean(aInit); };
	_fBol.prototype.getObj        = function()  { return this.v; };
	_fBol.prototype.get           = function()  { return this.v.get(); };
	_fBol.prototype.getSet        = function(n) { return this.v.getAndSet(n); };
	_fBol.prototype.set           = function(n) { return this.v.set(n); };
	_fBol.prototype.setIf         = function(t, n) { return this.v.compareAndSet(t, n) };

	switch(aType) {
	case "boolean": return new _fBol();
	case "int"    : return new _fNum(new java.util.concurrent.atomic.AtomicInteger(aInit));
	case "long"   : return new _fNum(new java.util.concurrent.atomic.AtomicLong(aInit));
	}
};

var __clogErr = $atomic(), __clogWarn = $atomic(), __clogInfo = $atomic();

/**
 * <odoc>
 * <key>$throwIfUnDef(aFunc) : Function</key>
 * Returns a function that tries to execute aFunc and throws and exception if the result if undefined otherwise returns the result. Usefull with $retry
 * when waiting for a "defined" result.
 * </odoc>
 */
const $throwIfUnDef = function(aFunc) {
	return function() {
		var r = aFunc();
		if (isUnDef(r)) 
		   throw "undefined";
		else 
		   return r;
	}
};

/**
 * <odoc>
 * <key>$retry(aFunction, aNumOfTriesOrFunction) : Object</key>
 * Tries to execute aFunction and return the corresponding returned result. If aNumOfTriesOrFunction is a number (defaults to 1)
 * and aFunction throws an exception it will repeat aFunction until it doesn't throw an exception or for the number of aNumOfTriesOrFunc.
 * If aNumOfTriesOrFunction is a function it will be called whenever aFunction throws an exception with the corresponding exception
 * as argument and it will retry until aNumOfTriesOrFunction returns false.
 * </odoc>
 */
const $retry = function(aFunc, aNumTries) {
	var aFn;
	aNumTries = _$(aNumTries).default(1);

	if (isNumber(aNumTries)) {
		aFn = () => { aNumTries--; return (aNumTries > 0); };
	}

	if (isFunction(aNumTries)) {
		aFn = aNumTries;
	}

	if (isUnDef(aFn)) throw "Can't determine how to retry.";

	var error, res;

	do {
		try {
			res = aFunc();
			error = __;
			return res;
		} catch(e) {
			error = e;
		}
	} while(aFn(error));

	return error;
};

var __flock = {};
const $flock = function(aLockFile, aTimeout, aWaitPerCall) {
	aTimeout     = _$(aTimeout, "aTimeout").isNumber().default(60000); 
	aWaitPerCall = _$(aWaitPerCall, "aWaitPerCall").isNumber().default(2500);

	if (isUnDef(__flock[aLockFile])) {
		$lock("__flock::" + aLockFile).lock();
		if (isUnDef(__flock[aLockFile])) {
			__flock[aLockFile] = { i: $atomic(0) };
			var t = now();
			$retry(() => { __flock[aLockFile].f = io.randomAccessFile(aLockFile, "rw") }, () => {
				if (now() - t > aTimeout) {
					return false;
				} else {	
					sleep(aWaitPerCall, true);
				}
				return true;
			});
			if (!isJavaObject(__flock[aLockFile].f) || isNull(__flock[aLockFile].f)) throw "Can't access '" + aLockFile + "'";
			
			__flock[aLockFile].c = __flock[aLockFile].f.getChannel();
		}
		$lock("__flock::" + aLockFile).unlock();
	}
	var r = {
		getObject: () => __flock[aLockFile].f,
		/**
		 * <odoc>
		 * <key>$flock.lock()</key>
		 * Given aLockFile will use the file to filesystem lock until unlock is called.\
		 * \
		 *    $flock(aLockFile).lock()\
		 * \
		 * </odoc>
		 */
				getMainObject: () => __flock[aLockFile],
		lock : () => {
			try {
				if (isUnDef(__flock[aLockFile].l)) __flock[aLockFile].l = __flock[aLockFile].c.lock();
								__flock[aLockFile].i.inc();
				return true;
			} catch(e) {
				r.destroy();
				return false;
			}
		},
		/**
		 * <odoc>
		 * <key>$flock.unlock()</key>
		 * Given aLockFile will unlock freeing any previous calls to lock.\
		 * \
		 *    $flock(aLockFile).unlock()\
		 * \
		 * </odoc>
		 */
		unlock: () => {
			if (isDef(__flock[aLockFile].i)) {
						   if (__flock[aLockFile].i.get() > 0) __flock[aLockFile].i.dec();
						   if (__flock[aLockFile].i.get() <= 0) {
							 if (isDef(__flock[aLockFile]) && isDef(__flock[aLockFile].l) && !isNull(__flock[aLockFile].l)) {
				// warning on some newer JVMs: https://github.com/mozilla/rhino/issues/462
				__flock[aLockFile].l.release();
							 }
						   }
			   return __flock[aLockFile].i.get();
						}
		},
		/**
		 * <odoc>
		 * <key>$flock.isLocalLocked() : Boolean</key>
		 * Given aLockFile will return true if locked in the current OpenAF instance otherwise false (see also isLocked).\
		 * \
		 *    $flock(aLockFile).isLocalLocked()\
		 * \
		 * </odoc>
		 */
		isLocalLocked: () => {
			if (isDef(__flock[aLockFile]) && isDef(__flock[aLockFile].l) && !isNull(__flock[aLockFile].l) && __flock[aLockFile].l.isValid()) {
				return true;
			} else {
				return false;
			}
		},
		/**
		 * <odoc>
		 * <key>$flock.isLocked() : Boolean</key>
		 * Given aLockFile will return true if locked in the current OpenAF instance or on the filesystem (by using $flock.tryLock) otherwise false (see also isLocalLocked).\
		 * \
		 *    $flock(aLockFile).isLocked()\
		 * \
		 * </odoc>
		 */
		isLocked: () => {
			return !r.tryLock(() => {});
		},
		/**
		 * <odoc>
		 * <key>$flock.destroy()</key>
		 * Given aLockFile will destroy the provided lock entry.\
		 * \
		 *    $flock(aLockFile).destroy()\
		 * \
		 * </odoc>
		 */
		destroy: () => {
			if (r.isLocalLocked()) r.unlock();
			//if (isDef(__flock[aLockFile].l)) __flock[aLockFile].l.close();
			try {
				if (isJavaObject(__flock[aLockFile].f)) __flock[aLockFile].f.close();
				if (isJavaObject(__flock[aLockFile].c)) __flock[aLockFile].c.close();
			} catch(e) {
			}
			$lock("__flock::" + aLockFile).lock();
			delete __flock[aLockFile];
			$lock("__flock::" + aLockFile).unlock();
			$lock("__flock::" + aLockFile).destroy();
		},
		/**
		 * <odoc>
		 * <key>$flock.tryLock(aFunction) : Boolean</key>
		 * Given aLockFile only execute aFunction if it's unlocked. If it
		 * executed aFunction it will return true otherwise false.\
		 * \
		 *    $flock(aLockFile).tryLock(() => { ... })\
		 * \
		 * </odoc>
		 */
		tryLock: f => {
			if (r.isLocalLocked()) return false;
			try {
				__flock[aLockFile].l = __flock[aLockFile].c.tryLock();
				if (isNull(__flock[aLockFile].l)) return false;
				try {
					f();
					return true;
				} finally {
					r.unlock();
				}
			} catch(e) {
				r.destroy();
			}
			return false;
		}
	};

	return r;
};

var __lock = {};
const $lock = function(aName) {
	if (isUnDef(__lock[aName])) {
		sync(() => {
			__lock[aName] = new java.util.concurrent.locks.ReentrantLock();
		}, __lock);
	}

	return {
		getObject: () => __lock[aName],
		/**
		 * <odoc>
		 * <key>$lock.lock()</key>
		 * Given aLockName will lock until unlock is called.\
		 * \
		 *    $lock(aLockName).lock()\
		 * \
		 * </odoc>
		 */
		lock     : () => __lock[aName].lockInterruptibly(),
		/**
		 * <odoc>
		 * <key>$lock.unlock()</key>
		 * Given aLockName will unlock freeing any previous calls to lock.\
		 * \
		 *    $lock(aLockName).unlock()\
		 * \
		 * </odoc>
		 */
		unlock   : () => __lock[aName].unlock(),
		/**
		 * <odoc>
		 * <key>$lock.isLocked() : Boolean</key>
		 * Given aLockName will return true if locked otherwise false.\
		 * \
		 *    $lock(aLockName).isLocked()\
		 * \
		 * </odoc>
		 */
		isLocked : () => __lock[aName].isLocked(),
		/**
		 * <odoc>
		 * <key>$lock.destroy()</key>
		 * Given aLockName will destroy the provided lock entry.\
		 * \
		 *    $lock(aLockName).destroy()\
		 * \
		 * </odoc>
		 */
		destroy  : () => {
			sync(() => {
				delete __lock[aName];
			}, __lock);
		},
		/**
		 * <odoc>
		 * <key>$lock.tryLock(aFunction, aTimeoutMS) : Boolean</key>
		 * Given aLockName only execute aFunction when it's able to lock or after aTimeoutMS. If it
		 * executed aFunction it will return true otherwise false.\
		 * \
		 *    $lock(aLockName).tryLock(() => { ... })\
		 * \
		 * </odoc>
		 */
		tryLock  : (f, t) => {
			_$(f, "function").isFunction().$_();
			t = _$(t, "timeout").isNumber().default(__);

			if (isDef(t)) {
				if (__lock[aName].tryLock(t, java.util.concurrent.TimeUnit.MILLISECONDS)) {
					try {
						f();
					} catch(e) {
						throw e;
					} finally {
						__lock[aName].unlock();
					}
					return true;
				} else {
					return false;
				}
			} else {
				if (__lock[aName].tryLock()) {
					try {
						f();
					} catch(e) {
						throw e;
					} finally {
						__lock[aName].unlock();
					}
					return true;
				} else {
					return false;
				}
			}
		}
	}
}

/**
 * <odoc>
 * <key>$await(aName) : Object</key>
 * Wrapper around the Java wait/notify mechanism. For the provided name will returen an object with the following 
 * functions wait (will block until a notify is invoked), notify (will notify and unblock one of the wait invocations), 
 * notifyAll (will notify and unblock all wait invocations) and destroy existing references to aName.
 * </odoc>
 */
const $await = function(aName) {
	if (isUnDef(global.__await)) global.__await = {};
	if (isUnDef(global.__await[aName])) global.__await[aName] = new java.lang.Object();

	var _f = function(n) { this.n = n; };
	_f.prototype.wait = function(aTimeout) {
		syncFn(() => {
			if (isDef(aTimeout)) 
				global.__await[this.n].wait(aTimeout); 
			else
				global.__await[this.n].wait();
		}, global.__await[this.n]);
	};
	_f.prototype.notify = function() {
		syncFn(() => {
			global.__await[this.n].notify();
		}, global.__await[this.n]);
	};
	_f.prototype.notifyAll = function() {
		syncFn(() => {
			global.__await[this.n].notifyAll()
		}, global.__await[this.n])
	}
	_f.prototype.destroy = function() {
		this.notifyAll();
		delete global.__await[this.n];
	};

	return new _f(aName);
};

/**
 * <odoc>
 * <key>$doA2B(aAFunction, aBFunction, numberOfDoPromises, defaultTimeout, aErrorFunction, useVirtualThreads)</key>
 * Will call aAFunction with a function as argument that should be used to "send" values to aBFunction. aBFunction will be call asynchronously in individual
 * $do up to the numberOfDoPromises limit. The defaultTimeout it 2500ms. If aErrorFunction is defined it will received any exceptions thrown from aBFunction with the corresponding arguments array.
 * If useVirtualThreads is true it will use virtual threads to execute aBFunction. If useVirtualThreads is false (default) it will use the thread pool.
 * Use virtual threads if you want to execute aBFunction without blocking the current thread (IO bound operations / high concurrency).
 * </odoc>
 */
const $doA2B = function(aAFn, aBFn, noc, defaultTimeout, aErrorFunction, useVirtualThreads) {
	var recs = $atomic(), srecs = $atomic(), trecs = $atomic()
	var noc  = _$(noc).isNumber().default(getNumberOfCores())
	var id   = md5(aAFn.toString() + aBFn.toString()) + (Math.random()*100000000000000000)
	defaultTimeout = _$(defaultTimeout).isNumber().default(2500)

	var B = function(aObj) {
		var cc = recs.inc()
		srecs.inc()
		while(cc > noc) { $await(id).wait(defaultTimeout); cc = recs.get(); }
		if (useVirtualThreads) {
			$doV(() => {
				aBFn(aObj)
				//aBFn.apply(this, arguments)
				recs.dec()
				trecs.inc()
				$await(id).notify()
			}).catch((e) => {
				recs.dec()
				trecs.inc()
				$await(id).notify()
				aErrorFunction(e, aObj)
				//aErrorFunction(e, arguments)
			});
		} else {
			$do(() => {
				aBFn(aObj)
				//aBFn.apply(this, arguments)
				recs.dec()
				trecs.inc()
				$await(id).notify()
			}).catch((e) => {
				recs.dec()
				trecs.inc()
				$await(id).notify()
				aErrorFunction(e, aObj)
				//aErrorFunction(e, arguments)
			});
		}

		$await(id).notify()
	}
 
	aAFn(B)
	$await(id).notify()

	do { $await(id).wait(defaultTimeout); } while(recs.get() > 0 && srecs.get() != trecs.get())
	$await(id).destroy()
};

/**
 * <odoc>
 * <key>$do(aFunction, aRejFunction) : oPromise</key>
 * Instantiates and returns a oPromise. If you provide aFunction, this aFunction will be executed async in a thread and oPromise
 * object will be immediatelly returned. Optionally this aFunction can receive a resolve and reject functions for to you use inside
 * aFunction to provide a result with resolve(aResult) or an exception with reject(aReason). If you don't call theses functions the
 * returned value will be used for resolve or any exception thrown will be use for reject. You can use the "then" method to add more
 * aFunction that will execute once the previous as executed successfully (in a stack fashion). The return/resolve value from the 
 * previous function will be passed as the value for the second. You can use the "catch" method to add aFunction that will receive
 * a string or exception for any exception thrown with the reject functions. You can also provide aRejFunction to work as a "catch"
 * method as previously described before.
 * </odoc>
 */
const $do = function(aFunction, aRejFunction) {
	return new oPromise(aFunction, aRejFunction);
};

/**
 * <odoc>
 * <key>$doV(aFunction, aRejFunction) : oPromise</key>
 * Equivalent to $do but using virtual threads (if available) to execute the aFunction. This will allow the aFunction to be executed
 * without blocking the current thread. If aFunction is not provided it will return a new oPromise that will be resolved
 * when the first executor is added to it. If aRejFunction is provided it will be used as a "catch" method for the oPromise.
 * </odoc>
 */
const $doV = function(aFunction, aRejFunction) {
	return new oPromise(aFunction, aRejFunction, true)
}

/**
 * <odoc>
 * <key>$doAll(anArray) : oPromise</key>
 * Returns an oPromise that will be resolved when all oPromise part of the anArray are fullfiled. If any of the oPromises
 * fails/rejects the returned oPromise will also be rejected/fail.
 * </odoc>
 */
const $doAll = function(anArray) {
	return new oPromise().all(anArray);
};

/**
 * <odoc>
 * <key>$doFirst(anArray) : oPromise</key>
 * Returns an oPromise that will be resolved when any oPromise part of the anArray is fullfiled. If any of the oPromises
 * fails/rejects the returned oPromise will also be rejected/fail.
 * </odoc>
 */
const $doFirst = function(anArray) {
	return new oPromise().race(anArray);
};

/**
 * <odoc>
 * <key>$doWait(aPromise, aWaitTimeout) : oPromise</key>
 * Blocks until aPromise is fullfilled or rejected. Optionally you can specify aWaitTimeout between checks.
 * Returns aPromise.
 * </odoc>
 */
const $doWait = function(aPromise, aWaitTimeout) {
	_$(aPromise, "aPromise").check(v => { return v instanceof oPromise }).$_()

	var __sfn = aP => { try { return aP.state.get() } catch(e) { sleep(25); return __ } }
	var __efn = aP => { try { return aP.executing.get() } catch(e) { sleep(25); return __ } }
	var __ffn = aP => { try { return aP.__f.get() } catch(e) { sleep(25); return __ } }

	if (isDef(aWaitTimeout)) {
		var init = now();
		while(__sfn(aPromise) != aPromise.states.FULFILLED && 
				__sfn(aPromise) != aPromise.states.FAILED &&
				(__efn(aPromise) || !aPromise.executors.isEmpty()) &&
				((now() - init) < aWaitTimeout)) {
			__ffn(aPromise)
		}
		while(((now() - init) < aWaitTimeout) && (__efn(aPromise) || !aPromise.executors.isEmpty())) {
			__ffn(aPromise)
		}
	} else {
		while(__sfn(aPromise) != aPromise.states.FULFILLED && 
			  __sfn(aPromise) != aPromise.states.FAILED &&
			  (isUnDef(aPromise.__f) || __efn(aPromise) || !aPromise.executors.isEmpty())) {
			__ffn(aPromise)
		}
		while((isUnDef(aPromise.__f) || __efn(aPromise) || !aPromise.executors.isEmpty())) {
			__ffn(aPromise)
		}
	}

	return aPromise;
}

const $sh = function(aString, aIn) {
	var __sh = function(aCmd, aIn) {
		this.q = [];
		this.wd = __;
		this.fcb = __;
		this.t = __;
		this.dw = __;
		ow.loadFormat();
		if (ow.format.isWindows()) this.encoding = "cp850"; else this.encoding = __;
		if (isDef(aCmd)) this.q.push({ cmd: aCmd, in: aIn });
	};

	/**
	 * <odoc>
	 * <key>$sh.useEncoding(aEncoding) : $sh</key>
	 * Forces the aEncoding to be used.
	 * </odoc>
	 */
	__sh.prototype.useEncoding = function(aEncoding) {
		this.encoding = aEncoding;
		return this;
	};

	/**
	 * <odoc>
	 * <key>$sh.dontWait(aBooleanValue) : $sh</key>
	 * If aBooleanValue = true the execution won't wait for output (default: false).
	 * </odoc>
	 */
	__sh.prototype.dontWait = function(aFlag) {
		_$(aFlag, "dontWait flag").isBoolean().$_();
		this.dw = aFlag;
		return this;
	};

	/**
	 * <odoc>
	 * <key>$sh.envs(aMap, includeExisting) : $sh</key>
	 * Uses aMap of strings as the environment variables map. If includeExisting = true it will include the current environment variables also.
	 * </odoc>
	 */
	__sh.prototype.envs = function(aMap, includeExisting) {
		aMap = _$(aMap, "envs map").isMap().default({});
		if (includeExisting) aMap = merge(aMap, getEnvs());
		this.envs = aMap;
		return this;
	};

	/**
	 * <odoc>
	 * <key>$sh.sh(aCmd, aIn) : $sh</key>
	 * When executing aCmd (with .exec) sets additional aCmds (with the optional corresponding aIn) to use.
	 * </odoc>
	 */
	__sh.prototype.sh = function(aCmd, aIn) {
		if (isDef(aCmd)) this.q.push({ cmd: aCmd, in: aIn });
		return this;
	};

	/**
	 * <odoc>
	 * <key>$sh.pwd(aPwd) : $sh</key>
	 * When executing aCmd (with .exec) use aPwd as the current working directory.
	 * </odoc>
	 */
	__sh.prototype.pwd = function(aPwd) {
		this.wd = aPwd;
		return this;
	};

	/**
	 * <odoc>
	 * <key>$sh.cb(aCallbackFunc) : $sh</key>
	 * When executing aCmd (with .get) use aCallbackFunc function.
	 * </odoc>
	 */
	__sh.prototype.cb = function(aCallback) {
		this.fcb = () => { return aCallback; };
		return this;
	};

	/**
	 * <odoc>
	 * <key>$sh.prefix(aPrefix, aTemplate) : $sh</key>
	 * When executing aCmd (with .get) it will use ow.format.streamSHPrefix with aPrefix and optionally aTemplate.
	 * </odoc>
	 */
	__sh.prototype.prefix = function(aPrefix, aTemplate) {
		aPrefix = _$(aPrefix, "prefix").isString().default("sh")
		var parent = this
		var aFn = (s, isE) => {
			if (isE) parent._fcbE += s+"\n"; else parent._fcbO += s+"\n"
		}
		this.fcb = () => { return ow.format.streamSHPrefix(aPrefix, this.encoding, __, aTemplate, aFn) }
		return this
	};

	/**
	 * <odoc>
	 * <key>$sh.timeout(aTimeout) : $sh</key>
	 * When executing aCmd (with .exec) uses aTimeout.
	 * </odoc>
	 */
	__sh.prototype.timeout = function(aTimeout) {
		this.t = aTimeout;
		return this;
	};

	/**
	 * <odoc>
	 * <key>$sh.mkdir(aDir) : $sh</key>
	 * Immediately creates aDir before executing aCmd (with .exec).
	 * </odoc>
	 */
	__sh.prototype.mkdir = function(aDir) {
		io.mkdir(aDir);
		return this;
	};

	/**
	 * <odoc>
	 * <key>$sh.mv(aSource, aTarget) : $sh</key>
	 * Immediately moves aSource to aTarget before executing aCmd (with .exec).
	 * </odoc>
	 */
	__sh.prototype.mv = function(aSource, aTarget) {
		io.mv(aSource, aTarget);
		return this;
	};

	/**
	 * <odoc>
	 * <key>$sh.cp(aSource, aTarget) : $sh</key>
	 * Immediately copies aSource to aTarget before executing aCmd (with .exec).
	 * </odoc>
	 */
	__sh.prototype.cp = function(aSource, aTarget) {
		io.cp(aSource, aTarget);
		return this;
	};

	/**
	 * <odoc>
	 * <key>$sh.rename(aSource, aTarget) : $sh</key>
	 * Immediately renames aSource to aTarget before executing aCmd (with .exec).
	 * </odoc>
	 */
	__sh.prototype.rename = function(aSource, aTarget) {
		io.rename(aSource, aTarget);
		return this;
	};

	/**
	 * <odoc>
	 * <key>$sh.rm(aFilePath) : $sh</key>
	 * Immediately removes aFilePath before executing aCmd (with .exec).
	 * </odoc>
	 */
	__sh.prototype.rm = function(aFilePath) {
		io.rm(aFilePath);
		return this;
	};

	/**
	 * <odoc>
	 * <key>$sh.get(aIdx) : Object</key>
	 * Immediately copies the result of executing aCmd string or array (and any other commands in queue added using sh).
	 * If aIdx is provided it will return the map entry for the corresponding command on the array otherwise it will return the array.
	 * </odoc>
	 */
	__sh.prototype.get = function(aIdx) {
		var res = [];
		for(var ii in this.q) {
			if (isDef(this.q[ii].cmd)) {
				this._fcbE = ""
				this._fcbO = ""
				var _res = merge(sh(this.q[ii].cmd, this.q[ii].in, this.t, false, this.wd, true, (isDef(this.fcb) ? this.fcb() : __), this.encoding, this.dw, this.envs), this.q[ii]);
				if (isDef(this.fcb)) {
					_res.stdout = this._fcbO.slice(0,-1)
					_res.stderr = this._fcbE.slice(0,-1)
				}
				res.push(_res);
				if (isDef(this.fe)) {
					var rfe = this.fe(_res);
					if (isDef(rfe) && rfe == false) {
						if (isNumber(aIdx) && isDef(res[aIdx])) return res[aIdx]; else return res;
					}
				}
			}
		}

		if (isNumber(aIdx) && isDef(res[aIdx])) return res[aIdx]; else return res;
	};
	
	/**
	 * <odoc>
	 * <key>$sh.getJson(aIdx) : Object</key>
	 * Immediately copies the result of executing aCmd string or array (and any other commands in queue added using sh) trying to parse it as json (will ingore non json content).
	 * If aIdx is provided it will return the map entry for the corresponding command on the array otherwise it will return the array.
	 * </odoc>
	 */
	__sh.prototype.getJson = function(aIdx) {
		var res = this.get(aIdx);

		if (isArray(res)) {
			for(var ii in res) {
				res[ii].stdout = jsonParse(res[ii].stdout, __, __, true)
				res[ii].stderr = jsonParse(res[ii].stderr, __, __, true)
			}
		} else {
			res.stdout = jsonParse(res.stdout, __, __, true)
			res.stderr = jsonParse(res.stderr, __, __, true)
		}

		return res;
	};

	/**
	 * <odoc>
	 * <key>$sh.getJsSlon(aIdx) : Object</key>
	 * Immediately copies the result of executing aCmd string or array (and any other commands in queue added using sh) trying to parse it as json or slon.
	 * If aIdx is provided it will return the map entry for the corresponding command on the array otherwise it will return the array.
	 * </odoc>
	 */
	__sh.prototype.getJsSlon = function(aIdx) {
		var res = this.get(aIdx)

		if (isArray(res)) {
			for(var ii in res) {
				res[ii].stdout = af.fromJSSLON(res[ii].stdout)
				res[ii].stderr = af.fromJSSLON(res[ii].stderr)
			}
		} else {
			res.stdout = af.fromJSSLON(res.stdout)
			res.stderr = af.fromJSSLON(res.stderr)
		}

		return res
	}

	/**
	 * <odoc>
	 * <key>$sh.getYaml(aIdx) : Object</key>
	 * Immediately copies the result of executing aCmd string or array (and any other commands in queue added using sh) trying to parse it as yaml.
	 * If aIdx is provided it will return the map entry for the corresponding command on the array otherwise it will return the array.
	 * </odoc>
	 */
	__sh.prototype.getYaml = function(aIdx) {
		var res = this.get(aIdx)

		if (isArray(res)) {
			for(var ii in res) {
				res[ii].stdout = af.fromYAML(res[ii].stdout)
				res[ii].stderr = af.fromYAML(res[ii].stderr)
			}
		} else {
			res.stdout = af.fromYAML(res.stdout)
			res.stderr = af.fromYAML(res.stderr)
		}

		return res
	}

	/**
	 * <odoc>
	 * <key>$sh.exec(aIdx) : Object</key>
	 * Immediately copies the result of executing aCmd string or array (and any other commands in queue added using sh).
	 * If aIdx is provided it will return the map entry for the corresponding command on the array otherwise it will return the array.
	 * </odoc>
	 */
	__sh.prototype.exec = function(aIdx) {
		var res = [];
		for(var ii in this.q) {
			if (isDef(this.q[ii].cmd)) {
				var _res = merge(sh(this.q[ii].cmd, this.q[ii].in, this.t, true, this.wd, true, (isDef(this.fcb) ? this.fcb() : __), this.encoding, this.dw, this.envs), this.q[ii]);
				res.push(_res);
				if (isDef(this.fe)) {
					var rfe = this.fe(_res);
					if (isDef(rfe) && rfe == false) {
						if (isNumber(aIdx) && isDef(res[aIdx])) return res[aIdx]; else return res;
					}
				}
			}
		}

		if (isNumber(aIdx) && isDef(res[aIdx])) return res[aIdx]; else return res;
	};

	/**
	 * <odoc>
	 * <key>$sh.exit(aFunc) : $sh</key>
	 * Sets aFunc function to execute after the execution of aCmd (with .exec).
	 * </odoc>
	 */
	__sh.prototype.exit = function(aFunc) {
		this.fe = aFunc;
		return this;
	};

	return new __sh(aString, aIn);
};

const $ssh = function(aMap) {
	/**
	 * <odoc>
	 * <key>$ssh.$ssh(aMap) : $ssh</key>
	 * Builds an object to allow access through ssh. aMap should be a ssh string with the format: ssh://user:pass@host:port/identificationKey?timeout=1234&amp;compression=true or
	 * a map with the keys: host, port, login, pass, id (file key) / key (string representation), compress and timeout. See "help SSH.SSH" for more info.
	 * </odoc>
	 */
	var __ssh = function(aMap) {
		this.q = [];
		this.fcb = __;
		this.t = __;
		this.ppty = __;

		plugin("SSH");
		aMap = _$(aMap).$_("Please provide a ssh map or an URL");
		this.map = aMap;
		this.ssh = this.__connect(aMap);
	};

	__ssh.prototype.__getssh = function() {
		if (isUnDef(this.ssh)) this.ssh = this.__connect(this.map);
		return this.ssh;
	};

	__ssh.prototype.__getsftp = function() {
		if (isUnDef(this.sftp)) this.sftp = this.__connect(this.map);
		return this.sftp;
	};

	__ssh.prototype.__connect = function(aMap) {
		var s;

		if (isMap(aMap)) {
			aMap.port = _$(aMap.port).isNumber().default(22);
			aMap.compress = _$(aMap.compress).isBoolean().default(false);
			if (isDef(aMap.url)) aMap.host = aMap.url;
		}
		if (!(aMap instanceof SSH)) {
			if (isString(aMap.key)) {
				this.__f = io.createTempFile("__oaf_ssh_", ".oaf");
				io.writeFileString(this.__f, aMap.key);
				aMap.id = this.__f;
			}
			s = new SSH((isString(aMap) ? aMap : aMap.host), aMap.port, aMap.login, aMap.pass, aMap.id, aMap.compress, aMap.timeout);
		} else {
			s = aMap;
		}
		return s;
	};

	/**
	 * <odoc>
	 * <key>$ssh.sh(aCmd, aIn) : $ssh</key>
	 * Sets aCmd to be executed with an optional aIn (stdin) on the remote host defined by aMap (host, port, login, pass, id, compress and timeout).
	 * </odoc>
	 */
	__ssh.prototype.sh = function(aCmd, aIn) {
		if (isDef(aCmd)) this.q.push({ cmd: aCmd, in: aIn });
		return this;
	};

	/**
	 * <odoc>
	 * <key>$ssh.pwd(aPwd) : $ssh</key>
	 * Sets aPwd directory for getting and sending files to a remote host defined by aMap (host, port, login, pass, id, compress and timeout).
	 * </odoc>
	 */
	__ssh.prototype.pwd = function(aPwd) {
		this.__getsftp.cd(aPwd);
		return this;
	};

	/**
	 * <odoc>
	 * <key>$ssh.timeout(aTimeout) : $ssh</key>
	 * Sets aTimeout in ms for the ssh/sftp connection to a remote host defined by aMap (host, port, login, pass, id, compress and timeout).
	 * </odoc>
	 */
	__ssh.prototype.timeout = function(aTimeout) {
		this.t = aTimeout;
		return this;
	};

	/**
	 * <odoc>
	 * <key>$ssh.cb(aCallback) : $ssh</key>
	 * Sets aCallback function to execute during the execution of commands on a remote host defined by aMap (host, port, login, pass, id, compress and timeout).
	 * </odoc>
	 */
	__ssh.prototype.cb = function(aCallback) {
		this.fcb = () => { return aCallback; };
		return this;
	};

	/**
	 * <odoc>
	 * <key>$ssh.prefix(aPrefix, aTemplate) : $ssh</key>
	 * When executing aCmd (with .get) it will use ow.format.streamSHPrefix with aPrefix and optionally aTemplate.
	 * </odoc>
	 */
	__ssh.prototype.prefix = function(aPrefix, aTemplate) {
		aPrefix = _$(aPrefix, "prefix").isString().default("sh");
		ow.loadFormat();
		this.fcb = () => { return ow.format.streamSHPrefix(aPrefix, this.encoding, "\n", aTemplate) };
		return this;
	};

	/**
	 * <odoc>
	 * <key>$ssh.mkdir(aDirectory) : $ssh</key>
	 * Creates aDirectory via SFTP on a remote host defined by aMap (host, port, login, pass, id, compress and timeout).
	 * </odoc>
	 */
	__ssh.prototype.mkdir = function(aDir) {
		this.__getsftp().mkdir(aDir);
		return this;
	};

	/**
	 * <odoc>
	 * <key>$ssh.getFile(aSource, aTarget) : $ssh</key>
	 * Gets aSource filepath and stores it locally on aTarget from a remote host defined by aMap (host, port, login, pass, id, compress and timeout).
	 * </odoc>
	 */
	__ssh.prototype.getFile = function(aSource, aTarget) {
		this.__getsftp().sftpGet(aSource, aTarget);
		return this;
	};

	/**
	 * <odoc>
	 * <key>$ssh.putFile(aSource, aTarget) : $ssh</key>
	 * Puts aSource local filepath and stores it remotely in aTarget on a remote host defined by aMap (host, port, login, pass, id, compress and timeout).
	 * </odoc>
	 */
	__ssh.prototype.putFile = function(aSource, aTarget) {
		this.__getsftp().sftpPut(aSource, aTarget);
		return this;
	};

	/**
	 * <odoc>
	 * <key>$ssh.rename(aSource, aTarget) : $ssh</key>
	 * Renames aSource filepath to aTarget filepath on a remote host defined by aMap (host, port, login, pass, id, compress and timeout).
	 * </odoc>
	 */
	__ssh.prototype.rename = function(aSource, aTarget) {
		this.__getsftp().rename(aSource, aTarget);
		return this;
	};
	
		/**
	 * <odoc>
	 * <key>$ssh.listFiles(aRemotePath) : Array</key>
	 * Returns an array of maps with the listing of aRemotePath provided.
	 * </odoc>
	 */
	__ssh.prototype.listFiles = function(aPath) {
		var lst = this.__getsftp().listFiles(aPath);
		this.close();
		return (isDef(lst) ? lst.files : []);
	};

	/**
	 * <odoc>
	 * <key>$ssh.rm(aFilePath) : $ssh</key>
	 * Remove aFilePath from a remote host defined by aMap (host, port, login, pass, id, compress and timeout).
	 * </odoc>
	 */
	__ssh.prototype.rm = function(aFilePath) {
		this.__getsftp().rm(aFilePath);
		return this;
	};

	/**
	 * <odoc>
	 * <key>$ssh.rmdir(aFilePath) : $ssh</key>
	 * Removes a directory from a remote host defined by aMap (host, port, login, pass, id, compress and timeout).
	 * </odoc>
	 */
	__ssh.prototype.rmdir = function(aFilePath) {
		this.__getsftp().rmdir(aFilePath);
		return this;
	};

	/**
	 * <odoc>
	 * <key>$ssh.pty(aFlag) : $ssh</key>
	 * Sets the flag to use or not a pty term allocation on the ssh connection to a remote host defined by aMap (host, port, login, pass, id, key, compress and timeout).
	 * </odoc>
	 */
	__ssh.prototype.pty = function(aFlag) {
		this.ppty = aFlag;
		return this;
	};

	/**
	 * <odoc<
	 * <key>$ssh.key(aKeyString) : $ssh</key>
	 * Sets the key aKeyString to be used in replacement to id.
	 * </odoc>
	 */
	__ssh.prototype.key = function(aKey) {
		this.key = aKey;
		return this;
	};

	/**
	 * <odoc>
	 * <key>$ssh.close() : $ssh</key>
	 * Closes a remote host connection defined by aMap (host, port, login, pass, id, compress and timeout).
	 * </odoc>
	 */
	__ssh.prototype.close = function() {
		if (isDef(this.ssh)) this.ssh.close();
		if (isDef(this.sftp)) this.sftp.close();
		if (isDef(this.__f)) io.rm(this.__f);
		return this;
	};

	/**
	 * <odoc>
	 * <key>$ssh.tunnelLocal(aLocalPort, aRemoteHost, aRemotePort) : $ssh</key>
	 * Creates a local tunnel mapping aLocalPort to aRemoteHost:aRemotePort using the ssh connection defined by aMap (host, port, login, pass, id, compress and timeout).
	 * </odoc>
	 */
	__ssh.prototype.tunnelLocal = function(aLocalPort, aRemoteHost, aRemotePort) {
		this.__getssh().tunnelLocal(aLocalPort, aRemoteHost, aRemotePort);
		return this;
	};

	/**
	 * <odoc>
	 * <key>$ssh.tunnelLocalBind(aLocalInterface, aLocalPort, aRemoteHost, aRemotePort) : $ssh</key>
	 * Creates a local tunnel mapping aLocalInterface:aLocalPort to aRemoteHost:aRemotePort using the ssh connection defined by aMap (host, port, login, pass, id, compress and timeout).
	 * </odoc>
	 */
	__ssh.prototype.tunnelLocalBind = function(aLocalInterface, aLocalPort, aRemoteHost, aRemotePort) {
		this.__getssh().tunnelLocalBind(aLocalInterface, aLocalPort, aRemoteHost, aRemotePort);
		return this;
	};

	/**
	 * <odoc>
	 * <key>$ssh.tunnelRemote(aRemotePort, aLocalAddress aLocalPort) : $ssh</key>
	 * Creates a remote tunnel mapping aRemotePort to aLocalAddress:aLocalPort using the ssh connection defined by aMap (host, port, login, pass, id, compress and timeout).
	 * </odoc>
	 */
	__ssh.prototype.tunnelRemote = function(aRemotePort, aLocalAddress, aLocalPort) {
		this.__getssh().tunnelRemote(aRemotePort, aLocalAddress, aLocalPort);
		return this;
	};

	/**
	 * <odoc>
	 * <key>$ssh.tunnelRemoteBind(aRemoteInterface, aRemotePort, aLocalAddress aLocalPort) : $ssh</key>
	 * Creates a remote tunnel mapping aRemoteInterface:aRemotePort to aLocalAddress:aLocalPort using the ssh connection defined by aMap (host, port, login, pass, id, compress and timeout).
	 * </odoc>
	 */
	__ssh.prototype.tunnelRemoteBind = function(aRemoteInterface, aRemotePort, aLocalAddress, aLocalPort) {
		this.__getssh().tunnelRemoteBind(aRemoteInterface, aRemotePort, aLocalAddress, aLocalPort);
		return this;
	};

	/**
	 * <odoc>
	 * <key>$ssh.get(aIdx) : Object</key>
	 * Executes a list of commands previously set on a remote host connection defined by aMap (host, port, login, pass, id, compress and timeout).
	 * IO is not inherit. If aIdx is provided it will return the map entry for the corresponding command on the array otherwise it will return the array.
	 * </odoc>
	 */
	__ssh.prototype.get = function(aIdx) {
		var res = [];
		if (isDef(this.t)) this.__getssh().setTimeout(this.t);
		for(var ii in this.q) {
			if (isDef(this.q[ii].cmd)) {
				var _res = merge(this.__getssh().exec(this.q[ii].cmd, this.q[ii].in, false, this.ppty, true, (isDef(this.fcb) ? this.fcb() : __)), this.q[ii]);
				res.push(_res);
				if (isDef(this.fe)) {
					var rfe = this.fe(_res, this);
					if (isDef(rfe) && rfe == false) {
						if (isNumber(aIdx) && isDef(res[aIdx])) return res[aIdx]; else return res;
					}
				}
			}
		}

		this.close();
		if (isNumber(aIdx) && isDef(res[aIdx])) return res[aIdx]; else return res;
	};
	
	/**
	 * <odoc>
	 * <key>$ssh.getJson(aIdx) : Object</key>
	 * Executes a list of commands previously set on a remote host connection defined by aMap (host, port, login, pass, id, compress and timeout).
	 * IO is not inherit. If aIdx is provided it will return the map entry for the corresponding command on the array otherwise it will return the array.
	 * The stdout and stderr will be pre-parsed from json to objects.
	 * </odoc>
	 */
	__ssh.prototype.getJson = function(aIdx) {
		var res = this.get(aIdx);

		if (isArray(res)) {
			for(var ii in res) {
				res[ii].stdout = jsonParse(res[ii].stdout);
				res[ii].stderr = jsonParse(res[ii].stderr);
			}
		} else {
			res.stdout = jsonParse(res.stdout);
			res.stderr = jsonParse(res.stderr);
		}

		return res;
	};

	/**
	 * <odoc>
	 * <key>$ssh.exec(aIdx) : Array</key>
	 * Executes a list of commands previously set on a remote host connection defined by aMap (host, port, login, pass, id, compress and timeout).
	 * IO is inherit. If aIdx is provided it will return the map entry for the corresponding command on the array otherwise it will return the array.
	 * </odoc>
	 */
	__ssh.prototype.exec = function(aIdx) {
		var res = [];
		if (isDef(this.t)) this.__getssh().setTimeout(this.t);
		for(var ii in this.q) {
			if (isDef(this.q[ii].cmd)) {
				var _res = merge(this.__getssh().exec(this.q[ii].cmd, this.q[ii].in, true, this.ppty, true, (isDef(this.fcb) ? this.fcb() : __)), this.q[ii]);
				res.push(_res);
				if (isDef(this.fe)) {
					var rfe = this.fe(_res, this);
					if (isDef(rfe) && rfe == false) {
						if (isNumber(aIdx) && isDef(res[aIdx])) return res[aIdx]; else return res;
					}
				}
			}
		}

		this.close();
		if (isNumber(aIdx) && isDef(res[aIdx])) return res[aIdx]; else return res;
	};

	/**
	 * <odoc>
	 * <key>$ssh.exit(aFunc) : $ssh</key>
	 * Sets a callback aFunc to execute upon a command execution s a remote host connection defined by aMap (host, port, login, pass, id, compress and timeout).
	 * </odoc>
	 */
	__ssh.prototype.exit = function(aFunc) {
		this.fe = aFunc;
		return this;
	};

	return new __ssh(aMap);
};

/**
 * <odoc>
 * <key>$csv(aMap) : $csv</key>
 * Provides a shortcut to access CSV functionality. Optionally you can provide options through aMap.\
 * \
 * Examples:\
 *   $csv().fromInArray(anArray)\
 *   $csv().fromInFile("test.csv").toOutArray()\
 *   $csv().fromInFile("test.csv").toOutFn(m => print( af.toSLON(m) ))\
 *   $csv().fromInString( $csv().fromInArray( io.listFiles(".").files ) ).toOutArray()
 * </odoc>
 */
const $csv = function(aMap) {
	var _s = {
		quoteMode: "MINIMAL", withHeader: true
	}
	aMap = _$(aMap, "aMap").isMap().default({})
	_s = merge(_s, aMap)

	var _to, _from
	var csv = new CSV()

	var _r = {
		fromInFn: fn => {
			var wasUnDef = false
			if (isUnDef(_to)) {
				_to = af.newOutputStream()
				wasUnDef = true
			}
			csv.setStreamFormat(_s)
			csv.toStream(_to, function() { 
				var res = fn() 
				if (isMap(res)) {
					Object.keys(res).forEach(k => {
						switch(descType(res[k])) {
						case "undefined":
							res[k] = null
							break
						case "date" :
							res[k] = res[k].toISOString()
							break
						case "map"  :
						case "array":
							res[k] = stringify(res, __, "")
						}
					})
					return res
				}
			})
			_to.close()
			return (wasUnDef ? _to.toString() : true)
		},
		fromInArray: (ar, fn) => {
			ar = _$(ar, "array").isArray().default([])
			var ari = ar.length
			fn = _$(fn, "fn").isFunction().default(() => (ari >= 0 ? clone(ar[ar.length - ari--]) : __))

			if (ari <= 0) return ""
			
			_s.withHeaders = Object.keys(ar[0])
			csv.setStreamFormat(_s)
			return _r.fromInFn(fn)
		},
		fromInString: s => {
			_from = af.fromString2InputStream(s)
			return _r
		},
		toOutStream: aS => {
			_to = aS
			return _r
		},
		toOutFile: (aF, append) => {
			append = _$(append, "append").isBoolean().default(false)
			_to = io.writeFileStream(aF, append)
			if (append) _r.setHeader(false)
			return _r
		},
		fromInFile: aF => {
			_from = io.readFileStream(aF)
			return _r
		},
		fromInStream: aS => {
			_from = aS
			return _r 
		},
		toOutFn: fn => {
			if (isUnDef(_s.withHeader)) _r.setHeader(true)
			if (!isJavaObject(_from)) throw "Require 'fromStream'"

			csv.setStreamFormat(_s)
			csv.fromStream(_from, function(m) { fn(m) })
			_from.close()
			
			return true
		},
		toOutArray: () => {
			var ar = []

			_r.toOutFn(m => {
				ar.push(m)
			})			

			return ar
		},
		setFormat: aF => {
			aF = _$(aF, "format").oneOf(["default", "excel", "informix_unload_csv", "informix_unload", "mysql", "rfc4180", "oracle", "postgresql_csv", "postgresql_text", "tdf"]).$_()
			_s.format = aF.toUpperCase()
			return _r
		},
		setHeader: aH => {
			aH = _$(aH, "header").isBoolean().default(true)
			_s.withHeader = aH
			return _r
		},
		withHeaders: aHs => {
			aHs = _$(aHs, "headers").isArray().$_()
			_s.withHeaders = aHs
			return _r
		},
		setQuoteMode: aM => {
			aM = _$(aM, "quoteMode").oneOf(["all", "all_non_null", "minimal", "non_numeric", "none"]).$_()
			_s.quoteMode = aM.toUpperCase()
			return _r
		},
		withDelimiter: aD => {
			aD = _$(aD, "delimiter").isString().default(",")
			_s.withDelimiter = aD
			return _r
		},
		withEscape: aE => {
			aE = _$(aE, "escape").isString().default("\"")
			_s.withEscape = aE
			return _r
		},
		withNull: aN => {
			aN = _$(aN, "null").isString().default("_NA")
			_s.withNullString = aN
			return _r
		},
		getSettings: () => {
			return _s
		},
		setSettings: s => {
			_s = s
			return _r
		}
	}

	return _r
}

/**
 * <odoc>
 * <key>$set(aKey, aValue)</key>
 * Sets aValue with aKey so it can be retrieved with $get later.
 * </odoc>
 */
const $set = function(aK, aV) {
	_$(aK, "aK").isString().$_();
	_$(aV, "aV").$_();

	if ($ch().list().indexOf("oaf::global") < 0) {
		$ch("oaf::global").create();
	}

	$ch("oaf::global").set({ k: aK }, { k: aK, v: aV });
}

/**
 * <odoc>
 * <key>$get(aKey) : Object</key>
 * Returns a value previously set with $set with aKey.
 * </odoc>
 */
const $get = function(aK) {
	_$(aK, "aK").isString().$_();

	if ($ch().list().indexOf("oaf::global") < 0) {
		$ch("oaf::global").create();
	}

	var res = $ch("oaf::global").get({ k: aK });
	
	if (isDef(res) && isDef(res.v)) return res.v; else return __;
}

/**
 * <odoc>
 * <key>$unset(aKey)</key>
 * Unset a previously set value with aKey.
 * </odoc>
 */
const $unset = function(aK) {
	_$(aK, "aK").isString().$_();

	if ($ch().list().indexOf("oaf::global") < 0) {
		$ch("oaf::global").create();
	}

	$ch("oaf::global").unset({ k: aK });
}

/**
 * <ojob>
 * <key>$output(aObj, args, aFunc, shouldReturn) : String</key>
 * Tries to output aObj in different ways give the args provided. If args.__format or args.__FORMAT is provided it will force 
 * displaying values as "json", "prettyjson", "slon", "ndjson", "xml", "yaml", "table", "stable", "ctable", "tree", "html", "text", "md", "map", "res", "key", "args", "jsmap", "csv", "pm" (on the __pm variable with _list, _map or result) or "human". In "human" it will use the aFunc
 * provided or a default that tries printMap or sprint. If a format isn't provided it defaults to human or global.__format if defined. 
 * If shouldReturn = true the string output will be returned
 * </ojob>
 */
const $output = function(aObj, args, aFunc, shouldReturn) {
	args = _$(args).default({})
	ow.loadFormat()

	var fnP = _s => {
		if (shouldReturn)
			return _s
		else {
			if (isUnDef(_s)) {
				print("")
			} else {
				if (pause) ow.format.string.pauseString(_s); else print(_s)
			}
		}
	}

	aFunc = _$(aFunc, "aFunction").isFunction().default((obj) => {
		if (isArray(obj) || isMap(obj))
			fnP(printTreeOrS(obj, __, { noansi: !__conAnsi }))
		else
			fnP(isString(obj) ? obj : stringify(obj))
	});

	var format = (isDef(global.__format) ? global.__format : "human")
	var path = __, csv = __, from = __, key = "res", sql = __, pause = false

	if (isDef(args.__FORMAT) && !isNull(args.__FORMAT)) format = String(args.__FORMAT).toLowerCase()
	if (isDef(args.__format) && !isNull(args.__format)) format = String(args.__format).toLowerCase()

	if (isDef(args.__PATH) && !isNull(args.__PATH)) path = String(args.__PATH)
	if (isDef(args.__path) && !isNull(args.__path)) path = String(args.__path)

	if (isDef(args.__FROM) && !isNull(args.__FROM)) from = String(args.__FROM)
	if (isDef(args.__from) && !isNull(args.__from)) from = String(args.__from)

	if (isDef(args.__SQL) && !isNull(args.__SQL)) sql = String(args.__SQL)
	if (isDef(args.__sql) && !isNull(args.__sql)) sql = String(args.__sql)

	if (isDef(args.__CSV) && !isNull(args.__CSV)) csv = args.__CSV.trim().startsWith("{") ? jsonParse(args.__CSV, true) : af.fromSLON(args.__CSV)
	if (isDef(args.__csv) && !isNull(args.__csv)) csv = args.__csv.trim().startsWith("{") ? jsonParse(args.__csv, true) : af.fromSLON(args.__csv)

	if (isDef(args.__KEY) && !isNull(args.__KEY)) key = String(args.__KEY)
	if (isDef(args.__key) && !isNull(args.__key)) key = String(args.__key)

	if (isDef(args.__PAUSE) && !isNull(args.__PAUSE)) pause = toBoolean(args.__PAUSE)
	if (isDef(args.__pause) && !isNull(args.__pause)) pause = toBoolean(args.__pause)

	var res = isDef(path) ? $path(aObj, path) : aObj
	res = isDef(from) ? $from(res).query(af.fromNLinq(from)) : res
	res = isDef(sql) ? $sql(res, sql) : res
	switch (format) {
		case "json":
			return fnP(stringify(res, __, ""))
		case "prettyjson":
			return fnP(stringify(res))
		case "cjson":
			__ansiColorFlag = true
			__conConsole = true
			return fnP(colorify(res))
		case "gb64json":
			return fnP(af.fromBytes2String(af.toBase64Bytes(io.gzip(af.fromString2Bytes(stringify(res, __, ""))))))
		case "slon":
			return fnP(ow.format.toSLON(res))
		case "cslon":
			__ansiColorFlag = true
			__conConsole = true
			return fnP(ow.format.toCSLON(res))
		case "ndjson":
			if (isArray(res)) return res.map(line => fnP(stringify(line, __, "")))
		case "xml":
			return fnP(af.fromObj2XML(res, true))
		case "yaml":
			return fnP(af.toYAML(res, __, true))
		case "cyaml":
			__ansiColorFlag = true
			__conConsole = true
			return fnP(af.toYAML(res, __, true, true))
		case "table":
			if (isMap(res)) res = [res]
			if (isArray(res)) return fnP(printTable(res, __, __, __conAnsi, (__conAnsi || isDef(this.__codepage) ? "utf" : __)))
			break
		case "stable":
			if (isMap(res)) res = [res]
			if (isArray(res)) return fnP(printTable(res, (__conAnsi ? isDef(__con) && __con.getTerminal().getWidth() : __), true, __conAnsi, (__conAnsi || isDef(this.__codepage) ? "utf" : __), __, true, true, true))
			break
		case "ctable":
			__ansiColorFlag = true
			__conConsole = true
			if (isMap(res)) res = [res]
			if (isArray(res)) return fnP(printTable(res, (__conAnsi ? isDef(__con) && __con.getTerminal().getWidth() : __), true, __conAnsi, (__conAnsi || isDef(this.__codepage) ? "utf" : __), __, true, false, true))
			break
		case "tree":
			return fnP(printTreeOrS(res, __, { noansi: !__conAnsi, mono: false, color: false }))
		case "ctree":
			__ansiColorFlag = true
			__conConsole = true
			return fnP(printTreeOrS(res, __, { noansi: !__conAnsi, mono: false, color: true }))
		case "mtree":
			//__ansiColorFlag = true
			//__conConsole = true
			return fnP(printTreeOrS(res, __, { noansi: true, mono: true, color: false, curved: false }))
		case "btree":
			return fnP(printTreeOrS(res, __, { noansi: true, mono: false, color: false }))
		case "res":
			if (isDef(res)) $set("res", res)
			break
		case "key":
			if (isDef(res)) $set(key, res)
			break
		case "args":
			if (isArray(res))
				args._list = res
			else
				if (isMap(res))
					args._map = res
				else
					args.result = res
			break
		case "jsmap":
		case "html":
			var _res = ow.loadTemplate().html.parseMap(res, true)
			return fnP("<html><meta charset=\"utf-8\"><style>" + _res.css + "</style><body" + (__flags.MD_DARKMODE == "true" ? " class=\"njsmap_dark\"" : "") + ">" + _res.out + "</body></html>")
		case "text":
			return fnP(String(res))
		case "md":
			__ansiColorFlag = true
			__conConsole = true
			return fnP(ow.format.withMD(String(res)))
		case "pm":
			var _p;
			if (isArray(res)) _p = {
				_list: res
			}
			if (isMap(res)) _p = {
				_map: res
			}
			if (isUnDef(_p)) _p = {
				result: res
			}
			__pm = merge(__pm, _p)
			break;
		case "csv":
			if (isMap(res)) res = [res]
			if (isArray(res)) {
				return fnP($csv(csv).fromInArray(res))
			}
			break
		case "map":
			return fnP(printMap(res, __, (__conAnsi || isDef(this.__codepage) ? "utf" : __), __conAnsi))
		default:
			if (format.startsWith("set_")) {
				$set(format.substring(4), res)
			} else {
				aFunc(res)
			}
	}
	return fnP(__)
}
const $o = $output

/**
 * <odoc>
 * <key>$err(exception, rethrow, returnStr, code)</key>
 * Prints the exception stack trace and the code where it was thrown. If rethrow is true it will throw the exception again. If returnStr is true it will return the string instead of printing it.
 * </odoc>
 */
const $err = function(exception, rethrow, returnStr, code) {
	// Cache the file name and line number, providing sensible defaults.
	var file = exception.fileName || ""
	var lineNum = parseInt(exception.lineNumber, 10)
	var str = isUnDef(exception.name) ? [ ansiColor("UNDERLINE,BOLD", String(exception)) ] : [ ansiColor("UNDERLINE,BOLD", `${exception.name} @${file}:${exception.lineNumber}`) ]

	if (exception.message !== undefined) {
		str.push(["\n", ansiColor("", exception.message)].join(""))
	}

	var isNavErr = (__flags.OAF_ERRSTACK && "lineNumber" in exception)

	// If we need to print the error stack, cache the split stack lines.
	let stackLines
	if (__flags.OAF_ERRSTACK && isNavErr && exception.stack !== undefined) {
		stackLines = exception.stack.split("\n")
		// Color the entire stack at once.
		let coloredStack = stackLines.map(line => ansiColor("FAINT,ITALIC", line)).join("\n")
		str.push(["\n", coloredStack].join(""))
	}

	if (!returnStr) {
		printnl(ow.loadFormat().withSideLine(str.join(""), __, "red"))
		str = []
	}

	if (__flags.OAF_ERRSTACK && isNavErr) {
		// If no file name exists, try to extract it from the cached stack lines
		if (!file && stackLines && stackLines.length > 0 && code === undefined) {
			var matchLine = stackLines.find(r => /at [^:]+:/.test(r))
			if (matchLine) {
				file = matchLine.trim().split(" ")[1].split(":")[0]
			}
		}
		// Avoid reading file more than once by checking the cached file variable.
		if (file && io.fileExists(file)) {
			code = io.readFileString(file)
		}

		// If lineNum = 0 try to extract it from the cached stack lines
		if (code !== undefined && lineNum === 0 && stackLines && stackLines.length > 0) {
			if (stackLines[0].indexOf(":") > 0) {
				var ar = stackLines[0].match(/at [^:]+:(\d+)/);
				lineNum = parseInt(ar[1], 10)
			}
		} 

		if (code !== undefined && !isNaN(lineNum) && isFinite(lineNum)) {
			var lcode = code.split(/[\r\n]/)
			var start = Math.max(0, lineNum - 3)
			var end = Math.min(lcode.length, lineNum + 3)
			str.push(ansiColor("FAINT", "   v\n"))
			var numWidth = Math.max(String(start).length, String(end).length)
			var lnFormat = "%" + numWidth + "d"

			for (var i = start; i < end; i++) {
				var lineStr = $ft(lnFormat, i + 1) + ": " + lcode[i]
				if (i === lineNum - 1) {
					str.push([ansiColor("RED,BOLD,UNDERLINE", ["> ", lineStr].join("")), "\n"].join(""))
				} else {
					str.push(["  ", ansiColor("RED,FAINT", lineStr), "\n"].join(""))
				}
			}
		}
		if (isJavaException(exception)) {
			str.push("\n")
			var jStack = getJavaStackTrace(exception)
				.map(r => ansiColor("FAINT,ITALIC", `  at ${r.className}.${r.methodName}(${r.fileName}:${r.lineNumber})`))
				.join("\n")
			str.push(["\n", jStack].join(""))
		}
	}
	
	str = str.join("")
	if (returnStr) {
		return str
	} else {
		print(str)
	}
	
	if (rethrow) throw exception
}

Float32Array.from = function(arr) {
	var _r = new Float32Array(arr.length)
	for(var i = 0; i < arr.length; i++) {
		_r[i] = arr[i]
	}
	return _r
}
Float32Array.prototype.slice = function(start,end) {
	start = start || 0
	end = end || this.length
	var _r = new Float32Array(end - start)
	for(var i = start; i < end; i++) {
		_r[i - start] = this[i]
	}
	return _r
}
Float32Array.prototype.forEach = function(fn) {
	for(var i = 0; i < this.length; i++) {
		fn(this[i], i, this)
	}
}

var __OpenAFUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)";
const __setUserAgent = function(aNewAgent) {
	__OpenAFUserAgent = _$(aNewAgent).isString().default(__OpenAFUserAgent);
	java.lang.System.setProperty("http.agent", __OpenAFUserAgent);
}

var console = { log: log, warn: logWarn, error: logErr };

// Startup
// -------

//$do(() => { __initializeCon(); });
//__initializeCon();

// Set logging to ERROR 
/*{
	// Issue 34
	if (java.lang.System.getProperty("java.util.logging.config.file") == null) {
		java.lang.System.setProperty("java.util.logging.config.file", "");
	}

	if (__noSLF4JErrorOnly) {
		try {
			var i = Packages.org.slf4j.LoggerFactory.getLogger(Packages.ch.qos.logback.classic.Logger.ROOT_LOGGER_NAME).getLoggerContext().getLoggerList().iterator();
			while (i.hasNext()) {
				Packages.org.slf4j.LoggerFactory.getLogger(i.next().getName()).setLevel(Packages.ch.qos.logback.classic.Level.ERROR);
			}
		} catch (e) {}
	}
};*/

// Set user agent
//{
	__setUserAgent();
//}

// Set network DNS TTL
//(function() {
	java.security.Security.setProperty("networkaddress.cache.ttl", 60);
//})();

// Set __pm
var __pm = __pmIn;
__pmOut = __pm;

__flags = merge(__flags, getEnvsDef("OAF_FLAGS", __, __, true))

// -------------------------------------
// Profile support (must be always last)

var OPENAFPROFILE;
if (isUnDef(OPENAFPROFILE)) OPENAFPROFILE = ".openaf_profile";

(function() {
	var prof = "";
	try {
		var fprof = __gHDir() + "/" + OPENAFPROFILE;
		if (io.fileExists(fprof)) {
			loadCompiled(fprof);
		}
	} catch(e) {
		if (e.message.indexOf("java.io.FileNotFoundException") < 0 &&
			e.message.indexOf("java.nio.file.NoSuchFileException") < 0) throw e;
	}

	try {
		if (af.getClass("openaf.OAFRepack").getResourceAsStream("/" + OPENAFPROFILE) != null) {
			var fprof = getOpenAFJar() + "::" + OPENAFPROFILE;
			prof = io.readFileString(fprof);
			af.compile(prof);
		}
	} catch(e) {
		if (e.message.indexOf("java.io.FileNotFoundException") < 0 &&
			e.message.indexOf("java.nio.file.NoSuchFileException") < 0 &&
			e.message.indexOf("java.io.IOException") < 0 &&
			e.message.indexOf("java.lang.NullPointerException: entry") < 0) throw e;
	}
})();

// Set HTTPD server
Packages.openaf.plugins.HTTPServer.DEFAULT_HTTP_SERVER = __flags.HTTPD_DEFAULT_IMPL

// OAF Code Integrity for script files
var __scriptfile
if (isString(__scriptfile)) {
	__codeVerify(io.readFileString(__scriptfile), __scriptfile)
}
