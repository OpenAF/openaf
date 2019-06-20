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

OpenWrap.dev.prototype.table = function(aValue, aWidth, aTheme, useAnsi, colorMap) {
    if (isUnDef(colorMap)) colorMap = {};
    if (isUnDef(colorMap.lines)) colorMap.title = "bold";
    if (isUnDef(colorMap.values)) colorMap.values = "CYAN";

    // replace(\033\[[0-9;]*m/g, "")
	
    __initializeCon();
    var matrix = [], matrixrule = [], maxX = 0, maxY = 0;

    var _r = (aValue, igX, igY) => {
        if (isMap(aValue) || isArray(aValue)) {
            igX = _$(igX).isNumber().default(0);
            igY = _$(igY).isNumber().default(0);

            var x = igX, y = igY;
            if (isMap(aValue)) {
                for(var key in aValue) {
                    var value = aValue[key];
                    var origX = x;

                    if (isUnDef(matrix[x])) matrix[x] = [];
					if (!useAnsi) matrix[x][igY] = key; else matrix[x][igY] = ansiColor(colorMap.title, key);
                    if (!isMap(value) && !isArray(value)) {
					if (!useAnsi) matrix[x][igY + 1] = String(value); else matrix[x][igY + 1] = ansiColor(colorMap.values, String(value));
                        x++;
                    } else {
                        x = x + _r(value, x, igY + 1);
                    }
                }
                matrixrule.push(x);
            }
            if (isArray(aValue)) {
                for(var ii in aValue) {
                    var o = aValue[ii];

                    var origX = x;
                    if (isUnDef(matrix[x])) matrix[x] = [];
					if (!useAnsi) matrix[x][igY] = ii; else matrix[x][igY] = ansiColor(colorMap.title, ii);
                    if (!isMap(o) && !isArray(o)) {
					if (!useAnsi) matrix[x][igY + 1] = String(o); else matrix[x][igY + 1] = ansiColor(colorMap.values, String(o));
                        x++;
                    } else {
                        x = x + _r(o, x, igY + 1);
                    }
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

    var out = new Packages.de.vandermeer.asciitable.v2.V2_AsciiTable();
    out.addRule();
    for(var x = 0; x < maxX; x++) {
        if (matrixrule.indexOf(x) >= 0) out.addRule();
        if (isUnDef(matrix[x])) matrix[x] = [];
        for (var y = 0; y < maxY; y++) {            
            if (isUnDef(matrix[x][y])) {
                matrix[x][y] = "";
            }
        }
        out.addRow.apply(out, matrix[x]);
    }
    out.addRule();

    aTheme = _$(aTheme).default(Packages.de.vandermeer.asciitable.v2.themes.V2_E_TableThemes.UTF_LIGHT.get());
    aWidth = _$(aWidth).isNumber().default(__con.getTerminal().getWidth() - 1);
    var rt = new Packages.de.vandermeer.asciitable.v2.render.V2_AsciiTableRenderer();
    rt.setTheme(aTheme);
    rt.setWidth(new Packages.de.vandermeer.asciitable.v2.render.WidthLongestWordMaxCol(aWidth));
    var o = String(rt.render(out));
    if (o.indexOf("\n") > aWidth) {
        rt.setWidth(new Packages.de.vandermeer.asciitable.v2.render.WidthLongestWordMaxCol(aWidth - (o.indexOf("\n")- aWidth)));
        o = String(rt.render(out));
    }

    return o;
};
