/**       
 *	   Licensed to the Apache Software Foundation (ASF) under one
 *     or more contributor license agreements.  See the NOTICE file
 *     distributed with this work for additional information
 *     regarding copyright ownership.  The ASF licenses this file
 *     to you under the Apache License, Version 2.0 (the
 *     "License"); you may not use this file except in compliance
 *     with the License.  You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing,
 *     software distributed under the License is distributed on an
 *     "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *     KIND, either express or implied.  See the License for the
 *     specific language governing permissions and limitations
 *     under the License.
 */
package com.nwu.httpd.responses;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import com.nwu.httpd.Codes;
import com.nwu.httpd.HTTPd;
import com.nwu.httpd.IHTTPd;
import com.nwu.httpd.NanoHTTPD.Response.IStatus;
import com.nwu.httpd.Request;
import com.nwu.log.Log;
import java.lang.String;

/**
 * HTTP response.
 * (based on code from NanoHTTPD)
 * 
 * Return one of these from serve().
 */
public abstract class Response {
	protected IHTTPd httpd;
	protected Log log;
	protected String rURI;
	protected Map<String, String> props;
	protected long size = -1;
	
	/**
	 * Create a response object based on a server context and request
	 * 
	 * @param httpd The httpd server context
	 * @param request The request
	 */
	public Response(IHTTPd httpd, String rURI) {
		this.httpd = httpd;
		this.log = httpd.getLog();
		this.rURI = rURI;
	}
	
	public abstract void execute(Request request);
	
	/**
	 * Register a Response class. This should be overridden and implemented
	 * by subclasses.
	 * 
	 * @param uri The registered uri
	 */
	public static void register(IHTTPd httpd, String uri, Map<String, String> props) {
		httpd.registerURIResponse(uri, Response.class, props);
	}
	
	/**
	 * Default constructor: response = HTTP_OK, data = mime = 'null'
	 */
	public Response(IHTTPd httpd) {
		this.httpd = httpd;
		this.status = Codes.HTTP_OK;
		this.log = httpd.getLog();
	}

	/**
	 * Basic constructor.
	 */
	public Response(IHTTPd httpd, IStatus status, String mimeType, InputStream data) {
		this.httpd = httpd;
		this.status = status;
		this.mimeType = mimeType;
		this.data = data;
		this.log = httpd.getLog();
	}

	/**
	 * Convenience method that makes an InputStream out of
	 * given text.
	 */
	public Response(IHTTPd httpd, IStatus status, String mimeType, String txt) {
		this.httpd = httpd;
		this.status = status;
		this.mimeType = mimeType;
		this.data = new ByteArrayInputStream( txt.getBytes());
		this.log = httpd.getLog();
		this.size = txt.length();
	}

	public Response(IHTTPd httpd, String rUri, Map<String, String> props) {
		this.httpd = httpd;
		this.props = props;
		this.rURI = rUri;
		this.log = httpd.getLog();
	}

	/**
	 * Build a NanoHTTPD response
	 * 
	 * @return
	 */
	public com.nwu.httpd.NanoHTTPD.Response getResponse() {
		com.nwu.httpd.NanoHTTPD.Response response = new com.nwu.httpd.NanoHTTPD.Response(status, mimeType, data, size);
		for(String key : header.keySet()) {
			response.addHeader(key, header.get(key));
		}
		return response;
	}
	
	/**
	 * Adds given line to the header.
	 */
	public void addHeader(String name, String value ) {
		header.put( name, value );
	}

	/**
	 * HTTP status code after processing, e.g. "200 OK", HTTP_OK
	 */
	protected IStatus status = null;

	/**
	 * MIME type of content, e.g. "text/html"
	 */
	protected String mimeType = null;

	/**
	 * Data of the response, may be null.
	 */
	protected InputStream data = null;

	/**
	 * Headers for the HTTP response. Use addHeader()
	 * to add lines.
	 */
	protected Map<String, String> header = new HashMap<String, String>();

	public IStatus getStatus() {
		return status;
	}

	public String getMimeType() {
		return mimeType;
	}

	public Map<String, String> getHeader() {
		return header;
	}

	public InputStream getData() {
		return data;
	}
	
}

