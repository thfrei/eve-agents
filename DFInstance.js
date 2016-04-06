"use strict";

process.env.DEBUG = 'develop';

const config = require('./config.js');

const develop = require('debug')('develop');
const Promise = require('bluebird');
let DFAgent = require('./agents/DFAgent');

const options = {
  id: config.DF, // TODO find out, why on localhost DF is now blocked?
  transports: [
    {
      type: 'amqp',
      url: config.amqpHost
      //host: 'dev.rabbitmq.com'
    }
  ],
  mqtt: config.mqttHost
};

let DF = new DFAgent(options);

Promise.all([DF.ready]).then(function () {
  console.log('agent ', options.id, ' ready');

  DF.events.on('registered', (msg)=>{
    develop("registered agent:\n",msg);
    DF.mqtt.publish('/df/agent/registered', JSON.stringify(msg));
  });
  DF.events.on('deRegistered', (msg)=>{
    develop("deRegistered agent:\n",msg);
    DF.mqtt.publish('/df/agent/deRegistered', JSON.stringify(msg));
  });
  DF.events.on('agentsChanged', (msg)=>{
    develop("agents Changed:\n",msg);
    DF.mqtt.publish('/df/agent/list', JSON.stringify(msg));
  });

}).catch(console.log);