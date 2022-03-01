//OPENAF common functions
//Author: Nuno Aguiar

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
 * <key>isJavaObject(aObj) : boolean</key>
 * Returns true if aObj is a Java object, false otherwise
 * </odoc>
 */
 const isJavaObject = function(obj) {
	//var s = Object.prototype.toString.call(obj);
	//return (s === '[object JavaObject]' || s === '[object JavaArray]');
	try {
		if (obj.getClass() instanceof java.lang.Object)
			return true
		else
			return false
	} catch(e) {
		return false
	}
}

/**
 * <odoc>
 * <key>isDef(aObject) : boolean</key>
 * Returns true if the provided aObject is defined as a javascript variable. It will return false otherwise.
 * (see also isUnDef). Shortcut for the isDefined function.
 * </odoc>
 */
const isDef = function(aObject)   { return (isJavaObject(aObject) || !(typeof aObject == 'undefined')) ? true : false; }
/**
 * <odoc>
 * <key>isUnDef(aObject) : boolean</key>
 * Returns true if the provided aObject is undefined as a javascript variable. It will return false otherwise.
 * (see also isDef). Shortcut for the isUndefined function.
 * </odoc>
 */
const isUnDef = function(aObject) { return (!isJavaObject(aObject) && typeof aObject == 'undefined') ? true : false; }

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
var OAF_INTEGRITY = {};
// If OAF_INTEGRITY_WARN is false OAF execution is halted if any integrity hash is found to be different
var OAF_INTEGRITY_WARN = true; 
// If OAF_INTEGRITY_STRICT is true no OAF will execute if it's integrity is not verified.
var OAF_INTEGRITY_STRICT = false;
// If OAF_SIGNATURE_STRICT is true no OAF will execute if it's signature is not valid.
var OAF_SIGNATURE_STRICT = false;
// Use OAF_SIGNATURE_KEY key java object to validate OAF signatures;
var OAF_SIGNATURE_KEY = __;
// If OAF_VALIDATION_STRICT = true no OAF will execute if the signature doesn't exist or is not valid or if it's integrity wasn't checked & passed.
var OAF_VALIDATION_STRICT = false;

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

var __bfprint = {};
var __bfprintCodePage = io.getDefaultEncoding();
const bfprintnl = function(str, codePage) {
	if (isUnDef(codePage)) codePage = __bfprintCodePage;
	if (isUnDef(__bfprint[codePage])) __bfprint[codePage] = new java.io.BufferedWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(java.io.FileDescriptor.out), codePage), 512);

	__bfprint[codePage].write(str);
	__bfprint[codePage].flush();
}

const bfprintErrnl = function(str, codePage) {
	if (isUnDef(codePage)) codePage = __bfprintCodePage;
	if (isUnDef(__bfprint[codePage])) __bfprint[codePage] = new java.io.BufferedWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(java.io.FileDescriptor.err), codePage), 512);

	__bfprint[codePage].write(str);
	__bfprint[codePage].flush();
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
 * <key>yprint(aObj, multidoc)</key>
 * Prints aObj in YAML. If multiDoc = true and aJson is an array the output will be multi-document.
 * </odoc>
 */
const yprint = function(str, multidoc) { return print(af.toYAML(str, multidoc)); }

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
 * <key>printTable(anArrayOfEntries, aWidthLimit, displayCount, useAnsi, aTheme) : String</key>
 * Returns a ASCII table representation of anArrayOfEntries where each entry is a Map with the same keys.
 * Optionally you can specify aWidthLimit and useAnsi.
 * If you want to include a count of rows just use displayCount = true. If useAnsi = true you can provide a theme (e.g. "utf" or "plain")
 * </odoc>
 */
const printTable = function(anArrayOfEntries, aWidthLimit, displayCount, useAnsi, aTheme) {
	var count = 0;
	var maxsize = {};
	var output = "";
	var colorMap = { lines: "RESET", value: "CYAN" };

	ow.loadFormat();
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
				if (isDef(__con.getTerminal().getOutputEncoding())) aTheme = (__conAnsi ? "utf" : "plain");
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

	var _getColor = (aValue) => {
		if (isNumber(aValue)) return __colorFormat.number;
		if (isString(aValue)) return __colorFormat.string;
		if (isBoolean(aValue)) return __colorFormat.boolean;
		return __colorFormat.default;
	};

	if (!Array.isArray(anArrayOfEntries)) return "";
	if (isUnDef(aWidthLimit)) aWidthLimit = -1;
	
	// Find sizes
	anArrayOfEntries.forEach(function(row) {
		var cols = Object.keys(row);
		cols.forEach(function(col) {
			if (isUnDef(maxsize[col])) 
				maxsize[String(col)] = ansiLength(col);
			if (maxsize[String(col)] < ansiLength(String(row[String(col)]))) maxsize[String(col)] = ansiLength(String(row[String(col)]));
		});
	});

	// Produce table
	anArrayOfEntries.forEach(function(row) {
		var lineSize = 0;
		var outOfWidth = false;
		var cols = Object.keys(row);
		if (count == 0) {
			//output += (useAnsi ? ansiColor("bold", "|") : "|"); 
			output += (useAnsi ? ansiColor(colorMap.lines, "") : ""); 
			lineSize = 1; outOfWidth = false; colNum = 0;
			cols.forEach(function(col) {
				if (outOfWidth) return;
				lineSize += maxsize[String(col)] + 1;
				if (aWidthLimit > 0 && lineSize > (aWidthLimit+3)) {
					output += (useAnsi ? ansiColor(colorMap.lines, "...") : "..."); outOfWidth = true;
				} else {
					output += repeat(Math.floor((maxsize[String(col)] - ansiLength(String(col)))/2), ' ') + (useAnsi ? ansiColor(colorMap.lines, String(col)) : String(col)) + repeat(Math.round((maxsize[String(col)] - ansiLength(String(col))) / 2), ' ');
					if (colNum < (cols.length-1)) output += (useAnsi ? ansiColor(colorMap.lines, vLine) : vLine);
				}
				colNum++;
			});
			output += __separator;
			//output += (useAnsi ? ansiColor(colorMap.lines, "+") : "+"); 
			lineSize = 1; outOfWidth = false; colNum = 0;
			cols.forEach(function(col) {
				if (outOfWidth) return;
				lineSize += maxsize[String(col)] + 1;
				if (aWidthLimit > 0 && lineSize > (aWidthLimit+3)) {
					output += (useAnsi ? ansiColor(colorMap.lines, "...") : "..."); outOfWidth = true;
				} else {
					output += (useAnsi ? ansiColor(colorMap.lines, repeat(maxsize[String(col)], hLine)) : repeat(maxsize[String(col)], hLine));
					if (colNum < (cols.length-1)) output += (useAnsi ? ansiColor(colorMap.lines, hvJoin) : hvJoin);
				}
				colNum++;
			});
			output += __separator;
		};

		//output += (useAnsi ? ansiColor(colorMap.lines, vLine) : vLine); 
		lineSize = 1; outOfWidth = false; colNum = 0;
		cols.forEach(function(col) {
			if (outOfWidth) return;
			lineSize += maxsize[String(col)] + 1;
			if (aWidthLimit > 0 && lineSize > (aWidthLimit+3)) {
				output += "..."; outOfWidth = true;
			} else {	
				var value = String(row[String(col)]).replace(/\n/g, " ");
				output += (useAnsi ? ansiColor(_getColor(row[String(col)]), value) : value) + repeat(maxsize[String(col)] - ansiLength(String(row[String(col)])), ' ');
				if (colNum < (cols.length-1)) output += (useAnsi ? ansiColor(colorMap.lines, vLine) : vLine);
			}
			colNum++;
		});
		output += __separator;
		count++;
	});

	if (displayCount) {
		var summary = "[#" + count + " " + ((count <= 1) ? "row" : "rows") + "]";
		output += (useAnsi ? ansiColor(colorMap.lines, summary) : summary);
	}
	
	return output;
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
				if (isDef(__con.getTerminal().getOutputEncoding())) aTheme = (__conAnsi ? "utf" : "plain");
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
	
	aWidth = _$(aWidth).isNumber().default(__con.getTerminal().getWidth() - 2);
	var rt = new Packages.openaf.asciitable.render.AnsiAsciiTableRenderer(true);
	rt.setTheme(aTheme);
	rt.setWidth(new Packages.openaf.asciitable.render.WidthAnsiLongestWordTab(aWidth));
	var o;
	if (useAnsi)
		o = String(rt.render(out, cM2));
	else
		o = String(rt.render(out));

	return o;
}

var __con, __conStatus, __conAnsi;
if (isUnDef(__conAnsi) && String(java.lang.System.getProperty("file.encoding")) != "UTF-8") {
	__conAnsi = false;
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
		while(__con == "") sleep(25, true);
		__conStatus = true;
		__conAnsi = (isDef(__conAnsi) ? __conAnsi : true);
		if (__conAnsi == true) __ansiColorFlag = true;
		return true;
	}
}

/**
 * <odoc>
 * <key>ansiColor(aAnsi, aString, force) : String</key>
 * Returns the ANSI codes together with aString, if determined that the current terminal can handle ANSI codes (overridden
 * by force = true), with the attributes defined in aAnsi. Please use with ansiStart() and ansiStop().
 * The attributes separated by commas can be:\
 * \
 * BLACK; RED; GREEN; YELLOW; BLUE; MAGENTA; CYAN; WHITE;\
 * FG_BLACK; FG_RED; FG_GREEN; FG_YELLOW; FG_BLUE; FG_MAGENTA; FG_CYAN; FG_WHITE;\
 * BG_BLACK; BG_RED; BG_GREEN; BG_YELLOW; BG_BLUE; BG_MAGENTA; BG_CYAN; BG_WHITE;\
 * BOLD; FAINT; INTENSITY_BOLD; INTENSITY_FAINT; ITALIC; UNDERLINE; BLINK_SLOW; BLINK_FAST; BLINK_OFF; NEGATIVE_ON; NEGATIVE_OFF; CONCEAL_ON; CONCEAL_OFF; UNDERLINE_DOUBLE; UNDERLINE_OFF;\
 * \
 * </odoc>
 */
const ansiColor = function(aAnsi, aString, force) {
	if (!__initializeCon()) return aString;
	aAnsi = _$(aAnsi, "aAnsi").isString().default("");
	aString = _$(aString, "aString").isString().default("");
	force = _$(force, "force").isBoolean().default(false);

	var con = __con;
	var ansis = force || (__conAnsi && (java.lang.System.console() != null));
	var jansi = JavaImporter(Packages.org.fusesource.jansi);
	var res = "";
	
	if (ansis && aAnsi.length > 0) {
		var nAnsi = [];
		aAnsi.split(",").forEach(r => {
			if (r.startsWith("BG(")) {
				var bg = r.match(/BG\((\d+)\)/);
				if (!isNull(bg)) aString = "\033[48;5;" + bg[1] + "m" + aString;
			} else if (r.startsWith("FG(")) {
				var fg = r.match(/FG\((\d+)\)/);
				if (!isNull(fg)) aString = "\033[38;5;" + fg[1] + "m" + aString;
			} else {
				nAnsi.push(r);
			}
		});
		if (nAnsi.length > 0) {
			res = jansi.Ansi.ansi().render("@|" + nAnsi.join(",").toLowerCase() + " " + aString + "|@");
		} else {
			res = aString;
		}
		//var res = Packages.openaf.JAnsiRender.render(aAnsi.toLowerCase() + " " + aString);
		return String(res); 
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
const ansiLength = function(aString, force) {
	_$(aString, "aString").isString().$_()

	var ansis = force || (__conAnsi && (java.lang.System.console() != null))
	var s 
	if (ansis) {
		s = aString.replace(/\033\[[0-9;]*m/g, "")
	} else {
		s = aString
	}

	return Number((new java.lang.String(s)).codePointCount(0, s.length))
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
	if (isUnDef(replacer)) replacer = (k, v) => { return isJavaObject(v) ? String(v) : v; };
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
	default: "YELLOW"
};
const colorify = function(json) {
	if (typeof json != 'string') {
		//json = JSON.stringify(json, undefined, 2);
		json = stringify(json, undefined, 2);
	} else {
		return json;
	}
	
	//json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	return String(json).replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
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
		   if (isDef(__colorFormat) && isDef(__colorFormat.key)) res = ansiColor(__colorFormat.key, match); else res = match; break;
		case "number" : 
		   if (isDef(__colorFormat) && isDef(__colorFormat.number)) res = ansiColor(__colorFormat.number, match); else res = match; break;
		case "string" : 
		   if (isDef(__colorFormat) && isDef(__colorFormat.string)) res = ansiColor(__colorFormat.string, match); else res = match; break;
		case "boolean": 
	       if (isDef(__colorFormat) && isDef(__colorFormat.boolean)) res = ansiColor(__colorFormat.boolean, match); else res = match; break;
		default: 
		   if (isDef(__colorFormat) && isDef(__colorFormat.default)) res = ansiColor(__colorFormat.default, match); else res = match;
		}
		return res;
	});
};

__JSONformat = {
  unsafe: true
};
/**
 * <odoc>
 * <key>jsonParse(aString) : Map</key>
 * Shorcut for the native JSON.parse that returns an empty map if aString is not defined, empty or unparsable.
 * </odoc>
 */
const jsonParse = function(astring, alternative, unsafe) {
	if (isDef(astring) && String(astring).length > 0) {
		try {
			var a;
			if (alternative) {
				a = af.jsonParse(astring, alternative);
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
	someData = (isUnDef(someData)) ? this : someData;
	if (isUnDef(ow.template)) { ow.loadTemplate(); ow.template.addOpenAFHelpers(); }
	return String(ow.template.parse(aTemplateString, someData));
}

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
 * <key>getUUID() : String</key>
 * Generates and returns an UUID using a javascript algorithm (if needed you can refer to the 
 * AF operation AF.KeyGenerator.GenerateUUID).
 * </odoc>
 */
const genUUID = function() {
	// Internal generate UUID
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
		.toString(16)
		.substring(1);
	};
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
	s4() + '-' + s4() + s4() + s4();
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
		return v0;
	}
}

/**
 * <odoc>
 * <key>repeat(nTimes, aStr) : String</key>
 * Will build a string composed of aStr repeated nTimes.
 * </odoc>
 */
const repeat = function(nTimes, aStr) {
	return aStr.repeat(nTimes);
}

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
 * <key>nowUTC() : Number</key>
 * Will return the current system time in milliseconds.
 * </odoc>
 */
const nowUTC = function() {
	return Number(java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("UTC")).getTimeInMillis());
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
	if (isUnDef(aString) || aString == null) return [];
	if (isUnDef(aSep)) aSep = ";";

	return aString.replace(new RegExp(aSep, "g"), "\\" + aSep).replace(new RegExp("\\\\\\\\(?=" + aSep + ")", "g") , "").split("\\" + aSep + "");
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
	var args = splitBySeparator(aSource, aSep);
	var pairs = {};

	for(var argIdx in args) {
		var arg = args[argIdx];

		var pair = splitBySeparator(arg, "=");
		if (!ignoreCase)
			pairs[String(pair[0])] = (isUnDef(pair[1]) ? "" : pair[1]);
		else
			pairs[String(pair[0]).toLowerCase()] = (isUnDef(pair[1]) ? "" : pair[1]);
	}

	//load __pmIn to pairs
	for (var attrname in __pmIn) { 
		if (!ignoreCase)
			pairs[String(attrname)] = __pmIn[attrname];
		else 
			pairs[String(attrname).toLowerCase()] = __pmIn[attrname];
	}

	return pairs;
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

//------------------------------------------
//OPACK functions
//------------------------------------------

const PACKAGEJSON  = ".package.json";
const PACKAGEYAML  = ".package.yaml";
const PACKAGESJSON = "packages.json";
const PACKAGESJSON_DB = ".opack.db";
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
 * <key>oJob(aFile, args, aId, aOptionsMap)</key>
 * Shortcut for oJobRunFile return the result on the variable __pm. Keep in mind that it doesn't support concurrency.
 * </odoc>
 */
const oJob = function(aFile, args, aId, aOptionsMap) {
	args = merge({ "__format": "pm" }, args);
	if (isDef(__pm._list)) __pm._list = __;
	if (isDef(__pm._map)) __pm._list = __;
	if (isDef(__pm.result)) __pm.result = __;
	oJobRunFile(aFile, args, aId, aOptionsMap);
	if (isDef(__pm._list)) return __pm._list;
	if (isDef(__pm._map)) return __pm._map;
	return __pm.result;
}

/**
 * <odoc>
 * <key>addOPackRemoteDB(aURL)</key>
 * Adds a path to an opack.db file to the current search path.
 * </odoc>
 */
const addOPackRemoteDB = function(aURL) {
	__opackCentral.push(aURL);
}

/**
 * <odoc>
 * <key>getOPackRemoteDB() : Array</key>
 * Returns an Array of maps. Each map element is an opack package description registered in the OpenAF central repository.
 * </odoc>
 */
const getOPackRemoteDB = function() {
	var packages = {};
	if (noHomeComms) return packages;

	plugin("ZIP");
	plugin("HTTP");

	var http;
	var zip;

	for(var i in __opackCentral) {
		try {
			http = new HTTP(__opackCentral[i], "GET", "", {}, true, 1500);
			zip = new ZIP(http.responseBytes());
			if (isDef(http)) {
				packages = merge(packages, af.fromJson(af.fromBytes2String(zip.getFile(OPACKCENTRALJSON))));
            }
			if (!isUnDef(zip)) zip.close();
		} catch(e) {
			// Continue to next
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
    var homeDB = String(java.lang.System.getProperty("user.home")) + "/" + PACKAGESJSON_USERDB;
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
var __preCompileLevel = 2;

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
		if (aS.indexOf("::") < 0 && (loadPrecompiled || __preCompileLevel >= aLevel) && io.fileExists(aS)) {
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
		if (!res && isUnDef(err)) {
			try {
				__codeVerify(aS, aScript)
				if (__flags.OAF_CLOSED) af.load(aS); else af.load(aS, __loadPreParser);
			} catch(e2) {
				if (e2.message == "\"exports\" is not defined.") {
					var exp = require(aS);
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
		var paths = getOPackPaths();
		//paths["__default"] = getOpenAFJar() + "::js/";

		for(var i in paths) {
			try {
				paths[i] = paths[i].replace(/\\+/g, "/");
				if (io.fileExists(paths[i] + "/" + aScript)) return fn(paths[i] + "/" + aScript, 1);
			} catch(_e) {
				if (_e.message.indexOf("java.io.FileNotFoundException") < 0 &&
				    _e.message.indexOf("java.lang.NullPointerException: entry") < 0) {
						error.push(_e);
						inErr = true;
				}
			}
		}

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
				if (!(io.fileExists(path) && io.fileExists(clFilepath)) ||
				    info.lastModified > io.fileInfo(clFilepath).lastModified) {
					if (!dontCompile) {
						io.mkdir(path);
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
				if (!(io.fileExists(path) && io.fileExists(clFilepath)) ||
				    info.lastModified > io.fileInfo(clFilepath).lastModified) {
					if (!dontCompile) {
						io.mkdir(path);
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
 * <key>listFilesRecursive(aPath) : Map</key>
 * Performs the io.listFiles function recursively given aPath. The returned map will be equivalent to
 * the io.listFiles function (see more in io.listFiles). 
 * </odoc>
 */
const listFilesRecursive = function(aPath) {
	if (isUnDef(aPath)) return [];

	var files = io.listFiles(aPath);
	if(isUnDef(files)) return [];
	var ret = [];
	files = files.files;
	if (isUnDef(files)) return [];
	ret = files.concat(ret);

	for(var ii in files) {
		if (files[ii].isDirectory) {
			ret = ret.concat(listFilesRecursive(files[ii].filepath));
		}
	}

	return ret;
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
 * (extracted from)
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
};

/**
 * <odoc>
 * <key>exit(anExitCode)</key>
 * Immediately exits execution with the provided exit code
 * </odoc>
 */
const exit = function(exitCode) {
	if(isUnDef(exitCode)) exitCode = 0;

	java.lang.System.exit(exitCode);
}

/**
 * <odoc>
 * <key>clone(anObject) : aClonedObject</key>
 * Creates a new copy of a JavaScript object.
 * </odoc>
 */
const clone = function(aObject) {
	if (Array.isArray(aObject)) return aObject.slice(0);
 	return extend(true, {}, aObject);
}

/**
 * <odoc>
 * <key>merge(anObjectA, anObjectB) : aMergedObject</key>
 * Merges a JavaScript object A with a JavaScript object B a returns the result as a new object.
 * </odoc>
 */
var __merge_alternative = true;
const merge = function(aObjectA, aObjectB, alternative, deDup) {
	if (isObject(aObjectA) && isArray(aObjectB)) {
		for(var i in aObjectB) { aObjectB[i] = merge(aObjectB[i], clone(aObjectA), alternative, deDup); }
		return aObjectB;
	}
	if (isObject(aObjectB) && isArray(aObjectA)) {
		for(var i in aObjectA) { aObjectA[i] = merge(aObjectA[i], clone(aObjectB), alternative, deDup); }
		return aObjectA;
	}
	if (__merge_alternative || alternative) {
		var r = Object.assign({}, aObjectA);
		if (isDef(aObjectB) && isMap(aObjectB) && !isNull(aObjectB)) {
		  Object.keys(aObjectB).forEach(k => {
			if (!isMap(aObjectB[k]) && !isArray(aObjectB[k])) {
			  r[k] = aObjectB[k];
			} else {
			  if (isArray(aObjectB[k])) {
				if (isUnDef(r[k])) r[k] = [];
				
				if (deDup) {
				  r[k] = r[k].concat(aObjectB[k].filter(s => arrayContains(r[k], s) < 0));
				} else {
				  r[k] = r[k].concat(aObjectB[k]);
				}
			  } else if (isMap(aObjectB[k])) {
				if (isUnDef(r[k])) r[k] = {};
				r[k] = merge(r[k], aObjectB[k], alternative, deDup);
			  }
			}
		  });
		}
	  
		return r;
	} else {
		return extend(true, clone(aObjectA), aObjectB);
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
 *   abs(x), avg(x), contains(x, y), ceil(x), floor(x), join(x, arr), keys(obj), length(x), map(expr, arr), max(x), max_by(x, y), merge(a, b), min(a), min_by(a, b), not_null(a), reverse(arr), sort(arr), sort_by(a, y), starts_with(a, b), sum(a), to_array(a), to_string(a), to_number(a), type(a), values(a)\
 *   $path(arr, "a[?contains(@, 'b') == `true`]")\
 * \
 * Custom functions:\
 *   $path(2, "example(@)", { example: { _func: (a) => { return Number(a) + 10; }, _signature: [ { types: [ $path().number ] } ] } });\
 * \
 * </odoc>
 */
const $path = function(aObj, aPath, customFunctions) {
	loadCompiledLib("jmespath_js");
	
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
 * <key>getNumberOfCores() : Number</key>
 * Try to identify the current number of cores on the system where the script is being executed.
 * </odoc>
 */
const getNumberOfCores = function() {
  	plugin("Threads");

  	var t = new Threads();
  	__cpucores = Number(t.getNumberOfCores());

 	return __cpucores;
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
        	return Number(java.lang.management.ManagementFactory.getOperatingSystemMXBean().getSystemCpuLoad() * getNumberOfCores());
        } else {
		var res = Number(java.lang.management.ManagementFactory.getOperatingSystemMXBean().getSystemLoadAverage());
 		if (res < 0) res = Number(java.lang.management.ManagementFactory.getOperatingSystemMXBean().getSystemCpuLoad() * getNumberOfCores());
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
			af.sh("kill -0 " + aPid);
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
    if (isUnDef(numberOfParts)) numberOfParts = getNumberOfCores();
    
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

	var __threads = new Threads();
	if (isUnDef(__cpucores)) __cpucores = __threads.getNumberOfCores();
	if (isUnDef(numThreads)) {
		numThreads = __cpucores + 1;
		balance = true;
	}

	if (isDef(threads)) {
		threads["__threads"]  = __threads;
		threads["__numThreads"] = numThreads;
		threads.uuids = [];
	}
	
	var __cooldown = 0;
	var balance = false;
	function __balance() {
		var l = getCPULoad();
		if (l > numThreads) {
			syncFn(function() { cooldown++; });
			while (l > numThreads && __cooldown < numThreads) {
				sleep((l - numThreads) * 2000);
				l = getCPULoad();
			}
			syncFn(function() { cooldown--; });
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
			syncFn(function() { cooldown++; });
			while (l > numThreads && __cooldown < numThreads) {
				sleep((l - numThreads) * 2000);
				l = getCPULoad();
			}
			syncFn(function() { cooldown--; });
		}
	}
	
	var results = [];
	var __threads = new Threads();
	if (isUnDef(__cpucores)) __cpucores = __threads.getNumberOfCores();
	if (isUnDef(numThreads)) {
		numThreads = __cpucores + 1;
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
		function(p, c, i, a) {
			var subres = aFunction(c);
			return [ subres ].concat(p);
		},
		[],
		function(arr) { var res = []; for(var i in arr) { res = res.concat(arr[i]); } return res; },
		numberOfThreads,
		threads
	);
	return res;
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
const isArray = Array.isArray;

/**
 * <odoc>
 * <key>isMap(aObj) : boolean</key>
 * Returns true if aObj is a map, false otherwise.
 * </odoc>
 */
const isMap = (a) => { return (Object.prototype.toString.call(a) == "[object Object]"); };

/**
 * <odoc>
 * <key>isObject(aObj) : boolean</key>
 * Returns true if aObj is an object, false otherwise;
 * </odoc>
 */
const isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
}

/**
 * <odoc>
 * <key>isFunction(aObj) : boolean</key>
 * Returns true if aObj is a function, false otherwise;
 * </odoc>
 */
const isFunction = function(obj) {
    return typeof obj == 'function' || false;
}

/**
 * <odoc>
 * <key>isString(aObj) : boolean</key>
 * Returns true if aObj is a string, false otherwise
 * </odoc>
 */
const isString = function(obj) {
	return typeof obj == 'string' || false;
}

/**
 * <odoc>
 * <key>isNumber(aObj) : boolean</key>
 * Returns true if aObj can be a number, false otherwise
 * </odoc>
 */
const isNumber = function(obj) {
	return !isNaN(parseFloat(obj)) && isFinite(obj);
}

/**
 * <odoc>
 * <key>isInteger(aObj) : boolean</key>
 * Returns true if aObj doesn't have a decimal component.
 * </odoc>
 */
const isInteger = function(obj) {
	return isNumber(obj) && Number.isSafeInteger(obj);
}

/**
 * <odoc>
 * <key>isDecimal(aObj) : boolean</key>
 * Returns true if aObj has a decimal component.
 * </odoc>
 */
const isDecimal = function(obj) {
	return isNumber(obj) && !isInteger(obj);
}

/**
 * <odoc>
 * <key>isTNumber(aObj) : boolean</key>
 * Returns true if aObj is of type number, false otherwise
 * </odoc>
 */
const isTNumber = function(obj) {
	return typeof obj === "number";
}

/**
 * <odoc>
 * <key>isDate(aObj) : boolean</key>
 * Returns true if aObj is a date, false otherwise
 * </odoc>
 */
const isDate = function(obj) { 
	return (null != obj) && !isNaN(obj) && ("undefined" !== typeof obj.getDate); 
}

/**
 * <odoc>
 * <key>isBoolean(aObj) : boolean</key>
 * Returns true if aObj is boolean, false otherwise
 * </odoc>
 */
const isBoolean = function(obj) {
	return typeof obj == 'boolean' || false;
}

/**
 * <odoc>
 * <key>isNull(aObj) : boolean</key>
 * Returns true if aObj is null, false otherwise
 * </odoc>
 */
const isNull = function(obj) {
	return obj == null || false;
}

/**
 * <odoc>
 * <key>isByteArray(aObj) : boolean</key>
 * Returns true if aObj is a byte array object, false otherwise.
 * </odoc>
 */
const isByteArray = function(obj) {
	return (isDef(obj.getClass) && (obj.getClass().getName() == "byte[]" || obj.getClass().getTypeName() == "byte[]"));
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

const descType = function(aObj) {
	if (isUnDef(aObj)) return "undefined";
	if (isNull(aObj)) return "null";
	if (isBoolean(aObj)) return "boolean";
	if (isNumber(aObj)) return "number";
	if (isString(aObj)) return "string";
	if (isFunction(aObj)) return "function";
	if (isByteArray(aObj)) return "bytearray";
	if (isArray(aObj)) return "array";
	if (isJavaObject(aObj)) return "java";
	if (isDate(aObj)) return "date";
	if (isMap(aObj)) return "map";
	if (isObject(aObj)) return "object";
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
		load(aLib, (__preCompileLevel >= 2 ? true : false));
		__loadedLibs[aLib.toLowerCase()] = true;
		if (isDef(aFunction)) aFunction();
		return true;
	}
	
	return false;
}

/**
 * <odoc>
 * <key>loadCompiledLib(aLibClass, forceReload, aFunction) : boolean</key>
 * Loads the corresponding compiled javascript library class and keeps track if it was already loaded or not (in __loadedLibs).
 * Optionally you can force reload and provide aFunction to execute after the successful loading.
 * Returns true if successfull, false otherwise.
 * </odoc>
 */
const loadCompiledLib = function(aClass, forceReload, aFunction) {
	if (forceReload ||
		isUnDef(__loadedLibs[aClass.toLowerCase()]) || 
		__loadedLibs[aClass.toLowerCase()] == false) {		
		af.runFromClass(af.getClass(aClass).newInstance());
		__loadedLibs[aClass.toLowerCase()] = true;
		if (isDef(aFunction)) aFunction();
		return true;
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

const OpenWrap = function() {}
//if (isUnDef(OpenWrap))
//	OpenWrap = function() {}

const ow = new OpenWrap();
//if (isUnDef(ow))
//	ow = new OpenWrap();

/**
 * <odoc>
 * <key>ow.loadDebug()</key>
 * Loads OpenWrap debug functionality.
 * </odoc>
 */
OpenWrap.prototype.loadDebug = function() { loadCompiledLib("owrap_debug_js"); if (isUnDef(ow.debug)) { ow.debug = new OpenWrap.debug(); pods.declare("ow.debug", ow.debug); }; return ow.debug; };
/**
 * <odoc>
 * <key>ow.loadDev()</key>
 * Loads OpenWrap dev functionality. Basically functions being tested.
 * </odoc>
 */
OpenWrap.prototype.loadDev = function() { loadCompiledLib("owrap_dev_js"); if (isUnDef(ow.dev)) { ow.dev = new OpenWrap.dev(); pods.declare("ow.dev", ow.dev); }; return ow.dev; };
/**
 * <odoc>
 * <key>ow.loadNet()</key>
 * Loads OpenWrap net functionality. Basically functions for net.
 * </odoc>
 */
OpenWrap.prototype.loadNet = function() { loadCompiledLib("owrap_net_js"); if (isUnDef(ow.net)) { ow.net = new OpenWrap.net(); pods.declare("ow.net", ow.net); }; return ow.net; };
/**
 * <odoc>
 * <key>ow.loadSec()</key>
 * Loads OpenWrap sec functionality. Basically functions for sec.
 * </odoc>
 */
OpenWrap.prototype.loadSec = function() { loadCompiledLib("owrap_sec_js"); if (isUnDef(ow.sec)) { ow.sec = new OpenWrap.sec(); pods.declare("ow.sec", ow.sec); }; return ow.sec; };
/**
 * <odoc>
 * <key>ow.loadFormat()</key>
 * Loads OpenWrap format functionality. Basically functions to help with the formatting of strings, numbers, dates, etc...
 * </odoc>
 */
//OpenWrap.prototype.loadFormat = function() { loadLib(getOpenAFJar() + "::js/owrap.format.js"); ow.format = new OpenWrap.format(); pods.declare("ow.format", ow.format); return ow.format; }
OpenWrap.prototype.loadFormat = function() { loadCompiledLib("owrap_format_js"); if (isUnDef(ow.format)) { ow.format = new OpenWrap.format(); pods.declare("ow.format", ow.format); }; return ow.format; };
/**
 * <odoc>
 * <key>ow.loadTest()</key>
 * Loads OpenWrap test functionality. Basically functions to unit test other functionality.
 * </odoc>
 */
//OpenWrap.prototype.loadTest = function() { loadLib(getOpenAFJar() + "::js/owrap.test.js"); ow.test = new OpenWrap.test(); pods.declare("ow.test", ow.test); return ow.test; }
OpenWrap.prototype.loadTest = function() { loadCompiledLib("owrap_test_js"); if (isUnDef(ow.test)) { ow.test = new OpenWrap.test(); pods.declare("ow.test", ow.test); }; return ow.test; };
/**
 * <odoc>
 * <key>ow.loadAI()</key>
 * Loads OpenWrap AI functionality.
 * </odoc>
 */
//OpenWrap.prototype.loadAI = function() { loadLib(getOpenAFJar() + "::js/owrap.ai.js"); ow.ai = new OpenWrap.ai(); pods.declare("ow.ai", ow.ai); return ow.ai; }
OpenWrap.prototype.loadAI = function() { loadCompiledLib("owrap_ai_js"); if (isUnDef(ow.ai)) { ow.ai = new OpenWrap.ai(); pods.declare("ow.ai", ow.ai); }; return ow.ai; };
/**
 * <odoc>
 * <key>ow.loadServer()</key>
 * Loads OpenWrap Server functionality. Basically functions to wrap access to server functionality.
 * </odoc>
 */
//OpenWrap.prototype.loadServer = function() { loadLib(getOpenAFJar() + "::js/owrap.server.js"); ow.server = new OpenWrap.server(); pods.declare("ow.server", ow.server); return ow.server; }
OpenWrap.prototype.loadServer = function() { loadCompiledLib("owrap_server_js"); if (isUnDef(ow.server)) { ow.server = new OpenWrap.server(); pods.declare("ow.server", ow.server); }; return ow.server; };
/**
 * <odoc>
 * <key>ow.loadMetrics()</key>
 * Loads OpenWrap Metrics functionality. Basically functions to wrap access to server functionality.
 * </odoc>
 */
//OpenWrap.prototype.loadMetrics = function() { loadLib(getOpenAFJar() + "::js/owrap.server.js"); ow.server = new OpenWrap.server(); pods.declare("ow.server", ow.server); return ow.server; }
OpenWrap.prototype.loadMetrics = function() { loadCompiledLib("owrap_metrics_js"); if (isUnDef(ow.metrics)) { ow.metrics = new OpenWrap.metrics(); pods.declare("ow.metrics", ow.metrics); }; return ow.metrics; };
/**
 * <odoc>
 * <key>ow.loadPython()</key>
 * Loads OpenWrap Python functionality.
 * </odoc>
 */
//OpenWrap.prototype.loadPython = function() { loadLib(getOpenAFJar() + "::js/owrap.server.js"); ow.server = new OpenWrap.server(); pods.declare("ow.server", ow.server); return ow.server; }
OpenWrap.prototype.loadPython = function() { loadCompiledLib("owrap_python_js"); if (isUnDef(ow.python)) { ow.python = new OpenWrap.python(); pods.declare("ow.python", ow.python); }; return ow.python; };
/**
 * <odoc>
 * <key>ow.loadTemplate()</key>
 * Loads OpenWrap template functionality. Basically functions to wrap access to Handlebars functionality.
 * </odoc>
 */
//OpenWrap.prototype.loadTemplate = function() { loadLib(getOpenAFJar() + "::js/owrap.template.js"); ow.template = new OpenWrap.template(); pods.declare("ow.template", ow.template); return ow.template; }
OpenWrap.prototype.loadTemplate = function() { loadCompiledLib("owrap_template_js"); if (isUnDef(ow.template)) { ow.template = new OpenWrap.template(); pods.declare("ow.template", ow.template); }; return ow.template; };
/**
 * <odoc>
 * <key>ow.loadObj()</key>
 * Loads OpenWrap object functionality. 
 * </odoc>
 */
//OpenWrap.prototype.loadObj = function() { loadLib(getOpenAFJar() + "::js/owrap.obj.js"); ow.obj = new OpenWrap.obj(); pods.declare("ow.obj", ow.obj); return ow.obj; }
OpenWrap.prototype.loadObj = function() { loadCompiledLib("owrap_obj_js"); if (isUnDef(ow.obj)) { ow.obj = new OpenWrap.obj(); pods.declare("ow.obj", ow.obj); }; return ow.obj; };
/**
 * <odoc>
 * <key>ow.loadCh()</key>
 * Loads OpenWrap channels functionality. 
 * </odoc>
 */
//OpenWrap.prototype.loadCh = function() { loadLib(getOpenAFJar() + "::js/owrap.ch.js"); ow.ch = new OpenWrap.ch(); pods.declare("ow.ch", ow.ch); return ow.ch; }
OpenWrap.prototype.loadCh = function() { loadCompiledLib("owrap_ch_js"); if (isUnDef(ow.ch)) { ow.ch = new OpenWrap.ch(); pods.declare("ow.ch", ow.ch); }; return ow.ch; };
/**
 * <odoc>
 * <key>ow.loadOJob()</key>
 * Loads OpenWrap oJob functionality. 
 * </odoc>
 */
//OpenWrap.prototype.loadOJob = function() { loadLib(getOpenAFJar() + "::js/owrap.oJob.js"); ow.oJob = new OpenWrap.oJob(); pods.declare("ow.oJob", ow.oJob); return ow.oJob; }
OpenWrap.prototype.loadOJob = function() { loadCompiledLib("owrap_oJob_js"); if (isUnDef(ow.oJob)) { ow.oJob = new OpenWrap.oJob(); pods.declare("ow.oJob", ow.oJob); }; return ow.oJob; };
/**
 * <odoc>
 * <key>ow.loadJava()</key>
 * Loads OpenWrap Java functionality. 
 * </odoc>
 */
OpenWrap.prototype.loadJava = function() { loadCompiledLib("owrap_java_js"); if (isUnDef(ow.java)) { ow.java = new OpenWrap.java(); pods.declare("ow.java", ow.java); }; return ow.java; };

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
 * of retriving from online first (if aBoolean is false)
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
		var bufferSize = (isUnDef(aBufferSize)) ? 1024 : aBufferSize;
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
		var bufferSize = (isUnDef(aBufferSize)) ? 1024 : aBufferSize;
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
	var bufferSize = (isUnDef(aBufferSize)) ? 1024 : aBufferSize;

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
	var bufferSize = (isUnDef(aBufferSize)) ? 1024 : aBufferSize;

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
if (!Array.from) {
	Array.from = (function () {
		var toStr = Object.prototype.toString;
		var isCallable = function (fn) {
			return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
		};
		var toInteger = function (value) {
			var number = Number(value);
			if (isNaN(number)) { return 0; }
			if (number === 0 || !isFinite(number)) { return number; }
			return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
		};
		var maxSafeInteger = Math.pow(2, 53) - 1;
		var toLength = function (value) {
			var len = toInteger(value);
			return Math.min(Math.max(len, 0), maxSafeInteger);
		};

		// The length property of the from method is 1.
		return function from(arrayLike/*, mapFn, thisArg */) {
			// 1. Let C be the this value.
			var C = this;

			// 2. Let items be ToObject(arrayLike).
			var items = Object(arrayLike);

			// 3. ReturnIfAbrupt(items).
			if (arrayLike == null) {
				throw new TypeError("Array.from requires an array-like object - not null or undefined");
			}

			// 4. If mapfn is undefined, then let mapping be false.
			var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
			var T;
			if (typeof mapFn !== 'undefined') {
				// 5. else      
				// 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
				if (!isCallable(mapFn)) {
					throw new TypeError('Array.from: when provided, the second argument must be a function');
				}

				// 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
				if (arguments.length > 2) {
					T = arguments[2];
				}
			}

			// 10. Let lenValue be Get(items, "length").
			// 11. Let len be ToLength(lenValue).
			var len = toLength(items.length);

			// 13. If IsConstructor(C) is true, then
			// 13. a. Let A be the result of calling the [[Construct]] internal method of C with an argument list containing the single item len.
			// 14. a. Else, Let A be ArrayCreate(len).
			var A = isCallable(C) ? Object(new C(len)) : new Array(len);

			// 16. Let k be 0.
			var k = 0;
			// 17. Repeat, while k < len… (also steps a - h)
			var kValue;
			while (k < len) {
				kValue = items[k];
				if (mapFn) {
					A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
				} else {
					A[k] = kValue;
				}
				k += 1;
			}
			// 18. Let putStatus be Put(A, "length", len, true).
			A.length = len;
			// 20. Return A.
			return A;
		};
	}());
}

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
	t.addSingleThread(function(uuid) {
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
		var fdef = [ "aBaseURL", "aIdxMap", "login", "pass", "conTimeout", "reqHeaders", "urlEncode", "httpClient", "retBytes" ];
		if (parent.__check(aBaseURI)) {
			var c = _toptions.retry, error, __t;
			do {
				error = __;
				try {
					if (isDef(_toptions.timeout) || isDef(_toptions.stopWhen)) {
						var _r = $tb(() => {
							if (isDef(_toptions.preAction)) { 
								var _a = $a2m(fdef, [ aBaseURI, aIdxMap, _toptions.login, _toptions.pass, _toptions.connectionTimeout, _toptions.requestHeaders, _toptions.urlEncode, _toptions.httpClient, retBytes ]);
								_a.aVerb = aVerb;
								var rres = _toptions.preAction(_a);
								var args;
								if (isDef(rres) && rres != null) 
									args = $m2a(fdef, rres);
								else
									args = [ aBaseURI, aIdxMap, _toptions.login, _toptions.pass, _toptions.connectionTimeout, _toptions.requestHeaders, _toptions.urlEncode, _toptions.httpClient, retBytes ];
								res = aFn[aSubFn].apply(aFn, args);
							} else {
								__t = now();
								res = aFn[aSubFn](aBaseURI, aIdxMap, _toptions.login, _toptions.pass, _toptions.connectionTimeout, _toptions.requestHeaders, _toptions.httpClient, retBytes);
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
							var _a = $a2m(fdef, [ aBaseURI, aIdxMap, _toptions.login, _toptions.pass, _toptions.connectionTimeout, _toptions.requestHeaders, _toptions.urlEncode, _toptions.httpClient, retBytes ]);
							_a.aVerb = aVerb;
							var rres = _toptions.preAction(_a);
							var args;
							if (isDef(rres) && rres != null) 
								args = $m2a(fdef, rres);
							else
								args = [ aBaseURI, aIdxMap, _toptions.login, _toptions.pass, _toptions.connectionTimeout, _toptions.requestHeaders, _toptions.urlEncode, _toptions.httpClient, retBytes ];
							__t = now();
							res = aFn[aSubFn].apply(aFn, args);
							__t = now() - __t;
						} else {
							__t = now();
							res = aFn[aSubFn](aBaseURI, aIdxMap, _toptions.login, _toptions.pass, _toptions.connectionTimeout, _toptions.requestHeaders, _toptions.httpClient, retBytes);
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
		var fdef = [ "aBaseURL", "aIdxMap", "aDataRowMap", "login", "pass", "conTimeout", "reqHeaders", "urlEncode", "httpClient", "retBytes", "aMethod" ];
		if (parent.__check(aBaseURI)) {
			var c = _toptions.retry, error;
			do {
				error = __;
				try {
					if (isDef(_toptions.timeout) || isDef(_toptions.stopWhen)) {
						var _r = $tb(() => {
							if (isDef(_toptions.preAction)) { 
								var _a = $a2m(fdef, [ aBaseURI, aIdxMap, aDataRowMap, _toptions.login, _toptions.pass, _toptions.connectionTimeout, _toptions.requestHeaders, _toptions.urlEncode, _toptions.httpClient, retBytes, aVerb ]);
								_a.aVerb = aVerb;
								var rres = _toptions.preAction(_a);
								var args;
								if (isDef(rres) && rres != null) 
									args = $m2a(fdef, rres);
								else
									args = [ aBaseURI, aIdxMap, aDataRowMap, _toptions.login, _toptions.pass, _toptions.connectionTimeout, _toptions.requestHeaders, _toptions.urlEncode, _toptions.httpClient, retBytes, aVerb ];
								res = aFn[aSubFn].apply(aFn, args);
							} else {
								res = aFn[aSubFn](aBaseURI, aIdxMap, aDataRowMap, _toptions.login, _toptions.pass, _toptions.connectionTimeout, _toptions.requestHeaders, _toptions.urlEncode, _toptions.httpClient, retBytes, aVerb);
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
							var _a = $a2m(fdef, [ aBaseURI, aIdxMap, aDataRowMap, _toptions.login, _toptions.pass, _toptions.connectionTimeout, _toptions.requestHeaders, _toptions.urlEncode, _toptions.httpClient, retBytes, aVerb ]);
							_a.aVerb = aVerb;
							var rres = _toptions.preAction(_a);
							var args;
							if (isDef(rres) && rres != null) 
								args = $m2a(fdef, rres);
							else
								args = [ aBaseURI, aIdxMap, aDataRowMap, _toptions.login, _toptions.pass, _toptions.connectionTimeout, _toptions.requestHeaders, _toptions.urlEncode, _toptions.httpClient, retBytes, aVerb ];
							res = aFn[aSubFn].apply(aFn, args);
						} else {
							res = aFn[aSubFn](aBaseURI, aIdxMap, aDataRowMap, _toptions.login, _toptions.pass, _toptions.connectionTimeout, _toptions.requestHeaders, _toptions.urlEncode, _toptions.httpClient, retBytes, aVerb);
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
	if (isUnDef(global.__$cache)) global.__$cache = {};

    var __c = function(aN) {
        aN = _$(aN).default("cache");
        this.name  = aN;
        this.func  = k => k;
        this.attl  = __;
		this.ach   = __;
		this.msize = __;
    };

	/**
	 * <odoc>
	 * <key>$cache.fn(aFunction) : Object</key>
	 * Defines the aFunction use to get aKey. The returned object will be cached.
	 * </odoc>
	 */
	__c.prototype.fn        = function(aFunc) { this.func   = aFunc;    return this; };
	/**
	 * <odoc>
	 * <key>$cache.ttl(aTTL) : Object</key>
	 * Defines the time-to-live (aTTL) to consider a cached result as valid.
	 * </odoc>
	 */
	__c.prototype.ttl       = function(aTtl)  { this.attl   = aTtl;     return this; };
	/**
	 * <odoc>
	 * <key>$cache.ch(aChannelName) : Object</key>
	 * Uses a pre-existing channel (e.g. aChannelName) as the cache channel.
	 * </odoc>
	 */
	__c.prototype.ch        = function(aCh)   { this.ach    = aCh;      return this; };
	/**
	 * <odoc>
	 * <key>$cache.maxSize(aSize) : Object</key>
	 * Establishes the max number of entries cached at any given point in time.
	 * </odoc>
	 */
	__c.prototype.maxSize   = function(asize) { this.msize  = asize;    return this; };
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
        });
        this.ach = this.name + "::filecache";
        return this;
    };
    __c.prototype.create = function() {
        _$(this.func).isFunction().$_("Please provide a function (fn).");

		syncFn(() => {
			if ($ch().list().indexOf(this.name) < 0) {
				$ch(this.name).create(1, "cache", {
					func: this.func,
					ttl: this.attl,
					ch: this.ach,
					size: this.msize
				});
			}
		}, this.name);

        return this;
	};
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
            this.create();
        }

        return $ch(this.name).get(aK);
    };
    __c.prototype.destroy = function() {
		if ($ch().list().indexOf(this.name) < 0) {
            this.create();
		}
		
		if (isDef(this.ach)) {
			if (isString(this.ach)) 
				$ch(this.ach).destroy();
			else
				this.ach.destroy();
		}
		$ch(this.name).destroy();
		delete global.__$cache[this.name];
    };
    __c.prototype.unset  = function(aK) {
		if ($ch().list().indexOf(this.name) < 0) {
            this.create();
		}
		
        $ch(this.name).unset(aK);
        return this;
    };
    __c.prototype.size   = function() {
		if ($ch().list().indexOf(this.name) < 0) {
            this.create();
		}
		
		return $ch(this.name).size();
    };
    __c.prototype.set    = function(aK, aV) {
		if ($ch().list().indexOf(this.name) < 0) {
            this.create();
        }
		$ch(this.name).set(aK, aV);
        return this;
    };
    __c.prototype.setAll = function(aK, aV) {
		if ($ch().list().indexOf(this.name) < 0) {
            this.create();
        }
        $ch(this.name).setAll(aK, aV);
        return this;
	};
	__c.prototype.getAll = function() {
		if ($ch().list().indexOf(this.name) < 0) {
            this.create();
        }
		return $ch(this.name).getAll();
	};
	__c.prototype.getKeys = function() {
		if ($ch().list().indexOf(this.name) < 0) {
            this.create();
        }
		return $ch(this.name).getKeys();
	};

	if (isUnDef(global.__$cache[aName])) global.__$cache[aName] = new __c(aName);

    return global.__$cache[aName];
};

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
 * <key>range(aCount, aStart) : Array</key>
 * Generates an array with aCount of numbers starting at 1. Optionally you can provide a different
 * aStart number.
 * </odoc>
 */
const range = (aCount, aStart) => {
	aStart = _$(aStart, "aStart").isNumber().default(1)
	aCount = _$(aCount, "aCount").isNumber().default(1)

	return Array.from(Array(aCount).keys(), n => n + aStart)
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

// List of authorized domains from which to run ojobs
var OJOB_AUTHORIZEDDOMAINS = [ "ojob.io" ];

// Hash list of oJob urls and filepaths (each key value is a the url/canonical filepath; value is [hash-alg]-[hash])
// Do note that ojob.io urls need to be converted: ojob.io/echo -> https://ojob.io/echo.json
var OJOB_INTEGRITY = {};
// If OJOB_INTEGRITY_WARN is false oJob execution is halted if any integrity hash is found to be different
var OJOB_INTEGRITY_WARN = true; 
// If OJOB_INTEGRITY_STRICT is true no oJob will execute if it's integrity is not verified.
var OJOB_INTEGRITY_STRICT = false;
// If OJOB_SIGNATURE_STRICT is true no oJob will execute if it's signature is not valid.
var OJOB_SIGNATURE_STRICT = false;
// Use OJOB_SIGNATURE_KEY key java object to validate oJob signatures;
var OJOB_SIGNATURE_KEY = __;
// If OJOB_VALIDATION_STRICT = true no oJob will execute if the signature doesn't exist or is not valid or if it's integrity wasn't checked & passed.
var OJOB_VALIDATION_STRICT = false;

/**
 * <odoc>
 * <key>oJobRunFile(aFile, args, aId, aOptionsMap, isSubJob)</key>
 * Runs a oJob aFile with the provided args (arguments).
 * Optionally you can provide aId to segment these specific jobs.
 * </odoc>
 */ 
const oJobRunFile = function(aYAMLFile, args, aId, aOptionsMap, isSubJob) {
	var oo;
	if (isDef(aId)) {
		loadCompiledLib("owrap_oJob_js");
		oo = new OpenWrap.oJob();
	} else {
		oo = ow.loadOJob();
	}

	oo.runFile(aYAMLFile, args, aId, isSubJob, aOptionsMap);
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
	if (isString(aJob)) {
		if (isUnDef(aId)) aId = "";
		var job = oo.getJobsCh().get({ name: aJob });
		if (isDef(job)) {
			return oo.runJob(job, args, aId, rArgs, rArgs);
		} else {
			throw "Job '" + aJob + "' not found.";
		}
	} else {
		return oo.runJob(aJob, args, aId);
	}
}

/**
 * <odoc>
 * <key>$job(aJob, args, aId) : Object</key>
 * Shortcut to oJobRunJob and ow.oJob.runJob to execute aJob with args and returned the changed arguments.
 * Optionally aId can be also provided.
 * </odoc>
 */
const $job = function(aJob, args, aId) {
	if (isUnDef(aId)) aId = "|" + genUUID();
	return oJobRunJob(aJob, args, aId, true);
}

/**
 * <odoc>
 * <key>oJobRunJobAsync(aJob, args, aId) : oPromise</key>
 * Creates an oPromise to run the same arguments for oJobRunJob thus executing the job async. Returns
 * the generate oPromise.
 * </odoc>
 */
const oJobRunJobAsync = function(aJob, args, aId) {
	return $do(() => {
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
 * <key>getEnvs() : Map</key>
 * Returns a map of key and values with the operating system environment variables.
 * </odoc>
 */
const getEnvs = function() {
	return af.fromJavaMap(java.lang.System.getenv());
}

/**
 * <odoc>
 * <key>loadJSYAML()</key>
 * Loads the JS-YAML library.
 * </odoc>
 */
const loadJSYAML = function() {
	loadCompiledLib("js-yaml_js");
}

loadCompiledLib("openafsigil_js");

var __flags = _$(__flags).isMap().default({
	OJOB_SEQUENTIAL  : true,
	OJOB_HELPSIMPLEUI: false,
	OAF_CLOSED       : false,
	MD_NOMAXWIDTH    : true
})

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
	for(var ii = 0; ii < aBytesOrString.length && !detector.isDone(); ii = ii + 1024) { 
		detector.handleData(aBytesOrString, ii, ((aBytesOrString.length - ii) >= 1024 ? 1024 : (aBytesOrString.length - 1024)));
	}
	detector.dataEnd();
	res = detector.getDetectedCharset();
	detector.reset();

	return res;
};

__YAMLformat = {
  indent: 2,
  arrayIndent: false,
  lineWidth: -1,
  unsafe: true
};
/**
 * <odoc>
 * <key>AF.toYAML(aJson, multiDoc) : String</key>
 * Tries to dump aJson into a YAML string. If multiDoc = true and aJson is an array the output will be multi-document.
 * </odoc>
 */
AF.prototype.toYAML = function(aJson, multiDoc) { 
	loadJSYAML(); 
        var o = { indent: __YAMLformat.indent, noArrayIndent: !__YAMLformat.arrayIndent, lineWidth: __YAMLformat.lineWidth };
	if (isArray(aJson) && multiDoc) {
		return aJson.map(y => jsyaml.dump(y, o)).join("\n---\n\n");
	} else {
		return jsyaml.dump(aJson, o); 
	}
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
 * <key>af.fromXML2Obj(xml, ignored) : Object</key>
 * Tries to convert a XML object into a javascript object. Tag attributes will be ignored unless the corresponding tag name is included
 * on the ignored array and attributes will be added to the corresponding map with a prefix "_".
 * </odoc>
 */
AF.prototype.fromXML2Obj = function (xml, ignored, aPrefix) {
	ignored = _$(ignored).isArray().default(__);
	aPrefix = _$(aPrefix).isString().default("_");

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
	} else if (length == 1) {
		var text = xml.text().toString();
		if (text) {
			r = text;
		}
	}
	if (r == __) {
		r = {};
		for (var ichild in children) {
			var child = children[ichild];
			var name = child.localName();
			var json = af.fromXML2Obj(child, ignored, aPrefix);
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
	if (attributes.length()) {
		var a = {}, c = 0;
		for (var iattribute in attributes) {
			var attribute = attributes[iattribute];
			var name = attribute.localName();
			if (ignored && ignored.indexOf(name) == -1) {
				a[aPrefix + name] = attribute.toString();
				c++;
			}
		}
		if (c > 0) {
			if (isMap(r)) a = merge(a, r); else a[aPrefix] = r;
			return a;
		}
	}

	return r;
};

/**
 * <odoc>
 * <key>af.fromObj2XML(aMap) : String</key>
 * Tries to convert aMap into a similiar XML strucuture returned as string.
 * Note that no validation of XML strucuture is performed. 
 * Tips: ensure each map is under a map key.
 * </odoc>
 */
AF.prototype.fromObj2XML = function (obj) {
	var xml = '';
	for (var prop in obj) {
		if (obj[prop] instanceof Array) {
			for (var array in obj[prop]) {
				xml += "<" + prop + ">" + af.fromObj2XML(new Object(obj[prop][array])) + "</" + prop + ">";
			}
		} else if (typeof obj[prop] == "object") {
			xml += "<" + prop + ">" + af.fromObj2XML(new Object(obj[prop])) + "</" + prop + ">";
		} else {
			xml += "<" + prop + ">" + obj[prop] + "</" + prop + ">";
		}
	}
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
 * Writes aObj into a single line on aNDJSONFile (newline delimited JSON). Optionally you can provide
 * an encoding.
 * </odoc>
 */
IO.prototype.writeLineNDJSON = function(aNDJSONFile, aObj, aEncode) {
	io.writeFileString(aNDJSONFile, stringify(aObj, __, "")+__separator, aEncode, true);
};

/**
 * <odoc>
 * <key>io.readLinesNDJSON(aNDJSONFile, aFuncCallback, aErrorCallback)</key>
 * Opens aNDJSONFile (a newline delimited JSON) as a stream call aFuncCallback with each parse JSON. If
 * aFuncCallback returns true the cycle will be interrupted. For any parse error it calls the aErrorCallback 
 * with each exception.
 * </odoc>
 */
IO.prototype.readLinesNDJSON = function(aNDJSONFile, aFuncCallback, aErrorCallback) {
	var rfs = io.readFileStream(aNDJSONFile);
	ioStreamReadLines(rfs, (line) => {
		try {
			return aFuncCallback(jsonParse(line));
		} catch(e) {
			aErrorCallback(e);
		}
	});
};

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
	var res = searchHelp(aFnName);

	if (isDef(res) && isArray(res) && res.length > 0) {
		return res[0].fullkey.replace(/ +/g, "").replace(/.+\((.*)\) *:*.*/, "$1").split(/,/);
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
 * <key>sortMapKeys(aMap) : Map</key>
 * Tries to sort the first level map keys returning the rewritten map.
 * </odoc>
 */
const sortMapKeys = (aMap) => {
	aMap = _$(aMap).isMap().default({});
	return $a2m(Object.keys(aMap).sort(), $m2a(Object.keys(aMap).sort(), aMap))
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
const ask = (aPrompt, aMask, _con) => {
    aPrompt = _$(aPrompt, "aPrompt").isString().default("> ");
 	if (isUnDef(_con)) { plugin("Console"); _con = new Console(); }
	return _con.readLinePrompt(aPrompt, aMask);
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
		create       : function(shouldCompress, type, opts) { ow.ch.create(a, shouldCompress, type, opts); return $channels(a); },
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

var __threadPool;
var __threadPoolFactor = 1;

const __resetThreadPool = function(poolFactor) {
	__threadPoolFactor = poolFactor;
	__threadPool = __;
	__getThreadPool();
}

const __getThreadPool = function() {
	if (isUnDef(__threadPool)) {
		if (isUnDef(__cpucores)) __cpucores = getNumberOfCores();
		__threadPool = new java.util.concurrent.ForkJoinPool(__cpucores * __threadPoolFactor, java.util.concurrent.ForkJoinPool.defaultForkJoinWorkerThreadFactory, null, true);
	}

	return __threadPool;
}

/**
 * <odoc>
 * <key>oPromise(aFunction, aRejFunction) : oPromise</key>
 * Custom Promise-like implementation. If you provide aFunction, this aFunction will be executed async in a thread and oPromise
 * object will be immediatelly returned. Optionally this aFunction can receive a resolve and reject functions for to you use inside
 * aFunction to provide a result with resolve(aResult) or an exception with reject(aReason). If you don't call theses functions the
 * returned value will be used for resolve or any exception thrown will be use for reject. You can use the "then" method to add more
 * aFunction that will execute once the previous as executed successfully (in a stack fashion). The return/resolve value from the 
 * previous function will be passed as the value for the second. You can use the "catch" method to add aFunction that will receive
 * a string or exception for any exception thrown with the reject functions. You can also provide a aRejFunction that works like a "catch"
 * method as previously described.
 * </odoc>
 */
 const oPromise = function(aFunction, aRejFunction) {
	this.states = {
		NEW: 0, FULFILLED: 1, PREFAILED: 2, FAILED: 3
	};

	this.state = $atomic(this.states.NEW, "int");
	this.executing = $atomic(false, "boolean");
	this.executors = new java.util.concurrent.ConcurrentLinkedQueue();
	
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
			this.__f = __getThreadPool().submit(new java.lang.Runnable({
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
        oPack("install " + aOPackName);
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
 *    boolean.setIf(t, n) - Set the current boolean to n if current value is t\\
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
 * functions wait (will block until a notify is invoked), notify (will notify and unblock all wait invocations) and
 * destroy existing references to aName.
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
    _f.prototype.destroy = function() {
		this.notify();
        delete global.__await[this.n];
    };

    return new _f(aName);
};

/**
 * <odoc>
 * <key>$doA2B(aAFunction, aBFunction, numberOfDoPromises, defaultTimeout, aErrorFunction)</key>
 * Will call aAFunction with a function as argument that should be used to "send" values to aBFunction. aBFunction will be call asynchronously in individual
 * $do up to the numberOfDoPromises limit. The defaultTimeout it 2500ms. If aErrorFunction is defined it will received any exceptions thrown from aBFunction with the corresponding arguments array.
 * </odoc>
 */
const $doA2B = function(aAFn, aBFn, noc, defaultTimeout, aErrorFunction) {
    var recs = $atomic(), srecs = $atomic(), trecs = $atomic()
    var noc  = _$(noc).isNumber().default(getNumberOfCores())
	var id   = md5(aAFn.toString() + aBFn.toString()) + (Math.random()*100000000000000000)
	defaultTimeout = _$(defaultTimeout).isNumber().default(2500)

    var B = function(aObj) {
        var cc = recs.inc()
        srecs.inc()
        while(cc > noc) { $await(id).wait(defaultTimeout); cc = recs.get(); }
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

const $sh = function(aString) {
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
		aPrefix = _$(aPrefix, "prefix").isString().default("sh");
		this.fcb = () => { return ow.format.streamSHPrefix(aPrefix, this.encoding, __, aTemplate) };
		return this;
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
				var _res = merge(sh(this.q[ii].cmd, this.q[ii].in, this.t, false, this.wd, true, (isDef(this.fcb) ? this.fcb() : __), this.encoding, this.dw, this.envs), this.q[ii]);
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
	 * Immediately copies the result of executing aCmd string or array (and any other commands in queue added using sh) trying to parse it as json.
	 * If aIdx is provided it will return the map entry for the corresponding command on the array otherwise it will return the array.
	 * </odoc>
	 */
	__sh.prototype.getJson = function(aIdx) {
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

    return new __sh(aString);
};

const $ssh = function(aMap) {
	/**
	 * <odoc>
	 * <key>$ssh.$ssh(aMap) : $ssh</key>
	 * Builds an object to allow access through ssh. aMap should be a ssh string with the format: ssh://user:pass@host:port/identificationKey?timeout=1234&amp;compression=true or
	 * a map with the keys: host, port, login, pass, id/key, compress and timeout. See "help SSH.SSH" for more info.
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

// -------------------------------------
// Profile support (must be always last)

var OPENAFPROFILE;
if (isUnDef(OPENAFPROFILE)) OPENAFPROFILE = ".openaf_profile";

(function() {
	var prof = "";
	try {
		var fprof = java.lang.System.getProperty("user.home") + "/" + OPENAFPROFILE;
		if (io.fileExists(fprof)) {
			loadCompiled(fprof);
		}
	} catch(e) {
		if (!e.message.match(/java\.io\.FileNotFoundException/)) throw e;
	}

	try {
		if (af.getClass("openaf.OAFRepack").getResourceAsStream("/" + OPENAFPROFILE) != null) {
			var fprof = getOpenAFJar() + "::" + OPENAFPROFILE;
			prof = io.readFileString(fprof);
			af.compile(prof);
		}
	} catch(e) {
		if (!e.message.match(/java\.io\.FileNotFoundException/) &&
		    !e.message.match(/java\.io\.IOException/) &&
		    !e.message.match(/java\.lang\.NullPointerException: entry/)) throw e;
	}
})();

// OAF Code Integrity for script files
var __scriptfile
if (isString(__scriptfile)) {
	__codeVerify(io.readFileString(__scriptfile), __scriptfile)
}