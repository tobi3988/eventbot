# eventbot

Eventbot was developped, during the tsüri.ch Hackathon. (https://tsri.ch/zh/so-war-der-tsuri-hackathon-chatbots/)

## How to use it

Download project and dependencies
```bash
download project and dependencies
git clone https://github.com/tobi3988/eventbot.git
cd eventbot
npm install
```
Make sure to export the needed environment variables. The EVENT_BOT_TOKEN can be found or created in your Slack settings.
TSRI_USER and TSRI_PW have to be from a valid user of www.tsri.ch
```bash
export EVENT_BOT_TOK=xo...
export TSRI_USER=sample.user@mail.com
export TSRI_PW=password
```
Run eventbot
```bash

node bot.js
```
