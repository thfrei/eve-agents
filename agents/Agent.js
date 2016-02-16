"use strict";

const babble = require('babble');
const develop = require('debug')('develop');
const Promise = require('bluebird');
const co = require('co');
const retry = require('co-retry');
let GeneralAgent = require('./../agents/GeneralAgent');

function Agent(options) {
  // Add default transport protocol
  if ( !options.transport ) {
    options.transports = [
      {
        type: 'amqp',
        url: 'amqp://localhost'
        //host: 'dev.rabbitmq.com'
      }
    ];
  }

  //GeneralAgent.call(this, options);
  this.agent = new GeneralAgent(options);
}

Agent.prototype.execute = function(func) {
  var self = this;

  function takeDown(){
    // extra function is needed for closure on event
    console.log('taking down');
    self.agent.deRegister();
    process.exit();
  }

  Promise.all([self.agent.ready]).then(function () {
    // Tell how to take Down
    process.on('SIGINT', takeDown);
    process.on('uncaughtException', takeDown);

    func();

  }).catch(function(err){console.log('afterReady',err)});
};

module.exports = Agent;