// OpenWrap
// Author: nmaguiar@gmail.com
// Dev

OpenWrap.dev = function() {
	return ow.dev;
};

OpenWrap.dev.prototype.overrideHTTP = function() {
	HTTP = ow.dev.http;
	printErr("OpenAF: using alternative HTTP plugin");
}

OpenWrap.dev.prototype.addMVSCh = function() {
	ow.loadCh();

	ow.ch.__types.mvs = {
		__s: {},
		create       : function(aName, shouldCompress, options) {
			if (isUnDef(options)) options = {};
			if (isUnDef(options.file)) options.file = undefined;

			this.__s[aName] = Packages.org.h2.mvstore.MVStore.Builder().fileName(options.file);
			if (shouldCompress) this.__s[aName] = this.s[aName].compress();
			this.__s.open();

			if (isUnDef(options.map)) {
				options.map = function() { return "default"; };
			}

			this.__m[aName] = options.map;
		},
		destroy      : function(aName) {
			this.__s[aName].close();
		},
		size         : function(aName) {
			var map = this.__s[aName].openMap(this.__m[aName]());
			return map.sizeAsLong();
		},
		forEach      : function(aName, aFunction) {},
		getKeys      : function(aName, full) {},
		getSortedKeys: function(aName, full) {},
		getSet       : function getSet(aName, aMatch, aK, aV, aTimestamp)  {},
		set          : function(aName, ak, av, aTimestamp) {
			var map = this.__s[aName].openMap(this.__m[aName]());

			map.put(stringify(ak), stringify(av));
			this.__s[aName].commit();
		},
		setAll       : function(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp) {},
		get          : function(aName, aKey) {
			var map = this.__s[aName].openMap(this.__m[aName]());

			return jsonParse(map.get(stringify(ak)));
		},
		pop          : function(aName) {},
		shift        : function(aName) {},
		unset        : function(aName, aKey) {
			var map = this.__s[aName].openMap(this.__m[aName]());

			return map.remove(stringify(aKey));
		}
	}
}

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