"""Regression checks for documentation verification failures (no OpenAF needed)."""
import contextlib
import hashlib
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import check


class DocumentationChecks(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for directory in ("docs", "skills", "tools/docs", "examples"):
            (self.root / directory).mkdir(parents=True)
        self.write("README.md", "# Fixture\n")
        self.write("tools/docs/test_examples.py", "def test_fixture(): pass\n")
        self.manifest = {"contracts": [], "features": [], "copies": []}

    def write(self, name, content):
        (self.root / name).write_text(content)

    def run_check(self, execution=None):
        self.write("tools/docs/coverage.json", json.dumps(self.manifest))
        args = ["check.py", "--report", str(self.root / "report.json")]
        if execution is not None:
            self.write("execution.json", json.dumps(execution))
            args += ["--execution-report", str(self.root / "execution.json")]
        with patch.object(check, "ROOT", self.root), patch.object(check, "source_inventory", return_value={}), \
                patch("sys.argv", args), contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaises(SystemExit) as status:
                check.main()
        return status.exception.code, json.loads((self.root / "report.json").read_text())

    def test_missing_link_fails_but_code_and_comments_do_not(self):
        self.write("README.md", '<!-- [old](gone.md) -->\n```md\n[sample](absent.md)\n```\n[broken](missing.md)\n')
        status, report = self.run_check()
        self.assertEqual(status, 1)
        self.assertEqual(report["errors"], ["README.md: missing link missing.md"])

    def test_existing_local_and_external_links(self):
        self.write("README.md", '[guide](docs/guide.md#section) [external](https://example.invalid/page)\n')
        self.write("docs/guide.md", "# Guide\n")
        self.assertEqual(self.run_check()[0], 0)

    def test_embedded_copy_drift(self):
        self.write("examples/sample.js", 'print("new");\n')
        self.write("docs/guide.md", '```javascript\nprint("old");\n```\n')
        self.manifest["copies"] = [{"asset": "examples/sample.js", "document": "docs/guide.md", "language": "javascript"}]
        self.assertEqual(self.run_check()[0], 1)
        self.write("docs/guide.md", '```javascript\nprint("new");\n```\n')
        self.assertEqual(self.run_check()[0], 0)

    def test_execution_requires_fresh_files_and_passed_test(self):
        self.write("examples/sample.js", 'print("ok");\n')
        self.write("docs/guide.md", "# Guide\n")
        self.manifest["features"] = [{"symbol": "fixture", "source": "examples/sample.js", "source_token": "print",
                                      "reference": "docs/guide.md", "examples": ["examples/sample.js"], "test": "test_fixture"}]
        report = {"successful": True, "passed_tests": ["test_fixture"], "examples": ["examples/sample.js"],
                  "runner_sha256": hashlib.sha256((self.root / "tools/docs/test_examples.py").read_bytes()).hexdigest(),
                  "example_sha256": {"examples/sample.js": hashlib.sha256((self.root / "examples/sample.js").read_bytes()).hexdigest()}}
        self.assertFalse(self.run_check()[1]["curated"][0]["executed"])
        self.assertTrue(self.run_check(report)[1]["curated"][0]["executed"])
        report["passed_tests"] = []
        self.assertFalse(self.run_check(report)[1]["curated"][0]["executed"])
        report["passed_tests"] = ["test_fixture"]
        self.write("examples/sample.js", 'print("changed");\n')
        status, value = self.run_check(report)
        self.assertEqual(status, 1)
        self.assertFalse(value["curated"][0]["executed"])

    def test_source_candidates_are_distinct_from_odoc(self):
        self.write("examples/source.js", '/** <odoc><key>named(value) : String</key>Docs</odoc> */\n'
                   'const named = function(value) {};\nconst undocumented = function() {};\n'
                   'const _private = function() {};\nOpenWrap.obj.prototype.sample = function() {};\n')
        with patch.object(check, "ROOT", self.root), patch.object(check.subprocess, "check_output", return_value="examples/source.js\n"):
            entries = check.source_inventory()
        self.assertTrue(entries["named"]["odoc"])
        self.assertTrue(entries["named"]["candidate"])
        self.assertFalse(entries["undocumented"]["odoc"])
        self.assertIn("ow.obj.sample", entries)
        self.assertNotIn("_private", entries)


if __name__ == "__main__":
    unittest.main()
