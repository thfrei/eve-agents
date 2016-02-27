"use strict";

process.env.DEBUG = 'develop';

const _ = require('lodash');
const babble = require('babble');
const develop = require('debug')('develop');
const Promise = require('bluebird');
const uuid = require('uuid-v4');
const co = require('co');
const retry = require('co-retry');
let GeneralAgent = require('./../../agents/GeneralAgent');

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

// discrete Positions that the Handling Robot can reach
Agent.positions = [1,5,10,15,20,30,40,50,70,80,90,99];
Agent.taskList = [];

Agent.move = function(position){
  return new Promise( (resolve, reject) => {
    // if position can be reached
    if ( _.indexOf(Agent.positions, position) != -1 ) {
      console.log('!!!!!!!!!!!!!! ==== moving... 1s');

      setTimeout(resolve, 2000);
    } else {
      reject({err: 'position cannot be reached'});
    }
  });
};

Promise.all([Agent.ready]).then(function () {
  Agent.events.on('registered',console.log);

  //Agent.skillAdd('cfp-transport', Promise.reject('listener agent'));
  Agent.skillAddCAcfpParticipant('cfp-transport', calculatePrice, reserveTransport);
  Agent.register();
  function calculatePrice (message, context) {
    develop('calculatePrice', message, context);
    if(_.isEmpty(Agent.taskList)){
      //TODO we should check if we can reach the positions here
      return {propose: {price: Math.random()}};
    } else {
      develop('refuse, transport is reserved already');
      return {refuse: 'transport is already reserved. wait for completion'};
    }

  }
  //Agent.events.on('dispatch', dispatch);
  function reserveTransport (message, context) {
    develop('reserveTransport', message, context);
    if( !_.isEmpty(Agent.taskList) ){
      develop(Agent.taskList);
      return {failure: 'cannot reserve. transport is already reserved. '};
    } else {
      let task = {
        orderId: message.orderId,
        taskId: uuid(),
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
      return {inform: task};
    }
  }

  Agent.CArequestParticipant('request-dispatch', dispatch);
  function dispatch (objective, context) {
    develop('#request-dispatch', objective, context);
    let task = _.find(taskList, {taskId: objective.taskId});

    return co(function* (){
      yield Agent.move(task.task.from.position);
      yield requestGive(task.task.from.agent);
      yield Agent.move(task.task.to.position);
      yield requestTake(task.task.to.agent);
      _.remove(Agent.taskList, {taskId: task.taskId});
      develop('task successfully finished. removed. taskList:', Agent.taskList);
    }).catch((err) => {console.error('dispatch',err);});
  }
  function requestGive(participant, orderId) {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }
  function requestTake(participant, orderId) {
    return new Promise((resolve, reject) => {
      resolve();
    });
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