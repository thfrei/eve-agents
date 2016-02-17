"use strict";

process.env.DEBUG = 'develop';

const develop = require('debug')('develop');
const Promise = require('bluebird');
let DFAgent = require('./agents/DFAgent');
const _ = require('lodash');

const options = {
  id: 'DFUID', // TODO find out, why on localhost DF is now blocked?
  transports: [
    {
      type: 'amqp',
      url: 'amqp://localhost'
      //host: 'dev.rabbitmq.com'
    }
  ]
};

let DF = new DFAgent(options);

Promise.all([DF.ready]).then(function () {
  console.log('agent ', options.id, ' ready');

  DF.events.on('registered', (msg)=>{develop("registered agent:\n",msg);});
  DF.events.on('deRegistered', (msg)=>{develop("deRegistered agent:\n",msg);});
  DF.events.on('agentsChanged', (msg)=>{develop("agents Changed:\n",msg);});

}).catch(console.log);