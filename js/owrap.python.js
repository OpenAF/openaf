// OpenWrap v2
// Copyright 2023 Nuno Aguiar
// Python

OpenWrap.python = function() {
    var pen = getEnv("OAF_PYTHON");
    if (isDef(pen) && pen != "null") {
		this.python = pen; 
	} else {
		this.python = "python";
	}
	this.reset(true, isDef(pen) && pen != "null");
	this.cServer = $atomic();
	this.running = false;
	this.mode = "embedded"

	return ow.python;
};

OpenWrap.python.prototype.initCode = function(includeCoding) {
	if (isDef(this.token)) {
		var s = (includeCoding ? "# -*- coding: utf-8 -*-\n\n" : "");
		s += "import json\n";
		s += "import socket\n\n";
		s += "def _d(obj):\n";
		s += "   return json.dumps(obj)\n\n";
		s += "def _(e):\n";
		s += "   s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n";
		s += "   s.connect(('127.0.0.1', " + this.port + "))\n";
		s += "   sR = {'e':e,'t':'" + this.token + "'}\n";
		s += "   s.sendall(bytearray(json.dumps(sR) + '\\n', 'utf-8'))\n";
		s += "   res = ''\n";
		s += "   while True:\n";
		s += "      data = s.recv(1024).decode('utf-8')\n";
		s += "      if not data:\n";
		s += "         break\n";
		s += "      res += data\n";
		s += "   s.close()\n";
		s += "   if res.startswith('__OAF__Exception'):\n";
		s += "      raise Exception(res)\n";
		s += "   else:\n";
		s += "      try:\n"
		s += "         return json.loads(res)\n";
		s += "      except:\n";
		s += "         return None\n\n";
		s += "def _oaf(e):\n";
		s += "   return _(e)\n\n";
		s += "def _g(key):\n"
		s += "   return _(\"$get('\" + str(key) + \"')\")\n"
	    s += "def _s(key, value):\n"
		s += "   _(\"$set('\" + str(key) + \"', \" + _d(value) + \")\")\n\n"
		return s;
	} else {
		return "# -*- coding: utf-8 -*-\n\n";
	}
};

OpenWrap.python.prototype.startServer = function(aPort, aSendPort, aFn, isAlone) {
	isAlone = _$(isAlone, "isAlone").isBoolean().default(false)

	if (this.version >= 2 && this.version <= 3) {
		ow.python.cServer.inc();
		if (isUnDef(this.token)) {
			this.token = md5(nowNano());
			aFn = _$(aFn).isFunction().default((t, e) => { if (t == "error") printErr(e); });
	
			// Receive
			ow.loadServer();
			if (isUnDef(aPort)) aPort = findRandomOpenPort();
			this.port = aPort;
			this.server = ow.server.socket.start(aPort, (clt, srv) => { 
				aFn("connect", clt.getInetAddress().getHostAddress()); 
				ioStreamReadLines(clt.getInputStream(), stream => { 
					try { 
						var inR = jsonParse(stream), res = "";
						if (isDef(inR) && isDef(inR.e) && isDef(inR.t) && inR.t == this.token) {
							aFn("exec", inR);
							try {
								res = stringify(af.eval(inR.e),__, "");
							} catch(ee) {
								res = "__OAF__Exception: " + String(ee);
							}
						}
						ioStreamWrite(clt.getOutputStream(), res);
						clt.getOutputStream().flush();
						clt.shutdownInput();
						clt.shutdownOutput();
						return true; 
					} catch(e) { 
						aFn("error", e);
					} 
				}, "\n", false); 
				clt.close();
			}, __, "127.0.0.1");
	
			// Send
			if (!isAlone) {
				if (isUnDef(aSendPort)) aSendPort = findRandomOpenPort();
				this.sport = aSendPort;
				//this.pidfile = getOpenAFPath() + "/openaf_python.pid";
				this.pidfile = __gHDir().replace(/\\/g, "/") + "/.openaf_python.pid";
				var s = "# -*- coding: utf-8 -*-\n";
				s += "import json\n";
				s += "import sys\n";
				s += "import os\n";
				s += "\n";
				//s += "_newpid = os.fork()\n";
				//s += "if _newpid != 0:\n";
				//s += "  os._exit(os.EX_OK)\n";
				s += "if sys.version_info[0] == 2:\n";
				s += "  from StringIO import StringIO\n";
				s += "  import SocketServer\n";
				s += "  __h = SocketServer.BaseRequestHandler\n";
				s += "else:\n";
				s += "  from io import StringIO\n";
				s += "  import socketserver\n";
				s += "  __h = socketserver.BaseRequestHandler\n";
				s += "\n";
				s += "class oafHandler(__h):\n";
				s += "  def handle(self):\n";
				s += "      res = ''\n";
				s += "      self.request.settimeout(1500)\n";
				s += "      while True:\n";
				s += "          res += self.request.recv(1024).decode('utf-8')\n";
				s += "          if str(res).endswith('}\\n') or str(res) == '':\n";
				s += "              break\n";
				s += "      \n";
				s += "      try:\n";
				s += "          mm = json.loads(res)\n";
				s += "      except:\n";
				s += "          mm = {}\n";
				s += "      if 'exit' in mm.keys() and mm['t'] == '" + this.token + "':\n";
				s += "          os._exit(os.EX_OK)\n";
				s += "      if 'e' in mm.keys() and mm['t'] == '" + this.token + "':\n";
				s += "          myStdOut = StringIO()\n";
				s += "          myStdErr = StringIO()\n";
				s += "          sys.stdout = myStdOut\n";
				s += "          sys.stderr = myStdErr\n";
				s += "          try:\n";
				s += "              exec(mm['e'])\n";
				s += "              mm['stdout'] = myStdOut.getvalue()\n";
				s += "              mm['stderr'] = myStdErr.getvalue()\n";
				s += "          except:\n";
				s += "              mm['stderr'] = str(sys.exc_info())\n";
				s += "      try:\n";
				s += "        del mm['e']\n";		
				s += "        del mm['t']\n";
				s += "        self.request.sendall(json.dumps(mm).encode('utf-8'))\n";
				s += "      except:\n";
				s += "        pass\n";
				s += "\n";
				s += ow.python.initCode(false) + "\n\n";
				s += "_oafF = open('" + this.pidfile + "', 'w')\n";
				s += "_oafF.write(str(os.getpid()))\n";
				s += "_oafF.close()\n";
				s += "if sys.version_info[0] == 2:\n";
				s += "  server = SocketServer.ThreadingTCPServer(('127.0.0.1', " + aSendPort + "), oafHandler)\n";
				s += "else:\n";
				s += "  server = socketserver.ThreadingTCPServer(('127.0.0.1', " + aSendPort + "), oafHandler)\n";
				s += "server.serve_forever()\n";
				s += "\n";
		
				//af.sh(this.python + " -", s, __, __, __, __, __, __, true);
				plugin("Threads");
				this.__t = new Threads();
				var parent = this;
				this.__t.addSingleThread(function() {
					$sh([parent.python, "-c", s]).dontWait(false).get(0);
					return 1;
				});
				this.__t.startNoWait();
	
				ow.loadFormat(); var init = now();
				do {
					sleep(100, true);
				} while((now() - init) < 1500);
				sleep(150, true);
				ow.format.testPort("127.0.0.1", this.sport, 1500);
		
				addOnOpenAFShutdown(() => { ow.python.stopServer(__, true); });
			} else {
				this.mode = "standalone"
			}
		}
	
		return this.token;
	} else {
		throw "Can't start python 2 or 3.";
	}
};

OpenWrap.python.prototype.stopServer = function(aPort, force) {
	if (this.version >= 2 && this.version <= 3) {
		if (force || ow.python.cServer.get() > 0) {
			ow.python.cServer.dec();
			aPort = _$(aPort).isNumber().default(this.port);

			ow.server.socket.stop(aPort);

			if (this.mode != "standalone") {
				ow.loadObj()
				ow.obj.socket.string2string("127.0.0.1", this.sport, stringify({ exit: true, t: this.token }, __, "")+"\n")
				pidKill(io.readFileString(this.pidfile), true)
				this.__t.stop(true)
			}
			//this.threads.stop(true);
			delete this.sport;
			delete this.server;
			delete this.port;
			delete this.token;
			
			io.rm(this.pidfile);

			return true;
		} else {
			return false;
		}
	} else {
		throw "Can't stop python 2 or 3.";
	}
};

OpenWrap.python.prototype.reset = function(noException, tryOthers) {
	var fn = (aPy) => {
		var res = $sh(this.python + " --version").get(0);
		this.version = (res.stderr.match(/ 2\./) ? 2 : (res.stdout.match(/ 3\./) ? 3 : -1) );
		if (this.version < 0) throw res.stderr;
	}

	try {
		if (tryOthers) {
			try {
				fn(this.python);
			} catch(e1) {
				fn("python3");
			}
		} else {
			fn(this.python);
		}
	} catch(e) {
		this.version = -1;
		if (!noException) throw "Can't find or determine python version (" + e + ")";
	}
};

/**
 * <odoc>
 * <key>ow.python.setPython(aPythonPath)</key>
 * Sets the aPythonPath to the python interpreter process to use.
 * </odoc> 
 */
OpenWrap.python.prototype.setPython = function(aPython) {
	this.python = aPython;
	ow.python.reset();
};

/**
 * <odoc>
 * <key>ow.python.getVersion() : String</key>
 * The majoy python version detected.
 * </odoc>
 */
OpenWrap.python.prototype.getVersion = function() {
	return this.version;
};

/**
 * <odoc>
 * <key>ow.python.execPM(aPythonCode, aInput) : Map</key>
 * Tries to execute aPythonCode with the current interpreter providing the aInput map as a python variable __pm. Any changes to this python variable will be returned.
 * </odoc>
 */
OpenWrap.python.prototype.execPM = function(aPythonCode, aInput, throwExceptions, shouldFork) {
	if (this.version < 0) throw "Appropriate Python version not found. Please setPython to a python version 2 or version 3 command-line interpreter.";

	_$(aPythonCode, "python code").isString().$_();
	aInput = _$(aInput, "input").isMap().default({});
	throwExceptions = _$(throwExceptions, "throwExceptions").isBoolean().default(false);

	var code = (shouldFork ? this.initCode(true) : ""), delim = nowNano();
	code += "import json\n";
	code += "__pm = json.loads('" + stringify(aInput, __, "" ).replace(/\'/g, "\\'").replace(/\\n/g, "\\\n") + "')\n";
	code += aPythonCode;
	code += "\nprint(\"" + delim + "\\n\" + json.dumps(__pm, indent=0, separators=(',',':') ))\n";

	var res;
    if (shouldFork || isUnDef(this.sport)) {
		//res = af.sh(this.python + " -", code, __, __, __, true);
		res = $sh([this.python, "-c", code]).get(0);
	} else {
		ow.loadObj();
		code = code.replace("# -*- coding: utf-8 -*-\n", "#\n");

		res = jsonParse(ow.obj.socket.string2string("127.0.0.1", this.sport, stringify({ e: code, t: this.token }, __, "")+"\n"));
	}
	var rres = [];
	if (res.stdout.indexOf(delim) >= 0) {
		rres = res.stdout.split(new RegExp("^" + delim + "\r?\n", "mg"));
	}
	if (isDef(rres[0]) && rres[0] != "") print(rres[0]);
	if (isDef(res.stderr) && res.stderr != "") {
		if (throwExceptions) {
			printErr(res.stderr);
			throw "python: " + String(res.stderr);
		} else {
			printErr(res.stderr);
		}
	}
	return jsonParse(rres[1], true);
};

/**
 * <odoc>
 * <key>ow.python.exec(aPythonCode, aInput, aOutputArray, shouldFork) : Map</key>
 * Tries to execute aPythonCode with the current interpreter providing the aInput map keys as python variables. It tries to return the values of the aOutputArray name variables. Example:\
 * \
 *    var res = ow.python.exec("c = a + b", { a: 2, b: 1 }, [ "c" ]);\
 *    print(res.c); // 3\
 * \
 * </odoc>
 */
OpenWrap.python.prototype.exec = function(aPythonCode, aInput, aOutputArray, throwExceptions, shouldFork) {
	if (this.version < 0) throw "Appropriate Python version not found. Please setPython to a python version 2 or version 3 command-line interpreter.";

	_$(aPythonCode, "python code").isString().$_();

	aInput = _$(aInput, "input").isMap().default({});
	aOutputArray = _$(aOutputArray, "output").isArray().default([]);
	throwExceptions = _$(throwExceptions, "throwExceptions").isBoolean().default(false);

	var code = (shouldFork ? this.initCode(true) : ""), delim = nowNano();
	code += "import json\n";
	Object.keys(aInput).map(k => {
		if (isDef(aInput[k])) code += k + " = json.loads('" + stringify(aInput[k], __, "" ).replace(/\'/g, "\\'").replace(/\\n/g, "\\\n") + "')\n";
	});
	code += aPythonCode;

	var res;
	code += "\nprint(\"" + delim + "\\n\" + json.dumps({ " + Object.keys(aOutputArray).map(k => "\"" + aOutputArray[k] + "\": " + aOutputArray[k]).join(", ") + " }, indent=0, separators=(',',':') ))\n";
    if (shouldFork || isUnDef(this.sport)) {
		//res = af.sh(this.python + " -", code, __, __, __, true);
		res = $sh([this.python, "-c", code]).get(0);
	} else {
		ow.loadObj();
		code = code.replace("# -*- coding: utf-8 -*-\n", "#\n");

		res = jsonParse(ow.obj.socket.string2string("127.0.0.1", this.sport, stringify({ e: code, t: this.token }, __, "")+"\n"));
	}

	var rres = [];
	if (isMap(res) && isDef(res.stdout) && res.stdout.indexOf(delim) >= 0) {
		rres = res.stdout.split(new RegExp("^" + delim + "\r?\n", "mg"));
	}
	if (isDef(rres[0]) && rres[0] != "") print(rres[0]);
	if (isDef(res.stderr) && res.stderr != "") {
		if (throwExceptions) {
			printErr(res.stderr);
			throw "python: " + String(res.stderr);
		} else {
			printErr(res.stderr);
		}
	}
	return jsonParse(rres[1], true);
};

OpenWrap.python.prototype.execStandalone = function(aPythonCodeOrFile, aInput, throwExceptions) {
	if (!this.running) {
		this.startServer(__, __, __, true)
	}
	if (this.mode != "standalone") throw "Not in standalone mode."

	if (aPythonCodeOrFile.match(/\.py$/) && io.fileExists(aPythonCodeOrFile)) {
		var code = io.readFileString(aPythonCodeOrFile)
		code = this.initCode() + "\n" + code
	} else {
		code = this.initCode() + "\n" + aPythonCodeOrFile

	}
	var _f = io.createTempFile("oafpy", ".py")
	io.writeFileString(_f, code)
	$sh([this.python, _f]).exec(0)
	io.rm(_f)
}