// OpenWrap
// Author: Nuno Aguiar
// Dev

OpenWrap.dev = function() {
	return ow.dev;
};

OpenWrap.dev.prototype.loadChFn = function() {
    ow.loadCh()
	ow.loadObj()

    ow.ch.__types.fn = {
        __channels: {},
        create       : function(aName, shouldCompress, options) {
            options = _$(options).isMap().default({})
    
            options.get           = _$(options.get, "get").isFunction().default(k => k)
            options.set           = _$(options.set, "set").isFunction().default((k, v, t) => k)
            options.unset         = _$(options.unset, "unset").isFunction().default((aK, aT) => aK)
            options.getKeys       = _$(options.getKeys, "getKeys").isFunction().default(() => ([]))
    
            options.size          = _$(options.size, "size").isFunction().default(() => options.getKeys().length)
            options.forEach       = _$(options.forEach, "forEach").isFunction().default(aFn => {
                options.getKeys().forEach(k => {
                    try {
                        aFn(k, options.get(k))
                    } catch(e) { }
                })
            })
            options.getAll        = _$(options.getAll, "getAll").isFunction().default(() => options.getKeys().map(k => options.get(k)) )
            options.getSortedKeys = _$(options.getSortedKeys, "getSortedKeys").isFunction().default(() => options.getKeys() )
            options.getSet        = _$(options.getSet, "getSet").isFunction().default((aM, aK, aV, aT) => options.set(aK, aV, aT) )
    
            options.setAll        = _$(options.setAll, "setAll").isFunction().default((aKs, aVs, aTs) => {
                aVs.forEach(aV => options.set(ow.obj.filterKeys(aKs, aV), aV, aTs) )
            })
            options.unsetAll      = _$(options.unsetAll, "unsetAll").isFunction().default((aKs, aVs, aTs) => {
                aVs.forEach(aV => options.unset(ow.obj.filterKeys(aKs, aV), aTs) )
            })
    
            options.pop           = _$(options.pop, "pop").isFunction().default( () => {
                var elems = this.getSortedKeys(aName);
                var elem = elems[elems.length - 1];
                return elem;
            })
            options.shift         = _$(options.shift, "shift").isFunction().default( () => {
                var elems = this.getSortedKeys(aName);
                var elem = elems[0];
                return elem;
            })
    
            this.__channels[aName] = options
        },
        destroy      : function(aName) { delete this.__channels[aName] },
        size         : function(aName) { return this.__channels[aName].size() },
        forEach      : function(aName, aFunction) { this.__channels[aName].forEach(aFunction) },
        getAll       : function(aName, full) { return this.__channels[aName].getAll(full) },
        getKeys      : function(aName, full) { return this.__channels[aName].getKeys(full) },
        getSortedKeys: function(aName, full) { return this.__channels[aName].getSortedKeys(full) },
        getSet       : function(aName, aMatch, aK, aV, aTimestamp) { return this.__channels[aName].getSet(aMatch, aK, aV, aTimestamp) },
        set          : function(aName, aK, aV, aTimestamp) { return this.__channels[aName].set(aK, aV, aTimestamp) },
        setAll       : function(aName, aKs, aVs, aTimestamp) { return this.__channels[aName].setAll(aKs, aVs, aTimestamp) },
        unsetAll     : function(aName, aKs, aVs, aTimestamp) { return this.__channels[aName].unsetAll(aKs, aVs, aTimestamp) },		
        get          : function(aName, aK) { return this.__channels[aName].get(aK) },
        pop          : function(aName) { return this.__channels[aName].pop() },
        shift        : function(aName) { return this.__channels[aName].shift() },
        unset        : function(aName, aK, aTimestamp) { return this.__channels[aName].unset(aK, aTimestamp) }
    }
    
}

OpenWrap.dev.prototype.loadPoolDB = function() {
	ow.loadCh();
	ow.loadObj();

	ow.ch.__types.pooldb = {
		__o: { },
		create       : function(aName, shouldCompress, options) { 
			this.__o[aName] = options || {};
			
			if (isUnDef(this.__o[aName].dbPool)) {
				this.__o[aName].dbPool = ow.obj.pool.DB("org.h2.Driver", "jdbc:h2:mem:", "sa", "sa");
			}

			if (isUnDef(this.__o[aName].tableName)) {
				throw "Need a specific options.tableName";
			}
		},
		destroy      : function(aName) { },
		size         : function(aName) { 
			var parent = this, res;
			this.__o[aName].dbPool.use((aDb) => {
				res = Number(aDb.q("select count(*) C from " + parent.__o[aName].tableName).results[0].C);
			});

			return res;
		},
		forEach      : function(aName, aFunction, x) { },
		getKeys      : function(aName, full) { },
		getSortedKeys: function(aName, full) { },
		getSet       : function getSet(aName, aMatch, aK, aV, aTimestamp)  { },
		set          : function(aName, ak, av, aTimestamp) { },
		setAll       : function(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp) { },
		get          : function(aName, aKey) { },
		pop          : function(aName) { },
		shift        : function(aName) { },
		unset        : function(aName, aKey) { }
	};
};

OpenWrap.dev.prototype.loadIgnite = function(aGridName, aIgnite, secretKey, isClient) {
	ow.dev.__i = [];

	var initI = () => {
		plugin("Ignite");
		var grid = (isUnDef(aGridName)) ? "default" : aGridName;
		if (isUnDef(aIgnite)) {
			ow.dev.__i[grid] = new Ignite();
			ow.dev.__i[grid].start(aGridName, secretKey, isClient);
		} else {
			ow.dev.__i[grid] = aIgnite;
		}
	};

	oPromise.prototype.thenAny = function(aFunc, aRejFunc, aGridName) {
		if (isUnDef(ow.dev.__i)) initI();
		return this.then(() => {
			var grid = (isUnDef(aGridName)) ? "default" : aGridName;
			return ow.dev.__i[grid].call(ow.dev.__i[grid].getIgnite(), aFunc.toSource().replace(/[^{]*{([\s\S]*)}[^}]*/, "$1").replace(/"/mg, "\\\""));
		}, aRejFunc);
	};


	oPromise.prototype.thenAll = function(aFunc, aRejFunc, aGridName) {
		if (isUnDef(ow.dev.__i)) initI();
		return this.then(() => {
			var grid = (isUnDef(aGridName)) ? "default" : aGridName;
			return ow.dev.__i[grid].broadcast(ow.dev.__i[grid].getIgnite(), aFunc.toSource().replace(/[^{]*{([\s\S]*)}[^}]*/, "$1").replace(/"/mg, "\\\""));
		}, aRejFunc);
	};

	initI();
};

OpenWrap.dev.prototype.doh = function(aString, aType, aProvider) {
    aType = _$(aType, "type").default("a");
    var aNumType;

    if (isUnDef(global.__doh)) global.__doh = {};
    if (Object.keys(global.__doh).length > 5) {
        $do(() => {
            Object.keys(global.__doh).forEach(v => {
                if (nowUTC() > global.__doh[v].t) delete global.__doh[v];
            });
        });
    }

    if (isNumber(aType)) 
        aNumType = aType;
    else
        switch(aType) {
        case "a"    : aNumType = 1; break;
        case "cname": aNumType = 5; break;
        case "aaaa" : aNumType = 28; break;
        default: aNumType = 1;
        }

    var resolve = (aAddr, aResType, aProv) => {
        if (isUnDef(aProv)) aProv = "cloudfare";
        if (isString(aProv)) {
            switch(aProv) {
            case "google": 
                aProv = (a, t, nt) => {
                    var res = $rest({ uriQuery: true })
                            .get("https://8.8.8.8/resolve", { name: a, type: t });
                    if (isDef(res) && isArray(res.Answer) && res.Answer.length > 0) 
                        return $path(res, "sort_by(Answer, &TTL)[?type==`" + nt + "`]"); 
                    else 
                        return __;
                };
                break;
            default:
            case "cloudfare": 
                aProv = (a, t, nt) => {
                    var res = $rest({ uriQuery: true, requestHeaders: { accept: "application/dns-json"  } })
                              .get("https://1.1.1.1/dns-query", { name: a, type: t });
                    if (isDef(res) && isArray(res.Answer) && res.Answer.length > 0) 
                        return $path(res, "sort_by(Answer, &TTL)[?type==`" + nt + "`]"); 
                    else 
                        return __;
                };
                break;
            }
            aProvider = aProv;
        }
        _$(aProvider, "provider").isFunction();
        return aProvider(aAddr, aResType, aNumType);
    };

    var select = (aAddr, aResType, aProvider) => {
        var res, ttl;

        if (isDef(global.__doh[aAddr + "|" + aResType])) {
            if (global.__doh[aAddr + "|" + aResType].t > nowUTC()) {
                return global.__doh[aAddr + "|" + aResType].s;
            }
        }

        var ar = resolve(aAddr, aResType, aProvider);
        if (isDef(ar) && isArray(ar)) {
            var rres = ar[Math.floor(Math.random() * ar.length)];
            res = rres.data;
            ttl = rres.TTL;
        } else {
            ttl = -1;
            res = aAddr;
        }

        global.__doh[aAddr + "|" + aResType] = {
            s: res,
            t: nowUTC() + ttl
        };
        return res;
    };

    if (isJavaObject(aString) && aString instanceof java.net.URL) {
        var res = select(aString.getHost(), aType, aProvider);
        if (isDef(res) && isArray(res)) {
            return java.net.URL(aString.toString().replace(aString.getHost(), res));
        }
        return aString;
    }
    if (isString(aString)) {
        if (aString.indexOf("://") > 0) {
            var url = java.net.URL(aString);
            var res = select(url.getHost(), aType, aProvider);
            if (isDef(res) && isString(res)) {
                aString = aString.replace(url.getHost(), res);
                return aString;
            }
            return aString;
        } else {
            var res = select(aString, aType, aProvider);
            return res;
        }
    }
};

OpenWrap.dev.prototype.JSDebug = function(shouldTrack) {
    this.shouldTrack = _$(shouldTrack, "shouldTrack").isBoolean().default(false);

    if (this.shouldTrack) {
        $ch("__debug").create();
    }
};

OpenWrap.dev.prototype.JSDebug.prototype.setTestingWrap = function(aName, aObject, aMethod, aFn) {
    ow.loadTest();
    ow.test.reset();
    ow.test.setOutput(false);
    return this.setFn(aObject, aMethod, aFn, "return ow.test.test('" + aName + "', ()=>{", "})");
};

OpenWrap.dev.prototype.JSDebug.prototype.unSetFn = function(aMap) {
    _$(aMap, "map").isMap().$_();

    if (this.shouldTrack) {
        _$(aMap.object, "map.object").$_();
        _$(aMap.method, "map.method").$_();
        aMap = $ch("__debug").get({
            object: aMap.object,
            method: aMap.method
        });
    }

    if ($$(aMap.fn).isDef()) {
        global[aMap.method] = eval(aMap.origFn);
    } else {
        Object.getPrototypeOf(eval(aMap.object))[aMap.method] = eval(aMap.origFn);
    }

    if (this.shouldTrack) {
        $ch("__debug").unset({
            object: aObject,
            method: aMethod
        });
    }
};

OpenWrap.dev.prototype.JSDebug.prototype.unSetAll = function() {
    if (this.shouldTrack) {
        $ch("__debug").forEach((k, v) => {
            this.unSetFn(v);
        });
    }
};

OpenWrap.dev.prototype.JSDebug.prototype.setAll = function(aObject, aPrefix, aSuffix, eachLineTmpl) {
    _$(aObject, "object").$_();

    var ks = Object.keys(Object.getPrototypeOf(eval(aObject)));
    if (ks.length == 0) ks = Object.keys(eval(aObject));
    for(var ii in ks) {
        if (isFunction(eval(aObject)[ks[ii]])) 
            this.setFn(aObject, ks[ii], aObject[ks[ii]], aPrefix, aSuffix, eachLineTmpl);
        else {
            this.setAll(aObject + "." + ks[ii], aPrefix, aSuffix, eachLineTmpl);
        }
    }
};

OpenWrap.dev.prototype.JSDebug.prototype.setTestingWrapAll = function(aObject) {
    _$(aObject, "object").$_();

    var ks = Object.keys(Object.getPrototypeOf(eval(aObject)));
    if (ks.length == 0) ks = Object.keys(eval(aObject));
    for(var ii in ks) {
        if (isFunction(eval(aObject)[ks[ii]])) 
            this.setTestingWrap(aObject + "." + ks[ii], aObject, ks[ii], eval(aObject)[ks[ii]]);
        else {
            this.setTestingWrapAll(aObject + "." + ks[ii]);
        }
    }
};

OpenWrap.dev.prototype.JSDebug.prototype.setFn = function(aObject, aMethod, aFn, aPrefix, aSuffix, eachLineTmpl) {
    _$(aObject).isString().regexp(/\w+/).$_("need to provide a object name as a string");
    _$(aMethod).isString().regexp(/\w+/).default(aObject);
    _$(aFn).isFunction().default(__);
    aPrefix = _$(aPrefix).isString().default("");
    aSuffix = _$(aSuffix).isString().default("");
    eachLineTmpl = _$(eachLineTmpl).isString().default("");

    var oF = ($$(aFn).isDef()) ? aFn.toString() : Object.getPrototypeOf(eval(aObject))[aMethod].toString();
    var lines = oF.split(/\n/);
    var origFunction = oF;
    var newFunction = "";
    var midText = true;

    for(var lineNumber in lines) {
        if (lineNumber != 0 && lineNumber < (lines.length - 2)) {
            newFunction += lines[lineNumber];
            if (lineNumber == 1) {
                newFunction += "\n" + aPrefix + "\n";
                midText = false;
            } else {
                midText = true;
            }
            if (midText) {
                newFunction += "\n";
                if (isDef(eachLineTmpl)) {
                    newFunction += templify(eachLineTmpl, {
                        obj    : aObject,
                        method : aMethod,
                        lineNum: lineNumber
                    }) ;
                }
            }

            if (lineNumber == lines.length - 3) {
                newFunction += aSuffix + "\n";
                midText = false;
            } else {
                midText = true;
            }
        } else {
            newFunction += lines[lineNumber];
        }
    }

    if (aObject != aMethod) {
        (eval(aObject))[aMethod] = eval(newFunction);
    } else {
        Object.getPrototypeOf(eval(aObject))[aMethod] = eval(newFunction);
    }

    var res = {
        origFn: origFunction,
        newFn : newFunction,
        fn    : aFn,
        method: aMethod,
        object: aObject
    };

    if (this.shouldTrack) {
        $ch("__debug").set({
            object: aObject,
            method: aMethod
        }, res);
    }

    return res;
};

var oBook = function(aBook, exitOnEnd) {
    //if (isString(aBook) && aBook.match(/^https?\:\/\//)) aBook = $rest().get(aBook)
    if (isString(aBook) && aBook.indexOf("\n") < 0 && io.fileExists(aBook)) aBook = io.readFileString(aBook)

    this.book = isString(aBook) ? aBook : ""
    this.pos = -1
    this.struct = isArray(aBook) ? aBook : []
    this._show = true
    this.exitOnEnd = _$(exitOnEnd, "exitOnEnd").isBoolean().default(false)

    if (isString(aBook)) this.parse()
}

// con.getConsoleReader().getCursorBuffer().write("abc")
// con.getConsoleReader().getHistory().index()
// con.getConsoleReader().getHistory().get()

oBook.prototype.printPart = function(partId) {
    _$(partId).isNumber().$_()

    var thm = ow.format.withSideLineThemes().simpleLineWithTips
    thm.rtop    = thm.ltop
    thm.rmiddle = thm.lmiddle
    thm.rbottom = thm.lbottom

    var head = ansiColor("YELLOW,BOLD", "[" + (partId+1) + "/" + this.struct.length + "]\n\n")
    var txt = this.struct[partId].text
    var includeCode = false
    if (this.struct[partId].code.split("\n").length > 1) {
        includeCode = true
        this.includeCodeLines = this.struct[partId].code.split("\n").length-1
        __pinprefix = this.includeCodeLines+1
    } else {
        this.includeCodeLines = 0
        __pinprefix = ""
    }
    
    //if (includeCode) txt += "\n" + this.struct[partId].code + "\n"
    print(ow.format.withSideLine(head + ow.format.withMD(txt), __, "YELLOW", __, thm))
    if (includeCode) print(ansiColor("ITALIC,WHITE", "Copy+paste the following code or adapt it, if needed, as instructed:\n\n") + this.struct[partId].code)

    if (!includeCode) {
        if (this.struct[partId].code.length > 0) {
            print(ansiColor("ITALIC,WHITE", "Execute the following code or adapt it, if needed, as instructed:"))
            con.getConsoleReader().getCursorBuffer().write(this.struct[partId].code.trim())
        } else {
            this.interaction()
        }
    }
}

oBook.prototype.bookEnd = function() {
    watchLine    = ""
    watchCommand = false

    var thm = ow.format.withSideLineThemes().openTopCurvedRect

    print(ow.format.withSideLine(ow.format.withMD("(obook end)"), __, "YELLOW", __, thm))
    if (this.exitOnEnd) exit(0)
}

oBook.prototype.bookStart = function() {
    var thm = ow.format.withSideLineThemes().openBottomCurvedRect

    print(ow.format.withSideLine(ow.format.withMD("(obook start)"), __, "YELLOW", __, thm))
}

oBook.prototype.interaction = function() {
    if (this.pos == -1) {
        this.printPart(++this.pos)
    } else {
        if (this.pos > (this.struct.length)) {
            this._show = false
        }

        if (this._show && this.includeCodeLines <= 0) {
            var _out = false
            var _msg = ""
            do {
                // Position check
                var _pos = ""

                if (this.pos < 0) this.pos = -1
                if (this.pos < (this.struct.length-1)) {
                    _pos = "to show [" + (this.pos+2) + "/" + this.struct.length + "]"
                    this._show = true
                }
                if (this.pos >= (this.struct.length-1)) {
                    this.pos = this.struct.length-1
                    _pos = "to end"
                    this._show = false
                }
                
                _msg = "\r(" + _pos + " press enter, for others use up/down keys, to continue entering commands Ctrl+U and to quit press 'q')"
                printnl(_msg)
                var _c = String(con.readChar("")).charCodeAt(0)

                // Keyboard check
                if (_c == 27) {
                    // esc
                    _c = String(con.readChar("")).charCodeAt(0)
                    
                    if (_c == 27) {
                        this._show = false
                        _out = true
                    }
                    if (_c == 91 || _c == 79) {
                        _c = String(con.readChar("")).charCodeAt(0)

                        // others
                        switch(_c) {
                        case 65: // up
                            this.pos--
                            _out = false
                            break
                        case 66: // down
                            this.pos++
                            _out = false
                            break
                        case 13: // enter
                        case 32: // space
                            _out = true
                            this.pos++
                            break
                        default:
                        }
                    }
                }
                if (_c == 21) {
                    // ctrl+U
                    this._show = false
                    _out = true
                }
                if (_c == 13) {
                    // enter
                    _out = true
                    this.pos++
                }
                if (_c == 113) {
                    // q
                    this._show = false
                    _out = true
                    this.pos = this.struct.length
                }
                printnl("\r" + repeat(_msg.length, " ") + "\r")
            } while(_out == false)
            
            if (this._show) {
                this.printPart(this.pos)
            } else {
                if (this.pos >= (this.struct.length-1)) this.bookEnd()
            }
        } else {
            if (this.includeCodeLines > 0) {
                __pinprefix = this.includeCodeLines
                this.includeCodeLines--
            } 
            this._show = true
        }
    }
}

oBook.prototype.parse = function() {
    this.struct = []

    var _cleanup = s => {
        if (isString(s)) {
            return s.trim()
        } else {
            return ""
        }
    }

    var ro = this.book.match(/^\*requires (.+) >= (.+)\*/m)
    if (isArray(ro) && ro.length > 0) {
        ro.forEach(r => {
            var _r = r.match(/^\*requires (.+) >= (.+)\*/)
            if (_r && _r.length == 3) {
                includeOPack(_r[1], _r[2])
            }
        })
    }

    var lst = this.book.replace(/````javascript\n([^`]+)````/mg, "````````\n$1````````").split(/````````\w*/)
    for(var i = 0; i < lst.length; i = i + 2) {
        if ((isString(lst[i]) && lst[i].length > 0) || 
            (isString(lst[i+1]) && lst[i+1].length > 0)) {
            this.struct.push({
                text: _cleanup(lst[i]),
                code: _cleanup(lst[i+1])
            })
        }
    }
}

var obook = function(aBook, exitOnEnd) {
    global._obook = new oBook(aBook, exitOnEnd)
    watchLine = "_obook.interaction()"
    watchCommand = true
    global._obook.bookStart()
}
