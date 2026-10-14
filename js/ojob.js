// oJob cli script
// Copyright 2023 Nuno Aguiar

var fparam;
var params = processExpr(" ");
var ojob_shouldRun = true;
var ojob_args = {};
var nocolor = false;

var kparams = Object.keys(params)
// Source operations must precede options that load or execute a definition.
if (kparams.indexOf("-exportcode") >= 0 || kparams.indexOf("-importcode") >= 0) {
	try {
		ojob_code();
	} catch(e) {
		printErr("oJob code: " + String(e));
		exit(1);
	}
	exit(0);
}
if ((kparams.length == 1 && kparams[0] == "") || kparams.length == 0) ojob_showHelp()

// Check parameters
if (kparams.indexOf("-h") >= 0 && params["-h"] == "") {
	delete params["-h"];
	ojob_showHelp();
}

if (kparams.indexOf("-f") >= 0 && params["-f"] == "") {
	delete params["-f"]
	ojob_setParams()
}

if (kparams.indexOf("-completion") >= 0 && params["-completion"] == "") {
	delete params["-completion"];
	ojob_completion()
}

if (kparams.indexOf("-syntax") >= 0 && params["-syntax"] == "") {
	delete params["-syntax"]
	ojob_showSyntax()
}

if (params["-reference"] != __ && params["-reference"] == "") {
	delete params["-reference"]
	ojob_showReference()
}

if (params["-mdreference"] != __ && params["-mdreference"] == "") {
	delete params["-mdreference"]
	ojob_showReference(true)
}

if (kparams.indexOf("-global") >= 0 && params["-global"] == "") {
	delete params["-global"]
	ojob_global()
}

if (kparams.indexOf("-shortcuts") >= 0 && params["-shortcuts"] == "") {
	delete params["-shortcuts"]
	ojob_shortcuts()
}

if (kparams.indexOf("-compile") >= 0 && params["-compile"] == "") {
	delete params["-compile"];
	ojob_compile();
}

if (kparams.indexOf("-tojson") >= 0 && params["-tojson"] == "") {
	delete params["-tojson"];
	ojob_tojson();
}

if (kparams.indexOf("-json") >= 0 && params["-json"] == "") {
	delete params["-json"]
	ojob_args.__format = "json"
}

if (kparams.indexOf("-gb64json") >= 0 && params["-gb64json"] == "") {
	delete params["-gb64json"]
	ojob_args.__format = "gb64json"
}

if (kparams.indexOf("-jobs") >= 0 && params["-jobs"] == "") {
	delete params["-jobs"];
	ojob_jobs();
}

if (kparams.indexOf("-todo") >= 0 && params["-todo"] == "") {
	delete params["-todo"];
	ojob_todo();
}

if (kparams.indexOf("-deps") >= 0 && params["-deps"] == "") {
	delete params["-deps"];
	ojob_draw();
}

if (kparams.indexOf("-nocolor") >= 0 && params["-nocolor"] == "") {
	nocolor = true;
}

if (kparams.indexOf("-jobhelp") >= 0 && params["-jobhelp"] == "") {
	delete params["-jobhelp"];
	ojob_jobhelp();
}

if (kparams.indexOf("-which") >= 0 && params["-which"] == "") {
	delete params["-which"]
	ojob_which()
}

if (kparams.indexOf("-i") >= 0 && params["-i"] == "") {	
	delete params["-i"]
	ojob_askOnHelp()
}

//if ($from(Object.keys(params)).starts("-").any()) {
//	$from(Object.keys(params)).starts("-").select(function(r) {
//		ojob_args[r.replace(/^-/, "")] = params[r];
//		delete params[r];
//	});
//}

if (kparams.length >= 1 && ojob_shouldRun) {
	ojob_runFile()

	// If errors occurred exit with error code = number of failed jobs
	var _c = 0
	$ch("oJob::log").forEach((k, v) => {
		if (v.start && v.error) _c++
	})
	if (_c > 0) exit(_c)
}

// FUNCTIONS
// ---------

function ojob_showHelp() {
	print("Usage: ojob aYamlFile.yaml/json [options]\n");
	print("  -compile       Compile all includes and current file into a single yaml output.");
	print("  -tojson        Outputs all includes and current file into a single json output.");
	print("  -exportcode    Export code/exec strings: dir=<directory> [job=<name>|path=<JSON pointer>] [file=<file>].");
	print("  -importcode    Import an export manifest: dir=<directory> [output=<file>|inplace=true].");
	print("                 Source operations parse local YAML/JSON without loading includes. force=true allows overwrites.");
	print("  -json          Sets argument __format to 'json' for used with ow.oJob.output.")
	print("  -gb64json      Sets argument __format to 'gb64json' for used with ow.oJob.output.")
	print("  -jobs          List all jobs available.");
	print("  -todo          List the final todo list.");
	print("  -deps          Draws a list of dependencies of todo jobs on a file.");
	print("  -jobhelp (job) Display any available help information for a job.");
	print("  -syntax        Display the ojob syntax in yaml.")
	print("  -reference     Display the ojob reference.")
	print("  -mdreference   Display the ojob reference in markdown.")
	print("  -which         Determines from where an oJob will be loaded from.")
	print("  -global        List global jobs for this installation.")
	print("  -shortcuts     Lists the included ojob shortcuts.")
	print("  -i             Interactive prompt of the corresponding oJob arguments.")
	print("  -f aFile       Sets additional parameters from a file (yaml, json, slon).")
	print("");
	print("(version " + af.getVersion() + ", " + Packages.openaf.AFCmdBase.LICENSE + ")");
	ojob_shouldRun = false;
}

function ojob_showSyntax() {
	var _r = io.readFileString(getOpenAFJar() + "::" + "docs/.ojob-all.yaml")
	__initializeCon()
	if (__conAnsi) {
		_r = _r.split("\n").map(_s => {
			//return _s.replace(/^([^\:]+\:) /, ansiColor("green", "$1"))).join("\n")
			return _s.replace(/^([^(\#|\/\/|\:)]+)\:/, ansiColor("green", "$1:")).replace(/((\#|\/\/)+.+)$/, ansiColor("faint,italic", "$1"))
		}).join("\n")
	}
	print( _r )
	ojob_shouldRun = false
}

function ojob_showReference(inMD) {
	var _r = io.readFileString(getOpenAFJar() + "::" + "docs/.ojob.md")
	__initializeCon()
	if (inMD) print(_r); else $o(_r, { __format: "md" })
	ojob_shouldRun = false
}

function ojob__getFile() {
	_fparam = __expr.split(/ +/).filter(r => !r.startsWith("-"))
	fparam = (isArray(_fparam) && _fparam.length > 0) ? _fparam[0] : ""
	if (isDef(fparam)) {
		return fparam;
	} else {
		printErr("Didn't recognize the aYamlFile.yaml\n")
		ojob_showHelp()
		return __
	}
}

function ojob__isEncryptedDefinition(aFile) {
	if (isUnDef(aFile)) return false;
	try {
		if (isDef(ow) && isDef(ow.oJob) && isFunction(ow.oJob.isEncryptedDefinition)) {
			return ow.oJob.isEncryptedDefinition(aFile);
		}
	} catch(e) { }
	var f = String(aFile).replace(/[?#].*$/, "");
	return (f.match(/\.ya?ml\.enc$/i) || f.match(/\.js(on)?\.enc$/i));
}

function ojob__hasEncryptedIncludes(aFile) {
	if (isUnDef(aFile)) return false;
	try {
		if (isDef(ow) && isDef(ow.oJob) && isFunction(ow.oJob.getRawIncludes)) {
			var inc0 = ow.oJob.getRawIncludes(aFile);
			var lst0 = [];
			if (isArray(inc0.include)) lst0 = lst0.concat(inc0.include);
			if (isArray(inc0.jobsInclude)) lst0 = lst0.concat(inc0.jobsInclude);
			if ($from(lst0).select(r => ojob__isEncryptedDefinition(r)).length > 0) return true;
		}
		if (isDef(ow) && isDef(ow.oJob) && isFunction(ow.oJob.getIncludes)) {
			var inc = ow.oJob.getIncludes(aFile);
			var lst = []
			if (isArray(inc.include)) lst = lst.concat(inc.include);
			if (isArray(inc.jobsInclude)) lst = lst.concat(inc.jobsInclude);
			return $from(lst).select(r => ojob__isEncryptedDefinition(r)).length > 0;
		}
	} catch(e) { }
	if (ojob__rawHasEncryptedIncludes(aFile)) return true;
	return false;
}

function ojob__rawHasEncryptedIncludes(aFile) {
	try {
		var f = String(aFile);
		var content;
		if (f.match(/^https?:\/\//i)) {
			if (isDef(ow) && isDef(ow.oJob) && isArray(ow.oJob.authorizedDomains)) {
				if (ow.oJob.authorizedDomains.indexOf(String((new java.net.URL(f)).getHost())) < 0) return false;
			}
			content = $rest({ throwExceptions: true }).get(f);
		} else {
			content = io.readFileString(f);
		}

		if (!isString(content)) content = String(content);
		var raw = content.replace(/\r/g, "");
		if (raw.match(/\.ya?ml\.enc\b/i) || raw.match(/\.js(on)?\.enc\b/i)) {
			if (raw.match(/(^|\n)\s*(include|jobsInclude)\s*:/)) return true;
			if (raw.match(/\"(include|jobsInclude)\"\s*:\s*/)) return true;
		}
	} catch(e) { }
	return false;
}

function ojob__blockEncrypted(aFile, optionName) {
	if (ojob__isEncryptedDefinition(aFile)) {
		printErr("oJob definition '" + aFile + "' is encrypted; option " + optionName + " can't be used.");
		ojob_shouldRun = false;
		return true;
	}
	if (ojob__hasEncryptedIncludes(aFile)) {
		printErr("oJob definition '" + aFile + "' includes encrypted includes/jobsInclude; option " + optionName + " can't be used.");
		ojob_shouldRun = false;
		return true;
	}
	return false;
}

function ojob_compile() {
	var file = ojob__getFile()

	if (isDef(file)) {
		if (ojob__blockEncrypted(file, "-compile")) return;
		print(af.toYAML(ow.loadOJob().previewFile(file)))
	}
	ojob_shouldRun = false
}

function ojob_tojson() {
	var file = ojob__getFile()

	if (isDef(file)) {
		if (ojob__blockEncrypted(file, "-tojson")) return;
		sprint(ow.loadOJob().previewFile(file))
	}
	ojob_shouldRun = false
}

function ojob_jobs() {
	var file = ojob__getFile()

	if (isDef(file)) {
		if (ojob__blockEncrypted(file, "-jobs")) return;
		print(af.toYAML($stream(ow.loadOJob().previewFile(file).jobs).map("name").distinct().toArray().sort()))
	}
	ojob_shouldRun = false
}

function ojob_setParams() {
	var afile = String(__expr).replace(/.+-f */i, "")
	var aString = io.readFileString(afile)
	var _r = af.fromJSSLON(aString)
    if (isUnDef(_r)) {
        if (aString.startsWith("{")) {
            _r = jsonParse(aString, __, __, true)
        } else {
            _r = af.fromSLON(aString)
        }
    } else {
        if (isString(_r)) _r = af.fromYAML(_r)
    }

	if (isObject(_r)) ojob_args = merge(ojob_args, _r)
	ojob_shouldRun = true
}	

function ojob_draw() {
	var file = ojob__getFile();
	if (ojob__blockEncrypted(file, "-deps")) return;
	ow.loadOJob();

	var oj = ow.oJob.previewFile(file);

	function getDeps(aJobName) {
		var j = $from(oj.jobs).equals("name", aJobName).first();

		if (isUnDef(j)) return __;

		if (isDef(j.deps)) {
			return j.deps;
		} else {
			return [];
		}
	}

	function getPaths(aJobName, res) {
		var j = $from(oj.jobs).equals("name", aJobName).first();

		if (isUnDef(res)) res = {
			from: [],
			to  : []
		};

		if (isUnDef(j)) return res;

		res = {
			to  : res.to.concat(j.to),
			from: res.from.concat(j.from)
		};

		res = getPaths(j.from, res);
		res = getPaths(j.to, res);

		return res;
	}

	function getPath(aJobName) {
		var msg = "";

		var deps = getDeps(aJobName);
		if (isUnDef(deps)) {
			msg += "!!NOT FOUND!!";
		} else {
			for(var i in deps) {
				var dep = (isDef(deps[i].name)) ? deps[i].name : deps[i];
				msg += " :" + dep;
				var r = getPath(dep);
				if (r.length > 0) {
					msg += " (" + r + ")";
				}
			}

		}

		return msg;
	}

	if (oj.ojob.sequential) {
		print("Sequential dependencies are enabled.\n");
	}

	ansiStart();
	print(ansiColor("bold,underline", "\nDependencies:"));
	oj.todo.forEach(function(v) {
		if (isDef(v.job) && isUnDef(v.name)) v.name = v.job;
		var nn = (isDef(v.name) ? v.name : v);
		printnl("[" + ansiColor("bold", nn) + "]");
		var deps = getDeps(nn);
		print(getPath(nn));
	});

	print(ansiColor("bold,underline", "\nPaths:"));
	var _trans = job => {
		job = ow.oJob.parseTodo(job)
		if (isMap(job) && isDef(job.name))
			return job.name
		else
			return job
	}
	oj.todo.forEach(function(v) {
		if (isDef(v.job) && isUnDef(v.name)) v.name = v.job;
		var nn = (isDef(v.name) ? v.name : v);
		var paths = getPaths(nn);
		var msg = "";
		for (var i in paths.from) {
			msg += (isDef(paths.from[i]) ? _trans(paths.from[i]) + " -> " : "");
		}
		msg += "[" + ansiColor("bold", nn) + "]";
		for (var i in paths.to) {
			msg += (isDef(paths.to[i]) ? " -> " + _trans(paths.to[i]) : "");
		}
		print(msg);
	});
	ansiStop();

	ojob_shouldRun = false;
}

function ojob_global() {
	__initializeCon()
	var lst = $from(io.listFiles(__flags.OJOB_LOCALPATH).files)
			    .equals("isFile", true)
				.match("filename", "(\.ya?ml|\.json)$")
	            .sort("filename")
				.select(r => { 
					try {
						var oj = (r.filepath.endsWith(".json") ? io.readFileJSON(r.filepath) : io.readFileYAML(r.filepath))
						return {
							oJob: r.filename,
							description: (isMap(oj) && isMap(oj.help) ? oj.help.text : "n/a")
						} 
					} catch(e) {
						logErr("Problem reading from '" + r.filepath + "': " + e)
						return {}
					}
				})
	if (lst.length > 0) $o(lst, {__format:"ctable"}); else logWarn("No jobs found in '" + __flags.OJOB_LOCALPATH + "'")
	ojob_shouldRun = false
}

function ojob_which() {
	var aFileOrPath = ojob__getFile()

	var isUrl = false
	if (aFileOrPath.toLowerCase().startsWith("http://") || aFileOrPath.toLowerCase().startsWith("https://")) isUrl = true

	if (!isUrl) {
        aFileOrPath = aFileOrPath.replace(/\\+/g, "/")
		aFileOrPath = aFileOrPath.replace(/\/+/g, "/")
        if (!io.fileExists(aFileOrPath)) {
            var found = false
			var paths = getOPackPaths()
			if (io.fileExists(__flags.OJOB_LOCALPATH)) paths["__ojobs_local"] = __flags.OJOB_LOCALPATH
            Object.values(paths).forEach(f => {
                if (!found && io.fileExists(f + "/" + aFileOrPath)) {
                    aFileOrPath = f + "/" + aFileOrPath
                    found = true
                }
            });
        }
        aFileOrPath = io.fileInfo(aFileOrPath).canonicalPath
    } 

	print(aFileOrPath)
	ojob_shouldRun = false
}

function ojob_jobhelp() {
	var file = ojob__getFile();

	//var ks = Object.keys(params);
	var job = String(__expr).replace(/.+-jobhelp */i, "");
	params = [];
	if (job != "") {
		params = [];
	} else {
		/*printErr("Didn't recognize the job to try to obtain help from.\n");
		ojob_showHelp();
		return __;*/
		job = "help";
	}

	if (isDef(file) && file != "") {
		var oj = ow.loadOJob().previewFile(file);
		oj.jobs = oj.jobs.concat($ch("oJob::jobs").getAll())  // Add included ojobs
		var hh = $from(oj.jobs).equals("name", job).select({ "name": "n/a", "help": "n/a" })[0];
		if (isDef(hh) && hh.name == "Help" && isMap(hh.help) && isUnDef(hh.exec) && isDef(oj.help)) hh = __;
		if (isDef(hh)) {
			ow.loadFormat()
			if (!__flags.OJOB_HELPSIMPLEUI) __initializeCon();
			var simpleUI = __flags.OJOB_HELPSIMPLEUI ? true : !(isDef(__conAnsi) ? __conAnsi : false);
			if (ow.format.isWindows() && !ansiWinTermCap()) simpleUI = true

			print(simpleUI ? hh.name : ansiColor("BOLD", hh.name));
			print(simpleUI ? repeat(hh.name.length, '-') : ansiColor("BOLD", repeat(hh.name.length, '-')))
			print("");
			if (isDef(hh.help) && isString(hh.help))
				print(hh.help);
			else {
				if (isDef(hh.help.text)) print(hh.help.text + "\n")
				if (isDef(hh.help.expects)) {
					print(simpleUI ? "Expects:\n" : ansiColor("BOLD", "Expects:\n"))
					var ml = $from(hh.help.expects).attach("len", r => r.name.length).max("len").len
					if (simpleUI)
						tprint("{{#each expects}}   {{$f '%" + ml + "s' name}} - {{#if required}}(required) {{/if}}{{{desc}}}\n{{/each}}\n", hh.help)
					else
					   	tprint("{{#each expects}}   {{$f '%" + ml + "s' name}} - " + ansiColor("BOLD", "{{#if required}}(required) {{/if}}") + ansiColor("ITALIC", "{{{desc}}}") + "\n{{/each}}\n", hh.help)
				}
				if (isDef(hh.help.returns)) {
					print(simpleUI ? "Returns:\n" : ansiColor("BOLD", "Returns:\n"))
					var ml = $from(hh.help.returns).attach("len", r => r.name.length).max("len").len
					if (simpleUI)
						tprint("{{#each returns}}   {{$f '%" + ml + "s' name}} - {{#if required}}(required) {{/if}}{{{desc}}}\n{{/each}}\n", hh.help)
					else
						tprint("{{#each returns}}   {{$f '%" + ml + "s' name}} - " + ansiColor("BOLD", "{{#if required}}(required) {{/if}}") + ansiColor("ITALIC", "{{{desc}}}") + "\n{{/each}}\n", hh.help)
				}
			}
		} else {
			if (isDef(oj.help)) {
				if (!(isDef(oj.ojob) && isDef(oj.ojob.showHelp) && oj.ojob.showHelp == false)) ow.oJob.showHelp(oj.help, {}, true);
			} else {
				printErr("Didn't find job help for '" + job + "'.");
				return __;
			}
		}
	}
	ojob_shouldRun = false;
}

function ojob_askOnHelp() {
	var file = ojob__getFile()
	var _r = {}

	if (isDef(file) && file != "") {
		var oj = ow.loadOJob().previewFile(file)

		if (isDef(oj.help)) {
			_r = ow.oJob.askOnHelp(oj.help, __flags.OJOB_INTERACTIVETTY ? true : __)
		}
	}

	if (isDef(_r)) {
		params = merge(params, _r)
		kparams = Object.keys(params)

		var _id = now()
		ow.oJob.load(oj.jobs, oj.todo, oj.ojob, params, _id, oj.init, oj.help)
		ow.oJob.start(params, true, _id)
	}

	ojob_shouldRun = false
}

function ojob_todo() {
	var file = ojob__getFile();

	if (isDef(file)) {
		if (ojob__blockEncrypted(file, "-todo")) return;
		var l = ow.loadOJob().previewFile(file).todo.map(r => ow.oJob.parseTodo(r))
		var r = [];
		for(var i in l) {
			if (isObject(l[i]))
				r.push(l[i].name);
			else
				r.push(l[i]);
		}
		print(af.toYAML(r));
	}
	ojob_shouldRun = false;
}

function ojob_shortcuts() {
	var job = String(__expr).replace(/.*-shortcuts */i, "")
	__expr = String(__expr).replace(job, "")
	var file = ojob__getFile()

	if (isDef(file) && file.trim() != "") {
		var o = ow.loadOJob().parseTodo(ow.loadOJob().previewFile(file), true)
	}

	var tab = [], _lst = ow.loadOJob().parseTodo(__, true)
	var _max  = $from(_lst).attach("_len", r => r.job.length).max("_len")._len
	var _maxJ = $from(_lst).attach("_len", r => $from(Object.keys(r.attrs).map(s=>s.length)).max()).max("_len")._len
	_maxJ = Math.max(_maxJ, $from(_lst).attach("_len", r => r.name.length).max("_len")._len)
	var _maxA = $from(_lst).attach("_len", r => $from(Object.values(r.attrs).map(s=>s.length)).max()).max("_len")._len

	$from(_lst)
	.sort("job")
	.select(r => {
		var _go = true
		if (job.trim().length > 0 && (r.job.indexOf(job) < 0 && r.name.indexOf(job) < 0 )) _go = false

		if (_go) {
			var _l = Object.keys(r.attrs)
			tab.push({ ojob: r.job, job: r.name, arg: isDef(r.attrs[r.name]) ? r.attrs[r.name] : "" })
			_l.forEach((rr, i) => {
				if (i != 0) {
					tab.push({ ojob: "", job: rr, arg: isDef(r.attrs[rr]) ? r.attrs[rr] : "" })
				}
			})
			tab.push({ ojob: ansiColor("FAINT", repeat(_max, "-")), job: ansiColor("FAINT", repeat(_maxJ, "-")), arg: ansiColor("FAINT", repeat(_maxA, "-")) })
		}
	})
	print(printTable(tab))

	ojob_shouldRun = false
}

function ojob_runFile() {
	if (ojob_shouldRun) {
		var file = ojob__getFile();

		if (isDef(file)) {
			oJobRunFile(file, ojob_args, __, __, (nocolor) ? { conAnsi: false } : __)
		}
	}
}

function ojob_completion() {
	ojob_shouldRun = false
	var opts = [
		{ name: "-compile", desc: "Compile all includes and current file into a single yaml output." },
		{ name: "-tojson", desc: "Outputs all includes and current file into a single json output." },
		{ name: "-exportcode", desc: "Export embedded code and inline exec bodies to files." },
		{ name: "-importcode", desc: "Import edited source files using an export manifest." },
		{ name: "-json", desc: "Sets argument __format to 'json' for used with ow.oJob.output." },
		{ name: "-gb64json", desc: "Sets argument __format to 'gb64json' for used with ow.oJob.output." },
		{ name: "-jobs", desc: "List all jobs available." },
		{ name: "-todo", desc: "List the final todo list." },
		{ name: "-deps", desc: "Draws a list of dependencies of todo jobs on a file." },
		{ name: "-jobhelp", desc: "Display any available help information for a job." },
		{ name: "-syntax", desc: "Display the ojob syntax in yaml." },
		{ name: "-which", desc: "Determines from where an oJob will be loaded from." },
		{ name: "-global", desc: "List global jobs for this installation." },
		{ name: "-shortcuts", desc: "Lists the included ojob shortcuts." }
	]

	var checked = false
	// Check for authorized domains
	OJOB_AUTHORIZEDDOMAINS.forEach(domain =>
		Object.keys(params).filter(r => r.startsWith(domain)).forEach(r => {
			try {
				var _l = new Set()
				var _d
				var _cf = __gHDir() + "/.openaf_completion_" + domain + ".json"
				if (!io.fileExists(_cf) || io.fileInfo(_cf).lastModified < (new Date().getTime() - 86400000)) {
					_d = $rest().get("https://" + domain + "/_integrity.json")
					io.writeFileJSON(_cf, _d)
				} else {
					_d = io.readFileJSON(_cf)
				}
				
				if (Object.keys(_d).indexOf(r.replace(domain + "/", "./")) >= 0) {
					checked = false
					opts.push({ name: r })
				} else {
					checked = true
					Object.keys(_d).filter(r => /[^(\.html|\.json|\.md|\.yaml|\.bat|\.sh)]$/.test(r)).forEach(k => _l.add({ name: k.replace(/^\./, domain) }))
					opts = opts.concat(Array.from(_l))
				}
			} catch(e) {
			}
		})
	)

	// Check local
	if (!checked) {
		Object.keys(params).filter(r => !r.startsWith("-")).forEach(r => {
			try {
				if (io.fileExists(r)) {
					var _d = r.endsWith(".json") ? io.readFileJSON(r) : io.readFileYAML(r)
					if (isDef(_d) && isMap(_d.help) && isArray(_d.help.expects)) {
						_d.help.expects.forEach(e => {
							opts.push({ name: e.name+"=", desc: e.desc })
						})
					}
				}
			} catch(e) {
			}
		})
	}

	print(opts.map(r => r.name + (isDef(r.desc) ? "\t" + r.desc : "")).join("\n"))
	print(":4")
}

// Local, non-executing source exchange. JSON pointers identify original scalars;
// js-yaml's listener supplies ranges so unrelated YAML text remains untouched.
function ojob_code() {
  var exporting = kparams.indexOf("-exportcode") >= 0;
  var importing = kparams.indexOf("-importcode") >= 0;
  if (exporting == importing) throw "Choose exactly one of -exportcode and -importcode.";
  var allowed = exporting ? ["dir", "job", "path", "file", "extension", "force"] : ["dir", "output", "inplace", "force"];
  var inputs = [];
  kparams.forEach(function(k) {
    if (k == (exporting ? "-exportcode" : "-importcode")) {
      if (params[k] !== "") throw "The operation flag does not take a value.";
    } else if (allowed.indexOf(k) < 0) {
      if (k.charAt(0) == "-" || params[k] !== "") throw "Unknown source operation option: " + k;
      inputs.push(k);
    }
  });
  if (inputs.length != 1) throw "Provide exactly one local YAML/JSON definition.";
  var source = new java.io.File(inputs[0]);
  if (!source.isFile() || !/\.(ya?ml|json)$/i.test(inputs[0])) throw "Expected an existing local .yaml, .yml or .json file.";
  source = String(source.getCanonicalPath());
  var raw = io.readFileString(source);
  var document = ojob_codeParse(raw, /\.json$/i.test(source));
  var bool = function(k) {
    if (isUnDef(params[k])) return false;
    if (["true", "false"].indexOf(String(params[k])) < 0) throw k + " must be true or false.";
    return String(params[k]) == "true";
  };
  var force = bool("force");
  var dir = String(new java.io.File(isDef(params.dir) ? String(params.dir) :
    exporting && isDef(params.file) ? String(new java.io.File(String(params.file)).getAbsoluteFile().getParent()) :
    inputs[0].replace(/\.(ya?ml|json)$/i, "") + "-code").getCanonicalPath());
  var manifestFile = ojob_codeFile(dir, ".ojob-code.json");
  var writes = [];
  var destinations = {};
  var addWrite = function(file, text, overwrite) {
    file = String(new java.io.File(file).getCanonicalPath());
    if (destinations[file]) throw "Duplicate output file: " + file;
    Object.keys(destinations).forEach(function(other) {
      if (file.indexOf(other + java.io.File.separator) == 0 || other.indexOf(file + java.io.File.separator) == 0) throw "Output paths conflict: " + file + " and " + other;
    });
    if (file == source && !overwrite) throw "Output would overwrite the input definition; use inplace=true.";
    if (new java.io.File(file).exists() && (!overwrite || !new java.io.File(file).isFile())) throw "Output already exists: " + file + ". Use force=true to replace files.";
    var parent = new java.io.File(file).getParentFile();
    while (parent !== null && !parent.exists()) parent = parent.getParentFile();
    if (parent !== null && !parent.isDirectory()) throw "Output parent is not a directory: " + parent;
    destinations[file] = true;
    writes.push({file: file, text: text});
  };
  if (exporting) {
    if (isDef(params.job) && isDef(params.path)) throw "Choose job or path, not both.";
    var entries = [];
    var addEntry = function(path, file, lang, jobName) {
      var value = ojob_codeGet(document.value, path);
      if (!isString(value)) throw "Expected source text at " + path;
      entries.push({path: path, file: file, lang: lang, jobName: jobName, hash: sha256(value)});
    };
    if (isDef(params.path)) {
      addEntry(String(params.path), "source" + ojob_codeExtension(params.extension, "oaf"), "oaf");
    } else if (isDef(params.job)) {
      var matches = [];
      (document.value.jobs || []).forEach(function(job, i) { if (job.name == String(params.job)) matches.push(i); });
      if (matches.length != 1) throw "Expected one job named '" + params.job + "', found " + matches.length + ".";
      var i = matches[0], job = document.value.jobs[i];
      var lang = job.lang || (job.typeArgs || {}).lang || "oaf";
      addEntry("/jobs/" + i + "/exec", "jobs/" + i + "-" + ojob_codeName(job.name) + ojob_codeExtension(params.extension, lang), lang, job.name);
    } else {
      if (isDef(document.value.code)) {
        if (!isMap(document.value.code)) throw "code must be a map of filename to source text.";
        Object.keys(document.value.code).forEach(function(key) {
          addEntry("/code/" + ojob_codeEscape(key), key);
        });
      }
      (document.value.jobs || []).forEach(function(job, i) {
        if (isDef(job.exec)) {
          var lang = job.lang || (job.typeArgs || {}).lang || "oaf";
          addEntry("/jobs/" + i + "/exec", "jobs/" + i + "-" + ojob_codeName(job.name || "job") + ojob_codeExtension(params.extension, lang), lang, job.name);
        }
      });
    }
    if (!entries.length) throw "No source strings selected. Use path=/property for another string property.";
    if (isDef(params.file)) {
      if (entries.length != 1) throw "file requires exactly one selected source string.";
      var target = String(new java.io.File(String(params.file)).getCanonicalPath());
      var root = String(new java.io.File(dir).getCanonicalPath()) + java.io.File.separator;
      if (target.indexOf(root) !== 0) throw "file must be inside dir (or omit dir to use the file's parent).";
      entries[0].file = target.substring(root.length).replace(/\\/g, "/");
    }
    entries.forEach(function(entry) {
      var file = ojob_codeFile(dir, entry.file);
      if (file == manifestFile) throw "Source filename conflicts with the manifest.";
      if (file == source) throw "An exported file would replace the definition.";
      addWrite(file, ojob_codeGet(document.value, entry.path), force);
    });
    addWrite(manifestFile, stringify({version: 1, source: source, entries: entries}, __, "  ") + "\n", force);
  } else {
    var inplace = bool("inplace");
    if (inplace && isDef(params.output)) throw "Choose output or inplace=true, not both.";
    var manifest = jsonParse(io.readFileString(manifestFile));
    if (!isMap(manifest) || manifest.version !== 1 || manifest.source !== source || !isArray(manifest.entries) || !manifest.entries.length) throw "Manifest does not match this definition.";
    var expected = clone(document.value), replacements = [], paths = {}, files = {};
    manifest.entries.forEach(function(entry) {
      if (!isMap(entry) || !isString(entry.path) || !isString(entry.file) || !isString(entry.hash)) throw "Invalid manifest entry.";
      if (paths[entry.path]) throw "Duplicate property in manifest: " + entry.path;
      paths[entry.path] = true;
      var file = ojob_codeFile(dir, entry.file);
      if (files[file] || file == manifestFile || file == source) throw "Conflicting source file in manifest: " + file;
      files[file] = true;
      var current = ojob_codeGet(document.value, entry.path);
      if (!isString(current)) throw "Source property is no longer a string: " + entry.path;
      if (isDef(entry.jobName)) {
        var match = entry.path.match(/^\/jobs\/(\d+)\/exec$/);
        if (!match || document.value.jobs[Number(match[1])].name !== entry.jobName) throw "Job identity changed: " + entry.path;
      }
      if (!new java.io.File(file).isFile()) throw "Missing source file: " + file;
      var value = io.readFileString(file);
      if (sha256(current) !== entry.hash && current !== value) throw "Definition source changed since export: " + entry.path + ". Export again before importing.";
      if (current !== value) {
        var node = document.nodes[entry.path];
        if (!node || node.kind !== "scalar") throw "Cannot edit a YAML alias through " + entry.path + "; select its anchor property instead.";
        replacements.push(ojob_codeReplacement(raw, node, value, document.json));
        ojob_codeSet(expected, entry.path, value);
      }
    });
    replacements.sort(function(a, b) { return b.start - a.start; });
    var result = raw, last = raw.length + 1;
    replacements.forEach(function(r) {
      if (r.end > last) throw "Selected source ranges overlap.";
      result = result.substring(0, r.start) + r.text + result.substring(r.end);
      last = r.start;
    });
    var actual = ojob_codeParse(result, document.json).value;
    if (!ojob_codeEqual(actual, expected)) throw "Import would change other properties (possibly shared YAML aliases). Export and edit separate properties instead.";
    if (isDef(params.output) || inplace) {
      var output = inplace ? source : String(new java.io.File(String(params.output)).getCanonicalPath());
      if (!inplace && output == source) throw "Use inplace=true to replace the input definition.";
      if (/\.json$/i.test(output) !== document.json || !/\.(ya?ml|json)$/i.test(output)) throw "Output must keep the input format (.yaml/.yml or .json).";
      if (files[output] || output == manifestFile) throw "Output conflicts with a source file or manifest.";
      addWrite(output, result, inplace || force);
    } else {
      printnl(result);
    }
  }
  // Validate every source and destination before creating any directories/files.
  writes.forEach(function(w) {
    var parent = new java.io.File(w.file).getParentFile();
    if (!parent.isDirectory() && !parent.mkdirs() && !parent.isDirectory()) throw "Cannot create directory: " + parent;
    var temp = java.nio.file.Files.createTempFile(parent.toPath(), ".ojob-code-", ".tmp");
    try {
      io.writeFileString(String(temp), w.text);
      // createTempFile is owner-only (0600): keep the replaced file's permissions (e.g. an executable shebang yaml)
      var target = new java.io.File(w.file).toPath();
      if (java.nio.file.Files.exists(target)) {
        try {
          java.nio.file.Files.setPosixFilePermissions(temp, java.nio.file.Files.getPosixFilePermissions(target));
        } catch(e) {
          // Non-POSIX file systems (e.g. Windows)
        }
      } else {
        try {
          java.nio.file.Files.setPosixFilePermissions(temp, java.nio.file.attribute.PosixFilePermissions.fromString("rw-r--r--"));
        } catch(e) {}
      }
      var options = java.lang.reflect.Array.newInstance(java.nio.file.CopyOption, 2);
      options[0] = java.nio.file.StandardCopyOption.REPLACE_EXISTING;
      options[1] = java.nio.file.StandardCopyOption.ATOMIC_MOVE;
      java.nio.file.Files.move(temp, new java.io.File(w.file).toPath(), options);
    } finally {
      java.nio.file.Files.deleteIfExists(temp);
    }
    printErr("Wrote " + w.file);
  });
}

function ojob_codeEscape(key) { return String(key).replace(/~/g, "~0").replace(/\//g, "~1"); }
function ojob_codeParts(path) {
  if (!isString(path) || path.charAt(0) !== "/" || /~(?![01])/g.test(path)) throw "Expected a JSON pointer such as /code/handlers.js.";
  return path.substring(1).split("/").map(function(k) {
    k = k.replace(/~1/g, "/").replace(/~0/g, "~");
    if (["__proto__", "prototype", "constructor"].indexOf(k) >= 0) throw "Unsupported property name: " + k;
    return k;
  });
}
function ojob_codeGet(value, path) {
  ojob_codeParts(path).forEach(function(k) {
    if (value === null || typeof value !== "object" || !Object.prototype.hasOwnProperty.call(value, k)) throw "Missing property: " + path;
    value = value[k];
  });
  return value;
}
function ojob_codeSet(value, path, text) {
  var parts = ojob_codeParts(path), key = parts.pop();
  parts.forEach(function(k) { value = value[k]; });
  value[key] = text;
}
function ojob_codeName(name) { return String(name).replace(/[^a-zA-Z0-9_.-]/g, "_").substring(0, 80) || "job"; }
function ojob_codeExtension(extension, lang) {
  if (isDef(extension)) {
    extension = String(extension).replace(/^\./, "");
    if (!/^[a-zA-Z0-9]+$/.test(extension)) throw "extension must contain only letters and digits.";
    return "." + extension;
  }
  var extensions = {oaf: ".js", js: ".js", javascript: ".js", node: ".js", python: ".py", sh: ".sh", shell: ".sh", ssh: ".sh", powershell: ".ps1", winssh: ".ps1", ruby: ".rb", perl: ".pl", go: ".go", swift: ".swift", java: ".java", rust: ".rs"};
  return extensions[lang] || ".txt";
}
function ojob_codeFile(dir, name) {
  if (!isString(name) || !name.length || name.indexOf("\0") >= 0 || /\\|^[a-zA-Z]:|^\//.test(name) || name.split("/").some(function(p) { return p == ".." || !p.length; })) throw "Expected a relative filename inside the export directory: " + name;
  var root = String(new java.io.File(dir).getCanonicalPath());
  var file = String(new java.io.File(root, name).getCanonicalPath());
  if (file.indexOf(root + java.io.File.separator) !== 0) throw "Source path escapes the export directory: " + name;
  return file;
}
function ojob_codeParse(raw, json) {
  loadJSYAML();
  var stack = [], root, offset = raw.charAt(0) == "\uFEFF" ? 1 : 0;
  var input = raw.substring(offset);
  var value = jsyaml.load(input, {schema: json ? jsyaml.JSON_SCHEMA : jsyaml.DEFAULT_SCHEMA, listener: function(event, state) {
    if (event == "open") {
      stack.push({start: state.position + offset, children: []});
    } else {
      var node = stack.pop();
      node.end = state.position + offset;
      node.kind = state.kind;
      node.value = state.result;
      if (stack.length) stack[stack.length - 1].children.push(node); else root = node;
    }
  }});
  if (json) value = JSON.parse(input);
  if (!isMap(value)) throw "Definition must be a single YAML/JSON object.";
  var nodes = {};
  var visit = function(node, path) {
    // Flow collections can have an extra composeNode wrapper.
    while (node.children.length == 1 && node.children[0].kind == node.kind && node.children[0].value === node.value) {
      var keyStart = node.keyStart;
      node = node.children[0];
      if (isDef(keyStart)) node.keyStart = keyStart;
    }
    nodes[path] = node;
    if (node.kind == "mapping") {
      for (var i = 0; i < node.children.length; i += 2) {
        var key = node.children[i], child = node.children[i + 1];
        if (child) {
          child.keyStart = key.start;
          visit(child, path + "/" + ojob_codeEscape(key.value));
        }
      }
    } else if (node.kind == "sequence") {
      node.children.forEach(function(child, i) { visit(child, path + "/" + i); });
    }
  };
  visit(root, "");
  return {value: value, nodes: nodes, json: json};
}
function ojob_codeReplacement(raw, node, value, json) {
  var start = node.start, end = Math.min(node.end, raw.length);
  var skip = function() {
    while (start < end) {
      if (/\s/.test(raw.charAt(start))) start++;
      else if (raw.charAt(start) == "#") {
        while (start < end && raw.charAt(start) != "\n") start++;
      } else break;
    }
  };
  skip();
  // Leave the anchor and any intervening comments outside the edited range.
  var anchor = raw.substring(start, end).match(/^&[^\s,\[\]{}]+/);
  if (anchor) { start += anchor[0].length; skip(); }
  while (end > start && /\s/.test(raw.charAt(end - 1))) end--;
  var original = raw.substring(start, end);
  // Reject tags rather than changing the scalar's type.
  var prefix = "", scalar = original;
  if (scalar.charAt(0) == "!") throw "Tagged source scalars cannot be imported.";
  var block = /^[|>]/.test(scalar);
  var header = block ? scalar.split(/\r?\n/)[0] : "";
  var comment = header.indexOf("#") >= 0 ? " " + header.substring(header.indexOf("#")) : "";
  var text;
  if (json || !block || value.indexOf("\r") >= 0 || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value)) {
    text = prefix + JSON.stringify(value) + comment;
  } else {
    var newline = raw.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
    var keyStart = isDef(node.keyStart) ? node.keyStart : start;
    var line = raw.substring(raw.lastIndexOf("\n", keyStart - 1) + 1, keyStart);
    var indent = (line.match(/^ */) || [""])[0].length + (/^ *- /.test(line) ? 2 : 0) + 2;
    var trailing = (value.match(/\n*$/) || [""])[0].length;
    var indicator = trailing == 0 ? "|-" : trailing == 1 ? "|" : "|+";
    // Explicit indentation retains leading spaces in the first source line.
    text = prefix + indicator.charAt(0) + "2" + indicator.substring(1) + comment + newline;
    var lines = value.split("\n");
    if (trailing > 0) lines.pop();
    text += lines.map(function(s) { return repeat(indent, " ") + s; }).join(newline);
    // Existing whitespace after the scalar supplies the final line break. For
    // keep-chomping it must be controlled, including originally blank lines.
    while (end < raw.length && /\s/.test(raw.charAt(end))) end++;
    var nextLine = raw.lastIndexOf("\n", end - 1) + 1;
    var nextIndent = end < raw.length ? raw.substring(nextLine, end) : "";
    text += newline + nextIndent;
    if (value.length == 0) text = prefix + JSON.stringify(value) + comment + newline + nextIndent;
  }
  return {start: start, end: end, text: text};
}
function ojob_codeEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;
  if (a instanceof Date || b instanceof Date) return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  if (isArray(a) !== isArray(b)) return false;
  var keys = Object.keys(a), other = Object.keys(b);
  return keys.length == other.length && keys.every(function(k) { return Object.prototype.hasOwnProperty.call(b, k) && ojob_codeEqual(a[k], b[k]); });
}
