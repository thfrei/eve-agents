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

  // Add subscribe skill
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

  let sub = co(function* () {
    let subscribeAgents = yield Agent.searchSkill('subscribe');

    // Subscribe to itself
    Agent.request(subscribeAgents[0].agent, 'subscribe', {topic: 'status'})
      .then(console.log);
    Agent.listen('sub-status')
      .listen( (message, context) => {
        console.log('new update on sub-status', message, context);
      });

    console.log(subscribeAgents);
  }).catch(console.error);

  let publish = co(function* () {
      // Publish to all subscriptions (only itself in this case)
    setInterval(function(){
      _.forEach(Agent.subscriptions, (sub) => {
        Agent.tell(sub.agent, 'sub-status')
          .tell('hallo welt');
      });
    },1000);
  }).catch(console.error);



  // deRegister upon exiting
  process.on('SIGINT', function(){
    console.log('taking down...');
    Agent.deRegister();
    setTimeout(process.exit, 500); // wait for deregistering complete
  });

}).catch(function(err){console.log('exe',err)});

