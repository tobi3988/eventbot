const Botkit = require('botkit');
const controller = Botkit.slackbot();
const request = require('superagent');
const moment = require('moment');

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
      bot.reply(message, '<@' + message.user + '> hey!');
    }
);

function getEventsAndReply(bot, message, query) {
  request
    .get('https://tsri.ch/api/v0/agenda/')
    .query(query)
    .auth(process.env.TSRI_USER, process.env.TSRI_PW)
    .end(function (err, res) {

      let events = res.body.objects;
      if (events.length > 0) {

        bot.startConversation(message, function (err, convo) {

          convo.say("<@" + message.user + ">, ich habe " + events.length + " Events gefunden.");

          for (let i = 0, len=Math.min(events.length, 3); i < len; i++) {

            let reply_with_attachments = {
              'username': 'Eventbot',
              'text': '',
              'attachments': [
                {
                  'fallback': 'To be useful, I need you to invite me in a channel.',
                  'title': events[i].title + ' (' + events[i].pretty_time + ')',
                  'text': events[i].description,
                  'color': '#7CD197'
                }
              ],
              'icon_url': events[i].image
            }
            convo.say( reply_with_attachments);
          }
        });
      } else {
        convo.say( 'Sorry, es läuft nichts');
      }
    });
}

const days_of_the_week = [
    /(sunntig?|sonntag)/i,
    /(mänt(i|a)g?|montag)/i,
    /(dienstag|zischt(i|a)g?)/i,
    /(mittw.ch)/i,
    /(d.nn?schtig?|donnerstag)/i,
    /(frit.g?|freitag)/i,
    /(samscht.g?|samstag)/i,
];

function getMoment(text) {
  if (/(heute|hüt)/i.test(text)) {
    return moment();
  } else if (/(morgen|morn)/i.test(text)) {
    return moment().add(1, 'days');
  } else {
    for (let i = 0; i < days_of_the_week.length; ++i) {
      if (days_of_the_week[i].test(text)) {
        return moment().day(7 + i);
      }
    }
  }
  return null;
}

function getCategory(text) {
  if (/konzert/i.test(text)) {
    return 'konzert';
  }
  if (/divers.*/i.test(text)) {
    return 'diverses';
  }
  if (/kino/i.test(text)) {
    return 'kino';
  }
  if (/dis(k|c)o/i.test(text)) {
    return 'disko';
  }
  if (/theater/i.test(text)) {
    return 'theater';
  }
  if (/ausstellung/i.test(text)) {
    return 'ausstellung';
  }
  if (/diskussion/i.test(text)) {
    return 'diskussion';
  }
}

controller.hears(
  ['.*'],
  ['direct_message', 'direct_mention'],
  function (bot, message) {
    let query = {},
      category = getCategory(message.text),
      day = getMoment(message.text);

    if (category) query.category = category;
    if (day) query.date = day.format('YYYY-MM-DD');

    getEventsAndReply(bot, message, query);
  }
);

controller.hears(
  ['was l.*ft'],
  ['ambient'],
  function (bot, message) {
    getEventsAndReply(bot, message, {date: moment().format('YYYY-MM-DD')});
  }
);
