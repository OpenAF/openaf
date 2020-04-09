$ch("a").create();
$ch("b").create();

$ch("a").setAll(["canonicalPath"], io.listFiles(".").files);
$ch("b").setAll(["canonicalPath"], io.listFiles(".").files);

for(let ii = 0; ii < 5; ii++) { $ch("b").pop(); }

print("A = " + $ch("a").size());
print("B = " + $ch("b").size());

/**
 * <odoc>
 * <key>syncCh(aIdxsArray, aSource, aTarget, aSyncFn, aLogFn)</key>
 * Tries to sync all values from aSource with aTarget channel using the aIdxsArray (list of value indexes field).
 * Optionally aSyncFn can be provided to decide how to sync the values between source and target (defaults to return always true). A aLogFn
 * can be provided so all sync actions can be logged.\
 * \
 * Table of sync actions given the return values of a custom syncFn(source, target) : boolean\
 * \
 *   | source | target | return true | return false |\
 *   |--------|--------|-------------|--------------|\
 *   | void 0 | def    | del target  | add source   |\
 *   | def    | void 0 | add target  | del source   |\
 *   | def    | def    | set target  | set source   |\
 * \
 * </odoc>
 */
function syncCh(idxs, source, target, syncFn, logFn) {
    var sks = $ch(source).getAll();
    var tks = $ch(target).getAll();

    syncFn = _$(syncFn).isFunction().default(() => { return true; });
    idxs = _$(idxs).$_("Please provide a list of field indexes");
    if (isString(idxs)) idxs = [ idxs ];

    ow.loadObj();

    // Indexing
    var skis = {};
    for(let ik in sks) {
        var sv = sks[ik];
        var si = stringify(ow.obj.filterKeys(idxs, sv), void 0, "");
        skis[si] = sv;
    }
    var tkis = {};
    for(let ik in tks) {
        var tv = tks[ik];
        var ti = stringify(ow.obj.filterKeys(idxs, tv), void 0, "");
        tkis[ti] = tv;
    }

    // Add source -> target
    var addToTarget = [], delFromTarget = [], addToSource = [], delFromSource = [];
    for(let ik in skis) {
        if (isUnDef(tkis[ik])) {
            if (syncFn(skis[ik], void 0)) {
                logFn("adding " + ik + " to target.");
                addToTarget.push(skis[ik]);
            } else {
                logFn("deleting " + ik + " from source.");
                delFromSource.push(skis[ik]);
            }
        } else {
            if (!(compare(skis[ik], tkis[ik]))) {
                if (syncFn(skis[ik], tkis[ik])) {
                    logFn("updating " + ik + " on target.");
                    addToTarget.push(skis[ik]);
                } else {
                    logFn("updating " + ik + " on source.");
                    addToSource.push(tkis[ik]);
                }
            }
        }
    }
    for(let ik in tkis) {
        if (isUnDef(skis[ik])) {
            if (syncFn(void 0, tkis[ik])) {
                logFn("deleting " + ik + " from target.");
                delFromTarget.push(tkis[ik]);
            } else {
                logFn("add " + ik + " to source.");
                addToSource.push(tkis[ik]);
            }
        } 
    }

    if (addToTarget.length > 0)   $ch(target).setAll(idxs, addToTarget);
    if (addToSource.length > 0)   $ch(source).setAll(idxs, addToSource);
    if (delFromSource.length > 0) $ch(source).unsetAll(idxs, delFromSource);
    if (delFromTarget.length > 0) $ch(target).unsetAll(idxs, delFromTarget);
}

syncCh(["canonicalPath"], "a", "b", () => { return true; }, log);

print("A = " + $ch("a").size());
print("B = " + $ch("b").size());