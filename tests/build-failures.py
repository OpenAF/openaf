#!/usr/bin/env python3
"""Run isolated build failure regressions using an existing OpenAF bootstrap JAR."""
import argparse
import os
from pathlib import Path
import shutil
import subprocess
import tempfile


def main():
    repo = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bootstrap", type=Path, default=repo / "openaf.jar")
    args = parser.parse_args()
    bootstrap = args.bootstrap.resolve()
    java = shutil.which("java")
    if not bootstrap.is_file() or not java:
        parser.error("An existing bootstrap JAR and java on PATH are required")

    files = subprocess.check_output(["git", "ls-files", "-z"], cwd=repo).decode().split("\0")
    with tempfile.TemporaryDirectory(prefix="openaf-build-failures-") as directory:
        root = Path(directory)
        checkout = root / "checkout with spaces"
        checkout.mkdir()
        for name in filter(None, files):
            source = repo / name
            if not source.is_file():
                continue
            target = checkout / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
        # Only these scripts are needed to exercise each compiler failure.
        shutil.rmtree(checkout / "js")
        (checkout / "js").mkdir()
        (checkout / "buildSHA.json").unlink(missing_ok=True)
        fakebin = root / "fakebin"
        fakebin.mkdir()
        compiler = fakebin / "javac"
        compiler.write_text("#!/bin/sh\necho injected-javac-failure >&2\nexit 9\n")
        compiler.chmod(0o755)
        sentinel = b"previous JAR must survive a failed build\n"
        cases = [
            ("javac", "", None, "Java compilation failed", True),
            ("verbose-javac", "", None, "Java compilation failed", True),
            ("minifier", "var broken = ;", None, "minification failed", False),
            ("native-js", "", "function () {", "Error while compiling to java classes", False),
        ]
        for name, core, showdown, message, fake in cases:
            compiler.write_text("#!/bin/sh\n" + (
                "i=0\nwhile [ $i -lt 20000 ]; do\n  echo injected-javac-failure-abcdefghijklmnopqrstuvwxyz-0123456789 >&2\n  i=$((i + 1))\ndone\n"
                if name == "verbose-javac" else "echo injected-javac-failure >&2\n"
            ) + "exit 9\n")
            (checkout / "openaf.jar").write_bytes(sentinel)
            (checkout / "js/openaf.js").write_text(core)
            extra = checkout / "js/showdown.js"
            if showdown is None:
                extra.unlink(missing_ok=True)
            else:
                extra.write_text(showdown)
            env = dict(os.environ)
            if fake:
                env["PATH"] = str(fakebin) + os.pathsep + env.get("PATH", "")
            result = subprocess.run(
                [java, "-jar", str(bootstrap), "-f", "buildos.js"],
                cwd=checkout, env=env, capture_output=True, text=True, timeout=180,
            )
            output = result.stdout + result.stderr
            assert result.returncode != 0, (name, "build reported success", output[-6000:])
            assert message in output, (name, "wrong failure", output[-6000:])
            assert (checkout / "openaf.jar").read_bytes() == sentinel, (name, "previous JAR changed")
            assert not list(checkout.glob(".openaf-build-*.jar")), (name, "candidate leaked")
            print(name + ": failed correctly and preserved the previous JAR", flush=True)
        result = subprocess.run(
            [java, "-cp", os.pathsep.join([str(checkout / "bin"), str(checkout / "lib/js.jar")]),
             "openaf.CompileJS2Java", "MissingFixture", str(root / "missing.js"), str(checkout / "jslib")],
            capture_output=True, text=True, timeout=30,
        )
        assert result.returncode != 0, "Native JavaScript compiler must report source I/O failures"
        assert "NoSuchFileException" in result.stderr, result.stderr
        print("native-js-io: compiler reports a nonzero exit status", flush=True)
        copy_check = checkout / "check-copy.js"
        copy_check.write_text('''try {
  var job = io.readFileYAML("build.yaml").jobs.filter(j => j.name === "Copy OpenAF")[0]
  ;["Prepare shell complete", "Prepare ojob saved", "Prepare ojob doc", "Build OpenAFOS", "Repack OpenAFOS"].forEach(name => {
    if (job.deps.indexOf(name) < 0) throw new Error("Missing packaging dependency: " + name)
  })
  global.path = "."
  new Function("args", job.exec)({})
  if (!io.fileExists("dist/openaf.jar")) throw new Error("Distribution JAR missing")
  if (sha256(io.readFileStream("openaf.jar")) !== sha256(io.readFileStream("dist/openaf.jar"))) throw new Error("Distribution JAR mismatch")
} catch(e) { printErr(e); exit(1) }
''')
        result = subprocess.run(
            [java, "-jar", str(bootstrap), "-f", str(copy_check)], cwd=checkout,
            capture_output=True, text=True, timeout=30,
        )
        assert result.returncode == 0, result.stdout + result.stderr
        assert (checkout / "dist/openaf.jar").read_bytes() == sentinel
        print("distribution-copy: exact YAML body copies only after all packaging prerequisites", flush=True)


if __name__ == "__main__":
    main()
