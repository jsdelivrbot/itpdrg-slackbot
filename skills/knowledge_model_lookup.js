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
		}

		topLevelConcepts().then(function(top_level_concepts) {
			convo.setVar('top_level_concepts', top_level_concepts);
			convo.setVar('top_level_cursor', null);
			convo.setVar('top_level_uri', null);
			next();
		});

	});

	controller.studio.beforeThread('knowledge_model_lookup', 'top_level_concepts', function (convo, next) {

		if (convo.vars.top_level_cursor == null) {
			convo.setVar('top_level_cursor', 0);
			convo.setVar('current_top_level', convo.vars.top_level_concepts.concepts[0]);
			next();
		} else if (convo.vars.top_level_cursor < convo.vars.top_level_concepts.numberOfConcepts) {
			convo.setVar('top_level_cursor', convo.vars.top_level_cursor + 1);
			convo.setVar('current_top_level', convo.vars.top_level_concepts.concepts[convo.vars.top_level_cursor]);
			next();
		} else {
			convo.gotoThread('choice');
			next('stop');
		}

	});

	controller.studio.beforeThread('knowledge_model_lookup', 'xxx', function (convo, next) {

		var selected_top_level = convo.extractResponse('selected_top_level');
		var selected_branch = selected_top_level - 1;
		if (selected_branch >= 0
			&& selected_branch < convo.vars.top_level_concepts.numberOfConcepts
		) {
			convo.setVar('selected_branch', selected_branch);
			next();
		} else {
			convo.gotoThread('top_level_concepts');
			next('stop');
		}
	});

	controller.studio.beforeThread('knowledge_model_lookup', 'results', function (convo, next) {

		var uri = convo.extractResponse('uri');
		if (uri != null) {
			convo.setVar('searchTerm', uri);
		}
		var value = convo.vars.searchTerm;
		console.log(`searching for ${value}`);

		var branchUri = null;
		
		if (convo.vars.top_level_concepts && convo.vars.selected_branch) {
			branchUri = convo.vars.top_level_concepts.concepts[convo.vars.selected_branch].uri;
		}

		search(branchUri,value).then(function (results) {
			convo.setVar('results', results);
			if (results.numberOfConcepts > 1) {
				convo.setVar('selectedConcept', null);
				convo.setVar('conceptCursor', null);
				convo.setVar('remainingConcepts', results.numberOfConcepts);
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

	controller.studio.beforeThread('knowledge_model_lookup', 'concept', function (convo, next) {
		convo.setVar('selectedConcept', convo.vars.results.concepts[convo.vars.selectedConcept]);
		next();
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
				convo.setVar('remainingConcepts', convo.vars.results.numberOfConcepts - convo.vars.conceptCursor);
				next();
			}
		}
	});
};

search = function (branchUri, value) {
	var requestUrl;
	if (value.startsWith('<http:')) { // looks like a URI
		var encodedUri = encodeURI(value.substring(1, value.length - 1)); // strip the < > and encode
		requestUrl = `http://models-staging.dev.cf.private.springer.com/km/concept?maxNarrowingDepth=0&uri=${encodedUri}`;
		return kmLookup(requestUrl).then(function (concept) {
			return postProcessConcepts([concept]); // wrap single concept in an array
		});
	} else { // treat it as a label
		var encodedBranchUri = encodeURI(branchUri);
		requestUrl = `http://models-staging.dev.cf.private.springer.com/km/?maxNarrowingDepth=0&branch=${encodedBranchUri}&label=${value}&matchingStrategy=substringIgnoreCase`;
		return kmLookup(requestUrl).then(function (concepts) {
			return postProcessConcepts(concepts);
		});
	}
}

withIds = function (list, propertyName, firstIndex) {
	firstIndex |= 0;
	return list.map((item, idx) => {
		var augmented = Object.create(item);
		augmented[propertyName] = idx + firstIndex;
		return augmented;
	});
}

postProcessConcepts = function(concepts) {
	return {
		numberOfConcepts: concepts.length,
		concepts: withIds(concepts, 'index', 1)
	};
}

topLevelConcepts = function() {
	requestUrl = `http://models-staging.dev.cf.private.springer.com/km/?maxNarrowingDepth=0`;
		return kmLookup(requestUrl).then(function (concepts) {
			return {
				numberOfConcepts: concepts.length,
				concepts: concepts
			};
		});

}

kmLookup = function (requestUrl) {
	return new Promise(function (resolve, reject) {
		console.log(`requestUrl=${requestUrl}`);
		request(requestUrl, {timeout: 30000}, function (err, response, body) {

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
