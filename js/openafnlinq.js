/* Author: Nuno Aguiar */

var nLinq = function(anObject) {
    // Verify input
    if ($$(anObject).isMap()) {
        anObject = Object.values(anObject);
    }

    _$(anObject).isArray().$_();
    var res = anObject, where = "", useCase = false, useOr = false, useNot = false;

    // Auxiliary functions

    // Auxiliary functions - apply query conditions
    var applyConditions = aOrig => {
        if ($$(aOrig).isFunction()) aOrig = aOrig();

        if (where.length == 0) return aOrig;

        where = where.replace(/\;/g, " ");
        var f = new Function("r", "return (" + where + ")");
        res = aOrig.filter(r => f(r));
        return res;
    };

    // Auxiliary functions - verify the provided key
    var vKey = aKey => {
        if ($$(aKey).isString() && aKey.replace(/^[^a-zA-Z_$]|[^\w\[\]\.$]/g, "") == aKey) {
            return (useCase ? aKey.toLowerCase() : aKey);
        } else {
            if ($$(aKey).isDef()) throw "'" + aKey + "' is not valid key."; else return void 0;
        }
    };

    // Auxiliary functions - verify the provided value
    var vValue = aValue => {
        if (!($$(aValue).isNumber() || $$(aValue).isBoolean())) { 
            aValue = JSON.stringify(aValue, void 0, "");
            aValue = (useCase ? aValue.toLowerCase() : aValue); 
        }
        return aValue;
    };

    // Auxiliary functions - given a key, a value, a query template app change the current query
    var applyWhere = (aKey, aValue, aTmpl, isOr, isTwoValues, aValue2) => {
        var isM;
        if (isTwoValues) {
            isM = $$(aValue2).isDef();
            var origValue = aValue;
            aValue  = vValue(isM ? aValue : aKey);
            aValue2 = vValue(isM ? aValue2 : origValue);
        } else {
            isM = $$(aValue).isDef();
            aValue = vValue(isM ? aValue : aKey);
            aKey   = isM ? vKey(aKey) : void 0;
        }

        if (isM) aTmpl = aTmpl.replace(/{k}/g, "r." + aKey); else aTmpl = aTmpl.replace(/{k}/g, "r");
        if ($$(aValue2).isDef()) {
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
        // Change default behaviour
        useCase      : aTmpl => { useCase = ($$(aTmpl).isUnDef() || aTmpl ? true : false); return code; },
        ignoreCase   : aTmpl => { useCase = ($$(aTmpl).isUnDef() || aTmpl ? false : true); return code; },
        // TODO: Support remembering the previous key if none provided
        or           : () => { useOr = true; return code; },
        and          : () => { useOr = false; return code; },
        not          : () => { useNot = true; return code; },
        andNot       : () => { useOr = false; useNot = true; return code; },
        orNot        : () => { useOr = true; useNot = true; return code; },

        // WHEREs
        where        : aTmpl => { applyWhereTmpl(aTmpl, false); return code; },

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
        between      : (aKey, aV1, aV2) => { if (useOr) { if (useNot) code.orNotBetween(aKey, aValue); else code.orBetween(aKey, aValue); } else { if (useNot) code.andNotBetween(aKey, aValue); else code.andBetween(aKey, aValue); } return code; },
        betweenEquals: (aKey, aV1, aV2) => { if (useOr) { if (useNot) code.orNotBetweenEquals(aKey, aValue); else code.orBetweenEquals(aKey, aValue); } else { if (useNot) code.andNotBetweenEquals(aKey, aValue); else code.andBetweenEquals(aKey, aValue); } return code; },
        is           : (aKey) => { if (useOr) { if (useNot) code.orNotIs(aKey, aValue); else code.orIs(aKey, aValue); } else { if (useNot) code.andNotIs(aKey, aValue); else code.andIs(aKey, aValue); } return code; },

        // Queries with and
        andStarts       : (aKey, aValue) => { applyWhere(aKey, aValue, "String({k}).startsWith({v})", false); return code; },
        andEnds         : (aKey, aValue) => { applyWhere(aKey, aValue, "String({k}).endsWith({v})", false); return code; },
        andEquals       : (aKey, aValue) => { applyWhere(aKey, aValue, "{k} == {v}", false); return code; },
        andGreater      : (aKey, aValue) => { applyWhere(aKey, aValue, "{k} > {v}", false); return code; },
        andLess         : (aKey, aValue) => { applyWhere(aKey, aValue, "{k} < {v}", false); return code; },
        andGreaterEquals: (aKey, aValue) => { applyWhere(aKey, aValue, "{k} >= {v}", false); return code; },
        andLessEquals   : (aKey, aValue) => { applyWhere(aKey, aValue, "{k} <= {v}", false); return code; },
        andContains     : (aKey, aValue) => { applyWhere(aKey, aValue, "String({k}).indexOf({v}) >= 0", false); return code; },
        andEmpty        : (aKey, aValue) => { applyWhere(aKey, aValue, "String({k}).length == 0", false); return code; },
        andMatch        : (aKey, aValue) => { applyWhere(aKey, aValue, "String({k}).match({v})", false); return code; },
        andType         : (aKey, aValue) => { applyWhere(aKey, aValue, "typeof {k} == {v}", false); return code; },
        andBetween      : (aKey, aV1, aV2) => { applyWhere(aKey, aV1, "({k} > {v} && {k} < {v2})", false, true, aV2); return code; },
        andBetweenEquals: (aKey, aV1, aV2) => { applyWhere(aKey, aV1, "({k} >= {v} && {k} <= {v2})", false, true, aV2); return code; },
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
        notBetween      : (aKey, aV1, aV2) => { if (useOr) code.orNotBetween(aKey, aValue); else code.andNotBetween(aKey, aValue); return code; },
        notBetweenEquals: (aKey, aV1, aV2) => { if (useOr) code.orNotBetweenEquals(aKey, aValue); else code.andNotBetweenEquals(aKey, aValue); return code; },
        notIs           : (aKey) => { if (useOr) code.orNotIs(aKey, aValue); else code.andNotIs(aKey, aValue); return code; },

        // Queries with and & not
        andNotStarts       : (aKey, aValue) => { applyWhere(aKey, aValue, "!(String({k}).startsWith({v}))", false); return code; },
        andNotEnds         : (aKey, aValue) => { applyWhere(aKey, aValue, "!(String({k}).endsWith({v}))", false); return code; },
        andNotEquals       : (aKey, aValue) => { applyWhere(aKey, aValue, "{k} != {v}", false); return code; },
        andNotGreater      : (aKey, aValue) => { applyWhere(aKey, aValue, "{k} <= {v}", false); return code; },
        andNotLess         : (aKey, aValue) => { applyWhere(aKey, aValue, "{k} >= {v}", false); return code; },
        andNotGreaterEquals: (aKey, aValue) => { applyWhere(aKey, aValue, "{k} < {v}", false); return code; },
        andNotLessEquals   : (aKey, aValue) => { applyWhere(aKey, aValue, "{k} > {v}", false); return code; },
        andNotContains     : (aKey, aValue) => { applyWhere(aKey, aValue, "String({k}).indexOf({v}) < 0", false); return code; },
        andNotEmpty        : (aKey, aValue) => { applyWhere(aKey, aValue, "String({k}).length != 0", false); return code; },
        andNotMatch        : (aKey, aValue) => { applyWhere(aKey, aValue, "!(String({k}).match({v}))", false); return code; },
        andNotType         : (aKey, aValue) => { applyWhere(aKey, aValue, "typeof {k} != {v}", false); return code; },
        andNotBetween      : (aKey, aV1, aV2) => { applyWhere(aKey, aV1, "({k} < {v} || {k} > {v2})", false, true, aV2); return code; },
        andNotBetweenEquals: (aKey, aV1, aV2) => { applyWhere(aKey, aV1, "({k} <= {v} || {k} >= {v2})", false, true, aV2); return code; },
        andNotIs           : (aKey) => { applyWhere(aKey, "", "{k} == null || !({k})", false); return code; },

        // Queries with or
        orStarts       : (aKey, aValue) => { applyWhere(aKey, aValue, "String({k}).startsWith({v})", true); return code; },
        orEnds         : (aKey, aValue) => { applyWhere(aKey, aValue, "String({k}).endsWith({v})", true); return code; },
        orEquals       : (aKey, aValue) => { applyWhere(aKey, aValue, "{k} == {v}", true); return code; },
        orGreater      : (aKey, aValue) => { applyWhere(aKey, aValue, "{k} > {v}", true); return code; },
        orLess         : (aKey, aValue) => { applyWhere(aKey, aValue, "{k} < {v}", true); return code; },
        orGreaterEquals: (aKey, aValue) => { applyWhere(aKey, aValue, "{k} >= {v}", true); return code; },
        orLessEquals   : (aKey, aValue) => { applyWhere(aKey, aValue, "{k} <= {v}", true); return code; },
        orContains     : (aKey, aValue) => { applyWhere(aKey, aValue, "String({k}).indexOf({v}) >= 0", true); return code; },
        orEmpty        : (aKey, aValue) => { applyWhere(aKey, aValue, "String({k}).length == 0", true); return code; },
        orMatch        : (aKey, aValue) => { applyWhere(aKey, aValue, "String({k}).match({v})", true); return code; },
        orType         : (aKey, aValue) => { applyWhere(aKey, aValue, "typeof {k} == {v}", true); return code; },
        orBetween      : (aKey, aV1, aV2) => { applyWhere(aKey, aV1, "({k} > {v} && {k} < {v2})", true, aV2); return code; },
        orBetweenEquals: (aKey, aV1, aV2) => { applyWhere(aKey, aV1, "({k} >= {v} && {k} <= {v2})", true, aV2); return code; },
        orIs           : (aKey) => { applyWhere(aKey, "", "{k} != null && {k}", true); return code; },

        // Queries with or and not
        orNotStarts       : (aKey, aValue) => { applyWhere(aKey, aValue, "!(String({k}).startsWith({v}))", true); return code; },
        orNotEnds         : (aKey, aValue) => { applyWhere(aKey, aValue, "!(String({k}).endsWith({v}))", true); return code; },
        orNotEquals       : (aKey, aValue) => { applyWhere(aKey, aValue, "{k} != {v}", true); return code; },
        orNotGreater      : (aKey, aValue) => { applyWhere(aKey, aValue, "{k} <= {v}", true); return code; },
        orNotLess         : (aKey, aValue) => { applyWhere(aKey, aValue, "{k} >= {v}", true); return code; },
        orNotGreaterEquals: (aKey, aValue) => { applyWhere(aKey, aValue, "{k} < {v}", true); return code; },
        orNotLessEquals   : (aKey, aValue) => { applyWhere(aKey, aValue, "{k} > {v}", true); return code; },
        orNotContains     : (aKey, aValue) => { applyWhere(aKey, aValue, "String({k}).indexOf({v}) < 0", true); return code; },
        orNotEmpty        : (aKey, aValue) => { applyWhere(aKey, aValue, "String({k}).length != 0", true); return code; },
        orNotMatch        : (aKey, aValue) => { applyWhere(aKey, aValue, "!(String({k}).match({v}))", true); return code; },
        orNotType         : (aKey, aValue) => { applyWhere(aKey, aValue, "typeof {k} != {v}", true); return code; },
        orNotBetween      : (aKey, aV1, aV2) => { applyWhere(aKey, aV1, "({k} < {v} || {k} > {v2})", false, true, aV2); return code; },
        orNotBetweenEquals: (aKey, aV1, aV2) => { applyWhere(aKey, aV1, "({k} <= {v} || {k} >= {v2})", false, true, aV2); return code; },
        orNotIs           : (aKey) => { applyWhere(aKey, "", "{k} == null || !({k})", true); return code; },

        // SELECTS

        // Providing immediate result
        min    : aKey => {
            aKey = ($$(aKey).isDef() ? vKey(aKey) : void 0);
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
            aKey = ($$(aKey).isDef() ? vKey(aKey) : void 0);
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
            aKey = ($$(aKey).isDef() ? vKey(aKey) : void 0);
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
            aKey = ($$(aKey).isDef() ? vKey(aKey) : void 0);
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
            aKey = ($$(aKey).isDef() ? vKey(aKey) : void 0);
            var vals = [];

            code.select(r => {
                var v = ($$(aKey).isDef() ? $$(r).get(aKey) : r);
                if (vals.indexOf(v) < 0) vals.push(v);
            });

            return vals;
        },
        group  : aKey => {
            aKey = ($$(aKey).isDef() ? vKey(aKey) : void 0);
            var vals = {};

            code.select(r => {
                var v = ($$(aKey).isDef() ? $$(r).get(aKey) : r);
                if ($$(v).isBoolean()) v = String(v);
                if (Object.keys(vals).indexOf(v) < 0) {
                    vals[v] = [ r ];
                } else {
                    vals[v].push(r);
                }
            });

            return vals;
        },
        at     : aParam => {
            _$(aParam, "index").isNumber().$_();

            res = applyConditions(res);
            return res[Number(aParam)];
        },
        all    : () => { res = applyConditions(res); return res.length == anObject.length; },
        count  : () => { res = applyConditions(res); return res.length; },
        first  : () => { res = applyConditions(res); return (res.length > 0 ? res[0] : void 0); },
        last   : () => { res = applyConditions(res); return (res.length > 0 ? res[res.length-1] : void 0); },
        any    : () => { res = applyConditions(res); return (res.length > 0); },
        none   : () => { res = applyConditions(res); return (res.length == 0); },
        reverse: () => { res = applyConditions(res); return res.reverse(); },

        // Applying to current result set
        each   : aFn => {
            _$(aFn, "function").isFunction().$_();

            code.select(aFn);

            return code;
        },
        attach : (aKey, aValue) => {
            _$(aKey, "key").$_();
            _$(aValue, "value").$_(); 

            res = applyConditions(res);

            aKey   = vKey(aKey);
            res = res.map(r => { $$(r).set(aKey, aValue); return r; });

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
                        ssort += " b." + k + " - a." + k + " ";
                } else {
                    //if (k.indexOf(".") > 0 || k.indexOf("[") > 0)
                    //    ssort += " $$(a).get(\"" + k + "\") - $$(b).get(\"" + k + "\") ";
                    //else
                        ssort += " a." + k + " - b." + k + " ";
                }
            }

            res = res.sort(new Function("a", "b", ssort));

            return code;
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
                        aNewParam = {};
                        aParam.map(r => {
                            if ($$(r).isString()) $$(aNewParam).set(r, void 0);
                        });
                    }
                    // map parameter
                    if ($$(aParam).isMap()) {
                        var keys = Object.keys(aParam);
                        return res.map(r => {
                            var nr = {};
                            keys.map(k => {
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
        }
    };

    return code;
};

var _from = nLinq;