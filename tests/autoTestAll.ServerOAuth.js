(function() {
  function eq(a, b, message) { ow.test.assert(a, b, message); }
  function fails(fn, fragment) {
    var error;
    try { fn(); } catch(e) { error = String(e); }
    eq(isString(error) && error.indexOf(fragment) >= 0, true, 'Expected ' + fragment + ', got ' + error);
    return error;
  }
  function fixture(fn) {
    ow.loadServer(); ow.loadSec();
    var hs = ow.server.httpd.start(findRandomOpenPort(), '127.0.0.1');
    var root = 'http://127.0.0.1:' + hs.getPort();
    var dir = io.createTempFile('server-oauth-', '.tmp'); io.rm(dir); io.mkdir(dir);
    var state = { requests: [], mode: 'ok', rotation: true };
    ow.server.httpd.route(hs, {
      '/authorize': function(req) {
        state.challenge = req.params.code_challenge;
        return ow.server.httpd.reply('ok', 200, 'text/plain', {});
      },
      '/token': function(req) {
        var body = req.files && req.files.postData || req.data;
        var params = merge(req.params || {}, isString(body) ? ow.server.rest.parseQuery(body) : {});
        state.requests.push(params);
        if (state.mode === 'offline') return ow.server.httpd.reply({ error: 'temporarily_unavailable', error_description: 'provider-secret' }, 503, 'application/json', {});
        if (state.mode === 'falseSuccess') return ow.server.httpd.reply({ access_token: 'bad-secret' }, 400, 'application/json', {});
        if (state.mode === 'invalid') return ow.server.httpd.reply({ error: 'invalid_grant' }, 400, 'application/json', {});
        if (state.mode === 'interaction') return ow.server.httpd.reply({ error: 'interaction_required' }, 400, 'application/json', {});
        if (state.mode === 'rejectRefresh' && params.grant_type === 'refresh_token') {
          state.mode = 'ok'; return ow.server.httpd.reply({ error: 'invalid_grant' }, 400, 'application/json', {});
        }
        if (params.grant_type === 'refresh_token' && params.refresh_token !== state.refresh) {
          return ow.server.httpd.reply({ error: 'invalid_grant' }, 400, 'application/json', {});
        }
        if (params.grant_type === 'authorization_code') {
          var digest = java.security.MessageDigest.getInstance('SHA-256').digest(af.fromString2Bytes(params.code_verifier));
          var challenge = String(af.fromBytes2String(af.toBase64Bytes(digest))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
          eq(challenge, state.challenge, 'Token verifier matches login challenge');
        }
        var response = { access_token: 'access-secret-' + state.requests.length, token_type: 'Bearer', expires_in: 3600 };
        if (state.rotation) response.refresh_token = state.refresh = 'refresh-secret-' + state.requests.length;
        if (state.noExpiry) delete response.expires_in;
        return ow.server.httpd.reply(response, 200, 'application/json', {});
      }
    });
    var opts = { authURL: root + '/authorize', tokenURL: root + '/token', clientId: 'public',
      redirectURI: 'http://127.0.0.1:' + findRandomOpenPort() + '/callback',
      disableOpenBrowser: true, loginTimeoutMs: 250, scope: 'read offline_access',
      tokenStore: { file: dir + '/tokens.yml', mainSecret: 'fixture-main', lockSecret: 'fixture-lock' } };
    var clients = [];
    function client(options) { var c = ow.server.httpd.oauth2(options || opts); clients.push(c); return c; }
    function onURL(url) {
      var params = ow.server.rest.parseQuery(String(new java.net.URI(url).getRawQuery()));
      eq(params.code_challenge_method, 'S256', 'S256 PKCE');
      eq(params.redirect_uri, opts.redirectURI, 'Configured callback is used');
      state.challenge = params.code_challenge; state.authParams = params;
      return params;
    }
    function callback() {
      opts.onAuthorizationURL = function(url) {
        var params = onURL(url);
        eq($rest().get(opts.redirectURI + '?state=' + params.state + '&code=' + encodeURIComponent('code+with=characters%')), 'Sign-in received. You may close this window.', 'Exact callback route succeeds');
      };
    }
    function released() {
      var port = Number(new java.net.URI(opts.redirectURI).getPort());
      var listener = ow.server.httpd.start(port, '127.0.0.1', __, __, __, __, 30000, 'java');
      try { eq(Number(listener.getPort()), port, 'Callback port can be reused'); }
      finally { ow.server.httpd.stop(listener); }
      eq(isUnDef(ow.server.httpd.__routes[port]), true, 'Callback routes cleaned');
    }
    try { fn({ opts: opts, state: state, client: client, callback: callback, onURL: onURL, released: released, dir: dir }); }
    finally { clients.forEach(function(c) { c.cancel(); }); ow.server.httpd.stop(hs); io.rm(dir); }
  }
  exports.testLoginStorageAndRefresh = function() {
    fixture(function(ctx) {
      ctx.opts.clientSecret = 'client-secret'; ctx.opts.resource = 'https://resource.example'; ctx.opts.audience = 'audience';
      ctx.opts.extraParams = { tenant_hint: 'tenant' }; ctx.opts.extraAuthParams = { prompt: 'consent' };
      ctx.callback(); var c = ctx.client();
      eq(c.authenticate().access_token, 'access-secret-1', 'Login returns tokens'); ctx.released();
      eq(ctx.state.requests[0].code, 'code+with=characters%', 'Raw callback query is decoded once');
      ['client_id', 'client_secret', 'scope', 'resource', 'audience', 'tenant_hint'].forEach(function(k) {
        var expected = {client_id:'public', client_secret:'client-secret', scope:'read offline_access', resource:'https://resource.example', audience:'audience', tenant_hint:'tenant'};
        eq(ctx.state.requests[0][k], expected[k], 'Exchange parameter ' + k);
      });
      eq(ctx.state.authParams.resource, ctx.opts.resource, 'Authorization resource');
      eq(ctx.state.authParams.prompt, 'consent', 'Additional authorization parameter');
      var raw = io.readFileString(ctx.opts.tokenStore.file);
      ['access-secret', 'refresh-secret', 'client-secret', 'code+with', ctx.state.authParams.state, ctx.state.requests[0].code_verifier].forEach(function(secret) {
        eq(raw.indexOf(secret) < 0, true, 'Secret not plaintext on disk');
      });
      var sec = $sec('oauth2', __, 'fixture-lock', 'fixture-main', ctx.opts.tokenStore.file);
      try {
        var record = sec.get(sec.list().default[0]);
        eq(isUnDef(record.clientSecret) && isUnDef(record.code) && isUnDef(record.state) && isUnDef(record.pkceVerifier), true, 'Transient/client secrets are not persisted');
      } finally { sec.close(); }
      ctx.opts.interactive = false;
      eq(ctx.client().authenticate().access_token, 'access-secret-1', 'Restart reuses encrypted token');
      eq(ctx.state.requests.length, 1, 'No exchange for valid cached token');
      ctx.opts.refreshWindowMs = 7200000;
      var next = ctx.client(); next.authenticate();
      eq(ctx.state.requests[1].refresh_token, 'refresh-secret-1', 'Stored refresh token used');
      ctx.state.rotation = false; next.authenticate(); next.authenticate();
      eq(ctx.state.requests[3].refresh_token, 'refresh-secret-2', 'Omitted rotation preserves latest refresh token');
      eq(next.clearAuth().authenticated, false, 'Clear removes credentials');
      eq(next.clearAuth().refreshable, false, 'Clear is idempotent');
      fails(function() { c.authenticate(); }, 'interactive authentication is disabled');
    });
  };
  exports.testCallbackValidationAndCleanup = function() {
    fixture(function(ctx) {
      ctx.opts.tokenStore = false;
      ctx.opts.onAuthorizationURL = function(url) {
        var p = ctx.onURL(url), base = ctx.opts.redirectURI;
        var invalid = [base + '?state=wrong&code=bad', base + '/child?state=' + p.state + '&code=bad',
          base + '?state=' + p.state, base + '?state=' + p.state + '&state=' + p.state + '&code=bad'];
        invalid.forEach(function(uri) { eq(isDef($rest().get(uri).error), true, 'Invalid callback rejected'); });
        eq($rest().post(base + '?state=' + p.state + '&code=bad', {}).error.responseCode, 400, 'POST rejected');
        eq($rest().get(base + '?state=' + p.state + '&code=good'), 'Sign-in received. You may close this window.', 'Valid callback after invalid requests');
        eq($rest().get(base + '?state=' + p.state + '&code=replay').error.responseCode, 400, 'Replay rejected');
      };
      ctx.client().authenticate(); eq(ctx.state.requests.length, 1, 'Only one token exchange'); ctx.released();
      ctx.opts.onAuthorizationURL = function(url) {
        var p = ctx.onURL(url); $rest().get(ctx.opts.redirectURI + '?state=' + p.state + '&error=access_denied&error_description=provider-secret');
      };
      var error = fails(function() { ctx.client().authenticate(); }, 'denied');
      eq(error.indexOf('provider-secret') < 0, true, 'Provider denial sanitized'); ctx.released();
      delete ctx.opts.onAuthorizationURL;
      fails(function() { ctx.client().authenticate(); }, 'timed out'); ctx.released();
      ctx.opts.onAuthorizationURL = function() { throw new Error('Hook failed'); };
      fails(function() { ctx.client().authenticate(); }, 'Hook failed'); ctx.released();
      var c = ctx.client(); ctx.opts.onAuthorizationURL = function() { c.cancel(); c.cancel(); };
      fails(function() { c.authenticate(); }, 'cancelled'); ctx.released();
      ctx.callback(); c.authenticate(); c.cancel();
      eq(c.getAuthStatus().authenticated, true, 'Cancel preserves completed credentials'); ctx.released();
      var port = Number(new java.net.URI(ctx.opts.redirectURI).getPort()), occupied = ow.server.httpd.start(port, '127.0.0.1');
      try { fails(function() { ctx.client().authenticate(); }, 'port unavailable'); eq(ow.server.httpd.getHS(port), occupied, 'Occupied server retained'); }
      finally { ow.server.httpd.stop(occupied); }
      ctx.client().authenticate(); ctx.released();
    });
  };
  exports.testConcurrentCallbacks = function() {
    fixture(function(ctx) {
      ctx.opts.tokenStore = false;
      ctx.opts.onAuthorizationURL = function(url) {
        var p = ctx.onURL(url);
        var responses = parallel4Array([1, 2, 3, 4], function(i) {
          var result = $rest().get(ctx.opts.redirectURI + '?state=' + p.state + '&code=concurrent-' + i);
          return isString(result) ? 200 : result.error.responseCode;
        }).sort();
        eq(responses, [200, 400, 400, 400], 'One callback atomically accepted');
      };
      ctx.client().authenticate(); eq(ctx.state.requests.length, 1, 'Single token exchange under concurrent delivery'); ctx.released();
    });
  };
  exports.testConfigurationAndUnattended = function() {
    fixture(function(ctx) {
      ctx.opts.tokenStore = false; ctx.opts.interactive = false;
      fails(function() { ctx.client().authenticate(); }, 'interactive authentication is disabled');
      eq(ctx.state.requests.length, 0, 'No exchange for missing unattended credentials');
      ctx.opts.interactive = true; ctx.callback();
      ['http://example.com:1234/cb', 'https://localhost:1234/cb', 'http://localhost/cb',
        'http://user@localhost:1234/cb', 'http://localhost:1234/cb?x=1', 'http://localhost:1234/cb#fragment'].forEach(function(uri) {
        var opts = clone(ctx.opts); opts.redirectURI = uri;
        fails(function() { ctx.client(opts).authenticate(); }, 'loopback');
      });
      ['loginTimeoutMs', 'tokenTimeoutMs', 'refreshWindowMs'].forEach(function(k) {
        var opts = clone(ctx.opts); opts[k] = -1;
        fails(function() { ctx.client(opts).authenticate(); }, k);
      });
      ['extraAuthParams', 'extraParams'].forEach(function(k) {
        var opts = clone(ctx.opts); opts[k] = { redirect_uri: 'override' };
        fails(function() { ctx.client(opts).authenticate(); }, 'protocol field overrides');
      });
      ctx.opts.redirectURI = ctx.opts.redirectURI.replace('127.0.0.1', 'localhost');
      ctx.client().authenticate(); ctx.released();
    });
  };
  exports.testRecoveryAndUnknownExpiry = function() {
    fixture(function(ctx) {
      ctx.callback(); var c = ctx.client(); c.authenticate();
      ctx.opts.refreshWindowMs = 7200000; ctx.state.mode = 'offline';
      var error = fails(function() { c.authenticate(); }, 'token request failed');
      eq(error.indexOf('provider-secret') < 0, true, 'Token endpoint errors sanitized');
      eq(c.getAuthStatus().refreshable, true, 'Transient error retains credentials');
      ctx.state.mode = 'rejectRefresh'; c.authenticate();
      eq(ctx.state.requests[ctx.state.requests.length - 1].grant_type, 'authorization_code', 'Rejected refresh starts fresh login');
      ctx.opts.interactive = false; ctx.state.mode = 'rejectRefresh';
      fails(function() { c.authenticate(); }, 'interactive authentication is disabled');
      eq(c.getAuthStatus().refreshable, false, 'Rejected refresh cleared before unattended failure');
      ctx.opts.interactive = true; ctx.state.mode = 'ok'; ctx.state.noExpiry = true; ctx.opts.refreshWindowMs = 30000;
      c.authenticate(); var calls = ctx.state.requests.length; c.authenticate();
      eq(ctx.state.requests.length, calls, 'Unknown expiry reused within issuing instance');
      ctx.client().authenticate(); eq(ctx.state.requests.length, calls + 1, 'Restart refreshes unknown expiry');
      ctx.state.mode = 'falseSuccess'; ctx.opts.refreshWindowMs = Number.MAX_SAFE_INTEGER;
      fails(function() { c.authenticate(); }, 'token request failed');
      ctx.state.mode = 'interaction'; fails(function() { c.authenticate(); }, 'login required');
      eq(c.getAuthStatus().refreshable, false, 'Interaction required clears tokens');
    });
  };
  exports.testStorageIdentityAndFailures = function() {
    fixture(function(ctx) {
      ctx.callback(); var c = ctx.client(); c.authenticate(); ctx.opts.interactive = false;
      ctx.opts.scope = 'offline_access read read'; ctx.client().authenticate();
      eq(ctx.state.requests.length, 1, 'Equivalent scopes share identity');
      ['scope', 'audience', 'clientId'].forEach(function(k) {
        var opts = clone(ctx.opts); opts[k] = 'other';
        fails(function() { ctx.client(opts).authenticate(); }, 'login required');
      });
      var wrong = clone(ctx.opts); wrong.tokenStore.lockSecret = 'wrong';
      fails(function() { ctx.client(wrong).authenticate(); }, 'storage read failed');
      var cfg = ctx.opts.tokenStore, handle = new java.io.RandomAccessFile(cfg.file + '.lock', 'rw'), lock = handle.getChannel().lock();
      cfg.lockTimeoutMs = 100;
      try { fails(function() { ctx.client().authenticate(); }, 'timed out'); }
      finally { lock.release(); handle.close(); }
      c.authenticate();
      var records = {}, saving = true;
      var custom = { withLock: function(key, fn) { return fn(); }, load: function(key) { return clone(records[key]); },
        save: function(key, record) { if (!saving) throw 'backend-secret'; records[key] = clone(record); }, clear: function(key) { delete records[key]; } };
      ctx.opts.tokenStore = custom; ctx.opts.interactive = true;
      var next = ctx.client(); next.authenticate();
      saving = false; ctx.opts.refreshWindowMs = 7200000;
      var err = fails(function() { next.authenticate(); }, 'storage write failed');
      eq(err.indexOf('backend-secret') < 0, true, 'Storage error sanitized');
      var calls = ctx.state.requests.length;
      fails(function() { next.authenticate(); }, 'clearAuth or recreate');
      eq(ctx.state.requests.length, calls, 'Failed save blocks subsequent exchanges');
      saving = true; next.clearAuth(); next.authenticate();
      custom.withLock = function() {};
      fails(function() { ctx.client().authenticate(); }, 'synchronously');
    });
  };
  exports.testJavaListenerWorkerCleanup = function() {
    ow.loadServer();
    var hs = ow.server.httpd.start(findRandomOpenPort(), '127.0.0.1', __, __, __, __, 30000, 'java');
    var field = java.lang.Class.forName('openaf.plugins.HTTPServer').getDeclaredField('javaExecutor');
    field.setAccessible(true);
    var executor = field.get(hs);
    try {
      ow.server.httpd.route(hs, { '/': function() { return ow.server.httpd.reply('ok', 200, 'text/plain', {}); } });
      eq($rest().get('http://127.0.0.1:' + hs.getPort() + '/'), 'ok', 'Java worker serves request');
    } finally { ow.server.httpd.stop(hs); }
    eq(executor.isShutdown(), true, 'Stopping Java listener shuts down its owned executor');
    eq(executor.awaitTermination(5000, java.util.concurrent.TimeUnit.MILLISECONDS), true, 'Java listener workers terminate');
    hs.stop();
    eq(executor.isShutdown(), true, 'Repeated stop is harmless');
  };
  exports.testDefaultStorageWithoutDescriptor = function() {
    fixture(function(ctx) {
      var options = clone(ctx.opts); delete options.tokenStore;
      var script = ctx.dir + '/default-store.js';
      var base = 'ow.loadServer(); var opts=' + stringify(options, __, '') + ';';
      var onURL = 'opts.onAuthorizationURL=function(url) { $rest().get(url); var p=ow.server.rest.parseQuery(String(new java.net.URI(url).getRawQuery())); $rest().get(opts.redirectURI+"?state="+p.state+"&code=default-code"); };';
      io.writeFileString(script, 'try {' + base + onURL + 'var c=ow.server.httpd.oauth2(opts); c.authenticate(); print(c.getAuthStatus().persistent); c.cancel(); exit(0); } catch(e) { printErr(String(e)); exit(1); }');
      var result = $sh().envs({ OAF_HOME: ctx.dir }, true).sh([ow.format.getJavaHome() + '/bin/java', '-jar', getOpenAFJar(), '-f', script]).get(0);
      eq(result.exitcode, 0, 'Default $sec authentication succeeds: ' + result.stderr);
      eq(result.stdout.indexOf('true') >= 0, true, 'Omitted tokenStore enables persistence');
      eq(io.fileExists(ctx.dir + '/.openaf-sec-oauth2.yml'), true, 'Default standalone repository');
      eq(io.fileExists(ctx.dir + '/.openaf-sec'), true, 'Default main key initialized');
      io.writeFileString(script, 'try {' + base + 'opts.interactive=false; ow.server.httpd.oauth2(opts).authenticate(); exit(0); } catch(e) { printErr(String(e)); exit(1); }');
      result = $sh().envs({ OAF_HOME: ctx.dir }, true).sh([ow.format.getJavaHome() + '/bin/java', '-jar', getOpenAFJar(), '-f', script]).get(0);
      eq(result.exitcode, 0, 'Restart uses default encrypted profile: ' + result.stderr);
      eq(ctx.state.requests.length, 1, 'Default storage avoids a second exchange');
      if (!ow.format.isWindows()) {
        ['.openaf-sec', '.openaf-sec-oauth2.yml'].forEach(function(name) {
          var permissions = java.nio.file.Files.getPosixFilePermissions(new java.io.File(ctx.dir + '/' + name).toPath());
          eq(String(java.nio.file.attribute.PosixFilePermissions.toString(permissions)), 'rw-------', 'Default secret files owner-only');
        });
      }
    });
  };
  exports.testConcurrentProcessRefresh = function() {
    fixture(function(ctx) {
      ctx.callback(); ctx.client().authenticate();
      var cfg = ctx.opts.tokenStore, sec = $sec('oauth2', __, cfg.lockSecret, cfg.mainSecret, cfg.file);
      try { var key = sec.list().default[0], record = sec.get(key); record.expiresAt = now() - 1000; sec.set(key, record); }
      finally { sec.close(); }
      ctx.opts.interactive = false; delete ctx.opts.onAuthorizationURL;
      var script = ctx.dir + '/child.js';
      io.writeFileString(script, 'try { ow.loadServer(); ow.server.httpd.oauth2(' + stringify(ctx.opts, __, '') + ').authenticate(); exit(0); } catch(e) { printErr(String(e)); exit(1); }');
      var results = parallel4Array([1, 2], function() { return $sh([ow.format.getJavaHome() + '/bin/java', '-jar', getOpenAFJar(), '-f', script]).get(0); });
      results.forEach(function(r) { eq(r.exitcode, 0, 'Standalone child refreshed: ' + r.stderr); });
      eq(ctx.state.requests.length, 2, 'Standalone processes share one refresh');
    });
  };
})();
