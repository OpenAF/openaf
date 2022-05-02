// OpenWrap v2
// Author: Nuno Aguiar
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
        __preCompileLevel = 0
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
        __preCompileLevel = 2
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
 *   //[  begin of unique profile block\
 *   //]  end of unique profile block\
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
 * <key>ow.debug.debug(aCode, args, aReturnCode) : String</key>
 * Parses aCode for debug comments and replaces the appropriate code. The comments code that can be used are:\
 * \
 *   //@  This is a checkpoint on the code you want to know it was reached\
 *   //#  assertVarA == assertVarB\
 *   //?  printVarA\
 *   //?s printInSLONVarA\
 *   //?y printInYAMLVarA\
 *   //[  begin of unique profile block\
 *   //]  end of unique profile block\
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
OpenWrap.debug.prototype.debug = function(aCode, args, returnCode) {
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
    time      : "🕒"
  })
  args.includeTime = _$(args.includeTime, "includeTime").toBoolean().isBoolean().default(false)
  
  if (!isMap(global._debugData)) global._debugData = { p: { } }

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
    if (isDef(c)) _s += "if(" + c + ") {"
    var _t = (args.includeTime ? "(new Date()).toISOString() +\" | \" + " : "")
    _s += "cprint(ow.format.withSideLine(" + _t + s + ", __, \"" + args.lineColor + "\", \"" + args.textColor + "\", ow.format.withSideLineThemes()." + args.theme + ")) "
    if (isDef(c)) _s += "}"
    _s += "}catch(__e_debug){cprint(ow.format.withSideLine(" + _t + "'" + sign.error + " ' + String(__e_debug), __, \"" + args.lineError + "\", \"" + args.textError + "\", ow.format.withSideLineThemes()." + args.theme + "))};"
    return _s
  }

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

  code = code.split(/\r\n|\n/).map(line => {
    var l

    // checkpoint equivalent
    l = line.trim().match(/\/\/\@ (.+)$/)
    if (isArray(l)) {
      var s = l[1].replace(/\"/g, "\\\"")
      line = line.replace(/\/\/\@ (.+)$/, _m("\"" + sign.checkpoint + " " + s + "\""))
    }

    // profile end equivalent
    l = line.trim().match(/\/\/\] (.+)$/)
    if (isArray(l)) {
      var s = l[1]
      line = line.replace(/\/\/\] (.+)$/, _m("\"" + sign.time + " " + s.replace(/\"/g, "\\\"") + ": \" + ow.format.elapsedTime4ms(now() - global._debugData['" + s.replace(/\'/g, "\\\'") + "'])"))
    }

    // profile begin equivalent
    l = line.trim().match(/\/\/\[ (.+)$/)
    if (isArray(l)) {
      var s = l[1].replace(/\'/g, "\\\'")
      line = line.replace(/\/\/\[ (.+)$/, ";global._debugData['" + s + "']=now();")
    }

    // assert equivalent
    l = line.trim().match(/\/\/\# (.+)$/)
    if (isArray(l)) {
      var s = l[1]
      line = line.replace(/\/\/\# (.+)$/, _m("\"" + sign.assert + " " + s.replace(/\"/g, "\\\"") + "\"", s))
    }

    // print equivalent
    l = line.trim().match(/\/\/\? (.+)$/)
    if (isArray(l)) {
      var s = l[1].replace(/\"/g, "\\\"")
      line = line.replace(/\/\/\? (.+)$/, _m("\""+ sign.print + " " + s + " = \" + stringify(" + l[1] + ") + \"\""))
    }

    // slon print equivalent
    l = line.trim().match(/\/\/\?s (.+)$/)
    if (isArray(l)) {
      var s = l[1].replace(/\"/g, "\\\"")
      line = line.replace(/\/\/\?s (.+)$/, _m("\"" + sign.print + " " + s + " = \" + af.toSLON(" + l[1] + ") + \"\""))
    }

    // yaml print equivalent
    l = line.trim().match(/\/\/\?y (.+)$/)
    if (isArray(l)) {
      var s = l[1].replace(/\"/g, "\\\"")
      line = line.replace(/\/\/\?y (.+)$/, _m("\"" + sign.print + " " + s + " = \\n\" + af.toYAML(" + l[1] + ") + \"\""))
    }

    return line
  }).join("\n")

  if (returnCode) return code; else af.eval(code)
}