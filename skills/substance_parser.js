/*

Botkit Studio Skill module to enhance the "knowledge_model_lookup" script

*/

var request = require('request');

module.exports = function (controller) {

	/* Thread Hooks */
	// Hook functions in-between threads with beforeThread
	// See: https://github.com/howdyai/botkit/blob/master/docs/readme-studio.md#controllerstudiobeforethread
	/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

	controller.studio.before('substance', function (convo, next) {

		console.log(`source_message = ${convo.source_message.text}`);

		var parts = convo.source_message.text.split(/\s+/);

		while (parts.length > 0 && parts[0].match("substance") != null) {
			parts.shift();
		}

		if (parts.length > 0) {
			var value = parts.join(' ');
			console.log(`value=${value}`);
			convo.setVar('substance_name', value);
		}

		next();
	});

	controller.studio.beforeThread('substance', 'results', function (convo, next) {
		var substance_name = convo.extractResponse('substance_name');
		parse(substance_name).then(function(observations) {
			console.log(observations);
			convo.setVar('parser_output', JSON.stringify(observations));
			next();
		});
	});
}

parse = function (substance_name) {
	var requestUrl = "http://88.217.130.243:8091/SubstanceParser/v1.0.2-SNAPSHOT/chemicals/parse";
	var input = { name: substance_name };
	return new Promise(function (resolve, reject) {
		console.log(`requestUrl=${requestUrl}`);
		request.post({
			url: requestUrl, 
			headers: {'Content-Type': 'application/json'}, 
			body: { inputList: [input] },
			json: true,
			timeout: 30000
		}, function (err, response, body) {

			console.log('statusCode: ', response && response.statusCode); // Check 200 or such
			if (err) {
				console.log('error: ', err); // Handle the error if one occurred
				reject(err);
			} else if (response && response.statusCode == 204) {
				reject("Not found");
			} else if (response && response.statusCode == 200) {
				console.log('This is the body: ', body);
				resolve(body);
			} else if (response) {
				reject("I'm sorry I got an " + response.statusCode + " from my backend");
			} else {
				reject("something went wrong, but I don't know what.");
			}
		});
	});
}

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
