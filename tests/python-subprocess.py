#!/usr/bin/env python3
"""Packaged CLI, launcher, inverse bridge and oJob regressions. Requires Python 3."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

jar = Path(sys.argv[1]).resolve()
java = shutil.which('java')
env = dict(os.environ, OAF_PYTHON=sys.executable)

def run(args, *, cwd=None, code=0, environment=None):
    result = subprocess.run(args, cwd=cwd, env=environment or env, text=True,
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=75)
    assert result.returncode == code, (args, result.returncode, result.stdout, result.stderr)
    return result

def oaf(*args, **kwargs):
    return run([java, '-jar', str(jar), *args], **kwargs)

with tempfile.TemporaryDirectory(prefix='openaf python ') as tmp:
    root = Path(tmp)
    script = root / 'script name.py'
    script.write_text("from __future__ import print_function\nimport sys, json\nprint(json.dumps(sys.argv))\nsys.exit(7)\n")
    argv = ['space arg', '', '--help', '-e', '--version', 'a=b;c', "quote'\\雪😀"]
    result = oaf('--py', str(script), *argv, code=7)
    assert json.loads(result.stdout) == [str(script), *argv], result.stdout
    legacy = dict(env, OAF_PY_ARGC='2', OAF_PY_ARG_0='legacy space', OAF_PY_ARG_1='')
    assert json.loads(oaf('--py', '-e', str(script), code=7, environment=legacy).stdout) == [str(script), 'legacy space', '']
    assert json.loads(oaf('--py', str(script), code=7, environment=legacy).stdout) == [str(script)]
    stdin_script = root / 'stdin.py'
    stdin_script.write_text("import sys\nassert sys.stdin.read() == 'stream input\\n'\nsys.stdout.write('unterminated')\n")
    streamed = subprocess.run([java, '-jar', str(jar), '--py', str(stdin_script)], env=env,
                              input='stream input\n', capture_output=True, text=True, timeout=20)
    assert streamed.returncode == 0 and streamed.stdout == 'unterminated', streamed
    print('PASS direct CLI, legacy argv and exit status')
    shortcuts = oaf('-c', "ow.loadPython(); ow.python.reset(false,true); $pyStart(); try { "
                    "$py('x = 42', {}, [], true); $py('y = x + 1', {}, ['y'], true); "
                    "if(ow.python.cServer.get()!=1) throw 'implicit reference leak'; "
                    "var r=$py(\"isolated = 'x' not in globals()\", {}, ['isolated'], true, true); "
                    "if(!r.isolated) throw 'fork ignored'; var caught=false; "
                    "try { $py(\"raise ValueError('forwarded')\", {}, [], true); } catch(e) { caught=String(e).indexOf('forwarded')>=0; } "
                    "if(!caught) throw 'exception flag ignored'; print('SHORTCUT_OK'); } finally { $pyStop(); }")
    assert 'SHORTCUT_OK' in shortcuts.stdout, (shortcuts.stdout, shortcuts.stderr)
    print('PASS shortcut exception/fork flags and implicit reference count')

    # Extract only the launcher functions from the packaged source; no install or oPack writes.
    launchers = root / 'launchers.js'
    launchers.write_text('''var source = io.readFileString(getOpenAFJar() + "::js/genScripts.js");
var shLocation = "/bin/sh", javaHome = String(java.lang.System.getProperty("java.home"));
var classPath = getOpenAFJar(), javaargs = "";
function extract(name) {
  var start = source.indexOf("function " + name + "(");
  var end = source.indexOf("\\nfunction ", start + 1);
  af.eval(source.substring(start, end < 0 ? source.length : end));
}
extract("genUnixSttyRestore"); extract("generateUnixPyScript");
io.writeFileString(''' + json.dumps(str(root / 'pyoaf')) + ''', generateUnixPyScript());
''')
    oaf('-f', str(launchers))
    if os.name != 'nt':
        result = run(['/bin/sh', str(root / 'pyoaf'), str(script), *argv], code=7)
        assert json.loads(result.stdout) == [str(script), *argv], result.stdout
        interpreter = root / 'python executable'
        interpreter.symlink_to(sys.executable)
        configured = dict(env, OAF_PYTHON=str(interpreter))
        result = oaf('--py', str(script), *argv, code=7, environment=configured)
        assert json.loads(result.stdout) == [str(script), *argv], result.stdout
        print('PASS generated Unix pyoaf launcher and interpreter paths with spaces')
    else:
        print('SKIP Unix launcher on Windows')

    # oaf.py uses the installed oaf path. Generate against a temporary launcher without changing installation.
    shim = root / 'oaf'
    if os.name != 'nt':
        import shlex
        shim.write_text('#!/bin/sh\nexec ' + shlex.join([java, '-jar', str(jar)]) + ' "$@"\n')
        shim.chmod(0o755)
        generator = "var code = io.readFileString(getOpenAFJar() + '::js/oafpy.js'); code = code.replace(" + json.dumps('getOpenAFPath()') + ", " + json.dumps(json.dumps(str(root) + os.sep)) + "); af.eval(code);"
        module = oaf('-c', generator).stdout
        (root / 'oaf.py').write_text(module)
        probe = root / 'inverse.py'
        probe.write_text("from oaf import _s, _g, _oaf\n_s(\"quote'\\\\雪\", {'x': 'line\\n😀'})\nassert _g(\"quote'\\\\雪\") == {'x':'line\\n😀'}\nassert _oaf('21*2') == 42\nprint('INVERSE_OK')\n")
        pid_file = root / 'child.pid'
        with probe.open('a') as output:
            output.write("with open(" + repr(str(pid_file)) + ", 'w') as handle:\n    handle.write(str(_oaf('Number(java.lang.ProcessHandle.current().pid())')))\n")
        assert 'INVERSE_OK' in run([sys.executable, str(probe)]).stdout
        try:
            os.kill(int(pid_file.read_text()), 0)
        except ProcessLookupError:
            pass
        else:
            raise AssertionError('generated oaf.py left its child running')
        shim.write_text('#!/bin/sh\nexit 9\n')
        failed = subprocess.run([sys.executable, str(probe)], env=env, capture_output=True, text=True, timeout=20)
        assert failed.returncode != 0 and 'OpenAF startup failed' in failed.stderr, failed.stderr
        print('PASS generated oaf.py callbacks and initialization failure')

    for file_job in [False, True]:
        for fail in [False, True]:
            outcome = root / 'outcome.json'
            if outcome.exists(): outcome.unlink()
            pycode = "args['value'] = 42\n" + ("raise ValueError('ojob-python-failure')\n" if fail else '')
            pyscript = root / 'job code.py'
            pyscript.write_text(pycode)
            job = {'name':'Python', 'typeArgs':{'noTemplate': True},
                   'catch': 'io.writeFileString(' + json.dumps(str(outcome)) + ', stringify({error:String(exception)}));'}
            if file_job: job['typeArgs']['execPy'] = str(pyscript)
            else: job.update(lang='python', exec=pycode)
            job['to'] = ['Verify']
            definition = {'ojob':{'sequential':True,'logToConsole':False}, 'jobs':[job, {
                'name':'Verify','exec':'io.writeFileString(' + json.dumps(str(outcome)) + ', stringify({value:args.value}));'
            }], 'todo':['Python']}
            workflow = root / 'job.json'
            workflow.write_text(json.dumps(definition))
            result = oaf('-c', 'oJob(' + json.dumps(str(workflow)) + ');')
            assert outcome.exists(), (result.stdout, result.stderr)
            received = json.loads(outcome.read_text())
            if fail: assert 'ojob-python-failure' in received.get('error',''), received
            else: assert received == {'value':42}, received
    print('PASS lang: python and execPy data exchange and exceptions')

print('SKIP Python 2 (not exercised by this Python 3 driver)')
print('SKIP Windows launcher' if os.name != 'nt' else 'Windows launcher requires native launcher checks')
