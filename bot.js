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
            function (error, response) {
                console.log(response.user);
                bot.reply(message, '@' + response.user.name + ' hey!');
            }
        );
        // console.log(info);
        // bot.reply(message, 'Hey ' + message.user);
    }
);

function getEventsAndReply(bot, message, date) {
    request
        .get('https://tsri.ch/api/v0/agenda/?date=' + date + '')
        .auth(process.env.TSRI_USER, process.env.TSRI_PW)
        .end(function (err, res) {

            if(res.body.objects.length > 0){
                var reply_with_attachments = {
                    'username': 'Eventbot',
                    'text': 'Der naechste Event:',
                    'attachments': [
                        {
                            'fallback': 'To be useful, I need you to invite me in a channel.',
                            'title': res.body.objects[0].title,
                            'text': res.body.objects[0].description,
                            'color': '#7CD197'
                        }
                    ],
                    'icon_url': res.body.objects[0].image
                }
                bot.reply(message, reply_with_attachments);
            } else {
                bot.reply(message, 'Sorry, heute läuft nichts');
            }
        });
}

controller.hears(
    ['heute', 'hüt'],
    ['direct_message', 'direct_mention'],
    function (bot, message) {
        var today = new Date().toISOString().slice(0, 10);
        getEventsAndReply(bot, message, today);
    }
);

controller.hears(
    ['morgen', 'morn'],
    ['direct_message', 'direct_mention'],
    function (bot, message) {
        var date = new Date();
        date.setDate(date.getDate() + 1);
        var tomorrow = date.toISOString().slice(0, 10);
        getEventsAndReply(bot, message, tomorrow);
    }
);

