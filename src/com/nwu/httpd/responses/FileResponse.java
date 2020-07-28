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

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.net.URLEncoder;
import java.util.Map;
import java.util.Properties;
import java.util.StringTokenizer;

import com.nwu.httpd.Codes;
import com.nwu.httpd.HTTPd;
import com.nwu.httpd.IHTTPd;
import com.nwu.httpd.Request;
import com.nwu.log.Log.Type;
import java.lang.String;

public class FileResponse extends Response {
	protected String fileLocation = ".";
	
	public String getFileLocation() {
		return fileLocation;
	}

	public void setFileLocation(String fileLocation) {
		this.fileLocation = fileLocation;
	}

	public FileResponse(IHTTPd httpd, String rUri, Map<String, String> props) {
		super(httpd, rUri, props);
	}
	
	protected String HTML_STYLE = "<style type=\"text/css\"> " + 
                           "body {background-color: #ffffff; color: #000000;}"+
                           "body, td, th, h1, h2 {font-family: sans-serif;}"+
                           "pre {margin: 0px; font-family: monospace;}"+
                           "a:link {color: #000099; text-decoration: none; background-color: #ffffff;}"+
                           "a:hover {text-decoration: underline;}"+
                           "table {border-collapse: collapse;}"+
                           ".center {text-align: center;}"+
                           ".center table { margin-left: auto; margin-right: auto; text-align: left;}"+
                           ".center th { text-align: center !important; }"+
                           "td, th { border: 1px solid #000000; font-size: 75%; vertical-align: baseline;}"+
                           "h1 {font-size: 150%;}"+
                           "h2 {font-size: 125%;}"+
                           ".p {text-align: left;}"+
                           ".e {background-color: #ccccff; font-weight: bold; color: #000000;}"+
                           ".h {background-color: #9999cc; font-weight: bold; color: #000000;}"+
                           ".v {background-color: #cccccc; color: #000000;}"+
                           "i {color: #666666; background-color: #cccccc;}"+
                           "img {float: right; border: 0px;}"+
                           "hr {width: 600px; background-color: #cccccc; border: 0px; height: 1px; color: #000000;}"+
                           "</style>";
	
	// ==================================================
	// File server code
	// ==================================================

	/**
	 * Serves file from homeDir and its' subdirectories (only). Uses only URI,
	 * ignores all headers and HTTP parameters.
	 */
	public com.nwu.httpd.responses.Response serveFile(String uri,
			Map<String, String> header, File homeDir, boolean allowDirectoryListing) {
		
		uri = uri.replaceFirst(this.rURI, "");
		
		// Make sure we won't die of an exception later
		if (!homeDir.isDirectory())
			return new com.nwu.httpd.responses.SimpleResponse(httpd,
					Codes.HTTP_INTERNALERROR, Codes.MIME_PLAINTEXT,
					"INTERNAL ERRROR: serveFile(): given homeDir is not a directory.");

		// Remove URL arguments
		uri = uri.trim().replace(File.separatorChar, '/');
		if (uri.indexOf('?') >= 0)
			uri = uri.substring(0, uri.indexOf('?'));

		// Prohibit getting out of current directory
		if (uri.startsWith("..") || uri.endsWith("..")
				|| uri.indexOf("../") >= 0)
			return new com.nwu.httpd.responses.SimpleResponse(httpd,
					Codes.HTTP_FORBIDDEN, Codes.MIME_PLAINTEXT,
					"FORBIDDEN: Won't serve ../ for security reasons.");

		File f = new File(homeDir, uri);
		if (!f.exists())
			return new com.nwu.httpd.responses.SimpleResponse(httpd,
					Codes.HTTP_NOTFOUND, Codes.MIME_PLAINTEXT,
					"Error 404, file not found.");

		// List the directory, if necessary
		if (f.isDirectory()) {
			// Browsers get confused without '/' after the
			// directory, send a redirect.
			if (!uri.endsWith("/")) {
				uri += "/";
//				com.nwu.httpd.responses.Response r = new com.nwu.httpd.responses.SimpleResponse(
//						httpd, Codes.HTTP_REDIRECT, Codes.MIME_HTML,
//						"<html><head><meta http-equiv=\"refresh\" content=\"0; url=" + this.rURI + uri + "\"></head>"+HTML_STYLE+"<body>Redirected: <a href=\"" + this.rURI + uri + "\">"
//								+ this.rURI + uri + "</a></body></html>");
//				r.addHeader("Location", this.rURI + uri);
//				return r;
			}

			this.rURI = this.rURI.replaceAll("/+", "/");
			uri = uri.replaceAll("/+",  "/");
			
			// First try index.html and index.htm
			if (new File(f, "index.html").exists())
				f = new File(homeDir, uri + "/index.html");
			else if (new File(f, "index.htm").exists())
				f = new File(homeDir, uri + "/index.htm");
			// No index file, list the directory
			else if (allowDirectoryListing) {
				String[] files = f.list();
				String msg = "<html>"+HTML_STYLE+"<body><h1>Directory " + uri + "</h1><br/>";

				if (uri.length() > 1) {
					String u = uri.substring(0, uri.length() - 1);
					int slash = u.lastIndexOf('/');
					if (slash >= 0 && slash < u.length())
						msg += "<b><a href=\"" + encodeUri(uri.substring(0, slash + 1))
								+ "\">..</a></b><br/>";
				}

				for (int i = 0; i < files.length; ++i) {
					File curFile = new File(f, files[i]);
					boolean dir = curFile.isDirectory();
					if (dir) {
						msg += "<b>";
						files[i] += "/";
					}

					msg += "<a href=\"" + encodeUri(uri + files[i]) + "\">"
							+ files[i] + "</a>";

					// Show file size
					if (curFile.isFile()) {
						long len = curFile.length();
						msg += " &nbsp;<font size=2>(";
						if (len < 1024)
							msg += curFile.length() + " bytes";
						else if (len < 1024 * 1024)
							msg += curFile.length() / 1024 + "."
									+ (curFile.length() % 1024 / 10 % 100)
									+ " KB";
						else
							msg += curFile.length() / (1024 * 1024) + "."
									+ curFile.length() % (1024 * 1024) / 10
									% 100 + " MB";

						msg += ")</font>";
					}
					msg += "<br/>";
					if (dir)
						msg += "</b>";
				}
				return new com.nwu.httpd.responses.SimpleResponse(httpd,
						Codes.HTTP_OK, Codes.MIME_HTML, msg);
			} else {
				return new com.nwu.httpd.responses.SimpleResponse(httpd,
						Codes.HTTP_FORBIDDEN, Codes.MIME_PLAINTEXT,
						"FORBIDDEN: No directory listing.");
			}
		}

		try {
			// Get MIME type from file name extension, if possible
			String mime = null;
			int dot = f.getCanonicalPath().lastIndexOf('.');
			if (dot >= 0)
				mime = (String) Codes.theMimeTypes.get(f.getCanonicalPath()
						.substring(dot + 1).toLowerCase());
			if (mime == null)
				mime = Codes.MIME_DEFAULT_BINARY;

			// Support (simple) skipping:
			long startFrom = 0;
			String range = header.get("range");
			if (range != null) {
				if (range.startsWith("bytes=")) {
					range = range.substring("bytes=".length());
					int minus = range.indexOf('-');
					if (minus > 0)
						range = range.substring(0, minus);
					try {
						startFrom = Long.parseLong(range);
					} catch (NumberFormatException nfe) {
					}
				}
			}

			FileInputStream fis = new FileInputStream(f);
			fis.skip(startFrom);
			com.nwu.httpd.responses.Response r = new com.nwu.httpd.responses.SimpleResponse(
					httpd, Codes.HTTP_OK, mime, fis);
			r.addHeader("Content-length", "" + (f.length() - startFrom));
			r.addHeader("Content-range", "" + startFrom + "-"
					+ (f.length() - 1) + "/" + f.length());
			return r;
		} catch (IOException ioe) {
			return new com.nwu.httpd.responses.SimpleResponse(httpd,
					Codes.HTTP_FORBIDDEN, Codes.MIME_PLAINTEXT,
					"FORBIDDEN: Reading file failed.");
		}
	}

	/**
	 * URL-encodes everything between "/"-characters. Encodes spaces as '%20'
	 * instead of '+'.
	 */
	private String encodeUri(String uri) {
		String newUri = this.rURI;
		StringTokenizer st = new StringTokenizer(uri, "/ ", true);
		while (st.hasMoreTokens()) {
			String tok = st.nextToken();
			if (tok.equals("/"))
				newUri += "/";
			else if (tok.equals(" "))
				newUri += "%20";
			else {
				newUri += URLEncoder.encode(tok);
				// For Java 1.4 you'll want to use this instead:
				// try { newUri += URLEncoder.encode( tok, "UTF-8" ); } catch (
				// UnsupportedEncodingException uee )
			}
		}
		return newUri;
	}

	@Override
	public void execute(Request request) {
		String uri = request.getUri();
		log.log(Type.DEBUG, "URI = " + uri);
		log.log(Type.DEBUG, "Method = " + request.getMethod());
		
		if (props.containsKey("publichtml")) fileLocation = props.get("publichtml");
		log.log(Type.DEBUG, "publichtml = " + fileLocation);

		Response r = serveFile(uri, request.getHeader(), new File(fileLocation), true);
		
		this.status = r.status;
		this.mimeType = r.mimeType;
		this.header = r.header;
		this.data = r.data;
	}


}
