#!/usr/bin/env python3
"""Guard the build/test workflow's token boundary without external dependencies."""
from pathlib import Path
import re
import unittest

WORKFLOW = Path(__file__).resolve().parents[1] / '.github/workflows/build-and-test.yml'


class WorkflowPermissions(unittest.TestCase):
    def test_read_only_token_permissions(self):
        text = WORKFLOW.read_text()
        blocks = re.findall(r'(?m)^( *)permissions:\n((?:\1  [^\n]*\n)+)', text)
        self.assertTrue(any(not indent for indent, _ in blocks), 'Set a workflow default')
        for _, block in blocks:
            self.assertEqual(block.strip(), 'contents: read')
        self.assertNotRegex(text, r'(?m)^\s*permissions:\s*\{')
        self.assertNotIn('write-all', text)

    def test_no_writeback_or_explicit_secret_token(self):
        text = WORKFLOW.read_text()
        self.assertNotIn('secrets.', text)
        self.assertNotRegex(text, r'ojob\.io/git/hub/(?:checkIn|contentIn)')

    def test_checkout_does_not_persist_credentials(self):
        text = WORKFLOW.read_text()
        checkouts = re.findall(r'(?m)^    (?:  uses:|- uses:) actions/checkout@[^\n]+\n((?: +[^\n]*\n)*)', text)
        self.assertEqual(len(checkouts), 4)
        for checkout in checkouts:
            self.assertRegex(checkout, r'(?m)^        persist-credentials: false$')


if __name__ == '__main__':
    unittest.main()
