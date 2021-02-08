plugin("SNMPServer");
print("Start");
var s = new SNMPd("udp:0.0.0.0/11161", "my system");
print("Set 1.3.6.1.4.1.32437.1.5.1.4.2.0...");
s.addOID("1.3.6.1.4.1.32437.1.5.1.4.2.0", function(oid) {
  print("oid = " + oid);
  var res = "n/a";
  switch(oid) {
  case "1.3.6.1.4.1.32437.1.5.1.4.2.0" : res = "zero"; break;
  case "1.3.6.1.4.1.32437.1.5.1.4.2.1" : res = "uno"; break;
  case "1.3.6.1.4.1.32437.1.5.1.4.2.2" : res = "due"; break;
  case "1.3.6.1.4.1.32437.1.5.1.4.2.3" : res = "trie"; break;
  }
  return res;
});
print("really start...");
s.addUser("agent5", "sha", "authpass", "des", "privpass");
s.start();
print("Ready");
/*
plugin("SNMP");
var aTimeout = 3000, aNumberOfRetries = 3;
var snmp = new SNMP("udp:snmpsim.try.thola.io/161", "public", aTimeout, aNumberOfRetries, 3, {
    engineId      : "8000000001020304",
    authPassphrase: "authkey1",
    privPassphrase: "privkey1",
    authProtocol  : "MD5",
    privProtocol  : "DES",
    securityName  : "usr-md5-des"
});
sprint( snmp.get("1.3.6.1.2.1.1.3.0") );
*/
plugin("SNMP");
print("Client connect");
//var snmp = new SNMP("udp:127.0.0.1/11161", "public");
var aTimeout = 3000, aNumberOfRetries = 3;
var snmp = new SNMP("udp:127.0.0.1/11161", "public", aTimeout, aNumberOfRetries, 3, {
    engineId      : String(s.getJavaAgent().getMPv3().getID()),
    authPassphrase: "authpass",
    privPassphrase: "privpass",
    authProtocol  : "SHA",
    privProtocol  : "DES",
    securityName  : "agent5"
});
print("Client get");
var oo = "1.3.6.1.4.1.32437.1.5.1.4.2.0";
print("Get " + oo);
sprint( snmp.get(oo) );