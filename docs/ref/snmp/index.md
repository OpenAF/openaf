# SNMP

[Home](../index.md) / [All APIs](../all-apis.md) / [SNMP](index.md)

<a id="api-snmp-snmp-d350dfad"></a>

## SNMP.SNMP

### SNMP.SNMP(anAddress, aCommunity, aTimeout, retries, version, securityMap)

Tries to establish a SNMP connection to the given address (`anAddress` in the form of udp:x.x.x.x/port) of a specific community (`aCommunity` (e.g public))
with a provided timeout (`aTimeout`) and number of `retries`. You can also specify the `version` (2 or 3). For `version` 3
you can also provide a `securityMap` with the following entries:

- `securityName` (String)
- `authProtocol` (String) HMAC128SHA224, HMAC192SHA256, HMAC256SHA384, HMAC384SHA512, MD5, SHA
- `privProtocol` (String) 3DES, AES128, AES192, AES256, DES
- `authPassphrase` (String)
- `privPassphrase` (String)
- `engineId` (String) (in hex format only)

Sources:

- src/openaf/plugins/SNMP.java:84

<a id="api-snmp-close-47398c7b"></a>

## SNMP.close

### SNMP.close()

Closes the current connection and object.

Sources:

- src/openaf/plugins/SNMP.java:194

<a id="api-snmp-get-a6511f36"></a>

## SNMP.get

### SNMP.get(aOID) : Object

Gets a value for the provided aOID (expects value to be string or convertible to string).

Sources:

- src/openaf/plugins/SNMP.java:309

<a id="api-snmp-getjavaobject-e7d02134"></a>

## SNMP.getJavaObject

### SNMP.getJavaObject() : JavaObject

Returns the current internal Java object being used.

Sources:

- src/openaf/plugins/SNMP.java:210

<a id="api-snmp-inform-5a2d470d"></a>

## SNMP.inform

### SNMP.inform(aOID, aDataArray)

Tries to send an inform based on aOID and using aDataArray where each element should be a map with oid, type (i - integer, u - unsigned, c - counter32, s - string, x - hex string, d - decimal string, n - nullobj, o - objid, t - timeticks, a - ipaddress,) and value.

Sources:

- src/openaf/plugins/SNMP.java:430

<a id="api-snmp-start-bff93e09"></a>

## SNMP.start

### SNMP.start()

Starts the client connection (usually already invoked by the SNMP constructor, so there shouldn't be a need to invoke it).

Sources:

- src/openaf/plugins/SNMP.java:163

<a id="api-snmp-trap-0cb3c72c"></a>

## SNMP.trap

### SNMP.trap(aOID,aSysUpTime,  aDataArray, shouldInform)

Tries to send a trap based on aOID, an aSysUpTime and using aDataArray where each element should be a map with oid, type (i - integer, u - unsigned, c - counter32, s - string, x - hex string, d - decimal string, n - nullobj, o - objid, t - timeticks, a - ipaddress,) and value. Optionally you can determine if shouldInform instead of sending the trap.

Sources:

- src/openaf/plugins/SNMP.java:331

