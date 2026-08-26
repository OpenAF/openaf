# XML Java Plugin Reference

The `XML` plugin provides XML DOM parsing, XPath evaluations, fluent XML building (`com.jamesmurty.utils.XMLBuilder2`), and Rhino E4X native XML bridging.

---

## Loading Syntax

```javascript
plugin("XML");
var xml = new XML(xmlStringOrBytes);
```

---

## API Methods

| Method | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `x(rootTag)` | `String` | `XMLBuilder2` | Starts/returns fluent XML builder instance. |
| `w()` | *none* | `String` | Serializes XML DOM to string. |
| `get(xpathQuery)` | `String` | `String` | Evaluates XPath expression returning string value. |
| `find(xpathQuery)` | `String` | `Node` | Evaluates XPath returning single W3C DOM Node. |
| `findAll(xpathQuery)` | `String` | `NodeList` | Evaluates XPath returning DOM NodeList. |
| `from(xpathQuery)` | `String` | `XMLBuilder2` | Returns `XMLBuilder2` instance rooted at XPath match. |
| `doc()` | *none* | `Document` | Returns underlying W3C DOM `Document` object. |
| `fromNodes2XML(nodes)` | `Node \| NodeList` | `XMLList` | Converts DOM Node or NodeList into Rhino E4X `XMLList`. |
| `toNativeXML()` | *none* | `XMLList` | Converts full XML document into Rhino E4X `XMLList` object. |

---

## Practical Code Example

```javascript
plugin("XML");
plugin("Beautifiers");

// Fluent XML Builder
var xml = new XML();
xml.x("config")
   .e("database").a("type", "postgresql")
     .e("host").t("localhost").up()
     .e("port").t("5432").up()
   .up()
   .e("logging").a("level", "DEBUG");

print(beautify.xml(xml.w()));

// XPath Querying
var dbType = xml.get("//database/@type"); // "postgresql"
var host   = xml.get("//database/host");  // "localhost"

// Conversion to E4X Native XML
var e4x = xml.toNativeXML();
print("Host from E4X: " + e4x.database.host);
```
