// OpenWrap v2
// Author: Nuno Aguiar
// Test

OpenWrap.test = function() {
	if (isUnDef(ow.test)) {
		this.reset();
	}
	return ow.test;
}

OpenWrap.test.prototype.getCountTest = function() { return this.__countTest.get() };
OpenWrap.test.prototype.getCountPass = function() { return this.__countPass.get() };
OpenWrap.test.prototype.getCountFail = function() { return this.__countFail.get() };
OpenWrap.test.prototype.getCountAssert = function() { return this.__countAssert.get() }
OpenWrap.test.prototype.getProfileHits = function(aProfileKey) { return this.__profile[aProfileKey].hits.get() };
OpenWrap.test.prototype.getProfileAvg  = function(aProfileKey) { return this.__profile[aProfileKey].sum.get() / this.__profile[aProfileKey].hits.get() };
OpenWrap.test.prototype.getProfileLast = function(aProfileKey) { return this.__profile[aProfileKey].last.get() };
OpenWrap.test.prototype.getProfileMax  = (aProfileKey) => { return this.__profile[aProfileKey].max; };
OpenWrap.test.prototype.getProfileMin  = (aProfileKey) => { return this.__profile[aProfileKey].min; };
OpenWrap.test.prototype.profileReset   = function(aProfileKey) { this.__profile[aProfileKey] = {
		hits: $atomic(), sum: $atomic(), last: $atomic(), start: $atomic()
}};
OpenWrap.test.prototype.getProfile = function() { 
	var _r = {} 
	var parent = this.__profile
	Object.keys(parent).forEach(k => {
		_r[k] = {}
		_r[k].hits = parent[k].hits.get()
		_r[k].sum = parent[k].sum.get()
		_r[k].last = parent[k].last.get()
		_r[k].start = parent[k].start
		_r[k].max = parent[k].max
		_r[k].min = parent[k].min
	})
	return _r
}
OpenWrap.test.prototype.getAllProfileHits = function() { var r = {}; for(var i in this.__profile) { r[i] = ow.test.getProfileHits(i)}; return r; };
OpenWrap.test.prototype.getAllProfileAvg  = function() { var r = {}; for(var i in this.__profile) { r[i] = ow.test.getProfileAvg(i)}; return r; };
OpenWrap.test.prototype.getAllProfileLast = function() { var r = {}; for(var i in this.__profile) { r[i] = ow.test.getProfileLast(i)}; return r; };
/**
 * <odoc>
 * <key>ow.test.setShowStackTrace(aBooleanSetting)</key>
 * Turns on (off by default) the display of java stack trace on java exceptions if aBooleanSetting = true.
 * </odoc>
 */
OpenWrap.test.prototype.setShowStackTrace = function(aValue) { this.__showStackTrace = aValue }
/**
 * <odoc>
 * <key>ow.test.setKeepStackTrace(aBooleanSetting)</key>
 * Turns on (off by default) on keeping the java stack trace on java exceptions if aBooleanSetting = true.
 * </odoc>
 */
OpenWrap.test.prototype.setKeepStackTrace = function(aValue) { this.__keepStackTrace = aValue }
/**
 * <odoc>
 * <key>ow.test.setMemoryProfile(aBooleanSetting)</key>
 * Turns on (off by default) the gathering of memory differences if aBooleanSetting = true.
 * </odoc>
 */
OpenWrap.test.prototype.setMemoryProfile  = function(aValue) { this.__memoryprofile  = aValue; };
/**
 * <odoc>
 * <key>ow.test.setOutput(aBooleanSetting)</key>
 * Turns off (on by default) the output of the result of each test.
 * </odoc>
 */
OpenWrap.test.prototype.setOutput         = function(aValue) { this.__showOutput = aValue; };

/**
 * <odoc>
 * <key>ow.test.reset()</key>
 * Resets the internal test counters (test, pass and fail).\
 * (available after ow.loadTest())
 * </odoc>
 */
OpenWrap.test.prototype.reset = function() {
	this.getChannel().destroy()
	this.getChannel().create()
	this.__countTest = $atomic()
	this.__countPass = $atomic()
	this.__countFail = $atomic()
	this.__countAssert = $atomic()
	this.__profile = {}
	this.__showStackTrace = true
	this.__memoryprofile  = false
	this.__showOutput     = true
	this.__keepStackTrace = false
}

/**
 * <odoc>
 * <key>ow.test.assert(aResult, checkValue, errorMessage, notShowDiff)</key>
 * Will throw an exception if aResult is different from checkValue. The exception
 * will contain the errorMessage and the different values (if notShowDiff = true).\
 * (available after ow.loadTest())
 * </odoc>
 */
OpenWrap.test.prototype.assert = function(aResult, checkValue, errorMessage, notShowDiff) {
	this.__countAssert.inc()
	if (!compare(aResult, checkValue)) {
		throw errorMessage + ((notShowDiff) ? "" : " (got " + stringify(aResult) + " but expected " + stringify(checkValue, undefined, "") + ")");
	}
}

/**
 * <odoc>
 * <key>ow.test.start(aKey) : String</key>
 * Starts a timer for the provided aKey to determined the elapsed time when ow.test.stop(aKey) is invoked.
 * Returns the aKey provided.
 * </odoc>
 */
OpenWrap.test.prototype.start = function(aKey) {
	if (isUnDef(this.__profile[aKey])) {
		this.__profile[aKey] = {
			hits: $atomic(),
			sum: $atomic(),
			last: $atomic(),
			start: $atomic()
		}
	}
	
	this.__profile[aKey].start = now();
	if (this.__memoryprofile) {
		java.lang.Runtime.getRuntime().gc();
		this.__profile[aKey].startTotalMem = Number(java.lang.Runtime.getRuntime().totalMemory());
		this.__profile[aKey].startFreeMem = Number(java.lang.Runtime.getRuntime().freeMemory());
	}
	return aKey;
}

/**
 * <odoc>
 * <key>ow.test.stop(aKey) : Number</key>
 * Stops an existing timer for the provided aKey to determine the elapsed time since a ow.test.start(aKey) was invoked.
 * </odoc>
 */
OpenWrap.test.prototype.stop = function(aKey) {
	var elapsed = now() - this.__profile[aKey].start;
	
	if (this.__memoryprofile) {
		java.lang.Runtime.getRuntime().gc();
		this.__profile[aKey].stopTotalMem = Number(java.lang.Runtime.getRuntime().totalMemory());
		this.__profile[aKey].stopFreeMem = Number(java.lang.Runtime.getRuntime().freeMemory());
	}
	
	this.__profile[aKey].last.getSet(elapsed)
	this.__profile[aKey].hits.inc()
	this.__profile[aKey].sum.getSet(this.__profile[aKey].sum.get() + elapsed)
	if (isUnDef(this.__profile[aKey].max) ||  elapsed > this.__profile[aKey].max)
		this.__profile[aKey].max = elapsed;
	if (isUnDef(this.__profile[aKey].min) ||  elapsed < this.__profile[aKey].min)
		this.__profile[aKey].min = elapsed;
	return elapsed;
}

/**
 * <odoc>
 * <key>ow.test.testExternally(aTest, aCommand, aTimeout) : Object</key>
 * Test executing aCommand for a give aTimeout (if provided) for a test named aTest. If aTest is divided
 * with "::" the first part will be consider to be a test suite name. Will return whatever the command returns.\
 * (available after ow.loadTest())
 * </odoc>
 */
OpenWrap.test.prototype.testExternally = function(aMessage, aCommand, aTimeout) {
	var info = this.getChannel().get(aMessage);
	if (isUnDef(info)) info = {
		"test" : aMessage.replace(/.+::/, ""),
		"suite": (aMessage.indexOf("::") > 0) ? aMessage.replace(/::.+/, "") : "Test suite", 
		"hits": $atomic(),
		"pass": $atomic(),
		"fail": $atomic(),
		"executions": []
	};
	
	if (this.__showOutput) log("TEST | " + aMessage);
	this.__countTest.inc()
	
	var execInfo = {};
	this.start(aMessage);
	
	if (this.__memoryprofile) {
		execInfo.startTotalMem = this.__profile[aMessage].startTotalMem;
		execInfo.startFreeMem  = this.__profile[aMessage].startFreeMem;
	};
	
	execInfo.start = this.__profile[aMessage].start;
	
	try {
		info.hits.inc()
		
		if (this.__showOutput) log("Running " + aCommand);
 		var res = sh(aCommand, "", aTimeout);
 		
		execInfo.elapsedTime = this.stop(aMessage);
		if (this.__memoryprofile) {
			execInfo.stopFreeMem  = this.__profile[aMessage].stopFreeMem;
			execInfo.stopTotalMem = this.__profile[aMessage].stopTotalMem;
			execInfo.diffMem = (execInfo.stopTotalMem - execInfo.stopFreeMem) - (execInfo.startTotalMem - execInfo.startFreeMem); 
		}
		info.exitCode = __exitcode;
		
		if (__exitcode != 0) throw "exit code " + __exitcode;
		if (this.__showOutput) log("PASS | " + aMessage);
		this.__countPass.inc()
		execInfo.status = "PASS";
		info.pass.inc()
		
		info.executions.push(execInfo);
		this.getChannel().set(aMessage, info);
		
 		return res;
 	} catch(e) {
 		execInfo.elapsedTime = this.stop(aMessage);
		if (this.__memoryprofile) {
			execInfo.stopFreeMem  = this.__profile[aMessage].stopFreeMem;
			execInfo.stopTotalMem = this.__profile[aMessage].stopTotalMem;
			execInfo.diffMem = Math.abs((execInfo.stopTotalMem - execInfo.stopFreeMem) - (execInfo.startTotalMem - execInfo.startFreeMem)); 
		}
		if (this.__showOutput) logErr("FAIL | " + aMessage);
		execInfo.status = "FAIL";
		execInfo.exception = String(e);
		info.fail.inc()
		
 		this.__countFail.inc()
 		
		info.executions.push(execInfo);
		this.getChannel().set(aMessage, info);
 	}
}

/**
 * <odoc>
 * <key>ow.test.test(aTest, aFunction) : Object</key>
 * Test aFunction for a test named aTest.  If aTest is divided
 * with "::" the first part sill be consider to be a test suite name. Will return whatever the function returns.\
 * (available after ow.loadTest())
 * </odoc>
 */
OpenWrap.test.prototype.test = function(aMessage, aFunction) {
	var info = this.getChannel().get(aMessage);
	if (isUnDef(info)) info = {
		"test" : aMessage.replace(/.+::/, ""),
		"suite": (aMessage.indexOf("::") > 0) ? aMessage.replace(/::.+/, "") : "Test suite", 
		"hits" : $atomic(),
		"pass" : $atomic(),
		"fail" : $atomic(),
		"start": now(),
		"executions": []
	};
	
	if (this.__showOutput) log(aMessage + " | TEST");
	this.__countTest.inc()
	
	var execInfo = {};
	this.start(aMessage);

	if (this.__memoryprofile) {
		execInfo.startTotalMem = this.__profile[aMessage].startTotalMem;
		execInfo.startFreeMem  = this.__profile[aMessage].startFreeMem;
	};
	
	execInfo.start = this.__profile[aMessage].start;
	
	var setResult = result => {
		if (isMap(result) || isArray(result)) result = af.toSLON(result)
		execInfo.result = result
		log(aMessage + " | " + result)
	}

	try {
		info.hits.inc()
		var res = aFunction(setResult);
		
		execInfo.elapsedTime = this.stop(aMessage);
		if (this.__memoryprofile) {
			execInfo.stopFreeMem  = this.__profile[aMessage].stopFreeMem;
			execInfo.stopTotalMem = this.__profile[aMessage].stopTotalMem;
			execInfo.diffMem = (execInfo.stopTotalMem - execInfo.stopFreeMem) - (execInfo.startTotalMem - execInfo.startFreeMem);
		}
		execInfo.status = "PASS";
		info.pass.inc()
		
		if (this.__showOutput) log(aMessage + " | PASS");
		this.__countPass.inc()
		
		info.executions.push(execInfo);
		this.getChannel().set(aMessage, info);
		
		return res;
	} catch(e) {
		execInfo.elapsedTime = this.stop(aMessage);
		if (this.__memoryprofile) {
			execInfo.stopFreeMem  = this.__profile[aMessage].stopFreeMem;
			execInfo.stopTotalMem = this.__profile[aMessage].stopTotalMem;
			execInfo.diffMem = (execInfo.stopTotalMem - execInfo.stopFreeMem) - (execInfo.startTotalMem - execInfo.startFreeMem); 
		}
		if (this.__showOutput) log(aMessage + " | FAIL | " + e);
		execInfo.status = "FAIL";
		execInfo.exception = String(e);
		info.fail.inc()
		this.__countFail.inc()
		
		try {
			if (this.__showStackTrace) e.javaException.printStackTrace()
		} catch(e1) { }
		try {
			if (this.__keepStackTrace) execInfo.stackTrace = getJavaStackTrace(e)
		} catch(e1) { }
		
		info.executions.push(execInfo);
		this.getChannel().set(aMessage, info);
	}
}

/**
 * <odoc>
 * <key>ow.test.getChannel() : Channel</key>
 * Gets the current channel being used for test results.
 * </odoc>
 */
OpenWrap.test.prototype.getChannel = function() {
	return $ch("__owTest::tests")
}
/**
 * <odoc>
 * <key>ow.test.getExecHistory() : Array</key>
 * Gets the test results execution history.
 * </odoc>
 */
OpenWrap.test.prototype.getExecHistory = function() {
	return this.getChannel().getAll().map(r => {
		r.hits = r.hits.get()
		r.pass = r.pass.get()
		r.fail = r.fail.get()
		return r
	})
}

OpenWrap.test.prototype.toMarkdown = function() {
	var md = "# Test results\n\n";

	md += "## Summary\n\n";

	md += "* Number of tests performed: " + this.__countTest.get() + "\n";
	md += "* Number of tests passed: " + this.__countPass.get() + "\n";
	md += "* Number of tests failed: " + this.__countFail.get() + "\n";

    md += "## Result details\n\n";

	md += "| Suite | Test | Status | Time | Result       |\n";
	md += "|-------|------|--------|------|--------------|\n";

	var data = [];
	this.getChannel().forEach((k, v) => {
		if (v != null)
			for(let i in v.executions) {
				data.push({
					suite    : v.suite,
					test     : v.test,
					status   : v.executions[i].status,
					time     : v.executions[i].elapsedTime,
					exception: v.executions[i].exception,
					result   : v.executions[i].result
				});
			}
	});

	$from(data).sort("suite", "test").select(d => {
		md += "|" + d.suite;
		md += " | " + d.test;
		md += " | <span style=\"background-color: " + (d.status == "PASS" ? "green" : "red") + "; color: white\">&nbsp;&nbsp;" + d.status + "&nbsp;&nbsp;</span>";
		md += " | " + ow.loadFormat().elapsedTime4ms(d.time);
		md += " | " + (isDef(d.exception) ? d.exception.replace(/\n/mg, " ") : (isDef(d.result) ? d.result : "n/a"));
		md += " |\n"; 
	});

	return md;
}

/**
 * <odoc>
 * <key>ow.test.toJUnitXML(testSuitesId, testSuitesName) : String</key>
 * Returns a JUnit results XML using testSuitesId and testSuitesName as identifiers.
 * </odoc>
 */
OpenWrap.test.prototype.toJUnitXML = function(testSuitesId, testSuitesName) {
	// Init
	var xmlInfo = {
		"id"  : testSuitesId,
		"name": testSuitesName,
		"tests"   : 0,
		"fails"   : 0,
		"time"    : 0,
		"testSuites": []
	};

	// Assigning values from channel
	this.getChannel().forEach(function(k, v) {
		var testSuite = {
			"id"        : (isDef(v.suite)) ? v.suite : v.test,
			"name"      : (isDef(v.suite)) ? v.suite : v.test,
			"tests"     : v.hits.get(),
			"pass"      : v.pass.get(),
			"fail"      : v.fail.get(),
			"start"     : $from(v.executions).min("start").start,
			"time"      : $from(v.executions).sum("elapsedTime"),
			"testSuite" : v.executions.map(function(ex) {
				if (ex.status == 'FAIL') {
					xmlInfo.fails++;
				}

				xmlInfo.time += ex.elapsedTime;

				return {
					"id"         : ex.start,
					"start"      : ex.start,
					"name"       : v.test,
					"time"       : ex.elapsedTime,
					"failMessage": ex.exception,
					"failed"     : (isDef(ex.exception))
				}
			})
		};
		
		var previous = $from(xmlInfo.testSuites).equals("name", (isDef(v.suite)) ? v.suite : v.test).at(0);
		
		if (isUnDef(previous)) {
			xmlInfo.tests++;
			xmlInfo.testSuites.push(testSuite);
		} else {
			previous.tests += testSuite.tests;
			previous.pass  += testSuite.pass;
			previous.fail  += testSuite.fail;
			previous.time  += testSuite.time;
			previous.testSuite = previous.testSuite.concat(testSuite.testSuite);
		}
	});
	xmlInfo.start = $from(xmlInfo.testSuites).min("start").start;

	plugin("XML");
	var xml = new XML();
	var xmlPart = xml.x("testsuites").a("id", xmlInfo.id).a("name", xmlInfo.name).a("tests", xmlInfo.tests).a("failures", xmlInfo.fails).a("time", xmlInfo.time / 1000);
	for(var i in xmlInfo.testSuites) {
		var testSuite = xmlInfo.testSuites[i];
		xmlPart = xmlPart.e("testsuite").a("id", testSuite.id).a("name", testSuite.name).a("tests", testSuite.testSuite.length).a("failures", testSuite.fail).a("time", testSuite.time / 1000).a("timestamp", new Date(testSuite.start).toISOString());
		for(var j in testSuite.testSuite) {
			var testExec = testSuite.testSuite[j];
			xmlPart = xmlPart.e("testcase").a("id", testExec.id).a("name", testExec.name).a("time", testExec.time / 1000);
			if (testExec.failed) {
				xmlPart = xmlPart.e("failure").a("message", testExec.failMessage).a("type", "ERROR").t(testExec.failMessage).up();
			}
			xmlPart= xmlPart.up();
		}
		xmlPart = xmlPart.up();
	}

	return xml.w();
}