var _fparam = __expr.split(/ +/).filter(r => !r.startsWith("-"))
var fparam = (isArray(_fparam) && _fparam.length > 0) ? _fparam[0] : "";
var params = processExpr(" ");
var ojob_shouldRun = true;
var ojob_args = {};
var nocolor = false;

var kparams = Object.keys(params)
if (kparams.length == 1 && kparams[0] == "") ojob_showHelp();

// Check parameters
if (kparams.indexOf("-h") >= 0 && params["-h"] == "") {
	delete params["-h"];
	ojob_showHelp();
}

if (kparams.indexOf("-global") >= 0 && params["-global"] == "") {
	delete params["-global"]
	ojob_global()
}

if (kparams.indexOf("-compile") >= 0 && params["-compile"] == "") {
	delete params["-compile"];
	ojob_compile();
}

if (kparams.indexOf("-tojson") >= 0 && params["-tojson"] == "") {
	delete params["-tojson"];
	ojob_tojson();
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

//if ($from(Object.keys(params)).starts("-").any()) {
//	$from(Object.keys(params)).starts("-").select(function(r) {
//		ojob_args[r.replace(/^-/, "")] = params[r];
//		delete params[r];
//	});
//}

if (kparams.length >= 1 && ojob_shouldRun) {
	ojob_runFile();
}

function ojob_showHelp() {
	print("Usage: ojob aYamlFile.yaml/json [options]\n");
	print("  -compile       Compile all includes and current file into a single yaml output.");
	print("  -tojson        Outputs all includes and current file into a single json output.");
	print("  -jobs          List all jobs available.");
	print("  -todo          List the final todo list.");
	print("  -deps          Draws a list of dependencies of todo jobs on a file.");
	print("  -jobhelp (job) Display any available help information for a job.");
	print("  -which         Determines from where an oJob will be loaded from.")
	print("  -global        List global jobs for this installation.")
	print("");
	print("(version " + af.getVersion() + ", " + Packages.openaf.AFCmdBase.LICENSE + ")");
	ojob_shouldRun = false;
}

function ojob__getFile() {
	if (isDef(fparam)) {
		return fparam;
	} else {
		printErr("Didn't recognize the aYamlFile.yaml\n");
		ojob_showHelp();
		return __;
	}
}

function ojob_compile() {
	var file = ojob__getFile();

	if (isDef(file)) {
		print(af.toYAML(ow.loadOJob().previewFile(file)));
	}
	ojob_shouldRun = false;
}

function ojob_tojson() {
	var file = ojob__getFile();

	if (isDef(file)) {
		sprint(ow.loadOJob().previewFile(file));
	}
	ojob_shouldRun = false;
}

function ojob_jobs() {
	var file = ojob__getFile();

	if (isDef(file)) {
		print(af.toYAML($stream(ow.loadOJob().previewFile(file).jobs).map("name").distinct().toArray().sort()));
	}
	ojob_shouldRun = false;
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
	oj.todo.map(function(v) {
		if (isDef(v.job) && isUnDef(v.name)) v.name = v.job;
		var nn = (isDef(v.name) ? v.name : v);
		printnl("[" + ansiColor("bold", nn) + "]");
		var deps = getDeps(nn);
		print(getPath(nn));
	});

	print(ansiColor("bold,underline", "\nPaths:"));
	oj.todo.map(function(v) {
		if (isDef(v.job) && isUnDef(v.name)) v.name = v.job;
		var nn = (isDef(v.name) ? v.name : v);
		var paths = getPaths(nn);
		var msg = "";
		for (var i in paths.from) {
			msg += (isDef(paths.from[i]) ? paths.from[i] + " -> " : "");
		}
		msg += "[" + ansiColor("bold", nn) + "]";
		for (var i in paths.to) {
			msg += (isDef(paths.to[i]) ? " -> " + paths.to[i] : "");
		}
		print(msg);
	});
	ansiStop();

	ojob_shouldRun = false;
}

function ojob_global() {
	var lst = $from(io.listFiles(__flags.OJOB_LOCALPATH).files)
			    .equals("isFile", true)
				.match("filename", "(\.ya?ml|\.json)$")
	            .sort("filename")
				.select(r => { 
					var oj = (r.filepath.endsWith(".json") ? io.readFileJSON(r.filepath) : io.readFileYAML(r.filepath))
					return {
						oJob: r.filename,
						description: (isMap(oj) && isMap(oj.help) ? oj.help.text : "n/a"),
						"# todo": (isMap(oj) && isArray(oj.todo)) ? oj.todo.length : "n/a"
					} 
				})
	print(printTable(lst))
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

	if (isDef(file)) {
		var oj = ow.loadOJob().previewFile(file);
		var hh = $from(oj.jobs).equals("name", job).select({ "name": "n/a", "help": "n/a" })[0];
		if (isDef(hh) && hh.name == "Help" && isMap(hh.help) && isUnDef(hh.exec) && isDef(oj.help)) hh = __;
		if (isDef(hh)) {
			print(hh.name);
			print(repeat(hh.name.length, '-'));
			print("");
			if (isString(hh.help))
				print(hh.help);
			else {
				print(hh.help.text + "\n");
				if (isDef(hh.help.expects)) {
					print("Expects:");
					tprint("{{#each expects}}   {{name}} - {{#if required}}(required) {{/if}}{{{desc}}}\n{{/each}}\n", hh.help);
				}
				if (isDef(hh.help.returns)) {
					print("Returns:");
					tprint("{{#each returns}}   {{name}} - {{#if required}}(required) {{/if}}{{{desc}}}\n{{/each}}\n", hh.help);
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

function ojob_todo() {
	var file = ojob__getFile();

	if (isDef(file)) {
		var l = ow.loadOJob().previewFile(file).todo;
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

function ojob_runFile() {
	if (ojob_shouldRun) {
		var file = ojob__getFile();

		if (isDef(file)) {
			oJobRunFile(file, ojob_args, __, (nocolor) ? { conAnsi: false } : __);
		}
	}
}
