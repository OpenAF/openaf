# SNMPD

[Home](../index.md) / [All APIs](../all-apis.md) / [SNMPD](index.md)

<a id="api-snmpd-addoid-707f80b2"></a>

## SNMPD.addOID

### SNMPD.addOID(aOID, aFunction)

Adds a callback when the specified OID (should end in .0) gets look up. The call back aFunction receives the aOID as a parameter. See more: http://www.jitendrazaa.com/blog/java/snmp/creating-snmp-agent-server-in-java-using-snmp4j/

Sources:

- src/openaf/plugins/SNMPServer.java:293

