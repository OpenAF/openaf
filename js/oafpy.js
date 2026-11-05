// Generates a Python 2/3 compatible oaf.py module.
ow.loadFormat();
var openafExec = getOpenAFPath() + (ow.format.isWindows() ? "oaf.bat" : "oaf");
var command = [openafExec, "-c", "ow.loadPython().startServer(__,__,__,true);print(ow.python.initCode(false,true)+'\\n----');while(ow.python.running) sleep(1000,true);"];
var encoded = String(java.util.Base64.getEncoder().encodeToString(af.fromString2Bytes(stringify(command, __, ""), "UTF-8")));
print(`# Store as oaf.py, then: from oaf import _, _d, _oaf, _g, _s
import subprocess, atexit, threading, json, base64, os, signal, sys, time
try:
    import queue
except ImportError:
    import Queue as queue

options = {}
if os.name != 'nt':
    if sys.version_info >= (3, 2):
        options['start_new_session'] = True
    else:
        options['preexec_fn'] = os.setsid
proc = subprocess.Popen(json.loads(base64.b64decode('${encoded}').decode('utf-8')),
                        stdout=subprocess.PIPE, stderr=subprocess.PIPE, **options)
threads = []
closed = False
def wait_for_exit(child, seconds):
    deadline = time.time() + seconds
    while child.poll() is None and time.time() < deadline:
        time.sleep(0.05)
    return child.poll() is not None

def on_exit():
    global closed
    if closed:
        return
    closed = True
    if os.name != 'nt':
        # The launcher is a shell; Java and its pipe handles belong to the group.
        try:
            os.killpg(proc.pid, signal.SIGTERM)
        except OSError:
            pass
        wait_for_exit(proc, 2.0)
        # The shell may exit before Java, so clean up the group even if it exited.
        try:
            os.killpg(proc.pid, signal.SIGKILL)
        except OSError:
            pass
    elif proc.poll() is None:
        killer = subprocess.Popen(['taskkill', '/PID', str(proc.pid), '/T', '/F'],
                                  stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if not wait_for_exit(killer, 2.0):
            killer.kill()
        if not wait_for_exit(proc, 2.0):
            proc.kill()
    wait_for_exit(proc, 2.0)
    for thread in threads:
        thread.join(2.0)
    # Closing a pipe being read by another thread can block on its internal lock.
    for thread, stream in zip(threads, (proc.stdout, proc.stderr)):
        if not thread.is_alive():
            stream.close()

atexit.register(on_exit)
lines = queue.Queue()
errors = []
def read_stdout():
    for line in iter(proc.stdout.readline, b''):
        lines.put(line)
    lines.put(None)
def read_stderr():
    for line in iter(proc.stderr.readline, b''):
        errors.append(line)
for reader in (read_stdout, read_stderr):
    thread = threading.Thread(target=reader)
    thread.daemon = True
    threads.append(thread)
    thread.start()
try:
    import time
    deadline = time.time() + 15
    code = []
    while True:
        remaining = deadline - time.time()
        if remaining <= 0:
            raise RuntimeError('OpenAF startup timed out')
        line = lines.get(timeout=remaining)
        if line is None:
            raise RuntimeError('OpenAF startup failed: ' + b''.join(errors).decode('utf-8', 'replace'))
        if line.strip() == b'----':
            break
        code.append(line)
    eval(compile(b''.join(code), '<oaf-init>', 'exec'), globals(), globals())
except BaseException:
    on_exit()
    raise
`);
