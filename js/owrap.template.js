// OpenWrap v2
// Author: Nuno Aguiar
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

OpenWrap.template.prototype.__requireHB = function() {
	var hb = loadCompiledRequire("handlebars_js");
	this.__addHelpers(hb);
	this.__addPartials(hb);
	return hb;
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
	this.__helpers = _$(this.__helpers).default({});

	var m = Object.keys(aObject.constructor.prototype);
	if (m.length < 1) m = (isDef(aObject.prototype)) ? Object.keys(aObject.prototype) : Object.keys(aObject);
	m.forEach((aMethod) => {
		var subs = Object.keys(aObject[aMethod]);
		if (subs.length == 0)
			this.__helpers[aPrefix + aMethod] = aObject[aMethod];
		else 
			this.addHelpers(aPrefix + aMethod + "_", aObject[aMethod]);
		//require(this.hb).registerHelper(aPrefix + aMethod, aObject[aMethod]);
	});
};

OpenWrap.template.prototype.__addHelpers = function(aHB) {
	this.__helpers = _$(this.__helpers).default({});
	for(var i in this.__helpers) {
		aHB.registerHelper(i, this.__helpers[i]);
	}
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
 *   - $env             -- returns the current environment variable identified by the parameter\
 *   - $escape          -- returns an escaped version of the parameter\
 *   - $f               -- uses the $f format function\
 *   - $ft              -- uses the $ft format function\
 *   - $get             -- uses the $$.get function to access objects\
 *   - $path            -- uses the $path function to query objects\
 *   - $toSLON          -- returns the ow.format.toSLON version of an object\
 *   - $get            -- returns the corresponding value for a key on $get\
 *   - $getObj         -- equivalent to $get with the extra parameter for $$.get path\ 
 * \
 * </odoc>
 */
OpenWrap.template.prototype.addOpenAFHelpers = function() {
	// Don't load if already loaded
	if (this.__helperOpenAF) return

	ow.loadFormat();
	ow.template.addHelper("$debug", sprint);
	ow.template.addHelper("$stringify", stringify);
	ow.template.addHelper("$stringifyInLine", (s) => { return stringify(s, __, ""); });
	ow.template.addHelper("$toYAML", af.toYAML);
	ow.template.addHelper("$env", getEnv);
	ow.template.addHelper("$escape", (s) => { return s.replace(/['"]/g, "\\$1"); });	
	ow.template.addHelper("$f", $f);
	ow.template.addHelper("$ft", $ft);
	ow.template.addHelper("$get", (o, p) => $$(o).get(p));
	ow.template.addHelper("$path", (o, p) => $path(o, p));
	ow.template.addHelper("$toSLON", ow.format.toSLON);
	ow.template.addHelper("$get", $get)
	ow.template.addHelper("$getObj", (o, p) => $$($get(o)).get(p))

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
	ow.template.addHelper("$and", function(a, b, s) { return (a && b) ? s.fn(this) : s.inverse(this); });
	ow.template.addHelper("$compare", function(a, op, b, s) {
		if (arguments.length < 4) { throw 'Compare helper expects 4 arguments'; }
		var result;	
		switch(op) {
		case '==' : result = a == b; break;
		case '===': result = a === b; break;
		case '!=' : result = a != b; break;
		case '!==': result = a !== b; break;
		case '<'  : result = a < b; break;
		case '>'  : result = a > b; break;
		case '<=' : result = a <= b; break;
		case '>=' : result = a >= b; break;
		case 'typeof': result = typeof a === b; break;
		default: throw 'Invalid operator: `' + op + '`';
		}
		
		if (result === false) return s.inverse(this); 
		return s.fn(this);
	});
	ow.template.addHelper("$contains", function(collec, value, sIdx, s) {
		loadUnderscore();
		if (typeof sIdx === 'object') {
			s = sIdx; sIdx = undefined;
		}
		if(_.isString(collec) && collec.indexOf(value, sIdx) > -1) return s.fn(this);
		if(_.contains(collec, value, sIdx)) return s.fn(this); 
		return s.inverse(this);
	});
	ow.template.addHelper("$gt", function(a, b, s) {
		if (arguments.length === 2) {
			s = b;
			b = s.hash.compare;
		}
		if (a > b) return s.fn(this);
		return s.inverse(this);
	});
	ow.template.addHelper("$gte", function(a, b, s) {
		if (arguments.length === 2) {
			s = b;
			b = s.hash.compare;
		}
		if (a >= b) return s.fn(this);
		return s.inverse(this);
	});
	ow.template.addHelper("$has", function(v, p, s) {
		loadUnderscore();
		if (arguments.length === 2) return p.inverse(this);
		if (arguments.length === 1) return v.inverse(this);
		if ((Array.isArray(v) || _.isString(v)) && _.isString(p)) {
			if (v.indexOf(p) > -1) return s.fn(this);
		}
		if (isObject(v) && _.isString(p) && p in v) return s.fn(this);
		s.inverse(this);
	});
	ow.template.addHelper("$eq", function(a, b, s) {
		if (arguments.length === 2) {
			s = b;
			b = s.hash.compare;
		}
		if (a === b) return s.fn(this);
		return s.inverse(this);
	});	
	ow.template.addHelper("$ifEven", function(n, s) { return (n % 2 == 0) ? s.fn(this) : s.inverse(this); });
	ow.template.addHelper("$ifNth", function(a, b, s) { return (++b % a === 0) ? s.fn(this) : s.inverse(this); });
	ow.template.addHelper("$ifOdd", function(n, s) { return (n % 2 == 1) ? s.fn(this) : s.inverse(this); });
	ow.template.addHelper("$is", function(a, b, s) {
		if (arguments.length === 2) {
			s = b;
			b = s.hash.compare;
		}
		if (a === b) return s.fn(this);
		return s.inverse(this);
	});	
	ow.template.addHelper("$isnt", function(a, b, s) {
		if (arguments.length === 2) {
			s = b;
			b = s.hash.compare;
		}
		if (a !== b) return s.fn(this);
		return s.inverse(this);
	});
	ow.template.addHelper("$lt", function(a, b, s) {
		if (arguments.length === 2) {
			s = b;
			b = s.hash.compare;
		}
		if (a < b) return s.fn(this);
		return s.inverse(this);
	});		
	ow.template.addHelper("$lte", function(a, b, s) {
		if (arguments.length === 2) {
			s = b;
			b = s.hash.compare;
		}
		if (a <= b) return s.fn(this);
		return s.inverse(this);
	});		
	ow.template.addHelper("$neither", function(a, b, s) { return (!a && !b) ? s.fn(this) : s.inverse(this); });		
	ow.template.addHelper("$or", function(a, b, s) { return (a === true || b === true) ? s.fn(this) : s.inverse(this); });		
	ow.template.addHelper("$unlessEq", function(ctx, s) { return (ctx === s.hash.compare) ? s.fn(this) : s.inverse(this); });		
	ow.template.addHelper("$unlessGt", function(ctx, s) { return (ctx > s.hash.compare) ? s.fn(this) : s.inverse(this); });	
	ow.template.addHelper("$unlessLt", function(ctx, s) { return (ctx < s.hash.compare) ? s.fn(this) : s.inverse(this); });		
	ow.template.addHelper("$unlessGteq", function(ctx, s) { return (ctx >= s.hash.compare) ? s.fn(this) : s.inverse(this); });		
	ow.template.addHelper("$unlessLteq", function(ctx, s) { return (ctx <= s.hash.compare) ? s.fn(this) : s.inverse(this); });	
	
	this.__helperCond = true
}

/**
 * <odoc>
 * <key>ow.template.addHelper(aHelperName, aFunction)</key>
 * Adds aFunction as aHelperName.
 * </odoc>
 */
OpenWrap.template.prototype.addHelper = function(aHelperName, aFunction) {
	this.__helpers = _$(this.__helpers).default({});
	if (isUnDef(this.hb)) this.__requireHB();

	this.__helpers[aHelperName] = aFunction;
	//require(this.hb).registerHelper(aHelperName, aFunction);
}

/**
 * <odoc>
 * <key>ow.template.delHelper(aHelperName)</key>
 * Unregister aHelperName that had been previously added with ow.template.addHelper.
 * </odoc>
 */
OpenWrap.template.prototype.delHelper = function(aHelperName) {
	this.__helpers = _$(this.__helpers).default({});
	if (isUnDef(this.hb)) this.__requireHB();
	
	delete this.__helpers[aHelperName];
	//require(this.hb).unregisterHelper(aHelperName);
};

/**
 * <odoc>
 * <key>ow.template.addPartial(aPartialName, aSource)</key>
 * Registers aSource template as a reusable aPartialName in other templates.
 * </odoc>
 */
OpenWrap.template.prototype.addPartial = function(aPartial, aSource) {
	this.__partials = _$(this.__partials).default({});
	this.__partials[aPartial] = aSource;
	//require(this.hb).registerPartial(aPartial, aSource);
};

OpenWrap.template.prototype.__addPartials = function(aHB) {
	this.__partials = _$(this.__partials).default({});
	for(var i in this.__partials) {
		aHB.registerPartial(i, this.__partials[i]);
	}
};

/**
 * <odoc>
 * <key>ow.template.delPartial(aPartialName)</key>
 * Unregisters aPartialName that had been previously added with ow.template.addPartial
 * </odoc>
 */
OpenWrap.template.prototype.delPartial = function(aPartial) {
	delete this.__partials[aPartial];
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
	var res;
	var e;
	//sync(function() {
	try {
		res = this.__requireHB().compile(aSource);
	} catch(ee) { e = ee; }
	//}, ow.loadTemplate());
	if (isDef(e)) throw e;
	return res;
}

/**
 * <odoc>
 * <key>ow.template.parse(aSource, someData) : String</key>
 * Returns the results of using someData to the template defined on the aSource provided.
 * Note: for parallel processing you should use ow.template.compile since Handlebars might not be thread-safe.
 * </odoc>
 */
OpenWrap.template.prototype.parse = function(aSource, someData) {
	someData = (isUnDef(someData)) ? this : someData;
	var res;
	var e;
	var parent = this;
	//sync(function() {
		try {
			res = (parent.getTemplate(aSource))(someData);
		} catch(ee) { e = ee; }
	//}, ow.loadTemplate());
	if (isDef(e)) throw e;
	return res;
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
 * <key>ow.template.parseMD2HTML(aMarkdownString, isFull, removeMaxWidth) : String</key>
 * Given aMarkdownString will parse it with showdown (using the github flavor) and return the HTML in a string. If isFull = true
 * it will produce a complete HTML with references for the highlight library+css and github markdown css included internally in OpenAF.
 * Example:\
 * \
 * ow.server.httpd.route(hs, ow.server.httpd.mapRoutesWithLibs(hs, { \
 *    "/md": (req) => { return hs.replyOKHTML(ow.template.parseMD2HTML(io.readFileString("README.md"), true)) }\
 * }), (req) => { return hs.replyOKText("nothing here...");})\
 * \
 * </odoc>
 */
OpenWrap.template.prototype.parseMD2HTML = function(aMarkdownString, isFull, removeMaxWidth) {
	removeMaxWidth = _$(removeMaxWidth, "removeMaxWidth").isBoolean().default(__flags.MD_NOMAXWIDTH)
	//var showdown = require(getOpenAFJar() + "::js/showdown.js");
	var showdown = loadCompiledRequire("showdown_js");
	showdown.setFlavor("github");
        showdown.setOption("customizedHeaderId", "true");
        showdown.setOption("parseImgDimensions", "true");
        showdown.setOption("simplifiedAutoLink", "true");
        showdown.setOption("strikethrough", "true");
        showdown.setOption("tables", "true");
        showdown.setOption("tablesHeaderId", "true");
        showdown.setOption("tasklists", "true");
        showdown.setOption("backslashEscapesHTMLTags", "true");
        showdown.setOption("emoji", "true");
        showdown.setOption("underline", "true");
	showdown.setOption("splitAdjacentBlockquotes", "true");
        
	var converter = new showdown.Converter();

	if (isFull) {
		if (isUnDef(this.__templatemd)) {
			this.__templatemd = io.readFileString(getOpenAFJar() + "::hbs/md.hbs");
		}
		
		return this.parse(this.__templatemd, {
			markdown: converter.makeHtml(aMarkdownString),
			noMaxWidth: removeMaxWidth
		});
	} else {
		return converter.makeHtml(aMarkdownString);
	}
};

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
	 * <key>ow.template.html.parseMap(aMapOrArray, genParts) : Object</key>
	 * Returns a string with a HTML representation of the aMapOrArray provided or, if genParts = true, a map with the style css and the out string necessary.
	 * </odoc>
	 */
	parseMap: function(aMapOrArray, genParts) {
		if (!isMap(aMapOrArray) && !isArray(aMapOrArray)) throw "aMapOrArray needs to be a map or an array.";
		genParts = _$(genParts).isBoolean().default(false);

		try {
			loadCompiledLib("njsmap_js");
		} catch(e) {
			loadLib(getOpenAFJar() + "::js/njsmap.js");
		}

		var out = nJSMap(aMapOrArray);
		if (genParts) {
			var res = {};
			res.css = io.readFileString(getOpenAFJar() + "::css/nJSMap.css");
			res.out = out;
			
			return res;
		} else {
			return out;
		}
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
						if (withContents)
							return io.readFileString(getOpenAFJar() + "::" + aURL.replace(/^\//, ""));
						else
							return ow.template.html.inlineSrc(getOpenAFJar() + "::" + aURL.replace(/^\//, "")).replace(/\; charset=utf-8\;/, "\;");
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
