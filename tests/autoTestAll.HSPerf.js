// Deterministic HotSpot perfdata 2.0 fixtures; no JVM-version dependency.
(function() {
    var fixture = function(items, order, offset) {
        order = isDef(order) ? order : 1;
        offset = offset || 32;
        var b = java.nio.ByteBuffer.allocate(offset + items.length * 128);
        b.putInt(-889274176); b.put(order); b.put(2); b.put(0); b.put(1);
        b.order(order == 1 ? java.nio.ByteOrder.LITTLE_ENDIAN : java.nio.ByteOrder.BIG_ENDIAN);
        b.putInt(b.capacity()); b.putInt(0); b.putLong(0); b.putInt(offset); b.putInt(items.length);
        items.forEach((item, i) => {
            var start = offset + i * 128, str = isDef(item.text);
            b.position(start);
            b.putInt(128); b.putInt(20); b.putInt(str ? 48 : 0);
            b.put(str ? 66 : 74); b.put(1); b.put(str ? 5 : 1); b.put(3); b.putInt(80);
            b.put(af.fromString2Bytes(item.name));
            b.position(start + 80);
            if (str) b.put(af.fromString2Bytes(item.text));
            else b.putLong(new java.lang.Long(String(item.value)));
        });
        return b.array();
    };
    exports.fixture = fixture;
    exports.testHSPerf = function() {
        var eq = (a, b, msg) => ow.test.assert(a, b, msg);
        [0, 1].forEach(order => {
            var bytes = fixture([
                {name: 'test.negative', value: '-1'},
                {name: 'test.large', value: '9007199254740993'},
                {name: 'test.min', value: '-9223372036854775808'},
                {name: 'test.max', value: '9223372036854775807'},
                {name: 'test.unicode', text: 'café 日本\u0000stale'}
            ], order, 40);
            var out = ow.java.parseHSPerf(bytes, true, {metadata:true, strict:true});
            eq(out.values['test.negative'], '-1', 'signed long');
            eq(out.values['test.large'], '9007199254740993', 'exact long');
            eq(out.values['test.min'], '-9223372036854775808', 'min long');
            eq(out.values['test.max'], '9223372036854775807', 'max long');
            eq(out.values['test.unicode'], 'café 日本', 'UTF8 and terminator');
            eq(out.header.entryOffset, 40, 'entry offset');
            eq(out.header.byteOrder, order, 'byte order');
            eq(out.entries['test.large'].type, 'J', 'metadata type');
            eq(ow.java.parseHSPerf(bytes).test.large, '9007199254740993', 'sparse nested');
            var file = io.createTempFile('hsperf-', '.bin');
            try { var stream = new java.io.FileOutputStream(file); try { stream.write(bytes); } finally { stream.close(); } eq(ow.java.parseHSPerf(file, true)['test.min'], out.values['test.min'], 'file input'); }
            finally { io.rm(file); }
        });
        var base = fixture([{name:'test.value', value:'42'}]);
        var bad = (offset, value, integer) => {
            var bytes = java.util.Arrays.copyOf(base, base.length);
            if (integer) java.nio.ByteBuffer.wrap(bytes).order(java.nio.ByteOrder.LITTLE_ENDIAN).putInt(offset, value);
            else bytes[offset] = value;
            eq(ow.java.parseHSPerf(bytes, true), 4, 'invalid at ' + offset);
            var threw = false;
            try { ow.java.parseHSPerf(bytes, true, {strict:true}); } catch(e) { threw = String(e).indexOf('offset') >= 0; }
            eq(threw, true, 'strict error at ' + offset);
        };
        [[0,0], [4,2], [5,3], [6,1], [7,0], [8,10000,true], [24,33,true], [28,100,true],
         [32,0,true], [36,200,true], [40,-1,true], [44,73], [46,0], [48,127,true]].forEach(x => bad(x[0],x[1],x[2]));
        eq(ow.java.parseHSPerf(java.util.Arrays.copyOf(base, 12),true),4,'short header');
        eq(ow.java.parseHSPerf(java.util.Arrays.copyOf(base, 120),true),4,'short payload');
        var over = java.util.Arrays.copyOf(base, base.length);
        java.nio.ByteBuffer.wrap(over).order(java.nio.ByteOrder.LITTLE_ENDIAN).putInt(12, 64);
        eq(ow.java.parseHSPerf(over,true,{metadata:true}).header.overflow,64,'overflow retained');
        eq(Object.keys(ow.java.parseHSPerf(fixture([]))).length,0,'empty counter set');
        var names = {
            'sun.rt.createVmBeginTime':'1000', 'sun.os.hrt.frequency':'1000', 'sun.os.hrt.ticks':'10000',
            'sun.gc.collector.0.time':'200', 'sun.gc.collector.0.invocations':'2',
            'sun.gc.collector.1.time':'100', 'sun.gc.collector.1.invocations':'0',
            'sun.gc.generation.0.space.0.used':'12', 'sun.gc.generation.0.space.1.used':'13'
        };
        var build = () => fixture(Object.keys(names).map(name => ({name:name, value:names[name]})));
        var data = ow.java.parseHSPerf(build());
        eq(data.sun.rt.__totalRunningTime,10000,'frequency');
        eq(data.sun.gc.__collectorsAccTimeMs,300,'collector sum without last entry');
        eq(data.sun.gc.collector[0].__avgExecTime,100,'average');
        eq(isUnDef(data.sun.gc.collector[1].__avgExecTime),true,'zero invocations');
        eq(data.sun.gc.generation[0].__totalUsed,25,'numeric space sum');
        names['sun.os.hrt.frequency']='1000000000';
        eq(ow.java.parseHSPerf(build()).sun.gc.__collectorsAccTimeMs,0.0003,'nanosecond frequency');
        names['sun.os.hrt.frequency']='1000';
        names['sun.gc.collector.0.lastEntryTime']='100';
        names['sun.gc.collector.0.lastExitTime']='125';
        data = ow.java.parseHSPerf(build(), false, {metadata:true});
        eq(data.values.sun.gc.collector[0].__lastEntryDate.getTime(),1100,'entry date');
        eq(data.values.sun.gc.collector[0].__lastExecTime,25,'last duration');
        eq(data.values.sun.rt.__percAppTime,97,'application estimate');
        delete names['sun.os.hrt.frequency'];
        eq(isUnDef(ow.java.parseHSPerf(build()).sun.gc.__collectorsAccTimeMs),true,'missing frequency');
        eq(ow.java.parseHSPerf(build()).sun.rt.__totalRunningTime > 0,true,'wall-clock fallback');
        var unterminated = fixture([{name:'test.text',text:'hello'}]);
        for (var u = 112; u < unterminated.length; u++) unterminated[u] = 65;
        eq(ow.java.parseHSPerf(unterminated,true),4,'unterminated string');
        ow.loadMetrics();
        var parse = ow.java.parseHSPerf, pids = ow.java.getLocalJavaPIDs;
        try {
            ow.java.getLocalJavaPIDs = () => [{pid:getPid(),path:'fixture'}];
            ow.java.parseHSPerf = () => ({test:{value:'42'}});
            eq(ow.metrics.__m.hotspotVM().gcCollections.length,0,'sparse metrics');
            ow.java.parseHSPerf = () => 4;
            eq(isUnDef(ow.metrics.__m.hotspotVM()),true,'invalid metrics');
            ow.java.parseHSPerf = () => ({sun:{gc:{generation:[{space:[{used:'2',capacity:'10',maxCapacity:'20'}]}]}}});
            eq(ow.metrics.__m.hotspotVM().memory.total,10,'string capacity');
        } finally { ow.java.parseHSPerf = parse; ow.java.getLocalJavaPIDs = pids; }
    };
})();
