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

import java.util.Hashtable;
import java.util.StringTokenizer;

import com.nwu.httpd.NanoHTTPD.Response.IStatus;

/**
 * Static html constant values.
 * 
 * <ul>
 *  <li>HTTP response codes</li>
 *  <li>MIME types</li>
 * </ul>
 * 
 * @author Nuno Aguiar <nuno@aguiar.name>
 *
 */
public class Codes {
	/**
	 * Some HTTP response status codes
	 */
	public static final IStatus
	HTTP_OK = com.nwu.httpd.NanoHTTPD.Response.Status.OK,
	HTTP_REDIRECT = com.nwu.httpd.NanoHTTPD.Response.Status.REDIRECT,
	HTTP_FORBIDDEN = com.nwu.httpd.NanoHTTPD.Response.Status.FORBIDDEN,
	HTTP_NOTFOUND = com.nwu.httpd.NanoHTTPD.Response.Status.NOT_FOUND,
	HTTP_BADREQUEST = com.nwu.httpd.NanoHTTPD.Response.Status.BAD_REQUEST,
	HTTP_INTERNALERROR = com.nwu.httpd.NanoHTTPD.Response.Status.INTERNAL_ERROR;

	/**
	 * Common mime types for dynamic content
	 */
	public static final String
	MIME_PLAINTEXT = "text/plain",
	MIME_HTML = "text/html",
	MIME_DEFAULT_BINARY = "application/octet-stream",
	MIME_JSON = "application/json";

	/**
	 * Hashtable mapping (String)FILENAME_EXTENSION -> (String)MIME_TYPE
	 */
	public static Hashtable theMimeTypes = new Hashtable();
	static
	{
		StringTokenizer st = new StringTokenizer(
			"htm		text/html "+
			"html		text/html "+
			"txt		text/plain "+
			"asc		text/plain "+
			"css		text/css "+
			"gif		image/gif "+
			"jpg		image/jpeg "+
			"jpeg		image/jpeg "+
			"png		image/png "+
			"mp3		audio/mpeg "+
			"m3u		audio/mpeg-url " +
			"pdf		application/pdf "+
			"doc		application/msword "+
			"ogg		application/x-ogg "+
			"zip		application/octet-stream "+
			"exe		application/octet-stream "+
			"class		application/octet-stream " );
		while ( st.hasMoreTokens())
			theMimeTypes.put( st.nextToken(), st.nextToken());
	}
}