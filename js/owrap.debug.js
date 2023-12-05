// OpenWrap v2
// Copyright 2023 Nuno Aguiar
// Debug
 
OpenWrap.debug = function() {
    ow.loadFormat()

	return ow.debug;
}

/**
 * <odoc>
 * <key>ow.debug.register()</key>
 * Registers the debug preparser.
 * </odoc>
 */
OpenWrap.debug.prototype.register = function() {
    if (isFunction(__loadPreParser) && !__flags.OAF_CLOSED && isUnDef(global.__debugLoadPreParser)) {
        global.__debugLoadPreParser = __loadPreParser.toString()
        __loadPreParser = function(code) {
          var _fn = eval(global.__debugLoadPreParser)
          return _fn(ow.debug.debug(code, __, true))
        }
        __flags.OAF_PRECOMPILE_LEVEL = 0
    }
    
    return this
}

/**
 * <odoc>
 * <key>ow.debug.unregister()</key>
 * Unregisters the debug preparser.
 * </odoc>
 */
OpenWrap.debug.prototype.unregister = function() {
    if (isDef(global.__debugLoadPreParser)) {
        __loadPreParser = eval(global.__debugLoadPreParser)
        delete global.__debugLoadPreParser
        __flags.OAF_PRECOMPILE_LEVEL = 2
    }
}

/**
 * <odoc>
 * <key>ow.debug.load(aScript)</key>
 * Equivalent to OpenAF's "load" but registering the debug preparser. The comments code that can be used are:\
 * \
 *   //@  This is a checkpoint on the code you want to know it was reached\
 *   //#  assertVarA == assertVarB\
 *   //?  printVarA\
 *   //?s printInSLONVarA\
 *   //?y printInYAMLVarA\
 *   //[  begin of unique profile block\
 *   //]  end of unique profile block\
 * \
 * </odoc>
 */
OpenWrap.debug.prototype.load = function(aScript) { 
    if (isUnDef(global.__debugLoadPreParser)) {
        this.register()
    }
    load(aScript) 
}

/**
 * <odoc>
 * <key>ow.debug.require(aScript, force)</key>
 * Equivalent to OpenAF's "require" but registering the debug preparser. The comments code that can be used are:\
 * \
 *   //@  This is a checkpoint on the code you want to know it was reached\
 *   //#  assertVarA == assertVarB\
 *   //?  printVarA\
 *   //?s printInSLONVarA\
 *   //?y printInYAMLVarA\
 *   //?t printInTableVarA\
 *   //?r printInTreeVarA\
 *   //{  begin of unique block with prefix\
 *   //}  end of unique block with prefix\
 *   //[  begin of unique profile block\
 *   //]  end of unique profile block\
 *   //{[ begin of unique profile block with prefix\
 *   //]} end of unique profile block with prefix\
 *   //+  incrementVarA\
 *   //-  decrementVarA\ 
 * \
 * </odoc>
 */
OpenWrap.debug.prototype.require = function(aScript, force) { 
    if (isUnDef(global.__debugLoadPreParser)) {
        this.register()
    }
    return require(aScript, force) 
}

var OAF_DEBUG_ARGS
/**
 * <odoc>
 * <key>ow.debug.debug(aCode, args, aReturnCode, aPrefix) : String</key>
 * Parses aCode for debug comments and replaces the appropriate code. The comments code that can be used are:\
 * \
 *   //@  This is a checkpoint on the code you want to know it was reached\
 *   //#  assertVarA == assertVarB\
 *   //?  printVarA\
 *   //?s printInSLONVarA\
 *   //?y printInYAMLVarA\
 *   //?t printInTableVarA\
 *   //?r printInTreeVarA\
 *   //{  begin of unique block with prefix\
 *   //}  end of unique block with prefix\
 *   //[  begin of unique profile block\
 *   //]  end of unique profile block\
 *   //{[ begin of unique profile block with prefix\
 *   //]} end of unique profile block with prefix\
 *   //+  incrementVarA\
 *   //-  decrementVarA\ 
 * \
 * If aReturnCode is true instead of executing the code, the code will just be returned. Customization can be provided through args
 * or the global map variable OAF_DEBUG_ARGS accepting the following entries:\
 * \
 *   lineColor   (string)  defaults to FG(220)\
 *   textColor   (string)  defaults to BG(230),BLACK\
 *   lineError   (string)  defaults to FG(220)\
 *   textError   (string)  defaults to BG(196),FG(255),BOLD\
 *   theme       (string)  defaults to doubleLineBothSides\
 *   emoticons   (boolean) defaults to true\
 *   signs       (map)     the emoticons to use (checkpoint, assert, print, error and time)\
 *   includeTime (boolean) defaults to false
 * </odoc>
 */
OpenWrap.debug.prototype.debug = function(aCode, args, returnCode, aPrefix) {
  if (isDef(getEnv("OAF_DEBUG_ARGS"))) OAF_DEBUG_ARGS = jsonParse(getEnv("OAF_DEBUG_ARGS"), true)
  if (isMap(OAF_DEBUG_ARGS) && isUnDef(args)) args = OAF_DEBUG_ARGS
  
  returnCode = _$(returnCode, "returnCode").isBoolean().default(false)
  
  args = _$(args, "args").isMap().default({})
  args.lineColor = _$(args.lineColor, "lineColor").isString().default("FG(220)")
  args.textColor = _$(args.textColor, "textColor").isString().default("BG(230),BLACK")
  args.lineError = _$(args.lineError, "lineError").isString().default("FG(220)")
  args.textError = _$(args.textError, "textError").isString().default("BG(196),FG(255),BOLD")
  args.theme     = _$(args.theme, "theme").isString().default("doubleLineBothSides")
  args.emoticons = _$(args.emoticons, "emoticons").toBoolean().isBoolean().default(true)
  args.signs     = _$(args.signs, "signs").isMap().default({
    checkpoint: 0x1F37A,
    assert    : 0x1F44D,
    print     : 0x1F50E,
    error     : 0x1F621,
    time      : "🕒",
    count     : "🧮"
  })
  args.includeTime = _$(args.includeTime, "includeTime").toBoolean().isBoolean().default(false)
  args.filter = _$(args.filter, "filter").default([])

  if (!isArray(args.filter)) args.filter = [ args.filter ]
  if (!isMap(global._debugData)) global._debugData = { p: { } }
  if (!isObject(global._debugTime)) global._debugTime = $atomic(0, "long")

  // Determine if code is a file or actual code
  var code
  if (aCode.indexOf("\n") >= 0) {
    code = aCode
  } else {
    if (io.fileExists(aCode)) {
      code = io.readFileString(aCode)
    } else {
      //throw "File '" + aCode + "' not found."
      code = aCode
    }
  }
    
  var _m = (s, c) => {
    var _s = ";try{"
    if (args.filter.length > 0) _s += "if(_debugPrefix.split(' > ').filter(r=>" + stringify(args.filter,__,"") + ".indexOf(r)>=0).length > 0) {"
    if (isDef(c)) _s += "if(" + c + ") {"
    var _t = (args.includeTime ? "(new Date()).toISOString() +\" | \" + " : "")
    _t += "_debugPrefix + "
    _s += "cprint(ow.format.withSideLine(" + _t + s + ", __, \"" + args.lineColor + "\", \"" + args.textColor + "\", ow.format.withSideLineThemes()." + args.theme + ")) "
    if (isDef(c)) _s += "}"
    if (args.filter.length > 0) _s += "}"
    _s += "}catch(__e_debug){cprint(ow.format.withSideLine(" + _t + "'" + sign.error + " ' + String(__e_debug), __, \"" + args.lineError + "\", \"" + args.textError + "\", ow.format.withSideLineThemes()." + args.theme + "))};"
    return _s
  }

  var _s = s => {
    return s.replace(/\$\{([^ \{\}]+)\}/g, "' + $1 + '")
  }

  var _pb = ";{let _ini=now();"
  var _pe = ";global._debugTime.getAdd(now()-_ini);}"

  var sign = {}
  if (args.emoticons) {
    sign = args.signs
    if (isNumber(sign.checkpoint)) sign.checkpoint = ow.format.string.unicode(sign.checkpoint)
    if (isNumber(sign.assert)) sign.assert = ow.format.string.unicode(sign.assert)
    if (isNumber(sign.print)) sign.print = ow.format.string.unicode(sign.print)
    if (isNumber(sign.error)) sign.error = ow.format.string.unicode(sign.error)
  }
  sign.checkpoint = _$(sign.checkpoint).default("@")
  sign.assert     = _$(sign.assert).default("#")
  sign.print      = _$(sign.print).default("?")
  sign.error      = _$(sign.error).default("!")
  sign.time       = _$(sign.time).default(":")
  sign.count      = _$(sign.count).default("n")

  if (isString(aPrefix)) 
    code = "\nvar _debugPrefix = ''\n//{ " + aPrefix + "\n" + code + "\n//} " + aPrefix + "\n"
  else
    code = "\nvar _debugPrefix = ''\n" + code 

  code = code.split(/\r\n|\n/).map(line => {
    var l

    // checkpoint equivalent
    l = line.trim().match(/\/\/\@ (.+)$/)
    if (isArray(l)) {
      var s = _s(l[1].replace(/\'/g, "\\\'"))
      line = line.replace(/\/\/\@ (.+)$/, _pb + _m("'" + sign.checkpoint + " " + s + "'") + _pe)
    }

    // profile end equivalent
    l = line.trim().match(/\/\/\] (.+)$/)
    if (isArray(l)) {
      var s = _s(l[1].replace(/\'/g, "\\\'"))
      line = line.replace(/\/\/\] (.+)$/, _pb + _m("\"" + sign.time + " " + s + " =  \" + ow.format.elapsedTime4ms(now() - global._debugTime.get() - global._debugData['" + s + "'])") + _pe)
    }

    // profile end equivalent with prefix
    l = line.trim().match(/\/\/\]\} (.+)$/)
    if (isArray(l)) {
      var s = _s(l[1].replace(/\'/g, "\\\'"))
      line = line.replace(/\/\/\]\} (.+)$/, _pb + _m("\"" + sign.time + " = \" + ow.format.elapsedTime4ms(now() - global._debugTime.get() - global._debugData['" + s + "'])") + ";_debugPrefix=_debugPrefix.replace('" + s + " > ', '');" + _pe)
    }

    // block begin equivalent with prefix
    l = line.trim().match(/\/\/\{ (.+)$/)
    if (isArray(l)) {
      var s = _s(l[1].replace(/\'/g, "\\\'"))
      line = line.replace(/\/\/\{ (.+)$/, _pb + ";_debugPrefix+='" + s + " > ';" + _pe)
    }

    // block end equivalent
    l = line.trim().match(/\/\/\} (.+)$/)
    if (isArray(l)) {
      var s = _s(l[1].replace(/\'/g, "\\\'"))
      line = line.replace(/\/\/\} (.+)$/, _pb + ";_debugPrefix=_debugPrefix.replace('" + s + " > ', '');" + _pe)
    }

    // profile begin equivalent
    l = line.trim().match(/\/\/\[ (.+)$/)
    if (isArray(l)) {
      var s = l[1].replace(/\'/g, "\\\'")
      line = line.replace(/\/\/\[ (.+)$/, _pb + ";global._debugData['" + s.replace(/\'/g, "\\\"") + "']=now()-global._debugTime.get();" + _pe)
    }

    // profile begin equivalent with prefix
    l = line.trim().match(/\/\/\{\[ (.+)$/)
    if (isArray(l)) {
      var s = _s(l[1].replace(/\'/g, "\\\'"))
      line = line.replace(/\/\/\{\[ (.+)$/, _pb + ";_debugPrefix+='" + s + " > ';global._debugData['" + s + "']=now()-global._debugTime.get();" + _pe)
    }

    // increment equivalent
    l = line.trim().match(/\/\/\+ (.+)$/)
    if (isArray(l)) {
      var s = l[1].replace(/\'/g, "\\\'")
      if (isUnDef($get("__debug::" + s))) $set("__debug::" + s, $atomic())
      line = line.replace(/\/\/\+ (.+)$/, _pb + _m("\"" + sign.count + " " + s.replace(/\"/g, "\\\"") + ": \" + $get(\"__debug::" + s.replace(/\"/g, "\\\"") + "\").inc()") + _pe)
    }

    // decrement equivalent
    l = line.trim().match(/\/\/\- (.+)$/)
    if (isArray(l)) {
      var s = l[1].replace(/\'/g, "\\\'")
      if (isUnDef($get("__debug::" + s))) $set("__debug::" + s, $atomic())
      line = line.replace(/\/\/\- (.+)$/, _pb + _m("\"" + sign.count + " " + s.replace(/\"/g, "\\\"") + ": \" + $get(\"__debug::" + s.replace(/\"/g, "\\\"") + "\").dec()") + _pe)
    }

    // assert equivalent
    l = line.trim().match(/\/\/\# (.+)$/)
    if (isArray(l)) {
      var s = l[1]
      line = line.replace(/\/\/\# (.+)$/, _pb + _m("\"" + sign.assert + " " + s.replace(/\"/g, "\\\"") + "\"", s) + _pe)
    }

    // print equivalent
    l = line.trim().match(/\/\/\? (.+)$/)
    if (isArray(l)) {
      var s = l[1].replace(/\"/g, "\\\"")
      line = line.replace(/\/\/\? (.+)$/, _pb + _m("\""+ sign.print + " " + s.replace(/\"/g, "\\\"") + " = \" + stringify(" + l[1] + ") + \"\"") + _pe)
    }

    // json print equivalent
    l = line.trim().match(/\/\/\?j (.+)$/)
    if (isArray(l)) {
      var s = l[1].replace(/\"/g, "\\\"")
      line = line.replace(/\/\/\?j (.+)$/, _pb + _m("\""+ sign.print + " " + s.replace(/\"/g, "\\\"") + " = \" + stringify(" + l[1] + ") + \"\"") + _pe)
    }

    // slon print equivalent
    l = line.trim().match(/\/\/\?s (.+)$/)
    if (isArray(l)) {
      var s = l[1].replace(/\"/g, "\\\"")
      line = line.replace(/\/\/\?s (.+)$/, _pb + _m("\"" + sign.print + " " + s.replace(/\"/g, "\\\"") + " = \" + af.toSLON(" + l[1] + ") + \"\"") + _pe)
    }

    // yaml print equivalent
    l = line.trim().match(/\/\/\?y (.+)$/)
    if (isArray(l)) {
      var s = l[1].replace(/\"/g, "\\\"")
      line = line.replace(/\/\/\?y (.+)$/, _pb + _m("\"" + sign.print + " " + s.replace(/\"/g, "\\\"") + " = \\n\" + af.toYAML(" + l[1] + ") + \"\"") + _pe)
    }

    // tree print equivalent
    l = line.trim().match(/\/\/\?r (.+)$/)
    if (isArray(l)) {
      var s = l[1].replace(/\"/g, "\\\"")
      line = line.replace(/\/\/\?r (.+)$/, _pb + _m("\"" + sign.print + " " + s.replace(/\"/g, "\\\"") + " = \\n\" + printTree(" + l[1] + ",__,{bgcolor:\"" + args.textColor.split(",").filter(r=>r.toUpperCase().startsWith("BG")).join(",") + "\"}) + \"\"") + _pe)
    }

    // table print equivalent
    l = line.trim().match(/\/\/\?t (.+)$/)
    if (isArray(l)) {
      var s = l[1].replace(/\"/g, "\\\"")
      line = line.replace(/\/\/\?t (.+)$/, _pb + _m("\"" + sign.print + " " + s.replace(/\"/g, "\\\"") + " = \\n\" + printTable(" + l[1] + ",__,true,__,__,\"" + args.textColor.split(",").filter(r=>r.toUpperCase().startsWith("BG")).join(",") + "\") + \"\"") + _pe)
    }

    return line
  }).join("\n")

  if (returnCode) return code; else af.eval(code)
}