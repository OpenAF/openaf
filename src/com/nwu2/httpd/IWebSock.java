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
package com.nwu2.httpd;

import java.io.IOException;
import java.lang.String;

import com.nwu2.httpd.NanoWSD.WebSocketFrame;
import com.nwu2.httpd.NanoWSD.WebSocketFrame.CloseCode;

public interface IWebSock {
    public void oOpen(com.nwu2.httpd.NanoWSD.WebSocket s);
    public void oClose(com.nwu2.httpd.NanoWSD.WebSocket s, CloseCode code, String reason, boolean initiatedByRemote);
    public void oMessage(com.nwu2.httpd.NanoWSD.WebSocket s, WebSocketFrame message);
    public void oPong(com.nwu2.httpd.NanoWSD.WebSocket s, WebSocketFrame pong);
    public void oException(com.nwu2.httpd.NanoWSD.WebSocket s, IOException exception);
};