// OpenWrap
// Author: nuno.aguiar@wedotechnologies.com
// Dev

OpenWrap.dev = function() {
	return ow.dev;
};

OpenWrap.dev.prototype.http = function(aURL, aRequestType, aIn, aRequestMap, isBytes, aTimeout, returnStream) {
	this.__h = new Packages.org.apache.http.impl.client.HttpClients.createDefault();
};

OpenWrap.dev.prototype.http.prototype.exec = function(aUrl, aRequestType, aIn, aRequestMap, isBytes, aTimeout, returnStream) {
	var r;

	switch(aRequestType.toUpperCase()) {
	case "GET": 
		r = new Packages.org.apache.http.client.methods.HttpGet(aUrl);
		break;
	case "POST": 
		r = new Packages.org.apache.http.client.methods.HttpPost(aUrl);
		break;
	case "DELETE": 
		r = new Packages.org.apache.http.client.methods.HttpDelete(aUrl);
		break;
	case "HEAD":
		r = new Packages.org.apache.http.client.methods.HttpHead(aUrl);
		break;
	case "PATCH":
		r = new Packages.org.apache.http.client.methods.HttpPatch(aUrl);
		break;
	case "PUT":
		r = new Packages.org.apache.http.client.methods.HttpPut(aUrl);
		break;		
	case "TRACE":
		r = new Packages.org.apache.http.client.methods.HttpTrace(aUrl);
		break;		
	default:
		r = new Packages.org.apache.http.client.methods.HttpGet(aUrl);
		break;
	}

	for(var i in aRequestMap) {
		r.addHeader(i, aRequestMap[i]);
	}

	if (isDef(aIn) && isString(aIn)) {
		r.setEntity(Packages.org.apache.http.entity.StringEntity(aIn));
	}

	if (isDef(r)) this.__r = this.__h.execute(r);
	if (isBytes) {
		return this.responseBytes();
	} else {
		return this.response();
	}
};

OpenWrap.dev.prototype.http.prototype.get = function(aUrl, aIn, aRequestMap, isBytes, aTimeout, returnStream) {
	return this.exec(aUrl, "GET", aIn, aRequestMap, isBytes, aTimeout, returnStream);
};

OpenWrap.dev.prototype.http.prototype.getErrorResponse = function() {

};

OpenWrap.dev.prototype.http.prototype.getResponse = function() {
	
};
	
OpenWrap.dev.prototype.http.prototype.login = function(aUser, aPassword, forceBasic, urlPartial) {

};

OpenWrap.dev.prototype.http.prototype.response = function() {
	try {
		var res = Packages.org.apache.http.util.EntityUtils.toString(this.__r.getEntity());
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
	
};

OpenWrap.dev.prototype.http.prototype.responseHeaders = function() {
	
};

OpenWrap.dev.prototype.http.prototype.responseStream = function() {
	
};

OpenWrap.dev.prototype.http.prototype.responseType = function() {
	
};