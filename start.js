const SapphireServer = require('../sapphire-server.js');
const server = new SapphireServer({
  core: {
    jar: 'spigot-1.16.3.jar',
    args: ['-Xmx4G', '-Xms2G'],
  },
  remote: {
    port: 35561
  }
});

server.start();
