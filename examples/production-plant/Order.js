"use strict";

process.env.DEBUG = 'develop';

const _ = require('lodash');
const babble = require('babble');
const develop = require('debug')('develop');
const Promise = require('bluebird');
const co = require('co');
const retry = require('co-retry');
let GeneralAgent = require('./../../agents/GeneralAgent');

var agentOptions = {
  id: 'Order1',
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

  // order
  let order = [
    {
      service: 'bottleInput',
      parameters: {
        bottleType: 'longneck', size: 300
      }
    },
    {
      service: 'print',
      parameters: {
        logo: '1.gif',
        bottleType: 'longneck', size: 300
      }
    },
    {
      service: 'fill',
      parameters: {
        liquids: [{type: 'lemonade', amount: 150}, {type: 'weissbier', amount: 150}]
      }
    },
    {
      service: 'close',
      parameters: {
        bottletype: 'longneck'
      }
    },
    {
      service: 'bottleOutput',
      parameters: {
        size: 300
      }
    }
  ];


  co(function* () {
    // logic
  }).catch(console.error);

  // deRegister upon exiting
  process.on('SIGINT', function(){
    console.log('taking down...');
    Agent.deRegister();
    setTimeout(process.exit, 500); // wait for deregistering complete
  });
}).catch(function(err){console.log('exe',err)});

