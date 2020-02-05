// OpenWrap
// Author: Nuno Aguiar
// Dev

OpenWrap.dev = function() {
	return ow.dev;
};


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
                        return void 0;
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
                        return void 0;
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
    _$(aFn).isFunction().default(void 0);
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