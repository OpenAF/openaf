# JMX & JMXServer Java Plugins Reference

The `JMX` and `JMXServer` plugins provide JMX (Java Management Extensions) client and embedded server capabilities for monitoring remote JVM MBeans and exposing metrics.

---

## Loading Syntax

```javascript
plugin("JMX");
var jmxClient = new JMX(url, login, password, provider);

plugin("JMXServer");
var jmxServer = new JMXServer(defaultObjectName);
```

---

## JMX Client API Methods

### `new JMX(url, login, password, provider)`
Connects to a remote JMX RMI server or local process.

| Method | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `getObject(objectName)` | `String` | `JMXObject` | Returns `JMXObject` wrapper to inspect MBeans. |
| `JMX.getLocals()` | *none* | `Map` | *(Static)* Discovers all local JVM process IDs and names. |
| `JMX.attach2Local(pid)` | `String` | `Map` | *(Static)* Attaches to local Java process dynamically. |

### `JMXObject` Wrapper Methods
* `jmxObj.get(attributeName, usingReflection)`: Reads MBean attribute (supports nested reflection with `::`).
* `jmxObj.set(attributeName, value)`: Sets MBean attribute value.
* `jmxObj.exec(operationName, paramsArray, sigsArray)`: Invokes MBean operation.
* `jmxObj.getAttributes()`: Returns map of available attributes and operations.

---

## JMX Server API Methods

### `new JMXServer(defaultObjectName)`
Instantiates an embedded JMX server.

| Method | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `start(port, notLocal)` | `int, boolean` | `void` | Starts RMI registry and JMX Connector (`notLocal = true` allows remote access). |
| `stop()` | *none* | `void` | Stops JMX server. |
| `addBean(attrsMap, getFunc, setFunc, opsFunc)` | `Map, Func, Func, Func` | `void` | Registers MBean under default object name. |
| `addObjectBean(name, attrsMap, getFunc, setFunc, opsFunc)` | `String, Map, Func, Func, Func` | `void` | Registers MBean under custom `ObjectName`. |

---

## Practical Code Example

```javascript
// --- JMX Server ---
plugin("JMXServer");
var server = new JMXServer("com.openaf:type=AppMetrics");
server.start(9999, false);

var state = { hits: 100, status: "OK" };
server.addBean(
  {
    "hits": "writable long",
    "status": "string",
    "reset": "operation"
  },
  attr => state[attr],
  (attr, val) => { state[attr] = val; return val; },
  (op, params, sigs) => { if (op == "reset") { state.hits = 0; return "Reset OK"; } }
);

// --- JMX Client ---
plugin("JMX");
var client = new JMX("service:jmx:rmi:///jndi/rmi://127.0.0.1:9999/jmxrmi");
var bean = client.getObject("com.openaf:type=AppMetrics");
print("Hits: " + bean.get("hits"));
bean.exec("reset", [], []);
```
