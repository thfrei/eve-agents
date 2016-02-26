"use strict";

process.env.DEBUG = 'develop';

const _ = require('lodash');
const babble = require('babble');
const develop = require('debug')('develop');
const Promise = require('bluebird');
const co = require('co');
const retry = require('co-retry');
const StateMachine = require('javascript-state-machine');
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

Agent.fsm = StateMachine.create({
  initial: 'ready',
  events: [
    { name: 'reserve',  from: 'ready',    to: 'reserved' },
    { name: 'block',    from: 'reserved', to: 'blocked'    },
    { name: 'unblock',  from: 'blocked',  to: 'reserved' },
    { name: 'unreserve',from: 'reserved', to: 'ready'  },
    { name: 'reset',    from: '*',        to: 'ready' },
  ]}
);

// discrete Positions that the Handling Robot can reach
Agent.positions = [1,5,10,15,20,30,40,50,70,80,90,99];
Agent.queue = [];

Agent.move = function(position){
  return new Promise( (resolve, reject) => {
    // if position can be reached
    if ( _.indexOf(Agent.positions, position) != -1 ) {
      setTimeout(resolve, 2000);
    } else {
      reject({err: 'position cannot be reached'});
    }
  });
};

Promise.all([Agent.ready]).then(function () {
  Agent.events.on('registered',console.log);

  //Agent.skillAddCAcfpParticipant('exe-transport', reserve, move);
  //function reserve (message, context) {
  //  develop(message, context);
  //  if(Agent.fsm.is('ready')){
  //    develop('transport is ready. now we reserve it');
  //    return {propose: 'transport was reserved'}
  //  } else {
  //    develop('transport is not ready, we cannot reserve');
  //    return {refuse: 'transport cannot be reserved'}
  //  }
  //}
  //function move(message, context) {
  //  return new Promise( (resolve, reject) => {
  //    develop(message, context);
  //
  //    setTimeout(function(){
  //      resolve({informDone: 'arrived at position'});
  //    });
  //  }).catch(console.error);
  //}
  Agent.skillAdd('transport-reserve', function(params, sender) {
    return {ok: 'reserved'};
  });
  Agent.skillAdd('transport-move', function(params, sender) {
    setTimeout(()=>{
      console.log('transport finished');
      //Agent.events.emit('transport-end', {agent: sender, orderId: '1337'});
      Agent.request(sender, 'transport-end', {orderId: 1233});
    }, 1000);
    return {ok: 'we start moving'}
  });

  // Register Skills
  Agent.register()
    .catch(console.log);


  // register at one tranpsort manager [0] // if multiple tranpsort manager, it doesnt matter
  let register = function* () {
    let transportManager = yield Agent.searchSkill('registerTransports');

    return Agent.request(transportManager[0].agent, 'registerTransports', {type: 'HandlingRobot', workingArea: Agent.positions})
      .then(function(result){
        if(result.err) {
          throw new Error(result.err);
        } else {
          console.log(result);
        }
      });
  };

  co(function* (){
    //yield retry(register, {factor: 1});
    yield register();
  }).catch(console.error);

  // deRegister upon exiting
  process.on('SIGINT', function(){
    console.log('taking down...');
    Agent.deRegister();

    // Deregister at Transport Manager
    co(function* () {
      let transportManager = yield Agent.searchSkill('registerTransports');
      return Agent.request(transportManager[0].agent, 'deRegisterTransports', '')
        .then(function(result){
          console.log(result);
        });
    });

    setTimeout(process.exit, 1000); // wait for deregistering complete
  });

}).catch(function(err){console.log('exe',err)});

module.exports = Agent;