const CloudCore = require('cloud-core-server');
const server = new CloudCore({
  core: {
    /*
    Server Jar Name, make sure to include 
    .jar at the end.                          */
    jar: 'paper-1.16.4-310.jar', 

    /*
    Server Ram, the Xms is the advised amount 
    of ram the server can use, the Xmx is the
    maximum amount of ram the server can use.   */
    args: ['-Xms12G', '-Xmx12G'],

    /*
    Server Port, you do not have to open 
    this in your firewall if you are running 
    under a local proxy.                   */
    port: 25533,

    /*
    This is the code that is used to connect
    to the server from HTTP or WS. Make sure
    to keep this safe as if someone gets it
    they can have full console access to your
    server!                                      */
    authorization: "b2x3AqYkjT2T6F5G",

    /*
    Enable the backup feature, backs up the 
    server every week (Alternatively you can 
    do "server.backup()" after "server.start()" 
    at the bottom of your start script to back it 
    up immediately OR do /backup in the console)       */
    backups: true,

    /*
    Time in seconds that the server will wait 
    before restarting after a stop or /restart   */
    restartTime: 10
  },
  remote: {
    /*
    Websocket & HTTP port, this needs to be opened
    if you aren't using something like a reverse
    proxy through apache or nginx.                      */
    port: 35533
  }
});

server.start();