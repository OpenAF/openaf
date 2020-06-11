var _fparam = __expr.match(/^([^ ]+) ?/);
var fparam = (isArray(_fparam) && _fparam.length > 0) ? _fparam[1] : "";
var params = processExpr(" ");
var ojob_shouldRun = true;
var ojob_args = {};
var nocolor = false;

if (Object.keys(params).length == 1 && Object.keys(params)[0] == "") ojob_showHelp();

// Check parameters
if (isDef(params["-h"]) && params["-h"] == "") {
	delete params["-h"];
	ojob_showHelp();
}

if (isDef(params["-compile"]) && params["-compile"] == "") {
	delete params["-compile"];
	ojob_compile();
}

if (isDef(params["-tojson"]) && params["-tojson"] == "") {
	delete params["-tojson"];
	ojob_tojson();
}

if (isDef(params["-jobs"]) && params["-jobs"] == "") {
	delete params["-jobs"];
	ojob_jobs();
}

if (isDef(params["-todo"]) && params["-todo"] == "") {
	delete params["-todo"];
	ojob_todo();
}

if (isDef(params["-deps"]) && params["-deps"] == "") {
	delete params["-deps"];
	ojob_draw();
}

if (isDef(params["-nocolor"]) && params["-nocolor"] == "") {
	nocolor = true;
}

if (isDef(params["-jobhelp"]) && params["-jobhelp"] == "") {
	delete params["-jobhelp"];
	ojob_jobhelp();
}

//if ($from(Object.keys(params)).starts("-").any()) {
//	$from(Object.keys(params)).starts("-").select(function(r) {
//		ojob_args[r.replace(/^-/, "")] = params[r];
//		delete params[r];
//	});
//}

if (Object.keys(params).length >= 1 && ojob_shouldRun) {
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
	print("");
	print("(version " + af.getVersion() + ", " + Packages.openaf.AFCmdBase.LICENSE +")");
	ojob_shouldRun = false;
}

function ojob__getFile() {
	/*var ks = Object.keys(params);
	if (ks.length >= 1) {
		var f = ks[0];
		delete params[f];
		print(f);
		return f; */
	if (isDef(fparam)) {
		return fparam;
	} else {
		printErr("Didn't recognize the aYamlFile.yaml\n");
		ojob_showHelp();
		return undefined;
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

		if (isUnDef(j)) return undefined;

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
		var nn = (isDef(v.name) ? v.name : v);
		printnl("[" + ansiColor("bold", nn) + "]");
		var deps = getDeps(nn);
		print(getPath(nn));
	});
	
	print(ansiColor("bold,underline", "\nPaths:"));
	oj.todo.map(function(v) {
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
		return undefined;*/
		job = "help";
	}
	
	if (isDef(file)) {
		var hh = $from(ow.loadOJob().previewFile(file).jobs).equals("name", job).select({"name":"n/a", "help": "n/a"})[0];
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
                   	printErr("Didn't find job help for '" + job + "'.");
                        return undefined;
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

		//__expr = $from(params).select(function(r) { var rr={}; var kk = Object.keys(r)[0]; return kk+"="+r[kk]; }).join(" ");
		//__expr = "";
		//for(var ii in params) {
		//	__expr += ii + "=" + params[ii].replace(/ /g, "\\ ") + " ";
		//}
		
		if (isDef(file)) {
			oJobRunFile(file, ojob_args, void 0, (nocolor) ? { conAnsi: false } : void 0);
		}
	}
}
