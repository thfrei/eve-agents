"use strict";

const config = require('./../../config.js');

const _ = require('lodash');
const babble = require('babble');
const develop = require('debug')('develop');
const Promise = require('bluebird');
const co = require('co');
const retry = require('co-retry');
const uuid = require('uuid-v4');
let GeneralAgent = require('./../../agents/GeneralAgent');

var agentOptions = {
  id: 'Order',
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

var Agent = new GeneralAgent(agentOptions);

Promise.all([Agent.ready]).then(function () {
  "use strict";

  Agent.register();

  // order
  let order = {};
  order.orderId = uuid();
  order.recipe = [
    {
      service: 'reserveMover',
      parameters: []
    },
    {
      service: 'containerInput',
      parameters: {
        bottleType: 'mi5cup'
      }
    },
    {
      service: 'fill',
      execute: true,
      parameters: {
        liquids: [{type: 'lemon', amount: 150}, {type: 'pineapple', amount: 150}]
      }
    },
    {
      service: 'unReserveMover',
      parameters: []
    },
    {
      service: 'containerOutput',
      parameters: {}
    }
  ];

  // Business Logic
  co(function* () {
    "use strict";
    // Negotiate every entry in recipe and find an agent
    let agents = yield _.map(order.recipe, negotiate);
    console.log('agents', agents);

    // Edges of network. Ways that we need to travel:
    let edges = computeEdges(agents);
    console.log('edges', edges);

    // Execute travel edges
    yield Promise.each(edges, co.wrap(function* (edge) { //wrap a generator function into a promise
      console.log('edgesforeach',edge);

      // Negotiate for transport agent:
      let task = yield negotiateTransportation(edge);
      console.log('negotiated task', task);
      let done = yield Agent.CArequest(task.agent, 'request-execute', {taskId: task.taskId});
      console.log('edge complete', done);

      // Now execute the main-task
      if(edge.to.execute) {
        let mainDone = yield Agent.CArequest(edge.to.agent, 'request-execute', {taskId: edge.to.taskId});
        console.log('mainDone', mainDone);
      }
      return Promise.resolve(done);
    }));
    console.log('HHHHHHHHUUUUUUUUURRRRRRRRRRAAAAAAAAAAAHHHHHHHHHHHHH!!!!!!!!!!!!');
    console.log('HHHHHHHHUUUUUUUUURRRRRRRRRRAAAAAAAAAAAHHHHHHHHHHHHH!!!!!!!!!!!!');
  }).catch(console.error);

  function negotiate (task) {
    let conversation = 'cfp-'+task.service;
    //let service = task.parameters;
    return cfpMinPrice(conversation, task);
  }

  function negotiateTransportation(edge) {
    return Agent.searchSkill('cfp-transport')
      .then((agents) => {
        return agents[0];
      })
      .then((reply) => {
        return Agent.CAcfpAcceptProposal(reply.agent, 'cfp-transport', edge);
      })
      .then((reply) => {
        return reply.inform;
      });
  }

  function computeEdges (agents) {
    let edges = [];
    for (let i = 0; i < agents.length; i++) {
      let edge = {};
      edge.from = agents[i];
      edge.to = agents[i+1];
      if( edge.to ) {
        edges.push(edge);
      }
    }
    return edges;
  }

  function cfpMinPrice (conversation, task) {
    "use strict";

    return co(function* () {
      "use strict";

      let participants = yield Agent.searchSkill(conversation);
      develop('participants for ', conversation, ': ', participants);

      // ask all participants for objective
      let propositions = yield Promise.all(_.map(participants, (participant) => {
        return Agent.CAcfp(participant.agent, conversation, task.parameters);
      }));
      console.log('propositions', propositions);

      // Filter refused cfps
      _.remove(propositions, (prop) => { if(prop.refuse) { return true; }});
      develop('clean propositions', propositions);

      // Get offer with lowest price
      let bestOffer = _.minBy(propositions, (offer) => {return offer.price});
      if(typeof bestOffer == 'undefined') {
        console.log(task.parameters,' is not available, nowhere');
      } else {
        console.log('bestOffer', bestOffer);

        // Tell participant with bestoffer to reserve
        let inform = yield Agent.CAcfpAcceptProposal(bestOffer.agent, conversation, task.parameters);
        console.log(inform);

        let agent = {taskId: inform.informDone.taskId, agent: bestOffer.agent};
        if(task.execute) {
          agent.execute = task.execute;
        }
        return agent;
      }
    });
  }

  // deRegister upon exiting
  process.on('SIGINT', function(){
    console.log('taking down...');
    Agent.deRegister();
    setTimeout(process.exit, 500); // wait for deregistering complete
  });
}).catch(function(err){console.log('exe',err)});

