//*BUILT ON SAPPHIRE FOR SAPPHIRE
const EventsEmitter = require('events');
const { spawn } = require('child_process');
const WebSocketServer = require('websocket').server;
const http = require('http');
const fs = require('fs');

const defaultConfig = {
  core: {
    jar: 'server.jar',
    args: ['-Xmx2G', '-Xms1G'],
    authorization: ""
  },
  remote: {
    port: 35565
  }
};

class SapphireServer extends EventsEmitter {
  constructor(config) {
    super();
    this.config = config || defaultConfig;
    this.modules = [];

    process.on('exit', () => this.stop());
    process.on('close', () => this.stop());
  }

  start() {
    if (this.spawn) this.stop();
    console.log("Starting server, please wait...")

    const args = this.config.core.args.concat('-jar', this.config.core.jar, 'nogui');
    const config = this.config;
    this.spawn = spawn('java', args, this.config.core.spawnOpts);

    this.spawn.stdout.pipe(process.stdout);
    process.stdin.pipe(this.spawn.stdin);

    this.spawn.stdout.on('data', (d) => {
      // Emit console
      d.toString().split('\n').forEach((l) => {
        if (l) this.emit('console', l.trim());
      });
    });

    if (!this.wsServer) { 
      var server = this;
      //define ws server
      var httpServer = http.createServer(function(req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*")
        res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
        res.setHeader("Access-Control-Allow-Headers","*")
        if (req.headers.authorization == "Basic "+config.core.authorization) {
          if (req.method == 'POST') {
            let body = '';

            req.on('data', chunk => {
              body += chunk.toString();
            });
  
            req.on('end', () => {
              try {
                JSON.parse(body);
              } catch (e) {
                  return false;
              }
              body = JSON.parse(body);
              if (body.command) {
                server.send(body.command)
              }
            });
            res.end();
          } else {
            if (fs.existsSync("logs/latest.log")) {
              let last = [];
              const log = fs.readFileSync("logs/latest.log", "utf8");
              const lines = log.split(/\r?\n/);
              lines.forEach((line, i) => {
                const index = lines.length-i;
                if (index >= lines.length-100) {
                  if (lines[index]) {
                    last.push(lines[index]);
                  }
                }
              });
            
              let response = "";
              last.reverse()
              last.forEach((item) => {
                response += `${item}\n`;
              })
              res.write(response)
            }
          }
        } else {
          res.end("Unauthorized");
        }
        res.end();
      }).listen(this.config.remote.port, () => {
        console.log("Server remote running on port " + this.config.remote.port);
      });

      //make it
      this.wsServer = new WebSocketServer({
        httpServer: httpServer,
        autoAcceptConnections: false
      });

      var server = this;

      this.wsServer.on('request', function(req) {
        var connection = req.accept();
        server.on('console', line => {
          connection.sendUTF(line);
        })
        connection.on('message', function(message) {
          server.send(JSON.parse(message.utf8Data).command)
        })
      })
    }

    return this;
  }

  stop() {
    if (this.spawn) {

      this.spawn.kill();
      this.spawn = null;
    }

    return this;
  }

  use(module) {
    if (typeof module !== 'function') throw new Error('A module must be a function');

    if (this.modules.filter(m => m === module).length === 0) {
      this.modules.push(module);
      module.call(this);
    }

    return this;
  }

  send(command) {
    return new Promise((resolve) => {
      if (command == "start" || command == "/start") {
        this.start();
        resolve()
      } else if (command == "restart" || command == "/restart") {
        this.stop();
        setTimeout(() => {
          this.start();
          resolve()
        }, 10000)
      } else {
        this.spawn.stdin.write(`${command}\n`, () => resolve());
      }
    });
  }
}

module.exports = SapphireServer;

