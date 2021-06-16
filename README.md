![](https://i.imgur.com/n6Sj5U7.png)
<p align="center">
  An open-source way to run Minecraft easily on linux using Express & Websockets.
</p>
<p align="center">
  <a href="https://www.codefactor.io/repository/github/chezzer-ub/cloud-core/overview/main"><img src="https://www.codefactor.io/repository/github/chezzer-ub/cloud-core/badge/main" alt="CodeFactor"></a>
  <a href="https://codeclimate.com/github/Chezzer-ub/cloud-core/maintainability"><img src="https://api.codeclimate.com/v1/badges/8b5b0bddfd291e174cf0/maintainability" alt="Maintainability"></a>
  <a href="http://npmjs.com/package/cloud-core-server"><img src="https://img.shields.io/bundlephobia/min/cloud-core-server" alt="npm bundle size"></a>
  <a href="http://npmjs.com/package/cloud-core-server"><img src="https://img.shields.io/npm/dt/cloud-core-server" alt="npm"></a>
</p>

----

**Cloud Core** is a highly configurable Minecraft Java wrapper, it uses `child_process`, `express`, `websocket` and many other modules to expose your Minecraft Java server to the web.

* HTTP Api for sending commands, requesting the last 100 lines of console and getting the server usage statistics (cpu & ram).
* Websocket support to receive console lines, send commands and start / stop the server.
* A fully automated backup system that backs up your whole server on a bi-weekly / bi-monthly basis.
* Highly customizable with events, and functions to interact with the server from plain javascript.
* Highly secured, only letting users with a certain password connect.
* Logs every command sent into the Minecraft latest log with an optional user field to log a command by a user.

### Install

Firstly make sure you have the following dependencies:
* Java 8 or above.
* NodeJS 12 or above.
* Access to SSH on your host.

Install via NPM...
```
npm install cloud-core-server
```

To start a server, you need to create a javascript file in the root of your server.

Include Cloud Core into this script by entering this line:
```
const CloudCore = require("cloud-core-server");
```

Then make a new instance of CloudCore:
```
const server = new CloudCore(options);
```

You need to configure most of the options, download the `example-start.js` file to see an example of what you might find, all options and default values are listed here:

`core:`
<table>
  <tr>
    <th>Option</th>
    <th>About</th>
    <th>Default Value</th>
  </tr>
  <tr>
    <td>jar</td>
    <td>Main java file for the server.</td>
    <td>"server.jar"</td>
  </tr>
  <tr>
    <td>authorization</td>
    <td>Main authorization code for any request.</td>
    <td>"hackme"</td>
  </tr>
  <tr>
    <td>args</td>
    <td>Array of java flags, including ram and other options. <a href="https://minecraft.fandom.com/wiki/Tutorials/Setting_up_a_server#Minecraft_options">(Minecraft Jar Flags)</a></td>
    <td>['-Xmx2G', '-Xms1G']</td>
  </tr>
  <tr>
    <td>port</td>
    <td>Minecraft server port.</td>
    <td>25565</td>
  </tr>
</table>

`core.backups:`
<table>
  <tr>
    <th>Option</th>
    <th>About</th>
    <th>Default Value</th>
  </tr>
  <tr>
    <td>enabled</td>
    <td>Do you want automatic backups?</td>
    <td>false</td>
  </tr>
  <tr>
    <td>time</td>
    <td>How much time do you want per backup? Can be only "weekly" OR "monthly"</td>
    <td>"weekly"</td>
  </tr>
  <tr>
    <td>directory</td>
    <td>Where do you want to save any backups?</td>
    <td>"./backup/"</td>
  </tr>
</table>

`remote:`
<table>
  <tr>
    <th>Option</th>
    <th>About</th>
    <th>Default Value</th>
  </tr>
  <tr>
    <td>bind</td>
    <td>IP Address to bind the webserver to.</td>
    <td>"0.0.0.0"</td>
  </tr>
  <tr>
    <td>port</td>
    <td>Port to bind the webserver to.</td>
    <td>35565</td>
  </tr>
</table>

### Running

Start your server by installing [pm2](https://pm2.keymetrics.io/) and running this command:

```
pm2 start (your start javascript file) -n (server name)
```

Your server will now be started. You can use `pm2 log (server name)` to view the server log or if there are any errors.

**Be careful** when you are stopping your server. If you stop your server via `pm2 stop (server name)` your server can be shut down incorrectly. Please first stop your server through the web, then stop it via pm2.

You can also start multiple servers using pm2.

### Accessing

[1. HTTP GET request to any URL to get the last 100 lines of the console.](#access-1)

[2. HTTP POST request to any URL to send a command.](#access-2)

[3. Open websocket to any URL.](#access-3)

Make sure you follow [**authentication**](#authentication) rules.

Also have a look at [proxying your webserver](#proxy) to ensure security.

<h4 id="access-1">Get console</h4>

```PHP
$context = [
  "http" => [
      "method" => "GET",
      "header" => "Authorization: <auth code here>"
  ]
];

$console = file_get_contents("http://localhost:35565/", false, stream_context_create($context))
```


<h4 id="access-2">Post command</h4>

```PHP
$ch = curl_init();

curl_setopt($ch, CURLOPT_URL,"http://localhost:35565/");
curl_setopt($ch, CURLOPT_POST, 1);
$authHeaders = array(
  "Authorization: <auth code here>",
  "Content-type: application/json"
);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeaders);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(array("command" => "command here", "user" => "optional user here")));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$server_output = curl_exec($ch);

curl_close ($ch);
```


<h4 id="access-3">Websocket</h4>

```JavaScript
webSocket = new WebSocket('ws://localhost:35565', 'auth code here');
webSocket.onmessage = (message) => {
    let line = message.data;
    console.log(line)
};

webSocket.send(JSON.stringify({"command": "command here", "user": "optional user here"}))
```

<h4 id="authentication">Authentication</h4>

All requests include a `Authorization` header with the auth code you set in the start.js file.

Pass the authentication code in the protocall for websockets. [See Above](#access-3)


<h4 id="proxy">Proxying the Server</h4>

It is highly recommended that you proxy your webserver as this does not support https at the moment. Here are some articles on how you can do that.

[Setting up NGINX as your proxy server with NodeJS apps](https://blog.codingblocks.com/2019/setting-up-nginx-as-your-proxy-server-with-nodejs-apps/)

[How to Setup Apache As Frontend Proxy for Node.js](https://tecadmin.net/apache-frontend-proxy-nodejs/)

### API

[Events](#events)

[Methods](#methods)

<h4 id="events">Events</h4>

Register an event by doing:

```JavaScript
server.on("event name", (params) => {
  // do stuff
})
```

<table>
  <tr>
    <th>Event Name</th>
    <th>Description</th>
    <th>Parameters</th>
  </tr>
  <tr>
    <td>ready</td>
    <td>Ready to start server.</td>
    <td></td>
  </tr>
  <tr>
    <td>command</td>
    <td>When a command is executed from either the web or websocket.</td>
    <td>command</td>
  </tr>
  <tr>
    <td>console</td>
    <td>When the server returns a console line. NOTE: If you emit this event, it will return whatever text you pass to the websocket.</td>
    <td>line</td>
  </tr>
  <tr>
    <td>start</td>
    <td>When the server is started.</td>
    <td></td>
  </tr>
  <tr>
    <td>stopping</td>
    <td>When server tries to stop.</td>
    <td></td>
  </tr>
  <tr>
    <td>stop</td>
    <td>When server fully stops.</td>
    <td></td>
  </tr>
  <tr>
    <td>backup</td>
    <td>When server is backed up, includes filepath to zip file.</td>
    <td>path</td>
  </tr>
</table>

<h4 id="methods">Methods</h4>

<table>
  <tr>
    <th>Method Name</th>
    <th>Description</th>
    <th>Parameters</th>
  </tr>
  <tr>
    <td>server.start()</td>
    <td>Starts server.</td>
    <td></td>
  </tr>
  <tr>
    <td>server.stop(<Function>)</td>
    <td>Tries to stop server and executes callback when fully stopped.</td>
    <td>Callback Function</td>
  </tr>
  <tr>
    <td>server.send(<String>)</td>
    <td>Sends a command to the server.</td>
    <td>Command to send</td>
  </tr>
  <tr>
    <td>server.backup()</td>
    <td>Backs up the server reguardless of having backups enabled.</td>
    <td></td>
  </tr>
  <tr>
    <td>server.wsServer</td>
    <td>Access websocket server <a href="https://www.npmjs.com/package/ws">Websocket Module</a>.</td>
    <td></td>
  </tr>
  <tr>
    <td>server.httpServer</td>
    <td>Returns running express server</td>
    <td></td>
  </tr>
  <tr>
    <td>server.minecraftServer</td>
    <td>Returns child process spawn running the server. (Advanced Users Only)</td>
    <td></td>
  </tr>
</table>

### Help
To get help feel free to message me on discord `Chezzer#6969`.
