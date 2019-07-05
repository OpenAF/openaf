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
