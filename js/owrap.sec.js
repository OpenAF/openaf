// OpenWrap v2
// Author: Nuno Aguiar
// Sec

OpenWrap.sec = function() {
	return ow.sec;
};

/**
 * <odoc>
 * <key>ow.sec.openSBuckets(aRepo, aMainSecret)</key>
 * Opens aRepo SBucket using aMainSecret. 
 * </odoc>
 */
OpenWrap.sec.prototype.openSBuckets = function(aRepo, aMainSecret) {
   var rep   = _$(aRepo, "aRepo").isString().default("");
   aRepo = rep;
   var isWin = String(java.lang.System.getProperty("os.name")).match(/Windows/) ? true : false;

   if (rep != "") rep = "-" + rep;
   var f = java.lang.System.getProperty("user.home") + "/.openaf-sec" + rep + ".yml";

   $ch("___openaf_sbuckets" + rep).create(1, "file", {
      file          : f,
      yaml          : true,
      key           : "sbucket"
   });

   if (io.fileExists(f) && !isWin) {
      $sh("chmod a-rwx " + f)
      .sh("chmod u+rw " + f)
      .exec();
   }

   if (isUnDef(ow.sec._sb)) ow.sec._sb = {};
   ow.sec._sb[aRepo] = new ow.sec.SBucket("___openaf_sbuckets" + rep, aMainSecret, "default", aMainSecret);
};

const $sec = function(aMainSecret, aRepo) {
   _$(aMainSecret, "aMainSecret").isString().$_();
   var rep   = _$(aRepo, "aRepo").isString().default("");
   aRepo = rep;

   if (isUnDef(ow.sec._sb) || isUnDef(ow.sec._sb[aRepo])) ow.sec.openSBuckets(aRepo, aMainSecret);

   return {
      get: (aKey, aBucket, aLockSecret) => {
         aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(aMainSecret);
         return ow.sec._sb[aRepo].getSecret(aBucket, aLockSecret, aKey);
      },
      getObj: (aKey, aExtraArgs, aBucket, aLockSecret) => {
         aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(aMainSecret);
         return ow.sec._sb[aRepo].getNewObj(aBucket, aLockSecret, aKey, aExtraArgs);
      },
      getFn: (aKey, aExtraArgs, aBucket, aLockSecret) => {
         aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(aMainSecret);
         return ow.sec._sb[aRepo].getNewFn(aBucket, aLockSecret, aKey, aExtraArgs);
      },
      set: (aKey, aObj, aBucket, aLockSecret) => {
         aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(aMainSecret);
         return ow.sec._sb[aRepo].setSecret(aBucket, aLockSecret, aKey, aObj);
      },
      setObj: (aBucket, aLockSecret, aKey, aObj, aArgs) => {
         aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(aMainSecret);
         return ow.sec._sb[aRepo].setNewObj(aBucket, aLockSecret, aKey, aObj, aArgs);
      },
      setFn: (aBucket, aLockSecret, aKey, aFn, aArgs) => {
         aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(aMainSecret);
         return ow.sec._sb[aRepo].setNewFn(aBucket, aLockSecret, aKey, aFn, aArgs);
      },
      unset: (aKey, aBucket, aLockSecret) => {
         aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(aMainSecret);
         return ow.sec._sb[aRepo].unsetSecret(aBucket, aLockSecret, aKey);
      },
      getBucket: (aBucket, aLockSecret) => {
         aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(aMainSecret);
         return ow.sec._sb[aRepo].getBucket(aBucket, aLockSecret);
      },
      setBucket: (aBucketString, aBucket, aLockSecret) => {
         aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(aMainSecret);
         return ow.sec._sb[aRepo].setBucket(aBucket, aLockSecret, aBucketString);
      }
   };
};

/**
 * <odoc>
 * <key>ow.sec.closeSBuckets(aRepo)</key>
 * Close a previously open aRepo SBucket.
 * </odoc>
 */
OpenWrap.sec.prototype.closeSBuckets = function(aRepo) {
   var rep   = _$(aRepo, "aRepo").isString().default("");
   aRepo = rep;
   if (rep != "") rep = "-" + rep;

   $ch("___openaf_sbuckets" + rep).destroy();
   if (isDef(ow.sec._sb[aRepo])) ow.sec._sb[aRepo] = void 0;
};

/**
 * <odoc>
 * <key>ow.sec.purgeSBuckets(aRepo)</key>
 * Purge aRepo SBucket.
 * </odoc>
 */
OpenWrap.sec.prototype.purgeSBuckets = function(aRepo) {
   this.closeSBuckets(aRepo);

   var rep   = _$(aRepo, "aRepo").isString().default("");
   aRepo = rep;
   if (rep != "") rep = "-" + rep;

   var f = java.lang.System.getProperty("user.home") + "/.openaf-sec" + rep + ".db";

   io.rm(f);
};

/**
 * <odoc>
 * <key>ow.sec.purgeMainSBuckets()</key>
 * Purge the default SBucket.
 * </odoc>
 */
OpenWrap.sec.prototype.purgeMainSBuckets = function() {
   this.purgeSBuckets();
};

/**
 * <odoc>
 * <key>ow.sec.openMainSBuckets(aMainSecret)</key>
 * Open the default SBucket using aMainSecret.
 * </odoc>
 */
OpenWrap.sec.prototype.openMainSBuckets = function(aMainSecret) {
   this.openSBuckets(void 0, aMainSecret);
};

/**
 * <odoc>
 * <key>ow.sec.closeMainSBuckets()</key>
 * Close the default SBucket.
 * </odoc>
 */
OpenWrap.sec.prototype.closeMainSBuckets = function() {
   this.closeSBuckets();
};

/**
 * <odoc>
 * <key>ow.sec.SBucket.SBucket(aCh, aMainSecret, sBucket, aLockSecret) : sbucket</key>
 * Creates a set of sbuckets on aCh using aMainSecret. 
 * Defaults, if provided, to sBucket and aLockSecret.
 * </odoc>
 */
OpenWrap.sec.prototype.SBucket = function(aCh, aMainSecret, sBucket, aLockSecret) {
    ow.loadFormat();
 
    this.aCh  = _$(aCh, "aCh").isString().$_();
    this.s    = _$(aMainSecret, "aMainSecret").isString().$_();
 
    this.sbucket     = _$(sBucket, "sBucket").isString().default(void 0);
    this.aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(void 0);

    if ($ch().list().indexOf(this.aCh) < 0) throw ("aCh not found");
};
 
const __sbucket__encrypt = function(aObj, aMainKey, aKey) {
    var mk; 
    try {
       mk = af.decrypt(aKey, sha512(aMainKey).substr(0, 16));
    } catch(e) {
       mk = aKey;
    }
    var s = af.encrypt(stringify(isMap(aObj) ? sortMapKeys(aObj) : aObj, void 0, ""), sha512(mk).substr(0, 16));
    return af.fromBytes2String(af.toBase64Bytes(af.fromString2Bytes(s)));
};
 
const __sbucket__decrypt = function(aObj, aMainKey, aKey) {
    var mk; 
    try {
       mk = af.decrypt(aKey, sha512(aMainKey).substr(0, 16));
    } catch(e) {
       mk = aKey;
    }
    var s = af.fromBytes2String(af.fromBase64(aObj));
    return jsonParse(af.decrypt(s, sha512(mk).substr(0, 16)));
};
 
/**
 * <odoc>
 * <key>ow.sec.SBucket.getSecret(sBucket, aLockSecret, aKey) : Map</key>
 * Given a sbucket and a specific aLockSecret will return the associated aKey.
 * </odoc>
 */
OpenWrap.sec.prototype.SBucket.prototype.getSecret = function(sBucket, aLockSecret, aKey) {
    sBucket     = _$(sBucket, "sBucket").isString().default(this.sbucket);
    aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(this.aLockSecret);
 
    var kv = $ch(this.aCh).get({ sbucket: sBucket});
    if (isDef(kv) && isDef(kv.v)) {
       var sb = __sbucket__decrypt(kv.v, this.s, aLockSecret);
       if (isMap(sb) && isDef(sb.name) && sb.name == sBucket) {
          return sb.keys[aKey];
       } else {
          throw "Wrong bucket and/or secret";
       }
    } else {
       throw "Bucket '" + sBucket + "' not found.";
    }
};
 
/**
 * <odoc>
 * <key>ow.sec.SBucket.getSSecret(aKey) : Map</key>
 * Returns the associated aKey value.
 * </odoc>
 */
OpenWrap.sec.prototype.SBucket.prototype.getSSecret = function(aKey) {
    return this.getSecret(void 0, void 0, aKey);
};
 
/**
 * <odoc>
 * <key>ow.sec.SBucket.getSecretAs(sBucket, aLockSecret, aEncryptKey, aKey) : Map</key>
 * Given a sbucket and a specific aLockSecret will return the associated aKey encrypted with aEncryptKey.
 * </odoc>
 */
OpenWrap.sec.prototype.SBucket.prototype.getSecretAs = function(sBucket, aLockSecret, aEncryptKey, aKey) {
    sBucket     = _$(sBucket, "sBucket").isString().default(this.sbucket);
    aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(this.aLockSecret);

    var kv = $ch(this.aCh).get({ sbucket: sBucket});
    if (isDef(kv) && isDef(kv.v)) {
       var sb = __sbucket__decrypt(kv.v, this.s, aLockSecret);
       if (isMap(sb) && isDef(sb.name) && sb.name == sBucket) {
          return af.encrypt(sb.keys[aKey], aEncryptKey);
       } else {
          throw "Wrong bucket and/or secret";
       }
    } else {
       throw "Bucket '" + sBucket + "' not found.";
    }
};
 
/**
 * <odoc>
 * <key>ow.sec.SBucket.getSSecretAs(aEncryptKey, aKey) : Map</key>
 * Returns the associated aKey encrypted with aEncryptKey.
 * </odoc>
 */
OpenWrap.sec.prototype.SBucket.prototype.getSSecretAs = function(aEncryptKey, aKey) {
    return this.getSecretAs(void 0, void 0, aEncryptKey, aKey);
};
 
/**
 * <odoc>
 * <key>ow.sec.SBucket.createBucket(sBucket, aLockSecret)</key>
 * Creates a sbucket with a specific aLockSecret.
 * </odoc>
 */
OpenWrap.sec.prototype.SBucket.prototype.createBucket = function(sBucket, aLockSecret) {
   var sb = _$(sBucket, "sbucket").isString().$_();
   aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(this.aLockSecret);
 
   if (isDef($ch(this.aCh).get({ sbucket: sBucket }))) return;
   var obj = { name: sBucket, keys: {} };
 
   $ch(this.aCh).set({ sbucket: sBucket }, { sbucket: sBucket, v: __sbucket__encrypt(obj, this.s, aLockSecret) });
};

/**
 * <odoc>
 * <key>ow.sec.SBucket.destroyBucket(sBucket)</key>
 * Destroys a sBucket.
 * </odoc>
 */
OpenWrap.sec.prototype.SBucket.prototype.destroyBucket = function(sBucket) {
   var sb = _$(sBucket, "sbucket").isString().$_();

   $ch(this.aCh).unset({ sbucket: sBucket });
};
 
/**
 * <odoc>
 * <key>ow.sec.SBucket.setSecret(sBucket, aLockSecret, aKey, aObj)</key>
 * Given a sbucket and aLockSecret will set aKey to aObj (string or map)
 * </odoc>
 */
OpenWrap.sec.prototype.SBucket.prototype.setSecret = function(sBucket, aLockSecret, aKey, aObj) {
    sBucket     = _$(sBucket, "sBucket").isString().default(this.sbucket);
    aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(this.aLockSecret);
 
    var kv = $ch(this.aCh).get({ sbucket: sBucket});
    if (isUnDef(kv) || isUnDef(kv.v)) {
       this.createBucket(sBucket, aLockSecret);
    }
 
    kv = $ch(this.aCh).get({ sbucket: sBucket});
    var sb = __sbucket__decrypt(kv.v, this.s, aLockSecret);
    if (isMap(sb) && isDef(sb.name) && sb.name == sBucket) {
       sb.keys[aKey] = aObj;
       $ch(this.aCh).set({ sbucket: sBucket }, { sbucket: sBucket, v: __sbucket__encrypt(sb, this.s, aLockSecret) });
    } else {
       throw "Wrong bucket and/or secret";
    }
};
 
/**
 * <odoc>
 * <key>ow.sec.SBucket.setSSecret(aKey, aObj)</key>
 * Sets aKey to aObj (string or map)
 * </odoc>
 */
OpenWrap.sec.prototype.SBucket.prototype.setSSecret = function(aKey, aObj) {
    return this.setSecret(void 0, void 0, aKey, aObj);
};
 
/**
 * <odoc>
 * <key>ow.sec.SBucket.unsetSecret(sBucket, aLockSecret, aKey)</key>
 * Given a sbucket and aLockSecret will unset aKey.
 * </odoc>
 */
OpenWrap.sec.prototype.SBucket.prototype.unsetSecret = function(sBucket, aLockSecret, aKey) {
    sBucket     = _$(sBucket, "sBucket").isString().default(this.sbucket);
    aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(this.aLockSecret);
 
    var kv = $ch(this.aCh).get({ sbucket: sBucket});
    if (isUnDef(kv) || isUnDef(kv.v)) {
       this.createBucket(sBucket, aLockSecret);
    }
 
    kv = $ch(this.aCh).get({ sbucket: sBucket});
    var sb = __sbucket__decrypt(kv.v, this.s, aLockSecret);
    if (isMap(sb) && isDef(sb.name) && sb.name == sBucket) {
       delete sb.keys[aKey];
       $ch(this.aCh).set({ sbucket: sBucket }, { sbucket: sBucket, v: __sbucket__encrypt(sb, this.s, aLockSecret) });
    } else {
       throw "Wrong bucket and/or secret";
    }
};
 
/**
 * <odoc>
 * <key>ow.sec.SBucket.unsetSSecret(aKey)</key>
 * Unsets aKey.
 * </odoc>
 */
OpenWrap.sec.prototype.SBucket.prototype.unsetSSecret = function(aKey) {
    return this.unsetSecret(void 0, void 0, aKey);
};
 
/**
 * <odoc>
 * <key>ow.sec.SBucket.getBucket(sBucket, aLockSecret) : String</key>
 * Given a sbucket and aLockSecret retrieves a string representation of the sbucket.
 * </odoc>
 */
OpenWrap.sec.prototype.SBucket.prototype.getBucket = function(sBucket, aLockSecret) {
    sBucket     = _$(sBucket, "sBucket").isString().default(this.sbucket);
    aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(this.aLockSecret);
 
    var kv = $ch(this.aCh).get({ sbucket: sBucket});
    if (isUnDef(kv) || isUnDef(kv.v)) {
       this.createBucket(sBucket, aLockSecret);
    }
 
    kv = $ch(this.aCh).get({ sbucket: sBucket});
    if (isDef(kv) && isDef(kv.v)) return kv.v;
};
 
/**
 * <odoc>
 * <key>ow.sec.SBucket.getSBucket() : String</key>
 * Returns a string representation of the sbucket.
 * </odoc>
 */
OpenWrap.sec.prototype.SBucket.prototype.getSBucket = function() {
    return this.getBucket(void 0, void 0);
};
 
/**
 * <odoc>
 * <key>ow.sec.SBucket.setBucket(sBucket, aLockSecret, aBucketString)</key>
 * Given a sbucket, aLockSecret will set the sbucket to the provided aBucketString.
 * </odoc>
 */
OpenWrap.sec.prototype.SBucket.prototype.setBucket = function(sBucket, aLockSecret, aBucketString) {
    sBucket     = _$(sBucket, "sBucket").isString().default(this.sbucket);
    aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(this.aLockSecret);
 
    var kv = $ch(this.aCh).get({ sbucket: sBucket});
    if (isUnDef(kv) || isUnDef(kv.v)) {
       this.createBucket(sBucket, aLockSecret);
    }
 
    $ch(this.aCh).set({ sbucket: sBucket}, { sbucket: sBucket, v: aBucketString });
};
 
/**
 * <odoc>
 * <key>ow.sec.SBucket.setSBucket(aBucketString)</key>
 * Set the current sbucket to the provided aBucketString.
 * </odoc>
 */
OpenWrap.sec.prototype.SBucket.prototype.setSBucket = function(aBucketString) {
    return this.setBucket(void 0, void 0, aBucketString);
};
 
/**
 * <odoc>
 * <key>ow.sec.SBucket.setNewObj(sBucket, aLockSecret, aKey, aObject, args)</key>
 * For the sBucket with aLockSecret will set aKey to create aObject with the arguments map ($fnDev4Help).
 * </odoc>
 */
OpenWrap.sec.prototype.SBucket.prototype.setNewObj = function(sBucket, aLockSecret, aKey, aObject, args) {
    this.setSecret(sBucket, aLockSecret, aKey, {
       _obj : aObject,
       _args: args
    });
};
 
/**
 * <odoc>
 * <key>ow.sec.SBucket.setSNewObj(aKey, aObject, args)</key>
 * Will set aKey to create aObject with the arguments map ($fnDev4Help).
 * </odoc>
 */
OpenWrap.sec.prototype.SBucket.prototype.setSNewObj = function(aKey, aObject, args) {
    return this.setNewObj(void 0, void 0, aKey, aObject, args);
};
 
/**
 * <odoc>
 * <key>ow.sec.SBucket.getNewObj(sBucket, aLockSecret, aKey, defaultArgs)</key>
 * For the sBucket with aLockSecret create an object with the arguments in aKey.
 * </odoc>
 */
OpenWrap.sec.prototype.SBucket.prototype.getNewObj = function(sBucket, aLockSecret, aKey, defaultArgs) {
    var v = this.getSecret(sBucket, aLockSecret, aKey);
    defaultArgs = _$(defaultArgs, "defaultArgs").isMap().default({});

    var ar = [];
    if (isMap(v._args)) {
       var margs;
       try {
          margs = $fnDef4Help(v._obj);
       } catch(e) {
          margs = $fnDef4Help(v._obj + "." + v._obj);
       }
       margs.map(a => {
          var vv = (isDef(v._args[a]) ? v._args[a] : defaultArgs[a]);
          if (vv == void 0) vv = "void 0";
          if (isString(vv)) vv = stringify(vv, void 0, "");
          ar.push(vv);
       });
    } else {
       ar = v._args;
    }
    return af.eval("new " + v._obj + "(" + ar.join(", ") + ")");
};
 
/**
 * <odoc>
 * <key>ow.sec.SBucket.getSNewObj(aKey)</key>
 * Create an object with the arguments in aKey.
 * </odoc>
 */
OpenWrap.sec.prototype.SBucket.prototype.getSNewObj = function(aKey) {
    return this.getNewObj(void 0, void 0, aKey);
};
 
/**
 * <odoc>
 * <key>ow.sec.SBucket.setNewFn(sBucket, aLockSecret, aKey, aFn, args)</key>
 * For the sBucket with aLockSecret will set aKey to use aFn with the arguments map ($fnDev4Help).
 * </odoc>
 */
OpenWrap.sec.prototype.SBucket.prototype.setNewFn = function(sBucket, aLockSecret, aKey, aFn, args) {
    this.setSecret(sBucket, aLockSecret, aKey, {
       _fn  : aFn,
       _args: args
    });
};
 
/**
 * <odoc>
 * <key>ow.sec.SBucket.setSNewFn(aKey, aFn, args)</key>
 * For the sBucket with aLockSecret will set aKey to use aFn with the arguments map ($fnDev4Help).
 * </odoc>
 */
OpenWrap.sec.prototype.SBucket.prototype.setSNewFn = function(aKey, aFn, args) {
    return this.setNewFn(void 0, void 0, aKey, aFn, args);
};
 
/**
 * <odoc>
 * <key>ow.sec.SBucket.getNewFn(sBucket, aLockSecret, aKey, defaultArgs)</key>
 * For the sBucket with aLockSecret will invoke a function and set arguments using aKey.
 * </odoc>
 */
OpenWrap.sec.prototype.SBucket.prototype.getNewFn = function(sBucket, aLockSecret, aKey, defaultArgs) {
    var v = this.getSecret(sBucket, aLockSecret, aKey);
    defaultArgs = _$(defaultArgs, "defaultArgs").isMap().default({});

    var ar = [];
    if (isMap(v._args)) {
       var margs;
       margs = $fnDef4Help(v._fn);
       margs.map(a => {
          var vv = (isDef(v._args[a]) ? v._args[a] : defaultArgs[a]);
          if (vv == void 0) vv = "void 0";
          if (isString(vv)) vv = stringify(vv, void 0, "");
          ar.push(vv);
       });
    } else {
       ar = v._args;
    }
    return af.eval(v._fn + "(" + ar.join(", ") + ")");
};
 
/**
 * <odoc>
 * <key>ow.sec.SBucket.getSNewFn(Key)</key>
 * Will invoke a function and set arguments using aKey.
 * </odoc>
 */
OpenWrap.sec.prototype.SBucket.prototype.getSNewFn = function(aKey) {
    return this.getNewFn(void 0, void 0, aKey);
};