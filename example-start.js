const CloudCore = require("./cloud-core-dev.js");
const server = new CloudCore({
  core: {
    jar: "paper-1.16.5-708.jar",
    authorization: "eoifjweoijf",
    args: ['-Xmx2G', '-Xms1G'],
    backups: {
      enabled: true,
      directory: "./backup/",
      time: "weekly"
    },
    port: 25565,
  },
  remote: {
    bind: "0.0.0.0",
    port: 35565
  },
});

server.on("ready", () => {
  server.start();
})
