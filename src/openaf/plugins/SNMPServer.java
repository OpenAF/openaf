package openaf.plugins;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.lang.String;

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
import org.snmp4j.security.AuthHMAC192SHA256;
import org.snmp4j.security.AuthMD5;
import org.snmp4j.security.AuthSHA;
import org.snmp4j.security.PrivAES128;
import org.snmp4j.security.PrivAES192;
import org.snmp4j.security.PrivAES256;
import org.snmp4j.security.PrivDES;
import org.snmp4j.security.SecurityModels;
import org.snmp4j.security.SecurityProtocols;
import org.snmp4j.security.SecurityLevel;
import org.snmp4j.security.SecurityModel;
import org.snmp4j.security.USM;
import org.snmp4j.security.UsmUser;
import org.snmp4j.smi.Address;
import org.snmp4j.smi.GenericAddress;
import org.snmp4j.smi.Integer32;
import org.snmp4j.smi.OID;
import org.snmp4j.smi.OctetString;
import org.snmp4j.smi.SMIConstants;
import org.snmp4j.smi.UdpAddress;
import org.snmp4j.smi.Variable;
import org.snmp4j.transport.TransportMappings;
import org.snmp4j.agent.mo.snmp.TransportDomains;
import org.snmp4j.mp.MessageProcessingModel;
import openaf.AFCmdBase;
import openaf.SimpleLog;
import openaf.SimpleLog.logtype;

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
		protected void addNotificationTargets(SnmpTargetMIB tmib,
				SnmpNotificationMIB nmib) { 
			tmib.addDefaultTDomains();

			/*tmib.addTargetAddress(new OctetString("notificationV2c"),
                TransportDomains.transportDomainUdpIpv4,
                new OctetString(new UdpAddress("127.0.0.1/162").getValue()),
                200, 1,
                new OctetString("notify"),
                new OctetString("v2c"),
                StorageType.permanent);
			tmib.addTargetAddress(new OctetString("notificationV3"),
					TransportDomains.transportDomainUdpIpv4,
					new OctetString(new UdpAddress("127.0.0.1/1162").getValue()),
					200, 1,
					new OctetString("notify"),
					new OctetString("v3notify"),
					StorageType.permanent);
			tmib.addTargetParams(new OctetString("v2c"),
					MessageProcessingModel.MPv2c,
					SecurityModel.SECURITY_MODEL_SNMPv2c,
					new OctetString("cpublic"),
					SecurityLevel.AUTH_PRIV,
					StorageType.permanent);
			tmib.addTargetParams(new OctetString("v3notify"),
					MessageProcessingModel.MPv3,
					SecurityModel.SECURITY_MODEL_USM,
					new OctetString("v3notify"),
					SecurityLevel.NOAUTH_NOPRIV,
					StorageType.permanent);
			nmib.addNotifyEntry(new OctetString("default"),
					new OctetString("notify"),
					SnmpNotificationMIB.SnmpNotifyTypeEnum.inform,
					StorageType.permanent);*/
		}

		@Override
		protected void addUsmUser(USM usm) {
			/*UsmUser user = new UsmUser(new OctetString("SHADES"),
			AuthSHA.ID,
			new OctetString("SHADESAuthPassword"),
			PrivDES.ID,
			new OctetString("SHADESPrivPassword"));

		//    usm.addUser(user.getSecurityName(), usm.getLocalEngineID(), user);
			usm.addUser(user.getSecurityName(), null, user);
			user = new UsmUser(new OctetString("TEST"),
					AuthSHA.ID,
					new OctetString("maplesyrup"),
					PrivDES.ID,
					new OctetString("maplesyrup"));
			usm.addUser(user.getSecurityName(), usm.getLocalEngineID(), user);
			user = new UsmUser(new OctetString("SHA"),
					AuthSHA.ID,
					new OctetString("SHAAuthPassword"),
					null,
					null);
			usm.addUser(user.getSecurityName(), usm.getLocalEngineID(), user);
			user = new UsmUser(new OctetString("SHADES"),
					AuthSHA.ID,
					new OctetString("SHADESAuthPassword"),
					PrivDES.ID,
					new OctetString("SHADESPrivPassword"));
			usm.addUser(user.getSecurityName(), usm.getLocalEngineID(), user);
			user = new UsmUser(new OctetString("MD5DES"),
					AuthMD5.ID,
					new OctetString("MD5DESAuthPassword"),
					PrivDES.ID,
					new OctetString("MD5DESPrivPassword"));
			usm.addUser(user.getSecurityName(), usm.getLocalEngineID(), user);
			user = new UsmUser(new OctetString("SHAAES128"),
					AuthSHA.ID,
					new OctetString("SHAAES128AuthPassword"),
					PrivAES128.ID,
					new OctetString("SHAAES128PrivPassword"));
			usm.addUser(user.getSecurityName(), usm.getLocalEngineID(), user);
			user = new UsmUser(new OctetString("SHAAES192"),
					AuthSHA.ID,
					new OctetString("SHAAES192AuthPassword"),
					PrivAES192.ID,
					new OctetString("SHAAES192PrivPassword"));
			usm.addUser(user.getSecurityName(), usm.getLocalEngineID(), user);
			user = new UsmUser(new OctetString("SHAAES256"),
					AuthSHA.ID,
					new OctetString("SHAAES256AuthPassword"),
					PrivAES256.ID,
					new OctetString("SHAAES256PrivPassword"));
			usm.addUser(user.getSecurityName(), usm.getLocalEngineID(), user);

			user = new UsmUser(new OctetString("MD5AES128"),
					AuthMD5.ID,
					new OctetString("MD5AES128AuthPassword"),
					PrivAES128.ID,
					new OctetString("MD5AES128PrivPassword"));
			usm.addUser(user.getSecurityName(), usm.getLocalEngineID(), user);
			user = new UsmUser(new OctetString("MD5AES192"),
					AuthHMAC192SHA256.ID,
					new OctetString("MD5AES192AuthPassword"),
					PrivAES192.ID,
					new OctetString("MD5AES192PrivPassword"));
			usm.addUser(user.getSecurityName(), usm.getLocalEngineID(), user);
			//==============================================================
			user = new UsmUser(new OctetString("MD5AES256"),
					AuthMD5.ID,
					new OctetString("MD5AES256AuthPassword"),
					PrivAES256.ID,
					new OctetString("MD5AES256PrivPassword"));
			usm.addUser(user.getSecurityName(), usm.getLocalEngineID(), user);
			user = new UsmUser(new OctetString("MD5AES256"),
					AuthMD5.ID,
					new OctetString("MD5AES256AuthPassword"),
					PrivAES256.ID,
					new OctetString("MD5AES256PrivPassword"));
			usm.addUser(user.getSecurityName(), usm.getLocalEngineID(), user);

			user = new UsmUser(new OctetString("v3notify"),
					null,
					null,
					null,
					null);
			usm.addUser(user.getSecurityName(), null, user);*/

			this.usm = usm;
		}

		@Override
		/**
		 * 
		 * @param vacm
		 */
		protected void addViews(VacmMIB vacm) {
			vacm.addGroup(SecurityModel.SECURITY_MODEL_SNMPv1,
					new OctetString("cpublic"),
					new OctetString("v1v2group"),
					StorageType.nonVolatile);
			vacm.addGroup(SecurityModel.SECURITY_MODEL_USM,
					new OctetString("SHADES"),
					new OctetString("v3group"),
					StorageType.nonVolatile);
			vacm.addGroup(SecurityModel.SECURITY_MODEL_USM,
					new OctetString("MD5DES"),
					new OctetString("v3group"),
					StorageType.nonVolatile);
			vacm.addGroup(SecurityModel.SECURITY_MODEL_USM,
					new OctetString("TEST"),
					new OctetString("v3test"),
					StorageType.nonVolatile);
			vacm.addGroup(SecurityModel.SECURITY_MODEL_USM,
					new OctetString("SHA"),
					new OctetString("v3restricted"),
					StorageType.nonVolatile);
			vacm.addGroup(SecurityModel.SECURITY_MODEL_USM,
					new OctetString("SHAAES128"),
					new OctetString("v3group"),
					StorageType.nonVolatile);
			vacm.addGroup(SecurityModel.SECURITY_MODEL_USM,
					new OctetString("SHAAES192"),
					new OctetString("v3group"),
					StorageType.nonVolatile);
			vacm.addGroup(SecurityModel.SECURITY_MODEL_USM,
					new OctetString("SHAAES256"),
					new OctetString("v3group"),
					StorageType.nonVolatile);
			vacm.addGroup(SecurityModel.SECURITY_MODEL_USM,
					new OctetString("MD5AES128"),
					new OctetString("v3group"),
					StorageType.nonVolatile);
			vacm.addGroup(SecurityModel.SECURITY_MODEL_USM,
					new OctetString("MD5AES192"),
					new OctetString("v3group"),
					StorageType.nonVolatile);
			vacm.addGroup(SecurityModel.SECURITY_MODEL_USM,
					new OctetString("MD5AES256"),
					new OctetString("v3group"),
					StorageType.nonVolatile);

			vacm.addGroup(SecurityModel.SECURITY_MODEL_SNMPv2c, new OctetString("cpublic"), new OctetString("v1v2group"),StorageType.nonVolatile);
			/*vacm.addAccess(new OctetString("v1v2group"), new OctetString("public"),
					SecurityModel.SECURITY_MODEL_ANY, SecurityLevel.NOAUTH_NOPRIV,
					MutableVACM.VACM_MATCH_EXACT, new OctetString("fullReadView"),
					new OctetString("fullWriteView"), new OctetString(
							"fullNotifyView"), StorageType.nonVolatile);
			vacm.addViewTreeFamily(new OctetString("fullReadView"), new OID("1.3"),
					new OctetString(), VacmMIB.vacmViewIncluded,
					StorageType.nonVolatile)*/
			
			vacm.addAccess(new OctetString("v1v2group"), new OctetString("public"),
					SecurityModel.SECURITY_MODEL_ANY,
					SecurityLevel.NOAUTH_NOPRIV,
					MutableVACM.VACM_MATCH_EXACT,
					new OctetString("fullReadView"),
					new OctetString("fullWriteView"),
					new OctetString("fullNotifyView"),
					StorageType.nonVolatile);
			vacm.addAccess(new OctetString("v3group"), new OctetString(),
					SecurityModel.SECURITY_MODEL_USM,
					SecurityLevel.AUTH_PRIV,
					MutableVACM.VACM_MATCH_EXACT,
					new OctetString("fullReadView"),
					new OctetString("fullWriteView"),
					new OctetString("fullNotifyView"),
					StorageType.nonVolatile);
			vacm.addAccess(new OctetString("v3restricted"), new OctetString(),
					SecurityModel.SECURITY_MODEL_USM,
					SecurityLevel.NOAUTH_NOPRIV,
					MutableVACM.VACM_MATCH_EXACT,
					new OctetString("restrictedReadView"),
					new OctetString("restrictedWriteView"),
					new OctetString("restrictedNotifyView"),
					StorageType.nonVolatile);
			vacm.addAccess(new OctetString("v3test"), new OctetString(),
					SecurityModel.SECURITY_MODEL_USM,
					SecurityLevel.AUTH_PRIV,
					MutableVACM.VACM_MATCH_EXACT,
					new OctetString("testReadView"),
					new OctetString("testWriteView"),
					new OctetString("testNotifyView"),
					StorageType.nonVolatile);
	
			vacm.addViewTreeFamily(new OctetString("fullReadView"), new OID("1.3"),
					new OctetString(), VacmMIB.vacmViewIncluded,
					StorageType.nonVolatile);
			vacm.addViewTreeFamily(new OctetString("fullWriteView"), new OID("1.3"),
					new OctetString(), VacmMIB.vacmViewIncluded,
					StorageType.nonVolatile);
			vacm.addViewTreeFamily(new OctetString("fullNotifyView"), new OID("1.3"),
					new OctetString(), VacmMIB.vacmViewIncluded,
					StorageType.nonVolatile);
	
			vacm.addViewTreeFamily(new OctetString("restrictedReadView"),
					new OID("1.3.6.1.2"),
					new OctetString(), VacmMIB.vacmViewIncluded,
					StorageType.nonVolatile);
			vacm.addViewTreeFamily(new OctetString("restrictedWriteView"),
					new OID("1.3.6.1.2.1"),
					new OctetString(),
					VacmMIB.vacmViewIncluded,
					StorageType.nonVolatile);
			vacm.addViewTreeFamily(new OctetString("restrictedNotifyView"),
					new OID("1.3.6.1.2"),
					new OctetString(), VacmMIB.vacmViewIncluded,
					StorageType.nonVolatile);
			vacm.addViewTreeFamily(new OctetString("restrictedNotifyView"),
					new OID("1.3.6.1.6.3.1"),
					new OctetString(), VacmMIB.vacmViewIncluded,
					StorageType.nonVolatile);
	
			vacm.addViewTreeFamily(new OctetString("testReadView"),
					new OID("1.3.6.1.2"),
					new OctetString(), VacmMIB.vacmViewIncluded,
					StorageType.nonVolatile);
			vacm.addViewTreeFamily(new OctetString("testReadView"),
					new OID("1.3.6.1.2.1.1"),
					new OctetString(), VacmMIB.vacmViewExcluded,
					StorageType.nonVolatile);
			vacm.addViewTreeFamily(new OctetString("testWriteView"),
					new OID("1.3.6.1.2.1"),
					new OctetString(),
					VacmMIB.vacmViewIncluded,
					StorageType.nonVolatile);
			vacm.addViewTreeFamily(new OctetString("testNotifyView"),
					new OID("1.3.6.1.2"),
					new OctetString(), VacmMIB.vacmViewIncluded,
					StorageType.nonVolatile);
	
		}

		@Override
		protected void registerManagedObjects() {
			//
		}

		public void registerManagedObjects(ManagedObject mo) throws DuplicateRegistrationException {
			server.register(mo, null);
		}

	    public void unregisterManagedObject(MOGroup moGroup) {
	        moGroup.unregisterMOs(server, getContext(moGroup));
	    }

		
		@Override
		protected void unregisterManagedObjects() {
			//
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
	
	@JSFunction
	public Object getJavaAgent() {
		return agent;
	}

	@JSFunction
	public Object getJavaSNMP() {
		return snmp;
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
