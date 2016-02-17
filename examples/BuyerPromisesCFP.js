"use strict";

process.env.DEBUG = 'develop';

const _ = require('lodash');
const babble = require('babble');
const develop = require('debug')('develop');
const Promise = require('bluebird');
const co = require('co');
const retry = require('co-retry');
let GeneralAgent = require('./../agents/GeneralAgent');

var agentOptions = {
  id: 'BuyerPromises',
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
  Agent.events.on('registered',develop);
  // Register Skills
  Agent.register();

  function cfpRefuseOrPropose() {
    var res = '';
    return new Promise( (resolve, reject) => {
      Agent.events.on('refuse', function(){
        res = 'refused';
        console.log(res);
        resolve(res);
      });
      Agent.events.on('propose', function(){
        res = 'proposed';
        console.log(res);
        resolve(res);
      });
    });
  }

  /**
   * it _cannot_ work, since the seller will make a return call before the event listener will be registered.
   */

  Agent.skillAdd('refuse', (params, sender) => {
    Agent.events.emit('refuse', '');
  });           // buyer
  Agent.skillAdd('propose', (params, sender) => {
    Agent.events.emit('propose', '');
  });          // buyer

  co(function* (){
    let sellers = yield Agent.searchSkill('sell');
    console.log(sellers);
    let cfpAnswer = yield Agent.request(sellers[0].agent, 'cfp', {title: 'Harry Potter'});
    console.log(cfpAnswer);

    let answer = yield cfpRefuseOrPropose();
    if (cfpAnswer.propose) {

    }
  });

  // deRegister upon exiting
  process.on('SIGINT', function(){
    console.log('taking down...');
    Agent.deRegister();
    setTimeout(process.exit, 500); // wait for deregistering complete
  });

}).catch(function(err){console.log('exe',err)});

