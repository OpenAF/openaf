// OpenWrap v2
// Author: Nuno Aguiar
// Metrics

OpenWrap.metrics = function() {
	return ow.metrics;
};

OpenWrap.metrics.prototype.__m = {
    mem: () => {
        var res = {
            max: Number(java.lang.Runtime.getRuntime().maxMemory()),
            total: Number(java.lang.Runtime.getRuntime().totalMemory()),
            free: Number(java.lang.Runtime.getRuntime().freeMemory())
        };
        res.used = res.total - res.free;
        return res;
    },
    cpu: () => ({
        load1 : getCPULoad(),
        load2 : getCPULoad(true),
        cores : getNumberOfCores(),
        _cores: __cpucores
    }),
    oaf: () => ({
        libs : __loadedLibs,
        nlibs: Object.keys(__loadedLibs).length,
        nscopes: af.getScopeIds().length,
        preCompileLevel: __preCompileLevel,
        version: getVersion(),
        path   : getOpenAFPath(),
        init   : __oafInit,
        now    : now(),
        logErr : __clogErr,
        logWarn: __clogWarn
    }),
    os: () => ({
        pid: getPid()
    }),
    threads: () => {
        var res = {
            list  : af.fromJavaArray(java.lang.Thread.getAllStackTraces().keySet().toArray()).map(t => ({
                id      : t.getId(),
                name    : String(t.getName()),
                isAlive : t.isAlive(),
                priority: Number(t.getPriority()),
                state   : String(t.getState())
            })),
            active: Number(java.lang.Thread.activeCount()),
            total : Number(java.lang.Thread.getAllStackTraces().size())
        };
        res.states = {};
        res.list.map(r => {
            if (isUnDef(res.states[r.state])) 
                res.states[r.state] = 1;
            else
                res.states[r.state] += 1;
        });
        return res;
    }
};

/**
 * <odoc>
 * <key>ow.metrics.add(aName, aFunction)</key>
 * Adds aName metric whose values are a map returned by aFunction.
 * </odoc>
 */
OpenWrap.metrics.prototype.add = function(aName, aFn) {
    if (isUnDef(ow.metrics.__m[aName])) {
        ow.metrics.__m[aName] = aFn;
    }
};

/**
 * <odoc>
 * <key>ow.metrics.getSome(anArrayOfNames) : Map</key>
 * Returns just the metrics in the provided anArrayOfNames.
 * </odoc>
 */
OpenWrap.metrics.prototype.getSome = function(aArray) {
    var r = {};
    aArray.map(f => {
        r[f] = ow.metrics.__m[f]();
    });
    return r;
};

/**
 * <odoc>
 * <key>ow.metrics.getAll() : Map</key>
 * Returns a map with all registered metrics.
 * </odoc>
 */
OpenWrap.metrics.prototype.getAll = function() {
    return ow.metrics.getSome(Object.keys(ow.metrics.__m));
};

OpenWrap.metrics.prototype.startCollecting = function(aChName, aPeriod) {
    var createCh = isUnDef(aChName) || $ch().list().indexOf(aChName) < 0;
    aChName = _$(aChName).isString().default("__metrics");
    aPeriod = _$(aPeriod).isNumber().default(1000);

    if (createCh) $ch(aChName).create(1, "mvs", { file: "metrics.db" });

    if (isUnDef(ow.metrics.__ch)) ow.metrics.__ch = [];
    ow.metrics.__ch.push(aChName);

    if (isUnDef(ow.metrics.__t)) {
        plugin("Threads");
        ow.metrics.__t = new Threads();
        ow.metrics.__t.addScheduleThreadWithFixedDelay(function() {
            var k = { t: now() };
            var v = merge(k, ow.metrics.getAll());
    
            ow.metrics.__ch.map(ch => {
                $ch(ch).set(k, v);
            });
        }, aPeriod);
    }
};

OpenWrap.metrics.prototype.stopCollecting = function(aChName) {
    aChName = _$(aChName).isString().default("__metrics");
    if (ow.metrics.__ch.indexOf(aChName) < 0) throw "Not collecting into " + aChName;

    ow.metrics.__ch = deleteFromArray(ow.metrics.__ch, ow.metrics.__ch.indexOf(aChName));
    if (isDef(ow.metrics.__t) && ow.metrics.__ch.length <= 0) {
        ow.metrics.__t.stop(true);
        ow.metrics.__t = void 0;
    }
};