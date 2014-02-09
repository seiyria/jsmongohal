var add = function(sentence, wordRegex, markov) { 

	var markov = markov || 3;
	var wordRegex = wordRegex || /[^a-zA-Z0-9,']+/;

	if(sentence.split(' ').length < markov) return;

	var parts = sentence.split(wordRegex).filter(Boolean);

	for(var i = 0; i <= (parts.length - markov); i++) {
		var quad = {
			tokens: parts.slice(i, i + markov),
			canStart: (i === 0),
			canEnd: (i === parts.length - markov)
		};

		db["quads_"+markov].update({
			quad: quad
		}, {
			quad: quad
		}, {
			upsert: true
		});

		var quadId = db["quads_"+markov].findOne({quad:quad})._id;

		for(var k = 0; k < quad.tokens.length; k++) {
			db["words_"+markov].update({
				word: quad.tokens[k],
				quad: quadId
			}, { 
				word: quad.tokens[k],
				quad: quadId,
				random: [Math.random(), 0]
			}, {
				upsert: true
			});
		}

		if(i !== 0) {
			var prevToken = parts[i-1];
			db["prev_"+markov].update({
				word: prevToken,
				quad: quadId
			}, {
				word: prevToken,
				quad: quadId,
				random: [Math.random(), 0]
			}, {
				upsert: true
			});
		}

		if(i < parts.length - markov) {
			var nextToken = parts[i+markov];
			db["next_"+markov].update({
				word: nextToken,
				quad: quadId
			}, {
				word: nextToken,
				quad: quadId,
				random: [Math.random(), 0]
			}, {
				upsert: true
			});
		}
	}
}

var reply = function(word, markov) {

	var markov = markov || 3;

	db["words_"+markov].ensureIndex( { random: "2dsphere" } );
	db["next_"+markov].ensureIndex( { random: "2dsphere" } );
	db["prev_"+markov].ensureIndex( { random: "2dsphere" } );

	var createBaseOptions = function() {
		return { random: { $near: { $geometry: { type: "Point", coordinates: [Math.random(), 0] } } } };
	};

	var lookup = function(id) {
		return db["quads_"+markov].findOne({_id: id});
	};

	var createMiddleQuad = function(tokens) {
		return {
			tokens: tokens,
			canStart: false,
			canEnd: false
		};
	};

	var insertQuad = function(quad) {
		db["quads_"+markov].update({
			quad: quad
		}, {
			quad: quad
		}, {
			upsert: true
		});
		return db["quads_"+markov].findOne({quad:quad});
	};

	var baseOptions = createBaseOptions();

	if(word) {
		word = word.trim();
		baseOptions.word = word;
	}

	var _randQuad = db["words_"+markov].findOne(baseOptions);

	if(!_randQuad) return "";
	
	var middleQuad = quad = lookup(_randQuad.quad);

	if(!quad) return "";

	var parts = quad.quad.tokens.slice(0);

	while(!quad.canEnd) {

		var options = createBaseOptions();
		options.quad = quad._id;

		nextWord = db["next_"+markov].findOne(options);

		if(!nextWord) break;

		nextWord = nextWord.word;

		quad = insertQuad( createMiddleQuad( parts.slice(1, markov).push(nextWord) ) );

		parts.push(nextWord);

	}

	quad = middleQuad;

	while(!quad.canStart) {

		var options = createBaseOptions();
		options.quad = quad._id;

		prevWord = db["prev_"+markov].findOne(options);

		if(!prevWord) break;

		prevWord = prevWord.word;

		quad = insertQuad( createMiddleQuad( parts.slice(0, markov-1).unshift(prevWord) ) );

		parts.unshift(prevWord);
		
	}

	return parts.join(' ');
};

var empty = function(markov) {

	var markov = markov || 3;

	db["words_"+markov].drop();
	db["quads_"+markov].drop();
	db["next_"+markov].drop();
	db["prev_"+markov].drop();
};

db.system.js.save({_id: "add", value: add});
db.system.js.save({_id: "reply", value: reply});
db.system.js.save({_id: "empty", value: empty});

