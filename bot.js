var Botkit = require('botkit');
var controller = Botkit.slackbot();
var request = require('superagent');
var moment = require('moment');

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

            var events = res.body.objects;
            if(events.length > 0){
                bot.reply(message, "Ich habe " + events.length + " Events gefunden.");

                for(var i=0; i<3 && events.length >i; i++) {

                    var reply_with_attachments = {
                        'username': 'Eventbot',
                        'text': 'Der ' + (i + 1) +'. Event:',
                        'attachments': [
                            {
                                'fallback': 'To be useful, I need you to invite me in a channel.',
                                'title': events[i].title,
                                'text': events[i].description,
                                'color': '#7CD197'
                            }
                        ],
                        'icon_url': events[i].image
                    }
                    bot.reply(message, reply_with_attachments);
                }
            } else {
                bot.reply(message, 'Sorry, heute läuft nichts');
            }
        });
}

function replyEventsToday(bot, message) {
    var today = new Date().toISOString().slice(0, 10);
    getEventsAndReply(bot, message, today);
}

const days_of_the_week = [
  /(sunntig?|sonntag)/i,
  /(mäntig?|montag)/i,
  /(dienstag)/i,
  /(mittwoch)/i,
  /(donnschtig?|donnerstag)/i,
  /(frit.g?|freitag)/i,
  /(samscht.g?|samstag)/i,
];

controller.hears(
    ['.*'],
    ['direct_message', 'direct_mention'],
    function (bot, message) {
        if (/(heute|hüt)/i.test(message.text)) {
            replyEventsToday(bot, message);
            return;
        } else if (/(morgen|morn)/i.test(message.text)) {
            var date = new Date();
            date.setDate(date.getDate() + 1);
            var tomorrow = date.toISOString().slice(0, 10);
            getEventsAndReply(bot, message, tomorrow);
            return;
        } else {
            var now = moment();

            for (var i=0; i<days_of_the_week.length; ++i) {
                if (days_of_the_week[i].test(message.text)) {
                    now.day(7 + i);
                    getEventsAndReply(bot, message, now.format('YYYY-MM-DD'));
                    return;
                }
            }
        }

        bot.reply(message, 'Sorry, säg nomau.')
    }
);

controller.hears(
    ['was l.*ft'],
    ['ambient'],
    function (bot, message) {
        replyEventsToday(bot, message);
    }
);
