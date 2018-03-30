package openaf.plugins;

/**
 * 
 * @author Nuno Aguiar
 *
 */
import java.io.IOException;
import java.lang.management.ManagementFactory;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.rmi.RemoteException;
import java.rmi.registry.LocateRegistry;
import java.rmi.server.RMIServerSocketFactory;
import java.rmi.server.RMISocketFactory;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.concurrent.ConcurrentHashMap;

import javax.management.Attribute;
import javax.management.AttributeList;
import javax.management.AttributeNotFoundException;
import javax.management.Descriptor;
import javax.management.DynamicMBean;
import javax.management.ImmutableDescriptor;
import javax.management.InstanceAlreadyExistsException;
import javax.management.InvalidAttributeValueException;
import javax.management.JMException;
import javax.management.MBeanException;
import javax.management.MBeanInfo;
import javax.management.MBeanNotificationInfo;
import javax.management.MBeanRegistrationException;
import javax.management.MBeanServer;
import javax.management.MalformedObjectNameException;
import javax.management.NotCompliantMBeanException;
import javax.management.ObjectName;
import javax.management.ReflectionException;
import javax.management.openmbean.OpenMBeanAttributeInfo;
import javax.management.openmbean.OpenMBeanAttributeInfoSupport;
import javax.management.openmbean.OpenMBeanConstructorInfo;
import javax.management.openmbean.OpenMBeanInfoSupport;
import javax.management.openmbean.OpenMBeanOperationInfo;
import javax.management.openmbean.OpenMBeanOperationInfoSupport;
import javax.management.openmbean.OpenType;
import javax.management.openmbean.SimpleType;
import javax.management.remote.JMXConnectorServer;
import javax.management.remote.JMXConnectorServerFactory;
import javax.management.remote.JMXServiceURL;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeFunction;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;

import openaf.AFCmdBase;
import openaf.SimpleLog;
import openaf.SimpleLog.logtype;

public class JMXServer extends ScriptableObject {

	/**
	 * 
	 */
	private static final long serialVersionUID = 2249818633847061216L;

	public class DynaMXBean implements DynamicMBean {
		NativeFunction getFunction;
		NativeFunction setFunction;
		NativeFunction opsFunction;
		protected OpenMBeanAttributeInfo[] attrInfo;
		protected OpenMBeanConstructorInfo[] attrCons;
		protected OpenMBeanOperationInfo[] attrOps;
		protected MBeanNotificationInfo[] attrNoti;
		
		/**
		 * 
		 */
		public DynaMXBean() {
			attrInfo = new OpenMBeanAttributeInfo[0];
			attrCons = new OpenMBeanConstructorInfo[0];
			attrOps  = new OpenMBeanOperationInfo[0];
			attrNoti = new MBeanNotificationInfo[0];

			getFunction = null;
			setFunction = null;
			opsFunction = null;
		}
		
		/**
		 * 
		 * @param get
		 * @param set
		 */
		public DynaMXBean(NativeObject attrs, NativeFunction get, NativeFunction set, NativeFunction opsRouter) {
			ArrayList<OpenMBeanAttributeInfoSupport> linfo = new ArrayList<OpenMBeanAttributeInfoSupport>();
			ArrayList<OpenMBeanOperationInfoSupport> lops = new ArrayList<OpenMBeanOperationInfoSupport>();
			
			getFunction = get;
			setFunction = set;
			opsFunction = opsRouter;
			
			for(Object attr : attrs.keySet()) {
				OpenType<?> type = null;
				boolean writable; 
				boolean func = false;
				
				String origType = (String) attrs.get(attr);
				if (origType.contains("writable")) writable = true; else writable = false;
				origType = origType.replaceAll("\\s*writable\\s*", "");
				if (origType.equals("double")) type = SimpleType.DOUBLE;
				if (origType.equals("long"))   type = SimpleType.LONG;
				if (origType.equals("operation")) func = true;
				if (type == null) type = SimpleType.STRING; 
				
				if (!func) {
					linfo.add(new OpenMBeanAttributeInfoSupport((String) attr, (String) attr, type, true, writable, false));
				} else {
					lops.add(new OpenMBeanOperationInfoSupport((String) attr, (String) attr, null, SimpleType.STRING, OpenMBeanOperationInfoSupport.UNKNOWN));
				}
			}
			
			attrCons = new OpenMBeanConstructorInfo[0];
			attrNoti = new MBeanNotificationInfo[0];
			
			attrInfo = Arrays.copyOf(linfo.toArray(), linfo.size(), OpenMBeanAttributeInfo[].class);
			attrOps = Arrays.copyOf(lops.toArray(), lops.size(), OpenMBeanOperationInfo[].class);
		}
		
		@Override
		public Object getAttribute(String attrName)
				throws AttributeNotFoundException, MBeanException,
				ReflectionException {
			if (getFunction == null) {
				return null;
			} else {
				Context cx = (Context) AFCmdBase.jse.enterContext();
				Object b = null;
				try {
					b = getFunction.call(cx, (Scriptable) AFCmdBase.jse.getGlobalscope(), cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope()), new Object[]{ attrName });
				} catch(Exception e) {
					//AFCmdBase.jse.exitContext();
					throw e;
				} finally {
					AFCmdBase.jse.exitContext();
				}
				
				return b;
			}
		}

		/**
		 * 
		 */
		@Override
		public AttributeList getAttributes(String[] attrNames) {
			AttributeList al = new AttributeList();
			
			for(String key : attrNames) {
				try {
					al.add(getAttribute(key));
				} catch (AttributeNotFoundException | MBeanException
						| ReflectionException e) {
					SimpleLog.log(logtype.ERROR, "Attribute problem for " + key, e);
				}
			}
			
			return al;
		}

		@Override
		public MBeanInfo getMBeanInfo() {
			Descriptor desc = new ImmutableDescriptor( new String[] { "immutableInfo", "mxbean" }, 
	                new String[] { "true", "true"} );
			MBeanInfo info = new OpenMBeanInfoSupport(getClass().getName(), "OpenAF dynamic MX Bean", attrInfo, attrCons, attrOps, attrNoti, desc);
			
			return info;
		}

		@Override
		public Object invoke(String action, Object[] params, String[] sig)
				throws MBeanException, ReflectionException {
			Context cx = (Context) AFCmdBase.jse.enterContext();
			Object res = new java.lang.Object();
			try {
				ArrayList<String> records = new ArrayList<String>();
				for(Object o : params) {
					records.add((String) o.toString());
				}
				Object ress = AFCmdBase.jse.newArray(AFCmdBase.jse.getGlobalscope(), records.toArray());
				
				ArrayList<String> records2 = new ArrayList<String>();
				for(Object o : sig) {
					records2.add((String) o.toString());
				}
				Object ress2 = AFCmdBase.jse.newArray(AFCmdBase.jse.getGlobalscope(), records2.toArray());
				
				res = opsFunction.call(cx, (Scriptable) AFCmdBase.jse.getGlobalscope(), cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope()), new Object[] { action, ress, ress2 });
			} catch(Exception e) {
				throw e;
			} finally {
				AFCmdBase.jse.exitContext();
			}
			return res;
		}

		@Override
		public void setAttribute(Attribute attr)
				throws AttributeNotFoundException,
				InvalidAttributeValueException, MBeanException,
				ReflectionException {
			Context cx = (Context) AFCmdBase.jse.enterContext();
			try {
				setFunction.call(cx, (Scriptable) AFCmdBase.jse.getGlobalscope(), cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope()), new Object[]{ attr.getName(), attr.getValue() });
			} catch(Exception e) {
				//AFCmdBase.jse.exitContext();
				throw e;
			} finally {
				AFCmdBase.jse.exitContext();
			}
		}

		@Override
		public AttributeList setAttributes(AttributeList attrList) {
			ArrayList<String> attrs = new ArrayList<String>();
			
			for(Object attr : attrList) {
				try {
					setAttribute((Attribute) attr);
				} catch (AttributeNotFoundException | MBeanException
						| ReflectionException | InvalidAttributeValueException e) {
					SimpleLog.log(logtype.ERROR, "Attribute problem for " + attr, e);
				}
				attrs.add(((Attribute) attr).getName());
			}
			
			return getAttributes((String[]) attrs.toArray());
		}
		
	}
	
	public class MXServer {
		protected MBeanServer mbs;
		protected ConcurrentHashMap<String, ObjectName> objs = new ConcurrentHashMap<String, ObjectName>(); 
		protected JMXConnectorServer cs;
		
		public class RestrictedRMIRegistry implements RMIServerSocketFactory {
		    public ServerSocket createServerSocket(int port) throws IOException {
		        return new ServerSocket(port, 0, InetAddress.getLocalHost());
		    }
		}
		
		/**
		 * 
		 * @param port
		 * @throws IOException 
		 */
		public MXServer(int port, boolean local) throws IOException {
			try {
				System.setProperty("java.rmi.server.randomIDs", "true");
				
				if (port > 0) {
					if (local) {
						LocateRegistry.createRegistry(port, RMISocketFactory.getDefaultSocketFactory(), new RestrictedRMIRegistry());

					} else {
						LocateRegistry.createRegistry(port);	
					}
				}
				
				mbs = ManagementFactory.getPlatformMBeanServer();
				ConcurrentHashMap<String,Object> env = new ConcurrentHashMap<String,Object>();
				
				if (port > 0) {
					try {
						JMXServiceURL url = new JMXServiceURL("service:jmx:rmi:///jndi/rmi://:" + port + "/jmxrmi");
						cs = JMXConnectorServerFactory.newJMXConnectorServer(url, env, mbs);
						cs.start();
					} catch(IOException e) {
						SimpleLog.log(SimpleLog.logtype.DEBUG, "Malformed or IO problem with URL service:jmx:rmi:///jndi/rmi://:" + port + "/jmxrmi", e);
						throw e;
					}
				}
			} catch (RemoteException e) {
				SimpleLog.log(SimpleLog.logtype.DEBUG, "Problem starting JMX", e);
				throw e;
			}
		}
		
		/**
		 * Stop the server
		 * @throws IOException 
		 * 
		 */
		public void stop() throws IOException {
			try {
				if (cs != null) cs.stop();
			} catch (IOException e) {
				SimpleLog.log(SimpleLog.logtype.DEBUG, "Problem stopping JMX", e);
				throw e;
			}
		}
		
		/**
		 * 
		 * @param bean
		 * @param name
		 * @throws JMException 
		 */
		public void registerMBean(Object bean, ObjectName name) throws JMException {
			try {
				mbs.registerMBean(bean, name);
			} catch (InstanceAlreadyExistsException
					| MBeanRegistrationException | NotCompliantMBeanException e) {
				SimpleLog.log(SimpleLog.logtype.DEBUG, "Problem registering mbean", e);
				throw e;
			}
		}
		
		/**
		 * 
		 * @param bean
		 * @param name
		 * @throws JMException 
		 */
		public void registerDynaMBean(DynaMXBean bean, ObjectName name) throws JMException {
			this.registerMBean(bean, name);
		}
		
		/**
		 * 
		 * @param name
		 * @param bean
		 * @throws JMException 
		 */
		public void addBean(String name, Object bean) throws JMException {
			ObjectName on = null;
			
			if (objs.containsKey(name)) {
				on = objs.get(name);
			} else {
				try {
					on = new ObjectName(name);
				} catch (MalformedObjectNameException e) {
					SimpleLog.log(logtype.ERROR, "Malformed Object name " + name, e);
				}
			}
			
			if (on != null) {
				registerMBean(bean, on);
			}
		}
		
		public void addDynaBean(String name, DynaMXBean bean) throws JMException {
			ObjectName on = null;
			
			if (objs.containsKey(name)) {
				on = objs.get(name);
			} else {
				try {
					on = new ObjectName(name);
				} catch (MalformedObjectNameException e) {
					SimpleLog.log(logtype.ERROR, "Malformed object " + name, e);
				}	
			}
			
			if (on != null) {
				registerDynaMBean(bean, on);
			}
		}
	}

	protected MXServer mxs;
	protected String name;
	
	@Override
	public String getClassName() {
		return "JMXServer";
	}

	/**
	 * <odoc>
	 * <key>JMXServer.JMXServer(aJMXObjectName) : JMXServer</key>
	 * Creates a new JMX server instance for a given default JMX object name (defaults to 'com.openaf:type=Values'.
	 * </odoc>
	 */
	@JSConstructor
	public void newJMX(Object name) {
		if (name == null || name instanceof Undefined) {
			name = "com.openaf:type=Values";
		} else {
			this.name = name.toString();
		}
	}
	
	/**
	 * <odoc>
	 * <key>JMXServer.start(aPort, notLocal)</key>
	 * Starts the JMX server on the given aPort. You should use the addBean function after starting the server.
	 * You can optionally indicate that the server can be accessed from other hosts other than the local (NOT ADVISABLE).
	 * </odoc>
	 */
	@JSFunction
	public void start(int port, boolean notLocal) throws IOException {
		mxs = new MXServer(port, notLocal);
	}
	
	/**
	 * <odoc>
	 * <key>JMXServer.stop()</key>
	 * Stop the JMX server.
	 * </odoc>
	 */
	@JSFunction
	public void stop() throws IOException {
		mxs.stop();
	}
	
	/**
	 * <odoc>
	 * <key>JMXServer.addBean(aAttrJSON, getFunction, setFunction, opsFunction) : number</key>
	 * Adds a JMX bean given a JSON map of the attributes, aAttrJSON, and corresponding types (e.g. '[writable] double', 
	 * '[writable] long', '[writable] string', 'operation'). Additionally you must provide a getFunction(aAttrName) that will receive 
	 * the name of the attribute and should return the value of the attribute and optionally a setFunction(aAttrName, aNewValue)
	 * that will receive the name and value of the attribute and should return the new value of the attribute. You can also
	 * provide a opsFunction(operation, arrayOfParams, arrayOfSignatures) (arrayOfParams and return should be strings).
	 * Returns the number of attributes or 0 if unsuccessful.
	 * </odoc>
	 */
	@JSFunction
	public long addBean(NativeObject attrs, NativeFunction getFunction, NativeFunction setFunction, NativeFunction opsFunction) throws JMException {
		if (mxs != null) {
			DynaMXBean db = new DynaMXBean(attrs, getFunction, setFunction, opsFunction);
		
			mxs.addDynaBean(name, db);
			return attrs.size();
		} else {
			return 0;
		}
	}
	
	/**
	 * <odoc>
	 * <key>JMXServer.addObjectBean(aObjectName, aAttrJSON, getFunction, setFunction, opsFunction) : number</key>
	 * Equivalent to JMXServer.addBean but enables you to add a JMX bean a different JMX object name (aObjectName) given 
	 * a JSON map of the attributes, aAttrJSON, and corresponding types (e.g. '[writable] double', 
	 * '[writable] long', '[writable] string'). Additionally you must provide a getFunction(aAttrName) that will receive 
	 * the name of the attribute and should return the value of the attribute and optionally a setFunction(aAttrName, aNewValue)
	 * that will receive the name and value of the attribute and should return the new value of the attribute. You can also
	 * provide a opsFunction(operation, arrayOfParams, arrayOfSignatures) (arrayOfParams and return should be strings).
	 * Returns the number of attributes or 0 if unsuccessful.
	 * </odoc>
	 */
	@JSFunction
	public long addObjectBean(String name, NativeObject attrs, NativeFunction getFunction, NativeFunction setFunction, NativeFunction opsFunction) throws JMException {
		if (mxs != null) {
			DynaMXBean db = new DynaMXBean(attrs, getFunction, setFunction, opsFunction);
		
			mxs.addDynaBean(name, db);
			return attrs.size();
		} else {
			return 0;
		}
	}
	
}