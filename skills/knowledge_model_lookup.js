/*

Botkit Studio Skill module to enhance the "knowledge_model_lookup" script

*/

var request = require('request');

module.exports = function (controller) {

	/* Thread Hooks */
	// Hook functions in-between threads with beforeThread
	// See: https://github.com/howdyai/botkit/blob/master/docs/readme-studio.md#controllerstudiobeforethread
	/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

	controller.studio.before('knowledge_model_lookup', function (convo, next) {

		console.log(`source_message = ${convo.source_message.text}`);

		var parts = convo.source_message.text.split(/\s+/);

		while (parts.length > 0 && parts[0].match("km|knowledge|model|concept|lookup") != null) {
			parts.shift();
		}

		if (parts.length > 0) {
			var value = parts.join(' ');
			console.log(`uri=${value}`);
			convo.setVar('searchTerm', value);
			convo.gotoThread('results');
			next('stop');
		} else {
			next();
		}
	});

	controller.studio.beforeThread('knowledge_model_lookup', 'results', function (convo, next) {

		var uri = convo.extractResponse('uri');
		if (uri) {
			convo.setVar('searchTerm', uri);
		}
		var value = convo.vars.searchTerm;
		console.log(`uri=${value}`);

		search(value).then(function (results) {
			convo.setVar('results', results);
			if (results.numberOfConcepts > 1) {
				convo.setVar('selectedConcept', null);
				convo.setVar('conceptCursor', null);
				convo.gotoThread('concepts');
			} else {
				convo.setVar('selectedConcept', 0);
				convo.gotoThread('concept');
			}
			next('stop');
		}).catch(function (err) {
			convo.setVar('error', err);
			convo.gotoThread('error');
			next(err);
		});
	});

	controller.studio.beforeThread('knowledge_model_lookup', 'concepts', function (convo, next) {

		if (convo.vars.conceptCursor != null) {
			convo.setVar('conceptCursor', convo.vars.conceptCursor + 1);
		} else {
			convo.setVar('conceptCursor', 0);
		}

		console.log(`conceptCursor = ${convo.vars.conceptCursor}`);

		if (convo.vars.checkPoint == null) {
			convo.setVar('checkPoint', 0);
		}

		if (convo.vars.conceptCursor >= convo.vars.results.concepts.length) {
			convo.gotoThread('bridge');
			next('stop');
		} else {
			if (convo.vars.conceptCursor >= convo.vars.checkPoint + 5) {
				convo.setVar('checkPoint', convo.vars.conceptCursor);
				convo.gotoThread('choices');
				next('stop');
			} else {
				convo.setVar('current', convo.vars.results.concepts[convo.vars.conceptCursor]);
				next();
			}
		}
	});

	controller.on('interactive_message_callback', function(bot, message) {
		if (message.callback_id == 123) {
			console.log('callback from button received');
		}
	});
};

search = function (value) {
	var requestUrl;
	if (value.startsWith('http:')) { // looks like a URI
		var encodedUri = encodeURI(value.substring(1, value.length - 1)); // strip the < > and encode
		requestUrl = `http://models-staging.dev.cf.private.springer.com/km/concept?maxNarrowingDepth=0&uri=${encodedUri}`;
		return kmLookup(requestUrl).then(function (concept) {
			return {
				numberOfConcepts: 1,
				concepts: [concept]
			}; // wrap single concept in an array
		});
	} else { // treat it as a label
		var branchUri = 'http://km.springer.com/nano-terms/e858247acd17d6a34bd62c59c6d527a7';
		var encodedBranchUri = encodeURI(branchUri);
		requestUrl = `http://models-staging.dev.cf.private.springer.com/km/?maxNarrowingDepth=0&branch=${encodedBranchUri}&label=${value}&matchingStrategy=substringIgnoreCase`;
		return kmLookup(requestUrl).then(function (concepts) {
			return {
				numberOfConcepts: concepts.length,
				concepts: concepts
			};
		});
	}
}

kmLookup = function (requestUrl) {
	return new Promise(function (resolve, reject) {
		console.log(`requestUrl=${requestUrl}`);
		request(requestUrl, function (err, response, body) {

			console.log('statusCode: ', response && response.statusCode); // Check 200 or such
			if (err) {
				console.log('error: ', err); // Handle the error if one occurred
				reject(err);
			} else if (response && response.statusCode == 204) {
				reject("Not found");
			} else if (response && response.statusCode == 200) {
				console.log('This is the body: ', body);
				resolve(JSON.parse(body));
			} else if (response) {
				reject("I'm sorry I got an " + response.statusCode + " from my backend");
			} else {
				reject("something went wrong, but I don't know what.");
			}
		});
	});
};

objectAttachment = function (object) {

	var fields = [];

	for (i in object) {
		var field = { title: i, value: JSON.stringify(object[i]) };
		console.log('field = ', JSON.stringify(field));
		fields.push(field);
	}

	return {
		fields: fields
	};
}
