const SapphireServer = require('../sapphire-server.js');
const server = new SapphireServer({
  core: {
    jar: 'paper-1.16.4-310.jar', //Server Jar Name
    args: ['-Xmx12G', '-Xms12G'], //Server Ram
    port: 25533, //Minecraft Server Port
    authorization: "b2x3AqYkjT2T6F5G", //HTTP Auth COde
    backups: true //enable the backup feature (backs up the server every week)
  },
  remote: {
    port: 35533 //Websocket Port
  }
});

server.start();
