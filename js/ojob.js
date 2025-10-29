// oJob cli script
// Copyright 2023 Nuno Aguiar

var fparam;
var params = processExpr(" ");
var ojob_shouldRun = true;
var ojob_args = {};
var nocolor = false;

var kparams = Object.keys(params)
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

if (kparams.indexOf("-gb64json" >= 0) && params["-gb64json"] == "") {
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

function ojob_compile() {
	var file = ojob__getFile()

	if (isDef(file)) {
		print(af.toYAML(ow.loadOJob().previewFile(file)))
	}
	ojob_shouldRun = false
}

function ojob_tojson() {
	var file = ojob__getFile()

	if (isDef(file)) {
		sprint(ow.loadOJob().previewFile(file))
	}
	ojob_shouldRun = false
}

function ojob_jobs() {
	var file = ojob__getFile()

	if (isDef(file)) {
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
			_r = ow.oJob.askOnHelp(oj.help)
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
				if (!io.fileExists(__gHDir() + "/.openaf_completion_" + domain + ".json") &&
					io.fileInfo(__gHDir() + "/.openaf_completion_" + domain + ".json").lastModified < (new Date().getTime() - 86400000)) {
					_d = $rest().get("https://" + domain + "/_integrity.json")
					io.writeFileJSON(__gHDir() + "/.openaf_completion_" + domain + ".json", _d)
				} else {
					_d = io.readFileJSON(__gHDir() + "/.openaf_completion_" + domain + ".json")
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