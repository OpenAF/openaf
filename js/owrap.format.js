// OpenWrap v2
// Author: Nuno Aguiar
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
	 * <key>ow.format.string.wordWrap(aString, maxWidth, newLineSeparator, tabDefault) : String</key>
	 * Given aString word wraps the text on it given the maxWidth length per line. Optionally you can provide
	 * a newLineSeparator otherwise '\n' will be used. Optionally tabDefault determines how many spaces a tab represents (default 4)
	 * (available after ow.loadFormat())
	 * </odoc>
	 */
	wordWrap: function(str, maxWidth, newLine, tabDefault) {
		str = _$(str, "str").isString().default("");
		tabDefault = _$(tabDefault, "tabDefault").isNumber().default(4);
		_$(maxWidth, "maxWidth").isNumber().$_();
	 
		if (ansiLength(str) <= maxWidth) return str;
	 
		str = str.replace(/\t/g, repeat(tabDefault, " "));
		 
		 var newLineStr = (isUnDef(newLine)) ? "\n" : newLine; done = false, res = "";
		 do {
		   var lines = str.split(newLineStr), lid;
		   found = false;
		   for(lid = 0; lid < lines.length && !found; lid++) {
			  if (ansiLength(lines[lid]) > maxWidth) {
				 // Inserts new line at first whitespace of the line
				 for (var i = maxWidth - 1; i >= 0; i--) {
					if (lines[lid].charAt(i) == " ") {
					   lines[lid] = lines[lid].slice(0, i) + newLineStr + lines[lid].slice(i+1).trim();
					   found = true;
					   break;
					}
				 }
	 
				 // Inserts new line at maxWidth position, the word is too long to wrap
				 if (!found) {
					lines[lid] = lines[lid].slice(0, maxWidth) + newLineStr + lines[lid].slice(maxWidth).trim();
					found = true;
				 }
			  }
		   }
		   str = lines.join(newLineStr);
		 } while (found);
	 
		 return str;
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
	 * ow.format.string.closest("/usernam", anArrayOfStrings); // Returns /username\
	 * \
	 * </odoc>
	 *
	 * from https://github.com/ianstormtaylor/closest-match
	 */
	closest: function(aString, aList, aThreshold) {
		var threshold = (isDefined(aThreshold)) ? aThreshold : 3;
		
		if (!aString || !aList) return false;
	
		var distance, match;
		for (var i = 0, candidate; candidate = aList[i]; i++) {
			if (aString === candidate) return aString;
			var measurement = ow.format.string.distance(aString, candidate);
			if (!distance || measurement < distance) {
				distance = measurement;
				match = candidate;
			}
		}
	
		if (distance > aThreshold) return false;
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
	 * <key>ow.format.string.progress(aNumericValue, aMax, aMin, aSize, aIndicator, aSpace) : String</key>
	 * Outputs an in-line progress bar given aNumericValue, aMax value, aMin value, the aSize of the bar and the aIndicator
	 * to use. If not provided, aMax defaults to aValue, aMin defaults to 0, aSize defaults to 5, aIndicator defaults to "#" 
	 * and aSpace defaults to " ". Example:\
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
		if (isUnDef(aIndicator)) aIndicator = "#";
		if (isUnDef(aSpace))     aSpace = " ";
		if (isUnDef(aSize))      aSize = 5;
		if (isUnDef(aMax))       aMax = aPos;
		if (isUnDef(aMin))       aMin = 0;
	
		var aScale = Math.abs(aMin) + Math.abs(aMax);
		var aPos = (aOrigPos > aMax) ? aMax : aOrigPos;
		aPos = (aOrigPos < aMin) ? aMin : aPos;

		var res, rpos = Math.round(aPos * aSize / aScale);
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
				: "");
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
				);
		}
	
		return res;
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
			str.split(/\r?\n/).map(r => { 
				c++; 
				if ( (x + c) < numberOfLines) {
					var rm = r.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
		
					orig[x + c] = orig[x + c].substring(0, y + extra[x + c]) + 
						   r + 
						   orig[x + c].substring(y + rm.length + extra[x + c]); 
			
					extra[x + c] = extra[x + c]+ r.length - rm.length;
				}
			}); 
	
		};
		
		anArrayElements.map(elem => {
			fn(o, elem.x, elem.y, elem.t);
		});
		
		if (shouldReturn) {
			return o.join("");
		} else {
			ansiStart(); print(o.join("")); printnl( jansi.Ansi.ansi().cursorUpLine(numberOfLines + 2) ); ansiStop();
		}
	},
        /**
         * <odoc>
         * <key>ow.format.string.grid(aMatrix, aX, aY, aBgPattern, shouldReturn) : String</key>
         * Will generate a aX per aY grid to be displayed with aBgPattern (defaults to " "). Each grid cell with use the contents on aMatrix
         * array of an array. Each cell content can be a map with obj (a Map), a xspan/yspan for in cell spacing, a type (either map, table or string) 
         * and a title. If shouldReturn = true it will just return the string content instead of trying to print it.
         + </odoc>
         */
	grid: function(aElems, aX, aY, aPattern, shouldReturn) {
		plugin("Console");
		var _con_ = new Console();
		aY = _$(aY, "width").isNumber().default(Number(_con_.getConsoleReader().getTerminal().getWidth()));
		aX = _$(aX, "height").isNumber().default(Number(Math.floor(_con_.getConsoleReader().getTerminal().getHeight() / aElems.length - 1)));
	
		var elems = [], l = 0, ignore = [];
		aElems.map(line => {
			var c = 0;

			line.map(col => {
				if (ignore.indexOf("Y:" + c + "X:" + l) < 0) {
					if (isUnDef(col)) col = "";
					if (!isMap(col)) col = { obj: col };
	
					if (isUnDef(col.type)) {
						if (isMap(col.obj) || isArray(col.obj)) 
							col.type = "map";
						else
							col.type = "human";
					}

					var xspan = _$(col.xspan, "xspan").isNumber().default(1);
					var yspan = _$(col.yspan, "yspan").isNumber().default(1);
					if (xspan > 1) for(var ii = c + 1; ii < c + xspan; ii++) { ignore.push("Y:" + ii + "X:" + l); }
					if (yspan > 1) for(var ii = l + (aX + 1); ii < l + ((aX + 1) * yspan); ii += aX + 1) { ignore.push("Y:" + c + "X:" + ii); }
					var p = "", cs = Math.floor((aY / line.length) * xspan);
			
					switch(col.type) {
					case "map": p = printMap(col.obj, cs, "utf", true); break; 
					case "table": p = printTable(col.obj, cs, __, true, "utf"); break;
					default: p = String(col.obj).split(/\r?\n/).map(r => r.substring(0, cs)).join("\n");
					}
	
					if (isDef(col.title)) {
						p = ansiColor("BOLD", "> " + col.title + " " + repeat(cs - 4 - col.title.length, "─")) + "\n" + p;
					}
					
					var pp = p.split(/\r?\n/), po = [];
					if (pp.length > (aX * yspan)) {
						for(var ii = 0; ii <= (aX * yspan); ii++) {
							po.push(pp[ii]);
						}
						po = po.join("\n");
					} else {
						po = p;
					}
					
					elems.push({ x: l, y: cs * c, t: po });
				}
				c++;
			});

			l += aX + 1;
		});
	
		return ow.format.string.renderLines(elems, aX * aElems.length, aY, aPattern, shouldReturn);
	}
};
	
OpenWrap.format.prototype.syms = function() {
	return {
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
		patternDark  : '▓'
	}
}

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
 * <key>ow.format.streamSHPrefix(aPrefix, anEncoding, aSeparator, aTemplate) : Function</key>
 * To be used with sh, af.sh or ssh.exec as the callbackFunc. Returns a function that will prefix each line with aPrefix
 * and used the returned string with print and printErr. Optionally you can provide aTemplate to add "prefix" (defaults to "[{{prefix}}]")
 * </odoc>
 */
OpenWrap.format.prototype.streamSHPrefix = function(aPrefix, anEncoding, aSeparator, aTemplate) {
	aPrefix   = _$(aPrefix, "aPrefix").isString().default("");
	aTemplate = _$(aTemplate, "aTemplate").isString().default("[{{prefix}}] ");

	return function(o, e) {
		$doWait(
			$doAll([
				$do(() => { ioStreamReadLines(o, (f) => { ansiStart(); print(ansiColor("BOLD,BLACK", templify(aTemplate, { prefix: aPrefix })) + af.toEncoding(String(f.replace(/[\n\r]+/g, "")), anEncoding)); ansiStop(); }, aSeparator, false, __); }), 
				$do(() => { ioStreamReadLines(e, (f) => { ansiStart(); printErr(ansiColor("RED", templify(aTemplate, { prefix: aPrefix })) + af.toEncoding(String(f.replace(/[\n\r]+/g, "")), anEncoding)); ansiStop(); }, aSeparator, false, anEncoding); })
			])
		);
	};
};

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
 * <key>ow.format.toBytesAbbreviation(aNumber, aDigits) : String</key>
 * Returns a number abbreviation to "bytes", "KB", "MB", "GB", "TB", etc. Will round number to 3 significant
 * digits if aDigits doesn't provide a different number of precision digits to convert to.\
 * (available after ow.loadFormat())
 * </odoc>
 */
OpenWrap.format.prototype.toBytesAbbreviation = function (bytes, precision) {
	if (isUndefined(precision)) precision = 3;

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
 * <key>ow.format.fromBytesAbbreviation(aStr) : Number</key>
 * Tries to reverse the ow.format.toBytesAbbreviation from aStr (string) back to the original value in bytes.\
 * (available after ow.loadFormat())
 * </odoc>
 */
OpenWrap.format.prototype.fromBytesAbbreviation = function(aStr) {
	ow.loadFormat();

	_$(aStr, "aStr").isString().$_();

	var sizes = ['BYTES', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

	aStr = aStr.trim();
	var arr = aStr.split(/\s+/), unit, value;
	if (arr.length >= 2) {
		unit  = String(arr[arr.length - 1]);
		value = Number(arr[arr.length - 2]);  
	} else {
		unit  = "";
		value = parseFloat(aStr);
	}
	
	var vfactor = 1;
	for(var ii = 1; ii <= sizes.indexOf(unit.toUpperCase()); ii++) {
		vfactor *= 1024;
	}
	
	return Math.round(value * vfactor);
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
	   startMap: "(",
	   sepMap  : ", ",
	   endMap  : ")",
	   sepKV   : ": ",
	   startArr: "[",
	   sepArr  : " | ",
	   endArr  : "]",
	   strQuote: "'"
	}
  
	if (isMap(cTheme)) dTheme = merge(dTheme, cTheme);
  
	if (isNull(aObj)) {
        return null;
    }
	if (isMap(aObj)) {
	   var pairs = [];
	   Object.keys(aObj).forEach(r => {
		  pairs.push(r + dTheme.sepKV + ow.format.toSLON(aObj[r])); 
	   });
	   return dTheme.startMap + pairs.join(dTheme.sepMap) + dTheme.endMap; 
	}
	if (isArray(aObj)) {
	   return dTheme.startArr + aObj.map(r => {
		  return ow.format.toSLON(r);
	   }).join(dTheme.sepArr) + dTheme.endArr;
	}
	if (isDate(aObj)) {
		return ow.format.fromDate(aObj, 'yyyy-MM-dd/HH:mm:ss.SSS');
	}
	if (!isMap(aObj) && !isArray(aObj)) return (isString(aObj) ? dTheme.strQuote + aObj + dTheme.strQuote : String(aObj));
  }

/**
 * <odoc>
 * <key>ow.format.round(aNumber, aDigits) : String</key>
 * Will return aNumber rounded to 0 decimal digits or aDigits decimal digits.\
 * (available after ow.loadFormat())
 * </odoc>
 */
OpenWrap.format.prototype.round = function(number, digits) {
    if (isUndefined(digits)) {
      digits = 0;
    }
    return number.toFixed(digits);
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
OpenWrap.format.prototype.hmacSHA256 = hmacSHA256;
OpenWrap.format.prototype.hmacSHA384 = hmacSHA384;
OpenWrap.format.prototype.hmacSHA512 = hmacSHA512;

/**
 * <odoc>
 * <key>ow.format.timeago(aDate) : String</key>
 * Will output how much time ago aDate is (e.g. 2 years ago, 30 minutes ago, etc...).\
 * (available after ow.loadFormat())
 * </odoc>
 */
OpenWrap.format.prototype.timeago = function(date) {
    date = new Date(date);
    var seconds = Math.floor((new Date() - date) / 1000);
    var interval = Math.floor(seconds / 31536000);
    if (interval > 1) {return "" + interval + " years ago"; }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {return "" + interval + " months ago"; }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {return "" + interval + " days ago"; }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {return "" + interval + " hours ago"; }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {return "" + interval + " minutes ago"; }
    if (Math.floor(seconds) === 0) {
      return 'Just now';
    } else {
      return Math.floor(seconds) + ' seconds ago';
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
 * <key>ow.format.isIPv4(aIP) : boolean</key>
 * Tries to determine if aIP is a syntactic valid IPv4.
 * </odoc>
 */
OpenWrap.format.prototype.isIPv4 = function(aIP) {
	if (isString(aIP) && 
	    aIP.match(/^(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$/)) {
		return true;
	} else {
		return false;
	}
};

/**
 * <odoc>
 * <key>ow.format.isIPv6(aIP) : boolean</key>
 * Tries to determine if aIP is a syntactic valid IPv6.
 * </odoc>
 */
OpenWrap.format.prototype.isIPv6 = function(aIP) {
	if (isString(aIP) && 
	    aIP.match(/^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/)) {
		return true;
	} else {
		return false;
	}
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
	try {
		if (isString(aURL) &&
		(new java.net.URI(aURL)).isAbsolute()) {
			return true;
		} else {
			return false;
		}
	} catch(e) {
		return false;
	}
};

/**
 * <odoc>
 * <key>ow.format.isHost(aHost) : boolean</key>
 * Tries to determine if aHost seems a syntactic valid host.
 * </odoc>
 */
OpenWrap.format.prototype.isHost = function(aHost) {
	if (isString(aHost) &&
	    aHost.match(/^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/)) {
		return true;
	} else {
		return false;
	}
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
	return String(java.lang.System.getProperty("user.home"));
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
	for(let j = 0; j <= aLimit; j++) {
		if (isUnDef(newArray[j])) newArray[j] = "";
		for(let i in anLineArray) {
			newArray[j] += (isDef(anLineArray[i][aLimit-j])) ? anLineArray[i][aLimit-j] : " ";
		}
	}
	return newArray;
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
 * <key>ow.format.printWithWaiting(aMainFunc, aPrefixMsg, aCompleteMsg, aErrorMsg, aWaitSpeed, aTheme)</key>
 * Executes aMainFunc while priting aPrefixMsg with a waiting aTheme (defaults to a sequence of chars with a rotating bar).
 * When aMainFunc ends it will replace the priting with aCompleteMsg or aErrorMsg in case an exception is thrown.
 * Optionally you can provide a different aWaitSpeed while cycling between the aTheme sequence of chars increasing/decreasing
 * the "animation" effect.
 * </odoc>
 */
OpenWrap.format.prototype.printWithWaiting = function(aMainFunc, aPrefixMsg, aCompleteMsg, aErrorMsg, aWaitSpeed, aTheme, pnlfn) {
	_$(aMainFunc, "Main function").isFunction().$_();

	aWaitSpeed   = _$(aWaitSpeed, "aWaitSpeed").isNumber().default(150);
	aPrefixMsg   = _$(aPrefixMsg, "aPrefixMsg").isString().default("");
	aCompleteMsg = _$(aCompleteMsg, "aCompleteMsg").isString().default(" ");
	aErrorMsg    = _$(aErrorMsg, "aErrorMsg").isString().default("!");
	aTheme       = _$(aTheme, "aTheme").isString().default("-\\|/");
	pnlfn        = _$(pnlfn).default(printnl);

	var e, p = $do(() => {
		aMainFunc();
	}).catch((ee) => {
		e = ee;
	});

	$tb(() => {
		var ii = 0;
		while(isUnDef(e) && p.state <= 0) {
			if (ii >= aTheme.length) ii = 0;
			pnlfn(aPrefixMsg + aTheme[ii] + "\r");
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
 * Currently supports only: bold, italic.
 * </odoc>
 */
OpenWrap.format.prototype.withMD = function(aString, defaultAnsi) {
    _$(aString, "aString").isString().$_();
    defaultAnsi = _$(defaultAnsi, "defaultAnsi").isString().default("");
	var res = aString, da = (defaultAnsi.length > 0 ? ansiColor(defaultAnsi, "") : "");

 	res = res.replace(/(\*{3}|_{3})([^\*_\n]+)(  \*{3}|_{3})/g, ansiColor("BOLD,ITALIC", "$2")+da)
 	res = res.replace(/(\*{2}|_{2})([^\*_\n]+)(\*{2}|_{2})/g, ansiColor("BOLD", "$2")+da)
 	res = res.replace(/(\*|_)([^\*_\n]+)(\*|_)/g, ansiColor("ITALIC", "$2")+da)

	res = res.replace(/^# (.+)/mg, ansiColor("WHITE,BOLD,UNDERLINE", "$1") + da)
	res = res.replace(/^## (.+)/mg, ansiColor("BOLD,UNDERLINE", "$1") + da)
	res = res.replace(/^###+ (.+)/mg, ansiColor("BOLD", "$1") + da)
	
	var isTab = false, fields = [], data = []
	if (res.indexOf("|") >= 0) {
		res = res.split("\n").map(l => {
			if ((/^(\|[^\|]+)+\|$/).test(l)) {
				if (isTab) {
					if ((/^(\|[-: ]+)+\|$/).test(l)) {
						// Separator
						return null
					} else {
						if (l.trim().indexOf("|") == 0) {
							var m = {}
							l.split("|").forEach((s, i) => {
								if (i == 0) return
		
								if (isDef(fields[i-1])) {
									m[fields[i-1]] = s
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
					fields = []
					var cdata = clone(data)
					data = []
					return printTable(cdata)
				}
				return l
			}
		}).filter(isString).join("\n")
	}

	return res;
};

OpenWrap.format.prototype.withSideLineThemes = function() {
	var _s = ow.format.syms();
	return {
		simpleLine: {
			lmiddle: _s.lineV
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
		}
	}
};

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
		aString = ow.format.string.wordWrap(aString, aSize - 2);
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
				var sp = (isDef(ansiText) ? ansiColor(ansiText, repeat(aSize - ansiLength(l) - 3, ' ')) : repeat(aSize - ansiLength(l) - 3, ' '));
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
