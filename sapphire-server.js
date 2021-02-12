//*BUILT ON SAPPHIRE FOR SAPPHIRE
const EventsEmitter = require('events');
const { spawn } = require('child_process');
const WebSocketServer = require('websocket').server;
const http = require('http');
const fs = require('fs');
let serverConfig = {};

const defaultConfig = {
  core: {
    jar: 'server.jar',
    args: ['-Xmx2G', '-Xms1G'],
    authorization: "",
    backups: false,
    serverPort: 25565
  },
  remote: {
    port: 35565
  }
};

class SapphireServer extends EventsEmitter {
  constructor(config) {
    super();
    this.config = config || defaultConfig;
    serverConfig = config;
    this.modules = [];

    process.on('exit', () => this.stop());
    process.on('close', () => this.stop());

    if (this.config.core.backups) {
      setTimeout(() => {
        let d = new Date();
        if (d.getDay() == 0 && d.getHours() == 0 && d.getSeconds() < 59 && d.getMinutes() == 0) {
          spawn(`zip -r backup/${d.toString().replace(/ /g, "-")}.zip *`);
        }
      }, 60000)
    }
  }

  start() {
    if (this.spawn) this.stop();
    console.log("Starting server, please wait...")

    let args = this.config.core.args.concat('-jar', this.config.core.jar);
    args = args.concat('--port', this.config.core.port, '--nogui')
    const config = this.config;
console.log(args)
    this.spawn = spawn('java', args);

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
              if (body) {
                let command = decodeURIComponent(body);
                command = command.replace(/\+/g," ");
                command = command.split("command=")[1];
                setTimeout(() => {
                  server.send(command)
                }, 200)
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
          let body = JSON.parse(message.utf8Data);
          if (body.authorization == config.core.authorization) {
            server.send(body.command)
          } else {
            connection.sendUTF("Unauthorized");
          }
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
      } else if (command == "dkill") {
        this.stop();
        setTimeout(function () {
          process.on("exit", function () {
              require("child_process").spawn(process.argv.shift(), process.argv, {
                  cwd: process.cwd(),
                  detached : true,
                  stdio: "inherit"
              });
          });
          process.exit();
        }, 10000);
      } else {
        this.spawn.stdin.write(`${command}\n`, () => resolve());
      }
    });
  }
}

module.exports = SapphireServer;

