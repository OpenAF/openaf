#!/usr/bin/env python3
"""POSIX PTY checks against a built JAR: python3 tests/console-pty.py /path/openaf.jar."""
import errno
import fcntl
import os
import pty
import select
import signal
import struct
import sys
import tempfile
import termios
import time
import zipfile

jar = os.path.abspath(sys.argv[1])
nested = "--nested" in sys.argv[2:]
if nested:
    # Normal OpenAF startup automatically repacks. Bypass only that bootstrap
    # in a disposable copy to test the nested dependency class loader itself.
    nested_dir = tempfile.TemporaryDirectory(prefix="openaf-nested-console-")
    nested_jar = os.path.join(nested_dir.name, "openaf.jar")
    with zipfile.ZipFile(jar) as src, zipfile.ZipFile(nested_jar, "w", zipfile.ZIP_DEFLATED) as dest:
        for entry in src.infolist():
            data = src.read(entry.filename)
            if entry.filename == "META-INF/MANIFEST.MF":
                data = data.replace(b"Rsrc-Main-Class: openaf.Launcher", b"Rsrc-Main-Class: openaf.AFCmdOS")
            dest.writestr(entry, data)
    jar = nested_jar


def run(script, exchanges, expected, exitcode=0):
    with tempfile.TemporaryDirectory(prefix="openaf-console-pty-") as home:
        pid, fd = pty.fork()
        if pid == 0:
            os.environ["TERM"] = "xterm-256color"
            os.execvp("java", ["java", "--enable-native-access=ALL-UNNAMED", "-Duser.home=" + home,
                              "-jar", jar] + (["--console"] if script is None else ["-c", script]))
        before = termios.tcgetattr(fd)
        fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", 32, 101, 0, 0))
        output = b""
        pending = list(exchanges)
        deadline = time.monotonic() + 25
        status = None
        try:
            while time.monotonic() < deadline:
                if select.select([fd], [], [], 0.05)[0]:
                    try:
                        chunk = os.read(fd, 65536)
                        output += chunk
                    except OSError as e:
                        if e.errno != errno.EIO:
                            raise
                        chunk = b""
                if pending and pending[0][0].encode() in output:
                    _, data = pending.pop(0)
                    os.write(fd, data)
                done, status = os.waitpid(pid, os.WNOHANG)
                if done:
                    break
                status = None
            if status is None:
                done, status = os.waitpid(pid, os.WNOHANG)
                if not done:
                    raise AssertionError("PTY timeout: " + repr(output))
            assert os.waitstatus_to_exitcode(status) == exitcode, repr(output)
            for text in expected:
                assert text.encode() in output, (text, output)
            after = termios.tcgetattr(fd)
            mask = termios.ECHO | termios.ICANON
            assert before[3] & mask == after[3] & mask, "Terminal echo/canonical mode leaked"
        finally:
            if status is None:
                os.kill(pid, signal.SIGKILL)
                os.waitpid(pid, 0)
            os.close(fd)


# The public plugin helper resolves the opack registry using the repacked JAR
# path. Direct registration isolates the nested terminal/backend test from it.
base = ('af.plugin("openaf.plugins.Console");' if nested else 'plugin("Console");') + 'var c=new Console();' 
run(base + 'var r=c.getConsoleReader();r.setExpandEvents(false);r.getCompletionHandler().setPrintSpaceAfterFullCompletion(false);'
    'r.addCompleter(new Packages.openaf.jline.OpenAFConsoleCompleter(function(b,p,a){a.add("name");return 4;}));'
    'print("TYPE="+r.getTerminal().unwrap().getClass().getName());'
    'print("WIDTH="+r.getTerminal().getWidth());print("RESULT="+c.readLinePrompt("READY> "));',
    [("READY> ", b"obj.naTAIL\x1b[D\x1b[D\x1b[D\x1b[D\t\n")],
    ["JniUnixSysTerminal", "WIDTH=101", "RESULT=obj.nameTAIL"])
run(base + 'print("SECRET="+c.readLinePrompt("MASK> ","*"));print("HISTORY="+c.getConsoleReader().getHistory().size());',
    [("MASK> ", b"secret\n")], ["SECRET=secret", "HISTORY=0"])
run(base + 'print("POLL="+c.readCharNB());print("RAW_READY");print("RAW="+c.readCharB());print("LINE="+c.readLinePrompt("LINE> "));',
    [("RAW_READY", b"x"), ("LINE> ", b"hello\n")], ["POLL=-2", "RAW=120", "LINE=hello"])
run(base + 'print("EOF="+c.readLinePrompt("EOF> "));', [("EOF> ", b"\x04")], ["EOF=null"])
run(base + 'c.readLinePrompt("INT> ");', [("INT> ", b"\x03")], [], exitcode=130)
if not nested:
    run(None, [("> ", b'print("CONSOLE_RESULT="+io.fileExi\t("__missing_console_test_file__")); exit(0);\n')], ["CONSOLE_RESULT=false"])
if nested:
    nested_dir.cleanup()
print("PTY tests passed: JNI, dimensions, Tab, masking, raw/line input, EOF, Ctrl-C, terminal restoration")
