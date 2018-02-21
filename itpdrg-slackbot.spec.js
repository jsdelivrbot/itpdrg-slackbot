'use strict';
const assert = require('assert');
const Botmock = require('botkit-mock');

var debug = require('debug')('botkit:main');

var env = require('node-env-file');
env(__dirname + '/.env');


// if (!process.env.clientId || !process.env.clientSecret || !process.env.PORT) {
//   usage_tip();
//   // process.exit(1);
// }

const itpdrgSlackbot = require("./itpdrg-slackbot");

describe("controller tests", () => {
  beforeEach((done) => {
    this.userInfo = {
      slackId: 'user123',
      channel: 'channel123',
    };

    this.controller = Botmock({
      debug: false,
    });

    this.bot = this.controller.spawn({
      type: 'slack',
    });

    this.controller.startTicking();

    itpdrgSlackbot(this.controller);
    done();
  });

  afterEach(() => {
    this.controller.shutdown();
  })

  it('should return "Say something and I try to understand it!" when user types "pos"', () => {
    let sequence = [
			{
				//type: null, //if type null, default to direct_message
				user: this.userInfo.slackId, //user required for each direct message
				channel: this.userInfo.channel, // user channel required for direct message
				messages: [
					{
						text: 'pos',
						isAssertion: true,
					}
				]
			}
		];
		
		return this.bot.usersInput(sequence).then((message) => {
			return assert.equal(message.text, 'Say something and I try to understand it!');
		});
  })
});
