# JMX

[Home](../index.md) / [All APIs](../all-apis.md) / [JMX](index.md)

<a id="api-jmx-jmx-342800c6"></a>

## JMX.JMX

### JMX.JMX(aURL, aLogin, aPassword, aProvider) : JMX

Creates an instance to connect to `aURL` (e.g. service:jmx:rmi:///jndi/rmi://127.0.0.1:12345/jmxrmi). If needed `aLogin`
and `aPassword` can be provided. `aProvider` can also be specified to access custom MX bean classes (e.g. WebLogic application servers).
Example:

```javascript
var jmx = new JMX("service:jmx:rmi:///jndi/rmi://127.0.0.1:12345/jmxrmi");
```

Sources:

- src/openaf/plugins/JMX.java:76

<a id="api-jmx-attach2local-e62801ed"></a>

## JMX.attach2Local

### JMX.attach2Local(aId) : Object

Establishes a connection with a local Java process given the aId provided by JMX.getLocals() returning an URL to establish a JMX connection, a list of System environment variables and a Agent describing the Java Management Agent activated on the local Java process.

Sources:

- src/openaf/plugins/JMX.java:332

<a id="api-jmx-getlocals-6f389a46"></a>

## JMX.getLocals

### JMX.getLocals() : Object

Returns a Locals map with an id and name of each Java process detected locally. To be used with JMX.attach2Local().

Sources:

- src/openaf/plugins/JMX.java:303

<a id="api-jmx-getobject-49332f7d"></a>

## JMX.getObject

### JMX.getObject(aObjName) : Object

Obtains a bean `aObject` (e.g. `aObjName` = "com.openaf:type=Values").
Example:

```javascript
jmx.getObject("com.openaf:type=Values");
```

Sources:

- src/openaf/plugins/JMX.java:280

