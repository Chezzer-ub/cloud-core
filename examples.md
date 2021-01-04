## Code Examples

### JS
Send a command without websocket:

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
Get console without a websocket:

```javascript
$.ajax({
    url: "http://localhost:35565/",
    headers: {"authorization": "Basic <auth code here>"}
}, (console) => {
  ...
});
```

### PHP
Send a command without websocket:

```php
$ch = curl_init();

curl_setopt($ch, CURLOPT_URL,"http://localhost:35565/");
curl_setopt($ch, CURLOPT_POST, 1);
$authHeaders = array(
  "Authorization: Basic <auth code here>",
  "content-type: application/json"
);
curl_setopt($crl, CURLOPT_HTTPHEADER, $authHeaders);
curl_setopt($crl, CURLOPT_POSTFIELDS, http_build_query(array('command' => 'about')));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$server_output = curl_exec($ch);

curl_close ($ch);
```
Get console without a websocket:

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
