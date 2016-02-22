"use strict";

var RequestAgent = require('./RequestAgent');

// create two agents
var agent1 = new RequestAgent('agent1');
var agent2 = new RequestAgent('agent2');

agent1.addConversation('book-trading-cfp', bookTradingCFP);
agent2.addConversation('book-trading-propose', bookTradingCFP);
agent2.addConversation('add', sum);
agent1.addConversation('add', sum);

function sum(message) {
  console.log(this.id,'calculating...');
  //return Promise.resolve(from, (message.a + message.b));
  //return [from, message.a + message.b];
  return message.a + message.b;
}

function bookTradingCFP(from, message) {
  console.log(from, 'wants', message);

  return new Promise(function(res, rej){
    setTimeout(()=>{
      res('100');
    }, 500);
  });
}

// send a request to agent 1, await the response
//agent2.request('agent1', {conversation: 'book-trading-cfp', body: 'hp'})
//  .then(function(reply) {
//    console.log('reply: ' + reply);
//  });

//agent2.ask('agent1', 'book-trading-cfp', 'hp')
//  .then(function(reply) {
//    //console.log('convTyp', this.getConversations());
//    console.log('reply: ' + reply);
//  })
//  .catch(console.error);

agent1.ask('agent2', 'add', {a:0.421234, b:0.532345})
  .then(function(reply){
    console.log('reply', reply);
    return this.ask('agent2', 'add', {b: 1, a: 2});
  })
  .then(console.log)
  .catch(console.error);

agent1.setDF('DFUID');
