'use strict';
const assert = require('assert');
const Botmock = require('../lib/Botmock');
const fileBeingTested = require('../skills/knowledge_model_lookup');
const env = require('node-env-file');
env(__dirname + '/../.env');

describe('knowledge_model_lookup', function () {

	this.timeout(0);

	afterEach(function () {
		this.controller.shutdown();
	});
	
	beforeEach(function () {
		this.userInfo = {
			slackId: 'user123',
			channel: 'channel123',
		};

		var bot_options = {
			clientId: process.env.clientId,
			clientSecret: process.env.clientSecret,
			stats_optout: true,
			debug: true,
			scopes: ['bot'],
			studio_token: process.env.studio_token,
			studio_command_uri: process.env.studio_command_uri,
			interactive_replies: true
		};		
		
		this.controller = Botmock(bot_options);
		
		this.bot = this.controller.spawn({
			type: 'slack',
		});

		if (process.env.studio_token) {
            this.controller.on('direct_message,direct_mention,mention', function (bot, message) {
                bot.botkit.studio.runTrigger(bot, message.text, message.user, message.channel, message).then(function (convo) {
                    if (!convo) {
                        // no trigger was matched
                        // If you want your bot to respond to every message,
                        // define a 'fallback' script in Botkit Studio
                        // and uncomment the line below.
                        // controller.studio.run(bot, 'fallback', message.user, message.channel);
                    } else {
                        // set variables here that are needed for EVERY script
                        // use controller.studio.before('script') to set variables specific to a script
                        convo.setVar('current_time', new Date());
                    }
                }).catch(function (err) {
                    bot.reply(message, 'I experienced an error with a request to Botkit Studio: ' + err);
                    debug('Botkit Studio: ', err);
                });
            });
        } else {
            console.log('~~~~~~~~~~');
            console.log('NOTE: Botkit Studio functionality has not been enabled');
            console.log('To enable, pass in a studio_token parameter with a token from https://studio.botkit.ai/');
        }
		
		fileBeingTested(this.controller);
	});
	
	describe('label search conversation', function () {
		['direct_message', 'direct_mention'].forEach(function (eventType) {
			before(function () {
				this.term = 'km';
				
				this.buildSequence = function (messages) {
					return [
						{
							type: eventType, //if type null, default to direct_message
							user: this.userInfo.slackId, //user required for each direct message
							channel: this.userInfo.channel, // user channel required for direct message
							messages: messages
						}
					];
				};
			});
			
			describe('say km', function () {
				it("should return text looking up knowledge model concept URIs is something I'm good at!", function () {
					var messages = [{
						text: this.term,
						deep: 0, // usually userInput return last messages. deep to specify return lastIndex - deep
						isAssertion: true,
						timeout: 30000
					}];
					
					return this.bot.usersInput(this.buildSequence(messages)).then((message) => {
						return assert.equal(
							message.text,
							"looking up knowledge model concept URIs is something I'm good at!"
						);
					});
				});
			});
			
		});
	});
});
