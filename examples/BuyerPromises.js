"use strict";

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
  // Tell how to take Down
  process.on('SIGINT', takeDown);
  process.on('uncaughtException', takeDown);
  Agent.events.on('registered',develop);
  // Register Skills
  Agent.register();

  function* buyBook(book) {
    let sellers = yield Agent.searchSkill('sell');
    console.log(sellers);

    try {
      //let offers = yield Promise.settle(_.map(sellers, (seller) => {
      //  let request = {method: 'queryBook', params: {title: 'Harry Potter'}};
      //  return Agent.request(seller.agent, request);
      //}));
      let offers = yield Promise.all(_.map(sellers, (seller) => {
        let request = {method: 'queryBook', params: {title: 'Harry Potter'}};
        return Agent.request(seller.agent, request);
      }));
      console.log(offers);
    } catch(err) { console.log(err); }


  }

  // With retry
  co(function* (){
    try{
      //let book = yield retry(buyBook.bind(this,'Harry Potter'),
      //  {retries: 100, interval: 500, factor: 1});
      let success = yield buyBook('Herry Potter');
    } catch (err) {
      develop('cocatch',err);
    }

    console.log(book);
  });

}).catch(function(err){console.log('exe',err)});

function takeDown(){
  // extra function is needed for closure on event
  Agent.deRegister();
  process.exit();
}

