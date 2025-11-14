// OpenWrap v2
// Copyright 2023 Nuno Aguiar
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
 * <key>ow.net.getActualTime(aServer, aTimeout) : Date</key>
 * Retrieves the current actual time from NTP servers. The current actual time will be returned in a Date.
 * If aServer is provided, it will use that specific server, otherwise it will try multiple public NTP servers
 * in sequence: 'pool.ntp.org', 'time.google.com', 'time-a.nist.gov', 'europe.pool.ntp.org'.
 * aTimeout is optional and defaults to 5000ms.
 * </odoc>
 */
OpenWrap.net.prototype.getActualTime = function(aServer, aTimeout) {
	var NTPUDPClient = Packages.org.apache.commons.net.ntp.NTPUDPClient
	var InetAddress  = Packages.java.net.InetAddress

	aTimeout = _$(aTimeout, "aTimeout").isNumber().default(5000)

	var servers = []
	if (isDef(aServer)) {
		servers = [aServer]
	} else {
		servers = ["pool.ntp.org", "time.google.com", "time-a.nist.gov", "europe.pool.ntp.org"]
	}

	var lastError
	for (var i = 0; i < servers.length; i++) {
		var server = servers[i]
		var client = new NTPUDPClient()
		client.setDefaultTimeout(aTimeout)

		try {
			var address = InetAddress.getByName(server)
			var info = client.getTime(address)

			info.computeDetails()
			var offset = info.getOffset()

			if (offset === null || isNaN(offset)) {
				throw "No valid offset returned by NTP server: " + server
			}

			var systemTime = java.lang.System.currentTimeMillis()
			var correctedTime = systemTime + Number(offset)

			if (isNaN(correctedTime)) {
				throw "Invalid corrected time calculated from NTP server: " + server
			}

			return new Date(correctedTime)
		} catch(e) {
			lastError = e
		} finally {
			try {
				client.close()
			} catch(e2) {}
		}
	}

	// If all servers failed, throw the last error
	throw "Failed to get time from any NTP server. Last error: " + lastError
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
 * <key>ow.net.getStoredCertificates(aStoreFile, aPassword) : Array</key>
 * Given a Java certificate store (aStoreFile) will retrieve a list of aliases, issuer DN, subject DN, expire notBefore and notAfter dates.
 * Optionally aPassword can be provided if different from the default one.
 * </odoc>
 */
OpenWrap.net.prototype.getStoredCertificates = function(aStoreFile, aPassword) {
    _$(aStoreFile, "aStoreFile").isString().$_()
    aPassword = _$(aPassword, "aPassword").isString().default("changeit")

    var ks = java.security.KeyStore.getInstance(java.security.KeyStore.getDefaultType())
    var is = io.readFileStream(aStoreFile)
    ks.load(is, (new java.lang.String(Packages.openaf.AFCmdBase.afc.dIP(aPassword))).toCharArray())
    is.close()

    var res = []
    var it = ks.aliases()
    while(it.hasNext()) {
        var alias = it.next()
        var c = ks.getCertificate(alias)
        res.push({
            alias    : alias,
            issuerDN : c.getIssuerDN(),
            subjectDN: c.getSubjectDN(),
            notBefore: new Date(c.getNotBefore().toGMTString()),
            notAfter : new Date(c.getNotAfter().toGMTString()) 
        })
    }

    return res
}

/**
 * <odoc>
 * <key>ow.net.getCAStoredCertificates(aPassword) : Array</key>
 * Will retrieve a list of aliases, issuer DN, subject DN, expire notBefore and notAfter dates from the current Java "cacerts" file.
 * Optionally aPassword can be provided if different from the default one.
 * </odoc>
 */
OpenWrap.net.prototype.getCAStoredCertificates = function(aPassword) {
    return ow.net.getStoredCertificates(ow.format.getJavaHome() + "/lib/security/cacerts", aPassword)
}

/**
 * <odoc>
 * <key>ow.net.getJSSECAStoredCertificates(aPassword) : Array</key>
 * Will retrieve a list of aliases, issuer DN, subject DN, expire notBefore and notAfter dates from the current Java "jssecacerts" file.
 * Optionally aPassword can be provided if different from the default one.
 * </odoc>
 */
OpenWrap.net.prototype.getJSSECAStoredCertificates = function(aPassword) {
    return ow.net.getStoredCertificates(ow.format.getJavaHome() + "/lib/security/jssecacerts", aPassword)
}

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
 * <key>ow.net.getDNS(aName, aType, aServer, aExtended) : Object</key>
 * Given aName will do a DNS search for aType (defaults to "a") optionally using dns server aServer.
 * Returns an object or an array of objects. If aExtended is true it will return a more detailed JSON object.
 * </odoc>
 */
OpenWrap.net.prototype.getDNS = function(aName, aType, aServer, aExtended) {
    _$(aName, "aName").isString().$_()
    aType      = _$(aType, "aType").isString().default("a")
    aServer    = _$(aServer, "aServer").isString().default(__)
    aExtended = _$(aExtended, "aExtended").isBoolean().default(__flags.NET.getDNSExtended)

    var getProps = aObj => {
        var rr = {}
        if (!isJavaObject(aObj) || aObj instanceof java.lang.String) return String(aObj)
        Object.keys(aObj).filter(r => r!="getClass").forEach(r => {
            try {
                if (r.startsWith("get")) {
                    var _v
                    try {
                        _v = aObj[r]()

                        if (aExtended) {
                            if (r != "getBytes") {
                                if (isNumber(_v)) {
                                    rr[r.substring(3)] = _v
                                } else {
                                    if (!isNull(_v) && Object.keys(_v).filter(r => r.startsWith("get")).filter(r => r!="getBytes" && r!="getChars").length > 0) {
                                        rr[r.substring(3)] = getProps(_v)
                                    } else {
                                        if (isNull(_v)) {
                                            if (r != "getLabel" && r != "getLabelString")
                                                rr[r.substring(3)] = _v
                                            else
                                                rr = String(_v)
                                        }
                                    }
                                }
                            }
                        } else {
                            rr[r.substring(3)] = _v
                        }
                    } catch(ee) {
                        rr = String(aObj)
                    }
                }
                if (r.startsWith("is")) {
                    rr[r.substring(2)] = aObj[r]()
                }
            } catch(e) {
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
 * <key>ow.net.doh(aAddr, aType, aProvider, aCache, aCacheTimeout) : String</key>
 * Performs a DNS over HTTPs query with aAddr. Optionally you can provide the aType of record (defaults to 'a') and
 * the DNS over HTTPs aProvider between 'google', 'cloudflare', 'nextdns' and 'local' (that doesn't use DoH but fallbacks to 
 * Java's DNS resolver). Returns the first IP address found. If aCache is provided (optionally with aCacheTimeout in ms) the results
 * will be cached.
 * </odoc>
 */
OpenWrap.net.prototype.doh = function(aName, aType, aProvider, aCache, aCacheTimeout) {
    aProvider = _$(aProvider, "aProvider").isString().default(__flags.DOH_PROVIDER)
    aType     = _$(aType, "aType").isString().default("a")
    _$(aName, "aName").isString().$_()

    var _fn = (aN, aT, aP) => {
        var _r = ow.net.getDoH(aN, aT, aP)
        if (isArray(_r) && _r.length > 0 && isString(_r[0].data)) {
            if (_r[0].data.match(/^(\d+[:\.]*)+$/))
                return _r[0].data
            else
                return _fn(_r[0].data)
        } else {
            return aN
        }
    }

    if (isString(aCache)) {
        if  ($ch().list().indexOf(aCache) < 0) {
            // One minute cache timeout by default
            aCacheTimeout = _$(aCacheTimeout, "aCacheTimeout").isNumber().default(60000)
            $cache(aCache)
            .ttl(aCacheTimeout)
            .maxSize(1000000)
            .fn(aK => { return { r: _fn(aK.n, aK.t, aK.p) } })
            .create()
        }

        var _rs = $cache(aCache).get({ n: aName, t: aType, p: aProvider })
        if (isDef(_rs) && isDef(_rs.r)) return _rs.r; else return _rs
    } else {
        return _fn(aName, aType, aProvider)
    }
}

/**
 * <odoc>
 * <key>ow.net.getDoH(aAddr, aType, aProvider) : Array</key>
 * Performs a DNS over HTTPs query with aAddr. Optionally you can provide the aType of record (defaults to 'a') and
 * the DNS over HTTPs aProvider between 'google', 'cloudflare', 'nextdns' and 'local' (that doesn't use DoH but fallbacks to 
 * Java's DNS resolver).
 * </odoc>
 */
OpenWrap.net.prototype.getDoH = function(aName, aType, aProvider) {
	aProvider = _$(aProvider).default(__flags.DOH_PROVIDER);
 
	switch (aProvider) {
       case "local":
          var _r = ow.net.getDNS(aName, aType, __, true)
          return [{
            name: _r.Name,
            type: _r.Type,
            TTL : _r.TTL,
            data: _r.Address.HostAddress
          }]
	   case "google":
		  var res = $rest({ uriQuery: true }).get("https://8.8.8.8/resolve", {
			 name: aName,
			 type: aType
		  });
		  if (isDef(res.Answer)) return res.Answer;
		  else return __;
       case "nextdns":
          var res = $rest({ uriQuery: true }).get("https://dns.nextdns.io", {
            name: aName,
            type: aType
          })
          if (isDef(res.Answer)) return res.Answer; else return __
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
 * <key>ow.net.sendUDPPacket(aHost, aPort, aMsg, dontWait, bufferSize) : Bytes</key>
 * Tries to send a string or array of bytes aMsh to aHost and aPort using UDP. If dontWait=true it won't wait
 * for a response that is stored in a buffer (where bufferSize = 1024 bytes, by default).
 * </odoc>
 */
OpenWrap.net.prototype.sendUDPPacket = function(aHost, aPort, aMsg, dontWait, bufferSize) {
    _$(aHost, "aHost").isString().$_()
    _$(aPort, "aPort").isNumber().$_()
    _$(aMsg, "aMsg").isString().$_()

    bufferSize = _$(bufferSize, "bufferSize").isNumber().default(1024)
    dontWait = _$(dontWait, "dontWait").isBoolean().default(false)

    var ds  = new java.net.DatagramSocket()
    var msg = isString(aMsg) ? af.fromString2Bytes(aMsg) : aMsg
    var dp  = new java.net.DatagramPacket(msg, msg.length, java.net.InetAddress.getByName(aHost), aPort)

    ds.send(dp)

    if (!dontWait) {
        var buf = newJavaArray(java.lang.Byte.TYPE, bufferSize)
        var recv = new java.net.DatagramPacket(buf, bufferSize)
        ds.receive(recv)
        return recv.getData()
    }
}

/**
 * <odoc>
 * <key>ow.net.sendTCPPacket(aHost, aPort, aMsg, dontWait) : Bytes</key>
 * Tries to send a string or array of bytes aMsh to aHost and aPort using TCP. If dontWait=true it won't wait
 * for a response.
 * </odoc>
 */
OpenWrap.net.prototype.sendTCPPacket = function(aHost, aPort, aMsg, dontWait) {
    _$(aHost, "aHost").isString().$_()
    _$(aPort, "aPort").isNumber().$_()
    _$(aMsg, "aMsg").isString().$_()

    dontWait = _$(dontWait, "dontWait").isBoolean().default(false)

    var res
    var cs = new java.net.Socket(aHost, aPort)
    var is = cs.getInputStream()
    var os = cs.getOutputStream()
    
    ioStreamWrite(os, aMsg)
    if (!dontWait) {
        res = af.fromInputStream2Bytes(is)
        is.close()
    }

    os.close()
    cs.close()

    return res
}

/**
 * <odoc>
 * <key>ow.net.ipv4SubNetInfo(aCIDRorAddress, aMask) : Map</key>
 * Given an IPv4 aCIDR or anAddress with aMask will return a map with the corresponding subnet info including
 * netmask, broadcast address, address count, low &amp; high address, etc...
 * </odoc>
 */
OpenWrap.net.prototype.ipv4SubNetInfo = function(aCIDR, aMask) {
    _$(aCIDR, "aCIDRorAddress").isString().$_()
    aMask = _$(aMask, "aMask").isString().default(__)

    var su
    if (isDef(aMask)) {
        su = new org.apache.commons.net.util.SubnetUtils(aCIDR, aMask)
    } else {
        su = new org.apache.commons.net.util.SubnetUtils(aCIDR)
    }

    su = su.getInfo()
    return {
        cidr: String(su.getCidrSignature()),
        netmask: String(su.getNetmask()),
        address: String(su.getAddress()),
        networkAddress: String(su.getNetworkAddress()),
        addressCount: Number(su.getAddressCountLong()),
        broadcast: String(su.getBroadcastAddress()),
        low: String(su.getLowAddress()),
        high: String(su.getHighAddress())
    }
}

/**
 * <odoc>
 * <key>ow.net.getAddressInfo(aAddress) : Map</key>
 * Given an IPv4 or IPv6 aAddress will return a map with hostname, address and corresponding address flags
 * to determine which type of address it is (is it a private address? is it a loopback? is it a multicast address?)
 * </odoc>
 */
OpenWrap.net.prototype.getAddressInfo = function(aAddr) {
    _$(aAddr, "aAddr").$_()

    var ia = java.net.InetAddress.getByName(aAddr)
    return {
        hostname: ia.getHostName(),
        canonicalHostName: ia.getCanonicalHostName(),
        hostAddress: ia.getHostAddress(),
        isIPv4: ow.net.isIPv4(aAddr),
        isIPv6: ow.net.isIPv6(aAddr),
        isLoopback: ia.isLoopbackAddress(),
        isPrivateAddress: ia.isSiteLocalAddress(),
        isMulticast: ia.isMulticastAddress(),
        isAnyLocalAddress: ia.isAnyLocalAddress(),
        isLinkLocalAddress: ia.isLinkLocalAddress(),
        isMulticastGlobal: ia.isMCGlobal(),
        isMulticastNode: ia.isMCNodeLocal(),
        isMulticastLink: ia.isMCLinkLocal(),
        isMulticastSite: ia.isMCSiteLocal(),
        isMulticastOrg: ia.isMCOrgLocal()
    }
}

/**
 * <odoc>
 * <key>ow.net.ipv4SubNetInRange(aTestAddress, aCIDRorAddress, aMask) : boolean</key>
 * Given IPv4 aTestAddress and a aCIDR or anAddress with aMask will return true if the aTestAddress is part of the subnet
 * represented by aCIDR or aAddress + aMask (false otherwise).
 * </odoc>
 */
OpenWrap.net.prototype.ipv4SubNetInRange = function(aAddr, aCIDR, aMask) {
    _$(aAddr, "aTestAddress").$_()
    _$(aCIDR, "aCIDRorAddress").isString().$_()
    aMask = _$(aMask, "aMask").isString().default(__)

    var su
    if (isDef(aMask)) {
        su = org.apache.commons.net.util.SubnetUtils(aCIDR, aMask)
    } else {
        su = org.apache.commons.net.util.SubnetUtils(aCIDR)
    }

    return su.getInfo().isInRange(aAddr)
}

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

/**
 * <odoc>
 * <key>ow.net.getIP2ASNCache() : Array</key>
 * Retrieves the current IP to ASN cache from the iptoasn.com service returning as an array.
 * </odoc>
 */
OpenWrap.net.prototype.getIP2ASNCache = function() {
    var tmpfs = io.createTempFile("ip2asn", "tsv.gz")
    $rest().get2File(tmpfs, "https://api.iptoasn.com/data/ip2asn-combined.tsv.gz")
    var gzStream = io.readFileGzipStream(tmpfs)
    var outStream = af.newOutputStream()
    ioStreamCopy(outStream, gzStream)
    gzStream.close()

    var str = String(outStream.toString())
    outStream.close()
    var data = $path(str.split("\n"), "[?length(@)>'0'].split(@,'\t').{start:[0],end:[1],asn:[2],area:[3],name:[4]}")
    str = __

    ow.loadFormat()
    data.forEach(r => { 
        r.istart = ow.format.IP2int(r.start)
        r.iend = ow.format.IP2int(r.end)
    })
    return data
}

/**
 * <odoc>
 * <key>ow.net.getIP2ASN(aIP, aIP2ASNCache, aTimeout) : Map</key>
 * Given an aIP will try to retrieve the corresponding ASN information from the aIP2ASNCache (defaults to the one retrieved
 * by ow.net.getIP2ASNCache()). If aIP2ASNCache is not provided it will be retrieved and cached as "ow.net.ip2asn" with aTimeout
 * by default of 24 hours. Returns a map with the ASN information.
 * </odoc>
 */
OpenWrap.net.prototype.getIP2ASN = function(aIP, aIP2ASNCache, aTimeout) {
    _$(aIP, "IP").isString().$_()
    aTimeout = _$(aTimeout, "aTimeout").isNumber().default(1000 * 60 * 60 * 24)
    if (isUnDef(aIP2ASNCache)) {
        $cache("ow.net.ip2asn")
        .ttl(aTimeout)
        .fn(k => ow.net.getIP2ASNCache())
        .create()
        aIP2ASNCache = $cache("ow.net.ip2asn").get({})
    }
    var iip = ow.format.IP2int(ow.net.getHost2IP(aIP))
    var res = aIP2ASNCache.find(r => r.istart <= iip && r.iend >= iip)
    return res
}

/**
 * <odoc>
 * <key>ow.net.createIP2ASNIndex(aFile, aIP2ASNCache, logFn, aDescFile)</key>
 * Creates an ASN index from the aIP2ASNCache (defaults to the one retrieved by ow.net.getIP2ASNCache()) and saves it into aFile.
 * If aIP2ASNCache is not provided it will be retrieved using ow.net.getIP2ASNCache(). The index is saved as a JSON array with the following structure:
 * [ { i: (index), a: (asn), s: (start), e: (end) }, ... ]
 * where i is the index in the original aIP2ASNCache, a is the ASN number, s is the start IP in integer format and e is the end IP in integer format.
 * The aFile is saved as a gzip compressed JSON file. The aDescFile is optional and if provided it will create a descriptive index with the following structure:
 * [ { i: (index), r: (area), n: (name) }, ... ]
 * where i is the index in the original aIP2ASNCache, r is the area and n is the name.
 * The aDescFile is also saved as a gzip compressed JSON file.
 * </odoc>
 */
OpenWrap.net.prototype.createIP2ASNIndex = function(aFile, aIP2ASNCache, logFn, aDescFile) {
    _$(aFile, "aFile").isString().$_()
    logFn = _$(logFn, "logFn").isFunction().default(log)

    var _r
    if (isUnDef(aIP2ASNCache)) {
        logFn("Creating IP2ASN cache...")
        _r = ow.net.getIP2ASNCache()
        logFn("Cache loaded with #" + _r.length)
    } else {
        _r = aIP2ASNCache
        logFn("Using provided IP2ASN cache with #" + _r.length)
    }

    logFn("Creating ASN index...")
    var _aidx = pForEach(_r, (r, i) => ({
        i: i,
        a: Number(r.asn),
        s: r.istart,
        e: r.iend
    }))
    logFn("ASN index created with #" + _aidx.length)

    logFn("Saving into aidx.json.gz")
    var os = io.writeFileGzipStream(aFile)
    ioStreamWriteBytes(os, stringify(_aidx, __, ""))
    os.flush()
    os.close()
    logFn("Created aidx.json.gz with " + io.fileInfo(aFile).size + " bytes")

    if (isDef(aDescFile)) {
        _aidx = __
        logFn("Creating ASN descriptive index...")
        var _aidxd = pForEach(_r, (r, i) => ({
            i: i,
            r: r.area,
            n: r.name
        }))
        logFn("ASN descriptive index created with #" + _aidxd.length)

        logFn("Saving into aidxd.json.gz")
        var os = io.writeFileGzipStream(aDescFile)
        ioStreamWriteBytes(os, stringify(_aidxd, __, ""))
        os.flush()
        os.close()
        logFn("Created " + aDescFile + " with " + io.fileInfo(aDescFile).size + " bytes")
    }
} 

/**
 * <odoc>
 * <key>ow.net.getIP2ASNIndex(aFile) : Array</key>
 * Given aFile will try to retrieve the ASN index from the file.
 * The file is expected to be a gzip compressed JSON file with the following structure (produced with ow.net.createIP2ASNIndex()):
 * [ { i: (index), a: (asn), s: (start), e: (end) }, ... ]
 * where i is the index in the original aIP2ASNCache, a is the ASN number, s is the start IP in integer format and e is the end IP in integer format.
 * Returns an array with the ASN index. Can also be used to retrieve the ASN descriptive index.
 * </odoc>
 */
OpenWrap.net.prototype.getIP2ASNIndex = function(aFile) {
    _$(aFile, "aFile").isString().$_()

    var is = io.readFileGzipStream(aFile)

    var _r = jsonParse(af.fromInputStream2String(is), true)
    is.close()
    return _r
}

/**
 * <odoc>
 * <key>ow.net.asnIndexIP2ASN(aIP, aidx) : Map</key>
 * Given an aIP (or host) will try to retrieve the corresponding ASN information from the aidx (defaults to the one retrieved
 * by ow.net.getIP2ASNIndex()). Returns a map with the ASN information.
 * The aidx is expected to be an array with the following structure:
 * [ { i: (index), a: (asn), s: (start), e: (end) }, ... ]
 * where i is the index in the original aIP2ASNCache, a is the ASN number, s is the start IP in integer format and e is the end IP in integer format.
 * </odoc>
 */
OpenWrap.net.prototype.asnIndexIP2ASN = function(aIP, _aidx) {
    _$(aIP, "aIP").isString().$_()
    _$(_aidx, "_aidx").isArray().$_()

    ow.loadFormat()
    var _t = ow.format.IP2int(ow.net.getHost2IP(aIP))

    return _aidx.find(r => r.s <= _t && r.e >= _t) 
}

/**
 * <odoc>
 * <key>ow.net.asnIndexASN2IP(aASN, aidx) : Map</key>
 * Given an aASN will try to retrieve the corresponding ASN information from the aidx. Returns a map with the ASN information.
 * The aidx is expected to be an array with the following structure:
 * [ { i: (index), a: (asn), s: (start), e: (end) }, ... ]
 * where i is the index in the original aIP2ASNCache, a is the ASN number, s is the start IP in integer format and e is the end IP in integer format.
 * </odoc>
 */
OpenWrap.net.prototype.asnIndexASN2IP = function(aASN, _aidx) {
    _$(aASN, "aASN").isNumber().$_()
    _$(_aidx, "_aidx").isArray().$_()

    return _aidx.find(r => r.a == aASN)
}