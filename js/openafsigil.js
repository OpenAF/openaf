// OpenAF Sigil
// Copyright 2023 Nuno Aguiar

if (!(typeof isJavaObject == 'defined')) isJavaObject = () => false
const $$ = function(aObj) {
	const _r = {
        _ss: aString => {
            let result = []
            let word = ""
            let inQuotes = false
            for (let i = 0; i < aString.length; i++) {
                let char = aString[i]
                if (char === "." && !inQuotes) {
                    result.push(word)
                    word = ""
                } else if (char === "'") {
                    inQuotes = !inQuotes
                    if (!inQuotes) {
                        result.push(word)
                        word = ""
                    }
                } else {
                    word += char
                }
            }
            if (word) {
                result.push(word)
            }
            return result
        },
		/**
		 * <odoc>
		 * <key>$$.get(aPath) : Object</key>
		 * Given aObject it will try to parse the aPath and retrive the corresponding object under that path. Example:\
		 * \
		 * var a = { a : 1, b : { c: 2, d: [0, 1] } };\
		 * \
		 * print($$(a).get("b.c")); // 2\
		 * sprint($$(a).get("b.d")); // [0, 1]\
		 * print($$(a).get("b.d[0]")); // 0\
		 * \
		 * </odoc>
		 */
		get: (aPath) => {
            if (!$$(aObj).isObject()) return void 0;

			aPath = aPath.replace(/\[(\w+)\]/g, '.$1');
			aPath = aPath.replace(/^\./, '');       

			var a = _r._ss(aPath).filter(r => r.length > 0)
			for (var i = 0, n = a.length; i < n; ++i) {
				var k = a[i];
				if (k in aObj) {
					aObj = aObj[k];
				} else {
					return;
				}
			}
            return aObj;
		},
		/**
		 * <odoc>
		 * <key>$$.getI(aPath) : Object</key>
		 * Given aObject it will try to parse the aPath (in a case-insensitive way) and retrive the corresponding object under that path. Example:\
		 * \
		 * var a = { a : 1, b : { c: 2, d: [0, 1] } };\
		 * \
		 * print($$(a).getI("b.C")); // 2\
		 * sprint($$(a).getI("B.d")); // [0, 1]\
		 * print($$(a).getI("B.D[0]")); // 0\
		 * \
		 * </odoc>
		 */
        getI: aPath => {
            if (!$$(aObj).isObject()) return void 0

			aPath = aPath.replace(/\[(\w+)\]/g, '.$1')
			aPath = aPath.replace(/^\./, '')

			var a = _r._ss(aPath).filter(r => r.length > 0)
			for (var i = 0, n = a.length; i < n; ++i) {
				var k = a[i]

                if ($$(aObj).isMap()) {
                    var ks = {}, k2 = String(k).toUpperCase()
                    Object.keys(aObj).forEach(r => ks[r.toUpperCase()] = r)
                    
                    if (k2 in ks) {
                        aObj = aObj[ks[k2]]
                    } else {
                        return
                    }
                } else {
                    if (k in aObj) {
                        aObj = aObj[k];
                    } else {
                        return;
                    }
                }
			}
            return aObj
        },
		/**
		 * <odoc>
		 * <key>$$.set(aPath, aNewValue) : Object</key>
		 * Given aObject it will try to parse the aPath and set the corresponding object under that path to aNewValue. Example:\
		 * \
		 * var a = { a : 1, b : { c: 2, d: [0, 1] } };\
		 * \
		 * sprint($$(a).set("b.c", 123)); // { a : 1, b : { c: 123, d: [0, 1] } }\
		 * \
		 * </odoc>
		 */		
		set: (aPath, aValue) => {
			if (!$$(aObj).isObject()) return void 0;
			var orig = aObj;
		
			aPath = aPath.replace(/\[(\w+)\]/g, '.$1');
			aPath = aPath.replace(/^\./, '');       
			
			var a = _r._ss(aPath).filter(r => r.length > 0)
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
        },
		/**
		 * <odoc>
		 * <key>$$.unset(aPath) : Object</key>
		 * Given aObject it will try to parse the aPath and unset the corresponding object under that path. Example:\
		 * \
		 * var a = { a : 1, b : { c: 2, d: [0, 1] } };\
		 * \
		 * sprint($$(a).set("b.c")); // { a : 1, b : { d: [0, 1] } }\
		 * \
		 * </odoc>
		 */		
        unset: aPath => {
            if (!$$(aObj).isObject()) return void 0
            var orig = aObj

            aPath = aPath.replace(/\[(\w+)\]/g, '.$1')
			aPath = aPath.replace(/^\./, '')

            var a = _r._ss(aPath).filter(r => r.length > 0)
            var prev, prevK
            for (var i = 0, n = a.length; i < n; ++i) {
				var k = a[i]
				prev = aObj
				prevK = k
				if (k in aObj) {
					aObj = aObj[k]
				} else {
					aObj[k] = {}
					aObj = aObj[k]
				}
			}
			delete prev[prevK]
			return orig
        },
        isDef: () => isJavaObject(aObj) || typeof aObj !== 'undefined',
        isUnDef: () => !isJavaObject(aObj) && typeof aObj == 'undefined',
        isJavaObject: () => isJavaObject(aObj),
        isArray: () => Array.isArray(aObj),
        isMap: () => Object.prototype.toString.call(aObj) == "[object Object]",
        isObject: () => { var type = typeof aObj; return type === 'function' || type === 'object' && !!aObj; },
        isFunction: () => { return typeof aObj == 'function' || false; },
        isString: () => { return typeof aObj == 'string' || false; },
        isNumber: () => { return !isNaN(parseFloat(aObj)) && isFinite(aObj); },
        isTNumber: () => { return typeof aObj == 'number' || false; },
        isBoolean: () => { return typeof aObj == 'boolean' || false; },
        isNull: () => { return null == aObj || false; },
        isDate: () => { return (null != aObj) && !isNaN(aObj) && ("undefined" !== typeof aObj.getDate); },
        isRegExp: () => { return (aObj instanceof RegExp); },
        isUUID: () => { return (aObj.match(/^\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b$/) ? true : false); },
        isSchema: (aSchema, aOptions) => {
            if (typeof Ajv == 'undefined') {
                if (typeof loadAjv != 'undefined')
                    loadAjv();
                else
                    throw "Ajv library not loaded.";
            }

            ow.loadObj();
            return ow.obj.schemaValidate(aSchema, aObj, aOptions);
        }
	};
	return _r;
};


const _$ = function(aValue, aPrefixMessage) {
    var defined, exceptions = [], _c = 0, parts = [ ]
    if ($$(aPrefixMessage).isDef()) aPrefixMessage += " "; else aPrefixMessage = "";
    if ($$(aValue).isDef()) defined = true; else defined = false;

    const __r = {
        // Defaults
        /**
         * <odoc>
         * <key>_$(aObject, anErrorMessagePrefix)</key>
         * Shortcut to facilitate argument pre-validation and promote defensive programming.\
         * \
         * .default(aNewObject) : aObject\
         * Checks if aObject is defined and returns aObject. If it's not defined it will return aNewObject (the default value).\
         * \
         * $_(aMessage) : aObject\
         * Throws an exception with aMessage if aObject is not defined otherwise returns aObject.
         * </odoc>
         */
        default : (aVal) => {
            // Handle parts of exceptions
            parts.push({ e: exceptions, c: _c })
            var _c_ok = 0
            parts.forEach(p => {
                if (p.c > p.e.length || p.e.length == 0) _c_ok++ 
            })
            if (_c_ok < parts.length) {
                throw parts.map(p => p.e.join("; ")).join(" and ")
            }
            
            // Return the proper value
            if (!defined) return aVal; else return aValue;
        },
        $_ : (aMessage) => {
            // Check if defined or assigned
			if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "not defined or assigned";
			if (!defined) exceptions.push(aMessage)

            // Handler parts of exceptions
            parts.push({ e: exceptions, c: _c })
            var _c_ok = 0
            parts.forEach(p => {
                if (p.c > p.e.length || p.e.length == 0) _c_ok++ 
            })
            if (_c_ok < parts.length) {
                throw parts.map(p => p.e.join("; ")).join(" and ")
            }

			return aValue;
		},
        or: () => {
            parts.push({ e: exceptions, c: _c })
            _c = 0
            exceptions = []

            return __r
        },
		// Type check and conversion
        isNumber: (aMessage) => {
            _c++
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "is not a number";
            if (defined && !$$(aValue).isNumber()) exceptions.push(aMessage)
            return __r;
        },
        toNumber: (aMessage) => {
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "can't be converted to number"
            if (defined) try { aValue = Number(aValue) } catch(e) { exceptions.push(aMessage) }
            return __r
        },
        isTNumber: (aMessage) => {
            _c++
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "is not a number type";
            if (defined && !$$(aValue).isTNumber()) exceptions.push(aMessage)
            return __r;
        },
        isString: (aMessage) => {
            _c++
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "is not a string";
            if (defined && !$$(aValue).isString()) exceptions.push(aMessage)
            return __r;
        },
        toString: (aMessage) => {
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "can't be converted to string"
            if (defined) try { aValue = String(aValue) } catch(e) { exceptions.push(aMessage) }
            return __r
        },
        isBoolean: (aMessage) => {
            _c++
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "is not boolean";
            if (defined && (typeof aValue !== "boolean")) exceptions.push(aMessage)
            return __r;
        },
        toBoolean: (aMessage) => {
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "can't be converted to a boolean"
            if (defined) try { 
                if ($$(aValue).isNumber()) aValue = Boolean(aValue);
                if ($$(aValue).isString()) aValue = (aValue.trim().toLowerCase() == 'true');
            } catch(e) { exceptions.push(aMessage) }
            return __r
        },
        isArray: (aMessage) => {
            _c++
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "is not an array";
            if (defined && !$$(aValue).isArray()) exceptions.push(aMessage)
            return __r;
        },
        toArray: (aMessage) => {
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "can't be converted to an array"
            if (defined) try { aValue = String(aValue).split(",").map(r => r.trim()) } catch(e) { exceptions.push(aMessage) }
            return __r
        },  
        isMap: (aMessage) => {
            _c++
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "is not a map";
            if (defined && !$$(aValue).isMap()) exceptions.push(aMessage)
            return __r;
        }, 
        toMap: (aMessage) => {
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "can't be converted to a map"
            if (defined) 
              try { 
                var __f = j => { return ($$(global.jsonParse).isFunction() ? global.jsonParse(j, true) : JSON.parse(j)) }
                aValue = __f(aValue) 
              } catch(e) { exceptions.push(aMessage) }
            return __r
        },
        isObject: (aMessage) => {
            _c++
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "is not an object";
            if (defined && !$$(aValue).isObject()) exceptions.push(aMessage)
            return __r;
        },
        isDate: (aMessage) => {
            _c++
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "is not a date";
            if (defined && !$$(aValue).isDate()) exceptions.push(aMessage)
            return __r;
        },    
        toDate: (aMessage) => {
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "can't be converted to date"
            if (defined) try { aValue = new Date(aValue) } catch(e) { exceptions.push(aMessage) }
            return __r
        },
        isRegExp: (aMessage) => {
            _c++
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "is not a RegExp";
            if (defined && !$$(aValue).isRegExp()) exceptions.push(aMessage)
            return __r;
        },                    
        isFunction: (aMessage) => {
            _c++
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "is not a function";
            if (defined && !$$(aValue).isFunction()) exceptions.push(aMessage);
            return __r;
        },        
		isJavaObject: (aMessage) => {
            _c++
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "is not a java object";
            if (defined && !isJavaObject(aValue)) exceptions.push(aMessage)
            return __r;
		},
		isInstanceOf: (aClass, aMessage) => {
            _c++
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "is not an instance of " + aClass;
            if (defined && !(aValue instanceof aClass)) exceptions.push(aMessage)
            return __r;
        },
        isNotNull: (aMessage) => {
            _c++
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "is null";
            if (defined && (aValue == null)) exceptions.push(aMessage)
            return __r;
        },
        isUUID: (aMessage) => {
            _c++
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "is not an UUID";
            if (defined && (!$$(aValue).isString() || aValue.match(/^\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b$/))) exceptions.push(aMessage)
            return __r;
        },
        isSchema: (aSchema, aMessage, aOptions) => {
            _c++
            if (typeof Ajv == 'undefined') {
                if (typeof loadAjv != 'undefined')
                    loadAjv();
                else
                    throw "Ajv library not loaded.";
            }

            ow.loadObj(); 
            try { 
                ow.obj.schemaValidate(aSchema, aValue, aOptions);
            } catch(e) { 
                if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + " " + String(e);
                exceptions.push(aMessage)
            }
            return __r;
        },
		// Generic validations
        check: (aFunction, aMessage) => {
            _c++
			if (!$$(aFunction).isFunction() && !$$(aFunction).isString()) throw "please provide a function to check";
            var res = ($$(aFunction).isFunction() ? aFunction(aValue) : (newFn('v', 'return ' + aFunction))(aValue));
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "is not ok";
            if (defined && !res) exceptions.push(aMessage)
            return __r;
        },
        expr: (aEval, aMessage) => {
            _c++
			if (!$$(aEval).isString()) throw "please provide an expression";
            var res = af.eval(templify(aEval, { v: aValue }));
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "is not ok";
            if (defined && !res) exceptions.push(aMessage)
            return __r;
		},
		equals: (aVal, aMessage) => {
            _c++
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "is equals to " + aVal;
            if (defined && aValue == aVal) exceptions.push(aMessage)
            return __r;
        }        ,
        notEquals: (aVal, aMessage) => {
            _c++
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "is not equals to " + aVal;
            if (defined && aValue != aVal) exceptions.push(aMessage)
            return __r;
		},
		anyOf: (aVals, aMessage) => {
            _c++
			if (!$$(aVals).isArray()) throw "please provide an array of values";
			if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "has a value not in " + JSON.stringify(aVals);
			if (defined && $$(aValue).isArray()) {
				aValue.forEach((v) => { 
					if (aVals.indexOf(v) < 0) exceptions.push(aMessage)
				});
            }
            return __r;
		},
		oneOf: (aVals, aMessage) => {
            _c++
			if (!$$(aVals).isArray()) throw "please provide an array of values";
			if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "is not one of " + JSON.stringify(aVals);
            if (defined && !$$(aValue).isArray() && aVals.indexOf(aValue) < 0) exceptions.push(aMessage)
            return __r;
		},
		
		// Numeric validations
        between: (aValA, aValB, aMessage) => {
            _c++
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "is not between " + aValA + " and " + aValB;
            if (defined && (aValue >= aValB || aValue <= aValA)) exceptions.push(aMessage)
        },
        betweenEquals: (aValA, aValB, aMessage) => {
            _c++
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "is not between " + aValA + " and " + aValB;
            if (defined && (aValue > aValB || aValue < aValA)) exceptions.push(aMessage)
        },        
        less: (aVal, aMessage) => {
            _c++
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "is less than " + aVal;
            if (defined && aValue >= aVal) exceptions.push(aMessage)
            return __r;
        },
        lessEquals: (aVal, aMessage) => {
            _c++
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "is less or equals than " + aVal;
            if (defined && aValue > aVal) exceptions.push(aMessage)
            return __r;
        },
        greater: (aVal, aMessage) => {
            _c++
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "is greater than " + aVal;
            if (defined && aValue <= aVal) exceptions.push(aMessage)
            return __r;
        },
        greaterEquals: (aVal, aMessage) => {
            _c++
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "is greater or equals than " + aVal;
            if (defined && aValue < aVal) exceptions.push(aMessage)
            return __r;
        },
		
		// String validations
        notEmpty: (aMessage) => {
            _c++
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "is empty";
            if (defined && String(aValue) == "") exceptions.push(aMessage)
            return __r;
        },
        empty: (aMessage) => {
            _c++
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "is not empty";
            if (defined && String(aValue) != "") exceptions.push(aMessage)
            return __r;
        },
        contains: (aVal, aMessage) => {
            _c++
			if (!$$(aVal).isString()) throw "please provide a string to check if contains";
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "doesn't contain " + aVal;
            if (defined && String(aValue).indexOf(aVal) < 0) exceptions.push(aMessage)
            return __r;
        },
        notContains: (aVal, aMessage) => {
            _c++
			if (!$$(aVal).isString()) throw "please provide a string to check if not contains";
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "contains " + aVal;
            if (defined && String(aValue).indexOf(aVal) >= 0) exceptions.push(aMessage)
            return __r;
        },
        starts: (aVal, aMessage) => {
            _c++
			if (!$$(aVal).isString()) throw "please provide a string to check if it starts with";
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "doesn't start with '" + aVal + "'";
            if (defined && !(aValue.startsWith(aValu))) exceptions.push(aMessage)
            return __r;
        },
        ends: (aVal, aMessage) => {
            _c++
			if (!$$(aVal).isString()) throw "please provide a string to check if it ends with";			
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "doesn't end with '" + aVal + "'";
            if (defined && !(aValue.endsWith(aVal))) exceptions.push(aMessage)
            return __r;
        },
        notStarts: (aVal, aMessage) => {
            _c++
			if (!$$(aVal).isString()) throw "please provide a string to check if it not starts with";			
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "starts with '" + aVal + "'";
            if (defined && (aValue.startsWith(aValu))) exceptions.push(aMessage)
            return __r;
        },
        notEnds: (aVal, aMessage) => {
            _c++
			if (!$$(aVal).isString()) throw "please provide a string to check if it not ends with";			
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "ends with '" + aVal + "'";
            if (defined && (aValue.endsWith(aVal))) exceptions.push(aMessage)
            return __r;
        },
        regexp: (aRegExp, aMessage) => {
            _c++
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "doesn't match '" + aRegExp + "'";
            if (!(aRegExp instanceof RegExp)) throw "is not a regular expression (" + aRegExp + ")";
            if (defined && !aRegExp.test(aValue)) exceptions.push(aMessage)
            return __r;
        },
        javaRegexp: (aRegExp, aMods, aMessage) => {
            _c++
			if ($$(aRegExp).isUnDef() || !$$(aRegExp).isString()) throw "please provide a regular expression string";
            if ($$(aMessage).isUnDef()) aMessage = aPrefixMessage + "doesn't match '" + aRegExp + "'";
            if (defined && !javaRegExp(aValue).test(aRegExp, aMods)) exceptions.push(aMessage)
            return __r;
        }
    };
    return __r;
};
