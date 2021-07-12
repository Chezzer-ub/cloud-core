const Events = require('events');
const { spawn, exec } = require('child_process');
const express = require('express');
const ws = require('ws');
const fs = require('fs');
const usage = require('usage');

class CloudCore extends Events {
  /**
   * Create server instance.
   *
   * @param {array} config Array of options, help on git.
   */
  constructor(config) {
    //load in Events
    super();

    //construct config with default values
    const defaultConfig = {
      core: {
	path: config.core.path || './',
        prefix: config.core.prefix || '',
        jar: config.core.jar || 'server.jar',
        args: config.core.args || ['-Xmx2G', '-Xms1G'],
        authorization: config.core.authorization || "hackme",
        backups: {
          enabled: config.core.backups.enabled || false,
          directory: config.core.backups.directory || "./backup/",
          time: config.core.backups.time || "weekly" //can be "weekly", "monthly"
        },
        port: config.core.port || 25565
      },
      remote: {
        bind: config.remote.bind || "0.0.0.0",
        port: config.remote.port || 35565
      }
    };

    config = defaultConfig;

    this.config = config; //config from construct
    this.wsServer = null; //websocket
    this.httpServer = null; //express
    this.minecraftServer = null; //java spawn command

    process.on('exit', () => {
      this.stop()
      if (this.minecraftServer) this.minecraftServer.kill();
    });
    process.on('close', () => {
      this.stop()
      if (this.minecraftServer) this.minecraftServer.kill();
    });

    this.wsServer = new ws.Server({ noServer: true });
    this.wsServer.on('connection', socket => {
      //receive command from client
      socket.on('message', (message) => {
        try {
          message = JSON.parse(message);
        } catch (e) {
          socket.send(e);
        }

        let usertext = "";
        if (message.user) {
          usertext = message.user+" is ";
        }

        //parse actions
        if (message.action == "command") {
          this.send(message.command, message.user || undefined);
        } else if (message.action == "stop") {
          this.log(`[Cloud Core] ${usertext}Stopping the server...`);
          this.stop(() => {
            this.log(`[Cloud Core] Successfully stopped the server`);
          });
        } else if (message.action == "kill") {
          this.log(`[Cloud Core] ${usertext}Attempting to stop the server...`);
          this.stop(() => {
            this.log(`[Cloud Core] Killing the server...`);
            process.exit();
          })
          setTimeout(() => {
            this.minecraftServer.kill();
            process.exit();
          }, 8000)
        } else if (message.action == "restart") {
          this.log(`[Cloud Core] ${usertext}Restarting the server...`);
          this.stop(() => {
            this.log(`[Cloud Core] Starting the server...`);
            this.start();
          });
        } else if (message.action == "start") {
          this.log(`[Cloud Core] ${usertext}Starting the server...`);
          this.start();
        } else if (message.action == "backup") {
          this.backup();
        } else if (message.action == "ping") {
          socket.send("pong");
        }
      });

      //send console to client
      this.on("console", (line) => {
        if (line.includes("Done (")) {
          this.emit("started");
        }
        socket.send(line);
      })
    });

    let app = express();

    app.use(express.json());

    //define api routes
    app.get("*", (req, res, next) => {
      res.set('Access-Control-Allow-Origin', '*');
      if (req.headers['authorization'] == config.core.authorization) {
        next();
      } else {
        res.type("json");
        res.send(JSON.stringify(
          {
            "error": {
              "code": 502, 
              "reason": "Unauthorized. This usually means you have the wrong authentication code in your header."
            }
          }
        ));
      }
    })

    app.post("*", (req, res) => {
      //post to minecraft
      if (req.body.command) {
        if (req.body.command == "restart") {
          this.log(`[Cloud Core] Restarting the server...`);
          this.stop(() => {
            this.log(`[Cloud Core] Starting the server...`);
            this.start();
          });
        } else if (req.body.command == "backup") {
          this.backup();
        } else if (req.body.command == "start") {
          this.start();
        } else {
          this.send(req.body.command, req.body.user || undefined);
        }
        res.end();
      } else {
        res.end();
      }
    })

    app.get("*/usage", (req, res) => {
      res.type("json");
      let config = this.config;
      if (this.minecraftServer) {
        usage.lookup(this.minecraftServer.pid, function(err, result) {
          if (!err) {
            result.config = config;
            res.end(JSON.stringify(result));
          } else {
            res.end(JSON.stringify({"error": err}));
          }
        });
      } else {
        res.end(JSON.stringify({"error": "Server not started"}));
      }
    })

    app.get("*", (req, res) => {
      const readLastLines = require('read-last-lines');
      readLastLines.read('logs/latest.log', 100)
	      .then((lines) => {
          res.end(lines)
        });
    })

    //listen on server
    this.httpServer = app.listen(config.remote.port, config.remote.bind || "0.0.0.0", () => {
      this.log(`[Cloud Core] Started webserver running on ${config.remote.bind || "0.0.0.0"}:${config.remote.port}`)
    });

    //upgrade websocket requests
    this.httpServer.on('upgrade', (request, socket, head) => {
      this.wsServer.handleUpgrade(request, socket, head, socket => {
        //make sure auth is correct, specified in the protocol location
        if (request.headers['sec-websocket-protocol'] == config.core.authorization) {
          this.wsServer.emit('connection', socket, request);
        } else {
          socket.send("[Cloud Core] Unauthorized. This usually means you have the wrong authentication code in your header.");
          socket.close(1000, "Unauthorized");
        }
      });
    });

    //auto backups
    if (config.core.backups.enabled) {
      this.log(`[Cloud Core] Automatic Server Backups enabled. Backups will be taken ${config.core.backups.time}.`)
      
      setTimeout(() => {
        let d = new Date();
        if (config.core.backups.time == "weekly") {
          if (d.getMinutes() == 1 && d.getHours() == 1 && d.getDay() == 1) {
            this.backup();
          }
        } else if (config.core.backups.time == "monthly") {
          if (d.getMinutes() == 1 && d.getHours() == 1 && d.getDate() == 1) {
            this.backup();
          }
        }
      }, 60000)
    }

    //emit that we are ready to go
    setTimeout(() => {
      this.emit("ready", config);
    }, 500)

    return this;
  }

  log(msg) {
    if (fs.existsSync("logs/latest.log")) {
      fs.appendFileSync("logs/latest.log", `${msg}\n`);
    }
    this.emit('console', msg);
    console.log(msg);
  }

  /**
   * Send command to server
   *
   * @param {String} command Command to send to server
   * @param {String} user Optional. User to assign command to
   */
  send(command, user) {
    //command event
    this.emit("command", command);

    //send to minecraft server
    this.minecraftServer.stdin.write(`${command}\n`);

    //send to websocket
    this.log(`> ${command} ${user ? "(Issued by "+user+")" : ""}`);
  }

  /**
   * Starts Minecraft server
   *
   * @return {ChildProcessWithoutNullStreams} Started Minecraft server child process.
   */
  start() {
    if (!this.minecraftServer) {
      //make args
      let args = this.config.core.args.concat('-jar', this.config.core.jar);
      args = args.concat('--port', this.config.core.port, 'nogui');
      
      //start server
      this.minecraftServer = spawn(this.config.core.prefix+'java', args, {cwd: this.config.core.path});
      
      //minecraft to console
      this.minecraftServer.stdout.pipe(process.stdout);
      
      //console to minecraft
      process.stdin.pipe(this.minecraftServer.stdin);

      process.stderr.on('data', (data) => {
        this.log(`ERROR: ${data}`);
      });
      
      //minecraft to event
      this.minecraftServer.stdout.on('data', (d) => {
        d.toString().split('\n').forEach((l) => {
          if (l) this.emit('console', l.trim());
        });
      });

      this.minecraftServer.on('exit', () => {
        this.minecraftServer.kill();
        this.minecraftServer = null;
      })
      //start event
      this.emit("start");

      if (!fs.existsSync("eula.txt")) {
        fs.writeFileSync("eula.txt", "eula=true");
        this.log("[Cloud Core] Automatically agreed to EULA.");
      }
    } else {
      this.log("[Cloud Core] Server already started!")
    }
    return this.minecraftServer;
  }

  /**
   * Stops server
   *
   * @param {Function} callback Callback when server is stopped
   */
  stop(callback) {
    //stopping event
    this.emit("stopping");
    //stop server
    if (this.minecraftServer) {
      //write stop command
      this.minecraftServer.stdin.write("stop\n");
      this.minecraftServer.on('exit', () => {
        //on exit
        if (this.minecraftServer) {
          this.minecraftServer.kill();
        }
        this.minecraftServer = null;

        if (callback) {
          callback();
        }
        //stop event
        this.emit("stop");
      });
    } else {
      if (callback) {
        callback();
      }
      //stop event
      this.emit("stop");
    }
  }

  /**
   * Backup the whole server.
   */
  backup() {
    if (!fs.existsSync(this.config.core.backups.directory)) {
      fs.mkdirSync(this.config.core.backups.directory);
    }
    let d = new Date();
    let name = d.toString().replace(/ /g, "-").split("-(")[0]+".zip";
    this.log(`[Cloud Core] Starting server backup...`);
    let backup = exec(`zip -r ${this.config.core.backups.directory}${name} * -x backup/*`, {maxBuffer: 1024 * 999999999}, (error, stdout, stderr) => {
      this.log(stdout);
      if (stderr) {
        this.log(`[Cloud Core] Backup Error: ${stderr}`);
      }
      if (error) {
        this.log(`[Cloud Core] Backup Error: ${error.code}`);
        console.log(error.stack);
      }
    });
    
    backup.on('exit', () => {
      this.emit("backup", `${this.config.core.backups.directory}${name}`);
      this.log(`[Cloud Core] Made backup (${this.config.core.backups.directory}${name})`);
    });
  }
}

module.exports = CloudCore;
