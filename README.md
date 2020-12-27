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
2. POST request to the remote port with JSON: `{'command': 'say hi'}`.
3. Look at `example.html` on how you can open a websocket to the remote port and for jQuery requests.

#### Authentication
All requests have to have a authorization header attached. You can change the code in the server settings in `start.js`
```
Authorization: Basic <auth code here>
```

#### More on websockets...
Having multiple ports can be annoying, so running the websockets through a webserver can not only orginize them but also allow secure websocket connections.

It is strongly advised that you do this since non-secure websockets can easily be found and sniffed.

Here is a base apache config that can be used to achieve this. It assumes you have a domain and that you can add a subdomain to that.
```
<IfModule mod_ssl.c>
<VirtualHost *:443>
    ServerAdmin admin@site.com
    ServerName minecraft.site.com

    Header set Access-Control-Allow-Origin "https://site.com" # PLEASE USE THIS (Only allows connections from certain sites)

    ProxyRequests off

    ProxyPassMatch ^/(creative/ws)$  ws://localhost:25565/
    ProxyPass /creative http://localhost:25565/
    # Now websocket will be wss://server.site.com/creative/ws/
    # Now GET & POST will be https://server.site.com/creative/

    # Unfortunately you will have to add a new entry into this file every time you add a server.

    Redirect permanent / https://site.com/ # Redirects any traffic who have found the subdomain back to your site.

    # Make sure you use encryption or this whole process will be a waste of time.
    # The best in my opinion is Cert Bot (google it), It works very well with apache.
    SSLCertificateFile /etc/letsencrypt/live/...
    SSLCertificateKeyFile /etc/letsencrypt/live/...
    Include /etc/letsencrypt/options-ssl-apache.conf
</VirtualHost>
</IfModule>
```

### Help
To get help feel free to message me on discord `Chezzer#6969`.
