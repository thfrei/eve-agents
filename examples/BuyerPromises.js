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
  Agent.events.on('registered',develop);
  // Register Skills
  Agent.register();

  function* buyBook(book) {
    let sellers = yield Agent.searchSkill('sell');
    console.log('seller found', sellers);

    try {
      // Get offers
      let offers = yield Promise.all(_.map(sellers, (seller) => {
        let request = {method: 'queryBook', params: {title: 'Harry Potter'}};
        return Agent.request(seller.agent, request);
      }));
      console.log('offers', offers);

      // filter the ones who do not sell
      offers = _.filter(offers, (offer) => {
        return _.isEmpty(offer.err);
      });
      develop('filtered offers', offers);

      let bestOffer = _.minBy(offers, (offer) => {return offer.price});
      develop('bestOffer', bestOffer);

      if( bestOffer ) {
        let request = {method: 'buyBook', params: {title: bestOffer.title}};
        let result = yield Agent.request(bestOffer.agent, request);
        console.log(result);
      } else {
        console.log('book ', book, 'is not in stock anymore');
      }

    } catch(err) { develop('trycatch', err); }

  }

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

  process.on('SIGINT', function(){
    console.log('taking down...');
    Agent.deRegister();
    setTimeout(process.exit, 500); // wait for deregistering complete
  });

}).catch(function(err){console.log('exe',err)});

