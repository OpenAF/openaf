(function() {
  function assertEq(a, b, msg) { ow.test.assert(a, b, msg); }
  function fails(fn, fragment) {
    var error;
    try { fn(); } catch(e) { error = String(e); }
    assertEq(isString(error) && error.indexOf(fragment) >= 0, true, 'Expected error containing ' + fragment + ', got ' + error);
  }
  function fixture(fn) {
    ow.loadServer(); ow.loadSec();
    var port = findRandomOpenPort(), hs = ow.server.httpd.start(port, '127.0.0.1');
    var root = 'http://127.0.0.1:' + port;
    var state = { tokens: [], mode: 'ok', rotation: true };
    ow.server.httpd.route(hs, {
      '/.well-known/oauth-protected-resource/mcp': function() {
        return ow.server.httpd.reply({ resource: root + '/mcp', authorization_servers: [root] }, 200, 'application/json', {});
      },
      '/.well-known/oauth-authorization-server': function() {
        return ow.server.httpd.reply({ issuer: root, token_endpoint: root + '/token', authorization_endpoint: root + '/authorize' }, 200, 'application/json', {});
      },
      '/token': function(req) {
        var body = req.files && req.files.postData || req.data;
        var params = merge(req.params || {}, isString(body) ? ow.server.rest.parseQuery(body) : {});
        state.tokens.push(params);
        if (state.mode === 'revoked') return ow.server.httpd.reply({ error: 'invalid_grant' }, 400, 'application/json', {});
        if (state.mode === 'offline') return ow.server.httpd.reply({ error: 'temporarily_unavailable' }, 503, 'application/json', {});
        if (state.mode === 'rejectRefresh' && params.grant_type === 'refresh_token') {
          state.mode = 'ok';
          return ow.server.httpd.reply({ error: 'invalid_grant' }, 400, 'application/json', {});
        }
        if (params.grant_type === 'refresh_token' && params.refresh_token !== state.currentRefresh) {
          return ow.server.httpd.reply({ error: 'invalid_grant' }, 400, 'application/json', {});
        }
        var result = { access_token: 'access-secret-' + state.tokens.length, expires_in: 3600, token_type: 'Bearer' };
        if (state.rotation) result.refresh_token = state.currentRefresh = 'refresh-secret-' + state.tokens.length;
        if (state.noExpiry) delete result.expires_in;
        return ow.server.httpd.reply(result, 200, 'application/json', {});
      }
    });
    var dir = io.createTempFile('mcp-oauth-', '.tmp'); io.rm(dir); io.mkdir(dir);
    var cfg = {
      type: 'remote', url: root + '/mcp',
      auth: {
        type: 'oauth2', grantType: 'authorization_code', clientId: 'public',
        authURL: root + '/authorize', tokenURL: root + '/token',
        redirectURI: 'http://127.0.0.1:' + findRandomOpenPort() + '/',
        callback: true, disableOpenBrowser: true, loginTimeoutMs: 200,
        sendResource: false, scope: 'read offline_access',
        tokenStore: { repo: 'mcp-test-' + genUUID(), file: dir + '/credentials.yml', key: 'alice', mainSecret: 'fixture-main-secret', lockSecret: 'fixture-lock' }
      }
    };
    var clients = [];
    function client(config) { var c = $mcp(config || cfg); clients.push(c); return c; }
    try { fn({ cfg: cfg, state: state, client: client }); }
    finally {
      clients.forEach(function(c) { c.destroy(); });
      ow.server.httpd.stop(hs); io.rm(dir);
    }
  }
  function callback(cfg, mode) {
    cfg.auth.onAuthorizationURL = function(url) {
      var params = ow.server.rest.parseQuery(String(new java.net.URI(url).getRawQuery()));
      cfg._testChallenge = params.code_challenge;
      assertEq(params.code_challenge_method, 'S256', 'PKCE S256');
      if (cfg.auth.sendResource === false) assertEq(isUnDef(params.resource), true, 'Resource omitted');
      var tail = mode === 'deny' ? '&error=access_denied' : '&code=callback-code';
      $rest().get(cfg.auth.redirectURI + '?state=' + (mode === 'bad-state' ? 'wrong' : params.state) + tail);
    };
  }
  exports.testPersistentOAuthCallbackAndRefresh = function() {
    fixture(function(ctx) {
      callback(ctx.cfg);
      var c = ctx.client();
      assertEq(c.authenticate().authenticated, true, 'Callback login succeeds');
      assertEq(ctx.state.tokens[0].code, 'callback-code', 'Exchanged returned code');
      var verifier = ctx.state.tokens[0].code_verifier;
      assertEq(isString(verifier) && verifier.length >= 43, true, 'PKCE verifier sent');
      var digest = java.security.MessageDigest.getInstance('SHA-256').digest(af.fromString2Bytes(verifier));
      var challenge = String(af.fromBytes2String(af.toBase64Bytes(digest))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
      assertEq(challenge, ctx.cfg._testChallenge, 'Verifier matches the authorization challenge');
      var raw = io.readFileString(ctx.cfg.auth.tokenStore.file);
      assertEq(raw.indexOf('access-secret') < 0 && raw.indexOf('refresh-secret') < 0, true, 'Tokens encrypted on disk');
      ctx.cfg.auth.interactive = false;
      var next = ctx.client(); next.authenticate();
      assertEq(ctx.state.tokens.length, 1, 'Restart reuses credentials without token exchange');
      ctx.cfg.auth.refreshWindowMs = 7200000;
      var refresh = ctx.client(); refresh.authenticate();
      assertEq(ctx.state.tokens[1].grant_type, 'refresh_token', 'Refresh grant');
      assertEq(ctx.state.tokens[1].refresh_token, 'refresh-secret-1', 'Cached refresh token used');
      ctx.state.rotation = false; refresh.authenticate(); refresh.authenticate();
      assertEq(ctx.state.tokens[3].refresh_token, 'refresh-secret-2', 'Missing rotated token preserves previous');
      assertEq(refresh.clearAuth().authenticated, false, 'Logout clears local credentials');
      fails(function() { next.authenticate(); }, 'login required');
    });
  };
  exports.testOAuthConcurrentProcessRefresh = function() {
    fixture(function(ctx) {
      callback(ctx.cfg); ctx.client().authenticate();
      var store = ctx.cfg.auth.tokenStore;
      var sec = $sec(store.repo, store.bucket, store.lockSecret, store.mainSecret, store.file);
      var entry = sec.get(store.key); entry.expiresAt = now() - 1000; sec.set(store.key, entry); sec.close();
      ctx.cfg.auth.interactive = false;
      delete ctx.cfg.auth.onAuthorizationURL;
      var script = store.file + '.child.js';
      io.writeFileString(script, 'try { var c=$mcp(' + stringify(ctx.cfg, __, '') + '); c.authenticate(); c.destroy(); exit(0); } catch(e) { printErr(String(e)); exit(1); }');
      var results = parallel4Array([1, 2], function() {
        return $sh([ow.format.getJavaHome() + '/bin/java', '-jar', getOpenAFJar(), '-f', script]).get(0);
      });
      results.forEach(function(r) { assertEq(r.exitcode, 0, 'Child authentication succeeded: ' + r.stderr); });
      assertEq(ctx.state.tokens.length, 2, 'Two processes share one refresh exchange');
      ctx.client().clearAuth();
      assertEq(ctx.client().clearAuth().authenticated, false, 'Repeated logout is harmless');
    });
  };
  exports.testOAuthOccupiedCallbackPort = function() {
    fixture(function(ctx) {
      var port = Number(new java.net.URI(ctx.cfg.auth.redirectURI).getPort());
      var occupied = ow.server.httpd.start(port, '127.0.0.1');
      try { fails(function() { ctx.client().authenticate(); }, 'port unavailable'); }
      finally { ow.server.httpd.stop(occupied); }
      callback(ctx.cfg); assertEq(ctx.client().authenticate().authenticated, true, 'Login works after port released');
    });
  };
  exports.testOAuthCallbackFailures = function() {
    fixture(function(ctx) {
      callback(ctx.cfg, 'bad-state'); fails(function() { ctx.client().authenticate(); }, 'timed out');
      callback(ctx.cfg, 'deny'); fails(function() { ctx.client().authenticate(); }, 'denied');
      delete ctx.cfg.auth.onAuthorizationURL;
      fails(function() { ctx.client().authenticate(); }, 'timed out');
      callback(ctx.cfg); assertEq(ctx.client().authenticate().authenticated, true, 'Listener cleaned up after failures');
    });
  };
  exports.testOAuthProfileIsolationAndStorageFailure = function() {
    fixture(function(ctx) {
      callback(ctx.cfg); ctx.client().authenticate();
      var other = clone(ctx.cfg); other.auth.scope = 'other';
      fails(function() { ctx.client(other).authenticate(); }, 'configuration mismatch');
      other = clone(ctx.cfg); other.auth.tokenStore.lockSecret = 'wrong';
      fails(function() { ctx.client(other).authenticate(); }, 'storage read failed');
      other = clone(ctx.cfg); other.auth.tokenStore.file += '/missing/file';
      fails(function() { ctx.client(other).authenticate(); }, '');
    });
  };
  exports.testOAuthRefreshFailureClassification = function() {
    fixture(function(ctx) {
      callback(ctx.cfg); var c = ctx.client(); c.authenticate();
      ctx.cfg.auth.refreshWindowMs = 7200000;
      ctx.state.mode = 'offline'; fails(function() { c.authenticate(); }, 'OAuth token request failed');
      assertEq(c.getAuthStatus().refreshable, true, 'Transient errors preserve refresh token');
      ctx.state.mode = 'revoked'; fails(function() { c.authenticate(); }, 'login required');
      assertEq(c.getAuthStatus().refreshable, false, 'Revoked credentials removed');
    });
  };
  exports.testOAuthDestroyCancelsCallback = function() {
    fixture(function(ctx) {
      var c = ctx.client();
      ctx.cfg.auth.onAuthorizationURL = function() { c.destroy(); };
      fails(function() { c.authenticate(); }, 'cancelled');
      callback(ctx.cfg);
      assertEq(ctx.client().authenticate().authenticated, true, 'Destroy releases callback port');
    });
  };
  exports.testOAuthUnattendedAndCallbackValidation = function() {
    fixture(function(ctx) {
      ctx.cfg.auth.interactive = false;
      ctx.cfg.auth.onAuthorizationURL = function() { throw 'Unexpected browser flow'; };
      fails(function() { ctx.client().authenticate(); }, 'interactive authentication is disabled');
      assertEq(ctx.state.tokens.length, 0, 'No network token exchange before login');
      ctx.cfg.auth.interactive = true;
      ctx.cfg.auth.redirectURI = 'http://example.com:1234/callback';
      fails(function() { ctx.client().authenticate(); }, 'loopback');
    });
  };
  function memoryStore() {
    var records = {}, locked = false;
    return {
      records: records,
      withLock: function(key, fn) {
        assertEq(locked, false, 'No nested token-store transaction');
        locked = true;
        try { return fn(); } finally { locked = false; }
      },
      load: function(key) { assertEq(locked, true, 'Load under lock'); return clone(records[key]); },
      save: function(key, record) { assertEq(locked, true, 'Save under lock'); records[key] = clone(record); },
      clear: function(key) { assertEq(locked, true, 'Clear under lock'); delete records[key]; }
    };
  }
  exports.testOAuthCustomStoreAndIdentity = function() {
    fixture(function(ctx) {
      var store = memoryStore(); ctx.cfg.auth.tokenStore = store;
      callback(ctx.cfg); ctx.client().authenticate();
      ctx.cfg.auth.interactive = false;
      ctx.client().authenticate();
      assertEq(ctx.state.tokens.length, 1, 'Custom store reused across instances');
      ctx.cfg.auth.scope = 'offline_access read read';
      ctx.client().authenticate();
      assertEq(ctx.state.tokens.length, 1, 'Scopes sorted and deduplicated');
      ['profile', 'scope', 'audience', 'redirectURI', 'clientId', 'resource', 'extraParams'].forEach(function(field) {
        var cfg = clone(ctx.cfg); cfg.auth.tokenStore = store;
        if (field === 'profile') store.profile = 'bob';
        else if (field === 'resource') { cfg.auth.sendResource = true; cfg.auth.resource = 'https://other.example'; }
        else cfg.auth[field] = field === 'extraParams' ? { tenant_hint: 'other' } : 'other';
        fails(function() { ctx.client(cfg).authenticate(); }, 'login required');
        delete store.profile;
      });
      assertEq(Object.keys(store.records).length, 1, 'Cache misses do not overwrite another identity');
      var c = ctx.client(); c.clearAuth();
      assertEq(Object.keys(store.records).length, 0, 'Custom clear removes record');
      assertEq(c.clearAuth().authenticated, false, 'Custom clear idempotent');
    });
  };
  exports.testOAuthStoreFailureAndRecovery = function() {
    fixture(function(ctx) {
      var store = memoryStore(); ctx.cfg.auth.tokenStore = store;
      callback(ctx.cfg); var c = ctx.client(); c.authenticate();
      var save = store.save;
      ctx.cfg.auth.refreshWindowMs = 7200000;
      store.save = function() { throw 'access-secret leaked by backend'; };
      fails(function() { c.authenticate(); }, 'storage write failed');
      var calls = ctx.state.tokens.length;
      fails(function() { c.authenticate(); }, 'clearAuth or recreate');
      assertEq(ctx.state.tokens.length, calls, 'Failed save prevents another refresh');
      store.save = save; c.clearAuth(); c.authenticate();
      assertEq(ctx.state.tokens.length, calls + 1, 'Explicit clearing permits fresh authentication');
      var key = Object.keys(store.records)[0], saved = clone(store.records[key]);
      store.records[key].version = 999;
      fails(function() { ctx.client().getAuthStatus(); }, 'configuration mismatch');
      store.records[key] = clone(saved); store.records[key].expiresAt = 'invalid';
      fails(function() { ctx.client().authenticate(); }, 'profile is invalid');
      store.records[key] = saved;
      store.load = function() { throw 'refresh-secret backend detail'; };
      fails(function() { ctx.client().authenticate(); }, 'storage read failed');
      store.withLock = function() { throw 'secret lock detail'; };
      fails(function() { ctx.client().authenticate(); }, 'storage lock failed');
      store.withLock = function() {};
      fails(function() { ctx.client().authenticate(); }, 'synchronously');
    });
  };
  exports.testOAuthExpiryAndFreshLogin = function() {
    fixture(function(ctx) {
      var store = memoryStore(); ctx.cfg.auth.tokenStore = store;
      callback(ctx.cfg); var logins = 0, onURL = ctx.cfg.auth.onAuthorizationURL;
      ctx.cfg.auth.onAuthorizationURL = function(url) { logins++; onURL(url); };
      var c = ctx.client(); c.authenticate();
      var key = Object.keys(store.records)[0]; store.records[key].expiresAt = now() - 1;
      ctx.state.mode = 'rejectRefresh';
      c.authenticate();
      assertEq(logins, 2, 'Rejected refresh starts fresh login once');
      assertEq(ctx.state.tokens.length, 3, 'One failed refresh followed by one code exchange');
      assertEq(ctx.state.tokens[2].grant_type, 'authorization_code', 'Fresh authorization grant');
      store.records[key].expiresAt = now() - 1;
      ctx.state.mode = 'rejectRefresh'; ctx.cfg.auth.interactive = false;
      fails(function() { c.authenticate(); }, 'interactive authentication is disabled');
      assertEq(Object.keys(store.records).length, 0, 'Rejected credentials cleared before unattended error');
      ctx.state.mode = 'ok'; ctx.cfg.auth.interactive = true; ctx.state.noExpiry = true;
      var unknown = ctx.client(); unknown.authenticate();
      var count = ctx.state.tokens.length; unknown.authenticate();
      assertEq(ctx.state.tokens.length, count, 'Missing expiry reused only within issuing instance');
      ctx.client().authenticate();
      assertEq(ctx.state.tokens.length, count + 1, 'New instance refreshes token with unknown expiry');
    });
  };
  exports.testOAuthSecDefaultsAndLockTimeout = function() {
    fixture(function(ctx) {
      var cfg = ctx.cfg.auth.tokenStore; cfg.type = 'sec'; delete cfg.repo; delete cfg.key;
      callback(ctx.cfg); ctx.client().authenticate();
      ctx.cfg.auth.interactive = false; ctx.client().authenticate();
      assertEq(ctx.state.tokens.length, 1, 'Default repository and hashed key reuse credentials');
      var raw = io.readFileYAML(cfg.file);
      assertEq(Object.keys(raw).length, 1, 'Default bucket');
      var handle = new java.io.RandomAccessFile(cfg.file + '.lock', 'rw'), lock = handle.getChannel().lock();
      cfg.lockTimeoutMs = 100;
      var started = now();
      try { fails(function() { ctx.client().authenticate(); }, 'timed out'); }
      finally { lock.release(); handle.close(); }
      assertEq(now() - started < 5000, true, 'Lock wait bounded');
      ctx.client().authenticate();
      cfg.profile = 'bob';
      fails(function() { ctx.client().authenticate(); }, 'login required');
      delete cfg.profile;
      io.writeFileString(cfg.file, '[not, a, repository]');
      fails(function() { ctx.client().authenticate(); }, 'storage');
    });
  };
  exports.testOAuthNoStoreAndOverrideValidation = function() {
    fixture(function(ctx) {
      var file = ctx.cfg.auth.tokenStore.file;
      delete ctx.cfg.auth.tokenStore; callback(ctx.cfg);
      var c = ctx.client(); c.authenticate(); c.authenticate();
      assertEq(ctx.state.tokens.length, 1, 'In-memory default unchanged');
      assertEq(io.fileExists(file), false, 'No secret file without opt-in');
      ctx.client().authenticate();
      assertEq(ctx.state.tokens.length, 2, 'No implicit sharing without store');
      ctx.state.mode = 'revoked'; ctx.cfg.auth.refreshWindowMs = 7200000;
      fails(function() { c.authenticate(); }, 'login required');
      assertEq(ctx.state.tokens.length, 3, 'No-store invalid_grant policy remains unchanged');
      ctx.cfg.auth.tokenStore = memoryStore(); ctx.cfg.auth.extraParams = { refresh_token: 'override' };
      fails(function() { ctx.client().authenticate(); }, 'protocol field overrides');
    });
  };
  exports.testOAuthDefaultKeyAcrossProcesses = function() {
    fixture(function(ctx) {
      var parent = String(new java.io.File(ctx.cfg.auth.tokenStore.file).getParent());
      var configs = [1, 2].map(function(i) {
        var cfg = clone(ctx.cfg);
        cfg.auth.grantType = 'client_credentials'; cfg.auth.interactive = false;
        cfg.auth.tokenStore.file = parent + '/process-' + i + '.yml';
        cfg.auth.tokenStore.repo += '-' + i;
        delete cfg.auth.tokenStore.mainSecret; delete cfg.auth.tokenStore.lockSecret;
        return cfg;
      });
      var results = parallel4Array(configs, function(cfg) {
        var script = cfg.auth.tokenStore.file + '.js';
        io.writeFileString(script, 'try { var c=$mcp(' + stringify(cfg, __, '') + '); c.authenticate(); c.destroy(); exit(0); } catch(e) { printErr(String(e)); exit(1); }');
        return $sh().envs({ OAF_HOME: parent }, true).sh([ow.format.getJavaHome() + '/bin/java', '-jar', getOpenAFJar(), '-f', script]).get(0);
      });
      results.forEach(function(r) { assertEq(r.exitcode, 0, 'Concurrent first use succeeded: ' + r.stderr); });
      var main = io.readFileString(parent + '/.openaf-sec');
      configs.forEach(function(cfg) {
        var opts = cfg.auth.tokenStore, sec = $sec(opts.repo, __, __, main, opts.file);
        try { assertEq(isString(sec.get(opts.key).token), true, 'Both processes used the same main secret'); }
        finally { sec.close(); }
      });
      if (!ow.format.isWindows()) {
        [parent + '/.openaf-sec'].concat(configs.map(function(cfg) { return cfg.auth.tokenStore.file; })).forEach(function(file) {
          var permissions = java.nio.file.Files.getPosixFilePermissions(new java.io.File(file).toPath());
          assertEq(String(java.nio.file.attribute.PosixFilePermissions.toString(permissions)), 'rw-------', 'New secrets are owner-only');
        });
      }
    });
  };
  exports.testOAuthConcurrentProcessProfiles = function() {
    fixture(function(ctx) {
      ctx.cfg.auth.grantType = 'client_credentials'; ctx.cfg.auth.interactive = false;
      var configs = ['alice', 'bob'].map(function(profile) {
        var cfg = clone(ctx.cfg); cfg.auth.tokenStore.key = profile; return cfg;
      });
      var results = parallel4Array(configs, function(cfg) {
        var script = cfg.auth.tokenStore.file + '.' + cfg.auth.tokenStore.key + '.js';
        io.writeFileString(script, 'try { var c=$mcp(' + stringify(cfg, __, '') + '); c.authenticate(); c.destroy(); exit(0); } catch(e) { printErr(String(e)); exit(1); }');
        return $sh([ow.format.getJavaHome() + '/bin/java', '-jar', getOpenAFJar(), '-f', script]).get(0);
      });
      results.forEach(function(r) { assertEq(r.exitcode, 0, 'Concurrent profile persisted: ' + r.stderr); });
      configs.forEach(function(cfg) { ctx.client(cfg).authenticate(); });
      assertEq(ctx.state.tokens.length, 2, 'Concurrent profile writes both survive');
    });
  };
  exports.testOAuthDiscoveredStoreIdentity = function() {
    fixture(function(ctx) {
      delete ctx.cfg.auth.tokenStore.key;
      ctx.cfg.auth.sendResource = true;
      delete ctx.cfg.auth.authURL;
      callback(ctx.cfg); ctx.client().authenticate();
      ctx.cfg.auth.interactive = false;
      ctx.client().authenticate();
      assertEq(ctx.state.tokens.length, 1, 'Auth endpoint discovery does not change stored identity');
      delete ctx.cfg.auth.tokenURL;
      ctx.client().authenticate();
      assertEq(ctx.state.tokens.length, 1, 'Explicit and discovered endpoints select the same identity');
    });
  };
  exports.testOAuthSameClientLockTimeout = function() {
    fixture(function(ctx) {
      ctx.cfg.auth.tokenStore.lockTimeoutMs = 100;
      callback(ctx.cfg);
      var onURL = ctx.cfg.auth.onAuthorizationURL;
      var started = new java.util.concurrent.CountDownLatch(1), contended = new java.util.concurrent.CountDownLatch(1);
      ctx.cfg.auth.onAuthorizationURL = function(url) {
        started.countDown();
        if (!contended.await(5000, java.util.concurrent.TimeUnit.MILLISECONDS)) throw 'Contending thread did not finish';
        onURL(url);
      };
      var c = ctx.client();
      var results = parallel4Array(['login', 'contend'], function(task) {
        if (task === 'login') return c.authenticate().authenticated;
        if (!started.await(5000, java.util.concurrent.TimeUnit.MILLISECONDS)) throw 'Login did not start';
        try {
          var error;
          try { c.getAuthStatus(); } catch(e) { error = String(e); }
          return isString(error) && error.indexOf('lock timed out') >= 0;
        } finally { contended.countDown(); }
      });
      assertEq(results, [true, true], 'Same-client contention times out without interrupting login');
    });
  };
})();
