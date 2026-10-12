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
	
function printHelpText(entry) {
  if (entry.format == "markdown" && java.lang.System.console() != null && __initializeCon() && __conAnsi) {
    ow.loadFormat();
    ansiStart();
    try { print(ow.format.withMD(entry.text)); } finally { ansiStop(); }
  } else {
    print(entry.text);
  }
}

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
		printHelpText(h[0]);
		print("");
	} else {
		if (h.length > 1) {
			for(var i in h) {
				print(h[i].key + " (" + h[i].id + ")");
			}
		} else {
			print("Term '" + term + "' not found.");
			print("");
			print(morehelp);
		}
	}	
} else {
	var h = searchHelp("index", undefined, ['index']);
	printHelpText(h[0]);
	print("");
	print(morehelp);
}

