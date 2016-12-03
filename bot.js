var Botkit = require('botkit');
var controller = Botkit.slackbot();
var request = require('superagent');

controller.spawn({
    token: process.env.EVENT_BOT_TOKEN
}).startRTM(function (err, bot, payload) {
    if (!err) return;

    console.log(err);
    throw new Error('Unable to connect to Slack');
});

controller.hears(
    ['hey'],
    ['ambient'],
    function (bot, message) {
        bot.api.users.info(
            {user: message.user},
            function(error, response) {
                console.log(response.user);
                bot.reply(message, '@' + response.user.name + ' hey!');
            }
        );
        // console.log(info);
        // bot.reply(message, 'Hey ' + message.user);
    }
);

controller.hears(
    ['heute'],
    ['direct_message', 'direct_mention'],
    function (bot, message) {
        console.log('heute');
        request
            .get('https://tsri.ch/api/v0/agenda/')
            .auth(process.env.TSRI_USER, process.env.TSRI_PW)
            .end(function(err, res){
                console.log(res.body);
            });
    }
);