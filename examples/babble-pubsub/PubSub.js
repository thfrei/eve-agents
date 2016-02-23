"use strict";

process.env.DEBUG = 'develop';

const _ = require('lodash');
const babble = require('babble');
const develop = require('debug')('develop');
const Promise = require('bluebird');
const co = require('co');
const retry = require('co-retry');
let GeneralAgent = require('./../../agents/GeneralAgent');

var agentOptions = {
  //id: 'BuyerPromises',
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

  Agent.skillAdd('subscribe', (params, sender) => {
    if( !Agent.subscriptions ) {
      Agent.subscriptions = [];
    }

    // Add caller to array
    Agent.subscriptions.push({topic: params.topic, agent: sender});
    console.log('Active subscriptions', Agent.subscriptions);
    return {status: 'ok', description: 'added to topic'+params.topic};
  });
  Agent.register();

  co(function* () {
    let subscribeAgents = yield Agent.searchSkill('subscribe');

    // Subscribe
    Agent.request(subscribeAgents[0].agent, 'subscribe', {topic: 'status'})
      .then(console.log);
    Agent.listen('sub-status')
      .listen( (message, context) => {
        console.log('new update on sub-status', message, context);
      });

    // Publish to all subscriptions
    setTimeout(function(){
      _.forEach(Agent.subscriptions, (sub) => {
        Agent.tell(sub.agent, 'sub-status')
          .tell('hallo welt');
      });
    },1000);

    console.log(subscribeAgents);
  }).catch(console.error);

  // deRegister upon exiting
  process.on('SIGINT', function(){
    console.log('taking down...');
    Agent.deRegister();
    setTimeout(process.exit, 500); // wait for deregistering complete
  });

}).catch(function(err){console.log('exe',err)});

