/*

Botkit Studio Skill module to enhance the "pos" script

*/

var pos = require('pos');

module.exports = function(controller) {

    /* Validators */
    // Fire a function whenever a variable is set because of user input
    // See: https://github.com/howdyai/botkit/blob/master/docs/readme-studio.md#controllerstudiovalidate
    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

    // Validate user input: uri
    controller.studio.validate('pos','pos_input', function(convo, next) {

        var text = convo.extractResponse('pos_input');

        // test or validate value somehow
        // can call convo.gotoThread() to change direction of conversation

        console.log(`VALIDATE: pos VARIABLE: pos_input=${text}`);

	var words = new pos.Lexer().lex(text);
	var tagger = new pos.Tagger();
	var taggedWords = tagger.tag(words);
	var fields = [];
	for (i in taggedWords) {
	    var taggedWord = taggedWords[i];
	    var word = taggedWord[0];
	    var tag = taggedWord[1];
	    console.log(word + " /" + tag);
	    var field = {};
	    field[word] = tag;
            fields.push(field);
	}
	console.log(fields);
	convo.setVar('pos_output', taggedWords);

	var reply_with_attachments = {
	    'text': 'This is what I understood:',
	    'attachments': [
	      {
		'fallback': 'POS analysis',
		'title': 'POS analysis',
		'text': text,
		'color': '#7CD197',
                'fields': fields
	      }
	    ],
	};

	convo.sayFirst(reply_with_attachments);

        // always call next!
        next();

    });

};
