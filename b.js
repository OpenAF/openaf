$ch("a").create();
$ch("b").create();

ow.ch.__types.all = {
    __channels: {},
    create       : function(aName, shouldCompress, options) {
        options = _$(options, "options").isMap().default({});
        options.list = _$(options.list, "list").isArray().default([]);
        options.type = _$(options.type, "type").isString().default("priority");

        for(var ii = 0; ii < options.list[ii]; ii++) {
            if (isObject(options.list[ii]) && isDef(options.list[ii].getName)) {
                options.list[ii] = {
                    ch: options.list[ii].getName(),
                    p : 0
                };
            }
            if (isString(options.list[ii])) {
                options.list[ii] = {
                    ch: options.list[ii],
                    p : 0
                };
            }
        }

        this.__channels[aName] = options;
    },
    destroy      : function(aName) {
        delete this.__channels[aName];
    },
    size         : function(aName) {
        var ops = this.__channels[aName];
        var res;

        switch(ops.type) {
        case "union"   :
            $from(ops.list)
            .select(r => {
                try {
                    if (isUnDef(res)) res = 0;
                    res += $ch(r).size();
                } catch(e) {}
            });
            break;
        case "priority":
            $from(ops.list)
            .sort("p")
            .select(r => {
                try {
                    if (isUnDef(res)) res = $ch(r).size();
                } catch(e) {}
            });
            break;
        }

        return res;
    },
    forEach      : function(aName, aFunction) {
        var ops = this.__channels[aName];
        var res;

        switch(ops.type) {
        case "union"   :
            $from(ops.list)
            .sort("p")
            .select(r => {
                $ch(r).forEach(aFunction);
            });
            break;
        case "priority":
            $from(ops.list)
            .sort("p")
            .select(r => {
                try {
                    if (isUnDef(res)) {
                        $ch(r).forEach(aFunction);
                        res = true;
                    }
                } catch(e) {}
            });
            break;
        }

        return void 0;
    },
    getAll      : function(aName, full) {
        var ops = this.__channels[aName];
        var res;

        switch(ops.type) {
        case "union"   :
            $from(ops.list)
            .sort("p")
            .select(r => {
                res = _$(res).default([]);
                res = res.concat($ch(r).getAll(full));
            });
            break;
        case "priority":
            $from(ops.list)
            .sort("p")
            .select(r => {
                try {
                    if (isUnDef(res)) res = $ch(r).getAll(full);
                } catch(e) {}
            });
            break;
        }

        return res;
    },
    getKeys      : function(aName, full) {
        var ops = this.__channels[aName];
        var res;

        switch(ops.type) {
        case "union"   :
            $from(ops.list)
            .sort("p")
            .select(r => {
                res = _$(res).default([]);
                res = res.concat($ch(r).getKeys(full));
            });
            break;
        case "priority":
            $from(ops.list)
            .sort("p")
            .select(r => {
                try {
                    if (isUnDef(res)) res = $ch(r).getKeys(full);
                } catch(e) {}
            });
            break;
        }

        return res;
    },
    getSortedKeys: function(aName, full) {
        var ops = this.__channels[aName];
        var res;

        switch(ops.type) {
        case "union"   :
            $from(ops.list)
            .sort("p")
            .select(r => {
                res = _$(res).default([]);
                res = res.concat($ch(r).getSortedKeys(full));
            });
            break;
        case "priority":
            $from(ops.list)
            .sort("p")
            .select(r => {
                try {
                    if (isUnDef(res)) res = $ch(r).getSortedKeys(full);
                } catch(e) {}
            });
            break;
        }

        return res;		
    },
    getSet       : function getSet(aName, aMatch, aK, aV, aTimestamp)  {
        /*var res;
        res = this.get(aName, aK);
        if ($stream([res]).anyMatch(aMatch)) {
            return this.set(aName, aK, aV, aTimestamp);
        }
        return void 0;*/
    },
    set          : function(aName, aK, aV, aTimestamp) {
        var ops = this.__channels[aName];
        var res;

        switch(ops.type) {
        case "union"   :
            $from(ops.list)
            .sort("p")
            .select(r => {
                res = $ch(r).set(aK, aV, aTimestamp);
            });
            break;
        case "priority":
            $from(ops.list)
            .sort("p")
            .select(r => {
                try {
                    if (isUnDef(res)) res = $ch(r).set(aK, aV, aTimestamp);
                } catch(e) {}
            });
            break;
        }

        return res;
    },
    setAll       : function(aName, aKs, aVs, aTimestamp) {
        var ops = this.__channels[aName];
        var res;

        switch(ops.type) {
        case "union"   :
            $from(ops.list)
            .sort("p")
            .select(r => {
                res = $ch(r).setAll(aKs, aVs, aTimestamp);
            });
            break;
        case "priority":
            $from(ops.list)
            .sort("p")
            .select(r => {
                try {
                    if (isUnDef(res)) res = $ch(r).setAll(aKs, aVs, aTimestamp);
                } catch(e) {}
            });
            break;
        }

        return res;
    },
    unsetAll     : function(aName, aKs, aVs, aTimestamp) {
        var ops = this.__channels[aName];
        var res;

        switch(ops.type) {
        case "union"   :
            $from(ops.list)
            .sort("p")
            .select(r => {
                res = $ch(r).unsetAll(aKs, aVs, aTimestamp);
            });
            break;
        case "priority":
            $from(ops.list)
            .sort("p")
            .select(r => {
                try {
                    if (isUnDef(res)) res = $ch(r).unsetAll(aKs, aVs, aTimestamp);
                } catch(e) {}
            });
            break;
        }

        return res;
    },		
    get          : function(aName, aK) {
        var ops = this.__channels[aName];
        var res;

        switch(ops.type) {
        case "union"   :
        case "priority":
            $from(ops.list)
            .sort("p")
            .select(r => {
                try {
                    if (isUnDef(res)) res = $ch(r).get(aK);
                } catch(e) {}
            });
            break;
        }

        return res;
    },
    pop          : function(aName) {
        //var elems = this.getSortedKeys(aName);
        //var elem = elems[elems.length - 1];
        //var res = clone(this.get(aName, elem));
        //this.unset(aName, elem);
        //return elem;
    },
    shift        : function(aName) {
        //var elems = this.getSortedKeys(aName);
        //var elem = elems[0];
        //var res = clone(this.get(aName, elem));
        //this.unset(aName, elem);
        //return elem;
    },
    unset        : function(aName, aK, aTimestamp) {
        var ops = this.__channels[aName];
        var res;

        switch(ops.type) {
        case "union"   :
            $from(ops.list)
            .sort("p")
            .select(r => {
                res = $ch(r).unset(aK, aV, aTimestamp);
            });
            break;
        case "priority":
            $from(ops.list)
            .sort("p")
            .select(r => {
                try {
                    if (isUnDef(res)) res = $ch(r).unset(aK, aV, aTimestamp);
                } catch(e) {}
            });
            break;
        }

        return res;
    }
}