// OpenWrap v2
// Author: Nuno Aguiar
// Server

OpenWrap.server = function() {
	return ow.server;
};

/**
 * <odoc>
 * <key>ow.server.checkIn(aPidFile, onAlreadyRunning, onShutdown, anExitCode) : Boolean</key>
 * Will check if a server for the give aPidFile is running or not. Will return false if it's running 
 * and server start shouldn't proceed. Will return true if nothing is running and server start should proceed.
 * Optionally you can provide an onShutdown function to execute any code needed upon controlled shutdown
 * of the server and provide an onAlreadyRunning function (that will received the corresponding aPidFile).
 * If the onAlreadyRunning function returns false the process will exit with -1 (or the anExitCode provided),
 * if true will continue processing.
 * Example:\
 * \
 * var params = processExpr();\
 * ow.server.checkIn("server.pid", function(aPid) {\
 *    log("there is another me " + aPid + " already running... bye!");\
 *    if (isDefined(params.restart)) {\
 *       log("I will kill him!");\
 *       pidKill(ow.server.getPid(aPid), true);\
 *       return true;\
 *    } else {\
 *       log("... I will die now...");\
 *       return false;\
 *    }\
 * }, function() {\
 *    log("I'm going to die....");\
 * });\
 * \
 * ow.server.daemon();\
 * \
 * (available after ow.loadServer())
 * </odoc>
 */
OpenWrap.server.prototype.checkIn = function(aPidFile, onAlreadyRunning, onShutdown, anExitCode) {
	var ret = false;
	if (isUndefined(anExitCode)) anExitCode = -1;
	
	if (isUndefined(aPidFile)) aPidFile = "server.pid";
	ret = pidCheckIn(aPidFile);
	if (ret && isDefined(onShutdown)) addOnOpenAFShutdown(onShutdown);
	if (!ret) {
		ret = onAlreadyRunning(aPidFile);
		if (!ret) 
			exit(anExitCode);
		else {
			pidCheckIn(aPidFile);
			if (isDefined(onShutdown)) addOnOpenAFShutdown(onShutdown);
		}
	}
	
	return ret;
}

/**
 * <odoc>
 * <key>ow.server.processArguments(aRouterFunction, aMainSeparator, aSubSeparator) : Array</key>
 * Processes the __expr (-e or opack arguments) value for arguments splitting first by aMainSeparator (if not defined
 * defaults to " ") and then splitting by aSubSeparator (if not defined defaults to "="). Example with 
 * __expr = "opensomething exec count=5=123 some=1\
 * \
 * ow.server.processArguments(function(aParam) { ... });\
 * \
 * Will produce function calls where aParam will have the following values:\
 * \
 * "opensomething"\
 * "exec"\
 * [ "count", "5", "123" ]\
 * [ "some", "1" ]\
 * \
 * (available after ow.loadServer())
 * </odoc>
 */
OpenWrap.server.prototype.processArguments = function(aRouterFunction, aMainSeparator, aSubSeparator) {
	var sep = isDefined(aMainSeparator) ? aMainSeparator : " ";
	var subsep = isDefined(aSubSeparator) ? aSubSeparator : "=";
	
	var params = splitBySeparator(__expr, sep);
	for(var param in params) {
		aRouterFunction(params[param].match(subsep) ? splitBySeparator(params[param], subsep) : [ params[param] ] );
	};
}

/**
 * <odoc>
 * <key>ow.server.daemon(aTimePeriod, aPeriodicFunction)</key>
 * Will start an infinite cycle to keep a server running. If aTimePeriod (in ms) is not provided a default of 5 seconds
 * will be considered. Optionally you can provide aPeriodicFunction to run every aTimePeriod. If this aPeriodicFunction
 * returns true, the infinite cycle is broken.
 * (available after ow.loadServer())
 * </odoc>
 */
OpenWrap.server.prototype.daemon = function(aTimePeriod, aPeriodicFunction) {
	if (isUndefined(aTimePeriod)) aTimePeriod = 5000;
	var shouldStop = false;
	
	while(!shouldStop) {
		if (isDefined(aPeriodicFunction)) shouldStop = aPeriodicFunction();
		if (!shouldStop) sleep(aTimePeriod, true);
	}
}

/**
 * <odoc>
 * <key>ow.server.simpleCheckIn(aName)</key>
 * If aName is provided it will check for 'aName.pid'. If the pid is running it will stop the current execution unless 
 * stop or restart is provided as a script parameter.
 * If stop is provided as a script parameter it will stop execution and try to kill the existing pid (force stop will
 * try to kill it anyway).
 * If restart is provided as a script parameter it will continue execution and try to kill the existing pid.
 * </odoc>
 */
OpenWrap.server.prototype.simpleCheckIn = function(aName) {
	if (isUnDef(aName)) return;
	
	var p = processExpr();
	var s = ow.server.checkIn(aName + ".pid", function(aPid) {
		if (isDef(p.restart) || isDef(p.stop) || isDef(p.forcestop)) {
			if (isDef(p.forcestop) || !pidKill(ow.server.getPid(aPid), false)) {
				pidKill(ow.server.getPid(aPid), true);
			}
			var didDie = !(pidCheck(aPid));
			
			if (isDef(p.restart) &&  didDie) {
				log("Restarting " + aName);
				return true;
			}
			if (isDef(p.stop) || isDef(p.forcestop)) {
				if (didDie) {
					log("Stopped " + aName);
					exit(0);
				} else {
					log("Failed to stop " + aName + " (" + aPid + ")");
					exit(-1);
				}
			}
		}
		if (isDef(p.status)) {
			var pid = ow.server.getPid(aPid);
			var word = (pidCheck(pid) ? "Running on" : "Not running but registered with")
			if (isDef(pid)) log(word + " pid = " + pid);
			return false;
		}
		return false;
	});
	
	if (isDef(p.status) && s) {
		log("Not running");
		exit(0);
	}
	
	__expr = __expr.replace(/( *)(start|stop|restart|status)( *)/i, "$1$3");
}

/**
 * <odoc>
 * <key>ow.server.getPid(aPidFile) : String</key>
 * Retrieve the server pid on the given aPidFile.
 * (available after ow.loadServer())
 * </odoc>
 */
OpenWrap.server.prototype.getPid = function(aPidFile) {
	return io.readFileString(aPidFile);
}

//-----------------------------------------------------------------------------------------------------
// OpenAF Server
//-----------------------------------------------------------------------------------------------------
OpenWrap.server.prototype.openafServer = {
	/**
	 * <odoc>
	 * <key>ow.server.openafServer.start(aId, aPort, notLocal)</key>
	 * Starts an internal JMX server with a give optional aId. If there is a need to access it externally 
	 * (do keep in mind security) you can provide also aPort. This server allows for the load or execution 
	 * of OpenAF scripts. In extreme cases you can use notLocal = true to make the server available outside
	 * the localhost (NOT ADVISABLE!).
	 * </odoc>
	 */
	start: function(aId, aPort, notLocal) {
		plugin("JMXServer");
		this.jmxs = new JMXServer("com.openaf:type=OpenAFServer-" + aId);
		this.jmxs.start(aPort, !notLocal);
		this.jmxs.addBean({},
		  function(key) { },
		  function(key, value) { },
		  function(op, params) {
		  	switch(op) {
		  	case "load": return ow.server.jmx.serverExec(params, function(f) { 
		  		__pmIn = jsonParse(Packages.wedo.open.utils.PMStringConvert.toJSON(Packages.openaf.OpenAF.__pmIn));
		  		load(f);
		  		Packages.openaf.OpenAF.__pmOut = Packages.wedo.open.utils.PMStringConvert.fromJSON(stringify(__pmOut)); });
		  	case "exec": return ow.server.jmx.serverExec(params, function(f) { 
				__pmIn = jsonParse(Packages.wedo.open.utils.PMStringConvert.toJSON(Packages.openaf.OpenAF.__pmIn));
		  		var res = af.eval(f); 
		  		Packages.openaf.OpenAF.__pmOut = Packages.wedo.open.utils.PMStringConvert.fromJSON(stringify(__pmOut));
				return res; }); 
		    }
		  }
		);
	},
	
	/**
	 * <odoc>
	 * <key>ow.server.openafServer.exec(aId, aScript, aServerPid)</key>
	 * Tries to execute the given aScript locally or in the aServerPid provided (created by a ow.server.openafServer.start).
	 * Optionally you can also specify aId.
	 * </odoc>
	 */
	exec: function(aId, aScript, aServerPid) {
		ow.server.jmx.call(ow.server.jmx.localConnect(aServerPid), "com.openaf:type=OpenAFServer-" + aId, "exec", aScript);
	},
	
	/**
	 * <odoc>
	 * <key>ow.server.openafServer.load(aId, aScriptFilePath, aServerPid)</key>
	 * Tries to execute the given aScriptFilePath locally or in the aServerPid provided (created by a ow.server.openafServer.start).
	 * Optionally you can also specify aId.
	 * </odoc>
	 */
	load: function(aId, aScriptFilePath, aServerPid) {
		ow.server.jmx.call(ow.server.jmx.localConnect(aServerPid), "com.openaf:type=OpenAFServer-" + aId, "load", aScriptFilePath);
	},
	
	/**
	 * <odoc>
	 * <key>ow.server.openafServer.stop()</key>
	 * Attempts to stop the existing server.
	 * </odoc>
	 */
	stop: function() {
		this.jmxs.stop();
	}
}


//-----------------------------------------------------------------------------------------------------
// JMX
//-----------------------------------------------------------------------------------------------------
OpenWrap.server.prototype.jmx = {
	/**
	 * <odoc>
	 * <key>ow.server.jmx.localConnect(aPid) : JMX</key>
	 * Tries to connect with a local aPid via JMX and returns a JMX plugin object instance. If no aPid is
	 * provided it will try to retrieve the current process pid and connect to it.
	 * </odoc>
	 */
	localConnect: function(aPid) {	
		plugin("JMX");
		if (isUndefined(aPid)) aPid = getPid();
		return new JMX((new JMX()).attach2Local(aPid).URL);
	},
	
	/**
	 * <odoc>
	 * <key>ow.server.jmx.serverExec(aParamsArray, aFunction)</key>
	 * Helper function to be used with JMXServers. Receives aParamsArray passed on the JMX bean operations handling function
	 * and will call aFunction passing the parameters as arguments and converting the returned result into a JSON string to
	 * be transmitted to the calling JMX client. Example:\
	 * \
	 * plugin("JMX");\
	 * var jmxs = new JMXServer("com.openaf:type=server");\
	 * jmxs.start();\
	 * \
	 * var c = 0;\
	 * jmxs.addBean({"count": "long", "increment": "operation", "resetTo": "operation"},\
	 *   function(key) { if (key == "count") return c; },\
	 *   function(key, value) { if (key == "count") c = value; },\
	 *   function(op, params) { switch(op) {\
	 *      case "increment": return ow.server.jmx.serverExec(params, function() { return ++c; });\
	 *      case "resetTo"  : return ow.server.jmx.serverExec(params, function(v) { c = v; });\
	 *      }\
	 *   }\
	 * ); 
	 * </odoc>
	 */
	serverExec: function(aParams, aFunction) {
		var res = aFunction.apply(this, aParams);
		return stringify(res);
	},
	
	/**
	 * <odoc>
	 * <key>ow.server.jmx.call(aJMXObject, objName, aOperation, param1, ...) : value</key>
	 * Invokes aOperation on the object objName using aJMXObject connected to a server using ow.server.jmx.serverExec. Optionally
	 * you can provide extra arguments to be passed to the jmx remote operation. Example (based on ow.server.jmx.serverExec):\
	 * \
	 * var jmx = ow.loadServer().jmx.localConnect("12345");\
	 * ow.server.jmx.call(jmx, "com.openaf:type=server", "increment"); // 1\
	 * ow.server.jmx.call(jmx, "com.openaf:type=server", "resetTo", 10); // 10
	 * </odoc>
	 */
	call: function(aJMX, objName, aOp) {
		var obj = aJMX.getObject(objName);
		var res = obj.exec(aOp, Array.prototype.slice.call(arguments).slice(3), []);
		return jsonParse(res);
	},
	
	/**
	 * <odoc>
	 * <key>ow.server.jmx.get(aJMXObject, objName, aProperty) : value</key>
	 * Returns the current value of aProperty on the object objName using aJMXObject connected to a JMX server. 
	 * </odoc>
	 */
	get: function(aJMX, objName, aVar) {
		var obj = aJMX.getObject(objName);
		return obj.get(aVar);
	},
	
	/**
	 * <odoc>
	 * <key>ow.server.jmx.set(aJMXObject, objName, aProperty, aNewValue)</key>
	 * Sets aProperty with the value aNewValue on the object objName using aJMXObject connected to a JMX server.
	 * </odoc>
	 */
	set: function(aJMX, objName, aVar, newValue) {
		var obj = aJMX.getObject(objName);
		obj.set(aVar, newValue);
	}
};


//-----------------------------------------------------------------------------------------------------
// AUTHENTICATION
//-----------------------------------------------------------------------------------------------------
/**
 * <odoc>
 * <key>ow.server.authAppGen(anAppPassword, aUserPassword, a2FAToken, numRounds) : String</key>
 * Generates an application token to be used for server communication given anAppPassword (encrypted or not),
 * an application user password (aUserPassword encrypted or not) and an application a2FAToken. Optionally you
 * can specify the numRounds for the bcrypt function used (if absent, bcrypt won't be used).\
 * \
 * Example:\
 * \
 * ow.loadServer();\
 * $ch("a").createRemote("http://some.server:1234/a", __, (h) => {\
 *    h.login("user", ow.server.authAppGen("...", "...", "..."));\
 * });\
 * \
 * </odoc>
 */
OpenWrap.server.prototype.authAppGen = function(anAppPassword, aUserPassword, a2FAToken, numRounds) {
	_$(anAppPassword)
	 .isString("The app password is not a string.")
	 .check((v) => { return v.length >= 16; }, "The app password needs to be, at least, 16 chars.")
	 .$_("Please provide an app password.");
	
	_$(aUserPassword)
	 .isString("The user password is not a string.")
	 .check((v) => { return v.length >= 16; }, "The user password needs to be, at least, 16 chars.")
	 .$_("Please provide a user password.");

	_$(a2FAToken)
	 .isString("The 2FA token is not a string.")
	 .check((v) => { return v.length >= 16; }, "The 2FA token needs to be 16 chars or more (encrypted).")
	 .$_("Please provde a 2FA token");

	numRounds = _$(numRounds)
	 .isNumber()
	 .default(-1);

	var appPass = String(Packages.openaf.AFCmdBase.afc.dIP(anAppPassword));
	var aPass = String(Packages.openaf.AFCmdBase.afc.dIP(aUserPassword));
	var token = String(Packages.openaf.AFCmdBase.afc.dIP(a2FAToken));

	if (numRounds < 1) {
		return "Z" + af.encrypt(sha512(aPass + String(af.get2FAToken(token))), appPass);
	} else {
		return "Z" + af.encrypt(bcrypt(sha512(aPass + String(af.get2FAToken(token))), __, numRounds), appPass);
	}
};

/**
 * <odoc>
 * <key>ow.server.authAppCheck(anAppPassword, aReceivedToken, aUserPassword, a2FAToken, useBCrypt) : boolean</key>
 * Checks the validity of the aReceivedToken given anAppPassword, corresponding aUserPasswork and a2FAToken returning
 * true if it's valid or false otherwise. If useBCrypt = 1 then an extra bcrypt function will be added.\
 * \
 * Example:\
 * \
 * ow.loadServer();\
 * $ch("a").expose(1234, "/a", (u, p) => {\
 *    if (u == "a" &amp;&amp; \
 *        ow.server.authAppCheck("...", p, "...", "...")) \
 *      return true; \
 *    else \
 *      return false;\
 * });\
 * \
 * </odoc>
 */
OpenWrap.server.prototype.authAppCheck = function(anAppPassword, aTestString, aUserPassword, a2FAToken, useB) {
	_$(anAppPassword)
	.isString()
	.check((v) => { return v.length >= 16; }, "The app password needs to be, at least, 16 chars.")
	.$_("Please provide an app password.");

	_$(a2FAToken)
	 .isString()
	 .check((v) => { return v.length >= 16; }, "The 2FA token needs to be 16 chars or more (encrypted).")
	 .$_("Please provde a 2FA token");

	var appPass = String(Packages.openaf.AFCmdBase.afc.dIP(anAppPassword));
	var aPass = String(Packages.openaf.AFCmdBase.afc.dIP(aUserPassword));
	var token = String(Packages.openaf.AFCmdBase.afc.dIP(a2FAToken));

	var d = (new Date()).getTime();
	var res = false, tries = 0;
	do {
		if (tries == 1) d = d - 30000;
		if (tries == 2) d = d + 30000;

		if (useB) {
			res = bcrypt(sha512(aPass + String(af.get2FAToken(token, d))), af.decrypt(aTestString.substring(1), appPass));
		} else {
			res = sha512(aPass + String(af.get2FAToken(token, d))) == af.decrypt(aTestString.substring(1), appPass);
		}
		tries++;
	} while(res == false && tries < 3);
	return res;
};

OpenWrap.server.prototype.auth = function(aIniAuth, aKey, aCustomFunction) {
	this.aListOfAuths = {};
	this.lockTimeout = 15 * 60;
	this.triesToLock = 3;

	/**
	 * <odoc>
	 * <key>ow.server.auth.setCustomFunction(aCustomFunction)</key>
	 * Sets a custom authentication function that receives the provided user and password and should return true if
	 * authenticated or false otherwise.
	 * </odoc>
	 */
	this.setCustomFunction = function(aCustomFunction) {
		if (isDef(aCustomFunction) && isFunction(aCustomFunction)) {
			this.customFunction = aCustomFunction;
		}
	};

	/**
	 * <odoc>
	 * <key>ow.server.auth.setLockTimeout(aTimeout)</key>
	 * Set the current lock timeout in seconds. Defaults to 15 minutes.
	 * </odoc>
	 */
	this.setLockTimeout = function(aTimeout) {
		this.lockTimeout = aTimeout;
	};

	/**
	 * <odoc>
	 * <key>ow.server.auth.setTriesToLock(numberOfTries)</key>
	 * Set the current number of wrong tries until a user is locked. Defaults to 3.
	 * </odoc>
	 */
	this.setTriesToLock = function(numberOfTries) {
		this.triesToLock = numberOfTries;
	};
	
	/**
	 * <odoc>
	 * <key>ow.server.auth.isLocked(aUser) : boolean</key>
	 * For a given aUser returns if the user is currently considered as lock or not.
	 * </odoc>
	 */
	this.isLocked = function(aUser) {
		if (isUnDef(this.aListOfAuths[aUser])) throw "User not found";
		ow.loadFormat();
		return isDef(this.aListOfAuths[aUser].l) && ow.format.dateDiff.inSeconds(this.aListOfAuths[aUser].l) < this.lockTimeout;
	};

	/**
	 * <odoc>
	 * <key>ow.server.auth.initialize(aPreviousDumpMap, aKey, aCustomFunc)</key>
	 * Initializes with a previous dump from ow.server.auth.dump or ow.server.auth.dumpEncrypt (including an optional aKey if used).
	 * Optionally aCustomFunc can be provided as a custom authentication function that receives the provided user and password and should return true if
	 * authenticated or false otherwise.
	 * </odoc>
	 */
	this.initialize = function(aIniAuth, aKey, aCustomFunc) {
		if (isString(aIniAuth)) {
			this.aListOfAuths = jsonParse(af.decrypt(aIniAuth, (isDef(aKey) ? aKey : __)));
		} else {
			this.aListOfAuths = aIniAuth;
		}
		if (isUnDef(this.aListOfAuths)) this.aListOfAuths = {};
		this.setCustomFunction(aCustomFunc);
	};
	
	/**
	 * <odoc>
	 * <key>ow.server.auth.dump() : Map</key>
	 * Dumps the current authentication list into a Map.
	 * </odoc>
	 */
	this.dump = function() {
		return this.aListOfAuths;
	};

	/**
	 * <odoc>
	 * <key>ow.server.auth.dumpEncrypt(aKey) : Map</key>
	 * Dumps the current authentication list into an encrypted string (optionally using an encryption aKey).
	 * </odoc>
	 */
	this.dumpEncrypt = function(aKey) {
		return af.encrypt(stringify(this.aListOfAuths), (isDef(aKey) ? aKey : __));
	};
	
	/**
	 * <odoc>
	 * <key>ow.server.auth.add(aUser, aPass, aKey)</key>
	 * Adds the aUser and aPass to the current authentication list. Optionally a 2FA aKey.
	 * </odoc>
	 */
	this.add = function(aUser, aPass, aKey) {
		this.aListOfAuths[aUser] = {
			p: sha512(Packages.openaf.AFCmdBase.afc.dIP(aPass)),
			k: aKey
		};
	};

	/**
	 * <odoc>
	 * <key>ow.server.auth.setExtra(aUser, aX)</key>
	 * Sets an extra object (aX) to be associated with aUser (for example, the correspondings permissions).
	 * You can later retrieve this extra object with ow.server.auth.getExtra.
	 * </odoc>
	 */
	this.setExtra = function(aUser, aX) {
		if (isUnDef(this.aListOfAuths[aUser])) throw "User not found";

		var user = this.aListOfAuths[aUser];
		user.x = aX;
	};

	/**
	 * <odoc>
	 * <key>ow.server.auth.getExtra(aUser) : Object</key>
	 * Gets the extra object associated with aUser (previously set with ow.server.auth.setExtra).
	 * </odoc>
	 */
	this.getExtra = function(aUser) {
		if (isUnDef(this.aListOfAuths[aUser])) throw "User not found";

		return this.aListOfAuths[aUser].x;
	};
	
	/**
	 * <odoc>
	 * <key>ow.server.auth.del(aUser)</key>
	 * Removes the aUSer from the current authentication list.
	 * </odoc>
	 */
	this.del = function(aUser) {
		if (isUnDef(this.aListOfAuths[aUser])) throw "User not found";

		delete this.aListOfAuths[aUser];
	};

	/**
	 * <odoc>
	 * <key>ow.server.auth.is2FA(aUser) : boolean</key>
	 * Returns true if aUser has 2FA authentication, false otherwise.
	 * </odoc>
	 */
	this.is2FA = function(aUser) {
		if (isUnDef(this.aListOfAuths[aUser])) throw "User not found";

		return isDef(this.aListOfAuths[aUser].k);
	};

	/**
	 * <odoc>
	 * <key>ow.server.auth.loadFile(aFile, aKey)</key>
	 * Loads aFile (previously saved with ow.server.auth.saveFile), optionally providing aKey, (re)initializing 
	 * the current authentication information.
	 * </odoc>
	 */
	this.loadFile = function(aFile, aKey) {
		this.initialize(io.readFileString(aFile), aKey);
	};

	/**
	 * <odoc>
	 * <key>ow.server.auth.saveFile(aFile, aKey)</key>
	 * Saves into aFile, optionally providing aKey, the current authentication information. You can use ow.server.auth.loadFile
	 * later to reload this info.
	 * </odoc>
	 */
	this.saveFile = function(aFile, aKey) {
		io.writeFileString(aFile, this.dumpEncrypt(aKey));
	};
	
	/**
	 * <odoc>
	 * <key>ow.server.auth.check(aUser, aPass) : boolean</key>
	 * Checks if the aUser and aPass provided are authenticated with the current internal list (returns true)
	 * or not (returns false). If a 2FA authentication was provided the token should be suffix to the password.
	 * </odoc>
	 */
	this.check = function(aUser, aPass) {
		var checkPassword = (p) => {
			if (isDef(this.customFunction)) {
				return this.customFunction(aUser, p);
			} else {
				return user.p == sha512(Packages.openaf.AFCmdBase.afc.dIP(p));
			}
		};

		if (isUnDef(this.aListOfAuths[aUser])) throw "User not found";

		var user = this.aListOfAuths[aUser];
		var res = false;

		if (isDef(user.k)) {
			// 2FA
			aPass = String(Packages.openaf.AFCmdBase.afc.dIP(aPass));
			var token = aPass.substr(-6);
			var pass = aPass.substr(0, aPass.length - 6);
			res = (checkPassword(pass) && af.validate2FA(user.k, token));
		} else {
			res = checkPassword(aPass);
		}

		if (this.isLocked(aUser)) {
			user.l = new Date();
		} else {
			if (res) {
				user.n = 0;
				user.l = undefined;
			} else {
				user.n++;
				if (user.n >= this.triesToLock) {
					user.l = new Date();
				}
			}
		}

		return res;
	};

	this.initialize(aIniAuth, aKey, aCustomFunction);
	return this;
};
 
//-----------------------------------------------------------------------------------------------------
// LDAP Check
//-----------------------------------------------------------------------------------------------------

/**
 * <odoc>
 * <key>ow.server.ldap(aServer, aUsername, aPassword) : Object</key>
 * Creates a ow.server.ldap object for the given aServer, aUsername and aPassword. Example:\
 * \
 * var ldapAdServer = "ldap://ldap.forumsys.com:389";\
 * var ldapUsername = "cn=read-only-admin,dc=example,dc=com";\
 * var ldapPassword = "password";\
 * \
 * var ldap = new ow.server.ldap(ldapAdServer, ldapUsername, ldapPassword);\
 * var res = ldap.search("dc=example,dc=com", "(uid=*)");\
 * \
 * print(beautifier(res));\
 * </odoc>
 */
OpenWrap.server.prototype.ldap = function(aServer, aUsername, aPassword) {
	var env = new java.util.Hashtable(5);
	
	if (isUnDef(aUsername) && isUnDef(aPassword)) {
		env.put(javax.naming.Context.SECURITY_AUTHENTICATION, "none");
	} else {
		env.put(javax.naming.Context.SECURITY_PRINCIPAL, Packages.openaf.AFCmdBase.afc.dIP(aUsername));
		env.put(javax.naming.Context.SECURITY_CREDENTIALS, Packages.openaf.AFCmdBase.afc.dIP(aPassword));
	}
	//env.put(javax.naming.Context.SECURITY_AUTHENTICATION, "simple");
	env.put(javax.naming.Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.ldap.LdapCtxFactory");
	env.put(javax.naming.Context.PROVIDER_URL, aServer);

	this.ctx = new Packages.javax.naming.ldap.InitialLdapContext(env, null);
	this.ldap = javax.naming.ldap.InitialLdapContext();
}

/**
 * <odoc>
 * <key>ow.server.ldap.startTLS()</key>
 * Starts TLS over the current connection.
 * </odoc>
 */
OpenWrap.server.prototype.ldap.prototype.startTLS = function() {
	this.tls = this.ctx.extendedOperation(new javax.naming.ldap.StartTlsRequest());
	this.ssl = this.tls.negotiate();
}

/**
 * <odoc>
 * <key>ow.server.ldap.close()</key>
 * Closes the current connection.
 * </odoc>
 */
OpenWrap.server.prototype.ldap.prototype.close = function() {
	if (isDef(this.tls)) this.tls.close();
	this.ctx.close();
}
	
/**
 * <odoc>
 * <key>ow.server.ldap.search(baseSearch, searchFilter) : Array</key>
 * Tries to return the result of using searchFilter under the baseSearh.
 * See also ow.server.ldap 
 * </odoc>
 */
OpenWrap.server.prototype.ldap.prototype.search = function(baseSearch, searchFilter) {
	var searchcontrols = new javax.naming.directory.SearchControls();
	searchcontrols.setSearchScope(javax.naming.directory.SearchControls.SUBTREE_SCOPE);
	var result = this.ctx.search(baseSearch, searchFilter, searchcontrols);

	var arr = [];
	while(result.hasMore()) {
		var arrItem = {};
		var res = result.next();
		var attrs = res.getAttributes().getAll();
		while(attrs.hasMore()) {
			var attr = attrs.next();
			
			var arrValues = [];
			var values = attr.getAll();
			while(values.hasMore()) {
				arrValues.push(values.next());
			}
			arrItem[attr.getID()] = (arrValues.length == 1) ? arrValues[0] : arrValues;
		}

		arr.push(arrItem);
	}

	return arr;
}

/**
 * <odoc>
 * <key>ow.server.ldap.searchStrings(baseSearch, searchFilter) : Array</key>
 * Tries to return the result of using searchFilter under the baseSearch converting each entry to string
 * See also ow.server.ldap
 * </odoc>
 */
OpenWrap.server.prototype.ldap.prototype.searchStrings = function(baseSearch, searchFilter) {
	var searchcontrols = new javax.naming.directory.SearchControls();
	searchcontrols.setSearchScope(javax.naming.directory.SearchControls.SUBTREE_SCOPE);
	searchcontrols.setReturningAttributes([ "*", "+" ]);
	var result = this.ctx.search(baseSearch, searchFilter, searchcontrols);

	var arr = [];
	while(result.hasMore()) {
		var arrItem = {};
		var res = result.next();
		var attrs = res.getAttributes().getAll();
		while(attrs.hasMore()) {
			var attr = attrs.next();
			
			var arrValues = [];
			var values = attr.getAll();
			while(values.hasMore()) {
				arrValues.push(String(values.next()));
			}
			arrItem[attr.getID()] = (arrValues.length == 1) ? arrValues[0] : arrValues;
		}

		arr.push(arrItem);
	}

	return arr;
}

//-----------------------------------------------------------------------------------------------------
// REST SERVER AND CLIENT
//-----------------------------------------------------------------------------------------------------

OpenWrap.server.prototype.rest = {
	
	parseQuery: (s) => {
		var r = jsonParse(s);
		if (isObject(r)) return r;

		r = {};
		var l = splitBySeparator(s, "&");
		for(var i in l) {
			var a = splitBySeparator(l[i], "=");
			if (a.length == 2) r[decodeURIComponent(a[0])] = decodeURIComponent(a[1]);
		}
		return r;
	},

	/**
	 * <odoc>
	 * <key>ow.server.rest.reply(aBaseURI, aRequest, aCreateFunc, aGetFunc, aSetFunc, aRemoveFunc, returnWithParams, anAuditFn, returnHTML) : RequestReply</key>
	 * Provides a REST compliant HTTPServer request replier given a aBaseURI, aRequest, aCreateFunc, aGetFunc, aSetFunc
	 * and aRemoveFunc. Each function will receive a map with the provided indexes and data from the request plus the request itself. Optionally you can 
	 * specify with returnWithParams = true that each function will not return just the data map but a composed map with: data (the actual
	 * json of data), status (the HTTP code to return) and mimetype.\
	 * \
	 * var hs = ow.loadServer().httpd.start(8080);\
	 * ow.server.httpd.route(hs, ow.server.httpd.mapRoutesWithLibs(hs, {\
	 *    "/rest": function(req) { return ow.server.rest.reply("/rest", req,\
	 *       function(idxs, data, r) { // Create and return a map },\
	 *       function(idxs, r)       { // Get and return a map },\
	 *       function(idxs, data, r) { // Set and return a map },\
	 *       function(idxs, r)       { // Remove and return a map }\
	 *    )}}, function(req) { return hs.replyOKText("nothing here"); });\
	 * ow.server.daemon();\
	 * \ 
	 * Optionally you can also provide anAuditFn that will be called on every request with the arguments request and reply maps.\
	 * \
	 * </odoc>
	 */
	reply: function(aBaseURI, aReq, aCreateFunc, aGetFunc, aSetFunc, aRemoveFunc, returnWithParams, anAuditFn, returnHTML) {
		returnHTML = _$(returnHTML, "returnHTML").isBoolean().default(false);

		var idxs = ow.server.rest.parseIndexes(aBaseURI, aReq);
		var res = {};
		res.headers = {};
		var params;

		if (returnHTML) ow.loadTemplate();
		res.mimetype = (returnHTML ? ow.server.httpd.mimes.HTML : ow.server.httpd.mimes.JSON);

		var fnD = r => {
			if (returnHTML) {
				var res = ow.template.html.parseMap(r, true);

				return String("<html><style>" + res.css + "</style><body>" + res.out + "</body></html>");
			} else {
				if (isString(r)) {
					return r;
				} else {
					return stringify(r, __, "");
				}
			}
		};

		switch(aReq.method) {
		case "GET": 
			if (returnWithParams) {
				params = aGetFunc(idxs, aReq);
				if (isDef(params.data))     res.data = fnD(params.data);
				if (isDef(params.status))   res.status = params.status;
				if (isDef(params.mimetype)) res.mimetype = params.mimetype;
			} else {
				res.data = fnD(aGetFunc(idxs, aReq)); 
			}
			break;
		case "POST":
			if (isDef(aReq.files.content)) {
				var fdata = "";
				try { fdata = io.readFileString(aReq.files.content); } catch(e) { }
				if (returnWithParams) {
					params = aCreateFunc(idxs, ow.server.rest.parseQuery(fdata), aReq);
					if (isDef(params.data))     res.data = fnD(params.data);
					if (isDef(params.status))   res.status = params.status;
					if (isDef(params.mimetype)) res.mimetype = params.mimetype;
				} else { 
					res.data = fnD(aCreateFunc(idxs, ow.server.rest.parseQuery(fdata), aReq));
				}
			} else {
				if (isDef(aReq.files.postData)) {
					params = aCreateFunc(idxs, ow.server.rest.parseQuery(aReq.files.postData), aReq);
				} else {
					params = aCreateFunc(idxs, ow.server.rest.parseQuery(aReq.params["NanoHttpd.QUERY_STRING"]), aReq);
				}
				if (returnWithParams) {
					if (isDef(params.data))     res.data = fnD(params.data);
					if (isDef(params.status))   res.status = params.status;
					if (isDef(params.mimetype)) res.mimetype = params.mimetype;					
				} else {
					res.data = fnD(params);
				}
			}
			res.headers["Location"] = ow.server.rest.writeIndexes(res.data);
			break;
		case "PUT":
			if (isDef(aReq.files.content)) {
				var fdata = "";
				try { fdata = io.readFileString(aReq.files.content); } catch(e) { };
				params = aSetFunc(idxs, ow.server.rest.parseQuery(fdata), aReq);
			} else {
				params = aSetFunc(idxs, ow.server.rest.parseQuery(aReq.files.postData), aReq);
			}
			if (returnWithParams) {
				if (isDef(params.data))     res.data = fnD(params.data);
				if (isDef(params.status))   res.status = params.status;
				if (isDef(params.mimetype)) res.mimetype = params.mimetype;	
			} else {
				res.data = fnD(params);
			}
			break;
		case "DELETE": 
			params = aRemoveFunc(idxs, aReq); 
			if (returnWithParams) {
				if (isDef(params.data))     res.data = fnD(params.data);
				if (isDef(params.status))   res.status = params.status;
				if (isDef(params.mimetype)) res.mimetype = params.mimetype;	
			} else {
				res.data = fnD(params);
			}
			break;
		}

		if (isDef(anAuditFn) && isFunction(anAuditFn)) $do(() => { anAuditFn(aReq, res); });

		return res;
	},
	
	/**
	 * <odoc>
	 * <key>ow.server.rest.replyData(aBaseURI, aRequest, aDataArray) : RequestReply</key>
	 * Provides a REST JSON compliant HTTPServer request replier given a aBaseURI, aRequest and aDataArray. 
	 * The data array provided will be manipulated by REST calls.\
	 * \
	 * var hs = ow.loadServer().httpd.start(8080);\
	 * ow.server.httpd.route(hs, ow.server.httpd.mapRoutesWithLibs(hs, {\
	 *    "/rest": function(req) { \
	 *       return ow.server.rest.replyData("/rest", req, myData);\
	 *    });\
	 * ow.server.daemon();\
	 * \ 
	 * </odoc>
	 */
	replyData: function(aBaseURI, aReq, aData) {
		return ow.server.rest.reply(aBaseURI, aReq,
			function(idxs, data) {
				if ($stream(clone(aData)).filter(idxs).count() <= 0) {
					var newData = merge(idxs, data);
					aData.push(newData);
					return newData;
				} else {
					return {};
				}
			},
			function(idxs) {
				if ($stream(clone(aData)).filter(idxs).count() > 0) {
					return $stream(clone(aData)).filter(idxs).toArray()[0];
				} else {
					return {};
				}				
			},
			function(idxs, data) {
				var newData;
				
				//if (isDefined(aReq.files.content)) {
					//newData = io.readFile(aReq.files.content);
					newData = data;

					if ($stream(clone(aData)).filter(idxs).count() > 0) {
						aData[aData.indexOf($stream(clone(aData)).filter(idxs).toArray()[0])] = newData;
					} else {
						aData.push(newData);
					}
					
					//return newData;
				//}

				return {};
			},
			function(idxs) {
				if ($stream(clone(aData)).filter(idxs).count() > 0) {
					deleteFromArray(aData, aData.indexOf($stream(clone(aData)).filter(idxs).toArray()[0]) );
					return idxs;
				} else {
					return {};
				}
			}
		);
	},
		
	/**
	 * <odoc>
	 * <key>ow.server.rest.parseIndexes(aBaseURI, aHTTPRequest) : Map</key>
	 * Given aBaseURI and aHTTPRequest will parse and determine the implicit REST API indexes
	 * </odoc>
	 */
	parseIndexes: function(aBaseURI, req) {
		var baseURL = aBaseURI;
		var props = req.originalURI.replace(new RegExp("^" + baseURL + "/*\#*"), "").split("/");
		var propsObj = {};

		for (var i = 0; i < props.length; i += 2) {
			if (props[i].length > 0)
				propsObj[decodeURIComponent(props[i])] = jsonParse(decodeURIComponent(props[i + 1]));
		}
		
		return propsObj;
	},
	
	/**
	 * <odoc>
	 * <key>ow.server.rest.writeIndexes(aPropsMap) : String</key>
	 * Given a map of REST API indexes (aPropsMap) will return a corresponding URI.
	 * Note: just a shortcut for ow.obj.rest.writeIndexes.
	 * </odoc>
	 */
	writeIndexes: function(aPropsObj) {
		return ow.loadObj().rest.writeIndexes(aPropsObj)
	}
};

//-----------------------------------------------------------------------------------------------------
//CRON SCHEDULER
//-----------------------------------------------------------------------------------------------------

/**
 * <odoc>
 * <key>ow.server.scheduler.scheduler()</key>
 * Creates a new instance of a cron based scheduler with its own thread pool.
 * </odoc>
 */
OpenWrap.server.prototype.scheduler = function () {
	plugin("Threads");
	ow.loadFormat();

	var r = {
		__entries: {},
		__repeat: "",
		__t: new Threads()
	};

	/**
	 * <odoc>
	 * <key>ow.server.scheduler.stop()</key>
	 * Attempts to force stop the current scheduler thread pool.
	 * </odoc>
	 */
	r.stop = function () {
		this.__t.stop(true);

		this.__entries = {};
		this.__repeat = "";
		this.__t = new Threads();
	};

	/**
	 * <odoc>
	 * <key>ow.server.scheduler.addEntry(aCronExpr, aFunction, waitForFinish) : String</key>
	 * Adds a new scheduler entry with a given aCronExpr"ession" that will trigger the scheduled execution of
	 * aFunction. If waitForFinish = true it will not execute until the previous execution has finished.
	 * Returns an UUID that can be used with the function modifyEntry later, if needed.
	 * </odoc>
	 */
	r.addEntry = function (aCronExpr, aFunction, waitForFinish) {
		var uuid = genUUID();

		this.__entries[uuid] = {
			expr: aCronExpr,
			func: aFunction,
			wff: waitForFinish,
			exec: false,
			next: now() + ow.format.cron.timeUntilNext(aCronExpr)
		};

		this.resetSchThread();
		return uuid;
	};

	/**
	 * <odoc>
	 * <key>ow.server.scheduler.modifyEntry(aUUID, aCronExpr, aFunction, waitForFinish) : String</key>
	 * Changes an existing scheduler entry (aUUID) with a given aCronExpr"ession" that will trigger the scheduled execution of
	 * aFunction. If waitForFinish = true it will not execute until the previous execution has finished.
	 * </odoc>
	 */
	r.modifyEntry = function(aUUID, aCronExpr, aFunction, waitForFinish) {
		if (isUnDef(this.__entries[aUUID])) return __;
		
		this.__entries[aUUID] = {
			expr: aCronExpr,
			func: aFunction,
			wff: waitForFinish,
			exec: false,
			next: now() + ow.format.cron.timeUntilNext(aCronExpr)
		};

		this.resetSchThread();
		return aUUID;
	};

	/**
	 * <odoc>
	 * <key>ow.server.scheduler.timeUntilNext() : Number</key>
	 * Returns the number of ms until the next scheduled execution.
	 * </odoc>
	 */
	r.timeUntilNext = function () {
		var t;
		var ref = new Date();

		for (var i in this.__entries) {
			var c = new Date(ow.format.cron.nextScheduled(this.__entries[i].expr)) - ref;
			if (isUnDef(t)) {
				t = c;
			} else {
				if (c >= 0 && c < t) t = c;
			}
		}

		return t;
	};

	/**
	 * <odoc>
	 * <key>ow.server.scheduler.nextUUID() : String</key>
	 * Returns the uuid of the next entry that will be executed.
	 * </odoc>
	 */
	r.nextUUID = function () {
		var t;
		var r = -1;
		var ref = new Date();

		for (var i in this.__entries) {
			var c = new Date(ow.format.cron.nextScheduled(this.__entries[i].expr)) - ref;
			if (isUnDef(t)) {
				t = c;
				r = i;
			} else {
				if (c >= 0 && c < t) {
					t = c;
					r = i;
				}
			}
		}

		return r;
	};

	/**
	 * <odoc>
	 * <key>ow.server.scheduler.resetSchThread(aErrFunction)</key>
	 * Resets the current scheduler thread pool adding a loop cached thread that will sleep until the next
	 * execution is due. When it executes it will add a new cached thread to execute the scheduled entry
	 * by executing the entry function provided, as argument, it's uuid.
	 * </odoc>
	 */
	r.resetSchThread = function (aErrFunction) {
		var parent = this;
		var ruuid = genUUID();

		if (isUnDef(aErrFunction)) aErrFunction = (r) => { logErr(String(r)); };
		this.__errfunc = aErrFunction;

		this.__repeat = ruuid;
		this.__t.stop(true);
		this.__t = new Threads();

		this.__t.addCachedThread(function (uuid) {

			do {
				var ts = __;
				for (var i in parent.__entries) {
					var entry = parent.__entries[i];

					// Check if it's time to execute
					// If wff = true it's not okay to execute if it's executing.
					if (ow.format.cron.isCronMatch(new Date(), entry.expr) && ((entry.wff && !entry.exec) || !entry.wff)) {
						parent.__t.addCachedThread(function () {
							var res;
							var si = String(i);
							try {
								if (parent.__entries[si].next <= now()) {
									parent.__entries[si].next = (new Date(ow.format.cron.nextScheduled(parent.__entries[si].expr, __, now()+1000))).getTime();
									parent.__entries[si].exec = true;
									res = parent.__entries[si].func(si);
									while (ow.format.cron.timeUntilNext(parent.__entries[si].expr) < 0) {
										sleep(500);
									}
									parent.__entries[si].exec = false;
								}
							} catch (e) {
								if (!(e.message.match(/java\.lang\.InterruptedException: sleep interrupted/)))
									parent.__errfunc(e);
							}
							return res;
						});
					}

					// Determine the minimum waiting time
					if (isUnDef(ts)) {
						ts = ow.format.cron.timeUntilNext(entry.expr, __, now()+1000);
					} else {
						var c = ow.format.cron.timeUntilNext(entry.expr);
						if (c < ts) ts = c;
					}
				}

				if (ts > 0) {
					sleep(ts);
				} else {
					sleep(500);
				}
			} while (parent.__repeat == String(ruuid));
		});
	};

	return r;
};

//-----------------------------------------------------------------------------------------------------
// Locks
//-----------------------------------------------------------------------------------------------------

/**
 * <odoc>
 * <key>ow.server.locks(justInternal, aCh)</key>
 * Creates a lock managing object instance. You can optional make it internal (using a __openAFLocks::local simple channel) or global
 * using a __openAFLocks:global ignite channel. Optional you can also provide an already created channel aCh.
 * </odoc>
 */
OpenWrap.server.prototype.locks = function(justInternal, aCh, aOptions) {
	this.timeout = 500;
	this.retries = 5;
	this.options = aOptions;
	this.type = "";

	justInternal = _$(justInternal).default(true);
	this.name = _$(aCh).isString().default("__openAFLocks::" + (justInternal ? "local" : "global"));

	if (isString(justInternal) && justInternal == "cluster") {
		aOptions = _$(aOptions).isMap().default({});
		_$(aOptions.cluster).$_("Please provide a cluster impl object.");
		_$(aOptions.clusterOptions).$_("Please provide a cluster options object.");
		this.type = "cluster";
	}

	if (isUnDef(aCh)) {
		if (justInternal) {
			$ch(this.name).create(1, "simple");
		} else {
			if (isString(justInternal) && justInternal == "cluster") {
				$ch(this.name).create(1, "simple");
			} else {
				$ch(this.name).create(1, "ignite");
			}
		}
	}
};

/**
 * <odoc>
 * <key>ow.server.locks.setTryTimeout(aTimeout)</key>
 * Sets the default wait time (in ms) for each try (see ow.server.locks.setRetries) checking if a lock is free. Defaults to 500 ms.
 * </odoc>
 */
OpenWrap.server.prototype.locks.prototype.setTryTimeout = function(aTimeout) {
	this.timeout = aTimeout;
	return this;
};

/**
 * <odoc>
 * <key>ow.server.locks.setRetries(aNumber)</key>
 * Sets the number of tries for checking if a lock is free waiting a specific time on each (see ow.server.locks.setRetries). Defaults to 5.
 * </odoc>
 */
OpenWrap.server.prototype.locks.prototype.setRetries = function(aNumber) {
	this.retries = aNumber;
	return this;
};

/**
 * <odoc>
 * <key>ow.server.locks.isLocked(aLockName) : boolean</key>
 * Determines if aLockName is locked (true) or not (false).
 * </odoc>
 */
OpenWrap.server.prototype.locks.prototype.isLocked = function(aLockName) {
	var r = false;
	try {
		r = $ch(this.name).get({
			lock: aLockName
		});
		if (isUnDef(r)) {
			$ch(this.name).set({
				lock: aLockName
			}, {
				lock: aLockName,
				value: false
			});
			r = $ch(this.name).get({
				lock: aLockName
			});
		}
		if (r.value == true && isDef(r.timeout) && !isNull(r.timeout) && (nowUTC() >= r.timeout)) {
			this.unlock(aLockName);
			r = $ch(this.name).get({
				lock: aLockName
			});
		}
	} catch (e) {
		$ch(this.name).set({
			lock: aLockName
		}, {
			lock: aLockName,
			value: false
		});
		r = $ch(this.name).get({
			lock: aLockName
		});
	}

	return r;
};

/**
 * <odoc>
 * <key>ow.server.locks.lock(aLockName, aTryTimeout, aNumRetries, aLockTimeout) : boolean</key>
 * Locks the lock aLockName optionally using a specific aTryTimeout and aNumRetries instead of the defaults ones (see
 * ow.server.locks.setTryTimeout and ow.server.locks.setRetries). A aLockTimeout can optionally be provided after which the
 * lock will expire. If successfull in locking returns true, otherwiser returns false.
 * </odoc>
 */
OpenWrap.server.prototype.locks.prototype.lock = function(aLockName, aTryTimeout, aNumRetries, aTimeout, extra) {
	var c = _$(aNumRetries).isNumber().default(this.retries);
	aTryTimeout = _$(aTryTimeout).isNumber().default(this.timeout);
	var lock = true;
	var r;

	var fn = () => {
		var res = $ch(this.name).getSet({
			value: false
		}, {
			lock: aLockName
		}, {
			lock: aLockName,
			timeout: nowUTC() + aTimeout,
			value: true,
			extra: extra
		});
		if (isUnDef(res)) return false; else return true;
	};

	do {
		if (this.type == "cluster") {
			extra = _$(extra).default(this.options.clusterOptions.HOST + ":" + this.options.clusterOptions.PORT);
			var rrr = this.options.cluster.clusterCanLock(this.options.clusterOptions, aLockName);
			if (rrr) {
				var res = this.isLocked(aLockName);
				if (res.value == false) {
					lock = !fn();
				} else {
					if (isDef(res.timeout)) {
						if (!isNull(res.timeout) && nowUTC() >= res.timeout) 
							c = 0; 
						else
							sleep(aTryTimeout, true);
					}
				}
			}
		} else {
			var res = this.isLocked(aLockName);
			if (res.value == false) {
				lock = !fn();
			} else {
				if (isDef(res.timeout)) {
					if (!isNull(res.timeout) && nowUTC() >= res.timeout) 
						c = 0; 
					else
						sleep(aTryTimeout, true);
				}
			}
		}
		if (c > 0) c--;
	} while ((c > 0 || c < 0) && lock);

	/*if (!lock) {
		lock = !fn();
	}*/

	return !lock;
};

/**
 * <odoc>
 * <key>ow.server.locks.extendTimeout(aLockName, aTryTimeout) : Objet</key>
 * Tries to extend the lock timeout (or adds a timeout if doesn't exist) with aTryTimeout for aLockName.
 * </odoc>
 */
OpenWrap.server.prototype.locks.prototype.extendTimeout = function(aLockName, aTimeout) {
	var current = $ch(this.name).get({
		lock: aLockName
	});
	$ch(this.name).getSet({
		value: true
	}, {
		lock: aLockName
	}, {
		lock: aLockName,
		value: true,
		timeout: nowUTC() + aTimeout,
		extra: current.extra
	});

	return $ch(this.name).get({
		lock: aLockName
	});
};

/**
 * <odoc>
 * <key>ow.server.locks.unlock(aLockName)</key>
 * Tries to unlock aLockName.
 * </odoc>
 */
OpenWrap.server.prototype.locks.prototype.unlock = function (aLockName) {
	if (this.type == "cluster" && !this.options.cluster.clusterCanUnLock(this.options.clusterOptions, aLockName)) return __;

	$ch(this.name).getSet({
		value: true
	}, {
		lock: aLockName
	}, {
		lock: aLockName,
		value: false
	});
	
	var res = $ch(this.name).get({
		lock: aLockName
	});

	if (isDef(res)) return res; else return true;
};

/**
 * <odoc>
 * <key>ow.server.locks.clear(aLockName)</key>
 * Clears an existing aLockName. Note: This might also unlock an inuse lock.
 * </odoc>
 */
OpenWrap.server.prototype.locks.prototype.clear = function(aLockName) {
	$ch(this.name).unset({ lock: aLockName });
	return this;
};

/**
 * <odoc>
 * <key>ow.server.locks.whenUnLocked(aLockName, aFunction, aTryTimeout, aNumRetries) : boolean</key>
 * A wrapper for ow.server.locks.lock that will try to lock aLockName, execute the provide function and then unlock it
 * even in case an exception is raised. Returns if the lock was successfull (true) or not (false).
 * </odoc>
 */
OpenWrap.server.prototype.locks.prototype.whenUnLocked = function (aLockName, aFunc, aTryTimeout, aNumRetries) {
	if (this.lock(aLockName, aTryTimeout, aNumRetries)) {
		try {
			aFunc();
		} finally {
			this.unlock(aLockName);
		}
		return true;
	}

	return false;
};

//-------------
// SIMPLE QUEUE
//-------------

/**
 * <odoc>
 * <key>ow.server.queue(aStamp, aName, aChName)</key>
 * Creates an instance to handle a queue on a channel named "queue::[aName]" or using aChName. The queue entries 
 * will be identified on the channel with aStamp map (defaults to {}) ignoring all other entries.
 * aStamp allows the use of generic channels with other non-queue entries. aName will default to "queue" if not
 * provided.
 * </odoc>
 */
OpenWrap.server.prototype.queue = function(aStamp, aName, aChName) {
	aName = _$(aName).isString().default("queue");
	this.name = _$(aChName).isString().default("queue::" + aName);
    this.stamp = _$(aStamp).isMap().default({});

	$ch(this.name).create();
};

OpenWrap.server.prototype.queue.prototype.__find = function(aVisibilityTime) {
    var keys = $path($ch(this.name).getKeys(), "[] | sort_by(@, &id)");
    for(var ii = 0; ii < keys.length; ii++) {
        if (!($stream([keys[ii]]).anyMatch(this.stamp))) continue;

        var val = clone($ch(this.name).get(keys[ii]));
        if (isDef(val)) {
            if (val.status == "r") {
                if (isDef(val.timeout) && val.timeout >= nowUTC()) {
                    continue;
                } else {
					if (isDef(val.timeout)) {
						// Returning a previously timeout entry
						delete val.timeout;
						val.status = "s";
						var res = $ch(this.name).getSet({
							id: val.id,
							status: "r"
						}, keys[ii],
						val);
						
						if (isUnDef(res)) val = clone($ch(this.name).get(keys[ii]));
						if (isUnDef(val)) continue; else val = clone(val);
					} else {
						$ch(this.name).unset(keys[ii]);
					}
                }
            }
            if (val.status == "s") {
				if (isDef(val.to) && val.to <= nowUTC()) {
					$do(() => { $ch(this.name).unset(keys[ii]); });
				} else {
					val.status = "r";
					if (isDef(aVisibilityTime)) val.timeout = nowUTC() + aVisibilityTime;
					var res = $ch(this.name).getSet({
						id: val.id,
						status: "s"
					}, keys[ii],
					val);

					this.val = val;
					if (isDef(res)) return res;
				}
            }
        }
    }
};

/**
 * <odoc>
 * <key>ow.server.queue.increaseVisibility(aId, aVisibilityTime)</key>
 * Tries to set the visibility of a queue aId to now + aVisibilityTime ms. Note: the queue aId should have been already
 * received previously with a specific visibility time. 
 * </odoc>
 */
OpenWrap.server.prototype.queue.prototype.increaseVisibility = function(aId, aVisibilityTime) {
	_$(aId, "id").$_();
	_$(aVisibilityTime, "visibilityTime").isNumber().$_();

	var elem = $path($ch(this.name).getKeys(), "[?id==`" + aId + "`]");
	if (isDef(elem)) {
		if (isArray(elem) && elem.length > 0) elem = elem[0];

		var val = $ch(this.name).get(elem);
		if (isDef(val)) {
			val.timeout = nowUTC() + aVisibilityTime;
			$ch(this.name).getSet({
				id: val.id,
				status: "s"
			}, elem, val);
		}
	}
};

/**
 * <odoc>
 * <key>ow.server.queue.send(aObject, aId, aTTL, aPriority) : Object</key>
 * Sends aObject (map) to the queue. Optionally a specific unique aId can be provided and/or aTTL (time to live) for the object in
 * the queue in ms. Optionally aPriority can be provided and will be prefixed to aId. The final unique aId will be returned and used
 * as the sorting based for returning objects from the queue (the lowest first).
 * </odoc>
 */
OpenWrap.server.prototype.queue.prototype.send = function(aObject, aId, aTTL, aPriority) {
	aPriority = _$(aPriority).isNumber().default(1);
	var id = Number(String(aPriority) + String(_$(aId).default(nowNano())));

    $ch(this.name).set(merge({
		id: id
    }, this.stamp), merge({
        id: id,
		status: "s",
		to: (isDef(aTTL) ? nowUTC() + aTTL : __),
        obj: aObject
	}, this.stamp));
	return id;
};

/**
 * <odoc>
 * <key>ow.server.queue.receive(aVisibilityTime, aWaitTime, aPoolTime) : Map</key>
 * Tries to return an object from the queue within a map composed of two entries: idx (the unique index on the queue)
 * and obj (the object/map queued). If aVisibilityTime is defined, the returned entry identified by idx will be returned
 * to the queue if ow.server.queue.delete is not used within aVisibilityTime defined in ms. Optionally you can also provide
 * aWaitTime for how much to wait for an entry to be available on the queue (defaults to 2,5 seconds) and aPoolTime (defaults to 50ms)
 * of queue pooling interval.
 * </odoc>
 */
OpenWrap.server.prototype.queue.prototype.receive = function(aVisibilityTime, aWaitTime, aPoolTime) {
	aWaitTime = _$(aWaitTime, "waitTime").isNumber().default(2500);
	aPoolTime = _$(aPoolTime, "poolTime").isNumber().default(50);
    var limit = now() + aWaitTime;
    do {
        var r = this.__find(aVisibilityTime);
        if (isDef(r)) {
            return {
                idx: r.id,
                obj: this.val.obj
            };
        }
        sleep(aPoolTime, true);
    } while(now() < limit);
};

/**
 * <odoc>
 * <key>ow.server.queue.delete(aId)</key>
 * Tries to delete a queue unique entry identified by aId.
 * </odoc>
 */
OpenWrap.server.prototype.queue.prototype.delete = function(aId) {
    $ch(this.name).unset(merge({
        id: aId
    }, this.stamp));
};

/**
 * <odoc>
 * <key>ow.server.queue.size() : Number</key>
 * Tries to return an estimative of the current queue size.
 * </odoc>
 */
OpenWrap.server.prototype.queue.prototype.size = function() {
	return $ch(this.name).size();
};

/**
 * <odoc>
 * <key>ow.server.queue.purge()</key>
 * Tries to delete all queue entries.
 * </odoc>
 */
OpenWrap.server.prototype.queue.prototype.purge = function() {
    var keys = $ch(this.name).getKeys();
    var ar = [];
    for(var ii = 0; ii < keys.length; ii++) {
        if (($stream([keys[ii]]).anyMatch(this.stamp))) ar.push(keys[ii]);
    }
    if (ar.length > 0) $ch(this.name).unsetAll(Object.keys(ar[0]), ar);
};

//-----------------------------------------------------------------------------------------------------
// TELEMETRY
//-----------------------------------------------------------------------------------------------------

OpenWrap.server.prototype.telemetry = { 
	/**
	 * <odoc>
	 * <key>ow.server.telemetry.passive(aHTTPdOrPort, aURI, useOpenMetrics, openMetricsPrefix, openMetricsHelp)</key>
	 * Setup a HTTPd server on aHTTPdOrPort (defaults to 7777) on the aURI (defaults to /healthz) to 
	 * serve ow.metrics.getAll. If the parameter "s" is present the value will be split by commas and used
	 * for ow.metrics.getSome.
	 * Optionally if useOpenMetrics = true the default of aURI becomes /metrics and the output becomes open metrics (prometheus) using openMetricsPrefix (defaults to "metrics") and
	 * uses the openMetricsHelp where each key is a open metric entry associated with map with text (description text), help (help text) and type (metrics type).
	 * </odoc>
	 */
    passive: function(aHs, aURI, useOpenMetrics, openMetricsPrefix, openMetricsHelp) {
		aHs  = _$(aHs, "server").default("7777");
		useOpenMetrics = _$(useOpenMetrics, "useOpenMetrics").default(false);
		aURI = _$(aURI, "uri").isString().default((useOpenMetrics ? "/metrics" : "/healthz"));

		if (isNumber(aHs)) aHs = ow.server.httpd.start(aHs);
		ow.loadMetrics();

		var r = {};
		r[aURI] = (r, aH) => {
			try {
				if (isDef(r.params) && isDef(r.params.s)) {
					if (useOpenMetrics) {
						return aHs.replyOKText(ow.metrics.fromObj2OpenMetrics(ow.metrics.getSome(r.params.s.split(",")), openMetricsPrefix, now(), openMetricsHelp));
					} else {
						return ow.server.httpd.reply(ow.metrics.getSome(r.params.s.split(",")));
					}
				} else {
					if (useOpenMetrics) {
						return aHs.replyOKText(ow.metrics.fromObj2OpenMetrics(ow.metrics.getAll(), openMetricsPrefix, now(), openMetricsHelp));
					} else {
						return ow.server.httpd.reply(ow.metrics.getAll());
					}
				}
			} catch(e) {
				sprintErr(e);
			}
		};
		ow.server.httpd.route(aHs, ow.server.httpd.mapWithExistingRoutes(aHs, r));
	},
	/**
	 * <odoc>
	 * <key>ow.server.telemetry.active(aSendFunc, aPeriod)</key>
	 * Setup recurrent execution of aSendFunc with the propose of sending ow.metrics for a provided aPeriod (defaults to 60000 ms). 
	 * </odoc>
	 */
	active: function(aSendFunc, aPeriod) {
		aPeriod = _$(aPeriod, "period").isNumber().default(60000);
		_$(aSendFunc, "sendFunc").isFunction().$_();

		plugin("Threads");
		ow.loadMetrics();

		var t = new Threads();
		t.addScheduleThreadWithFixedDelay(aSendFunc, aPeriod);
		t.startNoWait();
	},
	/**
	 * <odoc>
	 * <key>ow.server.telemetry.send2nAttrMon(anAttrMonCValsURL, anAttrPrefix, anArrayOfMetricNames) : Function</key>
	 * Returns a function to be used with ow.server.telemetry.active to send metrics to nAttrMon using the provided anAttrMonCValsURL,
	 * anAttrPrefix (e.g. "myjobname/") and, optionally, an array of metrics (anArrayOfMetricsNames)
	 * </odoc>
	 */
	send2nAttrMon: function(anAttrMonCValsURL, anAttrPrefix, anArrayOfMetricNames) {
		_$(anAttrPrefix, "anAttrPrefix").isString().$_();
		var name = "openaf::metrics::" + md5(anAttrMonCValsURL);
		ow.loadObj();

		return function() {
			$ch(name).createRemote(anAttrMonCValsURL);
			var tval = new Date();
			var vals;
			if (isArray(anArrayOfMetricNames)) {
				vals = ow.metrics.getSome(anArrayOfMetricNames);
			} else {
				vals = ow.metrics.getAll();
			}
			Object.keys(vals).forEach(k => {
				$ch(name).set({ 
					name: anAttrPrefix + k 
				}, vals[k])
			});
		}
	},
	/**
	 * <odoc>
	 * <key>ow.server.telemetry.send2Prometheus(aPrometheusGatewayURL, aPrefix, anArrayOfMetricNames) : Function</key>
	 * Returns a function to be used with ow.server.telemetry.active to send metrics to a OpenMetrics/Prometheus gateway using the provided
	 * aPrometheusGatewayURL with aPrefix (e.g. "myjobname") and, optionally, an array of metrics (anArrayOfMetricsNames)
	 * </odoc>
	 */
	send2Prometheus: function(aPrometheusGatewayURL, aPrefix, anArrayOfMetricNames) {
		_$(aPrefix, "aPrefix").isString().$_();
		
		return function() {
			var aObj;
			if (isArray(anArrayOfMetricNames)) {
				aObj = ow.metrics.getSome(anArrayOfMetricNames);
			} else {
				aObj = ow.metrics.getAll();
			}

			$rest({
				requestHeaders: {
					"Content-Type": "text/plain"
				}
			}).post(aPrometheusGatewayURL, ow.metrics.fromObj2OpenMetrics(aObj, aPrefix));
		}
	}
};

//-----------------------------------------------------------------------------------------------------
// SIMPLE CLUSTER LIST
//-----------------------------------------------------------------------------------------------------

/**
 * <odoc>
 * <key>ow.server.cluster(aHost, aPort, nodeTimeout, aNumberOfTries, aTryTimeout, aImplOptions, aListImplementation) : Object</key>
 * Creates a new instance of a simple cluster nodes management code. Each cluster node should create it's own instante providing aHost address
 * on which it can be contacted, a corresponding aPort, a nodeTimeout in ms (defaults to 30000), a aNumberOfTries to contact a cluster node (defaults to 3),
 * a aTryTimeout in ms waiting for a reply from another cluster node (defaults to 500ms), a custom cluster list implementation options and a custom map of functions
 * implementing a cluster list retrieval. If no aListImplemnetation is provided it defaults to an internal file based implementation that expects
 * the following options: LOCKTIMEOUT, how much a lock should be honored in ms (e.g. more that 60000ms and it's wierd that the lock it's still there and no other
 * cluster node has been found); CLUSTERFILE, the filepath to the cluster file; CLUSTERFILELOCK, the filepath to the cluster file lock file.\
 * \
 * To provide another custom aListImplementation it should contain the following methods:\
 * \
 *   - clusterLock()                  - locking the access to the cluster nodes list\
 *   - clusterUnLock()                - unlocking the access to the cluster nodes list\
 *   - clusterGetList()               - returns the current cluster nodes list\
 *   - clusterPutList(aList)          - sets a new cluster nodes list (an array with maps containing host, port and date (last contact date))\
 *   - clusterSendMsg(aHost, aMsg)    - sends aMsg to a specific aHost or all (is aHost = "all")\
 *   - clusterSetMsgHandler(aT, aHFn) - sets aHFn function (receives (implementationOptionsMap, aMsg) ) to handle any messages that contain { t: aT }\
 *   - clusterCanLock(aLockName)      - asks all nodes if aLockName can be locked on cluster.locks\
 *   - clusterCanUnLock(aLockName)    - asks all nodes if aLockName can be unlocked on cluster.locks\
 *   - clusterLocks()                 - returns the current cluster node locks implementation (ow.server.locks)\
 * \
 * </odoc>
 */
OpenWrap.server.prototype.cluster = function(aHost, aPort, nodeTimeout, aNumberOfTries, aTryTimeout, aImplOptions, aListImplementation) {
	ow.loadFormat();

	this.HOST              = _$(aHost).isString("aHost not string").default("127.0.0.1");
	this.PORT              = _$(aPort).isNumber().default(80);   
	this.TRIES             = _$(aNumberOfTries).isNumber().default(3);
	this.TRYTIMEOUT        = _$(aTryTimeout).isNumber().default(500);
	this.NODETIMEOUT       = _$(nodeTimeout).isNumber().default(30000);

	if (isUnDef(aListImplementation)) {
		this.options = {
			LOCKTIMEOUT    : 60000,
			CLUSTERFILE    : "cluster.json",
			CLUSTERFILELOCK: "cluster.json.lock"
		};
	} else {
		this.options = {
			HOST: this.HOST,
			PORT: this.PORT
		};
	}

	if (isDef(aImplOptions) && isMap(aImplOptions)) {
		this.options = merge(this.options, aImplOptions);
	} 

	if (isUnDef(aListImplementation) || !isObject(aListImplementation)) {
		this.impl = {
			clusterLock: (aOptions) => {
				try {
					var alock = io.readFile(aOptions.CLUSTERFILELOCK);
					if (now() - alock.lock > aOptions.LOCKTIMEOUT) {
						io.writeFile(aOptions.CLUSTERFILELOCK, { lock: now() });
						return true;
					} else {
						return false;
					}
				} catch(e) {
					if (String(e).indexOf("FileNotFoundException") > 0) {
						io.writeFile(aOptions.CLUSTERFILELOCK, { lock: now() });
						return true;
					} else {
						throw e;
					}
				}
			},
			clusterUnLock: (aOptions) => {
				io.rm(aOptions.CLUSTERFILELOCK);
			},
			clusterGetList: (aOptions) => {
				if (!io.fileExists(aOptions.CLUSTERFILE)) io.writeFile(aOptions.CLUSTERFILE, { cluster: [] });
				return io.readFile(aOptions.CLUSTERFILE);
			},
			clusterPutList: (aOptions, aList) => {
				io.writeFile(aOptions.CLUSTERFILE, aList);
			}
		};
	} else {
		this.impl = aListImplementation;
	}
};

/**
 * <odoc>
 * <key>ow.server.cluster.sendToOthers(aData, aSendToOtherFn) : Object</key>
 * Tries to send to another cluster node aData using aSendToOtherFn that receives, as parameter, a aData and a Map with HOST and PORT of another
 * cluster node to try. In case of failure the function should throw an exception in case of success the function should return an object
 * that will be returned. If no result can be obtained an object with result: 0 will be returned.
 * </odoc>
 */
OpenWrap.server.prototype.cluster.prototype.sendToOthers = function(aData, aSendFn) {
	var clusterList = this.impl.clusterGetList(this.options);
	var tryList = clusterList.cluster;
	var res = __;

	for(var ii in tryList) {
		if ((tryList[ii].host + tryList[ii].port) != (this.HOST + this.PORT)) {
			try { 
				res = aSendFn(aData, tryList[ii]); 
				return res; 
			} catch(e) {
			}
		}
	}
	
	return res;
};

/**
 * <odoc>
 * <key>ow.server.cluster.any(aFunction, includeMe) : Object</key>
 * Tries to execute aFunction providing a map with one of the cluster list host + port. If the aFunction throws an exception another
 * cluster will be used. If no cluster could be used an exception is thrown. Optionally includeMe = true enables executing on the current
 * cluster node itself. If succcessfully returns whatever the aFunction returns.
 * </odoc>
 */
OpenWrap.server.prototype.cluster.prototype.any = function(aFunction, includeMe) {
	var clusterList = this.impl.clusterGetList(this.options);
	var tryList = $from(clusterList.cluster.map((r) => { 
		r.date = Number(r.date) + (isDef(r.load) ? Math.floor(Math.random() * 30000) : r.load);
		return r; 
	})).sort("date").select();
	var res = __;

	for(var ii in tryList) {
		if (includeMe || (tryList[ii].host + tryList[ii].port) != (this.HOST + this.PORT)) {
			try { 
				res = aFunction(tryList[ii]); 
				return res; 
			} catch(e) {
			}
		}
	}
	
	throw "Couldn't execute.";
};

/**
 * <odoc>
 * <key>ow.server.cluster.all(aFunction, includeMe) : Object</key>
 * Tries to execute aFunction providing a map with all of the cluster list host + port. If the aFunction throws an exception another
 * cluster will be used. If no cluster could be used an exception is thrown. Optionally includeMe = true enables executing on the current
 * cluster node itself. If succcessfully returns whatever the aFunction returns.
 * </odoc>
 */
OpenWrap.server.prototype.cluster.prototype.all = function(aFunction, includeMe) {
	var clusterList = this.impl.clusterGetList(this.options);
	var res = __, lO = [];

	for(var ii in clusterList) {
		if (includeMe || (clusterList[ii].host + clusterList[ii].port) != (this.HOST + this.PORT)) {
			lO.push($do(() => {
				return aFunction(clusterList[ii]);
			}));
		}
	}

	return lO;
};

/**
 * <odoc>
 * <key>ow.server.cluster.sendMsg(aHostMap, aMessageMap)</key>
 * Sends aMessageMap to a specific aHostMap (map composed of a host and a port) or to all cluster nodes if aHostMap = "all".
 * The aMessageMap should contain a "t" key for message topic. The topics "l", "u", "cl", "dl", "cu" and "du" are reserved
 * for cluster lock management.
 * </odoc>
 */
OpenWrap.server.prototype.cluster.prototype.sendMsg = function(aHost, aMessage) {
	return this.impl.clusterSendMsg(this.options, aHost, aMessage);
};

/**
 * <odoc>
 * <key>ow.server.cluster.setMsgHandler(aMessageTopic, aHandlerFunction)</key>
 * Sets aHandlerFunction to be called whenever the current node receives a message with aMessageTopic. The aHandlerFunction 
 * receives the implementation options and the message.
 * </odoc>
 */
OpenWrap.server.prototype.cluster.prototype.setMsgHandler = function(aTypeOfMessage, aHandlerFunction) {
	return this.impl.clusterSetMsgHandler(this.options, aTypeOfMessage, aHandlerFunction);
};

/**
 * <odoc>
 * <key>ow.server.cluster.canLock(aLockName) : boolean</key>
 * Sends messages to all other cluster nodes to reach quorum if can lock aLockName or not. Returns true if yes.
 * </odoc>
 */
OpenWrap.server.prototype.cluster.prototype.canLock = function(aLockName) {
	return this.impl.clusterCanLock(this.options, aLockName);
};

/**
 * <odoc>
 * <key>ow.server.cluster.canUnLock(aLockName) : boolean</key>
 * Sends messages to all other cluster nodes to reach quorum if can unlock aLockName or not. Returns true if yes.
 * </odoc>
 */
OpenWrap.server.prototype.cluster.prototype.canUnlock = function(aLockName) {
	return this.impl.clusterCanUnLock(this.options, aLockName);
};

/**
 * <odoc>
 * <key>ow.server.cluster.locks() : owServerLocks</key>
 * Returns the current cluster node ow.server.locks instance.
 * </odoc>
 */
OpenWrap.server.prototype.cluster.prototype.locks = function() {
	return this.impl.clusterLocks(this.options);
};

/**
 * <odoc>
 * <key>ow.server.cluster.whenUnLocked(aLockName, aFn, aTryTimeout, aNumRetries) : boolean</key>
 * A wrapper for ow.server.locks.lock that will try to lock aLockName after check in the cluster if it can be locked, execute the
 * provide function and then unlock it even in case an exception is raised. Returns if the lock was successfull (true) or not (false).
 * </odoc>
 */
OpenWrap.server.prototype.cluster.prototype.whenUnLocked = function(aLockName, aFn, aTryTimeout, aNumRetries) {
	return this.impl.clusterLocks(this.options).whenUnLocked(aLockName, aFn, aTryTimeout, aNumRetries);
};

/**
 * <odoc>
 * <key>ow.server.cluster.verify(addNewHostMap, delHostMap, customLoad)</key>
 * Verifies if all cluster nodes ports are reachable and updates the cluster file. If a cluster node is not reachable it will try
 * to a specific number of times after timing out on a specific timeout (see default values in help ow.server.cluster).
 * </odoc>
 */
OpenWrap.server.prototype.cluster.prototype.verify = function(addNewHost, delHost, customLoad) {
	var numTries = this.TRIES, triesTimeout = this.TRYTIMEOUT;
	while(this.impl.clusterLock(this.options) && numTries > 0) {
		numTries--;
		sleep(triesTimeout);
	}
	if (numTries > 0) {
		var clusterList = this.impl.clusterGetList(this.options);
		if (isUnDef(addNewHost)) addNewHost = {
			host: this.HOST,
			port: this.PORT,
			date: now(),
			dead: false
		};
		
		if ($path(clusterList.cluster, 
			      "[?host==`" + addNewHost.host + "`] | [?port==`" + addNewHost.port + "`] | length([])") == 0) clusterList.cluster.push(addNewHost);

		for(var ii in clusterList.cluster) {
			if ((isDef(delHost) && 
				(delHost.host == clusterList.cluster[ii].host && delHost.port == clusterList.cluster[ii].port)) || 
				 clusterList.cluster[ii].dead) {
				clusterList.cluster = deleteFromArray(clusterList.cluster, ii);
			} else {
				var res = ow.format.testPort(clusterList.cluster[ii].host, clusterList.cluster[ii].port, 100); 
				if (res) {
					clusterList.cluster[ii].date = now();
					clusterList.cluster[ii].load = (isDef(customLoad) ? customLoad : Math.floor(getCPULoad(true) * 10000));
					clusterList.cluster[ii].dead = false;
				} else {
					if (now() - clusterList.cluster[ii].date > this.NODETIMEOUT) {
						logWarn("Can't contact " + clusterList.cluster[ii].host + ":" + clusterList.cluster[ii].port + "!");
						clusterList.cluster[ii].dead = true;
					}
				}
			}
		}
		this.impl.clusterPutList(this.options, clusterList);
		this.impl.clusterUnLock(this.options);
		return true;
	} else {
		return false;
	}
};

/**
 * <odoc>
 * <key>ow.server.cluster.checkIn()</key>
 * Checks in the current cluster node.
 * </odoc>
 */
OpenWrap.server.prototype.cluster.prototype.checkIn = function() {
	var me = {
		host: this.HOST,
		port: this.PORT,
		date: now()
	};

	var res = this.verify(me);
	if (!res) throw "Can't register on cluster.";
};

/**
 * <odoc>
 * <key>ow.server.cluster.checkOut()</key>
 * Checks out the current cluster node.
 * </odoc>
 */
OpenWrap.server.prototype.cluster.prototype.checkOut = function() {
	var me = {
		host: this.HOST,
		port: this.PORT,
		date: now(),
		dead: false		
	};

	var res = this.verify(__, me);
	if (!res) throw("Can't unregister from cluster.");
};

/**
 * <odoc>
 * <key>ow.server.clusterChsPeersImpl</key>
 * This ow.servers.cluster implementation will cluster one or more cluster servers keeping the cluster connection details on
 * a cluster channel (defaults to __cluster::[name of cluster]). It's meant to be provided to ow.server.cluster like this:\
 * \
 * var mts = new ow.server.cluster("1.2.3.4", 1234, __, __, __, { name: "testCluster" }, ow.server.clusterChsPeersImpl)\
 * \
 * There are several implementation options:\
 * \
 *    name         (String, mandatory)  The clusters name.\
 *    serverOrPort (Number or HTTPd)    Port or http server object where the cluster node channels will be available.\
 *    protocol     (String)             The transport protocol use to reach other cluster (defaults to http).\
 *    path         (String)             The path where other cluster nodes channel is reachable (defaults to '/__m').\
 *    authFunc     (Function)           Optional authentication function (see mor in ow.ch.server.peer).\
 *    unAuthFunc   (Function)           Optional failed authentication function (see more in ow.ch.server.peer).\
 *    maxTime      (Number)             Optional retry max time (see more in ow.ch.server.peer).\
 *    maxCount     (Number)             Optional max count of retries (see more in ow.ch.server.peer).\
 *    ch           (String)             The cluster local channel (defaults to "__cluster::[name of cluster]").\
 *    chs          (Array)              Array of names of channels or maps with each channel name and path. These channels will be automatically peered and unpeered with other cluster nodes. The path, if not provided, defaults to "/[name of channel]".\
 *    chErrs       (String)             The cluster local errors channel (default is none).\
 * \
 * </odoc>
 */
OpenWrap.server.prototype.clusterChsPeersImpl = {
	clusterLocks: (aOps) => {
		return aOps.locks;
	},
	clusterCanLock: (aOps, aLockName) => {
		_$(aLockName).isString().$_("Please provide a lock name.");
		var canLock = false, allVotesIn = false;

		ow.server.clusterChsPeersImpl.__check(aOps);
		var uuid = $ch(aOps.quorum).subscribe((aCh, aOp, aK, aV) => {
			if (aOp == "set") aV = [ aV ];
			if (aOp == "set" || aOp == "setall") {
				for(var ii in aV) {
					if (!allVotesIn && aV[ii].n == aLockName) {
						var clusterSize = $ch(aOps.ch).size();
						var qitem = $ch(aCh).get({ t: "locks", n: aLockName });
						if (qitem.qNk.length > 0) {
							canLock = false; allVotesIn = true; // veto
						} else {
							if (qitem.qOk.length >= Math.floor(((clusterSize / 2) + 1))) {
								canLock = true; allVotesIn = true;
							}
						}
					}
				}
			} 
		});
		$ch(aOps.quorum).set({
			t: "locks", n: aLockName
		}, {
			t: "locks", n: aLockName, qOk: [], qNk: []
		});
		ow.server.clusterChsPeersImpl.clusterSendMsg(aOps, "all", {
			t: "l",
			n: aLockName,
			b: aOps.HOST + ":" + aOps.PORT
		});
		var timeout = now() + aOps.quorumTimeout;
		while(timeout > now() && !allVotesIn) {
			sleep(150);
		}
		$ch(aOps.quorum).unsubscribe(uuid);
		$ch(aOps.quorum).unset({
			t: "locks", n: aLockName
		});
		return canLock;
	},
	clusterCanUnLock: (aOps, aLockName) => {
		_$(aLockName).isString().$_("Please provide a lock name.");
		var canUnLock = false, allVotesIn = false;
		
		ow.server.clusterChsPeersImpl.__check(aOps);
		var uuid = $ch(aOps.quorum).subscribe((aCh, aOp, aK, aV) => {
			if (aOp == "set") aV = [ aV ];
			if (aOp == "set" || aOp == "setall") {
				for(var ii in aV) {
					if (!allVotesIn && aV[ii].n == aLockName) {
						var clusterSize = $ch(aOps.ch).size();
						var qitem = $ch(aCh).get({ t: "unlocks", n: aLockName });
						if (qitem.qNk.length > 0) {
							canUnLock = false; allVotesIn = true; // veto
						} else {
							if (qitem.qOk.length >= Math.floor(((clusterSize / 2) + 1))) {
								canUnLock = true; allVotesIn = true;
							}
						}
					}
				}
			} 
		});
		$ch(aOps.quorum).set({
			t: "unlocks", n: aLockName
		}, {
			t: "unlocks", n: aLockName, qOk: [], qNk: []
		});
		ow.server.clusterChsPeersImpl.clusterSendMsg(aOps, "all", {
			t: "u",
			n: aLockName,
			b: aOps.HOST + ":" + aOps.PORT
		});
		var timeout = now() + aOps.quorumTimeout;
		while(timeout > now() && !allVotesIn) {
			sleep(150);
		}
		$ch(aOps.quorum).unsubscribe(uuid);
		$ch(aOps.quorum).unset({
			t: "unlocks", n: aLockName
		});
		return canUnLock;
	},
	clusterSetMsgHandler: (aOptions, aTypeOfMessage, aHandlerFunction) => {
		_$(aTypeOfMessage).isString().$_("Please provide a type of message.");
		_$(aHandlerFunction).isFunction().$_("Please provide a handler function.");

		ow.server.clusterChsPeersImpl.__check(aOptions);

		aOptions.opsMsgs[aTypeOfMessage] = aHandlerFunction;
	},
	clusterSendMsg: (aOptions, aTo, aMessage) => {
		ow.server.clusterChsPeersImpl.__check(aOptions);

		var id = nowNano();
		var receptors = [];

		if (aTo == "all") {
			receptors = $path($ch(aOptions.ch).getAll(), "[].{ host: h, port: p }");
		} else {
			var [aHost, aPort] = aTo.split(/:/);
			receptors.push({
				host: aHost,
				port: aPort
			});
		}

		var rPros = [], errs = {};
		receptors.forEach((v) => {
			var vclo = clone(v);
			rPros = $do(() => {
				var isLocal = (aOptions.HOST == vclo.host && aOptions.PORT == vclo.port);
				var url = aOptions.protocol + "://" + vclo.host + ":" + vclo.port + aOptions.path + "_msgs";
				var ch = (isLocal) ? aOptions.chMsgs : aOptions.chMsgs + "::" + vclo.host + ":" + vclo.port;
				var existed = false;

				errs[aOptions.chMsgs + "::" + vclo.host + ":" + vclo.port] = {
					sent: false
				};
				if (!isLocal) { $ch(ch).createRemote(url); existed = true; }
				$ch(ch).set({
					i: id,
					f: aOptions.HOST + ":" + aOptions.PORT,
					t: vclo.host + ":" + vclo.port
				}, {
					i: id,
					f: aOptions.HOST + ":" + aOptions.PORT,
					t: vclo.host + ":" + vclo.port,
					m: aMessage	
				});
				if (!isLocal && !existed) $ch(ch).destroy();
				errs[aOptions.chMsgs + "::" + vclo.host + ":" + vclo.port] = {
					sent: true
				};
			}).catch((e) => {
				errs[aOptions.chMsgs + "::" + vclo.host + ":" + vclo.port] = {
					sent: false,
					error: e
				};
				if (isDef(aOptions.chErrs)) {
					$ch(aOptions.chErrs).set({
						h: vclo.host,
						p: vclo.port,
						e: e
					});
				}
				//printErr("ERROR clusterSendMsg: " + aOptions.chMsgs + "::" + vclo.host + ":" + vclo.port + " | " + stringify(e, __, ""));
			});
		});
		$doWait($doAll(rPros));
		return errs;
	},
	__check: (aOptions) => {
		if (isUnDef(aOptions.init) || !aOptions.init) {
			aOptions.init = true;
			ow.loadServer();
			ow.loadObj();

			aOptions.name = _$(aOptions.name).isString().$_("Please provide a name for the ow.server.cluster chsPeerImpl.");
			aOptions.protocol = _$(aOptions.protocol).isString().default("http");
			aOptions.path = _$(aOptions.path).isString().default("/__m");
			if (isUnDef(aOptions.serverOrPort)) aOptions.serverOrPort = ow.server.httpd.start(aOptions.PORT, aOptions.HOST);
			aOptions.authFunc = _$(aOptions.authFunc).default(__);
			aOptions.unAuthFunc = _$(aOptions.unAuthFunc).default(__);
			aOptions.maxTime = _$(aOptions.maxTime).default(__);
			aOptions.maxCount = _$(aOptions.maxCount).default(__);
			aOptions.chLock = _$(aOptions.chLock).default("__cluster::" + aOptions.name + "::locks");
			aOptions.chMsgs = _$(aOptions.chMsgs).default("__cluster::" + aOptions.name + "::msgs");
			aOptions.quorum = _$(aOptions.chQuorum).default("__cluster::" + aOptions.name + "::quorum");
			aOptions.chs = _$(aOptions.chs).isArray().default([]);
			aOptions.opsMsgs = _$(aOptions.opsMsgs).default({});
			aOptions.quorumTimeout = _$(aOptions.quorumTimeout).default(5000);
	
			aOptions.chs.push({
				name: aOptions.chMsgs,
				peer: false,
				path: aOptions.path + "_msgs"
			});

			//aOptions.chs.push(aOptions.chLock);
			$ch(aOptions.chMsgs).create(1, "dummy");
			$ch(aOptions.chLock).create(1, "simple");
			$ch(aOptions.quorum).create(1, "simple");

			aOptions.locks = new ow.server.locks("cluster", aOptions.chLock, { cluster: ow.server.clusterChsPeersImpl, clusterOptions: aOptions });
			if (isUnDef(aOptions.ch)) aOptions.ch = "__cluster::" + aOptions.name;

			aOptions.opsMsgs.l = (aOps, v) => {
				// lock 
				//var tt = (aOps.locks.isLocked(v.m.n).value ? "dl" : "cl");
				var tt;
				if (v.m.b == (aOps.HOST + ":" + aOps.PORT)) {
					tt = "cl";
				} else {
					//tt = (!aOps.locks.isLocked(v.m.n).value && aOps.locks.lock(v.m.n) ? "cl" : "dl");
					tt = (!aOps.locks.isLocked(v.m.n).value ? "cl" : "dl");
				}

				ow.server.clusterChsPeersImpl.clusterSendMsg(aOps, v.m.b, {
					t: tt,
					n: v.m.n
				});
			};

			aOptions.opsMsgs.u = (aOps, v) => {
				// unlock 
				//var tt = (aOps.locks.isLocked(v.m.n).value ? "cu" : "du");
				var tt;
				if (v.m.b == (aOps.HOST + ":" + aOps.PORT)) {
					tt = "cu";
				} else {
					//tt = (aOps.locks.unlock(v.m.n) ? "cu" : "du");
					tt = (aOps.locks.isLocked(v.m.n) ? "cu" : "du");
				} 

				ow.server.clusterChsPeersImpl.clusterSendMsg(aOps, v.m.b, {
					t: tt,
					n: v.m.n
				});
			};

			aOptions.opsMsgs.cl = (aOps, v) => {
				var current = $ch(aOps.quorum).get({ t: "locks", n: v.m.n });
				current.qOk.push(v.f);
				$ch(aOps.quorum).set({ 
					t: "locks", 
					n: v.m.n 
				}, { 
					t: "locks", 
					n: v.m.n,
					qOk: current.qOk,
					qNk: current.qNk
				});
			};
			aOptions.opsMsgs.dl = (aOps, v) => {
				var current = $ch(aOps.quorum).get({ t: "locks", n: v.m.n });
				current.qNk.push(v.f);
				$ch(aOps.quorum).set({ 
					t: "locks", 
					n: v.m.n 
				}, { 
					t: "locks", 
					n: v.m.n,
					qOk: current.qOk,
					qNk: current.qNk
				});
			};

			aOptions.opsMsgs.cu = (aOps, v) => {
				// confirm unlock
				var current = $ch(aOps.quorum).get({ t: "unlocks", n: v.m.n });
				current.qOk.push(v.f);
				$ch(aOps.quorum).set({ 
					t: "unlocks", 
					n: v.m.n 
				}, { 
					t: "unlocks", 
					n: v.m.n,
					qOk: current.qOk,
					qNk: current.qNk
				});
			};

			aOptions.opsMsgs.du = (aOps, v) => {
				var current = $ch(aOps.quorum).get({ t: "unlocks", n: v.m.n });
				current.qNk.push(v.f);
				$ch(aOps.quorum).set({ 
					t: "unlocks", 
					n: v.m.n 
				}, { 
					t: "unlocks", 
					n: v.m.n,
					qOk: current.qOk,
					qNk: current.qNk
				});
			};

			$ch(aOptions.chMsgs).subscribe((aCh, aOp, aK, aV) => {
				if (aOp == "set") aV = [ aV ];
				if (aOp == "setAll" || aOp == "set") {
					for(var vi in aV) {
						var v = aV[vi];
						if (isDef(v.t) && isDef(v.i) && isDef(v.f) && isDef(v.m)) {
							if ((v.t == "all" && v.f != aOptions.HOST + ":" + aOptions.PORT) || 
							     v.t == aOptions.HOST + ":" + aOptions.PORT) {
								aOptions.opsMsgs[v.m.t](aOptions, v);
							}
						}
					}
				}
			});
		}
		
		if ($ch().list().indexOf(aOptions.ch) < 0) {
			$ch(aOptions.ch).create(1, "simple");

			$ch(aOptions.ch).expose(aOptions.serverOrPort, aOptions.path, aOptions.authFunc, aOptions.unAuthFunc);
			var parent = this;
			$ch(aOptions.ch).subscribe((aCh, aOp, aK, aV) => {
				try{
				var add = (m) => {
					if (m.h == aOptions.host && m.p == aOptions.port) return;
					var url = aOptions.protocol + "://" + m.h + ":" + m.p + aOptions.path;
					$ch(aOptions.ch).peer(aOptions.serverOrPort, aOptions.path, url, aOptions.authFunc, aOptions.unAuthFunc, aOptions.maxTime, aOptions.maxCount);
					
					for(var ii in aOptions.chs) {
						var achs = aOptions.chs[ii];
						if (isString(achs)) {
							achs = {
								name: achs,
								peer: true
							};
						}
						if (isMap(achs) && isDef(achs.name)) {
							achs.path = _$(achs.path).isString().default("/" + achs.name);
							var turl = aOptions.protocol + "://" + m.h + ":" + m.p + achs.path;
							if (isDef(achs.peer) && achs.peer) {
								$ch(achs.name).peer(aOptions.serverOrPort, achs.path, turl, aOptions.authFunc, aOptions.unAuthFunc, aOptions.maxTime, aOptions.maxCount);
							} else {
								$ch(achs.name).expose(aOptions.serverOrPort, achs.path, aOptions.authFunc, aOptions.unAuthFunc);
							}
						}
					}
				};

				var del = (m) => {
					var url = aOptions.protocol + "://" + m.h + ":" + m.p + parent.path;
					$ch(aOptions.ch).unpeer(url);
					for(var ii in aOptions.chs) {
						var achs = aOptions.chs[ii];
						if (isString(achs)) {
							achs = {
								name: achs
							};
						}
						if (isMap(achs) && isDef(achs.name)) {
							achs.path = _$(achs.path).isString().default("/" + achs.name);
							var turl = aOptions.protocol + "://" + m.h + ":" + m.p + achs.path;
							$ch(achs.name).unpeer(turl);
						}
					}
				};

				switch(aOp) {
				case "set"     : add(aK); break;
				case "setall"  : aV.forEach((v) => { add(ow.obj.filterKeys(aK, v)); }); break;
				case "unset"   : del(aK); break;
				case "unsetall": aV.forEach((v) => { del(ow.obj.filterKeys(aK, v)); }); break;
				}
				} catch(e){sprintErr(e);} 
			});
		}
	},
	clusterLock: (aOptions) => { },
	clusterUnLock: (aOptions) => { },
	clusterGetList: (aOptions) => {
		ow.server.clusterChsPeersImpl.__check(aOptions);

		var res = $ch(aOptions.ch).getAll();
		return { cluster: $path(res, "[].{ host: h, port: p, date: d, dead: a, load: l }") };
	},
	clusterPutList: (aOptions, aList) => {
		ow.server.clusterChsPeersImpl.__check(aOptions);
		var res = $ch(aOptions.ch).getKeys();
		for(var ii in res) {
			var it = res[ii];
			if ($from(aList.cluster).equals("host", it.h).equals("port", it.p).none()) {
				$ch(aOptions.ch).unset({ h: it.h, p: it.p });
			}
		}
		$ch(aOptions.ch).setAll(["h", "p"], $path(aList.cluster, "[].{ h: host, p: port, d: date, a: dead, l: load }"));
	}
};

//-----------------------------------------------------------------------------------------------------
// HTTP SERVER
//-----------------------------------------------------------------------------------------------------

OpenWrap.server.prototype.httpd = {
	__routes: {},
	__defaultRoutes: {},
	__preRoutes: {},

	/**
	 * <odoc>
	 * <key>ow.server.httpd.start(aPort, aHost, keyStorePath, password, errorFunction, aWebSockets, aTimeout) : Object</key>
	 * Will prepare a HTTP server to be used returning a HTTPServer object. Optionally you can provide 
	 * aPort where you want the HTTP server to run. Otherwise a free port will be assigned.
	 * (available after ow.loadServer()).\
	 * \
	 * aWebSockets, if used, should be a map with the following functions:\
	 * \
	 *    onOpen(_ws)\
	 *    onClose(_ws, aCode, aReason, hasInitByRemote)\
	 *    onMessage(_ws, aMessage)\
	 *    onPong(_ws, aPong)\
	 *    onException(_ws, anException)\
	 * \
	 * </odoc>
	 */
	start: function(aPort, aHost, keyStorePath, password, errorFunction, aWebSockets, aTimeout) {
		plugin("HTTPServer");
		
		if (isUnDef(aPort)) {
			aPort = findRandomOpenPort();
		}
		
		var hs;
		if (isDef(aWebSockets) && isMap(aWebSockets)) 
			hs = new HTTPd(aPort, aHost, keyStorePath, password, errorFunction, new Packages.com.nwu.httpd.IWebSock({
				oOpen     : aWebSockets.onOpen,
				oClose    : aWebSockets.onClose,
				oMessage  : aWebSockets.onMessage,
				oPong     : aWebSockets.onPong,
				oException: aWebSockets.onException
			}), aTimeout);
		else
			hs = new HTTPd(aPort, aHost, keyStorePath, password, errorFunction);
		
		this.resetRoutes(hs);

		return hs;
	},

	/**
	 * <odoc>
	 * <key>ow.server.httpd.setWebSocketRoute(aHTTPd, aURI)</key>
	 * Using aHTTPd sets aURI to act as a websocket server.
	 * </odoc>
	 */
	setWebSocketRoute: function(aHTTPd, aURI) {
		aHTTPd.addWS(aURI);
	},
	
	/**
	 * <odoc>
	 * <key>ow.server.httpd.resetRoutes(aHTTPd)</key>
	 * Given aHTTPd it will reset all internal mapped routes to a reply HTTP code 401 to everything.
	 * </odoc>
	 */
	resetRoutes: function(aHTTPd) {
		this.__routes[aHTTPd.getPort()] = {};
		this.__defaultRoutes[aHTTPd.getPort()] = {};
		this.__preRoutes[aHTTPd.getPort()] = {};

		var nullFunc = function(r) { return aHTTPd.reply("", "", 401, {}); };
		this.route(aHTTPd, { "/": nullFunc }, nullFunc);

		return aHTTPd;
	},

	/**
	 * <odoc>
	 * <key>ow.server.httpd.getFromOpenAF(aResource, inBytes, anEncoding) : anArrayOfBytes</key>
	 * Retrieves aResource, as anArrayOfBytes, from the openaf.jar. This resource can be inBytes = true or
	 * not and anEncoding can be provided.
	 * </odoc>
	 */
	getFromOpenAF: function(aResource, isBytes, encoding) {
		return this.getFromZip(getOpenAFJar(), aResource, isBytes, encoding);
	},
	
	/**
	 * <odoc>
	 * <key>ow.server.httpd.getFromZip(aZipFile, aResource, inBytes, anEncoding) : anArrayOfBytes</key>
	 * Retrieves aResource, as anArrayOfBytes, from aZipFile. This resource can be inBytes = true or
	 * not and anEncoding can be provided.
	 * </odoc>
	 */
	getFromZip: function(aZipFile, aResource, isBytes, encoding) {		
		return getFromZip(aZipFile, aResource, isBytes, encoding);
	},
	
	/**
	 * <odoc>
	 * <key>ow.server.httpd.route(aHTTPd, aMapOfRoutes, aDefaultRoute, aPath, aPreRouteFunc)</key>
	 * Adds a request router to aHTTPd given aMapOfRoutes. This router will use aPath if defined or /r otherwise.
	 * Optionally you can also specify aPreRouteFunc that will run before any routing is made.\
	 * Example:\
	 * \
	 * ow.loadServer();\
	 * var hs = ow.server.httpd.start(17878);\
	 * ow.server.httpd.route(hs, ow.server.httpd.mapRoutesWithLibs(hs, {\
	 * 		"/myapp": function(req, aHs) {\
	 * 			return aHs.replyOKText("my stuff!!");\
	 * 		}\
	 * }),\
	 * function(req) {\
	 * 		return hs.replyOKText("nothing here...");\
	 * });\
	 * log("READY!");\
	 * ow.server.daemon();\
	 * \
	 * (available after ow.loadServer())
	 * </odoc>
	 */
	route: function(aHTTPd, aMapOfRoutes, aDefaultRoute, aPath, aPreRouteFunc) {
		if (isUnDef(aPath)) aPath = "/r/";
		if (isUnDef(aMapOfRoutes)) aMapOfRoutes = {};
		ow.loadFormat();
		
		var parent = this;
		var aPort = aHTTPd.getPort() + 0;
		var aP    = String(aPath);
		
		this.__routes[aPort] = aMapOfRoutes;
		if (isDef(aDefaultRoute)) this.__defaultRoutes[aPort] = aDefaultRoute;
		if (isDef(aPreRouteFunc)) this.__preRoutes[aPort] = aPreRouteFunc;
		
		aHTTPd.add(aPath, function(req) {			
			var uri = req.uri.replace(new RegExp("^" + aP), "");
			if (isFunction(parent.__preRoutes[aPort])) parent.__preRoutes[aPort](req, aHTTPd);
			if (isFunction(parent.__routes[aPort][uri])) {
				return parent.__routes[aPort][uri](req, aHTTPd);
			} else {
				var bp = ow.format.string.bestPrefix(uri, Object.keys(parent.__routes[aPort]));
				if (isDef(bp))
					return parent.__routes[aPort][bp](req, aHTTPd);
				else
					return parent.__defaultRoutes[aPort](req, aHTTPd);
			}
		});
		
		aHTTPd.setDefault(aPath);
	},
	
	/**
	 * <odoc>
	 * <key>ow.server.httpd.mapWithExistingRoutes(aHTTPd, aMapOfRoutes) : Map</key>
	 * Builds a map of routes taking into account the already defined routes for aHTTPd thus effectively
	 * letting add new routes. 
	 * </odoc>
	 */
	mapWithExistingRoutes: function(aHTTPd, aMapOfRoutes) {
		if (isUnDef(aMapOfRoutes)) aMapOfRoutes = {};
		var res = {};
		for(var i in this.__routes[aHTTPd.getPort()]) { res[i] = this.__routes[aHTTPd.getPort()][i]; }
		for(var i in aMapOfRoutes) { res[i] = aMapOfRoutes[i]; }
		return res;
	},
	
	getDefaultRoute: function(aHTTPd) {
		if (isUndefined(this.__defaultRoutes[aHTTPd.getPort()])) return undefined;
		return this.__defaultRoutes[aHTTPd.getPort()];
	},

	/**
	 * <odoc>
	 * <key>ow.server.httpd.stop(aHTTPd)</key>
	 * Will stop the aHTTPd server running. 
	 * (available after ow.loadServer())
	 * </odoc>
	 */
	stop: function(aHTTPd) {
		aHTTPd.stop();
		delete this.__routes[aHTTPd.getPort()];
		delete this.__defaultRoutes[aHTTPd.getPort()];
		delete this.__preRoutes[aHTTPd.getPort()];
	},
	
	/**
	 * <odoc>
	 * <key>ow.server.httpd.mapRoutesWithLibs(aHTTPd, aMapOfRoutes) : Map</key>
	 * Helper to use with ow.server.httpd.route to automatically add routes for JQuery,
	 * Handlebars, jLinq and Underscore from the openaf.jar.
	 * </odoc>
	 */
	mapRoutesWithLibs: function(aHTTPd, aMapOfRoutes) {
		if (isUnDef(aMapOfRoutes)) aMapOfRoutes = {};
		aMapOfRoutes["/js/jquery.js"] = function() { return ow.server.httpd.replyJQuery(aHTTPd); };
		aMapOfRoutes["/js/handlebars.js"] = function() { return ow.server.httpd.replyHandlebars(aHTTPd); };
		aMapOfRoutes["/js/stream.js"] = function() { return ow.server.httpd.replyStream(aHTTPd); };
		aMapOfRoutes["/js/jlinq.js"] = function() { return ow.server.httpd.replyJLinq(aHTTPd); };
		aMapOfRoutes["/js/openafnlinq.js"] = function() { return ow.server.httpd.replyNLinq(aHTTPd); };
		aMapOfRoutes["/js/jmespath.js"] = function() { return ow.server.httpd.replyJMesPath(aHTTPd); };
		aMapOfRoutes["/js/underscore.js"] = function() { return ow.server.httpd.replyUnderscore(aHTTPd); };
		aMapOfRoutes["/js/lodash.js"] = function() { return ow.server.httpd.replyLoadash(aHTTPd); };
		aMapOfRoutes["/js/openafsigil.js"] = function() { return aHTTPd.reply(ow.server.httpd.getFromOpenAF("js/openafsigil.js"), ow.server.httpd.mimes.JS, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/js/njsmap.js"] = function() { return aHTTPd.reply(ow.server.httpd.getFromOpenAF("js/njsmap.js"), ow.server.httpd.mimes.JS, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/js/highlight.js"] = function() { return aHTTPd.reply(ow.server.httpd.getFromOpenAF("js/highlight.js"), ow.server.httpd.mimes.JS, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/js/materialize.js"] = function() { return aHTTPd.reply(ow.server.httpd.getFromOpenAF("js/materialize.js"), ow.server.httpd.mimes.JS, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/css/materialize.css"] = function() { return aHTTPd.reply(ow.server.httpd.getFromOpenAF("css/materialize.css"), ow.server.httpd.mimes.CSS, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/css/materialize-icon.css"] = function() { return aHTTPd.reply(ow.server.httpd.getFromOpenAF("css/materialize-icon.css"), ow.server.httpd.mimes.CSS, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/css/github-gist.css"] = function() { return aHTTPd.reply(ow.server.httpd.getFromOpenAF("css/github-gist.css"), ow.server.httpd.mimes.CSS, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/css/github-markdown.css"] = function() { return aHTTPd.reply(ow.server.httpd.getFromOpenAF("css/github-markdown.css"), ow.server.httpd.mimes.CSS, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/css/nJSMap.css"] = function() { return aHTTPd.reply(ow.server.httpd.getFromOpenAF("css/nJSMap.css"), ow.server.httpd.mimes.CSS, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/material-design-icons/Material-Design-Icons.eot"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/material-design-icons/Material-Design-Icons.eot", true), ow.server.httpd.mimes.EOT, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/material-design-icons/Material-Design-Icons.svg"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/material-design-icons/Material-Design-Icons.svg", true), ow.server.httpd.mimes.SVG, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/material-design-icons/Material-Design-Icons.ttf"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/material-design-icons/Material-Design-Icons.ttf", true), ow.server.httpd.mimes.TTF, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/material-design-icons/Material-Design-Icons.woff"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/material-design-icons/Material-Design-Icons.woff", true), ow.server.httpd.mimes.WOFF, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/material-design-icons/Material-Design-Icons.woff2"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/material-design-icons/Material-Design-Icons.woff2", true), ow.server.httpd.mimes.WOFF, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/roboto/Roboto-Bold.eot"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Bold.eot", true), ow.server.httpd.mimes.EOT, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/roboto/Roboto-Bold.ttf"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Bold.ttf", true), ow.server.httpd.mimes.TTF, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/roboto/Roboto-Bold.woff"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Bold.woff", true), ow.server.httpd.mimes.WOFF, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/roboto/Roboto-Bold.woff2"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Bold.woff2", true), ow.server.httpd.mimes.WOFF, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/roboto/Roboto-Light.eot"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Light.eot", true), ow.server.httpd.mimes.EOT, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/roboto/Roboto-Light.ttf"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Light.ttf", true), ow.server.httpd.mimes.TTF, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/roboto/Roboto-Light.woff"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Light.woff", true), ow.server.httpd.mimes.WOFF, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/roboto/Roboto-Light.woff2"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Light.woff2", true), ow.server.httpd.mimes.WOFF, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/roboto/Roboto-Medium.eot"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Medium.eot", true), ow.server.httpd.mimes.EOT, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/roboto/Roboto-Medium.ttf"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Medium.ttf", true), ow.server.httpd.mimes.TTF, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/roboto/Roboto-Medium.woff"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Medium.woff", true), ow.server.httpd.mimes.WOFF, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
        aMapOfRoutes["/fonts/roboto/Roboto-Medium.woff2"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Medium.woff2", true), ow.server.httpd.mimes.WOFF, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/roboto/Roboto-Regular.eot"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Regular.eot", true), ow.server.httpd.mimes.EOT, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/roboto/Roboto-Regular.ttf"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Regular.ttf", true), ow.server.httpd.mimes.TTF, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/roboto/Roboto-Regular.woff"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Regular.woff", true), ow.server.httpd.mimes.WOFF, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/roboto/Roboto-Regular.woff2"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Regular.woff2", true), ow.server.httpd.mimes.WOFF, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/roboto/Roboto-Thin.eot"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Thin.eot", true), ow.server.httpd.mimes.EOT, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/roboto/Roboto-Thin.ttf"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Thin.ttf", true), ow.server.httpd.mimes.TTF, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/roboto/Roboto-Thin.woff"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Thin.woff", true), ow.server.httpd.mimes.WOFF, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/roboto/Roboto-Thin.woff2"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Thin.woff2", true), ow.server.httpd.mimes.WOFF, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/openaf.ico"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/openaf.ico", true), ow.server.httpd.mimes.ICO, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/openaf_large.png"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/openaf_large.png", true), ow.server.httpd.mimes.PNG, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/openaf_medium.png"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/openaf_medium.png", true), ow.server.httpd.mimes.PNG, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		aMapOfRoutes["/fonts/openaf_small.png"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/openaf_small.png", true), ow.server.httpd.mimes.PNG, ow.server.httpd.codes.OK, ow.server.httpd.cache.public) };
		return aMapOfRoutes;
	},
	
	replyJQuery: function(aHTTPd) {
		return aHTTPd.reply(ow.server.httpd.getFromOpenAF("js/jquery.js"), ow.server.httpd.mimes.JS, ow.server.httpd.codes.OK, ow.server.httpd.cache.public);
	},
	
	replyHandlebars: function(aHTTPd) {
		return aHTTPd.reply(ow.server.httpd.getFromOpenAF("js/handlebars.js"), ow.server.httpd.mimes.JS, ow.server.httpd.codes.OK, ow.server.httpd.cache.public);
	},
	
	replyStream: function(aHTTPd) {
		return aHTTPd.reply(ow.server.httpd.getFromOpenAF("js/stream.js"), ow.server.httpd.mimes.JS, ow.server.httpd.codes.OK, ow.server.httpd.cache.public);
	},
	
	replyJLinq: function(aHTTPd) {
		return aHTTPd.reply(ow.server.httpd.getFromOpenAF("js/jlinq.js"), ow.server.httpd.mimes.JS, ow.server.httpd.codes.OK, ow.server.httpd.cache.public);		
	},

	replyNLinq: function(aHTTPd) {
		return aHTTPd.reply(ow.server.httpd.getFromOpenAF("js/openafnlinq.js"), ow.server.httpd.mimes.JS, ow.server.httpd.codes.OK, ow.server.httpd.cache.public);		
	},

	replyJMesPath: function(aHTTPd) {
		return aHTTPd.reply(ow.server.httpd.getFromOpenAF("js/jmespath.js"), ow.server.httpd.mimes.JS, ow.server.httpd.codes.OK, ow.server.httpd.cache.public);		
	},	
	
	replyUnderscore: function(aHTTPd) {
		return aHTTPd.reply(ow.server.httpd.getFromOpenAF("js/lodash.js"), ow.server.httpd.mimes.JS, ow.server.httpd.codes.OK, ow.server.httpd.cache.public);		
	},
	
	replyLoadash: function(aHTTPd) {
		return aHTTPd.reply(ow.server.httpd.getFromOpenAF("js/lodash.js"), ow.server.httpd.mimes.JS, ow.server.httpd.codes.OK, ow.server.httpd.cache.public);		
	},

	/**
	 * <odoc>
	 * <key>ow.server.httpd.replyFile(aHTTPd, aBaseFilePath, aBaseURI, aURI, notFoundFunction, documentRootArray, mapOfHeaders) : Map</key>
	 * Provides a helper aHTTPd reply that will enable the download of a file, from aBaseFilePath, given aURI part of 
	 * aBaseURI. Optionally you can also provide a notFoundFunction and an array of file strings (documentRootArraY) to replace as
	 * documentRoot. Example:\
	 * \
	 * ow.server.httpd.route(hs, ow.server.httpd.mapRoutesWithLibs(hs, {\
	 *    "/stuff/to/server": r => ow.server.httpd.replyFile(hs, "/some/path/to/serve/files", "/stuff/to/server", req.uri)\
	 * }), r => hs.replyOKText("nothing here...") );\
	 * \
	 * </odoc>
	 */
	replyFile: function(aHTTPd, aBaseFilePath, aBaseURI, aURI, notFoundFunction, documentRootArray, mapOfHeaders) {
		if (isUnDef(notFoundFunction)) {
			notFoundFunction = function() {
				return aHTTPd.reply("Not found!", ow.server.httpd.mimes.TXT, ow.server.httpd.codes.NOTFOUND);
			}
		}
		try {
			var baseFilePath = String((new java.io.File(aBaseFilePath)).getCanonicalPath()).replace(/\\/g, "/");
			var furi = String((new java.io.File(new java.io.File(baseFilePath),
				(new java.net.URI(aURI.replace(new RegExp("^" + aBaseURI), "") )).getPath())).getCanonicalPath()).replace(/\\/g, "/");
			
			if (furi.match(new RegExp("^" + baseFilePath + "$"))) {
				for(var i in documentRootArray) {
					furi = String((new java.io.File(new java.io.File(baseFilePath),
						(new java.net.URI((aURI + documentRootArray[i]).replace(new RegExp("^" + aBaseURI), "") )).getPath())).getCanonicalPath());
					if (furi.match(new RegExp("^" + baseFilePath))) break;
				}
			}
		
			if (furi.match(new RegExp("^" + baseFilePath)))
				return aHTTPd.replyBytes(io.readFileBytes(furi), ow.server.httpd.getMimeType(furi), __, mapOfHeaders);
			else
			  return notFoundFunction(aHTTPd, aBaseFilePath, aBaseURI, aURI);
		} catch(e) { 
			return notFoundFunction(aHTTPd, aBaseFilePath, aBaseURI, aURI, e);
		}
	},
	
	/**
	 * <odoc>
	 * <key>ow.server.httpd.replyFileMD(aHTTPd, aBaseFilePath, aBaseURI, aURI, notFoundFunction, documentRootArray, mapOfHeaders) : Map</key>
	 * Provides a helper aHTTPd reply that will enable the parsing markdown file-based sites, from aBaseFilePath, given aURI part of 
	 * aBaseURI. Optionally you can also provide a notFoundFunction and an array of file strings (documentRootArraY) to replace as
	 * documentRoot. Example:\
	 * \
	 * ow.server.httpd.route(hs, ow.server.httpd.mapRoutesWithLibs(hs, {\
	 *    "/stuff/to/server": function(req) {\
	 *       return ow.server.httpd.replyFileMD(hs, "/some/path/to/serve/files", "/stuff/to/server", req.uri);\
	 *    }\
	 * }),\
	 * function(req) {\
	 *    return hs.replyOKText("nothing here...");\
	 * }\
	 * );\
	 * \
	 * </odoc>
	 */
	replyFileMD: function(aHTTPd, aBaseFilePath, aBaseURI, aURI, notFoundFunction, documentRootArray, mapOfHeaders) {
		ow.loadTemplate();

		if (isUnDef(notFoundFunction)) {
			notFoundFunction = function() {
				return aHTTPd.reply("Not found!", ow.server.httpd.mimes.TXT, ow.server.httpd.codes.NOTFOUND);
			}
		}
		try {
			var baseFilePath = String((new java.io.File(aBaseFilePath)).getCanonicalPath()).replace(/\\/g, "/");
			var furi = String((new java.io.File(new java.io.File(baseFilePath),
				(new java.net.URI(aURI.replace(new RegExp("^" + aBaseURI), "") )).getPath())).getCanonicalPath()).replace(/\\/g, "/");
			
			if (isUnDef(documentRootArray)) documentRootArray = [ "index.md" ];

			// TODO:if io.fileExists is false to directories
			if (io.fileExists(furi) && io.fileInfo(furi).isDirectory) {
				for(var i in documentRootArray) {
					furi = String((new java.io.File(new java.io.File(baseFilePath),
						(new java.net.URI((aURI + documentRootArray[i]).replace(new RegExp("^" + aBaseURI), "") )).getPath())).getCanonicalPath());
					if (furi.match(new RegExp("^" + baseFilePath))) break;
				}
			}

			if (!(furi.match(/[^/]+\.[^/]+$/))) furi = furi + ".md";

			if (furi.match(new RegExp("^" + baseFilePath))) {
				if (furi.match(/\.md$/)) {
					return aHTTPd.replyOKHTML(ow.template.parseMD2HTML(io.readFileString(furi), 1));
				} else {
					return aHTTPd.replyBytes(io.readFileBytes(furi), ow.server.httpd.getMimeType(furi), __, mapOfHeaders);
				}
			} else {
			    return notFoundFunction(aHTTPd, aBaseFilePath, aBaseURI, aURI);
			}
		} catch(e) { 
			return notFoundFunction(aHTTPd, aBaseFilePath, aBaseURI, aURI, e);
		}
	},

	/**
	 * <odoc>
	 * <key>ow.server.httpd.replyJSMap(aHTTPd, aMapOrArray) : Map</key>
	 * Provides a helper aHTTPd reply that will parse aMapOrArray into a HTML output. Example:\
	 * \
	 * ow.server.httpd.route(hs, ow.server.httpd.mapRoutesWithLibs(hs, {\
	 *    "/stuff/to/server": r => ow.server.httpd.replyJSMap(hs, getOPackPaths()\
	 * }),\
	 * r => hs.replyOKText("nothing here...")\
	 * );\
	 * \
	 * </odoc>
	 */
	replyJSMap: function(aHTTPd, aMapOrArray) {
		ow.loadTemplate();

		var res = ow.template.html.parseMap(aMapOrArray, true);

		return aHTTPd.replyOKHTML("<html><style>" + res.css + "</style><body>" + res.out + "</body></html>");
	},

	/**
	 * <odoc>
	 * <key>ow.server.httpd.replyRedirect(aHTTPd, newLocation, mapOfHeaders) : Map</key>
	 * Provides a helper aHTTPd reply that will redirect the request to the newLocation provided (HTTP code 303).
	 * </odoc>
	 */
	replyRedirect: function(aHTTPd, newLocation, mapOfHeaders) {
		return aHTTPd.reply("", "text/plain", 303, merge({"Location": newLocation}, mapOfHeaders));
	},
	
	/**
	 * <odoc>
	 * <key>ow.server.httpd.replyFn(aFunctionName, aInstance, aRequest, aParams, dontRetError) : Map</key>
	 * Provides a helper function to call aFunctionName over aInstance (default this) given a POST aRequest.
	 * If aFunctionName doesn't have odoc help information available you will need to provide aParams map for the
	 * expected aFunctionName arguments. If dontRetError = true any exception will be kept in the server and an empty
	 * map will be returned.
	 * </odoc>
	 */
	replyFn: function(aFunctionName, aInstance, aReq, aParams, dontRetError) {
		_$(aReq, "request").isMap().$_();
		dontRetError = _$(dontRetError, "dontRetError").isBoolean().default(false);
		aInstance = _$(aInstance, "instance").default(this);

		if (aReq.method == "POST") {
			try {
				aParams = _$(aParams, "params").isMap().default($fnDef4Help(aFunctionName));
				return ow.server.httpd.reply($fnM2A(af.eval(aFunctionName), aInstance, aParams, jsonParse(aReq.files.postData)));
			} catch(e) {
				if (dontRetError) {
					throw e;
				} else {
					return ow.server.httpd.reply({ __error: e });
				}
			}
		}

		return ow.server.httpd.reply({});
	},

	/**
	 * <odoc>
	 * <key>ow.server.httpd.getMimeType(aFilename) : String</key>
	 * Tries to determine the mime type of aFilename and returns it. If not determined it will default
	 * to application/octet-stream.
	 * </odoc>
	 */
	getMimeType: function(aFilename) {
		var ext = String(Packages.org.apache.commons.io.FilenameUtils.getExtension(aFilename)).toUpperCase();
		if (isDefined(ow.server.httpd.mimes[ext])) {
			return ow.server.httpd.mimes[ext];
		} else {
			return "application/octet-stream";
		}
	},
	
	/**
	 * <odoc>
	 * <key>ow.server.httpd.authOAuth(aMapOptions, aHTTPd, aRequest, aFnReply) : Map</key>
	 * Provides OAuth 2.0 support by intersecting aRequest of aHTTPd to return aFnReply only on correctly authenticated. aMapOptions
	 * provides the OAuth configurations to follow:\
	 * \
	 * aMapOptions:\
	 * \
	 *    realm             (optional)  An unique realm name (defaults to 'realm')\
	 *    cookie            (optional)  The name of the cookie entry to use (defaults to 'OAF_AUTH_SESSION_ID')\
	 *    baseURL           (mandatory) The web server base url (e.g. https://myserver:8090)\
	 *    uriLogout         (optional)  The uri to use on the web server to logout (defaults to '/logout')\
	 *    uriCallBack       (optional)  The uri to use on the web server to callback (defaults to '/cb'). You should configure oauth to allow redirection to base url + callback (e.g. https://myserver:8090/cb)\
	 *    oauthAuthURL      (mandatory) The OAuth authorization_endpoint\
	 *    oauthTokenURL     (mandatory) The OAuth token_endpoint\
	 *    oauthLogoutURL    (mandatory) The OAuth end_session_endpoint\
	 *    oauthCliendId     (mandatory) The OAuth configured client id\
	 *    oauthClientSecret (mandatory) The OAuth configured client secret\ 
	 * \
	 * </odoc>
	 */
	authOAuth: function(aMapOptions, aHTTPd, aReq, aFnReply) {
		aMapOptions                   = _$(aMapOptions, "aMapOptions").isMap().default({});
		aMapOptions.realm             = _$(aMapOptions.realm, "aMapOptions.realm").isString().default("realm");
		aMapOptions.cookie            = _$(aMapOptions.cookie, "aMapOptions.cookie").isString().default("OAF_AUTH_SESSION_ID");
		aMapOptions.baseURL           = _$(aMapOptions.baseURL, "aMapOptions.baseURL").isString().$_();
		aMapOptions.uriLogout         = _$(aMapOptions.uriLogout, "aMapOptions.uriLogout").isString().default("/logout");
		aMapOptions.uriCallBack       = _$(aMapOptions.uriCallBack, "aMapOptions.uriCallBack").isString().default("/cb");
		aMapOptions.oauthAuthURL      = _$(aMapOptions.oauthAuthURL, "aMapOptions.oauthAuthURL").isString().$_();
		aMapOptions.oauthTokenURL     = _$(aMapOptions.oauthTokenURL, "aMapOptions.oauthTokenURL").isString().$_();
		aMapOptions.oauthLogoutURL    = _$(aMapOptions.oauthLogoutURL, "aMapOptions.oauthLogoutURL").isString().$_();
		aMapOptions.oauthClientId     = _$(aMapOptions.oauthClientId, "aMapOptions.oauthClientId").isString().$_();
		aMapOptions.oauthClientSecret = _$(aMapOptions.oauthClientSecret, "aMapOptions.oauthClientSecret").isString().$_();

		// Retrive session from cookie
		var _getSession = function(aR) {
			if (isMap(aR.header) && isDef(aR.header.cookie) && aR.header.cookie.indexOf(aMapOptions.cookie) >= 0) {
				var cookies = splitBySeparator(aR.header.cookie, ";"), res;
				cookies.forEach(cookie => {
					var vals = splitBySeparator(cookie.trim(), "=");
					if (vals[0] == aMapOptions.cookie) { res = vals[1]; }
				});
				return res;
			}
			return __;
		}

		// Set variables
		var parent = this, aRealm = aMapOptions.realm;
		if (isUnDef(parent.oauth_realms)) parent.oauth_realms = {};

		var r = _$(parent.oauth_realms[aRealm]).default({});
		parent.oauth_realms[aRealm] = _$(parent.oauth_realms[aRealm]).default({});
		var shouldLogin = false, session = _getSession(aReq);

		// Logout redirect endpoint
		if (aReq.uri == aMapOptions.uriLogout) {
			if (isDef(parent.oauth_realms[aRealm][session])) delete parent.oauth_realms[aRealm][session];
			return ow.server.httpd.replyRedirect(aHTTPd, aMapOptions.oauthLogoutURL + "?redirect_uri=" + aMapOptions.baseURL + aMapOptions.uriCallBack, { 
				"Set-Cookie": aMapOptions.cookie + "=" 
			});
		}

		// Main handler (default)
		// Determine if should login or reply aFnReply
		if ((aReq.uri != aMapOptions.uriCallBack) && 
				isDef(aReq.header) && isDef(aReq.header.cookie) && aReq.header.cookie.indexOf(aMapOptions.cookie) >= 0) {
			if (isDef(session) && session.length > 0) {
				if (isDef(parent.oauth_realms[aRealm][session])) {
					if (isDef(parent.oauth_realms[aRealm][session].access_token)) {
						if (isDef(parent.oauth_realms[aRealm][session].x)) {
							if ((nowUTC() < parent.oauth_realms[aRealm][session].x)) {
								return aFnReply(aReq);
							} else {
								// Should use refresh_token
								var res = $rest({ urlEncode: true }).post(aMapOptions.oauthTokenURL, {
									grant_type   : "refresh_token",
									refresh_token: parent.oauth_realms[aRealm][session].refresh_token,
									client_id    : aMapOptions.oauthClientId,
									client_secret: aMapOptions.oauthClientSecret
								});
				
								if (isUnDef(res.access_token)) {
									shouldLogin = true;
								} else {
									var jwt = ow.server.jwt.decode(res.access_token);
									parent.oauth_realms[aRealm][res.session_state] = merge(res, { x: (jwt.exp * 1000) });
									return aFnReply(aReq);
								}
							}
						} else {
							return aFnReply(aReq);
						}
					} else {
						return aFnReply(aReq);
					}
				} else {
					shouldLogin = true;
				}
			} else {
				shouldLogin = true;
			}
		} else {
			shouldLogin = true;
		}

		// Callback redirect endpoint
		// If no session exists yet but there is a state the oauth token is invoked
		if (aReq.uri == aMapOptions.uriCallBack) {
			//if (Object.keys(parent.oauth_realms[aRealm]).length == 0) parent.oauth_realms[aRealm] = "/";
			if (isUnDef(parent.oauth_realms[aRealm][aReq.params.state])) return ow.server.httpd.replyRedirect(aHTTPd, "/", {});
			if (isDef(aReq.params.state) && isDef(parent.oauth_realms[aRealm][aReq.params.state])) {
				var target = parent.oauth_realms[aRealm][aReq.params.state];
				var res = $rest({ urlEncode: true }).post(aMapOptions.oauthTokenURL, {
					grant_type   : "authorization_code",
					code         : aReq.params.code,
					redirect_uri : target,
					client_id    : aMapOptions.oauthClientId,
					client_secret: aMapOptions.oauthClientSecret
				});

				delete parent.oauth_realms[aRealm][aReq.params.state];
				var jwt = ow.server.jwt.decode(res.access_token);
				parent.oauth_realms[aRealm][res.session_state] = merge(res, { x: (jwt.exp * 1000) });

				return ow.server.httpd.replyRedirect(aHTTPd, target, { "Set-Cookie": aMapOptions.cookie  + "=" + res.session_state });
			} else {
				shouldLogin = true;
			}
		}

		// Should login handler
		// If not login yet calls oauth auth url
		if (shouldLogin) {
			var sId = "temp." + genUUID();
			if (aReq.uri == aMapOptions.uriCallBack) aReq.uri = "/";
			parent.oauth_realms[aRealm][sId] = aReq.uri;
			return ow.server.httpd.replyRedirect(aHTTPd, aMapOptions.oauthAuthURL + "?response_type=code&client_id=" + aMapOptions.oauthClientId + "&scope=email&state=" + sId);
		}
	},

	/**
	 * <odoc>
	 * <key>ow.server.httpd.authBasic(aRealm, aHTTPd, aReq, aAuthFunc, aReplyFunc, aUnAuthFunc) : Map</key>
	 * Wraps a httpd reply with basic HTTP authentication for the provided aRealm on the aHTTPd server. The aReq
	 * request map should be provided along with aAuthFunc (that receives the user and password and should return
	 * true of false if authentication is successful). If authentication is successful aReplyFunc will be executed
	 * receiving aHTTPd and aReq. Otherwise an optional aUnAuthFunc will be executed also receiving aHTTPd and aReq.
	 * Example:\
	 * \
	 * ow.server.httpd.route(hs, ow.server.httpd.mapRoutesWithLibs(hs, {\
	 *    "/f": function(req) { \
	 *       return ow.server.httpd.authBasic(\
	 *          "realm", hs, req,\
     *          function(user, pass) {\
     *             if (user == "adm" &amp;&amp; pass == "Password1") return true; else return false;\
     *          },\
	 *   	    function(hss, areq) {\
	 *		       return ow.server.httpd.replyFile(hss, "/some/path", "/f", areq.uri);\
	 *		    },\
	 *		    function(hss, ar) {\
	 *		       return hss.reply("Not authorized.", "text/plain", ow.server.httpd.codes.UNAUTHORIZED);\
	 *		    }\
	 *	     );\
	 *	  }\
	 * }),\
	 * function(req) {\
	 *    return hs.replyOKText("nothing here...");\
	 * }\
	 * );\
	 * \
	 * </odoc>
	 */
	authBasic: function(aRealm, aHTTPd, aReq, aAuthFunc, aReplyFunc, aUnAuthFunc) {
		if (isUndefined(aUnAuthFunc)) {
			aUnAuthFunc = function(hs, ar) {
				return hs.reply("Not authorized.", "text/plain", ow.server.httpd.codes.UNAUTHORIZED);
			}
		}
		
		if (isDefined(aReq.header.authorization)) {
			var creds = af.fromBytes2String(af.fromBase64(aReq.header.authorization.replace(/^Basic /, ""))).split(":");
			if (aAuthFunc(creds[0], creds[1], aHTTPd, aReq)) {
				return aReplyFunc(aHTTPd, aReq);
			} 
		};
		
		var ress = aUnAuthFunc(aHTTPd, aReq);
		if (isUndefined(ress.header)) ress.header = {};
		ress.header["WWW-Authenticate"] = "Basic realm=\"" + aRealm + "\"";
		return aHTTPd.reply(ress.data, ress.mimetype, ow.server.httpd.codes.UNAUTHORIZED, ress.header);
	},
	
	/**
	 * <odoc>
	 * <key>ow.server.httpd.addMimeType(anExtension, aMimeType)</key>
	 * Adds a new aMimeType for the corresponding anExtension.
	 * </odoc>
	 */
	addMimeType: function(anExtension, aMimeType) {
		mimes(anExtension.toUpperCase(), aMimeType);
	},
	
	/**
	 * <odoc>
	 * <key>ow.server.httpd.addHTTPCode(aCodeRef, aCodeNum)</key>
	 * Adds a new HTTP aCodeNum number that will be referenced by the name aCodeRef.
	 * </odoc>
	 */
	addHTTPCode: function (aCodeRef, aCodeNum) {
		codes(aCodeRef.toUpperCase(), aCodeNum);
	},
	
	codes: {
		"OK": 200,
		"BAD": 400,
		"UNAUTHORIZED": 401,
		"FORBIDDEN": 403,
		"NOTFOUND": 404,
		"INTERNAL": 500
	},

	cache: {
		public: {
			"cache-control": "public, max-age=1209600"
		},
		private: {
			"cache-control": "private, max-age=3000"
		}
	},
	
	mimes: {
		"HTML": "text/html; charset=utf-8",
		"CSS": "text/css; charset=utf-8",
		"JS": "application/javascript; charset=utf-8",
		"JSON": "application/json; charset=utf-8",
		"YAML": "application/x-yaml; charset=utf-8",
		"JAR": "application/java-archive",
		"ZIP": "application/zip",
		"XML": "application/xml; charset=utf-8",
		"TXT": "text/plain; charset=utf-8",
		"RTF": "text/richtext; charset=utf-8",
		"JPG": "image/jpeg",
		"PNG": "image/png",
		"GIF": "image/gif",
		"TTF": "font/truetype",
		"WOFF": "application/x-font-woff",
		"SVG": "image/svg+xml",
		"EOT": "application/vnd.ms-fontobject",
		"BIN": "application/octet-stream",
		"ICO": "image/x-icon"
	},

	/**
	 * <odoc>
	 * <key>ow.server.httpd.reply(aObject, aStatus, aMimeType, aHeadersMap) : Map</key>
	 * Builds the map response for a HTTP server request using aObject (map, array, string or bytearray), aStatus (default to 200),
	 * aMimeType (defaults to application/octet-stream if not recognized) and aHeadersMap.
	 * </odoc>
	 */
	reply: function(aObj, status, mimetype, headers) {
		headers = _$(headers).isMap().default(__);
		status  = _$(status).isNumber().default(200);

		if (isUnDef(mimetype)) {
			if (isString(aObj)) mimetype = ow.server.httpd.mimes.TXT;
			if (isMap(aObj)) mimetype = ow.server.httpd.mimes.JSON;
			if (isArray(aObj)) mimetype = ow.server.httpd.mimes.JSON;
			if (isByteArray(aObj)) mimetype = ow.server.httpd.mimes.BIN;

			if (isUnDef(mimetype)) mimetype = ow.server.httpd.mimes.BIN;
		}

		var data;
		if (isMap(aObj) || isArray(aObj)) {
			data = stringify(aObj, __, "");
		} else {
			data = aObj;
		}

		return {
			status: status,
			mimetype: mimetype,
			data: data,
			header: headers
		};
	},
}

OpenWrap.server.prototype.socket = {
	__servers: {},
	__threads: {},

	/**
	 * <odoc>
	 * <key>ow.server.socket.start(aPort, aFunction, aBackLog, aBindAddr)</key>
	 * Starts a thread listening on aPort with aBackLog (defaults to a queue of 50 connections in waiting) on aBindAddr (defaults to "0.0.0.0").
	 * Whenever a connection is established aFunction will be called with the corresponding java.net.Socket and a java.net.ServerSocket. Examples:\
	 * \
	 * ow.loadServer();\
	 * ow.server.socket.start(12345, (clt, srv) => {\
	 *    log("Connection from " + clt.getInetAddress().getHostAddress());
	 *    ioStreamReadLines(clt.getInputStream(), stream => {\
	 *       print(stream);\
	 *       ioStreamWrite(clt.getOutputStream(), stream);\
	 *       clt.getOutputStream().flush();\
	 * 	     clt.shutdownInput();\
	 *       clt.shutdownOutput();\
	 *       return true;\
	 *    });\
	 *    log("closing...");\
	 *    clt.close();\
	 * });\
	 * \
	 * </odoc>
	 */
	start: (aPort, aFn, aBackLog, aBindAddr) => {
		_$(aPort, "port").isNumber().$_();
		_$(aFn, "function").isFunction().$_();

		aBackLog = _$(aBackLog, "backlog").isNumber().default(50);
		aBindAddr = _$(aBindAddr, "bindaddr").isString().default(null);
		if (isDef(aBindAddr) && isString(aBindAddr) && !isNull(aBindAddr)) aBindAddr = java.net.InetAddress.getByName(aBindAddr);
		var server = java.net.ServerSocket(aPort, aBackLog, aBindAddr);
		
		ow.server.socket.__servers[aPort] = server;

		plugin("Threads");
		var t = new Threads();
		t.addSingleThread(function() {
			while(isDef(ow.server.socket.__servers[aPort]) && !(ow.server.socket.__servers[aPort].isClosed())) {
				var clt = server.accept();
				aFn(clt, server);
				clt.close();
			}
		});
		t.startNoWait();
		ow.server.socket.__threads[aPort] = t;
	},

	/**
	 * <odoc>
	 * <key>ow.server.socket.stop(aPort)</key>
	 * Stops a thread socket server on aPort previously started by ow.server.socket.start.
	 * </odoc>
	 */
	stop: (aPort) => {
		_$(aPort, "port").isNumber().$_();

		if (isDef(ow.server.socket.__servers[aPort])) {
			ow.server.socket.__servers[aPort].close();
			var res = ow.server.socket.__threads[aPort].stop(true);
			delete ow.server.socket.__servers[aPort];
			return res;
		} else {
			return __;
		}
	}
}

OpenWrap.server.prototype.jwt = {
    /**
     * <odoc>
	 * <key>ow.server.jwt.genKey(aAlgorithm) : JavaObject</key>
	 * Generates a key for the provided aAlgorithm (defaults to HS256). If aAlgorithm is not HS256, HS384 or HS512
	 * the generated object will be a key pair for which you will need to user .getPrivate() for signing and .getPublic() for verify.
	 * Possible algorithms: HS256, HS384, HS512, ES256, ES384, ES512, RS256, RS384, RS512, PS256 (java >= 11), PS384 (java >= 11), PS512 (java >= 11)
	 * </odoc>
     */
	genKey: (aAlgorithm) => {
		aAlgorithm = _$(aAlgorithm, "algorithm").isString().default("HS256");
		/*_$(aArg1, "first argument").$_();

		if (aAlgorithm = "HS256") aAlgorithm = "HMAC256";

		if (isDef(aArg2)) {
			return com.auth0.jwt.algorithms.Algorithm[aAlgorithm](aArg1, aArg2);
		} else {
			return com.auth0.jwt.algorithms.Algorithm[aAlgorithm](aArg1);
		}*/
		var key;

		aAlgorithm = aAlgorithm.toUpperCase().trim();
		try {
			isJavaObject(Packages.io.jsonwebtoken.SignatureAlgorithm[aAlgorithm]);
		} catch(e) {
			throw "Algorithm '" + aAlgorithm + "' not available.";
		}

		if (aAlgorithm == "HS256" || aAlgorithm == "HS384" || aAlgorithm == "HS512") {
			key = Packages.io.jsonwebtoken.security.Keys.secretKeyFor(Packages.io.jsonwebtoken.SignatureAlgorithm[aAlgorithm]);
		} else {
			key = Packages.io.jsonwebtoken.security.Keys.keyPairFor(Packages.io.jsonwebtoken.SignatureAlgorithm[aAlgorithm]);
		}

		return key;
	},

	/**
	 * <odoc>
	 * <key>ow.server.jwt.verify(aSecret1, aToken) : Map</key>
	 * Verifies the JWT provided with aToken using aSecret1 (key (either a string or java.security.Key)). Returns the
	 * converted json headers and claims. If any verification fails it will throw a JavaException.
	 * </odoc>
	 */
	verify: (aSecret1, aToken) => {
		/*_$(aToken, "token").isString().$_();
		
		var al = ow.server.jwt.getAlgorithm(aAlgorithm, aSecret1, aSecret2);
		var verifier = com.auth0.jwt.JWT.require(al).build();
		var dt = verifier.verify(aToken);

		var keys = dt.getClaims().keySet().toArray(), mkeys = {};
		for(var ii in keys) {
			var notFound = true;
			if (notFound && dt.getClaims().get(keys[ii]).asBoolean() != null) { notFound = false; mkeys[keys[ii]] = dt.getClaims().get(keys[ii]).asBoolean(); }
			if (notFound && dt.getClaims().get(keys[ii]).asInt() != null) { notFound = false; mkeys[keys[ii]] = dt.getClaims().get(keys[ii]).asInt(); }
			if (notFound && dt.getClaims().get(keys[ii]).asDouble() != null) { notFound = false; mkeys[keys[ii]] = dt.getClaims().get(keys[ii]).asDouble(); }
			if (notFound && dt.getClaims().get(keys[ii]).asLong() != null) { notFound = false; mkeys[keys[ii]] = dt.getClaims().get(keys[ii]).asLong(); }
			if (notFound && dt.getClaims().get(keys[ii]).asString() != null) { notFound = false; mkeys[keys[ii]] = dt.getClaims().get(keys[ii]).asString(); }
			if (notFound && dt.getClaims().get(keys[ii]).asDate() != null) { notFound = false; mkeys[keys[ii]] = dt.getClaims().get(keys[ii]).asDate(); }
		}
		return mkeys;*/
		_$(aToken, "token").isString().$_();

		if (isString(aSecret1)) {
			if (aSecret1.length > 0 && aSecret1.length < 32)  aSecret1 = aSecret1 + repeat(32 - aSecret1.length, "\u0000");
			if (aSecret1.length > 32 && aSecret1.length < 48) aSecret1 = aSecret1 + repeat(48 - aSecret1.length, "\u0000");
			if (aSecret1.length > 48 && aSecret1.length < 64) aSecret1 = aSecret1 + repeat(64 - aSecret1.length, "\u0000");

			aSecret1 = Packages.io.jsonwebtoken.security.Keys.hmacShaKeyFor(af.fromString2Bytes(aSecret1));
		}

		var res = Packages.io.jsonwebtoken.Jwts.parserBuilder()
		                             .setSigningKey(aSecret1)
									 .build()
									 .parseClaimsJws(aToken);

		var gson = com.google.gson.GsonBuilder().create();
		return {
			headers: jsonParse(gson.toJson(res.getHeader())),
			claims : jsonParse(gson.toJson(res.getBody()))
		}
	},

	/**
	 * <odoc>
	 * <key>ow.server.jwt.sign(aKey, aData) : String</key>
	 * Signs a JWT using aKey (either a string or java.security.Key) returning the corresponding encoded JWT. To
	 * add specific claims use aData map where you can add custom headers and/or custom claims or used the standard fields. 
	 * Expected keys for aData:\
	 * \
	 *    audience    (String)\
	 *    claims      (Map)\
	 *    expiration  (Date)\
	 *    headers     (Map)\
	 *    issuer      (String)\
	 *    id          (String)\
	 *    issuedAt    (Date)\
	 *    issuer      (String)\
	 *    notBefore   (Date)\
	 *    subject     (String)
	 * </odoc>
	 */
	sign: (aKey, aData) => {
		/*var al = ow.server.jwt.getAlgorithm(aAlgorithm, aSecret1, aSecret2);
		aFnAddClaims = _$(aFnAddClaims, "function").isFunction().default((r) => { return r; });

		var jwt = com.auth0.jwt.JWT.create();
		jwt = aFnAddClaims(jwt);
		return jwt.sign(al);*/
		aData = _$(aData, "aData").isMap().default({});
		var o = Packages.io.jsonwebtoken.Jwts.builder();

		if (isString(aData.audience))   o = o.setAudience(aData.audience);
		if (isDate(aData.expiration))   o = o.setExpiration(aData.expiration);
		if (isString(aData.issuer))     o = o.setIssuer(aData.issuer);
		if (isString(aData.id))         o = o.setId(aData.id);
		if (isDate(aData.issuedAt))     o = o.setIssuedAt(aData.issuedAt);
		if (isString(aData.issuer))     o = o.setIssuer(aData.issuer);
		if (isDate(aData.notBefore))    o = o.setNotBefore(aData.notBefore);
		if (isString(aData.subject))    o = o.setSubject(aData.subject);

		if (isMap(aData.claims)) {
			for(var k in aData.claims) {
				o = o.claim(k, aData.claims[k]);
			}
		}

		if (isMap(aData.headers)) {
			for(var k in aData.headers) {
				o = o.setHeaderParam(k, aData.headers[k]);
			}
		}

		if (isString(aKey)) {
			if (aKey.length > 0 && aKey.length < 32)  aKey = aKey + repeat(32 - aKey.length, "\u0000");
			if (aKey.length > 32 && aKey.length < 48) aKey = aKey + repeat(48 - aKey.length, "\u0000");
			if (aKey.length > 48 && aKey.length < 64) aKey = aKey + repeat(64 - aKey.length, "\u0000");

			aKey = Packages.io.jsonwebtoken.security.Keys.hmacShaKeyFor(af.fromString2Bytes(aKey));
		}

		return String(o.signWith(aKey).compact());
	},

	/**
	 * <odoc>
	 * <key>ow.server.jwt.decode(aToken) : Map</key>
	 * Tries to decode the JWT aToken provided.
	 * </odoc>
	 */
	decode: aToken => {
		_$(aToken, "token").isString().$_();

		/*var dt = com.auth0.jwt.JWT.decode(aToken);

		var keys = dt.getClaims().keySet().toArray(), mkeys = {};
		for(var ii in keys) {
			var notFound = true;
			if (notFound && dt.getClaims().get(keys[ii]).asBoolean() != null) { notFound = false; mkeys[keys[ii]] = dt.getClaims().get(keys[ii]).asBoolean(); }
			if (notFound && dt.getClaims().get(keys[ii]).asInt() != null) { notFound = false; mkeys[keys[ii]] = dt.getClaims().get(keys[ii]).asInt(); }
			if (notFound && dt.getClaims().get(keys[ii]).asDouble() != null) { notFound = false; mkeys[keys[ii]] = dt.getClaims().get(keys[ii]).asDouble(); }
			if (notFound && dt.getClaims().get(keys[ii]).asLong() != null) { notFound = false; mkeys[keys[ii]] = dt.getClaims().get(keys[ii]).asLong(); }
			if (notFound && dt.getClaims().get(keys[ii]).asString() != null) { notFound = false; mkeys[keys[ii]] = dt.getClaims().get(keys[ii]).asString(); }
			if (notFound && dt.getClaims().get(keys[ii]).asDate() != null) { notFound = false; mkeys[keys[ii]] = dt.getClaims().get(keys[ii]).asDate(); }
		}
		return mkeys;*/
		var parts = aToken.split(".")

		if (parts.length > 1) return {
			headers: jsonParse( af.fromBytes2String( af.fromBase64( parts[0] ) ) ),
			claims : jsonParse( af.fromBytes2String( af.fromBase64( parts[1] ) ) )
		}
	}
}