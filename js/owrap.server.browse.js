

// Browse contract 1. Keep behavior aligned with oJob-common browse fixtures.
OpenWrap.server.prototype.httpd.browse.support = (function() {
  var exports = {}
exports.capabilities = { contract: 1, query: 1, previewFormats: 1, boundedPreview: 1, operations: 1 }
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
  var rows = result.list.slice()
  rows.sort(function(a, b) {
    if (!!a.isDirectory != !!b.isDirectory) return a.isDirectory ? -1 : 1
    var av = a.sortValues && isDef(a.sortValues[field]) ? a.sortValues[field] : a.values[field]
    var bv = b.sortValues && isDef(b.sortValues[field]) ? b.sortValues[field] : b.values[field]
    if(field=="Size" && isNumber(a.values["Size in bytes"]) && isNumber(b.values["Size in bytes"])){av=a.values["Size in bytes"];bv=b.values["Size in bytes"]}
    var n = isNumber(av) && isNumber(bv) ? av - bv : String(av).localeCompare(String(bv))
    return n ? n * (order == "desc" ? -1 : 1) : String(a.values[key]).localeCompare(String(b.values[key]))
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
exports.readPreview = function(stream, type, limit) {
  var output = new java.io.ByteArrayOutputStream(), count = 0, n
  try {
    if (isDef(limit) && (!isNumber(limit) || !isFinite(limit) || limit < 1 || limit > 16777216 || Math.floor(limit) != limit)) exports.error(400, "Invalid preview byte limit")
    var max = isDef(limit) ? limit + 1 : 2147483647
    var buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 8192)
    while (count < max && (n = stream.read(buffer, 0, Math.min(buffer.length, max-count))) != -1) {
      if (n > 0) { output.write(buffer,0,n); count += n }
    }
  } finally { stream.close() }
  var bytes = output.toByteArray(), truncated = isDef(limit) && bytes.length > limit
  if (truncated) bytes = java.util.Arrays.copyOf(bytes, limit)
  var decoder = java.nio.charset.StandardCharsets.UTF_8.newDecoder().onMalformedInput(java.nio.charset.CodingErrorAction.IGNORE)
  var data = String(decoder.decode(java.nio.ByteBuffer.wrap(bytes)))
  if (truncated) return {data:data+"\n\n[Preview truncated; download the complete file.]",type:"text",truncated:true}
  if (type == "json") return {data:jsonParse(data),type:"json"}
  if (type == "asciidoc") return {stream:new java.io.ByteArrayInputStream(bytes),type:"asciidoc"}
  return {data:data,type:type == "markdown" ? "md" : type}
}
exports.defaults = {md:"markdown",yml:"yaml",yaml:"yaml",css:"css",sh:"sh",js:"js",java:"java",py:"python",toml:"toml",hbs:"handlebars",json:"json",adoc:"asciidoc"}
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
  var enhanced=options.query && options.query.enabled || options.operations && options.operations.enabled || options.preview
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
    freshness:function(predicate){var rows=Object.keys(units).map(function(id){return units[id]}).filter(function(u){return !predicate || predicate(u.name,u.key)});var loaded=rows.length?Math.min.apply(null,rows.map(function(u){return u.loadedAt})):null,expires=rows.length?Math.min.apply(null,rows.map(function(u){return u.expiresAt})):null;return {loadedAt:loaded,expiresAt:expires,stale:expires==null || now()>=expires,refreshing:false,generation:stats.loads}}
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
  options._operation = function(action,request,server,api) {
    if(!api && action=="refresh" && (request.params||{}).csrf!==csrf) exports.error(403,"Invalid refresh token")
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
    if(!isFunction(custom.getList))fns.getList=function(request,opts){
      var file=validate(request,opts)
      if(!io.fileExists(file))return {isFile:false}
      var info=io.fileInfo(file)
      if(info.isFile)return {isFile:true}
      var relative=support.relative(request.uri,opts.parentURI).replace(/\/$/,"")
      var rows=io.listFiles(file).files.filter(function(row){try{support.resolve(opts.parentPath,(relative?relative+"/":"")+row.filename);return true}catch(e){return false}}).map(function(row){return {isDirectory:row.isDirectory,values:{Filename:row.filename,"Last modified":ow.format.fromDate(new Date(row.lastModified),"yyyy-MM-dd HH:mm:ss"),Size:row.isDirectory?"":ow.format.toBytesAbbreviation(row.size),"Size in bytes":row.isDirectory?"":row.size}}})
      return support.query({isList:true,fields:["Filename","Last modified","Size","Size in bytes"],alignFields:["left","center","right","right"],key:"Filename",list:rows},request,opts)
    }
    if(!isFunction(custom.getObj))fns.getObj=function(request,opts){
      var file=validate(request,opts), name=String(new java.io.File(file).getName())
      if((request.params||{}).raw=="true")return {stream:io.readFileStream(file)}
      var preview=opts._api ? {} : opts.preview || {},type=support.format(name,preview,support.defaults)
      if(!type)return {file:file}
      if(type=="markdown" && opts.useMDRaw)type="raw"
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
      if (options.query && options.query.enabled || options._operation) {
        content += '<style>' + [
          '.browse-controls{display:flex;flex-wrap:wrap;align-items:center;gap:0.5em 1em;margin:0.25em 0 0.75em;padding-left:0.5em;color:#a0a0a0;font-family:-apple-system,Calibri,"DejaVu Sans",sans-serif;font-size:0.95em}',
          '.browse-controls label{display:inline-flex;align-items:center;gap:0.5em;min-width:0;max-width:100%}',
          '.browse-controls .browse-search{flex:1 1 14em;max-width:32em}',
          '.browse-controls input{box-sizing:border-box;min-width:0;max-width:100%;padding:0.15em 0.25em;border:0;border-bottom:1px solid #a0a0a0;border-radius:0;background:transparent;color:inherit;font:inherit}',
          '.browse-controls input[name=q]{flex:1;width:100%}.browse-controls input[name=size]{width:4.5em}',
          '.browse-controls button,.browse-controls a{padding:0;border:0;background:transparent;color:#a0a0a0;font:inherit;font-weight:600;text-decoration:none;cursor:pointer;white-space:nowrap}',
          '.browse-controls button:hover,.browse-controls a:hover{color:#707070;text-decoration:underline}',
          '.browse-controls input:focus-visible,.browse-controls button:focus-visible,.browse-controls a:focus-visible{outline:1px solid currentColor;outline-offset:3px}',
          '@media(max-width:480px){.browse-controls .browse-search{flex-basis:100%;max-width:100%}}'
        ].join('') + '</style>\n\n'
      }
      if (options.query && options.query.enabled) {
        content += '<form class="browse-controls" method="get"><label class="browse-search">Search <input name="q" value="' + escapeText((request.params||{}).q || '') + '"></label>'
        content += '<input type="hidden" name="sort" value="' + escapeText(lst.sortInfo ? lst.sortInfo.field : String(lst.key)) + '"><input type="hidden" name="order" value="' + (lst.sortInfo && lst.sortInfo.order == 'desc' ? 'desc' : 'asc') + '">'
        content += ' <label>Per page <input type="number" name="size" min="1" max="' + (options.query.maxPageSize || 500) + '" value="' + (_pageSize || options.query.pageSize || 100) + '"></label> <button type="submit">Apply</button></form>\n'
      }

      // Pagination controls (if metadata is provided)
      if (isDef(lst.pageInfo) && isDef(lst.pageInfo.pageSize) && lst.pageInfo.pageSize > 0) {
        var _totalPages = Math.max(1, Math.ceil(lst.pageInfo.total / lst.pageInfo.pageSize))
        if (_totalPages == 1 && _page <= 1) {
          // Don't render pagination for a single page.
        } else {
        var pageURL = page => {
          var params = request.params || {}
          var keys = Object.keys(params).filter(k => ["page", "NanoHttpd.QUERY_STRING"].indexOf(k) < 0 && !k.startsWith("NanoHttpd."))
          return "?" + keys.map(k => encodeURIComponent(k) + "=" + encodeURIComponent(params[k])).concat(["page=" + page]).join("&amp;")
        }
        var _prev = _page > 1 ? pageURL(_page - 1) : __
        var _next = (_page < _totalPages) ? pageURL(_page + 1) : __
        var _pager = "<div style=\"margin: 0.25em 0 0.75em 0; padding-left: 0.5em; font-family: -apple-system, Calibri, DejaVu Sans;\">"
        if (isDef(_prev) && String(_prev).length > 0) {
          _pager += "<a style=\"text-decoration: none; font-weight: 600; color: #a0a0a0;\" onmouseover=\"this.style.color='#707070'\" onmouseout=\"this.style.color='#a0a0a0'\" href=\"" + _prev + "\">&#8592;</a>"
        } else {
          _pager += "<span style=\"color: #a0a0a0;\">&#8592;</span>"
        }
        _pager += "<span style=\"color: #a0a0a0; padding: 0 0.6em;\">|</span>"
        _pager += "<span style=\"color: #a0a0a0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace; font-size: 0.95em;\">" + _page + " / " + _totalPages + "</span>"
        _pager += "<span style=\"color: #a0a0a0; padding: 0 0.6em;\">|</span>"
        if (isDef(_next) && String(_next).length > 0) {
          _pager += "<a style=\"text-decoration: none; font-weight: 600; color: #a0a0a0;\" onmouseover=\"this.style.color='#707070'\" onmouseout=\"this.style.color='#a0a0a0'\" href=\"" + _next + "\">&#8594;</a>"
        } else {
          _pager += "<span style=\"color: #a0a0a0;\">&#8594;</span>"
        }
        _pager += "</div>\n"
        content += _pager
        }
      }

      // Match sortTab's header controls while sorting the full result on the server.
      var headers = lst.fields
      var headerControls = []
      if (options.query && options.query.enabled) {
        content += '<style>' + [
          '.sorter-container{float:right;font-size:10px;margin-left:4px}',
          '.sorter-container .sort-button{display:none;padding:0;margin:0 2px;border:none;background:transparent;cursor:pointer;text-decoration:none;transition:color 0.2s ease}',
          'th:hover .sorter-container .sort-button,th:focus-within .sorter-container .sort-button,.sorter-container .sort-button:focus,.sorter-container .sort-button.active{display:inline-block}',
          '.sorter-container:focus-within .sort-button{display:inline-block}',
          '.sorter-container .sort-button{color:#c0c0c0}',
          'th:hover .sorter-container .sort-button,th:focus-within .sorter-container .sort-button{color:#909090}',
          '@media(prefers-color-scheme:dark){.sorter-container .sort-button{color:#404040}th:hover .sorter-container .sort-button,th:focus-within .sorter-container .sort-button{color:#606060}}'
        ].join('') + '</style>\n'
        var sortURL = (field, order) => {
          var params = request.params || {}
          var keys = Object.keys(params).filter(k => ["page", "sort", "order"].indexOf(k) < 0 && !k.startsWith("NanoHttpd."))
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
          content += "|---"
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
            content += "| <span style=\"color: #a0a0a0; font-family: -apple-system, Calibri, DejaVu Sans;\">&#8598;</span> | __[..](<../>)__ | | |\n"
          }

          var rows = lst.queryInfo && lst.queryInfo.applied ? lst.list : $from(lst.list).sort("-isDirectory", "values." + lst.key).select()
          rows.forEach(r => {
              content += "|"
              if (r.isDirectory) {
                  content += " <span style=\"color: #a0a0a0; font-family: -apple-system, Calibri, DejaVu Sans;\">&#8600;</span> |"
              } else {
                  content += " <span style=\"font-family: -apple-system, Calibri, DejaVu Sans;\"><a href=\"" + fileLink(r.values[lst.key]) + "?raw=true\" download=\"" + escapeText(r.values[lst.key]) + "\">&darr;</a></span> |"
              }
              lst.fields.forEach((f, i) => {
                if (r.isDirectory) {
                    content += " " + (i == 0 ? "__[" + escapeText(r.values[f]) + "](<" + fileLink(r.values[lst.key]) + "/>)__" : escapeText(r.values[f])) + " |"
                } else {
                    content += " " + (i == 0 ? "[" + escapeText(r.values[f]) + "](<" + fileLink(r.values[lst.key]) + ">)" : escapeText(r.values[f])) + " |"
                }
              })
              content += "\n"
          })
      }

      // Content
      if (isDef(lst.content)) {
          content += "\n" + lst.content + "\n"
      }
 
      // Footer
      if (isDef(options.footer)) {
          content += "\n" + options.footer + "\n"
      }
      if (options._operation) {
        content += '<form class="browse-controls" method="post" action="' + prefixURL(options.parentURI.replace(/\/$/,"") + '/@@/refresh') + '"><input type="hidden" name="path" value="' + escapeText(puri) + '"><input type="hidden" name="csrf" value="' + options._refreshToken + '"><button type="submit">Refresh now</button> <a href="' + prefixURL(options.parentURI.replace(/\/$/,"") + '/@@/status') + '">Status</a></form>\n'
      }

      if (options.sortTab && !(lst.queryInfo && lst.queryInfo.applied)) {
          content += "<script src=\"" + prefixURL("/js/mdtablesort.js") + "\"></script>\n"
          if (options.sortTabAsc) {
              content += "<script>document.addEventListener('DOMContentLoaded', function() { var t = document.querySelector('table'); if (!t) return; var row = t.querySelector('thead tr') || t.querySelector('tr'); if (!row) return; var cell = row.querySelectorAll('th, td')[1]; if (!cell) return; if (typeof updateSortState === 'function') updateSortState(cell, 'asc', t); });</script>\n"
          }
      }

      // Add controls after Markdown has generated header IDs from plain field labels.
      var html = ow.template.parseMD2HTML( content, true )
      if (headerControls.length > 0) {
        html = String(html).replace(/(<thead>\s*<tr>)([\s\S]*?)(<\/tr>\s*<\/thead>)/, (match, start, row, end) => {
          var column = 0
          return start + row.replace(/<th\b[^>]*>[\s\S]*?<\/th>/g, cell => {
            var controls = headerControls[column++] || ""
            return cell.replace(/<\/th>$/, () => controls + "</th>")
          }) + end
        })
      }
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

      if (obj.type == "asciidoc" && isDef(getOPackPath("Asciidoc"))) {
        loadLib("asciidoc.js")
        if (isUnDef(obj.file) && isDef(obj.stream)) {
          return  ow.server.httpd.replyAsciidoc(server, obj.stream)
        } else {
          return ow.server.httpd.replyAsciidoc(server, obj.file)
        }
      }

      if (isDef(obj.stream)) {
        return server.replyStream(obj.stream, ow.server.httpd.getMimeType(puri))
      }

      if (isDef(obj.file)) {
        return server.replyStream(io.readFileStream(obj.file), ow.server.httpd.getMimeType(puri))
      }

      if (obj.type == "md") {
        return server.replyOKHTML(ow.template.parseMD2HTML(obj.data, true))
      }

      if (obj.type == "json" && (isUnDef(request.params.parse) || request.params.parse != "false")) {
        return ow.server.httpd.replyJSMap(server, obj.data)
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
      if (obj.type == "raw") {
        content = "## <span style=\"display: flex; justify-content: space-between\"><span>" + breadcrumb( puri ) + "</span><span style=\"display: inline-flex; justify-content: space-between; float: inline-end; align-items: start\"><span onclick=\"history.back()\" onmouseout=\"this.style.textDecoration='none';\" onmouseover=\"this.style.textDecoration='underline';\" style=\"padding-left: 1em; text-decoration: none; cursor: pointer; font-family: -apple-system, Calibri, DejaVu Sans;\"><a href=\"javascript:history.back()\">&larr;</a></span></span></span>\n\n"
        content += String(obj.data)
        content += "\n\n"

        if (isDef(options.footer)) {
          content += "\n" + options.footer + "\n"
        }
      } else {
        content = "## <span style=\"display: flex; justify-content: space-between\"><span>" + breadcrumb( puri ) + "</span><span style=\"display: inline-flex; justify-content: space-between; float: inline-end; align-items: start\"><span onclick=\"history.back()\" onmouseout=\"this.style.textDecoration='none';\" onmouseover=\"this.style.textDecoration='underline';\" style=\"padding-left: 1em; text-decoration: none; cursor: pointer; font-family: -apple-system, Calibri, DejaVu Sans;\"><a href=\"javascript:history.back()\">&larr;</a></span><span onclick=\"downloadText(decodeURIComponent('" + fileLink(puri.replace(/\/?$/,"").substr(puri.replace(/\/?$/,"").lastIndexOf("/")+1)) + "'))\" onmouseout=\"this.style.textDecoration='none';\" onmouseover=\"this.style.textDecoration='underline';\" style=\"padding-left: 1em; float: right; text-decoration: none; cursor: pointer; font-family: -apple-system, Calibri, DejaVu Sans;\"><a href=\"javascript:downloadText(decodeURIComponent('" + fileLink(puri.replace(/\/?$/,"").substr(puri.replace(/\/?$/,"").lastIndexOf("/")+1)) + "'))\">&darr;</a></span></span></span>\n\n"
        content += "<pre><code class=\"language-" + escapeText(obj.type) + "\">" + ow.format.escapeHTML(isMap(obj.data) ? stringify(obj.data) : String(obj.data)) + "</code></pre>\n\n"

        if (isDef(options.footer)) {
          content += "\n" + options.footer + "\n"
        }
        content += _downloadcode
      }


      return server.replyOKHTML( ow.template.parseMD2HTML( content, true ) )
    }
    if(!isFunction(custom.renderEmpty))fns.renderEmpty=function(request,opts){return ow.template.parseMD2HTML("# "+support.escapeText(support.relative(request.uri,opts.parentURI))+"\n\n*No content found.*",true)}
    if(!isFunction(custom.search))fns.search=(request, options) => {
      if (!options.query || !options.query.enabled) { var unsupported = new Error("Search not enabled"); unsupported.httpStatus = 501; throw unsupported }
      var query = String((request.params || {}).q || "")
      if (query.length > (options.query.maxQueryLength || 256)) { var invalid = new Error("Query too long"); invalid.httpStatus = 400; throw invalid }
      var relative = support.relative(request.uri, options.parentURI)
      var start = support.resolve(options.parentPath, relative)
      var pending = [start], seen = {}, rows = [], scanned = 0, began = now(), timedOut = false
      var maxScan = options.query.maxScanned || 10000, maxResults = options.query.maxResults || 1000
      while (pending.length && scanned < maxScan && rows.length < maxResults) {
        if (now() - began >= (options.query.timeoutMs || 5000)) { timedOut = true; break }
        var directory = pending.pop()
        if (seen[directory]) continue
        seen[directory] = true
        if (!new java.io.File(directory).isDirectory()) continue
        var directoryStream = java.nio.file.Files.newDirectoryStream(new java.io.File(directory).toPath())
        try {
        var children = directoryStream.iterator()
        while (children.hasNext()) {
          if (scanned >= maxScan || rows.length >= maxResults || now() - began >= (options.query.timeoutMs || 5000)) {
            timedOut = now() - began >= (options.query.timeoutMs || 5000)
            pending.push(directory); break
          }
          scanned++
          var child = children.next().toFile(), path = String(new java.io.File(start).toPath().relativize(child.toPath())).replace(/\\/g, "/")
          if (java.nio.file.Files.isSymbolicLink(child.toPath())) continue
          try { support.resolve(options.parentPath, (relative ? relative.replace(/\/$/, "") + "/" : "") + path) } catch(e) { continue }
          if (child.isDirectory()) pending.push(String(child.getCanonicalPath()))
          if (query && path.toLowerCase().indexOf(query.toLowerCase()) >= 0) rows.push({isDirectory:child.isDirectory(),values:{Filename:path}})
        }
        } finally { directoryStream.close() }
      }
      var complete = pending.length == 0 && !timedOut
      return {isList:true,fields:["Filename"],alignFields:["left"],key:"Filename",list:rows,searchInfo:{complete:complete,truncated:!complete,timedOut:timedOut,scanned:scanned,totalExact:complete}}
    }
    var originalSearch=fns.search
    fns.search=function(request,opts){return support.query(originalSearch(request,opts),request,opts)}
    support.installOperations(options,validate)
    return options
  }
  // Virtual browser callbacks replace filesystem callbacks and do not advertise file features.
  ;["odoc","opacks"].forEach(function(name){var original=browse[name];browse[name]=function(uri,options){options=options||{};if(options.query&&options.query.enabled||options.preview||options.operations&&options.operations.enabled)support.error(501,"Enhanced options are only supported by the files browser");var result=original(uri,options);result.capabilities={contract:1};delete result._operation;return result}})
})(OpenWrap.server.prototype.httpd.browse)
