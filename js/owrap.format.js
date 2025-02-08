// OpenWrap v2
// Copyright 2024 Nuno Aguiar
// Format
// (parts from assemble.io)
 
OpenWrap.format = function() {
	return ow.format;
}

OpenWrap.format.prototype.string = {
	// from: https://dmitripavlutin.com/what-every-javascript-developer-should-know-about-unicode/
	/** 
	 * <odoc>
	 * <key>ow.format.string.unicode(aCodeNumber) : String</key>
	 * Given a unicode aCodeNumber (8 or 16 bits) will convert to the necessary sequence of 8 bit.
	 * For example: ow.format.string.unicode(0x1F37A)
	 * </odoc>
	 **/
    unicode: code => {
	    var str = "";
	    if (code > 0xFFFF) {
	       var pair = ow.format.string.getSurrogatePair(code);
	       str += String.fromCharCode(pair[0]) + String.fromCharCode(pair[1]); 
	    } else {
	       str += String.fromCharCode(code);
	    }
	    return str;
    },
	/**
	 * <odoc>
	 * <key>ow.format.string.genPass(aSize, aSets, aExclude, aWeights) : String</key>
	 * Tries to generate a random password with aSize (defaults to 12) optionally given an array of aSets (between lowercase, uppercase, numbers, symbols and symbols2)
	 * and also aExclude a string of characters given an optional percentage of aWeights probability for each aSets.
	 * </odoc>
	 */
	genPass: (aSize, aSets, aExclude, aWeights) => {
		var sets = {
			lowercase: "abcdefghijklmnopqrstuvwxyz",
			uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
			numbers  : "1234567890",
			symbols  : "!@#$%*+_-?",
			symbols2 : "\",./:;'<=>(){}?@[\\]^`~&"
		}

		var weight = {
			lowercase: 40,
			uppercase: 36,
			numbers  : 15,
			symbols  : 9,
			symbols2 : 9
		}

		aSize    = _$(aSize, "aSize").isNumber().default(12)
		aSets    = _$(aSets, "aSets").isArray().default(["lowercase","uppercase","numbers","symbols"])
		aWeights = _$(aWeights, "aWeigths").isMap().default({})
		aWeights = merge(weight, aWeights)
		aExclude = _$(aExclude, "aExclude").isString().default("")

		ow.loadObj()

		var pass = "", numberOfSets = sets.length

		var ar = aSets.map(r => ({
			s: sets[r], 
			w: weight[r]
		}))

		var pass = "", sr = new java.security.SecureRandom()
		for(var i = 0; i < aSize; i++) {
			var s, c;
			do {
				s = String( ow.obj.oneOf( ar, "w" ).s )
				c = s.charAt( sr.nextInt(s.length) )
			} while(aExclude.indexOf(c) >= 0)
			pass += c 
		}
		return pass
	},
	/**
	 * <odoc>
	 * <key>ow.format.string.getSurrogatePair(astralCodePoint) : Array</key>
	 * Returns an array of two 8 bit codes given an unicode astralCodePoint of 16 bits
	 * </odoc>
	 **/
	getSurrogatePair: astralCodePoint => {
	    let highSurrogate = Math.floor((astralCodePoint - 0x10000) / 0x400) + 0xD800;
	    let lowSurrogate = (astralCodePoint - 0x10000) % 0x400 + 0xDC00;
	    return [highSurrogate, lowSurrogate];
	},
	/**
	 * <odoc>
	 * <key>ow.format.string.getAstralCodePoint(aHighSurrogate, aLowSurrogate) : Number</key>
	 * Given a 8-bit aHighSurrogate code and a 8-bit aLowSurogate code returns a 16-bit unicode code
	 * </odoc>
	 **/
	getAstralCodePoint: (highSurrogate, lowSurrogate) => {
	    return (highSurrogate - 0xD800) * 0x400 + lowSurrogate - 0xDC00 + 0x10000;
	},
	/**
	 * <odoc>
	 * <key>ow.format.string.wordWrapArray(anArray, maxTableSize, sepLen, sepFunc, useIndex) : Array</key>
	 * Given anArray of maps will return an array suitable to use with printTable for a maxTableSize, a separator length
	 * (sepLen (which defaults to 1)) and an optional line separator function (sepFunc that receives the max length of a 
	 * column). Word-wrap is achieved by creating new map array entries whenever the calculated max size of each line 
	 * with sepLen is achieved. The boolean flag useIndex changes the result to a map with lines and idx (array of the positions
	 * on the lines array that are a new anArray entry). Example of usage:\
	 * \
	 *   __initializeCon()\
     *   var maxS = __con.getTerminal().getWidth()\
	 *   print(printTable(ow.format.string.wordWrapArray(io.listFiles("js").files, maxS, 1, s => ansiColor("FAINT", repeat(s, "-"))), maxS))\
	 * 
	 * </odoc>
	 */
	wordWrapArray: (ar, maxTableSize, sepLen, sepFunc, useIndex) => {
		_$(ar, "ar").isArray().$_()
		_$(maxTableSize, "maxTableSize").isNumber().$_()
		sepFunc = _$(sepFunc, "sepFunc").isFunction().default(__)
		sepLen = _$(sepLen, "sepLen").isNumber().default(1)
	
		if (ar.length == 0) return []
	
		// Finding max sizes
		var maxSizes = [], fixedMinSize = []
		var _keys = Object.keys(ar[0])
		var _alKeys = _keys.map(k => visibleLength(k))
		maxSizes = _keys.map(k => 0)
		fixedMinSize = _keys.map(k => 0)
		ar.forEach(row => {
			for(let i = 0; i < _keys.length; i++) {
				let column = row[_keys[i]]
				let _v
				if (column != null && !isNaN(_v) && typeof _v.getDate !== "undefined") {
					_v = column.toISOString().replace("Z","").replace("T"," ")
				} else {
					_v = column == null ? "" : (isDef(column) ? String(column) : "")
				}
				fixedMinSize[i] = Math.max(fixedMinSize[i], _alKeys[i])
				maxSizes[i] = Math.max(maxSizes[i], visibleLength(_v))
			}
		})
	  
		maxSizes = maxSizes.map((r, i) => Math.max(r, fixedMinSize[i]))
	  
		var numOfCols = maxSizes.length
		var fixedSize = (sepLen * (numOfCols-1))
		var curMaxSize = $from(maxSizes).sum() + (sepLen * (numOfCols-1)) + 1 // (numOfCols-1) = num of separators and new line
		var chgCols = new Set()
		if (curMaxSize > maxTableSize) {
			var fd = Math.ceil(maxTableSize / numOfCols)
			maxSizes.forEach((s, i) => {
				if (fixedMinSize[i] < (s - fd)) 
					chgCols.add(i)
				else
					fixedSize += s
			})
		}
	
		// Pass math
		//var diffPerCol = (curMaxSize > maxTableSize ? Math.ceil((curMaxSize - maxTableSize) / chgCols.length) : 0)
		var maxSubLines = 0
		var maxCol = maxTableSize * __flags.TABLE.wordWrapLimitFactor
	
		// Limiting function
		var rowLimitFn = s => {
			if (isString(s)) {
				if (__flags.TABLE.wordWrapLimitFactor > 0 && visibleLength(s) > maxCol) {
					return s.substr(0, maxCol) + "..."
				} else {
					return s
				}
			} else {
				return s
			}
		}
	  
		//print(`curMaxSize=${curMaxSize} | maxTableSize=${maxTableSize} | chgCols.len=${af.toCSLON(chgCols)} | fixedSize=${fixedSize}`)
	
		var _lines = [], _idx = [ ], _newSize = []
		var _keys = Object.keys(ar[0])
		ar.forEach(_ar => {
		  // Processing line
		  let lines = []
		  for(var i = 0; i < _keys.length; i++) {
			v = _ar[_keys[i]]
	
			let _v
			if (isDate(v)) _v = v.toISOString().replace("Z","").replace("T"," "); else _v = v
			if (chgCols.has(i)) {
				_newSize[i] = Math.max(fixedMinSize[i], Math.round((maxSizes[i] * (maxTableSize - fixedSize))/(curMaxSize - fixedSize)))
			} else {
				_newSize[i] = Math.max(fixedMinSize[i], maxSizes[i])
			}
			var _sar = String((chgCols.has(i) ? rowLimitFn(ow.format.string.wordWrap(_v, _newSize[i] )) : rowLimitFn(_v) )).split("\n")
			maxSubLines = Math.max(maxSubLines, _sar.length)
			lines.push(_sar)
		  }
	
		  // Prepare lines
		  var _s = []
		  for (var _lx = 0; _lx < maxSubLines; _lx++) {
			var _m = {}
			for(var i = 0; i < lines.length; i++) {
				let r = lines[i]
				if (isUnDef(_s[i])) {
					if (__flags.TABLE.wordWrapLimitFactor > 0 && _newSize[i] > maxCol) {
						_s[i] = maxCol
					} else {
						_s[i] = _newSize[i]
					}
				  }
				  if (isDef(r[_lx])) {
					_m[_keys[i]] = r[_lx] + (_s[i] > visibleLength(r[_lx]) ? repeat(_s[i] - visibleLength(r[_lx]), ' ') : "")
				  } else {
					_m[_keys[i]] = repeat(_s[i], ' ')
				  }
			}
			_lines.push(_m)
		  }
	
		  // Preparing sep
		  if (isDef(sepFunc)) {
			var _m = {}, _ds = 0
			_keys.forEach((k, i) => {
			  _m[k] = sepFunc(_s[i])
			  _ds += _s[i]
			})
			_lines.push(_m)
		  }
	
		  _idx.push(_lines.length)
		})
	  
		return useIndex ? { lines: _lines, idx: _idx } : _lines
	},
	/**
	 * <odoc>
	 * <key>ow.format.string.wordWrap(aString, maxWidth, newLineSeparator, tabDefault) : String</key>
	 * Given aString word wraps the text on it given the maxWidth length per line. Optionally you can provide
	 * a newLineSeparator otherwise '\n' will be used. Optionally tabDefault determines how many spaces a tab represents (default 4)
	 * (available after ow.loadFormat())
	 * </odoc>
	 */
	wordWrap: function(str, maxWidth, newLine, tabDefault) {
		str = _$(String(str), "str").isString().default("")
		tabDefault = _$(tabDefault, "tabDefault").isNumber().default(4)
		_$(maxWidth, "maxWidth").isNumber().$_()

		if (ansiLength(str) <= maxWidth) return str

		str = str.replace(/\t/g, " ".repeat(tabDefault))

		var newLineStr = (isUnDef(newLine)) ? "\n" : newLine
		var done = false

		while (!done) {
			var lines = str.split(newLineStr)
			var found = false
			var lid = 0

			while (lid < lines.length && !found) {
				var _ansiLen = ansiLength(lines[lid])

				if (_ansiLen > maxWidth) {
					var extra = (__conAnsi) ? lines[lid].length - _ansiLen : 0
					var i = (maxWidth + extra) - 1

					while (i >= 0 && !found) {
						if (lines[lid].charAt(i) == " ") {
							var slicedLine = lines[lid].slice(i+1)
							lines[lid] = lines[lid].slice(0, i) + newLineStr + slicedLine.trim()
							found = true
						}
						i--
					}

					if (!found) {
						var slicedLine = lines[lid].slice(maxWidth)
						lines[lid] = lines[lid].slice(0, maxWidth) + newLineStr + slicedLine.trim()
						found = true
					}
				}

				lid++
			}

			str = lines.join(newLineStr)
			done = !found
		}

		return str
	},

	/**
	 * <odoc>
	 * <key>ow.format.string.closest(aString, anArrayOfStrings, aThreshold) : aString</key>
	 * Given anArrayOfStrings will try to find the closest string on that array for the provided aString.
	 * If aThreshold is not provided a default value of 3 will be used.
	 * See ow.format.string.bestPrefix if you want to be based on the prefix.\
	 * Example:\
	 * var anArrayOfStrings = [ "/user", "/use", "/username", "/u" ];\
	 * ow.format.string.closest("/user/1", anArrayOfStrings); // Returns /user\
	 * ow.format.string.closest("/u1", anArrayOfStrings); // Returns /u\
	 * ow.format.string.closest("/userna", anArrayOfStrings); // Returns /user\
	 * ow.format.string.closest("/usernam", anArrayOfStrings); // Returns /username
	 * </odoc>
	 *
	 * from https://github.com/ianstormtaylor/closest-match
	 */
	closest: function(aString, aList, aThreshold) {
		var threshold = _$(aThreshold, "aThreshold").isNumber().default(3)
		
		if (!isString(aString) || !isArray(aList)) return false;
	
		var distance, match;
		for (var i = 0, candidate; candidate = aList[i]; i++) {
			if (aString === candidate) return aString;
			var measurement = ow.format.string.distance(aString, candidate);
			if (!distance || measurement < distance) {
				distance = measurement;
				match = candidate;
			}
		}
	
		if (distance > threshold) return false;
		return match;
	},

	/**
	 * <odoc>
	 * <key>ow.format.string.distance(aStringA, aStringB, maxOffset) : Number</key>
	 * Calculates the distance between aStringA and aStringB into the number of inserts, deletions and
	 * updates needed. If the maxOffset is not provided a value of 5 maximum characters difference will be 
	 * used. (Currently based on Sift4)
	 * </odoc>
	 * from https://github.com/timoxley/sift/
	 */
	distance: function(aStringA, aStringB, maxOffset) {
		if (isUndefined(maxOffset)) maxOffset = 5;
		// sift4: http://siderite.blogspot.com/2014/11/super-fast-and-accurate-string-distance.html
		if (!aStringA||!aStringA.length) {
			if (!aStringB) {
				return 0;
			}
			return aStringB.length;
		}

		if (!aStringB||!aStringB.length) {
			return aStringA.length;
		}

		var l1=aStringA.length;
		var l2=aStringB.length;

		var c1 = 0;  //cursor for string 1
		var c2 = 0;  //cursor for string 2
		var lcss = 0;  //largest common subsequence
		var local_cs = 0; //local common substring

		while ((c1 < l1) && (c2 < l2)) {
			if (aStringA.charAt(c1) == aStringB.charAt(c2)) {
				local_cs++;
			} else {
				lcss+=local_cs;
				local_cs=0;
				if (c1!=c2) {
					c1=c2=Math.max(c1,c2); //using max to bypass the need for computer transpositions ('ab' vs 'ba')
				}
				for (var i = 0; i < maxOffset && (c1+i<l1 || c2+i<l2); i++) {
					if ((c1 + i < l1) && (aStringA.charAt(c1 + i) == aStringB.charAt(c2))) {
						c1+= i;
						local_cs++;
						break;
					}
					if ((c2 + i < l2) && (aStringA.charAt(c1) == aStringB.charAt(c2 + i))) {
						c2+= i;
						local_cs++;
						break;
					}
				}
			}
			c1++;
			c2++;
		}
		lcss+=local_cs;
		return Math.round(Math.max(l1,l2)- lcss);
	},
	
	/**
	 * <odoc>
	 * <key>ow.format.string.bestPrefix(aString, anArrayOfStrings) : aString</key>
	 * Given anArrayOfStrings will try to find the best prefix string on that array for the provided aString.
	 * See ow.format.string.closest if you don't want to be based on the prefix.\
	 * Example:\
	 * var anArrayOfStrings = [ "/user", "/use", "/username", "/u" ];\
	 * ow.format.string.bestPrefix("/user/1", anArrayOfStrings); // Returns /user\
	 * ow.format.string.bestPrefix("/u1", anArrayOfStrings); // Returns /u\
	 * ow.format.string.bestPrefix("/userna", anArrayOfStrings); // Returns /user\
	 * \
	 * </odoc>
	 */
	bestPrefix: function(aString, aList) {
		var maxLen = 0;
		var maxPos = -1;

		for(var i in aList) {
			if (aString.lastIndexOf(aList[i]) > -1 &&
				aList[i].length > maxLen) {
				maxLen = aList[i].length;
				maxPos = i;
			}
		}

		return aList[maxPos];
	},
	
	/**
	 * <odoc>
	 * <key>ow.format.string.separatorsToUnix(aFilenamePath) : String</key>
	 * Tries to convert the provided aFilenamePath into a path with unix folder separators.
	 * </odoc>
	 */
	separatorsToUnix: function(aString) {
		return String(Packages.org.apache.commons.io.FilenameUtils.separatorsToUnix(aString));
	},
	
	/**
	 * <odoc>
	 * <key>ow.format.string.separatorsToWindows(aFilenamePath) : String</key>
	 * Tries to convert the provided aFilenamePath into a path with windows folder separators.
	 * </odoc>
	 */
	separatorsToWindows: function(aString) {
		return String(Packages.org.apache.commons.io.FilenameUtils.separatorsToWindows(aString));
	},

	/**
	 * <odoc>
	 * <key>ow.format.string.leftPad(aString, length, padExpression) : String</key>
	 * Using a padExpression will left pad aString for the given length.
	 * </odoc>
	 */
	leftPad: function(aString, length, padExpression) {
		if (isUndefined(padExpression)) padExpression = "0";
		var pads = (length < aString.length) ? 0 : length - aString.length;
		return repeat(length - aString.length, padExpression) + aString
	},

	/**
	 * <odoc>
	 * <key>ow.format.string.rightPad(aString, length, padExpression) : String</key>
	 * Using a padExpression will right pad aString for the given length.
	 * </odoc>
	 */
	rightPad: function(aString, length, padExpression) {
		if (isUndefined(padExpression)) padExpression = "0";
		var pads = (length < aString.length) ? 0 : length - aString.length;
		return aString + repeat(length - aString.length, padExpression);
	},
	
	/**
	 * <odoc>
	 * <key>ow.format.string.lsHash(aStringA, aStringB, dontCareDiffSize) : String</key>
	 * Generates a locality sensitive hash for aStringA. If aStringB is provided it will compute the 
	 * hash difference between aStringA and aStringB returning a number (if 0 means the strings are almost
	 * identical; if 200 or higher means the strings are very different). Optionally you can indicate that the
	 * difference should care about differences in size dontCareDiffSize = true. This is based on https://github.com/trendmicro/tlsh/blob/master/js_ext.\
	 * \
	 * Note: A aStringA and aStringB should be, at least, 512 characters long and have enough randomness to 
	 * generate a proper hash.
	 * </odoc>
	 */
	lsHash: function(aStringA, aStringB, dontCareDiffSize) {
		//loadLib(getOpenAFJar() + "::js/tlsh.js");
		loadCompiledLib("tlsh_js");
		if (isUnDef(aStringB)) {
			var t = new Tlsh();
			t.update(aStringA);
			t.finale();
			return t.hash();
		} else {
			//return Tlsh(aStringA).calculateDifference(Tlsh(aStringB), !dontCareDiffSize);
			var ta = new Tlsh(); ta.update(aStringA); ta.finale();
			var tb = new Tlsh(); tb.update(aStringB); tb.finale();
			return ta.totalDiff(tb, !dontCareDiffSize);
		}
	},

	/**
	 * <odoc>
	 * <key>ow.format.string.lsHashDiff(aHashA, aHashB, dontCareDiffSize) : String</key>
	 * From a previously created, with ow.format.string.lsHash, aHashA and aHashB will calculate 
	 * the difference between them returning a number (if 0 means the strings are almost
	 * identical; if 200 or higher means the strings are very different). Optionally you can indicate that the
	 * difference should care about differences in size dontCareDiffSize = true. This is based on https://github.com/trendmicro/tlsh/blob/master/js_ext.
	 * </odoc>
	 */
	lsHashDiff: function(aHashA, aHashB, dontCareDiffSize) {
		//loadLib(getOpenAFJar() + "::js/tlsh.js");
		loadCompiledLib("tlsh_js");
		var tA = new Tlsh();
		tA.fromTlshStr(aHashA);
		var tB = new Tlsh();
		tB.fromTlshStr(aHashB);
		return tA.totalDiff(tB, !dontCareDiffSize);
	},

	/**
	 * <odoc>
	 * <key>ow.format.string.lineChart(aSeries, aOptions) : String</key>
	 * Given an array of values (1 series) or an array of arrays of values (multiple series) will plot a line chart in 
	 * ascii, with the provided aOptions, a return the corresponding string. Available options:\
	 * \
	 *   min     (number)   The minimum value to use in the chart\
	 *   max     (number)   The maximum value to use in the chart\
	 *   height  (number)   The line chart lines height to use\
	 *   width   (number)   The maxium width of the line chart\
	 *   colors  (array)    Array of color names to use for each series\
	 *   label   (boolean)  Boolean value to indicate if y labels should be included (default true)\
	 *   format  (function) Custom functions that receives a value and returns a formatted string for labels\
	 *   dColor  (string)   The default color to use\
	 *   offset  (number)   The offset to assume (default 2)\
	 *   padding (string)   The chart padding string (default "")\
	 *   fixed   (number)   If no custom format function is provided will be the fixed decimals to use (default 2)\
	 *   symbols (array)    An array of 10 characters to replace the default symbols\
	 * </odoc>
	 */
    lineChart: (aSeries, aCfg) => {
		// Based on https://github.com/kroitor/asciichart
	
		// control sequences for coloring
		var linechart = {}
		linechart.defaultSymbols = [ '┼', '┤', '╶', '╴', '─', '╰', '╭', '╮', '╯', '│' ]
	
	    var colored = (aS, color, dc) => {
			if (isUnDef(aS)) return ""
			if (isUnDef(color) || color == dc) {
				if (isDef(dc)) {
					if (isUnDef(__ansiColorCache[dc])) __ansiColorCache[dc] = __ansiColorPrep(dc)
					return __ansiColorCache[dc] + aS + ""
				} else {
					return aS
				}
			} 
			if (isUnDef(__ansiColorCache[color])) __ansiColorCache[color] = __ansiColorPrep(color)
			return __ansiColorCache[color] + aS + (isDef(dc) ? __ansiColorCache[dc] : __ansiColorCache["RESET"])
		}
	
		linechart.colored = colored
		linechart.plot = function(series, cfg) {
			if (isNumber(series[0])) series = [series]
			cfg = _$(cfg, "options").isMap().default({})
	
			let min = isNumber(cfg.min) ? cfg.min : series[0][0]
			let max = isNumber(cfg.max) ? cfg.max : series[0][0]
	
			for (let j = 0; j < series.length; j++) {
				for (let i = 0; i < series[j].length; i++) {
					min = Math.min(min, series[j][i])
					max = Math.max(max, series[j][i])
				}
			}
	
			let range   = Math.abs(max - min)
			let fixed   = _$(cfg.fixed, "fixed").isNumber().default(2)
			if (fixed < 0) fixed = 0
			let offset  = _$(cfg.offset, "offset").isNumber().default(2)
			if (offset < 0) offset = 0
			let padding = _$(cfg.padding, "padding").isString().default('')
			let height  = _$(cfg.height, "height").isNumber().default(__)
			height = isDef(cfg.height) ? cfg.height - 1 : range
			let colors  = _$(cfg.colors, "colors").isArray().default([])
			let slabel  = _$(cfg.label, "label").isBoolean().default(true)
			let ratio   = range !== 0 ? height / range : 1;
			let min2    = Math.round(min * ratio)
			let max2    = Math.round(max * ratio)
			let rows    = Math.abs(max2 - min2)
			let dcolor  = _$(cfg.dColor, "dColor").isString().default(__)
			let width = 0

			let maxwidth = _$(cfg.width, "width").isNumber().default(__)
			for (let i = 0; i < series.length; i++) {
				width = Math.max(width, series[i].length)
			}
			width = width + offset

			let symbols = _$(cfg.symbols, "symbols").isArray().default(linechart.defaultSymbols)
			let format  = _$(cfg.format, "format").isFunction().default(x => x.toFixed(fixed))
	
			// Preparing empty space
			let result = new Array(rows + 1) // empty space
			let _mw = isDef(maxwidth) ? Math.min(maxwidth, width) : width
			for (let i = 0; i <= rows; i++) {
				result[i] = new Array(_mw)
				for (let j = 0; j < _mw; j++) {
					result[i][j] = ' '
				}
			}
		
			// axis + labels
			var maxLabelSize = 0
			for (let y = min2; y <= max2; ++y) { // axis + labels
				if (slabel) {
					if (offset < 2) offset = 2
					let label = String(format(rows > 0 ? max - (y - min2) * range / rows : y, y - min2))
					if (!isString(label)) label = ""
					if (label.length < 2) label = repeat(2 - label.length, " ")
					result[y - min2][Math.max(offset - label.length, 0)] = isDef(dcolor) ? colored(label, dcolor, dcolor) : label
					if (label.length > maxLabelSize) maxLabelSize = label.length
				}
				result[y - min2][offset - 1] = (y == 0) ? symbols[0] : symbols[1]
			}
	
			// plotting
			for (let j = 0; j < series.length; j++) {
				let _x, xoffset = 0
				if (isDef(maxwidth) ) {
					_x = maxwidth - maxLabelSize
					xoffset = (series[j].length > _x) ? series[j].length - _x : 0
					//print("_x = " + _x + " | xoffset = " + xoffset + " | len = " + series[j].length)
				}

				let currentColor = colors[j % colors.length]
				let y0 = Math.round(series[j][xoffset + 0] * ratio) - min2
				result[rows - y0][offset - 1] = colored(symbols[0], currentColor, dcolor) // first value
				if (slabel && offset >= 2) result[rows - y0][offset - 2] = colored(result[rows - y0][offset - 2], currentColor, dcolor) // label value
	
				for (let x = xoffset; x < series[j].length - 1; x++) { // plot the line
					let y0 = Math.round(series[j][x + 0] * ratio) - min2
					let y1 = Math.round(series[j][x + 1] * ratio) - min2
					if (y0 == y1) {
						result[rows - y0][(x - xoffset) + offset] = colored(symbols[4], currentColor, dcolor)
					} else {
						result[rows - y1][(x - xoffset) + offset] = colored((y0 > y1) ? symbols[5] : symbols[6], currentColor, dcolor)
						result[rows - y0][(x - xoffset) + offset] = colored((y0 > y1) ? symbols[7] : symbols[8], currentColor, dcolor)
						let from = Math.min(y0, y1)
						let to = Math.max(y0, y1)
						for (let y = from + 1; y < to; y++) {
							result[rows - y][(x - xoffset) + offset] = colored(symbols[9], currentColor, dcolor)
						}
					}
				}
			}
	
			var _r = result.map(x => { 
				var _e = ansiLength(x[0])
				if (maxLabelSize > 0) {
					x.unshift(padding + repeat(maxLabelSize - _e, " "))
					_e += ansiLength(x[0])
				}
				var __r = (isDef(maxwidth) ? x.slice(0, maxwidth - _e + 2) : x)
				var __o = colored(__r.join(''), dcolor, dcolor) 
				var __ol = __o.length - ansiLength(__o)
				return ansiLength(__o) > maxwidth ? __o.substring(0, maxwidth + __ol) : __o + repeat(maxwidth - ansiLength(__o), " ")
			}).join(ansiColor("RESET", "") + "\n") + ansiColor("RESET", "")
			return _r
		}
	
		return linechart.plot(aSeries, aCfg)
	},

	/**
	 * <odoc>
	 * <key>ow.format.string.lineChartLegend(titles, options) : Array</key>
	 * Given an array of titles and the options provided to ow.format.string.lineChart will return an array
	 * with each "symbol" and color used for each series and the corresponding "title".
	 * </odoc>
	 */
	lineChartLegend: (titles, options) => {
		_$(titles, "titles").isArray().$_()
		options = _$(options, "options").isMap().default({})
	
		function colored(aS, color, dc) {
			// do not color it if color is not specified
			//return isUnDef(color) ? char : (linechart[color.toLowerCase()] + char + linechart.reset)
			if (isUnDef(aS)) return ""
			if (isUnDef(color)) {
				return isDef(dc) ? aS + __ansiColorCache[dc] : aS
			} 
			if (isUnDef(__ansiColorCache[color])) __ansiColorCache[color] = __ansiColorPrep(color)
			return __ansiColorCache[color] +  aS + (isDef(dc) ? __ansiColorCache[dc] : __ansiColorCache["RESET"])
		}
	
		let _sym = _$(options.symbols, "symbols").isArray().default([ '┼', '┤', '╶', '╴', '─', '╰', '╭', '╮', '╯', '│' ])
		let dcolor  = isDef(options.defaultColor) ? options.defaultColor : __
		var ar = titles.map((t, i) => {
			return {
				symbol: colored(_sym[4], options.colors[i], dcolor),
				title : colored(t, dcolor, dcolor)
			}
		})
	
		return ar
	},

	/**
	 * <odoc>
	 * <key>ow.format.string.dataClean(aName)</key>
	 * Given aName for data points entered using ow.format.string.chart and ow.format.string.dataLineChart will effectively delete all cached data.
	 * If aName is not provided it will eliminate of cached data.
	 * </odoc>
	 */
	dataClean: (aName) => {
		aName = _$(aName, "aName").isString().default(__)
		if ($ch().list().indexOf("__oaf::chart") < 0) return
		if (isDef(aName)) {
			$ch("__oaf::chart").unset({ name: aName })
		} else {
			$ch("__oaf::chart").unsetAll(["name"], $ch("oaf::__chart").getKeys())
		}
	},

	/**
	 * <odoc>
	 * <key>ow.format.string.dataLineChart(aName, aDataPoint, aHSIze, aVSize, aOptions) : String</key>
	 * Given data aName will store, between calls, aDataPoint (number or array of numbers) provided to plot a line chart with a horizontal aHSize
	 * and a vertical aVSize. Optionally aOptions, equivalent to ow.format.string.lineChart options, can optionally also be provided.
	 * </odoc>
	 */
	dataLineChart: (aName, aDataPoint, aHSize, aVSize, aOptions) => {
		// Check
		_$(aName, "aName").isString().$_()
	
		aDataPoint = _$(aDataPoint, "aDataPoint").default(__)
		aHSize     = _$(aHSize).isNumber().default(45)
		aVSize     = _$(aVSize).isNumber().default(15)
		aOptions   = _$(aOptions).isMap().default({})
	
		if (!isNumber(aDataPoint) 
		  && !isArray(aDataPoint) 
		  && (isArray(aDataPoint) && aDataPoint.map(isNumber).reduce((aC,cV) => aC && cV, true)))
		   throw "data point should be a number or an array of numbers"

		// Get previous
		var cN = "__oaf::chart"
		$ch(cN).create()
		var data = $ch(cN).get({ name: aName })
		data = _$(data, "data").isMap().default({ name: aName, data: [] })
	
		// Store data
		if (isDef(aDataPoint)) {
			data.data.push(aDataPoint)	
			while (data.data.length > aHSize ) data.data.shift()
			$ch(cN).set({ name: aName }, data)
		}
	
		var cc = true
		if (!ow.format.isWindows()) {
			cc = (__conAnsi ? true : false);
		} else {
			if (__initializeCon()) {
				if (!ansiWinTermCap()) ansiStart();
				if (isDef(__con.getTerminal().getOutputEncoding())) cc = (__conAnsi ? true : false);
			}
		}

		var ar
		if (isNumber(aDataPoint)) {
			ar = data.data
		} else {
			if (data.data.length > 0) {
				ar = []
				for(var i = 0; i < data.data[0].length; i++) {
					ar[i] = data.data.map(r => r[i])
				}
			}
		}
		return ow.format.string.lineChart(ar, merge({ width: aHSize, height: aVSize }, aOptions))
	},

	/**
	 * <odoc>
	 * <key>ow.format.string.chart(aName, aDataPoint, aHSIze, aVSize, aMin, aMax, aTheme) : String</key>
	 * Given data aName will store, between calls, aDataPoint provided to plot a chart with a horizontal aHSize
	 * and a vertical aVSize. Optionally aMin value and aMax value can be provided. aTheme can optionally also be provided
	 * containing the map entries space (char), bar (char), point (char), vertical (boolean) and axis (boolean)
	 * </odoc>
	 */
	chart: (aName, aDataPoint, aHSize, aVSize, aMin, aMax, aTheme) => {
		// Check
		_$(aName, "aName").isString().$_()
	
		aDataPoint = _$(aDataPoint, "aDataPoint").isNumber().default(__)
		aHSize     = _$(aHSize).isNumber().default(45)
		aVSize     = _$(aVSize).isNumber().default(15)
		aMax       = _$(aMax).isNumber().default(__)
		aMin       = _$(aMin).isNumber().default(__)
		aTheme     = _$(aTheme).isMap().default({})
	
		aTheme = merge( { vertical: false, axis: true }, aTheme)
	
		// Get previous
		var cN = "__oaf::chart"
		$ch(cN).create()
		var data = $ch(cN).get({ name: aName })
		data = _$(data, "data").isMap().default({ name: aName, data: [] })
	
		// Store data
		if (isDef(aDataPoint)) {
			data.data.push(aDataPoint)
			while (data.data.length > (aTheme.vertical ? aVSize : aHSize )) data.data.shift()
			$ch(cN).set({ name: aName }, data)
		}
	
		var cc = true
		if (!ow.format.isWindows()) {
			cc = (__conAnsi ? true : false);
		} else {
			if (__initializeCon()) {
				if (!ansiWinTermCap()) ansiStart();
				if (isDef(__con.getTerminal().getOutputEncoding())) cc = (__conAnsi ? true : false);
			}
		}

		aTheme = merge({ space: (cc ? "░" : " "), bar: (cc ? "▓" : "*") }, aTheme) 

		// Render data
		if (isUnDef(aMax)) aMax = $from(data.data).max()
		if (isUnDef(aMin)) aMin = $from(data.data).min()
		var ar = data.data.map(dp => ow.format.string.progress(dp, aMax, aMin, (aTheme.vertical ? aHSize : aVSize ), aTheme.bar, aTheme.space, aTheme.point)) 

		var haxis = (aTheme.axis ? "\n" + (cc ? ow.format.syms().curveTRight : "+") + repeat(aHSize, (cc ? ow.format.syms().lineH : "-")) : "")
		var vaxis = (aTheme.axis ? (cc ? ow.format.syms().lineV : "|") : "")
		return (aTheme.vertical ? ar.map(r=>vaxis+r).join("\n") + haxis : ow.format.transposeArrayLines(ar).map(r=>vaxis+r).join("\n") + haxis )
	},

	/**
	 * <odoc>
	 * <key>ow.format.string.updateLine(aPrintNLFn) : Function</key>
	 * Facilitates updating a message in the same line without entering new-lines. It will use the aPrintNLFn (if not defined uses printnl).
	 * Returns an object with two functions: line(aMessage) and end(). The function line() should be called to change the current line message. On the 
	 * end calling the function end() will clean-up a return the cursor to the beginning of the line.
	 * </odoc>
	 */
	updateLine: function(aPrintNLFn) {
		aPrintNLFn = _$(aPrintNLFn, "aPrintNLFn").isFunction().default(printnl)
		var _r = {
			lsize: $atomic(0),
			line : l => {
				sync(() => (_r.lsize.get() < l.length) ? _r.lsize.set(l.length) : l.length, _r.lsize)
				var s = _r.lsize.get() - l.length
				aPrintNLFn(l + (s > 0 ? repeat(s, " ") : "") + "\r")
			},
			end  : () => {
				aPrintNLFn(repeat(_r.lsize.get(), " ") + "\r")
			}
		} 
		return _r
	},

    /**
	 * <odoc>
	 * <key>ow.format.string.ansiMoveUp(nLines)</key>
	 * Moves the cursor nLines up.
	 * </odoc>
	 */
	ansiMoveUp: nLines => {
		nLines = _$(nLines, "nLines").isNumber().default(1)
		printnl("\x1B[" + nLines + "A")
	},

	/**
	 * <odoc>
	 * <key>ow.format.string.ansiMoveDown(nLines)</key>
	 * Moves the cursor nLines down.
	 * </odoc>
	 */
	ansiMoveDown: nLines => {
		nLines = _$(nLines, "nLines").isNumber().default(1)
		printnl("\x1B[" + nLines + "B")
	},

	/**
	 * <odoc>
	 * <key>ow.format.string.ansiMoveRight(nChars)</key>
	 * Moves the cursor right chars.
	 * </odoc>
	 */
	ansiMoveRight: nChars => {
		nChars = _$(nChars, "nChars").isNumber().default(1)
		printnl("\x1B[" + nChars + "C")
	},

	/**
	 * <odoc>
	 * <key>ow.format.string.ansiMoveLeft(nChars)</key>
	 * Moves the cursor left chars.
	 * </odoc>
	 */
	ansiMoveLeft: nChars => {
		nChars = _$(nChars, "nChars").isNumber().default(1)
		printnl("\x1B[" + nChars + "D")
	},

	/**
	 * <odoc>
	 * <key>ow.format.string.ansiScrollUp(nLines)</key>
	 * Scrolls the screen up by nLines.
	 * </odoc>
	 */
    ansiScrollUp: nLines => {
		nLines = _$(nLines, "nLines").isNumber().default(1)
		printnl("\x1B[" + nLines + "S")
	},

	/**
	 * <odoc>
	 * <key>ow.format.string.ansiScrollDown(nLines)</key>
	 * Scrolls the screen down by nLines.
	 * </odoc>
	 */
	ansiScrollDown: nLines => {
		nLines = _$(nLines, "nLines").isNumber().default(1)
		printnl("\x1B[" + nLines + "T")
	},

	/** 
	 * <odoc>
	 * <key>ow.format.string.bool(aBoolValue, isLight, anExtra) : String</key>
	 * Given aBoolValue will return a green checkmark or a red cross character. If necessary anExtra ansiColor attributes can be added.
	 * </odoc>
	 */
	bool: (aValue, isLight, anExtra) => isLight ? (aValue ? ansiColor((anExtra ? anExtra+",":"") + "GREEN", "\u2713") : ansiColor((anExtra ? anExtra+",":"") + "RED", "\u2715")) : (aValue ? ansiColor((anExtra ? anExtra+",":"") + "GREEN", "\u2714") : ansiColor((anExtra ? anExtra+",":"") + "RED", "\u2716")),

	/**
	 * <odoc>
	 * <key>ow.format.string.tabExpand(aStr, aTabSize) : String</key>
	 * Given an input aStr and, optionally, aTabSize will expand the tabs in the string to the provided aTabSize (
	 * similar to the unix expand command). 
	 * If aTabSize is not provided it will default to 8.
	 * </odoc>
	 */
	tabExpand: (aStr, aTabSize) => {
		_$(aStr, "aStr").isString().$_()
		aTabSize = _$(aTabSize, "aTabSize").isNumber().default(8)

		return aStr.split('\n').map(line => {
			let endL = ''
			let c = 0
			for (let i = 0; i < line.length; i++) {
				if (line[i] === '\t') {
					let add = aTabSize - (c % aTabSize)
					endL += ' '.repeat(add)
					c += add
				} else {
					endL += line[i]
					c++
				}
			}
			return endL
		}).join('\n')
	},

	/**
	 * <odoc>
	 * <key>ow.format.string.progress(aNumericValue, aMax, aMin, aSize, aIndicator, aSpace) : String</key>
	 * Outputs an in-line progress bar given aNumericValue, aMax value, aMin value, the aSize of the bar and the aIndicator
	 * to use. If not provided, aMax defaults to aValue, aMin defaults to 0, aSize defaults to the current screen width (or 5 if 
	 * if can be determined), aIndicator defaults to "#" 
	 * and aSpace defaults to " ". If aSize is a negative value and it's possible to determine the current screen width it will
	 * subtract to the screen width. Example:\
	 * \
	 * loadLodash(); ow.loadFormat();\
	 * var arr = [-30, -25, -10, 0, 3, 5], max = _.max(arr), min = _.min(arr);\
	 * for(let i in arr) {\
	 *    print(ow.format.string.progress(arr[i], max, min, 5, '-'));\
	 * }\
	 * \
	 * </odoc>
	 */
	progress: function(aOrigPos, aMax, aMin, aSize, aIndicator, aSpace, aHead) {
		if (isUnDef(aIndicator)) aIndicator = ansiColor("BOLD", '━')
		if (isUnDef(aSpace))     aSpace = ansiColor("FAINT", '─')
		if (isUnDef(aSize))      aSize = (__conStatus ? __con.getTerminal().getWidth() : 5); else aSize = (aSize < 0 && __conStatus ? __con.getTerminal().getWidth() + aSize : aSize )
		if (isUnDef(aMax))       aMax = aOrigPos
		if (isUnDef(aMin))       aMin = 0
	
		var aScale = Math.abs(aMin) + Math.abs(aMax)
		var aPos = (aOrigPos > aMax) ? aMax : aOrigPos
		aPos = (aOrigPos < aMin) ? aMin : aPos

		var res, rpos = Math.round(aPos * aSize / aScale)
		if (isDef(aHead) && isString(aHead)) {
		  res = 
				( (aMin < 0) ?
					repeat(aSize + (rpos < 0 ? rpos : 0), aSpace) + 
					repeat(-(rpos - aHead.length) < 0 ? (rpos - aHead.length) : 0, aIndicator) + 
					(-(rpos - aHead.length) < 0 ? aHead : "") 
				: "" ) +  
				( (aMax > 0) ?
				repeat((rpos - aHead.length) > 0 ? (rpos - aHead.length) : 0, aIndicator) + 
				((rpos - aHead.length) > 0 ? aHead : "") +
				repeat(aSize - (rpos > 0 ? rpos : 0), aSpace) 
				: "")
		} else {
		  res = 
				( (aMin < 0) ?
					repeat(aSize + ((Math.round(aPos * aSize / aScale)) < 0 ? (Math.round(aPos * aSize / aScale)) : 0), aSpace) + 
					repeat(-((Math.round(aPos * aSize / aScale)) < 0 ? (Math.round(aPos * aSize / aScale)) : 0), aIndicator) 
				: "" ) +  
				( (aMax > 0) ?
				repeat(((Math.round(aPos * aSize / aScale)) > 0 ? (Math.round(aPos * aSize / aScale)) : 0), aIndicator) + 
				repeat(aSize - ((Math.round(aPos * aSize / aScale)) > 0 ? (Math.round(aPos * aSize / aScale)) : 0), aSpace)
				: ""
				)
		}
	
		return res
	},
	/**
	 * <odoc>
	 * <key>ow.format.string.printable(aByteArray, aDefaultChar) : String</key>
	 * Tries to convert aByteArray into a printable string. If aDefaultChar to replace the non-printable characters
	 * is not provided it will default to ".".
	 * </odoc>
	 */
	printable: function(aByteArray, aDefaultChar) {
		aDefaultChar = _$(aDefaultChar).isString().default(".");

		var res = "";
		for(var ii = 0; ii < aByteArray.length; ii++) {
			res += (aByteArray[ii] & 255) >= 32 ? String.fromCharCode(aByteArray[ii] & 255) : aDefaultChar;
		}

		return res;
	},
	/**
	 * <odoc>
	 * <key>ow.format.string.toHex(aByteArray, aSeparator) : String</key>
	 * Tries to convert aByteArray into a string of hex values separated by aSeparator (defaults to " ").
	 * </odoc>
	 */
	toHex: function(aByteArray, aSeparator) {
		aSeparator = _$(aSeparator).isString().default(" ");

		var res =  "", hex = String(javax.xml.bind.DatatypeConverter.printHexBinary(aByteArray));
		for(var ii = 0; ii < hex.length; ii = ii + 2) {
			//res += ow.format.string.leftPad(ow.format.toHex(Number(aByteArray[ii] & 255)).toUpperCase(), 2, "0");
			res += hex[ii] + hex[ii+1] + ((ii + 2) >= hex.length ? "" : aSeparator);
		}
		return res;
	},
	/**
	 * <odoc>
	 * <key>ow.format.string.toHexArray(aByteArray, perLine) : String</key>
	 * Returns an array with the ow.format.string.toHex of aByteArray and ow.format.string.printable with a maximum 
	 * of perLine (defaults to 30) characters per array element.
	 * </odoc>
	 */
	toHexArray: function(aByteArray, perLine) {
		perLine = _$(perLine).isNumber().default(30);

		var res = [], ii = 0;
		do {
			var e = [];
			for(var jj = 0; jj < perLine && ii < aByteArray.length; jj++) {
				e.push(aByteArray[ii]);
				ii++;
			}
			var ba = af.fromArray2Bytes(e);
			res.push({
				pos: ii - perLine,
				hex: this.toHex(ba),
				characters: this.printable(ba)
			});
		} while(ii < aByteArray.length);

		return res;
	},

	/**
	 * <odoc>
	 * <key>ow.format.string.nLinesTemplate(aSourceTemplate, initMap, alternativeTemplate, alternativePrintFunction) : Function</key>
	 * Returns a function to print multiple lines at the same time (using ansi cursor up). The function accepts a map parameter since
	 * it's based on the aSourceTemplate (handlebars). The initial render is performed using initMap. If ansi support is not 
	 * available and if alternativeTemplate is defined (and different of "" otherwise it defaults to aSourceTemplate) it will use
	 * it as alternative. Optionally it's also possible to define a different print function (alternativePrintFunction) to print (like log, for example).
	 * </odoc>
	 */
	nLinesTemplate: function(src, initMap, alternativeTemplate, alternativePrint) {
		alternativeTemplate = _$(alternativeTemplate).isString().default(src);
		src                 = _$(src).isString().$_("Please provide a template.");
		initMap             = _$(initMap).isMap().default({});
		alternativePrint    = _$(alternativePrint).isFunction().default(print);

		ow.loadTemplate(); ow.template.addFormatHelpers();
		var isAnsi = __initializeCon();

		if (isAnsi) {
			var jansi = JavaImporter(Packages.org.fusesource.jansi);
		
			var tmpl = ow.template.execCompiled(ow.template.compile(src, initMap));
			alternativePrint(tmpl(initMap));
		
			return function(aMap) {
				ansiStart();
				var out = tmpl(aMap);
				alternativePrint(jansi.Ansi.ansi().cursorUp(out.split(/\n/).length).a(out).a(jansi.Ansi.Attribute.RESET));
				ansiStop();
			};
		} else {
			if (alternativeTemplate != "") {
				var tmpl = ow.template.execCompiled(ow.template.compile(alternativeTemplate, initMap));
				alternativePrint(tmpl(initMap));
	
				return function(aMap) {
					alternativePrint(tmpl(aMap));
				};
			}
		}
	},
        /**
         * <odoc>
         * <key>ow.format.string.renderLines(aMatrix, numberOfLines, aWidth, aBgPattern, shouldReturn) : String</key>
         * Tries to render a string grid (if shouldReturn = true won't print it but jsut return it) for a specific aWidth for a numberOfLines
         * with aBgPattern background pattern (defaults to " ") with aMatrix contents (divided by "\n"). 
         * </odoc>
         */
	renderLines: function(anArrayElements, numberOfLines, currentWidth, aPattern, shouldReturn) {
		var jansi = JavaImporter(Packages.org.fusesource.jansi);
		aPattern = _$(aPattern, "pattern").isString().default(" ");
	
		var o = [], extra = []
		for(var ii = 0; ii < numberOfLines; ii++) { o[ii] = repeat(currentWidth, aPattern); extra[ii] = 0 }
		
		var fn = (orig, x, y, str) => { 
			var c = -1; 
			str.split(/\r?\n/).forEach(r => { 
				c++; 
				if ( (x + c) < numberOfLines) {
					//var rm = r.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
					var rml = ansiLength(r)
		
					orig[x + c] = orig[x + c].substring(0, y + extra[x + c]) + 
						          r + 
						          orig[x + c].substring(y + rml + extra[x + c])
			
					extra[x + c] = extra[x + c]+ (r.length - rml)
				}
			}); 
	
		};
		
		anArrayElements.forEach(elem => {
			fn(o, elem.x, elem.y, elem.t);
		});
		
		if (shouldReturn) {
			return o.join("");
		} else {
			cprint(o.join(""))
			printnl( jansi.Ansi.ansi().cursorUpLine(numberOfLines + 2) )
		}
	},
	/**
	 * <odoc>
	 * <key>ow.format.string.grid(aMatrix, aX, aY, aBgPattern, shouldReturn) : String</key>
	 * Will generate a aX per aY grid to be displayed with aBgPattern (defaults to " "). Each grid cell with use the contents on aMatrix
	 * array of an array. Each cell content can be a map with obj (a Map), a xspan/yspan for in cell spacing, a type (either map, table, chart, area, bar, func or string) 
	 * and a title. If shouldReturn = true it will just return the string content instead of trying to print it.\
	 * Extra options per type:\
	 * \
	 *  chart: the 'obj' check printChart format string\
	 *  bar  : the 'obj' check printBar format stirng; 'max'; 'min'; 'indicator'; 'space'\
	 * \
	 * </odoc>
	 */
	grid: function(aElems, aX, aY, aPattern, shouldReturn) {
		plugin("Console")
		var _con_ = new Console()
		_$(aElems, "aElems").isArray().$_()

		aY = Number(_$(aY, "width").isNumber().default(_con_.getConsoleReader().getTerminal().getWidth()))
		aX = Number(_$(aX, "height").isNumber().default(Math.round(_con_.getConsoleReader().getTerminal().getHeight() / aElems.length - 1)))
	
		var elems = [], l = 0, ignore = []
		aElems.forEach(line => {
			var c = 0, totalC = 0
			var eline = line.map(col => (isDef(col) && isDef(col.xspan)) ? col.xspan : 1).reduce((aC,cR) => aC+cR)

			line.forEach((col, icol) => {
				if (isDef(col) && ignore.indexOf("Y:" + c + "X:" + l) < 0) {
					if (isUnDef(col) || isNull(col)) col = ""
					if (!isMap(col)) col = { obj: col }
	
					if (isUnDef(col.type)) {
						if (isMap(col.obj) || isArray(col.obj)) 
							col.type = "tree"
						else
							col.type = "human"
					}

					var xspan = _$(col.xspan, "xspan").isNumber().default(1)
					var yspan = _$(col.yspan, "yspan").isNumber().default(1)
					if (xspan > 1) for(var ii = 0; ii < xspan; ii++) { ignore.push("Y:" + (c+ii+1) + "X:" + l) }
					if (yspan > 1) for(var ii = l + (aX + 1); ii < l + ((aX + 1) * yspan); ii += aX + 1) { ignore.push("Y:" + c + "X:" + ii) }
					//var p = "", cs = Math.round((aY / eline) * xspan)
					var p = "", cs0 = Math.round(aY / eline); cs = cs0 * xspan
					totalC += cs
					if (line.length -1 == icol) cs += (aY > (totalC-1) ? aY - (totalC-1) : 0)

					switch(col.type) {
					case "map"  : p = printMap(col.obj, cs-1, "utf", true); break
					case "tree" : p = printTreeOrS(col.obj, cs-1); break
					case "table": p = printTable(col.obj, cs-1, __, true, "utf"); break
					case "chart": p = printChart(col.obj, cs-1, (aX * yspan)-1); break
					case "area" : p = ow.format.string.chart(col.title, col.obj, cs-1, (aX * yspan)-1); break
					case "bar"  : p = printBars(col.obj, cs-1, col.max, col.min, col.indicator ? col.indicator : "━", col.space ? col.space : " "); break
					case "md"   : p = ow.format.string.wordWrap(ow.format.withMD(col.obj), cs-1,ansiColor("RESET","\n")); break
					case "text" : p = ow.format.string.wordWrap(String(col.obj), cs-1,ansiColor("RESET","\n")); break
					case "func" : p = String(newFn("mx", "my", col.obj)((aX * yspan)-1, cs-1)); break
					default: p = String(col.obj)
					}
	
					p = p.split(/\r?\n/).map(r => r.substring(0, cs-1 + (r.length - ansiLength(r)) ))

					if (isString(col.title)) {
						p.unshift( ansiColor("RESET,BOLD", "> " + col.title + " " + repeat(cs - 4 - ansiLength(col.title), "─")) )
					}
					
					var pp = p, po = []
					if (pp.length > (aX * yspan)) {
						for(var ii = 0; ii <= (aX * yspan); ii++) {
							po.push(pp[ii])
						}
						po = po.join("\n")
					} else {
						po = p.join("\n")
					}

					elems.push({ x: l, y: cs0 * c, t: po })
				}
				c++
			})

			l += aX
		})
	
		return ow.format.string.renderLines(elems, aX * aElems.length, aY, aPattern, shouldReturn)
	},
	/**
	 * <odoc>
	 * <key>ow.format.string.wildcardTest(aString, aPattern, caseSensitive) : Boolean</key>
	 * Given aString will try to apply aPattern using '*' wildcards (to match zero or more characters) or '?' question-mark to
	 * match a single character. Will return true if the aPattern can be applied to aString. Optionally if caseSensitive=true the pattern will be tested
	 * with case sensitive.
	 * </odoc>
	 */
	wildcardTest: (str, pattern, scase) => {
		_$(str, "str").isString().$_()
		_$(pattern, "pattern").isString().$_()
		scase = _$(scase, "scase").isBoolean().default(false)

		return (ow.format.string.wildcardRE(pattern, scase)).test(str)
	},
    /**
	 * <odoc>
	 * <key>ow.format.string.wildcardRE(aPattern, caseSensitive) : RegExp</key>
	 * Given aPattern using '*' wildcards (to match zero or more characters) or '?' question-mark to
	 * match a single character will return the corresponding RegExp. Optionally if caseSensitive=true the RegExp will include
	 * case sensitive option.
	 * </odoc>
	 */
	wildcardRE: (pattern, scase) => {
		_$(pattern, "pattern").isString().$_()
		scase = _$(scase, "scase").isBoolean().default(false)

		return new RegExp("^" + pattern.replace(/([.+^${}()|[\]\\])/g, '\\$1').replace(/\*/g, '.*').replace(/\?/g, '.') + "$", (scase ? __ : 'i'))
	},

	/**
	 * <odoc>
	 * <key>ow.format.string.pauseString(aString, aMsg)</key>
	 * Given aString starts an interactive paging of the contents of aString. 
	 * Optionally aMsg can be provided to be displayed with the paging percentage (use \{{percentage}} to be replaced by the percentage).
	 * </odoc>
	 */
	pauseString: (aString, aMsg) => {
		_$(aString, "aString").isString().$_()
		aMsg = _$(aMsg, "aMsg").isString().default("{{percentage}}% (Press any key to paginate or use arrow keys or 'q' to quit)")

		//__initializeCon()
		plugin("Console")
		_c = new Console()

		var __pauseArray = (aText, aStart) => {
			_$(aText, "aText").isArray().$_()
	
			var height = _c.getConsoleReader().getTerminal().getHeight() 
			var lines = aText.length
	
			if (lines <= (height - 1)) {
				print(aText.join("\n"))
				return -1
			}
	
			if (isUnDef(aStart) || aStart < 0) {
				aStart = 0
			} else {
				if (aStart > (lines - height + 1)) aStart = (lines - height + 1)
			}
	
			print(aText.slice(aStart, aStart + height - 1).join("\n"))
	
			if ((aStart + height -1) < lines) {
				tprintnl(aMsg, { percentage: Math.floor(( ((aStart + height -1)*100 / lines))) })
				var c
				c = String(_c.readChar(""))
				printnl("\r" + repeat(_c.getConsoleReader().getTerminal().getWidth(), ' ') + "\r")
				if (c.charCodeAt(0) != 113 && c.charCodeAt(0) != 81) {
					if (c.charCodeAt(0) == 27) {
						c = String(_c.readChar(""))
						if (c.charCodeAt(0) == 27) {
							// get out
						}
						if (c.charCodeAt(0) == 91) {
							c = String(_c.readChar(""))
							// home
							if (c.charCodeAt(0) == 49) {
								c = String(_c.readChar(""))
								if (c.charCodeAt(0) == 126) {
									return 0
								}
							}
							// end
							if (c.charCodeAt(0) == 52) {
								c = String(_c.readChar(""))
								if (c.charCodeAt(0) == 126) {
									return lines - height - 1
								}
							}
							// pgup
							if (c.charCodeAt(0) == 53) {
								c = String(_c.readChar(""))
								if (c.charCodeAt(0) == 126) {
									if (aStart - height -1 < 0)
										return 0
									else
										return aStart - height + 1
								}
							}
							// pgdw
							if (c.charCodeAt(0) == 54) {
								c = String(_c.readChar(""))
								if (c.charCodeAt(0) == 126) {
									return aStart + height - 1
								}
							}
							// up
							if (c.charCodeAt(0) == 65) {
								if (aStart - 1 < 0)
									return 0
								else
									return aStart - 1
							}
							// down
							if (c.charCodeAt(0) == 66) {
								return aStart + 1
							}
						}
					}
					return aStart + height - 1
				} else {
					return -1
				}
			}
		}
		
		var pres = 0
		var lines = aString.split("\n")
		while(pres >= 0) pres = __pauseArray(lines, pres)
	}
};

/**
 * <odoc>
 * <key>ow.format.semver(aVersion) : ow.format.semver</key>
 * Creates a new instance of ow.format.semver for the provided aVersion:\
 *   - nextMajor\
 *   - nextMinor\
 *   - nextPatch\
 *   - getMajor\
 *   - getMinor\
 *   - getPatch\
 *   - greater(aVersion)\
 *   - lower(aVersion)\
 *   - greaterEquals(aVersion)\
 *   - lowerEquals(aVersion)\
 *   - equals(aVersion)
 * </odoc>
 */
OpenWrap.format.prototype.semver = function(aVer) {
	return {
		nextMajor: () => String(new org.semver4j.Semver(aVer).nextMajor()),
		nextMinor: () => String(new org.semver4j.Semver(aVer).nextMinor()),
		nextPatch: () => String(new org.semver4j.Semver(aVer).nextPatch()),
		getMajor : () => String(new org.semver4j.Semver(aVer).getMajor()),
		getMinor : () => String(new org.semver4j.Semver(aVer).getMinor()),
		getPatch : () => String(new org.semver4j.Semver(aVer).getPatch()),
		greater  : aV => Boolean(new org.semver4j.Semver(aVer).isGreaterThan(aV)),
		lower    : aV => Boolean(new org.semver4j.Semver(aVer).isLowerThan(aV)),
		greaterEquals: aV => Boolean(new org.semver4j.Semver(aVer).isGreaterThanOrEqualTo(aV)),
		lowerEquals  : aV => Boolean(new org.semver4j.Semver(aVer).isLowerThanOrEqualTo(aV)),
		equals   : aV => Boolean(new org.semver4j.Semver(aVer).isEqualTo(aV))
	}
}

OpenWrap.format.prototype.syms = function() {
	return {
		check_mark      : "\u2714",
		light_check_mark: "\u2713",
		cross_mark      : "\u2716",
		light_cross_mark: "\u2715",
		pause           : "\u23F8",
		stop            : "\u23F9",
		play            : "\u25B7",	
		offonstandby    : "\u23FB",
		offon           : "\u23FC",
		form_checkmark  : "\u2611",
		form_crossmark  : "\u2612",
		arrowleft       : "←",
		arrowright      : "→",
		arrowup         : "↑",
		arrowdown       : "↓",
		asterism        : "⁂",
		fullrightfinger : "☛",
		rightfinger     : "☞",
		fullstar        : "★",
		star            : "☆",
		square          : "□",
		space           : "␣",
		cloud           : "☁",
		thumbsup        : "👍",
		thumbsdown      : "👎",
		cross        : '┼',
		crossHLeft   : '┤',
		crossHRight  : '├',
		crossVBottom : '┬',
		crossVTop    : '┴',
		lineHRight   : '╶',
		lineHLeft    : '╴',
		lineVTop     : '╵',
		lineVBottom  : '╷',
		lineH        : '─',
		lineTRight   : '└',
		lineBRight   : '┌',
		lineBLeft    : '┐',
		lineTLeft    : '┘',
		curveTRight  : '╰',
		curveBRight  : '╭',
		curveBLeft   : '╮',
		curveTLeft   : '╯',
		lineV        : '│',
		dlineV       : '║',
		dlineH       : '═',
		turnBRight   : '╔',
		turnTRight   : '╚',
		turnTLeft    : '╝',
		turnBLeft    : '╗',
		dcrossHRight : '╠',
		dcrossHLeft  : '╣',
		dcrossVBottom: '╦',
		dcrossVTop   : '╩',
		dcross       : '╬',
		lBToT        : '╱',
		lTToB        : '╲',
		lCross       : '╳',
		patternLight : '░',
		patternMedium: '▒',
		patternDark  : '▓',
		blockH       : '━'
	}
}

/** 
 * <odoc>
 * <key>ow.format.bool(aBoolValue, isLight, anExtra) : String</key>
 * Given aBoolValue will return a green checkmark or a red cross character. If necessary anExtra ansiColor attributes can be added.
 * </odoc>
 */
OpenWrap.format.prototype.bool = (aValue, isLight, anExtra) => ow.format.string.bool(aValue, isLight, anExtra)

/**
 * <odoc>
 * <key>ow.format.streamSHLog(aFunction) : Function</key>
 * To be used with sh, af.sh or ssh.exec as the callbackFunc. Returns a function that will call aFunction for each line
 * and used the returned string with log and logErr.
 * </odoc>
 */
OpenWrap.format.prototype.streamSHLog = function(aFunc) {
	if (isUnDef(aFunc)) aFunc = (f) => { return f; };
	return function(o, e) {
		$doWait(
			$doAll([
				$do(() => { ioStreamReadLines(o, (f) => { log(aFunc(String(f)), {async: true}) }, __, false); }), 
				$do(() => { ioStreamReadLines(e, (f) => { logErr(aFunc(String(f)), {async:true}) }, __, false); })
			])
		);
	};
};

/**
 * <odoc>
 * <key>ow.format.streamSH(aFunction, anEncoding) : Function</key>
 * To be used with sh, af.sh or ssh.exec as the callbackFunc. Returns a function that will call aFunction for each line
 * and used the returned string with print and printErr.
 * </odoc>
 */
OpenWrap.format.prototype.streamSH = function(aFunc, anEncoding) {
	if (isUnDef(aFunc)) aFunc = (f) => { return f; };
	if (isUnDef(anEncoding)) {
		return function(o, e) {
			$doWait(
				$doAll([
					$do(() => { ioStreamReadLines(o, (f) => { print(aFunc(String(f))) }, __, false); }), 
					$do(() => { ioStreamReadLines(e, (f) => { printErr(aFunc(String(f))) }, __, false); })
				])
			);
		};
	} else {
		return function(o, e) {
			$doWait(
				$doAll([
					$do(() => { ioStreamReadLines(o, (f) => { print(aFunc(af.toEncoding(String(f), anEncoding))) }, __, false); }), 
					$do(() => { ioStreamReadLines(e, (f) => { printErr(aFunc(af.toEncoding(String(f), anEncoding))) }, __, false); })
				])
			);
		};
	}
};

/**
 * <odoc>
 * <key>ow.format.streamSHPrefix(aPrefix, anEncoding, aSeparator, aTemplate, aFnHandler, infoFn, errorFn) : Function</key>
 * To be used with sh, af.sh or ssh.exec as the callbackFunc. Returns a function that will prefix each line with aPrefix
 * and used the returned string with print and printErr. Optionally you can provide aTemplate to add "prefix" (defaults to "[{{prefix}}]") and/or
 * provide aFnHandler to chain another streaming handling function (receives a stream and a boolean to indicate if its stdout or stderr).
 * It's also possible to provide a infoFn and errorFn to handle the output. If infoFn or errorFn are not provided they will default to print and printErr
 * or to log and logErr if __flags.SH.prefixLog is true.
 * </odoc>
 */
OpenWrap.format.prototype.streamSHPrefix = function(aPrefix, anEncoding, aSeparator, aTemplate, aFnHandler, infoFn, errorFn) {
	aPrefix   = _$(aPrefix, "aPrefix").isString().default("");
	aTemplate = _$(aTemplate, "aTemplate").isString().default("[{{prefix}}] ");
	infoFn    = _$(infoFn, "infoFn").isFunction().default(__flags.SH.prefixLog ? log : print)
	errorFn   = _$(errorFn, "errorFn").isFunction().default(__flags.SH.prefixLog ? logErr : printErr)

	var callFn = isFunction(aFnHandler)
	return function(o, e) {
		$doWait(
			$doAll([
				$do(() => { ioStreamReadLines(o, (f) => { 
					ansiStart()
					infoFn(ansiColor("BOLD,BLACK", templify(aTemplate, { prefix: aPrefix })) + af.toEncoding(String(f.replace(/[\n\r]+/g, "")), anEncoding))
					ansiStop()
					if (callFn) aFnHandler( af.toEncoding(String(f.replace(/[\n\r]+/g, "")), anEncoding), false )
				}, aSeparator, false, __); }), 
				$do(() => { ioStreamReadLines(e, (f) => { 
					ansiStart()
					errorFn(ansiColor("RED", templify(aTemplate, { prefix: aPrefix })) + af.toEncoding(String(f.replace(/[\n\r]+/g, "")), anEncoding))
					ansiStop()
					if (callFn) aFnHandler( af.toEncoding(String(f.replace(/[\n\r]+/g, "")), anEncoding), true )
				}, aSeparator, false, anEncoding); })
			])
		);
	};
};

/**
 * <odoc>
 * <key>ow.format.streamHandle(aHandle, inHandle, errHandle, outHandle, bufferSize) : Function</key>
 * Returns a function to help automated interaction with a running process. The function aHandle receives: aType (in/err); aTxt, 
 * inHandle (function), errHandle (function) and an outHandle (function). Optionally you can provide an alternative inHandle function to print
 * stdout text, an errHandle function to print stderr text, an outHandle function to send text to stdin and/or a non default bufferSize.\
 * \
 * Example:\
 * \
 * var res = $sh("myProcess.sh --something")\
 *           .cb(expect((aType, aTxt, inHandle, errHandle, outHandle) => {\
 *              if (aType == "in") {\
 *                 inHandle(aTxt)\
 *                 if (/ name\?/.test(aTxt))                return outHandle("Scott\n")\
 *	               if (aTxt.indexOf("Anything else?") >= 0) return outHandle("nope!\n")\
 *              }\
 *           }))\
 *           .get(0)\
 * \
 * </odoc>
 */
OpenWrap.format.prototype.streamHandle = function(aHandle, inHandle, errHandle, outHandle, bufferSize) {
	aHandle    = _$(aHandle, "aHandle").isFunction().default((aType, aTxt, inHandle, errHandle, outHandle) => {
		if (aType == "in")  inHandle(aTxt)
		if (aType == "err") errHandle(aTxt)
	})
	bufferSize = _$(bufferSize, "bufferSize").isNumber().default(__) 
	inHandle   = _$(inHandle, "inHandle").isFunction().default(printnl)
	errHandle  = _$(errHandle, "errHandle").isFunction().default(printErrnl) 
	outHandle  = _$(outHandle, "outHandle").isFunction().default((txt, inp) => {
		inp.flush()
		ioStreamWrite(inp, txt)
		inp.flush()
	})

	return function(out, err, inp) { 
		$doAll([
			$do(() => {
				ioStreamRead(out, f => { 
					aHandle("in", f, inHandle, errHandle, txt => outHandle(txt, inp))
				}, bufferSize, false)
			}),
			$do(() => {
				ioStreamRead(err, f => { 
					aHandle("err", f, inHandle, errHandle, txt => outHandle(txt, inp))
				}, bufferSize, false)
			})
		])

		return 0
	}
}

/**
 * <odoc>
 * <key>ow.format.addNumberSeparator(aNumber, aSeparator) : String</key>
 * Returns a formatted number with decimal separators (default is comma but you can provide a custom
 * aSeparator).\
 * (available after ow.loadFormat())
 * </odoc>
 */
OpenWrap.format.prototype.addNumberSeparator = function(aNumber, aSeparator) {
	if (isUndefined(aSeparator)) aSeparator = ",";

	return aNumber.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + aSeparator);
}

/**
 * <odoc>
 * <key>ow.format.fromByte(aByte) : Number</key>
 * Converts a byte info a decimal number.
 * </odoc>
 */
OpenWrap.format.prototype.fromByte = function(aByte) {
	return aByte & 0xFF;
}

/**
 * <odoc>
 * <key>ow.format.toHex(aNumber, aLength) : String</key>
 * Converts a provided aNumber to the hexadecimal representation. Optionally you can provide a length for 0 left pad.
 * </odoc>
 */
OpenWrap.format.prototype.toHex = function(aNumber, aLength) {
	return (isDefined(aLength)) ? ow.format.string.leftPad(String(java.lang.Long.toHexString(aNumber)), aLength, "0") : String(java.lang.Long.toHexString(aNumber));
}

/**
 * <odoc>
 * <key>ow.format.toOctal(aNumber, aLength) : String</key>
 * Converts a provided aNumber to the octal representation. Optionally you can provide a length for 0 left pad.
 * </odoc>
 */
OpenWrap.format.prototype.toOctal = function(aNumber, aLength) {
	return (isDefined(aLength)) ? ow.format.string.leftPad(String(java.lang.Long.toOctalString(aNumber)), aLength, "0") : String(java.lang.Long.toOctalString(aNumber));
}

/**
 * <odoc>
 * <key>ow.format.toBinary(aNumber, aLength) : String</key>
 * Converts a provided aNumber to the binary representation. Optionally you can provide a length for 0 left pad.
 * </odoc>
 */
OpenWrap.format.prototype.toBinary = function(aNumber, aLength) {
	return (isDefined(aLength)) ? ow.format.string.leftPad(String(java.lang.Long.toBinaryString(aNumber)), aLength, "0") : String(java.lang.Long.toBinaryString(aNumber));
}

/**
 * <odoc>
 * <key>ow.format.toBase36(aNumber, aLength) : String</key>
 * Converts a provided aNumber to the base36 representation. Optionally you can provide a length for 0 left pad.
 * </odoc>
 */
OpenWrap.format.prototype.toBase36 = function(aNumber, aLength) {
	var t = Number(aNumber).toString(36);
	return (isDef(aLength)) ? ow.format.string.leftPad(t , aLength, "0") : t;
};

/*
 * <odoc>
 * <key>ow.format.toBase32(aString) : String</key>
 * Given aString or array of bytes transforms the contents to base 32.
 * </odoc>
 */
OpenWrap.format.prototype.toBase32 = function(aString) {
	var b32 = new Packages.org.apache.commons.codec.binary.Base32()

	if (isString(aString)) aString = af.fromString2Bytes(aString)
	return af.fromBytes2String(b32.encode(aString))
}

/**
 * <odoc>
 * <key>ow.format.toBase16(aString) : String</key>
 * Given aString or array of bytes transforms the contents to base 16.
 * </odoc>
 */
OpenWrap.format.prototype.toBase16 = function(aString) {
	var b16 = new Packages.org.apache.commons.codec.binary.Base16()

	if (isString(aString)) aString = af.fromString2Bytes(aString)
	return af.fromBytes2String(b16.encode(aString))
}

/**
 * <odoc>
 * <key>ow.format.fromBase36(aString) : Number</key>
 * Converts a provided base36 aString into the corresponding number.
 * </odoc>
 */
OpenWrap.format.prototype.fromBase36 = function(aString) {
	return parseInt(aString, 36);
};

/**
 * <odoc>
 * <key>ow.format.fromBase32(aString) : bytes</key>
 * Given a base 32 aString transforms it back to the original array of bytes.
 * </odoc>
 */
OpenWrap.format.prototype.fromBase32 = function(aString) {
	_$(aString, "aString").isString().$_()
	var b32 = new Packages.org.apache.commons.codec.binary.Base32()

	return b32.decode(aString)
}

/**
 * <odoc>
 * <key>ow.format.fromBase16(aString) : bytes</key>
 * Given a base 16 aString transforms it back to the original array of bytes.
 * </odoc>
 */
OpenWrap.format.prototype.fromBase16 = function(aString) {
	_$(aString, "aString").isString().$_()
	var b16 = new Packages.org.apache.commons.codec.binary.Base16()

	return b16.decode(aString)
}

/**
 * <odoc>
 * <key>ow.format.fromHex(aString) : Number</key>
 * Converts a provided hexadecimal aString into the decimal number.
 * </odoc>
 */
OpenWrap.format.prototype.fromHex = function(aString) {
	return Number(java.lang.Long.parseLong(aString, 16));
}

/**
 * <odoc>
 * <key>ow.format.fromBinary(aString) : Number</key>
 * Converts a provided binary aString into the decimal number.
 * </odoc>
 */
OpenWrap.format.prototype.fromBinary = function(aString) {
	return java.lang.Long.parseLong(aString, 2);
}

/**
 * <odoc>
 * <key>ow.format.fromOctal(aString) : Number</key>
 * Converts a provided octal aString into the decimal number.
 * </odoc>
 */
OpenWrap.format.prototype.fromOctal = function(aString) {
	return java.lang.Long.parseLong(aString, 8);
}

/**
 * <odoc>
 * <key>ow.format.int2IP(aIPInt) : String</key>
 * Converts the decimal IP address representation aIPInt into an IP address.
 * </odoc>
 */
OpenWrap.format.prototype.int2IP = function(ipInt) {
	return ( (ipInt>>>24) +'.' + (ipInt>>16 & 255) +'.' + (ipInt>>8 & 255) +'.' + (ipInt & 255) );
};

/**
 * <odoc>
 * <key>ow.format.IP2Int(aIP) : String</key>
 * Converts an IP address into it's decimal IP address representation.
 * </odoc>
 */
OpenWrap.format.prototype.IP2int = function(ip) {
 	return ip.split('.').reduce(function(ipInt, octet) { return (ipInt<<8) + parseInt(octet, 10)}, 0) >>> 0;
};

/**
 * <odoc>
 * <key>ow.format.toAbbreviation(aNumber, aDigits) : String</key>
 * Returns a number abbreviation to "k", "m", "b", "t". Will round number to 2 decimals if aDigits
 * doesn't provide a different decimal digits to round to.\
 * (available after ow.loadFormat())
 * </odoc>
 */
OpenWrap.format.prototype.toAbbreviation = function(number, digits) {
    if (isUndefined(digits)) {
      digits = 2;
    }
    // @default: 2 decimal places => 100, 3 => 1000, etc.
    digits = Math.pow(10, digits);
    var abbr = ["k", "m", "b", "t"];
    var i = abbr.length - 1;
    while (i >= 0) {
      var size = Math.pow(10, (i + 1) * 3);
      if (size <= number) {
        number = Math.round(number * digits / size) / digits;
        // Special case where we round up to the next abbreviation
        if ((number === 1000) && (i < abbr.length - 1)) {
          number = 1;
          i++;
        }
        number += abbr[i];
        break;
      }
      i--;
    }
    return number;
}

/**
 * <odoc>
 * <key>ow.format.toNumberSpacing(aNumber, aSpacer) : String</key>
 * Returns a number with aSpacer as thousands separator.\
 * (available after ow.loadFormat())
 * </odoc>
 */
OpenWrap.format.prototype.toNumberSpacing = function(aNumber, aSpacer) {
	aSpacer = _$(aSpacer, "aSpacer").isString().default(" ")
	aNumber = _$(Number(aNumber), "aNumber").isNumber().$_()
	let parts = aNumber.toString().split(".")
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, aSpacer)
	return parts.join(".")
}

/**
 * <odoc>
 * <key>ow.format.fromNumberSpacing(aNumber, aSpacer) : Number</key>
 * Returns a number from a string with aSpacer as thousands separator.\
 * (available after ow.loadFormat())
 * </odoc>
 */
OpenWrap.format.prototype.fromNumberSpacing = function(aNumber, aSpacer) {
	aSpacer = _$(aSpacer, "aSpacer").isString().default(" ")
	aNumber = _$(aNumber, "aNumber").isString().$_()
	return Number(aNumber.replace(new RegExp(aSpacer, "g"), ""))
}

/**
 * <odoc>
 * <key>ow.format.toBytesAbbreviation(aNumber, aDigits) : String</key>
 * Returns a number abbreviation to "bytes", "KB", "MB", "GB", "TB", etc. Will round number to 3 significant
 * digits if aDigits doesn't provide a different number of precision digits to convert to.\
 * (available after ow.loadFormat())
 * </odoc>
 */
OpenWrap.format.prototype.toBytesAbbreviation = function (bytes, precision) {
    bytes = _$(bytes, "bytes").isNumber().default(0)
	if (bytes == 0) return "0 bytes"
	if (isUnDef(precision)) precision = 3

	var sizes = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	var posttxt = 0;

	if (bytes == 0) return;

	if (bytes < 1024) {
		return Number(bytes) + " " + sizes[posttxt];
	}

	while (bytes >= 1024) {
		posttxt++;
		bytes = bytes / 1024;
	}

	return bytes.toPrecision(precision) + " " + sizes[posttxt];
}

/**
 * <odoc>
 * <key>ow.format.fromSIAbbreviation(aString) : Number</key>
 * Converts the provided string using SI notationp prefix (do previously make the necessary conversions: 5mV -> 5m, 5cm -> 5c, 9km -> 9k) to the corresponding number.
 * Uses the current approved SI prefix list (https://en.wikipedia.org/wiki/Metric_prefix)
 * </odoc>
 */
OpenWrap.format.prototype.fromSIAbbreviation = function(aStr) {
    _$(aStr).isString().$_()
    aStr = aStr.trim()
    var arr = aStr.match(/(-?[0-9\.]+)\s*([a-zA-Z]+)/), unit, value
	if (isNull(arr)) return aStr
	if (arr.length >= 2) {
		unit  = String(arr[2])
		value = Number(arr[1])
	} else {
		unit  = ""
		value = parseFloat(aStr)
	}

    var hUnits = ["da","h","k","M","G","T","P","E","Z","Y","R","Q"]
    var lUnits = ["d","c","m","μ","n","p","f","a","z","y","r","q"]
	var vUnits = [1,2,3,6,9,12,15,18,21,24,27,30]

    var res = value
    var hUi = hUnits.indexOf(unit)
    if (hUi >= 0) {
        res = res * Math.pow(10, vUnits[lUi])
    } else {
        lUi = lUnits.indexOf(unit)
        if (lUi >= 0) {
            res = res * Math.pow(10, - vUnits[lUi])
        }
    }

    return res
}

/**
 * <odoc>
 * <key>ow.format.fromBytesAbbreviation(aStr, useDecimal) : Number</key>
 * Tries to reverse the ow.format.toBytesAbbreviation from aStr (string) back to the original value in bytes.
 * Use useDecimal=true to interpret KB as 1000 instead of 1024 (see more in https://en.wikipedia.org/wiki/Byte#Multiple-byte_units)\
 * (available after ow.loadFormat())
 * </odoc>
 */
OpenWrap.format.prototype.fromBytesAbbreviation = function(aStr, useDecimal) {
	_$(aStr, "aStr").isString().$_()
	iseDecimal = _$(useDecimal, "useDecimal").isBoolean().default(false)

	var sizes  = ['BYTES', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
	var msizes = [ 'BYTES', 'KIB', 'MIB', 'GIB', 'TIB', 'PIB', 'EIB', 'ZIB', 'YIB' ]
	var misizes = [ 'BYTES', 'KI', 'MI', 'GI', 'TI', 'PI', 'EI', 'ZI', 'YI' ]

	aStr = aStr.trim()
	var arr = aStr.match(/(-?[0-9\.]+)\s*([a-zA-Z]+)/), unit, value
	if (arr.length >= 2) {
		unit  = String(arr[2])
		value = Number(arr[1])
	} else {
		unit  = ""
		value = parseFloat(aStr)
	}

	var vfactor = 1
	if (sizes.indexOf(unit.toUpperCase()) > 0) {		
		for(var ii = 1; ii <= sizes.indexOf(unit.toUpperCase()); ii++) {
			vfactor *= (useDecimal ? 1000 : 1024)
		}
	} 
	if (msizes.indexOf(unit.toUpperCase()) > 0) {		
		for(var ii = 1; ii <= msizes.indexOf(unit.toUpperCase()); ii++) {
			vfactor *= 1024
		}
	} else {
		for(var ii = 1; ii <= misizes.indexOf(unit.toUpperCase()); ii++) {
			vfactor *= 1024
		}
	}
			
	return Math.round(value * vfactor)
}

/**
 * <odoc>
 * <key>ow.format.fromTimeAbbreviation(aStr) : Number</key>
 * From aStr time abbreviation (e.g. 1h2m3s (1 hour, 2 minutes and 3 seconds)) will return the corresponding amount
 * of time in ms.
 * </odoc>
 */
OpenWrap.format.prototype.fromTimeAbbreviation = function(aStr) {
	_$(aStr, "aStr").isString().$_()

	var ars = aStr.trim().match(/[0-9]+[a-zA-Z]+/g), res = 0
	if (!isArray(ars) || ars.length == 0) return parseInt(aStr)
	for(var i in ars) {
		var ar = ars[i].match(/([0-9]+)\s*([a-zA-Z]+)/)
		if (isArray(ar) && ar.length > 0) {
			var v = Number(ar[1])
			var u = String(ar[2])

			var _u = {
				"ms": 1,
				"s" : 1000,
				"m" : 60 * 1000,
				"h" : 60 * 60 * 1000,
				"d" : 24 * 60 * 60 * 1000,
				"w" : 7 * 24 * 60 * 60 * 1000,
				"M" : 30 * 24 * 60 * 60 * 1000,
				"y" : 365 * 24 * 60 * 60 * 1000
			}
			if (isDef(_u[u])) {
				res += v * _u[u]
			} else {
				res += v
			}
		}
	}

	return res
}

/**
 * <odoc>
 * <key>ow.format.toSLON(aObj, cTheme) : String</key>
 * Stringifies aObj into a Single Line Object Notation using a default scheme for human readability or a 
 * custom cTheme map composed of:\
 * \
 *    startMap "("\
 *    sepMap   ", "\
 *    endMap   ")"\
 *    sepKV    ": "\
 *    startArr "["\
 *    sepArr   " | "\
 *    endArr   "]"\
 *    strQuote "'"\
 * \
 * </odoc>
 */
OpenWrap.format.prototype.toSLON = function(aObj, cTheme) {
	var dTheme = {
	   startMap : "(",
	   sepMap   : ", ",
	   endMap   : ")",
	   sepKV    : ": ",
	   startArr : "[",
	   sepArr   : " | ",
	   endArr   : "]",
	   strQuote : "'",
	   specialRE: "[\.\(\,\)\:\\[\\]\|\']"
	}
  
	if (isMap(cTheme)) dTheme = merge(dTheme, cTheme);
  
	if (isNull(aObj)) {
        return null;
    }
	if (isMap(aObj)) {
	   var pairs = [];
	   Object.keys(aObj).forEach(r => {
		  pairs.push(r + dTheme.sepKV + ow.format.toSLON(aObj[r], dTheme))
	   });
	   return dTheme.startMap + pairs.join(dTheme.sepMap) + dTheme.endMap; 
	}
	if (isArray(aObj)) {
	   return dTheme.startArr + aObj.map(r => {
		  return ow.format.toSLON(r, dTheme)
	   }).join(dTheme.sepArr) + dTheme.endArr;
	}
	if (isDate(aObj)) {
		return ow.format.fromDate(aObj, 'yyyy-MM-dd/HH:mm:ss.SSS');
	}
	if (isNumber(aObj)) {
		return String(aObj)
	}
	var _escape = s => s.replace(new RegExp(dTheme.strQuote, "g"), "\\" + dTheme.strQuote)
	if (!isMap(aObj) && !isArray(aObj)) return (isString(aObj) && aObj.match(new RegExp(dTheme.specialRE))) ? dTheme.strQuote + _escape(aObj) + dTheme.strQuote : String(aObj)
}

/**
 * <odoc>
 * <key>ow.format.toCSLON(aObj, cTheme) : String</key>
 * Equivalent to ow.fornat.toSLON but includes ansi color.
 * </odoc>
 */
OpenWrap.format.prototype.toCSLON = function(aObj, cTheme) {
	var dTheme = {
	   startMap: "(",
	   sepMap  : ", ",
	   endMap  : ")",
	   sepKV   : ": ",
	   startArr: "[",
	   sepArr  : " | ",
	   endArr  : "]",
	   strQuote: "'",
	   specialRE: "[\(\,\)\:\\[\\]\|\']"
	}
  
	if (isMap(cTheme)) dTheme = merge(dTheme, cTheme);
  
	if (isNull(aObj)) {
        return null;
    }
	if (isMap(aObj)) {
	   var pairs = [];
	   Object.keys(aObj).forEach(r => {
		  pairs.push(ansiColor("bold",r) + ansiColor("faint", dTheme.sepKV) + ow.format.toCSLON(aObj[r], dTheme))
	   })
	   return ansiColor("faint", dTheme.startMap) + pairs.join(ansiColor("faint", dTheme.sepMap)) + ansiColor("faint", dTheme.endMap) 
	}
	if (isArray(aObj)) {
	   return ansiColor("faint", dTheme.startArr) + aObj.map(r => {
		  return ow.format.toCSLON(r, dTheme)
	   }).join(ansiColor("faint", dTheme.sepArr)) + ansiColor("faint", dTheme.endArr)
	}
	if (isDate(aObj)) {
		return ansiColor("reset", ow.format.fromDate(aObj, 'yyyy-MM-dd/HH:mm:ss.SSS'))
	}
	var _escape = s => s.replace(new RegExp(dTheme.strQuote, "g"), "\\" + dTheme.strQuote)
	if (!isMap(aObj) && !isArray(aObj)) return ansiColor("reset", (isString(aObj) && aObj.match(new RegExp(dTheme.specialRE))) ? dTheme.strQuote + _escape(aObj) + dTheme.strQuote : String(aObj))
}

/**
 * <odoc>
 * <key>ow.format.round(aNumber, aDigits) : String</key>
 * Will return aNumber rounded to 0 decimal digits or aDigits decimal digits.\
 * (available after ow.loadFormat())
 * </odoc>
 */
OpenWrap.format.prototype.round = function(number, digits) {
	_$(number, "number").isNumber().$_()
	digits = _$(digits, "digits").isNumber().default(0)
	if (number == 0) return 0
    return number.toFixed(digits)
}

/**
 * <odoc>
 * <key>ow.format.percentile(aArray, aPercentile) : Number</key>
 * Will return the percentile (aPercentile between 0 and 1) for the provided aArray of numbers.
 * </odoc>
 */
OpenWrap.format.prototype.percentile = function(aArray, aPercentile) {
	_$(aArray, "aArray").isArray().$_()
	_$(aPercentile, "aPercentile").isNumber().$_()

	var sorted = aArray.sort((a,b) => a - b)
	var pos = (sorted.length - 1) * aPercentile
	var base = Math.floor(pos)
	var rest = pos - base

	if ((sorted[base + 1] !== undefined)) {
		return sorted[base] + rest * (sorted[base + 1] - sorted[base])
	} else {
		return sorted[base]
	}
}

/**
 * <odoc>
 * <key>ow.format.sortSemanticVersions(aArray) : Array</key>
 * Will sort the provided aArray of semantic versions (e.g. 1.0.0, 1.0.1, 1.1.0, 2.0.0, ...)\
 * (available after ow.loadFormat())
 * </odoc>
 */
OpenWrap.format.prototype.sortSemanticVersions = function(anArray) {
    return anArray.sort((a, b) => {
		return new org.semver4j.Semver(a).isEqualTo(b) ? 0 : new org.semver4j.Semver(a).isGreaterThan(b) ? 1 : -1
    })
}

OpenWrap.format.prototype.toBase64 = function(aString) { return af.fromBytes2String(af.toBase64Bytes(aString)); }
OpenWrap.format.prototype.fromBase64 = function(aString) { return af.fromBytes2String(af.fromBase64(aString)); }
OpenWrap.format.prototype.md2  = md2;
OpenWrap.format.prototype.md5  = md5;
OpenWrap.format.prototype.sha1 = sha1;
OpenWrap.format.prototype.sha256 = sha256;
OpenWrap.format.prototype.sha384 = sha384;
OpenWrap.format.prototype.sha512 = sha512;
OpenWrap.format.prototype.toBoolean = toBoolean;
OpenWrap.format.prototype.now = now;
OpenWrap.format.prototype.nowUTC = nowUTC;
OpenWrap.format.prototype.nowNano = nowNano;
OpenWrap.format.prototype.hmacSHA1 = hmacSHA1;
OpenWrap.format.prototype.hmacSHA256 = hmacSHA256;
OpenWrap.format.prototype.hmacSHA384 = hmacSHA384;
OpenWrap.format.prototype.hmacSHA512 = hmacSHA512;

/**
 * <odoc>
 * <key>ow.format.timeago(aDate, isAbv) : String</key>
 * Will output how much time ago aDate is (e.g. 2 years ago, 30 minutes ago, etc...).\
 * Optionally isAbv = true for abbreviated output. 
 * (available after ow.loadFormat())
 * </odoc>
 */
OpenWrap.format.prototype.timeago = function(date, isAbv) {
	_$(isAbv, "isAbv").isBoolean().default(false)

    date = new Date(date);
    var seconds = Math.floor((new Date() - date) / 1000);
    var interval = Math.floor(seconds / 31536000);
    if (interval > 1) {return "" + interval + (isAbv ? "yrs" : " years ago") }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {return "" + interval + (isAbv ? "mths" : " months ago") }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {return "" + interval + (isAbv ? "days" : " days ago") }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {return "" + interval + (isAbv ? "hrs" : " hours ago") }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {return "" + interval + (isAbv ? "mins" : " minutes ago") }
    if (Math.floor(seconds) === 0) {
      return (isAbv ? "now" : 'Just now');
    } else {
      return Math.floor(seconds) + (isAbv ? "secs" : ' seconds ago');
    }
}

/**
 * <odoc>
 * <key>ow.format.toDate(aStringDate, aFormat, aTimeZone) : Date</key>
 * Will convert aStringDate into a javascript Date given aFormat:\
 * \
 *   G - Era descriptor (AD)\
 *   y - Year (1996; 96)\
 *   Y - Week year (2009; 09)\
 *   M - Month in year (July; Jul; 07)\
 *   w - Week in year (27)\
 *   W - Week in month (2)\
 *   D - Day in year (189)\
 *   d - Day in month (10)\
 *   F - Day of week in month (2)\
 *   E - Day name in week (Tuesday; Tue)\
 *   u - Day number of week (1 = Monday, ..., 7 = Sunday) (1)\
 *   a - Am/pm number (PM)\
 *   H - Hour in day (0-23)\
 *   k - Hour in day (1-24)\
 *   K - Hour in am/pm (0-11)\
 *   h - Hour in am/pm (1-12)\
 *   m - Minute in hour (30)\
 *   s - Second in minute (55)\
 *   S - Millisecond (978)\
 *   z - Time zone (Pacific Standard Time; PST; GMT-08:00)\
 *   Z - Time zone (-0800)\
 *   X - Time zone (-08; -0800; -08:00)\
 * \
 * Optionally you can also provide the original aTimeZone (like 'America/New_York', 'Europe/London', 'UTC', ...)\
 * (available after ow.loadFormat())
 * </odoc>
 */
OpenWrap.format.prototype.toDate = function(aStringDate, aFormat, aTimeZone) {
	var sdf = new java.text.SimpleDateFormat(aFormat);
	if (isDef(aTimeZone)) sdf.setTimeZone(java.util.TimeZone.getTimeZone(aTimeZone));
	return new Date(sdf.parse(aStringDate).toInstant());
}

/**
 * <odoc>
 * <key>ow.format.toWedoDate(aStringDate, aFormat) : Map</key>
 * Shortcut for using ow.format.toDate but converting the output into a wedo date.
 *  \
 * (available after ow.loadFormat())
 * </odoc>
 */
OpenWrap.format.prototype.toWedoDate = function(aStringDate, aFormat) {
	if (isUnDef(aFormat)) throw "Please define the string date format";
	
	var aConvertedDate = this.toDate(aStringDate, aFormat);
	return {
		"__wedo__type__": "date",
		"content"       : [aConvertedDate]
	};
}

/**
 * <odoc>
 * <key>ow.format.getActualTime(useAlternative) : Date</key>
 * Retrieves the current actual time from worldtimeapi.org (through https). The current actual time will be returned in a Date.
 * If useAlternative = true it will use worldclockapi.com (through http)
 * </odoc>
 */
OpenWrap.format.prototype.getActualTime = function(useAlternative) {
	ow.loadNet();
	return ow.net.getActualTime(useAlternative);
}

/**
 * <odoc>
 * <key>ow.format.fromDate(aDate, aFormat, aTimeZone) : String</key>
 * Will convert a javascript aDate into a String representation given aFormat:\
 * \
 *   G - Era descriptor (AD)\
 *   y - Year (1996; 96)\
 *   Y - Week year (2009; 09)\
 *   M - Month in year (July; Jul; 07)\
 *   w - Week in year (27)\
 *   W - Week in month (2)\
 *   D - Day in year (189)\
 *   d - Day in month (10)\
 *   F - Day of week in month (2)\
 *   E - Day name in week (Tuesday; Tue)\
 *   u - Day number of week (1 = Monday, ..., 7 = Sunday) (1)\
 *   a - Am/pm number (PM)\
 *   H - Hour in day (0-23)\
 *   k - Hour in day (1-24)\
 *   K - Hour in am/pm (0-11)\
 *   h - Hour in am/pm (1-12)\
 *   m - Minute in hour (30)\
 *   s - Second in minute (55)\
 *   S - Millisecond (978)\
 *   z - Time zone (Pacific Standard Time; PST; GMT-08:00)\
 *   Z - Time zone (-0800)\
 *   X - Time zone (-08; -0800; -08:00)\
 * \
 * Optionally you can also provide aTimeZone (like 'America/New_York', 'Europe/London', 'UTC', ...)\
 * \
 * (available after ow.loadFormat())
 * </odoc>
 */
OpenWrap.format.prototype.fromDate = function(aDate, aFormat, aTimeZone) {
	if (isString(aDate) && new Date(aDate) != null) aDate = new Date(aDate);

	var sdf = new java.text.SimpleDateFormat(aFormat);
	var jd = new java.util.Date();
	if (isDefined(aTimeZone)) sdf.setTimeZone(java.util.TimeZone.getTimeZone(aTimeZone));
	jd.setTime(aDate.getTime());
	return String(sdf.format(jd));
}

/**
 * <odoc>
 * <key>ow.format.fromWedoDate(aWedoDate, aFormat) : String</key>
 * Shortcut for ow.format.fromDate but using a wedo date. See ow.format.fromDate for more help. 
 * \
 * (available after ow.loadFormat())
 * </odoc>
 */
OpenWrap.format.prototype.fromWedoDate = function(aWedoDate, aFormat) {
	if (isUnDef(aFormat)) aFormat = "yyyy-MM-dd HH:mm:ss";
	if (ow.format.isWedoDate(aWedoDate)) 
		return ow.format.fromDate(new Date(aWedoDate.content[0]), aFormat);
}

/**
 * <odoc>
 * <key>ow.format.fromUnixDate(aUnixDate) : Date</key>
 * Converts aUnixDate timestamp into a javascript Date.
 * </odoc>
 */
OpenWrap.format.prototype.fromUnixDate = function(aUnixDate) {
	return new Date(Number(aUnixDate) * 1000);
};

/**
 * <odoc>
 * <key>ow.format.fromLDAPDate(aLDAPDate) : Date</key>
 * Converts a numeric aLDAPDate (also known as Windows NT time format, Active Directory timestamps) into a javascript Date.
 * </odoc>
 */
OpenWrap.format.prototype.fromLDAPDate = function(aLDAPDate) {
	return new Date(((aLDAPDate / 10000000) - 11644473600) * 1000);
};
 
/**
 * <odoc>
 * <key>ow.format.toLDAPDate(aDate) : Number</key>
 * Converts a javascript Date into a LDAP date (also known as Windows NT time format, Active Directory timestamps)
 * </odoc>
 */
OpenWrap.format.prototype.toLDAPDate = function(aDate) {
	return ((aDate.getTime() / 1000) + 11644473600) * 10000000;
};

/**
 * <odoc>
 * <key>ow.format.toUnixDate(aDate) : Number</key>
 * Returns a unix timestamp from the provided javascript aDate.
 * </odoc>
 */
OpenWrap.format.prototype.toUnixDate = function(aDate) {
	return ow.format.round(aDate.getTime()/1000);
}

/**
 * <odoc>
 * <key>ow.format.fromWedoDateToDate(aWedoDate) : Date</key>
 * Returns a date object from a wedo date. (available after ow.loadFormat())
 * </odoc>
 */
OpenWrap.format.prototype.fromWeDoDateToDate = function(aWedoDate) {
	if (ow.format.isWedoDate(aWedoDate))
		return new Date(aWedoDate.content[0]);
}

/**
 * <odoc>
 * <key>ow.format.isWedoDate(aWedoDate) : boolean</key>
 * Determines if the aWedoDate object is a wedo date type (returns true if yes, false otherwise).
 *  \
 * (available after ow.loadFormat())
 * </odoc>
 */
OpenWrap.format.prototype.isWedoDate = function(aWedoDate) {
	if (isDef(aWedoDate["__wedo__type__"]) &&
		aWedoDate["__wedo__type__"] == "date")
		return true;
	else
		return false;
};

/**
 * <odoc>
 * <key>ow.format.fromISODate(aISODate) : Date</key>
 * Converts a ISO date string into a javascript Date.
 * </odoc>
 */
OpenWrap.format.prototype.fromISODate = function(aISODate) {
	_$(aISODate, "aISODate").isString().$_()
	var _r 
	try {
		if (isNull(aISODate) || isUnDef(aISODate)) 
			_r = __
		else 
			_r = new Date(java.time.Instant.parse(aISODate).toEpochMilli())
	} catch(e) {
		try {
			_r = new Date(aISODate)
		} catch(ee) {
			_r = __
		}
	}
	return isDate(_r) ? _r : aISODate
}

/**
 * <odoc>
 * <key>ow.format.isIPv4(aIP) : boolean</key>
 * Tries to determine if aIP is a syntactic valid IPv4.
 * </odoc>
 */
OpenWrap.format.prototype.isIPv4 = function(aIP) {
	ow.loadNet()
	return ow.net.isIPv4(aIP)
};

/**
 * <odoc>
 * <key>ow.format.isIPv6(aIP) : boolean</key>
 * Tries to determine if aIP is a syntactic valid IPv6.
 * </odoc>
 */
OpenWrap.format.prototype.isIPv6 = function(aIP) {
	ow.loadNet()
	return ow.net.isIPv6(aIP)
};

/**
 * <odoc>
 * <key>ow.format.isEmail(aEmail) : boolean</key>
 * Tries to determine if aEmail seems a syntactic valid email.
 * </odoc>
 */
OpenWrap.format.prototype.isEmail = function(aEmail) {
	if (isString(aEmail) &&
	   aEmail.match(/^[\w-_\.+]*[\w-_\.]\@([\w]+\.)+[\w]+[\w]$/)) {
		return true;
	} else {
		return false;
	}
};

/**
 * <odoc>
 * <key>ow.format.isURL(aURL) : boolean</key>
 * Tries to determine if aURL seems a syntactic valid URL.
 * </odoc>
 */
OpenWrap.format.prototype.isURL = function(aURL) {
	ow.loadNet()
	return ow.net.isURL(aURL)
};

/**
 * <odoc>
 * <key>ow.format.isHost(aHost) : boolean</key>
 * Tries to determine if aHost seems a syntactic valid host.
 * </odoc>
 */
OpenWrap.format.prototype.isHost = function(aHost) {
	ow.loadNet()
	return ow.net.isHost(aHost)
};

/**
 * <odoc>
 * <key>ow.format.escapeString(aString, aExceptString) : String</key>
 * Will escape, and return, aString for RegExp special characters with the exception of any characters in
 * aExceptString.\
 * (available after ow.loadFormat())
 * </odoc>
 */
OpenWrap.format.prototype.escapeString = function(str, except) {
  return str.replace(/([\.$?*|{}\(\)\[\]\\\/\+\^])/g, function (ch) {
    if (except && except.indexOf(ch) !== -1) {
      return ch;
    }
    return '\\' + ch;
  });
};

/**
 * <odoc>
 * <key>ow.format.getPublicIP() : Map</key>
 * Uses the functionality provided by http://ifconfig.co to return a map with the apparent current public ip address,
 * public hostname and a guess of country and city. Please be aware of the request limits of the service (around 1 request
 * per minute).
 * </odoc>
 */
OpenWrap.format.prototype.getPublicIP = function() {
	ow.loadNet();
	return ow.net.getPublicIP();
	//return $rest().get("https://ifconfig.co/json");
};

/**
 * <odoc>
 * <key>ow.format.getTLSCertificates(aHost, aPort, withJava, aPath, aPass, aSoTimeout) : Array</key>
 * Tries to retreive the TLS certificates from aHost, aPort (defaults to 443). Optionally if withJava=true the original certificate
 * Java object will also be included. If the CA certificates is in a different location you can provide aPath and the corresponding aPass.
 * Additionally you can specificy aSoTimeout (socket timeout in ms) which defaults to 10s.  
 * </odoc>
 */
OpenWrap.format.prototype.getTLSCertificates = function(aHost, aPort, withJava, aPath, aPass, aSoTimeout) {
	ow.loadNet();
	return ow.net.getTLSCertificates(aHost, aPort, withJava, aPath, aPass, aSoTimeout);
    /*_$(aHost, "aHost").isString().$_();
	aPort = _$(aPort, "aPort").isNumber().default(443);
    aPath = _$(aPath, "aPath").isString().default(ow.format.getJavaHome() + "/lib/security/cacerts");
	aPass = _$(aPass, "aPass").isString().default("changeit");
	withJava = _$(withJava, "withJava").isBoolean().default(false);
	aSoTimeout = _$(aSoTimeout, "aSoTimeout").isNumber().default(10000);

    var context = javax.net.ssl.SSLContext.getInstance("TLS");
    var tmf = javax.net.ssl.TrustManagerFactory.getInstance(javax.net.ssl.TrustManagerFactory.getDefaultAlgorithm());
    var ks = java.security.KeyStore.getInstance(java.security.KeyStore.getDefaultType());
    ks.load(io.readFileStream(aPath), (new java.lang.String(aPass)).toCharArray());
    tmf.init(ks);
    var defaultTrustManager = tmf.getTrustManagers()[0];
    var cchain;
    var tm = new JavaAdapter(javax.net.ssl.X509TrustManager, {
      getAcceptedIssuers: function() {
        return new java.security.cert.X509Certificate();
      },
      checkClientTrusted: function() {
        throw new javax.net.ssl.UnsupportedOperationException();
      },
      checkServerTrusted: function(chain, authType) {
        cchain = chain;
        defaultTrustManager.checkServerTrusted(chain, authType);
      }
    });
    context.init(null, [tm], null);
    var factory = context.getSocketFactory();

    var socket = factory.createSocket(aHost, aPort);
    socket.setSoTimeout(aSoTimeout);
    try {
      socket.startHandshake();
    } catch(e) {
    }
    socket.close();

    var sres = af.fromJavaArray(cchain);
    var res = sres.map(r => {
	  var rr = {
		issuerDN    : r.getIssuerDN(),
		subjectDN   : r.getSubjectDN(),
		notBefore   : new Date( r.getNotBefore().toGMTString() ),
		notAfter    : new Date( r.getNotAfter().toGMTString() )
	  };
      if (withJava) rr.javaObj = r;
	  if (!isNull(r.getSubjectAlternativeNames())) rr.alternatives = af.fromJavaArray( r.getSubjectAlternativeNames().toArray() ).map(af.fromJavaArray);
 
	  return rr;
    });
    
	return res;*/
};

/**
 * <odoc>
 * <key>ow.format.testPublicPort(aPort) : Map</key>
 * Uses the functionality provided by http://ifconfig.co to return a map with the result of testing if aPort is within public 
 * reach from your apparent current public ip address. Please be aware of the request limits of the service (around 1 request
 * per minute).
 * </odoc>
 */
OpenWrap.format.prototype.testPublicPort = function(aPort) {
	ow.loadNet();
	return ow.net.testPublicPort(aPort);
	/*plugin("HTTP");
	return JSON.parse((new HTTP("http://ifconfig.co/port/" + String(aPort))).response());*/
};

/**
 * <odoc>
 * <key>ow.format.isWindows() : Boolean</key>
 * Returns true if the operating system is identified as Windows otherwise returns false.
 * </odoc>
 */
OpenWrap.format.prototype.isWindows = function() {
	return (String(java.lang.System.getProperty("os.name")).match(/Windows/) ? true : false);
};

/**
 * <odoc>
 * <key>ow.format.getOS() : String</key>
 * Returns the current operating system identifier string.
 * </odoc>
 */
OpenWrap.format.prototype.getOS = function() {
	return String(java.lang.System.getProperty("os.name"));
};

/**
 * <odoc>
 * <key>ow.format.getOSArch() : String</key>
 * Returns the current operating system architecture string.
 * </odoc>
 */
OpenWrap.format.prototype.getOSArch = function() {
	return String(java.lang.System.getProperty("os.arch"));
};

/**
 * <odoc>
 * <key>ow.format.getOSVersion() : String</key>
 * Returns the current operating system version string.
 * </odoc>
 */
OpenWrap.format.prototype.getOSVersion = function() {
	return String(java.lang.System.getProperty("os.version"));
};

/**
 * <odoc>
 * <key>ow.format.getCurrentDirectory() : String</key>
 * Returns the current working directory.
 * </odoc>
 */
OpenWrap.format.prototype.getCurrentDirectory = function() {
	return String(java.lang.System.getProperty("user.dir"));
};

/**
 * <odoc>
 * <key>ow.format.getJavaVersion() : String</key>
 * Returns the current java version.
 * </odoc>
 */
OpenWrap.format.prototype.getJavaVersion = function() {
	return String(java.lang.System.getProperty("java.version"));
};

/**
 * <odoc>
 * <key>ow.format.getUserHome() : String</key>
 * Returns the current user home path.
 * </odoc>
 */
OpenWrap.format.prototype.getUserHome = function() {
	var d = String(java.lang.System.getProperty("user.home"))
	return d
};

/**
 * <odoc>
 * <key>ow.format.getJavaHome() : String</key>
 * Returns the current java home directory.
 * </odoc>
 */
OpenWrap.format.prototype.getJavaHome = function() {
	return String(java.lang.System.getProperty("java.home"));
};

/**
 * <odoc>
 * <key>ow.format.getClasspath() : String</key>
 * Returns the current java classpath.
 * </odoc>
 */
OpenWrap.format.prototype.getClasspath = function() {
	return String(java.lang.System.getProperty("java.class.path"));
};

/**
 * <odoc>
 * <key>ow.format.getTmpDir() : String</key>
 * Returns the current temporary directory.
 * </odoc>
 */
OpenWrap.format.prototype.getTmpDir = function() {
	return String(java.lang.System.getProperty("java.io.tmpdir"))
}

/**
 * <odoc>
 * <key>ow.format.getUserName() : String</key>
 * Returns the current user name.
 * </odoc>
 */
 OpenWrap.format.prototype.getUserName = function() {
	return String(java.lang.System.getProperty("user.name"))
}

/**
 * <odoc>
 * <key>ow.format.getHostName() : String</key>
 * Returns the current hostname.
 * </odoc>
 */
OpenWrap.format.prototype.getHostName = function() {
	ow.loadNet();
	return ow.net.getHostName();
	//return String(java.net.InetAddress.getLocalHost().getHostName());
};

/**
 * <odoc>
 * <key>ow.format.getHostAddress() : String</key>
 * Returns the current host ip address.
 * </odoc>
 */
OpenWrap.format.prototype.getHostAddress = function() {
	ow.loadNet();
	return ow.net.getHostAddress();
	//return String(java.net.InetAddress.getLocalHost().getHostAddress());
};

/**
 * <odoc>
 * <key>ow.format.testHost(aAddress, aTimeout) : Map</key>
 * Uses the java implementation (e.g. usually ICMP ping) for testing reachability to an aAddress. It timeouts after aTimeout (defaults to
 * 4000ms). Returns a map with the "time" spent trying to get an answer from aAddress and a boolean "reachable" with the result.
 * </odoc>
 */
OpenWrap.format.prototype.testHost = function(aAddress, aTimeout) {
	ow.loadNet();
	return ow.net.testHost(aAddress, aTimeout);
	/*_$(aAddress, "address").isString().$_();
	aTimeout = _$(aTimeout, "timeout").isNumber().default(4000);
	
	var init = now();
	var res = (java.net.InetAddress.getByName(aAddress)).isReachable(aTimeout);
	var lat = now() - init;
	
	return { 
	  time: lat,
	  reachable: res
	};*/
};

/**
 * <odoc>
 * <key>ow.format.testPort(aAddress, aPort, aCustomTimeout) : boolean</key>
 * Tries to connect to aPort (e.g. 1234) on aAddress (e.g. 1.2.3.4). If the connection is successfull it will disconnect
 * and return true, otherwise it will return false. If aCustomTimeout (in ms) is defined, it will use that value as the timeout
 * instead of the 1,5 seconds by default.
 * </odoc>
 */
OpenWrap.format.prototype.testPort = function(aAddress, aPort, aCustomTimeout) {
	ow.loadNet();
	return ow.net.testPort(aAddress, aPort, aCustomTimeout);
    /*if (isUnDef(aCustomTimeout)) aCustomTimeout = 1500;

    try {
        var s = new java.net.Socket();
        s.connect(new java.net.InetSocketAddress(aAddress, aPort), aCustomTimeout);
        s.close();
        return true;
    } catch(e) {
        return false;
    }*/
};

/**
 * <odoc>
 * <key>ow.format.testPortLatency(aHost, aPort, aCustomTimeout) : Number</key>
 * Test establishing a TCP socket connection with aHost on aPort. Optionally aCustomTimeout can be provided (defaults to
 * 60000 ms). The test will be timed and the time in ms will be returned. If returned a time &lt; 0 then an error occurred or the 
 * host:port couldn't be reached.
 * </odoc>
 */
OpenWrap.format.prototype.testPortLatency = function(aHost, aPort, aCustomTimeout) {
	ow.loadNet();
	return ow.net.testPortLatency(aHost, aPort, aCustomTimeout);
	/*aCustomTimeout = _$(aCustomTimeout).isNumber().default(60000);
	var sock  = new java.net.Socket();
	var iaddr = new java.net.InetSocketAddress(aHost, aPort);

	var ini = now(), latency = -1;
	try {
		sock.connect(iaddr, aCustomTimeout);
		latency = now() - ini;
	} catch(e) {
		latency = -1;
	} finally {
		sock.close();
	}

	return latency;*/
};

/**
 * <odoc>
 * <key>ow.format.testURLLatency(aURL, aCustomTimeout) : Number</key>
 * Test sending a HTTP(s) GET to aURL. Optionally aCustomTimeout can be provided. The test will be timed and the time in ms
 * will be returned. If returned a time &lt; 0 then an error occurred or the host:port couldn't be reached.
 * </odoc>
 */
OpenWrap.format.prototype.testURLLatency = function(aURL, aCustomTimeout) {
	ow.loadNet();
	return ow.net.testURLLatency(aURL, aCustomTimeout);
	/*ow.loadObj();

	var hc = new ow.obj.http();
	hc.setThrowExceptions(true);
	var ini = now(), latency = -1;
	try {
		hc.get(aURL, __, __, false, aCustomTimeout);
		latency = now() - ini;
	} catch(e) {
		latency = -1;
	}

	return latency;*/
};

/**
 * <odoc>
 * <key>ow.format.escapeHTML(aString) : String</key>
 * Will escape, and return, aString for HTML/XML special characters.\
 * (available after ow.loadFormat())
 * </odoc>
 */
OpenWrap.format.prototype.escapeHTML = function(string) {
	var escape = {
	  '&': '&amp;',
	  '<': '&lt;',
	  '>': '&gt;',
	  '"': '&quot;',
	  "'": '&#x27;',
	  '`': '&#x60;',
	  '=': '&#x3D;'
	};

	var   badChars = /[&<>"'`=]/g,
	      possible = /[&<>"'`=]/;

	function escapeChar(chr) {
	  return escape[chr];
	}

	if (typeof string !== 'string') {
	    if (string && string.toHTML) {
	      return string.toHTML();
	    } else if (string == null) {
	      return '';
	    } else if (!string) {
	      return string + '';
	    }

	    string = '' + string;
	  }

	  if (!possible.test(string)) { return string; }
	  return string.replace(badChars, escapeChar);
};

/**
 * <odoc>
 * <key>ow.format.escapeHTML4(aString) : String</key>
 * Uses Apache Commons Lang escape HTML4 functionality to convert aString into HTML4 entities where needed.
 * </odoc>
 */
OpenWrap.format.prototype.escapeHTML4 = function(string) {
	return String(Packages.org.apache.commons.lang3.StringEscapeUtils.escapeHtml4(string));
};

/**
 * <odoc>
 * <key>ow.format.unescapeHTML4(aString) : String</key>
 * Uses Apache Commons Lang unescape HTML4 functionality to unconvert aString with HTML4 entities to the original string
 * </odoc>
 */
OpenWrap.format.prototype.unescapeHTML4 = function(string) {
	return String(Packages.org.apache.commons.lang3.StringEscapeUtils.unescapeHtml4(string));
};

/**
 * <odoc>
 * <key>ow.format.escapeRE(aString) : String</key>
 * Tries to escape in aString all characters that make up a RegExp.
 * </odoc>
 */
OpenWrap.format.prototype.escapeRE = function(aString) {
	return aString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * <odoc>
 * <key>ow.format.transposeArrayLines(anLineArray) : Array</key>
 * Given anLineArray transposes into a new array of lines. 
 * </odoc>
 */
OpenWrap.format.prototype.transposeArrayLines = function(anLineArray) {
	var newArray = [];
	var aLimit = 0;
	for(let i in anLineArray) {
		if (aLimit < anLineArray[i].length) aLimit = anLineArray[i].length;
	}	
	aLimit--
	for(let j = 0; j <= aLimit; j++) {
		if (isUnDef(newArray[j])) newArray[j] = "";
		for(let i in anLineArray) {
			newArray[j] += (isDef(anLineArray[i][aLimit-j])) ? anLineArray[i][aLimit-j] : " ";
		}
	}
	return newArray;
}

/**
 * <odoc>
 * <key>ow.format.dateTimeZones() : Array</key>
 * List all available Java zone ids.
 * </odoc>
 */
OpenWrap.format.prototype.dateTimeZones = function() {
	return af.fromJavaArray( java.time.ZoneId.getAvailableZoneIds().toArray() ).sort()
}

/**
 * <odoc>
 * <key>ow.format.dateTimeTransition(aZone, aDate) : Map</key>
 * Given aZone (defaults to Europe/London) and aDate (defaults to now) will return a map with the previous 
 * and next date/time transition.
 * </odoc>
 */
OpenWrap.format.prototype.dateTimeTransition = function(aZone, aDate) {
	aZone = _$(aZone, "aZone").isString().default("Europe/London")
	aDate = _$(aDate, "aDate").isDate().default(__)
  
	var info = { zone: aZone, previousTransition: __, nextTransition: __ }
	var zone = java.time.ZoneId.of(aZone)
  
	var zdt
	if (isDate(aDate)) {
	  zdt = java.time.ZonedDateTime.of(java.time.LocalDateTime.parse(aDate.toISOString().replace(/Z$/, "") ), zone)
	} else {
	  zdt = java.time.ZonedDateTime.now(zone)
	}
  
	var instPrev = zone.getRules().previousTransition(zdt.toInstant())
	var instNext = zone.getRules().nextTransition(zdt.toInstant())
  
	if (!isNull(instPrev)) {
		info.previousTransition = {}
		info.previousTransition.previousDate = String(instPrev.getDateTimeBefore().toLocalDate())
		info.previousTransition.previousTime = String(instPrev.getDateTimeBefore().toLocalTime())
		info.previousTransition.afterDate = String(instPrev.getDateTimeAfter().toLocalDate())
		info.previousTransition.afterTime = String(instPrev.getDateTimeAfter().toLocalTime())
		info.previousTransition.isGap = Boolean(instPrev.isGap())
		info.previousTransition.isOverlap = Boolean(instPrev.isOverlap())
		info.previousTransition.duration = Number(instPrev.getDuration().toMillis())
		info.previousTransition.epoch = Number(instPrev.getInstant().toEpochMilli())
		info.previousTransition.date = new Date(instPrev.getInstant().toEpochMilli())
	}
  
	if (!isNull(instNext)) {
		info.nextTransition = {}
		info.nextTransition.previousDate = String(instNext.getDateTimeBefore().toLocalDate())
		info.nextTransition.previousTime = String(instNext.getDateTimeBefore().toLocalTime())
		info.nextTransition.afterDate = String(instNext.getDateTimeAfter().toLocalDate())
		info.nextTransition.afterTime = String(instNext.getDateTimeAfter().toLocalTime())
		info.nextTransition.isGap = Boolean(instNext.isGap())
		info.nextTransition.isOverlap = Boolean(instNext.isOverlap())
		info.nextTransition.duration = Number(instNext.getDuration().toMillis())
		info.nextTransition.epoch = Number(instNext.getInstant().toEpochMilli())
		info.nextTransition.date = new Date(instNext.getInstant().toEpochMilli())
	}
  
	return info
}

OpenWrap.format.prototype.dateDiff = {
    /**
     * <odoc>
     * <key>ow.format.dateDiff.inSeconds(dateBefore, dateAfter, shouldRound) : Number</key>
     * Difference between dateAfter and dateBefore in seconds. If shouldRound = true will round from the previous time unit.
     * </odoc>
     */
    inSeconds: function(d1, d2, shouldRound) {
	  if (isString(d1) && new Date(d1) != null) d1 = new Date(d1);
      if (isUnDef(d2)) d2 = new Date();
      var t2 = d2.getTime();
      var t1 = d1.getTime();

      return (shouldRound ? ((t2-t1)/(1000)).toFixed(0) : parseInt((t2-t1)/(1000)) ); 
    },

    /**
     * <odoc>
     * <key>ow.format.dateDiff.inMinutes(dateBefore, dateAfter, shouldRound) : Number</key>
     * Difference between dateAfter and dateBefore in minutes. If shouldRound = true will round from the previous time unit.
     * </odoc>
     */
    inMinutes: function(d1, d2, shouldRound) {
	  if (isString(d1) && new Date(d1) != null) d1 = new Date(d1);
      if (isUnDef(d2)) d2 = new Date();
      var t2 = d2.getTime();
      var t1 = d1.getTime();

      return (shouldRound ? ((t2-t1)/(1000*60)).toFixed(0) : parseInt((t2-t1)/(1000*60)) );
    },

    /**
     * <odoc>
     * <key>ow.format.dateDiff.inHours(dateBefore, dateAfter, shouldRound) : Number</key>
     * Difference between dateAfter and dateBefore in hours.  If shouldRound = true will round from the previous time unit.
     * </odoc>
     */
    inHours: function(d1, d2, shouldRound) {
	  if (isString(d1) && new Date(d1) != null) d1 = new Date(d1);
      if (isUnDef(d2)) d2 = new Date(); 
      var t2 = d2.getTime();
      var t1 = d1.getTime();

      return (shouldRound ? ((t2-t1)/(1000*3600)).toFixed(0) : parseInt((t2-t1)/(1000*3600)) );
    },

    /**
     * <odoc>
     * <key>ow.format.dateDiff.inDays(dateBefore, dateAfter, shouldRound) : Number</key>
     * Difference between dateAfter and dateBefore in days. If shouldRound = true will round from the previous time unit.
     * </odoc>
     */
    inDays: function(d1, d2, shouldRound) {
		if (isString(d1) && new Date(d1) != null) d1 = new Date(d1);
    	if (isUnDef(d2)) d2 = new Date();
    	var t2 = d2.getTime();
        var t1 = d1.getTime();

        return (shouldRound ? ((t2-t1)/(24*3600*1000)).toFixed(0) : parseInt((t2-t1)/(24*3600*1000)) );
    },

    /**
     * <odoc>
     * <key>ow.format.dateDiff.inWeeks(dateBefore, dateAfter, shouldRound) : Number</key>
     * Difference between dateAfter and dateBefore in weeks. If shouldRound = true will round from the previous time unit.
     * </odoc>
     */
    inWeeks: function(d1, d2, shouldRound) {
		if (isString(d1) && new Date(d1) != null) d1 = new Date(d1);
    	if (isUnDef(d2)) d2 = new Date();
    	var t2 = d2.getTime();
        var t1 = d1.getTime();

        return (shouldRound ? ((t2-t1)/(24*3600*1000*7)).toFixed(0) : parseInt((t2-t1)/(24*3600*1000*7)) );
    },

    /**
     * <odoc>
     * <key>ow.format.dateDiff.inMonths(dateBefore, dateAfter) : Number</key>
     * Difference between dateAfter and dateBefore in months.
     * </odoc>
     */
    inMonths: function(d1, d2) {
		if (isString(d1) && new Date(d1) != null) d1 = new Date(d1);
    	if (isUnDef(d2)) d2 = new Date();
        var d1Y = d1.getFullYear();
        var d2Y = d2.getFullYear();
        var d1M = d1.getMonth();
        var d2M = d2.getMonth();

        return (d2M+12*d2Y)-(d1M+12*d1Y);
    },

    /**
     * <odoc>
     * <key>ow.format.dateDiff.inYears(dateBefore, dateAfter) : Number</key>
     * Difference between dateAfter and dateBefore in years.
     * </odoc>
     */
    inYears: function(d1, d2) {
		if (isString(d1) && new Date(d1) != null) d1 = new Date(d1);
    	if (isUnDef(d2)) d2 = new Date();
        return d2.getFullYear()-d1.getFullYear();
    }
}

/**
 * <odoc>
 * <key>ow.format.sqlFormat(aSQL, aMap) : String</key>
 * Will format aSQL using the sql-formatter library. Optionally you can provide aMap with the following options:\
 * \
 *   - indent: the indentation string (defaults to "  ")\
 *   - uppercase: if true will uppercase the SQL (defaults to false)\
 *   - linesBetweenQueries: number of lines between queries (defaults to 1)\
 *   - maxColumnLength: maximum column length (defaults to 50)\
 *   - skipWhitespaceNearBlockParentheses: if true will whitespace near block parentheses (defaults to false)\
 *   - language: the SQL language dialect (defaults to "StandardSql")\
 * \
 * The language can be one of the following:\
 * \
 *   - Db2\
 *   - MariaDb\
 *   - MySql\
 *   - N1ql\
 *   - PlSql\
 *   - PostgreSql\
 *   - Redshift\
 *   - SparkSql\
 *   - StandardSql\
 *   - TSql\
 * \
 * </odoc>
 */
OpenWrap.format.prototype.sqlFormat = function(aSQL, aMap) {
	_$(aSQL, "aSQL").isString().$_()
	aMap = _$(aMap, "aMap").isMap().default({})

	var fc = Packages.com.github.vertical_blank.sqlformatter.core.FormatConfig.builder()
	if (isString(aMap.indent))                              fc = fc.indent(aMap.indent)
	if (isBoolean(aMap.uppercase))                          fc = fc.uppercase(aMap.uppercase)
	if (isNumber(aMap.linesBetweenQueries))                 fc = fc.linesBetweenQueries(aMap.linesBetweenQueries)
	if (isNumber(aMap.maxColumnLength))                     fc = fc.maxColumnLength(aMap.maxColumnLength)
	if (isBoolean(aMap.skipWhitespaceNearBlockParentheses)) fc = fc.skipWhitespaceNearBlockParentheses(aMap.skipWhitespaceNearBlockParentheses)

	if (isString(aMap.language)) {
		return String( Packages.com.github.vertical_blank.sqlformatter.SqlFormatter.of(com.github.vertical_blank.sqlformatter.languages.Dialect[aMap.language]).format(aSQL, fc.build()) )
	} else {
		return String( Packages.com.github.vertical_blank.sqlformatter.SqlFormatter.format(aSQL, fc.build()) )
	}
}

/**
 * <odoc>
 * <key>ow.format.elapsedTime4ms(aMs, aFormat) : String</key>
 * Given aMs (milleseconds) will convert into a string with the corresponding human-readable time and date components
 * up to years. This is usually helpful when comparing dates (see also ow.format.elapsedTime). You can control the output
 * format by adding options to aFormat:\
 * \
 * Example:\
 * \
 * aFormat = {\
 *    full : false, // when true outputs everything even if it's 0 value\
 *    abrev: false, // when true outputs smaller "1h2m3s" instead of "1 hour, 2 minutes and 3 seconds"\
 *    pad  : false, // when true pads values with 0 on the left\
 *    colon: false, // when true outputs just values separated by ":"\
 *    sep  : ", ",  // customizes the values separator, defaults to ", " or "" (in case of abrev = true)\
 *    maxLeft : 7,  // the maximum number of time units to show counting from the left\
 *    maxRight: 7   // the maximum number of time units to show counting from the right\
 * }
 * </odoc>
 */
OpenWrap.format.prototype.elapsedTime4ms = function(aMs, aFormat) {
	if (aMs == 0) return "~0 ms"
	if (aMs < 1) return ">1 ms"

    var ms = Math.abs(aMs);

    var msSecond = 1000,
        msMinute = msSecond * 60,
        msHour = msMinute * 60,
        msDay = msHour * 24,
        msMonth = msDay * 30,
        msYear = msDay * 365;

    var parts = {
        year  : Math.floor(ms / msYear),
        month : Math.floor((ms % msYear) / msMonth),
        day   : Math.floor((ms % msMonth) / msDay),
        hour  : Math.floor((ms % msDay) / msHour),
        minute: Math.floor((ms % msHour) / msMinute),
        second: Math.floor((ms % msMinute) / msSecond),
        ms    : Math.floor((ms % msSecond))
    }

    if (isUnDef(aFormat)) aFormat = {}

    var chunks = [], chunksCount = 0;
    if (isUnDef(aFormat.maxLeft))  aFormat.maxLeft =  7;
    if (isUnDef(aFormat.maxRight)) aFormat.maxRight = 7;
    if (aFormat.colon && isUnDef(aFormat.sep)) aFormat.sep = ":";
    if (isUnDef(aFormat.sep)) aFormat.sep = (aFormat.abrev) ? "" : ", ";

    for(let part in parts) {
        var val  = parts[part];
        var name = ((aFormat.abrev) ? ((part == 'month') ? 'M' : ((part == 'ms') ? part : part.substring(0, 1))) : part + ((val == 1) ? "" : ((part == "ms") ?  "" : "s")));
        if ((aFormat.full || val > 0) && aFormat.maxLeft > chunksCount && (6 - chunksCount) <= aFormat.maxRight) {
            if (aFormat.pad) {
                val = String(val);
                switch(part) {
                case 'month' : val = ow.format.string.leftPad(val, 2, "0"); break;
                case 'day'   : val = ow.format.string.leftPad(val, 2, "0"); break;
                case 'hour'  : val = ow.format.string.leftPad(val, 2, "0"); break;
                case 'minute': val = ow.format.string.leftPad(val, 2, "0"); break;
                case 'second': val = ow.format.string.leftPad(val, 2, "0"); break;
                case 'ms'    : val = ow.format.string.leftPad(val, 3, "0"); break;
                }
            }
            if (!aFormat.colon) 
                chunks.push(val + (aFormat.abrev ? "" : " ") + name);
            else
                chunks.push(val);
        }
        chunksCount++;
    }

	return chunks.join(aFormat.sep);
};

/**
 * <odoc>
 * <key>ow.format.sshProgress(aFn) : Object</key>
 * Returns a SSH Java progress monitor callback object to be use with the SSH plugin functions.
 * Expects callback aFn that will be called with state (e.g. begin, count, end) and an Info map.
 * The Info map is composed of:
 *    source - the reported source of the transfer\
 *    target - the reported target of the transfer\
 *    op     - the operation being performed (get or put)\
 *    start  - reported unix epoch when the transfer started\
 *    end    - reported unix epoch when the transfer stopped\
 *    count  - the last reported byte count\
 *    speed  - the calculated speed of transfer\
 * \
 * If the returned value is false the transfer will be cancelled.
 * </odoc>
 */
OpenWrap.format.prototype.sshProgress = function(aFn) {
	_$(aFn).isFunction().$_();
    var info = {};

    return new Packages.com.jcraft.jsch.SftpProgressMonitor({ 
        count: function(c) {
            info.count = c;
            info.speed = (c * 1000) / (now() - info.start);
            return aFn("count", info);
        }, 
        end  : function() { 
            info.end = now();
            aFn("end", info);
        }, 
        init : function(op, src, dest, max) {
            info.source   = src;
            info.target   = dest;
            info.maxBytes = max;
            info.op       = (op == 1) ? "get" : "put";
            info.start    = now();
            aFn("begin", info);
        }
    });
}

/**
 * <odoc>
 * <key>ow.format.progressReport(aMainFunc, aProgressFunc, aTimeout)</key>
 * Executes aMainFunc to execute some synchronous function while aProgressFunc is called asynchronously to 
 * keep track of progress. You can also provide an alternative aTimeout between aProgressFunc calls (defaults to 150ms).
 * </odoc>
 */
OpenWrap.format.prototype.progressReport = function(aMainFunc, aProgressFunc, timeout) {
	var stop = false;
	timeout = _$(timeout).isNumber().default(150);

	try {
		var p = $do(() => {
			while(!stop) {
				try {
					aProgressFunc();
					sleep(timeout);
				} catch(e) {}
			}
		});
		aMainFunc();
	} catch(e) {
		throw e;
	} finally {
		stop = true; $doWait(p);
	}
};

/**
 * <odoc>
 * <key>ow.format.printWithWaiting(aMainFunc, aPrefixMsg, aCompleteMsg, aErrorMsg, aWaitSpeed, aTheme, printNLFn, useAsSuffix)</key>
 * Executes aMainFunc while priting aPrefixMsg with a waiting aTheme (defaults to a sequence of chars with a rotating bar).
 * When aMainFunc ends it will replace the priting with aCompleteMsg or aErrorMsg in case an exception is thrown.
 * Optionally you can provide a different aWaitSpeed while cycling between the aTheme sequence of chars increasing/decreasing
 * the "animation" effect.
 * </odoc>
 */
OpenWrap.format.prototype.printWithWaiting = function(aMainFunc, aPrefixMsg, aCompleteMsg, aErrorMsg, aWaitSpeed, aTheme, pnlfn, useAsSuffix) {
	_$(aMainFunc, "Main function").isFunction().$_();

	aWaitSpeed   = _$(aWaitSpeed, "aWaitSpeed").isNumber().default(150);
	aPrefixMsg   = _$(aPrefixMsg, "aPrefixMsg").isString().default("");
	aCompleteMsg = _$(aCompleteMsg, "aCompleteMsg").isString().default(" ");
	aErrorMsg    = _$(aErrorMsg, "aErrorMsg").isString().default("!");
	aTheme       = _$(aTheme, "aTheme").isString().default("-\\|/");
	pnlfn        = _$(pnlfn).default(printnl);
	useAsSuffix  = _$(useAsSuffix).isBoolean().default(false)

	var e, p = $do(() => {
		aMainFunc();
	}).catch((ee) => {
		e = ee;
	});

	$tb(() => {
		var ii = 0;
		while(isUnDef(e) && p.state.get() <= 0) {
			if (ii >= aTheme.length) ii = 0;
			if (useAsSuffix) 
				pnlfn(aTheme[ii] + aPrefixMsg + "\r")
			else
				pnlfn(aPrefixMsg + aTheme[ii] + "\r")
			ii++;
			sleep(aWaitSpeed, true);
		}
	})
	.stopWhen(() => {
		$doWait(p);
		return true;
	})
	.exec();

	if (isDef(e)) {
		var c = (aPrefixMsg.length + 1) - aErrorMsg.length;
		pnlfn(aErrorMsg + repeat((c >= 0 ? c : 0), " ") + "\n");
		throw e;
	} else {
		var c = (aPrefixMsg.length + 1) - aCompleteMsg.length;
		pnlfn(aCompleteMsg + repeat((c >= 0 ? c : 0), " ") + "\n");
		return true;
	}
};

/**
 * <odoc>
 * <key>ow.format.logWithWaiting(aMainFunc, aPrefixMsg, aCompleteMsg, aErrorMsg, aWaitSpeed, aTheme)</key>
 * Executes aMainFunc while log aPrefixMsg with a waiting aTheme (defaults to a sequence of chars with a rotating bar).
 * When aMainFunc ends it will replace the log with aCompleteMsg or aErrorMsg in case an exception is thrown.
 * Optionally you can provide a different aWaitSpeed while cycling between the aTheme sequence of chars increasing/decreasing
 * the "animation" effect.
 * </odoc>
 */
OpenWrap.format.prototype.logWithWaiting = function(aMainFunc, aPrefixMsg, aCompleteMsg, aErrorMsg, aWaitSpeed, aTheme) {
	return ow.format.printWithWaiting(aMainFunc, aPrefixMsg, aCompleteMsg, aErrorMsg, aWaitSpeed, aTheme, lognl);
};

/**
 * <odoc>
 * <key>ow.format.percProgressReport(aMainFunc, aProgressFunc, aTimeout)</key>
 * Percentage progress report help function over a function on aMainFunc calling aProgressFunc in parallel
 * with a percentage function parameter (receiving target and source numbers). You can also provide an alternative
 * aTimeout between aProgressFunc calls (defaults to 150ms).\
 * \
 * Example:\
 * \
 * ow.format.percProgressReport(() => {\
 *    ioStreamCopy(io.writeFileStream("target.file"), io.readFileStream("source.file"));\
 * }, (percFunc) => {\
 * 	  var perc = percFunc(io.fileInfo("target.file").size, io.fileInfo("source.file").size);\
 *    ...\
 * });\
 * \
 * </odoc>
 */
OpenWrap.format.prototype.percProgressReport = function(aMainFunc, aProgressFunc, timeout) {
	this.progressReport(aMainFunc, () => {
		aProgressFunc((t, o) => {
			if (isArray(t) && isArray(o)) {
				var res = [];
				for(var ii in t) {
					res.push(Math.floor((t[ii] * 100) / o[ii]));
				}
				return res;
			} else {
				return Math.floor((t * 100) / o);
			}
		});
	}, timeout);
};

OpenWrap.format.prototype.percProgressBarReport = function(aMainFunc, aProgressFunc, aFinalMessage, timeout) {
	var wo = (isDef(__con)) ? Number(__con.getTerminal().getWidth()) : 80;
	var ws = __logFormat.indent.length + __logFormat.dateFormat.length + __logFormat.separator.length + " INFO ".length + __logFormat.separator.length;
	var w = wo - ws;

	if (isUnDef(__conAnsi)) __initializeCon();
	var ansis = __conAnsi && (java.lang.System.console() != null);
	var jansi = JavaImporter(Packages.org.fusesource.jansi);
	var multiline = 0;

	ow.format.percProgressReport(aMainFunc, (percFunc) => {
		aProgressFunc((t, o, m) => {
			var perc = percFunc(t, o);
			if (isArray(perc)) {
				if (ansis) {
					ansiStart();
					var mmm = "\n";
					for(var ii in perc) {
						if (isDef(perc[ii]) && isNumber(perc[ii])) 
						  mmm += m[ii] + " " + ansiColor(__colorFormat.string, "[" + ow.format.string.progress(perc[ii], 100, 0, wo - 12 - m[ii].length, "=", "-", ">") + "] (" + ow.format.string.leftPad(String(perc[ii]), 3, ' ') + "%)") + "\n";
					}
					mmm += jansi.Ansi.ansi().cursorUp(perc.length + 1);
					if ((perc.length) > multiline) multiline = perc.length;
					lognl(mmm);
					ansiStop();
				} else {
					for(var ii in perc) {
						if (isDef(perc[ii]))
						  log(m[ii] + " (" + ow.format.string.leftPad(String(perc[ii]), 3, ' ') + "%)", { async: false });
					}
				}
			} else {
				if (ansis) {
					ansiStart();
					lognl(m + " " + ansiColor(__colorFormat.string, "[" + ow.format.string.progress(perc, 100, 0, w - 12 - m[ii].length, "=", "-", ">") + "] (" + ow.format.string.leftPad(String(perc), 3, ' ') + "%)") + "\r", { async: false });
					ansiStop();
				} else {
					log(m + " (" + ow.format.string.leftPad(String(perc), 3, ' ') + "%)", { async: false });
				}
			}
		});
	});
	
  if (multiline <= 0) {
		log(aFinalMessage + repeat(w - aFinalMessage.length, ' '), { async: false });
	} else {
		ansiStart();
		print(jansi.Ansi.ansi().cursorUp(1));
		log(aFinalMessage + repeat(w - aFinalMessage.length, ' '), { async: false });

		var mmm = "";
		for(var ii = 0; ii < multiline; ii++) {
			mmm += repeat(wo, ' ') + "";
		}
		print(mmm);
		print(jansi.Ansi.ansi().cursorUp(multiline + 2));
		
		ansiStop();
	}
};

/**
 * <odoc>
 * <key>ow.format.printWithFooter(aMessage, aFooter)</key>
 * Prints aMessage (if defined) with a aTemplate (template compiled function or string).
 * </odoc>
 */
OpenWrap.format.prototype.printWithFooter = function(aMessage, aFooter, withFunc) {
	ansiStart();

	var jansi = JavaImporter(Packages.org.fusesource.jansi);
	aFooter = _$(aFooter).isString().default("");

	ow.loadFormat();
 
	var isWin = ow.format.isWindows();

	var o = (isWin) ? 1 : 0;
	if (isDef(aMessage)) {
		if (isUnDef(withFunc)) 
			if (__conAnsi && (java.lang.System.console() != null)) print(jansi.Ansi.ansi().eraseLine() + aMessage); else print(aMessage);
		else
			if (__conAnsi && (java.lang.System.console() != null)) withFunc(jansi.Ansi.ansi().eraseLine() + aMessage); else withFunc(aMessage);
		if (!isWin) o++;
	}
	if (__conAnsi && (java.lang.System.console() != null)) print(aFooter + jansi.Ansi.ansi().cursorUp(o));

	ansiStop();
};

/**
 * <odoc>
 * <key>ow.format.logWithFooter(aMessage, aFooter)</key>
 * Equivalent to ow.format.printWithFooter (see help ow.format.printWithFooter) using the log function.
 * </odoc>
 */
OpenWrap.format.prototype.logWithFooter = function(aMessage, aFooter) {
	var slog = (l) => { log(l, { async: false }) };
	this.printWithFooter(aMessage, aFooter, slog);
};

/**
 * <odoc>
 * <key>ow.format.logErrWithFooter(aMessage, aFooter)</key>
 * Equivalent to ow.format.printWithFooter (see help ow.format.printWithFooter) using the logErr function.
 * </odoc>
 */
OpenWrap.format.prototype.logErrWithFooter = function(aMessage, aFooter) {
	var slog = (l) => { logErr(l, { async: false })};
	this.printWithFooter(aMessage, aFooter, slog);
};

/**
 * <odoc>
 * <key>ow.format.logWarnWithFooter(aMessage, aFooter)</key>
 * Equivalent to ow.format.printWithFooter (see help ow.format.printWithFooter) using the logWarn function.
 * </odoc>
 */
OpenWrap.format.prototype.logWarnWithFooter = function(aMessage, aFooter) {
	var slog = (l) => { logWarn(l, { async: false })};
	this.printWithFooter(aMessage, aFooter, slog);
};

/**
 * <odoc>
 * <key>ow.format.printWithProgressFooter(aMessage, aTemplate, aPerc, aSize, aUnixBlock, aWindowsBlock, aSpace)</key>
 * Prints aMessage (if defined) with a aTemplate (template compiled function or string) as a footer for percentage 
 * progress information with the percentage value aPerc, for a given optional aSize (defaults to 50), an optional 
 * aUnixBlock or aWindowsBlock (depending on the current operating system) and aSpace. Example:\
 * \
 *    ow.loadTemplate();\
 *    var fn = ow.template.execCompiled(ow.template.compile("({{percFormat}}%) progress: |{{progress}}|"));\
 *    ow.format.printWithProgressFooter("processing xyz...", fn, aPerc);\
 *    ow.format.printWithFooter("Done.", "");\
 * 
 * </odoc>
 */
OpenWrap.format.prototype.printWithProgressFooter = function(aMessage, aTemplate, aPerc, aSize, aUnixBlock, aWindowsBlock, aSpace, withFunc) {
	ow.loadFormat(); ow.loadTemplate();

	aSize         = _$(aSize).isNumber().default(50);
	//aUnixBlock    = _$(aUnixBlock).isString().default(String.fromCharCode(9608));
	//aWindowsBlock = _$(aWindowsBlock).isString().default(String.fromCharCode(219));
	aUnixBlock    = _$(aUnixBlock).isString().default("/");
	aWindowsBlock = _$(aWindowsBlock).isString().default("/");
	aSpace        = _$(aSpace).isString().default("-");
	aPerc         = _$(aPerc).isNumber().default(0);
	
	if (isUnDef(aTemplate)) aTemplate = "{{percFormat}}% " + ansiColor("BOLD,BLACK", "{{{progress}}}");

	var isWin = ow.format.isWindows(), aBlock;
	if (isWin) aBlock = aWindowsBlock; else aBlock = aUnixBlock;

	if (isString(aTemplate)) aTemplate = ow.template.execCompiled(ow.template.compile(aTemplate));
	var data = {
		percentage: aPerc,
		percFormat: ow.format.string.leftPad(String(aPerc), 3, ' '),
		progress  : ow.format.string.progress(aPerc, 100, 0, aSize, aBlock, aSpace)
	};

	if (isDef(withFunc))
		withFunc(aMessage, aTemplate(data));
	else
		ow.format.printWithFooter(aMessage, aTemplate(data));
};

/**
 * <odoc>
 * <key>ow.format.logWithProgressFooter(aMessage, aTemplate, aPerc, aSize, aUnixBlock, aWindowsBlock, aSpace)</key>
 * Equivalent to ow.format.printWithProgressFooter (see help ow.format.printWithProgressFooter) using the log function.
 * </odoc>
 */
OpenWrap.format.prototype.logWithProgressFooter = function(aMessage, aTemplate, aPerc, aSize, aUnixBlock, aWindowsBlock, aSpace) {
	var slog = (m, f) => { this.logWithFooter(m, f); };
	this.printWithProgressFooter(aMessage, aTemplate, aPerc, aSize, aUnixBlock, aWindowsBlock, aSpace, slog);
};

/**
 * <odoc>
 * <key>ow.format.logErrWithProgressFooter(aMessage, aTemplate, aPerc, aSize, aUnixBlock, aWindowsBlock, aSpace)</key>
 * Equivalent to ow.format.printWithProgressFooter (see help ow.format.printWithProgressFooter) using the logErr function.
 * </odoc>
 */
OpenWrap.format.prototype.logErrWithProgressFooter = function(aMessage, aTemplate, aPerc, aSize, aUnixBlock, aWindowsBlock, aSpace) {
	var slog = (m, f) => { this.logErrWithFooter(m, f); };
	this.printWithProgressFooter(aMessage, aTemplate, aPerc, aSize, aUnixBlock, aWindowsBlock, aSpace, slog);
};

/**
 * <odoc>
 * <key>ow.format.logWarnWithProgressFooter(aMessage, aTemplate, aPerc, aSize, aUnixBlock, aWindowsBlock, aSpace)</key>
 * Equivalent to ow.format.printWithProgressFooter (see help ow.format.printWithProgressFooter) using the logWarn function.
 * </odoc>
 */
OpenWrap.format.prototype.logWarnWithProgressFooter = function(aMessage, aTemplate, aPerc, aSize, aUnixBlock, aWindowsBlock, aSpace) {
	var slog = (m, f) => { this.logWarnWithFooter(m, f); };
	this.printWithProgressFooter(aMessage, aTemplate, aPerc, aSize, aUnixBlock, aWindowsBlock, aSpace, slog);
};

/**
 * <odoc>
 * <key>ow.format.withMD(aString, defaultAnsi) : String</key>
 * Use aString with simple markdown and convert it to ANSI. Optionally you can add a defaultAnsi string to return back 
 * after applying the ansi styles for markdown (use ansiColor function to provide the defaultAnsi).
 * Currently supports only: bold, italic, tables, simple code blocks, line rule, bullets, numbered lines, links and blocks.
 * </odoc>
 */
OpenWrap.format.prototype.withMD = function(aString, defaultAnsi) {
    aString = String(aString)
    defaultAnsi = _$(defaultAnsi, "defaultAnsi").isString().default("")
	var res = aString, da = (defaultAnsi.length > 0 ? ansiColor(defaultAnsi, "") : "")

	// Theme set
	__colorFormat.md = merge({
		codeBlock: {
			line: "YELLOW,BOLD",
			text: "NEGATIVE_ON,ITALIC",
			theme: "openCurvedSpace"
		},
		heads: {
			h1: "WHITE,BOLD,UNDERLINE",
			h2: "BOLD,UNDERLINE",
			h3: "BOLD",
			h4: "UNDERLINE"
		},
		line: "FAINT",
		link: {
			text: "UNDERLINE",
			url: "FAINT"
		},
		bullets: "BOLD",
		list: "BOLD",
		note: {
			line: "FAINT",
			text: __,
			theme: "simpleLine"
		}
	}, __colorFormat.md)

	// pre process code blocks

	// remove html
	// TODO: .replace(/<\/?(code|pre>)[^>]*>/g, "```"). ?
	if (__flags.WITHMD.htmlFilter) 
		res = res.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script\s*>/gi, "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ")

	//  single line
	res = res.replace(/```+(.+?)```+/mg, ansiColor(__colorFormat.md.codeBlock.text, " $1 "))

	//  multi line
	var cblocks = res.match(/```+\w*( +|\n)((.|\n)+?)( +|\n)```+/mg)
	if (cblocks != null) 
		cblocks.forEach((b, i) => {
			res = res.replace(b, "```$$" + i + "```")
		})

    res = javaRegExp(res).replaceAll("(?<!\\\\)<!--(.|\n)*?--(?<!\\\\)>", "")
    res = javaRegExp(res).replaceAll("(?<=[^\\W_*\\\\])([*_])+(?=[^\\W_*\\\\])", "\\\\$1")
	res = javaRegExp(res).replaceAll("(?<!\\\\)(\\*{3})([^ \\*][^\\*\n]*)(?<!\\\\)(\\*{3})", ansiColor("BOLD,ITALIC", "$2")+da)
	res = javaRegExp(res).replaceAll("(?<!\\\\)(_{3})(^ _][ _\n]*)(?<!\\\\)(_{3})", ansiColor("BOLD,ITALIC", "$2")+da)
	res = javaRegExp(res).replaceAll("(?<!\\\\)(\\*{2})([^ \\*][^\\*\n]*)(?<!\\\\)(\\*{2})", ansiColor("BOLD", "$2")+da)
	res = javaRegExp(res).replaceAll("(?<!\\\\)(_{2})([^ _][^_\n]*)(?<!\\\\)(_{2})", ansiColor("BOLD", "$2")+da)
	res = javaRegExp(res).replaceAll("(?<!\\\\)(\\*)([^ \\*][^\\*\n]*)(?<!\\\\)(\\*)", ansiColor("ITALIC", "$2")+da)
	res = javaRegExp(res).replaceAll("(?<!\\\\)(_)([^ _][^_\n]*)(?<!\\\\)(_)", ansiColor("ITALIC", "$2")+da)

    // escape
    res = res.replace(/\\([_\*])/g, "$1")

	res = res.replace(/^# (.+)/mg, ansiColor(__colorFormat.md.heads.h1, "$1") + da)
	res = res.replace(/^## (.+)/mg, ansiColor(__colorFormat.md.heads.h2, "$1") + da)
	res = res.replace(/^### (.+)/mg, ansiColor(__colorFormat.md.heads.h3, "$1") + da)
	res = res.replace(/^####+ (.+)/mg, ansiColor(__colorFormat.md.heads.h4, "$1") + da)
	
	__conStatus || __initializeCon()
	var _aSize

	if (isDef(__con)) {
		_aSize = __con.getTerminal().getWidth()
	} else {
		_aSize = 80
	}

	// Single line transformers
	res = res.split("\n").map(l => {
		// line rule
		if (l.trim().match(/^---+/)) {
			return repeat(_aSize, ansiColor(__colorFormat.md.line, (isDef(__con) ?  "─" : "-")))
		}

        // Links
		if (/\[[^\]\[]+\]\([^\)\()]+\)/.test(l)) {
			l = l.replace(/\[([^\]\[]+)\]\(([^\)\(]+)\)/ig, ansiColor(__colorFormat.md.link.text, "$1") + " " + ansiColor(__colorFormat.md.link.url,"($2)"))
		}

		// bullets
		var ar = l.match(/^(\s*)\*(\s+)(.+)$/)
		if (ar) {
			var lsize = ar[1].length + 1 + ar[2].length

			return ow.format.string.wordWrap(ar[3], __con.getTerminal().getWidth() - lsize).split("\n").map((l, i) => {
				return (i == 0 ? ar[1] + ansiColor(__colorFormat.md.bullets, "\u2022") + ar[2] : repeat(lsize, ' ')) + l
			}).join("\n")
		}

		// numbered list
		var ar = l.match(/^(\s*)(\d+)\.(\s+)(.+)$/)
		if (ar) {
			var lsize = ar[1].length + ar[2].length + 1 + ar[3].length

			return ow.format.string.wordWrap(ar[4], __con.getTerminal().getWidth() - lsize).split("\n").map((l, i) => {
				return (i == 0 ? ar[1] + ansiColor(__colorFormat.md.list, ar[2] + ".") + ar[3] : repeat(lsize, ' ')) + l
			}).join("\n")
		}

		// side line render
		if (/^(\> .+)$/.test(l)) {
			return ow.format.withSideLine(l.replace(/^\> (.+)$/, ow.format.withSideLine("$1", __, __colorFormat.md.note.line, __colorFormat.md.note.text, ow.format.withSideLineThemes()[__colorFormat.md.note.theme])))
		} 

		// if not a code block or a table then it should be paragraph
		if (!/^\|.+\|$/.test(l.trim()) && !/^```/.test(l.trim()) && l.trim().length > 0) {
			if (l.length > _aSize) l = ow.format.string.wordWrap(l, _aSize)
		}

		return l
	}).join("\n")

	// Multi line transformers
	// code block
	if (res.indexOf("```") >= 0 && isArray(cblocks) && cblocks.length > 0) {
		cblocks.forEach((b, i) => {
			res = res.replace("```$" + i + "```", ow.format.withSideLine(b.replace(/```+\w*( +|\n)((.|\n)+?)( +|\n)```+/mg, "$2").replace(/\\n/g, "\\\\n"), __, __colorFormat.md.codeBlock.line, __colorFormat.md.codeBlock.text, ow.format.withSideLineThemes()[__colorFormat.md.codeBlock.theme]))
		})
	}

	// table render
	if (res.indexOf("|") >= 0) {
		var isTab = false, fields = [], data = [], sepProc = false, insep = false
		res = res.split("\n").map(l => {
			var _lorig = l
			l = l.trim()
			if ((/^(\|[^\|]+)+\|$/).test(l)) {
				if (isTab) {
					if ((/^(\|[-: ]+)+\|$/).test(l)) {
						// Separator
						if (!sepProc) {
							sepProc = true
						} else {
							insep = true
						}
						return null
					} else {
						if (l.indexOf("|") == 0) {
							var m = {}
							l.split("|").forEach((s, i) => {
								if (i == 0) return
		
								if (isDef(fields[i-1])) {
									m[fields[i-1]] = s.trim()
								}
							})
							data.push(m)
						} 
					}
				} else {
					if (fields.length == 0) {
						fields = l.split("|").filter(s => s.length > 0).map(r => r.trim())
						isTab = true
						return null
					}
				}
			} else {
				if (isTab) {
					isTab = false
					var cdata = clone(data)
					data = [], ssizes = {}

					var _insep = insep
					insep = false
					sepProc = false
					fields = []
					return printTable(cdata, _aSize, __, __, __, __, true, _insep)
				} else {
					return _lorig
				}
			}
		}).filter(isString).join("\n")
	}

	return res
}

OpenWrap.format.prototype.withSideLineThemes = function() {
	var _s = ow.format.syms()
	return merge(__flags.sideLineCustomThemes, {
		closedOneSpace: {
			ltop   : " ",
			lbottom: " ",
			tmiddle: " ",
			bmiddle: " ",
			lmiddle: " ",
			rmiddle: " ",
			rtop   : " ",
			rbottom: " "
		},
		simpleOneSpace: {
			lmiddle: " "
		},
		simpleLine: {
			lmiddle: _s.lineV
		},
		doubleOneSpace: {
			lmiddle: " ",
			rmiddle: " "
		},
		doubleLine: {
			lmiddle: _s.lineV,
			rmiddle: _s.lineV
		},
		simpleLineWithTips: {
			ltop   : _s.lineVBottom,
			lmiddle: _s.lineV,
			lbottom: _s.lineVTop
		},
		simpleLineWithBottomTip: {
			lmiddle: _s.lineV,
			lbottom: _s.lineVTop
		},
		simpleLineWithTopTip: {
			ltop   : _s.lineVBottom,
			lmiddle: _s.lineV
		},
		simpleLineWithCTips: {
			ltop   : _s.curveBRight,
			lmiddle: _s.lineV,
			lbottom: _s.curveTRight
		},
		simpleLineWithCBottomTip: {
			lmiddle: _s.lineV,
			lbottom: _s.curveTRight
		},
		simpleLineWithCTopTip: {
			ltop   : _s.curveBRight,
			lmiddle: _s.lineV
		},
		simpleLineWithRTips: {
			ltop   : _s.lineBRight,
			lmiddle: _s.lineV,
			lbottom: _s.lineTRight
		},
		simpleLineWithRTopTip: {
			ltop   : _s.lineBRight,
			lmiddle: _s.lineV
		},
		simpleLineWithRBottomTip: {
			lmiddle: _s.lineV,
			lbottom: _s.lineTRight
		},
		doubleLineWithRTips: {
			ltop   : _s.turnBRight,
			lmiddle: _s.dlineV,
			lbottom: _s.turnTRight,
			rtop   : _s.turnBLeft,
			rmiddle: _s.dlineV,
			rbottom: _s.turnTLeft
		},
		doubleLineBothSides: {
			lmiddle: _s.dlineV,
			rmiddle: _s.dlineV
		},
		closedRect: {
			ltop   : _s.lineBRight,
			lbottom: _s.lineTRight,
			tmiddle: _s.lineH,
			bmiddle: _s.lineH,
			lmiddle: _s.lineV,
			rmiddle: _s.lineV,
			rtop   : _s.lineBLeft,
			rbottom: _s.lineTLeft
		},
		closedDoubleRect: {
			ltop   : _s.turnBRight,
			lbottom: _s.turnTRight,
			tmiddle: _s.dlineH,
			bmiddle: _s.dlineH,
			lmiddle: _s.dlineV,
			rmiddle: _s.dlineV,
			rtop   : _s.turnBLeft,
			rbottom: _s.turnTLeft
		},
		closedCurvedRect: {
			ltop   : _s.curveBRight,
			lbottom: _s.curveTRight,
			tmiddle: _s.lineH,
			bmiddle: _s.lineH,
			lmiddle: _s.lineV,
			rmiddle: _s.lineV,
			rtop   : _s.curveBLeft,
			rbottom: _s.curveTLeft
		},
		openTopRect: {
			lbottom: _s.lineTRight,
			bmiddle: _s.lineH,
			lmiddle: _s.lineV,
			rmiddle: _s.lineV,
			rbottom: _s.lineTLeft
		},
		openBottomRect: {
			ltop   : _s.lineBRight,
			tmiddle: _s.lineH,
			lmiddle: _s.lineV,
			rmiddle: _s.lineV,
			rtop   : _s.lineBLeft
		},
		openRect: {
			ltop   : _s.lineBRight,
			lmiddle: _s.lineV,
			rmiddle: _s.lineV,
			rtop   : _s.lineBLeft,
			lbottom: _s.lineTRight,
			rbottom: _s.lineTLeft
		},
		openTopCurvedRect: {
			lmiddle: _s.lineV,
			lbottom: _s.curveTRight,
			bmiddle: _s.lineH,
			rmiddle: _s.lineV,
			rbottom: _s.curveTLeft
		},
		openBottomCurvedRect: {
			ltop   : _s.curveBRight,
			lmiddle: _s.lineV,
			tmiddle: _s.lineH,
			rtop   : _s.curveBLeft,
			rmiddle: _s.lineV
		},
		openCurvedRect: {
			ltop   : _s.curveBRight,
			lmiddle: _s.lineV,
			rtop   : _s.curveBLeft,
			rmiddle: _s.lineV,
 			lbottom: _s.curveTRight,
 			rbottom: _s.curveTLeft
		},
		openCurvedSpace: {
			ltop   : _s.curveBRight,
			lmiddle: " ",
			rtop   : _s.curveBLeft,
			rmiddle: " ",
 			lbottom: _s.curveTRight,
 			rbottom: _s.curveTLeft
		},
		blockCurvedSpace: {
			ltop   : _s.curveTLeft,
			lmiddle: " ",
			rtop   : _s.curveTRight,
			rmiddle: " ",
 			lbottom: _s.curveBLeft,
 			rbottom: _s.curveBRight,
			tmiddle: "▄",
			bmiddle: "▀",
		}
	})
}

/**
 * <odoc>
 * <key>ow.format.withSideLine(aString, aSize, ansiLine, ansiText, aTheme, aExtra) : String</key>
 * Generates a ansi escaped line with a "left side line" to display aString which will be word-wrap given 
 * aSize (default to the current console size). Optionally ansi colors for ansiLine and ansiText can be provided (see ansiColor for possible values)
 * and aTheme (using ow.format.withSideLineThemes, for example). For closed rectangle themes aExtra map can include a header, footer, headerAlign (
 * left or right or center) and footerAlign (left or right or center).
 * </odoc>
 */
OpenWrap.format.prototype.withSideLine = function(aString, aSize, ansiLine, ansiText, aTheme, aExtra) {
	var symbols = ow.format.syms();

	aString = _$(aString, "aString").isString().default(__);
	aExtra  = _$(aExtra, "aExtra").isMap().default({})
	var defaultTheme = {
		tab    : "   "
	};
	aTheme = _$(aTheme, "aTheme").isMap().default({ lmiddle: symbols.lineV });
	aTheme = merge(defaultTheme, aTheme);

	aSize = _$(aSize, "aSize").isNumber().default(__);
	ansiLine = _$(ansiLine, "ansiLine").isString().default("RESET");

	var res = ansiColor("RESET", "\r");
 
	if (isUnDef(aSize)) {
		__conStatus || __initializeCon(); 

		if (isDef(__con)) {
			aSize = __con.getTerminal().getWidth();
		} else {
			aSize = 80;
		}
	}
      
    if (isDef(aString)) { 
		aString = aString.replace(/\t/g, aTheme.tab);
		aString = ow.format.string.wordWrap(aString, aSize - 3);
 	}

	if (isDef(aTheme.ltop) || isDef(aTheme.rtop)) {
		res += ansiColor(ansiLine, aTheme.ltop);
		if (isDef(aTheme.rtop)) {
			var sp = (isDef(aTheme.tmiddle) ? aTheme.tmiddle : " ");
			if (isString(aExtra.header) && aExtra.header.length < (aSize - 4)) {
				if (aExtra.headerAlign == "right") {
					res += ansiColor(ansiLine, repeat(aSize - 4 - ansiLength(aExtra.header), sp))
					res += aExtra.header
					res += ansiColor(ansiLine, repeat(2, sp))
				}
				if (aExtra.headerAlign == "center") {
					var _l = aSize - 4 - ansiLength(aExtra.header)
					res += ansiColor(ansiLine, repeat(Math.floor(_l / 2) +1, sp))
					res += aExtra.header
					res += ansiColor(ansiLine, repeat(Math.round(_l / 2) +1, sp))
				}
				if (isUnDef(aExtra.headerAlign) || aExtra.headerAlign == "left") {
					res += ansiColor(ansiLine, repeat(2, sp))
					res += aExtra.header
					res += ansiColor(ansiLine, repeat(aSize - 4 - ansiLength(aExtra.header), sp))
				}
			} else {
				res += ansiColor(ansiLine, repeat(aSize - 2, sp));
			}
			res += ansiColor(ansiLine, aTheme.rtop);
		}
	}

	if (isDef(aString)) {
        if (isDef(aTheme.ltop) || isDef(aTheme.rtop)) res += "\n";
    	var ar = aString.split("\n");
	    ar.forEach((l, li) => {
			if (isDef(aTheme.lmiddle)) res += ansiColor(ansiLine, aTheme.lmiddle) + ansiColor("RESET", "")
			res += (isDef(ansiText) ? ansiColor(ansiText, " " + l) : " " + l);
			if (isDef(aTheme.rmiddle)) {
				var _spl = aSize - ansiLength(l) - 3
				if (_spl < 0) _spl = 0
				var sp = (isDef(ansiText) ? ansiColor(ansiText, repeat(_spl, ' ')) : repeat(_spl, ' '));
				res += (isDef(ansiText) ? ansiColor(ansiText, sp) : sp);
				res += ansiColor("RESET", "") + ansiColor(ansiLine, aTheme.rmiddle);
			}
			if (li < (ar.length - 1)) res += ansiColor("RESET", "\n");
	    });
		res += ansiColor("RESET", "")
	}

    if (isDef(aTheme.lbottom) || isDef(aTheme.rbottom)) {
		if (isDef(aTheme.ltop) || isDef(aTheme.rtop) || isDef(aString)) res += ansiColor("RESET","\n")
                res += ansiColor(ansiLine, aTheme.lbottom);
		if (isDef(aTheme.rbottom)) {
			var sp = (isDef(aTheme.bmiddle) ? aTheme.bmiddle : " ");
			if (isString(aExtra.footer) && aExtra.footer.length < (aSize - 4)) {
				if (aExtra.footerAlign == "right") {
					res += ansiColor(ansiLine, repeat(aSize - 4 - ansiLength(aExtra.footer), sp))
					res += aExtra.footer
					res += ansiColor(ansiLine, repeat(2, sp))
				}
				if (aExtra.footerAlign == "center") {
					var _l = aSize - 4 - ansiLength(aExtra.footer)
					res += ansiColor(ansiLine, repeat(Math.floor(_l / 2) +1, sp))
					res += aExtra.footer
					res += ansiColor(ansiLine, repeat(Math.round(_l / 2) +1, sp))
				}
				if (isUnDef(aExtra.footerAlign) || aExtra.footerAlign == "left") {
					res += ansiColor(ansiLine, repeat(2, sp))
					res += aExtra.footer
					res += ansiColor(ansiLine, repeat(aSize - 4 - ansiLength(aExtra.footer), sp))
				}
			} else {
				res += ansiColor(ansiLine, repeat(aSize - 2, sp))
			}
		}
		res += ansiColor(ansiLine, aTheme.rbottom)
		res += ansiColor("RESET", "");
	}

	return res;
}

/**
 * <odoc>
 * <key>ow.format.elapsedTime(aStartTime, aEndTime, aFormat) : String</key>
 * Shortcut for ow.format.elapsedTime4ms calculating the absolute difference, in ms, between
 * aStartTime and aEndTime.
 * </odoc>
 */
OpenWrap.format.prototype.elapsedTime = function(aStartTime, aEndTime, aFormat) {
    var mi = aEndTime - aStartTime;
    return ow.format.elapsedTime4ms(mi, aFormat);
};


OpenWrap.format.prototype.xls = {
	init: function() {
		var paths = getOPackPaths();

		if (isUnDef(paths["plugin-XLS"])) {
			throw "Please install the plugin-XLS opack 'opack install plugin-XLS'.";
		} else {
			//loadExternalJars(paths["plugin-XLS"]);
		}
	},
	/**
	 * <odoc>
	 * <key>ow.format.xls.getStyle(aXLS, aStyleMap)</key>
	 * Creates a cell styler object, for the aXLS object (XLS plugin object instance), given the provided aStyleMap.
	 * The aStyleMap can have the following keys to define a style:\
	 * \
	 *   - bold (boolean)\
	 *   - italic (boolean)\
	 *   - underline (boolean)\
	 *   - strikeout (boolean)\
	 *   - fontPoints (number)\
	 *   - fontName (string)\
	 *   - fontColor (string)\
	 *   - wrapText (boolean)\
	 *   - shrinkToFit (boolean)\
	 *   - backgroundColor (string)\
	 *   - foregroundColor (string)\
	 *   - borderBottom (string)\
	 *   - borderLeft (string)\
	 *   - borderRight (string)\
	 *   - borderTop (string)\
	 *   - borderBottom (string)\
	 *   - borderLeftColor (string)\
	 *   - borderRightColor (string)\
	 *   - borderTopColor (string)\
	 *   - borderBottomColor (string)\
	 *   - rotation (number)\
	 *   - indention (number)\
	 *   - valign ("top", "bottom", "center", "justify")\
	 *   - align ("center", "centerSelection", "fill", "general", "justify", "left", "right")\
	 * \
	 * Color names:\ 
	 * \
	 * aqua,auto,black,blue,blue_grey,bright_green,brown,coral,cornflower_blue,dark_blue,dark_green,dark_red,dark_teal,
	 * dark_yellow,gold,green,grey25,grey40,grey50,grey80,indigo,lavender,lemon_chiffon,light_blue,light_cornflower_blue,
	 * light_green,light_orange,light_turquoise,light_yellow,lime,maroon,olive_green,orange,orchid,pale_blue,pink,plum,
	 * red,rose,royal_blue,sea_green,sky_blue,tan,teal,turquoise,violet,white,yellow\
	 * \
	 * Border names:\
	 * \
	 * dash_dot,dash_dot_dot,dashed,dotted,double,hair,medium,medium_dash_dot,medium_dash_dot_dot,medium_dashed,none,
	 * slanted_dash_dot,thick,thin\
	 * \
	 * Fill patterns:\
	 * \
	 * solid_foreground\
	 * \
	 * </odoc>
	 */
	getStyle: function(aXLS, aStyleMap) {
		var rcs, rcf;

		if (!isJavaObject(aStyleMap) && !isMap(aStyleMap)) throw "aStyleMap should be a map or a CellStyle object.";
		ow.format.xls.init();

		if (isUnDef(aXLS.__styleCache)) { aXLS.__styleCache = {}; }
		var styleId = stringify(sortMapKeys(aStyleMap), __, "");
		if (isJavaObject(aXLS.__styleCache[styleId])) return aXLS.__styleCache[styleId];

		var fnRCS = () => {
			if (!isJavaObject(rcs)) rcs = aXLS.getCellStyler();
			return rcs;
		};

		var fnRCF = () => {
			if (!isJavaObject(rcf)) rcf = aXLS.getNewFont();
			return rcf;
		};

		if (isDef(aStyleMap.bold)) fnRCF().setBold(aStyleMap.bold);
		if (isDef(aStyleMap.italic)) fnRCF().setItalic(aStyleMap.italic);
		if (isDef(aStyleMap.underline)) fnRCF().setUnderline(aStyleMap.underline);
		if (isDef(aStyleMap.strikeout)) fnRCF().setStrikeout(aStyleMap.strikeout);
		if (isDef(aStyleMap.fontPoints)) fnRCF().setFontHeightInPoints(aStyleMap.fontPoints);
		if (isDef(aStyleMap.fontName)) fnRCF().setFontName(aStyleMap.fontName);
		if (isDef(aStyleMap.fontColor)) fnRCF().setColor(this.getColor(aStyleMap.fontColor, aXLS));

		if (isDef(aStyleMap.wrapText)) fnRCS().setWrapText(aStyleMap.wrapText);
		if (isDef(aStyleMap.shrinkToFit)) fnRCS().setShrinkToFit(aStyleMap.shrinkToFit);
		if (isDef(aStyleMap.backgroundColor)) fnRCS().setFillBackgroundColor(this.getColor(aStyleMap.backgroundColor, aXLS));
		if (isDef(aStyleMap.foregroundColor)) fnRCS().setFillForegroundColor(this.getColor(aStyleMap.foregroundColor, aXLS));
		if (isDef(aStyleMap.borderBottom)) fnRCS().setBorderBottom(this.getBorderStyle(aStyleMap.borderBottom, aXLS));
		if (isDef(aStyleMap.borderLeft)) fnRCS().setBorderLeft(this.getBorderStyle(aStyleMap.borderLeft, aXLS));
		if (isDef(aStyleMap.borderRight)) fnRCS().setBorderRight(this.getBorderStyle(aStyleMap.borderRight, aXLS));
		if (isDef(aStyleMap.borderTop)) fnRCS().setBorderTop(this.getBorderStyle(aStyleMap.borderTop, aXLS));
		if (isDef(aStyleMap.borderBottom)) fnRCS().setBorderBottom(this.getBorderStyle(aStyleMap.borderBottom, aXLS));
		if (isDef(aStyleMap.borderLeftColor)) fnRCS().setLeftBorderColor(this.getColor(aStyleMap.borderLeftColor, aXLS));
		if (isDef(aStyleMap.borderRightColor)) fnRCS().setRightBorderColor(this.getColor(aStyleMap.borderRightColor, aXLS));
		if (isDef(aStyleMap.borderTopColor)) fnRCS().setTopBorderColor(this.getColor(aStyleMap.borderTopColor, aXLS));
		if (isDef(aStyleMap.borderBottomColor)) fnRCS().setBottomBorderColor(this.getColor(aStyleMap.borderBottomColor, aXLS));
		if (isDef(aStyleMap.rotation)) fnRCS().setRotation(aStyleMap.rotation);
		if (isDef(aStyleMap.indention)) fnRCS().setIndention(aStyleMap.indention);

		if (isDef(aStyleMap.valign)) {
			switch(aStyleMap.valign) {
			case "top": fnRCS().setVerticalAlignment(aXLS.getClassVerticalAlignment("TOP")); break;
			case "bottom": fnRCS().setVerticalAlignment(aXLS.getClassVerticalAlignment("BOTTOM")); break;
			case "center": fnRCS().setVerticalAlignment(aXLS.getClassVerticalAlignment("CENTER")); break;
			case "justify": fnRCS().setVerticalAlignment(aXLS.getClassVerticalAlignment("JUSTIFY")); break;
			}
		};
		if (isDef(aStyleMap.align)) {
			switch(aStyleMap.align) {
			case "center": fnRCS().setAlignment(aXLS.getClassHorizontalAlignment("CENTER")); break;
			case "centerSelection": fnRCS().setAlignment(aXLS.getClassHorizontalAlignment("CENTER_SELECTION")); break;
			case "fill": fnRCS().setAlignment(aXLS.getClassHorizontalAlignment("FILL")); break;
			case "general": fnRCS().setAlignment(aXLS.getClassHorizontalAlignment("GENERAL")); break;
			case "justify": fnRCS().setAlignment(aXLS.getClassHorizontalAlignment("JUSTIFY")); break;
			case "left": fnRCS().setAlignment(aXLS.getClassHorizontalAlignment("LEFT")); break;
			case "right": fnRCS().setAlignment(aXLS.getClassHorizontalAlignment("RIGHT")); break;
			}
		};
		if (isJavaObject(rcf)) fnRCS().setFont(rcf);
		if (isDef(aStyleMap.fillPattern)) fnRCS().setFillPattern(aXLS.getEnumFillPatternType(aStyleMap.fillPattern.toUpperCase()));
		
		aXLS.__styleCache[styleId] = fnRCS();
		return fnRCS();
	},
	
	/**
	 * <odoc>
	 * <key>ow.format.xls.autoFilter(aXLS, aXLSSheet, aRange)</key>
	 * Applies a auto filter on the provided aXLS and aXLSSheet object (from XLS.getSheet) to aRange.\
	 * \
	 * Example:\
	 * \
	 *    ow.format.xls.autoFilter(sheet, "A1:D1");\
	 * \
	 * </odoc>
	 */
	autoFilter: function(aXLS, aXLSSheet, aRange) {
		aXLSSheet.setAutoFilter(aXLS.getCellRangeAddress(aRange));
	},
	
	getColor: function(aColorName, aXLS) {
		if (isNumber(aColorName)) return aColorName;
		return aXLS.getIndexedColors(aColorName);
	},
	/*
		ow.format.xls.init();

		var HSSFColor = Packages.org.apache.poi.ss.usermodel.IndexedColors;
		var c;
		switch(aColorName) {
		case "aqua": c = HSSFColor.AQUA; break;
		case "auto": c = HSSFColor.AUTOMATIC; break;
		case "black": c = HSSFColor.BLACK; break;
		case "blue": c = HSSFColor.BLUE; break;
		case "blue_grey": c = HSSFColor.BLUE_GREY; break;
		case "bright_green": c = HSSFColor.BRIGHT_GREEN; break;
		case "brown": c = HSSFColor.BROWN; break;
		case "coral": c = HSSFColor.CORAL; break;
		case "cornflower_blue": c = HSSFColor.CORNFLOWER_BLUE; break;
		case "dark_blue": c = HSSFColor.DARK_BLUE; break;
		case "dark_green": c = HSSFColor.DARK_GREEN; break;
		case "dark_red": c = HSSFColor.DARK_RED; break;
		case "dark_teal": c = HSSFColor.DARK_TEAL; break;
		case "dark_yellow": c = HSSFColor.DARK_YELLOW; break;
		case "gold": c = HSSFColor.GOLD; break;
		case "green": c = HSSFColor.GREEN; break;
		case "grey25": c = HSSFColor.GREY_25_PERCENT; break;
		case "grey40": c = HSSFColor.GREY_40_PERCENT; break;
		case "grey50": c = HSSFColor.GREY_50_PERCENT; break;
		case "grey80": c = HSSFColor.GREY_80_PERCENT; break;
		case "indigo": c = HSSFColor.INDIGO; break;
		case "lavender": c = HSSFColor.LAVENDER; break;
		case "lemon_chiffon": c = HSSFColor.LEMON_CHIFFON; break;
		case "light_blue": c = HSSFColor.LIGHT_BLUE; break;
		case "light_cornflower_blue": c = HSSFColor.LIGHT_CORNFLOWER_BLUE; break;
		case "light_green": c = HSSFColor.LIGHT_GREEN; break;
		case "light_orange": c = HSSFColor.LIGHT_ORANGE; break;
		case "light_turquoise": c = HSSFColor.LIGHT_TURQUOISE; break;
		case "light_yellow": c = HSSFColor.LIGHT_YELLOW; break;
		case "lime": c = HSSFColor.LIME; break;
		case "maroon": c = HSSFColor.MAROON; break;
		case "olive_green": c = HSSFColor.OLIVE_GREEN; break;
		case "orange": c = HSSFColor.ORANGE; break;
		case "orchid": c = HSSFColor.ORCHID; break;
		case "pale_blue": c = HSSFColor.PALE_BLUE; break;
		case "pink": c = HSSFColor.PINK; break;
		case "plum": c = HSSFColor.PLUM; break;
		case "red": c = HSSFColor.RED; break;
		case "rose": c = HSSFColor.ROSE; break;
		case "royal_blue": c = HSSFColor.ROYAL_BLUE; break;
		case "sea_green": c = HSSFColor.SEA_GREEN; break;
		case "sky_blue": c = HSSFColor.SKY_BLUE; break;
		case "tan": c = HSSFColor.TAN; break;
		case "teal": c = HSSFColor.TEAL; break;
		case "turquoise": c = HSSFColor.TURQUOISE; break;
		case "violet": c = HSSFColor.VIOLET; break;
		case "white": c = HSSFColor.WHITE; break;
		case "yellow": c = HSSFColor.YELLOW; break;
		}
		
		if (isDef(c)) return c.getIndex();
	},*/ 
	
	getBorderStyle: function(aBorderStyle, aXLS) {
		return aXLS.getBorderStyle(aBorderStyle);
	},
	/*
		ow.format.xls.init();
		
		var bs = Packages.org.apache.poi.ss.usermodel.BorderStyle;
		switch(aBorderStyle) {
		case "dash_dot": return bs.DASH_DOT; break;
		case "dash_dot_dot": return bs.DASH_DOT_DOT; break;
		case "dashed": return bs.DASHED; break;
		case "dotted": return bs.DOTTED; break;
		case "double": return bs.DOUBLE; break;
		case "hair": return bs.HAIR; break;
		case "medium": return bs.MEDIUM; break;
		case "medium_dash_dot": return bs.MEDIUM_DASH_DOT; break;
		case "medium_dash_dot_dot": return bs.MEDIUM_DASH_DOT_DOT; break;
		case "medium_dashed": return bs.MEDIUM_DASHED; break;
		case "none": return bs.NONE; break;
		case "slanted_dash_dot": return bs.SLANTED_DASH_DOT; break;
		case "thick": return bs.THICK; break;
		case "thin": return bs.THIN; break;
		}
	},*/

	/**
	 * <odoc>
	 * <key>ow.format.xls.setTable(aXLS, aSheet, aColumn, aRow, anArray, shouldAutoFilter, headerStyle, linesStyle)</key>
	 * Shortcut for xls.setTable that given aXLS object, a corresponding aSheet object will try to set the contents of 
	 * anArray of maps starting in aColumn and aRow performing auto size for all columns. If shouldAutoFilter = true is will
	 * also add an autofilter to all columns. It's possible also to customize the headerStyle and linesStyle.
	 * </odoc>
	 */
	setTable: function(aXLS, aSheet, aColumn, aRow, anArray, autoFilter, headerStyle, linesStyle) {
		if (isArray(anArray) && anArray.length <= 0) return;

		if (!isJavaObject(headerStyle) && isUnDef(headerStyle)) {
			headerStyle = ow.format.xls.getStyle(aXLS, { bold: true });
		} else {
			if (isMap(headerStyle)) headerStyle = ow.format.xls.getStyle(aXLS, headerStyle);
		}
		if (isDef(linesStyle) && isMap(linesStyle)) linesStyle = ow.format.xls.getStyle(aXLS, linesStyle);

		aXLS.setTable(aSheet, aColumn, aRow, anArray, headerStyle, linesStyle);
		for(var y = aXLS.toNumber(aColumn); y <= aXLS.toNumber(aColumn) + Object.keys(anArray[0]).length; y++) {
			aXLS.autoSizeColumn(aSheet, aXLS.toName(y));
		} 

		if (autoFilter) {
			ow.format.xls.autoFilter(aXLS, aSheet, aColumn + String(aRow) + ":" + aXLS.toName(aXLS.toNumber(aColumn) + Object.keys(anArray[0]).length -1) + String(aRow + anArray.length));
		}
	}
}

/**
 * <odoc>
 * <key>ow.format.getDoH(aAddr, aType, aProvider) : Array</key>
 * Performs a DNS over HTTPs query with aAddr. Optionally you can provide the aType of record (defaults to 'a') and
 * the DNS over HTTPs aProvider between 'google' and 'cloudflare'.
 * </odoc>
 */
OpenWrap.format.prototype.getDoH = function(aName, aType, aProvider) {
	ow.loadNet();
	return ow.net.getDoH(aName, aType, aProvider);
	/*aProvider = _$(aProvider).default("cloudflare");
 
	switch (aProvider) {
	   case "google":
		  var res = $rest({ uriQuery: true }).get("https://8.8.8.8/resolve", {
			 name: aName,
			 type: aType
		  });
		  if (isDef(res.Answer)) return res.Answer;
		  else return __;
	   case "cloudflare":
		  var res = $rest({
						requestHeaders: {
							accept: "application/dns-json"
						}, 
						uriQuery: true
					})
					.get("https://1.1.1.1/dns-query", {
						name: aName,
						type: aType
					});
		  if (isDef(res.Answer)) return res.Answer;
		  else return __;
	   default:
		  break;
	}*/
}

/**
 * <odoc>
 * <key>ow.format.getReverseDoH(aIP, aProvider) : Array</key>
 * Tries to retrieve the reverse DNS of aIP using DNS over HTTPs. Optionally you can choose the aProvider between 'google' and 'cloudflare'.
 * </odoc>
 */
OpenWrap.format.prototype.getReverseDoH = function(tIP, aProvider) {
	ow.loadNet();
	return ow.net.getReverseDoH(tIP, aProvider);
	/*var aIP = tIP, isV6 = false;
	if (tIP.match(/:/)) {
		ow.loadFormat();
		isV6 = true;
		var iip = java.net.InetAddress.getByName(tIP);
		var ar = String(iip.getHostAddress()).split(/:/);
		ar.map(r => { return ow.format.string.leftPad(r, 4); } ).join("").split("").reverse().join(".")
	}
	if (tIP.match(/\./)) {
		aIP = String(tIP).split(/\./).reverse().join(".");
	}

	return this.getDoH(aIP + (isV6 ? ".ip6" : ".in-addr") + ".arpa", "ptr");*/
}

//loadLib(getOpenAFJar() + "::js/later.js");
loadCompiledLib("later_js");
OpenWrap.format.prototype.cron = {
	/**
	 * From http://github.com/bunkat/later
	 */

	/**
	* Parses a valid cron expression and produces a valid schedule that
	* can then be used with Later.
	*
	* CronParser().parse('* 5 * * * * *');
	*
	* @param {String} expr: The cron expression to parse
	* @api public
	*/
	/**
	 * <odoc>
	 * <key>ow.format.cron.parse(aCronExpression) : Map</key>
	 * Parses aCronExpression and produces a Map with a schedules array and a exceptions array (if any error is found).
	 * Each schedules array item map has a key with all the number possibilities for the given aCronExpression provided:\
	 * \
	 * s - seconds (0-59)\
	 * m - minutes (0-59)\
	 * h - hours (0-23)\
	 * D - month day (1-31)\
	 * M - month (1-12)\
	 * d - week day (1-7)\
	 * \
	 * Example:\
	 * \
	 * ow.format.cron.parse("0 5 * * *"); // 5am\
	 * \
	 * </odoc>
	 */
	parse: function(expr) {
		var hasSeconds = (expr.split(/ +/).length > 5);

		return later.parse.cron(expr, hasSeconds);
	},
	
	/**
	 * <odoc>
	 * <key>ow.format.cron.nextScheduled(expr, count, start, end) : Date</key>
	 * Given a cron expr returns the next Date object when it will occur. If count > 1 it will provide an array of Dates with the next
	 * n Dates. If start and end Date are defined they will limit the range on which to provide dates.
	 * </odoc>
	 */
	nextScheduled: function(expr, count, start, end) {
		return later.schedule(ow.format.cron.parse(expr)).next(count, start, end);
	},

	/**
	 * <odoc>
	 * <key>ow.format.cron.prevScheduled(expr, count, start, end) : Date</key>
	 * Given a cron expr returns the previous Date object when it will occur. If count > 1 it will provide an array of Dates with the previous
	 * n Dates. If start and end Date are defined they will limit the range on which to provide dates.
	 * </odoc>
	 */
	prevScheduled: function(expr, count, start, end) {
		return later.schedule(ow.format.cron.parse(expr)).prev(count, start, end);
	},

	/**
	 * <odoc>
	 * <key>ow.format.cron.timeUntilNext(expr) : Number</key>
	 * Returns a number of ms until the cron expr is expected to be true.
	 * </odoc>
	 */
	timeUntilNext: function(expr) {
		return new Date(ow.format.cron.nextScheduled(expr)) - new Date();
	},

	/**
	 * <odoc>
	 * <key>ow.format.cron.sleepUntilNext(expr)</key>
	 * Sleeps until the cron expr is expected to be true.
	 * </odoc>
	 */
	sleepUntilNext: function(expr) {
		sleep(new Date(ow.format.cron.nextScheduled(expr)) - new Date());
	},

	/**
	 * <odoc>
	 * <key>ow.format.cron.set2UTC()</key>
	 * Sets the default system-wide cron expression evaluation to UTC (the default).
	 * </odoc>
	 */
	set2UTC: function() {
		later.date.UTC();
	},

	/**
	 * <odoc>
	 * <key>ow.format.cron.set2LocalTime()</key>
	 * Sets the default system-wide cron expression evaluation to the local time (default is UTC).
	 * </odoc>
	 */
	set2LocalTime: function() {
		later.date.localTime();
	},

	/**
	 * <odoc>
	 * <key>ow.format.cron.isCronMatch(aDate, aCronExpression) : boolean</key>
	 * Returns trues if the provided aDate is a match for the provided aCronExpression. Otherwise returns false.
	 * </odoc>
	 */
	isCronMatch: function(aDate, aCronExpr) {
		var d = aDate;
		var ct = ow.format.fromDate(d, "s m H d M u", (later.date.isUTC ? "UTC" : __)).split(/ /);
		var cr = ow.format.cron.parse(aCronExpr);
		if (cr.exceptions.length > 0) throw "Exceptions " + stringify(cr.exceptions);
		var isMatch = true;
		var i = 0;
		if (isDef(cr.schedules[0].s) && aCronExpr.split(/ +/).length > 5) 
			isMatch = (cr.schedules[0].s.indexOf(Number(ct[i])) > -1);
		i++;
		if (isDef(cr.schedules[0].m))
			if (aCronExpr.split(/ +/).length > 5)
				isMatch = isMatch && (cr.schedules[0].m.indexOf(Number(ct[i])) > -1);
			else
				isMatch = (cr.schedules[0].m.indexOf(Number(ct[i])) > -1);
		i++;
		if (isDef(cr.schedules[0].h)) isMatch = isMatch && (cr.schedules[0].h.indexOf(Number(ct[i])) > -1);
		i++;
		if (isDef(cr.schedules[0].D)) isMatch = isMatch && (cr.schedules[0].D.indexOf(Number(ct[i])) > -1);
		i++;
		if (isDef(cr.schedules[0].M)) isMatch = isMatch && (cr.schedules[0].M.indexOf(Number(ct[i])) > -1);
		i++;
		if (isDef(cr.schedules[0].d)) isMatch = isMatch && (cr.schedules[0].d.indexOf(Number(ct[i])+1) > -1);

		return isMatch;
	},

	/**
	 * <odoc>
	 * <key>ow.format.cron.howManyAgo(aCron, lastUpdate, aLimit) : Map</key>
	 * Given aCron expression and a date/unix time of a lastUpdate will return a map with a boolean isDelayed, number of 
	 * ms delayedAtLeast, if delayed howManyAgo executions missed and the corresponding missed executions dates in missedTimes.
	 * When calculating the missed times there is aLimit (defaults to 100).
	 * </odoc>
	 */
	howManyAgo: function(aCron, lastUpdate, aLimit) {
		aLimit = _$(aLimit).isNumber().default(100);
		if (isDate(lastUpdate)) lastUpdate.getTime();
	
		var isDelayed = true;
	
		var c = 0, ar = [];
		do {
			c++;
			ar = ow.format.cron.prevScheduled(aCron, c);
			if (!isArray(ar)) ar = [ar];
		} while(ar.length > 0 && ar[ar.length - 1].getTime() > lastUpdate && c < aLimit);
	
		if (ar[0].getTime() <= lastUpdate) isDelayed = false;
		if (ar[ar.length - 1].getTime() < lastUpdate) { ar.pop(); c--; }
	
		return {
			isDelayed: isDelayed,
			howManyAgo: (isDelayed) ? c : 0,
			missedTimes: (isDelayed) ? ar : [],
			limit: aLimit,
			delayedAtLeast: (isDelayed) ? ar[ar.length - 1].getTime() - lastUpdate : 0
		};
	}
}
