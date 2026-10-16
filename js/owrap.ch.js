// OpenWrap v2
// Copyright 2023 Nuno Aguiar
// Channels

OpenWrap.ch = function() {
	plugin("Threads")
	return ow.ch;
};

OpenWrap.ch.prototype.subscribers = {};
OpenWrap.ch.prototype.peers = {};
OpenWrap.ch.prototype.expose = {};
OpenWrap.ch.prototype.jobs = {};
OpenWrap.ch.prototype.vers = {}; 
OpenWrap.ch.prototype.channels = {};
OpenWrap.ch.prototype.type = {};
OpenWrap.ch.prototype.lock = {};
OpenWrap.ch.prototype.lock2 = {};
// One reentrant lock also protects backend registries shared by different channel names.
OpenWrap.ch.prototype.__lifecycleLock = new java.util.concurrent.locks.ReentrantLock();

OpenWrap.ch.prototype.__types = {
	// Obj BIG channel implementation
	//
	/**
	 * <odoc>
	 * <key>ow.ch.types.big</key>
	 * This OpenAF channel implementation stores key/values in a compressed in-memory structure (ow.obj.big) optimized
	 * for large datasets. It accepts no creation options beyond the inherited shouldCompress parameter.\
	 * \
	 * Example:\
	 * \
	 *    ow.ch.create("myBig", true, "big");\
	 * \
	 * Note: the underlying ow.obj.big storage uses a sorted index so getSortedKeys reflects insertion/modification order.\
	 * </odoc>
	 */
	big: {
		__channels: Object.create(null),
		create : function(aName, shouldCompress) { this.__channels[aName] = ow.loadObj().big.create(shouldCompress); },
		destroy: function(aName) { delete this.__channels[aName]; },
		size   : function(aName) { return this.__channels[aName].getSize(); },
		forEach: function(aName, aFunction) { 
			var parent = this;
			this.getKeys(aName).forEach((aK, aV) => {
				aFunction(aK, parent.get(aName, aK));
			});
		},
		getKeys: function(aName, full) {
			var keys = [];
			
			if (full) {
				var res = this.__channels[aName].getIndex();
				for(var i in res) {
					keys = keys.concat(res[i]);
				}
			} else {
				this.__channels[aName].find(function(aKey) {
					syncFn(function() { keys.push(aKey); }, keys);
				});
			}
		
			return keys;				
		},
		getSortedKeys: function(aName, full) {
			var keys = [];
			
			var res = this.__channels[aName].getIndex();
			for(var i in res) {
				keys = keys.concat(res[i]);
			}
			
			res = $from($stream(keys).sort(function(a, b) {
				if (a.t == b.t)
					if (a.n < b.n) 
						return -1;
					else
						return 0;
				if (a.t < b.t) 
					return -1;
				
				return 1;
			}).toArray());
			
			if (full)
				return res.select();
			else
				return res.select(function(r) { return r.k; });
		},
		getSet: function getSet(aName, aMatch, aKey, aValue, aTimestamp)  {
			var res;
			res = this.__channels[aName].get(aKey);
			if ($stream([res]).anyMatch(aMatch)) {
				return this.__channels[aName].set(aKey, aValue, aTimestamp);
			}
			return undefined;
		},
		set: function(aName, ak, av, aTimestamp) {
			return this.__channels[aName].set(ak, av, aTimestamp);
		},
		setAll: function(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp) {
			this.__channels[aName].setAll(anArrayOfKeys, anArrayOfMapData, aTimestamp);
		},
		unsetAll: function(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp) {
			var parent = this;
			anArrayOfMapData.forEach((aV) => {
				parent.unset(aName, ow.loadObj().filterKeys(anArrayOfKeys, aV));
			});
		},
		get: function(aName, aKey) {
			return this.__channels[aName].get(aKey);
		},
		pop: function(aName) {
			var it = $from($stream(this.getKeys(aName, true)).sort(function(a, b) {
				if (a.t == b.t)
					if (a.n < b.n) 
						return -1;
					else
						return 0;
				if (a.t < b.t) 
					return -1;
				
				return 1;
			}).reverse().toArray()).at(0);
			
			if (isDef(it)) {
				return it.k;
			} else {
				return {};
			}
		},
		shift: function(aName) {
			var it = $from($stream(this.getKeys(aName, true)).sort(function(a, b) {
				if (a.t == b.t)
					if (a.n < b.n) 
						return -1;
					else
						return 0;
				if (a.t < b.t) 
					return -1;
				
				return 1;
			}).toArray()).at(0);

			if (isDef(it)) {
				return it.k;
			} else {
				return {};
			}
		},
		unset: function(aName, ak) {
			this.__channels[aName].remove(ak);
		}
	},
	// DB channel implementation
	//
	/**
	 * <odoc>
	 * <key>ow.ch.types.db</key>
	 * This OpenAF channel implementation wraps access to a db table. The creation options are:\
	 * \
	 *    - db   (Database) The database object to access the database table (or a JSON/SLON string with 'url', 'user', 'pass', 'timeout', 'driver').\
	 *    - from (String)   The name of the database table or object (don't use double quotes).\
	 *    - keys (Array)    An array of fields keys to use (don't use double quotes).\
	 *    - cs   (Boolean)  Determines if the database is case sensitive for table and field names (defaults to false).\
	 * \
	 * </odoc>
	 */
	db: {
		__options: {},
		create: function(aName, shouldCompress, options) {
			options = _$(options, "options").isMap().default({});

			_$(options.db, "options.db").$_();
			options.from = _$(options.from, "options.from").$_();
			options.keys = _$(options.keys, "options.keys").isArray().default(__);

			options.cs = _$(options.cs, "options.cs").isBoolean().default(false);
			if (options.cs && options.from.trim().length > 0 && options.from.trim()[0] != "(") {
				options.from = "\"" + options.from + "\"";
			};

			if (options.cs && isDef(options.keys)) {
				options.keys = options.keys.map(k => "\"" + k + "\"");
			}

			// Check if db is a string or map to convert it to a DB object
			if (isString(options.db) || isMap(options.db)) {
				var _d = af.fromJSSLON(options.db)
				// If we created the DB object, we need to close it when the channel is destroyed
				options._closedb = true
				if (isDef(_d.driver)) {
					options.db = new DB(_d.driver, _d.url, _d.user, _d.pass, _d.timeout)
				} else {
					options.db = new DB(_d.url, _d.user, _d.pass, _d.timeout)
				}
			} else {
				options._closedb = false
			}
			
			this.__options[aName] = options;
		},
		destroy: function(aName) { 
			// Close the database connection if it was created by this channel
			if (this.__options[aName]._closedb && isDef(this.__options[aName].db)) {
				this.__options[aName].db.close()
			}
			delete this.__options[aName];
		},
		size: function(aName) {
			var options = this.__options[aName];
			try {
				var res = options.db.q("select count(1) as C from " + options.from);
				return Number(res.results[0].C);
			} catch(e) {
				return String(e);
			}
		},
		forEach: function(aName, aFunction, x) {
			var i = this.getKeys(aName);
			for(var j in i) {
				aFunction(i[j], this.get(aName, i[j]));
			}
		},
		getKeys: function(aName, full) { 
			var options = this.__options[aName];
			full = _$(full, "extra").isString().default(__);

			var lst = (isDef(options.keys) ? options.keys.join(", ") : "*");

			try {
				var res = options.db.q("select " + lst + " from " + options.from + (isDef(full) ? " where " + full : ""));
				return res.results;
			} catch(e) {
				return String(e);
			}
		},
		getSortedKeys: function(aName, full) {
			return this.getKeys(aName, full);
		},
		getSet: function getSet(aName, aMatch, aK, aV, aTimestamp)  {
			/*var res;
			try {
				res = this.__db[aName].qs("select key from " + this.__table[aName] + " where key = ? for update", [stringify(aK)], true).results[0].KEY;
				if (isDef(res) && ($stream([JSON.parse(res)]).anyMatch(aMatch)) ) {
					this.set(aName, aK, aV, aTimestamp);
				}
				this.__db[aName].commit();
				return res;
			} catch(e) {
				this.__db[aName].rollback();
				throw e;
			}*/
		},
		set: function(aName, aK, aV, aTimestamp, x) { 
			var options = this.__options[aName];

			var i = this.get(aName, aK);
			try {
				var wset = [], wku = [], wv = [], wk = [];

				if (isDef(i)) {
					for(var ii in aV) {
						wset.push((options.cs ? "\"" + ii + "\"" : ii) + " = ?");
						wv.push(aV[ii]);
					}
					for(var ii in aK) {
						if (isDef(options.keys) && options.keys.indexOf((options.cs ? "\"" + ii + "\"" : ii)) < 0) continue;
						wku.push((options.cs ? "\"" + ii + "\"" : ii) + " = ?");
						wv.push(aK[ii]);
					}
					options.db.us("update " + options.from + " set " + wset.join(", ") + " where " + wku.join(" AND "), wv, true);
				} else {
					for(var ii in aV) {
						wk.push((options.cs ? "\"" + ii + "\"" : ii));
						wv.push(aV[ii]);
					}
					options.db.us("insert into " + options.from + " (" + wk.join(", ") + ") values (" + wv.map(r => "?").join(", ") + ")", wv, true);
				}
				options.db.commit();
			} catch(e) {
				options.db.rollback();
				throw e;
			}
			return aK;
		},
		setAll: function(aName, aKs, aVs, aTimestamp) { 
			for(var i in aVs) {
				this.set(aName, ow.loadObj().filterKeys(aKs, aVs[i]), aVs[i], aTimestamp);
			}
		},
		unsetAll: function(aName, aKs, aVs, aTimestamp) { 
			for(var i in aVs) {
				this.unset(aName, ow.loadObj().filterKeys(aKs, aVs[i]), aTimestamp);
			}
		},		
		get: function(aName, aK, x) {
			var options = this.__options[aName];
			var lst = "*";
			var w = [], wv = [];
			for(var ii in aK) {
				if (isDef(options.keys) && options.keys.indexOf((options.cs ? "\"" + ii + "\"" : ii)) < 0) continue;
				w.push((options.cs ? "\"" + ii + "\"" : ii) + " = ?");
				wv.push(aK[ii]);
			}

			var res;
			try {
				var res = options.db.qs("select " + lst + " from " + options.from +  " where " + w.join(" and "), wv, true);
				if (isDef(res) && isArray(res.results) && res.results.length > 0) {
					return res.results[0];
				} else {
					return __;
				}
			} catch(e) {
				return String(e);
			}
		},
		getAll: function(aName, full) {
			var options = this.__options[aName];
			var res = [], wv = [], wk = [], w = "";
			if (isDef(full) && isMap(full)) {
				for(var ii in full) {
					wk.push((options.cs ? "\"" + ii + "\"" : ii) + " = ?");
					wv.push(full[ii]);
				}
				w = " where " + wk.join(" and ");
			}

			try {
				res = options.db.qs("select * from " + options.from + w, wv, true).results;
			} catch(e) {
				return String(e);
			}
			return res;
		},		
		pop: function(aName) { 
			var aKs = this.getSortedKeys(aName);
			var aK = aKs[aKs.length - 1];
			return aK;		
		},
		shift: function(aName) {
			var aK = this.getSortedKeys(aName)[0];
			return aK;
		},
		unset: function(aName, aK, aTimestamp) { 
			var options = this.__options[aName];

			var w = [], wv = [];
			for(var ii in aK) {
				if (isDef(options.keys) && options.keys.indexOf((options.cs ? "\"" + ii + "\"" : ii)) < 0) continue;
				w.push((options.cs ? "\"" + ii + "\"" : ii) + " = ?");
				wv.push(aK[ii]);
			}

			try {
				options.db.us("delete " + options.from + " where " + w.join(" and "), wv, true);
				options.db.commit();
			} catch(e) {
				options.db.rollback();
				throw e;
			}
		}
	},	
	dbOld: {
		__db: {},
		__table: {},
		create: function(aName, shouldCompress, options) {
			if (isDef(options) && isDef(options.db)) 
				this.__db[aName] = options.db;
			else
				this.__db[aName] = createDBInMem(aName, false, undefined, undefined, false, true);
			
			if (isDef(options) && isDef(options.tableName)) {
				this.__table[aName] = options.tableName;
			} else {
				this.__table[aName] = "ch_" + aName;
			}
			
			var _keySize = 4000;
			
			if (isDef(options) && isDef(options.keySize)) { _keySize = options.keySize; };
			
			try {
				this.__db[aName].q("select count(key) from " + this.__table[aName]);
			} catch(e) {
				// Table probably doesn't exist
				this.__db[aName].u("CREATE TABLE " + this.__table[aName] + " (key varchar2(" + _keySize + ") primary key, ts number(15), value clob)" );
			}
		},
		destroy: function(aName) { 
			this.__db[aName].close();
			this.__db = deleteFromArray(this.__db, this.__db.indexOf(aName));
		},
		size: function(aName) {
			return Number(this.__db[aName].q("select count(key) c from " + this.__table[aName]).results[0].C);
		},
		forEach: function(aName, aFunction, x) {
			var i = this.getKeys(aName);
			for(var j in i) {
				aFunction(i[j], this.get(aName, i[j]));
			}
		},
		getKeys: function(aName, full) { 
			var i = $stream(this.__db[aName].q("select key from " + this.__table[aName]).results).map("KEY").toArray();
			var res = [];
			for(var j in i) {
				res.push(JSON.parse(i[j]));
			}
			return res;
		},
		getSortedKeys: function(aName, full) {
			var i = $stream(this.__db[aName].q("select key from " + this.__table[aName] + " order by ts").results).map("KEY").toArray();
			var res = [];
			for(var j in i) {
				res.push(JSON.parse(i[j]));
			}
			return res;
		},
		getSet: function getSet(aName, aMatch, aK, aV, aTimestamp)  {
			var res;
			try {
				res = this.__db[aName].qs("select key from " + this.__table[aName] + " where key = ? for update", [stringify(aK)], true).results[0].KEY;
				if (isDef(res) && ($stream([JSON.parse(res)]).anyMatch(aMatch)) ) {
					this.set(aName, aK, aV, aTimestamp);
				}
				this.__db[aName].commit();
				return res;
			} catch(e) {
				this.__db[aName].rollback();
				throw e;
			}
		},
		set: function(aName, aK, aV, aTimestamp, x) { 
			var i = this.get(aName, aK);
			try {
				if (isDef(i)) {
					this.__db[aName].us("update " + this.__table[aName] + " set value = ?, ts = ? where key = ?", [stringify(aV), aTimestamp, stringify(aK)], true);
				} else {
					this.__db[aName].us("insert into " + this.__table[aName] + " (key, ts, value) values (?, ?, ?)", [stringify(aK), aTimestamp, stringify(aV)], true);
				}
				this.__db[aName].commit();
			} catch(e) {
				this.__db[aName].rollback();
				throw e;
			}
			return aK;
		},
		setAll: function(aName, aKs, aVs, aTimestamp) { 
			for(var i in aVs) {
				this.set(aName, ow.loadObj().filterKeys(aKs, aVs[i]), aVs[i], aTimestamp);
			}
		},
		unsetAll: function(aName, aKs, aVs, aTimestamp) { 
			for(var i in aVs) {
				this.unset(aName, ow.loadObj().filterKeys(aKs, aVs[i]), aTimestamp);
			}
		},		
		get: function(aName, aK, x) {
			var res;
			try {
				res = JSON.parse(this.__db[aName].qs("select value from " + this.__table[aName] + " where key = ?", [stringify(aK)], true).results[0].VALUE);
			} catch(e) {}
			return res;
		},
		pop: function(aName) { 
			var aKs = this.getSortedKeys(aName);
			var aK = aKs[aKs.length - 1];
			var aV = this.get(aName, aK);
			return aK;		
		},
		shift: function(aName) {
			var aK = this.getSortedKeys(aName)[0];
			var aV = this.get(aName, aK);
			return aK;
		},
		unset: function(aName, aK, aTimestamp) { 
			try {
				this.__db[aName].us("delete " + this.__table[aName] + " where key = ?", [stringify(aK)], true);
				this.__db[aName].commit();
			} catch(e) {
				this.__db[aName].rollback();
				throw e;
			}
		}
	},
	// Operations channel implementation
	// (run operations from a channel)
	/**
	 * <odoc>
         * <key>ow.ch.types.ops</key>
         * This OpenAF channel implementation encapsulates access based on functions. The creation options are a map of
         * keys where each value is a function.\
         * \
         * Example:\
         * \
         * ow.ch.create("logic", false, "ops", { hello: name => "hi " + name });\
         * </odoc>
         */
	ops: {
		__ops : {},
		create       : function(aName, shouldCompress, options) { 
			this.__ops[aName] = options;
		},
		destroy      : function(aName) { 
			delete this.__ops[aName];
		},
		size         : function(aName) { 
			return Object.keys(this.__ops[aName]).length;
		},
		forEach      : function(aName, aFunction, x) { 
			var aKs = this.getKeys(aName);
			for(var i in aKs) {
				aFunction(aKs[i].key, this.get(aName, aKs[i], x));
			}			
		},
		getKeys      : function(aName, full) { 
			return Object.keys(this.__ops[aName]);
		},
		getSortedKeys: function(aName, full) { 
			return this.getKeys(aName, full).sort();
		},
		getSet       : function getSet(aName, aMatch, aK, aV, aTimestamp)  { 
			// Not implemented
			return undefined;
		},
		set          : function(aName, aK, aV, aTimestamp, x) { 
			if (isDef(this.__ops[aName][aK.key])) 
				return this.__ops[aName][aK.key](aV, x);
			else 
				return undefined;
		},
		setAll       : function(aName, aKs, aVs, aTimestamp) { 
			// Not implemented;
			return undefined;
		},
		unsetAll     : function(aName, aKs, aVs, aTimestamp) { 
			// Not implemented;
			return undefined;
		},		
		get          : function(aName, aK, x) { 
			return this.set(aName, aK, {}, undefined, x);
		},
		pop          : function(aName) { 
			// Not implemented;
			return undefined;
		},
		shift        : function(aName) { 
			// Not implemented;
			return undefined;
		},
		unset        : function(aName, aK, aTimestamp) { 
			// Not implemented;
			return undefined;
		}
	},
	// Cache implementation
	//
	/**
	 * <odoc>
	 * <key>ow.ch.types.cache</key>
	 * This OpenAF channel implementation provides a caching layer around a function or another channel. The creation options are:\
	 * \
	 *    - func       (Function) Function called with the key map when a cache miss occurs; its return value is stored and returned.\
	 *    - ttl        (Number)   Time-to-live in ms before cached entries expire (defaults to 5000ms).\
	 *    - size       (Number)   Maximum number of entries to keep in cache; -1 means unlimited (defaults to -1).\
	 *    - method     (String)   Eviction method: "t" (time-based TTL, default) or "p" (count-based, evicts oldest when size is exceeded).\
	 *    - default    (Object)   Optional default value to store and return on a cache miss if func is not defined.\
	 *    - useDefault (Boolean)  If true the default value is returned instead of calling func on a miss.\
	 *    - ch         (String/Channel) Optional backing storage channel (defaults to an auto-created [name]::__cache simple channel).\
	 * \
	 * Example:\
	 * \
	 *    ow.ch.create("myCache", false, "cache", { func: k => $rest().get("http://api/data/" + k.id), ttl: 60000 });\
	 * \
	 * </odoc>
	 */
	cache: {
		__cache: {},
		__cacheStats: {},
		create       : function(aName, shouldCompress, options) { 
			this.__cache[aName] = {};
			this.__cacheStats[aName] = {
				hits: 0,
				miss: 0,
				avg: 0
			};
			this.__cache[aName].Func = (isDef(options.func) ? function(k) { var res = options.func(k); return (isObject(res) ? res : { result: res }); } : function() { return {}; });
			this.__cache[aName].TTL = (isDef(options.ttl) ? options.ttl : 5000);
			this.__cache[aName].Size = (isDef(options.size) ? options.size : -1);
			this.__cache[aName].Method = (isDef(options.method) && options.method == "p") ? "p" : "t"
			this.__cache[aName].Default = (isDef(options.default) ? options.default : __)
			this.__cache[aName].UseDefault = (isDef(options.useDefault) ? options.useDefault : __)
			this.__cache[aName].__t = nowUTC();
			if (isUnDef(options.ch)) {
				$ch(aName + "::__cache").create();
				this.__cache[aName].Ch = $ch(aName + "::__cache");
			} else {
				this.__cache[aName].Ch = (isString(options.ch) ? $ch(options.ch) : options.ch);
			}
		},
		destroy      : function(aName) { 
			if (isDef(this.__cache[aName].Func)) delete this.__cache[aName].Func;
			if (isDef(this.__cache[aName].Ch)) delete this.__cache[aName].Ch;
			if (isDef(this.__cache[aName].TTL)) delete this.__cache[aName].TTL;
			if (isDef(this.__cache[aName].Size)) delete this.__cache[aName].Size;
			if (isDef(this.__cache[aName].Method)) delete this.__cache[aName].Method
			if (isDef(this.__cache[aName].Default)) delete this.__cache[aName].Default
			if (isDef(this.__cacheStats[aName])) delete this.__cacheStats[aName];
			$ch(aName + "::__cache").destroy();
		},
		__refresh    : function(aName, aRemoveNum) {
			if (isDef(this.__cache[aName].TTL) && nowUTC() > (this.__cache[aName].TTL + this.__cache[aName].__t)) {
				aRemoveNum = _$(aRemoveNum).isNumber().default(1);
				for(var ii = 0; ii < aRemoveNum; ii++) {
					this.__cache[aName].Ch.shift();
				}
				var parent = this;
				$doV(() => {
					parent.getKeys(aName, true).forEach(v => {
						try {
							if (v.____t <= (nowUTC() - parent.__cache[aName].TTL)) 
								parent.unset(aName, v);
							else
								if (parent.__cache[aName].__t > v.____t) parent.__cache[aName].__t = v.____t;
						} catch(e) {
							sprintErr(e);
						}
					});
				}).catch((e) => { sprintErr(e) });
			} else if (this.__cache[aName].Method == "p" && this.__cache[aName].Size > -1 && this.__cache[aName].Ch.size() > this.__cache[aName].Size) {
				$from(this.getKeys(aName, true))
				.sort("____t")
				.limit(this.__cache[aName].Ch.size() - this.__cache[aName].Size)
				.select(k => {
					this.__cache[aName].Ch.unset(k)
				})
			}
			this.__cache[aName].__t = nowUTC();
		},
		size         : function(aName) { 
			return this.__cache[aName].Ch.size();
		},
		forEach      : function(aName, aFunction, x) { 
			var aKs = this.getKeys(aName, false);
			for(var i in aKs) {
				aFunction(aKs[i], this.get(aName, aKs[i], x));
			}			
		},
		getKeys      : function(aName, full) { 
			if (isDef(full)) {
				return this.__cache[aName].Ch.getKeys(full);
			} else {
				return this.__cache[aName].Ch.getKeys(full).map(r => {
					var rr = clone(r);
					delete rr.____t;
					return rr;
				});
			}
		},
		getSortedKeys: function(aName, full) { 
			return $from(this.getKeys(aName, full)).sort("____t").select();
		},
		getSet       : function getSet(aName, aMatch, aK, aV, aTimestamp)  { 
			var res;
			res = this.get(aName, aK);
			if ($stream([res]).anyMatch(aMatch)) {
				return this.set(aName, aK, aV, aTimestamp);
			}
			return undefined;
		},
		set          : function(aName, aK, aV, aTimestamp, x) { 
			aTimestamp = _$(aTimestamp).default(nowUTC());
			this.__refresh(aName, 1);
			if (this.__cache[aName].Method == "p" || this.__cache[aName].Size < 0 || this.__cache[aName].Size > this.__cache[aName].Ch.size()) {
				this.__cache[aName].Ch.set(merge(aK, { ____t: aTimestamp }), this.__cache[aName].Func(aK), aTimestamp, x)
			}
			return aK;
		},
		setAll       : function(aName, aKs, aVs, aTimestamp) { 
			var avvs = [];
			this.__refresh(aName, aKs.length);
			if (this.__cache[aName].Size < 0 || this.__cache[aName].Size >= (this.__cache[aName].Ch.size() + aKs.length)) {
				for (var i in aKs) {
					aKs[i] = merge(aKs[i], { ____t: nowUTC() });
					avvs[i] = this.__cache[aName].Func(aKs[i]);
				}
				this.__cache[aName].Ch.setAll(aKs, avvs, aTimestamp);
			}
		},
		unsetAll       : function(aName, aKs, aVs, aTimestamp) { 
			var avvs = [];
			for (var i in aKs) {
				aKs[i] = merge(aKs[i], { ____t: nowUTC() });
				avvs[i] = this.__cache[aName].Func(aKs[i]);
			}
			this.__cache[aName].Ch.unsetAll(aKs, avvs, aTimestamp);
		},		
		getAll       : function(aName, full) {
			var res = new ow.loadObj().syncArray()
			this.__cache[aName].Ch.forEach(function(aKey, aValue) {
				res.add(aValue)
			}, full)
			return res.toArray()
		},
		get          : function(aName, aK) { 
			var aVv = {};
			var ar = this.getKeys(aName, {});
			var ee = arrayContains(ar, aK, k => { 
				var o = clone(k);
				delete o.____t;
				return o;
			});
			ee = (ee > -1 ? ar[ee] : __); 
			if (isDef(ee)) {
				if (ee.____t > (nowUTC() - this.__cache[aName].TTL)) {
					aVv = this.__cache[aName].Ch.get(ee)
					if (this.__cache[aName].Method == "p") {
						this.__cache[aName].Ch.unset(ee)
						ee.____t = nowUTC()
						this.__cache[aName].Ch.set(ee, aVv)
					}
					this.__cacheStats[aName].hits++;
				} else {
					var _fnProc = () => {
						var init = nowUTC();
						aVv = this.__cache[aName].Func(aK)
						this.__cacheStats[aName].miss++;
						this.__cacheStats[aName].avg = (this.__cacheStats[aName].avg + (nowUTC() - init)) / (this.__cacheStats[aName].miss + this.__cacheStats[aName].hits);
						this.__cache[aName].Ch.unset(ee);
						var eK = merge(aK, { ____t: nowUTC() });
						this.__cache[aName].Ch.set(eK, aVv);
						//aVv = this.__cache[aName].Ch.get(eK);
					}
					if (isDef(this.__cache[aName].UseDefault)) {
						$doV( () => _fnProc() )
						aVv = this.__cache[aName].UseDefault ? this.__cache[aName].Default : this.__cache[aName].Ch.get(ee)
					} else {
						_fnProc()
					}
				}
			} else {
				var _fnProc = () => {
					var init = nowUTC();
					aVv = this.__cache[aName].Func(aK)
					this.__cacheStats[aName].miss++;
					this.__cacheStats[aName].avg = (this.__cacheStats[aName].avg + (nowUTC() - init)) / (this.__cacheStats[aName].miss + this.__cacheStats[aName].hits);
					this.__refresh(aName, 1)
					if (this.__cache[aName].Method == "p" || this.__cache[aName].Size < 0 || this.__cache[aName].Size > this.__cache[aName].Ch.size()) {
						var eK = merge(aK, { ____t: nowUTC() });
						this.__cache[aName].Ch.set(eK, aVv);
						//aVv = this.__cache[aName].Ch.get(eK);
					}
					if (this.__cache[aName].Method == "p") this.__refresh(aName)
				}
				if (isDef(this.__cache[aName].UseDefault) && this.__cache[aName].UseDefault) {
					$doV( () => _fnProc() )
					aVv = this.__cache[aName].Default
				} else {
					_fnProc()
				}
			}
			return aVv
		},
		pop          : function(aName) { 
			var aKs = this.getSortedKeys(aName);
			var aK = aKs[aKs.length - 1];
			var aV = this.get(aName, aK);
			return aK;
		},
		shift        : function(aName) { 
			var aK = this.getSortedKeys(aName)[0];
			var aV = this.get(aName, aK);
			return aK;	
		},
		unset        : function(aName, aK, aTimestamp) { 
			//var eK = $stream(this.getKeys(aName, true)).filter(aK).toArray()[0];
			var ar = this.getKeys(aName, {});
			var eK = arrayContains(ar, aK);
			eK = (eK > -1 ? ar[eK] : __); 
			if (isDef(eK)) this.__cache[aName].Ch.unset(eK);
		}	
	},	
	// Buffer implementation
	//
	/**
	 * <odoc>
	 * <key>ow.ch.types.buffer</key>
	 * This OpenAF implementation establishes a buffer to another channel. The creation options are:\
	 * \
	 *    - bufferCh       (String)   The channel that will receive data from the buffer channel.\
	 *    - bufferIdxs     (Array)    An array of keys to use for faster performance (defaults to []).\
	 *    - bufferByTime   (Number)   How much time before flushing contents from the buffer channel (default 2500ms).\
	 *    - bufferByNumber (Number)   How many entries before flushing contents from the buffer channel (default 100).\
	 *    - bufferTmpCh    (String)   The auxiliary temporary buffer storage channel to use (default creates [name]::__bufferStorage).\
	 *    - bufferFunc     (Function) Optional function that if returns true will trigger the buffer flush to bufferCh.\
	 * \
	 * </odoc>
	 */
	buffer: {
		create       : function(aName, shouldCompress, options) {
			options                 = _$(options).isMap("Options must be a map.").default({});
			options.bufferByNumber  = _$(options.bufferByNumber).isNumber("bufferByNumber must be a number").default(100);
			options.bufferByTime    = _$(options.bufferByTime).isNumber("bufferByTime must be a number of ms").default(2500);
			options.bufferTmpCh     = _$(options.bufferTmpCh).isString("bufferTmpCh must be a string").default(aName + "::__bufferStorage");
			options.bufferIdxs      = _$(options.bufferIdxs).isArray("bufferIdxs must be an array").default([]);
			options.timeout         = _$(options.timeout).isNumber("timeout is a number (ms)").default(1500);
			options.errorFn         = _$(options.errorFn).isFunction().default(__);
			_$(options.bufferCh).isString("bufferCh must be a string").$_("Please provide a bufferCh");
	
			var addShut = false;
			if (isUnDef(this.__bn)) this.__bn = {};
			if (isUnDef(this.__bm)) this.__bm = {};
			if (isUnDef(this.__bf)) this.__bf = {};
			if (isUnDef(this.__bc)) this.__bc = {};
			if (isUnDef(this.__bt)) this.__bt = {};
			if (isUnDef(this.__bi)) this.__bi = {};
			if (isUnDef(this.__t))  this.__t = {};
			if (isUnDef(this.__lcks))  this.__lcks = {};
			if (isUnDef(this.__s))  this.__s = {};
			if (isUnDef(this.__efn)) this.__efn = {};
			if (isUnDef(this.__f)) { this.__f = {}; addShut = true; }
			
			this.__bn[aName] = options.bufferByNumber;
			this.__bm[aName] = options.bufferByTime;
			this.__bf[aName] = options.bufferFunc;
			this.__bc[aName] = options.bufferCh;
			this.__bt[aName] = options.bufferTmpCh;
			this.__bi[aName] = options.bufferIdxs;
			this.__t[aName]  = options.timeout;
			this.__efn[aName] = options.errorFn;

			if (options.bufferByTime < 0 && options.bufferByNumber < 0) throw "Needs to be buffered by time and/or number.";
	
			ow.loadServer();
			this.__lcks[aName] = new ow.server.locks(true);

			var parent = this;
			this.__f[aName] = function(force, itsTime) {
				itsTime = _$(itsTime).isBoolean().default(false)
				var cont = itsTime

				if (isUnDef(parent.__bt[aName])) return true

				if (isDef(parent.__bf[aName]) && isFunction(parent.__bf[aName])) {
					cont = parent.__bf[aName](parent.__bt[aName]);
				}

				if ((parent.__bn[aName] >= 0 && $ch(parent.__bt[aName]).size() >= parent.__bn[aName]) || force || cont) {
					// Lock
					if (!force) {
						if (parent.__lcks[aName].lock("openaf::ch::buffer::" + aName, 50, 1)) {
							cont = true;
						} else {
							return true;
						}
					} else {
						parent.__lcks[aName].lock("openaf::ch::buffer::" + aName, 50, -1, 50);
					}

					try {
						if (parent.__bi[aName].length > 0) {
							var ak = $ch(parent.__bt[aName]).getKeys();
							var ar = $ch(parent.__bt[aName]).getAll();
							if (ar.length > 0) {
								$ch(parent.__bc[aName]).setAll(parent.__bi[aName], ar);
								//for(var ii in ak) { $ch(parent.__bt[aName]).unset(ak[ii]); }
								$ch(parent.__bt[aName]).unsetAll(Object.keys(ak[0]), ak);
							}
						} else {
							$ch(parent.__bt[aName]).forEach((k, v) => {
								try {
									$ch(parent.__bc[aName]).set(k, v); 
									$ch(parent.__bt[aName]).unset(k);
								} catch(e) { 
									if (isDef(parent.__efn[aName])) parent.__efn[aName](e);
								}
							});
						}
					} finally {
						// Unlock
						parent.__lcks[aName].unlock("openaf::ch::buffer::" + aName);
					} 
				}
			};
	
			if (isDef(this.__bm[aName]) && this.__bm[aName] > 0) {
				this.__s[aName] = new Threads();
				this.__s[aName].addScheduleThreadWithFixedDelay(function() { parent.__f[aName](false, true); }, this.__bm[aName]);
			}
	
			if (addShut) {
				addOnOpenAFShutdown(function() {
					for(var c in ow.ch.__types.buffer.__s) {
						if (isDef(ow.ch.__types.buffer.__s[c])) ow.ch.__types.buffer.__s[c].stop();
					}
					for(var c in ow.ch.__types.buffer.__f) {
						ow.ch.__types.buffer.__f[c](true);
						// Bound the combined wait to the channel's configured timeout instead of applying it
						// to each waitForJobs call (which could double the per-channel shutdown delay).
						var _waitStart = now();
						$ch(ow.ch.__types.buffer.__bt[c]).waitForJobs(ow.ch.__types.buffer.__t[c]);
						var _waitLeft = ow.ch.__types.buffer.__t[c] - (now() - _waitStart);
						$ch(ow.ch.__types.buffer.__bc[c]).waitForJobs(_waitLeft > 0 ? _waitLeft : 0);
					}
				});
			}
	
			$ch(options.bufferTmpCh).create();
		},
		destroy      : function(aName) {
			if (isDef(ow.ch.__types.buffer.__s[aName])) ow.ch.__types.buffer.__s[aName].stop();
			if (isDef(ow.ch.__types.buffer.__f[aName])) ow.ch.__types.buffer.__f[aName](true);

			if (isDef(ow.ch.__types.buffer.__bn[aName])) delete ow.ch.__types.buffer.__bn[aName];
			if (isDef(ow.ch.__types.buffer.__bf[aName])) delete ow.ch.__types.buffer.__bf[aName];
			if (isDef(ow.ch.__types.buffer.__bc[aName])) $ch(ow.ch.__types.buffer.__bc[aName]).destroy();
			if (isDef(ow.ch.__types.buffer.__bc[aName])) delete ow.ch.__types.buffer.__bc[aName];
			if (isDef(ow.ch.__types.buffer.__bt[aName])) $ch(ow.ch.__types.buffer.__bt[aName]).destroy();
			if (isDef(ow.ch.__types.buffer.__bt[aName])) delete ow.ch.__types.buffer.__bt[aName];
			if (isDef(ow.ch.__types.buffer.__bi[aName])) delete ow.ch.__types.buffer.__bi[aName];
			if (isDef(ow.ch.__types.buffer.__f[aName])) delete ow.ch.__types.buffer.__f[aName];
			if (isDef(ow.ch.__types.buffer.__s[aName])) delete ow.ch.__types.buffer.__s[aName];
			if (isDef(ow.ch.__types.buffer.__efn[aName])) delete ow.ch.__types.buffer.__efn[aName];
			if (isDef(ow.ch.__types.buffer.__lcks[aName])) delete ow.ch.__types.buffer.__lcks[aName];
		},
		size         : function(aName) {
			return $ch(this.__bc[aName]).size() + $ch(this.__bt[aName]).size();
		},
		forEach      : function(aName, aFunction, x) {
			$ch(this.__bc[aName]).forEach(aFunction);
			$ch(this.__bt[aName]).forEach(aFunction);
		},
		getKeys      : function(aName, full) {
			return $ch(this.__bc[aName]).getKeys(full).concat($ch(this.__bt[aName]).getKeys(full));
		},
		getAll: function(aName, full) {
			return $ch(this.__bc[aName]).getAll(full).concat($ch(this.__bt[aName]).getAll(full));
		},
		getSortedKeys: function(aName, full) {
			//TODO
			return $ch(this.__bc[aName]).getAll(full).concat($ch(this.__bt[aName]).getAll(full));
		},
		getSet       : function getSet(aName, aMatch, aK, aV, aTimestamp)  {
			return $ch(this.__bc[aName]).getSet(aMatch, aK, aV, aTimestamp);		
		},
		set          : function(aName, ak, av, aTimestamp) {
			$ch(this.__bt[aName]).set(ak, av, aTimestamp);
			this.__f[aName]();
			return ak;
		},
		setAll       : function(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp) {
			$ch(this.__bt[aName]).setAll(anArrayOfKeys, anArrayOfMapData, aTimestamp);
			this.__f[aName]();
		},
		unsetAll       : function(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp) {
			$ch(this.__bt[aName]).unsetAll(anArrayOfKeys, anArrayOfMapData, aTimestamp);
			this.__f[aName]();
		},		
		get          : function(aName, aKey) {
			var res = $ch(this.__bt[aName]).get(aKey);
			if (isUnDef(res)) res = $ch(this.__bc[aName]).get(aKey);
			return res;
		},
		pop          : function(aName) {
			if ($ch(this.__bt[aName]).size() > 0) {
				return $ch(this.__bt[aName]).pop();
			} else {
				return $ch(this.__bc[aName]).pop();
			}
		},
		shift        : function(aName) {
			if ($ch(this.__bc[aName]).size() > 0) {
				return $ch(this.__bc[aName]).shift();
			} else {
				return $ch(this.__bt[aName]).shift();
			}  
		},
		unset        : function(aName, aKey) {
			$ch(this.__bt[aName]).unset(aKey);
			$ch(this.__bc[aName]).unset(aKey);
		}
	},	
	// Dummy implementation
	//
	/**
	 * <odoc>
	 * <key>ow.ch.types.dummy</key>
	 * This OpenAF channel implementation is a no-op sink: all write operations (set, setAll, unset, unsetAll) are silently
	 * discarded, all read operations (get, getAll, getKeys, size, forEach) return empty results. Useful for disabling a
	 * channel without changing calling code. Accepts no creation options.\
	 * \
	 * Example:\
	 * \
	 *    ow.ch.create("blackhole", false, "dummy");\
	 * \
	 * </odoc>
	 */
	dummy: {
		__channels: Object.create(null),
		create       : function(aName, shouldCompress, options) {
			//ow.loadObj();
			//this.__channels[aName] = options;
		},
		destroy      : function(aName) {
			//delete this.__channels[aName];
		},
		size         : function(aName) {
			//return this.getKeys(aName).length;
			return 0;
		},
		forEach      : function(aName, aFunction) {
			
		},
		getAll      : function(aName, full) {
			return [];
		},
		getKeys      : function(aName, full) {
			return [];
		},
		getSortedKeys: function(aName, full) {
			return [];				
		},
		getSet       : function getSet(aName, aMatch, aK, aV, aTimestamp)  {
			return {};
		},
		set          : function(aName, aK, aV, aTimestamp) {
			return {};
		},
		setAll       : function(aName, aKs, aVs, aTimestamp) {
			return {};		
		},
		unsetAll       : function(aName, aKs, aVs, aTimestamp) {
			return {};		
		},		
		get          : function(aName, aK) {
			return {};
		},
		pop          : function(aName) {
			return {};		
		},
		shift        : function(aName) {
			return {};
		},
		unset        : function(aName, aK, aTimestamp) {
			return {};
		}
	},
	// Proxy implementation
	//
	/**
	 * <odoc>
	 * <key>ow.ch.types.proxy</key>
	 * This OpenAF implementation establishes a proxy to another channel. The creation options are:\
	 * \
	 *    - chTarget  (String)   The channel that will receive all operations (if proxyFunc doesn't return).\
	 *    - proxyFunc (Function) Function that receives a map (by reference that can be changed) with: op (operation),
	 * name (target channel), function (where applicable), full (where applicable), match (the match of getSet), k (the key(s)),
	 * v (the value(s)) and timestamp. If this function returns something no operation will be executed on the chTarget and the
	 * value returned by the function will be the value returned by this channel.\
	 * \
	 * </odoc>
	 */
	proxy: {
		__channels: Object.create(null),
		create       : function(aName, shouldCompress, options) {
			this.__channels[aName] = options;
			options.chTarget = _$(options.chTarget).$_("Need to provide a chTarget.");
			options.proxyFunc = _$(options.proxyFunc).$_("Need to provide a proxyFunc.");
		},
		destroy      : function(aName) {
			delete this.__channels[aName];
		},
		size         : function(aName) {
			var m = { op: "size", name: this.__channels[aName].chTarget };
			var r = this.__channels[aName].proxyFunc(m); if (isDef(r)) return r;
			return $ch(this.__channels[aName].chTarget).size();
		},
		forEach      : function(aName, aFunction) {
			var m = { op: "forEach", name: this.__channels[aName].chTarget, function: aFunction };
			var r = this.__channels[aName].proxyFunc(m); if (isDef(r)) return r;
			return $ch(this.__channels[aName].chTarget).forEach(m.function);
		},
		getAll      : function(aName, full) {
			var m = { op: "getAll", name: this.__channels[aName].chTarget, full: full };
			var r = this.__channels[aName].proxyFunc(m); if (isDef(r)) return r;
			return $ch(this.__channels[aName].chTarget).getAll(m.full);
		},
		getKeys      : function(aName, full) {
			var m = { op: "getKeys", name: this.__channels[aName].chTarget, full: full };
			var r = this.__channels[aName].proxyFunc(m); if (isDef(r)) return r;
			return $ch(this.__channels[aName].chTarget).getKeys(m.full);
		},
		getSortedKeys: function(aName, full) {
			var m = { op: "getSortedKeys", name: this.__channels[aName].chTarget, full: full };
			var r = this.__channels[aName].proxyFunc(m); if (isDef(r)) return r;
			return $ch(this.__channels[aName].chTarget).getSortedKeys(full);
		},
		getSet       : function getSet(aName, aMatch, aK, aV, aTimestamp)  {
			var m = {
				op: "getSet", name: this.__channels[aName].chTarget, match: aMatch, k: aK, v: aV, timestamp: aTimestamp
			};
			var r = this.__channels[aName].proxyFunc(m); if (isDef(r)) return r;
			return $ch(this.__channels[aName].chTarget).getSet(m.match, m.k, m.v, m.timestamp);
		},
		set          : function(aName, aK, aV, aTimestamp) {
			var m = {
				op: "set", name: this.__channels[aName].chTarget, k: aK, v: aV, timestamp: aTimestamp
			};
			var r = this.__channels[aName].proxyFunc(m); if (isDef(r)) return r;
			return $ch(this.__channels[aName].chTarget).set(m.k, m.v, m.timestamp);
		},
		setAll       : function(aName, aKs, aVs, aTimestamp) {
			var m = {
				op: "setAll", name: this.__channels[aName].chTarget, k: aKs, v: aVs, timestamp: aTimestamp
			};
			var r = this.__channels[aName].proxyFunc(m); if (isDef(r)) return r;
			return $ch(this.__channels[aName].chTarget).setAll(m.k, m.v, m.timestamp);
		},
		unsetAll       : function(aName, aKs, aVs, aTimestamp) {
			var m = {
				op: "unsetAll", name: this.__channels[aName].chTarget, k: aKs, v: aVs, timestamp: aTimestamp
			};
			var r = this.__channels[aName].proxyFunc(m); if (isDef(r)) return r;
			return $ch(this.__channels[aName].chTarget).unsetAll(m.k, m.v, m.timestamp);
		},		
		get          : function(aName, aK) {
			var m = { op: "get", name: this.__channels[aName].chTarget, k: aK };
			var r = this.__channels[aName].proxyFunc(m); if (isDef(r)) return r;
			return $ch(this.__channels[aName].chTarget).get(m.k);
		},
		pop          : function(aName) {
			var m = { op: "pop", name: this.__channels[aName].chTarget };
			var r = this.__channels[aName].proxyFunc(m); if (isDef(r)) return r;
			// The channel wrapper reads and removes the value using this key.
			var keys = $ch(this.__channels[aName].chTarget).getSortedKeys();
			return keys[keys.length - 1];
		},
		shift        : function(aName) {
			var m = { op: "shift", name: this.__channels[aName].chTarget };
			var r = this.__channels[aName].proxyFunc(m); if (isDef(r)) return r;
			// The channel wrapper reads and removes the value using this key.
			return $ch(this.__channels[aName].chTarget).getSortedKeys()[0];
		},
		unset        : function(aName, aK, aTimestamp) {
			var m = { op: "unset", name: this.__channels[aName].chTarget, k: aK, timestamp: aTimestamp };
			var r = this.__channels[aName].proxyFunc(m); if (isDef(r)) return r;
			return $ch(this.__channels[aName].chTarget).unset(m.k, m.timestamp);
		}
	},
	// Simple implementation
	//
	/**
	 * <odoc>
	 * <key>ow.ch.types.simpleold</key>
	 * This OpenAF channel implementation is the legacy in-memory key/value store backed by a plain JavaScript object.
	 * It is kept for backward compatibility; prefer the "simple" type for new channels. Accepts no creation options.\
	 * </odoc>
	 */
	simpleold: {
		__channels: Object.create(null),
		create       : function(aName, shouldCompress, options) {
			this.__channels[aName] = {};
		},
		destroy      : function(aName) {
			delete this.__channels[aName];
		},
		size         : function(aName) {
			return Object.keys(this.__channels[aName]).length;
		},
		forEach      : function(aName, aFunction) {
			Object.keys(this.__channels[aName]).forEach((element) => {
				try { aFunction(this.__channels[aName][element].k, this.__channels[aName][element].v) } catch(e) {};
			});
		},
		getAll      : function(aName, full) {
			var res = [];
			Object.keys(this.__channels[aName]).forEach((element) => {
				res.push(this.__channels[aName][element].v);
			});
			return res;
		},
		getKeys      : function(aName, full) {
			var res = [];
			Object.keys(this.__channels[aName]).forEach((element) => {
				try { res.push(this.__channels[aName][element].k) } catch(e) {};
			});
			return res;
		},
		getSortedKeys: function(aName, full) {
			var res = [];
			Object.keys(this.__channels[aName]).forEach((element) => {
				try { res.push({ k: this.__channels[aName][element].k, t: this.__channels[aName][element].t }); } catch(e) {};
			});
			return $path(res, "sort_by([], &t)[*].k");		
		},
		getSet       : function getSet(aName, aMatch, aK, aV, aTimestamp)  {
			var res;
			res = this.get(aName, aK);
			if ($stream([res]).anyMatch(aMatch)) {
				return this.set(aName, aK, aV, aTimestamp);
			}
			return __;
		},
		set          : function(aName, aK, aV, aTimestamp) {
			var id = stringify(sortMapKeys(aK), __, "");
			var old = this.__channels[aName][id];
			if (isUnDef(old)) {
				this.__channels[aName][id] = {
					k: aK,
					v: aV,
					t: aTimestamp
				};
			} else {
				old.v = aV;
				old.t = aTimestamp;
			}
			return aK;
		},
		setAll       : function(aName, aKs, aVs, aTimestamp) {
			ow.loadObj();
			for(var i = 0; i < aVs.length; i++) {
				this.set(aName, ow.obj.filterKeys(aKs, aVs[i]), aVs[i], aTimestamp);
			}
		},
		unsetAll     : function(aName, aKs, aVs, aTimestamp) {
			ow.loadObj();
			for(var i = 0; i < aVs.length; i++) {
				this.unset(aName, ow.obj.filterKeys(aKs, aVs[i]), aVs[i], aTimestamp);
			}
		},		
		get          : function(aName, aK) {
			var id = stringify(sortMapKeys(aK), __, "");
			var res = this.__channels[aName][id];
			if (isDef(res)) 
				return res.v;
			else
				return __;
		},
		pop          : function(aName) {
			var elems = this.getSortedKeys(aName);
			var elem = elems[elems.length - 1];
			//var res = clone(this.get(aName, elem));
			//this.unset(aName, elem);
			return elem;
		},
		shift        : function(aName) {
			var elems = this.getSortedKeys(aName);
			var elem = elems[0];
			//var res = clone(this.get(aName, elem));
			//this.unset(aName, elem);
			return elem;
		},
		unset        : function(aName, aK, aTimestamp) {
			var id = stringify(sortMapKeys(aK), __, "");
			delete this.__channels[aName][id];
		}
	},
	/**
	 * <odoc>
	 * <key>ow.ch.types.simple</key>
	 * This OpenAF channel implementation is the default in-memory key/value store (used when no type is specified in ow.ch.create).
	 * It stores entries in a JavaScript Map keyed by a deterministic JSON serialization of the key map, preserving
	 * modification-time order for getSortedKeys. Accepts no creation options.\
	 * \
	 * Example:\
	 * \
	 *    ow.ch.create("myChannel");                    // uses "simple" by default\
	 *    ow.ch.create("myChannel", false, "simple");   // explicit\
	 * \
	 * </odoc>
	 */
	simple: {
		__channels: Object.create(null),
		create       : function(aName, shouldCompress, options) {
			this.__channels[aName] = new Map()
		},
		destroy      : function(aName) {
			delete this.__channels[aName];
		},
		size         : function(aName) {

			return this.__channels[aName].size
		},
		forEach      : function(aName, aFunction) {
			this.__channels[aName].forEach((v, k) => {
				try { aFunction(v.k, v.v) } catch(e) {}
			})
		},
		getAll      : function(aName, full) {
			return Array.from(this.__channels[aName].values()).map(e => e.v)
		},
		getKeys      : function(aName, full) {
			return Array.from(this.__channels[aName].values()).map(e => e.k)
		},
		getSortedKeys: function(aName, full) {
			return $path(Array.from(this.__channels[aName].values()), "sort_by([], &t)[*].k")
		},
		getSet       : function getSet(aName, aMatch, aK, aV, aTimestamp)  {
			var res
			res = this.get(aName, aK)
			if ($stream([res]).anyMatch(aMatch)) {
				return this.set(aName, aK, aV, aTimestamp)
			}
			return __
		},
		set          : function(aName, aK, aV, aTimestamp) {
			var id = stringify(sortMapKeys(aK, true), __, "")
			var old = this.__channels[aName].get(id)
			if (isUnDef(old)) {
				this.__channels[aName].set(id, { k: aK, v: aV, t: aTimestamp })
			} else {
				old.v = aV
				old.t = aTimestamp
				this.__channels[aName].set(id, old)
			}
			return aK
		},
		setAll       : function(aName, aKs, aVs, aTimestamp) {
			ow.loadObj()
			for(var i = 0; i < aVs.length; i++) {
				this.set(aName, ow.obj.filterKeys(aKs, aVs[i]), aVs[i], aTimestamp)
			}
		},
		unsetAll     : function(aName, aKs, aVs, aTimestamp) {
			ow.loadObj()
			for(var i = 0; i < aVs.length; i++) {
				this.unset(aName, ow.obj.filterKeys(aKs, aVs[i]), aVs[i], aTimestamp)
			}
		},		
		get          : function(aName, aK) {
			var id = stringify(sortMapKeys(aK, true), __, "")
			var res = this.__channels[aName].get(id)
			if (isDef(res)) 
				return res.v
			else
				return __
		},
		pop          : function(aName) {
			var elems = this.getSortedKeys(aName)
			var elem = elems[elems.length - 1]
			return elem
		},
		shift        : function(aName) {
			var elems = this.getSortedKeys(aName)
			var elem = elems[0]
			return elem
		},
		unset        : function(aName, aK, aTimestamp) {
			var id = stringify(sortMapKeys(aK, true), __, "")
			this.__channels[aName].delete(id)
		}
	},
	// File implementation
	/**
	 * <odoc>
	 * <key>ow.ch.types.file</key>
	 * This OpenAF implementation implements a simple channel on a single JSON, YAML or TOON file. The creation options are:\
	 * \
	 *    - file      (String)  The filepath to the JSON or YAML file to use (if multifile is false)\
	 *    - path      (String)  The path to use to store JSON, YAML or TOON objects to use (if multifile is true)\
	 *    - yaml      (Boolean) Use YAML instead of JSON (defaults to false)\
	 *    - toon      (Boolean) Use TOON instead of JSON (defaults to false)\
	 *    - compact   (Boolean) If JSON and compact = true the JSON format will be compacted (defaults to false or shouldCompress option)\
	 *    - multifile (Boolean) If true instead of keeping values in one file it will be kept in multiple files (*)\
	 *    - multipart (Boolean) If YAML and multipart = true the YAML file will be multipart\
	 *    - key       (String)  If a key contains "key" it will be replaced by the "key" value\
	 *    - multipath (Boolean) Supports string keys with paths (e.g. ow.obj.setPath) (defaults to false)\
	 *    - lock      (String)  If defined the filepath to a dummy file for filesystem lock while accessing the file\
	 *    - gzip      (Boolean) If true the output file will be gzip (defaults to false)\
	 *    - lz4       (Boolean) If true the output file will be lz4 (defaults to false)\
	 *    - tmp       (Boolean) If true "file" will be temporary and destroyed upon execution/process end\
	 * \
	 * (*) - Be aware that althought there is a very small probability of collision between the unique id (sha-512) for filenames it still exists\
	 * \
	 * </odoc>
	 */
	//
	file: {
		__channels: Object.create(null),
		__l: (m) => (isString(m.lock) ? $flock(m.lock).lock() : __),
		__ul: (m) => (isString(m.lock) ? $flock(m.lock).unlock() : __),
		__fext: (m) => (m.yaml ? ".yaml" : (m.toon ? ".toon" : ".json")),
		__r: (m) => {
			var r = {};
			if (!io.fileExists(m.file)) {
				if (m.tmp) {
					m.file = io.createTempFile("tmp-", "-" + m.file)
				} else {
					return r
				}
			}
			
			if (m.yaml) {
				if (m.gzip) {
					try {
						var is = io.readFileGzipStream(m.file)
						r = af.fromYAML(af.fromInputStream2String(is))
						if (m.multipart && isDef(m.key)) r = $a4m(r, m.key)
						is.close()
					} catch(e) {
						if (String(e).indexOf("java.io.EOFException") < 0) throw e	
					}
				} else if (m.lz4) {
					try {
						var is = io.readFileLZ4Stream(m.file)
						r = af.fromYAML(af.fromInputStream2String(is))
						if (m.multipart && isDef(m.key)) r = $a4m(r, m.key)
						is.close()
					} catch(e) {
						if (String(e).indexOf("java.io.EOFException") < 0) throw e	
					}
				} else {
					r = io.readFileYAML(m.file)
				}
			} else if (m.toon) {
				if (m.gzip) {
					try {
						var is = io.readFileGzipStream(m.file)
						r = af.fromTOON(af.fromInputStream2String(is))
						is.close()
					} catch(e) {
						if (String(e).indexOf("java.io.EOFException") < 0) throw e	
					}
				} else if (m.lz4) {
					try {
						var is = io.readFileLZ4Stream(m.file)
						r = af.fromTOON(af.fromInputStream2String(is))
						is.close()
					} catch(e) {
						if (String(e).indexOf("java.io.EOFException") < 0) throw e	
					}
				} else {
					r = af.fromTOON(io.readFileString(m.file))
				}
			} else {
				if (m.gzip) {
					try {
						var is = io.readFileGzipStream(m.file)
						r = jsonParse(af.fromInputStream2String(is), true)
						is.close()
					} catch(e) {
						if (String(e).indexOf("java.io.EOFException") < 0) throw e	
					}
				} else if (m.lz4) {
					try {
						var is = io.readFileLZ4Stream(m.file)
						r = jsonParse(af.fromInputStream2String(is), true)
						is.close()
					} catch(e) {
						if (String(e).indexOf("java.io.EOFException") < 0) throw e	
					}
				} else {
					r = io.readFileJSON(m.file)
				}
			}

			if (!isMap(r)) r = {};
			return r;
		},
		__rf: function(m, k) {
			var r = {};
			var _id = sha512(stringify(sortMapKeys(k, true)))

			if (!io.fileExists(m.path + "/" + _id + this.__fext(m) + (m.gzip ? ".gz" : (m.lz4 ? ".lz4" : "")))) {
				return __
			} else {
				if (m.yaml) {
					if (m.gzip) {
						var is = io.readFileGzipStream(m.path + "/" + _id + ".yaml.gz")
						r = af.fromYAML(af.fromInputStream2String(is))
						is.close()
					} else if (m.lz4) {
						var is = io.readFileLZ4Stream(m.path + "/" + _id + ".yaml.lz4")
						r = af.fromYAML(af.fromInputStream2String(is))
						is.close()
					} else {
						r = io.readFileYAML(m.path + "/" + _id + ".yaml")
					}
				} else if (m.toon) {
					if (m.gzip) {
						var is = io.readFileGzipStream(m.path + "/" + _id + ".toon.gz")
						r = af.fromTOON(af.fromInputStream2String(is))
						is.close()
					} else if (m.lz4) {
						var is = io.readFileLZ4Stream(m.path + "/" + _id + ".toon.lz4")
						r = af.fromTOON(af.fromInputStream2String(is))
						is.close()
					} else {
						r = af.fromTOON(io.readFileString(m.path + "/" + _id + ".toon"))
					}
				} else {
					if (m.gzip) {
						var is = io.readFileGzipStream(m.path + "/" + _id + ".json.gz")
						r = jsonParse(af.fromInputStream2String(is), true)
						is.close()
					} else if (m.lz4) {
						var is = io.readFileLZ4Stream(m.path + "/" + _id + ".json.lz4")
						r = jsonParse(af.fromInputStream2String(is), true)
						is.close()
					} else {
						r = io.readFileJSON(m.path + "/" + _id + ".json")
					}
				}
				if (!isMap(r)) r = {}
				return r
			}
		},
		__w: (m, o) => {
			if (!io.fileExists(m.file)) {
				if (m.tmp) {
					m.file = io.createTempFile("tmp-", "-" + m.file)
				}
			}
			if (m.yaml) {
				if (m.gzip) {
					var os = io.writeFileGzipStream(m.file)
					ioStreamWrite(os, af.toYAML((m.multipart && isDef(m.key) ? $m4a(o, m.key) : o), m.multipart))
					os.close()
				} else if (m.lz4) {
					var os = io.writeFileLZ4Stream(m.file)
					ioStreamWriteBytes(os, af.toYAML((m.multipart && isDef(m.key) ? $m4a(o, m.key) : o), m.multipart))
					os.close()
				} else {
					io.writeFileYAML(m.file, (m.multipart && isDef(m.key) ? $m4a(o, m.key) : o), m.multipart)
				}
			} else if (m.toon) {
				if (m.gzip) {
					var os = io.writeFileGzipStream(m.file)
					ioStreamWrite(os, af.toTOON(o))
					os.close()
				} else if (m.lz4) {
					var os = io.writeFileLZ4Stream(m.file)
					ioStreamWriteBytes(os, af.fromString2Bytes(af.toTOON(o)))
					os.close()
				} else {
					io.writeFileString(m.file, af.toTOON(o))
				}
			} else {
				if (m.gzip) {
					var os = io.writeFileGzipStream(m.file)
					ioStreamWrite(os, stringify(o, __, m.compact ? "" : __))
					os.close()
				} else if (m.lz4) {
					var os = io.writeFileLZ4Stream(m.file)
					ioStreamWriteBytes(os, stringify(o, __, m.compact ? "" : __))
					os.close()
				} else {
					io.writeFileJSON(m.file, o, m.compact ? "" : __)
				}
			}
		},
		__wf: (m, k, v) => {
			var _tmpf = io.createTempFile("tmp-", "")
			var _id = sha512(stringify(sortMapKeys(k, true)))

			if (m.yaml) {
				if (m.gzip) {
					var os = io.writeFileGzipStream(m.path + "/" + _id + ".yaml.gz")
					ioStreamWrite(os, af.toYAML(v, m.multipart))
					os.close()
				} else if (m.lz4) {
					var os = io.writeFileLZ4Stream(m.path + "/" + _id + ".yaml.lz4")
					ioStreamWriteBytes(os, af.toYAML(v, m.multipart))
					os.close()
				} else {
					io.writeFileYAML(m.path + "/" + _id + ".yaml", v, m.multipart)
				}
			} else if (m.toon) {
				if (m.gzip) {
					var os = io.writeFileGzipStream(m.path + "/" + _id + ".toon.gz")
					ioStreamWrite(os, af.toTOON(v))
					os.close()
				} else if (m.lz4) {
					var os = io.writeFileLZ4Stream(m.path + "/" + _id + ".toon.lz4")
					ioStreamWriteBytes(os, af.toTOON(v))
					os.close()
				} else {
					io.writeFileString(m.path + "/" + _id + ".toon", af.toTOON(v))
				}
			} else {
				if (m.gzip) {
					var os = io.writeFileGzipStream(m.path + "/" + _id + ".json.gz")
					ioStreamWrite(os, stringify(v, __, m.compact ? "" : __))
					os.close()
				} else if (m.lz4) {
					var os = io.writeFileLZ4Stream(m.path + "/" + _id + ".json.lz4")
					ioStreamWriteBytes(os, stringify(v, __, m.compact ? "" : __))
					os.close()
				} else {
					io.writeFileJSON(m.path + "/" + _id + ".json", v, m.compact ? "" : __)
				}
			}

			return _id
		},
		__df: function(m, k) {
			var _id = sha512(stringify(sortMapKeys(k, true)))
			try {
				io.rm(m.path + "/" + _id + this.__fext(m) + (m.gzip ? ".gz" : (m.lz4 ? ".lz4" : "")))
			} catch(e) {
				logErr("Error removing file: " + e)
				throw e
			}
		},
		create       : function(aName, shouldCompress, options) {
			ow.loadObj();
			options = _$(options).isMap().default({});
			this.__channels[aName] = {};
			this.__channels[aName].compact   = _$(options.compact, "options.compact").isBoolean().default(shouldCompress);
			this.__channels[aName].file      = _$(options.file, "options.file").isString().default(__)
			this.__channels[aName].path      = _$(options.path, "options.path").isString().default(__)
			this.__channels[aName].yaml      = _$(options.yaml, "options.yaml").isBoolean().default(false);
			this.__channels[aName].toon      = _$(options.toon, "options.toon").isBoolean().default(false);
			this.__channels[aName].multifile = _$(options.multifile, "options.multifile").isBoolean().default(false)
			this.__channels[aName].multipart = _$(options.multipart, "options.multipart").isBoolean().default(false);
			this.__channels[aName].multipath = _$(options.multipath, "options.multipath").isBoolean().default(false);
			this.__channels[aName].key       = _$(options.key, "options.key").isString().default(__);
			this.__channels[aName].lock      = _$(options.lock, "options.lock").isString().default(__);
			this.__channels[aName].gzip      = _$(options.gzip, "options.gzip").isBoolean().default(false)
			this.__channels[aName].lz4       = _$(options.lz4, "options.lz4").isBoolean().default(false)
			this.__channels[aName].tmp       = _$(options.tmp, "options.tmp").isBoolean().default(false)

			if (this.__channels[aName].lz4) this.__channels[aName].gzip = false
			if (this.__channels[aName].gzip) this.__channels[aName].lz4 = false
			if (this.__channels[aName].toon) this.__channels[aName].yaml = false

			if (this.__channels[aName].multifile) {
				this.__channels[aName].file = this.__channels[aName].path + "/index" + this.__fext(this.__channels[aName]) + (this.__channels[aName].gzip ? ".gz" : (this.__channels[aName].lz4 ? ".lz4" : ""))
			} else {
				if (isUnDef(this.__channels[aName].file) || this.__channels[aName].file === "") {
					this.__channels[aName].file = (isDef(this.__channels[aName].path) ? this.__channels[aName].path : ".") + "/data-" + aName + this.__fext(this.__channels[aName]) + (this.__channels[aName].gzip ? ".gz" : (this.__channels[aName].lz4 ? ".lz4" : ""))
				}
			}

		},
		destroy      : function(aName) {
			if (this.__channels[aName].tmp && io.fileExists(this.__channels[aName].file)) io.rm(this.__channels[aName].file)
			delete this.__channels[aName];
		},
		size         : function(aName) {
			var s;
			this.__l(this.__channels[aName]);
			try {
				s = Object.keys(this.__r(this.__channels[aName])).length;
			} finally {
				this.__ul(this.__channels[aName]);
			}
			
			return s;
		},
		forEach      : function(aName, aFunction) {
			var m;
			this.__l(this.__channels[aName]);
			try {
				m = this.__r(this.__channels[aName]);
			} finally {
				this.__ul(this.__channels[aName]);
			}
			Object.keys(m).forEach(k => {
				var key = jsonParse(k);
				if (!isMap(key)) key = k;
				if (this.__channels[aName].multifile) {
					try { aFunction(key, this.__rf(this.__channels[aName], key)) } catch(e) {}
				} else {
					try { aFunction(key, m[k]) } catch(e) {}
				}
			});
		},
		getAll      : function(aName, full) {
			var m, mv
			this.__l(this.__channels[aName]);
			try {
				m = this.__r(this.__channels[aName]);
				if (this.__channels[aName].multifile) {
					mv = Object.keys(m).map(k => this.__rf(this.__channels[aName], jsonParse(k)))
				} 
			} finally {
				this.__ul(this.__channels[aName]);
			}
			return this.__channels[aName].multifile ? mv : Object.values(m)
		},
		getKeys      : function(aName, full) {
			var m;
			this.__l(this.__channels[aName]);
			try {
				m = this.__r(this.__channels[aName]);
			} finally {
				this.__ul(this.__channels[aName]);
			}
			return Object.keys(m).map(k => jsonParse(k));
		},
		getSortedKeys: function(aName, full) {
			var m;
			this.__l(this.__channels[aName]);
			try {
				m = this.__r(this.__channels[aName]);
			} finally {
				this.__ul(this.__channels[aName]);
			}
			var res = Object.keys(m).map(k => jsonParse(k)); 
			return res;	
		},
		getSet       : function getSet(aName, aMatch, aK, aV, aTimestamp)  {
			var res;
			res = this.get(aName, aK);
			if ($stream([res]).anyMatch(aMatch)) {
				return this.set(aName, aK, aV, aTimestamp);
			}
			return __;
		},
		set          : function(aName, aK, aV, aTimestamp) {
			var m;
			this.__l(this.__channels[aName]);
			try {
				m = this.__r(this.__channels[aName]);
				if (isMap(aK) && isDef(aK[this.__channels[aName].key])) aK = { key: aK[this.__channels[aName].key] };
				var id = isDef(aK.key)   ? aK.key   : stringify(sortMapKeys(aK), __, "");

				if (this.__channels[aName].multifile) {
					var _id = this.__wf(this.__channels[aName], aK, aV)
					if (isString(id) && id.indexOf(".") > 0 && this.__channels[aName].multipath) {
						ow.obj.setPath(m, id, _id)
					} else {
						m[id] = _id
					}  
				} else {
					if (isString(id) && id.indexOf(".") > 0 && this.__channels[aName].multipath) {
						ow.obj.setPath(m, id, isDef(aV.value) ? aV.value : aV);
					} else {
						m[id]  = isDef(aV.value) ? aV.value : aV;
					}
				}
				this.__w(this.__channels[aName], m);
			} finally {
				this.__ul(this.__channels[aName]);
			}
			
			return aK;
		},
		setAll       : function(aName, aKs, aVs, aTimestamp) {
			ow.loadObj();

			var m;
			this.__l(this.__channels[aName]);
			try {
				m = this.__r(this.__channels[aName]);
				for(var i in aVs) {
					var aK = ow.obj.filterKeys(aKs, aVs[i]), aV = aVs[i]

					if (isMap(aK) && isDef(aK[this.__channels[aName].key])) aK = { key: aK[this.__channels[aName].key] };
					var id = isDef(aK.key)   ? aK.key   : stringify(sortMapKeys(aK), __, "");

					if (this.__channels[aName].multifile) {
						var _id = this.__wf(this.__channels[aName], aK, aV)
						if (isString(id) && id.indexOf(".") > 0 && this.__channels[aName].multipath) {
							ow.obj.setPath(m, id, _id)
						} else {
							m[id] = _id
						}  
					} else {
						if (isString(id) && id.indexOf(".") > 0 && this.__channels[aName].multipath) {
							ow.obj.setPath(m, id, isDef(aV.value) ? aV.value : aV);
						} else {
							m[id] = isDef(aV.value) ? aV.value : aV;
						}
					}
				}
				this.__w(this.__channels[aName], m);
			} finally {
				this.__ul(this.__channels[aName]);
			}
		},
		unsetAll     : function(aName, aKs, aVs, aTimestamp) {
			ow.loadObj();
			var m;
			this.__l(this.__channels[aName]);
			try {
				m = this.__r(this.__channels[aName]);
				for(var i in aVs) {
					var aK = ow.obj.filterKeys(aKs, aVs[i]), aV = aVs[i]
					
					if (isMap(aK) && isDef(aK[this.__channels[aName].key])) aK = { key: aK[this.__channels[aName].key] };
					var id = isDef(aK.key)   ? aK.key   : stringify(sortMapKeys(aK), __, "");
					delete m[id];
					if (isString(id) && id.indexOf(".") > 0 && this.__channels[aName].multipath) {
						ow.obj.setPath(m, id, __);
					} else {
						delete m[id];
					}

					if (this.__channels[aName].multifile) {
						this.__df(this.__channels[aName], aK)
					}
				}
				this.__w(this.__channels[aName], m);
			} finally {
				this.__ul(this.__channels[aName]);
			}
		},		
		get          : function(aName, aK) {
			if (isMap(aK) && isDef(aK[this.__channels[aName].key])) aK = { key: aK[this.__channels[aName].key] };
			if (this.__channels[aName].multifile) {
				return this.__rf(this.__channels[aName], aK)
			} else {
				var m;
				this.__l(this.__channels[aName]);
				try {
					m = this.__r(this.__channels[aName]);
				} finally {
					this.__ul(this.__channels[aName]);
				}
				var id = isDef(aK.key)   ? aK.key   : stringify(sortMapKeys(aK), __, "");
				if (isString(id) && id.indexOf(".") > 0 && this.__channels[aName].multipath) {
					return ow.obj.getPath(m, id);
				} else {
					return m[id];
				}
			}
		},
		pop          : function(aName) {
			var elems = this.getSortedKeys(aName);
			var elem = elems[elems.length - 1];
			return elem;
		},
		shift        : function(aName) {
			var elems = this.getSortedKeys(aName); 
			var elem = elems[0];
			return elem;
		},
		unset        : function(aName, aK, aTimestamp) {
			var m;
			this.__l(this.__channels[aName]);
			try {
				m = this.__r(this.__channels[aName]);
				if (isMap(aK) && isDef(aK[this.__channels[aName].key])) aK = { key: aK[this.__channels[aName].key] };
				var id = isDef(aK.key)   ? aK.key   : stringify(sortMapKeys(aK), __, "");
				delete m[id];
				if (isString(id) && id.indexOf(".") > 0 && this.__channels[aName].multipath) {
					ow.obj.setPath(m, id, __);
				} else {
					delete m[id];
				}
				this.__w(this.__channels[aName], m);
				if (this.__channels[aName].multifile) this.__df(this.__channels[aName], aK)
			} finally {
				this.__ul(this.__channels[aName]);
			}
		}
	},	
	// Graph implementation
	//
	/**
	 * <odoc format="markdown">
	 * <key>ow.ch.types.graph</key>
	 * <![CDATA[
	 * Channel over a knowledge graph stored in a single JSON file, using the Mini-A wiki graph format:
	 * `{ version, nodes: { id: { id, type, props } }, edges: [ { from, to, type, provenance, props } ], ... }`.
	 *
	 * Creation options:
	 *
	 * | Option | Type | Default | Description |
	 * | --- | --- | --- | --- |
	 * | `file` | String | _required_ | Path to the graph JSON file |
	 * | `readOnly` | Boolean | `false` | Reject changes and never write the file |
	 * | `create` | Boolean | `true` | If `false` the file must already exist; otherwise an empty graph is started |
	 * | `autosave` | String | `"always"` | `"always"`, `"debounced"` or `"off"`; pending changes are always flushed on destroy |
	 * | `saveDebounceMs` | Number | `5000` | Minimum ms between saves when `autosave` is `"debounced"` |
	 * | `lock` | String | | Path to a dummy file used as a filesystem lock while loading/saving |
	 * | `store` | Map | | `{ type, options, compress, bulk }`: keep nodes, edges and other sections in channels of that type (e.g. `mvs`) instead of memory; can't be combined with `file` |
	 *
	 * Keys and values:
	 *
	 * - **Node**: key `{ id }` (e.g. `{ id: "doc:readme.md" }`), value `{ id, type, props }`.
	 * - **Edge**: key `{ from, to, type, provenance, page, section }`, value `{ from, to, type, provenance, props }`.
	 *   `provenance` is `EXTRACTED`, `INFERRED` or `AMBIGUOUS` (default); `page` and `section` map to `props.page` and `props.section`.
	 * - Setting an edge requires both nodes to exist; unsetting a node also removes its edges.
	 * - File sections not handled by the channel (e.g. `communities`, `summaries`) are preserved on save.
	 *
	 * Example:
	 *
	 * ```javascript
	 * $ch("g").create(true, "graph", { file: "graph.json" });
	 * $ch("g").set({ id: "doc:a.md" }, { type: "document", props: { title: "A" } });
	 * $ch("g").set({ id: "doc:b.md" }, { type: "document", props: { title: "B" } });
	 * $ch("g").set({ from: "doc:a.md", to: "doc:b.md", type: "LINKS_TO" }, {});
	 * ow.ch.utils.graph.path("g", "a.md", "b.md"); // [ "doc:a.md", "doc:b.md" ]
	 * ```
	 *
	 * Use `ow.ch.utils.graph` to navigate the graph. The whole file is rewritten on save, so avoid several writers over the same file.
	 * ]]>
	 * </odoc>
	 */
	graph: {
		__channels: Object.create(null),
		__prov: [ "EXTRACTED", "INFERRED", "AMBIGUOUS" ],
		__nprov: function(p) {
			p = isString(p) ? p.toUpperCase().trim() : "AMBIGUOUS"
			return this.__prov.indexOf(p) >= 0 ? p : "AMBIGUOUS"
		},
		__ekey: function(f, t, ty, pr, pg, sc) {
			return stringify([ f, t, ty, this.__nprov(pr), isString(pg) ? pg : "", isString(sc) ? sc : "" ], __, "")
		},
		__isEdge: function(k) { return isMap(k) && isDef(k.from) && isDef(k.to) },
		__isNode: function(k) { return isMap(k) && isDef(k.id) && isUnDef(k.from) && isUnDef(k.to) },
		__edgeKeyOf: function(e) {
			var p = isMap(e.props) ? e.props : {}
			return this.__ekey(e.from, e.to, e.type, e.provenance, p.page, p.section)
		},
		__keyOfEdge: function(e) {
			var p = isMap(e.props) ? e.props : {}
			return { from: e.from, to: e.to, type: e.type, provenance: this.__nprov(e.provenance), page: isString(p.page) ? p.page : "", section: isString(p.section) ? p.section : "" }
		},
		__c: function(aName) {
			var c = this.__channels[aName]
			if (isUnDef(c)) throw "graph channel '" + aName + "' not found"
			return c
		},
		__l: (m) => (isString(m.lock) ? $flock(m.lock).lock() : __),
		__ul: (m) => (isString(m.lock) ? $flock(m.lock).unlock() : __),
		__empty: function() {
			return { version: 2, created_at: new Date().toISOString(), nodes: {}, edges: [], summaries: { pages: {}, communities: {} }, semantic_cache: {}, communities: [], surprise: [] }
		},
		// (re)build the edge index and adjacency from the state
		__index: function(c) {
			var s = c.state, self = this
			if (!isMap(s.nodes)) s.nodes = {}
			c.eidx = {}
			c.adj = {}
			var edges = []
			;(isArray(s.edges) ? s.edges : []).forEach(function(e) {
				if (!isMap(e) || e._deleted === true) return
				e.provenance = self.__nprov(e.provenance)
				if (!isMap(e.props)) e.props = {}
				var k = self.__edgeKeyOf(e)
				if (isDef(c.eidx[k])) return
				c.eidx[k] = e
				edges.push(e)
				if (isUnDef(c.adj[e.from])) c.adj[e.from] = []
				if (isUnDef(c.adj[e.to])) c.adj[e.to] = []
				c.adj[e.from].push(e)
				if (e.to !== e.from) c.adj[e.to].push(e)
			})
			s.edges = edges
		},
		__load: function(c) {
			var o = c.opts
			if (isDef(o.store)) return this.__loadStore(c)
			c.st = this.__memStore(c)
			this.__l(o)
			try {
				if (io.fileExists(o.file)) {
					var r = io.readFileJSON(o.file)
					if (!isMap(r)) throw "graph file '" + o.file + "' doesn't contain a valid graph"
					c.state = merge(this.__empty(), r)
				} else {
					if (o.create === false) throw "graph file '" + o.file + "' not found"
					c.state = this.__empty()
				}
			} finally {
				this.__ul(o)
			}
			this.__index(c)
			c.dirty = false
			c.lastSave = 0
		},
		__flush: function(c) {
			var o = c.opts
			if (o.readOnly) return false
			if (isDef(o.store)) return true
			this.__l(o)
			try {
				var dir = new java.io.File(o.file).getAbsoluteFile().getParentFile()
				if (isDef(dir) && !dir.exists()) dir.mkdirs()
				var tmp = o.file + "." + java.util.UUID.randomUUID() + ".tmp"
				try {
					io.writeFileString(tmp, stringify(c.state, __, ""))
					java.nio.file.Files.move(new java.io.File(tmp).toPath(), new java.io.File(o.file).toPath(), java.nio.file.StandardCopyOption.ATOMIC_MOVE, java.nio.file.StandardCopyOption.REPLACE_EXISTING)
				} finally {
					java.nio.file.Files.deleteIfExists(new java.io.File(tmp).toPath())
				}
			} finally {
				this.__ul(o)
			}
			c.dirty = false
			c.lastSave = now()
			return true
		},
		__changed: function(c) {
			if (isDef(c.opts.store)) return
			c.dirty = true
			if (c.opts.autosave === "always") {
				this.__flush(c)
			} else if (c.opts.autosave === "debounced" && now() - c.lastSave >= c.opts.saveDebounceMs) {
				this.__flush(c)
			}
		},
		__rw: function(c) {
			if (c.opts.readOnly) throw "graph channel is read-only"
		},
		__nodeVal: function(n) { return { id: n.id, type: n.type, props: isMap(n.props) ? clone(n.props) : {} } },
		__edgeVal: function(e) { return { from: e.from, to: e.to, type: e.type, provenance: e.provenance, props: isMap(e.props) ? clone(e.props) : {} } },
		// Storage backends: every access to nodes and edges goes through c.st
		// memory: everything held in c.state (+ edge index and adjacency)
		__memStore: function(c) {
			var self = this
			var delEdge = function(e) {
				delete c.eidx[self.__edgeKeyOf(e)]
				c.state.edges = c.state.edges.filter(x => x !== e)
				;[ e.from, e.to ].forEach(id => { if (isArray(c.adj[id])) c.adj[id] = c.adj[id].filter(x => x !== e) })
			}
			return {
				getNode  : id => c.state.nodes[id],
				putNode  : n => { c.state.nodes[n.id] = n },
				nodeIds  : () => Object.keys(c.state.nodes),
				nodeCount: () => Object.keys(c.state.nodes).length,
				getEdge  : k => c.eidx[k],
				putEdge  : e => {
					var k = self.__edgeKeyOf(e), old = c.eidx[k]
					if (isDef(old)) { old.props = e.props; return }
					c.eidx[k] = e
					c.state.edges.push(e)
					if (isUnDef(c.adj[e.from])) c.adj[e.from] = []
					if (isUnDef(c.adj[e.to])) c.adj[e.to] = []
					c.adj[e.from].push(e)
					if (e.to !== e.from) c.adj[e.to].push(e)
				},
				bulk     : false,
				delEdge  : delEdge,
				edgesOf  : id => (c.adj[id] || []),
				edges    : () => c.state.edges,
				edgeCount: () => c.state.edges.length,
				delNode  : id => {
					(c.adj[id] || []).slice().forEach(delEdge)
					delete c.adj[id]
					delete c.state.nodes[id]
				},
				close    : () => {}
			}
		},
		// channel: nodes, edges, adjacency and the remaining sections are delegated to other channels (e.g. mvs)
		__chStore: function(c, aName) {
			var self = this, spec = c.opts.store, pre = "graph::" + aName + "::", n = {}
			var parts = [ "nodes", "edges", "adj", "meta" ], made = []
			var close = () => made.forEach(x => { try { $ch(x).destroy() } catch(e) {} })
			try {
				parts.forEach(p => {
					n[p] = pre + p
					var o = isFunction(spec.options) ? spec.options(p) : merge(isMap(spec.options) ? clone(spec.options) : {}, { map: pre + p })
					$ch(n[p]).create(spec.compress === true, spec.type, o)
					made.push(n[p])
				})
			} catch(e) { close(); throw e }
			var edgesOf = id => {
				var a = $ch(n.adj).get({ id: id })
				return isMap(a) ? a.ks.map(k => $ch(n.edges).get({ k: k })).filter(isMap) : []
			}
			var addAdj = (id, k) => {
				var a = $ch(n.adj).get({ id: id })
				a = isMap(a) ? a : { id: id, ks: [] }
				a.ks.push(k)
				$ch(n.adj).set({ id: id }, a)
			}
			var delAdj = (id, k) => {
				var a = $ch(n.adj).get({ id: id })
				if (!isMap(a)) return
				a.ks = a.ks.filter(x => x !== k)
				if (a.ks.length == 0) $ch(n.adj).unset({ id: id }); else $ch(n.adj).set({ id: id }, a)
			}
			var delEdge = e => {
				var k = self.__edgeKeyOf(e)
				$ch(n.edges).unset({ k: k })
				delAdj(e.from, k)
				if (e.to !== e.from) delAdj(e.to, k)
			}
			return {
				names    : n,
				getNode  : id => $ch(n.nodes).get({ id: id }),
				putNode  : nd => { $ch(n.nodes).set({ id: nd.id }, nd) },
				nodeIds  : () => $ch(n.nodes).getKeys().map(k => k.id),
				nodeCount: () => $ch(n.nodes).size(),
				getEdge  : k => $ch(n.edges).get({ k: k }),
				bulk     : spec.bulk === true || (spec.bulk !== false && spec.type == "mvs"),
				putBatch : (nodes, edges) => {
					if (nodes.length > 0) $ch(n.nodes).setAll([ "id" ], nodes)
					var uniq = {}, adds = {}, ids = []
					edges.forEach(e => { uniq[self.__edgeKeyOf(e)] = e })
					var vals = Object.keys(uniq).map(k => {
						var e = uniq[k]
						if (!isMap($ch(n.edges).get({ k: k }))) {
							;(e.to !== e.from ? [ e.from, e.to ] : [ e.from ]).forEach(id => {
								if (isUnDef(adds[id])) { adds[id] = []; ids.push(id) }
								adds[id].push(k)
							})
						}
						return merge(e, { k: k })
					})
					if (vals.length > 0) $ch(n.edges).setAll([ "k" ], vals)
					var recs = ids.map(id => {
						var a = $ch(n.adj).get({ id: id })
						return { id: id, ks: (isMap(a) ? a.ks : []).concat(adds[id]) }
					})
					if (recs.length > 0) $ch(n.adj).setAll([ "id" ], recs)
				},
				putEdge  : e => {
					var k = self.__edgeKeyOf(e), old = $ch(n.edges).get({ k: k })
					$ch(n.edges).set({ k: k }, merge(e, { k: k }))
					if (!isMap(old)) {
						addAdj(e.from, k)
						if (e.to !== e.from) addAdj(e.to, k)
					}
				},
				delEdge  : delEdge,
				edgesOf  : edgesOf,
				edges    : () => $ch(n.edges).getAll(),
				edgeCount: () => $ch(n.edges).size(),
				delNode  : id => {
					edgesOf(id).forEach(delEdge)
					$ch(n.adj).unset({ id: id })
					$ch(n.nodes).unset({ id: id })
				},
				close    : close
			}
		},
		__loadStore: function(c) {
			var o = c.opts, st = this.__chStore(c, c.name)
			c.st = st
			try {
				var meta = $ch(st.names.meta).get({ k: "meta" })
				if (!isMap(meta)) {
					if (o.create === false) throw "graph store for '" + c.name + "' not found"
					meta = { k: "meta", state: this.__empty() }
					delete meta.state.nodes
					delete meta.state.edges
					if (!o.readOnly) $ch(st.names.meta).set({ k: "meta" }, meta)
				}
				c.state = meta.state
			} catch(e) { st.close(); throw e }
			c.dirty = false
			c.lastSave = 0
		},
		// public helpers used by ow.ch.utils.graph
		__getNode: function(aName, id) { return this.__c(aName).st.getNode(id) },
		__nodeIds: function(aName) { return this.__c(aName).st.nodeIds() },
		__edgesOf: function(aName, id) { return this.__c(aName).st.edgesOf(id) },
		__edges: function(aName) { return this.__c(aName).st.edges() },
		__save: function(aName) { return this.__flush(this.__c(aName)) },
		create       : function(aName, shouldCompress, options) {
			options = _$(options, "options").isMap().default({})
			var o = {
				file          : isDef(options.store) ? options.file : _$(options.file, "options.file").isString().$_(),
				store         : isDef(options.store) ? _$(options.store, "options.store").isMap().$_() : __,
				readOnly      : _$(options.readOnly, "options.readOnly").isBoolean().default(false),
				create        : _$(options.create, "options.create").isBoolean().default(true),
				autosave      : String(_$(options.autosave, "options.autosave").isString().default("always")).toLowerCase(),
				saveDebounceMs: _$(options.saveDebounceMs, "options.saveDebounceMs").isNumber().default(5000),
				lock          : options.lock
			}
			if (["always", "debounced", "off"].indexOf(o.autosave) < 0) throw "options.autosave must be 'always', 'debounced' or 'off'"
			if (isDef(o.store)) {
				_$(o.store.type, "options.store.type").isString().$_()
				if (isDef(o.file)) throw "options.file and options.store can't be used together"
			}
			var c = { opts: o, name: aName }
			this.__load(c)
			this.__channels[aName] = c
		},
		destroy      : function(aName) {
			var c = this.__channels[aName]
			if (isUnDef(c)) return
			try { if (c.dirty && !c.opts.readOnly) this.__flush(c) } finally { delete this.__channels[aName]; c.st.close() }
		},
		size         : function(aName) {
			var c = this.__c(aName)
			return c.st.nodeCount() + c.st.edgeCount()
		},
		forEach      : function(aName, aFunction) {
			var ks = this.getKeys(aName)
			for (var i = 0; i < ks.length; i++) {
				try { aFunction(ks[i], this.get(aName, ks[i])) } catch(e) {}
			}
		},
		getAll       : function(aName, full) {
			var c = this.__c(aName), self = this
			return c.st.nodeIds().map(id => self.__nodeVal(c.st.getNode(id))).concat(c.st.edges().map(e => self.__edgeVal(e)))
		},
		getKeys      : function(aName, full) {
			var c = this.__c(aName), self = this
			return c.st.nodeIds().map(id => ({ id: id })).concat(c.st.edges().map(e => self.__keyOfEdge(e)))
		},
		getSortedKeys: function(aName, full) {
			var c = this.__c(aName), self = this
			var ns = c.st.nodeIds().sort().map(id => ({ id: id }))
			var es = c.st.edges().map(e => self.__keyOfEdge(e)).sort((a, b) => stringify([a.from, a.to, a.type, a.provenance, a.page, a.section], __, "") < stringify([b.from, b.to, b.type, b.provenance, b.page, b.section], __, "") ? -1 : 1)
			return ns.concat(es)
		},
		getSet       : function getSet(aName, aMatch, aK, aV, aTimestamp)  {
			var res = this.get(aName, aK)
			if ($stream([res]).anyMatch(aMatch)) {
				return this.set(aName, aK, aV, aTimestamp)
			}
			return __
		},
		// validates a key/value and returns { node } or { edge }; pend (optional) holds nodes of the same batch not yet stored
		__prep       : function(c, aK, aV, pend) {
			aV = isMap(aV) ? aV : {}
			var getN = id => (isDef(pend) && isMap(pend[id])) ? pend[id] : c.st.getNode(id)
			if (this.__isEdge(aK)) {
				var from = String(aK.from), to = String(aK.to)
				var type = isString(aK.type) ? aK.type : aV.type
				if (!isString(type) || type.length == 0) throw "graph edge requires a type"
				if (!isMap(getN(from)) || !isMap(getN(to))) throw "graph edge requires existing nodes (" + from + " -> " + to + ")"
				var props = isMap(aV.props) ? clone(aV.props) : {}
				if (isString(aK.page) && aK.page.length > 0) props.page = aK.page
				if (isString(aK.section) && aK.section.length > 0) props.section = aK.section
				var prov = this.__nprov(isDef(aK.provenance) ? aK.provenance : aV.provenance)
				return { edge: { from: from, to: to, type: type, provenance: prov, props: props } }
			} else if (this.__isNode(aK)) {
				var id = String(aK.id)
				if (id.length == 0) throw "graph node requires a non empty id"
				var n = getN(id)
				var ntype = isString(aV.type) && aV.type.length > 0 ? aV.type : (isMap(n) ? n.type : "concept")
				return { node: { id: id, type: ntype, props: isMap(aV.props) ? clone(aV.props) : {} } }
			}
			throw "graph key must have 'id' (node) or 'from' and 'to' (edge)"
		},
		set          : function(aName, aK, aV, aTimestamp) {
			var c = this.__c(aName)
			this.__rw(c)
			var r = this.__prep(c, aK, aV)
			if (isDef(r.edge)) c.st.putEdge(r.edge); else c.st.putNode(r.node)
			this.__changed(c)
			return aK
		},
		// one change notification (and, with a bulk capable store, one write) for the whole batch
		setAll       : function(aName, aKs, aVs, aTimestamp) {
			ow.loadObj()
			var c = this.__c(aName)
			this.__rw(c)
			var pend = {}, nodes = [], edges = []
			for(var i = 0; i < aVs.length; i++) {
				var r = this.__prep(c, ow.obj.filterKeys(aKs, aVs[i]), aVs[i], pend)
				if (isDef(r.node)) { pend[r.node.id] = r.node; nodes.push(r.node) } else edges.push(r.edge)
				if (!c.st.bulk) { if (isDef(r.node)) c.st.putNode(r.node); else c.st.putEdge(r.edge) }
			}
			if (c.st.bulk) c.st.putBatch(nodes, edges)
			this.__changed(c)
		},
		unsetAll     : function(aName, aKs, aVs, aTimestamp) {
			ow.loadObj()
			for(var i = 0; i < aVs.length; i++) {
				this.unset(aName, ow.obj.filterKeys(aKs, aVs[i]), aTimestamp)
			}
		},
		get          : function(aName, aK) {
			var c = this.__c(aName)
			if (this.__isEdge(aK)) {
				var e = c.st.getEdge(this.__ekey(String(aK.from), String(aK.to), aK.type, aK.provenance, aK.page, aK.section))
				return isMap(e) ? this.__edgeVal(e) : __
			}
			if (this.__isNode(aK)) {
				var n = c.st.getNode(String(aK.id))
				return isMap(n) ? this.__nodeVal(n) : __
			}
			return __
		},
		pop          : function(aName) {
			var elems = this.getSortedKeys(aName)
			return elems[elems.length - 1]
		},
		shift        : function(aName) {
			var elems = this.getSortedKeys(aName)
			return elems[0]
		},
		unset        : function(aName, aK, aTimestamp) {
			var c = this.__c(aName)
			this.__rw(c)
			if (this.__isEdge(aK)) {
				var e = c.st.getEdge(this.__ekey(String(aK.from), String(aK.to), aK.type, aK.provenance, aK.page, aK.section))
				if (!isMap(e)) return
				c.st.delEdge(e)
			} else if (this.__isNode(aK)) {
				var id = String(aK.id)
				if (!isMap(c.st.getNode(id))) return
				c.st.delNode(id)
			} else {
				return
			}
			this.__changed(c)
		}
	},
	// Time series implementation
	//
	/**
	 * <odoc format="markdown">
	 * <key>ow.ch.types.timeseries</key>
	 * <![CDATA[
	 * Channel over labelled numeric time series (metric + labels + timestamp), kept in memory with an optional append-only NDJSON file,
	 * or delegated to other channels (e.g. `mvs`) with `store`. Supports retention (age and/or count) and stored rollups (RRD-like).
	 *
	 * Creation options:
	 *
	 * | Option | Type | Default | Description |
	 * | --- | --- | --- | --- |
	 * | `file` | String | | Path to an NDJSON log file. Without `file` (and `store`) the channel only lives in memory |
	 * | `readOnly` | Boolean | `false` | Reject changes and never write the file |
	 * | `create` | Boolean | `true` | If `false` the file (or store) must already exist |
	 * | `autosave` | String | `"always"` | `"always"` appends on every change, `"debounced"` appends at most every `saveDebounceMs`, `"off"` only on `save`/destroy |
	 * | `saveDebounceMs` | Number | `5000` | Minimum ms between appends when `autosave` is `"debounced"` |
	 * | `lock` | String | | Path to a dummy file used as a filesystem lock while loading and writing |
	 * | `compactRatio` | Number | `0.5` | The file is rewritten (compacted) when more than this ratio of its lines is dead (overwritten, deleted or expired) |
	 * | `store` | Map | | `{ type, options, compress, bulk }`: keep the data in chunks stored on channels of that type (e.g. `mvs`); can't be combined with `file` |
	 * | `chunk` | String/Number | `"1h"` | Time span of each stored chunk (only used with `store`) |
	 * | `retention` | String/Number | | How long to keep raw points (e.g. `"7d"`), relative to the newest point of each series (see `retentionRef`). Same as `raw.keep` |
	 * | `maxPoints` | Number | | Maximum raw points per series. Same as `raw.maxPoints` |
	 * | `raw` | Map | | `{ keep, maxPoints }` for the raw points |
	 * | `rollups` | Array | | `[ { step: "1m", keep: "1d" }, { step: "1h", keep: "30d" } ]`: aggregated buckets kept per series (`count`, `sum`, `min`, `max`, `first`, `last`) |
	 * | `retentionRef` | String | `"series"` | `"series"` measures `keep` back from the newest point of the series, `"now"` from the current time |
	 * | `housekeepEveryMs` | Number | `0` | Minimum ms between retention runs triggered by writes (`0` = on every write) |
	 *
	 * Keys and values:
	 *
	 * - **Key**: `{ metric, labels, ts }`. `labels` is a map (values are stored as strings); `ts` is epoch ms, a Date or an ISO string (defaults to now on `set`).
	 * - **Value**: `{ v }` where `v` is a number.
	 * - `get` without `ts` returns the latest point; the value returned is always `{ metric, labels, ts, v }`.
	 * - `unset` with `ts` removes a point; without `ts` it drops the whole series (points and rollups).
	 * - `getKeys`/`getAll` accept a selector map `{ metric, labels, from, to }`; `pop`/`shift` return the key of the newest/oldest point.
	 *
	 * Example:
	 *
	 * ```javascript
	 * $ch("m").create(true, "timeseries", { file: "cpu.ndjson", retention: "7d" });
	 * $ch("m").set({ metric: "cpu", labels: { host: "a" }, ts: 1000 }, { v: 0.4 });
	 * $ch("m").set({ metric: "cpu", labels: { host: "a" }, ts: 2000 }, { v: 0.6 });
	 * ow.ch.utils.timeseries.range("m", { metric: "cpu" }, { step: "1s", fn: "avg" });
	 * ```
	 *
	 * Retention deletes made by the channel itself do not notify channel subscribers. Use `ow.ch.utils.timeseries` to query.
	 * ]]>
	 * </odoc>
	 */
	timeseries: {
		__channels: Object.create(null),
		__c: function(aName) {
			var c = this.__channels[aName]
			if (isUnDef(c)) throw "timeseries channel '" + aName + "' not found"
			return c
		},
		__l: (m) => (isString(m.lock) ? $flock(m.lock).lock() : __),
		__ul: (m) => (isString(m.lock) ? $flock(m.lock).unlock() : __),
		__rw: function(c) {
			if (c.opts.readOnly) throw "timeseries channel is read-only"
		},
		// ---- value helpers
		__ts: function(t) {
			if (isUnDef(t) || t === null) return now()
			var r
			if (isNumber(t)) r = t
			else if (isDate(t)) r = t.getTime()
			else if (isString(t)) r = /^\s*-?\d+(\.\d+)?\s*$/.test(t) ? Number(t) : (new Date(t)).getTime()
			if (!isNumber(r) || isNaN(r) || !isFinite(r)) throw "timeseries: invalid timestamp '" + t + "'"
			return Math.floor(r)
		},
		__dur: function(d, what) {
			if (isUnDef(d) || d === null) return __
			var r = isString(d) ? ow.loadFormat().fromTimeAbbreviation(d) : d
			if (!isNumber(r) || isNaN(r) || !(r > 0)) throw "timeseries: invalid duration for " + what + " (" + d + ")"
			return r
		},
		__val: function(v) {
			if (isMap(v)) v = v.v
			if (isString(v) && v.trim().length > 0) v = Number(v)
			if (!isNumber(v) || isNaN(v) || !isFinite(v)) throw "timeseries value 'v' must be a finite number"
			return v
		},
		__labels: function(l) {
			if (isUnDef(l) || l === null) return {}
			if (!isMap(l)) throw "timeseries labels must be a map"
			var r = {}
			Object.keys(l).sort().forEach(k => { if (isDef(l[k]) && l[k] !== null) r[k] = String(l[k]) })
			return r
		},
		__sid: function(metric, labels) {
			return stringify([ metric, labels ], __, "")
		},
		// validates a key; ts is only normalized when present
		__key: function(k) {
			if (!isMap(k) || !isString(k.metric) || k.metric.length == 0) throw "timeseries key must have a 'metric' and optionally 'labels' and 'ts'"
			var labels = this.__labels(k.labels)
			return { id: this.__sid(k.metric, labels), metric: k.metric, labels: labels, ts: isDef(k.ts) ? this.__ts(k.ts) : __ }
		},
		__pt: function(m, t, v) {
			return { metric: m.metric, labels: clone(m.labels), ts: t, v: v }
		},
		// selector matching: String/Number, Array (any), RegExp or Function
		__m: function(want, have) {
			if (isUnDef(want)) return true
			if (isArray(want)) return want.some(w => this.__m(w, have))
			if (Object.prototype.toString.call(want) == "[object RegExp]") return isDef(have) && want.test(String(have))
			if (isFunction(want)) return want(have) === true
			return isDef(have) && String(want) === String(have)
		},
		__match: function(m, sel) {
			if (!this.__m(sel.metric, m.metric)) return false
			if (isMap(sel.labels)) {
				for (var k in sel.labels) if (!this.__m(sel.labels[k], m.labels[k])) return false
			}
			return true
		},
		__select: function(c, sel) {
			var self = this
			sel = isMap(sel) ? sel : {}
			return c.st.ids().filter(id => self.__match(c.st.meta(id), sel)).sort()
		},
		// ---- sorted array helpers over { ts: [], v: [] }
		__lb: function(a, x) { var lo = 0, hi = a.length; while (lo < hi) { var m = (lo + hi) >>> 1; if (a[m] < x) lo = m + 1; else hi = m } return lo },
		__ub: function(a, x) { var lo = 0, hi = a.length; while (lo < hi) { var m = (lo + hi) >>> 1; if (a[m] <= x) lo = m + 1; else hi = m } return lo },
		// upserts into o; returns how many entries were added (not replaced)
		__put: function(o, ts, v) {
			var added = 0
			for (var i = 0; i < ts.length; i++) {
				var t = ts[i], n = o.ts.length
				if (n == 0 || t > o.ts[n - 1]) {
					o.ts.push(t); o.v.push(v[i]); added++
				} else {
					var p = this.__lb(o.ts, t)
					if (o.ts[p] === t) o.v[p] = v[i]
					else { o.ts.splice(p, 0, t); o.v.splice(p, 0, v[i]); added++ }
				}
			}
			return added
		},
		__rm: function(o, ts) {
			var removed = 0
			for (var i = 0; i < ts.length; i++) {
				var p = this.__lb(o.ts, ts[i])
				if (o.ts[p] === ts[i]) { o.ts.splice(p, 1); o.v.splice(p, 1); removed++ }
			}
			return removed
		},
		// ---- aggregates (rollup buckets)
		__a0: function(t, v) { return { count: 1, sum: v, min: v, max: v, first: v, last: v, ft: t, lt: t } },
		__am: function(a, b) {
			if (isUnDef(a)) return b
			if (isUnDef(b)) return a
			return {
				count: a.count + b.count, sum: a.sum + b.sum, min: Math.min(a.min, b.min), max: Math.max(a.max, b.max),
				first: b.ft < a.ft ? b.first : a.first, ft: Math.min(a.ft, b.ft),
				last : b.lt >= a.lt ? b.last : a.last, lt: Math.max(a.lt, b.lt)
			}
		},
		__ae: function(a) { return [ a.count, a.sum, a.min, a.max, a.first, a.last, a.ft, a.lt ] },
		__ad: function(a) { return { count: a[0], sum: a[1], min: a[2], max: a[3], first: a[4], last: a[5], ft: a[6], lt: a[7] } },
		// ---- storage backends: every access goes through c.st
		// memory
		__memStore: function(c) {
			var self = this, S = {}
			var T = (id, k) => { var s = S[id]; if (isUnDef(s.t[k])) s.t[k] = { ts: [], v: [] }; return s.t[k] }
			return {
				bulk      : false,
				ids       : () => Object.keys(S),
				has       : id => isDef(S[id]),
				meta      : id => isDef(S[id]) ? S[id].meta : __,
				putMeta   : m => { if (isUnDef(S[m.id])) S[m.id] = { meta: m, t: {} } },
				read      : (id, k, from, to) => {
					var o = T(id, k), a = self.__lb(o.ts, from), b = self.__ub(o.ts, to)
					return { ts: o.ts.slice(a, b), v: o.v.slice(a, b) }
				},
				upsert    : (id, k, ts, v) => self.__put(T(id, k), ts, v),
				del       : (id, k, ts) => self.__rm(T(id, k), ts),
				trimBefore: (id, k, cut) => {
					var o = T(id, k), p = self.__lb(o.ts, cut)
					if (p > 0) { o.ts.splice(0, p); o.v.splice(0, p) }
					return p
				},
				trimCount : (id, k, max) => {
					var o = T(id, k), n = o.ts.length - max
					if (n > 0) { o.ts.splice(0, n); o.v.splice(0, n) }
					return Math.max(n, 0)
				},
				bounds    : (id, k) => { var o = T(id, k), n = o.ts.length; return n == 0 ? __ : { first: o.ts[0], last: o.ts[n - 1], count: n } },
				drop      : id => { delete S[id] },
				rawCount  : () => Object.keys(S).reduce((a, id) => a + (isDef(S[id].t.raw) ? S[id].t.raw.ts.length : 0), 0),
				liveCount : () => Object.keys(S).reduce((a, id) => a + 1 + Object.keys(S[id].t).reduce((b, k) => b + S[id].t[k].ts.length, 0), 0),
				close     : () => {}
			}
		},
		// channel: series index + one chunk channel per tier, delegated to other channels (e.g. mvs)
		__chStore: function(c, aName) {
			var self = this, spec = c.opts.store, pre = "timeseries::" + aName + "::", n = {}, made = []
			var close = () => made.forEach(x => { try { $ch(x).destroy() } catch(e) {} })
			try {
				;[ "series" ].concat(c.tiers.map(t => t.key)).forEach(p => {
					n[p] = pre + p
					var o = isFunction(spec.options) ? spec.options(p) : merge(isMap(spec.options) ? clone(spec.options) : {}, { map: pre + p })
					$ch(n[p]).create(spec.compress === true, spec.type, o)
					made.push(n[p])
				})
			} catch(e) { close(); throw e }
			var bulk = spec.bulk === true || (spec.bulk !== false && spec.type == "mvs")
			var cs = k => c.tierBy[k].chunk
			var bk = (k, t) => Math.floor(t / cs(k)) * cs(k)
			var rec = id => $ch(n.series).get({ s: id })
			var tinfo = (r, k) => { if (isUnDef(r.t[k])) r.t[k] = { first: __, last: __, count: 0, chunks: [] }; return r.t[k] }
			var chunk = (id, k, b) => $ch(n[k]).get({ s: id, b: b })
			var wr = (k, list) => {
				if (list.length == 0) return
				if (bulk && list.length > 1) $ch(n[k]).setAll([ "s", "b" ], list)
				else list.forEach(x => $ch(n[k]).set({ s: x.s, b: x.b }, x))
			}
			var refresh = (id, r, k) => {
				var info = tinfo(r, k)
				info.chunks.sort((a, b) => a - b)
				if (info.chunks.length == 0 || info.count <= 0) { info.first = __; info.last = __; info.count = 0; info.chunks = []; return }
				var f = chunk(id, k, info.chunks[0]), l = info.chunks.length == 1 ? f : chunk(id, k, info.chunks[info.chunks.length - 1])
				info.first = f.ts[0]
				info.last = l.ts[l.ts.length - 1]
			}
			var save = r => $ch(n.series).set({ s: r.s }, r)
			// groups ts (+ optional v) by chunk start
			var group = (k, ts, v) => {
				var g = {}, order = []
				ts.forEach((t, i) => {
					var b = bk(k, t)
					if (isUnDef(g[b])) { g[b] = { ts: [], v: [] }; order.push(b) }
					g[b].ts.push(t); if (isDef(v)) g[b].v.push(v[i])
				})
				return { g: g, order: order }
			}
			return {
				names     : n,
				bulk      : bulk,
				ids       : () => $ch(n.series).getKeys().map(k => k.s),
				has       : id => isMap(rec(id)),
				meta      : id => { var r = rec(id); return isMap(r) ? { id: id, metric: r.metric, labels: r.labels } : __ },
				putMeta   : m => { if (!isMap(rec(m.id))) save({ s: m.id, metric: m.metric, labels: m.labels, t: {} }) },
				read      : (id, k, from, to) => {
					var r = rec(id), res = { ts: [], v: [] }
					if (!isMap(r) || isUnDef(r.t[k])) return res
					r.t[k].chunks.forEach(b => {
						if (b > to || b + cs(k) - 1 < from) return
						var ch = chunk(id, k, b)
						if (!isMap(ch)) return
						var a = self.__lb(ch.ts, from), z = self.__ub(ch.ts, to)
						res.ts = res.ts.concat(ch.ts.slice(a, z)); res.v = res.v.concat(ch.v.slice(a, z))
					})
					return res
				},
				upsert    : (id, k, ts, v) => {
					var r = rec(id), info = tinfo(r, k), gr = group(k, ts, v), added = 0, out = []
					gr.order.forEach(b => {
						var ch = chunk(id, k, b)
						if (!isMap(ch)) { ch = { s: id, b: b, ts: [], v: [] }; if (info.chunks.indexOf(b) < 0) info.chunks.push(b) }
						added += self.__put(ch, gr.g[b].ts, gr.g[b].v)
						out.push(ch)
					})
					wr(k, out)
					info.count += added
					refresh(id, r, k)
					save(r)
					return added
				},
				del       : (id, k, ts) => {
					var r = rec(id)
					if (!isMap(r) || isUnDef(r.t[k])) return 0
					var info = r.t[k], gr = group(k, ts), removed = 0, out = []
					gr.order.forEach(b => {
						var ch = chunk(id, k, b)
						if (!isMap(ch)) return
						removed += self.__rm(ch, gr.g[b].ts)
						if (ch.ts.length == 0) { $ch(n[k]).unset({ s: id, b: b }); info.chunks = info.chunks.filter(x => x !== b) } else out.push(ch)
					})
					wr(k, out)
					info.count -= removed
					refresh(id, r, k)
					save(r)
					return removed
				},
				trimBefore: (id, k, cut) => {
					var r = rec(id)
					if (!isMap(r) || isUnDef(r.t[k]) || isUnDef(r.t[k].first) || r.t[k].first >= cut) return 0
					var info = r.t[k], removed = 0, keep = []
					info.chunks.sort((a, b) => a - b).forEach(b => {
						if (b > cut) { keep.push(b); return }
						var ch = chunk(id, k, b)
						if (!isMap(ch)) return
						var p = self.__lb(ch.ts, cut)
						removed += p
						if (p >= ch.ts.length) { $ch(n[k]).unset({ s: id, b: b }); return }
						if (p > 0) { ch.ts.splice(0, p); ch.v.splice(0, p); $ch(n[k]).set({ s: id, b: b }, ch) }
						keep.push(b)
					})
					info.chunks = keep
					info.count -= removed
					refresh(id, r, k)
					save(r)
					return removed
				},
				trimCount : (id, k, max) => {
					var r = rec(id)
					if (!isMap(r) || isUnDef(r.t[k]) || r.t[k].count <= max) return 0
					var info = r.t[k], left = info.count - max, removed = 0, keep = []
					info.chunks.sort((a, b) => a - b).forEach(b => {
						if (left <= 0) { keep.push(b); return }
						var ch = chunk(id, k, b)
						if (!isMap(ch)) return
						var p = Math.min(left, ch.ts.length)
						left -= p; removed += p
						if (p >= ch.ts.length) { $ch(n[k]).unset({ s: id, b: b }); return }
						ch.ts.splice(0, p); ch.v.splice(0, p); $ch(n[k]).set({ s: id, b: b }, ch)
						keep.push(b)
					})
					info.chunks = keep
					info.count -= removed
					refresh(id, r, k)
					save(r)
					return removed
				},
				bounds    : (id, k) => {
					var r = rec(id)
					if (!isMap(r) || isUnDef(r.t[k]) || r.t[k].count <= 0) return __
					return { first: r.t[k].first, last: r.t[k].last, count: r.t[k].count }
				},
				drop      : id => {
					var r = rec(id)
					if (!isMap(r)) return
					Object.keys(r.t).forEach(k => r.t[k].chunks.forEach(b => $ch(n[k]).unset({ s: id, b: b })))
					$ch(n.series).unset({ s: id })
				},
				rawCount  : () => $ch(n.series).getAll().reduce((a, r) => a + (isDef(r.t.raw) ? r.t.raw.count : 0), 0),
				liveCount : () => 0,
				close     : close
			}
		},
		// ---- engine
		// reference timestamp used by retention for a series
		__ref: function(c, id, aNow) {
			if (isDef(aNow)) return aNow
			if (c.opts.retentionRef == "now") return now()
			var b = c.st.bounds(id, "raw")
			return isDef(b) ? b.last : __
		},
		__retain: function(c, id, aNow) {
			var ref = this.__ref(c, id, aNow), removed = 0
			if (isUnDef(ref)) return 0
			c.tiers.forEach(t => {
				if (isDef(t.keep)) removed += c.st.trimBefore(id, t.key, ref - t.keep - (t.step > 0 ? t.step - 1 : 0))
				if (isDef(t.maxPoints)) removed += c.st.trimCount(id, t.key, t.maxPoints)
			})
			return removed
		},
		__hk: function(c, id) {
			if (!c.hasRetention) return
			var ids = [ id ]
			if (c.opts.housekeepEveryMs > 0) {
				c.touched[id] = true
				if (now() - c.lastHK < c.opts.housekeepEveryMs) return
				ids = Object.keys(c.touched); c.touched = {}; c.lastHK = now()
			}
			for (var i = 0; i < ids.length; i++) if (c.st.has(ids[i])) this.__retain(c, ids[i])
		},
		__lg: function(c, o) {
			if (isDef(c.buf)) c.buf.push(stringify(o, __, ""))
		},
		// is the raw data of the bucket starting at b intact (no raw trimming configured or nothing older than b was lost)?
		__intact: function(c, id, b) {
			if (!c.rawTrims) return true
			var bd = c.st.bounds(id, "raw")
			return isDef(bd) && bd.first <= b
		},
		__rebuild: function(c, id, t, b) {
			var r = c.st.read(id, "raw", b, b + t.step - 1), agg
			for (var i = 0; i < r.ts.length; i++) agg = this.__am(agg, this.__a0(r.ts[i], r.v[i]))
			return agg
		},
		// updates the rollup tiers after raw points ts/vs were written (old holds the previous values of overwritten points)
		__roll: function(c, id, ts, vs, old) {
			var self = this
			c.tiers.forEach(t => {
				if (t.step <= 0) return
				var ref = self.__ref(c, id), cut = (isDef(t.keep) && isDef(ref)) ? ref - t.keep : __
				var bl = {}, order = []
				ts.forEach((x, i) => {
					var b = Math.floor(x / t.step) * t.step
					if (isDef(cut) && b + t.step <= cut) return
					if (isUnDef(bl[b])) { bl[b] = []; order.push(b) }
					bl[b].push(i)
				})
				var ub = [], uv = []
				order.forEach(b => {
					var cur = c.st.read(id, t.key, b, b), agg = cur.ts.length > 0 ? cur.v[0] : __
					var over = bl[b].some(i => isDef(old[ts[i]]))
					if (over && self.__intact(c, id, b)) {
						agg = self.__rebuild(c, id, t, b)
					} else {
						bl[b].forEach(i => {
							var x = ts[i], v = vs[i]
							if (isDef(old[x]) && isDef(agg)) {
								agg = { count: agg.count, sum: agg.sum - old[x] + v, min: Math.min(agg.min, v), max: Math.max(agg.max, v),
								        first: agg.ft === x ? v : agg.first, ft: agg.ft, last: agg.lt === x ? v : agg.last, lt: agg.lt }
							} else {
								agg = self.__am(agg, self.__a0(x, v))
							}
						})
					}
					if (isDef(agg)) { ub.push(b); uv.push(agg); self.__lg(c, { o: "r", s: id, k: t.key, t: b, a: self.__ae(agg) }) }
				})
				if (ub.length > 0) c.st.upsert(id, t.key, ub, uv)
			})
		},
		// fixes rollup buckets after raw points were removed
		__fix: function(c, id, ts) {
			var self = this
			c.tiers.forEach(t => {
				if (t.step <= 0) return
				var seen = {}
				ts.forEach(x => {
					var b = Math.floor(x / t.step) * t.step
					if (seen[b] || !self.__intact(c, id, b)) return
					seen[b] = true
					var agg = self.__rebuild(c, id, t, b)
					if (isDef(agg)) {
						c.st.upsert(id, t.key, [ b ], [ agg ]); self.__lg(c, { o: "r", s: id, k: t.key, t: b, a: self.__ae(agg) })
					} else {
						c.st.del(id, t.key, [ b ]); self.__lg(c, { o: "d", s: id, k: t.key, t: b })
					}
				})
			})
		},
		// writes points [ { t, v } ] of one series
		__write: function(c, m, pts) {
			var st = c.st, id = m.id
			if (!st.has(id)) {
				st.putMeta({ id: id, metric: m.metric, labels: m.labels })
				this.__lg(c, { o: "s", s: id, m: m.metric, l: m.labels })
			}
			var map = {}
			pts.forEach(p => { map[p.t] = p.v })
			var ts = Object.keys(map).map(Number).sort((a, b) => a - b), vs = ts.map(t => map[t])
			if (ts.length == 0) return
			var old = {}
			if (c.tiers.length > 1) {
				var ex = st.read(id, "raw", ts[0], ts[ts.length - 1])
				ex.ts.forEach((t, i) => { old[t] = ex.v[i] })
			}
			st.upsert(id, "raw", ts, vs)
			for (var i = 0; i < ts.length; i++) this.__lg(c, { o: "p", s: id, t: ts[i], v: vs[i] })
			if (c.tiers.length > 1) this.__roll(c, id, ts, vs, old)
			this.__hk(c, id)
		},
		__changed: function(c) {
			if (isUnDef(c.opts.file)) return
			c.dirty = true
			if (c.opts.autosave === "always" || (c.opts.autosave === "debounced" && now() - c.lastSave >= c.opts.saveDebounceMs)) this.__flush(c)
		},
		__flush: function(c) {
			var o = c.opts
			if (o.readOnly) return false
			if (isUnDef(o.file)) return true
			if (c.buf.length > 0) {
				this.__l(o)
				try {
					var dir = new java.io.File(o.file).getAbsoluteFile().getParentFile()
					if (isDef(dir) && !dir.exists()) dir.mkdirs()
					io.writeFileString(o.file, (c.needNL ? "\n" : "") + c.buf.join("\n") + "\n", __, true)
					c.needNL = false
					c.lines += c.buf.length
					c.buf = []
				} finally {
					this.__ul(o)
				}
			}
			c.dirty = false
			c.lastSave = now()
			if (c.lines - c.lastCompact >= 1000) this.__compactIf(c)
			return true
		},
		__compactIf: function(c) {
			var live = c.st.liveCount()
			if (c.lines > 0 && (c.lines - live) / c.lines > c.opts.compactRatio) this.__compact(c); else c.lastCompact = c.lines
		},
		// rewrites the file with the live state only
		__compact: function(c) {
			var o = c.opts, self = this
			if (o.readOnly || isUnDef(o.file)) return false
			var lines = []
			c.st.ids().sort().forEach(id => {
				var m = c.st.meta(id)
				lines.push(stringify({ o: "s", s: id, m: m.metric, l: m.labels }, __, ""))
				c.tiers.forEach(t => {
					var r = c.st.read(id, t.key, -Infinity, Infinity)
					for (var i = 0; i < r.ts.length; i++)
						lines.push(t.step > 0 ? stringify({ o: "r", s: id, k: t.key, t: r.ts[i], a: self.__ae(r.v[i]) }, __, "") : stringify({ o: "p", s: id, t: r.ts[i], v: r.v[i] }, __, ""))
				})
			})
			this.__l(o)
			try {
				var dir = new java.io.File(o.file).getAbsoluteFile().getParentFile()
				if (isDef(dir) && !dir.exists()) dir.mkdirs()
				var tmp = o.file + "." + java.util.UUID.randomUUID() + ".tmp"
				try {
					io.writeFileString(tmp, lines.length > 0 ? lines.join("\n") + "\n" : "")
					java.nio.file.Files.move(new java.io.File(tmp).toPath(), new java.io.File(o.file).toPath(), java.nio.file.StandardCopyOption.ATOMIC_MOVE, java.nio.file.StandardCopyOption.REPLACE_EXISTING)
				} finally {
					java.nio.file.Files.deleteIfExists(new java.io.File(tmp).toPath())
				}
			} finally {
				this.__ul(o)
			}
			c.buf = []
			c.needNL = false
			c.lines = lines.length
			c.lastCompact = c.lines
			c.dirty = false
			c.lastSave = now()
			return true
		},
		__load: function(c) {
			var o = c.opts, st = c.st
			this.__l(o)
			try {
				if (!io.fileExists(o.file)) {
					if (o.create === false) throw "timeseries file '" + o.file + "' not found"
					return
				}
				var txt = io.readFileString(o.file)
				c.needNL = txt.length > 0 && txt.charAt(txt.length - 1) != "\n"
				var self = this
				txt.split("\n").forEach(line => {
					if (line.length == 0) return
					c.lines++
					var r
					try { r = JSON.parse(line) } catch(e) { c.bad++; return }
					if (!isMap(r)) { c.bad++; return }
					var k = isString(r.k) ? r.k : "raw"
					switch(r.o) {
					case "s": st.putMeta({ id: r.s, metric: r.m, labels: isMap(r.l) ? r.l : {} }); break
					case "p": if (st.has(r.s)) st.upsert(r.s, "raw", [ r.t ], [ r.v ]); break
					case "r": if (st.has(r.s) && isDef(c.tierBy[k])) st.upsert(r.s, k, [ r.t ], [ self.__ad(r.a) ]); break
					case "d": if (st.has(r.s) && isDef(c.tierBy[k])) st.del(r.s, k, [ r.t ]); break
					case "x": st.drop(r.s); break
					default: c.bad++
					}
				})
			} finally {
				this.__ul(o)
			}
		},
		// applies retention to every series
		__housekeep: function(c, aNow) {
			var self = this, removed = 0
			if (!c.hasRetention) return 0
			c.st.ids().forEach(id => { removed += self.__retain(c, id, aNow) })
			return removed
		},
		// rebuilds every rollup tier of every series from the raw points
		__rebuildAll: function(c) {
			var self = this
			c.st.ids().forEach(id => {
				c.tiers.forEach(t => {
					if (t.step <= 0) return
					c.st.trimBefore(id, t.key, Infinity)
				})
				var r = c.st.read(id, "raw", -Infinity, Infinity)
				c.tiers.forEach(t => {
					if (t.step <= 0) return
					var map = {}, bs = []
					r.ts.forEach((x, i) => {
						var b = Math.floor(x / t.step) * t.step
						if (isUnDef(map[b])) bs.push(b)
						map[b] = self.__am(map[b], self.__a0(x, r.v[i]))
					})
					if (bs.length > 0) c.st.upsert(id, t.key, bs, bs.map(b => map[b]))
				})
			})
			this.__housekeep(c)
		},
		// public helpers used by ow.ch.utils.timeseries
		__save: function(aName) { var c = this.__c(aName); return this.__flush(c) },
		create       : function(aName, shouldCompress, options) {
			options = _$(options, "options").isMap().default({})
			var o = {
				file            : _$(options.file, "options.file").isString().default(__),
				store           : isDef(options.store) ? _$(options.store, "options.store").isMap().$_() : __,
				readOnly        : _$(options.readOnly, "options.readOnly").isBoolean().default(false),
				create          : _$(options.create, "options.create").isBoolean().default(true),
				autosave        : String(_$(options.autosave, "options.autosave").isString().default("always")).toLowerCase(),
				saveDebounceMs  : _$(options.saveDebounceMs, "options.saveDebounceMs").isNumber().default(5000),
				lock            : options.lock,
				compactRatio    : _$(options.compactRatio, "options.compactRatio").isNumber().default(0.5),
				retentionRef    : String(_$(options.retentionRef, "options.retentionRef").isString().default("series")).toLowerCase(),
				housekeepEveryMs: _$(options.housekeepEveryMs, "options.housekeepEveryMs").isNumber().default(0)
			}
			if ([ "always", "debounced", "off" ].indexOf(o.autosave) < 0) throw "options.autosave must be 'always', 'debounced' or 'off'"
			if ([ "series", "now" ].indexOf(o.retentionRef) < 0) throw "options.retentionRef must be 'series' or 'now'"
			if (isDef(o.store)) {
				_$(o.store.type, "options.store.type").isString().$_()
				if (isDef(o.file)) throw "options.file and options.store can't be used together"
			}
			var chunk = this.__dur(options.chunk, "options.chunk") || 3600000
			var raw = _$(options.raw, "options.raw").isMap().default({})
			var tiers = [ {
				key: "raw", step: 0, chunk: chunk,
				keep: this.__dur(isDef(raw.keep) ? raw.keep : options.retention, "raw.keep"),
				maxPoints: isDef(raw.maxPoints) ? raw.maxPoints : options.maxPoints
			} ]
			if (isDef(tiers[0].maxPoints) && (!isNumber(tiers[0].maxPoints) || tiers[0].maxPoints < 1)) throw "options.maxPoints must be a number >= 1"
			var rolls = _$(options.rollups, "options.rollups").isArray().default([])
			var steps = {}
			rolls.map(r => {
				_$(r, "options.rollups[]").isMap().$_()
				var step = this.__dur(r.step, "rollup step")
				if (isUnDef(step)) throw "each rollup needs a step"
				if (isDef(steps[step])) throw "duplicated rollup step " + step
				steps[step] = true
				return { key: "r" + step, step: step, chunk: Math.max(chunk, step * 60), keep: this.__dur(r.keep, "rollup keep") }
			}).sort((a, b) => a.step - b.step).forEach(t => tiers.push(t))
			var c = {
				mx: new java.util.concurrent.locks.ReentrantLock(), opts: o, name: aName, tiers: tiers, tierBy: {}, buf: isDef(o.file) ? [] : __, lines: 0, bad: 0, lastCompact: 0,
				lastHK: 0, touched: {}, lastSave: 0, dirty: false, needNL: false
			}
			tiers.forEach(t => { c.tierBy[t.key] = t })
			c.hasRetention = tiers.some(t => isDef(t.keep) || isDef(t.maxPoints))
			c.rawTrims = isDef(tiers[0].keep) || isDef(tiers[0].maxPoints)
			if (isDef(o.store)) {
				c.st = this.__chStore(c, aName)
				if (o.create === false && c.st.ids().length == 0) { c.st.close(); throw "timeseries store for '" + aName + "' not found" }
			} else {
				c.st = this.__memStore(c)
				if (isDef(o.file)) this.__load(c)
			}
			this.__channels[aName] = c
			if (!o.readOnly) this.__housekeep(c)
		},
		destroy      : function(aName) {
			var c = this.__channels[aName]
			if (isUnDef(c)) return
			try {
				if (!c.opts.readOnly && isDef(c.opts.file)) {
					this.__flush(c)
					this.__compactIf(c)
				}
			} finally { delete this.__channels[aName]; c.st.close() }
		},
		size         : function(aName) {
			return this.__c(aName).st.rawCount()
		},
		forEach      : function(aName, aFunction) {
			var ks = this.getKeys(aName)
			for (var i = 0; i < ks.length; i++) {
				try { aFunction(ks[i], this.get(aName, ks[i])) } catch(e) {}
			}
		},
		// full: optional selector { metric, labels, from, to }
		__points: function(c, full, withV) {
			var self = this, sel = isMap(full) ? full : {}, res = []
			var from = isDef(sel.from) ? this.__ts(sel.from) : -Infinity, to = isDef(sel.to) ? this.__ts(sel.to) : Infinity
			this.__select(c, sel).forEach(id => {
				var m = c.st.meta(id), r = c.st.read(id, "raw", from, to)
				for (var i = 0; i < r.ts.length; i++)
					res.push(withV ? self.__pt(m, r.ts[i], r.v[i]) : { metric: m.metric, labels: clone(m.labels), ts: r.ts[i] })
			})
			return res
		},
		getAll       : function(aName, full) {
			return this.__points(this.__c(aName), full, true)
		},
		getKeys      : function(aName, full) {
			return this.__points(this.__c(aName), full, false)
		},
		getSortedKeys: function(aName, full) {
			var self = this
			return this.getKeys(aName, full).sort((a, b) => a.ts != b.ts ? a.ts - b.ts : (self.__sid(a.metric, a.labels) < self.__sid(b.metric, b.labels) ? -1 : 1))
		},
		getSet       : function getSet(aName, aMatch, aK, aV, aTimestamp)  {
			var res = this.get(aName, aK)
			if ($stream([res]).anyMatch(aMatch)) {
				return this.set(aName, aK, aV, aTimestamp)
			}
			return __
		},
		set          : function(aName, aK, aV, aTimestamp) {
			var c = this.__c(aName)
			this.__rw(c)
			var k = this.__key(aK)
			var t = isDef(k.ts) ? k.ts : (isMap(aV) && isDef(aV.ts) ? this.__ts(aV.ts) : now())
			this.__write(c, k, [ { t: t, v: this.__val(aV) } ])
			this.__changed(c)
			return aK
		},
		// aKs are the key fields in each value (defaults to metric, labels, ts)
		setAll       : function(aName, aKs, aVs, aTimestamp) {
			ow.loadObj()
			var c = this.__c(aName)
			this.__rw(c)
			if (!isArray(aKs) || aKs.length == 0) aKs = [ "metric", "labels", "ts" ]
			var groups = {}, order = []
			for (var i = 0; i < aVs.length; i++) {
				var k = this.__key(ow.obj.filterKeys(aKs, aVs[i]))
				var t = isDef(k.ts) ? k.ts : (isDef(aVs[i].ts) ? this.__ts(aVs[i].ts) : now())
				if (isUnDef(groups[k.id])) { groups[k.id] = { k: k, pts: [] }; order.push(k.id) }
				groups[k.id].pts.push({ t: t, v: this.__val(aVs[i]) })
			}
			order.forEach(id => this.__write(c, groups[id].k, groups[id].pts))
			this.__changed(c)
		},
		unsetAll     : function(aName, aKs, aVs, aTimestamp) {
			ow.loadObj()
			if (!isArray(aKs) || aKs.length == 0) aKs = [ "metric", "labels", "ts" ]
			for (var i = 0; i < aVs.length; i++) {
				this.unset(aName, ow.obj.filterKeys(aKs, aVs[i]), aTimestamp)
			}
		},
		get          : function(aName, aK) {
			var c = this.__c(aName)
			if (!isMap(aK) || !isString(aK.metric)) return __
			var k = this.__key(aK)
			if (!c.st.has(k.id)) return __
			var t = k.ts
			if (isUnDef(t)) {
				var b = c.st.bounds(k.id, "raw")
				if (isUnDef(b)) return __
				t = b.last
			}
			var r = c.st.read(k.id, "raw", t, t)
			return r.ts.length > 0 ? this.__pt(k, t, r.v[0]) : __
		},
		pop          : function(aName) {
			var c = this.__c(aName), best
			c.st.ids().sort().forEach(id => {
				var b = c.st.bounds(id, "raw")
				if (isDef(b) && (isUnDef(best) || b.last > best.t)) best = { id: id, t: b.last }
			})
			if (isUnDef(best)) return __
			var m = c.st.meta(best.id)
			return { metric: m.metric, labels: clone(m.labels), ts: best.t }
		},
		shift        : function(aName) {
			var c = this.__c(aName), best
			c.st.ids().sort().forEach(id => {
				var b = c.st.bounds(id, "raw")
				if (isDef(b) && (isUnDef(best) || b.first < best.t)) best = { id: id, t: b.first }
			})
			if (isUnDef(best)) return __
			var m = c.st.meta(best.id)
			return { metric: m.metric, labels: clone(m.labels), ts: best.t }
		},
		unset        : function(aName, aK, aTimestamp) {
			var c = this.__c(aName)
			this.__rw(c)
			if (!isMap(aK) || !isString(aK.metric)) return
			var k = this.__key(aK)
			if (!c.st.has(k.id)) return
			if (isDef(k.ts)) {
				if (c.st.del(k.id, "raw", [ k.ts ]) == 0) return
				this.__lg(c, { o: "d", s: k.id, t: k.ts })
				this.__fix(c, k.id, [ k.ts ])
			} else {
				c.st.drop(k.id)
				this.__lg(c, { o: "x", s: k.id })
			}
			this.__changed(c)
		}
	},
	// Remote channel implementation
	//
	/**
	 * <odoc>
	 * <key>ow.ch.types.remote</key>
	 * This OpenAF channel implementation connects to a remote channel exposed via ow.ch.server.expose or ow.ch.server.peer. The creation options are:\
	 * \
	 *    - url             (String)   The HTTP(S) URL of the remote exposed channel (e.g. http://server:8090/channel).\
	 *    - login           (String)   Optional username for HTTP basic authentication.\
	 *    - password        (String)   Optional password for HTTP basic authentication (encrypted or not).\
	 *    - timeout         (Number)   Optional connection and request timeout in ms.\
	 *    - default         (Object)   Optional default value to return when the request fails instead of throwing.\
	 *    - stopWhen        (Function) Optional function that, if it returns true, stops the underlying HTTP request retry.\
	 *    - throwExceptions (Boolean)  If true (default) exceptions from the remote server will be thrown locally.\
	 *    - preAction       (Function) Optional function called before every HTTP request (receives the $rest options map).\
	 * \
	 * Example:\
	 * \
	 *    ow.ch.create("myRemote", false, "remote", { url: "http://server:8090/myChannel" });\
	 *    $ch("myRemote").set({ id: 1 }, { id: 1, name: "test" });\
	 * \
	 * Note: the remote channel relies on ow.ch.server.expose/peer on the server side and uses the OpenAF REST channel\
	 * protocol over HTTP(S). For two-way synchronization between nodes consider using ow.ch.server.peer instead.\
	 * </odoc>
	 */
	remote: {
		__channels: Object.create(null),
		create       : function(aName, shouldCompress, options) {
			ow.loadObj();
			if (isUnDef(options)) options = {};
			if (isUnDef(options.throwExceptions)) options.throwExceptions = true;
			this.__channels[aName] = options;
		},
		destroy      : function(aName) {
			delete this.__channels[aName];
		},
		size         : function(aName) {
			var rr = $rest({
				login: this.__channels[aName].login,
				pass: this.__channels[aName].password,
				connectionTimeout: this.__channels[aName].timeout,
				default: this.__channels[aName].default,
				timeout: this.__channels[aName].timeout,
				stopWhen: this.__channels[aName].stopWhen,
				throwExceptions: this.__channels[aName].throwExceptions,
				preAction: this.__channels[aName].preAction
			}).get(this.__channels[aName].url + $rest().index({ o: "l" })).r;

			if (isMap(rr) && rr == {}) {
				var r = this.getKeys(aName);
				if (isDef(r)) return r.length;
			} else {
				return rr;
			}
		},
		forEach      : function(aName, aFunction) {
			var aKs = this.getKeys(aName);
			for(var i in aKs) {
				aFunction(aKs[i], this.get(aName, aKs[i]));
			}
		},
		getAll      : function(aName, full) {
			//return ow.obj.rest.jsonGet(this.__channels[aName].url, { "o": "a" }, this.__channels[aName].login, this.__channels[aName].password, this.__channels[aName].timeout).r;
			return $rest({
				login: this.__channels[aName].login,
				pass: this.__channels[aName].password,
				connectionTimeout: this.__channels[aName].timeout,
				default: this.__channels[aName].default,
				timeout: this.__channels[aName].timeout,
				stopWhen: this.__channels[aName].stopWhen,
				throwExceptions: this.__channels[aName].throwExceptions,
				preAction: this.__channels[aName].preAction
			}).get(this.__channels[aName].url + $rest().index({ o: "a" })).r;
		},
		getKeys      : function(aName, full) {
			//return ow.obj.rest.jsonGet(this.__channels[aName].url, { "o": "k" }, this.__channels[aName].login, this.__channels[aName].password, this.__channels[aName].timeout).r;
			return $rest({
				login: this.__channels[aName].login,
				pass: this.__channels[aName].password,
				connectionTimeout: this.__channels[aName].timeout,
				default: this.__channels[aName].default,
				timeout: this.__channels[aName].timeout,
				stopWhen: this.__channels[aName].stopWhen,
				throwExceptions: this.__channels[aName].throwExceptions,
				preAction: this.__channels[aName].preAction
			}).get(this.__channels[aName].url + $rest().index({ o: "k" })).r;
		},
		getSortedKeys: function(aName, full) {
			//return ow.obj.rest.jsonGet(this.__channels[aName].url, { "o": "s" }, this.__channels[aName].login, this.__channels[aName].password, this.__channels[aName].timeout).r;		
			return $rest({
				login: this.__channels[aName].login,
				pass: this.__channels[aName].password,
				connectionTimeout: this.__channels[aName].timeout,
				default: this.__channels[aName].default,
				timeout: this.__channels[aName].timeout,
				stopWhen: this.__channels[aName].stopWhen,
				throwExceptions: this.__channels[aName].throwExceptions,
				preAction: this.__channels[aName].preAction
			}).get(this.__channels[aName].url + $rest().index({ o: "s" })).r;		
		},
		getSet       : function getSet(aName, aMatch, aK, aV, aTimestamp)  {
			//return ow.obj.rest.jsonSet(this.__channels[aName].url, { "o": "es", "m": aMatch, "k": aK, "t": aTimestamp }, aV, this.__channels[aName].login, this.__channels[aName].password, this.__channels[aName].timeout).r;
			return $rest({
				login: this.__channels[aName].login,
				pass: this.__channels[aName].password,
				connectionTimeout: this.__channels[aName].timeout,
				default: this.__channels[aName].default,
				timeout: this.__channels[aName].timeout,
				stopWhen: this.__channels[aName].stopWhen,
				throwExceptions: this.__channels[aName].throwExceptions,
				preAction: this.__channels[aName].preAction
			}).put(this.__channels[aName].url + $rest().index({ o: "es", m: aMatch, k: aK, t: aTimestamp }), aV).r;	
		},
		set          : function(aName, aK, aV, aTimestamp) {
			//return ow.obj.rest.jsonSet(this.__channels[aName].url, { "o": "e", "k": aK, "t": aTimestamp }, aV, this.__channels[aName].login, this.__channels[aName].password, this.__channels[aName].timeout).r;
			return $rest({
				login: this.__channels[aName].login,
				pass: this.__channels[aName].password,
				connectionTimeout: this.__channels[aName].timeout,
				default: this.__channels[aName].default,
				timeout: this.__channels[aName].timeout,
				stopWhen: this.__channels[aName].stopWhen,
				throwExceptions: this.__channels[aName].throwExceptions,
				preAction: this.__channels[aName].preAction
			}).put(this.__channels[aName].url + $rest().index({ o: "e", k: aK, t: aTimestamp }), aV).r;				
		},
		setAll       : function(aName, aKs, aVs, aTimestamp) {
			//return ow.obj.rest.jsonSet(this.__channels[aName].url, { "o": "a", "k": aKs, "t": aTimestamp }, aVs, this.__channels[aName].login, this.__channels[aName].password, this.__channels[aName].timeout).r;		
			return $rest({
				login: this.__channels[aName].login,
				pass: this.__channels[aName].password,
				connectionTimeout: this.__channels[aName].timeout,
				default: this.__channels[aName].default,
				timeout: this.__channels[aName].timeout,
				stopWhen: this.__channels[aName].stopWhen,
				throwExceptions: this.__channels[aName].throwExceptions,
				preAction: this.__channels[aName].preAction
			}).put(this.__channels[aName].url + $rest().index({ o: "a", k: aKs, t: aTimestamp }), aVs).r;		
		},
		unsetAll     : function(aName, aKs, aVs, aTimestamp) {
			//return ow.obj.rest.jsonSet(this.__channels[aName].url, { "o": "ua", "k": aKs, "t": aTimestamp }, aVs, this.__channels[aName].login, this.__channels[aName].password, this.__channels[aName].timeout).r;		
			return $rest({
				login: this.__channels[aName].login,
				pass: this.__channels[aName].password,
				connectionTimeout: this.__channels[aName].timeout,
				default: this.__channels[aName].default,
				timeout: this.__channels[aName].timeout,
				stopWhen: this.__channels[aName].stopWhen,
				throwExceptions: this.__channels[aName].throwExceptions,
				preAction: this.__channels[aName].preAction
			}).put(this.__channels[aName].url + $rest().index({ o: "ua", k: aKs, t: aTimestamp }), aVs).r;		
		},		
		get          : function(aName, aK) {
			//return ow.obj.rest.jsonGet(this.__channels[aName].url, { "o": "e", "k": aK }, this.__channels[aName].login, this.__channels[aName].password, this.__channels[aName].timeout).r;
			return $rest({
				login: this.__channels[aName].login,
				pass: this.__channels[aName].password,
				connectionTimeout: this.__channels[aName].timeout,
				default: this.__channels[aName].default,
				timeout: this.__channels[aName].timeout,
				stopWhen: this.__channels[aName].stopWhen,
				throwExceptions: this.__channels[aName].throwExceptions,
				preAction: this.__channels[aName].preAction
			}).get(this.__channels[aName].url + $rest().index({ o: "e", k: aK })).r;	
		},
		pop          : function(aName) {
			var aKs = this.getSortedKeys(aName);
			var aK = aKs[aKs.length - 1];
			var aV = this.get(aName, aK);
			return aK;		
		},
		shift        : function(aName) {
			var aK = this.getSortedKeys(aName)[0];
			var aV = this.get(aName, aK);
			return aK;
		},
		unset        : function(aName, aK, aTimestamp) {
			//return ow.obj.rest.jsonRemove(this.__channels[aName].url, { "o": "e", "k": aK, "t": aTimestamp }, this.__channels[aName].login, this.__channels[aName].password, this.__channels[aName].timeout);
			return $rest({
				login: this.__channels[aName].login,
				pass: this.__channels[aName].password,
				connectionTimeout: this.__channels[aName].timeout,
				default: this.__channels[aName].default,
				timeout: this.__channels[aName].timeout,
				stopWhen: this.__channels[aName].stopWhen,
				throwExceptions: this.__channels[aName].throwExceptions,
				preAction: this.__channels[aName].preAction
			}).delete(this.__channels[aName].url + $rest().index({ o: "e", k: aK, t: aTimestamp })).r;
		}
	},
	/**
	 * <odoc>
	 * <key>ow.ch.types.elasticsearch</key>
	 * This OpenAF implementation connects to an ElasticSearch (ES) server/cluster. The creation options are:\
	 * \
	 *    - index       (String/Function) The ES index to use or a function to return the name (see also ow.ch.utils.getElasticIndex).\
	 *    - format      (String)          If index is a string will use format with ow.ch.utils.getElasticIndex.\
	 *    - idKey       (String)          The ES key id field. Defaults to 'id'.\
	 *    - url         (String)          The HTTP(S) URL to access the ES server/cluster.\
	 *    - user        (String)          Optionally provide a user name to access the ES server/cluster.\
	 *    - pass        (String)          Optionally provide a password to access the ES server/cluster (encrypted or not).\
	 *    - fnId        (String/Function) Optionally called on every operation to calculate the idKey with the key provided as argument. If string will the corresponding hash function (md5/sha1/etc...) with sortMapKeys + stringify.\
	 *    - size        (Number)          Optionally getAll/getKeys to return more than 10 records (up to 10000).\
	 *    - stamp       (Map)             Optionally merge with stamp map.\
	 *    - timeout     (Number)          Optional request timeout in ms.\
	 *    - preAction   (Function)        Optional function to be called before every request.\
	 * \
	 * The getAll/getKeys functions accept an extra argument to provide a ES query map to restrict the results.
	 * </odoc>
	 */
	elasticsearch: {
		__channels: Object.create(null),
		create       : function(aName, shouldCompress, options) {
			ow.loadObj();
			if (isUnDef(options.index)) throw "Please define an elastic search index to use";
			if (isUnDef(options.idKey)) options.idKey = "id";
			if (isUnDef(options.url))   throw "Please define the elastic search url";
			/*if (isUnDef(options.user) || isUnDef(options.pass))  
				throw "Please define an user and pass to access the elastic search";*/
			this.__channels[aName] = options;
			
			if (isDef(options.stamp) && isUnDef(options.seeAll)) this.__channels[aName].seeAll = false

			if (isFunction(options.index)) {
				this.__channels[aName].fnIndex = options.index;
			} else {
				if (isString(options.format)) {
					this.__channels[aName].fnIndex = ow.ch.utils.getElasticIndex(options.index, options.format);
				} else {
					this.__channels[aName].fnIndex = function() {
						return options.index;
					}
				}
			}

			if (isFunction(options.fnId)) {
				this.__channels[aName]._fnId = aK => {
					if (isMap(aK) && Object.keys(aK).length == 1 && isDef(aK.key)) return aK;
					if (isMap(aK) && isDef(aK[options.idKey])) return aK;
					var r = {};
					r[options.idKey] = (isString(aK) ? aK : options.fnId(aK));
					return r;
				}
			} else {
				if (isString(options.fnId)) {
					var _fn;
					switch(options.fnId.toLowerCase()) {
					case "md2"   : _fn = md2
					case "md5"   : _fn = md5
					case "sha1"  : _fn = sha1
					case "sha256": _fn = sha256
					case "sha384": _fn = sha384
					case "sha512": _fn = sha512
					default      : _fn = sha1
					}
					this.__channels[aName]._fnId = aK => {
						if (isMap(aK) && Object.keys(aK).length == 1 && isDef(aK.key)) return aK;
						if (isMap(aK) && isDef(aK[options.idKey])) return aK;
						var r = {};
						r[options.idKey] = (isString(aK) ? aK : _fn(stringify(sortMapKeys(aK), __, "")));
						return r;
					}
				} else {
					this.__channels[aName]._fnId = aK => aK;
				}
			}

		    if (isUnDef(options.throwExceptions)) this.__channels[aName].throwExceptions = false;
		},
		destroy      : function(aName) {
			delete this.__channels[aName];
		},
		size         : function(aName) {
			var url = this.__channels[aName].url + "/" + this.__channels[aName].fnIndex();
			url += "/_count";
			var parent = this;
			
			/*var res = ow.obj.rest.jsonGet(url, {}, function(h) { 
				if (isDef(parent.__channels[aName].user))
					h.login(parent.__channels[aName].user, parent.__channels[aName].pass, true);
			});*/
			var res = $rest({
				throwExceptions: parent.__channels[aName].throwExceptions,
				timeout: parent.__channels[aName].timeout,
				login: function(h) { 
					if (isDef(parent.__channels[aName].user))
						h.login(parent.__channels[aName].user, parent.__channels[aName].pass, true);
				},
				preAction: this.__channels[aName].preAction
			}).get(url);
			if (isDef(res) && isDef(res.count)) {
				return res.count;
			} else {
				return __;
			}
		},
		forEach      : function(aName, aFunction) {
			var aKs = this.getKeys(aName);
			for(var i in aKs) {
				aFunction(aKs[i], this.get(aName, aKs[i]));
			}
		},
		getAll      : function(aName, full) {
			var url = this.__channels[aName].url + "/" + this.__channels[aName].fnIndex();
			url += "/_search";
			var ops = {};
			
			if (isDef(full) && isMap(full)) { 
				ops = full; 
			} else {
				if (isDef(this.__channels[aName].size)) ops = { size: this.__channels[aName].size };
				if (isDef(this.__channels[aName].stamp) && !this.__channels[aName].seeAll) ops = merge(ops, ow.ch.utils.getElasticQuery(Object.keys(this.__channels[aName].stamp).map(k => k+":"+this.__channels[aName].stamp[k]).join(" AND ")) )
			}
				
			var parent = this;
			/*var res = ow.obj.rest.jsonCreate(url, {}, ops, function(h) { 
				if (isDef(parent.__channels[aName].user))
					h.login(parent.__channels[aName].user, parent.__channels[aName].pass, true);
			});*/
			var res = $rest({
				throwExceptions: parent.__channels[aName].throwExceptions,
				timeout: parent.__channels[aName].timeout,
				login: function(h) { 
					if (isDef(parent.__channels[aName].user))
						h.login(parent.__channels[aName].user, parent.__channels[aName].pass, true);
				},
				preAction: this.__channels[aName].preAction
			}).post(url, ops);
			if (isDef(res) && isDef(res.hits) && isDef(res.hits.hits)) {
				return $stream(res.hits.hits).map(function(r) {
					r._source["_id"] = r["_id"];
					return r._source;
				}).toArray();
			} else {
				return undefined;
			}			
		},
		getKeys      : function(aName, full) {
			var url = this.__channels[aName].url + "/" + this.__channels[aName].fnIndex();
			url += "/_search";
			var ops = {};
			
			if (isDef(full) && isMap(full)) { 
				ops = full; 
			} else {
				if (isDef(this.__channels[aName].size)) ops = { size: this.__channels[aName].size };
				if (isDef(this.__channels[aName].stamp) && !this.__channels[aName].seeAll) ops = merge(ops, ow.ch.utils.getElasticQuery(Object.keys(this.__channels[aName].stamp).map(k => k+":"+this.__channels[aName].stamp[k]).join(" AND ")) )
			}
				
			var parent = this;
			/*var res = ow.obj.rest.jsonCreate(url, {}, merge(ops, { _source: false }), function(h) { 
				if (isDef(parent.__channels[aName].user))
					h.login(parent.__channels[aName].user, parent.__channels[aName].pass, true);
			});*/
			var res = $rest({
				throwExceptions: parent.__channels[aName].throwExceptions,
				timeout: parent.__channels[aName].timeout,
				login: function(h) { 
					if (isDef(parent.__channels[aName].user))
						h.login(parent.__channels[aName].user, parent.__channels[aName].pass, true);
				},
				preAction: this.__channels[aName].preAction
			}).post(url, merge(ops, { _source: false }));
			if (isDef(res) && isDef(res.hits) & isDef(res.hits.hits)) {
				return $stream(res.hits.hits).map("_id").toArray();
			} else {
				return __;
			}	
		},
		getSortedKeys: function(aName, full) {
			return this.getKeys(aName, full);	
		},
		getSet       : function getSet(aName, aMatch, aK, aV, aTimestamp)  {
			//throw "Channel operation not supported in Elastic Search";
			var res;
			res = this.get(aName, aK);
			if ($stream([res]).anyMatch(aMatch)) {
				return this.set(aName, aK, aV, aTimestamp);
			}
			return undefined;
		},
		set          : function(aName, aK, aV, aTimestamp) {
			if (isMap(this.__channels[aName].stamp) && isMap(aK)) {
				aK = merge(aK, this.__channels[aName].stamp)
			}
			if (isMap(this.__channels[aName].stamp) && isMap(aV)) {
				aV = merge(aV, this.__channels[aName].stamp)
			}
			var url = this.__channels[aName].url + "/" + this.__channels[aName].fnIndex(aK);
			//url += "/" + this.__channels[aName].idKey;
			url += "/_doc";
			
			aK = this.__channels[aName]._fnId(aK);

			if (isDef(aK) && isObject(aK) && isDef(aK[this.__channels[aName].idKey])) { 
				url += "/" + encodeURIComponent(aK[this.__channels[aName].idKey]);
			} else {
				if (isDef(aK.key)) url += "/" + encodeURIComponent(aK.key);
			}
				
			var parent = this;

			var res = $rest({
				throwExceptions: parent.__channels[aName].throwExceptions,
				timeout: parent.__channels[aName].timeout,
				login: function(h) { 
					if (isDef(parent.__channels[aName].user))
						h.login(parent.__channels[aName].user, parent.__channels[aName].pass, true);
				},
				preAction: this.__channels[aName].preAction
			}).post(url, aV);
			return res;		
		},
		setAll       : function(aName, aKs, aVs, aTimestamp) {
			var url = this.__channels[aName].url;
			url += "/_bulk";
			var ops = "";
			
			if (isDef(aVs) && isArray(aVs) && aVs.length <= 0) return;

			for(var ii in aVs) {
				if (isMap(this.__channels[aName].stamp) && isMap(aVs[ii])) {
					aVs[ii] = merge(aVs[ii], this.__channels[aName].stamp)
				}
				var ks = (isDef(aKs) ? ow.obj.filterKeys(aKs, aVs[ii]) : aVs[ii]);
				if (isMap(this.__channels[aName].stamp) && isMap(ks)) {
					ks = merge(ks, this.__channels[aName].stamp)
				}
				var k = this.__channels[aName]._fnId(ks);
				if (aVs[ii] != null && isDef(k[this.__channels[aName].idKey])) {
					var m = { index: {
						_index: this.__channels[aName].fnIndex(aVs[ii]), 
						_id   : k[this.__channels[aName].idKey]
					}};
					
					ops += stringify(m, __, "") + "\n" + stringify(aVs[ii], __, "") + "\n";
				}
			}
			
			if (ops.length > 0) {
				ow.loadObj();
				var h = new ow.obj.http();
				try {
					//return h.exec(url, "POST", ops, {"Content-Type":"application/json"});
					var parent = this;
					var res = $rest({
						throwExceptions: parent.__channels[aName].throwExceptions,
						timeout: parent.__channels[aName].timeout,
						login: function(h) { 
							if (isDef(parent.__channels[aName].user))
								h.login(parent.__channels[aName].user, parent.__channels[aName].pass, true);
						},
						preAction: this.__channels[aName].preAction
					}).post(url, ops);
					if (isMap(res) && isDef(res.response)) return jsonParse(res.response); else return res;
				} catch(e) {
					e.message = "Exception " + e.message + "; error = " + String(h.getErrorResponse());
					throw e;
				}
			}
		},
		unsetAll     : function(aName, aKs, aVs, aTimestamp) {
			var url = this.__channels[aName].url;
			url += "/_bulk";
			var ops = "";
			if (isDef(aVs) && isArray(aVs) && aVs.length <= 0) return;

			for(var ii in aVs) {
				if (isMap(this.__channels[aName].stamp) && isMap(aVs[ii])) {
					aVs[ii] = merge(aVs[ii], this.__channels[aName].stamp)
				}
				var ks = (isDef(aKs) ? ow.obj.filterKeys(aKs, aVs[ii]) : aVs[ii]);
				if (isMap(this.__channels[aName].stamp) && isMap(ks)) {
					ks = merge(ks, this.__channels[aName].stamp)
				}
				var k = this.__channels[aName]._fnId(ks);
				if (aVs[ii] != null && isDef(k[this.__channels[aName].idKey])) {
					var m = { delete: {
						_index: this.__channels[aName].fnIndex(aVs[ii]), 
						_id   : k[this.__channels[aName].idKey]
					}};
					ops += stringify(m, __, "") + "\n" /*+ 
					stringify(k, __, "") + "\n";*/
				}
			}
			
			if (ops.length > 0) {
				ow.loadObj();
				var h = new ow.obj.http();
				if (isDef(this.__channels[aName].user))
					h.login(this.__channels[aName].user, this.__channels[aName].pass, true);
				try {
					var res = h.exec(url, "POST", ops, {"Content-Type":"application/json"});
					if (isMap(res) && isDef(res.response)) return jsonParse(res.response); else return res;
				} catch(e) {
					e.message = "Exception " + e.message + "; error = " + String(h.getErrorResponse());
					throw e;
				}
			}
		},		
		get          : function(aName, aK) {
			var url = this.__channels[aName].url + "/" + this.__channels[aName].fnIndex(aK);
			url += "/_doc";
			
			aK = this.__channels[aName]._fnId(aK);
			if (isDef(aK) && isObject(aK) && isDef(aK[this.__channels[aName].idKey])) { 
				url += "/" + encodeURIComponent(aK[this.__channels[aName].idKey]);
			} else {
				if (isDef(aK.key)) url += "/" + encodeURIComponent(aK.key);
			}
				
			var parent = this;
			/*var res = ow.obj.rest.jsonGet(url, {}, function(h) { 
				if (isDef(parent.__channels[aName].user))
					h.login(parent.__channels[aName].user, parent.__channels[aName].pass, true);
			});*/
			var res = $rest({
				throwExceptions: parent.__channels[aName].throwExceptions,
				timeout: parent.__channels[aName].timeout,
				login: function(h) { 
					if (isDef(parent.__channels[aName].user))
						h.login(parent.__channels[aName].user, parent.__channels[aName].pass, true);
				},
				preAction: this.__channels[aName].preAction
			}).get(url);

			if (isDef(res) && res.found) {
				return res._source;
			} else {
				return undefined;
			}	
		},
		pop          : function(aName) {
			var aKs = this.getSortedKeys(aName);
			var aK = aKs[aKs.length - 1];
			var aV = this.get(aName, aK);
			return aK;		
		},
		shift        : function(aName) {
			var aK = this.getSortedKeys(aName)[0];
			var aV = this.get(aName, aK);
			return aK;
		},
		unset        : function(aName, aK, aTimestamp) {
			var url = this.__channels[aName].url + "/" + this.__channels[aName].fnIndex(aK);
			url += "/_doc";

			aK = this.__channels[aName]._fnId(aK);
			if (isDef(aK) && isObject(aK) && isDef(aK[this.__channels[aName].idKey])) { 
				url += "/" + encodeURIComponent(aK[this.__channels[aName].idKey]);
			} else {
				if (isDef(aK.key)) url += "/" + encodeURIComponent(aK.key);
			}
				
			var parent = this;
			/*var res = ow.obj.rest.jsonRemove(url, {}, function(h) { 
				if (isDef(parent.__channels[aName].user))
					h.login(parent.__channels[aName].user, parent.__channels[aName].pass, true);
			});*/
			var res = $rest({
				throwExceptions: parent.__channels[aName].throwExceptions,
				timeout: parent.__channels[aName].timeout,
				login: function(h) { 
					if (isDef(parent.__channels[aName].user))
						h.login(parent.__channels[aName].user, parent.__channels[aName].pass, true);
				},
				preAction: this.__channels[aName].preAction
			}).delete(url);
			return res;	
		}
	},
	/**
	 * <odoc>
	 * <key>ow.ch.types.prometheus</key>
	 * This OpenAF implementation connects to a prometheus server. The creation options are:\
	 * \
	 *    - urlQuery  (String) The URL of a prometheus server (e.g. http://prometheus:9090) \
	 *    - urlPushGW (String) The URL of a prometheus push gateway server (e.g. http://prometheus:9091).\
	 *    - prefix    (String) If defined the prefix for all openmetrics.\
	 *    - gwGroup   (Map)    A map of grouping labels for data ingestion by the push gw (job label must be defined).\
	 *    - helpMap   (Map)    The helpMap for the openmetrics (see more in ow.metrics.fromObj2OpenMetrics).\
	 * \
	 * The forEach/getSet/pop/shift/unsetAll functions are not supported.\
	 * The size function retrieves the total number of labels.\
	 * The get/getAll function enables instant query (with the extra map key query), query range query (with the extra map keys query, start and end) and label values query (with the extra map key label).\
	 * The set/setAll functions only consider the value(s) argument, the key(s) is ignored.\
	 * \
	 * Note: query by specific series are not currently supported.\
	 * </odoc>
	 */
	prometheus: {
		__channels: Object.create(null),
		create       : function(aName, shouldCompress, options) {
			ow.loadMetrics();
			options = _$(options, "options").isMap().default({});

			options.urlQuery  = _$(options.urlQuery, "options.urlQuery").isString().default();
			options.urlPushGW = _$(options.urlPushGW, "options.urlPushGW").isString().default(__);
			options.prefix    = _$(options.prefix, "options.prefix").isString().default(__);
			options.gwGroup   = _$(options.gwGroup, "options.gwGroup").isMap().default({});

			if (isUnDef(options.urlQuery) && isUnDef(options.urlPushGW)) {
				throw "options.urlQuery or options.urlPushGW need to be defined.";
			}

			if (isDef(options.urlPushGW) && isUnDef(options.gwGroup.job)) {
				throw "options.gwGroup needs to have a job entry description";
			}

			this.__channels[aName] = options;
		},
		destroy      : function(aName) {
			delete this.__channels[aName];
		},
		size         : function(aName) {
			return this.getKeys(aName).length;
		},
		forEach      : function(aName, aFunction) {
			throw "forEach not supported for prometheus.";
		},
		getAll      : function(aName, full) {
			var _o = this.__channels[aName];

			_$(_o.urlQuery, "prometheus query (urlQuery) url").$_();

			var res, aK = _$(full, "getAll argument").isMap().$_();
			// Instant query
			if (isString(aK.query) && isUnDef(aK.start) && isUnDef(aK.end)) {
				res = $rest({ urlEncode: true })
				      .post(_o.urlQuery + "/api/v1/query", aK);

				if (isMap(res) && isDef(res.status) && res.status == "success") {
					if (isDef(res.data) && isDef(res.data.resultType) && res.data.resultType == "vector") {
						return res.data.result;
					}
				}
				return res;
			}

			// Query range query
			if (isString(aK.query) && isDef(aK.start) && isDef(aK.end)) {
				res = $rest({ urlEncode: true })
					  .post(_o.urlQuery + "/api/v1/query_range", aK);

				if (isMap(res) && isDef(res.status) && res.status == "success") {
					if (isDef(res.data) && isDef(res.data.resultType) && res.data.resultType == "matrix") {
						return res.data.result;
					}
				}
				return res;
			}

			// Label query
			if (isString(aK.label)) {
				res = $rest({ urlEncode: true })
			          .get(_o.urlQuery + "/api/v1/label/" + aK.label + "/values");

				if (isDef(res.status) && res.status == "success") {
					res = res.data;
				}
				return res;
			}

			return res;
		},
		getKeys      : function(aName, full) {
			var _o = this.__channels[aName];

			_$(_o.urlQuery, "prometheus query (urlQuery) url").$_();

			var res = $rest({ urlEncode: true })
			          .post(_o.urlQuery + "/api/v1/labels", isMap(full) ? full : __);
					
			if (isMap(res) && isDef(res.status) && res.status == "success") {
				if (isArray(res.data)) res = res.data;
			}

			return res;
		},
		getSortedKeys: function(aName, full) {
			var res = this.getKeys(aName, full);
			
			if (isArray(res)) res = res.sort();
			return res;
		},
		getSet       : function getSet(aName, aMatch, aK, aV, aTimestamp)  {
			throw "getSet not supported for prometheus.";
		},
		set          : function(aName, aK, aV, aTimestamp) {
			var _o = this.__channels[aName];

			_$(_o.urlQuery, "prometheus push gateway (urlPushGW) url").$_();

			return $rest()
			       .post(_o.urlPushGW + "/metrics" + $rest().index(_o.gwGroup), ow.metrics.fromObj2OpenMetrics(aV, _o.prefix, __, _o.helpMap));
		},
		setAll       : function(aName, aKs, aVs, aTimestamp) {
			var _o = this.__channels[aName];

			return $rest()
			       .post(_o.urlPushGW + "/metrics" + $rest().index(_o.gwGroup), ow.metrics.fromObj2OpenMetrics(aVs, _o.prefix, __, _o.helpMap));	
		},
		unsetAll       : function(aName, aKs, aVs, aTimestamp) {
			throw "unsetAll not supported for prometheus.";		
		},		
		get          : function(aName, aK) {
			var res = this.getAll(aName, aK);

			if (isArray(res)) return res[0]; else return res;
		},
		pop          : function(aName) {
			throw "pop not supported for prometheus.";	
		},
		shift        : function(aName) {
			throw "shift not supported for prometheus.";
		},
		unset        : function(aName, aK, aTimestamp) {
			var _o = this.__channels[aName];

			_$(_o.urlQuery, "prometheus push gateway (urlPushGW) url").$_();

			return $rest()
			       .delete(_o.urlPushGW + "/metrics" + $rest().index(merge(_o.gwGroup, aK)));
		}
	},
	/**
	 * <odoc>
	 * <key>ow.ch.types.mvs</key>
	 * The channel type mvs uses H2 MVStore to keep key/value structures either in memory or in files.
	 * The creation options are:\
	 * \
	 *    - file (String) If not defined it will default to the in-memory implementation otherwise a file.\
	 *    - shouldCompress (Boolean) Specifies if it should compress the entire structure or not.\
	 *    - compact (Boolean) Upon channel create/destroy it will try to run a compact operation over the file to save space.\
	 *    - map (String/Function) The map name (defaults to 'default'). If defined as a function it will receive the key as argument if possible (only for get/set/unset/setall)
	 * for sharding proposes.\
	 *    - multifile (Boolean) If true keys will be spread (by key hash) across several MVStore files on "path" (defaults to false) (*)\
	 *    - path (String) The folder where to keep the MVStore files (required if multifile is true)\
	 *    - files (Number) The number of MVStore files to use if multifile is true (defaults to 4 or to the number already in use on "path")\
	 * \
	 * The map will be created if it doesn't exist. Operations getKeys/getAll can be paginated with the extra map argument containing start and end\
	 * \
	 * (*) - With multifile the files are named mvs-NN.db and a mvs-multifile.json manifest records the number of files (to change it use ow.ch.utils.mvs.reshard).
	 * All other options apply to each file. getKeys/getAll (including start/end pagination) and pop/shift go through the files in order (no global key ordering).\
	 * Each file can be handled individually with ow.ch.utils.mvs.\
	 * </odoc>
	 */
	mvs: {
		__open: function(absFile, shouldCompress) {
			if (isUnDef(this.__f[absFile])) {
				var s = Packages.org.h2.mvstore.MVStore.Builder().autoCommitDisabled();
				if (absFile != "memory") s = s.fileName(absFile);
				if (shouldCompress) s = s.compress();
				this.__f[absFile] = s.open();
			}
			if (absFile != "memory") this.__f[absFile].setReuseSpace(true);
			return this.__f[absFile];
		},
		// Shard file names for a multifile path (mvs-00.db, mvs-01.db, ...)
		__fnames: function(aPath, aN) {
			var width = Math.max(2, String(aN - 1).length);
			var res = [];
			for(var i = 0; i < aN; i++) {
				var n = String(i);
				while(n.length < width) n = "0" + n;
				res.push(aPath + "/mvs-" + n + ".db");
			}
			return res;
		},
		// Shard index for an already canonical (untrimmed) key string
		__hidx: function(aCanonicalKey, aN) {
			if (aN <= 1) return 0;
			return Number(java.lang.Math.floorMod(new java.lang.String(aCanonicalKey).hashCode(), aN));
		},
		__idx: function(aName, aKey) {
			// Always hash the untrimmed canonical key so internalTrim can't move keys between files
			return this.__hidx(stringify(sortMapKeys(aKey), __, ""), this.__o[aName].files);
		},
		__st: function(aName, aKey) {
			return this.__ss[aName][this.__idx(aName, aKey)];
		},
		__k: function(aName, aKey) {
			return stringify(sortMapKeys(aKey), __, this.__o[aName].stry);
		},
		__page: function(aName, full, fn) {
			var res = [];
			full = _$(full, "full").isMap().default({});

			var mapName = this.__m[aName](full);
			var maps = this.__ss[aName].map(s => s.openMap(mapName));

			if (isDef(full.start) || isDef(full.end)) {
				var start = _$(full.start, "full.start").isNumber().default(0);
				var limit = _$(full.end, "full.end").isNumber().default(Infinity);

				var offset = 0;
				for(var m = 0; m < maps.length && offset < limit; m++) {
					var size = Number(maps[m].sizeAsLong());
					for(var i = Math.max(start - offset, 0); i < size && offset + i < limit; i++) {
						res.push(fn(maps[m], maps[m].getKey(i)));
					}
					offset += size;
				}
			} else {
				maps.forEach(map => {
					af.fromJavaArray(map.keyList()).forEach(k => res.push(fn(map, k)));
				});
			}

			return res;
		},
		create       : function(aName, shouldCompress, options) {
			if (isUnDef(options)) options = {};
			if (isUnDef(options.file)) options.file = undefined;

			if (isUnDef(this.__s)) this.__s = {};
			if (isUnDef(this.__ss)) this.__ss = {};
			if (isUnDef(this.__f)) this.__f = {};
			if (isUnDef(this.__m)) this.__m = {};
			if (isUnDef(this.__o)) this.__o = {};

			var shut = _$(options.closeOnShutdown).isBoolean().default(true);
			options.multifile = _$(options.multifile, "options.multifile").isBoolean().default(false);

			var absFiles = [];
			if (options.multifile) {
				_$(options.path, "options.path").isString().$_();
				var absPath = String((new java.io.File(options.path)).getAbsoluteFile());
				io.mkdir(absPath);

				var manifestFile = absPath + "/mvs-multifile.json";
				var manifest = io.fileExists(manifestFile) ? io.readFileJSON(manifestFile) : __;
				if (isMap(manifest) && isNumber(manifest.files)) {
					if (isDef(options.files) && options.files != manifest.files) throw "mvs multifile: options.files (" + options.files + ") doesn't match the " + manifest.files + " files already in use on " + absPath;
					options.files = manifest.files;
				} else {
					options.files = _$(options.files, "options.files").isNumber().default(4);
					if (options.files < 1 || options.files != Math.floor(options.files)) throw "mvs multifile: options.files needs to be an integer >= 1";
					io.writeFileJSON(manifestFile, { files: options.files, hash: "javaStringHashCode", version: 1 }, "");
				}

				absFiles = this.__fnames(absPath, options.files);
			} else {
				options.files = 1;
				absFiles.push(isDef(options.file) ? String((new java.io.File(options.file)).getAbsoluteFile()) : "memory");
			}
			options.absFile  = absFiles[0];
			options.absFiles = absFiles;

			this.__ss[aName] = absFiles.map(f => this.__open(f, shouldCompress));
			this.__s[aName]  = this.__ss[aName][0];

			if (isUnDef(options.map)) {
				options.map = function() { return "default"; };
			} else {
				if (isString(options.map)) {
					options.map = newFn("return '" + options.map + "';");
				}
			}

			this.__m[aName] = options.map;

			if ((isDef(options.file) || options.multifile) && isDef(options.compact) && options.compact) {
				this.__ss[aName].forEach(s => s.compactFile(2500));
			}

			this.__o[aName] = options;
			if (isUnDef(options.internalTrim)) this.__o[aName].stry = ""; else this.__o[aName].stry = options.internalTrim;

			if (shut) {
				var parent = this;
				addOnOpenAFShutdown(function() { if (isDef(parent.__s[aName])) parent.destroy(aName);	});
			}
		},
		destroy      : function(aName) {
			var o = this.__o[aName], sts = this.__ss[aName];

			o.absFiles.forEach((f, i) => {
				if (f != "memory" && isDef(o.compact) && o.compact) sts[i].compactFile(2500);

				var found = Object.keys(this.__o).some(n => n != aName && this.__o[n].absFiles.indexOf(f) >= 0);
				if (!found) {
					sts[i].close();
					delete this.__f[f];
				}
			});

			delete this.__s[aName];
			delete this.__ss[aName];
			delete this.__o[aName];
		},
		size         : function(aName) {
			var mapName = this.__m[aName](), size = 0;
			this.__ss[aName].forEach(s => size += Number(s.openMap(mapName).sizeAsLong()));
			return size;
		},
		forEach      : function(aName, aFunction, x) {
			var aKs = this.getKeys(aName, x);

			for(var i in aKs) {
				aFunction(aKs[i], this.get(aName, aKs[i], x));
			}
		},
		getKeys      : function(aName, full) {
			return this.__page(aName, full, (map, k) => jsonParse(k, true));
		},
		getAll      : function(aName, full) {
			return this.__page(aName, full, (map, k) => jsonParse(map.get(k), true));
		},
		getSortedKeys: function(aName, full) {
			return this.getKeys(aName, full);
		},
		getSet       : function getSet(aName, aMatch, aK, aV, aTimestamp)  {
			var res;
			res = this.get(aName, aK);
			if ($stream([res]).anyMatch(aMatch)) {
				return this.set(aName, aK, aV, aTimestamp);
			}
			return undefined;
		},
		set          : function(aName, ak, av, aTimestamp) {
			var s = this.__st(aName, ak);
			var map = s.openMap(this.__m[aName](ak));

			map.put(this.__k(aName, ak), stringify(av, __, this.__o[aName].stry));
			s.commit();
			return ak;
		},
		setAll       : function(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp) {
			ow.loadObj();
			var touched = {};
			for(var iii in anArrayOfMapData) {
				var ak = ow.obj.filterKeys(anArrayOfKeys, anArrayOfMapData[iii]);
				var av = anArrayOfMapData[iii];
				var idx = this.__idx(aName, ak);
				var map = this.__ss[aName][idx].openMap(this.__m[aName](ak));
				map.put(this.__k(aName, ak), stringify(av, __, this.__o[aName].stry));
				touched[idx] = true;
			}
			Object.keys(touched).forEach(i => {
				this.__ss[aName][i].sync();
				this.__ss[aName][i].commit();
			});
		},
		unsetAll       : function(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp) {
			ow.loadObj();
			var touched = {};
			for(var iii in anArrayOfMapData) {
				var ak = ow.obj.filterKeys(anArrayOfKeys, anArrayOfMapData[iii]);
				var idx = this.__idx(aName, ak);
				var map = this.__ss[aName][idx].openMap(this.__m[aName](ak));
				map.remove(this.__k(aName, ak));
				touched[idx] = true;
			}
			Object.keys(touched).forEach(i => {
				this.__ss[aName][i].sync();
				this.__ss[aName][i].commit();
			});
		},
		get          : function(aName, aKey) {
			var map = this.__st(aName, aKey).openMap(this.__m[aName](aKey));

			var r = map.get(this.__k(aName, aKey));
			if (r == null || isUnDef(r)) return __; else return jsonParse(r, true);
		},
		// pop/shift return the key; ow.ch.pop/shift then get and unset it
		pop          : function(aName) {
			var mapName = this.__m[aName](), sts = this.__ss[aName];
			for(var i = sts.length - 1; i >= 0; i--) {
				var map = sts[i].openMap(mapName);
				if (map.sizeAsLong() > 0) return jsonParse(map.lastKey(), true);
			}
			return __;
		},
		shift        : function(aName) {
			var mapName = this.__m[aName](), sts = this.__ss[aName];
			for(var i = 0; i < sts.length; i++) {
				var map = sts[i].openMap(mapName);
				if (map.sizeAsLong() > 0) return jsonParse(map.firstKey(), true);
			}
			return __;
		},
		unset        : function(aName, aKey) {
			var map = this.__st(aName, aKey).openMap(this.__m[aName](aKey));

			return jsonParse(map.remove(this.__k(aName, aKey)), true);
		}
	},
	/**
	 * <odoc>
	 * <key>ow.ch.types.ignite</key>
	 * This channel type uses plugin-Ignite 3.1 tables with JSON keys and values. The creation options are:\
	 * \
	 *    - ignite (Ignite) Use a previously instantiated Ignite plugin (defaults to a new instance).\
	 *    - gridName (String) Use a specific Ignite node/client name.\
	 *    - client (Boolean) Connect a thin client instead of starting an embedded node.\
	 *    - configuration (Map) Ignite.configure options, including addresses or configFile/workDir.\
	 *    - persist (String) Persistent Ignite 3 work directory (alias for configuration.workDir).\
	 *    - cacheName (String) Shared backing table name (defaults to the channel name).\
	 *    - keepOnDestroy (Boolean) Keep the backing table when destroying the channel (default false).\
	 * \
	 * </odoc>
	 */
	ignite: {
		__channels: Object.create(null),
		_key: function(aKey) {
			return JSON.stringify(aKey, function(key, value) {
				if (!isMap(value)) return value;
				var sorted = Object.create(null);
				Object.keys(value).sort().forEach(function(k) { sorted[k] = value[k]; });
				return sorted;
			});
		},
		create: function(aName, shouldCompress, options) {
			options = _$(options).isMap().default({});
			if (isDef(getOPackPath("plugin-Ignite"))) loadExternalJars(getOPackPath("plugin-Ignite"));
			plugin("Ignite");
			var ig = isDef(options.ignite) ? options.ignite : new Ignite();
			if (!ig.isStarted()) {
				var config = clone(_$(options.configuration).isMap().default({}));
				if (isDef(options.persist)) config.workDir = options.persist;
				ig.configure(config);
				ig.start(options.gridName, __, options.client === true);
			}
			this.__channels[aName] = { ignite: ig, cache: ig.getOrCreateCache(_$(options.cacheName).isString().default(aName)), keepOnDestroy: options.keepOnDestroy === true };
		},
		destroy: function(aName) {
			var state = this.__channels[aName];
			if (!state.keepOnDestroy) state.cache.destroy();
			delete this.__channels[aName];
		},
		size: function(aName) { return Number(this.__channels[aName].cache.size()); },
		forEach: function(aName, aFunction) {
			var parent = this;
			this.getKeys(aName).forEach(function(key) { aFunction(key, parent.get(aName, key)); });
		},
		getKeys: function(aName, full) {
			var keys = this.__channels[aName].cache.keys(), result = [];
			for (var i = 0; i < keys.length; i++) result.push(JSON.parse(String(keys[i])));
			return result;
		},
		getSortedKeys: function(aName, full) { return this.getKeys(aName, full); },
		getSet: function(aName, aMatch, aK, aV, aTimestamp) {
			var cache = this.__channels[aName].cache, key = this._key(aK), value = JSON.stringify(aV);
			// Retry against the actual value if a writer wins between the read and CAS.
			while (true) {
				var previous = cache.get(key);
				var current = isNull(previous) ? __ : JSON.parse(String(previous));
				if (!$stream([current]).anyMatch(aMatch)) return __;
				if (isNull(previous) ? cache.putIfAbsent(key, value) : cache.replace(key, String(previous), value)) return aV;
			}
		},
		set: function(aName, aKey, aValue, aTimestamp) {
			this.__channels[aName].cache.put(this._key(aKey), JSON.stringify(aValue));
			return aKey;
		},
		setAll: function(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp) {
			for (var i in anArrayOfMapData) this.set(aName, ow.loadObj().filterKeys(anArrayOfKeys, anArrayOfMapData[i]), anArrayOfMapData[i], aTimestamp);
		},
		unsetAll: function(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp) {
			for (var i in anArrayOfMapData) this.unset(aName, ow.loadObj().filterKeys(anArrayOfKeys, anArrayOfMapData[i]));
		},
		get: function(aName, aKey) {
			var value = this.__channels[aName].cache.get(this._key(aKey));
			return isNull(value) ? __ : JSON.parse(String(value));
		},
		pop: function(aName) {
			var keys = this.getSortedKeys(aName);
			return keys[keys.length - 1];
		},
		shift: function(aName) { return this.getSortedKeys(aName)[0]; },
		unset: function(aName, aKey) { return this.__channels[aName].cache.remove(this._key(aKey)); }
	},
	// etcd implementation (etcd v2)
	//
	/**
	 * <odoc>
	 * <key>ow.ch.types.etcd</key>
	 * This OpenAF channel implementation connects to an etcd v2 key/value store. The creation options are:\
	 * \
	 *    - url             (String)   The HTTP(S) URL of the etcd daemon (e.g. http://etcd-host:2379). Mandatory.\
	 *    - folder          (String)   Optional key prefix/folder path to scope all channel operations (defaults to root).\
	 *    - throwExceptions (Boolean)  If true (default) HTTP errors from etcd will be thrown as exceptions.\
	 *    - default         (Object)   Optional default value to return when a request fails instead of throwing.\
	 *    - preAction       (Function) Optional function called before every HTTP request (receives the $rest options map).\
	 * \
	 * Note: this implementation targets the etcd v2 HTTP API (/v2/keys). For etcd v3 consider an alternative approach.\
	 * \
	 * Example:\
	 * \
	 *    ow.ch.create("myEtcd", false, "etcd", { url: "http://etcd:2379", folder: "/myapp" });\
	 * \
	 * </odoc>
	 */
	etcd: {
		__channels: Object.create(null),
		__escape: (s) => {
			return encodeURIComponent(stringify(sortMapKeys(s), __, "")).replace(/%2F/g, "%25--%3B");
		},
		__unescape: (s) => {
			return jsonParse(s.replace(/\%--\;/g, "/"));
		},
		create       : function(aName, shouldCompress, options) {
			this.__channels[aName] = {};
			options = _$(options).isMap().default({});
			_$(options.url).isString().$_("A string etcd daemon url is mandatory.");
			options.folder = _$(options.folder).isString().default("");
			options.folder = (options.folder != "" ? options.folder.replace(/^\/*/, "/").replace(/\/+$/, "").replace(/\/+/g, "/") : "");
			options.throwExceptions = _$(options.throwExceptions).default(true);
			options.default = _$(options.default).default(__);

			this.__channels[aName] = options;
		},
		destroy      : function(aName) {
			delete this.__channels[aName];
		},
		size         : function(aName) {
			var res = $rest({ preAction: this.__channels[aName].preAction, throwExceptions: this.__channels[aName].throwExceptions, default: this.__channels[aName].default }).get(this.__channels[aName].url + "/v2/keys" + this.__channels[aName].folder);
			if (isDef(res) && isUnDef(res.error) && isDef(res.node) && isDef(res.node.nodes)) {
				return $from(res.node.nodes).notEquals("dir", true).count();
			} else {
				return 0;
			}
		},
		forEach      : function(aName, aFunction) {
			var res = $rest({ preAction: this.__channels[aName].preAction, throwExceptions: this.__channels[aName].throwExceptions, default: this.__channels[aName].default }).get(this.__channels[aName].url + "/v2/keys" + this.__channels[aName].folder);
			var parent = this;
			if (isDef(res) && isUnDef(res.error) && isDef(res.node) && isDef(res.node.nodes)) {
				res.node.nodes.forEach((a) => {
					if (isUnDef(a.dir)) {
						aFunction(parent.__unescape(a.key), jsonParse(a.value));
					}
				});
				return mapArray(res.node.nodes, ["key"]);
			} else {
				return __;
			}
		},
		getAll      : function(aName, full) {
			var res = $rest({ preAction: this.__channels[aName].preAction, throwExceptions: this.__channels[aName].throwExceptions, default: this.__channels[aName].default }).get(this.__channels[aName].url + "/v2/keys" + this.__channels[aName].folder);
			if (isDef(res) && isUnDef(res.error) && isDef(res.node) && isDef(res.node.nodes)) {
				return $from(res.node.nodes).notEquals("dir", true).select((r) => { return jsonParse(r.value); });
			} else {
				return [];
			}
		},
		getKeys      : function(aName, full) {
			var res = $rest({ preAction: this.__channels[aName].preAction, throwExceptions: this.__channels[aName].throwExceptions, default: this.__channels[aName].default }).get(this.__channels[aName].url + "/v2/keys" + this.__channels[aName].folder);
			var parent = this;
			if (isDef(res) && isUnDef(res.error) && isDef(res.node) && isDef(res.node.nodes)) {
				return $from(res.node.nodes).notEquals("dir", true).select((r) => { return parent.__unescape(r.key.replace(new RegExp("^/*" + parent.__channels[aName].folder + "/"), "")); });
			} else {
				return [];
			}
		},
		getSortedKeys: function(aName, full) {
			var res = $rest({ preAction: this.__channels[aName].preAction, throwExceptions: this.__channels[aName].throwExceptions, default: this.__channels[aName].default }).get(this.__channels[aName].url + "/v2/keys" + this.__channels[aName].folder);
			var parent = this;
			if (isDef(res) && isUnDef(res.error) && isDef(res.node) && isDef(res.node.nodes)) {
				return $from(res.node.nodes).notEquals("dir", true).sort("modifiedIndex").select((r) => { return parent.__unescape(r.key.replace(new RegExp("^/*" + parent.__channels[aName].folder + "/"), "")); });
			} else {
				return [];
			}
		},
		getSet       : function getSet(aName, aMatch, aK, aV, aTimestamp)  {
			/*var res;
			res = this.get(aName, aK);
			if ($stream([res]).anyMatch(aMatch)) {
				return this.set(aName, aK, aV, aTimestamp);
			}
			return __;*/
			throw "Not implemented yet";
		},
		set          : function(aName, aK, aV, aTimestamp) {
			var res = $rest({ urlEncode:true, preAction: this.__channels[aName].preAction, throwExceptions: this.__channels[aName].throwExceptions, default: this.__channels[aName].default }).put(this.__channels[aName].url + "/v2/keys" + this.__channels[aName].folder + "/" + this.__escape(aK), { value: stringify(aV, __, "") });
			if (isDef(res) && isDef(res.node) && isDef(res.node.value)) {
				return jsonParse(res.node.value);
			} else {
				return __;
			}
		},
		setAll       : function(aName, aKs, aVs, aTimestamp) {
			ow.loadObj();
			for(var i in aVs) {
				this.set(aName, ow.obj.filterKeys(aKs, aVs[i]), aVs[i], aTimestamp);
			}
		},
		unsetAll     : function(aName, aKs, aVs, aTimestamp) {
			ow.loadObj();
			for(var i in aVs) {
				this.unset(aName, ow.obj.filterKeys(aKs, aVs[i]), aVs[i], aTimestamp);
			}
		},		
		get          : function(aName, aK) {
			var res = $rest({ preAction: this.__channels[aName].preAction, throwExceptions: this.__channels[aName].throwExceptions, default: this.__channels[aName].default }).get(this.__channels[aName].url + "/v2/keys" + this.__channels[aName].folder + "/" + this.__escape(aK));
			if (isDef(res) && isDef(res.node)) 
				return jsonParse(res.node.value);
			else
				return __;
		},
		pop          : function(aName) {
			var elems = this.getSortedKeys(aName);
			var elem = elems[elems.length - 1];
			return elem;
		},
		shift        : function(aName) {
			var elems = this.getSortedKeys(aName);
			var elem = elems[0];
			return elem;
		},
		unset        : function(aName, aK, aTimestamp) {
			$rest({ preAction: this.__channels[aName].preAction, throwExceptions: this.__channels[aName].throwExceptions, default: this.__channels[aName].default }).delete(this.__channels[aName].url + "/v2/keys" + this.__channels[aName].folder + "/" + this.__escape(aK));
		}
	},
	/**
	 * <odoc>
	 * <key>ow.ch.types.all</key>
	 * This channel type aggregates access to several channels. The creation options are:\
	 * \
	 *    - chs      (Array)    An array of names of channels to aggregate.\
	 *    - fn       (Function) A function that will receive an operation, a key and value (when applicable)) to return which channel name should be used (if no return or void all channels will be considered).\
	 *    - errFn    (Function) A function to call with: the name of this channel, the exception, the target channel, the operation and the arguments whenever a error occurs accessing a channel.\
	 *    - fnTrans  (Function) A function to translate the key (for example, to remove elements used only on fn).\
	 *    - fnKeys   (Function) Allows to filter an array of resulting keys, from different channels, for: getKeys, getSortedKeys\
	 *    - fnValues (Function) Allows to filter an array of resulting values, from different channels, for: getAll, get, getSet, set and unset\
	 *    - treatAll (Boolean)  If true size, setAll and unsetAll will be executed individually and fn called for each (default is false and size will take the first result)\
	 * \
	 * </odoc>
	 */
	all: {
		__o: {},
		__r: function(aName, aCh, op, args) {
			try {
				return $ch(aCh)[op].apply(this, args);
			} catch(e) {
				this.__o[aName].errFn(aName, e, aCh, op, args);
			}
		},
		create       : function(aName, shouldCompress, options) {
			options.ch = _$(options.chs, "chs").isArray().default([]);
			options.errFn = _$(options.errFn, "errFn").isFunction().default(e => {
				logErr(e);
			});
			options.fn = _$(options.fn, "fn").isFunction().default((aOp, k) => {
				return __;
			});
			options.fnTrans = _$(options.fnTrans, "fnTrans").isFunction().default(k => {
				return k;
			});
			options.fnKeys = _$(options.fnKeys, "fnValues").isFunction().default(ks => {
				return ks;
			});
			options.fnValues = _$(options.fnValues, "fnValues").isFunction().default(vs => {
				return vs;
			});
			options.treatAll = _$(options.treatAll, "treatAll").isBoolean().default(false);
			this.__o[aName] = options;
		},
		destroy      : function(aName) {
			delete this.__o[aName];
		},
		size         : function(aName) {
			var arr = [];
			var _lst = this.__o[aName].fn("size", __);
			var lst = (isDef(_lst) ? _lst : this.__o[aName].chs);
			if (!isArray(lst)) lst = [ lst ];

			if (this.__o[aName].treatAll) {
				var res = $atomic(0);
				
				lst.forEach(c => {
					arr.push($doV( () => {
						var _o = this.__r(aName, c, "size");
						if (isDef(_o)) res.getAdd(_o);
					}));
				});
		
				$doWait($doAll(arr));
				return res.get();
			} else {
				var res;

				lst.forEach(c => {
					arr.push($doV( () => {
						if (isUnDef(res)) {
							var _o = this.__r(aName, c, "size");
							if (isDef(_o)) res = _o;
						}
					}));
				});
		
				$doWait($doFirst(arr));
				return res;
			}

		},		
		get          : function(aName, aK) {
			ow.loadObj();
			var arr = [], res = new ow.obj.syncArray();
			var _lst = this.__o[aName].fn("get", aK);
			var lst = (isDef(_lst) ? _lst : this.__o[aName].chs);
			var parent = this;
			
			if (!isArray(lst)) lst = [ lst ];
			lst.forEach(c => {
				arr.push($doV( () => {
					var _o = parent.__r(aName, c, "get", [ parent.__o[aName].fnTrans(aK) ]);
					if (isDef(_o)) res.add(_o);
					return 1;
				}));
			});
	
			$doWait($doAll(arr));
	
			return (res.length() > 0 ? this.__o[aName].fnValues(res.toArray())[0] : __);
		},
		forEach      : function(aName, aFunction) {
			var arr = [];
			var _lst = this.__o[aName].fn("foreach", __);
			var lst = (isDef(_lst) ? _lst : this.__o[aName].chs);
			if (!isArray(lst)) lst = [ lst ];
			lst.forEach(c => {
				arr.push($doV( () => this.__r(aName, c, "forEach", [ aFunction ]) ));
			});
	
			$doWait($doAll(arr));
	
			return this;
		},
		getAll       : function(aName, full) {
			ow.loadObj();
			var arr = [], res = new ow.obj.syncArray();
			var _lst = this.__o[aName].fn("getall", __);
			var lst = (isDef(_lst) ? _lst : this.__o[aName].chs);
			if (!isArray(lst)) lst = [ lst ];
			lst.forEach(c => {
				arr.push($doV( () => {
					res.addAll( this.__r(aName, c, "getAll", [ full ]) );
				}));
			});
	
			$doWait($doAll(arr));
	
			return this.__o[aName].fnValues(res.toArray());
		},
		getKeys      : function(aName, full) {
			ow.loadObj();
			var arr = [], res = new ow.obj.syncArray();
			var _lst = this.__o[aName].fn("getkeys", __);
			var lst = (isDef(_lst) ? _lst : this.__o[aName].chs);
			if (!isArray(lst)) lst = [ lst ];
			lst.forEach(c => {
				arr.push($doV( () => {
					res.addAll( this.__r(aName, c, "getKeys", [ full ]) );
				}));
			});
	
			$doWait($doAll(arr));
	
			return this.__o[aName].fnKeys(res.toArray());
		},
		getSortedKeys: function(aName, full) {
			var arr = [], res = new ow.obj.syncArray();
			var _lst = this.__o[aName].fn("getsortedkeys", __);
			var lst = (isDef(_lst) ? _lst : this.__o[aName].chs);
			if (!isArray(lst)) lst = [ lst ];
			lst.forEach(c => {
				arr.push($doV( () => {
					res.addAll( this.__r(aName, c, "getSortedKeys", [ full ]) );
				}));
			});
	
			$doWait($doAll(arr));
	
			return this.__o[aName].fnKeys(res.toArray());		
		},
		getSet       : function getSet(aName, aMatch, aK, aV, aTimestamp)  {
			ow.loadObj();
			var arr = [], res = new ow.obj.syncArray();
			var _lst = this.__o[aName].fn("getset", aK, aV);
			var lst = (isDef(_lst) ? _lst : this.__o[aName].chs);
			if (!isArray(lst)) lst = [ lst ];
			lst.forEach(c => {
				arr.push($doV( () => {
					res.add( this.__r(aName, c, "getSet", [ aMatch, this.__o[aName].fnTrans(aK), aV, aTimestamp ]) );
				}));
			});
	
			$doWait($doAll(arr));
	
			return this.__o[aName].fnValues(res.toArray());
		},
		set          : function(aName, aK, aV, aTimestamp) {
			var arr = [], res = new ow.obj.syncArray();
			var _lst = this.__o[aName].fn("set", aK, aV);
			var lst = (isDef(_lst) ? _lst : this.__o[aName].chs);
			if (!isArray(lst)) lst = [ lst ];
			lst.forEach(c => {
				arr.push($doV( () => {
					res.add( this.__r(aName, c, "set", [ this.__o[aName].fnTrans(aK), aV, aTimestamp ]) );
				}));
			});
	
			$doWait($doAll(arr));
	
			return this.__o[aName].fnValues(res.toArray());
		},
		setAll       : function(aName, aKs, aVs, aTimestamp) {
			ow.loadObj();
			if (this.__o[aName].treatAll) {
				aVs.forEach(v => this.set(aName, ow.obj.filterKeys(aKs, v), v));
			} else {
				var arr = [];
				var _lst = this.__o[aName].fn("setall", aKs, aVs);
				var lst = (isDef(_lst) ? _lst : this.__o[aName].chs);
				if (!isArray(lst)) lst = [ lst ];
				var naKs = aKs.map(this.__o[aName].fnTrans);
				lst.forEach(c => arr.push($doV( () => this.__r(aName, c, "setAll", [ naKs, aVs, aTimestamp ]) )) );
	
				$doWait($doAll(arr));
			}
	
			return __;
		},
		unsetAll     : function(aName, aKs, aVs, aTimestamp) {
			if (this.__o[aName].treatAll) {
				ow.loadObj();
				aVs.forEach(v => this.unset(aName, ow.obj.filterKeys(aKs, v), v) );
			} else {
				var arr = [];
				var _lst = this.__o[aName].fn("unsetall", aKs, aVs);
				var lst = (isDef(_lst) ? _lst : this.__o[aName].chs);
				if (!isArray(lst)) lst = [ lst ];
				var naKs = aKs.map(this.__o[aName].fnTrans);
				lst.forEach(c => {
					arr.push($doV( () => {
						res.add( this.__r(aName, c, "unsetAll", [ naKs, aVs, aTimestamp ]) );
					}));
				});
		
				$doWait($doAll(arr));
			}
			return __;
		},
		pop          : function(aName) {
			var elems = this.getSortedKeys(aName);
			var elem = elems[elems.length - 1];
			var res = clone(this.get(aName, elem));
			this.unset(aName, elem);
			return elem;
		},
		shift        : function(aName) {
			var elems = this.getSortedKeys(aName);
			var elem = elems[0];
			var res = clone(this.get(aName, elem));
			this.unset(aName, elem);
			return elem;
		},
		unset        : function(aName, aK, aTimestamp) {
			ow.loadObj();
			var arr = [], res = new ow.obj.syncArray();
			var _lst = this.__o[aName].fn("unset", aK, aV);
			var lst = (isDef(_lst) ? _lst : this.__o[aName].chs);
			if (!isArray(lst)) lst = [ lst ];
			lst.forEach(c => {
				arr.push($doV( () => {
					res.add( this.__r(aName, c, "unset", [ this.__o[aName].fnTrans(aK), aTimestamp ]) );
				}));
			});
	
			$doWait($doAll(arr));
	
			return this.__o[aName].fnValues(res.toArray());
		}
	}
};
	
/**
 * <odoc>
 * <key>ow.ch.create(aName, shouldCompress, type, options) : ow.ch</key>
 * Creates a channel of key/values with aName. Optionally you can specify if keys should also
 * be compressed in memory (shouldCompress = true), a channels implementation type and corresponding
 * options in a map.\
 * \
 * Example:\
 * \
 * ow.ch.create("myChan", false, "db", { db: myDB, from: "TABLE" });\
 * </odoc>
 */
OpenWrap.ch.prototype.create = function(aName, shouldCompress, type, options) {
	this.__lifecycleLock.lock();
	try {
		if (Object.keys(this.channels).indexOf(aName) < 0) {
			type = (isDef(type)) ? type : "simple";
			this.__types[type].create(aName, shouldCompress, options);

			this.subscribers[aName] = {};
			this.peers[aName] = {};
			this.expose[aName] = [];
			this.jobs[aName] = {};
			this.vers[aName] = nowUTC();
			this.lock[aName] = new java.util.concurrent.locks.ReentrantLock();
			this.lock2[aName] = new java.util.concurrent.locks.ReentrantLock();
			// Publish only after all per-channel state is initialized.
			this.channels[aName] = type;
		}
	} finally {
		this.__lifecycleLock.unlock();
	}
	return this;
};
	
/**
 * <odoc>
 * <key>ow.ch.getVersion(aName) : Number</key>
 * Returns the current version (usually a timestamp) for the aName channel.
 * </odoc>
 */
OpenWrap.ch.prototype.getVersion = function(aName) {
	if (isUnDef(this.channels[aName])) throw "Channel " + aName + " doesn't exist.";
	
	return this.vers[aName];
};
	
/**
 * <odoc>
 * <key>ow.ch.waitForJobs(aName, aTimeout) : ow.ch</key>
 * Each channel subscription (using ow.ch.subscribe) will create internal jobs (threads). To wait for 
 * this jobs to finish provide the channel aName and, optionally, aTimeout.
 * </odoc>
 */
OpenWrap.ch.prototype.waitForJobs = function(aName, aTimeout) {
	aTimeout = _$(aTimeout).isNumber("aTimeout should be a number").default(-1);

	if (Object.keys(this.jobs[aName]).length == 0) return this;
	
	var shouldContinue = 0, tini = now();
	do {
		shouldContinue = 0;
		for(var ii in this.jobs[aName]) {
			var _st = this.jobs[aName][ii].state.get()
			if (_st != this.jobs[aName][ii].states.FULFILLED &&
			    _st != this.jobs[aName][ii].states.FAILED) {
				$doWait(this.jobs[aName][ii], (aTimeout >= 0 ? aTimeout : __));
			} else {
				shouldContinue++;
			}
		}
	} while(shouldContinue >= Object.keys(this.jobs[aName]).length && (now() - tini) < aTimeout);		
	return this;
},
	
/**
 * <odoc>
 * <key>ow.ch.stopAllJobs(aName) : ow.ch</key>
 * Each channel subscription (using ow.ch.subscribe) will create internal jobs (threads). To stop all these
 * immediately provide the channel aName.
 * </odoc>
 */
OpenWrap.ch.prototype.stopAllJobs = function(aName) {
	for(var i in ow.ch.jobs[aName]) {
		//ow.ch.jobs[aName][i].stop();
		ow.ch.jobs[aName][i].cancel();
	}	
	return this;
};
	
/**
 * <odoc>
 * <key>ow.ch.list() : Array</key>
 * Returns a list the current channels available.
 * </odoc>
 */
OpenWrap.ch.prototype.list = function() {
	this.__lifecycleLock.lock();
	try {
		return Object.keys(this.channels);
	} finally {
		this.__lifecycleLock.unlock();
	}
};
	 
/**
 * <odoc>
 * <key>ow.ch.destroy(aName) : ow.ch</key>
 * Deletes all data and removes references to the channel aName, including its locks.
 * Stop producers and wait for pending channel operations/subscriber jobs before destroying a channel.
 * Channel creation, destruction and listing are serialized; destruction does not drain active operations.
 * </odoc>
 */
OpenWrap.ch.prototype.destroy = function(aName) {
	this.__lifecycleLock.lock();
	try {
		if (isDef(this.__types[this.channels[aName]])) {
			// Preserve the registration if backend cleanup fails so it can be retried.
			this.__types[this.channels[aName]].destroy(aName);

			delete this.channels[aName];
			delete this.subscribers[aName];
			delete this.peers[aName];
			delete this.expose[aName];
			delete this.jobs[aName];
			delete this.vers[aName];
			delete this.lock[aName];
			delete this.lock2[aName];
		}
	} finally {
		this.__lifecycleLock.unlock();
	}

	return this;
};
	
OpenWrap.ch.prototype.close = function(aName) {
	return this.destroy(aName);
};

/**
 * <odoc>
 * <key>ow.ch.size(aName) : Number</key>
 * Returns the number of keys currently available for the channel aName.
 * </odoc>
 */
OpenWrap.ch.prototype.size = function(aName) {
	if (isUnDef(ow.ch.channels[aName])) throw "Channel " + aName + " doesn't exist.";
	//	switch(ow.ch.channels[aName]) {
	//	case "ignite": { return ow.ch.__types.ignite.size(aName); break; }
	//	case "remote": { return ow.ch.__types.remote.size(aName); break; }
	//	default      : { return ow.ch.__types.big.size(aName); }
	//	}

	var res, error;
	ow.ch.lock[aName].lock();
	//sync(function() {
	try {
		res = ow.ch.__types[ow.ch.channels[aName]].size(aName);
	} catch(e) {
		error = e;
	} finally {
		ow.ch.lock[aName].unlock();
	}
	//}, this.channels[aName]);
	if (isDef(error)) throw error;
	return res;
};

OpenWrap.ch.prototype.__errorHandle = function(id, e) {
	try {
		var d = new Date();
		$ch("__ch::errors").set({
			id: id,
			date: d
		}, {
			id: id,
			date: d,
			exception: String(e)
		});
	} catch(e1) {
	}
};

/**
 * <odoc>
 * <key>ow.ch.subscribe(aName, aFunction, onlyFromNowm, anId) : String</key>
 * Adds a callback function to the channel aName. The callback function will receive, as arguments:
 * the channel name, the operation, a key or an array of keys (for operation = setall/unsetall), a value or an array 
 * of values (for operation = setall/unsetall) and the ow.ch object. Returns the subscriber id.
 * Optionally you can specify that existing
 * elements won't trigger operation = set callback calls and/or a custom subscriber anId.\
 * \
 * Possible operations:\
 *    - set\
 *    - setall\
 *    - unset\
 *    - unsetall\
 * \
 * </odoc>
 */
OpenWrap.ch.prototype.subscribe = function(aName, aFunction, onlyFromNow, anId) {
	if (isUnDef(this.channels[aName])) throw "Channel " + aName + " doesn't exist.";
	if (isUnDef(anId)) anId = genUUID();
	
	if (isDef(this.subscribers[aName][anId])) return anId;
	
	this.subscribers[aName][anId] = aFunction;
	if (this.size(aName) > 0 && !onlyFromNow) {
		var parent = this;

		var func = function(aKey) {
			var aValue = parent.get(aName, aKey);
			var uuid = genUUID();
			if (isUnDef(parent.jobs[aName][anId])) {
				parent.jobs[aName][anId] = $doV(function() {
					try {
						aFunction(aName, "set", aKey, aValue, parent, uuid);
					} catch(e) {}
					return uuid;
				});
			} else {
				parent.jobs[aName][anId].then(function() {
					try {
						aFunction(aName, "set", aKey, aValue, parent, uuid);
					} catch(e) {}
					return uuid;
				});
			}			
		};
		
		res = parent.__types[parent.channels[aName]].forEach(aName, func);
	}
	return anId;
};
	
/**
 * <odoc>
 * <key>ow.ch.unsubscribe(aName, aId) : ow.ch</key>
 * Tries to unsubscribe aId callback from the channel identified by the aName provided.
 * </odoc>
 */
OpenWrap.ch.prototype.unsubscribe = function(aName, aId) {
	if (isUnDef(this.channels[aName])) throw "Channel " + aName + " doesn't exist.";

	var parent = this;
	delete parent.subscribers[aName][aId];
	Object.keys(parent.peers[aName]).forEach((v) => {
		if (parent.peers[aName][v].indexOf(aId) >= 0) 
			parent.peers[aName][v] = deleteFromArray(parent.peers[aName][v], parent.peers[aName][v].indexOf(aId));
	});
	return this;
};

/**
 * <odoc>
 * <key>ow.ch.unsubscribeAll(aName) : ow.ch</key>
 * Tries to unsubscribe all callback functions from the channel identified by the aName provided.
 * </odoc>
 */
OpenWrap.ch.prototype.unsubscribeAll = function(aName) {
	if (isUnDef(this.channels[aName])) throw "Channel " + aName + " doesn't exist.";
	
	this.subscribers[aName] = {};
	this.peers[aName] = {};
	return this;
};
	
/**
 * <odoc>
 * <key>ow.ch.forEach(aName, aFunction) : ow.ch</key>
 * Will execute the provided aFunction with each key and value for the channel identified by the aName provided.
 * </odoc>
 */
OpenWrap.ch.prototype.forEach = function(aName, aFunction, x) {
	if (isUnDef(ow.ch.channels[aName])) throw "Channel " + aName + " doesn't exist.";

	ow.ch.__types[ow.ch.channels[aName]].forEach(aName, aFunction, x);

	return ow.ch;
};
	
/**
 * <odoc>
 * <key>ow.ch.getAll(aName, fullInfo) : Array</key>
 * Will return all values for the channel identified by the aName provided.
 * </odoc>
 */
OpenWrap.ch.prototype.getAll = function(aName, x) {
	if (isUnDef(ow.ch.channels[aName])) throw "Channel " + aName + " doesn't exist.";	

	var res = [], error;
	var parent = this;
	
	if (isDef(ow.ch.__types[ow.ch.channels[aName]].getAll)) { 
		ow.ch.lock[aName].lock();
		//sync(function() {
			try {
				res = res.concat(parent.__types[parent.channels[aName]].getAll(aName, x));
			} catch(e) {
				error = e;
			} finally {
				ow.ch.lock[aName].unlock();
			}
		//}, x);
	} else {
		ow.ch.forEach(aName, function(aKey, aValue) {
 
			ow.ch.lock[aName].lock();
			//sync(function() { 
				try {
					res.push(aValue); 
				} catch(e) {
					error = e;
				} finally {
					ow.ch.lock[aName].unlock();
				}
			//}, res);
		}, x);
	}
	if (isDef(error)) throw error;

	return res;
};
	
/**
 * <odoc>
 * <key>ow.ch.getKeys(aName, full) : Array</key>
 * Returns all keys in the form of an array for the channel identified by the aName provided. Optionally
 * you can specify full = yes to obtain the detailed internal key index.
 * </odoc>
 */
OpenWrap.ch.prototype.getKeys = function(aName, full, x) {
	if (isUnDef(ow.ch.channels[aName])) throw "Channel " + aName + " doesn't exist.";
	
	return ow.ch.__types[ow.ch.channels[aName]].getKeys(aName, full, x);
};
	
/**
 * <odoc>
 * <key>ow.ch.getSortedKeys(aName, full) : Array</key>
 * Returns all keys in the form of an array for the channel identified by the aName provided by order of the last
 * modification. Optionally you can specify full = yes to obtain the detailed internal key index.
 * </odoc>
 */
OpenWrap.ch.prototype.getSortedKeys = function(aName, full, x) {
	if (isUnDef(ow.ch.channels[aName])) throw "Channel " + aName + " doesn't exist.";
	
//	switch(ow.ch.channels[aName]) {
//	case "ignite": { return ow.ch.__types.ignite.getSortedKeys(aName, full); break; }
//	case "remote": { return ow.ch.__types.remote.getSortedKeys(aName, full); break; }
//	default      : { return ow.ch.__types.big.getSortedKeys(aName, full); }
//	}
	return ow.ch.__types[ow.ch.channels[aName]].getSortedKeys(aName, full, x);
};
	
/**
 * <odoc>
 * <key>ow.ch.set(aName, aKey, aValue, aTimestamp)</key>
 * Tries to insert/update the channel identified by the provided aName with aKey and aValue.
 * Optionally you can provide the internal aTimestamp (if the provided aTimestamp is smaller than getVersion
 * the value will not be set)
 * </odoc>
 */
OpenWrap.ch.prototype.set = function(aName, aKey, aValue, aTimestamp, aUUID, x) {
	if (isUnDef(this.channels[aName])) throw "Channel " + aName + " doesn't exist.";
	if (isUnDef(aTimestamp)) {
		aTimestamp = nowUTC();
		if (this.getVersion(aName) > aTimestamp) return this;
	}
	
	var ak = aKey, av = aValue;
	if (typeof aKey != "object") ak = { "key": aKey };
	if (typeof aValue != "object") av = { "key": aKey, "value": aValue };
 
	var parent = this;
	var res, error; 
	ow.ch.lock[aName].lock();
	//sync(function() {
	try {
		res = parent.__types[parent.channels[aName]].set(aName, ak, av, aTimestamp, x); 
		parent.vers[aName] = nowUTC();
	} catch(e) {
		error = e;
	} finally {
		ow.ch.lock[aName].unlock();
	}
	//}, this.channels[aName]);
	if (isDef(error)) throw error;

	if (Object.keys(this.subscribers[aName]).length > 0) {
		for(var _i in this.subscribers[aName]) {
			if (isUnDef(parent.jobs[aName][_i])) {
				var f = (ii) => {
					return () => {		
						try {		
					        parent.subscribers[aName][ii](aName, "set", aKey, aValue, parent, aTimestamp, aUUID, x);
						} catch(e) {}
						return ii;
					};
				};
				parent.jobs[aName][_i] = $doV(f(_i)).catch((e) => { 
					ow.ch.__errorHandle({ 
						chName: aName,
						op: "set",
						key: aKey
					}, e);
				});
			} else {				
				var f = (ii) => {
					return () => {
						try {
							parent.subscribers[aName][ii](aName, "set", aKey, aValue, parent, aTimestamp, aUUID, x);
						} catch(e) {}
						return ii;
					};
				};
				parent.jobs[aName][_i].then(f(_i), ()=>{});
			}
		}
	}

	return res;
};
	
/**
 * <odoc>
 * <key>ow.ch.push(aName, aKey, aValue) : ow.ch</key>
 * Equivalent to ow.ch.set trying to set, for the channel aName, aKey and aValue trying to mimic
 * a queue behaviour.
 * </odoc>
 */
OpenWrap.ch.prototype.push = function(aName, aKey, aValue) {
	return this.set(aName, aKey, aValue);
};
	
/**
 * <odoc>
 * <key>ow.ch.setAll(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp)</key>
 * Given anArrayOfKeys composed of strings identifying the key fields from the anArrayOfMapData provided
 * will try to insert/update all values on the channel identified by aName. Optionally you can provide aTimestamp 
 * (if the provided aTimestamp is smaller than getVersion
 * the value will not be set)
 * </odoc>
 */
OpenWrap.ch.prototype.setAll = function(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp, aUUID, x) {
	if (isUnDef(this.channels[aName])) throw "Channel " + aName + " doesn't exist.";
	if (isUnDef(aTimestamp)) {
		aTimestamp = nowUTC();
		if (this.getVersion(aName) > aTimestamp) return this;
	}

	var parent = this;
	var res, error;
 
	ow.ch.lock[aName].lock();
	//sync(function() {
		try {
			res = parent.__types[parent.channels[aName]].setAll(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp, x);
			parent.vers[aName] = nowUTC();
		} catch(e) {
			error = e;
		} finally {
			ow.ch.lock[aName].unlock();
		}
	//}, this.channels[aName]);
	if (isDef(error)) throw error;

	if (Object.keys(this.subscribers[aName]).length > 0) {
		for(var _i in this.subscribers[aName]) {
			if (isUnDef(parent.jobs[aName][_i])) {
				var f = (ii) => {
					return () => {				
						try {
						  parent.subscribers[aName][ii](aName, "setall", anArrayOfKeys, anArrayOfMapData, parent, aTimestamp, aUUID, x);
						} catch(e) {};
						return ii;
					};
				};
				parent.jobs[aName][_i] = $doV(f(_i)).catch((e) => { 
					ow.ch.__errorHandle({ 
						chName: aName,
						op: "set",
						key: aKey
					}, e);
				});
			} else {				
				var f = (ii) => {
					return () => {
						try {
						  parent.subscribers[aName][ii](aName, "setall", anArrayOfKeys, anArrayOfMapData, parent, aTimestamp, aUUID, x);
						} catch(e) {};
						return ii;
					};
				};
				parent.jobs[aName][_i].then(f(_i));
			}
		}		
	}

	return res;
};
	
/**
 * <odoc>
 * <key>ow.ch.unsetAll(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp)</key>
 * Given anArrayOfKeys composed of strings identifying the key fields from the anArrayOfMapData provided
 * will try to delete all values on the channel identified by aName. Optionally you can provide aTimestamp 
 * (if the provided aTimestamp is smaller than getVersion
 * the value will not be set)
 * </odoc>
 */
OpenWrap.ch.prototype.unsetAll = function(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp, aUUID, x) {
	if (isUnDef(this.channels[aName])) throw "Channel " + aName + " doesn't exist.";
	if (isUnDef(aTimestamp)) {
		aTimestamp = nowUTC();
		if (this.getVersion(aName) > aTimestamp) return this;
	}

	var parent = this;
	var res, error;
	
	if (isUnDef(parent.__types[parent.channels[aName]].unsetAll)) return __; 
	ow.ch.lock[aName].lock();
	//sync(function() {
		try {
			res = parent.__types[parent.channels[aName]].unsetAll(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp, x);
			parent.vers[aName] = nowUTC();
		} catch(e) {
			error = e;
		} finally {
			ow.ch.lock[aName].unlock();
		}
	//}, this.channels[aName]);
	if (isDef(error)) throw error;

	if (Object.keys(this.subscribers[aName]).length > 0) {
		for(var _i in this.subscribers[aName]) {
			if (isUnDef(parent.jobs[aName][_i])) {
				var f = (ii) => {
					return () => {				
						try {
						  parent.subscribers[aName][ii](aName, "unsetall", anArrayOfKeys, anArrayOfMapData, parent, aTimestamp, aUUID, x);
						} catch(e) {};
						return ii;
					};
				};
				parent.jobs[aName][_i] = $doV(f(_i)).catch((e) => { 
					ow.ch.__errorHandle({ 
						chName: aName,
						op: "unset",
						key: aKey
					}, e);
				});
			} else {				
				var f = (ii) => {
					return () => {
						try {
						  parent.subscribers[aName][ii](aName, "unsetall", anArrayOfKeys, anArrayOfMapData, parent, aTimestamp, aUUID, x);
						} catch(e) {};
						return ii;
					};
				};
				parent.jobs[aName][_i].then(f(_i));
			}
		}		
	}

	return res;
};

/**
 * <odoc>
 * <key>ow.ch.get(aName, aKey) : ow.ch</key>
 * Returns the value associated with the provided aKey on the channel identified by aName.
 * </odoc>
 */
OpenWrap.ch.prototype.get = function(aName, aKey, x) {
	if (isUnDef(this.channels[aName])) throw "Channel " + aName + " doesn't exist.";

	if (typeof aKey != "object") aKey = { "key": aKey };

	var res, error;
	var parent = this 
	ow.ch.lock[aName].lock();
	//sync(function() {
	try {
		res = parent.__types[parent.channels[aName]].get(aName, aKey, x);
	} catch(e) {
		error = e;
	} finally {
		ow.ch.lock[aName].unlock();
	}
	//}, this.channels[aName]);
	if (isDef(error)) throw error;

	if (isDef(res) && Object.keys(res) == [ "value" ])
		return res.value;
	else
		return res;
};
	
/**
 * <odoc>
 * <key>ow.ch.pop(aName) : Object</key>
 * Mimics a LIFO queue behaviour by returning the last modified key/value entry for the channel aName. The entry
 * will be removed from the channel. 
 * </odoc>
 */
OpenWrap.ch.prototype.pop = function(aName) {
	if (isUnDef(this.channels[aName])) throw "Channel " + aName + " doesn't exist.";

	var res, out, error;
	ow.ch.lock2[aName].lock();
	try {
		if (this.size(aName) > 0) {
			res = this.__types[this.channels[aName]].pop(aName);
			out = this.get(aName, res);
			this.unset(aName, res);
		}
	} catch(e) { 
		error = e; 
	} finally {
		ow.ch.lock2[aName].unlock();
	}

	if (isDef(error)) throw error;
        
	return out;
};

/**
 * <odoc>
 * <key>ow.ch.getSet(aName, aMatchMap, aKey, aValue, aTimestamp, aUUID)</key>
 * Tries to update the channel identified by the provided aName with aKey and aValue only if it's possible to get the same aKey and 
 * aMatchMap matches the current aValue.
 * Optionally you can provide the internal aTimestamp (if the provided aTimestamp is smaller than getVersion
 * the value will not be set)
 * </odoc>
 */
OpenWrap.ch.prototype.getSet = function(aName, aMatch, aKey, aValue, aTimestamp, aUUID, x) {
	if (isUnDef(this.channels[aName])) throw "Channel " + aName + " doesn't exist.";
	
	var res, out, error;
	var parent = this 
	ow.ch.lock[aName].lock();
	//sync(function() {
	try {
		res = parent.__types[parent.channels[aName]].getSet(aName, aMatch, aKey, aValue, aTimestamp, x); 
		parent.vers[aName] = nowUTC();
	} catch(e) {
		error = e;
	} finally {
		ow.ch.lock[aName].unlock();
	}
	//}, this.channels[aName]);
	if (isDef(error)) throw error;
	
	if (Object.keys(this.subscribers[aName]).length > 0) {
		for(var _i in this.subscribers[aName]) {
			if (isUnDef(parent.jobs[aName][_i])) {
				var f = (ii) => {
					return () => {				
						try {
						  parent.subscribers[aName][ii](aName, "set", aKey, aValue, parent, aTimestamp, aUUID, x);
						} catch(e) {}
						return ii;
					};
				};
				parent.jobs[aName][_i] = $doV(f(_i)).catch((e) => { 
					ow.ch.__errorHandle({ 
						chName: aName,
						op: "set",
						key: aKey
					}, e);
				});
			} else {				
				var f = (ii) => {
					return () => {
						try {
						  parent.subscribers[aName][ii](aName, "set", aKey, aValue, parent, aTimestamp, aUUID, x);
						} catch(e) {}
						return ii;
					};
				};
				parent.jobs[aName][_i].then(f(_i));
			}
		}
	}

	return res;
}

/**
 * <odoc>
 * <key>ow.ch.shift(aName) : Object</key>
 * Mimics a FIFO queue behaviour by returning the first modified key/value entry for the channel aName. The entry
 * will be removed from the channel.
 * </odoc>
 */
OpenWrap.ch.prototype.shift = function(aName) {
	if (isUnDef(this.channels[aName])) throw "Channel " + aName + " doesn't exist.";

	var res, out, error;
	ow.ch.lock2[aName].lock();
	try {
		if (this.size(aName) > 0) {
	//		switch(this.channels[aName]) {
	//		case "ignite": { res = this.__types.ignite.shift(aName); break; }
	//		case "remote": { res = this.__types.remote.shift(aName); break; }
	//		default      : { res = this.__types.big.shift(aName); break; }
	//		}
			res = this.__types[this.channels[aName]].shift(aName);
			out = this.get(aName, res);
			this.unset(aName, res);
		}
	} catch(e) { 
		error = e;
	} finally {
		ow.ch.lock2[aName].unlock();
	}

	if (isDef(error)) throw error;

	return out;
};
	
/**
 * <odoc>
 * <key>ow.ch.unset(aName, aKey, aTimestamp) : ow.obj.channel</key>
 * Tries to remove all associations to the provided aKey on the channel identified by aName.
 * Optionally aTimestamp can be provided.
 * </odoc>
 */
OpenWrap.ch.prototype.unset = function(aName, aKey, aTimestamp, aUUID, x) {
	if (isUnDef(this.channels[aName])) throw "Channel " + aName + " doesn't exist.";
	if (isUnDef(aTimestamp)) {
		aTimestamp = nowUTC();
		if (this.getVersion(aName) > aTimestamp) return this;
	}
	
	var ak = aKey;
	if (typeof aKey != "object") ak = { "key": aKey };

	var parent = this, res, error; 
	ow.ch.lock[aName].lock();
	//sync(function() {	
	try {
		res = parent.__types[parent.channels[aName]].unset(aName, ak, x);
		parent.vers[aName] = nowUTC();
	} catch(e) {
		error = e;
	} finally {
		ow.ch.lock[aName].unlock();
	}
	//}, this.channels[aName]);
	if (isDef(error)) throw error;

	if (Object.keys(this.subscribers[aName]).length > 0) {
		for(var _i in this.subscribers[aName]) {
			if (isUnDef(parent.jobs[aName][_i])) {
				var f = (ii) => {
					return () => {				
						try {
							parent.subscribers[aName][ii](aName, "unset", aKey, undefined, parent, aTimestamp, aUUID, x);
						} catch(e) {};
						return ii;
					};
				};
				parent.jobs[aName][_i] = $doV(f(_i)).catch((e) => { 
					ow.ch.__errorHandle({ 
						chName: aName,
						op: "set",
						key: aKey
					}, e);
				});
			} else {				
				var f = (ii) => {
					return () => {
						try {
							parent.subscribers[aName][ii](aName, "unset", aKey, undefined, parent, aTimestamp, aUUID, x);
						} catch(e) {}
						return ii;
					};
				};
				parent.jobs[aName][_i].then(f(_i));
			}
		}
	}	
	return res;
};
	
OpenWrap.ch.prototype.utils = {
	/**
	 * <odoc>
	 * <key>ow.ch.utils.keepHistory(timeRepeatExpression, aName, aFunction, withKeys, historySize) : Object</key>
	 * For a given aName channel (preferably a temporary one) will execute aFunction periodically given a timeRepeatExpression
	 * (if a Number the ms interval, if a String a cron expression). That aFunction should return aMap for which the withKeys array
	 * will be used to determine the keys entries to set it on the provided aName channel (if withKeys is not provided, id will be assumed
	 * and filled with nowNano()). The channel aName will be filled with entries with the result of executing aFunction
	 * periodically thus keeping an history of results (by default 10 if a historySize is not provided). An
	 * object with a stop function will be returned so the keepHistory periodical behaviour of runnning aFunction and keeping the results in the channel aName.
	 * </odoc>
	 */
	keepHistory: function(every, named, runningFunc, withKeys, historySize) {
		// create channel
		if ($ch().list().indexOf(named) < 0) {
			$ch(named).create();
		}

		if (isUnDef(historySize)) historySize = 10;

		var hkSubs = $ch(named).subscribe(ow.ch.utils.getHousekeepSubscriber(named, historySize));

		// check key to use
		var useId = false;
		if (isUnDef(withKeys)) { 
			withKeys = [ "id" ];
			useId = true;
		}
		if (!(isArray(withKeys))) witKeys = [ withKeys ];

		// function to process
		var __f = function() { 
			var res = runningFunc();
			if (isUnDef(res) || isArray(res) || !isObject(res)) res = {};
			if (useId) res["id"] = nowNano();

			ow.loadObj();
			$ch(named).set(ow.obj.filterKeys(withKeys, res), res);
		};

		// prepare periodic running
		if (isString(every)) {
			ow.loadServer();
			var sch = new ow.server.scheduler();
			sch.addEntry(every, __f);
			return {
				stop: () => {
					$ch(named).unsubscribe(hkSubs);
					sch.stop();
				}
			};
		}

		if (isNumber(every)) {
			var t = new Threads();
			t.addScheduleThreadWithFixedDelay(__f, every);
			return {
				stop: () => {
					$ch(named).unsubscribe(hkSubs);
					t.stop();
				}
			};
		}
	},
	/**
	 * <odoc>
	 * <key>ow.ch.utils.flushBuffer(aName)</key>
	 * Tries to flush a channel buffer with aName (if not provided assumes all buffer type channels).
	 * </odoc>
	 */
	flushBuffer: function(aName) {
		if (isDef(aName)) {
			if (isDef(ow.ch.__types.buffer.__f[aName])) ow.ch.__types.buffer.__f[aName](true); 
			$ch(ow.ch.__types.buffer.__bt[aName]).waitForJobs(ow.ch.__types.buffer.__t[aName]);
			$ch(ow.ch.__types.buffer.__bc[aName]).waitForJobs(ow.ch.__types.buffer.__t[aName]);
		} else {
			for(var c in ow.ch.__types.buffer.__f) {
				ow.ch.__types.buffer.__f[c](true); 
				$ch(ow.ch.__types.buffer.__bt[c]).waitForJobs(ow.ch.__types.buffer.__t[c]);
				$ch(ow.ch.__types.buffer.__bc[c]).waitForJobs(ow.ch.__types.buffer.__t[c]);
			}
		}
	},
	/**
	 * <odoc>
	 * <key>ow.ch.utils.closeBuffer(aName)</key>
	 * Tries to close and flush a channel buffer with aName (if not provided assumes all buffer type channels).
	 * </odoc>
	 */
	closeBuffer: function(aName) {
		if (isDef(aName)) {
			if (isUnDef(ow.ch.__types.buffer.__s[aName]) && isDef(ow.ch.__types.buffer.__s[aName + "::__bufferTransit"])) aName = aName + "::__bufferTransit"
			if (isDef(ow.ch.__types.buffer.__s[aName])) ow.ch.__types.buffer.__s[aName].stop()
		} else {
			for(var c in ow.ch.__types.buffer.__s) {
				if (isDef(ow.ch.__types.buffer.__s[c])) ow.ch.__types.buffer.__s[c].stop();
			}
		}
		ow.ch.utils.flushBuffer(aName);
		if (isDef(aName)) {
			$ch(aName).destroy();
		} else {
			for(var c in ow.ch.__types.buffer.__s) {
				$ch(c).destroy();
			}
		}
	},	
	/**
	 * <odoc>
	 * <key>ow.ch.utils.getBufferSubscriber(aSourceCh, indexes, byNumber, byTimeInMs, aBufferCh, aTmpBufferCh, aFilterFunc, aBufferFunc) : Function</key>
	 * Returns a channel subscriber function that will buffer set, setall, unsetall and unset operations from aSourceCh channel to aBufferCh (by
	 * default a dummy channel to be subscribed, if not defined the name will be aSourceCh + "::buffer"). As a temporary buffer channel
	 * aTmpBufferCh will be used (if not defined the name will be aSourceCh + "::__bufferStorage"). The aBufferCh will be configured with
	 * the provided indexes, byNumber (number of times to trigger the buffer) and byTimeInMs (amount of time in ms to trigger the buffer).
	 * Additionally you can specify aFilterFunc (with arguments channel, operation, key(s) and value(s)) that will only buffer if returns false
	 * and aBufferFunc that will trigger the buffer flush if it returns true.\
	 * \
	 * NOTE: do call ow.ch.utils.closeBuffer(aSourceCh) when it's no longer needed.\
	 * \
	 * </odoc>
	 */
	getBufferSubscriber: function(aSourceCh, idxs, byNumber, byTime, aBufferCh, aTmpBufferCh, aFilterFunc, aBufferFunc) {
		aBufferCh = _$(aBufferCh).isString().default(aSourceCh + "::buffer");
		aTmpBufferCh = _$(aTmpBufferCh).isString().default(aSourceCh + "::__bufferTransit");
		_$(idxs).isArray().$_("Need to provide a source channel indexes");

		$ch(aBufferCh).create(1, "dummy");
		$ch(aTmpBufferCh).create(1, "buffer", {
			bufferCh      : aBufferCh,
			bufferIdxs    : idxs,
			bufferByNumber: byNumber,
			bufferByTime  : byTime,
			bufferFunc    : aBufferFunc
		});

		return function(aC, aO, aK, aV) {
			var cont = true;
			if (isDef(aFilterFunc) && isFunction(aFilterFunc)) cont = aFilterFunc(aC, aO, aK, aV);
			if (cont) {
				switch(aO) {
				case "set"   : 
					aK = merge(aK, { ___bufferT: nowNano() }); 
					$ch(aTmpBufferCh).set(aK, aV);    
					break;
				case "setall": 
					aK.push("___bufferT"); 
					aV = merge(aV,  { ___bufferT: nowNano() }); 
					$ch(aTmpBufferCh).setAll(aK, aV); 
					break;
				case "unsetall": 
					aK.push("___bufferT"); 
					aV = merge(aV,  { ___bufferT: nowNano() }); 
					$ch(aTmpBufferCh).unsetAll(aK, aV); 
					break;					
				case "unset" : 
					aK = merge(aK, { ___bufferT: nowNano() }); 
					$ch(aTmpBufferCh).unset(aK);      
					break;
				}
			}
		};
	},
	/**
	 * <odoc>
	 * <key>ow.ch.utils.getStatsProxyFunction(aStatsCh) : Function</key>
	 * Returns a proxy function to be use with a proxy channel. The aStatsCh where to store the channel access statistics.
	 * </odoc>
	 */
	getStatsProxyFunction: function (aStatsCh) {
		aStatsCh = _$(aStatsCh).isString().$_("Please provide a statistics channel.");

		return function (m) {
			var r = $ch(aStatsCh).get(m.name);
			if (isUnDef(r)) r = {};
			if (isUnDef(r.name)) r.name = m.name;
			if (isUnDef(r[m.op])) r[m.op] = {
				count: 0
			};

			r[m.op].count++;

			switch (m.op) {
				case "size":
					break;
				case "forEach":
					break;
				case "getAll":
					var rr = $ch(m.name).getAll(m.full);
					if (isUnDef(r[m.op].countValues))
						r[m.op].countValues = rr.length;
					else
						r[m.op].countValues += rr.length;
					$ch(aStatsCh).set(m.name, r);
					return rr;
				case "getKeys":
					var rr = $ch(m.name).getKeys(m.full);
					if (isUnDef(r[m.op].countValues))
						r[m.op].countValues = rr.length;
					else
						r[m.op].countValues += rr.length;
					$ch(aStatsCh).set(m.name, r);
					return rr;
				case "getSortedKeys":
					var rr = $ch(m.name).getSortedKeys(m.full);
					if (isUnDef(r[m.op].countValues))
						r[m.op].countValues = rr.length;
					else
						r[m.op].countValues += rr.length;
					$ch(aStatsCh).set(m.name, r);
					return rr;
				case "getSet":
					break;
				case "set":
					break;
				case "setAll":
					if (isUnDef(r[m.op].countValues))
						r[m.op].countValues = m.v.length;
					else
						r[m.op].countValues += m.v.length;
					break;
				case "unsetAll":
					if (isUnDef(r[m.op].countValues))
						r[m.op].countValues = m.v.length;
					else
						r[m.op].countValues -= m.v.length;
					break;					
				case "get":
					break;
				case "pop":
					break;
				case "shift":
					break;
				case "unset":
					break;
			}

			$ch(aStatsCh).set(m.name, r);
		};
	},
	/**
	 * <odoc>
	 * <key>ow.ch.utils.syncCh(aIdxsArray, aSource, aTarget, aSyncFn, aLogFn)</key>
	 * Tries to sync all values from aSource with aTarget channel using the aIdxsArray (list of value indexes field).
	 * Optionally aSyncFn can be provided to decide how to sync the values between source and target (defaults to return always true). A aLogFn
	 * can be provided so all sync actions can be logged.\
	 * \
	 * Table of sync actions given the return values of a custom syncFn(source, target) : boolean\
	 * \
	 *   | source | target | return true | return false |\
	 *   |--------|--------|-------------|--------------|\
	 *   | __     | def    | del target  | add source   |\
	 *   | def    | __     | add target  | del source   |\
	 *   | def    | def    | set target  | set source   |\
	 * \
	 * </odoc>
	 */
	syncCh: function(idxs, source, target, aSyncFn, logFn) {
		var sks = $ch(source).getAll();
		var tks = $ch(target).getAll();

		aSyncFn = _$(aSyncFn).isFunction().default(() => { return true; });
		idxs = _$(idxs).$_("Please provide a list of field indexes");
		if (isString(idxs)) idxs = [ idxs ];

		ow.loadObj();

		// Indexing
		var skis = {};
		for(var ik in sks) {
			var sv = sks[ik];
			var si = stringify(ow.obj.filterKeys(idxs, sv), __, "");
			skis[si] = sv;
		};
		var tkis = {};
		for(var ik in tks) {
			var tv = tks[ik];
			var ti = stringify(ow.obj.filterKeys(idxs, tv), __, "");
			tkis[ti] = tv;
		};

		// Compare values
		var addToTarget = [], delFromTarget = [], addToSource = [], delFromSource = [];
		for(var ik in skis) {
			if (isUnDef(tkis[ik])) {
				if (aSyncFn(skis[ik], __)) {
					logFn("adding " + ik + " to target.");
					addToTarget.push(skis[ik]);
				} else {
					logFn("deleting " + ik + " from source.");
					delFromSource.push(skis[ik]);
				}
			} else {
				if (!(compare(skis[ik], tkis[ik]))) {
					if (aSyncFn(skis[ik], tkis[ik])) {
						logFn("updating " + ik + " on target.");
						addToTarget.push(skis[ik]);
					} else {
						logFn("updating " + ik + " on source.");
						addToSource.push(tkis[ik]);
					}
				}
			}
		};
		for(var ik in tkis) {
			if (isUnDef(skis[ik])) {
				if (aSyncFn(__, tkis[ik])) {
					logFn("deleting " + ik + " from target.");
					delFromTarget.push(tkis[ik]);
				} else {
					logFn("add " + ik + " to source.");
					addToSource.push(tkis[ik]);
				}
			} 
		};

		if (addToTarget.length > 0)   $ch(target).setAll(idxs, addToTarget);
		if (addToSource.length > 0)   $ch(source).setAll(idxs, addToSource);
		if (delFromSource.length > 0) $ch(source).unsetAll(idxs, delFromSource);
		if (delFromTarget.length > 0) $ch(target).unsetAll(idxs, delFromTarget);
	},
    /**
     * <odoc>
     * <key>ow.ch.utils.getMirrorSubscriber(aTargetCh, aFunc) : Function</key>
     * Returns a channel subscriber function that will mirror any changes to aTargetCh if aFunc(key, op) returns true when invoked
     * with the key being changed and the corresponding operation.
     * </odoc>
     */
	getMirrorSubscriber: function(aTargetCh, aFunc) {
		return function(aC, aO, aK, aV) {
			if (isUnDef(aFunc)) aFunc = function() { return true; };
			switch(aO) {
			case "set": 
				if (aFunc(aK, aO)) $ch(aTargetCh).set(aK, aV);
				break;
			case "setall": 
				//for (var k in aK) {
				//	if (aFunc(aK[k])) $ch(aTargetCh).set(aK[k], aV[k]);
				//}
				var sV = [];
				for (var v in aV) {
					if(aFunc(aV[v], aO)) sV.push(aV[v]);
				}
				$ch(aTargetCh).setAll(aK, sV);
				break;
			case "unsetall":
				var sV = [];
				for (var v in aV) {
					if(aFunc(aV[v], aO)) sV.push(aV[v]);
				}
				$ch(aTargetCh).unsetAll(aK, sV);
				break;
			case "unset": 
				if (aFunc(aK, aO)) $ch(aTargetCh).unset(aK);
				break;
			}		
		}
	},
	/**
	 * <odoc>
	 * <key>ow.ch.utils.getLogStashSubscriber(aTargetCh, aType, aHost, aErrorFunc, shouldHK, stampMap) : Function</key>
	 * Returns a channel subscriber function that will transform changes to a log channel (see startLog and the __log channel)
	 * and will replicate them in aTargetCh (this means expecting the value to have a 'd': date; 'm': message and 't' as the level/type).
	 * The value set on aTargetCh will follow the LogStash format setting type to aType and host to aHost. The id and key will be set 
	 * to a sha1 hash of the stringify version of the value being set. In case of error aErrorFunc will be invoked providing the exception
	 * as an argument. You can also indicate if you want to house keep the original channel to save the script's memory and a stampMap to force
	 * entries on all maps sent.
	 * </odoc>
	 */
	getLogStashSubscriber: function(aTargetCh, aType, aHost, aErrorFunc, shouldHK, stampMap) {
		return function(aC, aO, aK, aV) {
			try {
				if (aO == "set") {
					var _id = sha1(stringify(aV) + stringify(stampMap));
					$ch(aTargetCh).set({
						"id": _id
					}, merge({
						"@version"  : 1,
						"@timestamp": aV.d,
						"message"   : aV.m,
						"type"      : aType,
						"host"      : aHost,
						"level"     : aV.t,
						"id"        : _id
					}, stampMap));
					if (shouldHK) $ch(aC).unset(aK);
				}
			} catch(e) {
				aErrorFunc(e);
			}
		};
	},
	
	/**
	 * <odoc>
	 * <key>ow.ch.utils.getHousekeepSubscriber(aTargetCh, maxNumberOfKeys) : Function</key>
	 * Returns a channel subscriber function that will keep the channel size to the maximum of maxNumberOfKeys (defaults to 100).
	 * If the number of keys is bigger than maxNumberOfKeys than it will perform a channel unset operation (that will, depending on the
	 * type of channel, remove the oldest element).
	 * </odoc>
	 */
	getHousekeepSubscriber: function(aTargetCh, numberOfKeys) {
		if (isUnDef(numberOfKeys)) numberOfKeys = 100;
		var parent = ow.ch.utils;
		return function(aC, aO, aK, aV) {
                        if (aO != "set" && aO != "setall") return;
 
 			try {
				$lock("lockHK_" + aC).lock();

				var ln = $ch(aC).size();
				while (ln > numberOfKeys) {
					var o = $ch(aC).getSortedKeys();
					if (o.length > numberOfKeys) {
						var toDelete = o.filter((r, i) => i < (o.length - numberOfKeys));
						if (isArray(toDelete) && toDelete.length > 0) $ch(aC).unsetAll(Object.keys(toDelete[0]), toDelete);
					}
					ln = $ch(aC).size();
				}
 			} catch(e) { 
				sprintErr(e); 
			} finally {
				$lock("lockHK_" + aC).unlock();
			}
			return true;
		};
	},

	/**
	 * <odoc>
	 * <key>ow.ch.utils.getFileHousekeepSubscriber(aFolder, aRegExPattern, howLongAgoInMinutes, dontCompress, aBackupFolder) : Function</key>
	 * Returns a channel subscriber function to perform file housekeep (specially useful with ow.ch.utils.getLogFilePerDate) given the main
	 * aFolder where just the newest file whose filename matches aRegExPattern (e.g. "log\\d{4}-\\d{2}-\\d{2}\\.log") will be kept uncompressed.
	 * All other files will be gziped (if dontCompress = false) and moved to aBackupFolder (if defined, defaults to aFolder). If howLongAgoInMinutes is defined all 
	 * files older than now - howLongAgoInMinutes will be deleted from the aBackupFolder.
	 * </odoc>
	 * 
	 */
	getFileHousekeepSubscriber: function (aFolder, aRegExPattern, howLongAgoInMinutes, dontCompress, aBackupFolder) {
		if (isUnDef(aFolder)) aFolder = ".";
		if (isUnDef(aBackupFolder)) aBackupFolder = aFolder;
		if (isUnDef(aRegExPattern)) aRegExPattern = "log-\\d{4}-\\d{2}-\\d{2}\\.log";

		return function (aCh, aOp, aK, aV) {
			if (aOp != "set") return;

			var listFilesFolder = io.listFiles(aFolder).files;

			var donttouch = $from(listFilesFolder)
				.equals("isFile", true)
				.match("filename", new RegExp(aRegExPattern))
				.notEnds("filename", ".gz")
				.sort("-lastModified")
				.first();

			if (isDef(donttouch)) donttouch = donttouch.filename;

			io.mkdir(aBackupFolder);

			// Search files for compression
			if (!dontCompress) {
				$from(listFilesFolder)
					.notEquals("filename", donttouch)
					.notEnds("filename", ".gz")
					.match("filename", new RegExp(aRegExPattern))
					.select(function (r) {
						ioStreamCopy(io.writeFileGzipStream(aBackupFolder + "/" + r.filename + ".gz"),
							io.readFileStream(r.filepath));
						io.rm(r.filepath);
					});
			}

			// Delete files from backup folder
			if (isDef(howLongAgoInMinutes)) {
				$from(io.listFiles(aBackupFolder).files)
					.notEquals("filename", donttouch)
					.match("filename", new RegExp(aRegExPattern + "\\.gz$"))
					.less("createTime", new Date() - (howLongAgoInMinutes * 60 * 1000))
					.select(function (r) {
						io.rm(r.filepath);
					});
			}
		}
	},

	/**
	 * <odoc>
	 * <key>ow.ch.utils.getLogFilePerDate(aLogFolder, aTemplate, aFileDateFormat, aLineTemplate, aLineDateFormat) : Function</key>
	 * Returns a function to be used to generate a log file in aLogFolder path. If the log file already exists it will append to it.
	 * You can customize the log filename format using a aTemplate (e.g. "log-{{timedate}}.log" by default). The "timedate"
	 * is defined on the aFileDateFormat (e.g. "yyyy-MM-dd" by day, "yyyy-MM-dd-HH" by hour (check ow.format.fromDate for
	 * more options)). Each line that will be append to the file can be defined by aLineTemplate (e.g. "{{timedate}} | {{type}} | {{message}}" 
	 * by default) where "type" is the of logging (INFO, WARN, ERROR), "message" the logged message and "timedate" is defined
	 * on the aLineDateFormat (e.g. "yyyy-MM-dd HH:mm:ss.SSS" by default (check ow.format.fromDate for more options)).
	 * </odoc>
	 */
	getLogFilePerDate: function(aLogFolder, aTemplate, aFileDateFormat, aLineTemplate, aLineDateFormat) {
		if (isUnDef(aLogFolder))        aLogFolder      = ".";
		if (isUnDef(aTemplate))         aTemplate       = "log-{{timedate}}.log";
		if (isUnDef(aFileDateFormat))   aFileDateFormat = "yyyy-MM-dd";
		if (isUnDef(aLineTemplate))     aLineTemplate   = "{{timedate}} | {{type}} | {{{message}}}\n";
		if (isUnDef(aLineDateFormat))   aLineDateFormat = "yyyy-MM-dd HH:mm:ss.SSS";

		ow.loadFormat();
		var uuid = genUUID();

		var lineTmpl = ow.loadTemplate().compile(aLineTemplate);
		var fileTmpl = ow.loadTemplate().compile(aTemplate);

		return function(aCh, aOp, aK, aV) {
			if (aOp == "set") {
			   var line = ow.template.execCompiled(lineTmpl)({ 
				   timedate: ow.format.fromDate(new Date(aV.d), aLineDateFormat), 
				   type: aV.t, 
				   message: aV.m 
			   });
			   var file = ow.template.execCompiled(fileTmpl)({
					timedate: ow.format.fromDate(new Date(aV.d), aFileDateFormat)
				});
			   // Write line
			   io.writeFileString(aLogFolder + "/" + file, line, io.getDefaultEncoding(), true);	   
			}
		}
	},

	/**
	 * <odoc>
	 * <key>ow.ch.utils.setLogToFile(aConfigMap)</key>
	 * Shortcut to set OpenAF's logging into a rotating per date set of log files. You can set any of these options:\
	 * \
	 * logFolder             (string)  Where the current log file should be written (defaults to '.')\
	 * filenameTemplate      (string)  ow.template for the log filename (defaults to 'log-{{timedate}}.log')\
	 * fileDateFormat        (string)  File date format to be used in filenameTemplate (defaults to 'yyyy-MM-dd')\
	 * lineTemplate          (string)  ow.template for each log line (defaults to '{{timedate}} | {{type}} | {{message}}\n')\
	 * lineDateFormat        (string)  Date format to be used in lineTemplate (defaults to 'yyyy-MM-dd HH:mm:ss.SSS')\
	 * HKRegExPattern        (string)  Housekeeping regular expression pattern to find log files (defaults to 'log-\\d{4}-\\d{2}-\\d{2}\\.log')\
	 * HKhowLongAgoInMinutes (number)  How many minutes of logs should be kept (if not defined won't delete files)\
	 * dontCompress          (boolean) Defines if older files should not be gzip (default to false)\
	 * backupFolder          (string)  If defined older log files will be moved to this folder (if not defined they won't be moved)\
	 * numberOfEntriesToKeep (number)  Number of OpenAF log channel entries to keep in memory (defaults to 100)\
	 * setLogOff             (boolean) Turns off console logging (defaults to false)\
	 * \
	 * </odoc>
	 */
	setLogToFile: function(aConfigMap) {
		if (isUnDef(aConfigMap)) aConfigMap = {};

		startLog(ow.ch.utils.getLogFilePerDate(aConfigMap.logFolder, aConfigMap.filenameTemplate, aConfigMap.fileDateFormat, aConfigMap.lineTemplate, aConfigMap.lineDateFormat), aConfigMap.numberOfEntriesToKeep);
		getChLog().subscribe(ow.ch.utils.getFileHousekeepSubscriber(aConfigMap.logFolder, aConfigMap.HKRegExPattern, aConfigMap.HKhowLongAgoInMinutes, aConfigMap.dontCompress, aConfigMap.backupFolder));
		//getChLog().subscribe(ow.ch.utils.getHousekeepSubscriber(getChLog(), aConfigMap.numberOfEntriesToKeep));
		if (aConfigMap.setLogOff) setLog( { off: true });
	},

	/**
	 * <odoc>
	 * <key>ow.ch.utils.getElasticIndex(aPrefix, aFormat) : Function</key>
	 * Returns a function to be used for generating ElasticSearch indexes with aPrefix-aDate (in the format of
	 * YYYY.MM.DD). This helps to generate a specific index per day. If a specific format is needed you can provided
	 * it as aFormat (see ow.format.fromDate)).
	 * </odoc>
	 */
	getElasticIndex: function(aPrefix, aFormat) {
		if (isUnDef(aFormat)) aFormat = "yyyy.MM.dd";
		return function() {
			return aPrefix + "-" + ow.loadFormat().fromDate(new Date(), aFormat);
		};
	},

	/**
	 * <odoc>
	 * <key>ow.ch.utils.getElasticQuery(aQueryString) : Map</key>
	 * Returns a query map using aQueryString (using lucene query string (like in Kibana)) to be used on getAll, for example.
	 * </odoc>
	 */
	getElasticQuery: function(aQueryString) {
		_$(aQueryString).isString();

		return {
			query: {
			query_string: {
				query: aQueryString
				}
			}
		};
	},

	/**
	 * <odoc>
	 * <key>ow.ch.utils.getK8sRemoteURLArrayFunc(aOptions) : Function</key>
	 * Returns a function to be used as aRemoteURLArray in ow.ch.server.peer. It will resolve
	 * all IP addresses from a Kubernetes DNS name (typically a headless service for deployments)
	 * using ow.net.getDNS and return an array of remote channel URLs.\
	 * \
	 * aOptions map entries:\
	 * - dnsName    (String, mandatory) Kubernetes DNS name to resolve\
	 * - recordType (String, optional)  DNS record type (defaults to "a")\
	 * - dnsServer  (String, optional)  DNS server to use\
	 * - protocol   (String, optional)  URL protocol (defaults to "http")\
	 * - port       (Number, optional)  Port to use (defaults to local peer port when numeric)\
	 * - path       (String, optional)  URL path (defaults to peer path argument)\
	 * - excludeCurrentIP (Boolean, optional) Excludes current instance IP from result (defaults to false)\
	 * - currentIP  (String, optional)  Explicit current instance IP (otherwise uses POD_IP env var or ow.net.getHostAddress())\
	 * - urlFn      (Function, optional) Custom URL builder fn(ip, ctx)\
	 * \
	 * Example:\
	 * \
	 * var peersFn = ow.ch.utils.getK8sRemoteURLArrayFunc({\
	 *   dnsName: "openaf-peers.default.svc.cluster.local",\
	 *   protocol: "http",\
	 *   port: 8090,\
	 *   path: "/log"\
	 * });\
	 * ow.ch.server.peer("__log", 8090, "/log", peersFn);\
	 * </odoc>
	 */
	getK8sRemoteURLArrayFunc: function(aOptions) {
		aOptions = _$(aOptions, "aOptions").isMap().default({});
		_$(aOptions.dnsName, "aOptions.dnsName").isString().$_("Please provide aOptions.dnsName.");

		return function(aName, aLocalPortORServer, aPath, aUUID) {
			ow.loadNet();

			var res = [];
			var dnsRes = ow.net.getDNS(aOptions.dnsName, aOptions.recordType, aOptions.dnsServer, true);
			var dnsArr = isArray(dnsRes) ? dnsRes : [ dnsRes ];
			var protocol = _$(aOptions.protocol).isString().default("http");
			var port = aOptions.port;
			var path = _$(aOptions.path).isString().default(aPath);
			var excludeCurrentIP = _$(aOptions.excludeCurrentIP).isBoolean().default(false);
			var currentIP = _$(aOptions.currentIP).isString().default(__);

			if (isUnDef(port) && isNumber(aLocalPortORServer)) port = aLocalPortORServer;
			if (isString(path) && path.length > 0 && path.substring(0, 1) != "/") path = "/" + path;
			if (excludeCurrentIP && isUnDef(currentIP) && isDef(getEnv("POD_IP"))) currentIP = String(getEnv("POD_IP"));
			if (excludeCurrentIP && isUnDef(currentIP)) {
				try { currentIP = String(ow.net.getHostAddress()); } catch(e) {}
			}

			function _extractIP(aDNSRecord) {
				if (isString(aDNSRecord)) return aDNSRecord;
				if (isMap(aDNSRecord) && isDef(aDNSRecord.Address)) {
					if (isString(aDNSRecord.Address)) return aDNSRecord.Address;
					if (isMap(aDNSRecord.Address) && isDef(aDNSRecord.Address.HostAddress)) return aDNSRecord.Address.HostAddress;
				}
				if (isMap(aDNSRecord) && isString(aDNSRecord.RdataToString)) return aDNSRecord.RdataToString;
				return __;
			}

			function _mkURL(aIP) {
				var host = aIP;
				if (isString(aIP) && aIP.indexOf(":") >= 0 && aIP.substring(0, 1) != "[") host = "[" + aIP + "]";
				var u = protocol + "://" + host;
				if (isDef(port)) u += ":" + port;
				if (isDef(path)) u += path;
				return u;
			}

			for (var i in dnsArr) {
				var ip = _extractIP(dnsArr[i]);
				if (isDef(ip)) {
					if (excludeCurrentIP && isDef(currentIP) && String(ip) == String(currentIP)) continue;
					var u = isFunction(aOptions.urlFn)
						? aOptions.urlFn(ip, {
							name: aName,
							localPortOrServer: aLocalPortORServer,
							path: aPath,
							uuid: aUUID,
							options: aOptions
						})
						: _mkURL(ip);
					if (isDef(u)) res.push(u);
				}
			}

			return $from(res).distinct().select();
		};
	},

	/**
	 * <odoc>
	 * <key>ow.ch.utils.poolChanges(aCh, idKeys, aChM)</key>
	 * When executed pools to find all changes in aCh, using an idKeys array of key map fields, and executing a setAll on aCh for
	 * the changed entries. To compare it stores the last version in a 'aCh + "::chMemory"' channel that can be created with aChM map options
	 * ($ch type and options entries). Usefull to trigger channel subscribed functions when the aCh type doesn't detect automatically changes.
	 * Should be used with small sized channels as datasets are compared in memory.
	 * </odoc>
	 */
	poolChanges: function(aCh, idKeys, aChM) {
		_$(aCh, "aCh").isString().$_()
		_$(idKeys, "idKeys").isArray().$_()
		aChM = _$(aChM, "aChM").default(__)
	
		var chM = aCh + "::__chMemory"
		if ($ch().list().indexOf(chM) < 0) {
			if (isUnDef(aChM)) aChM = { type: "mvs", options: { shouldCompress: true, file: io.createTempFile("openaf_", ".chMemory") }}
			$ch(chM).create(1, aChM.type, aChM.options)
		}
	
		var n = $ch(aCh).getAll()
		if ($ch(chM).size() > 0) {
			var e = $ch(chM).getAll()
			var ar = $from( n ).except( e ).select()
			if (ar.length > 0) $ch(aCh).setAll(idKeys, ar)
		}
		$ch(chM).setAll(idKeys, n)
	},

	mvs: {
		/**
		 * <odoc>
		 * <key>ow.ch.utils.mvs.list(aMVSFile) : Array</key>
		 * Returns a list of names of maps in the corresponding aMVSFile.
		 * </odoc>
		 */
		list: function(aFile) {
			var absFile = String((new java.io.File(aFile)).getAbsoluteFile());
			var mvs, mvsLocal = false;

			if (isUnDef(ow.ch.__types.mvs.__f) || isUnDef(ow.ch.__types.mvs.__f[absFile])) {
				mvs = Packages.org.h2.mvstore.MVStore.Builder();
				mvs = mvs.fileName(absFile);
				mvs = mvs.open();
				mvsLocal = true;
			} else {
				mvs = ow.ch.__types.mvs.__f[absFile];
			}

			var res = [];
			var maps = mvs.getMapNames().toArray();

			for(var i in maps) {
				res.push(String(maps[i]));
			}

			if (mvsLocal) {
				mvs.close();
			}

			return res;
		},

		/**
		 * <odoc>
		 * <key>ow.ch.utils.mvs.rename(aMVSFile, anOriginalMap, aDestinationMap)</key>
		 * Renames anOriginalMap by aDestinationMap on the provided aMVSFile.
		 * </odoc>
		 */
		rename: function(aFile, anOriginalMap, aDestinationMap) {
			var absFile = String((new java.io.File(aFile)).getAbsoluteFile());

			var mvs, mvsLocal = false;

			if (isUnDef(ow.ch.__types.mvs.__f) || isUnDef(ow.ch.__types.mvs.__f[absFile])) {
				mvs = Packages.org.h2.mvstore.MVStore.Builder();
				mvs = mvs.fileName(absFile);
				mvs = mvs.open();
				mvsLocal = true;
			} else {
				mvs = ow.ch.__types.mvs.__f[absFile];
			}
			
			var omap = mvs.openMap(anOriginalMap);
			mvs.renameMap(omap, aDestinationMap);

			if (mvsLocal) {
				mvs.close();
			}

			return true;
		},

		/**
		 * <odoc>
		 * <key>ow.ch.utils.mvs.remove(aMVSFile, aMapToRemove)</key>
		 * Removes aMapToRemove on the provided aMVSFile.
		 * </odoc>
		 */
		remove: function(aFile, aMapToRemove) {
			var absFile = String((new java.io.File(aFile)).getAbsoluteFile());
			if (isUnDef(aMapToRemove)) throw "Need to specify aMapToRemove.";

			var mvs, mvsLocal = false;

			if (isUnDef(ow.ch.__types.mvs.__f) || isUnDef(ow.ch.__types.mvs.__f[absFile])) {
				mvs = Packages.org.h2.mvstore.MVStore.Builder();
				mvs = mvs.fileName(absFile);
				mvs = mvs.open();
				mvsLocal = true;
			} else {
				mvs = ow.ch.__types.mvs.__f[absFile];
			}
			
			var omap = mvs.openMap(aMapToRemove);
			mvs.removeMap(omap);

			if (mvsLocal) {
				mvs.close();
			}

			return true;			
		},

		/**
		 * <odoc>
		 * <key>ow.ch.utils.mvs.reshard(aPath, aNewFiles, shouldCompress) : Number</key>
		 * Changes the number of files of an "mvs" channel created with multifile = true on aPath to aNewFiles, redistributing
		 * all the entries of all the maps. Returns the number of entries moved. The channel(s) using aPath need to be destroyed first.
		 * The new files are built on a temporary folder inside aPath and only replace the current ones (and the mvs-multifile.json manifest) after
		 * all the entries are copied and counted. Use shouldCompress = true if the channel was created with it.
		 * </odoc>
		 */
		reshard: function(aPath, aNewFiles, shouldCompress) {
			_$(aPath, "aPath").isString().$_();
			_$(aNewFiles, "aNewFiles").isNumber().$_();
			if (aNewFiles < 1 || aNewFiles != Math.floor(aNewFiles)) throw "aNewFiles needs to be an integer >= 1";

			var t = ow.ch.__types.mvs;
			var absPath = String((new java.io.File(aPath)).getAbsoluteFile());
			var manifestFile = absPath + "/mvs-multifile.json";
			var manifest = io.fileExists(manifestFile) ? io.readFileJSON(manifestFile) : __;
			if (!isMap(manifest) || !isNumber(manifest.files)) throw "No mvs multifile manifest found on " + absPath;

			var oldFiles = t.__fnames(absPath, manifest.files);
			var inUse = isMap(t.__o) && Object.keys(t.__o).some(n => t.__o[n].absFiles.some(f => oldFiles.indexOf(f) >= 0));
			if (inUse) throw "Channels using " + absPath + " need to be destroyed before resharding";
			if (manifest.files == aNewFiles) return 0;

			var tmpPath = absPath + "/.reshard-tmp";
			if (io.fileExists(tmpPath)) io.rm(tmpPath);
			io.mkdir(tmpPath);

			var newFiles = t.__fnames(tmpPath, aNewFiles);
			var sources = [], targets = [], moved = 0, expected = 0;
			var open = (f, comp) => {
				var b = Packages.org.h2.mvstore.MVStore.Builder().autoCommitDisabled().fileName(f);
				if (comp) b = b.compress();
				return b.open();
			};

			try {
				sources = oldFiles.map(f => open(f, shouldCompress));
				targets = newFiles.map(f => open(f, shouldCompress));

				sources.forEach(src => {
					af.fromJavaArray(src.getMapNames().toArray()).forEach(mapName => {
						mapName = String(mapName);
						var smap = src.openMap(mapName);
						af.fromJavaArray(smap.keyList()).forEach(k => {
							// Same placement rule as the channel: hash of the untrimmed canonical key
							var idx = t.__hidx(stringify(sortMapKeys(jsonParse(String(k), true)), __, ""), aNewFiles);
							targets[idx].openMap(mapName).put(k, smap.get(k));
							moved++;
						});
						expected += Number(smap.sizeAsLong());
					});
				});

				var total = 0;
				targets.forEach(tgt => {
					tgt.commit();
					af.fromJavaArray(tgt.getMapNames().toArray()).forEach(mapName => total += Number(tgt.openMap(String(mapName)).sizeAsLong()));
				});
				if (total != expected) throw "reshard failed: expected " + expected + " entries but copied " + total;
			} catch(e) {
				targets.forEach(tgt => { try { tgt.close() } catch(ee) {} });
				sources.forEach(src => { try { src.close() } catch(ee) {} });
				io.rm(tmpPath);
				throw e;
			}

			targets.forEach(tgt => tgt.close());
			sources.forEach(src => src.close());

			// Swap: remove the old files, move the new ones and finally update the manifest
			oldFiles.forEach(f => { if (io.fileExists(f)) io.rm(f); });
			t.__fnames(absPath, aNewFiles).forEach((f, i) => io.mv(newFiles[i], f));
			io.writeFileJSON(manifestFile, { files: aNewFiles, hash: "javaStringHashCode", version: 1 }, "");
			io.rm(tmpPath);

			return moved;
		}
	}
};

/**
 * <odoc format="markdown">
 * <key>ow.ch.utils.graph</key>
 * <![CDATA[
 * Helpers to navigate and query a channel of type `graph` (see `ow.ch.types.graph`). Node ids without a `:` are treated as `doc:` ids.
 *
 * | Function | Returns | Description |
 * | --- | --- | --- |
 * | `neighbors(aName, anId, aOptions)` | Array | Edges connected to a node. Options: `direction` (`"out"`, `"in"` or `"both"`), `type`, `provenance` (String or Array) |
 * | `degree(aName, anId, aOptions)` | Number | Number of edges connected to a node (same options as `neighbors`) |
 * | `path(aName, aFromId, aToId, aOptions)` | Array | Shortest path (BFS, ignoring direction) as node ids, `[]` if none. Options: `maxDepth`, `type` |
 * | `traverse(aName, anId, aOptions)` | Map | `{ nodes, edges }` sub-graph reachable from a node. Options: `depth` (default 1), `direction`, `type`, `provenance` |
 * | `find(aName, aOptions)` | Array | Nodes matching `type` and/or `text` (case insensitive match on id and props) |
 * | `stats(aName)` | Map | Node and edge counts plus counts by node type, edge type and provenance |
 * | `save(aName)` | Boolean | Flushes pending changes to the file (`false` if read-only) |
 *
 * Example:
 *
 * ```javascript
 * ow.ch.utils.graph.neighbors("g", "a.md", { direction: "out", type: "LINKS_TO" });
 * ow.ch.utils.graph.traverse("g", "a.md", { depth: 2 }); // { nodes: [...], edges: [...] }
 * ```
 * ]]>
 * </odoc>
 */
OpenWrap.ch.prototype.utils.graph = {
	__id: function(id) {
		id = String(id)
		return id.indexOf(":") > 0 ? id : "doc:" + id
	},
	__arr: function(v) { return isUnDef(v) ? __ : (isArray(v) ? v : [ v ]) },
	__edges: function(aName, id, o) {
		o = _$(o, "options").isMap().default({})
		var dir = isString(o.direction) ? o.direction : "both", types = this.__arr(o.type), provs = this.__arr(o.provenance)
		if (isDef(provs)) provs = provs.map(p => String(p).toUpperCase())
		return ow.ch.__types.graph.__edgesOf(aName, id).filter(e =>
			(dir == "both" || (dir == "out" && e.from === id) || (dir == "in" && e.to === id)) &&
			(isUnDef(types) || types.indexOf(e.type) >= 0) &&
			(isUnDef(provs) || provs.indexOf(e.provenance) >= 0)
		)
	},
	neighbors: function(aName, anId, aOptions) {
		var id = this.__id(anId)
		return this.__edges(aName, id, aOptions).map(e => ow.ch.__types.graph.__edgeVal(e))
	},
	degree: function(aName, anId, aOptions) {
		return this.__edges(aName, this.__id(anId), aOptions).length
	},
	path: function(aName, aFromId, aToId, aOptions) {
		aOptions = _$(aOptions, "options").isMap().default({})
		var a = this.__id(aFromId), b = this.__id(aToId), gt = ow.ch.__types.graph
		if (!isMap(gt.__getNode(aName, a)) || !isMap(gt.__getNode(aName, b))) return []
		var maxDepth = isNumber(aOptions.maxDepth) ? aOptions.maxDepth : __
		var q = [ a ], depth = {}, prev = {}
		depth[a] = 0
		for (var qi = 0; qi < q.length && q[qi] !== b; qi++) {
			var cur = q[qi]
			if (isDef(maxDepth) && depth[cur] >= maxDepth) continue
			var es = this.__edges(aName, cur, { type: aOptions.type })
			for (var i = 0; i < es.length; i++) {
				var nx = es[i].from === cur ? es[i].to : es[i].from
				if (isDef(depth[nx])) continue
				depth[nx] = depth[cur] + 1
				prev[nx] = cur
				q.push(nx)
			}
		}
		if (isUnDef(depth[b])) return []
		var res = [ b ], p = b
		while (p !== a) { p = prev[p]; res.unshift(p) }
		return res
	},
	traverse: function(aName, anId, aOptions) {
		aOptions = _$(aOptions, "options").isMap().default({})
		var id = this.__id(anId), gt = ow.ch.__types.graph, maxDepth = isNumber(aOptions.depth) ? aOptions.depth : 1
		if (!isMap(gt.__getNode(aName, id))) return { nodes: [], edges: [] }
		var depth = {}, seenE = {}, resE = [], q = [ id ]
		depth[id] = 0
		for (var qi = 0; qi < q.length; qi++) {
			var cur = q[qi]
			if (depth[cur] >= maxDepth) continue
			var es = this.__edges(aName, cur, aOptions)
			for (var i = 0; i < es.length; i++) {
				var e = es[i], k = ow.ch.__types.graph.__edgeKeyOf(e)
				if (!seenE[k]) { seenE[k] = true; resE.push(ow.ch.__types.graph.__edgeVal(e)) }
				var nx = e.from === cur ? e.to : e.from
				if (isDef(depth[nx])) continue
				depth[nx] = depth[cur] + 1
				q.push(nx)
			}
		}
		return { nodes: q.map(n => gt.__nodeVal(gt.__getNode(aName, n))), edges: resE }
	},
	find: function(aName, aOptions) {
		aOptions = _$(aOptions, "options").isMap().default({})
		var types = this.__arr(aOptions.type), text = isString(aOptions.text) ? aOptions.text.toLowerCase() : __
		var gt = ow.ch.__types.graph
		return gt.__nodeIds(aName).map(id => gt.__getNode(aName, id)).filter(n => 
			(isUnDef(types) || types.indexOf(n.type) >= 0) && (isUnDef(text) || (n.id + " " + stringify(n.props, __, "")).toLowerCase().indexOf(text) >= 0)
		).map(n => gt.__nodeVal(n))
	},
	stats: function(aName) {
		var gt = ow.ch.__types.graph, ids = gt.__nodeIds(aName), es = gt.__edges(aName), r = { nodes: ids.length, edges: es.length, nodeTypes: {}, edgeTypes: {}, provenance: {} }
		ids.forEach(id => { var t = gt.__getNode(aName, id).type; r.nodeTypes[t] = (r.nodeTypes[t] || 0) + 1 })
		es.forEach(e => { r.edgeTypes[e.type] = (r.edgeTypes[e.type] || 0) + 1; r.provenance[e.provenance] = (r.provenance[e.provenance] || 0) + 1 })
		return r
	},
	save: function(aName) {
		return ow.ch.__types.graph.__save(aName)
	}
};

/**
 * <odoc format="markdown">
 * <key>ow.ch.utils.timeseries</key>
 * <![CDATA[
 * Helpers to query and feed channels of type `timeseries`. Every function takes the channel name first. A `selector` is a map
 * `{ metric, labels }` where `metric` and each label value can be a String, an Array (any of), a RegExp or a Function.
 *
 * | Function | Returns | Description |
 * | --- | --- | --- |
 * | `series(aName, aSelector)` | Array | `{ metric, labels }` of the matching series |
 * | `labels(aName, aMetric)` | Map | Label names with their sorted values for a metric (or all metrics) |
 * | `latest(aName, aSelector)` | Array | Newest point of each matching series as flat rows |
 * | `range(aName, aSelector, aOptions)` | Array | Flat rows `{ ts, metric, ...labels, v }`. Options: `from`, `to`, `step` (ms or "1m"), `fn` (`avg`, `min`, `max`, `sum`, `count`, `first`, `last`, `rate`, `increase`; default `avg`), `fill` (`none`, `null`, `zero`, `prev`), `tier` (`raw` or a rollup step to force one) |
 * | `drop(aName, aSelector)` | Number | Removes the matching series, returns how many |
 * | `stats(aName)` | Map | Series and point counts, per metric and per tier |
 * | `housekeep(aName, aOptions)` | Number | Applies retention now (`{ now }` to measure from a given time); returns the removed entries |
 * | `rebuildRollups(aName)` | | Recomputes every rollup from the raw points |
 * | `compact(aName)` | Boolean | Rewrites the NDJSON file with the live data only |
 * | `save(aName)` | Boolean | Flushes pending changes now |
 * | `collect(aEvery, aName, aSource, aOptions)` | Map | Periodically records metrics (default `ow.metrics.getAll()`); returns `{ once, stop }` |
 * | `getTimeSeriesSubscriber(aTargetCh, aOptions)` | Function | Channel subscriber that records changes of another channel as points |
 * | `toOpenMetrics(aName, aSelector, aOptions)` | String | OpenMetrics text of the latest points (or all points with `from`/`to`) |
 * | `fromOpenMetrics(aName, aText, aOptions)` | Number | Records OpenMetrics text as points; returns how many |
 * | `pushPrometheus(aName, aPushGwUrl, aJob, aSelector, aOptions)` | Number | Pushes the latest point of each series to a Prometheus push gateway (one request per `groupBy` value); returns how many series were pushed |
 *
 * With `step`, points are grouped in buckets aligned to the epoch and the row `ts` is the start of the bucket. When rollups exist, the finest
 * tier that reaches back to `from` and divides `step` is used. `rate` and `increase` treat a decrease in value as a counter reset (on rollup tiers they are approximate).
 *
 * Example:
 *
 * ```javascript
 * ow.ch.utils.timeseries.range("m", { metric: "cpu", labels: { host: /^web/ } }, { from: "2026-01-01", step: "5m", fn: "max" });
 * ```
 * ]]>
 * </odoc>
 */
OpenWrap.ch.prototype.utils.timeseries = {
	__t: () => ow.ch.__types.timeseries,
	__FNS: [ "avg", "min", "max", "sum", "count", "first", "last", "rate", "increase" ],
	// finest tier that reaches back to 'from' and whose buckets divide 'step'
	__pick: function(c, id, from, step, force) {
		var tt = this.__t()
		if (isDef(force)) {
			if (String(force) == "raw") return c.tiers[0]
			var s = tt.__dur(force, "tier"), f = c.tiers.filter(t => t.step == s)
			if (f.length == 0) throw "timeseries: tier '" + force + "' not found"
			return f[0]
		}
		if (isUnDef(step)) return c.tiers[0]
		var cand = c.tiers.filter(t => t.step == 0 || (t.step <= step && step % t.step == 0)), best, bestFirst
		cand.forEach(t => {
			var b = c.st.bounds(id, t.key)
			if (isUnDef(b)) return
			if (isUnDef(best) || b.first <= bestFirst - t.step) { best = t; bestFirst = b.first }
		})
		if (isUnDef(best)) return c.tiers[0]
		for (var i = 0; i < cand.length; i++) {
			var bd = c.st.bounds(id, cand[i].key)
			if (isUnDef(bd)) continue
			if (cand[i] === best || bd.first <= from) return cand[i]
		}
		return best
	},
	__row: function(m, t, v) {
		var r = { ts: t, metric: m.metric }
		Object.keys(m.labels).forEach(k => { r[(k == "ts" || k == "metric" || k == "v") ? "_" + k : k] = m.labels[k] })
		r.v = v
		return r
	},
	series: function(aName, aSelector) {
		var tt = this.__t(), c = tt.__c(aName)
		return tt.__select(c, aSelector).map(id => { var m = c.st.meta(id); return { metric: m.metric, labels: clone(m.labels) } })
	},
	labels: function(aName, aMetric) {
		var res = {}
		this.series(aName, isDef(aMetric) ? { metric: aMetric } : {}).forEach(s => {
			Object.keys(s.labels).forEach(k => {
				if (isUnDef(res[k])) res[k] = []
				if (res[k].indexOf(s.labels[k]) < 0) res[k].push(s.labels[k])
			})
		})
		Object.keys(res).forEach(k => res[k].sort())
		return res
	},
	latest: function(aName, aSelector) {
		var tt = this.__t(), c = tt.__c(aName), res = []
		tt.__select(c, aSelector).forEach(id => {
			var b = c.st.bounds(id, "raw")
			if (isUnDef(b)) return
			var m = c.st.meta(id), r = c.st.read(id, "raw", b.last, b.last)
			res.push(this.__row(m, b.last, r.v[0]))
		})
		return res
	},
	range: function(aName, aSelector, aOptions) {
		var tt = this.__t(), c = tt.__c(aName), self = this
		aOptions = _$(aOptions, "options").isMap().default({})
		var from = isDef(aOptions.from) ? tt.__ts(aOptions.from) : -Infinity, to = isDef(aOptions.to) ? tt.__ts(aOptions.to) : Infinity
		var step = tt.__dur(aOptions.step, "step"), fn = String(isDef(aOptions.fn) ? aOptions.fn : "avg"), fill = String(isDef(aOptions.fill) ? aOptions.fill : "none")
		if (this.__FNS.indexOf(fn) < 0) throw "timeseries: unknown fn '" + fn + "' (use " + this.__FNS.join(", ") + ")"
		if ([ "none", "null", "zero", "prev" ].indexOf(fill) < 0) throw "timeseries: unknown fill '" + fill + "'"
		var res = []
		tt.__select(c, aSelector).forEach(id => {
			var m = c.st.meta(id), tier = self.__pick(c, id, from, step, aOptions.tier)
			var s = step
			if (isUnDef(s) && tier.step > 0) s = tier.step
			var rd = c.st.read(id, tier.key, tier.step > 0 ? from - tier.step + 1 : from, to)
			if (tier.step > 0 && isDef(from) && isFinite(from)) {
				// drop rollup buckets that end before 'from'
				var keep = rd.ts.map((b, i) => b + tier.step > from)
				rd = { ts: rd.ts.filter((b, i) => keep[i]), v: rd.v.filter((b, i) => keep[i]) }
			}
			// no step on the raw tier: the points as they are
			if (isUnDef(s)) {
				rd.ts.forEach((t, i) => res.push(self.__row(m, t, rd.v[i])))
				return
			}
			var rows = {}, order = [], bucket = t => Math.floor(t / s) * s
			if (fn == "rate" || fn == "increase") {
				var prevLast
				rd.ts.forEach((t, i) => {
					var inc = 0, b = bucket(t)
					if (tier.step == 0) {
						var v = rd.v[i]
						if (isDef(prevLast)) inc = v >= prevLast ? v - prevLast : v
						prevLast = v
					} else {
						var a = rd.v[i]
						inc = a.last >= a.first ? a.last - a.first : a.last
						if (isDef(prevLast)) inc += a.first >= prevLast ? a.first - prevLast : a.first
						prevLast = a.last
					}
					if (isUnDef(rows[b])) { rows[b] = 0; order.push(b) }
					rows[b] += inc
				})
				order.forEach(b => { rows[b] = fn == "rate" ? rows[b] / (s / 1000) : rows[b] })
			} else {
				rd.ts.forEach((t, i) => {
					var b = bucket(t), a = tier.step == 0 ? tt.__a0(t, rd.v[i]) : rd.v[i]
					if (isUnDef(rows[b])) order.push(b)
					rows[b] = tt.__am(rows[b], a)
				})
				order.forEach(b => {
					var a = rows[b]
					rows[b] = fn == "avg" ? a.sum / a.count : a[fn]
				})
			}
			order.sort((a, b) => a - b)
			var out = order.map(b => ({ b: b, v: rows[b] }))
			if (fill != "none" && out.length > 0) {
				var f0 = isFinite(from) ? bucket(from) : out[0].b, f1 = isFinite(to) ? bucket(to) : out[out.length - 1].b
				if ((f1 - f0) / s > 1000000) throw "timeseries: too many buckets to fill"
				var byB = {}, last
				out.forEach(o => { byB[o.b] = o.v })
				out = []
				for (var b = f0; b <= f1; b += s) {
					if (isDef(byB[b])) { last = byB[b]; out.push({ b: b, v: last }) }
					else out.push({ b: b, v: fill == "null" ? null : (fill == "zero" ? 0 : (isDef(last) ? last : null)) })
				}
			}
			out.forEach(o => res.push(self.__row(m, o.b, o.v)))
		})
		return res
	},
	drop: function(aName, aSelector) {
		var tt = this.__t(), c = tt.__c(aName)
		tt.__rw(c)
		var ids = tt.__select(c, aSelector)
		ids.forEach(id => { c.st.drop(id); tt.__lg(c, { o: "x", s: id }) })
		if (ids.length > 0) tt.__changed(c)
		return ids.length
	},
	stats: function(aName) {
		var tt = this.__t(), c = tt.__c(aName), res = { series: 0, points: 0, metrics: {}, tiers: {} }
		c.tiers.forEach(t => { res.tiers[t.key] = { step: t.step, entries: 0 } })
		c.st.ids().forEach(id => {
			var m = c.st.meta(id)
			res.series++
			if (isUnDef(res.metrics[m.metric])) res.metrics[m.metric] = { series: 0, points: 0, first: __, last: __ }
			var ms = res.metrics[m.metric]
			ms.series++
			c.tiers.forEach(t => {
				var b = c.st.bounds(id, t.key)
				if (isUnDef(b)) return
				res.tiers[t.key].entries += b.count
				if (t.step == 0) {
					res.points += b.count; ms.points += b.count
					ms.first = isUnDef(ms.first) ? b.first : Math.min(ms.first, b.first)
					ms.last = isUnDef(ms.last) ? b.last : Math.max(ms.last, b.last)
				}
			})
		})
		return res
	},
	housekeep: function(aName, aOptions) {
		var tt = this.__t(), c = tt.__c(aName)
		aOptions = _$(aOptions, "options").isMap().default({})
		tt.__rw(c)
		var n = tt.__housekeep(c, isDef(aOptions.now) ? tt.__ts(aOptions.now) : __)
		if (isDef(c.opts.file)) { tt.__flush(c); tt.__compactIf(c) }
		return n
	},
	rebuildRollups: function(aName) {
		var tt = this.__t(), c = tt.__c(aName)
		tt.__rw(c)
		tt.__rebuildAll(c)
		if (isDef(c.opts.file)) tt.__compact(c)
	},
	compact: function(aName) {
		var tt = this.__t()
		return tt.__compact(tt.__c(aName))
	},
	save: function(aName) {
		return this.__t().__save(aName)
	},
	// flattens a map of metrics into [ { metric, labels, v } ]; nested maps extend the metric name, arrays add an 'idx' label
	__flat: function(aObj, aPrefix, aLabels, aOut) {
		var self = this
		if (isNumber(aObj) && isFinite(aObj)) aOut.push({ metric: aPrefix, labels: aLabels, v: aObj })
		else if (isBoolean(aObj)) aOut.push({ metric: aPrefix, labels: aLabels, v: aObj ? 1 : 0 })
		else if (isArray(aObj)) aObj.forEach((o, i) => self.__flat(o, aPrefix, merge(aLabels, { idx: String(i) }), aOut))
		else if (isMap(aObj)) Object.keys(aObj).forEach(k => { var n = k.replace(/^_+/, ""); self.__flat(aObj[k], isDef(aPrefix) && aPrefix.length > 0 ? aPrefix + "_" + n : n, aLabels, aOut) })
		return aOut
	},
	__sane: s => String(s).replace(/[^a-zA-Z0-9_:]/g, "_").replace(/^(\d)/, "_$1"),
	collect: function(aEvery, aName, aSource, aOptions) {
		var self = this, tt = this.__t()
		aOptions = _$(aOptions, "options").isMap().default({})
		var labels = tt.__labels(aOptions.labels), prefix = isString(aOptions.prefix) ? aOptions.prefix : ""
		tt.__c(aName)
		var once = function() {
			var raw = isFunction(aSource) ? aSource() : (isArray(aSource) ? ow.loadMetrics().getSome(aSource) : ow.loadMetrics().getAll())
			var pts = []
			if (isArray(raw) && raw.length > 0 && isString(raw[0].metric)) {
				pts = raw.map(r => ({ metric: r.metric, labels: merge(labels, tt.__labels(r.labels)), v: r.v, ts: r.ts }))
			} else {
				pts = self.__flat(raw, "", labels, [])
			}
			var t = now()
			pts = pts.filter(p => isString(p.metric) && p.metric.length > 0).map(p => ({ metric: self.__sane(prefix + p.metric), labels: p.labels, ts: isDef(p.ts) ? p.ts : t, v: p.v }))
			if (pts.length > 0) $ch(aName).setAll([ "metric", "labels", "ts" ], pts)
			return pts.length
		}
		var __f = function() {
			if ($ch().list().indexOf(aName) < 0) { res.stop(); return }
			try { once() } catch(e) { if (isFunction(aOptions.onError)) aOptions.onError(e); else logErr("timeseries collect: " + e) }
		}
		var res
		if (isString(aEvery)) {
			ow.loadServer()
			var sch = new ow.server.scheduler()
			sch.addEntry(aEvery, __f)
			res = { once: once, stop: () => sch.stop() }
		} else if (isNumber(aEvery)) {
			var th = new Threads()
			th.addScheduleThreadWithFixedDelay(__f, aEvery)
			res = { once: once, stop: () => th.stop() }
		} else {
			res = { once: once, stop: () => {} }
		}
		return res
	},
	// records changes of a channel into aTargetCh. aOptions: metric (String|Function(key, value)), labels (Array of field names | Function), values (Array of field names; one metric per field named metric_field) or value (field name | Function), ts (field name | Function)
	getTimeSeriesSubscriber: function(aTargetCh, aOptions) {
		var self = this
		ow.loadObj()
		_$(aTargetCh, "aTargetCh").isString().$_()
		aOptions = _$(aOptions, "options").isMap().$_()
		if (isUnDef(aOptions.metric)) throw "options.metric is required"
		var ops = isArray(aOptions.ops) ? aOptions.ops : [ "set", "setall" ]
		var rec = function(k, v, out) {
			var all = merge(isMap(k) ? k : {}, isMap(v) ? v : {})
			var metric = isFunction(aOptions.metric) ? aOptions.metric(k, v) : aOptions.metric
			var lbs = {}
			if (isFunction(aOptions.labels)) lbs = aOptions.labels(k, v)
			else if (isArray(aOptions.labels)) aOptions.labels.forEach(f => { if (isDef(all[f])) lbs[f] = all[f] })
			var t = isFunction(aOptions.ts) ? aOptions.ts(k, v) : (isString(aOptions.ts) ? all[aOptions.ts] : __)
			var add = (m, x) => { if (isNumber(x) && isFinite(x)) out.push({ metric: self.__sane(m), labels: lbs, ts: t, v: x }) }
			if (isArray(aOptions.values)) aOptions.values.forEach(f => add(metric + "_" + f, all[f]))
			else add(metric, isFunction(aOptions.value) ? aOptions.value(k, v) : (isString(aOptions.value) ? all[aOptions.value] : all.v))
		}
		return function(aC, aO, aK, aV) {
			if (ops.indexOf(aO) < 0 || aC == aTargetCh) return
			var out = []
			if (aO == "set") rec(aK, aV, out)
			else if (aO == "setall") { for (var i in aV) rec(ow.obj.filterKeys(isArray(aK) ? aK : [], aV[i]), aV[i], out) }
			if (out.length > 0) $ch(aTargetCh).setAll([ "metric", "labels", "ts" ], out)
		}
	},
	toOpenMetrics: function(aName, aSelector, aOptions) {
		var tt = this.__t(), c = tt.__c(aName), self = this
		aOptions = _$(aOptions, "options").isMap().default({})
		var unit = aOptions.tsUnit == "ms" ? 1 : 1000, help = _$(aOptions.help, "options.help").isMap().default({})
		var all = isDef(aOptions.from) || isDef(aOptions.to)
		var from = isDef(aOptions.from) ? tt.__ts(aOptions.from) : -Infinity, to = isDef(aOptions.to) ? tt.__ts(aOptions.to) : Infinity
		var esc = s => String(s).replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\n")
		var lines = [], seen = {}
		tt.__select(c, aSelector).forEach(id => {
			var m = c.st.meta(id), name = self.__sane(m.metric), ls = Object.keys(m.labels).map(k => self.__sane(k) + "=\"" + esc(m.labels[k]) + "\"").join(",")
			var r
			if (all) r = c.st.read(id, "raw", from, to)
			else { var b = c.st.bounds(id, "raw"); if (isUnDef(b)) return; r = c.st.read(id, "raw", b.last, b.last) }
			if (!seen[name] && isMap(help[m.metric])) {
				seen[name] = true
				if (isDef(help[m.metric].help)) lines.push("# HELP " + name + " " + help[m.metric].help)
				if (isDef(help[m.metric].type)) lines.push("# TYPE " + name + " " + help[m.metric].type)
			}
			for (var i = 0; i < r.ts.length; i++)
				lines.push(name + (ls.length > 0 ? "{" + ls + "}" : "") + " " + r.v[i] + (aOptions.timestamps === false ? "" : " " + (r.ts[i] / unit)))
		})
		return lines.join("\n") + (lines.length > 0 ? "\n" : "")
	},
	fromOpenMetrics: function(aName, aText, aOptions) {
		var tt = this.__t(), c = tt.__c(aName), self = this
		aOptions = _$(aOptions, "options").isMap().default({})
		var unit = aOptions.tsUnit == "ms" ? 1 : 1000, extra = tt.__labels(aOptions.labels)
		var re = /^([a-zA-Z_:][a-zA-Z0-9_:]*)(?:\{(.*)\})?\s+(\S+)(?:\s+(\S+))?\s*$/
		var pts = []
		String(aText).split("\n").forEach(line => {
			line = line.trim()
			if (line.length == 0 || line.charAt(0) == "#") return
			var mm = line.match(re)
			if (!isArray(mm)) return
			var v = Number(mm[3])
			if (!isFinite(v)) return
			var lbs = {}, lre = /([a-zA-Z_][a-zA-Z0-9_]*)="((?:[^"\\]|\\.)*)"/g, x
			while ((x = lre.exec(mm[2] || "")) !== null) lbs[x[1]] = x[2].replace(/\\n/g, "\n").replace(/\\"/g, "\"").replace(/\\\\/g, "\\")
			var t = isDef(mm[4]) && isFinite(Number(mm[4])) ? Math.round(Number(mm[4]) * unit) : (isDef(aOptions.ts) ? tt.__ts(aOptions.ts) : now())
			pts.push({ metric: mm[1], labels: merge(lbs, extra), ts: t, v: v })
		})
		if (pts.length > 0) $ch(aName).setAll([ "metric", "labels", "ts" ], pts)
		return pts.length
	},
	/**
	 * Pushes the latest point of each series matching aSelector to a Prometheus push gateway (aPushGwUrl) under the job aJob.
	 * Series are grouped by the values of the aOptions.groupBy labels: each distinct combination is one request to
	 * <gateway>/metrics/job/<job>/<label>/<value>... Options: mode ("post", default: replaces only the metrics pushed; or "put":
	 * replaces every metric of the grouping key), help (as in toOpenMetrics). Timestamps are not sent (the gateway rejects them).
	 * Label values that are empty or contain "/" are sent base64 encoded (label@base64). Returns the number of series pushed.
	 */
	pushPrometheus: function(aName, aPushGwUrl, aJob, aSelector, aOptions) {
		var self = this
		aOptions = _$(aOptions, "options").isMap().default({})
		_$(aPushGwUrl, "aPushGwUrl").isString().$_()
		_$(aJob, "aJob").isString().$_()
		if (aJob.length == 0 || aJob.indexOf("/") >= 0) throw "timeseries pushPrometheus: job must not be empty or contain '/'"
		var groupBy = _$(aOptions.groupBy, "options.groupBy").isArray().default([])
		var mode = String(_$(aOptions.mode, "options.mode").isString().default("post")).toLowerCase()
		if ([ "post", "put" ].indexOf(mode) < 0) throw "timeseries pushPrometheus: options.mode must be 'post' or 'put'"
		var sel = isMap(aSelector) ? aSelector : {}, base = aPushGwUrl.replace(/\/+$/, "") + "/metrics/job/" + encodeURIComponent(aJob)

		// one group (and one request) per distinct combination of the groupBy values
		var groups = {}, order = [], count = 0
		this.series(aName, sel).forEach(s => {
			var key = {}
			groupBy.forEach(l => {
				if (isUnDef(s.labels[l])) throw "timeseries pushPrometheus: series " + s.metric + " has no label '" + l + "' (groupBy)"
				key[l] = s.labels[l]
			})
			var id = stringify(key, __, "")
			if (isUnDef(groups[id])) { groups[id] = key; order.push(id) }
			count++
		})

		var encLabel = l => encodeURIComponent(self.__sane(l))
		var encValue = (l, v) => {
			if (v.length == 0 || v.indexOf("/") >= 0) {
				var b = String(java.util.Base64.getUrlEncoder().encodeToString(java.lang.String.valueOf(v).getBytes(java.nio.charset.StandardCharsets.UTF_8)))
				return { name: self.__sane(l) + "@base64", value: b.length == 0 ? "=" : b }
			}
			return { name: encLabel(l), value: encodeURIComponent(v) }
		}

		order.forEach(id => {
			var key = groups[id], path = "", gsel = { metric: sel.metric, labels: merge(isMap(sel.labels) ? sel.labels : {}, key) }
			groupBy.forEach(l => { var e = encValue(l, key[l]); path += "/" + e.name + "/" + e.value })
			var text = this.toOpenMetrics(aName, gsel, { timestamps: false, help: aOptions.help })
			if (text.length == 0) return
			var req = $rest({ requestHeaders: { "Content-Type": "text/plain; version=0.0.4" }, throwExceptions: true })
			if (mode == "put") req.put(base + path, text); else req.post(base + path, text)
		})
		return count
	}
};

// Serializes the access to each timeseries channel: collectors and subscribers write from other threads while queries read the same arrays
;(function() {
	var wrap = function(o, names) {
		names.forEach(function(n) {
			var orig = o[n]
			o[n] = function(aName) {
				var c = ow.ch.__types.timeseries.__channels[aName]
				if (isUnDef(c)) return orig.apply(this, arguments)
				c.mx.lock()
				try { return orig.apply(this, arguments) } finally { c.mx.unlock() }
			}
		})
	}
	wrap(OpenWrap.ch.prototype.__types.timeseries, [ "destroy", "size", "forEach", "getAll", "getKeys", "getSortedKeys", "getSet", "set", "setAll", "unset", "unsetAll", "get", "pop", "shift" ])
	wrap(OpenWrap.ch.prototype.utils.timeseries, [ "series", "labels", "latest", "range", "drop", "stats", "housekeep", "rebuildRollups", "compact", "save", "toOpenMetrics" ])
})();

OpenWrap.ch.prototype.comms = {
	__counter: {},

	getRetrySubscriberFunc: function(subsFunc, aMaxTime, aMaxCount, aUUID) {
		aMaxTime = _$(aMaxTime).isNumber("Please provide a number max time.").default(__);
		aMaxCount = _$(aMaxCount).isNumber("Please provide a number max count.").default(10);

		return function(aN, aOp, aK, aV) {
			if (isDef(aMaxTime)) {
				$from($ch("__comm::" + aN).getKeys())
				.lessEquals("timeStamp", (now() - aMaxTime))
				.select((r) => {
					$ch("__comm::" + aN).unset(r);
				});
			}

			if (isDef(aMaxCount)) {
				if ($ch("__comm::" + aN).size() >= aMaxCount) {
					$from($ch("__comm::" + aN).getKeys())
					.sort("timeStamp")
					.select()
					.forEach((v) => {
						if ($ch("__comm::" + aN).size() >= aMaxCount) $ch("__comm::" + aN).unset(v);
					});
				}
			}

			$from($ch("__comm::" + aN).getAll())
			.sort("timeStamp")
			.select((v) => {
				if (isDef(v) && isDef(v.operation)) {
					subsFunc(aN, v.operation, v.keys, v.values, __, v.forcedTimeStamp, aUUID);
					$ch("__comm::" + aN).unset({
						timeStamp: v.timeStamp,
						operation: v.operation,
						keys     : v.keys
					});
				}
			});
		};
	},

	/**
	 * <odoc>
	 * <key>ow.ch.comms.getSubscriberFunc(aURL, aUUID, aLogin, aPassword, aTimeout)</key>
	 * Returns a function to be used with ow.ch.subscribe for REST communication to the provided aURL intended
	 * to be used with ow.ch.server.*. Optionally aUUID can be provided to ignore subscriber request using it.
	 * Optionally you can provide aLogin, aPassword and/or a aTimeout (in ms). 
	 * </odoc>
	 */
	getSubscribeFunc: function(aURL, aUUID, aL, aP, aT, aPA) {
		return  function(na, op, k, v, al, t, sUUID) {
			if (isUnDef(sUUID)) sUUID = genUUID();
			if (sUUID == aUUID) return;
			
			$ch("__comm::" + na).create();
			syncFn(function() { 
				if (isUnDef(ow.ch.comms.__counter[na])) {
					ow.ch.comms.__counter[na] = $atomic()
				}
			}, ow.ch.comms.__counter[na])

			function recordError(_op, _t, _k, _v, _e) {
				var ct = nowUTC();

				$ch("__comm::" + na).set({
					"timeStamp": ct,
					"operation": _op,
					"keys"     : _k
				}, {
					"timeStamp": ct,
					"operation": _op,
					"keys"     : _k,
					"message"  : _e,
					"forcedTimeStamp": _t,
					"values"   : _v
				});
			}

			try {
				function shouldReset(aRes) {
					if ((isDef(aRes.c) && isDef(aRes.l) && isDef(aRes.v)) && 	
					    (aRes.c != ow.ch.comms.__counter[na].get() || 
						 aRes.l != ow.ch.size(na) 
						 ) && 
						ow.ch.jobs[na].length < 1 &&
						ow.ch.size(na) > 0) {
						//syncFn(function() { ow.ch.comms.__counter[na] = 0; }, ow.ch.comms.__counter[na]);
						ow.ch.comms.__counter[na].set(0)
						syncFn(function() {
							//ow.obj.rest.set(aURL, { "o": "r", "k": Object.keys(ow.ch.getKeys(na)[0]), "t": t }, ow.ch.getAll(na), aL, aP, aT);
							$rest({
								login: aL,
								pass: aP,
								connectionTimeout: aT,
								preAction: aPA
							}).put(aURL, ow.ch.getAll(na), { "o": "r", "k": Object.keys(ow.ch.getKeys(na)[0]), "t": t });
						}, aURL);
					}
				}

				var ak = k, av = v;
				if (typeof k != "object") ak = { "key": k };
				if (typeof v != "object") av = { "key": k, "value": v };
				switch(op) {
				case "setall": 
					syncFn(function() { 
						if (ow.ch.comms.__counter[na].get() != 0)
							ow.ch.comms.__counter[na].inc()
						else
							ow.ch.comms.__counter[na].set(1)
					}, ow.ch.comms.__counter[na])
					var res;
					syncFn(function() {
						//res = ow.obj.rest.jsonSet(aURL, { "o": "a", "k": k, "t": t }, v, aL, aP, aT); 
						res = $rest({
							login: aL,
							pass: aP,
							connectionTimeout: aT,
							preAction: aPA
						}).put(aURL, v, { "o": "a", "k": k, "t": t });
						shouldReset(res);
					}, aURL);
					break;
				case "unsetall": 
					syncFn(function() { 
						if (ow.ch.comms.__counter[na].get() != 0)
							ow.ch.comms.__counter[na].inc()
						else
							ow.ch.comms.__counter[na].set(1)
					}, ow.ch.comms.__counter[na])
					var res;
					syncFn(function() {
						//res = ow.obj.rest.jsonSet(aURL, { "o": "ua", "k": k, "t": t }, v, aL, aP, aT); 
						res = $rest({
							login: aL,
							pass: aP,
							connectionTimeout: aT,
							preAction: aPA
						}).put(aURL, v, { "o": "ua", "k": k, "t": t });
						shouldReset(res);
					}, aURL);
					break;					
				case "set"   : 
					ow.ch.comms.__counter[na].inc()
					var res;
					syncFn(function() {
						//res = ow.obj.rest.jsonSet(aURL, { "o": "e", "k": ak, "t": t }, av, aL, aP, aT);
						res = $rest({
							login: aL,
							pass: aP,
							connectionTimeout: aT,
							preAction: aPA
						}).put(aURL, av, { "o": "e", "k": ak, "t": t });
						shouldReset(res);
					}, aURL);
					break;
				case "unset" : 
					ow.ch.comms.__counter[na].inc()
					var res;
					syncFn(function() {
						//res = ow.obj.rest.jsonRemove(aURL, { "o": "e", "k": ak, "t": t }, aL, aP, aT); 
						res = $rest({
							login: aL,
							pass: aP,
							connectionTimeout: aT,
							preAction: aPA
						}).delete(aURL, { "o": "e", "k": ak, "t": t });
						shouldReset(res);
					}, aURL);
					break;				
				default      : 
					var res, resk;
				    syncFn(function() {
						//res = ow.obj.rest.jsonGet(aURL, { "o": "e", "k": ak }, aL, aP, aT);
						//res = ow.obj.rest.jsonGet(aURL, { "o": "a" }, aL, aP, aT);
						res = $rest({
							login: aL,
							pass: aP,
							connectionTimeout: aT,
							preAction: aPA
						}).get(aURL, { "o": "a" });
						//resk = ow.obj.rest.jsonGet(aURL, { "o": "k" }, aL, aP, aT);
						resk = $rest({
							login: aL,
							pass: aP,
							connectionTimeout: aT,
							preAction: aPA
						}).get(aURL, { "o": "k" });
						shouldReset(res);
					}, aURL);
					if (res.r.length > 0) $doV(() => { $ch(na).setAll(Object.keys(resk.r[0]), res.r); });
				}
			} catch(e) {
				recordError(op, t, ak, v, e);
			}
		}
	}
};
	
OpenWrap.ch.prototype.persistence = {
	/**
	 * <odoc>
	 * <key>ow.ch.persistence.getSubscriberFunc(aFilename)</key>
	 * Returns a function to be used with ow.ch.subscribe persisting any existing or new data into
	 * aFilename provided. 
	 * </odoc>
	 */
	getSubscribeFunc: function(aFilename) {
		function recordError(_ch, _op, _k, _v, _e) {
			var ct = nowUTC();
			
			$ch("__store::" + ch).create();
			$ch("__store::" + na).set({
				"timeStamp": ct,
				"operation": _op,
				"keys"     : _k
			}, {
				"timeStamp": ct,
				"operation": _op,
				"keys"     : _k,
				"message"  : _e,
				"values"   : _v
			});
		}
		
		return function(ch, op, k, v, ar) {
			try {
				io.writeFileBytes(aFilename, compress(ar.getAll(ch)));
			} catch(e) {
				recordError(ch, op, k, v, e);
			}
		}
	},
	
	/**
	 * <odoc>
	 * <key>ow.ch.persistence.restore(aChannel, aFilename, anArrayOfKeys) : Number</key>
	 * Tries to restore that previously persisted using ow.ch.getSubscribeFunc from the aFilename using 
	 * anArrayOfKeys (strings representing the string list of fields used as index). The values will be restored
	 * to the aChannel name provided. Returns -1 in case of error or the data loaded length otherwise.
	 * </odoc>
	 */
	restore: function(aChannel, aFilename, anArrayOfKeys) {
		if (isUnDef(ow.ch.channels[aChannel])) throw "Channel " + aChannel + " doesn't exist.";
		
		ow.loadObj();
		var data;
		
		try {
			data = uncompress(io.readFileBytes(aFilename));

			if (data != null && data.length > 0) {
				if (isUnDef(anArrayOfKeys) && isDef(data[0].key) && (isDef(data[0].value))) {
					anArrayOfKeys = [ "key" ];
				}
				ow.ch.setAll(aChannel, anArrayOfKeys, data);
			}
		} catch(e) {
			return -1;
		}
		
		return data.length;
	},
	
	/**
	 * <odoc>
	 * <key>ow.ch.persistence.create(aChannel, aFilename, anArrayOfKeys, shouldCompress, forAll)</key>
	 * Adds a channel identified by the name aChannel, trying to restore data from aFilename given anArrayOfKeys
	 * (strings representing the key fields). Optionally indicating if keys should be compressed in memory with
	 * shouldCompress = true and/or existing subscribers should run for all elements (forAll = true)
	 * </odoc>
	 */
	create: function(aChannel, aFilename, anArrayOfKeys, shouldCompress, forAll) {			
		ow.ch.create(aChannel, shouldCompress);
		ow.ch.persistence.restore(aChannel, aFilename, anArrayOfKeys); 
		ow.ch.subscribe(aChannel, ow.ch.persistence.getSubscribeFunc(aFilename), !forAll);
		
		return this;
	}
};


OpenWrap.ch.prototype.server = {
	__counter: {},
    __log: () => {},

	/**
	 * <odoc>
	 * <key>ow.ch.server.setLog(aLogFunction)</key>
	 * Sets aLogFunction to act as audit for external communication to access a channel. The aLogFunction
	 * will be called passing, as a single argument, a map with:\
	 *    - name    (the channel name)\
	 *    - op      (the operation can be AUTH_OK, AUTH_NOT_OK, GET, SET, REMOVE or CREATE)\
	 *    - request (the HTTP request map)\
	 * \
	 * The request, when available, will include an entry with the current user.\
	 * \
	 * </odoc>
	 */
	setLog: function(aLogFunction) {
		this.__log = aLogFunction;
	},

	/**
	 * <odoc>
	 * <key>ow.ch.server.expose(aName, aLocalPortORServer, aPath, aAuthFunc, aUnAuthFunc, noCheck) : String</key>
	 * Given aName channel and aLocalPortORServer will use the provided server, or start a simple http server on the 
	 * provided port, to expose access to the aName channel on the URL aPath. It will return an unique identifier
	 * to be use to identify incoming requests from this aPath and server on channel subscribe functions. Optionally
	 * you can also provide aAuthFunc(user, pass, aServer, aRequest) and aUnAuthFunc(aServer, aRequest) functions using ow.server.httpd.authBasic.
	 * The aAuthFunc can add aRequest.channelPermission to enforce read and/or write permissions on a channel (e.g. "r", "rw").
	 * If needed you can ignore the checking if the aName channel exists with noCheck.\
	 * \
	 * Example:\
	 * \
	 * // Exposing the a log dump channel on port 8090 for test proposes.\
	 * ow.ch.server.expose("__log", 8090, "/log");\
	 * \
	 * </odoc>
	 */
	expose: function(aName, aLocalPortORServer, aPath, aAuthFunc, aUnAuthFunc, noCheck) {
		if (isUnDef(aLocalPortORServer)) return __;
		if (isUnDef(aPath)) aPath = "/" + aName;

		if (isDef(ow.ch.expose[aName])) {
			var res = $from(ow.ch.expose[aName])
			.equals("path", aPath)
			.select((r) => {
				if (isDef(r.hs) && r.hs.isAlive()) {
					return r.uuid;
				} else {
					return null;
				}
			});
			if (res[0] != null) return res[0];
		} else {
			ow.ch.expose[aName] = [];
		}

		var hs;
		var uuid = genUUID();
		ow.loadServer();

		//noCheck = (isUnDef(noCheck)) ? false : noCheck;
 
		if (!noCheck) {
			//if (isUnDef(ow.ch.size(aName))) throw "Channel " + aName + " doesn't exist.";
			try { ow.ch.size(aName); } catch(e) { ow.ch.create(aName); }
		}

		if (!(isObject(aLocalPortORServer))) {
			hs = ow.server.httpd.start(aLocalPortORServer, undefined, undefined, undefined, function(aT, aM, aE) {
				if (aT.toString() != "DEBUG" && aE.getMessage() != "Broken pipe") {
					logErr(aM);
				}
			});
		} else {
			hs = aLocalPortORServer;
		}

		var routes = {};
		if (isDef(aAuthFunc)) {
			routes[aPath] = function(r) { 
				return ow.server.httpd.authBasic(aName, hs, r, 
						(u, p, s, r) => {
							var res = aAuthFunc(u, p, s, r);
							r.user = u;
							if (res) {
								ow.ch.server.__log({ name: aName, request: r, op: "AUTH_OK" });
							} else {
								ow.ch.server.__log({ name: aName, request: r, op: "AUTH_NOT_OK" });
							}
							return res;
						}, 
						function(hss, rr) { 
							if (isUnDef(rr.channelPermission)) rr.channelPermission = "rw";
							return ow.ch.server.routeProcessing(aPath, rr, aName, uuid);
						},
						aUnAuthFunc);
			};
		} else {
			routes[aPath] = function(r) { return ow.ch.server.routeProcessing(aPath, r, aName, uuid); };
		}
		
		var droute = ow.server.httpd.getDefaultRoute(hs);
		if (isUnDef(droute)) droute = function (r) { return hs.reply("not found", ow.server.httpd.mimes.TXT, ow.server.httpd.codes.NOTFOUND) };
		
		ow.server.httpd.route(hs, ow.server.httpd.mapWithExistingRoutes(hs, routes), droute);
		ow.ch.expose[aName].push({
			uuid: uuid,
			hs: hs,
			path: aPath
		});

		return uuid;
	},

	/**
	 * <odoc>
	 * <key>ow.ch.server.peer(aName, aLocalPortORServer, aPath, aRemoteURLArray, aAuthFunc, aUnAuthFunc, aMaxTime, aMaxCount)</key>
	 * Exposes aName channel in the same way as ow.ch.server.expose but it also add a subscribe function to 
	 * the aName channel to remotely peer with other expose channel(s) given aRemoteURLArray. Optionally
	 * aRemoteURLArray can also be a function returning a URL or an array of URLs. Optionally
	 * you can also provide aAuthFunc(user, pass) and aUnAuthFunc(aServer, aRequest) functions using ow.server.httpd.authBasic.
	 * The aAuthFunc can add aRequest.channelPermission to enforce read and/or write permissions on a channel (e.g. "r", "rw").
	 * Optionally you can provide aMaxTime for expiration of commands to retry to communicate and aMaxCount of commands to retry to communicate.\
	 * \
	 * Example:\
	 * \
	 * ow.ch.server.peer("__log", 8090, "/log", [ "http://server1.local:8090/log", "https://l:p@server2.local:8090/log" ]);\
	 * \
	 * </odoc>
	 */
	peer: function(aName, aLocalPortORServer, aPath, aRemoteURLArray, aAuthFunc, aUnAuthFunc, aMaxTime, aMaxCount) {
		var uuid = ow.ch.server.expose(aName, aLocalPortORServer, aPath, aAuthFunc, aUnAuthFunc);
		var res = [];

		if (isFunction(aRemoteURLArray) && !isArray(aRemoteURLArray)) {
			aRemoteURLArray = aRemoteURLArray(aName, aLocalPortORServer, aPath, uuid);
		}

		if (!(isArray(aRemoteURLArray))) aRemoteURLArray = [ aRemoteURLArray ];
		
		ow.loadObj();
		for(var i in aRemoteURLArray) {
			if (isDef(ow.ch.peers[aName][aRemoteURLArray[i]])) {
				res = res.concat(ow.ch.peers[aName][aRemoteURLArray[i]]);
			} else {
				var fn = ow.ch.comms.getSubscribeFunc(aRemoteURLArray[i], uuid);
				var hkfn = ow.ch.comms.getRetrySubscriberFunc(fn, aMaxTime, aMaxCount, uuid);
				fn(aName, "reset");
	
				var sfn = ow.ch.subscribe(aName, fn);
				var shkfn = ow.ch.subscribe(aName, hkfn);
	
				res.push(sfn);
				res.push(shkfn);
	
				if (isUnDef(ow.ch.peers[aName])) ow.ch.peers[aName] = {};
				if (isUnDef(ow.ch.peers[aName][aRemoteURLArray[i]])) ow.ch.peers[aName][aRemoteURLArray[i]] = [];
	
				ow.ch.peers[aName][aRemoteURLArray[i]].push(sfn);
				ow.ch.peers[aName][aRemoteURLArray[i]].push(shkfn);
			}
		}
	
		return res;
	},

	/**
	 * <odoc>
	 * <key>ow.ch.server.unpeer(aName, aRemoteURL)</key>
	 * Remove all subscribers related with aRemoteURL from the aName channel effectively "unpeering" it from the aRemoteURL.
	 * </odoc>
     */
	unpeer: function(aName, aURL) {
		var toDelete = [];

		for(var ii in ow.ch.peers[aName][aURL]) {
			toDelete.push(ow.ch.peers[aName][aURL][ii]);
		}

		toDelete.forEach((v) => {
			$ch(aName).unsubscribe(v);
		});
	},

	/**
	 * <odoc>
	 * <key>ow.ch.server.routeProcessing(aURI, aRequest, aName) : HTTPServerReply</key>
	 * Creates a server route processing for a ow.ch.comms client provided aURI, a HTTPServer aRequest and the 
	 * aName of a channel (please note that you should create the channel prior to using this function).
	 * Depending on aRequest.channelPermission some operations may not execute:\
	 * \
	 * - "r" - allows channel get/getAll operations\
	 * - "w" - allows channel set/setAll/getSet/unset/unsetAll operations\
	 * \
	 * Example:\
	 * \
	 * var hs = ow.loadServer().httpd.start(17878);\
	 * ow.server.httpd.route(hs, { "/rest": function(r) { return ow.ch.server.routeProcessing("/rest", r, "my-channel") }});\
	 * \
	 * for multiple channels:\
	 * var hs = ow.loadServer().httpd.start(17878);\
	 * ow.server.httpd.route(hs, {\
	 *    "/chan1": function(r) { return ow.ch.server.routeProcessing("/chan1", r, "chan-1") },\
	 *    "/chan2": function(r) { return ow.ch.server.routeProcessing("/chan2", r, "chan-2") }\
	 * };\
	 * \
	 * </odoc>
	 */
	routeProcessing: function(aURI, aRequest, aName, aaUUID) {
		ow.loadServer();

		function restSet(k, v) {
			syncFn(function() { 	
				if (isUnDef(ow.ch.server.__counter[aName])) {
					ow.ch.server.__counter[aName] = $atomic()
				}
			}, ow.ch.server.__counter[aName]);

			if (isDef(k.o)) {
				switch(k.o) {
				case "a":
					//if (k.t < $ch(aName).getVersion()) return undefined;
					if (isArray(k.k) && isArray(v)) {
						var cc = ow.ch.server.__counter[aName].inc()
						var rt = $ch(aName).setAll(k.k, v, k.t, aaUUID, aRequest);
						return { "c": cc, "r": rt };
					} 
					break;
				case "ua":
					//if (k.t < $ch(aName).getVersion()) return undefined;
					if (isArray(k.k) && isArray(v)) {
						var cc = ow.ch.server.__counter[aName].dec()
						var rt = $ch(aName).unsetAll(k.k, v, k.t, aaUUID, aRequest);
						return { "c": cc, "r": rt };
					} 
					break;					
				case "r":
					if (isArray(k.k) && isArray(v)) {
						var keysToInclude = [];
						for(var i in v) {
							keysToInclude.push(ow.loadObj().filterKeys(k.k, v[i]));
						}
						$ch(aName).forEach(function(ak, av) {
							if (keysToInclude.indexOf(ak) < 0) {
								$ch(aName).unset(ak, k.t, aaUUID, aRequest);
							}
							return ak;
						});

						var cc = ow.ch.server.__counter[aName].set(0)
						var rt = $ch(aName).setAll(k.k, v, k.t, aaUUID, aRequest);
						return { "c": cc, "r": rt };
					} 
					break;					
				case "e":		
					//if (k.t < $ch(aName).getVersion()) return undefined;
					var cc = ow.ch.server.__counter[aName].inc()
					var rt = $ch(aName).set(k.k, v, k.t, aaUUID, aRequest);
					return { "c": cc, "r": rt };
				case "es":
					var cc = ow.ch.server.__counter[aName].inc()
					var rt = $ch(aName).getSet(k.m, k.k, v, k.t, aaUUID, aRequest);
					return { "c": cc, "r": rt };
				}
			}
		}

		function restUnset(k) {	
			//if (k.t < $ch(aName).getVersion()) return undefined;

			syncFn(function() { 
				if (isUnDef(ow.ch.server.__counter[aName])) {
					ow.ch.server.__counter[aName] = $atomic()
				}
			}, ow.ch.server.__counter);

			if (isDef(k.o)) {
				if (k.o == "e") {
					//if (k.t < $ch(aName).getVersion()) return undefined;
					var cc = ow.ch.server.__counter[aName].inc()
					var rt = $ch(aName).unset(k.k, k.t, aaUUID, aRequest);
					return { "c": cc, "r": rt };
				}
			}
		}

		function restGet(k) {
			if (isDef(k.o)) {
				switch(k.o) {
				case "a":
					return { "r": $ch(aName).getAll(__), "c": ow.ch.server.__counter[aName] };
				case "e":
					return { "r": $ch(aName).get(k.k, __), "c": ow.ch.server.__counter[aName] };
				case "k":
					return { "r": $ch(aName).getKeys(false, __), "c": ow.ch.server.__counter[aName] };
				case "s":
					return { "r": $ch(aName).getSortedKeys(false, __), "c": ow.ch.server.__counter[aName] };
				case "l":
					return { "r": $ch(aName).size(), "c": ow.ch.server.__counter[aName] };
				}
			}
		}

		function recordError(_op, _t, _k, _v, _e) {
			var ct = nowUTC();

			$ch("__comm::" + aName).create();
			$ch("__comm::" + aName).set({
				"timeStamp": ct,
				"operation": _op,
				"keys"     : _k
			}, {
				"timeStamp": ct,
				"operation": _op,
				"keys"     : _k,
				"message"  : _e,
				"forcedTimeStamp": _t,
				"values"   : _v
			});
		}
		
		return ow.server.rest.reply(aURI, aRequest, 
			function(i, d) { 
				// Create
				ow.ch.server.__log({ request: aRequest, name: aName, op: "CREATE" });
				try {
					if (isDef(aRequest.channelPermission) && 
						aRequest.channelPermission.indexOf("w") < 0)
						return { "l": $ch(aName).size(), "v": $ch(aName).getVersion(), "c": -1, "r": {} };
					var c = restSet(i, d);
					if (isUnDef(c)) return {};
					return { "l": $ch(aName).size(), "v": $ch(aName).getVersion(), "c": c.c, "r": c.r };
				} catch(e) {
					recordError("create", undefined, i, d, e);
					return {};
				}
			}, 
			function(i) {	
				// Get
				ow.ch.server.__log({ request: aRequest, name: aName, op: "GET" });
				try {
					if (isDef(aRequest.channelPermission) && 
						aRequest.channelPermission.indexOf("r") < 0)
						return { "l": $ch(aName).size(), "v": $ch(aName).getVersion(), "c": -1, "r": {} };
					var c = restGet(i);
					if (isUnDef(c)) return {};					
					return { "l": $ch(aName).size(), "v": $ch(aName).getVersion(), "c": c.c, "r": c.r };
				} catch(e) {
					recordError("get", undefined, i, d, e);
					return {};
				}
			}, 
			function(i, d) {
				// Set
				ow.ch.server.__log({ request: aRequest, name: aName, op: "SET" });
				try {
					if (isDef(aRequest.channelPermission) && 
						aRequest.channelPermission.indexOf("w") < 0)
						return { "l": $ch(aName).size(), "v": $ch(aName).getVersion(), "c": -1, "r": {} };
					var c = restSet(i, d);
					if (isUnDef(c)) return {};				
					return { "l": $ch(aName).size(), "v": $ch(aName).getVersion(), "c": c.c, "r": c.r };
				} catch(e) {
					recordError("set", undefined, i, d, e);
					return {};
				}
			}, 
			function(i) {
				// Remove
				ow.ch.server.__log({ request: aRequest, name: aName, op: "REMOVE" });
				try {
					if (isDef(aRequest.channelPermission) && 
						aRequest.channelPermission.indexOf("w") < 0)
						return { "l": $ch(aName).size(), "v": $ch(aName).getVersion(), "c": -1, "r": {} };
					var c = restUnset(i);
					if (isUnDef(c)) return {};
					return { "l": $ch(aName).size(), "v": $ch(aName).getVersion(), "c": c.c, "r": c.r };
				} catch(e) {
					recordError("remove", undefined, i, d, e);
					return {};
				}
			}
		);
	}
}
