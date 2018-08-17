// OpenWrap v2
// Author: Nuno Aguiar
// Obj
// 

OpenWrap.obj = function() {
	return ow.obj;
}

/**
 * <odoc>
 * <key>ow.obj.fromDBRS2Obj(aDBRS, doDates) : Map</key>
 * Converts a Java database result set object (retrieved with DB.qsRS) into a map where the key is the name
 * of the field in upper case. Optionally doDates will convert any SQL dates into javascript Date objects.
 * </odoc>
 */
OpenWrap.obj.prototype.fromDBRS2Obj = function (aDBRS, doDates) {
	var res = {};

	for(var i = 1; i <= aDBRS.getMetaData().getColumnCount(); i++) {
		if (aDBRS.getObject(i) != null) {
			switch(aDBRS.getMetaData().getColumnType(i)) {
			case java.sql.Types.NUMERIC: 
			case java.sql.Types.DOUBLE:
			case java.sql.Types.FLOAT:
			case java.sql.Types.DECIMAL: res[aDBRS.getMetaData().getColumnName(i)] = Number(aDBRS.getDouble(i)); break;
			case java.sql.Types.CLOB: res[aDBRS.getMetaData().getColumnName(i)] = Packages.org.apache.commons.io.IOUtils.copy(aDBRS.getClob(i).getAsciiStream()); break;
			case java.sql.Types.BINARY:
			case java.sql.Types.BLOB: res[aDBRS.getMetaData().getColumnName(i)] = Packages.org.apache.commons.io.IOUtils.toByteArray(aDBRS.getBlob(i).getBinaryStream()); break;
			case java.sql.Types.TIMESTAMP: if (doDates) { res[aDBRS.getMetaData().getColumnName(i)] = new Date(aDBRS.getTimestamp(i).getTime()); break; }
			case java.sql.Types.DATE: if (doDates) { res[aDBRS.getMetaData().getColumnName(i)] = new Date(aDBRS.getDate(i).getTime()); break; }
			default: res[aDBRS.getMetaData().getColumnName(i)] = String(aDBRS.getString(i)); break;
			}
		} else {
			res[aDBRS.getMetaData().getColumnName(i)] = null;
		}
	}

	return res;
}

/**
 * <odoc>
 * <key>ow.obj.fromArray2DB(anArray, aDB, aDBFrom, useParallel) : Number</key>
 * Given anArray composed of maps where each key is a field name tries to insert into the aDBFrom (table or query between '(', ')')
 * for a provided aDB. Optionally you can specify how many threads should be used with useParallel.
 * This function doesn't perform any database commit. Returns the number of records inserted.
 * (available after ow.loadObj())
 * </odoc>
 */
OpenWrap.obj.prototype.fromArray2DB = function(anArray, aDB, aTableName, useParallel) {
	if (isUndefined(useParallel)) useParallel = getNumberOfCores();

	if (isUndefined(anArray) || anArray.length < 1) return 0;
	if (useParallel < 1) useParallel = 1;

	var okeys = Object.keys(anArray[0]).join(",").toUpperCase();
	var ctrl = {};

	var t = parallel4Array(anArray,
		function(aValue) {
			var values = [];
			var okeysstr = okeys.split(",");
			for(var k in okeysstr) {
				values.push(aValue[k]);
			}
			return aDB.us("insert into " + aTableName + "(" + okeys + ") values (?, ?)", values);
		},
		useParallel,
		ctrl
	);
	return t.length;
}

/**
 * <odoc>
 * <key>ow.obj.fromArray2OrderedObj(anArray) : Map</key>
 * Converts the provided anArray into a Map where each array entry is converted to a map entry 
 * which ordered will provide the same ordering found on the array.
 * (available after ow.loadObj())
 * </odoc>
 */
OpenWrap.obj.prototype.fromArray2OrderedObj = function(anArray) {
	if (isUndefined(anArray) || anArray.length < 1) return {};
	
	var res = {};
	for (var i in anArray) {
		res[i] = anArray[i];
	}
	
	return res;
}

/**
 * <odoc>
 * <key>ow.obj.fromOrderedObj2Array(aMap, aKeySortFunction) : Array</key>
 * Converts a provided aMap into an array where each element will be composed from the maps entries ordered
 * by the corresponding key. Optionally you can provide aKeySortFunction that will accept two arguments and
 * work similarly to javascript's array sorting functions.
 * (available after ow.loadObj())
 * </odoc>
 */
OpenWrap.obj.prototype.fromOrderedObj2Array = function(anObj, aKeySortFunction) {
	if (isUndefined(anObj) || Object.keys(anObj).length < 1) return [];
	if (isUndefined(aKeySortFunction)) aKeySortFunction = function(a, b) { 
		return a - b;
	}
	
	var oKeys = quickSort(Object.keys(anObj), aKeySortFunction);
	var res = [];
	for (var i in oKeys) {
		res.push(anObj[oKeys[i]]);
	}
	
	return res;
}

OpenWrap.obj.prototype.__getObj4Path = function(anObj, aPath) {
	aPath = String(aPath).split(/\./g);
	var obj = anObj;
	
    var index = 0;
    while(obj != null && index < aPath.length) {
        obj = obj[aPath[index++]];
    }

    return obj;
};

/**
 * <odoc>
 * <key>ow.obj.flatten(arrayOfMaps, aSeparator, aNADefault) : Array</key>
 * Converts any structured arrayOfMaps into a flat array of maps with only one level of keys. The map key path will be converted
 * into a single key using aSeparator (defaults to "_") and the value will be represented as aNADefault (defaults to "") when no 
 * value or key exists in other entries. For each array entry a new array element will be created replicated all other keys.
 * Usefull to convert data to output into CSV for example.
 * </odoc>
 */
OpenWrap.obj.prototype.flatten = function(data, aSeparator, aNADefault) {
	if (!isArray(data)) throw "ow.obj.flatten: need an array of data.";
	if (isUnDef(aSeparator)) aSeparator = "_";
	if (isUnDef(aNADefault)) aNADefault = "";
	loadLodash();

	function getFlatUniqKey(aK, aP) {
		var key = "";
		if (isDef(aP)) {
			key = aP.replace(/\./g, aSeparator) + (isNumber(aK) ? "" : aSeparator + aK.replace(/\./g, aSeparator));
		} else {
			key = aK.replace(/\./g, aSeparator);
		}
	
		return key.replace(/\["?\d+"?\]/g, "").replace(new RegExp("^" + aSeparator), "");
	}
	
	function getFlatKeys(anArrayOfMaps) {
		var keys = [];
		anArrayOfMaps.forEach((r) => {
			traverse(r, (aK, aV, aP, aO) => {
				if (!isObject(aV)) keys.push(getFlatUniqKey(aK, aP));
			});
		});
	
		return _.uniq(keys);
	}
	
	function genFlatMap(flatKeys) {
		var res = {};
	
		for(var i in flatKeys) {
			res[flatKeys[i]] = aNADefault;
		}
	
		return res;
	}

	var keys = getFlatKeys(data);
	var resData = [];

	_trav = (aM, aD, aP) => {
		var _keys = Object.keys(aD);
		var parent = isUnDef(aP) ? "" : aP;
		var m = aM;
		var res = [];

		// First pass to get non-objects
		for(let j in _keys) {
			if (!isObject(aD[_keys[j]])) {
				m[getFlatUniqKey(_keys[j], parent)] = aD[_keys[j]];
			} 
		}

		// Second pass for maps
		for(let j in _keys) {
			if (isObject(aD[_keys[j]]) && !isArray(aD[_keys[j]])) {
				var newParent = parent + ((isNaN(Number(_keys[j]))) ? "." + _keys[j] : "");
				res = res.concat(_trav(aM, aD[_keys[j]], newParent));
			}
		}

		// Third pass for arrays
		for(let j in _keys) {
			if (isArray(aD[_keys[j]])) {
				var newParent = parent + ((isNaN(Number(_keys[j]))) ? "." + _keys[j] : "");
				for(let l in aD[_keys[j]]) {
					var nm = clone(m);
					if (isObject(aD[_keys[j]][l])) {
						res = res.concat(_trav(nm, aD[_keys[j]][l], newParent));
					} else {
						nm[_keys[j]] = aD[_keys[j]][l];
						res.push(nm);
					}
				}
			}
		}
		
		if (res.length == 0) res = [ m ];

		return _.flattenDeep(res);
	};

	for(var i in data) {
		resData = resData.concat(_trav(genFlatMap(keys), data[i]));
	}

	return _.flattenDeep(resData);
};

/**
 * <odoc>
 * <key>ow.obj.fuzzySearch(anArrayOfKeys, anArrayOfObjects, searchString, fuseOptions) : Array</key>
 * Given anArrayOfObjects (similar objects) will fuzzy search the searchString on the values for the keys in anArrayOfKeys.
 * Returns an array of the most probable objects to match the searchString (you can use fuseOptions = { shouldSort: true } to 
 * ensure that the array is ordered by score).
 * It uses the FuseJS library internally so fuseOptions can be used to add more options (check more in http://fusejs.io/).\
 * \
 * For example:\
 *    ow.obj.fuzzySearch(["n"], [{n: "World War I"}, {n: "World War II"}, {n: "Name a war"}, {n: "Name some war"}], "world");\
 * \
 * </odoc>
 */
OpenWrap.obj.prototype.fuzzySearch = function(anArrayOfKeys, anArrayOfObjects, searchString, fuseOptions) {
	loadFuse();

	if (!isArray(anArrayOfObjects)) throw "anArrayOfObjects should be an array of objects.";
	if (!isArray(anArrayOfKeys)) throw "anArrayOfKeys should be an array of keys.";

	var fuse = new Fuse(anArrayOfObjects, merge({ keys: anArrayOfKeys }, fuseOptions));
	return fuse.search(searchString);
};

/**
 * <odoc>
 * <key>ow.obj.searchArray(anArray, aPartialMap, useRegEx, ignoreCase, useParallel) : Array</key>
 * Searches anArray of maps for entries where aPartialMap matches. If useRegEx is true all string entries
 * on aPartialMap will be interpreted as regular expressions. For number entries on the original map you can 
 * have the prefixes &gt;, &lt;, &gt;= and &lt;= to limit the numeric values. Optionally you can provide also
 * ignoreCase = true to ignore case (will only affect if useRegEx is true). And optionally also useParallel to
 * provide the number of threads to use. Example:\
 * \
 * ow.obj.searchArray(io.listFiles("/usr/bin").files, { "isFile": true, "filename": "^cal.*", "size": "&gt;=32000" }, true, true);\
 * \
 * // you can use it, for example, in conjunction with jLinq\
 * $from(ow.obj.searchArray(listFilesRecursive("/usr/lib"), { "filepath": "/usr/lib/ruby", "size": "&gt;100000" }, true)).sort("size").select();\
 * \
 * // to refer to a sub map value\
 * ow.obj.searchArray(students, { "details.age": "&lt;=25", "details.isMale": true }, true);\
 * \
 * (available after ow.loadObj())
 * </odoc>
 */
OpenWrap.obj.prototype.searchArray = function(anArray, aPartialMap, useRegEx, ignoreCase, useParallel) {
	if (isUndefined(useParallel)) useParallel = getNumberOfCores();
	if (useParallel < 1) useParallel = 1;

	var ctrl = {};
	var res = parallel4Array(anArray,
		function(aValue) {
			var okeys = Object.keys(aPartialMap);
			for(var k in okeys) {
				var ky = okeys[k];
				var vy = ow.obj.__getObj4Path(aValue, ky);
				if (useRegEx && (typeof aPartialMap[ky] == "string")) {
					if (aPartialMap[ky].match(/^([<>]=*)(\d+)/)) {
						var vs = aPartialMap[ky].match(/^([<>]=*)(\d+)/);
						if (vs[1] == ">=" && !(vs[2] <= vy)) { return undefined; }
						if (vs[1] == ">"  && !(vs[2] < vy)) { return undefined; }
						if (vs[1] == "<=" && !(vs[2] >= vy)) { return undefined; }
						if (vs[1] == "<"  && !(vs[2] > vy)) { return undefined; }
					} else {
						if (!String(vy).match(new RegExp(aPartialMap[ky], (ignoreCase) ? "i": ""))) { 
							return undefined; 
						};
					}
				} else {
					if (vy != aPartialMap[ky]) { 
						return undefined; 
					}
				}
			}
			return aValue;
		},
		useParallel,
		ctrl
	);

	var subres = [];
	for(var i in res) {
		if(res[i]) subres.push(res[i]);
	}

	return subres;
}

/**
 * <odoc>
 * <key>ow.obj.fromObj2Array(anObj, aKey) : Array</key>
 * Tries to create an array of maps from the provided anObj map of maps. Optionally if aKey is provided
 * it will be added to each array map with the map key. Example:\
 * \
 * var a = {\
 *    "A1": { "abc": "123", "xpt": "000" },\
 *    "A2": { "abc": "456", "xpt": "001" },\
 *    "A3": { "abc": "789", "xpt": "002" }\
 * }\
 * \
 * fromObj2Array(a, "key");\
 * // [\
 * //  { "key": "A1", "abc": "123", "xpt": "000" },\
 * //  { "key": "A2", "abc": "456", "xpt": "001" },\
 * //  { "key": "A3", "abc": "789", "xpt": "002" }\
 * // ]\
 * \
 * </odoc>
 */
OpenWrap.obj.prototype.fromObj2Array = function(aObj, aKey) {
	var res = [];
	for(var i in aObj) {
		var item;
		if (isDef(aKey)) {
			var m = {};
			m[aKey] = i;
			item = merge(m, aObj[i]);
		} else {
			item = clone(aObj[i]);
		}
		res.push(item);
	}
	return res;
};

/**
 * <odoc>
 * <key>ow.obj.filterKeys(anArrayKeyNames, aMap) : Map</key>
 * Given aMap will return an equivalent Map with only the keys contained in the anArrayKeyNames.
 * Note: doesn't traverse existing sub-maps.
 * </odoc>
 */
OpenWrap.obj.prototype.filterKeys = function(anArrayKeyNames, aRow) {
	var keys = {};
	for(var i in anArrayKeyNames) {
		keys[anArrayKeyNames[i]] = aRow[anArrayKeyNames[i]];
	}
	return keys;
};

/**
 * <odoc>
 * <key>ow.obj.fromArray2Obj(anArray, aKey, dontRemove) : Array</key>
 * Tries to create a map of maps from the provided anArrays. Optionally if aKey is provided
 * it will be used to create the map keys (otherwise will fallback to "row[number]"). And can also
 * optionally indicate by dontRemove = true that aKey shouldn't be removed from each map.
 * \
 * var a = [\
 *   { "abc": "123", "xpt": "000", "key": "A1" },\
 *   { "abc": "456", "xpt": "001", "key": "A2" },\
 *   { "abc": "789", "xpt": "002", "key": "A3" }\
 * ]\
 * \
 * fromArray2Obj(a, "key");\
 * // {\
 * //   "A1": { "abc": "123", "xpt": "000" },\
 * //   "A2": { "abc": "456", "xpt": "001" },\
 * //   "A3": { "abc": "789", "xpt": "002" }\
 * // }\
 * \
 * </odoc>
 */
OpenWrap.obj.prototype.fromArray2Obj = function(anArray, aKey, dontRemove) {
	var res = {};
	for(var i in anArray) {
		var item = clone(anArray[i]);
		if (isDef(aKey) && isDef(item[aKey])) {
			res[item[aKey]] = item;
			if (!dontRemove) delete item[aKey];
		} else {
			res["row" + i] = item;
		}
	}
	return res;
};

OpenWrap.obj.prototype.pool = {
	/**
	 * <odoc>
	 * <key>ow.obj.pool.create() : Object</key>
	 * Creates an object pool with the ability to provide objects produce by a factory method and to close the objects when needed
	 * (if defined to have minimum and maximum number of objects in the pool). It's possible also to define a keep alive function.
	 * </odoc>
	 */
	create: function() {
		var res = {
			__pool: [],
			__factory: undefined,
			__close: undefined,
			__keepalive: undefined,
			__min: 0,
			__max: 0,
			__inc: 1,
			__timeout: 2000,
			__keepaliveTime: 0,
			__keepaliveThread: undefined,
			__retry: 10,
			__currentFree: 0,
			__currentSize: 0,
			
			/**
			 * <odoc><key>ow.obj.pool.setRetry(numberOfRetries)</key>Sets the number of retries to obtain a free object from the pool.</odoc>
			 */
			setRetry: function(numberOfRetries) { this.__retry = numberOfRetries; return this; },
			/**
			 * <odoc><key>ow.obj.pool.setTimeout(aTimeoutInMs)</key>Sets a timeout in ms between each retry to obtain a free object from the pool.</odoc>
			 */
			setTimeout: function(aTimeoutInMs) { this.__timeout = aTimeoutInMs;	return this; },
			/**
			 * <odoc><key>ow.obj.pool.setMin(aNumberOfInstances)</key>Sets the minimum number of object instances the pool should have. These
			 * will be created upon ow.obj.pool.start.</odoc>
			 */
			setMin: function(aNumberOfInstances) { this.__min = aNumberOfInstances;	return this; },
			/**
			 * <odoc><key>ow.obj.pool.setMax(aMaxNumberOfInstances)</key>Sets the maximum number of object instances the pool can have.</odoc>
			 */
			setMax: function(aMaxNumberOfInstances) { this.__max = aMaxNumberOfInstances; return this; },
			/**
			 * <odoc><key>ow.obj.pool.setIncrementsOf(aNumberOfInstances)</key>Sets the number of increments in object instances on the pool in case that
			 * a new object instances is needed</odoc>
			 */
			setIncrementsOf: function(aNumberOfInstances) { this.__inc = aNumberOfInstances; return this;},
			
			__checkFree: function() {
				var isOk = false;
				var parent = this;
				var isThereRoom = false;

				sync(function() {
					if ((parent.__max > 0 && parent.__max <= (parent.__currentSize + 1)) && parent.__currentFree < 1) {
						isThereRoom = false;
					} else {
						isThereRoom = true;
					}
				}, this.__currentSize);

				if (!isThereRoom) {
					if (this.__retry >= 1) {
						for(var i = 0; i < this.__retry && isOk == false; i++) {
							sleep(this.__timeout);
							sync(function() {
								if (parent.__currentFree > 0 || (parent.__max > 0 && parent.__max > parent.__currentSize)) {
									isOk = true;
								}
							}, this.__currentSize);
						}
						if (isOk) return true;
					}
					throw "Pool is full with " + this.__currentSize + " objects";
				}

				return true;
			},
			
			__checkLimits: function() {
				if (this.__max <= 0) return true;

				var limitOk = false;
				var withinLimits = false;
				var parent = this;

				if (parent.__max > parent.__currentSize) {
					withinLimits = true;
				}

				if (withinLimits) limitOk = true;

				return limitOk;
			},
			
			/**
			 * <odoc>
			 * <key>ow.obj.pool.add(aObject, inUse)</key>
			 * Adds aObject to the current pool. Optionally you can indicate if it should be add has checkout (inUse = true).
			 * </odoc>
			 */
			add: function(aObject, inUse) {
				var parent = this;
				var res = false;

				sync(function() {
					if (parent.__checkLimits()) {
						if (parent.__max < 1 || parent.__currentSize <= parent.__max) {
							parent.__currentSize++;
							parent.__pool.push({
								"inUse": inUse,
								"obj": aObject
							});
							if (!inUse) parent.__currentFree++;
							res = true;
						}
					}
				}, this.__currentSize);

				return res;
			},
			
			/**
			 * <odoc>
			 * <key>ow.obj.pool.setFactory(aFactoryFunction, aCloseFunction, aKeepaliveFunction)</key>
			 * Sets the functions to use to create new object instances with a aFactoryFunction (this function should return a
			 * new object instance each time is called). aCloseFunction to be called whenever an object instances needs to be terminated.
			 * And an optionally aKeepaliveFunction, that receives a object instances as an argument, and should perform the necessary
			 * procedures to keep the object instance "alive" (think connections that timeout after not being used for a long time).
			 * </odoc>
			 */
			setFactory: function(aFactoryFunction, aCloseFunction, aKeepaliveFunction) {
				this.__factory = aFactoryFunction;
				this.__close = aCloseFunction;
				this.__keepalive = function(obj) {
					try {
						aKeepaliveFunction(obj);
						return true;
					} catch(e) {
						return false;
					}
				};
				var parent = this;

				addOnOpenAFShutdown(function() {
					parent.stop();
				});
				
				return this;
			},
			
			/**
			 * <odoc>
			 * <key>ow.obj.pool.setKeepalive(aTimeInSeconds)</key>
			 * Sets the aTimeInSeconds for the keep alive function to be called for all object instances in the pool. After setting
			 * to aTimeInSeconds > 0 the keep alive cycle will be started. Otherwise any existing keep alive cycle will be stopped.
			 * Note: don't forget to use ow.obj.pool.stop to keep the keep alive thread from running after you no longer need it.
			 * </odoc>
			 */
			setKeepalive: function(aTime) { 
				this.__keepaliveTime = aTime;
				var parent = this;
				if (aTime > 0) {
					plugin("Threads");
					if (isDefined(this.__keepaliveThread)) { this.__keepaliveThread.stop(true); }
					this.__keepaliveThread = new Threads();
					this.__keepaliveThread.addThread(function() {
						try {
							for(var i in parent.__pool) {
								if (!parent.__pool[i].inUse) parent.__keepalive(parent.__pool[i].obj);
							}
						} catch(e) {
						}
					});
					this.__keepaliveThread.startWithFixedRate(aTime * 1000);
				} else {
					if (isDefined(this.__keepaliveThread)) { this.__keepaliveThread.stop(true); }
				}
				return this; 
			},
			
			__createObj: function(inUse) {
				var parent = this;
				var obj;

				inUse = (isUnDef(inUse)) ? false : inUse;

				if (isDef(parent.__factory)) {
					obj = parent.__factory();
					if (parent.__inc > 1) {
						for(var i = 0; i < parent.__inc - 1; i++) {
							parent.add(parent.__factory());
						}
					}
					if (parent.add(obj, inUse))
						return obj;
					else
						return undefined;
				}

				return obj;
			},
			
			__getUnused: function(shouldTest) {	
				var obj = void 0;
				var i = 0, r = 0;
				var parent = this;

				sync(function() {
					while(isUnDef(obj) && i < parent.__currentSize) {
						var inUse = void 0;
						inUse = parent.__pool[i].inUse;
						if (inUse == false) {
							var useit = !shouldTest;						
							if (shouldTest) {
								useit = parent.__keepalive(parent.__pool[i].obj);
								if (!useit) parent.__cleanup(parent.__pool[i].obj);
							} 
							if (useit) {
								obj = parent.__pool[i].obj;
								parent.__pool[i].inUse = true;
								parent.__currentFree--;
							} else {
								r++;
								if (r <= parent.__retry) i = 0;
							}
						} else {
							i++;
						}
					}
				}, this.__currentSize);

				if (i >= parent.__currentSize) {
					var resCheckFree;
					resCheckFree = parent.__checkFree();
					sync(function() {
						if (resCheckFree && parent.__checkLimits()) {						
							obj = parent.__createObj(true);
						} 
					}, this.__currentSize);
					if (resCheckFree) {
						if (!isDef(obj)) {
							obj = parent.__getUnused(shouldTest);
						}
					}
				}

				return obj;
			},
			
			/**
			 * <odoc>
			 * <key>ow.obj.pool.start()</key>
			 * Starts the object pool by creating the minimal number of object instances.
			 * </odoc>
			 */
			start: function() {
				for(var i = 0; i < this.__min; i++) {
					this.__createObj();
				}
				
				return this;
			},
			
			/**
			 * <odoc>
			 * <key>ow.obj.pool.stop()</key>
			 * Stops the object pool closing all object instances and any keep alive cycle.
			 * </odoc>
			 */
			stop: function() {
				if (isDefined(this.__keepaliveThread)) { this.__keepaliveThread.stop(true); }
				if (isDefined(this.__close)) {
					for(var i in this.__pool) {
						// Tries to run close and ignores any error since is upon for delete
						try { this.__close(this.__pool[i].obj); } catch(e) {}
						delete this.__pool[i];
						this.__currentSize--;
					}
					this.__currentFree = 0;
					this.__currentSize = 0;
					this.__pool = [];
				}
			},
			
			/**
			 * <odoc>
			 * <key>ow.obj.pool.checkOut() : Object</key>
			 * Tries to obtain an object instance from the pool and returns it marking it as in use. Throws an exception
			 * if no object is available even after retrying.
			 * </odoc>
			 */
			checkOut: function(shouldTest) {
				var obj, i = 0;
				var parent = this;

				obj = parent.__getUnused(shouldTest);

				if (isDefined(obj))
					return obj;
				else
					throw "No available objects in pool.";
			},
			
			__cleanup: function(obj) {
				var parent = this;

				var i = 0;
				while(parent.__pool[i].obj != obj && i < parent.__pool.length) {
					i++;
				}
				if (i == parent.__pool.length) return;

				try { parent.__close(parent.__pool[i].obj) } catch (e) {}
				delete parent.__pool[i];
				parent.__currentSize--;
				loadUnderscore();
				parent.__pool = _.compact(parent.__pool);
				for(var i = parent.__currentSize; i < parent.__min; i++) {
					parent.__createObj();
				}
			},

			/**
			 * <odoc>
			 * <key>ow.obj.pool.checkIn(aObject, shouldKeep)</key>
			 * Returns the aObject instance back to the pool removing the mark that is in use. If shouldKeep = false the
			 * object instance will be removed from the pool (trying to call the closeFunction and ignoring any exception).
			 * </odoc>
			 */
			checkIn: function(obj, badObj) {
				var parent = this;
				sync(function() {
					var i;
					for(i = 0; i < parent.__currentSize && parent.__pool[i].obj != obj; i++) {}

					if (badObj == false) {
						// Tries to run close and ignores any error since is upon for delete
						/*try { parent.__close(parent.__pool[i].obj) } catch (e) {}
						delete parent.__pool[i];
						parent.__currentSize--;
						loadUnderscore();
						parent.__pool = _.compact(parent.__pool);
						for(var i = parent.__currentSize; i < parent.__min; i++) {
							parent.__createObj();
						}*/
						parent.__cleanup(obj);
					} else {
						parent.__pool[i].inUse = false;
						parent.__currentFree++;
					}
				}, this.__currentSize);
				
				return this;
			},
			
			/**
			 * <odoc>
			 * <key>ow.obj.pool.use(aFunction)</key>
			 * Executes aFunction providing, as an argument, an object instance from the pool (equivalent to ow.obj.pool.checkOut).
			 * After the execution the object instance will be returned to the pool (equivalent to ow.obj.pool.checkIn). If the aFunction
			 * returns false the provided object instance will be removed from the pool (interpreting as something is wrong 
			 * with it).
			 * </odoc>
			 */
			use: function(aFunction, doCheck) {
				// Get free objects
				var obj, i = 0;

				var parent = this;
				obj = this.checkOut(doCheck);

				// Got an object, use it
				if (isDefined(obj)) {
					var res;

					try {
						res = aFunction(obj);
					} catch(e) {
						this.checkIn(obj, false);
						throw e;
					}

					this.checkIn(obj, res);
				} else {
					throw "No available objects in pool.";
				}
			},
			
			/**
			 * <odoc>
			 * <key>ow.obj.pool.setFactoryAF(anURL, aTimeout)</key>
			 * Setups: a factory function to create an AF object using anURL and tries to send a Ping operation; a close
			 * function to close the AF object connection; a keep alive function that sends a Ping operation.
			 * </odoc>
			 */
			setFactoryAF: function(anURL, timeout) {
				this.setFactory(
					function() { var a = new AF(anURL, timeout); a.exec("Ping", {}); return a; },
					function(a) { a.close(); },
					function(a) { a.exec("Ping", {} )}
				);
			},
			
			/**
			 * <odoc>
			 * <key>ow.obj.pool.setFactoryRAIDDB(anAF, aConn, aKeepAlive, aURL, aPassword, useCIR, aDriver)</key>
			 * Setups: a factory function to create an DB object using anAF and aConn connection name from the RAID/WAF server;
			 * a close function to close the DB object connection; a keep alive function that tries to execute a select from dual
			 * (you can override this function providing aKeepAlive function that receives a database object as argument).
			 * </odoc>
			 */
			setFactoryRAIDDB: function(anAF, aConn, aKeepAlive, aURL, aPassword, useCIR, aDriver) {
				if (isUnDef(aKeepAlive)) {
					aKeepAlive = function(a) {
						if (a.getConnect().getMetaData().getDatabaseProductName().toLowerCase() == "postgresql") {
							a.q("select 1");
						} else {
							a.q("select 1 from dual");
						}
					};
				}
				
				this.setFactory(
					function() { var db = getRAIDDB(anAF, aConn, aURL, aPassword, useCIR, aDriver); return db; },
					function(a) { a.close(); },
					aKeepAlive
				);
			},
			
			/**
			 * <odoc>
			 * <key>ow.obj.pool.setFactoryDB(aDriver, aURL, aLogin, aPassword)</key>
			 * Setups: a factory function to create an DB object using aDriver, aURL, aLogin and aPassword;
			 * a close function to close the DB object connection; a keep alive function that tries to execute a select from dual.
			 * </odoc>
			 */
			setFactoryDB: function(aDriver, aURL, aLogin, aPassword, aKeepAlive) {
				if (isUnDef(aKeepAlive)) {
					aKeepAlive = function(a) {
						if (a.getConnect().getMetaData().getDatabaseProductName().toLowerCase() == "postgresql") {
							a.q("select 1");
						} else {
							a.q("select 1 from dual");
						}
					}
				}
				
				this.setFactory(
					function() { var db = new DB(aDriver, aURL, aLogin, aPassword); return db; },
					function(a) { a.close(); },
					aKeepAlive
				);
			},
			
			/**
			 * <odoc>
			 * <key>ow.obj.pool.setFactorySSH(aHost, aPort, aLogin, aPass, anIdentificationKey, withCompression)</key>
			 * Setups: a factory function to create an SSH object using aHost, aPort, aLogin, aPass, anIdentificationKey, withCompression;
			 * a close function to close the SSH object connection; a keep alive function that tries to execute a command "true".
			 * </odoc>
			 */
			setFactorySSH: function(aHost, aPort, aLogin, aPass, anIdentificationKey, withCompression) {
				this.setFactory(
					function() { plugin("SSH"); var ssh = new SSH(aHost, aPort, aLogin, aPass, anIdentificationKey, withCompression); return ssh; },
					function(a) { a.close(); },
					function(a) { a.exec("true"); }
				);
			}
		}
		return res;
	},
	
	/**
	 * <odoc><key>ow.obj.pool.AF(anURL, aTimeout)</key>Creates a pool setting with ow.obj.pool.setFactoryAF.</odoc>
	 */
	AF: function(anURL, aTimeout) { var p = this.create(); p.setFactoryAF(anURL, aTimeout); return p; },
	/**
	 * <odoc><key>ow.obj.pool.RAIDDB(anAF, aConn, aKeepAlive, aURL, aPassword, useCIR, aDriver)</key>Creates a pool setting with ow.obj.pool.setFactoryRAIDDB.</odoc>
	 */
	RAIDDB: function(anAF, aConn, aKeepAlive, aURL, aPassword, useCIR, aDriver) { var p = this.create(); p.setFactoryRAIDDB(anAF, aConn, aKeepAlive, aURL, aPassword, useCIR, aDriver); return p; },
	/**
	 * <odoc><key>ow.obj.pool.DB(aDriver, aURL, aLogin, aPassword)</key>Creates a pool setting with ow.obj.pool.setFactoryDB.</odoc>
	 */
	DB: function(aDriver, aURL, aLogin, aPassword) { var p = this.create(); p.setFactoryDB(aDriver, aURL, aLogin, aPassword); return p; },
	/**
	 * <odoc><key>ow.obj.pool.SSH(aHost, aPort, aLogin, aPass, anIdentificationKey, withCompression)</key>Creates a pool setting with ow.obj.pool.setFactorySSH.</odoc>
	 */
	SSH: function(aHost, aPort, aLogin, aPass, anIdentificationKey, withCompression) { var p = this.create(); p.setFactorySSH(aHost, aPort, aLogin, aPass, anIdentificationKey, withCompression); return p; }
}

OpenWrap.obj.prototype.big = {
	/**
	 * <odoc>
	 * <key>ow.obj.big.create(shouldCompressKeys) : Object</key>
	 * Creates a "big" map object that compresses contents in memory. Optionally if shouldCompressKeys = true
	 * the key map will also be compressed. See also:\
	 * \
	 * ow.obj.big.set\
	 * ow.obj.big.setAll\
	 * ow.obj.big.get\
	 * ow.obj.big.find\
	 * \
	 * </odoc>
	 */
	create: function(shoudCompress) {
		var res = {
			internalData: {},
			internalIndex: {},
			compressKeys: shoudCompress,

			/**
			 * <odoc>
			 * <key>ow.obj.big.set(aKeyMap, aValueMap, aTimestamp)</key>
			 * Sets aValueMap associated with a aKeyMap. Optionally you can set the internal aTimestamp for the record.\
			 * Example:\
			 * \
			 * var big = ow.obj.big.create();\
			 * big.set({"name": "Anne"}, {"name": "Anne", "country": "USA", "company": "Wedo"});\
			 * \
			 * </odoc>
			 */
			set: function(aKeys, aColumns, aTime) {
				var existing = this.getID(aKeys);
			    var uuid;
			    var hash;
			    var ett = (isUndefined(aTime)) ? nowUTC() : aTime;
			
			    if (Object.keys(aKeys) <= 0) return;
			    
				hash = this.__genHash(aKeys);
				if(isDefined(existing)) {
					uuid = existing;
				} else {
					uuid = genUUID();
				}
			
				this.internalData[uuid] = compress(aColumns);
			    if (isUndefined(this.internalIndex[hash])) { this.internalIndex[hash] = []; }
			
			    var k;
			    if (this.compressKeys) {
			    	k = compress(aKeys);
			    } else {
			    	k = aKeys;
			    }
			    
			    var notfound = true;
			    for (var i in this.internalIndex[hash]) {
			    	var et = this.internalIndex[hash][i];
			    	if (et.u == uuid) {
			    		notfound = false;
			    		et.t = ett;
			    		et.n = nowNano();
			    	}
			    }
			    
			    if(notfound) {
			    	this.internalIndex[hash].push({"u": uuid, "k": k, "t": ett, "n": nowNano() });
			    };
			    
			    return uuid;
			},
		
			/**
			 * <odoc>
			 * <key>ow.obj.big.remove(aKeyMap)</key>
			 * Removes aKeyMap and corresponding value.
			 * </odoc>
			 */
			remove: function(aKeys) {
				var existing = this.getID(aKeys);
				var uuid;
				var hash = this.__genHash(aKeys);
				
				if(isDefined(existing)) {
					uuid = existing;
					
					delete this.internalData[uuid];
					delete this.internalIndex[hash];
				}
			}, 
			
			/**
			 * <odoc>
			 * <key>ow.obj.big.setAll(anArrayKeyNames, anArrayOfValues, aTimestamp)</key>
			 * Given anArrayOfValues will set them internally using the keys on anArrayKeyNames to define
			 * the corresponding keys. Optionally you can set the internal aTimestamp for the record.\
			 * \
			 * Example:\
			 * \
			 * var big = ow.obj.big.create();\
			 * var data = [\
			 * 		{"name": "Anne", "country": "USA", "company": "Wedo"},\
			 * 		{"name": "Rui", "country": "Portugal", "company": "Wedo"},\
			 * 		{"name": "Paulo", "country": "Portugal", "company": "Sonae"},\
			 * 		{"name": "Peter", "country": "USA", "company": "ACME"},\
			 * 		{"name": "Louis", "country": "USA", "company": "ACME"}\
			 * ];\
			 * big.setAll(["name", "country"], data);\
			 * \
			 * </odoc>
			 */
			setAll: function(anArrayKeyNames, anArray, aTimestamp) {
				var parent = this;

				parallel4Array(anArray,
					function(aValue) {
						parent.set(ow.obj.filterKeys(anArrayKeyNames, aValue), aValue, aTimestamp);
						return aValue;
					}
				);
			},
		
			__genHash: function(aKeys) {
				var str = "";
				var keys = Object.keys(aKeys).sort();
				for(var i in keys) {
					str += aKeys[keys[i]];
				}
				str += str.length;
				return sha1(str);
			},
		
			__getIndex: function() {
				return this.internalIndex;
			},
			
			__getData: function() {
				return this.internalData;
			},
			
			getIndex: function() {
				return this.__getIndex();
			},
			
			/**
			 * <odoc>
			 * <key>ow.obj.big.getSize() : Number</key>
			 * Returns the current number of keys available.
			 * </odoc>
			 */
			getSize: function() {
				return Object.keys(this.__getIndex()).length;
			},
			
			getByID: function(aId) {
				return this.__getIndex()[aId];
			},
			
			getID: function(aKeys) {
				var keys = this.__getIndex()[this.__genHash(aKeys)];
				for(var i in keys) {
					if (this.compressKeys) {
						if (compare(uncompress(keys[i].k), aKeys)) {
							return keys[i].u;
						}
					} else {
						if (compare(keys[i].k, aKeys)) {
							return keys[i].u;
						}
					}
				}
				return undefined;
			},
		
			getColsByID: function(anId) {
				if (isUndefined(anId)) return undefined;
				return uncompress(this.__getData()[anId]);
			},
		
			getAllByIDs: function(anArrayOfIds) {
				var arr = [];
				var parent = this;
			
				parallel4Array(anArrayOfIds,
					function(aValue) {
						arr.push(parent.getColsByID(aValue));
						return aValue;
					}
				);
			
				return arr;
			},
		
			__getCols: function(aKeys) {
				return this.getColsByID(this.getID(aKeys));
			},
			
			/**
			 * <odoc>
			 * <key>ow.obj.big.get(aKeyMap) : Map</key>
			 * Retrieves a value map given the provided aKeyMap.\
			 * Example:\
			 * \
			 * var big = ow.obj.big.create();\
			 * var data = [\
			 * 		{"name": "Anne", "country": "USA", "company": "Wedo"},\
			 * 		{"name": "Rui", "country": "Portugal", "company": "Wedo"},\
			 * 		{"name": "Paulo", "country": "Portugal", "company": "Sonae"},\
			 * 		{"name": "Peter", "country": "USA", "company": "ACME"},\
			 * 		{"name": "Louis", "country": "USA", "company": "ACME"}\
			 * ];\
			 * big.setAll(["name"], data);\
			 * big.get({"name": "Rui"}); // {"name": "Rui", "country": "Portugal", "company": "Wedo"}\
			 * \
			 * </odoc>
			 */
			get: function(aKeys) {
				return this.__getCols(aKeys);
			},
			
			findIDs: function(anArrayOfKeys) {
				var uuids = [];
				var parent = this;
			
				parallel4Array(anArrayOfKeys,
					function(aValue) {
						uuids.push(parent.getID(aValue));
					}
				);
			
				return uuids;
			},
		
			findByIDs: function(aFunction) {
				var uuids = [];
				var parent = this;
			
				parallel4Array(Object.keys(this.__getIndex()),
					function(aValue) {
						var keys = parent.__getIndex()[aValue];
						for(var i in keys) {
							var key;
							if (parent.compressKeys) key = uncompress(keys[i].k);
							else key = keys[i].k;
			
							if (aFunction(key)) {
								uuids.push(keys[i].u);
							}
						}
						return aValue;
					}
				);
			
				return uuids;
			},
		
			/**
			 * <odoc>
			 * <key>ow.obj.big.find(aFunction) : Array</key>
			 * Will execute the provided aFunction providing each key available. For the keys where the function returns true the
			 * corresponding value will be gathered into the final resulting array.
			 * </odoc>
			 */
			find: function(aFunction) {
				var objs = [];
				var parent = this;
			
				parallel4Array(Object.keys(this.__getIndex()),
					function(aValue) {
						var keys = parent.__getIndex()[aValue];
						for(var i in keys) {
							var key;
							if (parent.compressKeys) key = uncompress(keys[i].k);
							else key = keys[i].k;
			
							if (aFunction(key)) {
								objs.push(parent.getColsByID(keys[i].u));
							}
						}
						
						return aValue;
					}
				);
			
				return objs;
			}
		}
		return res;
	}
}

/**
 * <odoc>
 * <key>ow.obj.fromJson(aJson) : Object</key>
 * Creates an object or objects, using the aJson and the indication of the object prototypes to use. This is based on JMix from
 * https://github.com/khayll/jsmix.\
 * Example:\
 * \
 * var Point = function() {};\
 * Point.prototype.getX = function() { return this.x; }\
 * Point.prototype.getY = function() { return this.y; }\
 * \
 * ow.obj.fromJson({ x: 1, y: 2 }).withObject(Point.prototype).build().getX(); // 1\
 * \
 * var mylines = { "lines": [\
 *    { "name": "line 1", "points": [ { x: 0, y: 0}, { x: 5, y: 6} ] },\
 *    { "name": "line 2", "points": [ { x: -5, y: -5}, { x: 1, y: 3} ] },\
 * ]};\
 * \
 * var res = ow.obj.fromJson(mylines).withObject(Point.prototype, "lines.*.points.*").build();\
 * res.lines[1].points[1].getY(); // 3\
 * \
 * </odoc>
 * 
 * from https://github.com/khayll/jsmix
 */
OpenWrap.obj.prototype.fromJson = function(json) {
	var res = {
		data: {},
		create: function(someData) {
			if (!(someData instanceof Object)) {
				someData = jsonParse(someData);
			}
			
			this.data = someData || {};
			return this;
		},
		
		/**
		 * Method to map object prototype with a path in the data object
		 * @param {prototype} prototype of the object to be mapped onto the data
		 * @param {string} path to where the data objects are. Example: employees/*
		 */
		withObject: function(prototype, path) {
		    if ( this.emptyPath(path) ) {
		        this.data = this.mix(prototype, this.data);
		    } else {
		        this.data = this.mixRecursive(prototype, this.data, path.split('.'));
		    }
		    return this;
		},
		
		/**
		 * Returns the mixed object
		 */
		build: function() {
		    return this.data;
		},
		
		mixRecursive: function(prototype, parent, parts) {
		    var newParts = Array.from(parts);
		    var currentPart = newParts.shift();
		    if ( parts.length === 0 ) {
		        return this.mix(prototype, parent);
		    }
		    if ( isObject(parent[currentPart]) || currentPart === '*') {
		        if ( !isArray(parent[currentPart]) && currentPart !== '*' ) { 
		            parent[currentPart] = this.mixRecursive(prototype, parent[currentPart], newParts);
		        } else {
		            if ( currentPart === '*' ) {
		                for (var property in parent) {
		                    if (parent.hasOwnProperty(property)) {
		                        parent[property] = this.mixRecursive(prototype, parent[property], newParts);
		                    }
		                }
		            } else {
		                if ( newParts[0] === '*' ) {
		                    newParts.shift();
		                }
		                var parent2 = this; 
		                parent[currentPart].forEach( function (value, index) {
		                    parent[currentPart][index] = parent2.mixRecursive(prototype, parent[currentPart][index], newParts);
		                });
		            }
		        }
		    }
		    return parent;
		},
		
		mix: function(prototype, data) {
		    var target = Object.create(prototype);
		    for (var property in data) {
		        if (data.hasOwnProperty(property)) {
		            target[property] = data[property];
		        }
		    }
	
		    return target;
		},
		
		emptyPath: function(path) {
		    if ( path === undefined || path === '' ) {
		        return true;
		    }
		    return false;
		}
	}
	return res.create(json);
};

/**
 * <odoc>
 * <key>ow.obj.diff(aOriginalJSON, aFinalJSON, optionsMap) : String</key>
 * Produces a string representation with the difference between aOriginalJSON and aFinalJSON.\
 * If optionsMap.printColor = true it will be immediately print with ANSI colors if available.\
 * If optionsMap.justAnsi it won't print and just produce the ANSI color codes.\
 * If optionsMap.justChanges = true only the changed lines will be represented with the rest.\
 * If optionsMap.justDiff = true only the changed lines will be included.
 * </odoc>
 */
OpenWrap.obj.prototype.diff = function(aOrig, aFinal, optionsMap) {
	if (isUnDef(this.__diffColorFormat)) {
		this.__diffColorFormat = {
			addedJustChanges: "BOLD,BLACK",
			removed: "RED,BOLD",
			added: "GREEN,BOLD",
			removedJustChanges: "WHITE"
		};
	}

	loadDiff();
	var ar = JsDiff.diffJson(aOrig, aFinal); 

	if (isUnDef(optionsMap) || !(isObject(optionsMap))) optionsMap = { printColor: false, justChanges: false, justAnsi: false, justDiff: false };
	
	if (optionsMap.printColor) ansiStart();
	var s = "";
	for(var i in ar) {
		var color;
		if (optionsMap.printColor || optionsMap.justAnsi) {
		    color = (ar[i].added) ? (optionsMap.justChanges ? this.__diffColorFormat.addedJustChanges : this.__diffColorFormat.added) 
								  : (ar[i].removed && !optionsMap.justChanges) ? this.__diffColorFormat.removed 
													                           : this.__diffColorFormat.removedJustChanges;
		}

		var value = (ar[i].added) ? ar[i].value.replace(/(.*)\n/gm, " +$1\n")
								  : (ar[i].removed) ? (optionsMap.justChanges ? "" : ar[i].value.replace(/(.*)\n/gm, " -$1\n"))
													: ((optionsMap.justDiff) ? "" : ar[i].value.replace(/(.*)\n/gm, "  $1\n"));

		value = value.replace(/^([^ +-])/mg, "  $1");

		if (optionsMap.printColor || optionsMap.justAnsi) 
			s = s + String(ansiColor(color, value));
		else
			s = s + value;
	}
	if (optionsMap.printColor) { 
		print(s);
		ansiStop();
 	} else {
		return s; 
	}
};

OpenWrap.obj.prototype.http = function(aURL, aRequestType, aIn, aRequestMap, isBytes, aTimeout, returnStream) {
	this.__lps = {};
	this.__config = {};
	this.__r = void 0;
	this.__rb = void 0; 
	//this.__h = new Packages.org.apache.http.impl.client.HttpClients.createDefault();
	if (isDef(aURL)) {
		this.exec(aURL, aRequestType, aIn, aRequestMap, isBytes, aTimeout, returnStream);
	}
};

OpenWrap.obj.prototype.http.prototype.setConfig = function(aMap) {
	this.__config = aMap;
};

OpenWrap.obj.prototype.http.prototype.__handleConfig = function(aH) {
	if (isDef(this.__config.disableCookie) && this.__config.disableCookie) aH = aH.disableCookieManagement();
	if (isDef(this.__config.disableRedirectHandling) && this.__config.disableRedirectHandling) aH = aH.disableRedirectHandling();
	return aH;
};

OpenWrap.obj.prototype.http.prototype.exec = function(aUrl, aRequestType, aIn, aRequestMap, isBytes, aTimeout, returnStream) {
	var r, canHaveIn = false;

	if (isUnDef(aRequestType)) aRequestType = "GET";

	switch(aRequestType.toUpperCase()) {
	case "GET": 
		r = new Packages.org.apache.http.client.methods.HttpGet(aUrl);
		break;
	case "POST": 
		r = new Packages.org.apache.http.client.methods.HttpPost(aUrl);
		canHaveIn = true;
		break;
	case "DELETE": 
		r = new Packages.org.apache.http.client.methods.HttpDelete(aUrl);
		break;
	case "HEAD":
		r = new Packages.org.apache.http.client.methods.HttpHead(aUrl);
		break;
	case "PATCH":
		r = new Packages.org.apache.http.client.methods.HttpPatch(aUrl);
		canHaveIn = true;
		break;
	case "PUT":
		r = new Packages.org.apache.http.client.methods.HttpPut(aUrl);
		canHaveIn = true;
		break;		
	case "TRACE":
		r = new Packages.org.apache.http.client.methods.HttpTrace(aUrl);
		break;		
	default:
		r = new Packages.org.apache.http.client.methods.HttpGet(aUrl);
		break;
	}

	// Set credentials
	if (isDef(this.__l) && !(this.__forceBasic)) {
		var getKey;
		this.__h = new Packages.org.apache.http.impl.client.HttpClients.custom();
		for(var key in this.__lps) {
			if (aUrl.startsWith(key)) getKey = key;
		}
		if (isDef(getKey)) {
			this.__h = this.__h.setDefaultCredentialsProvider(this.__lps[getKey]);
			this.__h = this.__handleConfig(this.__h);
			this.__h = this.__h.build();
		} else {
			this.__h = this.__handleConfig(this.__h);
			this.__h = this.__h.build();
		}
	} else {
		if (isUnDef(this.__h)) {
			this.__h = new Packages.org.apache.http.impl.client.HttpClients.custom();
			this.__h = this.__handleConfig(this.__h);
			this.__h = this.__h.build();
		}
	}

	// Set timeout
	if (isDef(aTimeout)) {
		var rc = new Packages.org.apache.http.client.config.RequestConfig.custom();
		rc.setConnectionRequestTimeout(aTimeout);
		rc.setConnect(aTimeout);
		r.setConfig(rc.build());
	}

	r.addHeader("User-Agent", __OpenAFUserAgent);
	if (this.__forceBasic && isDef(this.__l)) {
		r.addHeader("Authorization", "Basic " + String(new java.lang.String(Packages.org.apache.commons.codec.binary.Base64.encodeBase64(new java.lang.String(Packages.openaf.AFCmdBase.afc.dIP(this.__l) + ":" + Packages.openaf.AFCmdBase.afc.dIP(this.__p)).getBytes()))));
	}

	for(var i in aRequestMap) {
		r.addHeader(i, aRequestMap[i]);
	}

	if (isDef(aIn) && isString(aIn) && canHaveIn) {
		r.setEntity(Packages.org.apache.http.entity.StringEntity(aIn));
	}

	this.outputObj = {};
	this.__r = this.__h.execute(r);
	if (isBytes && !returnStream) {
		this.outputObj =  {
			responseCode: this.responseCode(),
			contentType: this.responseType(),
			responseBytes: this.responseBytes()
		};
	} else {
		if (returnStream) {
			this.outputObj = this.responseStream();
		} else {
			this.outputObj = {
				responseCode: this.responseCode(),
				contentType: this.responseType(),
				response: this.response()
			};
		}
	}

	if (this.responseCode() >= 400) {
		switch(this.responseCode()) {
		case 404: throw "FileNotFoundException " + aUrl + "; response = " + stringify(this.getErrorResponse());
		case 410: throw "FileNotFoundException " + aUrl + "; response = " + stringify(this.getErrorResponse());
		default: throw "IOException Server returned HTTP response code: " + this.responseCode() + " for URL: " + aUrl + "; response = " + stringify(this.getErrorResponse());
		}
	}
	return this.outputObj;
};

OpenWrap.obj.prototype.http.prototype.get = function(aUrl, aIn, aRequestMap, isBytes, aTimeout, returnStream) {
	return this.exec(aUrl, "GET", aIn, aRequestMap, isBytes, aTimeout, returnStream);
};

OpenWrap.obj.prototype.http.prototype.post = function(aUrl, aIn, aRequestMap, isBytes, aTimeout, returnStream) {
	return this.exec(aUrl, "POST", aIn, aRequestMap, isBytes, aTimeout, returnStream);
};

OpenWrap.obj.prototype.http.prototype.getErrorResponse = function(parseJson) {
	if (parseJson) {
		var res = this.outputObj;
		if (isDef(res.response)) res.response = jsonParse(res.response);
		return res;	
	} else
		return this.outputObj;
};

OpenWrap.obj.prototype.http.prototype.getResponse = function() {
	return this.outputObj;
};
	
OpenWrap.obj.prototype.http.prototype.login = function(aUser, aPassword, forceBasic, urlPartial) {
	if (isUnDef(urlPartial)) forceBasic = true;

	if (!forceBasic) {
		var url = new java.net.URL(urlPartial);
		var port = url.getPort();
		if (port < 0) {
			switch(url.getProtocol()) {
			case "http" : port = 80; break;
			case "https": port = 443; break;
			}
		}
		var as = new Packages.org.apache.http.auth.AuthScope(url.getHost(), port);
		var up = new Packages.org.apache.http.auth.UsernamePasswordCredentials(Packages.openaf.AFCmdBase.afc.dIP(aUser), Packages.openaf.AFCmdBase.afc.dIP(aPassword));
		var cred = new org.apache.http.impl.client.BasicCredentialsProvider();
		cred.setCredentials(as, up);
		this.__lps[urlPartial] = cred;
	}

	this.__l = aUser;
	this.__p = aPassword;
	this.__forceBasic = forceBasic;
};

OpenWrap.obj.prototype.http.prototype.response = function() {
	//if (isDef(this.__r)) return this.__r;
	try {
		var res, ent = this.__r.getEntity();
		if (ent != null) res = String(Packages.org.apache.http.util.EntityUtils.toString(ent));
		//this.__r = res;
		return res;
	} finally {
		this.__r.close();
	}
};

OpenWrap.obj.prototype.http.prototype.responseBytes = function() {
	//if (isDef(this.__rb)) return this.__rb;
	try {
		var res, ent = this.__r.getEntity();
		if (ent != null) res = Packages.org.apache.http.util.EntityUtils.toByteArray(ent);
		//this.__rb = res;
		return res;
	} finally {
		this.__r.close();
	}
};

OpenWrap.obj.prototype.http.prototype.responseCode = function() {
	return Number(this.__r.getStatusLine().getStatusCode());
};

OpenWrap.obj.prototype.http.prototype.responseHeaders = function() {
	var ar = {};
	var hh = this.__r.getAllHeaders();
	for(var i in hh) {
		var name = hh[i].getName();
		if (isDef(ar[name]) && name.toLowerCase() == "set-cookie") {
			ar[name] = ar[name] + ";" + hh[i].getValue();
		} else {
			ar[hh[i].getName()] = hh[i].getValue();
		}
	}

	return ar;
};

OpenWrap.obj.prototype.http.prototype.responseStream = function() {
	var ent = this.__r.getEntity();
	if (ent != null)
		return this.__r.getEntity().getContent();
	else 
		return undefined;
};

OpenWrap.obj.prototype.http.prototype.responseType = function() {
	try {
		return String(this.__r.getEntity().getContentType().getValue());
	} catch(e) {
		return "";
	}
};

OpenWrap.obj.prototype.rest = {

	/**
	 * <odoc>
	 * <key>ow.obj.rest.exceptionParse(anException) : Map</key>
	 * Tries to parse the response of a rest call exception and the response also if it's json.
	 * </odoc>
	 */
	exceptionParse: function(anException) {
		var er = jsonParse(anException.replace(/.+response =/, ""));
		if (er.contentType.toLowerCase().match(/application\/json/))
			er.response = jsonParse(er.response);
		return er;
	},
	
	/**
	 * <odoc>
	 * <key>ow.obj.rest.get(aBaseURI, aIndexMap, aLoginOrFunction, aPassword, aTimeout, aRequestMap) : String</key>
	 * Tries to obtain aIndexMap from the REST aBaseURI service returning as a string (uses the HTTP GET method).
	 * Optionally you can provide aLogin, aPassword and/or aTimeout for the REST request or use a function (aLoginOrFunction)
	 * that receives the HTTP object.
	 * </odoc>
	 */
	get: function(aURL, aIdx, _l, _p, _t, aRequestMap) { 
		//plugin("HTTP");
		//var h = new HTTP();
		var h = new ow.obj.http();
		
		if (isUndefined(_l) && isUndefined(_p)) {
			var u = new java.net.URL(Packages.openaf.AFCmdBase.afc.fURL(aURL));
			if (u.getUserInfo() != null) {
				_l = String(java.net.URLDecoder.decode(u.getUserInfo().substring(0, u.getUserInfo().indexOf(":")), "UTF-8"));
				_p = String(java.net.URLDecoder.decode(u.getUserInfo().substring(u.getUserInfo().indexOf(":") + 1), "UTF-8"));
			}
		}
		
 		if (isDefined(_l) && isDefined(_p)) {
			h.login(_l, _p, false, aURL);
		} 
 		
 		if (isDef(_l) && isFunction(_l)) {
 			_l(h);
 		}
 		
 		try {
 			return h.exec(aURL + ow.obj.rest.writeIndexes(aIdx), "GET", undefined, aRequestMap, undefined, _t);
 		} catch(e) {
			e.message = "Exception " + e.message + "; error = " + stringify(h.getErrorResponse(true));
			throw e;
 		}
	},
	
	/**
	 * <odoc>
	 * <key>ow.obj.rest.jsonGet(aBaseURI, aIndexMap, aLoginOrFunction, aPassword, aTimeout, aRequestMap) : Map</key>
	 * Tries to obtain aIndexMap from the REST aBaseURI service returning as a map (uses the HTTP GET method).
	 * Optionally you can provide aLogin, aPassword and/or aTimeout for the REST request or use a function (aLoginOrFunction)
	 * that receives the HTTP object. 
	 * </odoc>
	 */
	jsonGet: function(aURL, aIdx, _l, _p, _t, aRequestMap) {
		return jsonParse(this.get(aURL, aIdx, _l, _p, _t, aRequestMap).response);
	},
	
	/**
	 * <odoc>
	 * <key>ow.obj.rest.create(aBaseURI, aIndexMap, aDataRowMap, aLoginOrFunction, aPassword, aTimeout, aRequestMap, urlEncode) : String</key>
	 * Tries to create a new aDataRowMap entry, identified by aIndexMap, on the REST aBaseURI service returning the reply as a string (uses the HTTP POST method).
	 * Optionally you can provide aLogin, aPassword and/or aTimeout for the REST request or use a function (aLoginOrFunction)
	 * that receives the HTTP object. If urlEncode=true the aDataRowMap will be converted into x-www-form-urlencoded instead of JSON.
	 * </odoc>
	 */
	create: function(aURL, aIdx, aDataRow, _l, _p, _t, aRequestMap, urlEncode) {
		//plugin("HTTP");
		//var h = new HTTP();
		var h = new ow.obj.http();

		if (isUndefined(_l) && isUndefined(_p)) {
			var u = new java.net.URL(Packages.openaf.AFCmdBase.afc.fURL(aURL));
			if (u.getUserInfo() != null) {
				_l = String(java.net.URLDecoder.decode(u.getUserInfo().substring(0, u.getUserInfo().indexOf(":")), "UTF-8"));
				_p = String(java.net.URLDecoder.decode(u.getUserInfo().substring(u.getUserInfo().indexOf(":") + 1), "UTF-8"));
			}
		}
		
		if (isDefined(_l) && isDefined(_p)) {
			h.login(_l, _p, false, aURL);
		} 
		
 		if (isDef(_l) && isFunction(_l)) {
 			_l(h);
 		}
		
		var rmap = (urlEncode) ?
				   merge({"Content-Type":"application/x-www-form-urlencoded"} , aRequestMap) :
				   merge({"Content-Type":"application/json"} , aRequestMap);

		try {
			return h.exec(aURL + ow.obj.rest.writeIndexes(aIdx), "POST", (urlEncode) ? ow.obj.rest.writeQuery(aDataRow) : stringify(aDataRow, undefined, ''), rmap, undefined, _t);
		} catch(e) {
			e.message = "Exception " + e.message + "; error = " + String(h.getErrorResponse(true));
			throw e;
		}
	},
	
	/**
	 * <odoc>
	 * <key>ow.obj.rest.jsonCreate(aBaseURI, aIndexMap, aDataRowMap, aLoginOrFunction, aPassword, aTimeout, aRequestMap, urlEncode) : Map</key>
	 * Tries to create a new aDataRowMap entry, identified by aIndexMap, on the REST aBaseURI service returning the reply as a map (uses the HTTP POST method).
	 * Optionally you can provide aLogin, aPassword and/or aTimeout for the REST request or use a function (aLoginOrFunction)
	 * that receives the HTTP object.  If urlEncode=true the aDataRowMap will be converted into x-www-form-urlencoded instead of JSON.
	 * </odoc>
	 */
	jsonCreate: function(aURL, aIdx, aDataRow, _l, _p, _t, aRequestMap, urlEncode) {
		return jsonParse(this.create(aURL, aIdx, aDataRow, _l, _p, _t, aRequestMap, urlEncode).response);
	},
	
	/**
	 * <odoc>
	 * <key>ow.obj.rest.set(aBaseURI, aIndexMap, aDataRowMap, aLoginOrFunction, aPassword, aTimeout, urlEncode) : String</key>
	 * Tries to set aDataRowMap entry, identified by aIndexMap, on the REST aBaseURI service returning the reply as a string (uses the HTTP PUT method).
	 * Optionally you can provide aLogin, aPassword and/or aTimeout for the REST request or use a function (aLoginOrFunction)
	 * that receives the HTTP object. If urlEncode=true the aDataRowMap will be converted into x-www-form-urlencoded instead of JSON.
	 * </odoc>
	 */
	set: function(aURL, aIdx, aDataRow, _l, _p, _t, aRequestMap, urlEncode) {
		//plugin("HTTP");
		//var h = new HTTP();
		var h = new ow.obj.http();

		if (isUndefined(_l) && isUndefined(_p)) {
			var u = new java.net.URL(Packages.openaf.AFCmdBase.afc.fURL(aURL));
			if (u.getUserInfo() != null) {
				_l = String(java.net.URLDecoder.decode(u.getUserInfo().substring(0, u.getUserInfo().indexOf(":")), "UTF-8"));
				_p = String(java.net.URLDecoder.decode(u.getUserInfo().substring(u.getUserInfo().indexOf(":") + 1), "UTF-8"));
			}
		}
		
		if (isDefined(_l) && isDefined(_p)) {
			h.login(_l, _p, false, aURL);
		} 
		
 		if (isDef(_l) && isFunction(_l)) {
 			_l(h);
 		}
		
		var rmap = (urlEncode) ?
		           merge({"Content-Type":"application/x-www-form-urlencoded"} , aRequestMap) :
				   merge({"Content-Type":"application/json"} , aRequestMap);
		
		try {
			return h.exec(aURL + ow.obj.rest.writeIndexes(aIdx), "PUT", (urlEncode) ? ow.obj.rest.writeQuery(aDataRow) : stringify(aDataRow, undefined, ''), rmap, undefined, _t);
		} catch(e) {
			e.message = "Exception " + e.message + "; error = " + String(h.getErrorResponse(true));
			throw e;
		}
	},

	/**
	 * <odoc>
	 * <key>ow.obj.rest.jsonSet(aBaseURI, aIndexMap, aDataRowMap, aLoginOrFunction, aPassword, aTimeout, urlEncode) : Map</key>
	 * Tries to set aDataRowMap entry, identified by aIndexMap, on the REST aBaseURI service returning the reply as a map (uses the HTTP PUT method).
	 * Optionally you can provide aLogin, aPassword and/or aTimeout for the REST request or use a function (aLoginOrFunction)
	 * that receives the HTTP object. If urlEncode=true the aDataRowMap will be converted into x-www-form-urlencoded instead of JSON.
	 * </odoc>
	 */
	jsonSet: function(aURL, aIdx, aDataRow, _l, _p, _t, aRequestMap, urlEncode) {
		return jsonParse(this.set(aURL, aIdx, aDataRow, _l, _p, _t, aRequestMap, urlEncode).response);
	},
	
	/**
	 * <odoc>
	 * <key>ow.obj.rest.remove(aBaseURI, aIndexMap, aLoginOrFunction, aPassword, aTimeout, aRequestMap) : String</key>
	 * Tries to remove aIndexMap entry from the REST aBaseURI service returning the reply as a string (uses the HTTP DELETE method).
	 * Optionally you can provide aLogin, aPassword and/or aTimeout for the REST request or use a function (aLoginOrFunction)
	 * that receives the HTTP object.
	 * </odoc>
	 */
	remove: function(aURL, aIdx, _l, _p, _t, aRequestMap) {
		//plugin("HTTP");
		//var h = new HTTP();
		var h = new ow.obj.http();
				
		if (isUndefined(_l) && isUndefined(_p)) {
			var u = new java.net.URL(Packages.openaf.AFCmdBase.afc.fURL(aURL));
			if (u.getUserInfo() != null) {
				_l = String(java.net.URLDecoder.decode(u.getUserInfo().substring(0, u.getUserInfo().indexOf(":")), "UTF-8"));
				_p = String(java.net.URLDecoder.decode(u.getUserInfo().substring(u.getUserInfo().indexOf(":") + 1), "UTF-8"));
			}
		}
		
		if (isDefined(_l) && isDefined(_p)) {
			h.login(_l, _p, false, aURL);
		} 
		
 		if (isDef(_l) && isFunction(_l)) {
 			_l(h);
 		}
		
		try {
			return h.exec(aURL + ow.obj.rest.writeIndexes(aIdx), "DELETE", undefined, aRequestMap, undefined, _t);
		} catch(e) {
			e.message = "Exception " + e.message + "; error = " + String(h.getErrorResponse(true));
			throw e;
		}
	},
	
	/**
	 * <odoc>
	 * <key>ow.obj.rest.jsonRemove(aBaseURI, aIndexMap, aLoginOrFunction, aPassword, aTimeout, aRequestMap) : Map</key>
	 * Tries to remove aIndexMap entry from the REST aBaseURI service returning the reply as a map (uses the HTTP DELETE method).
	 * Optionally you can provide aLogin, aPassword and/or aTimeout for the REST request or use a function (aLoginOrFunction)
	 * that receives the HTTP object.
	 * </odoc>
	 */
	jsonRemove: function(aURL, aIdx, _l, _p, _t, aRequestMap) {
		return jsonParse(this.remove(aURL, aIdx, _l, _p, _t, aRequestMap).response);
	},
	
	/**
	 * <odoc>
	 * <key>ow.obj.rest.writeIndexes(aPropsMap) : String</key>
	 * Given a map of REST API indexes (aPropsMap) will return a corresponding URI.
	 * </odoc>
	 */
	writeIndexes: function(aPropsObj) {
		var surl = "";
		
		for (var parName in aPropsObj) {
			var o = aPropsObj[parName];
			if (isObject(o)) o = JSON.stringify(o);
			surl += "/" + encodeURIComponent(parName) + "/" + encodeURIComponent(o);
		}
		
		return surl;
	},

	/**
	 * <odoc>
	 * <key>ow.obj.rest.writeQuery(aMap) : String</key>
	 * Given aMap will return a URL query string. Example:\
	 * "http://some.thing/other/stuff?" + ow.obj.rest.writeQuery({ a: 1, b: 2}));\
	 * \
	 * </odoc>
	 */
	writeQuery: function(aMap) {
		var str = [];
        for(var p in aMap)
            if (aMap.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(aMap[p]));
            }
        return str.join("&");
	}
};

OpenWrap.obj.prototype.pmSchema = {
	/**
	 * <odoc>
	 * <key>ow.obj.pmSchema.makeKey(aJavaPM) : String</key>
	 * Produces a key for the aJavaPM (a Java parameter map or Map) to identify the provided map in a pmSchema
	 * when using ow.obj.applySchema.
	 * </odoc>
	 */
	makeKey: function(javaPM) {
		if ((Object.prototype.toString.call(javaPM) != "[object JavaObject]")) 
			javaPM = af.toJavaParameterMap(javaPM);
		
		var keys = javaPM.getParameterNames();
		var k = [];
		while(keys.hasNext()) {
			var key = keys.next();
			k.push(key);
		}
		return k.sort().join(">-<");
	},
	
	sortMapKeys: function(someKeys) {
		for(var aKey in someKeys) {
			if (aKey.match(/\>\-\</)) {
				someKeys[aKey] = aKey.split(/\>\-\</).sort().join(">-<");
			}
		}
		return someKeys;
	},

	__buildSchemaFromJavaArrayList: function(javaAL) {
		var pmschema = {};
		var j = 0;

		var i = javaAL.iterator();
		while(i.hasNext()) {
			var pmvalue = i.next();
			var pmtype;
			if (pmvalue != null)
				pmtype = String(pmvalue.getClass()).replace(/.+\.([^\.]+)/, "$1");
			else
				pmtype = "Null";
			switch(pmtype) {
			case "ArrayList": pmschema = merge(pmschema, ow.obj.pmSchema.__buildSchemaFromJavaArrayList(pmvalue)); break;
			case "ParameterMap": 
				pmschema[ow.obj.pmSchema.makeKey(pmvalue)] = ow.obj.pmSchema.__buildSchemaFromJavaParameterMap(pmvalue); 
				break;
			}
		}

		return pmschema;
	},

    __applySchemaToJavaArrayList: function(javaAL, partSchema) {
    	ow.loadFormat();
		for(var i = 0; i < javaAL.size(); i++) {
			var pmvalue = javaAL.get(i);
			var pmtype;
			var sortedKeys;
			
			if (pmvalue != null)
				pmtype = String(pmvalue.getClass()).replace(/.+\.([^\.]+)/, "$1");
			else 
				pmtype = "Null";
			switch(pmtype) {
			case "ArrayList": 
				javaAL.set(i, ow.obj.pmSchema.__applySchemaToJavaArrayList(pmvalue, partSchema));
				break;
			case "ParameterMap": 
				if (isUndefined(sortedKeys)) sortedKeys = ow.obj.pmSchema.sortMapKeys(Object.keys(partSchema));
				javaAL.set(i, ow.obj.pmSchema.__applySchemaToJavaParameterMap(pmvalue, 
					partSchema[ow.format.string.closest(ow.obj.pmSchema.makeKey(pmvalue), sortedKeys)]));
				break;
			}
		}
	
		return javaAL;
	},

	__buildSchemaFromJavaParameterMap: function(javaPM) {
		var pmschema = {};
	
		var pms = javaPM.getParameterNames();
		while(pms.hasNext()) {
			var pm = pms.next();
			var pmvalue = javaPM.get(pm);
			var pmtype;
			if (pmvalue != null)
				pmtype = String(pmvalue.getClass()).replace(/.+\.([^\.]+)/, "$1");
			else
				pmtype = "Null";
			switch(pmtype) {
			case "ParameterMap": 
				pmschema[pm] = ow.obj.pmSchema.__buildSchemaFromJavaParameterMap(pmvalue); 
				break;
			case "ArrayList":
				pmschema[pm] = ow.obj.pmSchema.__buildSchemaFromJavaArrayList(pmvalue);
				break;
			default: pmschema[pm] = pmtype; break;
			}
		}
	
		return pmschema;
	},

	__applySchemaToJavaParameterMap: function(javaPM, partSchema) {
		var pms = javaPM.getParameterNames(); 

		while(pms.hasNext()) {
			var pm = pms.next();
			var pmvalue = javaPM.get(pm);
			var pmtype;
			
			if (pmvalue != null) 
				pmtype = String(pmvalue.getClass()).replace(/.+\.([^\.]+)/, "$1");
			else 
				pmtype = "Null";
			
			switch(pmtype) {
			case "ParameterMap":
				if (isDefined(partSchema[pm]))
					javaPM.setParameter(pm, ow.obj.pmSchema.__applySchemaToJavaParameterMap(javaPM.getParameter(pm), partSchema[pm]));
				break;
			case "ArrayList":
				if (isDefined(partSchema[pm]))
					javaPM.setArray(pm, ow.obj.pmSchema.__applySchemaToJavaArrayList(javaPM.getArray(pm), partSchema[pm]));
				break;
			default: 
				if (pmtype != partSchema[pm]) {
					switch(partSchema[pm]) {
					case "String": javaPM.setString(pm, pmvalue); break;
					case "Boolean": javaPM.setBoolean(pm, pmvalue); break;
					case "Double": javaPM.setDouble(pm, pmvalue); break;
					case "Long": javaPM.setLong(pm, pmvalue); break;
					case "Integer": javaPM.setInt(pm, pmvalue); break;
					case "DocumentFragmentImpl": javaPM.setXml(pm, pmvalue); break;
					case "Date": javaPM.setDate(pm, pmvalue); break;
					case "Null": javaPM.setNull(pm); break;
					case "Float": javaPM.setFloat(pm, pmvalue); break;
					}
				}
				break;
			}
		}
	
		return javaPM;
	},

	/**
	 * <odoc>
	 * <key>ow.obj.pmSchema.getSchema(aJavaPM) : Map</key>
	 * Builds a type schema from the provided aJavaPM (a Java Parameter Map) to be used with 
	 * ow.obj.pmSchema.toJavaParameterMap to enforce a schema of types. If aJavaPM is not a Java Parameter Map
	 * it will try to convert to one from a Map.
	 * </odoc>
	 */
	getSchema: function(javaPM) {
		if ((Object.prototype.toString.call(javaPM) != "[object JavaObject]")) 
			javaPM = af.toJavaParameterMap(javaPM);
		return ow.obj.pmSchema.__buildSchemaFromJavaParameterMap(javaPM);
	},

	/**
	 * <odoc>
	 * <key>ow.obj.pmSchema.applySchema(aJavaPM, aSchema) : JavaParameterMap</key>
	 * Given aSchema (produced by ow.obj.pmSchema.fromJavaParameterMap) and aJavaPM (a Java Parameter Map) it 
	 * corrects the types where needed (for example: enforce that a integer should really be a long). The corrected
	 * Java Parameter Map is returned. If aJavaPM is not a Java Parameter Map
	 * it will try to convert to Map and return an output Map instead of JavaParameterMap.
	 * </odoc>
	 */
	applySchema: function(javaPM, aSchema) {
		var isJava = true;
		if ((Object.prototype.toString.call(javaPM) != "[object JavaObject]")) {
			javaPM = af.toJavaParameterMap(javaPM);
			isJava = false;
		}
		if ((Object.prototype.toString.call(aSchema) == "[object JavaObject]")) 
			aSchema = af.fromJavaParameterMap(aSchema);
		
		var out = ow.obj.pmSchema.__applySchemaToJavaParameterMap(javaPM, aSchema);
		if (!isJava) out = af.fromJavaParameterMap(out);
		
		return out;
	}
};

/**
 * <odoc>
 * <key>ow.obj.getPath(aObject, aPath) : Object</key>
 * Given aObject it will try to parse the aPath a retrive the corresponding object under that path. Example:\
 * \
 * var a = { a : 1, b : { c: 2, d: [0, 1] } };\
 * \
 * print(ow.obj.getPath(a, "b.c")); // 2\
 * sprint(ow.obj.getPath(a, "b.d")); // [0, 1]\
 * print(ow.obj.getPath(a, "b.d[0]")); // 0\
 * \
 * </odoc>
 */
OpenWrap.obj.prototype.getPath = function(aObj, aPath) {
	// Moving to $$().get()
	if (!isObject(aObj)) return undefined;

	aPath = aPath.replace(/\[(\w+)\]/g, '.$1');
	aPath = aPath.replace(/^\./, '');       
	
    var a = aPath.split('.');
    for (var i = 0, n = a.length; i < n; ++i) {
        var k = a[i];
        if (k in aObj) {
            aObj = aObj[k];
        } else {
            return;
        }
    }
    return aObj;
};

/**
 * <odoc>
 * <key>ow.obj.setPath(aObject, aPath, aNewValue) : Object</key>
 * Given aObject it will try to parse the aPath a set the corresponding object under that path to aNewValue. Example:\
 * \
 * var a = { a : 1, b : { c: 2, d: [0, 1] } };\
 * \
 * sprint(ow.obj.setPath(a, "b.c", 123); // { a : 1, b : { c: 123, d: [0, 1] } }\
 * \
 * </odoc>
 */
OpenWrap.obj.prototype.setPath = function(aObj, aPath, aValue) {
	// Moving to $$().set()

    if (!isObject(aObj)) return undefined;
    var orig = aObj;

	aPath = aPath.replace(/\[(\w+)\]/g, '.$1');
	aPath = aPath.replace(/^\./, '');       
	
    var a = aPath.split('.');
    var prev, prevK;
    for (var i = 0, n = a.length; i < n; ++i) {
		var k = a[i];
		prev = aObj;
		prevK = k;
        if (k in aObj) {
            aObj = aObj[k];
        } else {
			aObj[k] = {};
			aObj = aObj[k];
        }
    }
    prev[prevK] = aValue;
    return orig;
};