"use strict";

const config = require('./../../config.js');

const _ = require('lodash');
const babble = require('babble');
const develop = require('debug')('develop');
const Promise = require('bluebird');
const uuid = require('uuid-v4');
let GeneralAgent = require('./../../agents/GeneralAgent');

const agentOptions = {
  id: 'BottleInput'+uuid(),
  DF: config.DF,
  transports: [
    {
      type: 'amqp',
      url: config.amqpHost
      //host: 'dev.rabbitmq.com'
    }
  ],
  mqtt: config.mqttHost
};

let Agent = new GeneralAgent(agentOptions);

Agent.bottles = [
  {bottleType: 'longneck', size: 300}
];
Agent.taskList = [];

Promise.all([Agent.ready]).then(function () {
  Agent.events.on('registered',console.log);

  Agent.serviceAddCAcfpParticipant('cfp-bottleInput', checkParameters, reserve);

  function checkParameters (message, context) {
    return new Promise( (resolve, reject) => {
      develop('#checkParams', message, context);
      //let book = _.find(Agent.books, {title: message.title});
      if(true) {
        let offer = {price: Math.random()};
        develop('offer:', offer);
        resolve({propose: offer });
      } else {
        let msg = 'task cannot be performed';
        develop(msg);
        resolve({failure: msg});
      }
    }).catch(console.error);
  }

  function reserve(message, context) {
    return new Promise( (resolve, reject) => {
      develop('#reserve', message, context);

      let task = {taskId: 'input-'+uuid()};
      Agent.taskList.push(task);

      if(true) {
        develop('inform-result:', task);
        resolve({inform: task}); // propose
      } else {
        let msg = 'task could not be reserved';
        develop(msg);
        resolve({failure: msg});
      }
    }).catch(console.error);
  }

  Agent.CArequestParticipant('request-give', give);
  function give(message, context){
    develop('#give', message, context);
    return new Promise((resolve, reject) => {
      console.log('request-give: here you have it');
      resolve({inform: 'here you have it'});
    });
  }

  // Register Services
  Agent.register()
    .catch(console.log);

  // deRegister upon exiting
  process.on('SIGINT', function(){
    console.log('taking down...');
    Agent.deRegister();
    setTimeout(process.exit, 500); // wait for deregistering complete
  });

}).catch(function(err){console.log('exe',err)});
