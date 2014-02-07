jsmongohal
==========
A port of [my port](https://github.com/seiyria/jsmegahal) of MegaHAL to MongoDB. Not nearly as feature-complete and likely will not be, due to the niche case that inspired this.


Test From MongoShell
====================
```bash
mongo jsmegahal jsmegahal.mongodb.js
mongo
> use jsmegahal
> db.loadServerScripts()
> add("This is a sample sentence")  #add a sentence to the database
> reply()                           #generates a random reply
> empty()                           #clears the database
```

Tweaking the Markov Order
=========================
In the source code, to change the markov order, you have to change the `markov` variable at the top of the `reply` and `add` functions. 

Using jsMongoHal From Node.js
==================================
```js
var MongoClient = require('mongodb').MongoClient;

MongoClient.connect('mongodb://127.0.0.1:27017/jsmegahal', function(e, db) {
  db.eval('function(x) { add(x); }', ["This is a sample sentence"], function() {});
  db.dval('reply()', [], function(err, reply) { console.log(reply); });
});
```
