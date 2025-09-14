// oJob core functionality
// Copyright 2023 Nuno Aguiar

/**
 * <odoc>
 * <key>oJob.oJob() : oJob</key>
 * Creates an instance of an oJob. O
 * Uses the channel oJob::log for job logging, oJob::jobs for job register, oJob::todo as
 * job todo register and oJob::oJob for oJob instances registry.
 * </odoc>
 */
OpenWrap.oJob = function(isNonLocal) { 
	//startLog();
	if (isDef(ow.oJob)) return ow.oJob; else ow.oJob = this

	this.__promises = [];
	var parent = this;

	this.__host = "localhost";
	this.__ip = "127.0.0.1";

	//this.__promises.push($do(() => {
		if (isNonLocal) {
			try {
				var lh = java.net.InetAddress.getLocalHost()
				parent.__host = String(lh.getHostName())
				parent.__ip = String(lh.getHostAddress())
			} catch(e) {
				//logWarn(e);
			}
		}

		parent.__id = sha256(this.__host + this.__ip);
	//}));

	this.__threads = {};
	this.init = __;
	this.__conWidth = 100;
	this.python = false;
	this.running = false;

	this.shutdownFuncs = [];
	this.shortcuts = []
	this.fileList = []
	this._code = {}
	var ead = getEnv("OJOB_AUTHORIZEDDOMAINS");
	if (isDef(ead) && ead != "null") 
		this.authorizedDomains = String(ead).split(",");
	else
		this.authorizedDomains = (isDef(ow.oJob) && isDef(ow.oJob.authorizedDomains) ? ow.oJob.authorizedDomains : OJOB_AUTHORIZEDDOMAINS);

	addOnOpenAFShutdown(function() {
		var fn = parent.shutdownFuncs.pop();
		while(isDef(fn) && isFunction(fn)) {
			fn();
			fn = parent.shutdownFuncs.pop();
		}
	});

	//this.__promises.push($do(() => {
		ow.loadTemplate();
		ow.template.addConditionalHelpers()
		ow.template.addOpenAFHelpers()
		ow.template.addFormatHelpers()
		// Add template helper to retrieve oJob state
		ow.template.addHelper("_state", r => ow.oJob.getState(r))
		ow.loadServer(); 
		parent.__sch = new ow.server.scheduler();
	//}));
	//this.__promises.push($do(() => { 
		//ow.loadFormat();
	//}));
	//this.__promises.push($do(() => {
		parent.getTodoCh().create(0, "simple")
		parent.getJobsCh().create(0, "simple")
		parent.getLogCh().create(0, "simple")
		parent.getMainCh().create(0, "simple")
		parent.getMetricsCh().create(0, "simple")

		parent.getMainCh().set(
			{ "uuid": parent.__id },
			{
				"uuid": parent.__id,
				"host": parent.__host,
				"ip"  : parent.__ip,
				"tags": []
			}
		);
	//}));
	//this.__sch = new ow.server.scheduler();
	this.__ojob = { recordLog: true, logArgs: false, numThreads: __, logToConsole: true, logOJob: false };
	this.__help = {};
	this.__file = "thisOJob.yaml";
	this.__expr = processExpr(" ");
	if (isDef(this.__expr[""])) delete this.__expr[""];
	this.__logLimit = 3;
	this.oJobShouldStop = false;

	this.__langs = {
		"powershell": {
			lang : "powershell",
			shell: "powershell -",
			pre  : "$_args = ConvertFrom-Json '{{{args}}}'\n",
			pos  : "\n(ConvertTo-Json $_args -Compress)\n"
		},
		"go": {
			lang: "go",
			shell: "go run ",
			pre: "package main\nimport (\"encoding/json\"; \"fmt\"{{#each langArgs.goImports}}; {{{this}}}{{/each}})\nfunc main(){var args map[string]interface{}\njson.Unmarshal([]byte(`{{{args}}}`), &args)\n",
			pos: "\n_args, _err := json.Marshal(args); if _err != nil { return }; fmt.Println(string(_args))}",
			withFile: ".go"
		},
		"node": {
			lang : "node",
			shell: "node",
			pre  : "var args = {{{args}}};",
			pos  : ";console.log(JSON.stringify(args, void 0, ''))"
		},
		"ruby": {
			lang : "ruby",
			shell: "ruby -",
			pre  : "require 'json'\nargs = JSON.parse('{{{args}}}')\n",
			pos  : "\nputs JSON.generate(args)"
		},
		"perl": {
			lang: "perl",
			shell: "perl",
			// should use JSON CPAN module when available
			pre     : "if (eval { require JSON; 1 }) { $args = JSON::decode_json('{{{args}}}'); };\n",
			pos     : "\nif (eval { require JSON; 1 }) { print JSON::encode_json($args).'\n'; };",
			returnRE: "\\s*#\\s+return (.+)[\\s\\n]+",
			returnFn: "var _j='{'+_args.split(',').map(k=>\"'\"+k.trim()+\"':\\\\\\\"\$\"+k.trim()+\"\\\\\\\"\").join(',')+'}';return \";print \\\"\" + _j + \"\\\";\" "
		},
		"swift": {
			lang: "swift",
            shell: "swift -",
            pre: "import Foundation; let __argsString = \"{{{$path args 'replace(@,`\\\"`,`g`,`\\\\\\\"`)'}}}\"; if let __argsData = __argsString.data(using: .utf8) { do { if var args = try JSONSerialization.jsonObject(with: __argsData, options: []) as? [String: Any] {\n",
            pos: "if let __argsString = String(data: try JSONSerialization.data(withJSONObject: args, options: []), encoding: .utf8) { print(__argsString) } } } }\n"
		},
		"sh" : { 
			lang: "sh",
			langFn: "var s = $sh(); code.split('\\n').forEach(l => s = s.sh(templify(l, args)) ); if (isDef(job) && isDef(job.typeArgs) && isDef(job.typeArgs.pwd)) { s = s.pwd(job.typeArgs.pwd) }; if (isDef(job) && isDef(job.typeArgs) && isDef(job.typeArgs.shellPrefix)) { s = s.prefix(job.typeArgs.shellPrefix); s.get(); } else { s.exec(); }"
			// returnFn: doesn't make sense
		},
		"shell": {
			lang: "shell",
			// special type / langFn handled internally 
			returnFn: "var _j='{'+_args.split(',').map(k=>\"'\"+k.trim()+\"':'${\"+k.trim()+\"}'\").join(',')+'}';return \"echo \\\"\" + _j + \"\\\"\" ",
			returnRE: "\\s*#\\s+return (.+)[\\s\\n]*$"
		},
		"ssh": {
			lang: "ssh",
			// special type / langFn handled internally 
			returnFn: "var _j='{'+_args.split(',').map(k=>\"'\"+k.trim()+\"':'${\"+k.trim()+\"}'\").join(',')+'}';return \"echo \\\"\" + _j + \"\\\"\" ",
			returnRE: "\\s*#\\s+return (.+)[\\s\\n]*$"
		}
	};


	this.periodicFuncs = [];
	this.__periodicFunc = () => {
		this.periodicFuncs.forEach((f) => f());
		return this.oJobShouldStop;
	};

	this.__pid = getPid();

	//$doWait($doAll(this.__promises));

	this.__codepage = __;

	if (ow.format.isWindows()) {
		$doV(() => {
			if (isUnDef(__conAnsi)) __initializeCon();
			var res = __con.getTerminal().getOutputEncoding();
			if (isDef(res)) {
				this.__codepage = String(res);
			}
		});
	}

	// Set state - changed to on-demand
	// this.setState("init") 

	return this;
};

OpenWrap.oJob.prototype.verifyIntegrity = function(aFileOrPath) {
	_$(aFileOrPath, "aFileOrPath").isString().$_();
	
	var isUrl = false;
	if (aFileOrPath.toLowerCase().startsWith("http://") || aFileOrPath.toLowerCase().startsWith("https://")) isUrl = true;

	if (!isUrl) {
        aFileOrPath = aFileOrPath.replace(/\\+/g, "/");
		aFileOrPath = aFileOrPath.replace(/\/+/g, "/");
        if (!io.fileExists(aFileOrPath)) {
            var found = false;
			var paths = getOPackPaths()
			if (io.fileExists(__flags.OJOB_LOCALPATH)) paths["__ojobs_local"] = __flags.OJOB_LOCALPATH
            Object.values(paths).forEach(f => {
                if (!found && io.fileExists(f + "/" + aFileOrPath)) {
                    aFileOrPath = f + "/" + aFileOrPath;
                    found = true;
                }
            });
        }
        aFileOrPath = io.fileInfo(aFileOrPath).canonicalPath;
    }

	if (isDef(OJOB_INTEGRITY[aFileOrPath])) {
		var stream;
		if (isUrl) {
			stream = $rest().get2Stream(aFileOrPath);
		} else {
			stream = io.readFileStream(aFileOrPath);
		}

		var valid = false;

		if (OJOB_INTEGRITY[aFileOrPath].indexOf("-") >= 0) {
			[alg, h] = OJOB_INTEGRITY[aFileOrPath].split("-");
			switch (alg) {
			case "sha256":
				valid = (sha256(stream) == h);
				break;
			case "sha512":
				valid = (sha512(stream) == h);
				break;
			case "sha384":
				valid = (sha384(stream) == h);
				break;
			case "sha1"  :
				valid = (sha1(stream) == h);
				break;
			case "md5"   :
				valid = (md5(stream) == h)
				break
			case "md2"   :
				valid = (md2(stream) == h)
				break
			default      : 
				valid = false;
			}
		}
                if (OJOB_INTEGRITY[aFileOrPath].indexOf(":") >= 0) {
                        ow.loadJava()
                        valid = ow.java.checkDigest(OJOB_INTEGRITY[aFileOrPath], stream)
                }

		stream.close();
		return valid;
	} else {
		return __;
	}
};

/**
 * <odoc>
 * <key>oJob.load(aJobsList, aTodoList, aoJobList, args, aId, init, help)</key>
 * Loads a set of aJobsList, corresponding aTodoList and a list of aoJobList.
 * Optionally you can provide aId to segment these specific jobs.
 * </odoc>
 */
OpenWrap.oJob.prototype.load = function(jobs, todo, ojob, args, aId, init, help) {
	ojob = _$(ojob).isMap().default({});

	if (isUnDef(jobs)) jobs = [];
	if (isUnDef(todo)) todo = [];
	this.__ojob = merge(this.__ojob, ojob);
	if (isMap(help) && !compare(help, {})) this.__help = help;

	if (isUnDef(aId) && isDef(this.__ojob.id)) aId = this.__ojob.id;

	if (isArray(ojob.langs)) {
		var pp = this;
		ojob.langs.forEach(l => {
			if (isDef(l.lang)) pp.__langs[l.lang] = l;
		});
	}

	if (isArray(args) && __flags.OJOB_INIT_ARRAY_ARGS_LIST) args = { _list: args }

	this.__execRequire = _$(ojob.execRequire, "execRequire").isString().default(void 0);

	if (isDef(init)) this.init = init;
	
	// Calculate dependencies
	var mdeps = {};
	function depsScore(v) {
		//if (isString(v)) v = $path(jobs, "[?name==`" + v + "`] | @[0]");
		if (isString(v)) v = $from(jobs).useCase(true).equals("name", v).at(0);
		if (v == null || isUnDef(v)) return;

		var s = v.name; 
		if (isDef(mdeps[s])) {
			mdeps[s] += 1;
			
			var depsScore2 = (vvv) => { 
				if (isString(vvv)) {
					if (vvv === v.name) logWarn("Suspicious recursive relation in job " + v.name);
					mdeps[vvv] += mdeps[s];
					depsScore(vvv);
				} else {
					if (vvv.name === v.name) logWarn("Suspicious recursive relation in job " + v.name);
					mdeps[vvv.name] += mdeps[s];
					depsScore(vvv.name);
				}
			};

			if (isObject(v) && !isString(v)) {
				if (isDef(v.from) && v.from != null)       (isString(v.from) ? depsScore2(v.from) : v.from.forEach(depsScore2));
				if (isDef(v.earlier) && v.earlier != null) (isString(v.earlier) ? depsScore2(v.earlier) : v.earlier.forEach(depsScore2));
				if (isDef(v.to) && v.to != null)           (isString(v.to) ? depsScore2(v.to) : v.to.forEach(depsScore2));
				if (isDef(v.then) && v.then != null)       (isString(v.then) ? depsScore2(v.then) : v.then.forEach(depsScore2));
				if (isDef(v.deps) && v.deps != null)       (isString(v.deps) ? [ v.deps ].forEach(depsScore2) : v.deps.forEach(depsScore2));
			}
		}
	};

	var parent = this
	jobs.forEach((v, i) => { 
		mdeps[v.name] = 0

		// Helpers
		if (isDef(jobs[i].execFile)) {
			if (isUnDef(jobs[i].typeArgs)) jobs[i].typeArgs = {}
			jobs[i].typeArgs.file = jobs[i].execFile
		}
		if (isDef(jobs[i].execRequire)) {
			if (isUnDef(jobs[i].typeArgs)) jobs[i].typeArgs = {}
			jobs[i].typeArgs.execRequire = jobs[i].execRequire
		}

		// Add custom shortcuts
		// v = parent.addShortcuts(v) // already done in loadJSON

		if (isArray(jobs[i].from))    jobs[i].from    = jobs[i].from.map(r => parent.parseTodo(r))
		if (isArray(jobs[i].to))      jobs[i].to      = jobs[i].to.map(r => parent.parseTodo(r))
		if (isArray(jobs[i].earlier)) jobs[i].earlier = jobs[i].earlier.map(r => parent.parseTodo(r))
		if (isArray(jobs[i].then))    jobs[i].then    = jobs[i].then.map(r => parent.parseTodo(r))
	})
	jobs.forEach(depsScore);

	var sjobs = jobs.sort((a, b) => {
		return mdeps[b.name] - mdeps[a.name];
	});

	// Add jobs
	for(var i in sjobs) {
		if (isUnDef(sjobs[i].from)  && isDef(sjobs[i].earlier)) sjobs[i].from    = sjobs[i].earlier;
		if (isUnDef(sjobs[i].to)    && isDef(sjobs[i].then))    sjobs[i].to      = sjobs[i].then;
		if (isUnDef(sjobs[i].catch) && isDef(sjobs[i].onerror)) sjobs[i].catch   = sjobs[i].onerror;

		this.addJob(this.getJobsCh(), sjobs[i].name, sjobs[i].deps, sjobs[i].type, sjobs[i].typeArgs, sjobs[i].args, sjobs[i].exec, sjobs[i].from, sjobs[i].to, sjobs[i].help, sjobs[i].catch, sjobs[i].each, sjobs[i].lang, sjobs[i].file, sjobs[i].check);
	}

	// Add todos
	this.addTodos(todo, args, aId);

    // Flags change
	if (isDef(ojob.flags) && isMap(ojob.flags)) __flags = merge(__flags, ojob.flags)

	// Check ojob settings
	if (isDef(ojob.debug)) this.__ojob.debug = ojob.debug;
	if (isDef(ojob.numThreads)) this.__ojob.numThreads = ojob.numThreads;
	if (isDef(ojob.logToConsole)) this.__ojob.logToConsole = ojob.logToConsole;
	if (isDef(ojob.ignoreNoLog)) this.__ojob.ignoreNoLog = ojob.ignoreNoLog
	if (isDef(ojob.logLimit)) this.__logLimit = ojob.logLimit;
	if (isDef(ojob.conAnsi)) { __conAnsi = ojob.conAnsi; __conStatus = Boolean(__conAnsi); }
	if (isDef(ojob.conWidth)) this.__conWidth = ojob.conWidth;
	this.__ojob.logOJob = _$(ojob.logOJob, "logOJob").isBoolean().default(false)
	this.__ojob.async   = _$(ojob.async).isBoolean().default(false);
    if (this.__ojob.async) this.__ojob.sequential = false;

	this.__ojob.tags = _$(ojob.tags).isArray("The ojob.tags needs to be an array.").default([]);
	if (isDef(this.__ojob.tags) && this.__ojob.tags.length > 0) {
		var oj = this.getMainCh().get({ "uuid": this.__id });
		oj.tags = this.__ojob.tags;
		this.getMainCh().set({ "uuid": this.__id }, oj);
	}

	this.__ojob.depsWait = _$(this.__ojob.depsWait).isBoolean().default(false);
	this.__ojob.showHelp = _$(this.__ojob.showHelp).isBoolean().default(true);

	this.__ojob.checkStall = _$(ojob.checkStall).isMap().default(__);
	if (isDef(this.__ojob_checkStall)) {
		this.__ojob.checkStall.everySeconds = _$(this.__ojob.checkStall.everySeconds).isNumber("Check stall needs to be a number in seconds.").default(60);
		this.__ojob.checkStall.killAfterSeconds = _$(this.__ojob.checkStall.killAfterSeconds).isNumber("Kill everything after a number of seconds").default(-1);
		this.__ojob.checkStall.checkFunc = _$(this.__ojob.checkStall.checkFunc).isString("Please provide a function to check if should kill or not").default(__);
	}

	ojob.logJobs = _$(ojob.logJobs).default(true);
    this.__ojob.logJobs = ojob.logJobs;
	if (isDef(ojob.logToFile) && isMap(ojob.logToFile)) {
		ow.ch.utils.setLogToFile(ojob.logToFile);
	}

	if (toBoolean(getEnv("OJOB_JSONLOG"))) {
		if (isUnDef(ojob.log)) ojob.log = {}
		ojob.log.format = "json"
	}

	if (isDef(ojob.log) && isMap(ojob.log)) {
		setLog(ojob.log);
	}

	// Channels
	if (isDef(this.__ojob.channels)) {
		if (this.__ojob.channels.recordLog) startLog(__, this.__ojob.channels.recordLogHistory)
		if (isDef(this.__ojob.channels.create) && isArray(this.__ojob.channels.create)) {
			for(var cI in this.__ojob.channels.create) {
				var cObj = this.__ojob.channels.create[cI]; 
				try {
					_$(cObj).isMap("Each ojob.channels.create entry needs to be a map.")
					_$(cObj.name).$_("Each ojob.channels.create entry needs to have a 'name' entry.");
					cObj.type = _$(cObj.type).isString("Each ojob.channels.create entry might have a string 'type'.").default(__);
					cObj.compress = _$(cObj.compress).isBoolean("Each ojob.channels.create entry might have a boolean 'compress' option.").default(__);
					cObj.options = _$(cObj.options).isMap("Each ojob.channels.create entry might have a map 'options'").default(__);

					$ch(cObj.name).create(cObj.compress, cObj.type, cObj.options);
				} catch(e) {
					logErr("Can't create ojob.channels.create entry #" + cI + ", error: " + String(e));
				}
			}
		}
		if (this.__ojob.channels.expose || isDef(this.__ojob.channels.peers) || isDef(this.__ojob.channels.clusters)) {
			if (isDef(this.__ojob.channels.port)) {

				if (isUnDef(this.__hs)) {
					this.__hs = ow.server.httpd.start(this.__ojob.channels.port, this.__ojob.channels.host, this.__ojob.channels.keyStorePath, this.__ojob.channels.keyPassword);
				
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
							var creds = $from(parent.__ojob.channels.auth).useCase(true).equals("login", u).at(0);
					
							if (isDef(creds) && isDef(creds.pass) && p == creds.pass) {
								if (isDef(creds.permissions)) r.channelPermission = creds.permissions;
								return true;
							} else {
								return false;
							}
						}
					}
	
					if (isDef(parent.__ojob.channels.audit)) {
						var turnAuditOn = false;
						var OJOB_LOG_AUDIT_TMPL = "AUDIT | User: {{request.user}} | Channel: {{name}} | Operation: {{op}} | Key: {{{key}}}";

						if (isString(parent.__ojob.channels.audit)) {
							OJOB_LOG_AUDIT_TMPL = parent.__ojob.channels.audit;
							turnAuditOn = true;
						} else {
							if (parent.__ojob.channels.audit) {
								turnAuditOn = true;
							}
						}
						if (turnAuditOn) {
							ow.ch.server.setLog(function(aMap) {
								aMap = merge(aMap, { key: stringify(jsonParse(aMap.request.uri.replace(/.+({[^}]+}).*/, "$1").replace(/&quot;/g, "\'")),undefined,"").replace(/\"/g, "") });
								tlog(OJOB_LOG_AUDIT_TMPL, aMap);
							});
						}
					}
					
					if (isUnDef(this.__ojob.channels.list)) {
						this.__ojob.channels.list = $ch().list();
						//this.__ojob.channels.list.push("__log");
					}
	
					var addSuffix = (anArray, suffix) => {
						return $from(anArray).select((r) => { return r + suffix; });
					};

					for(var i in this.__ojob.channels.list) {
						if (this.__ojob.channels.expose) {
							$ch(this.__ojob.channels.list[i]).expose(this.__hs, undefined, auth, undefined, true);
						} else {
							if (isDef(this.__ojob.channels.peers) && isArray(this.__ojob.channels.peers)) {
								$ch(this.__ojob.channels.list[i]).peer(this.__hs, __, 
									addSuffix(this.__ojob.channels.peers, "/" + this.__ojob.channels.list[i]),
									auth, __);
							}
						}
					}

					if (isDef(this.__ojob.channels.clusters)) {
						if (!(isArray(this.__ojob.channels.clusters))) {
							this.__ojob.channels.clusters = [ this.__ojob.channels.clusters ];
						}
						if (isUnDef(global.oJobClusters)) global.oJobClusters = {}; 
						if (isUnDef(this.__mstTime)) this.__mstTime = [];
					
						for(var ii in this.__ojob.channels.clusters) {
							var cluster = this.__ojob.channels.clusters[ii];

							_$(cluster.name).isString().$_("Each channel cluster must have a name.");
							cluster.checkPeriod = _$(cluster.checkPeriod).isNumber().default(2500);
							cluster.host = _$(cluster.host).isString().default(this.__host);
							cluster.port = _$(cluster.port).isNumber().default(this.__ojob.channels.port);

							global.oJobClusters[cluster.name] = new ow.server.cluster(cluster.host, cluster.port, cluster.nodeTimeout, cluster.numberOfTries, cluster.tryTimeout, {
								name        : cluster.name,
								serverOrPort: this.__hs,
								chs         : this.__ojob.channels.list
							}, ow.server.clusterChsPeersImpl);
							global.oJobClusters[cluster.name].checkIn();

							this.periodicFuncs.push(() => { 
								if (now() - this.__mstTime[cluster.name] > cluster.checkPeriod) {
									global.oJobClusters[cluster.name].verify(); 
									this.__mstTime[cluster.name] = now();
								}
							});
							addOnOpenAFShutdown(() => { global.oJobClusters[cluster.name].checkOut(); });
							this.__mstTime[cluster.name] = now();

							if (isDef(cluster.discovery)) {
								if (!isArray(cluster.discovery)) {
									cluster.discovery = [ cluster.discovery ];
								}
								//$ch("__cluster::" + cluster.name).setAll(["h", "p"], $path(cluster.discovery, "[].{ h: host, p: port, a: false }"));
								$ch("__cluster::" + cluster.name).setAll(["h", "p"], $from(cluster.discovery).select(r => ({ h: r.host, p: r.port, a: false })));
							}
						}
					}
				}
			}
		}
	}

	if (isDef(this.__ojob.metrics)) {
		ow.loadMetrics();
		
		if (isBoolean(this.__ojob.metrics)) {
			ow.metrics.startCollecting();
		} else {
			if (isMap(this.__ojob.metrics)) {
				if (isDef(this.__ojob.metrics.add) && isMap(this.__ojob.metrics.add)) {
					Object.keys(this.__ojob.metrics.add).forEach(r => {
						ow.metrics.add(r, newFn(this.__ojob.metrics.add[r]) );
					});
				}
				// To deprecate
				// ow.metrics.startCollecting(this.__ojob.metrics.chName, this.__ojob.metrics.period, this.__ojob.metrics.noDate);
			}
		}
	}
};

/**
 * <odoc>
 * <key>ow.oJob.loadJSON(aJSON, dontLoadTodos) : Object</key>
 * Loads aJSON oJob configuration and returns the processed map (with all includes processed).
 * </odoc>
 */
OpenWrap.oJob.prototype.loadJSON = function(aJSON, dontLoadTodos, dontLoadJobs) {
	if (!isMap(aJSON)) return {};
	var res = aJSON;
	var parent = this

	if (isDef(res)) {
		res.ojob = _$(res.ojob, "ojob").isMap().default({})

		var _o2a = m => {
			var res = [];
			Object.keys(m).forEach(r => {
				var _r = {};
				_r[r] = m[r];
				res.push(_r);
			});
			return res;
		};

		if (isDef(res.ojob.opacks) && isMap(res.ojob.opacks)) res.ojob.opacks = _o2a(res.ojob.opacks);
		if (isDef(res.ojob.opacks) && isArray(res.ojob.opacks)) {
			for(var ii in res.ojob.opacks) {
				if (isString(res.ojob.opacks[ii])) includeOPack(res.ojob.opacks[ii]);
				if (isMap(res.ojob.opacks[ii])) includeOPack(Object.keys(res.ojob.opacks[ii])[0], res.ojob.opacks[ii][Object.keys(res.ojob.opacks[ii])[0]]);
			}
		}

		if (isDef(res.ojob.owraps) && isArray(res.ojob.owraps)) {
			for(var ii in res.ojob.owraps) {
				if (isString(res.ojob.owraps[ii])) {
					if (isDef(ow["load" + res.ojob.owraps[ii]])) {
						ow["load" + res.ojob.owraps[ii]]()
					} else {
						logErr("owrap '" + res.ojob.owraps[ii] + "' not found!")
					}
				}
			}
		}
	
		if (isDef(res.ojob.loadLibs) && isArray(res.ojob.loadLibs)) {
			for(var ii in res.ojob.loadLibs) {
				if (isString(res.ojob.loadLibs[ii])) {
					loadLib(res.ojob.loadLibs[ii]);
				}
			}
		}
	
		if (isDef(res.ojob.loads) && isArray(res.ojob.loads)) {
			for(var ii in res.ojob.loads) {
				if (isString(res.ojob.loads[ii])) {
					loadLib(res.ojob.loads[ii]);
				}
			}
		}

		// Integrity
		if (isDef(res.ojob.integrity)) {
			if (isArray(res.ojob.integrity.list)) {
				res.ojob.integrity.list.forEach(entry => {
					if (isMap(entry) && Object.keys(entry).length > 0) {
						var k = Object.keys(entry)[0]
						if (isUnDef(OJOB_INTEGRITY[k])) OJOB_INTEGRITY[k] = entry[k]
					}
				})
			}
			if (isBoolean(res.ojob.integrity.strict)) OJOB_INTEGRITY_STRICT = res.ojob.integrity.strict
			if (isBoolean(res.ojob.integrity.warn))   OJOB_INTEGRITY_WARN   = res.ojob.integrity.warn
		}

		var _includeLoaded = {}
		
		res.ojob.includeOJob = _$(res.ojob.includeOJob).isBoolean().default(true)
		//if (isUnDef(res.jobsInclude)) res.jobsInclude = []
		//res.jobsInclude = [ getOpenAFJar() + "::ojob.json" ]
		if (res.ojob.includeOJob) {
			try {
				$ch("oJob::jobs").setAll(["name"], io.readFileJSON(getOpenAFJar() + "::ojob.saved.json"))
			} catch(ee) {
				/*try {
					if (isUnDef(res.jobsInclude)) res.jobsInclude = []
					res.jobsInclude = [ getOpenAFJar() + "::ojob.json" ]
				} catch(ee2) {*/
					logWarn("Problem including oJobs: " + ee)
				//}
			}
		}

		this._ejob = __flags.OJOB_CHECK_JOB_CHANGES ? $ch("oJob::jobs").getKeys() : []
		var parent = this

		// Place auditor on ojob::jobs
		if (__flags.OJOB_CHECK_JOB_CHANGES || __flags.OJOB_CHECK_JOB_REMOVAL) {
			if (isUnDef(parent.__jobauditor)) {
				this.getJobsCh().subscribe((aCh, aOp, aK, aV) => {
					if (aOp == "unset" || aOp == "unsetall") {
						if (__flags.OJOB_CHECK_JOB_REMOVAL)
							logWarn("oJobs definitions are being removed: " + af.toSLON(aK))
						else {
							if (isUnDef(ow.oJob.__ojob_warn_ojob_removal_notify)) ow.oJob.__ojob_warn_ojob_removal_notify = false
							//if (!ow.oJob.__ojob_warn_ojob_removal_notify) logWarn("oJobs definitions removal audit is disabled.")
							ow.oJob.__ojob_warn_ojob_removal_notify = true
						}
					}
		
					if ((aOp == "set" || aOp == "setall")) {
						if (__flags.OJOB_CHECK_JOB_CHANGES) {
							if (!isArray(aK)) aK = [ aK ]
							var _keys = parent._ejob
							$from(aK).intersect(_keys).select(k => {
								logWarn("oJob '" + k.name + "' is being changed! ")
							})
							parent._ejob = parent._ejob.concat(aK)
						} else {
							if (isUnDef(ow.oJob.__ojob_warn_ojob_changes_notify)) ow.oJob.__ojob_warn_ojob_changes_notify = false
							//if (!ow.oJob.__ojob_warn_ojob_changes_notify) logWarn("oJobs definitions changes audit is disabled.")
							ow.oJob.__ojob_warn_ojob_changes_notify = true
						}
					}
				}, true)
			}
			parent.__jobauditor = true
		}

		// Add custom shortcuts
		if (!dontLoadJobs && isArray(res.jobs)) {
			res.jobs = res.jobs.map(j => parent.addShortcuts(j))
		}

		if (isDef(res.include) && isArray(res.include)) {
			for (var i in res.include) {
				if (isUnDef(_includeLoaded[res.include[i]])) {
					_includeLoaded[res.include[i]] = 1;
					var f = this.__loadFile(res.include[i], __, true);
					if (isUnDef(f)) throw "Problem loading include '" + res.include[i] + "'.";
					res = this.__merge(f, res);
				}
			}
		}
		if (!dontLoadJobs && isDef(res.jobsInclude) && isArray(res.jobsInclude)) {
			for (var i in res.jobsInclude) {
				if (isUnDef(_includeLoaded[res.jobsInclude[i]])) {
					_includeLoaded[res.jobsInclude[i]] = 1;
					var f = this.__loadFile(res.jobsInclude[i], true, true);
					if (isUnDef(f)) throw "Problem loading job include '" + res.jobsInclude[i] + "'."
					res = this.__merge(f, res);
				}
			}
		}
		

		if (!dontLoadTodos && !(isArray(res.jobs)) && !(isArray(res.todo))) {
			if (!dontLoadJobs) throw("jobs and todo entries need to be defined as arrays.");
		} else {
			if (isArray(res.todo)) res.todo = res.todo.map(r => this.parseTodo(r))
		}

		if (dontLoadTodos && !(isArray(res.jobs))) {
			throw("jobs entries need to be defined as arrays.");
		}
		if (dontLoadJobs && !(isArray(res.todo))) {
			throw("todo entries need to be defined as arrays.")
		}

		if (dontLoadTodos) {
			delete res.todo
			delete res.help
		}
		if (dontLoadJobs) {
			delete res.jobs
			delete res.help
		}
		if (isUnDef(res.ojob)) res.ojob = {};

		// Set code in the require cache
		if (!dontLoadJobs && isMap(res.code)) {
			if (isUnDef(require.cache)) require.cache = {};
			Object.keys(res.code).forEach(k => {
				if (k.endsWith(".js")) {
					try {
						if (res.code[k].trim().match(/\(.+\);?/)) {
							require.cache[k] = newFn('require', 'exports', 'module', res.code[k])
						} else {
							this._code[k] = res.code[k]
						}
					} catch(e) {
						logErr("Problem with code '" + k + "': " + e.message + " (#" + e.lineNumber + ")");
					}
				} else {
					this._code[k] = res.code[k]
				}
			});
		}
	}

	return res;
};

OpenWrap.oJob.prototype.__toEnvs = function(aMap) {
	var res = getEnvs();
	traverse(aMap, (aK, aV, aP, aO) => {
		if (!isMap(aV) && !isArray(aV)) {
     		aP = aP.replace(/\./g, "_");
			if (isNumber(aK)) {
				res[aP.substr(1, aP.length) + "_" + (Number(aK) +1) ] = String(aV);
			} else {
				var mts = aP.match(/\[(\d+)\]/);
				if (mts) {
					res[aP.replace(/^\_/, "").replace(/\[(\d+)\]/g, (r) => { return "_" + (Number(r.substr(1, r.length -2)) +1); }) + "_" + aK] = String(aV);
				} else {
					res[(aP != "" ? aP.substr(1, aP.length) + "_" : "") + aK] = String(aV); 
				}
			}
		}
	});
	
	return res;
};

OpenWrap.oJob.prototype.__merge = function(aJSONa, aJSONb) {
	function _uniq(aSource) {
		var t;
	
		if (isDef(aSource) && isArray(aSource)) {
			t = [];
			for(var ii in aSource) {
				if (t.indexOf(aSource[ii]) < 0) t.push(aSource[ii]);
			}
		} 
	
		return t;
	}

	var res = { include: [], jobs: [], todo: [], ojob: {}, init: {}, code: {}, help: {} };
	
	if (isUnDef(aJSONa)) return res;

	if (isDef(aJSONa.include) && aJSONa.include != null) 
		res.include = aJSONa.include.concat(isDef(aJSONb.include) ? aJSONb.include : []);
	else
		res.include = isDef(aJSONb.include) ? aJSONb.include : [];

	res.include = _uniq(res.include);

	if (isDef(aJSONa.jobsInclude) && aJSONa.jobsInclude != null) 
		res.jobsInclude = aJSONa.jobsInclude.concat(isDef(aJSONb.jobsInclude) ? aJSONb.jobsInclude : []);
	else
		res.jobsInclude = isDef(aJSONb.jobsInclude) ? aJSONb.jobsInclude : [];

	res.jobsInclude = _uniq(res.jobsInclude);

	if (isDef(aJSONa.jobs) && aJSONa.jobs != null) 
		res.jobs = aJSONa.jobs.concat(isDef(aJSONb.jobs) ? aJSONb.jobs : []);
	else
		res.jobs = isDef(aJSONb.jobs) ? aJSONb.jobs : [];
	
	if (isDef(aJSONa.todo) && aJSONa.todo != null) 
		res.todo = aJSONa.todo.concat(isDef(aJSONb.todo) ? aJSONb.todo : []);
	else
		res.todo = isDef(aJSONb.todo) ? aJSONb.todo : [];
	
	if (isDef(aJSONa.ojob)) 
		res.ojob = merge(aJSONa.ojob, aJSONb.ojob);
	else
		res.ojob = isDef(aJSONb.ojob) ? aJSONb.ojob : {};

	if (isDef(aJSONa.init)) 
		res.init = merge(aJSONa.init, aJSONb.init);
	else
		res.init = isDef(aJSONb.init) ? aJSONb.init : {};

	if (isDef(aJSONa.code)) 
		res.code = merge(aJSONa.code, aJSONb.code);
	else
		res.code = isDef(aJSONb.code) ? aJSONb.code : {};			

	if (isDef(aJSONa.help)) 
		res.help = merge(aJSONa.help, aJSONb.help);
	else
		res.help = isDef(aJSONb.help) ? aJSONb.help : {};	

	return res;
};

OpenWrap.oJob.prototype.__loadFile = function(aFile, removeTodos, isInclude) {
	var res = {}, parent = this, validation = false, aOrigFile = aFile;

	var fnDown = url => {
		if (parent.authorizedDomains.indexOf(String((new java.net.URL(url)).getHost())) < 0)
			return {
				todo: ["Unauthorized URL"],
				jobs: [{ name: "Unauthorized URL" }]
			};
		else {
			if (url.endsWith("/")) url += "index.json"
			
			var res = $rest({ throwExceptions: true }).get(url);
			if (isString(res)) {
				try { res = af.fromYAML(res, true); } catch (e) { }
			} else {
				if (isMap(res) && __JSONformat.unsafe) {
					traverse(res, (aK, aV, aP, aO) => { if (isString(aV) && aV.startsWith("!!js/eval ")) aO[aK] = eval(aV.slice(10)); });
				}
			}
			return res;
		}
	}
	var fnDownYAML = url => {
		if (parent.authorizedDomains.indexOf(String((new java.net.URL(url)).getHost())) < 0)
			return {
				todo: ["Unauthorized URL"],
				jobs: [{ name: "Unauthorized URL" }]
			};
		else {
			var _r = $rest({ throwExceptions: true }).get(url);
			if (isMap(_r)) {
				if (__JSONformat.unsafe) traverse(_r, (aK, aV, aP, aO) => { if (isString(aV) && aV.startsWith("!!js/eval ")) aO[aK] = eval(aV.slice(10)); });
				return _r;
			} else {
				af.fromYAML(_r, true);
			}
		}
	}

	function _load(aFn) {
		var res = {};
		try {
			res = aFn(aFile, true);
		} catch(e1) {
			if (isDef(e1.message) && e1.message.match(/FileNotFoundException|NoSuchFileException/)) {
				var paths = getOPackPaths(), found = false;
				if (io.fileExists(__flags.OJOB_LOCALPATH)) paths["__ojobs_local"] = __flags.OJOB_LOCALPATH
				
				for(var i in paths) {
					try {
						paths[i] = paths[i].replace(/\\+/g, "/");
						paths[i] = paths[i].replace(/\/+/g, "/");
						res = aFn(paths[i] + "/" + aFile, true);
						found = true;
						break;
					} catch(e2) {
						if (!e2.message.match(/FileNotFoundException|NoSuchFileException/)) {
							throw e2;
						}
					}
				}
				if (!found) throw "File not found! (" + aFile + ")";
			} else {
				throw e1;
			}
		}
		
		// Check for internal signature
		if (isDef(res) && isDef(res.__jwt) && isDef(OJOB_SIGNATURE_KEY)) {
			ow.loadObj();

			if (!ow.obj.signVerify(OJOB_SIGNATURE_KEY, res)) {
				if (OJOB_SIGNATURE_STRICT) {
					logErr("SIGNATURE: Verification of '" + aFile + "' failed. Strict signature enforced. Not loading oJob definition.");
					return {};
				} else {
					logWarn("SIGNATURE: Verification of '" + aFile + "' failed. Please check the source and update the corresponding signature. Execution will continue.");
				}
			} else {
				validation = true;
			}
		}

		return res;
	}
	
	if (isDef(aFile)) {
		ow.oJob.authorizedDomains.forEach(d => {
			if (aFile.startsWith(d) && !io.fileExists(aFile)) {
				aFile = "https://" + aFile
			}
		});

    	if (aFile.match(/^https?:\/\//i) && !aFile.match(/\.ya?ml$/i) && !aFile.match(/\.js(on)?$/i)) {
			var pp = (new java.net.URI(aFile)).getPath()
			if (pp == "") {
				aFile += "/"
			} else {
				if (!pp.endsWith("/") && aFile.indexOf("?") < 0) aFile += ".json"
			}
        }

		// Verify integrity 
		if (Object.keys(OJOB_INTEGRITY).length > 0) {
			Packages.openaf.SimpleLog.log(Packages.openaf.SimpleLog.logtype.DEBUG, "oJob checking integrity of '" + aFile + "'", null);

			var ig = parent.verifyIntegrity(aFile);
			if (isDef(ig) && ig == false) {
				if (OJOB_INTEGRITY_WARN) {
					logWarn("INTEGRITY OF '" + aFile + "' failed. Please check the source and update the corresponding integrity hash list. Execution will continue.");
				} else {
					throw "INTEGRITY OF '" + aFile + "' failed. Please check the source and update the corresponding integrity hash list.";
				}
			} else {
				if (OJOB_INTEGRITY_STRICT && ig != true) {
					throw "INTEGRITY OF '" + aFile + "' failed. Please check the source and update the corresponding integrity hash list.";
				} else {
					if (ig == true) validation = true;
				}
			}
		}

		if (aFile.match(/\.ya?ml$/i)) {
			if (aFile.match(/^https?:\/\//)) {
				res = this.__merge(_load(fnDownYAML), res);
			} else {
				res = this.__merge(_load(io.readFileYAML), res);
			}
		} else if (aFile.match(/\.js(on)?$/i)) {
			if (aFile.match(/^https?:\/\//)) {
				res = this.__merge(_load(fnDown), res);
			} else {
				res = this.__merge(_load(io.readFileJSON), res);
			}
		} else if (aFile.match(/^https?:\/\//)) {
			res = this.__merge(_load(fnDown), res);
		} else {
			res = this.__merge(_load(f => io.readFile(f)), res)
		}

	}

	if (OJOB_VALIDATION_STRICT && !validation) {
		throw "OJOB VALIDATION OF '" + aFile + "' failed.";
	}

	if (!isInclude) this.__file = aOrigFile;
	if (this.fileList.indexOf(aOrigFile) < 0) {
		this.fileList.push(aOrigFile)

		return this.loadJSON(res, removeTodos)
	} else {
		//throw "The oJob '" + aOrigFile + "' is included more than once!"
		return this.loadJSON(res, removeTodos, true)
	}
};

/**
 * <odoc>
 * <key>ow.oJob.loadFile(aFile, args, aId)</key>
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
 *       #list       :\
 *       #  - oJob::log\
 *       #auth       :\
 *       #  - login: ojob\
 *       #    pass : ojob\
 *       #    permissions: r\
 * \
 * </odoc>
 */
OpenWrap.oJob.prototype.loadFile = function(aFile, args, aId, isSubJob, aOptionsMap, dontLoadTodos) {
	var s = this.__loadFile(aFile, dontLoadTodos)
	if (isDef(s)) {
		if (isSubJob && isDef(s.ojob)) {
			s.ojob.__subjob = true;
		}
		if (isUnDef(aOptionsMap) || !isMap(aOptionsMap)) aOptionsMap = {};
		this.load(s.jobs, s.todo, merge(aOptionsMap, s.ojob), args, aId, s.init, s.help);
	}
};

/**
 * <odoc>
 * <key>ow.oJob.loadJobs(aFile, args, noReturn) : Array</key>
 * </odoc>
 */
OpenWrap.oJob.prototype.loadJobs = function(aFile, _args, noReturn) {
	noReturn = _$(noReturn, "noReturn").isBoolean().default(false)
  
	this.loadFile(aFile, _args, __, __, __, true)
	if (!noReturn) return this.previewFile(aFile).todo
  
	return __
}

/**
 * <odoc>
 * <key>ow.oJob.runFile(aFile, args, aId, isSubJob, aOptionsMap)</key>
 * Loads aFile configuration and executes the oJob defined with the provided args.
 * Optionally you can provide aId to segment these specific jobs.
 * </odoc>
 */
OpenWrap.oJob.prototype.runFile = function(aFile, args, aId, isSubJob, aOptionsMap) {
	var orig
	if (isSubJob) orig = clone(this.__ojob)
	this.loadFile(aFile, args, aId, isSubJob, aOptionsMap)
	this.start(args, true, aId, isSubJob)
	if (isSubJob) this.__ojob = orig
}

/**
 * <odoc>
 * <key>ow.oJob.previewFile(aFile) : Map</key>
  * Returns a map with a preview of the oJob configuration that would be executed with aFile.
 * </odoc>
 */
OpenWrap.oJob.prototype.previewFile = function(aFile) {
	var res = this.__loadFile(aFile);
	if (isDef(res.include)) res.include = []
	if (isDef(res.jobsInclude)) res.jobsInclude = []
	return res
};

/**
 * <odoc>
 * <key>ow.oJob.runAllShutdownJobs()</key>
 * Tries to run all the shutdown type jobs accumulated until now.
 * </odoc>
 */
OpenWrap.oJob.prototype.runAllShutdownJobs = function() {
	var fn = this.shutdownFuncs.pop();
	while(isDef(fn) && isFunction(fn)) {
		fn();
		fn = this.shutdownFuncs.pop();
	}
};

/**
 * <odoc>
 * <key>ow.oJob.getJobsCh() : Channel</key>
 * Gets the oJob::jobs channel
 * </odoc>
 */
OpenWrap.oJob.prototype.getJobsCh = function() { return $ch("oJob::jobs"); };
/**
 * <odoc>
 * <key>ow.oJob.getTodoCh() : Channel</key>
 * Gets the oJob::todo channel
 * </odoc>
 */
OpenWrap.oJob.prototype.getTodoCh = function() { return $ch("oJob::todo"); };
/**
 * <odoc>
 * <key>ow.oJob.getLogCh() : Channel</key>
 * Gets the oJob::log channel
 * </odoc>
 */
OpenWrap.oJob.prototype.getLogCh = function() { return $ch("oJob::log"); };
/**
 * <odoc>
 * <key>ow.oJob.getMainCh() : Channel</key>
 * Gets the oJob::oJob channel
 * </odoc>
 */
OpenWrap.oJob.prototype.getMainCh = function() { return $ch("oJob::oJob"); };
/**
 * <odoc>
 * <key>ow.oJob.getMetricsCh() : Channel</key>
 * Gets the oJob::metrics channel
 * </odoc>
 */
OpenWrap.oJob.prototype.getMetricsCh = function() { return $ch("oJob::metrics") };
/**
 * <odoc>
 * <key>oJob.getID() : String</key>
 * Returns this oJob instance ID. Useful to lookup logging in the oJob::log channel.
 * </odoc>
 */
OpenWrap.oJob.prototype.getID = function() {
	return this.__id;
};

/**
 * <odoc>
 * <key>oJob.setJob(aJobName, aJob) : oJob</key>
 * Adds or overwrites an existing aJobName with the configuration aJob.
 * </odoc>
 */
OpenWrap.oJob.prototype.setJob = function(aJobName, aJob) {
	this.getJobsCh().set(aJobName, aJob);
	return this;
};
/**
 * <odoc>
 * <key>oJob.getJob(aJobName) : Map</key>
 * Retrieves the aJobName definition map so it can be changed and overwritten with "oJob.setJob(aJobName, aJobMap)".
 * </odoc>
 */
OpenWrap.oJob.prototype.getJob = function(aJobName) {
	return this.getJobsCh().get({ name: aJobName });
};

/**
 * <odoc>
 * <key>oJob.removeJob(aJobName) : oJob</key>
 * Removes aJobName.
 * </odoc>
 */
OpenWrap.oJob.prototype.removeJob = function(aJobName) {
	this.getJobsCh().unset(aJobName);
	return this;
};

/**
 * <odoc>
 * <key>oJob.addTodos(aTodoList, aJobtTypeArgs, aId) : oJob</key>
 * Adds a new aTodoList array of job names.
 * Optionally you can provide aId to segment these specific jobs.
 * </odoc>
 */
OpenWrap.oJob.prototype.addTodos = function(todoList, aJobArgs, aId) {
	var altId = (isDef(aId) ? aId : "");
	aId = altId;
	for(var i in todoList) { 
		var name = isDef(todoList[i].name) ? todoList[i].name : Object.keys(todoList[i])[0]
		if(isDef(aJobArgs) && isObject(todoList[i])) 
			todoList[i].args = this.__processArgs(todoList[i].args, aJobArgs, aId);

		if (isMap(todoList[i])) {
			todoList[i] = this.parseTodo(todoList[i])

			if (isDef(todoList[i].job) && isUnDef(todoList[i].name)) todoList[i].name = todoList[i].job;
			if (isUnDef(todoList[i].typeArgs)) todoList[i].typeArgs = {};
			if (isDef(todoList[i].when))       todoList[i].typeArgs.when = todoList[i].when;
			this.addTodo(this.getID() + (isDef(todoList[i].id) ? todoList[i].id : altId), this.getJobsCh(), this.getTodoCh(), isUnDef(todoList[i].name) ? name : todoList[i].name, todoList[i].args, todoList[i].type, todoList[i].typeArgs);
		} else {
			this.addTodo(this.getID() + (isDef(todoList[i].id) ? todoList[i].id : altId), this.getJobsCh(), this.getTodoCh(), todoList[i], __, __, aJobArgs);
		}
	}
	return this;
};

/**
 * <odoc>
 * <key>oJob.add2Todo(aTodo, aId) : oJob</key>
 * Add a new aTodo job name or a complete aTodo object with an optional aId.
 * </odoc>
 */
OpenWrap.oJob.prototype.add2Todo = function(aTodo, aId) {
	aId = _$(aId).default("");

	aTodo = this.parseTodo(aTodo)
	if (isMap(aTodo)) {
		if (isDef(aTodo.job) && isUnDef(aTodo.name)) aTodo.name = aTodo.job;
		this.addTodo(this.getID() + aId, this.getJobsCh(), this.getTodoCh(), aTodo.name, aTodo.args, aTodo.type, aTodo.typeArgs);
	} else {
		this.addTodo(this.getID() + aId, this.getJobsCh(), this.getTodoCh(), aTodo, __, __, __);
	}

	return this;
};

/**
 * <odoc>
 * <key>oJob.__addLog(aOperation, aJobName, aJobExecId, args, anErrorMessage, aId, aTypeArgs) : String</key>
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
OpenWrap.oJob.prototype.__addLog = function(aOp, aJobName, aJobExecId, args, anException, aId, aTypeArgs) {
	var aId = (isDef(aId) ? aId : "");
	var itsAnError = false
		
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
		});
		break;
	case "success" :
		existing.success = true;
		existing.count++;
		try { 
			//var execJob = $path(existing.log, "[?id==`" + currentJobExecId + "`] | @[0]"); 
			var execJob = $from(existing.log).useCase(true).equals("id", currentJobExecId).at(0)
			execJob = _$(execJob, "execJob").isMap().default({})
			execJob.endTime = now()
			existing.totalTime += execJob.endTime - execJob.startTime
			existing.avgTime = existing.totalTime / existing.count
		} catch(e) {
			logWarn("Can't add success log for '" + aJobName + "' for job exec id '" + aJobExecId + "': " + e.message);
		}
		break;
	case "error"   :
		itsAnError = true
		existing.error   = true;
		existing.count++;
		try {
			//var execJob = $path(existing.log, "[?id==`" + currentJobExecId + "`] | @[0]"); 
			var execJob = $from(existing.log).useCase(true).equals("id", currentJobExecId).at(0); 
			execJob = _$(execJob, "execJob").isMap().default({})
			if (isDef(anException) && isDef(anException.javaException) && this.__ojob.logArgs) {
				var ar = anException.javaException.getStackTrace();
		    		execJob.error = [ String(anException.javaException) ];
			   	for(var er in ar) { 
		 	      		execJob.error.push(" at "+ ar[er]);
				}
			} else {
				execJob.error = String(anException);
			}
			execJob.endTime  = now();
			existing.totalTime += execJob.endTime - execJob.startTime;
			existing.avgTime = existing.totalTime / existing.count;
		} catch(e) {
			logWarn("Can't add error log for '" + aJobName + "' for job exec id '" + aJobExecId + "': " + e.message);
		}
		break;
	case "depsfail":
		existing.deps    = false;
		break;
	default: existing = __;
	}

	if (isDef(existing)) {
		var ansis = false;
		if (this.__ojob.logToConsole || this.__ojob.logOJob || this.__ojob.logToFile || isDef(getChLog())) {
			var aa = "";
			if (isDef(args) && this.__ojob.logArgs) {
				var temp = clone(args);
				if (isMap(temp)) {
					delete temp.objId;
					delete temp.execid;
				}
				aa = "[" + existing.name + "] | " + JSON.stringify(temp) + "\n";
			}

			if (isUnDef(__conStatus)) __initializeCon();
			ansis = Boolean(__conAnsi && (java.lang.System.console() != null));
			try {
				var s = "", ss = "", sn = "", se = "";
				var w = (isDef(__con)) ? __con.getTerminal().getWidth() : this.__conWidth;
				var jansi = JavaImporter(Packages.org.fusesource.jansi);
				
				if (this.__ojob.logToConsole && ansis) {
					//jansi.AnsiConsole.systemInstall();
					ansiStart();
					s  = repeat(w, '─');
					ss = repeat(w, '═');
					se = repeat(w, '╍');
					//sn = "";
					sn = String( jansi.Ansi.ansi().a(jansi.Ansi.Attribute.RESET) ) + "\n";
				} else {
					s  = repeat(this.__conWidth, '-');
					ss = repeat(this.__conWidth, '=');
					se = repeat(this.__conWidth, '*');
					sn = "\n";
				}

				var _c = function(m) { 
					return String(ansis ? 
							jansi.Ansi.ansi().boldOff().fg(jansi.Ansi.Color.GREEN).a(m).a(jansi.Ansi.Attribute.RESET) 
							: m); 
				};

				var _s = function(m) { 
					return String(ansis ? 
							jansi.Ansi.ansi().boldOff().fg(jansi.Ansi.Color.BLUE).a(m).a(jansi.Ansi.Attribute.RESET) 
							: m); 
				};
				
				var _g = function(m) { 
					return String(ansis ? 
							jansi.Ansi.ansi().boldOff().a(m).a(jansi.Ansi.Attribute.RESET) 
							: m); 
				};

				var _b = function(m) { 
					return String(ansis ? 
							jansi.Ansi.ansi().bold().a(m).a(jansi.Ansi.Attribute.RESET) 
							: m); 
				};

				var _e = function(m) { 
					return String(ansis ? 
							jansi.Ansi.ansi().bold().fg(jansi.Ansi.Color.RED).a(m).a(jansi.Ansi.Attribute.RESET) 
							: m); 
				};

				var __p  = m => __flags.OJOB_CONSOLE_STDERR ? printErr(m) : print(m)
				var __pl = m => __flags.OJOB_CONSOLE_STDERR ? printErrnl(m) : printnl(m)

				var showLogs = true
				if (isDef(aTypeArgs) && aTypeArgs.noLog && !this.__ojob.ignoreNoLog) showLogs = false
				
				if (__flags.OJOB_JOBSIGNORELOG.indexOf(existing.name) < 0) {
					var sep = (isDef(__logFormat) && (isDef(__logFormat.separator))) ? __logFormat.separator : " | ";
					
					// Helper function to trim job name if needed to fit the log line
					var _trimJobName = function(jobName, status, dateStr, flagStr) {
						var baseMsg = "[" + jobName + "]" + sep + this.__pid + sep + status;
						var totalNeeded = ansiLength(flagStr) + ansiLength(baseMsg) + ansiLength(dateStr) + 3; // 3 for spaces and margin
						
						if (totalNeeded <= w) return jobName; // Name fits, no trimming needed
						
						// Calculate how much we need to trim
						var maxNameLength = w - (ansiLength(sep) * 2 + ansiLength(this.__pid) + ansiLength(status) + ansiLength(dateStr) + ansiLength(flagStr) + 6); // 6 for brackets, spaces, and "..."
						
						if (maxNameLength <= 3) return "..."; // If even "..." won't fit, just return "..."
						return jobName.substring(0, maxNameLength - 3) + "...";
					}.bind(this);
					
					if (existing.start && (!existing.error && !existing.success)) { 
						var __f = ansis ? "\u25B7 " : ">> "
						var __d = (new Date()).toJSON(); var __n = nowNano();
						var __m2 = __d.replace(/(T|Z)/g, " ").trim();
						var trimmedName = _trimJobName(existing.name, "STARTED", __m2, __f);
						var msg = "[" + trimmedName + "]" + sep + this.__pid + sep;
						var __m1 = msg + "STARTED";
						if (showLogs && this.__ojob.logToConsole) { 
							var sepLength = Math.max(0, ansiLength(s) - (ansiLength(__m1) + __m2.length) - 2 - ansiLength(__f));
							syncFn(() => { __pl(_g(aa) + _s(__f) + _b(__m1) + " " + _s(s.substr(0, sepLength) + " " + __m2 + sn)); }, this); 
						}
						if (showLogs && this.__ojob.logOJob)      { log(__m1) }
						if (isDef(getChLog()) && this.__ojob.logJobs) getChLog().set({ n: nowNano(), d: __d, t: "INFO" }, { n: nowNano(), d: __d, t: "INFO", m: __m1 });
					}
					if (existing.start && existing.error) { 
						var __f = ansis ? "\u2715 " : "!! "
						var __d = (new Date()).toJSON(); var __n = nowNano();
						var __m2 = __d.replace(/(T|Z)/g, " ").trim();
						var trimmedName = _trimJobName(existing.name, "ERROR", __m2, __f);
						var msg = "[" + trimmedName + "]" + sep + this.__pid + sep;
						var __m1 = msg + "ERROR";
						if (showLogs && this.__ojob.logToConsole) { 
							var sepLength = Math.max(0, ansiLength(se) - (ansiLength(__m1) + __m2.length) - 2 - ansiLength(__f));
							syncFn(() => { __p("\n" + _e(__f) + _g(aa) + _b(__m1) + " " + _e(se.substr(0, sepLength) + " " + __m2 + sn) + af.toYAML(existing.log) + "\n" + _e(se)); }, this); 
						}
						if (!showLogs || !this.__ojob.logToConsole) { 
							// Errors should be always logged and catch is available
							logErr(__m1 + ": " + af.toSLON(existing.log)) 
						}
						if (isDef(getChLog()) && this.__ojob.logJobs) getChLog().set({ n: nowNano(), d: __d, t: "ERROR" }, { n: nowNano(), d: __d, t: "ERROR", m: __m1 + "\n" + stringify(existing.log) });
					}
					if (existing.start && existing.success) { 
						var __f = ansis ? "\u2713 " : "<< "
						var __d = (new Date()).toJSON(); var __n = nowNano();
						var __m2 = __d.replace(/(T|Z)/g, " ").trim();
						var trimmedName = _trimJobName(existing.name, "SUCCESS", __m2, __f);
						var msg = "[" + trimmedName + "]" + sep + this.__pid + sep;
						var __m1 = msg + "SUCCESS";
						if (showLogs && this.__ojob.logToConsole) { 
							var sepLength = Math.max(0, ansiLength(ss) - (ansiLength(__m1) + __m2.length) - 2 - ansiLength(__f));
							syncFn(() => { __pl("\n" + _g(aa) + _c(__f) + _b(__m1) + " " + _c(ss.substr(0, sepLength) + " " + __m2 + sn)); }, this); 
						}
						if (showLogs && this.__ojob.logOJob)      { log(__m1) }
						if (isDef(getChLog()) && this.__ojob.logJobs) getChLog().set({ n: nowNano(), d: __d, t: "INFO" }, { n: nowNano(), d: __d, t: "INFO", m: __m1 });
					}
				}
			} catch(e) { 
				logErr(e); 
			} finally { 
				//if (this.__ojob.logToConsole && ansis) ansiStop();
			}
		};

		// Housekeeping
		while (existing.log.length > this.__logLimit) existing.log.shift();

        if (!this.__ojob.logArgs) delete existing.args
		this.getLogCh().set({ "ojobId": this.__id + aId, "name": aJobName }, existing);
	}

	// Generic housekeeping
	//if (this.__ojob.logHistory > -1) while(this.getLogCh().size() > this.__ojob.logHistory) this.getLogCh().shift();
	if (this.__ojob.logHistory > -1 && this.getLogCh().size() > (this.__ojob.logHistory * this.getJobsCh().size())) {
		$doV(() => {
			$ch("oJob::jobs").getKeys().forEach(j => {
				var hkks = this.getLogCh().getKeys().filter(r => r.name == j.name);
				var hklst = [];
				while (hkks.length > this.__ojob.logHistory) {
					hklst.push(hkks.shift());
				}
				this.getLogCh().unsetAll(["ojobId", "name"], hklst);
			});
		})
	}

	return currentJobExecId;
};

/**
 * <odoc>
 * <key>oJob.stop()</key>
 * Stops all oJob processing.
 * </odoc>
 */
OpenWrap.oJob.prototype.stop = function() {
	if (this.python) {
		try { $pyStop(); } catch(e) {}
		this.python = false;
	}

	if (this.running) {
		$doWait($doAll(this.__promises));
		if (isDef(ow.metrics)) ow.metrics.stopCollecting( isDef(this.__ojob.metrics) && isDef(this.__ojob.metrics.chName) ? this.__ojob.metrics.chName : __ );
		//this.getLogCh().waitForJobs(250);
		this.getLogCh().waitForJobs();
		for(var i in this.__threads) {
			for(var j in this.__threads[i]) {
				this.__threads[i][j].stop(true);
			}
		}
		if (isDef(this.__sch)) {
			try {
				this.__sch.stop();
				this.__sch = new ow.server.scheduler();
			} catch(e) {}
		}
		if (isDef(this.mt)) {
			this.mt.stop();
		}
		this.oJobShouldStop = true;
		this.running = false;
		//stopLog();

		if (this.__ojob.logToConsole && Boolean(__conAnsi && (java.lang.System.console() != null))) ansiStop();
	}
};

OpenWrap.oJob.prototype.__defaultArgs = function(aArgs) {
	traverse(aArgs, (aK, aV, aP, aO) => {
		if ("string" == typeof aV && aV.length > 3 && aV.startsWith("${") && aV.endsWith("}")) {
			var _s = aV.substring(2, aV.length - 1)
			var _r, _t = _s.split(":-")
			if (_t[0] != aK) {
				_r = $$(aArgs).get(_t[0])
				if ("undefined" == typeof _r && _t.length > 1) {
					// There is a default
					_r = _t[1]
				}
				aO[aK] = _r
			} else {
				logWarn("oJob: argument '" + aK + "' can't be used as default value for itself (" + aV + ")")
			}
		}
	})
	return aArgs
}

OpenWrap.oJob.prototype.__mergeArgs = function(a, b) {
	function _flatten(aSource) {
		var t;
	
		if (isDef(aSource) && isArray(aSource)) {
			t = [];
			for(var ii in aSource) {
				if (isArray(aSource[ii])) {
					for(var jj in aSource[ii]) {
						t.push(aSource[ii][jj]);
					}
				} else {
					t.push(aSource[ii]);
				}
			}
		}
	
		return t;
	}

	var arep = false, brep = false, r = __;
	if (isObject(a) && isDef(a["__oJobRepeat"])) arep = true;
	if (isObject(b) && isDef(b["__oJobRepeat"])) brep = true;

	if (arep && !brep)  { a["__oJobRepeat"] = merge(a["__oJobRepeat"], b); r = a; }
	if (!arep && brep)  { b["__oJobRepeat"] = merge(a, b["__oJobRepeat"]); r = b; }
	if (arep && brep)   { a["__oJobRepeat"] = _flatten(merge(a["__oJobRepeat"], b["__oJobRepeat"])); r = a; }
	if (!arep && !brep) { r = merge(a, b); }

	return r;
};

OpenWrap.oJob.prototype.__processTypeArg = function(aTypeArg) {
	if (isString(aTypeArg)) {
		var res;
		try {
			res = eval(aTypeArg);
		} catch(e) {
			res = aTypeArg;
		}
		return res;
	} else {
		return aTypeArg;
	}
};

OpenWrap.oJob.prototype.__processArgs = function(aArgsA, aArgsB, aId, execStr) {
	var argss = {};
	if (isDef(aArgsA)) {
		if (isArray(aArgsA)) {
			argss = this.__mergeArgs(argss, { __oJobRepeat: aArgsA });	
		} else {
			if (isObject(aArgsA)) {
				if (execStr && isDef(aArgsA.__oJobExec)) 
					argss = this.__mergeArgs(argss, this.__processArgs(af.eval(aArgsA.__oJobExec), aArgsA));
				else
					argss = this.__mergeArgs(argss, aArgsA);
			} else {
				if (isString(aArgsA)) {
					argss = this.__mergeArgs(argss, { __oJobExec: aArgsA });
					if (execStr) argss = this.__mergeArgs(argss, this.__processArgs(af.eval(aArgsA)));
				}
			}
		}
	}
	
	if (isDef(aArgsB)) {
		argss = this.__mergeArgs(argss, this.__processArgs(aArgsB));
	}
	
	argss.__id = aId;

	return argss;
};

OpenWrap.oJob.prototype.askOnHelp = function(aHelpMap) {
	_$(aHelpMap, "helpMap").isMap().$_()

	if (!__flags.OJOB_HELPSIMPLEUI) __initializeCon()

	if (isDef(aHelpMap) && aHelpMap.text) 
		print(ansiColor("FAINT,ITALIC", "oJob | ") + aHelpMap.text)
	else
		print(ansiColor("FAINT,ITALIC", "oJob | ") + "(none available)")

	print()

	_args = {}
	var _cen = []
	if (isDef(aHelpMap.expects)) {
		print(ansiColor("ITALIC,FAINT", "please fill out the job arguments (no value entered is equivalent to not providing the argument; (*) means a value it's mandatory):"))
		print()
		aHelpMap.expects.forEach(param => {
			if (isDef(param.name)) {
				if (isDef(param.desc)) print(param.desc)
				
				var p = param.name
				if (isDef(param.mandatory) && param.mandatory) p = p + " (*)"
				p += ": "

				if (param.secret) {
					_args[param.name] = ask(p, String.fromCharCode(0))
					_cen.push(param.name)
				} else {
					if (isDef(param.options)) {
						var _v = askChoose(p, param.options)
						if (isNumber(_v)) _args[param.name] = param.options[_v]
					} else if (isDef(param.moptions)) {
						_args[param.name] = askChooseMultiple(p, param.moptions).join(",")
					} else {
						_args[param.name] = ask(p)
					}
				}

				print()
			}
		})
	} else {
		var _res = askChoose("no arguments to fill out; should execution proceed? ", ["yes", "no"])
		if (_res == 1) return __
		print()
	}

	Object.keys(_args).forEach(k => {
		if (isUnDef(_args[k]) || String(_args[k]).length == 0) delete _args[k]
	})

	print(ansiColor("FAINT,ITALIC", "executing the equivalent command to:"))
	print(ansiColor("YELLOW", " ojob " + this.__file + " " + Object.keys(_args).map(k => k + "=" + (_cen.indexOf(k) >= 0 ? "***" : _args[k])).join(" ")))
	print()
	print(ansiColor("FAINT", repeat(6, "─")))
	print()

	return _args
}

/**
 * <odoc>
 * <key>ow.oJob.showHelp(aHelpMap, args, showAnyway) : boolean</key>
 * Given a job help map and the current arguments determines if there is a need to show help usage text and shows it on stdout.
 * Returns true if help was output, false otherwise.
 * </odoc>
 */
OpenWrap.oJob.prototype.showHelp = function(aHelpMap, aArgs, showAnyway) {
	_$(aHelpMap, "helpMap").isMap().$_();
	_$(aArgs, "args").isMap().$_();

	if (!__flags.OJOB_HELPSIMPLEUI) __initializeCon();
	var simpleUI = __flags.OJOB_HELPSIMPLEUI ? true : !(isDef(__conAnsi) ? __conAnsi : false);
	if (ow.format.isWindows() && !ansiWinTermCap()) simpleUI = true;

	aHelpMap.expects = _$(aHelpMap.expects, "helpMap.expects").isArray().default([]);
	
	// Check if there is a need to show help
	var shouldShow = _$(showAnyway).isBoolean().default(false);
	aHelpMap.expects.filter(param => isDef(param.mandatory) && param.mandatory).forEach(param => {
	  if (isUnDef(aArgs[param.name])) shouldShow = true;
	})

	if (!shouldShow) return false;

	var usage, example;
	if (simpleUI) {
		usage   = "Usage: ojob ";
		example = "Example: '$ ojob ";
	} else {
		usage   = ansiColor("BOLD", "Usage:") + " ojob ";
		example = ansiColor("BOLD", "\nExample: ") + ansiColor("GREEN", "'$ ojob ");
	}

	var pargs = "";

	// Get current name
	//usage   += __expr.replace(/^([^ ]+).*/, "$1 ");
	//example += ansiColor("GREEN", __expr.replace(/^([^ ]+).*/, "$1 "));
	if (simpleUI) {
		usage   += this.__file + " ";
		example += this.__file + " ";
	} else {
		usage   += this.__file + " ";
		example += ansiColor("GREEN", this.__file + " ");
	}
	
	// Check params
	var maxSize = 0;
	aHelpMap.expects.forEach(param => maxSize = (isDef(param.name) && maxSize > param.name.length) ? maxSize : param.name.length);
	aHelpMap.expects.forEach(param => {
	  if (isDef(param.name)) {
		usage   += "[" + param.name + "=..." + "] ";
		if (isUnDef(param.mandatory) || param.mandatory) {
		  if (simpleUI) {
			example += param.name + "=" + (isDef(param.example) ? String(param.example).replace(/ /g, "\\ ") + " " : "...");
			pargs   += $f(" *   %" + maxSize + "s: %s\n", param.name, (isDef(param.desc) ? param.desc : ""));
		  } else {
			var sp = isDef(param.example) && param.example.indexOf(" ") >= 0 ? "\"" : ""
			example += ansiColor("GREEN", param.name + "=" + sp + (isDef(param.example) ? String(param.example).replace(/ /g, "\\ ") + sp + " " : "... "));
			pargs   += $f(ansiColor("BOLD", "%" + maxSize + "s:") + " %s\n", param.name, (isDef(param.desc) ? param.desc : ""));
		  }
		} else {
		  if (simpleUI) {
			pargs += $f("     %" + maxSize + "s: %s\n", param.name, (isDef(param.desc) ? param.desc : ""));
		  } else {
			pargs += $f("%" + maxSize + "s: %s\n", param.name, (isDef(param.desc) ? param.desc : ""));
		  }
		}
	  }
	});

	if (simpleUI) {
		if (isDef(aHelpMap.text)) print(aHelpMap.text + "\n");
		print(usage);
		if (pargs.length > 0) print("\n" + pargs);
		print(example + "'\n");
	} else {
		if (isDef(aHelpMap.text)) print(ansiColor("RESET", aHelpMap.text + "\n"));
		print(usage);
		if (pargs.length > 0) print(ow.format.withSideLine(pargs.replace(/\n$/mg, ""), __, "BLUE", __, ow.format.withSideLineThemes().simpleLineWithCTips));
		print(example + ansiColor("GREEN", "'") + "\n");
	}

	return true;
};

/**
 * <odoc>
 * <key>oJob.start(args, shouldStop, aId, isSubJob) : oJob</key>
 * Starts the todo list. Optionally you can provide arguments to be used by each job.
 * Optionally you can provide aId to segment these specific jobs.
 * </odoc>
 */
OpenWrap.oJob.prototype.start = function(provideArgs, shouldStop, aId, isSubJob) {
	if (isArray(provideArgs) && __flags.OJOB_INIT_ARRAY_ARGS_LIST) provideArgs = { _list: provideArgs }
	var args = isDef(provideArgs) ? this.__processArgs(provideArgs, (isSubJob ? {} : this.__expr), aId) : this.__expr;

	var localStop = false
	if (!isSubJob) this.running = true
	if (!isSubJob) this.oJobShouldStop = false

	var parent = this;

	this.__ojob = _$(this.__ojob).default({})
	if (isDef(this.__ojob.initTemplateEscape)) {
		this.__ojob.initTemplateEscape = this.__ojob.initTemplateEscape
	} else {
		this.__ojob.initTemplateEscape = false
	}

	if (isDef(this.init) && this.__ojob.initTemplateEscape) {
		traverse(this.init, (aK, aV, aP, aO) => {
			if (isString(aV) && aV.indexOf("{{") >= 0) {
				aO[aK] = aV.replace(/\{(\{+)/g, "\\{$1")
			}
		})
	}

	if (isDef(this.init)) args = merge(args, { init: this.init })

	if (this.__ojob != {}) {
		if ((isDef(this.__ojob.argsFromEnvs) && this.__ojob.argsFromEnvs) || __flags.OJOB_ARGS_FROM_ENVS) {
			args = this.__processArgs(getEnvs(), args, aId);
		}

		if (isDef(this.__ojob.cronInLocalTime)) {
			if (this.__ojob.cronInLocalTime) {
				ow.format.cron.set2LocalTime();
			} else {
				ow.format.cron.set2UTC();
			}
		}

		this.__ojob.logHistory = _$(this.__ojob.logHistory).isNumber().default(10);

	    if (isUnDef(this.__ojob.timeInterval)) this.__ojob.timeInterval = 100;

		if (isDef(this.__ojob.id) && isUnDef(aId)) aId = this.__ojob.id;

        // onerror as an alias for catch
		if (isDef(this.__ojob.onerror) && isUnDef(this.__ojob.catch)) this.__ojob.catch = this.__ojob.onerror;
		if (isDef(this.__ojob.catch) && !(isString(this.__ojob.catch))) this.__ojob.catch = __;

		if (isNumber(this.__ojob.poolThreadFactor)) __resetThreadPool(this.__ojob.poolThreadFactor)

        // Active (push) and passive metrics
		if (isDef(this.__ojob.metrics)) {
			if (isBoolean(this.__ojob.metrics) && this.__ojob.metrics) ow.server.telemetry.passive(__, __, this.__ojob.metrics.openMetrics, this.__ojob.metrics.openMetricsPrefix, this.__ojob.metrics.openMetricsHelp);
			if (isMap(this.__ojob.metrics)) {
				if (isDef(this.__ojob.metrics.collect)) {
					if (isBoolean(this.__ojob.metrics.collect) && this.__ojob.metrics.collect) ow.metrics.startCollecting();
					if (isMap(this.__ojob.metrics.collect)) {
						var ch = _$(this.__ojob.metrics.collect.ch, "ojob.metrics.collect.ch").isString().default(__);
						var period = _$(this.__ojob.metrics.collect.period, "ojob.metrics.collect.period").isNumber().default(__);
						var some = _$(this.__ojob.metrics.collect.some, "ojob.metrics.collect.some").isArray().default(__);

						ow.metrics.startCollecting(ch, period, some, this.__ojob.metrics.collect.noDate);
					}
				}
				// Active and passive telemetry
				var active  = isMap(this.__ojob.metrics.active);
				var passive = isUnDef(this.__ojob.metrics.passive) || this.__ojob.metrics.passive; 
				if (active) {
					// active telemetry
					var fn;
					// Prometheus/OpenMetrics
					// ojob:
					// 	daemon : true
					// 	metrics:
					// 		add   :
					// 		mystuff: |
					// 			return { mystuff: now(), mystuff2: nowNano() }
					// 		active: 
					// 		periodInMs : 1000
					// 		openmetrics:
					// 			url    : http://127.0.0.1:9091/metrics/job/test
					// 			prefix : test
					// 			metrics:
					// 			- mystuff
					// 			- mem
					if (isMap(this.__ojob.metrics.active.openmetrics)) {
						fn = ow.server.telemetry.send2Prometheus(this.__ojob.metrics.active.openmetrics.url, this.__ojob.metrics.active.openmetrics.prefix, this.__ojob.metrics.active.openmetrics.metrics);
					}
					// nAttrMon
					// ojob:
					// 	daemon : true
					// 	metrics:
					// 		add   :
					// 		mystuff: |
					// 			return { mystuff: now(), mystuff2: nowNano() }
					// 		active: 
					// 		periodInMs : 1000
					// 		nattrmon   :
					// 			url       : http://change:me@127.0.0.1:7777/remote
					// 			attrPrefix: Testa/
					// 			metrics   :
					// 			- mystuff
					// 			- mem
					if (isMap(this.__ojob.metrics.active.nattrmon)) {
						fn = ow.server.telemetry.send2nAttrMon(this.__ojob.metrics.active.nattrmon.url, this.__ojob.metrics.active.nattrmon.attrPrefix, this.__ojob.metrics.active.nattrmon.metrics);
					}
					// OR provide a custom function to send telemetry somewhere
					if (isString(this.__ojob.metrics.active.fn)) {
						fn = newFn(this.__ojob.metrics.active.fn);
					}
					ow.server.telemetry.active(fn, this.__ojob.metrics.active.periodInMs);

					// If nothing else was said don't assume passive should still be done
					if (isUnDef(this.__ojob.metrics.passive)) passive = false;
				} 
				// Passive
				if (passive) {
					ow.server.telemetry.passive(this.__ojob.metrics.port, this.__ojob.metrics.uri, this.__ojob.metrics.openMetrics, this.__ojob.metrics.openMetricsPrefix, this.__ojob.metrics.openMetricsHelp);
				}
			}
		}

		// Daemon function that runs periodically using ojob.timeInterval
		// If function returns true daemon will be interrupted
		if (isString(this.__ojob.daemonFunc)) {
			var parent = this;
			this.periodicFuncs.push(() => {
				var res = (newFn(parent.__ojob.daemonFunc))();
				if (isDef(res) && res == true) {
					parent.oJobShouldStop = true;
				}
				return false;
			});
		}

	    if (isDef(this.__ojob.unique) && !this.__ojob.__subjob) {
	    	if (isUnDef(this.__ojob.unique.pidFile)) this.__ojob.unique.pidFile = "ojob.pid";
	    	if (isUnDef(this.__ojob.unique.killPrevious)) this.__ojob.unique.killPrevious = false;

			var pfile;
			try {
				pfile = eval(this.__ojob.unique.pidFile);
			} catch(e) {
				pfile = this.__ojob.unique.pidFile; 
			}
	    	var s = ow.server.checkIn(pfile, function(aPid) {
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
					var word = (pidCheck(pid) ? "Running on" : "Not running but registered with");
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

	global.args = merge(global.args, args)
	global.init = merge(global.init, this.init)

    // Show help if enabled and determined
    if (this.__ojob.showHelp) {
		// Find reserved job called 'Help' or use the default help on the ojob definition
		var helpmap;
		if (compare(this.__help, {})) {
			job = this.getJobsCh().get({ name: "Help" });
			if (isDef(job) && isDef(job.help)) helpmap = job.help;
		} else {
			helpmap = this.__help;
		}
		if (isDef(helpmap)) {
			// Call format function with the help map and current arguments. Stop if help was output
			if (this.showHelp(helpmap, args, false)) return;
		}
	}

	var t = new Threads();
	this.mt = new Threads();

	//var parent = this;
	var altId = (isDef(aId) ? aId : "");
	aId = altId;

	if (this.__ojob.daemon != true && isDef(this.__ojob.checkStall) && isNumber(this.__ojob.checkStall.everySeconds) && this.__ojob.checkStall.everySeconds > 0) {
		this.__mtStart = now();
		this.mt.addScheduleThreadAtFixedRate(function() {
			if (isDef(parent.__ojob.checkStall.checkFunc)) {
				var res = (newFn(parent.__ojob.checkStall.checkFunc))(parent.__mtStart);
				if (res) exit(-1);
			}
			if ((now() - parent.__mtStart) > (parent.__ojob.checkStall.killAfterSeconds * 1000)) {
				logErr("oJob: Check stall over " + (parent.__ojob.checkStall.killAfterSeconds * 1000));
				//printErr("oJob: Check stall over " + (parent.__ojob.checkStall.killAfterSeconds * 1000));
				exit(-1);
			} 
		}, this.__ojob.checkStall.everySeconds * 1000);
	} 

	// Handle debug
	if (isDef(this.__ojob.debug) && this.__ojob.debug) {
		ow.loadDebug()
        ow.debug.register()
		var ch = ow.oJob.getJobsCh()
		ch.forEach((k, job) => {
			if (isUnDef(job.lang) || (isDef(job.lang) && (job.lang == "oaf" || job.lang == "js" || job.lang == "javascript") ) ) {
				job.exec = ow.debug.debug(job.exec, isMap(this.__ojob.debug) ? this.__ojob.debug : __, true, k.name)
			}
			ch.set(k, job)
		})
	}

	//var shouldStop = false;
	if (!isSubJob) this.oJobShouldStop = false
	this.__ojob.sequential = _$(this.__ojob.sequential).isBoolean().default(__flags.OJOB_SEQUENTIAL);
	if (this.__ojob.sequential) {
		var job = __; //last = __;
		//var listTodos = $path(this.getTodoCh().getSortedKeys(), "[?ojobId==`" + (this.getID() + altId) + "`]");
		var listTodos = $from(this.getTodoCh().getSortedKeys()).useCase(true).equals("ojobId", (this.getID() + altId)).select();
		this.__ojob.shareArgs = _$(this.__ojob.shareArgs).isBoolean().default(__flags.OJOB_SHAREARGS)
		while(listTodos.length > 0) {
			var todo = this.getTodoCh().get(listTodos.shift());
			job = this.getJobsCh().get({ name: todo.name });
			var argss 
			if (this.__ojob.shareArgs) {
				var _r = clone($get("res"))
				delete _r.init
				argss = merge(args, _r)
			} else {
				argss = args
			}
			//var argss = merge(args, last);
			//if (isDef(todo.args)) argss = this.__processArgs(merge(args, last), todo.args, aId);
			if (isDef(todo.args)) argss = this.__processArgs(argss, todo.args, aId);
			if (isDef(job)) {
				if (isUnDef(job.typeArgs)) job.typeArgs = {};
				if (isDef(todo.typeArgs))  job.typeArgs = merge(job.typeArgs, todo.typeArgs);

				var res = this.runJob(job, argss, aId, true, true, listTodos);
				if (res != false) {
					this.getTodoCh().unset({
						"ojobId": todo.ojobId,
						"todoId": todo.todoId
					}, todo);
				}
				if (isMap(res)) {
					delete res.objId;
					delete res.execid;
					delete res.__id;
					$set("res", res);
					/*last = res;
				} else {
					last = __;*/
				}
			} else {
				logErr("Job " + todo.name + " not found!");
				this.getTodoCh().unset({
					"ojobId": todo.ojobId,
					"todoId": todo.todoId
				});
				//listTodos = $path(this.getTodoCh().getSortedKeys(), "[?ojobId==`" + (this.getID() + altId) + "`]");
				//listTodos = $from(this.getTodoCh().getSortedKeys()).useCase(true).equals("ojobId", (this.getID() + altId)).select();
			}
			listTodos = $from(this.getTodoCh().getSortedKeys()).useCase(true).equals("ojobId", (this.getID() + altId)).select();
			//listTodos = $path(this.getTodoCh().getSortedKeys(), "[?ojobId==`" + (this.getID() + altId) + "`]")
		}
	} else {
		t.addVirtualThread(function() {
		//t.addThread(function() {
			// Check all jobs in the todo queue
			var job = __
			while(!(parent.oJobShouldStop && localStop)) {
				try {
					//var parentOJob = $path(parent.getTodoCh().getKeys(), "[?ojobId==`" + (parent.getID() + altId) + "`]");
					var parentOJob = $from(parent.getTodoCh().getKeys()).useCase(true).equals("ojobId",  (parent.getID() + altId)).select();
					//var pjobs = [];
					for (var ipoj = 0; ipoj < parentOJob.length; ipoj++) {
						var todo = parent.getTodoCh().get(parentOJob[ipoj]);
						job = parent.getJobsCh().get({ "name": todo.name });
						var argss = args;
						if (isDef(todo.args)) argss = parent.__processArgs(args, todo.args, aId);
						if (isDef(job)) {
							if (isUnDef(job.typeArgs)) job.typeArgs = {};
							if (isDef(todo.typeArgs))  job.typeArgs = merge(job.typeArgs, todo.typeArgs);

							var res = parent.runJob(job, argss, aId, !(parent.__ojob.async));
							if (res != false) {
								parent.getTodoCh().unset({ 
									"ojobId": todo.ojobId,
									"todoId": todo.todoId
								}, todo);
							}
							if (isMap(res)) {
								delete res.objId;
								delete res.execid;
								delete res.__id;
								$set("res", res);
							}
						} else {
							logErr("Job " + todo.name + " not found!");
							parent.getTodoCh().unset({
								"ojobId": todo.ojobId,
								"todoId": todo.todoId
							});
						}
					}
					if (!(parent.oJobShouldStop && localStop) &&
						!(isDef(parent.__ojob) && isDef(parent.__ojob.daemon) && parent.__ojob.daemon == true) &&
		                parentOJob.length <= 0
		               ) {
						  if (!isSubJob) parent.oJobShouldStop = true;
						  localStop = true
		               	  try {
						      if (!isSubJob) parent.stop();              		  
		               	  } catch(e) {}
					} 
				} catch(e) { logErr(e); if (isDef(e) && isDef(e.javaException)) e.javaException.printStackTrace(); }
				if (isDef(parent.__ojob) && parent.__ojob.daemon == true) {
					sleep((isDef(parent.__ojob.timeInterval) ? parent.__ojob.timeInterval : 50), true);
					parent.__periodicFunc();
				} else {
					sleep(50, true);
				}
			}
		});
	}
	
	if (!(this.__ojob.sequential)) t.start();

	if (this.__ojob != {} && this.__ojob.daemon == true && this.__ojob.sequential == true)
		ow.server.daemon(__, this.__periodicFunc);

	if (!(this.__ojob.sequential)) {
		try {
			while(parent.oJobShouldStop == false && localStop == false) {
				t.waitForThreads(50);
			}
			t.stop();
		} catch(e) {}
	}

	if (!isSubJob) this.stop();
};

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
};

/**
 * <odoc>
 * <key>ow.oJob.getState() : String</key>
 * Get current global state, if defined.
 * </odoc> 
 */
OpenWrap.oJob.prototype.getState = function(altId) {
	altId = _$(altId, "altId").isString().default("")
	var _s = $get("ojob::state::" + this.getID() + altId)
	return isDef(_s) ? String(_s) : "init"
}

/**
 * <odoc>
 * <key>ow.oJob.setState(aState)</key>
 * Sets the current global state to be used with todo.when
 * </odoc>
 */
OpenWrap.oJob.prototype.setState = function(aState, altId) {
	altId = _$(altId, "altId").isString().default("")
	$set("ojob::state::" + this.getID() + altId, String(aState))
}

/**
 * <odoc>
 * <key>ow.oJob.getMetric(aMetricId)</key>
 * Retrieves the current metric identified by aMetricId
 * </odoc>
 */
OpenWrap.oJob.prototype.getMetric = function(aId) {
	return _$(ow.oJob.getMetricsCh().get({ id: aId })).isMap().default({})
}

/**
 * <odoc>
 * <key>ow.oJob.setMetric(aId, aMetricObj)</key>
 * Sets aMetricObj for the metric identified with aId
 * </odoc>
 */
OpenWrap.oJob.prototype.setMetric = function(aId, aObj) {
	ow.loadMetrics()

	if (isMap(aObj)) aObj.id = aId
	ow.oJob.getMetricsCh().set({ id: aId }, aObj)
	if (isMap(aObj) && isString(aObj.type) && !ow.metrics.exists(aObj.type)) 
	   ow.metrics.add(aObj.type, ow.oJob.getMetrics(aObj.type))
}

/**
 * <odoc>
 * <key>ow.oJob.getMetrics(aType) : Function</key>
 * Returns a function to be used with ow.metrics.add to add functions by metric aType
 * </odoc>
 */
OpenWrap.oJob.prototype.getMetrics = function(aType) {
	ow.loadObj()
	ow.loadMetrics()

	return function() {
		var data  = ow.oJob.getMetricsCh().getAll()

		return $from(data)
			   .equals("type", aType)
			   .select(r => {
				  var s = clone(r)
			      delete s.type
				  return s
			   })
	}
}

/**
 * <odoc>
 * <key>ow.oJob.runJob(aJob, provideArgs, aId)</key>
 * With jobs defined try to execute/start aJob, with the provideArgs, directly passing any existing todo list. 
 * Optionally you can provide aId to segment this specific jobs.
 * </odoc>
 */
OpenWrap.oJob.prototype.runJob = function(aJob, provideArgs, aId, noAsync, rExec, listTodos) {
	rExec = _$(rExec, "rExec").isBoolean().default(false);
	var parent = this, resExec = true, noTemplateArgs = true
	var altId = (isDef(aId) ? aId : "");
	aId = altId;

	// Check dep
	var canContinue = true, timeoutDeps = false;
	var depInfo = {};
	if (isDef(aJob.deps)) {		
		if (!isArray(aJob.deps)) aJob.deps = [ aJob.deps ];
		for(var j in aJob.deps) {
			if (canContinue) {
				try {
					var dep = (isObject(aJob.deps[j]) ? aJob.deps[j].name :  aJob.deps[j]);
					var depInf = this.getLogCh().get({ "ojobId": this.getID() + altId, "name": dep });
					if (isUnDef(depInf)) depInf = this.getLogCh().get({ "ojobId": this.getID(), "name": dep });
					depInfo[dep] = aJob.deps[j];

					if (isDef(depInf) && depInf.success) {
						canContinue = true;
						if (isDef(aJob.deps[j].onSuccess)) {
							var res = (newFn("var args = ow.oJob.__defaultArgs(arguments[0]); var job = arguments[1]; var id = arguments[2];" + aJob.deps[j].onSuccess))(provideArgs, aJob, aId);
							canContinue = res;
						}
						depInfo[dep].result = true;
					} else {
						if (isUnDef(depInf) && !parent.__ojob.depsWait && isUnDef(listTodos)) listTodos = $from(this.getTodoCh().getAll()).useCase(true).equals("ojobId", (this.getID() + altId)).select();
						if (isUnDef(depInf) && !parent.__ojob.depsWait && $from(listTodos).equals("name", dep).none()) {
							// No wait for unexisting deps (depsWait) then exit
							return true;
						} else {
							canContinue = false;
							this.__addLog("depsFail", aJob.name, __, provideArgs, __, aId, aJob.typeArgs)
							if (isDef(depInf) && depInf.error) {
								var res
								if (isDef(aJob.deps[j].onFail)) {
									res = (newFn("var args = ow.oJob.__defaultArgs(arguments[0]); var job = arguments[1]; var id = arguments[2];" + aJob.deps[j].onFail))(provideArgs, aJob, aId)
									canContinue = res
								} else {
									if (isDef(parent.__ojob.depsOnFail)) {
										res = (newFn("var args = ow.oJob.__defaultArgs(arguments[0]); var job = arguments[1]; var id = arguments[2];" + parent.__ojob.depsOnFail))(provideArgs, aJob, aId)
										canContinue = res
									}
								}
							}
							depInfo[dep].result = false;
						}
					}
				} catch(e) {
					logWarn("Issue while trying to process dependency " + stringify(aJob.deps) + ": " + e);
				}
			}
		}

		var dlog = this.getLogCh().get({ "ojobId": this.getID() + altId, "name": aJob.name });
		if (isDef(dlog) && isUnDef(dlog.firstDepsCheck)) dlog.firstDepsCheck = now(); 
		if (!canContinue && isDef(parent.__ojob.depsTimeout) && isNumber(parent.__ojob.depsTimeout)) {
			if (isDef(dlog) && (now() - dlog.firstDepsCheck) > parent.__ojob.depsTimeout) {
				logErr(aJob.name + " | Timeout waiting for dependencies.");
				return true; 
			}
		}
	}

	// Verify global state
	if (canContinue && isDef(aJob.typeArgs) && isDef(aJob.typeArgs.when)) {
		var w;
		if (isString(aJob.typeArgs.when)) w = [ aJob.typeArgs.when ]; else w = aJob.typeArgs.when;
		if (w.length > 0) {
			var _state = parent.getState();
			if (isString(_state)) {
				if (_state == "never" || _state == "exit") return true;
				if (w.indexOf(_state) < 0) {
					canContinue = false;
					return true;
				}
			}
		}
	}

	function _run(aExec, args, job, id) {	
		if (isDef(aJob.typeArgs.noTemplateArgs)) noTemplateArgs = aJob.typeArgs.noTemplateArgs; else noTemplateArgs = !parent.__ojob.templateArgs
		
		// Find templates on args	
		if (!noTemplateArgs) {
			traverse(args, (aK, aV, aP, aO) => {
				if (isString(aV) && aV.indexOf("{{") >= 0) {
					aO[aK] = templify(aV, args)
				}
			})
			traverse(aJob.typeArgs, (aK, aV, aP, aO) => {
				if (isString(aV) && aV.indexOf("{{") >= 0) {
					aO[aK] = templify(aV, args)
				}
			})
		}

		var f = newFn("var args = ow.oJob.__defaultArgs(arguments[0]); var job = arguments[1]; var id = arguments[2]; var deps = arguments[3]; var each = __; " + aExec + "; return args;");
		var fe, fint;
		if (isDef(parent.__ojob.catch)) fe = newFn("var args = ow.oJob.__defaultArgs(arguments[0]); var job = arguments[1]; var id = arguments[2]; var deps = arguments[3]; var exception = arguments[4]; " + parent.__ojob.catch);
		if (isDef(aJob.catch)) fint = newFn("var args = ow.oJob.__defaultArgs(arguments[0]); var job = arguments[1]; var id = arguments[2]; var deps = arguments[3]; var exception = arguments[4]; " + aJob.catch);
		
		var stopWhen, timeout, tb = false, tbres;
		if (isDef(aJob.typeArgs.timeout))  { tb = true; timeout = aJob.typeArgs.timeout; }
		if (isDef(aJob.typeArgs.stopWhen)) { tb = true; stopWhen = newFn(aJob.typeArgs.stopWhen); }

		if (isDef(args.__oJobRepeat)) { 
			var errors = [];
			var single = false;
			if (isDef(parent.__ojob.numThreads) && parent.__ojob.numThreads <= 1) single = true;
			if (isDef(parent.__ojob.numThreads)) __cpucores = parent.__ojob.numThreads
	        if (isDef(aJob.typeArgs.single)) single = aJob.typeArgs.single;
			if (!single) {
				pForEach(args.__oJobRepeat, aValue => {
					if (isUnDef(aValue.execid) && isUnDef(aValue.objId)) {
						aValue.execid = args.execid;
						aValue.objId = args.objId;
					}
					try {
						(tb 
						 ? tbres = $tb().timeout(timeout).stopWhen(stopWhen).exec(() => { f(aValue, job, id, depInfo); })
						 : f(aValue, job, id, depInfo));
					} catch(e) {
						var useExt = true, recordError = true;
						if (isDef(fint)) {
							if (!fint(aValue, job, id, depInfo, e)) {
								if (parent.__ojob.logArgs) 
   									errors.push(stringify({ args: aValue, exception: String(e)}));
								else
									errors.push(stringify({ exception: String(e) }));
							}
							recordError = false;
							useExt = false;
						}
						if (isDef(fe) && useExt) {
							if (!fe(aValue, job, id, depInfo, e)) {
								if (parent.__ojob.logArgs) 
									errors.push(stringify({ args: aValue, exception: String(e)}));
								else
									errors.push(stringify({ exception: String(e)}));
							}
							recordError = false;
						}
						if (recordError) {
							if (parent.__ojob.logArgs)
								errors.push(stringify({ args: aValue, exception: String(e)}));
							else	
								errors.push(stringify({ exception: String(e)}));
						}
					} finally {
						return true;
					}
				});
			} else {
				for(var aVi in args.__oJobRepeat) {
					args.__oJobRepeat[aVi].execid = args.execid;
					args.__oJobRepeat[aVi].objId = args.objId;
					try {
						(tb 
						 ? tbres = $tb().timeout(timeout).stopWhen(stopWhen).exec(() => { f(args.__oJobRepeat[aVi], job, id, depInfo); })
						 : f(args.__oJobRepeat[aVi], job, id, depInfo));
					} catch(e) {
						var useExt = true, recordError = true;
						if (isDef(fint)) {
							if (!fint(args.__oJobRepeat[aVi], job, id, depInfo, e)) {
								if (parent.__ojob.logArgs)
									errors.push(stringify({ args: args.__oJobRepeat[aVi], exception: e}));
								else
									errors.push(stringify({ exception: e}));
							}
							recordError = false;
							useExt = false;
						}
						if (isDef(fe) && useExt) {
							if (!fe(args.__oJobRepeat[aVi], job, id, depInfo, e)) {
								if (parent.__ojob.logArgs)
									errors.push(stringify({ args: args.__oJobRepeat[aVi], exception: e}));
								else
									errors.push(stringify({ exception: e}));
							}
							recordError = false;
						}
						if (recordError) {
							if (parent.__ojob.logArgs)
								errors.push(stringify({ args: args.__oJobRepeat[aVi], exception: e}));
							else
								errors.push(stringify({ exception: e}));
						}
					}
				}
			}

			if (errors.length > 0) {
				throw errors.join(", ");
			}
		} else {
			try {
				if (tb) {
					tbres = $tb().timeout(timeout).stopWhen(stopWhen).exec(() => { resExec = f(args, job, id, depInfo); })
				} else {
					resExec = f(args, job, id, depInfo);
				}
			} catch(e) {
				if (isUnDef(fint) && isUnDef(fe)) throw e;

				if (isDef(fint) && !fint(args, job, id, depInfo, e)) {
					throw e;
				}
				if (isDef(fe) && !fe(args, job, id, depInfo, e)) {
					throw e;
				}
			}
		}

		if (tb === true && tbres == "timeout") {
			throw "Job exceeded timeout of " + aJob.typeArgs.timeout + "ms";
		}
	}
	
	if (canContinue) {
		var args = isDef(provideArgs) ? this.__processArgs(provideArgs, __, aId, true) : {};
		args.objId = this.getID() + altId;	
		//args = this.__mergeArgs(args, this.__processArgs(aJob.args, __, __, true));
		if (isUnDef(aJob.typeArgs)) {
			aJob.typeArgs = {};
		}

		switch(aJob.type) {
		case "simple":
			try {
				var uuid = this.__addLog("start", aJob.name, __, args, __, aId, aJob.typeArgs)
				args.execid = uuid;			
				args = this.__mergeArgs(args, aJob.args);
				
				if (noAsync || (isDef(aJob.typeArgs.async) && !aJob.typeArgs.async)) {
					_run(aJob.exec, args, aJob, aId);
					this.__addLog("success", aJob.name, uuid, args, __, aId, aJob.typeArgs)
				} else {
					parent.__promises.push($do(() => {
						_run(aJob.exec, args, aJob, aId); 
					}).then(() => {
						parent.__addLog("success", aJob.name, uuid, args, __, aId, aJob.typeArgs)
					}).catch((e) => {
						parent.__addLog("error", aJob.name, uuid, args, e, aId, aJob.typeArgs)
					}));
				}
			} catch(e) {
				this.__addLog("error", aJob.name, uuid, args, e, aId, aJob.typeArgs)
			}
			
			//return true;
			break;
		case "jobs":
			if (isDef(aJob.typeArgs.file) || isDef(aJob.typeArgs.url)) {
				aJob.typeArgs.file = this.__processTypeArg(aJob.typeArgs.file);
				aJob.typeArgs.url  = this.__processTypeArg(aJob.typeArgs.url);
				try {
					var uuid = parent.__addLog("start", aJob.name, __, args, __, aId, aJob.typeArgs)
					args.execid = uuid;
					if (isUnDef(args.__oJobRepeat)) args = this.__mergeArgs(args, aJob.args);

					var f = isDef(aJob.typeArgs.file) ? aJob.typeArgs.file : aJob.typeArgs.url;
					parent.runFile(f, args, f, true);
					this.__addLog("success", aJob.name, uuid, args, __, aId, aJob.typeArgs)

					//return true;
				} catch(e) {
					this.__addLog("error", aJob.name, uuid, args, e, aId, aJob.typeArgs)
					//return true;
				}
			} else {
				this.__addLog("error", aJob.name, uuid, args, "No typeArgs.file or typeArgs.url provided.", aId, aJob.typeArgs)
				//return true;
			}
			break;
		case "shutdown":
			//addOnOpenAFShutdown(function() {
			this.shutdownFuncs.push(function() {
				try {
					var uuid = parent.__addLog("start", aJob.name, undefined, args, undefined, aId, aJob.typeArgs)
					args.execid = uuid;
					args = parent.__mergeArgs(args, aJob.args);

					_run(aJob.exec, args, aJob, aId);
					parent.__addLog("success", aJob.name, uuid, undefined, aId, aJob.typeArgs)
				} catch(e) {
					parent.__addLog("error", aJob.name, uuid, args, e, aId, aJob.typeArgs)
				}
			});
			break;
		case "subscribe":
			var subs = function() { 
				return function(aCh, aOp, aK, aV) {	
					uuid = parent.__addLog("start", aJob.name, undefined, args, __, aId, aJob.typeArgs)
					args.execid = uuid;
					try {
						_run(aJob.exec, parent.__mergeArgs(args, { ch: aCh, op: aOp, k: aK, v: aV }), aJob, aId);
						parent.__addLog("success", aJob.name, uuid, args, undefined, aId, aJob.typeArgs)
					} catch(e) {
						parent.__addLog("error", aJob.name, uuid, args, e, aId, aJob.typeArgs)
					}

					return true;
				};
			};

			if (isDef(aJob.typeArgs)) {
				if (isDef(aJob.typeArgs.chSubscribe)) {
					$ch(this.__processTypeArg(aJob.typeArgs.chSubscribe)).subscribe(subs());
				}
			}
			break;
		case "periodic":
			var f = function(__uuid, isRetry) {
				uuid = parent.__addLog("start", aJob.name, __, args, __, aId, aJob.typeArgs)
				if (isDef(aJob.typeArgs.cronCheck)) parent.__touchCronCheck(aJob.typeArgs.cronCheck.ch, aJob.name, "start");
				args.execid = uuid;
				try {
					_run(aJob.exec, args, aJob, aId);
					parent.__addLog("success", aJob.name, uuid, args, __, aId, aJob.typeArgs)
					if (isDef(aJob.typeArgs.cronCheck)) parent.__touchCronCheck(aJob.typeArgs.cronCheck.ch, aJob.name, "success");
				} catch(e) {
					parent.__addLog("error", aJob.name, uuid, args, e, aId, aJob.typeArgs)
					if (isDef(aJob.typeArgs.cronCheck)) {
						var rets = parent.__touchCronCheck(aJob.typeArgs.cronCheck.ch, aJob.name, "error", isRetry);
						if (isDef(aJob.typeArgs.cronCheck.retryWait)) {
							if (rets < aJob.typeArgs.cronCheck.retries) {
								sleep(aJob.typeArgs.cronCheck.retryWait, true);
								logWarn("Retrying job in error: '" + aJob.name + "'...");
								f(__uuid, true);
							} else {
								logWarn("Achieved the maximum number of retries for job '" + aJob.name + "'.");
							}
						}
					}
				}

				return true;
			};

			//if (isUnDef(aJob.typeArgs)) aJob.typeArgs = {};
			aJob.typeArgs.timeInterval = this.__processTypeArg(aJob.typeArgs.timeInterval);
			if (isDef(aJob.typeArgs.timeInterval) && aJob.typeArgs.timeInterval > 0) {
				var t = new Threads();
				t.addThread(f);

				if (isDef(parent.__threads[aJob.name]))
					parent.__threads[aJob.name].push(t);
				else
					parent.__threads[aJob.name] = [ t ]; 

				aJob.typeArgs.waitForFinish = this.__processTypeArg(aJob.typeArgs.waitForFinish);
				if (isDef(aJob.typeArgs.waitForFinish) && aJob.typeArgs.waitForFinish)
					t.startWithFixedRate(aJob.typeArgs.timeInterval);
				else
					t.startAtFixedRate(aJob.typeArgs.timeInterval);
			} else {
				if (isDef(aJob.typeArgs.cron)) {
					aJob.typeArgs.cron = this.__processTypeArg(aJob.typeArgs.cron);
					/*if (isUnDef(parent.__sch)) {
						ow.loadServer(); 
						parent.__sch = new ow.server.scheduler();
					}*/

					aJob.typeArgs.cronCheck = this.__processTypeArg(aJob.typeArgs.cronCheck);
					if (isDef(aJob.typeArgs.cronCheck) && isMap(aJob.typeArgs.cronCheck) && (isDef(aJob.typeArgs.cronCheck.active) && aJob.typeArgs.cronCheck.active)) {
						aJob.typeArgs.cronCheck.ch = _$(aJob.typeArgs.cronCheck.ch).isString().default("oJob::cron");
						aJob.typeArgs.cronCheck.retries = _$(aJob.typeArgs.cronCheck.retries).isNumber().default(5);
						aJob.typeArgs.cronCheck.cron = _$(aJob.typeArgs.cronCheck.cron).isString().default(aJob.typeArgs.cron);
						$ch(aJob.typeArgs.cronCheck.ch).create(); // to change
						var item = $ch(aJob.typeArgs.cronCheck.ch).get({ name: aJob.name });
						if (isUnDef(item)) {
							$ch(aJob.typeArgs.cronCheck.ch).set({ name: aJob.name }, {
								name: aJob.name,
								last: 0,
								status: "success",
								retries: 0
							});
							item = $ch(aJob.typeArgs.cronCheck.ch).get({ name: aJob.name });
						}

						var res = ow.format.cron.howManyAgo(aJob.typeArgs.cron, item.last);
						if (res.isDelayed && (item.status != "start" || !aJob.typeArgs.waitForFinish) || item.status == "error") {
							f(__, false);
						}
					}

					if (isUnDef(parent.__schList)) {
						parent.__schList = {};
					}
					if (isDef(parent.__schList[aJob.name])) {
				        if ((parent.__sch.__entries[parent.__schList[aJob.name]].cron != aJob.typeArgs.cron) ||
						    (parent.__sch.__entries[parent.__schList[aJob.name]].exec != aJob.exec)) {
							parent.__schList[aJob.name] = parent.__sch.modifyEntry(parent.__schList[aJob.name], aJob.typeArgs.cron, f, aJob.typeArgs.waitForFinish);
						}
					} else {
						parent.__schList[aJob.name] = parent.__sch.addEntry(aJob.typeArgs.cron, f, aJob.typeArgs.waitForFinish);
					}
				}
			}
			break;
		}
	} else {
		return false;
	}

	return rExec ? resExec : true;
};

OpenWrap.oJob.prototype.__touchCronCheck = function(aCh, aJobName, aStatus, isRetry) {
	var item = $ch(aCh).get({ name: aJobName });
	if (isDef(item)) {
		switch(aStatus) {
		case "success"     : 
			item.last = nowUTC();
			item.retries = 0;
			item.status = "success";
			break;
		case "error"  : 
			item.last = nowUTC();
			item.status = "error";
			if (!isRetry) item.retries = 1;
			break;
		case "start": 
			if (item.status == "error") {
				item.retries++;
			}
			item.status = "start";
		}
		$ch(aCh).set({ name: aJobName }, item);
		return item.retries;
	}
	return -1;
}

/**
 * <odoc>
 * <key>ow.oJob.addJob(aJobsCh, aName, jobDeps, jobType, aJobTypeArgs, jobArgs, jobFunc, jobFrom, jobTo, jobHelp, jobCatch, jobEach, jobLang, jobFile, jobCheck)</key>
 * Provided aJobsCh (a jobs channel) adds a new job with the provided aName, an array of jobDeps (job dependencies),
 * a jobType (e.g. simple, periodic, shutdown), aJobTypeArgs (a map), jobArgs and a jobFunc (a job function). 
 * Optionally you can inherit the job definition from a jobFrom and/or jobTo name ("from" will execute first, "to" will execute after).
 * Also you can include jobHelp.
 * </odoc>
 */
OpenWrap.oJob.prototype.addJob = function(aJobsCh, _aName, _jobDeps, _jobType, _jobTypeArgs, _jobArgs, _jobFunc, _jobFrom, _jobTo, _jobHelp, _jobCatch, _jobEach, _jobLang, _jobFile, _jobCheck) {
	var parent = this;

	function addSigil(aName, aCheck) {		
		_$(aName, "job name").isString().$_()
		aCheck = _$(aCheck, "check for '" + aName + "'").isMap().default({})
		var lstFns = Object.keys(_$())
		
		var argsNames = Object.keys(aCheck)

		var splitCheck = s => {
			var ig = __
			var res = []
			var buf = ""
			var iDot = 0
		  
			for(var i = 0; i < s.length; i++) {
			  if (isUnDef(ig) && (s[i] == '"' || s[i] == "'")) {
				ig = s[i]
			  } else {
				if (s[i] == ig) ig = __
			  }
			  
			  if (s[i] == "(") iDot++
			  if (s[i] == ")") iDot--

			  if (iDot <= 0 && isUnDef(ig) && s[i] == ".") {
				res.push(buf)
				buf = ""
			  } else {
				buf += s[i]
			  }
			}
			if (buf.length > 0) res.push(buf)

			return res
		}

		var code = argsNames.map(a => {
			var hasDefault = false
			var _c = ""
			var conds = splitCheck(aCheck[a])
			conds.forEach(c => {
				if (c.startsWith("default(")) hasDefault = true
				if (c.indexOf("(") < 0 && c[c.length-1] != ")") c += "()"
				var _f = c.substring(0, c.indexOf("("))
				if (lstFns.indexOf(_f) >= 0) {
					_c = _c + "." + c
				}
			})
			if (!hasDefault) _c += ".$_()"
			return "$$(args).set(\"" + a + "\", _$($$(args).get(\"" + a + "\"), \"Job (" + aName + "), args [" + a + "]\")" + _c + ")"
		}).join(";")

		return code.trim()
	}

	function procLock(aExec, aJobTypeArgs) {
		var res = _$(aExec).default("");
		aJobTypeArgs = _$(aJobTypeArgs).default({});
		aJobTypeArgs.lockCh = _$(aJobTypeArgs.lockCh).default("oJob::locks");

		$ch("oJob::locks").create();

		if (isString(aJobTypeArgs.lock)) {
			res = "try { var __locks = new ow.server.locks(true, \"" + aJobTypeArgs.lockCh + "\"); if (__locks.lock(\"" + aJobTypeArgs.lock + "\")) {\n" + res + "\n__locks.unlock(\"" + aJobTypeArgs.lock + "\") } } catch(_lockE) { \n__locks.unlock(\"" + aJobTypeArgs.lock + "\");\nthrow _lockE; }"; 
		}

		return res;
	}

    function procLang(aExec, aJobTypeArgs, aEach, aLang, aFile, aName, aCheck) {
		var res = ""
		var origRes = String(aExec)
		aLang = _$(aLang).default("oaf");

		aJobTypeArgs = _$(aJobTypeArgs).default({});
		if (isDef(aLang)) aJobTypeArgs.lang = aLang;

		if (isDef(aJobTypeArgs.execJs))      {
			aJobTypeArgs.lang = "oaf";
			origRes = io.readFileString(aJobTypeArgs.execJs);
		}
		if (origRes == "" && ["oaf", "javascript", "js"].indexOf(aJobTypeArgs.lang) > -1 && (isDef(aJobTypeArgs.execRequire) || isString(parent.__execRequire))) {
			aJobTypeArgs.execRequire = _$(aJobTypeArgs.execRequire, "execRequire").isString().default(parent.__execRequire);

			// Verify integrity 
			if (Object.keys(OJOB_INTEGRITY).length > 0) {
				Packages.openaf.SimpleLog.log(Packages.openaf.SimpleLog.logtype.DEBUG, "oJob checking integrity of '" + aJobTypeArgs.execRequire + "'", null);

				var ig = ow.oJob.verifyIntegrity(aJobTypeArgs.execRequire);
				if (isDef(ig) && ig == false) {
					if (OJOB_INTEGRITY_WARN) {
						logWarn(_aName + " | INTEGRITY OF '" + aJobTypeArgs.execRequire + "' failed. Please check the source and update the corresponding integrity hash list. Execution will continue.");
					} else {
						throw _aName + " | INTEGRITY OF '" + aJobTypeArgs.execRequire + "' failed. Please check the source and update the corresponding integrity hash list.";
					}
				} else {
					if (OJOB_INTEGRITY_STRICT && ig != true) {
						throw _aName + " | INTEGRITY OF '" + aJobTypeArgs.execRequire + "' failed. Please check the source and update the corresponding integrity hash list.";
					} else {
						if (OJOB_VALIDATION_STRICT && ig == false) {
							throw _aName + " | OJOB VALIDATION OF '" + aFile + "' failed.";
						}
					}
				}
			}
			origRes = "var __r = require('" + aJobTypeArgs.execRequire + "'); if (isDef(__r['" + _aName + "'])) __r['" + _aName + "'](args); else throw \"Code for '" + _aName + "' not found!\";";
		}
		if (isDef(aJobTypeArgs.execPy))      {
			aJobTypeArgs.lang = "python";
			origRes = io.readFileString(aJobTypeArgs.execPy);
		}

		if (isDef(aJobTypeArgs.file)) {
			if (isDef(parent._code[aJobTypeArgs.file])) {
				origRes = parent._code[aJobTypeArgs.file]
			} else {
				if (io.fileExists(aJobTypeArgs.file)) {
					origRes = io.readFileString(aJobTypeArgs.file);
				} else {
					logErr("File '" + aJobTypeArgs.file + " not found!");
					origRes = "";
				}
			}
		}

		if (isDef(aFile)) {
			if ( io.fileExists(aFile) ) {
				origRes = io.readFileString(aFile);
			} else {
				logErr("File '" + aFile + " not found!");
				origRes = "";
			}
		}

		//if (origRes == "") return origRes;

		if (isDef(aJobTypeArgs) && isDef(aJobTypeArgs.lang)) {
			if (aJobTypeArgs.lang == "winssh") {
				aJobTypeArgs.lang = "ssh";
				aJobTypeArgs.shell = _$(aJobTypeArgs.shell, "aJobTypeArgs.shell").isString().default("powershell");
			}
			var m = parent.__langs[aJobTypeArgs.lang]
			if (isDef(aJobTypeArgs.lang) && isUnDef(m) && ["javascript", "oaf", "js"].indexOf(aJobTypeArgs.lang) === -1) throw "Language '" + aJobTypeArgs.lang + "' not supported or defined for job '" + aName + "'."
			if (isDef(m) && isUnDef(aJobTypeArgs.returnRE) && isDef(m.returnRE)) aJobTypeArgs.returnRE = m.returnRE
			if (isDef(m) && isUnDef(aJobTypeArgs.returnFn) && isDef(m.returnFn)) aJobTypeArgs.returnFn = m.returnFn

			if (isDef(aJobTypeArgs.returnRE) || isDef(aJobTypeArgs.returnFn)) {
				// If returnRE and returnFn are defined for this language
				if (isDef(aJobTypeArgs.returnRE) && isDef(aJobTypeArgs.returnFn)) {
					// Find the comment with returnRE
					var _ar = origRes.match(new RegExp(aJobTypeArgs.returnRE))
					if (isArray(_ar) && _ar.length > 1) {
						// Run the returnFN to get the content to replace it
						if (isDef(aJobTypeArgs.returnFn)) {
							var _res = af.eval("_args => { " + aJobTypeArgs.returnFn + " }")(_ar[1])
							origRes = origRes.replace(new RegExp("(" + aJobTypeArgs.returnRE + ")"), "\n"+_res+"\n")
						} else {
							throw "Lang " + aJobTypeArgs.lang + " returnFn not found "
						}
					}
				}
			}
			switch(aJobTypeArgs.lang) {
			case "javascript":
			case "js":
			case "oaf":
				res = res + "\n" + origRes
				break;
			case "python":
				parent.python = true;
				if (!(res.indexOf("/* __oaf_ojob python */") >= 0)) {
					var orig = String(res);
					res = "/* __oaf_ojob python */ $pyStart();" + res + "\n"
					if (aJobTypeArgs.noTemplate) {
						res += orig + ";try { args = merge(args, $py(" + stringify(origRes) + " + \"\\n\", { args: args, id: id }, [\"args\"], true).args);";
					} else {
						res += orig + ";try { args = merge(args, $py(templify(" + stringify(origRes) + ", args) + \"\\n\", { args: args, id: id }, [\"args\"], true).args);";
					}
					res += "} catch(e) { throw e; $pyStop(); };\n";
				}
				break;
			case "ssh":
				if (!(res.indexOf("/* __oaf_ojob ssh */") >= 0)) {
					aJobTypeArgs.shell = _$(aJobTypeArgs.shell, "aJobTypeArgs.shell").isString().default("/bin/sh");
					var orig = String(res);
					res = "/* __oaf_ojob ssh */ var ft = io.createTempFile('ojob_', '.ojob'); io.writeFileString(ft, " + stringify(origRes) + ");\n" + res + "\n"
					if (aJobTypeArgs.noTemplate) {
						res += orig + ";";
					} else {
						res += orig + ";io.writeFileString(ft.replace(/\\\\/g, '/'), templify(io.readFileString(ft.replace(/\\\\/g, '/')), args));\n";
					}
					var prefix = "";
					if (isString(aJobTypeArgs.shellPrefix)) {
						prefix = ".prefix(objOrStr(args, \"" + parent.__processTypeArg(aJobTypeArgs.shellPrefix) + "\"))";
					}
					res += "var __uuid = '.' + genUUID() + '.bat'; _$(args.ssh, 'ssh').isMap().$_(); var __res = $ssh(args.ssh).putFile(ft, __uuid).sh(" + stringify(aJobTypeArgs.shell) + " + ' ' + __uuid)" + prefix + ".exit((r, s)=>s.rm(__uuid)).get(0); io.rm(ft);\n";
					res += "if (!isNull(__res.stdout)) __res.stdout = __res.stdout.replace(/\\\"/g, '\\\\\\\"');"
					res += "if (!isNull(__res.stdout)) if (isMap(jsonParse(__res.stdout, true,__,true))) { args = merge(args, jsonParse(__res.stdout, true,__,true)) } else { if (__res.stdout.length > 0) { printnl(__res.stdout) }; if (__res.stderr.length > 0) { printErrnl(__res.stderr); } }";
					res += "if (__res.exitcode != 0) { throw \"exit: \" + __res.exitcode + \" | \" + __res.stderr; };\n";
				}
				break;
			case "shell":
				if (!(res.indexOf("/* __oaf_ojob shell */") >= 0)) {
					var prefix = "";
					if (isString(aJobTypeArgs.shellPrefix)) {
						prefix = ".prefix(objOrStr(args, \"" + parent.__processTypeArg(aJobTypeArgs.shellPrefix) + "\"))";
					}
					if (ow.format.isWindows() && isUnDef(aJobTypeArgs.shell)) {
						var orig = String(res);
						res = "/* __oaf_ojob shell */ var ft = io.createTempFile('ojob_', '.bat'); io.writeFileString(ft, " + stringify(origRes) + ");\n" + res + "\n"
						if (aJobTypeArgs.noTemplate) {
							res += orig + ";";
						} else {
							res += orig + ";io.writeFileString(ft.replace(/\\\\/g, '/'), templify(io.readFileString(ft.replace(/\\\\/g, '/')), args));\n";
						}
						res += "var __res = $sh().envs(ow.oJob.__toEnvs(args)).sh(ft.replace(/\\\\/g, '/')).sh('del ' + ft)" + prefix + (isString(aJobTypeArgs.pwd) ? ".pwd(\"" + aJobTypeArgs.pwd +"\")" : "") + ".get(0);\n";
						res += "if (!isNull(__res.stdout)) __res.stdout = __res.stdout.replace(/\\\"/g, '\\\\\\\"');"
						res += "if (!isNull(__res.stdout)) if (isMap(jsonParse(__res.stdout, true,__,true))) { args = merge(args, jsonParse(__res.stdout, true,__,true)) } else { if (__res.stdout.length > 0 && " + prefix.length + " == 0) { printnl(__res.stdout) }; if (__res.stderr.length > 0) { printErrnl(__res.stderr); } }";
						res += "if (__res.exitcode != 0) { throw \"exit: \" + __res.exitcode + \" | \" + __res.stderr; };\n";
					} else {
						aJobTypeArgs.shell = _$(aJobTypeArgs.shell, "aJobTypeArgs.shell").isString().default("/bin/sh -s");
						var orig = String(res);
                        res = "/* __oaf_ojob shell */ " + res + "\n"
						if (aJobTypeArgs.noTemplate) {
							res += orig + ";var __res = $sh().envs(ow.oJob.__toEnvs(args)).sh(" + stringify(aJobTypeArgs.shell.split(/ +/), __, "") + ", " + stringify(origRes) + ")" + prefix + (isString(aJobTypeArgs.pwd) ? ".pwd(\"" + aJobTypeArgs.pwd +"\")" : "") + ".get(0);\n";
						} else {
							res += orig + ";var __res = $sh().envs(ow.oJob.__toEnvs(args)).sh(" + stringify(aJobTypeArgs.shell.split(/ +/), __, "") + ", templify(" + stringify(origRes) + ", args))" + prefix + (isString(aJobTypeArgs.pwd) ? ".pwd(\"" + aJobTypeArgs.pwd +"\")" : "") + ".get(0);\n";
						}
						res += "if (!isNull(__res.stdout)) __res.stdout = __res.stdout.replace(/\\\"/g, '\\\\\\\"');"
						res += "if (!isNull(__res.stdout)) if (isMap(jsonParse(__res.stdout, true,__,true))) { args = merge(args, jsonParse(__res.stdout, true,__,true)) } else { if (__res.stdout.length > 0 && " + prefix.length + " == 0) { printnl(__res.stdout) }; if (__res.stderr.length > 0) { printErrnl(__res.stderr); } }";
						res += "if (__res.exitcode != 0) { throw \"exit: \" + __res.exitcode + \" | \" + __res.stderr; };\n";
					}
				}
				break;
			default:
				if (isString(aJobTypeArgs.lang) && isDef(parent.__langs[aJobTypeArgs.lang])) {
					if (isDef(m) && isDef(m.shell)) {
						aJobTypeArgs.shell = m.shell;
					}
					if (isDef(m) && isDef(m.langFn)) {
						aJobTypeArgs.langFn = m.langFn;
					}
					if (isDef(m) && isDef(m.returnFn)) {
						aJobTypeArgs.returnFn = m.returnFn
					}
					if (isDef(m) && isDef(m.returnRE)) {
						aJobTypeArgs.returnRE = m.returnRE
					}
					if (isDef(m) && isString(m.pre)) {
						aJobTypeArgs.pre = m.pre
					}
					if (isDef(m) && isString(m.pos)) {
						aJobTypeArgs.pos = m.pos
					}
					if (isDef(m) && isString(m.withFile) && isUnDef(aJobTypeArgs.langFn)) {
						if (isUnDef(aJobTypeArgs.pre)) aJobTypeArgs.pre = ""
						if (isUnDef(aJobTypeArgs.pos)) aJobTypeArgs.pos = ""
						aJobTypeArgs.langFn = "var tmp = io.createTempFile('ojob_', '" + m.withFile + "');\nio.writeFileString(tmp, $t(" + stringify(aJobTypeArgs.pre) + ",{args:stringify(args,__,''),langArgs:" + stringify(aJobTypeArgs.langArgs,__,'') + "}) + code + " + stringify(aJobTypeArgs.pos) + ", 'UTF-8');var res = $sh().sh('" + aJobTypeArgs.shell + "' + tmp)" + (isString(aJobTypeArgs.pwd) ? ".pwd(\"" + aJobTypeArgs.pwd +"\")" : "") + ".getJson(0);if (res.exitcode != 0) throw res.stderr;args = merge(args, res.stdout);io.rm(tmp);";
						aJobTypeArgs.shell = __;
					}
				}
				if (isString(aJobTypeArgs.lang)) {
					if (isString(aJobTypeArgs.shell)) {
						if (!(res.indexOf("/* __oaf_ojob shell */") >= 0)) {
							aJobTypeArgs.shell = _$(aJobTypeArgs.shell, "aJobTypeArgs.shell").isString().default("/bin/sh -s");
							var orig = String(res);
							var prefix = "";
							if (isString(aJobTypeArgs.shellPrefix)) {
								prefix = ".prefix(objOrStr(args, \"" + parent.__processTypeArg(aJobTypeArgs.shellPrefix) + "\"))";
							}
                            res = "/* __oaf_ojob shell */ " + res + "\n";
							if (isDef(aJobTypeArgs.pre) || isDef(aJobTypeArgs.pos)) {
								if (isUnDef(aJobTypeArgs.pre)) aJobTypeArgs.pre = ""
								if (isUnDef(aJobTypeArgs.pos)) aJobTypeArgs.pos = ""
								if (aJobTypeArgs.noTemplate) {
									res = res + ";var __res = $sh().envs(ow.oJob.__toEnvs(args)).sh(" + stringify(aJobTypeArgs.shell.split(/ +/), __, "") + ", $t(" + stringify(aJobTypeArgs.pre) + ", { args: stringify(args,__,'') }) + " + stringify(origRes) + " + " + stringify(aJobTypeArgs.pos) + ")" + prefix + (isString(aJobTypeArgs.pwd) ? ".pwd(\"" + aJobTypeArgs.pwd +"\")" : "") + ".get(0);\n"
								} else {
									res = res + ";var __res = $sh().envs(ow.oJob.__toEnvs(args)).sh(" + stringify(aJobTypeArgs.shell.split(/ +/), __, "") + ", $t(" + stringify(aJobTypeArgs.pre) + ", { args: stringify(args,__,'') }) + $t(" + stringify(origRes) + ", args) + " + stringify(aJobTypeArgs.pos) + ")" + prefix + (isString(aJobTypeArgs.pwd) ? ".pwd(\"" + aJobTypeArgs.pwd +"\")" : "") + ".get(0);\n"
								}
								
							} else {
								if (aJobTypeArgs.noTemplate) {
									res = res + ";var __res = $sh().envs(ow.oJob.__toEnvs(args)).sh(" + stringify(aJobTypeArgs.shell.split(/ +/), __, "") + ", " + stringify(origRes) + ")" + prefix + (isString(aJobTypeArgs.pwd) ? ".pwd(\"" + aJobTypeArgs.pwd +"\")" : "") + ".get(0);\n";
								} else {
									res = res + ";var __res = $sh().envs(ow.oJob.__toEnvs(args)).sh(" + stringify(aJobTypeArgs.shell.split(/ +/), __, "") + ", templify(" + stringify(origRes) + ", args))" + prefix + (isString(aJobTypeArgs.pwd) ? ".pwd(\"" + aJobTypeArgs.pwd +"\")" : "") + ".get(0);\n";
								}
							}
							res += "if (!isNull(__res.stdout)) if (isMap(jsonParse(__res.stdout, true,__,true))) { args = merge(args, jsonParse(__res.stdout, true,__,true)) } else { if (__res.stdout.length > 0) { printnl(__res.stdout) }; if (__res.stderr.length > 0) { printErrnl(__res.stderr); } }";
							res += "if (__res.exitcode != 0) { throw \"exit: \" + __res.exitcode + \" | \" + __res.stderr; };\n";
						}
					} else if (isDef(aJobTypeArgs.langFn)) {
						if (isString(aJobTypeArgs.langFn)) {
							if (!(res.indexOf("/* __oaf_ojob shellFn */") >= 0)) {
								res = "/* __oaf_ojob shellFn */ \n" + res + "\n var code = " + stringify(origRes) + ";\n" + aJobTypeArgs.langFn;
							}
						}
					} else {
						if (["javascript", "oaf", "js"].indexOf(aJobTypeArgs.lang) === -1) {
							logWarn("Language '" + aJobTypeArgs.lang + "' or shell or langFn not found in job '" + _aName + "'. Reverting to javascript.")
						}
					}
				}
			}
		}

		if (isDef(aEach) && isArray(aEach) && aEach.length > 0) {
			// Process typeArgs.eachThreads
			let _eachThreads = "__"
			if (isDef(aJobTypeArgs) && isDef(aJobTypeArgs.eachThreads)) {
				if (isString(aJobTypeArgs.eachThreads)) {
					var _t = aJobTypeArgs.eachThreads.trim()
					if (_t.endsWith("%")) {
						_t = _t.replace("%", "")
						try {
							_eachThreads = String( Math.max(1, Math.round((Number(_t) * getNumberOfCores()) / 100)) )
						} catch(e) {}
					}
				} else {
					if (isNumber(aJobTypeArgs.eachThreads)) {
						_eachThreads = String( Math.max(1, Math.round(aJobTypeArgs.eachThreads)) )
					}
				}
			}

			//var fnDef = "var args = arguments[0]; var job = arguments[1]; var id = arguments[2]; var deps = arguments[3]; ";
			var fnDef = []
			fnDef.push("var _oji = " + stringify(aEach, __, "") + "; ")
			fnDef.push("var _oj = _oji.map(_r => ow.oJob.getJobsCh().get({ name: _r })); ")
			fnDef.push("$doA2B(each => { " + res + " }, (_r, _n) => { _oj.forEach(_aJob => { ")
			fnDef.push("  var _canDo = true; if(isDef(_n) && _n != _aJob.name) _canDo = false;")
			fnDef.push("  try { if (isDef(_aJob) && _canDo) { var fn = newFn(\"var args = ow.oJob.__defaultArgs(arguments[0]); var job = {name:'" + _aName + "'}; \" + _aJob.exec); ")
			fnDef.push("  return fn( merge(_r, { init: args.init }) ); } else { return __; }")
			fnDef.push("} catch(ea2b) { if (isUnDef(_aJob.catch)) throw ea2b; else (newFn(\"var exception = arguments[0]; args = merge(args, \" + stringify(_r, __, \"\") + \"); \" + _aJob.catch))(ea2b); }")
			fnDef.push("}); }, " + _eachThreads + ", __, " + (isUnDef(_jobCatch) ? "__" : "newFn(\"var args = ow.oJob.__defaultArgs(arguments[1]), job = {name:'" + _aName + "'}, exception = arguments[0]; " + _jobCatch.replace(/\n/g, "\\\n").replace(/"/g, "\\\"") + "\")" ) + "); ")

			res = fnDef.join("")
		}

	    //yprint({ e: aExec, l: aLang, r: res });

		// Process check.in and check.out without from and to
		if (isDef(aCheck) && isMap(aCheck)) {
			var _in = addSigil(aName, aCheck.in)
			var _out = addSigil(aName, aCheck.out)

			if (_in != "") res = _in + "\n" + res
			if (_out != "") res = res + "\n" + _out
		}

		return res
	}

	function procJob(aName, jobDeps, jobType, jobTypeArgs, jobArgs, jobFunc, jobFrom, jobTo, jobHelp, jobCatch, jobEach, jobLang, jobFile, jobCheck) {
		var j = {};
		if (isString(jobDeps)) jobDeps = [ jobDeps ];
		if (isString(jobEach)) jobEach = [ jobEach ];
		jobDeps  = _$(jobDeps).isArray().default([])
		jobType  = _$(jobType).isString().default("simple")
		jobFunc  = _$(jobFunc).default("")
		jobHelp  = _$(jobHelp).default({})
		jobEach  = _$(jobEach).isArray().default([])
		jobCheck = _$(jobCheck).isMap().default({})
		
		var fstr = jobFunc.toString();
		
		if (isDef(jobFrom)) {
			if (!isArray(jobFrom)) jobFrom = [ jobFrom ];
			_$(jobFrom).isArray();

			for(var jfi in jobFrom) {
				var f
				//jobFrom[jfi] = ow.oJob.parseTodo(jobFrom[jfi])
				if (isDef(jobFrom[jfi]) && isMap(jobFrom[jfi])) {
					var _a = aJobsCh.get({ "name": jobFrom[jfi].name })
					var _b = procJob(jobFrom[jfi].name, jobFrom[jfi].deps, jobFrom[jfi].type, jobFrom[jfi].typeArgs, jobFrom[jfi].args, jobFrom[jfi].exec, jobFrom[jfi].from, jobFrom[jfi].to, jobFrom[jfi].help, jobFrom[jfi].catch, jobFrom[jfi].each, jobFrom[jfi].lang, jobFrom[jfi].file, jobFrom[jfi].check)
				    f = isDef(_a) ? merge(_b, _a) : _b
			    } else {
					f = aJobsCh.get({ "name": jobFrom[jfi] })
				}
				if (isDef(f)) {
					//j.type = _$(j.type).isString().default(f.type);
					if (isDef(f.typeArgs)) delete f.typeArgs.noLog
					j.typeArgs = (isDef(j.typeArgs) ? merge(j.typeArgs, f.typeArgs) : f.typeArgs);
					if (isMap(f.args) && Object.keys(f.args).length > 0) j.exec += "\nargs = ow.oJob.__defaultArgs(ow.oJob.__processArgs(args, " + stringify(f.args,__,"") + "))\n"
					j.deps = (isDef(j.deps) && j.deps != null ? j.deps.concat(f.deps) : f.deps);
					j.each = (isDef(j.each) && j.each != null ? j.each.concat(f.each) : f.each);
					//j.lang = f.lang;
					j.exec = (isDef(j.exec) ? j.exec : "") + "\n" + procLock(procLang(f.exec, f.typeArgs, f.each, f.lang, f.file, f.name, f.check), f.typeArgs);
					//j.help = (isDef(j.help) ? j.help : "") + "\n" + f.help;
				} else {
					logWarn("Didn't found from/earlier job '" + jobFrom[jfi] + "' for job '" + aName + "'");
				}
			}
		}
		
		j = {
			"name": aName,
			"type": jobType,
			//"lang": jobLang,
			"file": jobFile,
			"typeArgs": (isDef(j.typeArgs) ? merge(j.typeArgs, jobTypeArgs) : jobTypeArgs),
			"args": (isDef(j.args) ? parent.__processArgs(j.args, jobArgs, __, true) : parent.__processArgs(jobArgs, __, __, true)),
			"deps": (isDef(j.deps) && j.deps != null ? j.deps.concat(jobDeps) : jobDeps),
			//"help": (isDef(j.help) ? j.help : "") + "\n" + jobHelp,
			"help": jobHelp,
			"catch": jobCatch,
			"from": jobFrom,
			"to"  : jobTo,
			"each": (isDef(j.each) && j.each != null ? j.each.concat(jobEach) : jobEach),
			"exec": j.exec
		}
		j.exec = (isDef(j.exec) ? j.exec : "") + "\n" + procLock(procLang(fstr, jobTypeArgs, jobEach, jobLang, jobFile, aName, jobCheck), jobTypeArgs);

		if (isDef(jobTo)) {
			if (!isArray(jobTo)) jobTo = [ jobTo ];
			_$(jobTo).isArray();

			for(var jfi in jobTo) {
				var f
				//jobTo[jfi] = ow.oJob.parseTodo(jobTo[jfi])
				if (isDef(jobTo[jfi]) && isMap(jobTo[jfi])) {
					var _a = aJobsCh.get({ "name": jobTo[jfi].name })
					var _b = procJob(jobTo[jfi].name, jobTo[jfi].deps, jobTo[jfi].type, jobTo[jfi].typeArgs, jobTo[jfi].args, jobTo[jfi].exec, jobTo[jfi].from, jobTo[jfi].to, jobTo[jfi].help, jobTo[jfi].catch, jobTo[jfi].each, jobTo[jfi].lang, jobTo[jfi].file, jobTo[jfi].check)
				    f = isDef(_a) ? merge(_b, _a) : _b
			    } else {
					f = aJobsCh.get({ "name": jobTo[jfi] })
				}
				if (isDef(f)) {
					//j.type = (isDef(f.type) ? f.type : j.type);
					if (isDef(f.typeArgs)) delete f.typeArgs.noLog
					j.typeArgs = (isDef(f.typeArgs) ? merge(j.typeArgs, f.typeArgs) : j.typeArgs);
					//j.lang = f.lang;
					if (isMap(f.args) && Object.keys(f.args).length > 0) j.exec += "\nargs = ow.oJob.__defaultArgs(ow.oJob.__processArgs(args, " + stringify(f.args,__,"") + "))\n"
					j.deps = (isDef(f.deps) && j.deps != null ? j.deps.concat(f.deps) : j.deps);
					j.each = j.each + "\n" + (isDef(f.each) ? f.each : "");
					j.each = (isDef(f.each) && j.each != null ? j.each.concat(f.each) : j.each);
					j.exec = j.exec + "\n" + (isDef(f.exec) ? procLock(procLang(f.exec, f.typeArgs, f.each, f.lang, f.file, f.name, f.check), jobTypeArgs) : "");
					//j.help = j.help + "\n" + (isDef(f.help) ? f.help : "");
				} else {
					logWarn("Didn't found to/then job '" + jobTo[jfi] + "' for job '" + aName + "'");
				}
			}
		}

		// Process check._in and check._out outside from and to
		var _in = addSigil(aName, jobCheck._in)
		var _out = addSigil(aName, jobCheck._out)

		if (_in != "") j.exec = _in + "\n" + j.exec
		if (_out != "") j.exec = j.exec + "\n" + _out

		return j
	}

	aJobsCh.set({
		"name": _aName
	}, procJob(_aName, _jobDeps, _jobType, _jobTypeArgs, _jobArgs, _jobFunc, _jobFrom, _jobTo, _jobHelp, _jobCatch, _jobEach, _jobLang, _jobFile, _jobCheck));
}

/**
 * <odoc>
 * <key>ow.oJob.addTodo(aOJobID, aJobsCh, aTodoCh, aJobName, aJobArgs, aJobType, aJobTypeArgs)</key>
 * Provided aOJobID (a oJob instance), aJobsCh (a jobs channel), aTodoCh (a todo channel), aJobArgs (job arguments).
 * Optionally you can force the aJobType and aJobTypeArgs.
 * </odoc>
 */
OpenWrap.oJob.prototype.addTodo = function(aOJobID, aJobsCh, aTodoCh, aJobName, aJobArgs, aJobType, aJobTypeArgs) {
	var todoId = genUUID();
 
	var job = aJobsCh.get({ "name": aJobName });
	if (isUnDef(job) || job == {}) throw "Job '" + aJobName + "' wasn't found.";

	var jobType = (isUnDef(aJobType)) ? job.type : aJobType;
	//var jobTypeArgs = (isUnDef(aJobType)) ? job.typeArgs : aJobTypeArgs;
	var jobTypeArgs = merge(job.typeArgs, aJobTypeArgs);

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

/**
 * <ojob>
 * <key>ow.oJob.outputParse(aObj) : Object</key>
 * Given aObj, resulting of calling ow.oJob.output with __format=pm or __format=args, will revert back to the original 
 * map, array or object.
 * </ojob>
 */
OpenWrap.oJob.prototype.outputParse = function(aObj) {
	var p = _$(aObj).default(__pm)

	if (isArray(p._list)) return p._list
	if (isMap(p._map))    return p._map
	if (isDef(p.result))  return p.result
	return p
}

OpenWrap.oJob.prototype.addShortcut = function(addShortcut) {
	_$(addShortcut, "addShortcut").isMap().$_()

	if (isUnDef(this.shortcuts)) this.shortcuts = []
	if ($from(this.shortcuts).equals("name", addShortcut.name).none()) {
		this.shortcuts.push(addShortcut)
	} else {
		logWarn("Already existing shortcut '" + addShortcut.name + "' definition. Ignoring.")
	}
}

OpenWrap.oJob.prototype.addShortcuts = function(v) {
	var parent = this

	// Add custom shortcuts
	if (isDef(v.typeArgs) && !isMap(v.typeArgs)) v.typeArgs = {}
	if (isDef(v.typeArgs) && isDef(v.typeArgs.shortcut)) {
		var _s   = v.typeArgs.shortcut
		_s.job   = v.name
		_s.nolog = _$(_s.nolog, "typeArgs.shortcut.nolog").isBoolean().default(false)
		_s.map   = true
		_s.name  = _$(_s.name, "typeArgs.shortcut.name").isString().default(_s.job)
		_s.attrs = _$(_s.args, "typeArgs.shortcut.args").isMap().default({})

		_s.name    = "(" + _s.name.replace(/[\(\)]/g, "")
		var keyArg = _$(_s.keyArg, "typeArgs.shortcut.keyArg").isString().default(__)

		var _sa = {}
		if (isDef(keyArg)) _sa[_s.name] = keyArg
		Object.keys(_s.attrs).forEach(k => {
			_sa["((" + k.replace(/[\(\)]/g, "")] = _s.attrs[k].replace(/[\(\)]/g, "")
		})
		_s.attrs = _sa
		parent.addShortcut(_s)
	}

	return v
}

OpenWrap.oJob.prototype.parseTodo = function(aTodo, _getlist) {  
	var oJobShortcuts = [{
		name : "(if",
		job  : "ojob if",
		map  : true,
		noLog: true,
		attrs: {
			"(if"    : "__condition",
			"((then" : "__then",
			"((else" : "__else",
			"((debug": "__debug"
		}
	}, {
		name : "(parallel",
        job  : "ojob parallel",
		map  : true,
		noLog: true,
		attrs: {
			"(parallel"     : "todo",
			"((isolateArgs" : "isolateArgs",
			"((isolateJob"  : "isolateJob",
			"((templateArgs": "templateArgs",
			"((shareArgs"   : "shareArgs",
			"((debug"       : "__debug"
		}		
	}, {
		name : "(pass",
		job  : "ojob pass",
		map  : true,
		noLog: true,
		attrs: {
			"(pass"         : "__args",
			"((debug"       : "__debug",
			"((templateArgs": "__templateArgs"
		}
	}, {
		name : "(wait",
		job  : "ojob wait",
		map  : true,
		noLog: true,
		attrs: {
			"(wait": "time"
		}
	}, {
		name : "(optionOn",
		job  : "ojob options",
		map  : true,
		noLog: true,
		attrs: {
			"(optionOn"  : "__optionOn",
			"((lowerCase": "__lowerCase",
			"((upperCase": "__upperCase",
			"((todos"    : "__todos",
			"((default"  : "__default",
			"((async"    : "__async"
		}
	}, {
		name : "(fail",
		job  : "ojob exit",
		map  : true,
		noLog: true,
		attrs: {
			"(fail"  : "code",
			"((force": "force"
		}
	}, {
		name : "(fn",
		job  : "ojob function",
		map  : true,
		noLog: true,
		attrs: {
			"(fn"     : "__fn",
			"((key"   : "__key",
			"((path"  : "__path",
			"((fnPath": "__fnPath"
		}
	}, {
		name : "(check",
		job  : "ojob check",
		map  : true,
		noLog: true,
		attrs: {
			"(check"   : "_checks",
			"((actions": "_actions"
		}
	}, {
		name : "(query",
		job  : "ojob query",
		map  : true,
		noLog: true,
		attrs: {
			"(query" : "__query",
			"((type" : "__type",
			"((from" : "__from",
			"((to"   : "__to",
			"((toKey": "__toKey",
			"((key"  : "__key"
		}
	}, {
		name : "(output",
		job  : "ojob output",
		map  : true,
		noLog: true,
		attrs: {
			"(output"   : "__key",
			"((path"    : "__path",
			"((format"  : "__format",
			"((title"   : "__title",
			"((internal": "__internal",
			"((function": "__function"
		}
	}, {
		name : "(repeat",
		job  : "ojob repeat",
		map  : true,
		noLog: true,
		attrs: {
			"(repeat": "__times",
			"((todo" : "__jobs"
		}
	}, {
		name : "(secget",
		job  : "ojob sec get",
		map  : true,
		noLog: true,
		attrs: {
			"(secget"      : "secKey",
			"((secRepo"    : "secRepo",
			"((secBucket"  : "secBucket",
			"((secPass"    : "secPass",
			"((secOut"     : "secOut",
			"((secMainPass": "secMainPass",
			"((secFile"    : "secFile",
			"((secDontAsk" : "secDontAsk",
			"((secIgnore"  : "secIgnore",
			"((secEnv"     : "secEnv"
		}
	}, {
		name : "(each",
		job  : "ojob repeat with each",
		map  : true,
		noLog: true,
		attrs: {
			"(each" : "__path",
			"((key" : "__key",
			"((todo": "__jobs"
		}
	}, {
		name : "(state",
		job  : "ojob set state",
		map  : true,
		noLog: true,
		attrs: {
			"(state": "__state"
		}
	}, {
		name : "(stateOn",
		job  : "ojob state",
		map  : true,
		noLog: true,
		attrs: {
			"(stateOn"     : "stateOn",
			"((lowerCase"  : "lowerCase",
			"((upperCase"  : "upperCase",
			"((validStates": "validStates",
			"((default"    : "default"
		}
	}, {
		name : "(template",
		job  : "ojob template",
		map  : true,
		noLog: false,
		attrs: {
			"(template"     : "template",
			"((templateFile": "templateFile",
			"((data"        : "data",
			"((dataFile"    : "dataFile",
			"((outputFile"  : "outputFile",
			"((key"         : "__key",
			"((tpath"       : "__tpath",
			"((dpath"       : "__dpath",
			"((outPath"     : "__outPath",
			"((out"         : "__out"
		}
	}, {
		name : "(templateFolder",
		job  : "ojob template folder",
		map  : true,
		noLog: false,
		attrs: {
			"(templateFoder": "templateFolder",
			"((templatePath": "__templatePath",
			"((data"        : "data",
			"((dataFile"    : "dataFile",
			"((outputFolder": "outputFolder",
			"((key"         : "__key",
			"((dpath"       : "__dpath",
			"((logJob"      : "logJob",
			"((metaTemplate": "metaTemplate"
		}
	}, {
		name : "(jobdebug",
		job  : "ojob job debug",
		map  : true,
		noLog: true,
		attrs: {
			"(jobdebug"    : "job",
			"((lineColor"  : "lineColor",
			"((textColor"  : "textColor",
			"((theme"      : "theme",
			"((emoticons"  : "emoticons",
			"((signs"      : "signs",
			"((includeTime": "includeTime"
		}
	}, {
		name : "(jobsdebug",
		job  : "ojob job debug",
		map  : true,
		noLog: true,
		attrs: {
			"(jobsdebug"   : "jobs",
			"((lineColor"  : "lineColor",
			"((textColor"  : "textColor",
			"((theme"      : "theme",
			"((emoticons"  : "emoticons",
			"((signs"      : "signs",
			"((includeTime": "includeTime"
		}
	}, {
		name : "(log",
		job  : "ojob log",
		map  : true,
		noLog: true,
		attrs: {
			"(log"     : "msg",
			"((key"    : "__key",
			"((path"   : "__path",
			"((level"  : "level",
			"((options": "options"
		}
	}, {
		name : "(printmd",
		job  : "ojob print md",
		map  : true,
		noLog: true,
		attrs: {
			"(printmd"  : "__text",
			"((outputMD": "__outputMD"
		}
	}, {
		name : "(print",
		job  : "ojob print",
		map  : true,
		noLog: true,
		attrs: {
			"(print"   : "msg",
			"((key"    : "__key",
			"((path"   : "__path",
			"((level"  : "level"
		}
	}, {
		name : "(ch",
		job  : "ojob channel",
		map  : true,
		noLog: false,
		attrs: {
			"(ch"    : "__name",
			"((op"   : "__op",
			"((key"  : "__key",
			"((kpath": "__kpath",
			"((k"    : "key",
			"((ks"   : "keys",
			"((v"    : "value",
			"((vs"   : "values",
			"((vpath": "__vpath",
			"((extra": "extra"
		}
	}, {
		name : "(runfile",
		job  : "ojob run file",
		map  : true,
		noLog: true,
		attrs: {
			"(runfile"      : "__job",
			"((args"        : "__args",
			"((out"         : "__out",
			"((key"         : "__key",
			"((inKey"       : "__inKey",
			"((usePM"       : "__usePM",
			"((inPM"        : "__inPM",
			"((templateArgs": "__templateArgs",
			"((debug"       : "__debug"
		}
	}, {
		name : "(get",
		job  : "ojob get",
		map  : true,
		noLog: true,
		attrs: {
			"(get"  : "__key",
			"((path": "__path"
		}
	}, {
		name : "(set",
		job  : "ojob set",
		map  : true,
		noLog: true,
		attrs: {
			"(set"  : "__key",
			"((path": "__path"
		}
	}, {
		name : "(unset",
		job  : "ojob unset",
		map  : true,
		noLog: true,
		attrs: {
			"(unset"  : "__key"
		}
	}, {
		name : "(fileget",
		job  : "ojob file get",
		map  : true,
		noLog: true,
		attrs: {
			"(fileget"  : "__file",
			"((path"    : "__path",
			"((cache"   : "__cache",
			"((ttl"     : "__ttl",
			"((out"     : "__out",
			"((key"     : "__key"
		}
	}, {
		name : "(todo",
		job  : "ojob todo",
		map  : true,
		noLog: true,
		attrs: {
			"(todo"         : "todo",
			"((isolateArgs" : "isolateArgs",
			"((isolateJob"  : "isolateJob",
			"((templateArgs": "templateArgs",
			"((shareArgs"   : "shareArgs",
			"((debug"       : "__debug"
		}
	}, {
		name : "(findReplace",
		job  : "ojob find/replace",
		map  : true,
		noLog: true,
		attrs: {
			"(findReplace" : "__key",
			"((path"       : "__path",
			"((inputKey"   : "inputKey",
			"((inputPath"  : "inputPath",
			"((inputFile"  : "inputFile",
			"((outputFile" : "outputFile",
			"((useRegExp"  : "useRegExp",
			"((flagsRegExp": "flagsRegExp",
			"((logJob"     : "logJob"
		}
	}, {
		name : "(debug",
		job  : "ojob debug",
		map  : true,
		noLog: false,
		attrs: {}
	}, {
		name : "(run",
		job  : "ojob run file",
		map  : true,
		noLog: true,
		attrs: {
			"(run"          : "__job",
			"((args"        : "__args",
			"((out"         : "__out",
			"((key"         : "__key",
			"((inKey"       : "__inKey",
			"((usePM"       : "__usePM",
			"((inPM"        : "__inPM",
			"((templateArgs": "__templateArgs",
			"((debug"       : "__debug"
		}
	}, {
		name : "(convert",
		job  : "ojob convert",
		map  : true,
		noLog: false,
		attrs: {
			"(convert"  : "__inKey",
			"((inPath"  : "__inPath", 
			"((inFormat": "__inFormat",
			"((outPath" : "__outPath",
			"((outKey"  : "__outKey"
		}
	}, {
		name : "(ask",
		job  : "ojob ask",
		map  : true,
		noLog: true,
		attrs: {
			"(ask"      : "__answers",
			"((question": "__question",
			"((force"   : "__force"
		}
	}, {
		name : "(questions",
		job  : "ojob questions",
		map  : true,
		noLog: true,
		attrs: {
			"(questions" : "__questions"
		}
	}, {
		name : "(oafp",
		job  : "ojob oafp",
		map  : true,
		noLog: true,
		attrs: {
			"(oafp" : "__params"
		}
	}, {
		name : "(llm",
		job  : "ojob llm",
		map  : true,
		noLog: true,
		attrs: {
			"(llm": "__llmPrompt",
			"((context": "__llmContext",
			"((inPath": "__llmInPath",
			"((outPath": "__llmOutPath",
			"((options": "__llmOptions",
			"((inKey": "__llmInKey",
			"((env": "__llmEnv",
			"((debug": "__llmDebug"
		}
	}]

	if (isArray(this.shortcuts)) {
		oJobShortcuts = oJobShortcuts.concat( $from(this.shortcuts).except(oJobShortcuts).select() )
	}

	if (isUnDef(aTodo) && _getlist) return oJobShortcuts
	if (!isMap(aTodo)) return aTodo

	// Get only relevant entries
	var entries = Object.keys(aTodo).filter(r => r.startsWith("("))
	// Allow for closing ) 
	entries = entries.map(entry => {
		if (entry.endsWith(")")) {
			var nentry = entry.replace(/\s*\)+$/, "")
			aTodo[nentry] = aTodo[entry]
			delete aTodo[entry]
			return nentry
		} else {
			return entry
		}
	})
	
	// Aux func to replace a source key with a target args
	var fnA = (s,t) => {
	  if (isDef(aTodo[s])) {
		aTodo.args[t] = aTodo[s]
	  	delete aTodo[s]
	  }
	}
  
	// Ensures that the args entry is a Map for correct processing
	var ensureMapTodo = () => {
	  aTodo.args = _$(aTodo.args).default({})
	  if (!isMap(aTodo.args)) aTodo.args = {}
	}
  
	var processEntry = entry => {
		_$(entry.name, "name").isString().$_()
		_$(entry.job, "job").isString().$_()
		entry.map   = _$(entry.map, "map").isBoolean().default(true)
		entry.attrs = _$(entry.attrs, "attrs").isMap().default({})

		if (entries.indexOf(entry.name) >= 0) {
			aTodo.name = entry.job
			if (entry.map) ensureMapTodo()
			Object.keys(entry.attrs).forEach(atr => {
				fnA(atr, entry.attrs[atr])
			})

			if (isDef(entry.noLog) && entry.noLog) {
				if (isUnDef(aTodo.typeArgs)) aTodo.typeArgs = {}
				aTodo.typeArgs.noLog = true
			}

			return aTodo
		}
	}

	// (success

	for (var entry of oJobShortcuts) {
		var _r = processEntry(entry)
		if (isDef(_r)) return _r
	}

	return aTodo
}

/**
 * <ojob>
 * <key>ow.oJob.output(aObj, args, aFunc) : Map</key>
 * Tries to output aObj in different ways give the args provided. If args.__format or args.__FORMAT is provided it will force 
 * displaying values as "json", "prettyjson", "slon", "ndjson", "xml", "yaml", "table", "stable", "ctable", "tree", "map", "res", "key", "args", "jsmap", "csv", "pm" (on the __pm variable with _list, _map or result) or "human". In "human" it will use the aFunc
 * provided or a default that tries printMap or sprint. If a format isn't provided it defaults to human or global.__format if defined. 
 * </ojob>
 */
OpenWrap.oJob.prototype.output = $output

//ow.oJob = new OpenWrap.oJob();