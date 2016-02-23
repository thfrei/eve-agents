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

Promise.all([Agent.ready]).then(function () {
  Agent.events.on('registered',console.log);

  Agent.skillAdd('transport-negotiation', '');
  Agent.skillAdd('transport-reserve', '');
  Agent.skillAdd('transport-block', '');
  Agent.skillAdd('transport-dispatch', '');
  Agent.skillAdd('transport-unblock', '');
  Agent.skillAdd('transport-unreserve', '');
  // Register Skills
  Agent.register()
    .catch(console.log);

  // register at one tranpsort manager [0] // if multiple tranpsort manager, it doesnt matter
  let register = function* () {
    let transportManager = yield Agent.searchSkill('registerTransports');

    return Agent.request(transportManager[0].agent, 'registerTransports', {type: 'HandlingRobot', workingArea: '1000-2000'})
      .then(function(result){
        if(result.err) {
          throw new Error(result.err);
        } else {
          console.log(result);
        }
      });
  };

  co(function* (){
    yield retry(register, {factor: 1});
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
