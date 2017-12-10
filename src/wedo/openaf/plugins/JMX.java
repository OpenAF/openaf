package wedo.openaf.plugins;

import java.io.File;
import java.io.IOException;
import java.io.Serializable;
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Properties;
import java.util.concurrent.ConcurrentHashMap;

import javax.management.Attribute;
import javax.management.AttributeNotFoundException;
import javax.management.InstanceNotFoundException;
import javax.management.IntrospectionException;
import javax.management.InvalidAttributeValueException;
import javax.management.MBeanException;
import javax.management.MBeanInfo;
import javax.management.MBeanServerConnection;
import javax.management.MalformedObjectNameException;
import javax.management.ObjectName;
import javax.management.ReflectionException;
import javax.management.remote.JMXConnector;
import javax.management.remote.JMXConnectorFactory;
import javax.management.remote.JMXServiceURL;

import jodd.util.ClassLoaderUtil;

import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;

import com.sun.tools.attach.AgentInitializationException;
import com.sun.tools.attach.AgentLoadException;
import com.sun.tools.attach.AttachNotSupportedException;
import com.sun.tools.attach.VirtualMachine;
import com.sun.tools.attach.VirtualMachineDescriptor;

import wedo.openaf.AFBase;
import wedo.openaf.AFCmdBase;
import wedo.openaf.SimpleLog;
import wedo.openaf.SimpleLog.logtype;

/**
 * OpenAF plugin to access remote beans through JMX
 * 
 * @author Nuno Aguiar
 *
 */
public class JMX extends ScriptableObject {

	/**
	 * 
	 */
	public static final java.lang.String CREDENTIALS_LOGIN_KEY = "login";
	public static final java.lang.String CREDENTIALS_PASSWORD_KEY = "password";
	private static final long serialVersionUID = 2794123619715765456L;
	protected JMXServiceURL serviceUrl = null;
	protected JMXConnector jmxCon = null;
	protected MBeanServerConnection mbeanCon = null;
	protected String provider = null;

	@Override
	public String getClassName() {
		return "JMX";
	}

	/**
	 * <odoc>
	 * <key>JMX.JMX(aURL, aLogin, aPassword, aProvider) : JMX</key>
	 * Creates an instance to connect to aURL (e.g. service:jmx:rmi:///jndi/rmi://127.0.0.1:12345/jmxrmi). If needed aLogin
	 * and aPassword can be provided. aProvider can also be specified to access custom MX bean classes (e.g. WebLogic application servers).\
	 * Example:\
	 * \
	 * var jmx = new JMX("service:jmx:rmi:///jndi/rmi://127.0.0.1:12345/jmxrmi");\
	 * \
	 * </odoc>
	 * @throws IllegalAccessException 
	 * @throws InstantiationException 
	 */
	@JSConstructor
	public void newJMX(Object url, Object login, Object password, Object provider) throws IOException, InstantiationException, IllegalAccessException {
		if (url != null && url instanceof String) {
			serviceUrl = new JMXServiceURL((String) url);
		
			ConcurrentHashMap<String, Serializable> env = new ConcurrentHashMap<String, Serializable>();
			
			if ( (login != null && login instanceof String) &&
				 (password != null && password instanceof String) ) {
				env.put(JMXConnector.CREDENTIALS, new String[] {(String) login, AFCmdBase.afc.dIP((String) password)});
			}
			
			if (provider != null && provider instanceof String) {
				this.provider = (String) provider;
				env.put(JMXConnectorFactory.PROTOCOL_PROVIDER_PACKAGES, this.provider);
			}
			
			jmxCon = JMXConnectorFactory.connect(serviceUrl, env);
			mbeanCon = jmxCon.getMBeanServerConnection();
		}
	}
	
	/**
	 * 
	 *
	 */
	public class JMXObject {
		protected ObjectName obj;
		
		/**
		 * 
		 * @param name
		 * @throws MalformedObjectNameException
		 */
		public JMXObject(String name) throws MalformedObjectNameException {
			obj = new ObjectName(name);
		}
		
		/**
		 * Get the original object
		 * 
		 * @return
		 */
		public ObjectName getObjectName() {
			return obj;
		}
		
		/**
		 * 
		 * @return
		 * @throws InstanceNotFoundException
		 * @throws IntrospectionException
		 * @throws ReflectionException
		 * @throws IOException
		 * @throws UnknownParameterException
		 */
		public Object getAttributes() throws InstanceNotFoundException, IntrospectionException, ReflectionException, IOException {
			HashMap<String, Object> pm = new HashMap<String, Object>();
			if (mbeanCon != null) {
				MBeanInfo mbi = mbeanCon.getMBeanInfo(obj);
				pm.put("operations", Arrays.asList(mbi.getOperations()));
				pm.put("attributes", Arrays.asList(mbi.getAttributes()));
			}
			
			Object out;
			//try {
				out = AFCmdBase.jse.convertObject(pm);
			//} catch (IOException e) {
			//	SimpleLog.log(SimpleLog.logtype.DEBUG,
			//			"Exception: " + e.getMessage(), e);
			//	throw e;
			//}

			return out;
		}
		
		/**
		 * 
		 * @param attrName
		 * @return
		 * @throws AttributeNotFoundException
		 * @throws InstanceNotFoundException
		 * @throws MBeanException
		 * @throws ReflectionException
		 * @throws IllegalAccessException
		 * @throws IllegalArgumentException
		 * @throws InvocationTargetException
		 * @throws NoSuchMethodException
		 * @throws SecurityException
		 * @throws IOException
		 */
		public Object get(String attrName) throws AttributeNotFoundException, InstanceNotFoundException, MBeanException, ReflectionException, IllegalAccessException, IllegalArgumentException, InvocationTargetException, NoSuchMethodException, SecurityException, IOException {
			return get(attrName, false);
		}
		
		/**
		 * Obtains an attribute from aObject. To use Java reflection (when using a specific provider) specify the methods to call delimiting them by "::" (e.g. SpecialData::getData). If you aren't using a specific provider or you don't need to access specific custom classes don't use the boolean usingReflection parameter
		 * 
		 * @param attrName
		 * @param reflect
		 * @return
		 * @throws AttributeNotFoundException
		 * @throws InstanceNotFoundException
		 * @throws MBeanException
		 * @throws ReflectionException
		 * @throws IOException
		 * @throws IllegalAccessException
		 * @throws IllegalArgumentException
		 * @throws InvocationTargetException
		 * @throws NoSuchMethodException
		 * @throws SecurityException
		 */
		public Object get(String attrName, boolean reflect) throws AttributeNotFoundException, InstanceNotFoundException, MBeanException, ReflectionException, IOException, IllegalAccessException, IllegalArgumentException, InvocationTargetException, NoSuchMethodException, SecurityException {
			Object attr = new String("");
			
			if (mbeanCon != null) {	
				if (provider != null && provider.startsWith("weblogic.management")) {
					try {
						attr = mbeanCon.getAttribute(obj, attrName);
					} catch (java.lang.IllegalStateException e) {
						attr = mbeanCon.getAttribute(obj, attrName);
						SimpleLog.log(logtype.DEBUG, "WebLogic Bug 13339111 Workaround", e);
					}
				} else {
					attr = mbeanCon.getAttribute(obj, attrName);
				}

				if (attr != null) {
					if (reflect) {
						String[] methods = attrName.split("::");
						for (String method : methods) {
							if (attr.getClass().equals(javax.management.openmbean.CompositeDataSupport.class)) {
								attr = ((javax.management.openmbean.CompositeDataSupport) attr).get(method);
							} else {
								Class<?>[] nil1 = null; Object nil2 = null;
								attr = attr.getClass().getMethod(method, nil1).invoke(attr, nil2);
							}
						}
						
						if (attr != null) return attr; else return null;
					}
				} else {
					return attr;
				}
			}
			return attr;
		}
		
		/**
		 * Sets an attribute from a bean aObject with the specific value.
		 * 
		 * @param attrName
		 * @param value
		 * @throws IOException 
		 * @throws ReflectionException 
		 * @throws MBeanException 
		 * @throws InvalidAttributeValueException 
		 * @throws AttributeNotFoundException 
		 * @throws InstanceNotFoundException 
		 */
		public void set(String attrName, Object value) throws InstanceNotFoundException, AttributeNotFoundException, InvalidAttributeValueException, MBeanException, ReflectionException, IOException {
			if (mbeanCon != null) {
				mbeanCon.setAttribute(obj, new Attribute(attrName, value));
			}
		}
		
		/**
		 * 
		 * @param operationName
		 * @param params
		 * @param signature
		 * @return
		 * @throws InstanceNotFoundException
		 * @throws MBeanException
		 * @throws ReflectionException
		 * @throws IOException
		 */
		public Object exec(String operationName, String[] params, String[] signature) throws InstanceNotFoundException, MBeanException, ReflectionException, IOException {
			return mbeanCon.invoke(obj, operationName, params, signature);
		}
	}
	
	/**
	 * <odoc>
	 * <key>JMX.getObject(aObjName) : Object</key>
	 * Obtains a bean aObject (e.g. aObjName = "wedo.openaf:type=Values").\
	 * Example:\
	 * \
	 * jmx.getObject("wedo.openaf:type=Values");\
	 * \
	 * </odoc>
	 */
	@JSFunction
	public Object getObject(String objName) throws MalformedObjectNameException {
		return new JMXObject(objName);
	}
	
	/**
	 * <odoc>
	 * <key>JMX.getLocals() : Object</key>
	 * Returns a Locals map with an id and name of each Java process detected locally. To be used with JMX.attach2Local().
	 * </odoc>
	 */
	@JSFunction
	public static Object getLocals() throws IOException {
		File toolsFile = ClassLoaderUtil.findToolsJar();
		if (toolsFile == null) return null;
		ClassLoaderUtil.addFileToClassPath(toolsFile, ClassLoader.getSystemClassLoader());
	
		List<VirtualMachineDescriptor> vms = VirtualMachine.list();
		HashMap<String, Object> pmap = new HashMap<String, Object>();
		ArrayList<HashMap<String, Object>> list = new ArrayList<HashMap<String, Object>>();
		
		for(VirtualMachineDescriptor vm : vms) {
			HashMap<String, Object> p = new HashMap<String, Object>();
			p.put("id", vm.id());
			p.put("name", vm.displayName());
			list.add(p);
		}
		pmap.put("Locals", list);
		
		//return AF.jsonParse(PMStringConvert.toJSON4NativeProcessing(pmap));
		return pmap;
	}
	/**
	 * <odoc>
	 * <key>JMX.attach2Local(aId) : Object</key>
	 * Establishes a connection with a local Java process given the aId provided by JMX.getLocals() returning an URL to establish
	 * a JMX connection, a list of System environment variables and a Agent describing the Java Management Agent activated
	 * on the local Java process.
	 * </odoc>
	 */
	@JSFunction
	public static Object attach2Local(String id) throws IOException, AgentLoadException, AgentInitializationException, AttachNotSupportedException {
		File toolsFile = ClassLoaderUtil.findToolsJar();
		if (toolsFile == null) return null;
		ClassLoaderUtil.addFileToClassPath(toolsFile, ClassLoader.getSystemClassLoader());
		
		HashMap<String, Object> local = new HashMap<String, Object>();
	    VirtualMachine vm;

        vm = VirtualMachine.attach(id);

	    vm.loadAgent(vm.getSystemProperties().getProperty("java.home") + File.separator + "lib" + File.separator + "management-agent.jar");
	    Properties props = vm.getAgentProperties();
	    String connectorAddress = props.getProperty("com.sun.management.jmxremote.localConnectorAddress");

	    JMXServiceURL url = new JMXServiceURL(connectorAddress);
	    
	    HashMap<String, String> map = new HashMap<String, String>();
	    
	    local.put("URL", url.toString());
	    for (final String name: vm.getSystemProperties().stringPropertyNames())
	        map.put(name, vm.getSystemProperties().getProperty(name));
	    
	    local.put("System", new HashMap<String, Object>(map));
	    map = new HashMap<String, String>();
	    
	    for (final String name: vm.getAgentProperties().stringPropertyNames())
	        map.put(name, vm.getAgentProperties().getProperty(name));
	    
	    local.put("Agent", new HashMap<String, Object>(map));

		//return AF.jsonParse(PMStringConvert.toJSON4NativeProcessing(local));
	    return local;
	}
}
