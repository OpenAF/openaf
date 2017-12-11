package wedo.openaf.plugins;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeFunction;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;
import org.snmp4j.Snmp;
import org.snmp4j.TransportMapping;
import org.snmp4j.agent.BaseAgent;
import org.snmp4j.agent.CommandProcessor;
import org.snmp4j.agent.DuplicateRegistrationException;
import org.snmp4j.agent.MOGroup;
import org.snmp4j.agent.ManagedObject;
import org.snmp4j.agent.mo.MOAccessImpl;
import org.snmp4j.agent.mo.MOColumn;
import org.snmp4j.agent.mo.MOScalar;
import org.snmp4j.agent.mo.MOTableRow;
import org.snmp4j.agent.mo.snmp.RowStatus;
import org.snmp4j.agent.mo.snmp.SnmpCommunityMIB;
import org.snmp4j.agent.mo.snmp.SnmpCommunityMIB.SnmpCommunityEntryRow;
import org.snmp4j.agent.mo.snmp.SnmpNotificationMIB;
import org.snmp4j.agent.mo.snmp.SnmpTargetMIB;
import org.snmp4j.agent.mo.snmp.StorageType;
import org.snmp4j.agent.mo.snmp.VacmMIB;
import org.snmp4j.agent.security.MutableVACM;
import org.snmp4j.mp.MPv3;
import org.snmp4j.security.SecurityLevel;
import org.snmp4j.security.SecurityModel;
import org.snmp4j.security.USM;
import org.snmp4j.smi.Address;
import org.snmp4j.smi.GenericAddress;
import org.snmp4j.smi.Integer32;
import org.snmp4j.smi.OID;
import org.snmp4j.smi.OctetString;
import org.snmp4j.smi.SMIConstants;
import org.snmp4j.smi.Variable;
import org.snmp4j.transport.TransportMappings;
import wedo.openaf.AFCmdBase;
import wedo.openaf.SimpleLog;
import wedo.openaf.SimpleLog.logtype;

/**
 * 
 * @author Nuno Aguiar
 *
 */
public class SNMPServer extends ScriptableObject {

	/**
	 * 
	 */
	private static final long serialVersionUID = -3002319922538972994L;
	protected Snmp snmp;
	protected String address;
	protected OctetString community;
	protected SNMPAgent agent;
	public static Map<String, NativeFunction> callbacks = new ConcurrentHashMap<String, NativeFunction>();
	
	
	public static MOColumn[] getMOColumns() {
		ArrayList<MOColumn> mocs = new ArrayList<MOColumn>();
		
		for(int i = 1; i <= 9; i++) {
			MOColumn col = new MOColumn(i, SMIConstants.SYNTAX_OCTET_STRING);
			mocs.add(col);
		}
		
		return (MOColumn[]) mocs.toArray();
	}
	
	/**
	 * 
	 * @param oid
	 * @return
	 */
	public static Variable execFunc(String oid) {
		NativeFunction func = callbacks.get(oid);
		
		Object ret = null; 
		if (func != null) {
			Context cx = (Context) AFCmdBase.jse.enterContext();
			try {
				ret = func.call(cx, (Scriptable) AFCmdBase.jse.getGlobalscope(), cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope()), new Object[] {oid});
			} catch (Exception e) {
				//AFCmdBase.jse.exitContext();
				throw e;
			} finally {
				AFCmdBase.jse.exitContext();
			}
		}

		if (ret == null || ret instanceof Undefined) {
			ret = new String("");
		}
		
		return new OctetString(ret.toString());
	}
	
	/**
	 * 
	 * @author nmaguiar
	 *
	 */
	public class SNMPAgent extends BaseAgent {
		protected String address;
		
		/**
		 * 
		 * @param address
		 */
		protected SNMPAgent(String address) {
			//super(null);
			super(new File("bootCounter.agent"), new File("conf.agent"), new CommandProcessor(new OctetString(MPv3.createLocalEngineID())));
			//this.agent = new CommandProcessor(new OctetString(MPv3.createLocalEngineID()));
			this.address = address;
		}

		@Override
		/**
		 * 
		 * @param community
		 */
		protected void addCommunities(SnmpCommunityMIB community) {
			Variable[] com2sec = new Variable[] { new OctetString("public"),
					new OctetString("cpublic"),
					getAgent().getContextEngineID(),
					new OctetString("public"),
					new OctetString(),
					new Integer32(StorageType.nonVolatile),
					new Integer32(RowStatus.active)
			};
			
			MOTableRow row = community.getSnmpCommunityEntry().createRow(
					new OctetString("public2public").toSubIndex(true), com2sec);
			community.getSnmpCommunityEntry().addRow((SnmpCommunityEntryRow) row);
		}

		@Override
		/**
		 * 
		 * @param tmib
		 * @param nmib
		 */
		protected void addNotificationTargets(SnmpTargetMIB tmib,
				SnmpNotificationMIB nmib) { 
		}

		@Override
		/**
		 * 
		 * @param usm
		 */
		protected void addUsmUser(USM usm) {
		}

		@Override
		/**
		 * 
		 * @param vacm
		 */
		protected void addViews(VacmMIB vacm) {
			vacm.addGroup(SecurityModel.SECURITY_MODEL_SNMPv2c, new OctetString("cpublic"), new OctetString("v1v2group"),StorageType.nonVolatile);
			vacm.addAccess(new OctetString("v1v2group"), new OctetString("public"),
					SecurityModel.SECURITY_MODEL_ANY, SecurityLevel.NOAUTH_NOPRIV,
					MutableVACM.VACM_MATCH_EXACT, new OctetString("fullReadView"),
					new OctetString("fullWriteView"), new OctetString(
							"fullNotifyView"), StorageType.nonVolatile);
			vacm.addViewTreeFamily(new OctetString("fullReadView"), new OID("1.3"),
					new OctetString(), VacmMIB.vacmViewIncluded,
					StorageType.nonVolatile);
		}

		@Override
		/**
		 * 
		 */
		protected void registerManagedObjects() {
		}

		public void registerManagedObjects(ManagedObject mo) throws DuplicateRegistrationException {
			server.register(mo, null);
		}

	    public void unregisterManagedObject(MOGroup moGroup) {
	        moGroup.unregisterMOs(server, getContext(moGroup));
	    }

		
		@Override
		protected void unregisterManagedObjects() {
			// TODO Auto-generated method stub
			
		}

		protected void initTransportMappings() throws IOException {
			SimpleLog.log(logtype.DEBUG, "SNMPd: Starting server at " + this.address, null);
			transportMappings = new TransportMapping[1];
			Address addr = GenericAddress.parse(this.address);
			TransportMapping tm = TransportMappings.getInstance().createTransportMapping(addr);
			transportMappings[0] = tm;
		}
		
	    public void start(String community) throws IOException {
	        init();
	        if (community == null) { community = new String("public"); }
	        addShutdownHook();
	        getServer().addContext(new OctetString(community));
	        finishInit();
	        run();
	        sendColdStartNotification();
	    }
	}
	
	public class MOJSFunction extends MOScalar {	
		OID oid;
		protected MOColumn[] values;
		
		@SuppressWarnings("unchecked")
		public MOJSFunction(OID id) {
			super(id, MOAccessImpl.ACCESS_READ_ONLY, execFunc(id.toString()));
			this.oid = id;
		}
		
		@Override
		public Variable getValue() {
			return execFunc(oid.toString());
			
		}
	}
	
	@Override
	public String getClassName() {
		return "SNMPd";
	}

	/**
	 * <odoc>
	 * <key>SNMPd.SNMPd(anAddress, aSysDesc) : SNMPd</key>
	 * Prepares a SNMP server listening on the given anAddress (e.g. udp:1.2.3.4/161). Optionally you can
	 * also provide a system description (aSysDesc).
	 * </odoc>
	 */
	@JSConstructor
	public void newSNMPd(String address, Object name) {
		this.address = address;
		agent = new SNMPAgent(address);
		if (name != null && !(name instanceof Undefined)) 
			agent.setSysDescr(new OctetString(name.toString()));
		else
			agent.setSysDescr(new OctetString("OpenAF SNMP server"));
	}
	
	/**
	 * <odoc>
	 * <key>SNMPd.start(aCommunity)</key>
	 * Starts the SNMP server given a community name. If no community is provided, public is assumed.
	 * </odoc>
	 */
	@JSFunction
	public void start(Object community) throws IOException {
		String c;
		
		if (community == null || community instanceof Undefined) {
			c = "public";
		} else {
			c = community.toString();
		}
		agent.start(c);
	}
	
	/**
	 * <odoc>
	 * <key>SNMPd.stop()</key>
	 * Stops the SNMP server.
	 * </odoc>
	 */
	@JSFunction
	public void stop() {
		agent.stop();
	}
	
	/**
	 * <odoc>
	 * <key>SNMPD.addOID(aOID, aFunction)</key>
	 * Adds a callback when the specified OID (should end in .0) gets look up. The call back aFunction
	 * receives the aOID as a parameter. See more: http://www.jitendrazaa.com/blog/java/snmp/creating-snmp-agent-server-in-java-using-snmp4j/
	 * </odoc>
	 */
	@JSFunction
	public void addOID(String oid, NativeFunction func) throws DuplicateRegistrationException {
		if (oid != null) {
			agent.registerManagedObjects(new MOJSFunction(new OID(oid)));
			setOID(oid, func);
		}
	}
	
    /**
     * <odoc>
     * <key>SNMPd.setOID(aOID, aFunction)</key>	
     * Changes the callback for a specific OID (should end in .0). The call back aFunction receives the aOID as a parameter.
     * </odoc>
     */
	@JSFunction
	public void setOID(String oid, NativeFunction func) {
		callbacks.put(oid, func);
	}
	
}
