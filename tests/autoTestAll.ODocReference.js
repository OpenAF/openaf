// Copyright 2026 Nuno Aguiar
(function() {
  function assert(actual, expected, message) { ow.test.assert(actual, expected, message) }
  var repository = io.fileExists('../genODocReference.yaml') ? io.fileInfo('..').canonicalPath : io.fileInfo('.').canonicalPath
  var job = repository + '/genODocReference.yaml'
  function temporary(fn) {
    var path = io.createTempDir('odoc-reference-test-')
    try { fn(path) } finally { io.rm(path) }
  }
  function generate(root, options) {
    var params = Object.assign({ dirs: root + '/source', output: root + '/wiki' }, options || {})
    // Pass structured arguments through oJob, avoiding shell/path quoting ambiguity.
    var code = 'oJob(' + stringify(job, __, '') + ',' + stringify(params, __, '') + ')'
    return $sh([String(java.lang.System.getProperty('java.home')) + '/bin/java',
      '--enable-native-access=ALL-UNNAMED', '-Xmx256m', '-jar', getOpenAFJar(), '-c', code]).timeout(120000).get(0)
  }
  function successful(result) { assert(result.exitcode, 0, 'Generation failed: ' + result.stdout + result.stderr) }
  function manifest(root) { return io.readFileJSON(root + '/wiki/.odoc-reference.json') }
  function page(root, key, kind) {
    var files = manifest(root).files
    var target
    if (kind === 'category') {
      var parts = key ? key.split('.') : ['globals']
      var directory = parts.map(function(part) { return part.toLowerCase().replace(/[^a-z0-9_-]+/g, '-') }).join('/')
      if (key === '' || key === 'Globals') directory = 'globals-' + sha256(key).slice(0, 8)
      target = directory + '/index.md'
    } else {
      var index = io.readFileString(root + '/wiki/all-apis.md')
      var links = /\]\(([^)#]+)#([^)]*)\)/g, match
      var anchor = 'api-' + key.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).toLowerCase() + '-' + sha256(key).slice(0, 8)
      while ((match = links.exec(index))) if (match[2] === anchor) target = match[1]
    }
    assert(files.indexOf(target) >= 0, true, 'Expected page for ' + key)
    return io.readFileString(root + '/wiki/' + target)
  }

  function block(signature, text, markdown) {
    return '/**\n * <odoc' + (markdown ? ' format="' + markdown + '"' : '') + '>\n * <key>' + signature + '</key>\n' +
      (markdown ? ' * <![CDATA[\n' : '') + text.split('\n').map(function(line) { return ' * ' + line }).join('\n') + '\n' +
      (markdown ? ' * ]]>\n' : '') + ' * </odoc>\n */\n'
  }
  function snapshot(root) {
    var result = {}
    manifest(root).files.concat(['.odoc-reference.json']).forEach(function(file) { result[file] = sha256(io.readFileString(root + '/wiki/' + file)) })
    return result
  }
  function checkLinks(root) {
    var files = manifest(root).files
    var known = {}
    files.forEach(function(file) { known[file] = true })
    files.forEach(function(file) {
      var text = io.readFileString(root + '/wiki/' + file), match
      var links = /\]\(([^)#]+\.md)(?:#([^)]*))?\)/g
      while ((match = links.exec(text))) {
        var source = java.nio.file.Paths.get(file)
        var parent = source.getParent()
        var resolved = String((parent === null ? java.nio.file.Paths.get(match[1]) : parent.resolve(match[1])).normalize()).replace(/\\/g, '/')
        assert(known[resolved], true, 'Broken link in ' + file + ': ' + match[1])
        if (match[2]) assert(io.readFileString(root + '/wiki/' + resolved).indexOf('<a id="' + match[2] + '"></a>') >= 0, true, 'Missing anchor: ' + match[2])
      }
    })
  }
  exports.testWiki = function() {
    temporary(function(root) {
      io.mkdir(root + '/source/nested')
      var md = '**Unicode 😀**\n\n- item\n  - child\n\n```javascript\nvar xml = "<odoc><tag>&value</tag>"\n```'
      var content = block('ow.demo.run(value) : String', md, 'md') + block('Thing()', 'Constructor') +
        block('Thing.method()', 'Method') + block('$ch()', 'A &amp; B\\\nNext line') +
        block('Globals.method()', 'Named namespace') + block('__proto__.method()', 'Special property') +
        block('case.A()', 'Upper') + block('case.a()', 'Lower') + block('punct.a|b()', 'Punctuation') +
        block('punct.a-b()', 'Different punctuation') + block('Unicode.你好()', 'Non-ASCII API')
      io.writeFileString(root + '/source/a.js', content.replace(/\n/g, '\r\n'))
      io.writeFileString(root + '/source/nested/B.java', block('ow.demo.run(value) : String', md, 'markdown') + block('ow.demo.run(value, extra) : String', 'Overload'))
      // Multiple blocks on a line, with an opening token split across the stream buffer boundary.
      io.writeFileString(root + '/source/boundary.js', ' '.repeat(8190) + '<odoc><key>edge.first()</key>One</odoc><odoc><key>edge.second()</key>Two</odoc>')
      io.writeFileString(root + '/source/ignored.txt', block('ignored()', 'Wrong extension'))
      successful(generate(root, { dirs: ' ' + root + '/source , ' + root + '/source/nested,' + root + '/source' }))
      var m = manifest(root)
      assert(m.complete, true, 'Complete extraction')
      assert(m.counts.files, 3, 'Overlapping source roots must not duplicate files')
      assert(m.counts.entries, 15, 'All blocks must be extracted')
      assert(m.counts.apis, 13, 'Duplicate API key must share a page')
      loadHelp()
      var extracted = new ODocsGen({ fixture: root + '/source/a.js' }).getODoc().fixture
      var run = page(root, 'ow.demo.run')
      assert(extracted['ow.demo.run'].t, md, 'Fixture must agree with the existing ODoc parser')
      assert(run.indexOf(extracted['ow.demo.run'].t) >= 0, true, 'Markdown, entities and CDATA must match ODocsGen')
      assert((run.match(/### ow.demo.run/g) || []).length, 2, 'Distinct overloads must survive; identical bodies merge')
      assert(run.indexOf('a.js:2') >= 0 && run.indexOf('B.java:2') >= 0, true, 'Merged entry must list both sources and opening lines')
      assert(page(root, '$ch').indexOf('A &#38; B\n\nNext line') >= 0, true, 'Legacy entities and line breaks must be rendered as text')
      assert(page(root, '', 'category') !== page(root, 'Globals', 'category'), true, 'Globals and literal Globals namespace must not collide')
      assert(page(root, 'ow.demo', 'category').indexOf('## ow.demo.run') >= 0, true, 'Category must contain its APIs')
      assert(page(root, 'ow', 'category').indexOf('[ow.demo]') >= 0, true, 'Parent category must link children')
      assert(page(root, 'Thing').indexOf('[Globals]') >= 0, true, 'Constructor must appear under Globals')
      assert(page(root, 'edge.first').indexOf('One') >= 0, true, 'Split opening token must be found')
      var folded = {}
      m.files.forEach(function(file) {
        assert(/^[a-z0-9_.\/-]+$/.test(file), true, 'Filesystem-safe filename')
        assert(Boolean(folded[file.toLowerCase()]), false, 'Case-insensitive filename collision')
        folded[file.toLowerCase()] = true
      })
      checkLinks(root)
      var before = snapshot(root)
      successful(generate(root))
      assert(snapshot(root), before, 'Repeated generation must be byte-for-byte deterministic')
      assert(io.listFiles(root).files.filter(function(f) { return f.filename.indexOf('.odoc-reference-') === 0 }).length, 0, 'Staging directory must be cleaned')
    })
  }
  exports.testStreamBoundaries = function() {
    temporary(function(root) {
      io.mkdir(root + '/source')
      var expected = [], number = 0
      ;['<odoc format="markdown">', '<![CDATA[', ']]>', '</odoc>', '😀'].forEach(function(token) {
        for (var split = 1; split < token.length; split++) {
          var key = 'split.case' + number++
          var text = '<odoc format="markdown"><key>' + key + '()</key><![CDATA[<odoc>literal & data😀]]></odoc>'
          var padding = 8192 - text.indexOf(token) - split
          io.writeFileString(root + '/source/' + key + '.js', ' '.repeat(padding) + text)
          expected.push(key)
        }
      })
      successful(generate(root))
      assert(manifest(root).counts.apis, expected.length, 'All split-token entries must survive')
      expected.forEach(function(key) {
        assert(page(root, key).indexOf('<odoc>literal & data😀') >= 0, true, 'CDATA, opening tags and Unicode must survive stream boundaries: ' + key)
      })
      checkLinks(root)
    })
  }
  exports.testErrorsAndRefresh = function() {
    temporary(function(root) {
      io.mkdir(root + '/source')
      io.writeFileString(root + '/source/good.js', block('valid()', 'Good'))
      io.writeFileString(root + '/source/bad.js', '<odoc><key>broken()</key>Bad & entity</odoc>\n' +
        '<odoc><key>unclosed()</key>oops\n' + block('recovered()', 'Good') +
        '<odoc><key>oversized()</key>' + 'x'.repeat(2000) + '</odoc>' + block('afterLarge()', 'Good') +
        '<odoc>Missing key</odoc>\n<odoc><key>eof()</key>')
      io.writeFileString(root + '/source/incomplete.java', '<odoc format=')
      var result = generate(root, { maxBlockMB: 0.001 })
      assert(result.exitcode, 1, 'Skipped documentation must produce a failing exit status')
      var m = manifest(root)
      assert(m.complete, false, 'Partial wiki must be marked incomplete')
      assert(m.counts.errors, 6, 'Malformed, unclosed, oversized and missing keys must be counted')
      assert(m.counts.apis, 3, 'Valid entries after bad blocks must survive')
      assert(result.stderr.indexOf('bad.js:1') >= 0, true, 'Diagnostics must identify source and line')
      assert(io.readFileString(root + '/wiki/index.md').indexOf('Incomplete reference') >= 0, true, 'Partial wiki must show a notice')
      io.writeFileString(root + '/wiki/notes.md', 'Keep my notes')
      var stale = 'removed/index.md'
      io.writeFileString(root + '/source/removed.js', block('removed.entry()', 'Remove this namespace'))
      // Keep the malformed sources so the intermediate manifest remains incomplete.
      assert(generate(root, { maxBlockMB: 0.001 }).exitcode, 1, 'Intermediate generation remains incomplete')
      io.rm(root + '/source/removed.js')
      io.rm(root + '/source/bad.js')
      io.rm(root + '/source/incomplete.java')
      successful(generate(root))
      assert(io.fileExists(root + '/wiki/' + stale), false, 'Refresh must remove stale owned pages')
      assert(io.readFileString(root + '/wiki/notes.md'), 'Keep my notes', 'Refresh must preserve unrelated files')
      checkLinks(root)
      var before = snapshot(root)
      var conflict = 'fresh/index.md'
      io.mkdir(root + '/wiki/fresh')
      io.writeFileString(root + '/wiki/' + conflict, 'Unowned content')
      io.writeFileString(root + '/source/new.js', block('fresh.run()', 'New'))
      result = generate(root)
      assert(result.exitcode, 1, 'Unowned conflict must fail')
      assert(snapshot(root), before, 'Conflict must leave previously generated files untouched')
      assert(io.readFileString(root + '/wiki/' + conflict), 'Unowned content', 'Conflict must preserve unowned content')
      result = generate(root, { dirs: root + '/missing' })
      assert(result.exitcode, 1, 'Missing root must fail before output changes')
      assert(snapshot(root), before, 'Invalid roots must leave output untouched')
      assert(generate(root, { maxBlockMB: 0 }).exitcode, 1, 'Nonpositive block limit must fail')
      assert(generate(root, { dirs: root + '/source,' }).exitcode, 1, 'Empty root argument must fail')
    })
  }
  exports.testTraversalAndMemory = function() {
    temporary(function(root) {
      io.mkdir(root + '/source/nested')
      io.mkdir(root + '/outside')
      io.writeFileString(root + '/outside/ignored.js', block('outside()', 'Do not follow symlink'))
      io.writeFileString(root + '/source/nested/valid.java', block('inside.method()', 'Valid'))
      if (String(java.lang.System.getProperty('os.name')).indexOf('Windows') < 0) {
        java.nio.file.Files.createSymbolicLink(new java.io.File(root + '/source/linked').toPath(), new java.io.File(root + '/outside').toPath())
        java.nio.file.Files.createSymbolicLink(new java.io.File(root + '/source/linked-file.js').toPath(), new java.io.File(root + '/outside/ignored.js').toPath())
        java.nio.file.Files.createSymbolicLink(new java.io.File(root + '/source/loop').toPath(), new java.io.File(root + '/source').toPath())
      }
      // A source file larger than the subprocess heap, including a very long line.
      var stream = io.writeFileStream(root + '/source/large.js')
      try {
        var chunk = 'x'.repeat(1024 * 1024)
        for (var i = 0; i < 270; i++) ioStreamWrite(stream, chunk)
        ioStreamWrite(stream, '\n' + block('large.entry()', 'Found after 270 MiB of source'))
      } finally { stream.close() }
      successful(generate(root, { output: root + '/source/wiki' }))
      var m = io.readFileJSON(root + '/source/wiki/.odoc-reference.json')
      assert(m.counts.files, 2, 'Traversal must ignore symlinks')
      assert(m.counts.apis, 2, 'Large source must be scanned under a 256 MiB heap')
      // Copy a source into output to prove recursive reruns skip the output subtree.
      io.writeFileString(root + '/source/wiki/ignored.js', block('outputIgnored()', 'Ignore output'))
      successful(generate(root, { output: root + '/source/wiki' }))
      assert(io.readFileJSON(root + '/source/wiki/.odoc-reference.json').counts.files, 2, 'Output inside source must be skipped on rerun')
    })
  }
})()
