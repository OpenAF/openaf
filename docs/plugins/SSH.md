# SSH Java Plugin Reference

The `SSH` plugin provides SSH2 and SFTP/SCP client capabilities based on JSch for remote command execution, interactive PTY shell sessions, SSH TCP port forwarding, and file transfers.

---

## Loading Syntax

```javascript
plugin("SSH");
var ssh = new SSH(host, port, login, pass, identityFile, withCompression, timeout, noStrictHostKeyChecking);
// Or URI-style constructor:
var ssh = new SSH("ssh://user:pass@host:22/path/to/id_rsa?timeout=5000&compression=true");
```

---

## API Methods

| Category | Method | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Command Execution** | `exec(cmd, in, outputAlso, pty, returnMap, cb)` | `String, String, bool, bool, bool, Func` | `String \| Map` | Executes remote command. If `returnMap = true`, returns `{ stdout, stderr, exitcode }`. |
| | `execSudo(cmd, user, in, outputAlso, pty, returnMap, cb)` | `String, Object, String, bool, bool, bool, Func` | `String \| Map` | Executes remote command via `sudo -i -u <user>`. |
| **TCP Tunnels** | `tunnelLocal(localPort, remoteHost, remotePort)` | `int, String, int` | `void` | Configures local port forwarding (`-L`). |
| | `tunnelLocalBind(localIf, localPort, rHost, rPort)` | `String, int, String, int` | `void` | Local port forwarding bound to specific interface. |
| | `delTunnelLocal(localIf, localPort)` | `String, int` | `void` | Closes local port tunnel. |
| | `tunnelRemote(remotePort, localHost, localPort)` | `int, String, int` | `void` | Configures remote port forwarding (`-R`). |
| | `tunnelRemoteBind(remoteIf, rPort, lHost, lPort)` | `String, int, String, int` | `void` | Remote port forwarding bound to interface. |
| | `delTunnelRemote(remoteIf, remotePort)` | `String, int` | `void` | Closes remote port tunnel. |
| **SFTP & Files** | `cd(path)` / `pwd()` / `mkdir(path)` / `rmdir(path)` / `rm(path)` / `rename(old, new)` | *varies* | *varies* | Remote filesystem navigation and manipulation. |
| | `listFiles(path)` | `[String]` | `Object` | Lists directory `{ files: [ { filename, filepath, size, permissions, isDir }, ... ] }`. |
| | `df(path)` | `String` | `Map` | Remote disk usage `{ size, used, available, capacityPerc }`. |
| | `get(remote, local, monitor)` / `getBytes(remote, monitor)` | `String, String, Object` | `String \| byte[]` | Downloads file via SFTP. |
| | `put(source, remote, monitor)` / `putBytes(remote, bytes, monitor)` | `String, String, Object` | `void` | Uploads file via SFTP. |
| **SCP & Session** | `sendFile(source, remote)` / `getFile(remote, local)` | `String, String` | `void \| byte[]` | Transfers files via SCP protocol. |
| | `close()` / `setTimeout(ms)` / `isConnected()` / `sendKeepAlive()` | *varies* | *varies* | Connection lifecycle management. |

---

## Practical Code Example

```javascript
plugin("SSH");
var ssh = new SSH("server.example.com", 22, "deploy", "secretPass", void 0, true, 10000, true);

// Execute command and retrieve structured output
var res = ssh.exec("uname -a && uptime", void 0, false, false, true);
print("Stdout: " + res.stdout);
print("Exit:   " + res.exitcode);

// SFTP operations
ssh.cd("/var/log");
var df = ssh.df("/var/log");
print("Disk Available: " + df.available + " / " + df.size);

ssh.put("/local/patch.tar.gz", "/tmp/patch.tar.gz");
ssh.close();
```
