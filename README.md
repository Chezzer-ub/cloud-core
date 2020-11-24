# sapphire-server
An open-source way to run Minecraft easily on linux using JavaScript.

### Install
Put `sapphire-server.js` inside the top folder of all servers you want to control.
Put `start.js` inside your server folder. Make one for every server you control.
File path should look like this:
```
|- sapphire-server.js
|- creative
|-- start.js
|-- server.properties
```
Install the latest version of [NodeJS](https://nodejs.org/en/).
Run:
```
npm i events child_process websocket http fs
```

### How To Start
Start a server with:
```
node start.js
```
NOTE: You MUST start a server in the directory of the server.

We advise using [pm2](https://pm2.keymetrics.io/) to manage servers.
```
pm2 start start.js -n creative
```

#### You may also initiate actions on startup in the `start.js` file.
For example:
```js
server.start();
server.send("say Started Server");
setTimeout(() => {
  server.stop()
}, 10000)
```

### How To Access
Accessing a server can be done by 3 methods:
1. GET request to the remote port, it will return the last 100 lines of the console.
2. POST request to the remote port with JSON in a string: `{'command': 'say hi'}`.
3. Look at `example.html` on how you can open a websocket to the remote port.

### Help
To get help feel free to message me on discord `Chezzer#6969`.
