# This repository is no longer maintained

mydb-reconnect
==============

MyDB automatic reconnection plugin

## How to use

```js
var db = require('mydb')('/');
var reconnect = require('mydb-reconnect');

reconnect(db, { connectTimeout: 5000 });
```

## API

### Reconnect(db, opts)

Options:

- `retryTimeout` how long to wait before reconnection attempts (`10000`)
- `connectTimeout` how long after a connection attempt to give up (`10000`)
