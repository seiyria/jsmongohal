var add = function(sentence) { 

	var markov = 4;
	var wordRegex = /[^a-zA-Z0-9,']+/;

	if(sentence.split(' ').length < markov) return;

	var parts = sentence.split(wordRegex).filter(Boolean);

	for(var i = 0; i <= (parts.length - markov); i++) {
		var quad = {
			tokens: parts.slice(i, i + markov),
			canStart: (i === 0),
			canEnd: (i === parts.length - markov)
		};

		db.quads.insert({
			quad: quad
		});

		var quadId = db.quads.findOne({quad:quad})._id;

		for(var k = 0; k < quad.tokens.length; k++) {
			db.words.insert({ 
				word: quad.tokens[k],
				quad: quadId,
				random: [Math.random(), 0]
			});
		}

		if(i !== 0) {
			var prevToken = parts[i-1];
			db.prev.insert({
				word: prevToken,
				quad: quadId,
				random: [Math.random(), 0]
			});
		}

		if(i < parts.length - markov) {
			var nextToken = parts[i+markov];
			db.next.insert({
				word: nextToken,
				quad: quadId,
				random: [Math.random(), 0]
			});
		}
	}
}

var reply = function(word) {

	var markov = 4;

	db.words.ensureIndex( { random: "2dsphere" } );
	db.next.ensureIndex( { random: "2dsphere" } );
	db.prev.ensureIndex( { random: "2dsphere" } );

	var createBaseOptions = function() {
		return { random: { $near: { $geometry: { type: "Point", coordinates: [Math.random(), 0] } } } };
	};

	var lookup = function(id) {
		return db.quads.findOne({_id: id});
	};

	var createMiddleQuad = function(tokens) {
		return {
			tokens: tokens,
			canStart: false,
			canEnd: false
		};
	};

	var insertQuad = function(quad) {
		db.quads.insert({
			quad: quad
		});
		return db.quads.findOne({quad:quad});
	};

	var baseOptions = createBaseOptions();

	if(word) {
		word = word.trim();
		baseOptions.word = word;
	}

	var _randQuad = db.words.findOne(options);

	if(!_randQuad) return "";
	
	var middleQuad = quad = lookup(_randQuad.quad);

	if(!quad) return "";

	var parts = quad.quad.tokens.slice(0);

	while(!quad.canEnd) {

		var options = createBaseOptions();
		options.quad = quad._id;

		nextWord = db.next.findOne(options);

		if(!nextWord) break;

		nextWord = nextWord.word;

		quad = insertQuad( createMiddleQuad( parts.slice(1, markov).push(nextWord) ) );

		parts.push(nextWord);

	}

	quad = middleQuad;

	while(!quad.canStart) {

		var options = createBaseOptions();
		options.quad = quad._id;

		prevWord = db.prev.findOne(options);

		if(!prevWord) break;

		prevWord = prevWord.word;

		quad = insertQuad( createMiddleQuad( parts.slice(0, markov-1).unshift(prevWord) ) );

		parts.unshift(prevWord);
		
	}

	return parts.join(' ');
};

var empty = function() {
	db.words.drop();
	db.quads.drop();
	db.next.drop();
	db.prev.drop();
};

db.system.js.save({_id: "add", value: add});
db.system.js.save({_id: "reply", value: reply});
db.system.js.save({_id: "empty", value: empty});

