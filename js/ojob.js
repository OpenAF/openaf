var params = processExpr(" ");
var ojob_shouldRun = true;
var ojob_args = {};
ow.loadOJob();

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
	print("Usage: ojob aYamlFile.yaml [options]\n");
	print("  -compile       Compile all includes and current file into a single yaml output.");
	print("  -tojson        Outputs all includes and current fiel into a single json output.")
	print("  -jobs          List all jobs available.");
	print("  -todo          List the final todo list.");
	print("  -jobhelp (job) Display any available help information for a job.");
	print("");
	print("(version " + af.getVersion() + ", " + Packages.wedo.openaf.AFCmdBase.LICENSE +")");
	ojob_shouldRun = false;
}

function ojob__getFile() {
	var ks = Object.keys(params);
	if (ks.length >= 1) {
		var f = ks[0];
		delete params[f];
		return f;
	} else {
		printErr("Didn't recognize the aYamlFile.yaml\n");
		ojob_showHelp();
		return undefined;
	}
}

function ojob_compile() {
	var file = ojob__getFile();
	
	if (isDef(file)) {
		print(af.toYAML(ow.oJob.previewFile(file)));
	}
	ojob_shouldRun = false;
}

function ojob_tojson() {
	var file = ojob__getFile();
	
	if (isDef(file)) {
		sprint(ow.oJob.previewFile(file));
	}
	ojob_shouldRun = false;
}

function ojob_jobs() {
	var file = ojob__getFile();
	
	if (isDef(file)) {
		print(af.toYAML($stream(ow.oJob.previewFile(file).jobs).map("name").toArray().sort()));
	}
	ojob_shouldRun = false;
}

function ojob_jobhelp() {
	var file = ojob__getFile();
	
	var ks = Object.keys(params);
	var job = "";
	if (ks.length >= 1) {
		job = ks[0];
		delete params[job];
	} else {
		printErr("Didn't recognize the job to try to obtain help from.\n");
		ojob_showHelp();
		return undefined;
	}
	
	if (isDef(file)) {
		var hh = $from(ow.oJob.previewFile(file).jobs).equals("name", job).select({"name":"n/a", "help": "n/a"})[0];
		if (isDef(hh)) {
			print(hh.name);
			print(repeat(hh.name.length, '-'));
			print("");
			print(hh.help);
		}
	}
	ojob_shouldRun = false;
}

function ojob_todo() {
	var file = ojob__getFile();
	
	if (isDef(file)) {
		var l = ow.oJob.previewFile(file).todo;
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
			oJobRunFile(file, ojob_args);
		}
	}
}