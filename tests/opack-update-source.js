// Standalone from checkout root: java -jar openaf.jar -f tests/opack-update-source.js
// Use real package readers, version checks, staging and erase with isolated catalogs and registration.
try {
  // Isolate runtime catalog functions without replacing their global const bindings
  var source = io.readFileString("js/opack.js")
    .replace(/getOPackLocalDB/g, "fixtureLocalDB")
    .replace(/getOPackRemoteDB/g, "fixtureRemoteDB")
  var installed, available, target, archive, fixtureNumber = 0
  var fixtureLocalDB = () => {
    var db = {}
    if (isDef(installed)) db[target] = clone(installed)
    return db
  }
  var fixtureRemoteDB = () => {
    var db = {}
    db[available.name] = clone(available)
    return db
  }
  eval(source.substring(0, source.indexOf("// MAIN\n")))
  var base = String(java.nio.file.Files.createTempDirectory("opack-update-source-"))
  var readPackage = getPackage, readSources = []
  sortPackagesByDeps = packages => packages
  verifyDeps = () => ({})
  findLocalDBByName = () => installed
  addLocalDB = function(packag) { installed = clone(packag) }
  removeLocalDB = function() { installed = undefined }
  getHTTPOPack = () => archive
  getPackage = function(path) {
    readSources.push(path)
    // Simulate a same-named installed folder beneath the working directory
    return readPackage(path == available.name ? target : path)
  }
  function assert(value, message) { if (!value) throw new Error(message) }

  // Build complete old installations and verified replacement packages
  function fixture(name, version, kind) {
    var root = base + "/" + (++fixtureNumber), origin = root + "/source"
    target = root + "/" + name
    io.mkdir(origin)
    io.mkdir(target)
    installed = { name: name, version: version, files: ["payload.js", "obsolete.txt", PACKAGEJSON], scripts: {}, dependencies: {}, __target: target }
    io.writeFileJSON(target + "/" + PACKAGEJSON, installed)
    io.writeFileString(target + "/payload.js", "old")
    io.writeFileString(target + "/obsolete.txt", "obsolete")
    io.writeFileString(target + "/unrelated.txt", "keep")
    available = { name: name, version: "20261115", files: ["payload.js", PACKAGEJSON], filesHash: { "payload.js": sha1("new") }, scripts: {}, dependencies: {} }
    available.repository = kind == "path" ? { type: "path", path: origin } : { type: "http", url: "https://fixture.invalid/" + name + ".opack" }
    io.writeFileJSON(origin + "/" + PACKAGEJSON, available)
    io.writeFileString(origin + "/payload.js", "new")
    if (isDef(archive)) archive.close()
    archive = new ZIP()
    archive.putFile(PACKAGEJSON, af.fromString2Bytes(stringify(available)))
    archive.putFile("payload.js", af.fromString2Bytes("new"))
    var archivePath = root + "/fixture.opack"
    io.writeFileBytes(archivePath, archive.generate(__, true))
    remoteDB = undefined
    readSources = []
    return archivePath
  }
  function verifyUpdate(args, expectedSource) {
    var result = update(args)
    assert(result.updated == 1 && result.failed == 0 && result.notNeeded == 0, "Update skipped or failed: " + stringify(result))
    assert(installed.version == "20261115", "New version was not registered")
    assert(readSources.indexOf(expectedSource) >= 0, "Resolved source was not read: " + expectedSource)
    assert(io.readFileString(target + "/payload.js") == "new", "New payload was not installed")
    assert(!io.fileExists(target + "/obsolete.txt"), "Obsolete payload was retained")
    assert(io.readFileString(target + "/unrelated.txt") == "keep", "Unrelated file was changed")
  }

  try {
    // Update all packages despite old same-named folders, for both repository transports
    ["AWS", "ghcopilot", "mini-a"].forEach(name => {
      ["20261030", "20261105"].forEach(version => {
        ["http", "path"].forEach(kind => {
          fixture(name, version, kind)
          verifyUpdate(["-all"], kind == "path" ? available.repository.path : available.repository.url)
        })
      })
    })

    // Preserve explicitly supplied archive sources and individual named updates
    var archivePath = fixture("AWS", "20261030", "http")
    verifyUpdate([archivePath], archivePath)
    fixture("AWS", "20261105", "http")
    verifyUpdate([available.repository.url], available.repository.url)
    fixture("AWS", "20261105", "http")
    verifyUpdate(["AWS"], available.repository.url)
    print("oPack update source selection: 15 regression cases PASS")
  } finally {
    if (isDef(archive)) archive.close()
    io.rm(base)
  }
  exit(0)
} catch(e) { printErr(String(e)); exit(1) }
