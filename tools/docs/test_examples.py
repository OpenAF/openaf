#!/usr/bin/env python3
"""Execute canonical authoring examples with a selected OpenAF JAR (stdlib only)."""
import argparse
import datetime
import hashlib
import http.server
import json
import os
from pathlib import Path
import shutil
import signal
import subprocess
import tempfile
import threading
import unittest

ROOT = Path(__file__).resolve().parents[2]
EXAMPLES = ROOT / "examples/authoring"
RECORDS = json.loads((EXAMPLES / "records.json").read_text())


def execute(command, cwd, timeout=30):
    # No shell; each child owns a session so a timeout also stops its subprocesses.
    proc = subprocess.Popen(command, cwd=cwd, stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE, text=True,
                            start_new_session=(os.name == "posix"))
    try:
        stdout, stderr = proc.communicate(timeout=timeout)
    except subprocess.TimeoutExpired:
        if os.name == "posix":
            os.killpg(proc.pid, signal.SIGKILL)
        else:
            proc.kill()
        proc.communicate()
        raise AssertionError("Example exceeded its %ss deadline" % timeout)
    return subprocess.CompletedProcess(command, proc.returncode, stdout, stderr)


class Fixture(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        status = {"/missing": 404, "/failure": 500}.get(self.path, 200)
        body = {} if self.path == "/wrong-shape" else RECORDS
        data = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *_):
        pass


class Results(unittest.TextTestResult):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.passed_tests = []

    def addSuccess(self, test):
        super().addSuccess(test)
        self.passed_tests.append(test._testMethodName)


class Examples(unittest.TestCase):
    java = "java"
    jar = None
    integration = False
    executed = set()

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="openaf-authoring-")
        self.addCleanup(self.temp.cleanup)
        self.cwd = Path(self.temp.name)
        shutil.copytree(EXAMPLES, self.cwd, dirs_exist_ok=True)

    def run_example(self, path, args=None, success=True):
        path = Path(path)
        source = path if path.is_absolute() else EXAMPLES / path
        local = self.cwd / source.name
        if source != EXAMPLES / source.name:
            shutil.copy2(source, local)
        command = [self.java, "-jar", str(self.jar)]
        if source.suffix == ".yaml":
            # Filenames and fixture arguments contain no whitespace.
            command += ["--ojob", "-e", source.name + " " + " ".join(
                key + "=" + value for key, value in (args or {}).items())]
        else:
            command += ["-f", source.name, "-e", ";".join(
                key + "=" + value for key, value in (args or {}).items())]
        result = execute(command, self.cwd)
        self.executed.add(str(source.relative_to(ROOT)))
        detail = result.stdout + "\n" + result.stderr
        if success:
            self.assertEqual(result.returncode, 0, detail)
        else:
            self.assertEqual(result.returncode, 1, detail)
            self.assertTrue(result.stderr.strip(), detail)
            self.assertEqual(result.stdout.strip(), "", detail)
        return result

    def test_filter_pair(self):
        for suffix in ("js", "yaml"):
            for status, expected in ((None, RECORDS[:1]), ("inactive", RECORDS[1:]), ("missing", [])):
                with self.subTest(suffix=suffix, status=status):
                    args = {"input": "records.json", "output": "selected.json"}
                    if status is not None:
                        args["status"] = status
                    (self.cwd / "selected.json").write_text('["old content"]')
                    result = self.run_example("filter-records." + suffix, args)
                    self.assertEqual(json.loads(result.stdout), expected)
                    self.assertEqual(json.loads((self.cwd / "selected.json").read_text()), expected)
            (self.cwd / "empty.json").write_text("[]")
            result = self.run_example("filter-records." + suffix, {"input": "empty.json"})
            self.assertEqual(json.loads(result.stdout), [])

    def test_filter_failures(self):
        (self.cwd / "invalid.json").write_text("{broken")
        (self.cwd / "object.json").write_text("{}")
        for suffix in ("js", "yaml"):
            for args in ({"input": "absent.json"}, {"input": "invalid.json"}, {"input": "object.json"}):
                with self.subTest(suffix=suffix, args=args):
                    self.run_example("filter-records." + suffix, args, success=False)

    def test_missing_argument(self):
        for args in ({}, {"status": "active"}):
            self.run_example("filter-records.js", args, success=False)
            result = self.run_example("filter-records.yaml", args)
            self.assertIn("Usage:", result.stdout)
            self.assertFalse((self.cwd / "selected.json").exists())

    def test_http_pair(self):
        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Fixture)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            base = "http://127.0.0.1:%s" % server.server_port
            for suffix in ("js", "yaml"):
                result = self.run_example("http-json." + suffix, {"url": base + "/records"})
                self.assertEqual(json.loads(result.stdout), RECORDS)
                for route in ("/missing", "/failure", "/wrong-shape"):
                    with self.subTest(suffix=suffix, route=route):
                        self.run_example("http-json." + suffix, {"url": base + route}, success=False)
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=5)

    def test_process_pair(self):
        for suffix in ("js", "yaml"):
            for succeeds, option in ((True, "-version"), (False, "--not-an-openaf-java-option")):
                (self.cwd / "command.json").write_text(json.dumps([self.java, option]))
                result = self.run_example("process." + suffix, {"command": "command.json"}, success=succeeds)
                if succeeds:
                    value = json.loads(result.stdout)
                    self.assertEqual(value["exitcode"], 0)
                    self.assertIn("version", value["stdout"] + value["stderr"])

    def test_lifecycle(self):
        result = self.run_example("bounded-periodic.yaml")
        self.assertIn("tick: 1", result.stdout)
        self.assertIn("tick: 2", result.stdout)
        self.assertEqual(result.stdout.count("cleanup: ok"), 1)
        result = self.run_example("cleanup.yaml")
        self.assertIn("cleanup recovery: ok", result.stdout)
        self.assertNotIn("unexpected:", result.stdout)
        self.assertFalse((self.cwd / "temporary.txt").exists())

    def test_composition_and_workers(self):
        result = self.run_example("composition.yaml")
        self.assertEqual(result.stdout.strip().splitlines(), ["prepared", "42"])
        result = self.run_example("bounded-workers.yaml")
        self.assertEqual(sorted(result.stdout.strip().splitlines()), ["record: 1", "record: 2", "record: 3"])

    def test_yaml_parsing(self):
        code = ('io.listFiles(".").files.filter(function(f) { return /\\.yaml$/.test(f.filename); })'
                '.forEach(function(f) { var d = af.fromYAML(io.readFileString(f.filename));'
                'if (!isMap(d) || !isArray(d.jobs) || !isArray(d.todo)) throw f.filename; });'
                'print("yaml parsing: ok");')
        result = execute([self.java, "-jar", str(self.jar), "-c", code], self.cwd)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("yaml parsing: ok", result.stdout)

    def test_existing_skill_assets(self):
        result = self.run_example(ROOT / "skills/openaf-javascript/assets/filter-records.js", {"input": "records.json"})
        self.assertEqual(json.loads(result.stdout), RECORDS[:1])
        cases = {
            "skills/ojob-authoring/assets/greeting.yaml": "Hello, OpenAF!",
            "skills/openaf-concurrency/assets/bounded-work.js": "concurrency: ok",
        }
        for path, expected in cases.items():
            self.assertIn(expected, self.run_example(ROOT / path).stdout)

    def test_standalone_assertions(self):
        self.assertIn("filter assertions: ok", self.run_example("test-filter.js").stdout)

    def test_odoc_roundtrip(self):
        # Use the exact docstring and generation commands documented in odoc.md.
        doc = (ROOT / "docs/odoc.md").read_text()
        source = doc.split("```javascript\n", 1)[1].split("```", 1)[0]
        (self.cwd / "greeting.js").write_text(source)
        code = ('io.mkdir("help"); saveHelp("help", { greetings: "greeting.js" });'
                'setOfflineHelp(true); var r = searchHelp("greeting", "help/");'
                'ow.loadTest(); ow.test.assert(r.length, 1, "one match");'
                'ow.test.assert(r[0].key, "greeting", "key");'
                'ow.test.assert(r[0].fullkey, "greeting(aName) : String", "signature");'
                'print("odoc roundtrip: ok");')
        result = execute([self.java, "-jar", str(self.jar), "-c", code], self.cwd)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("odoc roundtrip: ok", result.stdout)
        self.assertTrue((self.cwd / "help/.odoc.db").is_file())

    def test_package_integration(self):
        if not self.integration:
            self.skipTest("Badgen integration requires --integration and an installed package")
        for source in (ROOT / "skills/openaf-opacks/assets/badge.js", EXAMPLES / "package.yaml"):
            self.assertIn("<svg", self.run_example(source).stdout)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--jar", type=Path, required=True)
    parser.add_argument("--java", default="java")
    parser.add_argument("--integration", action="store_true")
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    Examples.jar = args.jar.resolve(strict=True)
    Examples.java = shutil.which(args.java) or args.java
    Examples.integration = args.integration
    version = execute([Examples.java, "-jar", str(Examples.jar), "-c", "print(getVersion());"], ROOT)
    if version.returncode != 0:
        raise SystemExit(version.stderr)
    identity = {"runtime": version.stdout.strip(), "jar_sha256": hashlib.sha256(Examples.jar.read_bytes()).hexdigest()}
    print(json.dumps(identity), flush=True)
    result = unittest.TextTestRunner(verbosity=2, resultclass=Results).run(unittest.defaultTestLoader.loadTestsFromTestCase(Examples))
    report = dict(identity, successful=result.wasSuccessful(), tests=result.testsRun,
                  skipped=len(result.skipped), passed_tests=result.passed_tests, examples=sorted(Examples.executed),
                  checked_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                  runner_sha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                  example_sha256={path: hashlib.sha256((ROOT / path).read_bytes()).hexdigest()
                                  for path in sorted(Examples.executed)})
    if args.report:
        args.report.write_text(json.dumps(report, indent=2) + "\n")
    raise SystemExit(0 if result.wasSuccessful() else 1)


if __name__ == "__main__":
    main()
