import json
import sys
import os

if sys.version_info[0] == 2:
  from StringIO import StringIO
  import SocketServer
  __h = SocketServer.BaseRequestHandler
else:
  from io import StringIO
  import socketserver
  __h = socketserver.BaseRequestHandler

class oafHandler(__h):
  def handle(self):
      res = ''
      self.request.settimeout(1500)
      while True:
          res += self.request.recv(1024).decode('utf-8')
          if str(res).endswith('}\n') or str(res) == '':
              break
      
      try:
          mm = json.loads(res)
      except:
          mm = {}
      try:
        if 'exit' in mm.keys() and mm['t'] == '123':
            os._exit(os.EX_OK)
        if 'e' in mm.keys() and mm['t'] == '123':
            myStdOut = StringIO()
            myStdErr = StringIO()
            sys.stdout = myStdOut
            sys.stderr = myStdErr
            try:
                exec(mm['e'])
                mm['stdout'] = myStdOut.getvalue()
                mm['stderr'] = myStdErr.getvalue()
            except:
                mm['stderr'] = str(sys.exc_info())
      except:
        str(sys.exc_info())

      del mm['e']
      del mm['t']
      self.request.sendall(json.dumps(mm).encode('utf-8'))

if sys.version_info[0] == 2:
  server = SocketServer.ThreadingTCPServer(('127.0.0.1', 12345), oafHandler)
else:
  server = socketserver.ThreadingTCPServer(('127.0.0.1', 12345), oafHandler)
server.serve_forever()
