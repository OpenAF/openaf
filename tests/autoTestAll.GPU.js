// Optional GPU delegation contracts; no GPU installation or hardware needed.
exports.testGPUDelegation = function() {
    var source = io.readFileString("../js/openaf.js");
    var resolver = source.substring(source.indexOf("var __gpuDelegateLoading ="), source.indexOf("const parallel4Array ="));
    var loads = 0, flags = { PFOREACH: {} }, wrapper = {};
    var resolve = (new Function("__flags", "ow", "getOPackPath", "loadLib", resolver + "return __gpuDelegate"))(
        flags, wrapper, () => "/fixture/GPU", path => {
            loads++;
            ow.test.assert(path, "/fixture/GPU/gpu.js", "Wrong loader path");
            wrapper.loadGPU = () => wrapper.gpu = { pForEach: () => "delegated" };
        });
    ow.test.assert(isUnDef(resolve("pForEach", {useGPU:false})), true, "Bypass loaded GPU");
    ow.test.assert(loads, 0, "Bypass caused load");
    var disabled = /^(false|0|no|off)$/i.test(String(java.lang.System.getenv("OAF_PFOREACH_GPU")));
    if (disabled) {
        ow.test.assert(isUnDef(resolve("pForEach", {})), true, "Environment bypass ignored");
        return;
    }
    ow.test.assert(resolve("pForEach", {}), wrapper.gpu, "Installed default delegation");
    resolve("pForEach", {});
    ow.test.assert(loads, 1, "Successful service reloaded");
    flags.PFOREACH.forceSeq = true;
    ow.test.assert(isUnDef(resolve("pForEach", {})), true, "forceSeq ignored");
    flags.PFOREACH.forceSeq = false; flags.PFOREACH.useGPU = false;
    ow.test.assert(isUnDef(resolve("pForEach", {})), true, "Global bypass ignored");
    flags.PFOREACH.useGPU = true;
    var failed = (new Function("__flags", "ow", "getOPackPath", "loadLib", resolver + "return __gpuDelegate"))(
        flags, {}, () => "/broken/GPU", () => { throw "missing dependency" });
    ow.test.assert(isUnDef(failed("pForEach", {})), true, "Loader failure must retain CPU");
    var start = source.indexOf("const pForEach ="), body = source.substring(start, source.indexOf("\n/**", start));
    var delegates = 0;
    var run = (new Function("__gpuDelegate", body.replace("const pForEach =", "return")))(() => ({pForEach: () => {delegates++;throw "callback failure"}}));
    var thrown;
    try {run([1,2], x => x)} catch(e) {thrown=String(e)}
    ow.test.assert(thrown, "callback failure", "Delegated exception swallowed or retried");
    ow.test.assert(delegates, 1, "Delegation repeated");
    ow.test.assert(run([1,2], x => x+1, __, true), [2,3], "Forced sequential contract");
    ow.test.assert(delegates, 1, "Forced sequential delegated");
};
