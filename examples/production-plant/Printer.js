"use strict";

const config = require('./../../config.js');

const _ = require('lodash');
const babble = require('babble');
const develop = require('debug')('develop');
const Promise = require('bluebird');
const uuid = require('uuid-v4');
const co = require('co');
let GeneralAgent = require('./../../agents/GeneralAgent');

const agentOptions = {
  id: 'Printer'+uuid(),
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

Agent.fileFormats = [
  {type: 'jpg'},
  {type: 'png'}
];
Agent.taskList = [];

Agent.execute = function(){
  return new Promise( (resolve, reject) => {
    // if position can be reached
      console.log('execute.......');
      Agent.timer.setTimeout(resolve, 2000);
  });
};

Promise.all([Agent.ready]).then(function () {
  Agent.events.on('registered',console.log);

  Agent.skillAddCAcfpParticipant('cfp-print', checkParameters, reserve);

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
        resolve({refuse: msg});
      }
    }).catch(console.error);
  }

  function reserve(message, context) {
    return new Promise( (resolve, reject) => {
      develop('#reserve', message, context);

      let task = {taskId: 'print-'+uuid()};
      Agent.taskList.push(task);

      if(true) {
        develop('inform:', task);
        resolve({inform: task});
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
      resolve({inform: 'here you have it'});
    });
  }

  Agent.CArequestParticipant('request-take', take);
  function take(message, context){
    develop('#take', message, context);
    return new Promise((resolve, reject) => {
      resolve({inform: 'i took it'});
    });
  }

  Agent.CArequestParticipant('request-execute', execute);
  function execute (objective, context) {
    develop('#execute', objective, context);

    return new Promise((resolve, reject) => {
      co(function* () {
        let job = _.find(Agent.taskList, {taskId: objective.taskId});
        console.log('task', job);
        yield Agent.execute();
        _.remove(Agent.taskList, {taskId: job.taskId});
        develop('task successfully finished. removed. taskList:', Agent.taskList);
        resolve({inform: 'done'});

      }).catch(console.error);
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
