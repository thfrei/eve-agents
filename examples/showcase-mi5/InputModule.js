"use strict";

const config = require('./../../config.js');

const _ = require('lodash');
const babble = require('babble');
const develop = require('debug')('develop');
const Promise = require('bluebird');
const uuid = require('uuid-v4');
let GeneralAgent = require('./../../agents/GeneralAgent');

var agentOptions = {
  id: 'Input',
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

var Agent = new GeneralAgent(agentOptions);

Agent.position = 100;
// TODO Input module takes cups (containers) -- it also is the start point of a reservation of xts transport
Agent.bottles = [
  {bottleType: 'longneck', size: 300}
];
Agent.taskList = [];

Promise.all([Agent.ready]).then(function () {
  Agent.events.on('registered',console.log);

  Agent.serviceAdd('getPosition', function(){ return Agent.position; });
  Agent.skillAddCAcfpParticipant('cfp-containerInput', checkParameters, reserve);

  function checkParameters (message, context) {
    return new Promise( (resolve, reject) => {
      develop('#checkParams', message, context);
      //let book = _.find(Agent.books, {title: message.title});
      if(true) {
        let offer = {price: Math.random()};
        develop('offer:', offer);
        resolve({propose: offer });
      } else {
        develop('not in stock');
        resolve({refuse: 'not in stock'});
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
        resolve({informDone: task}); // propose
      } else {
        develop('book could not be fetched in stock');
        resolve({failure: 'book could not be fetched in stock'}); // refuse
      }
    }).catch(console.error);
  }

  Agent.CArequestParticipant('request-give', give);
  function give(message, context){
    develop('#give', message, context);
    return new Promise((resolve, reject) => {
      resolve({inform: 'here you have it'});
    });
  }

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
