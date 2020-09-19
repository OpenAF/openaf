var countTests = 0;
var countSuccess = 0;
var countFail = 0;

var isWindows = java.lang.System.getProperty("os.name").match(/Windows/);
ow.loadObj();
ow.loadTest();

// FUNCTIONS
// ---------
var failPlugs = [];
var successPlugs = [];
var testPlugs = [];
var testInitPlugs = [];
var testEndPlugs = [];
var logVarPlugs = [];

function addFailPlug(aFunction) {
	failPlugs.push(aFunction);
}

function addSuccessPlug(aFunction) {
	successPlugs.push(aFunction);
}

function addTestPlug(aFunction) {
	testPlugs.push(aFunction);
}

function addTestEndPlug(aFunction) {
	testEndPlugs.push(aFunction);
}

function addTestInitPlug(aFunction) {
	testInitPlugs.push(aFunction);
}

function addLogVarPlug(aFunction) {
	logVarPlugs.push(aFunction);
}

function execFailPlugs(aMessage, anException) {
	for(i in failPlugs) {
		failPlugs[i](aMessage + ": " + anException);
	}
}

function execSuccessPlugs(aMessage) {
	for(i in successPlugs) {
		successPlugs[i](aMessage);
	}
}

function execTestPlugs(aMessage) {
	for(i in testPlugs) {
		testPlugs[i](aMessage);
	}
}

function execTestInitPlugs() {
	for(i in testInitPlugs) {
		testInitPlugs[i]();
	}
}

function execTestEndPlugs() {
	for(i in testEndPlugs) {
		testEndPlugs[i]();
	}
}

function execLogVarPlugs(aMessage, aVariable) {
	for(i in logVarPlugs) {
		logVarPlugs[i](aMessage, aVariable);
	}
}

function logVar(aMessage, aVariable) {
	execLogVarPlugs(aMessage, aVariable);
}

function testExternally(aMessage, aCommand, aTimeout) {
	execTestPlugs(aMessage);
	try {
		aCommand = aCommand.replace(/\\/g, "/") + " ";
		log("Running " + aCommand);
 		//var res = sh(aCommand, "", aTimeout);
 		var res = ow.test.testExternally(aMessage, aCommand, aTimeout);
		if (__exitcode != 0) throw "exit code " + __exitcode;
		execSuccessPlugs(aMessage);
 		return res;
 	} catch(e) {
 		execFailPlugs(aMessage, e);
 	}
}
//var testExternally = ow.test.testExternally;


function test(aMessage, aFunction) {
	execTestPlugs(aMessage);
	try {
		//var res = aFunction();
		var res = ow.test.test(aMessage, aFunction);
		execSuccessPlugs(aMessage);
		return res;
	} catch(e) {
		execFailPlugs(aMessage, e);
	}
}
//var test = ow.test.test;


// PLUGS
// -----


// Log for dokuwiki

var dokuwikiText = "";
var dokuwikiVars = {};

/*
addTestInitPlug(function() {
	dokuwikiText = "<h2>Tests</h2><table>\n";
});

addSuccessPlug(function(aMessage) {
	dokuwikiText += "<tr><td>PASS</td><td>" + aMessage + "</td></tr>\n";
});

addFailPlug(function(aMessage) {
	dokuwikiText += "<tr><td><b>FAIL</b></td><td>" + aMessage + "</td></tr>\n";
});*/

addLogVarPlug(function(aMessage, aVariable) {
	dokuwikiVars[aMessage] = aVariable;
});

/*
addTestEndPlug(function() {
	var vars = "<h3>Variables</h3><table>\n";
	for(i in dokuwikiVars) {
		vars += "<tr><td>" + i + "</td><td>" + dokuwikiVars[i] + "</td></tr>\n";
	}
	dokuwikiText = vars + "</table>" + dokuwikiText;

	var summary = "<h3>Summary</h3><table>\n";
	summary += "<tr><td>PASS</td><td>" + countSuccess + "</td></tr>\n";
	summary += "<tr><td>FAIL</td><td>" + countFail + "</td></tr>\n";
	summary += "<tr><td><b>TOTAL</b></td><td>" + countTests + "</td></tr>\n";
	dokuwikiText = summary + "</table>" + dokuwikiText + "</table>";

	dokuwikiText = "<h1>Automatic Test for OpenAF functionality - " + new Date() + "</h1>\n" + dokuwikiText;

	io.writeFileString("autoTestAll.txt", dokuwikiText);
});*/

// Log vars
addLogVarPlug(function(aMessage, aVariable) {
	log(aMessage + ": '" + aVariable + "'");
});

// Log success
/*
addSuccessPlug(function(aMessage) {
		log("PASS | " + aMessage);
	}
);*/

// Count success
addSuccessPlug(function(aMessage) {
		countSuccess++;
	}
);

// Log failure
/*
addFailPlug(function(aMessage, anException) {
		logErr("FAIL | " + aMessage + ": " + anException);
		try {
			logErr(anException.javaException.printStackTrace());
		} catch(e) {
		}
	}
);*/

// Count failure
addFailPlug(function(aMessage, anException) {
		countFail++;
	}
);

// Count tests
addTestPlug(function(aMessage) {
	countTests++;
})

// Report summary
addTestEndPlug(function() {
	//sprint($ch("__owTest::tests").getAll());
	countSuccess = ow.test.getCountPass();
	countFail    = ow.test.getCountFail();
	countTests   = ow.test.getCountTest();
	log("Summary " + repeat(35,'-'));
	log("  PASS = #" + countSuccess);
	log("  FAIL = #" + countFail);
	log(" TOTAL = #" + countTests);
});

// Report errors on the end
addTestEndPlug(function() {
	if(countFail > 0) {
		logErr("There are ERRORS!");
		//java.lang.System.exit(-1);
	} else {
		log("All is OK!");
		//java.lang.System.exit(0);
	}
});

// VARIABLES
// ---------

// Obtaining data from the system
var os        = "";
var curDir    = "";
var javaVer   = "";
var javaHome  = "";
var classPath = "";

try {
  os        = java.lang.System.getProperty("os.name") + "";
  curDir    = java.lang.System.getProperty("user.dir") + "";
  javaVer   = java.lang.System.getProperty("java.version") + "";
  javaHome  = java.lang.System.getProperty("java.home") + "";
  classPath = java.lang.System.getProperty("java.class.path") + "";
} catch (e) {
  logErr("Couldn't retrieve system properties: " + e.message);
  java.lang.System.exit(-1);
}


// MAIN
// ----------------
log("Init Automatic Test for OpenAF functionality");
execTestInitPlugs();

 logVar("Running on", os);
 //logVar("Current directory", curDir);
 logVar("Java version", javaVer);
 //logVar("Java home", javaHome);
 //logVar("Classpath", classPath);

// TESTS
// -----------------------------------------------------------------------------

ow.loadFormat();

// TEST CHANNELS
// -------------
test("Channels::Creating a channel", function() {
	startLog();
});

// TEST CALLING OPENAF
// -------------------
var openaf = (isWindows) ? "\"" + javaHome + "\\bin\\java\" -jar \"" + classPath + "\"" : "" + javaHome.replace(/ /g, "\ ") + "/bin/java -jar " + classPath + "";
testExternally("OpenAF run::Run OpenAF", openaf + " -h");

// GET OPENAF VERSION
// ------------------
logVar("Build/Version", test("OpenAF run::Get version", function() { return getVersion() } ));

test("OpenAF run::Help display", function() {
	var help = testExternally("OpenAF run::Help display from OpenAF", openaf + " -h ");
});

// TEST CONSOLE
// ------------
function testOnOpenAFConsole(testName, anArrayOfCommands) {
	var cmd = "";
	var arr = [];
	arr.push("print('===BEGIN==='");
	arr = arr.concat(anArrayOfCommands);
	arr.push("print('===END==='");
	anArrayOfCommands.push("exit(0);");

	for(var i in anArrayOfCommands) {
		if (isWindows)
			cmd += "__processCmdLine('" + anArrayOfCommands[i] + "'); ";
		else
			cmd += "__processCmdLine(\"" + anArrayOfCommands[i] + "\"); ";
	}

	var output = (isWindows) ? testExternally(testName, openaf + " --console -e \"" + cmd + "\"") : testExternally(testName, openaf + " --console -e '" + cmd + "'");
	output = output.replace(/[^===]===BEGIN===([^===]+)===END===/mg, "$1");
	return output;
}

test("OpenAF-Console::Test console simple javascript execution", function() {
	var consoleOut = (isWindows) ? testExternally("OpenAF-Console::Console printing 123", openaf + " --console -e \"__processCmdLine('print(123);'); __processCmdLine('exit(0);');\"") : testExternally("OpenAF-Console::Console printing 123", openaf + " --console -e '__processCmdLine(\"print(123);\");__processCmdLine(\"exit(0);\");'");
	if (!consoleOut.match(/123/)) {
		throw "Console didn't output was different from expected: " + consoleOut;
	}
});

test("OpenAF-Console::Test console command", function() {
	var consoleOut = (isWindows) ? testExternally("OpenAF-Console::Console printing help commands", openaf + " --console -e \"__processCmdLine('help'); __processCmdLine('java.lang.System.exit(0)');\"") : testExternally("OpenAF-Console::Console printing help commands", openaf + " --console -e '__processCmdLine(\"help\");__processCmdLine(\"java.lang.System.exit(0)\");'");
	if (!consoleOut.match(/ADEUS/)) {
		throw "Console didn't output was different from expected: " + consoleOut;
	}
});

// TEST CONVERSIONS
// ----------------
test("Format conversion::Test conversion between formats", function() {
	test("Format conversion::Test from/to bytes", function() {
                var testString = "This is a very nice test \"'?«»+*~^\\|!@#$%&/()=?}][{<>";
		var res = af.fromBytes2String(af.fromString2Bytes(testString));
		if (res != testString) {
			throw "result different: " + res;
		}
	})

	test("Format conversion::Test from/to Base64", function() {
		ow.test.assert(af.fromBytes2String(af.fromBase64(af.toBase64Bytes("OpenAF"))), "OpenAF", "Problem with af.fromBase64 or af.toBase64Bytes");
	})
})

test("IO Plugin::IO Test JSON", function() {
	var a = { "a" : "123€áä" };
	var file = "autoTestAll.test";

	io.writeFile(file, a);
	ow.test.assert(io.readFile(file).a, a.a, "Problem with io.read/writeFile.");
	io.rm(file);
});

test("IO Plugin::IO Test read/writeFileStream", function() {
	var file = "autoTestAll.test";
	var stream = io.writeFileStream(file);
	ioStreamWrite(stream, "Hello ");
	ioStreamWrite(stream, "World! €áä");
	stream.close();

	stream = io.readFileStream(file);
	var res = "";
	ioStreamRead(stream, function(buffer) {
		res += buffer;
	});
	stream.close();

	ow.test.assert(res, "Hello World! €áä", "Problem with read/writeFileStream or ioStreamRead/Write.");
	io.rm(file);
});

test("IO Plugin::IO Test read/writeFileStreamBytes", function() {
	var file = "autoTestAll.test";
	var stream = io.writeFileStream(file);
	ioStreamWriteBytes(stream, af.fromString2Bytes("Hello "));
	ioStreamWriteBytes(stream, af.fromString2Bytes("World! €áä"));
	stream.close();

	stream = io.readFileStream(file);
	var res = "";
	ioStreamReadBytes(stream, function(buffer) {
		res += af.fromBytes2String(buffer);
	});
	stream.close();

	ow.test.assert(res, "Hello World! €áä", "Problem with read/writeFileStream or ioStreamReadBytes/WriteBytes.");
});

test("IO Plugin::IO Test copy streams", function() {
	var s1 = io.readFileStream(getOpenAFJar());
	var h1 = sha1(s1);
	s1.close();
	
	ioStreamCopy(io.writeFileStream("autoTestAll.jar"), io.readFileStream(getOpenAFJar()));
	
	var s2 = io.readFileStream("autoTestAll.jar");
	var h2 = sha1(s2);
	s2.close();
	
	ow.test.assert(h1, h2, "Problem with ioStreamCopy.");
	io.rm("autoTestAll.jar");
});

test("Encoding::Testing encodings", function() {
	ow.test.assert(toEncoding("€", "UTF-8"), utf8("€"), "Problem with utf8 or toEncoding function.");
});

// SHA tests
test("Implicit functions::Test SHA1", function() {
	var test = "This is a nice test";
	if (sha1(test) != "9f1fec3ac96692fd985447639e00a4b19598c0ea") {
		throw("value returned different from expected");
	}
});

test("Implicit functions::Test SHA256", function() {
	var test = "This is a nice test";
	if (sha256(test) != "05692badaa2233bd7b5839940ab75f44fe82470eeaf8f9c24c54f25ead80b09c") {
		throw("value returned different from expected");
	}
});

test("Implicit functions::Test SHA512", function() {
	var test = "This is a nice test";
	if (sha512(test) != "62a8e0e5513e5a32609a5960418119ad682c6d8cde55f190e77df1e12d465dfd7876c487737efce4e3f59e4815a7caa51d1c95c291ac1373b61f283e41a8adbd") {
		throw("value returned different from expected");
	}
});

test("Implicit functions::Merge objects", function() {
	var a = { a: 1, b: 2};
	var b = { b: 3, c: 1};
	
	ow.test.assert(merge(a, b), { a: 1, b: 3, c: 1}, "Didn't merge correctly a and b.");
	ow.test.assert(a, { a: 1, b: 2}, "After a,b merge a changed.");
	ow.test.assert(b, { b: 3, c: 1}, "After a,b merge b changed.");
	
	a = { a: 1, b: 2};
	b = { b: 3, c: 1};
	
	ow.test.assert(merge(b, a), { a: 1, b: 2, c: 1}, "Didn't merge correctly b and a.");
	ow.test.assert(a, { a: 1, b: 2}, "After b,a merge a changed.");
	ow.test.assert(b, { b: 3, c: 1}, "After b,a merge b changed.");
})

// TEST CSV
test("CSV Plugin::Test CSV generation", function() {
	var csvString = "A;B;C\r\n1;a;\"b\"\n2;1;\"2\"";
	var csv = new CSV(csvString);
	if (csv.csv()[0].A != 1 ||
		csv.csv()[0].B != 'a' ||
		csv.csv()[0].C != 'b') throw "Failed CSV generation on constructor!";
	var csvString = "A;B;C\n1;\"a\";\"b\"\n2;\"1\";\"2\"";
	if(csv.w().replace(/\r/g, "") !== csvString) throw "Failed to convert CSV back to string!";

	var csvObj = csv.csv();
	csv.clear();
	csv.toCsv(csvObj);
	if (csv.csv()[0].A != 1 ||
		csv.csv()[0].B != 'a' ||
		csv.csv()[0].C != 'b') throw "Failed CSV generation on toCsv!";
});

// TEST HTTP Client and Server
test("HTTP Plugin::Test HTTP client and server plugins", function() {
	plugin("HTTPServer");

	log("Creating HTTP server on port 12345");
	var httpd = new HTTPd(12345);
	httpd.setDefault("/abc");
	httpd.add("/abc", function(aReq) {
		if(aReq.params.abc != 123) throw "Failed to receive data from client correctly!";

		return httpd.replyOKJSON("ALLOK");
	});

	plugin("HTTP");
	log("Accessing HTTP server with HTTP client");
	var http = new HTTP("http://127.0.0.1:12345?abc=123");
	if (http.getResponse().responseCode != 200 ||
		http.getResponse().response != "ALLOK")
			throw "Failed to receive response from server correctly!";

	httpd.stop();
});

test("HTTP Plugin::Test websockets client", function() {
	plugin("HTTP");
	var session; var output = "";
	var client = (new HTTP()).wsConnect("ws://echo.websocket.org",
		function(aSession) { session = aSession; },
		function(aType, aPayload, aOffset, aLength) { if (aType == "text") output += aPayload; },
		function(aCause) { },
		function(aStatusCode, aReason) { });
	session.getRemote().sendString("Hello World!");
	while(output.length < 1) { sleep(100); };
	client.stop();

	ow.test.assert(output, "Hello World!", "Problem with testing websockets against echo.websocket.org");
})

// TEST JMX Client and Server
test("JMX Plugin::Test JMX client and server plugins", function() {
	plugin("JMXServer");

	log("Creating JMX server on port 12346");
	var jmxServer = new JMXServer("com.openaf:type=Values");
	var BINGO = "OK";
	jmxServer.start(12346);
	jmxServer.addBean({"a": "writable double", "b": "long", "c": "writable string" },
		function(aKey) {
			switch(aKey) {
			case "a": return 12.3;
			case "b": return 123;
			case "c": return BINGO;
			}
		},
		function(aKey, aValue) {
			if (aKey == "c") BINGO = aValue;
		}
	);

	log("Using JMX client to connect to JMX server");
	plugin("JMX");
	var jmx = new JMX("service:jmx:rmi:///jndi/rmi://127.0.0.1:12346/jmxrmi");
	var jmxObj = jmx.getObject("com.openaf:type=Values");
	if (jmxObj.get("a") != 12.3 ||
		jmxObj.get("b") != 123 ||
		jmxObj.get("c") != "OK") throw "Couldn't retrieve the correct values from the JMX server";

	jmxObj.set("a", 12.2);
    jmxObj.set("c", "BINGO")
    if (jmxObj.get("c") != "BINGO") throw "Couldn't set values on the JMX server";

    jmxServer.stop();
});


// TEST Threads
test("Ping Test::Test thread Ping to liferay & normal", function() {
	plugin("Threads");

	var threads = new Threads();
	var common = 0;

	threads.addThread(function() {
		var server = new AF(TESTSERVERLR);
		server.exec("Ping", {"a": 1});
		server.sync(function() {
			common = 1;
		});
		log("Sync test changed.");
		log("Thread Is liferay? " + server.isLifeRay());
		server.close();
	});

	threads.addThread(function() {
		var server = new AF(TESTSERVERAB);
		server.exec("Ping", {"a": 1});
		log("Waiting 5 seconds for sync test");
		sleep(5000);
		if (common != 1)
			throw "Sync test failed!";
		log("Thread Is liferay? " + server.isLifeRay());
		server.close();
	});

	threads.start();

	log("Waiting 10 seconds for threads");
	sleep(10000);
	threads.stop();
});

// TEST ZIP
test("ZIP Plugin::Test ZIP plugin", function() {
	plugin("ZIP");

 	var text = new java.lang.String("Some example test to zip into a zip file");
	var openaf = io.readFileBytes(classPath);
	var zip = new ZIP();
	zip.putFile("test.txt", text.getBytes());
	zip.putFile("openaf.jar", openaf);

	var newZip = zip.generate({"compressionLevel": 9});

	zip = new ZIP(newZip);
	if (typeof zip.list()["openaf.jar"] === 'undefined' ||
		typeof zip.list()["test.txt"]   === 'undefined')
		throw "ZIP file test failed!";
    zip.close();
});

test("ZIP Plugin::Test ZIP stream functions", function() {
	plugin("ZIP");
	
	var zip = new ZIP();
	var h = sha1(io.readFileBytes(getOpenAFJar()));
	zip.streamPutFile("autoTestAll.zip", "o.jar", io.readFileBytes(getOpenAFJar()));
	
	var hc = sha1(zip.streamGetFile("autoTestAll.zip", "o.jar"));
	ow.test.assert(h, hc, "The contents by streamPutFile are different from the original.");
	
	zip.streamRemoveFile("autoTestAll.zip", "o.jar");
	io.rm("autoTestAll.zip");
});

test("Shell commands::Test shell commands", function() {
	//var cP = java.lang.System.getProperty("java.class.path") + "";
	var cP = "1234567890";
	var res = "";
	//var cs, c;

	if (isWindows) {
		//c = cP.replace(/.$/, "\?");
		res = sh("echo " + cP).replace(/[\n\r]/g, "");
	} else {
		//cs = cP.replace(/\\/g, "/");
		//c = cs.replace(/.$/, "\?");
		res = sh("echo " + cP).replace(/\n/g, "");
	}

	if (res != cP)
		throw "Shell result wasn't expected: '" + res + "' expected '" + cP + "'";
});

test("oDoc::Test ODoc functionality", function() {
        log("Online/Offline ODoc");
        var od1 = searchHelp("index")[0];
	var id1 = od1.id;
	setOfflineHelp(true);

        log("Just offline ODoc");
        var od2 = searchHelp("index")[0];
	var id2 = od2.id;

	if (id1 != 'index')
		throw "Online or offline ODoc missing index.";
	if (id2 != 'index')
		throw "Offline ODoc missing index.";
});

test("In memory database::In memory database", function() {
	var db = createDBInMem("test", false);
	var l = [{operation: "hi", version:"1"}, {operation: "bye", version:"1"}];
	db.u("create table test (c1 number(12), c2 varchar2(255))");
        db.usArray("insert into test (c1, c2) values (?, ?)",
                   $from(l).select(function(r) { return [r.version, r.operation]; }));

	var t1 = l.length;
	var t2 = Number(db.q("select count(1) as c from test").results[0].C);
        ow.test.assert(t1, t2, "Something wrong with the in memory database.");

	var f = String((new java.text.SimpleDateFormat("YYYYMMDDHHmmss")).format(new Date())) + ".test";
	db.commit();
	persistDBInMem(db, f);
	db.close();

	db = createDBInMem("test2", false);
	loadDBInMem(db, f);
	io.rm(f);

	var t3 = Number(db.q("select count(1) as c from test").results[0].C);

	if (t1 != t3)
		throw "Something wrong with the in memory database in reloading.";

	db.close();
});

test("Implicit functions::Object compression", function() {
	var obj = { "a": 1, "b": 2, "c": 3 };

	var cobj = compress(obj);
	var uobj = uncompress(cobj);

	if (uobj.a != 1 || uobj.b != 2 || uobj.c != 3)
		throw "Something wrong with compressing and uncompressing objects.";
});

test("Parallel::Parallel processing", function() {
	// Array parallel processing
	//
	var arr = [];
	for(var i = 0; i < 1000; i++) { arr.push(i); }

	var res = parallelArray(arr,
		function(pr,cr,ir,ar) {
			return cr + pr;
		},
		0,
		function(ar) {
			var sum = 0;
			for(var i in ar) {
				sum += ar[i];
			}
			return sum;
		}
	);

	if (res != 499500)
		throw "Something wrong with the parallel processing of an array.";

	// Simple array parallel processing
	//
	arr = [];
	var ctrl;
	var count = 0;
	for(var i = 0; i < 1000; i++) { arr.push(i); }

	res = parallel4Array(arr, function(aValue) {
		ctrl.__threads.sync(function() { count++; });
		return aValue;
	},
	undefined,
	ctrl);

	ow.test.assert(res.length, count, "Problem with parallel4Array.");

	// Parallel processing
	//
	arr = [];
	for(var i = 0; i < 1000; i++) { arr.push(i); }

	res = parallel(
		function(uuid, t)  {
			var sum = 0;
			while(arr.length > 0) {
				var val;
				t.sync(function() { val = arr.pop(); });
				sum += (isDefined(val) ? val : 0);
			}
			log("Thread: " + uuid + "; " + sum);
			return sum;
		}, undefined,
		function(ar) {
			var sum = 0;
			for(var i in ar) {
				sum += ar[i];
			}
			return sum;
		}
	);

	if (res != 499500)
		throw "Something wrong with the parallel processing.";

});

// OpenWrap testing
//

test("oWrap::Load Format", function() {
	ow.loadFormat();
});

test("oWrap Format::Add number separator", function() {
	ow.test.assert(ow.format.addNumberSeparator("1234567890"), "1,234,567,890", "Problem with add number separator");
	ow.test.assert(ow.format.addNumberSeparator("1234567890", "."), "1.234.567.890", "Problem with add number separator with '.'");
});

test("oWrap Format::To abbreviation", function() {
	ow.test.assert(ow.format.toAbbreviation(123456789), "123.46m", "Problem with to abbreviation");
	ow.test.assert(ow.format.toAbbreviation(123456789, 4), "123.4568m", "Problem with to abbreviation with 4 decimal digits");
});

test("oWrap Format::Round number", function() {
	ow.test.assert(ow.format.round(123.456), "123", "Problem with round");
	ow.test.assert(ow.format.round(123.456, 2), "123.46", "Problem with round");
});

test("oWrap Format::Time ago", function() {
	ow.test.assert(ow.format.timeago(new Date()), "Just now", "Problem with time ago");
	ow.test.assert(ow.format.timeago(new Date((new Date()).getFullYear() - 2, 0, 1)), "2 years ago", "Problem with time ago for 2 years");
});

test("oWrap Format::fromDate and toDate", function() {
	ow.test.assert(ow.format.toDate("20141001 15:00 -0000", "yyyyMMdd HH:mm Z").getTime(), 1412175600000, "Problem with toDate");
	ow.test.assert(ow.format.fromDate(new Date(2014, 0, 1), "yyyyMMdd"), "20140101", "Problem with fromDate");
});

test("oWrap Format::escapeString and escapeHTML", function() {
	ow.test.assert(ow.format.escapeString("<json>{ a: 1, b: \"2\", c: [1, 2] }</json>"), "<json>\\{ a: 1, b: \"2\", c: \\[1, 2\\] \\}<\\/json>", "Problem with escapeString");
	ow.test.assert(ow.format.escapeHTML("<json>{ a: 1, b: \"2\", c: [1, 2] }</json>"), "&lt;json&gt;{ a: 1, b: &quot;2&quot;, c: [1, 2] }&lt;/json&gt;", "Problem with escapeHTML");
});

test("oWrap Format::word wrap", function() {
	ow.test.assert(ow.format.string.wordWrap("a long text to serve as an example", 10, "-"), "a long-text to-serve as-an-example", "Problem with word wrap.");
});

test("oWrap Format::leftPad, rightPad", function() {
	ow.test.assert(ow.format.string.leftPad(".", 2, "-") + ow.format.string.rightPad(".", 2, "-"), "-..-", "Problem with left and right padding.");
});

test("oWrap Format::dateDiff", function() {
	ow.test.assert(ow.format.dateDiff.inMonths(ow.format.toDate("201512310000", "yyyyMMddHHmm"), ow.format.toDate("201601010000", "yyyyMMddHHmm")), 1, "Problem with dateDiff.inMonths");
	ow.test.assert(ow.format.dateDiff.inDays(ow.format.toDate("201512310000", "yyyyMMddHHmm"), ow.format.toDate("201601010000", "yyyyMMddHHmm")), 1, "Problem with dateDiff.inDays");
	ow.test.assert(ow.format.dateDiff.inYears(ow.format.toDate("201512310000", "yyyyMMddHHmm"), ow.format.toDate("201601010000", "yyyyMMddHHmm")), 1, "Problem with dateDiff.inYears");
	ow.test.assert(ow.format.dateDiff.inHours(ow.format.toDate("201512310000", "yyyyMMddHHmm"), ow.format.toDate("201601010000", "yyyyMMddHHmm")), 24, "Problem with dateDiff.inHours");
	ow.test.assert(ow.format.dateDiff.inMinutes(ow.format.toDate("201512310000", "yyyyMMddHHmm"), ow.format.toDate("201601010000", "yyyyMMddHHmm")), 1440, "Problem with dateDiff.inMinutes");
	ow.test.assert(ow.format.dateDiff.inSeconds(ow.format.toDate("201512310000", "yyyyMMddHHmm"), ow.format.toDate("201601010000", "yyyyMMddHHmm")), 86400, "Problem with dateDiff.inSeconds");
});

test("oWrap Format::cron", function() {
	ow.test.assert(ow.format.cron.isCronMatch(new Date(), "*/1 */1 * * * *"), true, "Problem with cron using seconds.");
	ow.test.assert(ow.format.cron.isCronMatch(new Date(), "*/1 * * * *"), true, "Problem with cron using minutes.");
});

test("oWrap Format::conversions", function() {
	ow.test.assert(ow.format.fromBinary(ow.format.toBinary(12345)), 12345, "Problem with conversion to binary");
	ow.test.assert(ow.format.fromOctal(ow.format.toOctal(12345)), 12345, "Problem with conversion to octal");
	ow.test.assert(ow.format.fromHex(ow.format.toHex(12345)), 12345, "Problem with conversion to hex");
});

test("oWrap Server/Client REST", function() {
	var hs = ow.loadServer().httpd.start(17878);
	var myData = [];

	ow.loadObj();
	ow.server.httpd.route(hs, {
		"/rest": function(req) { 
			return ow.server.rest.replyData("/rest", req, myData);
		}
	});

	ow.obj.rest.jsonCreate("http://127.0.0.1:17878/rest", {k:1}, { k: 1, v: 123 });
	ow.obj.rest.jsonCreate("http://127.0.0.1:17878/rest", {k:2}, { k: 2, v: 456 });
	ow.obj.rest.jsonCreate("http://127.0.0.1:17878/rest", {k:3}, { k: 3, v: 789 });

	ow.test.assert(myData, [{k:1, v:123},{k:2, v:456},{k:3, v:789}], "Problem with rest record creation (POST).");
	ow.test.assert(ow.obj.rest.jsonGet("http://127.0.0.1:17878/rest", { k: 2 }), {k:2, v:456}, "Problem with rest record get (GET).");

	ow.obj.rest.jsonSet("http://127.0.0.1:17878/rest", { k: 2 }, { k: 2, v: 666});
	ow.test.assert($from(myData).equals("k", 2).first().v, 666, "Problem with rest record set (PUT).");

	ow.obj.rest.jsonRemove("http://127.0.0.1:17878/rest", { k: 2});
	ow.test.assert($from(myData).equals("k", 2).none(), true, "Problem with rest record remove (DELETE).");

	ow.server.httpd.stop(hs);
});

test("oWrap Server HTTPd", function() {
	ow.loadServer();
	var hs1 = ow.server.httpd.start(18081);
	var hs2 = ow.server.httpd.start(18082);

	ow.server.httpd.route(hs1, 
		{ "/normal": function(req) { return hs1.replyOKText("normal 1"); } }, 
		function(req) { return hs1.replyOKText("I am 1"); });
	ow.server.httpd.route(hs2, 
		{ "/normal": function(req) { return hs1.replyOKText("normal 2"); } }, 
		function(req) { return hs1.replyOKText("I am 2"); });

	plugin("HTTP");
	ow.test.assert(
		(new HTTP()).get("http://127.0.0.1:18081").response,
		"I am 1",
		"Problem with server 1 on default response"
	);
	ow.test.assert(
		(new HTTP()).get("http://127.0.0.1:18082").response,
		"I am 2",
		"Problem with server 2 on default response"
	);
	ow.test.assert(
		(new HTTP()).get("http://127.0.0.1:18081/normal").response,
		"normal 1",
		"Problem with server 1 on /normal response"
	);
	ow.test.assert(
		(new HTTP()).get("http://127.0.0.1:18082/normal").response,
		"normal 2",
		"Problem with server 2 on /normal response"
	);

	ow.server.httpd.stop(hs1);
	ow.server.httpd.stop(hs2);
});

test("LSH::LSH hashing", function() {
	ow.loadFormat();

	var s1 = repeat(50, "This is a sample text to test this functionality. ");
	var s2 = repeat(50, "USA means United States of America. ");
	var s3 = repeat(50, "Isto é um texto exemplo para testar esta funcionalidade. ");

	ow.test.assert(ow.format.string.lsHash(s1, s2) > 200, true, "Problem with different sentences on LSH hashing.");
	ow.test.assert(ow.format.string.lsHash(s1, s3) <= 200, true, "Problem with language similar sentences on LSH hashing.");
	ow.test.assert(ow.format.string.lsHash(s1, "my stuff = " + s1, false) <= 200, true, "Problem with almost similar sentences on LSH hashing.");
	ow.test.assert(ow.format.string.lsHash(s1, s1) <= 200, true, "Problem with identical sentences on LSH hashing.");
});

test("Channels::Dumping the contents of a channel", function() {
	var c = dumpLog();
	ow.test.assert(c.length > 0, true, "No contents on the channel.");
	ow.test.assert($ch("__log").getKeys().length == c.length, true, "Keys are not equal to contents.");
	stopLog();
});

// DONE Testing
// -----------------------------------------------------------------------------
log("Done Automatic Test for OpenAF functionality");
io.writeFileString("autoTestAll.xml", ow.test.toJUnitXML(getVersion(), "autoTestAll"));
execTestEndPlugs();
