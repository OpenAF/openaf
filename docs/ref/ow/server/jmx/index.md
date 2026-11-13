# ow.server.jmx

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.server](../index.md) / [ow.server.jmx](index.md)

<a id="api-ow-server-jmx-call-aa33b716"></a>

## ow.server.jmx.call

### ow.server.jmx.call(aJMXObject, objName, aOperation, param1, ...) : value

Invokes `aOperation` on the object `objName` using `aJMXObject` connected to a server using `ow.server.jmx.serverExec`. Optionally
you can provide extra arguments to be passed to the jmx remote operation. Example (based on `ow.server.jmx.serverExec`):

```javascript
var jmx = ow.loadServer().jmx.localConnect("12345");
ow.server.jmx.call(jmx, "com.openaf:type=server", "increment"); // 1
ow.server.jmx.call(jmx, "com.openaf:type=server", "resetTo", 10); // 10
```

Sources:

- js/owrap.server.js:309

<a id="api-ow-server-jmx-get-f78ad654"></a>

## ow.server.jmx.get

### ow.server.jmx.get(aJMXObject, objName, aProperty) : value

Returns the current value of aProperty on the object objName using aJMXObject connected to a JMX server.

Sources:

- js/owrap.server.js:330

<a id="api-ow-server-jmx-localconnect-c5edb228"></a>

## ow.server.jmx.localConnect

### ow.server.jmx.localConnect(aPid) : JMX

Tries to connect with a local aPid via JMX and returns a JMX plugin object instance. If no aPid is provided it will try to retrieve the current process pid and connect to it.

Sources:

- js/owrap.server.js:264

<a id="api-ow-server-jmx-serverexec-58a45ce5"></a>

## ow.server.jmx.serverExec

### ow.server.jmx.serverExec(aParamsArray, aFunction)

Helper function to be used with JMXServers. Receives `aParamsArray` passed on the JMX bean operations handling function
and will call `aFunction` passing the parameters as arguments and converting the returned result into a JSON string to
be transmitted to the calling JMX client. Example:

```javascript
plugin("JMX");
var jmxs = new JMXServer("com.openaf:type=server");
jmxs.start();

var c = 0;
jmxs.addBean({"count": "long", "increment": "operation", "resetTo": "operation"},
  function(key) { if (key == "count") return c; },
  function(key, value) { if (key == "count") c = value; },
  function(op, params) { switch(op) {
     case "increment": return ow.server.jmx.serverExec(params, function() { return ++c; });
     case "resetTo"  : return ow.server.jmx.serverExec(params, function(v) { c = v; });
     }
  }
);
```

Sources:

- js/owrap.server.js:277

<a id="api-ow-server-jmx-set-ee33bc2d"></a>

## ow.server.jmx.set

### ow.server.jmx.set(aJMXObject, objName, aProperty, aNewValue)

Sets aProperty with the value aNewValue on the object objName using aJMXObject connected to a JMX server.

Sources:

- js/owrap.server.js:341

