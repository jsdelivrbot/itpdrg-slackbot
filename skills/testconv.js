/*

Botkit Studio Skill module to enhance the "testconv" script

*/

var request = require('request');

module.exports = function (controller) {

    /* Thread Hooks */
    // Hook functions in-between threads with beforeThread
    // See: https://github.com/howdyai/botkit/blob/master/docs/readme-studio.md#controllerstudiobeforethread
    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

    controller.hears(['^testkonv'], 'direct_message,direct_mention', function(bot, message) {

        bot.createConversation(message, function(err, convo) {
            if (!err) {
                convo.say('Tell me more!');
                convo.activate();
            }
        });

    });

    controller.studio.beforeThread('testconv', 'thanks', function (convo, next) {

        var question_1 = convo.extractResponse('question_1');
        console.log(`question_1=${question_1}`);

        convo.sayFirst(`so you say ${question_1}...`);

        next();

    });
}