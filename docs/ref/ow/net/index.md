# ow.net

[Home](../../index.md) / [All APIs](../../all-apis.md) / [ow](../index.md) / [ow.net](index.md)

<a id="api-ow-net-asnindexasn2ip-0ad12360"></a>

## ow.net.asnIndexASN2IP

### ow.net.asnIndexASN2IP(aASN, aidx) : Map

Given an aASN will try to retrieve the corresponding ASN information from the aidx. Returns a map with the ASN information. The aidx is expected to be an array with the following structure: &#91; &#123; i: (index), a: (asn), s: (start), e: (end) &#125;, ... &#93; where i is the index in the original aIP2ASNCache, a is the ASN number, s is the start IP in integer format and e is the end IP in integer format.

Sources:

- js/owrap.net.js:1080

<a id="api-ow-net-asnindexip2asn-424d33c0"></a>

## ow.net.asnIndexIP2ASN

### ow.net.asnIndexIP2ASN(aIP, aidx) : Map

Given an aIP (or host) will try to retrieve the corresponding ASN information from the aidx (defaults to the one retrieved by ow.net.getIP2ASNIndex()). Returns a map with the ASN information. The aidx is expected to be an array with the following structure: &#91; &#123; i: (index), a: (asn), s: (start), e: (end) &#125;, ... &#93; where i is the index in the original aIP2ASNCache, a is the ASN number, s is the start IP in integer format and e is the end IP in integer format.

Sources:

- js/owrap.net.js:1060

<a id="api-ow-net-createip2asnindex-03f4a334"></a>

## ow.net.createIP2ASNIndex

### ow.net.createIP2ASNIndex(aFile, aIP2ASNCache, logFn, aDescFile)

Creates an ASN index from the aIP2ASNCache (defaults to the one retrieved by ow.net.getIP2ASNCache()) and saves it into aFile. If aIP2ASNCache is not provided it will be retrieved using ow.net.getIP2ASNCache(). The index is saved as a JSON array with the following structure: &#91; &#123; i: (index), a: (asn), s: (start), e: (end) &#125;, ... &#93; where i is the index in the original aIP2ASNCache, a is the ASN number, s is the start IP in integer format and e is the end IP in integer format. The aFile is saved as a gzip compressed JSON file. The aDescFile is optional and if provided it will create a descriptive index with the following structure: &#91; &#123; i: (index), r: (area), n: (name) &#125;, ... &#93; where i is the index in the original aIP2ASNCache, r is the area and n is the name. The aDescFile is also saved as a gzip compressed JSON file.

Sources:

- js/owrap.net.js:978

<a id="api-ow-net-doh-82a3b7e6"></a>

## ow.net.doh

### ow.net.doh(aAddr, aType, aProvider, aCache, aCacheTimeout) : String

Performs a DNS over HTTPs query with aAddr. Optionally you can provide the aType of record (defaults to 'a') and the DNS over HTTPs aProvider between 'google', 'cloudflare', 'nextdns' and 'local' (that doesn't use DoH but fallbacks to  Java's DNS resolver), or a custom DoH endpoint URL. Returns the first IP address found. If aCache is provided (optionally with aCacheTimeout in ms) the results will be cached.

Sources:

- js/owrap.net.js:507

<a id="api-ow-net-getactualtime-82b2c617"></a>

## ow.net.getActualTime

### ow.net.getActualTime(aServer, aTimeout) : Date

Retrieves the current actual time from NTP servers. The current actual time will be returned in a Date. If aServer is provided, it will use that specific server, otherwise it will try multiple public NTP servers in sequence: 'pool.ntp.org', 'time.google.com', 'time-a.nist.gov', 'europe.pool.ntp.org'. aTimeout is optional and defaults to 5000ms.

Sources:

- js/owrap.net.js:29

<a id="api-ow-net-getaddressinfo-cdf3e8dc"></a>

## ow.net.getAddressInfo

### ow.net.getAddressInfo(aAddress) : Map

Given an IPv4 or IPv6 aAddress will return a map with hostname, address and corresponding address flags to determine which type of address it is (is it a private address? is it a loopback? is it a multicast address?)

Sources:

- js/owrap.net.js:812

<a id="api-ow-net-getaddresstype-3e76f664"></a>

## ow.net.getAddressType

### ow.net.getAddressType(aAddress) : Map

Given aAddress tries to return a map with the following flags: isValidAddress, hostname, ipv4, ipv6 and privateAddress

Sources:

- js/owrap.net.js:658

<a id="api-ow-net-getcastoredcertificates-9a9a0fb4"></a>

## ow.net.getCAStoredCertificates

### ow.net.getCAStoredCertificates(aPassword) : Array

Will retrieve a list of aliases, issuer DN, subject DN, expire notBefore and notAfter dates from the current Java "cacerts" file. Optionally aPassword can be provided if different from the default one.

Sources:

- js/owrap.net.js:187

<a id="api-ow-net-getdns-7ce965ea"></a>

## ow.net.getDNS

### ow.net.getDNS(aName, aType, aServer, aExtended) : Object

Given aName will do a DNS search for aType (defaults to "a") optionally using dns server aServer. Returns an object or an array of objects. If aExtended is true it will return a more detailed JSON object.

Sources:

- js/owrap.net.js:439

<a id="api-ow-net-getdoh-dbf7462d"></a>

## ow.net.getDoH

### ow.net.getDoH(aAddr, aType, aProvider) : Array

Performs a DNS over HTTPs query with aAddr. Optionally you can provide the aType of record (defaults to 'a') and the DNS over HTTPs aProvider between 'google', 'cloudflare', 'nextdns' and 'local' (that doesn't use DoH but fallbacks to  Java's DNS resolver). You can also provide aProvider as the URL of a custom DNS over HTTPS endpoint.

Sources:

- js/owrap.net.js:551

<a id="api-ow-net-gethost2ip-cb8af18d"></a>

## ow.net.getHost2IP

### ow.net.getHost2IP(aHost) : String

Tries to resolve aHost to an IP address using the default DNS.

Sources:

- js/owrap.net.js:701

<a id="api-ow-net-gethostaddress-033f6cc7"></a>

## ow.net.getHostAddress

### ow.net.getHostAddress() : String

Returns the current host ip address.

Sources:

- js/owrap.net.js:250

<a id="api-ow-net-gethostname-2c19ea41"></a>

## ow.net.getHostName

### ow.net.getHostName() : String

Returns the current hostname.

Sources:

- js/owrap.net.js:240

<a id="api-ow-net-getip2asn-d9cf5e3b"></a>

## ow.net.getIP2ASN

### ow.net.getIP2ASN(aIP, aIP2ASNCache, aTimeout) : Map

Given an aIP will try to retrieve the corresponding ASN information from the aIP2ASNCache (defaults to the one retrieved by ow.net.getIP2ASNCache()). If aIP2ASNCache is not provided it will be retrieved and cached as "ow.net.ip2asn" with aTimeout by default of 24 hours. Returns a map with the ASN information.

Sources:

- js/owrap.net.js:955

<a id="api-ow-net-getip2asncache-cfd4da89"></a>

## ow.net.getIP2ASNCache

### ow.net.getIP2ASNCache() : Array

Retrieves the current IP to ASN cache from the iptoasn.com service returning as an array.

Sources:

- js/owrap.net.js:928

<a id="api-ow-net-getip2asnindex-69ab0e33"></a>

## ow.net.getIP2ASNIndex

### ow.net.getIP2ASNIndex(aFile) : Array

Given aFile will try to retrieve the ASN index from the file. The file is expected to be a gzip compressed JSON file with the following structure (produced with ow.net.createIP2ASNIndex()): &#91; &#123; i: (index), a: (asn), s: (start), e: (end) &#125;, ... &#93; where i is the index in the original aIP2ASNCache, a is the ASN number, s is the start IP in integer format and e is the end IP in integer format. Returns an array with the ASN index. Can also be used to retrieve the ASN descriptive index.

Sources:

- js/owrap.net.js:1040

<a id="api-ow-net-getip2host-7a81c445"></a>

## ow.net.getIP2Host

### ow.net.getIP2Host(aIP) : String

Tries to reverse DNS aIP to a host address using the default DNS.

Sources:

- js/owrap.net.js:711

<a id="api-ow-net-getjssecastoredcertificates-89ba15d4"></a>

## ow.net.getJSSECAStoredCertificates

### ow.net.getJSSECAStoredCertificates(aPassword) : Array

Will retrieve a list of aliases, issuer DN, subject DN, expire notBefore and notAfter dates from the current Java "jssecacerts" file. Optionally aPassword can be provided if different from the default one.

Sources:

- js/owrap.net.js:198

<a id="api-ow-net-getpublicip-04a2753b"></a>

## ow.net.getPublicIP

### ow.net.getPublicIP(aIPAddress) : Map

Uses the functionality provided by https://ifconfig.co to return a map with the apparent current public ip address, public hostname and a guess of country and city. Please be aware of the request limits of the service (around 1 request per minute).

If aIPAddress is provided it will use the functionality provided by http://ip-api.com (if aIPAddress is a empty string it will use the current public IP address). Please be also aware of non-commercial and request limits of the service (around 45 requests per minute). The details provided by each service might differ depending on how update is each of the services' databases.

Sources:

- js/owrap.net.js:10

<a id="api-ow-net-getreversedoh-b39360ca"></a>

## ow.net.getReverseDoH

### ow.net.getReverseDoH(aIP, aProvider) : Array

Tries to retrieve the reverse DNS of aIP using DNS over HTTPs. Optionally you can choose the aProvider between 'google' and 'cloudflare'.

Sources:

- js/owrap.net.js:635

<a id="api-ow-net-getsslpubliccertificates-c6505914"></a>

## ow.net.getSSLPublicCertificates

### ow.net.getSSLPublicCertificates(aHost, aPort) : Array

Given aHost and aPort for a HTTPs connection it will retrieve the array of peer certificates available. You can retrieve the specific public key by using the method .getPublicKey for each array element. Usually you be interested on the first certificate of the returned array.

Sources:

- js/owrap.net.js:209

<a id="api-ow-net-getstoredcertificates-e163f659"></a>

## ow.net.getStoredCertificates

### ow.net.getStoredCertificates(aStoreFile, aPassword) : Array

Given a Java certificate store (aStoreFile) will retrieve a list of aliases, issuer DN, subject DN, expire notBefore and notAfter dates. Optionally aPassword can be provided if different from the default one.

Sources:

- js/owrap.net.js:154

<a id="api-ow-net-gettlscertificates-ece55899"></a>

## ow.net.getTLSCertificates

### ow.net.getTLSCertificates(aHost, aPort, withJava, aPath, aPass, aSoTimeout) : Array

Tries to retreive the TLS certificates from aHost, aPort (defaults to 443). Optionally if withJava=true the original certificate Java object will also be included. If the CA certificates is in a different location you can provide aPath and the corresponding aPass. Additionally you can specificy aSoTimeout (socket timeout in ms) which defaults to 10s.

Sources:

- js/owrap.net.js:89

<a id="api-ow-net-getwhois-2cbba2b6"></a>

## ow.net.getWhoIs

### ow.net.getWhoIs(aQuery, aInitServer) : Map

Tries to perform a whois aQuery for a domain or an ip address. Optionally you can provide aInitServer (defaults to whois.iana.org)

Sources:

- js/owrap.net.js:864

<a id="api-ow-net-host4url-1bd1cfd1"></a>

## ow.net.host4URL

### ow.net.host4URL(aURL) : String

Given aURL it will return the corresponding host:port.

Sources:

- js/owrap.net.js:260

<a id="api-ow-net-ipv4subnetinrange-7490d3a1"></a>

## ow.net.ipv4SubNetInRange

### ow.net.ipv4SubNetInRange(aTestAddress, aCIDRorAddress, aMask) : boolean

Given IPv4 aTestAddress and a aCIDR or anAddress with aMask will return true if the aTestAddress is part of the subnet represented by aCIDR or aAddress + aMask (false otherwise).

Sources:

- js/owrap.net.js:842

<a id="api-ow-net-ipv4subnetinfo-85b0a655"></a>

## ow.net.ipv4SubNetInfo

### ow.net.ipv4SubNetInfo(aCIDRorAddress, aMask) : Map

Given an IPv4 aCIDR or anAddress with aMask will return a map with the corresponding subnet info including netmask, broadcast address, address count, low &#38; high address, etc...

Sources:

- js/owrap.net.js:781

<a id="api-ow-net-ishost-e9189492"></a>

## ow.net.isHost

### ow.net.isHost(aHost) : boolean

Tries to determine if aHost seems a syntactic valid host.

Sources:

- js/owrap.net.js:331

<a id="api-ow-net-isipv4-26ada1cf"></a>

## ow.net.isIPv4

### ow.net.isIPv4(aIP) : boolean

Tries to determine if aIP is a syntactic valid IPv4.

Sources:

- js/owrap.net.js:282

<a id="api-ow-net-isipv6-bd781b31"></a>

## ow.net.isIPv6

### ow.net.isIPv6(aIP) : boolean

Tries to determine if aIP is a syntactic valid IPv6.

Sources:

- js/owrap.net.js:297

<a id="api-ow-net-isurl-8eaee768"></a>

## ow.net.isURL

### ow.net.isURL(aURL) : boolean

Tries to determine if aURL seems a syntactic valid URL.

Sources:

- js/owrap.net.js:312

<a id="api-ow-net-path4url-c80b054c"></a>

## ow.net.path4URL

### ow.net.path4URL(aURL) : String

Given aURL it will return the corresponding path.

Sources:

- js/owrap.net.js:271

<a id="api-ow-net-sendtcppacket-6b33208b"></a>

## ow.net.sendTCPPacket

### ow.net.sendTCPPacket(aHost, aPort, aMsg, dontWait) : Bytes

Tries to send a string or array of bytes aMsh to aHost and aPort using TCP. If dontWait=true it won't wait for a response.

Sources:

- js/owrap.net.js:750

<a id="api-ow-net-sendudppacket-c3516757"></a>

## ow.net.sendUDPPacket

### ow.net.sendUDPPacket(aHost, aPort, aMsg, dontWait, bufferSize) : Bytes

Tries to send a string or array of bytes aMsh to aHost and aPort using UDP. If dontWait=true it won't wait for a response that is stored in a buffer (where bufferSize = 1024 bytes, by default).

Sources:

- js/owrap.net.js:721

<a id="api-ow-net-testhost-e3971d0c"></a>

## ow.net.testHost

### ow.net.testHost(aAddress, aTimeout) : Map

Uses the java implementation (e.g. usually ICMP ping) for testing reachability to an aAddress. It timeouts after aTimeout (defaults to 4000ms). Returns a map with the "time" spent trying to get an answer from aAddress and a boolean "reachable" with the result.

Sources:

- js/owrap.net.js:346

<a id="api-ow-net-testport-095d54e1"></a>

## ow.net.testPort

### ow.net.testPort(aAddress, aPort, aCustomTimeout) : boolean

Tries to connect to aPort (e.g. 1234) on aAddress (e.g. 1.2.3.4). If the connection is successfull it will disconnect and return true, otherwise it will return false. If aCustomTimeout (in ms) is defined, it will use that value as the timeout instead of the 1,5 seconds by default.

Sources:

- js/owrap.net.js:367

<a id="api-ow-net-testportlatency-50738586"></a>

## ow.net.testPortLatency

### ow.net.testPortLatency(aHost, aPort, aCustomTimeout) : Number

Test establishing a TCP socket connection with aHost on aPort. Optionally aCustomTimeout can be provided (defaults to 60000 ms). The test will be timed and the time in ms will be returned. If returned a time &#60; 0 then an error occurred or the  host:port couldn't be reached.

Sources:

- js/owrap.net.js:388

<a id="api-ow-net-testpublicport-f7f6016b"></a>

## ow.net.testPublicPort

### ow.net.testPublicPort(aPort) : Map

Uses the functionality provided by http://ifconfig.co to return a map with the result of testing if aPort is within public  reach from your apparent current public ip address. Please be aware of the request limits of the service (around 1 request per minute).

Sources:

- js/owrap.net.js:227

<a id="api-ow-net-testurllatency-a819428d"></a>

## ow.net.testURLLatency

### ow.net.testURLLatency(aURL, aCustomTimeout) : Number

Test sending a HTTP(s) GET to aURL. Optionally aCustomTimeout can be provided. The test will be timed and the time in ms will be returned. If returned a time &#60; 0 then an error occurred or the host:port couldn't be reached.

Sources:

- js/owrap.net.js:414

