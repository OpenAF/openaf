package openaf.plugins;

import java.io.IOException;

import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.transform.stream.StreamResult;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;
import org.mozilla.javascript.xml.XMLObject;
import org.mozilla.javascript.NativeJavaObject;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import java.io.StringWriter;

import openaf.AFCmdBase;
import com.jamesmurty.utils.XMLBuilder2;

import java.lang.String;

/**
 * 
 * @author Nuno Aguiar
 *
 */
public class XML extends ScriptableObject {

	/**
	 * 
	 */
	private static final long serialVersionUID = 533470149211177787L;
	protected Document document; 
	protected XMLBuilder2 xmlbuilder;

	/**
	 * 
	 */
	@Override
	public String getClassName() {
		return "XML";
	}

	/**
	 * <odoc>
	 * <key>XML.XML(aXML) : XML</key>
	 * Creates a XML object instance. You can provide a string representation of an XML to instantiate the internal representation.
	 * NOTE: This plugin uses a DOM parser (all XML will be read into memory).
	 * </odoc>
	 */
	@JSConstructor
	public void newXML(Object oxml) throws ParserConfigurationException, SAXException, IOException, ClassNotFoundException, InstantiationException, IllegalAccessException, ClassCastException {
		String xml = "";
		
		if (oxml instanceof byte[]) {
			xml = new String((byte[]) oxml);
		} else {
			if (oxml instanceof XMLObject) {
				xml = ((String) (ScriptableObject.callMethod((XMLObject) oxml, "toXMLString", new Object[0])));
			} else {
				if (oxml instanceof Undefined) {
					
				} else {
					xml = (String) oxml;
				}
			}
		}
		
		if (xml != null && xml.length() > 0 && !xml.equals("undefined")) { 
			xmlbuilder = XMLBuilder2.parse(xml);
		} else {
			xmlbuilder = XMLBuilder2.create("root");
		}
	}
	
	/**
	 * <odoc>
	 * <key>XML.doc() : Document</key>
	 * Returns the org.w3c.dom.Document object with the internal representation.
	 * </odoc>
	 */
	@JSFunction
	public Document doc() {
//		return document;
		return xmlbuilder.getDocument();
	}
	
	/**
	 * <odoc>
	 * <key>XML.from(aXPathQuery) : Object</key>
	 * Returns an XMLBuilder2 object from the XPathQuery provided.
	 * </odoc>
	 */
	@JSFunction
	public XMLBuilder2 from(String query) throws XPathExpressionException {
//		XPath xpath = XPathFactory.newInstance().newXPath();
//		return (NodeList) xpath.evaluate(query, document, XPathConstants.NODESET);
		return xmlbuilder.xpathFind(query);
	}
	
	/**
	 * <odoc>
	 * <key>XML.find(aXPathQuery) : Node</key>
	 * Returns an org.w3c.dom.Node object from the XPathQuery provided.
	 * </odoc>
	 */
	@JSFunction
	public Node find(String query) {
		return (Node) xmlbuilder.xpathQuery(query, XPathConstants.NODE);
	}
	
	/**
	 * <odoc>
	 * <key>XML.findAll(aXPathQuery) : NodeList</key>
	 * Returns a org.w3c.dom.NodeList object given the XPathQuery provided.
	 * </odoc>
	 */
	@JSFunction
	public NodeList findAll(String query) {
		return (NodeList) xmlbuilder.xpathQuery(query, XPathConstants.NODESET);
	}
	
	/**
	 * <odoc>
	 * <key>XML.fromNodes2XML(nodes) : Object</key>
	 * Given a Node (result of XML.find) or NodeList (result of XML.findAll) will return the corresponding representation in a E4X object.
	 * </odoc>
	 */
	@JSFunction
	public Object fromNodes2XML(Object nodes) throws TransformerException {
		DOMSource source = new DOMSource();
		StringWriter writer = new StringWriter();
		StreamResult result = new StreamResult(writer);
		Transformer transformer = TransformerFactory.newInstance().newTransformer();
		transformer.setOutputProperty(javax.xml.transform.OutputKeys.OMIT_XML_DECLARATION, "yes");

		if (nodes instanceof NativeJavaObject) nodes = ((NativeJavaObject) nodes).unwrap();
		if (nodes instanceof NodeList) {
			for(int i = 0; i < ((NodeList) nodes).getLength(); ++i) {
				source.setNode(((NodeList) nodes).item(i));
				transformer.transform(source, result);
			}
		} else {
			if (nodes instanceof Node) {
				source.setNode(((Node) nodes));
				transformer.transform(source, result);
			}
		}

		Context cx = (Context) AFCmdBase.jse.enterContext();
		Object ret = cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope(), "XMLList", new Object[] { 
				writer.toString()
			});
		AFCmdBase.jse.exitContext();
		return ret;
	}

	/**
	 * <odoc>
	 * <key>XML.get(aXPathQuery) : String</key>
	 * Returns the string value for the given XPathQuery provided.
	 * </odoc>
	 */
	@JSFunction
	public String get(String query) {
		return (String) xmlbuilder.xpathQuery(query, XPathConstants.STRING);
	}
	
	/**
	 * <odoc>
	 * <key>XML.x(aRoot) : Object</key>
	 * Starts a XMLBuilder2 object given a root element string. This code:\
	 * \
	 * plugin("XML");\
	 * plugin("Beautifiers");\
	 * var xml = new XML();\
	 * xml.x("test")\
     *  .e("test1").a("status", "ok").a("language", "javascript")\
     *   .e("path").a("type", "sharepath")\
     *    .t("\\\\machine\\share\\test1")\
     *   .up()\
     *  .up()\
     *  .e("test2").a("status", "ongoing").a("language", "python")\
     *   .e("path").a("type", "URL")\
     *    .t("http://some.url/test2");\
     * \ 
     * print(beautify.xml(xml.w()));\
     * \ 
     * var nodes = xml.findAll("/test/*");\
     * for(var i = 0; i &lt; nodes.getLength(); i++) {\
     *	  var name = nodes.item(i).getNodeName();\
     *    var status = nodes.item(i).getAttributes().getNamedItem("status").getNodeValue();\
	 *    //var value = notes.item(i).getTextContent();\
	 *    print("name = " + name + \
     *		  "; status = " + status + "; " + \
     *		  "; " + xml.get("//" + name + "/path/@type") + \
     *        " = " + xml.get("//" + name + "/path"));\
     * }\
     * \
     * will generate the following output:\
     * \
     * &lt;test&gt;\
     *    &lt;test1 language="javascript" status="ok"&gt;\
     *        &lt;path type="sharepath"&gt;\\machine\share\test1&lt;/path&gt;\
     *    &lt;/test1&gt;\
     *    &lt;test2 language="python" status="ongoing"&gt;\
     *       &lt;path type="URL"&gt;http://some.url/test2&lt;/path&gt;\
     *    &lt;/test2&gt;\
     * &lt;/test&gt;\
     * name = test1; status = ok; ; sharepath = \\machine\share\test1\
     * name = test2; status = ongoing; ; URL = http://some.url/test2\
	 * </odoc>
	 */
	@JSFunction
	public XMLBuilder2 x(String root) {
		if (!root.equals("undefined") && root != null) {
			xmlbuilder = XMLBuilder2.create(root);
		}
	
		return xmlbuilder;
	}
	
	/**
	 * <odoc>
	 * <key>XML.w() : String</key>
	 * Returns the internal representation into a XML string.
	 * </odoc>
	 */
	@JSFunction
	public String w() throws TransformerException {
		return xmlbuilder.asString();
	}
	
	/**
	 * 
	 * @param d
	 * @return
	 * @throws ClassNotFoundException
	 * @throws InstantiationException
	 * @throws IllegalAccessException
	 * @throws ClassCastException
	 */
//	@JSFunction
//	public String fromDoc2s(Object d) throws ClassNotFoundException, InstantiationException, IllegalAccessException, ClassCastException {
//		//if (d instanceof Document) {
////			DOMImplementationRegistry registry = DOMImplementationRegistry.newInstance();
////			
////			DOMImplementationLS impl = (DOMImplementationLS)registry.getDOMImplementation("LS");
////			
////			LSSerializer writer = impl.createLSSerializer(); 
////			return writer.writeToString((Document) d);
//		//} 
//		
//		//if (d instanceof Node) {
//		return XmlUtils.docToString((Node) d);
//		//}
//		
//		//return "";
//	}
//	
//	/**
//	 * 
//	 * @param xml
//	 * @return
//	 * @throws XmlException 
//	 */
//	@JSFunction
//	public Object fromS2Doc(String xml) throws XmlException {
//		return XmlUtils.stringToDoc(xml);
//	}
//	
	/**
	 * <odoc>
	 * <key>XML.toNativeXML() : Object</key>
	 * Returns an E4X representation.
	 * </odoc>
	 */
	@JSFunction
	public Object toNativeXML() throws TransformerException {
		Context cx = (Context) AFCmdBase.jse.enterContext();
		Object ret = cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope(), "XMLList", new Object[] { 
				w()
			});
		AFCmdBase.jse.exitContext();
		return ret;
	}
}
