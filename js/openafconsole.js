
plugin("Console");

var __ansiflag = true;
var __pinflag = false;
var __pinprefix = "";
var CONSOLESEPARATOR = "-- "
var CONSOLEHISTORY = ".openaf-console_history";
var CONSOLEPROFILE = ".openaf-console_profile";
var RESERVEDWORDS = "help|exit|time|output|beautify|desc|scope|alias|color|watch|clear|purge|pause|sql|esql|dsql|pin";
var __alias = {
	"opack": "oPack(__aliasparam);",
};

var __aliasparam;
var __message = "";
var __afDBs = {};

global.CONSOLETIMEOUT   = undefined;
global.CONSOLECTRLC     = false;

/**
 * Describe an existing class with methods exposed to OpenAF
 *
 * @param  {[type]} aClass The class name (if not found it will search also "wedo.openaf.*")
 */
function __desc(aClass, retList, noRecursive) {
	var methods = [];
	var constructors = [];
	var isJavascript = false;
	var classObj;
	var isScriptableObject = false;
	var ret = [];

	// No need for Packages reference
	aClass = aClass.replace(/^Packages\./, "");

	try {
		classObj = java.lang.Class.forName(aClass);
		methods = classObj.getMethods();
		constructors = classObj.getConstructors();
	} catch(e) {
		try {
			if (aClass.toLowerCase() == "io") aClass = "IOBase";
			if (aClass.toLowerCase() == "af") aClass = "AFBase";
			classObj = java.lang.Class.forName("wedo.openaf." + aClass);
			methods = classObj.getMethods();
			constructors = classObj.getConstructors();
		} catch(e) {
			try {
				classObj = java.lang.Class.forName("wedo.openaf.plugins." + aClass);
				methods = classObj.getMethods();
				constructors = classObj.getConstructors();
			} catch(e) {
				try {
					if(Object.prototype.toString.call(af.eval(aClass)) === '[object JavaObject]') {
						classObj = af.eval(aClass + ".getClass()");
						methods = classObj.getMethods();
						constructors = classObj.getConstructors();
					} else {
						isJavascript = true;
					}
				} catch(e) {
					isJavascript = true;
				}
			}
		}
	}

	if (!isJavascript) {
		try {
			if (classObj.asSubclass(Packages.org.mozilla.javascript.ScriptableObject))
				isScriptableObject = true;
		} catch(e) {
			isScriptableObject = false;
		}

		function printFunction(m, withRets) {
			for(let i in m.sort(function(a,b) {
				if (a.getName() < b.getName()) return -1;
				if (a.getName() > b.getName()) return 1;
				return 0;
			 } )) {
				var method = m[i];

				if (
					(isScriptableObject &&
					 (method.getAnnotation(Packages.org.mozilla.javascript.annotations.JSFunction) ||
					  method.getAnnotation(Packages.org.mozilla.javascript.annotations.JSConstructor)
					 )) ||
					(!isScriptableObject)
				   ) {

					if (retList)
						ret.push(method.getName() + "");
					else {
						__outputConsoleCommentsNoEnd(CONSOLESEPARATOR + method.getName()); __outputConsoleCommentsNoEnd("(");
					}

					if (!retList) {
						var types = method.getParameterTypes();
						var first = true;
						for(x in types) {
							if(!first && x < types.length) {
								__outputConsoleCommentsNoEnd(", ");
							} else {
								first = false;
							}
							var type = types[x];

							__outputConsoleNoEnd((type.getCanonicalName() +"").replace(/^.*\./, ""));
						}
						__outputConsoleCommentsNoEnd(")");
						if (withRets) {
							if (method.getReturnType().getCanonicalName() != 'void')
								__outputConsoleNoEnd(" : " + (method.getReturnType().getCanonicalName() +"").replace(/^.*\./, ""));
						}

						__outputConsoleCommentsEnd("");
					}
				}
			}
		}

		printFunction(constructors, false);
		printFunction(methods, true);
	} 
	//else {
	
        var methods = [];

        if(aClass.match(/ *JSON */)) return ret;
		try {
			if ((typeof af.eval(aClass)) !== 'function') {
				if (Object.prototype.toString.call(af.eval(aClass)) === '[object Array]') {
					if (!retList)
						__outputConsoleComments("ARRAY: #" + af.eval(aClass + ".length") + " entries");
				} else {
					if ((typeof af.eval(aClass)) !== 'object') {
						if (!retList) {
							var mytype = typeof af.eval(aClass);
							if (mytype != 'undefined')
								__outputConsoleComments("TYPE: " + typeof af.eval(aClass));
						}
						return ret;
					} else {
						var objType = Object.prototype.toString.call(af.eval(aClass)).replace(/\[object ([a-zA-Z0-9_]+)\]/, "$1");

						var keys = Object.keys(af.eval(aClass)).sort();
						for(i in keys) {
							ret.push(keys[i]);
							if (!retList) {
								__outputConsoleComments("KEY: " + keys[i]);
							}
						}
						
						if (
							(objType == 'Object') &&
							(!aClass.match(/\.constructor$/)) && 
							 !noRecursive ) {
							var tempret = __desc(aClass + ".constructor", retList, true);
							ret = ret.concat(tempret);
							if (tempret.length < 1) {
								var listScope = af.getScopeIds();
								for(let i in listScope) {
									try {
										if (eval(listScope[i] + " instanceof Object") && 
										    eval(aClass + " instanceof " + listScope[i]))
												ret = ret.concat(__desc(String(listScope[i]), retList, true));
									} catch(e) {}
								}
							}
						}
					}
				}
				
				if (!aClass.match(/\.constructor$/) && !noRecursive)
					ret = ret.concat(__desc(af.eval(aClass + ".constructor.name"), retList, true));
				
				return ret;
			}

			methods = [];
			methods = methods.concat(Object.keys(af.eval(aClass + ".prototype")).sort());

			var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
			var ARGUMENT_NAMES = /([^\s,]+)/g;
			function getParamNames(func) {
			    var fnStr = func.toString().replace(STRIP_COMMENTS, '');
			    var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
			    if(result === null)
			       result = [];
			    return result;
			}

			for(i in methods) {
				if (methods[i] !== 'constructor') { ret.push(methods[i]); }
				if (!retList) {
					__outputConsoleCommentsNoEnd(CONSOLESEPARATOR + "FUNC: " + methods[i]); __outputConsoleCommentsNoEnd("(");
				}
				if (!retList) {
					var types = getParamNames(af.eval(aClass + ".prototype." + methods[i]));
					var first = true;
					for(x in types) {
						if (!first && x < types.length) {
							__outputConsoleCommentsNoEnd(", ");
						} else {
							first = false;
						}
						__outputConsoleNoEnd(types[x]);
					}
					__outputConsoleCommentsEnd(")");
				}
			}

		} catch(e) {
			return ret;
		}
	//}

	return ret;
}

/**
 * Provides a list of the current scope
 *
 * @param  {string} aRegExpRestriction A regexp restriction to apply to the list
 */
function __scope(aRegExpRestriction, retList) {
	var objects = af.getScopeIds();
	var ret = [];

	for(let i in objects.sort()) {
		if (aRegExpRestriction.length > 0 &&
		    !objects[i].match(new RegExp(aRegExpRestriction, "i"))) continue;
		if (retList)
			ret.push(objects[i]);
		else
			__outputConsoleComments(objects[i]);
	}

	return ret;
}

function __sql(aParams, executeSQL, descSQL, returnOnly) {
	var params = aParams.match(/^([^ ]+) +(.*)/, "")

	var _db;
	if (isUndefined(params[1])) {
		__outputConsoleError("Needs to be a DB object followed by a SQL statement");
		return;
	}

	_db = af.eval(params[1]);
	if (Object.prototype.toString.call(_db) != '[object DB]') {
		__outputConsoleError("Needs to be a DB object followed by a SQL statement");
		return;
	}

	var outputres = "";
	var res;
	var __start;
	
	if (timeCommand) __start = now();
	if (!executeSQL) {
		var sql = params[2];
		sql = sql.replace(/\;\s*/, "");
		
		if (descSQL) {
			res = _db.qsRS(sql);
			if (timeCommand) __timeResult = now() - __start;
			for(let i = 1; i <= res.getMetaData().getColumnCount(); i++) {
				outputres += res.getMetaData().getColumnName(i) + ": " + res.getMetaData().getColumnTypeName(i) + "(" + res.getMetaData().getColumnDisplaySize(i) + ((res.getMetaData().getScale(i) > 0) ? "," + res.getMetaData().getScale(i) : "" ) + ")\n";
			}
			
			if (!returnOnly) {
				var __pres = 0;
				var __lines = String(outputres).replace(/\"/g, "").replace(/([^\\])\\n/g, "$1\n").split(/\n/);
				while(__pres >= 0) __pres = __pauseArray(__lines, __pres);
			}
			
			res.close();
		} else {
			res = _db.q(sql);
			if (timeCommand) __timeResult = now() - __start;
			if (res.results.length > 0) {
				if (!descSQL) {
					outputres = printTable(res.results, con.getConsoleReader().getTerminal().getWidth(), returnOnly);
				} /* else {
					outputres = Object.keys(res.results[0]).join("\n");
				}*/
				
				if (!returnOnly) {
					var __pres = 0;
					var __lines = String(outputres).replace(/\"/g, "").replace(/([^\\])\\n/g, "$1\n").split(/\n/);
					while(__pres >= 0) __pres = __pauseArray(__lines, __pres);
					__outputConsoleComments(res.results.length + " rows selected.");
				}
			} else {
				if (returnOnly)
					outputres += "No results.";
				else
					__outputConsoleComments("No results.");
			}
		}
	} else {
		res = _db.u(params[2]);
		if (returnOnly)
			outputres += "Executed over #" + res + " lines.";
		else
			__outputConsoleComments("Executed over #" + res + " lines.");
	}
	
	if (timeCommand) {
		__time(__timeResult);
	}

	return outputres;
}

function __pin(aCommand) {
	if (!__pinflag) {
		__pinflag = true;
		__pinprefix = aCommand;
	} else {
		__pinflag = false;
		__pinprefix = "";
	}
}

var __timeResult;
/**
 * Turns on or off timing of commands or provides the elapsed time
 *
 * @param  {number} aResult If not defined toogles the timing of commands, otherwise prints the result in ms
 */
function __time(aResult, aFlag) {
	if (isUndefined(aResult)) {
		if (isDefined(aFlag) && aFlag.match(/off|0/i)) timeCommand = false;
		if (isDefined(aFlag) && aFlag.match(/on|1/i)) timeCommand = true;
		if (aFlag == "") {
			if (timeCommand) {
				timeCommand = false;
			} else {
				timeCommand = true;
			}
		}

		if (timeCommand) {
			__outputConsoleComments("Timing of commands is enabled.");
		} else {
			__outputConsoleComments("Timing of commands is disabled.");
		}

	} else {
		if (timeCommand) __outputConsoleComments("Elapsed time: " + (aResult / 1000) +"s");
	}
}

/**
 * Turns on or off the output of commands
 *
 */
function __output(aFlag) {
	if (aFlag.match(/off|0/i)) outputCommand = false;
	if (aFlag.match(/on|1/i)) outputCommand = true;
	if (aFlag == "")
		if (outputCommand)
			outputCommand = false;
		else
			outputCommand = true;

	if (outputCommand)
		__outputConsoleComments("Output of commands is enabled.");
	else
		__outputConsoleComments("Output of commands is disabled.");
}

/**
 * Turns on or off the beautify of output of commands
 *
 */
function __beautify(aFlag) {
	if (aFlag.match(/off|0/i)) beautifyCommand = false;
	if (aFlag.match(/on|1/i)) beautifyCommand = true;
	if (aFlag == "")
		if (beautifyCommand)
			beautifyCommand = false;
		else
			beautifyCommand = true;

	if (beautifyCommand)
		__outputConsoleComments("Output beautify of commands is enabled.");
	else
		__outputConsoleComments("Output beautify of commands is disabled.");
}

function __diff(aString) {
	ow.loadObj();

	let i = aString.split(/ with(Full|Changes|New)? /);
	let m = { printColor: 1 }; 
	
	if (i[1] == "Changes") {
	   m = merge(m, { justChanges: 1 }); 
	} else {
	   if (i[1] == "New") { 
		  m = merge(m, { justDiff: 1, justChanges: 1});
	   } else {
		  if (i[1] == "") m = merge(m, { justDiff: 1});
	   }
	}
	(i.length == 3) ? ow.obj.diff(af.eval("(" + i[0] + ")"), af.eval("(" + i[2] + ")"), m) 
					: "Usage: 'diff oldObject with newObject' (with/withNew/withChanges/withFull)";
}

/**
 * Turns on or off the color of output of commands
 *
 */
function __color(aFlag) {
	if (aFlag.match(/off|0/i)) colorCommand = false;
	if (aFlag.match(/on|1/i)) colorCommand = true;
	if (aFlag == "")
		if (colorCommand)
		colorCommand = false;
		else
		colorCommand = true;

	if (colorCommand)
		__outputConsoleComments("Color output of commands is enabled.");
	else
		__outputConsoleComments("Color output of commands is disabled.");
}

/**
 * Turn on/off watch functionality
 */
function __watch(aLineOfCommands) {
	if (aLineOfCommands.match(/^off$|^0$/i)) { watchCommand = false; return; }
	if (aLineOfCommands.match(/^on$|^1$/i)) { watchCommand = true; return; }
	if (aLineOfCommands == "") {
		if (watchCommand) {
			__outputConsoleComments("Watch is active.");
		} else {
			__outputConsoleComments("Watch is not active.");
		}
	} else {
		if (aLineOfCommands.match(/^[0-9]+ .+/)) {
			var waitFor = Number(aLineOfCommands.match(/^([0-9]+) /)[1]);
			var watchcmd = aLineOfCommands.match(/ (.+)/)[1];
			var c = -2;

			plugin("Threads");
			var t = new Threads();
			t.addThread(function() {
				var out = "";
				try {
					out = __processCmdLine(watchcmd, true);
				} catch (e) {
					out = e.message;
				}

				if (isDefined(out))
					if (beautifyCommand) out = String(stringify(out)).replace(/\\t/g, "\t").replace(/([^\\])\\n/g, "$1\n").replace(/\\r/g, "\r");

				__clear();
				__outputConsole(out);
				__outputConsoleCommentsEnd("Press 'q' to quit. (refreshed at " + new Date() + ")");
			});

			try {
				t.startWithFixedRate(waitFor);

				while(c != 3 && c != 113) {
					sleep(500);
					var tmpC = Number(con.readCharNB());
					if (tmpC > 0) c = tmpC;
				}

				t.stop();
				__clear();
			} catch(e) {
				printErr(e.message);
				t.stop(true);
			}
		} else {
			watchLine = aLineOfCommands;
			watchCommand = true;
			__outputConsoleComments("Watch is active for '" + watchLine + "'");
		}
	}
}

function addAlias(aAssignment) {
	if (!(aAssignment.match(/\=/))) {
		for(let i in __alias) {
			if (i == "preto") continue;
			if (i == "decrypt") continue;
			__outputConsoleCommentsNoEnd(i + ": "); __outputConsoleEnd(__alias[i]);
		}
	} else {
		if(RESERVEDWORDS.split(/\|/).indexOf(aAssignment.replace(/\=.*/, "")) >= 0) {
			__outputConsoleError("Can't assign an alias to a reserved word.");
			return;
		}
		var key = aAssignment.replace(/^([a-zA-Z0-9_]+)=(.+)/, "$1");
		var value = aAssignment.replace(/^([a-zA-Z0-9_]+)=(.+)/, "$2");

		__alias[key] = value;
	}
}

/**
 * Provides a help screen
 */
function __help(aTerm) {
	if(isUndefined(aTerm) || aTerm.length <= 0) {
		__outputConsoleComments("help     Display this help text");
		__outputConsoleComments("exit     Exit this console");
		__outputConsoleComments("time     Turns on or off the timing of any script command provided (default off)");
		__outputConsoleComments("output   Turns on or off the output of commands (default on)");
		__outputConsoleComments("beautify Turns on or off the beautify of output (default on)");
		__outputConsoleComments("color    Turns on or off the colorify of json output (default on)");
		__outputConsoleComments("desc     Provides a description of the available methods for a class (example 'desc AF')");
		__outputConsoleComments("scope    Lists the current OpenAF javascript scope loaded filtered by a regexp (example 'scope sha')");
		__outputConsoleComments("alias    Create an alias for an openaf-console command line (example 'alias ola=print(\"hi\");')");
		__outputConsoleComments("watch    Turns on or off an execution before every console prompt (example 'watch new Date();')");
		__outputConsoleComments("pause    Pauses the output of a command if bigger than the terminal height (default off)");
		__outputConsoleComments("sql      Executes a SQL query, over a db connection, displaying the result in a table (example 'sql adm select...')");
		__outputConsoleComments("dsql     Returns the list of columns produced by a SQL query over a db connection.");
		__outputConsoleComments("esql     Executes the SQL statement, over a db connection (example 'esql db update...')");
		__outputConsoleComments("diff     Show differences between object A and B (example 'diff A with B'; accepts with/withNew/withChanges/withFull)");
		__outputConsoleComments("pin      Pins the next command as a prefix for the next commands until an empty command (example 'pin sql db...')");
		__outputConsoleComments("clear    Tries to clear the screen.");
		__outputConsoleComments("purge    Purge all the command history");
		__outputConsoleComments("[others] Executed as a OpenAF script command (example 'print(\"ADEUS!!!\");')");
	} else {
		var h;

		if (aTerm == "scope") {
			h = searchHelp("", undefined, ['scope']);
		} else {
			h = searchHelp(aTerm);
		}
		
		if (h.length == 1) {
			__outputConsoleComments(h[0].fullkey);
			__outputConsoleComments(repeat(h[0].fullkey.length, '-'));
			__outputConsoleComments(h[0].text);
		} else {
			if (h.length > 1) {
				for(let i in h) {
					__outputConsoleComments(h[i].key);
				}
			} else {
				__outputConsoleComments("Term '" + aTerm + "' not found.");
			}
		}
	}
}

function __outputConsole(anOutput, colorify) {
	__outputConsoleEnd(anOutput, colorify);
}

function __outputConsoleNoEnd(anOutput, colorify) {
	if(con.getConsoleReader().getTerminal().isAnsiSupported() && __ansiflag) {
		jansi.AnsiConsole.systemInstall();
		if (colorCommand && colorify) 
			printnl(jansi.Ansi.ansi().boldOff().a(anOutput).a(jansi.Ansi.Attribute.RESET));
		else
			printnl(jansi.Ansi.ansi().boldOff().fg(jansi.Ansi.Color.CYAN).a(anOutput).a(jansi.Ansi.Attribute.RESET));
		jansi.AnsiConsole.systemUninstall();
	} else {
		printnl(anOutput);
	}
}

function __outputConsoleEnd(anOutput, colorify) {
	if(con.getConsoleReader().getTerminal().isAnsiSupported() && __ansiflag) {
		jansi.AnsiConsole.systemInstall();
		if (colorCommand && colorify) 
		   print(jansi.Ansi.ansi().boldOff().a(anOutput).a(jansi.Ansi.Attribute.RESET));
		else
		   print(jansi.Ansi.ansi().boldOff().fg(jansi.Ansi.Color.CYAN).a(anOutput).a(jansi.Ansi.Attribute.RESET));
		jansi.AnsiConsole.systemUninstall();
	} else {
		print(anOutput);
	}
}

function __outputConsoleComments(anOutputComment) {
	__outputConsoleCommentsEnd(CONSOLESEPARATOR + anOutputComment);
}

function __outputConsoleCommentsNoEnd(anOutputComment) {
	if(con.getConsoleReader().getTerminal().isAnsiSupported() && __ansiflag) {
		jansi.AnsiConsole.systemInstall();
		printnl(jansi.Ansi.ansi().bold().a(anOutputComment).a(jansi.Ansi.Attribute.RESET));
		jansi.AnsiConsole.systemUninstall();
	} else {
		printnl(anOutputComment);
	}
}

function __outputConsoleCommentsEnd(anOutputComment) {
	if(con.getConsoleReader().getTerminal().isAnsiSupported() && __ansiflag) {
		jansi.AnsiConsole.systemInstall();
		print(jansi.Ansi.ansi().bold().a(anOutputComment).a(jansi.Ansi.Attribute.RESET));
		jansi.AnsiConsole.systemUninstall();
	} else {
		print(anOutputComment);
	}
}

function __outputConsoleError(anError) {
	if(con.getConsoleReader().getTerminal().isAnsiSupported() && __ansiflag) {
		jansi.AnsiConsole.systemInstall();
		printErr(jansi.Ansi.ansi().boldOff().fg(jansi.Ansi.Color.RED).a(CONSOLESEPARATOR + anError).a(jansi.Ansi.Attribute.RESET));
		jansi.AnsiConsole.systemUninstall();
	} else {
		printErr(CONSOLESEPARATOR + anError);
	}
}

function __clear() {
	if(con.getConsoleReader().getTerminal().isAnsiSupported() && __ansiflag) {
		jansi.AnsiConsole.systemInstall();
		printnl(jansi.Ansi.ansi().eraseScreen().cursor(0,0).reset());
		jansi.AnsiConsole.systemUninstall();
	}
}

function __readProfile(aProfile) { 
	var prof = "";
	try {
		prof = io.readFileString(aProfile);
		prof = prof.replace(/^([a-zA-Z0-9_]+)( +|$)(.*)/mg, function(match, $1, $2, $3) {
			if ($1.match(RESERVEDWORDS)) {
				var second = $3;
				second = second.replace(/"/g, "\\\"");
				return "__showResultProcessCmdLine(__processCmdLine(\"" + $1 + " " + second + "\"));";
			} else {
				return match;
			}
		});
		af.compile(prof);
	} catch(e) {
		if (!e.message.match(/java\.io\.FileNotFoundException/)) throw e;
	}
}

function __pause(aFlag) {
	if (aFlag.match(/off|0/i)) pauseCommand = false;
	if (aFlag.match(/on|1/i)) pauseCommand = true;
	if (aFlag == "")
		if (pauseCommand)
			pauseCommand = false;
		else
			pauseCommand = true;

	if (pauseCommand)
		__outputConsoleComments("Pause of output is enabled.");
	else
		__outputConsoleComments("Pause of output is disabled.");
}

function __processCmdLine(aCommand, returnOnly) {
	var internalCommand = false;
	aCommand = aCommand.replace(/^ *([^ ].*)/, "$1");
	try {
		if (aCommand != "exit") {
			if (!isUndefined(__alias[aCommand.replace(/^([^ ]+).*/, "$1")])) {
				__aliasparam = aCommand.replace(/^[^ ]+ */, "");
				if(isUndefined(__aliasparam)) __aliasparam = "";
				aCommand = __alias[aCommand.replace(/^([^ ]+).*/, "$1")];
			}
			if (aCommand.match(/^alias(?: +|$)/)) {
				internalCommand = true;
				addAlias(aCommand.replace(/^alias */, ""));
			}
			if (aCommand.match(/^desc(?: +|$)/)) {
				internalCommand = true;
				__desc(aCommand.replace(/^desc */, ""), false);
			}
			if (aCommand.match(/^help(?: +|$)/)) {
				internalCommand = true;
				__help(aCommand.replace(/^help */, ""), false);
			}
			if (aCommand.match(/^sql(?: +|$)/)) {
				internalCommand = true;
				var res = __sql(aCommand.replace(/^sql */, ""), false, false, returnOnly);
				if (returnOnly) return res;
			}
			if (aCommand.match(/^esql(?: +|$)/)) {
				internalCommand = true;
				var res = __sql(aCommand.replace(/^esql */, ""), true, false, returnOnly);
				if (returnOnly) return res;
			}			 
			if (aCommand.match(/^dsql(?: +|$)/)) {
				internalCommand = true;
				var res = __sql(aCommand.replace(/^dsql */, ""), false, true, returnOnly);
				if (returnOnly) return res;
			}	
			if (aCommand.match(/^scope(?: +|$)/)) {
				internalCommand = true;
				__scope(aCommand.replace(/^scope */, ""), false);
			}
			if (aCommand.match(/^time(?: +|$)/)) {
				internalCommand = true;
				__time(undefined, aCommand.replace(/^time */, ""));
			}
			if (aCommand.match(/^output(?: +|$)/)) {
				internalCommand = true;
				__output(aCommand.replace(/^output */, ""));
			}
			if (aCommand.match(/^beautify(?: +|$)/)) {
				internalCommand = true;
				__beautify(aCommand.replace(/^beautify */, ""));
			}
			if (aCommand.match(/^color(?: +|$)/)) {
				internalCommand = true;
				__color(aCommand.replace(/^color */, ""));
			}			
			if (aCommand.match(/^watch(?: +|$)/)) {
				internalCommand = true;
				__watch(aCommand.replace(/^watch */, ""));
			}
			if (aCommand.match(/^purge(?: +|$)/)) {
				internalCommand = true;
				jLineFileHistory.purge();
			}
			if (aCommand.match(/^clear(?: +|$)/)) {
				internalCommand = true;
				__clear();
			}
			if (aCommand.match(/^pause(?: +|$)/)) {
				internalCommand = true;
				__pause(aCommand.replace(/^pause */, ""));
			}
			if (aCommand.match(/^diff(?: +|$)/)) {
				internalCommand = true;
			    __diff(aCommand.replace(/^diff */, ""));
			}
			if (aCommand.match(/^pin(?: +|$)/)) {
				internalCommand = true;
				__pin(aCommand.replace(/^pin */, ""));
			}
			var __res;
			if (!internalCommand) {
				//var __res;
				if (timeCommand) {
					__start = now();
                    if (isDef(CONSOLETIMEOUT) || CONSOLECTRLC) {
                            threadBox(function() {
                               //var _f = new Function(aCommand);
                               //__res = _f(); 
                               __res = af.eval(aCommand); 
                            }, CONSOLETIMEOUT, (CONSOLECTRLC) ? threadBoxCtrlC : undefined);
                    } else {
                            __res = af.eval(aCommand);
                    }
					__end = now();
					__timeResult = __end - __start;
				} else {
                    if (isDef(CONSOLETIMEOUT) || CONSOLECTRLC) {
                            threadBox(function() { 
                               //var _f = new Function(aCommand);
                               //__res = _f(); 
                               __res = af.eval(aCommand);
                            }, CONSOLETIMEOUT, (CONSOLECTRLC) ? threadBoxCtrlC : undefined);
                    } else {
                            __res = af.eval(aCommand);
                    }
				}

				//if (timeCommand && aCommand.length > 0) __time(__end - __start);

				if (outputCommand &&
					typeof __res !== 'undefined') {
					return __res;
				} else {
					return undefined;
				}
			}

		}
	} catch(e) {
		__outputConsoleError(e.message);
	}

	internalCommand = false;
}

function __showResultProcessCmdLine(__res, __cmd) {
	if(isDefined(__res)) {
		if (pauseCommand) {
			var __pres = 0;
			var lines = [];
			if (beautifyCommand) {
				if (colorCommand && isObject(__res)) 
				   __lines = String(colorify(__res)).replace(/\\t/g, "\t").replace(/\\r/g, "\r").replace(/([^\\])\\n/g, "$1\n").split(/\n/);
				else
				   __lines = String(stringify(__res)).replace(/\\t/g, "\t").replace(/\\r/g, "\r").replace(/([^\\])\\n/g, "$1\n").split(/\n/);
			} else {
				__lines = String(__res).replace(/\"/g, "").replace(/([^\\])\\n/g, "$1\n").split(/\n/);
			}
			while(__pres >= 0) __pres = __pauseArray(__lines, __pres);
		} else {
			if (beautifyCommand) {
				if (colorCommand && isObject(__res))
					__outputConsole(String(colorify(__res)).replace(/\\t/g, "\t").replace(/([^\\])\\n/g, "$1\n").replace(/\\r/g, "\r"), true);
				else
					__outputConsole(String(stringify(__res)).replace(/\\t/g, "\t").replace(/([^\\])\\n/g, "$1\n").replace(/\\r/g, "\r"));
			} else
				__outputConsole(__res);
		}	

	} 
	
	if (timeCommand && !__cmd.match(/^time(?: +|$)/)) __time(__timeResult);
}

function __checkVersion() {
	var t = new Threads();
	t.addThread(function() {
		var current = checkLatestVersion(); 
		var myversion = getVersion();
		if (current != -1) {
			if (current > myversion)
				__message = "There is a new OpenAF version available: " + current + ". Run 'openaf --update' to update.";
		}
		t.stop(true);
	});
	t.startNoWait();
}

function __pauseArray(aText, aStart) {
	var height = con.getConsoleReader().getTerminal().getHeight();
	var lines = aText.length;

	if (lines <= height) {
		__outputConsole(aText.join("\n"));
		return -1;
	}

	if (isUndefined(aStart) || aStart < 0)
		aStart = 0;
	else
		if(aStart > (lines - height +1)) aStart = (lines - height +1);

	__outputConsole(aText.slice(aStart, (aStart + height) -1).join("\n"));

	if ((aStart + height - 1) < (lines -2)) {
		__outputConsoleCommentsNoEnd(Math.floor(( ((aStart + height -1)*100) /(lines))) + "% (Press any key to continue or 'q' to quit)");
		var c = con.readChar("") + "";
		__outputConsoleCommentsNoEnd("\r" + repeat(con.getConsoleReader().getTerminal().getWidth(), ' ') + "\r");
		if (c.charCodeAt(0) != 113 && c.charCodeAt(0) != 81) {
			if(c.charCodeAt(0) == 27) {
				c = con.readChar("") + "";
				if(c.charCodeAt(0) == 27) {
					// get out
				}
				if(c.charCodeAt(0) == 91) {
					c = con.readChar("") + "";
					//home
					if(c.charCodeAt(0) == 49) {
						c = con.readChar("") + "";
						if (c.charCodeAt(0) == 126) {
							return 0;
						}
					}
					//end
					if(c.charCodeAt(0) == 52) {
						c = con.readChar("") + "";
						if (c.charCodeAt(0) == 126) {
							return lines - height +1;
						}
					}
					//pgup
					if(c.charCodeAt(0) == 53) {
						c = con.readChar("") + "";
						if (c.charCodeAt(0) == 126) {
							if (aStart - height -1 < 0)
								return 0;
							else
								return aStart - height +1;
						}
					}
					//pgdw
					if(c.charCodeAt(0) == 54) {
						c = con.readChar("") + "";
						if (c.charCodeAt(0) == 126) {
							return aStart + height +1;
						}
					}
					// up
					if(c.charCodeAt(0) == 65) {
						if (aStart - 1 < 0)
							return 0;
						else
							return aStart - 1;
					}
					// down
					if(c.charCodeAt(0) == 66) {
						return aStart + 1;
					}
				}
			}
			return aStart + height +1;
		} else {
			return -1;
		}
	}
}

function __pauseString(aString) {
	var __pres = 0;
	var __lines = aString.split(/\n/);
	while(__pres >= 0)
		__pres = __pauseArray(__lines, __pres);
}

// ---------------------
// MAIN
// ---------------------
var con = new Console();
var jansi = JavaImporter(Packages.org.fusesource.jansi);
var cmd = "";
var timeCommand = false; var start; var end;
var outputCommand = true;
var beautifyCommand = true;
var colorCommand = true;
var pauseCommand = false;
var watchCommand = false;
var watchLine = "";

// Tweak a little
con.getConsoleReader().setHistoryEnabled(true);
con.getConsoleReader().setExpandEvents(false);
//java.lang.System.setProperty("jansi.passthrough", true);

// Startup
__outputConsoleComments("OpenAF console (OpenAF version " + getVersion() + " (" + getDistribution() + ")) (type help for commands)");
var historyFile;
var jLineFileHistory;

// Initializations
plugin("Threads");
var initThread = new Threads();
initThread.addThread(function(uuid) {
	// History file
	historyFile = java.lang.System.getProperty("user.home") + "/" + CONSOLEHISTORY;
	jLineFileHistory = new Packages.jline.console.history.FileHistory(new java.io.File(historyFile));
	con.getConsoleReader().setHistory(jLineFileHistory);
	con.getConsoleReader().addCompleter(
		new Packages.wedo.openaf.jline.OpenAFConsoleCompleter(function(buf, cursor, candidates) {
			if (buf == null) return null;
			var ret = 0;

			if (buf.substr(0, cursor).match(/(([a-zA-Z0-9_\[\]\(\)\"\']+\.)+)([a-zA-Z0-9_\[\]\(\)\"\']*)$/)) {
				var tmpbuf = buf.substr(0, cursor).match(/(([a-zA-Z0-9_\[\]\(\)\"\']+\.)+)([a-zA-Z0-9_\[\]\(\)\"\']*)$/);
				ret = cursor - tmpbuf[3].length;
				tmpbuf[1] = tmpbuf[1].replace(/\.$/, "");
				tmpbuf[3] = tmpbuf[3].replace(/\.$/, "");
                try {
					var tmpList = __desc(tmpbuf[1].replace(/.+[\[\(\"\']([^\]\)]+)$/, "$1"), true);
					for(let elem in tmpList) {
						if(tmpList[elem].indexOf(tmpbuf[3]) == 0) {
							candidates.add(tmpList[elem]);
						}
					}
                } catch(e) {
                	logErr(e);
                }

			} else {
				if(buf.substr(0, cursor).match(/[^a-zA-Z0-9_\[\]\(\)\"\']*[a-zA-Z0-9_\[\]\(\)\"\']+$/)) {
					var tmpbuf = buf.substr(0, cursor).match(/[^a-zA-Z0-9_\[\]\(\)\"\']*([a-zA-Z0-9_\[\]\(\)\"\']+)$/);
					ret = cursor - tmpbuf[1].length;
					try {
						var tmpList = __scope(tmpbuf[1], true);
						for(let elem in tmpList) {
							if(tmpList[elem].indexOf(tmpbuf[1]) == 0) {							
								candidates.add(tmpList[elem]);
							}
						}
					} catch(e) {
					}
				}
			}

			return Number(ret);
		})
	);
	con.getConsoleReader().getCompletionHandler().setPrintSpaceAfterFullCompletion(false);

	// Read profile
	__readProfile(java.lang.System.getProperty("user.home") + "/" + CONSOLEPROFILE);
	
	if (!noHomeComms) __checkVersion();
	initThread.stop();
});
initThread.startNoWait();

if (__expr.length > 0) cmd = __expr;

while(cmd != "exit") {
	__showResultProcessCmdLine(__processCmdLine(cmd), cmd);

	if (__message != "") {
		__outputConsoleComments(__message);
		__message = "";
	}
	if (watchCommand) {
		var watchresult;
		try {
			watchresult = __processCmdLine(watchLine, true);
			if (isUndefined(watchresult)) watchresult = "";
			if (beautifyCommand) watchresult = String(stringify(watchresult)).replace(/\\t/g, "\t").replace(/([^\\])\\n/g, "$1\n").replace(/\\r/g, "\r");
		} catch(e) { watchresult = "ERROR: " + e.message; watchCommand = false; }
		cmd = con.readLinePrompt("[ " + watchresult + " ]\n" + __pinprefix + "> ");
	} else {
		cmd = con.readLinePrompt(__pinprefix + "> ");
	}
	
	if (cmd == "") {
		__pinflag = false;
		__pinprefix = "";
	} else {
		if (__pinflag) {
			cmd = __pinprefix + " " + cmd;
		}
	}
	
	if(isDefined(jLineFileHistory)) jLineFileHistory.flush();
}

exit(0);
