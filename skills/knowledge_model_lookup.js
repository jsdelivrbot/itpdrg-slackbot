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

	  var uri = convo.extractResponse('uri');
	  console.log(`uri=${value}`);

          if (uri.startsWith('http:')) { // looks like a URI
	  	var encodedUri = encodeURI(uri.substring(1, uri.length-1)); // strip the < > and encode
	  	var requestUrl = `http://models-staging.dev.cf.private.springer.com/km/concept?uri=${encodedUri}`;
	  	convo.setVar('requestUrl', requestUrl);
	  	kmLookup(requestUrl).then(function(results) {
	    		convo.setVar('uri', uri);
	    		convo.setVar('prefLabel', results.prefLabel);
	    		convo.setVar('altLabels', results.altLabels);
	    		next();
	  	}).catch(function(err) {
	    		convo.setVar('error', err);
	    		convo.gotoThread('error');
	    		next(err);
      		});
          } else { // treat it as a label
		var branchUri = 'http://km.springer.com/nano-terms/e858247acd17d6a34bd62c59c6d527a7';
		var encodedBranchUri = encodeURI(branchUri);
	  	var requestUrl = `http://models-staging.dev.cf.private.springer.com/km?branch=${encodedBranchUri}&label=${uri}`;
	  	convo.setVar('requestUrl', requestUrl);
	  	kmLookup(requestUrl).then(function(results) {
	    		convo.setVar('uri', results.uri);
	    		convo.setVar('prefLabel', results.prefLabel);
	    		convo.setVar('altLabels', results.altLabels);
	    		next();
	  	}).catch(function(err) {
	    		convo.setVar('error', err);
	    		convo.gotoThread('error');
	    		next(err);
      		});
	  }

    });

    // define an after hook
    // you may define multiple after hooks. they will run in the order they are defined.
    // See: https://github.com/howdyai/botkit/blob/master/docs/readme-studio.md#controllerstudioafter
    controller.studio.after('knowledge_model_lookup', function(convo, next) {

        console.log('AFTER: knowledge_model_lookup');

        // handle the outcome of the convo
        if (convo.successful()) {

            var responses = convo.extractResponses();
            // do something with the responses
            console.log(`responses=${responses}`);

        }

        // don't forget to call next, or your conversation will never properly complete.
        next();
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

