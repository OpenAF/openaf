package com.nwu.httpd;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import javax.net.ssl.SSLServerSocketFactory;

import com.nwu.httpd.NanoHTTPD.Response;
import com.nwu.log.Log;
import java.lang.String;

public interface IHTTPd {
	
	public void registerURIResponse(String URI, Class<?> aClass, Map<String, String> props);
	public HashMap<String, Class> getURIresponses();
	
	public void setDefaultResponse(String defaultResponse);
	public String getDefaultResponse();
	
	public HashMap<String, Map<String, String>> getURIproperties();
	public Class<?> getURIresponse(String URI);
	public Map<String, String> getURIProps(String URI);
	public HashMap<String, Long> getURIhits();
	
	public int getMyTcpPort();
	public Log getLog();
	public int getListeningPort();
	
	public void addToGzipAccept(String mimetype);
	public void addToWsAccept(String uri);
	public boolean useGzipWhenAccepted(Response r);
	public void stop();
	public void makeSecure(SSLServerSocketFactory makeLocalSSLSocketFactory, String[] object);
	public void start() throws IOException;
	public boolean isAlive();
}
