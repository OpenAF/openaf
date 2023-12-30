// OpenWrap v2
// Copyright 2023 Nuno Aguiar
// oBook
 
OpenWrap.oBook = function() {
	return ow.oBook
};


OpenWrap.oBook.prototype.book = function(aBook, exitOnEnd) {
    if (isString(aBook) && aBook.indexOf("\n") < 0 && io.fileExists(aBook)) aBook = io.readFileString(aBook)

    this.book = isString(aBook) ? aBook : ""
    this.pos = -1
    this.struct = isArray(aBook) ? aBook : []
    this._show = true
    this.exitOnEnd = _$(exitOnEnd, "exitOnEnd").isBoolean().default(false)

    if (isString(aBook)) this.parse()
}

OpenWrap.oBook.prototype.book.prototype.printPart = function(partId) {
    _$(partId).isNumber().$_()

    var thm = ow.format.withSideLineThemes().simpleLineWithTips
    thm.rtop    = thm.ltop
    thm.rmiddle = thm.lmiddle
    thm.rbottom = thm.lbottom

    var head = ansiColor("YELLOW,BOLD", "[" + (partId+1) + "/" + this.struct.length + "]\n\n")
    var txt = this.struct[partId].text
    var includeCode = false
    if (this.struct[partId].code.split("\n").length > 1) {
        includeCode = true
        this.includeCodeLines = this.struct[partId].code.split("\n").length-1
        __pinprefix = this.includeCodeLines+1
    } else {
        this.includeCodeLines = 0
        __pinprefix = ""
    }
    
    //if (includeCode) txt += "\n" + this.struct[partId].code + "\n"
    print(ow.format.withSideLine(head + ow.format.withMD(txt), __, "YELLOW", __, thm))
    if (includeCode) print(ansiColor("ITALIC,WHITE", "Copy+paste the following code or adapt it, if needed, as instructed:\n\n") + this.struct[partId].code)

    if (!includeCode) {
        if (this.struct[partId].code.length > 0) {
            print(ansiColor("ITALIC,WHITE", "Execute the following code or adapt it, if needed, as instructed:"))
            con.getConsoleReader().getCursorBuffer().write(this.struct[partId].code.trim())
        } else {
            this.interaction()
        }
    }
}

OpenWrap.oBook.prototype.book.prototype.bookEnd = function() {
    watchLine    = ""
    watchCommand = false

    var thm = ow.format.withSideLineThemes().openTopCurvedRect

    print(ow.format.withSideLine(ow.format.withMD("(📖 obook end)"), __, "YELLOW", __, thm))
    if (this.exitOnEnd) exit(0)
}

OpenWrap.oBook.prototype.book.prototype.bookStart = function() {
    var thm = ow.format.withSideLineThemes().openBottomCurvedRect

    print(ow.format.withSideLine(ow.format.withMD("(📖 obook start)"), __, "YELLOW", __, thm))
}

OpenWrap.oBook.prototype.book.prototype.interaction = function() {
    if (this.pos == -1) {
        this.printPart(++this.pos)
    } else {
        if (this.pos > (this.struct.length)) {
            this._show = false
        }

        if (this._show && this.includeCodeLines <= 0) {
            var _out = false
            var _msg = ""
            do {
                // Position check
                var _pos = ""

                if (this.pos < 0) this.pos = -1
                if (this.pos < (this.struct.length-1)) {
                    _pos = "to show [" + (this.pos+2) + "/" + this.struct.length + "]"
                    this._show = true
                }
                if (this.pos >= (this.struct.length-1)) {
                    this.pos = this.struct.length-1
                    _pos = "to end"
                    this._show = false
                }
                
                _msg = "\r(" + _pos + " press enter, for others use up/down keys, to continue entering commands Ctrl+U and to quit press 'q')"
                printnl(_msg)
                var _c = String(con.readChar("")).charCodeAt(0)

                // Keyboard check
                if (_c == 27) {
                    // esc
                    _c = String(con.readChar("")).charCodeAt(0)
                    
                    if (_c == 27) {
                        this._show = false
                        _out = true
                    }
                    if (_c == 91 || _c == 79) {
                        _c = String(con.readChar("")).charCodeAt(0)

                        // others
                        switch(_c) {
                        case 65: // up
                            this.pos--
                            _out = false
                            break
                        case 66: // down
                            this.pos++
                            _out = false
                            break
                        case 13: // enter
                        case 32: // space
                            _out = true
                            this.pos++
                            break
                        default:
                        }
                    }
                }
                if (_c == 21) {
                    // ctrl+U
                    this._show = false
                    _out = true
                }
                if (_c == 13) {
                    // enter
                    _out = true
                    this.pos++
                }
                if (_c == 113) {
                    // q
                    this._show = false
                    _out = true
                    this.pos = this.struct.length
                }
                printnl("\r" + repeat(_msg.length, " ") + "\r")
            } while(_out == false)
            
            if (this._show) {
                this.printPart(this.pos)
            } else {
                if (this.pos >= (this.struct.length-1)) this.bookEnd()
            }
        } else {
            if (this.includeCodeLines > 0) {
                __pinprefix = this.includeCodeLines
                this.includeCodeLines--
            } 
            this._show = true
        }
    }
}

OpenWrap.oBook.prototype.book.prototype.parse = function() {
    this.struct = []

    var _cleanup = s => {
        if (isString(s)) {
            return s.trim()
        } else {
            return ""
        }
    }

    var ro = this.book.match(/^\*requires (.+) >= (.+)\*/m)
    if (isArray(ro) && ro.length > 0) {
        ro.forEach(r => {
            var _r = r.match(/^\*requires (.+) >= (.+)\*/)
            if (_r && _r.length == 3) {
                includeOPack(_r[1], _r[2])
            }
        })
    }

    var lst = this.book.replace(/````javascript\n([^`]+)````/mg, "````````\n$1````````").split(/````````\w*/)
    for(var i = 0; i < lst.length; i = i + 2) {
        if ((isString(lst[i]) && lst[i].length > 0) || 
            (isString(lst[i+1]) && lst[i+1].length > 0)) {
            this.struct.push({
                text: _cleanup(lst[i]),
                code: _cleanup(lst[i+1])
            })
        }
    }
}

const obook = function(aBook, exitOnEnd) {
    global._obook = new ow.oBook.book(aBook, exitOnEnd)
    watchLine = "_obook.interaction()"
    watchCommand = true
    global._obook.bookStart()
}