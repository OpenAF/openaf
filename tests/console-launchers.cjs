// Generate launcher text without installing scripts or changing terminal settings.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const cp = require('node:child_process');
const source = fs.readFileSync('js/genScripts.js', 'utf8').split('// MAIN')[0];
for (const windows of [false, true]) {
  const env = {
    ow: { loadFormat() {}, format: { isWindows: () => windows } },
    io: { writeFileString() {}, getDefaultEncoding: () => 'UTF-8' },
    getOpenAFPath: () => '/tmp/', __args: [], __expr: '',
    isUnDef: v => v === undefined, isDef: v => v !== undefined,
    isArray: Array.isArray, log() {}, logWarn() {}, logErr() {}
  };
  vm.createContext(env);
  vm.runInContext(source, env);
  vm.runInContext("javaargs = '--enable-native-access=ALL-UNNAMED'; javaHome = 'JAVA'; classPath = 'openaf.jar'; shLocation = '/bin/sh';", env);
  const win = vm.runInContext('generateWinConsoleBat()', env);
  assert(win.includes('%OAF_JARGS%'));
  assert(win.includes('chcp 65001'));
  assert(win.includes('file.encoding=UTF-8'));
  assert(win.includes('--enable-native-access=ALL-UNNAMED'));
  for (const expression of ['generateUnixScript("--console", false, [], true)', 'generateUnixPyScript()']) {
    const shell = vm.runInContext(expression, env);
    assert(shell.includes('$OAF_JARGS'));
    assert(shell.includes('stty -g'));
    assert(shell.includes("trap '__oaf_stty_restore' 0"));
    assert(!shell.includes('jline.UnixTerminal'));
    assert.equal(cp.spawnSync('/bin/sh', ['-n'], { input: shell }).status, 0);
  }
}
// Exercise the Cygwin path conversion branch as well as the shared shell text.
const cygwin = {
  ow: { loadFormat() {}, format: { isWindows: () => true } },
  io: { writeFileString() {}, getDefaultEncoding: () => 'UTF-8' },
  getOpenAFPath: () => '/tmp/', __args: [], __expr: '',
  isUnDef: v => v === undefined, isDef: v => v !== undefined,
  isArray: Array.isArray, log() {}, logWarn() {}, logErr() {}
};
vm.createContext(cygwin);
vm.runInContext(source, cygwin);
vm.runInContext('windows=1; javaHome="C:/Java"; classPath="openaf.jar";', cygwin);
const cygwinScript = vm.runInContext('generateUnixScript("--console")', cygwin);
assert(cygwinScript.includes('/cygdrive/c/java'));
assert(!cygwinScript.includes('jline.UnixTerminal'));
assert(!source.includes('jline.shutdownhook'));
console.log('Launcher generation passed: Windows, Unix/Cygwin templates, UTF-8, native access, restoration, shell syntax');
