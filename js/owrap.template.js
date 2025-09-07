// OpenWrap v2
// Copyright 2023 Nuno Aguiar
// Template

OpenWrap.template = function() {
	//loadHandlebars();
	//if (isUnDef(ow.template.hb)) {
		//this.hb = getOpenAFJar() + "::js/handlebars.js";
		//require(this.hb);
		//loadCompiledRequire("handlebars_js");
		//ow.template.__helpers = {};
		//ow.template.__partials = {};
	//}
	return ow.template;
};

OpenWrap.template.prototype.__mdHTMLExtras = []
OpenWrap.template.prototype.__mdHTMLTExtras = []
OpenWrap.template.prototype.__srcPath = {}

OpenWrap.template.prototype.__requireHB = function() {
	var hb = loadCompiledRequire("handlebars_js")
	this.__addHelpers(hb)
	this.__addPartials(hb)
	return hb
};

/**
 * <odoc>
 * <key>ow.template.addHelpers(aPrefix, aObject)</key>
 * Registers all aObject functions as helpers. These helpers identifier will be composed by aPrefix + Name of the each function.
 * \
 * (available after ow.loadTemplate())
 * </odoc>
 */
OpenWrap.template.prototype.addHelpers = function(aPrefix, aObject) {
	ow.loadObj()
	if (isUnDef(this.__helpers)) this.__helpers = new ow.obj.syncMap()

	var m = Object.keys(aObject.constructor.prototype);
	if (m.length < 1) m = (isDef(aObject.prototype)) ? Object.keys(aObject.prototype) : Object.keys(aObject);
	m.forEach((aMethod) => {
		var subs = Object.keys(aObject[aMethod]);
		if (subs.length == 0)
			this.__helpers.put(aPrefix + aMethod, aObject[aMethod])
		else 
			this.addHelpers(aPrefix + aMethod + "_", aObject[aMethod]);
		//require(this.hb).registerHelper(aPrefix + aMethod, aObject[aMethod]);
	});
};

OpenWrap.template.prototype.__addHelpers = function(aHB) {
	ow.loadObj()
	if (isUnDef(this.__helpers)) this.__helpers = new ow.obj.syncMap()

	this.__helpers.forEach((k, v) => {
		aHB.registerHelper(k, v)
	})
};

/**
 * <odoc>
 * <key>ow.template.addOpenAFHelpers()</key>
 * Adds custom helpers:\
 * \
 *   - $debug           -- calls sprint for the parameter\
 *   - $stringify       -- stringify the parameter\
 *   - $stringifyInLine -- stringify in the same line the parameter\
 *   - $toYAML          -- returns the YAML version of the parameter\
 *   - $toKYAML         -- returns the KYAML version fo the parameter\
 *   - $toJSON          -- returns the JSON version of the parameter\
 *   - $env             -- returns the current environment variable identified by the parameter\
 *   - $escape          -- returns an escaped version of the parameter\
 *   - $acolor          -- returns an ansi color (first argument) escape sequence of the string parameter (second argument)\
 *   - $f               -- uses the $f format function\
 *   - $ft              -- uses the $ft format function\
 *   - $path            -- uses the $path function to query objects\
 *   - $from            -- uses the $from &amp; fromNLinq to query objects\
 *   - $oafp            -- uses the oafp function to parse the provided JSON/SLON string and return the results\
 *   - $toSLON          -- returns the ow.format.toSLON version of an object\
 *   - $get             -- returns the corresponding value for a key on $get\
 *   - $getObj          -- equivalent to $get with the extra parameter for $$.get path\
 *   - $dateDiff        -- returns a number of seconds for a provided date optionally (second argument) with minutes, hours, days, months, weeks or years and (third argument) a default value\
 *   - $switch          -- equivalent to a javascript switch\
 *   - $case            -- to be used with $switch for each case\
 *   - $default         -- to be used with $switch for each case\
 *   - $ptable          -- returns an ansi ascii printTable representation of an object\
 *   - $ptree           -- returns an ansi ascii printTree representation of an object\
 *   - $pchart          -- returns an ansi ascii line chart with an object and a format string: "unit path:color:legend... [-min:0] [-max:100] [-hsize:40] [-vsize:10]"\
 *   - $pbar            -- returns an ansi ascii progress bar with a value and a max value, a min value, a size, an indicator and space char\
 *   - $pbars           -- returns an ansi ascii tree of progress bars with a format string: "unit path:color:legend... [-min:0] [-max:100] [-hsize:40]"\
 *   - $output          -- returns an $output representation of an object (aObj as 1st arg and options in slon as 2nd arg)\
 *   - $cjson           -- returns an ansi ascii colority representation fo an object\
 *   - $cslon           -- returns an ansi ascii colored SLON representation of an object\
 *   - $pmap            -- returns an ansi ascii printMap representation of an object\
 *   - $jsmap           -- returns a HTML representation of an object\
 *   - $t               -- given a template and an object instance, as arguments, will process and return the template\
 *   - $date            -- converts the argument provided to date\
 *   - $isoDate         -- converts the argument provided to an ISO date string\
 *   - $number          -- casts the argument provided to number\
 *   - $boolean         -- casts the argument provided to boolean\
 *   - $string          -- casts the argument provided to string\
 *   - $keys            -- returns an array of keys of the provided map\
 *   - $values          -- returns an array of values of the provided map\
 *   - $__              -- returns a undefined value\
 *   - $alen            -- returns the ansi length of the argument provided\
 *   - $len             -- returns the string length of the argument provided\
 *   - $repeat          -- shortcut to the OpenAF's repeat function\
 *   - $range           -- shortcut to the OpenAF's range function\
 *   - $a2m             -- shortcut to the OpenAF's $a2m function\
 *   - $a4m             -- shortcut to the OpenAF's $a4m function\
 *   - $m2a             -- shortcut to the OpenAF's $m2a function\
 *   - $m4a             -- shortcut to the OpenAF's $m4a function\
 *   - $nvl             -- shortcut to the OpenAF's nvl function\
 *   - $pass            -- returns an empty string\
 *   - $p               -- returns the provided literal\
 *   - $sline           -- shortcut to the OpenAF's format withSideLine\
 *   - $set             -- block set of a provided key\
 *   - $concat          -- concatenates all arguments as a single value\
 *   - $nl              -- returns a new line character
 * </odoc>
 */
OpenWrap.template.prototype.addOpenAFHelpers = function() {
	// Don't load if already loaded
	if (this.__helperOpenAF) return

	ow.loadFormat()
	var obj = {
		"$": (t, d) => isDef(t) ? t : d,
		switch: (value, options) => {
			this.switch_value = value
			this.switch_break = false
			return isDef(options.fn) ? options.fn(this) : true
		},
		case: (value, options) => {
			if (value == this.switch_value) {
			  this.switch_break = true
			  return isDef(options.fn) ? options.fn(this) : true
			}
		},
		default: (value, options) => {
			if (this.switch_break == false) {
			  return value
			}
		},
		debug: sprint,
		stringify: stringify,
		stringifyInLine: s => { return stringify(s, __, "") },
		toYAML: af.toYAML,
		toKYAML: af.toKYAML,
		toJSON: stringify,
		ptree: r => printTree(r),
		pmap: r => printMap(r),
		pbar: (v, m, min, size, indicator, space) => ow.format.string.progress(v, isMap(m) ? __ : m, isMap(min) ? __ : min, isMap(size) ? __ : size, isMap(indicator) ? __ : indicator, isMap(space) ? __ : space),
		pbars: (r, f) => {
			let parts = splitBySepWithEnc(f, " ", [["\"","\""],["'","'"]])
			let nparts = [], fns = []
			if (parts.length > 1) {
				for(let i = 0; i < parts.length; i++) {
					if (i == 0) {
						nparts.push(parts[i])
					} else {
						let _n = splitBySepWithEnc(parts[i], ":", [["\"","\""],["'","'"]]).map((_p, j) => {
							if (j == 0) {
								if (!_p.startsWith("-")) {
									fns.push("_oaftemplate_fns_" + i)
									global["_oaftemplate_fns_" + i] = () => $path(r, _p)
									return "_oaftemplate_fns_" + i
								} else {
									return _p
								}
							} else {
								return _p
							}
						}).join(":")
						nparts.push(_n)
					}
				}
	
				let _out = printBars(nparts.join(" "))
				fns.forEach(f => delete global[f])
				return _out
			}
			return ""
		},
		pchart: (r, f) => {
			let parts = splitBySepWithEnc(f, " ", [["\"","\""],["'","'"]])
			let nparts = [], fns = []
			if (parts.length > 1) {
				for(let i = 0; i < parts.length; i++) {
					if (i == 0) {
						nparts.push(parts[i])
					} else {
						let _n = splitBySepWithEnc(parts[i], ":", [["\"","\""],["'","'"]]).map((_p, j) => {
							if (j == 0) {
								if (!_p.startsWith("-")) {
									fns.push("_oaftemplate_fn_" + i)
									global["_oaftemplate_fn_" + i] = () => $path(r, _p)
									return "_oaftemplate_fn_" + i
								} else {
									return _p
								}
							} else {
								return _p
							}
						}).join(":")
						nparts.push(_n)
					}
				}
	
				let _out = printChart("__ " + nparts.join(" "))
				fns.forEach(f => delete global[f])
				return _out
			}
			return ""
		},
		ptable: printTable,
		cjson: colorify,
		cslon: ow.loadFormat().toCSLON,
		jsmap: (res, isFull) => {
			var _res = ow.template.html.parseMap(res, true)
			var _themeauto = ow.template.html.njsmapAutoTheme()
			/*if (__flags.MD_DARKMODE == "auto") {
				_themeauto = `<script>if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) document.body.classList.add('njsmap_dark')</script>`
			}*/
			return (isFull ? "<html><style>" + _res.css + "</style><body" + (__flags.MD_DARKMODE == "true" ? " class=\"njsmap_dark\"" : "") + ">" + _res.out + _themeauto + "</body></html>" : _res.out)
		},	
		env: getEnv,
		escape: s => { return s.replace(/['"]/g, "\\$1"); },
		acolor: (c, s) => { 
			if (isMap(s)) {
				return ansiColor(c, s.fn(this))
			} else {
				return ansiColor(c, s) 
			}
		},
		f: $f,
		ft: $ft,
		t: (t, a) => $t(t, a),
		get: (o, p) => $get(o),
		path: (o, p) => $path(o, p),
		from: (o, p) => $from(o).query(af.fromNLinq(p)),
		toSLON: ow.format.toSLON,
		getObj: (o, p) => $$($get(o)).get(p),
		date: (s) => (new Date(s)),
		isoDate: s => (new Date(s)).toISOString(),
		number: s => Number(s),
		boolean: s => toBoolean(s),
		string: s => String(s),
		__: s => __,
		alen: s => ansiLength(s),
		len: s => s.length,
		repeat: (t, s) => repeat(t, s),
		range: (c, s, t) => range(c, s, t),
		concat: function() {
			var ar = []
			for(var i = 0; i < arguments.length; i++) {
				if (isString(arguments[i])) ar.push(String(arguments[i]))
			}
			return ar.join("")
		},
		pass : () => "",
		p: s => s,
		nl: () => "\n",
		set: (aK, o) => {
			if (__flags.TEMPLATE_SET && isString(aK) && isMap(o) && isMap(o.data)) {
				$$(o.data.root).set(aK, o.fn(this) )
			}
		},
		oafp: (jsl) => {
			loadOAFP()
			var _id = genUUID()
			var _m = merge({ out: "key", __key: _id }, af.fromJSSLON(jsl))
			oafp(_m)
			var _r = $get(_id)
			$unset(_id)
			return _r
		},
		output: (aObj, aOptions) => {
			if (isUnDef(aOptions) || !isString(aOptions)) aOptions = "()"
			aOptions = af.fromSLON(aOptions)
			if (isUnDef(aOptions.__format)) aOptions.__format = "tree"
			return $output(aObj, aOptions, __, true)
		},
		sline: (aStr, aSize, ansiLine, ansiText, aTheme, s) => {
			if (isMap(aSize)) aSize = __
			if (isMap(ansiLine)) ansiLine = __
			if (isMap(ansiText)) ansiText = __
			if (isMap(aTheme)) aTheme = __

			aTheme = ow.format.withSideLineThemes()[String(aTheme)]
			
			return ow.format.withSideLine(isMap(s) && isDef(s.fn) ? s.fn(this) : aStr, aSize, ansiLine, ansiText, aTheme)
		},
		a2m: (d, a) => $a2m(d, a),
		a4m: (a, k, d) => $a4m(a, k, d),
		m2a: (d, m) => $m2a(d, m),
		m4a: (m, k) => $m4a(m, k),
		nvl: (v, d) => af.nvl(v, d),
		keys: (o) => Object.keys(o),
		values: (o) => Object.values(o),
		dateDiff: (a, p, isN) => {
			if (isDef(a) && a != null) {
					var res = "seconds"
					if (isDef(p) && p != null && isString(p)) res = p
					try {
							switch(res) {
							case "minutes": return ow.format.dateDiff.inMinutes(new Date(a))
							case "hours"  : return ow.format.dateDiff.inHours(new Date(a))
							case "days"   : return ow.format.dateDiff.inDays(new Date(a))
							case "months" : return ow.format.dateDiff.inMonths(new Date(a))
							case "weeks"  : return ow.format.dateDiff.inWeeks(new Date(a))
							case "years"  : return ow.format.dateDiff.inYears(new Date(a))
							case "seconds":
							default:
									return ow.format.dateDiff.inSeconds(new Date(a))
							}
					} catch(e) {
							return (isString(isN) ? isN : null)
					}
			} else {
					return (isString(isN) ? isN : null)
			}
		}
	}
	ow.template.addHelpers("$", obj)

	this.__helperOpenAF = true
};

/**
 * <odoc>
 * <key>ow.template.addFormatHelpers()</key>
 * Adds all functions of ow.format as helpers with the prefix owFormat_.
 * </odoc>
 */
OpenWrap.template.prototype.addFormatHelpers = function() {
	// Don't load if already loaded
	if (this.__helperFormat) return

	ow.loadFormat();
	this.addHelpers("owFormat_", ow.format);

	this.__helperFormat = true
}

/**
 * <odoc>
 * <key>ow.template.addConditionalHelpers()</key>
 * Adds helper functions equivalent to assemble.io comparison helpers starting with "$"
 * See more in http://assemble.io/helpers/helpers-comparison.html
 * </odoc>
 */
OpenWrap.template.prototype.addConditionalHelpers = function() {
	// Don't load if already loaded
	if (this.__helperCond) return 

	// Based on assemble.io handlebars helpers https://github.com/assemble/handlebars-helpers
	var obj = {
		and: (a, b, s) => (a && b) ? (isDef(s.fn) ? s.fn(this) : true) : (isDef(s.inverse) ? s.inverse(this) : false),
		compare: (a, op, b, s) => {
			_$(a, "a").$_()
			_$(op, "op").$_()
			_$(b, "b").$_()

			var result
			switch(op) {
			case '==' : result = a == b; break
			case '===': result = a === b; break
			case '!=' : result = a != b; break
			case '!==': result = a !== b; break
			case '<'  : result = a < b; break
			case '>'  : result = a > b; break
			case '<=' : result = a <= b; break
			case '>=' : result = a >= b; break
			case 'typeof': result = typeof a === b; break
			default: throw 'Invalid operator: `' + op + '`'
			}
			
			if (result === false) return (isDef(s.inverse) ? s.inverse(this) : false)
			return (isDef(s.fn) ? s.fn(this) : true)
		},
		contains: (collec, value, sIdx, s) => {
			loadUnderscore();
			if (typeof sIdx === 'object') {
				s = sIdx; sIdx = undefined;
			}
			if(_.isString(collec) && collec.indexOf(value, sIdx) > -1) return (isDef(s.fn) ? s.fn(this) : true);
			if(_.contains(collec, value, sIdx)) return (isDef(s.fn) ? s.fn(this) : true); 
			return (isDef(s.inverse) ? s.inverse(this) : false);
		},
		gt: (a, b, s) => {
			if (a > b) return (isDef(s.fn) ? s.fn(this) : true);
			return (isDef(s.inverse) ? s.inverse(this) : false);
		},
		gte: (a, b, s) => {
			if (a >= b) return (isDef(s.fn) ? s.fn(this) : true);
			return (isDef(s.inverse) ? s.inverse(this) : false);
		},
		// Custom helper additional to http://assemble.io/helpers/helpers-comparison.html
		startsWith: (a, b, s) => {
			if (isString(a) && isString(b)) {
				if (a.startsWith(b)) return (isDef(s.fn) ? s.fn(this) : true)
				return (isDef(s.inverse) ? s.inverse(this) : false) 
			}
		},
		// Custom helper additional to http://assemble.io/helpers/helpers-comparison.html
		endsWith: (a, b, s) => {
			if (isString(a) && isString(b)) {
				if (a.endsWith(b)) return (isDef(s.fn) ? s.fn(this) : true)
				return (isDef(s.inverse) ? s.inverse(this) : false) 
			}
		},
		// Custom helper additional to http://assemble.io/helpers/helpers-comparison.html
		match: (a, re, flags, s) => {
			if (isUnDef(s)) { s = flags; flags = "" }
			if (isString(a) && isString(re) && isString(flags)) {
				if (a.match(new RegExp(re, flags))) return (isDef(s.fn) ? s.fn(this) : true)
				return (isDef(s.inverse) ? s.inverse(this) : false) 
			}
		},
		has: (v, p, s) => {
			if (isUnDef(s) && isDef(p)) return p.inverse(this)
			if (isUnDef(p) && isDef(v)) return v.inverse(this)
			if ((Array.isArray(v) || isString(v)) && isDef(p)) {
				if (v.indexOf(p) > -1) return (isDef(s.fn) ? s.fn(this) : true)
			}
			if (isMap(v) && isString(p) && p in v) return (isDef(s.fn) ? s.fn(this) : true)
			return (isDef(s.inverse) ? s.inverse(this) : false)
		},
		eq: (a, b, s) => {
			/*if (isDef(a) && isDef(b)) {
				s = b;
				b = s.hash.compare;
			}*/
			if (a === b) return (isDef(s.fn) ? s.fn(this) : true);
			return (isDef(s.inverse) ? s.inverse(this) : false);
		},
		ifEven: (n, s) => (n % 2 == 0) ? (isDef(s.fn) ? s.fn(this) : true) : (isDef(s.inverse) ? s.inverse(this) : false),
		ifNth: (a, b, s) => (++b % a === 0) ? (isDef(s.fn) ? s.fn(this) : true) : (isDef(s.inverse) ? s.inverse(this) : false),
		ifOdd: (n, s) => (n % 2 == 1) ? (isDef(s.fn) ? s.fn(this) : true) : (isDef(s.inverse) ? s.inverse(this) : false),
		is: (a, b, s) => {
			if (a === b) return (isDef(s.fn) ? s.fn(this) : true);
			return (isDef(s.inverse) ? s.inverse(this) : false);
		},
		isnt: (a, b, s) => {
			if (a !== b) return (isDef(s.fn) ? s.fn(this) : true);
			return (isDef(s.inverse) ? s.inverse(this) : false);	
		},
		lt: (a, b, s) => {
			if (a < b) return (isDef(s.fn) ? s.fn(this) : true);
			return (isDef(s.inverse) ? s.inverse(this) : false);
		},
		lte: (a, b, s) => {
			if (a <= b) return (isDef(s.fn) ? s.fn(this) : true);
			return (isDef(s.inverse) ? s.inverse(this) : false);
		},
		neither: (a, b, s) => (!a && !b) ? (isDef(s.fn) ? s.fn(this) : true) : (isDef(s.inverse) ? s.inverse(this) : false),
		or: (a, b, s) => (a === true || b === true) ? (isDef(s.fn) ? s.fn(this) : true) : (isDef(s.inverse) ? s.inverse(this) : false),
		unlessEq: (ctx, s) => (ctx === s.hash.compare) ? (isDef(s.fn) ? s.fn(this) : true) : (isDef(s.inverse) ? s.inverse(this) : false),
		unlessGt: (ctx, s) => (ctx > s.hash.compare) ? (isDef(s.fn) ? s.fn(this) : true) : (isDef(s.inverse) ? s.inverse(this) : false),
		unlessLt: (ctx, s) => (ctx < s.hash.compare) ? (isDef(s.fn) ? s.fn(this) : true) : (isDef(s.inverse) ? s.inverse(this) : false),
		unlessGteq: (ctx, s) => (ctx >= s.hash.compare) ? (isDef(s.fn) ? s.fn(this) : true) : (isDef(s.inverse) ? s.inverse(this) : false),
		unlessLteq: (ctx, s) => (ctx <= s.hash.compare) ? (isDef(s.fn) ? s.fn(this) : true) : (isDef(s.inverse) ? s.inverse(this) : false)
	}

	ow.template.addHelpers("$", obj)

	this.__helperCond = true
}

/**
 * <odoc>
 * <key>ow.template.addHelper(aHelperName, aFunction)</key>
 * Adds aFunction as aHelperName.
 * </odoc>
 */
OpenWrap.template.prototype.addHelper = function(aHelperName, aFunction) {
	ow.loadObj()
	if (isUnDef(this.__helpers)) this.__helpers = new ow.obj.syncMap()
	if (isUnDef(this.hb)) this.__requireHB();

	//this.__helpers[aHelperName] = aFunction;
	this.__helpers.put(aHelperName, aFunction)
	//require(this.hb).registerHelper(aHelperName, aFunction);
}

/**
 * <odoc>
 * <key>ow.template.delHelper(aHelperName)</key>
 * Unregister aHelperName that had been previously added with ow.template.addHelper.
 * </odoc>
 */
OpenWrap.template.prototype.delHelper = function(aHelperName) {
	ow.loadObj()
	if (isUnDef(this.__helpers)) this.__helpers = new ow.obj.syncMap()
	if (isUnDef(this.hb)) this.__requireHB();
	
	//delete this.__helpers[aHelperName];
	this.__helpers.remove(aHelperName)
	//require(this.hb).unregisterHelper(aHelperName);
};

/**
 * <odoc>
 * <key>ow.template.addPartial(aPartialName, aSource)</key>
 * Registers aSource template as a reusable aPartialName in other templates.
 * </odoc>
 */
OpenWrap.template.prototype.addPartial = function(aPartial, aSource) {
	ow.loadObj()
	if (isUnDef(this.__partials)) this.__partials = new ow.obj.syncMap()
	
	//this.__partials[aPartial] = aSource;
	this.__partials.put(aPartial, aSource)
	//require(this.hb).registerPartial(aPartial, aSource);
};

OpenWrap.template.prototype.__addPartials = function(aHB) {
	ow.loadObj()
	if (isUnDef(this.__partials)) this.__partials = new ow.obj.syncMap()

	this.__partials.forEach((k, v) => {
		aHB.registerPartial(k, v)
	})
};

/**
 * <odoc>
 * <key>ow.template.delPartial(aPartialName)</key>
 * Unregisters aPartialName that had been previously added with ow.template.addPartial
 * </odoc>
 */
OpenWrap.template.prototype.delPartial = function(aPartial) {
	//delete this.__partials[aPartial];
	this.__partials.remove(aPartial)
	//require(this.hb).unregisterPartial(aPartial);
}

/**
 * <odoc>
 * <key>ow.template.getTemplate(aSource) : Function</key>
 * Returns a template function, given aSource, that accepts an object as argument and returns
 * the correspoding template filled with the values provided.
 * </odoc>
 */
OpenWrap.template.prototype.getTemplate = function(aSource) {
	var res
	var e
	//sync(function() {
	try {
		res = this.__requireHB().compile(aSource)
	} catch(ee) { e = ee }
	//}, ow.loadTemplate());
	if (isDef(e)) throw e
	return res
}

/**
 * <odoc>
 * <key>ow.template.parse(aSource, someData) : String</key>
 * Returns the results of using someData to the template defined on the aSource provided.
 * Note: for parallel processing you should use ow.template.compile since Handlebars might not be thread-safe.
 * </odoc>
 */
OpenWrap.template.prototype.parse = function(aSource, someData) {
	someData = (isUnDef(someData)) ? this : someData
	var res
	var e
	var parent = this
	//sync(function() {
	try {
		res = (parent.getTemplate(aSource))(someData)
	} catch(ee) { e = ee }
	//}, ow.loadTemplate());
	if (isDef(e)) throw e
	return res
}

/**
 * <odoc>
 * <key>ow.template.parseHBS(aFilename, someData) : String</key>
 * Returns the results of using someData with the template defined on aFilename (tip: use the extension hbs).
 * </odoc>
 */
OpenWrap.template.prototype.parseHBS = function(aFilename, someData) {
	someData = (isUnDef(someData)) ? this : someData;
	var res;
	var e;
	var parent = this;
	//sync(function() {
		try {
			res = (parent.getTemplate(io.readFileString(aFilename)))(someData);
		} catch(ee) { e = ee; }
	//}, ow.loadTemplate());
	if (isDef(e)) throw e;
	return res;
};

/**
 * <odoc>
 * <key>ow.template.loadHBSs(aMapOfHBSs) : Function</key>
 * Given a map where the key is a hbs template key and the value is the filepath of a HBS file, will pre-compile
 * the HBS files and return a function(key, data). This function can be used to execute a the pre-compiled templates
 * using the hbs template key and passing the corresponding data map to be used on that template returning the template
 * parsed. Note: the filepath can indicate a file inside a zip file like 'some/path/a.zip::file'.
 * </odoc>
 */
OpenWrap.template.prototype.loadHBSs = function(aMapOfHBSs) {
	var a = {};
	
	for(var i in aMapOfHBSs) {
		if (aMapOfHBSs[i].indexOf(/::/) > 0) {
			var zp = aMapOfHBSs[i].split(/::/);
			a[i] = ow.template.compile(getFromZip(zp[0], zp[1]));
		} else {
			a[i] = ow.template.compile(io.readFileString(aMapOfHBSs[i]));
		}
	}
	
	return function(i, aSource) {
		return ow.template.execCompiled(a[i])(aSource);
	}
}

/**
 * <odoc>
 * <key>ow.template.loadPartialHBS(aMapOfParialHBSs)</key>
 * Given a map where the key is a partial hbs template key and the value is the filepath of a HBS file, will load it and
 * add it as a template partial. Note: the filepath can indicate a file inside a zip file like 'some/path/a.zip::file'.
 * </odoc>
 */
OpenWrap.template.prototype.loadPartialHBSs = function(aMapOfPartialHBSs) {
	for(var i in aMapOfPartialHBSs) {
		if (aMapOfHBSs[i].indexOf(/::/) > 0) {
			var zp = aMapOfHBSs[i].split(/::/);
			ow.template.addPartial(i, getFromZip(zp[0], zp[1]));
		} else {		
			ow.template.addPartial(i, io.readFileString(aMapOfPartialHBSs[i]));
		}
	}
};

/**
 * <odoc>
 * <key>ow.template.unloadPartialHBSs(aMapOFPartialHBSs)</key>
 * Given the same map provided to ow.template.loadPartialHBS will actually unload them as template partials.
 * </odoc>
 */
OpenWrap.template.prototype.unloadPartialHBSs = function(aMapOfPartialHBSs) {
	for(var i in aMapOfPartialHBSs) {
		ow.template.delPartial(i);
	}
};

/**
 * <odoc>
 * <key>ow.template.saveHBS(aFilename, aSource)</key>
 * Saves aSource Handlebars template into aFilename (tip: use the extension hbs).
 * </odoc>
 */
OpenWrap.template.prototype.saveHBS = function(aFilename, aSource) {
	io.writeFileString(aFilename, aSource);
};

/**
 * <odoc>
 * <key>ow.template.saveCompiledHBS(aFilename, aSource, anOptionsMap)</key>
 * Tries to precompile aSource and save the result into aFilename (tip: use the extension hbsc).
 * This can later be loaded again using ow.template.loadCompiledHBS, for example. 
 * Optionally you can provide anOptionsMap for the Handlebars precompiler (see more on the options for Handlebars.precompile).
 * Example:\
 * \
 * var source = "My name is {{myname}}. I'm a\n{{#each role}}\t- {{this}}\n{{/each}}";\
 * ow.template.saveCompiledHBS("myroles.hbsc", source, {\
 *    { "knowHelpers": ["each"], "knowHelpersOnly": true }\
 * };\
 * \
 * </odoc>
 */
OpenWrap.template.prototype.saveCompiledHBS = function(aFilename, aSource, optionsMap) {
	io.writeFileString(aFilename, ow.template.compile(aSource, optionsMap));
};

/**
 * <odoc>
 * <key>ow.template.compile(aSource, anOptionsMap) : String</key>
 * Tries to precompile aSource and returns a String that can be used with ow.template.execCompiled.
 * Optionally you can provide anOptionsMap for the Handlebars precompiler (see more on ow.template.saveCompiledHBS).
 * </odoc>
 */
OpenWrap.template.prototype.compile = function(aSource, optionsMap) {
	var res;
	var e;
	//sync(function() {
		try {
			res = this.__requireHB().precompile(this.__requireHB().parse(aSource), optionsMap);
		} catch(ee) { e = ee; }
	//}, ow.loadTemplate());
	if (isDef(e)) throw e;
	return res;
};

/**
 * <odoc>
 * <key>ow.template.execCompiled(aCompiledObject) : Function</key>
 * Tries to execute a previously precompiled Handlebars template (for example, using ow.template.compile) and
 * return it as a Handlebars template functions.
 * </odoc>
 */
OpenWrap.template.prototype.execCompiled = function(aCompiledObject) {
	var res;
	var e;
	//sync(function() {
		try {
			res = this.__requireHB().template(af.eval("(" + aCompiledObject + ")"));
		} catch(ee) { e = ee; }
	//}, ow.loadTemplate());
	if (isDef(e)) throw e;
	return res;
};

/**
 * <odoc>
 * <key>ow.template.loadCompiledHBS(aFilename) : Function</key>
 * Tries to load a previously precompiled Handlebars template (for example, using ow.template.saveCompiledHBS) and
 * return it as a Handlebars template functions.
 * </odoc>
 */
OpenWrap.template.prototype.loadCompiledHBS = function(aFilename) {
	var res;
	var e;
	//sync(function() {
		try {
			res = ow.template.execCompiled(io.readFileString(aFilename));
		} catch(ee) { e = ee; }
	//}, ow.loadTemplate());
	if (isDef(e)) throw e;
	return res;
};

/**
 * <odoc>
 * <key>ow.template.parseMD2HTML(aMarkdownString, isFull, removeMaxWidth, extraDownOptions, forceDark) : String</key>
 * Given aMarkdownString will parse it with showdown (using the github flavor) and return the HTML in a string. If isFull = true
 * it will produce a complete HTML with references for the highlight library+css and github markdown css included internally in OpenAF.
 * If removeMaxWidth = true it will remove the max-width css style. You can provide extraDownOptions to be used with showdown and
 * forceDark to force the dark mode.
 * Example:\
 * \
 * ow.server.httpd.route(hs, ow.server.httpd.mapRoutesWithLibs(hs, { \
 *    "/md": (req) => { return hs.replyOKHTML(ow.template.parseMD2HTML(io.readFileString("README.md"), true)) }\
 * }), (req) => { return hs.replyOKText("nothing here...");})\
 * \
 * </odoc>
 */
OpenWrap.template.prototype.parseMD2HTML = function(aMarkdownString, isFull, removeMaxWidth, extraDownOptions, forceDark) {
	extraDownOptions = _$(extraDownOptions).isMap().default(__flags.MD_SHOWDOWN_OPTIONS)

	removeMaxWidth = _$(removeMaxWidth, "removeMaxWidth").isBoolean().default(__flags.MD_NOMAXWIDTH)
	var showdown = require(getOpenAFJar() + "::js/showdown.js");
	//var showdown = loadCompiledRequire("showdown_js");
	showdown.setFlavor("github");
	/*showdown.setOption("customizedHeaderId", "true");
	showdown.setOption("parseImgDimensions", "true");
	showdown.setOption("simplifiedAutoLink", "true");
	showdown.setOption("strikethrough", "true");
	showdown.setOption("tables", "true");
	showdown.setOption("tablesHeaderId", "true");
	showdown.setOption("tasklists", "true");
	showdown.setOption("backslashEscapesHTMLTags", "true");
	showdown.setOption("emoji", "true");
	showdown.setOption("underline", "true");
	showdown.setOption("splitAdjacentBlockquotes", "true");*/
        
	extraDownOptions = merge({
		"customizedHeaderId"      : true,
		"parseImgDimensions"      : true,
		"simplifiedAutoLink"      : true,
		"strikethrough"           : true,
		"tables"                  : true,
		"tablesHeaderId"          : true,
		"tasklists"               : true,
		"backslashEscapesHTMLTags": true,
		"emoji"                   : true,
		"underline"               : true,
		"splitAdjacentBlockquotes": true,
		"simpleLineBreaks"        : true
	}, extraDownOptions)

	Object.keys(extraDownOptions).forEach(k => {
		showdown.setOption(k, extraDownOptions[k])
	})

	var converter = new showdown.Converter();

	if (isFull) {
		if (isUnDef(this.__templatemd)) {
			if (isDef(getOPackPath("Mermaid")) && 
			    io.fileExists(getOPackPath("Mermaid")+"/mermaid.js")) loadLib("mermaid.js")
			this.__templatemd = io.readFileString(getOpenAFJar() + "::hbs/md.hbs")
		}
		
		var _extras = []
		// Process trigger extras
		ow.template.__mdHTMLTExtras.forEach(r => {
			if (aMarkdownString.indexOf(r.t) >= 0) _extras.push(r.e)
		})

		return this.parse(this.__templatemd, {
			markdown: converter.makeHtml(aMarkdownString).replace("<html>", "<html><meta charset=\"utf-8\">"),
			noMaxWidth: removeMaxWidth,
			extras: _extras,
			mdcodeclip: __flags.MD_CODECLIP,
			themeauto: __flags.MD_DARKMODE == "auto" && !forceDark,
			themedark: __flags.MD_DARKMODE == "true" || forceDark
		})
	} else {
		return converter.makeHtml(aMarkdownString).replace("<html>", "<html><meta charset=\"utf-8\">")
	}
};

/**
 * <odoc>
 * <key>parseHTML2MD(aHTMLString, includeScripts) : String</key>
 * Given an HTML string and a flag indicating whether to include scripts, this function converts the HTML to Markdown.
 * </odoc>
 */
OpenWrap.template.prototype.parseHTML2MD = function(aHTMLString, includeScripts) {
	_$(aHTMLString, "aHTMLString").isString().$_()
	includeScripts = _$(includeScripts, "includeScripts").isBoolean().default(true)

	// Optimized HTML to Markdown converter with better performance and completeness
	var html = aHTMLString
	
	// Pre-process to handle nested tags and preserve content
	// Replace entities first to avoid double-processing
	html = html.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
	
	// Handle <script> tags: external scripts become links, inline scripts become fenced code blocks, or ignore them
	if (includeScripts) {
		html = html.replace(/<script([^>]*)>([\s\S]*?)<\/script>/gi, function(_, attrs, content) {
			attrs = attrs || ""
			// find src and type attributes
			var mSrc = attrs.match(/src\s*=\s*['\"]([^'\"]+)['\"]/i)
			var mType = attrs.match(/type\s*=\s*['\"]([^'\"]+)['\"]/i)
			var src = mSrc ? mSrc[1] : null
			var type = mType ? mType[1].toLowerCase() : null
			if (src && (!content || content.trim() === "")) {
				// External script - represent as a markdown link so the reference is preserved
				// ensure we don't produce empty link syntax
				if (!src.trim()) return ""
				return "\n[external script: " + src + "](" + src + ")\n"
			}
			// Inline script - convert to fenced code block. Infer language from type when possible
			var lang = "javascript"
			if (type) {
				if (type.indexOf('json') >= 0) lang = 'json'
				else if (type.indexOf('html') >= 0) lang = 'html'
				else if (type.indexOf('xml') >= 0) lang = 'xml'
				else if (type.indexOf('javascript') >= 0 || type.indexOf('ecmascript') >= 0) lang = 'javascript'
			}
			// Protect any triple-backticks inside the script content
			var safeContent = (content || '').replace(/```/g, '``\\`')
			if (!safeContent.trim()) return ""
			return "\n```" + lang + "\n" + safeContent.trim() + "\n```\n"
		})
	} else {
		// Remove script tags completely - they will be ignored
		html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
	}
	
	// Handle <style> tags: convert to CSS code blocks or remove them
	if (includeScripts) {
		html = html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, function(_, content) {
			// Protect any triple-backticks inside the style content
			var safeContent = (content || '').replace(/```/g, '``\\`')
			if (!safeContent.trim()) return ""
			return "\n```css\n" + safeContent.trim() + "\n```\n"
		})
	} else {
		// Remove style tags completely - they will be ignored
		html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
	}

	// Handle code blocks first to preserve their content
	html = html.replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, function(_, content) {
		var c = content.replace(/^\s+|\s+$/g, '')
		if (!c) return ""
		return "\n```\n" + c + "\n```\n"
	})
	html = html.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, function(_, content) {
		var c = content.replace(/^\s+|\s+$/g, '')
		if (!c) return ""
		return "\n```\n" + c + "\n```\n"
	})
	
	// Handle inline code (preserve content exactly)
	html = html.replace(/<code[^>]*>(.*?)<\/code>/gi, function(_, inner) {
		if (!inner) return "` `"
		return "`" + inner + "`"
	})
	
	// Handle headers (h1-h6)
	html = html.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "\n# $1\n")
	html = html.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n## $1\n")
	html = html.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n### $1\n")
	html = html.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "\n#### $1\n")
	html = html.replace(/<h5[^>]*>(.*?)<\/h5>/gi, "\n##### $1\n")
	html = html.replace(/<h6[^>]*>(.*?)<\/h6>/gi, "\n###### $1\n")
	
	// Handle lists
	html = html.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, function(_, content) {
		return "\n" + content.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n") + "\n"
	})
	html = html.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, function(_, content) {
		var counter = 1
		return "\n" + content.replace(/<li[^>]*>(.*?)<\/li>/gi, function() {
			return (counter++) + ". " + arguments[1] + "\n"
		}) + "\n"
	})
	
	// Handle links - avoid producing empty []() constructs
	html = html.replace(/<a[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi, function(_, _q, href, inner) {
		href = (href || "").trim()
		inner = (inner || "").trim()
		// remove nested tags inside inner for a cleaner label (they'll be processed later if needed)
		inner = inner.replace(/<\/?[^>]+(>|$)/g, "").trim()
		if (!href) {
			// no href - return inner text only (or empty if also empty)
			return inner || ""
		}
		if (!inner) {
			// no label - use autolink to avoid []()
			return "<" + href + ">"
		}
		return "[" + inner + "](" + href + ")"
	})
	
	// Handle images - generic match and guard against empty src
	html = html.replace(/<img[^>]*>/gi, function(match) {
		var mSrc = match.match(/src\s*=\s*['"]([^'"]*)['"]/i)
		var mAlt = match.match(/alt\s*=\s*['"]([^'"]*)['"]/i)
		var src = mSrc ? (mSrc[1] || "").trim() : ""
		var alt = mAlt ? (mAlt[1] || "").trim() : ""
		if (!src) return "" // avoid ![]() when src empty
		if (!alt) alt = ""
		return "![" + alt + "](" + src + ")"
	})
	
	// Handle blockquotes
	html = html.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, function(_, content) {
		var c = content.trim()
		if (!c) return ""
		return "\n> " + c.replace(/\n/g, "\n> ") + "\n"
	})
	
	// Handle tables
	html = html.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, function(_, content) {
		var table = ""
		var rows = content.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)
		if (rows) {
			var isHeader = true
			rows.forEach(function(row) {
				var cells = row.match(/<t[hd][^>]*>(.*?)<\/t[hd]>/gi)
				if (cells) {
					var cellContent = cells.map(function(cell) {
						return cell.replace(/<t[hd][^>]*>(.*?)<\/t[hd]>/gi, "$1").trim()
					})
					// skip completely empty rows
					if (cellContent.join("").trim() === "") return
					table += "| " + cellContent.join(" | ") + " |\n"
					if (isHeader) {
						table += "|" + cellContent.map(() => "---").join("|") + "|\n"
						isHeader = false
					}
				}
			})
		}
		if (!table) return ""
		return "\n" + table + "\n"
	})
	
	// Handle horizontal rules
	html = html.replace(/<hr[^>]*\/?>/gi, "\n---\n")
	
	// Handle line breaks
	html = html.replace(/<br\s*\/?>/gi, "\n")
	
	// Handle text formatting (order matters for nested tags)
	html = html.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
	html = html.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
	html = html.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
	html = html.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*")
	html = html.replace(/<u[^>]*>(.*?)<\/u>/gi, "_$1_")
	html = html.replace(/<del[^>]*>(.*?)<\/del>/gi, "~~$1~~")
	html = html.replace(/<s[^>]*>(.*?)<\/s>/gi, "~~$1~~")
	html = html.replace(/<strike[^>]*>(.*?)<\/strike>/gi, "~~$1~~")
	
	// Handle paragraphs and divs
	html = html.replace(/<p[^>]*>(.*?)<\/p>/gi, function(_, inner) { return inner && inner.trim() ? "\n" + inner + "\n" : "" })
	html = html.replace(/<div[^>]*>(.*?)<\/div>/gi, function(_, inner) { return inner && inner.trim() ? "\n" + inner + "\n" : "" })
	
	// Remove remaining HTML tags
	html = html.replace(/<\/?[^>]+(>|$)/g, "")
	
	// Clean up whitespace and normalize line breaks
	html = html.replace(/\n\s*\n\s*\n/g, "\n\n")  // Remove excessive line breaks
	html = html.replace(/^\s+|\s+$/g, "")          // Trim start and end
	html = html.replace(/[ \t]+/g, " ")            // Normalize spaces
	
	// Decode remaining HTML entities
	html = html.replace(/&nbsp;/g, " ")
	html = html.replace(/&quot;/g, '"')
	html = html.replace(/&apos;/g, "'")
	html = html.replace(/&#(\d+);/g, function(_, dec) {
		return String.fromCharCode(dec)
	})
	html = html.replace(/&#x([0-9a-f]+);/gi, function(_, hex) {
		return String.fromCharCode(parseInt(hex, 16))
	})
	
	return html
}

/**
 * <odoc>
 * <key>ow.template.addInLineCSS2HTML(aHTML, aCustomCSSMap) : String</key>
 * Given aHTML (usually the result of parseMD2HTML) applies a custom inline css (aCustomCSSMap) usually useful to send HTML to 
 * email clients. This custom map should be composed of a html tag entity tag (e.g. "p") and, as value, the css style to apply (e.g. "color: red;").
 * The map will be applied to all html entities on aHTML. If aCustomCSSMap is not provided a default one (suited for markdown
 * html) will be applied.
 * </odoc>
 */
OpenWrap.template.prototype.addInLineCSS2HTML = function(aHTML, aCustomCSSMap) {
	var acss = {};
	if (isUnDef(aCustomCSSMap)) {
		if (isUnDef(this.__markdowncss)) {
			this.__markdowncss = io.readFile(getOpenAFJar() + "::css/markdown-email.json");
		}
		acss= this.__markdowncss;
	} else {
		acss = aCustomCSSMap;
	}

	Object.keys(acss).forEach((k) => {
		aHTML = aHTML.replace(new RegExp("<"+k+"(?=[ >])", "g"), "<"+k+" style=\"" + acss[k] + "\"");
	});

	return aHTML;
};

OpenWrap.template.prototype.md = {
	/**
	 * <odoc>
	 * <key>ow.template.md.table(anArray) : String</key>
	 * Converts anArray into a markdown table string.
	 * </odoc>
	 */
	table: function(anArray) {
		var md = "";
		if (anArray.length > 0) {
		  md += "| " + Object.keys(anArray[0]).join(" | ") + " |\n";
		  md += "|-" + Object.keys(anArray[0]).map(r => repeat(r.length, "-")).join("-|-") + "-|\n";
		  anArray.map(r => md += "| " + Object.values(r).join(" | ") + " |\n");
		}
		return md;
	},
	/**
	 * <odoc>
	 * <key>ow.template.md.fromTable(aMarkdown) : Array</key>
	 * Tries to transform aMarkdown table text into an array.
	 * </odoc>
	 */
	fromTable: function(aMD) {
		var ar = aMD.split("\n").map(r => r.split("|").map(s => s.trim()))

		// Process header
		var hdrs = ar[0]
		hdrs.shift()
		hdrs.pop()
	  
		// Remove header and separator
		ar.shift()
		ar.shift()
	  
		// Process rows
		var m = []
		ar.forEach(r => {
		  if (r.length == 1) return
		  r.shift()
		  r.pop()
	  
		  var mr = {}
		  hdrs.forEach((h, i) => {
			mr[h] = r[i]
		  })
		  m.push(mr)
		})
	  
		return m
	},
	/**
	 * <odoc>
	 * <key>ow.template.md.htmlArrayMap(anMapOrArray) : String</key>
	 * Converts anMapOrArray into a div html suitable to be added to a markdown.
	 * </odoc>
	 */
	htmlArrayMap: function(anMapOrArray) {
		var md = "<div>";
        md = ow.template.html.parseMap(anMapOrArray);
		md += "</div>";

		return md;
	},

	/**
	 * <odoc>
	 * <key>ow.template.md.maxWidth(aValue) : String</key>
	 * Generates the appropriate HTML to set the MD page width to aValue (e.g. 800px). If aValue not
	 * defined it will unset the default limit.
	 * </odoc>
	 */
	maxWidth: function(aValue) {
		aValue = _$(aValue).isString().default("unset")
		return "<style>.markdown-body { max-width: " + aValue + "; }</style>"
	}
};

OpenWrap.template.prototype.html = {
	/**
	 * <odoc>
	 * <key>ow.template.html.parseMap(aMapOrArray, genParts, forceDark) : Object</key>
	 * Returns a string with a HTML representation of the aMapOrArray provided or, if genParts = true, a map with the style css and the out string necessary.
	 * If forceDark = true it will force the dark mode.
	 * </odoc>
	 */
	parseMap: function(aMapOrArray, genParts, forceDark) {
		if (!isMap(aMapOrArray) && !isArray(aMapOrArray)) throw "aMapOrArray needs to be a map or an array.";
		genParts = _$(genParts).isBoolean().default(false);

		try {
			loadCompiledLib("njsmap_js");
		} catch(e) {
			loadLib(getOpenAFJar() + "::js/njsmap.js");
		}

		var out = nJSMap(aMapOrArray, __, (__flags.MD_DARKMODE == "true" || forceDark ? true : __))
		if (genParts) {
			var res = {};
			res.css = io.readFileString(getOpenAFJar() + "::css/nJSMap.css")
			res.out = out;
			
			return res;
		} else {
			return out;
		}
	},
	/**
	 * <odoc>
	 * <key>ow.template.html.parseMapInHTML(aMapOrArray, forceDark) : String</key>
	 * Returns a full HTML page with the nJSMap representation of the aMapOrArray provided. If forceDark = true it will force the dark mode.
	 * </odoc>
	 */
	parseMapInHTML: function(aMapOrArray, forceDark) {
		ow.loadTemplate()

		var _themeauto = ow.template.html.njsmapAutoTheme()
		var code = "var out, _data=" + stringify(aMapOrArray,__,"") + ";"
		if (__flags.MD_DARKMODE == "auto" && !forceDark) {
			code += "out = nJSMap(_data,void 0,window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);"
		} else {
			if (__flags.MD_DARKMODE == "true" || forceDark) {
				code += "out = nJSMap(_data,void 0,true);"
			} else {
				code += "out = nJSMap(_data);"
			}
		}
		code += "document.getElementById(\"njsmap_out\").innerHTML = out;"

		return "<html><script src=\"/js/openafsigil.js\"\></script><script src=\"/js/njsmap.js\"\></script><head><link rel=\"stylesheet\" href=\"/css/" + "nJSMap.css" + "\"></head><body" + (__flags.MD_DARKMODE == "true" ? " class=\"njsmap_dark\"" : "") + "><span id=\"njsmap_out\"></span><script>" + code + "</script>" + _themeauto + "</body></html>"
	},
	/**
	 * <odoc>
	 * <key>ow.template.html.thinFontCSS(aSize) : String</key>
	 * Returns a CSS string for a thin font with the provided aSize (in points).
	 * </odoc>
	 */
	thinFontCSS: function(aSize) {
		aSize = _$(aSize).isNumber().default(8);
		return 'font-family: -apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Oxygen-Sans,Ubuntu,Cantarell,\'Helvetica Neue\',sans-serif; font-size: ' + aSize + 'pt; font-weight: 200; line-height: 110%;';
	},
	/**
	 * <odoc>
	 * <key>ow.template.html.thinFontSpan(aTxt, aSize, aExtra) : String</key>
	 * Returns a HTML span part to write aTxt with the provided aSize (in points).
	 * Optionally aExtra css can be added.
	 * </odoc>
	 */
	thinFontSpan: function(aTxt, aSize, aExtra) {
		aExtra = _$(aExtra).isString().default("");
		return '<span style="' + this.thinFontCSS(aSize) + aExtra + '">' + aTxt + '</span>';
	},
	/**
	 * <odoc>
	 * <key>ow.template.html.thinFontDiv(aTxt, aSize, aExtra) : String</key>
	 * Returns a HTML div part to write aTxt with the provided aSize (in points).
	 * Optionally aExtra css can be added.
	 * </odoc>
	 */
	thinFontDiv: function(aTxt, aSize, aExtra) {
		aExtra = _$(aExtra).isString().default("");
		return '<div style="' + this.thinFontCSS(aSize) + aExtra + '">' + aTxt + '</div>';
	},
	/**
	 * <odoc>
	 * <key>ow.template.html.inlineSrc(aFile, aPrefix, aSuffix) : String</key>
	 * Returns a base64 representation of aFile to include in markdown/html content. If aPrefix and/or aSuffix is provided it will
	 * be prefixed and suffixed to the output.
	 * </odoc>
	 */
	inlineSrc: function(aFile, aPrefix, aSuffix) {
		_$(aFile, "aFile").isString().$_();
		aPrefix = _$(aPrefix, "aPrefix").isString().default("");
		aSuffix = _$(aSuffix, "aSuffix").isString().default("");

		ow.loadServer();
		var src = "data:" + ow.server.httpd.getMimeType(aFile) +";base64," + af.fromBytes2String(af.toBase64Bytes(io.readFileBytes(aFile)));
		return aPrefix + src + aSuffix;
	},
	/**
	 * <odoc>
	 * <key>ow.template.html.inlineSrcURL(aURL, aPrefix, aSuffix) : String</key>
	 * Returns a base64 representation of aURL to include in markdown/html content. If aPrefix and/or aSuffix is provided it will
	 * be prefixed and suffixed to the output.
	 * </odoc>
	 */
	inlineSrcURL: function(aURL, aPrefix, aSuffix) {
		ow.loadObj();

		var h = new ow.obj.http();
		try {
			var u = new java.net.URL(aURL);
			var b = h.get(aURL, __, __, true);
			return aPrefix + "data:" + b.contentType.replace(/\; charset=utf-8\;/, "\;") +";base64," + af.fromBytes2String(af.toBase64Bytes(b.responseBytes)) + aSuffix;
		} catch(e1) {
			return ow.template.html.inlineSrc(aURL, aPrefix, aSuffix);
		}
	},
	/**
	 * <odoc>
	 * <key>ow.template.html.inlineImageTag(aImageFile, justPartial) : String</key>
	 * Returns a base64 representation of aImageFile to include in markdown/html content. If justPartial = true then only the src 
	 * part of the html img tag is returned.
	 * </odoc>
	 */	
	inlineImageTag: function(aImageFile, justPartial) {
		return ow.template.html.inlineSrc(aImageFile, (justPartial ? "" : "<img src=\"", "\">"));
	},
	/**
	 * <odoc>
	 * <key>ow.template.html.njsmapAutoTheme() : String</key>
	 * Returns a script to automatically set the njsmap theme based on the user's preference if the MD_DARKMODE flag is set to "auto".
	 * </odoc>
	 */
	njsmapAutoTheme: function() {
		var _themeauto = "";
		if (__flags.MD_DARKMODE == "auto") {
			_themeauto = `<script>if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) document.body.classList.add('njsmap_dark')</script>`
		}
		return _themeauto
	},
	/**
	 * <odoc>
	 * <key>ow.template.html.genStaticVersion4MDFile(anOriginalMDFile) : String</key>
	 * Tries to convert a markdown file into a single HTML embeeding css and image contents.
	 * </odoc>
	 */
	genStaticVersion4MDFile: function(anOriginalMDFile) {
		return ow.template.html.genStaticVersion4MD(io.readFileString(anOriginalMDFile));
	},
	/**
	 * <odoc>
	 * <key>ow.template.html.genStaticVersion4MD(anOriginalMD) : String</key>
	 * Tries to convert a markdown into a single HTML embeeding css and image contents.
	 * </odoc>
	 */
	genStaticVersion4MD: function(anOriginalMD) {
		return ow.template.html.genStaticVersion(ow.template.parseMD2HTML(anOriginalMD, true));
	},
	/**
	 * <odoc>
	 * <key>ow.template.html.genStaticVersion(anOriginalHTML) : String</key>
	 * Tries to convert anOriginalHTML with "src" based tags like img, script &amp; stylesheet link tags into a single HTML embeeding 
	 * all content.
	 * </odoc>
	 */
	genStaticVersion: function(anOriginalHTML) {
		var srcs = anOriginalHTML.match(/ src=\".+?\"/g);

		ow.loadObj();
		var testURL = (aURL, withContents) => {
			var h = new ow.obj.http();
			try {
				var u = new java.net.URL(aURL);
				var b = h.get(aURL, __, __, true);
				if (withContents)
					return af.fromBytes2String(b.responseBytes);
				else
					return "data:" + b.contentType.replace(/\; charset=utf-8\;/, "\;") +";base64," + af.fromBytes2String(af.toBase64Bytes(b.responseBytes));
			} catch(e1) {
				try {
					if (withContents)
						return io.readFileString(aURL);
					else
						return ow.template.html.inlineSrc(aURL).replace(/\; charset=utf-8\;/, "\;");
				} catch(e2) {
					try {
						var _path = isDef(ow.template.__srcPath[aURL]) ? ow.template.__srcPath[aURL] : getOpenAFJar() + "::" + aURL.replace(/^\//, "")
						if (withContents)
							return io.readFileString(_path)
						else
							return ow.template.html.inlineSrc(_path).replace(/\; charset=utf-8\;/, "\;");
					} catch(e3) {
						return aURL;
					}
				} 
			}
		};

		// src=
		var srcs_replaces = [];
		for(var ii in srcs) {
			srcs_replaces[srcs[ii]] = testURL(srcs[ii].match(/ src=\"(.+?)\"/)[1], false);
		}
		for(var ii in srcs_replaces) {
			anOriginalHTML = anOriginalHTML.replace(ii, " src=\"" + srcs_replaces[ii] + "\"");
		}

		// link stylesheet
		srcs = anOriginalHTML.match(/<link rel=\"stylesheet\" href=\".+?\">/g);
		srcs_replaces = [];
		for(var ii in srcs) {
			srcs_replaces[srcs[ii]] = testURL(srcs[ii].match(/<link rel=\"stylesheet\" href=\"(.+?)\">/)[1], true);
		}
		for(var ii in srcs_replaces) {
			anOriginalHTML = anOriginalHTML.replace(ii, "<style>" + srcs_replaces[ii] + "</style>");
		}

		return anOriginalHTML;
	}
};

OpenWrap.template.prototype.Handlebars = function() {
	return this.__requireHB();
};
