# ow.java.JMX

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.java](../index.md) / [ow.java.JMX](index.md)

<a id="api-ow-java-jmx-getall-eda332b9"></a>

## ow.java.JMX.getAll

### ow.java.JMX.getAll() : Map

Will query the JMX target for all registered domains, query the registered objects for each domain and returns a combined map of the corresponding values.

Sources:

- js/owrap.java.js:784

<a id="api-ow-java-jmx-getdomains-1f98c901"></a>

## ow.java.JMX.getDomains

### ow.java.JMX.getDomains() : Array

Will query the JMX target for existing domains to be used with ow.java.JMX.queryNames a return the corresponding list.

Sources:

- js/owrap.java.js:803

<a id="api-ow-java-jmx-getjavastd-b04026ea"></a>

## ow.java.JMX.getJavaStd

### ow.java.JMX.getJavaStd() : Map

Will query the JMX target for the "java.lang.&#42;" objects and return the corresponding map.

Sources:

- js/owrap.java.js:814

<a id="api-ow-java-jmx-getobject-fa0d7661"></a>

## ow.java.JMX.getObject

### ow.java.JMX.getObject(anObject) : Map

Given a JMX anObject will find all the corresponding attributes, retrieve their corresponding values and returning in a map. If any errors occurred a map entry "&#95;errors" with an array of errors will be included in the returned map.

Sources:

- js/owrap.java.js:861

<a id="api-ow-java-jmx-getobjects-524b05af"></a>

## ow.java.JMX.getObjects

### ow.java.JMX.getObjects(aObjectName) : Map

Given a JMX domain + name + type or JMX aQuery (similar to the provided to ow.java.JMX.queryNames) will retrieve all objects from each domain, name and type. The returned map will be organized by a map "name" entry with sub-map for each "type".

Sources:

- js/owrap.java.js:824

<a id="api-ow-java-jmx-querynames-ad1bc4f1"></a>

## ow.java.JMX.queryNames

### ow.java.JMX.queryNames(aQuery) : Array

Given aQuery (similar to 'java.lang:&#42;') given a JMX domain it will query the JMX target and return a list of registered domain + name + type ready to be used with ow.java.JMX.getObject.

Sources:

- js/owrap.java.js:769

