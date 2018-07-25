// OpenWrap v2
// Author: Nuno Aguiar
// Format
// (parts from assemble.io)

OpenWrap.format = function() {
	return ow.format;
}

OpenWrap.format.prototype.string = {
	/**
	 * <odoc>
	 * <key>ow.format.string.wordWrap(aString, maxWidth, newLineSeparator) : String</key>
	 * Given aString word wraps the text on it given the maxWidth length per line. Optionally you can provide
	 * a newLineSeparator otherwise '\n' will be used.
	 * (available after ow.loadFormat())
	 * </odoc>
	 */
	wordWrap: function(str, maxWidth, newLine) {
	    function testWhite(x) {
	        var white = new RegExp(/^\s$/);
	        return white.test(x.charAt(0));
	    };
	    
	    var newLineStr = (isUndefined(newLine)) ? "\n" : newLine; done = false; res = '';
	    do {                    
	        found = false;
	        // Inserts new line at first whitespace of the line
	        for (var i = maxWidth - 1; i >= 0; i--) {
	            if (testWhite(str.charAt(i))) {
	                res = res + [str.slice(0, i), newLineStr].join('');
	                str = str.slice(i + 1);
	                found = true;
	                break;
	            }
	        }
	        // Inserts new line at maxWidth position, the word is too long to wrap
	        if (!found) {
	            res += [str.slice(0, maxWidth), newLineStr].join('');
	            str = str.slice(maxWidth);
	        }
	
	        if (str.length < maxWidth)
	            done = true;
	    } while (!done);
	
	    return res + str;
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
		loadLib(getOpenAFJar() + "::js/tlsh.js");
		if (isUndefined(aStringB)) {
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
		loadLib(getOpenAFJar() + "::js/tlsh.js");
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
	progress: function(aOrigPos, aMax, aMin, aSize, aIndicator, aSpace) {
		if (isUnDef(aIndicator)) aIndicator = "#";
		if (isUnDef(aSpace))     aSpace = " ";
		if (isUnDef(aSize))      aSize = 5;
		if (isUnDef(aMax))       aMax = aPos;
		if (isUnDef(aMin))       aMin = 0;
	
		var aScale = Math.abs(aMin) + Math.abs(aMax);
		var aPos = (aOrigPos > aMax) ? aMax : aOrigPos;
		aPos = (aOrigPos < aMin) ? aMin : aPos;

		var res = 
		  ( (aMin < 0) ?
			  repeat(aSize + ((Math.round(aPos * aSize / aScale)) < 0 ? (Math.round(aPos * aSize / aScale)) : 0), aSpace) + 
			  repeat(-((Math.round(aPos * aSize / aScale)) < 0 ? (Math.round(aPos * aSize / aScale)) : 0), aIndicator) 
			: "" ) +  
		  ( (aMax > 0) ?
			repeat(((Math.round(aPos * aSize / aScale)) > 0 ? (Math.round(aPos * aSize / aScale)) : 0), aIndicator) + 
			repeat(aSize - ((Math.round(aPos * aSize / aScale)) > 0 ? (Math.round(aPos * aSize / aScale)) : 0), aSpace)
			: ""
		  );
	
		return res;
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
 * <key>ow.format.toDate(aStringDate, aFormat) : Date</key>
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
 * (available after ow.loadFormat())
 * </odoc>
 */
OpenWrap.format.prototype.toDate = function(aStringDate, aFormat) {
	var sdf = new java.text.SimpleDateFormat(aFormat);
	return new Date(sdf.parse(aStringDate).getTime());
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
 * Retrieves the current actual time from NIST (through https). The current actual time will be returned in a Date.
 * If useAlternative = true it will use now.httpbin.org (through http)
 * </odoc>
 */
OpenWrap.format.prototype.getActualTime = function(useAlternative) {
	plugin("HTTP");

	if (useAlternative) {
		var h = ow.loadObj();
		return new Date(ow.obj.rest.jsonGet("http://now.httpbin.org").now.epoch * 1000);
	} else {
		plugin("XML");
		return new Date((new XML((new HTTP("https://nist.time.gov/actualtime.cgi")).response())).get("@time")/1000);
	}
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
	if (isDefined(aWedoDate["__wedo__type__"]) &&
		aWedoDate["__wedo__type__"] == "date")
		return true;
	else
		return false;
}

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
	plugin("HTTP");
	return JSON.parse((new HTTP("http://ifconfig.co/json")).response());
}

/**
 * <odoc>
 * <key>ow.format.testPublicPort(aPort) : Map</key>
 * Uses the functionality provided by http://ifconfig.co to return a map with the result of testing if aPort is within public 
 * reach from your apparent current public ip address. Please be aware of the request limits of the service (around 1 request
 * per minute).
 * </odoc>
 */
OpenWrap.format.prototype.testPublicPort = function(aPort) {
	plugin("HTTP");
	return JSON.parse((new HTTP("http://ifconfig.co/port/" + String(aPort))).response());
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
 * <key>ow.format.testPort(aAddress, aPort, aCustomTimeout) : boolean</key>
 * Tries to connect to aPort (e.g. 1234) on aAddress (e.g. 1.2.3.4). If the connection is successfull it will disconnect
 * and return true, otherwise it will return false. If aCustomTimeout (in ms) is defined, it will use that value as the timeout
 * instead of the 1,5 seconds by default.
 * </odoc>
 */
OpenWrap.format.prototype.testPort = function(aAddress, aPort, aCustomTimeout) {
    if (isUnDef(aCustomTimeout)) aCustomTimeout = 1500;

    try {
        var s = new java.net.Socket();
        s.connect(new java.net.InetSocketAddress(aAddress, aPort), aCustomTimeout);
        s.close();
        return true;
    } catch(e) {
        return false;
    }
}

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
}


OpenWrap.format.prototype.xls = {
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
	 * </odoc>
	 */
	getStyle: function(aXLS, aStyleMap) {
		var rcs = aXLS.getCellStyler();
		var rcf = aXLS.getNewFont();
		if (isDefined(aStyleMap.bold)) rcf.setBold(aStyleMap.bold);
		if (isDefined(aStyleMap.italic)) rcf.setItalic(aStyleMap.italic);
		if (isDefined(aStyleMap.underline)) rcf.setUnderline(aStyleMap.underline);
		if (isDefined(aStyleMap.strikeout)) rcf.setStrikeout(aStyleMap.strikeout);
		if (isDefined(aStyleMap.fontPoints)) rcf.setFontHeightInPoints(aStyleMap.fontPoints);
		if (isDefined(aStyleMap.fontName)) rcf.setFontName(aStyleMap.fontName);
		if (isDefined(aStyleMap.fontColor)) rcf.setColor(this.getColor(aStyleMap.fontColor));
		if (isDefined(aStyleMap.wrapText)) rcs.setWrapText(aStyleMap.wrapText);
		if (isDefined(aStyleMap.shrinkToFit)) rcs.setShrinkToFit(aStyleMap.shrinkToFit);
		if (isDefined(aStyleMap.backgroundColor)) rcs.setFillBackgroundColor(this.getColor(aStyleMap.backgroundColor));
		if (isDefined(aStyleMap.foregroundColor)) rcs.setFillForegroundColor(this.getColor(aStyleMap.foregroundColor));
		if (isDefined(aStyleMap.borderBottom)) rcs.setBorderBottom(this.getBorderStyle(aStyleMap.borderBottom));
		if (isDefined(aStyleMap.borderLeft)) rcs.setBorderLeft(this.getBorderStyle(aStyleMap.borderLeft));
		if (isDefined(aStyleMap.borderRight)) rcs.setBorderRight(this.getBorderStyle(aStyleMap.borderRight));
		if (isDefined(aStyleMap.borderTop)) rcs.setBorderTop(this.getBorderStyle(aStyleMap.borderTop));
		if (isDefined(aStyleMap.borderBottom)) rcs.setBorderBottom(this.getBorderStyle(aStyleMap.borderBottom));
		if (isDefined(aStyleMap.borderLeftColor)) rcs.setLeftBorderColor(this.getColor(aStyleMap.borderLeftColor));
		if (isDefined(aStyleMap.borderRightColor)) rcs.setRightBorderColor(this.getColor(aStyleMap.borderRightColor));
		if (isDefined(aStyleMap.borderTopColor)) rcs.setTopBorderColor(this.getColor(aStyleMap.borderTopColor));
		if (isDefined(aStyleMap.borderBottomColor)) rcs.setBottomBorderColor(this.getColor(aStyleMap.borderBottomColor));
		if (isDefined(aStyleMap.rotation)) rcs.setRotation(aStyleMap.rotation);
		if (isDefined(aStyleMap.indention)) rcs.setIndention(aStyleMap.indention);
		if (isDefined(aStyleMap.valign)) {
			switch(aStyleMap.valign) {
			case "top": rcs.setVerticalAlignment(Packages.org.apache.poi.ss.usermodel.VerticalAlignment.TOP); break;
			case "bottom": rcs.setVerticalAlignment(Packages.org.apache.poi.ss.usermodel.VerticalAlignment.BOTTOM); break;
			case "center": rcs.setVerticalAlignment(Packages.org.apache.poi.ss.usermodel.VerticalAlignment.CENTER); break;
			case "justify": rcs.setVerticalAlignment(Packages.org.apache.poi.ss.usermodel.VerticalAlignment.JUSTIFY); break;
			}
		};
		if (isDefined(aStyleMap.align)) {
			switch(aStyleMap.align) {
			case "center": rcs.setAlignment(Packages.org.apache.poi.ss.usermodel.HorizontalAlignment.ALIGN_CENTER); break;
			case "centerSelection": rcs.setAlignment(Packages.org.apache.poi.ss.usermodel.HorizontalAlignment.ALIGN_CENTER_SELECTION); break;
			case "fill": rcs.setAlignment(Packages.org.apache.poi.ss.usermodel.HorizontalAlignment.ALIGN_FILL); break;
			case "general": rcs.setAlignment(Packages.org.apache.poi.ss.usermodel.HorizontalAlignment.ALIGN_GENERAL); break;
			case "justify": rcs.setAlignment(Packages.org.apache.poi.ss.usermodel.HorizontalAlignment.ALIGN_JUSTIFY); break;
			case "left": rcs.setAlignment(Packages.org.apache.poi.ss.usermodel.HorizontalAlignment.ALIGN_LEFT); break;
			case "right": rcs.setAlignment(Packages.org.apache.poi.ss.usermodel.HorizontalAlignment.ALIGN_RIGHT); break;
			}
		};
		rcs.setFont(rcf);
		return rcs;
	},
	
	/**
	 * <odoc>
	 * <key>ow.format.xls.autoFilter(aXLSSheet, aRange)</key>
	 * Applies a auto filter on the provided aXLSSheet object (from XLS.getSheet) to aRange.\
	 * \
	 * Example:\
	 * \
	 *    ow.format.xls.autoFilter(sheet, "A1:D1");\
	 * \
	 * </odoc>
	 */
	autoFilter: function(aXLSSheet, aRange) {
		aXLSSheet.setAutoFilter(Packages.org.apache.poi.ss.util.CellRangeAddress.valueOf(aRange));
	},
	
	getColor: function(aColorName) {
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
		
		if (isDefined(c)) return c.getIndex();
	}, 
	
	getBorderStyle: function(aBorderStyle) {
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
	}
}

loadLib(getOpenAFJar() + "::js/later.js");
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
	 * <key>ow.format.cron.isCronMatch(aDate, aCronExpression) : boolean</key>
	 * Returns trues if the provided aDate is a match for the provided aCronExpression. Otherwise returns false.
	 * </odoc>
	 */
	isCronMatch: function(aDate, aCronExpr) {
		var d = aDate;
		var ct = ow.format.fromDate(d, "s m H d M u").split(/ /);
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
	}

}