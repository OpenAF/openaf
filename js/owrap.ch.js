// OpenWrap v2
// Author: Nuno Aguiar
// Channels

OpenWrap.ch = function() {
	return ow.ch;
};

OpenWrap.ch.prototype.subscribers = {};
OpenWrap.ch.prototype.jobs = {};
OpenWrap.ch.prototype.vers = {}; 
OpenWrap.ch.prototype.channels = {};
OpenWrap.ch.prototype.type = {};

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
			this.__channels[aName].find(function(aKey) {
				aFunction(aKey, parent.get(aName, aKey));
				return aKey;
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
					sync(function() { keys.push(aKey); }, keys);
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
	db: {
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
			for(j in i) {
				aFunction(i[j], this.get(aName, i[j]));
			}
		},
		getKeys: function(aName, full) { 
			var i = $stream(this.__db[aName].q("select key from " + this.__table[aName]).results).map("KEY").toArray();
			var res = [];
			for(j in i) {
				res.push(JSON.parse(i[j]));
			}
			return res;
		},
		getSortedKeys: function(aName, full) {
			var i = $stream(this.__db[aName].q("select key from " + this.__table[aName] + " order by ts").results).map("KEY").toArray();
			var res = [];
			for(j in i) {
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
		},
		setAll: function(aName, aKs, aVs, aTimestamp) { 
			for(var i in aVs) {
				this.set(aName, ow.loadObj().filterKeys(aKs, aVs[i]), aVs[i], aTimestamp);
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
	//
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
		__cacheFunc: {},
		__cacheCh  : {},
		__cacheTTL : {},
		create       : function(aName, shouldCompress, options) { 
			this.__cacheFunc[aName] = (isDef(options.func) ? options.func : function() { return {}; });
			this.__cacheTTL[aName] = (isDef(options.ttl) ? options.ttl : 5000);
			if (isUnDef(options.ch)) {
				$ch(aName + "::__cache").create();
				this.__cacheCh[aName] = $ch(aName + "::__cache");
			} else {
				this.__cacheCh[aName] = options.ch;
			}
		},
		destroy      : function(aName) { 
			if (isDef(this.__cacheFunc[aName])) delete this.__cacheFunc[aName];
			if (isDef(this.__cacheCh[aName])) delete this.__cacheCh[aName];
			if (isDef(this.__cacheTTL[aName])) delete this.__cacheTTL[aName];
			$ch(aName + "::__cache").destroy();
		},
		size         : function(aName) { 
			return this.__cacheCh[aName].size();
		},
		forEach      : function(aName, aFunction, x) { 
			var aKs = this.getKeys(aName);
			for(var i in aKs) {
				aFunction(aKs[i], this.get(aName, aKs[i], x));
			}			
		},
		getKeys      : function(aName, full) { 
			return this.__cacheCh[aName].getKeys(full);
		},
		getSortedKeys: function(aName, full) { 
			return this.getKeys(aName, full).sort();
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
			this.__cacheCh[aName].set(aK, this.__cacheFunc[aName](aK), aTimestamp, x);
		},
		setAll       : function(aName, aKs, aVs, aTimestamp) { 
			var avvs = [];
			for (var i in aKs) {
				avvs[i] = this.__cacheFunc[aName](aK);
			}
			this.__cacheCh[aName].setAll(aKs, avvs, aTimestamp);
		},
		get          : function(aName, aK) { 
			var aVv = {};
			var ee = $stream(this.getKeys(aName, true)).filter({ "k": aK }).toArray()[0];
			if (isDef(ee)) {
				if (ee.t > (now() - this.__cacheTTL[aName])) {
					aVv = this.__cacheCh[aName].get(aK);
				} else {
					var aVv = this.__cacheFunc[aName](aK);
					this.__cacheCh[aName].set(aK, aVv);			
					aVv = this.__cacheCh[aName].get(aK);
				}
			} else {
				var aVv = this.__cacheFunc[aName](aK);
				this.__cacheCh[aName].set(aK, aVv);
				aVv = this.__cacheCh[aName].get(aK);
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
			this.__cacheCh[aName].unset(aK);
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
	// Remote channel implementation
	//
	remote: {
		__channels: {},
		create       : function(aName, shouldCompress, options) {
			ow.loadObj();
			this.__channels[aName] = options;
		},
		destroy      : function(aName) {
			delete this.__channels[aName];
		},
		size         : function(aName) {
			return this.getKeys(aName).length;
		},
		forEach      : function(aName, aFunction) {
			var aKs = this.getKeys(aName);
			for(var i in aKs) {
				aFunction(aKs[i], this.get(aName, aKs[i]));
			}
		},
		getAll      : function(aName, full) {
			return ow.obj.rest.jsonGet(this.__channels[aName].url, { "o": "a" }, this.__channels[aName].login, this.__channels[aName].password, this.__channels[aName].timeout).r;
		},
		getKeys      : function(aName, full) {
			return ow.obj.rest.jsonGet(this.__channels[aName].url, { "o": "k" }, this.__channels[aName].login, this.__channels[aName].password, this.__channels[aName].timeout).r;
		},
		getSortedKeys: function(aName, full) {
			return ow.obj.rest.jsonGet(this.__channels[aName].url, { "o": "s" }, this.__channels[aName].login, this.__channels[aName].password, this.__channels[aName].timeout).r;				
		},
		getSet       : function getSet(aName, aMatch, aK, aV, aTimestamp)  {
			return ow.obj.rest.jsonSet(this.__channels[aName].url, { "o": "es", "m": aMatch, "k": aK, "t": aTimestamp }, aV, this.__channels[aName].login, this.__channels[aName].password, this.__channels[aName].timeout).r;
		},
		set          : function(aName, aK, aV, aTimestamp) {
			return ow.obj.rest.jsonSet(this.__channels[aName].url, { "o": "e", "k": aK, "t": aTimestamp }, aV, this.__channels[aName].login, this.__channels[aName].password, this.__channels[aName].timeout).r;
		},
		setAll       : function(aName, aKs, aVs, aTimestamp) {
			return ow.obj.rest.jsonSet(this.__channels[aName].url, { "o": "a", "k": aKs, "t": aTimestamp }, aVs, this.__channels[aName].login, this.__channels[aName].password, this.__channels[aName].timeout).r;		
		},
		get          : function(aName, aK) {
			return ow.obj.rest.jsonGet(this.__channels[aName].url, { "o": "e", "k": aK }, this.__channels[aName].login, this.__channels[aName].password, this.__channels[aName].timeout).r;
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
			return ow.obj.rest.jsonRemove(this.__channels[aName].url, { "o": "e", "k": aK, "t": aTimestamp }, this.__channels[aName].login, this.__channels[aName].password, this.__channels[aName].timeout);
		}
	},
	/**
	 * <odoc>
	 * <key>ow.ch.types.elasticsearch</key>
	 * This OpenAF implementation connects to an ElasticSearch (ES) server/cluster. The creation options are:\
	 * \
	 *    - index (String/Function) The ES index to use or a function to return the name (see also ow.ch.utils.getElasticIndex).\
	 *    - idKey (String) The ES key id field. Defaults to '_id'.\
	 *    - url (String) The HTTP(S) URL to access the ES server/cluster.\
	 *    - user (String) Optionally provide a user name to access the ES server/cluster.\
	 *    - pass (String) Optionally provide a password to access the ES server/cluster (encrypted or not).\
	 * \
	 * The getAll/getKeys functions accept an extra argument to provide a ES query map to restrict the results.
	 * </odoc>
	 */
	elasticsearch: {
		__channels: {},
		create       : function(aName, shouldCompress, options) {
			ow.loadObj();
			if (isUnDef(options.index)) throw "Please define an elastic search index to use";
			if (isUnDef(options.idKey)) options.idKey = "_id";
			if (isUnDef(options.url))   throw "Please define the elastic search url";
			/*if (isUnDef(options.user) || isUnDef(options.pass))  
				throw "Please define an user and pass to access the elastic search";*/
			this.__channels[aName] = options;
			
			if (isFunction(options.index)) {
				this.__channels[aName].fnIndex = options.index;
			} else {
				this.__channels[aName].fnIndex = function() {
					return options.index;
				}
			}
		},
		destroy      : function(aName) {
			delete this.__channels[aName];
		},
		size         : function(aName) {
			var url = this.__channels[aName].url + "/" + this.__channels[aName].fnIndex();
			url += "/_count";
			var parent = this;
			
			var res = ow.obj.rest.jsonGet(url, {}, function(h) { 
				if (isDef(parent.__channels[aName].user))
					h.login(parent.__channels[aName].user, parent.__channels[aName].pass, true);
			});
			if (isDef(res) && isDef(res.count)) {
				return res.count
			} else {
				return undefined
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
			
			if (isDef(full) && isObject(full)) { ops = full; } 
				
			var parent = this;
			var res = ow.obj.rest.jsonCreate(url, {}, ops, function(h) { 
				if (isDef(parent.__channels[aName].user))
					h.login(parent.__channels[aName].user, parent.__channels[aName].pass, true);
			});
			if (isDef(res) && isDef(res.hits) && isDef(res.hits.hits)) {
				return $stream(res.hits.hits).map(function(r) {
					r._source._id = r._id;
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
			
			if (isDef(full) && isObject(full)) { ops = full; } 
				
			var parent = this;
			var res = ow.obj.rest.jsonCreate(url, {}, merge(ops, { _source: false }), function(h) { 
				if (isDef(parent.__channels[aName].user))
					h.login(parent.__channels[aName].user, parent.__channels[aName].pass, true);
			});
			if (isDef(res) && isDef(res.hits) & isDef(res.hits.hits)) {
				return $stream(res.hits.hits).map("_id").toArray();
			} else {
				return undefined
			}	
		},
		getSortedKeys: function(aName, full) {
			return this.getKeys(aName, full);	
		},
		getSet       : function getSet(aName, aMatch, aK, aV, aTimestamp)  {
			throw "Channel operation not supported in Elastic Search";
		},
		set          : function(aName, aK, aV, aTimestamp) {
			var url = this.__channels[aName].url + "/" + this.__channels[aName].fnIndex(aK);
			url += "/" + this.__channels[aName].idKey;
			
			if (isDef(aK) && isObject(aK) && isDef(aK[this.__channels[aName].idKey])) { 
				url += "/" + aK[this.__channels[aName].idKey];
			} else {
				if (isDef(aK.key)) url += "/" + aK.key;
			}
				
			var parent = this;
			var res = ow.obj.rest.jsonSet(url, {}, aV, function(h) { 
				if (isDef(parent.__channels[aName].user))
					h.login(parent.__channels[aName].user, parent.__channels[aName].pass, true);
			});
			return res;		
		},
		setAll       : function(aName, aKs, aVs, aTimestamp) {
			var url = this.__channels[aName].url;
			url += "/_bulk";
			var ops = "";
			
			for(var i in aVs) {
				ops += stringify({ index: {
					_index: this.__channels[aName].fnIndex(aKs[i]), 
					_type : this.__channels[aName].idKey,
					_id   : aVs[i][this.__channels[aName].idKey] 
				}}, undefined, "") + "\n" + 
				stringify(aVs[i], undefined, "") + "\n";
			}
			
			plugin("HTTP");
			var h = new HTTP();
			if (isDef(this.__channels[aName].user))
				h.login(this.__channels[aName].user, this.__channels[aName].pass, true);
			try {
				return h.exec(url, "POST", ops, {"Content-Type":"application/x-www-form-urlencoded"});
			} catch(e) {
				e.message = "Exception " + e.message + "; error = " + String(h.getErrorResponse());
				throw e;
			}		
		},
		get          : function(aName, aK) {
			var url = this.__channels[aName].url + "/" + this.__channels[aName].fnIndex(aK);
			url += "/" + this.__channels[aName].idKey;
			
			if (isDef(aK) && isObject(aK) && isDef(aK[this.__channels[aName].idKey])) { 
				url += "/" + aK[this.__channels[aName].idKey];
			} else {
				if (isDef(aK.key)) url += "/" + aK.key;
			}
				
			var parent = this;
			var res = ow.obj.rest.jsonGet(url, {}, function(h) { 
				if (isDef(parent.__channels[aName].user))
					h.login(parent.__channels[aName].user, parent.__channels[aName].pass, true);
			});
			
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
			url += "/" + this.__channels[aName].idKey;
			
			if (isDef(aK) && isObject(aK) && isDef(aK[this.__channels[aName].idKey])) { 
				url += "/" + aK[this.__channels[aName].idKey];
			} else {
				if (isDef(aK.key)) url += "/" + aK.key;
			}
				
			var parent = this;
			var res = ow.obj.rest.jsonRemove(url, {}, function(h) { 
				if (isDef(parent.__channels[aName].user))
					h.login(parent.__channels[aName].user, parent.__channels[aName].pass, true);
			});
			return res;	
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
	 * The map will be created if it doesn't exist.\
	 * </odoc>
	 */
	mvs: {
		create       : function(aName, shouldCompress, options) {
			if (isUnDef(options)) options = {};
			if (isUnDef(options.file)) options.file = undefined;

			if (isUnDef(this.__s)) this.__s = {};
			if (isUnDef(this.__f)) this.__f = {};
			if (isUnDef(this.__m)) this.__m = {};

			var existing = false, absFile;
			if (isDef(options.file)) {
				absFile = String((new java.io.File(options.file)).getAbsoluteFile());
			} else {
				absFile = "memory";
			}
			if (isUnDef(this.__f[absFile])) {
				this.__s[aName] = Packages.org.h2.mvstore.MVStore.Builder();
				if (absFile != "memory") this.__s[aName] = this.__s[aName].fileName(absFile);
				if (shouldCompress) this.__s[aName] = this.__s[aName].compress();
				this.__s[aName] = this.__s[aName].open();

				this.__f[absFile] = this.__s[aName];
			} else {
				existing = true;
				this.__s[aName] = this.__f[absFile];
			}

			if (isUnDef(options.map)) {
				options.map = function() { return "default"; };
			} else {
				if (isString(options.map)) {
					options.map = new Function("return '" + options.map + "';");
				}
			}

			this.__m[aName] = options.map;

			if (isDef(options.compact) && options.compact) {
				this.__s[aName].compactMoveChuncks();
			}
		},
		destroy      : function(aName) {
			if (isDef(options.compact) && options.compact) {
				this.__s[aName].compactMoveChuncks();
			}			
			this.__s[aName].close();
		},
		size         : function(aName) {
			var map = this.__s[aName].openMap(this.__m[aName]());
			return map.sizeAsLong();
		},
		forEach      : function(aName, aFunction, x) {
			var aKs = this.getKeys(aName, x);

			for(let i in aKs) {
				aFunction(aKs[i], this.get(aName, aKs[i], x));
			}
		},
		getKeys      : function(aName, full) {
			var res = [];
			var map = this.__s[aName].openMap(this.__m[aName](full));

			for(let i = 0; i < this.size(aName); i++) {
				res.push(jsonParse(map.getKey(i)));
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

			map.put(stringify(ak), stringify(av));
			this.__s[aName].commit();
		},
		setAll       : function(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp) {
			for(let i in anArrayOfMapData) {
				this.set(aName, ow.loadObj().filterKeys(anArrayOfKeys, anArrayOfMapData[i]), anArrayOfMapData[i], aTimestamp);
			}
		},
		get          : function(aName, aKey) {
			var map = this.__s[aName].openMap(this.__m[aName](aKey));

			return jsonParse(map.get(stringify(aKey)));
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

			return jsonParse(map.remove(stringify(aKey)));
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
			plugin("Ignite");
			if (isUnDef(options) || isUnDef(options.ignite)) this.__ig = new Ignite(); else this.__ig = options.ignite;
			if (isUnDef(options) || isUnDef(options.gridName)) this.__ig.start(); else this.__ig.start(options.gridName);
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
			for(let o in keys) {
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
		type = (isDef(type)) ? type : "big";

		this.__types[type].create(aName, shouldCompress, options);

		this.subscribers[aName] = {};
		this.jobs[aName] = [];
		this.channels[aName] = type;
		this.vers[aName] = nowUTC();
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
 * this jobs to finish provide the channel aName and, optionally, aTimeout (defaults to 2.5 seconds). 
 * </odoc>
 */
OpenWrap.ch.prototype.waitForJobs = function(aName, aTimeout) {
	if (isUnDef(aTimeout)) aTimeout = 2500;
	while(this.jobs[aName].length > 0) {
		for(var i in ow.ch.jobs[aName]) {
			if (ow.ch.jobs[aName][i] != null)
				ow.ch.jobs[aName][i].waitForThreads(aTimeout);
		}
	}
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
		ow.ch.jobs[aName][i].stop();
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
	if (isUnDef(this.channels[aName])) throw "Channel " + aName + " doesn't exist.";
//	switch(this.channels[aName]) {
//	case "ignite": { return this.__types.ignite.size(aName); break; }
//	case "remote": { return this.__types.remote.size(aName); break; }
//	default      : { return this.__types.big.size(aName); }
//	}
	return this.__types[this.channels[aName]].size(aName);
};
	
/**
 * <odoc>
 * <key>ow.ch.subscribe(aName, aFunction, onlyFromNowm, anId) : String</key>
 * Adds a callback function to the channel aName. The callback function will receive, as arguments:
 * the channel name, the operation, a key or an array of keys (for operation = setall), a value or an array 
 * of values (for operation = setall) and the ow.ch object. Returns the subscriber id.
 * Optionally you can specify that existing
 * elements won't trigger operation = set callback calls and/or a custom subscriber anId.\
 * \
 * Possible operations:\
 *    - set\
 *    - setall\
 *    - unset\
 * \
 * </odoc>
 */
OpenWrap.ch.prototype.subscribe = function(aName, aFunction, onlyFromNow, anId) {
	if (isUnDef(this.channels[aName])) throw "Channel " + aName + " doesn't exist.";
	if (isUnDef(anId)) anId = genUUID();
	//if (isUnDef(anId)) anId = md5(aFunction.toString());
	
	if (isDef(this.subscribers[aName][anId])) return anId;
	
	this.subscribers[aName][anId] = aFunction;
	if (this.size(aName) > 0 && !onlyFromNow) {
		var t = new Threads();
		var ig = new Threads();
		var parent = this;

		var func = function(aKey) {
			var aValue = parent.get(aName, aKey);
			t.addThread(function(uuid) {
				aFunction(aName, "set", aKey, aValue, parent, uuid);
				return uuid;
			})
		};
		
//		switch(parent.channels[aName]) {
//		case "ignite": { res = parent.__types.ignite.forEach(aName, func); break; }
//		case "remote": { res = parent.__types.remote.forEach(aName, func); break; }
//		default      : { res = parent.__types.big.forEach(aName, func); }
//		}
		res = parent.__types[parent.channels[aName]].forEach(aName, func);

		ig.addThread(function() {
			//sync(function() {
			var tt;
			while(parent.jobs[aName].length > 0) {
				tt = parent.jobs[aName].shift();
				tt.start();
				tt.stop();
			}
			ig.waitForThreads();
			ig.stop();
			return 1;
		});
		
		//sync(function() {
			parent.jobs[aName].push(t);
		//}, parent.jobs[aName]);
		
		
		ig.startNoWait();
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

	delete this.subscribers[aName][aId];
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
	return this;
};
	
/**
 * <odoc>
 * <key>ow.ch.forEach(aName, aFunction) : ow.ch</key>
 * Will execute the provided aFunction with each key and value for the channel identified by the aName provided.
 * </odoc>
 */
OpenWrap.ch.prototype.forEach = function(aName, aFunction, x) {
	if (isUnDef(this.channels[aName])) throw "Channel " + aName + " doesn't exist.";

	this.__types[this.channels[aName]].forEach(aName, aFunction, x);

	return this;
};
	
/**
 * <odoc>
 * <key>ow.ch.getAll(aName, fullInfo) : Array</key>
 * Will return all values for the channel identified by the aName provided.
 * </odoc>
 */
OpenWrap.ch.prototype.getAll = function(aName, x) {
	if (isUnDef(this.channels[aName])) throw "Channel " + aName + " doesn't exist.";	

	var res = [];
	var parent = this;
	
	if (isDef(this.__types[this.channels[aName]].getAll)) {
		sync(function() {
			res = res.concat(parent.__types[parent.channels[aName]].getAll(aName, x));
		}, x);
	} else {
		this.forEach(aName, function(aKey, aValue) {
			sync(function() { res.push(aValue); }, res);
		}, x);
	}

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
	if (isUnDef(this.channels[aName])) throw "Channel " + aName + " doesn't exist.";
	
	return this.__types[this.channels[aName]].getKeys(aName, full, x);
};
	
/**
 * <odoc>
 * <key>ow.ch.getSortedKeys(aName, full) : Array</key>
 * Returns all keys in the form of an array for the channel identified by the aName provided by order of the last
 * modification. Optionally you can specify full = yes to obtain the detailed internal key index.
 * </odoc>
 */
OpenWrap.ch.prototype.getSortedKeys = function(aName, full, x) {
	if (isUnDef(this.channels[aName])) throw "Channel " + aName + " doesn't exist.";
	
//	switch(this.channels[aName]) {
//	case "ignite": { return this.__types.ignite.getSortedKeys(aName, full); break; }
//	case "remote": { return this.__types.remote.getSortedKeys(aName, full); break; }
//	default      : { return this.__types.big.getSortedKeys(aName, full); }
//	}
	return this.__types[this.channels[aName]].getSortedKeys(aName, full, x);
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
	var res;

	sync(function() {
//		switch(parent.channels[aName]) {
//		case "ignite": { parent.__types.ignite.set(aName, ak, av, aTimestamp); break; }
//		case "remote": { parent.__types.remote.set(aName, ak, av, aTimestamp); break; }
//		default      : { parent.__types.big.set(aName, ak, av, aTimestamp); }
//		}
		res = parent.__types[parent.channels[aName]].set(aName, ak, av, aTimestamp, x); 
		parent.vers[aName] = nowUTC();
	}, this.channels[aName]);

	if (Object.keys(this.subscribers[aName]).length > 0) {
		var t = new Threads();
		var ig = new Threads();
		var fns = {};
		for(var _i in this.subscribers[aName]) {
			var uid = t.addThread(function(uuid) {
				fns[uuid](aName, "set", aKey, aValue, parent, aTimestamp, aUUID, x);
				return uuid;
			});
			
			fns[uid] = parent.subscribers[aName][_i];
		};
		ig.addThread(function() {
			var tt;
			while(parent.jobs[aName].length > 0) {
				tt = parent.jobs[aName].shift();
				tt.start();
				tt.stop();
			}
			ig.stop();		
			return 1;
		})			
		parent.jobs[aName].push(t);
		ig.startNoWait();
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
	var res;
	
	sync(function() {
//		switch(parent.channels[aName]) {
//		case "ignite": { parent.__types.ignite.setAll(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp); break; }
//		case "remote": { parent.__types.remote.setAll(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp); break; }
//		default      : { parent.__types.big.setAll(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp); }
//		}
		res = parent.__types[parent.channels[aName]].setAll(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp, x);
		parent.vers[aName] = nowUTC();
	}, this.channels[aName]);

	if (Object.keys(this.subscribers[aName]).length > 0) {
		var t = new Threads();
		var ig = new Threads();
		var fns = {};
		for(var _i in this.subscribers[aName]) {
			var uid = t.addThread(function(uuid) {
				fns[uuid](aName, "setall", anArrayOfKeys, anArrayOfMapData, parent, aTimestamp, aUUID, x);
				return uuid;
			});
			
			fns[uid] = parent.subscribers[aName][_i];
		};
		ig.addThread(function() {
			var tt;
			while(parent.jobs[aName].length > 0) {
				tt = parent.jobs[aName].shift();
				tt.start();
				tt.stop();
			}
			ig.stop();
			return 1;
		});
		
		parent.jobs[aName].push(t);
		
		ig.startNoWait();
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

	var res;
	var parent = this;
	sync(function() {
//		switch(parent.channels[aName]) {
//		case "ignite": { res = parent.__types.ignite.get(aName, aKey); break; }
//		case "remote": { res = parent.__types.remote.get(aName, aKey); break; }
//		default      : { res = parent.__types.big.get(aName, aKey); }
//		}
		res = parent.__types[parent.channels[aName]].get(aName, aKey, x);
	}, this.channels[aName]);
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

	var res, out;
	if (this.size(aName) > 0) {
//		switch(this.channels[aName]) {
//		case "ignite": { res = this.__types.ignite.pop(aName); break; }
//		case "remote": { res = this.__types.remote.pop(aName); break; }
//		default      : { res = this.__types.big.pop(aName); break; }
//		}
		res = this.__types[this.channels[aName]].pop(aName);
		out = this.get(aName, res);
		this.unset(aName, res);
	}
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
	
	var res, out;
	var parent = this;
	sync(function() {
		res = parent.__types[parent.channels[aName]].getSet(aName, aMatch, aKey, aValue, aTimestamp, x); 
		parent.vers[aName] = nowUTC();
	}, this.channels[aName]);
	
	if (Object.keys(this.subscribers[aName]).length > 0) {
		var t = new Threads();
		var ig = new Threads();
		var fns = {};
		for(var _i in this.subscribers[aName]) {
			var uid = t.addThread(function(uuid) {
				fns[uuid](aName, "set", aKey, aValue, parent, aTimestamp, aUUID, x);
				return uuid;
			});
			
			fns[uid] = parent.subscribers[aName][_i];
		};
		ig.addThread(function() {
			var tt;
			while(parent.jobs[aName].length > 0) {
				tt = parent.jobs[aName].shift();
				tt.start();
				tt.stop();
			}
			ig.stop();		
			return 1;
		})			
		parent.jobs[aName].push(t);
		ig.startNoWait();
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

	var res, out;
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

	var parent = this;
	sync(function() {
//		switch(parent.channels[aName]) {
//		case "ignite": { res = parent.__types.ignite.unset(aName, ak); break; }
//		case "remote": { res = parent.__types.remote.unset(aName, ak); break; }
//		default      : { res = parent.__types.big.unset(aName, ak); break; }
//		}			
		res = parent.__types[parent.channels[aName]].unset(aName, ak, x);
		parent.vers[aName] = nowUTC();
	}, this.channels[aName]);

	if (Object.keys(this.subscribers[aName]).length > 0) {
		var t = new Threads();
		var ig = new Threads();
		var fns = {};
		for(var _i in this.subscribers[aName]) {
			var uid = t.addThread(function(uuid) {
				fns[uuid](aName, "unset", aKey, undefined, parent, aTimestamp, aUUID, x);
				return uuid;
 			});
			
			fns[uid] = parent.subscribers[aName][_i];
		};
		ig.addThread(function() {
			var tt;
			while(parent.jobs[aName].length > 0) {
				tt = parent.jobs[aName].shift();
				tt.start();
				tt.stop();
			}
			ig.stop();
			return 1;
		});
		
		parent.jobs[aName].push(t);
		
		ig.startNoWait();
	}	
	return this;
};
	
OpenWrap.ch.prototype.utils = {
    /**
     * <odoc>
     * <key>ow.ch.utils.getMirrorSubscriber(aTargetCh, aFunc) : Function</key>
     * Returns a channel subscriber function that will mirror any changes to aTargetCh if aFunc returns true when invoked
     * with the key being changed.
     * </odoc>
     */
	getMirrorSubscriber: function(aTargetCh, aFunc) {
		return function(aC, aO, aK, aV) {
			if (isUnDef(aFunc)) aFunc = function() { return true; };
			switch(aO) {
			case "set": 
				if (aFunc(aK)) $ch(aTargetCh).set(aK, aV);
				break;
			case "setall": 
				//for (var k in aK) {
				//	if (aFunc(aK[k])) $ch(aTargetCh).set(aK[k], aV[k]);
				//}
				var sV = [];
				for (var v in aV) {
					if(aFunc(aV[v])) sV.push(aV[v]);
				}
				$ch(aTargetCh).setAll(aK, sV);
				break;
			case "unset": 
				if (aFunc(aK)) $ch(aTargetCh).unset(aK);
				break;
			}		
		}
	},
	/**
	 * <odoc>
	 * <key>ow.ch.utils.getLogStashSubscriber(aTargetCh, aType, aHost, aErrorFunc, shouldHK) : Function</key>
	 * Returns a channel subscriber function that will transform changes to a log channel (see startLog and the __log channel)
	 * and will replicate them in aTargetCh (this means expecting the value to have a 'd': date; 'm': message and 't' as the level/type).
	 * The value set on aTargetCh will follow the LogStash format setting type to aType and host to aHost. The id and key will be set 
	 * to a sha1 hash of the stringify version of the value being set. In case of error aErrorFunc will be invoked providing the exception
	 * as an argument. You can also indicate if you want to house keep the original channel to save the script's memory.
	 * </odoc>
	 */
	getLogStashSubscriber: function(aTargetCh, aType, aHost, aErrorFunc, shouldHK) {
		return function(aC, aO, aK, aV) {
			try {
				if (aO == "set") {
					var _id = sha1(stringify(aV));
					$ch(aTargetCh).set({
						id: _id
					}, {
						"@version"  : 1,
						"@timestamp": aV.d,
						"message"   : aV.m,
						"type"      : aType,
						"host"      : aHost,
						"level"     : aV.t,
						"id"        : _id
					});
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
	 * If the number of keys is bigger than maxNumberOfKeys than it will perform a channel shift operation (that will, depending on the
	 * type of channel, remove the oldest element).
	 * </odoc>
	 */
	getHousekeepSubscriber: function(aTargetCh, numberOfKeys) {
		if (isUnDef(numberOfKeys)) numberOfKeys = 100;
		return function(aC, aO, aK, aV) {
			sync(function() {
				while ($ch(aTargetCh).size() > numberOfKeys) {
					$ch(aTargetCh).shift();
				}
			}, this);
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

			af.mkdir(aBackupFolder);

			// Search files for compression
			if (!dontCompress) {
				$from(listFilesFolder)
					.notEquals("filename", donttouch)
					.notEnds("filename", ".gz")
					.match("filename", new RegExp(aRegExPattern))
					.select(function (r) {
						ioStreamCopy(io.writeFileGzipStream(aBackupFolder + "/" + r.filename + ".gz"),
							io.readFileStream(r.filepath));
						af.rm(r.filepath);
					});
			}

			// Delete files from backup folder
			if (isDef(howLongAgoInMinutes)) {
				$from(io.listFiles(aBackupFolder).files)
					.notEquals("filename", donttouch)
					.match("filename", new RegExp(aRegExPattern + "\\.gz$"))
					.less("createTime", new Date() - (howLongAgoInMinutes * 60 * 1000))
					.select(function (r) {
						af.rm(r.filepath);
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
		if (isUnDef(aLineTemplate))     aLineTemplate   = "{{timedate}} | {{type}} | {{message}}\n";
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

		startLog(ow.ch.utils.getLogFilePerDate(aConfigMap.logFolder, aConfigMap.filenameTemplate, aConfigMap.fileDateFormat, aConfigMap.lineTemplate, aConfigMap.lineDateFormat));
		getChLog().subscribe(ow.ch.utils.getFileHousekeepSubscriber(aConfigMap.logFolder, aConfigMap.HKRegExPattern, aConfigMap.HKhowLongAgoInMinutes, aConfigMap.dontCompress, aConfigMap.backupFolder));
		getChLog().subscribe(ow.ch.utils.getHousekeepSubscriber(getChLog(), aConfigMap.numberOfEntriesToKeep));
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
	}
};

OpenWrap.ch.prototype.comms = {
	__counter: {},
	
	/**
	 * <odoc>
	 * <key>ow.ch.comms.getSubscriberFunc(aURL, aUUID, aLogin, aPassword, aTimeout)</key>
	 * Returns a function to be used with ow.ch.subscribe for REST communication to the provided aURL intended
	 * to be used with ow.ch.server.*. Optionally aUUID can be provided to ignore subscriber request using it.
	 * Optionally you can provide aLogin, aPassword and/or a aTimeout (in ms). 
	 * </odoc>
	 */
	getSubscribeFunc: function(aURL, aUUID, aL, aP, aT) {
		return  function(na, op, k, v, al, t, sUUID) {
			if (isUnDef(sUUID)) sUUID = genUUID();
			if (sUUID == aUUID) return;
			
			$ch("__comm::" + na).create();
			sync(function() { 
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
						
						sync(function() { ow.ch.comms.__counter[na] = 0; }, ow.ch.comms.__counter[na]);
						sync(function() {
							ow.obj.rest.set(aURL, { "o": "r", "k": Object.keys(ow.ch.getKeys(na)[0]), "t": t }, ow.ch.getAll(na), aL, aP, aT);
						}, aURL);
					}
				}

				var ak = k, av = v;
				if (typeof k != "object") ak = { "key": k };
				if (typeof v != "object") av = { "key": k, "value": v };
				switch(op) {
				case "setall": 
					sync(function() { 
						if (ow.ch.comms.__counter[na] != 0)
							ow.ch.comms.__counter[na]++;
						else
							ow.ch.comms.__counter[na] = 1;
					}, ow.ch.comms.__counter[na]);
					var res;
					sync(function() {
						res = ow.obj.rest.jsonSet(aURL, { "o": "a", "k": k, "t": t }, v, aL, aP, aT); 
						shouldReset(res);
					}, aURL);
					break;
				case "set"   : 
					sync(function() { ow.ch.comms.__counter[na]++; }, ow.ch.comms.__counter[na]);
					var res;
					sync(function() {
						res = ow.obj.rest.jsonSet(aURL, { "o": "e", "k": ak, "t": t }, av, aL, aP, aT);
						shouldReset(res);
					}, aURL);
					break;
				case "unset" : 
					sync(function() { ow.ch.comms.__counter[na]++; }, ow.ch.comms.__counter[na]);
					var res;
					sync(function() {
						res = ow.obj.rest.jsonRemove(aURL, { "o": "e", "k": ak, "t": t }, aL, aP, aT); 
						shouldReset(res);
					}, aURL);
					break;				
				default      : 
					var res;
				    sync(function() {
				    	res = ow.obj.rest.jsonGet(aURL, { "o": "e", "k": ak }, aL, aP, aT);
						shouldReset(res);
				    }, aURL);
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
	 * <key>ow.ch.persistence.create(aChannel, aFilename, anArrayOfKeys, shouldCompress)</key>
	 * Adds a channel identified by the name aChannel, trying to restore data from aFilename given anArrayOfKeys
	 * (strings representing the key fields). Optionally indicating if keys should be compressed in memory with
	 * shouldCompress = true.
	 * </odoc>
	 */
	create: function(aChannel, aFilename, anArrayOfKeys, shouldCompress) {			
		ow.ch.create(aChannel, shouldCompress);
		ow.ch.persistence.restore(aChannel, aFilename, anArrayOfKeys); 
		ow.ch.subscribe(aChannel, ow.ch.persistence.getSubscribeFunc(aFilename));
		
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
		var hs;
		var uuid = genUUID();
		ow.loadServer();

		//noCheck = (isUnDef(noCheck)) ? false : noCheck;

		if (!noCheck) {
			if (isUnDef(ow.ch.size(aName))) throw "Channel " + aName + " doesn't exist.";
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

		if (isUnDef(aPath)) aPath = "/" + aName;

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

		return uuid;
	},

	/**
	 * <odoc>
	 * <key>ow.ch.server.peer(aName, aLocalPortORServer, aPath, aRemoteURLArray, aAuthFunc, aUnAuthFunc)</key>
	 * Exposes aName channel in the same way as ow.ch.server.expose but it also add a subscribe function to 
	 * the aName channel to remotely peer with other expose channel(s) given aRemoteURLArray. Optionally
	 * you can also provide aAuthFunc(user, pass) and aUnAuthFunc(aServer, aRequest) functions using ow.server.httpd.authBasic.
	 * The aAuthFunc can add aRequest.channelPermission to enforce read and/or write permissions on a channel (e.g. "r", "rw").\
	 * \
	 * Example:\
	 * \
	 * ow.ch.server.peer("__log", 8090, [ "http://server1.local:8090/log", "https://l:p@server2.local:8090/log" ]);\
	 * \
	 * </odoc>
	 */
	peer: function(aName, aLocalPortORServer, aPath, aRemoteURLArray, aAuthFunc, aUnAuthFunc) {
		var uuid = ow.ch.server.expose(aName, aLocalPortORServer, aPath, aAuthFunc, aUnAuthFunc);
		var res = [];

		if (isArray(aRemoteURLArray)) {
			for(let i in aRemoteURLArray) {
				res.push(ow.ch.subscribe(aName, ow.ch.comms.getSubscribeFunc(aRemoteURLArray[i], uuid)));
			}
		} else {
			res.push(ow.ch.subscribe(aName, ow.ch.comms.getSubscribeFunc(aRemoteURLArray, uuid)));
		}

		return res;
	},

	/**
	 * <odoc>
	 * <key>ow.ch.server.routeProcessing(aURI, aRequest, aName) : HTTPServerReply</key>
	 * Creates a server route processing for a ow.ch.comms client provided aURI, a HTTPServer aRequest and the 
	 * aName of a channel (please note that you should create the channel prior to using this function).
	 * Depending on aRequest.channelPermission some operations may not execute:\
	 * \
	 * - "r" - allows channel get/getAll operations\
	 * - "w" - allows channel set/setAll/getSet/unset operations\
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
			sync(function() { 	
				if (isUnDef(ow.ch.server.__counter[aName])) {
					ow.ch.server.__counter[aName] = 0; cc = 0; 
				}
			}, ow.ch.server.__counter[aName]);

			if (isDef(k.o)) {
				switch(k.o) {
				case "a":
					//if (k.t < $ch(aName).getVersion()) return undefined;
					if (isArray(k.k) && isArray(v)) {
						sync(function() { cc = ++ow.ch.server.__counter[aName]; }, ow.ch.server.__counter);
						var rt = $ch(aName).setAll(k.k, v, k.t, aaUUID, aRequest);
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

						sync(function() { ow.ch.server.__counter[aName] = 0; cc = 0; }, ow.ch.server.__counter);
						var rt = $ch(aName).setAll(k.k, v, k.t, aaUUID, aRequest);
						return { "c": cc, "r": rt };
					} 
					break;					
				case "e":		
					//if (k.t < $ch(aName).getVersion()) return undefined;
					sync(function() { cc = ++ow.ch.server.__counter[aName]; }, ow.ch.server.__counter);
					var rt = $ch(aName).set(k.k, v, k.t, aaUUID, aRequest);
					return { "c": cc, "r": rt };
				case "es":
					sync(function() { cc = ++ow.ch.server.__counter[aName]; }, ow.ch.server.__counter);
					var rt = $ch(aName).getSet(k.m, k.k, v, k.t, aaUUID, aRequest);
					return { "c": cc, "r": rt };
				}
			}
		}

		function restUnset(k) {	
			var cc;
			//if (k.t < $ch(aName).getVersion()) return undefined;

			sync(function() { 
				if (isUnDef(ow.ch.server.__counter[aName])) {
					ow.ch.server.__counter[aName] = 0; cc = 0; 
				}
			}, ow.ch.server.__counter);

			if (isDef(k.o)) {
				if (k.o == "e") {
					//if (k.t < $ch(aName).getVersion()) return undefined;
					sync(function() { cc = ++ow.ch.server.__counter[aName]; }, ow.ch.server.__counter);
					var rt = $ch(aName).unset(k.k, k.t, aaUUID, aRequest);
					return { "c": cc, "r": rt };
				}
			}
		}

		function restGet(k) {
			if (isDef(k.o)) {
				switch(k.o) {
				case "a":
					return { "r": $ch(aName).getAll(aRequest), "c": ow.ch.server.__counter[aName] };
				case "e":
					return { "r": $ch(aName).get(k.k, aRequest), "c": ow.ch.server.__counter[aName] };
				case "k":
					return { "r": $ch(aName).getKeys(false, aRequest), "c": ow.ch.server.__counter[aName] };
				case "s":
					return { "r": $ch(aName).getSortedKeys(false, aRequest), "c": ow.ch.server.__counter[aName] };
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
