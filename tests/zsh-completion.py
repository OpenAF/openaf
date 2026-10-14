#!/usr/bin/env python3
"""Run with python3 tests/zsh-completion.py; requires zsh and sh."""
import os
from pathlib import Path
import shlex
import subprocess
import tempfile

root = Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='openaf completion ') as directory:
    work = Path(directory)
    helper = work / 'helper.sh'
    helper.write_text('''#!/bin/sh
printf '%s\\0' "$@" > "$COMPLETION_CAPTURE"
printf 'out=json\\tJSON output\\n:2\\n'
''')
    wrapper = work / 'completion.zsh'
    wrapper.write_text((root / 'complete/completion_zsh.hbs').read_text()
                       .replace('{{tool}}', 'oafp')
                       .replace('{{request}}', 'sh ' + shlex.quote(str(helper))))
    capture = work / 'arguments'
    marker = work / 'must-not-exist'
    cases = [
        (['oafp', ''], 2),
        (['oafp', 'in=json', 'path=foo[*]', 'out=js'], 4),
        (['oafp', 'file=a b.json', 'out=js'], 3),
        (['oafp', 'path=foo;bar', 'out=js'], 3),
        (['oafp', 'path=$(touch ' + str(marker) + ')', ''], 3),
        (['oafp', 'path=`touch ' + str(marker) + '`', ''], 3),
        (['oafp', 'in=cs', 'ignored=later'], 2),
    ]
    for words, current in cases:
        script = '''autoload -Uz compinit
compinit -D
source "$WRAPPER"
_describe() { [[ ${#completions} == 1 && $completions[1] == 'out=json:JSON output' ]]; }
_arguments() { return 99; }
words=(''' + ' '.join(map(shlex.quote, words)) + ''')
CURRENT=''' + str(current) + '''
_oafp
'''
        subprocess.run(['zsh', '-f'], input=script, text=True, check=True,
                       env=dict(os.environ, WRAPPER=str(wrapper), COMPLETION_CAPTURE=str(capture)))
        actual = capture.read_bytes().split(b'\0')[:-1]
        assert actual == [w.encode() for w in words[1:current]], (words, actual)
        assert not marker.exists(), 'Completion executed argument text'
print('PASS: 7 zsh argument-preservation cases, including spaces, metacharacters and cursor position')
