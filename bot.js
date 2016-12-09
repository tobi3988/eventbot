const Botkit = require('botkit');
const controller = Botkit.slackbot();
const request = require('superagent');
const moment = require('moment');

const eventsPerPage = 3;

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
function replyEvents(convo, events) {

  for (let event of events.slice(0, eventsPerPage)) {
    convo.say({
      'username': 'Eventbot',
      'attachments': [
        {
          'title': event.title + ' (' + event.pretty_time + ')',
          'text': event.description,
          'color': '#7CD197'
        }
      ],
      'icon_url': event.image
    });
  }
}

function showMore(convo, events) {
  if (events.length > eventsPerPage) {
    convo.ask('Willt nu meh events gseh?', function (response, convo) {
      events.splice(0, eventsPerPage);

      if (/ja|yes|jo/i.test(response.text)) {
        replyEvents(convo, events);
        convo.next();
        showMore(convo, events);
      } else {
        convo.say('ok');
        convo.next();
      }
    });

  }
}

function getEventsAndReply(bot, message, query) {
  request
    .get('https://tsri.ch/api/v0/agenda/')
    .query(query)
    .auth(process.env.TSRI_USER, process.env.TSRI_PW)
    .end(function (err, res) {

      let events = res.body.objects;
      let numberOfEvents = events.length;
      bot.startConversation(message, function (err, convo) {
        if (numberOfEvents > 0) {
          convo.say("<@" + message.user + ">, ich habe " + numberOfEvents + " Events gefunden.");
          replyEvents(convo, events);
          showMore(convo, events);
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
