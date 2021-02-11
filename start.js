const SapphireServer = require('./sapphire-server.js');
const server = new SapphireServer({
  core: {
    jar: 'server.jar', //Server Jar Name
    args: ['-Xmx4G', '-Xms2G'], //Server Ram
    authorization: "auth code here", //HTTP Auth COde
    restartTime: 10, //time in seconds that the server will wait to restart
    backups: false //enable the backup feature (backs up the server every week)
  },
  remote: {
    port: 35565 //Websocket Port
  }
});

server.start();
