// OpenWrap v2
// Author: Nuno Aguiar
// Channels

OpenWrap.ch = function() {
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

OpenWrap.ch.prototype.__types = {
	// Obj BIG channel implementation
	//
	big: {
		__channels: {},
		create : function(aName, shouldCompress) { this.__channels[aName] = ow.loadObj().big.create(shouldCompress); },
		destroy: function(aName) { delete this.__channels[aName]; },
		size   : function(aName) { return this.__channels[aName].getSize(); },
		forEach: function(aName, aFunction) { 
			var parent = this;
			this.getKeys(aName).forEach((aK, aV) => {
				aFunction(aK, parent.get(aName, aK));
			});
			/*this.__channels[aName].find(function(aKey) {
				aFunction(aKey, parent.get(aName, aKey));
				return aKey;
			});*/
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
	 *    - db   (Database) The database object to access the database table.\
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
			
			this.__options[aName] = options;
		},
		destroy: function(aName) { 
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
	 * This OpenAF channel implementation encapsulates access based on functions. The creation options a map of
	 * keys where each value is a function.
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
				$do(() => {
					parent.getKeys(aName, true).map(v => {
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
			if (this.__cache[aName].Size < 0 || this.__cache[aName].Size > this.__cache[aName].Ch.size()) 
				this.__cache[aName].Ch.set(merge(aK, { ____t: aTimestamp }), this.__cache[aName].Func(aK), aTimestamp, x);
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
			var res = [];
			this.__cache[aName].Ch.forEach(function(aKey, aValue) {
				syncFn(function() { res.push(aValue); }, res);
			}, full);
			return res;
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
					aVv = this.__cache[aName].Ch.get(ee);
					this.__cacheStats[aName].hits++;
				} else {
					var init = nowUTC();
					var aVv = this.__cache[aName].Func(aK);
					this.__cacheStats[aName].miss++;
					this.__cacheStats[aName].avg = (this.__cacheStats[aName].avg + (nowUTC() - init)) / (this.__cacheStats[aName].miss + this.__cacheStats[aName].hits);
					this.__cache[aName].Ch.unset(ee);
					var eK = merge(aK, { ____t: nowUTC() });
					this.__cache[aName].Ch.set(eK, aVv);
					//aVv = this.__cache[aName].Ch.get(eK);
				}
			} else {
				var init = nowUTC();
				var aVv = this.__cache[aName].Func(aK);
				this.__cacheStats[aName].miss++;
				this.__cacheStats[aName].avg = (this.__cacheStats[aName].avg + (nowUTC() - init)) / (this.__cacheStats[aName].miss + this.__cacheStats[aName].hits);
				this.__refresh(aName, 1);
				if (this.__cache[aName].Size < 0 || this.__cache[aName].Size > this.__cache[aName].Ch.size()) {
					var eK = merge(aK, { ____t: nowUTC() });
					this.__cache[aName].Ch.set(eK, aVv);
					//aVv = this.__cache[aName].Ch.get(eK);
				}
			}
			return aVv;
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
			this.__f[aName] = function(force) {
				var cont = false;

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
						parent.__lcks[aName].lock("openaf::ch::buffer::" + aName, 50, -1);
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
				plugin("Threads");
				this.__s[aName] = new Threads();
				this.__s[aName].addScheduleThreadWithFixedDelay(function() { parent.__f[aName](true); }, this.__bm[aName]);
			}
	
			if (addShut) {
				addOnOpenAFShutdown(function() {
					for(var c in ow.ch.__types.buffer.__s) {
						if (isDef(ow.ch.__types.buffer.__s[c])) ow.ch.__types.buffer.__s[c].stop();
					}
					for(var c in ow.ch.__types.buffer.__f) {
						ow.ch.__types.buffer.__f[c](true); 
						$ch(ow.ch.__types.buffer.__bt[c]).waitForJobs(ow.ch.__types.buffer.__t[c]);
						$ch(ow.ch.__types.buffer.__bc[c]).waitForJobs(ow.ch.__types.buffer.__t[c]);
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
	dummy: {
		__channels: {},
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
		__channels: {},
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
			return $ch(this.__channels[aName].chTarget).unsetAll(m.k, m.timestamp);
		},		
		get          : function(aName, aK) {
			var m = { op: "get", name: this.__channels[aName].chTarget, k: aK };
			var r = this.__channels[aName].proxyFunc(m); if (isDef(r)) return r;
			return $ch(this.__channels[aName].chTarget).get(m.k);
		},
		pop          : function(aName) {
			var m = { op: "pop", name: this.__channels[aName].chTarget };
			var r = this.__channels[aName].proxyFunc(m); if (isDef(r)) return r;
			return $ch(this.__channels[aName].chTarget).pop();
		},
		shift        : function(aName) {
			var m = { op: "shift", name: this.__channels[aName].chTarget };
			var r = this.__channels[aName].proxyFunc(m); if (isDef(r)) return r;
			return $ch(this.__channels[aName].chTarget).shift();
		},
		unset        : function(aName, aK, aTimestamp) {
			var m = { op: "unset", name: this.__channels[aName].chTarget, k: aK, timestamp: aTimestamp };
			var r = this.__channels[aName].proxyFunc(m); if (isDef(r)) return r;
			return $ch(this.__channels[aName].chTarget).unset(m.k, m.timestamp);
		}
	},
	// Simple implementation
	//
	simple: {
		__channels: {},
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
	// File implementation
	/**
	 * <odoc>
	 * <key>ow.ch.types.file</key>
	 * This OpenAF implementation implements a simple channel on a single JSON or YAML file. The creation options are:\
	 * \
	 *    - file      (String)  The filepath to the JSON or YAML file to use\
	 *    - yaml      (Boolean) Use YAML instead of JSON (defaults to false)\
	 *    - compact   (Boolean) If JSON and compact = true the JSON format will be compacted (defaults to false or shouldCompress option)\
	 *    - multipart (Boolean) If YAML and multipart = true the YAML file will be multipart\
	 *    - key       (String)  If a key contains "key" it will be replaced by the "key" value\
	 *    - multipath (Boolean) Supports string keys with paths (e.g. ow.obj.setPath) (defaults to false)\
	 *    - lock      (String)  If defined the filepath to a dummy file for filesystem lock while accessing the file\
	 * \
	 * </odoc>
	 */
	//
	file: {
		__channels: {},
		__l: (m) => (isString(m.lock) ? $flock(m.lock).lock() : __),
		__ul: (m) => (isString(m.lock) ? $flock(m.lock).unlock() : __),
		__r: (m) => {
			var r = {};
			if (!io.fileExists(m.file)) return r;

			if (m.yaml) {
				r = io.readFileYAML(m.file, m.multipart);
			} else {
				r = io.readFileJSON(m.file);
			}

			if (!isMap(r)) r = {};
			return r;
		},
		__w: (m, o) => {
			if (m.yaml) {
				io.writeFileYAML(m.file, o, m.multipart);
			} else {
				io.writeFileJSON(m.file, o, m.compact ? "" : __);
			}
		},
		create       : function(aName, shouldCompress, options) {
			ow.loadObj();
			options = _$(options).isMap().default({});
			this.__channels[aName] = {};
			this.__channels[aName].compact   = _$(options.compact, "options.compact").isBoolean().default(shouldCompress);
			this.__channels[aName].file      = _$(options.file, "options.file").isString().$_();
			this.__channels[aName].yaml      = _$(options.yaml, "options.yaml").isBoolean().default(false);
			this.__channels[aName].multipart = _$(options.multipart, "options.multipart").isBoolean().default(false);
			this.__channels[aName].multipath = _$(options.multipath, "options.multipath").isBoolean().default(false);
			this.__channels[aName].key       = _$(options.key, "options.key").isString().default(__);
			this.__channels[aName].lock      = _$(options.lock, "options.lock").isString().default(__);
		},
		destroy      : function(aName) {
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
			Object.keys(m).map(k => {
				try { aFunction(k, m[k]) } catch(e) {};
			});
		},
		getAll      : function(aName, full) {
			var m;
			this.__l(this.__channels[aName]);
			try {
				m = this.__r(this.__channels[aName]);
			} finally {
				this.__ul(this.__channels[aName]);
			}
			return Object.values(m);
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
				if (isString(id) && id.indexOf(".") > 0 && this.__channels[aName].multipath) {
					ow.obj.setPath(m, id, isDef(aV.value) ? aV.value : aV);
				} else {
					m[id]  = isDef(aV.value) ? aV.value : aV;
				}
				this.__w(this.__channels[aName], m);
			} finally {
				this.__ul(this.__channels[aName]);
			}
			
			return aK;
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
			var m;
			this.__l(this.__channels[aName]);
			try {
				m = this.__r(this.__channels[aName]);
			} finally {
				this.__ul(this.__channels[aName]);
			}
			if (isMap(aK) && isDef(aK[this.__channels[aName].key])) aK = { key: aK[this.__channels[aName].key] };
			var id = isDef(aK.key)   ? aK.key   : stringify(sortMapKeys(aK), __, "");
			if (isString(id) && id.indexOf(".") > 0 && this.__channels[aName].multipath) {
				return ow.obj.getPath(m, id);
			} else {
				return m[id];
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
			} finally {
				this.__ul(this.__channels[aName]);
			}
		}
	},	
	// Remote channel implementation
	//
	remote: {
		__channels: {},
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
	 *    - index  (String/Function) The ES index to use or a function to return the name (see also ow.ch.utils.getElasticIndex).\
	 *    - format (String)          If index is a string will use format with ow.ch.utils.getElasticIndex.\
	 *    - idKey  (String)          The ES key id field. Defaults to 'id'.\
	 *    - url    (String)          The HTTP(S) URL to access the ES server/cluster.\
	 *    - user   (String)          Optionally provide a user name to access the ES server/cluster.\
	 *    - pass   (String)          Optionally provide a password to access the ES server/cluster (encrypted or not).\
	 *    - fnId   (String/Function) Optionally called on every operation to calculate the idKey with the key provided as argument. If string will the corresponding hash function (md5/sha1/etc...) with sortMapKeys + stringify.\
	 *    - size   (Number)          Optionally getAll/getKeys to return more than 10 records (up to 10000).\
	 *    - stamp  (Map)             Optionally merge with stamp map.\
	 * \
	 * The getAll/getKeys functions accept an extra argument to provide a ES query map to restrict the results.
	 * </odoc>
	 */
	elasticsearch: {
		__channels: {},
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
		__channels: {},
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
	 * \
	 * The map will be created if it doesn't exist. Operations getKeys/getAll can be paginated with the extra map argument containing start and end\
	 * </odoc>
	 */
	mvs: {
		create       : function(aName, shouldCompress, options) {
			if (isUnDef(options)) options = {};
			if (isUnDef(options.file)) options.file = undefined;

			if (isUnDef(this.__s)) this.__s = {};
			if (isUnDef(this.__f)) this.__f = {};
			if (isUnDef(this.__m)) this.__m = {};
			if (isUnDef(this.__o)) this.__o = {};

			var shut = _$(options.closeOnShutdown).isBoolean().default(true);

			var existing = false, absFile;
			if (isDef(options.file)) {
				absFile = String((new java.io.File(options.file)).getAbsoluteFile());
			} else {
				absFile = "memory";
			}
			options.absFile = absFile;
			
			if (isUnDef(this.__f[absFile])) {
				this.__s[aName] = Packages.org.h2.mvstore.MVStore.Builder();
				this.__s[aName] = this.__s[aName].autoCommitDisabled();

				if (absFile != "memory") this.__s[aName] = this.__s[aName].fileName(absFile);
				if (shouldCompress) this.__s[aName] = this.__s[aName].compress();
				this.__s[aName] = this.__s[aName].open();

				this.__f[absFile] = this.__s[aName];
			} else {
				existing = true;
				this.__s[aName] = this.__f[absFile];
			}

			//this.__s[aName].setVersionsToKeep(2);
			this.__s[aName].setReuseSpace(true);

			if (isUnDef(options.map)) {
				options.map = function() { return "default"; };
			} else {
				if (isString(options.map)) {
					options.map = new Function("return '" + options.map + "';");
				}
			}

			this.__m[aName] = options.map;

			if (isDef(options.compact) && options.compact) {
				this.__s[aName].compactMoveChunks();
			}

			this.__o[aName] = options;
			if (isUnDef(options.internalTrim)) this.__o[aName].stry = ""; else this.__o[aName].stry = options.internalTrim;

			if (shut) {
				var parent = this;
				addOnOpenAFShutdown(function() { if (isDef(parent.__s[aName])) parent.destroy(aName);	});
			}
		},
		destroy      : function(aName) {
			if (isDef(this.__o[aName].compact) && this.__o[aName].compact) {
				this.__s[aName].compactMoveChunks();
			}			

			var found = false;
			for(var i in this.__s) {
				if (i != aName && 
					this.__s[i] == this.__f[this.__o[aName].absFile]) 
				   found = true;
			}

			if (!found) {
				this.__s[aName].close();
				delete this.__f[this.__o[aName].absFile];
			}

			delete this.__s[aName];
			delete this.__o[aName];
		},
		size         : function(aName) {
			var map = this.__s[aName].openMap(this.__m[aName]());
			return map.sizeAsLong();
		},
		forEach      : function(aName, aFunction, x) {
			var aKs = this.getKeys(aName, x);

			for(var i in aKs) {
				aFunction(aKs[i], this.get(aName, aKs[i], x));
			}
		},
		getKeys      : function(aName, full) {
			var res = [];
			full = _$(full, "full").isMap().default({});

			var map = this.__s[aName].openMap(this.__m[aName](full));

			var start = _$(full.start, "full.start").isNumber().default(0);
			var max = this.size(aName);
			var limit = _$(full.end, "full.end").isNumber().default(max);

			for(var i = start; i < limit && i < max; i++) {
				res.push(jsonParse(map.getKey(i)));
			}

			return res;
		},
		getAll      : function(aName, full) {
			var res = [];
			full = _$(full, "full").isMap().default({});

			var map = this.__s[aName].openMap(this.__m[aName](full));

			var start = _$(full.start, "full.start").isNumber().default(0);
			var max = this.size(aName);
			var limit = _$(full.end, "full.end").isNumber().default(max);

			for(var i = start; i < limit && i < max; i++) {
				res.push(jsonParse(map.get(map.getKey(i))));
			}

			return res;
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
			var map = this.__s[aName].openMap(this.__m[aName](ak));

			map.put(stringify(sortMapKeys(ak), __, this.__o[aName].stry), stringify(av, __, this.__o[aName].stry));
			this.__s[aName].commit();
			return ak;
		},
		setAll       : function(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp) {
			ow.loadObj();
			for(var iii in anArrayOfMapData) {
				var ak = ow.obj.filterKeys(anArrayOfKeys, anArrayOfMapData[iii]);
				var av = anArrayOfMapData[iii];
				var map = this.__s[aName].openMap(this.__m[aName](ak));
				map.put(stringify(sortMapKeys(ak), __, this.__o[aName].stry), stringify(av, __, this.__o[aName].stry));
			}
			this.__s[aName].sync();
			this.__s[aName].commit();
		},
		unsetAll       : function(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp) {
			ow.loadObj();
			for(var iii in anArrayOfMapData) {
				var ak = ow.obj.filterKeys(anArrayOfKeys, anArrayOfMapData[iii]);
				//var av = anArrayOfMapData[iii];
				var map = this.__s[aName].openMap(this.__m[aName](ak));
				map.remove(stringify(sortMapKeys(ak), __, this.__o[aName].stry));
			}
			this.__s[aName].sync();
			this.__s[aName].commit();
		},
		get          : function(aName, aKey) {
			var map = this.__s[aName].openMap(this.__m[aName](aKey));

			var r = map.get(stringify(sortMapKeys(aKey), __, this.__o[aName].stry));
			if (r == null || isUnDef(r)) return __; else return jsonParse(r);
		},
		pop          : function(aName) {
			var map = this.__s[aName].openMap(this.__m[aName]());
			var aKey = map.lastKey();
			return jsonParse(map.remove(aKey));	
		},
		shift        : function(aName) {
			var map = this.__s[aName].openMap(this.__m[aName]());
			var aKey = map.firstKey();
			return jsonParse(map.remove(aKey));
		},
		unset        : function(aName, aKey) {
			var map = this.__s[aName].openMap(this.__m[aName](aKey));

			return jsonParse(map.remove(stringify(sortMapKeys(aKey), __, this.__o[aName].stry)));
		}
	},
	/**
	 * <odoc>
	 * <key>ow.ch.types.ignite</key>
	 * This channel type will use an Ignite Data Grid. The creation options are:\
	 * \
	 *    - ignite (Ignite) Use a previously instantiated Ignite plugin (defaults to a new instance).\
	 *    - gridName (String) Use a specific Ignite grid name.\
	 * \
	 * </odoc>
	 */
	ignite: {
		create       : function(aName, shouldCompress, options) {
			if (isDef(getOPackPath("plugin-Ignite"))) loadExternalJars(getOPackPath("plugin-Ignite"));
			plugin("Ignite");
			if (isUnDef(options) || isUnDef(options.ignite)) this.__ig = new Ignite(); else this.__ig = options.ignite;
			if (isDef(options) && isDef(options.persist)) {
				var storageCfg = new Packages.org.apache.ignite.configuration.DataStorageConfiguration();
				storageCfg.getDefaultDataRegionConfiguration().setPersistenceEnabled(true);
				storageCfg.setStoragePath(options.persist);
				storageCfg.setWalPath(options.persist);
				storageCfg.setWalArchivePath(options.persist);

				this.__ig.getConfiguration().setDataStorageConfiguration(storageCfg);
			}
			if (isUnDef(options) || isUnDef(options.gridName)) this.__ig.start(); else this.__ig.start(options.gridName, __, options.client);
			if (isDef(options) && isDef(options.persist)) {
				this.__ig.getIgnite().active(true);
			}
			var ch = this.__ig.getIgnite().getOrCreateCache(aName);
		},
		destroy      : function(aName) {
			var ch = this.__ig.getIgnite().getCache(aName);
			ch.destroy();
		},
		size         : function(aName) { 
			var ch = this.__ig.getIgnite().getCache(aName);
			return ch.size([ Packages.org.apache.ignite.cache.CachePeekMode.ALL ]);
		},
		forEach      : function(aName, aFunction) {
			var keys = this.getKeys(aName);
			for(var o in keys) {
				aFunction(keys[o], this.get(aName, keys[o]));
			}
		},
		getKeys      : function(aName, full) {
			var ch = this.__ig.getIgnite().cache(aName);
			var i = ch.iterator();
			var keys = [];
			while(i.hasNext()) {
				keys.push(af.fromJavaMap(i.next().getKey()));
			}
			return keys;
		},
		getSortedKeys: function(aName, full) {
			return this.getKeys(aName, full);
		},
		getSet       : function getSet(aName, aMatch, aK, aV, aTimestamp)  {
			var tx = this.__ig.getIgnite().transactions().txStart();
			try {
				var ch = this.__ig.getIgnite().getCache(aName);
				var res = af.fromJavaMap(ch.get(af.toJavaMap(aK)));
				if ($stream([res]).anyMatch(aMatch)) {
					ch.put(af.toJavaMap(aK), af.toJavaMap(aV));
					tx.commit();
				} else {
					tx.rollback();
				}
				return res;
			} catch(e) {
				tx.rollback();
				throw e;
			}
			
		},
		set          : function(aName, ak, av, aTimestamp) {
			var ch = this.__ig.getIgnite().getCache(aName);
			return ch.put(af.toJavaMap(ak), af.toJavaMap(av));
		},
		setAll       : function(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp) {
			for(var i in anArrayOfMapData) {
				this.set(aName, ow.loadObj().filterKeys(anArrayOfKeys, anArrayOfMapData[i]), anArrayOfMapData[i], aTimestamp);
			}
		},
		unsetAll     : function(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp) {
			for(var i in anArrayOfMapData) {
				this.unset(aName, ow.loadObj().filterKeys(anArrayOfKeys, anArrayOfMapData[i]), anArrayOfMapData[i], aTimestamp);
			}
		},		
		get          : function(aName, aKey) {
			var ch = this.__ig.getIgnite().getCache(aName);
			return af.fromJavaMap(ch.get(af.toJavaMap(aKey)));
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
		unset        : function(aName, aKey) {
			var ch = this.__ig.getIgnite().getCache(aName);
			ch.remove(af.toJavaMap(aKey));
		}
	},
	// etcd implementation (etcd v2)
	//
	etcd: {
		__channels: {},
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
					arr.push($do( () => {
						var _o = this.__r(aName, c, "size");
						if (isDef(_o)) res.getAdd(_o);
					}));
				});
		
				$doWait($doAll(arr));
				return res.get();
			} else {
				var res;

				lst.forEach(c => {
					arr.push($do( () => {
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
				arr.push($do( () => {
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
				arr.push($do( () => this.__r(aName, c, "forEach", [ aFunction ]) ));
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
				arr.push($do( () => {
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
				arr.push($do( () => {
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
				arr.push($do( () => {
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
				arr.push($do( () => {
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
				arr.push($do( () => {
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
				lst.forEach(c => arr.push($do( () => this.__r(aName, c, "setAll", [ naKs, aVs, aTimestamp ]) )) );
	
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
					arr.push($do( () => {
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
				arr.push($do( () => {
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
 * options in a map.
 * </odoc>
 */
OpenWrap.ch.prototype.create = function(aName, shouldCompress, type, options) {
	if (Object.keys(this.channels).indexOf(aName) < 0) {
		plugin("Threads");
		type = (isDef(type)) ? type : "simple";

		this.__types[type].create(aName, shouldCompress, options);

		this.subscribers[aName] = {};
		this.peers[aName] = {};
		this.expose[aName] = [];
		this.jobs[aName] = {};
		this.channels[aName] = type;
		this.vers[aName] = nowUTC();
		ow.ch.lock[aName] = new java.util.concurrent.locks.ReentrantLock();
		ow.ch.lock2[aName] = new java.util.concurrent.locks.ReentrantLock();
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
	return Object.keys(this.channels);
};
	 
/**
 * <odoc>
 * <key>ow.ch.destroy(aName) : ow.ch</key>
 * Deletes all data and removes references to the channel aName.
 * </odoc>
 */
OpenWrap.ch.prototype.destroy = function(aName) {
//	switch(this.channels[aName]) {
//	case "ignite": { this.__types.ignite.destroy(aName); break; }
//	case "remote": { this.__types.remote.destroy(aName); break; }
//	default      : { this.__types.big.destroy(aName); }
//	}
	if (isDef(this.__types[this.channels[aName]])) {
		this.__types[this.channels[aName]].destroy(aName);
		
		delete this.channels[aName];
		delete this.subscribers[aName];
		delete this.peers[aName];
		delete this.expose[aName];
		delete this.jobs[aName];
		delete this.vers[aName];
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
				parent.jobs[aName][anId] = $do(function() {
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
				parent.jobs[aName][_i] = $do(f(_i)).catch((e) => { 
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
				parent.jobs[aName][_i] = $do(f(_i)).catch((e) => { 
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
				parent.jobs[aName][_i] = $do(f(_i)).catch((e) => { 
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
				parent.jobs[aName][_i] = $do(f(_i)).catch((e) => { 
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

	if (isDef(error)) throw e;

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
				parent.jobs[aName][_i] = $do(f(_i)).catch((e) => { 
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
			plugin("Threads");
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
			if (isDef(ow.ch.__types.buffer.__s[aName])) ow.ch.__types.buffer.__s[aName].stop();
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
	 *   | __ | def    | del target  | add source   |\
	 *   | def    | __ | add target  | del source   |\
	 *   | def    | def    | set target  | set source   |\
	 * \
	 * </odoc>
	 */
	syncCh: function(idxs, source, target, syncFn, logFn) {
		var sks = $ch(source).getAll();
		var tks = $ch(target).getAll();

		syncFn = _$(syncFn).isFunction().default(() => { return true; });
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
				if (syncFn(skis[ik], __)) {
					logFn("adding " + ik + " to target.");
					addToTarget.push(skis[ik]);
				} else {
					logFn("deleting " + ik + " from source.");
					delFromSource.push(skis[ik]);
				}
			} else {
				if (!(compare(skis[ik], tkis[ik]))) {
					if (syncFn(skis[ik], tkis[ik])) {
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
				if (syncFn(__, tkis[ik])) {
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
		}
	}
};

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
					ow.ch.comms.__counter[na] = 0; 
				}
			}, ow.ch.comms.__counter[na]);

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
					    (aRes.c != ow.ch.comms.__counter[na] || 
						 aRes.l != ow.ch.size(na) 
						 ) && 
						ow.ch.jobs[na].length < 1 &&
						ow.ch.size(na) > 0) {
						
						syncFn(function() { ow.ch.comms.__counter[na] = 0; }, ow.ch.comms.__counter[na]);
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
						if (ow.ch.comms.__counter[na] != 0)
							ow.ch.comms.__counter[na]++;
						else
							ow.ch.comms.__counter[na] = 1;
					}, ow.ch.comms.__counter[na]);
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
						if (ow.ch.comms.__counter[na] != 0)
							ow.ch.comms.__counter[na]++;
						else
							ow.ch.comms.__counter[na] = 1;
					}, ow.ch.comms.__counter[na]);
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
					syncFn(function() { ow.ch.comms.__counter[na]++; }, ow.ch.comms.__counter[na]);
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
					syncFn(function() { ow.ch.comms.__counter[na]++; }, ow.ch.comms.__counter[na]);
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
					if (res.r.length > 0) $do(() => { $ch(na).setAll(Object.keys(resk.r[0]), res.r); });
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
			var cc;
			syncFn(function() { 	
				if (isUnDef(ow.ch.server.__counter[aName])) {
					ow.ch.server.__counter[aName] = 0; cc = 0; 
				}
			}, ow.ch.server.__counter[aName]);

			if (isDef(k.o)) {
				switch(k.o) {
				case "a":
					//if (k.t < $ch(aName).getVersion()) return undefined;
					if (isArray(k.k) && isArray(v)) {
						syncFn(function() { cc = ++ow.ch.server.__counter[aName]; }, ow.ch.server.__counter);
						var rt = $ch(aName).setAll(k.k, v, k.t, aaUUID, aRequest);
						return { "c": cc, "r": rt };
					} 
					break;
				case "ua":
					//if (k.t < $ch(aName).getVersion()) return undefined;
					if (isArray(k.k) && isArray(v)) {
						syncFn(function() { cc = --ow.ch.server.__counter[aName]; }, ow.ch.server.__counter);
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

						syncFn(function() { ow.ch.server.__counter[aName] = 0; cc = 0; }, ow.ch.server.__counter);
						var rt = $ch(aName).setAll(k.k, v, k.t, aaUUID, aRequest);
						return { "c": cc, "r": rt };
					} 
					break;					
				case "e":		
					//if (k.t < $ch(aName).getVersion()) return undefined;
					syncFn(function() { cc = ++ow.ch.server.__counter[aName]; }, ow.ch.server.__counter);
					var rt = $ch(aName).set(k.k, v, k.t, aaUUID, aRequest);
					return { "c": cc, "r": rt };
				case "es":
					syncFn(function() { cc = ++ow.ch.server.__counter[aName]; }, ow.ch.server.__counter);
					var rt = $ch(aName).getSet(k.m, k.k, v, k.t, aaUUID, aRequest);
					return { "c": cc, "r": rt };
				}
			}
		}

		function restUnset(k) {	
			var cc;
			//if (k.t < $ch(aName).getVersion()) return undefined;

			syncFn(function() { 
				if (isUnDef(ow.ch.server.__counter[aName])) {
					ow.ch.server.__counter[aName] = 0; cc = 0; 
				}
			}, ow.ch.server.__counter);

			if (isDef(k.o)) {
				if (k.o == "e") {
					//if (k.t < $ch(aName).getVersion()) return undefined;
					syncFn(function() { cc = ++ow.ch.server.__counter[aName]; }, ow.ch.server.__counter);
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
