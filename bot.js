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
      bot.startConversation(message, function (err, convo) {
        if (events.length > 0) {


          convo.say("<@" + message.user + ">, ich habe " + events.length + " Events gefunden.");

          for (let i = 0, len = Math.min(events.length, 3); i < len; i++) {

            convo.say({
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
            });
          }


        } else {
          convo.say('Sorry, es läuft nichts');
        }
      });
    });
}

const daysOfTheWeek = [
  /(sunntig?|sonntag)/i,
  /(mänt(i|a)g?|montag)/i,
  /(dienstag|zischt(i|a)g?)/i,
  /(mittw.ch)/i,
  /(d.nn?schtig?|donnerstag)/i,
  /(frit.g?|freitag)/i,
  /(samscht.g?|samstag)/i,
];

function getMoment(text) {
  if (/(heute|hüt|was l.*ft)/i.test(text)) {
    return moment();
  } else if (/(morgen|morn)/i.test(text)) {
    return moment().add(1, 'days');
  } else {
    for (let i = 0; i < daysOfTheWeek.length; ++i) {
      if (daysOfTheWeek[i].test(text)) {
        return moment().day(7 + i);
      }
    }
  }
  return null;
}

const categories = [
  ['konzert', /konzert/i],
  ['diverses', /divers/i],
  ['kino', /kino/i],
  ['disko', /dis(k|c)o/i],
  ['theater', /theater/i],
  ['ausstellung', /ausstellung/i],
  ['diskussion', /diskussion/i],
];

function getCategory(text) {
  for (let [slug, matcher] of categories) {
    if (matcher.test(text)) return slug;
  }
}

function replyMisunderstand(bot, message) {
  bot.reply(message, "Sorry, ich hä di nit verstande.")
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
    if (Object.keys(query).length > 0) {
      getEventsAndReply(bot, message, query);
    } else {
      replyMisunderstand(bot, message);
    }
  }
);

controller.hears(
  ['was l.*ft'],
  ['ambient'],
  function (bot, message) {
    getEventsAndReply(bot, message, {date: moment().format('YYYY-MM-DD')});
  }
);
