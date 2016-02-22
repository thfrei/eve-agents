"use strict";

process.env.DEBUG = 'develop';

const _ = require('lodash');
const babble = require('babble');
const develop = require('debug')('develop');
const Promise = require('bluebird');
const co = require('co');
const retry = require('co-retry');
let GeneralAgent = require('./../agents/GeneralAgent');

var agentOptions = {
  id: 'BuyerPromises',
  DF: 'DFUID',
  transports: [
    {
      type: 'amqp',
      url: 'amqp://localhost'
      //host: 'dev.rabbitmq.com'
    }
  ]
};

var Agent = new GeneralAgent(agentOptions);

Promise.all([Agent.ready]).then(function () {
  Agent.events.on('registered',develop);
  // Register Skills
  Agent.register();

  co(function* () {
    let conv = 'cfp-book-trading';
    let obj = 'Harry Potter';
    let sellers = yield Agent.searchSkill(conv);
    console.log(sellers);

    // ask all sellers for book (conv, obj)
    let propositions = yield Promise.all(_.map(sellers, (seller) => {return cfp(seller.agent, conv, obj);}));
    console.log('propositions', propositions);

    // Filter refused cfps
    _.remove(propositions, (prop) => { if(prop.refuse) { return true; }});
    console.log('clean propositions', propositions);

    // Get offer with lowest price
    let bestOffer = _.minBy(propositions, (offer) => {return offer.price});
    if(typeof bestOffer == 'undefined') {
      console.log('book is not available, nowhere');
    } else {
      console.log('bestOffer', bestOffer);

      // Tell seller with bestoffer to buy
      let inform = yield acceptProposal(bestOffer.agent, conv+'-accept', obj);
      console.log(inform);
    }
  });

  function cfp(seller, conversation, objective){
    console.log('getP', seller);
    return new Promise( (resolve, reject) => {
      Agent.tell(seller, conversation)
        .tell(function (message, context) {
          return {title: objective};
        })
        .listen(function (message, context) {
          develop('refuse/propose?', context, ': ', message);
          return message;
        })
        .tell(function (message, context) {
          if (message.refuse) {
            develop('refused', message);
            //let ret = message.refuse;
            //ret.agent = context;
            resolve(message);
          }
          if (message.propose) {
            develop('propsed:', message);
            let ret = message.propose;
            ret.agent = context.from; //add seller name to propositions
            resolve(ret);
          }
        });
    });
  }

  function acceptProposal(seller, conversation, objective){
    console.log('accP', seller);
    return new Promise( (resolve, reject) => {
      Agent.tell(seller, conversation)
        .tell(function (message, context) {
          return {title: objective};
        })
        .listen(function (message, context) {
          develop('failure, done, result?', context, ': ', message);
          resolve(message);
        })
    });
  }

  // deRegister upon exiting
  process.on('SIGINT', function(){
    console.log('taking down...');
    Agent.deRegister();
    setTimeout(process.exit, 500); // wait for deregistering complete
  });

}).catch(function(err){console.log('exe',err)});

