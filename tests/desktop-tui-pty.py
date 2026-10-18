#!/usr/bin/env python3
"""Bounded POSIX TUI integration checks. JAVA=/path/to/java python3 tests/desktop-tui-pty.py openaf.jar"""
import errno
import fcntl
import os
import pty
import select
import signal
import struct
import subprocess
import sys
import termios
import time

JAR = os.path.abspath(sys.argv[1])
JAVA = os.environ.get("JAVA", "java")


def run(script, exchanges, expected, piped_input=None, resize=False):
    pid, fd = pty.fork()
    if pid == 0:
        if piped_input is not None:
            read_fd, write_fd = os.pipe()
            os.write(write_fd, piped_input)
            os.close(write_fd)
            os.dup2(read_fd, 0)
            os.close(read_fd)
        os.environ["TERM"] = "xterm-256color"
        os.execvp(JAVA, [JAVA, "--enable-native-access=ALL-UNNAMED", "-Dopenaf.cds.training=true", "-jar", JAR, "-c", script])
    before = termios.tcgetattr(fd)
    fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", 18, 90, 0, 0))
    output, pending, status = b"", list(exchanges), None
    deadline = time.monotonic() + 25
    try:
        while time.monotonic() < deadline:
            if select.select([fd], [], [], 0.05)[0]:
                try:
                    output += os.read(fd, 65536)
                except OSError as exc:
                    if exc.errno != errno.EIO:
                        raise
            if pending and pending[0][0].encode() in output:
                _, data = pending.pop(0)
                if resize:
                    fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", 12, 60, 0, 0))
                    os.kill(pid, signal.SIGWINCH)
                os.write(fd, data)
            done, result = os.waitpid(pid, os.WNOHANG)
            if done:
                status = result
                break
        assert status is not None, ("TUI timed out", output[-5000:])
        assert os.waitstatus_to_exitcode(status) == 0, output[-5000:]
        assert not pending, ("Missing interaction", pending, output[-5000:])
        for text in expected:
            assert text.encode() in output, (text, output[-5000:])
        assert b"\x1b[?1049h" in output and b"\x1b[?1049l" in output, "Alternate screen not restored"
        after = termios.tcgetattr(fd)
        mask = termios.ECHO | termios.ICANON | termios.ISIG | termios.IEXTEN
        assert before[3] & mask == after[3] & mask, "Terminal attributes leaked"
        assert b"\x1b]52" not in output, "Application text injected an OSC escape"
    finally:
        if status is None:
            os.kill(pid, signal.SIGKILL)
            os.waitpid(pid, 0)
        os.close(fd)


run('''
ow.loadDesktop({provider:"tui"});
var w=ow.desktop.window({title:"Form",view:{items:[
{id:"name",type:"input",label:"Name",value:""},
{id:"mode",type:"select",label:"Mode",options:["one","two"],value:"one"},
{id:"go",type:"button",label:"Go"}]}});
w.on("message",function(e){if(e.message.type!="action")return;
if(e.message.payload.id=="done"){w.close();return;}
var v=e.message.payload.values;
if(v.name!="Ada"||v.mode!="two")throw new Error("Incorrect terminal values");
w.setView({items:[{id:"status",type:"text",text:"Hello Ada two"},{id:"done",type:"button",label:"Done"}]});});
w.show();ow.desktop.wait(12000);print("AFTER-CLOSE");
''', [("Name:", b"Ada\t\x1b[C\t\r"), ("Hello Ada two", b"\r")], ["Hello Ada two", "AFTER-CLOSE"], resize=True)
print("PASS form controls, view update, resize and clean shutdown")

run('''
ow.loadDesktop({provider:"tui"});
var v={items:[{id:"text",type:"text",text:"Window text"}]};
var a=ow.desktop.window({title:"First",view:v}),b=ow.desktop.window({title:"Second",view:v});
a.show();b.show();ow.desktop.wait(12000);print("UNRELATED-WORK-CONTINUES");
''', [("[2: Second]", b"\x10"), ("[1: First]", b"\x17\x03")], ["UNRELATED-WORK-CONTINUES"])
print("PASS multiple tabs, keyboard closure and Ctrl-C preserves parent work")

run('''
java.lang.System.setProperty("java.awt.headless","true");
ow.loadDesktop({provider:"tui"});
var w=ow.desktop.window({title:"Pipe\u001b]52;c;evil\u0007",view:{items:[{id:"text",type:"text",text:"Pipe-safe terminal"}]}});
w.show();ow.desktop.wait(12000);
var input=new java.io.BufferedReader(new java.io.InputStreamReader(java.lang.System.in));
print("PIPE:"+input.readLine());
''', [("Pipe-safe terminal", b"\x03")], ["PIPE:preserved-input"], piped_input=b"preserved-input\n")
print("PASS redirected stdin remains untouched and terminal escapes are sanitized")

# A detached subprocess must fail availability without touching stdin or hanging.
script = """
ow.loadDesktop({provider:"tui"});
if(ow.desktop.info().state!=="uninitialized")exit(1);
var p=ow.desktop.start(),end=now()+5000;
while(p.state.get()!=p.states.FAILED&&p.state.get()!=p.states.FULFILLED&&now()<end)sleep(10,true);
if(!p.reason||p.reason.code!=="PROVIDER_UNAVAILABLE")exit(2);
ow.desktop.__cleanup();print("NO-TERMINAL-OK");
"""
result = subprocess.run([JAVA, "--enable-native-access=ALL-UNNAMED", "-Dopenaf.cds.training=true", "-jar", JAR, "-c", script],
                        capture_output=True, text=True, timeout=12, start_new_session=True)
assert result.returncode == 0 and "NO-TERMINAL-OK" in result.stdout, (result.stdout, result.stderr)
print("PASS missing controlling terminal fails clearly without hanging")
