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
In the source code, to change the markov order, you can pass in a number at the end of every function. The markov order defaults to 3. 

Beware, data is not preserved between changes in the markov order, as they use separate collections.

Using jsMongoHal From Node.js
==================================
```js
var MongoClient = require('mongodb').MongoClient;

MongoClient.connect('mongodb://127.0.0.1:27017/jsmegahal', function(e, db) {
  db.eval('function(x) { add(x); }', ["This is a sample sentence"], function() {});
  db.eval('reply()', [], function(err, reply) { console.log(reply); });
});
```
