package com.nwu.httpd;

import java.util.HashMap;
import java.util.Map;

import com.nwu.httpd.NanoHTTPD.Response;
import com.nwu.log.Log;

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
	public boolean useGzipWhenAccepted(Response r);
}
