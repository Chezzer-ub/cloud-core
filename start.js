const SapphireServer = require('../sapphire-server.js');
const server = new SapphireServer({
  core: {
    jar: 'spigot-1.16.3.jar', //Server Jar Name
    args: ['-Xmx4G', '-Xms2G'], //Server Ram
  },
  remote: {
    port: 35565 //Websocket Port
  }
});

server.start();
