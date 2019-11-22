// OpenWrap
// Author: Nuno Aguiar
// Dev

OpenWrap.dev = function() {
	return ow.dev;
};

// var q = new ow.dev.queue("test", {type:"queue"})
// var o = () => { try { var ar = [], res; do { res = q.receive(void 0, 50); if(isDef(res)) ar.push(res) } while(isDef(res)); return ar }catch(e) { sprintErr(e);} }
// for(var oo = 1; oo <= 500; oo++) {  q.send({ x: oo, y: -oo }) }
// var a1 = [], a2 = [], a3= []; $doWait($doAll([ $do(()=> { a1=o() }), $do(() => { a2 = o() }), $do(()=>{a3=o();}) ])); a1.length + a2.length + a3.length

OpenWrap.dev.prototype.queue = function(aName, aStamp) {
    this.name = "queue::" + aName;
    this.stamp = _$(aStamp).isMap().default({});

    $ch(this.name).create();
};

OpenWrap.dev.prototype.queue.prototype.__find = function(aVisibilityTime) {
    var keys = $ch(this.name).getKeys();
    for(var ii = 0; ii < keys.length; ii++) {
        var val = clone($ch(this.name).get(keys[ii]));
        if (isDef(val)) {
            if (val.status == "r") {
                if (isDef(val.timeout) && val.timeout < now()) {
                    continue;
                } else {
                    $ch(this.name).unset(keys[ii]);
                }
            }
            if (val.status == "s") {
                val.status = "r";
                if (isDef(aVisibilityTime)) val.timeout = now() + aVisibilityTime;
                var res = $ch(this.name).getSet({
                    id: val.id,
                    status: "s"
                }, keys[ii],
                val);
    
                this.val = val;
                if (isDef(res)) return res;
            }
        }
    }
};

OpenWrap.dev.prototype.queue.prototype.send = function(aObject, aId) {
    var id = _$(aId).default(nowNano());
    $ch(this.name).set(merge({
        id: id
    }, this.stamp), merge({
        id: id,
        status: "s",
        obj: aObject
    }, this.stamp));
};

OpenWrap.dev.prototype.queue.prototype.receive = function(aVisibilityTime, aWaitTime) {
    aWaitTime = _$(aWaitTime).isNumber().default(2500);
    var limit = now() + aWaitTime;
    do {
        var r = this.__find(aVisibilityTime);
        if (isDef(r)) {
            return {
                idx: r,
                obj: this.val.obj
            };
        }
        sleep(50, true);
    } while(now() < limit);
};

OpenWrap.dev.prototype.queue.prototype.delete = function(aId) {
    $ch(this.name).unset(merge({
        id: aId
    }, this.stamp));
};

OpenWrap.dev.prototype.queue.prototype.purge = function(aId) {

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