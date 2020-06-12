// OpenWrap v2
// Author: Nuno Aguiar
// Python

OpenWrap.python = function() {
	try {
		var res = $sh("python --version").get(0).stderr;
		this.version = (res.match(/ 2\./) ? 2 : 3);
	} catch(e) {
		throw "Can't find or determine python version";
	}

	return ow.python;
};

OpenWrap.python.prototype.exec = function(aPythonCode, aInput) {
	var code = "", delim = nowNano();
	code += "import json\n";
	code += "__pm = json.loads('" + stringify(aInput, void 0, "") + "')\n";
	code += aPythonCode;
	code += "\nprint(\"" + delim + "\\n\" + json.dumps(__pm, indent=0, separators=(',',':') ))\n";

	var res = af.sh("python -", code, void 0, void 0, void 0, true);
	var rres = [];
	if (res.stdout.indexOf(delim) >= 0) {
		rres = res.stdout.split(new RegExp("^" + delim + "\n"));
	}
	if (isDef(rres[0]) && rres[0] != "") print(rres[0]);
	if (isDef(res.stderr) && res.stderr != "") printErr(res.stderr);
	return jsonParse(rres[1], true);
};