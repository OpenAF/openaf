

// Browse contract 1. Keep behavior aligned with oJob-common browse fixtures.
OpenWrap.server.prototype.httpd.browse.support = (function() {
  var exports = {}
exports.capabilities = { contract: 1, query: 1, previewFormats: 1, boundedPreview: 1, operations: 1, prefetch: 1 }
exports.error = function(status, message) { var e = new Error(message); e.httpStatus = status; throw e }
exports.check = function(options, capabilities) {
  options = options || {}
  var required = []
  if (options.query && options.query.enabled) required.push("query")
  if (options.preview && isMap(options.preview.formats)) required.push("previewFormats")
  if (options.preview && isDef(options.preview.maxBytes)) required.push("boundedPreview")
  if (options.operations && options.operations.enabled) required.push("operations")
  required.forEach(function(key) {
    if (!capabilities || capabilities[key] !== 1) throw new Error("Browse capability " + key + " requires an updated browse implementation")
  })
  var limits={pageSize:500,maxPageSize:500,maxScanned:1000000,maxResults:1000,maxQueryLength:4096,timeoutMs:60000}
  if(options.query)Object.keys(limits).forEach(function(key){var n=options.query[key];if(isDef(n)&&(!isNumber(n)||!isFinite(n)||n<1||Math.floor(n)!=n||n>limits[key]))exports.error(400,"Invalid query option "+key)})
  if(options.preview && isDef(options.preview.maxBytes)){var n=options.preview.maxBytes;if(!isNumber(n)||!isFinite(n)||n<1||Math.floor(n)!=n||n>16777216)exports.error(400,"Invalid preview.maxBytes")}
  if(options.preview && isMap(options.preview.formats))Object.keys(options.preview.formats).forEach(function(k){if(!/^(name:.+|[a-z0-9]+)$/.test(k)||!isString(options.preview.formats[k])||!/^[a-z][a-z0-9-]*$/.test(options.preview.formats[k]))exports.error(400,"Invalid preview format")})
}
// Compare browse values using SemVer precedence before the existing value fallback.
exports.compareValues = (function() {
  // Parse complete SemVer 2 values; retain the existing optional v display prefix.
  function parseSemVer(value, allowShort) {
    if (value === null || value === undefined) return null
    var text = String(value).trim()
    // In version or name columns, a bare major.minor label denotes patch zero.
    if (allowShort && /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(text)) text += ".0"
    var match = text.match(/^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/)
    if (!match) return null
    var prerelease = match[4] ? match[4].split('.') : []
    if (prerelease.some(id => /^\d+$/.test(id) && id.length > 1 && id[0] === '0')) return null
    return { major:match[1], minor:match[2], patch:match[3], prerelease:prerelease }
  }

  function isNumericIdentifier(value) {
    return /^\d+$/.test(value)
  }

  // Digit strings preserve precedence beyond Number's safe integer range.
  function compareSemVerNumber(a, b) {
    if (a.length !== b.length) return a.length < b.length ? -1 : 1
    return a === b ? 0 : (a < b ? -1 : 1)
  }

  function compareSemVer(a, b) {
    var keys = ['major', 'minor', 'patch']
    for (var part = 0; part < keys.length; part++) {
      var key = keys[part]
      var result = compareSemVerNumber(a[key], b[key])
      if (result) return result
    }
    if (!a.prerelease.length && !b.prerelease.length) return 0
    if (!a.prerelease.length) return 1
    if (!b.prerelease.length) return -1
    for (var i = 0; i < Math.max(a.prerelease.length, b.prerelease.length); i++) {
      var ai = a.prerelease[i], bi = b.prerelease[i]
      if (ai === undefined) return -1
      if (bi === undefined) return 1
      if (ai === bi) continue
      var an = isNumericIdentifier(ai), bn = isNumericIdentifier(bi)
      if (an && bn) return compareSemVerNumber(ai, bi)
      if (an !== bn) return an ? -1 : 1
      return ai < bi ? -1 : 1
    }
    return 0
  }
  return function(a, b, allowShort) {
    if (!allowShort && isNumber(a) && isNumber(b)) return a - b
    var av = parseSemVer(a, allowShort), bv = parseSemVer(b, allowShort)
    if (!!av != !!bv) return av ? -1 : 1
    if (av && bv) return compareSemVer(av, bv)
    if (allowShort && isNumber(a) && isNumber(b)) return a - b
    return String(a).localeCompare(String(b))
  }
})()

// Prepare a case-insensitive search once per request.
exports.searchMatcher = function(query, wildcards) {
  var pattern = String(query).toLowerCase()
  if (wildcards !== true || !/[*?]/.test(pattern)) {
    return value => String(value).toLowerCase().indexOf(pattern) >= 0
  }

  // Anchor the first and last chunks. Scan the middle chunks in order without regex backtracking.
  var chunks = pattern.split(/\*+/)
  var head = chunks.shift()
  var tail = chunks.length ? chunks.pop() : null
  var matchesAt = (text, chunk, offset) => {
    for (var i = 0; i < chunk.length; i++) {
      if (chunk[i] != "?" && chunk[i] != text[offset + i]) return false
    }
    return true
  }
  return value => {
    var text = String(value).toLowerCase()
    if (tail === null) return text.length == head.length && matchesAt(text, head, 0)
    var end = text.length - tail.length
    if (end < head.length || !matchesAt(text, head, 0) || !matchesAt(text, tail, end)) return false
    var offset = head.length
    for (var i = 0; i < chunks.length; i++) {
      var chunk = chunks[i]
      if (chunk.indexOf("?") < 0) {
        offset = text.indexOf(chunk, offset)
        if (offset < 0 || offset + chunk.length > end) return false
      } else {
        while (offset + chunk.length <= end && !matchesAt(text, chunk, offset)) offset++
        if (offset + chunk.length > end) return false
      }
      offset += chunk.length
    }
    return true
  }
}

exports.query = function(result, request, options) {
  if (!result.isList || !options.query || !options.query.enabled || result.queryInfo && result.queryInfo.applied) return result
  if (result.pageInfo && result.pageInfo.pageSize > 0) exports.error(501, "Provider must query before pagination")
  var p = request.params || {}, c = options.query
  var integer = function(value, fallback, max) {
    var n = Number(isDef(value) ? value : fallback)
    if (!isFinite(n) || n < 1 || Math.floor(n) != n || n > max) exports.error(400, "Invalid browse integer")
    return n
  }
  var size = integer(isDef(p.size) ? p.size : p.pageSize, c.pageSize || 100, c.maxPageSize || 500)
  var page = integer(p.page, 1, 9007199254740991), key = String(result.key)
  var field = p.sort || key, order = p.order || "asc"
  if (result.fields.indexOf(field) < 0 || ["asc", "desc"].indexOf(order) < 0) exports.error(400, "Invalid sort")
  var allowShort = /^(object|filename|version|tag)$/i.test(field)
  var rows = result.list.slice()
  rows.sort(function(a, b) {
    if (!!a.isDirectory != !!b.isDirectory) return a.isDirectory ? -1 : 1
    var av = a.sortValues && isDef(a.sortValues[field]) ? a.sortValues[field] : a.values[field]
    var bv = b.sortValues && isDef(b.sortValues[field]) ? b.sortValues[field] : b.values[field]
    if(field=="Size" && isNumber(a.values["Size in bytes"]) && isNumber(b.values["Size in bytes"])){av=a.values["Size in bytes"];bv=b.values["Size in bytes"]}
    var n = exports.compareValues(av, bv, allowShort)
    return n ? n * (order == "desc" ? -1 : 1) : (field == key ? 0 : String(a.values[key]).localeCompare(String(b.values[key])))
  })
  var total = rows.length, pages = Math.max(1, Math.ceil(total / size))
  page = Math.min(page, pages)
  return Object.assign({}, result, {defaultPresent:!p.q && rows.some(function(row){return row.values[key]==options.default}),list:rows.slice((page-1)*size,page*size),pageInfo:{page:page,pageSize:size,total:total,totalPages:pages,hasPrevious:page>1,hasNext:page<pages},sortInfo:{field:field,order:order},queryInfo:{applied:true}})
}
exports.format = function(name, preview, defaults) {
  var formats = isMap(preview.formats) ? preview.formats : defaults
  var ext = name.indexOf(".") < 0 ? "" : name.substring(name.lastIndexOf(".")+1).toLowerCase()
  var own = function(k) { return Object.prototype.hasOwnProperty.call(formats, k) }
  var type = own("name:"+name) ? formats["name:"+name] : (own(ext) ? formats[ext] : __)
  if (isDef(type) && (!isString(type) || !/^[a-z][a-z0-9-]*$/.test(type))) exports.error(400, "Invalid preview format")
  return type
}
// Draw font-independent arrows in the surrounding text or link color.
exports.arrow = (() => {
  const paths = {
    left: "M20 12H4m6-6-6 6 6 6",
    right: "M4 12h16m-6-6 6 6-6 6",
    down: "M12 4v16m-6-6 6 6 6-6",
    parent: "M18 18 6 6m0 9V6h9",
    directory: "M6 6l12 12m0-9v9H9"
  }
  return (direction, muted) => '<svg class="browse-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" ' +
    'stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" ' +
    'aria-hidden="true" focusable="false" style="width:1em;height:1em;vertical-align:-.125em' +
    (muted ? ';opacity:.45' : '') + '"><path d="' + paths[direction] + '"/></svg>'
})()

// Keep the pager muted in either theme and label its icon-only links.
exports.pager = (page, totalPages, previous, next) => {
  const control = (url, direction, label) => {
    const arrow = exports.arrow(direction)
    return isDef(url) && String(url).length > 0
      ? '<a href="' + url + '" aria-label="' + label + '">' + arrow + '</a>'
      : '<span>' + arrow + '</span>'
  }
  const separator = '<span class="browse-page-divider" aria-hidden="true">|</span>'
  return '<style>.browse-pager{margin:.25em 0 .75em;padding-left:.5em}' +
    '.markdown-body-dark .browse-pager{--browse-pager-muted:.65;--browse-pager-link:.72}' +
    '.browse-pager > span,.browse-pager > a{color:inherit;opacity:var(--browse-pager-muted,.45)}' +
    '.browse-pager > a{opacity:var(--browse-pager-link,.55)}' +
    '.browse-pager > a:hover,.browse-pager > a:focus-visible{opacity:.8;text-decoration:none}' +
    '.browse-page-divider{padding:0 .6em}' +
    '.browse-page-count{font: .95em ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}</style>' +
    '<div class="browse-pager" role="navigation" aria-label="Pagination">' +
    control(previous, "left", "Previous page") + separator +
    '<span class="browse-page-count">' + page + ' / ' + totalPages + '</span>' + separator +
    control(next, "right", "Next page") + '</div>\n'
}

// Load JSON in the browser while keeping the server on the streaming path.
exports.previewBackArrow = '<button type="button" onclick="history.back()" aria-label="Back" title="Back" ' +
  'style="float:right;border:0;background:none;color:inherit;cursor:pointer;font:inherit;padding:0 0 0 1em">' + exports.arrow("left") + '</button>'

exports.previewDocument = (server, arrow) => ({
  getPort: () => server.getPort(),
  reply: (data, type, status, headers) => server.reply(data, type, status, headers),
  replyOKHTML: html => server.replyOKHTML(String(html).replace(/<body\b[^>]*>/i, body => body + arrow))
})

exports.jsonViewURL = function(request, view) {
  var params = request.params || {}
  var keys = params.action == "preview" ? ["action", "browseUri", "uri", "path", "asset"] : ["asset"]
  var query = keys.filter(key => isString(params[key])).map(key => key + "=" + encodeURIComponent(params[key]))
  query.push("view=" + view)
  return "?" + query.join("&amp;")
}

exports.jsonPreview = function(request, options, open, allowDownload) {
  var params = request.params || {}
  if (params.view == "json-data") return {
    stream: open(),
    streamType: "application/json; charset=utf-8",
    streamHeaders: {
      "Content-Disposition": "attachment",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store"
    }
  }

  var prefix = ow.server.httpd.getPrefix(options.serverOrPort || options.port)
  var path = String(request.uri).replace(/^\/+/, "").split("/").map(encodeURIComponent).join("/")
  var url = ow.format.escapeHTML(prefix + "/" + path)
  return { type: "raw", browseDetail: true, jsonViewer: true, data:
    '<link rel="stylesheet" href="' + prefix + '/css/nJSMap.css"><script src="' + prefix + '/js/openafsigil.js"></script>' +
    '<script src="' + prefix + '/js/njsmap.js"></script>' + "\n\n" +
    '<div id="browse-json-preview" data-path="' + url + '"><p role="status">Loading JSON…</p>' +
    '<p><a data-json-render href="' + exports.jsonViewURL(request, "json") + '">Render</a>' +
    ' · <a data-json-source href="' + exports.jsonViewURL(request, "source") + '">View source</a>' +
    (allowDownload === false ? '' : ' · <a href="?raw=true" download>Download raw</a>') +
    '</p><div class="browse-json-map" style="overflow:auto"></div></div>' + "\n\n" +
    `<script>(async function() {
      var viewer = document.getElementById("browse-json-preview")
      var current = new URL(location.href)
      var endpoint = current.searchParams.get("action") == "preview" ? new URL(current) :
        new URL(viewer.dataset.path + current.search, current)
      var source = new URL(endpoint)
      source.searchParams.set("view", "source")
      viewer.querySelector("[data-json-source]").href = source.href
      var renderURL = new URL(source)
      renderURL.searchParams.set("view", "json")
      viewer.querySelector("[data-json-render]").href = renderURL.href
      var download = viewer.querySelector("a[download]")
      if (download) {
        var raw = new URL(source)
        raw.searchParams.delete("view")
        raw.searchParams.set("raw", "true")
        download.href = raw.href
      }
      endpoint.searchParams.set("view", "json-data")
      var status = viewer.querySelector("[role=status]")
      var map = viewer.querySelector(".browse-json-map")
      var started = performance.now()
      var slowAfterMs = 8000
      var showSlowDownload = function(message) {
        status.textContent = message + " "
        status.appendChild(download.cloneNode(true))
      }
      var slowTimer = download && setTimeout(function() {
        showSlowDownload("Still loading the JSON preview.")
      }, slowAfterMs)
      var limit = 16 * 1024 * 1024
      var tooLarge = new Error("This JSON exceeds the 16 MiB interactive preview limit. Use View source.")
      try {
        var response = await fetch(endpoint, { credentials: "same-origin" })
        if (!response.ok || !response.body || !/^application\\/json\\b/i.test(response.headers.get("Content-Type") || ""))
          throw new Error("Could not load JSON.")
        var reader = response.body.getReader()
        var decoder = new TextDecoder("utf-8", { fatal: true })
        var chunks = [], size = 0
        try {
          while (true) {
            var chunk = await reader.read()
            if (chunk.done) break
            size += chunk.value.byteLength
            if (size > limit) throw tooLarge
            chunks.push(decoder.decode(chunk.value, { stream: true }))
          }
          chunks.push(decoder.decode())
        } finally {
          await reader.cancel().catch(function() {})
          reader.releaseLock()
        }
        var json = JSON.parse(chunks.join(""))
        chunks = null

        if (typeof nJSMap == "undefined" || typeof nJSMap.mount != "function") {
          status.textContent = "The interactive view requires a newer OpenAF. Use View source."
          return
        }
        var theme = function() {
          map.classList.toggle("njsmap_dark", document.body.classList.contains("markdown-body-dark"))
        }
        theme()
        nJSMap.mount(map, json, { collapseAll: size >= 1024 * 1024 })
        new MutationObserver(theme).observe(document.body, { attributeFilter: ["class"] })
        if (download && performance.now() - started >= slowAfterMs) {
          showSlowDownload("The JSON preview was slow to load.")
        } else {
          status.hidden = true
        }
      } catch (error) {
        status.textContent = error === tooLarge || error.message === "Could not load JSON." ?
          error.message : "Could not display this JSON. Use View source."
      } finally {
        if (slowTimer) clearTimeout(slowTimer)
      }
    })()</script>`
  }
}

exports.readPreview = function(stream, type, limit) {
  var output = new java.io.ByteArrayOutputStream(), count = 0, n
  try {
    if (isUnDef(limit)) limit = 4 * 1024 * 1024
    if (!isNumber(limit) || !isFinite(limit) || limit < 1 || limit > 16777216 || Math.floor(limit) != limit) exports.error(400, "Invalid preview byte limit")
    var max = limit + 1
    var buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 8192)
    while (count < max && (n = stream.read(buffer, 0, Math.min(buffer.length, max-count))) != -1) {
      if (n > 0) { output.write(buffer,0,n); count += n }
    }
  } finally { stream.close() }
  var bytes = output.toByteArray(), truncated = bytes.length > limit
  if (truncated) bytes = java.util.Arrays.copyOf(bytes, limit)
  var decoder = java.nio.charset.StandardCharsets.UTF_8.newDecoder().onMalformedInput(java.nio.charset.CodingErrorAction.IGNORE)
  var data = String(decoder.decode(java.nio.ByteBuffer.wrap(bytes)))
  if (truncated) return {data:data+"\n\n[Preview truncated; download the complete file.]",type:"text",truncated:true}
  if (type == "json") return {data:jsonParse(data),type:"json"}
  if (type == "asciidoc") return {stream:new java.io.ByteArrayInputStream(bytes),type:"asciidoc"}
  return {data:data,type:type == "markdown" ? "md" : type}
}
exports.defaults = {md:"markdown",yml:"yaml",yaml:"yaml",css:"css",sh:"sh",js:"js",java:"java",py:"python",toml:"toml",hbs:"handlebars",json:"json",adoc:"asciidoc"}
// Only recognized image formats may set an inline image MIME type.
var imageTypes = {
  png: "image/png", apng: "image/apng", jpeg: "image/jpeg", gif: "image/gif",
  webp: "image/webp", avif: "image/avif", bmp: "image/bmp", ico: "image/x-icon", svg: "image/svg+xml"
}
exports.imageType = type => Object.prototype.hasOwnProperty.call(imageTypes, type) ? imageTypes[type] : __
exports.imagePreview = (stream, mime) => ({
  stream: stream, streamType: mime, streamHeaders: {
    "Content-Disposition": "inline",
    "Content-Security-Policy": "sandbox; default-src 'none'; style-src 'unsafe-inline'",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer"
  }
})
Object.keys(imageTypes).forEach(type => { exports.defaults[type] = type })
exports.defaults.jpg = exports.defaults.jpe = "jpeg"
exports.matchesUnit = function(path,key,base) {
  path=String(path).replace(/\/+$/,"")
  var location
  if(isDef(key.domain))location=[key.domain,key.repository,key.format,key.namespace,key.package,key.version].filter(function(x){return isDef(x)&&x!==""}).join("/")
  else location=isDef(key.puri)?String(key.puri):String(key.image || key.uri || "")
  base=String(base || "").replace(/^\/+/,"")
  if(base && location.startsWith(base))location=location.substring(base.length).replace(/^\/+/,"")
  location=location.replace(/\/+$/,"")
  return !path || !location || path==location || path.startsWith(location+"/") || location.startsWith(path+"/")
}
exports.provider = function(options) {
  var units=Object.create(null), namespace="browse-"+genUUID(), active=$atomic(0)
  var stats={hits:0,misses:0,loads:0,errors:0}, stores=Object.create(null)
  var enhanced=options.query && options.query.enabled || options.operations && options.operations.enabled || options.preview || options.prefetch === true
  return {
    cache:function(name) {
      if(stores[name])return stores[name]
      var ttl=5000, loader, cache=$cache(namespace+"-"+name), lock=namespace+"-"+name
      var facade={
        ttl:function(value){ttl=isNumber(value)?value:5000;cache.ttl(ttl);return facade},
        fn:function(fn){loader=fn;cache.fn(fn);return facade},
        byDefault:function(a,b){if(!enhanced)cache.byDefault(a,b);return facade},
        create:function(){cache.create();return facade},
        get:function(key){
          if(!enhanced)return cache.get(key)
          var id=name+":"+stringify(key,__,"")
          return syncFn(function(){
            if(units[id] && now()<units[id].expiresAt){stats.hits++;return units[id].value}
            stats.misses++
            if(active.inc()>4){active.dec();exports.error(503,"Provider busy")}
            try{
              var value=loader(key), t=now();stats.loads++
              if(!isObject(value))value={result:value}
              if(Object.keys(units).length>=1000){var keys=Object.keys(units).sort(function(a,b){return units[a].loadedAt-units[b].loadedAt});delete units[keys[0]]}
              units[id]={key:key,name:name,value:value,loadedAt:t,expiresAt:t+ttl}
              return value
            }catch(e){stats.errors++;throw e}finally{active.dec()}
          },lock)
        }
      }
      stores[name]=facade
      return facade
    },
    invalidate:function(predicate){Object.keys(units).forEach(function(id){if(predicate(units[id].name,units[id].key))delete units[id]})},
    entries:function(name){return Object.keys(units).map(function(id){return units[id]}).filter(function(unit){return unit.name==name})},
    status:function(){return {cache: Object.assign({},stats),units:Object.keys(units).length}},
    freshness:function(predicate){var rows=Object.keys(units).map(function(id){return units[id]}).filter(function(u){return !predicate || predicate(u.name,u.key)});var loaded=rows.length?Math.min.apply(null,rows.map(function(u){return u.loadedAt})):null,expires=rows.length?Math.min.apply(null,rows.map(function(u){return u.expiresAt})):null;return {loadedAt:loaded,lastUpdatedAt:rows.length?Math.max.apply(null,rows.map(function(u){return u.loadedAt})):null,expiresAt:expires,stale:expires==null || now()>=expires,refreshing:false,generation:stats.loads}}
  }
}
exports.installOperations = function(options, validate) {
  if (!options.operations || !options.operations.enabled) return
  var records = Object.create(null), lock = "browse-operations-" + genUUID(), active = $atomic(0)
  var metrics = {requests:0,errors:0,durationMs:0,refreshes:0,searches:0,previewTruncations:0}
  var csrf = genUUID(), hooks = options._fns, ttl = options.operations.ttlMs || 30000
  var record = function(path) {
    var t = now()
    Object.keys(records).forEach(function(k) { if (t-records[k].touched > 1800000 && !records[k].refreshing) delete records[k] })
    if (!records[path]) {
      var keys = Object.keys(records)
      if (keys.length >= 1000) {
        keys.sort(function(a,b){return records[a].touched-records[b].touched})
        var victim = keys.filter(function(k){return !records[k].refreshing})[0]
        if (isUnDef(victim)) exports.error(503,"Browse busy")
        delete records[victim]
      }
      records[path] = {loadedAt:null,expiresAt:null,generation:0,refreshing:false,lastRefresh:0}
    }
    records[path].touched = t
    return records[path]
  }
  var snapshot = function(path) { var r=record(path); return {loadedAt:r.loadedAt,expiresAt:r.expiresAt,stale:r.expiresAt == null || now()>=r.expiresAt,refreshing:r.refreshing,generation:r.generation,lastError:r.lastError || null} }
  var originalFreshness = hooks.getFreshness, originalStatus = hooks.getStatus, originalRefresh = hooks.refresh
  ;["getList","getObj","search"].forEach(function(name) {
    if (!isFunction(hooks[name])) return
    var original = hooks[name]
    hooks[name] = function(request, opts) {
      var began=now(), result
      try {
        result=original(request,opts)
        if(!isFunction(originalFreshness))syncFn(function(){var r=record(request.uri);r.loadedAt=now();r.expiresAt=now()+ttl},lock)
        syncFn(function(){metrics.requests++;if(name=="search")metrics.searches++;if(result && result.truncated)metrics.previewTruncations++},lock)
        return result
      } catch(e) { syncFn(function(){metrics.errors++},lock); throw e }
      finally { syncFn(function(){metrics.durationMs+=now()-began},lock) }
    }
  })
  hooks.getFreshness = function(request,opts) {
    validate(request,opts)
    if (isFunction(originalFreshness)) return originalFreshness(request,opts)
    return syncFn(function(){return snapshot(request.uri)},lock)
  }
  hooks.getStatus = function(request,opts) {
    validate(request,opts)
    return {capabilities:opts.capabilities,metrics:Object.assign({},metrics),provider:isFunction(originalStatus)?originalStatus(request,opts):{},trackedLocations:Object.keys(records).length}
  }
  hooks.refresh = function(request,opts) {
    validate(request,opts)
    if (request.method != "POST") exports.error(405,"Refresh requires POST")
    var path=request.uri, owner=false, retry
    syncFn(function(){var r=record(path);retry=Math.max(0,10000-(now()-r.lastRefresh));if(!r.refreshing && !retry){r.refreshing=true;r.lastRefresh=now();owner=true}},lock)
    if (!owner) return {refreshed:false,retryIn:Math.ceil(retry/1000),refreshing:snapshot(path).refreshing}
    if(active.inc()>4){active.dec();syncFn(function(){record(path).refreshing=false},lock);exports.error(503,"Browse busy")}
    try {
      if(isFunction(originalRefresh)) originalRefresh(request,opts)
      else {var r=hooks.getList(request,opts);if(r.isFile){var obj=hooks.getObj(request,opts);if(obj.stream)obj.stream.close()}}
      syncFn(function(){var r=record(path);r.loadedAt=now();r.expiresAt=now()+ttl;r.generation++;r.lastError=null;metrics.refreshes++},lock)
      return {refreshed:true,freshness:snapshot(path)}
    } catch(e){syncFn(function(){record(path).lastError="Refresh failed"},lock);throw e}
    finally{active.dec();syncFn(function(){record(path).refreshing=false},lock)}
  }
  options._operation = function(action, request, server, api, tokenHash) {
    if (action == "refresh") {
      if (request.method != "POST") exports.error(405, "Refresh requires POST")
      var token = api ? (request.header || {})["x-openaf-browse-token"] : (request.params || {}).csrf
      var expected = api ? tokenHash : sha256(csrf)
      var bytes = value => new java.lang.String(value).getBytes("UTF-8")
      if (!isString(token) || !isString(expected) ||
          !java.security.MessageDigest.isEqual(bytes(sha256(token)), bytes(expected))) exports.error(403, "Invalid refresh token")
    }
    if(action=="status")return ow.server.httpd.reply(hooks.getStatus(request,options))
    if(action=="freshness")return ow.server.httpd.reply(hooks.getFreshness(request,options))
    if(action=="refresh")return ow.server.httpd.reply(hooks.refresh(request,options))
    if(action=="metrics"){
      validate(request,options);ow.loadMetrics()
      if(!isFunction(ow.metrics._fromObj2OpenMetricsStrict))exports.error(501,"Strict OpenMetrics requires an updated OpenAF runtime")
      return {data:ow.metrics.fromObj2OpenMetrics(metrics,"browse",__,__,__,true),status:200,mimetype:"application/openmetrics-text; version=1.0.0; charset=utf-8",header:{}}
    }
    exports.error(404,"Unknown browse operation")
  }
  options._refreshToken = csrf
  ow.loadMetrics()
  ow.metrics.add("browse_"+sha256(String(options.port)+options.parentURI).substring(0,16),function(){return Object.assign({},metrics)})
}

  return exports
})()
;(function(browse) {
  var support=browse.support, legacyFiles=browse.files
  support.relative=function(uri,base){base=String(base).replace(/\/+$/,"");uri=String(uri);if(uri==base)return "";if(!uri.startsWith(base+"/"))support.error(403,"Invalid route");return uri.substring(base.length+1)}
  support.resolve=function(root,path){if(/[\\\x00]/.test(path)||/^(\/|[a-z]:)/i.test(path))support.error(403,"Invalid path");var base=new java.io.File(String(root)).getCanonicalFile().toPath(),target=base.resolve(String(path)).toFile().getCanonicalFile().toPath();if(!target.startsWith(base))support.error(403,"Outside browse root");return String(target)}
  support.fileLink=function(value){return encodeURIComponent(String(value)).replace(/[!'()*]/g,function(c){return "%"+c.charCodeAt(0).toString(16).toUpperCase()})}
  support.escapeText=function(value){return String(value).split("").map(function(c){return /[a-z0-9 .:/-]/i.test(c)?c:"&#"+c.charCodeAt(0)+";"}).join("")}
  var escapeText=support.escapeText
  browse.capabilities=Object.assign({},support.capabilities)
  browse.files=function(uri,config){
    support.check(config,support.capabilities)
    var options=legacyFiles(uri,config),custom=config && config._fns || {}
    options.capabilities=Object.assign({},support.capabilities)
    var fns=options._fns
    var validate=function(request,opts){return support.resolve(opts.parentPath,support.relative(request.uri,opts.parentURI))}
    // Keep one short-lived root snapshot per browser.
    var rootListing, rootLock = new java.lang.Object()
    var listRoot = (file, refresh) => syncFn(() => {
      if (!rootListing || rootListing.path != file || refresh || now() >= rootListing.expiresAt) {
        var rows = io.listFiles(file).files, loadedAt = now()
        rootListing = { path: file, rows: rows, loadedAt: loadedAt, expiresAt: loadedAt + 5000 }
      }
      return rootListing.rows
    }, rootLock)

    if (!isFunction(custom.getList) && !isFunction(custom.getFreshness)) fns.getFreshness = (request, options) => {
      var relative = support.relative(request.uri, options.parentURI)
      return syncFn(() => /^\/*$/.test(relative) && rootListing ? {
        loadedAt: rootListing.loadedAt,
        expiresAt: rootListing.expiresAt,
        stale: now() >= rootListing.expiresAt,
        refreshing: false
      } : { loadedAt: null, expiresAt: null, stale: true, refreshing: false }, rootLock)
    }

    if(!isFunction(custom.getList))fns.getList=function(request,opts){
      var file=validate(request,opts)
      if(!io.fileExists(file))return {isFile:false}
      var info=io.fileInfo(file)
      if(info.isFile)return {isFile:true}
      var relative=support.relative(request.uri,opts.parentURI).replace(/\/$/,"")
      var entries = relative == "" ? listRoot(file, request.method == "POST") : io.listFiles(file).files
      var rows=entries.filter(function(row){try{support.resolve(opts.parentPath,(relative?relative+"/":"")+row.filename);return true}catch(e){return false}}).map(function(row){return {isDirectory:row.isDirectory,values:{Filename:row.filename,"Last modified":ow.format.fromDate(new Date(row.lastModified),"yyyy-MM-dd HH:mm:ss"),Size:row.isDirectory?"":ow.format.toBytesAbbreviation(row.size),"Size in bytes":row.isDirectory?"":row.size}}})
      return support.query({isList:true,fields:["Filename","Last modified","Size","Size in bytes"],alignFields:["left","center","right","right"],key:"Filename",list:rows},request,opts)
    }
    if(!isFunction(custom.getObj))fns.getObj=function(request,opts){
      var file=validate(request,opts), name=String(new java.io.File(file).getName())
      if((request.params||{}).raw=="true")return {stream:io.readFileStream(file)}
      var preview=opts._api ? {} : opts.preview || {},type=support.format(name,preview,support.defaults)
      var imageType = support.imageType(type)
      if (imageType && !opts._api) return support.imagePreview(io.readFileStream(file), imageType)
      if (!type || imageType) return {file:file}
      if(type=="markdown" && opts.useMDRaw)type="raw"
      if (opts._api) {
        if (type == "json") return { data: io.readFileJSON(file), type: "json" }
        if (type == "asciidoc") return { file: file, type: type }
        return { data: io.readFileString(file), type: type == "markdown" ? "md" : type }
      }
      var params = request.params || {}
      if (type == "html") return { stream: io.readFileStream(file), streamType: "text/html", streamHeaders: {} }
      if (type == "json" && (params.view == "json" || params.view == "json-data" ||
          (params.parse != "false" && params.view != "source"))) {
        return support.jsonPreview(request, opts, () => io.readFileStream(file))
      }
      if (type == "json") {
        var source = support.readPreview(io.readFileStream(file), "text", preview.maxBytes)
        source.sourceOnly = true
        if (!source.truncated) source.type = "json"
        return source
      }
      var result=support.readPreview(io.readFileStream(file),type,preview.maxBytes)
      if(result.type=="md" && opts.useMDTemplate)result.data=$t(String(result.data),{request:request})
      return result
    }
    if(!isFunction(custom.renderList))fns.renderList=(lst, server, request, options) => {
      if (isDef(options.browse) && !options.browse) return ""
      const uri = request.uri
      const uriPrefix = ow.server.httpd.getPrefix(options.serverOrPort || options.port)
      const prefixURL = aURL => {
        aURL = _$(aURL).default("")
        if (aURL == "") return aURL
        aURL = String(aURL)
        if ((/^[a-z]+:/i).test(aURL) || aURL.startsWith("//")) return aURL
        if (!aURL.startsWith("/")) return aURL
        return (uriPrefix + "/" + aURL.replace(/^\/+/, "")).replace(/\/+/g, "/")
      }

      var puri = support.relative(uri, options.parentURI).replace(/\/$/, "")
      const relDir = aDepth => (aDepth <= 0 ? "./" : "../".repeat(aDepth))
      const fileLink = value => lst.searchInfo ? String(value).split("/").map(support.fileLink).join("/") : support.fileLink(value)
      if (!uri.endsWith("/")) {
        var _qs = isMap(request.params) ? request.params["NanoHttpd.QUERY_STRING"] : __
        var q = (isString(_qs) && _qs.length > 0) ? "?" + _qs : ""
        return ow.server.httpd.replyRedirect(server, uri + "/" + q, {})
      }
      var _page = 1
      var _pageSize = 0
      if (isDef(lst.pageInfo)) {
        if (isDef(lst.pageInfo.page)) _page = Number(lst.pageInfo.page)
        if (isDef(lst.pageInfo.pageSize)) _pageSize = Number(lst.pageInfo.pageSize)
      } else {
        if (isDef(request.params.page)) _page = Number(request.params.page)
        //if (isDef(request.params.pageSize)) _pageSize = Number(request.params.pageSize)
      }
      if (!isNumber(_page) || _page <= 0) _page = 1
      if (!isNumber(_pageSize) || _pageSize < 0) _pageSize = 0

      if (isDef(options.default) && (lst.defaultPresent || !(request.params || {}).q && lst.list.filter(r => r.values[lst.key] == options.default).length == 1)) {
        request.uri = request.uri.replace(/\/+$/, "") + "/" + options.default
        return options._fns.renderObj(options._fns.getObj(request, options), server, request, options)
      }

      const breadcrumb = p => {
        // relative links resolve against the current URL's directory: the directory itself
        // when the URL ends with "/", otherwise the file's parent — so a file URL is one level up
        var parts = (p == "" ? [] : p.split("/"))
        var depth = uri.endsWith("/") ? parts.length : parts.length - 1
        if (depth < 0) depth = 0
        var b = "[/](</>) [" + (options.showURI ? escapeText(options.parentURI.replace(/^\//, "")) : "") + "](<" + relDir(depth) + ">)"
        for (var i = 0; i < parts.length; i++) {
          if (i == parts.length - 1) {
            b += (!options.showURI && i == 0 ? "" : " / ") + escapeText(parts[i]) + " "
          } else {
            b += " [" + (!options.showURI && i == 0 ? "" : " / ") + " " + escapeText(parts[i]) + "](<" + relDir(depth - i - 1) + ">)"
          }
        }
        return b
      }

      const logo = prefixURL(_$(options.logo, "logo").isString().default("/fonts/openaf_small.png"))
      var content = "## " + breadcrumb( puri ) + "<img style=\"padding-left: 1em;\" align=\"right\" src=\"" + logo + "\">\n\n"
      // Keep small controls consistent with the listing in either theme.
      var icon = name => {
        var paths = {
          refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 7a7 7 0 0 1 11-2l3 3M4 16l3 3a7 7 0 0 0 11-2"/>',
          status: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
          clear: '<circle cx="12" cy="12" r="8"/><path d="m9 9 6 6M9 15l6-6"/>',
          close: '<path d="m6 6 12 12M6 18 18 6"/>'
        }
        return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + paths[name] + '</svg>'
      }
      var hasQuery = options.query && options.query.enabled
      var hasSearch = hasQuery && !!(request.params || {}).q
      var freshness, cacheTime, cacheAge
      if ((hasQuery || options._operation) && options._fns && isFunction(options._fns.getFreshness)) {
        try { freshness = options._fns.getFreshness(request, options) } catch (e) {}
        if (freshness) {
          var updated = freshness.lastUpdatedAt || freshness.loadedAt
          if (isNumber(updated) && isFinite(updated) && updated > 0) {
            cacheTime = new Date(updated).toISOString()
            var age = Math.max(0, now() - updated)
            cacheAge = age < 1000 ? 'just now' : ow.format.elapsedTime4ms(age).split(', ', 1)[0] + ' ago'
          }
        }
      }
      var fragment = hasQuery && request.method == "GET" && (request.header || {})["x-openaf-browse-fragment"] === "1"
      var searchInfo = hasSearch && lst.searchInfo
      var searchPending = searchInfo && searchInfo.refreshing === true
      var searchNotice = searchInfo && (searchInfo.message || (searchPending ? 'Loading more cached data…' :
        searchInfo.truncated ? 'Search results are limited.' :
        searchInfo.complete === false && searchInfo.coverage == 'loaded package hierarchies' ? 'Searched loaded package trees.' :
        searchInfo.complete === false ? 'Search results are partial.' : !lst.list.length ? 'No matches.' : ''))
      var cacheMarkup = cacheTime ? 'Cache updated <time datetime="' + cacheTime + '">' + escapeText(cacheAge) + '</time>' : ''
      var pageSize = _pageSize || (options.query || {}).pageSize || 100
      if (!fragment && (hasQuery || options._operation)) {
        content += '<style>' + [
          '.markdown-body{--browse-fg:#747d86;--browse-hover:#414951;--browse-border:#c6cbd1;--browse-bg:#fff;--browse-soft:#f6f8fa;--browse-dark:0}',
          '.markdown-body-dark{--browse-fg:#919ba6;--browse-hover:#d0d7de;--browse-border:#444c56;--browse-bg:#0d1117;--browse-soft:#161b22;--browse-dark:1;color-scheme:dark}',
          '.browse-actions{display:flex;align-items:center;gap:0.5em;margin:0.75em 0 0;padding:0.6em 0 0;border-top:1px solid var(--browse-border);color:var(--browse-fg)}.browse-actions form{display:inline-flex;margin:0}.browse-actions .browse-icon{width:auto;gap:0.4em;padding:4px 6px;font-size:0.9em}',
          '.browse-options{position:fixed;inset:auto;margin:0;box-sizing:border-box;width:19em;min-width:min(19em,calc(100vw - 16px));max-width:calc(100vw - 16px);resize:horizontal;overflow:auto;padding:0.85em;border:1px solid var(--browse-border);border-radius:6px;background:var(--browse-bg);color:var(--browse-fg);box-shadow:0 4px 16px #0002;font-size:0.9em}',
          '.browse-controls{display:grid;gap:0.75em;margin:0;font-family:-apple-system,Calibri,"DejaVu Sans",sans-serif}.browse-controls label{display:flex;align-items:center;gap:0.5em;min-width:0}',
          '.browse-cache-age,.browse-search-notice{font-size:0.85em;color:var(--browse-hover)}.browse-cache-age{margin-top:0.65em}.browse-cache-age:empty,.browse-search-notice:has(>span:only-child:empty){display:none}.browse-search-notice{margin:0 0 0.5em}.browse-search-notice[data-pending=true]::before{content:"";display:inline-block;width:0.7em;height:0.7em;margin-right:0.45em;border:1px solid currentColor;border-right-color:transparent;border-radius:50%;animation:browse-spin 0.8s linear infinite}@keyframes browse-spin{to{transform:rotate(1turn)}}@media(prefers-reduced-motion:reduce){.browse-search-notice[data-pending=true]::before{animation:none}}',
          '.browse-live-status{font-size:0.85em}.browse-live-status:empty{display:none}.browse-controls .browse-search{display:grid;gap:0.35em}.browse-options-row{display:flex;align-items:center;justify-content:space-between;gap:1em}',
          '.browse-controls input{box-sizing:border-box;min-width:0;max-width:100%;padding:0.2em 0.25em;border:0;border-bottom:1px solid var(--browse-border);border-radius:0;background:transparent;color:var(--browse-hover);font:inherit}',
          '.browse-controls input[name=q]{width:100%}.browse-controls input[name=size]{width:4.5em}.browse-search-row{display:flex;align-items:center;gap:0.6em}.browse-search-row input{flex:1}.browse-search-row button{flex:none}.browse-search-row input::-webkit-search-cancel-button{-webkit-appearance:none;appearance:none}',
          '.browse-apply{padding:0.25em 0.4em;border:0;border-radius:4px;background:transparent;color:var(--browse-hover);font:inherit;cursor:pointer}.browse-apply:hover{background:var(--browse-soft)}',
          '.browse-icon{position:relative;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;width:26px;height:26px;padding:4px;border:0;border-radius:4px;background:transparent;color:var(--browse-fg,#747d86);font:inherit;vertical-align:middle;cursor:pointer;text-decoration:none}',
          '.browse-icon svg{display:block;flex:none}.browse-icon:hover,.browse-icon[aria-expanded=true]{color:var(--browse-hover);background:var(--browse-soft)}.browse-icon:disabled{opacity:0.45;cursor:wait}',
          '#browse-clear-search:disabled{cursor:default;opacity:0.3}',
          '#browse-options-toggle{width:24px;height:24px;font-size:18px;line-height:1}.browse-filtered::after{content:"";position:absolute;right:3px;top:3px;width:4px;height:4px;border-radius:50%;background:currentColor}',
          '.browse-icon:focus-visible,.browse-controls input:focus-visible,.browse-apply:focus-visible,.browse-status:focus-visible{outline:2px solid var(--browse-fg);outline-offset:2px}',
          '.browse-status{box-sizing:border-box;width:max-content;min-width:18em;max-width:min(48em,calc(100vw - 2em));max-height:80vh;padding:1em;border:1px solid var(--browse-border);border-radius:6px;background:var(--browse-bg);color:var(--browse-hover);box-shadow:0 8px 30px #0003}',
          '.browse-status::backdrop{background:#0005}.browse-status-heading{display:flex;align-items:center;justify-content:space-between;gap:1em;margin-bottom:0.75em;font-weight:600}.browse-status-content{overflow:auto;max-height:65vh;font-size:0.9em}',
          '.browse-search-help,.browse-shortcut-setting{font-size:0.8em}.browse-shortcut-setting{display:flex;align-items:center;gap:0.4em;margin-top:0.75em}.browse-shortcut-setting input{margin:0}.browse-search-help{line-height:1.5}',
          '.browse-status-content table{margin:0}.browse-status-content td{white-space:normal;overflow-wrap:anywhere}'
        ].join('') + '</style>\n\n'
      }
      if (!fragment && (hasQuery || options._operation)) {
        content += '<div id="browse-options" class="browse-options" popover="auto" role="dialog" aria-label="Table options">'
        if (hasQuery) {
          var sortInputs = '<input type="hidden" name="sort" value="' + escapeText(lst.sortInfo ? lst.sortInfo.field : String(lst.key)) + '"><input type="hidden" name="order" value="' + (lst.sortInfo && lst.sortInfo.order == 'desc' ? 'desc' : 'asc') + '">'
          content += '<form id="browse-search-form" class="browse-controls" method="get"><div class="browse-search"><label for="browse-search-input">Search</label><div class="browse-search-row"><input id="browse-search-input" type="search" name="q" aria-describedby="browse-search-help" autofocus value="' + escapeText((request.params||{}).q || '') + '"><button id="browse-clear-search" class="browse-icon" type="button" title="Clear search" aria-label="Clear search"' + (hasSearch ? '' : ' disabled') + '>' + icon('clear') + '</button></div></div>' + sortInputs
          content += '<div class="browse-options-row"><label>Per page <input type="number" name="size" min="1" max="' + (options.query.maxPageSize || 500) + '" value="' + pageSize + '"></label><button class="browse-apply" type="submit">Apply</button></div><span class="browse-live-status" role="status"></span><span id="browse-search-help" class="browse-search-help">Enter: apply &middot; Shift+Enter: clear</span></form>'
          content += '<label class="browse-shortcut-setting"><input id="browse-shortcut-enabled" type="checkbox" checked> Enable / shortcut to search</label>'
        }
        content += '<div id="browse-cache-age" class="browse-cache-age">' + cacheMarkup + '</div>'
        if (options._operation) {
          var operationsURL = prefixURL(options.parentURI.replace(/\/$/, "") + '/@@/')
          content += '<div class="browse-actions"><form id="browse-refresh" method="post" action="' + operationsURL + 'refresh"><input type="hidden" name="path" value="' + escapeText(puri) + '"><input type="hidden" name="csrf" value="' + options._refreshToken + '"><button class="browse-icon" type="submit" title="Refresh now" aria-label="Refresh now">' + icon('refresh') + '<span>Refresh</span></button></form>'
          content += '<button id="browse-status-toggle" class="browse-icon" type="button" title="Status" aria-label="Status" aria-haspopup="dialog" data-url="' + operationsURL + 'status?path=' + encodeURIComponent(puri) + '">' + icon('status') + '<span>Status</span></button></div>'
        }
        content += '</div>\n\n'
      }

      if (fragment) content = '<div id="browse-cache-age">' + cacheMarkup + '</div>\n\n'
      if (hasQuery) {
        content += '<div id="browse-search-notice" class="browse-search-notice" data-pending="' + !!searchPending + '"><span role="status">' + escapeText(searchNotice || '') + '</span>'
        if (searchInfo && searchInfo.canExpand) {
          content += ' <button type="submit" form="browse-search-form" name="searchAll" value="1">Search remaining repositories</button>'
        }
        content += '</div>\n\n'
      }
      // Pagination controls (if metadata is provided)
      content += '<div id="browse-pagination">\n'
      if (isDef(lst.pageInfo) && isDef(lst.pageInfo.pageSize) && lst.pageInfo.pageSize > 0) {
        var _totalPages = Math.max(1, Math.ceil(lst.pageInfo.total / lst.pageInfo.pageSize))
        if (_totalPages == 1 && _page <= 1) {
          // Don't render pagination for a single page.
        } else {
        var pageURL = page => {
          var params = request.params || {}
          var keys = Object.keys(params).filter(k => ["page", "searchAll", "NanoHttpd.QUERY_STRING"].indexOf(k) < 0 && !k.startsWith("NanoHttpd."))
          return "?" + keys.map(k => encodeURIComponent(k) + "=" + encodeURIComponent(params[k])).concat(["page=" + page]).join("&amp;")
        }
        var _prev = _page > 1 ? pageURL(_page - 1) : __
        var _next = (_page < _totalPages) ? pageURL(_page + 1) : __
        content += support.pager(_page, _totalPages, _prev, _next)
        }
      }

      content += '</div>\n\n'

      // Match sortTab's header controls while sorting the full result on the server.
      var headers = lst.fields
      var headerControls = []
      if (hasQuery || options._operation) {
        var optionsTitle = 'Table options' + (hasSearch ? ' (search: ' + (request.params || {}).q + ')' : '')
        headerControls[0] = '<button id="browse-options-toggle" class="browse-icon' + (hasSearch ? ' browse-filtered' : '') + '" type="button" title="' + escapeText(optionsTitle) + '" aria-label="' + escapeText(optionsTitle) + '" aria-haspopup="dialog" aria-controls="browse-options" aria-expanded="false" popovertarget="browse-options"><span aria-hidden="true">&#8943;</span></button>'
      }
      var serverSort = hasQuery || options.sortTab && lst.sortInfo
      if (serverSort) {
        if (!fragment) content += '<style>' + [
          '.sorter-container{float:right;font-size:10px;margin-left:4px}',
          '.sorter-container .sort-button{display:none;padding:0;margin:0 2px;border:none;background:transparent;cursor:pointer;text-decoration:none;transition:color 0.2s ease}',
          'th:hover .sorter-container .sort-button,th:focus-within .sorter-container .sort-button,.sorter-container .sort-button:focus,.sorter-container .sort-button.active{display:inline-block}',
          '.sorter-container:focus-within .sort-button{display:inline-block}',
          '.sorter-container .sort-button{color:var(--browse-fg,#747d86);opacity:0.7}',
          'th:hover .sorter-container .sort-button,th:focus-within .sorter-container .sort-button,.sorter-container .sort-button.active{color:var(--browse-hover,#414951);opacity:1}'
        ].join('') + '</style>\n'
        var sortURL = (field, order) => {
          var params = request.params || {}
          var keys = Object.keys(params).filter(k => ["page", "sort", "order", "searchAll"].indexOf(k) < 0 && !k.startsWith("NanoHttpd."))
          var query = keys.map(k => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]))
          if (order != "none") query = query.concat(["sort=" + encodeURIComponent(field), "order=" + order])
          return "?" + query.concat(["page=1"]).join("&amp;")
        }
        headers = lst.fields.map((field, index) => {
          var label = escapeText(field)
          if ((lst.sortFields || lst.fields).indexOf(field) < 0) return label
          var active = lst.sortInfo && lst.sortInfo.field == field
          var controls = '<span class="sorter-container" tabindex="0" aria-label="' + escapeText('Sort: ' + field) + '">'
          ;[ ["asc", "&#9650;", "Ascending"], ["desc", "&#9660;", "Descending"], ["none", "x", "Reset sorting"] ].forEach(control => {
            var selected = active && lst.sortInfo.order == control[0]
            controls += '<a class="sort-button' + (selected ? ' active' : '') + '" href="' + sortURL(field, control[0]) + '" title="' + control[2] + '" aria-label="' + escapeText(control[2] + ': ' + field) + '"' + (selected ? ' aria-current="true"' : '') + '>' + control[1] + '</a>'
          })
          headerControls[index + 1] = controls + '</span>'
          return label
        })
      }
      content += "|  |" + headers.join(" | ") + " |\n"
      if (lst.alignFields) {
          content += "|:--:"
          lst.alignFields.forEach((a, i) => {
              if (a == "left") {
                  content += "|:--"
              } else if (a == "right") {
                  content += "|--:"
              } else {
                  content += "|--"
              }
          })
          content += "|\n"

          if (puri != "/" && puri != "") {
            content += "| " + support.arrow("parent", true) + " | __[..](<../>)__ | | |\n"
          }

          var rows = lst.sortInfo || lst.queryInfo && lst.queryInfo.applied ? lst.list : $from(lst.list).sort("-isDirectory", "values." + lst.key).select()
          rows.forEach(r => {
              content += "|"
              if (r.imageDigest && /^sha256:[a-f0-9]{64}$/.test(r.imageDigest)) {
                  content += " |"
              } else if (r.isDirectory) {
                  content += " " + support.arrow("directory", true) + " |"
              } else {
                  content += " <a href=\"" + fileLink(r.values[lst.key]) + "?raw=true\" download=\"" + escapeText(r.values[lst.key]) + "\" aria-label=\"Download\">" + support.arrow("down") + "</a> |"
              }
              lst.fields.forEach((f, i) => {
                if (r.isDirectory) {
                    content += " " + (i == 0 ? "__[" + escapeText(r.values[f]) + "](<" + fileLink(r.values[lst.key]) + "/>)__" : escapeText(r.values[f])) + " |"
                } else {
                    content += " " + (i == 0 ? "[" + escapeText(r.values[f]) + "](<" + (/^sha256:[a-f0-9]{64}$/.test(r.imageDigest || "") ? "?image=" + encodeURIComponent(r.imageDigest) : fileLink(r.values[lst.key])) + ">)" : escapeText(r.values[f])) + " |"
                }
              })
              content += "\n"
          })
      }

      if (!fragment) {
      // Content
      if (isDef(lst.content)) {
          if (lst.hideContentOnSearch) {
            content += '\n<div id="browse-listing-extra">' + ow.template.parseMD2HTML(lst.content, false) + '</div>\n'
          } else content += "\n" + lst.content + "\n"
      }
 
      // Footer
      if (isDef(options.footer)) {
          content += "\n" + options.footer + "\n"
      }
      if (options._operation) {
        content += '\n<dialog id="browse-status" class="browse-status" aria-labelledby="browse-status-title"><div class="browse-status-heading"><span id="browse-status-title">Status</span><button id="browse-status-close" class="browse-icon" type="button" title="Close status" aria-label="Close status">' + icon('close') + '</button></div><div id="browse-status-content" class="browse-status-content" aria-live="polite"></div></dialog>\n\n'
        content += '<script src="' + prefixURL('/js/openafsigil.js') + '"></script><script src="' + prefixURL('/js/njsmap.js') + '"></script><link rel="stylesheet" href="' + prefixURL('/css/nJSMap.css') + '">\n'
      }
      if (hasQuery || options._operation) {
        content += `<script>
        document.addEventListener('DOMContentLoaded', function() {
          // Anchor the shared options popover without shifting the table.
          var optionsButton = document.getElementById('browse-options-toggle')
          var optionsPanel = document.getElementById('browse-options')
          var cancelLiveSearch = function() {}, monitorCache = function() {}
          if (optionsButton && optionsPanel) {
            var positionOptions = function() {
              if (!optionsPanel.matches(':popover-open')) return
              var rect = optionsButton.getBoundingClientRect()
              var width = optionsPanel.offsetWidth, height = optionsPanel.offsetHeight
              var left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))
              var top = rect.bottom + 5
              if (top + height > window.innerHeight - 8) top = Math.max(8, rect.top - height - 5)
              optionsPanel.style.left = left + 'px'
              optionsPanel.style.top = top + 'px'
            }
            optionsPanel.addEventListener('toggle', function(event) {
              var open = event.newState == 'open'
              optionsButton.setAttribute('aria-expanded', String(open))
              if (!open) { cancelLiveSearch(); monitorCache() }
              if (open) {
                positionOptions()
                var search = optionsPanel.querySelector('input[name=q]')
                if (search) { search.focus(); search.select() }
              }
            })
            optionsPanel.addEventListener('keydown', function(event) {
              if (event.key == 'Escape') {
                event.preventDefault()
                event.stopPropagation()
                cancelLiveSearch()
                optionsPanel.hidePopover()
                optionsButton.focus()
              }
            })
            new ResizeObserver(positionOptions).observe(optionsPanel)
            window.addEventListener('resize', positionOptions)
            document.addEventListener('scroll', positionOptions, true)
          }
          var cacheAgeNode = document.getElementById('browse-cache-age')
          var relativeTime = new Intl.RelativeTimeFormat('en', { numeric:'always' })
          var updateCacheAge = function() {
            if (!optionsPanel.matches(':popover-open')) return
            var time = cacheAgeNode.querySelector('time')
            if (!time) return
            var age = Math.max(0, (Date.now() - Date.parse(time.dateTime)) / 1000)
            var units = { year:31536000, month:2592000, day:86400, hour:3600, minute:60, second:1 }
            var unit = Object.keys(units).find(function(key) { return age >= units[key] })
            time.textContent = unit ? relativeTime.format(-Math.floor(age / units[unit]), unit) : 'just now'
          }
          optionsPanel.addEventListener('toggle', updateCacheAge)
          setInterval(updateCacheAge, 15000)
          // Preview only quick server searches; Apply remains available for slower providers.
          var searchForm = optionsPanel && optionsPanel.querySelector('form.browse-controls')
          if (searchForm) {
            var searchInput = searchForm.querySelector('input[name=q]')
            var clearSearch = document.getElementById('browse-clear-search')
            var shortcutSetting = document.getElementById('browse-shortcut-enabled')
            var shortcutEnabled = true
            try { shortcutEnabled = localStorage.getItem('openaf.browse.slashShortcut') != 'off' } catch (error) {}
            var updateShortcut = function() {
              shortcutSetting.checked = shortcutEnabled
              if (shortcutEnabled) optionsButton.setAttribute('aria-keyshortcuts', '/')
              else optionsButton.removeAttribute('aria-keyshortcuts')
            }
            updateShortcut()
            shortcutSetting.addEventListener('change', function() {
              shortcutEnabled = this.checked
              try { localStorage.setItem('openaf.browse.slashShortcut', shortcutEnabled ? 'on' : 'off') } catch (error) {}
              updateShortcut()
            })
            document.addEventListener('keydown', function(event) {
              if (!shortcutEnabled || event.defaultPrevented || event.isComposing || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.key != '/') return
              var target = event.target
              if (target instanceof Element && (target.isContentEditable || target.closest('input, textarea, select, [role="textbox"]'))) return
              if (document.querySelector('dialog[open]')) return
              event.preventDefault()
              if (!optionsPanel.matches(':popover-open')) optionsPanel.showPopover()
              positionOptions()
              searchInput.focus()
              searchInput.select()
            })
            var syncClearSearch = function() {
              clearSearch.disabled = !searchInput.value && !new URLSearchParams(window.location.search).get('q')
            }
            searchInput.addEventListener('input', syncClearSearch)
            syncClearSearch()
            var liveMessage = searchForm.querySelector('.browse-live-status')
            var searchNotice = document.getElementById('browse-search-notice')
            var searchTimer, cacheTimer, liveController, searchRevision = 0, liveAvailable = true
            cancelLiveSearch = function() {
              searchRevision++
              clearTimeout(searchTimer)
              clearTimeout(cacheTimer)
              if (liveController) liveController.abort()
              liveController = undefined
            }
            var showSearchMessage = function(message) {
              liveMessage.textContent = message
              positionOptions()
            }
            monitorCache = function() {
              clearTimeout(cacheTimer)
              if (searchNotice.dataset.pending == 'true' && !liveController && !document.hidden) {
                cacheTimer = setTimeout(function() { if (!document.hidden) previewSearch(searchRevision, true) }, 2000)
              }
            }
            var previewSearch = async function(revision, followCache) {
              liveController = new AbortController()
              var controller = liveController
              var began = performance.now()
              var deadline = setTimeout(function() { controller.abort() }, followCache ? 10000 : 350)
              if (!followCache && searchInput.value) showSearchMessage('Searching…')
              try {
                var url = new URL(window.location.href)
                if (!followCache) url.search = new URLSearchParams(new FormData(searchForm)).toString()
                url.searchParams.delete('searchAll')
                url.hash = ''
                var response = await fetch(url, { credentials:'same-origin', cache:'no-store', headers:{'X-OpenAF-Browse-Fragment':'1'}, signal:controller.signal })
                if (!response.ok) throw new Error('Search unavailable')
                var parsed = new DOMParser().parseFromString(await response.text(), 'text/html')
                if (revision != searchRevision) return
                if (!followCache && performance.now() - began > 350) throw new Error('Search is slow')
                var table = parsed.getElementById('browse-listing')
                var pager = parsed.getElementById('browse-pagination')
                var notice = parsed.getElementById('browse-search-notice')
                var cacheAge = parsed.getElementById('browse-cache-age')
                if (!table || !pager || !notice || !cacheAge) throw new Error('Search preview unavailable')
                searchNotice.dataset.pending = notice.dataset.pending
                if (searchNotice.innerHTML != notice.innerHTML) searchNotice.replaceChildren(...notice.childNodes)
                cacheAgeNode.replaceChildren(...cacheAge.childNodes)
                updateCacheAge()
                var restoreFocus = document.activeElement == optionsButton
                var currentTable = document.getElementById('browse-listing')
                var currentPager = document.getElementById('browse-pagination')
                // Ignore the transient expanded state when comparing a polled listing.
                table.querySelector('#browse-options-toggle')?.setAttribute('aria-expanded', String(optionsPanel.matches(':popover-open')))
                if (!followCache || !currentTable.isEqualNode(table)) currentTable.replaceWith(table)
                if (!currentPager.isEqualNode(pager)) currentPager.replaceWith(pager)
                optionsButton = document.getElementById('browse-options-toggle')
                optionsButton.setAttribute('aria-expanded', String(optionsPanel.matches(':popover-open')))
                updateShortcut()
                if (restoreFocus) optionsButton.focus({ preventScroll:true })
                var extra = document.getElementById('browse-listing-extra')
                if (extra) extra.hidden = !!url.searchParams.get('q')
                window.history.replaceState(null, '', url)
                syncClearSearch()
                if (!followCache || searchNotice.dataset.pending != 'true') showSearchMessage('Results updated')
              } catch (error) {
                if (revision != searchRevision) return
                if (followCache) {
                  searchNotice.dataset.pending = 'false'
                  searchNotice.querySelector('[role=status]').textContent = 'Could not check for newer results. Apply to search again.'
                  return
                }
                liveAvailable = false
                showSearchMessage('Press Apply to search')
              } finally {
                clearTimeout(deadline)
                if (liveController == controller) {
                  liveController = undefined
                  monitorCache()
                }
              }
            }
            var queueSearch = function(event) {
              cancelLiveSearch()
              if (event && event.isComposing) return
              if (!liveAvailable) { showSearchMessage('Press Apply to search'); monitorCache(); return }
              showSearchMessage('')
              var revision = searchRevision
              searchTimer = setTimeout(function() { previewSearch(revision) }, 180)
            }
            searchInput.addEventListener('input', queueSearch)
            searchInput.addEventListener('compositionstart', cancelLiveSearch)
            searchInput.addEventListener('compositionend', queueSearch)
            searchForm.querySelector('input[name=size]').addEventListener('input', function() { cancelLiveSearch(); monitorCache() })
            searchForm.addEventListener('submit', cancelLiveSearch)
            searchForm.addEventListener('submit', function() {
              if (searchInput.value) showSearchMessage('Searching…')
            })
            document.addEventListener('visibilitychange', monitorCache)
            monitorCache()
            var clearAndApply = function() {
              cancelLiveSearch()
              searchInput.value = ''
              searchForm.requestSubmit(searchForm.querySelector('.browse-apply'))
            }
            clearSearch.addEventListener('click', clearAndApply)
            searchInput.addEventListener('keydown', function(event) {
              if (event.key == 'Enter' && event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey && !event.isComposing && event.keyCode != 229) {
                event.preventDefault()
                event.stopPropagation()
                clearAndApply()
              }
            })
          }
          var dialog = document.getElementById('browse-status')
          if (!dialog) return
          var output = document.getElementById('browse-status-content')
          var statusData, pending
          // nJSMap expects HTML text; escape provider strings and keys before rendering.
          var escape = function(value) {
            return String(value).replace(/[&<>"']/g, function(c) {
              return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
            })
          }
          var safeMap = function(value) {
            if (typeof value == 'string') return escape(value)
            if (Array.isArray(value)) return value.map(safeMap)
            if (value && typeof value == 'object') return Object.fromEntries(Object.keys(value).map(function(key) { return [escape(key), safeMap(value[key])] }))
            return value
          }
          var renderStatus = function() {
            if (!dialog.open || statusData === undefined) return
            var dark = getComputedStyle(document.body).getPropertyValue('--browse-dark').trim() == '1'
            dialog.classList.toggle('njsmap_dark', dark)
            output.innerHTML = nJSMap(safeMap(statusData), undefined, dark)
          }
          document.getElementById('browse-status-close').addEventListener('click', function() { dialog.close() })
          dialog.addEventListener('click', function(event) {
            var rect = dialog.getBoundingClientRect()
            if (event.target == dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close()
          })
          dialog.addEventListener('close', function() {
            if (pending) pending.abort()
            statusData = undefined
            output.textContent = ''
            optionsButton.focus()
          })
          var theme = window.matchMedia('(prefers-color-scheme: dark)')
          theme.addEventListener('change', function() { requestAnimationFrame(renderStatus) })
          document.getElementById('browse-status-toggle').addEventListener('click', async function() {
            statusData = undefined
            output.textContent = 'Loading status…'
            if (optionsPanel.matches(':popover-open')) optionsPanel.hidePopover()
            dialog.showModal()
            pending = new AbortController()
            try {
              var response = await fetch(this.dataset.url, { credentials:'same-origin', signal:pending.signal })
              if (!response.ok) throw new Error('Unable to load status (HTTP ' + response.status + ').')
              statusData = await response.json()
              renderStatus()
            } catch (error) {
              if (error.name != 'AbortError') output.textContent = error.message
            }
          })
          document.getElementById('browse-refresh').addEventListener('submit', async function(event) {
            event.preventDefault()
            var button = this.querySelector('button')
            button.disabled = true
            if (optionsPanel.matches(':popover-open')) optionsPanel.hidePopover()
            try {
              var response = await fetch(this.action, { method:'POST', credentials:'same-origin', body:new URLSearchParams(new FormData(this)) })
              if (!response.ok) throw new Error('Unable to refresh (HTTP ' + response.status + ').')
              window.location.reload()
            } catch (error) {
              output.textContent = error.message
              dialog.showModal()
            } finally { button.disabled = false }
          })
        })
        </script>\n`
      }

      if (options.sortTab && !serverSort && !(lst.queryInfo && lst.queryInfo.applied)) {
          content += "<script src=\"" + prefixURL("/js/mdtablesort.js") + "\"></script>\n"
          if (options.sortTabAsc) {
              content += "<script>document.addEventListener('DOMContentLoaded', function() { var t = document.querySelector('table'); if (!t) return; var row = t.querySelector('thead tr') || t.querySelector('tr'); if (!row) return; var cell = row.querySelectorAll('th, td')[1]; if (!cell) return; if (typeof updateSortState === 'function') updateSortState(cell, 'asc', t); });</script>\n"
          }
      }

      if (options.fullWidth === true) {
        content += '<style>#browse-listing > thead > tr > th:first-child,#browse-listing > tbody > tr > td:first-child{' +
          'box-sizing:border-box;width:2.5rem;min-width:2.5rem;max-width:2.5rem;padding-inline:0;text-align:center;white-space:nowrap}</style>\n'
      }

      }

      // Add controls after Markdown has generated header IDs from plain field labels.
      var html = ow.template.parseMD2HTML( content, !fragment )
      if (headerControls.length > 0) {
        html = String(html).replace(/(<thead>\s*<tr>)([\s\S]*?)(<\/tr>\s*<\/thead>)/, (match, start, row, end) => {
          var column = 0
          return start + row.replace(/<th\b[^>]*>[\s\S]*?<\/th>/g, cell => {
            var controls = headerControls[column++] || ""
            return cell.replace(/<\/th>$/, () => controls + "</th>")
          }) + end
        })
      }
      // Keep listing targets stable while live search replaces only results and pagination.
      html = String(html).replace(/<table(?=[\s>])/, '<table id="browse-listing"' + (serverSort ? ' data-browse-server-sort' : '') + (options.fullWidth === true ? ' style="display:table;width:100%"' : ''))
      if (fragment) return { data: html, status: 200, mimetype: "text/html; charset=utf-8", header: { "Cache-Control": "private, no-store", Vary: "X-OpenAF-Browse-Fragment" } }
      return html
    }
    if(!isFunction(custom.renderObj))fns.renderObj=(obj, server, request, options) => {
      const uri = request.uri
      const uriPrefix = ow.server.httpd.getPrefix(options.serverOrPort || options.port)
      const prefixURL = aURL => {
        aURL = _$(aURL).default("")
        if (aURL == "") return aURL
        aURL = String(aURL)
        if ((/^[a-z]+:/i).test(aURL) || aURL.startsWith("//")) return aURL
        if (!aURL.startsWith("/")) return aURL
        return (uriPrefix + "/" + aURL.replace(/^\/+/, "")).replace(/\/+/g, "/")
      }

      var puri = support.relative(uri, options.parentURI).replace(/\/$/, "")
      const relDir = aDepth => (aDepth <= 0 ? "./" : "../".repeat(aDepth))

      const previewServer = support.previewDocument(server, support.previewBackArrow)
      if (isDef(obj.stream) && obj.streamHeaders) {
        return server.replyStream(obj.stream, obj.streamType || "application/octet-stream", 200, obj.streamHeaders)
      }

      if (request.params.raw == "true") {
        log("Downloading raw file: " + puri)  
        if (isDef(obj.stream)) {
          return server.replyStream(obj.stream, ow.server.httpd.getMimeType(puri))
        }
        if (isDef(obj.file)) {
          return server.replyStream(io.readFileStream(obj.file), ow.server.httpd.getMimeType(puri))
        }
        if (isDef(obj.data)) {
          return server.replyOKJSON(obj.data, ow.server.httpd.getMimeType(puri))
        }
      }

      if (obj.type == "asciidoc" && isDef(getOPackPath("Asciidoc")) && (isDef(obj.stream) || isDef(obj.file))) {
        loadLib("asciidoc.js")
        const stream = new java.io.BufferedInputStream(isDef(obj.file) ? io.readFileStream(obj.file) : obj.stream)
        try { return ow.server.httpd.replyAsciidoc(previewServer, stream) }
        finally { stream.close() }
      }

      if (isDef(obj.stream)) {
        return server.replyStream(obj.stream, ow.server.httpd.getMimeType(puri))
      }

      if (isDef(obj.file)) {
        return server.replyStream(io.readFileStream(obj.file), ow.server.httpd.getMimeType(puri))
      }

      if (obj.type == "md") {
        return previewServer.replyOKHTML(ow.template.parseMD2HTML(obj.data, true))
      }

      if (obj.type == "json" && !obj.sourceOnly && (isUnDef(request.params.parse) || request.params.parse != "false")) {
        return ow.server.httpd.replyJSMap(previewServer, obj.data)
      }

      const breadcrumb = p => {
        // relative links resolve against the current URL's directory: the directory itself
        // when the URL ends with "/", otherwise the file's parent — so a file URL is one level up
        var parts = (p == "" ? [] : p.split("/"))
        var depth = uri.endsWith("/") ? parts.length : parts.length - 1
        if (depth < 0) depth = 0
        var b = "[/](</>) [" + (options.showURI ? escapeText(options.parentURI.replace(/^\//, "")) : "") + "](<" + relDir(depth) + ">)"
        for (var i = 0; i < parts.length; i++) {
          if (i == parts.length - 1) {
            b += (!options.showURI && i == 0 ? "" : " / ") + (obj.browseDetail ? "[" + escapeText(parts[i]) + "](<?>)" : escapeText(parts[i])) + " "
          } else {
            b += " [" + (!options.showURI && i == 0 ? "" : " / ") + " " + escapeText(parts[i]) + "](<" + relDir(depth - i - 1) + ">)"
          }
        }
        return b
      }

      const _downloadcode = `<span><script>
        function downloadText(aFile) {
          var selectedText = document.querySelectorAll("pre")[0].innerText
          const blob = new Blob([selectedText], { type: "text/plain" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = aFile
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }
      </script></span>`

      if (obj.type == "rawjson") obj.type = "json"

      const logo = prefixURL(_$(options.logo, "logo").isString().default("/fonts/openaf_small.png"))
      var content
      const heading = "## " + support.previewBackArrow
      if (obj.type == "raw") {
        content = heading + breadcrumb(puri) + "\n\n"
        content += String(obj.data)
        content += "\n\n"

        if (isDef(options.footer)) {
          content += "\n" + options.footer + "\n"
        }
      } else {
        const filename = support.fileLink(puri.substring(puri.lastIndexOf("/") + 1))
        const download = `<button type="button" onclick="downloadText(decodeURIComponent('${filename}'))" aria-label="Download" title="Download" style="float:right;border:0;background:none;color:inherit;cursor:pointer;font:inherit;padding:0 0 0 1em">${support.arrow("down")}</button>`
        content = heading + download + breadcrumb(puri) + "\n\n"
        // Protect already escaped source from Showdown's standalone pre/code pass.
        if (obj.sourceOnly) content += '<p><a href="' + support.jsonViewURL(request, "json") + '">Render</a></p>' + "\n\n"
        content += "<div><pre><code class=\"language-" + escapeText(obj.type) + "\">" + ow.format.escapeHTML(isMap(obj.data) ? stringify(obj.data) : String(obj.data)) + "</code></pre></div>\n\n"

        if (isDef(options.footer)) {
          content += "\n" + options.footer + "\n"
        }
        content += _downloadcode
      }


      return server.replyOKHTML( ow.template.parseMD2HTML( content, true ) )
    }
    if(!isFunction(custom.renderEmpty))fns.renderEmpty=function(request,opts){return ow.template.parseMD2HTML("# "+support.escapeText(support.relative(request.uri,opts.parentURI))+"\n\n*No content found.*",true)}
    // Keep a few short-lived path inventories so edits to a search reuse the same walk.
    var searchInventories = new Map(), inventoryLock = new java.lang.Object(), inventoryGeneration = 0
    var inventoryLocks = Array.from({ length: 4 }, () => new java.lang.Object())
    if(!isFunction(custom.search))fns.search=(request, options) => {
      if (!options.query || !options.query.enabled) { var unsupported = new Error("Search not enabled"); unsupported.httpStatus = 501; throw unsupported }
      var query = String((request.params || {}).q || "")
      if (query.length > (options.query.maxQueryLength || 256)) { var invalid = new Error("Query too long"); invalid.httpStatus = 400; throw invalid }
      var matches = support.searchMatcher(query, options.query.wildcards)
      var relative = support.relative(request.uri, options.parentURI)
      var start = support.resolve(options.parentPath, relative)
      var key = String(relative).replace(/\/+$/, "")
      var maxScan = options.query.maxScanned || 10000
      var timeout = options.query.timeoutMs || 5000
      var cacheKey = JSON.stringify([key, maxScan, timeout])
      var stripe = new java.lang.String(key).hashCode() & 3
      var inventory = syncFn(() => {
        var generation = syncFn(() => inventoryGeneration, inventoryLock)
        var hit = syncFn(() => searchInventories.get(cacheKey), inventoryLock)
        if (hit && hit.start == start && now() < hit.expires) return hit

        var startPath = new java.io.File(start).toPath()
        var pending = [start], seen = new Set(), entries = []
        var scanned = 0, began = now(), timedOut = false
        while (pending.length && scanned < maxScan) {
          if (now() - began >= timeout) { timedOut = true; break }
          var directory = pending.pop()
          if (seen.has(directory)) continue
          seen.add(directory)
          var dir = new java.io.File(directory)
          if (!dir.isDirectory()) continue
          var stream = java.nio.file.Files.newDirectoryStream(dir.toPath())
          try {
            var children = stream.iterator()
            while (children.hasNext()) {
              if (scanned >= maxScan || now() - began >= timeout) {
                timedOut = now() - began >= timeout
                pending.push(directory)
                break
              }
              scanned++
              var child = children.next().toFile()
              if (java.nio.file.Files.isSymbolicLink(child.toPath())) continue
              var path = String(startPath.relativize(child.toPath())).replace(/\\/g, "/")
              try { support.resolve(options.parentPath, key ? key + "/" + path : path) } catch (e) { continue }
              var directoryEntry = child.isDirectory()
              if (directoryEntry) pending.push(String(child.getCanonicalPath()))
              entries.push({ path: path, isDirectory: directoryEntry })
            }
          } finally { stream.close() }
        }

        var result = { start: start, entries: entries, scanned: scanned, timedOut: timedOut,
          complete: pending.length == 0 && !timedOut, expires: now() + 5000 }
        syncFn(() => {
          if (generation != inventoryGeneration) return
          searchInventories.delete(cacheKey)
          if (searchInventories.size >= 4) searchInventories.delete(searchInventories.keys().next().value)
          searchInventories.set(cacheKey, result)
        }, inventoryLock)
        return result
      }, inventoryLocks[stripe])

      var rows = [], limited = false
      var maxResults = options.query.maxResults || 1000
      if (query) for (var entry of inventory.entries) {
        if (!matches(entry.path)) continue
        // Check cached matches again in case a path was replaced after the walk.
        try {
          var candidate = support.resolve(options.parentPath, key ? key + "/" + entry.path : entry.path)
          if (!new java.io.File(candidate).exists() ||
              java.nio.file.Files.isSymbolicLink(new java.io.File(start, entry.path).toPath())) continue
        } catch (e) { continue }
        if (rows.length == maxResults) { limited = true; break }
        rows.push({ isDirectory: entry.isDirectory, values: { Filename: entry.path } })
      }
      var complete = inventory.complete && !limited
      return { isList: true, fields: ["Filename"], alignFields: ["left"], key: "Filename", list: rows,
        searchInfo: { complete: complete, truncated: !complete, timedOut: inventory.timedOut,
          scanned: inventory.scanned, totalExact: complete } }
    }
    if (!isFunction(custom.getList) && !isFunction(fns.refresh)) fns.refresh = (request, options) => {
      syncFn(() => {
        searchInventories.clear()
        inventoryGeneration++
      }, inventoryLock)
      var result = fns.getList(request, options)
      if (result.isFile) {
        var object = fns.getObj(request, options)
        if (object.stream) object.stream.close()
      }
    }
    var originalSearch=fns.search
    fns.search=function(request,opts){return support.query(originalSearch(request,opts),request,opts)}
    support.installOperations(options,validate)
    // Warm the root cache at startup. A failed load can be retried on the first request.
    if (!isFunction(custom.getList) && options.browse !== false) {
      try {
        fns.getList({ uri: options.parentURI.replace(/\/+$/, "") + "/", params: {}, method: "GET" }, options)
      } catch (e) {
        logWarn("Could not warm the browse root cache")
      }
    }
    return options
  }
  // Virtual browser callbacks replace filesystem callbacks and do not advertise file features.
  ;["odoc","opacks"].forEach(function(name){var original=browse[name];browse[name]=function(uri,options){options=options||{};if(options.query&&options.query.enabled||options.preview||options.operations&&options.operations.enabled)support.error(501,"Enhanced options are only supported by the files browser");var result=original(uri,options);result.capabilities={contract:1};delete result._operation;return result}})
})(OpenWrap.server.prototype.httpd.browse)
