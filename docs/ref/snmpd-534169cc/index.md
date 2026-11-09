# SNMPd

[Home](../index.md) / [All APIs](../all-apis.md) / [SNMPd](index.md)

<a id="api-snmpd-snmpd-7ea75521"></a>

## SNMPd.SNMPd

### SNMPd.SNMPd(anAddress, aSysDesc) : SNMPd

Prepares a SNMP server listening on the given anAddress (e.g. udp:1.2.3.4/161). Optionally you can also provide a system description (aSysDesc).

Sources:

- src/openaf/plugins/SNMPServer.java:247

<a id="api-snmpd-setoid-65a6aa03"></a>

## SNMPd.setOID

### SNMPd.setOID(aOID, aFunction)

Changes the callback for a specific OID (should end in .0). The call back aFunction receives the aOID as a parameter.

Sources:

- src/openaf/plugins/SNMPServer.java:308

<a id="api-snmpd-start-738895a8"></a>

## SNMPd.start

### SNMPd.start(aCommunity)

Starts the SNMP server given a community name. If no community is provided, public is assumed.

Sources:

- src/openaf/plugins/SNMPServer.java:264

<a id="api-snmpd-stop-c5bc303f"></a>

## SNMPd.stop

### SNMPd.stop()

Stops the SNMP server.

Sources:

- src/openaf/plugins/SNMPServer.java:282

