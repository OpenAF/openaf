// Generates the contents of oaf.py

// Check if the openaf executable is in the PATH
var openafExec = ""
if (isDef(getEnv("PATH")) && getEnv("PATH").indexOf(getOpenAFPath()) >= 0) {
    openafExec = "oaf"
} else {
    openafExec = getOpenAFPath() + "oaf"
}

// The Python code for oaf.py
var oafpy = `# oaf.py
# Store this as oaf.py in the same directory as the script or as oaf/__init__.py in a package directory
# ---
# import oaf
# from oaf import _, _d, _oaf, _g, _s
# ---

import subprocess
import atexit

# Start the openaf process in the background
proc = subprocess.Popen(
   ["${openafExec}", "-c", "ow.loadPython().startServer(__,__,__,true);print(ow.python.initCode()+'\\\\n----')"],
   stdout=subprocess.PIPE,
   stderr=subprocess.STDOUT,
   text=True
)

# Read stdout up to the line containing '----'
code_lines = []
for line in proc.stdout:
   if '----' in line:
      break
   code_lines.append(line)

# Execute the captured code
code = ''.join(code_lines)
exec(code)

# Register a function to be called when the script exits
def on_exit():
   # Terminate the background process
   proc.terminate()
   proc.wait()

atexit.register(on_exit)
`

print(oafpy)