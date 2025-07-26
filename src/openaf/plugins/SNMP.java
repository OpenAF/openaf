package openaf.plugins;

import java.io.IOException;
import java.lang.String;
import java.math.BigInteger;
import java.util.Arrays;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.NativeJavaObject;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;
import org.mozilla.javascript.ConsString;
import org.snmp4j.AbstractTarget;
import org.snmp4j.CommunityTarget;
import org.snmp4j.PDU;
import org.snmp4j.ScopedPDU;
import org.snmp4j.Snmp;
import org.snmp4j.Target;
import org.snmp4j.TransportMapping;
import org.snmp4j.UserTarget;
import org.snmp4j.event.ResponseEvent;
import org.snmp4j.mp.MPv3;
import org.snmp4j.mp.SnmpConstants;
import org.snmp4j.security.SecurityLevel;
import org.snmp4j.security.SecurityModels;
import org.snmp4j.security.SecurityProtocols;
import org.snmp4j.security.USM;
import org.snmp4j.security.UsmUser;
import org.snmp4j.smi.Address;
import org.snmp4j.smi.Counter32;
import org.snmp4j.smi.GenericAddress;
import org.snmp4j.smi.Integer32;
import org.snmp4j.smi.Null;
import org.snmp4j.smi.OID;
import org.snmp4j.smi.OctetString;
import org.snmp4j.smi.TimeTicks;
import org.snmp4j.smi.UnsignedInteger32;
import org.snmp4j.smi.VariableBinding;
import org.snmp4j.transport.DefaultTcpTransportMapping;
import org.snmp4j.transport.DefaultUdpTransportMapping;

import openaf.AFCmdBase;
import openaf.SimpleLog;
import openaf.SimpleLog.logtype;

/**
 * 
 * Copyright 2023 Nuno Aguiar
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
	protected String securityName;
	protected OID authProtocol = org.snmp4j.security.AuthSHA.ID;
	protected String authPassphrase;
	protected OID privProtocol = org.snmp4j.security.PrivDES.ID;
	protected String privPassphrase;
	protected int version;
	protected byte[] engineID;
	protected TransportMapping<?> transport;

	/**
	 * 
	 */
	@Override
	public String getClassName() {
		return "SNMP";
	}

	/**
	 * <odoc>
	 * <key>SNMP.SNMP(anAddress, aCommunity, aTimeout, retries, version, securityMap)</key>
	 * Tries to establish a SNMP connection to the given address (anAddress in the form of udp:x.x.x.x/port) of a specific community (aCommunity (e.g public))
	 * with a provided timeout (aTimeout) and number of retries. You can also specify the version (2 or 3). For version 3
	 * you can also provide a securityMap with the following entries:\
	 * \
	 *    securityName   (String)\
	 *    authProtocol   (String) HMAC128SHA224, HMAC192SHA256, HMAC256SHA384, HMAC384SHA512, MD5, SHA\
	 *    privProtocol   (String) 3DES, AES128, AES192, AES256, DES\
	 *    authPassphrase (String)\
	 *    privPassphrase (String)\
	 *    engineId       (String) (in hex format only)\
	 * \
	 * </odoc>
	 */
	@JSConstructor
	public void newSNMP(String addr, String community, int tout, int ret, int version, Object security) throws Exception {
		if (addr == null) throw new Exception("No address was provided.");

		address = addr;
		if (tout <= 0) timeout = 1500; else timeout = tout; 
		if (ret <= 0) retries = 2; else retries = ret; 
		if (community != null) 
			this.community = new OctetString(community); 
		else 
			this.community = new OctetString("public");
		
		if (version <= 1) this.version = 2; else this.version = version;
		if (version >= 2 && security instanceof NativeObject) {
			NativeObject smap = (NativeObject) security;
			if (smap.containsKey("securityName")) this.securityName = (String) smap.get("securityName");

			if (smap.containsKey("engineId")) {
				// Converting the engineID from HEX to byte array (issue #267)
				byte tmpEngineId[] = (new BigInteger( ((String) smap.get("engineId")), 16)).toByteArray();
				// First byte from BigInteger needs to be discarded
				tmpEngineId = Arrays.copyOfRange(tmpEngineId, 1, tmpEngineId.length);
				this.engineID = tmpEngineId;
			}
		}
		if (version >= 3) {
			if (security instanceof NativeObject) {
				NativeObject smap = (NativeObject) security;
				if (smap.containsKey("authProtocol")) {
					switch((String) smap.get("authProtocol")) {
					case "HMAC128SHA224": authProtocol = org.snmp4j.security.AuthHMAC128SHA224.ID; break;
					case "HMAC192SHA256": authProtocol = org.snmp4j.security.AuthHMAC192SHA256.ID; break;
					case "HMAC256SHA384": authProtocol = org.snmp4j.security.AuthHMAC256SHA384.ID; break;
					case "HMAC384SHA512": authProtocol = org.snmp4j.security.AuthHMAC384SHA512.ID; break;
					case "MD5"          : authProtocol = org.snmp4j.security.AuthMD5.ID; break;
					case "SHA"          : authProtocol = org.snmp4j.security.AuthSHA.ID; break;
					default:
						throw new Exception("SNMP Auth protocol '" + (String) smap.get("authProtocol") + "' not supported (supported: HMAC128SHA224, HMAC192SHA256, HMAC256SHA384, HMAC384SHA51, MD5, SHA)");
					}
				}
				if (smap.containsKey("privProtocol")) {
					switch((String) smap.get("privProtocol")) {
					case "3DES"  : privProtocol = org.snmp4j.security.Priv3DES.ID; break;
					case "AES128": privProtocol = org.snmp4j.security.PrivAES128.ID; break;
					case "AES192": privProtocol = org.snmp4j.security.PrivAES192.ID; break;
					case "AES256": privProtocol = org.snmp4j.security.PrivAES256.ID; break;
					case "DES"   : privProtocol = org.snmp4j.security.PrivDES.ID; break;
					default:
						throw new Exception("SNMP Priv protocol '" + (String) smap.get("privProtocol") + "' not supported (supported: 3DES, AES128, AES192, AES256, DES)");
					}
				}
				if (smap.containsKey("authPassphrase")) {
					this.authPassphrase = openaf.AFCmdBase.afc.dIP((String) smap.get("authPassphrase"));	
				}
				if (smap.containsKey("privPassphrase")) {
					this.privPassphrase = openaf.AFCmdBase.afc.dIP((String) smap.get("privPassphrase"));	
				}
			}
		}
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
		if (this.snmp != null) this.snmp.close();
		if (this.transport != null) this.transport.close();

		if (address.startsWith("tcp")) {
			this.transport = new DefaultTcpTransportMapping();
		} else {
			this.transport = new DefaultUdpTransportMapping();
		}
		
		this.snmp = new Snmp(this.transport);
		if (this.version >= 3) {
			if (this.engineID == null) this.engineID = MPv3.createLocalEngineID();
			USM usm = new USM(SecurityProtocols.getInstance(), new OctetString(this.engineID), 0);
			SecurityModels.getInstance().addSecurityModel(usm);
			UsmUser user = new UsmUser(new OctetString(this.securityName), this.authProtocol, new OctetString(this.authPassphrase), this.privProtocol, new OctetString(this.privPassphrase));
			this.snmp.getUSM().addUser(user);
			this.snmp.setLocalEngine(new OctetString(this.engineID).getValue(), 0, 0);   // Making sure the local Engine ID is also set
		}

		this.transport.listen();
	}

	/**
	 * <odoc>
	 * <key>SNMP.close()</key>
	 * Closes the current connection and object.
	 * </odoc>
	 */
	@JSFunction
	public void close() {
		try {
			this.snmp.close();
			this.transport.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	/**
	 * <odoc>
	 * <key>SNMP.getJavaObject() : JavaObject</key>
	 * Returns the current internal Java object being used.
	 * </odoc>
	 */
	@JSFunction
	public Object getJavaObject() {
		return this.snmp;
	}

	/**
	 * 
	 * @return
	 */
	protected Target getTarget() {
		Address targetAddress = GenericAddress.parse(address);
		AbstractTarget target;
		if (this.authPassphrase != null || this.privPassphrase != null) {
			target = new UserTarget();
		} else {
			target = new CommunityTarget();
			((CommunityTarget) target).setCommunity(community);
		}
		
		target.setAddress(targetAddress);
		target.setRetries(retries);
		target.setTimeout(timeout);

		if (this.version == 2) target.setVersion(SnmpConstants.version2c);
		if (this.version == 3) target.setVersion(SnmpConstants.version3);
		if (this.securityName != null) target.setSecurityName(new OctetString(securityName));
		if (this.authPassphrase != null && this.privPassphrase == null) {
			target.setSecurityLevel(SecurityLevel.AUTH_NOPRIV);
		}
		if (this.authPassphrase != null && this.privPassphrase != null) {
			target.setSecurityLevel(SecurityLevel.AUTH_PRIV);
		}
		if (this.authPassphrase == null && this.privPassphrase == null) {
			target.setSecurityLevel(SecurityLevel.NOAUTH_NOPRIV);
		}
		return target;
	}
	
	public ResponseEvent getOIDs(OID oids[]) throws IOException {
		PDU pdu;
		
		if (this.version == 3)
			pdu = new ScopedPDU();
		else
			pdu = new PDU();
			
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

	/**
	 * <odoc>
	 * <key>SNMP.trap(aOID,aSysUpTime,  aDataArray, shouldInform)</key>
	 * Tries to send a trap based on aOID, an aSysUpTime and using aDataArray where each element should be a map with
	 * oid, type (i - integer, u - unsigned, c - counter32, s - string, x - hex string, d - decimal string, n - nullobj, o - objid, t - timeticks, a - ipaddress,) and value.
	 * Optionally you can determine if shouldInform instead of sending the trap.
	 * </odoc>
	 */
	@JSFunction
	public Object trap(String oid, double sysUpTime,  Object data, boolean inform) throws IOException {
		PDU trap;
		if (this.version >= 3) {
			trap = new ScopedPDU();
		} else {
			trap = new PDU();
		}
		if (!inform) 
			trap.setType(PDU.TRAP);
		else 
			trap.setType(PDU.INFORM);

		if (data instanceof NativeJavaObject)
			data = ((NativeJavaObject) data).unwrap();
		
		
		
        trap.add(new VariableBinding(SnmpConstants.sysUpTime, new TimeTicks((long)sysUpTime)));   
		
		OID ooid = new OID(oid);
		trap.add(new VariableBinding(SnmpConstants.snmpTrapOID, ooid));
		if (data instanceof NativeArray) {
			NativeArray no = (NativeArray) data;
			for(Object mentry : no) {
				if (mentry instanceof NativeObject) {
					NativeObject nmentry = (NativeObject) mentry;

					if (nmentry.containsKey("type") && nmentry.containsKey("value") && nmentry.containsKey("OID")) {
						// Value types: i - integer, u - unsigned, c - counter32, s - string, x - hex string, d - decimal string, n - nullobj, o - objid, t - timeticks, a - ipaddress, b - bits
						OID toid;
						if (nmentry.get("OID") instanceof String) {
							toid = new OID((String) nmentry.get("OID"));
						} else {
							toid = new OID(((ConsString) nmentry.get("OID")).toString());
						}
						// https://www.agentpp.com/doc/snmp4j-agent/org/snmp4j/agent/io/prop/PropertyMOInput.html
						switch((String) nmentry.get("type")) {
						case "i": 
							if (nmentry.get("value") instanceof java.lang.Double) {
								trap.add(new VariableBinding(toid, new Integer32(((Double) nmentry.get("value")).intValue())));
							} else {
								trap.add(new VariableBinding(toid, new Integer32((Integer) nmentry.get("value"))));
							}
							break;
						case "u": 
							if (nmentry.get("value") instanceof java.lang.Double) {
								trap.add(new VariableBinding(toid, new UnsignedInteger32(((Double) nmentry.get("value")).intValue())));
							} else {
								trap.add(new VariableBinding(toid, new UnsignedInteger32((Integer) nmentry.get("value"))));
							}
							break;
						case "c": 
							trap.add(new VariableBinding(toid, new Counter32((Integer) nmentry.get("value"))));
							break;
						case "n": 
							trap.add(new VariableBinding(toid, new Null()));
							break;
						case "o": 
							trap.add(new VariableBinding(toid, new OID((String) nmentry.get("value"))));
							break;
						case "t": 
							trap.add(new VariableBinding(toid, new TimeTicks((Integer) nmentry.get("value"))));
							break;
						case "a": 
							trap.add(new VariableBinding(toid, new TimeTicks((Integer) nmentry.get("value"))));
							break;
						case "b":
							// The BIT STRING type has been temporarily defined in RFC 1442 and obsoleted by RFC 2578. Use OctetString (i.e. BITS syntax) instead.
							break;
						case "d":
						case "s": 
						default:
							trap.add(new VariableBinding(toid, new OctetString((String) nmentry.get("value").toString())));
						}
					} else {
						System.out.println("ERR: doesn't have type, value and OID");
					}
				} else {
					System.out.println("ERR: Not a native object");
				}
			}
		} else {
			System.out.println("ERR: Not a native array");
		}

		return this.snmp.send(trap, getTarget());
	}
	
	


	/** <odoc>
	 * <key>SNMP.inform(aOID, aDataArray)</key>
	 * Tries to send an inform based on aOID and using aDataArray where each element should be a map with
	 * oid, type (i - integer, u - unsigned, c - counter32, s - string, x - hex string, d - decimal string, n - nullobj, o - objid, t - timeticks, a - ipaddress,) and value.
	 *  </odoc>
	 **/
	@JSFunction
	public Object inform(String oid, Object data) throws IOException {
		return this.trap(oid,0, data, true);
	}
}

