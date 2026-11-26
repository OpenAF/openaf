"""Test a built OpenAF JAR against remote oPacks served by a separate process.

Run from the checkout root with python3 tests/opack-streaming.py openaf.jar.
"""

import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from zipfile import ZIP_DEFLATED, ZIP_STORED, ZipFile


MIB = 1024 * 1024


def make_package(path, version="1", size=128, manifest_last=False, *,
                 extra=None, compression=ZIP_STORED, missing=False,
                 wrong_hash=False, manifest_size=0):
    # Write and hash one block at a time, even for the large fixtures.
    block = bytes(range(256)) * 4096
    digest = hashlib.sha256()
    for offset in range(0, size, MIB):
        digest.update(block[:min(size - offset, MIB)])
    manifest = json.dumps({
        "name": "StreamFixture",
        "version": version,
        "repository": {"type": "http", "url": "https://example.invalid/fixture.opack"},
        "scripts": {},
        "files": [".package.json", "driver.bin"] + (["missing.bin"] if missing else []),
        "filesHash": {"driver.bin": "a" * 64 if wrong_hash else digest.hexdigest()},
    }).encode()
    manifest += b" " * max(0, manifest_size - len(manifest))

    with ZipFile(path, "w", compression, compresslevel=1) as archive:
        if not manifest_last:
            archive.writestr(".package.json", manifest)
        with archive.open("driver.bin", "w") as entry:
            for offset in range(0, size, MIB):
                entry.write(block[:min(size - offset, MIB)])
        if manifest_last:
            archive.writestr(".package.json", manifest)
        if extra:
            archive.writestr(extra, b"outside")


class PackageServer(ThreadingHTTPServer):
    def __init__(self):
        super().__init__(("127.0.0.1", 0), PackageHandler)
        self.routes = {}
        self.requests = []


class PackageHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        name = self.path.partition("?")[0]
        self.server.requests.append(name)
        path, extra, truncate, status = self.server.routes[name]
        expected = path.stat().st_size + len(extra)
        self.send_response(status)
        self.send_header("Content-Length", str(expected))
        self.end_headers()
        try:
            with path.open("rb") as body:
                remaining = path.stat().st_size - truncate
                while remaining:
                    data = body.read(min(MIB, remaining))
                    self.wfile.write(data)
                    remaining -= len(data)
            self.wfile.write(extra)
        except (BrokenPipeError, ConnectionResetError):
            # Expected when a quota or HTTP status rejects the response early.
            pass

    def log_message(self, *_):
        pass


def exercise(jar, root, server):
    runtime = root / "runtime"
    runtime.mkdir()
    jar = shutil.copy2(jar, runtime / "openaf.jar")
    home, temp, target = (root / name for name in ("home", "tmp", "target"))
    home.mkdir()
    temp.mkdir()
    env = {**os.environ, "OAF_HOME": str(home), "OAF_FLAGS": "{}"}

    def register(name, path=None, trailing=b"", truncate=0, status=200, **fixture):
        if path is None:
            path = root / name
            make_package(path, **fixture)
        server.routes["/" + name] = (path, trailing, truncate, status)
        return path

    def opack(command, name, *, properties=(), flags="{}", options=(), expected=()):
        url = f"http://127.0.0.1:{server.server_port}/{name}"
        arguments = [command, url, *options]
        if command == "install":
            arguments.extend(("-d", str(target)))
        request_count = len(server.requests)
        result = subprocess.run(
            ["java", "-Xmx96m", "-Dopenaf.test.worker=true", f"-Djava.io.tmpdir={temp}",
             "--enable-native-access=ALL-UNNAMED", *properties, "-jar", jar,
             "--opack", "-e", " ".join(arguments)],
            env={**env, "OAF_FLAGS": flags}, cwd=root,
            capture_output=True, text=True, check=True, timeout=60,
        )
        output = result.stdout + result.stderr
        assert all(token in output for token in expected), output
        assert server.requests[request_count:] == ["/" + name.partition("?")[0]], output
        assert not list(temp.glob("openaf-opack-stage-*")), output
        return output

    # Exercise both manifest orders and one fetch per command with a heap smaller than the combined buffers.
    register("first.opack", size=80 * MIB)
    register("last.opack", version="2", size=80 * MIB, manifest_last=True)
    opack("install", "first.opack?download", expected=("installed: 1", "failed: 0"))
    opack("info", "first.opack", expected=("StreamFixture", "driver.bin", "OK"))
    opack("info", "last.opack", expected=("StreamFixture", "driver.bin", "OK"))
    opack("update", "last.opack", expected=("updated: 1", "failed: 0"))
    opack("update", "last.opack", expected=("notNeeded: 1", "failed: 0"))
    opack("update", "first.opack", options=("-force",), expected=("updated: 1", "failed: 0"))
    opack("install", "last.opack", options=("-force",), expected=("installed: 1", "failed: 0"))
    assert (target / "driver.bin").stat().st_size == 80 * MIB
    original = (target / ".package.json").read_bytes()

    def rejected(name, reason, cli_options=(), **options):
        opack("install", name, options=("-force", *cli_options),
              expected=(reason, "failed: 1"), **options)
        assert (target / ".package.json").read_bytes() == original
        assert (target / "driver.bin").stat().st_size == 80 * MIB

    # Exercise archive budgets independently of the HTTP/status and package verification paths.
    register("at-limit.opack", size=128 * MIB, compression=ZIP_DEFLATED)
    opack("info", "at-limit.opack", expected=("driver.bin", "OK"))
    register("over-limit.opack", size=128 * MIB + 1, compression=ZIP_DEFLATED)
    rejected("over-limit.opack", "expanded entry bytes", cli_options=("-noverify",))
    rejected("first.opack", "expanded entry bytes",
             flags='{"ARCHIVE":{"maxEntryBytes":67108864}}')
    rejected("first.opack", "expanded entry bytes",
             flags='{"ARCHIVE":{"maxEntryBytes":104857600}}',
             properties=("-Dopenaf.archive.maxEntryBytes=67108864",))
    small = register("small.opack", size=2 * MIB, compression=ZIP_DEFLATED)
    for setting, value, reason in (
        ("maxTotalBytes", MIB, "expanded total bytes"),
        ("maxEntries", 1, "entry count"),
        ("maxRatio", 1, "expansion ratio"),
    ):
        rejected("small.opack", reason, properties=(f"-Dopenaf.archive.{setting}={value}",))
    register("tail.opack", path=small, trailing=b"tail" * MIB)
    rejected("tail.opack", "compressed input bytes",
             properties=(f"-Dopenaf.archive.maxInputBytes={small.stat().st_size + 64}",))
    register("manifest.opack", manifest_size=4 * MIB + 1)
    rejected("manifest.opack", "package manifest bytes")

    # Verify cleanup for transport failures, invalid entries, and integrity failures.
    register("interrupted.opack", path=small, truncate=7)
    rejected("interrupted.opack", "Can't retrieve")
    register("error.opack", path=small, status=503)
    rejected("error.opack", "HTTP response code: 503")
    corrupt = register("crc.opack")
    with ZipFile(corrupt) as archive:
        entry = archive.getinfo("driver.bin")
    with corrupt.open("r+b") as file:
        file.seek(entry.header_offset + 30 + len(entry.filename))
        file.write(b"X")
    rejected("crc.opack", "invalid entry CRC")
    register("duplicate.opack", extra="./driver.bin")
    rejected("duplicate.opack", "Duplicate archive entry")
    register("traversal.opack", extra="../outside")
    rejected("traversal.opack", "Unsafe package path")
    register("missing.opack", missing=True)
    rejected("missing.opack", "Missing archive entry")
    register("hash.opack", wrong_hash=True)
    rejected("hash.opack", "Package hash mismatch")
    opack("update", "hash.opack", options=("-force",),
          expected=("Package hash mismatch", "updated: 0", "erasedToUpdate: 0", "failed: 1"))
    assert (target / ".package.json").read_bytes() == original
    assert (target / "driver.bin").stat().st_size == 80 * MIB
    opack("info", "hash.opack", expected=("CHANGED!",))
    opack("install", "hash.opack", options=("-force", "-noverify"),
          expected=("installed: 1", "failed: 0"))
    print("Remote oPack streaming, quotas, integrity, and cleanup PASS")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("jar", type=Path)
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix="openaf-opack-stream-test-") as workspace:
        with PackageServer() as server:
            # The test process serves files while each invocation runs in its own JVM.
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                exercise(args.jar.resolve(), Path(workspace), server)
            finally:
                server.shutdown()
                thread.join()
