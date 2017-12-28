// OpenWrap
// Author: Nuno Aguiar
// Dev

OpenWrap.dev = function() {
	return ow.dev;
};

OpenWrap.dev.prototype.loadPoolDB = function() {
	ow.loadCh();
	ow.loadObj();

	ow.ch.__types.pooldb = {
		__o: { },
		create       : function(aName, shouldCompress, options) { 
			this.__o[aName] = options || {};
			
			if (isUnDef(this.__o[aName].dbPool)) {
				this.__o[aName].dbPool = ow.obj.pool.DB("org.h2.Driver", "jdbc:h2:mem:", "sa", "sa");
			}

			if (isUnDef(this.__o[aName].tableName)) {
				throw "Need a specific options.tableName";
			}
		},
		destroy      : function(aName) { },
		size         : function(aName) { 
			var parent = this, res;
			this.__o[aName].dbPool.use((aDb) => {
				res = Number(aDb.q("select count(*) C from " + parent.__o[aName].tableName).results[0].C);
			});

			return res;
		},
		forEach      : function(aName, aFunction, x) { },
		getKeys      : function(aName, full) { },
		getSortedKeys: function(aName, full) { },
		getSet       : function getSet(aName, aMatch, aK, aV, aTimestamp)  { },
		set          : function(aName, ak, av, aTimestamp) { },
		setAll       : function(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp) { },
		get          : function(aName, aKey) { },
		pop          : function(aName) { },
		shift        : function(aName) { },
		unset        : function(aName, aKey) { }
	};
};

OpenWrap.dev.prototype.loadIgnite = function(aGridName, aIgnite, secretKey, isClient) {
	ow.dev.__i = [];

	var initI = () => {
		plugin("Ignite");
		var grid = (isUnDef(aGridName)) ? "default" : aGridName;
		if (isUnDef(aIgnite)) {
			ow.dev.__i[grid] = new Ignite();
			ow.dev.__i[grid].start(aGridName, secretKey, isClient);
		} else {
			ow.dev.__i[grid] = aIgnite;
		}
	};

	oPromise.prototype.thenAny = function(aFunc, aRejFunc, aGridName) {
		if (isUnDef(ow.dev.__i)) initI();
		return this.then(() => {
			var grid = (isUnDef(aGridName)) ? "default" : aGridName;
			return ow.dev.__i[grid].call(ow.dev.__i[grid].getIgnite(), aFunc.toSource().replace(/[^{]*{([\s\S]*)}[^}]*/, "$1").replace(/"/mg, "\\\""));
		}, aRejFunc);
	};


	oPromise.prototype.thenAll = function(aFunc, aRejFunc, aGridName) {
		if (isUnDef(ow.dev.__i)) initI();
		return this.then(() => {
			var grid = (isUnDef(aGridName)) ? "default" : aGridName;
			return ow.dev.__i[grid].broadcast(ow.dev.__i[grid].getIgnite(), aFunc.toSource().replace(/[^{]*{([\s\S]*)}[^}]*/, "$1").replace(/"/mg, "\\\""));
		}, aRejFunc);
	};

	initI();
};

/*
OpenWrap.dev.prototype.overridePromise = function () {
	oPromise = function (aFunction, aRejFunction) {
		this.states = {
			NEW: 0, FULFILLED: 1, PREFAILED: 2, FAILED: 3
		};

		this.state = this.states.NEW;
		this.executing = false;
		this.executors = new java.util.concurrent.ConcurrentLinkedQueue();

		this.then(aFunction, aRejFunction);
	};

	oPromise.prototype.then = function(aResolveFunc, aRejectFunc) {
		if (isDef(aRejectFunc) && isFunction(aRejectFunc)) this.executors.add({ type: "reject", func: aRejectFunc });
		if (isDef(aResolveFunc) && isFunction(aResolveFunc)) {
			this.executors.add({ type: "exec", func: aResolveFunc});
			this.__exec();
		}
		return this;
	};

	oPromise.prototype.catch = function(onReject) {
		if (isDef(onReject) && isFunction(onReject)) {
			this.executors.add({ type: "reject", func: onReject });
			this.__exec();
		}
		return this;
	};

	oPromise.prototype.resolve = function(aValue) {
		if (this.state == this.states.FULFILLED) this.state = this.states.NEW;
		this.value = isUnDef(aValue) ? null : aValue;
		return this;
	};

	oPromise.prototype.reject = function(aReason) {
		this.reason = aReason;
		this.state = this.states.PREFAILED;

		return this;
	};

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

	oPromise.prototype.race = function(anArray) {
		if (this.state != this.states.NEW || this.executing == true) throw "oPromise is already executing.";
	
		var parent = this;

		this.then((res, rej) => {
			var shouldStop = false;
			var c = 0;
			
			try {
				while(!shouldStop) {
					for(var i in anArray) {
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

	oPromise.prototype.__exec = function () {
		// TBC  
		var thisOP = this;
		do {
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
									isDef(res) &&
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

		} while (isUnDef(this.__f) || this.__f == null || !this.executors.isEmpty());
	};
};
*/

/*
OpenWrap.dev.prototype.overrideHTTP = function() {
	HTTP = ow.dev.http;
	printErr("OpenAF: using alternative HTTP plugin");
}*/

/*
OpenWrap.dev.prototype.addMVSCh = function() {
	ow.loadCh();

	ow.ch.__types.mvs = {
		create       : function(aName, shouldCompress, options) {
			if (isUnDef(options)) options = {};
			if (isUnDef(options.file)) options.file = undefined;

			if (isUnDef(this.__s)) this.__s = {};
			if (isUnDef(this.__f)) this.__f = {};
			if (isUnDef(this.__m)) this.__m = {};

			var existing = false, absFile;
			if (isDef(options.file)) {
				absFile = String((new java.io.File(options.file)).getAbsoluteFile());
			} else {
				absFile = "memory";
			}
			if (isUnDef(this.__f[absFile])) {
				this.__s[aName] = Packages.org.h2.mvstore.MVStore.Builder();
				if (absFile != "memory") this.__s[aName] = this.__s[aName].fileName(absFile);
				if (shouldCompress) this.__s[aName] = this.__s[aName].compress();
				this.__s[aName] = this.__s[aName].open();

				this.__f[absFile] = this.__s[aName];
			} else {
				existing = true;
				this.__s[aName] = this.__f[absFile];
			}

			if (isUnDef(options.map)) {
				options.map = function() { return "default"; };
			} else {
				if (isString(options.map)) {
					options.map = new Function("return '" + options.map + "';");
				}
			}

			this.__m[aName] = options.map;

			if (isDef(options.compact) && options.compact) {
				this.__s[aName].compactMoveChuncks();
			}
		},
		destroy      : function(aName) {
			if (isDef(options.compact) && options.compact) {
				this.__s[aName].compactMoveChuncks();
			}			
			this.__s[aName].close();
		},
		size         : function(aName) {
			var map = this.__s[aName].openMap(this.__m[aName]());
			return map.sizeAsLong();
		},
		forEach      : function(aName, aFunction, x) {
			var aKs = this.getKeys(aName);

			for(let i in aKs) {
				aFunction(aKs[i], this.get(aName, aKs[i], x));
			}
		},
		getKeys      : function(aName, full) {
			var res = [];
			var map = this.__s[aName].openMap(this.__m[aName]());

			for(let i = 0; i < this.size(aName); i++) {
				res.push(jsonParse(map.getKey(i)));
			}

			return res;
		},
		getSortedKeys: function(aName, full) {
			return this.getKeys(aName, full);
		},
		getSet       : function getSet(aName, aMatch, aK, aV, aTimestamp)  {
			var res;
			res = this.get(aName, aK);
			if ($stream([res]).anyMatch(aMatch)) {
				return this.set(aName, aK, aV, aTimestamp);
			}
			return undefined;		
		},
		set          : function(aName, ak, av, aTimestamp) {
			var map = this.__s[aName].openMap(this.__m[aName]());

			map.put(stringify(ak), stringify(av));
			this.__s[aName].commit();
		},
		setAll       : function(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp) {
			for(let i in anArrayOfMapData) {
				this.set(aName, ow.loadObj().filterKeys(anArrayOfKeys, anArrayOfMapData[i]), anArrayOfMapData[i], aTimestamp);
			}
		},
		get          : function(aName, aKey) {
			var map = this.__s[aName].openMap(this.__m[aName]());

			return jsonParse(map.get(stringify(aKey)));
		},
		pop          : function(aName) {
			var map = this.__s[aName].openMap(this.__m[aName]());
			var aKey = map.lastKey();
			return jsonParse(map.remove(aKey));	
		},
		shift        : function(aName) {
			var map = this.__s[aName].openMap(this.__m[aName]());
			var aKey = map.firstKey();
			return jsonParse(map.remove(aKey));
		},
		unset        : function(aName, aKey) {
			var map = this.__s[aName].openMap(this.__m[aName]());

			return jsonParse(map.remove(stringify(aKey)));
		}
	};
};*/

/*
OpenWrap.dev.prototype.http = function(aURL, aRequestType, aIn, aRequestMap, isBytes, aTimeout, returnStream) {
	this.__lps = {};
	//this.__h = new Packages.org.apache.http.impl.client.HttpClients.createDefault();
	if (isDef(aURL)) {
		this.exec(aURL, aRequestType, aIn, aRequestMap, isBytes, aTimeout, returnStream);
	}
};

OpenWrap.dev.prototype.http.prototype.exec = function(aUrl, aRequestType, aIn, aRequestMap, isBytes, aTimeout, returnStream) {
	var r, canHaveIn = false;

	if (isUnDef(aRequestType)) aRequestType = "GET";

	switch(aRequestType.toUpperCase()) {
	case "GET": 
		r = new Packages.org.apache.http.client.methods.HttpGet(aUrl);
		break;
	case "POST": 
		r = new Packages.org.apache.http.client.methods.HttpPost(aUrl);
		canHaveIn = true;
		break;
	case "DELETE": 
		r = new Packages.org.apache.http.client.methods.HttpDelete(aUrl);
		break;
	case "HEAD":
		r = new Packages.org.apache.http.client.methods.HttpHead(aUrl);
		break;
	case "PATCH":
		r = new Packages.org.apache.http.client.methods.HttpPatch(aUrl);
		canHaveIn = true;
		break;
	case "PUT":
		r = new Packages.org.apache.http.client.methods.HttpPut(aUrl);
		canHaveIn = true;
		break;		
	case "TRACE":
		r = new Packages.org.apache.http.client.methods.HttpTrace(aUrl);
		break;		
	default:
		r = new Packages.org.apache.http.client.methods.HttpGet(aUrl);
		break;
	}

	// Set credentials
	if (isDef(this.__l) && !(this.__forceBasic)) {
		var getKey;
		this.__h = new Packages.org.apache.http.impl.client.HttpClients.custom();
		for(var key in this.__lps) {
			if (aUrl.startsWith(key)) getKey = key;
		}
		if (isDef(getKey)) {
			this.__h = this.__h.setDefaultCredentialsProvider(this.__lps[getKey]).build();
		} else {
			this.__h = this.__h.build();
		}
	} else {
		if (isUnDef(this.__h)) this.__h = new Packages.org.apache.http.impl.client.HttpClients.createDefault();
	}

	// Set timeout
	if (isDef(aTimeout)) {
		var rc = new Packages.org.apache.http.client.config.RequestConfig.custom();
		rc.setConnectionRequestTimeout(aTimeout);
		rc.setConnect(aTimeout);
		r.setConfig(rc.build());
	}

	if (this.__forceBasic && isDef(this.__l)) {
		r.addHeader("Authorization", "Basic " + String(new java.lang.String(Packages.org.apache.commons.codec.binary.Base64.encodeBase64(new java.lang.String(this.__l + ":" + Packages.wedo.openaf.AFCmdBase.afc.dIP(this.__p)).getBytes()))));
	}

	for(var i in aRequestMap) {
		r.addHeader(i, aRequestMap[i]);
	}

	if (isDef(aIn) && isString(aIn) && canHaveIn) {
		r.setEntity(Packages.org.apache.http.entity.StringEntity(aIn));
	}

	this.outputObj = {};
	if (isDef(r)) this.__r = this.__h.execute(r);
	if (isBytes) {
		this.outputObj =  {
			responseCode: this.responseCode(),
			contentType: this.responseType(),
			responseBytes: this.responseBytes()
		};
	} else {
		if (returnStream) {
			this.outputObj = this.responseStream();
		} else {
			this.outputObj = {
				responseCode: this.responseCode(),
				contentType: this.responseType(),
				response: this.response()
			};
		}
	}

	if (this.outputObj.responseCode >= 400) {
		switch(this.outputObj.responseCode) {
		case 404: throw "FileNotFoundException " + aUrl + "; error = " + stringify(this.getErrorResponse());
		case 410: throw "FileNotFoundException " + aUrl + "; error = " + stringify(this.getErrorResponse());
		default: throw "IOException Server returned HTTP response code: " + this.responseCode() + " for URL: " + aUrl + "; response = " + stringify(this.getErrorResponse());
		}
	}
	return this.outputObj;
};

OpenWrap.dev.prototype.http.prototype.get = function(aUrl, aIn, aRequestMap, isBytes, aTimeout, returnStream) {
	return this.exec(aUrl, "GET", aIn, aRequestMap, isBytes, aTimeout, returnStream);
};

OpenWrap.dev.prototype.http.prototype.post = function(aUrl, aIn, aRequestMap, isBytes, aTimeout, returnStream) {
	return this.exec(aUrl, "POST", aIn, aRequestMap, isBytes, aTimeout, returnStream);
};

OpenWrap.dev.prototype.http.prototype.getErrorResponse = function() {
	return this.outputObj;
};

OpenWrap.dev.prototype.http.prototype.getResponse = function() {
	return this.outputObj;
};
	
OpenWrap.dev.prototype.http.prototype.login = function(aUser, aPassword, forceBasic, urlPartial) {
	if (isUnDef(urlPartial)) forceBasic = true;

	if (!forceBasic) {
		var url = new java.net.URL(urlPartial);
		var port = url.getPort();
		if (port < 0) {
			switch(url.getProtocol()) {
			case "http" : port = 80; break;
			case "https": port = 443; break;
			}
		}
		var as = new Packages.org.apache.http.auth.AuthScope(url.getHost(), port);
		var up = new Packages.org.apache.http.auth.UsernamePasswordCredentials(aUser, Packages.wedo.openaf.AFCmdBase.afc.dIP(aPassword));
		var cred = new org.apache.http.impl.client.BasicCredentialsProvider();
		cred.setCredentials(as, up);
		this.__lps[urlPartial] = cred;
	}

	this.__l = aUser;
	this.__p = aPassword;
	this.__forceBasic = forceBasic;
};

OpenWrap.dev.prototype.http.prototype.response = function() {
	try {
		var res = String(Packages.org.apache.http.util.EntityUtils.toString(this.__r.getEntity()));
		return res;
	} finally {
		this.__r.close();
	}
};

OpenWrap.dev.prototype.http.prototype.responseBytes = function() {
	try {
		var res = Packages.org.apache.http.util.EntityUtils.toByteArray(this.__r.getEntity());
		return res;
	} finally {
		this.__r.close();
	}
};

OpenWrap.dev.prototype.http.prototype.responseCode = function() {
	return Number(this.__r.getStatusLine().getStatusCode());
};

OpenWrap.dev.prototype.http.prototype.responseHeaders = function() {
	var ar = {};
	var hh = this.__r.getAllHeaders();
	for(var i in hh) {
		ar[hh[i].getName()] = hh[i].getValue();
	}

	return ar;
};

OpenWrap.dev.prototype.http.prototype.responseStream = function() {
	return this.__r.getEntity().getContent();
};

OpenWrap.dev.prototype.http.prototype.responseType = function() {
	try {
		return String(this.__r.getEntity().getContentType().getValue());
	} catch(e) {
		return "";
	}
};

OpenWrap.dev.prototype.http.prototype.wsConnect = function(anURL, onConnect, onMsg, onError, onClose, aTimeout, supportSelfSigned) {
	var auth = null;

	if (isDef(this.__l)) {
		auth = new java.net.Authenticator.Authenticator({
			getPasswordAuthenticator: function() {
				if (this.__forceBasic) {
					return new java.net.PasswordAuthentication(this.__l, Packages.wedo.openaf.AFCmdBase.afc.dIP(this.__p));
				} else {
					var getKey;
					for(var key in this.__lps) {
						if (aUrl.startsWith(key)) getKey = key;
					}

					if (isDef(getKey)) {
						var url = new java.net.URL(urlPartial);
						var port = url.getPort();
						if (port < 0) {
							switch(url.getProtocol()) {
							case "http" : port = 80; break;
							case "https": port = 443; break;
							}
						}
						var as = new Packages.org.apache.http.auth.AuthScope(url.getHost(), port);
						return new java.net.PasswordAuthentication(
							h.__lps[getKey].getCredentials(as).getUserName(), 
							Packages.wedo.openaf.AFCmdBase.afc.dIP(h.__lps[getKey].getCredentials(as).getPassword()));
					}
				}
			}
		});
	}

	return Packages.wedo.openaf.plugins.HTTPws.WebSockets.wsConnect(
		auth, 
		(isUnDef(this.__l)) ? null : this.__l, (isUnDef(this.__p)) ? null : this.__p, 
		(isUnDef(anURL)) ? null : anURL, 
		(isUnDef(onConnect)) ? null : onConnect, 
		(isUnDef(onMsg)) ? null : onMsg, 
		(isUnDef(onError)) ? null : onError,
		(isUnDef(onClose)) ? null : onClose, 
		(isNumber(aTimeout)) ? new java.lang.Long(aTimeout) : Packages.org.mozilla.javascript.Undefined.instance, 
		(isUnDef(supportSelfSigned)) ? false : supportSelfSigned);
};
*/