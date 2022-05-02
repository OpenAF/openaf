// OpenWrap v2
// Author: Nuno Aguiar
// Sec

OpenWrap.sec = function() {
	return ow.sec;
};

/**
 * <odoc>
 * <key>ow.sec.openSBuckets(aRepo, aMainSecret, aFile)</key>
 * Opens aRepo SBucket using aMainSecret. 
 * </odoc>
 */
OpenWrap.sec.prototype.openSBuckets = function(aRepo, aMainSecret, aFile) {
   var rep   = _$(aRepo, "aRepo").isString().default("");
   aRepo = String(rep);
   var isWin = String(java.lang.System.getProperty("os.name")).match(/Windows/) ? true : false;

   if (rep != "") rep = "-" + rep;
   if (aRepo != "system") {
      var f = isDef(aFile) ? aFile : java.lang.System.getProperty("user.home") + "/.openaf-sec" + rep + ".yml";

      $ch("___openaf_sbuckets" + rep).create(1, "file", {
         file          : f,
         yaml          : true,
         key           : "sbucket"
      });

      if (io.fileExists(f) && !isWin) {
         // quietly set permissions
         $sh("chmod a-rwx " + f)
         .sh("chmod u+rw " + f)
         .get();
      }
   } else {
      // Special repo system with bucket envs for system variables
      $ch("___openaf_sbuckets" + rep).create();
      var evs = getEnvs(), envs = {};
      Object.keys(evs).forEach(env => {
         if (evs[env].trim().indexOf("{") == 0) 
            envs[env] = jsonParse(evs[env], true);
         else
            envs[env] = evs[env]
      })
      $ch("___openaf_sbuckets" + rep).set({ sbucket: "envs" }, envs);
   }

   if (isUnDef(ow.sec._sb)) ow.sec._sb = {};
   if (isUnDef(aMainSecret)) {
      var ff = java.lang.System.getProperty("user.home") + "/.openaf-sec";
      if (io.fileExists(ff)) {
         aMainSecret = io.readFileString(ff);
      } else {
         aMainSecret = af.encrypt(sha512(genUUID()));
         io.writeFileString(ff, aMainSecret);
      }
   }
   ow.sec._sb[aRepo] = new ow.sec.SBucket("___openaf_sbuckets" + rep, aMainSecret, "default", isUnDef(aFile) && aRepo != "system" ? aMainSecret : __);
};

/**
 * <odoc>
 * <key>$sec.$sec(aRepo, dBucket, dLockSecret, aMainSecret, aFile) : $sec</key>
 * Shortcut for acessing ow.sec.SBuckets given aMainSecret and, optionally, aRepo. A default dBucket and the corresponding
 * dLockSecret can be provided.
 * </odoc>
 */
const $sec = function(aRepo, dBucket, dLockSecret, aMainSecret, aFile) {
   dBucket     = _$(dBucket, "dBucket").isString().default(__);
   dLockSecret = _$(dLockSecret, "dLockSecret").isString().default(__);
   var dKey;

   try {
      new java.net.URI(aRepo);
      var o = __sbucket__uri(aRepo);
      aRepo      = o.repo;
      dBucket     = o.bucket;
      dLockSecret = o.lockSecret;
      aMainSecret = o.mainSecret;
      dKey        = o.key;
   } catch(e) {
   }
   var rep   = _$(aRepo, "aRepo").isString().default("");
   aRepo = rep;

   if (isUnDef(ow.sec._sb) || isUnDef(ow.sec._sb[aRepo])) ow.sec.openSBuckets(aRepo, aMainSecret, aFile);

   return {
      /**
       * <odoc>
       * <key>$sec.list(aBucket, aLockSecret) : Array</key>
       * Returns a map with a list of all the sBuckets on the current repo. If a specifc sBucket and aLockSecret isn't provide
       * the current sBucket will have an associated array with the list of corresponding keys.
       * </odoc>
       */
      list: (aBucket, aLockSecret) => {
         aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(dLockSecret);
         aBucket     = _$(aBucket, "aBucket").isString().default(dBucket);

         return ow.sec._sb[aRepo].getKeys(aBucket, aLockSecret);
      },
      /**
       * <odoc>
       * <key>$sec.get(aKey, aBucket, aLockSecret) : Object</key>
       * Retrieves the secret object/string for aKey. Optionally you can provide a specific aBucket and the corresponding aLockSecret.
       * </odoc>
       */
      get: (aKey, aBucket, aLockSecret) => {
         aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(dLockSecret);
         aBucket     = _$(aBucket, "aBucket").isString().default(dBucket);
         aKey        = _$(aKey, "aKey").isString().default(dKey);
         return ow.sec._sb[aRepo].getSecret(aBucket, aLockSecret, aKey);
      },
      /**
       * <odoc>
       * <key>$sec.getObj(aKey, aExtraArgs, aBucket, aLockSecret) : Object</key>
       * Creates a new instance of an object using the secret arguments for aKey with non-secret aExtraArgs map (arguments should have
       * the same name as the constructor help parameters). Optionally you can provide a specific aBucket and the corresponding aLockSecret.
       * </odoc>
       */
      getObj: (aKey, aExtraArgs, aBucket, aLockSecret) => {
         aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(dLockSecret);
         aBucket     = _$(aBucket, "aBucket").isString().default(dBucket);
         aKey        = _$(aKey, "aKey").isString().default(dKey);
         return ow.sec._sb[aRepo].getNewObj(aBucket, aLockSecret, aKey, aExtraArgs);
      },
      /**
       * <odoc>
       * <key>$sec.getFn(aKey, aExtraArgs, aBucket, aLockSecret) : Object</key>
       * Invokes a function using the secret arguments for aKey with non-secret aExtraArgs map (arguments should have
       * the same name as the function help parameters). Optionally you can provide a specific aBucket and the corresponding aLockSecret.
       * </odoc>
       */
      getFn: (aKey, aExtraArgs, aBucket, aLockSecret) => {
         aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(dLockSecret);
         aBucket     = _$(aBucket, "aBucket").isString().default(dBucket);
         aKey        = _$(aKey, "aKey").isString().default(dKey);
         return ow.sec._sb[aRepo].getNewFn(aBucket, aLockSecret, aKey, aExtraArgs);
      },
      /**
       * <odoc>
       * <key>$sec.set(aKey, aObj, aBucket, aLockSecret) : Object</key>
       * Sets the secret aObj map/string associating it with aKey. Optionally you can provide a specific aBucket and the corresponding aLockSecret.
       * </odoc>
       */
      set: (aKey, aObj, aBucket, aLockSecret) => {
         aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(dLockSecret);
         aBucket     = _$(aBucket, "aBucket").isString().default(dBucket);
         aKey        = _$(aKey, "aKey").isString().default(dKey);
         return ow.sec._sb[aRepo].setSecret(aBucket, aLockSecret, aKey, aObj);
      },
      /**
       * <odoc>
       * <key>$sec.setObj(aKey, aObj, aArgs, aBucket, aLockSecret) : Object</key>
       * Sets secret aArgs (map with the arguments names on the aObj constructor help)) for constructing aObj (string).
       * Optionally you can provide a specific aBucket and the corresponding aLockSecret.
       * </odoc>
       */
      setObj: (aKey, aObj, aArgs, aBucket, aLockSecret) => {
         aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(dLockSecret);
         aBucket     = _$(aBucket, "aBucket").isString().default(dBucket);
         aKey        = _$(aKey, "aKey").isString().default(dKey);
         return ow.sec._sb[aRepo].setNewObj(aBucket, aLockSecret, aKey, aObj, aArgs);
      },
      /**
       * <odoc>
       * <key>$sec.setFn(aKey, aFn, aArgs, aBucket, aLockSecret) : Object</key>
       * Sets secret aArgs (map with the arguments names on the aFn help)) for calling aFn (string).
       * Optionally you can provide a specific aBucket and the corresponding aLockSecret.
       * </odoc>
       */
      setFn: (aKey, aFn, aArgs, aBucket, aLockSecret) => {
         aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(dLockSecret);
         aBucket     = _$(aBucket, "aBucket").isString().default(dBucket);
         aKey        = _$(aKey, "aKey").isString().default(dKey);
         return ow.sec._sb[aRepo].setNewFn(aBucket, aLockSecret, aKey, aFn, aArgs);
      },
      /**
       * <odoc>
       * <key>$sec.unset(aKey, aBucket, aLockSecret) : Object</key>
       * Unsets aKey for a SBucket. Optionally you can provide a specific aBucket and the corresponding aLockSecret.
       * </odoc>
       */
      unset: (aKey, aBucket, aLockSecret) => {
         aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(dLockSecret);
         aBucket     = _$(aBucket, "aBucket").isString().default(dBucket);
         aKey        = _$(aKey, "aKey").isString().default(dKey);
         return ow.sec._sb[aRepo].unsetSecret(aBucket, aLockSecret, aKey);
      },
      /**
       * <odoc>
       * <key>$sec.unsetBucket(aBucket)</key>
       * Unsets aBucket from the current repo.
       * </odoc>
       */
      unsetBucket: (aBucket) => {
         return ow.sec._sb[aRepo].destroyBucket(aBucket);
      },
      /**
       * <odoc>
       * <key>$sec.unsetRepo()</key>
       * Unsets the current repo.
       * </odoc>
       */
      unsetRepo: () => {
         return ow.sec.purgeSBuckets(aRepo);
      },
      /**
       * <odoc>
       * <key>$sec.close() : Object</key>
       * Close the current repository.
       * </odoc>
       */
      close: () => {
         return ow.sec.closeSBuckets(aRepo);
      },
      /**
       * <odoc>
       * <key>$sec.getBucket(aBucket, aLockSecret) : String</key>
       * Retrieves a encrypted SBucket string to be transported to another SBucket repo. 
       * Optionally you can provide a specific aBucket and the corresponding aLockSecret.
       * </odoc>
       */
      getBucket: (aBucket, aLockSecret) => {
         aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(dLockSecret);
         aBucket     = _$(aBucket, "aBucket").isString().default(dBucket);
         return ow.sec._sb[aRepo].getBucket(aBucket, aLockSecret);
      },
      /**
       * <odoc>
       * <key>$sec.setBucket(aBucketString, aBucket, aLockSecret) : String</key>
       * Sets an encrypted SBucket string transported from another SBucket repo (the aLockSecret should be equal)
       * Optionally you can provide a specific aBucket and the corresponding aLockSecret.
       * </odoc>
       */
      setBucket: (aBucketString, aBucket, aLockSecret) => {
         aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(dLockSecret);
         aBucket     = _$(aBucket, "aBucket").isString().default(dBucket);
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
   if (isDef(ow.sec._sb[aRepo])) ow.sec._sb[aRepo] = __;
};

/**
 * <odoc>
 * <key>ow.sec.purgeSBuckets(aRepo)</key>
 * Purge aRepo SBucket.
 * </odoc>
 */
OpenWrap.sec.prototype.purgeSBuckets = function(aRepo) {
   try { this.closeSBuckets(aRepo); } catch(e) {}

   var rep   = _$(aRepo, "aRepo").isString().default("");
   if (rep == "default") rep = "";
   if (rep == "system") return;

   aRepo = rep;
   if (rep != "") rep = "-" + rep;

   var f = java.lang.System.getProperty("user.home") + "/.openaf-sec" + rep + ".yml";

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
   this.openSBuckets(__, aMainSecret);
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
 
    this.sbucket     = _$(sBucket, "sBucket").isString().default(__);
    this.aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(__);

    if ($ch().list().indexOf(this.aCh) < 0) throw ("aCh not found");
};
 
const __sbucket__encrypt = function(aObj, aMainKey, aKey) {
    if (isDef(aKey)) {
      var mk; 
      try {
         mk = af.decrypt(Packages.openaf.AFCmdBase.afc.dIP(aKey), sha512(Packages.openaf.AFCmdBase.afc.dIP(aMainKey)).substr(0, 16));
      } catch(e) {
         mk = Packages.openaf.AFCmdBase.afc.dIP(aKey);
      }
      var s = af.encrypt(stringify(isMap(aObj) ? sortMapKeys(aObj) : aObj, __, ""), sha512(mk).substr(0, 16));
      return af.fromBytes2String(af.toBase64Bytes(af.fromString2Bytes(s)));
    } else {
      return aObj;
    }

};
 
const __sbucket__decrypt = function(aObj, aMainKey, aKey) {
   if (isDef(aKey)) {
      var mk; 
      try {
         mk = af.decrypt(Packages.openaf.AFCmdBase.afc.dIP(aKey), sha512(Packages.openaf.AFCmdBase.afc.dIP(aMainKey)).substr(0, 16));
      } catch(e) {
         mk = Packages.openaf.AFCmdBase.afc.dIP(aKey);
      }
      var s = af.fromBytes2String(af.fromBase64(aObj));
      return jsonParse(af.decrypt(s, sha512(mk).substr(0, 16)));
   } else {
      return aObj;
   }
};

const __sbucket__uri = function(aUri) {
   _$(aUri, "aUri").isString().$_();

   var uri = new java.net.URI(aUri);
   if (uri.getScheme().equals("sbucket")) {
       var ar = String(uri.getPath()).split("/");
       ar.shift();
       var dLockSecret, aMainSecret;
       if (uri.getUserInfo() != null) {
           [dLockSecret, aMainSecret] = String(uri.getUserInfo()).split(":");
       }
       return {
           repo      : String(uri.getHost()) == "default" ? "" : String(uri.getHost()), 
           bucket    : String(ar.shift()), 
           lockSecret: dLockSecret, 
           mainSecret: aMainSecret,
           key       : ar.join("/")
       };
   };

   return {};
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
    if (isDef(kv) && ( (isDef(kv.v) && isDef(aLockSecret)) || (isMap(kv) && isUnDef(aLockSecret)) ) ) {
       var sb = isDef(aLockSecret) ? __sbucket__decrypt(kv.v, this.s, aLockSecret) : kv;
       if (isMap(sb)) {
          return (isDef(aLockSecret) ? sb.keys[aKey] : sb[aKey]);
       } else {
          throw "Wrong bucket and/or secret";
       }
    } else {
       throw "Bucket '" + sBucket + "' not found.";
    }
};
 
/**
 * <odoc>
 * <key>ow.sec.SBucket.getKeys(sBucket, aLockSecret, aKey) : Map</key>
 * Returns a map with a list of all the sBuckets on the current repo. If a specifc sBucket and aLockSecret isn't provide
 * the current sBucket will have an associated array with the list of corresponding keys.
 * </odoc>
 */
OpenWrap.sec.prototype.SBucket.prototype.getKeys = function(sBucket, aLockSecret) {
   sBucket     = _$(sBucket, "sBucket").isString().default(this.sbucket);
   aLockSecret = _$(aLockSecret, "aLockSecret").isString().default(this.aLockSecret);

   var sbs = $ch(this.aCh).getKeys();
   var rres = {};
   sbs.forEach(r => {
      rres[r] = [];
      if (r == sBucket) {
         var kv = $ch(this.aCh).get({ sbucket: r });
         if (isDef(kv) && ( (isDef(kv.v) && isDef(aLockSecret)) || (isMap(kv) && isUnDef(aLockSecret)) ) ) {
            var sb = isDef(aLockSecret) ? __sbucket__decrypt(kv.v, this.s, aLockSecret) : kv;
            if (isDef(aLockSecret) && isDef(sb.keys)) {
               rres[r] = Object.keys(sb.keys);
            } else if (isUnDef(aLockSecret) && isDef(sb)) {
               rres[r] = Object.keys(sb);
            }
         }
      }
   });

   return rres;
};

/**
 * <odoc>
 * <key>ow.sec.SBucket.getSSecret(aKey) : Map</key>
 * Returns the associated aKey value.
 * </odoc>
 */
OpenWrap.sec.prototype.SBucket.prototype.getSSecret = function(aKey) {
    return this.getSecret(__, __, aKey);
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
    if (isDef(kv) && ( (isDef(kv.v) && isDef(aLockSecret)) || (isMap(kv) && isUnDef(aLockSecret)) ) ) {
       var sb = __sbucket__decrypt(kv.v, this.s, aLockSecret);
       if (isMap(sb)) {
          return af.encrypt(isDef(aLockSecret) ? sb.keys[aKey] : sb[aKey], aEncryptKey);
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
    return this.getSecretAs(__, __, aEncryptKey, aKey);
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
 
   if (isDef(aLockSecret)) 
      $ch(this.aCh).set({ sbucket: sBucket }, { sbucket: sBucket, v: __sbucket__encrypt({ name: sBucket, keys: {} }, this.s, aLockSecret) });
   else
      $ch(this.aCh).set({ sbucket: sBucket }, {});
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
    if (isUnDef(kv)) {
       this.createBucket(sBucket, aLockSecret);
    }
 
    kv = $ch(this.aCh).get({ sbucket: sBucket});
    var sb = isDef(aLockSecret) ? __sbucket__decrypt(kv.v, this.s, aLockSecret) : kv;
    if (isMap(sb)) {
       if (isDef(aLockSecret)) sb.keys[aKey] = aObj; else sb[aKey] = aObj;
       if (isDef(aLockSecret))
         $ch(this.aCh).set({ sbucket: sBucket }, { sbucket: sBucket, v: __sbucket__encrypt(sb, this.s, aLockSecret) });
       else
         $ch(this.aCh).set({ sbucket: sBucket }, sb);
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
    return this.setSecret(__, __, aKey, aObj);
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
    if (isUnDef(kv)) {
       this.createBucket(sBucket, aLockSecret);
    }
 
    kv = $ch(this.aCh).get({ sbucket: sBucket});
    var sb = isDef(aLockSecret) ? __sbucket__decrypt(kv.v, this.s, aLockSecret) : kv;
    if (isMap(sb)) {
       if (isDef(aLockSecret)) delete sb.keys[aKey]; else delete sb[aKey];
       if (isDef(aLockSecret))
          $ch(this.aCh).set({ sbucket: sBucket }, { sbucket: sBucket, v: __sbucket__encrypt(sb, this.s, aLockSecret) });
       else
          $ch(this.aCh).set({ sbucket: sBucket }, sb);
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
    return this.unsetSecret(__, __, aKey);
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
    return this.getBucket(__, __);
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
    return this.setBucket(__, __, aBucketString);
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
    return this.setNewObj(__, __, aKey, aObject, args);
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
          if (isUnDef(vv)) {
             ar.push("__");
          } else {
            if (isString(vv)) vv = stringify(vv, __, "");
            ar.push(vv);
          }
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
    return this.getNewObj(__, __, aKey);
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
    return this.setNewFn(__, __, aKey, aFn, args);
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
          if (vv == __) vv = "__";
          if (isString(vv)) vv = stringify(vv, __, "");
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
    return this.getNewFn(__, __, aKey);
};