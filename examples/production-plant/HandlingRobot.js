"use strict";

const config = require('./../../config.js');

const _ = require('lodash');
const babble = require('babble');
const develop = require('debug')('develop');
const Promise = require('bluebird');
const uuid = require('uuid-v4');
const co = require('co');
const retry = require('co-retry');
let GeneralAgent = require('./../../agents/GeneralAgent');

const agentOptions = {
  id: 'HandlingRobot'+uuid(),
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

// discrete Positions that the Handling Robot can reach
Agent.positions = [1,5,10,15,20,30,40,50,70,80,90,99];
Agent.taskList = [];

Agent.move = function(position){
  return new Promise( (resolve, reject) => {
    // if position can be reached
    if ( _.indexOf(Agent.positions, position) != -1 ) {
      console.log('!!!!!!!!!!!!!! ==== moving... 0s');

      Agent.timer.setTimeout(resolve, 0);
    } else {
      reject({err: 'position cannot be reached'});
    }
  });
};

Promise.all([Agent.ready]).then(function () {
  Agent.events.on('registered',console.log);

  Agent.serviceAddCAcfpParticipant('cfp-transport', calculatePrice, reserveTransport);
  Agent.register();
  function calculatePrice (message, context) {
    return new Promise((resolve, reject) => {
      develop('calculatePrice', message, context);
      if(_.isEmpty(Agent.taskList)){
        //TODO we should check if we can reach the positions here
        resolve({propose: {price: Math.random()}});
      } else {
        develop('refuse, transport is reserved already');
        resolve({refuse: 'transport is already reserved. wait for completion'});
      }
    });
  }
  //Agent.events.on('dispatch', dispatch);
  function reserveTransport (message, context) {
    return new Promise((resolve, reject) => {
      develop('reserveTransport', message, context);
      if (!_.isEmpty(Agent.taskList)) {
        develop(Agent.taskList);
        resolve({failure: 'cannot reserve. transport is already reserved. '});
      } else {
        let task = {
          orderId: message.orderId,
          taskId: 'transport-' + uuid(),
          agent: Agent.id,
          task: {
            from: message.from,
            to: message.to
          }
        };
        Agent.taskList.push(task);
        develop('task is now in tasklist:', Agent.taskList);
        //Agent.events.emit('dispatch', task);
        //develop('dispatched!');
        resolve({inform: task});
      }
    });
  }

  Agent.CArequestParticipant('request-execute', dispatch);
  function dispatch (objective, context) {
    return new Promise((resolve, reject) => {
      'use strict';

      develop('#request-execute', objective, context);
      let job = _.find(Agent.taskList, {taskId: objective.taskId});
      console.log('task', job);

      co(function* () {
        yield Agent.move(10);
        yield requestGive(job.task.from.agent, job.task.from.taskId);
        yield Agent.move(10);
        yield requestTake(job.task.to.agent, job.task.to.taskId);
        _.remove(Agent.taskList, {taskId: job.taskId});
        develop('task successfully finished. removed. taskList:', Agent.taskList);
        resolve({inform: 'done'});
      }).catch((err) => {
        console.error('dispatchErr', err);
        reject({err: err});
      });
    });
  }
  function requestGive(participant, taskId) {
    develop('requestGive', participant, taskId);
    return Agent.CArequest(participant, 'request-give', taskId);
  }
  function requestTake(participant, taskId) {
    develop('requestTake', participant, taskId);
    return Agent.CArequest(participant, 'request-take', taskId);
  }

  // deRegister upon exiting
  process.on('SIGINT', function(){
    console.log('taking down...');
    Agent.deRegister();
    setTimeout(process.exit, 500); // wait for deregistering complete
  });

}).catch(function(err){console.log('exe',err)});

module.exports = Agent;