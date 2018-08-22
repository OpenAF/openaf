//OPENAF common functions
//Author: Nuno Aguiar

const self = this;
const global = self;

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
var __noSLF4JErrorOnly;
//Set openaf variables
var __openaf;
try {
	__openaf = io.readFile(getOpenAFJar() + "::openaf.json");
} catch(e) {
	__openaf = {};
}

noHomeComms = (isDef(__openaf.noHomeComms)) ? __openaf.noHomeComms : false;
var __opackCentral = (isDef(__openaf.opackCentral)) ? __openaf.opackCentral : [
	"http://openaf.io/opack.db"
];
const __openafBuild = (isDef(__openaf.openafBuild)) ? __openaf.openafBuild : [
    "http://openaf.io/build"
];
const __openafRelease = (isDef(__openaf.openafRelease)) ? __openaf.openafRelease : [
    "http://openaf.io/release"
];
const __openafDownload = (isDef(__openaf.openafDownload)) ? __openaf.openafDownload : [
	"https//openaf.io"
];
const __odoc = (isDef(__openaf.odoc)) ? __openaf.odoc : [
	"http://openaf.io/odoc"
];

//const __addToOpenAFjs = (isDef(__openaf.addToOpenAFjs)) ? __openaf.addToOpenAFjs : undefined;
//const __addToOpenAFConsolejs = (isDef(__openaf.addToOpenAFConsolejs)) ? __openaf.addToOpenAFConsolejs : undefined;

/**
 * Get serialize version detecting circular references (internal use)
 *
 */
function getSerialize (fn, decycle) {
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

/**
 * <odoc>
 * <key>print(aStr)</key>
 * Prints the aStr to the stdout (with a new line on the end) (example: print("hello world!"))
 * </odoc>
 */
function print(str) {
	af.p(str);
}

/**
 * <odoc>
 * <key>sprint(aStr)</key>
 * "Stringifies" and prints the aStr to the stdout (with a new line on the end) (example: sprint("hello world!"))
 * </odoc>
 */
function sprint(str, delim) { delim = (isUnDef(delim) ? "  " : delim); return print(stringify(str, undefined, delim)); }
/**
 * <odoc>
 * <key>bprint(aStr)</key>
 * "Beautifies" and prints the aStr to the stdout (with a new line on the end) (example: bprint("hello world!"))
 * </odoc>
 */
function bprint(str) { return print(beautifier(str)); }
/**
 * <odoc>
 * <key>cprint(aStr)</key>
 * "Stringifies" in ANSI color and prints the aStr to the stdout (with a new line on the end) (example: cprint("hello world!"))
 * </odoc>
 */
function cprint(str, delim) { ansiStart(); print(colorify(str)); ansiStop(); }

/**
 * <odoc>
 * <key>printnl(aStr)</key>
 * Prints the aStr to the stdout (without adding a new line on the end) (example: printnl("hello world!"))
 * </odoc>
 */
function printnl(str) {
	af.pnl(str);
}

/**
 * <odoc>
 * <key>sprintnl(aStr)</key>
 * "Stringifies" and prints the aStr to the stdout (without adding a new line on the end) (example: sprintnl("hello world!"))
 * </odoc>
 */
function sprintnl(str, delim) { delim = (isUnDef(delim) ? "  " : delim); return printnl(stringify(str, undefined, delim)); }
/**
 * <odoc>
 * <key>bprintnl(aStr)</key>
 * "Beautifies" and prints the aStr to the stdout (without adding a new line on the end) (example: bprintnl("hello world!"))
 * </odoc>
 */
function bprintnl(str) { return printnl(beautifier(str)); }
/**
 * <odoc>
 * <key>cprintnl(aStr)</key>
 * "Stringifies" in ANSI color and prints the aStr to the stdout (with a new line on the end) (example: cprintnl("hello world!"))
 * </odoc>
 */
function cprintnl(str, delim) { ansiStart(); printnl(colorify(str)); ansiStop(); }

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
function tprintnl(aTemplateString, someData) {
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
function tprint(aTemplateString, someData) {
	tprintnl(aTemplateString + "\n", someData);
}

/**
 * <odoc>
 * <key>printErr(aStr)</key>
 * Prints the aStr to the stderr (with a new line on the end) (example: printErr("Hupps!! A problem!"))
 * </odoc>
 */
function printErr(str) {
	af.e(str);
}

/**
 * <odoc>
 * <key>sprintErr(aStr)</key>
 * "Stringifies" and prints the aStr to the stderr (with a new line on the end) (example: sprintErr("Hupps!! A problem!"))
 * </odoc>
 */
function sprintErr(str, delim) { delim = (isUnDef(delim) ? "  " : delim); return printErr(stringify(str, undefined, delim)); }
/**
 * <odoc>
 * <key>bprintErr(aStr)</key>
 * "Beautifies" and prints the aStr to the stderr (with a new line on the end) (example: bprintErr("Hupps!! A problem!"))
 * </odoc>
 */
function bprintErr(str) { return printErr(beautifier(str)); }
/**
 * <odoc>
 * <key>cprintErr(aStr)</key>
 * "Stringifies" in ANSI color and prints the aStr to the stderr (with a new line on the end) (example: cprintErr("Hupps!! A problem!"))
 * </odoc>
 */
function cprintErr(str) { ansiStart(); printErr(colorify(str)); ansiStop(); }

/**
 * <odoc>
 * <key>printErrnl(aStr)</key>
 * Prints the aStr to the stderr (without adding a new line on the end) (example: printErrnl("Hupps!! A problem!"))
 * </odoc>
 */
function printErrnl(str) {
	af.enl(str);
}

/**
 * <odoc>
 * <key>sprintErrnl(aStr)</key>
 * "Stringifies" and prints the aStr to the stderr (without adding a new line on the end) (example: sprintErrnl("Hupps!! A problem!"))
 * </odoc>
 */
function sprintErrnl(str, delim) { delim = (isUnDef(delim) ? "  " : delim); return printErrnl(stringify(str, undefined, delim)); }

/**
 * <odoc>
 * <key>bprintErrnl(aStr)</key>
 * "Beautifies" and prints the aStr to the stderr (without adding a new line on the end) (example: bprintErrnl("Hupps!! A problem!"))
 * </odoc>
 */
function bprintErrnl(str) { return printErrnl(beautifier(str)); }

/**
 * <odoc>
 * <key>cprintErrnl(aStr)</key>
 * "Stringifies" in ANSI color and prints the aStr to the stderr (with a new line on the end) (example: cprintErrnl("Hupps!! A problem!"))
 * </odoc>
 */
function cprintErrnl(str, delim) { ansiStart(); printErrnl(colorify(str)); ansiStop(); }

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
function tprintErrnl(aTemplateString, someData) {
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
function tprintErr(aTemplateString, someData) {
	tprintErrnl(aTemplateString + "\n", someData);
}

/**
 * <odoc>
 * <key>printTable(anArrayOfEntries, aWidthLimit, displayCount, useAnsi, colorMap) : String</key>
 * Returns a ASCII table representation of anArrayOfEntries where each entry is a Map with the same keys.
 * Optionally you can specify aWidthLimit and useAnsi.
 * If you want to include a count of rows just use displayCount = true. If useAnsy = true you can provide a colorMap with colors
 * for lines (default bold) and values (default CYAN).
 * </odoc>
 */
function printTable(anArrayOfEntries, aWidthLimit, displayCount, useAnsi, colorMap) {
	var count = 0;
	var maxsize = {};
	var output = "";
	if (isUnDef(colorMap)) colorMap = {};
	if (isUnDef(colorMap.lines)) colorMap.lines = "bold";
	if (isUnDef(colorMap.values)) colorMap.values = "CYAN";

	if (!Array.isArray(anArrayOfEntries)) return "";
	if (isUnDef(aWidthLimit)) aWidthLimit = -1;
	
	// Find sizes
	anArrayOfEntries.forEach(function(row) {
		var cols = Object.keys(row);
		cols.forEach(function(col) {
			if (isUnDef(maxsize[col])) 
				maxsize[String(col)] = col.length;
			if (maxsize[String(col)] < String(row[String(col)]).length) maxsize[String(col)] = String(row[String(col)]).length;
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
					output += repeat(Math.floor((maxsize[String(col)] - String(col).length)/2), ' ') + (useAnsi ? ansiColor(colorMap.lines, String(col)) : String(col)) + repeat(Math.round((maxsize[String(col)] - String(col).length) / 2), ' ');
					if (colNum < (cols.length-1)) output += (useAnsi ? ansiColor(colorMap.lines, "|") : "|");
				}
				colNum++;
			});
			output += "\n";
			//output += (useAnsi ? ansiColor(colorMap.lines, "+") : "+"); 
			lineSize = 1; outOfWidth = false; colNum = 0;
			cols.forEach(function(col) {
				if (outOfWidth) return;
				lineSize += maxsize[String(col)] + 1;
				if (aWidthLimit > 0 && lineSize > (aWidthLimit+3)) {
					output += (useAnsi ? ansiColor(colorMap.lines, "...") : "..."); outOfWidth = true;
				} else {
					output += (useAnsi ? ansiColor(colorMap.lines, repeat(maxsize[String(col)], '-')) : repeat(maxsize[String(col)], '-'));
					if (colNum < (cols.length-1)) output += (useAnsi ? ansiColor(colorMap.lines, "+") : "+");
				}
				colNum++;
			});
			output += "\n";
		};

		//output += (useAnsi ? ansiColor(colorMap.lines, "|") : "|"); 
		lineSize = 1; outOfWidth = false; colNum = 0;
		cols.forEach(function(col) {
			if (outOfWidth) return;
			lineSize += maxsize[String(col)] + 1;
			if (aWidthLimit > 0 && lineSize > (aWidthLimit+3)) {
				output += "..."; outOfWidth = true;
			} else {	
				var value = String(row[String(col)]).replace(/\n/g, " ");
				output += (useAnsi ? ansiColor(colorMap.values, value) : value) + repeat(maxsize[String(col)] - String(row[String(col)]).length, ' ');
				if (colNum < (cols.length-1)) output += (useAnsi ? ansiColor(colorMap.lines, "|") : "|");
			}
			colNum++;
		});
		output += "\n";
		count++;
	});

	if (displayCount) {
		var summary = "[#" + count + " " + ((count <= 1) ? "row" : "rows") + "]";
		output += (useAnsi ? ansiColor(colorMap.lines, summary) : summary);
	}
	
	return output;
}

var __con, __conStatus, __conAnsi;
function __initializeCon() {
	if (isDef(__conStatus)) return __conStatus;

	if (isUnDef(__con)) {
		plugin("Console");
		try {
			__con = (new Console()).getConsoleReader();
			__conStatus = true;
			__conAnsi = __con.getTerminal().isAnsiSupported();
			return true;
		} catch(e) {
			__conStatus = false;
			__conAnsi = false;
			return false;
		}
	} else {
		__conStatus = true;
		__conAnsi = true;
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
function ansiColor(aAnsi, aString, force) {
	if (!__initializeCon()) return aString;

	var con = __con;
	var ansis = force || (__conAnsi && (java.lang.System.console() != null));
	var jansi = JavaImporter(Packages.org.fusesource.jansi);
	var res = "";
	
	if (ansis) {
		var res = Packages.org.fusesource.jansi.AnsiRenderer.render("@|" + aAnsi.toUpperCase() + " " + aString + "|@");
		return res;
	} else {
		return aString;
	}
}

/**
 * <odoc>
 * <key>ansiStart(force)</key>
 * Prepares to output ansi codes if the current terminal is capable off (unless force = true). Use with ansiColor() and ansiStop().
 * </odoc>
 */
function ansiStart(force) {
	if (!__initializeCon()) return false;
	var con = __con;
	var ansis = force || (__conAnsi && (java.lang.System.console() != null));
	var jansi = JavaImporter(Packages.org.fusesource.jansi);
	if (ansis) {
		java.lang.System.out.flush(); java.lang.System.err.flush();
		jansi.AnsiConsole.systemInstall();
	}
}

/**
 * <odoc>
 * <key>ansiStop(force)</key>
 * Disables the output of ansi codes if the current terminal is capable off (unless force = true). Use with ansiColor() and ansiStart().
 * </odoc>
 */
function ansiStop(force) {
	if (!__initializeCon()) return false;
	var con = __con;
	var ansis = force || (__conAnsi && (java.lang.System.console() != null));
	var jansi = JavaImporter(Packages.org.fusesource.jansi);
	if (ansis) {
		jansi.AnsiConsole.systemUninstall();
		java.lang.System.out.flush(); java.lang.System.err.flush();
	}
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
function wedoDate(year, month, day, hour, minute, second, ms) {
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
function beautifier(aobj) {
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
function stringify(aobj, replacer, space) {
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
	key: "BOLD,BLACK",
	number: "GREEN",
	string: "CYAN",
	boolean: "RED",
	default: "YELLOW"
};
function colorify(json) {
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

/**
 * <odoc>
 * <key>jsonParse(aString) : Map</key>
 * Shorcut for the native JSON.parse that returns an empty map if aString is not defined, empty or unparsable.
 * </odoc>
 */
function jsonParse(astring) {
	if (isDef(astring) && String(astring).length > 0) {
		try {
			var a = JSON.parse(astring);
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
function templify(aTemplateString, someData) {
	someData = (isUnDef(someData)) ? this : someData;
	return ow.loadTemplate().parse(aTemplateString, someData);
}

/**
 * <odoc>
 * <key>sleep(millis)</key>
 * Shortcut for af.sleep function. Will pause execution for a given period of time expressed in milliseconds.
 * </odoc>
 */
function sleep(millis, alternative) {
	if (alternative) {
		af.sleep(millis);
	} else {
		java.util.concurrent.TimeUnit.MILLISECONDS.sleep(millis);			
	}
}

/**
 * <odoc>
 * <key>getUUID() : String</key>
 * Generates and returns an UUID using a javascript algorithm (if needed you can refer to the 
 * AF operation AF.KeyGenerator.GenerateUUID).
 * </odoc>
 */
function genUUID() {
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
function toCSV(anArray) {
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
	profile   : false
};
var __logPromise;

function __initializeLogPromise() {
	if (__logFormat.async) {
		if (isUnDef(__logPromise)) {
			__logPromise = $do(() => {}).catch((e) => {});
			addOnOpenAFShutdown(() => {
				$doWait(__logPromise);
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
 * \
 * </odoc>
 */
function setLog(aMap) {
	__logFormat = merge(__logFormat, aMap);
}

/**
 * <odoc>
 * <key>startLog(externalLogging)</key>
 * Starts collecting log messages logged with log* functions. See stopLog() and dumpLog().
 * You can also specify externalLogging, a custom channel subscribe function. 
 * </odoc>
 */
function startLog(externalLogging) {
	$ch("__log").create(true, "simple");
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
function getChLog() {
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
function dumpLog() {
	return $ch("__log").getAll();
}

/**
 * <odoc>
 * <key>stopLog()</key>
 * Will stop collecting log messages and will reset everything. User dumpLog() before stopping if you intend
 * to keep the recorded log messages.
 * </odoc>
 */
function stopLog() {
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
}

/**
 * <odoc>
 * <key>log(msg, formatOptions)</key>
 * Outputs to the current stdout a line composed of the current date, indication of INFO and the provided msg.
 * Optionally you can provide a formatOptions map for overriding the defaults from setLog.
 * Note: you can use startLog, stopLog and dumpLog to keep an internal record of theses messages.
 * </odoc>
 */
function log(msg, formatOptions) {
	var data = (new Date()).toJSON(), nw = nowNano(), k, v;
	if (isDef(__logFormat)) formatOptions = merge(__logFormat, formatOptions);
	if (__logStatus) {
		var f = () => {
			k = { n: nw, t: "INFO" };
			v = { n: nw, d: data, t: "INFO", m: msg };
			if (isDef(__logFormat) && formatOptions.profile) {
				v.freeMem = Number(java.lang.Runtime.getRuntime().freeMemory());
				v.totalMem = Number(java.lang.Runtime.getRuntime().totalMemory());
				v.systemLoad = getCPULoad();
			}
			$ch("__log").set(k, v);
		};
		if (isDef(__logFormat) && formatOptions.async) {
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
	var go = (isDef(__logFormat) && (formatOptions.off || formatOptions.offInfo)) ? false : true;
	if (go) {
		if (isUnDef(__conStatus)) __initializeCon();
		var f = () => {
			var sep = (isDef(__logFormat) && (isDef(formatOptions.separator))) ? formatOptions.separator : " | ";
			var ind = (isDef(__logFormat) && (isDef(formatOptions.indent))) ? formatOptions.indent : "";
			ansiStart();
			data = (isDef(__logFormat) && isDef(formatOptions.dateFormat)) ? ow.loadFormat().fromDate(new Date(data), formatOptions.dateFormat, formatOptions.dateTZ) : data;
			print(ind + ansiColor("BOLD", data) + sep + "INFO" + sep + msg);
			ansiStop();
			return 1;
		};
		if (isDef(__logFormat) && formatOptions.async) {
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
function tlog(msg, someData, formatOptions) {
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
function lognl(msg, formatOptions) {
	var data = (new Date()).toJSON(), nw = nowNano(), k, v;
	if (isDef(__logFormat)) formatOptions = merge(__logFormat, formatOptions);
	if (__logStatus) {
		var f = () => {
			k = { n: nw, t: "INFO" };
			v = { n: nw, d: data, t: "INFO", m: msg };
			if (isDef(__logFormat) && formatOptions.profile) {
				v.freeMem = Number(java.lang.Runtime.getRuntime().freeMemory());
				v.totalMem = Number(java.lang.Runtime.getRuntime().totalMemory());
				v.systemLoad = getCPULoad();
			}
			$ch("__log").set(k, v);
		};
		if (isDef(__logFormat) && formatOptions.async) {
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
	var go = (isDef(__logFormat) && (formatOptions.off || formatOptions.offInfo)) ? false : true;
	if (go) {
		if (isUnDef(__conStatus)) __initializeCon();
		var f = () => {
			var sep = (isDef(__logFormat) && (isDef(formatOptions.separator))) ? formatOptions.separator : " | ";
			var ind = (isDef(__logFormat) && (isDef(formatOptions.indent))) ? formatOptions.indent : "";
			ansiStart();
			data = (isDef(__logFormat) && isDef(formatOptions.dateFormat)) ? ow.loadFormat().fromDate(new Date(data), formatOptions.dateFormat, formatOptions.dateTZ) : data;
			printnl(ind + ansiColor("BOLD", data) + sep + "INFO" + sep + msg + "\r");
			ansiStop();
			return 1;
		};
		if (isDef(__logFormat) && formatOptions.async) {
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
function tlognl(msg, someData, formatOptions) {
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
function logErr(msg, formatOptions) {
	var data = (new Date()).toJSON(), nw = nowNano(), k, v;
	if (isDef(__logFormat)) formatOptions = merge(__logFormat, formatOptions);
	if (__logStatus) {
		var f = () => {
			k = { n: nw, t: "ERROR" };
			v = { n: nw, d: data, t: "ERROR", m: msg };
			if (isDef(__logFormat) && formatOptions.profile) {
				v.freeMem = Number(java.lang.Runtime.getRuntime().freeMemory());
				v.totalMem = Number(java.lang.Runtime.getRuntime().totalMemory());
				v.systemLoad = getCPULoad();
			}
			$ch("__log").set(k, v);
		};
		if (isDef(__logFormat) && formatOptions.async) {
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
	var go = (isDef(__logFormat) && (formatOptions.off || formatOptions.offError)) ? false : true;
	if (go) {
		if (isUnDef(__conStatus)) __initializeCon();
		var f = () => {
			var sep = (isDef(__logFormat) && (isDef(formatOptions.separator))) ? formatOptions.separator : " | ";
			var ind = (isDef(__logFormat) && (isDef(formatOptions.indent))) ? formatOptions.indent : "";
			ansiStart();
			data = (isDef(__logFormat) && isDef(formatOptions.dateFormat)) ? ow.loadFormat().fromDate(new Date(data), formatOptions.dateFormat, formatOptions.dateTZ) : data;
			printErr(ind + ansiColor("BOLD", data) + sep + ansiColor("red", "ERROR") + sep + msg);
			ansiStop();
			return 1;
		};
		if (isDef(__logFormat) && formatOptions.async) {
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
function logWarn(msg, formatOptions) {
	var data = (new Date()).toJSON(), nw = nowNano(), k, v;
	if (isDef(__logFormat)) formatOptions = merge(__logFormat, formatOptions);
	if (__logStatus) {
		var f = () => {
			k = { n: nw, t: "WARN" };
			v = { n: nw, d: data, t: "WARN", m: msg };
			if (isDef(__logFormat) && formatOptions.profile) {
				v.freeMem = Number(java.lang.Runtime.getRuntime().freeMemory());
				v.totalMem = Number(java.lang.Runtime.getRuntime().totalMemory());
				v.systemLoad = getCPULoad();
			}
			$ch("__log").set(k, v);
		};
		if (isDef(__logFormat) && formatOptions.async) {
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
	var go = (isDef(__logFormat) && (formatOptions.off || formatOptions.offWarn)) ? false : true;
	if (go) {
		if (isUnDef(__conStatus)) __initializeCon();
		var f = () => {
			var sep = (isDef(__logFormat) && (isDef(formatOptions.separator))) ? formatOptions.separator : " | ";
			var ind = (isDef(__logFormat) && (isDef(formatOptions.indent))) ? formatOptions.indent : "";
			ansiStart();
			data = (isDef(__logFormat) && isDef(formatOptions.dateFormat)) ? ow.loadFormat().fromDate(new Date(data), formatOptions.dateFormat, formatOptions.dateTZ) : data;
			print(ind + ansiColor("BOLD", data) + sep + ansiColor("yellow", "WARN") + sep + msg);
			ansiStop();
			return 1;
		};
		if (isDef(__logFormat) && formatOptions.async) {
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
function tlogErr(msg, someData, formatOptions) {
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
function tlogWarn(msg, someData, formatOptions) {
	logWarn(templify(msg, someData), formatOptions);
}

/**
 * <odoc>
 * <key>repeat(nTimes, aStr) : String</key>
 * Will build a string composed of aStr repeated nTimes.
 * </odoc>
 */
function repeat(nTimes, aStr) {
	return aStr.repeat(nTimes);
}

/**
 * <odoc>
 * <key>now() : Number</key>
 * Will return the current system time in milliseconds.
 * </odoc>
 */
function now() {
	return Number(java.lang.System.currentTimeMillis());
}

/**
 * <odoc>
 * <key>nowUTC() : Number</key>
 * Will return the current system time in milliseconds.
 * </odoc>
 */
function nowUTC() {
	return Number(java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("UTC")).getTimeInMillis());
}

/**
 * <odoc>
 * <key>nowNano() : Number</key>
 * Will return the current system time in nanoseconds.
 * </odoc>
 */
function nowNano() {
	return Number(java.lang.System.nanoTime());
}

/**
 * <odoc>
 * <key>md5(anObject) : String</key>
 * Will return of the MD5 in hexadecimal format for a given anObject.\
 * For files you can provide a file stream: var s = io.readFileStream(getOpenAFJar()); md5(s); s.close()
 * </odoc>
 */
function md5(obj) {
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
function sha1(obj) {
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
function sha256(obj) {
	var DigestUtils = org.apache.commons.codec.digest.DigestUtils;
	return DigestUtils.sha256Hex(obj) + "";
}

/**
 * <odoc>
 * <key>sha512(anObject) : String</key>
 * Will return of the SHA-512 in hexadecimal format for a given anObject.\
 * For files you can provide a file stream: var s = io.readFileStream(getOpenAFJar()); sha512(s); s.close()
 * </odoc>
 */
function sha512(obj) {
	var DigestUtils = org.apache.commons.codec.digest.DigestUtils;
	return DigestUtils.sha512Hex(obj) + "";
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
function bcrypt(aText, aVerifyHash, hashingRounds) {
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
function splitBySeparator(aString, aSep) {
	if (isUnDef(aString) || aString == null) return [];
	if (isUnDef(aSep)) aSep = ";";

	return aString.replace(new RegExp(aSep, "g"), "\\" + aSep).replace(new RegExp("\\\\\\\\(?=" + aSep + ")", "g") , "").split("\\" + aSep + "");
}

/**
 * <odoc>
 * <key>processExpr(aSeparator, ignoreCase) : Map</key>
 * Will access the current contents of the OpenAF -e argument looking for pairs of key values in the form "a=5;b=1;c=xpto\\;"
 * and will produce a Map with { "a": 5, "b": 1, "c": "xpto;" }. If no aSeparator is provided ';' will be assumed.
 * __pmIn values will be also included. If ignoreCase = true all keys will be lower cased.
 * </odoc>
 */
function processExpr(aSep, ignoreCase) {
	if (isUnDef(aSep)) aSep = ";";
	//var args = __expr.replace(new RegExp(aSep, "g"), "\\" + aSep).replace(new RegExp("\\\\\\\\(?=" + aSep + ")", "g") , "").split("\\" + aSep + "");
	var args = splitBySeparator(__expr, aSep);
	var pairs = {};

	for(argIdx in args) {
		var arg = args[argIdx];

		var pair = splitBySeparator(arg, "=");
		if (!ignoreCase)
			pairs[pair[0]] = (isUnDef(pair[1]) ? "" : pair[1]);
		else
			pairs[pair[0].toLowerCase()] = (isUnDef(pair[1]) ? "" : pair[1]);
	}

	//load __pmIn to pairs
	for (var attrname in __pmIn) { 
		if (!ignoreCase)
			pairs[attrname] = __pmIn[attrname];
		else 
			pairs[attrname.toLowerCase()] = __pmIn[attrname];
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
function getVersion() {
	return af.getVersion();
}

/**
 * <odoc>
 * <key>getDistribution() : String</key>
 * Returns the current distribution channel for this version of OpenAF.
 * </odoc>
 */
function getDistribution() {
	return af.getDistribution();
}

/**
 * <odoc>
 * <key>getOpenAFPath() : String</key>
 * Returns the filesystem path to the openaf.jar currently being used for the script execution.
 * </odoc>
 */
function getOpenAFPath() {
	if (isDef(__forcedOpenAFJar)) {
		return String(new java.io.File(__forcedOpenAFJar).getParent());
	} else {
		var classPath = new java.io.File(java.lang.System.getProperty("java.class.path")).getAbsolutePath() + "";
		classPath = classPath.replace(/openaf\.jar$/, "").replace(/\\/g, "/");

		return classPath.replace(/[/\\][^/\\]+$/, "");
	}
}

//------------------------------------------
//OPACK functions
//------------------------------------------

var PACKAGEJSON  = ".package.json";
var PACKAGEYAML  = ".package.yaml";
var PACKAGESJSON = "packages.json";
var PACKAGESJSON_DB = ".opack.db";
var OPACKCENTRALJSON = "packages.json";

var __opackParams;
/**
 * <odoc>
 * <key>oPack(aParameters)</key>
 * Tries to execute oPack with aParameters string. These string is equivalent to the opack command-line commands.
 * aParameters = "help" will, for example, print all the help information. 
 * </odoc> 
 */
function oPack(aCmd) { 
	__opackParams = aCmd;
	load(getOpenAFJar() + "::js/opack.js");
}

/**
 * <odoc>
 * <key>getOPackRemoteDB() : Array</key>
 * Returns an Array of maps. Each map element is an opack package description registered in the OpenAF central repository.
 * </odoc>
 */
function getOPackRemoteDB() {
	var packages = {};
	if (noHomeComms) return packages;

	plugin("ZIP");
	plugin("HTTP");

	var http;
	var zip;

	for(let i in __opackCentral) {
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
 * locally installed opack packages.
 * </odoc>
 */
function getOPackLocalDB() {
	var fileDB = getOpenAFPath() + "/" + PACKAGESJSON_DB;
	var packages = {};
	var exc;

	// Verify fileDB
	try {
		if (!io.fileInfo(fileDB).permissions.match(/r/)) {
			exc = fileDB + " is not acessible. Please check permissions (" + io.fileInfo(fileDB).permissions + ").";
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
			
			for(var pack in packages) {
				if (packages[pack].name == "OpenAF") packages[pack].version = getVersion();
			}
		} catch(e) {
			exc = e;
		}
	}

	if (isDef(exc) && isDef(exc.message) && (!exc.message.match(/NoSuchFileException/))) throw exc;

	return packages;
}

/**
 * <odoc>
 * <key>getOPackPaths() : Array</key>
 * Returns an array of strings with the paths for each of the installed opacks.
 * </odoc>
 */
function getOPackPaths() {
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
function getOPackPath(aPackage) {
	var paths = getOPackPaths();
	return paths[aPackage];
}

/**
 * <odoc>
 * <key>opackExec(aPackageName)</key>
 * Tries to execute the provided opack aPackageName.
 * </odoc>
 */
function opackExec(aPackageName) {
	__expr = "exec " + aPackageName + " " + __expr;
	load(getOpenAFJar() + "::js/opack.js");
}

/**
 * <odoc>
 * <key>load(aScript)</key>
 * Provides a shortcut for the af.load function (see more af.load). If the provided aScript is not found
 * this function will try to search the script on the openaf.jar::js folder and on the installed opacks.
 * If it doesn't find the provided aScript it will throw an exception "Couldn't find aScript".
 * </odoc>
 */
function load(aScript) {
	var error = "";
	
	try {
		try {
			af.load(aScript);
		} catch(e) {
			if (e.message == "\"exports\" is not defined.") {
				var exp = require(aScript);
				global[io.fileInfo(aScript).filename.replace(/\.js$/, "")] = exp;
				return aScript;
			} else {
				throw e;
			}
		}
		return aScript;
	} catch(e0) {
		if (e0.message.match(/FileNotFoundException/) || e0.message == "\"exports\" is not defined.") {
			error = e0; var exp;
			try {
				if (e0.message == "\"exports\" is not defined.") {
					exp = require(aScript + ".js");
					global[io.fileInfo(aScript).filename.replace(/\.js$/, "")] = exp;
					return aScript;
				} else {
					af.load(aScript + ".js");
					return aScript;
				}
			} catch(e) {
				if (e.message.match(/FileNotFoundException/) || e.message == "\"exports\" is not defined.") {
					error = e;
					var paths = getOPackPaths();
					paths["__default"] = java.lang.System.getProperty("java.class.path") + "::js";
			
					for(let i in paths) {
						try {
							paths[i] = paths[i].replace(/\\+/g, "/");
							if (e0.message == "\"exports\" is not defined.") {
								exp = require(paths[i] + "/" + aScript);
								global[aScript.replace(/\.js$/, "")] = exp;
								return aScript;
							} else {
								af.load(paths[i] + "/" + aScript);
								return aScript;
							}
						} catch(e) {
							if (e.message == "\"exports\" is not defined.") {
								try {
									exp = require(paths[i] + "/" + aScript);
									global[aScript.replace(/\.js$/, "")] = exp;
									return aScript;
								} catch(e1) {
									error = e1;
								}
							} else {
								error = e;
							}
						}
					}
			
					if (typeof __loadedfrom !== 'undefined') {
						af.load(__loadedfrom.replace(/[^\/]+$/, "") + aScript);
						return aScript;
					}
				} else {
					throw e;
				}
				
			}
		} else { 
			throw e0;
		}
	}
	throw "Couldn't find " + aScript + "; " + error;
}

/**
 * <odoc>
 * <key>plugin(aPlugin)</key>
 * Provides a shortcut for the af.plugin function. It also provides a shortcut for plugins with
 * the java package "openaf.plugins" (e.g. af.plugin("openaf.plugins.HTTP") is the same
 * as plugin("HTTP")).
 * </odoc>
 */
var __loadedPlugins;
function plugin(aPlugin) {
	if (isUnDef(__loadedPlugins)) __loadedPlugins = {};
	var pluginLoaded;
	try {
		if (!aPlugin.match(/\./)) {
			pluginLoaded = "openaf.plugins." + aPlugin;
			
			if (__loadedPlugins[pluginLoaded]) return;
			af.plugin("openaf.plugins." + aPlugin);
			__loadedPlugins[pluginLoaded] = true;

			return;
		}
	} catch(e) {
	}

	pluginLoaded = aPlugin;
	if (__loadedPlugins[pluginLoaded]) return;
	af.plugin(aPlugin);
	__loadedPlugins[pluginLoaded] = true;
}

/**
 * <odoc>
 * <key>isUndefined(aObject) : boolean</key>
 * Returns true if the provided aObject is undefined as a javascript variable. It will return false otherwise.
 * (see also isDefined)
 * </odoc>
 */
function isUndefined(aObject) {
	return (typeof aObject == 'undefined') ? true : false;
}

/**
 * <odoc>
 * <key>isDefined(aObject) : boolean</key>
 * Returns true if the provided aObject is defined as a javascript variable. It will return false otherwise.
 * (see also isUndefined)
 * </odoc>
 */
function isDefined(aObject) {
	return (!isUndefined(aObject));
}

/**
 * <odoc>
 * <key>isDef(aObject) : boolean</key>
 * Returns true if the provided aObject is defined as a javascript variable. It will return false otherwise.
 * (see also isUnDef). Shortcut for the isDefined function.
 * </odoc>
 */
function isDef(aObject)   { return (!(typeof aObject == 'undefined')) ? true : false; }
/**
 * <odoc>
 * <key>isUnDef(aObject) : boolean</key>
 * Returns true if the provided aObject is undefined as a javascript variable. It will return false otherwise.
 * (see also isDef). Shortcut for the isUndefined function.
 * </odoc>
 */
function isUnDef(aObject) { return (typeof aObject == 'undefined') ? true : false; }

/**
 * <odoc>
 * <key>isBinaryArray(anArrayOfChars, confirmLimit, previousResult) : boolean</key>
 * Tries to determine if the provided anArrayOfChars is binary or text. The detection is performed with the first 1024 chars (
 * that can be changed if confirmLimit is provided). Additionally is possible to link multiple calls providing the last result
 * on previousResult for multiple subsequences of a main array of chars sequence. Should work for utf8, iso-8859-1, iso-8859-7,
*  windows-1252 and windows-1253. Returns true if file is believed to be binary.
 * </odoc>
 */
function isBinaryArray(anArrayOfChars, confirmLimit) {
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
function listFilesRecursive(aPath) {
	if (isUnDef(aPath)) return [];

	var files = io.listFiles(aPath);
	if(isUnDef(files)) return [];
	var ret = [];
	files = files.files;
	if (isUnDef(files)) return [];
	ret = files.concat(ret);

	for(i in files) {
		if (files[i].isDirectory) {
			ret = ret.concat(listFilesRecursive(files[i].filepath));
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
function cls() {
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
function beep() {
	Packages.java.awt.Toolkit.getDefaultToolkit().beep();
}

/**
 * <odoc>
 * <key>watch(waitFor, aCommand, beautifyFlag)</key>
 * Executes javascript aCommand provided every waitFor periods of time (expressed in ms). The screen
 * will be cleared and the execution will repeat indefinitely until the 'q' key is pressed. 
 * Optionally a beautifyFlag can be provided to execute the beautifier function on the aCommand result.
 * </odoc>
 */
function watch(waitFor, aCommand, beautifyFlag) {
	var c = -2;

	plugin("Threads");
	if (isUnDef(__conStatus)) __initializeCon();
	var con = __con;
	var t = new Threads();

	t.addThread(function() {
		var out = "";
		try {
			out = af.eval(aCommand);
		} catch (e) {
			out = e.message;
		}

		if (beautifyFlag) out = beautifier(out);

		cls();
		print(out);
		print("Press 'q' to quit. (refreshed at " + new Date() + ")");
	});

	try {
		t.startWithFixedRate(waitFor);

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
function quickSort(items, aCompareFunction) {
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
function extend() {
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
function exit(exitCode) {
	if(isUnDef(exitCode)) exitCode = 0;

	java.lang.System.exit(exitCode);
}

/**
 * <odoc>
 * <key>clone(anObject) : aClonedObject</key>
 * Creates a new copy of a JavaScript object.
 * </odoc>
 */
function clone(aObject) {
	if (Array.isArray(aObject)) return aObject.slice(0);
 	return extend(true, {}, aObject);
}

/**
 * <odoc>
 * <key>merge(anObjectA, anObjectB) : aMergedObject</key>
 * Merges a JavaScript object A with a JavaScript object B a returns the result as a new object.
 * </odoc>
 */
function merge(aObjectA, aObjectB) {
	if (isObject(aObjectA) && isArray(aObjectB)) {
		for(let i in aObjectB) { aObjectB[i] = merge(aObjectB[i], clone(aObjectA)); }
		return aObjectB;
	}
	if (isObject(aObjectB) && isArray(aObjectA)) {
		for(let i in aObjectA) { aObjectA[i] = merge(aObjectA[i], clone(aObjectB)); }
		return aObjectA;
	}
	return extend(true, clone(aObjectA), aObjectB);
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
function restartOpenAF(aCommandLineArray, preLineArray) {
	var javaBin = java.lang.System.getProperty("java.home") + java.io.File.separator + "bin" + java.io.File.separator + "java";
	var currentJar = getOpenAFJar();
	
	/* is it a jar file? */
	if(!currentJar.endsWith(".jar"))
		return;

	/* Build command: java -jar application.jar */
	var command = new java.util.ArrayList();
	command.add(javaBin);
	if (isDef(preLineArray)) {
		for(let c in preLineArray) {
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
		for(let c in __args) {
			command.add(__args[c]);
		}
	} else {
		for(let c in aCommandLineArray) {
			command.add(aCommandLineArray[c]);
		}
	}

	var builder = new java.lang.ProcessBuilder(command);
	builder.inheritIO();
	builder.start();
	java.lang.System.exit(0);
}

/**
 * <odoc>
 * <key>compare(X, Y) : Boolean</key>
 * Compares a X object to a Y object at the content level. If they are equal the function will return true
 * otherwise it will return false.
 * </odoc>
 */
function compare(x, y) {
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

	var p = Object.keys(x);
	return Object.keys(y).every(function (i) { return p.indexOf(i) !== -1; }) &&
	p.every(function (i) { return compare(x[i], y[i]); });
}

/**
 * <odoc>
 * <key>inherit(Child, Parent)</key>
 * Associates a Child object to a Parent simulating a inheritance relationship. This is done by
 * copying the Parent prototype to the Child prototype. This is similar to "Parent.call(this, arg1, arg2)"
 * </odoc>
 */
function inherit(Child, Parent) {
	Child.prototype = Object.create(Parent.prototype);
	Child.prototype.constructor = Child;
}

/**
 * <odoc>
 * <key>$from : Array</key>
 * Shortcut for the JLinq library for easy query and access to arrays/objects. To see all the available options
 * please refer to http://hugoware.net/Projects/jlinq and the list of available functions by executing,
 * in the openaf-console: "desc $from([])".
 * </odoc>
 */
$from = function(a) {
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
}

/**
 * <odoc>
 * <key>$stream</key>
 * Shortcut for the streamjs library for easy query and access to streams of data. To see all the available options
 * please refer to https://github.com/winterbe/streamjs/blob/master/APIDOC.md.
 * </odoc>
 */
$stream = function(a) {
	loadCompiledLib("stream_js");
	
	if (isUnDef(a)) return Stream;
	return Stream(a);
}

//Parallel processing
var __cpucores;

/**
 * <odoc>
 * <key>getNumberOfCores() : Number</key>
 * Try to identify the current number of cores on the system where the script is being executed.
 * </odoc>
 */
function getNumberOfCores() {
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
function getCPULoad(useAlternative) {
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
function getPid() {
	return (Packages.java.lang.management.ManagementFactory.getRuntimeMXBean().getName() + "").replace(/(\d+).+/, "$1");
}

/**
 * <odoc>
 * <key>addOnOpenAFShutdown(aFunction) : Boolean</key>
 * Adds aFunction to try to execute whenever OpenAF is going to shutdown. The latest hook added will be the first to be
 * executed until the first hook added (actually a shortcut for Threads.addOpenAFShutdownHook).
 * </odoc>
 */
function addOnOpenAFShutdown(aFunction) {
	plugin("Threads");
	try {
		(new Threads()).addOpenAFShutdownHook(() => {
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
function pidCheck(aPid) {
	
	try {
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
function pidCheckIn(aFilename) {
	var checkPid;
	
	try {
		checkPid = io.readFileString(aFilename);
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
function pidKill(aPidNumber, isForce) {
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
function pidCheckOut(aFilename) {
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
function splitArray(anArray, numberOfParts) {
    var res = [];
    if (isUnDef(numberOfParts)) numberOfParts = getNumberOfCores();
    
	if (numberOfParts >= anArray.length) {
		for(let i in anArray) { res.push([anArray[i]]); }
	} else {
	    for(let i = 0; i < numberOfParts; i++) {
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
function parallel(aFunction, numThreads, aAggFunction, threads) {
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
			sync(function() { cooldown++; });
			while (l > numThreads && __cooldown < numThreads) {
				sleep((l - numThreads) * 2000);
				l = getCPULoad();
			}
			sync(function() { cooldown--; });
		}
	}
	
	var results = [];
	for(let i = 0; i < numThreads; i++) {
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
function parallelArray(anArray, aReduceFunction, initValues, aAggFunction, numThreads, threads) {
	plugin("Threads");

	if (isUnDef(anArray) || isUnDef(aReduceFunction)) {
		throw "Need an array and a function."
	}
	
	if (!isArray(anArray)) {
		//throw "The object provided is not an array.";
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
			sync(function() { cooldown++; });
			while (l > numThreads && __cooldown < numThreads) {
				sleep((l - numThreads) * 2000);
				l = getCPULoad();
			}
			sync(function() { cooldown--; });
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
		for(let i in anArray) { myMap.push([anArray[i]]); }
	} else {
		for(let i = 0; i < numThreads; i++) {
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
function parallel4Array(anArray, aFunction, numberOfThreads, threads) {
	var res = parallelArray(anArray,
		function(p, c, i, a) {
			var subres = aFunction(c);
			return [ subres ].concat(p);
		},
		[],
		function(arr) { var res = []; for(let i in arr) { res = res.concat(arr[i]); } return res; },
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
function compress(anObject) {
	return io.gzip(af.fromString2Bytes(stringify(anObject)));
}

/**
 * <odoc>
 * <key>uncompress(aResultOfTheCompressFunction) : Object</key>
 * Uncompresses a JSON object, compressed by using the compress function, into a JSON object.
 * </odoc>
 */
function uncompress(aCompressedObject) {
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
const isMap = (a) => { return (Object.prototype.toString.call(a) == "[object Object]"); }

/**
 * <odoc>
 * <key>isObject(aObj) : boolean</key>
 * Returns true if aObj is an object, false otherwise;
 * </odoc>
 */
function isObject(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
};

/**
 * <odoc>
 * <key>isFunction(aObj) : boolean</key>
 * Returns true if aObj is a function, false otherwise;
 * </odoc>
 */
function isFunction(obj) {
    return typeof obj == 'function' || false;
};

/**
 * <odoc>
 * <key>isString(aObj) : boolean</key>
 * Returns true if aObj is a string, false otherwise
 * </odoc>
 */
function isString(obj) {
	return typeof obj == 'string' || false;
}

/**
 * <odoc>
 * <key>isNumber(aObj) : boolean</key>
 * Returns true if aObj is a number, false otherwise
 * </odoc>
 */
function isNumber(obj) {
	return !isNaN(parseFloat(obj)) && isFinite(obj);
}

/**
 * <odoc>
 * <key>isDate(aObj) : boolean</key>
 * Returns true if aObj is a date, false otherwise
 * </odoc>
 */
function isDate(obj) { 
	return (null != obj) && !isNaN(obj) && ("undefined" !== typeof obj.getDate); 
}

/**
 * <odoc>
 * <key>isJavaObject(aObj) : boolean</key>
 * Returns true if aObj is a Java object, false otherwise
 * </odoc>
 */
function isJavaObject(obj) {
	var s = Object.prototype.toString.call(obj);
	return (s === '[object JavaObject]' || s === '[object JavaArray]');
}

/**
 * <odoc>
 * <key>isByteArray(aObj) : boolean</key>
 * Returns true if aObj is a byte array object, false otherwise.
 * </odoc>
 */
function isByteArray(obj) {
	return (isDef(obj.getClass) && obj.getClass().getName() == "byte[]");
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
function loadLib(aLib, forceReload, aFunction) {
	if (forceReload ||
		isUnDef(__loadedLibs[aLib.toLowerCase()]) || 
		__loadedLibs[aLib.toLowerCase()] == false) {
		load(aLib);
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
function loadCompiledLib(aClass, forceReload, aFunction) {
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

/**
 * <odoc>
 * <key>sync(aFunction, anObject)</key>
 * Will ensure that aFunction is synchronized, in multi-threaded scripts. Optionally you can provide
 * anObject to synchronized upon.
 * </odoc>
 */
function sync(aFunction, anObj) {
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
	
	for (let i = 0; i < req.length; i++) {
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
function require(aScript, force) {
	var o, f, exports = {}, module = { id: aScript, uri: aScript, exports: exports };
	
	if (isUnDef(require.cache)) require.cache = {};

	if (!force && isFunction(require.cache[aScript])) {
		f = require.cache[aScript];
	} else {	
		if (aScript.match(/::/)) {
			var comps = aScript.match(/(.+)::(.+)/);
			plugin("ZIP");
			var zip = new ZIP();
			o = af.fromBytes2String(zip.streamGetFile(comps[1], comps[2]));
		} else {	
			o = io.readFileString(aScript);
		}
		
		var opackpaths = getOPackPaths();
		for(var opack in opackpaths) {
			o = io.readFileString(aScript);
		}
		
		f = new Function('require', 'exports', 'module', o);
		require.cache[aScript] = f;
	}

	f.call({}, require, exports, module);

	exports = module.exports || exports;
	
	return exports;
}

// OpenWrap
//

var OpenWrap;
if (isUnDef(OpenWrap))
	OpenWrap = function() {}

var ow;
if (isUnDef(ow))
	ow = new OpenWrap();

/**
 * <odoc>
 * <key>ow.loadDev()</key>
 * Loads OpenWrap dev functionality. Basically functions being tested.
 * </odoc>
 */
OpenWrap.prototype.loadDev = function() { loadCompiledLib("owrap_dev_js"); ow.dev = new OpenWrap.dev(); pods.declare("ow.dev", ow.dev); return ow.dev; }
/**
 * <odoc>
 * <key>ow.loadFormat()</key>
 * Loads OpenWrap format functionality. Basically functions to help with the formatting of strings, numbers, dates, etc...
 * </odoc>
 */
//OpenWrap.prototype.loadFormat = function() { loadLib(getOpenAFJar() + "::js/owrap.format.js"); ow.format = new OpenWrap.format(); pods.declare("ow.format", ow.format); return ow.format; }
OpenWrap.prototype.loadFormat = function() { loadCompiledLib("owrap_format_js"); ow.format = new OpenWrap.format(); pods.declare("ow.format", ow.format); return ow.format; }
/**
 * <odoc>
 * <key>ow.loadTest()</key>
 * Loads OpenWrap test functionality. Basically functions to unit test other functionality.
 * </odoc>
 */
//OpenWrap.prototype.loadTest = function() { loadLib(getOpenAFJar() + "::js/owrap.test.js"); ow.test = new OpenWrap.test(); pods.declare("ow.test", ow.test); return ow.test; }
OpenWrap.prototype.loadTest = function() { loadCompiledLib("owrap_test_js"); ow.test = new OpenWrap.test(); pods.declare("ow.test", ow.test); return ow.test; }
/**
 * <odoc>
 * <key>ow.loadAI()</key>
 * Loads OpenWrap AI functionality.
 * </odoc>
 */
//OpenWrap.prototype.loadAI = function() { loadLib(getOpenAFJar() + "::js/owrap.ai.js"); ow.ai = new OpenWrap.ai(); pods.declare("ow.ai", ow.ai); return ow.ai; }
OpenWrap.prototype.loadAI = function() { loadCompiledLib("owrap_ai_js"); ow.ai = new OpenWrap.ai(); pods.declare("ow.ai", ow.ai); return ow.ai; }
/**
 * <odoc>
 * <key>ow.loadServer()</key>
 * Loads OpenWrap Server functionality. Basically functions to wrap access to server functionality.
 * </odoc>
 */
//OpenWrap.prototype.loadServer = function() { loadLib(getOpenAFJar() + "::js/owrap.server.js"); ow.server = new OpenWrap.server(); pods.declare("ow.server", ow.server); return ow.server; }
OpenWrap.prototype.loadServer = function() { loadCompiledLib("owrap_server_js"); ow.server = new OpenWrap.server(); pods.declare("ow.server", ow.server); return ow.server; }
/**
 * <odoc>
 * <key>ow.loadTemplate()</key>
 * Loads OpenWrap template functionality. Basically functions to wrap access to Handlebars functionality.
 * </odoc>
 */
//OpenWrap.prototype.loadTemplate = function() { loadLib(getOpenAFJar() + "::js/owrap.template.js"); ow.template = new OpenWrap.template(); pods.declare("ow.template", ow.template); return ow.template; }
OpenWrap.prototype.loadTemplate = function() { loadCompiledLib("owrap_template_js"); ow.template = new OpenWrap.template(); pods.declare("ow.template", ow.template); return ow.template; }
/**
 * <odoc>
 * <key>ow.loadObj()</key>
 * Loads OpenWrap object functionality. 
 * </odoc>
 */
//OpenWrap.prototype.loadObj = function() { loadLib(getOpenAFJar() + "::js/owrap.obj.js"); ow.obj = new OpenWrap.obj(); pods.declare("ow.obj", ow.obj); return ow.obj; }
OpenWrap.prototype.loadObj = function() { loadCompiledLib("owrap_obj_js"); ow.obj = new OpenWrap.obj(); pods.declare("ow.obj", ow.obj); return ow.obj; }
/**
 * <odoc>
 * <key>ow.loadCh()</key>
 * Loads OpenWrap channels functionality. 
 * </odoc>
 */
//OpenWrap.prototype.loadCh = function() { loadLib(getOpenAFJar() + "::js/owrap.ch.js"); ow.ch = new OpenWrap.ch(); pods.declare("ow.ch", ow.ch); return ow.ch; }
OpenWrap.prototype.loadCh = function() { loadCompiledLib("owrap_ch_js"); ow.ch = new OpenWrap.ch(); pods.declare("ow.ch", ow.ch); return ow.ch; }
/**
 * <odoc>
 * <key>ow.loadOJob()</key>
 * Loads OpenWrap oJob functionality. 
 * </odoc>
 */
//OpenWrap.prototype.loadOJob = function() { loadLib(getOpenAFJar() + "::js/owrap.oJob.js"); ow.oJob = new OpenWrap.oJob(); pods.declare("ow.oJob", ow.oJob); return ow.oJob; }
OpenWrap.prototype.loadOJob = function() { loadCompiledLib("owrap_oJob_js"); ow.oJob = new OpenWrap.oJob(); pods.declare("ow.oJob", ow.oJob); return ow.oJob; }


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
function loadHandlebars() {
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
function loadUnderscore() {
	var res = loadCompiledLib("lodash_js");
	if (res) pods.declare("Underscore", loadUnderscore());
	if (res) pods.declare("Lodash", loadUnderscore());
}

/**
 * <odoc>
 * <key>loadFuse()</key>
 * Loads the FuseJS javascript library into scope.\
 * \
 * See more in: http://fusejs.io/
 * </odoc>
 */
function loadFuse() {
	var res = loadCompiledLib("fusejs_js");
	if (res) pods.declare("FuseJS", loadFuse());
}

/**
 * <odoc>
 * <key>loadDiff()</key>
 * Loads the JsDiff javascript library into scope (check https://github.com/kpdecker/jsdiff).
 * </odoc>
 */
function loadDiff() {
	var res = loadCompiledLib("diff_js");
	if (res) pods.declare("JsDiff", loadDiff());
}

/**
 * <odoc>
 * <key>loadLodash()</key>
 * Loads the loadash javascript library.\
 * \
 * See more in https://lodash.com/docs
 * </odoc>
 */
function loadLodash() {
	loadUnderscore();
}

/**
 * <odoc>
 * <key>loadHelp()</key>
 * Loads into scope the ODoc objects for documentation support.
 * </odoc>
 */
function loadHelp() {
	var res = loadCompiledLib("odoc_js");
	if (res) pods.declare("Help", loadHelp());
}

var __odocsurl;
if (isUnDef(__odocsurl)) __odocsurl = __odoc;
var __odocs;
var __offlineHelp;
if (isUnDef(__offlineHelp)) {
	if (noHomeComms)
		__offlineHelp = true;
	else
		__offlineHelp = false;
}


/**
 * <odoc>
 * <key>setOfflineHelp(aBoolean)</key>
 * Forces help (odoc) to be retrieved locally (if aBoolean is true) or reestablishes the normal behaviour
 * of retriving from online first (if aBoolean is false)
 * </odoc>
 */
function setOfflineHelp(aBoolean) {
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
function searchHelp(aTerm, aPath, aId) {
	loadHelp();
	
	if (isUnDef(aPath)) {
		var res;
		var paths = [ getOpenAFJar() ];
		try {
			paths = paths.concat(Object.keys(getOPackLocalDB()));
		} catch(e) {
		}
		for(let i in paths) {
			var path = paths[i];
			if (!(path.match(/\.(jar|db|zip)/))) path = path + "/";
			res = searchHelp(aTerm, path, aId);
			if (res.length > 0) return res;
		}
	}
	
	__odocs = new ODocs(aPath, undefined, __odocsurl, __offlineHelp);
	
	var keys = __odocs.search(aTerm, aId);
	if (keys.length == 1) {
		var contents = __odocs.get(keys[0].id, keys[0].key);
		return [ {
			"id": keys[0].id,
			"key": keys[0].key,
			"fullkey": contents.k,
			"text": contents.t
		} ];
	} else {
		keys = keys.sort(function(a, b) { return (a.key > b.key) ? 1 : -1; });
	}
	return keys;
}

/**
 * <odoc>
 * <key>saveHelp(aPath, aMapOfFiles)</key>
 * Given aMapOfFiles, or basically an array of JavaScript or Java source filenames, each file will 
 * be processed for ODoc XML tags and the corresponding ODoc database will be generated on the 
 * provided aPath suitable for offline use.
 * </odoc>
 */
function saveHelp(aPath, aMapOfFiles) {
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
function saveHelpWeb(aPath, aMapOfFiles) {
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
function createDBInMem(aName, dontClose, aLogin, aPass, inMemFileSystem, inMemCompressed, useNIO) {
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
 * <key>persistDBInMem(aDB, aFilename) : Array</key>
 * Tries to persist a in-memory database, aDB object, previously created by the function createDBInMem into a SQL aFilename.
 * This can later be used to load again using the loadDBInMem function.
 * </odoc>
 */
function persistDBInMem(aDB, aFilename) {
	return aDB.q("script to '" + aFilename + "'");
}

/**
 * <odoc>
 * <key>loadDBInMem(aDB, aFilename)</key>
 * Tries to load to a in-memory database, aDB object, previously created by the function createDBInMem from a SQL aFilename
 * probably created by the function persistDBInMem.
 * </odoc>
 */
function loadDBInMem(aDB, aFilename) {
	return aDB.u("runscript from '" + aFilename + "'");
}

/**
 * <odoc>
 * <key>traverse(aObject, aFunction) : Map</key>
 * Traverses aObject executing aFunction for every single element. The aFunction will receive the arguments: aKey, aValue, aPath, aObject.
 * </odoc>
 */
function traverse(aObject, aFunction, aParent) {
	var keys = (isJavaObject(aObject)) ? [] : Object.keys(aObject);
	var parent = isUnDef(aParent) ? "" : aParent;

	for(let i in keys) {
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
 * <key>searchKeys(aObject, aSearchKey, useCase) : Map</key>
 * Traverses aObject looking for key matches, ignoring case if useCase is true, of the regular expression aSearchKey.
 * Each element founf is added to the returned Map. The element key will represent the path from aObject to it.
 * </odoc>
 */
function searchKeys(aObject, aSearchKey, useCase) {
	var res = {};
	var usecase = useCase ? "" : "i";
	
	traverse(aObject, function(key, value, path) {
		if (key.match(new RegExp(aSearchKey, usecase))) {
			res[path + ((isNaN(Number(key))) ? "." + key : "[\"" + key + "\"]")] = (typeof value == 'object') ? clone(value) : value;
		}
	});
	return res;
}

/**
 * <odoc>
 * <key>searchValues(aObject, aSearchValue, useCase) : Map</key>
 * Traverse aObject looking for value matches, ignoring case if useCase is true, of the regular expression aSearchKey. 
 * Each value found is added to the returned Map linked to the path representation of where it was found.
 * </odoc>
 */
function searchValues(aObject, aSearchValue, useCase) {
	var res = {};
	var usecase = useCase ? "" : "i";
	
	traverse(aObject, function(key, value, path) {
		if ((value+"").match(new RegExp(aSearchValue, usecase))) {
			res[path + ((isNaN(Number(key))) ? "." + key : "[\"" + key + "\"]")] = (typeof value == 'object') ? clone(value) : value;
		}
	});
	return res;
}

/**
 * <odoc>
 * <key>searchArray(anArray, aPartialMap, useRegEx, ignoreCase, useParallel) : Array</key>
 * Shortcut to ow.obj.searchArray.
 * </odoc>
 */
function searchArray(anArray, aPartialMap, useRegEx, ignoreCase, useParallel) {
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
function flatten(aObject, noKeyValSeparation) {
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
 * <odoc>
 * <key>showDebugger(shouldRedirect)</key>
 * Starts the a graphical Rhino debugger instance, typically from the openaf-console. The stdin, stdout and stderr
 * can be redirected to the debugger by having shouldRedirect = true. The Rhino context will be shared between the
 * debugger and the original script that invoked it (for example: openaf-console).
 * </odoc>
 */
function showDebugger(shouldRedirect) {
	print("Trying to create a debugger instance...");
	af.showDebugger(shouldRedirect);
	print("Please use File|Run to select the script you wish to debug.");
}

/**
 * <odoc>
 * <key>checkLatestVersion() : String</key>
 * Tries to determine what is the latest available version for OpenAF. Compare it with getVersion() to determine
 * if you need an update.
 * </odoc>
 */
function checkLatestVersion() {	
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
 * <key>sh(commandArguments, aStdIn, aTimeout, shouldInheritIO, aDirectory, returnMap) : String</key>
 * Tries to execute commandArguments (either a String or an array of strings) in the operating system as a shortcut for 
 * AF.sh except that it will run them through the OS shell. Optionally aStdIn can be provided, aTimeout can be defined 
 * for the execution and if shouldInheritIO is true the stdout, stderr and stdin will be inherit from OpenAF. If 
 * shouldInheritIO is not defined or false it will return the stdout of the command execution. It's possible also to 
 * provide a different working aDirectory.
 * The variables __exitcode and __stderr can be checked for the command exit code and the stderr output correspondingly.
 * In alternative if returnMap = true a map will be returned with stdout, stderr and exitcode.
 * </odoc>
 */
function sh(commandArguments, aStdIn, aTimeout, shouldInheritIO, aDirectory, returnMap) {
	if (typeof commandArguments == "string") {
		if (java.lang.System.getProperty("os.name").match(/Windows/)) {
			return af.sh(["cmd", "/c", commandArguments], aStdIn, aTimeout, shouldInheritIO, aDirectory, returnMap);
		} else {
			return af.sh(["/bin/sh", "-c", commandArguments], aStdIn, aTimeout, shouldInheritIO, aDirectory, returnMap);
		}
	} else {
		return af.sh(commandArguments, aStdIn, aTimeout, shouldInheritIO, aDirectory, returnMap);
	}
}

/**
 * <odoc>
 * <key>findRandomOpenPort() : number</key>
 * Tries to find a random open port on all network interfaces. Useful to start network servers on an available port. 
 * </odoc>
 */
function findRandomOpenPort() {
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
function ioSetNIO(aFlag) {
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
function ioStreamWrite(aStream, aString, aBufferSize, useNIO) {
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
function ioStreamWriteBytes(aStream, aArrayBytes, aBufferSize, useNIO) {
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
function ioStreamRead(aStream, aFunction, aBufferSize, useNIO, encoding) {
	if (isUnDef(useNIO) && isDef(__ioNIO)) useNIO = __ioNIO;
	encoding = _$(encoding).isString().default("UTF-8");
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
 * <key>ioStreamReadLines(aStream, aFunctionPerLine, aSeparator, useNIO)</key>
 * Given aStream will read the entire buffer and call aFunctionPerLine(withALine) per each \n found.
 * Aditionally you can specify a different aSeparator for each line other than "\n". 
 * If aFunctionPerLine returns true the read operation stops.
 * </odoc>
 */
function ioStreamReadLines(aStream, aFunction, aSeparator, useNIO) {
	if (isUnDef(useNIO) && isDef(__ioNIO)) useNIO = __ioNIO;
	var buf = "";
	if (isUnDef(aSeparator)) aSeparator = "\n";

	ioStreamRead(aStream, function(buffer) {
		var res;
		buf += buffer;
		while (buf.indexOf(aSeparator) >= 0) {
			res = aFunction(buf.substring(0, buf.indexOf(aSeparator)));
			buf = buf.substring(buf.indexOf(aSeparator) + 1);
			if (res == true) return;
		}
		return res;
	}, void 0, useNIO);
	while (buf.indexOf(aSeparator) >= 0) {
		var res = aFunction(buf.substring(0, buf.indexOf(aSeparator)));
		buf = buf.substring(buf.indexOf(aSeparator) + 1);
		if (res == true) return;
	}
}

/**
 * <odoc>
 * <key>ioStreamCopy(aOutputStream, aInputStream)</key>
 * Copies the contents of a Java aInputStream to a Java aOutputStream. The two streams will 
 * be closed in the end.
 * </odoc>
 */
function ioStreamCopy(aOutputStream, aInputStream) {
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
function ioStreamReadBytes(aStream, aFunction, aBufferSize, useNIO) {
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
function toEncoding(aString, anEncoding) {
	if (isUnDef(anEncoding)) anEncoding = "UTF-8";
	return String(new java.lang.String(af.fromString2Bytes(aString), anEncoding));
}

/**
 * <odoc>
 * <key>utf8(aString) : String</key>
 * Converts the provided aString into UTF-8 encoding.
 * </odoc>
 */
function utf8(aString) {
	return toEncoding(aString, "UTF-8");
}

/**
 * <odoc>
 * <key>getFromZip(aZipFile, aResource, inBytes, anEncoding) : anArrayOfBytes</key>
 * Retrieves aResource, as anArrayOfBytes, from aZipFile. This resource can be inBytes = true or
 * not and anEncoding can be provided.
 * </odoc>
 */
function getFromZip(aZipFile, aResource, isBytes, encoding) {
	plugin("ZIP");

	if (isDef(aResource)) {
		var zip = new ZIP();
		zip.loadFile(aZipFile);
		var ab = zip.getFile(aResource);
		zip.close();
		if (isBytes)
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
function newJavaArray(aJavaClass, aSize) {
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
function threadBox(aFunction, aTimeout, aStopFunction) {
    if (isUnDef(aStopFunction)) aStopFunction = (aR) => { return aR; };

	var done = false;
	var exc = undefined;

	var t = __getThreadPool().submit(new java.lang.Runnable({		
    	run: () => {
	        try {
	            aFunction();
	        } catch(e) {
	            exc = e;
	            throw e;
	        } finally {
	            done = true;
	        }
	        
	        return done;
        }
    }));

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
    
    //if (!t.isDone() && !t.isCancelled()) {
    	t.cancel(true);
    //}

    if (isDef(exc)) throw exc;
}
 
/**
 * <odoc>
 * <key>threadBoxCtrlC() : Boolean</key>
 * Meant to be use as a stopFunction for threadBox will return true if
 * Ctrl-C is detected and false otherwise. If the current terminal can't
 * support ANSI if will default to false.
 * </odoc>
 */
function threadBoxCtrlC() {
	if (isUnDef(__conStatus)) __initializeCon();
	var console = __con;
    if (__conAnsi) {
        if (console.readCharNB() == 3) return true; else return false;
    } else {
        return false;
    }
}

var alert;
if (isUnDef(alert)) alert = function(msg) {
	printErr(String(msg));
};

__timeout = {};
function setTimeout(aFunction, aPeriod) {
	sleep(aPeriod);
	var args = [];
	for(let i = 2; i <= arguments.length; i++) { args.push(arguments[i]); }
	aFunction.apply(this, args);
}

function setInterval(aFunction, aPeriod) {
	plugin("Threads");
	var t = new Threads();

	var args = [];
	for(let i = 2; i <= arguments.length; i++) { args.push(arguments[i]); }
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

function clearInterval(uuid) {
	var t = __timeout[uuid];
	t.stop();
	delete __timeout[uuid];
}

/**
 * <odoc>
 * <key>deleteFromArray(anArray, anIndex) : Array</key>
 * Deletes the array element at anIndex from the provided anArray. Returns the new array with the element removed.
 * </odoc>
 */
function deleteFromArray(anArray, anIndex) {
	anArray.splice(anIndex, 1);
	return anArray;
}

/**
 * <odoc>
 * <key>oJobRunFile(aFile, args, aId)</key>
 * Runs a oJob aFile with the provided args (arguments).
 * Optionally you can provide aId to segment these specific jobs.
 * </odoc>
 */
function oJobRunFile(aYAMLFile, args, aId) {
	ow.loadOJob().runFile(aYAMLFile, args, aId);
}

/**
 * <odoc>
 * <key>oJobRun(aJson, args, aId)</key>
 * Runs a oJob from aJson definition with the provided args (arguments).
 * Optionally you can provide aId to segment these specific jobs.
 * </odoc>
 */
function oJobRun(aJson, args, aId) {
	var s = ow.loadOJob().loadJSON(aJson);
	ow.oJob.load(s.jobs, s.todo, s.ojob, args, aId);
	ow.oJob.start(args, true, aId);
}

/**
 * <odoc>
 * <key>oJobRunJob(aJob, args, aId) : boolean</key>
 * Shortcut for ow.oJob.runJob. Please see help for ow.oJob.runJob.
 * Optionally you can provide aId to segment this specific job. If aJob is a string it will try to retrieve the job
 * from the jobs channel. Returns true if the job executed or false otherwise (e.g. failed deps).
 * </odoc>
 */
function oJobRunJob(aJob, args, aId) {
	ow.loadOJob();
	if (isString(aJob)) {
		if (isUnDef(aId)) aId = "";
		var job = ow.oJob.getJobsCh().get({ name: aJob });
		if (isDef(job)) {
			return ow.oJob.runJob(job, args, aId);
		} else {
			throw "Job '" + aJob + "' not found.";
		}
	} else {
		return ow.oJob.runJob(aJob, args, aId);
	}
}

/**
 * <odoc>
 * <key>oJobRunJobAsync(aJob, args, aId) : oPromise</key>
 * Creates an oPromise to run the same arguments for oJobRunJob thus executing the job async. Returns
 * the generate oPromise.
 * </odoc>
 */
function oJobRunJobAsync(aJob, args, aId) {
	return $do(() => {
		return oJobRunJob(aJob, args, aId);
	});
}

/**
 * <odoc>
 * <key>getEnvVar(anEnvironmentVariable) : String</key>
 * Returns the current value of the operating system anEnvironmentVariable.
 * </odoc>
 */
function getEnv(anEnvironmentVariable) {
	return java.lang.System.getenv().get(anEnvironmentVariable); 
}

/**
 * <odoc>
 * <key>getEnvVars() : Map</key>
 * Returns a map of key and values with the operating system environment variables.
 * </odoc>
 */
function getEnvs() {
	return af.fromJavaMap(java.lang.System.getenv());
}

/**
 * <odoc>
 * <key>loadJSYAML()</key>
 * Loads the JS-YAML library.
 * </odoc>
 */
function loadJSYAML() {
	loadCompiledLib("js-yaml_js");
}

loadCompiledLib("openafsigil_js");

var __correctYAML = true;

/**
 * <odoc>
 * <key>AF.toYAML(aJson) : String</key>
 * Tries to dump aJson into a YAML string.
 * </odoc>
 */
AF.prototype.toYAML = function(aJson) { loadJSYAML(); return jsyaml.dump(aJson); }
/**
 * <odoc>
 * <key>AF.fromYAML(aYaml) : Object</key>
 * Tries to parse aYaml into a javascript map.
 * </odoc>
 */
AF.prototype.fromYAML = function(aYAML) { loadJSYAML(); if (__correctYAML) aYAML = aYAML.replace(/^(\t+)/mg, (m) => { if (isDef(m)) return repeat(m.length, "  "); }); return jsyaml.load(aYAML); };
/**
 * <odoc>
 * <key>AF.encryptText()</key>
 * Interactevly asks to enter a text and then uses af.encrypt to print to stdout the result.
 * </odoc>
 */
AF.prototype.encryptText = function() { plugin("Console"); print("Encrypted text: " + af.encrypt((new Console()).readLinePrompt("Enter text: ", "*"))); };
/**
 * <odoc>
 * <key>IO.readFileYAML(aYAMLFile) : Object</key>
 * Tries to read aYAMLFile into a javascript object. 
 * </odoc>
 */
IO.prototype.readFileYAML = function(aYAMLFile) { return af.fromYAML(io.readFileString(aYAMLFile)); }
/**
 * <odoc>
 * <key>IO.writeFileYAML(aYAMLFile, aObj)</key>
 * Tries to write a javascript aObj into a aYAMLFile.
 * </odoc>
 */
IO.prototype.writeFileYAML = function(aYAMLFile, aObj) { return io.writeFileString(aYAMLFile, af.toYAML(aObj)); };

/**
 * <odoc>
 * <key>IO.writeLineNDJSON(aNDJSONFile, aObj, aEncode)</key>
 * Writes aObj into a single line on aNDJSONFile (newline delimited JSON). Optionally you can provide
 * an encoding.
 * </odoc>
 */
IO.prototype.writeLineNDJSON = function(aNDJSONFile, aObj, aEncode) {
	io.writeFileString(aNDJSONFile, stringify(aObj, void 0, "")+"\n", aEncode, true);
};

/**
 * <odoc>
 * <key>IO.readLinesNDJSON(aNDJSONFile, aFuncCallback, aErrorCallback)</key>
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
 * <key>IO.isBinaryFile(aFile, confirmLimit) : boolean</key>
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
 * - get(aKey)\
 * - getSet(aMatch, aKey, aValue, aForcedTimestamp)\
 * - unset(aKey, aForcedTimestamp)\
 * - push(aKey, aValue)\
 * - pop(aKey)\
 * - shift(aKey)\
 * - stopJobs()\
 * - waitForJobs(aTimeout)\
 * \
 * Channel basic persistence:\
 * \
 * - storeAdd(aFilename, anArrayOfKeys, shouldCompress, runSubscribersForAll)\
 * - storeRestore(aFilename, anArrayOfKeys)\
 * \
 * Inter-channel HTTP REST:\
 * \
 * - expose(aLocalPortOrServer, aPath, aLogin, aPassword)\
 * - peer(aLocalPortOrServer, aPath, aRemoteURL, aAuthFunc, aUnAuthFunc)\
 * - createRemote(aURL, aTimeout, aLogin, aPass)
 * </odoc>
 */
$channels = function(a) {
	ow.loadCh();
	
	return {
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
		peer         : function(aLocalPortOrServer, aPath, aRemoteURL, aAuthFunc, aUnAuthFunc) { return ow.ch.server.peer(a, aLocalPortOrServer, aPath, aRemoteURL, aAuthFunc, aUnAuthFunc); },
		
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
 * - createRemote(aURL, aTimeout)
 * </odoc>
 */
$ch = $channels;

var __threadPool;
var __threadPoolFactor = 1;

function __resetThreadPool(poolFactor) {
	__threadPoolFactor = poolFactor;
	__threadPool = void 0;
	__getThreadPool();
}

function __getThreadPool() {
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
var oPromise = function(aFunction, aRejFunction) {
	this.states = {
		NEW: 0, FULFILLED: 1, PREFAILED: 2, FAILED: 3
	};

	this.state = this.states.NEW;
	this.executing = false;
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
	if (this.state != this.states.NEW || this.executing == true) throw "oPromise is already executing.";

	var parent = this;

	this.then((res, rej) => {
		var shouldStop = false;
		var values = [];
		
		try {
			while(!shouldStop) {
				for(var iii in anArray) {
					if (anArray[iii] != null) {
						if (anArray[iii] instanceof oPromise) {
							if (!anArray[iii].executing) {
								switch(anArray[iii].state) {
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
	if (this.state != this.states.NEW || this.executing == true) throw "oPromise is already executing.";
	
	var parent = this;

	this.then((res, rej) => {
		var shouldStop = false;
		var c = 0;
		
		try {
			while(!shouldStop) {
				for(let i in anArray) {
					if (anArray[i] != null) {
						if (anArray[i] instanceof oPromise) {
							if (!anArray[i].executing) {
								switch(anArray[i].state) {
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
	this.state = this.states.PREFAILED;

	return this;
};

oPromise.prototype.resolve = function(aValue) {
	if (this.state == this.states.FULFILLED) this.state = this.states.NEW;
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
					var ignore = false;
					sync(() => { if (thisOP.executing) ignore = true; else thisOP.executing = true; }, thisOP.executing);
					if (ignore) return;

					while (thisOP.executors.size() > 0) {
						var f = thisOP.executors.poll();
						// Exec
						if (thisOP.state != thisOP.states.PREFAILED && thisOP.state != thisOP.states.FAILED && f != null && isDef(f) && f.type == "exec" && isDef(f.func) && isFunction(f.func)) {
							var res, done = false;
							try {
								var checkResult = true;
								if (isDef(thisOP.value)) {
									res = f.func(thisOP.value);
								} else {
									res = f.func(function (v) { checkResult = false; thisOP.resolve(v); },
												function (r) { checkResult = false; thisOP.reject(r); });
								}

								if (checkResult &&
									(isJavaObject(res) || isDef(res)) &&
									res != null &&
									(thisOP.state == thisOP.states.NEW || thisOP.state == thisOP.states.FULFILLED)) {
									res = thisOP.resolve(res);
								}
							} catch (e) {
								thisOP.reject(e);
							}
						}
						// Reject
						if (thisOP.state == thisOP.states.PREFAILED || thisOP.state == thisOP.states.FAILED) {
							while (f != null && isDef(f) && f.type != "reject" && isDef(f.func) && isFunction(f.func)) {
								f = thisOP.executors.poll();
							}

							if (f != null && isDef(f) && isDef(f.func) && isFunction(f.func)) {
								try {
									f.func(thisOP.reason);
									thisOP.state = thisOP.states.FULFILLED;
								} catch (e) {
									thisOP.state = thisOP.states.FAILED;
									throw e;
								}
							} else {
								if (isUnDef(f) || f == null) thisOP.state = thisOP.states.FAILED;
							}
						}
					}

					sync(() => { thisOP.executing = false; }, thisOP.executing);

					if (thisOP.state == thisOP.states.NEW && thisOP.executors.isEmpty()) {
						thisOP.state = thisOP.states.FULFILLED;
					}

					if (thisOP.state == thisOP.states.PREFAILED && thisOP.executors.isEmpty()) {
						thisOP.state = thisOP.states.FAILED;
					}
				}
			}));
		} catch(e) {
			if (!String(e).match(/RejectedExecutionException/)) throw e;
		}
		// Try again if null
	} while(isUnDef(this.__f) || this.__f == null);

};

var javaRegExp = (text) => {
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
var $do = function(aFunction, aRejFunction) {
    return new oPromise(aFunction, aRejFunction);
};

/**
 * <odoc>
 * <key>$doAll(anArray) : oPromise</key>
 * Returns an oPromise that will be resolved when all oPromise part of the anArray are fullfiled. If any of the oPromises
 * fails/rejects the returned oPromise will also be rejected/fail.
 * </odoc>
 */
var $doAll = function(anArray) {
    return new oPromise().all(anArray);
};

/**
 * <odoc>
 * <key>$doFirst(anArray) : oPromise</key>
 * Returns an oPromise that will be resolved when any oPromise part of the anArray is fullfiled. If any of the oPromises
 * fails/rejects the returned oPromise will also be rejected/fail.
 * </odoc>
 */
var $doFirst = function(anArray) {
    return new oPromise().race(anArray);
};

/**
 * <odoc>
 * <key>$doWait(aPromise, aWaitTimeout) : oPromise</key>
 * Blocks until aPromise is fullfilled or rejected. Optionally you can specify aWaitTimeout between checks.
 * Returns aPromise.
 * </odoc>
 */
var $doWait = function(aPromise, aWaitTimeout) {
	if (isDef(aWaitTimeout)) {
		var init = now();
		while(aPromise.state != aPromise.states.FULFILLED && 
			  aPromise.state != aPromise.states.FAILED &&
			  (isUnDef(aPromise.__f) || aPromise.executing || !aPromise.executors.isEmpty()) &&
		      ((now() - init) < aWaitTimeout)) {
			if (isDef(aPromise.__f)) aPromise.__f.get(); else sleep(25);
		}
		while(aPromise.executing && ((now() - init) < aWaitTimeout) && !aPromise.executors.isEmpty()) {
			if (isDef(aPromise.__f)) aPromise.__f.get(); else sleep(25);
		}
	} else {
		while(aPromise.state != aPromise.states.FULFILLED && 
			  aPromise.state != aPromise.states.FAILED &&
			  (isUnDef(aPromise.__f) || aPromise.executing || !aPromise.executors.isEmpty())) {
			if (isDef(aPromise.__f)) aPromise.__f.get(); else sleep(25);
		}
		while(aPromise.executing && !aPromise.executors.isEmpty()) {
			if (isDef(aPromise.__f)) aPromise.__f.get(); else sleep(25);
		}
	}

	return aPromise;
}

var __OpenAFUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)";
function __setUserAgent(aNewAgent) {
	__OpenAFUserAgent = _$(aNewAgent).isString().default(__OpenAFUserAgent);
	java.lang.System.setProperty("http.agent", __OpenAFUserAgent);
}

// Startup
// -------

//$do(() => { __initializeCon(); });
//__initializeCon();

// Set logging to ERROR 
{
	// Issue 34
	if (java.lang.System.getProperty("java.util.logging.config.file") == null) {
		java.lang.System.setProperty("java.util.logging.config.file", "");
	}

	if (__noSLF4JErrorOnly) {
		try {
			let i = Packages.org.slf4j.LoggerFactory.getLogger(Packages.ch.qos.logback.classic.Logger.ROOT_LOGGER_NAME).getLoggerContext().getLoggerList().iterator();
			while (i.hasNext()) {
				Packages.org.slf4j.LoggerFactory.getLogger(i.next().getName()).setLevel(Packages.ch.qos.logback.classic.Level.ERROR);
			}
		} catch (e) {}
	}
};

// Set user agent
{
	__setUserAgent();
}

// ---------------
// Profile support

var OPENAFPROFILE;
if (isUnDef(OPENAFPROFILE)) OPENAFPROFILE = ".openaf_profile";

(function() {
	var prof = "";
	try {
		prof = io.readFileString(java.lang.System.getProperty("user.home") + "/" + OPENAFPROFILE);
		af.compile(prof);
	} catch(e) {
		if (!e.message.match(/java\.io\.FileNotFoundException/)) throw e;
	}
	
	prof ="";
	try {
		prof = io.readFileString(getOpenAFJar() + "::" + OPENAFPROFILE);
		af.compile(prof);
	} catch(e) {
		if (!e.message.match(/java\.io\.FileNotFoundException/) &&
		    !e.message.match(/java\.lang\.NullPointerException: entry/)) throw e;
	}
})();
