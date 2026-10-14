#!/usr/bin/env python3
"""POSIX integration regression: python3 tests/test-terminal-size.py [openaf.jar].
Uses a private PTY and Java source-file launch; never changes the invoking terminal.
"""
import fcntl
import os
from pathlib import Path
import pty
import select
import struct
import subprocess
import sys
import tempfile
import termios
import tty

SOURCE = '''
import jline.Terminal;
class TerminalSizeProbe {
    public static void main(String[] args) throws Exception {
        Terminal t = Terminal.system();
        for (int i = 0; i < 2; i++) {
            int w = Integer.parseInt(args[i * 2]), h = Integer.parseInt(args[i * 2 + 1]);
            if (t.getWidth() != w || t.getHeight() != h)
                throw new AssertionError("Expected " + w + "x" + h + ", got " + t.getWidth() + "x" + t.getHeight());
            System.out.println("READY" + i);
            System.out.flush();
            if (System.in.read() != 'A' + i) throw new AssertionError("stdin was consumed");
        }
    }
}
'''

def run(source, jar, piped_input, redirected_output):
    master, slave = pty.openpty()
    tty.setraw(slave)
    def resize(w, h):
        fcntl.ioctl(slave, termios.TIOCSWINSZ, struct.pack('HHHH', h, w, 0, 0))
    resize(140, 40)
    expected = ['80', '24', '80', '24'] if redirected_output else ['140', '40', '112', '32']
    proc = subprocess.Popen(['java', '--enable-native-access=ALL-UNNAMED', '-cp', jar + os.pathsep + str(Path(jar).parent / 'lib' / '*'),
                             str(source), *expected],
                            stdin=subprocess.PIPE if piped_input else slave,
                            stdout=subprocess.PIPE if redirected_output else slave,
                            stderr=subprocess.PIPE)
    output = proc.stdout.fileno() if redirected_output else master
    transcript = b''
    try:
        for i in range(2):
            marker = ('READY' + str(i)).encode()
            while marker not in transcript:
                if not select.select([output], [], [], 30)[0]:
                    raise AssertionError('Timed out: ' + repr(transcript))
                chunk = os.read(output, 4096)
                if not chunk:
                    raise AssertionError('Early EOF: ' + repr(transcript))
                transcript += chunk
            if i == 0:
                resize(112, 32)
            if piped_input:
                proc.stdin.write(bytes([65 + i]))
                proc.stdin.flush()
            else:
                os.write(master, bytes([65 + i]))
        assert proc.wait(timeout=15) == 0, proc.stderr.read().decode()
    finally:
        if proc.poll() is None:
            proc.kill()
            proc.wait()
        errors = proc.stderr.read().decode()
        os.close(master)
        os.close(slave)
        if errors:
            print(errors, file=sys.stderr)
    print('PASS: piped_input=%s redirected_output=%s (size, resize, stdin preservation)' %
          (piped_input, redirected_output))

if __name__ == '__main__':
    jar = str(Path(sys.argv[1] if len(sys.argv) > 1 else 'openaf.jar').resolve())
    with tempfile.TemporaryDirectory(prefix='openaf-terminal-') as directory:
        source = Path(directory) / 'TerminalSizeProbe.java'
        source.write_text(SOURCE)
        for piped_input, redirected_output in [(False, False), (True, False), (True, True)]:
            run(source, jar, piped_input, redirected_output)
