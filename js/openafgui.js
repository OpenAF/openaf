log("Starting OpenAF GUI");

ow.loadServer();
ow.loadTemplate();

var installed = false;
var needupdate = false;
var updateversion = "";
var keepRunning = true;

ow.server.checkIn(java.lang.System.getProperty("user.home") + "/.openaf.pid", function(aPid) {
	log("Killing previous " + ow.server.getPid(aPid));
	pidKill(ow.server.getPid(aPid), true);
	return true;
}, 
function() {
	log("OpenAF GUI shutdown");
});

function verifyIfInstalled() {
	var winScript = false;
	var unixScript = false;
	
	try {
	   io.readFileString(getOpenAFPath() + "/openaf");
	   unixScript = true;
	} catch(e) {
	   unixScript = false;
	}
	
	try {
	   io.readFileString(getOpenAFPath() + "/openaf.bat");
	   winScript = true;
	} catch(e) {
	   winScript = false;
	}
	
	installed = winScript || unixScript;
	
	return winScript || unixScript;
}

function checkRemoteVersions() {
	if (noHomeComms) return;
	
	log("Checking for new versions remotely...");
	var current = checkLatestVersion();
	var myversion = getVersion();
	if (current != -1) {
		if (current > myversion) {
			updateversion = current;
			needupdate = true;
			log("New version " + current + " (running version is " + myversion);
		}
	}	
}

// Load templates

var port = findRandomOpenPort();
var httpServer = ow.server.httpd.start(port, "127.0.0.1", undefined, undefined, function(aType, aMsg, anException) {
   if(aType.toString() != "DEBUG" && anException.getMessage() != "Broken pipe")
	      logErr("Type: " + aType + " | Message: " + aMsg + anException.printStackTrace());
});
httpServer.add("/wait", function(req) { return httpServer.replyOKHTML("<html><meta http-equiv=\"refresh\" content=\"1; url=\"/><body>Loading...</body></html>")});
httpServer.setDefault("/wait");

plugin("Threads");
var initThread = new Threads();
initThread.addThread(function(uuid) {
	checkRemoteVersions();
	initThread.stop();
});
initThread.startNoWait();

java.awt.Desktop.getDesktop().browse(new java.net.URI("http://127.0.0.1:" + port));


var templates = ow.template.loadHBSs({
    "index" : getOpenAFJar() + "::hbs/index.hbs",
    "opacks": getOpenAFJar() + "::hbs/opacks.hbs",
    "odoc"  : getOpenAFJar() + "::hbs/odoc.hbs"
});

var defaultPage = {
    "title": "OpenAF",
    "logo" : {
        "text": "OpenAF",
        "link": "/"
    },
    "served": {
        "text": "OpenAF (version " + getVersion() + ")",
        "link": "https://openaf.io"
    },
    "navbar": [
        { "text": "openaf-Console", "link": "/exec/openaf-console" },
        { "text": "Documentation",  "link": "/odoc"  },
        { "text": "oPacks",         "link": "/opack" }
    ],
    "contents": "" +
       "<p class=\"thin\">" +
       "Welcome to OpenAF.<br><br>" +
       (verifyIfInstalled() ? 
          "(version " + getVersion() + " installed in " + getOpenAFPath() + ")<br>" +
          ((needupdate) ?
             "<br>There is a new version " + updateversion + ". Do you wish to update this version? &nbsp;&nbsp;<p class=\"regular\"><a class=\"waves-effect waves-light orange regular btn\" href=\"/exec/update\"><i class=\"material-icons left\">play_for_work</i>Update</a>"
          : "")
        :
          "Do you want to install OpenAF? &nbsp;&nbsp;<p class=\"regular\"><a class=\"waves-effect waves-light orange regular btn\" href=\"/exec/install\"><i class=\"material-icons left\">play_for_work</i>Install</a></p><span class=\"thin\">(install will create scripts in " + getOpenAFPath() + " to make it easier to use OpenAF).</span>"
        ) +
       "</p>" + "<p/><hr/>" +
       "<div class=\"thin flow-text\" style=\"font-family: monospace; font-size: 8pt\">" + String(Packages.openaf.AFCmdOS.argHelp).replace(/\n/g, "<br>").replace(/ /g, "&nbsp;") + "</div>"
};



var paths = Object.keys(getOPackLocalDB());
searchHelp("");
for(var i in paths) {
	try {
		searchHelp("", paths[i]);
	} catch(e) {
		logWarn("Problem with oDoc for " + paths[i] + ": "+ String(e));
	}
}

ow.server.httpd.route(httpServer, ow.server.httpd.mapRoutesWithLibs(httpServer, {
	"/exec": function(req) {
		var jvm = String(new java.io.File(java.lang.System.getProperty("java.home")).getAbsolutePath()) + "/bin/java";
		jvm = jvm.replace(/\\/g, "/");
		
		switch(req.uri) {
		case "/exec/openaf-console": 
			try {
				if (java.lang.System.getProperty("os.name").toLowerCase().indexOf("mac") >= 0) {
					sh("echo \"" + jvm + " -jar " + getOpenAFJar() + " --console\" > ~/.openafconsole");
					sh("chmod u+x ~/.openafconsole");
					sh("open -n ~/.openafconsole", "", -1);
					sleep(500);
					//sh("rm ~/.openafconsole");
				}
				if (java.lang.System.getProperty("os.name").toLowerCase().indexOf("win") >= 0) {
					if (installed) 
						af.sh(["cmd", "/c", "start", getOpenAFPath() + "/openaf-console-ps.bat"], "", -1);
					else
						af.sh(["cmd", "/c", "start", jvm, "-jar", getOpenAFJar(), "--console"], "", -1);
				}
			}catch(e) { logErr(e); }
			break;
		case "/exec/install":
			try {
				sh("\"" + jvm + "\" -jar " + getOpenAFJar() + " --install", undefined, undefined, true);
				restartOpenAF();
				exit(0);
			}catch(e) { logErr(e); }
			break;
		case "/exec/update":
			try {
				sh("\"" + jvm + "\" -jar " + getOpenAFJar() + " --update", undefined, undefined, true);
				restartOpenAF();
				exit(0);
			}catch(e) { logErr(e); }
			break;	
        case "/exec/quit":
		 	keepRunning = false;
		 	return httpServer.replyOKText("");
			break;
		}
		
		return ow.server.httpd.replyRedirect(httpServer, "/");
	},
	"/exec/opack/": function(req) {		
		try {
		switch(req.uri) {
		case "/exec/opack/install":
			if (isDefined(req.params.opack)) {
				log("Installing oPack " + req.params.opack);
				__expr = "install " + req.params.opack;
				load(getOpenAFJar() + "::js/opack.js");
				log("oPack " + req.params.opack + " installed.");
			}
			break;
		case "/exec/opack/update":
			if (isDefined(req.params.opack)) {
				log("Updating oPack " + req.params.opack);
				__expr = "update " + req.params.opack;
				load(getOpenAFJar() + "::js/opack.js");
				log("oPack " + req.params.opack + " updated.");
			}
			break;
		}
		}catch(e) {logErr(e);}
		return ow.server.httpd.replyRedirect(httpServer, "/opack");
		
	},
    "/odoc": function(req) {
        try {
            var odoc = clone(defaultPage);
            var terms = [];
            var id = req.uri.replace(/^\/odoc\/*/g, "");

            if (Object.keys(__odocs.aodocskeys).indexOf(id) > 0) {
                terms = terms.concat($stream(searchHelp("", undefined, id).map(function(r) { return r.key; })).toArray());
                terms = terms.sort();
            } else {
                terms = terms.concat($stream(searchHelp(id, undefined).map(function(r) { return r.key; })).toArray());
                terms = terms.sort();
            }

            if (terms.length == 1) {
                odoc.contents = templates("odoc", { "id": id, "list": false, "terms": terms, "res": searchHelp(id)[0] });
            } else {
                odoc.contents = templates("odoc", { "id": id, "list": true, "terms": terms });
            }
            return httpServer.replyOKHTML(templates("index", odoc));
        }catch(e) {logErr(e)}
    },
    "/odocKey": function(req) {
        try {
        	var res = searchHelp(req.params.q)[0];
        	if (isDefined(res.text)) res.text = res.text.replace(/  /g, " &nbsp;");
            return httpServer.replyOKJSON(stringify(res));
        } catch(e) { logErr(e)}
    },
    "/opack": function(req) {
        try {
        var opacks = clone(defaultPage);
        var local = getOPackLocalDB();
        var remote = getOPackRemoteDB();
        opacks.contents = templates("opacks",
            {
                "installed": $stream(Object.keys(local))
                             .map(function(r) { return {
                                "Name": local[r].name,
                                "Path": r,
                                "Version": local[r].version,
                                "Description": local[r].description,
                                "Author": local[r].author,
                                "Bugs": local[r].bugs.url
                            }})
                            .sorted("Name")
                            .toArray(),
                "all": $stream(Object.keys(remote))
                             .map(function(r) { return {
                                "Name": remote[r].name,
                                "Path": getOPackPath(remote[r].name),
                                "Version": (isDefined(getOPackPath(remote[r].name))) ? $stream(local).filter({"name": remote[r].name}).toArray()[0].version : "",
                                "RemoteVersion": remote[r].version,
                                "Description": remote[r].description,
                                "Author": remote[r].author,
                                "Bugs": remote[r].bugs.url,
                                "Local": isDefined(getOPackPath(remote[r].name)),
                                "Update": (isDefined(getOPackPath(remote[r].name))) ?(remote[r].version != $stream(local).filter({"name": remote[r].name}).toArray()[0].version) : ""
                            }})
                            .sorted("Name")
                            .toArray()
            });
        return httpServer.replyOKHTML(templates("index", opacks));
        } catch(e) {logErr(e)}
    }

}), function(req) {
    return httpServer.replyOKHTML(templates("index", defaultPage));
}, undefined,
    function(req) {
	keepRunning = true;
});

log("Ready on http://127.0.0.1:" + port);
log("Hit Ctrl-C on this to exit.");

ow.server.daemon(2500, function() { return !keepRunning; });
