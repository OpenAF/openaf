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
package com.nwu.httpd;

import java.util.Map;
import java.util.Properties;
import java.lang.String;

import com.nwu.httpd.NanoHTTPD.Method;

public class Request {
	String uri;
	String originalURI;
	MethodType method;
	Map<String, String> header;
	Map<String, String> params;
	Map<String, String> files;
	
	public enum MethodType {
		GET,
		PUT,
		POST,
		UPDATE,
		DELETE,
		HEAD,
		OPTIONS
	}
	
	public MethodType strMethod2Type(Method method) {
		MethodType mtype = null;
		
		if (method.toString().equalsIgnoreCase(MethodType.GET.toString())) {
			return MethodType.GET;
		} else if (method.toString().equalsIgnoreCase(MethodType.POST.toString())) {
			return MethodType.POST;
		} else if (method.toString().equalsIgnoreCase(MethodType.UPDATE.toString())) {
			return MethodType.UPDATE;
		} else if (method.toString().equalsIgnoreCase(MethodType.DELETE.toString())) {
			return MethodType.DELETE;
		} else if (method.toString().equalsIgnoreCase(MethodType.HEAD.toString())) {
			return MethodType.HEAD;
		} else if (method.toString().equalsIgnoreCase(MethodType.OPTIONS.toString())) {
			return MethodType.OPTIONS;
		} else if (method.toString().equalsIgnoreCase(MethodType.PUT.toString())) {
			return MethodType.PUT;
		}
		
		return mtype;
	}
	
	public Request(String uri, Method method, Map<String, String> headers, Map<String, String> parms, Map<String, String> files, String originalURI) {
		this.uri = uri;
		this.method = strMethod2Type(method);
		this.header = headers;
		this.params = parms;
		this.files = files;
		this.originalURI = originalURI;
	}
	
	public String getUri() {
		return uri;
	}

	public void setUri(String uri) {
		this.uri = uri;
	}

	public String getOriginalURI() {
		return originalURI;
	}

	public void setOriginalURI(String ouri) {
		this.originalURI = ouri;
	}
	
	public MethodType getMethod() {
		return method;
	}

	public void setMethod(MethodType method) {
		this.method = method;
	}

	public Map<String, String> getHeader() {
		return header;
	}

	public void setHeader(Map<String, String> header) {
		this.header = header;
	}

	public Map<String, String> getParams() {
		return params;
	}

	public void setParams(Map<String, String> params) {
		this.params = params;
	}
	
	public void setFiles(Map<String, String> files) {
		this.files = files;
	}
	
	public Map<String, String> getFiles() {
		return files;
	}

}
