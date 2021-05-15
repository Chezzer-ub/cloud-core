const CloudCore = require('cloud-core-server');
const server = new CloudCore({
  core: {
    jar: 'paper-1.16.4-310.jar', //Server Jar Name
    args: ['-Xmx12G', '-Xms12G'], //Server Ram
    port: 25533, //Minecraft Server Port
    authorization: "b2x3AqYkjT2T6F5G", //HTTP Auth COde
    backups: true, //enable the backup feature (backs up the server every week (Alternatively you can do "server.backup()" after "server.start()" at the bottom to back it up immediately OR do /backup in the console))
    restartTime: 10 //Time in seconds that the server will wait before restarting after a stop or /restart
  },
  remote: {
    port: 35533 //Websocket Port
  }
});

server.start();
