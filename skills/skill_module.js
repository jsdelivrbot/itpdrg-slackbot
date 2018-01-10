/*

Botkit Studio Skill module to enhance the "knowledge_model_lookup" script

*/

var request = require('request');

module.exports = function(controller) {
    // define a before hook
    // you may define multiple before hooks. they will run in the order they are defined.
    // See: https://github.com/howdyai/botkit/blob/master/docs/readme-studio.md#controllerstudiobefore
    controller.studio.before('knowledge_model_lookup', function(convo, next) {

        // do some preparation before the conversation starts...
        // for example, set variables to be used in the message templates
        // convo.setVar('foo','bar');

        console.log('BEFORE: knowledge_model_lookup');
        // don't forget to call next, or your conversation will never continue.
        next();

    });

    /* Validators */
    // Fire a function whenever a variable is set because of user input
    // See: https://github.com/howdyai/botkit/blob/master/docs/readme-studio.md#controllerstudiovalidate
    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

    // Validate user input: uri
    controller.studio.validate('knowledge_model_lookup','uri', function(convo, next) {

        var value = convo.extractResponse('uri');

        // test or validate value somehow
        // can call convo.gotoThread() to change direction of conversation

        console.log('VALIDATE: knowledge_model_lookup VARIABLE: uri');
	console.log(`uri=${value}`);

        // always call next!
        next();

    });

    // Validate user input: question_1
    controller.studio.validate('knowledge_model_lookup','question_1', function(convo, next) {

        var value = convo.extractResponse('question_1');

        // test or validate value somehow
        // can call convo.gotoThread() to change direction of conversation

        console.log('VALIDATE: knowledge_model_lookup VARIABLE: question_1');

        // always call next!
        next();

    });

    // Validate user input: question_2
    controller.studio.validate('knowledge_model_lookup','question_2', function(convo, next) {

        var value = convo.extractResponse('question_2');

        // test or validate value somehow
        // can call convo.gotoThread() to change direction of conversation

        console.log('VALIDATE: knowledge_model_lookup VARIABLE: question_2');

        // always call next!
        next();

    });

    // Validate user input: question_3
    controller.studio.validate('knowledge_model_lookup','question_3', function(convo, next) {

        var value = convo.extractResponse('question_3');

        // test or validate value somehow
        // can call convo.gotoThread() to change direction of conversation

        console.log('VALIDATE: knowledge_model_lookup VARIABLE: question_3');

        // always call next!
        next();

    });

    /* Thread Hooks */
    // Hook functions in-between threads with beforeThread
    // See: https://github.com/howdyai/botkit/blob/master/docs/readme-studio.md#controllerstudiobeforethread
    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

    // Before the default thread starts, run this:
    controller.studio.beforeThread('knowledge_model_lookup','default', function(convo, next) {

        /// do something fun and useful
        // convo.setVar('name','value');

        console.log('In the script *knowledge_model_lookup*, about to start the thread *default*');

        // always call next!
        next();
    });

    controller.studio.beforeThread('knowledge_model_lookup', 'results', function(convo, next) {

	  var uri = convo.extractResponse('uri');
	  kmLookup(uri).then(function(results) {

	    convo.setVar('prefLabel', results.prefLabel);
	    convo.setVar('altLabels', results.altLabels);
	    next();

	  }).catch(function(err) {

	    convo.setVar('error', err);
	    convo.gotoThread('error');
	    next(err);

      });

    });

    // Before the on_timeout thread starts, run this:
    controller.studio.beforeThread('knowledge_model_lookup','on_timeout', function(convo, next) {

        /// do something fun and useful
        // convo.setVar('name','value');

        console.log('In the script *knowledge_model_lookup*, about to start the thread *on_timeout*');

        // always call next!
        next();
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

kmLookup = function(uri) {
	return new Promise(function(resolve, reject) {
		console.log(`kmLookup(${uri})`);
		var encodedUri = encodeURI(uri.substring(1, uri.length-1)); // strip the < > and encode
		var requestUrl = `http://models-staging.dev.cf.private.springer.com/km/concept?uri=${encodedUri}`;
		console.log(`requestUrl=${requestUrl}`);
		request(requestUrl, function (err, response, body) {

			console.log('statusCode: ', response && response.statusCode); // Check 200 or such
			if (err) {
				console.log('error: ', err); // Handle the error if one occurred
				reject(err);
			} else {
				console.log('This is the body: ', body);
				resolve(body);
			}
		});
	});
};

