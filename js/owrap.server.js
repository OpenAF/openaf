// OpenWrap v2
// Author: Nuno Aguiar
// Server

OpenWrap.server = function() {
	return ow.server;
}

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
		if (!shouldStop) sleep(aTimePeriod);
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
		this.jmxs = new JMXServer("wedo.openaf:type=OpenAFServer-" + aId);
		this.jmxs.start(aPort, !notLocal);
		this.jmxs.addBean({},
		  function(key) { },
		  function(key, value) { },
		  function(op, params) {
		  	switch(op) {
		  	case "load": return ow.server.jmx.serverExec(params, function(f) { 
		  		__pmIn = jsonParse(Packages.wedo.open.utils.PMStringConvert.toJSON(Packages.wedo.openaf.OpenAF.__pmIn));
		  		load(f);
		  		Packages.wedo.openaf.OpenAF.__pmOut = Packages.wedo.open.utils.PMStringConvert.fromJSON(stringify(__pmOut)); });
		  	case "exec": return ow.server.jmx.serverExec(params, function(f) { 
				__pmIn = jsonParse(Packages.wedo.open.utils.PMStringConvert.toJSON(Packages.wedo.openaf.OpenAF.__pmIn));
		  		var res = af.eval(f); 
		  		Packages.wedo.openaf.OpenAF.__pmOut = Packages.wedo.open.utils.PMStringConvert.fromJSON(stringify(__pmOut));
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
		ow.server.jmx.call(ow.server.jmx.localConnect(aServerPid), "wedo.openaf:type=OpenAFServer-" + aId, "exec", aScript);
	},
	
	/**
	 * <odoc>
	 * <key>ow.server.openafServer.load(aId, aScriptFilePath, aServerPid)</key>
	 * Tries to execute the given aScriptFilePath locally or in the aServerPid provided (created by a ow.server.openafServer.start).
	 * Optionally you can also specify aId.
	 * </odoc>
	 */
	load: function(aId, aScriptFilePath, aServerPid) {
		ow.server.jmx.call(ow.server.jmx.localConnect(aServerPid), "wedo.openaf:type=OpenAFServer-" + aId, "load", aScriptFilePath);
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
	 * var jmxs = new JMXServer("wedo.openaf:type=server");\
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
	 * ow.server.jmx.call(jmx, "wedo.openaf:type=server", "increment"); // 1\
	 * ow.server.jmx.call(jmx, "wedo.openaf:type=server", "resetTo", 10); // 10
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
}


//-----------------------------------------------------------------------------------------------------
// AUTHENTICATION
//-----------------------------------------------------------------------------------------------------
OpenWrap.server.prototype.auth = {
	aListOfAuths: {},
	
	/**
	 * <odoc>
	 * <key>ow.server.auth.initialize(aPreviousDumpMap)</key>
	 * Initializes with a previous dump from ow.server.auth.dump.
	 * </odoc>
	 */
	initialize: function(aIniAuth) {
		this.aListOfAuths = aIniAuth;
	},
	
	/**
	 * <odoc>
	 * <key>ow.server.auth.dump() : Map</key>
	 * Dumps the current authentication list into a Map.
	 * </odoc>
	 */
	dump: function() {
		return this.aListOfAuths;
	},
	
	/**
	 * <odoc>
	 * <key>ow.server.auth.add(aUser, aPass)</key>
	 * Adds the aUser and aPass to the current authentication list.
	 * </odoc>
	 */
	add: function(aUser, aPass) {
		this.aListOfAuths[aUser] = sha1(aPass);
	},
	
	/**
	 * <odoc>
	 * <key>ow.server.auth.del(aUser)</key>
	 * Removes the aUSer from the current authentication list.
	 * </odoc>
	 */
	del: function(aUser) {
		delete this.aListOfAuths[aUser];
	},
	
	/**
	 * <odoc>
	 * <key>ow.server.auth.check(aUser, aPass) : boolean</key>
	 * Checks if the aUser and aPass provided are authenticated with the current internal list (returns true)
	 * or not (returns false).
	 * </odoc>
	 */
	check: function(aUser, aPass) {
		return (this.aListOfAuths[aUser] == sha1(aPass));
	}
}

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
	}
	//env.put(javax.naming.Context.SECURITY_AUTHENTICATION, "simple");
	env.put(javax.naming.Context.SECURITY_PRINCIPAL, aUsername);
	env.put(javax.naming.Context.SECURITY_CREDENTIALS, Packages.wedo.openaf.AFCmdBase.afc.dIP(aPassword));
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
	
	/**
	 * <odoc>
	 * <key>ow.server.rest.reply(aBaseURI, aRequest, aCreateFunc, aGetFunc, aSetFunc, aRemoveFunc) : RequestReply</key>
	 * Provides a REST compliant HTTPServer request replier given a aBaseURI, aRequest, aCreateFunc, aGetFunc, aSetFunc
	 * and aRemoveFunc. Each function will receive a map with the provided indexes from the request.\
	 * \
	 * var hs = ow.loadServer().httpd.start(8080);\
	 * ow.server.httpd.route(hs, ow.server.httpd.mapRoutesWithLibs(hs, {\
	 *    "/rest": function(req) { return ow.server.rest.reply("/rest", req,\
	 *       function(idxs, data) { // Create and return a map },\
	 *       function(idxs)       { // Get and return a map },\
	 *       function(idxs, data) { // Set and return a map },\
	 *       function(idxs)       { // Remove and return a map }\
	 *    )}}, function(req) { return hs.replyOKText("nothing here"); });\
	 * ow.server.daemon();\
	 * \ 
	 * </odoc>
	 */
	reply: function(aBaseURI, aReq, aCreateFunc, aGetFunc, aSetFunc, aRemoveFunc) {
		var idxs = ow.server.rest.parseIndexes(aBaseURI, aReq);
		var res = {};
		res.headers = {};

		switch(aReq.method) {
		case "GET": res.data = stringify(aGetFunc(idxs), undefined, ""); break;
		case "POST":
			if (isDef(aReq.files.content)) {
				var fdata = "";
				try { fdata = io.readFileString(aReq.files.content); } catch(e) { };
				res.data = stringify(aCreateFunc(idxs, jsonParse(fdata)), undefined, "");
			} else {
				res.data = stringify(aCreateFunc(idxs, jsonParse(aReq.params["NanoHttpd.QUERY_STRING"])), undefined, "");
			}
			res.headers["Location"] = ow.server.rest.writeIndexes(res.data);
			break;
		case "PUT":
			if (isDef(aReq.files.content)) {
				var fdata = "";
				try { fdata = io.readFileString(aReq.files.content); } catch(e) { };
				res.data = stringify(aSetFunc(idxs, jsonParse(fdata)), undefined, "");
			} else {
				res.data = stringify(aSetFunc(idxs, jsonParse(aReq.files.postData)), undefined, "");
			}
			break;
		case "DELETE": res.data = stringify(aRemoveFunc(idxs), undefined, ""); break;
		};
		
		res.mimetype = ow.server.httpd.mimes.JSON;
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
}

//-----------------------------------------------------------------------------------------------------
// HTTP SERVER
//-----------------------------------------------------------------------------------------------------

OpenWrap.server.prototype.httpd = {
	__routes: {},
	__defaultRoutes: {},
	__preRoutes: {},
	
	
	/**
	 * <odoc>
	 * <key>ow.server.httpd.start(aPort, aHost, keyStorePath, password, errorFunction) : Object</key>
	 * Will prepare a HTTP server to be used returning a HTTPServer object. Optionally you can provide 
	 * aPort where you want the HTTP server to run. Otherwise a free port will be assigned.
	 * (available after ow.loadServer())
	 * </odoc>
	 */
	start: function(aPort, aHost, keyStorePath, password, errorFunction) {
		plugin("HTTPServer");
		
		if (isUnDef(aPort)) {
			aPort = findRandomOpenPort();
		}
		
		var hs = new HTTPd(aPort, aHost, keyStorePath, password, errorFunction);
		
		this.__routes[hs.getPort()] = {};
		this.__defaultRoutes[hs.getPort()] = {};
		this.__preRoutes[hs.getPort()] = {};
		
		return hs;
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
	 * 		"/myapp": function(req) {\
	 * 			return hs.replyOKText("my stuff!!");\
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
		if (isUndefined(aPath)) aPath = "/r/";
		if (isUndefined(aMapOfRoutes)) aMapOfRoutes = {};
		ow.loadFormat();
		
		var parent = this;
		var aPort = aHTTPd.getPort() + 0;
		var aP    = String(aPath);
		
		this.__routes[aPort] = aMapOfRoutes;
		if (isDef(aDefaultRoute)) this.__defaultRoutes[aPort] = aDefaultRoute;
		if (isDef(aPreRouteFunc)) this.__preRoutes[aPort] = aPreRouteFunc;
		
		aHTTPd.add(aPath, function(req) {			
			var uri = req.uri.replace(new RegExp("^" + aP), "");
			if (isFunction(parent.__preRoutes[aPort])) parent.__preRoutes[aPort](req);
			if (isFunction(parent.__routes[aPort][uri])) {
				return parent.__routes[aPort][uri](req);
			} else {
				var bp = ow.format.string.bestPrefix(uri, Object.keys(parent.__routes[aPort]));
				if (isDef(bp))
					return parent.__routes[aPort][bp](req);
				else
					return parent.__defaultRoutes[aPort](req);
			}
		});
		
		aHTTPd.setDefault(aPath);
	},
	
	mapWithExistingRoutes: function(aHTTPd, aMapOfRoutes) {
		if (isUndefined(aMapOfRoutes)) aMapOfRoutes = {};
		var res = {};
		for(var i in aMapOfRoutes) { res[i] = aMapOfRoutes[i]; }
		for(var i in this.__routes[aHTTPd.getPort()]) { res[i] = this.__routes[aHTTPd.getPort()][i]; }
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
	 * <key>ow.server.httpd.mapRouteWithLibs(aHTTPd, aMapOfRoutes) : Map</key>
	 * Helper to use with ow.server.httpd.route to automatically add routes for JQuery, Backbone,
	 * Handlebars, jLinq and Underscore from the openaf.jar.
	 * </odoc>
	 */
	mapRoutesWithLibs: function(aHTTPd, aMapOfRoutes) {
		if (isUndefined(aMapOfRoutes)) aMapOfRoutes = {};
		aMapOfRoutes["/js/jquery.js"] = function() { return ow.server.httpd.replyJQuery(aHTTPd); };
		aMapOfRoutes["/js/backbone.js"] = function() { return ow.server.httpd.replyBackbone(aHTTPd); };
		aMapOfRoutes["/js/handlebars.js"] = function() { return ow.server.httpd.replyHandlebars(aHTTPd); };
		aMapOfRoutes["/js/stream.js"] = function() { return ow.server.httpd.replyStream(aHTTPd); };
		aMapOfRoutes["/js/jlinq.js"] = function() { return ow.server.httpd.replyJLinq(aHTTPd); };
		aMapOfRoutes["/js/underscore.js"] = function() { return ow.server.httpd.replyUnderscore(aHTTPd); };
		aMapOfRoutes["/js/lodash.js"] = function() { return ow.server.httpd.replyLoadash(aHTTPd); };
		aMapOfRoutes["/js/highlight.js"] = function() { return aHTTPd.reply(ow.server.httpd.getFromOpenAF("js/highlight.js"), ow.server.httpd.mimes.JS, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/js/materialize.js"] = function() { return aHTTPd.reply(ow.server.httpd.getFromOpenAF("js/materialize.js"), ow.server.httpd.mimes.JS, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/css/materialize.css"] = function() { return aHTTPd.reply(ow.server.httpd.getFromOpenAF("css/materialize.css"), ow.server.httpd.mimes.CSS, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/css/materialize-icon.css"] = function() { return aHTTPd.reply(ow.server.httpd.getFromOpenAF("css/materialize-icon.css"), ow.server.httpd.mimes.CSS, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/css/github-gist.css"] = function() { return aHTTPd.reply(ow.server.httpd.getFromOpenAF("css/github-gist.css"), ow.server.httpd.mimes.CSS, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/css/github-markdown.css"] = function() { return aHTTPd.reply(ow.server.httpd.getFromOpenAF("css/github-markdown.css"), ow.server.httpd.mimes.CSS, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/fonts/material-design-icons/Material-Design-Icons.eot"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/material-design-icons/Material-Design-Icons.eot", true), ow.server.httpd.mimes.EOT, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/fonts/material-design-icons/Material-Design-Icons.svg"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/material-design-icons/Material-Design-Icons.svg", true), ow.server.httpd.mimes.SVG, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/fonts/material-design-icons/Material-Design-Icons.ttf"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/material-design-icons/Material-Design-Icons.ttf", true), ow.server.httpd.mimes.TTF, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/fonts/material-design-icons/Material-Design-Icons.woff"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/material-design-icons/Material-Design-Icons.woff", true), ow.server.httpd.mimes.WOFF, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/fonts/material-design-icons/Material-Design-Icons.woff2"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/material-design-icons/Material-Design-Icons.woff2", true), ow.server.httpd.mimes.WOFF, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/fonts/roboto/Roboto-Bold.eot"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Bold.eot", true), ow.server.httpd.mimes.EOT, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/fonts/roboto/Roboto-Bold.ttf"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Bold.ttf", true), ow.server.httpd.mimes.TTF, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/fonts/roboto/Roboto-Bold.woff"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Bold.woff", true), ow.server.httpd.mimes.WOFF, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/fonts/roboto/Roboto-Bold.woff2"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Bold.woff2", true), ow.server.httpd.mimes.WOFF, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/fonts/roboto/Roboto-Light.eot"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Light.eot", true), ow.server.httpd.mimes.EOT, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/fonts/roboto/Roboto-Light.ttf"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Light.ttf", true), ow.server.httpd.mimes.TTF, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/fonts/roboto/Roboto-Light.woff"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Light.woff", true), ow.server.httpd.mimes.WOFF, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/fonts/roboto/Roboto-Light.woff2"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Light.woff2", true), ow.server.httpd.mimes.WOFF, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/fonts/roboto/Roboto-Medium.eot"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Medium.eot", true), ow.server.httpd.mimes.EOT, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/fonts/roboto/Roboto-Medium.ttf"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Medium.ttf", true), ow.server.httpd.mimes.TTF, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/fonts/roboto/Roboto-Medium.woff"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Medium.woff", true), ow.server.httpd.mimes.WOFF, ow.server.httpd.codes.OK) };
	    aMapOfRoutes["/fonts/roboto/Roboto-Medium.woff2"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Medium.woff2", true), ow.server.httpd.mimes.WOFF, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/fonts/roboto/Roboto-Regular.eot"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Regular.eot", true), ow.server.httpd.mimes.EOT, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/fonts/roboto/Roboto-Regular.ttf"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Regular.ttf", true), ow.server.httpd.mimes.TTF, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/fonts/roboto/Roboto-Regular.woff"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Regular.woff", true), ow.server.httpd.mimes.WOFF, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/fonts/roboto/Roboto-Regular.woff2"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Regular.woff2", true), ow.server.httpd.mimes.WOFF, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/fonts/roboto/Roboto-Thin.eot"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Thin.eot", true), ow.server.httpd.mimes.EOT, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/fonts/roboto/Roboto-Thin.ttf"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Thin.ttf", true), ow.server.httpd.mimes.TTF, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/fonts/roboto/Roboto-Thin.woff"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Thin.woff", true), ow.server.httpd.mimes.WOFF, ow.server.httpd.codes.OK) };
		aMapOfRoutes["/fonts/roboto/Roboto-Thin.woff2"] = function() { return aHTTPd.replyBytes(ow.server.httpd.getFromOpenAF("fonts/roboto/Roboto-Thin.woff2", true), ow.server.httpd.mimes.WOFF, ow.server.httpd.codes.OK) };
		return aMapOfRoutes;
	},
	
	replyJQuery: function(aHTTPd) {
		return aHTTPd.reply(ow.server.httpd.getFromOpenAF("js/jquery.js"), ow.server.httpd.mimes.JS, ow.server.httpd.codes.OK);
	},
	
	replyBackbone: function(aHTTPd) {
		return aHTTPd.reply(ow.server.httpd.getFromOpenAF("js/backbone.js"), ow.server.httpd.mimes.JS, ow.server.httpd.codes.OK);
	},
	
	replyHandlebars: function(aHTTPd) {
		return aHTTPd.reply(ow.server.httpd.getFromOpenAF("js/handlebars.js"), ow.server.httpd.mimes.JS, ow.server.httpd.codes.OK);
	},
	
	replyStream: function(aHTTPd) {
		return aHTTPd.reply(ow.server.httpd.getFromOpenAF("js/stream.js"), ow.server.httpd.mimes.JS, ow.server.httpd.codes.OK);
	},
	
	replyJLinq: function(aHTTPd) {
		return aHTTPd.reply(ow.server.httpd.getFromOpenAF("js/jlinq.js"), ow.server.httpd.mimes.JS, ow.server.httpd.codes.OK);		
	},
	
	replyUnderscore: function(aHTTPd) {
		return aHTTPd.reply(ow.server.httpd.getFromOpenAF("js/lodash.js"), ow.server.httpd.mimes.JS, ow.server.httpd.codes.OK);		
	},
	
	replyLoadash: function(aHTTPd) {
		return aHTTPd.reply(ow.server.httpd.getFromOpenAF("js/lodash.js"), ow.server.httpd.mimes.JS, ow.server.httpd.codes.OK);		
	},

	/**
	 * <odoc>
	 * <key>ow.server.httpd.replyFile(aHTTPd, aBaseFilePath, aBaseURI, aURI, notFoundFunction, documentRootArray) : Map</key>
	 * Provides a helper aHTTPd reply that will enable the download of a file, from aBaseFilePath, given aURI part of 
	 * aBaseURI. Optionally you can also provide a notFoundFunction and an array of file strings (documentRootArraY) to replace as
	 * documentRoot. Example:\
	 * \
	 * ow.server.httpd.route(hs, ow.server.httpd.mapRoutesWithLibs(hs, {\
	 *    "/stuff/to/server": function(req) {\
	 *       return ow.server.httpd.replyFile(hs, "/some/path/to/serve/files", "/stuff/to/server", req.uri);\
	 *    }\
	 * },\
	 * function(req) {\
	 *    return hs.replyOKText("nothing here...");\
	 * }\
	 * );\
	 * \
	 * </odoc>
	 */
	replyFile: function(aHTTPd, aBaseFilePath, aBaseURI, aURI, notFoundFunction, documentRootArray) {
		if (isUndefined(notFoundFunction)) {
			notFoundFunction = function() {
				return aHTTPd.reply("Not found!", ow.server.httpd.mimes.TXT, ow.server.httpd.codes.NOTFOUND);
			}
		}
		try {
			var baseFilePath = aBaseFilePath;
			var furi = String((new java.io.File(new java.io.File(baseFilePath),
				(new java.net.URI(aURI.replace(new RegExp("^" + aBaseURI), "") )).getPath())).getCanonicalPath());
			
			if (!(furi.match(new RegExp("^" + baseFilePath))))
				for(var i in documentRootArray) {
					furi = String((new java.io.File(new java.io.File(baseFilePath),
						(new java.net.URI((aURI + documentRootArray[i]).replace(new RegExp("^" + aBaseURI), "") )).getPath())).getCanonicalPath());
					if (furi.match(new RegExp("^" + baseFilePath))) break;
				}
			
			if (furi.match(new RegExp("^" + baseFilePath)))
				return aHTTPd.replyBytes(io.readFileBytes(furi), ow.server.httpd.getMimeType(furi));
			else
			    return notFoundFunction(aHTTPd, aBaseFilePath, aBaseURI, aURI);
		} catch(e) { 
			return notFoundFunction(aHTTPd, aBaseFilePath, aBaseURI, aURI, e);
		}
	},
	
	/**
	 * <odoc>
	 * <key>ow.server.httpd.replyRedirect(aHTTPd, newLocation) : Map</key>
	 * Provides a helper aHTTPd reply that will redirect the request to the newLocation provided (HTTP code 303).
	 * </odoc>
	 */
	replyRedirect: function(aHTTPd, newLocation) {
		return aHTTPd.reply("", "text/plain", 303, {"Location": newLocation});
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
	 * <key>ow.server.httpd.authBasic(aRealm. aHTTPd, aReq, aAuthFunc, aReplyFunc, aUnAuthFunc) : Map</key>
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
		"BIN": "application/octet-stream"
	}
}

