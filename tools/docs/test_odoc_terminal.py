#!/usr/bin/env python3
"""Check packaged -helpscript rendering with redirected output and a real PTY."""
import argparse
import errno
import json
import os
from pathlib import Path
import pty
import re
import select
import signal
import subprocess
import tempfile
import time


def capture_terminal(command):
    pid, master = pty.fork()
    if pid == 0:
        os.environ["TERM"] = "xterm-256color"
        os.execvp(command[0], command)
    data = bytearray()
    deadline = time.monotonic() + 30
    status = None
    reached_eof = False
    try:
        while time.monotonic() < deadline:
            if select.select([master], [], [], 0.2)[0]:
                try:
                    chunk = os.read(master, 65536)
                except OSError as exc:
                    if exc.errno == errno.EIO:
                        reached_eof = True
                        break
                    raise
                if not chunk:
                    reached_eof = True
                    break
                data.extend(chunk)
        else:
            raise AssertionError("Terminal help exceeded 30 seconds")
    finally:
        os.close(master)
        completed, status = os.waitpid(pid, 0 if reached_eof else os.WNOHANG)
        if completed == 0:
            os.kill(pid, signal.SIGKILL)
            _, status = os.waitpid(pid, 0)
    assert os.waitstatus_to_exitcode(status) == 0, data.decode(errors="replace")
    return data.decode(errors="replace")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--jar", type=Path, default=Path(__file__).resolve().parents[2] / "openaf.jar")
    args = parser.parse_args()
    base = ["java", "--enable-native-access=ALL-UNNAMED", "-jar", str(args.jar.resolve())]
    with tempfile.TemporaryDirectory(prefix="odoc-terminal-") as directory:
        source = Path(directory) / "sample.js"
        source.write_text('/**\n * <odoc format="md">\n * <key>marked()</key>\n * **rendered**\n * </odoc>\n */\n'
                          '/**\n * <odoc>\n * <key>legacy()</key>\n * **literal**\n * </odoc>\n */\n')
        setup = 'saveHelp(' + json.dumps(directory) + ', { fixture: ' + json.dumps(str(source)) + ' });'
        subprocess.run(base + ["-c", setup], check=True, capture_output=True, text=True, timeout=30)
        for term, body in [("marked", "rendered"), ("legacy", "literal")]:
            # Seed the real help cache with the fixture, then run the same packaged
            # library selected by the launcher's -helpscript option.
            code = ('setOfflineHelp(true); searchHelp(' + json.dumps(term) + ', ' + json.dumps(directory) + '); '
                    '__args = ["-helpscript", ' + json.dumps(term) + ']; loadCompiledLib("example_js");')
            command = base + ["-c", code]
            redirected = subprocess.run(command, check=True, capture_output=True, text=True, timeout=30).stdout
            assert "**" + body + "**" in redirected, redirected
            assert "\x1b" not in redirected, redirected
            terminal = capture_terminal(command)
            visible = re.sub(r"\x1b\[[0-?]*[ -/]*[@-~]", "", terminal)
            if term == "marked":
                assert body in visible and "**" + body + "**" not in visible, terminal
            else:
                assert "**" + body + "**" in visible, terminal
        print("PASS packaged help: Markdown opt-in, legacy output, redirected output, real PTY")


if __name__ == "__main__":
    main()
