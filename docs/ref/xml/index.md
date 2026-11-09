# XML

[Home](../index.md) / [All APIs](../all-apis.md) / [XML](index.md)

<a id="api-xml-xml-512498d5"></a>

## XML.XML

### XML.XML(aXML) : XML

Creates a XML object instance. You can provide a string representation of an XML to instantiate the internal representation. NOTE: This plugin uses a DOM parser (all XML will be read into memory).

Sources:

- src/openaf/plugins/XML.java:57

<a id="api-xml-doc-a26ab8bf"></a>

## XML.doc

### XML.doc() : Document

Returns the org.w3c.dom.Document object with the internal representation.

Sources:

- src/openaf/plugins/XML.java:89

<a id="api-xml-find-ba871cf9"></a>

## XML.find

### XML.find(aXPathQuery) : Node

Returns an org.w3c.dom.Node object from the XPathQuery provided.

Sources:

- src/openaf/plugins/XML.java:114

<a id="api-xml-findall-5d4c6d76"></a>

## XML.findAll

### XML.findAll(aXPathQuery) : NodeList

Returns a org.w3c.dom.NodeList object given the XPathQuery provided.

Sources:

- src/openaf/plugins/XML.java:125

<a id="api-xml-from-8510f465"></a>

## XML.from

### XML.from(aXPathQuery) : Object

Returns an XMLBuilder2 object from the XPathQuery provided.

Sources:

- src/openaf/plugins/XML.java:101

<a id="api-xml-fromnodes2xml-a485347b"></a>

## XML.fromNodes2XML

### XML.fromNodes2XML(nodes) : Object

Given a Node (result of XML.find) or NodeList (result of XML.findAll) will return the corresponding representation in a E4X object.

Sources:

- src/openaf/plugins/XML.java:136

<a id="api-xml-get-17339197"></a>

## XML.get

### XML.get(aXPathQuery) : String

Returns the string value for the given XPathQuery provided.

Sources:

- src/openaf/plugins/XML.java:187

<a id="api-xml-tonativexml-3695e0c2"></a>

## XML.toNativeXML

### XML.toNativeXML() : Object

Returns an E4X representation.

Sources:

- src/openaf/plugins/XML.java:307

<a id="api-xml-w-490d5677"></a>

## XML.w

### XML.w() : String

Returns the internal representation into a XML string.

Sources:

- src/openaf/plugins/XML.java:258

<a id="api-xml-x-e555d621"></a>

## XML.x

### XML.x(aRoot) : Object

Starts a XMLBuilder2 object given a root element string. This code:

```javascript
plugin("XML");
plugin("Beautifiers");
var xml = new XML();
xml.x("test")
 .e("test1").a("status", "ok").a("language", "javascript")
  .e("path").a("type", "sharepath")
   .t("\\\\machine\\share\\test1")
  .up()
 .up()
 .e("test2").a("status", "ongoing").a("language", "python")
  .e("path").a("type", "URL")
   .t("http://some.url/test2");

print(beautify.xml(xml.w()));

var nodes = xml.findAll("/test/*");
for(var i = 0; i < nodes.getLength(); i++) {
  var name = nodes.item(i).getNodeName();
   var status = nodes.item(i).getAttributes().getNamedItem("status").getNodeValue();
   //var value = notes.item(i).getTextContent();
   print("name = " + name +
	  "; status = " + status + "; " +
	  "; " + xml.get("//" + name + "/path/@type") +
       " = " + xml.get("//" + name + "/path"));
}
```

will generate the following output:

```text
<test>
   <test1 language="javascript" status="ok">
       <path type="sharepath">\\machine\share\test1</path>
   </test1>
   <test2 language="python" status="ongoing">
      <path type="URL">http://some.url/test2</path>
   </test2>
</test>
name = test1; status = ok; ; sharepath = \\machine\share\test1
name = test2; status = ongoing; ; URL = http://some.url/test2
```

Sources:

- src/openaf/plugins/XML.java:198

