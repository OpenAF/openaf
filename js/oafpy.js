// Generates a Python 2/3 compatible oaf.py module.
ow.loadFormat();
var openafExec = getOpenAFPath() + (ow.format.isWindows() ? "oaf.bat" : "oaf");
var command = [openafExec, "-c", "ow.loadPython().startServer(__,__,__,true);print(ow.python.initCode()+'\\n----');while(ow.python.running) sleep(1000,true);"];
var encoded = String(java.util.Base64.getEncoder().encodeToString(af.fromString2Bytes(stringify(command, __, ""), "UTF-8")));
print(`# Store as oaf.py, then: from oaf import _, _d, _oaf, _g, _s
import subprocess, atexit, threading, json, base64
try:
    import queue
except ImportError:
    import Queue as queue

proc = subprocess.Popen(json.loads(base64.b64decode('${encoded}').decode('utf-8')),
                        stdout=subprocess.PIPE, stderr=subprocess.PIPE)
threads = []
def on_exit():
    if proc.poll() is None:
        proc.terminate()
        timer = threading.Timer(2.0, proc.kill)
        timer.daemon = True
        timer.start()
        try:
            proc.wait()
        finally:
            timer.cancel()
    for thread in threads:
        thread.join(2.0)
    proc.stdout.close()
    proc.stderr.close()

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
