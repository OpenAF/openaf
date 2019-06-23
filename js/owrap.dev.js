// OpenWrap
// Author: Nuno Aguiar
// Dev

OpenWrap.dev = function() {
	return ow.dev;
};

OpenWrap.dev.prototype.loadPoolDB = function() {
	ow.loadCh();
	ow.loadObj();

	ow.ch.__types.pooldb = {
		__o: { },
		create       : function(aName, shouldCompress, options) { 
			this.__o[aName] = options || {};
			
			if (isUnDef(this.__o[aName].dbPool)) {
				this.__o[aName].dbPool = ow.obj.pool.DB("org.h2.Driver", "jdbc:h2:mem:", "sa", "sa");
			}

			if (isUnDef(this.__o[aName].tableName)) {
				throw "Need a specific options.tableName";
			}
		},
		destroy      : function(aName) { },
		size         : function(aName) { 
			var parent = this, res;
			this.__o[aName].dbPool.use((aDb) => {
				res = Number(aDb.q("select count(*) C from " + parent.__o[aName].tableName).results[0].C);
			});

			return res;
		},
		forEach      : function(aName, aFunction, x) { },
		getKeys      : function(aName, full) { },
		getSortedKeys: function(aName, full) { },
		getSet       : function getSet(aName, aMatch, aK, aV, aTimestamp)  { },
		set          : function(aName, ak, av, aTimestamp) { },
		setAll       : function(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp) { },
		get          : function(aName, aKey) { },
		pop          : function(aName) { },
		shift        : function(aName) { },
		unset        : function(aName, aKey) { }
	};
};

OpenWrap.dev.prototype.loadIgnite = function(aGridName, aIgnite, secretKey, isClient) {
	ow.dev.__i = [];

	var initI = () => {
		plugin("Ignite");
		var grid = (isUnDef(aGridName)) ? "default" : aGridName;
		if (isUnDef(aIgnite)) {
			ow.dev.__i[grid] = new Ignite();
			ow.dev.__i[grid].start(aGridName, secretKey, isClient);
		} else {
			ow.dev.__i[grid] = aIgnite;
		}
	};

	oPromise.prototype.thenAny = function(aFunc, aRejFunc, aGridName) {
		if (isUnDef(ow.dev.__i)) initI();
		return this.then(() => {
			var grid = (isUnDef(aGridName)) ? "default" : aGridName;
			return ow.dev.__i[grid].call(ow.dev.__i[grid].getIgnite(), aFunc.toSource().replace(/[^{]*{([\s\S]*)}[^}]*/, "$1").replace(/"/mg, "\\\""));
		}, aRejFunc);
	};


	oPromise.prototype.thenAll = function(aFunc, aRejFunc, aGridName) {
		if (isUnDef(ow.dev.__i)) initI();
		return this.then(() => {
			var grid = (isUnDef(aGridName)) ? "default" : aGridName;
			return ow.dev.__i[grid].broadcast(ow.dev.__i[grid].getIgnite(), aFunc.toSource().replace(/[^{]*{([\s\S]*)}[^}]*/, "$1").replace(/"/mg, "\\\""));
		}, aRejFunc);
	};

	initI();
};

OpenWrap.dev.prototype.table = function(aValue, aWidth, aTheme, useAnsi) {
    // replace(\033\[[0-9;]*m/g, "")
	
    __initializeCon();
    var matrix = [], matrixrule = [], maxX = 0, maxY = 0, cM = [], al = [];

    var _getColor = (aValue) => {
       if (isNumber(aValue)) return __colorFormat.number;
       if (isString(aValue)) return __colorFormat.string;
       if (isBoolean(aValue)) return __colorFormat.boolean;
       return __colorFormat.default;
    }

    var _r = (aValue, igX, igY) => {
        if (isMap(aValue) || isArray(aValue)) {
            igX = _$(igX).isNumber().default(0);
            igY = _$(igY).isNumber().default(0);

            var x = igX, y = igY;
            if (isMap(aValue)) {
		var origX = x;
                for(var key in aValue) {
			
                    var value = aValue[key];

		    origX = x;
                    if (isUnDef(matrix[x])) matrix[x] = [];
                    matrix[x][igY] = key + ":"; 
                    if (useAnsi) {
                        if (isUnDef(cM[x])) cM[x] = [];
			if (isUnDef(al[x])) al[x] = [];
                        cM[x][igY] = __colorFormat.key;
			al[x][igY] = "r";
                    }
                    if (!isMap(value) && !isArray(value)) {
                        matrix[x][igY + 1] = String(value);
			al[x][igY + 1] = "l";
                        if (useAnsi) {
                            if (isUnDef(cM[x])) cM[x] = [];
                            cM[x][igY + 1] = _getColor(value);
                        }
                        x++;
                    } else {
			if (x != 0 && matrixrule.indexOf(x-1) < 0) matrixrule.push(x);
                        x = x + _r(value, x, igY + 1) - 1;
                    }
                }
                if (Object.keys(aValue).length == 0) {
                    matrix[x][igY] = "{}";
		    al[x][igY] = "c";
                    matrix[x][igY + 1] = "-";
		    al[x][igY + 1] = "l";
                    if (useAnsi) {
                        if (isUnDef(cM[x])) cM[x] = [];
                        cM[x][igY] = __colorFormat.key;
                        cM[x][igY + 1] = _getColor(void 0);
                    }
		    x++;
                }
                matrixrule.push(x);
	        x++;
            }
            if (isArray(aValue)) {
                var origX = x;
                for(var ii in aValue) {
                    var o = aValue[ii];

                    origX = x;
                    if (isUnDef(matrix[x])) matrix[x] = [];
		    if (isUnDef(al[x])) al[x] = [];
                    matrix[x][igY] = "[" + ii + "]"; 
		    al[x][igY] = "r";
                    if (useAnsi) {
                        if (isUnDef(cM[x])) cM[x] = [];
                        cM[x][igY] = __colorFormat.key;
                    }

                    if (!isMap(o) && !isArray(o)) {
                        matrix[x][igY + 1] = String(o); 
			al[x][igY + 1] = "l";
                        if (useAnsi) {
                            if (isUnDef(cM[x])) cM[x] = [];
                            cM[x][igY + 1] = _getColor(o);
                        }
                        x++;
                    } else {
			if (x != 0 && matrixrule.indexOf(x-1) < 0) matrixrule.push(x)
                        x = x + _r(o, x, igY + 1) - 1;
                    }
                }
                if (aValue.length == 0) {
                    matrix[x][igY] = "[]";
		    al[x][igY] = "c";
                    matrix[x][igY + 1] = "-";
		    al[x][igY + 1] = "l";
                    if (useAnsi) {
                        if (isUnDef(cM[x])) cM[x] = [];
                        cM[x][igY] = __colorFormat.key;
                        cM[x][igY + 1] = _getColor(void 0); 
                    }
		    x++;
                }
                matrixrule.push(x);
                x++;
            }

            return x - igX;
        }

        return 0;
    };

    _r(aValue);
    maxX = matrix.length;
    for(var x in matrix) {
        if (maxY < matrix[x].length) maxY = matrix[x].length;
    }


    var cM2EmptyLine = () => { cM2[cm2Line] = []; for(var y = 0; y < maxY; y++) { cM2[cm2Line][y] = "" }; cm2Line++; };
    var cM2 = [], cm2Line = 0; 
    var out = new Packages.de.vandermeer.asciitable.v2.V2_AsciiTable();
    out.addRule(); cM2EmptyLine();
    for(var x = 0; x < maxX; x++) {
        if (matrixrule.indexOf(x) >= 0) { out.addRule(); cM2EmptyLine(); } 
        if (isUnDef(matrix[x])) matrix[x] = [];
	if (isUnDef(al[x])) al[x] = [];
	if (isUnDef(cM2[cm2Line])) cM2[cm2Line] = [];
        for (var y = 0; y < maxY; y++) {            
            if (isUnDef(matrix[x][y])) {
                matrix[x][y] = "";
		al[x][y] = "l";
		cM2[cm2Line][y] = "";
            } else {
	        cM2[cm2Line][y] = cM[x][y];
	    }
        }
	cm2Line++;
        out.addRow.apply(out, matrix[x]).setAlignment(al[x]);
    }
    out.addRule(); cM2EmptyLine(); 
    global.__matrix = matrix;
    global.__matrixrule = matrixrule;
    global.__cm = cM2;

    aTheme = _$(aTheme).default(Packages.de.vandermeer.asciitable.v2.themes.V2_E_TableThemes.UTF_LIGHT.get());
    aWidth = _$(aWidth).isNumber().default(__con.getTerminal().getWidth() - 1);
    var rt = new Packages.openaf.asciitable.render.AnsiAsciiTableRenderer(true);
    rt.setTheme(aTheme);
    rt.setWidth(new Packages.openaf.asciitable.render.WidthAnsiLongestWordTab(aWidth));
    var o;
    if (useAnsi) 
        o = String(rt.render(out, cM2));
    else
        o = String(rt.render(out));
    if (o.indexOf("\n") > aWidth) {
        rt.setWidth(new Packages.openaf.asciitable.render.WidthAnsiLongestWordTab(aWidth - (o.indexOf("\n")- aWidth)));
        o = String(rt.render(out));
    }

    return o;
};

OpenWrap.dev.prototype.view = function(aObj) {
    ansiStart(); 
    print(ow.dev.table(aObj, void 0, void 0, true)); 
    ansiStop();
};
