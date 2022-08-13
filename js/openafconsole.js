
plugin("Console");

var __codepage;
var __pinflag = false;
var __pinprefix = "";
var __autoupdate = false;
var __autoupdateResume = true;
var consoleOldTheme = openafOldTheme;
var CONSOLESEPARATOR = "-- ";
var HELPSEPARATOR = "-";
var HELPSEPARATOR_ANSI = "─";
var CONSOLESEPARATOR_ANSI = "── ";
var CONSOLEHISTORY = ".openaf-console_history";
var CONSOLEPROFILE = ".openaf-console_profile";
var RESERVEDWORDS = "help|exit|time|output|beautify|desc|scope|alias|color|watch|clear|purge|pause|table|tree|view|sql|esql|dsql|pin|multi|diff";
var __alias = {
	"opack": "oPack(__aliasparam);",
	"encryptText": "print(\"Encrypted text: \" + askEncrypt(\"Enter text: \"));",
	"sh": "sh((!ow.loadFormat().isWindows()?\"stty icanon echo 2>/dev/null && /bin/sh \":\"cmd \")+(__aliasparam.trim().length>0?(ow.format.isWindows()?\" /c \":\" -c \\\"\")+__aliasparam+\"\\\"\":\"\")+(!ow.format.isWindows()?\" && stty -icanon min 1 -echo 2>/dev/null\":\"\"),__,__,true);__;",
    "ojob": "(()=>{var f = __aliasparam.split(\" \"); var o = processExpr(\" \", false, __aliasparam); delete o[f[0]]; oJobRunFile(f[0], o);})()",
	"ojobio": "oJobRunFile(\"ojob.io\")"
};
var __exitActions = [];
ow.loadFormat();
var __consoleFormat;

var __aliasparam;
var __message = "";
var __afDBs = {};

global.CONSOLETIMEOUT   = undefined;
global.CONSOLECTRLC     = false;

/**
 * Describe an existing class with methods exposed to OpenAF
 *
 * @param  {[type]} aClass The class name (if not found it will search also "openaf.*")
 */
function __desc(aClass, retList, noRecursive, javaMethods) {
	var methods = [];
	var constructors = [];
	var isJavascript = false;
	var classObj;
	var isScriptableObject = false;
	var ret = [];
	var aClassJava;

	javaMethods = _$(javaMethods).default([]);

	// No need for Packages reference
	aClass = aClass.replace(/^Packages\./, "");

	try {
		classObj = java.lang.Class.forName(aClass);
		methods = classObj.getMethods();
		constructors = classObj.getConstructors();
	} catch(e) {
		try {
			aClassJava = aClass;
			if (aClass.toLowerCase() == "io") aClassJava = "IOBase";
			if (aClass.toLowerCase() == "af") aClassJava = "AFBase";
			classObj = java.lang.Class.forName("openaf." + aClassJava);
			methods = classObj.getMethods();
			constructors = classObj.getConstructors();
		} catch(e) {
			try {
				try {
					classObj = java.lang.Class.forName("openaf.plugins." + aClassJava);
				} catch(e) {
					var ar = [];
					Object.values(getOPackPaths()).map(r => {
						$from(io.listFilenames(r))
						.ends(".jar")
						.select(r2 => {
							ar.push(new java.net.URL("file://" + r2));
						});
					});
					var cl = new java.net.URLClassLoader(ar, java.lang.Thread.currentThread().getContextClassLoader());
					classObj = java.lang.Class.forName("openaf.plugins." + aClassJava, true, cl);
				}
				
				methods = classObj.getMethods();
				constructors = classObj.getConstructors();
			} catch(e) {
				try {
					if(Object.prototype.toString.call(af.eval(aClassJava)) === '[object JavaObject]') {
						classObj = af.eval(aClassJava + ".getClass()");
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

					if (javaMethods.indexOf(String(method.getName())) < 0) {
						if (retList)
							ret.push(method.getName() + "");
						else {
							__outputConsoleCommentsNoEnd(CONSOLESEPARATOR + method.getName()); __outputConsoleCommentsNoEnd("(");
						}

						javaMethods.push(String(method.getName()));

						if (!retList) {
							var types = method.getParameterTypes();
							var first = true;
							for(var x in types) {
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
							var tempret = __desc(aClass + ".constructor", retList, true, javaMethods);
							ret = ret.concat(tempret);
							if (tempret.length < 1) {
								var listScope = af.getScopeIds();
								for(let i in listScope) {
									try {
										if (eval(listScope[i] + " instanceof Object") && 
										    eval(aClass + " instanceof " + listScope[i]))
												ret = ret.concat(__desc(String(listScope[i]), retList, true, javaMethods));
									} catch(e) {}
								}
							}
						}
					}
				}
				
				if (!aClass.match(/\.constructor$/) && !noRecursive)
					ret = ret.concat(__desc(af.eval(aClass + ".constructor.name"), retList, true, javaMethods));
				
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

			for(var i in methods) {
				if (methods[i] !== 'constructor') { ret.push(methods[i]); }
				if (!retList && javaMethods.indexOf(methods[i]) < 0) {
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
	var params = aParams.match(/^([^ ]+) +(.*)/, "");

	var _db;
	if (isUnDef(params[1])) {
		__outputConsoleError("Needs to be a DB object followed by a SQL statement");
		return;
	}

	_db = af.eval(params[1]);
	if (Object.prototype.toString.call(_db) != '[object DB]') {
		__outputConsoleError("Needs to be a DB object followed by a SQL statement");
		return;
	}

	var outputres = "";
	try {
		var res;
		var __start;
		__timeResult = __;
		
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
						outputres = printTable(res.results, con.getConsoleReader().getTerminal().getWidth(), returnOnly, __ansiflag && con.isAnsiSupported(), (isDef(__codepage) ? "utf" : __));
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
	} catch(e) {
		_db.rollback();
		throw e;
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
	if (isUnDef(aResult)) {
		if (isDef(aFlag) && aFlag.match(/off|0/i)) timeCommand = false;
		if (isDef(aFlag) && aFlag.match(/on|1/i)) timeCommand = true;
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
	if (aFlag == "") {
		if (colorCommand) {
			colorCommand = false;
			__previousAnsiFlag = __ansiflag;
			__ansiflag = false;
		} else {
			__ansiflag = true;
			__previousAnsiFlag = __ansiflag;
			colorCommand = true;
		}
	}

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
			//var oldcolorCommand = colorCommand;
			//colorCommand = false;
			t.addThread(function() {
				if (viewCommand) {
					try {
					__view(watchcmd, false, true);
					__outputConsoleCommentsEnd("Press 'q' to quit. (refreshed at " + new Date() + ")");
					} catch(e) { sprintErr(e); }
				} else {
					var out = "";
					try {
						out = __processCmdLine(watchcmd, true);
					} catch (e) {
						out = e.message;
					}
	
					if (isDef(out))
						if (beautifyCommand) out = String(stringify(out)).replace(/\\t/g, "\t").replace(/([^\\])\\n/g, "$1\n").replace(/\\r/g, "\r");
	
					__clear();
					__outputConsole(out);
					__outputConsoleCommentsEnd("Press 'q' to quit. (refreshed at " + new Date() + ")");
				}
				return 1;
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
			//colorCommand = oldcolorCommand;
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
	var __ores = "", c = __consoleFormat.helpLine;
	var __o = (s, nomd) => __ores += (nomd ? s : ow.format.withMD(s))+ "\n";
	if(isUnDef(aTerm) || aTerm.length <= 0) {
		__o("__help__     Display this help text");
		__o("__exit__     Exit this console");
		__o("__time__     Turns on or off the timing of any script command provided (default off)");
		__o("__output__   Turns on or off the output of commands (default on)");
		__o("__beautify__ Turns on or off the beautify of output (default on)");
		__o("__color__    Turns on or off the colorify of json output (default on)");
		__o("__desc__     Provides a description of the available methods for a class (example 'desc AF')");
		__o("__scope__    Lists the current OpenAF javascript scope loaded filtered by a regexp (example 'scope sha')");
		__o("__alias__    Create an alias for an openaf-console command line (example 'alias ola=print(\"hi\");')");
		__o("__watch__    Turns on or off an execution before every console prompt (example 'watch new Date();')");
		__o("__pause__    Pauses the output of a command if bigger than the terminal height (default off)");
		__o("__sql__      Executes a SQL query, over a db connection, displaying the result in a table (example 'sql adm select...')");
		__o("__dsql__     Returns the list of columns produced by a SQL query over a db connection.");
		__o("__esql__     Executes the SQL statement, over a db connection (example 'esql db update...')");
		__o("__diff__     Show differences between object A and B (example 'diff A with B'; accepts with/withNew/withChanges/withFull)");
		__o("__pin__      Pins the next command as a prefix for the next commands until an empty command (example 'pin sql db...')");
		__o("__table__    Tries to show the command result array as an ascii table.");
		__o("__view__     Tries to show the command result object as an ascii table.");
		__o("__multi__    Turns on or off the entry of multiline expressions (default on)");
		__o("__clear__    Tries to clear the screen.");
		__o("__purge__    Purge all the command history");
		__o("__[others]__ Executed as a OpenAF script command (example 'print(\"ADEUS!!!\");')");
	} else {
		var h;

		if (aTerm == "scope") {
			h = searchHelp("", __, ['scope']);
		} else {
			h = searchHelp(aTerm);
		}
		
		if (isArray(h)) {
			if (h.length == 1 && isDef(h[0].fullkey) && isDef(h[0].text)) {
				if (__ansiflag) {
					__o("**" + h[0].fullkey + "**");
					__o("**" + repeat(h[0].fullkey.length, HELPSEPARATOR_ANSI) + "**");
					__o(h[0].text, true);
				} else {
					__o(h[0].fullkey);
					__o(repeat(h[0].fullkey.length, HELPSEPARATOR));
					__o(h[0].text, true);
				}
			} else {
				if (h.length > 1) {
					for(var i in h) {
						__o(h[i].key);
					}
				} else {
					__o("Term '" + aTerm + "' not found.");
					c = __consoleFormat.errorLine;
				}
			}
		}
	}

	if (__ansiflag && con.isAnsiSupported()) {
		ansiStart();
		print(ow.format.withSideLine(__ores.slice(0, __ores.length-1), con.getConsoleReader().getTerminal().getWidth(), c, __, __consoleFormat.helpTheme));
		ansiStop();
	} else {
		__outputConsoleCommentsEnd(__ores);
	}
}

function __outputConsole(anOutput, colorify) {
	__outputConsoleEnd(anOutput, colorify);
}

function __outputConsoleNoEnd(anOutput, colorify) {
	if(__ansiflag && con.isAnsiSupported()) {
		//if (!__ansiColorFlag) jansi.AnsiConsole.systemInstall();
		//if (colorCommand && colorify) {
			//if (isDef(__codepage) && isString(__codepage)) 
			//	printnl(jansi.Ansi.ansi().boldOff().a(anOutput).a(jansi.Ansi.Attribute.RESET));
			//else
			//if (__ansiColorFlag)
			//	printnl(jansi.Ansi.ansi().boldOff().a(anOutput).a(jansi.Ansi.Attribute.RESET));
			//else
			ansiStart();
			printnl(jansi.Ansi.ansi().boldOff().a(anOutput).a(jansi.Ansi.Attribute.RESET));
			ansiStop();
		//} else {
			//if (isDef(__codepage) && isString(__codepage))
			//printnl(jansi.Ansi.ansi().boldOff().fg(jansi.Ansi.Color.CYAN).a(anOutput).a(jansi.Ansi.Attribute.RESET), __, __codepage);
			//else
			//printnl(jansi.Ansi.ansi().boldOff().a(anOutput).a(jansi.Ansi.Attribute.RESET));
		//}
		//if (!__ansiColorFlag) jansi.AnsiConsole.systemUninstall();
	} else {
		printnl(anOutput);
	}
}

function __outputConsoleEnd(anOutput, colorify) {
	//if (isDef(__codepage) && isString(__codepage)) anOutput = af.toEncoding(anOutput, __, __codepage);
	if(__ansiflag && con.isAnsiSupported()) {
		//if (!__ansiColorFlag) jansi.AnsiConsole.systemInstall();
		//if (colorCommand && colorify) 
		//   print(jansi.Ansi.ansi().boldOff().a(anOutput).a(jansi.Ansi.Attribute.RESET));
		//else
		//if (__ansiColorFlag)
		//	print(jansi.Ansi.ansi().boldOff().a(anOutput).a(jansi.Ansi.Attribute.RESET));
		//else
		ansiStart(); 
		print(jansi.Ansi.ansi().boldOff().a(anOutput).a(jansi.Ansi.Attribute.RESET)); 
		ansiStop();
		//if (!__ansiColorFlag) jansi.AnsiConsole.systemUninstall();
	} else {
		print(anOutput);
	}
}

function __outputConsoleComments(anOutputComment) {
	__outputConsoleCommentsEnd(CONSOLESEPARATOR + anOutputComment);
}

function __outputConsoleCommentsNoEnd(anOutputComment) {
	//if (isDef(__codepage) && isString(__codepage)) anOutputComment = af.toEncoding(anOutputComment, __, __codepage);
	if(__ansiflag && con.isAnsiSupported()) {
		//if (!__ansiColorFlag) jansi.AnsiConsole.systemInstall();
		//if (__ansiColorFlag)
		//	printnl(jansi.Ansi.ansi().bold().a(anOutputComment).a(jansi.Ansi.Attribute.RESET));
		//else
		ansiStart(); printnl(jansi.Ansi.ansi().bold().a(anOutputComment).a(jansi.Ansi.Attribute.RESET)); ansiStop();
		//if (!__ansiColorFlag) jansi.AnsiConsole.systemUninstall();
	} else {
		printnl(anOutputComment);
	}
}

function __outputConsoleCommentsEnd(anOutputComment) {
	//if (isDef(__codepage) && isString(__codepage)) anOutputComment = af.toEncoding(anOutputComment, __, __codepage);
	if(__ansiflag && con.isAnsiSupported()) {
		//if (!__ansiColorFlag) jansi.AnsiConsole.systemInstall();
		//if (__ansiColorFlag)
		//	print(jansi.Ansi.ansi().bold().a(anOutputComment).a(jansi.Ansi.Attribute.RESET));
		//else
		ansiStart(); print(ansiColor("BOLD", anOutputComment)); ansiStop();
		//if (!__ansiColorFlag) jansi.AnsiConsole.systemUninstall();
	} else {
		print(anOutputComment);
	}
}

function __outputConsoleError(anError) {
	//if (isDef(__codepage) && isString(__codepage)) anError = af.toEncoding(anError, __, __codepage);
	if(__ansiflag && con.isAnsiSupported()) {
		//if (!__ansiColorFlag) jansi.AnsiConsole.systemInstall();
		//if (__ansiColorFlag) 
		//	printErr(jansi.Ansi.ansi().boldOff().fg(jansi.Ansi.Color.RED).a(CONSOLESEPARATOR + anError).a(jansi.Ansi.Attribute.RESET));
		//else
		ansiStart(); printErr(jansi.Ansi.ansi().boldOff().fg(jansi.Ansi.Color.RED).a(CONSOLESEPARATOR + anError).a(jansi.Ansi.Attribute.RESET)); ansiStop();
		//if (!__ansiColorFlag) jansi.AnsiConsole.systemUninstall();
	} else {
		printErr(CONSOLESEPARATOR + anError);
	}
}

function __clear() {
	if(__ansiflag && con.isAnsiSupported()) {
		//if (!__ansiColorFlag) jansi.AnsiConsole.systemInstall();
		//cprintnl(jansi.Ansi.ansi().eraseScreen().cursor(0,0).reset());
		//if (!__ansiColorFlag) jansi.AnsiConsole.systemUninstall();
		cls();
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
		if (!String(e).match(/java\.io\.FileNotFoundException/)) throw e;
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

function __table(aCmd) {
	var __res = __processCmdLine(aCmd, true);
	if (isArray(__res) && __res.length > 0 && isObject(__res[0]) && isObject(__res[__res.length -1])) {
		var __pres = 0;
		if (pauseCommand) {
			var __lines = printTable(__res, con.getConsoleReader().getTerminal().getWidth(), true, colorCommand, (isDef(__codepage) ? "utf" : __)).split(/\n/);
			while(__pres >= 0) __pres = __pauseArray(__lines, __pres);
		} else {
			__outputConsole(printTable(__res, con.getConsoleReader().getTerminal().getWidth(), true, colorCommand, (isDef(__codepage) ? "utf" : __)));
		}
		return true;
	} else {
		__outputConsoleError("Not an array of maps object or empty array.");
		return true;
	}
	return false;
}

function __tree(aCmd) {
	if (aCmd.match(/^off$|^0$/i)) { __flags.CONSOLE.view = "map"; return; }
	if (aCmd.match(/^on$|^1$/i)) { __flags.CONSOLE.view = "tree"; return; }
	if (aCmd == "") {
		if (__flags.CONSOLE.view == "tree") {
			__outputConsoleComments("View tree is active")
		} else {
			__outputConsoleComments("View tree is not active")
		}
		return true
	}
	
	var __res = __processCmdLine(aCmd, true)
	if ((isArray(__res) || isMap(__res))) {
		var __pres = 0;
		if (pauseCommand) {
			var __lines = printTreeOrS(__res, con.getConsoleReader().getTerminal().getWidth(), { noansi: !colorCommand }).split(/\n/)
			while(__pres >= 0) __pres = __pauseArray(__lines, __pres)
		} else {
			__outputConsole(printTreeOrS(__res, con.getConsoleReader().getTerminal().getWidth(), { noansi: !colorCommand }))
		}
		return true
	} else {
		__outputConsoleError("Not an array or a map.")
		return true
	}
	return false
}

function __multi(aCmd) {
	if (aCmd.match(/^off$|^0$/i)) { multiCommand = false; return; }
	if (aCmd.match(/^on$|^1$/i)) { multiCommand = true; return; }
	if (aCmd == "") {
		if (multiCommand) {
			__outputConsoleComments("Multi-line is active.");
		} else {
			__outputConsoleComments("Multi-line is not active.");
		}
		return true;
	}
}

function __view(aCmd, fromCommand, shouldClear) {
	if (aCmd.match(/^off$|^0$/i) && fromCommand) { viewCommand = false; return; }
	if (aCmd.match(/^on$|^1$/i) && fromCommand) { viewCommand = true; return; }
	if (aCmd == "" && fromCommand) {
		if (viewCommand) {
			__outputConsoleComments("View is active.");
		} else {
			__outputConsoleComments("View is not active.");
		}
		return true;
	} else {
		var __res;
		try {
			//if (aCmd.trim().indexOf("{") < 0) __res = __processCmdLine(aCmd, true); else __res = eval("(" + aCmd + ")");
			__res = __processCmdLine(aCmd, true);
		} catch(e) {
			if (shouldClear) __clear();
			//if (isUnDef(__res)) __res = __processCmdLine(aCmd); 
			if (!isJavaException(e)) __showResultProcessCmdLine(__res, aCmd);
			throw e;
		}	
			
		if (shouldClear) __clear();
		if (outputCommand && (isMap(__res) || isArray(__res)) && Object.keys(__res).length > 0) {
			var __pres = 0, prefix = (colorCommand ? jansi.Ansi.ansi().a(jansi.Ansi.Attribute.RESET) : "");
			if (pauseCommand) {
				var __lines
				if (__flags.CONSOLE.view == "tree") {
					__lines = (prefix + printTreeOrS(__res, __, { noansi: !colorCommand })).split(/\n/)
				} else {
					__lines = (prefix + printMap(__res, __, (isDef(__codepage) ? "utf" : __), colorCommand)).split(/\n/)
				}
				while(__pres >= 0) __pres = __pauseArray(__lines, __pres);
			} else {
				if (__flags.CONSOLE.view == "tree") {
					__outputConsole(prefix + printTreeOrS(__res, __, { noansi: !colorCommand }))
				} else {
					__outputConsole(prefix + printMap(__res, __, (isDef(__codepage) ? "utf" : __), colorCommand))
				}
			}
			if (isDef(__timeResult) && timeCommand) __time(__timeResult);
			return true;
		} else {
			//__outputConsoleError("Not a map/array object or empty array/object.");
			__showResultProcessCmdLine(__res, aCmd);
			return true;
		}

		//return false;
	}
}

function __processCmdLine(aCommand, returnOnly) {
	var internalCommand = false;
	aCommand = aCommand.replace(/^ *([^ ].*)/, "$1");
	try {
		if (aCommand != "exit") {
			if (!isUnDef(__alias[aCommand.replace(/^([^ ]+).*/, "$1")])) {
				__aliasparam = aCommand.replace(/^[^ ]+ */, "");
				if(isUnDef(__aliasparam)) __aliasparam = "";
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
			if (aCommand.match(/^table(?: +|$)/)) {
				internalCommand = __table(aCommand.replace(/^table */, ""));
			}		
			if (aCommand.match(/^tree(?: +|$)/)) {
				internalCommand = true
				__tree(aCommand.replace(/^tree */, ""));
			}	
			if (aCommand.match(/^view(?: +|$)/)) {
				internalCommand = true;
				__view(aCommand.replace(/^view */, ""), true);
			}	
			if (aCommand.match(/^multi(?: +|$)/)) {
				internalCommand = true;
				__multi(aCommand.replace(/^multi */, ""), true);
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

				if (outputCommand && isDef(__res)) {
					if (isNull(__res)) return __res
					if (isByteArray(__res)) __res = af.fromBytes2String(__res)
					return __res;
				} else {
					return __;
				}
			}

		}
	} catch(e) {
		//__outputConsoleError(String(e));
		if (__ansiflag && con.isAnsiSupported()) {
			ansiStart(); 
			printErr(ow.format.withSideLine(String(e), con.getConsoleReader().getTerminal().getWidth(), __consoleFormat.errorLine, __consoleFormat.error, __consoleFormat.errorTheme)); 
			ansiStop();
		} else {
			__outputConsoleError(String(e));
		}
	}

	internalCommand = false;
}

function __showResultProcessCmdLine(__res, __cmd) {
	if(outputCommand && isDef(__res)) {
		if (pauseCommand) {
			var __pres = 0;
			var lines = [];
			if (beautifyCommand && !__cmd.trim().startsWith("sql") && !__cmd.trim().startsWith("esql") && !__cmd.trim().startsWith("dsql")) {
				if (colorCommand) 
					__lines = String(colorify(__res)).replace(/\\t/g, "\t").replace(/\\r/g, "\r").replace(/([^\\])\\n/g, "$1\n").split(/\n/);
				else
					__lines = String(stringify(__res)).replace(/\\t/g, "\t").replace(/\\r/g, "\r").replace(/([^\\])\\n/g, "$1\n").split(/\n/);
			} else {
				__lines = String(__res).replace(/\"/g, "").replace(/([^\\])\\n/g, "$1\n").split(/\n/);
			}
			while(__pres >= 0) __pres = __pauseArray(__lines, __pres);
		} else {
			if (beautifyCommand && !__cmd.trim().startsWith("sql") && !__cmd.trim().startsWith("esql") && !__cmd.trim().startsWith("dsql")) {
				if (colorCommand)
					__outputConsole(String(colorify(__res)).replace(/\\t/g, "\t").replace(/([^\\])\\n/g, "$1\n").replace(/\\r/g, "\r"), true);
				else
					__outputConsole(String(stringify(__res)).replace(/\\t/g, "\t").replace(/([^\\])\\n/g, "$1\n").replace(/\\r/g, "\r"));
			} else
				__outputConsole(__res);
		}	
	} 
	
	if (isDef(__timeResult) && timeCommand && !__cmd.match(/^time(?: +|$)/)) __time(__timeResult);
}

function __checkVersion() {
	function openAFAutoUpdate() {
		function getVer(aURLs) {
			var foundIt = false, res;
			for (var ii = 0; ii < aURLs.length && !foundIt; ii++) {
				try {
					res = $rest({ throwExceptions: true })
					.get(aURLs[ii]);
					foundIt = true;
				} catch(e) { }
			}
		
			return res;
		}

		function getFile(aURLs, aSource, aTarget) {
			var foundIt = false, res;
			for (var ii = 0; ii < aURLs.length && !foundIt; ii++) {
				try {
					res = $rest({ throwExceptions: true, downloadResume: __autoupdateResume })
					.get2File(aTarget, aURLs[ii] + "/" + aSource);
					foundIt = true;
				} catch(e) { }
			}
		
			return res;
		}
		
		var curVersion = getVersion();
		//var remoteBuild = getVer(__openafBuild);
		var remoteRelease = getVer(__openafRelease);

		if (curVersion < remoteRelease) {
			io.cp(getOpenAFJar(), getOpenAFPath() + "/openaf.jar.old");
			io.cp(getOpenAFJar() + ".orig", getOpenAFPath() + "/openaf.jar.old.orig");
			getFile(__openafDownload, "openaf-" + remoteRelease + ".jar.repacked", getOpenAFPath() + "/openaf.jar.new");
			getFile(__openafDownload, "openaf-" + remoteRelease + ".jar", getOpenAFPath() + "/openaf.jar.new.orig");
			__message += "OpenAF will update to version " + remoteRelease + " on exit; ";
			addOnOpenAFShutdown(() => {
				__outputConsoleComments("Please hold on, updating to OpenAF version: " + remoteRelease + "...");
				io.writeFileBytes(getOpenAFJar() + ".orig", io.readFileBytes(getOpenAFPath() + "/openaf.jar.new.orig"));
				io.rm(getOpenAFPath() + "/openaf.jar.new.orig");
				io.writeFileBytes(getOpenAFJar(), io.readFileBytes(getOpenAFPath() + "/openaf.jar.new"));
				io.rm(getOpenAFPath() + "/openaf.jar.new");
				__outputConsoleComments("... Done! The previous OpenAF version " + curVersion + " is now available as openaf.jar.old and openaf.jar.old.orig.");
				__outputConsoleComments("Move them to openaf.jar and openaf.jar.orig to revert, if needed. Add/Update '__autoupdate = false' in the ~/.openaf-console_profile file to disable auto-update.");
			});
		}
	}


	var t = new Threads();
	t.addThread(function() {
		var current = checkLatestVersion(); 
		var myversion = getVersion();
		var anotherOne = false;

		if (current != -1) {
			if (current > myversion) {
				ow.loadServer();
				ow.server.checkIn(getOpenAFPath() + "/openaf_update.pid", aPid => {
					anotherOne = true;
					return true;
				}, () => {
					anotherOne = true;
				});
				if (__autoupdate && !anotherOne)
					openAFAutoUpdate();
				else
					__message += "There is a new OpenAF version available: " + current + ". Run 'openaf --update' to update; ";
			}
		}
		t.stop(true);
	});
	t.startNoWait();
}

function __pauseArray(aText, aStart) {
	var height = con.getConsoleReader().getTerminal().getHeight();
	var lines = aText.length;

	if (lines <= (height - 1)) {
		__outputConsole(aText.join(__separator));
		return -1;
	}

	if (isUnDef(aStart) || aStart < 0)
		aStart = 0;
	else
		if(aStart > (lines - height +1)) aStart = (lines - height +1);

	__outputConsole(aText.slice(aStart, (aStart + height) -1).join(__separator));

	if ((aStart + height -1) < (lines )) {
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
							return lines - height - 1;
						}
					}
					//pgup
					if(c.charCodeAt(0) == 53) {
						c = con.readChar("") + "";
						if (c.charCodeAt(0) == 126) {
							if (aStart - height -1 < 0)
								return 0;
							else
								return aStart - height + 1;
						}
					}
					//pgdw
					if(c.charCodeAt(0) == 54) {
						c = con.readChar("") + "";
						if (c.charCodeAt(0) == 126) {
							return aStart + height - 1;
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
			return aStart + height - 1;
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
__initializeCon();

var con = new Console();
if (__ansiColorFlag) ansiStart();
//var __ansiflag = con.isAnsiSupported();
var jansi = JavaImporter(Packages.org.fusesource.jansi);
var __ansiflag = (isDef(__conAnsi) ? __conAnsi : (jansi != null && isDef(jansi)) ? con.isAnsiSupported() : false);
var cmd = "";
var timeCommand = false; var start; var end;
var outputCommand = true;
var beautifyCommand = true;
var colorCommand = __ansiflag;
var pauseCommand = true;
var watchCommand = false;
var viewCommand = __ansiflag;
var multiCommand = true;
var watchLine = "";
var __previousAnsiFlag = __ansiflag;

if (__ansiflag) CONSOLESEPARATOR = CONSOLESEPARATOR_ANSI;

// Tweak a little
con.getConsoleReader().setHistoryEnabled(true);
con.getConsoleReader().setExpandEvents(false);
//java.lang.System.setProperty("jansi.passthrough", true);

// Read profile
try {
	__readProfile(__gHDir() + "/" + CONSOLEPROFILE);
} catch(e) {
	printErr("Error while loading " + __gHDir() + "/" + CONSOLEPROFILE + ": " + String(e));
}

// Ensure __consoleFormat
if (isUnDef(__consoleFormat)) __consoleFormat = (!ansiWinTermCap() || consoleOldTheme ? {
	error     : "BOLD,WHITE",
	errorLine : "BOLD,RED",
	helpLine  : "BOLD,BLUE",
    init      : "BOLD,WHITE",
    initLine  : "BOLD,WHITE",
    initTheme : { lmiddle: CONSOLESEPARATOR_ANSI.trim() },
	errorTheme: ow.format.withSideLineThemes().simpleLine,
	helpTheme : ow.format.withSideLineThemes().simpleLine
} : {
	error     : "BOLD,WHITE",
	errorLine : "RED",
	helpLine  : "BLUE",
    init      : "BOLD,WHITE",
    initLine  : "FAINT,WHITE",
    initTheme : ow.format.withSideLineThemes().openBottomCurvedRect,
	errorTheme: ow.format.withSideLineThemes().openCurvedRect,
	helpTheme : ow.format.withSideLineThemes().openCurvedRect,
    doneLine  : "FAINT,WHITE",
    doneTheme : ow.format.withSideLineThemes().openTopCurvedRect
});

// Startup
if (__ansiflag && con.isAnsiSupported()) {
   ansiStart();
   print(ow.format.withSideLine(" OpenAF console (OpenAF version " + getVersion() + " (" + getDistribution() + ")) (type help for commands)", __, __consoleFormat.initLine, __consoleFormat.init, __consoleFormat.initTheme));
   ansiStop();
} else {
   __outputConsoleComments("OpenAF console (OpenAF version " + getVersion() + " (" + getDistribution() + ")) (type help for commands)");
}
var historyFile;
var jLineFileHistory;

// Initializations
plugin("Threads");
var initThread = new Threads();
initThread.addThread(function(uuid) {
	// History file
	historyFile = __gHDir() + "/" + CONSOLEHISTORY;
	jLineFileHistory = new Packages.jline.console.history.FileHistory(new java.io.File(historyFile));
	con.getConsoleReader().setHistory(jLineFileHistory);
	con.getConsoleReader().addCompleter(
		new Packages.openaf.jline.OpenAFConsoleCompleter(function(buf, cursor, candidates) {
			if (buf == null) return null;
			var ret = -1;

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
						var tmpList = __scope(tmpbuf[1], true).concat(Object.keys(__alias));
						for(let elem in tmpList) {
							if(tmpList[elem].indexOf(tmpbuf[1]) == 0) {							
								candidates.add(tmpList[elem]);
							}
						}
					} catch(e) {
					}
				}
			}

			return candidates.isEmpty() ? - 1 : Number(ret);
		})
	);
	con.getConsoleReader().getCompletionHandler().setPrintSpaceAfterFullCompletion(false);

	if (String(java.lang.System.getProperty("os.name")).match(/Windows/)) {
		try {
			//var res = $sh("chcp").get(0).stdout.replace(/.+ (\d+)\r\n/, "$1");
			var res = con.getConsoleReader().getTerminal().getOutputEncoding();
			if (isDef(res)) {
				__codepage = String(res);
			}
		} catch(e) { }
	}

        if (io.getDefaultEncoding() != "UTF-8") __message += "Please ensure that the java option -D\"file.encoding=UTF-8\" is included (this can be achieved by executing 'cd " + getOpenAFPath() + " && ./oaf --install'); ";
	if (!noHomeComms) __checkVersion();
	initThread.stop();
});
initThread.startNoWait();

if(__ansiflag && con.isAnsiSupported()) {
	Packages.openaf.SimpleLog.setNFunc(function(s) { 
		ansiStart(); printErr(ow.format.withSideLine(String(s), con.getConsoleReader().getTerminal().getWidth(), __consoleFormat.errorLine, __consoleFormat.error, __consoleFormat.errorTheme)); ansiStop();
	});
}

addOnOpenAFShutdown(() => {
        if (__ansiflag && con.isAnsiSupported()) {
   		ansiStart();
		printnl("\r");
		print(ow.format.withSideLine(__, __, __consoleFormat.doneLine, __consoleFormat.done, __consoleFormat.doneTheme));
  		ansiStop();
	}
});

if (__expr.length > 0) cmd = __expr;
cmd = cmd.trim();

while(cmd != "exit") {
	if (viewCommand) {
		__view(cmd, false);
	} else {
		__showResultProcessCmdLine(__processCmdLine(cmd), cmd);
	}

	if (__message != "") {
		__outputConsoleComments(__message);
		__message = "";
	}
	if (watchCommand) {
		var watchresult;
		try {
			watchresult = __processCmdLine(watchLine, true);
			if (isUnDef(watchresult)) watchresult = "";
			if (beautifyCommand) watchresult = String(stringify(watchresult)).replace(/\\t/g, "\t").replace(/([^\\])\\n/g, "$1\n").replace(/\\r/g, "\r");
		} catch(e) { watchresult = "ERROR: " + e.message; watchCommand = false; }
		//cmd = con.readLinePrompt("[ " + watchresult + " ]\n" + __pinprefix + "> ").trim();
		//if(__ansiflag && con.isAnsiSupported() && __ansiColorFlag)
		if (isDef(watchresult) && watchresult.length > 0 && watchresult != '""') { ansiStart(); print("[ " + watchresult + " ]\n"); ansiStop(); }
		//else
		//	print("[" + watchresult + " ]\n");
	}
	if (!multiCommand) {
		cmd = con.readLinePrompt(__pinprefix + "> ").trim();
	} else {
		cmd = askN(t => {
			if (t.length > 0) 
				return __pinprefix + "| ";
			else
				return __pinprefix + "> ";
		}, t => {
			if (t.endsWith("\n\n") || RESERVEDWORDS.split("|").indexOf(t.trim().split(/ +/)[0]) >= 0 || Object.keys(__alias).indexOf(t.trim().split(/ +/)[0]) >= 0 ) return true;
			try {
				//new Function(t);
				newFn(t)
				return true;
			} catch(e) {
				if (String(e).startsWith("SyntaxError:")) {
					return false;
				} else {
					return true;
				}
			}
		}, con).trim();
	}
	
	if (cmd == "") {
		__pinflag = false;
		__pinprefix = "";
	} else {
		if (__pinflag) {
			cmd = __pinprefix + " " + cmd;
		}
	}
	
	if(isDef(jLineFileHistory)) jLineFileHistory.flush();
}

__exitActions.map(action => {
	__processCmdLine(action);
});

exit(0);
