import socketserver

class oafHandler(socketserver.BaseRequestHandler):
    def handle(self):
        _('print("ready for more!")')
        self.data = self.request.recv(1024).strip()
        _('print("' + str(self.data) + '")')
        self.request.sendall(self.data)
    
server = socketserver.TCPServer(('127.0.0.1', 17879), oafHandler)
_('print("READY!")')
server.serve_forever()