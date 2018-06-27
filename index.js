const ml5 = require('./ml5/index.js');
const TelegramBot = require('node-telegram-bot-api');
const token = require('./token').token;

const lstm = ml5.LSTMGenerator.LSTMGenerator('models/lstm/dubois');

const bot = new TelegramBot(token, {polling: true});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if(msg.text.toUpperCase().match('HEY JARVIS')){
    lstm.generate({
      seed: msg.text.replace(new RegExp('HEY JARVIS', "ig"), ''),
      length: Math.floor((Math.random() * 300) + 20),
      temperature: 0.5
    }, function(output){
      bot.sendMessage(chatId, output.generated);
    });
  } else{
    return;
  }
});
