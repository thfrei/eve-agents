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

var agentOptions = {
  id: 'XTS1',
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

//TODO implement reserve/unreserve services (xts is different from handling robot, because the mover will be reserved during complete production
var Agent = new GeneralAgent(agentOptions);

Agent.taskList = [];

Agent.move = function(position){
  return new Promise( (resolve, reject) => {
    setTimeout(resolve, 500);
  });
};

Promise.all([Agent.ready]).then(function () {
  Agent.events.on('registered',console.log);

  //Agent.serviceAdd('cfp-transport', Promise.reject('listener agent'));
  Agent.skillAddCAcfpParticipant('cfp-transport', calculatePrice, reserveTransport);
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
        let fromPosition = yield Agent.request(job.task.from.agent, 'getPosition');
        console.log('fromPosition', fromPosition);
        yield Agent.move(fromPosition); // TODO here must be real position
        yield requestGive(job.task.from.agent, job.task.from.taskId);

        let toPosition = yield Agent.request(job.task.to.agent, 'getPosition');
        console.log('toPosition', toPosition);
        yield Agent.move(toPosition);
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



  //co(function* (){
  //  // Main control flow behaviour
  //}).catch(console.error);

  // deRegister upon exiting
  process.on('SIGINT', function(){
    console.log('taking down...');
    Agent.deRegister();
    setTimeout(process.exit, 500); // wait for deregistering complete
  });

}).catch(function(err){console.log('exe',err)});

module.exports = Agent;