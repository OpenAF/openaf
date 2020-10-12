(function() {

    exports.testGetSet = function() {
      ow.loadSec();
       $ch("t").create();
 
       var sb = new ow.sec.SBucket("t", "Main secret", "test", "SeCrEt");
       sb.setSSecret("pass", "pass123");
       ow.test.assert(sb.getSSecret("pass"), "pass123", "Problem with get/set.");
 
       sb.unsetSSecret("pass");
       ow.test.assert(sb.getSSecret("pass"), void 0, "Problem with unset.");
 
       $ch("t").destroy();
    };
 
    exports.testGetSetFn = function() {
      ow.loadSec();
       $ch("t").create();
 
       ow.loadFormat();
 
       var sb = new ow.sec.SBucket("t", "Main secret", "test", "SeCrEt");
       sb.setSNewFn("myHex", "ow.format.toHex", {
          aNumber: 255,
          aLength: 2
       });
 
       var res = sb.getSNewFn("myHex");
       ow.test.assert(res, "ff", "Problem with GetSetFn.");
 
       $ch("t").destroy();
    };
 
    exports.testGetSetObj = function() {
      ow.loadSec();
       $ch("t").create();
 
       ow.loadFormat();
 
       var sb = new ow.sec.SBucket("t", "Main secret", "test", "SeCrEt");
       sb.setSNewObj("myCSV", "CSV", {
          aCsvString: "A;B;C\n1;\"a\";\"b\"\n2;\"1\";\"2\""
       });
 
       var res = sb.getSNewObj("myCSV");
       ow.test.assert(res.csv()[0].A, 1, "Problem with GetSetObj.");
 
       $ch("t").destroy();
    };
 
 })();