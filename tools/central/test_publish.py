import unittest
from publish import identity, archive, ROOT, absent
import xml.etree.ElementTree as ET
from pathlib import Path
import tempfile
from unittest.mock import patch
import urllib.error
import zipfile

class PublishingTests(unittest.TestCase):
    def test_immutability_fails_closed(self):
        with patch('publish.urllib.request.urlopen'):
            with self.assertRaises(ValueError):
                absent('io.github.account', '20261015')
        with patch('publish.urllib.request.urlopen', side_effect=urllib.error.HTTPError('url', 404, 'absent', {}, None)):
            absent('io.github.account', '20261015')
        with patch('publish.urllib.request.urlopen', side_effect=urllib.error.HTTPError('url', 403, 'forbidden', {}, None)):
            with self.assertRaises(urllib.error.HTTPError):
                absent('io.github.account', '20261015')

    def test_pom_contract(self):
        root = ET.parse(ROOT / 'pom-central.xml').getroot()
        ns = {'m': 'http://maven.apache.org/POM/4.0.0'}
        self.assertEqual(root.find('m:packaging', ns).text, 'jar')
        self.assertIsNone(root.find('m:dependencies', ns))
        self.assertEqual(root.find('m:properties/m:central.skipUpload', ns).text, 'true')
        self.assertEqual(root.find('m:properties/m:central.autoPublish', ns).text, 'false')
        text = (ROOT / 'pom-central.xml').read_text()
        self.assertNotIn('openaf.jar.orig', text)
        self.assertNotIn('PRIVATE KEY', text)
        self.assertNotIn('<password>', text)
        self.assertIn('<version>0.12.0</version>', text)

    def test_versions(self):
        for tag in ('v20261015', 'v20261015-20261028'):
            self.assertEqual(identity(tag, 'io.github.authorized-account'), tag[1:])
        for tag in ('20261015', 'v20260230', 'v20261015-SNAPSHOT', 'v20261015-20251015', 'v20261015/evil', 'v20261015\n'):
            with self.assertRaises(ValueError):
                identity(tag, 'io.github.account')
    def test_namespace(self):
        for group in ('io.openaf', 'io.github.REPLACE_WITH_VERIFIED_ACCOUNT', 'io.github.account/evil', ''):
            with self.assertRaises(ValueError):
                identity('v20261015', group)
    def test_reproducible_archives(self):
        with tempfile.TemporaryDirectory() as d:
            a, b = Path(d)/'a.jar', Path(d)/'b.jar'
            archive(a, [('b.java', b'b'), ('a.java', b'a')])
            archive(b, [('a.java', b'a'), ('b.java', b'b')])
            self.assertEqual(a.read_bytes(), b.read_bytes())
            with zipfile.ZipFile(a) as z:
                self.assertEqual(z.namelist(), ['a.java', 'b.java'])

if __name__ == '__main__':
    unittest.main()
