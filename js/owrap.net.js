// OpenWrap v2
// Author: Nuno Aguiar
// Net
 
OpenWrap.net = function() {
	return ow.net;
};

/**
 * <odoc>
 * <key>ow.net.getPublicIP(aIPAddress) : Map</key>
 * Uses the functionality provided by https://ifconfig.co to return a map with the apparent current public ip address,
 * public hostname and a guess of country and city. Please be aware of the request limits of the service (around 1 request
 * per minute).\
 * If aIPAddress is provided it will use the functionality provided by http://ip-api.com (if aIPAddress is a empty string it will
 * use the current public IP address). Please be also aware of non-commercial and request limits of the service (around 45 requests
 * per minute). The details provided by each service might differ depending on how update is each of the services' databases.
 * </odoc>
 */
OpenWrap.net.prototype.getPublicIP = function(aIPAddress) {
    if (isUnDef(aIPAddress)) {
        return $rest().get("https://ifconfig.co/json");
    } else {
        return $rest().get("http://ip-api.com/json/" + aIPAddress + "?fields=66846719");
    }
};

/**
 * <odoc>
 * <key>ow.net.getActualTime(useAlternative) : Date</key>
 * Retrieves the current actual time from worldtimeapi.org (through https). The current actual time will be returned in a Date.
 * If useAlternative = true it will use worldclockapi.com (through http)
 * </odoc>
 */
OpenWrap.net.prototype.getActualTime = function(useAlternative) {
	plugin("HTTP");

	if (useAlternative) {
		//var h = ow.loadObj();
		//return new Date(ow.obj.rest.jsonGet("http://now.httpbin.org").now.epoch * 1000);
		return new Date((1000 * ($rest().get("http://worldclockapi.com/api/json/utc/now").currentFileTime / 10000000 - 11644473600)));
	} else {
		//plugin("XML");
		//return new Date((new XML((new HTTP("https://nist.time.gov/actualtime.cgi")).response())).get("@time")/1000);
		return new Date($rest().get("https://worldtimeapi.org/api/ip").unixtime * 1000);
	}
}

/**
 * <odoc>
 * <key>ow.net.getTLSCertificates(aHost, aPort, withJava, aPath, aPass, aSoTimeout) : Array</key>
 * Tries to retreive the TLS certificates from aHost, aPort (defaults to 443). Optionally if withJava=true the original certificate
 * Java object will also be included. If the CA certificates is in a different location you can provide aPath and the corresponding aPass.
 * Additionally you can specificy aSoTimeout (socket timeout in ms) which defaults to 10s.  
 * </odoc>
 */
OpenWrap.net.prototype.getTLSCertificates = function(aHost, aPort, withJava, aPath, aPass, aSoTimeout) {
    ow.loadFormat();

    _$(aHost, "aHost").isString().$_();
	aPort = _$(aPort, "aPort").isNumber().default(443);
    aPath = _$(aPath, "aPath").isString().default(ow.format.getJavaHome() + "/lib/security/cacerts");
	aPass = _$(aPass, "aPass").isString().default("changeit");
	withJava = _$(withJava, "withJava").isBoolean().default(false);
	aSoTimeout = _$(aSoTimeout, "aSoTimeout").isNumber().default(10000);

    var context = javax.net.ssl.SSLContext.getInstance("TLS");
    var tmf = javax.net.ssl.TrustManagerFactory.getInstance(javax.net.ssl.TrustManagerFactory.getDefaultAlgorithm());
    var ks = java.security.KeyStore.getInstance(java.security.KeyStore.getDefaultType());
    ks.load(io.readFileStream(aPath), (new java.lang.String(aPass)).toCharArray());
    tmf.init(ks);
    var defaultTrustManager = tmf.getTrustManagers()[0];
    var cchain;
    var tm = new JavaAdapter(javax.net.ssl.X509TrustManager, {
      getAcceptedIssuers: function() {
        return new java.security.cert.X509Certificate();
      },
      checkClientTrusted: function() {
        throw new javax.net.ssl.UnsupportedOperationException();
      },
      checkServerTrusted: function(chain, authType) {
        cchain = chain;
        defaultTrustManager.checkServerTrusted(chain, authType);
      }
    });
    context.init(null, [tm], null);
    var factory = context.getSocketFactory();

    var socket = factory.createSocket(aHost, aPort);
    socket.setSoTimeout(aSoTimeout);
    try {
      socket.startHandshake();
    } catch(e) {
    }
    socket.close();

    var sres = af.fromJavaArray(cchain);
    var res = sres.map(r => {
	  var rr = {
		issuerDN    : r.getIssuerDN(),
		subjectDN   : r.getSubjectDN(),
		notBefore   : new Date( r.getNotBefore().toGMTString() ),
		notAfter    : new Date( r.getNotAfter().toGMTString() )
	  };
      if (withJava) rr.javaObj = r;
	  if (!isNull(r.getSubjectAlternativeNames())) rr.alternatives = af.fromJavaArray( r.getSubjectAlternativeNames().toArray() ).map(af.fromJavaArray);
 
	  return rr;
    });
    
	return res;
};

/**
 * <odoc>
 * <key>ow.net.getSSLPublicCertificates(aHost, aPort) : Array</key>
 * Given aHost and aPort for a HTTPs connection it will retrieve the array of peer certificates available.
 * You can retrieve the specific public key by using the method .getPublicKey for each array element. Usually you be
 * interested on the first certificate of the returned array.
 * </odoc>
 */
OpenWrap.net.prototype.getSSLPublicCertificates = function(aHost, aPort) {
    var factory = javax.net.ssl.HttpsURLConnection.getDefaultSSLSocketFactory();
    var socket = factory.createSocket(aHost, aPort);
    socket.startHandshake();

    var certs = socket.getSession().getPeerCertificates();

    return certs;
};

/**
 * <odoc>
 * <key>ow.net.testPublicPort(aPort) : Map</key>
 * Uses the functionality provided by http://ifconfig.co to return a map with the result of testing if aPort is within public 
 * reach from your apparent current public ip address. Please be aware of the request limits of the service (around 1 request
 * per minute).
 * </odoc>
 */
OpenWrap.net.prototype.testPublicPort = function(aPort) {
	plugin("HTTP");
	return JSON.parse((new HTTP("http://ifconfig.co/port/" + String(aPort))).response());
};

/**
 * <odoc>
 * <key>ow.net.getHostName() : String</key>
 * Returns the current hostname.
 * </odoc>
 */
OpenWrap.net.prototype.getHostName = function() {
	return String(java.net.InetAddress.getLocalHost().getHostName());
};

/**
 * <odoc>
 * <key>ow.net.getHostAddress() : String</key>
 * Returns the current host ip address.
 * </odoc>
 */
OpenWrap.net.prototype.getHostAddress = function() {
	return String(java.net.InetAddress.getLocalHost().getHostAddress());
};

/**
 * <odoc>
 * <key>ow.net.host4URL(aURL) : String</key>
 * Given aURL it will return the corresponding host:port.
 * </odoc>
 */
OpenWrap.net.prototype.host4URL = function(aURL) {
    var url = java.net.URL(aURL)
    return String(url.getHost()) + ":" + (url.getPort() == -1 ? Number(url.getDefaultPort()) : Number(url.getPort()))
}

/**
 * <odoc>
 * <key>ow.net.path4URL(aURL) : String</key>
 * Given aURL it will return the corresponding path.
 * </odoc>
 */
OpenWrap.net.prototype.path4URL = function(aURL) {
    var url = java.net.URL(aURL)
    return String(url.getPath())
}

/**
 * <odoc>
 * <key>ow.net.isIPv4(aIP) : boolean</key>
 * Tries to determine if aIP is a syntactic valid IPv4.
 * </odoc>
 */
OpenWrap.net.prototype.isIPv4 = function(aIP) {
	if (isString(aIP) && 
	    aIP.match(/^(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$/)) {
		return true
	} else {
		return false
	}
}

/**
 * <odoc>
 * <key>ow.net.isIPv6(aIP) : boolean</key>
 * Tries to determine if aIP is a syntactic valid IPv6.
 * </odoc>
 */
OpenWrap.net.prototype.isIPv6 = function(aIP) {
	if (isString(aIP) && 
	    aIP.match(/^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/)) {
		return true
	} else {
		return false
	}
}

/**
 * <odoc>
 * <key>ow.net.isURL(aURL) : boolean</key>
 * Tries to determine if aURL seems a syntactic valid URL.
 * </odoc>
 */
OpenWrap.net.prototype.isURL = function(aURL) {
	try {
		if (isString(aURL) &&
		(new java.net.URI(aURL)).isAbsolute()) {
			return true;
		} else {
			return false;
		}
	} catch(e) {
		return false;
	}
};

/**
 * <odoc>
 * <key>ow.net.isHost(aHost) : boolean</key>
 * Tries to determine if aHost seems a syntactic valid host.
 * </odoc>
 */
OpenWrap.net.prototype.isHost = function(aHost) {
	if (isString(aHost) &&
	    aHost.match(/^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/)) {
		return true;
	} else {
		return false;
	}
};

/**
 * <odoc>
 * <key>ow.net.testHost(aAddress, aTimeout) : Map</key>
 * Uses the java implementation (e.g. usually ICMP ping) for testing reachability to an aAddress. It timeouts after aTimeout (defaults to
 * 4000ms). Returns a map with the "time" spent trying to get an answer from aAddress and a boolean "reachable" with the result.
 * </odoc>
 */
OpenWrap.net.prototype.testHost = function(aAddress, aTimeout) {
	_$(aAddress, "address").isString().$_();
	aTimeout = _$(aTimeout, "timeout").isNumber().default(4000);
	
	var init = now();
	var res = (java.net.InetAddress.getByName(aAddress)).isReachable(aTimeout);
	var lat = now() - init;
	
	return { 
	  time: lat,
	  reachable: res
	};
};

/**
 * <odoc>
 * <key>ow.net.testPort(aAddress, aPort, aCustomTimeout) : boolean</key>
 * Tries to connect to aPort (e.g. 1234) on aAddress (e.g. 1.2.3.4). If the connection is successfull it will disconnect
 * and return true, otherwise it will return false. If aCustomTimeout (in ms) is defined, it will use that value as the timeout
 * instead of the 1,5 seconds by default.
 * </odoc>
 */
OpenWrap.net.prototype.testPort = function(aAddress, aPort, aCustomTimeout) {
    if (isUnDef(aCustomTimeout)) aCustomTimeout = 1500;

    try {
        var s = new java.net.Socket();
        s.connect(new java.net.InetSocketAddress(aAddress, aPort), aCustomTimeout);
        s.close();
        return true;
    } catch(e) {
        return false;
    }
};

/**
 * <odoc>
 * <key>ow.net.testPortLatency(aHost, aPort, aCustomTimeout) : Number</key>
 * Test establishing a TCP socket connection with aHost on aPort. Optionally aCustomTimeout can be provided (defaults to
 * 60000 ms). The test will be timed and the time in ms will be returned. If returned a time &lt; 0 then an error occurred or the 
 * host:port couldn't be reached.
 * </odoc>
 */
OpenWrap.net.prototype.testPortLatency = function(aHost, aPort, aCustomTimeout) {
	aCustomTimeout = _$(aCustomTimeout).isNumber().default(60000);
	var sock  = new java.net.Socket();
	var iaddr = new java.net.InetSocketAddress(aHost, aPort);

	var ini = now(), latency = -1;
	try {
		sock.connect(iaddr, aCustomTimeout);
		latency = now() - ini;
	} catch(e) {
		latency = -1;
	} finally {
		sock.close();
	}

	return latency;
};

/**
 * <odoc>
 * <key>ow.net.testURLLatency(aURL, aCustomTimeout) : Number</key>
 * Test sending a HTTP(s) GET to aURL. Optionally aCustomTimeout can be provided. The test will be timed and the time in ms
 * will be returned. If returned a time &lt; 0 then an error occurred or the host:port couldn't be reached.
 * </odoc>
 */
OpenWrap.net.prototype.testURLLatency = function(aURL, aCustomTimeout) {
	ow.loadObj();

	var hc = new ow.obj.http();
	hc.setThrowExceptions(true);
	var ini = now(), latency = -1;
	try {
		hc.get(aURL, __, __, false, aCustomTimeout);
		latency = now() - ini;
	} catch(e) {
		latency = -1;
	}

	return latency;
};

/**
 * <odoc>
 * <key>ow.net.getDNS(aName, aType, aServer) : Object</key>
 * Given aName will do a DNS search for aType (defaults to "a") optionally using dns server aServer.
 * Returns an object or an array of objects.
 * </odoc>
 */
OpenWrap.net.prototype.getDNS = function(aName, aType, aServer) {
    _$(aName, "aName").isString().$_()
    aType   = _$(aType, "aType").isString().default("a")
    aServer = _$(aServer, "aServer").isString().default(__)

    var getProps = aObj => {
        var rr = {}
        Object.keys(aObj).forEach(r => {
            if (r.startsWith("get") && (r != "getClass")) {
                rr[r.substring(3)] = aObj[r]()
            }
        })
        return rr
    }

    var res = []
    var records = new Packages.org.xbill.DNS.Lookup(aName, Packages.org.xbill.DNS.Type[aType.toUpperCase()])
    if (isDef(aServer)) records.setResolver(new Packages.org.xbill.DNS.SimpleResolver(aServer))
    records = records.run()
    for(var i in records) {
        var rec = records[i]
        res.push(getProps(rec))
    }
    if (res.length == 1) res = res[0]
    return res
}

/**
 * <odoc>
 * <key>ow.net.getDoH(aAddr, aType, aProvider) : Array</key>
 * Performs a DNS over HTTPs query with aAddr. Optionally you can provide the aType of record (defaults to 'a') and
 * the DNS over HTTPs aProvider between 'google' and 'cloudflare'.
 * </odoc>
 */
OpenWrap.net.prototype.getDoH = function(aName, aType, aProvider) {
	aProvider = _$(aProvider).default("cloudflare");
 
	switch (aProvider) {
	   case "google":
		  var res = $rest({ uriQuery: true }).get("https://8.8.8.8/resolve", {
			 name: aName,
			 type: aType
		  });
		  if (isDef(res.Answer)) return res.Answer;
		  else return __;
	   case "cloudflare":
		  var res = $rest({
						requestHeaders: {
							accept: "application/dns-json"
						}, 
						uriQuery: true
					})
					.get("https://1.1.1.1/dns-query", {
						name: aName,
						type: aType
					});
		  if (isDef(res.Answer)) return res.Answer;
		  else return __;
	   default:
		  break;
	}
}

/**
 * <odoc>
 * <key>ow.net.getReverseDoH(aIP, aProvider) : Array</key>
 * Tries to retrieve the reverse DNS of aIP using DNS over HTTPs. Optionally you can choose the aProvider between 'google' and 'cloudflare'.
 * </odoc>
 */
OpenWrap.net.prototype.getReverseDoH = function(tIP, aProvider) {
    ow.loadFormat();
	var aIP = tIP, isV6 = false;
	if (tIP.match(/:/)) {
		ow.loadFormat();
		isV6 = true;
		var iip = java.net.InetAddress.getByName(tIP);
		var ar = String(iip.getHostAddress()).split(/:/);
		ar.map(r => { return ow.format.string.leftPad(r, 4); } ).join("").split("").reverse().join(".")
	}
	if (tIP.match(/\./)) {
		aIP = String(tIP).split(/\./).reverse().join(".");
	}

	return this.getDoH(aIP + (isV6 ? ".ip6" : ".in-addr") + ".arpa", "ptr");
}

/**
 * <odoc>
 * <key>ow.net.getAddressType(aAddress) : Map</key>
 * Given aAddress tries to return a map with the following flags: isValidAddress, hostname, ipv4, ipv6 and privateAddress
 * </odoc>
 */
 OpenWrap.net.prototype.getAddressType = function(aTxt) {
    var res ={
        isValidAddress: true,
        hostname: true,
        ipv4: false,
        ipv6: false,
        privateAddress: false
    };
 
    try {
       if (aTxt.trim().match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
          res.ipv4 = true;
          res.hostname = false;

          var addr = java.net.InetAddress.getByName(aTxt);
          if (addr.isSiteLocalAddress() || addr.isLoopbackAddress()) {
             res.privateAddress = true;
          }
       }
 
       if (aTxt.trim().match(/(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/)) {
          res.ipv6 = true;
          res.hostname = false;

          var addr = java.net.InetAddress.getByName(aTxt);
          if (addr.isSiteLocalAddress() || addr.isLoopbackAddress()) {
             res.privateAddress = true;
          }
       }
    } catch (e) {
       res.isValidAddress = false;
       res.hostname = false;
    }
 
    return res;
};

/**
 * <odoc>
 * <key>ow.net.getHost2IP(aHost) : String</key>
 * Tries to resolve aHost to an IP address using the default DNS.
 * </odoc>
 */
 OpenWrap.net.prototype.getHost2IP = function(aName) {
    return String(java.net.InetAddress.getByName(aName).getHostAddress());
};

/**
 * <odoc>
 * <key>ow.net.getIP2Host(aIP) : String</key>
 * Tries to reverse DNS aIP to a host address using the default DNS.
 * </odoc>
 */
OpenWrap.net.prototype.getIP2Host = function(aIP) {
    return String(java.net.InetAddress.getByName(aIP).getCanonicalHostName());
};

/**
 * <odoc>
 * <key>ow.net.getWhoIs(aQuery, aInitServer) : Map</key>
 * Tries to perform a whois aQuery for a domain or an ip address. Optionally you can provide aInitServer (defaults to whois.iana.org)
 * </odoc>
 */
 OpenWrap.net.prototype.getWhoIs = function(aQuery, server) {
    var ws = new Packages.org.apache.commons.net.whois.WhoisClient();
    server = _$(server).isString().default("whois.iana.org");

    ws.connect(server);
    var res = ws.query(aQuery);
    ws.disconnect();

    var result = {},
    prefix = "",
    suffix = "";
    end = false;

    String(res).split(/\r?\n/).forEach(v => {
        if (!v.match(/^\s*%/) && v.match(/^\s*[^:]+:\s+.+/)) {
            var capture = true,
            preend = false;
            var ar = v.match(/^\s*([^\:]+)\:\s*(.+)$/);
            var key = String(ar[1]),
            value = String(ar[2]);

            value = value.trim().replace(/\n+\s*$/, "");
            key = key.trim();

            if (key == "nserver" || key == "whois" || key == "status" || key == "created" || key == "changed" || key == "source") {
                prefix = "";
                suffix = "";
            }
            if (key == "domain") {
                prefix = "domain ";
                suffix = "";
            }
            if (key == "contact") {
                prefix = value + " ";
                suffix = "";
                capture = false;
            }
            if (key == "remarks") capture = false;
            if (key.indexOf(">>>") >= 0 && value.indexOf("<<<") >= 0) {
                key = key.replace(/>>>\s*/, "");
                value = value.replace(/\s*<<</, "");
                preend = true;
            }

            if (capture && !end) {
                if (isDef(result[prefix + key + suffix])) value = result[prefix + key + suffix] + "\n" + value;
                    result[prefix + key + suffix] = value;
            }

            if (preend) end = true;
        }
    });

    if (isDef(result.whois) && result.whois != server) result = ow.net.getWhoIs(aQuery, result.whois);

    return result;
};

