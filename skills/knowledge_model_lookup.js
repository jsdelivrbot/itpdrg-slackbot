/*

Botkit Studio Skill module to enhance the "knowledge_model_lookup" script

*/

var request = require('request');

module.exports = function(controller) {

    /* Thread Hooks */
    // Hook functions in-between threads with beforeThread
    // See: https://github.com/howdyai/botkit/blob/master/docs/readme-studio.md#controllerstudiobeforethread
    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

    controller.studio.beforeThread('knowledge_model_lookup', 'results', function(convo, next) {

	  var value = convo.extractResponse('uri');
	  console.log(`uri=${value}`);

          if (value.startsWith('http:')) { // looks like a URI
	  	var encodedUri = encodeURI(value.substring(1, value.length-1)); // strip the < > and encode
	  	var requestUrl = `http://models-staging.dev.cf.private.springer.com/km/concept?uri=${encodedUri}`;
	  	convo.setVar('requestUrl', requestUrl);
	  	kmLookup(requestUrl).then(function(results) {
			convo.say(objectMessage('This is what I found out:', results));
	    		next();
	  	}).catch(function(err) {
	    		convo.setVar('error', err);
	    		convo.gotoThread('error');
	    		next(err);
      		});
          } else { // treat it as a label
		var branchUri = 'http://km.springer.com/nano-terms/e858247acd17d6a34bd62c59c6d527a7';
		var encodedBranchUri = encodeURI(branchUri);
	  	var requestUrl = `http://models-staging.dev.cf.private.springer.com/km/?branch=${encodedBranchUri}&label=${value}&matchingStrategy=substringIgnoreCase`;
	  	convo.setVar('requestUrl', requestUrl);
	  	kmLookup(requestUrl).then(function(results) {
			var attachments = [];
			for (var i = 0; i < results.length; i++) {
				var r = results[i];
				console.log(i,': ',JSON.stringify(r));
				var a = objectAttachment(r);
				attachments.push(a);
                                for (var j = 0; j < a.fields; j++) {
                                  convo.say(a.fields[i].title + " : " + a.fields[i].value);
                                }
			}
			convo.ask('Are you happy?', function (response, convo) {
			 	convo.say('you answered '+response.text);
			}
			//convo.say({ text: 'This is what I found out:', attachments: attachments });
	    		next();
	  	}).catch(function(err) {
	    		convo.setVar('error', err);
	    		convo.gotoThread('error');
	    		next(err);
      		});
	  }

    });

};

kmLookup = function(requestUrl) {
	return new Promise(function(resolve, reject) {
		console.log(`requestUrl=${requestUrl}`);
		request(requestUrl, function (err, response, body) {

			console.log('statusCode: ', response && response.statusCode); // Check 200 or such
			if (err) {
				console.log('error: ', err); // Handle the error if one occurred
				reject(err);
			} else if (response && response.statusCode == 404) {
				reject("Not found");
			} else {
				console.log('This is the body: ', body);
				resolve(JSON.parse(body));
			}
		});
	});
};

objectAttachment = function(object) {

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
