// OpenWrap v2
// Author: Nuno Aguiar
// Python

OpenWrap.python = function() {
	this.python = "python";
	this.reset();
	this.cServer = $atomic();

	return ow.python;
};

OpenWrap.python.prototype.initCode = function() {
	if (isDef(this.token)) {
		var s = "# -*- coding: utf-8 -*-\n\n";
		s += "import json\n";
		s += "import socket\n\n";
		s += "def _(e):\n";
		s += "   s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n";
		s += "   s.connect(('127.0.0.1', " + this.port + "))\n";
		s += "   sR = {'e':e,'t':'" + this.token + "'}\n";
		s += "   s.sendall(json.dumps(sR) + '\\n')\n";
		s += "   res = ''\n";
		s += "   while True:\n";
		s += "      data = s.recv(1024)\n";
		s += "      if not data:\n";
		s += "         break\n";
		s += "      res += data\n";
		s += "   s.close()\n";
		s += "   return json.loads(res)\n\n";
		s += "def _oaf(e):\n";
		s += "   return _(e)\n\n";
		return s;
	} else {
		return "# -*- coding: utf-8 -*-\n\n";
	}
};

OpenWrap.python.prototype.startServer = function(aPort, aFn) {
	ow.python.cServer.inc();
	if (isDef(this.token)) {
		return this.token;
	} else {
		this.token = md5(nowNano());
		aFn = _$(aFn).isFunction().default((t, e) => { if (t == "error") printErr(e); });

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
						res = stringify(af.eval(inR.e),void 0, "");
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
		});

		return this.token;
	}
};

OpenWrap.python.prototype.stopServer = function(aPort, force) {
	if (force || ow.python.cServer.get() > 0) {
		ow.python.cServer.dec();
		aPort = _$(aPort).isNumber().default(this.port);

		ow.server.socket.stop(aPort);
		delete this.server;
		delete this.port;
		delete this.token;
		 
		return true;
	} else {
		return false;
	}
};

OpenWrap.python.prototype.reset = function() {
	try {
		var res = $sh(this.python + " --version").get(0).stderr;
		this.version = (res.match(/ 2\./) ? 2 : 3);
	} catch(e) {
		throw "Can't find or determine python version";
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
OpenWrap.python.prototype.execPM = function(aPythonCode, aInput, throwExceptions) {
	_$(aPythonCode, "python code").isString().$_();
	aInput = _$(aInput, "input").isMap().default({});
	throwExceptions = _$(throwExceptions, "throwExceptions").isBoolean().default(false);

	var code = this.initCode(), delim = nowNano();
	code += "import json\n";
	code += "__pm = json.loads('" + stringify(aInput, void 0, "" ).replace(/\'/g, "\\'").replace(/\\n/g, "\\\n") + "')\n";
	code += aPythonCode;
	code += "\nprint(\"" + delim + "\\n\" + json.dumps(__pm, indent=0, separators=(',',':') ))\n";

	var res = af.sh("python -", code, void 0, void 0, void 0, true);
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
 * <key>ow.python.exec(aPythonCode, aInput, aOutputArray) : Map</key>
 * Tries to execute aPythonCode with the current interpreter providing the aInput map keys as python variables. It tries to return the values of the aOutputArray name variables. Example:\
 * \
 *    var res = ow.python.exec("c = a + b", { a: 2, b: 1 }, [ "c" ]);\
 *    print(res.c); // 3\
 * \
 * </odoc>
 */
OpenWrap.python.prototype.exec = function(aPythonCode, aInput, aOutputArray, throwExceptions) {
	_$(aPythonCode, "python code").isString().$_();

	aInput = _$(aInput, "input").isMap().default({});
	aOutputArray = _$(aOutputArray, "output").isArray().default([]);
	throwExceptions = _$(throwExceptions, "throwExceptions").isBoolean().default(false);

	var code = this.initCode(), delim = nowNano();
	code += "import json\n";
	Object.keys(aInput).map(k => {
		if (isDef(aInput[k])) code += k + " = json.loads('" + stringify(aInput[k], void 0, "" ).replace(/\'/g, "\\'").replace(/\\n/g, "\\\n") + "')\n";
	});
	code += aPythonCode;

	code += "\nprint(\"" + delim + "\\n\" + json.dumps({ " + Object.keys(aOutputArray).map(k => "\"" + aOutputArray[k] + "\": " + aOutputArray[k]).join(", ") + " }, indent=0, separators=(',',':') ))\n";

	var res = af.sh("python -", code, void 0, void 0, void 0, true);
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