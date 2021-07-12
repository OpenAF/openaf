(function() {
    exports.testSNMP2ClientGet = function() {
        plugin("SNMP");

        var snmp = new SNMP("udp:snmpsim.try.thola.io/161", "public");
        var res = snmp.get("1.3.6.1.2.1.1.3.0");

        ow.test.assert(isString(res["1.3.6.1.2.1.1.3.0"]), true, "Problem getting SNMP v2/v1 (1)");
        ow.test.assert((res["1.3.6.1.2.1.1.3.0"].indexOf(":") > 0), true, "Problem getting SNMP v2/v1 (2)");
    };

    exports.testSNMP2ServerGet = function() {
        // TBC
    };

    exports.testSNMP2ClientTrap = function() {
        plugin("SNMP");

        var snmp = new SNMP("udp:snmpsim.try.thola.io/161", "public");

        snmp.trap("1.3.6.1.4.1.20408.4.1.1.2", [
            { OID: "1.2.3.4.5.6.7.8", type: "s", value: "My error message." }
        ]);
    };

    exports.testSNMP2ServerTrap = function() {
        // TBC
    };

    exports.testSNMP2ClientInform = function() {
        plugin("SNMP");

        var snmp = new SNMP("udp:snmpsim.try.thola.io/161", "public");

        var response = snmp.inform("1.3.6.1.4.1.20408.4.1.1.2", [
            { OID: "1.2.3.4.5.6.7.8", type: "s", value: "My error message." }
        ]);

        ow.test.assert(Number(response.getRequest().getRequestID()) >= 0, true, "Problem inform SNMP (v1/v2)");
    };

    exports.testSNMP2ServerInform = function() {
        // TBC
    };

    exports.testSNMP3ClientGet = function() {
        plugin("SNMP");
        var aTimeout = 3000, aNumberOfRetries = 3;
        var snmp = new SNMP("udp:snmpsim.try.thola.io/161", "public", aTimeout, aNumberOfRetries, 3, {
            engineId      : "8000002a000000000001020304",
            authPassphrase: "authkey1",
            privPassphrase: "privkey1",
            authProtocol  : "MD5",
            privProtocol  : "DES",
            securityName  : "usr-md5-des"
        })
        var res = snmp.get("1.3.6.1.2.1.1.3.0");

        ow.test.assert(isString(res["1.3.6.1.2.1.1.3.0"]), true, "Problem getting SNMP v3 (1)");
        ow.test.assert((res["1.3.6.1.2.1.1.3.0"].indexOf(":") > 0), true, "Problem getting SNMP v3 (2)");
    };

    exports.testSNMP3ServerGet = function() {
        // TBC
    };

    exports.testSNMP3ClientTrap = function() {
        plugin("SNMP");
        var aTimeout = 3000, aNumberOfRetries = 3;
        var snmp = new SNMP("udp:snmpsim.try.thola.io/161", "public", aTimeout, aNumberOfRetries, 3, {
            engineId      : "8000002a000000000001020304",
            authPassphrase: "authkey1",
            privPassphrase: "privkey1",
            authProtocol  : "MD5",
            privProtocol  : "AES128",
            securityName  : "usr-md5-aes"
        });

        snmp.trap("1.3.6.1.4.1.20408.4.1.1.2", [
            { OID: "1.2.3.4.5.6.7.8", type: "s", value: "My error message." }
        ]);
    };

    exports.testSNMP3ServerTrap = function() {
        // TBC
    };

    exports.testSNMP3ClientInform = function() {
        plugin("SNMP");
        var aTimeout = 3000, aNumberOfRetries = 3;
        var snmp = new SNMP("udp:snmpsim.try.thola.io/161", "public", aTimeout, aNumberOfRetries, 3, {
            engineId      : "8000002a000000000001020304",
            authPassphrase: "authkey1",
            privPassphrase: "privkey1",
            authProtocol  : "MD5",
            privProtocol  : "DES",
            securityName  : "usr-md5-des"
        });

        var response = snmp.inform("1.3.6.1.4.1.20408.4.1.1.2", [
            { OID: "1.2.3.4.5.6.7.8", type: "s", value: "My error message." }
        ]);

        ow.test.assert(Number(response.getRequest().getRequestID()) >= 0, true, "Problem inform SNMP (v1/v2)");
    };

    exports.testSNMP3ServerInform = function() {
        // TBC
    };
})();
