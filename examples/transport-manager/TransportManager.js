"use strict";

process.env.DEBUG = 'develop';

const _ = require('lodash');
const babble = require('babble');
const develop = require('debug')('develop');
const Promise = require('bluebird');
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

Agent.position = [];
Agent.transportAgents = [];

Promise.all([Agent.ready]).then(function () {
  Agent.events.on('registered',console.log);

  Agent.skillAdd('registerTransports', (params, sender) => {
    develop('registerTransports called', params, sender);

    Agent.transportAgents.push({agent: sender, type: params.type, workingArea: params.workingArea});

    console.log('all registered transport agents:', Agent.transportAgents);

    return {ok: 'agent was registered'};
  });
  Agent.skillAdd('deRegisterTransports', (params, sender) => {
    develop('deRegisterTransports called', params, sender);
    _.remove(Agent.transportAgents, {agent: sender});
    console.log('all registered transport agents:', Agent.transportAgents);
    return {ok: 'agent was probably deleted'};
  }); // TODO implement

  Agent.skillAdd('cfp-transport', ''); // TODO implement negotiation
  Agent.skillAdd('exe-transport', ''); // TODO implenent execution

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
