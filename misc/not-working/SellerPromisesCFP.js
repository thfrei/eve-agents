"use strict";

process.env.DEBUG = 'develop';

const _ = require('lodash');
const babble = require('babble');
const develop = require('debug')('develop');
const Promise = require('bluebird');
let GeneralAgent = require('./../agents/GeneralAgent');

var agentOptions = {
  //id: 'PromiseSeller',
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
  Agent.events.on('registered',console.log);

  Agent.books = [
    {title: 'Harry Potter', price: Math.random()},
    {title: 'Harry Potter', price: Math.random()},
    {title: 'Faust', price: Math.random()},
    {title: 'Faust', price: Math.random()},
    {title: 'Faust', price: Math.random()},
    {title: 'Kabale und Liebe', price: Math.random()}
  ];

  Agent.skillAdd('sell', Promise.resolve('sell via cfp'));

  // CFP Listeners
  Agent.skillAdd('cfp', (params, sender) => {
    let book = _.find(self.books, {title: params.title});
    console.log(book);
    if (book) {
      Agent.request(sender, 'propose', book);
    } else {
      Agent.request(sender, 'refuse', {msg: 'not in stock'})
    }
    return 'ack';
  });              // seller
  Agent.skillAdd('refuse');           // buyer
  Agent.skillAdd('propose');          // buyer
  Agent.skillAdd('reject-proposal');  // seller
  Agent.skillAdd('accept-proposal');  // seller
  Agent.skillAdd('failure');          // buyer
  Agent.skillAdd('inform-done');      // buyer
  Agent.skillAdd('inform-result');    // buyer

  // Register Skills
  Agent.register()
    .catch(console.log);

  // deRegister upon exiting
  process.on('SIGINT', function(){
    console.log('taking down...');
    Agent.deRegister();
    setTimeout(process.exit, 500); // wait for deregistering complete
  });

}).catch(function(err){console.log('exe',err)});
