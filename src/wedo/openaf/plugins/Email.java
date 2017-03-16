package wedo.openaf.plugins;

import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.spec.InvalidKeySpecException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;

import wedo.openaf.AFCmdBase;

import org.apache.commons.mail.DefaultAuthenticator;
import org.apache.commons.mail.EmailAttachment;
import org.apache.commons.mail.EmailException;
import org.apache.commons.mail.MultiPartEmail;
import org.apache.commons.net.smtp.AuthenticatingSMTPClient;

/**
 * 
 * @author Nuno Aguiar <nuno.aguiar@wedotechnologies.com>
 *
 */
public class Email extends ScriptableObject {
	/**
	 * 
	 */
	private static final long serialVersionUID = -8942152353941864969L;
	protected String server;
	protected String sender = "openaf@wedotechnologies.com";
	protected boolean secureProto;
	protected String login;
	protected String pass;
	protected int port = -1;
	protected MultiPartEmail email;
	protected String contentType = null;
	protected AuthenticatingSMTPClient.AUTH_METHOD credMethod;
	protected Map<String, String> headers = new ConcurrentHashMap<String, String>();
	protected boolean tlssecure;
	
	/**
	 * 
	 */
	@Override
	public String getClassName() {
		return "Email";
	}

	/**
	 * <odoc>
	 * <key>Email.email(aServer, aSenderAddress, shouldSecure)</key>
	 * Creates a Email object instance using the aServer SMTP server to send
	 * email with the from field set to aSenderAddress. Optionally you can specify if a secure protocol (TLS/SSL) should be
	 * used with shouldSecure = true.
	 * </odoc>
	 */
	@JSConstructor
	public void newEmail(String server, String sender, boolean shouldSecure, boolean tlssecure) {
		this.secureProto = shouldSecure;
		this.sender = sender;
		this.server = server;
		this.tlssecure = tlssecure;
		newEmailObj();
	}
	
	protected void newEmailObj() {
		this.email = new MultiPartEmail();
		if (secureProto) this.setSecure(true, this.tlssecure);
		email.setHostName(this.server);
		this.contentType = null;
	}
	
	/**
	 * <odoc>
	 * <key>Email.setPort(aPort)</key>
	 * Sets aPort to contact the SMTP server.
	 * </odoc>
	 */
	@JSFunction
	public Email setPort(int port) {
		this.port = port;
		email.setSmtpPort(port);
		return this;
	}
	
	/**
	 * <odoc>
	 * <key>Email.setCredentials(aLogin, aPassword, aProtocol)</key>
	 * Sets the credentials to use when using a SMTP server which activates the use of a secure protocol (TLS/SSL) if available.
	 * </odoc>
	 */
	@JSFunction
	public Email setCredentials(String aLogin, String aPassword) {
		this.login = aLogin;
		this.pass = AFCmdBase.afc.dIP(aPassword);
		return this;
	}
	
	/**
	 * 
	 * @param headers2
	 * @return
	 */
	protected String hashMap2String(Map<String, String> headers2) {
		StringBuilder s = new StringBuilder();
		for(Object key : headers2.keySet()) {
			s.append((String) key + ": " + headers2.get(key) + "\n");
		}
		return s.toString();
	}
	
	/**
	 * <odoc>
	 * <key>Email.addHeader(aKey, aValue) : Email</key>
	 * Add a SMTP header with aKey and the corresponding aValue. 
	 * </odoc>
	 */
	@JSFunction
	public Email addHeader(String key, String value) {
		headers.put(key, value);
		return this;
	}
	
	/**
	 * <odoc>
	 * <key>Email.addHTMLHeader() : Email</key>
	 * Adds the necessary headers to support HTML contents. 
	 * </odoc>
	 */
	@JSFunction
	public Email addHTMLHeader() {
		//headers.put("MIME-Version", "1.0");
		//headers.put("Content-Type", "text/html; charset=ISO-8859-1");
		//email.updateContentType("text/html; charset=ISO-8859-1");
		this.contentType = "text/html; charset=ISO-8859-1";
		
		return this;
	}
	
	/**
	 * <odoc>
	 * <key>Email.addTo(aToOrList) : Email</key>
	 * Sets the current email "To" email address or an array of "To" email addresses.
	 * </odoc>
	 */
	@JSFunction
	public Email addTo(Object toList) throws EmailException {
		if (toList instanceof NativeArray) {
			for (Object recp : (NativeArray) toList) {
				email.addTo((String) recp);
			}
		} else {
			email.addTo((String) toList);
		}
		
		return this;
	}
	
	/**
	 * <odoc>
	 * <key>Email.addCc(aCcOrList) : Email</key>
	 * Sets the current email cc email address or an array of cc email addresses.
	 * </odoc>
	 */
	@JSFunction
	public Email addCc(Object toList) throws EmailException {
		if (toList instanceof NativeArray) {
			for (Object recp : (NativeArray) toList) {
				email.addCc((String) recp);
			}
		} else {
			email.addCc((String) toList);
		}
		
		return this;
	}
	
	/**
	 * <odoc>
	 * <key>Email.addBcc(aBccOrList) : Email</key>
	 * Sets the current email bcc email address or an array of bcc email addresses.
	 * </odoc>
	 */
	@JSFunction
	public Email addBcc(Object toList) throws EmailException {
		if (toList instanceof NativeArray) {
			for (Object recp : (NativeArray) toList) {
				email.addBcc((String) recp);
			}
		} else {
			email.addBcc((String) toList);
		}
		
		return this;
	}
	
	/**
	 * <odoc>
	 * <key>Email.setFrom(aFrom) : Email</key>
	 * Sets the current email aFrom email address.
	 * </odoc>
	 */
	@JSFunction
	public Email setFrom(String aFrom) throws EmailException {
		email.setFrom(aFrom);
		return this;
	}
	
	/**
	 * <odoc>
	 * <key>Email.setCharset(aCharset) : Email</key>
	 * Sets the current email aCharset to use.
	 * </odoc>
	 */
	@JSFunction
	public Email setCharset(String charset) {
		email.setCharset(charset);
		return this;
	}
	
	/**
	 * <odoc>
	 * <key>Email.getEmailObj() : JavaObject</key>
	 * Returns the internal Java object used to composed the email message for advance usage.
	 * See more in https://commons.apache.org/proper/commons-email/apidocs/org/apache/commons/mail/Email.html.
	 * </odoc>
	 */
	@JSFunction
	public Object getEmailObj() {
		return email;
	}
	
	/**
	 * <odoc>
	 * <key>Email.setMessage(aMessage) : Email</key>
	 * Sets the current email body message to send (raw). Please use Email.setContent to specify the mime type.
	 * </odoc>
	 */
	@JSFunction
	public Email setMessage(String message) throws EmailException {
		if (this.contentType == null) {
			email.setMsg(message);
		} else { 
			this.setContent(message, contentType);
		}
		return this;
	}
	
	/**
	 * <odoc>
	 * <key>Email.setContent(aContent, aContentType) : Email</key>
	 * Sets the current email body message to send with aContent string. Specifies also that the corresponding 
	 * content type is aContentType.
	 * </odoc>
	 */
	public Email setContent(String content, String contentType) {
		email.setContent((Object) content, contentType);
		return this;
	}
	
	/**
	 * <odoc>
	 * <key>Email.addAttachment(aPath, isInline) : Email</key>
	 * Adds aPath file as an attachment for the current email. Optionally you can specify
	 * if it's an inline (isInline) attachment. 
	 * </odoc>
	 */
	@JSFunction
	public Email addAttachment(String attach, boolean inline) throws EmailException {
		EmailAttachment attachment = new EmailAttachment();
		attachment.setPath(attach);	
		if (inline)
			attachment.setDisposition(EmailAttachment.INLINE);
		else
			attachment.setDisposition(EmailAttachment.ATTACHMENT);
		email.attach(attachment);
				
		return this;
	}
	
	/**
	 * <odoc>
	 * <key>Email.setSecure(shouldSecure, useTLS) : Email</key>
	 * Sets if should use TLS/SSL when connecting to a email server. Do specify with useTLS = true if you 
	 * want to establish a connection using TLS instead of SSL.
	 * </odoc>
	 */
	@JSFunction
	public Email setSecure(boolean secure, boolean tls) {
		this.secureProto = true;
		if (!tls)
			email.setSSLOnConnect(secure);
		else
			email.setStartTLSEnabled(secure);
		return this;
	}
	
	/**
	 * <odoc>
	 * <key>Email.setSubject(aSubject) : Email</key>
	 * Sets the email's aSubject;
	 * </odoc>
	 */
	@JSFunction
	public Email setSubject(String subject) {
		email.setSubject(subject);
		return this;
	}
	
	/**
	 * <odoc>
	 * <key>Email.send(aSubject, aMessage, aToList, aCCList, aBCCList, aSender) : String</key>
	 * Sends an email with aSubject and aMessage to the provided array of aToList,
	 * aCCList and aBCCList. Optionally you can specify a from address in aSender, otherwise
	 * the default for this object instance will be used. Returns the id of the message sent.
	 * </odoc>
	 */
	@JSFunction
	public String send(Object asubject, String message, NativeArray toList, NativeArray ccList, NativeArray bccList, String thisSender) throws IOException, NoSuchAlgorithmException, InvalidKeyException, InvalidKeySpecException, EmailException {		
		if (asubject != null && !(asubject instanceof Undefined)) {
			this.setSubject((String) asubject)
			    .setMessage(message)
			    .addTo(toList)
			    .addCc(ccList)
			    .addBcc(bccList);
			
			String localSender;
			if (thisSender != null && !thisSender.equals("undefined")) {
				localSender = thisSender;
			} else {
				localSender = this.sender;
			}
			
			this.setFrom(localSender);
		}
		
		for(Object key : headers.keySet()) {
			email.addHeader((String) key, headers.get(key));
		}
		
		if (this.port <= 0) {
			if (email.isSSLOnConnect()) 
				this.port = 465;
			else
				if (email.isStartTLSEnabled())
					this.port = 587;
				else
					this.port = 25;
		}
		
		email.setSslSmtpPort(String.valueOf(this.port));
		email.setSmtpPort(this.port);
		
		if (this.login != null) email.setAuthenticator(new DefaultAuthenticator(this.login, this.pass));
		String res;
		
		res = email.send();
				
		newEmailObj();
		
		return res;
	}
}
