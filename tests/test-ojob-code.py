#!/usr/bin/env python3
"""Round-trip CLI regressions. Run with --jar openaf.jar [--source]."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


class CodeExchange(unittest.TestCase):
    jar = ROOT / 'openaf.jar'
    source_mode = False

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='ojob-code-')
        self.addCleanup(self.temp.cleanup)
        self.cwd = Path(self.temp.name)
        self.definition = self.cwd / 'workflow.yaml'
        self.definition.write_text('''# workflow comment
help:
  text: preserved
code:
  handlers.js: |- # module comment
    (function() {
      exports.Normalize = function(args) { args.text = args.text.toUpperCase(); };
    })();
  scripts/task.sh: |+
    echo hello

jobs:
- name: Normalize
  execRequire: handlers.js
- name: Inline
  exec: |- # body comment
    print("original");
- name: Python
  lang: python
  exec: |
    args["value"] = 1

todo: [] # final comment
''')
        self.wrapper = self.cwd / 'source-cli.js'
        self.wrapper.write_text('ow.loadOJob(); load(' + json.dumps(str(ROOT / 'js/owrap.oJob.js')) + '); '
                                'Object.keys(OpenWrap.oJob.prototype).forEach(function(k) { ow.oJob[k] = OpenWrap.oJob.prototype[k]; }); '
                                'load(' + json.dumps(str(ROOT / 'js/ojob.js')) + ');')

    def cli(self, *options, success=True, definition=None):
        expr = str(definition or self.definition) + ' ' + ' '.join(options)
        cmd = ['java', '-jar', str(self.jar)]
        cmd += ['-f', str(self.wrapper)] if self.source_mode else ['--ojob']
        proc = subprocess.run(cmd + ['-e', expr], cwd=self.cwd, text=True, capture_output=True, timeout=30)
        if success:
            self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)
            self.assertNotIn("Error while executing operation:", proc.stderr)
        else:
            self.assertNotEqual(proc.returncode, 0, proc.stdout + proc.stderr)
        return proc

    def export(self, *options):
        return self.cli('-exportcode', 'dir=code', *options)

    def manifest(self):
        return json.loads((self.cwd / 'code/.ojob-code.json').read_text())

    def import_code(self, *options, success=True):
        return self.cli('-importcode', 'dir=code', *options, success=success)

    def test_export_and_unchanged_round_trip(self):
        self.export()
        self.assertEqual([e['file'] for e in self.manifest()['entries']],
                         ['handlers.js', 'scripts/task.sh', 'jobs/1-Inline.js', 'jobs/2-Python.py'])
        self.assertEqual((self.cwd / 'code/scripts/task.sh').read_text(), 'echo hello\n\n')
        self.assertEqual(self.import_code().stdout, self.definition.read_text())

    def test_edited_sources_and_preserved_comments(self):
        self.export()
        (self.cwd / 'code/jobs/1-Inline.js').write_text('  print("edited");\n')
        (self.cwd / 'code/scripts/task.sh').write_text('echo changed\n\n\n')
        self.import_code('output=updated.yaml')
        updated = self.cwd / 'updated.yaml'
        text = updated.read_text()
        for comment in ['# workflow comment', '# module comment', '# body comment', '# final comment']:
            self.assertIn(comment, text)
        self.cli('-exportcode', 'dir=again', definition=updated)
        self.assertEqual((self.cwd / 'again/jobs/1-Inline.js').read_text(), '  print("edited");\n')
        self.assertEqual((self.cwd / 'again/scripts/task.sh').read_text(), 'echo changed\n\n\n')

    def test_selected_job_and_explicit_file(self):
        self.cli('-exportcode', 'job=Inline', 'file=inline.js')
        manifest = json.loads((self.cwd / '.ojob-code.json').read_text())
        self.assertEqual(manifest['entries'][0]['file'], 'inline.js')
        self.assertEqual((self.cwd / 'inline.js').read_text(), 'print("original");')

    def test_names_and_paths_with_spaces(self):
        self.definition.write_text(self.definition.read_text().replace('name: Inline', 'name: Two Words'))
        self.cli('-exportcode', 'job="Two Words"', 'dir="source files"')
        manifest = json.loads((self.cwd / 'source files/.ojob-code.json').read_text())
        file = self.cwd / 'source files' / manifest['entries'][0]['file']
        file.write_text('print("edited");')
        result = self.cli('-importcode', 'dir="source files"')
        self.assertIn('edited', result.stdout)

    def test_arbitrary_property_and_pointer_escaping(self):
        self.export('path=/help/text', 'file=code/help.txt')
        (self.cwd / 'code/help.txt').write_text('updated help')
        self.assertIn('updated help', self.import_code().stdout)
        self.cli('-exportcode', 'path=/code/scripts~1task.sh', 'dir=selected')
        self.assertEqual((self.cwd / 'selected/source.js').read_text(), 'echo hello\n\n')

    def test_overwrite_and_conflict_preflight(self):
        self.export()
        self.cli('-exportcode', 'dir=code', success=False)
        self.export('force=true')
        self.definition.write_text(self.definition.read_text().replace('print("original");', 'print("conflict");'))
        self.import_code('output=updated.yaml', success=False)
        self.assertFalse((self.cwd / 'updated.yaml').exists())

    def test_missing_file_and_job_identity(self):
        self.export()
        body = self.cwd / 'code/jobs/1-Inline.js'
        body.unlink()
        self.import_code('output=updated.yaml', success=False)
        body.write_text('print("edited");')
        self.definition.write_text(self.definition.read_text().replace('name: Inline', 'name: Renamed'))
        self.import_code('output=updated.yaml', success=False)
        self.assertFalse((self.cwd / 'updated.yaml').exists())

    def test_unrelated_edit_and_inplace(self):
        self.export()
        self.definition.write_text(self.definition.read_text().replace('text: preserved', 'text: unrelated'))
        (self.cwd / 'code/jobs/1-Inline.js').write_text('print("edited");')
        self.import_code('inplace=true')
        self.assertIn('text: unrelated', self.definition.read_text())
        self.import_code('inplace=true')  # idempotent

    def test_does_not_execute_definition_hooks(self):
        self.definition.write_text('''include: [does-not-exist.yaml]
ojob:
  loadLibs: [does-not-exist.js]
jobs:
- name: Dangerous
  exec: print("must not run");
code:
  eval.js: '!!js/eval throw "must not evaluate"'
todo: [Dangerous]
''')
        self.export()
        self.import_code()
        self.cli('-exportcode', '-compile', 'dir=other', success=False)
        self.assertFalse((self.cwd / 'other').exists())

    def test_path_traversal_and_symlinks(self):
        self.definition.write_text('code: {"../escape.js": "bad"}\njobs: []\ntodo: []\n')
        self.cli('-exportcode', 'dir=code', success=False)
        self.assertFalse((self.cwd / 'escape.js').exists())
        self.assertFalse((self.cwd / 'code').exists())
        self.definition.write_text('code: {"link/escape.js": "bad"}\njobs: []\ntodo: []\n')
        (self.cwd / 'code').mkdir()
        (self.cwd / 'code/link').symlink_to(self.cwd, target_is_directory=True)
        self.cli('-exportcode', 'dir=code', success=False)
        self.assertFalse((self.cwd / 'escape.js').exists())

    def test_json_round_trip_and_flow_yaml(self):
        for filename in ['workflow.json', 'flow.yaml']:
            definition = self.cwd / filename
            definition.write_text(json.dumps({'code': {'a.js': 'before'}, 'jobs': [], 'todo': []}, indent=2))
            directory = filename + '-code'
            self.cli('-exportcode', 'dir=' + directory, definition=definition)
            (self.cwd / directory / 'a.js').write_text('quotes " tabs\t unicode λ\n\n')
            result = self.cli('-importcode', 'dir=' + directory, definition=definition)
            self.assertEqual(json.loads(result.stdout)['code']['a.js'], 'quotes " tabs\t unicode λ\n\n')

    def test_alias_changes_are_rejected(self):
        self.definition.write_text('code:\n  a.js: &BODY |-\n    before\njobs:\n- name: Alias\n  exec: *BODY\ntodo: []\n')
        self.export('path=/code/a.js')
        (self.cwd / 'code/source.js').write_text('after')
        self.import_code(success=False)
        self.cli('-exportcode', 'dir=alias', 'job=Alias')
        (self.cwd / 'alias/jobs/0-Alias.js').write_text('after')
        self.cli('-importcode', 'dir=alias', success=False)

    def test_source_bytes_and_scalar_forms(self):
        for index, value in enumerate(['', 'one', 'one\n', 'one\n\n', '\nleading\n', '  indented\n', '\tindented\n', 'a\rb\n']):
            self.export('path=/jobs/1/exec', 'force=true')
            (self.cwd / 'code/source.js').write_bytes(value.encode())
            result = self.import_code('output=result.yaml', 'force=true')
            self.cli('-exportcode', 'dir=verify', 'path=/jobs/1/exec', 'force=true', definition=self.cwd / 'result.yaml')
            self.assertEqual((self.cwd / 'verify/source.js').read_bytes(), value.encode(), (index, result.stderr))
            self.assertIn('# body comment', (self.cwd / 'result.yaml').read_text())

    def test_eof_and_nested_block_scalars(self):
        for raw in ['code:\n  a.js: |-\n    before',
                    'code:\n  a.js: >- # retained\n    before\n\n# following\njobs: []\n',
                    'jobs:\n  - name: Nested\n    exec: |-\n      before\n',
                    'code:\r\n  a.js: |-\r\n    before\r\n# following\r\njobs: []\r\n']:
            self.definition.write_bytes(raw.encode())
            path = '/jobs/0/exec' if raw.startswith('jobs:') else '/code/a.js'
            self.export('path=' + path, 'force=true')
            (self.cwd / 'code/source.js').write_text('  after\n\n')
            self.import_code('output=result.yaml', 'force=true')
            self.cli('-exportcode', 'dir=verify', 'path=' + path, 'force=true', definition=self.cwd / 'result.yaml')
            self.assertEqual((self.cwd / 'verify/source.js').read_text(), '  after\n\n')
            if '# following' in raw:
                self.assertIn('# following', (self.cwd / 'result.yaml').read_text())

    def test_comments_before_scalars_and_bom(self):
        for raw in ['code:\n  a.js: &BODY # anchor comment\n    |- # block comment\n    before\n# following\njobs: []\n',
                    'code:\n  a.js: # before scalar\n    |- # on scalar\n    before\n# following\njobs: []\n',
                    '\ufeffcode:\n  a.js: "before" # quoted comment\njobs: []\n',
                    'code:\n  a.js: before # plain comment\njobs: []\n']:
            self.definition.write_bytes(raw.encode())
            self.export('force=true')
            (self.cwd / 'code/a.js').write_text('after\n')
            self.import_code('output=result.yaml', 'force=true')
            text = (self.cwd / 'result.yaml').read_text()
            for comment in ['# anchor comment', '# block comment', '# before scalar', '# on scalar', '# following', '# quoted comment', '# plain comment']:
                if comment in raw:
                    self.assertIn(comment, text)
            self.cli('-exportcode', 'dir=verify', 'force=true', definition=self.cwd / 'result.yaml')
            self.assertEqual((self.cwd / 'verify/a.js').read_text(), 'after\n')

    def test_dot_relative_embedded_filename(self):
        self.definition.write_text('code: {"./lib/a.js": "before"}\njobs: []\n')
        self.export()
        self.assertEqual(self.manifest()['entries'][0]['file'], './lib/a.js')
        (self.cwd / 'code/lib/a.js').write_text('after')
        self.assertIn('after', self.import_code().stdout)

    def test_destination_ancestor_conflict(self):
        self.definition.write_text('code: {"a": "first", "a/b.js": "second"}\njobs: []\n')
        self.cli('-exportcode', 'dir=code', success=False)
        self.assertFalse((self.cwd / 'code').exists())

    def test_safe_tags_and_malformed_documents(self):
        for raw in ['code: {a.js: !!js/eval "throw 42"}',
                    'code: {a.js: before}\n---\ncode: {b.js: after}',
                    'code: {a.js: before, a.js: after}']:
            self.definition.write_text(raw)
            self.cli('-exportcode', 'dir=code', success=False)
            self.assertFalse((self.cwd / 'code').exists())


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--jar', type=Path, default=ROOT / 'openaf.jar')
    parser.add_argument('--source', action='store_true', help='Load repository JS over the selected runtime')
    options, remaining = parser.parse_known_args()
    CodeExchange.jar = options.jar.resolve()
    CodeExchange.source_mode = options.source
    unittest.main(argv=[__file__] + remaining)
