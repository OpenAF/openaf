# SNMP & SNMPServer Java Plugins Reference

The `SNMP` and `SNMPServer` plugins provide SNMP (Simple Network Management Protocol) v1, v2c, and v3 client queries (`GET`, `SET`, `WALK`) and embedded SNMP agent / trap listener capabilities based on SNMP4J.

---

## Loading Syntax

```javascript
plugin("SNMP");
var snmp = new SNMP(address, community, timeout, retries, version, securityMap);

plugin("SNMPServer");
// Registers constructor `SNMPd`
var server = new SNMPd(address, sysDesc);
```

---

## SNMP Client API Methods

### `new SNMP(addr, community, timeout, retries, version, securityMap)`
* `addr` *(String)*: Target address (e.g. `"udp:192.168.1.1/161"`).
* `version` *(int)*: `2` (v2c) or `3` (v3).
* `securityMap` *(Object)*: SNMP v3 authentication/privacy configuration (`securityName`, `authProtocol`, `privProtocol`, `authPassphrase`, `privPassphrase`, `engineId`).

| Method | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `get(oid)` | `String` | `Map` | Queries OID and returns `{ "<oid>": "<value>" }`. |
| `trap(oid, sysUpTime, dataArray, inform)` | `String, long, Array, boolean` | `void` | Sends SNMP Trap or Inform PDU. |
| `inform(oid, dataArray)` | `String, Array` | `void` | Sends Inform PDU. |
| `close()` | *none* | `void` | Closes transport. |

---

## SNMP Server API Methods

### `new SNMPd(address, sysDesc)`
Configures SNMP agent listener (e.g. `"udp:0.0.0.0/161"`).

| Method | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `start(community)` | `[String]` | `void` | Starts agent (default community `"public"`). |
| `addOID(oid, callbackFunc)` | `String, Function` | `void` | Registers scalar OID callback `function(oid) { return value; }`. |
| `setOID(oid, callbackFunc)` | `String, Function` | `void` | Updates callback for registered OID. |
| `stop()` | *none* | `void` | Halts agent daemon. |

---

## Practical Code Example

```javascript
// --- SNMP Agent ---
plugin("SNMPServer");
var agent = new SNMPd("udp:127.0.0.1/1161", "OpenAF SNMP Agent");
agent.addOID("1.3.6.1.4.1.9999.1.0", oid => "System OK");
agent.start("public");

// --- SNMP Client ---
plugin("SNMP");
var client = new SNMP("udp:127.0.0.1/1161", "public", 2000, 2, 2);
var res = client.get("1.3.6.1.4.1.9999.1.0");
print("SNMP Value: " + res["1.3.6.1.4.1.9999.1.0"]);
client.close();
agent.stop();
```
