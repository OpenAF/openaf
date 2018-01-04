// OpenWrap v2
// Author: Nuno Aguiar
// Template

OpenWrap.template = function() {
	//loadHandlebars();
	if (isUnDef(this.hb)) {
		this.hb = getOpenAFJar() + "::js/handlebars.js";
		require(this.hb);
		this.__helpers = {};
		this.__partials = {};
	}
	return ow.template;
};

OpenWrap.template.prototype.__requireHB = function() {
	var hb = require(this.hb);
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
	for(var i in this.__helpers) {
		aHB.registerHelper(i, this.__helpers[i]);
	}
};

/**
 * <odoc>
 * <key>ow.template.addFormatHelpers()</key>
 * Adds all functions of ow.format as helpers with the prefix owFormat_.
 * </odoc>
 */
OpenWrap.template.prototype.addFormatHelpers = function() {
	ow.loadFormat();
	this.addHelpers("owFormat_", ow.format);
}

/**
 * <odoc>
 * <key>ow.template.addConditionalHelpers()</key>
 * Adds helper functions equivalent to assemble.io comparison helpers.
 * See more in http://assemble.io/helpers/helpers-comparison.html
 * </odoc>
 */
OpenWrap.template.prototype.addConditionalHelpers = function() {
	// Based on assemble.io handlebars helpers https://github.com/assemble/handlebars-helpers
	ow.template.addHelper("and", function(a, b, s) { return (a && b) ? s.fn(this) : s.inverse(this); });
	ow.template.addHelper("compare", function(a, op, b, s) {
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
	ow.template.addHelper("contains", function(collec, value, sIdx, s) {
		loadUnderscore();
		if (typeof sIdx === 'object') {
			s = sIdx; sIdx = undefined;
		}
		if(_.isString(collec) && collec.indexOf(value, sIdx) > -1) return s.fn(this);
		if(_.contains(collec, value, sIdx)) return s.fn(this); 
		return s.inverse(this);
	});
	ow.template.addHelper("gt", function(a, b, s) {
		if (arguments.length === 2) {
			s = b;
			b = s.hash.compare;
		}
		if (a > b) return s.fn(this);
		return s.inverse(this);
	});
	ow.template.addHelper("gte", function(a, b, s) {
		if (arguments.length === 2) {
			s = b;
			b = s.hash.compare;
		}
		if (a >= b) return s.fn(this);
		return s.inverse(this);
	});
	ow.template.addHelper("has", function(v, p, s) {
		loadUnderscore();
		if (arguments.length === 2) return p.inverse(this);
		if (arguments.length === 1) return v.inverse(this);
		if ((Array.isArray(v) || _.isString(v)) && _.isString(p)) {
			if (v.indexOf(p) > -1) return s.fn(this);
		}
		if (isObject(v) && _.isString(p) && p in v) return s.fn(this);
		s.inverse(this);
	});
	ow.template.addHelper("eq", function(a, b, s) {
		if (arguments.length === 2) {
			s = b;
			b = s.hash.compare;
		}
		if (a === b) return s.fn(this);
		return s.inverse(this);
	});	
	ow.template.addHelper("ifEven", function(n, s) { return (n % 2 == 0) ? s.fn(this) : s.inverse(this); });
	ow.template.addHelper("ifNth", function(a, b, s) { return (++b % a === 0) ? s.fn(this) : s.inverse(this); });
	ow.template.addHelper("ifOdd", function(n, s) { return (n % 2 == 1) ? s.fn(this) : s.inverse(this); });
	ow.template.addHelper("is", function(a, b, s) {
		if (arguments.length === 2) {
			s = b;
			b = s.hash.compare;
		}
		if (a === b) return s.fn(this);
		return s.inverse(this);
	});	
	ow.template.addHelper("isnt", function(a, b, s) {
		if (arguments.length === 2) {
			s = b;
			b = s.hash.compare;
		}
		if (a !== b) return s.fn(this);
		return s.inverse(this);
	});
	ow.template.addHelper("lt", function(a, b, s) {
		if (arguments.length === 2) {
			s = b;
			b = s.hash.compare;
		}
		if (a < b) return s.fn(this);
		return s.inverse(this);
	});		
	ow.template.addHelper("lte", function(a, b, s) {
		if (arguments.length === 2) {
			s = b;
			b = s.hash.compare;
		}
		if (a <= b) return s.fn(this);
		return s.inverse(this);
	});		
	ow.template.addHelper("neither", function(a, b, s) { return (!a && !b) ? s.fn(this) : s.inverse(this); });		
	ow.template.addHelper("or", function(a, b, s) { return (a === true || b === true) ? s.fn(this) : s.inverse(this); });		
	ow.template.addHelper("unlessEq", function(ctx, s) { return (ctx === s.hash.compare) ? s.fn(this) : s.inverse(this); });		
	ow.template.addHelper("unlessGt", function(ctx, s) { return (ctx > s.hash.compare) ? s.fn(this) : s.inverse(this); });	
	ow.template.addHelper("unlessLt", function(ctx, s) { return (ctx < s.hash.compare) ? s.fn(this) : s.inverse(this); });		
	ow.template.addHelper("unlessGteq", function(ctx, s) { return (ctx >= s.hash.compare) ? s.fn(this) : s.inverse(this); });		
	ow.template.addHelper("unlessLteq", function(ctx, s) { return (ctx <= s.hash.compare) ? s.fn(this) : s.inverse(this); });			
}

/**
 * <odoc>
 * <key>ow.template.addHelper(aHelperName, aFunction)</key>
 * Adds aFunction as aHelperName.
 * </odoc>
 */
OpenWrap.template.prototype.addHelper = function(aHelperName, aFunction) {
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
	this.__partials[aPartial] = aSource;
	//require(this.hb).registerPartial(aPartial, aSource);
};

OpenWrap.template.prototype.__addPartials = function(aHB) {
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
	someData = (isUndefined(someData)) ? this : someData;
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
	someData = (isUndefined(someData)) ? this : someData;
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
}

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
 * <key>ow.template.parseMD2HTML(aMarkdownString, isFull) : String</key>
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
OpenWrap.template.prototype.parseMD2HTML = function(aMarkdownString, isFull) {
	var showdown = require(getOpenAFJar() + "::js/showdown.js");
	showdown.setFlavor("github");
	var converter = new showdown.Converter();

	if (isFull) {
		if (isUnDef(this.__templatemd)) {
			this.__templatemd = io.readFileString(getOpenAFJar() + "::hbs/md.hbs");
		}
		
		return this.parse(this.__templatemd, {
			markdown: converter.makeHtml(aMarkdownString)
		});
	} else {
		return converter.makeHtml(aMarkdownString);
	}
};

OpenWrap.template.prototype.Handlebars = function() {
	return this.__requireHB();
};