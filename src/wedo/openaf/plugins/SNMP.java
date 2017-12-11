package wedo.openaf.plugins;

import java.io.IOException;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;
import org.snmp4j.CommunityTarget;
import org.snmp4j.PDU;
import org.snmp4j.Snmp;
import org.snmp4j.Target;
import org.snmp4j.TransportMapping;
import org.snmp4j.event.ResponseEvent;
import org.snmp4j.mp.SnmpConstants;
import org.snmp4j.smi.Address;
import org.snmp4j.smi.GenericAddress;
import org.snmp4j.smi.OID;
import org.snmp4j.smi.OctetString;
import org.snmp4j.smi.VariableBinding;
import org.snmp4j.transport.DefaultTcpTransportMapping;
import org.snmp4j.transport.DefaultUdpTransportMapping;

import wedo.openaf.AFCmdBase;
import wedo.openaf.SimpleLog;
import wedo.openaf.SimpleLog.logtype;

/**
 * 
 * @author Nuno Aguiar
 *
 */
public class SNMP extends ScriptableObject {

	/**
	 * 
	 */
	private static final long serialVersionUID = 9163133329817783828L;
	protected Snmp snmp;
	protected String address;
	protected long timeout;
	protected int retries;
	protected OctetString community;

	/**
	 * 
	 */
	@Override
	public String getClassName() {
		return "SNMP";
	}

	/**
	 * <odoc>
	 * <key>SNMP.SNMP(anAddress, aCommunity, aTimeout, retries)</key>
	 * Tries to establish a SNMP connection to the given address (anAddress) of a specific community (aCommunity)
	 * with a provided timeout (aTimeout) and number of retries.
	 * </odoc>
	 */
	@JSConstructor
	public void newSNMP(String addr, String community, int tout, int ret) throws IOException {
		address = addr;
		if (tout <= 0) timeout = 1500; else timeout = tout; 
		if (ret <= 0) retries = 2; else retries = ret; 
		if (community != null) 
			this.community = new OctetString(community); 
		else 
			this.community = new OctetString("public");
		
		start();
	}
	
	/**
	 * <odoc>
	 * <key>SNMP.start()</key>
	 * Starts the client connection (usually already invoked by the SNMP constructor, so there shouldn't
	 * be a need to invoke it).
	 * </odoc>
	 */
	@JSFunction
	public void start() throws IOException {
		TransportMapping<?> transport;
		if (address.startsWith("tcp")) {
			transport = new DefaultTcpTransportMapping();
		} else {
			transport = new DefaultUdpTransportMapping();
		}
		
		snmp = new Snmp(transport);

		transport.listen();
	}
	
	/**
	 * 
	 * @return
	 */
	protected Target getTarget() {
		Address targetAddress = GenericAddress.parse(address);
		CommunityTarget target = new CommunityTarget();
		target.setCommunity(community);
		target.setAddress(targetAddress);
		target.setRetries(retries);
		target.setTimeout(timeout);
		target.setVersion(SnmpConstants.version2c);
		return target;
	}
	
	/**
	 * 
	 * @param oids
	 * @return
	 * @throws IOException
	 */
	public ResponseEvent getOIDs(OID oids[]) throws IOException {
		PDU pdu = new PDU();
		for(OID oid : oids) {
			pdu.add(new VariableBinding(oid));
		}
		pdu.setType(PDU.GET);
		ResponseEvent event = snmp.send(pdu, getTarget(), null);
		if (event != null) {
			return event;
		}
		throw new RuntimeException("GET timed out");
	}
	
	/**
	 * 
	 * @param oid
	 * @return
	 * @throws Exception 
	 */
	public VariableBinding[] getAsPDU(OID oid) throws Exception {
		ResponseEvent event = getOIDs(new OID[] { oid } ); 
		if (event != null) {
			if (event.getError() != null) {
				throw event.getError();
			}
		
			SimpleLog.log(logtype.DEBUG, "SNMP Event " + event.toString(), null);
			
			if (event.getResponse() != null) {
				//return event.getResponse().get(0).getVariable().toString();
				return event.getResponse().toArray();
			} else {
				throw new Exception("SNMP Request timeout");
			}
		}
		
		SimpleLog.log(logtype.DEBUG, "SNMP Event null", null);
		return null;
	}
	
	/**
	 * 
	 * @param oid
	 * @return
	 */
	public OID newOID(String oid) {
		return new OID(oid);
	}
	
	/**
	 * <odoc>
	 * <key>SNMP.get(aOID) : Object</key>
	 * Gets a value for the provided aOID (expects value to be string or convertible to string).
	 * </odoc>
	 */
	@JSFunction
	public Object get(String oid) throws Exception {
		VariableBinding[] vars = getAsPDU(newOID(oid));
		Context cx = (Context) AFCmdBase.jse.enterContext();
		Scriptable no = cx.newObject((Scriptable) AFCmdBase.jse.getGlobalscope());
		AFCmdBase.jse.exitContext();
		
		if (vars != null) {
			for(VariableBinding var : vars) {
				no.put(var.getOid().toString(), no, var.getVariable().toString());
			}
		}
		
		return no;
	}
}

