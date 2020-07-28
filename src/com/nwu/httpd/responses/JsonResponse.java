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
import java.util.HashMap;
import java.util.Map;
import org.json.JSONObject;

import com.nwu.httpd.Codes;
import com.nwu.httpd.IHTTPd;
import com.nwu.httpd.Request;
import java.lang.String;

public class JsonResponse extends Response {
	protected HashMap<OperationKey, JsonAnswer> answers4Key = new HashMap<OperationKey, JsonAnswer>();
	
	public class OperationKey {
		public String operationKey;
		public String key;
		
		public OperationKey(String operationKey, String key) {
			this.operationKey = operationKey;
			this.key = key;
		}
	}
	
	public abstract class JsonAnswer {
		public abstract JSONObject answer(Map<String, String> params);
	}
	
	public JsonResponse(IHTTPd httpd, String rUri, Map<String, String> props) {
		super(httpd, rUri, props);
	}

	@Override
	public void execute(Request request) {
		StringBuffer out = new StringBuffer();
		
		//out.append(res.toString());
		searchKey:
		for(OperationKey key : answers4Key.keySet()) {
			if (request.getParams().containsKey(key.operationKey)) {
				if (request.getParams().get(key.operationKey).equals(key.key)) { 
					out.append(answers4Key.get(key).answer(request.getParams()));
					break searchKey;
				}
			}
		}
		
		mimeType = Codes.MIME_JSON;
		status = Codes.HTTP_OK;
		data = new ByteArrayInputStream( out.toString().getBytes());
	}
	
	public void add(String operationKey, String key, JsonAnswer answer) {
		answers4Key.put(new OperationKey(operationKey, key), answer);
	}

}
