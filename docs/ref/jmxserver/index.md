# JMXServer

[Home](../index.md) / [All APIs](../all-apis.md) / [JMXServer](index.md)

<a id="api-jmxserver-jmxserver-79ac414e"></a>

## JMXServer.JMXServer

### JMXServer.JMXServer(aJMXObjectName) : JMXServer

Creates a new JMX server instance for a given default JMX object name (defaults to 'com.openaf:type=Values'.

Sources:

- src/openaf/plugins/JMXServer.java:385

<a id="api-jmxserver-addbean-3b041fc2"></a>

## JMXServer.addBean

### JMXServer.addBean(aAttrJSON, getFunction, setFunction, opsFunction) : number

Adds a JMX bean given a JSON map of the attributes, aAttrJSON, and corresponding types (e.g. '&#91;writable&#93; double',  '&#91;writable&#93; long', '&#91;writable&#93; string', 'operation'). Additionally you must provide a getFunction(aAttrName) that will receive  the name of the attribute and should return the value of the attribute and optionally a setFunction(aAttrName, aNewValue) that will receive the name and value of the attribute and should return the new value of the attribute. You can also provide a opsFunction(operation, arrayOfParams, arrayOfSignatures) (arrayOfParams and return should be strings). Returns the number of attributes or 0 if unsuccessful.

Sources:

- src/openaf/plugins/JMXServer.java:423

<a id="api-jmxserver-addobjectbean-bfd10d55"></a>

## JMXServer.addObjectBean

### JMXServer.addObjectBean(aObjectName, aAttrJSON, getFunction, setFunction, opsFunction) : number

Equivalent to JMXServer.addBean but enables you to add a JMX bean a different JMX object name (aObjectName) given  a JSON map of the attributes, aAttrJSON, and corresponding types (e.g. '&#91;writable&#93; double',  '&#91;writable&#93; long', '&#91;writable&#93; string'). Additionally you must provide a getFunction(aAttrName) that will receive  the name of the attribute and should return the value of the attribute and optionally a setFunction(aAttrName, aNewValue) that will receive the name and value of the attribute and should return the new value of the attribute. You can also provide a opsFunction(operation, arrayOfParams, arrayOfSignatures) (arrayOfParams and return should be strings). Returns the number of attributes or 0 if unsuccessful.

Sources:

- src/openaf/plugins/JMXServer.java:446

<a id="api-jmxserver-start-2262ceba"></a>

## JMXServer.start

### JMXServer.start(aPort, notLocal)

Starts the JMX server on the given aPort. You should use the addBean function after starting the server. You can optionally indicate that the server can be accessed from other hosts other than the local (NOT ADVISABLE).

Sources:

- src/openaf/plugins/JMXServer.java:400

<a id="api-jmxserver-stop-d7a76ece"></a>

## JMXServer.stop

### JMXServer.stop()

Stop the JMX server.

Sources:

- src/openaf/plugins/JMXServer.java:412

