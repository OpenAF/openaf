/* Author: Nuno Aguiar */

var nLinq_USE_CASE = false;
var nLinq = function(anObject, aK) {
    // Verify input
    if ($$(anObject).isMap()) {
        aK = _$(aK, "aKey").isString().default("_key")
        anObject = Object.keys(anObject).map(k => {
            if ($$(anObject[k]).isMap()) anObject[k][aK] = k;
            return anObject[k];
        });
    }

    //_$(anObject).isArray().$_();
    var res = anObject, where = "", useCase = nLinq_USE_CASE, useOr = false, useNot = false, alimit = 0, askip = 0, negative = false, whereFn = [];

    // Auxiliary functions

    var aCompare = function(x, y) {
        'use strict';
    
        if (x === null || x === undefined || y === null || y === undefined) { return x === y; }
        if (x.constructor !== y.constructor) { return false; }
        if (x instanceof Function) { return x === y; }
        if (x instanceof RegExp) { return x === y; }
        if (x === y || x.valueOf() === y.valueOf()) { return true; }
        if (Array.isArray(x) && x.length !== y.length) { return false; }
        if (x instanceof Date) { return false; }
        if (!(x instanceof Object)) { return false; }
        if (!(y instanceof Object)) { return false; }
    
        var p = Object.keys(x), q = Object.keys(y);
        if (p.length != q.length) return false;
        for(var k in x) { 
            var v = x[k];
            if ($$(y[k]).isUnDef() || (!aCompare(v, y[k]))) return false;
        }
        
        return true;
    }

    var aArrayContains = function(anArray, aObj, aPreFilter) {
        _$(anArray).isArray().$_();
    
        var ii, found = false;
        for(ii = 0; ii < anArray.length && !found; ii++) {
            var o = (isFunction(aPreFilter)) ? aPreFilter(anArray[ii]) : anArray[ii];
            if (aCompare(aObj, o)) found = true;
        }
    
        return (found ? ii-1 : -1);
    }

    var aSortMap = function(aMap) {
        if (!$$(aMap).isMap()) return aMap;

        var rrr = {}, ks = Object.keys(aMap).sort();
        ks.forEach(k => {
            rrr[k] = ($$(aMap[k]).isMap() ? aSortMap(aMap[k]) : aMap[k]);
        });
        return rrr;
    }
    
    var aException = function(aArrayA, aArrayB) {
        var cb = aArrayB.map(r => JSON.stringify(aSortMap(r), void 0, ""));
        return aArrayA.filter(r => cb.indexOf(JSON.stringify(aSortMap(r), void 0, "")) < 0);
    }
    
    var aIntersection = function(aArrayA, aArrayB) {
        var cb = aArrayB.map(r => JSON.stringify(aSortMap(r), void 0, ""));
        return aArrayA.filter(r => cb.indexOf(JSON.stringify(aSortMap(r), void 0, "")) >= 0);
    }
    
    var aUnion = function(aArrayA, aArrayB) {
        var ca = aArrayA.map(r => JSON.stringify(aSortMap(r), void 0, ""));
        return aArrayA.concat(aArrayB.filter(r => ca.indexOf(JSON.stringify(aSortMap(r), void 0, "")) < 0));
    }

    var aCartesian = function(aArrayA, aArrayB) {
        return aArrayA.map(n => aArrayB.map(m => isMap(m) ? merge(n, m) : [n, m])).reduce((a, v) => a.concat(v));
    }

    // Auxiliary functions - apply query conditions
    var applyConditions = (aOrig, aFunc) => {
        if ($$(aOrig).isFunction()) aOrig = aOrig();
        if (!$$(aOrig).isArray()) aOrig = [ aOrig ];
        if ($$(aOrig).isUnDef()) return void 0;

        if (where.length == 0) {
            if (negative) return [];

            if (askip != 0) {
                aOrig = aOrig.slice(askip);
            }
            if (alimit != 0) {
                return aOrig.slice(alimit < 0 ? alimit : 0, alimit > 0 ? alimit : void 0);
            } else {
                return aOrig;
            }
        }

        where = where.replace(/\;/g, " ");
        var f;
        if (isFunction(aFunc)) {
            f = aFunc;
        } else {
            f = newFn("r", "whereFn", "return $$(r).isDef() ? (" + where + ") : void 0");
        }
        if (alimit != 0) {
            if (negative) 
                res = aOrig.filter(r => !f(r, whereFn)).slice(alimit < 0 ? alimit : 0, alimit > 0 ? alimit : void 0);
            else 
                res = aOrig.filter(r => f(r, whereFn)).slice(alimit < 0 ? alimit : 0, alimit > 0 ? alimit : void 0);
        } else {
            if (negative)
                res = aOrig.filter(r => !f(r, whereFn));
            else
                res = aOrig.filter(r => f(r, whereFn));
        }
        if (askip != 0) {
            res = res.slice(askip);
        }
        return res;
    };

    // Auxiliary functions - verify the provided key
    var vKey = (aKey) => {
        if ($$(aKey).isString() && aKey.replace(/^[^a-zA-Z_$]|[^\w\[\]\.$]/g, "") == aKey) {
            return aKey;
        } else {
            if ($$(aKey).isDef()) throw "'" + aKey + "' is not a valid key."; else return void 0;
        }
    };

    // Auxiliary functions - verify the provided value
    var vValue = aValue => {
        if (!($$(aValue).isNumber() || $$(aValue).isBoolean())) { 
            if ($$(aValue).isString()) aValue = (!useCase ? aValue.toLowerCase() : aValue); 
            aValue = JSON.stringify(aValue, void 0, "");
        }
        return aValue;
    };

    var flatObj = aObj => {
        var _t = (aMap, aFunc, aParent) => {
            var keys = Object.keys(aMap)
            _$(aFunc, "aFunc").isFunction().$_()
            var aParent = _$(aParent).isString().default("")
        
            for(var i in keys) {
                if ($$(aMap[keys[i]]).isMap() || $$(aMap[keys[i]]).isArray()) {
                    var newParent = ((aParent == "") ? "" : aParent + ".") + keys[i]
                    _t(aMap[keys[i]], aFunc, newParent)
                } else {
                    aFunc(keys[i], aMap[keys[i]], aParent, aMap)
                }
            }
        }
    
        var _m = {}
        _t(aObj, (aK, aV, aP, aO) => {
            _m[aP + (aP == "" ? "" : ".") + aK] = aV
        })
        return _m
    }

    // Auxiliary functions - given a key, a value, a query template app change the current query
    var applyWhere = (aKey, aValue, aTmpl, isOr, isTwoValues, aValue2) => {
        // If aKey is a map perform multiple applies
        if ($$(aValue2).isUnDef() && $$(aKey).isMap()) {
            var _m = flatObj(aKey)
            Object.keys(_m).forEach(k => {
                applyWhere(k, _m[k], aTmpl, isOr)
            })
            return
        }

        var isM, useDot = true;
        if (isTwoValues) {
            isM = $$(aValue2).isDef();
            var origValue = aValue;
            aValue  = vValue(isM ? aValue : aKey);
            aValue2 = vValue(isM ? aValue2 : origValue);
        } else {
            isM = $$(aValue).isDef();
            aValue = vValue(isM ? aValue : aKey);
            try {
                aKey = isM ? vKey(aKey) : void 0;
            } catch(e) {
                if (String(e).indexOf("is not a valid key") > 0) {
                    useDot = false;
                } else {
                    throw e;
                }
            }
        }

        if (aTmpl.indexOf("{ki}") >= 0) aTmpl = aTmpl.replace(/{ki}/g, ($$(aValue).isString() && !useCase ? ".toLowerCase()" : ""));
        if (aTmpl.indexOf("{ski}") >= 0) aTmpl = aTmpl.replace(/{ski}/g, ($$(aValue).isString() && !useCase ? "String(" : ""));
        if (aTmpl.indexOf("{eki}") >= 0) aTmpl = aTmpl.replace(/{eki}/g, ($$(aValue).isString() && !useCase ? ").toLowerCase()" : ""));
        if (isM) aTmpl = aTmpl.replace(/{k}/g, (!useDot ? "$$$$(r).get(" + JSON.stringify(aKey) + ")" : "r." + aKey)); else aTmpl = aTmpl.replace(/{k}/g, "r");
        
        if ($$(aValue).isString()) aValue = aValue.replace(/\$/g, "$$$");
        if ($$(aValue2).isDef()) {
            if ($$(aValue2).isString()) aValue2 = aValue2.replace(/\$/g, "$$$");
            aValue2 = vValue(aValue2);
            aTmpl = aTmpl.replace(/{v}/g, aValue).replace(/{v2}/g, aValue2);
        } else {
            aTmpl = aTmpl.replace(/{v}/g, aValue);
        }
        applyWhereTmpl(aTmpl, isOr);
    };

    // Auxiliary functions - append a sub-query to the current query 
    var applyWhereTmpl = (aTmpl, isOr) => {
        isOr = _$(isOr).default(useOr);

        if (where.length > 0) {
            if (!isOr) {
                where += " && ";
            } else {
                where = "(" + where + ") || ";
            }
        }
        where += "(" + aTmpl + ")";
    };

    // Main code
    var code = {
        _setState    : aMap => {
            _$(aMap, "map").isMap().$_();
            where   = aMap.where;
            useCase = aMap.useCase;
            useOr   = aMap.useOr;
            useNot  = aMap.useNot;
            alimit  = aMap.alimit;
            askip   = aMap.askip;
            negative = aMap.negative;
            whereFn  = aMap.whereFn;

            return code;
        },
        _getState    : () => {
            return {
                where: where,
                useCase: useCase,
                useOr: useOr,
                useNot: useNot,
                alimit: alimit,
                askip: askip,
                negative: negative,
                whereFn: whereFn
            };
        },
        // Change default behaviour
        useCase      : aTmpl => { useCase = ($$(aTmpl).isUnDef() || aTmpl ? true : false); return code; },
        ignoreCase   : aTmpl => { useCase = ($$(aTmpl).isUnDef() || aTmpl ? false : true); return code; },
        limit        : aNum  => { if ($$(aNum).isNumber()) { alimit = aNum; } return code; },
        head         : aNum  => { code.limit(aNum); return code; },
        tail         : aNum  => { if ($$(aNum).isNumber()) { alimit = -aNum; } return code; },
        // TODO: Support remembering the previous key if none provided
        or           : () => { useOr = true; return code; },
        and          : () => { useOr = false; return code; },
        not          : () => { useNot = true; return code; },
        andNot       : () => { useOr = false; useNot = true; return code; },
        orNot        : () => { useOr = true; useNot = true; return code; },

        // WHEREs
        setWhere     : aTmpl => { applyWhereTmpl(aTmpl, false); return code; },
        where        : aFn   => { if (useOr) { if (useNot) code.orNotWhere(aFn); else code.orWhere(aFn); } else { if (useNot) code.andNotWhere(aFn); else code.andWhere(aFn); } return code; },
        orWhere      : aFn   => {
            _$(aFn, "fn").isFunction().$_();

            whereFn.push(aFn);
            applyWhereTmpl("whereFn[" + (whereFn.length-1) + "](r)", true);
            return code;
        },
        andWhere     : aFn   => {
            _$(aFn, "fn").isFunction().$_();

            whereFn.push(aFn);
            applyWhereTmpl("whereFn[" + (whereFn.length-1) + "](r)", false);
            return code;
        },
        notWhere     : aFn   => { if (useOr) code.orNotWhere(aFn); else code.andNotWhere(aFn); return code; },
        andNotWhere  : aFn   => {
            _$(aFn, "fn").isFunction().$_();

            whereFn.push(aFn);
            applyWhereTmpl("!whereFn[" + (whereFn.length-1) + "](r)", false);
            return code;
        },
        orNotWhere   : aFn   => {
            _$(aFn, "fn").isFunction().$_();

            whereFn.push(aFn);
            applyWhereTmpl("!whereFn[" + (whereFn.length-1) + "](r)", true);
            return code;
        },

        // Main queries
        starts       : (aKey, aValue) => { if (useOr) { if (useNot) code.orNotStarts(aKey, aValue); else code.orStarts(aKey, aValue); } else { if (useNot) code.andNotStarts(aKey, aValue); else code.andStarts(aKey, aValue); } return code; },
        ends         : (aKey, aValue) => { if (useOr) { if (useNot) code.orNotEnds(aKey, aValue); else code.orEnds(aKey, aValue); } else { if (useNot) code.andNotEnds(aKey, aValue); else code.andEnds(aKey, aValue); } return code; },
        equals       : (aKey, aValue) => { if (useOr) { if (useNot) code.orNotEquals(aKey, aValue); else code.orEquals(aKey, aValue); } else { if (useNot) code.andNotEquals(aKey, aValue); else code.andEquals(aKey, aValue); } return code; },
        greater      : (aKey, aValue) => { if (useOr) { if (useNot) code.orNotGreater(aKey, aValue); else code.orGreater(aKey, aValue); } else { if (useNot) code.andNotGreater(aKey, aValue); else code.andGreater(aKey, aValue); } return code; },
        less         : (aKey, aValue) => { if (useOr) { if (useNot) code.orNotLess(aKey, aValue); else code.orLess(aKey, aValue); } else { if (useNot) code.andNotLess(aKey, aValue); else code.andLess(aKey, aValue); } return code; },
        greaterEquals: (aKey, aValue) => { if (useOr) { if (useNot) code.orNotGreaterEquals(aKey, aValue); else code.orGreaterEquals(aKey, aValue); } else { if (useNot) code.andNotGreaterEquals(aKey, aValue); else code.andGreaterEquals(aKey, aValue); } return code; },
        lessEquals   : (aKey, aValue) => { if (useOr) { if (useNot) code.orNotLessEquals(aKey, aValue); else code.orLessEquals(aKey, aValue); } else { if (useNot) code.andNotLessEquals(aKey, aValue); else code.andLessEquals(aKey, aValue); } return code; },
        contains     : (aKey, aValue) => { if (useOr) { if (useNot) code.orNotContains(aKey, aValue); else code.orContains(aKey, aValue); } else { if (useNot) code.andNotContains(aKey, aValue); else code.andContains(aKey, aValue); } return code; },
        empty        : (aKey, aValue) => { if (useOr) { if (useNot) code.orNotEmpty(aKey, aValue); else code.orEmpty(aKey, aValue); } else { if (useNot) code.andNotEmpty(aKey, aValue); else code.andEmpty(aKey, aValue); } return code; },
        match        : (aKey, aValue) => { if (useOr) { if (useNot) code.orNotMatch(aKey, aValue); else code.orMatch(aKey, aValue); } else { if (useNot) code.andNotMatch(aKey, aValue); else code.andMatch(aKey, aValue); } return code; },
        type         : (aKey, aValue) => { if (useOr) { if (useNot) code.orNotType(aKey, aValue); else code.orType(aKey, aValue); } else { if (useNot) code.andNotType(aKey, aValue); else code.andType(aKey, aValue); } return code; },
        between      : (aKey, aV1, aV2) => { if (useOr) { if (useNot) code.orNotBetween(aKey, aV1, aV2); else code.orBetween(aKey, aV1, aV2); } else { if (useNot) code.andNotBetween(aKey, aV1, aV2); else code.andBetween(aKey, aV1, aV2); } return code; },
        betweenEquals: (aKey, aV1, aV2) => { if (useOr) { if (useNot) code.orNotBetweenEquals(aKey, aV1, aV2); else code.orBetweenEquals(aKey, aV1, aV2); } else { if (useNot) code.andNotBetweenEquals(aKey, aV1, aV2); else code.andBetweenEquals(aKey, aV1, aV2); } return code; },
        is           : (aKey) => { if (useOr) { if (useNot) code.orNotIs(aKey); else code.orIs(aKey); } else { if (useNot) code.andNotIs(aKey); else code.andIs(aKey); } return code; },

        // Queries with and
        andStarts       : (aKey, aValue) => { applyWhere(aKey, aValue, "String({k}){ki}.startsWith({v})", false); return code; },
        andEnds         : (aKey, aValue) => { applyWhere(aKey, aValue, "String({k}){ki}.endsWith({v})", false); return code; },
        andEquals       : (aKey, aValue) => { applyWhere(aKey, aValue, "{ski}{k}{eki} == {v}", false); return code; },
        andGreater      : (aKey, aValue) => { applyWhere(aKey, aValue, "{ski}{k}{eki} > {v}", false); return code; },
        andLess         : (aKey, aValue) => { applyWhere(aKey, aValue, "{ski}{k}{eki} < {v}", false); return code; },
        andGreaterEquals: (aKey, aValue) => { applyWhere(aKey, aValue, "{ski}{k}{eki} >= {v}", false); return code; },
        andLessEquals   : (aKey, aValue) => { applyWhere(aKey, aValue, "{ski}{k}{eki} <= {v}", false); return code; },
        andContains     : (aKey, aValue) => { applyWhere(aKey, aValue, "String({k}){ki}.indexOf({v}) >= 0", false); return code; },
        andEmpty        : (aKey, aValue) => { applyWhere(aKey, "", "($$({k}).isUnDef() || String({k}){ki}.length == 0)", false); return code; },
        andMatch        : (aKey, aValue) => { applyWhere(aKey, aValue, "String({k}){ki}.match({v})", false); return code; },
        andType         : (aKey, aValue) => { applyWhere(aKey, aValue, "typeof {k} == {v}", false); return code; },
        andBetween      : (aKey, aV1, aV2) => { applyWhere(aKey, aV1, "({ski}{k}{eki} > {v} && {ski}{k}{eki} < {v2})", false, true, aV2); return code; },
        andBetweenEquals: (aKey, aV1, aV2) => { applyWhere(aKey, aV1, "({ski}{k}{eki} >= {v} && {ski}{k}{eki} <= {v2})", false, true, aV2); return code; },
        andIs           : (aKey) => { applyWhere(aKey, "", "{k} != null && {k}", false); return code; },

        // Queries with not
        notStarts       : (aKey, aValue) => { if (useOr) code.orNotStarts(aKey, aValue); else code.andNotStarts(aKey, aValue); return code; },
        notEnds         : (aKey, aValue) => { if (useOr) code.orNotEnds(aKey, aValue); else code.andNotEnds(aKey, aValue); return code; },
        notEquals       : (aKey, aValue) => { if (useOr) code.orNotEquals(aKey, aValue); else code.andNotEquals(aKey, aValue); return code; },
        notGreater      : (aKey, aValue) => { if (useOr) code.orNotGreater(aKey, aValue); else code.andNotGreater(aKey, aValue); return code; },
        notLess         : (aKey, aValue) => { if (useOr) code.orNotLess(aKey, aValue); else code.andNotLess(aKey, aValue); return code; },
        notGreaterEquals: (aKey, aValue) => { if (useOr) code.orNotGreaterEquals(aKey, aValue); else code.andNotGreaterEquals(aKey, aValue); return code; },
        notLessEquals   : (aKey, aValue) => { if (useOr) code.orNotLessEquals(aKey, aValue); else code.andNotLessEquals(aKey, aValue); return code; },
        notContains     : (aKey, aValue) => { if (useOr) code.orNotContains(aKey, aValue); else code.andNotContains(aKey, aValue); return code; },
        notEmpty        : (aKey, aValue) => { if (useOr) code.orNotEmpty(aKey, aValue); else code.andNotEmpty(aKey, aValue); return code; },
        notMatch        : (aKey, aValue) => { if (useOr) code.orNotMatch(aKey, aValue); else code.andNotMatch(aKey, aValue); return code; },
        notType         : (aKey, aValue) => { if (useOr) code.orNotType(aKey, aValue); else code.andNotType(aKey, aValue); return code; },
        notBetween      : (aKey, aV1, aV2) => { if (useOr) code.orNotBetween(aKey, aV1, aV2); else code.andNotBetween(aKey, aV1, aV2); return code; },
        notBetweenEquals: (aKey, aV1, aV2) => { if (useOr) code.orNotBetweenEquals(aKey, aV1, aV2); else code.andNotBetweenEquals(aKey, aV1, aV2); return code; },
        notIs           : (aKey) => { if (useOr) code.orNotIs(aKey); else code.andNotIs(aKey); return code; },

        // Queries with and & not
        andNotStarts       : (aKey, aValue) => { applyWhere(aKey, aValue, "!(String({k}){ki}.startsWith({v}))", false); return code; },
        andNotEnds         : (aKey, aValue) => { applyWhere(aKey, aValue, "!(String({k}){ki}.endsWith({v}))", false); return code; },
        andNotEquals       : (aKey, aValue) => { applyWhere(aKey, aValue, "{ski}{k}{eki} != {v}", false); return code; },
        andNotGreater      : (aKey, aValue) => { applyWhere(aKey, aValue, "{ski}{k}{eki} <= {v}", false); return code; },
        andNotLess         : (aKey, aValue) => { applyWhere(aKey, aValue, "{ski}{k}{eki} >= {v}", false); return code; },
        andNotGreaterEquals: (aKey, aValue) => { applyWhere(aKey, aValue, "{ski}{k}{eki} < {v}", false); return code; },
        andNotLessEquals   : (aKey, aValue) => { applyWhere(aKey, aValue, "{ski}{k}{eki} > {v}", false); return code; },
        andNotContains     : (aKey, aValue) => { applyWhere(aKey, aValue, "String({k}){ki}.indexOf({v}) < 0", false); return code; },
        andNotEmpty        : (aKey, aValue) => { applyWhere(aKey, "", "($$({k}).isDef() && String({k}){ki}.length != 0)", false); return code; },
        andNotMatch        : (aKey, aValue) => { applyWhere(aKey, aValue, "!(String({k}){ki}.match({v}))", false); return code; },
        andNotType         : (aKey, aValue) => { applyWhere(aKey, aValue, "typeof {k} != {v}", false); return code; },
        andNotBetween      : (aKey, aV1, aV2) => { applyWhere(aKey, aV1, "({ski}{k}{eki} < {v} || {ski}{k}{eki} > {v2})", false, true, aV2); return code; },
        andNotBetweenEquals: (aKey, aV1, aV2) => { applyWhere(aKey, aV1, "({ski}{k}{eki} <= {v} || {ski}{k}{eki} >= {v2})", false, true, aV2); return code; },
        andNotIs           : (aKey) => { applyWhere(aKey, "", "{k} == null || !({k})", false); return code; },

        // Queries with or
        orStarts       : (aKey, aValue) => { applyWhere(aKey, aValue, "String({k}){ki}.startsWith({v})", true); return code; },
        orEnds         : (aKey, aValue) => { applyWhere(aKey, aValue, "String({k}){ki}.endsWith({v})", true); return code; },
        orEquals       : (aKey, aValue) => { applyWhere(aKey, aValue, "{ski}{k}{eki} == {v}", true); return code; },
        orGreater      : (aKey, aValue) => { applyWhere(aKey, aValue, "{ski}{k}{eki} > {v}", true); return code; },
        orLess         : (aKey, aValue) => { applyWhere(aKey, aValue, "{ski}{k}{eki} < {v}", true); return code; },
        orGreaterEquals: (aKey, aValue) => { applyWhere(aKey, aValue, "{ski}{k}{eki} >= {v}", true); return code; },
        orLessEquals   : (aKey, aValue) => { applyWhere(aKey, aValue, "{ski}{k}{eki} <= {v}", true); return code; },
        orContains     : (aKey, aValue) => { applyWhere(aKey, aValue, "String({k}){ki}.indexOf({v}) >= 0", true); return code; },
        orEmpty        : (aKey, aValue) => { applyWhere(aKey, "", "($$({k}).isUnDef() || String({k}){ki}.length == 0)", true); return code; },
        orMatch        : (aKey, aValue) => { applyWhere(aKey, aValue, "String({k}){ki}.match({v})", true); return code; },
        orType         : (aKey, aValue) => { applyWhere(aKey, aValue, "typeof {k} == {v}", true); return code; },
        orBetween      : (aKey, aV1, aV2) => { applyWhere(aKey, aV1, "({ski}{k}{eki} > {v} && {ski}{k}{eki} < {v2})", true, aV2); return code; },
        orBetweenEquals: (aKey, aV1, aV2) => { applyWhere(aKey, aV1, "({ski}{k}{eki} >= {v} && {ski}{k}{eki} <= {v2})", true, aV2); return code; },
        orIs           : (aKey) => { applyWhere(aKey, "", "{k} != null && {k}", true); return code; },

        // Queries with or and not
        orNotStarts       : (aKey, aValue) => { applyWhere(aKey, aValue, "!(String({k}){ki}.startsWith({v}))", true); return code; },
        orNotEnds         : (aKey, aValue) => { applyWhere(aKey, aValue, "!(String({k}){ki}.endsWith({v}))", true); return code; },
        orNotEquals       : (aKey, aValue) => { applyWhere(aKey, aValue, "{ski}{k}{eki} != {v}", true); return code; },
        orNotGreater      : (aKey, aValue) => { applyWhere(aKey, aValue, "{ski}{k}{eki} <= {v}", true); return code; },
        orNotLess         : (aKey, aValue) => { applyWhere(aKey, aValue, "{ski}{k}{eki} >= {v}", true); return code; },
        orNotGreaterEquals: (aKey, aValue) => { applyWhere(aKey, aValue, "{ski}{k}{eki} < {v}", true); return code; },
        orNotLessEquals   : (aKey, aValue) => { applyWhere(aKey, aValue, "{ski}{k}{eki} > {v}", true); return code; },
        orNotContains     : (aKey, aValue) => { applyWhere(aKey, aValue, "String({k}){ki}.indexOf({v}) < 0", true); return code; },
        orNotEmpty        : (aKey, aValue) => { applyWhere(aKey, "", "($$({k}).isDef() && String({k}){ki}.length != 0)", true); return code; },
        orNotMatch        : (aKey, aValue) => { applyWhere(aKey, aValue, "!(String({k}){ki}.match({v}))", true); return code; },
        orNotType         : (aKey, aValue) => { applyWhere(aKey, aValue, "typeof {k} != {v}", true); return code; },
        orNotBetween      : (aKey, aV1, aV2) => { applyWhere(aKey, aV1, "({ski}{k}{eki} < {v} || {ski}{k}{eki} > {v2})", false, true, aV2); return code; },
        orNotBetweenEquals: (aKey, aV1, aV2) => { applyWhere(aKey, aV1, "({ski}{k}{eki} <= {v} || {ski}{k}{eki} >= {v2})", false, true, aV2); return code; },
        orNotIs           : (aKey) => { applyWhere(aKey, "", "{k} == null || !({k})", true); return code; },

        // SELECTS

        // Providing immediate result
        min    : aKey => {
            aKey = _$(aKey).isString().default(void 0);
            var min;

            code.select(r => {
                var v = ($$(aKey).isDef() ? Number($$(r).get(aKey)) : Number(r));
                if (v != null && $$(v).isNumber()) {
                    if ($$(min).isUnDef()) {
                        min = r;
                    } else {
                        if ($$(aKey).isDef() && $$(min).get(aKey) > v) min = r;
                        if ($$(aKey).isUnDef() && min > v) min = r;
                    }
                }
            });

            return min;
        },
        max    : aKey => {
            aKey = _$(aKey).isString().default(void 0);
            var max;

            code.select(r => {
                var v = ($$(aKey).isDef() ? Number($$(r).get(aKey)) : Number(r));
                if (v != null && $$(v).isNumber()) {
                    if ($$(max).isUnDef()) {
                        max = r;
                    } else {
                        if ($$(aKey).isDef() && $$(max).get(aKey) < v) max = r;
                        if ($$(aKey).isUnDef() && max < v) max = r;
                    }
                }
            });

            return max;
        },
        average: aKey => {
            aKey = _$(aKey).isString().default(void 0);
            var sum = 0, c = 0;

            code.select(r => {
                var v = ($$(aKey).isDef() ? Number($$(r).get(aKey)) : Number(r));
                if (v != null && $$(v).isNumber()) {
                    c++;
                    sum += v;
                }
            });

            return (c > 0 ? sum / c : void 0);
        },
        sum: aKey => {
            aKey = _$(aKey).isString().default(void 0);
            var sum = 0;

            code.select(r => {
                var v = ($$(aKey).isDef() ? Number($$(r).get(aKey)) : Number(r));
                if (v != null && $$(v).isNumber()) {
                    sum += v;
                }
            });

            return sum;
        },
        distinct: aKey => {
            aKey = _$(aKey).isString().default(void 0);
            var vals = [];

            code.select(r => {
                var v = ($$(aKey).isDef() ? $$(r).get(aKey) : r);
                if (vals.indexOf(v) < 0) vals.push(v);
            });

            return vals;
        },
        group  : aKey => {
            aKey = _$(aKey).isString().default(void 0);
            var vals = {};

            code.select(r => {
                var v = ($$(aKey).isDef() ? $$(r).get(aKey) : r);
                if ($$(v).isBoolean()) v = String(v);
                if (Object.keys(vals).indexOf(v) < 0) {
                    vals[v] = [r];
                } else {
                    vals[v].push(r);
                }
            });

            return vals
        },
        at     : aParam => {
            _$(aParam, "index").isNumber().$_();

            res = applyConditions(res);
            return res[Number(aParam)];
        },
        all    : (aFallback) => { res = applyConditions(res); return $$(res).isArray() ? res.length == anObject.length : aFallback; },
        count  : () => { res = applyConditions(res); return res.length; },
        first  : (aFallback) => { res = applyConditions(res); return (res.length > 0 ? res[0] : aFallback); },
        last   : (aFallback) => { res = applyConditions(res); return (res.length > 0 ? res[res.length-1] : aFallback); },
        any    : () => { res = applyConditions(res); return (res.length > 0); },
        none   : () => { res = applyConditions(res); return (res.length == 0); },
        reverse: () => { res = applyConditions(res); return res.reverse(); },

        // Applying to current result set
        each   : aFn => {
            _$(aFn, "each function").isFunction().$_();

            code.select(aFn);

            return code;
        },
        intersect: (aA2) => {
            _$(aA2, "intersect param").isArray().$_();

            res = applyConditions(res);
            res = aIntersection(res, aA2);

            return code;
        },
        except: (aA2) => {
            _$(aA2, "except param").isArray().$_();

            res = applyConditions(res);
            res = aException(res, aA2);
            
            return code;
        },
        union: (aA2) => {
            _$(aA2, "union param").isArray().$_();

            res = applyConditions(res);
            res = aUnion(res, aA2);
            
            return code;
        },
        cartesian: (aA2) => {
            _$(aA2, "cartesian param").isArray().$_();

            res = applyConditions(res);
            res = aCartesian(res, aA2);

            return code;
        },
        attach : (aKey, aValue) => {
            _$(aKey, "key").$_();
            _$(aValue, "value").$_(); 

            res = applyConditions(res);

            //aKey = vKey(aKey);
            if (isFunction(aValue)) {
                res = res.map(r => { $$(r).set(aKey, aValue(r)); return r; });
            } else {
                res = res.map(r => { $$(r).set(aKey, aValue); return r; });
            }

            return code;
        },
        filter : aValue => {
            _$(aValue, "value").$_();

            res = applyConditions(res);
            res = res.filter(r => {
                var d = true;
                
                if (isMap(aValue) && isMap(r)) {
                    Object.keys(aValue).forEach(rr => {
                        if (!aCompare(aValue[rr], r[rr])) d = false;
                    })
                }
                if (isArray(r)) {
                    if (aArrayContains(r, aValue) < 0) d = false;
                }

                if (isFunction(aValue) && !aValue(r)) d = false;

                if (isNumber(aValue) || isString(aValue)) {
                    if (isNumber(r) || isString(r)) {
                        if (r != aValue) d = false;
                    }
                }

                return d;
            });

            return code;
        },
        sort   : function() {
            var ssort = "";

            res = applyConditions(res);

            for(var o = 0; o < arguments.length; o++) {
                var k = arguments[o];
                var rev = false;
                if (k.startsWith("-")) {
                    rev = true;
                    k = k.substr(1, k.length -1);
                }

                if (ssort.length > 0) ssort += " || "; else ssort = "return ";
                if (rev) {
                    //if (k.indexOf(".") > 0 || k.indexOf("[") > 0)
                    //    ssort += " $$(b).get(\"" + k + "\") - $$(a).get(\"" + k + "\") ";
                    //else
                    ssort += " ($$(a).get(\"" + k + "\") > $$(b).get(\"" + k + "\") ? -1 : ($$(a).get(\"" + k + "\") < $$(b).get(\"" + k + "\") ? 1 : 0)) ";
                } else {
                    //if (k.indexOf(".") > 0 || k.indexOf("[") > 0)
                    //    ssort += " $$(a).get(\"" + k + "\") - $$(b).get(\"" + k + "\") ";
                    //else
                    ssort += " ($$(a).get(\"" + k + "\") > $$(b).get(\"" + k + "\") ? 1 : ($$(a).get(\"" + k + "\") < $$(b).get(\"" + k + "\") ? -1 : 0)) ";
                }
            }

            res = res.sort(newFn("a", "b", ssort));

            return code;
        },
        assign: (aSource, aAlias, aPK, aFK, aFallback) => {
            res = applyConditions(res);
            res.forEach(r => {
                r[aAlias] = nLinq(aSource).equals(aFK, $$(r).get(aPK)).first(aFallback);
            });
            return code;
        },
        join: (aSource, aAlias, aPK, aFK) => {
            res = applyConditions(res);
            res.forEach(r => {
                r[aAlias] = nLinq(aSource).equals(aFK, $$(r).get(aPK)).select();
            });
            return code;
        },
        skip: aSkip => {
            _$(aSkip).isNumber().$_();

            askip = aSkip;
            return code;
        },
        skipWhile: aSkipFn => {
            _$(aSkipFn, "skip function").isFunction().$_();

            code.notWhere(aSkipFn);
            return code;
        },
        takeWhile: aTakeFn => {
            _$(aTakeFn, "take function").isFunction().$_();

            code.where(aTakeFn);
            return code;
        },
        take: aNum => {
            _$(aNum).isNumber().$_();

            return code.limit(aNum);
        },
        skipTake: (aSkip, aTake) => {
            _$(aSkip).isNumber().$_();
            
            return code.skip(aSkip).take(aTake);
        },
        // Apply map
        apply: aMap => {
            aMap   = _$(aMap, "aMap").isMap().default({})
        
            aMap.where = _$(aMap.where, "where").isArray().default([])
            aMap.select = _$(aMap.select, "select").default(void 0)
            aMap.transform = _$(aMap.transform, "transform").isArray().default([])
            aMap.selector = _$(aMap.selector, "selector").isMap().default(void 0)
        
            aMap.where.forEach(w => {
                if (isString(w.cond)) code = code[w.cond].apply(code, w.args)
            })
            aMap.transform.forEach(t => {
                if (isString(t.func)) {
                    code = code[t.func].apply(code, t.args)
                }
            })
        
            var res
            if (isString(aMap.select)) res = code.tselect(newFn("elem", "index", "array", aMap.select))
            if (isMap(aMap.select)) res = code.select(aMap.select)
        
            if (isUnDef(res) && isMap(aMap.selector)) res = (isString(aMap.selector.func) ? $$({}).set(aMap.selector.func, code[aMap.selector.func].apply(code, aMap.selector.args)) : res)
            if (isUnDef(res) && isUnDef(aMap.select)) res = code.select()
        
            return res
        },
        // Main selector
        select : aParam => {
            res = applyConditions(res);
            // no parameters
            if ($$(aParam).isUnDef()) {
                return res;
            } else {
                // function parameter
                if ($$(aParam).isFunction()) {
                    return res.map(aParam);
                } else {
                    // array parameter
                    if ($$(aParam).isArray()) {
                        var aNewParam = {};
                        aParam.forEach(r => {
                            if ($$(r).isString()) $$(aNewParam).set(r, void 0);
                        });
                    }
                    // map parameter
                    if ($$(aParam).isMap()) {
                        var keys = Object.keys(aParam);
                        return res.map(r => {
                            var nr = {};
                            keys.forEach(k => {
                                if ($$($$(r).get(k)).isDef()) {
                                    $$(nr).set(k, $$(r).get(k));
                                } else {
                                    $$(nr).set(k, $$(aParam).get(k));
                                }
                            });
                            return nr;
                        });
                    }
                }
            }
        },
        mselect: (aParam, aKey, dontRemove) => {
            var anArray = code.select(aParam)
            aKey        = _$(aKey, "aKey").isString().default("_key")
            dontRemove  = _$(dontRemove, "dontRemove").isBoolean().default(false)

            var res = {};
            for(var i in anArray) {
                var item = anArray[i]
                if ($$(aKey).isDef() && $$(item[aKey]).isDef()) {
                    var k = item[aKey]
                    res[k] = item
                    if (!dontRemove) delete res[k][aKey]
                } else {
                    res["row" + i] = item
                }
            }
            return res
        },
        define : aParam => {
            res = code.select(aParam);
            return code;
        },
        removed: aParam => {
            negative = true;
            res = code.select(aParam);
            return code;
        },
        stream : aParam => {
            var c = (alimit > 0 ? alimit : 1);
            var fn = code.streamFn(aParam);
            do {
                fn();
                if (alimit > 0) c--;
            } while ($$(res).isDef() && c > 0);
        },
        streamFn : aParam => {
            return () => {
                var r = code.select(aParam);
                res = (isFunction(anObject) ? anObject() : anObject);
                return r;
            };
        },
        pselect : aParam => {
		    var pres = splitArray(res);
		    var fRes = [];
		    parallel4Array(pres, ares => {
		        try {
		        var rr = nLinq(ares)._setState(code._getState()).select(aParam);
		        return rr;
		        } catch(e) { sprintErr(e);}
		    }).map(rs => {
		        fRes = fRes.concat(rs);
		    });
		    return fRes;
		}
		
    };

    return code;
};

var $from = nLinq;