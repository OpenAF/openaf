/**
 * <odoc>
 * <key>oJob.oJob() : oJob</key>
 * Creates an instance of an oJob. O
 * Uses the channel oJob::log for job logging, oJob::jobs for job register, oJob::todo as
 * job todo register and oJob::oJob for oJob instances registry.
 * </odoc>
 */
OpenWrap.oJob = function() { 
	//startLog();

	this.__host = "local";
	this.__ip = "127.0.0.1";

	try {
		this.__host = String(java.net.InetAddress.getLocalHost().getHostName());
		this.__ip = String(java.net.InetAddress.getLocalHost().getHostAddress());
	} catch(e) {
		logErr(e);
	}

	this.__id = sha256(this.__host + this.__ip);
	this.__threads = {};
	this.__ojob = { log: true, logArgs: false, numThreads: undefined };
	this.__expr = processExpr(" ");

	plugin("Threads");
	ow.loadFormat();

	this.getTodoCh().create();
	this.getJobsCh().create();
	this.getLogCh().create();
	this.getMainCh().create();

	this.getMainCh().set(
		{ "uuid": this.__id },
		{
			"uuid": this.__id,
			"host": this.__host,
			"ip"  : this.__ip
		}
	);

	return ow.oJob;
};

/**
 * <odoc>
 * <key>oJob.load(aJobsList, aTodoList, aoJobList, args, aId)</key>
 * Loads a set of aJobsList, corresponding aTodoList and a list of aoJobList.
 * Optionally you can provide aId to segment these specific jobs.
 * </odoc>
 */
OpenWrap.oJob.prototype.load = function(jobs, todo, ojob, args, aId) {
	if (isUnDef(jobs)) jobs = [];
	if (isUnDef(todo)) todo = [];
	if (isDef(ojob)) this.__ojob = merge(this.__ojob, ojob);

	for(var i in todo) {
		if (isDef(ojob) && isDef(ojob.sequential) && ojob.sequential && i > 0) {
			var j = $from(jobs).equals("name", (isObject(todo[i]) ? todo[i].name : todo[i])).first();
			if (isDef(j)) {
				if (isUnDef(j.deps)) j.deps = [];
				j.deps.push((isObject(todo[i-1]) ? todo[i-1].name : todo[i-1]));
			}
		}
	}
	
	for(var i in jobs) {
		this.addJob(this.getJobsCh(), jobs[i].name, jobs[i].deps, jobs[i].type, jobs[i].typeArgs, jobs[i].args, jobs[i].exec, jobs[i].from, jobs[i].to, jobs[i].help);
	}
	this.addTodos(todo, args, aId);

	if (isDef(ojob.numThreads)) {
		this.__ojob.numThreads = ojob.numThreads;
	}
	
	if (isDef(this.__ojob.channels)) {
		if (this.__ojob.channels.log) startLog();
		if (this.__ojob.channels.expose) {
			if (isDef(this.__ojob.channels.port)) {

				if (isUnDef(this.__hs)) {
					this.__hs = ow.loadServer().httpd.start(this.__ojob.channels.port, this.__ojob.channels.host, this.__ojob.channels.keyStorePath, this.__ojob.channels.keyPassword);
				
					var parent = this;
	
					var auth = function(u, p, s, r) {
						if (isUnDef(parent.__ojob.channels.permissions)) 
							r.channelPermission = "r";
						else
							r.channelPermission = parent.__ojob.channels.permissions;	
						
						return true;				
					};
	
					if (isDef(parent.__ojob.channels.auth)) {
						auth = function(u, p, s, r) {
							if (isUnDef(parent.__ojob.channels.permissions)) 
								r.channelPermission = "r";
							else
								r.channelPermission = parent.__ojob.channels.permissions;
							var creds = $from(parent.__ojob.channels.auth).equals("login", u).at(0);
					
							if (isDef(creds) && isDef(creds.pass) && p == creds.pass) {
								if (isDef(creds.permissions)) r.channelPermission = creds.permissions;
								return true;
							} else {
								return false;
							}
						}
					}
	
					if (isUnDef(this.__ojob.channels.list)) {
						this.__ojob.channels.list = $ch().list();
						//this.__ojob.channels.list.push("__log");
					}
	
					for(var i in this.__ojob.channels.list) {
						$ch(this.__ojob.channels.list[i]).expose(this.__hs, undefined, auth);
					}
				}
			}
		}
	}
}

/**
 * <odoc>
 * <key>ow.oJob.loadJSON(aJSON) : Object</key>
 * Loads aJSON oJob configuration and returns the processed map (with all includes processed).
 * </odoc>
 */
OpenWrap.oJob.prototype.loadJSON = function(aJSON) {
	if (!isObject(aJSON)) return {};
	var res = aJSON;

	if (isDef(res.include) && isArray(res.include)) {
		loadLodash();
		res.include = _.uniq(res.include);
		for (var i in res.include) {
			if (res.include[i].match(/\.js$/i)) load(res.include[i]);
			if (res.include[i].match(/\.ya?ml$/i)) res = this.__merge(this.__loadFile(res.include[i]), res);
		}
	}
	
	if (!(isArray(res.ojob)) && !(isArray(res.todo))) {
		throw("ojob and todo entries need to be defined as arrays.");
	}

	return res;
}

OpenWrap.oJob.prototype.__merge = function(aJSONa, aJSONb) {
	var res = { include: [], jobs: [], todo: [], ojob: {} };
	
	if (isDef(aJSONa.include)) 
		res.include = aJSONa.include.concat(isDef(aJSONb.include) ? aJSONb.include : []);
	else
		res.include = isDef(aJSONb.include) ? aJSONb.include : [];
	
	loadLodash();
	res.include = _.uniq(res.include);

	if (isDef(aJSONa.jobs)) 
		res.jobs = aJSONa.jobs.concat(isDef(aJSONb.jobs) ? aJSONb.jobs : []);
	else
		res.jobs = isDef(aJSONb.jobs) ? aJSONb.jobs : [];
	
	if (isDef(aJSONa.todo)) 
		res.todo = aJSONa.todo.concat(isDef(aJSONb.todo) ? aJSONb.todo : []);
	else
		res.todo = isDef(aJSONb.todo) ? aJSONb.todo : [];
	
	if (isDef(aJSONa.ojob)) 
		res.ojob = merge(aJSONa.ojob, aJSONb.ojob);
	else
		res.ojob = isDef(aJSONb.ojob) ? aJSONb.ojob : {};
	
	return res;
}

OpenWrap.oJob.prototype.__loadFile = function(aFile) {
	var res = {};

	function _load(aFn) {
		var res = {};
		try {
			res = aFn(aFile);
			return res;
		} catch(e1) {
			if (e1.message.match(/FileNotFoundException/)) {
				var paths = getOPackPaths();
				//paths["__default"] = java.lang.System.getProperty("java.class.path") + "::oJob";
				
				for(i in paths) {
					try {
						paths[i] = paths[i].replace(/\\+/g, "/");
						paths[i] = paths[i].replace(/\/+/g, "/");
						res = aFn(paths[i] + "/" + aFile);
						return res;
					} catch(e2) {
						if (!e2.message.match(/FileNotFoundException/)) {
							throw e2;
						}
					}
				}
				throw "File not found! (" + aFile + ")";
			} else {
				throw e1;
			}
		}
	}
	
	if (isDef(aFile)) {		
		if (aFile.match(/\.js$/i)) {
			res = this.__merge(_load(io.readFile), res);
		}
		if (aFile.match(/\.ya?ml$/i)) {
			res = this.__merge(_load(io.readFileYAML), res);
		}
	}

	return this.loadJSON(res);
}

/**
 * <odoc>
 * <key>ow.oJob.loadFile(aFile, aId)</key>
 * Loads the configuration from a YAML or JSON aFile and loads all configuration.\
 * Optionally you can provide aId to segment these specific jobs.\
 * \
 * Example of YAML:\
 * # Name your includes\
 * #\
 * include:\
 *   - hello.js   # Some nice hello function\
 * \
 * # Define the jobs\
 * jobs:\
 *    # Start processing\
 *    - name        : Start processing\
 *      exec        : >\
 *         log("init");\
 *         //sprint(ow.oJob.getJobsCh().getAll());\
 * \
 * # Stop processing\
 *    - name        : Stop processing\
 *      type        : shutdown\
 *      exec        : >\
 *         log("done");\
 *         sprint(ow.oJob.getLogCh().getAll());\
 * \
 * # Hello world after start processing\
 *    - name	      : Hello world\
 *      deps          : \
 *         - Start processing\
 *      exec 	      : >\
 *         sprint(args);  \
 *         hello("nuno");\
 * \
 * # Bye world\
 *    - name        : Bye\
 *      deps        :\
 *         - Hello world\
 *         - Say the time\
 *      exec        :\
 *         print("bye, nice to meet you.");\
 * \
 * # Say the time regularly\
 *    - name        : Say the time\
 *      type        : periodic\
 *      typeArgs    :\
 *         timeInterval   : 1000\
 *         waitForFinish  : true\
 *         cron           : "*\/5 * * * * *"\
 *      exec        : >\
 *         print(new Date());\
 * \
 * # List what to do \
 * todo:\
 *    - Start processing\
 *    - Say the time\
 *    - Hello world\
 *    - Bye\
 *    - Stop processing\
 * \
 * # This will be a daemon\
 * ojob:\
 *    daemon: false\
 *    unique:\
 *       pidFile     : helloworld.pid\
 *       killPrevious: true\
 *    channels:\
 *       expose     : true\
 *       port       : 17878\
 *       permissions: r\
 *    #list       :\
 *    #  - oJob::log\
 *    #auth       :\
 *    #  - login: ojob\
 *    #    pass : ojob\
 *    #    permissions: r\
 * \
 * </odoc>
 */
OpenWrap.oJob.prototype.loadFile = function(aFile, args, aId) {
	var s = this.__loadFile(aFile);
	if (isDef(s))
		this.load(s.jobs, s.todo, s.ojob, args, aId);
}

/**
 * <odoc>
 * <key>ow.oJob.runFile(aFile, args, aId)</key>
 * Loads aFile configuration and executes the oJob defined with the provided args.
 * Optionally you can provide aId to segment these specific jobs.
 * </odoc>
 */
OpenWrap.oJob.prototype.runFile = function(aFile, args, aId) {
	this.loadFile(aFile, args, aId);

	this.start(args, true, aId);
}

/**
 * <odoc>
 * <key>ow.oJob.previewFile(aFile) : Map</key>
 * Returns a map with a preview of the oJob configuration that would be executed with aFile.
 * </odoc>
 */
OpenWrap.oJob.prototype.previewFile = function(aFile) {
	return this.__loadFile(aFile);
}

/**
 * <odoc>
 * <key>ow.oJob.getJobsCh() : Channel</key>
 * Gets the oJob::jobs channel
 * </odoc>
 */
OpenWrap.oJob.prototype.getJobsCh = function() { return $ch("oJob::jobs"); }
/**
 * <odoc>
 * <key>ow.oJob.getTodoCh() : Channel</key>
 * Gets the oJob::todo channel
 * </odoc>
 */
OpenWrap.oJob.prototype.getTodoCh = function() { return $ch("oJob::todo"); }
/**
 * <odoc>
 * <key>ow.oJob.getLogCh() : Channel</key>
 * Gets the oJob::log channel
 * </odoc>
 */
OpenWrap.oJob.prototype.getLogCh = function() { return $ch("oJob::log"); }
/**
 * <odoc>
 * <key>ow.oJob.getMainCh() : Channel</key>
 * Gets the oJob::oJob channel
 * </odoc>
 */
OpenWrap.oJob.prototype.getMainCh = function() { return $ch("oJob::oJob"); }

/**
 * <odoc>
 * <key>oJob.getID() : String</key>
 * Returns this oJob instance ID. Useful to lookup logging in the oJob::log channel.
 * </odoc>
 */
OpenWrap.oJob.prototype.getID = function() {
	return this.__id;
}

/**
 * <odoc>
 * <key>oJob.setJob(aJobName, aJob) : oJob</key>
 * Adds or overwrites an existing aJobName with the configuration aJob.
 * </odoc>
 */
OpenWrap.oJob.prototype.setJob = function(aJobName, aJob) {
	this.getJobsCh().set(aJobName, aJob);
	return this;
}

/**
 * <odoc>
 * <key>oJob.removeJob(aJobName) : oJob</key>
 * Removes aJobName.
 * </odoc>
 */
OpenWrap.oJob.prototype.removeJob = function(aJobName) {
	this.getJobsCh().unset(aJobName);
	return this;
}

/**
 * <odoc>
 * <key>oJob.addTodos(aTodoList, aId) : oJob</key>
 * Adds a new aTodoList array of job names.
 * Optionally you can provide aId to segment these specific jobs.
 * </odoc>
 */
OpenWrap.oJob.prototype.addTodos = function(todoList, aJobArgs, aId) {
	var altId = (isDef(aId) ? aId : "");
	for(var i in todoList) {
		if(isDef(aJobArgs) && isObject(todoList[i])) 
			todoList[i].args = this.__processArgs(todoList[i].args, aJobArgs, aId);

		if (isObject(todoList[i])) {
			this.addTodo(this.getID() + altId, this.getJobsCh(), this.getTodoCh(), todoList[i].name, todoList[i].args, todoList[i].type, todoList[i].typeArgs);
		} else {
			this.addTodo(this.getID() + altId, this.getJobsCh(), this.getTodoCh(), todoList[i], undefined, undefined, aJobArgs);
		}
	}
	return this;
}

/**
 * <odoc>
 * <key>oJob.__addLog(aOperation, aJobName, aJobExecId, anErrorMessage) : String</key>
 * Adds a new log entry to the channel oJob::log for the aJobName provided for the following operations:\
 * \
 * - start (start of a job)\
 * - success (successfully end of a job)\
 * - error (erroneous end of a job)\
 * - depsfail (job not started do to failed dependencies)\
 * \
 * Optionally, for the operation error, you can provide also anErrorMessage.\
 * Returns the current aJobExecId (or the created one for the operation start).
 * </odoc>
 */
OpenWrap.oJob.prototype.__addLog = function(aOp, aJobName, aJobExecId, args, anException, aId) {
	var aId = (isDef(aId) ? aId : ""); 
		
	var info = {
			"ojobId"      : this.__id + aId,
			"name"        : aJobName,
			"start"       : false,
			"error"       : false,
			"success"     : false,
			"deps"        : false,
			"count"       : 0,
			"totalTime"   : 0,
			"avgTime"     : 0,
			"log"         : []
	};

	var existing = this.getLogCh().get({ "ojobId": this.__id + aId, "name": aJobName });
	if (isUnDef(existing)) {
		info.createDate = now();
		existing = info;
	}

	existing.lastModify = now();
	var currentJobExecId = isUnDef(aJobExecId) ? genUUID() : aJobExecId;

	switch(aOp.toLowerCase()) {
	case "start"   :
		existing.start   = true;
		existing.deps    = true;
		existing.log.push({
			id: currentJobExecId,
			startTime: now()
		})
		break;
	case "success" :
		existing.success = true;
		existing.count++;
		var execJob = $from(existing.log).equals("id", currentJobExecId).at(0);
		execJob.endTime = now();
		existing.totalTime += execJob.endTime - execJob.startTime;
		existing.avgTime = existing.totalTime / existing.count;
		break;
	case "error"   :
		existing.error   = true;
		existing.count++;
		var execJob = $from(existing.log).equals("id", currentJobExecId).at(0);
		execJob.error = anException;
		execJob.endTime  = now();
		existing.totalTime += execJob.endTime - execJob.startTime;
		existing.avgTime = existing.totalTime / existing.count;
		break;
	case "depsfail":
		existing.deps    = false;
		break;
	default: existing = undefined;
	}

	if (isDef(existing)) {

		var aa = "";
		if (isDef(args) && this.__ojob.logArgs) {
			var temp = clone(args);
			delete temp.objId;
			delete temp.execid;
			aa = "[" + existing.name + "] | " + JSON.stringify(temp) + "\n";
		}
		try {
			var s = "", ss = "";
			plugin("Console"); 
			var con = (new Console()).getConsoleReader();
			var w = con.getTerminal().getWidth();
			var ansis = con.getTerminal().isAnsiSupported() && (java.lang.System.console() != null);
			var jansi = JavaImporter(Packages.org.fusesource.jansi);
			
			if (ansis) {
				jansi.AnsiConsole.systemInstall();
				s  = repeat(w, '-') + "\n";
				ss = repeat(w, '=');
			} else {
				s  = repeat(80, '-') + "\n";
				ss = repeat(80, '=') + "\n";
			}

			var _c = function(m) { 
				return ansis ? 
						jansi.Ansi.ansi().boldOff().fg(jansi.Ansi.Color.GREEN).a(m).a(jansi.Ansi.Attribute.RESET) 
						: m; 
			}
			
			var _g = function(m) { 
				return ansis ? 
						jansi.Ansi.ansi().boldOff().a(m).a(jansi.Ansi.Attribute.RESET) 
						: m; 
			}

			var _b = function(m) { 
				return ansis ? 
						jansi.Ansi.ansi().bold().a(m).a(jansi.Ansi.Attribute.RESET) 
						: m; 
			}

			var _e = function(m) { 
				return ansis ? 
						jansi.Ansi.ansi().bold().fg(jansi.Ansi.Color.RED).a(m).a(jansi.Ansi.Attribute.RESET) 
						: m; 
			}

			if (existing.name != 'oJob Log') {
				var msg = "[" + existing.name + "] | ";
				if (existing.start && (!existing.error && !existing.success)) { 
					var __d = new Date();
					var __m = msg + "STARTED | " + __d;
					printnl(_b(__m) + "\n" + _g(aa) + _c(s)); 
					if (isDef(getChLog())) getChLog().set({ d: __d, t: "INFO" }, { d: __d, t: "INFO", m: __m });
				}
				if (existing.start && existing.error) { 
					var __d = new Date();
					var __m = msg + "Ended in ERROR  | " + __d;
					printErr("\n" + _e(ss) + _g(aa) + _b(__m) + "\n" + stringify(existing) + "\n" + _e(ss)); 
					if (isDef(getChLog())) getChLog().set({ d: __d, t: "ERROR" }, { d: __d, t: "ERROR", m: __m });
				}
				if (existing.start && existing.success) { 
					var __d = new Date();
					var __m = msg + "Ended with SUCCESS | " + __d;
					printnl("\n" + _c(ss)); print(_g(aa) +_b(__m) + "\n"); 
					if (isDef(getChLog())) getChLog().set({ d: __d, t: "INFO" }, { d: __d, t: "INFO", m: __m });
				}
			}
		} catch(e) { 
			logErr(e); 
	    } finally { 
	    	if (ansis) jansi.AnsiConsole.systemUninstall(); 
	    }

		// Housekeeping
		if (existing.log.length > 1000) existing.log.shift();

		this.getLogCh().set({ "ojobId": this.__id + aId, "name": aJobName }, existing);
	}

	return currentJobExecId;
}

/**
 * <odoc>
 * <key>oJob.stop()</key>
 * Stops all oJob processing.
 * </odoc>
 */
OpenWrap.oJob.prototype.stop = function() {
	this.getLogCh().waitForJobs(2000);
	for(var i in this.__threads) {
		for(var j in this.__threads[i]) {
			this.__threads[i][j].stop();
		}
	}
	stopLog();
}

OpenWrap.oJob.prototype.__processArgs = function(aArgsA, aArgsB, aId, execStr) {
	var argss = {};
	if (isDef(aArgsA)) {
		if (isArray(aArgsA)) {
			argss = merge(argss, { __oJobRepeat: aArgsA });	
		} else {
			if (isObject(aArgsA)) {
				if (execStr && isDef(aArgsA.__oJobExec)) 
					argss = merge(argss, this.__processArgs(eval(aArgsA.__oJobExec)));
				else
					argss = merge(argss, aArgsA);
			} else {
				if (isString(aArgsA)) {
					argss = merge(argss, { __oJobExec: aArgsA });
				}
			}
		}
	}
	
	if (isDef(aArgsB)) {
		argss = merge(argss, this.__processArgs(aArgsB));
	}
	
	argss.__id = aId;

	return argss;
}

/**
 * <odoc>
 * <key>oJob.start(args, shouldStop, aId) : oJob</key>
 * Starts the todo list. Optionally you can provide arguments to be used by each job.
 * Optionally you can provide aId to segment these specific jobs.
 * </odoc>
 */
OpenWrap.oJob.prototype.start = function(provideArgs, shouldStop, aId) {
	var args = isDef(provideArgs) ? this.__processArgs(provideArgs, this.__expr, aId) : this.__expr;
	var parent = this;
	
	if (this.__ojob != {}) {
	    if (isUnDef(this.__ojob.timeInterval)) this.__ojob.timeInterval = 2000;

	    //if (isUnDef(this.__ojob.unique)) this.__ojob.unique = {};
	    if (isDef(this.__ojob.unique)) {
	    	if (isUnDef(this.__ojob.unique.pidFile)) this.__ojob.unique.pidFile = "ojob.pid";
	    	if (isUnDef(this.__ojob.unique.killPrevious)) this.__ojob.unique.killPrevious = false;

	    	var s = ow.loadServer().checkIn(this.__ojob.unique.pidFile, function(aPid) {
	    		if (parent.__ojob.unique.killPrevious || isDef(args.stop) || isDef(args.restart) || isDef(args.forcestop)) {
	    			if (isDef(args.forcestop) || !pidKill(ow.server.getPid(aPid), false)) {
	    				pidKill(ow.server.getPid(aPid), true);
	    			}

		    		var didDie = !(pidCheck(aPid));
		    		
		    		if ((isDef(args.restart) || parent.__ojob.unique.killPrevious) && didDie) {
		    			log("Restarting");
		    			return true;
		    		}
		    		if (isDef(args.stop) || isDef(args.forcestop)) {
		    			if (didDie) {
		    				log("Stopped"); exit(0);
		    			} else {
		    				log("Failed to stop (" + aPid + ")"); exit(-1);
		    			}
		    		}
	    		}
		    	if (isDef(args.status)) {
		    		var pid = ow.server.getPid(aPid);
					var word = (pidCheck(pid) ? "Running on" : "Not running but registered with")
					if (isDef(pid)) log(word + " pid = " + pid);
					return false;
		    	}
		    	
		    	return false;
	    	});
	    	
	    	if (isDef(args.status) && s) {
	    		log("Not running");
	    		exit(0);
	    	}
		}
	}

	var t = new Threads();
	var parent = this;
	var altId = (isDef(aId) ? aId : "");

	if (this.__ojob.sequential) {
		var job = undefined;
		var listTodos = $from(this.getTodoCh().getSortedKeys()).equals("ojobId", this.getID() + altId).select();
		while(listTodos.length > 0) {
			var todo = this.getTodoCh().get(listTodos.shift());
			job = this.getJobsCh().get({ name: todo.name });
			var argss = args;
			if (isDef(todo.args)) {
				argss = this.__processArgs(args, todo.args, aId);
			}
			if (isDef(job)) {
				var res = this.runJob(job, argss, aId);
				if (res == true) {
					this.getTodoCh().unset({
						"ojobId": todo.ojobId,
						"todoId": todo.todoId
					}, todo);
				}
			} else {
				logErr("Job " + todo.name + " not found!");
				this.getTodoCh().unset({
					"ojobId": todo.ojobId,
					"todoId": todo.todoId
				});
				listTodos = $from(this.getTodoCh().getSortedKeys()).equals("ojobId", this.getID() + altId).select();
			}
		}
	} else {
		t.addThread(function() {
			// Check all jobs in the todo queue
			var job = undefined; 
			var shouldStop = false;
			while(!shouldStop) {
				try {
					if ($from(parent.getTodoCh().getKeys()).equals("ojobId", parent.getID() + altId).any()) {
						var todo = parent.getTodoCh().get($from(parent.getTodoCh().getKeys()).equals("ojobId", parent.getID() + altId).first());
						job = parent.getJobsCh().get({ "name": todo.name });
						var argss = args;
						if (isDef(todo.args)) {
							argss = parent.__processArgs(args, todo.args, aId);					
						}
						if (isDef(job)) {
							var res = parent.runJob(job, argss, aId);
							if (res == true) {
								parent.getTodoCh().unset({ 
									"ojobId": todo.ojobId,
								    "todoId": todo.todoId
								}, todo);
							}
						} else {
							logErr("Job " + todo.name + " not found!");
							parent.getTodoCh().unset({
								"ojobId": todo.ojobId,
								"todoId": todo.todoId
							})
						}
					}
					if (!shouldStop && 
						!(isDef(parent.__ojob) && isDef(parent.__ojob.daemon) && parent.__ojob.daemon == true) &&
		                $from(parent.getTodoCh().getKeys()).equals("ojobId", parent.getID() + altId).none()
		               ) {
		               	  shouldStop = true;
		               	  try {
						      parent.stop();              		  
		               	  } catch(e) {}
					} 
				} catch(e) { logErr(e); if (isDef(e.javaException)) e.javaException.printStackTrace(); }
				if (isDef(parent.__ojob) && parent.__ojob.daemon == true) 
					sleep((isDef(parent.__ojob.timeInterval) ? parent.__ojob.timeInterval : 100));
				else
					sleep(100);
			}
		});
	}
	
	if (!(this.__ojob.sequential)) t.start();

	if (this.__ojob != {} && this.__ojob.daemon == true && this.__ojob.sequential == true)
		ow.loadServer().daemon(this.__ojob.timeInterval);
	/*if (this.__ojob != {} && this.__ojob.daemon == true) {
		ow.loadServer().daemon(this.__ojob.timeInterval);
	}*/

	if (!(this.__ojob.sequential)) {
		try {
			t.waitForThreads(2500);
			t.stop();
		} catch(e) {}
	}
}

/**
 * <odoc>
 * <key>ow.oJob.run(providedArgs, aId)</key>
 * Tries to run the current loaded configuration jobs (on the corresponding channels) with
 * the provided arguments (providedArgs).
 * Optionally you can provide aId to segment these specific jobs.
 * </odoc>
 */
OpenWrap.oJob.prototype.run = function(provideArgs, aId) {
	this.start(provideArgs, true, aId);
}

/**
 * <odoc>
 * <key>ow.oJob.runJob(aJob, provideArgs, aId)</key>
 * With jobs defined try to execute/start aJob, with the provideArgs, directly passing any existing todo list. 
 * Optionally you can provide aId to segment this specific jobs.
 * </odoc>
 */
OpenWrap.oJob.prototype.runJob = function(aJob, provideArgs, aId) {
	var parent = this;
	var altId = (isDef(aId) ? aId : "");

	// Check dep
	var canContinue = true;
	var depInfo = {};
	if (isDef(aJob.deps)) {		
		for(var j in aJob.deps) {
			if (canContinue) {
				try {
					var dep = (isObject(aJob.deps[j]) ? aJob.deps[j].name :  aJob.deps[j]);
					var depInf = this.getLogCh().get({ "ojobId": this.getID() + altId, "name": dep });
					depInfo[dep] = aJob.deps[j];

					if (isDef(depInf) && depInf.success) {
						canContinue = true;
						if (isDef(aJob.deps[j].onSuccess)) {
							var res = (new Function(aJob.deps[j].onSuccess))();
							canContinue = res;
						}
						depInfo[dep].result = true;
					} else {
						canContinue = false;
						this.__addLog("depsFail", aJob.name, undefined, provideArgs, undefined, aId);
						if (isDef(aJob.deps[j].onFail) && isDef(depInf) && depInf.error) {
							var res = (new Function(aJob.deps[j].onFail))();
							canContinue = res;
						}
						depInfo[dep].result = false;
					}
				} catch(e) {
					logWarn("Issue while trying to process dependency " + stringify(aJob.deps) + ": " + e);
				}
			}
		}
	}

	function _run(aExec, args, job, id) {		
		var f = new Function("var args = arguments[0]; var job = arguments[1]; var id = arguments[2]; var deps = arguments[3]; " + aExec);
		if (isDef(args.__oJobRepeat)) { 
			var errors = [];
			parallel4Array(args.__oJobRepeat, function(aValue) {
				try {
					return f(aValue, job, id, depInfo);
				} catch(e) {
					errors.push(stringify({ args: aValue, exception: e}));
				}
			}, parent.__ojob.numThreads);
			if (errors.length > 0) {
				throw errors.join(", ");
			}
		} else {
			f(args, job, id, depInfo);
		}
	}
	
	if (canContinue) {
		var args = isDef(provideArgs) ? this.__processArgs(provideArgs, undefined, aId, true) : {};
		
		args.objId = this.getID() + altId;
		var uuid = this.__addLog("start", aJob.name, undefined, args, undefined, aId);
		args.execid = uuid;
        args = merge(args, aJob.args);

		switch(aJob.type) {
		case "single":
			try {
				_run(aJob.exec, args, aJob, altId);
				this.__addLog("success", aJob.name, uuid, args, undefined, aId);
				return true;
			} catch(e) {
				this.__addLog("error", aJob.name, uuid, args, e, aId);
				return true;
			}
			break;
		case "jobs":
			if (isDef(aJob.typeArgs.file)) {
				try {
					if (isDef(args.__oJobRepeat)) {
						var errors = [];
						parallel4Array(args.__oJobRepeat, function(aV) {
							try {
								parent.runFile(aJob.typeArgs.file, aV, aJob.typeArgs.file + md5(stringify(aV)));
								return aV;
							} catch(e1) {
								errors.push({ k: aV, e: e1});
							}
						}, parent.__ojob.numThreads);
						if (errors.length > 0) throw stringify(errors);
						this.__addLog("success", aJob.name, uuid, args, undefined, aId);
					} else {
						parent.runFile(aJob.typeArgs.file, args, aJob.typeArgs.file);
						this.__addLog("success", aJob.name, uuid, args, undefined, aId);
					}
					return true;
				} catch(e) {
					this.__addLog("error", aJob.name, uuid, args, e, aId);
					return true;
				}
			} else {
				this.__addLog("error", aJob.name, uuid, args, "No typeArgs.file provided.", aId);
				return true;
			}
			break;
		case "shutdown":
			addOnOpenAFShutdown(function() {
				try {
					_run(aJob.exec, args, aJob, altId);
					parent.__addLog("success", aJob.name, uuid, undefined, aId);
				} catch(e) {
					parent.__addLog("error", aJob.name, uuid, args, e, aId);
				}
			});
			break;
		case "periodic":
			var t = new Threads();
			t.addThread(function() {
				if (isDefined(aJob.typeArgs.cron) &&
        			!(ow.format.cron.isCronMatch(new Date(), aJob.typeArgs.cron))) {
        			return false;
        		} 

				uuid = parent.__addLog("start", aJob.name, undefined, args, aId);
				args.execid = uuid;
				try {
					_run(aJob.exec, args, aJob, altId);
					parent.__addLog("success", aJob.name, uuid, args, undefined, aId);
				} catch(e) {
					parent.__addLog("error", aJob.name, uuid, args, e, aId);
				}

				return true;
			});
			if (isDef(this.__threads[aJob.name]))
				parent.__threads[aJob.name].push(t)
			else
				parent.__threads[aJob.name] = [ t ];

			if (isUnDef(aJob.typeArgs)) aJob.typeArgs = {};
			if (isUnDef(aJob.typeArgs.timeInterval)) aJob.typeArgs.timeInterval = 2000;
			if (isDef(aJob.typeArgs.waitForFinish) && aJob.typeArgs.waitForFinish)
				t.startWithFixedRate(aJob.typeArgs.timeInterval);
			else
				t.startAtFixedRate(aJob.typeArgs.timeInterval);
			break;
		}
	} else {
		return false;
	}

	return true;
}

/**
 * <odoc>
 * <key>ow.oJob.addJob(aJobsCh, aName, jobDeps, jobType, aJobTypeArgs, jobArgs, jobFunc, jobFrom, jobTo, jobHelp)</key>
 * Provided aJobsCh (a jobs channel) adds a new job with the provided aName, an array of jobDeps (job dependencies),
 * a jobType (e.g. single, peoridic, shutdown), aJobTypeArgs (a map), jobArgs and a jobFunc (a job function). 
 * Optionally you can inherit the job definition from a jobFrom and/or jobTo name ("from" will execute first, "to" will execute after).
 * Also you can include jobHelp.
 * </odoc>
 */
OpenWrap.oJob.prototype.addJob = function(aJobsCh, aName, jobDeps, jobType, jobTypeArgs, jobArgs, jobFunc, jobFrom, jobTo, jobHelp) {
	if (isUnDef(jobDeps)) jobDeps = [];
	if (isUnDef(jobType)) jobType = "single";
	if (isUnDef(jobFunc)) jobFunc = function() {};
	if (isUnDef(jobHelp)) jobHelp = "";

	var j = {};
	var fstr = jobFunc.toString();
	
	if (isDef(jobFrom)) {
		var f = aJobsCh.get({ "name": jobFrom });
		if (isDef(f)) {
			j.type = f.type;
			j.typeArgs = f.typeArgs;
            j.args = f.args;
			j.deps = f.deps;
			j.exec = f.exec;
			j.help = f.help;
		} else {
			logWarn("Didn't found dep job '" + jobFrom + "' for job '" + aName + "'");
		}
	}
	
	j = {
		"name": aName,
		"type": jobType,
		"typeArgs": (isDef(j.typeArgs) ? merge(j.typeArgs, jobTypeArgs) : jobTypeArgs),
        "args": (isDef(j.args) ? this.__processArgs(j.args, jobArgs) : this.__processArgs(jobArgs)),
		"deps": (isDef(j.deps) ? j.deps.concat(jobDeps) : jobDeps),
		"exec": (isDef(j.exec) ? j.exec : "") + fstr,
		"help": (isDef(j.help) ? j.help : "") + jobHelp,
		"from": jobFrom,
		"to"  : jobTo
	};	
	
	if (isDef(jobTo)) {
		var f = aJobsCh.get({ "name": jobTo });
		if (isDef(f)) {
			j.type = (isDef(f.type) ? f.type : j.type);
			j.typeArgs = (isDef(f.typeArgs) ? merge(j.typeArgs, f.typeArgs) : j.typeArgs);
            j.args = (isDef(f.args) ? this.__processArgs(j.args, f.args) : this.__processArgs(j.args));
			j.deps = (isDef(f.deps) ? j.deps.concat(f.deps) : j.deps);
			j.exec = j.exec + (isDef(f.exec) ? f.exec : "");
			j.help = j.help + (isDef(f.help) ? f.help : "");
		}
	}
	
	aJobsCh.set({
		"name": aName
	}, j);
}

/**
 * <odoc>
 * <key>ow.oJob.addTodo(aOJobID, aJobsCh, aTodoCh, aJobName, aJogArgs, aJobType, aJobTypeArgs)</key>
 * Provided aOJobID (a oJob instance), aJobsCh (a jobs channel), aTodoCh (a todo channel), aJobArgs (job arguments).
 * Optionally you can force the aJobType and aJobTypeArgs.
 * </odoc>
 */
OpenWrap.oJob.prototype.addTodo = function(aOJobID, aJobsCh, aTodoCh, aJobName, aJobArgs, aJobType, aJobTypeArgs) {
	var todoId = genUUID();
 
	var job = aJobsCh.get({ "name": aJobName });
	if (isUnDef(job) || job == {}) throw "Job '" + aJobName + "' wasn't found.";

	var jobType = (isUnDef(aJobType)) ? job.type : aJobType;
	var jobTypeArgs = (isUnDef(aJobType)) ? job.typeArgs : aJobTypeArgs;

	aTodoCh.set({
		"ojobId"    : aOJobID,
		"todoId"    : todoId
	}, {
		"ojobId"      : aOJobID,
		"todoId"      : todoId,
		"name"        : aJobName,
		"args"        : aJobArgs,
		"type"        : jobType,
		"typeArgs"    : jobTypeArgs
	});

	return todoId;	
}

ow.oJob = new OpenWrap.oJob();
