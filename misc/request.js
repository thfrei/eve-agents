var RequestAgent = require('./RequestAgent');

// create two agents
var agent1 = new RequestAgent('agent1');
var agent2 = new RequestAgent('agent2');

agent1.addConversationType('book-trading-cfp', bookTradingCFP);

function bookTradingCFP(from, message) {
  "use strict";
  console.log(from, 'wants', message);

  return new Promise(function(res, rej){
    setTimeout(()=>{
      res('100');
    }, 2*1000);
  });
}

// send a request to agent 1, await the response
//agent2.request('agent1', {conversation: 'book-trading-cfp', body: 'hp'})
//  .then(function(reply) {
//    console.log('reply: ' + reply);
//  });

agent2.ask('agent1', 'book-trading-cfp', 'hp')
  .then(function(reply) {
    console.log('reply: ' + reply);
  })
  .catch(console.error);

