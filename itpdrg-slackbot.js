module.exports = function (controller) {

    controller.setTickDelay(100);
    
    //var BotEngine = require(__dirname + '/itpdrg-botengine.js');

    // Set up an Express-powered webserver to expose oauth and webhook endpoints
    var webserver = require(__dirname + '/components/express_webserver.js')(controller);

    var oneSecond = 1000;
    var oneMinute = 60 * oneSecond;
    var oneHour = 60 * oneMinute;
    var oneDay = 24 * oneHour;

    webserver.get('/internal/status', function (req, res) {
        res.json({
            "alerting": {
                "emails": ["DRG-Data@springer.com"],
                "hipchat-rooms": ["ITPDRG"]
            }
        });
    });

    webserver.get('/internal/config', function (req, res) {
        res.json({ "name": "example" });
    });

    webserver.get('/internal/version', function (req, res) {
        res.json({ "revision": process.env.GIT_REVISION });
    });

    if (!process.env.clientId || !process.env.clientSecret) {

        // Load in some helpers that make running Botkit on Glitch.com better
        require(__dirname + '/components/plugin_glitch.js')(controller);

        webserver.get('/', function (req, res) {
            res.render('installation', {
                studio_enabled: controller.config.studio_token ? true : false,
                domain: req.get('host'),
                protocol: req.protocol,
                glitch_domain: process.env.PROJECT_DOMAIN,
                layout: 'layouts/default'
            });
        })

        var where_its_at = 'https://' + process.env.PROJECT_DOMAIN + '.glitch.me/';
        console.log('WARNING: This application is not fully configured to work with Slack. Please see instructions at ' + where_its_at);
    } else {

        webserver.get('/', function (req, res) {
            res.render('index', {
                domain: req.get('host'),
                protocol: req.protocol,
                glitch_domain: process.env.PROJECT_DOMAIN,
                layout: 'layouts/default'
            });
        })
        // Set up a simple storage backend for keeping a record of customers
        // who sign up for the app via the oauth
        require(__dirname + '/components/user_registration.js')(controller);

        // Send an onboarding message when a new team joins
        require(__dirname + '/components/onboarding.js')(controller);

        // Load in some helpers that make running Botkit on Glitch.com better
        require(__dirname + '/components/plugin_glitch.js')(controller);

        var normalizedPath = require("path").join(__dirname, "skills");
        require("fs").readdirSync(normalizedPath).forEach(function (file) {
            require("./skills/" + file)(controller);
        });

        // // own framework
        // controller.on('direct_message,direct_mention,mention', function(bot, message) {
        //   BotEngine.runTrigger(bot, message.text, message.user, message.channel, message).catch(function(err) {
        //     bot.reply(message, 'I experienced an error processing your message: ' + err);
        //     debug('my framework: ', err);
        //   });
        // });

        // This captures and evaluates any message sent to the bot as a DM
        // or sent to the bot in the form "@bot message" and passes it to
        // Botkit Studio to evaluate for trigger words and patterns.
        // If a trigger is matched, the conversation will automatically fire!
        // You can tie into the execution of the script using the functions
        // controller.studio.before, controller.studio.after and controller.studio.validate
        if (process.env.studio_token) {
            controller.on('direct_message,direct_mention,mention', function (bot, message) {
                controller.studio.runTrigger(bot, message.text, message.user, message.channel, message).then(function (convo) {
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
    }
}
