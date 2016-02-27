"use strict";

process.env.DEBUG = 'develop';

const _ = require('lodash');
const babble = require('babble');
const develop = require('debug')('develop');
const Promise = require('bluebird');
const co = require('co');
const retry = require('co-retry');
const uuid = require('uuid-v4');
let GeneralAgent = require('./../../agents/GeneralAgent');

var agentOptions = {
  id: 'Order1',
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
  "use strict";

  // order
  let order = {};
  order.orderId = uuid();
  order.recipe = [
    {
      service: 'bottleInput',
      parameters: {
        bottleType: 'longneck', size: 300
      }
    },
    //{
    //  service: 'print',
    //  parameters: {
    //    logo: '1.gif',
    //    bottleType: 'longneck', size: 300
    //  }
    //},
    {
      service: 'fill',
      parameters: {
        liquids: [{type: 'lemonade', amount: 150}, {type: 'weissbier', amount: 150}]
      }
    },
    //{
    //  service: 'close',
    //  parameters: {
    //    bottletype: 'longneck'
    //  }
    //},
    {
      service: 'bottleOutput',
      parameters: {
        size: 300
      }
    }
  ];

  co(function* () {
    "use strict";

    // Negotiate every entry in recipe and find an agent
    let agents = yield _.map(order.recipe, negotiate);
    console.log('agents', agents);
    // Edges of network. Ways that we need to travel:
    let edges = computeEdges(agents);
    console.log('edges', edges);
    // Execute edges
    //_.forEach(edges, (edge) => {
    edges.forEach( function* (edge) {
      console.log('edgesforeach',edge);
      // Negotiate for transport agent:
      let task = yield negotiateTransportation(edge);
      console.log('task', task);
      yield Agent.CArequest(task.agent, 'request-dispatch', task.taskId);

    });
  }).catch(console.error);

  function negotiate (service) {
    let conversation = 'cfp-'+service.service;
    let objective = service.parameters;
    return cfpMinPrice(conversation, objective);
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

  function cfpMinPrice (conversation, objective) {
    "use strict";

    return co(function* () {
      "use strict";

      let participants = yield Agent.searchSkill(conversation);
      develop('participants for ', conversation, ': ', participants);

      // ask all participants for objective
      let propositions = yield Promise.all(_.map(participants, (participant) => {
        return Agent.CAcfp(participant.agent, conversation, objective);
      }));
      console.log('propositions', propositions);

      // Filter refused cfps
      _.remove(propositions, (prop) => { if(prop.refuse) { return true; }});
      develop('clean propositions', propositions);

      // Get offer with lowest price
      let bestOffer = _.minBy(propositions, (offer) => {return offer.price});
      if(typeof bestOffer == 'undefined') {
        console.log(objective,' is not available, nowhere');
      } else {
        console.log('bestOffer', bestOffer);

        // Tell participant with bestoffer to reserve
        let inform = yield Agent.CAcfpAcceptProposal(bestOffer.agent, conversation, objective);
        console.log(inform);

        let agent = {taskId: inform.informDone.taskId, agent: bestOffer.agent};
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

