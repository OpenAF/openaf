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
import java.util.Map;
import com.nwu.httpd.Codes;
import com.nwu.httpd.IHTTPd;
import com.nwu.httpd.Request;
import java.lang.String;

/**
 * Echo response.
 * 
 * This a test response. It registers itself on the URI '/Echo' and provides
 * the request info (URI, method, header and params) for debugging and testing
 * proposes. 
 * 
 * @author Nuno Aguiar <nuno@aguiar.name>
 *
 */
public class EchoResponse extends Response {
	//public static final String URI = "/Echo";
	StringBuffer out;
	
	/**
	 * Creates a Echo response.
	 * 
	 * @param httpd The httpd server context.
	 * @param request The request.
	 */
	public EchoResponse(IHTTPd httpd, String rUri, Map<String, String> props) {
		super(httpd, rUri);
	}

	@Override
	public void execute(Request request) {
		out = new StringBuffer();
		out.append("Echo Response\n\n");
		out.append("URI = " + request.getUri() + "\n");
		out.append("Method = " + request.getMethod() + "\n");
		out.append("Header = " + request.getHeader().toString() + "\n");
		out.append("Params = " + request.getParams().toString() + "\n");
		
		this.status = Codes.HTTP_OK;
		this.mimeType = Codes.MIME_PLAINTEXT;
		this.data = new ByteArrayInputStream( out.toString().getBytes());
	}
	
	/**
	 * Registers EchoResponse on the "/Echo" URI
	 * 
	 */
//	public static void register(String URI) {
//		HTTPd.registerURIResponse(URI, EchoResponse.class);
//	}
	
}
