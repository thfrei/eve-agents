"use strict";

process.env.DEBUG = 'develop';

const _ = require('lodash');
const babble = require('babble');
const develop = require('debug')('develop');
const Promise = require('bluebird');
const co = require('co');
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

Promise.all([Agent.ready]).then(function () {
  Agent.events.on('registered',console.log);

  // Register Skills
  Agent.register()
    .catch(console.log);

  // TODO register at the Transport manager
  co(function* () {
    let transportManager = yield Agent.searchSkill('registerTransports');
    console.log(transportManager);

    _.forEach(transportManager, (tM) => {
      Agent.request(tM.agent, 'registerTransports', {type: 'HandlingRobot'})
        .then(function(result){
          console.log(result);
        });
    });

  }).catch(console.error);

  // deRegister upon exiting
  process.on('SIGINT', function(){
    console.log('taking down...');
    Agent.deRegister();
    setTimeout(process.exit, 500); // wait for deregistering complete
  });

}).catch(function(err){console.log('exe',err)});
