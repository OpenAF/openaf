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
import java.io.FileInputStream;

import com.nwu.httpd.IHTTPd;
import com.nwu.httpd.NanoHTTPD.Response.IStatus;
import com.nwu.httpd.Request;

import java.lang.String;

public class SimpleResponse extends Response {

	public SimpleResponse(IHTTPd httpd, IStatus status, String mimeType,
			String txt) {
		super(httpd, status, mimeType, new ByteArrayInputStream( txt.getBytes()));
	}

	public SimpleResponse(IHTTPd httpd, IStatus httpOk, String mime,
			FileInputStream fis) {
		super(httpd, httpOk, mime, fis);
	}

	@Override
	public void execute(Request request) {

	}

}
