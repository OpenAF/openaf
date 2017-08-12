/**
 * <odoc>
 * <key>index</key>
 * OpenAF scripting is based on Javascript. There are built in objects and implicit functions
 * to add extra functionality. To get more help:\
 *   - for built in objects just search by the object name + the function name (e.g. openaf -helpscript io.readFile)\
 *   - for implicit functions search by the function name (e.g. openaf -helpscript compress) or enter "scope" (e.g. openaf -helpscript scope)
 * to see a complete list.\
 * \
 * Built-in objects are:\
 *   - af\
 *   - io\
 *   - CSV\
 *   - DB\
 * </odoc>
 */

var morehelp = "Please check http://openaf.io for more."
	
var term = __args[1] + "";
if (__args.length >= 1 && term != 'undefined') {
	var h = [];
	
	if(term == "scope") {
		h = searchHelp("", undefined, ['scope']);
	} else {
		h = searchHelp(term);
	}
	
	if (h.length == 1) {
		print(h[0].fullkey);
		print(repeat(h[0].fullkey.length, '-'));
		print(h[0].text);
		print("");
	} else {
		if (h.length > 1) {
			for(var i in h) {
				print(h[i].key);
			}
		} else {
			print("Term '" + term + "' not found.");
			print("");
			print(morehelp);
		}
	}	
} else {
	var h = searchHelp("index", undefined, ['index']);
	print(h[0].text);
	print("");
	print(morehelp);
}

