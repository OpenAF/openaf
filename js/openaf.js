//OPENAF common functions

//Author: nmaguiar@gmail.com

var self = this;
var global = self;

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
	if (isDefined(__forcedOpenAFJar)) 
		res = __forcedOpenAFJar;
	else
		res = String(af.getOpenAFJar()).replace(/\\/g, "/");
	
	return res;
}

var noHomeComms = false;
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
 * "Stringifies" and prints the aStr to the stdout (with a new line on the end) (example: print("hello world!"))
 * </odoc>
 */
function sprint(str, delim) { delim = (isUndefined(delim) ? "  " : delim); return print(stringify(str, undefined, delim)); }
/**
 * <odoc>
 * <key>bprint(aStr)</key>
 * "Beautifies" and prints the aStr to the stdout (with a new line on the end) (example: print("hello world!"))
 * </odoc>
 */
function bprint(str) { return print(beautifier(str)); }

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
 * "Stringifies" and prints the aStr to the stdout (without adding a new line on the end) (example: printnl("hello world!"))
 * </odoc>
 */
function sprintnl(str, delim) { delim = (isUndefined(delim) ? "  " : delim); return printnl(stringify(str, undefined, delim)); }
/**
 * <odoc>
 * <key>bprintnl(aStr)</key>
 * "Beautifies" and prints the aStr to the stdout (without adding a new line on the end) (example: printnl("hello world!"))
 * </odoc>
 */
function bprintnl(str) { return printnl(beautifier(str)); }

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
	someData = (isUndefined(someData)) ? this : someData;
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
 * "Stringifies" and prints the aStr to the stderr (with a new line on the end) (example: printErr("Hupps!! A problem!"))
 * </odoc>
 */
function sprintErr(str, delim) { delim = (isUndefined(delim) ? "  " : delim); return printErr(stringify(str, undefined, delim)); }
/**
 * <odoc>
 * <key>bprintErr(aStr)</key>
 * "Beautifies" and prints the aStr to the stderr (with a new line on the end) (example: printErr("Hupps!! A problem!"))
 * </odoc>
 */
function bprintErr(str) { return printErr(beautifier(str)); }

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
 * "Stringifies" and prints the aStr to the stderr (without adding a new line on the end) (example: printErrnl("Hupps!! A problem!"))
 * </odoc>
 */
function sprintErrnl(str, delim) { delim = (isUndefined(delim) ? "  " : delim); return printErrnl(stringify(str, undefined, delim)); }

/**
 * <odoc>
 * <key>bprintErrnl(aStr)</key>
 * "Beautifies" and prints the aStr to the stderr (without adding a new line on the end) (example: printErrnl("Hupps!! A problem!"))
 * </odoc>
 */
function bprintErrnl(str) { return printErrnl(beautifier(str)); }

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
	someData = (isUndefined(someData)) ? this : someData;
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
 * <key>printTable(anArrayOfEntries, aWidthLimit, displayCount, useAnsi) : String</key>
 * Returns a ASCII table representation of anArrayOfEntries where each entry is a Map with the same keys.
 * Optionally you can specify aWidthLimit and useAnsi.
 * If you want to include a count of rows just use displayCount = true.
 * </odoc>
 */
function printTable(anArrayOfEntries, aWidthLimit, displayCount, useAnsi) {
	var count = 0;
	var maxsize = {};
	var output = "";

	if (!Array.isArray(anArrayOfEntries)) return "";
	if (isUndefined(aWidthLimit)) aWidthLimit = -1;
	
	// Find sizes
	anArrayOfEntries.forEach(function(row) {
		var cols = Object.keys(row);
		cols.forEach(function(col) {
			if (isUndefined(maxsize[col])) 
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
			output += (useAnsi ? ansiColor("bold", "|") : "|"); lineSize = 1; outOfWidth = false;
			cols.forEach(function(col) {
				if (outOfWidth) return;
				lineSize += maxsize[String(col)] + 1;
				if (aWidthLimit > 0 && lineSize > (aWidthLimit+3)) {
					output += (useAnsi ? ansiColor("bold", "...") : "..."); outOfWidth = true;
				} else {
					output += (useAnsi ? ansiColor("bold", String(col)) : String(col)) + repeat(maxsize[String(col)] - String(col).length, ' ') + (useAnsi ? ansiColor("bold", "|") : "|");
				}
			});
			output += "\n";
			output += (useAnsi ? ansiColor("bold", "+") : "+"); lineSize = 1; outOfWidth = false;
			cols.forEach(function(col) {
				if (outOfWidth) return;
				lineSize += maxsize[String(col)] + 1;
				if (aWidthLimit > 0 && lineSize > (aWidthLimit+3)) {
					output += (useAnsi ? ansiColor("bold", "...") : "...");outOfWidth = true;
				} else
					output += (useAnsi ? ansiColor("bold", repeat(maxsize[String(col)], '-')) : repeat(maxsize[String(col)], '-')) + (useAnsi ? ansiColor("bold", "+") : "+");
			});
			output += "\n";
		};

		output += (useAnsi ? ansiColor("bold", "|") : "|"); lineSize = 1; outOfWidth = false;
		cols.forEach(function(col) {
			if (outOfWidth) return;
			lineSize += maxsize[String(col)] + 1;
			if (aWidthLimit > 0 && lineSize > (aWidthLimit+3)) {
				output += "..."; outOfWidth = true;
			} else			
				output += String(row[String(col)]) + repeat(maxsize[String(col)] - String(row[String(col)]).length, ' ') + (useAnsi ? ansiColor("bold", "|") : "|");
		});
		output += "\n";
		count++;
	});

	if (displayCount) {
		var summary = "[#" + count + " " + ((count <= 1) ? "row" : "rows") + "]";
		output += (useAnsi ? ansiColor("bold", summary) : summary);
	}
	
	return output;
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
	plugin("Console"); 
	var con = (new Console()).getConsoleReader();
	var ansis = force || (con.getTerminal().isAnsiSupported() && (java.lang.System.console() != null));
	var jansi = JavaImporter(Packages.org.fusesource.jansi);
	var res = "";
	
	if (ansis) {
		var res = Packages.org.fusesource.jansi.AnsiRenderer.render("@|" + aAnsi.toUpperCase() + " " + aString + "|@")
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
	plugin("Console"); 
	var con = (new Console()).getConsoleReader();
	var ansis = force || (con.getTerminal().isAnsiSupported() && (java.lang.System.console() != null));
	var jansi = JavaImporter(Packages.org.fusesource.jansi);
	if (ansis) jansi.AnsiConsole.systemInstall();
}

/**
 * <odoc>
 * <key>ansiStop(force)</key>
 * Disables the output of ansi codes if the current terminal is capable off (unless force = true). Use with ansiColor() and ansiStart().
 * </odoc>
 */
function ansiStop(force) {
	plugin("Console"); 
	var con = (new Console()).getConsoleReader();
	var ansis = force || (con.getTerminal().isAnsiSupported() && (java.lang.System.console() != null));
	var jansi = JavaImporter(Packages.org.fusesource.jansi);
	if (ansis) jansi.AnsiConsole.systemUninstall();
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
	if (isUndefined(space)) space = "  ";
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
 * <key>jsonParse(aString) : Map</key>
 * Shorcut for the native JSON.parse that returns an empty map if aString is not defined, empty or unparsable.
 * </odoc>
 */
function jsonParse(astring) {
	if (isDefined(astring) && String(astring).length > 0) {
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
	someData = (isUndefined(someData)) ? this : someData;
	return ow.loadTemplate().parse(aTemplateString, someData);
}

/**
 * <odoc>
 * <key>sleep(millis)</key>
 * Shortcut for af.sleep function. Will pause execution for a given period of time expressed in milliseconds.
 * </odoc>
 */
function sleep(millis) {
	af.sleep(millis);
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
if (isUndefined(__logStatus)) __logStatus = false;

/**
 * <odoc>
 * <key>startLog(externalLogging)</key>
 * Starts collecting log messages logged with log* functions. See stopLog() and dumpLog().
 * You can also specify externalLogging, a custom channel subscribe function. 
 * </odoc>
 */
function startLog(externalLogging) {
	$ch("__log").create();
	__logStatus = true;
	if (isDef(externalLogging) && isFunction(externalLogging)) {
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
	$ch("__log").destroy();
}

/**
 * <odoc>
 * <key>log(msg)</key>
 * Outputs to the current stdout a line composed of the current date, indication of INFO and the provided msg.
 * Note: you can use startLog, stopLog and dumpLog to keep an internal record of theses messages.
 * </odoc>
 */
function log(msg) {
	var data = new Date();
	if (__logStatus) 
		$ch("__log").set({
			"d": data,
			"t": "INFO"
		}, {
			"d": data,
			"t": "INFO",
			"m": msg
		});
	print("" + data + " | INFO | " + msg);
}

/**
 * <odoc>
 * <key>tlog(msg, someData)</key>
 * Outputs to the current stdout a line composed of the current date, indication of INFO and the provided msg using the templify function.
 * Optionally you can provide also someData. 
 * Note: you can use startLog, stopLog and dumpLog to keep an internal record of theses messages.
 * </odoc>
 */
function tlog(msg, someData) {
	log(templify(msg, someData));
}

/**
 * <odoc>
 * <key>lognl(msg)</key>
 * Outputs to the current stdout, without a new line, a sentence composed of the current date, indication of INFO and the provided msg.
 * Note: you can use startLog, stopLog and dumpLog to keep an internal record of theses messages.
 * </odoc>
 */
function lognl(msg) {
	var data = new Date();
	if (__logStatus) 
		$ch("__log").set({
			"d": data,
			"t": "INFO"
		}, {
			"d": data,
			"t": "INFO",
			"m": msg
		});
	printnl(data + " | INFO | " + msg + "\r");
}

/**
 * <odoc>
 * <key>tlognl(msg, someData)</key>
 * Outputs to the current stdout, without a new line, a sentence composed of the current date, indication of INFO and the provided msg using the templify function.
 * Optinionally you can provide also someData.
 * </odoc>
 */
function tlognl(msg, someData) {
	lognl(templify(msg, someData));
}

/**
 * <odoc>
 * <key>logErr(msg)</key>
 * Outputs to the current stderr a line composed of the current date, indication of ERROR and the provided msg.
 * Note: you can use startLog, stopLog and dumpLog to keep an internal record of theses messages.
 * </odoc>
 */
function logErr(msg) {
	var data = new Date();
	if (__logStatus) 
		$ch("__log").set({
			"d": data,
			"t": "ERROR"
		}, {
			"d": data,
			"t": "ERROR",
			"m": msg
		});
	ansiStart();
	printErr("" + data + " | " + ansiColor("red", "ERROR") + " | " + msg);
	ansiStop();
}

/**
 * <odoc>
 * <key>logWarn(msg)</key>
 * Outputs to the current warning in a line composed of the current date, indication of WARN and the provided msg.
 * Note: you can use startLog, stopLog and dumpLog to keep an internal record of theses messages.
 * </odoc>
 */
function logWarn(msg) {
	var data = new Date();
	if (__logStatus) 
		$ch("__log").set({
			"d": data,
			"t": "WARN"
		}, {
			"d": data,
			"t": "WARN",
			"m": msg
		});
	ansiStart();
	print("" + data + " | " + ansiColor("yellow", "WARN") + " | " + msg);
	ansiStop();
}

/**
 * <odoc>
 * <key>tlogErr(msg, someData)</key>
 * Outputs to the current stderr a line composed of the current date, indication of ERROR and the provided msg using the templify function.
 * Optinionally you can provide also someData.
 * </odoc>
 */
function tlogErr(msg, someData) {
	logErr(templify(msg, someData));
}

/**
 * <odoc>
 * <key>tlogWarn(msg, someData)</key>
 * Outputs to the current warning in a line composed of the current date, indication of WARN and the provided msg using the templify function.
 * Optinionally you can provide also someData.
 * </odoc>
 */
function tlogWarn(msg, someData) {
	logWarn(templify(msg, someData));
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
 * <key>splitBySeparator(aString, aSeparator) : Array</key>
 * Will split aString using the provided aSeparator. If the aSeparator is escaped (for example if ';' is the aSeparator and 
 * aString 'abc\\;def;123" only the second ';' will be considered.
 * </odoc>
 */
function splitBySeparator(aString, aSep) {
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
	if (isUndefined(aSep)) aSep = ";";
	//var args = __expr.replace(new RegExp(aSep, "g"), "\\" + aSep).replace(new RegExp("\\\\\\\\(?=" + aSep + ")", "g") , "").split("\\" + aSep + "");
	var args = splitBySeparator(__expr, aSep);
	var pairs = {};

	for(argIdx in args) {
		var arg = args[argIdx];

		var pair = splitBySeparator(arg, "=");
		if (!ignoreCase)
			pairs[pair[0]] = (isUndefined(pair[1]) ? "" : pair[1]);
		else
			pairs[pair[0].toLowerCase()] = (isUndefined(pair[1]) ? "" : pair[1]);
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

	try {
		plugin("ZIP");
		var zip = new ZIP(io.readFileBytes(fileDB));
		packages = af.fromJson(af.fromBytes2String(zip.getFile(PACKAGESJSON)));
		zip.close();
		
		for(var pack in packages) {
			if (packages[pack].name == "OpenAF") packages[pack].version = getVersion();
		}
	} catch(e) {
	}

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
		af.load(aScript);
		return aScript;
	} catch(e0) {
		if (e0.message.match(/FileNotFoundException/)) {
			error = e0;
			try {
				af.load(aScript + ".js")
			} catch(e) {
				if (e0.message.match(/FileNotFoundException/)) {
					error = e0;
					var paths = getOPackPaths();
					paths["__default"] = java.lang.System.getProperty("java.class.path") + "::js";
			
					for(i in paths) {
						try {
							paths[i] = paths[i].replace(/\\+/g, "/");
							paths[i] = paths[i].replace(/\/+/g, "/");
							af.load(paths[i] + "/" + aScript);
							return aScript;
						} catch(e) {
							error = e;
						}
					}
			
					if (typeof __loadedfrom !== 'undefined') {
						af.load(__loadedfrom.replace(/[^\/]+$/, "") + aScript);
						return aScript;
					}
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
 * the java package "wedo.openaf.plugins" (e.g. af.plugin("wedo.openaf.plugins.HTTP") is the same
 * as plugin("HTTP")).
 * </odoc>
 */
function plugin(aPlugin) {
	try {
		if (!aPlugin.match(/\./)) {
			af.plugin("wedo.openaf.plugins." + aPlugin);
			return;
		}
	} catch(e) {
	}
	af.plugin(aPlugin);
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
 * (see also isUndefined). Shortcut for the isDefined function.
 * </odoc>
 */
function isDef(aObject)   { return (!(typeof aObject == 'undefined')) ? true : false; }
/**
 * <odoc>
 * <key>isUnDef(aObject) : boolean</key>
 * Returns true if the provided aObject is undefined as a javascript variable. It will return false otherwise.
 * (see also isDefined). Shortcut for the isUndefined function.
 * </odoc>
 */
function isUnDef(aObject) { return (typeof aObject == 'undefined') ? true : false; }

/**
 * <odoc>
 * <key>listFilesRecursive(aPath) : Map</key>
 * Performs the io.listFiles function recursively given aPath. The returned map will be equivalent to
 * the io.listFiles function (see more in io.listFiles). 
 * </odoc>
 */
function listFilesRecursive(aPath) {
	if (isUndefined(aPath)) return [];

	var files = io.listFiles(aPath);
	if(isUndefined(files)) return [];
	var ret = [];
	files = files.files;
	if (isUndefined(files)) return [];
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
	plugin("Console");
	var jansi = JavaImporter(Packages.org.fusesource.jansi);

	con = new Console();

	if(con.getConsoleReader().getTerminal().isAnsiSupported()) {
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
	plugin("Console");
	var con = new Console();
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

	if (isUndefined(aCompareFunction)) {
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
	if(isUndefined(exitCode)) exitCode = 0;

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
		for(var i in aObjectB) { aObjectB[i] = merge(aObjectB[i], clone(aObjectA)); }
		return aObjectB;
	}
	if (isObject(aObjectB) && isArray(aObjectA)) {
		for(var i in aObjectA) { aObjectA[i] = merge(aObjectA[i], clone(aObjectB)); }
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
	var currentJar;
	try {
		currentJar = new java.io.File(af.getClass("wedo.openaf.AFCmd").getProtectionDomain().getCodeSource().getLocation().toURI());
	} catch(e) {
		currentJar = new java.io.File(java.lang.System.getProperties().getProperty("java.class.path"));
	}
	
	/* is it a jar file? */
	if(!currentJar.getName().endsWith(".jar"))
		return;

	/* Build command: java -jar application.jar */
	var command = new java.util.ArrayList();
	command.add(javaBin);
	if (isDef(preLineArray)) {
		for(let c in preLineArray) {
			command.add(preLineArray[c]);
		}
	}
	command.add("-jar");
	command.add(currentJar.getPath());
	if (isUndefined(aCommandLineArray)) {
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
	loadLib(getOpenAFJar() + "::js/jlinq.js");

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
	loadLib(getOpenAFJar() + "::js/stream.js");
	
	if (isUndefined(a)) return Stream;
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
 * <key>addOnOpenAFShutdown(aFunction)</key>
 * Adds aFunction to try to execute whenever OpenAF is going to shutdown. The latest hook added will be the first to be
 * executed until the first hook added (actually a shortcut for Threads.addOpenAFShutdownHook).
 * </odoc>
 */
function addOnOpenAFShutdown(aFunction) {
	plugin("Threads");
	(new Threads()).addOpenAFShutdownHook(aFunction);
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
		if (af.rm(aFilename)) {
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
    if (isUndefined(numberOfParts)) numberOfParts = getNumberOfCores();
    
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
function parallel(aFunction, numThreads, aAggFunction, threads) {
	plugin("Threads");

	var __threads = new Threads();
	if (isUndefined(__cpucores)) __cpucores = __threads.getNumberOfCores();
	if (isUndefined(numThreads)) {
		numThreads = __cpucores + 1;
		balance = true;
	}

	if (isDefined(threads)) {
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
	for(var i = 0; i < numThreads; i++) {
		var uuid = __threads.addThread(function(uuid) {
			results.push(aFunction(uuid, __threads));
			if (balance) __balance();
		});
		if (isDefined(threads)) {
			threads.uuids.push(uuid);
		}
	}

	__threads.start();
	__threads.stop();

	// Aggregate results
	if(isUndefined(aAggFunction))
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

	if (isUndefined(anArray) || isUndefined(aReduceFunction)) {
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
	if (isUndefined(__cpucores)) __cpucores = __threads.getNumberOfCores();
	if (isUndefined(numThreads)) {
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
	
	if (isDefined(threads)) {
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
		
		if (isDefined(threads)) {
			threads.uuids.push(uuid); 
			threads.uuidsArrayLength[uuid] = myMap[x].length;
		}
	}

	__threads.start();
	__threads.stop();

	// Aggregate results
	if(isUndefined(aAggFunction))
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
var isArray = Array.isArray;

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
 * <key>loadLib(aLib, forceReload, aFunction) : boolean</key>
 * Loads the corresponding javascript library and keeps track if it was already loaded or not (in __loadedLibs).
 * Optionally you can force reload and provide aFunction to execute after the successful loading.
 * Returns true if successfull, false otherwise.
 * </odoc>
 */
var __loadedLibs;
if (isUndefined(__loadedLibs)) __loadedLibs = {};
function loadLib(aLib, forceReload, aFunction) {
	if (forceReload ||
		isUndefined(__loadedLibs[aLib.toLowerCase()]) || 
		__loadedLibs[aLib.toLowerCase()] == false) {
		load(aLib);
		__loadedLibs[aLib.toLowerCase()] = true;
		if (isDefined(aFunction)) aFunction();
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
if (isUndefined(pods)) pods = new Pod();

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
	
	if (isUndefined(paths)) {
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
if (isUndefined(OpenWrap))
	OpenWrap = function() {}

var ow;
if (isUndefined(ow))
	ow = new OpenWrap();

/**
 * <odoc>
 * <key>ow.loadFormat()</key>
 * Loads OpenWrap format functionality. Basically functions to help with the formatting of strings, numbers, dates, etc...
 * </odoc>
 */
OpenWrap.prototype.loadFormat = function() { loadLib(getOpenAFJar() + "::js/owrap.format.js"); ow.format = new OpenWrap.format(); pods.declare("ow.format", ow.format); return ow.format; }
/**
 * <odoc>
 * <key>ow.loadTest()</key>
 * Loads OpenWrap test functionality. Basically functions to unit test other functionality.
 * </odoc>
 */
OpenWrap.prototype.loadTest = function() { loadLib(getOpenAFJar() + "::js/owrap.test.js"); ow.test = new OpenWrap.test(); pods.declare("ow.test", ow.test); return ow.test; }
/**
 * <odoc>
 * <key>ow.loadServer()</key>
 * Loads OpenWrap Server functionality. Basically functions to wrap access to server functionality.
 * </odoc>
 */
OpenWrap.prototype.loadServer = function() { loadLib(getOpenAFJar() + "::js/owrap.server.js"); ow.server = new OpenWrap.server(); pods.declare("ow.server", ow.server); return ow.server; }
/**
 * <odoc>
 * <key>ow.loadTemplate()</key>
 * Loads OpenWrap template functionality. Basically functions to wrap access to Handlebars functionality.
 * </odoc>
 */
OpenWrap.prototype.loadTemplate = function() { loadLib(getOpenAFJar() + "::js/owrap.template.js"); ow.template = new OpenWrap.template(); pods.declare("ow.template", ow.template); return ow.template; }
/**
 * <odoc>
 * <key>ow.loadObj()</key>
 * Loads OpenWrap object functionality. 
 * </odoc>
 */
OpenWrap.prototype.loadObj = function() { loadLib(getOpenAFJar() + "::js/owrap.obj.js"); ow.obj = new OpenWrap.obj(); pods.declare("ow.obj", ow.obj); return ow.obj; }
/**
 * <odoc>
 * <key>ow.loadCh()</key>
 * Loads OpenWrap channels functionality. 
 * </odoc>
 */
OpenWrap.prototype.loadCh = function() { loadLib(getOpenAFJar() + "::js/owrap.ch.js"); ow.ch = new OpenWrap.ch(); pods.declare("ow.ch", ow.ch); return ow.ch; }
/**
 * <odoc>
 * <key>ow.loadPortal()</key>
 * Loads OpenWrap WAF portal functionality. 
 * </odoc>
 */
OpenWrap.prototype.loadPortal = function() { loadLib(getOpenAFJar() + "::js/owrap.portal.js"); ow.portal = new OpenWrap.portal(); pods.declare("ow.portal", ow.portal); return ow.portal; }
/**
 * <odoc>
 * <key>ow.loadOJob()</key>
 * Loads OpenWrap oJob functionality. 
 * </odoc>
 */
OpenWrap.prototype.loadOJob = function() { loadLib(getOpenAFJar() + "::js/owrap.oJob.js"); ow.oJob = new OpenWrap.oJob(); pods.declare("ow.oJob", ow.oJob); return ow.oJob; }


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
	var res = loadLib(getOpenAFJar() + "::js/handlebars.js");
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
	var res = loadLib(getOpenAFJar() + "::js/lodash.js");
	if (res) pods.declare("Underscore", loadUnderscore());
	if (res) pods.declare("Lodash", loadUnderscore());
}

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
	var res = loadLib(getOpenAFJar() + "::js/odoc.js");
	if (res) pods.declare("Help", loadHelp());
}

var __odocsurl;
if (isUnDef(__odocsurl)) __odocsurl = __odoc;
var __odocs;
var __offlineHelp;
if (isUndefined(__offlineHelp)) {
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
	if (isDefined(__odocs)) __odocs = undefined; //__odocs.offline = __offlineHelp;
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
	
	if (isUndefined(aPath)) {
		var res;
		var paths = [ getOpenAFJar() ];
		paths = paths.concat(Object.keys(getOPackLocalDB()));
		for(var i in paths) {
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
	var login = (isUndefined(aLogin)) ? "sa" : aLogin;
	var pass = (isUndefined(aPass)) ? "sa" : aPass;
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
 * <key>t(aObject, aFunction) : Map</key>
 * Traverses aObject executing aFunction for every single element. The aFunction will receive the arguments: aKey, aValue, aPath, aObject.
 * </odoc>
 */
function traverse(aObject, aFunction, aParent) {
	var keys = Object.keys(aObject);
	var parent = isUnDef(aParent) ? "" : aParent;

	for(var i in keys) {
		if (isObject(aObject[keys[i]])) {
			var newParent = parent + ((isNaN(Number(keys[i]))) ? "." + keys[i] : "[\"" + keys[i] + "\"]");
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
 * <key>sh(commandArguments, aStdIn, aTimeout, shouldInheritIO, aDirectory) : String</key>
 * Tries to execute commandArguments (either a String or an array of strings) in the operating system as a shortcut for 
 * AF.sh except that it will run them through the OS shell. Optionally aStdIn can be provided, aTimeout can be defined 
 * for the execution and if shouldInheritIO is true the stdout, stderr and stdin will be inherit from OpenAF. If 
 * shouldInheritIO is not defined or false it will return the stdout of the command execution. It's possible also to 
 * provide a different working aDirectory.
 * The variables __exitcode and __stderr can be checked for the command exit code and the stderr output correspondingly.
 * </odoc>
 */
function sh(commandArguments, aStdIn, aTimeout, shouldInheritIO, aDirectory) {
	if (typeof commandArguments == "string") {
		if (java.lang.System.getProperty("os.name").match(/Windows/)) {
			return af.sh(["cmd", "/c", commandArguments], aStdIn, aTimeout, shouldInheritIO, aDirectory);
		} else {
			return af.sh(["/bin/sh", "-c", commandArguments], aStdIn, aTimeout, shouldInheritIO, aDirectory);
		}
	} else {
		return af.sh(commandArguments, aStdIn, aTimeout, shouldInheritIO, aDirectory);
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

/**
 * <odoc>
 * <key>ioStreamWrite(aStream, aString, aBufferSize, useNIO)</key>
 * Given a Java input or output stream helps to write aString into the same. Optionally you can provide a different
 * aBufferSize (default: 1024) and/or also specify that Java NIO functionality should be used. 
 * </odoc>
 */
function ioStreamWrite(aStream, aString, aBufferSize, useNIO) {
	if (!useNIO) {
		aStream.write(af.fromString2Bytes(aString));
	} else {
		var bufferSize = (isUndefined(aBufferSize)) ? 1024 : aBufferSize;
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
	if (!useNIO) {
		aStream.write(aArrayBytes);
	} else {
		var bufferSize = (isUndefined(aBufferSize)) ? 1024 : aBufferSize;
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
 * <key>ioStreamRead(aStream, aFunction, aBufferSize, useNIO)</key>
 * Given a Java input or output stream helps to read strings by using aFunction with a string argument for each buffer size 
 * (default 1024 characters). Optionally you can provide a different aBufferSize (default: 1024) and/or also specify that 
 * Java NIO functionality should be used. 
 * </odoc>
 */
function ioStreamRead(aStream, aFunction, aBufferSize, useNIO) {
	var bufferSize = (isUndefined(aBufferSize)) ? 1024 : aBufferSize;

	if (useNIO) {
		var channel;
		try {
			channel = aStream.getChannel();
		} catch(e) {
			channel = java.nio.channels.Channels.newChannel(aStream);
		}

		var buffer = java.nio.ByteBuffer.allocate(bufferSize);

		var bRead = channel.read(buffer);
		while(bRead != -1) {
			buffer.flip();

			var buf = [];
			while(buffer.hasRemaining()) {
				buf.push(Number(buffer.get()));
			}

			aFunction(af.fromBytes2String(af.fromArray2Bytes(buf)));

			buffer.clear();
			bRead = channel.read(buffer);
		}

		channel.close();
		aStream.close();
	} else {
		var buffer = af.fromString2Bytes(repeat(bufferSize, ' '));

		var aRead;
		do {
			aRead = aStream.read(buffer, 0, bufferSize);
			if (aRead > 0) {
				aFunction(af.fromBytes2String(af.fromArray2Bytes(af.fromBytes2Array(buffer).slice(0, aRead))));
			}
		} while(aRead >= 0);
	}
}

/**
 * <odoc>
 * <key>ioStreamReadLines(aStream, aFunctionPerLine, aSeparator, useNIO)</key>
 * Given aStream will read the entire buffer and call aFunctionPerLine(withALine) per each \n found.
 * Aditionally you can specify a different aSeparator for each line other than "\n".
 * </odoc>
 */
function ioStreamReadLines(aStream, aFunction, aSeparator, useNIO) {
        var buf = "";
        if (isUnDef(aSeparator)) aSeparator = "\n";
 
        ioStreamRead(aStream, function(buffer) {
                buf += buffer;
                while (buf.indexOf(aSeparator) > 0) {
                        aFunction(buf.substring(0, buf.indexOf(aSeparator)));
                        buf = buf.substring(buf.indexOf(aSeparator) + 1);
                }
        }, undefined, useNIO);
        while (buf.indexOf(aSeparator) > 0) {
                aFunction(buf.substring(0, buf.indexOf(aSeparator)));
                buf = buf.substring(buf.indexOf(aSeparator) + 1);
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
 * also specify that Java NIO functionality should be used. 
 * </odoc>
 */
function ioStreamReadBytes(aStream, aFunction, aBufferSize, useNIO) {
	var bufferSize = (isUndefined(aBufferSize)) ? 1024 : aBufferSize;

	if (!useNIO) {
		var channel;
		try {
			channel = aStream.getChannel();
		} catch(e) {
			channel = java.nio.channels.Channels.newChannel(aStream);
		}
		var buffer = java.nio.ByteBuffer.allocate(bufferSize);

		var bRead = channel.read(buffer);
		while(bRead != -1) {
			buffer.flip();

			var buf = [];
			while(buffer.hasRemaining()) {
				buf.push(Number(buffer.get()));
			}

			aFunction(af.fromArray2Bytes(buf));

			buffer.clear();
			bRead = channel.read(buffer);
		}

		channel.close();
		aStream.close();
	} else {
		var buffer = af.fromString2Bytes(repeat(bufferSize, ' '));

		var aRead;
		do {
			aRead = aStream.read(buffer, 0, bufferSize);
			if (aRead > 0) {
				aFunction(af.fromArray2Bytes(af.fromBytes2Array(buffer).slice(0, aRead)));
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
	if (isUndefined(anEncoding)) anEncoding = "UTF-8";
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

	if (isDefined(aResource)) {
		var zip = new ZIP();
		zip.loadFile(aZipFile);
		var ab = zip.getFile(aResource);
		zip.close();
		if (isBytes)
			return ab;
		else {
			ab = af.fromBytes2String(ab);
			if (isDefined(encoding)) ab = toEncoding(ab, encoding);
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
    plugin("Threads");

    if (isUnDef(aStopFunction)) aStopFunction = function(aR) { return aR; }

    //var t = new Threads();
    var done = false;
    var exc = undefined;

    //t.addThread(function(uuid) {
    var t = new java.lang.Thread(new java.lang.Runnable({
    	run: function() {
	        try {
	            //aFunction(uuid);
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
    //t.startSingleNoWait();
    t.start();

    var res = false;
    if (isDef(aTimeout)) {
    	var s = now();
        while(!res && !done && ((now() - s) < aTimeout)) {
            res = aStopFunction();
        }
    } else {
        while(!res && !done) {
            res = aStopFunction();
        }
    }
    //t.stop(true);
    if (!t.isAlive() && !t.interrupted()) {
    	t.interrupt();
    	//if (!t.isAlive()) {
    		log("Stopping! " + t.stop());
    	//}
    }

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
    plugin("Console");
    var console = new Console();
    if (console.getConsoleReader().getTerminal().isAnsiSupported()) {
        if (console.readCharNB() == 3) return true; else return false;
    } else {
        return false;
    }
}

var alert;
if (isUndefined(alert)) alert = function(msg) {
	printErr(String(msg));
}

__timeout = {};
function setTimeout(aFunction, aPeriod) {
	sleep(aPeriod);
	var args = [];
	for(var i = 2; i <= arguments.length; i++) { args.push(arguments[i]); }
	aFunction.apply(this, args);
}

function setInterval(aFunction, aPeriod) {
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
 * <key>oJobRunJob(aJob, args, aId)</key>
 * Shortcut for ow.oJob.runJob. Please see help for ow.oJob.runJob.
 * Optionally you can provide aId to segment this specific job.
 * </odoc>
 */
function oJobRunJob(aJob, args, aId) {
	ow.loadOJob();
	ow.oJob.runJob(aJob, args, aId);
}

// ---------------
// Profile support

var OPENAFPROFILE;
if (isUndefined(OPENAFPROFILE)) OPENAFPROFILE = ".openaf_profile";

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

/**
 * <odoc>
 * <key>loadJSYAML()</key>
 * Loads the JS-YAML library.
 * </odoc>
 */
function loadJSYAML() {
	loadLib(getOpenAFJar() + "::js/js-yaml.js");
}

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
AF.prototype.fromYAML = function(aYAML) { loadJSYAML(); return jsyaml.load(aYAML); }
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
IO.prototype.writeFileYAML = function(aYAMLFile, aObj) { return io.writeFileString(aYAMLFile, af.toYAML(aObj)); }

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
		
		storeAdd     : function(aFilename, anArrayOfKeys, shouldCompress) { ow.ch.persistence.create(a, aFilename, anArrayOfKeys, shouldCompress); return $channels(a) },
		storeRestore : function(aFilename, anArrayOfKeys) { ow.ch.persistence.restore(a, aFilename, anArrayOfKeys); return $channels(a); },
		
		expose       : function(aLocalPortOrServer, aPath, aAuthFunc, aUnAuthFunc, noCheck) { return ow.ch.server.expose(a, aLocalPortOrServer, aPath, aAuthFunc, aUnAuthFunc, noCheck); },
		peer         : function(aLocalPortOrServer, aPath, aRemoteURL, aAuthFunc, aUnAuthFunc) { ow.ch.server.peer(a, aLocalPortOrServer, aPath, aRemoteURL, aAuthFunc, aUnAuthFunc); return $channels(a); },
		
		createRemote : function(aURL, aTimeout) {
			var u = new java.net.URL(aURL);
			var urlPort = u.getPort();
			
			if (urlPort < 0 && u.getProtocol() == "https") urlPort = 443;
			if (urlPort < 0) urlPort = 80;
			
			var opts = {
				"login"   : (u.getUserInfo() != null) ? String(java.net.URLDecoder.decode(u.getUserInfo().substring(0, u.getUserInfo().indexOf(":")), "UTF-8")) : undefined,
				"password": (u.getUserInfo() != null) ? String(java.net.URLDecoder.decode(u.getUserInfo().substring(u.getUserInfo().indexOf(":") + 1), "UTF-8")) : undefined,
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

// Set logging to ERROR 
{
   let i = Packages.org.slf4j.LoggerFactory.getLogger(Packages.ch.qos.logback.classic.Logger.ROOT_LOGGER_NAME).getLoggerContext().getLoggerList().iterator();
   while(i.hasNext()) { 
      Packages.org.slf4j.LoggerFactory.getLogger(i.next().getName()).setLevel(Packages.ch.qos.logback.classic.Level.ERROR);
   }
}

/*if (isDef(__addToOpenAFjs)) {
	load(__addToOpenAFjs);
}*/
