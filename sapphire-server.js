//*BUILT ON SAPPHIRE FOR SAPPHIRE
const EventsEmitter = require('events');
const { spawn, exec } = require('child_process');
const WebSocketServer = require('websocket').server;
const http = require('http');
const fs = require('fs');
const axios = require('axios');
let serverConfig = {};
var messageHandler = new EventsEmitter();

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
        if (d.getDay() == 0 && d.getHours() == 0 && d.getSeconds() <= 59 && d.getMinutes() == 0) {
          this.backup()
        }
      }, 60000)
    }
    this.backup();
    axios.get('http://api.github.com/repos/Sapphire-Connect/sapphire-server/commits')
      .then(function (response) {
        let data = response.data;
        if (!fs.existsSync("sapphire-server.json")) {
            fs.writeFileSync("sapphire-server.json", `
              {
                "version": "${data[0].sha}"
              }
            `)
        } else {
          let version = "";
          try {
            version = JSON.parse(fs.readFileSync("sapphire-server.json"))['version'];
          } catch (e) {
            console.log(e);
          }
          if (data[0].sha !== version) {
            setTimeout(() => {
              messageHandler.emit('message', `A new version of Sapphire Server is out! Please follow the update instructions on the README. https://github.com/Sapphire-Connect/sapphire-server. /tWARN`)
              console.log("A new version of Sapphire Server is out! Please follow the update instructions on the README. https://github.com/Sapphire-Connect/sapphire-server")
            }, 10000)
          }
        }
      })
      .catch(function (error) {
        console.log(error);
      })
  }

  backup() {
    let d = new Date();
    let name = d.toString().replace(/ /g, "-").split("-(")[0]+".zip"
    let backup = exec(`zip -r ${name} *`, {maxBuffer: 1024 * 999999999}, (error, stdout, stderr) => {
    //let backup = exec(`cd..;sleep 10;ls`, (error, stdout, stderr) => {
      if (error) {
        console.log(error.stack);
        console.log('Error code: '+error.code);
        console.log('Signal received: '+error.signal);
      }
    });
    
    backup.on('exit', function (code) {
      setTimeout(() => {
        exec(`mv ${name} backup/${name}`, {maxBuffer: 1024 * 999999999})
      }, 2000)
      fs.appendFileSync("logs/latest.log", `Made backup (${name})`)
      messageHandler.emit('message', `Made backup of whole server (${name}). /tINFO`)
    });
  }

  start() {
    if (this.spawn) this.stop();
    messageHandler.emit('message', `Starting Server. /tINFO`)
    console.log("Starting server, please wait...")

    let args = this.config.core.args.concat('-jar', this.config.core.jar);
    args = args.concat('--port', this.config.core.port, 'nogui')
    const config = this.config;

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

        messageHandler.on('message', msg => {
          let data = msg.split("/t");
          let type;
          if (!data[1]) {
            type = "INFO"
          } else {
            type = data[1];
          }

          msg = data[0];

          let d = new Date();
          let hours = d.getHours();
          let mins  = d.getMinutes();
          let secs  = d.getSeconds();
          if (hours < 10) {
            hours = "0"+hours;
          }
          if (mins < 10) {
            mins = "0"+mins;
          }
          if (secs < 10) {
            secs = "0"+secs;
          }
          connection.sendUTF(`[${hours}:${mins}:${secs} ${type}]: [Sapphire Server] ${msg.replace("{REMOTE_IP}", connection.remoteAddress)}`);
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
    messageHandler.emit('message', `Stopping Server. /tINFO`)
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
        messageHandler.emit('message', `Received start command from {REMOTE_IP}. /tINFO`)
        this.start();
        resolve()
      } else if (command == "restart" || command == "/restart") {
        messageHandler.emit('message', `Received stop command from {REMOTE_IP}. /tINFO`)
        this.stop();
        setTimeout(() => {
          this.start();
          resolve()
        }, 10000)
      } else if (command == "dkill") {
        messageHandler.emit('message', `Received daemon kill command from {REMOTE_IP}. /tINFO`)
        this.stop();
        setTimeout(function () {
          resolve()
          process.exit();
        }, 10000);
      } else {
        messageHandler.emit('message', `Received "${command}" from {REMOTE_IP}. /tINFO`)
        this.spawn.stdin.write(`${command}\n`, () => resolve());
      }
    });
  }
}

module.exports = SapphireServer;

