"use strict";

process.env.DEBUG = 'develop';

const _ = require('lodash');
const babble = require('babble');
const develop = require('debug')('develop');
const Promise = require('bluebird');
let GeneralAgent = require('./../agents/GeneralPatternAgent');

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
    {title: 'Kabale und Liebe', price: Math.random()}
  ];

  Agent.skillAdd('eve-book-trading', '');

  Agent.listen('/./', function (from, message) {
    console.log(from, message);
    return Promise.delay( 1000 ).resolve('this');
  });

  Agent.receive((from, message) => {
    console.log('received', from, message);
  });

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
