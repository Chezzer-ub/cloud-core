## Code Examples

### Javascript Websocket
Establish connection:

```javascript
webSocket = new WebSocket('ws://localhost:35565');
webSocket.onmessage = (message) => {
    let line = message.data;
    console.log(line)
};
```

Send a command:
```javascript
let obj = {
    "command": "about",
    "authorization": "auth code here"
}
webSocket.send(JSON.stringify(obj))
```

### jQuery
Send a command:

```javascript
$.ajax({
    method: "POST",
    data: {command: "about"},
    url: "http://localhost:35565/",
    headers: {"authorization": "Basic <auth code here>"}
}, () => {
  ...
});
```
Get console:

```javascript
$.ajax({
    url: "http://localhost:35565/",
    headers: {"authorization": "Basic <auth code here>"}
}, (console) => {
  ...
});
```

### PHP
Send a command:

```php
$ch = curl_init();

curl_setopt($ch, CURLOPT_URL,"http://localhost:35565/");
curl_setopt($ch, CURLOPT_POST, 1);
$authHeaders = array(
  "Authorization: Basic <auth code here>"
);
curl_setopt($crl, CURLOPT_HTTPHEADER, $authHeaders);
curl_setopt($crl, CURLOPT_POSTFIELDS, http_build_query(array('command' => 'about')));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$server_output = curl_exec($ch);

curl_close ($ch);
```
Get console:

```php
$context = [
  "http" => [
      "method" => "GET",
      "header" => "Authorization: Basic <auth code here>"
  ]
];

$console = file_get_contents("http://localhost:35565/", false, stream_context_create($context))

//Best outputed with <pre>
```

## Glossary

- `<auth code here>` is referring to the auth code you specified inside of your start.js file. Make sure you include the word `Basic ` at the start.
- `"about"` is the default command I am using.
